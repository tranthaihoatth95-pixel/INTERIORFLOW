/**
 * Dispatch theo provider — 1 chỗ để API route gọi, không phải biết fal hay comfyui.
 * CHỈ import phía server.
 */
import type { ProviderName } from '@/lib/ai/tiers';
import * as fal from '@/lib/ai/providers/fal';
import * as comfyui from '@/lib/ai/providers/comfyui';
import * as sd from '@/lib/ai/providers/sd';

export type ProviderJobStatus =
  | { status: 'IN_QUEUE' | 'IN_PROGRESS' }
  | { status: 'COMPLETED'; imageUrls: string[] }
  | { status: 'FAILED'; error: string };

export function providerConfigured(provider: ProviderName): boolean {
  if (provider === 'fal') return fal.falConfigured();
  if (provider === 'comfyui') return comfyui.comfyuiConfigured();
  return sd.sdConfigured();
}

export function submitJob(provider: ProviderName, model: string, input: Record<string, unknown>): Promise<string> {
  if (provider === 'fal') return fal.submitJob(model, input);
  if (provider === 'comfyui') return comfyui.submitJob(model, input);
  return sd.submitJob(model, input);
}

export function jobStatus(provider: ProviderName, model: string, requestId: string): Promise<ProviderJobStatus> {
  if (provider === 'fal') return fal.jobStatus(model, requestId);
  if (provider === 'comfyui') return comfyui.jobStatus(model, requestId);
  return sd.jobStatus(model, requestId);
}
