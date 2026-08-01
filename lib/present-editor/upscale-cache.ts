'use client';

/**
 * lib/present-editor/upscale-cache.ts — CACHE kết quả nâng độ phân giải ảnh cho "In 300dpi"
 * (P3 phần 2, 02/08, Hoà chốt hướng "chuẩn nguồn in"). Key = hash SHA-256 của `src` gốc — cùng
 * 1 ảnh (dùng lại ở nhiều slide/nhiều lần xuất) chỉ trả tiền upscale MỘT LẦN (yêu cầu bắt buộc
 * Hoà nêu 01/08, xem `lib/present-editor/print-upscale.ts`).
 *
 * Cùng khuôn IndexedDB với `custom-fonts.ts` (openDb/onupgradeneeded) — KHÔNG chung DB (khác
 * vòng đời: font sống dài hạn theo máy, cache upscale xoá tự do bất kỳ lúc nào không mất gì
 * ngoài phải trả tiền lại lần xuất sau).
 */

const DB_NAME = 'interiorflow-print-upscale';
const DB_VERSION = 1;
const STORE = 'upscale';

export interface CachedUpscale {
  /** ảnh đã nâng độ phân giải — dataURL hoặc URL (tuỳ provider trả về). */
  resultSrc: string;
  width: number;
  steps: 1 | 2;
  cachedAt: number;
}

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/** Hash SHA-256 (hex) của 1 chuỗi bất kỳ (URL hoặc dataURL) — khoá cache ổn định, không phụ
 * thuộc độ dài chuỗi nguồn (dataURL vài MB vẫn ra 1 khoá 64 ký tự). */
export async function hashSrc(src: string): Promise<string> {
  const bytes = new TextEncoder().encode(src);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Lỗi đọc → `null` (tiện nghi, KHÔNG được làm gãy export — thiếu cache thì upscale lại, tốn
 * thêm credit chứ không crash). */
export async function getCachedUpscale(key: string): Promise<CachedUpscale | null> {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve((req.result as CachedUpscale) ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function putCachedUpscale(key: string, value: CachedUpscale): Promise<void> {
  const db = await openDb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}
