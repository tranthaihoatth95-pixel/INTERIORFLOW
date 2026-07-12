/**
 * lib/present-editor/suggest.ts — GỢI Ý template theo nội dung + ảnh + gu.
 *
 * Heuristic (user chốt): #ảnh + độ dài chữ → Cover / Content+image / Two-column /
 * Grid / Quote / Full-bleed. Palette + fonts lấy từ gu. Đây chỉ là ĐIỂM XUẤT PHÁT —
 * người dùng override thoải mái (human-in-the-loop).
 */

import type { GuProfile } from '@/lib/gu';
import type { FontPairing } from '@/lib/slides';
import type { TemplateContext } from './templates';
import type { RegionCell } from './detect-regions';
import { patternIconHint } from './grid-geometry';

/** HOOK ML pha 1 — hình học lưới rút từ ảnh reference (detectRegions) để chọn archetype sát hơn. */
export interface GridGeometryInput {
  cells: RegionCell[];
  /** gutter đại diện theo % sân khấu (detectRegions.gutterXPct/YPct) — chỉ để giải thích. */
  gutterXPct?: number;
  gutterYPct?: number;
}

export interface SuggestInput {
  kicker?: string;
  title?: string;
  body?: string[];
  images?: string[];
  gu?: GuProfile | null;
  /** Tuỳ chọn — KHÔNG truyền = heuristic #ảnh + độ dài chữ y hệt cũ. */
  grid?: GridGeometryInput | null;
}

export interface Suggestion {
  templateId: string; // id trong BUILTIN_TEMPLATES
  reason: string; // giải thích tiếng Việt (hiển thị cho người dùng)
  ctx: TemplateContext; // context đã nhồi palette/fonts từ gu
  fonts: FontPairing;
}

/** Chọn bộ chữ theo style gu (mặc định Editorial cho quiet-luxury). */
function fontsFromGu(gu?: GuProfile | null): FontPairing {
  const s = (gu?.styles || []).join(' ');
  if (/modern|hiện đại|contemporary|đương đại|industrial|công nghiệp/.test(s)) return 'Modern';
  if (/neoclassic|tân cổ điển|luxury|sang trọng|elegant/.test(s)) return 'Elegant';
  return 'Editorial';
}

/**
 * Quyết định template. Ưu tiên rõ ràng:
 *  - 0 ảnh + chữ rất ngắn (title, 0-1 body)         → Quote
 *  - 0 ảnh + nhiều bullet                            → Two-column
 *  - 1 ảnh + đây là slide đầu / body ngắn            → Cover
 *  - 1 ảnh + có bullet                               → Content+image
 *  - >=3 ảnh                                         → Grid
 *  - 1-2 ảnh nhưng gần như KHÔNG chữ                 → Full-bleed
 */
export function suggestTemplate(input: SuggestInput, opts?: { isFirst?: boolean }): Suggestion {
  const images = (input.images || []).filter(Boolean);
  const body = (input.body || []).filter(Boolean);
  const nImg = images.length;
  const nBullet = body.length;
  const titleLen = (input.title || '').trim().length;
  const totalTextLen = titleLen + body.join(' ').length;

  const palette = input.gu?.palette?.length ? input.gu.palette : undefined;
  const fonts = fontsFromGu(input.gu);
  const ctx: TemplateContext = {
    kicker: input.kicker,
    title: input.title,
    body,
    images,
    palette,
    fonts,
  };

  let templateId: string;
  let reason: string;

  // HOOK ML pha 1: hình học lưới của ảnh reference (nếu có) — pattern/icon heuristic tất định
  // (grid-geometry.patternIconHint) làm TIE-BREAKER TRƯỚC luật nội dung; không khớp hint nào
  // → rơi xuống luật cũ NGUYÊN VẸN. Không truyền grid = hành vi cũ 100%.
  const hint = input.grid?.cells?.length ? patternIconHint(input.grid.cells) : null;
  const gutterNote =
    input.grid && (input.grid.gutterXPct || input.grid.gutterYPct)
      ? ` (gutter ≈${(input.grid.gutterXPct ?? 0).toFixed(0)}×${(input.grid.gutterYPct ?? 0).toFixed(0)}% sân khấu)`
      : '';
  if (hint?.suggestIconSet && nImg >= 2) {
    templateId = 'grid';
    reason = `Ảnh mẫu là lưới nhiều ô nhỏ đều${gutterNote} + ${nImg} ảnh → bố cục lưới. ${hint.reasons[0] ?? ''}`.trim();
    return { templateId, reason, ctx, fonts };
  }
  if (hint?.suggestColorBlock && nImg >= 1 && totalTextLen < 120) {
    templateId = 'full-bleed';
    reason = `Ảnh mẫu có khối lớn chiếm ưu thế${gutterNote} → ảnh tràn viền. ${hint.reasons.find((r) => r.includes('khối màu')) ?? ''}`.trim();
    return { templateId, reason, ctx, fonts };
  }

  if (nImg >= 3) {
    templateId = 'grid';
    reason = `${nImg} ảnh → lưới 2×2 để khoe nhiều hình.`;
  } else if (nImg >= 1 && totalTextLen < 40) {
    templateId = 'full-bleed';
    reason = 'Rất ít chữ + có ảnh → ảnh tràn viền, tiêu đề đặt trên ảnh.';
  } else if (nImg === 0 && nBullet <= 1 && titleLen > 0 && titleLen < 140) {
    templateId = 'quote';
    reason = 'Không ảnh, chữ ngắn gọn → dạng trích dẫn căn giữa.';
  } else if (nImg === 0 && nBullet >= 4) {
    templateId = 'two-column';
    reason = `${nBullet} ý, không ảnh → chia hai cột cho dễ đọc.`;
  } else if (nImg >= 1 && (opts?.isFirst || nBullet <= 2)) {
    templateId = 'cover';
    reason = opts?.isFirst
      ? 'Slide mở đầu + có ảnh → bố cục Bìa (chữ trái, ảnh phải).'
      : 'Có ảnh, ít ý → bố cục Bìa gọn gàng.';
  } else if (nImg >= 1) {
    templateId = 'content-image';
    reason = `Có ảnh + ${nBullet} ý → Nội dung bên trái, ảnh bên phải.`;
  } else {
    templateId = 'two-column';
    reason = 'Chỉ có chữ → hai cột.';
  }

  return { templateId, reason, ctx, fonts };
}
