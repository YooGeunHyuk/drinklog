// 음주 여정 마일스톤 & 등급 뱃지 시스템

import { DrinkCategory } from '../types';

export interface Milestone {
  ml: number;
  emoji: string;
  icon: string;
  msg: string;        // 달성 축하 메시지
  subMsg?: string;    // 비유/재미 설명 (선택)
}

export interface CategoryMilestone {
  ml: number;
  emoji: string;
  icon: string;
  msg: string;
  subMsg?: string;
}

export interface Badge {
  rank: number;
  ml: number;         // 이 등급 시작 기준 (ml)
  emoji: string;
  title: string;      // 등급 이름
  desc: string;       // 등급 설명 한 줄
  color: string;      // 뱃지 배경색
  textColor: string;  // 뱃지 텍스트색
}

// ── 마일스톤 (25단계) ──────────────────────────────────────────
// 소주병: 360ml, 높이 24.5cm
// 표준 드럼통: 200L / 욕조: 약 220L
// 에펠탑: 330m / 롯데타워: 555m / 한라산: 1,950m
export const MILESTONES: Milestone[] = [
  // ─ 입문 ─
  {
    ml: 360,
    emoji: '🥃',
    icon: '첫 한 병',
    msg: '첫 한 병을 비웠어요. 여정이 시작됩니다.',
  },
  {
    ml: 500,
    emoji: '🍺',
    icon: '생수 한 병',
    msg: '생수 한 병을 술로 대체했어요.',
    subMsg: '건강은 나중에 생각하기로 해요.',
  },
  {
    ml: 1000,
    emoji: '🍶',
    icon: '1리터',
    msg: '1리터 돌파! 이제 진지해지기 시작했네요.',
    subMsg: '혈액(약 5L)의 20%에 해당하는 술을 마셨어요.',
  },
  {
    ml: 2000,
    emoji: '🧴',
    icon: '콜라 한 통',
    msg: '2리터 콜라 한 통만큼 마셨어요.',
    subMsg: '이제 콜라보단 이게 더 친숙할 것 같아요.',
  },
  {
    ml: 3000,
    emoji: '☕',
    icon: '주전자 한 가득',
    msg: '주전자를 가득 채울 수 있어요.',
    subMsg: '아직 갈 길이 멀지만, 시작이 반이에요.',
  },

  // ─ 초급 ─
  {
    ml: 5000,
    emoji: '🪣',
    icon: '가정용 생수통',
    msg: '가정용 생수통(5L) 하나를 술로 채웠어요.',
    subMsg: '이 정도면 음주 입문 완료.',
  },
  {
    ml: 7500,
    emoji: '🍲',
    icon: '큰 냄비',
    msg: '소주 약 21병! 삼겹살 3인분 파티 정도는 커버해요.',
    subMsg: '이제 회식 자리에서 인정받기 시작할 때예요.',
  },
  {
    ml: 10000,
    emoji: '🚰',
    icon: '세숫대야',
    msg: '세숫대야를 가득 채울 수 있는 양이에요.',
    subMsg: '술로 세수하면 피부가 어떻게 될까요? (하지 마세요)',
  },
  {
    ml: 15000,
    emoji: '🧊',
    icon: '대형 아이스박스',
    msg: '소주 약 42병. 한 줄로 세우면 10m — 3층 건물 높이예요!',
    subMsg: '대형 아이스박스 하나를 가득 채울 수 있어요.',
  },

  // ─ 중급 ─
  {
    ml: 20000,
    emoji: '🛢️',
    icon: '드럼통 10%',
    msg: '드럼통(200L)의 10%를 혼자 채웠어요.',
    subMsg: '이 정도면 공사 현장에서도 통할 것 같아요.',
  },
  {
    ml: 30000,
    emoji: '🛁',
    icon: '반신욕',
    msg: '욕조에 15%쯤 잠겨 있는 중. 술 목욕까지는 조금 더!',
    subMsg: '소주 약 83병. 한 줄로 세우면 20m — 6층 건물.',
  },
  {
    ml: 50000,
    emoji: '🏗️',
    icon: '10층 건물',
    msg: '소주 139병을 한 줄로 세우면 34m — 10층 건물 높이예요!',
    subMsg: '드럼통 하나(200L)의 4분의 1을 채웠어요.',
  },
  {
    ml: 75000,
    emoji: '🐄',
    icon: '물탱크',
    msg: '소 먹이는 물탱크 분량을 넘었어요.',
    subMsg: '이 정도면 축산업도 가능할 것 같아요.',
  },

  // ─ 상급 ─
  {
    ml: 100000,
    emoji: '🏢',
    icon: '63빌딩 3분의 1',
    msg: '소주 278병! 한 줄로 세우면 68m — 63빌딩의 3분의 1이에요.',
    subMsg: '욕조를 가득 채울 수 있어요. 술 목욕 가능.',
  },
  {
    ml: 150000,
    emoji: '🛀',
    icon: '욕조 한 가득',
    msg: '욕조를 가득 채울 수 있어요. 술 목욕을 즐겨보세요.',
    subMsg: '이미 남다른 분이에요. 아주 남다른.',
  },
  {
    ml: 200000,
    emoji: '🛢️',
    icon: '드럼통 한 통',
    msg: '드럼통 하나(200L)를 정확히 채웠어요!',
    subMsg: '이제 진짜 주인(酒人)이에요.',
  },
  {
    ml: 300000,
    emoji: '🏙️',
    icon: '63빌딩',
    msg: '소주 833병! 한 줄로 세우면 204m — 63빌딩이에요.',
    subMsg: '이 정도면 한강 조망권 확보한 것 같은데요.',
  },

  // ─ 전설 ─
  {
    ml: 500000,
    emoji: '🗼',
    icon: '에펠탑',
    msg: '소주 1,389병! 한 줄로 세우면 340m — 에펠탑 높이예요! 🗼',
    subMsg: '파리에 가본 적 없어도, 에펠탑은 이미 알고 있어요.',
  },
  {
    ml: 750000,
    emoji: '🏙️',
    icon: '롯데타워',
    msg: '롯데타워(555m)를 소주병으로 쌓을 수 있는 양이에요.',
    subMsg: '서울에서 제일 높은 건물을 당신이 세웠어요.',
  },
  {
    ml: 1000000,
    emoji: '🚗',
    icon: '1톤',
    msg: '1톤 돌파! 중형 승용차 한 대 무게만큼 마셨어요. 🚗',
    subMsg: '이 정도면 소주 회사 주주 자격 있어요.',
  },

  // ─ 신화 ─
  {
    ml: 2000000,
    emoji: '⛰️',
    icon: '한라산',
    msg: '한라산(1,950m)까지 소주병을 쌓을 수 있는 양이에요.',
    subMsg: '정상 정복이요? 이미 오래전에 했죠.',
  },
  {
    ml: 5000000,
    emoji: '🏊',
    icon: '소형 수영장',
    msg: '소형 수영장 하나를 가득 채울 수 있어요. 🏊',
    subMsg: '입수 금지 구역은 당신에겐 해당되지 않아요.',
  },
  {
    ml: 10000000,
    emoji: '⚓',
    icon: '소형 화물선',
    msg: '소형 화물선 한 척 분량! 항해를 떠나볼까요?',
    subMsg: '이미 인간의 범주를 벗어났어요.',
  },
  {
    ml: 30000000,
    emoji: '🌋',
    icon: '화산 분화구',
    msg: '화산 분화구를 가득 채울 수 있어요. 전설 그 자체.',
    subMsg: '인류 음주 역사에 길이 남을 기록이에요.',
  },
  {
    ml: 50000000,
    emoji: '🪐',
    icon: '달 표면',
    msg: '달 표면에 술 호수를 만들 수 있어요. 신이시여...',
    subMsg: '이 앱이 당신을 표현하기엔 부족해요.',
  },
];

// ── 등급 뱃지 (20등급) — B+C 하이브리드 ────────────────────────
// 처음엔 주도(酒道) 수련의 길, 마시다 보면 점점 좀비가 되어 신격에 이른다
export const BADGES: Badge[] = [
  // ─ 🟢 입문 구간 (1–5) ─ 초록 계열
  {
    rank: 1,
    ml: 0,
    emoji: '🌱',
    title: '술을 모르는 자',
    desc: '아직 술의 세계를 구경만 하고 있어요.',
    color: '#E8F5E9',
    textColor: '#2E7D32',
  },
  {
    rank: 2,
    ml: 500,
    emoji: '🫧',
    title: '볼 빨간 입문생',
    desc: '첫 모금에 볼이 발그레해졌어요.',
    color: '#F1F8E9',
    textColor: '#558B2F',
  },
  {
    rank: 3,
    ml: 1000,
    emoji: '📖',
    title: '책으로 배운 자',
    desc: '주도(酒道)의 문을 두드리기 시작했어요.',
    color: '#E0F2F1',
    textColor: '#00695C',
  },
  {
    rank: 4,
    ml: 3000,
    emoji: '🍻',
    title: '첫 회식 살아남은 자',
    desc: '다음날 아침까지 기억이 있으면 통과.',
    color: '#E0F7FA',
    textColor: '#00838F',
  },
  {
    rank: 5,
    ml: 5000,
    emoji: '⚗️',
    title: '주(酒)의 길에 들어선 수련생',
    desc: '맛과 향을 진지하게 탐구하기 시작했어요.',
    color: '#E8EAF6',
    textColor: '#283593',
  },

  // ─ 🟡 숙련 구간 (6–8) ─ 황금 계열
  {
    rank: 6,
    ml: 10000,
    emoji: '🔨',
    title: '한 병이 가벼워진 견습',
    desc: '이제 한 병쯤은 워밍업이에요.',
    color: '#FFF3E0',
    textColor: '#E65100',
  },
  {
    rank: 7,
    ml: 20000,
    emoji: '🏺',
    title: '주도(酒道)에 눈뜬 자',
    desc: '경지에 올랐어요. (본인 피셜)',
    color: '#FFF8E1',
    textColor: '#F57F17',
  },
  {
    rank: 8,
    ml: 30000,
    emoji: '🎯',
    title: '잔을 정확히 비우는 명사수',
    desc: '한 방울도 남기지 않는 기술을 터득했어요.',
    color: '#FFECB3',
    textColor: '#FF6F00',
  },

  // ─ 🟠 풀림 구간 (9–11) ─ 호박색
  {
    rank: 9,
    ml: 50000,
    emoji: '😵‍💫',
    title: '눈이 풀린 장인',
    desc: '마스터하다 보니… 이렇게 됐어요.',
    color: '#FCE4EC',
    textColor: '#C62828',
  },
  {
    rank: 10,
    ml: 75000,
    emoji: '🥴',
    title: '말이 꼬이는 명인',
    desc: '전문가의 길은 험난합니다. 혀도 험난해요.',
    color: '#F3E5F5',
    textColor: '#6A1B9A',
  },
  {
    rank: 11,
    ml: 100000,
    emoji: '🦆',
    title: '갈지자 보행 마스터',
    desc: '직선 보행은 초심자의 영역이에요.',
    color: '#EDE7F6',
    textColor: '#4527A0',
  },

  // ─ 🔴 블랙아웃 구간 (12–13) ─ 회보라
  {
    rank: 12,
    ml: 150000,
    emoji: '🌫',
    title: '어제가 흐릿한 명인',
    desc: '블랙아웃을 수집하기 시작했어요.',
    color: '#ECEFF1',
    textColor: '#37474F',
  },
  {
    rank: 13,
    ml: 200000,
    emoji: '🧟',
    title: '반(半) 좀비 달인',
    desc: '몸은 좀비, 혼은 아직 장인이에요.',
    color: '#263238',
    textColor: '#A5D6A7',
  },

  // ─ 🧟 좀비 구간 (14–16) ─ 어두운 녹색/검정
  {
    rank: 14,
    ml: 300000,
    emoji: '🧟‍♀️',
    title: '완전 좀비화된 주당',
    desc: '더 이상 숙취를 느끼지 못해요. 이미 저 너머예요.',
    color: '#1C2A1C',
    textColor: '#81C784',
  },
  {
    rank: 15,
    ml: 400000,
    emoji: '🕯',
    title: '장례식보다 술자리',
    desc: '관 속에서도 잔을 들 수 있을 것 같아요.',
    color: '#1A1A1A',
    textColor: '#FFA726',
  },
  {
    rank: 16,
    ml: 500000,
    emoji: '🗼',
    title: '에펠탑을 비운 주당',
    desc: '소주 1,389병 — 에펠탑 높이를 비웠어요.',
    color: '#0E1B2E',
    textColor: '#64B5F6',
  },

  // ─ ☠️ 언데드 구간 (17–18) ─ 차콜
  {
    rank: 17,
    ml: 700000,
    emoji: '💀',
    title: '언데드 거장',
    desc: '죽었다 깨어도 한 잔 더 해요.',
    color: '#1A1A2E',
    textColor: '#EF9A9A',
  },
  {
    rank: 18,
    ml: 1000000,
    emoji: '☠️',
    title: '불사(不死) 주도신',
    desc: '이미 인간을 초월했어요. 술이 몸인지, 몸이 술인지.',
    color: '#0D0D0D',
    textColor: '#FFD700',
  },

  // ─ 🌌 신격 구간 (19–20) ─ 자주/금색
  {
    rank: 19,
    ml: 1500000,
    emoji: '🌌',
    title: '신화 속 주당',
    desc: '이름이 전설로 남는 경지예요.',
    color: '#1B0033',
    textColor: '#C5A3FF',
  },
  {
    rank: 20,
    ml: 2000000,
    emoji: '🗻',
    title: '한라산을 비운 자',
    desc: '더 오를 산이 없어요. 이제 별을 비울 차례.',
    color: '#000000',
    textColor: '#F0C75E',
  },
];

// ── 주종별 마일스톤 ──────────────────────────────────────────
// 각 주종의 특성을 살린 비유/단위. 각각 6–8단계씩.
export const CATEGORY_MILESTONES: Record<DrinkCategory, CategoryMilestone[]> = {
  // 🍶 소주 (360ml/병) — 한국 서민 주종, 병·짝 단위
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

  // 🍺 맥주 (500ml/잔) — 부피 단위, 피처·케그 비유
  beer: [
    { ml: 500,      emoji: '🍺', icon: '첫 한 잔',       msg: '첫 맥주! 시원한 시작이에요.' },
    { ml: 3300,     emoji: '🍻', icon: '피처 1개',        msg: '3,300cc — 호프집 피처 한 통만큼 마셨어요.' },
    { ml: 10000,    emoji: '🎉', icon: '홈파티 각',       msg: '10L — 친구들 불러 홈파티 가능한 양.' },
    { ml: 30000,    emoji: '🛢', icon: '작은 케그',       msg: '30L — 소형 맥주 케그 하나 분량.' },
    { ml: 50000,    emoji: '🍺', icon: '표준 케그',       msg: '50L — 생맥주집 표준 케그 하나! 창업각.' },
    { ml: 200000,   emoji: '🛢', icon: '드럼통 한 통',    msg: '200L — 드럼통 하나를 맥주로 채웠어요.', subMsg: '거품까지 포함하면 더 많을걸요.' },
    { ml: 500000,   emoji: '🛁', icon: '맥주 욕조',        msg: '500L — 맥주 욕조를 채울 수 있어요. 🛁', subMsg: '체코에선 실제로 맥주 목욕을 해요.' },
    { ml: 1000000,  emoji: '🚛', icon: '1톤 맥주',         msg: '1톤 맥주 돌파! 양조장 차리세요.' },
  ],

  // 🍶 막걸리 (750ml/병) — 한국 전통, 양푼·항아리·장독
  makgeolli: [
    { ml: 750,      emoji: '🍶', icon: '첫 한 병',        msg: '첫 막걸리! 전통의 맛이에요.' },
    { ml: 3000,     emoji: '🍻', icon: '술자리 한 판',    msg: '3L — 4병, 친구 넷이서 한 판 할 수 있어요.' },
    { ml: 10000,    emoji: '🥣', icon: '양푼 한 가득',    msg: '10L — 양푼에 가득 담길 분량.' },
    { ml: 30000,    emoji: '🏺', icon: '항아리 한 통',    msg: '30L — 전통 항아리 하나를 채웠어요.' },
    { ml: 100000,   emoji: '📿', icon: '장독대',         msg: '100L — 장독대에 항아리 몇 개 분량.', subMsg: '할머니댁이 부럽지 않아요.' },
    { ml: 300000,   emoji: '🌾', icon: '양조장 한 탱크',  msg: '300L — 막걸리 양조장 소형 발효통 수준.' },
    { ml: 1000000,  emoji: '🚜', icon: '1톤 막걸리',       msg: '1톤 막걸리! 동네 양조장 차려도 돼요.' },
  ],

  // 🍷 와인 (750ml/병) — 서양식, 매그넘·박스·셀러·오크통
  wine: [
    { ml: 750,      emoji: '🍷', icon: '첫 한 병',        msg: '첫 와인! 우아한 시작이에요.' },
    { ml: 1500,     emoji: '🍾', icon: '매그넘 1병',      msg: '1.5L — 매그넘 사이즈 하나 분량.' },
    { ml: 9000,     emoji: '📦', icon: '와인 박스',       msg: '9L — 와인 박스 한 상자(12병) 완주.' },
    { ml: 27000,    emoji: '🎁', icon: '선물 박스 3개',   msg: '27L — 와인 박스 3개, 작은 와인 컬렉터예요.' },
    { ml: 100000,   emoji: '🏠', icon: '홈 와인셀러',     msg: '100L — 개인 와인셀러 하나 분량.', subMsg: '집에 소믈리에 한 명 있는 수준.' },
    { ml: 225000,   emoji: '🛢', icon: '보르도 오크통',   msg: '225L — 보르도식 오크통(Barrique) 한 통!', subMsg: '프랑스 와이너리의 기본 단위예요.' },
    { ml: 500000,   emoji: '🍾', icon: '와이너리 탱크',    msg: '500L — 중형 와이너리 스테인리스 탱크 크기.' },
  ],

  // 🥃 위스키 (700ml/병) — 캐스크 단위, 스카치 용어
  whiskey: [
    { ml: 700,      emoji: '🥃', icon: '첫 한 병',        msg: '첫 위스키! 깊은 풍미의 시작이에요.' },
    { ml: 3500,     emoji: '🏠', icon: '홈바 시작',       msg: '5병 — 홈바 라인업을 갖추기 시작했어요.' },
    { ml: 10000,    emoji: '🎁', icon: '위스키 박스',     msg: '10L — 14병, 수집가 입문.' },
    { ml: 50000,    emoji: '🛢', icon: '쿼터 캐스크',     msg: '50L — 미니 오크통(쿼터 캐스크) 하나 분량.' },
    { ml: 200000,   emoji: '🛢', icon: '배럴 (Barrel)',   msg: '200L — 버번 배럴 하나 비웠어요!', subMsg: '전통 미국식 오크통의 표준 크기.' },
    { ml: 250000,   emoji: '🛢', icon: '호그스헤드',       msg: '250L — 호그스헤드(Hogshead) 한 통, 스카치의 기본.' },
    { ml: 500000,   emoji: '🛢', icon: '셰리 버트',        msg: '500L — 셰리 버트(Butt) 하나! 거장의 영역.' },
  ],

  // 🍸 양주 (750ml/병) — 홈바/바텐더 비유
  spirits: [
    { ml: 750,      emoji: '🍸', icon: '첫 한 병',        msg: '첫 양주! 세련된 시작이에요.' },
    { ml: 5000,     emoji: '🏠', icon: '홈바 기초',       msg: '5L — 집에 기본 칵테일바 차렸어요.' },
    { ml: 20000,    emoji: '🎉', icon: '칵테일 파티',     msg: '20L — 칵테일 파티 열어도 충분한 양.' },
    { ml: 50000,    emoji: '🥂', icon: '홈바 마스터',     msg: '50L — 친구들이 홈바로 놀러 와요.' },
    { ml: 100000,   emoji: '🧑‍🍳', icon: '바텐더급',        msg: '100L — 바텐더 자격증 따도 될 것 같아요.' },
    { ml: 300000,   emoji: '🍹', icon: '프로 바텐더',      msg: '300L — 가게 차리세요, 프로예요.' },
  ],

  // 🍹 기타
  etc: [
    { ml: 500,      emoji: '🍹', icon: '첫 한 잔',        msg: '첫 한 잔! 새로운 장르 탐험을 시작했어요.' },
    { ml: 5000,     emoji: '📈', icon: '5L 돌파',         msg: '5L 돌파! 기타 주종도 꽤 즐기시네요.' },
    { ml: 20000,    emoji: '🎯', icon: '20L 돌파',        msg: '20L 돌파! 다양한 술을 섭렵 중이에요.' },
    { ml: 100000,   emoji: '🌏', icon: '100L 돌파',       msg: '100L! 세계 주류 컬렉터 수준이에요.' },
  ],
};

/**
 * 특정 주종의 현재 달성 마일스톤 + 다음 마일스톤 + 진행률 반환
 */
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

/** 현재 누적량에 해당하는 뱃지 반환 */
export function getCurrentBadge(totalMl: number): Badge {
  let badge = BADGES[0];
  for (let i = BADGES.length - 1; i >= 0; i--) {
    if (totalMl >= BADGES[i].ml) {
      badge = BADGES[i];
      break;
    }
  }
  return badge;
}

/** 다음 뱃지 반환 (없으면 null) */
export function getNextBadge(totalMl: number): Badge | null {
  for (const b of BADGES) {
    if (totalMl < b.ml) return b;
  }
  return null;
}

/** 현재 달성한 마일스톤 + 다음 마일스톤 + 진행률 */
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
