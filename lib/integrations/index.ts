import { REGISTRY, getProvider, type IntegrationProvider } from '@/lib/integrations/registry';
import { isConnected } from '@/lib/integrations/oauth-core';

/**
 * lib/integrations/index.ts — Dispatcher + tổng hợp trạng thái. Route đọc qua đây; không import
 * thẳng từng provider. Trạng thái: configured (đã có khoá env chưa) × connected (user đã nối chưa).
 */
export { REGISTRY, getProvider } from '@/lib/integrations/registry';
export type { IntegrationProvider, ProviderConfig } from '@/lib/integrations/registry';

export interface ProviderStatus {
  id: IntegrationProvider;
  label: string;
  tier: 1 | 2 | 3;
  kind: 'oauth' | 'apikey' | 'stub';
  configured: boolean;
  connected: boolean;
  note?: string;
}

export async function providerStatus(userId: string | null, id: string): Promise<ProviderStatus | null> {
  const cfg = getProvider(id);
  if (!cfg) return null;
  const connected = cfg.kind === 'oauth' && userId ? await isConnected(userId, id).catch(() => false) : false;
  return {
    id: cfg.id,
    label: cfg.label,
    tier: cfg.tier,
    kind: cfg.kind,
    configured: cfg.configured(),
    connected,
    note: cfg.note,
  };
}

export async function allStatuses(userId: string | null): Promise<ProviderStatus[]> {
  const out: ProviderStatus[] = [];
  for (const id of Object.keys(REGISTRY)) {
    const s = await providerStatus(userId, id);
    if (s) out.push(s);
  }
  return out;
}
