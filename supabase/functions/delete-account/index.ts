// Supabase Edge Function: delete-account
// 회원 탈퇴 — 본인 데이터 cascade 삭제 + auth.users 삭제.
// Apple 가이드라인 5.1.1(v) 및 한국 개인정보보호법 요구사항.
//
// 흐름:
//   1) Authorization 헤더에서 JWT 검증 → user_id 추출 (anon key 사용)
//   2) service_role 클라이언트로 본인 데이터 삭제:
//      - drink-photos 스토리지의 {user.id}/* 파일들
//      - drink_log 행
//      - users 행
//   3) auth.admin.deleteUser(user_id) — auth.users에서 최종 제거
//
// 배포: supabase functions deploy delete-account
// 환경변수(자동): SUPABASE_URL · SUPABASE_ANON_KEY · SUPABASE_SERVICE_ROLE_KEY

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  // 1) JWT 검증
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return json({ error: 'missing_authorization' }, 401);
  }
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) {
    return json({ error: 'invalid_token' }, 401);
  }
  const userId = user.id;

  // 2) Admin 클라이언트
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // 2a) Storage — user.id/ 폴더 안의 모든 사진 일괄 제거
    const { data: files } = await admin.storage
      .from('drink-photos')
      .list(userId, { limit: 1000 });
    if (files && files.length > 0) {
      const paths = files.map((f) => `${userId}/${f.name}`);
      await admin.storage.from('drink-photos').remove(paths);
    }

    // 2b) drink_log 행
    await admin.from('drink_log').delete().eq('user_id', userId);

    // 2c) users 행 (auth.users.id 와 동일)
    await admin.from('users').delete().eq('id', userId);

    // 3) auth.users 삭제 — 마이그레이션의 ON DELETE 정책으로
    //    search_miss/drink_request 등에 남은 user_id 참조도 정리됨
    const { error: deleteUserError } =
      await admin.auth.admin.deleteUser(userId);
    if (deleteUserError) throw deleteUserError;

    return json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown';
    return json({ error: 'delete_failed', detail: message }, 500);
  }
});
