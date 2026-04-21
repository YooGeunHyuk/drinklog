// DRINKLOG (주로) — Icon Wrapper
//
// lucide-react-native을 기본 아이콘 셋으로 사용.
// 향후 디자인 확정 시 여기서만 라이브러리를 교체하면 됨.
//
// 사용 예:
//   <Icon name="Plus" size={20} color={colors.textPrimary} />
//
// 이모지 → 아이콘 점진적 교체 전략:
//   1) 현재 이모지 UI는 유지 (🔥, 🍺 등 무드 중심)
//   2) 기능 버튼(추가/편집/삭제/설정)부터 아이콘으로 전환
//   3) 주종 카테고리는 디자인 확정 시 커스텀 SVG 고려

import React from 'react';
import * as LucideIcons from 'lucide-react-native';
import type { LucideProps } from 'lucide-react-native';
import { colors } from '../theme/colors';

// lucide-react-native은 `icons` 맵을 export하지 않으므로
// 전체 모듈을 namespace로 import해서 이름으로 lookup한다.
type LucideModule = typeof LucideIcons;
export type IconName = {
  [K in keyof LucideModule]: LucideModule[K] extends React.ComponentType<LucideProps> ? K : never;
}[keyof LucideModule];

export interface IconProps extends Omit<LucideProps, 'ref'> {
  /** lucide 아이콘 이름 (PascalCase). 예: 'Plus', 'Home', 'Settings' */
  name: IconName;
  /** 크기 (px). 기본 20 */
  size?: number;
  /** 색상. 기본 textPrimary */
  color?: string;
  /** 선 두께. 기본 2 */
  strokeWidth?: number;
}

/**
 * Lucide 아이콘 단일 wrapper.
 * 이름 오타 방지 + 기본값 주입 + 테마 컬러 연동.
 */
export function Icon({
  name,
  size = 20,
  color = colors.textPrimary,
  strokeWidth = 2,
  ...rest
}: IconProps) {
  const LucideIcon = (LucideIcons as unknown as Record<string, React.ComponentType<LucideProps> | undefined>)[name as string];
  if (!LucideIcon) {
    if (__DEV__) {
      console.warn(`[Icon] Unknown lucide icon: "${String(name)}"`);
    }
    return null;
  }
  return <LucideIcon size={size} color={color} strokeWidth={strokeWidth} {...rest} />;
}

export default Icon;
