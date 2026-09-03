/**
 * lib/ai/vision-tier.ts — ĐIỀU PHỐI TẦNG cho tác vụ ĐỌC ẢNH (VLM): Image→Spec, phiếu đọc tham khảo
 * 4 cấp, gán nhãn ảnh… 1 chỗ dùng chung cho mọi API route thị giác — cùng khuôn `text-tier.ts`.
 *
 * THỨ TỰ 3 TẦNG (đúng thang đã chốt: cloud → local → lõi tất định):
 *   1. Cloud VLM — NVIDIA free (NVIDIA_API_KEY). Chất tốt nhất, cần mạng + lượt free.
 *   2. VLM local — Ollama với model THỊ GIÁC đã kéo (llava/llama3.2-vision/…). Offline, 0đ.
 *   3. Lõi tất định — KHÔNG ở đây: route tự có phần đo pixel (`lib/vision/image-spec.ts`
 *      `pixelEvidence`) và trả kết quả đo kèm `ai: {tier:'none', reason}` — không giả kết quả VLM.
 *
 * Cloud lỗi/hết lượt → TỰ tụt xuống local nếu có model thị giác; cả hai không được → ném lỗi typed
 * (route quyết định: trả phần đo pixel + lý do). Mỗi kết quả kèm `tier` + `model` để UI gắn badge.
 * KHÔNG hardcode một nhà cung cấp: thêm tầng = thêm một nhánh ở đây, route không đổi.
 */
import { visionChat as nvidiaVisionChat, nvidiaConfigured, nvidiaVlmModel, NvidiaFreeExhausted } from './providers/nvidia';
import { visionChat as ollamaVisionChat, isOllamaAvailable, pickVisionModel } from './providers/ollama';

export type VisionTier = 'cloud' | 'local';

export interface TieredVision {
  text: string;
  tier: VisionTier;
  model: string;
}

/** Không tầng VLM nào khả dụng — route trả phần tất định kèm lý do này. */
export class NoVisionProviderError extends Error {}

export interface VisionTieredOpts {
  maxTokens?: number;
  /** timeout tầng local (ms) — model thị giác local chậm hơn model chữ. */
  localTimeoutMs?: number;
}

/**
 * Đọc ảnh theo thứ tự tầng Cloud → Ollama-vision. Trả `{ text, tier, model }`.
 * `image` = data-URI hoặc URL tuyệt đối (cả hai provider đều nhận `image_url`).
 */
export async function readImageTiered(image: string, prompt: string, opts: VisionTieredOpts = {}): Promise<TieredVision> {
  let cloudErr: unknown = null;

  // ── Tầng 1: Cloud VLM (NVIDIA) ──
  if (nvidiaConfigured()) {
    try {
      const text = await nvidiaVisionChat(prompt, image, { max_tokens: opts.maxTokens });
      if (text.trim()) return { text, tier: 'cloud', model: nvidiaVlmModel() };
      cloudErr = new Error('NVIDIA VLM trả rỗng.');
    } catch (err) {
      cloudErr = err;
    }
  }

  // ── Tầng 2: VLM local (Ollama, CHỈ model thị giác) ──
  const probe = await isOllamaAvailable();
  if (probe.available) {
    const model = pickVisionModel(probe.models);
    if (model) {
      const text = await ollamaVisionChat(prompt, image, { model, max_tokens: opts.maxTokens, timeoutMs: opts.localTimeoutMs });
      return { text, tier: 'local', model };
    }
    // Ollama chạy nhưng không có model đọc ảnh — nói rõ, không gửi ảnh cho model chữ.
    if (!cloudErr) {
      throw new NoVisionProviderError(
        'Ollama đang chạy nhưng chưa có model THỊ GIÁC (llava / llama3.2-vision / moondream…) — ' +
          'kéo một model đọc ảnh hoặc đặt OLLAMA_VISION_MODEL; hoặc thêm NVIDIA_API_KEY để dùng cloud.',
      );
    }
  }

  if (cloudErr instanceof NvidiaFreeExhausted) throw cloudErr;
  if (cloudErr instanceof Error) throw cloudErr;
  throw new NoVisionProviderError(
    'Không có nguồn AI đọc ảnh: chưa cấu hình NVIDIA_API_KEY và không thấy Ollama local có model thị giác. ' +
      'Phần đo pixel (bảng màu · ánh sáng · phối cảnh) vẫn chạy, không cần AI.',
  );
}

export { NvidiaFreeExhausted };
