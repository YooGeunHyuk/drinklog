// 업적 시스템 — 뱃지/마일스톤과 별개의 이벤트 기반 도전과제
// 모든 업적은 로그 배열에서 클라이언트 사이드로 계산 (DB 변경 없음)

import { DrinkLog, DrinkCategory, DrinkMood } from '../types';

export type AchievementCategory =
  | 'streak'       // 연속성 (연속 음주 / 연속 절주)
  | 'volume'       // 누적 볼륨
  | 'variety'      // 다양성 (여러 종류)
  | 'mastery'      // 한 주종 숙련
  | 'time'         // 시간 패턴
  | 'weather'      // 날씨 연관
  | 'social'       // 모임·분위기
  | 'logging';     // 기록 자체

export interface Achievement {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  category: AchievementCategory;
  /** 0~1 진행률 + 달성 여부 계산 */
  check: (logs: DrinkLog[]) => {
    unlocked: boolean;
    progress: number;     // 0 ~ target
    target: number;       // 달성 목표값
    unit?: string;        // '병', '일', '종' 등 표시용
  };
}

// ── 유틸 ───────────────────────────────────────────────────────
const DAY_MS = 86400000;

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** 고유 음주일(timestamp) 집합 */
function drinkDaySet(logs: DrinkLog[]): Set<number> {
  return new Set(logs.map((l) => startOfDay(new Date(l.logged_at)).getTime()));
}

/** 가장 긴 연속 음주 streak (과거 전체 기준) */
function longestStreak(logs: DrinkLog[]): number {
  const set = drinkDaySet(logs);
  if (set.size === 0) return 0;
  const sortedDays = Array.from(set).sort((a, b) => a - b);
  let best = 1;
  let cur = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    if (sortedDays[i] - sortedDays[i - 1] === DAY_MS) cur++;
    else cur = 1;
    if (cur > best) best = cur;
  }
  return best;
}

/** 최장 절주일 (오늘까지, 또는 기록 사이 가장 긴 공백) */
function longestAbstinence(logs: DrinkLog[]): number {
  const set = drinkDaySet(logs);
  if (set.size === 0) return 0;
  const sortedDays = Array.from(set).sort((a, b) => a - b);
  let best = 0;
  for (let i = 1; i < sortedDays.length; i++) {
    const gap = (sortedDays[i] - sortedDays[i - 1]) / DAY_MS - 1;
    if (gap > best) best = gap;
  }
  // 마지막 기록 이후 오늘까지 간격도 비교
  const tailGap = (startOfDay(new Date()).getTime() - sortedDays[sortedDays.length - 1]) / DAY_MS;
  if (tailGap > best) best = tailGap;
  return best;
}

/** 주종별 누적 ml */
function categoryMl(logs: DrinkLog[], cat: DrinkCategory): number {
  return logs
    .filter((l) => l.drink_catalog?.category === cat)
    .reduce((s, l) => {
      const ml = l.quantity_ml ?? (l.drink_catalog?.volume_ml ?? 0) * (l.bottles || 0);
      return s + ml;
    }, 0);
}

/** 주종별 누적 병 수 (소주 병 환산 등에 사용) */
function categoryBottles(logs: DrinkLog[], cat: DrinkCategory): number {
  return logs
    .filter((l) => l.drink_catalog?.category === cat)
    .reduce((s, l) => s + (l.bottles || 0), 0);
}

/** 고유 주류 종류 수 */
function uniqueDrinks(logs: DrinkLog[]): number {
  return new Set(logs.map((l) => l.catalog_id).filter(Boolean)).size;
}

/** 특정 mood 로그 수 */
function moodCount(logs: DrinkLog[], mood: DrinkMood): number {
  return logs.filter((l) => l.mood === mood).length;
}

/** 특정 날씨 + 주종 조합 로그 수 */
function weatherCategoryCount(
  logs: DrinkLog[],
  weather: string,
  cat: DrinkCategory,
): number {
  return logs.filter(
    (l) => l.weather === weather && l.drink_catalog?.category === cat,
  ).length;
}

/** 시간대(시각 0~23) 로그 수 */
function hourCount(logs: DrinkLog[], hourStart: number, hourEnd: number): number {
  return logs.filter((l) => {
    const h = new Date(l.logged_at).getHours();
    return h >= hourStart && h < hourEnd;
  }).length;
}

function makeProgress(val: number, target: number, unit?: string) {
  return {
    unlocked: val >= target,
    progress: Math.min(val, target),
    target,
    unit,
  };
}

// ── 업적 정의 ─────────────────────────────────────────────────
export const ACHIEVEMENTS: Achievement[] = [
  // ── 📝 기록 (logging) ──
  {
    id: 'first-log',
    emoji: '🌱',
    title: '첫 기록',
    desc: '처음으로 술을 기록했어요.',
    category: 'logging',
    check: (logs) => makeProgress(logs.length, 1, '개'),
  },
  {
    id: 'log-10',
    emoji: '📓',
    title: '꾸준한 기록자',
    desc: '기록 10개 달성.',
    category: 'logging',
    check: (logs) => makeProgress(logs.length, 10, '개'),
  },
  {
    id: 'log-100',
    emoji: '📚',
    title: '음주 일기장',
    desc: '기록 100개 달성. 진심이네요.',
    category: 'logging',
    check: (logs) => makeProgress(logs.length, 100, '개'),
  },
  {
    id: 'log-500',
    emoji: '📖',
    title: '기록의 달인',
    desc: '기록 500개 달성. 작가 데뷔각.',
    category: 'logging',
    check: (logs) => makeProgress(logs.length, 500, '개'),
  },
  {
    id: 'memo-10',
    emoji: '✍️',
    title: '감성 주당',
    desc: '메모가 있는 기록 10개.',
    category: 'logging',
    check: (logs) =>
      makeProgress(logs.filter((l) => l.note && l.note.trim().length > 0).length, 10, '개'),
  },
  {
    id: 'photo-10',
    emoji: '📸',
    title: '라벨 수집가',
    desc: '사진이 있는 기록 10개.',
    category: 'logging',
    check: (logs) => makeProgress(logs.filter((l) => l.photo_url).length, 10, '개'),
  },

  // ── 🔥 연속 (streak) ──
  {
    id: 'streak-3',
    emoji: '🔥',
    title: '3일 연속 의식',
    desc: '3일 연속 음주 기록.',
    category: 'streak',
    check: (logs) => makeProgress(longestStreak(logs), 3, '일'),
  },
  {
    id: 'streak-7',
    emoji: '🔥🔥',
    title: '한 주를 불태운 자',
    desc: '7일 연속 음주 기록.',
    category: 'streak',
    check: (logs) => makeProgress(longestStreak(logs), 7, '일'),
  },
  {
    id: 'streak-14',
    emoji: '🌋',
    title: '2주 연속 풀가동',
    desc: '14일 연속 음주 기록.',
    category: 'streak',
    check: (logs) => makeProgress(longestStreak(logs), 14, '일'),
  },
  {
    id: 'streak-30',
    emoji: '💫',
    title: '한 달 내내 마신 자',
    desc: '30일 연속 음주 기록.',
    category: 'streak',
    check: (logs) => makeProgress(longestStreak(logs), 30, '일'),
  },

  // ── 💧 절주 (abstinence) ──
  {
    id: 'abstain-3',
    emoji: '💧',
    title: '3일 휴식',
    desc: '3일 연속 술을 쉬었어요.',
    category: 'streak',
    check: (logs) => makeProgress(longestAbstinence(logs), 3, '일'),
  },
  {
    id: 'abstain-7',
    emoji: '🧘',
    title: '금주 한 주',
    desc: '7일 연속 절주.',
    category: 'streak',
    check: (logs) => makeProgress(longestAbstinence(logs), 7, '일'),
  },
  {
    id: 'abstain-30',
    emoji: '🕊',
    title: '자유로운 한 달',
    desc: '30일 연속 절주.',
    category: 'streak',
    check: (logs) => makeProgress(longestAbstinence(logs), 30, '일'),
  },

  // ── 🌈 다양성 (variety) ──
  {
    id: 'variety-5',
    emoji: '🎨',
    title: '입맛 탐험가',
    desc: '5종류의 다른 술을 경험.',
    category: 'variety',
    check: (logs) => makeProgress(uniqueDrinks(logs), 5, '종'),
  },
  {
    id: 'variety-20',
    emoji: '🧭',
    title: '취향 박물학자',
    desc: '20종류의 다른 술을 경험.',
    category: 'variety',
    check: (logs) => makeProgress(uniqueDrinks(logs), 20, '종'),
  },
  {
    id: 'variety-50',
    emoji: '🏛',
    title: '주류 큐레이터',
    desc: '50종류의 다른 술을 경험.',
    category: 'variety',
    check: (logs) => makeProgress(uniqueDrinks(logs), 50, '종'),
  },
  {
    id: 'variety-100',
    emoji: '🌌',
    title: '100종 정복자',
    desc: '100종류의 다른 술을 경험. 소믈리에급.',
    category: 'variety',
    check: (logs) => makeProgress(uniqueDrinks(logs), 100, '종'),
  },

  // ── 🏆 주종 숙련 (mastery) ──
  {
    id: 'master-soju-100',
    emoji: '🍶',
    title: '소주 100병',
    desc: '소주를 100병 마셨어요.',
    category: 'mastery',
    check: (logs) => makeProgress(categoryBottles(logs, 'soju'), 100, '병'),
  },
  {
    id: 'master-beer-50L',
    emoji: '🍺',
    title: '맥주 50리터',
    desc: '맥주 누적 50L.',
    category: 'mastery',
    check: (logs) =>
      makeProgress(Math.floor(categoryMl(logs, 'beer') / 1000), 50, 'L'),
  },
  {
    id: 'master-makgeolli-30',
    emoji: '🍚',
    title: '막걸리 30병',
    desc: '막걸리 누적 30병.',
    category: 'mastery',
    check: (logs) => makeProgress(categoryBottles(logs, 'makgeolli'), 30, '병'),
  },
  {
    id: 'master-wine-20',
    emoji: '🍷',
    title: '와인 20병',
    desc: '와인 누적 20병.',
    category: 'mastery',
    check: (logs) => makeProgress(categoryBottles(logs, 'wine'), 20, '병'),
  },
  {
    id: 'master-whiskey-10',
    emoji: '🥃',
    title: '위스키 10병',
    desc: '위스키 누적 10병. 홈바 자격.',
    category: 'mastery',
    check: (logs) => makeProgress(categoryBottles(logs, 'whiskey'), 10, '병'),
  },

  // ── 🕰 시간 (time) ──
  {
    id: 'time-dawn',
    emoji: '🌙',
    title: '새벽 음주',
    desc: '새벽(0~5시)에 3번 기록.',
    category: 'time',
    check: (logs) => makeProgress(hourCount(logs, 0, 5), 3, '회'),
  },
  {
    id: 'time-lunch',
    emoji: '☀️',
    title: '낮술의 맛',
    desc: '점심(11~14시)에 5번 기록.',
    category: 'time',
    check: (logs) => makeProgress(hourCount(logs, 11, 14), 5, '회'),
  },
  {
    id: 'time-evening-20',
    emoji: '🌆',
    title: '퇴근 후 한 잔',
    desc: '저녁(18~22시)에 20번 기록.',
    category: 'time',
    check: (logs) => makeProgress(hourCount(logs, 18, 22), 20, '회'),
  },

  // ── 🌦 날씨 (weather) ──
  {
    id: 'weather-rain-makgeolli',
    emoji: '🌧',
    title: '비 오는 날엔 막걸리',
    desc: '비 오는 날 막걸리 3회.',
    category: 'weather',
    check: (logs) => makeProgress(weatherCategoryCount(logs, 'rainy', 'makgeolli'), 3, '회'),
  },
  {
    id: 'weather-snow-soju',
    emoji: '❄️',
    title: '눈 오는 날엔 소주',
    desc: '눈 오는 날 소주 3회.',
    category: 'weather',
    check: (logs) => makeProgress(weatherCategoryCount(logs, 'snowy', 'soju'), 3, '회'),
  },
  {
    id: 'weather-sunny-beer',
    emoji: '☀️',
    title: '맑은 날엔 맥주',
    desc: '맑은 날 맥주 5회.',
    category: 'weather',
    check: (logs) => makeProgress(weatherCategoryCount(logs, 'sunny', 'beer'), 5, '회'),
  },
  {
    id: 'weather-storm',
    emoji: '⛈',
    title: '폭풍 속 한 잔',
    desc: '천둥번개 치는 날 기록.',
    category: 'weather',
    check: (logs) => makeProgress(
      logs.filter((l) => l.weather === 'stormy').length, 1, '회',
    ),
  },

  // ── 👥 소셜 (social) ──
  {
    id: 'social-alone-10',
    emoji: '🧘',
    title: '혼술 애호가',
    desc: '혼술 10회 기록.',
    category: 'social',
    check: (logs) => makeProgress(moodCount(logs, 'alone'), 10, '회'),
  },
  {
    id: 'social-party-10',
    emoji: '🎉',
    title: '회식 단골',
    desc: '모임·회식 10회 기록.',
    category: 'social',
    check: (logs) => makeProgress(moodCount(logs, 'party'), 10, '회'),
  },
  {
    id: 'social-date-5',
    emoji: '💕',
    title: '로맨틱 드링커',
    desc: '데이트 자리에서 5회 기록.',
    category: 'social',
    check: (logs) => makeProgress(moodCount(logs, 'date'), 5, '회'),
  },
  {
    id: 'social-celebration',
    emoji: '🥂',
    title: '축하의 주인공',
    desc: '축하 자리 3회 기록.',
    category: 'social',
    check: (logs) => makeProgress(moodCount(logs, 'celebration'), 3, '회'),
  },
];

// ── 라벨 / 헬퍼 ───────────────────────────────────────────────
export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  streak: '연속 · 절주',
  volume: '누적',
  variety: '다양성',
  mastery: '주종 숙련',
  time: '시간대',
  weather: '날씨 연관',
  social: '분위기',
  logging: '기록',
};

/** 전체 업적 체크 결과 + 통계 */
export function evaluateAchievements(logs: DrinkLog[]) {
  const results = ACHIEVEMENTS.map((a) => ({
    ...a,
    ...a.check(logs),
  }));
  const unlocked = results.filter((r) => r.unlocked);
  return {
    all: results,
    unlockedCount: unlocked.length,
    totalCount: ACHIEVEMENTS.length,
    unlockedPercent: (unlocked.length / ACHIEVEMENTS.length) * 100,
  };
}
