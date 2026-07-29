'use client';

/**
 * components/settings/AiDependencySettings.tsx — Mức phụ thuộc AI, dời từ Header.tsx
 * (mã 2.2.61, 29/07 — docs/CHOT-SO-MA-2026-07-29.md §D).
 *
 * Đây là CẤU HÌNH TOÀN CỤC (aiTier/oneAiEngine/oneAiRuntime ở store, áp cả 3 chặng),
 * không phải nút thao tác — nên chuyển vào Cài đặt thay vì chiếm ~180px thanh đầu.
 * Logic giữ NGUYÊN 100% so với `AiTierMenu` cũ trong Header.tsx, chỉ đổi lớp trình bày
 * từ popover sang layout tĩnh trong trang.
 */

import { useEffect, useState } from 'react';
import { Check, Cloud, Zap, Cpu, ShieldCheck } from 'lucide-react';
import { checkProviders, type ProviderStatus } from '@/lib/ai/client';
import {
  TIERS, TIER_ORDER, type AiTier, providerForTier,
  type OneAiEngine, ONE_AI_ENGINES, ONE_AI_RUNTIMES,
} from '@/lib/ai/tiers';
import { useFlowStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const TIER_ICON: Record<AiTier, typeof Cloud> = { 4: Cloud, 3: Zap, 2: Cpu, 1: ShieldCheck };

/** null = chưa biết (đang check); true/false = provider của mức đó sẵn sàng chưa. */
function tierAvailable(tier: AiTier, engine: OneAiEngine, status: ProviderStatus | null): boolean | null {
  const p = providerForTier(tier, engine);
  if (!p) return true; // mức 1 luôn "sẵn sàng"
  if (!status) return null;
  return p === 'fal' ? status.fal : p === 'comfyui' ? status.comfyui : status.sd;
}

export function AiDependencySettings() {
  const aiTier = useFlowStore((s) => s.aiTier);
  const setAiTier = useFlowStore((s) => s.setAiTier);
  const oneAiEngine = useFlowStore((s) => s.oneAiEngine);
  const setOneAiEngine = useFlowStore((s) => s.setOneAiEngine);
  const oneAiRuntime = useFlowStore((s) => s.oneAiRuntime);
  const setOneAiRuntime = useFlowStore((s) => s.setOneAiRuntime);
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  const tr = useT();

  useEffect(() => {
    checkProviders().then(setStatus);
  }, []);

  return (
    <section>
      <h2 className="text-[15px] font-semibold text-[var(--t1)]">
        {tr('Mức phụ thuộc AI', 'AI dependency level')}
      </h2>
      <p className="mt-1 text-[12.5px] text-[var(--t3)]">
        {tr(
          'Áp dụng cho cả 3 chặng (Ý tưởng · Render · Present). Đổi ở đây, không đổi trên từng thẻ việc.',
          'Applies to all 3 stages. Change it here, not per task card.',
        )}
      </p>

      <div className="mt-4 flex flex-col gap-2">
        {TIER_ORDER.map((t) => {
          const m = TIERS[t];
          const TI = TIER_ICON[t];
          const a = tierAvailable(t, oneAiEngine, status);
          const active = t === aiTier;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setAiTier(t)}
              className={cn(
                'flex w-full items-start gap-3 rounded-[10px] border px-3 py-2.5 text-left transition-colors',
                active
                  ? 'border-[var(--accent-ring)] bg-[var(--accent-soft)]'
                  : 'border-[var(--border)] hover:bg-[var(--hover)]',
              )}
            >
              <TI size={16} className="mt-0.5 shrink-0 text-[var(--t3)]" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-medium text-[var(--t1)]">{m.name}</span>
                  <span className="rounded bg-[var(--hover)] px-1 text-[length:var(--fs-xs)] text-[var(--t4)]">{m.cost}</span>
                  {a === false && (
                    <span className="rounded bg-amber-500/15 px-1 text-[length:var(--fs-xs)] text-amber-300">{tr('chạy mock', 'mock')}</span>
                  )}
                  {active && <Check size={12} className="ml-auto text-[var(--accent)]" />}
                </div>
                <p className="mt-0.5 text-[12px] leading-snug text-[var(--t4)]">{m.blurb}</p>
              </div>
            </button>
          );
        })}
      </div>

      {aiTier === 2 && (
        <div className="mt-4 border-t border-[var(--border)] pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--t4)]">
            oneAI — Engine
          </p>
          <div className="mt-1.5 flex gap-1.5">
            {ONE_AI_ENGINES.map((e) => {
              const on = e.id === oneAiEngine;
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setOneAiEngine(e.id)}
                  title={e.blurb}
                  className={cn(
                    'flex-1 rounded-[9px] border px-2.5 py-1.5 text-[12.5px] font-medium transition-colors',
                    on
                      ? 'border-[var(--accent-ring)] bg-[var(--accent-soft)] text-[var(--accent)]'
                      : 'border-[var(--border)] text-[var(--t3)] hover:bg-[var(--hover)]',
                  )}
                >
                  {e.name}
                </button>
              );
            })}
          </div>

          {oneAiEngine === 'sd' && (
            <>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--t4)]">
                Runtime
              </p>
              <div className="mt-1.5 flex gap-1.5">
                {ONE_AI_RUNTIMES.map((r) => {
                  const on = r.id === oneAiRuntime;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setOneAiRuntime(r.id)}
                      title={r.blurb}
                      className={cn(
                        'flex-1 rounded-[9px] border px-2.5 py-1.5 text-[12.5px] font-medium transition-colors',
                        on
                          ? 'border-[var(--accent-ring)] bg-[var(--accent-soft)] text-[var(--accent)]'
                          : 'border-[var(--border)] text-[var(--t3)] hover:bg-[var(--hover)]',
                      )}
                    >
                      {r.name}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}

/** Chấm trạng thái nhỏ cho thanh đầu — CHỈ hiện khi mức đang chọn không sẵn sàng (chạy mock). */
export function AiStatusDot() {
  const aiTier = useFlowStore((s) => s.aiTier);
  const oneAiEngine = useFlowStore((s) => s.oneAiEngine);
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  const tr = useT();

  useEffect(() => {
    checkProviders().then(setStatus);
  }, []);

  const avail = tierAvailable(aiTier, oneAiEngine, status);
  if (avail !== false) return null;

  return (
    <a
      href="/settings"
      title={tr(
        `Mức "${TIERS[aiTier].name}" đang chạy mock (provider chưa sẵn sàng) — bấm để mở Cài đặt`,
        `"${TIERS[aiTier].name}" is running mock (provider not ready) — click to open Settings`,
      )}
      className="grid h-2.5 w-2.5 shrink-0 place-items-center rounded-full bg-amber-400"
      aria-label={tr('AI đang chạy mock', 'AI running mock')}
    />
  );
}
