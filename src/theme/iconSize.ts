// DRINKLOG (주로) — Icon Size Scale
//
// 모든 아이콘(라인 아이콘 + 이모지)의 사이즈를 시맨틱 토큰으로 통일.
// 화면별로 제각각 16, 18, 20, 22, 24… 식으로 흩어진 값을 한곳에서 관리.
//
// 사용 가이드 (텍스트와 짝지을 때):
//   xs (14)  ↔ fontSize.sm  (13)  · 인라인 보조 (체크표시·자물쇠 등)
//   sm (18)  ↔ fontSize.lg  (17)  · 카드 안 인라인 아이콘, 텍스트 옆 작은 아이콘
//   md (22)  ↔ fontSize.xl  (20)  · 기본 — 칩, 리스트 행, 탭 바, 일반 버튼
//   lg (28)  ↔ fontSize.xxl (28)  · 카드 헤더, 섹션 강조, 큰 액션
//   xl (40)  —                    · 빈 상태(empty state) 중간
//   xxl (48) —                    · 빈 상태(empty state) 큰 placeholder
//
// 이모지에도 같은 스케일 적용 (Text의 fontSize 값으로 사용).

export const iconSize = {
  xs: 14,
  sm: 18,
  md: 22,
  lg: 28,
  xl: 40,
  xxl: 48,
} as const;

export type IconSize = keyof typeof iconSize;
