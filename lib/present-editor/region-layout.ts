/**
 * lib/present-editor/region-layout.ts — Lưới (từ detect-regions) → EditorSlide.
 *
 * Cầu nối cuối: nhận ô lưới `RegionCell[]` (đã theo % sân khấu) + nội dung + ngân sách
 * chuẩn (DECK_STANDARDS) → gán VAI TRÒ cho từng ô rồi dựng element.
 *
 * Gán vai trò bằng HÌNH HỌC (không cần biết ảnh gốc là slide hay ảnh gì):
 *   - ô mỏng, nằm cao  → TIÊU ĐỀ (title)
 *   - ô diện tích lớn  → ẢNH (tối đa theo budget.images)
 *   - ô còn lại        → BODY (chia đều các dòng ý)
 * Số ảnh bị KẸP về budget để không lệch chuẩn "trống/chật". Đây là điểm xuất phát —
 * người dùng chỉnh tiếp (human-in-the-loop). Thuần, không DOM.
 */

import { makeText, makeImage, newId } from './model';
import type { EditorSlide, SlideElement } from './model';
import type { RegionCell } from './detect-regions';
import { DECK_STANDARDS, budgetFor } from './standards';

export interface RegionContent {
  kicker?: string;
  title?: string;
  body?: string[];
  images?: string[]; // src/data-URI
}

export interface BuildRegionOpts {
  cells: RegionCell[];
  content: RegionContent;
  templateId?: string;
  palette?: string[];
  background?: string;
  ink?: string; // màu chữ
  hero?: boolean; // cỡ tiêu đề lớn (cover/quote)
}

const cellArea = (c: RegionCell) => c.w * c.h;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Chọn cỡ tiêu đề trong dải chuẩn (hero dùng dải lớn). */
function titleSize(hero: boolean): number {
  const t = hero ? DECK_STANDARDS.type.titleHeroPctH : DECK_STANDARDS.type.titlePctH;
  return t.ideal ?? (t.min + t.max) / 2;
}

/**
 * Dựng 1 slide từ lưới. Nếu cells rỗng → trả slide nền trơn (an toàn, không ném).
 */
export function buildSlideFromRegions(opts: BuildRegionOpts): EditorSlide {
  const { content, templateId, palette, background, hero } = opts;
  const ink = opts.ink ?? palette?.[palette.length - 1] ?? '#221f1a';
  const budget = budgetFor(templateId);
  const elements: SlideElement[] = [];

  // ô hợp lệ, bỏ ô quá nhỏ (đề phòng caller chưa lọc).
  const cells = [...opts.cells].filter((c) => c.w >= 6 && c.h >= 6);

  if (cells.length) {
    // 1) TIÊU ĐỀ: ô MỎNG NHẤT nằm ở nửa trên (y < 45); fallback ô cao nhất.
    let titleIdx = -1;
    if (content.title) {
      const topThin = cells
        .map((c, i) => ({ c, i }))
        .filter(({ c }) => c.y < 45)
        .sort((a, b) => a.c.h - b.c.h || a.c.y - b.c.y)[0];
      titleIdx = topThin ? topThin.i : cells.map((c, i) => ({ c, i })).sort((a, b) => a.c.y - b.c.y)[0].i;
    }

    // 2) ẢNH: các ô diện tích lớn nhất (trừ ô tiêu đề), kẹp theo budget + số ảnh có.
    const rest = cells.map((c, i) => ({ c, i })).filter(({ i }) => i !== titleIdx);
    const byArea = [...rest].sort((a, b) => cellArea(b.c) - cellArea(a.c));
    const imgs = content.images ?? [];
    const nImg = clamp(Math.min(imgs.length, byArea.length), budget.images.min, budget.images.max);
    const imageIdx = new Set(byArea.slice(0, nImg).map(({ i }) => i));

    // 3) dựng element theo từng ô.
    const bodyLines = content.body ?? [];
    const bodyCells = rest.filter(({ i }) => !imageIdx.has(i)).sort((a, b) => a.c.y - b.c.y || a.c.x - b.c.x);
    // chia đều dòng body cho các ô body (nếu có).
    const perCell = bodyCells.length ? Math.ceil(bodyLines.length / bodyCells.length) : bodyLines.length;

    let imgN = 0;
    let bodyPtr = 0;
    let bodyCellSeen = 0;
    cells.forEach((c, i) => {
      const frame = { x: c.x, y: c.y, w: c.w, h: c.h, rotation: 0 };
      if (i === titleIdx) {
        elements.push(
          makeText({
            id: newId('txt'),
            frame,
            text: content.title!,
            fontSize: titleSize(!!hero),
            color: ink,
            bold: true,
            role: 'title',
            lineHeight: DECK_STANDARDS.type.lineHeightDisplay.ideal ?? 1.15,
          }),
        );
      } else if (imageIdx.has(i)) {
        const src = imgs[imgN++ % Math.max(1, imgs.length)];
        if (src) elements.push(makeImage(src, { id: newId('img'), frame }));
      } else if (bodyLines.length && bodyCellSeen < bodyCells.length) {
        const part = bodyLines.slice(bodyPtr, bodyPtr + perCell);
        bodyPtr += perCell;
        bodyCellSeen++;
        if (part.length) {
          elements.push(
            makeText({
              id: newId('txt'),
              frame,
              text: part.join('\n'),
              fontSize: DECK_STANDARDS.type.bodyPctH.ideal ?? 2.6,
              color: ink,
              role: 'body',
              bullet: part.length > 1,
              lineHeight: DECK_STANDARDS.type.lineHeightBody.ideal ?? 1.45,
            }),
          );
        }
      }
    });
  }

  // kicker (nếu có) — dải nhỏ trên cùng, không chiếm ô lưới.
  if (content.kicker) {
    elements.unshift(
      makeText({
        id: newId('txt'),
        frame: { x: DECK_STANDARDS.grid.marginPctW.ideal ?? 6, y: 4, w: 50, h: 4, rotation: 0 },
        text: content.kicker,
        fontSize: DECK_STANDARDS.type.captionPctH.ideal ?? 1.8,
        color: ink,
        role: 'kicker',
      }),
    );
  }

  return {
    id: newId('slide'),
    background: background ?? '#ffffff',
    backgroundImage: null,
    elements,
    templateId,
  };
}
