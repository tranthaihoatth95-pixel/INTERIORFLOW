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
  | { status: 'COMPLETED'; imageUrls: string[] }
  | { status: 'FAILED'; error: string };

/** Chuẩn hoá output ảnh giữa các model (FLUX trả images[], ESRGAN/BiRefNet trả image). */
function imageUrls(data: unknown): string[] {
  const d = data as { images?: { url?: string }[]; image?: { url?: string } };
  const urls = (d?.images ?? []).map((i) => i.url).filter((u): u is string => Boolean(u));
  if (urls.length) return urls;
  return d?.image?.url ? [d.image.url] : [];
}

export async function jobStatus(modelId: string, requestId: string): Promise<ProviderJobStatus> {
  ensureConfigured();
  try {
    const s = await fal.queue.status(modelId, { requestId, logs: false });
    if (s.status !== 'COMPLETED') {
      return { status: s.status as 'IN_QUEUE' | 'IN_PROGRESS' };
    }
    const result = await fal.queue.result(modelId, { requestId });
    const urls = imageUrls(result.data);
    if (!urls.length) return { status: 'FAILED', error: 'Provider không trả về ảnh.' };
    return { status: 'COMPLETED', imageUrls: urls };
  } catch (err) {
    return { status: 'FAILED', error: falErrorMessage(err) };
  }
}
