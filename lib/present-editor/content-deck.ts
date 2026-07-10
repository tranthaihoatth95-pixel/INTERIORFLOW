/**
 * lib/present-editor/content-deck.ts — Dàn slide TỰ ĐỘNG từ NỘI DUNG TEXT dán vào.
 *
 * Trước đây flow "Generate" chỉ nạp ảnh + palette, BỎ QUA text đã dán → phải dàn tay.
 * Module này parse text (markdown/heading + bullet + blockquote) → mảng EditorSlide
 * (cover + quote + content), rải ảnh nội dung vào từng slide. Điểm xuất phát; user
 * chỉnh tiếp (human-in-loop).
 *
 * Cải tiến (theo test flow thật):
 *  - Chỉ heading cấp 1–2 (#/##) mới TÁCH slide; cấp ≥3 (###) là phụ đề/ý trong slide
 *    → cover không bị byline/subtitle cắt rời.
 *  - Block blockquote/1 câu → slide QUOTE (giữ chất câu trích), không nhét vào content.
 *  - Body dài KHÔNG cắt im lặng: tách sang slide "(tiếp)".
 */

import type { EditorSlide } from './model';
import { BUILTIN_TEMPLATES } from './templates';
import type { FontPairing } from '@/lib/slides';

const clean = (s: string) => s.replace(/\*\*/g, '').replace(/[*_`]/g, '').trim();

interface Block {
  title: string;
  body: string[];
  quoteLines: number; // số dòng vốn là blockquote (>)
}

/** Tách text thành khối theo heading cấp 1–2 hoặc "CHƯƠNG/CAO TRÀO". Bỏ bảng/hr/trống. */
function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let cur: Block | null = null;
  const ensure = (): Block => (cur ??= { title: '', body: [], quoteLines: 0 });
  const push = () => {
    if (cur && (cur.title || cur.body.length)) blocks.push(cur);
  };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || /^-{3,}$/.test(line) || line.startsWith('|')) continue; // trống / hr / hàng bảng
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    const topHeading = !!h && h[1].length <= 2; // chỉ #/## tách slide
    const capHead =
      !h &&
      line === line.toUpperCase() &&
      line.length <= 70 &&
      /[A-ZÀ-Ỹ]/.test(line) &&
      /(CHƯƠNG|CHAPTER|PHẦN|CAO TRÀO|GHI CHÚ)/.test(line);
    if (topHeading || capHead) {
      push();
      const title = clean(h ? h[2] : line)
        .replace(/^(?:CHƯƠNG|CHAPTER|PHẦN)\s*\d*\s*[—:.\-]?\s*/i, '')
        .replace(/^CAO TRÀO\s*[—:.\-]?\s*/i, '')
        .replace(/^GHI CHÚ[^\p{L}]*/iu, '')
        .trim();
      cur = { title, body: [], quoteLines: 0 };
      continue;
    }
    const b = ensure();
    const isQuote = /^>\s?/.test(line);
    const t = clean(
      line
        .replace(/^#{3,6}\s+/, '') // heading cấp ≥3 → ý trong slide
        .replace(/^[-*•]\s+/, '')
        .replace(/^\d+[.)]\s+/, '')
        .replace(/^>\s?/, ''),
    );
    if (t) {
      b.body.push(t);
      if (isQuote) b.quoteLines++;
    }
  }
  push();
  return blocks;
}

/** Chia body dài thành nhiều nhóm ≤n (để không cắt im lặng — đẩy sang slide "(tiếp)"). */
function chunk<T>(arr: T[], n: number): T[][] {
  if (arr.length <= n) return [arr];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

/**
 * Nội dung text → mảng EditorSlide. Slide 0 = Cover; block 1 câu / blockquote → Quote;
 * còn lại = Content+ảnh (body dài tách "(tiếp)"). Ảnh nội dung rải vòng. Rỗng → [].
 */
export function slidesFromContent(
  text: string,
  images: string[],
  palette: string[],
  fonts?: FontPairing,
): EditorSlide[] {
  const blocks = parseBlocks(text);
  if (!blocks.length) return [];
  const T = (id: string) => BUILTIN_TEMPLATES.find((t) => t.id === id);
  const cover = T('cover');
  const content = T('content-image') ?? cover;
  const quote = T('quote') ?? content;
  if (!cover || !content || !quote) return [];

  let ii = 0;
  const nextImg = () => (images.length ? images[ii++ % images.length] : undefined);
  const slides: EditorSlide[] = [];

  blocks.forEach((blk, i) => {
    // Cover — gồm cả phụ đề/byline ngay sau H1 (đã ở cùng block nhờ chỉ #/## tách slide).
    if (i === 0) {
      const img = nextImg();
      slides.push(
        cover.build({
          palette,
          fonts,
          kicker: 'DETECH · CONCEPT',
          title: blk.title || 'Concept',
          body: blk.body.slice(0, 2),
          images: img ? [img] : [],
        }),
      );
      return;
    }
    // Quote — block chủ yếu là câu trích (blockquote) hoặc 1 câu tuyên ngôn ngắn.
    const isQuote = blk.body.length > 0 && (blk.quoteLines / blk.body.length >= 0.6 || blk.body.length === 1);
    if (isQuote && blk.body.join(' ').length < 220) {
      slides.push(
        quote.build({ palette, fonts, kicker: blk.title || '', title: blk.body.join(' '), body: [] }),
      );
      return;
    }
    // Content — body dài tách "(tiếp)" thay vì cắt bỏ.
    chunk(blk.body, 5).forEach((part, ci) => {
      const img = ci === 0 ? nextImg() : undefined;
      slides.push(
        content.build({
          palette,
          fonts,
          kicker: String(i).padStart(2, '0'),
          title: ci === 0 ? blk.title || `Nội dung ${i}` : `${blk.title} (tiếp)`,
          body: part,
          images: img ? [img] : [],
        }),
      );
    });
  });

  return slides;
}
