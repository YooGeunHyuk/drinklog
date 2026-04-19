// ============================================
// Open Food Facts API 연동
// ============================================
// 전 세계 바코드 DB (오픈소스, 무료)
// https://world.openfoodfacts.org/data
//
// 바코드로 상품 정보 조회 → drink_catalog 포맷으로 변환
// ============================================

import { DrinkCategory } from '../types';

const OFF_API_BASE = 'https://world.openfoodfacts.org/api/v2/product';
const USER_AGENT = 'DRINKLOG/1.0 (drinklog-app)';

// Open Food Facts 원본 응답 (필요한 필드만)
interface OFFProduct {
  product_name?: string;
  product_name_ko?: string;
  product_name_en?: string;
  generic_name?: string;
  brands?: string;
  quantity?: string;
  countries?: string;
  countries_tags?: string[];
  categories?: string;
  categories_tags?: string[];
  labels_tags?: string[];
  image_front_url?: string;
  image_url?: string;
  nutriments?: {
    alcohol?: number;
    alcohol_value?: number;
    'alcohol_100g'?: number;
  };
  alcohol_by_volume_value?: number;
  alcohol?: string;
}

interface OFFResponse {
  status: 0 | 1; // 1 = found, 0 = not found
  product?: OFFProduct;
  code?: string;
}

// drink_catalog 에 맞게 정규화된 결과
export interface ParsedDrink {
  name: string;
  brand: string | null;
  category: DrinkCategory;
  abv: number | null;
  volume_ml: number | null;
  origin: string | null;
  barcode: string;
  image_url: string | null;
}

// ============================================
// 바코드로 조회
// ============================================
export async function fetchFromOpenFoodFacts(
  barcode: string
): Promise<ParsedDrink | null> {
  try {
    const url = `${OFF_API_BASE}/${encodeURIComponent(barcode)}.json`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    });

    if (!res.ok) return null;

    const json: OFFResponse = await res.json();
    if (json.status !== 1 || !json.product) return null;

    return parseOFFProduct(json.product, barcode);
  } catch (err) {
    console.warn('[OFF] fetch failed:', err);
    return null;
  }
}

// ============================================
// OFF 응답 → ParsedDrink 변환
// ============================================
function parseOFFProduct(p: OFFProduct, barcode: string): ParsedDrink | null {
  // 이름: ko > generic > product_name > en
  const name =
    p.product_name_ko ||
    p.product_name ||
    p.generic_name ||
    p.product_name_en ||
    null;

  if (!name) return null;

  const category = inferCategory(p);
  // 주류 카테고리 아닌 상품이면 제외
  if (category === null) return null;

  return {
    name: name.trim(),
    brand: p.brands ? p.brands.split(',')[0].trim() : null,
    category,
    abv: extractAbv(p),
    volume_ml: parseQuantityToMl(p.quantity),
    origin: extractOrigin(p),
    barcode,
    image_url: p.image_front_url || p.image_url || null,
  };
}

// ============================================
// 카테고리 추론
// ============================================
function inferCategory(p: OFFProduct): DrinkCategory | null {
  const tags = [
    ...(p.categories_tags || []),
    ...(p.labels_tags || []),
  ].map((t) => t.toLowerCase());
  const catStr = (p.categories || '').toLowerCase();
  const joined = tags.join(' ') + ' ' + catStr;

  // 맥주
  if (/beer|bier|맥주|cerveza|cerveja|pils|lager|ale|stout|ipa/.test(joined))
    return 'beer';

  // 와인 (스파클링 포함)
  if (/wine|vin|와인|vino|champagne|sparkling|prosecco|cava/.test(joined))
    return 'wine';

  // 위스키
  if (/whisk/i.test(joined) || /bourbon|scotch/.test(joined)) return 'whiskey';

  // 소주
  if (/soju|소주/.test(joined)) return 'soju';

  // 막걸리
  if (/makgeolli|막걸리|nongju|rice-wine|rice wine/.test(joined))
    return 'makgeolli';

  // 양주/증류주 (vodka, gin, rum, tequila, cognac, liqueur 등)
  if (
    /vodka|gin|rum|tequila|mezcal|cognac|brandy|liqueur|spirits|spirit|보드카|진|럼|테킬라/.test(
      joined
    )
  )
    return 'spirits';

  // 사케/기타 주류
  if (/sake|사케|baijiu|백주|소흥주/.test(joined)) return 'etc';

  // alcoholic-beverages 로만 태깅된 경우 → etc
  if (/alcoholic|alcohol|주류/.test(joined)) return 'etc';

  // 주류 관련 태그가 전혀 없으면 null (주류 아님)
  return null;
}

// ============================================
// 도수 추출
// ============================================
function extractAbv(p: OFFProduct): number | null {
  // 1. alcohol_by_volume_value (정식 필드)
  if (typeof p.alcohol_by_volume_value === 'number') {
    return p.alcohol_by_volume_value;
  }
  // 2. nutriments.alcohol_value
  const n = p.nutriments;
  if (n) {
    if (typeof n.alcohol_value === 'number') return n.alcohol_value;
    if (typeof n.alcohol === 'number') return n.alcohol;
    if (typeof n['alcohol_100g'] === 'number') return n['alcohol_100g'];
  }
  // 3. "alcohol" 문자열 필드 ("5.0 % vol" 등)
  if (p.alcohol) {
    const m = p.alcohol.match(/([\d.]+)/);
    if (m) return parseFloat(m[1]);
  }
  return null;
}

// ============================================
// 용량 파싱: "500 ml", "750ml", "1.5 L", "70 cl", "330 ml x 6"
// ============================================
export function parseQuantityToMl(q?: string): number | null {
  if (!q) return null;
  const str = q.toLowerCase().trim();

  // "... x N" 패턴 → 단위 용량만 반환 (6팩의 한 병만)
  const first = str.split(/x|\*/)[0].trim();

  // 숫자 + 단위
  const match = first.match(/([\d.,]+)\s*(ml|l|cl|dl)?/);
  if (!match) return null;

  const num = parseFloat(match[1].replace(',', '.'));
  if (isNaN(num)) return null;

  const unit = (match[2] || 'ml').toLowerCase();
  switch (unit) {
    case 'l':
      return Math.round(num * 1000);
    case 'cl':
      return Math.round(num * 10);
    case 'dl':
      return Math.round(num * 100);
    case 'ml':
    default:
      return Math.round(num);
  }
}

// ============================================
// 원산지 추출
// ============================================
function extractOrigin(p: OFFProduct): string | null {
  if (!p.countries) return null;
  // "South Korea, France" → 첫 번째
  const first = p.countries.split(',')[0].trim();
  // 한국어 매핑
  const map: Record<string, string> = {
    'south korea': '한국',
    korea: '한국',
    japan: '일본',
    china: '중국',
    france: '프랑스',
    italy: '이탈리아',
    spain: '스페인',
    germany: '독일',
    'united kingdom': '영국',
    'united states': '미국',
    usa: '미국',
    scotland: '스코틀랜드',
    ireland: '아일랜드',
    chile: '칠레',
    argentina: '아르헨티나',
    australia: '호주',
    'new zealand': '뉴질랜드',
    mexico: '멕시코',
    netherlands: '네덜란드',
    belgium: '벨기에',
    russia: '러시아',
    sweden: '스웨덴',
  };
  return map[first.toLowerCase()] || first;
}
