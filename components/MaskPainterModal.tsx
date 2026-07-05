'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Paintbrush, Eraser, Trash2, Check } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { fade, modalScale, pressable, pressableIcon } from '@/lib/motion';
import { cn } from '@/lib/utils';

/** Lấy ảnh nguồn cho node mask painter: output của upstream, hoặc file của Import Image chưa chạy. */
function useSourceImage(nodeId: string | null): string | null {
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  if (!nodeId) return null;
  const edge = edges.find((e) => e.target === nodeId && e.targetHandle === 'image');
  if (!edge) return null;
  const source = nodes.find((n) => n.id === edge.source);
  if (!source) return null;
  const fromRun = source.data.run.outputs?.[edge.sourceHandle ?? ''];
  if (fromRun && fromRun.dataType === 'image') return String(fromRun.value);
  if (source.data.defType === 'input.image' && source.data.params.file)
    return String(source.data.params.file);
  return null;
}

export function MaskPainterModal() {
  const nodeId = useFlowStore((s) => s.maskEditorNodeId);
  const setMaskEditorNodeId = useFlowStore((s) => s.setMaskEditorNodeId);
  const updateParam = useFlowStore((s) => s.updateParam);
  const existingMask = useFlowStore((s) =>
    nodeId ? (s.nodes.find((n) => n.id === nodeId)?.data.params.mask as string | undefined) : undefined,
  );
  const sourceImage = useSourceImage(nodeId);

  const displayRef = useRef<HTMLCanvasElement>(null);
  const maskRef = useRef<HTMLCanvasElement | null>(null); // offscreen, kích thước gốc
  const imgRef = useRef<HTMLImageElement | null>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const [brush, setBrush] = useState(48);
  const [eraser, setEraser] = useState(false);
  const [ready, setReady] = useState(false);

  const redraw = useCallback(() => {
    const display = displayRef.current;
    const img = imgRef.current;
    const mask = maskRef.current;
    if (!display || !img || !mask) return;
    const ctx = display.getContext('2d')!;
    ctx.clearRect(0, 0, display.width, display.height);
    ctx.drawImage(img, 0, 0);
    // overlay mask tím bán trong suốt
    ctx.save();
    ctx.globalAlpha = 0.55;
    const tint = document.createElement('canvas');
    tint.width = mask.width;
    tint.height = mask.height;
    const tctx = tint.getContext('2d')!;
    tctx.drawImage(mask, 0, 0);
    tctx.globalCompositeOperation = 'source-in';
    tctx.fillStyle = '#8b7cf7';
    tctx.fillRect(0, 0, tint.width, tint.height);
    ctx.drawImage(tint, 0, 0);
    ctx.restore();
  }, []);

  // Khởi tạo canvas khi mở modal
  useEffect(() => {
    if (!nodeId || !sourceImage) return;
    setReady(false);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const display = displayRef.current;
      if (!display) return;
      display.width = img.naturalWidth;
      display.height = img.naturalHeight;

      const mask = document.createElement('canvas');
      mask.width = img.naturalWidth;
      mask.height = img.naturalHeight;
      maskRef.current = mask;

      const finish = () => {
        setReady(true);
        redraw();
      };
      // load mask cũ (đen/trắng) → chuyển thành alpha strokes trắng
      if (existingMask) {
        const old = new Image();
        old.onload = () => {
          const mctx = mask.getContext('2d')!;
          mctx.drawImage(old, 0, 0, mask.width, mask.height);
          const data = mctx.getImageData(0, 0, mask.width, mask.height);
          const px = data.data;
          for (let i = 0; i < px.length; i += 4) {
            const lum = px[i];
            px[i] = 255;
            px[i + 1] = 255;
            px[i + 2] = 255;
            px[i + 3] = lum > 127 ? 255 : 0;
          }
          mctx.putImageData(data, 0, 0);
          finish();
        };
        old.onerror = finish;
        old.src = existingMask;
      } else {
        finish();
      }
    };
    img.src = sourceImage;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId, sourceImage]);

  const canvasPoint = (e: React.PointerEvent) => {
    const display = displayRef.current!;
    const rect = display.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * display.width,
      y: ((e.clientY - rect.top) / rect.height) * display.height,
    };
  };

  const stroke = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const mask = maskRef.current;
    if (!mask) return;
    const ctx = mask.getContext('2d')!;
    ctx.globalCompositeOperation = eraser ? 'destination-out' : 'source-over';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = brush;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    redraw();
  };

  const close = () => setMaskEditorNodeId(null);

  const save = () => {
    const mask = maskRef.current;
    if (!mask || !nodeId) return;
    // export: nền đen + strokes trắng
    const out = document.createElement('canvas');
    out.width = mask.width;
    out.height = mask.height;
    const octx = out.getContext('2d')!;
    octx.fillStyle = '#000000';
    octx.fillRect(0, 0, out.width, out.height);
    octx.drawImage(mask, 0, 0);
    updateParam(nodeId, 'mask', out.toDataURL('image/png'));
    close();
  };

  // Esc để đóng
  useEffect(() => {
    if (!nodeId) return;
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId]);

  return (
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
        {/* header */}
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
          <Paintbrush size={15} className="text-[var(--accent)]" />
          <span className="flex-1 text-sm font-medium text-[var(--t1)]">Mask Painter</span>
          <motion.button {...pressableIcon} onClick={close} className="grid h-7 w-7 place-items-center rounded-[10px] text-[var(--t4)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--t2)]">
            <X size={15} />
          </motion.button>
        </div>

        {/* canvas */}
        <div className="grid flex-1 place-items-center overflow-auto bg-[var(--bg)] p-4">
          {sourceImage ? (
            <canvas
              ref={displayRef}
              data-testid="mask-canvas"
              className="max-h-[60vh] max-w-full cursor-crosshair rounded-[12px]"
              style={{ touchAction: 'none' }}
              onPointerDown={(e) => {
                if (!ready) return;
                drawing.current = true;
                const p = canvasPoint(e);
                lastPoint.current = p;
                stroke(p, p);
                e.currentTarget.setPointerCapture?.(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (!drawing.current || !ready) return;
                const p = canvasPoint(e);
                if (lastPoint.current) stroke(lastPoint.current, p);
                lastPoint.current = p;
              }}
              onPointerUp={() => {
                drawing.current = false;
                lastPoint.current = null;
              }}
            />
          ) : (
            <p className="max-w-sm text-center text-sm leading-relaxed text-[var(--t4)]">
              Chưa có ảnh nguồn. Nối một node ảnh vào input <span className="text-[var(--t2)]">Image</span> (và
              chạy node đó nếu là node AI) rồi mở lại.
            </p>
          )}
        </div>

        {/* toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border)] px-4 py-3">
          <motion.button
            {...pressable}
            onClick={() => setEraser(false)}
            className={cn(
              'flex items-center gap-1.5 rounded-[10px] border px-2.5 py-1.5 text-xs transition-colors',
              !eraser ? 'border-[var(--accent-ring)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-[var(--border)] text-[var(--t3)] hover:bg-[var(--hover)]',
            )}
          >
            <Paintbrush size={13} /> Brush
          </motion.button>
          <motion.button
            {...pressable}
            onClick={() => setEraser(true)}
            className={cn(
              'flex items-center gap-1.5 rounded-[10px] border px-2.5 py-1.5 text-xs transition-colors',
              eraser ? 'border-[var(--accent-ring)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-[var(--border)] text-[var(--t3)] hover:bg-[var(--hover)]',
            )}
          >
            <Eraser size={13} /> Eraser
          </motion.button>
          <label className="flex items-center gap-2 text-xs text-[var(--t3)]">
            Size
            <input
              type="range"
              min={8}
              max={160}
              value={brush}
              onChange={(e) => setBrush(Number(e.target.value))}
              className="w-28 accent-[var(--accent)]"
            />
            <span className="w-7 tabular-nums">{brush}</span>
          </label>
          <motion.button
            {...pressable}
            onClick={() => {
              const mask = maskRef.current;
              if (!mask) return;
              mask.getContext('2d')!.clearRect(0, 0, mask.width, mask.height);
              redraw();
            }}
            className="flex items-center gap-1.5 rounded-[10px] border border-[var(--border)] px-2.5 py-1.5 text-xs text-[var(--t3)] transition-colors hover:bg-[var(--hover)]"
          >
            <Trash2 size={13} /> Clear
          </motion.button>
          <div className="flex-1" />
          <motion.button
            {...pressable}
            onClick={save}
            disabled={!sourceImage || !ready}
            className="flex items-center gap-1.5 rounded-[10px] bg-[var(--accent-strong)] px-3.5 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-[var(--accent)] disabled:opacity-40"
          >
            <Check size={13} /> Lưu mask
          </motion.button>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
