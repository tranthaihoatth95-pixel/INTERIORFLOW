/**
 * lib/notebook/extract.ts — trích text từ nguồn upload để feed pipeline chunk/embed.
 *
 * - PDF: `unpdf` (đã có sẵn trong package.json cho PDF tools khác), trả về text
 *   theo trang → giữ số trang cho citation.
 * - Ảnh: caption bằng NVIDIA VLM (`captionImage` trong providers/nvidia). Nếu không
 *   có key hoặc lỗi → trả placeholder `[Image caption pending]` để pipeline vẫn
 *   chạy được, source vẫn "ready" (Nợ kỹ thuật OCR chuyên sâu ghi trong STATUS).
 * - Text/URL/meeting-note: passthrough plain text (URL v1 chưa fetch → chỉ lưu URL
 *   làm citation, content phải do user paste vào).
 */

import type { RefCaption } from '../ai/providers/nvidia';

export interface ExtractedPage {
  page: number;
  text: string;
}

export interface ExtractResult {
  /** Full text ghép mọi trang (cho kind text/image/url không phân trang). */
  fullText: string;
  /** Mảng trang (chỉ có với PDF nhiều trang). Rỗng nếu single-page. */
  pages: ExtractedPage[];
  /** Cảnh báo không fatal (vd caption placeholder). Route dùng để set source.errorMsg mềm. */
  warnings: string[];
}

/**
 * Extract PDF bằng `unpdf` (WASM-free, Node-safe). Trả text từng trang.
 */
export async function extractPdf(buf: Uint8Array): Promise<ExtractResult> {
  // Dynamic import để không nặng cold-start route text/image.
  const unpdf = await import('unpdf');
  const { extractText, getDocumentProxy } = unpdf;
  const pdf = await getDocumentProxy(buf);
  // extractText có option mergePages=false trả string[] theo trang.
  const result = (await extractText(pdf, { mergePages: false })) as { text: string[] | string; totalPages?: number };
  const arr: string[] = Array.isArray(result.text) ? result.text : [String(result.text ?? '')];
  const pages: ExtractedPage[] = arr.map((t, i) => ({ page: i + 1, text: (t ?? '').trim() })).filter((p) => p.text);
  const fullText = pages.map((p) => p.text).join('\n\n');
  return { fullText, pages, warnings: [] };
}

/**
 * Caption ảnh bằng NVIDIA VLM. Nếu key/model fail → placeholder không fatal.
 */
export async function extractImage(dataUri: string): Promise<ExtractResult> {
  try {
    const { captionImage } = await import('../ai/providers/nvidia');
    const cap: RefCaption = await captionImage(dataUri);
    const parts = [cap.caption, cap.room && `Không gian: ${cap.room}`, cap.style && `Phong cách: ${cap.style}`, cap.materials?.length && `Vật liệu: ${cap.materials.join(', ')}`]
      .filter(Boolean)
      .join('. ');
    const text = parts || '[Image caption pending]';
    return { fullText: text, pages: [], warnings: [] };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      fullText: '[Image caption pending]',
      pages: [],
      warnings: [`VLM caption fail: ${msg.slice(0, 200)}`],
    };
  }
}

/**
 * Text thuần / meeting note / URL với content pasted → passthrough sạch.
 */
export function extractPlain(text: string): ExtractResult {
  const clean = (text ?? '').replace(/\r\n?/g, '\n').trim();
  return { fullText: clean, pages: [], warnings: [] };
}
