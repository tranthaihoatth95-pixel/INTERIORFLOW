/**
 * lib/cad/render.ts — VẼ entity ra Canvas 2D (dùng chung cho live-canvas + export PNG).
 * Không phụ thuộc React. Toạ độ world mm, Y-up → screen px qua Viewport (lật Y).
 */

import type { Doc, Entity, Pt, Viewport } from './model';
import { docBox, fitBox, worldToScreen } from './model';
import { BLOCK_MAP, type Prim } from './furniture';

export interface DrawStyle {
  /** màu nét mặc định khi entity/layer không cho màu (dùng cho export đen-trắng) */
  stroke: string;
  /** ép mọi nét về 1 màu (export) — nếu set, bỏ qua màu layer */
  forceColor?: string;
  lineWidth: number;
  /** vẽ chữ text entity */
  text: boolean;
}

function layerColor(doc: Doc, e: Entity, style: DrawStyle): string {
  if (style.forceColor) return style.forceColor;
  if (e.color) return e.color;
  const lay = doc.layers.find((l) => l.id === e.layer);
  return lay?.color ?? style.stroke;
}

/** local mm của block → world mm (áp translate/rotate/scale của instance). */
function blockLocalToWorld(lp: Pt, at: Pt, rot: number, sx: number, sy: number): Pt {
  const x = lp.x * sx;
  const y = lp.y * sy;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  return { x: at.x + x * cos - y * sin, y: at.y + x * sin + y * cos };
}

function drawPrim(ctx: CanvasRenderingContext2D, v: Viewport, prim: Prim, tf: (p: Pt) => Pt) {
  const S = (p: Pt) => worldToScreen(v, tf(p));
  ctx.beginPath();
  if (prim.k === 'line') {
    const a = S(prim.a);
    const b = S(prim.b);
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
  } else if (prim.k === 'poly') {
    prim.pts.forEach((p, i) => {
      const s = S(p);
      if (i === 0) ctx.moveTo(s.x, s.y);
      else ctx.lineTo(s.x, s.y);
    });
    if (prim.closed) ctx.closePath();
  } else if (prim.k === 'circle') {
    // xấp xỉ bằng cung (giữ đúng khi scale không đồng đều thì méo — chấp nhận)
    const c = tf(prim.c);
    const sc = worldToScreen(v, c);
    const rp = Math.abs(prim.r * v.scale);
    ctx.arc(sc.x, sc.y, rp, 0, Math.PI * 2);
  } else if (prim.k === 'arc') {
    const c = tf(prim.c);
    const sc = worldToScreen(v, c);
    const rp = Math.abs(prim.r * v.scale);
    // Y lật → góc lật dấu
    ctx.arc(sc.x, sc.y, rp, -prim.a2, -prim.a1);
  }
  ctx.stroke();
}

/** Vẽ 1 entity. */
export function drawEntity(ctx: CanvasRenderingContext2D, v: Viewport, doc: Doc, e: Entity, style: DrawStyle) {
  ctx.strokeStyle = layerColor(doc, e, style);
  ctx.lineWidth = style.lineWidth;
  const S = (p: Pt) => worldToScreen(v, p);

  switch (e.type) {
    case 'line': {
      const a = S(e.a);
      const b = S(e.b);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      break;
    }
    case 'polyline': {
      ctx.beginPath();
      e.points.forEach((p, i) => {
        const s = S(p);
        if (i === 0) ctx.moveTo(s.x, s.y);
        else ctx.lineTo(s.x, s.y);
      });
      if (e.closed) ctx.closePath();
      ctx.stroke();
      break;
    }
    case 'rect': {
      const p0 = S({ x: e.x, y: e.y });
      const p1 = S({ x: e.x + e.w, y: e.y + e.h });
      ctx.strokeRect(Math.min(p0.x, p1.x), Math.min(p0.y, p1.y), Math.abs(p1.x - p0.x), Math.abs(p1.y - p0.y));
      break;
    }
    case 'circle': {
      const c = S(e.c);
      ctx.beginPath();
      ctx.arc(c.x, c.y, Math.abs(e.r * v.scale), 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'arc': {
      const c = S(e.c);
      ctx.beginPath();
      ctx.arc(c.x, c.y, Math.abs(e.r * v.scale), -e.a2, -e.a1);
      ctx.stroke();
      break;
    }
    case 'text': {
      if (!style.text) break;
      const at = S(e.at);
      ctx.fillStyle = layerColor(doc, e, style);
      const px = Math.max(9, e.h * v.scale);
      ctx.font = `${px}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textBaseline = 'bottom';
      ctx.fillText(e.text, at.x, at.y);
      break;
    }
    case 'dim': {
      drawDimension(ctx, v, e, layerColor(doc, e, style), style);
      break;
    }
    case 'block': {
      const def = BLOCK_MAP[e.block];
      if (!def) break;
      const tf = (p: Pt) => blockLocalToWorld(p, e.at, e.rot, e.sx, e.sy);
      for (const prim of def.prims) drawPrim(ctx, v, prim, tf);
      break;
    }
    case 'hatch': {
      if (e.points.length < 3) break;
      ctx.beginPath();
      e.points.forEach((p, i) => {
        const s = S(p);
        if (i === 0) ctx.moveTo(s.x, s.y);
        else ctx.lineTo(s.x, s.y);
      });
      ctx.closePath();
      ctx.fillStyle = layerColor(doc, e, style);
      ctx.globalAlpha = 0.9;
      ctx.fill();
      ctx.globalAlpha = 1;
      break;
    }
  }
}

function drawDimension(
  ctx: CanvasRenderingContext2D,
  v: Viewport,
  e: { a: Pt; b: Pt; off: number },
  color: string,
  style: DrawStyle,
) {
  const S = (p: Pt) => worldToScreen(v, p);
  // pháp tuyến đơn vị của đoạn a-b
  const dx = e.b.x - e.a.x;
  const dy = e.b.y - e.a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const oa = { x: e.a.x + nx * e.off, y: e.a.y + ny * e.off };
  const ob = { x: e.b.x + nx * e.off, y: e.b.y + ny * e.off };
  const sa = S(oa);
  const sb = S(ob);
  const sa0 = S(e.a);
  const sb0 = S(e.b);
  ctx.strokeStyle = color;
  ctx.lineWidth = style.lineWidth;
  ctx.beginPath();
  // đường gióng
  ctx.moveTo(sa0.x, sa0.y);
  ctx.lineTo(sa.x, sa.y);
  ctx.moveTo(sb0.x, sb0.y);
  ctx.lineTo(sb.x, sb.y);
  // đường kích thước
  ctx.moveTo(sa.x, sa.y);
  ctx.lineTo(sb.x, sb.y);
  ctx.stroke();
  // text mm ở giữa
  ctx.fillStyle = color;
  ctx.font = '11px ui-sans-serif, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  const mx = (sa.x + sb.x) / 2;
  const my = (sa.y + sb.y) / 2;
  ctx.fillText(`${Math.round(len)}`, mx, my - 3);
  ctx.textAlign = 'left';
}

/** Vẽ toàn bộ entity (bỏ layer ẩn). */
export function drawEntities(ctx: CanvasRenderingContext2D, v: Viewport, doc: Doc, style: DrawStyle) {
  for (const e of doc.entities) {
    const lay = doc.layers.find((l) => l.id === e.layer);
    if (lay && !lay.visible) continue;
    drawEntity(ctx, v, doc, e, style);
  }
}

/**
 * Render bản vẽ → PNG dataURL (nền trắng, nét đen), cạnh dài ~maxPx. Dùng cho Export PNG
 * và "Đưa sang Render". Tự tạo canvas ngoài màn hình (chỉ chạy phía client — có document).
 */
export function renderDocToDataURL(doc: Doc, maxPx = 2000, pad = 80): string {
  if (typeof document === 'undefined') return '';
  const box = docBox(doc) ?? { minX: -1000, minY: -1000, maxX: 1000, maxY: 1000 };
  const bw = Math.max(1, box.maxX - box.minX);
  const bh = Math.max(1, box.maxY - box.minY);
  const aspect = bw / bh;
  let W: number;
  let H: number;
  if (aspect >= 1) {
    W = maxPx;
    H = Math.round(maxPx / aspect);
  } else {
    H = maxPx;
    W = Math.round(maxPx * aspect);
  }
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  const vp: Viewport = fitBox(box, W, H, pad);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  drawEntities(ctx, vp, doc, { stroke: '#111111', forceColor: '#111111', lineWidth: 2, text: true });
  return canvas.toDataURL('image/png');
}
