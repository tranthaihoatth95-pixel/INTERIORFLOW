/**
 * Dispatch theo provider — 1 chỗ để API route gọi, không phải biết fal hay comfyui.
 * CHỈ import phía server.
 */
import type { ProviderName } from '@/lib/ai/tiers';
import * as fal from '@/lib/ai/providers/fal';
import * as comfyui from '@/lib/ai/providers/comfyui';

export type ProviderJobStatus =
  | { status: 'IN_QUEUE' | 'IN_PROGRESS' }
  | { status: 'COMPLETED'; imageUrls: string[] }
  | { status: 'FAILED'; error: string };

export function providerConfigured(provider: ProviderName): boolean {
  return provider === 'fal' ? fal.falConfigured() : comfyui.comfyuiConfigured();
}

export function submitJob(provider: ProviderName, model: string, input: Record<string, unknown>): Promise<string> {
  return provider === 'fal' ? fal.submitJob(model, input) : comfyui.submitJob(model, input);
}

export function jobStatus(provider: ProviderName, model: string, requestId: string): Promise<ProviderJobStatus> {
  return provider === 'fal' ? fal.jobStatus(model, requestId) : comfyui.jobStatus(model, requestId);
}
