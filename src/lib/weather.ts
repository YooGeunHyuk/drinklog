// 날씨 유틸리티
// 위치 권한 → GPS 좌표 → Open-Meteo API → 정규화된 날씨 코드
// Open-Meteo: https://open-meteo.com/ (무료, API 키 불필요)

import * as Location from 'expo-location';

export type WeatherCode = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'stormy' | 'foggy';

export interface WeatherInfo {
  weather: WeatherCode;
  temperature: number;       // 섭씨
  locationName: string;      // "서울 강남구" 같은 도시/구 이름
}

// ── 날씨 아이콘 / 라벨 매핑 ────────────────────────────────────
export const WEATHER_ICONS: Record<WeatherCode, string> = {
  sunny: '☀️',
  cloudy: '☁️',
  rainy: '🌧',
  snowy: '❄️',
  stormy: '⛈',
  foggy: '🌫',
};

export const WEATHER_LABELS: Record<WeatherCode, string> = {
  sunny: '맑음',
  cloudy: '흐림',
  rainy: '비',
  snowy: '눈',
  stormy: '천둥번개',
  foggy: '안개',
};

/**
 * Open-Meteo WMO Weather code → 정규화된 카테고리
 * https://open-meteo.com/en/docs#weathervariables
 */
function normalizeWeatherCode(code: number): WeatherCode {
  if (code === 0) return 'sunny';                    // 맑음
  if (code >= 1 && code <= 3) return 'cloudy';       // 대체로 맑음 ~ 흐림
  if (code === 45 || code === 48) return 'foggy';    // 안개
  if (code >= 51 && code <= 67) return 'rainy';      // 이슬비 ~ 비
  if (code >= 71 && code <= 77) return 'snowy';      // 눈
  if (code >= 80 && code <= 82) return 'rainy';      // 소나기
  if (code >= 85 && code <= 86) return 'snowy';      // 눈 소나기
  if (code >= 95 && code <= 99) return 'stormy';     // 천둥번개
  return 'cloudy';
}

/**
 * 위치 권한 요청 + 현재 GPS 좌표 획득
 * @returns {lat, lng} or null (권한 거부 / 실패 시)
 */
export async function getCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,  // GPS 정확도 (적당히 빠르게)
    });
    return { lat: loc.coords.latitude, lng: loc.coords.longitude };
  } catch (e) {
    console.warn('[weather] 위치 가져오기 실패:', e);
    return null;
  }
}

/**
 * 좌표 → 도시/구 이름 (역지오코딩)
 * 예: 37.5172, 127.0473 → "서울 강남구"
 */
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    const first = results[0];
    if (!first) return '';

    // 한국: region(시/도) + district/subregion/city(구/군)
    const region = first.region ?? '';        // 서울특별시, 경기도 등
    const district =
      first.district ?? first.subregion ?? first.city ?? '';  // 강남구 등

    // "서울특별시 강남구" → "서울 강남구" 처럼 간결하게
    const shortRegion = region
      .replace('특별시', '')
      .replace('광역시', '')
      .replace('특별자치시', '')
      .replace('특별자치도', '')
      .replace(/도$/, '도')
      .trim();

    if (shortRegion && district) return `${shortRegion} ${district}`;
    return shortRegion || district || '';
  } catch (e) {
    console.warn('[weather] 역지오코딩 실패:', e);
    return '';
  }
}

/**
 * 좌표 → 현재 날씨 (Open-Meteo API)
 */
async function fetchWeather(lat: number, lng: number): Promise<{
  weather: WeatherCode;
  temperature: number;
} | null> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?` +
      `latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,weather_code` +
      `&timezone=auto`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
    const json = await res.json();

    const code = json?.current?.weather_code;
    const temp = json?.current?.temperature_2m;
    if (code == null || temp == null) return null;

    return {
      weather: normalizeWeatherCode(Number(code)),
      temperature: Number(temp),
    };
  } catch (e) {
    console.warn('[weather] 날씨 API 실패:', e);
    return null;
  }
}

/**
 * 원스톱: 위치 권한 → GPS → 날씨 + 지명
 * 권한 거부 / API 실패 시 null 반환 (조용히 건너뛰기)
 */
export async function getCurrentWeather(): Promise<WeatherInfo | null> {
  const coords = await getCurrentLocation();
  if (!coords) return null;

  const [weather, locationName] = await Promise.all([
    fetchWeather(coords.lat, coords.lng),
    reverseGeocode(coords.lat, coords.lng),
  ]);

  if (!weather) return null;
  return {
    weather: weather.weather,
    temperature: weather.temperature,
    locationName,
  };
}
