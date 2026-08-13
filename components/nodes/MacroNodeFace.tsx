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
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, typeof Box> = { box: Box, sun: CircleDot, layers: LayersIcon, sparkle: Sparkle, grid: Grid3x3 };

/**
 * HÀNG THAM SỐ TRÊN MẶT NÚT TỔNG — port `docs/mocks/Nút tổng.dc.html` màn 03 (dòng 313-342).
 *
 * Vì sao KHÔNG dùng tiếp `ParamField` (`InteriorNode.tsx`) như trước: `ParamField` xếp nhãn IN HOA
 * 10px NẰM TRÊN + control tràn ngang — đúng cho node thường (rộng 256px, mỗi node vài tham số),
 * nhưng mặt nút tổng gom tham số của NHIỀU node con nên cao gấp đôi mock và 4 tham số đã tràn khỏi
 * khung 300px. Mock xếp NGANG: nhãn cố định 96px bên trái · control bên phải · hàng cao đúng 30px.
 *
 * KHÔNG sửa `ParamField` mà viết hàng riêng tại đây: hai bề mặt có ràng buộc khác nhau (node thường
 * cần chỗ cho textarea/nút mở modal), sửa chung sẽ kéo theo cả canvas node thường.
 *
 * 4 kiểu tham số mở modal (`image`/`mask`/`annotate`/`sketch`/`smartmask`/`corners`) KHÔNG có hàng
 * ngang trong mock — chúng cần nút bấm mở cửa sổ, nhét vào ô 28px là bấm hụt. Những kiểu đó rơi về
 * `ParamField` cũ, KHÔNG bịa bố cục mock chưa vẽ.
 */
function MacroParamRow({ nodeId, param, value }: { nodeId: string; param: ParamDef; value: string | number }) {
  const updateParam = useFlowStore((s) => s.updateParam);

  if (param.kind !== 'text' && param.kind !== 'select' && param.kind !== 'slider') {
    return <ParamField nodeId={nodeId} param={param} value={value} />;
  }

  return (
    <div className="flex h-[30px] items-center gap-2.5">
      <span className="w-24 flex-none truncate text-[11px] leading-[1.5] text-[var(--t4)]" title={param.label}>
        {param.label}
      </span>

      {param.kind === 'slider' &&
        (() => {
          // node cũ (autosave) có thể thiếu param mới → value undefined → NaN. Fallback về default,
          // cùng cách `ParamField` đã xử lý — không để hàng hiện "NaN".
          const sv = value == null || Number.isNaN(Number(value)) ? param.default : Number(value);
          /* "tối đa N" (mock dòng 340) chỉ hiện với thang ĐẾM (bước nguyên ≥1: số ảnh, số bản…).
             Thang liên tục (0.05 · 0.1 …) thì trần là con số vô nghĩa với người dùng, mock cũng
             không ghi ở hàng "Độ đậm nét vẽ". Một luật, đọc thẳng từ `param.step`, không bảng cứng. */
          const isCount = Number.isInteger(param.step) && param.step >= 1;
          return (
            <>
              <input
                type="range"
                className="nodrag h-1 min-w-0 flex-1 accent-[var(--accent)]"
                min={param.min}
                max={param.max}
                step={param.step}
                value={sv}
                onChange={(e) => updateParam(nodeId, param.id, Number(e.target.value))}
              />
              <span className="w-[30px] flex-none text-right font-mono text-[11px] leading-[1.45] text-[var(--t2)]">
                {isCount ? sv : sv.toFixed(2)}
              </span>
              {isCount && (
                <span className="flex-none text-[10px] leading-[1.5] text-[var(--t5)]">
                  {`tối đa ${param.max}`}
                </span>
              )}
            </>
          );
        })()}

      {param.kind === 'select' && (
        <select
          className="nodrag h-7 min-w-0 flex-1 rounded-[10px] border-0 bg-[var(--field)] px-2.5 text-[11px] leading-[1.5] text-[var(--t1)] outline-none"
          value={String(value)}
          onChange={(e) => updateParam(nodeId, param.id, e.target.value)}
        >
          {param.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      )}

      {param.kind === 'text' && (
        <input
          className="nodrag h-7 min-w-0 flex-1 rounded-[10px] border-0 bg-[var(--field)] px-2.5 text-[11px] leading-[1.5] text-[var(--t1)] placeholder-[var(--t5)] outline-none"
          placeholder={param.placeholder}
          value={String(value)}
          onChange={(e) => updateParam(nodeId, param.id, e.target.value)}
        />
      )}
    </div>
  );
}

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
  /* Quầng thở `nt-halo` (`docs/mocks/Nút tổng.dc.html`, xem `.nt-macro-halo` trong globals.css).
     Thu gọn thì không thấy được node con chạy tới đâu — quầng này là tín hiệu DUY NHẤT còn lại. */
  const busy = nodes.some(
    (n) => group.nodeIds.includes(n.id) && ((n.data as { run?: { status?: string } }).run?.status === 'running' || (n.data as { run?: { status?: string } }).run?.status === 'queued'),
  );

  const run = async () => {
    // Chặn bấm lặp: `disabled={busy}` dưới nút đã khoá phần lớn, đây là lớp phòng thủ thứ hai
    // cho khoảng hở giữa lúc bấm và lúc React re-render cập nhật `busy` (G-M20-04).
    if (busy) return;
    try {
      const terminals = terminalNodeIds(group.nodeIds, edges);
      for (const id of terminals) {
        // Tuần tự, không Promise.all — các nhánh có thể chia sẻ node upstream, chạy song song sẽ
        // gọi runNode() trùng lặp trên cùng node đó (đua ghi run-state).
        await runNode(id);
      }
      bumpGroupUsage(group.id);
    } catch (err) {
      // Trước: lỗi đồng bộ (vd getDefinition ném lỗi trước khi kịp enqueue) rơi thành unhandled
      // rejection — không ai biết, bumpGroupUsage không chạy, nút vẫn im lặng (G-M20-04). Dùng
      // ĐÚNG kênh báo lỗi đã có của canvas (connectError, FlowCanvas.tsx:880), không tự chế toast.
      useFlowStore.getState().setConnectError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div
      className={cn(
        'nodrag mat-card absolute w-[300px] overflow-hidden rounded-[20px] border-[1.5px] border-[var(--accent)] shadow-[var(--shadow-pop),0_0_0_5px_var(--accent-soft)]',
        busy && 'nt-macro-halo glass-gradient-run',
      )}
      style={{ transform: `translate(${cx - 150}px, ${cy - 60}px)`, zIndex: 5, pointerEvents: 'auto' }}
    >
      <div className="flex h-11 items-center gap-2.5 border-b border-[var(--mat-hairline)] px-3">
        <span className="flex h-7 w-7 flex-none items-center justify-center rounded-[10px] bg-[var(--accent-soft)]">
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
          className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-[10px] border border-[var(--mat-hairline)] bg-[var(--card)] text-[var(--t2)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--t1)]"
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
              <MacroParamRow
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
          disabled={busy}
          title={busy ? tr('Đang chạy…', 'Running…') : undefined}
          /* `--on-accent` thay `text-white`: mock ghi #fff nhưng app đã có token cho đúng
             việc này (chữ trên nền accent) — L4 cấm hex tự chế, kể cả #fff.
             `disabled:opacity-60 disabled:cursor-not-allowed`: khoá bấm-lặp (G-M20-04) — quầng
             `nt-macro-halo` ở thẻ báo "đang chạy" nhưng bản thân nút vẫn nhận click trước đây. */
          className="mt-0.5 h-8 rounded-[10px] bg-[var(--accent)] text-[12px] font-semibold leading-[1.5] text-[var(--on-accent)] transition-colors hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[var(--accent)]"
        >
          {busy ? tr('Đang chạy…', 'Running…') : tr('Chạy nút tổng', 'Run macro node')}
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
