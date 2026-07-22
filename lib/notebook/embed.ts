/**
 * lib/notebook/embed.ts — gọi NVIDIA embedding endpoint để vector-hoá text
 * cho pipeline RAG Project Notebook.
 *
 * Model mặc định: `nvidia/nv-embedqa-e5-v5` (1024 dim, OpenAI-compatible endpoint,
 * hỗ trợ input_type = query|passage — chuẩn Q&A retrieval của NVIDIA NIM).
 * Có thể override bằng env `NVIDIA_EMBED_MODEL`.
 *
 * Endpoint: `${NVIDIA_BASE_URL}/embeddings` (OpenAI schema). Cùng key và base
 * URL với các route text/vision khác của IF (`lib/ai/providers/nvidia.ts`).
 *
 * KHÔNG có fallback local ở đây (Ollama embed model chưa cấu hình chung).
 * Nếu key chưa cấu hình → ném `NoEmbedProviderError` để route bắt và set
 * source.status = 'error' + errorMsg rõ ràng ("chưa có NVIDIA_API_KEY").
 */

const BASE = () => (process.env.NVIDIA_BASE_URL ?? 'https://integrate.api.nvidia.com/v1').replace(/\/+$/, '');

export const NVIDIA_EMBED_DEFAULT = 'nvidia/nv-embedqa-e5-v5';
/** Kích thước vector của model mặc định — dùng để log/validate. Không hardcode ở retrieval (cosine dùng min length). */
export const NVIDIA_EMBED_DEFAULT_DIM = 1024;

export function embedModel(): string {
  return process.env.NVIDIA_EMBED_MODEL ?? NVIDIA_EMBED_DEFAULT;
}

export function embedConfigured(): boolean {
  return !!process.env.NVIDIA_API_KEY;
}

export class NoEmbedProviderError extends Error {}
export class EmbedError extends Error {}

interface EmbedResp {
  data?: { embedding?: number[]; index?: number }[];
  usage?: { total_tokens?: number };
}

/**
 * Embed 1 hoặc nhiều text. `inputType='passage'` cho chunk trong DB,
 * 'query' cho câu hỏi user (theo hướng dẫn NVIDIA NIM E5).
 * Trả về mảng vector theo đúng thứ tự input.
 */
export async function embedTexts(
  texts: string[],
  inputType: 'passage' | 'query' = 'passage',
): Promise<number[][]> {
  if (!embedConfigured()) {
    throw new NoEmbedProviderError('NVIDIA_API_KEY chưa cấu hình — không thể embed.');
  }
  const cleaned = texts.map((t) => (t ?? '').trim()).filter((t) => t.length > 0);
  if (cleaned.length === 0) return [];

  const url = `${BASE()}/embeddings`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
      accept: 'application/json',
    },
    body: JSON.stringify({
      model: embedModel(),
      input: cleaned,
      input_type: inputType, // NVIDIA NIM-specific, chấp nhận với OpenAI schema
      encoding_format: 'float',
      truncate: 'END', // cắt cuối nếu vượt context, thay vì lỗi
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new EmbedError(`NVIDIA embed ${res.status}: ${body.slice(0, 300)}`);
  }
  const j = (await res.json().catch(() => ({}))) as EmbedResp;
  const rows = j.data ?? [];
  if (rows.length !== cleaned.length) {
    throw new EmbedError(`NVIDIA embed trả ${rows.length} vector, expected ${cleaned.length}`);
  }
  // giữ đúng thứ tự theo `index`
  const out = new Array<number[]>(cleaned.length);
  for (const row of rows) {
    const i = row.index ?? 0;
    if (Array.isArray(row.embedding)) out[i] = row.embedding;
  }
  return out;
}

export async function embedOne(text: string, inputType: 'passage' | 'query' = 'query'): Promise<number[]> {
  const [v] = await embedTexts([text], inputType);
  if (!v) throw new EmbedError('NVIDIA embed trả rỗng.');
  return v;
}
