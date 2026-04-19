-- ============================================
-- drink_log 확장: 장소 / 같이 마신 사람 / 기분 태그
-- ============================================

alter table drink_log add column if not exists location text;
alter table drink_log add column if not exists companions text;
alter table drink_log add column if not exists mood text;
  -- mood: 'alone' | 'casual' | 'party' | 'date' | 'business' | 'celebration' | null

-- photo_url 은 이미 있지만 혹시 없는 환경 대비
alter table drink_log add column if not exists photo_url text;

-- ============================================
-- Supabase Storage: drink-photos 버킷
-- ============================================
-- SQL 로 버킷 생성. 이미 있으면 conflict 무시.
insert into storage.buckets (id, name, public)
values ('drink-photos', 'drink-photos', true)
on conflict (id) do nothing;

-- ── Storage RLS 정책 ──
-- 경로 규칙: {user_id}/{timestamp}_{random}.jpg
-- 본인 폴더에만 업로드/조회/삭제 가능.
-- public = true 라 read 는 누구나 (프리사인 URL 없이 <Image source> 로 바로 표시 가능)

drop policy if exists "users upload own drink photos" on storage.objects;
create policy "users upload own drink photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'drink-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "users update own drink photos" on storage.objects;
create policy "users update own drink photos"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'drink-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "users delete own drink photos" on storage.objects;
create policy "users delete own drink photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'drink-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 공개 버킷이라 SELECT 정책은 기본 허용이지만, 명시적으로 한 번 더.
drop policy if exists "drink photos public read" on storage.objects;
create policy "drink photos public read"
  on storage.objects for select
  to public
  using (bucket_id = 'drink-photos');
