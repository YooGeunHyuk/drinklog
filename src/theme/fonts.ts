// DRINKLOG (주로) — Pretendard Font Loader
//
// App.tsx 또는 루트에서 useAppFonts() 호출 → 로딩 완료 후 렌더.
// expo-font의 useFonts 훅을 래핑한 것.

import * as Font from 'expo-font';
import { useFonts } from 'expo-font';

/**
 * Pretendard Variable 웹폰트 (subset: Korean + Latin)
 *
 * 배포: orioncactus/pretendard (OFL)
 * 파일은 assets/fonts/ 에 두고 require()로 참조.
 * 다운로드: https://github.com/orioncactus/pretendard/tree/main/packages/pretendard/dist/public
 *
 * 필요한 가중치만 로드 (용량 절약)
 */
export const pretendardFontMap: Record<string, any> = {
  // 'Pretendard-Regular': require('../../assets/fonts/Pretendard-Regular.otf'),
  // 'Pretendard-Medium':  require('../../assets/fonts/Pretendard-Medium.otf'),
  // 'Pretendard-SemiBold': require('../../assets/fonts/Pretendard-SemiBold.otf'),
  // 'Pretendard-Bold':    require('../../assets/fonts/Pretendard-Bold.otf'),
};

/**
 * 앱 전역 폰트 로더.
 *
 * @returns [loaded, error] — loaded가 true가 되면 렌더 가능.
 *
 * 사용 예:
 *   const [loaded] = useAppFonts();
 *   if (!loaded) return <SplashScreen />;
 */
export function useAppFonts() {
  return useFonts(pretendardFontMap);
}

/**
 * 폰트 파일이 설치되지 않은 초기 상태에서도 앱이 동작하도록
 * 시스템 폰트로 폴백. 폰트 파일 추가 후 fontFamily.base = 'Pretendard-Regular'로 변경.
 */
export const FONT_LOAD_NOTICE = `
[Pretendard 폰트 적용 순서]
1. https://github.com/orioncactus/pretendard 에서 otf 파일 다운로드
2. assets/fonts/ 폴더에 Pretendard-*.otf 복사
3. src/theme/fonts.ts의 pretendardFontMap 주석 해제
4. App.tsx에서 useAppFonts() 호출 + loaded 가드
5. src/theme/typography.ts의 fontFamily.base를 'Pretendard-Regular' 로 변경
`.trim();
