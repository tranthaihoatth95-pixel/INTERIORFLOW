/**
 * lib/present-editor/format-painter.ts — Format Painter (sao chép định dạng) cho text element,
 * kiểu "Format Painter" PowerPoint/Canva: copy toàn bộ ĐỊNH DẠNG của 1 text element rồi áp
 * sang element khác, KHÔNG đụng nội dung `text`.
 *
 * Tách phần THUẦN (trích/áp định dạng) khỏi UI (TextToolbar/EditorCanvas) để test được bằng
 * sucrase-node (không đụng DOM/React) — theo đúng cấu trúc `brand-kit.ts`.
 */
import type { TextElement, TextAlign, ListStyle } from './model';

/** Ảnh chụp các field ĐỊNH DẠNG của 1 text element — KHÔNG bao giờ chứa `text`/id/frame. */
export interface TextFormat {
  fontSize: number;
  color: string;
  align: TextAlign;
  bold: boolean;
  italic: boolean;
  underline?: boolean;
  tracking?: number;
  lineHeight?: number;
  bullet?: boolean;
  listStyle?: ListStyle;
  fontFamily?: string;
}

/** Trích định dạng từ 1 text element (dùng khi bấm nút Format Painter). */
export function extractTextFormat(el: TextElement): TextFormat {
  return {
    fontSize: el.fontSize,
    color: el.color,
    align: el.align,
    bold: el.bold,
    italic: el.italic,
    underline: el.underline,
    tracking: el.tracking,
    lineHeight: el.lineHeight,
    bullet: el.bullet,
    listStyle: el.listStyle,
    fontFamily: el.fontFamily,
  };
}

/**
 * Áp định dạng đã copy vào 1 text element ĐÍCH — mutate tại chỗ (khớp pattern `onUpdate(mutate)`
 * của TextToolbar). GIỮ NGUYÊN `text`/id/frame/role/hidden/locked/opacity/name của đích.
 */
export function applyTextFormat(el: TextElement, format: TextFormat): void {
  el.fontSize = format.fontSize;
  el.color = format.color;
  el.align = format.align;
  el.bold = format.bold;
  el.italic = format.italic;
  el.underline = format.underline;
  el.tracking = format.tracking;
  el.lineHeight = format.lineHeight;
  el.bullet = format.bullet;
  el.listStyle = format.listStyle;
  el.fontFamily = format.fontFamily;
}
