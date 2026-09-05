'use client';

/**
 * app/settings/_components/AiTiersCard.tsx — "Bốn mức AI · nhà cung cấp · kiểm tra kết nối"
 * (Slice 10, 03/09). Đứng CẠNH `AiDependencySettings` (bộ chọn mức thật, GIỮ NGUYÊN) — thẻ này
 * là lớp GIẢI NGHĨA + NĂNG LỰC + KIỂM TRA, không phải bộ chọn thứ hai (một nguồn chọn, nhiều mặt tiền).
 *
 * Dữ liệu: `_lib/ai-tiers-view.ts` (thuần, có test) suy từ `lib/ai/tiers.ts` + `lib/ai/models.ts`.
 * Trạng thái provider: `/api/health` (boolean từ server — server thấy biến môi trường). KHÔNG có
 * secret nào đi qua client, không ghi localStorage, không log giá trị khoá.
 */
import { useState } from 'react';
import { Cpu, Cloud, ShieldCheck, Workflow, Wifi, WifiOff, Check, Minus, RefreshCw } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { ProviderName } from '@/lib/ai/tiers';
import {
  fourTierOf, fourTierViews, PROVIDER_FACTS, probeProviders, providerCapabilities, redactSecrets,
  type FourTierId, type ProbeResult,
} from '../_lib/ai-tiers-view';

const TIER_ICON: Record<FourTierId, typeof Cloud> = {
  deterministic: ShieldCheck,
  local: Cpu,
  connected: Cloud,
  orchestrated: Workflow,
};

const PRIVACY_LABEL = {
  none: ['Không rời máy', 'Stays on device'],
  'on-device': ['Trên thiết bị', 'On device'],
  lan: ['Trong LAN', 'On the LAN'],
  cloud: ['Ra cloud', 'Leaves to cloud'],
} as const;

export function AiTiersCard() {
  const tr = useT();
  const aiTier = useFlowStore((s) => s.aiTier);
  const oneAiEngine = useFlowStore((s) => s.oneAiEngine);
  const [probe, setProbe] = useState<ProbeResult | null>(null);
  const [probing, setProbing] = useState(false);
  const [openProvider, setOpenProvider] = useState<ProviderName | null>(null);

  const views = fourTierViews(oneAiEngine);
  const current = fourTierOf(aiTier);

  const onProbe = async () => {
    setProbing(true);
    const r = await probeProviders();
    setProbe(r);
    setProbing(false);
  };

  const configuredOf = (p: ProviderName): boolean | null =>
    probe ? (probe.providers.find((x) => x.id === p)?.configured ?? false) : null;

  return (
    <section>
      <h2 className="text-[15px] font-semibold text-[var(--t1)]">
        {tr('Bốn mức AI · nhà cung cấp', 'Four AI tiers · providers')}
      </h2>
      <p className="mt-1 text-[12.5px] text-[var(--t3)]">
        {tr(
          'Mức đang chọn ở trên rơi vào nghĩa nào, dữ liệu đi đâu, tốn gì, và nhà cung cấp nào đứng sau. Đổi mức ở bộ chọn phía trên.',
          'What the selected level means, where data goes, what it costs, and which provider backs it. Change the level in the selector above.',
        )}
      </p>

      {/* ── ① bốn mức theo nghĩa ── */}
      <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
        {views.map((v) => {
          const Icon = TIER_ICON[v.id];
          const active = v.id === current;
          const [pv, pe] = PRIVACY_LABEL[v.privacy];
          return (
            <div
              key={v.id}
              className={cn(
                'rounded-[10px] border px-3 py-2.5',
                active ? 'border-[var(--accent-ring)] bg-[var(--accent-soft)]' : 'border-[var(--border)]',
              )}
            >
              <div className="flex items-center gap-1.5">
                <Icon size={15} className={active ? 'text-[var(--accent)]' : 'text-[var(--t3)]'} />
                <span className="text-[13px] font-medium text-[var(--t1)]">{tr(v.label, v.labelEn)}</span>
                {active && <Check size={12} className="ml-auto text-[var(--accent)]" />}
              </div>
              <p className="mt-1 text-[12px] leading-snug text-[var(--t4)]">{tr(v.blurb, v.blurbEn)}</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                <Tag>{tr(pv, pe)}</Tag>
                <Tag>{v.offline ? tr('Offline được', 'Works offline') : tr('Cần mạng', 'Needs network')}</Tag>
                <Tag>{v.costHint}</Tag>
                {v.aiTiers.length === 0 ? (
                  <Tag warn>{tr('Chưa có nấc toàn cục', 'No global level yet')}</Tag>
                ) : (
                  <Tag>{tr(`Mức ${v.aiTiers.join('·')} ở bộ chọn`, `Level ${v.aiTiers.join('·')} in selector`)}</Tag>
                )}
                {v.providers.map((p) => {
                  const c = configuredOf(p);
                  return (
                    <Tag key={p} warn={c === false}>
                      {PROVIDER_FACTS[p].name}
                      {c === true ? ' ✓' : c === false ? ` · ${tr('chưa cấu hình', 'not configured')}` : ''}
                    </Tag>
                  );
                })}
              </div>
              <details className="mt-1.5">
                <summary className="cursor-pointer text-[11px] text-[var(--t4)]">{tr('Bằng chứng trong code', 'Evidence in code')}</summary>
                <ul className="mt-1 list-disc pl-4 text-[11px] leading-snug text-[var(--t4)]">
                  {v.evidence.map((e) => <li key={e}>{e}</li>)}
                </ul>
              </details>
            </div>
          );
        })}
      </div>

      {/* ── ② nhà cung cấp: năng lực · riêng tư · thay thế ── */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--t4)]">
          {tr('Nhà cung cấp — năng lực & kiểm tra', 'Providers — capabilities & check')}
        </p>
        <button
          type="button"
          onClick={() => void onProbe()}
          disabled={probing}
          className="flex h-7 items-center gap-1.5 rounded-[10px] border border-[var(--border)] px-2.5 text-[11.5px] font-medium text-[var(--t2)] transition-colors hover:bg-[var(--hover)] disabled:opacity-[var(--mo-vo-hieu)]"
        >
          <RefreshCw size={12} className={probing ? 'animate-spin' : ''} />
          {tr('Kiểm tra kết nối', 'Test connection')}
        </button>
      </div>
      {probe && (
        <p className={cn('mt-1.5 text-[11.5px]', probe.ok ? 'text-[var(--t3)]' : 'text-[var(--danger)]')}>
          {probe.ok
            ? tr(`Server trả lời sau ${probe.latencyMs} ms. "Đã cấu hình" = server thấy biến môi trường; chưa thử gọi model thật.`,
                `Server answered in ${probe.latencyMs} ms. "Configured" = server sees the env var; no real model call was made.`)
            : redactSecrets(probe.error ?? tr('Không gọi được /api/health.', 'Could not reach /api/health.'))}
        </p>
      )}
      <div className="mt-2 flex flex-col gap-1.5">
        {(['comfyui', 'sd', 'fal'] as ProviderName[]).map((p) => {
          const f = PROVIDER_FACTS[p];
          const cap = providerCapabilities(p);
          const c = configuredOf(p);
          const open = openProvider === p;
          return (
            <div key={p} className="rounded-[10px] border border-[var(--border)]">
              <button
                type="button"
                onClick={() => setOpenProvider(open ? null : p)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-[var(--hover)]"
              >
                {c === true ? <Wifi size={14} className="text-[var(--success)]" /> : c === false ? <WifiOff size={14} className="text-[var(--warning)]" /> : <Minus size={14} className="text-[var(--t4)]" />}
                <span className="min-w-0 flex-1">
                  <span className="block text-[12.5px] font-medium text-[var(--t1)]">{f.name}</span>
                  <span className="block text-[11px] text-[var(--t4)]">
                    {f.kind === 'workflow-runner' ? tr('máy chạy workflow — không phải một model', 'workflow runner — not a single model') : f.kind === 'cloud-api' ? tr('API cloud', 'cloud API') : tr('server suy luận', 'inference server')}
                    {' · '}{tr(PRIVACY_LABEL[f.privacy][0], PRIVACY_LABEL[f.privacy][1])}{' · '}{f.costHint}
                  </span>
                </span>
                <span className="text-[11px] tabular-nums text-[var(--t4)]">{cap.tasks.length}/{cap.tasks.length + cap.missing.length} {tr('tác vụ', 'tasks')}</span>
              </button>
              {open && (
                <div className="border-t border-[var(--border)] px-3 py-2 text-[11.5px] leading-snug text-[var(--t3)]">
                  <p>
                    <b className="text-[var(--t2)]">{tr('Biến môi trường (server)', 'Env vars (server)')}:</b> {f.envVars.join(', ')}
                    {' — '}{tr('chỉ tên; giá trị không bao giờ về trình duyệt.', 'names only; values never reach the browser.')}
                  </p>
                  <p className="mt-1"><b className="text-[var(--t2)]">{tr('Thay thế', 'Replace')}:</b> {tr(f.replaceHow, f.replaceHowEn)}</p>
                  <p className="mt-1">
                    <b className="text-[var(--t2)]">{tr('Chạy được', 'Supported')}:</b> {cap.tasks.join(', ')}
                    {cap.video ? '' : ` — ${tr('không có video', 'no video')}`}
                  </p>
                  {cap.missing.length > 0 && (
                    <p className="mt-1 text-[var(--warning)]">
                      <b>{tr('Không chạy được (đổi mức)', 'Not available (change level)')}:</b> {cap.missing.join(', ')}
                    </p>
                  )}
                  {cap.workflows.length > 0 && (
                    <p className="mt-1">
                      <b className="text-[var(--t2)]">{tr(`${cap.workflows.length} workflow`, `${cap.workflows.length} workflows`)}:</b> {cap.workflows.join(' · ')}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Tag({ children, warn }: { children: React.ReactNode; warn?: boolean }) {
  return (
    <span
      className={cn(
        'rounded px-1 text-[length:var(--fs-xs)]',
        warn ? 'bg-amber-500/15 text-[var(--warning)]' : 'bg-[var(--hover)] text-[var(--t4)]',
      )}
    >
      {children}
    </span>
  );
}
