'use client';

/**
 * components/cad/CadToolbar.tsx — Thanh công cụ NỔI dạng pill (gu GU-PROFILE §2:
 * liquid-glass, bo tròn, đơn sắc + 1 accent đồng). Mọi lệnh đều có nút; tooltip kèm phím tắt.
 */

import {
  MousePointer2, Minus, Waypoints, Square, Circle, Spline,
  Move, Copy, RotateCw, FlipHorizontal2, StretchHorizontal,
  Ruler, MoveDiagonal, Type, Sofa, Magnet, Grid2x2, Hand,
  Undo2, Redo2, Maximize, BrickWall, LayoutPanelTop, DoorOpen,
} from 'lucide-react';
import { useCadStore, type Tool } from '@/lib/cad/store';

interface ToolBtn {
  tool: Tool;
  icon: typeof Move;
  label: string;
  key: string;
}

const DRAW: ToolBtn[] = [
  { tool: 'select', icon: MousePointer2, label: 'Chọn', key: 'Esc' },
  { tool: 'line', icon: Minus, label: 'Line', key: 'L' },
  { tool: 'polyline', icon: Waypoints, label: 'Polyline', key: 'PL' },
  { tool: 'rect', icon: Square, label: 'Rect', key: 'REC' },
  { tool: 'circle', icon: Circle, label: 'Circle', key: 'C' },
  { tool: 'arc', icon: Spline, label: 'Arc 3 điểm', key: 'A' },
];
const ARCH: ToolBtn[] = [
  { tool: 'wall', icon: BrickWall, label: 'Tường (chuỗi điểm tim tường)', key: 'W' },
  { tool: 'room', icon: LayoutPanelTop, label: 'Phòng chữ nhật + nhãn diện tích', key: 'ROOM' },
];
const EDIT: ToolBtn[] = [
  { tool: 'move', icon: Move, label: 'Move', key: 'M' },
  { tool: 'copy', icon: Copy, label: 'Copy', key: 'CO' },
  { tool: 'rotate', icon: RotateCw, label: 'Rotate', key: 'RO' },
  { tool: 'mirror', icon: FlipHorizontal2, label: 'Mirror', key: 'MI' },
  { tool: 'offset', icon: StretchHorizontal, label: 'Offset', key: 'O' },
];
const MEASURE: ToolBtn[] = [
  { tool: 'dimension', icon: Ruler, label: 'Dimension', key: 'DIM' },
  { tool: 'measure', icon: MoveDiagonal, label: 'Đo nhanh', key: 'DI' },
  { tool: 'text', icon: Type, label: 'Text', key: 'T' },
];

function fire(name: string) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(name));
}

export default function CadToolbar({ onToggleFurniture }: { onToggleFurniture: () => void }) {
  const tool = useCadStore((s) => s.tool);
  const setTool = useCadStore((s) => s.setTool);
  const setPendingBlock = useCadStore((s) => s.setPendingBlock);
  const pendingBlock = useCadStore((s) => s.pendingBlock);
  const snap = useCadStore((s) => s.snap);
  const setSnap = useCadStore((s) => s.setSnap);
  const undo = useCadStore((s) => s.undo);
  const redo = useCadStore((s) => s.redo);
  const past = useCadStore((s) => s.past.length);
  const future = useCadStore((s) => s.future.length);

  const Group = ({ items }: { items: ToolBtn[] }) => (
    <>
      {items.map((b) => {
        const Icon = b.icon;
        const on = tool === b.tool;
        return (
          <button
            key={b.tool}
            type="button"
            onClick={() => setTool(b.tool)}
            title={`${b.label} · ${b.key}`}
            style={btn(on)}
          >
            <Icon size={17} />
          </button>
        );
      })}
    </>
  );

  return (
    <div
      style={{
        position: 'absolute',
        top: 14,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: 6,
        borderRadius: 999,
        background: 'color-mix(in srgb, var(--panel) 78%, transparent)',
        backdropFilter: 'blur(18px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(18px) saturate(1.4)',
        border: '1px solid var(--border)',
        boxShadow: '0 8px 30px rgba(0,0,0,.22)',
      }}
    >
      <Group items={DRAW} />
      <Divider />
      <Group items={ARCH} />
      <button type="button" onClick={() => setPendingBlock('door')} title="Đặt cửa đi (D) — dùng block cửa có sẵn" style={btn(pendingBlock === 'door')}>
        <DoorOpen size={17} />
      </button>
      <Divider />
      <Group items={EDIT} />
      <Divider />
      <Group items={MEASURE} />
      <Divider />
      <button type="button" onClick={onToggleFurniture} title="Thư viện nội thất (block)" style={btn(tool === 'block')}>
        <Sofa size={17} />
      </button>
      <Divider />
      {/* snap + grid toggle */}
      <button
        type="button"
        onClick={() => setSnap({ enabled: !snap.enabled })}
        title={`Bắt điểm (snap): ${snap.enabled ? 'BẬT' : 'tắt'} — endpoint/mid/center/giao/lưới`}
        style={btn(snap.enabled)}
      >
        <Magnet size={16} />
      </button>
      <button
        type="button"
        onClick={() => setSnap({ grid: !snap.grid })}
        title={`Snap lưới: ${snap.grid ? 'BẬT' : 'tắt'}`}
        style={btn(snap.grid)}
      >
        <Grid2x2 size={16} />
      </button>
      <Divider />
      <button type="button" onClick={() => setTool('pan')} title="Pan (space kéo)" style={btn(tool === 'pan')}>
        <Hand size={16} />
      </button>
      <button type="button" onClick={() => fire('cad:zoom-extents')} title="Zoom Extents (F)" style={btn(false)}>
        <Maximize size={16} />
      </button>
      <Divider />
      <button type="button" onClick={undo} disabled={!past} title="Undo (⌘Z)" style={btn(false, !past)}>
        <Undo2 size={16} />
      </button>
      <button type="button" onClick={redo} disabled={!future} title="Redo (⌘⇧Z)" style={btn(false, !future)}>
        <Redo2 size={16} />
      </button>
    </div>
  );
}

function Divider() {
  return <span style={{ width: 1, height: 22, background: 'var(--border)', margin: '0 2px' }} />;
}

function btn(active: boolean, disabled = false): React.CSSProperties {
  return {
    display: 'grid',
    placeItems: 'center',
    width: 34,
    height: 34,
    borderRadius: 999,
    border: 'none',
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? '#fff' : 'var(--t2)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.35 : 1,
    transition: 'background .15s, color .15s',
  };
}
