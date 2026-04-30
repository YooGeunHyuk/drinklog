import {
  LEVELS,
  MILESTONES,
  CATEGORY_MILESTONES,
  computeJudoScore,
  computeStreakBonus,
  countSessions,
  countUniqueDrinks,
  judoScoreFromLogs,
  getLevel,
  getNextLevel,
  getLevelProgress,
  getMilestoneProgress,
  getCategoryProgress,
} from '../milestones';
import { DrinkLog, DrinkCategory } from '../../types';

// ── 테스트 픽스처 헬퍼 ──────────────────────────────────────────
function makeLog(overrides: Partial<DrinkLog> = {}): DrinkLog {
  return {
    id: 'log-1',
    user_id: 'user-1',
    catalog_id: 'cat-1',
    logged_at: '2026-04-30T20:00:00.000Z',
    bottles: 1,
    quantity_ml: 360,
    price_paid: null,
    input_method: 'manual' as DrinkLog['input_method'],
    photo_url: null,
    photo_urls: null,
    note: null,
    location: null,
    companions: null,
    mood: null,
    weather: null,
    temperature: null,
    location_name: null,
    created_at: '2026-04-30T20:00:00.000Z',
    drink_catalog: {
      id: 'cat-1',
      name: '참이슬',
      category: 'soju' as DrinkCategory,
      brand: null,
      abv: 16,
      volume_ml: 360,
      avg_price: null,
      origin: null,
      tasting_notes: null,
      barcode: null,
      image_url: null,
      source: 'preset',
      verified: true,
    } as any,
    ...overrides,
  };
}

// ── LEVELS 구조 검증 ───────────────────────────────────────────
describe('LEVELS array', () => {
  it('has exactly 99 levels', () => {
    expect(LEVELS).toHaveLength(99);
  });

  it('rank starts at 1 and increments by 1', () => {
    LEVELS.forEach((lv, i) => {
      expect(lv.rank).toBe(i + 1);
    });
  });

  it('every level has title, desc, emoji, color', () => {
    LEVELS.forEach((lv) => {
      expect(lv.title).toBeTruthy();
      expect(lv.desc).toBeTruthy();
      expect(lv.emoji).toBeTruthy();
      expect(lv.color).toMatch(/^#[0-9A-F]{6}$/i);
      expect(lv.textColor).toMatch(/^#[0-9A-F]{6}$/i);
    });
  });

  it('arc values stay in 1..9', () => {
    LEVELS.forEach((lv) => {
      expect(lv.arc).toBeGreaterThanOrEqual(1);
      expect(lv.arc).toBeLessThanOrEqual(9);
    });
  });

  it('thresholds are monotonically non-decreasing', () => {
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].score).toBeGreaterThanOrEqual(LEVELS[i - 1].score);
    }
  });

  it('Lv 1 starts at score 0', () => {
    expect(LEVELS[0].score).toBe(0);
  });
});

// ── getLevel / getNextLevel / getLevelProgress ─────────────────
describe('getLevel', () => {
  it('score 0 → Lv 1', () => {
    expect(getLevel(0).rank).toBe(1);
  });

  it('negative score still snaps to Lv 1', () => {
    expect(getLevel(-100).rank).toBe(1);
  });

  it('score above Lv 99 threshold → Lv 99', () => {
    expect(getLevel(10_000_000).rank).toBe(99);
  });

  it('score exactly equal to Lv N threshold → Lv N', () => {
    const lv50 = LEVELS[49];
    expect(getLevel(lv50.score).rank).toBe(50);
  });

  it('score one below Lv N threshold → Lv N-1', () => {
    const lv50 = LEVELS[49];
    if (lv50.score > 0) {
      expect(getLevel(lv50.score - 1).rank).toBe(49);
    }
  });
});

describe('getNextLevel', () => {
  it('returns null at or above Lv 99', () => {
    const lv99 = LEVELS[98];
    expect(getNextLevel(lv99.score)).toBeNull();
    expect(getNextLevel(lv99.score + 1_000_000)).toBeNull();
  });

  it('returns Lv 2 when score is just above 0', () => {
    expect(getNextLevel(1)?.rank).toBe(2);
  });
});

describe('getLevelProgress', () => {
  it('exactly at a threshold → 0% progress to next', () => {
    const lv10 = LEVELS[9];
    const p = getLevelProgress(lv10.score);
    expect(p.current.rank).toBe(10);
    expect(p.next?.rank).toBe(11);
    expect(p.progressPercent).toBeCloseTo(0, 1);
  });

  it('halfway between Lv N and Lv N+1 → ~50%', () => {
    const lv10 = LEVELS[9];
    const lv11 = LEVELS[10];
    const halfway = lv10.score + Math.floor((lv11.score - lv10.score) / 2);
    const p = getLevelProgress(halfway);
    expect(p.progressPercent).toBeGreaterThan(45);
    expect(p.progressPercent).toBeLessThan(55);
  });

  it('at max level → 100% and next is null', () => {
    const lv99 = LEVELS[98];
    const p = getLevelProgress(lv99.score);
    expect(p.next).toBeNull();
    expect(p.progressPercent).toBe(100);
  });
});

// ── 점수 계산 ───────────────────────────────────────────────────
describe('computeJudoScore', () => {
  it('1L (1000ml), 1 session, 0 streak, 0 unique = 10 + 100 = 110pt', () => {
    expect(computeJudoScore(1000, 1, 0, 0)).toBe(110);
  });

  it('multi-dimensional formula stacks correctly', () => {
    // 5L + 3 sessions + 1500 bonus + 4 unique
    // 50 + 300 + 1500 + 200 = 2050
    expect(computeJudoScore(5000, 3, 1500, 4)).toBe(2050);
  });

  it('zero inputs → 0', () => {
    expect(computeJudoScore(0, 0, 0, 0)).toBe(0);
  });
});

describe('countSessions', () => {
  it('one log → 1 session', () => {
    expect(countSessions([makeLog()])).toBe(1);
  });

  it('two logs same day → 1 session', () => {
    const logs = [
      makeLog({ id: 'a', logged_at: '2026-04-30T18:00:00Z' }),
      makeLog({ id: 'b', logged_at: '2026-04-30T22:00:00Z' }),
    ];
    expect(countSessions(logs)).toBe(1);
  });

  it('two logs different days → 2 sessions', () => {
    const logs = [
      makeLog({ id: 'a', logged_at: '2026-04-29T20:00:00Z' }),
      makeLog({ id: 'b', logged_at: '2026-04-30T20:00:00Z' }),
    ];
    expect(countSessions(logs)).toBe(2);
  });

  it('empty logs → 0', () => {
    expect(countSessions([])).toBe(0);
  });
});

describe('countUniqueDrinks', () => {
  it('three logs of same catalog_id → 1 unique', () => {
    const logs = [
      makeLog({ id: 'a', catalog_id: 'X' }),
      makeLog({ id: 'b', catalog_id: 'X' }),
      makeLog({ id: 'c', catalog_id: 'X' }),
    ];
    expect(countUniqueDrinks(logs)).toBe(1);
  });

  it('three logs of different catalog_ids → 3 unique', () => {
    const logs = [
      makeLog({ id: 'a', catalog_id: 'A' }),
      makeLog({ id: 'b', catalog_id: 'B' }),
      makeLog({ id: 'c', catalog_id: 'C' }),
    ];
    expect(countUniqueDrinks(logs)).toBe(3);
  });
});

describe('computeStreakBonus', () => {
  it('single day → 0', () => {
    expect(computeStreakBonus([makeLog()])).toBe(0);
  });

  it('two consecutive days → 500', () => {
    const logs = [
      makeLog({ id: 'a', logged_at: '2026-04-29T20:00:00Z' }),
      makeLog({ id: 'b', logged_at: '2026-04-30T20:00:00Z' }),
    ];
    expect(computeStreakBonus(logs)).toBe(500);
  });

  it('7 consecutive days bonus = 0+500+1000+1500+2000+2500+3000 = 10500', () => {
    const logs = Array.from({ length: 7 }, (_, i) => {
      const d = new Date('2026-04-23T20:00:00Z');
      d.setDate(d.getDate() + i);
      return makeLog({ id: `d${i}`, logged_at: d.toISOString() });
    });
    // day1: 0, day2: 500, day3: 1000, day4: 1500, day5: 2000, day6: 2500, day7: 3000
    expect(computeStreakBonus(logs)).toBe(10500);
  });

  it('8th consecutive day still capped at 3000', () => {
    const logs = Array.from({ length: 8 }, (_, i) => {
      const d = new Date('2026-04-23T20:00:00Z');
      d.setDate(d.getDate() + i);
      return makeLog({ id: `d${i}`, logged_at: d.toISOString() });
    });
    // 7-day total 10500 + day8 capped 3000 = 13500
    expect(computeStreakBonus(logs)).toBe(13500);
  });

  it('gap breaks the streak — restarts at 0', () => {
    const logs = [
      makeLog({ id: 'a', logged_at: '2026-04-25T20:00:00Z' }),
      makeLog({ id: 'b', logged_at: '2026-04-26T20:00:00Z' }), // +500
      // gap on 27
      makeLog({ id: 'c', logged_at: '2026-04-28T20:00:00Z' }), // +0 (restart)
    ];
    expect(computeStreakBonus(logs)).toBe(500);
  });

  it('empty logs → 0', () => {
    expect(computeStreakBonus([])).toBe(0);
  });
});

describe('judoScoreFromLogs', () => {
  it('integrates ml, sessions, streak, unique', () => {
    // 2 consecutive days, same catalog, 360ml each = 720ml
    const logs = [
      makeLog({ id: 'a', logged_at: '2026-04-29T20:00:00Z', quantity_ml: 360 }),
      makeLog({ id: 'b', logged_at: '2026-04-30T20:00:00Z', quantity_ml: 360 }),
    ];
    // ml: 720/100 = 7
    // sessions: 2 * 100 = 200
    // streak: 500
    // unique: 1 * 50 = 50
    // total: 757
    expect(judoScoreFromLogs(logs)).toBe(757);
  });

  it('empty logs → 0', () => {
    expect(judoScoreFromLogs([])).toBe(0);
  });
});

// ── 마일스톤 ────────────────────────────────────────────────────
describe('MILESTONES array', () => {
  it('has milestones in increasing ml order', () => {
    for (let i = 1; i < MILESTONES.length; i++) {
      expect(MILESTONES[i].ml).toBeGreaterThan(MILESTONES[i - 1].ml);
    }
  });

  it('every milestone has required fields', () => {
    MILESTONES.forEach((m) => {
      expect(m.ml).toBeGreaterThan(0);
      expect(m.emoji).toBeTruthy();
      expect(m.icon).toBeTruthy();
      expect(m.msg).toBeTruthy();
    });
  });
});

describe('getMilestoneProgress', () => {
  it('0ml → no current, next is the first milestone', () => {
    const p = getMilestoneProgress(0);
    expect(p.current).toBeNull();
    expect(p.next).toBe(MILESTONES[0]);
  });

  it('exactly at first milestone → current is first, next is second', () => {
    const p = getMilestoneProgress(MILESTONES[0].ml);
    expect(p.current).toBe(MILESTONES[0]);
    expect(p.next).toBe(MILESTONES[1]);
  });

  it('beyond last milestone → current is last, next is null, 100%', () => {
    const last = MILESTONES[MILESTONES.length - 1];
    const p = getMilestoneProgress(last.ml * 2);
    expect(p.current).toBe(last);
    expect(p.next).toBeNull();
    expect(p.progressPercent).toBe(100);
  });
});

// ── 카테고리 마일스톤 ──────────────────────────────────────────
describe('CATEGORY_MILESTONES', () => {
  const categories: DrinkCategory[] = [
    'soju', 'beer', 'makgeolli', 'wine', 'whiskey', 'spirits', 'etc',
  ];

  it('has entries for every category', () => {
    categories.forEach((cat) => {
      expect(CATEGORY_MILESTONES[cat]).toBeDefined();
      expect(CATEGORY_MILESTONES[cat].length).toBeGreaterThan(0);
    });
  });

  it('each category list is in increasing ml order', () => {
    categories.forEach((cat) => {
      const list = CATEGORY_MILESTONES[cat];
      for (let i = 1; i < list.length; i++) {
        expect(list[i].ml).toBeGreaterThan(list[i - 1].ml);
      }
    });
  });
});

describe('getCategoryProgress', () => {
  it('0ml → no current, next is first', () => {
    const p = getCategoryProgress('soju', 0);
    expect(p.current).toBeNull();
    expect(p.next).toBe(CATEGORY_MILESTONES.soju[0]);
  });

  it('beyond last category milestone → 100%', () => {
    const list = CATEGORY_MILESTONES.soju;
    const last = list[list.length - 1];
    const p = getCategoryProgress('soju', last.ml * 2);
    expect(p.current).toBe(last);
    expect(p.next).toBeNull();
    expect(p.progressPercent).toBe(100);
  });

  it('halfway between two milestones → ~50% progress', () => {
    const list = CATEGORY_MILESTONES.soju;
    const halfway = list[0].ml + (list[1].ml - list[0].ml) / 2;
    const p = getCategoryProgress('soju', halfway);
    expect(p.progressPercent).toBeGreaterThan(45);
    expect(p.progressPercent).toBeLessThan(55);
  });
});
