-- ============================================
-- search_miss: 검색했지만 DB에 없던 술 기록
-- ============================================
-- 용도: 관리자가 자주 검색되는 미등록 술을 보고 큐레이션
-- 집계 쿼리 예:
--   select query, count(*) from search_miss
--   group by query
--   order by count(*) desc
--   limit 50;
-- ============================================

create table if not exists search_miss (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists search_miss_query_idx on search_miss (query);
create index if not exists search_miss_created_at_idx on search_miss (created_at desc);

-- RLS: 누구나 insert 가능 (로그인/미로그인 무관)
alter table search_miss enable row level security;

drop policy if exists "anyone can insert search miss" on search_miss;
create policy "anyone can insert search miss"
  on search_miss for insert
  to authenticated, anon
  with check (true);

-- 조회는 본인만 (관리자는 service role로 별도 조회)
drop policy if exists "users can read own miss" on search_miss;
create policy "users can read own miss"
  on search_miss for select
  to authenticated
  using (user_id = auth.uid() or user_id is null);
