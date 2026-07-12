/**
 * lib/present-editor/reference-layout.ts — Ảnh MẪU bố cục → deck theo LƯỚI thật.
 *
 * Đường "dàn theo ảnh mẫu" (region path): đọc 1 ảnh reference → detectRegions (lưới) →
 * đổ nội dung (parseBlocks) vào lưới đó qua region-layout, thay cho template cứng.
 * Kích hoạt khi user ĐÍNH KÈM ảnh reference lúc Generate; không có ảnh → caller vẫn
 * dùng slidesFromContent như cũ (augment, không phá luồng cũ).
 *
 * Tách 2 tầng: `buildSlidesFromCells` THUẦN (test được, không DOM) + `slidesFromReference`
 * bọc phần load ảnh (DOM, async).
 */

import type { EditorSlide } from './model';
import type { FontPairing } from '@/lib/slides';
import type { RegionCell } from './detect-regions';
import { detectRegions, DetectRegionsError } from './detect-regions';
import { buildSlideFromRegions } from './region-layout';
import { parseBlocks, type Block } from './content-deck';

/** THUẦN: lưới + blocks nội dung → mảng slide. Rải ảnh vòng; block đầu = hero/cover. */
export function buildSlidesFromCells(
  cells: RegionCell[],
  blocks: Block[],
  images: string[],
  palette?: string[],
  _fonts?: FontPairing,
): EditorSlide[] {
  if (!cells.length || !blocks.length) return [];
  let ii = 0;
  const nextImg = () => (images.length ? images[ii++ % images.length] : undefined);

  return blocks.map((blk, i) => {
    const isCover = i === 0; // block đầu = cover (không xét quote)
    const isQuote =
      !isCover &&
      blk.body.length > 0 &&
      (blk.quoteLines / blk.body.length >= 0.6 || blk.body.length === 1) &&
      blk.body.join(' ').length < 220;
    const templateId = isCover ? 'cover' : isQuote ? 'quote' : 'content-image';
    const img = isCover || !isQuote ? nextImg() : undefined;
    return buildSlideFromRegions({
      cells,
      templateId,
      palette,
      hero: isCover || isQuote,
      content: {
        kicker: isCover ? undefined : String(i).padStart(2, '0'),
        title: isQuote ? blk.body.join(' ') : blk.title || (isCover ? 'Concept' : `Nội dung ${i}`),
        body: isCover ? blk.body.slice(0, 2) : isQuote ? [] : blk.body,
        images: img ? [img] : [],
      },
    });
  });
}

/** Load ảnh CORS-clean → HTMLImageElement. */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => res(img);
    img.onerror = () => rej(new Error('img load fail'));
    img.src = url;
  });
}

/**
 * HOOK ML pha 1 — DOM/async: ảnh mẫu (url) → hình học lưới {cells, gutter} cho suggestTemplate
 * (suggest.ts nhận `grid`). Trả null nếu ảnh lỗi/tainted/lưới nghèo — caller giữ heuristic cũ.
 */
export async function detectGridFromUrl(
  refUrl: string,
): Promise<{ cells: RegionCell[]; gutterXPct: number; gutterYPct: number } | null> {
  if (typeof window === 'undefined') return null;
  try {
    const img = await loadImage(refUrl);
    const { cells, gutterXPct, gutterYPct } = detectRegions(img);
    if (cells.length < 2) return null;
    return { cells, gutterXPct, gutterYPct };
  } catch {
    return null; // ảnh hỏng/CORS taint — im lặng degrade, không chặn suggest
  }
}

/**
 * DOM/async: ảnh mẫu (url) + nội dung → deck theo lưới ảnh. Trả [] nếu ảnh lỗi/tainted
 * hoặc không dò được ô — để caller FALLBACK về slidesFromContent (không ném ra ngoài).
 */
export async function slidesFromReference(
  refUrl: string,
  text: string,
  images: string[],
  palette?: string[],
  fonts?: FontPairing,
): Promise<EditorSlide[]> {
  if (typeof window === 'undefined') return [];
  const blocks = parseBlocks(text);
  if (!blocks.length) return [];
  try {
    const img = await loadImage(refUrl);
    const { cells } = detectRegions(img);
    if (cells.length < 2) return []; // lưới quá nghèo → để template lo
    return buildSlidesFromCells(cells, blocks, images, palette, fonts);
  } catch (e) {
    if (e instanceof DetectRegionsError) return [];
    return [];
  }
}
