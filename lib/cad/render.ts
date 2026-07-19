/**
 * lib/cad/render.ts — VẼ entity ra Canvas 2D (dùng chung cho live-canvas + export PNG).
 * Không phụ thuộc React. Toạ độ world mm, Y-up → screen px qua Viewport (lật Y).
 */

import type { Doc, Entity, Pt, Viewport, DimEntity, LineType } from './model';
import { docBox, fitBox, worldToScreen } from './model';
import { BLOCK_MAP, type Prim } from './furniture';
import { hatchLines, hatchDots } from './hatch';

/** Dim style tối thiểu dùng khi vẽ (mặc định nếu không truyền — xem store.ts DimStyle). */
export interface DimStyle {
  textHeight: number;
  arrowSize: number;
  dimScale: number;
}
const DEFAULT_DIM_STYLE: DimStyle = { textHeight: 120, arrowSize: 80, dimScale: 1 };

export interface DrawStyle {
  /** màu nét mặc định khi entity/layer không cho màu (dùng cho export đen-trắng) */
  stroke: string;
  /** ép mọi nét về 1 màu (export) — nếu set, bỏ qua màu layer */
  forceColor?: string;
  lineWidth: number;
  /** vẽ chữ text entity */
  text: boolean;
  /** Nấc 3 — dim style (cỡ chữ/mũi tên/tỉ lệ); mặc định DEFAULT_DIM_STYLE nếu không truyền */
  dimStyle?: DimStyle;
  /**
   * BỔ SUNG (hệ nét ISO 128) — true: dùng lineweight/lineType THẬT của layer/entity (mm → px
   * qua viewport.scale, tối thiểu 1px) thay vì `lineWidth` cố định. false/thiếu ⇒ hành vi CŨ
   * (lineWidth cố định, dùng cho preview/selection-highlight/PNG export — nơi cần 1 độ dày
   * đồng nhất bất kể layer, không phải bản vẽ "thật").
   */
  realLineweight?: boolean;
  /**
   * FIX (demo render overlap) — true: entity 'hatch' (tường/poché SOLID) chỉ vẽ VIỀN, KHÔNG
   * tô đặc. Dùng cho các lớp overlay accent (highlight selection đang chọn, preview ghost khi
   * offset/trim/mirror, leg đầu dimension góc) — những lớp này vẽ ĐÈ SAU CÙNG lên toàn bộ bản
   * vẽ (kể cả text/nhãn phòng bên dưới); nếu để tô đặc như bản vẽ THẬT, 1 mảng tường (hatch
   * SOLID dày theo bề dày tường) sẽ thành 1 thanh màu accent ĐẶC che kín chữ bên dưới nó —
   * đúng bug user báo cáo (screenshot: thanh tím dày đè chữ nhãn phòng). KHÔNG áp dụng cho
   * export PNG đen-trắng (renderDocToDataURL) — export vẫn cần tô đặc poché tường như bản in.
   */
  outlineOnly?: boolean;
}

function layerColor(doc: Doc, e: Entity, style: DrawStyle): string {
  if (style.forceColor) return style.forceColor;
  if (e.color) return e.color;
  const lay = doc.layers.find((l) => l.id === e.layer);
  return lay?.color ?? style.stroke;
}

/** mm/px của nét — layer trước, override entity sau, mặc định 0.25mm (trung, chưa gán layer). */
function effectiveLineWidthPx(doc: Doc, e: Entity, v: Viewport, style: DrawStyle): number {
  if (!style.realLineweight) return style.lineWidth;
  const lay = doc.layers.find((l) => l.id === e.layer);
  const mm = e.lineweight ?? lay?.lineweight ?? 0.25;
  return Math.max(1, mm * v.scale);
}

/** Dash pattern (px, đã nhân viewport.scale) theo lineType hiệu dụng của entity. [] = nét liền. */
const LINE_DASH_MM: Record<LineType, number[]> = {
  continuous: [],
  hidden: [3, 2],
  dashed: [6, 3],
  center: [12, 3, 2, 3],
  phantom: [12, 3, 2, 3, 2, 3],
};
function effectiveLineDashPx(doc: Doc, e: Entity, v: Viewport, style: DrawStyle): number[] {
  if (!style.realLineweight) return [];
  const lay = doc.layers.find((l) => l.id === e.layer);
  const lt: LineType = e.lineType ?? lay?.lineType ?? 'continuous';
  return LINE_DASH_MM[lt].map((mm) => Math.max(0.5, mm * v.scale));
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
  ctx.lineWidth = effectiveLineWidthPx(doc, e, v, style);
  ctx.setLineDash(effectiveLineDashPx(doc, e, v, style));
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
      const pattern = e.pattern ?? (e.solid === false ? 'ANSI31' : 'SOLID');
      const color = layerColor(doc, e, style);
      if (style.outlineOnly) {
        // chỉ viền — xem giải thích ở khai báo DrawStyle.outlineOnly (tránh tô đặc đè chữ).
        ctx.beginPath();
        e.points.forEach((p, i) => {
          const s = S(p);
          if (i === 0) ctx.moveTo(s.x, s.y);
          else ctx.lineTo(s.x, s.y);
        });
        ctx.closePath();
        ctx.strokeStyle = color;
        ctx.stroke();
        break;
      }
      if (pattern === 'SOLID') {
        ctx.beginPath();
        e.points.forEach((p, i) => {
          const s = S(p);
          if (i === 0) ctx.moveTo(s.x, s.y);
          else ctx.lineTo(s.x, s.y);
        });
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.9;
        ctx.fill();
        ctx.globalAlpha = 1;
      } else if (pattern === 'DOTS') {
        const dots = hatchDots(e.points, e.patternScale ?? 1);
        ctx.fillStyle = color;
        for (const p of dots) {
          const s = S(p);
          ctx.beginPath();
          ctx.arc(s.x, s.y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        const lines = hatchLines(e.points, pattern, e.patternScale ?? 1, e.patternAngle ?? 0);
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(0.6, ctx.lineWidth * 0.6); // mảnh hơn biên — dựa trên lineWidth hiệu dụng đã set ở đầu drawEntity
        ctx.beginPath();
        for (const [p, q] of lines) {
          const sp = S(p);
          const sq = S(q);
          ctx.moveTo(sp.x, sp.y);
          ctx.lineTo(sq.x, sq.y);
        }
        ctx.stroke();
      }
      break;
    }
  }
}

function dimText(ctx: CanvasRenderingContext2D, v: Viewport, color: string, text: string, at: Pt, ds: DimStyle) {
  ctx.fillStyle = color;
  const px = Math.max(9, ds.textHeight * ds.dimScale * v.scale);
  ctx.font = `${px}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(text, at.x, at.y - 3);
  ctx.textAlign = 'left';
}

/** Tick 45° kiểu kiến trúc tại điểm `at`, dọc theo hướng đơn vị (ux,uy) của đường kích thước. */
function drawTick(ctx: CanvasRenderingContext2D, at: Pt, ux: number, uy: number, size: number) {
  // xoay hướng (ux,uy) 45° để ra tick chéo — chuẩn ghi kích thước kiến trúc VN thay vì mũi tên.
  const c = Math.SQRT1_2;
  const tx = ux * c - uy * c;
  const ty = ux * c + uy * c;
  ctx.beginPath();
  ctx.moveTo(at.x - tx * size, at.y - ty * size);
  ctx.lineTo(at.x + tx * size, at.y + ty * size);
  ctx.stroke();
}

/** Mũi tên tam giác tại điểm `tip`, hướng từ `from`→`tip` (dùng cho leader radius/diameter). */
function drawArrowHead(ctx: CanvasRenderingContext2D, from: Pt, tip: Pt, size: number) {
  const dx = tip.x - from.x;
  const dy = tip.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;
  const back = { x: tip.x - ux * size, y: tip.y - uy * size };
  ctx.beginPath();
  ctx.moveTo(tip.x, tip.y);
  ctx.lineTo(back.x + px * size * 0.4, back.y + py * size * 0.4);
  ctx.lineTo(back.x - px * size * 0.4, back.y - py * size * 0.4);
  ctx.closePath();
  ctx.fillStyle = ctx.strokeStyle as string;
  ctx.fill();
}

/** DAL — aligned: đo khoảng cách a-b, đường kích thước lệch `off`. */
function drawDimAligned(ctx: CanvasRenderingContext2D, v: Viewport, e: DimEntity, color: string, style: DrawStyle, ds: DimStyle) {
  const S = (p: Pt) => worldToScreen(v, p);
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
  ctx.beginPath();
  ctx.moveTo(sa0.x, sa0.y);
  ctx.lineTo(sa.x, sa.y);
  ctx.moveTo(sb0.x, sb0.y);
  ctx.lineTo(sb.x, sb.y);
  ctx.moveTo(sa.x, sa.y);
  ctx.lineTo(sb.x, sb.y);
  ctx.stroke();
  const tickPx = Math.max(2, ds.arrowSize * ds.dimScale * v.scale * 0.5);
  const ulen = Math.hypot(sb.x - sa.x, sb.y - sa.y) || 1;
  const ux = (sb.x - sa.x) / ulen;
  const uy = (sb.y - sa.y) / ulen;
  drawTick(ctx, sa, ux, uy, tickPx);
  drawTick(ctx, sb, ux, uy, tickPx);
  dimText(ctx, v, color, `${Math.round(len)}`, { x: (sa.x + sb.x) / 2, y: (sa.y + sb.y) / 2 }, ds);
}

/** DRA/DDI — radius/diameter: leader từ tâm (radius) hoặc xuyên tâm (diameter), mũi tên tại tâm/đối tâm. */
function drawDimRadial(ctx: CanvasRenderingContext2D, v: Viewport, e: DimEntity, color: string, style: DrawStyle, diameter: boolean, ds: DimStyle) {
  const S = (p: Pt) => worldToScreen(v, p);
  const r = Math.hypot(e.b.x - e.a.x, e.b.y - e.a.y);
  const from = diameter ? { x: e.a.x * 2 - e.b.x, y: e.a.y * 2 - e.b.y } : e.a;
  const sFrom = S(from);
  const sTo = S(e.b);
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(sFrom.x, sFrom.y);
  ctx.lineTo(sTo.x, sTo.y);
  ctx.stroke();
  const arrowPx = Math.max(3, ds.arrowSize * ds.dimScale * v.scale);
  drawArrowHead(ctx, sFrom, sTo, arrowPx);
  if (diameter) drawArrowHead(ctx, sTo, sFrom, arrowPx);
  const label = diameter ? `⌀${Math.round(r * 2)}` : `R${Math.round(r)}`;
  dimText(ctx, v, color, label, { x: (sFrom.x + sTo.x) / 2, y: (sFrom.y + sTo.y) / 2 }, ds);
}

/** DAN — angular: cung đo góc bán kính `off` quanh đỉnh `c`, giữa hướng a-c và b-c. */
function drawDimAngular(ctx: CanvasRenderingContext2D, v: Viewport, e: DimEntity, color: string, style: DrawStyle, ds: DimStyle) {
  if (!e.c) return;
  const S = (p: Pt) => worldToScreen(v, p);
  const ang1 = Math.atan2(e.a.y - e.c.y, e.a.x - e.c.x);
  const ang2 = Math.atan2(e.b.y - e.c.y, e.b.x - e.c.x);
  const r = Math.abs(e.off) || 500;
  const p1 = { x: e.c.x + r * Math.cos(ang1), y: e.c.y + r * Math.sin(ang1) };
  const p2 = { x: e.c.x + r * Math.cos(ang2), y: e.c.y + r * Math.sin(ang2) };
  const sc = S(e.c);
  ctx.strokeStyle = color;
  // đường gióng từ đỉnh tới cung
  ctx.beginPath();
  ctx.moveTo(sc.x, sc.y);
  const sp1 = S(p1);
  ctx.lineTo(sp1.x, sp1.y);
  ctx.moveTo(sc.x, sc.y);
  const sp2 = S(p2);
  ctx.lineTo(sp2.x, sp2.y);
  ctx.stroke();
  // cung đo (Y lật giống drawEntity arc)
  ctx.beginPath();
  ctx.arc(sc.x, sc.y, Math.abs(r * v.scale), -ang2, -ang1);
  ctx.stroke();
  const sweep = (((ang2 - ang1) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const deg = Math.round((sweep * 180) / Math.PI);
  const mid = ang1 + sweep / 2;
  const tp = S({ x: e.c.x + r * Math.cos(mid), y: e.c.y + r * Math.sin(mid) });
  dimText(ctx, v, color, `${deg}°`, tp, ds);
}

function drawDimension(ctx: CanvasRenderingContext2D, v: Viewport, e: DimEntity, color: string, style: DrawStyle) {
  const kind = e.kind ?? 'aligned';
  const ds = style.dimStyle ?? DEFAULT_DIM_STYLE;
  if (kind === 'radius') drawDimRadial(ctx, v, e, color, style, false, ds);
  else if (kind === 'diameter') drawDimRadial(ctx, v, e, color, style, true, ds);
  else if (kind === 'angular') drawDimAngular(ctx, v, e, color, style, ds);
  else drawDimAligned(ctx, v, e, color, style, ds);
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
  drawEntities(ctx, vp, doc, { stroke: '#111111', forceColor: '#111111', lineWidth: 2, text: true, realLineweight: true });
  return canvas.toDataURL('image/png');
}
