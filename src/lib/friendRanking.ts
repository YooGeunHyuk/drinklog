// 친구 랭킹 v2 — 본인 + 친구들의 음주 통계를 기간별로 가져옴.
//
// Edge Function `friend-ranking`이 서버에서 집계만 계산해서 반환.
// 클라이언트는 개별 drink_log를 보지 않음 (프라이버시 보호).

import { supabase } from './supabase';

export type RankingPeriod = 'week' | 'month' | 'year' | 'all';

export interface RankingRow {
  user_id: string;
  nickname: string | null;
  isMe: boolean;
  bottles: number;
  days: number;
  totalMl: number;
  cost: number;
}

export interface RankingResult {
  period: RankingPeriod;
  rows: RankingRow[];
}

export async function fetchFriendRanking(
  period: RankingPeriod = 'month',
): Promise<RankingResult> {
  const { data, error } = await supabase.functions.invoke('friend-ranking', {
    body: { period },
  });
  if (error) throw error;
  return data as RankingResult;
}

/** 본인보다 위에 있는 친구 수 (랭킹 표시용) */
export function myRankIndex(rows: RankingRow[]): number {
  return rows.findIndex((r) => r.isMe);
}

/** 6축 — 추후 v3에서 다양성/사치/강도/소셜 별 정렬 추가 가능 */
export type RankingAxis = 'bottles' | 'days' | 'cost' | 'totalMl';

export function sortByAxis(
  rows: RankingRow[],
  axis: RankingAxis,
): RankingRow[] {
  const sorted = [...rows].sort((a, b) => {
    const av = a[axis] as number;
    const bv = b[axis] as number;
    if (bv !== av) return bv - av;
    if (a.isMe) return -1;
    if (b.isMe) return 1;
    return 0;
  });
  return sorted;
}
