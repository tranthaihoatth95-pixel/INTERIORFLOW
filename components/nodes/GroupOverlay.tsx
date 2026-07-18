/**
 * components/nodes/GroupOverlay.tsx — Hiển thị nhóm node (group) trên canvas.
 *
 * Mỗi group vẽ 1 khung bao quanh các node thành viên, có label + nút collapse/expand/ungroup.
 * Khi collapse: khung thu nhỏ thành 1 badge tại tâm group.
 * Overlay được bọc trong <ViewportPortal> của React Flow — nhờ vậy nó dùng
 * TRỰC TIẾP toạ độ flow-space (giống node/edge) và tự động ăn theo pan/zoom
 * của viewport, không cần tự tính transform tay.
 */
'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { ViewportPortal } from '@xyflow/react';
import { useFlowStore, type NodeGroup } from '@/lib/store';

const PAD = 24;
const LABEL_H = 28;

function GroupRect({ group }: { group: NodeGroup }) {
  const nodes = useFlowStore((s) => s.nodes);
  const ungroupById = useFlowStore((s) => s.ungroupById);
  const renameGroup = useFlowStore((s) => s.renameGroup);
  const toggleGroupCollapse = useFlowStore((s) => s.toggleGroupCollapse);
  const [editing, setEditing] = useState(false);

  const members = useMemo(
    () => nodes.filter((n) => group.nodeIds.includes(n.id)),
    [nodes, group.nodeIds],
  );

  if (group.collapsed) {
    // Collapsed badge tại vị trí tâm đã lưu
    const cx = group.center?.x ?? 0;
    const cy = group.center?.y ?? 0;
    return (
      <div
        className="absolute flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 shadow-lg"
        style={{
          transform: `translate(${cx - 60}px, ${cy - 16}px)`,
          zIndex: 5,
          fontFamily: 'ui-monospace, "SF Mono", "Cascadia Code", "Fira Code", monospace',
        }}
      >
        <button
          className="nodrag grid h-5 w-5 place-items-center rounded text-[var(--t3)] hover:bg-[var(--hover)]"
          onClick={() => toggleGroupCollapse(group.id)}
          title="Mở rộng group"
        >
          <ChevronRight size={12} />
        </button>
        <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--t2)]">
          {group.label}
        </span>
        <span className="text-[9px] text-[var(--t4)]">({group.nodeIds.length})</span>
      </div>
    );
  }

  if (!members.length) return null;

  // Bounding box bao quanh các node (tính cả kích thước node ~256x120)
  const NODE_W = 256;
  const NODE_H = 120;
  const minX = Math.min(...members.map((n) => n.position.x)) - PAD;
  const minY = Math.min(...members.map((n) => n.position.y)) - PAD - LABEL_H;
  const maxX = Math.max(...members.map((n) => n.position.x + NODE_W)) + PAD;
  const maxY = Math.max(...members.map((n) => n.position.y + NODE_H)) + PAD;

  return (
    <div
      className="absolute rounded-xl border border-dashed border-[var(--accent-ring)]/40 bg-[var(--accent)]/[0.04]"
      style={{
        left: minX,
        top: minY,
        width: maxX - minX,
        height: maxY - minY,
        pointerEvents: 'none',
        zIndex: 5,
      }}
    >
      {/* Label bar — pointer-events on */}
      <div
        className="absolute -top-0.5 left-0 right-0 flex items-center gap-1.5 rounded-t-xl px-3 py-1"
        style={{
          pointerEvents: 'auto',
          fontFamily: 'ui-monospace, "SF Mono", "Cascadia Code", "Fira Code", monospace',
        }}
      >
        <button
          className="nodrag grid h-5 w-5 place-items-center rounded text-[var(--t3)] hover:bg-[var(--hover)]"
          onClick={() => toggleGroupCollapse(group.id)}
          title="Thu gọn group"
        >
          <ChevronDown size={12} />
        </button>
        {editing ? (
          <input
            autoFocus
            className="nodrag w-24 rounded border border-[var(--border)] bg-[var(--field)] px-1 py-0.5 text-[10px] text-[var(--t1)] outline-none"
            defaultValue={group.label}
            onBlur={(e) => {
              renameGroup(group.id, e.target.value || group.label);
              setEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
          />
        ) : (
          <span
            className="cursor-text text-[10px] font-medium uppercase tracking-wider text-[var(--t2)]"
            onDoubleClick={() => setEditing(true)}
            title="Double-click to rename"
          >
            {group.label}
          </span>
        )}
        <span className="text-[9px] text-[var(--t4)]">{group.nodeIds.length} node</span>
        <button
          className="nodrag ml-auto grid h-5 w-5 place-items-center rounded text-[var(--t4)] hover:bg-red-500/15 hover:text-red-400"
          onClick={() => ungroupById(group.id)}
          title="Gỡ group"
        >
          <X size={11} />
        </button>
      </div>
    </div>
  );
}

/** Render tất cả group overlay, bọc trong ViewportPortal để ăn theo pan/zoom. */
export function GroupOverlay() {
  const groups = useFlowStore((s) => s.groups);
  if (!groups.length) return null;
  return (
    <ViewportPortal>
      {groups.map((g) => (
        <GroupRect key={g.id} group={g} />
      ))}
    </ViewportPortal>
  );
}
