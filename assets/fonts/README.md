# Fonts

이 폴더에 Pretendard otf 파일을 넣어주세요.

## 다운로드
https://github.com/orioncactus/pretendard/tree/main/packages/pretendard/dist/public/static

필요한 가중치만 복사:
- Pretendard-Regular.otf
- Pretendard-Medium.otf
- Pretendard-SemiBold.otf
- Pretendard-Bold.otf

## 적용 방법
1. 위 파일을 이 폴더(`assets/fonts/`)에 복사
2. `src/theme/fonts.ts`의 `pretendardFontMap` 주석 해제
3. `App.tsx`에서 `useAppFonts()` 훅이 이미 호출되고 있으므로 자동 로드됨
4. `src/theme/typography.ts`의 `fontFamily.base`를 `'Pretendard-Regular'` 로 변경
