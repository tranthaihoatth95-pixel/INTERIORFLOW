/**
 * lib/present-editor/model.ts — MÔ HÌNH DỮ LIỆU của trình dàn trang "Present".
 *
 * Nguyên tắc: model PHẲNG, serialize được (JSON) để:
 *   - lưu/khôi phục dễ,
 *   - export sang PDF (jsPDF) và PPTX (lib/pptx) chỉ là phép ánh xạ thuần.
 *
 * Toạ độ = PHẦN TRĂM của sân khấu 16:9 (0..100). Nhờ vậy toán export không phụ thuộc
 * kích thước hiển thị: nhân với 1920×1080 (PDF) hoặc 13.333×7.5in (PPTX) là ra.
 *
 * KHÔNG import gì từ store/registry để tránh circular import.
 */

import type { FontPairing } from '@/lib/slides';

/** Loại phần tử trên slide. */
export type ElementKind = 'image' | 'text' | 'shape';

/** Hình cơ bản cho shape element. */
export type ShapeKind = 'rect' | 'ellipse' | 'line';

/** Căn chữ ngang. */
export type TextAlign = 'left' | 'center' | 'right';

/** Bộ chỉnh ảnh cơ bản (áp bằng CSS filter khi hiển thị + tái dựng khi export). */
export interface ImageAdjust {
  brightness: number; // %  (100 = gốc)
  contrast: number; // %  (100 = gốc)
  saturate: number; // %  (100 = gốc)
  /** Nhiệt độ: -100 (lạnh) .. 0 .. +100 (ấm) → dịch sang sepia + hue nhẹ. */
  temperature: number;
}

export const DEFAULT_ADJUST: ImageAdjust = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  temperature: 0,
};

/** Vùng crop tính theo phần trăm của ảnh gốc (0..1). Mặc định = toàn ảnh. */
export interface CropRect {
  x: number; // 0..1
  y: number; // 0..1
  w: number; // 0..1
  h: number; // 0..1
}

export const FULL_CROP: CropRect = { x: 0, y: 0, w: 1, h: 1 };

/** Khung hình học chung — % của sân khấu. */
export interface Frame {
  x: number; // 0..100  (mép trái)
  y: number; // 0..100  (mép trên)
  w: number; // 0..100
  h: number; // 0..100
  rotation: number; // độ
}

interface BaseElement {
  id: string;
  kind: ElementKind;
  frame: Frame;
  /** z nhỏ = dưới. Mảng elements đã theo thứ tự z nhưng giữ field để tiện. */
  locked?: boolean;
  opacity?: number; // 0..1
}

export interface ImageElement extends BaseElement {
  kind: 'image';
  src: string; // URL hoặc data URI
  adjust: ImageAdjust;
  crop: CropRect;
  radius?: number; // bo góc, px @1920 quy đổi
}

export interface TextElement extends BaseElement {
  kind: 'text';
  text: string;
  /** cỡ chữ tính theo % chiều cao sân khấu (vd 5 = 54px @1080). */
  fontSize: number;
  color: string;
  align: TextAlign;
  bold: boolean;
  italic: boolean;
  /** gạch chân (như Word). Phản chiếu ở render.ts (canvas) + export PPTX. */
  underline?: boolean;
  /** khoảng cách chữ (letter-spacing) px @1080. */
  tracking?: number;
  lineHeight?: number; // hệ số
  /** danh sách bullet — mỗi dòng (\n) là 1 gạch đầu dòng "• ". */
  bullet?: boolean;
  /**
   * Ghi đè bộ chữ riêng cho element này (chuỗi font-family CSS, xem lib/present-editor/fonts).
   * Bỏ trống = kế thừa bộ chữ của deck (FontPairing).
   */
  fontFamily?: string;
  /** vai trò ngữ nghĩa để export PPTX map về SlideContent (title/body/kicker). */
  role?: 'title' | 'kicker' | 'body' | 'free';
}

export interface ShapeElement extends BaseElement {
  kind: 'shape';
  shape: ShapeKind;
  fill: string; // dùng cho rect/ellipse
  stroke: string;
  strokeWidth: number; // px @1080
  radius?: number; // bo góc rect
}

export type SlideElement = ImageElement | TextElement | ShapeElement;

/**
 * Hiệu ứng chuyển động (motion) kiểu Apple — chọn cho từng slide.
 * CHỈ ảnh hưởng khi TRÌNH CHIẾU (preview động), KHÔNG đổi model tĩnh nên PDF/PPTX bỏ qua.
 * Giữ trong model để serialize được + lưu/khôi phục.
 */
export type SlideTransition =
  | 'none' // cắt cứng
  | 'fade' // tan mờ
  | 'slide' // trượt ngang kiểu iOS
  | 'push' // đẩy (slide cũ ra, mới vào)
  | 'zoom' // phóng nhẹ (Magic Move rút gọn)
  | 'rise'; // trồi lên + blur tan (keynote Apple)

/** Kiểu build-in cho các phần tử của 1 slide (áp lần lượt khi slide xuất hiện). */
export type ElementReveal =
  | 'none'
  | 'fade' // hiện mờ đồng loạt
  | 'rise' // trồi lên lần lượt (stagger)
  | 'zoom'; // phóng nhẹ lần lượt

/** Một slide = nền + danh sách phần tử (thứ tự mảng = thứ tự vẽ, cuối = trên cùng). */
export interface EditorSlide {
  id: string;
  background: string; // màu nền (hex) — người dùng chỉnh được
  /** ảnh nền full-bleed (tuỳ chọn) — nằm dưới mọi element. */
  backgroundImage?: string | null;
  backgroundAdjust?: ImageAdjust;
  elements: SlideElement[];
  /** template gốc đã áp (để hiển thị/gợi ý). */
  templateId?: string;
  /** hiệu ứng chuyển VÀO slide này (mặc định kế thừa deck.transition). */
  transition?: SlideTransition;
  /** kiểu build-in cho phần tử của slide (mặc định kế thừa deck.reveal). */
  reveal?: ElementReveal;
}

/** Deck = nhiều slide + brand + bộ chữ + palette gu. */
export interface EditorDeck {
  id: string;
  brand: string;
  project: string;
  fonts: FontPairing;
  /** palette gu (6 màu) — dùng cho picker màu nhanh. */
  palette: string[];
  slides: EditorSlide[];
  /** hiệu ứng chuyển slide mặc định cho cả deck (slide có thể ghi đè). */
  transition?: SlideTransition;
  /** kiểu build-in phần tử mặc định cho cả deck. */
  reveal?: ElementReveal;
}

/* ------------------------------------------------------------------ */
/* Helpers tạo id + phần tử mặc định (đều serialize được).             */
/* ------------------------------------------------------------------ */

let _seq = 0;
/** id ổn định, KHÔNG dùng Math.random ở render body (hydration-safe khi gọi trong handler). */
export function newId(prefix = 'el'): string {
  _seq += 1;
  return `${prefix}_${Date.now().toString(36)}_${_seq.toString(36)}`;
}

export function makeText(partial: Partial<TextElement> = {}): TextElement {
  return {
    id: newId('txt'),
    kind: 'text',
    frame: { x: 8, y: 8, w: 50, h: 12, rotation: 0 },
    text: 'Nhập nội dung',
    fontSize: 5,
    color: '#221f1a',
    align: 'left',
    bold: false,
    italic: false,
    underline: false,
    tracking: 0,
    lineHeight: 1.2,
    bullet: false,
    role: 'free',
    opacity: 1,
    ...partial,
  };
}

export function makeImage(src: string, partial: Partial<ImageElement> = {}): ImageElement {
  return {
    id: newId('img'),
    kind: 'image',
    frame: { x: 10, y: 10, w: 40, h: 50, rotation: 0 },
    src,
    adjust: { ...DEFAULT_ADJUST },
    crop: { ...FULL_CROP },
    radius: 0,
    opacity: 1,
    ...partial,
  };
}

export function makeShape(shape: ShapeKind, partial: Partial<ShapeElement> = {}): ShapeElement {
  return {
    id: newId('shp'),
    kind: 'shape',
    shape,
    frame: { x: 20, y: 20, w: 30, h: 20, rotation: 0 },
    fill: shape === 'line' ? 'transparent' : '#8a6f4d',
    stroke: '#8a6f4d',
    strokeWidth: shape === 'line' ? 3 : 0,
    radius: 0,
    opacity: 1,
    ...partial,
  };
}

/** Bản sao sâu, serialize được (đủ cho model phẳng). */
export function cloneDeck(d: EditorDeck): EditorDeck {
  return JSON.parse(JSON.stringify(d));
}

/**
 * Nhân bản 1 element: sao sâu + cấp id mới + dời nhẹ (2%) để thấy được bản mới.
 * Dùng cho Ctrl+D và paste. `offset=false` khi paste vào slide khác (giữ nguyên vị trí).
 */
export function duplicateElement(el: SlideElement, offset = true): SlideElement {
  const copy: SlideElement = JSON.parse(JSON.stringify(el));
  copy.id = newId(el.kind);
  if (offset) {
    copy.frame = {
      ...copy.frame,
      x: Math.min(copy.frame.x + 2, 95),
      y: Math.min(copy.frame.y + 2, 95),
    };
  }
  copy.locked = false; // bản sao luôn mở khoá cho tiện chỉnh
  return copy;
}

/** Chuỗi CSS filter từ ImageAdjust — dùng cho hiển thị live VÀ tái dựng khi export. */
export function adjustToCssFilter(a: ImageAdjust | undefined): string {
  if (!a) return 'none';
  const parts = [
    `brightness(${a.brightness}%)`,
    `contrast(${a.contrast}%)`,
    `saturate(${a.saturate}%)`,
  ];
  // Nhiệt độ: ấm → sepia + hue nhẹ về vàng; lạnh → hue về xanh.
  if (a.temperature > 0) parts.push(`sepia(${Math.min(a.temperature, 100) * 0.6}%)`);
  else if (a.temperature < 0) parts.push(`hue-rotate(${a.temperature * 0.6}deg)`);
  return parts.join(' ');
}
