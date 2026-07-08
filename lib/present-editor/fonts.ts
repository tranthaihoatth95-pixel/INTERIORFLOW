/**
 * lib/present-editor/fonts.ts — Danh sách font CURATED cho từng text element.
 *
 * Deck có FontPairing cấp deck (Editorial/Modern/Elegant ở lib/slides) làm mặc định;
 * đây là lớp ghi đè PER-ELEMENT (như "Font" trong Word). Mỗi mục có:
 *   - label: tên hiển thị trong dropdown,
 *   - stack: chuỗi font-family CSS (cũng dùng thẳng cho ctx.font trên canvas → PDF/ảnh),
 *   - face:  tên font "gọn" để đặt fontFace khi xuất PPTX (PowerPoint không nhận stack).
 *
 * Nguyên tắc gu quiet-luxury: có CẢ serif (Cormorant/Georgia/Times) lẫn sans; kèm stack
 * an toàn tiếng Việt (Be Vietnam Pro/system) để không vỡ dấu.
 * Chỉ dùng font hệ thống / web-safe (không nạp mạng) để canvas render đồng nhất.
 */

export interface CuratedFont {
  label: string;
  stack: string; // font-family CSS đầy đủ
  face: string; // tên đơn cho PPTX fontFace
}

export const CURATED_FONTS: CuratedFont[] = [
  // --- Serif (editorial / quiet-luxury) ---
  { label: 'Cormorant (serif thanh)', stack: '"Cormorant Garamond", Cormorant, Georgia, "Times New Roman", serif', face: 'Cormorant Garamond' },
  { label: 'Georgia (serif)', stack: 'Georgia, "Times New Roman", serif', face: 'Georgia' },
  { label: 'Times (serif cổ điển)', stack: '"Times New Roman", Times, serif', face: 'Times New Roman' },
  { label: 'Playfair (serif tương phản)', stack: '"Playfair Display", Georgia, serif', face: 'Playfair Display' },
  // --- Sans hiện đại ---
  { label: 'Helvetica / Arial (sans)', stack: '"Helvetica Neue", Helvetica, Arial, sans-serif', face: 'Arial' },
  { label: 'Avenir (sans tròn)', stack: '"Avenir Next", Avenir, "Helvetica Neue", sans-serif', face: 'Avenir Next' },
  { label: 'Optima (sans nhân văn)', stack: 'Optima, "Avenir Next", "Helvetica Neue", sans-serif', face: 'Optima' },
  // --- An toàn tiếng Việt ---
  { label: 'Be Vietnam Pro (Việt)', stack: '"Be Vietnam Pro", "Segoe UI", system-ui, sans-serif', face: 'Be Vietnam Pro' },
  { label: 'Hệ thống (system-ui)', stack: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', face: 'Calibri' },
];

/** Tìm mục curated theo stack (để map fontFace khi xuất PPTX). Trả undefined nếu không khớp. */
export function findCuratedByStack(stack: string | undefined): CuratedFont | undefined {
  if (!stack) return undefined;
  return CURATED_FONTS.find((f) => f.stack === stack);
}
