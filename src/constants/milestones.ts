// DRINKLOG (주로) — 음주 여정 레벨 시스템
// ───────────────────────────────────────────────────────────────
// ▸ LEVELS — Lv 1 ~ Lv 99 통합 레벨 (47 뱃지 + 20 훈장 + 32 신규 흑역사)
//   주도 점수 = 누적ml÷100 + 술자리×100 + 연속보너스 + 고유주류×50
//
// ▸ MILESTONES / CATEGORY_MILESTONES — 부피 마일스톤 (그대로 유지)
//
// 기존 BADGES/MEDALS 명칭은 backward compat alias로 노출.

import { DrinkCategory, DrinkLog } from '../types';

// ── 타입 ───────────────────────────────────────────────────────
export interface Milestone {
  ml: number;
  emoji: string;
  icon: string;
  msg: string;
  subMsg?: string;
}

export interface CategoryMilestone {
  ml: number;
  emoji: string;
  icon: string;
  msg: string;
  subMsg?: string;
}

/** 통합 레벨 (Lv 1~99) */
export interface Level {
  rank: number;        // 1..99
  score: number;       // 이 레벨 시작 기준 (주도 점수)
  arc: number;         // 1..9
  emoji: string;
  title: string;
  desc: string;
  color: string;       // BG
  textColor: string;
}

// 호환용 alias
export type Badge = Level;
export type Medal = Level;

// ── Arc 컬러 팔레트 (Earth-tone) ─────────────────────────────
const ARC_COLORS: Record<number, { bg: string; text: string }> = {
  1: { bg: '#E8F5E9', text: '#2E7D32' }, // 모른다 — 새싹 그린
  2: { bg: '#E3F2FD', text: '#1565C0' }, // 배운다 — 페일 블루
  3: { bg: '#FFF8E1', text: '#F57F17' }, // 설친다 — 앰버
  4: { bg: '#FFEBEE', text: '#C62828' }, // 무너진다 — 코럴
  5: { bg: '#ECEFF1', text: '#37474F' }, // 이불킥 — 토프 그레이
  6: { bg: '#E0F2F1', text: '#004D40' }, // 회복한다 — 세이지/티얼
  7: { bg: '#E8EAF6', text: '#1A237E' }, // 즐긴다 — 인디고
  8: { bg: '#D1C4E9', text: '#311B92' }, // 달관한다 — 바이올렛
  9: { bg: '#0D0D2E', text: '#F0C75E' }, // 전설 — 코스믹 + 골드
};

// ── 레벨 임계값 곡선 ─────────────────────────────────────────
// thr(n) = round(30 * (n-1)^2.15)
// Lv  10 ≈ 4,300
// Lv  30 ≈ 40,000
// Lv  50 ≈ 123,000
// Lv  70 ≈ 242,000
// Lv  90 ≈ 384,000
// Lv  99 ≈ 488,000
function levelThreshold(level: number): number {
  if (level <= 1) return 0;
  return Math.round(30 * Math.pow(level - 1, 2.15));
}

// ── 99 레벨 데이터 (rank, arc, emoji, title, desc) ───────────
type LevelSpec = Omit<Level, 'score' | 'color' | 'textColor'>;

const LEVEL_SPECS: LevelSpec[] = [
  // ── Arc 1 · 모른다 (Lv 1–11) ──────────────────────────────
  { rank: 1,  arc: 1, emoji: '🌱', title: '물만 마시던 자',         desc: '술잔을 구경만 하던 시절이 있었죠.' },
  { rank: 2,  arc: 1, emoji: '🤔', title: '첫 잔의 망설임',          desc: '받아든 잔을 한참 들여다본 자.' },
  { rank: 3,  arc: 1, emoji: '🫧', title: '볼 빨간 새내기',          desc: '첫 모금에 볼이 발그레해졌어요.' },
  { rank: 4,  arc: 1, emoji: '🌡', title: '알콜 도수에 놀라는 자',    desc: '"이거 진짜 술이에요?"' },
  { rank: 5,  arc: 1, emoji: '🏁', title: '초보운전 주당',            desc: '자신감이 붙기 시작할 때가 제일 위험해요.' },
  { rank: 6,  arc: 1, emoji: '📚', title: '책으로 배운 주도',         desc: '이론은 빠삭한데 실전에선 좀 흔들려요.' },
  { rank: 7,  arc: 1, emoji: '🙏', title: '받기만 하는 막내',         desc: '따라드릴 줄 몰라 죄송한 자.' },
  { rank: 8,  arc: 1, emoji: '🥂', title: '첫 건배',                  desc: '잔을 맞댄 기억이 시작된 날.' },
  { rank: 9,  arc: 1, emoji: '🍿', title: '안주만 야무지게 먹는 자',   desc: '술보단 안주가 본업인 사람.' },
  { rank: 10, arc: 1, emoji: '🧴', title: '한 잔에 얼굴 바뀌는 자',    desc: '표정 관리에 실패하는 단계.' },
  { rank: 11, arc: 1, emoji: '🌀', title: '선무당이 사람 잡기 전',     desc: '사고 치기 딱 좋은 단계, 조심하세요.' },

  // ── Arc 2 · 배운다 (Lv 12–22) ─────────────────────────────
  { rank: 12, arc: 2, emoji: '🍶', title: '첫 병의 추억',             desc: '처음 한 병을 혼자 비운 그날.' },
  { rank: 13, arc: 2, emoji: '🙇', title: '두 손으로 따르는 견습',     desc: '잔을 받고 따르는 예절을 처음 배웠어요.' },
  { rank: 14, arc: 2, emoji: '🪞', title: '선배의 잔을 보고 배우는 자', desc: '저렇게 마시면 안 되는구나, 차차 알아갑니다.' },
  { rank: 15, arc: 2, emoji: '👀', title: '빈 잔을 먼저 발견하는 자',   desc: '선배 잔이 비기 전 손이 가는 자.' },
  { rank: 16, arc: 2, emoji: '🙈', title: '잔 비울 때 고개 돌리는 자',  desc: '예절을 몸으로 익힌 자.' },
  { rank: 17, arc: 2, emoji: '🥢', title: '곁들이의 달인',             desc: '안주를 고르는 데 10분 쓰는 단계.' },
  { rank: 18, arc: 2, emoji: '👂', title: '이야기 잘 듣는 막내',        desc: '끄덕임의 미학을 익힌 자.' },
  { rank: 19, arc: 2, emoji: '🎯', title: '잔을 정확히 비우는 명사수',  desc: '한 방울도 남기지 않는 기술을 터득했어요.' },
  { rank: 20, arc: 2, emoji: '🍻', title: '일곱 잔의 여정',            desc: '한 주의 끝을 닫는 법을 배운다.' },
  { rank: 21, arc: 2, emoji: '🪟', title: '조용한 단골',               desc: '인사 없이도 자리를 잡는 사람.' },
  { rank: 22, arc: 2, emoji: '🪑', title: '모서리 자리의 주인',         desc: '구석 자리가 제일 편해진 단계.' },

  // ── Arc 3 · 설친다 (Lv 23–33) ─────────────────────────────
  { rank: 23, arc: 3, emoji: '🏺', title: '주도(酒道)에 눈뜬 자',      desc: '경지에 올랐어요. (본인 피셜)' },
  { rank: 24, arc: 3, emoji: '⚗️', title: '맛을 탐구하는 자',          desc: '같은 술을 온도별로 마셔보기 시작함.' },
  { rank: 25, arc: 3, emoji: '💸', title: '"내가 살게" 외치는 자',      desc: '다음날 통장을 보고 후회.' },
  { rank: 26, arc: 3, emoji: '🍾', title: '한 병이 가벼운 견습',        desc: '이제 한 병쯤은 그냥 워밍업이에요.' },
  { rank: 27, arc: 3, emoji: '🎤', title: '갑자기 노래방 가자는 자',     desc: '자정 직전의 호기.' },
  { rank: 28, arc: 3, emoji: '🔨', title: '두 병을 예열로 쓰는 자',      desc: '본 경기는 세 병째부터 시작.' },
  { rank: 29, arc: 3, emoji: '📣', title: '친구 다 부르는 자',           desc: '새벽에 단톡방을 폭격하는 사람.' },
  { rank: 30, arc: 3, emoji: '🌃', title: '단골의 자격',                desc: '메뉴판 없이 시키는 경지.' },
  { rank: 31, arc: 3, emoji: '🎖', title: '어딜 가든 자리 있는 자',     desc: '단골 가게마다 자리가 비어 있어요.' },
  { rank: 32, arc: 3, emoji: '🕯', title: '늦은 밤의 고정석',           desc: '자정 넘어도 자리가 비어있는 사람.' },
  { rank: 33, arc: 3, emoji: '🤧', title: '환절기의 단골',               desc: '재채기 사이로 한 잔. 알러지인지 술 탓인지.' },

  // ── Arc 4 · 무너진다 (Lv 34–44) ────────────────────────────
  { rank: 34, arc: 4, emoji: '😵‍💫', title: '눈이 풀린 장인',          desc: '흐릿한 눈 속에 진심이 보임.' },
  { rank: 35, arc: 4, emoji: '🙅', title: '"나 안 취했어" 선언가',      desc: '부정이 강해질수록 취했다는 증거예요.' },
  { rank: 36, arc: 4, emoji: '🎶', title: '갑자기 노래 시작하는 자',     desc: '안 시켜도 시작함.' },
  { rank: 37, arc: 4, emoji: '🥴', title: '말이 꼬이는 명인',            desc: '할 말은 많지만 갈 길을 잃어 도착하지 못해요.' },
  { rank: 38, arc: 4, emoji: '🔁', title: '했던 말 또 하는 자',          desc: '이 얘기 아까도 했잖아요. 7번째…8번…9번…' },
  { rank: 39, arc: 4, emoji: '📲', title: '연락처 뒤지는 자',            desc: '"그 사람한테 연락해야겠다…"' },
  { rank: 40, arc: 4, emoji: '🦆', title: '갈지자 보행 마스터',          desc: '직선 보행은 초심자의 영역이에요.' },
  { rank: 41, arc: 4, emoji: '📱', title: '새벽 3시의 작문가',           desc: '다음날 이불킥의 재료를 만드는 자.' },
  { rank: 42, arc: 4, emoji: '😭', title: '갑자기 눈물 차는 자',          desc: '노래가 너무 슬퍼서.' },
  { rank: 43, arc: 4, emoji: '📞', title: '통화하다 잠드는 자',           desc: '"어… 응… 흠…" zzz.' },
  { rank: 44, arc: 4, emoji: '🌫', title: '어제가 흐릿한 명인',           desc: '블랙아웃 수집가.' },

  // ── Arc 5 · 이불킥의 아침 (Lv 45–55) ────────────────────────
  { rank: 45, arc: 5, emoji: '🛏', title: '아침 반성 전문가',            desc: '이불 속에서 어제 일이 재생된다.' },
  { rank: 46, arc: 5, emoji: '🦶', title: '이불킥 유단자',                desc: '발차기 3단, 자다가도 튀어나와요.' },
  { rank: 47, arc: 5, emoji: '📤', title: '보낸 문자들을 정독하는 자',    desc: '"내가 이걸 보냈다고?"' },
  { rank: 48, arc: 5, emoji: '📵', title: '새벽 문자의 주인',             desc: '발송 취소가 없는 게 원망스러운 아침.' },
  { rank: 49, arc: 5, emoji: '💬', title: '어제 단톡 들춰보는 자',         desc: '차마 스크롤이 안 내려감.' },
  { rank: 50, arc: 5, emoji: '🚕', title: '택시기사님의 증언이 필요한 자', desc: '기억의 공백을 외부 증언으로 채워요.' },
  { rank: 51, arc: 5, emoji: '💳', title: '결제 내역 보고 놀라는 자',     desc: '"이게 5차였다고?"' },
  { rank: 52, arc: 5, emoji: '👤', title: '인스타 프사 둘러보는 자',       desc: '어제 만난 사람 다시 확인.' },
  { rank: 53, arc: 5, emoji: '🤐', title: '다시는 안 마신다 맹세한 자',    desc: '이번 주만 일곱 번째 맹세.' },
  { rank: 54, arc: 5, emoji: '🤥', title: '어제의 맹세를 어기는 자',       desc: '스스로 한 약속이 가장 쉽게 깨져요.' },
  { rank: 55, arc: 5, emoji: '📊', title: 'N번째 맹세 카운터',            desc: '본인도 의심하기 시작함.' },

  // ── Arc 6 · 회복한다 (Lv 56–66) ─────────────────────────────
  { rank: 56, arc: 6, emoji: '🍵', title: '해장의 달인',                  desc: '숙취를 디자인하는 경지.' },
  { rank: 57, arc: 6, emoji: '🍜', title: '자정의 라면 마법사',            desc: '술자리 끝에 한 그릇.' },
  { rank: 58, arc: 6, emoji: '📝', title: '장문 사과 전문가',              desc: '새벽에 보낸 글에 대한 속죄의 시간.' },
  { rank: 59, arc: 6, emoji: '💪', title: '다음 날 헬스장 가는 자',         desc: '자기 부정의 정점.' },
  { rank: 60, arc: 6, emoji: '🧘', title: '다음 날 멀쩡 기술자',           desc: '숙취를 먼지처럼 털어내는 법을 익힘.' },
  { rank: 61, arc: 6, emoji: '🩺', title: '간 검사 무사 통과한 자',         desc: '의사가 더 놀람.' },
  { rank: 62, arc: 6, emoji: '🌅', title: '해가 뜨면 다른 사람',            desc: '어젯밤 그 사람과는 별개의 인격이에요.' },
  { rank: 63, arc: 6, emoji: '💧', title: '물 한 잔도 챙기는 자',          desc: '전날의 나에게 미안해서, 잔 옆엔 항상 물 한 잔.' },
  { rank: 64, arc: 6, emoji: '🍂', title: '혀끝에 남는 계절',              desc: '한 모금에 봄·여름·가을·겨울이 스며있다.' },
  { rank: 65, arc: 6, emoji: '🪷', title: '취기 속의 명상가',              desc: '흐린 정신 속에서도 선(禪)이 보여요.' },
  { rank: 66, arc: 6, emoji: '⏰', title: '긴 밤이 짧게 느껴지는 자',      desc: '이 정도 술자리는 익숙해졌어요. 다음 날도 가뿐.' },

  // ── Arc 7 · 즐긴다 (Lv 67–77) ───────────────────────────────
  { rank: 67, arc: 7, emoji: '👃', title: '향부터 보는 감식가',            desc: '잔을 코에 대는 시간이 더 길어졌어요.' },
  { rank: 68, arc: 7, emoji: '🌪', title: '잔을 흔들어보는 자',             desc: '디캔팅 흉내내는 자.' },
  { rank: 69, arc: 7, emoji: '🍷', title: '취향 있는 미식가',              desc: '술과 안주의 궁합을 따지기 시작했어요.' },
  { rank: 70, arc: 7, emoji: '🧀', title: '페어링을 따지는 자',             desc: '"이 술엔 이 치즈가 정답."' },
  { rank: 71, arc: 7, emoji: '🏮', title: '단골집 문을 아는 자',            desc: '문 여는 시간보다 먼저 자리를 잡는 사람.' },
  { rank: 72, arc: 7, emoji: '👨‍🍳', title: '사장님과 인사하는 자',         desc: '메뉴 추천 받는 사이.' },
  { rank: 73, arc: 7, emoji: '✉️', title: '새벽 편지에 답장이 오는 자',     desc: '어제 보낸 마음이 오늘 돌아옵니다.' },
  { rank: 74, arc: 7, emoji: '✈️', title: '해외 가서 현지 술 찾는 자',      desc: '면세점 패스, 동네 가게로.' },
  { rank: 75, arc: 7, emoji: '🪵', title: '오래 묵힐 술을 고르는 자',        desc: '당장의 한 잔보다 10년 후의 한 잔을 봅니다.' },
  { rank: 76, arc: 7, emoji: '📖', title: '취기의 연대기',                 desc: '술자리마다 한 줄씩, 추억이 쌓여갑니다.' },
  { rank: 77, arc: 7, emoji: '🌙', title: '달빛 수집가',                  desc: '마신 밤의 달을 다 기억함.' },

  // ── Arc 8 · 달관한다 (Lv 78–88) ─────────────────────────────
  { rank: 78, arc: 8, emoji: '⚖', title: '잔의 무게를 아는 자',           desc: '한 잔이 가볍지 않다는 걸 깨달은 단계.' },
  { rank: 79, arc: 8, emoji: '⛓', title: '술을 권하지 않는 자',            desc: '권유의 무게를 아는 자.' },
  { rank: 80, arc: 8, emoji: '🏔', title: '산을 비운 자',                  desc: '한라산 한 봉우리를 마셔 없앴어요.' },
  { rank: 81, arc: 8, emoji: '🕰', title: '한 잔으로 두 시간 가는 자',       desc: '시간을 잔에 담아 마심.' },
  { rank: 82, arc: 8, emoji: '🌊', title: '바다를 마신 자',                desc: '바다를 잔에 담을 수 있는 담대함.' },
  { rank: 83, arc: 8, emoji: '🎭', title: '술잔 위의 서사',                desc: '한 잔마다 이야기가 붙는 단계.' },
  { rank: 84, arc: 8, emoji: '✨', title: '별을 담은 잔의 주인',            desc: '잔 속에 별자리가 떠요.' },
  { rank: 85, arc: 8, emoji: '🛋', title: '오래된 친구의 자리',             desc: '약속 없이도 누가 올 줄 아는 사람.' },
  { rank: 86, arc: 8, emoji: '🪶', title: '술을 가르치는 자',               desc: '후배의 첫 잔을 따라주는 단계.' },
  { rank: 87, arc: 8, emoji: '🚶', title: '술잔 위를 걷는 자',              desc: '잔 위를 한 걸음씩, 흔들림이 없습니다.' },
  { rank: 88, arc: 8, emoji: '🌸', title: '계절마다 다른 잔을 드는 자',     desc: '봄엔 가볍게, 여름엔 시원하게, 가을엔 깊게, 겨울엔 따뜻하게.' },

  // ── Arc 9 · 전설 (Lv 89–99) ─────────────────────────────────
  { rank: 89, arc: 9, emoji: '🖌', title: '취필(醉筆)의 장인',             desc: '취기가 오를수록 붓끝이 살아납니다.' },
  { rank: 90, arc: 9, emoji: '🌕', title: '월하독작(月下獨酌)',             desc: '달과 그림자, 그리고 나. 셋이서 마시는 밤.' },
  { rank: 91, arc: 9, emoji: '🎙', title: '건배사의 장인',                desc: '입을 떼면 테이블이 조용해진다.' },
  { rank: 92, arc: 9, emoji: '🍃', title: '잔에 사계를 담는 자',           desc: '한 잔으로 봄을 부르고, 여름을 들이마시고, 가을을 안고, 겨울을 다스립니다.' },
  { rank: 93, arc: 9, emoji: '⛴', title: '새벽을 건너는 뱃사공',           desc: '해 뜨기 전까지 누군가를 데려다준다.' },
  { rank: 94, arc: 9, emoji: '🏯', title: '주막의 전설',                  desc: '이름보다 별명이 유명해진 사람.' },
  { rank: 95, arc: 9, emoji: '🗿', title: '이태백의 술벗',                 desc: '1,300년 시공을 넘나드는 주우(酒友).' },
  { rank: 96, arc: 9, emoji: '🌠', title: '은하수를 한 모금에 담은 자',     desc: '별이 안주로 떨어지는 경지.' },
  { rank: 97, arc: 9, emoji: '🪐', title: '시간을 잊은 자',                 desc: '잔을 드니 시간도 함께 멈춥니다.' },
  { rank: 98, arc: 9, emoji: '🌌', title: '1,200번의 주록(酒錄)',          desc: '기록 자체가 곧 술의 길.' },
  { rank: 99, arc: 9, emoji: '⚫', title: '잔 속에 우주를 담은 자',         desc: '더는 채울 잔도, 마실 술도 없습니다. 잔과 우주가 하나가 된 자리.' },
];

/** 99 레벨 (자동 생성) */
export const LEVELS: Level[] = LEVEL_SPECS.map((s) => ({
  ...s,
  score: levelThreshold(s.rank),
  color: ARC_COLORS[s.arc].bg,
  textColor: ARC_COLORS[s.arc].text,
}));

// ── Backward compat: 기존 BADGES/MEDALS 코드를 깨뜨리지 않도록 alias ─
/** @deprecated use LEVELS instead */
export const BADGES: Level[] = LEVELS;
/** @deprecated MEDALS는 LEVELS에 통합됨. 빈 배열로 유지 (UI 분기 정리용) */
export const MEDALS: Level[] = [];

// ── 주도 점수 계산 (다차원) ────────────────────────────────────
/** 하루 단위 = 한 술자리 */
export function countSessions(logs: DrinkLog[]): number {
  const days = new Set<string>();
  logs.forEach((l) => {
    const d = new Date(l.logged_at);
    days.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  });
  return days.size;
}

/** 고유 카탈로그 수 (다양성) */
export function countUniqueDrinks(logs: DrinkLog[]): number {
  const ids = new Set<string>();
  logs.forEach((l) => {
    if (l.catalog_id) ids.add(l.catalog_id);
  });
  return ids.size;
}

/** 연속 일차 보너스 (1일차 0, 2일차 +500, ..., 7일차+ +3000 캡) */
function streakDayBonus(dayInRun: number): number {
  if (dayInRun <= 1) return 0;
  return Math.min((dayInRun - 1) * 500, 3000);
}

/** 누적 연속-음주 보너스 */
export function computeStreakBonus(logs: DrinkLog[]): number {
  if (logs.length === 0) return 0;
  const dayMs = new Set<number>();
  logs.forEach((l) => {
    const d = new Date(l.logged_at);
    d.setHours(0, 0, 0, 0);
    dayMs.add(d.getTime());
  });
  const sorted = Array.from(dayMs).sort((a, b) => a - b);
  const DAY = 86400000;
  let bonus = 0;
  let runLen = 0;
  let prev: number | null = null;
  for (const ms of sorted) {
    if (prev !== null && ms - prev === DAY) runLen += 1;
    else runLen = 1;
    bonus += streakDayBonus(runLen);
    prev = ms;
  }
  return bonus;
}

/**
 * 주도 점수 (다차원)
 *
 *  = 누적ml ÷ 100              [1L = 10pt]
 *  + 술자리 수 × 100            [1회 = 100pt]
 *  + 연속 음주 보너스
 *  + 고유 카탈로그 수 × 50      [1종 = 50pt]
 */
export function computeJudoScore(
  totalMl: number,
  sessions: number,
  streakBonus = 0,
  uniqueDrinks = 0,
): number {
  return Math.round(
    totalMl / 100 + sessions * 100 + streakBonus + uniqueDrinks * 50,
  );
}

/** 로그에서 직접 주도 점수 산출 (다차원) */
export function judoScoreFromLogs(logs: DrinkLog[]): number {
  const totalMl = logs.reduce((s, l) => {
    const ml = l.quantity_ml ?? (l.drink_catalog?.volume_ml ?? 0) * (l.bottles || 0);
    return s + ml;
  }, 0);
  return computeJudoScore(
    totalMl,
    countSessions(logs),
    computeStreakBonus(logs),
    countUniqueDrinks(logs),
  );
}

// ── Lookup 헬퍼 ────────────────────────────────────────────────
/** 주도 점수에 해당하는 현재 레벨 */
export function getLevel(score: number): Level {
  let level = LEVELS[0];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (score >= LEVELS[i].score) {
      level = LEVELS[i];
      break;
    }
  }
  return level;
}

/** 다음 레벨 (Lv 99 이상이면 null) */
export function getNextLevel(score: number): Level | null {
  for (const l of LEVELS) {
    if (score < l.score) return l;
  }
  return null;
}

/** 현재 → 다음 레벨 진행률 */
export function getLevelProgress(score: number) {
  const current = getLevel(score);
  const next = getNextLevel(score);
  if (!next) return { current, next: null, progressPercent: 100 };
  const span = next.score - current.score;
  const progressPercent = span > 0
    ? Math.min(((score - current.score) / span) * 100, 100)
    : 100;
  return { current, next, progressPercent };
}

// ── Backward compat 함수 alias ─────────────────────────────────
/** @deprecated use getLevel */
export const getCurrentBadge = getLevel;
/** @deprecated use getNextLevel */
export const getNextBadge = getNextLevel;
/** @deprecated use getLevelProgress */
export const getBadgeProgress = getLevelProgress;
/** @deprecated MEDALS 없어짐 — 항상 null */
export function getCurrentMedal(_sessions: number): Level | null { return null; }
/** @deprecated */
export function getNextMedal(_sessions: number): Level | null { return null; }
/** @deprecated */
export function getMedalProgress(_sessions: number) {
  return { current: null as Level | null, next: null as Level | null, progressPercent: 0 };
}

// ── 부피 마일스톤 (전역) ────────────────────────────────────
// 초반(~30L)은 그릇·소주병 갯수 중심으로 촘촘하게.
// 후반은 거대 부피(빌딩/탑/한라산/수영장/화물선) 비교.
// 모두 부피(L) 기준 — kg/무게 비교는 사용 안 함.
export const MILESTONES: Milestone[] = [
  { ml: 360,      emoji: '🥃', icon: '첫 한 병',          msg: '첫 한 병을 비웠어요. 여정이 시작됩니다.' },
  { ml: 500,      emoji: '🍺', icon: '생수 한 병',         msg: '생수 한 병(500ml)을 술로 대체했어요.',           subMsg: '건강은 나중에 생각하기로 해요.' },
  { ml: 750,      emoji: '🍷', icon: '와인 한 병',         msg: '와인 한 병(750ml). 우아한 양이에요.' },
  { ml: 1000,     emoji: '🍶', icon: '1리터',              msg: '1리터 돌파! 우유 한 팩 분량.',                   subMsg: '혈액(약 5L)의 20%에 해당하는 술을 마셨어요.' },
  { ml: 1500,     emoji: '🥛', icon: '1.5리터',            msg: '큰 두유팩(1.5L) 분량.' },
  { ml: 2000,     emoji: '🧴', icon: '콜라 한 통',         msg: '2리터 콜라 한 통만큼 마셨어요.',                 subMsg: '이제 콜라보단 이게 더 친숙할 것 같아요.' },
  { ml: 2500,     emoji: '🍵', icon: '보온병 한 통',        msg: '보온병 한 통(2.5L) 분량.',                       subMsg: '따뜻한 차 대신 따뜻한 한 잔.' },
  { ml: 3000,     emoji: '☕', icon: '주전자 한 가득',      msg: '3L 주전자를 가득 채울 수 있어요.',               subMsg: '소주로 환산하면 약 8병.' },
  { ml: 4000,     emoji: '🥡', icon: '큰 도시락통',         msg: '큰 도시락통(4L) 하나 분량.',                     subMsg: '소주 약 11병에 해당해요.' },
  { ml: 5000,     emoji: '🪣', icon: '가정용 생수통',       msg: '가정용 생수통(5L) 하나를 술로 채웠어요.',        subMsg: '이 정도면 음주 입문 완료.' },
  { ml: 7500,     emoji: '🍲', icon: '큰 냄비',            msg: '큰 냄비(7.5L) — 삼겹살 3인분 파티 정도.',         subMsg: '소주 약 21병에 해당해요.' },
  { ml: 9000,     emoji: '📦', icon: '소주 한 짝',          msg: '소주 25병 — 한 짝(9L)을 다 비웠어요!',           subMsg: '회식 자리 평균 3~4개월치.' },
  { ml: 10000,    emoji: '🚰', icon: '세숫대야',           msg: '세숫대야(10L)를 가득 채울 수 있어요.',           subMsg: '술로 세수하면 피부가 어떻게 될까요? (하지 마세요)' },
  { ml: 12000,    emoji: '🍻', icon: '맥주 한 박스',         msg: '맥주 캔 24개(12L) 한 박스 분량.',                 subMsg: '편의점 박스째로 한 통.' },
  { ml: 15000,    emoji: '🧊', icon: '대형 아이스박스',     msg: '대형 아이스박스(15L)를 가득 채울 수 있어요.',     subMsg: '소주 약 42병 — 한 줄로 세우면 10m, 3층 건물 높이.' },
  { ml: 18000,    emoji: '🥣', icon: '큰 양푼',             msg: '큰 양푼이나 김장 김치통(18L) 하나 분량.' },
  { ml: 20000,    emoji: '🏺', icon: '작은 옹기항아리',      msg: '전통 옹기 항아리(20L) 하나 분량.',                subMsg: '드럼통(200L)의 10%를 혼자 채웠어요.' },
  { ml: 25000,    emoji: '🎒', icon: '꽉 찬 등산 배낭',      msg: '큰 등산 배낭(25L) 하나 분량.',                    subMsg: '히말라야 베이스캠프 짐 정도.' },
  { ml: 30000,    emoji: '🛁', icon: '반신욕 한 번',         msg: '반신욕 한 번(30L)에 들어가는 양.',                subMsg: '소주 약 83병 — 한 줄로 세우면 20m, 6층 건물.' },
  { ml: 40000,    emoji: '🚿', icon: '샤워 한 번',          msg: '일반적인 샤워 한 번(40L) 분량.',                  subMsg: '술로 샤워는 위험해요.' },
  { ml: 50000,    emoji: '🏗️', icon: '10층 건물',          msg: '소주 139병을 한 줄로 세우면 34m — 10층 건물 높이!', subMsg: '드럼통 하나(200L)의 4분의 1.' },
  { ml: 75000,    emoji: '🪵', icon: '오크 캐스크',          msg: '오크 캐스크(75L) 하나 분량 — 위스키 숙성용.',     subMsg: '소주 약 208병에 해당해요.' },
  { ml: 100000,   emoji: '🏢', icon: '63빌딩 3분의 1',      msg: '소주 278병! 63빌딩의 3분의 1 높이(68m).',         subMsg: '욕조 두 개를 채울 수 있어요.' },
  { ml: 150000,   emoji: '🛀', icon: '욕조 한 가득',         msg: '욕조(150L)를 가득 채울 수 있어요.',               subMsg: '이미 남다른 분이에요. 아주 남다른.' },
  { ml: 200000,   emoji: '🛢️', icon: '드럼통 한 통',         msg: '드럼통 하나(200L)를 정확히 채웠어요!',            subMsg: '이제 진짜 주인(酒人).' },
  { ml: 300000,   emoji: '🏙️', icon: '63빌딩',              msg: '소주 833병! 63빌딩(204m) 높이 분량.',             subMsg: '한강 조망권 확보한 것 같은데요.' },
  { ml: 500000,   emoji: '🗼', icon: '에펠탑',              msg: '에펠탑(340m) 높이로 소주병을 쌓을 수 있어요.',    subMsg: '파리에 가본 적 없어도, 에펠탑은 이미 알고 있어요.' },
  { ml: 750000,   emoji: '🌆', icon: '롯데타워',            msg: '롯데타워(555m)를 소주병으로 쌓을 수 있는 양.',    subMsg: '서울에서 제일 높은 술탑.' },
  { ml: 1000000,  emoji: '🛟', icon: 'IBC 산업용 통',        msg: 'IBC 산업용 큰 통(1,000L = 1m³) 하나 분량.',       subMsg: '소주 약 2,778병이에요.' },
  { ml: 2000000,  emoji: '⛰️', icon: '한라산',              msg: '한라산(1,950m)까지 소주병을 쌓을 수 있는 양.',     subMsg: '정상 정복이요? 이미 오래전에 했죠.' },
  { ml: 5000000,  emoji: '🏊', icon: '소형 수영장',         msg: '소형 수영장 하나를 가득 채울 수 있어요.',         subMsg: '입수 금지 구역은 당신에겐 해당되지 않아요.' },
  { ml: 10000000, emoji: '⚓', icon: '소형 화물선',         msg: '소형 화물선 한 척 분량! 항해를 떠나볼까요?',      subMsg: '이미 인간의 범주를 벗어났어요.' },
  { ml: 30000000, emoji: '🌋', icon: '화산 분화구',         msg: '화산 분화구를 가득 채울 수 있어요. 전설 그 자체.', subMsg: '인류 음주 역사에 길이 남을 기록이에요.' },
  { ml: 50000000, emoji: '🪐', icon: '달 표면',             msg: '달 표면에 술 호수를 만들 수 있어요. 신이시여...',  subMsg: '이 앱이 당신을 표현하기엔 부족해요.' },
];

// ── 주종별 마일스톤 — 그대로 유지 ─────────────────────────────
export const CATEGORY_MILESTONES: Record<DrinkCategory, CategoryMilestone[]> = {
  soju: [
    { ml: 360,      emoji: '🥃', icon: '첫 한 병',        msg: '첫 소주 한 병! 여정의 시작이에요.' },
    { ml: 3600,     emoji: '📦', icon: '한 짝!',          msg: '소주 10병 — 한 짝을 다 비웠어요.', subMsg: '이제 회식 자리에서 어색하지 않아요.' },
    { ml: 18000,    emoji: '🎖', icon: '월간 헤비유저',   msg: '소주 50병! 한 달 평균 음주자보다 훨씬 앞서요.', subMsg: '꾸준함은 재능이에요.' },
    { ml: 36000,    emoji: '💯', icon: '소주 100병',      msg: '소주 100병 돌파! 명예의 전당에 오를 만해요.', subMsg: '병으로 한 줄 세우면 약 24.5m.' },
    { ml: 100000,   emoji: '🏢', icon: '63빌딩의 3분의 1', msg: '소주 278병 — 한 줄로 세우면 68m, 63빌딩 1/3 높이.', subMsg: '한강 조망권은 안 따라와요.' },
    { ml: 500000,   emoji: '🗼', icon: '에펠탑 높이',     msg: '소주 1,389병! 한 줄로 세우면 340m — 에펠탑 높이예요! 🗼', subMsg: '파리 안 가도 이미 에펠탑을 세웠어요.' },
    { ml: 750000,   emoji: '🏙', icon: '롯데타워',        msg: '소주 2,083병 — 롯데타워(555m) 높이.', subMsg: '서울에서 제일 높은 술탑.' },
    { ml: 1950000,  emoji: '⛰',  icon: '한라산 정상',     msg: '소주 5,417병! 한라산(1,950m) 정상까지 쌓았어요.', subMsg: '정상 정복? 이미 오래전에 했죠.' },
  ],
  beer: [
    { ml: 500,      emoji: '🍺', icon: '첫 한 잔',        msg: '첫 맥주! 시원한 시작이에요.' },
    { ml: 3300,     emoji: '🍻', icon: '피처 1개',         msg: '3,300cc — 호프집 피처 한 통만큼 마셨어요.' },
    { ml: 10000,    emoji: '🎈', icon: '홈파티 각',        msg: '10L — 친구들 불러 홈파티 가능한 양.' },
    { ml: 30000,    emoji: '🪣', icon: '작은 케그',        msg: '30L — 소형 맥주 케그 하나 분량.' },
    { ml: 50000,    emoji: '🛢', icon: '표준 케그',        msg: '50L — 생맥주집 표준 케그 하나! 창업각.' },
    { ml: 200000,   emoji: '🚀', icon: '드럼통 한 통',     msg: '200L — 드럼통 하나를 맥주로 채웠어요.', subMsg: '거품까지 포함하면 더 많을걸요.' },
    { ml: 500000,   emoji: '🛁', icon: '맥주 욕조',         msg: '500L — 맥주 욕조를 채울 수 있어요.', subMsg: '체코에선 실제로 맥주 목욕을 해요.' },
    { ml: 1000000,  emoji: '🚛', icon: '1톤 맥주',          msg: '1톤 맥주 돌파! 양조장 차리세요.' },
  ],
  makgeolli: [
    { ml: 750,      emoji: '🍶', icon: '첫 한 병',        msg: '첫 막걸리! 전통의 맛이에요.' },
    { ml: 3000,     emoji: '🥢', icon: '술자리 한 판',    msg: '3L — 4병, 친구 넷이서 한 판 할 수 있어요.' },
    { ml: 10000,    emoji: '🥣', icon: '양푼 한 가득',    msg: '10L — 양푼에 가득 담길 분량.' },
    { ml: 30000,    emoji: '🏺', icon: '항아리 한 통',    msg: '30L — 전통 항아리 하나를 채웠어요.' },
    { ml: 100000,   emoji: '📿', icon: '장독대',          msg: '100L — 장독대에 항아리 몇 개 분량.', subMsg: '할머니댁이 부럽지 않아요.' },
    { ml: 300000,   emoji: '🌾', icon: '양조장 한 탱크',  msg: '300L — 막걸리 양조장 소형 발효통 수준.' },
    { ml: 1000000,  emoji: '🚜', icon: '1톤 막걸리',       msg: '1톤 막걸리! 동네 양조장 차려도 돼요.' },
  ],
  wine: [
    { ml: 750,      emoji: '🍷', icon: '첫 한 병',        msg: '첫 와인! 우아한 시작이에요.' },
    { ml: 1500,     emoji: '🍾', icon: '매그넘 1병',      msg: '1.5L — 매그넘 사이즈 하나 분량.' },
    { ml: 9000,     emoji: '📦', icon: '와인 박스',       msg: '9L — 와인 박스 한 상자(12병) 완주.' },
    { ml: 27000,    emoji: '🎁', icon: '선물 박스 3개',   msg: '27L — 와인 박스 3개, 작은 와인 컬렉터예요.' },
    { ml: 100000,   emoji: '🏛', icon: '홈 와인셀러',     msg: '100L — 개인 와인셀러 하나 분량.', subMsg: '집에 소믈리에 한 명 있는 수준.' },
    { ml: 225000,   emoji: '🍇', icon: '보르도 오크통',   msg: '225L — 보르도식 오크통(Barrique) 한 통!', subMsg: '프랑스 와이너리의 기본 단위예요.' },
    { ml: 500000,   emoji: '🏭', icon: '와이너리 탱크',    msg: '500L — 중형 와이너리 스테인리스 탱크 크기.' },
  ],
  whiskey: [
    { ml: 700,      emoji: '🥃', icon: '첫 한 병',        msg: '첫 위스키! 깊은 풍미의 시작이에요.' },
    { ml: 3500,     emoji: '🏠', icon: '홈바 시작',       msg: '5병 — 홈바 라인업을 갖추기 시작했어요.' },
    { ml: 10000,    emoji: '🎁', icon: '위스키 박스',     msg: '10L — 14병, 수집가 입문.' },
    { ml: 50000,    emoji: '🍯', icon: '쿼터 캐스크',     msg: '50L — 미니 오크통(쿼터 캐스크) 하나 분량.' },
    { ml: 200000,   emoji: '🛢', icon: '배럴 (Barrel)',   msg: '200L — 버번 배럴 하나 비웠어요!', subMsg: '전통 미국식 오크통의 표준 크기.' },
    { ml: 250000,   emoji: '🪵', icon: '호그스헤드',       msg: '250L — 호그스헤드(Hogshead) 한 통, 스카치의 기본.' },
    { ml: 500000,   emoji: '🎩', icon: '셰리 버트',        msg: '500L — 셰리 버트(Butt) 하나! 거장의 영역.' },
  ],
  spirits: [
    { ml: 750,      emoji: '🍸', icon: '첫 한 병',        msg: '첫 양주! 세련된 시작이에요.' },
    { ml: 5000,     emoji: '🏠', icon: '홈바 기초',       msg: '5L — 집에 기본 칵테일바 차렸어요.' },
    { ml: 20000,    emoji: '🎊', icon: '칵테일 파티',     msg: '20L — 칵테일 파티 열어도 충분한 양.' },
    { ml: 50000,    emoji: '🥂', icon: '홈바 마스터',     msg: '50L — 친구들이 홈바로 놀러 와요.' },
    { ml: 100000,   emoji: '🧑‍🍳', icon: '바텐더급',        msg: '100L — 바텐더 자격증 따도 될 것 같아요.' },
    { ml: 300000,   emoji: '🍹', icon: '프로 바텐더',      msg: '300L — 가게 차리세요, 프로예요.' },
  ],
  etc: [
    { ml: 500,      emoji: '🥤', icon: '첫 한 잔',        msg: '첫 한 잔! 새로운 장르 탐험을 시작했어요.' },
    { ml: 5000,     emoji: '📈', icon: '5L 돌파',         msg: '5L 돌파! 기타 주종도 꽤 즐기시네요.' },
    { ml: 20000,    emoji: '🎯', icon: '20L 돌파',        msg: '20L 돌파! 다양한 술을 섭렵 중이에요.' },
    { ml: 100000,   emoji: '🌏', icon: '100L 돌파',       msg: '100L! 세계 주류 컬렉터 수준이에요.' },
  ],
};

// ── 카테고리별 진행률 / 전역 마일스톤 진행률 — 기존 함수 유지 ──
export function getCategoryProgress(category: DrinkCategory, categoryMl: number) {
  const list = CATEGORY_MILESTONES[category] ?? [];
  let current: CategoryMilestone | null = null;
  let next: CategoryMilestone | null = list[0] ?? null;

  for (let i = list.length - 1; i >= 0; i--) {
    if (categoryMl >= list[i].ml) {
      current = list[i];
      next = list[i + 1] ?? null;
      break;
    }
  }

  if (list.length > 0 && categoryMl < list[0].ml) {
    current = null;
    next = list[0];
  }

  const base = current?.ml ?? 0;
  const target = next?.ml ?? base;
  const progressPercent =
    next && target > base
      ? Math.min(((categoryMl - base) / (target - base)) * 100, 100)
      : 100;

  return { current, next, progressPercent };
}

export function getMilestoneProgress(totalMl: number) {
  let current: Milestone | null = null;
  let next: Milestone | null = MILESTONES[0];

  for (let i = MILESTONES.length - 1; i >= 0; i--) {
    if (totalMl >= MILESTONES[i].ml) {
      current = MILESTONES[i];
      next = MILESTONES[i + 1] ?? null;
      break;
    }
  }

  if (totalMl < MILESTONES[0].ml) {
    current = null;
    next = MILESTONES[0];
  }

  const progressPercent = next
    ? Math.min(
        ((totalMl - (current?.ml ?? 0)) / (next.ml - (current?.ml ?? 0))) * 100,
        100,
      )
    : 100;

  return { current, next, progressPercent };
}
