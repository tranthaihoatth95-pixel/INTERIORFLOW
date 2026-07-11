'use client';

/**
 * Canvas vẽ tay cho Sketch Studio — brush/eraser/line/rect/ellipse, undo/redo (stack
 * snapshot PNG, cap 30), xuất data URL. Không dùng thư viện ngoài — canvas 2D thuần,
 * cùng kỹ thuật pointer capture như MaskPainterModal/AnnotateModal (đã có trong app)
 * nhưng KHÔNG tái dùng chung component — đây là cơ chế vẽ-tay-tự-do riêng.
 */
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

export type SketchTool = 'brush' | 'eraser' | 'line' | 'rect' | 'ellipse';

export interface SketchCanvasHandle {
  exportDataUrl: (type?: string, quality?: number) => string;
  clear: () => void;
  undo: () => void;
  redo: () => void;
}

interface Point {
  x: number;
  y: number;
}

interface SketchCanvasProps {
  width: number;
  height: number;
  /** ảnh nền để đồ theo (trace) — vẽ mờ 45% dưới cùng, KHÔNG bắt buộc */
  backgroundImage?: string | null;
  /** nét đã vẽ từ lần trước (mở lại để sửa tiếp) — vẽ NGUYÊN độ đậm, chồng lên trên background */
  initialDrawing?: string | null;
  tool: SketchTool;
  color: string;
  thickness: number;
  onHistoryChange?: (state: { canUndo: boolean; canRedo: boolean }) => void;
}

export const SketchCanvas = forwardRef<SketchCanvasHandle, SketchCanvasProps>(function SketchCanvas(
  { width, height, backgroundImage, initialDrawing, tool, color, thickness, onHistoryChange },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const undoStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);
  const drawing = useRef(false);
  const startPt = useRef<Point | null>(null);
  const lastPt = useRef<Point | null>(null);
  const ready = useRef(false);
  // chỉ để trigger re-render khi cần (buttons disabled state) — nguồn thật là 2 ref stack ở trên
  const [, bump] = useState(0);

  const notifyHistory = useCallback(() => {
    bump((n) => n + 1);
    onHistoryChange?.({ canUndo: undoStack.current.length > 0, canRedo: redoStack.current.length > 0 });
  }, [onHistoryChange]);

  // (Re)khởi tạo canvas khi đổi kích thước/ảnh nền — nền trắng, hoặc ảnh mờ để đồ theo.
  useEffect(() => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !overlay) return;
    ready.current = false;
    canvas.width = width;
    canvas.height = height;
    overlay.width = width;
    overlay.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    undoStack.current = [];
    redoStack.current = [];

    // lớp nét cũ (sửa tiếp) vẽ NGUYÊN độ đậm, phủ khít khung — chạy sau cùng để không bị background che.
    const drawInitial = () => {
      if (!initialDrawing) {
        ready.current = true;
        notifyHistory();
        return;
      }
      const old = new Image();
      old.onload = () => {
        ctx.drawImage(old, 0, 0, width, height);
        ready.current = true;
        notifyHistory();
      };
      old.onerror = () => {
        ready.current = true;
        notifyHistory();
      };
      old.src = initialDrawing;
    };

    if (backgroundImage) {
      const img = new Image();
      if (!backgroundImage.startsWith('data:')) img.crossOrigin = 'anonymous';
      img.onload = () => {
        const scale = Math.min(width / img.naturalWidth, height / img.naturalHeight);
        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;
        ctx.globalAlpha = 0.45;
        ctx.drawImage(img, (width - dw) / 2, (height - dh) / 2, dw, dh);
        ctx.globalAlpha = 1;
        drawInitial();
      };
      img.onerror = drawInitial;
      img.src = backgroundImage;
    } else {
      drawInitial();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, backgroundImage, initialDrawing]);

  const pushUndo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    undoStack.current = [...undoStack.current, canvas.toDataURL('image/png')].slice(-30);
    redoStack.current = [];
    notifyHistory();
  }, [notifyHistory]);

  const restoreFrom = useCallback((dataUrl: string) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = dataUrl;
  }, []);

  const undo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !undoStack.current.length) return;
    const cur = canvas.toDataURL('image/png');
    redoStack.current = [...redoStack.current, cur].slice(-30);
    const prev = undoStack.current[undoStack.current.length - 1];
    undoStack.current = undoStack.current.slice(0, -1);
    restoreFrom(prev);
    notifyHistory();
  }, [restoreFrom, notifyHistory]);

  const redo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !redoStack.current.length) return;
    const cur = canvas.toDataURL('image/png');
    undoStack.current = [...undoStack.current, cur].slice(-30);
    const next = redoStack.current[redoStack.current.length - 1];
    redoStack.current = redoStack.current.slice(0, -1);
    restoreFrom(next);
    notifyHistory();
  }, [restoreFrom, notifyHistory]);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    pushUndo();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [pushUndo]);

  useImperativeHandle(
    ref,
    () => ({
      exportDataUrl: (type = 'image/png', quality) => canvasRef.current?.toDataURL(type, quality) ?? '',
      clear,
      undo,
      redo,
    }),
    [clear, undo, redo],
  );

  const toPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const drawShape = (ctx: CanvasRenderingContext2D, p0: Point, p1: Point) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (tool === 'line') {
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    } else if (tool === 'rect') {
      ctx.strokeRect(Math.min(p0.x, p1.x), Math.min(p0.y, p1.y), Math.abs(p1.x - p0.x), Math.abs(p1.y - p0.y));
    } else if (tool === 'ellipse') {
      const cx = (p0.x + p1.x) / 2;
      const cy = (p0.y + p1.y) / 2;
      const rx = Math.abs(p1.x - p0.x) / 2;
      const ry = Math.abs(p1.y - p0.y) / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.max(rx, 0.01), Math.max(ry, 0.01), 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  const strokeSegment = (p0: Point, p1: Point) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  };

  return (
    // box responsive theo aspect-ratio (không cứng px) — độ phân giải thật của canvas
    // vẫn cố định theo width/height props (chất lượng vẽ), overlay/pointer map theo tỉ lệ hiển thị.
    <div className="relative mx-auto w-full max-w-[880px]" style={{ aspectRatio: `${width} / ${height}` }}>
      <canvas
        ref={canvasRef}
        data-testid="sketch-canvas"
        className="absolute inset-0 rounded-[12px]"
        style={{ touchAction: 'none', cursor: 'crosshair' }}
        onPointerDown={(e) => {
          if (!ready.current) return;
          drawing.current = true;
          const p = toPoint(e);
          startPt.current = p;
          lastPt.current = p;
          pushUndo();
          if (tool === 'brush' || tool === 'eraser') strokeSegment(p, p);
          e.currentTarget.setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const p = toPoint(e);
          if (tool === 'brush' || tool === 'eraser') {
            if (lastPt.current) strokeSegment(lastPt.current, p);
            lastPt.current = p;
          } else if (startPt.current) {
            const overlay = overlayRef.current;
            const octx = overlay?.getContext('2d');
            if (overlay && octx) {
              octx.clearRect(0, 0, overlay.width, overlay.height);
              drawShape(octx, startPt.current, p);
            }
          }
        }}
        onPointerUp={(e) => {
          if (!drawing.current) return;
          drawing.current = false;
          if ((tool === 'line' || tool === 'rect' || tool === 'ellipse') && startPt.current) {
            const ctx = canvasRef.current?.getContext('2d');
            if (ctx) drawShape(ctx, startPt.current, toPoint(e));
            const overlay = overlayRef.current;
            overlay?.getContext('2d')?.clearRect(0, 0, overlay.width, overlay.height);
          }
          startPt.current = null;
          lastPt.current = null;
        }}
      />
      {/* overlay: xem trước hình khối (line/rect/ellipse) khi đang kéo, không nhận sự kiện */}
      <canvas ref={overlayRef} className="pointer-events-none absolute inset-0 rounded-[12px]" />
    </div>
  );
});
