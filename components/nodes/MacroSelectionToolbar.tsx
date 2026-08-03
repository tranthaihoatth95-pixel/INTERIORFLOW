'use client';

/**
 * components/nodes/MacroSelectionToolbar.tsx — TRẠNG THÁI ① (`docs/mocks/mock-if-nut-tong.html`
 * màn 01): chọn ≥2 node thật (bỏ sticky note) → hiện pill nổi đáy canvas "Đã chọn N nút" + nút
 * "Gom thành nút tổng" + "Bỏ chọn". Định vị CỐ ĐỊNH giữa-dưới khung canvas (đúng mock — không bám
 * theo bbox vùng chọn, tránh phải tính toạ độ flow→màn hình mỗi lần chọn/kéo).
 */
import { useState } from 'react';
import { Boxes } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { MacroCreateDialog } from '@/components/nodes/MacroCreateDialog';

export function MacroSelectionToolbar() {
  const nodes = useFlowStore((s) => s.nodes);
  const [dialogOpen, setDialogOpen] = useState(false);
  const selectedIds = nodes.filter((n) => n.selected && n.type !== 'note').map((n) => n.id);

  if (selectedIds.length < 2) return null;

  return (
    <>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-4 z-[6] flex justify-center"
        style={{ bottom: 'calc(var(--tap, 44px) + 24px)' }}
      >
        <div className="mat-panel pointer-events-auto flex items-center gap-1 rounded-[14px] border border-[var(--mat-hairline)] p-1 shadow-[var(--shadow-pop)]">
          <span className="flex h-8 items-center px-3 text-[11px] leading-[1.5] text-[var(--t3)]">
            Đã chọn {selectedIds.length} nút
          </span>
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="flex h-8 items-center gap-1.5 rounded-[10px] bg-[var(--accent)] px-3.5 text-[12px] font-semibold leading-[1.5] text-white transition-colors hover:bg-[var(--accent-strong)]"
          >
            <Boxes size={14} />
            Gom thành nút tổng
          </button>
          <button
            type="button"
            onClick={() => useFlowStore.getState().onNodesChange(selectedIds.map((id) => ({ id, type: 'select', selected: false })))}
            className="flex h-8 items-center rounded-[10px] px-3 text-[11px] leading-[1.5] text-[var(--t3)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--t1)]"
          >
            Bỏ chọn
          </button>
        </div>
      </div>
      {dialogOpen && <MacroCreateDialog selectedIds={selectedIds} onClose={() => setDialogOpen(false)} />}
    </>
  );
}
