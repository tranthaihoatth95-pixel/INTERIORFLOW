/**
 * Helper tìm kiếm node DÙNG CHUNG cho NodeLibraryPanel và CommandPalette (⌘K).
 * Trước đây 2 chỗ có 2 hàm lọc khác nhau, đều chỉ khớp title/description/type → gõ tiếng Việt
 * theo việc muốn làm ("vách", "tách nền") ra 0 kết quả.
 *
 * Hai điểm chính:
 *  1. Bỏ dấu tiếng Việt (NFD + strip combining marks + đ→d) trước khi so → gõ "vach" khớp "vách",
 *     "tach nen" khớp "tách nền". Người dùng gõ nhanh thường bỏ dấu.
 *  2. Khớp cả `keywords` (VI + EN, xem lib/nodes/keywords.ts) chứ không chỉ title/description.
 */
import type { NodeDefinition } from '@/lib/types';
// import tương đối (không alias) để test chạy được bằng sucrase-node.
import { keywordsFor } from './keywords';

/**
 * Chuẩn hoá chuỗi để so khớp: lowercase, bỏ dấu tiếng Việt, gom khoảng trắng.
 * `đ`/`Đ` KHÔNG phải combining mark nên NFD không tách được → map tay.
 */
export function normalizeSearch(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Kho chữ tìm kiếm của 1 node (đã chuẩn hoá): title + description + type + keywords. */
export function searchTextFor(def: NodeDefinition): string {
  return normalizeSearch(
    [def.title, def.description, def.type, ...keywordsFor(def.type, def.keywords)].join(' '),
  );
}

/**
 * Điểm khớp của node với truy vấn — dùng để xếp thứ tự ở ⌘K.
 *  3 = title bắt đầu bằng query · 2 = title chứa · 1 = keywords/description/type chứa · -1 = không khớp.
 * Query nhiều từ: PHẢI khớp mọi từ (AND) trên kho chữ tổng.
 */
export function nodeScore(def: NodeDefinition, rawQuery: string): number {
  const q = normalizeSearch(rawQuery);
  if (!q) return 3;
  const title = normalizeSearch(def.title);
  const haystack = searchTextFor(def);
  const terms = q.split(' ');
  if (!terms.every((t) => haystack.includes(t))) return -1;
  if (title.startsWith(q)) return 3;
  if (title.includes(q)) return 2;
  return 1;
}

/** Node có khớp truy vấn hay không (Node Library chỉ cần boolean). */
export function nodeMatches(def: NodeDefinition, rawQuery: string): boolean {
  return nodeScore(def, rawQuery) >= 0;
}

/**
 * Bản tổng quát cho ⌘K: mục ở đó không chỉ có node (còn "Hành động"), nên nhận
 * label + kho chữ phụ rồi tính điểm cùng thang với `nodeScore`.
 */
export function textScore(label: string, extra: string, rawQuery: string): number {
  const q = normalizeSearch(rawQuery);
  if (!q) return 3;
  const l = normalizeSearch(label);
  const haystack = `${l} ${normalizeSearch(extra)}`;
  const terms = q.split(' ');
  if (!terms.every((t) => haystack.includes(t))) return -1;
  if (l.startsWith(q)) return 3;
  if (l.includes(q)) return 2;
  return 1;
}
