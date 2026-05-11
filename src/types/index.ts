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

// 기분 / 상황 태그
export type DrinkMood =
  | 'alone'      // 혼술
  | 'casual'     // 편한자리
  | 'party'      // 회식/모임
  | 'date'       // 데이트
  | 'business'   // 비즈니스
  | 'celebration'; // 축하

export const MOOD_LABELS: Record<DrinkMood, string> = {
  alone: '혼술',
  casual: '편한자리',
  party: '모임·회식',
  date: '데이트',
  business: '비즈니스',
  celebration: '축하',
};

export const MOOD_ICONS: Record<DrinkMood, string> = {
  alone: '🧘',
  casual: '🛋️',
  party: '🎉',
  date: '💕',
  business: '👔',
  celebration: '🥂',
};

export interface DrinkLog {
  id: string;
  user_id: string;
  catalog_id: string;
  logged_at: string;
  bottles: number;
  quantity_ml: number | null;
  price_paid: number | null;
  input_method: InputMethod;
  photo_url: string | null;        // (legacy) 단일 사진 — backward compat용
  photo_urls: string[] | null;     // 사진 여러 장
  note: string | null;
  location: string | null;
  companions: string | null;
  mood: DrinkMood | null;
  // 날씨 (자동 기록)
  weather: string | null;         // 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'stormy' | 'foggy'
  temperature: number | null;     // 섭씨
  location_name: string | null;   // "서울 강남구"
  created_at: string;
  // 조인용
  drink_catalog?: DrinkCatalog;
  // 친구 태깅 (회식 모드 v2). companions(text)는 친구가 아닌 동행자 free-text fallback.
  companion_user_ids?: string[];
}

// drink_log_companions 테이블 row
export interface DrinkLogCompanion {
  drink_log_id: string;
  companion_user_id: string;
  tagged_at: string;
}
