/**
 * lib/present-editor/theme-roles.ts — VAI TRÒ MÀU (palette → role) + NHUỘM LẠI cả deck (PS-1 / G.6).
 *
 * Nền tảng của nút "Áp lại theme cho cả deck": slide cũ giữ màu đã "nướng" lúc tạo (raw hex),
 * KHÔNG tự đọc lại deck.palette. Muốn đổi gu/Brand Kit → phải NHUỘM LẠI từng element.
 *
 * Cách làm ĐÚNG (không phải find-and-replace hex cụ thể): mỗi màu đóng một VAI TRÒ trong bảng
 * màu — nền sáng (light), mực/tiêu đề (dark), nhấn (accent), phụ/placeholder (muted). Ta suy vai
 * trò của MÀU HIỆN TẠI bằng "gần role nào nhất trong palette CŨ" rồi thay bằng màu cùng vai trò
 * trong palette MỚI. Nhờ dựa vào VỊ TRÍ THẬT của màu (không dựa nhãn ngữ nghĩa), slide nền tối
 * (title sáng) vẫn được nhuộm đúng — light↦light, dark↦dark — không bị "chữ đen trên nền đen".
 *
 * PHẲNG, không side-effect, không import store/DOM → test bằng sucrase-node được.
 */

import type { EditorDeck, EditorSlide, SlideElement } from './model';

export type RoleName = 'dark' | 'light' | 'accent' | 'muted';

export interface PaletteRoles {
  /** mực đậm nhất — tiêu đề / body / đường nét trên nền sáng. */
  dark: string;
  /** sáng nhất — nền / chữ trên nền tối. */
  light: string;
  /** màu bão hoà nhất trong dải giữa — kicker / điểm nhấn. */
  accent: string;
  /** dải giữa — bề mặt phụ / khối placeholder. */
  muted: string;
  palette: string[];
}

const FALLBACK = ['#f5f1ea', '#dad0c7', '#c7a397', '#8a6f4d', '#635c45', '#221f1a'];

function toRgb(hex: string): { r: number; g: number; b: number } | null {
  const c = (hex || '').replace('#', '');
  if (c.length < 6 || /[^0-9a-fA-F]/.test(c.slice(0, 6))) return null;
  const n = parseInt(c.slice(0, 6), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function luminance(hex: string): number {
  const rgb = toRgb(hex);
  if (!rgb) return 128;
  return 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
}

function saturation(hex: string): number {
  const rgb = toRgb(hex);
  if (!rgb) return 0;
  const mx = Math.max(rgb.r, rgb.g, rgb.b);
  const mn = Math.min(rgb.r, rgb.g, rgb.b);
  return mx === 0 ? 0 : (mx - mn) / mx;
}

/**
 * Suy 4 vai trò màu từ bảng màu phẳng (cùng thuật toán với templates.pal — 1 nguồn sự thật).
 * Sắp theo độ sáng: tối nhất = dark, sáng nhất = light; dải giữa cho muted (giữa) + accent
 * (bão hoà nhất). Palette rỗng/hỏng → fallback quiet-luxury để không vỡ.
 */
export function paletteRoles(p: string[] | undefined): PaletteRoles {
  const palette = p && p.length ? p.filter((c) => toRgb(c)) : [];
  const base = palette.length ? palette : FALLBACK;
  const sorted = [...base].sort((a, b) => luminance(a) - luminance(b));
  const dark = sorted[0];
  const light = sorted[sorted.length - 1];
  const mids = sorted.slice(1, -1);
  const accent = [...(mids.length ? mids : sorted)].sort((a, b) => saturation(b) - saturation(a))[0];
  const muted = mids[Math.floor(mids.length / 2)] ?? dark;
  return { dark, light, accent, muted, palette: base };
}

/** Khoảng cách bình phương trong không gian RGB (đủ tốt cho phân loại vai trò). */
function dist2(a: string, b: string): number {
  const x = toRgb(a);
  const y = toRgb(b);
  if (!x || !y) return Number.POSITIVE_INFINITY;
  const dr = x.r - y.r;
  const dg = x.g - y.g;
  const db = x.b - y.b;
  return dr * dr + dg * dg + db * db;
}

/** Vai trò mà 1 màu đang đóng = role có màu GẦN NHẤT trong bảng vai trò đã suy. */
export function nearestRole(color: string, roles: PaletteRoles): RoleName {
  const cands: RoleName[] = ['dark', 'light', 'accent', 'muted'];
  let best: RoleName = 'dark';
  let bestD = Number.POSITIVE_INFINITY;
  for (const r of cands) {
    const d = dist2(color, roles[r]);
    if (d < bestD) {
      bestD = d;
      best = r;
    }
  }
  return best;
}

/** Có phải màu "thật" (hex 6 số) để nhuộm không — bỏ qua 'transparent'/rỗng/gradient. */
function isThemeableColor(c: string | undefined): c is string {
  return !!c && c !== 'transparent' && !!toRgb(c);
}

/**
 * Nhuộm 1 màu từ palette CŨ sang palette MỚI theo vai trò gần nhất.
 * Màu không hợp lệ (transparent…) giữ nguyên.
 */
export function remapColor(color: string, from: PaletteRoles, to: PaletteRoles): string {
  if (!isThemeableColor(color)) return color;
  return to[nearestRole(color, from)];
}

/** Nhuộm lại 1 element (theo loại) — trả BẢN MỚI, không đụng bản gốc. */
export function remapElementColors(
  el: SlideElement,
  from: PaletteRoles,
  to: PaletteRoles,
): SlideElement {
  if (el.kind === 'text') {
    return { ...el, color: remapColor(el.color, from, to) };
  }
  if (el.kind === 'shape') {
    return {
      ...el,
      fill: isThemeableColor(el.fill) ? remapColor(el.fill, from, to) : el.fill,
      stroke: isThemeableColor(el.stroke) ? remapColor(el.stroke, from, to) : el.stroke,
    };
  }
  return el; // ảnh: không có màu
}

/** Nhuộm lại 1 slide: nền + mọi element. */
export function remapSlideColors(
  slide: EditorSlide,
  from: PaletteRoles,
  to: PaletteRoles,
): EditorSlide {
  return {
    ...slide,
    background: isThemeableColor(slide.background)
      ? remapColor(slide.background, from, to)
      : slide.background,
    elements: slide.elements.map((el) => remapElementColors(el, from, to)),
  };
}

/**
 * NHUỘM LẠI CẢ DECK theo bảng màu mới (G.6). Trả deck MỚI (không side-effect):
 *   - đặt lại deck.palette = palette mới,
 *   - nhuộm nền + màu chữ + fill/stroke shape MỌI slide theo vai trò gần nhất trong palette cũ.
 * Ảnh nền/ảnh element không đổi (không có "màu"). Toạ độ, nội dung, font — giữ nguyên.
 *
 * `oldPalette` mặc định = deck.palette hiện tại (vai trò suy từ đó). Truyền tường minh khi cần.
 */
export function rethemeDeck(
  deck: EditorDeck,
  newPalette: string[],
  oldPalette: string[] = deck.palette,
): EditorDeck {
  const from = paletteRoles(oldPalette);
  const to = paletteRoles(newPalette);
  return {
    ...deck,
    palette: [...newPalette],
    slides: deck.slides.map((s) => remapSlideColors(s, from, to)),
  };
}
