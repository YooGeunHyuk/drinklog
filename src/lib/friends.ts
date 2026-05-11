// 친구 시스템 v1 — DB 조회/CRUD 헬퍼.
//
// friend_code(8자리) 기반 친구 추가. 휴대폰 번호 검색은 PIPA 우려로 안 함.
// 친구 상태: pending(요청 보냄) / accepted(양방향 수락) / rejected(거절·취소)

import { supabase } from './supabase';

export type FriendStatus = 'pending' | 'accepted' | 'rejected';

export interface FriendUserSummary {
  id: string;
  nickname: string | null;
  friend_code: string | null;
}

export interface FriendRow {
  id: string;
  user_id: string;
  friend_id: string;
  status: FriendStatus;
  created_at: string;
  /** 상대방 정보 (현재 user 입장에서). join으로 채움 */
  other: FriendUserSummary;
  /** 내가 보낸 요청인가 (true=outgoing, false=incoming) */
  outgoing: boolean;
}

/** 본인의 friend_code 가져오기 — 없으면 server-side에서 trigger가 채워줌 */
export async function getMyFriendCode(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('users')
    .select('friend_code')
    .eq('id', user.id)
    .single();
  return data?.friend_code ?? null;
}

/** 친구 코드로 user 검색 */
export async function findUserByFriendCode(
  code: string,
): Promise<FriendUserSummary | null> {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) return null;
  const { data } = await supabase
    .from('users')
    .select('id, nickname, friend_code')
    .eq('friend_code', trimmed)
    .maybeSingle();
  return data ?? null;
}

/** 친구 요청 보내기 */
export async function sendFriendRequest(targetUserId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인 세션이 없습니다.');
  if (user.id === targetUserId) {
    throw new Error('본인은 친구로 추가할 수 없습니다.');
  }
  // 이미 row 있으면 (취소된 rejected 포함) status를 pending으로 되살림
  const { error } = await supabase.from('friends').upsert(
    {
      user_id: user.id,
      friend_id: targetUserId,
      status: 'pending',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,friend_id' },
  );
  if (error) throw error;
}

/** 받은 요청 수락 — row.user_id가 상대, row.friend_id가 본인 */
export async function acceptFriendRequest(rowId: string): Promise<void> {
  const { error } = await supabase
    .from('friends')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', rowId);
  if (error) throw error;
}

/** 요청 거절 또는 보낸 요청 취소 */
export async function rejectOrCancelRequest(rowId: string): Promise<void> {
  const { error } = await supabase
    .from('friends')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', rowId);
  if (error) throw error;
}

/** 친구 끊기 (양방향 수락된 관계 해제) */
export async function unfriend(rowId: string): Promise<void> {
  const { error } = await supabase.from('friends').delete().eq('id', rowId);
  if (error) throw error;
}

/** 내 친구·요청 전체 조회 (양방향) */
export async function listMyFriends(): Promise<FriendRow[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // 내가 user_id인 row + 내가 friend_id인 row 모두 가져옴
  const { data } = await supabase
    .from('friends')
    .select(
      'id, user_id, friend_id, status, created_at, ' +
        'requester:users!friends_user_id_fkey(id, nickname, friend_code), ' +
        'receiver:users!friends_friend_id_fkey(id, nickname, friend_code)',
    )
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
    .neq('status', 'rejected')
    .order('created_at', { ascending: false });

  if (!data) return [];

  return data.map((row: any) => {
    const outgoing = row.user_id === user.id;
    const other = outgoing ? row.receiver : row.requester;
    return {
      id: row.id,
      user_id: row.user_id,
      friend_id: row.friend_id,
      status: row.status as FriendStatus,
      created_at: row.created_at,
      other: other ?? {
        id: outgoing ? row.friend_id : row.user_id,
        nickname: null,
        friend_code: null,
      },
      outgoing,
    } satisfies FriendRow;
  });
}
