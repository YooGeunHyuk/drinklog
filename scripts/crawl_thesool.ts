/**
 * thesool.com (전통주갤러리) 크롤링 → drink_catalog CSV
 * 농수산식품유통공사(공공데이터) 운영
 *
 * 실행: npx tsx scripts/crawl_thesool.ts
 * 결과: scripts/output/thesool_all.csv
 */

import * as fs from 'fs';
import * as path from 'path';

const BASE = 'https://thesool.com/front/find';

const CATEGORIES = [
  { url: `${BASE}/M000000083/list.do?kind=CD00000141`, kind: '탁주', cat: 'makgeolli' },
  { url: `${BASE}/M000000084/list.do?kind=CD00000142`, kind: '약주/청주', cat: 'etc' },
  { url: `${BASE}/M000000085/list.do?kind=CD00000143`, kind: '과실주', cat: 'etc' },
  { url: `${BASE}/M000000086/list.do?kind=CD00000144`, kind: '증류주', cat: 'spirits' },
  { url: `${BASE}/M000000087/list.do?kind=CD00000145`, kind: '리큐르/기타', cat: 'etc' },
];

interface Row {
  name: string;
  brand: string;
  category: string;
  abv: string;
  volume_ml: string;
  origin: string;
  avg_price: string;
  tasting_notes: string;
  source: string;
  verified: string;
}

function csvEscape(v: string): string {
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept-Language': 'ko-KR,ko;q=0.9',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

/**
 * HTML에서 <dl class="detail"> 블록을 파싱
 *
 * 구조:
 *   <dl class="detail">
 *     <dt>
 *       <div class="name" onclick="move('PR00001097');">포그막 10</div>
 *     </dt>
 *     <dd>
 *       <div class="subject">제조사</div><div class="info">달성주조</div>
 *       <div class="subject">규격/도수</div><div class="info">500ml / 10%</div>
 *     </dd>
 *   </dl>
 */
function parsePage(html: string, drinkCat: string, kind: string): Row[] {
  const rows: Row[] = [];

  // 각 <dl class="detail"> 블록 분리
  const blocks = html.split(/<dl\s+class="detail">/i).slice(1); // 첫 번째는 앞부분 — 버림

  for (const block of blocks) {
    // 이름
    const nameMatch = block.match(/<div\s+class="name"[^>]*>([^<]+)/i);
    if (!nameMatch) continue;
    const name = nameMatch[1].trim();

    // 제조사
    let brand = '';
    const brandIdx = block.indexOf('>제조사<');
    if (brandIdx >= 0) {
      const afterBrand = block.slice(brandIdx);
      const infoMatch = afterBrand.match(/<div\s+class="info">([^<]+)/i);
      if (infoMatch) brand = infoMatch[1].trim();
    }

    // 규격/도수 → "750ml / 6%"
    let abv = '';
    let volume = '';
    const specIdx = block.indexOf('>규격/도수<');
    if (specIdx >= 0) {
      const afterSpec = block.slice(specIdx, specIdx + 300);
      const infoMatch = afterSpec.match(/<div\s+class="info">([\s\S]*?)<\/div>/i);
      if (infoMatch) {
        const specText = infoMatch[1].replace(/&nbsp;/g, ' ').replace(/<[^>]*>/g, '').trim();
        const volMatch = specText.match(/(\d+)\s*ml/i);
        if (volMatch) volume = volMatch[1];
        const abvMatch = specText.match(/(\d+\.?\d*)\s*%/);
        if (abvMatch) abv = abvMatch[1];
      }
    }

    rows.push({
      name,
      brand,
      category: drinkCat,
      abv,
      volume_ml: volume,
      origin: '한국',
      avg_price: '',
      tasting_notes: kind,
      source: 'thesool',
      verified: 'true',
    });
  }

  return rows;
}

async function crawlCategory(catUrl: string, drinkCat: string, kind: string): Promise<Row[]> {
  const all: Row[] = [];
  let page = 1;

  console.log(`\n📂 ${kind} 크롤링 시작...`);

  while (page <= 100) {
    const sep = catUrl.includes('?') ? '&' : '?';
    const url = `${catUrl}${sep}page=${page}`;

    try {
      const html = await fetchHtml(url);
      const rows = parsePage(html, drinkCat, kind);

      if (rows.length === 0) {
        console.log(`  ✅ 페이지 ${page}: 데이터 없음 → 종료`);
        break;
      }

      console.log(`  📄 페이지 ${page}: ${rows.length}건`);
      all.push(...rows);
      page++;

      // 예의 있게 500ms 대기
      await new Promise((r) => setTimeout(r, 500));
    } catch (err: any) {
      console.error(`  ❌ 페이지 ${page} 에러: ${err.message}`);
      break;
    }
  }

  console.log(`  🏁 ${kind}: 총 ${all.length}건`);
  return all;
}

async function main() {
  console.log('🍶 thesool.com 전통주 크롤링 시작\n');

  const allRows: Row[] = [];

  for (const cat of CATEGORIES) {
    const rows = await crawlCategory(cat.url, cat.cat, cat.kind);
    allRows.push(...rows);
  }

  // 중복 제거 (이름+카테고리+용량)
  const seen = new Set<string>();
  const unique = allRows.filter((r) => {
    const key = `${r.name}|${r.category}|${r.volume_ml}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`\n📊 총 ${allRows.length}건 → 중복 제거 후 ${unique.length}건`);

  // CSV 출력
  const outDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const header = 'name,brand,category,abv,volume_ml,origin,avg_price,tasting_notes,source,verified';
  const csvRows = unique.map((r) =>
    [r.name, r.brand, r.category, r.abv, r.volume_ml, r.origin, r.avg_price, r.tasting_notes, r.source, r.verified]
      .map(csvEscape)
      .join(','),
  );

  const csv = [header, ...csvRows].join('\n') + '\n';
  const outPath = path.join(outDir, 'thesool_all.csv');
  fs.writeFileSync(outPath, csv, 'utf-8');

  console.log(`✅ 저장: ${outPath} (${unique.length}건)\n`);
}

main().catch(console.error);
