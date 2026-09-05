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
import { ChevronDown, ChevronRight, X, Box, CircleDot, Layers as LayersIcon, Sparkle, Grid3x3, Minimize2 } from 'lucide-react';
import { ViewportPortal } from '@xyflow/react';
import { useFlowStore, type NodeGroup } from '@/lib/store';
import { MacroNodeFace } from '@/components/nodes/MacroNodeFace';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const MACRO_ICON_MAP: Record<string, typeof Box> = { box: Box, sun: CircleDot, layers: LayersIcon, sparkle: Sparkle, grid: Grid3x3 };

const PAD = 24;
const LABEL_H = 28;
/** G2 phần (1) — gợi ý tên phòng cho khung phòng (SPEC-CHANG2-UI-2MODE §3 "gom mood theo phòng
 * khách/bếp/master") — datalist trên input đổi tên CÓ SẴN, không viết popover chọn riêng. */
const ROOM_NAME_PRESETS = ['Phòng khách', 'Bếp', 'Phòng ngủ', 'Phòng tắm', 'Phòng làm việc', 'Sân vườn', 'Ban công'];

/** NÚT TỔNG mở ra xem bên trong (state ④ `mock-if-nut-tong.html`) — nền ĐẶC `var(--panel)`
 * (KHÔNG `mat-*`/backdrop blur: mock ghi rõ "để không có kính lồng kính" — chính node con bên
 * trong đã dùng `nen-mo-card` kính riêng, khung cha kính nữa sẽ chồng kính lên kính). Header 44px
 * pointer-events auto (icon/tên/"Thu gọn lại"), phần thân `pointerEvents:none` (không chặn kéo/
 * chọn node con render đè lên trên bởi lớp node bình thường của React Flow). */
function MacroExpandedFrame({
  group,
  minX,
  minY,
  maxX,
  maxY,
}: {
  group: NodeGroup;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}) {
  const tr = useT();
  const toggleGroupCollapse = useFlowStore((s) => s.toggleGroupCollapse);
  const Icon = MACRO_ICON_MAP[group.icon ?? ''] ?? Box;
  const HEADER_H = 44;

  return (
    <div
      className="absolute overflow-hidden rounded-[20px] border-[1.5px] border-[var(--accent)] bg-[var(--panel)] shadow-[var(--shadow-pop)]"
      style={{
        left: minX,
        top: minY - HEADER_H,
        width: maxX - minX,
        height: maxY - minY + HEADER_H,
        zIndex: 4,
        pointerEvents: 'none',
      }}
    >
      <div
        className="flex items-center gap-2.5 border-b border-[var(--border)] bg-[var(--card)] px-3.5"
        style={{ height: HEADER_H, pointerEvents: 'auto' }}
      >
        <span className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-[10px] bg-[var(--accent-soft)]">
          <Icon size={14} className="text-[var(--accent)]" />
        </span>
        <span className="text-[13px] font-semibold leading-[1.5] tracking-tight text-[var(--t1)]">{group.label}</span>
        <span className="text-[11px] leading-[1.5] text-[var(--t4)]">
          {tr(`Đang xem bên trong · ${group.nodeIds.length} nút con`, `Viewing inside · ${group.nodeIds.length} child nodes`)}
        </span>
        <button
          type="button"
          onClick={() => toggleGroupCollapse(group.id)}
          className="nodrag ml-auto flex h-7 items-center gap-1.5 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 text-[11px] font-semibold leading-[1.5] text-[var(--t1)] transition-colors hover:bg-[var(--hover)]"
        >
          <Minimize2 size={16} />
          {tr('Thu gọn lại', 'Collapse')}
        </button>
      </div>

      {/* Chú thích góc phải-dưới (port `Nút tổng.dc.html` màn 04). Chấm tím thật nằm ở tiêu đề
          từng node con — xem `hasExposedParam` trong `InteriorNode.tsx`. CHỈ hiện khi nút tổng
          này thực sự CÓ tham số đưa ra ngoài, không thì chú thích lại chỉ vào thứ không tồn tại.
          Nền ĐẶC (--card), không kính — cùng lý do với khung cha: tránh kính lồng kính. */}
      {(group.exposedParams ?? []).length > 0 && (
        <span className="absolute bottom-[18px] right-[22px] inline-flex h-[26px] items-center gap-2 rounded-[14px] border border-[var(--border)] bg-[var(--card)] px-[11px] text-[11px] leading-[1.5] text-[var(--t3)]">
          <span className="h-1.5 w-1.5 flex-none rounded-full bg-[var(--accent)]" />
          {tr('Chấm tím là tham số đã đưa ra ngoài', 'A purple dot marks a parameter exposed outside')}
        </span>
      )}
    </div>
  );
}

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
    // NÚT TỔNG (isMacro) — mặt riêng (MacroNodeFace) thay badge nhỏ, xem file đó.
    if (group.isMacro) return <MacroNodeFace group={group} />;
    // Collapsed badge tại vị trí tâm đã lưu
    const cx = group.center?.x ?? 0;
    const cy = group.center?.y ?? 0;
    return (
      <div
        className="absolute flex items-center gap-1.5 rounded-[10px] border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 shadow-lg"
        style={{
          transform: `translate(${cx - 60}px, ${cy - 16}px)`,
          zIndex: 5,
        }}
      >
        <button
          className="nodrag grid h-5 w-5 place-items-center rounded text-[var(--t3)] hover:bg-[var(--hover)]"
          onClick={() => toggleGroupCollapse(group.id)}
          title="Mở rộng group"
        >
          <ChevronRight size={14} />
        </button>
        <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--t2)]">
          {group.label}
        </span>
        <span className="text-[9px] text-[var(--t4)]">({group.nodeIds.length})</span>
      </div>
    );
  }

  // G2 phần (1) — khung phòng (`group.rect` tường minh) PHẢI hiện kể cả 0 node thành viên (đó là
  // điểm cốt lõi: khung vẽ trước, thả node vào sau) — group thường (bbox suy từ node) thì vẫn cần
  // ≥1 member mới có gì để tính bbox, giữ nguyên early-return cũ.
  if (!group.rect && !members.length) return null;

  // Bounding box bao quanh các node (tính cả kích thước node ~256x120) — dùng khi KHÔNG có rect
  // tường minh (group thường). Có `rect` (khung phòng) thì dùng thẳng, không tính lại từ member.
  const NODE_W = 256;
  const NODE_H = 120;
  const box = group.rect
    ? { minX: group.rect.x, minY: group.rect.y - LABEL_H, maxX: group.rect.x + group.rect.width, maxY: group.rect.y + group.rect.height }
    : {
        minX: Math.min(...members.map((n) => n.position.x)) - PAD,
        minY: Math.min(...members.map((n) => n.position.y)) - PAD - LABEL_H,
        maxX: Math.max(...members.map((n) => n.position.x + NODE_W)) + PAD,
        maxY: Math.max(...members.map((n) => n.position.y + NODE_H)) + PAD,
      };
  const { minX, minY, maxX, maxY } = box;

  // NÚT TỔNG mở ra xem bên trong (state ④ mock) — khung ĐẶC (var(--panel), không backdrop blur)
  // + header riêng (icon/tên/"Thu gọn lại"), tránh "kính lồng kính" (mock ghi rõ: "Khung mở là
  // mặt đặc, không phải kính"). Node con vẫn render Ở TRÊN bởi lớp node bình thường của React
  // Flow (khung này chỉ là NỀN, `pointerEvents:none` như khung group thường).
  if (group.isMacro) {
    return <MacroExpandedFrame group={group} minX={minX} minY={minY} maxX={maxX} maxY={maxY} />;
  }

  return (
    <div
      className={cn(
        'absolute rounded-[14px] border bg-[var(--accent)]/[0.04]',
        group.rect ? 'border-solid border-[var(--accent-ring)]/60' : 'border-dashed border-[var(--accent-ring)]/40',
      )}
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
        style={{ pointerEvents: 'auto' }}
      >
        <button
          className="nodrag grid h-5 w-5 place-items-center rounded text-[var(--t3)] hover:bg-[var(--hover)]"
          onClick={() => toggleGroupCollapse(group.id)}
          title="Thu gọn group"
        >
          <ChevronDown size={14} />
        </button>
        {editing ? (
          <input
            autoFocus
            list="if-room-name-presets"
            className="nodrag w-24 rounded border border-[var(--border)] bg-[var(--field)] px-1 py-0.5 text-[10px] text-[var(--t1)]"
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
          <X size={14} />
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
      {/* 1 datalist DÙNG CHUNG mọi input đổi tên (nhiều group cùng lúc không tạo id trùng trong
          DOM) — xem `list="if-room-name-presets"` trên input ở GroupRect(). */}
      <datalist id="if-room-name-presets">
        {ROOM_NAME_PRESETS.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      {groups.map((g) => (
        <GroupRect key={g.id} group={g} />
      ))}
    </ViewportPortal>
  );
}
