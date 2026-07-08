'use client';

/**
 * components/photo-editor/DocCanvas.tsx — Bề mặt vẽ + hiển thị của trình chỉnh ảnh.
 *
 * Nhiệm vụ:
 *  - Composite PhotoDoc ra 1 canvas hiển thị (renderDoc) mỗi khi model đổi.
 *  - Zoom/pan (bánh xe = zoom, giữ Space/kéo = pan), fit.
 *  - Công cụ vẽ (brush/eraser/clone/heal/mask): thao tác trực tiếp lên canvas offscreen
 *    của LỚP đang chọn (hoặc mask của lớp), commit dataURL về model khi nhả chuột.
 *  - Selection (marquee/lasso): vẽ đường bao, kết quả trả lên qua onSelection để dùng
 *    giới hạn vùng vẽ (clip). Ở bản này selection dùng làm clip cho cọ.
 *
 * Hydration-safe: mọi thao tác canvas nằm trong effect/handler, không ở render body.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PhotoDoc, Layer } from '@/lib/photo-editor/model';
import { renderDoc, invalidate, layerToCanvas } from '@/lib/photo-editor/render';
import { makeCanvas, healSpot } from '@/lib/photo-editor/imaging';
import type { Tool, BrushSettings } from '@/lib/photo-editor/tools';
import { isPaintTool } from '@/lib/photo-editor/tools';

interface Props {
  doc: PhotoDoc;
  selected: Layer | null;
  tool: Tool;
  brush: BrushSettings;
  zoom: number;
  onZoom: (z: number) => void;
  /** tăng để yêu cầu fit lại khung (nút Fit trên toolbar). */
  fitSignal: number;
  /** commit dataURL mới cho lớp raster sau khi vẽ. */
  onCommitLayerSrc: (id: string, src: string) => void;
  /** commit dataURL mask mới cho lớp sau khi vẽ mask. */
  onCommitLayerMask: (id: string, mask: string) => void;
  /** thông báo đã có vùng chọn (path đóng theo pixel doc). null = xoá chọn. */
  onSelection: (path: { x: number; y: number }[] | null) => void;
  selection: { x: number; y: number }[] | null;
}

/** Điểm nguồn của Clone (toạ độ theo pixel tài liệu). */
interface CloneSource {
  x: number;
  y: number;
}

export default function DocCanvas(p: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const displayRef = useRef<HTMLCanvasElement>(null);
  // canvas offscreen của lớp đang vẽ (raster hoặc mask) — nguồn thực khi tô.
  const workRef = useRef<HTMLCanvasElement | null>(null);
  const workIdRef = useRef<string | null>(null); // id lớp đang gắn với workRef
  const workIsMaskRef = useRef(false);

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panRef = useRef(pan);
  panRef.current = pan;
  const drawingRef = useRef(false);
  const lastPtRef = useRef<{ x: number; y: number } | null>(null);
  const cloneSrcRef = useRef<CloneSource | null>(null);
  const cloneOffsetRef = useRef<{ dx: number; dy: number } | null>(null);
  const lassoRef = useRef<{ x: number; y: number }[]>([]);
  const spaceRef = useRef(false);
  const panningRef = useRef<{ x: number; y: number } | null>(null);

  /* --------------- composite doc → display canvas --------------- */
  const repaint = useCallback(async () => {
    const disp = displayRef.current;
    if (!disp) return;
    // Nếu đang vẽ lên workRef của lớp raster, composite bằng cách render doc rồi
    // (đơn giản) — nhưng để có phản hồi tức thì, khi drawing ta chỉ vẽ overlay ở dưới.
    await renderDoc(p.doc, disp);
  }, [p.doc]);

  useEffect(() => {
    void repaint();
  }, [repaint]);

  const fit = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const pad = 48;
    const zw = (wrap.clientWidth - pad) / p.doc.width;
    const zh = (wrap.clientHeight - pad) / p.doc.height;
    const z = Math.max(0.05, Math.min(zw, zh, 4));
    p.onZoom(z);
    setPan({ x: 0, y: 0 });
  }, [p]);

  // fit khi đổi kích thước tài liệu hoặc khi bấm nút Fit (fitSignal đổi)
  useEffect(() => {
    fit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.doc.width, p.doc.height, p.fitSignal]);

  /* --------------- toạ độ chuột → pixel tài liệu --------------- */
  const toDoc = useCallback(
    (e: { clientX: number; clientY: number }) => {
      const disp = displayRef.current!;
      const rect = disp.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * p.doc.width;
      const y = ((e.clientY - rect.top) / rect.height) * p.doc.height;
      return { x, y };
    },
    [p.doc.width, p.doc.height],
  );

  /* --------------- chuẩn bị canvas làm việc cho lớp --------------- */
  const ensureWork = useCallback(
    async (asMask: boolean): Promise<HTMLCanvasElement | null> => {
      const layer = p.selected;
      if (!layer || layer.kind !== 'raster') return null;
      const wantId = layer.id + (asMask ? ':mask' : '');
      if (workRef.current && workIdRef.current === wantId) return workRef.current;
      // dựng lại từ model
      let c: HTMLCanvasElement;
      if (asMask) {
        c = makeCanvas(p.doc.width, p.doc.height);
        if (layer.mask) {
          const { loadImage } = await import('@/lib/photo-editor/imaging');
          try {
            const img = await loadImage(layer.mask);
            c.getContext('2d')!.drawImage(img, 0, 0, p.doc.width, p.doc.height);
          } catch {
            /* mask hỏng — bắt đầu trắng */
          }
        } else {
          // mask mặc định = trắng (hiện toàn bộ)
          const mx = c.getContext('2d')!;
          mx.fillStyle = '#ffffff';
          mx.fillRect(0, 0, p.doc.width, p.doc.height);
        }
      } else {
        c = await layerToCanvas(layer, p.doc.width, p.doc.height);
      }
      workRef.current = c;
      workIdRef.current = wantId;
      workIsMaskRef.current = asMask;
      return c;
    },
    [p.selected, p.doc.width, p.doc.height],
  );

  /* --------------- vẽ 1 chấm cọ lên ctx --------------- */
  const stampBrush = useCallback(
    (ctx: CanvasRenderingContext2D, x: number, y: number, tool: Tool) => {
      const { size, hardness, opacity, color } = p.brush;
      const r = size / 2;
      ctx.save();
      // giới hạn theo selection nếu có
      if (p.selection && p.selection.length > 2) {
        ctx.beginPath();
        ctx.moveTo(p.selection[0].x, p.selection[0].y);
        for (const pt of p.selection.slice(1)) ctx.lineTo(pt.x, pt.y);
        ctx.closePath();
        ctx.clip();
      }
      if (tool === 'clone') {
        const off = cloneOffsetRef.current;
        const rc = workRef.current;
        if (off && rc) {
          const g = ctx.createRadialGradient(x, y, r * hardness, x, y, r);
          // clone: lấy vùng nguồn = (x+dx, y+dy)
          ctx.globalAlpha = opacity;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(rc, off.dx, off.dy);
          void g;
        }
      } else if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.globalAlpha = opacity;
        radialFill(ctx, x, y, r, hardness, '#000');
      } else {
        // brush / mask: mask dùng màu trắng để hiện, đen để ẩn (người dùng chọn qua color)
        ctx.globalAlpha = opacity;
        radialFill(ctx, x, y, r, hardness, color);
      }
      ctx.restore();
    },
    [p.brush, p.selection],
  );

  /* --------------- pointer handlers --------------- */
  const onPointerDown = useCallback(
    async (e: React.PointerEvent) => {
      const wrap = wrapRef.current;
      wrap?.setPointerCapture?.(e.pointerId);

      // pan bằng Space hoặc chuột giữa
      if (spaceRef.current || e.button === 1 || p.tool === 'move') {
        if (spaceRef.current || e.button === 1) {
          panningRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
          return;
        }
      }

      const dpt = toDoc(e);

      // Clone: Alt-click đặt điểm nguồn
      if (p.tool === 'clone' && (e.altKey || e.metaKey)) {
        cloneSrcRef.current = { x: dpt.x, y: dpt.y };
        return;
      }

      // Selection tools
      if (p.tool === 'marquee') {
        lassoRef.current = [dpt];
        drawingRef.current = true;
        return;
      }
      if (p.tool === 'lasso') {
        lassoRef.current = [dpt];
        drawingRef.current = true;
        return;
      }

      // Paint tools
      if (isPaintTool(p.tool)) {
        const asMask = p.tool === 'mask';
        const c = await ensureWork(asMask);
        if (!c) return;
        const ctx = c.getContext('2d')!;
        if (p.tool === 'clone') {
          if (!cloneSrcRef.current) return; // chưa đặt nguồn
          cloneOffsetRef.current = {
            dx: cloneSrcRef.current.x - dpt.x,
            dy: cloneSrcRef.current.y - dpt.y,
          };
        }
        if (p.tool === 'heal') {
          healSpot(ctx, dpt.x, dpt.y, p.brush.size / 2);
        } else {
          stampBrush(ctx, dpt.x, dpt.y, p.tool);
        }
        drawingRef.current = true;
        lastPtRef.current = dpt;
        await previewWork();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [p.tool, p.brush, pan, toDoc, ensureWork, stampBrush],
  );

  const onPointerMove = useCallback(
    async (e: React.PointerEvent) => {
      // panning
      if (panningRef.current) {
        setPan({ x: e.clientX - panningRef.current.x, y: e.clientY - panningRef.current.y });
        return;
      }
      if (!drawingRef.current) return;
      const dpt = toDoc(e);

      if (p.tool === 'marquee') {
        const start = lassoRef.current[0];
        lassoRef.current = [
          { x: start.x, y: start.y },
          { x: dpt.x, y: start.y },
          { x: dpt.x, y: dpt.y },
          { x: start.x, y: dpt.y },
        ];
        drawSelectionOverlay();
        return;
      }
      if (p.tool === 'lasso') {
        lassoRef.current.push(dpt);
        drawSelectionOverlay();
        return;
      }

      if (isPaintTool(p.tool)) {
        const c = workRef.current;
        if (!c) return;
        const ctx = c.getContext('2d')!;
        const last = lastPtRef.current ?? dpt;
        // nội suy dọc đoạn để nét liền
        const steps = Math.max(1, Math.floor(dist(last, dpt) / (p.brush.size * 0.25)));
        for (let i = 1; i <= steps; i++) {
          const x = last.x + ((dpt.x - last.x) * i) / steps;
          const y = last.y + ((dpt.y - last.y) * i) / steps;
          if (p.tool === 'heal') healSpot(ctx, x, y, p.brush.size / 2);
          else stampBrush(ctx, x, y, p.tool);
        }
        lastPtRef.current = dpt;
        await previewWork();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [p.tool, p.brush, toDoc, stampBrush],
  );

  const onPointerUp = useCallback(async () => {
    panningRef.current = null;
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPtRef.current = null;

    if (p.tool === 'marquee' || p.tool === 'lasso') {
      const path = lassoRef.current;
      p.onSelection(path.length > 2 ? path.slice() : null);
      return;
    }

    // commit lớp / mask
    const layer = p.selected;
    const c = workRef.current;
    if (layer && c) {
      const dataURL = c.toDataURL('image/png');
      if (workIsMaskRef.current) {
        p.onCommitLayerMask(layer.id, dataURL);
      } else {
        invalidate(layer.kind === 'raster' ? layer.src : '');
        p.onCommitLayerSrc(layer.id, dataURL);
      }
      // reset work để lần sau dựng lại từ model đã cập nhật
      workRef.current = null;
      workIdRef.current = null;
    }
  }, [p]);

  /* --------------- preview khi đang vẽ (không đợi commit) --------------- */
  const previewWork = useCallback(async () => {
    // vẽ lại composite nhưng thay lớp đang vẽ bằng workRef để phản hồi tức thì.
    const disp = displayRef.current;
    const layer = p.selected;
    const work = workRef.current;
    if (!disp || !layer || !work) return;
    // Cách đơn giản, đủ mượt cho ảnh vừa: composite doc thường rồi vẽ đè work lên.
    await renderDoc(p.doc, disp);
    const ctx = disp.getContext('2d')!;
    if (!workIsMaskRef.current) {
      ctx.save();
      ctx.globalAlpha = layer.opacity;
      ctx.drawImage(work, 0, 0, p.doc.width, p.doc.height);
      ctx.restore();
    }
  }, [p.doc, p.selected]);

  /* --------------- overlay chọn vùng --------------- */
  const drawSelectionOverlay = useCallback(() => {
    const disp = displayRef.current;
    if (!disp) return;
    const ctx = disp.getContext('2d')!;
    void renderDoc(p.doc, disp).then(() => {
      const path = lassoRef.current;
      if (path.length < 2) return;
      ctx.save();
      ctx.strokeStyle = '#8a6f4d';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (const pt of path.slice(1)) ctx.lineTo(pt.x, pt.y);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    });
  }, [p.doc]);

  // vẽ lại overlay selection tĩnh khi selection từ prop đổi
  useEffect(() => {
    const disp = displayRef.current;
    if (!disp || !p.selection) return;
    const ctx = disp.getContext('2d')!;
    ctx.save();
    ctx.strokeStyle = '#8a6f4d';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(p.selection[0].x, p.selection[0].y);
    for (const pt of p.selection.slice(1)) ctx.lineTo(pt.x, pt.y);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }, [p.selection, p.doc]);

  /* --------------- zoom bằng bánh xe --------------- */
  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return; // chỉ zoom khi giữ Ctrl/Cmd (giữ scroll pan)
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      p.onZoom(Math.max(0.05, Math.min(8, p.zoom * factor)));
    },
    [p],
  );

  /* --------------- Space để pan --------------- */
  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if (e.code === 'Space') spaceRef.current = true;
    };
    const ku = (e: KeyboardEvent) => {
      if (e.code === 'Space') spaceRef.current = false;
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  }, []);

  const displayW = p.doc.width * p.zoom;
  const displayH = p.doc.height * p.zoom;

  return (
    <div
      ref={wrapRef}
      onWheel={onWheel}
      style={{
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        position: 'relative',
        overflow: 'hidden',
        display: 'grid',
        placeItems: 'center',
        background:
          'repeating-conic-gradient(var(--field) 0% 25%, var(--panel) 0% 50%) 50% / 24px 24px',
      }}
    >
      <canvas
        ref={displayRef}
        width={p.doc.width}
        height={p.doc.height}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        style={{
          width: displayW,
          height: displayH,
          transform: `translate(${pan.x}px, ${pan.y}px)`,
          boxShadow: 'var(--shadow-pop, 0 8px 30px rgba(0,0,0,.18))',
          background: '#fff',
          cursor: cursorFor(p.tool),
          touchAction: 'none',
          imageRendering: p.zoom > 2 ? 'pixelated' : 'auto',
        }}
      />
      {/* HUD nhỏ: kích thước + zoom */}
      <div
        style={{
          position: 'absolute',
          left: 12,
          bottom: 12,
          fontSize: 11,
          color: 'var(--t4)',
          background: 'var(--mat-overlay, rgba(0,0,0,.5))',
          padding: '3px 8px',
          borderRadius: 6,
          pointerEvents: 'none',
        }}
      >
        {p.doc.width}×{p.doc.height}px · {Math.round(p.zoom * 100)}%
      </div>
    </div>
  );
}

/* -------------------- tiện ích -------------------- */

/** Tô 1 chấm tròn có feather theo hardness. */
function radialFill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  hardness: number,
  color: string,
) {
  const inner = Math.max(0, Math.min(0.99, hardness)) * r;
  const g = ctx.createRadialGradient(x, y, inner, x, y, Math.max(inner + 0.5, r));
  const rgba = toRgba(color);
  g.addColorStop(0, `rgba(${rgba},1)`);
  g.addColorStop(1, `rgba(${rgba},0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function toRgba(hex: string): string {
  const h = hex.replace('#', '');
  if (h.length === 3) {
    const r = parseInt(h[0] + h[0], 16);
    const g = parseInt(h[1] + h[1], 16);
    const b = parseInt(h[2] + h[2], 16);
    return `${r},${g},${b}`;
  }
  const n = parseInt(h.length >= 6 ? h.slice(0, 6) : 'ffffff', 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function cursorFor(tool: Tool): string {
  switch (tool) {
    case 'move':
      return 'grab';
    case 'marquee':
    case 'lasso':
      return 'crosshair';
    default:
      return 'crosshair';
  }
}
