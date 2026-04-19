-- ============================================
-- drink_request: 사용자가 "이 술 등록해주세요" 요청한 목록
-- ============================================
-- 플로우:
--   1) 사용자: 검색 실패 후 "등록 요청" 제출
--   2) 관리자: 요청 검토 → 승인하면 drink_catalog 에 삽입, catalog_id 연결, status='approved'
--   3) 사용자: 본인이 요청한 것 상태 조회 가능
-- ============================================

create table if not exists drink_request (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,

  -- 사용자가 입력한 원본
  name text not null,
  brand text,
  category text, -- soju|beer|makgeolli|wine|whiskey|spirits|etc — 선택 (모르면 null)
  abv numeric,
  volume_ml integer,
  origin text,
  note text, -- "이 술 꼭 등록해주세요" 등 자유 메모

  -- 상태
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  admin_note text, -- 관리자가 반려 사유 등 남김
  approved_catalog_id uuid references drink_catalog(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,

  created_at timestamptz default now()
);

create index if not exists drink_request_status_idx on drink_request (status, created_at desc);
create index if not exists drink_request_user_idx on drink_request (user_id, created_at desc);
create index if not exists drink_request_name_idx on drink_request (lower(name));

-- ── RLS ──
alter table drink_request enable row level security;

-- 누구나 (로그인 유저) insert 가능
drop policy if exists "authenticated can insert request" on drink_request;
create policy "authenticated can insert request"
  on drink_request for insert
  to authenticated
  with check (user_id = auth.uid());

-- 본인이 요청한 것만 select (관리자는 service role 로 별도 조회)
drop policy if exists "users read own request" on drink_request;
create policy "users read own request"
  on drink_request for select
  to authenticated
  using (user_id = auth.uid());

-- 본인이 요청한 것만 삭제 (status=pending 일 때만)
drop policy if exists "users delete own pending" on drink_request;
create policy "users delete own pending"
  on drink_request for delete
  to authenticated
  using (user_id = auth.uid() and status = 'pending');

-- 관리자(= ADMIN_USER_IDS 에 있는 auth.uid() — 여기서는 테이블 기반으로 승격)
-- MVP 에서는 클라이언트의 admin.ts 화이트리스트에 의존하므로
-- admin 이 요청을 select/update 할 수 있게 별도 policy 를 둠.
-- drink_catalog_admin 테이블로 분리하는 건 TODO.

create table if not exists app_admin (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);
alter table app_admin enable row level security;
-- 본인이 admin 인지 확인은 되되, 삽입/삭제는 service_role 로만
drop policy if exists "admin can read own admin row" on app_admin;
create policy "admin can read own admin row"
  on app_admin for select
  to authenticated
  using (user_id = auth.uid());

-- admin 은 모든 request 조회 가능
drop policy if exists "admin reads all requests" on drink_request;
create policy "admin reads all requests"
  on drink_request for select
  to authenticated
  using (exists (select 1 from app_admin a where a.user_id = auth.uid()));

-- admin 은 request 를 update (승인/반려) 가능
drop policy if exists "admin updates requests" on drink_request;
create policy "admin updates requests"
  on drink_request for update
  to authenticated
  using (exists (select 1 from app_admin a where a.user_id = auth.uid()))
  with check (exists (select 1 from app_admin a where a.user_id = auth.uid()));

-- ============================================
-- 관리자 등록
-- 배포 후 본인 UID 는 서비스 롤로 한 번만 넣기:
--   insert into app_admin (user_id) values ('eec10c12-c716-4a04-a5f2-80ac1e4c89dd');
-- 이 마이그레이션에선 안전상 자동 삽입은 하지 않음. (수동 삽입)
-- ============================================
