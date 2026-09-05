'use client';

/**
 * components/nodes/GuidedPathPanel.tsx — ĐƯỜNG DẪN CÓ HƯỚNG DẪN trên canvas node (Slice 10, 03/09).
 *
 * Người mới: chọn 1 đường (ảnh → hiểu ảnh → dựng → hồ sơ) → app dựng NGUYÊN chuỗi node thật + dây
 * đúng hợp đồng, gói thành MỘT nút tổng ĐANG MỞ (thấy đủ node, thu lại nếu muốn). Người thạo: sửa
 * từng node như thường — không có node giả, không có "engine" thứ hai.
 *
 * ── DÙNG LẠI (luật B25) ─────────────────────────────────────────────────────────────────────
 *  · Dựng: `useFlowStore.setState` + `nextId`/`edgeStyleFor` (store) + `defaultParams` (registry)
 *    — cùng khuôn `loadDemoFlow()` dựng demo. `snapshot()` trước ⇒ Hoàn tác (⌘Z) trả lại y nguyên.
 *  · Gói: `addGroup({ isMacro:true, collapsed:false })` — mặt nút tổng (`MacroNodeFace`) đã có.
 *  · Chạy: `runNode()` (`lib/execution.ts`) cho node cuối — hàng đợi, cache-skip, hoàn credit.
 *  · Huỷ: `requestCancelFlowRun()` — dừng ở ranh giới node kế tiếp (không cắt giữa 1 lời gọi API).
 *  · Nguồn gốc: `deriveProvenance()` đọc `_tier`/mock — mock KHÔNG được hiện như kết quả thật.
 */
import { useMemo, useState } from 'react';
import { Play, RotateCcw, Square, Undo2, CircleCheck, CircleAlert, Loader2, Circle, ChevronDown, ChevronRight, Route } from 'lucide-react';
import { useFlowStore, nextId, edgeStyleFor, type FlowNode, type NodeGroup } from '@/lib/store';
import { getDefinition, defaultParams } from '@/lib/nodes/registry';
import { runNode } from '@/lib/execution';
import { GUIDED_PATHS, planGuidedPath, pathReadiness, planTerminals, type GuidedPath, type GuidedPlan } from '@/lib/nodes/guided-paths';
import { FAMILY_META, familyColor, familyOf } from '@/lib/nodes/families';
import { deriveProvenance, type Provenance } from '@/lib/nodes/provenance';
import { terminalNodeIds } from '@/lib/nodes/macro';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/* ═══════════════════════════ dựng đường dẫn vào flow ═══════════════════════════ */

/** Góc trên-trái vùng trống bên phải các node đang có — không đè lên việc đang làm. */
function freeOrigin(nodes: FlowNode[]): { x: number; y: number } {
  if (!nodes.length) return { x: 80, y: 80 };
  const maxX = Math.max(...nodes.map((n) => n.position.x));
  const minY = Math.min(...nodes.map((n) => n.position.y));
  return { x: maxX + 360, y: minY };
}

/** Dựng plan thành node/edge THẬT + 1 nút tổng mở. Trả id nhóm (để "Hoàn tác" ngay sau đó). */
export function buildGuidedPath(path: GuidedPath, plan: GuidedPlan): string {
  const store = useFlowStore.getState();
  store.snapshot();
  const idOf = new Map<string, string>();
  const nodes: FlowNode[] = plan.nodes.map((p) => {
    const id = nextId('node');
    idOf.set(p.key, id);
    const def = getDefinition(p.defType);
    return {
      id,
      type: 'interior',
      position: p.position,
      data: { defType: p.defType, params: { ...defaultParams(def), ...p.params }, run: { status: 'idle', progress: 0 } },
    };
  });
  const edges = plan.edges.map((e) => ({
    id: nextId('edge'),
    source: idOf.get(e.fromKey)!,
    sourceHandle: e.fromHandle,
    target: idOf.get(e.toKey)!,
    targetHandle: e.toHandle,
    style: edgeStyleFor(e.dataType),
    animated: false,
  }));
  useFlowStore.setState((s) => ({ nodes: [...s.nodes, ...nodes], edges: [...s.edges, ...edges] }));

  const cx = nodes.reduce((a, n) => a + n.position.x, 0) / nodes.length;
  const cy = nodes.reduce((a, n) => a + n.position.y, 0) / nodes.length;
  const exposedParams = path.steps.flatMap((s) =>
    (s.expose ?? []).map((paramId) => {
      const def = getDefinition(s.defType);
      const label = def.params.find((p) => p.id === paramId)?.label ?? paramId;
      return { nodeId: idOf.get(s.key)!, paramId, label: `${def.title} · ${label}` };
    }),
  );
  const groupId = nextId('grp');
  const group: NodeGroup = {
    id: groupId,
    label: path.label,
    description: path.blurb,
    icon: path.icon,
    nodeIds: nodes.map((n) => n.id),
    collapsed: false,
    center: { x: cx, y: cy },
    isMacro: true,
    exposedParams,
    boundaryInputs: [],
    boundaryOutputs: [],
    usageCount: 0,
  };
  // addGroup() tự snapshot() thêm 1 lần — 2 mốc undo liền nhau (node rồi nhóm); ⌘Z 2 lần là sạch.
  // Hoàn tác trong panel gọi undo() 2 lần cho đúng.
  useFlowStore.getState().addGroup(group);
  return groupId;
}

/* ═══════════════════════════ chip họ · chip nguồn gốc ═══════════════════════════ */

function FamilyChip({ defType }: { defType: string }) {
  const tr = useT();
  const f = familyOf(defType);
  const m = FAMILY_META[f];
  return (
    <span
      className="inline-flex h-[18px] items-center gap-1 rounded-[6px] px-1.5 text-[10px] font-semibold leading-none text-[var(--t2)]"
      style={{ background: 'var(--field)' }}
      title={tr(m.blurb, m.blurbEn)}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: familyColor(f) }} />
      {tr(m.label, m.labelEn)}
    </span>
  );
}

function ProvenanceChip({ p }: { p: Provenance }) {
  const tr = useT();
  if (p.kind === 'none') return null;
  const tone =
    p.kind === 'mock' ? 'text-[var(--warning)] border-[var(--warning)]'
    : p.kind === 'ai' || p.kind === 'ai-unlabelled' ? 'text-[var(--accent)] border-[var(--accent-ring)]'
    : 'text-[var(--t3)] border-[var(--vien-mo)]';
  return (
    <span
      className={cn('inline-flex h-[18px] items-center rounded-[6px] border px-1.5 text-[10px] font-medium leading-none', tone)}
      title={p.detail ?? tr(p.label, p.labelEn)}
    >
      {tr(p.label, p.labelEn)}{p.cached ? ' · cache' : ''}
    </span>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'running' || status === 'queued') return <Loader2 size={14} className="animate-spin text-[var(--accent)]" />;
  if (status === 'done') return <CircleCheck size={14} className="text-[var(--success)]" />;
  if (status === 'error') return <CircleAlert size={14} className="text-[var(--danger)]" />;
  return <Circle size={14} className="text-[var(--t4)]" />;
}

/* ═══════════════════════════ danh sách đường dẫn (người mới) ═══════════════════════════ */

export function GuidedPathList({ onBuilt }: { onBuilt: (groupId: string) => void }) {
  const tr = useT();
  const aiTier = useFlowStore((s) => s.aiTier);
  const nodesCount = useFlowStore((s) => s.nodes.length);
  const [open, setOpen] = useState<string | null>(null);

  const plans = useMemo(
    () => GUIDED_PATHS.map((p) => ({ path: p, plan: planGuidedPath(p, getDefinition) })),
    [],
  );

  const build = (path: GuidedPath, plan: GuidedPlan) => {
    if (plan.issues.length) {
      useFlowStore.getState().setConnectError(plan.issues[0]);
      return;
    }
    const origin = freeOrigin(useFlowStore.getState().nodes);
    const rel = planGuidedPath(path, getDefinition, origin);
    const groupId = buildGuidedPath(path, rel);
    useFlowStore.getState().setNotice(
      tr(`Đã dựng "${path.label}" — ${rel.nodes.length} khối, ${rel.creditTotal} credit. ⌘Z để hoàn tác.`,
        `Built "${path.labelEn}" — ${rel.nodes.length} blocks, ${rel.creditTotal} credits. ⌘Z to undo.`),
    );
    onBuilt(groupId);
  };

  return (
    <div className="py-1">
      {plans.map(({ path, plan }) => {
        const ready = pathReadiness(plan, aiTier);
        const isOpen = open === path.id;
        return (
          <div key={path.id} className="border-b border-[var(--border)] last:border-b-0">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : path.id)}
              className="flex w-full items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-[var(--hover)]"
            >
              {isOpen ? <ChevronDown size={14} className="mt-0.5 flex-none text-[var(--t4)]" /> : <ChevronRight size={14} className="mt-0.5 flex-none text-[var(--t4)]" />}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-semibold leading-[1.5] text-[var(--t1)]">{tr(path.label, path.labelEn)}</span>
                <span className="block text-[10px] leading-[1.5] text-[var(--t4)]">
                  {plan.nodes.length} {tr('khối', 'blocks')} · {plan.creditTotal === 0 ? tr('0 credit · không AI', '0 credit · no AI') : tr(`${plan.creditTotal} credit · ${plan.aiSteps} bước AI`, `${plan.creditTotal} credits · ${plan.aiSteps} AI steps`)}
                </span>
              </span>
            </button>
            {isOpen && (
              <div className="px-3 pb-2.5">
                <p className="text-[11px] leading-snug text-[var(--t3)]">{tr(path.blurb, path.blurbEn)}</p>
                <ol className="mt-1.5 flex flex-col gap-1">
                  {path.steps.map((s, i) => (
                    <li key={s.key} className="flex items-start gap-1.5 text-[10.5px] leading-snug text-[var(--t2)]">
                      <span className="w-3 flex-none text-right tabular-nums text-[var(--t4)]">{i + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className="font-medium text-[var(--t1)]">{getDefinition(s.defType).title}</span>
                        {' — '}{tr(s.why, s.whyEn)}
                      </span>
                      <FamilyChip defType={s.defType} />
                    </li>
                  ))}
                </ol>
                <p className="mt-1.5 text-[10.5px] text-[var(--t3)]">→ {tr(path.output, path.outputEn)}</p>
                {!ready.ok && (
                  <p className="mt-1.5 rounded-[8px] bg-[var(--field)] px-2 py-1 text-[10.5px] leading-snug text-[var(--warning)]">
                    {tr(ready.reason ?? '', ready.reasonEn ?? '')}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => build(path, plan)}
                  className="mt-2 flex h-8 w-full items-center justify-center gap-1.5 rounded-[10px] bg-[var(--accent)] text-[11.5px] font-semibold text-white transition-opacity hover:opacity-90"
                >
                  <Route size={14} /> {tr(nodesCount ? 'Dựng cạnh khối đang có' : 'Dựng lên bảng', nodesCount ? 'Build next to current blocks' : 'Build on canvas')}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════ từng bước của 1 nút tổng (trạng thái · nguồn gốc · sửa lỗi) ═══════════════════════════ */

export function MacroStepList({ group, justBuilt, onUndoBuilt }: { group: NodeGroup; justBuilt: boolean; onUndoBuilt: () => void }) {
  const tr = useT();
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const flowRuns = useFlowStore((s) => s.flowRuns);
  const aiTier = useFlowStore((s) => s.aiTier);
  const requestCancelFlowRun = useFlowStore((s) => s.requestCancelFlowRun);
  const bumpGroupUsage = useFlowStore((s) => s.bumpGroupUsage);

  const members = group.nodeIds
    .map((id) => nodes.find((n) => n.id === id))
    .filter((n): n is FlowNode => Boolean(n) && n?.type === 'interior');
  // thứ tự hiển thị = thứ tự topo trong nhóm (nguồn trước, đích sau) — đọc như một danh sách bước
  const ordered = useMemo(() => {
    const ids = new Set(members.map((m) => m.id));
    const depth = new Map<string, number>();
    const d = (id: string, seen = new Set<string>()): number => {
      if (depth.has(id)) return depth.get(id)!;
      if (seen.has(id)) return 0;
      seen.add(id);
      const ins = edges.filter((e) => e.target === id && ids.has(e.source));
      const v = ins.length ? Math.max(...ins.map((e) => d(e.source, seen))) + 1 : 0;
      depth.set(id, v);
      return v;
    };
    return [...members].sort((a, b) => d(a.id) - d(b.id));
  }, [members, edges]);

  const busy = members.some((m) => m.data.run.status === 'running' || m.data.run.status === 'queued');
  const activeRun = flowRuns.find((r) => (r.status === 'running' || r.status === 'queued') && r.nodeIds.some((id) => group.nodeIds.includes(id)));
  const aiCost = members.reduce((a, m) => a + getDefinition(m.data.defType).creditCost, 0);
  const lockedByTier = aiTier === 1 && aiCost > 0;

  const run = async () => {
    if (busy || lockedByTier) return;
    try {
      for (const id of terminalNodeIds(group.nodeIds, edges)) await runNode(id);
      bumpGroupUsage(group.id);
    } catch (err) {
      useFlowStore.getState().setConnectError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="px-3 pb-2">
      <ol className="flex flex-col gap-1">
        {ordered.map((n, i) => {
          const def = getDefinition(n.data.defType);
          const prov = deriveProvenance({ run: n.data.run, creditCost: def.creditCost });
          const st = n.data.run.status;
          return (
            <li key={n.id} className="rounded-[8px] px-1.5 py-1 hover:bg-[var(--hover)]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 flex-none text-right text-[10px] tabular-nums text-[var(--t4)]">{i + 1}</span>
                <StatusIcon status={st} />
                <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-[var(--t1)]" title={def.description}>{def.title}</span>
                <ProvenanceChip p={prov} />
                {st === 'error' && (
                  <button
                    type="button"
                    onClick={() => void runNode(n.id)}
                    title={tr('Chạy lại khối này (kèm khối nguồn)', 'Retry this block (with sources)')}
                    className="flex h-5 w-5 flex-none items-center justify-center rounded-[6px] text-[var(--danger)] hover:bg-[var(--field)]"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
              </div>
              {st === 'running' && (
                <div className="ml-[22px] mt-1 h-1 overflow-hidden rounded-full bg-[var(--field)]">
                  <div className="h-full bg-[var(--accent)] transition-[width]" style={{ width: `${Math.round(n.data.run.progress * 100)}%` }} />
                </div>
              )}
              {st === 'error' && n.data.run.error && (
                <p className="ml-[22px] mt-0.5 text-[10px] leading-snug text-[var(--danger)]">{n.data.run.error}</p>
              )}
            </li>
          );
        })}
      </ol>
      {lockedByTier && (
        <p className="mt-1.5 rounded-[8px] bg-[var(--field)] px-2 py-1 text-[10.5px] leading-snug text-[var(--warning)]">
          {tr('Mức "Không AI" khoá các bước tốn credit — đổi mức AI ở Cài đặt để chạy.', '"No AI" tier locks credit steps — change the tier in Settings to run.')}
        </p>
      )}
      <div className="mt-2 flex items-center gap-1.5">
        {busy && activeRun ? (
          <button
            type="button"
            onClick={() => requestCancelFlowRun(activeRun.id)}
            className="flex h-7 flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-[var(--vien-mo)] text-[11px] font-semibold text-[var(--t1)] hover:bg-[var(--hover)]"
          >
            <Square size={14} /> {tr('Huỷ (dừng ở khối kế)', 'Cancel (stops at next block)')}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void run()}
            disabled={busy || lockedByTier}
            aria-disabled={busy || lockedByTier}
            title={lockedByTier ? tr('Bị khoá ở mức Không AI', 'Locked at No-AI tier') : tr('Chạy các khối cuối (kèm nguồn) — khối không đổi sẽ dùng lại kết quả, không tốn credit', 'Run terminal blocks (with sources) — unchanged blocks reuse results, no credit')}
            className="flex h-7 flex-1 items-center justify-center gap-1.5 rounded-[10px] bg-[var(--accent)] text-[11px] font-semibold text-white disabled:opacity-[var(--mo-vo-hieu)]"
          >
            <Play size={14} /> {tr(`Chạy · ${aiCost} credit`, `Run · ${aiCost} credits`)}
          </button>
        )}
        {justBuilt && (
          <button
            type="button"
            onClick={onUndoBuilt}
            title={tr('Gỡ chuỗi vừa dựng (hoàn tác)', 'Remove the chain just built (undo)')}
            className="flex h-7 w-7 flex-none items-center justify-center rounded-[10px] border border-[var(--vien-mo)] text-[var(--t2)] hover:bg-[var(--hover)]"
          >
            <Undo2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
