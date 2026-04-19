/**
 * wine21.com AJAX API 크롤링 → drink_catalog CSV
 * 총 ~35,000건 와인 DB — 한국에서 가장 큰 와인 DB
 *
 * 실행: npx tsx scripts/crawl_wine21.ts
 * 결과: scripts/output/wine21_all.csv
 *
 * 참고: 35,000건 전체를 가져오면 CSV가 너무 커져서
 *       pageSize=100, 최대 5000건으로 제한 (상위 인기 와인 우선)
 *       필요하면 MAX_ITEMS 늘리면 됨
 */

import * as fs from 'fs';
import * as path from 'path';

const AJAX_URL = 'https://www.wine21.com/13_search/proc/ajax_wine_list.php';
const MAX_ITEMS = 5000; // 한번에 가져올 최대 건수
const PAGE_SIZE = 100;

interface WineRow {
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

// Unicode escape (\uXXXX) 디코딩
function decodeUnicode(str: string): string {
  return str.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16)),
  );
}

// HTML 태그 제거
function strip(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

/**
 * AJAX 응답 HTML에서 와인 파싱
 *
 * 각 <li> 구조:
 *   <p class='winery'>와이너리명</p>
 *   <h3>와인 한국이름 <p class='wine-name-en'>영어이름</p></h3>
 *   <span class='country'>국가(English)</span>
 *   <span class='nation'>지역(English)</span>
 *   <em class='board-badge badge-red'>레드</em> 등
 */
function parseWineHtml(html: string): WineRow[] {
  const decoded = decodeUnicode(html)
    .replace(/\\'/g, "'")
    .replace(/\\\//g, '/');

  const items = decoded.split("<li class='rel'>").slice(1);
  const rows: WineRow[] = [];

  for (const item of items) {
    // 와이너리 (brand)
    let brand = '';
    const wineryMatch = item.match(/<p class='winery'>[^>]*>([^<]+)/);
    if (wineryMatch) brand = strip(wineryMatch[1]);

    // 한국이름
    let nameKo = '';
    const nameMatch = item.match(/<a[^>]*class='btnView'>([^<]+)/);
    if (nameMatch) nameKo = strip(nameMatch[1]);

    // 영어이름
    let nameEn = '';
    const enMatch = item.match(/<p class='wine-name-en'>([^<]+)/);
    if (enMatch) nameEn = strip(enMatch[1]);

    // 국가
    let country = '';
    const countryMatch = item.match(/<span class='country'>([^<]+)/);
    if (countryMatch) {
      const raw = strip(countryMatch[1]);
      // "프랑스(France)" → "프랑스"
      const paren = raw.indexOf('(');
      country = paren > 0 ? raw.slice(0, paren) : raw;
    }

    // 지역
    let region = '';
    const regionMatch = item.match(/<span class='nation'>([^<]+)/);
    if (regionMatch) {
      const raw = strip(regionMatch[1]);
      const paren = raw.indexOf('(');
      region = paren > 0 ? raw.slice(0, paren) : raw;
    }

    // 와인 타입 (badge)
    let wineType = '';
    const typeMatch = item.match(/<em class='board-badge[^']*'>([^<]+)/);
    if (typeMatch) wineType = strip(typeMatch[1]); // 레드, 화이트, 스파클링, 로제 등

    // 점수
    let score = '';
    const scoreMatch = item.match(/<span class='score-num'>([^<]+)/);
    if (scoreMatch) score = strip(scoreMatch[1]).replace('점', '');

    if (!nameKo) continue;

    // tasting_notes에 타입+지역+점수 기록
    const notes = [wineType, region, score ? `${score}점` : '']
      .filter(Boolean)
      .join(' · ');

    rows.push({
      name: nameKo,
      brand: brand,
      category: 'wine',
      abv: '',
      volume_ml: '750',
      origin: country || '',
      avg_price: '',
      tasting_notes: notes,
      source: 'wine21',
      verified: 'true',
    });
  }

  return rows;
}

async function fetchPage(page: number): Promise<{ rows: WineRow[]; totalCnt: number; hasMore: boolean }> {
  const body = new URLSearchParams({
    filter: '{}',
    option: JSON.stringify({ page, pageSize: PAGE_SIZE }),
    extraCtrl: '{}',
    goList: 'true',
  });

  const res = await fetch(AJAX_URL, {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Referer: 'https://www.wine21.com/13_search/wine_list.html',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: body.toString(),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();

  return {
    rows: parseWineHtml(json.html || ''),
    totalCnt: json.TotalCnt || 0,
    hasMore: json.moreFlag === true,
  };
}

async function main() {
  console.log('🍷 wine21.com 와인 크롤링 시작\n');

  const allRows: WineRow[] = [];
  let page = 1;

  while (allRows.length < MAX_ITEMS) {
    try {
      const { rows, totalCnt, hasMore } = await fetchPage(page);

      if (page === 1) {
        console.log(`📊 총 ${totalCnt.toLocaleString()}건 존재 (최대 ${MAX_ITEMS}건 수집)`);
      }

      if (rows.length === 0) break;

      allRows.push(...rows);
      console.log(`  📄 페이지 ${page}: ${rows.length}건 (누적 ${allRows.length}건)`);

      if (!hasMore || allRows.length >= MAX_ITEMS) break;

      page++;
      // 예의 있게 300ms 대기
      await new Promise((r) => setTimeout(r, 300));
    } catch (err: any) {
      console.error(`  ❌ 페이지 ${page} 에러: ${err.message}`);
      break;
    }
  }

  // MAX_ITEMS 초과분 잘라내기
  const trimmed = allRows.slice(0, MAX_ITEMS);

  // 중복 제거 (이름+용량)
  const seen = new Set<string>();
  const unique = trimmed.filter((r) => {
    const key = `${r.name}|${r.category}|${r.volume_ml}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`\n📊 수집 ${trimmed.length}건 → 중복 제거 후 ${unique.length}건`);

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
  const outPath = path.join(outDir, 'wine21_all.csv');
  fs.writeFileSync(outPath, csv, 'utf-8');

  console.log(`✅ 저장: ${outPath} (${unique.length}건)\n`);
}

main().catch(console.error);
