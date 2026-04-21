// 음주 여정 마일스톤 & 등급 시스템
// ───────────────────────────────────────────────────────────────
// ▸ 메인 등급 (BADGES, 47단계) — 주도(酒道) 점수 기반
//   주도 점수 = 누적 ml + 술자리 수 × 1,000
//   (위스키·와인처럼 양이 적어도 자주 마시면 성장이 이어지도록)
// ▸ 서브 훈장 (MEDALS, 20단계) — 순수 술자리 수 기반 (酒緣)
// ▸ 부피 마일스톤 (MILESTONES / CATEGORY_MILESTONES) — ml 기반, 그대로 유지

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

/** 메인 등급 뱃지 — 주도 점수(酒道) 기반 */
export interface Badge {
  rank: number;
  score: number;      // 이 등급 시작 기준 (주도 점수)
  arc: number;        // 1~9 아크
  emoji: string;
  title: string;
  desc: string;
  color: string;
  textColor: string;
}

/** 서브 훈장 — 술자리 수 기반 (酒緣) */
export interface Medal {
  rank: number;
  sessions: number;   // 이 훈장 시작 기준 (술자리 수)
  emoji: string;
  title: string;
  desc: string;
  color: string;
  textColor: string;
}

// ── 주도 점수 계산 ──────────────────────────────────────────────
/** 하루 단위를 '한 술자리'로 카운트 (같은 날 여러 잔은 1회) */
export function countSessions(logs: DrinkLog[]): number {
  const days = new Set<string>();
  logs.forEach((l) => {
    const d = new Date(l.logged_at);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    days.add(key);
  });
  return days.size;
}

/** 주도 점수 = ml + sessions × 1000 */
export function computeJudoScore(totalMl: number, sessions: number): number {
  return Math.round(totalMl + sessions * 1000);
}

/** 로그에서 직접 계산 */
export function judoScoreFromLogs(logs: DrinkLog[]): number {
  const totalMl = logs.reduce((s, l) => {
    const ml = l.quantity_ml ?? (l.drink_catalog?.volume_ml ?? 0) * (l.bottles || 0);
    return s + ml;
  }, 0);
  return computeJudoScore(totalMl, countSessions(logs));
}

// ── 메인 등급 뱃지 (47단계, 9 아크) ────────────────────────────
export const BADGES: Badge[] = [
  // ── Arc 1 · 입문 (1–5) — 선무당/초보운전 테마 ─────────────
  { rank: 1,  score: 0,        arc: 1, emoji: '🌱', title: '물만 마시던 자',            desc: '술잔을 구경만 하던 시절이 있었죠.',         color: '#E8F5E9', textColor: '#2E7D32' },
  { rank: 2,  score: 1500,     arc: 1, emoji: '🫧', title: '볼 빨간 새내기',            desc: '첫 모금에 볼이 발그레해졌어요.',            color: '#F1F8E9', textColor: '#558B2F' },
  { rank: 3,  score: 4000,     arc: 1, emoji: '🏁', title: '초보운전 주당',              desc: '자신감이 붙기 시작할 때가 제일 위험해요.',   color: '#E0F2F1', textColor: '#00695C' },
  { rank: 4,  score: 8000,     arc: 1, emoji: '📖', title: '책으로 배운 주도',          desc: '이론은 빠삭한데 실전에선 좀 흔들려요.',     color: '#E0F7FA', textColor: '#00838F' },
  { rank: 5,  score: 14000,    arc: 1, emoji: '🌀', title: '선무당이 사람 잡기 전',     desc: '사고 치기 딱 좋은 단계, 조심하세요.',       color: '#E8EAF6', textColor: '#283593' },

  // ── Arc 2 · 견습 (6–10) — 주도 수련 ─────────────────────────
  { rank: 6,  score: 22000,    arc: 2, emoji: '🍶', title: '첫 병의 추억',              desc: '처음 한 병을 혼자 비운 그날.',              color: '#E3F2FD', textColor: '#1565C0' },
  { rank: 7,  score: 32000,    arc: 2, emoji: '🌙', title: '이태백의 후예',              desc: '달을 벗 삼아 한 잔 기울이는 법을 배움.',    color: '#E1F5FE', textColor: '#0277BD' },
  { rank: 8,  score: 45000,    arc: 2, emoji: '🎓', title: '주도 수련생',                desc: '향을 맡는 법부터 다시 배우는 중.',          color: '#F3E5F5', textColor: '#6A1B9A' },
  { rank: 9,  score: 60000,    arc: 2, emoji: '🥢', title: '곁들이의 달인',              desc: '안주를 고르는 데 10분 쓰는 단계.',          color: '#EDE7F6', textColor: '#4527A0' },
  { rank: 10, score: 80000,    arc: 2, emoji: '🎯', title: '잔을 정확히 비우는 명사수', desc: '한 방울도 남기지 않는 기술을 터득했어요.',   color: '#E8EAF6', textColor: '#303F9F' },

  // ── Arc 3 · 숙련 (11–15) — 눈뜸 ─────────────────────────────
  { rank: 11, score: 105000,   arc: 3, emoji: '🏺', title: '주도(酒道)에 눈뜬 자',      desc: '경지에 올랐어요. (본인 피셜)',              color: '#FFF8E1', textColor: '#F57F17' },
  { rank: 12, score: 135000,   arc: 3, emoji: '⚗️', title: '맛을 탐구하는 자',          desc: '같은 술을 온도별로 마셔보기 시작함.',       color: '#FFF3E0', textColor: '#E65100' },
  { rank: 13, score: 170000,   arc: 3, emoji: '📐', title: '한 병이 가벼운 견습',        desc: '이제 한 병쯤은 그냥 워밍업이에요.',         color: '#FFECB3', textColor: '#FF6F00' },
  { rank: 14, score: 210000,   arc: 3, emoji: '🔨', title: '두 병을 예열로 쓰는 자',    desc: '본 경기는 세 병째부터 시작.',                color: '#FFE0B2', textColor: '#E65100' },
  { rank: 15, score: 255000,   arc: 3, emoji: '🎖', title: '주석(酒席)의 단골',          desc: '어딜 가든 자리가 준비되어 있어요.',         color: '#FFD180', textColor: '#BF360C' },

  // ── Arc 4 · 풀림 (16–22) — 눈풀림/혀꼬임/갈지자/같은말반복/나안취했어 ─
  { rank: 16, score: 305000,   arc: 4, emoji: '😵‍💫', title: '눈이 풀린 장인',             desc: '흐릿하게 눈을 뜨면 진심이 보인다.',         color: '#FFF3E0', textColor: '#D84315' },
  { rank: 17, score: 360000,   arc: 4, emoji: '🥴', title: '말이 꼬인 명인',              desc: '말은 많지만 갈 곳을 잃었어요.',             color: '#FBE9E7', textColor: '#BF360C' },
  { rank: 18, score: 420000,   arc: 4, emoji: '🦆', title: '갈지자 보행 마스터',         desc: '직선 보행은 초심자의 영역이에요.',           color: '#FFEBEE', textColor: '#C62828' },
  { rank: 19, score: 485000,   arc: 4, emoji: '🔁', title: '같은 말 반복 전문가',         desc: '"근데 있잖아…" 를 세 번째 꺼내는 중.',     color: '#FCE4EC', textColor: '#AD1457' },
  { rank: 20, score: 555000,   arc: 4, emoji: '🙅', title: '나 안 취했어',                desc: '제일 취한 사람이 꼭 하는 말.',              color: '#F8BBD0', textColor: '#880E4F' },
  { rank: 21, score: 630000,   arc: 4, emoji: '💊', title: '숙취해소제 단골',             desc: '편의점 이모가 이미 얼굴을 기억해요.',       color: '#E1BEE7', textColor: '#6A1B9A' },
  { rank: 22, score: 710000,   arc: 4, emoji: '🍜', title: '해장 기행 — 동네 한 바퀴',    desc: '해장 지도를 머리에 그리는 단계.',           color: '#D1C4E9', textColor: '#4527A0' },

  // ── Arc 5 · 이불킥 (23–27) — 후회/반성 ──────────────────────
  { rank: 23, score: 795000,   arc: 5, emoji: '🛏', title: '아침 반성 전문가',            desc: '이불 속에서 어제 일이 재생된다.',           color: '#FFF8E1', textColor: '#5D4037' },
  { rank: 24, score: 885000,   arc: 5, emoji: '🦶', title: '이불킥 유단자',               desc: '발차기 3단, 자다가도 튀어나와요.',          color: '#EFEBE9', textColor: '#3E2723' },
  { rank: 25, score: 980000,   arc: 5, emoji: '📵', title: '새벽 문자의 주인',            desc: '발송 취소가 없는 게 원망스러운 아침.',      color: '#ECEFF1', textColor: '#37474F' },
  { rank: 26, score: 1080000,  arc: 5, emoji: '🕵️', title: '흔적 지우는 자',              desc: '어제의 통화 기록부터 확인하는 습관.',       color: '#CFD8DC', textColor: '#263238' },
  { rank: 27, score: 1185000,  arc: 5, emoji: '🤐', title: '다시는 안 마신다 맹세한 자', desc: '이번 주만 일곱 번째 맹세.',                 color: '#B0BEC5', textColor: '#1A237E' },

  // ── Arc 6 · 회복/장문 (28–32) ───────────────────────────────
  { rank: 28, score: 1295000,  arc: 6, emoji: '🍵', title: '해장의 달인',                 desc: '숙취를 디자인하는 경지.',                    color: '#E0F2F1', textColor: '#004D40' },
  { rank: 29, score: 1410000,  arc: 6, emoji: '📝', title: '장문 사과 전문가',            desc: '새벽 3시에 보낸 문단들.',                    color: '#E0F7FA', textColor: '#006064' },
  { rank: 30, score: 1530000,  arc: 6, emoji: '🧘', title: '다음 날 멀쩡 기술자',         desc: '숙취를 먼지처럼 털어내는 법을 익힘.',        color: '#E8F5E9', textColor: '#1B5E20' },
  { rank: 31, score: 1655000,  arc: 6, emoji: '🎼', title: '세 번째 잔의 교향곡',         desc: '세 잔째부터 예술이 시작된다.',               color: '#F1F8E9', textColor: '#33691E' },
  { rank: 32, score: 1785000,  arc: 6, emoji: '🌌', title: '취기 속의 명상가',            desc: '흐린 정신 속에서도 선(禪)이 보여요.',        color: '#EDE7F6', textColor: '#311B92' },

  // ── Arc 7 · 거장 (33–37) — 월하독작/주경 ───────────────────
  { rank: 33, score: 1920000,  arc: 7, emoji: '🌙', title: '월하독작(月下獨酌)',          desc: '달 아래 혼자 한 잔 기울이는 밤.',            color: '#E8EAF6', textColor: '#1A237E' },
  { rank: 34, score: 2060000,  arc: 7, emoji: '🎻', title: '혼술의 예술가',               desc: '혼자 마시는 시간을 곡처럼 설계함.',          color: '#E3F2FD', textColor: '#0D47A1' },
  { rank: 35, score: 2205000,  arc: 7, emoji: '🖋', title: '주석(酒說)을 남기는 자',      desc: '술자리마다 한 줄 남기는 사람.',              color: '#E1F5FE', textColor: '#01579B' },
  { rank: 36, score: 2355000,  arc: 7, emoji: '🏯', title: '잔 앞에서 시를 짓는 자',      desc: '잔이 비면 행이 바뀌어요.',                   color: '#E0F2F1', textColor: '#004D40' },
  { rank: 37, score: 2510000,  arc: 7, emoji: '📿', title: '주경(酒經)을 읽은 자',        desc: '주도의 경전을 통째로 외운 경지.',           color: '#E8F5E9', textColor: '#1B5E20' },

  // ── Arc 8 · 전설 (38–42) ────────────────────────────────────
  { rank: 38, score: 2670000,  arc: 8, emoji: '🐉', title: '잔을 다루는 용',              desc: '한 잔에 구름이 움직이는 경지.',              color: '#FFF8E1', textColor: '#BF360C' },
  { rank: 39, score: 2835000,  arc: 8, emoji: '🏔', title: '산을 비운 자',                desc: '한라산 한 봉우리를 마셔 없앴어요.',          color: '#FFECB3', textColor: '#E65100' },
  { rank: 40, score: 3005000,  arc: 8, emoji: '🌊', title: '바다를 마신 자',              desc: '바다를 잔에 담을 수 있는 담대함.',           color: '#B3E5FC', textColor: '#01579B' },
  { rank: 41, score: 3180000,  arc: 8, emoji: '🌠', title: '별을 담은 잔의 주인',         desc: '잔 속에 별자리가 떠요.',                     color: '#C5CAE9', textColor: '#1A237E' },
  { rank: 42, score: 3360000,  arc: 8, emoji: '🕊', title: '술잔 위를 걷는 자',           desc: '중력이 비껴가는 단계.',                      color: '#D1C4E9', textColor: '#311B92' },

  // ── Arc 9 · 우주 (43–47) ────────────────────────────────────
  { rank: 43, score: 3545000,  arc: 9, emoji: '🌕', title: '달을 기울이는 자',            desc: '보름달도 당신 잔 앞에선 기울어요.',          color: '#311B92', textColor: '#FFD54F' },
  { rank: 44, score: 3735000,  arc: 9, emoji: '☄️', title: '혜성을 삼킨 자',              desc: '한 모금에 밤하늘이 흔들립니다.',             color: '#1A237E', textColor: '#FFECB3' },
  { rank: 45, score: 3930000,  arc: 9, emoji: '🌀', title: '잔 속에 우주를 담은 자',      desc: '한 잔이 곧 하나의 성계(星界).',              color: '#0D0D2E', textColor: '#C5A3FF' },
  { rank: 46, score: 4130000,  arc: 9, emoji: '🌌', title: '은하의 주막 주인',            desc: '별들이 와서 한 잔씩 시키는 가게.',          color: '#0A0A1F', textColor: '#F0C75E' },
  { rank: 47, score: 4335000,  arc: 9, emoji: '♾', title: '영원의 술잔',                  desc: '마시는 일이 곧 존재의 증명이 된 경지.',      color: '#000000', textColor: '#F0C75E' },
];

// ── 서브 훈장 · 주연(酒緣) 20단계 ──────────────────────────────
// 술자리 수 기반. 양보다 횟수에서 오는 '관계의 기록'.
export const MEDALS: Medal[] = [
  { rank: 1,  sessions: 3,    emoji: '🥂', title: '첫 건배',                    desc: '잔을 맞댄 기억이 시작된 날.',              color: '#E3F2FD', textColor: '#1565C0' },
  { rank: 2,  sessions: 7,    emoji: '🍻', title: '일곱 잔의 여정',            desc: '한 주의 끝을 닫는 법을 배운다.',           color: '#E1F5FE', textColor: '#0277BD' },
  { rank: 3,  sessions: 10,   emoji: '🍶', title: '조용한 단골',                desc: '인사 없이도 자리를 잡는 사람.',            color: '#E0F7FA', textColor: '#00838F' },
  { rank: 4,  sessions: 15,   emoji: '🪑', title: '모서리 자리의 주인',        desc: '구석 자리가 제일 편해진 단계.',            color: '#E0F2F1', textColor: '#00695C' },
  { rank: 5,  sessions: 20,   emoji: '🌃', title: '단골의 자격',                desc: '메뉴판 없이 시키는 경지.',                 color: '#E8F5E9', textColor: '#2E7D32' },
  { rank: 6,  sessions: 30,   emoji: '🍃', title: '환절기의 단골',              desc: '계절 바뀌는 게 잔으로 먼저 느껴진다.',     color: '#F1F8E9', textColor: '#558B2F' },
  { rank: 7,  sessions: 40,   emoji: '🕯', title: '늦은 밤의 고정석',           desc: '자정 넘어도 자리가 비어있는 사람.',        color: '#FFF8E1', textColor: '#F57F17' },
  { rank: 8,  sessions: 50,   emoji: '🏮', title: '반백의 자리',                desc: '절반을 넘긴 단골의 품격.',                 color: '#FFF3E0', textColor: '#E65100' },
  { rank: 9,  sessions: 70,   emoji: '🍵', title: '혀끝에 남는 계절',           desc: '술맛에서 그날의 공기가 보인다.',           color: '#FFECB3', textColor: '#BF360C' },
  { rank: 10, sessions: 100,  emoji: '🎉', title: '백 번의 건배',                desc: '백 번을 마주친 잔의 무게.',                color: '#FFE082', textColor: '#BF360C' },
  { rank: 11, sessions: 150,  emoji: '📖', title: '취기의 연대기',              desc: '술자리마다 장(章)이 쌓인다.',              color: '#FFD180', textColor: '#4E342E' },
  { rank: 12, sessions: 200,  emoji: '🌙', title: '달빛 수집가',                desc: '마신 밤의 달을 다 기억함.',                color: '#EDE7F6', textColor: '#311B92' },
  { rank: 13, sessions: 300,  emoji: '🍂', title: '계절을 두 번 건넌 자',      desc: '같은 봄을 두 번 마셔본 사람.',             color: '#E1BEE7', textColor: '#4A148C' },
  { rank: 14, sessions: 400,  emoji: '🎭', title: '술잔 위의 서사',             desc: '한 잔마다 이야기가 붙는 단계.',            color: '#D1C4E9', textColor: '#311B92' },
  { rank: 15, sessions: 500,  emoji: '🛋', title: '오래된 친구의 자리',        desc: '약속 없이도 누가 올 줄 아는 사람.',        color: '#C5CAE9', textColor: '#1A237E' },
  { rank: 16, sessions: 650,  emoji: '⛴', title: '새벽을 건너는 뱃사공',      desc: '해 뜨기 전까지 누군가를 데려다준다.',      color: '#9FA8DA', textColor: '#0D47A1' },
  { rank: 17, sessions: 800,  emoji: '🏯', title: '주막의 전설',                desc: '이름보다 별명이 유명해진 사람.',           color: '#7986CB', textColor: '#FFF8E1' },
  { rank: 18, sessions: 950,  emoji: '🍃', title: '잔에 사계를 담는 자',       desc: '봄 여름 가을 겨울, 다 마셔봄.',            color: '#5C6BC0', textColor: '#FFF3E0' },
  { rank: 19, sessions: 1100, emoji: '🎙', title: '건배사의 장인',              desc: '입을 떼면 테이블이 조용해진다.',           color: '#3949AB', textColor: '#FFECB3' },
  { rank: 20, sessions: 1200, emoji: '🌌', title: '1,200번의 주록(酒錄)',       desc: '기록 자체가 곧 술의 길.',                  color: '#0D0D2E', textColor: '#F0C75E' },
];

// ── 부피 마일스톤 (기존 유지) ─────────────────────────────────
// 소주병: 360ml, 높이 24.5cm · 드럼통: 200L · 욕조: 약 220L
// 에펠탑: 330m · 롯데타워: 555m · 한라산: 1,950m
export const MILESTONES: Milestone[] = [
  { ml: 360,      emoji: '🥃', icon: '첫 한 병',        msg: '첫 한 병을 비웠어요. 여정이 시작됩니다.' },
  { ml: 500,      emoji: '🍺', icon: '생수 한 병',       msg: '생수 한 병을 술로 대체했어요.',                   subMsg: '건강은 나중에 생각하기로 해요.' },
  { ml: 1000,     emoji: '🍶', icon: '1리터',            msg: '1리터 돌파! 이제 진지해지기 시작했네요.',         subMsg: '혈액(약 5L)의 20%에 해당하는 술을 마셨어요.' },
  { ml: 2000,     emoji: '🧴', icon: '콜라 한 통',       msg: '2리터 콜라 한 통만큼 마셨어요.',                  subMsg: '이제 콜라보단 이게 더 친숙할 것 같아요.' },
  { ml: 3000,     emoji: '☕', icon: '주전자 한 가득',   msg: '주전자를 가득 채울 수 있어요.',                    subMsg: '아직 갈 길이 멀지만, 시작이 반이에요.' },
  { ml: 5000,     emoji: '🪣', icon: '가정용 생수통',    msg: '가정용 생수통(5L) 하나를 술로 채웠어요.',         subMsg: '이 정도면 음주 입문 완료.' },
  { ml: 7500,     emoji: '🍲', icon: '큰 냄비',          msg: '소주 약 21병! 삼겹살 3인분 파티 정도는 커버해요.', subMsg: '이제 회식 자리에서 인정받기 시작할 때예요.' },
  { ml: 10000,    emoji: '🚰', icon: '세숫대야',         msg: '세숫대야를 가득 채울 수 있는 양이에요.',          subMsg: '술로 세수하면 피부가 어떻게 될까요? (하지 마세요)' },
  { ml: 15000,    emoji: '🧊', icon: '대형 아이스박스',  msg: '소주 약 42병. 한 줄로 세우면 10m — 3층 건물 높이!', subMsg: '대형 아이스박스 하나를 가득 채울 수 있어요.' },
  { ml: 20000,    emoji: '🛢️', icon: '드럼통 10%',       msg: '드럼통(200L)의 10%를 혼자 채웠어요.',              subMsg: '이 정도면 공사 현장에서도 통할 것 같아요.' },
  { ml: 30000,    emoji: '🛁', icon: '반신욕',           msg: '욕조에 15%쯤 잠겨 있는 중. 술 목욕까지는 조금 더!', subMsg: '소주 약 83병 — 한 줄로 세우면 20m, 6층 건물.' },
  { ml: 50000,    emoji: '🏗️', icon: '10층 건물',        msg: '소주 139병을 한 줄로 세우면 34m — 10층 건물 높이!', subMsg: '드럼통 하나(200L)의 4분의 1을 채웠어요.' },
  { ml: 75000,    emoji: '🐄', icon: '물탱크',           msg: '소 먹이는 물탱크 분량을 넘었어요.',                subMsg: '이 정도면 축산업도 가능할 것 같아요.' },
  { ml: 100000,   emoji: '🏢', icon: '63빌딩 3분의 1',   msg: '소주 278병! 한 줄로 세우면 68m — 63빌딩의 3분의 1.', subMsg: '욕조를 가득 채울 수 있어요. 술 목욕 가능.' },
  { ml: 150000,   emoji: '🛀', icon: '욕조 한 가득',     msg: '욕조를 가득 채울 수 있어요. 술 목욕을 즐겨보세요.', subMsg: '이미 남다른 분이에요. 아주 남다른.' },
  { ml: 200000,   emoji: '🛢️', icon: '드럼통 한 통',      msg: '드럼통 하나(200L)를 정확히 채웠어요!',            subMsg: '이제 진짜 주인(酒人)이에요.' },
  { ml: 300000,   emoji: '🏙️', icon: '63빌딩',           msg: '소주 833병! 한 줄로 세우면 204m — 63빌딩이에요.',  subMsg: '이 정도면 한강 조망권 확보한 것 같은데요.' },
  { ml: 500000,   emoji: '🗼', icon: '에펠탑',           msg: '소주 1,389병! 한 줄로 세우면 340m — 에펠탑 높이!', subMsg: '파리에 가본 적 없어도, 에펠탑은 이미 알고 있어요.' },
  { ml: 750000,   emoji: '🏙️', icon: '롯데타워',         msg: '롯데타워(555m)를 소주병으로 쌓을 수 있는 양.',     subMsg: '서울에서 제일 높은 건물을 당신이 세웠어요.' },
  { ml: 1000000,  emoji: '🚗', icon: '1톤',              msg: '1톤 돌파! 중형 승용차 한 대 무게만큼 마셨어요.',   subMsg: '이 정도면 소주 회사 주주 자격 있어요.' },
  { ml: 2000000,  emoji: '⛰️', icon: '한라산',           msg: '한라산(1,950m)까지 소주병을 쌓을 수 있는 양.',     subMsg: '정상 정복이요? 이미 오래전에 했죠.' },
  { ml: 5000000,  emoji: '🏊', icon: '소형 수영장',      msg: '소형 수영장 하나를 가득 채울 수 있어요.',          subMsg: '입수 금지 구역은 당신에겐 해당되지 않아요.' },
  { ml: 10000000, emoji: '⚓', icon: '소형 화물선',      msg: '소형 화물선 한 척 분량! 항해를 떠나볼까요?',       subMsg: '이미 인간의 범주를 벗어났어요.' },
  { ml: 30000000, emoji: '🌋', icon: '화산 분화구',      msg: '화산 분화구를 가득 채울 수 있어요. 전설 그 자체.', subMsg: '인류 음주 역사에 길이 남을 기록이에요.' },
  { ml: 50000000, emoji: '🪐', icon: '달 표면',          msg: '달 표면에 술 호수를 만들 수 있어요. 신이시여...',  subMsg: '이 앱이 당신을 표현하기엔 부족해요.' },
];

// ── 주종별 마일스톤 (기존 유지) ───────────────────────────────
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
    { ml: 10000,    emoji: '🎉', icon: '홈파티 각',        msg: '10L — 친구들 불러 홈파티 가능한 양.' },
    { ml: 30000,    emoji: '🛢', icon: '작은 케그',        msg: '30L — 소형 맥주 케그 하나 분량.' },
    { ml: 50000,    emoji: '🍺', icon: '표준 케그',        msg: '50L — 생맥주집 표준 케그 하나! 창업각.' },
    { ml: 200000,   emoji: '🛢', icon: '드럼통 한 통',     msg: '200L — 드럼통 하나를 맥주로 채웠어요.', subMsg: '거품까지 포함하면 더 많을걸요.' },
    { ml: 500000,   emoji: '🛁', icon: '맥주 욕조',         msg: '500L — 맥주 욕조를 채울 수 있어요. 🛁', subMsg: '체코에선 실제로 맥주 목욕을 해요.' },
    { ml: 1000000,  emoji: '🚛', icon: '1톤 맥주',          msg: '1톤 맥주 돌파! 양조장 차리세요.' },
  ],
  makgeolli: [
    { ml: 750,      emoji: '🍶', icon: '첫 한 병',        msg: '첫 막걸리! 전통의 맛이에요.' },
    { ml: 3000,     emoji: '🍻', icon: '술자리 한 판',    msg: '3L — 4병, 친구 넷이서 한 판 할 수 있어요.' },
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
    { ml: 100000,   emoji: '🏠', icon: '홈 와인셀러',     msg: '100L — 개인 와인셀러 하나 분량.', subMsg: '집에 소믈리에 한 명 있는 수준.' },
    { ml: 225000,   emoji: '🛢', icon: '보르도 오크통',   msg: '225L — 보르도식 오크통(Barrique) 한 통!', subMsg: '프랑스 와이너리의 기본 단위예요.' },
    { ml: 500000,   emoji: '🍾', icon: '와이너리 탱크',    msg: '500L — 중형 와이너리 스테인리스 탱크 크기.' },
  ],
  whiskey: [
    { ml: 700,      emoji: '🥃', icon: '첫 한 병',        msg: '첫 위스키! 깊은 풍미의 시작이에요.' },
    { ml: 3500,     emoji: '🏠', icon: '홈바 시작',       msg: '5병 — 홈바 라인업을 갖추기 시작했어요.' },
    { ml: 10000,    emoji: '🎁', icon: '위스키 박스',     msg: '10L — 14병, 수집가 입문.' },
    { ml: 50000,    emoji: '🛢', icon: '쿼터 캐스크',     msg: '50L — 미니 오크통(쿼터 캐스크) 하나 분량.' },
    { ml: 200000,   emoji: '🛢', icon: '배럴 (Barrel)',   msg: '200L — 버번 배럴 하나 비웠어요!', subMsg: '전통 미국식 오크통의 표준 크기.' },
    { ml: 250000,   emoji: '🛢', icon: '호그스헤드',       msg: '250L — 호그스헤드(Hogshead) 한 통, 스카치의 기본.' },
    { ml: 500000,   emoji: '🛢', icon: '셰리 버트',        msg: '500L — 셰리 버트(Butt) 하나! 거장의 영역.' },
  ],
  spirits: [
    { ml: 750,      emoji: '🍸', icon: '첫 한 병',        msg: '첫 양주! 세련된 시작이에요.' },
    { ml: 5000,     emoji: '🏠', icon: '홈바 기초',       msg: '5L — 집에 기본 칵테일바 차렸어요.' },
    { ml: 20000,    emoji: '🎉', icon: '칵테일 파티',     msg: '20L — 칵테일 파티 열어도 충분한 양.' },
    { ml: 50000,    emoji: '🥂', icon: '홈바 마스터',     msg: '50L — 친구들이 홈바로 놀러 와요.' },
    { ml: 100000,   emoji: '🧑‍🍳', icon: '바텐더급',        msg: '100L — 바텐더 자격증 따도 될 것 같아요.' },
    { ml: 300000,   emoji: '🍹', icon: '프로 바텐더',      msg: '300L — 가게 차리세요, 프로예요.' },
  ],
  etc: [
    { ml: 500,      emoji: '🍹', icon: '첫 한 잔',        msg: '첫 한 잔! 새로운 장르 탐험을 시작했어요.' },
    { ml: 5000,     emoji: '📈', icon: '5L 돌파',         msg: '5L 돌파! 기타 주종도 꽤 즐기시네요.' },
    { ml: 20000,    emoji: '🎯', icon: '20L 돌파',        msg: '20L 돌파! 다양한 술을 섭렵 중이에요.' },
    { ml: 100000,   emoji: '🌏', icon: '100L 돌파',       msg: '100L! 세계 주류 컬렉터 수준이에요.' },
  ],
};

// ── Lookup 헬퍼 ─────────────────────────────────────────────────
/** 주도 점수에 해당하는 현재 뱃지 */
export function getCurrentBadge(score: number): Badge {
  let badge = BADGES[0];
  for (let i = BADGES.length - 1; i >= 0; i--) {
    if (score >= BADGES[i].score) {
      badge = BADGES[i];
      break;
    }
  }
  return badge;
}

/** 다음 뱃지 (없으면 null) */
export function getNextBadge(score: number): Badge | null {
  for (const b of BADGES) {
    if (score < b.score) return b;
  }
  return null;
}

/** 뱃지 진행률 (현재 → 다음) */
export function getBadgeProgress(score: number) {
  const current = getCurrentBadge(score);
  const next = getNextBadge(score);
  if (!next) return { current, next: null, progressPercent: 100 };
  const span = next.score - current.score;
  const progressPercent = span > 0 ? Math.min(((score - current.score) / span) * 100, 100) : 100;
  return { current, next, progressPercent };
}

/** 술자리 수에 해당하는 현재 훈장 (없으면 null — 아직 첫 훈장 전) */
export function getCurrentMedal(sessions: number): Medal | null {
  let medal: Medal | null = null;
  for (let i = MEDALS.length - 1; i >= 0; i--) {
    if (sessions >= MEDALS[i].sessions) {
      medal = MEDALS[i];
      break;
    }
  }
  return medal;
}

/** 다음 훈장 (없으면 null) */
export function getNextMedal(sessions: number): Medal | null {
  for (const m of MEDALS) {
    if (sessions < m.sessions) return m;
  }
  return null;
}

/** 훈장 진행률 */
export function getMedalProgress(sessions: number) {
  const current = getCurrentMedal(sessions);
  const next = getNextMedal(sessions);
  if (!next) return { current, next: null, progressPercent: 100 };
  const base = current?.sessions ?? 0;
  const span = next.sessions - base;
  const progressPercent = span > 0 ? Math.min(((sessions - base) / span) * 100, 100) : 0;
  return { current, next, progressPercent };
}

/** 특정 주종의 현재 달성 마일스톤 + 다음 마일스톤 + 진행률 */
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

/** 현재 달성한 부피 마일스톤 + 다음 마일스톤 + 진행률 */
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
