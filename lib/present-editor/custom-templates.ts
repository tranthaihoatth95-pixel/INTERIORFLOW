/**
 * lib/present-editor/custom-templates.ts — TEMPLATE TỰ LƯU của người dùng (PS-2 / gap B.8, B.9).
 *
 * "Lưu slide này thành template": chụp lại 1 EditorSlide đang có trên canvas, tham số hoá
 * ĐÚNG theo cách BUILTIN_TEMPLATES làm (giữ khung %, biến nội dung/ảnh/màu thành chỗ trống để
 * fill lại khi áp cho slide khác) — KHÔNG phải component/instance sống kiểu Figma (liên kết
 * instance để ở PS-3, xem IF-PRESENT-SPRINT-PLAN mục PS-2 "Ranh giới").
 *
 * Persist localStorage, tái dùng ĐÚNG pattern brand-kit.ts/custom-fonts.ts: đọc/ghi JSON,
 * guard `typeof window`, im lặng khi lỗi (localStorage đầy/chặn).
 *
 * Slot hoá (đơn giản, đủ dùng cho deck ≤5 sheet):
 *   - text role 'title'/'kicker' → ghi đè bằng ctx.title/ctx.kicker khi có; KHÔNG có thì giữ
 *     nguyên chữ đã "nướng" lúc chụp — cùng quy ước với build() của BUILTIN_TEMPLATES.
 *   - text role 'body' → ghi đè bằng ctx.body (nối bullet "• ", giống textBlocks() trong
 *     templates.ts) khi ctx có; không thì giữ nguyên.
 *   - MỌI image element + backgroundImage (nếu có) → lấy theo thứ tự từ ctx.images (imgAt,
 *     cùng hàm dùng cho builtin) khi ctx có ảnh; KHÔNG có thì giữ ẢNH ĐÃ CHỤP (khác builtin:
 *     builtin không có ảnh gốc để giữ nên phải hiện khối xám placeholder).
 *   - màu: nhuộm lại từ palette LÚC CHỤP sang palette hiện hành (ctx.palette) bằng
 *     remapSlideColors (theme-roles.ts) — TÁI DÙNG máy nhuộm của Brand Kit (PS-1), không viết
 *     lại thuật toán. Nhờ vậy áp template tự lưu vào deck đang mang Brand Kit khác → tự nhuộm
 *     theo brand hiện hành, không cần bước riêng.
 */

import type { EditorSlide, SlideElement, TextElement, ImageElement } from './model';
import { newId } from './model';
import { paletteRoles, remapSlideColors } from './theme-roles';
import type { EditorTemplate, TemplateContext } from './templates';
import { imgAt } from './templates';

export interface CustomTemplate {
  id: string;
  name: string;
  /** ảnh xem trước (dataURL render lúc lưu) — hiện thẳng trong picker, khỏi build lại mỗi lần. */
  thumb: string | null;
  /** slide đã chụp (frame % + phần tử) — nguồn build lại mỗi lần áp. */
  slide: EditorSlide;
  /** palette lúc chụp (để nhuộm đúng vai trò khi palette hiện hành khác đi lúc áp). */
  palette: string[];
  createdAt: number;
  updatedAt: number;
}

const KEY = 'interiorflow.customTemplates';

function read(): CustomTemplate[] {
  if (typeof window === 'undefined') return [];
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]') as CustomTemplate[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function write(list: CustomTemplate[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* localStorage đầy/chặn — bỏ qua persist */
  }
}

function makeId(): string {
  return `ct_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

/** Toàn bộ template tự lưu (mới nhất trước). */
export function getCustomTemplates(): CustomTemplate[] {
  return read();
}

/** Lưu 1 slide hiện tại thành template mới. Trả template đã lưu (đã có id). */
export function saveCustomTemplate(input: {
  name: string;
  slide: EditorSlide;
  palette: string[];
  thumb?: string | null;
}): CustomTemplate {
  const list = read();
  const ct: CustomTemplate = {
    id: makeId(),
    name: input.name.trim() || 'Mẫu của tôi',
    thumb: input.thumb ?? null,
    // sao sâu — tách khỏi slide đang chỉnh trên canvas (undo/redo sau đó không ảnh hưởng bản đã lưu).
    slide: JSON.parse(JSON.stringify(input.slide)),
    palette: [...input.palette],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  write([ct, ...list]);
  return ct;
}

export function deleteCustomTemplate(id: string): void {
  write(read().filter((t) => t.id !== id));
}

export function renameCustomTemplate(id: string, name: string): void {
  const list = read();
  const idx = list.findIndex((t) => t.id === id);
  if (idx < 0) return;
  const next = [...list];
  next[idx] = { ...next[idx], name: name.trim() || next[idx].name, updatedAt: Date.now() };
  write(next);
}

/* ---------------------- PHẦN THUẦN (build lại thành EditorSlide) ---------------------- */

function isText(e: SlideElement): e is TextElement {
  return e.kind === 'text';
}
function isImage(e: SlideElement): e is ImageElement {
  return e.kind === 'image';
}

/**
 * Build 1 EditorSlide mới từ template tự lưu + ngữ cảnh (ctx) — CÙNG chữ ký build(ctx) của
 * BUILTIN_TEMPLATES nên cắm thẳng vào picker/áp-template hiện có (xem toEditorTemplate bên dưới),
 * không cần nhánh xử lý riêng ở PresentEditor.
 */
export function buildFromCustomTemplate(ct: CustomTemplate, ctx: TemplateContext): EditorSlide {
  let imgSeen = 0;
  const elements: SlideElement[] = ct.slide.elements.map((el) => {
    if (isText(el)) {
      if (el.role === 'title' && ctx.title) return { ...el, id: newId('txt'), text: ctx.title };
      if (el.role === 'kicker' && ctx.kicker)
        return { ...el, id: newId('txt'), text: ctx.kicker.toUpperCase() };
      if (el.role === 'body' && ctx.body?.length) {
        const text = ctx.body.map((b) => `• ${b.replace(/^[-•]\s*/, '')}`).join('\n');
        return { ...el, id: newId('txt'), text };
      }
      return { ...el, id: newId('txt') };
    }
    if (isImage(el)) {
      const i = imgSeen;
      imgSeen += 1;
      return { ...el, id: newId('img'), src: imgAt(ctx, i) ?? el.src };
    }
    return { ...el, id: newId(el.kind) };
  });

  // backgroundImage (nếu có) coi như Ô ẢNH cuối cùng — cùng thứ tự onApplyTemplate() đã gom
  // ctx.images (element trước, backgroundImage sau) khi trích từ slide nguồn.
  const backgroundImage = ct.slide.backgroundImage
    ? (imgAt(ctx, imgSeen) ?? ct.slide.backgroundImage)
    : (ct.slide.backgroundImage ?? null);

  const from = paletteRoles(ct.palette);
  const to = paletteRoles(ctx.palette && ctx.palette.length ? ctx.palette : ct.palette);
  const recolored = remapSlideColors({ ...ct.slide, elements, backgroundImage }, from, to);

  return {
    ...recolored,
    id: newId('sld'),
    templateId: `mine_${ct.id}`,
  };
}

/** Bọc 1 template tự lưu thành EditorTemplate — cắm thẳng vào picker (group 'mine'). */
export function toEditorTemplate(ct: CustomTemplate): EditorTemplate {
  return {
    id: `mine_${ct.id}`,
    name: ct.name,
    group: 'mine',
    thumb: ct.thumb ?? null,
    build: (ctx: TemplateContext) => buildFromCustomTemplate(ct, ctx),
  };
}

/** Tiện ích: toàn bộ template tự lưu, đã bọc EditorTemplate (mới nhất trước). */
export function customTemplatesAsEditorTemplates(): EditorTemplate[] {
  return getCustomTemplates().map(toEditorTemplate);
}
