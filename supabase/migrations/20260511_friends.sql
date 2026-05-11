-- ============================================
-- friends + friend_code: 친구 시스템 v1
-- ============================================
-- 휴대폰 번호 직접 검색 대신 friend_code(8자리 영숫자)로 친구 추가.
-- PIPA 친화적이고 사용자가 본인 코드만 공유하면 됨.
-- ============================================

-- 1) users 테이블에 friend_code 컬럼 추가 ----------------

alter table users
  add column if not exists friend_code text unique;

-- 친구 코드 생성기 — 8자리 대문자+숫자, 충돌 시 재시도
create or replace function generate_friend_code() returns text
language plpgsql
as $$
declare
  code text;
  attempt int := 0;
begin
  loop
    -- A-Z, 0-9 중 8자리 (헷갈리는 O/0/I/1은 다음 단계에서 제외 고려)
    code := upper(substr(
      translate(encode(gen_random_bytes(8), 'base64'), '+/=', ''),
      1, 8
    ));
    if not exists (select 1 from users where friend_code = code) then
      return code;
    end if;
    attempt := attempt + 1;
    if attempt > 10 then
      raise exception 'Could not generate unique friend code';
    end if;
  end loop;
end;
$$;

-- 신규 user에 자동 부여 — trigger
create or replace function assign_friend_code() returns trigger
language plpgsql
as $$
begin
  if new.friend_code is null then
    new.friend_code := generate_friend_code();
  end if;
  return new;
end;
$$;

drop trigger if exists users_assign_friend_code on users;
create trigger users_assign_friend_code
  before insert on users
  for each row execute function assign_friend_code();

-- 기존 user backfill
update users set friend_code = generate_friend_code()
  where friend_code is null;

-- 2) friends 테이블 ----------------------------------

create table if not exists friends (
  id uuid primary key default gen_random_uuid(),
  -- 요청을 보낸 사용자 (또는 양방향 수락 후엔 한 쪽)
  user_id uuid not null references auth.users(id) on delete cascade,
  -- 요청을 받은 / 수락된 상대 사용자
  friend_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  -- 같은 페어 중복 방지 (단방향 row 1개만 존재)
  unique (user_id, friend_id),
  -- 본인을 친구로 추가 금지
  check (user_id <> friend_id)
);

create index if not exists friends_user_idx on friends (user_id, status);
create index if not exists friends_friend_idx on friends (friend_id, status);

-- 3) RLS 정책 ---------------------------------------

alter table friends enable row level security;

drop policy if exists "view own friend rows" on friends;
create policy "view own friend rows"
  on friends for select
  to authenticated
  using (user_id = auth.uid() or friend_id = auth.uid());

drop policy if exists "insert friend request" on friends;
create policy "insert friend request"
  on friends for insert
  to authenticated
  with check (user_id = auth.uid());

-- 받는 사람: pending → accepted/rejected
-- 보낸 사람: pending 취소 (rejected로 변경)
drop policy if exists "update friend status" on friends;
create policy "update friend status"
  on friends for update
  to authenticated
  using (
    (friend_id = auth.uid())
    or (user_id = auth.uid())
  )
  with check (
    (friend_id = auth.uid())
    or (user_id = auth.uid())
  );

drop policy if exists "delete own friendship" on friends;
create policy "delete own friendship"
  on friends for delete
  to authenticated
  using (user_id = auth.uid() or friend_id = auth.uid());

comment on table friends is '친구 관계. 단방향 row 1개 — pending 또는 accepted.';
comment on column users.friend_code is '친구 추가용 공개 코드 (8자리). 사용자가 SNS 등으로 공유.';
