'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, RotateCcw, AlertTriangle, Frame } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { useWarpStore } from '@/lib/warp/warpStore';
import { useSourceImage } from '@/lib/nodes/source-image';
import {
  DEFAULT_CORNERS,
  parseCorners,
  serializeCorners,
  warpImageToCanvas,
  type Corners,
} from '@/lib/warp/warp';
import { fade, modalScale, pressable, pressableIcon } from '@/lib/motion';

/**
 * Kéo 4 góc phối cảnh cho `util.warp`: xem TRỰC TIẾP pattern đã warp nằm trên ảnh phối cảnh
 * (input `base`) trong lúc kéo. Không có ảnh phối cảnh vẫn dùng được — kéo trên nền ô lưới.
 * Toàn bộ client-side, 0 credit.
 */
const LABELS = ['Trên trái', 'Trên phải', 'Dưới phải', 'Dưới trái'];

export function WarpCornersModal() {
  const nodeId = useWarpStore((s) => s.openNodeId);
  const close = useWarpStore((s) => s.close);
  const updateParam = useFlowStore((s) => s.updateParam);
  const stored = useFlowStore((s) =>
    nodeId ? (s.nodes.find((n) => n.id === nodeId)?.data.params.corners as string | undefined) : undefined,
  );
  const overlaySrc = useSourceImage(nodeId, 'image');
  const baseSrc = useSourceImage(nodeId, 'base');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLImageElement | null>(null);
  const baseRef = useRef<HTMLImageElement | null>(null);
  const dragIdx = useRef<number | null>(null);

  const [corners, setCorners] = useState<Corners>(DEFAULT_CORNERS);
  const [ready, setReady] = useState(false);

  const redraw = useCallback(
    (c: Corners) => {
      const canvas = canvasRef.current;
      const overlay = overlayRef.current;
      if (!canvas || !overlay) return;
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const base = baseRef.current;
      if (base) {
        ctx.drawImage(base, 0, 0, canvas.width, canvas.height);
      } else {
        // nền ô lưới để thấy vùng trong suốt
        ctx.fillStyle = '#1c1c1e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        const step = Math.max(24, Math.round(canvas.width / 24));
        for (let x = 0; x < canvas.width; x += step) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += step) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
      }

      const warped = warpImageToCanvas(overlay, c, {
        width: canvas.width,
        height: canvas.height,
        grid: 14, // preview: lưới thưa hơn cho mượt khi kéo; lúc chạy node dùng lưới mịn
      });
      ctx.drawImage(warped, 0, 0);

      // khung + 4 tay cầm
      ctx.save();
      ctx.strokeStyle = 'rgba(139,124,247,0.95)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      c.forEach((p, i) => {
        const x = p.x * canvas.width;
        const y = p.y * canvas.height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.stroke();
      c.forEach((p, i) => {
        const x = p.x * canvas.width;
        const y = p.y * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(139,124,247,0.95)';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#fff';
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = '600 11px system-ui';
        ctx.fillText(String(i + 1), x + 12, y - 10);
      });
      ctx.restore();
    },
    [],
  );

  useEffect(() => {
    if (!nodeId || !overlaySrc) return;
    setReady(false);
    setCorners(parseCorners(stored));
    let cancelled = false;
    const load = (src: string) =>
      new Promise<HTMLImageElement | null>((res) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => res(img);
        img.onerror = () => res(null);
        img.src = src;
      });
    void (async () => {
      const [ov, bs] = await Promise.all([load(overlaySrc), baseSrc ? load(baseSrc) : Promise.resolve(null)]);
      if (cancelled || !ov) return;
      overlayRef.current = ov;
      baseRef.current = bs;
      const canvas = canvasRef.current;
      if (canvas) {
        // khung xem trước theo ảnh phối cảnh nếu có, không thì 4:3
        const w = bs ? bs.naturalWidth || bs.width : 1200;
        const h = bs ? bs.naturalHeight || bs.height : 900;
        const scale = Math.min(1, 1200 / w);
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId, overlaySrc, baseSrc]);

  useEffect(() => {
    if (ready) redraw(corners);
  }, [ready, corners, redraw]);

  const pointAt = (e: React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    };
  };

  const onDown = (e: React.PointerEvent) => {
    const p = pointAt(e);
    let best = 0;
    let bestD = Infinity;
    corners.forEach((c, i) => {
      const d = (c.x - p.x) ** 2 + (c.y - p.y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    dragIdx.current = best;
    setCorners((cs) => cs.map((c, i) => (i === best ? p : c)) as Corners);
  };

  const onMove = (e: React.PointerEvent) => {
    if (dragIdx.current == null) return;
    const p = pointAt(e);
    const idx = dragIdx.current;
    setCorners((cs) => cs.map((c, i) => (i === idx ? p : c)) as Corners);
  };

  const onUp = () => {
    dragIdx.current = null;
  };

  const save = () => {
    if (!nodeId) return;
    updateParam(nodeId, 'corners', serializeCorners(corners));
    close();
  };

  useEffect(() => {
    if (!nodeId) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [nodeId, close]);

  return (
    <AnimatePresence>
      {nodeId && (
        <motion.div
          variants={fade}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={() => close()}
        >
          <motion.div
            variants={modalScale}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex max-h-full w-[min(96vw,1080px)] flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-2.5">
              <Frame size={15} className="text-[var(--accent)]" />
              <span className="flex-1 text-sm font-medium text-[var(--t1)]">
                Kéo 4 góc phối cảnh · Perspective Warp
              </span>
              <motion.button
                {...pressableIcon}
                onClick={close}
                className="grid h-7 w-7 place-items-center rounded-md text-[var(--t4)] hover:bg-[var(--hover)] hover:text-[var(--t2)]"
              >
                <X size={14} />
              </motion.button>
            </div>

            {!overlaySrc ? (
              <div className="flex items-center gap-2 px-4 py-8 text-xs text-[var(--t3)]">
                <AlertTriangle size={14} className="text-amber-400" />
                Nối ảnh cần warp (vd pattern) vào input <b>Image</b> trước. Nối thêm ảnh phối cảnh vào
                input <b>Base</b> để canh góc trực tiếp trên tường.
              </div>
            ) : (
              <>
                <div className="min-h-0 flex-1 overflow-auto bg-[var(--field)] p-3">
                  <canvas
                    ref={canvasRef}
                    onPointerDown={onDown}
                    onPointerMove={onMove}
                    onPointerUp={onUp}
                    onPointerLeave={onUp}
                    className="mx-auto block max-h-[58vh] max-w-full cursor-move rounded-lg"
                    style={{ touchAction: 'none' }}
                  />
                </div>
                <div className="flex items-center gap-2 border-t border-[var(--border)] px-4 py-2.5">
                  <p className="flex-1 text-[10px] leading-relaxed text-[var(--t5)]">
                    Kéo 4 điểm về đúng 4 góc mặt vách trong ảnh phối cảnh ({LABELS.join(' · ')}).
                    {baseSrc ? '' : ' (Chưa nối ảnh phối cảnh — đang canh trên nền lưới.)'}
                  </p>
                  <motion.button
                    {...pressable}
                    onClick={() => setCorners(DEFAULT_CORNERS)}
                    className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-[11px] text-[var(--t3)] hover:bg-[var(--hover)]"
                  >
                    <RotateCcw size={12} />
                    Về mặc định
                  </motion.button>
                  <motion.button
                    {...pressable}
                    onClick={save}
                    className="flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3.5 py-2 text-[11px] font-medium text-white"
                  >
                    <Check size={13} />
                    Dùng 4 góc này
                  </motion.button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
