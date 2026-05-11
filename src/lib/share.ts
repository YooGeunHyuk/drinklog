// 자랑 카드 v1 — 텍스트 기반 공유 헬퍼.
//
// react-native-view-shot이 아직 없어서 이미지 카드는 v2에서.
// v1은 시스템 Share API로 텍스트 + URL을 카카오톡/메시지/SNS로 전송.
//
// URL은 placeholder. 앱 스토어 출시 후 실제 다운로드 링크로 교체.

import { Share, ShareContent } from 'react-native';

// TODO: 출시 후 실제 앱 스토어/원링크 URL로 교체
const APP_SHARE_URL = 'https://drinklog.app';

interface MonthlyStats {
  bottles: number;
  cost: number;
  days: number;
  nickname?: string;
}

/** 이번 달 통계 자랑 텍스트 */
export function buildMonthlyBrag(stats: MonthlyStats): string {
  return buildPeriodBrag('이번 달', stats);
}

/** 임의 기간 통계 자랑 텍스트 (이번 주 / 이번 달 / 올해 / 전체) */
export function buildPeriodBrag(
  periodLabel: string,
  stats: MonthlyStats,
): string {
  const who = stats.nickname ? `${stats.nickname}님` : '나';
  const bottles = stats.bottles.toFixed(1).replace(/\.0$/, '');
  const lines = [
    `🍶 ${who} ${periodLabel} 음주 기록`,
    ``,
    `· 비운 병: ${bottles}병`,
    `· 마신 날: ${stats.days}일`,
    `· 쓴 금액: ₩${stats.cost.toLocaleString()}`,
    ``,
    `주로(酒路) DRINKLOG로 기록 중`,
    APP_SHARE_URL,
  ];
  return lines.join('\n');
}

/** 레벨업 자랑 텍스트 */
export function buildLevelUpBrag(opts: {
  level: number;
  title: string;
  emoji: string;
  nickname?: string;
}): string {
  const who = opts.nickname ? `${opts.nickname}님이` : '내가';
  return [
    `🏆 ${who} 새 레벨 달성!`,
    ``,
    `${opts.emoji} Lv ${opts.level} ${opts.title}`,
    ``,
    `주로(酒路) DRINKLOG`,
    APP_SHARE_URL,
  ].join('\n');
}

/** 마일스톤 통과 자랑 텍스트 */
export function buildMilestoneBrag(opts: {
  emoji: string;
  label: string;
  msg: string;
  nickname?: string;
}): string {
  const who = opts.nickname ? `${opts.nickname}님 ` : '';
  return [
    `${opts.emoji} ${who}${opts.label} 돌파!`,
    ``,
    opts.msg,
    ``,
    `주로(酒路) DRINKLOG`,
    APP_SHARE_URL,
  ].join('\n');
}

/** 업적 해금 자랑 텍스트 */
export function buildAchievementBrag(opts: {
  emoji: string;
  title: string;
  desc: string;
  nickname?: string;
}): string {
  const who = opts.nickname ? `${opts.nickname}님 ` : '';
  return [
    `${opts.emoji} ${who}새 업적 해금`,
    ``,
    `「${opts.title}」`,
    opts.desc,
    ``,
    `주로(酒路) DRINKLOG`,
    APP_SHARE_URL,
  ].join('\n');
}

/** 공유 시트 호출. 사용자가 카카오톡/메시지/인스타 등 선택 */
export async function shareBrag(message: string, title?: string): Promise<void> {
  const content: ShareContent = { message, title };
  try {
    await Share.share(content);
  } catch (err) {
    // 사용자가 취소한 경우는 무시. 실제 에러는 호출자에서 처리
    if (err instanceof Error && err.message && !err.message.includes('cancel')) {
      throw err;
    }
  }
}
