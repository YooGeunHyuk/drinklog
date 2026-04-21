// DRINKLOG (주로) — Color Tokens
//
// 구조:
//   palette  — 순수 컬러 (색상표 자체)
//   colors   — 의미 기반 토큰 (앱에서 실제로 쓰는 것)
//
// Claude Design에서 확정된 값이 나오면 palette 값만 교체하면 됨.
// colors(의미 토큰)는 palette를 참조하므로 자동 전파.

// ── PALETTE (원색상표) ────────────────────────────────────────
export const palette = {
  // Brand: Amber / Gold (위스키·꿀 톤)
  amber50:  '#FAF3E7',
  amber100: '#F2E3C9',
  amber200: '#E5C593',
  amber300: '#D8A971',
  amber400: '#D4A574', // Primary
  amber500: '#B8834A',
  amber600: '#8C6640',
  amber700: '#5C4128',
  gold500:  '#D4A343',

  // Neutrals (다크 기준)
  black:    '#000000',
  gray50:   '#F5F5F5',
  gray100:  '#E8E8E8',
  gray200:  '#C0C0C0',
  gray300:  '#A0A0A0',
  gray400:  '#808080',
  gray500:  '#666666',
  gray600:  '#444444',
  gray700:  '#333333',
  gray800:  '#2A2A2A',
  gray850:  '#252525',
  gray900:  '#1A1A1A',
  gray950:  '#0D0D0D',
  white:    '#FFFFFF',

  // 주종 (카테고리)
  categorySoju:       '#4FC3F7', // TODO: Claude Design 피드백 — 초록으로 교체 예정
  categoryBeer:       '#FFD54F',
  categoryMakgeolli:  '#E0E0E0',
  categoryWine:       '#EF5350',
  categoryWhiskey:    '#D4A574',
  categorySpirits:    '#AB47BC',
  categoryEtc:        '#78909C',

  // 상태
  success: '#4CAF50',
  warning: '#FF9800',
  error:   '#F44336',
  info:    '#2196F3',
};

// ── SEMANTIC TOKENS (의미 기반) ─────────────────────────────
// 앱에서 직접 쓰는 것. palette를 참조.
export const colors = {
  // 배경
  background:       palette.gray950,
  surface:          palette.gray900,
  surfaceLight:     palette.gray850,
  surfaceElevated:  palette.gray800,

  // 브랜드
  primary:      palette.amber400,
  primaryLight: palette.amber300,
  primaryDark:  palette.amber500,
  accent:       palette.gold500,

  // 텍스트
  textPrimary:   palette.white,
  textSecondary: palette.gray300,
  textTertiary:  palette.gray500,
  textInverse:   palette.gray950,

  // 상태
  success: palette.success,
  warning: palette.warning,
  error:   palette.error,
  info:    palette.info,

  // 주종별 (backward compat: category.soju 구조 유지)
  category: {
    soju:      palette.categorySoju,
    beer:      palette.categoryBeer,
    makgeolli: palette.categoryMakgeolli,
    wine:      palette.categoryWine,
    whiskey:   palette.categoryWhiskey,
    spirits:   palette.categorySpirits,
    etc:       palette.categoryEtc,
  },

  // 경계선
  border:  palette.gray700,
  divider: palette.gray800,

  // 반투명
  overlay: 'rgba(0, 0, 0, 0.6)',
};

export type AppColors = typeof colors;
