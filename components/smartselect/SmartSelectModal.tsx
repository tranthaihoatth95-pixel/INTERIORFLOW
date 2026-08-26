'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Trash2, Wand2, Paintbrush, Eraser, Loader2, AlertTriangle, MousePointerClick, Square } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { useSmartSelectStore } from '@/lib/smartselect/smartSelectStore';
import { useSourceImage } from '@/lib/nodes/source-image';
import { runImageJob, AiJobError } from '@/lib/ai/client';
import { rgbaToAlphaMask, alphaMaskToRgba, maskCoverage } from '@/lib/nodes/mask-ops';
import { fade, modalScale, pressable, pressableIcon } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useDismissable } from '@/lib/useDismissable';

/**
 * Smart Select — CHỌN VÙNG THÔNG MINH (node `ai.smartselect`).
 *
 * Vì sao có: app chỉ có brush vẽ tay (`util.maskpainter`) → không chọn nổi biên vật thể phức
 * tạp (vách cong sau quầy reception). Ở đây người dùng CLICK vào vật thể (hoặc kéo 1 khung),
 * model segmentation (SAM 2) trả mask đúng biên, rồi vẫn brush/eraser tinh chỉnh được —
 * SAM không bao giờ đúng 100% ở mép.
 *
 * Mask xuất ra CÙNG quy ước với Mask Painter (trắng = vùng tác động, nền đen, dataType 'mask')
 * nên nối thẳng vào `ai.materialswap` / `ai.furniture` như cũ.
 */

type Pt = { x: number; y: number; include: boolean };

export function SmartSelectModal() {
  const nodeId = useSmartSelectStore((s) => s.openNodeId);
  const close = useSmartSelectStore((s) => s.close);
  const updateParam = useFlowStore((s) => s.updateParam);
  const aiTier = useFlowStore((s) => s.aiTier);
  const oneAiEngine = useFlowStore((s) => s.oneAiEngine);
  const mode = useFlowStore((s) =>
    nodeId ? String(s.nodes.find((n) => n.id === nodeId)?.data.params.mode ?? 'Điểm (click)') : 'Điểm (click)',
  );
  const existing = useFlowStore((s) =>
    nodeId ? (s.nodes.find((n) => n.id === nodeId)?.data.params.mask as string | undefined) : undefined,
  );
  const sourceImage = useSourceImage(nodeId);

  const displayRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  /** mask hiện hành, alpha 1 byte/px, cùng kích thước ảnh gốc */
  const maskRef = useRef<Uint8Array | null>(null);
  const dimsRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const boxStart = useRef<{ x: number; y: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const [points, setPoints] = useState<Pt[]>([]);
  const [box, setBox] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const [tool, setTool] = useState<'select' | 'brush' | 'eraser'>('select');
  const [brush, setBrush] = useState(40);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Vẽ lại: ảnh + overlay mask tím + các điểm/khung đang chọn. */
  const redraw = useCallback(() => {
    const display = displayRef.current;
    const img = imgRef.current;
    if (!display || !img) return;
    const ctx = display.getContext('2d')!;
    const { w, h } = dimsRef.current;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    const mask = maskRef.current;
    if (mask) {
      const tint = document.createElement('canvas');
      tint.width = w;
      tint.height = h;
      const tctx = tint.getContext('2d')!;
      const data = tctx.createImageData(w, h);
      for (let i = 0; i < mask.length; i++) {
        const on = mask[i] > 127;
        data.data[i * 4] = 139;
        data.data[i * 4 + 1] = 124;
        data.data[i * 4 + 2] = 247;
        data.data[i * 4 + 3] = on ? 140 : 0;
      }
      tctx.putImageData(data, 0, 0);
      ctx.drawImage(tint, 0, 0);
    }

    // điểm click: xanh = lấy vùng này, đỏ = trừ vùng này
    const r = Math.max(6, Math.round(Math.min(w, h) * 0.012));
    for (const p of points) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = p.include ? 'rgba(52,211,153,0.95)' : 'rgba(248,113,113,0.95)';
      ctx.fill();
      ctx.lineWidth = Math.max(2, r * 0.3);
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.stroke();
    }
    if (box) {
      ctx.save();
      ctx.setLineDash([r, r]);
      ctx.lineWidth = Math.max(2, r * 0.35);
      ctx.strokeStyle = 'rgba(139,124,247,0.95)';
      ctx.strokeRect(
        Math.min(box.x0, box.x1),
        Math.min(box.y0, box.y1),
        Math.abs(box.x1 - box.x0),
        Math.abs(box.y1 - box.y0),
      );
      ctx.restore();
    }
  }, [points, box]);

  // nạp ảnh + mask cũ khi mở
  useEffect(() => {
    if (!nodeId || !sourceImage) return;
    setReady(false);
    setError(null);
    setNote(null);
    setPoints([]);
    setBox(null);
    setTool('select');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      dimsRef.current = { w, h };
      const display = displayRef.current;
      if (display) {
        display.width = w;
        display.height = h;
      }
      const finish = () => {
        setReady(true);
        redraw();
      };
      if (existing) {
        const old = new Image();
        old.onload = () => {
          const c = document.createElement('canvas');
          c.width = w;
          c.height = h;
          const cx = c.getContext('2d')!;
          cx.drawImage(old, 0, 0, w, h);
          maskRef.current = rgbaToAlphaMask(cx.getImageData(0, 0, w, h).data);
          finish();
        };
        old.onerror = finish;
        old.src = existing;
      } else {
        maskRef.current = null;
        finish();
      }
    };
    img.onerror = () => setError('Không nạp được ảnh nguồn.');
    img.src = sourceImage;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId, sourceImage]);

  useEffect(() => {
    if (ready) redraw();
  }, [ready, redraw]);

  const canvasPoint = (e: React.PointerEvent) => {
    const display = displayRef.current!;
    const rect = display.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * display.width,
      y: ((e.clientY - rect.top) / rect.height) * display.height,
    };
  };

  /** Brush/eraser trực tiếp trên mask alpha — vòng tròn bán kính brush/2. */
  const paint = (at: { x: number; y: number }, erase: boolean) => {
    const { w, h } = dimsRef.current;
    if (!maskRef.current) maskRef.current = new Uint8Array(w * h);
    const mask = maskRef.current;
    const rad = Math.max(1, brush / 2);
    const x0 = Math.max(0, Math.floor(at.x - rad));
    const x1 = Math.min(w - 1, Math.ceil(at.x + rad));
    const y0 = Math.max(0, Math.floor(at.y - rad));
    const y1 = Math.min(h - 1, Math.ceil(at.y + rad));
    const r2 = rad * rad;
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = x - at.x;
        const dy = y - at.y;
        if (dx * dx + dy * dy <= r2) mask[y * w + x] = erase ? 0 : 255;
      }
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!ready || busy) return;
    const p = canvasPoint(e);
    if (tool === 'select') {
      if (mode === 'Hộp (kéo khung)') {
        boxStart.current = p;
        setBox({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
      } else {
        // alt/right-click = điểm TRỪ (bỏ phần này khỏi vùng chọn)
        const include = !(e.altKey || e.metaKey || e.button === 2);
        setPoints((ps) => [...ps, { x: p.x, y: p.y, include }]);
      }
      return;
    }
    drawing.current = true;
    lastPoint.current = p;
    paint(p, tool === 'eraser');
    redraw();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!ready || busy) return;
    const p = canvasPoint(e);
    if (tool === 'select') {
      if (boxStart.current) {
        setBox({ x0: boxStart.current.x, y0: boxStart.current.y, x1: p.x, y1: p.y });
      }
      return;
    }
    if (!drawing.current) return;
    // nội suy giữa 2 điểm để nét liền
    const from = lastPoint.current ?? p;
    const steps = Math.max(1, Math.round(Math.hypot(p.x - from.x, p.y - from.y) / (brush / 4)));
    for (let i = 1; i <= steps; i++) {
      paint(
        { x: from.x + ((p.x - from.x) * i) / steps, y: from.y + ((p.y - from.y) * i) / steps },
        tool === 'eraser',
      );
    }
    lastPoint.current = p;
    redraw();
  };

  const onPointerUp = () => {
    drawing.current = false;
    lastPoint.current = null;
    boxStart.current = null;
  };

  /** Gọi SAM 2: điểm/hộp → mask theo biên vật thể. */
  const autoSelect = async () => {
    const { w, h } = dimsRef.current;
    if (!sourceImage || !w) return;
    const usingBox = mode === 'Hộp (kéo khung)';
    if (usingBox && !box) {
      setError('Kéo 1 khung quanh vật thể trước (chế độ Hộp).');
      return;
    }
    if (!usingBox && !points.length) {
      setError('Bấm 1–3 điểm lên vật thể muốn chọn (Alt+bấm = trừ vùng).');
      return;
    }
    if (aiTier === 1) {
      setError('Đang ở mức "Không AI" — chọn vùng thông minh cần gọi model. Đổi mức AI ở header, hoặc dùng brush bên dưới.');
      return;
    }
    setBusy(true);
    setError(null);
    setNote(null);
    setProgress(0);
    try {
      const input: Record<string, unknown> = { image_url: sourceImage };
      if (usingBox && box) {
        input.box_prompts = [
          {
            x_min: Math.round(Math.min(box.x0, box.x1)),
            y_min: Math.round(Math.min(box.y0, box.y1)),
            x_max: Math.round(Math.max(box.x0, box.x1)),
            y_max: Math.round(Math.max(box.y0, box.y1)),
          },
        ];
      } else {
        input.prompts = points.map((p) => ({
          x: Math.round(p.x),
          y: Math.round(p.y),
          label: p.include ? 1 : 0,
        }));
      }
      // internal: segment là bước phụ của luồng SmartSelect (giữ đúng ý gốc "không tính credit
      // lần chạy lại") — không trừ credit, chốt giá 05/08, xem TASK_CREDIT_COST lib/ai/tiers.ts.
      const urls = await runImageJob('segment', input, setProgress, aiTier, oneAiEngine, true);
      const maskUrl = urls[0];
      if (!maskUrl) throw new Error('Model không trả về mask.');
      const m = new Image();
      m.crossOrigin = 'anonymous';
      await new Promise<void>((res, rej) => {
        m.onload = () => res();
        m.onerror = () => rej(new Error('Không tải được mask từ provider.'));
        m.src = maskUrl;
      });
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const cx = c.getContext('2d')!;
      cx.drawImage(m, 0, 0, w, h);
      const alpha = rgbaToAlphaMask(cx.getImageData(0, 0, w, h).data);
      const cov = maskCoverage(alpha);
      maskRef.current = alpha;
      redraw();
      setNote(
        cov < 0.005
          ? 'Mask trả về gần như trống — thử bấm đúng giữa vật thể, hoặc dùng chế độ Hộp.'
          : `Đã chọn ~${Math.round(cov * 100)}% ảnh. Tinh chỉnh mép bằng brush/eraser nếu cần.`,
      );
    } catch (err) {
      // Chưa có provider (fal chưa key/hết balance): vẫn dùng được — tạo vùng hình học từ
      // điểm/hộp để người dùng brush tiếp, thay vì chặn hẳn công việc.
      const notConfigured = err instanceof AiJobError && err.code === 'PROVIDER_NOT_CONFIGURED';
      if (notConfigured) {
        fallbackGeometric();
        setNote('Chưa nối được model segmentation — tạm tạo vùng hình học từ điểm/khung bạn chỉ. Tinh chỉnh bằng brush.');
      } else {
        setError(err instanceof Error ? err.message : 'Magic chọn vùng thất bại.');
      }
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  /** Dự phòng không AI: hộp → hình chữ nhật; điểm → đốm tròn quanh mỗi điểm. */
  const fallbackGeometric = () => {
    const { w, h } = dimsRef.current;
    const mask = new Uint8Array(w * h);
    if (mode === 'Hộp (kéo khung)' && box) {
      const xa = Math.max(0, Math.floor(Math.min(box.x0, box.x1)));
      const xb = Math.min(w - 1, Math.ceil(Math.max(box.x0, box.x1)));
      const ya = Math.max(0, Math.floor(Math.min(box.y0, box.y1)));
      const yb = Math.min(h - 1, Math.ceil(Math.max(box.y0, box.y1)));
      for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) mask[y * w + x] = 255;
    } else {
      const rad = Math.min(w, h) * 0.12;
      const r2 = rad * rad;
      for (const p of points.filter((q) => q.include)) {
        for (let y = Math.max(0, Math.floor(p.y - rad)); y <= Math.min(h - 1, Math.ceil(p.y + rad)); y++) {
          for (let x = Math.max(0, Math.floor(p.x - rad)); x <= Math.min(w - 1, Math.ceil(p.x + rad)); x++) {
            if ((x - p.x) ** 2 + (y - p.y) ** 2 <= r2) mask[y * w + x] = 255;
          }
        }
      }
    }
    maskRef.current = mask;
    redraw();
  };

  const clearAll = () => {
    maskRef.current = null;
    setPoints([]);
    setBox(null);
    setNote(null);
    setError(null);
    redraw();
  };

  const save = () => {
    const mask = maskRef.current;
    const { w, h } = dimsRef.current;
    if (!mask || !nodeId) {
      setError('Chưa có vùng chọn nào để lưu.');
      return;
    }
    const out = document.createElement('canvas');
    out.width = w;
    out.height = h;
    const octx = out.getContext('2d')!;
    // xuất theo quy ước Mask Painter: nền đen, vùng chọn trắng
    octx.putImageData(new ImageData(new Uint8ClampedArray(alphaMaskToRgba(mask)), w, h), 0, 0);
    updateParam(nodeId, 'mask', out.toDataURL('image/png'));
    close();
  };

  // 2.2.90 ĐỢT 3 — chuyển sang useDismissable dùng chung (bấm ra ngoài khung + Escape, guard =
  // đang chạy job AI thì không cho đóng, giữ đúng hành vi cũ `!busy`).
  useDismissable({ open: !!nodeId, onDismiss: close, refs: [cardRef], guard: () => busy });

  return (
    <AnimatePresence>
      {nodeId && (
        <motion.div
          variants={fade}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <motion.div
            ref={cardRef}
            variants={modalScale}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex max-h-full w-[min(96vw,1080px)] flex-col overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--card)] shadow-2xl"
          >
            <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-2.5">
              <Wand2 size={18} className="text-[var(--accent)]" />
              <span className="flex-1 text-sm font-medium text-[var(--t1)]">
                Chọn vùng thông minh · Smart Select
              </span>
              <motion.button
                {...pressableIcon}
                onClick={() => !busy && close()}
                className="grid h-7 w-7 place-items-center rounded-md text-[var(--t4)] hover:bg-[var(--hover)] hover:text-[var(--t2)]"
              >
                <X size={14} />
              </motion.button>
            </div>

            {!sourceImage ? (
              <div className="flex items-center gap-2 px-4 py-8 text-xs text-[var(--t3)]">
                <AlertTriangle size={14} className="text-amber-400" />
                Nối ảnh vào input <b>Image</b> của node trước (Import Image hoặc output của node khác).
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-1.5 border-b border-[var(--border)] px-4 py-2">
                  <ToolBtn active={tool === 'select'} onClick={() => setTool('select')} icon={mode === 'Hộp (kéo khung)' ? Square : MousePointerClick}>
                    {mode === 'Hộp (kéo khung)' ? 'Kéo khung' : 'Bấm điểm'}
                  </ToolBtn>
                  <ToolBtn active={tool === 'brush'} onClick={() => setTool('brush')} icon={Paintbrush}>
                    Tô thêm
                  </ToolBtn>
                  <ToolBtn active={tool === 'eraser'} onClick={() => setTool('eraser')} icon={Eraser}>
                    Xoá bớt
                  </ToolBtn>
                  {tool !== 'select' && (
                    <label className="ml-1 flex items-center gap-1.5 text-[10px] text-[var(--t4)]">
                      Cỡ cọ
                      <input
                        type="range"
                        min={8}
                        max={200}
                        step={2}
                        value={brush}
                        onChange={(e) => setBrush(Number(e.target.value))}
                        className="w-24 accent-[var(--accent)]"
                      />
                      {brush}px
                    </label>
                  )}
                  <div className="ml-auto flex items-center gap-1.5">
                    <motion.button
                      {...pressable}
                      disabled={busy}
                      onClick={() => void autoSelect()}
                      className="flex items-center gap-1.5 rounded-[10px] bg-[var(--accent)] px-3 py-1.5 text-[11px] font-medium text-white disabled:opacity-50"
                    >
                      {busy ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                      {busy ? `Đang chọn… ${Math.round(progress * 100)}%` : 'Magic chọn vùng'}
                    </motion.button>
                    <motion.button
                      {...pressable}
                      onClick={clearAll}
                      className="flex items-center gap-1.5 rounded-[10px] border border-[var(--border)] px-2.5 py-1.5 text-[11px] text-[var(--t3)] hover:bg-[var(--hover)]"
                    >
                      <Trash2 size={14} />
                      Xoá hết
                    </motion.button>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-auto bg-[var(--field)] p-3">
                  <canvas
                    ref={displayRef}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerLeave={onPointerUp}
                    onContextMenu={(e) => e.preventDefault()}
                    className={cn(
                      'mx-auto block max-h-[58vh] max-w-full rounded-[10px]',
                      tool === 'select' ? 'cursor-crosshair' : 'cursor-none',
                      busy && 'pointer-events-none opacity-70',
                    )}
                    style={{ touchAction: 'none' }}
                  />
                </div>

                <div className="space-y-1 border-t border-[var(--border)] px-4 py-2">
                  {error && (
                    <p className="flex items-center gap-1.5 text-[11px] text-red-400">
                      <AlertTriangle size={14} />
                      {error}
                    </p>
                  )}
                  {note && !error && <p className="text-[11px] text-[var(--t3)]">{note}</p>}
                  <div className="flex items-center gap-2">
                    <p className="flex-1 text-[10px] leading-relaxed text-[var(--t5)]">
                      Bấm vào vật thể (Alt+bấm = trừ vùng) rồi “Chọn vùng tự động”. Tinh chỉnh mép bằng
                      Tô thêm / Xoá bớt. Đảo vùng và nới/co biên đặt ở param trên node.
                    </p>
                    <motion.button
                      {...pressable}
                      onClick={save}
                      disabled={busy}
                      className="flex items-center gap-1.5 rounded-[10px] bg-[var(--accent)] px-3.5 py-2 text-[11px] font-medium text-white disabled:opacity-50"
                    >
                      <Check size={16} />
                      Dùng vùng chọn này
                    </motion.button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ToolBtn({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Wand2;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-[10px] border px-2.5 py-1.5 text-[11px] transition-colors',
        active
          ? 'border-[var(--accent-ring)] bg-[var(--accent-soft)] text-[var(--accent)]'
          : 'border-[var(--border)] text-[var(--t3)] hover:bg-[var(--hover)]',
      )}
    >
      <Icon size={14} />
      {children}
    </button>
  );
}
