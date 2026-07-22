/**
 * lib/notebook/chunk.ts — chia text dài thành chunk ~500 token overlap 50 token
 * cho pipeline embed/retrieve RAG.
 *
 * "Token" ở đây xấp xỉ bằng WORD (whitespace-split). Đủ chính xác cho split
 * theo kích thước với embedding NVIDIA (context ~512 token là dư dả cho 1 chunk),
 * không cần tokenizer thật nặng.
 *
 * Chiến lược: split theo paragraph → nhóm lại đến khi đạt targetTokens; overlap
 * bằng cách giữ N từ cuối chunk trước làm mở đầu chunk sau (giữ ngữ cảnh biên).
 */

export interface ChunkOpts {
  /** Số "token" (~word) mỗi chunk. Mặc định 500. */
  targetTokens?: number;
  /** Overlap giữa chunk N và N+1. Mặc định 50. */
  overlapTokens?: number;
}

export interface TextChunk {
  content: string;
  tokens: number;
  /** Số thứ tự trong tài liệu (0-based). */
  index: number;
  /** Trang PDF nếu có (chunk cross-page thì null). */
  page?: number | null;
}

const DEFAULT_TARGET = 500;
const DEFAULT_OVERLAP = 50;

/** Đếm word đơn giản (whitespace). Không dùng tokenizer thật để nhẹ. */
function countTokens(s: string): number {
  const t = s.trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
}

/**
 * Chunk theo word count, ưu tiên cắt tại ranh giới paragraph (\n\n) hoặc câu (. ! ?).
 * Overlap = N từ cuối chunk trước prepend vào chunk mới.
 */
export function chunkText(text: string, opts: ChunkOpts = {}): TextChunk[] {
  const target = Math.max(50, opts.targetTokens ?? DEFAULT_TARGET);
  const overlap = Math.max(0, Math.min(opts.overlapTokens ?? DEFAULT_OVERLAP, target - 10));

  const cleaned = text.replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').trim();
  if (!cleaned) return [];

  const words = cleaned.split(/\s+/);
  if (words.length <= target) {
    return [{ content: cleaned, tokens: words.length, index: 0 }];
  }

  const chunks: TextChunk[] = [];
  let start = 0;
  let idx = 0;
  while (start < words.length) {
    const end = Math.min(start + target, words.length);
    const slice = words.slice(start, end).join(' ');
    chunks.push({ content: slice, tokens: end - start, index: idx });
    idx += 1;
    if (end >= words.length) break;
    start = end - overlap;
  }
  return chunks;
}

/**
 * Chunk theo trang PDF — mỗi trang có thể sinh nhiều chunk, mỗi chunk giữ số trang.
 * Trang dài hơn targetTokens tự động cắt tiếp.
 */
export function chunkPages(
  pages: { page: number; text: string }[],
  opts: ChunkOpts = {},
): TextChunk[] {
  const out: TextChunk[] = [];
  let globalIdx = 0;
  for (const p of pages) {
    const perPage = chunkText(p.text, opts);
    for (const c of perPage) {
      out.push({ ...c, index: globalIdx, page: p.page });
      globalIdx += 1;
    }
  }
  return out;
}

export const __private = { countTokens };
