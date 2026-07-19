'use client';

/**
 * Xuất deck sang PowerPoint (.pptx) chỉnh sửa được — client-side, dùng pptxgenjs.
 *
 * Mỗi slide của app → 1 slide PPTX theo tỉ lệ 16:9 (khung 1920×1080 → 13.333in×7.5in).
 *
 * Hai đường vào:
 *  - Content model (SlideOptions rút gọn): title/body thành text box THẬT (chỉnh được trong
 *    PowerPoint) + ảnh hero/nền nhúng base64 + footer brand.
 *  - Fallback ảnh: nếu chỉ có ảnh slide đã render (data URL), nhúng full-bleed cả slide.
 *
 * Không import gì từ store/registry để tránh circular import. Chỉ mượn kiểu từ lib/slides.
 */

import type { SlideContent, SlideTheme, SlideLayout, FontPairing } from '@/lib/slides';
import { injectEmbeddedFonts, type EmbedFontInput, type EmbedFontsResult } from '@/lib/pptx-zip-fonts';
import { realFamilyName } from '@/lib/pptx-font-embed';

/** Khung 16:9 chuẩn PowerPoint (inch). 13.333×7.5 = 1920×1080. */
const SLIDE_W = 13.333;
const SLIDE_H = 7.5;

/** Bộ chữ sans cho PPTX (HARD RULE: sans only — không serif). */
const PPTX_FONT: Record<FontPairing, string> = {
  Editorial: 'Calibri',
  Modern: 'Arial',
  Elegant: 'Segoe UI',
};

/** Một slide dạng nội dung chỉnh sửa được. */
export interface PptxSlideContent {
  kind: 'content';
  content: SlideContent;
  theme: SlideTheme;
  layout: SlideLayout;
  fonts: FontPairing;
  /** Ảnh hero/nền dạng data URI (base64) — nếu có sẽ nhúng. */
  heroDataUrl?: string | null;
  brand?: string;
  pageNo?: string;
  /**
   * Ghi đè tên font theo VAI TRÒ chữ. Dùng cho font user tự tải lên: `fonts` (FontPairing) chỉ
   * chọn được trong 3 bộ curated, không diễn tả nổi font ngoài. Bỏ trống → dùng PPTX_FONT như cũ.
   */
  fontFaces?: { title?: string; body?: string; kicker?: string };
}

/** Một slide chỉ có ảnh đã render (fallback) — nhúng full-bleed. */
export interface PptxSlideImage {
  kind: 'image';
  /** data URI (base64) của slide 16:9 đã render. */
  imageDataUrl: string;
}

export type PptxSlide = PptxSlideContent | PptxSlideImage;

export interface ExportPptxOptions {
  /** Tên file (không cần đuôi .pptx). */
  fileName?: string;
  /** Tiêu đề metadata của deck. */
  title?: string;
  author?: string;
  /**
   * Font user tải lên cần NHÚNG THẬT vào file .pptx (không chỉ ghi tên).
   * Xem `lib/pptx-zip-fonts.ts`. Chỉ truyền font đang thực sự dùng trong deck — nhúng cả thư
   * viện sẽ làm file phình vô ích.
   */
  embedFonts?: EmbedFontInput[];
}

/** Kết quả xuất — cho biết font nào đã nhúng thật, font nào bị bỏ và vì sao. */
export type PptxExportResult = EmbedFontsResult;

/** Bỏ dấu '#' của hex để pptxgenjs dùng (nó nhận 'RRGGBB'). */
function hex(color: string | undefined, fallback: string): string {
  if (!color) return fallback;
  const c = color.trim().replace(/^#/, '');
  return /^[0-9a-fA-F]{6}$/.test(c) ? c.toUpperCase() : fallback;
}

function safeFileName(name: string | undefined): string {
  const base = (name || 'deck').replace(/[\\/:*?"<>|]/g, '').trim() || 'deck';
  return base.replace(/\.pptx$/i, '');
}

/**
 * Xuất mảng slide sang file .pptx và tải xuống trình duyệt.
 * pptxgenjs được import động để không chạy khi SSR / tránh lỗi webpack.
 */
export async function exportDeckToPptx(
  slides: PptxSlide[],
  opts: ExportPptxOptions = {},
): Promise<PptxExportResult> {
  const empty: PptxExportResult = { embedded: [], skipped: [], licenses: [] };
  if (typeof window === 'undefined') return empty; // an toàn SSR
  if (!slides.length) throw new Error('Deck rỗng — cần ít nhất 1 slide.');

  const PptxGen = (await import('pptxgenjs')).default;
  const pptx = new PptxGen();

  /**
   * Bí danh font của app → TÊN HỌ THẬT trong file font.
   *
   * App đặt tên riêng cho mỗi font tải lên (vd `Georgia-0eht`) để `@font-face` trong trình duyệt
   * không đụng nhau. PowerPoint thì ghép font nhúng với chữ bằng tên họ thật nằm trong file font,
   * nên slide XML phải ghi tên THẬT — xem chú thích ở `prepareFontForEmbed`.
   */
  const aliasToReal = new Map<string, string>();
  for (const f of opts.embedFonts ?? []) {
    const real = realFamilyName(f.dataUrl);
    if (real) aliasToReal.set(f.face, real);
  }
  const resolveFace = (name: string | undefined): string | undefined =>
    name ? aliasToReal.get(name) ?? name : undefined;

  // Khung 16:9 tùy chỉnh đúng 1920×1080.
  pptx.defineLayout({ name: 'IF_16x9', width: SLIDE_W, height: SLIDE_H });
  pptx.layout = 'IF_16x9';
  if (opts.author) pptx.author = opts.author;
  if (opts.title) pptx.title = opts.title;

  for (const s of slides) {
    const slide = pptx.addSlide();

    if (s.kind === 'image') {
      // Fallback: nhúng ảnh slide đã render full-bleed.
      slide.background = { color: '000000' };
      slide.addImage({
        data: s.imageDataUrl,
        x: 0,
        y: 0,
        w: SLIDE_W,
        h: SLIDE_H,
        sizing: { type: 'cover', w: SLIDE_W, h: SLIDE_H },
      });
      continue;
    }

    // ---- Slide nội dung chỉnh sửa được ----
    const { content, theme, layout, fonts } = s;
    // Font mặc định theo bộ curated; `fontFaces` (nếu có) ghi đè theo vai trò chữ để font user
    // tải lên được dùng đúng chỗ — nếu không thì nhúng font vào file cũng chẳng ai gọi tới.
    const font = PPTX_FONT[fonts] ?? 'Arial';
    const fontTitle = resolveFace(s.fontFaces?.title) || font;
    const fontBody = resolveFace(s.fontFaces?.body) || font;
    const fontKicker = resolveFace(s.fontFaces?.kicker) || font;
    const bg = hex(theme.bg, 'F5F1EA');
    const textCol = hex(theme.text, '221F1A');
    const mutedCol = hex(theme.muted, '8A8378');
    const accentCol = hex(theme.accent, '8A6F4D');
    const hasHero = Boolean(s.heroDataUrl);

    slide.background = { color: bg };

    if (layout === 'Quote') {
      // Trích dẫn căn giữa.
      slide.addText('“', {
        x: 0,
        y: 0.4,
        w: SLIDE_W,
        h: 2,
        align: 'center',
        fontFace: fontTitle,
        fontSize: 140,
        color: accentCol,
        bold: false,
      });
      slide.addText(content.title, {
        x: 1.5,
        y: 2.6,
        w: SLIDE_W - 3,
        h: 2.4,
        align: 'center',
        valign: 'middle',
        fontFace: fontTitle,
        fontSize: 32,
        italic: true,
        color: textCol,
      });
      if (content.body.length) {
        slide.addText(`— ${content.body[0].replace(/^[-•]\s*/, '')}`, {
          x: 1.5,
          y: 5.2,
          w: SLIDE_W - 3,
          h: 0.6,
          align: 'center',
          fontFace: fontBody,
          fontSize: 16,
          color: mutedCol,
        });
      }
    } else {
      // Cover + "Nội dung + ảnh": chữ khối trái, ảnh (nếu có) khối phải.
      const isCover = layout === 'Cover';
      const textBoxW = hasHero ? SLIDE_W * 0.52 - 0.9 : SLIDE_W - 1.6;
      const leftPad = 0.85;

      let cursorY = isCover ? 1.4 : 0.9;

      if (content.kicker) {
        slide.addText(content.kicker.toUpperCase(), {
          x: leftPad,
          y: cursorY,
          w: textBoxW,
          h: 0.4,
          fontFace: fontKicker,
          fontSize: 13,
          bold: true,
          color: accentCol,
          charSpacing: 3,
        });
        cursorY += 0.5;
      }

      slide.addText(content.title, {
        x: leftPad,
        y: cursorY,
        w: textBoxW,
        h: isCover ? 1.8 : 1.3,
        fontFace: fontTitle,
        fontSize: isCover ? 44 : 30,
        bold: true,
        color: textCol,
        valign: 'top',
      });
      cursorY += isCover ? 1.9 : 1.4;

      // Gạch accent dưới title.
      slide.addShape('line', {
        x: leftPad,
        y: cursorY,
        w: 1.2,
        h: 0,
        line: { color: accentCol, width: 2.5 },
      });
      cursorY += 0.35;

      const bodyItems = content.body
        .slice(0, isCover ? 3 : 8)
        .map((b) => b.replace(/^[-•]\s*/, ''));
      if (bodyItems.length) {
        slide.addText(
          bodyItems.map((text) => ({
            text,
            options: isCover
              ? {}
              : { bullet: { characterCode: '2022' }, indentLevel: 0 },
          })),
          {
            x: leftPad,
            y: cursorY,
            w: textBoxW,
            h: SLIDE_H - cursorY - 0.9,
            fontFace: fontBody,
            fontSize: isCover ? 16 : 15,
            color: isCover ? mutedCol : textCol,
            valign: 'top',
            lineSpacingMultiple: 1.15,
            paraSpaceAfter: 6,
          },
        );
      }

      if (hasHero && s.heroDataUrl) {
        // Ảnh hero khối phải, cover 16:9.
        const imgX = SLIDE_W * 0.56;
        const imgW = SLIDE_W - imgX;
        const imgY = isCover ? 0 : 1;
        const imgH = isCover ? SLIDE_H : SLIDE_H - 2;
        slide.addImage({
          data: s.heroDataUrl,
          x: imgX,
          y: imgY,
          w: imgW,
          h: imgH,
          sizing: { type: 'cover', w: imgW, h: imgH },
          rounding: !isCover,
        });
      }
    }

    // Footer brand + số trang.
    if (s.brand) {
      slide.addText(s.brand.toUpperCase(), {
        x: 0.85,
        y: SLIDE_H - 0.6,
        w: 6,
        h: 0.35,
        fontFace: font,
        fontSize: 10,
        color: mutedCol,
        charSpacing: 1,
      });
    }
    if (s.pageNo) {
      slide.addText(s.pageNo, {
        x: SLIDE_W - 2.85,
        y: SLIDE_H - 0.6,
        w: 2,
        h: 0.35,
        align: 'right',
        fontFace: font,
        fontSize: 10,
        color: mutedCol,
      });
    }
  }

  const fileName = `${safeFileName(opts.fileName ?? opts.title)}.pptx`;
  const embedFonts = opts.embedFonts ?? [];

  // KHÔNG dùng pptx.writeFile() nữa khi cần nhúng font: nó tự tải file xuống luôn, không cho ta
  // chen vào giữa. Lấy buffer → chèn font → tự tải. Không có font cần nhúng thì đường đi vẫn y
  // hệt cũ về mặt kết quả (injectEmbeddedFonts trả thẳng buffer gốc, không đụng ZIP).
  const data = (await pptx.write({ outputType: 'arraybuffer' })) as ArrayBuffer;
  const { blob, result } = await injectEmbeddedFonts(data, embedFonts);

  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    // Nhả sau một nhịp — thu hồi ngay có thể huỷ lượt tải ở vài trình duyệt.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }

  return result;
}
