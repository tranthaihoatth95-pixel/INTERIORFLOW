/**
 * lib/present-editor/text-contrast.ts — P6a (04/08, TICKET-PRESENT-UI-GON, Hoà chốt).
 *
 * Trước ticket này, Present CHỈ dùng TẦNG 2 (CSS thuần, suy tone từ màu người dùng đã chọn) của
 * `lib/adaptive-contrast.ts` — không bao giờ tự đổi màu chữ, chỉ đắp sương+bóng đổ. Hoà chốt
 * carve-out: khi chữ FAIL WCAG AA với nền đo được THẬT (TẦNG 1, `readImageRegion`), hệ được tự
 * chọn màu dễ đọc làm MẶC ĐỊNH — nhưng CHỈ khi (a) `colorAuto === true` (text mới/chưa ai chỉnh
 * tay) và (b) màu hiện tại thật sự KHÔNG đạt AA. Người dùng luôn đổi lại được (≤2 click, xem
 * TextToolbar.tsx/Inspector.tsx) — bấm 1 lần là tắt `colorAuto` vĩnh viễn.
 *
 * File này CHỈ chứa hàm THUẦN (không DOM, không React) — hình học tìm nền, chọn ứng viên, build
 * bóng đổ mảnh. Phần ĐO NỀN THẬT (`readImageRegion`, cần canvas) vẫn nằm ở lib/adaptive-contrast.ts
 * (đã dùng chung toàn app) — file này chỉ IMPORT lại, không viết trùng phép đo pixel.
 *
 * Kiến trúc "đo 1 lần rồi GHI THẲNG vào `el.color`" (không tính lại mỗi lần vẽ): xem
 * `components/present-editor/EditorCanvas.tsx` — effect gọi `resolveAutoTextColor` rồi
 * `onUpdateText` ghi kết quả vào element. Nhờ vậy render.ts (canvas bake PDF/PNG) và export.ts/
 * pptx (cả nhánh "content" đọc `el.color` thẳng lẫn nhánh "image" bake qua render.ts) tự động ăn
 * đúng màu đã chốt — KHÔNG cần đo lại pixel ở 3 nơi khác nhau, tránh lệch preview/export.
 */

import {
  type RGB,
  type ContrastReading,
  AA_NORMAL,
  AA_LARGE,
  contrastRatio,
  relLuminance,
  grayForLuminance,
  parseColor,
  rgbCss,
  framesOverlap,
  type SampleRegion,
} from '../adaptive-contrast';

/* ---------- Tìm ảnh nền ngay dưới chữ (để đo) ---------- */

interface FrameLike {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface ElementLike {
  id: string;
  kind: string;
  frame: FrameLike;
  hidden?: boolean;
  src?: string;
}

export interface TextBackdrop {
  src: string;
  region: SampleRegion;
}

/**
 * Tìm ảnh NGAY DƯỚI (gần chữ nhất theo z-order) giao khung với `el`, hoặc ảnh nền full-bleed
 * của slide. Trả toạ độ vùng cần đo THEO TỈ LỆ RIÊNG của ảnh đó (0..1) — quy đổi gần đúng, dung
 * sai crop/object-cover chấp nhận được (cùng triết lý "vùng RỘNG" đã ghi trong
 * `readImageRegion`'s JSDoc — không cần biết chính xác object-position mọi nơi gọi).
 *
 * KHÁC `textOverImage` (Element.tsx): hàm đó chỉ cần biết CÓ/KHÔNG (quét từ dưới lên, dừng ở
 * ảnh ĐẦU TIÊN giao khung theo z THẤP nhất). Hàm này cần biết ẢNH NÀO để đọc pixel, nên quét từ
 * NGAY DƯỚI `el` lên — ảnh GẦN chữ nhất theo z, hợp lý hơn cho việc "chữ đang nằm trên ảnh nào".
 * Tách riêng, KHÔNG sửa `textOverImage` — giữ nguyên hành vi cũ đã có 3 nơi gọi phụ thuộc.
 */
export function findTextBackdrop(
  el: ElementLike,
  elements: ElementLike[],
  slideBackgroundImage: string | null | undefined,
): TextBackdrop | null {
  if (el.kind !== 'text') return null;
  const i = elements.findIndex((e) => e.id === el.id);
  if (i >= 0) {
    for (let k = i - 1; k >= 0; k--) {
      const below = elements[k];
      if (below.kind === 'image' && !below.hidden && below.src && framesOverlap(el.frame, below.frame)) {
        const f = below.frame;
        const ox0 = Math.max(el.frame.x, f.x);
        const oy0 = Math.max(el.frame.y, f.y);
        const ox1 = Math.min(el.frame.x + el.frame.w, f.x + f.w);
        const oy1 = Math.min(el.frame.y + el.frame.h, f.y + f.h);
        const region: SampleRegion = {
          x: f.w > 0 ? (ox0 - f.x) / f.w : 0,
          y: f.h > 0 ? (oy0 - f.y) / f.h : 0,
          w: f.w > 0 ? Math.max(0.02, (ox1 - ox0) / f.w) : 1,
          h: f.h > 0 ? Math.max(0.02, (oy1 - oy0) / f.h) : 1,
        };
        return { src: below.src, region };
      }
    }
  }
  if (slideBackgroundImage) {
    return {
      src: slideBackgroundImage,
      region: {
        x: el.frame.x / 100,
        y: el.frame.y / 100,
        w: Math.max(0.02, el.frame.w / 100),
        h: Math.max(0.02, el.frame.h / 100),
      },
    };
  }
  return null;
}

/* ---------- Ngưỡng AA theo cỡ chữ ---------- */

/**
 * Ngưỡng WCAG AA theo cỡ chữ. `fontSizePct` = `TextElement.fontSize` (% chiều cao sân khấu,
 * quy ước "5 = 54px @1080" ghi trong model.ts) — quy đổi gần đúng ra px @1080 để so ngưỡng
 * 18px/14px-bold của WCAG. Ảnh export ở độ phân giải khác 1080 thì tỉ lệ vẫn giữ nguyên (ngưỡng
 * là TƯƠNG ĐỐI theo % sân khấu, không phải số px tuyệt đối một độ phân giải cụ thể).
 */
export function aaRatioForFontSize(fontSizePct: number, bold: boolean): number {
  const approxPx = fontSizePct * 10.8; // 1% ≈ 10.8px @1080, khớp quy ước trong model.ts
  return approxPx >= 18 || (bold && approxPx >= 14) ? AA_LARGE : AA_NORMAL;
}

/* ---------- Chọn ứng viên màu ---------- */

export interface AutoColorPick {
  rgb: RGB;
  ratio: number;
  /** true = ứng viên này đã đạt ngưỡng AA; false = đây là ứng viên TỐT NHẤT trong số không đạt. */
  passed: boolean;
}

/** Thử từng ứng viên THEO ĐÚNG THỨ TỰ, trả ứng viên ĐẦU TIÊN đạt ngưỡng; không ai đạt → trả
 * ứng viên có tỉ số tương phản CAO NHẤT (tốt nhất có thể, `passed: false`). */
export function pickAutoTextColor(bg: RGB, candidates: RGB[], ratio: number): AutoColorPick {
  let best: RGB = candidates[0] ?? [255, 255, 255];
  let bestRatio = 0;
  for (const c of candidates) {
    const r = contrastRatio(c, bg);
    if (r >= ratio) return { rgb: c, ratio: r, passed: true };
    if (r > bestRatio) {
      bestRatio = r;
      best = c;
    }
  }
  return { rgb: best, ratio: bestRatio, passed: false };
}

/* ---------- Bóng đổ mảnh (chỉ khi ứng viên tốt nhất vẫn không đạt AA) ---------- */

const AUTO_SHADOW_INK: RGB = [20, 17, 13]; // khớp INK trong adaptive-contrast.ts
const AUTO_SHADOW_CREAM: RGB = [246, 242, 234]; // khớp CREAM

function autoShadowRgb(color: string): RGB {
  const rgb = parseColor(color) ?? [0, 0, 0];
  return relLuminance(rgb) > 0.5 ? AUTO_SHADOW_INK : AUTO_SHADOW_CREAM;
}

/** `text-shadow` CSS mảnh — alpha thấp hơn hẳn scrim cũ (0.28/0.24 so với 0.5/0.42), đúng tinh
 * thần "mảnh, chỉ khi vẫn thiếu" trong ticket, không phải hiệu ứng trang trí. */
export function autoShadowCss(color: string): string {
  const [r, g, b] = autoShadowRgb(color);
  return [`0 1px 2px rgba(${r},${g},${b},0.28)`, `0 0 14px rgba(${r},${g},${b},0.24)`].join(', ');
}

/** Tương đương cho canvas (render.ts bake PDF/PNG) — offset/blur quy theo `sizePx` (cỡ chữ đã
 * vẽ), KHÔNG theo số px tuyệt đối như CSS, vì bake chạy ở nhiều độ phân giải xuất khác nhau. */
export function autoShadowCanvasLayers(
  color: string,
  sizePx: number,
): { x: number; y: number; blur: number; color: string }[] {
  const [r, g, b] = autoShadowRgb(color);
  return [
    { x: 0, y: sizePx * 0.018, blur: sizePx * 0.036, color: `rgba(${r},${g},${b},0.28)` },
    { x: 0, y: 0, blur: sizePx * 0.26, color: `rgba(${r},${g},${b},0.24)` },
  ];
}

/* ---------- Orchestrator: đo → có cần sửa không → sửa gì ---------- */

export interface AutoColorFix {
  color: string;
  autoShadow: boolean;
}

/**
 * Từ số đo nền THẬT (`readImageRegion`), quyết định có cần sửa `el.color` không.
 * Trả `null` khi màu HIỆN TẠI đã đạt AA rồi — ĐÚNG "KHÔNG đụng chữ đã đủ contrast" Hoà chốt.
 *
 * @param deckAccentColor "màu deck" — ứng viên thứ 3, SAU trắng/đen (đúng thứ tự Hoà nêu). Bỏ
 *   trống (SlideStrip/PlayerElements không có `palette` sẵn) → chỉ thử trắng/đen, đủ cho tuyệt
 *   đại đa số ảnh thật (2 cực sáng/tối luôn có Ít NHẤT một bên đạt AA trừ ảnh cực kỳ lưng chừng).
 */
export function resolveAutoTextColor(
  el: { color: string; fontSize: number; bold: boolean },
  reading: ContrastReading,
  deckAccentColor?: string,
): AutoColorFix | null {
  const bg: RGB = reading.avg ?? grayForLuminance(reading.luminance);
  const ratio = aaRatioForFontSize(el.fontSize, el.bold);

  const currentRgb = parseColor(el.color);
  if (currentRgb && contrastRatio(currentRgb, bg) >= ratio) return null; // đã đủ AA — không đụng

  const candidates: RGB[] = [
    [255, 255, 255],
    [0, 0, 0],
  ];
  if (deckAccentColor) {
    const parsed = parseColor(deckAccentColor);
    if (parsed) candidates.push(parsed);
  }

  const pick = pickAutoTextColor(bg, candidates, ratio);
  return { color: rgbCss(pick.rgb), autoShadow: !pick.passed };
}
