-- ============================================
-- terms_agreement: 이용약관 / 개인정보처리방침 동의 시점 기록
-- ============================================
-- 한국 PIPA(개인정보보호법) 및 Apple/Google 정책 요구사항.
-- 약관 개정 시 신규 컬럼(예: terms_agreed_at_v2) 추가 또는 별도
-- terms_versions 테이블로 확장.
-- ============================================

alter table users
  add column if not exists terms_agreed_at timestamptz,
  add column if not exists privacy_agreed_at timestamptz;

comment on column users.terms_agreed_at is '이용약관 동의 시점 (NULL이면 미동의 — 앱 진입 차단)';
comment on column users.privacy_agreed_at is '개인정보 수집·이용 동의 시점 (NULL이면 미동의)';
