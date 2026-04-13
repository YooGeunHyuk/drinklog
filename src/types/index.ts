// 주종 카테고리
export type DrinkCategory =
  | 'soju'
  | 'beer'
  | 'makgeolli'
  | 'wine'
  | 'whiskey'
  | 'spirits'
  | 'etc';

export const CATEGORY_LABELS: Record<DrinkCategory, string> = {
  soju: '소주',
  beer: '맥주',
  makgeolli: '막걸리',
  wine: '와인',
  whiskey: '위스키',
  spirits: '양주',
  etc: '기타',
};

// 입력 방식
export type InputMethod = 'scan' | 'search' | 'manual';

// 로그인 방식
export type AuthProvider = 'phone' | 'kakao' | 'naver';

// 성별
export type Gender = 'male' | 'female' | 'none';

// 주류 정보 출처
export type CatalogSource = 'self' | 'api' | 'ai_generated';

// ── DB 타입 ──

export interface User {
  id: string;
  phone: string | null;
  auth_provider: AuthProvider;
  nickname: string | null;
  avatar_url: string | null;
  gender: Gender | null;
  birth_year: number | null;
  marketing_agreed: boolean;
  created_at: string;
}

export interface DrinkCatalog {
  id: string;
  name: string;
  category: DrinkCategory;
  brand: string | null;
  abv: number | null;
  volume_ml: number | null;
  avg_price: number | null;
  origin: string | null;
  tasting_notes: string | null;
  barcode: string | null;
  image_url: string | null;
  source: CatalogSource;
  verified: boolean;
  created_at: string;
}

export interface DrinkLog {
  id: string;
  user_id: string;
  catalog_id: string;
  logged_at: string;
  bottles: number;
  quantity_ml: number | null;
  price_paid: number | null;
  input_method: InputMethod;
  photo_url: string | null;
  note: string | null;
  created_at: string;
  // 조인용
  drink_catalog?: DrinkCatalog;
}
