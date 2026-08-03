'use client';

/**
 * components/BottomToolbar.tsx — G1c (Hoà chốt phương án B, `docs/SPEC-DESIGN-SYSTEM-IF.md` §2c
 * "LUẬT CHỐNG NGÔ NGHÊ" + §2d "HÌNH HỌC APPLE"): MỘT capsule duy nhất, MỘT bóng — không còn pill
 * "Vẽ 3D" rời đứng cạnh (G1/G1b cũ, đã xoá `Render3DToggleButton.tsx`). Thang bo ĐỒNG TÂM:
 * bar cao 44 → r22, đệm trong 5 → nút 34 → r17 (=22−5, tự capsule) → icon 15 → cách 5 giữa mọi
 * phần tử (kể cả quanh vạch chia) — không số lẻ tuỳ hứng (§2c luật 2).
 */

import { motion } from 'framer-motion';
import { MousePointer2, Hand, Frame as FrameIcon, Pen, StickyNote, Undo2, Redo2, Minus, Plus, Maximize, LayoutGrid, Grid3x3, Command } from 'lucide-react';
import { useReactFlow, useViewport } from '@xyflow/react';
import { useFlowStore } from '@/lib/store';
import { springSheet, easeApple } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { modKey, modShiftKey } from '@/lib/kbd';
import ModeSwitchCell from '@/components/render-studio/ModeSwitchCell';

export function BottomToolbar({ onAddNote }: { onAddNote: () => void }) {
  const tool = useFlowStore((s) => s.tool);
  const setTool = useFlowStore((s) => s.setTool);
  const undo = useFlowStore((s) => s.undo);
  const redo = useFlowStore((s) => s.redo);
  const canUndo = useFlowStore((s) => s.past.length > 0);
  const canRedo = useFlowStore((s) => s.future.length > 0);
  const snapGrid = useFlowStore((s) => s.snapGrid);
  const toggleSnap = useFlowStore((s) => s.toggleSnap);
  const autoLayout = useFlowStore((s) => s.autoLayout);
  const setPaletteOpen = useFlowStore((s) => s.setPaletteOpen);
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const { zoom } = useViewport();

  // §2d bo đồng tâm: bar r22, đệm 5 → nút r17 (=22−5, tự thành capsule ở kích 34).
  const btnClass = (active = false, disabled = false) =>
    cn(
      'grid shrink-0 place-items-center rounded-[17px] transition-colors',
      active ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'text-[var(--t3)] hover:bg-[var(--hover)] hover:text-[var(--t1)]',
      disabled && 'opacity-30 pointer-events-none',
    );

  // Nút icon với micro-press kiểu iOS (không hover-scale để không rung khi rê chuột qua thanh).
  const Btn = ({
    active = false,
    disabled = false,
    title,
    onClick,
    children,
  }: {
    active?: boolean;
    disabled?: boolean;
    title: string;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <motion.button
      whileTap={{ scale: 0.9 }}
      transition={{ duration: 0.12, ease: easeApple }}
      title={title}
      style={{ height: 34, width: 34 }}
      className={btnClass(active, disabled)}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );

  // Vạch chia — self-stretch ăn theo chiều cao nội dung bar (34, = 44 − 2×5 đệm), KHÔNG số riêng.
  const Divider = () => <div className="w-px shrink-0 self-stretch bg-[var(--border)]" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      transition={springSheet}
      className="if-bottombar mat-card no-scrollbar pointer-events-auto absolute bottom-4 left-1/2 z-20 flex max-w-[calc(100vw-1rem)] items-center gap-[5px] overflow-x-auto border border-[var(--mat-hairline)] shadow-[0_8px_24px_rgba(40,38,35,.14)]"
      style={{ height: 44, borderRadius: 22, padding: 5 }}
    >
      <Btn title="Select (V)" active={tool === 'select'} onClick={() => setTool('select')}>
        <MousePointer2 size={15} />
      </Btn>
      <Btn title="Pan (Space giữ / H)" active={tool === 'pan'} onClick={() => setTool('pan')}>
        <Hand size={15} />
      </Btn>
      {/* G2 phần (1) — kéo-vẽ khung phòng trên nền canvas (SPEC-CHANG2-UI-2MODE §1 thứ tự
          "chọn · pan · frame"). Logic vẽ ở FlowCanvas.tsx (pointerdown/move/up khi tool='frame'). */}
      <Btn title="Khung phòng — kéo vẽ khung trên nền canvas" active={tool === 'frame'} onClick={() => setTool('frame')}>
        <FrameIcon size={15} />
      </Btn>
      {/* G4-1a (đêm 04/08) — lối vào bảng bút vẽ tay: DrawToolbar không còn đứng thường trực,
          chỉ hiện khi 1 tool vẽ active. Nút này bật tool 'pen' → bảng bút trồi ra mép trái. */}
      <Btn
        title="Bút vẽ tay — mở bảng bút (bút/marker/tô sáng/tẩy)"
        active={tool === 'pen' || tool === 'marker' || tool === 'highlight' || tool === 'eraser'}
        onClick={() => setTool('pen')}
      >
        <Pen size={15} />
      </Btn>
      <Btn title="Sticky note" onClick={onAddNote}>
        <StickyNote size={15} />
      </Btn>
      <Divider />
      <Btn title={`Undo (${modKey('Z')})`} disabled={!canUndo} onClick={undo}>
        <Undo2 size={15} />
      </Btn>
      <Btn title={`Redo (${modShiftKey('Z')})`} disabled={!canRedo} onClick={redo}>
        <Redo2 size={15} />
      </Btn>
      <Divider />
      <Btn title="Zoom out" onClick={() => zoomOut()}>
        <Minus size={15} />
      </Btn>
      <span className="w-11 shrink-0 text-center text-[11px] tabular-nums text-[var(--t3)]">
        {Math.round(zoom * 100)}%
      </span>
      <Btn title="Zoom in" onClick={() => zoomIn()}>
        <Plus size={15} />
      </Btn>
      <Btn title="Fit view" onClick={() => fitView({ padding: 0.2 })}>
        <Maximize size={15} />
      </Btn>
      <Divider />
      <Btn title="Tự sắp xếp graph (auto-layout)" onClick={() => autoLayout()}>
        <LayoutGrid size={15} />
      </Btn>
      <Btn title={`Snap lưới: ${snapGrid ? 'đang bật' : 'đang tắt'}`} active={snapGrid} onClick={() => toggleSnap()}>
        <Grid3x3 size={15} />
      </Btn>
      <Btn title={`Command palette (${modKey('K')})`} onClick={() => setPaletteOpen(true)}>
        <Command size={15} />
      </Btn>
      <Divider />
      <ModeSwitchCell />
    </motion.div>
  );
}
