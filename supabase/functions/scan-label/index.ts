// Supabase Edge Function: scan-label
// 2-tier 라벨 인식:
//   1단계: 경량 프롬프트로 이름만 추출 → DB 매칭 시도 (저비용)
//   2단계: DB에 없으면 풀 분석으로 상세 정보 추출 (고비용)
//
// 배포:  supabase functions deploy scan-label
// 환경변수: supabase secrets set GEMINI_API_KEY=AIza...

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// 모델 폴백 체인
const MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-2.5-flash',
  'gemini-flash-latest',
];

// ── 1단계: 이름만 빠르게 추출하는 경량 프롬프트 ──
const PROMPT_NAME_ONLY = `이 술 사진에서 제품 이름만 추출하세요.
- 한국어 이름 우선 (예: "참이슬 후레쉬", "카스 프레시", "몬테스 알파")
- 브랜드+제품명을 합쳐서 한 줄로
- 술이 아니면 null
- JSON만 반환: {"name": "..."}`;

// ── 2단계: 풀 분석 프롬프트 (기존) ──
const PROMPT_FULL = `당신은 주류 라벨 인식 전문가입니다. 이미지에 찍힌 술 라벨/병 모양/색깔을 보고 정보를 추출해 JSON으로만 반환하세요.

필드:
- name: 제품 이름 (한국어 우선, 예: "참이슬 후레쉬", "카스", "조니워커 블랙")
- brand: 브랜드명 (예: "하이트진로", "오비맥주", "디아지오")
- category: 다음 중 하나 — "soju" | "beer" | "makgeolli" | "wine" | "whiskey" | "spirits" | "etc"
- abv: 도수(숫자, 단위 %, 없으면 null)
- volume_ml: 용량(숫자, 단위 ml, 없으면 null)
- origin: 원산지/국가 (없으면 null)
- confidence: "high" | "medium" | "low" — 판독 확신도

주의:
- 라벨이 불분명해도 병 모양/색으로 최대한 추측 (예: 초록 병 = 소주일 가능성, 긴 목 투명 병 = 와인)
- 아예 술이 아닌 것 같으면 name을 null로
- 설명/서술 없이 JSON만 반환 (코드블록도 금지)
- 정확히 다음 형태: {"name": "...", "brand": "...", "category": "...", "abv": 16.9, "volume_ml": 360, "origin": "...", "confidence": "high"}`;

interface CallResult {
  ok: boolean;
  text?: string;
  status?: number;
  detail?: string;
  model?: string;
  finishReason?: string;
  promptFeedback?: unknown;
}

async function callGemini(
  model: string,
  imageBase64: string,
  mediaType: string,
  prompt: string,
): Promise<CallResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
  const body: Record<string, unknown> = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mediaType,
              data: imageBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 256, // 이름만 추출할 때는 짧게
      responseMimeType: 'application/json',
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text();
    return { ok: false, status: res.status, detail, model };
  }

  const data = await res.json();
  const candidate = data?.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text ?? '';
  const finishReason = candidate?.finishReason;
  const promptFeedback = data?.promptFeedback;

  return { ok: true, text, model, finishReason, promptFeedback };
}

/** 모델 폴백 체인으로 Gemini 호출 */
async function callGeminiWithFallback(
  imageBase64: string,
  mediaType: string,
  prompt: string,
  maxTokens?: number,
): Promise<{ text: string; model: string } | null> {
  for (const model of MODELS) {
    console.log(`[scan-label] trying model: ${model}`);
    const r = await callGemini(model, imageBase64, mediaType, prompt);

    if (r.ok && r.text && r.text.trim().length > 0) {
      console.log(`[scan-label] success with ${model}, text length=${r.text.length}`);
      return { text: r.text, model };
    }

    console.log(
      `[scan-label] ${model} failed: ok=${r.ok} status=${r.status} finishReason=${r.finishReason}`,
    );
  }
  return null;
}

/** JSON 파싱 헬퍼 */
function parseJson(text: string): Record<string, unknown> | null {
  try {
    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    return JSON.parse(cleaned);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        // ignore
      }
    }
  }
  return null;
}

/** DB에서 이름으로 퍼지 매칭 (ilike + similarity) */
async function searchCatalogByName(name: string) {
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // 1차: 정확한 ilike 매칭
  const { data: exact } = await sb
    .from('drink_catalog')
    .select('*')
    .ilike('name', `%${name}%`)
    .limit(5);

  if (exact && exact.length > 0) {
    return exact;
  }

  // 2차: 이름을 공백 기준으로 나눠서 각각 검색
  const words = name.split(/\s+/).filter((w) => w.length >= 2);
  if (words.length > 0) {
    // 가장 긴 단어부터 검색 (브랜드명일 가능성 높음)
    const sorted = [...words].sort((a, b) => b.length - a.length);
    for (const word of sorted.slice(0, 3)) {
      const { data } = await sb
        .from('drink_catalog')
        .select('*')
        .ilike('name', `%${word}%`)
        .limit(10);
      if (data && data.length > 0) {
        return data;
      }
    }
  }

  return null;
}

Deno.serve(async (req) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const jsonHeaders = { ...cors, 'Content-Type': 'application/json' };

  try {
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY not configured' }),
        { status: 500, headers: jsonHeaders },
      );
    }

    const { imageBase64, mediaType } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'imageBase64 is required' }),
        { status: 400, headers: jsonHeaders },
      );
    }

    const mType = mediaType || 'image/jpeg';

    // ════════════════════════════════════════════
    // 1단계: 경량 프롬프트 — 이름만 추출
    // ════════════════════════════════════════════
    console.log('[scan-label] TIER 1: name-only extraction');
    const nameResult = await callGeminiWithFallback(
      imageBase64,
      mType,
      PROMPT_NAME_ONLY,
    );

    if (nameResult) {
      const nameParsed = parseJson(nameResult.text);
      const extractedName = (nameParsed?.name as string) ?? null;

      if (extractedName) {
        console.log(`[scan-label] extracted name: "${extractedName}"`);

        // DB 매칭 시도
        const matches = await searchCatalogByName(extractedName);
        if (matches && matches.length > 0) {
          console.log(
            `[scan-label] DB match found! ${matches.length} results, best: "${matches[0].name}"`,
          );

          return new Response(
            JSON.stringify({
              mode: 'db_match',
              matched: true,
              catalog: matches[0],
              candidates: matches.slice(0, 5),
              extractedName,
              aiUsed: true,
              aiTier: 'lightweight',
              usedModel: nameResult.model,
            }),
            { status: 200, headers: jsonHeaders },
          );
        }

        console.log('[scan-label] no DB match, proceeding to TIER 2');
      }
    }

    // ════════════════════════════════════════════
    // 2단계: 풀 분석 — DB에 없는 새로운 술
    // ════════════════════════════════════════════
    console.log('[scan-label] TIER 2: full analysis');
    const fullResult = await callGeminiWithFallback(
      imageBase64,
      mType,
      PROMPT_FULL,
    );

    if (!fullResult) {
      return new Response(
        JSON.stringify({ error: 'All Gemini models failed' }),
        { status: 502, headers: jsonHeaders },
      );
    }

    const parsed = parseJson(fullResult.text);
    if (!parsed) {
      return new Response(
        JSON.stringify({
          error: 'Failed to parse AI response',
          rawText: fullResult.text.slice(0, 1000),
          usedModel: fullResult.model,
        }),
        { status: 502, headers: jsonHeaders },
      );
    }

    // 풀 분석 결과에서도 한번 더 DB 매칭 시도
    const fullName = parsed.name as string | null;
    let dbMatch = null;
    if (fullName) {
      const matches = await searchCatalogByName(fullName);
      if (matches && matches.length > 0) {
        dbMatch = matches[0];
      }
    }

    return new Response(
      JSON.stringify({
        mode: dbMatch ? 'db_match_after_full' : 'new_drink',
        matched: !!dbMatch,
        catalog: dbMatch,
        data: parsed,
        aiUsed: true,
        aiTier: 'full',
        usedModel: fullResult.model,
      }),
      { status: 200, headers: jsonHeaders },
    );
  } catch (err: any) {
    console.error('[scan-label] uncaught error:', err);
    return new Response(
      JSON.stringify({
        error: err?.message ?? 'Unknown error',
        stack: err?.stack,
      }),
      { status: 500, headers: jsonHeaders },
    );
  }
});
