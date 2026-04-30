// 주종 아이콘 — 라인 톤 통일 (MaterialCommunityIcons 우선)
//
// 모든 주종 선택/필터/리스트에서 동일한 아이콘을 쓰기 위한 단일 source-of-truth.
// 화면별로 색상·크기는 자유롭게, 아이콘 셋과 이름은 여기서만 정의.

import type { DrinkCategory } from '../types';
import type { IconSet } from '../components/Icon';

export interface CategoryIcon {
  set: IconSet;
  name: string;
}

export const CATEGORY_ICONS: Record<DrinkCategory, CategoryIcon> = {
  soju:      { set: 'mci', name: 'bottle-tonic-outline' },
  beer:      { set: 'mci', name: 'beer-outline' },
  makgeolli: { set: 'mci', name: 'bowl-mix-outline' },
  wine:      { set: 'mci', name: 'glass-wine' },
  whiskey:   { set: 'mci', name: 'glass-tulip' },
  spirits:   { set: 'mci', name: 'glass-cocktail' },
  etc:       { set: 'mci', name: 'glass-mug-variant' },
};

export function getCategoryIcon(category: DrinkCategory): CategoryIcon {
  return CATEGORY_ICONS[category] ?? CATEGORY_ICONS.etc;
}
