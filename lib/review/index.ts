/**
 * lib/review/index.ts — CỬA VÀO duy nhất của bảng kiểm dùng chung 3 chặng (p3, 07/08).
 *
 * Một khung ⇒ một cách hiện, một cách sửa, một cách bỏ qua, MỘT CHỖ NGỒI cố định trên giao diện
 * (4 luật chỗ ngồi, CHOT-TACH-AI §4). UI (phiếu sau — vùng components ngoài sở hữu phiên này)
 * chỉ cần gọi `review(chang, input)` rồi vẽ `ReviewResult`:
 *   phần trên  LUẬT  — đỏ/vàng · dẫn `nguon` · nút "Sửa" khi có `cachSua`
 *   ─── vạch ngăn ───
 *   phần dưới  GỢI Ý — dấu Magic tím + glyph Vitals · chữ "gợi ý" · nút "Bỏ qua" · KHÔNG chặn
 * (`gopyBiChan` có giá trị thì phần dưới hiện đúng câu đó.)
 *
 * KHÔNG có luật nào sống ở đây (K1): 2D → `lib/cad/standards/` (11 bộ, 3.074 dòng, nguyên trạng)
 * · deck → `DECK_STANDARDS`/`evaluateDeck` (lib/present-editor) · 3D → `luat/rules-3d.ts` (mới,
 * VIỆC 2). File này chỉ GHÉP.
 */

import type { Doc } from '../cad/model';
import type { EditorSlide } from '../present-editor/model';
import type { ReviewResult } from './types';
import { luatCad } from './luat/cad';
import { luatDeck } from './luat/deck';
import { luat3d } from './luat/rules-3d';
import { gopy, type DeBaiDaGhi } from './gopy';

export type { Finding, FindingLuat, FindingGopy, ReviewChang, ReviewResult, ViTri } from './types';
export { luatCad } from './luat/cad';
export { luatDeck } from './luat/deck';
export { luat3d, luatDenHinhHoc, luatDoRoi, luatKhoiHo } from './luat/rules-3d';
export { gopy, type DeBaiDaGhi, type GopyKetQua } from './gopy';

export interface ReviewInput {
  /** chặng 2d/3d đọc Doc; deck đọc slides. Truyền đúng cái chặng cần — không truyền chéo. */
  doc?: Doc;
  slides?: EditorSlide[];
  /** đề bài đã ghi (nếu có) — lớp góp ý cần nó làm mốc; null = góp ý bị chặn có lý do. */
  deBai?: DeBaiDaGhi | null;
  /** mốc thời gian bộ quy chuẩn (chặng 2d — T2 rule-effective-date). */
  asOfDate?: string | null;
}

export function review2d(input: ReviewInput): ReviewResult {
  const luat = input.doc ? luatCad(input.doc, { asOfDate: input.asOfDate ?? null }) : [];
  const g = gopy('2d', input.deBai ?? null);
  return { chang: '2d', luat, gopy: g.findings, gopyBiChan: g.biChan };
}

export function review3d(input: ReviewInput): ReviewResult {
  const luat = input.doc ? luat3d(input.doc) : [];
  const g = gopy('3d', input.deBai ?? null);
  return { chang: '3d', luat, gopy: g.findings, gopyBiChan: g.biChan };
}

export function reviewDeck(input: ReviewInput): ReviewResult {
  const luat = input.slides ? luatDeck(input.slides) : [];
  const g = gopy('deck', input.deBai ?? null);
  return { chang: 'deck', luat, gopy: g.findings, gopyBiChan: g.biChan };
}
