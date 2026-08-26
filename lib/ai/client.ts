'use client';

import { AI_TASKS, taskMediaType, type AiTask } from '@/lib/ai/models';
import { providerForTier, type AiTier, type OneAiEngine } from '@/lib/ai/tiers';

export class AiJobError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const POLL_MS = 1500;
const TIMEOUT_MS = 180_000;
/** Video render lâu hơn nhiều (Kling ~1–3 phút) → nới timeout riêng cho task video. */
const VIDEO_TIMEOUT_MS = 300_000;
/**
 * 20/08 — đo thật trên máy Mac không CUDA (chỉ MPS, ComfyUI tự-host, "eager" kernel fallback):
 * lượt CHẠY NGUỘI đầu tiên (nạp checkpoint SDXL 6,9GB + ControlNet 2,4GB từ đĩa vào bộ nhớ, chưa
 * cache) hết 25 phút 38 giây cho MỘT ảnh — gấp ~8,5 lần TIMEOUT_MS cũ (180s). Cloud (fal/sd) vẫn
 * đúng ~vài chục giây nên KHÔNG đổi timeout chung — chỉ tự-host (ComfyUI) mới cần cửa sổ dài hơn
 * hẳn. Không nới vô hạn: 40 phút đủ cho cả lượt nguội chậm nhất đã đo + biên an toàn, vẫn có trần.
 */
const COMFYUI_TIMEOUT_MS = 2_400_000;

/**
 * Ảnh trong app có thể là URL tương đối (/demo/…, /uploads/… từ gallery/demo).
 * Provider chạy SERVER-side fetch ảnh → URL tương đối parse fail ("Failed to parse URL").
 * Tuyệt-đối-hoá mọi string input bắt đầu bằng '/' trước khi submit (data:/http giữ nguyên).
 */
function absolutizeInput(input: Record<string, unknown>): Record<string, unknown> {
  if (typeof window === 'undefined') return input;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    out[k] = typeof v === 'string' && v.startsWith('/') ? new URL(v, window.location.origin).href : v;
  }
  return out;
}

/**
 * Submit AI job qua /api/jobs (theo tier) rồi poll tới khi xong. Trả danh sách URL media
 * (ảnh: đa số 1, moodboard 4; video: 1 URL mp4).
 * Throw AiJobError code 'PROVIDER_NOT_CONFIGURED' để node fallback sang mock.
 */
export async function runImageJob(
  task: AiTask,
  input: Record<string, unknown>,
  onProgress: (p: number) => void,
  tier: AiTier,
  engine?: OneAiEngine,
  /** true = bước phụ bên trong một luồng lớn → 3 task trong `INTERNAL_FREE_TASKS` (tiers.ts)
   * không trừ credit; luồng trừ MỘT LẦN ở kết quả cuối. Gọi trực tiếp như công cụ riêng: bỏ trống. */
  internal?: boolean,
): Promise<string[]> {
  const submitRes = await fetch('/api/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, input: absolutizeInput(input), tier, engine, internal: internal || undefined }),
  });
  const submitBody = await submitRes.json().catch(() => ({}));
  if (!submitRes.ok) {
    throw new AiJobError(submitBody.error ?? `Submit job lỗi (HTTP ${submitRes.status})`, submitBody.code);
  }
  const { jobId } = submitBody as { jobId: string };

  const started = Date.now();
  const typical = AI_TASKS[task].typicalMs;
  const isVideo = taskMediaType(task) === 'video';
  // ComfyUI tự-host chạy trên máy người dùng (thường không CUDA) — đo thật cần cửa sổ chờ dài
  // hơn hẳn cloud, xem chú thích COMFYUI_TIMEOUT_MS. Video giữ ưu tiên riêng của nó.
  const isSelfHost = providerForTier(tier, engine) === 'comfyui';
  const timeout = isVideo ? VIDEO_TIMEOUT_MS : isSelfHost ? COMFYUI_TIMEOUT_MS : TIMEOUT_MS;
  onProgress(0.04);

  for (;;) {
    await sleep(POLL_MS);
    const elapsed = Date.now() - started;
    if (elapsed > timeout)
      throw new AiJobError(
        `Timeout ${Math.round(timeout / 60000)} phút — job chưa xong, thử lại sau.`,
      );

    const res = await fetch(
      `/api/jobs/${encodeURIComponent(jobId)}?task=${task}&tier=${tier}${engine ? `&engine=${engine}` : ''}`,
    );
    const body = (await res.json().catch(() => ({}))) as {
      status?: string;
      mediaUrls?: string[];
      imageUrls?: string[];
      error?: string;
      code?: string;
    };
    if (!res.ok) throw new AiJobError(body.error ?? `Poll lỗi (HTTP ${res.status})`, body.code);

    // mediaUrls tổng quát (ảnh/video); fallback imageUrls cho tương thích.
    const urls = body.mediaUrls?.length ? body.mediaUrls : body.imageUrls;
    if (body.status === 'COMPLETED' && urls?.length) {
      onProgress(1);
      return urls;
    }
    if (body.status === 'FAILED') throw new AiJobError(body.error ?? 'Job thất bại phía provider.');

    const base = body.status === 'IN_QUEUE' ? 0.08 : 0.15;
    onProgress(Math.min(0.92, base + (elapsed / typical) * 0.75));
  }
}

export interface ProviderStatus {
  fal: boolean;
  comfyui: boolean;
  /** SD-portable server (SD_SERVER_URL) đã nối chưa. */
  sd: boolean;
}

let providerStatus: ProviderStatus | null = null;
/** Check 1 lần server có provider nào cấu hình (badge + quyết định mock). */
export async function checkProviders(): Promise<ProviderStatus> {
  if (providerStatus !== null) return providerStatus;
  try {
    const res = await fetch('/api/health');
    const j = await res.json();
    providerStatus = { fal: Boolean(j.fal), comfyui: Boolean(j.comfyui), sd: Boolean(j.sd) };
  } catch {
    providerStatus = { fal: false, comfyui: false, sd: false };
  }
  return providerStatus;
}
