'use client';

import { AI_TASKS, type AiTask } from '@/lib/ai/models';
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

/**
 * Submit AI job qua /api/jobs (theo tier) rồi poll tới khi xong. Trả danh sách URL ảnh.
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
  onProgress(0.04);

  for (;;) {
    await sleep(POLL_MS);
    const elapsed = Date.now() - started;
    if (elapsed > TIMEOUT_MS) throw new AiJobError('Timeout 3 phút — job chưa xong, thử lại sau.');

    const res = await fetch(`/api/jobs/${encodeURIComponent(jobId)}?task=${task}&tier=${tier}`);
    const body = (await res.json().catch(() => ({}))) as {
      status?: string;
      imageUrls?: string[];
      error?: string;
      code?: string;
    };
    if (!res.ok) throw new AiJobError(body.error ?? `Poll lỗi (HTTP ${res.status})`, body.code);

    if (body.status === 'COMPLETED' && body.imageUrls?.length) {
      onProgress(1);
      return body.imageUrls;
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
