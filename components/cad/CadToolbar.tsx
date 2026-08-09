'use client';

/**
 * components/cad/CadToolbar.tsx — Thanh công cụ NỔI dạng pill (gu GU-PROFILE §2:
 * liquid-glass, bo tròn, đơn sắc + 1 accent đồng). Mọi lệnh đều có nút; tooltip kèm phím tắt.
 */

import { useEffect, useRef, useState } from 'react';
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
  Blend, MoveUpRight, Video, ArrowDownRight, Pipette, Pencil,
} from 'lucide-react';
import { useCadStore, type Tool, type CadMode } from '@/lib/cad/store';
import { useModKey, useModShiftKey } from '@/lib/kbd';
import { useT } from '@/lib/i18n';
import Tooltip from '@/components/ui/Tooltip';
import Popover from '@/components/ui/Popover';

/** Rút gọn nhãn nút (bỏ mô tả dài sau " (" / " — ") thành nhãn ngắn cho tag hover. */
function shortLabel(title: string): string {
  return title.split(' (')[0].split(' — ')[0].trim();
}

/** 05/08 VIỆC 2 — phần MÔ TẢ của nhãn: đúng khúc mà `shortLabel()` cắt bỏ, đưa xuống dòng thứ hai
 * của tooltip. Trả `undefined` khi nhãn vốn đã ngắn (không có khúc nào) — để Tooltip khỏi in lại
 * y hệt tiêu đề ở dòng dưới. Cắt bằng CÙNG hai dấu `shortLabel()` dùng, không tự chế luật thứ hai. */
function labelDesc(title: string): string | undefined {
  const dash = title.indexOf(' — ');
  if (dash >= 0) return title.slice(dash + 3).trim() || undefined;
  const paren = title.indexOf(' (');
  if (paren >= 0) return title.slice(paren + 2).replace(/\)\s*$/, '').trim() || undefined;
  return undefined;
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
  { tool: 'freehand', icon: Pencil, label: 'Nét tay — kéo bằng bút hoặc ngón, nhấc để tự nắn', key: '—' },
  { tool: 'line', icon: Minus, label: 'Đường', key: 'L' },
  { tool: 'rect', icon: Square, label: 'Chữ nhật', key: 'REC' },
  { tool: 'circle', icon: Circle, label: 'Tròn', key: 'C' },
];
/** Sprint 9 — Pro: biến thể vẽ chính xác hơn (Sprint 10 Việc 1 + phần còn lại của DRAW cũ). */
const DRAW_PRO: ToolBtn[] = [
  { tool: 'polyline', icon: Waypoints, label: 'Đường gấp', key: 'PL' },
  { tool: 'circle3p', icon: CircleDashed, label: 'Tròn 3 điểm — click 3 điểm trên đường tròn', key: 'C3P' },
  { tool: 'arc', icon: Spline, label: 'Cung 3 điểm', key: 'A' },
  { tool: 'arccenter', icon: LocateFixed, label: 'Cung tâm+góc — click tâm → điểm đầu → điểm cuối', key: 'ARCC' },
];
/** Sprint 10 — Việc 2/3: Polygon đều · Ellipse · Donut · Spline · Xline — hình học chính xác mở rộng. Pro-only (Sprint 9). */
const SHAPES2: ToolBtn[] = [
  { tool: 'polygon', icon: Pentagon, label: 'Đa giác đều — click tâm → bán kính (POL <n> đổi số cạnh)', key: 'POL' },
  { tool: 'ellipse', icon: Ellipse, label: 'Elip — click tâm → góc xác định 2 bán trục', key: 'EL' },
  { tool: 'donut', icon: Donut, label: 'Donut — click tâm để đặt (DO <trong> <ngoài> đổi bán kính)', key: 'DO' },
  { tool: 'spline', icon: SplinePointer, label: 'Cong — click các control point; Enter/double-click kết thúc', key: 'SPL' },
  { tool: 'xline', icon: Slash, label: 'Xline — đường tham chiếu kéo dài vô hạn 2 đầu (layer "Tham chiếu")', key: 'XL' },
  { tool: 'divide', icon: Divide, label: 'Divide/Measure — chia đều N đoạn hoặc đo khoảng cách cố định', key: 'DIV' },
];
const ARCH: ToolBtn[] = [
  { tool: 'wall', icon: BrickWall, label: 'Tường (chuỗi điểm tim tường)', key: 'W' },
  { tool: 'room', icon: LayoutPanelTop, label: 'Phòng chữ nhật + nhãn diện tích', key: 'ROOM' },
  { tool: 'hatch', icon: PaintBucket, label: 'Hatch — pick-point tô vùng kín (H ANSI31/ANSI32/ANSI37/SOLID/DOTS)', key: 'H' },
];
const EDIT: ToolBtn[] = [
  { tool: 'move', icon: Move, label: 'Dời', key: 'M' },
  { tool: 'copy', icon: Copy, label: 'Chép', key: 'CO' },
  { tool: 'rotate', icon: RotateCw, label: 'Xoay', key: 'RO' },
  { tool: 'mirror', icon: FlipHorizontal2, label: 'Lật', key: 'MI' },
];
const MEASURE: ToolBtn[] = [
  { tool: 'measure', icon: MoveDiagonal, label: 'Đo nhanh', key: 'DI' },
  { tool: 'text', icon: Type, label: 'Chữ', key: 'T' },
];

/** VIỆC 3 (ticket "THANH TOOL 2D DESIGN", 04/08) — nhóm "VẼ" gộp DRAW+DRAW_PRO+SHAPES2 (14 lệnh),
 * chỉ phơi 6 lệnh hay dùng (Chọn·Đường·Chữ nhật·Tròn·Đường gấp·Cung) trực tiếp trên toolbelt —
 * 8 lệnh còn lại (hình học chính xác ít dùng) CẤT vào panel "còn nữa" (nút ↘ luôn hiện, không
 * nấp sau hover — SPEC-HOVER §3.7), mở qua Popover dùng chung (components/ui/Popover.tsx).
 * Sketch mode KHÔNG có nút ↘ vì DRAW_PRO/SHAPES2 vốn đã ẩn ở Sketch (triết lý "vẽ tối thiểu"
 * giữ nguyên — xem comment DRAW phía trên), nên không có gì để "còn nữa". */
const VE_DIRECT_PRO: ToolBtn[] = [DRAW[0], DRAW[2], DRAW[3], DRAW[4], DRAW_PRO[0], DRAW_PRO[2]];
const VE_MORE: ToolBtn[] = [DRAW_PRO[1], DRAW_PRO[3], ...SHAPES2];

/** VIỆC 2 — 6 lệnh dùng nhiều nhất (Chọn·Đường·Đường gấp·Tường·Phòng·Hatch) nút TO hơn ~1.4 lần,
 * còn lại giữ cỡ hiện tại — xem btnSize()/btn(). */
const BIG_TOOLS = new Set<Tool>(['select', 'line', 'polyline', 'wall', 'room', 'hatch']);
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
/** Zone tool (24/07) — nhóm "Diagram": tô vùng chức năng mặt bằng + mũi tên circulation.
 * Hiện ở CẢ 2 mode (Sketch/Pro) — diagram là ngôn ngữ trình bày, không phải vẽ chính xác. */
const DIAGRAM: ToolBtn[] = [
  { tool: 'zone', icon: Blend, label: 'Zone — tô vùng chức năng (oval/polygon, 6 nhóm màu, legend tự sinh)', key: 'ZONE' },
  { tool: 'arrow', icon: MoveUpRight, label: 'Arrow — mũi tên luồng giao thông nét đứt', key: 'AW' },
  { tool: 'campath', icon: Video, label: 'Đường cam — vẽ tuyến máy quay trên mặt bằng (video V2), tự vào layer IF_CAMPATH', key: 'CAM' },
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
  const isPro = cadMode === 'pro' || cadMode === 'revit';
  const undoLabel = useModKey('Z');
  const redoLabel = useModShiftKey('Z');
  // Hai khác biệt "cầm nắm" giữa 2 mode, gom về đúng 2 biến:
  //  - b()/icoS : Sketch nút 44px (chuẩn vùng chạm) · Pro nút 36px (mật độ gọn cho chuột — nâng
  //               34→36 theo nghiệm thu ticket "THANH TOOL 2D DESIGN": nút thường ≥36px).
  //  - phím tắt : Pro truyền `shortcut` cho Tooltip (tay quen bàn phím thấy ngay phím cần gõ);
  //               Sketch bỏ đi vì trên cảm ứng không có bàn phím để mà gõ phím tắt.
  // `big` (VIỆC 2) — 6 lệnh hay dùng TO hơn ~1.4 lần, luôn ≥44px dù mode nào.
  const b = (active: boolean, disabled = false, big = false) => btn(active, disabled, isPro, big);
  const icoS = isPro ? 17 : 19;
  const icoBig = isPro ? 20 : 24;
  const rowH = btnSize(isPro, false);
  // 05/08 VIỆC 2 — helper `tip()` cũ (nhét phím tắt vào CHUỖI nhãn: "Đường (L)") đã bỏ: Tooltip
  // nay có ô `shortcut` riêng, phím tắt hiện dạng phím bấm bên phải tiêu đề thay vì lẫn vào tên.
  // Khoá lệnh gõ (`it.key`) KHÔNG đổi — chỉ đổi cách bày.

  // Nạp lựa chọn Sketch/Pro đã lưu SAU mount (tránh lệch hydration SSR — cùng pattern
  // PresentEditor.tsx). Không có gì lưu (lần đầu/private mode) → giữ mặc định 'sketch' của store.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_CAD_MODE);
      if (saved === 'sketch' || saved === 'pro' || saved === 'revit') setCadMode(saved as CadMode);
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

  // 19/07 — bug user báo: ở mode Pro thanh công cụ tràn và lòi scrollbar thô của trình duyệt ra
  // giữa pill. Scrollbar giờ ẩn hẳn (.cad-pill-scroll trong globals.css); để user vẫn biết là còn
  // nút bên ngoài, gắn thêm .is-overflowing (fade 2 mép) CHỈ khi thực sự tràn. Đo lại khi đổi
  // mode (Pro có nhiều nút hơn) và khi resize cửa sổ.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => setOverflowing(el.scrollWidth > el.clientWidth + 1);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    // Quan trọng: quan sát CẢ hàng nút bên trong. Chỉ observe container thì lúc font/icon nạp
    // xong làm nội dung dài ra, container KHÔNG đổi kích thước ⇒ RO không bắn ⇒ đo hụt.
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [cadMode]);

  const Group = ({ items }: { items: ToolBtn[] }) => (
    <>
      {items.map((it) => {
        const Icon = it.icon;
        const on = tool === it.tool;
        const isBig = BIG_TOOLS.has(it.tool);
        return (
          /* 05/08 VIỆC 2 — bỏ `title=` trùng: nút này ĐÃ có Tooltip bọc ngoài, để thêm `title=`
             thì trình duyệt vẫn bồi thêm tooltip chậm-xấu của nó sau ~1s, chồng lên tag đẹp.
             Phím tắt tách khỏi nhãn (trước nhét vào chuỗi qua `tip()`) → ô phím riêng bên phải;
             `it.label` bản ĐẦY ĐỦ nay thành dòng mô tả thay vì chỉ nằm trong `title=` câm. */
          <Tooltip
            key={it.tool}
            label={shortLabel(it.label)}
            desc={labelDesc(it.label)}
            shortcut={isPro ? it.key : undefined}
          >
            <button type="button" onClick={() => setTool(it.tool)} style={b(on, false, isBig)}>
              <Icon size={isBig ? icoBig : icoS} />
            </button>
          </Tooltip>
        );
      })}
    </>
  );

  /** VIỆC 3 — nút "còn nữa" ↘ cho nhóm VẼ: LUÔN hiện (không nấp sau hover, SPEC-HOVER §3.7),
   * mở panel 8 lệnh vẽ ít dùng qua Popover dùng chung (component có sẵn, portal + tự né mép
   * viewport — không viết positioning riêng lần 2). */
  const MoreDrawButton = () => {
    const [open, setOpen] = useState(false);
    const btnRef = useRef<HTMLButtonElement>(null);
    const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
    return (
      <>
        <Tooltip
          label="Còn nữa"
          desc="Lệnh vẽ ít dùng: Tròn 3 điểm, Cung tâm+góc, Đa giác, Elip, Donut, Cong, Xline, Divide"
        >
          <button
            ref={btnRef}
            type="button"
            onClick={() => {
              const r = btnRef.current?.getBoundingClientRect();
              if (r) setAnchor({ x: r.left, y: r.bottom + 6 });
              setOpen((v) => !v);
            }}
            style={b(open)}
          >
            <ArrowDownRight size={icoS} />
          </button>
        </Tooltip>
        {open && anchor && (
          <Popover anchorX={anchor.x} anchorY={anchor.y} onDismiss={() => setOpen(false)}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                padding: 6,
                minWidth: 220,
                borderRadius: 14,
                background: 'var(--panel)',
                border: '1px solid var(--border)',
                boxShadow: '0 8px 30px rgba(0,0,0,.22)',
              }}
            >
              {VE_MORE.map((it) => {
                const Icon = it.icon;
                return (
                  /* Hàng trong popover chỉ đủ chỗ cho nhãn NGẮN — tên đầy đủ trước nằm trong
                     `title=` (câm trên cảm ứng), nay vào dòng mô tả. `side="right"` vì popover
                     hẹp: tag canh giữa phía trên sẽ đè lên hàng liền kề. */
                  <Tooltip
                    key={it.tool}
                    side="right"
                    label={shortLabel(it.label)}
                    desc={labelDesc(it.label)}
                    shortcut={it.key}
                    /* Span bọc của Tooltip là `inline-flex` ⇒ nút bên trong co về bề rộng nội dung,
                       làm `marginLeft:auto` của cột phím tắt hết đẩy được sang phải. Ép 100% cả
                       hai tầng để hàng giữ nguyên hình dạng như trước khi bọc. */
                    style={{ width: '100%' }}
                  >
                  <button
                    type="button"
                    onClick={() => {
                      setTool(it.tool);
                      setOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: 8,
                      border: 'none',
                      background: tool === it.tool ? 'var(--accent-soft)' : 'transparent',
                      color: tool === it.tool ? 'var(--accent)' : 'var(--t1)',
                      fontSize: 12,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <Icon size={15} />
                    <span>{shortLabel(it.label)}</span>
                    <span style={{ marginLeft: 'auto', color: 'var(--t4)', fontSize: 10 }}>{it.key}</span>
                  </button>
                  </Tooltip>
                );
              })}
            </div>
          </Popover>
        )}
      </>
    );
  };

  return (
    <div
      ref={scrollRef}
      className={`cad-pill-scroll${overflowing ? ' is-overflowing' : ''}`}
      style={{
        // Toolbelt ổ ⑤ (SPEC-HA-TANG-UI-IF Trụ 1): KHÔNG tự định vị nữa — vỏ kính + vị trí
        // giữa-dưới Stage do `CadToolbelt.tsx` (mount qua prop `toolbelt` của AppShell) lo.
        // Trước đây pill tự absolute top-giữa với maxWidth 100vw nên khi Inspector mở thì tràn
        // phải ĐÈ lên Inspector (bug ghi nhiều lần) — nay maxWidth 100% của Stage, hết đè.
        // Sprint 9 — Pro rộng hơn viewport hẹp: giới hạn maxWidth + cuộn ngang — nội dung luôn
        // bắt đầu từ trái (ModeSwitch/DRAW thấy ngay), phần Pro dài hơn thì cuộn thay vì vô hình.
        // 19/07 — scrollbar mặc định thô nằm giữa pill đã ẩn qua .cad-pill-scroll (globals.css).
        maxWidth: '100%',
        overflowX: 'auto',
        overflowY: 'hidden',
        borderRadius: 999,
      }}
    >
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: 6, width: 'max-content' }}>
      <div style={{ display: 'flex', alignItems: 'center', height: rowH }}>
        <ModeSwitch mode={cadMode} onChange={setCadMode} pro={isPro} />
      </div>
      <Divider h={rowH} />
      {/* Nhãn nhóm theo NGHỀ đặt ở ĐẦU cụm, cùng hàng với icon: mắt đọc "Vẽ → công cụ" thay vì
          phải dò nhãn treo phía dưới; đồng thời giảm một hàng chữ khỏi dock cảm ứng.
          VẼ = DRAW+DRAW_PRO+SHAPES2 gộp (VIỆC 3): Sketch chỉ có 4 lệnh nền tảng (không dư gì để
          "còn nữa"); Pro/Revit phơi 6 lệnh hay dùng + nút ↘ mở 8 lệnh còn lại. */}
      <GroupBlock label="VẼ">
        {isPro ? (
          <>
            <Group items={VE_DIRECT_PRO} />
            <MoreDrawButton />
          </>
        ) : (
          <Group items={DRAW} />
        )}
      </GroupBlock>
      <Divider h={rowH} />
      <GroupBlock label="CẤU KIỆN">
        <Group items={ARCH} />
      </GroupBlock>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: rowH }}>
        <Tooltip label="Vật liệu" desc="Chọn preset gạch/gỗ/đá/sơn cho vùng Hatch">
          <button type="button" onClick={onToggleMaterial} style={b(false)}>
            <Palette size={icoS} />
          </button>
        </Tooltip>
        <Tooltip label="Cửa đi" desc="Đặt cửa bằng block cửa có sẵn" shortcut={isPro ? 'D' : undefined}>
          <button type="button" onClick={() => setPendingBlock('door')} style={b(pendingBlock === 'door')}>
            <DoorOpen size={icoS} />
          </button>
        </Tooltip>
      </div>
      <Divider h={rowH} />
      <GroupBlock label="SỬA">
        <Group items={isPro ? EDIT : [EDIT[0]]} />
        <EyedropperButton isPro={isPro} />
      </GroupBlock>
      {isPro && <Divider h={rowH} />}
      {isPro && <Group items={MODIFY} />}
      <Divider h={rowH} />
      <GroupBlock label="ĐO & GHI CHÚ">
        <Group items={isPro ? MEASURE : [MEASURE[0]]} />
      </GroupBlock>
      {isPro && <Group items={DIMENSION} />}
      <Divider h={rowH} />
      <Group items={ANNOTATE} />
      {isPro && <Group items={DIAGRAM} />}
      <Divider h={rowH} />
      <Tooltip label="Nội thất" desc="Mở thư viện block nội thất để đặt vào bản vẽ">
        <button type="button" onClick={onToggleFurniture} style={b(tool === 'block')}>
          <Sofa size={icoS} />
        </button>
      </Tooltip>
      <Divider h={rowH} />
      {/* snap + grid toggle — auto-snap là hành vi mặc định của "Sketch" (IF tự chỉnh), giữ hiện
          ở cả 2 mode. Polar tracking (bắt góc theo độ) là khái niệm CAD hơn → Pro-only. */}
      <Tooltip
        label={`Bắt điểm: ${snap.enabled ? 'BẬT' : 'tắt'}`}
        desc="Bám điểm đầu/giữa/tâm/góc phần tư/nút/giao/vuông góc/tiếp tuyến/lưới"
      >
        <button type="button" onClick={() => setSnap({ enabled: !snap.enabled })} style={b(snap.enabled)}>
          <Magnet size={icoS} />
        </button>
      </Tooltip>
      <Tooltip label={`Snap lưới: ${snap.grid ? 'BẬT' : 'tắt'}`} desc="Ép con trỏ về mắt lưới khi vẽ">
        <button type="button" onClick={() => setSnap({ grid: !snap.grid })} style={b(snap.grid)}>
          <Grid2x2 size={icoS} />
        </button>
      </Tooltip>
      {isPro && (
        <Tooltip
          label={`Bắt góc: ${polarTracking ? 'BẬT' : 'tắt'}`}
          desc={`Bám bội số ${polarStep}° khi kéo. Giữ Shift = ngang/dọc tuyệt đối, ưu tiên hơn.`}
          shortcut="Shift"
        >
          <button type="button" onClick={() => setPolarTracking(!polarTracking)} style={b(polarTracking)}>
            <Compass size={icoS} />
          </button>
        </Tooltip>
      )}
      <Divider h={rowH} />
      <Tooltip label="Kéo màn hình" desc="Giữ phím cách rồi kéo chuột cũng được" shortcut="Space">
        <button type="button" onClick={() => setTool('pan')} style={b(tool === 'pan')}>
          <Hand size={icoS} />
        </button>
      </Tooltip>
      <Tooltip label="Xem vừa màn" desc="Thu phóng để thấy trọn bản vẽ" shortcut="F">
        <button type="button" onClick={() => fire('cad:zoom-extents')} style={b(false)}>
          <Maximize size={icoS} />
        </button>
      </Tooltip>
      <Divider h={rowH} />
      <Tooltip label="Hoàn tác" shortcut={undoLabel}>
        <button type="button" onClick={undo} disabled={!past} style={b(false, !past)}>
          <Undo2 size={icoS} />
        </button>
      </Tooltip>
      <Tooltip label="Làm lại" shortcut={redoLabel}>
        <button type="button" onClick={redo} disabled={!future} style={b(false, !future)}>
          <Redo2 size={icoS} />
        </button>
      </Tooltip>
    </div>
    </div>
  );
}

/** `h` = chiều cao hàng nút hiện tại (rowH trong CadToolbar). */
function Divider({ h = 22 }: { h?: number }) {
  return <span style={{ width: 1, height: h, background: 'var(--border)', margin: '0 2px' }} />;
}

/** Nhãn dẫn đường nhỏ nằm ngay trước nhóm icon; không chiếm thêm một tầng dọc. */
// 07/08 M-UI-CAD VIỆC 7 (cùng họ VIỆC 1+2+5 của RevitSummaryPanel — nhãn nhóm chữ Việt có dấu
// "VẼ · CẤU KIỆN · SỬA · ĐO & GHI CHÚ" trước 10px/line-height:1 cắt dấu + var(--t4) trượt tương
// phản trên nền panel): nâng ≥11.5px, line-height ≥1.5, đổi sang --t3.
function GroupLabel({ children }: { children: string }) {
  return (
    <span
      style={{
        fontSize: 11.5,
        lineHeight: 1.5,
        textTransform: 'uppercase',
        letterSpacing: '.14em',
        color: 'var(--t3)',
        padding: '0 5px 0 3px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

function GroupBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <GroupLabel>{label}</GroupLabel>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{children}</div>
    </div>
  );
}

/**
 * VIỆC "ống hút thuộc tính" (`lib/cad/eyedropper.ts`, SPEC-LENH-VE-IF §4 khuyết ① "rẻ mà được
 * yêu nhất" — AutoCAD MATCHPROP): copy lớp/nét/matId từ 1 đối tượng sang nhiều đối tượng khác.
 *
 * KHÔNG phải 1 `Tool` trong union `lib/cad/store.ts` — đây là lệnh CHỒNG lên tool hiện tại
 * (giống cách người dùng vẫn ở 'select' trong lúc MATCHPROP chạy), nên không đi qua `setTool()`
 * như mọi nút khác trong `Group`. Bật/tắt qua CustomEvent 'cad:eyedropper-toggle' — CadCanvas.tsx
 * tự bắt sự kiện, chạy vòng click nguồn→đích, và tự huỷ (Esc/đổi tool) rồi báo NGƯỢC qua
 * 'cad:eyedropper-cancelled' để nút này tắt sáng đúng lúc dù người dùng không bấm lại chính nút.
 */
function EyedropperButton({ isPro }: { isPro: boolean }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const onCancelled = () => setOn(false);
    window.addEventListener('cad:eyedropper-cancelled', onCancelled);
    return () => window.removeEventListener('cad:eyedropper-cancelled', onCancelled);
  }, []);
  const icoS = isPro ? 17 : 19;
  return (
    <Tooltip label="Ống hút thuộc tính" desc="Copy lớp · nét · vật liệu từ 1 đối tượng sang nhiều đối tượng khác (MATCHPROP)">
      <button
        type="button"
        onClick={() => {
          setOn((v) => !v);
          fire('cad:eyedropper-toggle');
        }}
        style={btn(on, false, isPro)}
      >
        <Pipette size={icoS} />
      </button>
    </Tooltip>
  );
}

/** Sprint 9 — công tắc 2 chiều Sketch↔Pro (Phương án A đã duyệt). Cùng ngôn ngữ pill/accent với
 * phần còn lại của toolbar — KHÔNG thêm màu mới, "đang chọn" GHOST (viền+nền accent nhạt, xem
 * 2.1.8.l 30/07 — không còn tô đặc như trước). */
function ModeSwitch({ mode, onChange, pro }: { mode: CadMode; onChange: (m: CadMode) => void; pro: boolean }) {
  // 06/08 (G-M4-02) — mặt nút TRƯỚC ĐÂY in khoá kỹ thuật `Sketch`/`Pro`/`Revit`; tên chính thức
  // đã chốt lại bị đẩy vào tooltip. Nay ĐẢO: nút hiện TÊN CHÍNH THỨC, khoá kỹ thuật biến mất khỏi
  // giao diện (vẫn giữ nguyên trong `onChange('sketch'|'pro')` — đổi khoá là vỡ persist).
  // 08/08 — theo chốt 07/08 "ĐỊNH NGHĨA BA CHẶNG" (docs/00-CHOT.md): chặng 2D chỉ còn HAI mode
  // hiển thị `Sơ phác ↔ Chuyên` (bảng: sketch = "Sơ phác | Sketch mode" · pro = "Chuyên | Pro
  // mode" — Chuyên "bao gồm luôn Revit 2D"). Nút thứ ba "Nội thất" (bấm ra khoá `revit`) BỎ khỏi
  // UI; khoá kỹ thuật `revit` GIỮ NGUYÊN trong type/store/persist (CadMode, LS_CAD_MODE) — người
  // dùng cũ còn lưu cadMode='revit' vẫn chạy như 'pro' (shouldShowProTools coi revit = pro,
  // lib/cad/store.ts:156) và nút "Chuyên" sáng cho họ (`mode==='pro'||mode==='revit'` dưới đây).
  // Cặp nhãn [vi, en] khớp khai báo mode-registry ở components/studio/CadStageScreen.tsx:
  //   `'2d/sketch' → ['Sơ phác','Sketch']` · `'2d/pro' → ['Chuyên','Pro']`.
  // Không đọc thẳng registry vì nó chỉ được nạp khi module CadStageScreen chạy — toolbar còn
  // dùng ở ngữ cảnh khác thì `getMode()` sẽ undefined.
  const tr = useT();
  const segBtn = (active: boolean): React.CSSProperties => ({
    appearance: 'none',
    // 2.1.8.l (30/07) — bật KHÔNG tô đặc nữa: trên bản vẽ kỹ thuật, khối màu đặc thắng chính bản
    // vẽ (cùng luật đã áp cho "Chạy flow" và CadTouchDock — xem safe-area.ts/CadTouchDock.tsx).
    border: active ? '1px solid var(--accent-ring)' : '1px solid transparent',
    background: active ? 'var(--accent-soft)' : 'transparent',
    color: active ? 'var(--accent)' : 'var(--t2)',
    fontFamily: 'inherit',
    fontSize: 12,
    fontWeight: 650,
    // Cùng luật với btn(): công tắc mode cũng phải đủ to để bấm bằng ngón ở Sketch.
    height: pro ? 30 : 40,
    padding: pro ? '0 12px' : '0 18px',
    borderRadius: 999,
    cursor: 'pointer',
    touchAction: 'manipulation',
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
    >
      {/* 05/08 VIỆC 2 — `title=` cũ gộp mô tả CẢ BA mode vào một chuỗi 3 câu treo trên khung bọc:
          trỏ vào nút nào cũng ra y hệt đoạn văn đó, người dùng phải tự dò câu nào nói về nút mình
          đang trỏ. Nay tách thành 3 Tooltip riêng, mỗi nút chỉ nói phần của nó. */}
      <Tooltip label={tr('Sơ phác', 'Sketch')} desc="Vẽ bằng ngón tay: bộ công cụ tối giản, nút cỡ lớn, có cụm nút cảm ứng thay phím tắt.">
        <button type="button" onClick={() => onChange('sketch')} style={segBtn(mode === 'sketch')}>
          {tr('Sơ phác', 'Sketch')}
        </button>
      </Tooltip>
      {/* `mode==='revit'` cũng sáng nút này — persist cũ cadMode='revit' không bị "không nút
          nào bật" (revit = siêu tập của pro, xem comment đầu ModeSwitch). */}
      <Tooltip label={tr('Chuyên', 'Pro')} desc="Tối ưu chuột + bàn phím: đủ công cụ CAD chính xác (toạ độ, ghi kích thước, Fillet/Chamfer, Array…) + bộ cấu kiện BIM nội thất (Revit 2D).">
        <button type="button" onClick={() => onChange('pro')} style={segBtn(mode === 'pro' || mode === 'revit')}>
          {tr('Chuyên', 'Pro')}
        </button>
      </Tooltip>
    </div>
  );
}

/** Cạnh nút theo chế độ — Sketch ưu tiên NGÓN TAY (≥44px, chuẩn vùng chạm Apple HIG/Material),
 * Pro ưu tiên chuột nên gọn hơn nhưng vẫn ≥36px (nâng từ 34px — nghiệm thu ticket "THANH TOOL
 * 2D DESIGN" 04/08: "nút thường ≥36px"). Đây là khác biệt "cầm nắm" rõ nhất giữa 2 mode; mọi nút
 * trên pill đều đi qua hàm này nên chỉ cần đổi một chỗ.
 * `big` (VIỆC 2, cùng ticket) — 6 lệnh hay dùng nhất TO hơn ~1.4 lần, luôn ≥44px dù mode nào. */
function btnSize(pro: boolean, big = false): number {
  const base = pro ? 36 : 44;
  return big ? Math.max(44, Math.round(base * 1.4)) : base;
}

function btn(active: boolean, disabled = false, pro = false, big = false): React.CSSProperties {
  const s = btnSize(pro, big);
  return {
    display: 'grid',
    placeItems: 'center',
    width: s,
    height: s,
    borderRadius: 999,
    // 2.1.8.l (30/07) — ghost khi bật, không tô đặc (xem ghi chú segBtn() phía trên, cùng lý do).
    border: active ? '1px solid var(--accent-ring)' : '1px solid transparent',
    background: active ? 'var(--accent-soft)' : 'transparent',
    color: active ? 'var(--accent)' : 'var(--t2)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.35 : 1,
    // Cảm ứng: bỏ trễ 300ms + chặn phóng to 2-chạm khi bấm nhanh liên tiếp (mode Sketch).
    touchAction: 'manipulation',
    transition: 'background .15s, color .15s',
  };
}
