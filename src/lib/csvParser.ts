// 단순 CSV 파서 — drink_catalog 업로드 전용.
// 외부 의존성 없음. 따옴표 이스케이프/멀티라인 필드까지 지원.

import type { DrinkCategory } from '../types';

// drink_catalog 에 업로드할 1행
export interface CatalogRow {
  name: string;
  brand: string | null;
  category: DrinkCategory;
  abv: number | null;
  volume_ml: number | null;
  origin: string | null;
  avg_price: number | null;
  tasting_notes: string | null;
  source: 'self' | 'api' | 'ai_generated';
  verified: boolean;
}

export interface ParseResult {
  rows: CatalogRow[];
  errors: { line: number; message: string; raw?: string }[];
  headers: string[];
}

const VALID_CATEGORIES: DrinkCategory[] = [
  'soju',
  'beer',
  'makgeolli',
  'wine',
  'whiskey',
  'spirits',
  'etc',
];

// CSV 한 줄을 필드 배열로 분해 (따옴표 안의 쉼표 보존)
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuote) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuote = false;
        }
      } else {
        cur += c;
      }
    } else {
      if (c === ',') {
        out.push(cur);
        cur = '';
      } else if (c === '"' && cur.length === 0) {
        inQuote = true;
      } else {
        cur += c;
      }
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function toNumberOrNull(v: string | undefined): number | null {
  if (v === undefined) return null;
  const t = v.trim();
  if (t === '' || t.toLowerCase() === 'null') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function toStringOrNull(v: string | undefined): string | null {
  if (v === undefined) return null;
  const t = v.trim();
  if (t === '' || t.toLowerCase() === 'null') return null;
  return t;
}

function toBool(v: string | undefined, def = false): boolean {
  if (v === undefined) return def;
  const t = v.trim().toLowerCase();
  if (t === '') return def;
  return t === 'true' || t === '1' || t === 'yes' || t === 'y';
}

export function parseCatalogCsv(raw: string): ParseResult {
  const errors: ParseResult['errors'] = [];
  const rows: CatalogRow[] = [];

  // \r 제거 후 비어있지 않은 줄만
  const lines = raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trimEnd());

  // 주석(#) 및 완전 빈 줄 제거하되 원본 라인번호 유지
  const entries: { lineNo: number; content: string }[] = [];
  lines.forEach((l, idx) => {
    const trimmed = l.trim();
    if (trimmed === '' || trimmed.startsWith('#')) return;
    entries.push({ lineNo: idx + 1, content: l });
  });

  if (entries.length === 0) {
    return { rows, errors: [{ line: 0, message: 'CSV 가 비어있습니다.' }], headers: [] };
  }

  // 첫 줄 = 헤더
  const headerLine = entries[0];
  const headers = splitCsvLine(headerLine.content).map((h) => h.toLowerCase());

  // 필수 컬럼 확인
  const required = ['name', 'category'];
  for (const r of required) {
    if (!headers.includes(r)) {
      errors.push({
        line: headerLine.lineNo,
        message: `필수 컬럼 "${r}" 이(가) 헤더에 없습니다.`,
        raw: headerLine.content,
      });
    }
  }
  if (errors.length > 0) {
    return { rows, errors, headers };
  }

  const col = (name: string) => headers.indexOf(name);
  const idxName = col('name');
  const idxBrand = col('brand');
  const idxCategory = col('category');
  const idxAbv = col('abv');
  const idxVolume = col('volume_ml');
  const idxOrigin = col('origin');
  const idxPrice = col('avg_price');
  const idxNotes = col('tasting_notes');
  const idxSource = col('source');
  const idxVerified = col('verified');

  for (let i = 1; i < entries.length; i++) {
    const entry = entries[i];
    const fields = splitCsvLine(entry.content);

    const name = toStringOrNull(fields[idxName]);
    const categoryRaw = (fields[idxCategory] ?? '').trim().toLowerCase();

    if (!name) {
      errors.push({
        line: entry.lineNo,
        message: 'name 이 비어있습니다.',
        raw: entry.content,
      });
      continue;
    }
    if (!VALID_CATEGORIES.includes(categoryRaw as DrinkCategory)) {
      errors.push({
        line: entry.lineNo,
        message: `category 값이 잘못됨: "${categoryRaw}". 허용: ${VALID_CATEGORIES.join(',')}`,
        raw: entry.content,
      });
      continue;
    }

    const sourceRaw = (fields[idxSource] ?? 'self').trim().toLowerCase();
    const source =
      sourceRaw === 'api' || sourceRaw === 'ai_generated' ? sourceRaw : 'self';

    rows.push({
      name,
      brand: idxBrand >= 0 ? toStringOrNull(fields[idxBrand]) : null,
      category: categoryRaw as DrinkCategory,
      abv: idxAbv >= 0 ? toNumberOrNull(fields[idxAbv]) : null,
      volume_ml: idxVolume >= 0 ? toNumberOrNull(fields[idxVolume]) : null,
      origin: idxOrigin >= 0 ? toStringOrNull(fields[idxOrigin]) : null,
      avg_price: idxPrice >= 0 ? toNumberOrNull(fields[idxPrice]) : null,
      tasting_notes: idxNotes >= 0 ? toStringOrNull(fields[idxNotes]) : null,
      source,
      verified: idxVerified >= 0 ? toBool(fields[idxVerified], true) : true,
    });
  }

  return { rows, errors, headers };
}
