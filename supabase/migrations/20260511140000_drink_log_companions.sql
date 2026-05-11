-- ============================================
-- drink_log_companions: 음주 기록에 친구 태깅 (N:N)
-- ============================================
-- 기존 drink_log.companions (text) 는 그대로 둠 — 친구 아닌 동행자 자유 입력용.
-- 친구 시스템과 연결된 태깅은 이 테이블 사용. 자랑 톤 ("민수랑 N병 마심") 통계 기반.
--
-- 보안: 본인 drink_log의 태깅만 select/insert/delete. 단,
--      태그된 본인은 자기가 태그된 기록은 볼 수 있어야 자랑 톤 ("나도 그 자리에 있었어!").
-- ============================================

create table if not exists drink_log_companions (
  drink_log_id uuid not null references drink_log(id) on delete cascade,
  companion_user_id uuid not null references users(id) on delete cascade,
  tagged_at timestamptz not null default now(),
  primary key (drink_log_id, companion_user_id)
);

comment on table drink_log_companions is
  '음주 기록에 함께 마신 친구 태깅. drink_log:users = N:N.';
comment on column drink_log_companions.drink_log_id is
  '대상 음주 기록 (drink_log.id). 기록 삭제 시 CASCADE.';
comment on column drink_log_companions.companion_user_id is
  '태그된 친구 (users.id). 친구 계정 삭제 시 CASCADE.';

-- 인덱스: "내가 N번 태그됐다" 조회용 (drink_log_id 쪽은 PK가 커버)
create index if not exists drink_log_companions_companion_idx
  on drink_log_companions (companion_user_id);

-- ============================================
-- RLS
-- ============================================
alter table drink_log_companions enable row level security;

-- 1) SELECT — 본인 기록의 태깅 + 본인이 태그된 모든 기록
drop policy if exists "select own log tags or tagged in" on drink_log_companions;
create policy "select own log tags or tagged in"
on drink_log_companions for select
to authenticated
using (
  -- 본인이 기록 주인
  exists (
    select 1 from drink_log
    where drink_log.id = drink_log_companions.drink_log_id
      and drink_log.user_id = auth.uid()
  )
  -- 또는 본인이 태그된 경우
  or companion_user_id = auth.uid()
);

-- 2) INSERT — 본인 기록에만 태그 추가 가능
drop policy if exists "insert tag on own log" on drink_log_companions;
create policy "insert tag on own log"
on drink_log_companions for insert
to authenticated
with check (
  exists (
    select 1 from drink_log
    where drink_log.id = drink_log_companions.drink_log_id
      and drink_log.user_id = auth.uid()
  )
);

-- 3) DELETE — 본인 기록에서만 태그 제거 가능
drop policy if exists "delete tag on own log" on drink_log_companions;
create policy "delete tag on own log"
on drink_log_companions for delete
to authenticated
using (
  exists (
    select 1 from drink_log
    where drink_log.id = drink_log_companions.drink_log_id
      and drink_log.user_id = auth.uid()
  )
);
