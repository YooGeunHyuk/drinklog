// 회식 모드 v2 — 음주 기록에 친구 태깅 (drink_log_companions N:N)
//
// 기존 drink_log.companions (text) 는 친구가 아닌 동행자 free-text fallback.
// 이 모듈은 친구 시스템과 연결된 태깅을 다룬다.

import { supabase } from './supabase';

export interface TaggedFriend {
  user_id: string;
  nickname: string | null;
  tagged_at: string;
}

// 특정 음주 기록의 태그된 친구 목록 (drink_log_companions join users)
export async function getCompanionsForLog(
  drinkLogId: string,
): Promise<TaggedFriend[]> {
  const { data, error } = await supabase
    .from('drink_log_companions')
    .select('companion_user_id, tagged_at, users!drink_log_companions_companion_user_id_fkey(nickname)')
    .eq('drink_log_id', drinkLogId);
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    user_id: row.companion_user_id,
    nickname: row.users?.nickname ?? null,
    tagged_at: row.tagged_at,
  }));
}

// 친구 태깅을 기록에 일괄 설정 (기존 다 삭제 후 새로 INSERT).
// 호출자가 친구만 전달했는지 확인할 책임 — 친구 아닌 user_id 넣어도 INSERT 통과는 함.
export async function setCompanionsForLog(
  drinkLogId: string,
  companionUserIds: string[],
): Promise<void> {
  // 기존 다 삭제
  const { error: delError } = await supabase
    .from('drink_log_companions')
    .delete()
    .eq('drink_log_id', drinkLogId);
  if (delError) throw delError;

  if (companionUserIds.length === 0) return;

  // 새로 INSERT
  const rows = companionUserIds.map((uid) => ({
    drink_log_id: drinkLogId,
    companion_user_id: uid,
  }));
  const { error: insError } = await supabase
    .from('drink_log_companions')
    .insert(rows);
  if (insError) throw insError;
}

// 본인 기록 중 함께 마신 친구 카운트 (자랑 랭킹: "민수와 N병").
// 회식 모드 v2 통계 화면용.
export async function listMyCompanionStats(): Promise<
  Array<{ user_id: string; nickname: string | null; count: number }>
> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // 본인 drink_log들에 태그된 친구별 카운트
  const { data, error } = await supabase
    .from('drink_log_companions')
    .select('companion_user_id, drink_log!inner(user_id), users!drink_log_companions_companion_user_id_fkey(nickname)')
    .eq('drink_log.user_id', user.id);
  if (error) throw error;

  const counts = new Map<string, { nickname: string | null; count: number }>();
  for (const row of (data ?? []) as any[]) {
    const uid = row.companion_user_id;
    const entry = counts.get(uid);
    if (entry) {
      entry.count += 1;
    } else {
      counts.set(uid, {
        nickname: row.users?.nickname ?? null,
        count: 1,
      });
    }
  }
  return Array.from(counts.entries())
    .map(([user_id, v]) => ({ user_id, nickname: v.nickname, count: v.count }))
    .sort((a, b) => b.count - a.count);
}

// 본인이 친구의 기록에 태그된 횟수 ("나는 N번 회식 멤버였어!" — 자랑 톤)
export async function countMyTaggedIn(): Promise<number> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from('drink_log_companions')
    .select('*', { count: 'exact', head: true })
    .eq('companion_user_id', user.id);
  if (error) throw error;
  return count ?? 0;
}
