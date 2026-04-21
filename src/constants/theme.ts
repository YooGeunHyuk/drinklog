// DRINKLOG (주로) — Legacy Theme Barrel (Backward Compat)
//
// 이 파일을 import하던 기존 15+ 파일의 경로를 깨지 않기 위해
// 새 구조(src/theme/)의 값을 그대로 재출구한다.
//
// ⚠️ 신규 파일에서는 `src/theme`(또는 '@/theme')을 직접 import 할 것.
// 이 경로는 마이그레이션이 끝나면 제거 예정.

export { colors, palette } from '../theme/colors';
export { spacing, borderRadius } from '../theme/spacing';
export { fontSize, fontFamily, typography } from '../theme/typography';
export { shadows } from '../theme/shadows';
