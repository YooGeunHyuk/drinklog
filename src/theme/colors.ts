// DRINKLOG (주로) — Color Tokens
//
// 구조:
//   palette  — 순수 컬러 (색상표 자체)
//   colors   — 의미 기반 토큰 (앱에서 실제로 쓰는 것)
//
// 톤 기조: 다크 + 골드 베이스 + Earth-tone 액센트
// (Claude Design에서 확정된 값이 나오면 palette 값만 교체하면 됨.
//  colors(의미 토큰)는 palette를 참조하므로 자동 전파.)

// ── PALETTE (원색상표) ────────────────────────────────────────
export const palette = {
  // Brand: Amber / Gold (위스키·꿀 톤) — 핵심 기조
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

  // ── Earth-tone 액센트 팔레트 ─────────────────────────────
  // 다크 베이스 위에 따뜻한 자연색 액센트로 깔리는 보조 팔레트.
  // 카드/뱃지/상태/카테고리 등 "분위기를 입힐 자리"에 사용.
  cream:        '#FFF3E3', // 아이보리 — 강조/거품/포인트
  peach:        '#F4D3C0', // 피치 — 따뜻한 강조, 위스키 연관
  rose:         '#E5B0A0', // 더스티 핑크 — spirits, soft warm
  terracotta:   '#D28378', // 테라코타 — error/wine/무너지다
  sage:         '#C7CEA4', // 세이지 — success/회복/소주
  olive:        '#8E8E6C', // 올리브 — 막걸리/대지
  taupe:        '#A3917B', // 토프 — 따뜻한 보조 텍스트
  mist:         '#DAE2E2', // 페일 블루-그레이 — info/cool
  coolGray:     '#A9AFB4', // 쿨 그레이
  neutralGray:  '#9A9EA1', // 뉴트럴 그레이

  // 주종 (카테고리) — Earth-tone 매핑
  categorySoju:       '#C7CEA4', // sage — 깨끗한 곡주
  categoryBeer:       '#F4D3C0', // peach — 부드러운 거품 톤
  categoryMakgeolli:  '#A3917B', // taupe — 곡식/탁한 흰빛
  categoryWine:       '#D28378', // terracotta — 깊은 와인색
  categoryWhiskey:    '#D4A574', // amber400 — 메인 골드 유지
  categorySpirits:    '#E5B0A0', // rose — 따뜻한 분홍
  categoryEtc:        '#A9AFB4', // coolGray

  // 상태 — Earth 톤으로 부드럽게
  success: '#C7CEA4', // sage
  warning: '#F4D3C0', // peach
  error:   '#D28378', // terracotta
  info:    '#DAE2E2', // mist
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

  // 텍스트 — 따뜻한 톤으로 살짝 이동
  textPrimary:   palette.white,
  textSecondary: palette.taupe,        // 따뜻한 토프 (was gray300)
  textTertiary:  palette.coolGray,     // 쿨 그레이 (was gray500)
  textInverse:   palette.gray950,

  // 상태 (Earth 톤)
  success: palette.success,
  warning: palette.warning,
  error:   palette.error,
  info:    palette.info,

  // ── Earth-tone 액센트 (카드/하이라이트/태그 등에 직접 사용) ──
  tone: {
    cream:       palette.cream,
    peach:       palette.peach,
    rose:        palette.rose,
    terracotta:  palette.terracotta,
    sage:        palette.sage,
    olive:       palette.olive,
    taupe:       palette.taupe,
    mist:        palette.mist,
    coolGray:    palette.coolGray,
    neutralGray: palette.neutralGray,
  },

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
