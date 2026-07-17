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
  Scissors, Expand, SquareRoundCorner, Slice, Grid3x3, LayoutGrid,
  ZoomIn, SplitSquareHorizontal, ScissorsLineDashed, Link2, Boxes, ArrowLeftRight, Compass,
  Radius, Diameter, DraftingCompass, ChevronsRight, GitBranch, PaintBucket,
  CircleDashed, LocateFixed, Palette, StickyNote,
} from 'lucide-react';
import { useCadStore, type Tool } from '@/lib/cad/store';
import { modKey, modShiftKey } from '@/lib/kbd';

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
  { tool: 'circle3p', icon: CircleDashed, label: 'Circle 3-điểm — click 3 điểm trên đường tròn', key: 'C3P' },
  { tool: 'arc', icon: Spline, label: 'Arc 3 điểm', key: 'A' },
  { tool: 'arccenter', icon: LocateFixed, label: 'Arc tâm+góc — click tâm → điểm đầu → điểm cuối', key: 'ARCC' },
];
const ARCH: ToolBtn[] = [
  { tool: 'wall', icon: BrickWall, label: 'Tường (chuỗi điểm tim tường)', key: 'W' },
  { tool: 'room', icon: LayoutPanelTop, label: 'Phòng chữ nhật + nhãn diện tích', key: 'ROOM' },
  { tool: 'hatch', icon: PaintBucket, label: 'Hatch — pick-point tô vùng kín (H ANSI31/ANSI32/ANSI37/SOLID/DOTS)', key: 'H' },
];
const EDIT: ToolBtn[] = [
  { tool: 'move', icon: Move, label: 'Move', key: 'M' },
  { tool: 'copy', icon: Copy, label: 'Copy', key: 'CO' },
  { tool: 'rotate', icon: RotateCw, label: 'Rotate', key: 'RO' },
  { tool: 'mirror', icon: FlipHorizontal2, label: 'Mirror', key: 'MI' },
  { tool: 'offset', icon: StretchHorizontal, label: 'Offset', key: 'O' },
];
const MEASURE: ToolBtn[] = [
  { tool: 'dimension', icon: Ruler, label: 'Dimension aligned', key: 'DAL' },
  { tool: 'dimradius', icon: Radius, label: 'Dimension radius', key: 'DRA' },
  { tool: 'dimdiameter', icon: Diameter, label: 'Dimension diameter', key: 'DDI' },
  { tool: 'dimangular', icon: DraftingCompass, label: 'Dimension angular', key: 'DAN' },
  { tool: 'dimcontinue', icon: ChevronsRight, label: 'Dimension continue', key: 'DCO' },
  { tool: 'dimbaseline', icon: GitBranch, label: 'Dimension baseline', key: 'DBA' },
  { tool: 'measure', icon: MoveDiagonal, label: 'Đo nhanh', key: 'DI' },
  { tool: 'text', icon: Type, label: 'Text', key: 'T' },
];
/** Sprint 7 — Việc 3: ghim markup — annotation KH góp ý, tách riêng khỏi TEXT (hình học thật). */
const ANNOTATE: ToolBtn[] = [
  { tool: 'markup', icon: StickyNote, label: 'Markup — ghim ghi chú phản hồi KH lên bản vẽ', key: 'MK' },
];
/** Nấc 1 — bộ chỉnh sửa (tương đương AutoCAD LT). Dòng lệnh vẫn là cách chính (TR/EX/F/CHA/…). */
const MODIFY: ToolBtn[] = [
  { tool: 'trim', icon: Scissors, label: 'Trim — cắt tại giao điểm', key: 'TR' },
  { tool: 'extend', icon: Expand, label: 'Extend — kéo dài tới biên', key: 'EX' },
  { tool: 'fillet', icon: SquareRoundCorner, label: 'Fillet — bo góc (0 = vuông góc)', key: 'F' },
  { tool: 'chamfer', icon: Slice, label: 'Chamfer — vát góc', key: 'CHA' },
  { tool: 'arrayrect', icon: Grid3x3, label: 'Array chữ nhật', key: 'AR' },
  { tool: 'arraypolar', icon: LayoutGrid, label: 'Array tròn', key: 'ARP' },
  { tool: 'scale', icon: ZoomIn, label: 'Scale', key: 'SC' },
  { tool: 'stretch', icon: SplitSquareHorizontal, label: 'Stretch — kéo dãn (crossing window)', key: 'S' },
  { tool: 'break', icon: ScissorsLineDashed, label: 'Break — bẻ đối tượng', key: 'BR' },
  { tool: 'join', icon: Link2, label: 'Join — nối 2 đối tượng', key: 'J' },
  { tool: 'explode', icon: Boxes, label: 'Explode — rã block/polyline', key: 'X' },
  { tool: 'lengthen', icon: ArrowLeftRight, label: 'Lengthen — đổi độ dài', key: 'LEN' },
];

function fire(name: string) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(name));
}

export default function CadToolbar({
  onToggleFurniture,
  onToggleMaterial,
}: {
  onToggleFurniture: () => void;
  onToggleMaterial: () => void;
}) {
  const tool = useCadStore((s) => s.tool);
  const setTool = useCadStore((s) => s.setTool);
  const setPendingBlock = useCadStore((s) => s.setPendingBlock);
  const pendingBlock = useCadStore((s) => s.pendingBlock);
  const snap = useCadStore((s) => s.snap);
  const setSnap = useCadStore((s) => s.setSnap);
  const polarTracking = useCadStore((s) => s.polarTracking);
  const setPolarTracking = useCadStore((s) => s.setPolarTracking);
  const polarStep = useCadStore((s) => s.polarStep);
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
      <button type="button" onClick={onToggleMaterial} title="Vật liệu (Sprint 5) — chọn preset gạch/gỗ/đá/sơn cho Hatch" style={btn(false)}>
        <Palette size={17} />
      </button>
      <button type="button" onClick={() => setPendingBlock('door')} title="Đặt cửa đi (D) — dùng block cửa có sẵn" style={btn(pendingBlock === 'door')}>
        <DoorOpen size={17} />
      </button>
      <Divider />
      <Group items={EDIT} />
      <Divider />
      <Group items={MODIFY} />
      <Divider />
      <Group items={MEASURE} />
      <Divider />
      <Group items={ANNOTATE} />
      <Divider />
      <button type="button" onClick={onToggleFurniture} title="Thư viện nội thất (block)" style={btn(tool === 'block')}>
        <Sofa size={17} />
      </button>
      <Divider />
      {/* snap + grid toggle */}
      <button
        type="button"
        onClick={() => setSnap({ enabled: !snap.enabled })}
        title={`Bắt điểm (snap): ${snap.enabled ? 'BẬT' : 'tắt'} — endpoint/mid/center/quadrant/node/giao/vuông góc/tiếp tuyến/lưới`}
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
      <button
        type="button"
        onClick={() => setPolarTracking(!polarTracking)}
        title={`Polar tracking: ${polarTracking ? 'BẬT' : 'tắt'} — bắt góc ${polarStep}° (Shift = Ortho tuyệt đối, ưu tiên hơn)`}
        style={btn(polarTracking)}
      >
        <Compass size={16} />
      </button>
      <Divider />
      <button type="button" onClick={() => setTool('pan')} title="Pan (space kéo)" style={btn(tool === 'pan')}>
        <Hand size={16} />
      </button>
      <button type="button" onClick={() => fire('cad:zoom-extents')} title="Zoom Extents (F)" style={btn(false)}>
        <Maximize size={16} />
      </button>
      <Divider />
      <button type="button" onClick={undo} disabled={!past} title={`Undo (${modKey('Z')})`} style={btn(false, !past)}>
        <Undo2 size={16} />
      </button>
      <button type="button" onClick={redo} disabled={!future} title={`Redo (${modShiftKey('Z')})`} style={btn(false, !future)}>
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
