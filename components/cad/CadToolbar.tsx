'use client';

/**
 * components/cad/CadToolbar.tsx — Thanh công cụ NỔI dạng pill (gu GU-PROFILE §2:
 * liquid-glass, bo tròn, đơn sắc + 1 accent đồng). Mọi lệnh đều có nút; tooltip kèm phím tắt.
 */

import { useEffect } from 'react';
import {
  MousePointer2, Minus, Waypoints, Square, Circle, Spline,
  Move, Copy, RotateCw, FlipHorizontal2, StretchHorizontal,
  Ruler, MoveDiagonal, Type, Sofa, Magnet, Grid2x2, Hand,
  Undo2, Redo2, Maximize, BrickWall, LayoutPanelTop, DoorOpen,
  Scissors, Expand, SquareRoundCorner, Slice, Grid3x3, LayoutGrid,
  ZoomIn, SplitSquareHorizontal, ScissorsLineDashed, Link2, Boxes, ArrowLeftRight, Compass,
  Radius, Diameter, DraftingCompass, ChevronsRight, GitBranch, PaintBucket,
  CircleDashed, LocateFixed, Palette, StickyNote,
  Pentagon, Ellipse, Donut, SplinePointer, Slash, Divide,
} from 'lucide-react';
import { useCadStore, type Tool, type CadMode } from '@/lib/cad/store';
import { modKey, modShiftKey } from '@/lib/kbd';
import Tooltip from '@/components/ui/Tooltip';

/** Rút gọn nhãn nút (bỏ mô tả dài sau " (" / " — ") thành nhãn ngắn cho tag hover. */
function shortLabel(title: string): string {
  return title.split(' (')[0].split(' — ')[0].trim();
}

/** Sprint 9 — nhớ lựa chọn Sketch/Pro qua các phiên (mặc định 'sketch' nếu chưa từng chọn hoặc
 * private mode/SSR chặn localStorage — xem pattern giống PresentEditor.tsx). */
const LS_CAD_MODE = 'interiorflow.cad.mode';

interface ToolBtn {
  tool: Tool;
  icon: typeof Move;
  label: string;
  key: string;
}

/** Sprint 9 — Sketch: bộ vẽ tối thiểu đúng triết lý Phase 1 ("Sketch, không phải Draft"). */
const DRAW: ToolBtn[] = [
  { tool: 'select', icon: MousePointer2, label: 'Chọn', key: 'Esc' },
  { tool: 'line', icon: Minus, label: 'Line', key: 'L' },
  { tool: 'rect', icon: Square, label: 'Rect', key: 'REC' },
  { tool: 'circle', icon: Circle, label: 'Circle', key: 'C' },
];
/** Sprint 9 — Pro: biến thể vẽ chính xác hơn (Sprint 10 Việc 1 + phần còn lại của DRAW cũ). */
const DRAW_PRO: ToolBtn[] = [
  { tool: 'polyline', icon: Waypoints, label: 'Polyline', key: 'PL' },
  { tool: 'circle3p', icon: CircleDashed, label: 'Circle 3-điểm — click 3 điểm trên đường tròn', key: 'C3P' },
  { tool: 'arc', icon: Spline, label: 'Arc 3 điểm', key: 'A' },
  { tool: 'arccenter', icon: LocateFixed, label: 'Arc tâm+góc — click tâm → điểm đầu → điểm cuối', key: 'ARCC' },
];
/** Sprint 10 — Việc 2/3: Polygon đều · Ellipse · Donut · Spline · Xline — hình học chính xác mở rộng. Pro-only (Sprint 9). */
const SHAPES2: ToolBtn[] = [
  { tool: 'polygon', icon: Pentagon, label: 'Polygon đều — click tâm → bán kính (POL <n> đổi số cạnh)', key: 'POL' },
  { tool: 'ellipse', icon: Ellipse, label: 'Ellipse — click tâm → góc xác định 2 bán trục', key: 'EL' },
  { tool: 'donut', icon: Donut, label: 'Donut — click tâm để đặt (DO <trong> <ngoài> đổi bán kính)', key: 'DO' },
  { tool: 'spline', icon: SplinePointer, label: 'Spline — click các control point; Enter/double-click kết thúc', key: 'SPL' },
  { tool: 'xline', icon: Slash, label: 'Xline — đường tham chiếu kéo dài vô hạn 2 đầu (layer "Tham chiếu")', key: 'XL' },
  { tool: 'divide', icon: Divide, label: 'Divide/Measure — chia đều N đoạn hoặc đo khoảng cách cố định', key: 'DIV' },
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
];
const MEASURE: ToolBtn[] = [
  { tool: 'measure', icon: MoveDiagonal, label: 'Đo nhanh', key: 'DI' },
  { tool: 'text', icon: Type, label: 'Text', key: 'T' },
];
/** Pro-only (Sprint 9) — 6 lệnh ghi kích thước kiểu bản vẽ kỹ thuật, không thuộc "sketch nhanh". */
const DIMENSION: ToolBtn[] = [
  { tool: 'dimension', icon: Ruler, label: 'Dimension aligned', key: 'DAL' },
  { tool: 'dimradius', icon: Radius, label: 'Dimension radius', key: 'DRA' },
  { tool: 'dimdiameter', icon: Diameter, label: 'Dimension diameter', key: 'DDI' },
  { tool: 'dimangular', icon: DraftingCompass, label: 'Dimension angular', key: 'DAN' },
  { tool: 'dimcontinue', icon: ChevronsRight, label: 'Dimension continue', key: 'DCO' },
  { tool: 'dimbaseline', icon: GitBranch, label: 'Dimension baseline', key: 'DBA' },
];
/** Sprint 7 — Việc 3: ghim markup — annotation KH góp ý, tách riêng khỏi TEXT (hình học thật). */
const ANNOTATE: ToolBtn[] = [
  { tool: 'markup', icon: StickyNote, label: 'Markup — ghim ghi chú phản hồi KH lên bản vẽ', key: 'MK' },
];
/** Nấc 1 — bộ chỉnh sửa (tương đương AutoCAD LT). Pro-only (Sprint 9) — dòng lệnh vẫn là cách
 * chính khi cần (TR/EX/F/CHA/…), nhưng nút toolbar chỉ hiện ở Pro để Sketch gọn. */
const MODIFY: ToolBtn[] = [
  { tool: 'offset', icon: StretchHorizontal, label: 'Offset', key: 'O' },
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
  const cadMode = useCadStore((s) => s.cadMode);
  const setCadMode = useCadStore((s) => s.setCadMode);
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
  const isPro = cadMode === 'pro';

  // Nạp lựa chọn Sketch/Pro đã lưu SAU mount (tránh lệch hydration SSR — cùng pattern
  // PresentEditor.tsx). Không có gì lưu (lần đầu/private mode) → giữ mặc định 'sketch' của store.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_CAD_MODE);
      if (saved === 'sketch' || saved === 'pro') setCadMode(saved as CadMode);
    } catch {
      /* private mode / SSR — bỏ qua, dùng mặc định */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(LS_CAD_MODE, cadMode);
    } catch {
      /* ignore */
    }
  }, [cadMode]);

  const Group = ({ items }: { items: ToolBtn[] }) => (
    <>
      {items.map((b) => {
        const Icon = b.icon;
        const on = tool === b.tool;
        return (
          <Tooltip key={b.tool} label={shortLabel(b.label)}>
            <button
              type="button"
              onClick={() => setTool(b.tool)}
              title={`${b.label} · ${b.key}`}
              style={btn(on)}
            >
              <Icon size={17} />
            </button>
          </Tooltip>
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
        // Sprint 9 — Pro vẫn có thể rộng hơn viewport hẹp (nợ kỹ thuật cũ "toolbar tràn màn
        // hẹp"). Thay vì để pill tràn 2 bên (đẩy ModeSwitch/Undo ra ngoài mép, không bấm được),
        // giới hạn maxWidth + cuộn ngang — nội dung luôn bắt đầu từ trái (ModeSwitch/DRAW luôn
        // thấy được ngay), phần Pro dài hơn thì cuộn thay vì vô hình.
        maxWidth: 'calc(100vw - 32px)',
        overflowX: 'auto',
        borderRadius: 999,
        background: 'color-mix(in srgb, var(--panel) 78%, transparent)',
        backdropFilter: 'blur(18px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(18px) saturate(1.4)',
        border: '1px solid var(--border)',
        boxShadow: '0 8px 30px rgba(0,0,0,.22)',
      }}
    >
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: 6, width: 'max-content' }}>
      <ModeSwitch mode={cadMode} onChange={setCadMode} />
      <Divider />
      <Group items={DRAW} />
      {isPro && <Group items={DRAW_PRO} />}
      {isPro && <Divider />}
      {isPro && <Group items={SHAPES2} />}
      <Divider />
      <Group items={ARCH} />
      <Tooltip label="Vật liệu">
        <button type="button" onClick={onToggleMaterial} title="Vật liệu (Sprint 5) — chọn preset gạch/gỗ/đá/sơn cho Hatch" style={btn(false)}>
          <Palette size={17} />
        </button>
      </Tooltip>
      <Tooltip label="Cửa đi">
        <button type="button" onClick={() => setPendingBlock('door')} title="Đặt cửa đi (D) — dùng block cửa có sẵn" style={btn(pendingBlock === 'door')}>
          <DoorOpen size={17} />
        </button>
      </Tooltip>
      <Divider />
      <Group items={EDIT} />
      {isPro && <Divider />}
      {isPro && <Group items={MODIFY} />}
      <Divider />
      <Group items={MEASURE} />
      {isPro && <Group items={DIMENSION} />}
      <Divider />
      <Group items={ANNOTATE} />
      <Divider />
      <Tooltip label="Nội thất">
        <button type="button" onClick={onToggleFurniture} title="Thư viện nội thất (block)" style={btn(tool === 'block')}>
          <Sofa size={17} />
        </button>
      </Tooltip>
      <Divider />
      {/* snap + grid toggle — auto-snap là hành vi mặc định của "Sketch" (IF tự chỉnh), giữ hiện
          ở cả 2 mode. Polar tracking (bắt góc theo độ) là khái niệm CAD hơn → Pro-only. */}
      <Tooltip label={`Bắt điểm: ${snap.enabled ? 'BẬT' : 'tắt'}`}>
        <button
          type="button"
          onClick={() => setSnap({ enabled: !snap.enabled })}
          title={`Bắt điểm (snap): ${snap.enabled ? 'BẬT' : 'tắt'} — endpoint/mid/center/quadrant/node/giao/vuông góc/tiếp tuyến/lưới`}
          style={btn(snap.enabled)}
        >
          <Magnet size={16} />
        </button>
      </Tooltip>
      <Tooltip label={`Snap lưới: ${snap.grid ? 'BẬT' : 'tắt'}`}>
        <button
          type="button"
          onClick={() => setSnap({ grid: !snap.grid })}
          title={`Snap lưới: ${snap.grid ? 'BẬT' : 'tắt'}`}
          style={btn(snap.grid)}
        >
          <Grid2x2 size={16} />
        </button>
      </Tooltip>
      {isPro && (
        <Tooltip label={`Polar tracking: ${polarTracking ? 'BẬT' : 'tắt'}`}>
          <button
            type="button"
            onClick={() => setPolarTracking(!polarTracking)}
            title={`Polar tracking: ${polarTracking ? 'BẬT' : 'tắt'} — bắt góc ${polarStep}° (Shift = Ortho tuyệt đối, ưu tiên hơn)`}
            style={btn(polarTracking)}
          >
            <Compass size={16} />
          </button>
        </Tooltip>
      )}
      <Divider />
      <Tooltip label="Pan">
        <button type="button" onClick={() => setTool('pan')} title="Pan (space kéo)" style={btn(tool === 'pan')}>
          <Hand size={16} />
        </button>
      </Tooltip>
      <Tooltip label="Zoom Extents">
        <button type="button" onClick={() => fire('cad:zoom-extents')} title="Zoom Extents (F)" style={btn(false)}>
          <Maximize size={16} />
        </button>
      </Tooltip>
      <Divider />
      <Tooltip label="Undo">
        <button type="button" onClick={undo} disabled={!past} title={`Undo (${modKey('Z')})`} style={btn(false, !past)}>
          <Undo2 size={16} />
        </button>
      </Tooltip>
      <Tooltip label="Redo">
        <button type="button" onClick={redo} disabled={!future} title={`Redo (${modShiftKey('Z')})`} style={btn(false, !future)}>
          <Redo2 size={16} />
        </button>
      </Tooltip>
    </div>
    </div>
  );
}

function Divider() {
  return <span style={{ width: 1, height: 22, background: 'var(--border)', margin: '0 2px' }} />;
}

/** Sprint 9 — công tắc 2 chiều Sketch↔Pro (Phương án A đã duyệt). Cùng ngôn ngữ pill/accent với
 * phần còn lại của toolbar — KHÔNG thêm màu mới, "đang chọn" tô var(--accent) như mọi nút khác. */
function ModeSwitch({ mode, onChange }: { mode: CadMode; onChange: (m: CadMode) => void }) {
  const segBtn = (active: boolean): React.CSSProperties => ({
    appearance: 'none',
    border: 'none',
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? '#fff' : 'var(--t2)',
    fontFamily: 'inherit',
    fontSize: 12,
    fontWeight: 650,
    padding: '6px 12px',
    borderRadius: 999,
    cursor: 'pointer',
    transition: 'background .18s, color .18s',
  });
  return (
    <div
      style={{
        display: 'flex',
        background: 'var(--field)',
        border: '1px solid var(--border)',
        borderRadius: 999,
        padding: 2,
        gap: 1,
      }}
      title="Sketch: bộ vẽ tối giản, đúng nhịp phác thảo nhanh. Pro: thêm công cụ CAD chính xác (Sprint 10) — nhập toạ độ, Dimension, Fillet/Chamfer, Array…"
    >
      <button type="button" onClick={() => onChange('sketch')} style={segBtn(mode === 'sketch')}>
        Sketch
      </button>
      <button type="button" onClick={() => onChange('pro')} style={segBtn(mode === 'pro')}>
        Pro
      </button>
    </div>
  );
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
