/**
 * lib/present-editor/templates.ts — TEMPLATE dựng sẵn + template từ Reference.
 *
 * Template = một hàm build(ctx) → EditorSlide (element đặt sẵn theo % sân khấu).
 * Người dùng luôn được sửa tự do sau khi áp (human-in-the-loop).
 *
 * Hai nguồn (user chốt — BOTH):
 *   (a) BUILTIN_TEMPLATES: bố cục preset (Cover, Content+image, Two-column, Grid, Quote, Full-bleed).
 *   (b) templatesFromLibrary(assets): dẫn xuất từ ảnh Reference tag usage 'layout' (folder
 *       'bo cuc dan trang') và 'slide' — dùng chính ảnh đó làm ảnh nền/hero gợi ý bố cục.
 *
 * KHÔNG import store/registry (tránh circular).
 */

import type { FontPairing } from '@/lib/slides';
import type { GuAsset } from '@/lib/gu';
import {
  type EditorSlide,
  type SlideElement,
  makeText,
  makeImage,
  makeShape,
  newId,
  DEFAULT_ADJUST,
} from './model';

/** Bối cảnh áp template: nội dung + ảnh + gu palette/fonts. */
export interface TemplateContext {
  kicker?: string;
  title?: string;
  body?: string[];
  /** ảnh người dùng chọn (URL/data URI), theo thứ tự ưu tiên. */
  images?: string[];
  palette?: string[]; // gu palette (>=1)
  fonts?: FontPairing;
}

/** Phân loại con của builtin để picker gom nhóm gọn (từ archetype trong Reference). */
export type TemplateCategory =
  | 'Bìa & Mở đầu'
  | 'Nội dung'
  | 'Moodboard & Vật liệu'
  | 'Kỹ thuật'
  | 'Trưng bày';

/**
 * "Kệ" bố cục — 3 HÀNG gọn theo yêu cầu user (cuộn ngang, không đổ dọc):
 *   - 'cover'   : Bìa (trang mở đầu chính, đậm chất).
 *   - 'subcover': Bìa phụ (phân mục, mục lục, divider).
 *   - 'content' : Trang nội dung (mọi bố cục còn lại).
 */
export type LayoutShelf = 'cover' | 'subcover' | 'content' | 'closing';

export const SHELF_LABEL: Record<LayoutShelf, string> = {
  cover: 'Bìa',
  subcover: 'Bìa phụ',
  content: 'Nội dung chính',
  closing: 'Trang kết',
};

// Round 3: bổ sung cột "Trang kết" → 4 cột cuộn ngang (góp ý #1 & #12).
export const SHELF_ORDER: LayoutShelf[] = ['cover', 'subcover', 'content', 'closing'];

/** Suy ra kệ từ id/category template (gom 4 hàng). */
export function shelfOf(t: EditorTemplate): LayoutShelf {
  if (t.shelf) return t.shelf;
  const id = t.id;
  if (id === 'cover' || id === 'dark-cover' || id === 'full-bleed') return 'cover';
  if (id === 'closing') return 'closing';
  if (id === 'section-divider' || id === 'agenda') return 'subcover';
  return 'content';
}

export interface EditorTemplate {
  id: string;
  name: string;
  /** nhóm để hiển thị: 'Bố cục' (builtin) hoặc 'Thư viện' (từ Reference). */
  group: 'builtin' | 'library';
  /** phân loại con (chỉ builtin) — picker gom theo đây. */
  category?: TemplateCategory;
  /** kệ 3 hàng (cuộn ngang). Bỏ trống = suy từ shelfOf(). */
  shelf?: LayoutShelf;
  /** ảnh xem trước (với library template = chính ảnh ref). */
  thumb?: string | null;
  /** số ô ảnh mà bố cục này dùng (để khớp bảng hỏi spec). Bỏ trống = ước lượng. */
  imageSlots?: number;
  build: (ctx: TemplateContext) => EditorSlide;
}

/** Thứ tự hiển thị category trong picker. */
export const CATEGORY_ORDER: TemplateCategory[] = [
  'Bìa & Mở đầu',
  'Nội dung',
  'Moodboard & Vật liệu',
  'Kỹ thuật',
  'Trưng bày',
];

/* --------------------------- tiện ích màu --------------------------- */

/** Lấy màu từ palette theo vai trò, có fallback quiet-luxury. */
function pal(p: string[] | undefined) {
  const palette = p && p.length ? p : ['#f5f1ea', '#dad0c7', '#c7a397', '#8a6f4d', '#635c45', '#221f1a'];
  const lum = (hex: string) => {
    const c = hex.replace('#', '');
    if (c.length < 6) return 128;
    const n = parseInt(c, 16);
    return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
  };
  const sorted = [...palette].sort((a, b) => lum(a) - lum(b));
  const dark = sorted[0];
  const light = sorted[sorted.length - 1];
  const mids = sorted.slice(1, -1);
  const sat = (hex: string) => {
    const c = hex.replace('#', '');
    if (c.length < 6) return 0;
    const n = parseInt(c, 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    return mx === 0 ? 0 : (mx - mn) / mx;
  };
  const accent = [...(mids.length ? mids : sorted)].sort((a, b) => sat(b) - sat(a))[0];
  const muted = mids[Math.floor(mids.length / 2)] ?? dark;
  return { dark, light, accent, muted, palette };
}

function textBlocks(
  ctx: TemplateContext,
  colors: ReturnType<typeof pal>,
  region: { x: number; w: number },
): SlideElement[] {
  const els: SlideElement[] = [];
  let y = 12;
  if (ctx.kicker) {
    els.push(
      makeText({
        text: ctx.kicker.toUpperCase(),
        role: 'kicker',
        frame: { x: region.x, y, w: region.w, h: 5, rotation: 0 },
        fontSize: 2.2,
        color: colors.accent,
        bold: true,
        tracking: 3,
      }),
    );
    y += 6;
  }
  if (ctx.title) {
    els.push(
      makeText({
        text: ctx.title,
        role: 'title',
        frame: { x: region.x, y, w: region.w, h: 16, rotation: 0 },
        fontSize: 6.5,
        color: colors.dark,
        bold: true,
        lineHeight: 1.08,
      }),
    );
    y += 20;
  }
  if (ctx.body && ctx.body.length) {
    els.push(
      makeText({
        text: ctx.body.map((b) => `• ${b.replace(/^[-•]\s*/, '')}`).join('\n'),
        role: 'body',
        frame: { x: region.x, y, w: region.w, h: 100 - y - 12, rotation: 0 },
        fontSize: 2.8,
        color: colors.dark,
        lineHeight: 1.35,
      }),
    );
  }
  return els;
}

/**
 * Ô ảnh: nếu có src người dùng → ảnh thật; nếu chưa → khối placeholder màu muted
 * (skeleton) để bố cục vẫn "đọc" được ngay khi chưa gắn ảnh. Người dùng thả ảnh lên sau.
 */
function imgSlot(
  src: string | undefined,
  frame: SlideElement['frame'],
  colors: ReturnType<typeof pal>,
  opts: { radius?: number; fill?: string } = {},
): SlideElement {
  if (src) return makeImage(src, { frame, radius: opts.radius ?? 6 });
  return makeShape('rect', {
    frame,
    fill: opts.fill ?? colors.muted,
    stroke: 'transparent',
    strokeWidth: 0,
    radius: opts.radius ?? 6,
    opacity: 0.55,
  });
}

/** Lấy ảnh thứ i (vòng lại nếu thiếu), hoặc undefined nếu không có ảnh nào. */
function imgAt(ctx: TemplateContext, i: number): string | undefined {
  const imgs = ctx.images?.filter(Boolean) ?? [];
  if (!imgs.length) return undefined;
  return imgs[i % imgs.length];
}

/* --------------------------- BUILTIN --------------------------- */

export const BUILTIN_TEMPLATES: EditorTemplate[] = [
  {
    id: 'cover',
    name: 'Bìa (chữ trái · ảnh phải)',
    group: 'builtin',
    category: 'Bìa & Mở đầu',
    build: (ctx) => {
      const c = pal(ctx.palette);
      const els: SlideElement[] = [];
      if (ctx.images?.[0]) {
        els.push(
          makeImage(ctx.images[0], {
            frame: { x: 52, y: 0, w: 48, h: 100, rotation: 0 },
          }),
        );
      }
      if (ctx.kicker)
        els.push(
          makeText({
            text: ctx.kicker.toUpperCase(),
            role: 'kicker',
            frame: { x: 6, y: 22, w: 42, h: 5, rotation: 0 },
            fontSize: 2.4,
            color: c.accent,
            bold: true,
            tracking: 4,
          }),
        );
      els.push(
        makeText({
          text: ctx.title || 'Tiêu đề bộ trình bày',
          role: 'title',
          frame: { x: 6, y: 30, w: 42, h: 30, rotation: 0 },
          fontSize: 9,
          color: c.dark,
          bold: true,
          lineHeight: 1.05,
        }),
      );
      els.push(
        makeShape('line', {
          frame: { x: 6, y: 62, w: 8, h: 0.5, rotation: 0 },
          stroke: c.accent,
          strokeWidth: 3,
        }),
      );
      if (ctx.body?.length)
        els.push(
          makeText({
            text: ctx.body.slice(0, 2).join('\n'),
            role: 'body',
            frame: { x: 6, y: 66, w: 42, h: 20, rotation: 0 },
            fontSize: 2.6,
            color: c.muted,
            lineHeight: 1.3,
          }),
        );
      return { id: newId('sld'), background: c.light, elements: els, templateId: 'cover' };
    },
  },
  {
    id: 'content-image',
    name: 'Nội dung + ảnh',
    group: 'builtin',
    category: 'Nội dung',
    build: (ctx) => {
      const c = pal(ctx.palette);
      const els = textBlocks(ctx, c, { x: 6, w: 44 });
      if (ctx.images?.[0])
        els.push(
          makeImage(ctx.images[0], {
            frame: { x: 55, y: 10, w: 39, h: 80, rotation: 0 },
            radius: 12,
          }),
        );
      return { id: newId('sld'), background: c.light, elements: els, templateId: 'content-image' };
    },
  },
  {
    id: 'two-column',
    name: 'Hai cột chữ',
    group: 'builtin',
    category: 'Nội dung',
    build: (ctx) => {
      const c = pal(ctx.palette);
      const els: SlideElement[] = [];
      if (ctx.kicker)
        els.push(
          makeText({
            text: ctx.kicker.toUpperCase(),
            role: 'kicker',
            frame: { x: 6, y: 10, w: 88, h: 5, rotation: 0 },
            fontSize: 2.2,
            color: c.accent,
            bold: true,
            tracking: 3,
          }),
        );
      els.push(
        makeText({
          text: ctx.title || 'Tiêu đề',
          role: 'title',
          frame: { x: 6, y: 16, w: 88, h: 12, rotation: 0 },
          fontSize: 6,
          color: c.dark,
          bold: true,
        }),
      );
      const body = ctx.body || [];
      const half = Math.ceil(body.length / 2) || 1;
      els.push(
        makeText({
          text: (body.slice(0, half).length ? body.slice(0, half) : ['Nội dung cột trái'])
            .map((b) => `• ${b.replace(/^[-•]\s*/, '')}`)
            .join('\n'),
          role: 'body',
          frame: { x: 6, y: 34, w: 42, h: 56, rotation: 0 },
          fontSize: 2.8,
          color: c.dark,
          lineHeight: 1.35,
        }),
      );
      els.push(
        makeText({
          text: (body.slice(half).length ? body.slice(half) : ['Nội dung cột phải'])
            .map((b) => `• ${b.replace(/^[-•]\s*/, '')}`)
            .join('\n'),
          role: 'body',
          frame: { x: 52, y: 34, w: 42, h: 56, rotation: 0 },
          fontSize: 2.8,
          color: c.dark,
          lineHeight: 1.35,
        }),
      );
      return { id: newId('sld'), background: c.light, elements: els, templateId: 'two-column' };
    },
  },
  {
    id: 'grid',
    name: 'Lưới ảnh (2×2)',
    group: 'builtin',
    category: 'Moodboard & Vật liệu',
    build: (ctx) => {
      const c = pal(ctx.palette);
      const els: SlideElement[] = [];
      if (ctx.title)
        els.push(
          makeText({
            text: ctx.title,
            role: 'title',
            frame: { x: 6, y: 6, w: 88, h: 9, rotation: 0 },
            fontSize: 4.5,
            color: c.dark,
            bold: true,
          }),
        );
      const cells = [
        { x: 6, y: 20 },
        { x: 51, y: 20 },
        { x: 6, y: 58 },
        { x: 51, y: 58 },
      ];
      const imgs = ctx.images && ctx.images.length ? ctx.images : [];
      cells.forEach((cell, i) => {
        const src = imgs[i % Math.max(imgs.length, 1)] || imgs[0];
        if (src)
          els.push(
            makeImage(src, {
              frame: { x: cell.x, y: cell.y, w: 43, h: 36, rotation: 0 },
              radius: 8,
            }),
          );
        else
          els.push(
            makeShape('rect', {
              frame: { x: cell.x, y: cell.y, w: 43, h: 36, rotation: 0 },
              fill: c.muted,
              radius: 8,
            }),
          );
      });
      return { id: newId('sld'), background: c.light, elements: els, templateId: 'grid' };
    },
  },
  {
    id: 'quote',
    name: 'Trích dẫn (giữa)',
    group: 'builtin',
    category: 'Nội dung',
    build: (ctx) => {
      const c = pal(ctx.palette);
      const els: SlideElement[] = [
        makeText({
          text: '“',
          role: 'free',
          frame: { x: 44, y: 8, w: 12, h: 18, rotation: 0 },
          fontSize: 18,
          color: c.accent,
          align: 'center',
          bold: true,
        }),
        makeText({
          text: ctx.title || 'Một câu trích dẫn đắt giá về không gian sống.',
          role: 'title',
          frame: { x: 15, y: 34, w: 70, h: 30, rotation: 0 },
          fontSize: 5.5,
          color: c.dark,
          align: 'center',
          italic: true,
          lineHeight: 1.25,
        }),
      ];
      if (ctx.body?.[0])
        els.push(
          makeText({
            text: `— ${ctx.body[0].replace(/^[-•]\s*/, '')}`,
            role: 'body',
            frame: { x: 15, y: 70, w: 70, h: 6, rotation: 0 },
            fontSize: 2.6,
            color: c.muted,
            align: 'center',
          }),
        );
      return { id: newId('sld'), background: c.light, elements: els, templateId: 'quote' };
    },
  },
  {
    id: 'full-bleed',
    name: 'Ảnh tràn viền + tiêu đề',
    group: 'builtin',
    category: 'Bìa & Mở đầu',
    build: (ctx) => {
      const c = pal(ctx.palette);
      const slide: EditorSlide = {
        id: newId('sld'),
        background: c.dark,
        backgroundImage: ctx.images?.[0] ?? null,
        backgroundAdjust: { ...DEFAULT_ADJUST, brightness: 78 },
        elements: [],
        templateId: 'full-bleed',
      };
      if (ctx.kicker)
        slide.elements.push(
          makeText({
            // tracking vừa phải để kicker dài vẫn 1 dòng, không wrap đè lên title bên dưới.
            text: ctx.kicker.toUpperCase(),
            role: 'kicker',
            frame: { x: 8, y: 65, w: 84, h: 5, rotation: 0 },
            fontSize: 2.2,
            color: '#ffffff',
            bold: true,
            tracking: 2.8,
          }),
        );
      slide.elements.push(
        makeText({
          text: ctx.title || 'Tiêu đề trên ảnh',
          role: 'title',
          frame: { x: 8, y: 72, w: 84, h: 18, rotation: 0 },
          fontSize: 8,
          color: '#ffffff',
          bold: true,
          lineHeight: 1.05,
        }),
      );
      return slide;
    },
  },

  /* ---------- ARCHETYPE trích từ Reference "bo cuc dan trang" ---------- */

  {
    id: 'dark-cover',
    name: 'Bìa tối điện ảnh',
    group: 'builtin',
    category: 'Bìa & Mở đầu',
    build: (ctx) => {
      const c = pal(ctx.palette);
      const els: SlideElement[] = [
        imgSlot(imgAt(ctx, 0), { x: 22, y: 10, w: 56, h: 52, rotation: 0 }, c, { radius: 3 }),
      ];
      if (ctx.kicker)
        els.push(
          makeText({
            // kicker ở TRÊN tiêu đề, tracking vừa phải + khung rộng để KHÔNG wrap chồng title.
            text: ctx.kicker.toUpperCase(),
            role: 'kicker',
            frame: { x: 6, y: 66, w: 88, h: 5, rotation: 0 },
            fontSize: 2.1,
            color: c.accent,
            align: 'center',
            bold: true,
            tracking: 3.5,
          }),
        );
      els.push(
        makeText({
          text: ctx.title || 'Tên dự án',
          role: 'title',
          frame: { x: 8, y: 74, w: 84, h: 16, rotation: 0 },
          fontSize: 7.5,
          color: '#f3efe8',
          align: 'center',
          bold: true,
          lineHeight: 1.05,
        }),
      );
      return { id: newId('sld'), background: c.dark, elements: els, templateId: 'dark-cover' };
    },
  },
  {
    id: 'section-divider',
    name: 'Trang phân mục (số lớn)',
    group: 'builtin',
    category: 'Bìa & Mở đầu',
    build: (ctx) => {
      const c = pal(ctx.palette);
      const els: SlideElement[] = [];
      els.push(
        makeText({
          text: (ctx.kicker || 'Phần').toUpperCase(),
          role: 'kicker',
          frame: { x: 8, y: 20, w: 50, h: 5, rotation: 0 },
          fontSize: 2.2,
          color: c.accent,
          bold: true,
          tracking: 4,
        }),
      );
      // số/nhãn lớn bên phải (trang trí)
      els.push(
        makeText({
          text: '01',
          role: 'free',
          frame: { x: 62, y: 12, w: 32, h: 30, rotation: 0 },
          fontSize: 22,
          color: c.muted,
          align: 'right',
          bold: true,
          lineHeight: 1,
        }),
      );
      els.push(
        makeText({
          text: ctx.title || 'Tiêu đề phần',
          role: 'title',
          frame: { x: 8, y: 27, w: 52, h: 26, rotation: 0 },
          fontSize: 8.5,
          color: c.dark,
          bold: true,
          lineHeight: 1.06,
        }),
      );
      els.push(
        makeShape('line', {
          frame: { x: 8, y: 58, w: 9, h: 0.5, rotation: 0 },
          stroke: c.accent,
          strokeWidth: 3,
        }),
      );
      if (ctx.body?.length)
        els.push(
          makeText({
            text: ctx.body.slice(0, 2).join('\n'),
            role: 'body',
            frame: { x: 8, y: 62, w: 52, h: 22, rotation: 0 },
            fontSize: 2.6,
            color: c.muted,
            lineHeight: 1.35,
          }),
        );
      return { id: newId('sld'), background: c.light, elements: els, templateId: 'section-divider' };
    },
  },
  {
    id: 'moodboard-board',
    name: 'Moodboard (hero + swatch)',
    group: 'builtin',
    category: 'Moodboard & Vật liệu',
    build: (ctx) => {
      const c = pal(ctx.palette);
      const els: SlideElement[] = [];
      if (ctx.title)
        els.push(
          makeText({
            text: ctx.title,
            role: 'title',
            frame: { x: 6, y: 6, w: 60, h: 8, rotation: 0 },
            fontSize: 4.2,
            color: c.dark,
            bold: true,
          }),
        );
      if (ctx.kicker)
        els.push(
          makeText({
            text: ctx.kicker.toUpperCase(),
            role: 'kicker',
            frame: { x: 68, y: 8, w: 26, h: 5, rotation: 0 },
            fontSize: 2,
            color: c.accent,
            align: 'right',
            bold: true,
            tracking: 3,
          }),
        );
      // hero render
      els.push(imgSlot(imgAt(ctx, 0), { x: 6, y: 17, w: 88, h: 40, rotation: 0 }, c, { radius: 6 }));
      // hàng 4 swatch nội thất/vật liệu
      const cellW = 20.5;
      const gap = 2.5;
      for (let i = 0; i < 4; i++) {
        const x = 6 + i * (cellW + gap);
        els.push(imgSlot(imgAt(ctx, i + 1), { x, y: 60, w: cellW, h: 26, rotation: 0 }, c, { radius: 4 }));
        els.push(
          makeText({
            text: (ctx.body?.[i] || `Vật liệu ${i + 1}`).replace(/^[-•]\s*/, ''),
            role: 'body',
            frame: { x, y: 87, w: cellW, h: 5, rotation: 0 },
            fontSize: 1.8,
            color: c.muted,
            lineHeight: 1.2,
          }),
        );
      }
      return { id: newId('sld'), background: c.light, elements: els, templateId: 'moodboard-board' };
    },
  },
  {
    id: 'material-palette',
    name: 'Bảng màu & vật liệu',
    group: 'builtin',
    category: 'Moodboard & Vật liệu',
    build: (ctx) => {
      const c = pal(ctx.palette);
      const els: SlideElement[] = [];
      els.push(
        makeText({
          text: (ctx.kicker || 'Color & Material').toUpperCase(),
          role: 'kicker',
          frame: { x: 6, y: 12, w: 44, h: 5, rotation: 0 },
          fontSize: 2,
          color: c.accent,
          bold: true,
          tracking: 4,
        }),
      );
      els.push(
        makeText({
          text: ctx.title || 'Bảng vật liệu',
          role: 'title',
          frame: { x: 6, y: 17, w: 44, h: 12, rotation: 0 },
          fontSize: 5.5,
          color: c.dark,
          bold: true,
        }),
      );
      // dải chip màu từ palette
      const chips = c.palette.slice(0, 6);
      const chipW = 6.5;
      const chipGap = 1.5;
      chips.forEach((hex, i) => {
        els.push(
          makeShape('rect', {
            frame: { x: 6 + i * (chipW + chipGap), y: 33, w: chipW, h: 12, rotation: 0 },
            fill: hex,
            stroke: 'transparent',
            strokeWidth: 0,
            radius: 3,
          }),
        );
      });
      // 2 mẫu vật liệu (ảnh) dưới chip
      els.push(imgSlot(imgAt(ctx, 1), { x: 6, y: 50, w: 21, h: 34, rotation: 0 }, c, { radius: 4 }));
      els.push(imgSlot(imgAt(ctx, 2), { x: 29, y: 50, w: 21, h: 34, rotation: 0 }, c, { radius: 4 }));
      // render bối cảnh bên phải
      els.push(imgSlot(imgAt(ctx, 0), { x: 55, y: 10, w: 39, h: 80, rotation: 0 }, c, { radius: 6 }));
      return { id: newId('sld'), background: c.light, elements: els, templateId: 'material-palette' };
    },
  },
  {
    id: 'plan-sheet',
    name: 'Trang mặt bằng (kỹ thuật)',
    group: 'builtin',
    category: 'Kỹ thuật',
    build: (ctx) => {
      const c = pal(ctx.palette);
      const els: SlideElement[] = [];
      // mặt bằng lớn bên trái
      els.push(imgSlot(imgAt(ctx, 0), { x: 5, y: 10, w: 58, h: 78, rotation: 0 }, c, { radius: 2, fill: '#ffffff' }));
      // cột thông tin bên phải
      els.push(
        makeText({
          text: (ctx.kicker || 'Mặt bằng bố trí').toUpperCase(),
          role: 'kicker',
          frame: { x: 68, y: 12, w: 27, h: 5, rotation: 0 },
          fontSize: 1.9,
          color: c.accent,
          bold: true,
          tracking: 3,
        }),
      );
      els.push(
        makeText({
          text: ctx.title || 'Tên dự án',
          role: 'title',
          frame: { x: 68, y: 17, w: 27, h: 12, rotation: 0 },
          fontSize: 4.2,
          color: c.dark,
          bold: true,
          lineHeight: 1.1,
        }),
      );
      els.push(
        makeShape('line', {
          frame: { x: 68, y: 31, w: 27, h: 0.4, rotation: 0 },
          stroke: c.muted,
          strokeWidth: 1.5,
        }),
      );
      const specs =
        ctx.body?.length ? ctx.body : ['Diện tích: — m²', 'Tỉ lệ: 1:100', 'Phòng: —', 'Ngày: —'];
      els.push(
        makeText({
          text: specs.map((b) => b.replace(/^[-•]\s*/, '')).join('\n'),
          role: 'body',
          frame: { x: 68, y: 35, w: 27, h: 40, rotation: 0 },
          fontSize: 2.2,
          color: c.dark,
          lineHeight: 1.7,
        }),
      );
      // số bản vẽ góc dưới
      els.push(
        makeText({
          text: 'A-101',
          role: 'free',
          frame: { x: 68, y: 82, w: 27, h: 6, rotation: 0 },
          fontSize: 3,
          color: c.muted,
          align: 'right',
          bold: true,
          tracking: 2,
        }),
      );
      return { id: newId('sld'), background: c.light, elements: els, templateId: 'plan-sheet' };
    },
  },
  {
    id: 'triptych',
    name: 'Triptych (3 panel dọc)',
    group: 'builtin',
    category: 'Trưng bày',
    build: (ctx) => {
      const c = pal(ctx.palette);
      const els: SlideElement[] = [];
      if (ctx.kicker)
        els.push(
          makeText({
            text: ctx.kicker.toUpperCase(),
            role: 'kicker',
            frame: { x: 20, y: 12, w: 60, h: 4, rotation: 0 },
            fontSize: 2,
            color: c.accent,
            align: 'center',
            bold: true,
            tracking: 4,
          }),
        );
      const panelW = 26;
      const gap = 3;
      const startX = 50 - (panelW * 1.5 + gap);
      for (let i = 0; i < 3; i++) {
        els.push(
          imgSlot(imgAt(ctx, i), { x: startX + i * (panelW + gap), y: 22, w: panelW, h: 52, rotation: 0 }, c, {
            radius: 4,
          }),
        );
      }
      els.push(
        makeText({
          text: ctx.title || 'Bộ sưu tập không gian',
          role: 'title',
          frame: { x: 15, y: 80, w: 70, h: 8, rotation: 0 },
          fontSize: 3.4,
          color: c.dark,
          align: 'center',
          bold: true,
        }),
      );
      return { id: newId('sld'), background: c.light, elements: els, templateId: 'triptych' };
    },
  },
  {
    id: 'catalog-index',
    name: 'Catalog nội thất (nhãn + lưới)',
    group: 'builtin',
    category: 'Trưng bày',
    build: (ctx) => {
      const c = pal(ctx.palette);
      const els: SlideElement[] = [];
      els.push(
        makeText({
          text: ctx.title || 'Danh mục nội thất',
          role: 'title',
          frame: { x: 6, y: 8, w: 40, h: 10, rotation: 0 },
          fontSize: 4.5,
          color: c.dark,
          bold: true,
        }),
      );
      // cột nhãn hạng mục bên trái
      const labels = (ctx.body?.length ? ctx.body : ['Bàn', 'Ghế', 'Kệ']).slice(0, 3);
      labels.forEach((lb, i) => {
        const y = 30 + i * 20;
        els.push(
          makeText({
            text: lb.replace(/^[-•]\s*/, '').toUpperCase(),
            role: 'body',
            frame: { x: 6, y, w: 22, h: 5, rotation: 0 },
            fontSize: 2.6,
            color: c.dark,
            bold: true,
            tracking: 1,
          }),
        );
        els.push(
          makeShape('line', {
            frame: { x: 6, y: y + 6, w: 20, h: 0.3, rotation: 0 },
            stroke: c.muted,
            strokeWidth: 1,
          }),
        );
      });
      // lưới ảnh sản phẩm bên phải (3×2)
      const gx = 34;
      const cellW = 19;
      const cellH = 34;
      const gap = 2;
      for (let r = 0; r < 2; r++) {
        for (let col = 0; col < 3; col++) {
          const idx = r * 3 + col;
          els.push(
            imgSlot(imgAt(ctx, idx), {
              x: gx + col * (cellW + gap),
              y: 14 + r * (cellH + gap),
              w: cellW,
              h: cellH,
              rotation: 0,
            }, c, { radius: 3 }),
          );
        }
      }
      return { id: newId('sld'), background: c.light, elements: els, templateId: 'catalog-index' };
    },
  },
  {
    id: 'compare',
    name: 'So sánh (2 phương án)',
    group: 'builtin',
    category: 'Nội dung',
    build: (ctx) => {
      const c = pal(ctx.palette);
      const els: SlideElement[] = [];
      els.push(
        makeText({
          text: ctx.title || 'So sánh phương án',
          role: 'title',
          frame: { x: 6, y: 8, w: 88, h: 10, rotation: 0 },
          fontSize: 5.4,
          color: c.dark,
          bold: true,
          align: 'center',
        }),
      );
      const body = ctx.body || [];
      const half = Math.ceil(body.length / 2) || 1;
      // 2 cột: mỗi cột có ảnh trên (hoặc placeholder) + tiêu đề nhỏ + gạch đầu dòng.
      const cols: { x: number; label: string; img?: string; lines: string[] }[] = [
        { x: 6, label: 'Phương án A', img: imgAt(ctx, 0), lines: body.slice(0, half) },
        { x: 52, label: 'Phương án B', img: imgAt(ctx, 1), lines: body.slice(half) },
      ];
      for (const col of cols) {
        els.push(
          imgSlot(col.img, { x: col.x, y: 22, w: 42, h: 34, rotation: 0 }, c, { radius: 4 }),
        );
        els.push(
          makeText({
            text: col.label.toUpperCase(),
            role: 'kicker',
            frame: { x: col.x, y: 58, w: 42, h: 5, rotation: 0 },
            fontSize: 2.4,
            color: c.accent,
            bold: true,
            tracking: 2,
          }),
        );
        els.push(
          makeText({
            text: (col.lines.length ? col.lines : ['Ưu điểm 1', 'Ưu điểm 2'])
              .map((b) => `• ${b.replace(/^[-•]\s*/, '')}`)
              .join('\n'),
            role: 'body',
            frame: { x: col.x, y: 64, w: 42, h: 28, rotation: 0 },
            fontSize: 2.6,
            color: c.dark,
            lineHeight: 1.4,
          }),
        );
      }
      // đường phân cách giữa — dùng RECT mảnh dọc thay cho LINE xoay 90°.
      // BUG cũ: line vẽ theo trục NGANG (dài = frame.w) rồi xoay 90° → chỉ ra đoạn ~15px,
      // KHÔNG cao hết khung như ý. FIX: rect w rất mảnh, cao 70% — WYSIWYG cả canvas lẫn HTML.
      els.push(
        makeShape('rect', {
          frame: { x: 49.7, y: 22, w: 0.12, h: 70, rotation: 0 },
          fill: c.muted,
          stroke: 'transparent',
          strokeWidth: 0,
          radius: 0,
        }),
      );
      return { id: newId('sld'), background: c.light, elements: els, templateId: 'compare' };
    },
  },
  {
    id: 'big-stat',
    name: 'Số liệu lớn (3 chỉ số)',
    group: 'builtin',
    category: 'Nội dung',
    build: (ctx) => {
      const c = pal(ctx.palette);
      const els: SlideElement[] = [];
      if (ctx.kicker)
        els.push(
          makeText({
            text: ctx.kicker.toUpperCase(),
            role: 'kicker',
            frame: { x: 6, y: 12, w: 88, h: 5, rotation: 0 },
            fontSize: 2.2,
            color: c.accent,
            bold: true,
            tracking: 3,
            align: 'center',
          }),
        );
      els.push(
        makeText({
          text: ctx.title || 'Những con số biết nói',
          role: 'title',
          frame: { x: 10, y: 18, w: 80, h: 10, rotation: 0 },
          fontSize: 5,
          color: c.dark,
          bold: true,
          align: 'center',
        }),
      );
      // 3 ô số lớn — số lấy từ 3 dòng body đầu (nếu có), nhãn = phần chữ sau số.
      const body = ctx.body || [];
      const stats = [0, 1, 2].map((i) => body[i] ?? '');
      const cols = [8, 37, 66];
      stats.forEach((raw, i) => {
        const m = raw.match(/^\s*([^\s—:-]+)\s*[—:-]?\s*(.*)$/);
        const num = m?.[1] || ['100%', '3', '24'][i];
        const label = m?.[2] || 'Chỉ số';
        els.push(
          makeText({
            text: num,
            role: 'free',
            frame: { x: cols[i], y: 40, w: 26, h: 18, rotation: 0 },
            fontSize: 11,
            color: c.accent,
            bold: true,
            align: 'center',
            lineHeight: 1,
          }),
        );
        els.push(
          makeText({
            text: label,
            role: 'body',
            frame: { x: cols[i], y: 62, w: 26, h: 10, rotation: 0 },
            fontSize: 2.4,
            color: c.dark,
            align: 'center',
            lineHeight: 1.3,
          }),
        );
      });
      return { id: newId('sld'), background: c.light, elements: els, templateId: 'big-stat' };
    },
  },
  /* ---------- Trích từ moodboard AKH-IKI (kỹ thuật designer thật) ---------- */

  {
    id: 'grid4-philosophy',
    name: 'Lưới 4 cột (triết lý + bullet)',
    group: 'builtin',
    category: 'Moodboard & Vật liệu',
    shelf: 'content',
    // AKH-IKI p5: 4 ảnh dọc gần chạm nhau (cột 24.8%, gutter mảnh), dưới mỗi cột
    // nhãn + gạch đầu dòng + nhãn tổng kết. Tem: header tab-label + hairline.
    build: (ctx) => {
      const c = pal(ctx.palette);
      const els: SlideElement[] = [];
      // header tab-label trái + breadcrumb phải (đặc trưng bộ moodboard)
      els.push(
        makeText({
          text: (ctx.kicker || 'Triết lý thiết kế').toUpperCase(),
          role: 'kicker',
          frame: { x: 2, y: 3.5, w: 40, h: 5, rotation: 0 },
          fontSize: 2.4,
          color: c.dark,
          bold: true,
          tracking: 2,
        }),
      );
      els.push(
        makeText({
          text: (ctx.title || 'IKI VILLAGE — MOODBOARD').toUpperCase(),
          role: 'free',
          frame: { x: 55, y: 3.5, w: 43, h: 5, rotation: 0 },
          fontSize: 1.8,
          color: c.muted,
          align: 'right',
          tracking: 2,
        }),
      );
      els.push(makeShape('line', { frame: { x: 2, y: 10, w: 96, h: 0.3, rotation: 0 }, stroke: c.muted, strokeWidth: 1 }));
      // 4 cột ảnh gần chạm
      const colW = 24;
      const gap = 0.7;
      const startX = 2;
      const body = ctx.body?.length ? ctx.body : ['Chuẩn mực', 'Nhấn tinh tế', 'Bền vững', 'Linh hoạt'];
      for (let i = 0; i < 4; i++) {
        const x = startX + i * (colW + gap);
        els.push(imgSlot(imgAt(ctx, i), { x, y: 13, w: colW, h: 56, rotation: 0 }, c, { radius: 1 }));
        // nhãn cột + 1 dòng bullet
        els.push(
          makeText({
            text: (body[i] || `Ý ${i + 1}`).replace(/^[-•]\s*/, '').toUpperCase(),
            role: 'body',
            frame: { x, y: 71, w: colW, h: 5, rotation: 0 },
            fontSize: 1.9,
            color: c.dark,
            align: 'center',
            bold: true,
            tracking: 1,
          }),
        );
        els.push(
          makeText({
            text: '•  Không gian chuẩn mực\n•  Ít mà đúng',
            role: 'body',
            frame: { x, y: 77, w: colW, h: 12, rotation: 0 },
            fontSize: 1.6,
            color: c.muted,
            align: 'center',
            lineHeight: 1.4,
          }),
        );
      }
      return { id: newId('sld'), background: c.light, elements: els, templateId: 'grid4-philosophy' };
    },
  },
  {
    id: 'collage-watermark',
    name: 'Collage + watermark serif',
    group: 'builtin',
    category: 'Trưng bày',
    shelf: 'content',
    // AKH-IKI SHOW p15: ảnh chồng mép tự do + watermark serif khổng lồ mờ + inset nhỏ.
    build: (ctx) => {
      const c = pal(ctx.palette);
      const els: SlideElement[] = [];
      els.push(
        makeText({
          text: (ctx.kicker || 'Định hướng không gian').toUpperCase(),
          role: 'kicker',
          frame: { x: 2, y: 4, w: 50, h: 5, rotation: 0 },
          fontSize: 2.2,
          color: c.dark,
          bold: true,
          tracking: 2,
        }),
      );
      // cụm ảnh: 1 lớn trái + 2 nhỏ phải (chồng mép)
      els.push(imgSlot(imgAt(ctx, 0), { x: 4, y: 12, w: 42, h: 74, rotation: 0 }, c, { radius: 1 }));
      els.push(imgSlot(imgAt(ctx, 1), { x: 48, y: 12, w: 24, h: 42, rotation: 0 }, c, { radius: 1 }));
      els.push(imgSlot(imgAt(ctx, 2), { x: 73, y: 12, w: 23, h: 42, rotation: 0 }, c, { radius: 1 }));
      els.push(imgSlot(imgAt(ctx, 3), { x: 48, y: 56, w: 48, h: 30, rotation: 0 }, c, { radius: 1 }));
      // watermark serif lớn mờ (đè lên ảnh trái)
      els.push(
        makeText({
          text: ctx.title || 'Master',
          role: 'free',
          frame: { x: 8, y: 62, w: 46, h: 22, rotation: 0 },
          fontSize: 12,
          color: '#ffffff',
          italic: true,
          opacity: 0.85,
          fontFamily: 'Optima, "Avenir Next", "Helvetica Neue", sans-serif',
        }),
      );
      return { id: newId('sld'), background: c.light, elements: els, templateId: 'collage-watermark' };
    },
  },
  {
    id: 'material-flatlay',
    name: 'Bảng vật liệu (flat-lay + nhãn)',
    group: 'builtin',
    category: 'Moodboard & Vật liệu',
    shelf: 'content',
    // AKH-IKI p9: 1 ảnh flat-lay mẫu vật liệu lớn + tiêu đề dọc + strip swatch + nhãn CMYK.
    build: (ctx) => {
      const c = pal(ctx.palette);
      const els: SlideElement[] = [];
      // tiêu đề xoay dọc mép trái
      els.push(
        makeText({
          text: (ctx.kicker || 'Material Board').toUpperCase(),
          role: 'kicker',
          frame: { x: -14, y: 45, w: 40, h: 6, rotation: -90 },
          fontSize: 3,
          color: c.muted,
          bold: true,
          tracking: 4,
          align: 'center',
        }),
      );
      // ảnh flat-lay lớn
      els.push(imgSlot(imgAt(ctx, 0), { x: 8, y: 8, w: 62, h: 84, rotation: 0 }, c, { radius: 1 }));
      // cột phải: tên bộ + strip swatch + nhãn
      els.push(
        makeText({
          text: ctx.title || 'Bảng vật liệu',
          role: 'title',
          frame: { x: 73, y: 12, w: 25, h: 10, rotation: 0 },
          fontSize: 3.6,
          color: c.dark,
          bold: true,
          lineHeight: 1.1,
        }),
      );
      const chips = c.palette.slice(0, 5);
      chips.forEach((hex, i) => {
        const y = 30 + i * 12;
        els.push(
          makeShape('rect', {
            frame: { x: 73, y, w: 8, h: 9, rotation: 0 },
            fill: hex,
            stroke: 'transparent',
            strokeWidth: 0,
            radius: 1,
          }),
        );
        els.push(
          makeText({
            text: `${(ctx.body?.[i] || 'Vật liệu').replace(/^[-•]\s*/, '')}\n${hex.toUpperCase()}`,
            role: 'body',
            frame: { x: 83, y: y + 0.5, w: 15, h: 9, rotation: 0 },
            fontSize: 1.6,
            color: c.dark,
            lineHeight: 1.35,
          }),
        );
      });
      return { id: newId('sld'), background: c.light, elements: els, templateId: 'material-flatlay' };
    },
  },
  {
    id: 'closing',
    name: 'Trang kết (thông điệp)',
    group: 'builtin',
    category: 'Bìa & Mở đầu',
    shelf: 'closing',
    // AKH-IKI trang kết: nền tối, 1-3 dòng căn giữa.
    build: (ctx) => {
      const c = pal(ctx.palette);
      const els: SlideElement[] = [];
      els.push(
        makeText({
          text: ctx.title || 'Cảm xúc ban đầu từ đường nét — ánh sáng — vật liệu',
          role: 'title',
          frame: { x: 14, y: 40, w: 72, h: 20, rotation: 0 },
          fontSize: 4.6,
          color: '#f3efe8',
          align: 'center',
          italic: true,
          lineHeight: 1.4,
        }),
      );
      if (ctx.kicker)
        els.push(
          makeText({
            text: ctx.kicker.toUpperCase(),
            role: 'kicker',
            frame: { x: 20, y: 62, w: 60, h: 5, rotation: 0 },
            fontSize: 2,
            color: c.accent,
            align: 'center',
            bold: true,
            tracking: 4,
          }),
        );
      return { id: newId('sld'), background: c.dark, elements: els, templateId: 'closing' };
    },
  },

  {
    id: 'agenda',
    name: 'Mục lục / Agenda',
    group: 'builtin',
    category: 'Bìa & Mở đầu',
    build: (ctx) => {
      const c = pal(ctx.palette);
      const els: SlideElement[] = [];
      els.push(
        makeText({
          text: (ctx.kicker || 'Nội dung').toUpperCase(),
          role: 'kicker',
          frame: { x: 8, y: 14, w: 50, h: 5, rotation: 0 },
          fontSize: 2.2,
          color: c.accent,
          bold: true,
          tracking: 3,
        }),
      );
      els.push(
        makeText({
          text: ctx.title || 'Mục lục',
          role: 'title',
          frame: { x: 8, y: 20, w: 50, h: 16, rotation: 0 },
          fontSize: 7,
          color: c.dark,
          bold: true,
        }),
      );
      // danh sách mục đánh số 01, 02… ở cột phải.
      const items = (ctx.body && ctx.body.length ? ctx.body : ['Bối cảnh', 'Concept', 'Không gian', 'Vật liệu', 'Kết luận']).slice(0, 6);
      const startY = 16;
      const step = Math.min(12, (80 - startY) / items.length);
      items.forEach((it, i) => {
        els.push(
          makeText({
            text: String(i + 1).padStart(2, '0'),
            role: 'free',
            frame: { x: 56, y: startY + i * step, w: 8, h: step, rotation: 0 },
            fontSize: 3.4,
            color: c.accent,
            bold: true,
          }),
        );
        els.push(
          makeText({
            text: it.replace(/^[-•]\s*/, ''),
            role: 'body',
            frame: { x: 65, y: startY + i * step, w: 30, h: step, rotation: 0 },
            fontSize: 3,
            color: c.dark,
            lineHeight: 1.1,
          }),
        );
      });
      return { id: newId('sld'), background: c.light, elements: els, templateId: 'agenda' };
    },
  },

  {
    id: 'closing-thanks',
    name: 'Trang kết (cảm ơn · liên hệ)',
    group: 'builtin',
    category: 'Bìa & Mở đầu',
    shelf: 'closing',
    // Trang kết sáng: lời cảm ơn lớn + dòng liên hệ/thương hiệu nhỏ, căn giữa.
    build: (ctx) => {
      const c = pal(ctx.palette);
      const els: SlideElement[] = [
        makeText({
          text: ctx.kicker ? ctx.kicker.toUpperCase() : 'CẢM ƠN',
          role: 'kicker',
          frame: { x: 20, y: 34, w: 60, h: 5, rotation: 0 },
          fontSize: 2,
          color: c.accent,
          align: 'center',
          bold: true,
          tracking: 5,
        }),
        makeText({
          text: ctx.title || 'Cảm ơn đã lắng nghe',
          role: 'title',
          frame: { x: 14, y: 42, w: 72, h: 16, rotation: 0 },
          fontSize: 6,
          color: c.dark,
          align: 'center',
          bold: true,
        }),
        makeText({
          text: 'hello@studio.vn · +84 · studio.vn',
          role: 'body',
          frame: { x: 20, y: 60, w: 60, h: 6, rotation: 0 },
          fontSize: 2.2,
          color: c.muted,
          align: 'center',
          tracking: 1,
        }),
      ];
      return { id: newId('sld'), background: c.light, elements: els, templateId: 'closing-thanks' };
    },
  },
];

/* --------------------------- TỪ THƯ VIỆN --------------------------- */

/** usage được coi là "template dàn trang". */
export const LAYOUT_USAGES = ['layout', 'slide'];

/**
 * Dẫn xuất template từ ảnh Reference tag layout/slide: đặt chính ảnh đó làm nền gợi ý
 * bố cục (full-bleed), người dùng kéo chữ/ảnh của mình chồng lên. Đơn giản mà đúng ý:
 * "mượn bố cục từ ảnh mẫu trong thư viện".
 */
/**
 * Đếm số Ô ẢNH của template (build thử với vài ảnh giả) — để khớp bảng hỏi spec.
 * Đếm cả image element lẫn shape placeholder (imgSlot khi thiếu ảnh) + ảnh nền.
 */
export function estimateImageSlots(t: EditorTemplate): number {
  if (typeof t.imageSlots === 'number') return t.imageSlots;
  try {
    const s = t.build({
      title: 'x',
      kicker: 'x',
      body: ['a', 'b', 'c', 'd'],
      images: ['#a', '#b', '#c', '#d', '#e', '#f'],
      palette: ['#f5f1ea', '#c7a397', '#8a6f4d', '#221f1a'],
    });
    const imgs = s.elements.filter((e) => e.kind === 'image').length;
    return imgs + (s.backgroundImage ? 1 : 0);
  } catch {
    return 1;
  }
}

/**
 * Lật NGANG một slide (mirror trái↔phải) — biến thể "phản chiếu" nhanh, giữ nội dung.
 * x' = 100 - (x + w). Chữ căn trái ↔ phải để bố cục vẫn cân.
 */
export function mirrorSlide(slide: EditorSlide): EditorSlide {
  const out: EditorSlide = { ...slide, elements: slide.elements.map((e) => ({ ...e, frame: { ...e.frame } })) };
  for (const el of out.elements) {
    el.frame.x = 100 - (el.frame.x + el.frame.w);
    if (el.kind === 'text') {
      const t = el as { align?: string };
      if (t.align === 'left') t.align = 'right';
      else if (t.align === 'right') t.align = 'left';
    }
  }
  return out;
}

/**
 * Sinh BIẾN THỂ cho một template gốc (human-in-loop: đề xuất khác đi, không copy nguyên).
 * v1 = mirror ngang; v2 = đổi nền sáng↔tối (đảo background + màu chữ trắng/đậm).
 * Trả về danh sách EditorTemplate mới (id có hậu tố) — dùng cho nút "Thêm biến thể".
 */
export function makeVariants(base: EditorTemplate, palette?: string[]): EditorTemplate[] {
  const p = palette && palette.length ? palette : undefined;
  const shelf = shelfOf(base);
  return [
    {
      ...base,
      id: `${base.id}__mir`,
      name: `${base.name} · lật`,
      shelf,
      build: (ctx) => {
        const s = base.build({ ...ctx, palette: ctx.palette ?? p });
        return { ...mirrorSlide(s), templateId: base.id };
      },
    },
    {
      ...base,
      id: `${base.id}__dark`,
      name: `${base.name} · nền tối`,
      shelf,
      build: (ctx) => {
        const s = base.build({ ...ctx, palette: ctx.palette ?? p });
        const c = pal(ctx.palette ?? p);
        const dark = s.background === c.dark;
        return {
          ...s,
          templateId: base.id,
          background: dark ? c.light : c.dark,
          elements: s.elements.map((e) => {
            if (e.kind !== 'text') return e;
            const isInk = e.color === c.dark || e.color === '#221f1a';
            return { ...e, color: dark ? (isInk ? e.color : e.color) : isInk ? '#f3efe8' : e.color };
          }),
        };
      },
    },
  ];
}

export function templatesFromLibrary(assets: GuAsset[]): EditorTemplate[] {
  const layoutAssets = (assets || []).filter((a) => LAYOUT_USAGES.includes(a.usage));
  return layoutAssets.slice(0, 24).map((a) => ({
    id: `lib_${a.id}`,
    name: a.name || 'Bố cục thư viện',
    group: 'library' as const,
    thumb: a.url,
    build: (ctx: TemplateContext): EditorSlide => {
      const c = pal(ctx.palette && ctx.palette.length ? ctx.palette : a.palette);
      const slide: EditorSlide = {
        id: newId('sld'),
        background: c.dark,
        backgroundImage: a.url,
        backgroundAdjust: { ...DEFAULT_ADJUST, brightness: 82 },
        elements: [],
        templateId: `lib_${a.id}`,
      };
      // Đặt sẵn 1 khối chữ tiêu đề để người dùng chỉnh; chừa ảnh ref làm nền.
      if (ctx.title)
        slide.elements.push(
          makeText({
            text: ctx.title,
            role: 'title',
            frame: { x: 8, y: 70, w: 84, h: 18, rotation: 0 },
            fontSize: 7,
            color: '#ffffff',
            bold: true,
            lineHeight: 1.06,
          }),
        );
      return slide;
    },
  }));
}
