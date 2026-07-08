/**
 * lib/present-editor/spec.ts — BẢNG HỎI SỐ LIỆU khi sinh/áp bố cục.
 *
 * User chốt: khi generate bố cục, hỏi tối thiểu:
 *   - tối thiểu bao nhiêu hình / tối đa bao nhiêu hình,
 *   - tone màu chủ đạo,
 *   - nền là HÌNH hay MÀU.
 * Kèm "tuỳ chọn nhanh" (preset) trỏ thẳng vào xử lý → áp vào bố cục sinh ra.
 *
 * LayoutSpec là dữ liệu phẳng, serialize được. applySpecToSlide() hậu xử lý một
 * EditorSlide vừa build từ template cho khớp spec (số hình, tone nền…). Human-in-loop:
 * đây chỉ là ĐIỂM XUẤT PHÁT, người dùng vẫn sửa tự do sau đó.
 */

import type { EditorSlide, SlideElement, ImageElement, ShapeElement } from './model';
import { DEFAULT_ADJUST } from './model';

/** Nền của slide sinh ra: theo MÀU phẳng hay ẢNH (full-bleed / hero). */
export type BackgroundMode = 'color' | 'image';

/** Tone màu chủ đạo — ánh xạ sang cách chọn nền sáng/tối/màu nhấn. */
export type ToneKey = 'light' | 'warm' | 'dark' | 'accent';

export interface LayoutSpec {
  /** số hình tối thiểu muốn có trên bố cục. */
  minImages: number;
  /** số hình tối đa (cắt bớt ô ảnh thừa nếu template sinh nhiều hơn). */
  maxImages: number;
  /** tone màu chủ đạo. */
  tone: ToneKey;
  /** nền là màu hay ảnh. */
  background: BackgroundMode;
}

export const DEFAULT_SPEC: LayoutSpec = {
  minImages: 1,
  maxImages: 4,
  tone: 'light',
  background: 'color',
};

/** Preset "tuỳ chọn nhanh" — 1 chạm điền cả bảng hỏi. */
export const SPEC_PRESETS: { id: string; label: string; hint: string; spec: LayoutSpec }[] = [
  {
    id: 'cover-1',
    label: 'Bìa 1 ảnh lớn',
    hint: 'Nền ảnh tràn viền, tone tối điện ảnh',
    spec: { minImages: 1, maxImages: 1, tone: 'dark', background: 'image' },
  },
  {
    id: 'text-clean',
    label: 'Trang chữ sạch',
    hint: 'Không ảnh, nền sáng',
    spec: { minImages: 0, maxImages: 0, tone: 'light', background: 'color' },
  },
  {
    id: 'mood-grid',
    label: 'Moodboard nhiều hình',
    hint: '4–6 hình, nền màu ấm',
    spec: { minImages: 4, maxImages: 6, tone: 'warm', background: 'color' },
  },
  {
    id: 'material',
    label: 'Vật liệu 2–3 mẫu',
    hint: 'Ít hình, nền sáng, có nhãn',
    spec: { minImages: 2, maxImages: 3, tone: 'light', background: 'color' },
  },
];

const TONE_HINT: Record<ToneKey, string> = {
  light: 'Sáng, giấy ấm',
  warm: 'Ấm, be/đồng',
  dark: 'Tối, điện ảnh',
  accent: 'Màu nhấn nổi',
};
export function toneHint(t: ToneKey): string {
  return TONE_HINT[t];
}

/** Sắp xếp palette theo độ sáng để lấy màu sáng/tối/nhấn. */
function sortByLum(palette: string[]): { dark: string; light: string; accent: string } {
  const fallback = ['#f5f1ea', '#dad0c7', '#c7a397', '#8a6f4d', '#635c45', '#221f1a'];
  const p = palette && palette.length ? palette : fallback;
  const lum = (hex: string) => {
    const c = hex.replace('#', '');
    if (c.length < 6) return 128;
    const n = parseInt(c, 16);
    return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
  };
  const sorted = [...p].sort((a, b) => lum(a) - lum(b));
  const sat = (hex: string) => {
    const c = hex.replace('#', '');
    if (c.length < 6) return 0;
    const n = parseInt(c, 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    return mx === 0 ? 0 : (mx - mn) / mx;
  };
  const mids = sorted.slice(1, -1);
  const accent = [...(mids.length ? mids : sorted)].sort((a, b) => sat(b) - sat(a))[0];
  return { dark: sorted[0], light: sorted[sorted.length - 1], accent };
}

/** Màu nền theo tone chủ đạo. */
export function backgroundColorForTone(tone: ToneKey, palette: string[]): string {
  const { dark, light, accent } = sortByLum(palette);
  if (tone === 'dark') return dark;
  if (tone === 'accent') return accent;
  if (tone === 'warm') {
    // màu ấm = mid ấm nhất; xấp xỉ bằng accent nếu ấm, không thì light hơi trầm
    return accent || light;
  }
  return light;
}

/**
 * Hậu xử lý slide vừa build cho khớp spec (human-in-loop, chỉ điều chỉnh nhẹ):
 *   - đổi màu nền theo tone,
 *   - nếu background='image' và có ảnh: chuyển ảnh lớn nhất thành ảnh nền full-bleed,
 *   - nếu background='color': gỡ ảnh nền (đưa về khối ảnh thường nếu cần) — nhưng
 *     KHÔNG thêm ảnh; template tự có ô ảnh,
 *   - cắt bớt ô ảnh vượt maxImages (ưu tiên giữ ô lớn nhất).
 * Trả về slide mới (không mutate đầu vào ngoài clone nông cần thiết).
 */
export function applySpecToSlide(
  slide: EditorSlide,
  spec: LayoutSpec,
  palette: string[],
): EditorSlide {
  const out: EditorSlide = {
    ...slide,
    elements: slide.elements.map((e) => ({ ...e })) as SlideElement[],
  };

  // 1) nền theo tone
  out.background = backgroundColorForTone(spec.tone, palette);

  // 2) giới hạn số ảnh: cắt bớt image element vượt maxImages (giữ ô lớn trước).
  if (spec.maxImages >= 0) {
    const imgs = out.elements
      .map((e, i) => ({ e, i }))
      .filter((x) => x.e.kind === 'image') as { e: ImageElement; i: number }[];
    if (imgs.length > spec.maxImages) {
      const keep = new Set(
        imgs
          .slice()
          .sort((a, b) => b.e.frame.w * b.e.frame.h - a.e.frame.w * a.e.frame.h)
          .slice(0, spec.maxImages)
          .map((x) => x.i),
      );
      out.elements = out.elements.filter((e, i) => e.kind !== 'image' || keep.has(i));
    }
  }

  // 3) nền ảnh vs màu
  if (spec.background === 'image') {
    // nếu chưa có ảnh nền nhưng có ảnh element → dùng ảnh lớn nhất làm nền, bỏ element đó.
    if (!out.backgroundImage) {
      const imgs = out.elements.filter((e): e is ImageElement => e.kind === 'image');
      if (imgs.length) {
        const hero = imgs.slice().sort((a, b) => b.frame.w * b.frame.h - a.frame.w * a.frame.h)[0];
        out.backgroundImage = hero.src;
        out.backgroundAdjust = { ...DEFAULT_ADJUST, brightness: spec.tone === 'dark' ? 74 : 92 };
        out.elements = out.elements.filter((e) => e.id !== hero.id);
      }
    }
  } else {
    // nền màu: gỡ ảnh nền nếu có (đưa bố cục về nền phẳng).
    out.backgroundImage = null;
    out.backgroundAdjust = undefined;
  }

  void ({} as ShapeElement); // giữ import type nếu cần mở rộng
  return out;
}

/** Điểm số "khớp spec" của một template (để gợi ý template hợp bảng hỏi). Cao = hợp. */
export function scoreTemplateForSpec(
  imageSlots: number,
  hasBackgroundImage: boolean,
  spec: LayoutSpec,
): number {
  let s = 0;
  // số ô ảnh nằm trong [min,max] → cộng điểm.
  if (imageSlots >= spec.minImages && imageSlots <= spec.maxImages) s += 3;
  else s -= Math.abs(imageSlots - Math.round((spec.minImages + spec.maxImages) / 2));
  // nền hình/màu khớp.
  if (spec.background === 'image' && (hasBackgroundImage || imageSlots >= 1)) s += 2;
  if (spec.background === 'color' && !hasBackgroundImage) s += 1;
  return s;
}
