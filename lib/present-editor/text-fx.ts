/**
 * lib/present-editor/text-fx.ts — NGUỒN CHUNG cho hiệu ứng chữ (#2).
 *
 * Chữ được vẽ ở HAI hệ khác nhau:
 *   · DOM   — components/present-editor/Element.tsx (editor canvas, player, thumbnail strip)
 *   · Canvas — lib/present-editor/render.ts (PDF / PNG / PPTX-ảnh)
 * Module này giữ phần LOGIC dùng chung (quy đổi đơn vị, preset, kiểm tra "có hiệu ứng
 * không") để hai hệ không trôi lệch nhau. Mỗi hệ chỉ còn phần vẽ đặc thù của nó.
 *
 * QUY ƯỚC ĐƠN VỊ — quan trọng: mọi khoảng cách trong `TextFx` (stroke, shadow x/y/blur,
 * wordSpacing) tính theo **% CHIỀU CAO SÂN KHẤU**, giống `TextElement.fontSize`. Nhờ vậy
 * hiệu ứng co giãn đúng tỉ lệ ở mọi khổ (16:9 / A4 / A3) và mọi cỡ hiển thị (thumbnail 150px
 * hay export 1920px đều ra cùng một hình). Đổi sang px = value/100 × chiều cao thật.
 *
 * Gu quiet-luxury (CLAUDE.md): mặc định TẮT hết; preset dựng sẵn đều tiết chế — viền mảnh,
 * bóng mềm một lớp, gradient CÙNG TÔNG. Không neon, không đổ bóng cứng kiểu WordArt.
 */

import type { TextFx, TextGradient, TextShadowLayer } from './model';

/** Đổi giá trị "% chiều cao sân khấu" sang px theo chiều cao thật đang vẽ. */
export function pctToPx(pct: number, stageHeightPx: number): number {
  return (pct / 100) * stageHeightPx;
}

/** Có hiệu ứng nào đang bật không? Dùng để đi ĐƯỜNG NHANH (vẽ như cũ) khi không có. */
export function hasFx(fx: TextFx | undefined): boolean {
  if (!fx) return false;
  return Boolean(
    (fx.strokeWidth && fx.strokeWidth > 0) ||
      fx.outlineOnly ||
      (fx.shadows && fx.shadows.length > 0) ||
      fx.gradient ||
      (fx.wordSpacing && fx.wordSpacing !== 0) ||
      (fx.transform && fx.transform !== 'none') ||
      (fx.blend && fx.blend !== 'normal') ||
      (fx.curve && fx.curve !== 0),
  );
}

/** Chữ có đang uốn cong không (chỉ áp cho 1 dòng — xem ghi chú ở TextFx.curve). */
export function isCurved(fx: TextFx | undefined): boolean {
  return Boolean(fx?.curve && Math.abs(fx.curve) > 0.5);
}

/** Áp biến đổi hoa/thường ở TẦNG DỮ LIỆU để canvas và DOM ra CÙNG một chuỗi. */
export function applyTransform(text: string, fx: TextFx | undefined): string {
  switch (fx?.transform) {
    case 'uppercase':
      return text.toLocaleUpperCase('vi-VN');
    case 'lowercase':
      return text.toLocaleLowerCase('vi-VN');
    case 'capitalize':
      return text.replace(/(^|\s)(\S)/g, (_m, sp: string, ch: string) => sp + ch.toLocaleUpperCase('vi-VN'));
    default:
      return text;
  }
}

/**
 * Chuỗi CSS `text-shadow` từ danh sách lớp bóng (rỗng → undefined).
 *
 * `unit` cho phép DÙNG CHUNG hàm này ở cả hai hệ:
 *   · DOM   → 'cqh'. Đơn vị container-query = % chiều cao khung sân khấu, TRÙNG KHỚP quy ước
 *             của TextFx ⇒ khỏi cần biết sân khấu cao bao nhiêu px, và thumbnail 150px tự ra
 *             đúng tỉ lệ với canvas 1920px mà không cần code riêng.
 *   · Canvas → 'px' kèm `stageHeightPx` để quy đổi.
 */
export function shadowCss(
  shadows: TextShadowLayer[] | undefined,
  opts: { unit: 'cqh' } | { unit: 'px'; stageHeightPx: number },
): string | undefined {
  if (!shadows || !shadows.length) return undefined;
  const conv = (v: number) => (opts.unit === 'cqh' ? `${v}cqh` : `${pctToPx(v, opts.stageHeightPx).toFixed(2)}px`);
  return shadows.map((s) => `${conv(s.x)} ${conv(s.y)} ${conv(Math.max(0, s.blur))} ${s.color}`).join(', ');
}

/** Chuỗi CSS `linear-gradient(...)` cho nền chữ (dùng với background-clip: text). */
export function gradientCss(g: TextGradient): string {
  return `linear-gradient(${g.angle}deg, ${g.from}, ${g.to})`;
}

/**
 * Toạ độ điểm đầu/cuối của gradient trên canvas 2D, theo góc + hộp bao chữ.
 * Canvas không có "linear-gradient(deg)" nên phải tự chiếu góc lên hộp.
 */
export function gradientLine(
  angleDeg: number,
  box: { x: number; y: number; w: number; h: number },
): { x0: number; y0: number; x1: number; y1: number } {
  // CSS: 0deg = dưới→trên; ở đây quy ước 0 = trái→phải cho trực giác khi chỉnh tay.
  const rad = (angleDeg * Math.PI) / 180;
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  // nửa đường chéo chiếu lên trục góc → gradient phủ trọn hộp ở mọi góc
  const half = (Math.abs(Math.cos(rad)) * box.w + Math.abs(Math.sin(rad)) * box.h) / 2;
  const dx = Math.cos(rad) * half;
  const dy = Math.sin(rad) * half;
  return { x0: cx - dx, y0: cy - dy, x1: cx + dx, y1: cy + dy };
}

/* ------------------------------------------------------------------ */
/* PRESET — bấm phát dùng ngay                                        */
/* ------------------------------------------------------------------ */

export interface FxPreset {
  id: string;
  /** tên song ngữ Việt · English theo gu TTT. */
  label: string;
  hint: string;
  /** `null` = trả chữ về phẳng (gỡ mọi hiệu ứng). */
  fx: TextFx | null;
}

/**
 * Bộ preset gu quiet-luxury editorial. Cố ý KHÔNG có preset loè loẹt (neon/3D/chrome):
 * user làm nội thất cao cấp — bảng này để tạo TIÊU ĐỀ có sức nặng, không phải poster hội chợ.
 */
export const FX_PRESETS: FxPreset[] = [
  {
    id: 'none',
    label: 'Phẳng · Flat',
    hint: 'Gỡ mọi hiệu ứng, trả chữ về mặc định.',
    fx: null,
  },
  {
    id: 'editorial',
    label: 'Tạp chí · Editorial',
    hint: 'Chữ hoa, giãn nhẹ — nhãn đầu mục kiểu tạp chí kiến trúc.',
    fx: { transform: 'uppercase', wordSpacing: 0.4 },
  },
  {
    id: 'lift',
    label: 'Nổi khối · Soft lift',
    hint: 'Một lớp bóng mềm rất mảnh — chữ tách khỏi nền ảnh mà không thấy bóng.',
    fx: { shadows: [{ x: 0, y: 0.35, blur: 1.4, color: 'rgba(20,16,12,0.38)' }] },
  },
  {
    id: 'outline',
    label: 'Chữ rỗng · Outline',
    hint: 'Chỉ giữ nét viền — tiêu đề lớn đè lên ảnh render.',
    fx: { outlineOnly: true, strokeWidth: 0.12, strokeColor: '#221f1a' },
  },
  {
    id: 'engraved',
    label: 'Khắc chìm · Engraved',
    hint: 'Hai lớp bóng ngược chiều — chữ như khắc vào nền beige.',
    fx: {
      shadows: [
        { x: 0, y: -0.08, blur: 0, color: 'rgba(255,255,255,0.55)' },
        { x: 0, y: 0.1, blur: 0.16, color: 'rgba(34,31,26,0.45)' },
      ],
    },
  },
  {
    id: 'brass',
    label: 'Chuyển sắc đồng · Brass',
    hint: 'Gradient cùng tông đồng ấm — hợp bìa và trang mở đầu.',
    fx: { gradient: { from: '#C89B62', to: '#7A5A2E', angle: 100 } },
  },
  {
    id: 'navy-fade',
    label: 'Chuyển sắc navy · Navy fade',
    hint: 'Navy TTT nhạt dần — tiêu đề chương trên nền beige.',
    fx: { gradient: { from: '#002850', to: '#4A6C86', angle: 90 } },
  },
  {
    id: 'arc',
    label: 'Uốn cung · Arc',
    hint: 'Uốn nhẹ theo cung tròn — dùng cho nhãn con dấu, một dòng.',
    fx: { curve: 28, transform: 'uppercase', wordSpacing: 0.3 },
  },
];

/** Gộp preset vào fx hiện có (preset `none` xoá sạch). */
export function applyPreset(current: TextFx | undefined, preset: FxPreset): TextFx | undefined {
  if (!preset.fx) return undefined;
  return { ...current, ...preset.fx };
}
