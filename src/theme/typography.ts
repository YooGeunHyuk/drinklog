// DRINKLOG (주로) — Typography Tokens
//
// Pretendard Variable을 한글/영문 기본으로. 숫자는 정확히 같은 폰트.
// 폰트 로딩은 App.tsx의 useFonts 훅에서 수행.

/** 폰트 패밀리 — expo-font로 로드된 이름과 일치시킬 것 */
export const fontFamily = {
  /** 본문·UI 전반에 사용하는 한글/영문 겸용 */
  base: 'Pretendard',
  /** 숫자·데이터 강조용 (동일 폰트, 필요 시 tabular 변형) */
  mono: 'Pretendard',
} as const;

/** 크기 (px 단위) — 현재 값 유지 + 시맨틱 이름 보강 */
export const fontSize = {
  // 숫자 인덱스 (backward compat)
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 28,
  title: 34,
};

/** 시맨틱 타이포 — Claude Design 결과 반영 시 사용 */
export const typography = {
  displayLg:  { size: 34, weight: '700' as const, lineHeight: 40, family: fontFamily.base },
  displayMd:  { size: 28, weight: '700' as const, lineHeight: 34, family: fontFamily.base },
  headingLg:  { size: 22, weight: '700' as const, lineHeight: 28, family: fontFamily.base },
  headingMd:  { size: 20, weight: '600' as const, lineHeight: 26, family: fontFamily.base },
  headingSm:  { size: 17, weight: '600' as const, lineHeight: 22, family: fontFamily.base },
  bodyLg:     { size: 17, weight: '400' as const, lineHeight: 24, family: fontFamily.base },
  bodyMd:     { size: 15, weight: '400' as const, lineHeight: 22, family: fontFamily.base },
  bodySm:     { size: 13, weight: '400' as const, lineHeight: 18, family: fontFamily.base },
  caption:    { size: 11, weight: '400' as const, lineHeight: 16, family: fontFamily.base },
  label:      { size: 13, weight: '600' as const, lineHeight: 18, family: fontFamily.base },
  number:     { size: 22, weight: '700' as const, lineHeight: 28, family: fontFamily.mono },
};

export type FontSize = keyof typeof fontSize;
export type TypographyKey = keyof typeof typography;
