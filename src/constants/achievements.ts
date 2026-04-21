// 업적 시스템 — 뱃지/마일스톤과 별개의 이벤트 기반 도전과제
// 모든 업적은 로그 배열에서 클라이언트 사이드로 계산 (DB 변경 없음)

import { DrinkLog, DrinkCategory, DrinkMood } from '../types';

export type AchievementCategory =
  | 'logging'      // 기록 자체
  | 'streak'       // 연속성 (연속 음주 / 연속 절주)
  | 'variety'      // 다양성 (여러 종류)
  | 'mastery'      // 한 주종 숙련
  | 'time'         // 시간 패턴
  | 'weather'      // 날씨 연관
  | 'social'       // 모임·분위기
  | 'location'     // 장소
  | 'special_day'  // 특별한 날 (명절/기념일)
  | 'secret';      // 이스터에그 (숨겨진 업적)

export interface Achievement {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  category: AchievementCategory;
  /** 숨김 업적 — UI에서 ??? 처리, 해금 시 공개 */
  hidden?: boolean;
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

/** 주류 이름에 키워드가 포함된 로그 수 (사케/소츄/정종 등 세분화용) */
function nameKeywordCount(logs: DrinkLog[], keywords: string[]): number {
  return logs.filter((l) => {
    const name = (l.drink_catalog?.name ?? '').toLowerCase();
    return keywords.some((k) => name.includes(k.toLowerCase()));
  }).length;
}

/** location / location_name / note 필드 중 하나라도 키워드 매칭 */
function anyFieldKeywordCount(
  logs: DrinkLog[],
  keywords: string[],
  fields: Array<'location' | 'location_name' | 'note'> = ['location', 'location_name', 'note'],
): number {
  return logs.filter((l) => {
    return fields.some((f) => {
      const v = (l as any)[f] as string | null;
      if (!v) return false;
      const vv = v.toLowerCase();
      return keywords.some((k) => vv.includes(k.toLowerCase()));
    });
  }).length;
}

/** 자동 기록된 행정구역(location_name)의 고유 시/도 수 */
function uniqueRegions(logs: DrinkLog[]): number {
  const set = new Set<string>();
  logs.forEach((l) => {
    if (!l.location_name) return;
    // "서울특별시 강남구" → "서울특별시", "경기도 성남시" → "경기도"
    const first = l.location_name.split(' ')[0];
    if (first) set.add(first);
  });
  return set.size;
}

/** 특정 (월, 일) — 양력 기준 — 기록이 있는지 */
function hasLogOnDate(logs: DrinkLog[], month1: number, day: number): boolean {
  return logs.some((l) => {
    const d = new Date(l.logged_at);
    return d.getMonth() + 1 === month1 && d.getDate() === day;
  });
}

/** 날짜 범위(양력, inclusive)에 기록이 있는지 */
function hasLogInRange(
  logs: DrinkLog[],
  m1a: number, d1a: number,
  m1b: number, d1b: number,
): boolean {
  return logs.some((l) => {
    const d = new Date(l.logged_at);
    const m = d.getMonth() + 1;
    const day = d.getDate();
    if (m === m1a && day >= d1a) return m1a === m1b ? day <= d1b : true;
    if (m1a !== m1b && m === m1b && day <= d1b) return true;
    if (m1a !== m1b && m > m1a && m < m1b) return true;
    return false;
  });
}

// 한국 설날/추석 양력 매핑 (2024~2030)
const LUNAR_NEW_YEAR: Record<number, [number, number]> = {
  2024: [2, 10], 2025: [1, 29], 2026: [2, 17], 2027: [2, 7],
  2028: [1, 27], 2029: [2, 13], 2030: [2, 3],
};
const CHUSEOK: Record<number, [number, number]> = {
  2024: [9, 17], 2025: [10, 6], 2026: [9, 25], 2027: [9, 15],
  2028: [10, 3], 2029: [9, 22], 2030: [9, 12],
};

function hasLogOnLunar(logs: DrinkLog[], table: Record<number, [number, number]>): boolean {
  return logs.some((l) => {
    const d = new Date(l.logged_at);
    const y = d.getFullYear();
    const map = table[y];
    if (!map) return false;
    return d.getMonth() + 1 === map[0] && d.getDate() === map[1];
  });
}

function makeProgress(val: number, target: number, unit?: string) {
  return {
    unlocked: val >= target,
    progress: Math.min(val, target),
    target,
    unit,
  };
}

function flagProgress(hit: boolean, unit = '회') {
  return { unlocked: hit, progress: hit ? 1 : 0, target: 1, unit };
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
    id: 'log-3',
    emoji: '📝',
    title: '세 번의 의식',
    desc: '기록 3개 달성. 감이 잡히죠?',
    category: 'logging',
    check: (logs) => makeProgress(logs.length, 3, '개'),
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
    id: 'memo-first',
    emoji: '🖊',
    title: '첫 메모',
    desc: '메모를 남긴 첫 기록.',
    category: 'logging',
    check: (logs) =>
      makeProgress(logs.filter((l) => l.note && l.note.trim().length > 0).length, 1, '개'),
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
    id: 'photo-first',
    emoji: '📷',
    title: '첫 라벨샷',
    desc: '사진을 첨부한 첫 기록.',
    category: 'logging',
    check: (logs) => makeProgress(logs.filter((l) => l.photo_url).length, 1, '개'),
  },
  {
    id: 'photo-10',
    emoji: '📸',
    title: '라벨 수집가',
    desc: '사진이 있는 기록 10개.',
    category: 'logging',
    check: (logs) => makeProgress(logs.filter((l) => l.photo_url).length, 10, '개'),
  },
  {
    id: 'memo-long',
    emoji: '📜',
    title: '주당의 수필',
    desc: '100자 이상의 메모를 남겼어요.',
    category: 'logging',
    check: (logs) =>
      flagProgress(logs.some((l) => (l.note ?? '').length >= 100)),
  },

  // ── 🔥 연속 (streak) ──
  {
    id: 'streak-2',
    emoji: '🔥',
    title: '이틀 연속',
    desc: '2일 연속 음주 기록.',
    category: 'streak',
    check: (logs) => makeProgress(longestStreak(logs), 2, '일'),
  },
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

  // ── 💧 절주 (streak에 포함) ──
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
    id: 'variety-3',
    emoji: '🥄',
    title: '맛보기 중',
    desc: '3종류의 다른 술을 경험.',
    category: 'variety',
    check: (logs) => makeProgress(uniqueDrinks(logs), 3, '종'),
  },
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
  {
    id: 'all-big-categories',
    emoji: '🧪',
    title: '주종의 대륙 횡단',
    desc: '소주·맥주·막걸리·와인·위스키를 모두 경험.',
    category: 'variety',
    check: (logs) => {
      const cats: DrinkCategory[] = ['soju', 'beer', 'makgeolli', 'wine', 'whiskey'];
      const done = cats.filter((c) => categoryBottles(logs, c) > 0).length;
      return makeProgress(done, cats.length, '종');
    },
  },

  // ── 🏆 주종 숙련 (mastery) ──
  {
    id: 'first-soju',
    emoji: '🍶',
    title: '첫 소주',
    desc: '첫 소주 한 잔의 추억.',
    category: 'mastery',
    check: (logs) => makeProgress(categoryBottles(logs, 'soju') > 0 ? 1 : 0, 1, '회'),
  },
  {
    id: 'first-beer',
    emoji: '🍺',
    title: '첫 맥주',
    desc: '시원하게 첫 잔.',
    category: 'mastery',
    check: (logs) => makeProgress(categoryBottles(logs, 'beer') > 0 ? 1 : 0, 1, '회'),
  },
  {
    id: 'first-makgeolli',
    emoji: '🍚',
    title: '첫 막걸리',
    desc: '전통의 맛, 입문.',
    category: 'mastery',
    check: (logs) => makeProgress(categoryBottles(logs, 'makgeolli') > 0 ? 1 : 0, 1, '회'),
  },
  {
    id: 'first-wine',
    emoji: '🍷',
    title: '첫 와인',
    desc: '격식 있는 한 잔.',
    category: 'mastery',
    check: (logs) => makeProgress(categoryBottles(logs, 'wine') > 0 ? 1 : 0, 1, '회'),
  },
  {
    id: 'first-whiskey',
    emoji: '🥃',
    title: '첫 위스키',
    desc: '본격 홈바 입문.',
    category: 'mastery',
    check: (logs) => makeProgress(categoryBottles(logs, 'whiskey') > 0 ? 1 : 0, 1, '회'),
  },
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
  // ── 키워드 기반 세분화 ──
  {
    id: 'first-sake',
    emoji: '🍶',
    title: '첫 사케(清酒)',
    desc: '일본 청주의 세계로.',
    category: 'mastery',
    check: (logs) =>
      makeProgress(nameKeywordCount(logs, ['사케', '사께', 'sake', '준마이', '긴조', '다이긴조']), 1, '회'),
  },
  {
    id: 'first-shochu',
    emoji: '🍶',
    title: '첫 소츄',
    desc: '일본식 증류주, 소츄.',
    category: 'mastery',
    check: (logs) =>
      makeProgress(nameKeywordCount(logs, ['소츄', 'shochu', '쇼츄']), 1, '회'),
  },
  {
    id: 'first-cheongju',
    emoji: '🍾',
    title: '첫 청주·정종',
    desc: '맑은 한 모금.',
    category: 'mastery',
    check: (logs) =>
      makeProgress(nameKeywordCount(logs, ['청주', '정종', '법주', '경주법주', '백화수복', '화요']), 1, '회'),
  },
  {
    id: 'first-traditional',
    emoji: '🏺',
    title: '첫 전통주',
    desc: '우리 술의 향.',
    category: 'mastery',
    check: (logs) =>
      makeProgress(nameKeywordCount(logs, ['전통주', '문배주', '안동소주', '이강주', '소곡주', '복분자']), 1, '회'),
  },
  {
    id: 'first-fruitwine',
    emoji: '🍑',
    title: '첫 과실주',
    desc: '달콤한 과실의 향.',
    category: 'mastery',
    check: (logs) =>
      makeProgress(nameKeywordCount(logs, ['복분자', '매실주', '과실주', '산사춘', '백세주']), 1, '회'),
  },
  {
    id: 'first-cocktail',
    emoji: '🍸',
    title: '첫 칵테일',
    desc: '믹솔로지의 세계로.',
    category: 'mastery',
    check: (logs) =>
      makeProgress(nameKeywordCount(logs, ['칵테일', '모히또', '마가리타', '진토닉', 'cocktail']), 1, '회'),
  },
  {
    id: 'first-highball',
    emoji: '🥤',
    title: '첫 하이볼',
    desc: '위스키 + 탄산의 완성.',
    category: 'mastery',
    check: (logs) =>
      makeProgress(nameKeywordCount(logs, ['하이볼', 'highball', '산토리 하이볼']), 1, '회'),
  },
  {
    id: 'first-champagne',
    emoji: '🍾',
    title: '첫 샴페인',
    desc: '거품 속의 특별한 순간.',
    category: 'mastery',
    check: (logs) =>
      makeProgress(nameKeywordCount(logs, ['샴페인', 'champagne', '스파클링', '까바', '프로세코']), 1, '회'),
  },
  {
    id: 'first-ipa',
    emoji: '🌿',
    title: '첫 IPA',
    desc: '쌉싸름한 홉의 세계.',
    category: 'mastery',
    check: (logs) =>
      makeProgress(nameKeywordCount(logs, ['ipa', '인디아 페일', 'pale ale', '페일에일']), 1, '회'),
  },
  {
    id: 'first-craftbeer',
    emoji: '🍻',
    title: '첫 수제맥주',
    desc: '양조장의 자존심.',
    category: 'mastery',
    check: (logs) =>
      makeProgress(nameKeywordCount(logs, ['수제맥주', '크래프트', 'craft', '브루어리', 'brewery']), 1, '회'),
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
  {
    id: 'time-weekend',
    emoji: '🎈',
    title: '불금 전문가',
    desc: '금요일 저녁(18~24시) 5회.',
    category: 'time',
    check: (logs) =>
      makeProgress(
        logs.filter((l) => {
          const d = new Date(l.logged_at);
          return d.getDay() === 5 && d.getHours() >= 18;
        }).length,
        5,
        '회',
      ),
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
    id: 'social-alone-first',
    emoji: '🧘',
    title: '첫 혼술',
    desc: '혼자만의 한 잔, 나쁘지 않죠.',
    category: 'social',
    check: (logs) => makeProgress(moodCount(logs, 'alone'), 1, '회'),
  },
  {
    id: 'social-alone-10',
    emoji: '🧘',
    title: '혼술 애호가',
    desc: '혼술 10회 기록.',
    category: 'social',
    check: (logs) => makeProgress(moodCount(logs, 'alone'), 10, '회'),
  },
  {
    id: 'social-party-first',
    emoji: '🎉',
    title: '첫 회식',
    desc: '첫 모임·회식 기록.',
    category: 'social',
    check: (logs) => makeProgress(moodCount(logs, 'party'), 1, '회'),
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
  {
    id: 'social-all-moods',
    emoji: '🎭',
    title: '무드 컬렉터',
    desc: '모든 분위기(6종)에서 한 번씩.',
    category: 'social',
    check: (logs) => {
      const moods: DrinkMood[] = ['alone', 'casual', 'party', 'date', 'business', 'celebration'];
      const done = moods.filter((m) => moodCount(logs, m) > 0).length;
      return makeProgress(done, moods.length, '종');
    },
  },

  // ── 📍 장소 (location) ──
  {
    id: 'loc-first',
    emoji: '📍',
    title: '첫 장소 기록',
    desc: '장소를 남긴 첫 기록.',
    category: 'location',
    check: (logs) =>
      makeProgress(logs.filter((l) => l.location && l.location.trim()).length, 1, '개'),
  },
  {
    id: 'loc-home',
    emoji: '🏠',
    title: '홈술러',
    desc: '"집"에서 5번 기록.',
    category: 'location',
    check: (logs) =>
      makeProgress(anyFieldKeywordCount(logs, ['집', 'home', '자택'], ['location', 'note']), 5, '회'),
  },
  {
    id: 'loc-pocha',
    emoji: '🍢',
    title: '포차의 밤',
    desc: '포장마차 기록 3회.',
    category: 'location',
    check: (logs) =>
      makeProgress(anyFieldKeywordCount(logs, ['포차', '포장마차', '포장집']), 3, '회'),
  },
  {
    id: 'loc-izakaya',
    emoji: '🏮',
    title: '이자카야 애호가',
    desc: '이자카야 3회.',
    category: 'location',
    check: (logs) =>
      makeProgress(anyFieldKeywordCount(logs, ['이자카야', 'izakaya']), 3, '회'),
  },
  {
    id: 'loc-bar',
    emoji: '🍸',
    title: '바(BAR) 단골',
    desc: '바 기록 5회.',
    category: 'location',
    check: (logs) =>
      makeProgress(anyFieldKeywordCount(logs, ['바', 'bar', '칵테일바', '위스키바']), 5, '회'),
  },
  {
    id: 'loc-bbq',
    emoji: '🥩',
    title: '고깃집 단골',
    desc: '고깃집/삼겹살 5회.',
    category: 'location',
    check: (logs) =>
      makeProgress(anyFieldKeywordCount(logs, ['고깃', '삼겹살', '갈비', '숯불', '구이']), 5, '회'),
  },
  // 자동 위치 (location_name) 기반
  {
    id: 'region-3',
    emoji: '🗺',
    title: '방랑자',
    desc: '3개 시/도에서 기록.',
    category: 'location',
    check: (logs) => makeProgress(uniqueRegions(logs), 3, '곳'),
  },
  {
    id: 'region-7',
    emoji: '🧳',
    title: '전국 투어',
    desc: '7개 시/도에서 기록.',
    category: 'location',
    check: (logs) => makeProgress(uniqueRegions(logs), 7, '곳'),
  },
  {
    id: 'region-17',
    emoji: '🇰🇷',
    title: '대한민국 정복',
    desc: '17개 광역시/도 모두에서 기록.',
    category: 'location',
    check: (logs) => makeProgress(uniqueRegions(logs), 17, '곳'),
  },
  {
    id: 'loc-jeju',
    emoji: '🌊',
    title: '제주에서 한 잔',
    desc: '제주도에서 기록.',
    category: 'location',
    check: (logs) =>
      flagProgress(anyFieldKeywordCount(logs, ['제주'], ['location', 'location_name']) > 0),
  },
  {
    id: 'loc-busan',
    emoji: '🌊',
    title: '부산의 밤',
    desc: '부산에서 기록.',
    category: 'location',
    check: (logs) =>
      flagProgress(anyFieldKeywordCount(logs, ['부산'], ['location', 'location_name']) > 0),
  },
  {
    id: 'loc-hongdae',
    emoji: '🎶',
    title: '홍대 불야성',
    desc: '홍대/합정에서 기록.',
    category: 'location',
    check: (logs) =>
      flagProgress(anyFieldKeywordCount(logs, ['홍대', '합정', '상수'], ['location', 'location_name']) > 0),
  },

  // ── 🎉 특별한 날 (special_day) ──
  {
    id: 'day-newyear',
    emoji: '🎆',
    title: '새해 첫 잔',
    desc: '1월 1일의 기록. 올해도 잘 부탁해요.',
    category: 'special_day',
    check: (logs) => flagProgress(hasLogOnDate(logs, 1, 1)),
  },
  {
    id: 'day-nye',
    emoji: '🥂',
    title: '제야의 종소리',
    desc: '12월 31일의 기록.',
    category: 'special_day',
    check: (logs) => flagProgress(hasLogOnDate(logs, 12, 31)),
  },
  {
    id: 'day-christmas',
    emoji: '🎄',
    title: '크리스마스의 캐럴',
    desc: '12월 25일의 기록. 사랑하는 사람과?',
    category: 'special_day',
    check: (logs) => flagProgress(hasLogOnDate(logs, 12, 25)),
  },
  {
    id: 'day-eve',
    emoji: '🎅',
    title: '이브의 은밀한 잔',
    desc: '12월 24일의 기록. 이미 시작이죠.',
    category: 'special_day',
    check: (logs) => flagProgress(hasLogOnDate(logs, 12, 24)),
  },
  {
    id: 'day-parents',
    emoji: '🌸',
    title: '어버이날에 한잔',
    desc: '5월 8일의 기록. 부모님은 찾아뵙고 한잔 하는거죠? 🤔',
    category: 'special_day',
    check: (logs) => flagProgress(hasLogOnDate(logs, 5, 8)),
  },
  {
    id: 'day-children',
    emoji: '🎈',
    title: '어린이날의 어른',
    desc: '5월 5일의 기록. 오늘은 어른이 주인공이 아니잖아요…',
    category: 'special_day',
    check: (logs) => flagProgress(hasLogOnDate(logs, 5, 5)),
  },
  {
    id: 'day-teacher',
    emoji: '🎓',
    title: '스승의 은혜',
    desc: '5월 15일의 기록.',
    category: 'special_day',
    check: (logs) => flagProgress(hasLogOnDate(logs, 5, 15)),
  },
  {
    id: 'day-liberation',
    emoji: '🇰🇷',
    title: '광복절의 건배',
    desc: '8월 15일의 기록.',
    category: 'special_day',
    check: (logs) => flagProgress(hasLogOnDate(logs, 8, 15)),
  },
  {
    id: 'day-hangul',
    emoji: '🔤',
    title: '한글날의 잔',
    desc: '10월 9일의 기록. 가나다라마바사아자차카타파하.',
    category: 'special_day',
    check: (logs) => flagProgress(hasLogOnDate(logs, 10, 9)),
  },
  {
    id: 'day-valentine',
    emoji: '💝',
    title: '발렌타인의 한 잔',
    desc: '2월 14일의 기록.',
    category: 'special_day',
    check: (logs) => flagProgress(hasLogOnDate(logs, 2, 14)),
  },
  {
    id: 'day-white',
    emoji: '🤍',
    title: '화이트데이의 답례',
    desc: '3월 14일의 기록.',
    category: 'special_day',
    check: (logs) => flagProgress(hasLogOnDate(logs, 3, 14)),
  },
  {
    id: 'day-halloween',
    emoji: '🎃',
    title: '핼러윈의 밤',
    desc: '10월 31일의 기록.',
    category: 'special_day',
    check: (logs) => flagProgress(hasLogOnDate(logs, 10, 31)),
  },
  {
    id: 'day-seollal',
    emoji: '🧧',
    title: '설날의 세주(歲酒)',
    desc: '설날 당일 기록. 세배 받고 한 잔?',
    category: 'special_day',
    check: (logs) => flagProgress(hasLogOnLunar(logs, LUNAR_NEW_YEAR)),
  },
  {
    id: 'day-chuseok',
    emoji: '🌕',
    title: '추석의 음복(飮福)',
    desc: '추석 당일 기록. 차례상 앞에서 한 잔?',
    category: 'special_day',
    check: (logs) => flagProgress(hasLogOnLunar(logs, CHUSEOK)),
  },
  {
    id: 'day-picnic',
    emoji: '🧺',
    title: '피크닉의 잔',
    desc: '메모에 "피크닉/소풍".',
    category: 'special_day',
    check: (logs) =>
      flagProgress(anyFieldKeywordCount(logs, ['피크닉', '소풍', 'picnic'], ['note', 'location']) > 0),
  },

  // ── 🥚 이스터에그 (secret · hidden) ──
  {
    id: 'egg-ocean',
    emoji: '🌊',
    title: '바다를 본 날',
    desc: '파도 소리 안주 삼아 한 잔.',
    category: 'secret',
    hidden: true,
    check: (logs) =>
      flagProgress(
        anyFieldKeywordCount(logs, ['바다', '해변', '해수욕장', 'ocean', 'beach']) > 0,
      ),
  },
  {
    id: 'egg-summit',
    emoji: '⛰',
    title: '정상에서의 건배',
    desc: '여기까지 올라와서 술이라니, 하산길 조심하세요.',
    category: 'secret',
    hidden: true,
    check: (logs) =>
      flagProgress(
        anyFieldKeywordCount(logs, ['등산', '정상', '봉우리', '산정상', '능선']) > 0,
      ),
  },
  {
    id: 'egg-flight',
    emoji: '✈️',
    title: '기내식 한 잔',
    desc: '3만 피트의 알딸딸함.',
    category: 'secret',
    hidden: true,
    check: (logs) =>
      flagProgress(
        anyFieldKeywordCount(logs, ['비행기', '기내', '공항', '면세', '기내식']) > 0,
      ),
  },
  {
    id: 'egg-camping',
    emoji: '🏕',
    title: '캠핑 불멍주',
    desc: '장작 타는 소리가 제일 좋은 안주.',
    category: 'secret',
    hidden: true,
    check: (logs) =>
      flagProgress(
        anyFieldKeywordCount(logs, ['캠핑', '모닥불', '텐트', '불멍']) > 0,
      ),
  },
  {
    id: 'egg-train',
    emoji: '🚂',
    title: '떠나는 열차 안에서',
    desc: '창밖 풍경 + 맥주 한 캔 = 여행의 시작.',
    category: 'secret',
    hidden: true,
    check: (logs) =>
      flagProgress(
        anyFieldKeywordCount(logs, ['기차', 'ktx', '열차', '무궁화', 'srt']) > 0,
      ),
  },
  {
    id: 'egg-pajeon',
    emoji: '🥞',
    title: '비 오는 날의 파전',
    desc: '이 조합은 한국인의 본능.',
    category: 'secret',
    hidden: true,
    check: (logs) =>
      flagProgress(
        logs.some((l) => {
          const hitKw =
            (l.note ?? '').includes('파전') ||
            (l.note ?? '').includes('부침개') ||
            (l.note ?? '').includes('전');
          return (
            hitKw &&
            l.weather === 'rainy' &&
            l.drink_catalog?.category === 'makgeolli'
          );
        }),
      ),
  },
  {
    id: 'egg-xmas-snow',
    emoji: '❄️',
    title: '눈 오는 크리스마스',
    desc: '화이트 크리스마스에 건배라니, 영화 한 편이네요.',
    category: 'secret',
    hidden: true,
    check: (logs) =>
      flagProgress(
        logs.some((l) => {
          const d = new Date(l.logged_at);
          const m = d.getMonth() + 1;
          const day = d.getDate();
          return (m === 12 && (day === 24 || day === 25)) && l.weather === 'snowy';
        }),
      ),
  },
  {
    id: 'egg-storm-soju',
    emoji: '🌪',
    title: '폭우 속 소주',
    desc: '비 오는 밤 초록병. 국민 감성.',
    category: 'secret',
    hidden: true,
    check: (logs) =>
      flagProgress(
        logs.some((l) => {
          const h = new Date(l.logged_at).getHours();
          return (
            (l.weather === 'stormy' || l.weather === 'rainy') &&
            l.drink_catalog?.category === 'soju' &&
            h >= 20
          );
        }),
      ),
  },
  {
    id: 'egg-double-haejang',
    emoji: '🌅',
    title: '해장의 해장',
    desc: '그게 해장인지 연장인지…',
    category: 'secret',
    hidden: true,
    check: (logs) => {
      // 같은 날 새벽(0~5시) + 오전(7~11시) 기록이 모두 있는지
      const byDay: Record<string, { dawn: boolean; morning: boolean }> = {};
      logs.forEach((l) => {
        const d = new Date(l.logged_at);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        if (!byDay[key]) byDay[key] = { dawn: false, morning: false };
        const h = d.getHours();
        if (h >= 0 && h < 5) byDay[key].dawn = true;
        if (h >= 7 && h < 11) byDay[key].morning = true;
      });
      const hit = Object.values(byDay).some((v) => v.dawn && v.morning);
      return flagProgress(hit);
    },
  },
  {
    id: 'egg-wolha',
    emoji: '🌙',
    title: '월하독작(月下獨酌)',
    desc: '이백도 이랬겠죠. 달이 친구였다는데.',
    category: 'secret',
    hidden: true,
    check: (logs) =>
      flagProgress(
        logs.some((l) => {
          const h = new Date(l.logged_at).getHours();
          return (
            l.mood === 'alone' &&
            (h >= 22 || h < 3)
          );
        }),
      ),
  },
  {
    id: 'egg-escaper',
    emoji: '🏃',
    title: '회식 도망자',
    desc: '짧은 기록 = 긴 밤의 증거.',
    category: 'secret',
    hidden: true,
    check: (logs) =>
      flagProgress(
        logs.some((l) => {
          const h = new Date(l.logged_at).getHours();
          return l.mood === 'party' && h >= 23 && (l.note ?? '').length > 0 && (l.note ?? '').length <= 10;
        }),
      ),
  },
  {
    id: 'egg-morning',
    emoji: '🍳',
    title: '아침부터 이러기?',
    desc: '오늘 휴가인 거 맞죠…?',
    category: 'secret',
    hidden: true,
    check: (logs) =>
      flagProgress(
        logs.some((l) => {
          const d = new Date(l.logged_at);
          const h = d.getHours();
          const wd = d.getDay();
          return h >= 7 && h < 10 && wd >= 1 && wd <= 5;
        }),
      ),
  },
  {
    id: 'egg-chimaek',
    emoji: '🍗',
    title: '치맥 정석',
    desc: '국룰은 국룰.',
    category: 'secret',
    hidden: true,
    check: (logs) =>
      flagProgress(
        logs.some((l) =>
          l.drink_catalog?.category === 'beer' &&
          ['치킨', '후라이드', '양념', '뿌링', '교촌', 'bhc', 'bbq'].some((k) =>
            (l.note ?? '').toLowerCase().includes(k.toLowerCase()),
          ),
        ),
      ),
  },
  {
    id: 'egg-sashimi',
    emoji: '🐟',
    title: '회와 소주',
    desc: '바다의 맛과 초록병.',
    category: 'secret',
    hidden: true,
    check: (logs) =>
      flagProgress(
        logs.some((l) =>
          l.drink_catalog?.category === 'soju' &&
          ['회', '사시미', '광어', '연어', '참치', '우럭', '도미'].some((k) =>
            (l.note ?? '').includes(k),
          ),
        ),
      ),
  },
  {
    id: 'egg-cold-beer',
    emoji: '🧊',
    title: '얼죽맥',
    desc: '얼어 죽어도 맥주.',
    category: 'secret',
    hidden: true,
    check: (logs) =>
      flagProgress(
        logs.some(
          (l) =>
            l.drink_catalog?.category === 'beer' &&
            l.temperature != null &&
            l.temperature <= 5,
        ),
      ),
  },
];

// ── 라벨 / 헬퍼 ───────────────────────────────────────────────
export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  logging: '기록',
  streak: '연속 · 절주',
  variety: '다양성',
  mastery: '주종 숙련',
  time: '시간대',
  weather: '날씨 연관',
  social: '분위기',
  location: '장소',
  special_day: '특별한 날',
  secret: '숨겨진 업적',
};

/** 숨김 업적의 잠금 상태 표시용 변환 */
function maskHidden<T extends Achievement & { unlocked: boolean }>(a: T): T {
  if (!a.hidden || a.unlocked) return a;
  return {
    ...a,
    emoji: '🔒',
    title: '???',
    desc: '숨겨진 업적 · 조건 미공개',
  };
}

/** 전체 업적 체크 결과 + 통계 */
export function evaluateAchievements(logs: DrinkLog[]) {
  const resultsRaw = ACHIEVEMENTS.map((a) => ({
    ...a,
    ...a.check(logs),
  }));
  const results = resultsRaw.map(maskHidden);

  const unlocked = results.filter((r) => r.unlocked);

  // 이스터에그 통계 (숨김 여부 기준)
  const secretAll = resultsRaw.filter((r) => r.hidden);
  const secretUnlocked = secretAll.filter((r) => r.unlocked);

  return {
    all: results,
    unlockedCount: unlocked.length,
    totalCount: ACHIEVEMENTS.length,
    unlockedPercent: (unlocked.length / ACHIEVEMENTS.length) * 100,
    secretTotal: secretAll.length,
    secretUnlocked: secretUnlocked.length,
  };
}
