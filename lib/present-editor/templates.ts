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

export interface EditorTemplate {
  id: string;
  name: string;
  /** nhóm để hiển thị: 'Bố cục' (builtin) hoặc 'Thư viện' (từ Reference). */
  group: 'builtin' | 'library';
  /** phân loại con (chỉ builtin) — picker gom theo đây. */
  category?: TemplateCategory;
  /** ảnh xem trước (với library template = chính ảnh ref). */
  thumb?: string | null;
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
            text: ctx.kicker.toUpperCase(),
            role: 'kicker',
            frame: { x: 8, y: 66, w: 84, h: 5, rotation: 0 },
            fontSize: 2.4,
            color: '#ffffff',
            bold: true,
            tracking: 4,
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
            text: ctx.kicker.toUpperCase(),
            role: 'kicker',
            frame: { x: 12, y: 68, w: 76, h: 4, rotation: 0 },
            fontSize: 2.2,
            color: c.accent,
            align: 'center',
            bold: true,
            tracking: 5,
          }),
        );
      els.push(
        makeText({
          text: ctx.title || 'Tên dự án',
          role: 'title',
          frame: { x: 10, y: 73, w: 80, h: 16, rotation: 0 },
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
];

/* --------------------------- TỪ THƯ VIỆN --------------------------- */

/** usage được coi là "template dàn trang". */
export const LAYOUT_USAGES = ['layout', 'slide'];

/**
 * Dẫn xuất template từ ảnh Reference tag layout/slide: đặt chính ảnh đó làm nền gợi ý
 * bố cục (full-bleed), người dùng kéo chữ/ảnh của mình chồng lên. Đơn giản mà đúng ý:
 * "mượn bố cục từ ảnh mẫu trong thư viện".
 */
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
