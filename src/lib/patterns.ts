// 음주 패턴 분석 — 로그에서 인사이트 추출
// "비 오는 날엔 막걸리", "금요일 저녁이 제일 많아요" 등

import { DrinkLog, DrinkCategory, DrinkMood, CATEGORY_LABELS, MOOD_LABELS, MOOD_ICONS } from '../types';
import { WEATHER_ICONS, WEATHER_LABELS, WeatherCode } from './weather';

export interface Insight {
  icon: string;         // 이모지
  headline: string;     // 핵심 한 줄 ("비 오는 날엔 주로 막걸리")
  detail?: string;      // 보조 설명 (선택)
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

/** 가장 많이 마신 주종 */
function topCategory(logs: DrinkLog[]): { category: DrinkCategory; bottles: number } | null {
  const map: Partial<Record<DrinkCategory, number>> = {};
  logs.forEach((l) => {
    const c = l.drink_catalog?.category;
    if (!c) return;
    map[c] = (map[c] || 0) + (l.bottles || 0);
  });
  const entries = Object.entries(map) as [DrinkCategory, number][];
  if (entries.length === 0) return null;
  const [category, bottles] = entries.sort((a, b) => b[1] - a[1])[0];
  return { category, bottles };
}

/** 날씨 × 주종 상관 — 특정 날씨에서 압도적으로 많은 주종 */
function weatherPattern(logs: DrinkLog[]): Insight | null {
  const byWeather: Record<string, Partial<Record<DrinkCategory, number>>> = {};
  logs.forEach((l) => {
    const w = l.weather;
    const c = l.drink_catalog?.category;
    if (!w || !c) return;
    if (!byWeather[w]) byWeather[w] = {};
    byWeather[w][c] = (byWeather[w][c] || 0) + (l.bottles || 0);
  });

  // 각 날씨의 최다 주종, 그 중 비율이 가장 높은 패턴 선택
  type WeatherBest = {
    weather: string;
    category: DrinkCategory;
    ratio: number;
    count: number;
  };
  let best: WeatherBest | null = null;

  Object.entries(byWeather).forEach(([w, cats]) => {
    const entries = Object.entries(cats) as [DrinkCategory, number][];
    if (entries.length === 0) return;
    const total = entries.reduce((s, [, v]) => s + v, 0);
    if (total < 3) return; // 샘플 부족
    const [cat, count] = entries.sort((a, b) => b[1] - a[1])[0];
    const ratio = count / total;
    if (ratio < 0.5) return; // 50% 이상 몰려야 패턴
    if (!best || ratio > best.ratio) {
      best = { weather: w, category: cat, ratio, count };
    }
  });

  const winner = best as WeatherBest | null;
  if (!winner) return null;

  const wIcon = WEATHER_ICONS[winner.weather as WeatherCode] ?? '🌤';
  const wLabel = WEATHER_LABELS[winner.weather as WeatherCode] ?? winner.weather;
  const cLabel = CATEGORY_LABELS[winner.category];

  return {
    icon: wIcon,
    headline: `${wLabel} 날엔 주로 ${cLabel}을(를) 마셔요`,
    detail: `${winner.count}회 중 ${Math.round(winner.ratio * 100)}%`,
  };
}

/** 요일별 음주 — 가장 많이 마시는 요일 */
function dayOfWeekPattern(logs: DrinkLog[]): Insight | null {
  if (logs.length < 5) return null;
  const byDay: number[] = Array(7).fill(0);
  logs.forEach((l) => {
    const d = new Date(l.logged_at).getDay();
    byDay[d] += l.bottles || 0;
  });
  const total = byDay.reduce((s, v) => s + v, 0);
  if (total === 0) return null;
  let topDay = 0;
  for (let i = 1; i < 7; i++) if (byDay[i] > byDay[topDay]) topDay = i;
  const ratio = byDay[topDay] / total;

  const icons = ['🌞', '🌛', '🔥', '💫', '⚡️', '🎉', '🌈'];
  return {
    icon: icons[topDay],
    headline: `${DAY_NAMES[topDay]}요일에 제일 많이 마셔요`,
    detail: `전체 음주량의 ${Math.round(ratio * 100)}%`,
  };
}

/** 시간대 패턴 — 주로 언제 마시나 */
function timeOfDayPattern(logs: DrinkLog[]): Insight | null {
  if (logs.length < 5) return null;
  const buckets = {
    dawn: { label: '새벽', range: [0, 5], icon: '🌙', count: 0 },
    morning: { label: '아침', range: [5, 11], icon: '☕', count: 0 },
    lunch: { label: '점심', range: [11, 14], icon: '🍽', count: 0 },
    afternoon: { label: '오후', range: [14, 18], icon: '☀️', count: 0 },
    evening: { label: '저녁', range: [18, 22], icon: '🌆', count: 0 },
    night: { label: '밤', range: [22, 24], icon: '🌃', count: 0 },
  };
  logs.forEach((l) => {
    const h = new Date(l.logged_at).getHours();
    Object.values(buckets).forEach((b) => {
      if (h >= b.range[0] && h < b.range[1]) b.count++;
    });
  });
  const total = logs.length;
  const top = Object.values(buckets).sort((a, b) => b.count - a.count)[0];
  if (top.count === 0) return null;
  const ratio = top.count / total;
  if (ratio < 0.3) return null;

  return {
    icon: top.icon,
    headline: `주로 ${top.label}에 한 잔 해요`,
    detail: `전체 기록의 ${Math.round(ratio * 100)}%`,
  };
}

/** 분위기 × 주종 패턴 */
function moodCategoryPattern(logs: DrinkLog[]): Insight | null {
  const byMood: Record<string, Partial<Record<DrinkCategory, number>>> = {};
  logs.forEach((l) => {
    if (!l.mood || !l.drink_catalog?.category) return;
    if (!byMood[l.mood]) byMood[l.mood] = {};
    byMood[l.mood][l.drink_catalog.category] =
      (byMood[l.mood][l.drink_catalog.category] || 0) + 1;
  });

  type MoodBest = {
    mood: DrinkMood;
    category: DrinkCategory;
    ratio: number;
    count: number;
  };
  let best: MoodBest | null = null;

  Object.entries(byMood).forEach(([mood, cats]) => {
    const entries = Object.entries(cats) as [DrinkCategory, number][];
    const total = entries.reduce((s, [, v]) => s + v, 0);
    if (total < 3) return;
    const [cat, count] = entries.sort((a, b) => b[1] - a[1])[0];
    const ratio = count / total;
    if (ratio < 0.5) return;
    if (!best || ratio > best.ratio) {
      best = { mood: mood as DrinkMood, category: cat, ratio, count };
    }
  });

  const winner = best as MoodBest | null;
  if (!winner) return null;
  return {
    icon: MOOD_ICONS[winner.mood],
    headline: `${MOOD_LABELS[winner.mood]}엔 ${CATEGORY_LABELS[winner.category]}을(를) 선호해요`,
    detail: `${winner.count}회 중 ${Math.round(winner.ratio * 100)}%`,
  };
}

/** 주량 변화 — 최근 4주 vs 이전 4주 */
function recentTrendPattern(logs: DrinkLog[]): Insight | null {
  if (logs.length < 10) return null;
  const now = new Date();
  const recent4wAgo = new Date(now.getTime() - 28 * 86400000);
  const prev8wAgo = new Date(now.getTime() - 56 * 86400000);

  let recentMl = 0;
  let prevMl = 0;
  logs.forEach((l) => {
    const d = new Date(l.logged_at);
    const ml = l.quantity_ml ?? (l.drink_catalog?.volume_ml ?? 0) * (l.bottles || 0);
    if (d >= recent4wAgo) recentMl += ml;
    else if (d >= prev8wAgo) prevMl += ml;
  });

  if (prevMl === 0 || recentMl === 0) return null;
  const changePct = ((recentMl - prevMl) / prevMl) * 100;
  const absChange = Math.abs(changePct);
  if (absChange < 15) return null;

  if (changePct > 0) {
    return {
      icon: '📈',
      headline: `최근 4주 음주량이 늘었어요`,
      detail: `이전 4주 대비 +${Math.round(absChange)}%`,
    };
  } else {
    return {
      icon: '📉',
      headline: `최근 4주 음주량이 줄었어요`,
      detail: `이전 4주 대비 -${Math.round(absChange)}%`,
    };
  }
}

/** 최애 주류 (같은 카탈로그 반복) */
function favoriteDrinkPattern(logs: DrinkLog[]): Insight | null {
  const byCatalog: Record<string, { name: string; count: number }> = {};
  logs.forEach((l) => {
    if (!l.catalog_id || !l.drink_catalog) return;
    const key = l.catalog_id;
    if (!byCatalog[key]) {
      byCatalog[key] = { name: l.drink_catalog.name, count: 0 };
    }
    byCatalog[key].count++;
  });
  const list = Object.values(byCatalog).sort((a, b) => b.count - a.count);
  if (list.length === 0 || list[0].count < 3) return null;

  return {
    icon: '⭐️',
    headline: `"${list[0].name}"을(를) 제일 자주 마셔요`,
    detail: `${list[0].count}번 마셨어요`,
  };
}

/** 모든 인사이트 추출 — null 제외한 배열 반환 */
export function extractInsights(logs: DrinkLog[]): Insight[] {
  if (logs.length === 0) return [];
  const candidates = [
    weatherPattern(logs),
    dayOfWeekPattern(logs),
    timeOfDayPattern(logs),
    moodCategoryPattern(logs),
    recentTrendPattern(logs),
    favoriteDrinkPattern(logs),
  ];
  return candidates.filter((x): x is Insight => x !== null);
}

export { topCategory };
