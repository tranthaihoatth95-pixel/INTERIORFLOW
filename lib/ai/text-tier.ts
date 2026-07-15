/**
 * lib/ai/text-tier.ts — ĐIỀU PHỐI TẦNG cho tác vụ CHỮ (concept-writer, tóm tắt brief, giải thích
 * quy chuẩn…). 1 chỗ dùng chung cho mọi API route text, thay vì lặp logic chọn nguồn ở từng route.
 *
 * THỨ TỰ ƯU TIÊN 3 TẦNG (chốt của user):
 *   1. Cloud AI  — NVIDIA free (có NVIDIA_API_KEY). Chất tốt nhất, cần mạng + lượt free.
 *   2. Ollama    — LOCAL (localhost:11434, không key, offline, 0đ). Tự dò có/không.
 *   3. Lõi tất định — KHÔNG AI. Tầng này KHÔNG nằm ở đây: mỗi route tự có fallback tất định
 *      riêng (present/text = stub theo vai trò; scenarios = JSON rỗng…). Khi CẢ cloud lẫn Ollama
 *      không dùng được, hàm này ném lỗi typed để route bắt rồi chạy lõi tất định của nó.
 *
 * Cơ chế "CHỈ BÁO, KHÔNG mock im lặng": mỗi kết quả kèm `tier` + `model` để UI gắn badge tầng nào
 * chạy (đồng bộ cách render-v2 gắn `_tier`). Cloud lỗi/hết lượt → TỰ tụt xuống Ollama (nếu có);
 * cả hai fail → ném lỗi, route lo lõi tất định.
 */
import { completeText as nvidiaCompleteText, nvidiaConfigured, nvidiaLlmModel, NvidiaFreeExhausted } from './providers/nvidia';
import { completeText as ollamaCompleteText, isOllamaAvailable, resolveOllamaModel } from './providers/ollama';

/** 'cloud' = NVIDIA · 'local' = Ollama. (Lõi tất định do route tự dán nhãn, không đi qua đây.) */
export type TextTier = 'cloud' | 'local';

export interface TieredText {
  text: string;
  /** tầng đã chạy — route đưa thẳng ra `_tier` cho UI badge */
  tier: TextTier;
  /** model cụ thể đã chạy — badge chi tiết */
  model: string;
}

/** Không tầng AI nào khả dụng (chưa có NVIDIA key & không thấy Ollama). Route → chạy lõi tất định. */
export class NoTextProviderError extends Error {}

export interface TieredOpts {
  /** giới hạn token cho tầng local (cloud giữ mặc định của nvidia adapter) */
  maxTokens?: number;
  temperature?: number;
}

/**
 * Sinh chữ theo thứ tự tầng Cloud → Ollama. Trả `{ text, tier, model }`.
 *
 * - Có NVIDIA key: thử cloud trước. Thành công → tier 'cloud'. Lỗi (hết lượt / mất mạng / key sai)
 *   → TỤT xuống Ollama nếu dò thấy.
 * - Không key (hoặc cloud fail): dò Ollama; có → chạy local, tier 'local'.
 * - Cả hai không được: ném `NvidiaFreeExhausted` (nếu cloud hết lượt và không có local) hoặc lỗi
 *   cloud gốc, hoặc `NoTextProviderError` (không cấu hình gì) — route bắt rồi chạy lõi tất định.
 */
export async function completeTextTiered(
  prompt: string,
  system?: string,
  opts: TieredOpts = {},
): Promise<TieredText> {
  let cloudErr: unknown = null;

  // ── Tầng 1: Cloud (NVIDIA) ──
  if (nvidiaConfigured()) {
    try {
      const text = await nvidiaCompleteText(prompt, system);
      if (text.trim()) return { text, tier: 'cloud', model: nvidiaLlmModel() };
      // cloud trả rỗng → coi như fail, thử local
      cloudErr = new Error('NVIDIA trả rỗng.');
    } catch (err) {
      cloudErr = err; // hết lượt / key sai / mất mạng — thử local trước khi báo
    }
  }

  // ── Tầng 2: Ollama local ──
  const probe = await isOllamaAvailable();
  if (probe.available) {
    const model = resolveOllamaModel(probe.models);
    const text = await ollamaCompleteText(prompt, system, {
      model,
      max_tokens: opts.maxTokens,
      temperature: opts.temperature,
    });
    return { text, tier: 'local', model };
  }

  // ── Không tầng AI nào chạy được → surface lỗi cho route lo lõi tất định ──
  if (cloudErr instanceof NvidiaFreeExhausted) throw cloudErr; // route → 429
  if (cloudErr instanceof Error) throw cloudErr; // key sai / mất mạng → route → 502
  throw new NoTextProviderError(
    'Không có nguồn AI chữ: chưa cấu hình NVIDIA_API_KEY và không thấy Ollama local (localhost:11434). ' +
      'Thêm key ở build.nvidia.com, hoặc chạy "ollama serve" với model đã kéo.',
  );
}

export { NvidiaFreeExhausted };
