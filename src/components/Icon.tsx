// DRINKLOG (주로) — Icon Wrapper
//
// 여러 아이콘 라이브러리를 하나의 <Icon /> API로 통합한다.
// 톤(라인/아웃라인) 일관성을 위해 ▸ 모든 셋의 outline 변형을 우선 사용 ▸
// 라인 두께 ~1.75 기준으로 시각 무게를 맞춘다.
//
// 사용 예:
//   <Icon name="Plus" size={20} />                        // 기본 = lucide
//   <Icon set="ion" name="wine-outline" size={22} />      // Ionicons (iOS 결)
//   <Icon set="mci" name="glass-cocktail" size={22} />    // MaterialCommunityIcons (술 관련 풍부)
//   <Icon set="feather" name="plus" size={20} />          // Feather
//
// 라이브러리 선택 가이드:
// • UI 액션 (추가/편집/설정/뒤로가기) → lucide 또는 feather
// • 술/잔/병/안주/날씨/장소 → mci (MaterialCommunityIcons)  ← 가장 풍부
// • iOS 친화 표준 아이콘 → ion (Ionicons, *-outline 변형 권장)
// • 한국 모바일 친숙한 라인 → antd (AntDesign)
//
// 같은 화면 안에서는 가급적 한 셋(또는 lucide+mci 조합)으로 통일.

import React from 'react';
import * as LucideIcons from 'lucide-react-native';
import type { LucideProps } from 'lucide-react-native';
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
  Feather,
  FontAwesome5,
  AntDesign,
} from '@expo/vector-icons';
import type { StyleProp, TextStyle } from 'react-native';
import { colors } from '../theme/colors';

// ── 사용 가능한 아이콘 셋 ─────────────────────────────────────
export type IconSet =
  | 'lucide'    // lucide-react-native (기본) — 1,400+ 라인 아이콘
  | 'ion'       // Ionicons — *-outline 변형 권장
  | 'mci'       // MaterialCommunityIcons — 7,000+ (술/음식/날씨 풍부)
  | 'material'  // MaterialIcons (Google)
  | 'feather'   // Feather — lucide의 모태, 미니멀
  | 'fa5'       // FontAwesome 5
  | 'antd';     // AntDesign

// ── 타입 ──────────────────────────────────────────────────────
type LucideModule = typeof LucideIcons;
export type LucideIconName = {
  [K in keyof LucideModule]: LucideModule[K] extends React.ComponentType<LucideProps> ? K : never;
}[keyof LucideModule];

export interface IconProps {
  /** 아이콘 이름 (셋마다 명명 규칙 다름).
   *  - lucide / feather: PascalCase / kebab-case
   *  - ion: kebab-case + '-outline' 권장 (예: 'wine-outline')
   *  - mci: kebab-case (예: 'glass-cocktail')
   */
  name: string;
  /** 아이콘 셋. 기본 'lucide' */
  set?: IconSet;
  /** 크기 (px). 기본 20 */
  size?: number;
  /** 색상. 기본 textPrimary */
  color?: string;
  /** 선 두께 — lucide/feather 전용. 기본 1.75 (톤 통일용) */
  strokeWidth?: number;
  /** 추가 스타일 */
  style?: StyleProp<TextStyle>;
}

/**
 * 다중 아이콘 셋 통합 wrapper.
 * 톤 일관성을 위해 모든 셋에서 outline/line 계열을 우선 선택할 것.
 */
export function Icon({
  name,
  set = 'lucide',
  size = 20,
  color = colors.textPrimary,
  strokeWidth = 1.75,
  style,
}: IconProps) {
  switch (set) {
    case 'ion':
      return <Ionicons name={name as any} size={size} color={color} style={style} />;
    case 'mci':
      return <MaterialCommunityIcons name={name as any} size={size} color={color} style={style} />;
    case 'material':
      return <MaterialIcons name={name as any} size={size} color={color} style={style} />;
    case 'feather':
      return <Feather name={name as any} size={size} color={color} style={style} />;
    case 'fa5':
      return <FontAwesome5 name={name as any} size={size} color={color} style={style} />;
    case 'antd':
      return <AntDesign name={name as any} size={size} color={color} style={style} />;
    case 'lucide':
    default: {
      const LucideIcon = (LucideIcons as unknown as Record<
        string,
        React.ComponentType<LucideProps> | undefined
      >)[name];
      if (!LucideIcon) {
        if (__DEV__) {
          console.warn(`[Icon] Unknown lucide icon: "${name}". Did you mean another set?`);
        }
        return null;
      }
      return (
        <LucideIcon size={size} color={color} strokeWidth={strokeWidth} style={style as any} />
      );
    }
  }
}

export default Icon;
