// 도감 (Collection) — 마신 주류 종류 수집
// 로그에서 중복 제거해 드링크별 통계 생성

import { DrinkLog, DrinkCategory, DrinkCatalog } from '../types';

export interface CollectionEntry {
  catalog: DrinkCatalog;
  firstDrunk: string;    // ISO
  lastDrunk: string;     // ISO
  timesDrunk: number;    // 기록 횟수
  totalBottles: number;  // 누적 병 수
  totalMl: number;       // 누적 ml
}

/** 로그에서 고유 주류 엔트리 생성 */
export function buildCollection(logs: DrinkLog[]): CollectionEntry[] {
  const map = new Map<string, CollectionEntry>();

  logs.forEach((l) => {
    if (!l.catalog_id || !l.drink_catalog) return;
    const key = l.catalog_id;
    const ml = l.quantity_ml ?? (l.drink_catalog.volume_ml ?? 0) * (l.bottles || 0);

    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        catalog: l.drink_catalog,
        firstDrunk: l.logged_at,
        lastDrunk: l.logged_at,
        timesDrunk: 1,
        totalBottles: l.bottles || 0,
        totalMl: ml,
      });
    } else {
      existing.timesDrunk++;
      existing.totalBottles += l.bottles || 0;
      existing.totalMl += ml;
      if (l.logged_at < existing.firstDrunk) existing.firstDrunk = l.logged_at;
      if (l.logged_at > existing.lastDrunk) existing.lastDrunk = l.logged_at;
    }
  });

  return Array.from(map.values());
}

/** 주종별 그룹핑 — category → entries */
export function groupByCategory(
  entries: CollectionEntry[],
): Record<DrinkCategory, CollectionEntry[]> {
  const groups: Record<DrinkCategory, CollectionEntry[]> = {
    soju: [],
    beer: [],
    makgeolli: [],
    wine: [],
    whiskey: [],
    spirits: [],
    etc: [],
  };
  entries.forEach((e) => {
    const cat = e.catalog.category;
    groups[cat].push(e);
  });
  // 각 그룹 내에서 횟수 내림차순 정렬
  (Object.keys(groups) as DrinkCategory[]).forEach((k) => {
    groups[k].sort((a, b) => b.timesDrunk - a.timesDrunk);
  });
  return groups;
}

/** 통계 요약 */
export function collectionStats(entries: CollectionEntry[]) {
  const totalUnique = entries.length;
  const byCategory = groupByCategory(entries);
  const categoryCounts = (Object.entries(byCategory) as [DrinkCategory, CollectionEntry[]][])
    .map(([cat, list]) => ({ category: cat, count: list.length }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count);

  return {
    totalUnique,
    byCategory,
    categoryCounts,
  };
}
