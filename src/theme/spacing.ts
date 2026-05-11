// DRINKLOG (주로) — Spacing & Border Radius
//
// 모바일 UI 스케일. 4의 배수를 기본으로.

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export type Spacing = keyof typeof spacing;
export type BorderRadius = keyof typeof borderRadius;
