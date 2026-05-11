# DRINKLOG 출시 전 체크리스트

> 코드 외에 **Supabase Dashboard / GitHub / 법무**에서 사용자가 직접 해야 하는 일들의 단일 목록.

---

## P0 — 코드 작업 (완료)

| # | 항목 | Commit | 상태 |
|---|---|---|:-:|
| 1 | 만 19세 검증 필수화 (출생연도 강제, 건너뛰기 제거) | [`3d5774d`](https://github.com/YooGeunHyuk/drinklog/commit/3d5774d) | ✅ |
| 2 | Supabase 키 환경변수 분리 (`EXPO_PUBLIC_*`) | [`41c6a78`](https://github.com/YooGeunHyuk/drinklog/commit/41c6a78) | ✅ |
| 3 | 회원 탈퇴 Edge Function + Settings 진입점 | [`682d4ed`](https://github.com/YooGeunHyuk/drinklog/commit/682d4ed) | ✅ |
| 4 | 이용약관/개인정보 동의 흐름 (placeholder 본문) | [`a2f9746`](https://github.com/YooGeunHyuk/drinklog/commit/a2f9746) | ✅ |

---

## P0 — 사용자 직접 작업 (미완료)

### A. PR 머지 + Default branch 정리

- [ ] [PR #2](https://github.com/YooGeunHyuk/drinklog/pull/2) GitHub UI에서 **"Create a merge commit"** 으로 머지
- [ ] 머지 시 "Delete branch" 체크 → `feat/design-system` origin 자동 정리
- [ ] **Default branch 변경**: GitHub Settings > Branches > Default branch → `master` → `main`
  - 또는 터미널에서: `gh repo edit --default-branch main`
- [ ] 로컬 정리:
  ```bash
  git checkout main && git pull
  git branch -D feat/design-system
  ```

### B. Supabase 배포 작업

- [ ] **마이그레이션 4개 적용**:
  ```bash
  supabase db push
  ```
  특히 새로 추가된 `20260511_terms_agreement.sql`가 적용되어야 함 (`terms_agreed_at`, `privacy_agreed_at` 컬럼).

- [ ] **`delete-account` Edge Function 배포**:
  ```bash
  supabase functions deploy delete-account
  ```
  배포 안 하면 회원 탈퇴 버튼 누를 때 404 에러. service role key는 Supabase가 자동 주입하므로 별도 secret 등록 불필요.

### C. Supabase Dashboard — OTP Rate Limit (P0 #5)

> 휴대폰 OTP는 SMS 비용이 따라가서 (분당 $0.04~0.10/건), 악성 사용자가 폭주시키면 비용 폭탄 + 정상 사용자 차단. 출시 전 반드시 가드.

**위치:** Dashboard → 프로젝트 → **Authentication → Rate Limits**

**권장 설정 (소규모 신규 앱 기준, 보수적):**

| 항목 | 권장값 | 메모 |
|---|---:|---|
| Rate limit for sending OTPs | **분당 5건 / IP** | 한 IP에서 분당 5회 이상 못 보냄 |
| Rate limit for token verifications | **시간당 30건** | 인증 시도 폭주 방지 |
| Number of new users per hour | **시간당 50건** | 봇 가입 방어 |
| Per-phone cooldown | **60초** (서버 단 기본) | 같은 번호로 1분에 1회까지 |

> 트래픽 늘어나면 천천히 완화. 처음엔 빡빡하게 시작.

**위치:** **Authentication → Providers → Phone**

- [ ] Phone provider 활성화 확인 (SMS 제공자 — Twilio / MessageBird / Vonage 등)
- [ ] SMS 비용 예산 알람 등록 (Supabase Settings > Billing)
- [ ] 발신자 표시명·문구가 한국어로 보내지는지 확인

**선택 — CAPTCHA 통합 (강력 권장):**

봇으로 OTP 폭주시키는 공격에 가장 효과적. Cloudflare Turnstile 또는 hCaptcha 무료.

- [ ] Dashboard → Authentication → Auth Settings → **Enable Captcha protection**
- [ ] Turnstile 사이트 키 받아서 등록 (https://www.cloudflare.com/products/turnstile)
- [ ] 클라이언트에서 captcha token을 `signInWithOtp({ captchaToken })`에 함께 전달
  - 단, 이건 LoginScreen 코드 변경 필요 — 별도 작업으로

### D. 약관 본문 교체

- [ ] [src/constants/termsContent.ts](../src/constants/termsContent.ts)의 `TERMS_OF_SERVICE`·`PRIVACY_POLICY` placeholder를 **법무 검토를 거친 실제 본문**으로 교체
- [ ] `TERMS_VERSION`·`PRIVACY_VERSION` 문자열을 `1.0` 등으로 업데이트
- [ ] 약관 v1 적용 후엔 향후 개정 시점에 `users.terms_version` 같은 컬럼을 추가해 재동의 흐름을 만드는 게 좋음 (v2 마이그레이션에서 검토)

> PIPA·정보통신망법상 필수 항목:
> - 이용약관: 서비스 정의 / 가입·해지 / 회원의 의무 / 책임 제한 / 분쟁 해결 / 시행일
> - 개인정보처리방침: 수집 항목 / 이용 목적 / 보유 기간 / 제3자 제공 / 처리 위탁 / 정보주체 권리 / 안전성 확보 조치 / 개인정보 보호책임자

---

## P1 — 권장 (출시 가능하지만 있으면 안전)

- [ ] 클라이언트 단 OTP cooldown 60초 (LoginScreen에서 재요청 버튼 비활성화 + 타이머 표시)
- [ ] Sentry 또는 동급 크래시 추적 도입
- [ ] PostHog/Amplitude 같은 분석 (어떤 탭이 죽어있는지 알아야 자랑 코어 우선순위 판단 가능)
- [ ] 데이터 내보내기 (CSV/JSON) — PIPA 열람권 충족
- [ ] Push 알림 (`expo-notifications`) — 자랑 코어 #3 마일스톤 푸시에서도 사용

---

## P2 — 출시 후

- [ ] Edge Function 모니터링 / 알람 (delete-account 실패율 등)
- [ ] Supabase backup 정책 확인 (PITR 또는 daily snapshot)
- [ ] iOS App Store / Google Play 등록 (앱 아이콘 픽셀 정합, 스크린샷, 약관·정책 링크)
- [ ] 마케팅 동의 user에게만 푸시 (PIPA 마케팅 수신 동의 분리)

---

## 머지 후 후속 작업 — 자랑 코어 (C)

P0 가드레일 통과 후 본격적인 차별화. 자세한 내용은 conversation history의 "자랑 코어 갭 분석" 참고. 추천 진입 순서:

1. **공유 카드 v1** — 친구 시스템 없이도 작동, viral 진입점 (2~3일)
2. **친구 시스템** — 휴대폰 매칭 + 양방향 수락 (4~5일)
3. **친구 랭킹** — 양/빈도/다양성/사치/강도/소셜 6축 비교 (3~4일)
4. **마일스톤 푸시** — `expo-notifications` (2~3일)
5. **회식 모드** — companions N:N 확장 (2~3일)
6. **연말결산 Wrapped** — 12월 출시 (5~7일)
