// Supabase Edge Function: friend-ranking
// 본인 + 친구들의 음주 통계를 기간별로 집계.
// 개별 drink_log를 클라이언트에 노출하지 않고 서버에서 합계만 계산.
//
// 입력 (POST body):
//   { period: 'week' | 'month' | 'year' | 'all' }
// 출력:
//   { rows: [{ user_id, nickname, isMe, bottles, days, totalMl, cost }] }
//
// 정렬: bottles 내림차순. 클라이언트에서 다른 축으로 재정렬 가능.
//
// 배포: supabase functions deploy friend-ranking
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

type Period = 'week' | 'month' | 'year' | 'all';

function startOfPeriod(period: Period): string {
  const now = new Date();
  switch (period) {
    case 'week': {
      // 이번 주 월요일 00:00
      const day = now.getDay(); // 0=일, 1=월...
      const diff = day === 0 ? 6 : day - 1;
      const d = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - diff,
      );
      return d.toISOString();
    }
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    case 'year':
      return new Date(now.getFullYear(), 0, 1).toISOString();
    case 'all':
    default:
      return new Date(2000, 0, 1).toISOString();
  }
}

interface AggregateRow {
  user_id: string;
  nickname: string | null;
  isMe: boolean;
  bottles: number;
  days: number;
  totalMl: number;
  cost: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  // JWT 검증
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'missing_authorization' }, 401);
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) return json({ error: 'invalid_token' }, 401);
  const me = user.id;

  // period 파싱
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    /* default */
  }
  const period: Period = ['week', 'month', 'year', 'all'].includes(body.period)
    ? body.period
    : 'month';
  const since = startOfPeriod(period);

  // Admin 클라이언트로 친구·로그 조회
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1) accepted 친구 id 모음
  const { data: friendRows } = await admin
    .from('friends')
    .select('user_id, friend_id')
    .or(`user_id.eq.${me},friend_id.eq.${me}`)
    .eq('status', 'accepted');

  const friendIds = new Set<string>();
  (friendRows ?? []).forEach((r: any) => {
    if (r.user_id !== me) friendIds.add(r.user_id);
    if (r.friend_id !== me) friendIds.add(r.friend_id);
  });
  const allIds = [me, ...friendIds];

  // 2) 닉네임 가져오기
  const { data: users } = await admin
    .from('users')
    .select('id, nickname')
    .in('id', allIds);
  const nicknameMap = new Map<string, string | null>();
  (users ?? []).forEach((u: any) => nicknameMap.set(u.id, u.nickname));

  // 3) 기간 내 drink_log 모두 select (catalog volume 함께)
  const { data: logs } = await admin
    .from('drink_log')
    .select('user_id, bottles, price_paid, quantity_ml, logged_at, drink_catalog(volume_ml)')
    .in('user_id', allIds)
    .gte('logged_at', since);

  // 4) user_id별 집계
  const agg = new Map<string, AggregateRow>();
  for (const id of allIds) {
    agg.set(id, {
      user_id: id,
      nickname: nicknameMap.get(id) ?? null,
      isMe: id === me,
      bottles: 0,
      days: 0,
      totalMl: 0,
      cost: 0,
    });
  }
  const dayKeys = new Map<string, Set<string>>(); // user_id → day-keys

  for (const log of logs ?? []) {
    const row = agg.get(log.user_id);
    if (!row) continue;
    row.bottles += Number(log.bottles ?? 0);
    row.cost += Number(log.price_paid ?? 0);
    const ml =
      log.quantity_ml ??
      (log.drink_catalog as any)?.volume_ml ?? 0;
    row.totalMl += Number(ml) * Number(log.bottles ?? 1);
    const d = new Date(log.logged_at);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!dayKeys.has(log.user_id)) dayKeys.set(log.user_id, new Set());
    dayKeys.get(log.user_id)!.add(key);
  }
  for (const [uid, set] of dayKeys) {
    const row = agg.get(uid);
    if (row) row.days = set.size;
  }

  // 5) 정렬 — 병수 내림차순, 동률 시 내가 위
  const rows = Array.from(agg.values()).sort((a, b) => {
    if (b.bottles !== a.bottles) return b.bottles - a.bottles;
    if (a.isMe) return -1;
    if (b.isMe) return 1;
    return 0;
  });

  return json({ period, rows });
});
