// 사진 필드 호환 헬퍼.
// ─────────────────────────────────────────────────────────────
// DrinkLog에는 두 개의 사진 필드가 있음:
//
//   photo_url   : string | null      ← 단일 사진. (legacy, backward compat용)
//   photo_urls  : string[] | null    ← 사진 여러 장. (현행)
//
// **읽기 정책**: `photo_urls`가 비어있지 않으면 그것을 사용, 없으면 `photo_url`을
//   단일 원소 배열로 fallback. 이렇게 해야 옛 데이터(photo_url만 있는)도 자연스럽게
//   표시되고, 신규 데이터는 다중 사진을 지원함.
//
// **쓰기 정책**: 두 필드를 모두 채움 (`photo_url = photo_urls[0]`).
//   향후 photo_url을 제거할 때까지 backward compat 유지.
//
// 모든 사진 관련 로직은 이 파일을 거치도록 통일.
// ─────────────────────────────────────────────────────────────

import { DrinkLog } from '../types';

/**
 * 한 기록의 사진 URL 배열을 반환.
 * `photo_urls`가 비어있지 않으면 그것을, 아니면 `photo_url` 하나를 배열로,
 * 둘 다 없으면 빈 배열을 반환.
 */
export function getDrinkLogPhotos(
  log: Pick<DrinkLog, 'photo_url' | 'photo_urls'>,
): string[] {
  if (log.photo_urls && log.photo_urls.length > 0) {
    return log.photo_urls;
  }
  if (log.photo_url) {
    return [log.photo_url];
  }
  return [];
}

/** 한 기록에 사진이 한 장이라도 있는지. */
export function hasDrinkLogPhoto(
  log: Pick<DrinkLog, 'photo_url' | 'photo_urls'>,
): boolean {
  return getDrinkLogPhotos(log).length > 0;
}

/**
 * 사진 배열을 DB에 쓸 때 사용할 필드 묶음.
 * `photo_url`(legacy)에는 첫 번째 사진을 넣고, `photo_urls`에 전체 배열.
 * 빈 배열이면 둘 다 null.
 */
export function buildDrinkLogPhotoFields(urls: string[]): {
  photo_url: string | null;
  photo_urls: string[] | null;
} {
  if (urls.length === 0) {
    return { photo_url: null, photo_urls: null };
  }
  return {
    photo_url: urls[0],
    photo_urls: urls,
  };
}
