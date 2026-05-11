-- ============================================
-- public.users RLS 확장: 친구의 nickname/friend_code 읽기 허용
-- ============================================
-- 기존 users_select_own 정책은 본인 row만 SELECT 허용.
-- 그래서 친구 시스템에서 친구 nickname을 읽을 수 없어 모두 "익명" 표시.
--
-- 이 마이그레이션은 새 SELECT 정책을 추가해 친구 관계인 사람의 row를
-- 추가로 읽을 수 있게 한다. RLS는 multiple policy → OR 결합.
--
-- 노출되는 데이터: nickname, friend_code (+ id). client 코드는 그 외 컬럼
-- (phone 등 PII) 가져가지 않음. 추후 보안 강화 필요 시 view 또는
-- SECURITY DEFINER function으로 column-level 통제 전환 권장.
-- ============================================

drop policy if exists "users_select_friends" on users;

create policy "users_select_friends"
on users for select
to authenticated
using (
  exists (
    select 1 from friends f
    where (f.user_id = auth.uid() and f.friend_id = users.id)
       or (f.friend_id = auth.uid() and f.user_id = users.id)
  )
);
