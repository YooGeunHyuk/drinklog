// Supabase Storage (drink-photos 버킷) 업로드 헬퍼.
// expo-image-picker 로 로컬 URI 받은 걸 이 함수에 넘기면:
//  1) base64 읽기
//  2) ArrayBuffer 로 변환
//  3) {user_id}/{timestamp}_{random}.jpg 경로로 업로드
//  4) public URL 반환 (drink_log.photo_url 에 저장)

import { supabase } from './supabase';

const BUCKET = 'drink-photos';

// base64 → ArrayBuffer (RN 에서 동작)
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = globalThis.atob
    ? globalThis.atob(base64)
    : Buffer.from(base64, 'base64').toString('binary');
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function uploadDrinkPhoto(
  localUri: string,
  base64: string,
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인 세션이 없습니다.');

  // 확장자 추정 (기본 jpg)
  const match = localUri.match(/\.(\w+)(?:\?|$)/);
  const ext = (match?.[1] ?? 'jpg').toLowerCase();
  const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';

  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  const path = `${user.id}/${ts}_${rand}.${ext}`;

  const buffer = base64ToArrayBuffer(base64);

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType,
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw new Error(`사진 업로드 실패: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** 여러 장 일괄 업로드. 실패한 사진은 throw하지 않고 결과 배열에서 빠짐. */
export async function uploadDrinkPhotos(
  items: { localUri: string; base64: string }[],
): Promise<string[]> {
  const urls: string[] = [];
  for (const item of items) {
    try {
      const url = await uploadDrinkPhoto(item.localUri, item.base64);
      urls.push(url);
    } catch (e) {
      console.warn('[storage] one photo upload failed:', e);
    }
  }
  return urls;
}

// URL 에서 storage 경로 추출. 삭제할 때 필요.
// publicUrl 예: https://xxxx.supabase.co/storage/v1/object/public/drink-photos/<user_id>/<file>
function parsePathFromPublicUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx < 0) return null;
  return url.slice(idx + marker.length);
}

export async function deleteDrinkPhoto(publicUrl: string): Promise<void> {
  const path = parsePathFromPublicUrl(publicUrl);
  if (!path) return;
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) console.warn('[storage] delete failed:', error.message);
}
