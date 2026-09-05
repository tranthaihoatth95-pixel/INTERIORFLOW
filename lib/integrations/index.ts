import { REGISTRY, getProvider, type IntegrationProvider } from '@/lib/integrations/registry';
import { getGrantedScope } from '@/lib/integrations/oauth-core';
import { NANG_LUC_PROVIDER, NHOM_PROVIDER, SCOPE_NANG_LUC, type NangLuc, type NhomTichHop } from '@/lib/integrations/capabilities';
import { scopeThieu } from '@/lib/integrations/scopes';

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
  /** Slice 7: nhóm + năng lực đọc từ `capabilities.ts` — UI tách "bối cảnh dự án" khỏi "thư giãn". */
  nhom: NhomTichHop;
  nangLuc: NangLuc[];
  /** Năng lực đã nối nhưng thiếu scope (vd token đến từ cửa login). Rỗng = đủ. */
  thieuScope: Partial<Record<NangLuc, string[]>>;
  /** Provider có endpoint thu hồi token hay không — UI nói thật khi bấm ngắt. */
  thuHoiDuoc: boolean;
  revokeNote?: string;
}

export async function providerStatus(userId: string | null, id: string): Promise<ProviderStatus | null> {
  const cfg = getProvider(id);
  if (!cfg) return null;
  const scope = cfg.kind === 'oauth' && userId ? await getGrantedScope(userId, id).catch(() => null) : null;
  const connected = scope !== null;
  const thieuScope: Partial<Record<NangLuc, string[]>> = {};
  if (connected) {
    for (const [nl, req] of Object.entries(SCOPE_NANG_LUC[cfg.id] ?? {})) {
      const thieu = scopeThieu(scope, req ?? []);
      if (thieu.length) thieuScope[nl as NangLuc] = thieu;
    }
  }
  return {
    id: cfg.id,
    label: cfg.label,
    tier: cfg.tier,
    kind: cfg.kind,
    configured: cfg.configured(),
    connected,
    note: cfg.note,
    nhom: NHOM_PROVIDER[cfg.id],
    nangLuc: NANG_LUC_PROVIDER[cfg.id],
    thieuScope,
    thuHoiDuoc: !!cfg.revokeUrl,
    revokeNote: cfg.revokeNote,
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
