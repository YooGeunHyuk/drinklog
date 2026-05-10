# DRINKLOG (주로)

> 한국 음주 문화를 담는 음주 일지 앱. Expo + React Native + Supabase로 만들고 있어요.

## 주요 기능

- **기록**: 사진·메모·날씨·장소를 한 잔과 함께 기록
- **카탈로그**: 8천여 개의 한국·해외 주류 카탈로그, 라벨 스캔으로 자동 인식
- **레벨 시스템**: 누적 음주량·세션·연속·다양성 4축 점수로 99단계 진행
- **마일스톤**: 부피별(전역 34개, 주종별 47개) 재미있는 환산 비교
- **업적**: 101개 도전과제 (86 공개 + 15 숨김 이스터에그)
- **자동 캡처**: 위치(역지오코딩) + 날씨(Open-Meteo)

레벨/마일스톤/업적 전체 데이터는 [`docs/levels-milestones-achievements-final.md`](docs/levels-milestones-achievements-final.md) 참고.

## 기술 스택

| | |
|---|---|
| **앱** | Expo SDK 54 · React Native 0.81 · TypeScript |
| **내비게이션** | `@react-navigation/material-top-tabs` (하단 도킹 + 중앙 FAB) |
| **상태 / 데이터** | Supabase (Auth + Postgres + Storage + Edge Functions) |
| **UI** | lucide-react-native + @expo/vector-icons + 자체 Earth-tone 테마 |
| **테스트** | Jest + jest-expo |

## 셋업

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수
cp .env.example .env  # EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY 채우기
                       # Expo 빌드 시점에 EXPO_PUBLIC_* 변수가 인라인됨

# 3. iOS 또는 Android에서 실행
npm run ios      # iOS 시뮬레이터
npm run android  # Android 에뮬레이터
npm start        # Expo Go (실기기 QR)
```

## 개발 명령어

```bash
npm test           # 단위 테스트 1회 실행
npm run test:watch # 파일 변경 시 자동 재실행
npx tsc --noEmit   # 타입 체크 (CI에서 자동 실행)
```

## 폴더 구조

```
src/
├── components/   # 공용 컴포넌트 (Icon, InfoBubble 등)
├── constants/    # 마일스톤, 업적, 카탈로그 프리셋, 카테고리 아이콘
│   └── __tests__/  # 단위 테스트
├── hooks/        # 커스텀 훅
├── lib/          # supabase 클라이언트, AuthContext, storage 헬퍼
├── navigation/   # TabNavigator (탭 + FAB)
├── screens/      # 화면 (Home, Stats, Catalog, Add/Edit Drink 등)
├── theme/        # 컬러/아이콘사이즈/타이포 토큰
└── types/        # TypeScript 타입 정의

supabase/
├── functions/    # Edge Functions (Deno 런타임 — 앱 tsc에서 제외됨)
├── migrations/   # DB 스키마 마이그레이션
└── seeds/        # 초기 카탈로그 시드 데이터

docs/             # 디자인 브리프, 게이미피케이션 시스템 레퍼런스
```

## 브랜치 규칙

- `main` — 안정 트랙. PR로 머지.
- `feat/*` — 기능 브랜치. 작업 후 PR로 main에 머지.
- 커밋은 의미 단위로 작게 쪼개기 (논리적 한 가지 일 = 한 커밋).

## CI

GitHub Actions가 모든 push/PR마다 자동으로:
1. `npx tsc --noEmit` (타입 체크)
2. `npm test` (단위 테스트)

설정: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

## 라이선스 / 비고

개인 프로젝트. Supabase Edge Functions는 Deno 런타임이라 별도로 배포돼요 (`supabase functions deploy`).
