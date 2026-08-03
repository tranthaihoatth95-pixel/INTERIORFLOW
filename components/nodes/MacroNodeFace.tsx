'use client';

/**
 * components/nodes/MacroNodeFace.tsx — TRẠNG THÁI ③ (`docs/mocks/mock-if-nut-tong.html` màn 03):
 * mặt nút tổng lúc THU GỌN — chỉ hiện `group.exposedParams`, nút "Mở ra xem bên trong" + "Chạy
 * nút tổng". Được `GroupOverlay.tsx` mount THAY cho badge nhỏ khi `group.isMacro && collapsed`.
 *
 * Tham số đọc/ghi THẲNG vào node con thật qua `updateParam()` — không giữ bản sao giá trị, nên
 * không bao giờ lệch với node con lúc mở ra xem bên trong (một nguồn, đúng luật K1 nền tảng).
 *
 * Chấm cổng biên (`boundaryInputs`/`boundaryOutputs`) chỉ TRANG TRÍ — báo có bao nhiêu dây nối
 * xuyên biên lúc tạo, KHÔNG phải Handle kéo-nối được khi đang thu gọn (muốn nối lại phải mở ra
 * xem bên trong). Xem báo cáo phiên về giới hạn này.
 */
import { Box, CircleDot, Layers as LayersIcon, Sparkle, Grid3x3, Maximize2 } from 'lucide-react';
import { useFlowStore, type NodeGroup } from '@/lib/store';
import { runNode } from '@/lib/execution';
import { getDefinition } from '@/lib/nodes/registry';
import { terminalNodeIds, totalCreditCost } from '@/lib/nodes/macro';
import { ParamField } from '@/components/nodes/InteriorNode';
import { DATA_TYPE_COLORS, type ParamDef } from '@/lib/types';
import { useT } from '@/lib/i18n';

const ICON_MAP: Record<string, typeof Box> = { box: Box, sun: CircleDot, layers: LayersIcon, sparkle: Sparkle, grid: Grid3x3 };

export function MacroNodeFace({ group }: { group: NodeGroup }) {
  const tr = useT();
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const toggleGroupCollapse = useFlowStore((s) => s.toggleGroupCollapse);
  const bumpGroupUsage = useFlowStore((s) => s.bumpGroupUsage);

  const cx = group.center?.x ?? 0;
  const cy = group.center?.y ?? 0;
  const Icon = ICON_MAP[group.icon ?? ''] ?? Box;
  const credit = totalCreditCost(nodes, group.nodeIds, getDefinition);
  const exposed = group.exposedParams ?? [];

  const run = async () => {
    const terminals = terminalNodeIds(group.nodeIds, edges);
    for (const id of terminals) {
      // Tuần tự, không Promise.all — các nhánh có thể chia sẻ node upstream, chạy song song sẽ
      // gọi runNode() trùng lặp trên cùng node đó (đua ghi run-state).
      await runNode(id);
    }
    bumpGroupUsage(group.id);
  };

  return (
    <div
      className="nodrag mat-card absolute w-[300px] overflow-hidden rounded-[20px] border-[1.5px] border-[var(--accent)] shadow-[var(--shadow-pop),0_0_0_5px_var(--accent-soft)]"
      style={{ transform: `translate(${cx - 150}px, ${cy - 60}px)`, zIndex: 5, pointerEvents: 'auto' }}
    >
      <div className="flex h-11 items-center gap-2.5 border-b border-[var(--mat-hairline)] px-3">
        <span className="flex h-7 w-7 flex-none items-center justify-center rounded-[9px] bg-[var(--accent-soft)]">
          <Icon size={16} className="text-[var(--accent)]" />
        </span>
        <span className="min-w-0 flex-1" title={group.description}>
          <span className="block truncate text-[13px] font-semibold leading-[1.5] text-[var(--t1)]">{group.label}</span>
          <span className="block truncate text-[10px] leading-[1.5] text-[var(--t4)]">
            {tr(`${group.nodeIds.length} nút bên trong · ${credit} credit`, `${group.nodeIds.length} nodes inside · ${credit} credit`)}
          </span>
        </span>
        <button
          type="button"
          onClick={() => toggleGroupCollapse(group.id)}
          title={tr('Mở ra xem bên trong', 'Open to view inside')}
          className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-[8px] border border-[var(--mat-hairline)] bg-[var(--card)] text-[var(--t2)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--t1)]"
        >
          <Maximize2 size={13} />
        </button>
      </div>

      <div className="flex flex-col gap-2 p-3">
        {exposed.length === 0 ? (
          <p className="px-1 py-2 text-center text-[11px] leading-relaxed text-[var(--t5)]">
            {tr('Chưa chọn tham số nào để hiện ra ngoài.', 'No parameters exposed yet.')}
          </p>
        ) : (
          exposed.map((ep) => {
            const child = nodes.find((n) => n.id === ep.nodeId);
            if (!child) return null;
            const defType = (child.data as { defType: string }).defType;
            let param: ParamDef | undefined;
            try {
              param = getDefinition(defType).params.find((p) => p.id === ep.paramId);
            } catch {
              param = undefined;
            }
            if (!param) return null;
            const value = (child.data as { params: Record<string, string | number> }).params[ep.paramId] ?? '';
            return (
              <ParamField
                key={`${ep.nodeId}.${ep.paramId}`}
                nodeId={ep.nodeId}
                param={{ ...param, label: ep.label } as ParamDef}
                value={value}
              />
            );
          })
        )}
        <button
          type="button"
          onClick={run}
          className="mt-0.5 h-8 rounded-[10px] bg-[var(--accent)] text-[12px] font-semibold leading-[1.5] text-white transition-colors hover:bg-[var(--accent-strong)]"
        >
          {tr('Chạy nút tổng', 'Run macro node')}
        </button>
      </div>

      {/* Chấm cổng biên — trang trí (xem cảnh báo đầu file). */}
      {(group.boundaryInputs ?? []).map((p, i) => (
        <span
          key={p.portId}
          className="absolute h-3 w-3 rounded-full border-2 border-[var(--bg)]"
          style={{ left: -6, top: 44 + i * 16, background: DATA_TYPE_COLORS[p.dataType] }}
        />
      ))}
      {(group.boundaryOutputs ?? []).map((p, i) => (
        <span
          key={p.portId}
          className="absolute h-3 w-3 rounded-full border-2 border-[var(--bg)]"
          style={{ right: -6, top: 44 + i * 16, background: DATA_TYPE_COLORS[p.dataType] }}
        />
      ))}
    </div>
  );
}
