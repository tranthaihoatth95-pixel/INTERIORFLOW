/**
 * Provider adapter: fal.ai — CHỈ import phía server (API routes).
 * Swap sang Replicate/ComfyUI: viết file mới cùng interface submitJob/jobStatus.
 */
import { fal } from '@fal-ai/client';

let configured = false;
function ensureConfigured() {
  if (!process.env.FAL_KEY) throw new Error('FAL_KEY chưa cấu hình');
  if (!configured) {
    fal.config({ credentials: process.env.FAL_KEY });
    configured = true;
  }
}

export function falConfigured() {
  return Boolean(process.env.FAL_KEY);
}

/** Upload mọi data-URI trong input lên fal storage, thay bằng URL. */
async function resolveDataUris(input: Record<string, unknown>): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string' && value.startsWith('data:')) {
      const blob = await (await fetch(value)).blob();
      const file = new File([blob], 'input.png', { type: blob.type || 'image/png' });
      out[key] = await fal.storage.upload(file);
    } else {
      out[key] = value;
    }
  }
  return out;
}

/** Rút message dễ hiểu từ ApiError của fal (body.detail chứa lý do thật, vd hết balance). */
function falErrorMessage(err: unknown): string {
  const body = (err as { body?: { detail?: unknown } })?.body;
  if (body?.detail) return typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail);
  return err instanceof Error ? err.message : String(err);
}

export async function submitJob(modelId: string, input: Record<string, unknown>): Promise<string> {
  ensureConfigured();
  try {
    const cleaned = await resolveDataUris(input);
    const { request_id } = await fal.queue.submit(modelId, { input: cleaned });
    return request_id;
  } catch (err) {
    throw new Error(falErrorMessage(err));
  }
}

export type ProviderJobStatus =
  | { status: 'IN_QUEUE' | 'IN_PROGRESS' }
  // mediaUrls tổng quát (ảnh hoặc video); imageUrls giữ lại cho tương thích client cũ.
  | { status: 'COMPLETED'; mediaUrls: string[]; mediaType: 'image' | 'video'; imageUrls: string[] }
  | { status: 'FAILED'; error: string };

/** Chuẩn hoá output ảnh giữa các model (FLUX trả images[], ESRGAN/BiRefNet trả image). */
function imageUrls(data: unknown): string[] {
  const d = data as { images?: { url?: string }[]; image?: { url?: string } };
  const urls = (d?.images ?? []).map((i) => i.url).filter((u): u is string => Boolean(u));
  if (urls.length) return urls;
  return d?.image?.url ? [d.image.url] : [];
}

/** Trích URL video: Kling/Veo/… trả { video: { url } }, đôi khi videos[]. */
function videoUrls(data: unknown): string[] {
  const d = data as { video?: { url?: string }; videos?: { url?: string }[] };
  if (d?.video?.url) return [d.video.url];
  return (d?.videos ?? []).map((v) => v.url).filter((u): u is string => Boolean(u));
}

/* ───────────────────────────── PROBE (chẩn đoán 403 hết balance) ─────────────────────────────
 * fal từng trả 403 "Exhausted balance" — health check falConfigured() chỉ biết CÓ KEY,
 * không biết key còn xài được không. probeFal(): submit 1 job flux/schnell tối thiểu rồi
 * CANCEL NGAY (không chờ render → gần như 0 chi phí), phân loại lỗi submit.
 * MỘT lần duy nhất, timeout cứng, KHÔNG retry. Chạy tay: sucrase-node scripts/probe-fal.ts
 */

export type FalProbeStatus = 'ok' | 'no-key' | 'exhausted' | 'bad-key' | 'error';

export interface FalProbeResult {
  status: FalProbeStatus;
  /** thông điệp gốc từ fal (rút gọn) — để báo cáo cho user */
  detail: string;
}

/** Phân loại message lỗi fal → trạng thái probe. Export để test tất định. */
export function classifyFalError(msg: string): FalProbeStatus {
  const m = msg.toLowerCase();
  if (/balance|exhaust|locked|payment|billing|402/.test(m)) return 'exhausted';
  if (/unauthorized|forbidden|invalid.*(key|credential|token)|401|403/.test(m)) return 'bad-key';
  return 'error';
}

export async function probeFal(timeoutMs = 15000): Promise<FalProbeResult> {
  if (!falConfigured()) {
    return { status: 'no-key', detail: 'FAL_KEY chưa có trong .env.local.' };
  }
  ensureConfigured();
  const modelId = 'fal-ai/flux/schnell';
  const timeout = new Promise<never>((_, rej) =>
    setTimeout(() => rej(new Error(`Probe timeout ${timeoutMs / 1000}s — mạng chậm hoặc fal treo.`)), timeoutMs),
  );
  try {
    // Job rẻ nhất có thể; submit qua được = auth + balance OK. Cancel ngay để không tốn.
    const { request_id } = await Promise.race([
      fal.queue.submit(modelId, {
        input: { prompt: 'probe', num_images: 1, num_inference_steps: 1, image_size: 'square' },
      }),
      timeout,
    ]);
    try {
      await fal.queue.cancel(modelId, { requestId: request_id });
    } catch {
      // cancel trượt (job đã chạy) — schnell 1 step vẫn rẻ, bỏ qua
    }
    return { status: 'ok', detail: `Submit OK (request ${request_id.slice(0, 8)}…, đã cancel).` };
  } catch (err) {
    const detail = falErrorMessage(err).slice(0, 200);
    return { status: classifyFalError(detail), detail };
  }
}

export async function jobStatus(modelId: string, requestId: string): Promise<ProviderJobStatus> {
  ensureConfigured();
  try {
    const s = await fal.queue.status(modelId, { requestId, logs: false });
    if (s.status !== 'COMPLETED') {
      return { status: s.status as 'IN_QUEUE' | 'IN_PROGRESS' };
    }
    const result = await fal.queue.result(modelId, { requestId });
    // Ưu tiên video (nếu model trả), fallback ảnh — cùng 1 handler cho mọi task.
    const vids = videoUrls(result.data);
    if (vids.length) {
      return { status: 'COMPLETED', mediaUrls: vids, mediaType: 'video', imageUrls: [] };
    }
    const imgs = imageUrls(result.data);
    if (!imgs.length) return { status: 'FAILED', error: 'Provider không trả về media (ảnh/video).' };
    return { status: 'COMPLETED', mediaUrls: imgs, mediaType: 'image', imageUrls: imgs };
  } catch (err) {
    return { status: 'FAILED', error: falErrorMessage(err) };
  }
}
