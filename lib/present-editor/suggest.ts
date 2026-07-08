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

export interface SuggestInput {
  kicker?: string;
  title?: string;
  body?: string[];
  images?: string[];
  gu?: GuProfile | null;
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
