// Admin 권한 체크.
// MVP 단계에서는 user.id 화이트리스트로 단순 관리.
// 배포 후엔 public.admin_users 테이블로 옮기는 걸 추천.

import { supabase } from './supabase';

// 관리자 user.id (Supabase auth.users.id UUID)
// 본인 user.id 를 여기에 추가:
//   1) Supabase Dashboard → Authentication → Users 에서 본인 UID 복사
//   2) 또는 앱에서 한 번 로그인 후 콘솔에 찍힌 user.id 복사
const ADMIN_USER_IDS: string[] = [
  'eec10c12-c716-4a04-a5f2-80ac1e4c89dd', // 오너
];

// 관리자 phone (UUID 모를 때 폰 번호로도 허용)
const ADMIN_PHONES: string[] = [
  // TODO: 본인 phone (E.164 포맷, 예: '+821012345678')
];

export async function isCurrentUserAdmin(): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  if (ADMIN_USER_IDS.includes(user.id)) return true;
  if (user.phone && ADMIN_PHONES.includes(user.phone)) return true;

  return false;
}

export function getCurrentUserIdSync(): Promise<string | null> {
  return supabase.auth.getUser().then(({ data: { user } }) => user?.id ?? null);
}
