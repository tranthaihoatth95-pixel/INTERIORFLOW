'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Paintbrush, Type, Trash2, Check } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { fade, modalScale, pressable, pressableIcon } from '@/lib/motion';
import { cn } from '@/lib/utils';

const COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#38bdf8', '#ffffff'];

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

export function AnnotateModal() {
  const nodeId = useFlowStore((s) => s.annotateNodeId);
  const setAnnotateNodeId = useFlowStore((s) => s.setAnnotateNodeId);
  const updateParam = useFlowStore((s) => s.updateParam);
  const sourceImage = useSourceImage(nodeId);

  const displayRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef<HTMLCanvasElement | null>(null); // layer chú thích
  const imgRef = useRef<HTMLImageElement | null>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const [tool, setTool] = useState<'brush' | 'text'>('brush');
  const [color, setColor] = useState(COLORS[0]);
  const [brush, setBrush] = useState(8);
  const [text, setText] = useState('');
  const [ready, setReady] = useState(false);

  const redraw = useCallback(() => {
    const display = displayRef.current;
    const img = imgRef.current;
    const layer = drawRef.current;
    if (!display || !img || !layer) return;
    const ctx = display.getContext('2d')!;
    ctx.clearRect(0, 0, display.width, display.height);
    ctx.drawImage(img, 0, 0);
    ctx.drawImage(layer, 0, 0);
  }, []);

  useEffect(() => {
    if (!nodeId || !sourceImage) return;
    setReady(false);
    const img = new Image();
    if (!sourceImage.startsWith('data:')) img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      const display = displayRef.current;
      if (!display) return;
      display.width = img.naturalWidth;
      display.height = img.naturalHeight;
      const layer = document.createElement('canvas');
      layer.width = img.naturalWidth;
      layer.height = img.naturalHeight;
      drawRef.current = layer;
      setReady(true);
      redraw();
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

  const close = () => setAnnotateNodeId(null);

  const save = () => {
    const display = displayRef.current;
    if (!display || !nodeId) return;
    try {
      updateParam(nodeId, 'annotated', display.toDataURL('image/jpeg', 0.92));
      close();
    } catch {
      useFlowStore.getState().setConnectError('Ảnh bị chặn CORS — không export được. Dùng ảnh upload/output AI.');
    }
  };

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
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
          <Type size={15} className="text-[var(--accent)]" />
          <span className="flex-1 text-sm font-medium text-[var(--t1)]">Annotate — ghi chú lên ảnh</span>
          <motion.button {...pressableIcon} onClick={close} className="grid h-7 w-7 place-items-center rounded-[10px] text-[var(--t4)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--t2)]">
            <X size={15} />
          </motion.button>
        </div>

        <div className="grid flex-1 place-items-center overflow-auto bg-[var(--bg)] p-4">
          {sourceImage ? (
            <canvas
              ref={displayRef}
              data-testid="annotate-canvas"
              className={cn('max-h-[60vh] max-w-full rounded-[12px]', tool === 'brush' ? 'cursor-crosshair' : 'cursor-text')}
              style={{ touchAction: 'none' }}
              onPointerDown={(e) => {
                if (!ready) return;
                const p = canvasPoint(e);
                const layer = drawRef.current!;
                const ctx = layer.getContext('2d')!;
                if (tool === 'text') {
                  if (!text.trim()) return;
                  const size = Math.max(20, layer.width / 30);
                  ctx.font = `600 ${size}px system-ui, sans-serif`;
                  ctx.fillStyle = color;
                  ctx.shadowColor = 'rgba(0,0,0,0.6)';
                  ctx.shadowBlur = 6;
                  ctx.fillText(text, p.x, p.y);
                  ctx.shadowBlur = 0;
                  redraw();
                  return;
                }
                drawing.current = true;
                lastPoint.current = p;
                ctx.strokeStyle = color;
                ctx.lineWidth = brush * (layer.width / 800);
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x, p.y);
                ctx.stroke();
                redraw();
                e.currentTarget.setPointerCapture?.(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (!drawing.current || tool !== 'brush') return;
                const p = canvasPoint(e);
                const ctx = drawRef.current!.getContext('2d')!;
                ctx.beginPath();
                ctx.moveTo(lastPoint.current!.x, lastPoint.current!.y);
                ctx.lineTo(p.x, p.y);
                ctx.stroke();
                lastPoint.current = p;
                redraw();
              }}
              onPointerUp={() => {
                drawing.current = false;
                lastPoint.current = null;
              }}
            />
          ) : (
            <p className="max-w-sm text-center text-sm leading-relaxed text-[var(--t4)]">
              Chưa có ảnh nguồn — nối ảnh vào input <span className="text-[var(--t2)]">Image</span> rồi mở lại.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border)] px-4 py-3">
          <motion.button
            {...pressable}
            onClick={() => setTool('brush')}
            className={cn(
              'flex items-center gap-1.5 rounded-[10px] border px-2.5 py-1.5 text-xs transition-colors',
              tool === 'brush' ? 'border-[var(--accent-ring)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-[var(--border)] text-[var(--t3)] hover:bg-[var(--hover)]',
            )}
          >
            <Paintbrush size={13} /> Vẽ
          </motion.button>
          <motion.button
            {...pressable}
            onClick={() => setTool('text')}
            className={cn(
              'flex items-center gap-1.5 rounded-[10px] border px-2.5 py-1.5 text-xs transition-colors',
              tool === 'text' ? 'border-[var(--accent-ring)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-[var(--border)] text-[var(--t3)] hover:bg-[var(--hover)]',
            )}
          >
            <Type size={13} /> Text
          </motion.button>
          {tool === 'text' && (
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Gõ chú thích rồi click lên ảnh…"
              className="w-52 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-2 py-1.5 text-xs text-[var(--t1)] outline-none focus:border-[var(--accent-ring)]"
            />
          )}
          <div className="flex items-center gap-1.5">
            {COLORS.map((c) => (
              <motion.button
                key={c}
                {...pressableIcon}
                onClick={() => setColor(c)}
                className={cn('h-5 w-5 rounded-full border-2', color === c ? 'border-[var(--t1)]' : 'border-transparent')}
                style={{ background: c }}
              />
            ))}
          </div>
          {tool === 'brush' && (
            <label className="flex items-center gap-2 text-xs text-[var(--t3)]">
              Size
              <input type="range" min={2} max={30} value={brush} onChange={(e) => setBrush(Number(e.target.value))} className="w-24 accent-[var(--accent)]" />
            </label>
          )}
          <motion.button
            {...pressable}
            onClick={() => {
              const layer = drawRef.current;
              if (!layer) return;
              layer.getContext('2d')!.clearRect(0, 0, layer.width, layer.height);
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
            <Check size={13} /> Lưu
          </motion.button>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
