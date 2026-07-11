'use client';

/**
 * Sketch Studio — modal vẽ tay tự do, mở từ node util.sketchpad (param kind 'sketch').
 * Portal thẳng ra document.body: node cha (InteriorNode) là motion.div có transform khi
 * animate → nếu không portal, `position:fixed` bên trong sẽ bị "giam" theo ancestor có
 * transform (đúng bug đã gặp với MobileMenu — xem RESUME.md mục 10.C). Portal tránh hẳn.
 *
 * KHÔNG tái dùng MaskPainterModal/AnnotateModal — cơ chế riêng (nhiều tool: brush/eraser/
 * line/rect/ellipse, palette màu vật liệu, undo/redo), theo đúng yêu cầu "tạo cơ chế
 * riêng cho vẽ-tay-tự-do".
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Paintbrush } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { useSketchStore } from '@/lib/sketch/sketchStore';
import { DEFAULT_SKETCH_COLOR } from '@/lib/sketch/palette';
import { fade, modalScale, pressable, pressableIcon } from '@/lib/motion';
import { SketchCanvas, type SketchCanvasHandle, type SketchTool } from '@/components/sketch/SketchCanvas';
import { SketchToolbar } from '@/components/sketch/SketchToolbar';

const CANVAS_W = 960;
const CANVAS_H = 640;

/** Ảnh nền để đồ theo: output đã chạy của upstream nối vào port 'background', hoặc
 *  file của Import Image chưa chạy — cùng kỹ thuật với MaskPainterModal/AnnotateModal. */
function useBackgroundImage(nodeId: string | null): string | null {
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  if (!nodeId) return null;
  const edge = edges.find((e) => e.target === nodeId && e.targetHandle === 'background');
  if (!edge) return null;
  const source = nodes.find((n) => n.id === edge.source);
  if (!source) return null;
  const fromRun = source.data.run.outputs?.[edge.sourceHandle ?? ''];
  if (fromRun && fromRun.dataType === 'image') return String(fromRun.value);
  if (source.data.defType === 'input.image' && source.data.params.file) return String(source.data.params.file);
  return null;
}

export function SketchStudioModal() {
  const nodeId = useSketchStore((s) => s.openNodeId);
  const close = useSketchStore((s) => s.close);
  const updateParam = useFlowStore((s) => s.updateParam);
  const existingSketch = useFlowStore((s) =>
    nodeId ? (s.nodes.find((n) => n.id === nodeId)?.data.params.sketch as string | undefined) : undefined,
  );
  const backgroundImage = useBackgroundImage(nodeId);

  const canvasHandle = useRef<SketchCanvasHandle>(null);
  const [tool, setTool] = useState<SketchTool>('brush');
  const [color, setColor] = useState(DEFAULT_SKETCH_COLOR);
  const [thickness, setThickness] = useState(6);
  const [history, setHistory] = useState({ canUndo: false, canRedo: false });
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Esc để đóng — cùng quy ước với Mask/Annotate.
  useEffect(() => {
    if (!nodeId) return;
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [nodeId, close]);

  const save = useCallback(() => {
    if (!nodeId || !canvasHandle.current) return;
    const dataUrl = canvasHandle.current.exportDataUrl('image/png');
    updateParam(nodeId, 'sketch', dataUrl);
    close();
  }, [nodeId, updateParam, close]);

  // key riêng cho SketchCanvas theo nodeId — buộc remount (reset undo stack) mỗi lần mở node khác.
  const canvasKey = useMemo(() => `${nodeId}-${backgroundImage ? 'bg' : 'nobg'}`, [nodeId, backgroundImage]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {nodeId && (
        <motion.div
          variants={fade}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="mat-overlay fixed inset-0 z-50 grid place-items-center p-6"
        >
          <motion.div
            variants={modalScale}
            className="mat-card flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-[20px] border border-[var(--mat-hairline)] shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
              <Paintbrush size={15} className="text-[var(--accent)]" />
              <span className="flex-1 text-sm font-medium text-[var(--t1)]">Sketch Studio — vẽ tay tự do</span>
              <motion.button
                {...pressableIcon}
                onClick={close}
                className="grid h-7 w-7 place-items-center rounded-[10px] text-[var(--t4)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--t2)]"
              >
                <X size={15} />
              </motion.button>
            </div>

            <div className="grid flex-1 place-items-center overflow-auto bg-[var(--bg)] p-4">
              <SketchCanvas
                key={canvasKey}
                ref={canvasHandle}
                width={CANVAS_W}
                height={CANVAS_H}
                backgroundImage={backgroundImage}
                initialDrawing={existingSketch ?? null}
                tool={tool}
                color={color}
                thickness={thickness}
                onHistoryChange={setHistory}
              />
            </div>

            <p className="px-4 pb-1 text-[10px] leading-relaxed text-[var(--t5)]">
              {backgroundImage
                ? 'Có ảnh nền (mờ) để đồ theo — nối ảnh vào input "Ảnh nền" của node để dùng tính năng này.'
                : 'Vẽ tự do trên nền trắng — hoặc nối 1 ảnh vào input "Ảnh nền" của node để đồ theo.'}
            </p>

            <SketchToolbar
              tool={tool}
              onToolChange={setTool}
              color={color}
              onColorChange={setColor}
              thickness={thickness}
              onThicknessChange={setThickness}
              canUndo={history.canUndo}
              canRedo={history.canRedo}
              onUndo={() => canvasHandle.current?.undo()}
              onRedo={() => canvasHandle.current?.redo()}
              onClear={() => canvasHandle.current?.clear()}
            />

            <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] px-4 py-3">
              <motion.button
                {...pressable}
                onClick={save}
                className="flex items-center gap-1.5 rounded-[10px] bg-[var(--accent-strong)] px-3.5 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-[var(--accent)]"
              >
                <Check size={13} /> Lưu vào node
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
