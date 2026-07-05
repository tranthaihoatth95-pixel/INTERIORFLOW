'use client';

import { AI_TASKS, taskMediaType, type AiTask } from '@/lib/ai/models';
import type { AiTier } from '@/lib/ai/tiers';

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
 * Submit AI job qua /api/jobs (theo tier) rồi poll tới khi xong. Trả danh sách URL media
 * (ảnh: đa số 1, moodboard 4; video: 1 URL mp4).
 * Throw AiJobError code 'PROVIDER_NOT_CONFIGURED' để node fallback sang mock.
 */
export async function runImageJob(
  task: AiTask,
  input: Record<string, unknown>,
  onProgress: (p: number) => void,
  tier: AiTier,
): Promise<string[]> {
  const submitRes = await fetch('/api/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, input, tier }),
  });
  const submitBody = await submitRes.json().catch(() => ({}));
  if (!submitRes.ok) {
    throw new AiJobError(submitBody.error ?? `Submit job lỗi (HTTP ${submitRes.status})`, submitBody.code);
  }
  const { jobId } = submitBody as { jobId: string };

  const started = Date.now();
  const typical = AI_TASKS[task].typicalMs;
  const isVideo = taskMediaType(task) === 'video';
  const timeout = isVideo ? VIDEO_TIMEOUT_MS : TIMEOUT_MS;
  onProgress(0.04);

  for (;;) {
    await sleep(POLL_MS);
    const elapsed = Date.now() - started;
    if (elapsed > timeout)
      throw new AiJobError(
        `Timeout ${Math.round(timeout / 60000)} phút — job chưa xong, thử lại sau.`,
      );

    const res = await fetch(`/api/jobs/${encodeURIComponent(jobId)}?task=${task}&tier=${tier}`);
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
}

let providerStatus: ProviderStatus | null = null;
/** Check 1 lần server có provider nào cấu hình (badge + quyết định mock). */
export async function checkProviders(): Promise<ProviderStatus> {
  if (providerStatus !== null) return providerStatus;
  try {
    const res = await fetch('/api/health');
    const j = await res.json();
    providerStatus = { fal: Boolean(j.fal), comfyui: Boolean(j.comfyui) };
  } catch {
    providerStatus = { fal: false, comfyui: false };
  }
  return providerStatus;
}
