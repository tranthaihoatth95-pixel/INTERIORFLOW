/**
 * lib/present-editor/content-deck.ts — Dàn slide TỰ ĐỘNG từ NỘI DUNG TEXT dán vào.
 *
 * Trước đây flow "Generate" chỉ nạp ảnh + palette, BỎ QUA text đã dán → phải dàn tay.
 * Module này parse text (markdown/heading + bullet) → mảng EditorSlide (cover + content),
 * rải ảnh nội dung vào từng slide. Điểm xuất phát; user chỉnh tiếp (human-in-loop).
 */

import type { EditorSlide } from './model';
import { BUILTIN_TEMPLATES } from './templates';
import type { FontPairing } from '@/lib/slides';

const clean = (s: string) => s.replace(/\*\*/g, '').replace(/[*_`]/g, '').trim();

interface Block {
  title: string;
  body: string[];
}

/** Tách text thành khối theo heading (#/##/…) hoặc "CHƯƠNG/CAO TRÀO". Bỏ bảng/hr/trống. */
function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let cur: Block | null = null;
  const push = () => {
    if (cur && (cur.title || cur.body.length)) blocks.push(cur);
  };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || /^-{3,}$/.test(line) || line.startsWith('|')) continue; // trống / hr / hàng bảng
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    // heading markdown, HOẶC dòng in-hoa ngắn kiểu "CHƯƠNG 0X — …" / "CAO TRÀO"
    const capHead =
      !h && line === line.toUpperCase() && line.length <= 70 && /[A-ZÀ-Ỹ]/.test(line) && /(CHƯƠNG|CHAPTER|PHẦN|CAO TRÀO|GHI CHÚ)/.test(line);
    if (h || capHead) {
      push();
      let title = clean(h ? h[2] : line);
      title = title
        .replace(/^(?:CHƯƠNG|CHAPTER|PHẦN)\s*\d*\s*[—:.\-]?\s*/i, '')
        .replace(/^CAO TRÀO\s*[—:.\-]?\s*/i, '')
        .replace(/^GHI CHÚ[^\p{L}]*/iu, '')
        .trim();
      cur = { title, body: [] };
      continue;
    }
    if (!cur) cur = { title: '', body: [] };
    const b = clean(
      line
        .replace(/^[-*•]\s+/, '')
        .replace(/^\d+[.)]\s+/, '')
        .replace(/^>\s?/, ''),
    );
    if (b) cur.body.push(b);
  }
  push();
  return blocks;
}

/**
 * Nội dung text → mảng EditorSlide. Slide 0 = Cover; còn lại = Content+ảnh. Ảnh nội dung
 * rải vòng. Trả rỗng nếu không parse ra khối nào.
 */
export function slidesFromContent(
  text: string,
  images: string[],
  palette: string[],
  fonts?: FontPairing,
): EditorSlide[] {
  const blocks = parseBlocks(text);
  if (!blocks.length) return [];
  const cover = BUILTIN_TEMPLATES.find((t) => t.id === 'cover');
  const content = BUILTIN_TEMPLATES.find((t) => t.id === 'content-image') ?? cover;
  if (!cover || !content) return [];

  let ii = 0;
  const nextImg = () => (images.length ? images[ii++ % images.length] : undefined);

  return blocks.map((blk, i) => {
    const body = blk.body.slice(0, 5);
    const img = nextImg();
    if (i === 0) {
      return cover.build({
        palette,
        fonts,
        kicker: 'DETECH · CONCEPT',
        title: blk.title || 'Concept',
        body: body.slice(0, 2),
        images: img ? [img] : [],
      });
    }
    return content.build({
      palette,
      fonts,
      kicker: String(i).padStart(2, '0'),
      title: blk.title || `Nội dung ${i}`,
      body,
      images: img ? [img] : [],
    });
  });
}
