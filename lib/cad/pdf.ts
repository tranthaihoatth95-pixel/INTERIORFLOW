/**
 * lib/cad/pdf.ts — Sprint 7 Việc 1: xuất PDF VECTOR THẬT cho CAD (khác PDF của Present —
 * lib/present-editor/export.ts nhúng JPEG toàn trang qua addImage(), "trung thực" nhưng là
 * ẢNH). Ở đây vẽ lại TỪNG Entity bằng API hình học của jsPDF (line/rect/circle/triangle/text)
 * — giữ nét thật (zoom trong PDF viewer không bể) + text chọn/copy được, giống "Plot to PDF"
 * của AutoCAD.
 *
 * GIỚI HẠN ĐÃ XÁC NHẬN (đọc trước khi sửa): jsPDF 4.2.1 (package.json hiện tại) KHÔNG có
 * Optional Content Groups (OCG) — đã grep "OCG"/"optionalContent"/"addLayer"/"setLayer" trong
 * node_modules/jspdf/dist/*.js, không có kết quả nào. Vì vậy PDF xuất ra KHÔNG có layer ẩn/hiện
 * được trong PDF viewer thật (Preview/Acrobat) — chỉ đảm bảo đúng yêu cầu tối thiểu "vector,
 * không phải ảnh raster". Layer VẪN được tôn trọng ở bước xuất: layer đang ẨN trong app thì
 * KHÔNG vẽ vào PDF (giống hành vi drawEntities() ở lib/cad/render.ts), chỉ là không bật/tắt
 * lại được sau khi đã xuất. Muốn OCG thật cần đổi sang thư viện khác (VD pdf-lib) — ngoài
 * phạm vi sprint này (brief yêu cầu tái dùng jsPDF, không thêm dependency mới).
 *
 * Toạ độ: tái dùng CHÍNH XÁC fitBox()/worldToScreen() của lib/cad/model.ts — coi "pixel" của
 * Viewport là "mm giấy": fitBox(box, khổGiấyRộng, khổGiấyCao, lề) trả về {scale, panX, panY}
 * với scale = mm-giấy / mm-world (tỉ lệ bản vẽ), rồi worldToScreen(v, p) cho thẳng toạ độ mm
 * trên trang PDF (unit:'mm'). KHÔNG cần suy công thức mới, KHÔNG đụng render.ts.
 *
 * Lineweight (Layer.lineweight/Entity.lineweight): theo docstring model.ts, đây là mm ĐO TRÊN
 * GIẤY IN (chuẩn ISO 128 — pen width vật lý), khác `v.scale` (px-màn-hình/mm-world dùng cho
 * canvas hiển thị theo mức zoom). PDF dùng lineweight TRỰC TIẾP làm mm nét trên trang, KHÔNG
 * nhân thêm v.scale (khác effectiveLineWidthPx() trong render.ts — đúng vì đó là px màn hình
 * theo zoom, còn đây là mm giấy cố định bất kể tỉ lệ bản vẽ, đúng nghĩa "Plot to PDF").
 * Ngược lại TextEntity.h/DimStyle.textHeight/arrowSize là mm THẬT ngoài đời (tỉ lệ 1:1) nên
 * VẪN nhân v.scale để ra đúng cỡ trên giấy ở tỉ lệ bản vẽ đã chọn.
 */

import type { Doc, Entity, Pt, Viewport, DimEntity } from './model';
import { docBox, fitBox, fitScaleLabel, worldToScreen, ellipseBoundaryPoints, zoneBoundaryPoints, zoneCentroid, ZONE_GROUP_META } from './model';
import { BLOCK_MAP, type Prim } from './furniture';
import { hatchLines, hatchDots } from './hatch';

/**
 * M0 fix (docs/RESEARCH-TECHNICAL-DRAWING-PIPELINE.md §1.6/§4) — khổ giấy/lề mặc định dùng khi
 * xuất PDF CAD. TẠM hardcode A3 ngang cho tới khi M1 (dropdown chọn khổ giấy, CHƯA duyệt) — export
 * ra để UI khung tên (`components/cad/CadEditor.tsx` → `TitleBlockPanel`) tính CÙNG một con số
 * tỉ lệ với lúc xuất PDF thật, không lệch nhau (đây chính là gốc lỗi §1.6: 2 nguồn số không liên hệ).
 */
export const DEFAULT_PDF_PAPER_MM: [number, number] = [420, 297];
export const DEFAULT_PDF_MARGIN_MM = 15;

/** Chuỗi mở đầu text khung tên ghi tỉ lệ — sinh bởi `titleBlock()` (lib/cad/commands.ts:184,
 * `text: \`Tỷ lệ ${info.scale}\``). Dùng để NHẬN DIỆN entity nào cần ghi đè tỉ lệ TÍNH THẬT lúc
 * xuất PDF — heuristic theo tiền tố chuỗi (không có field/kind riêng đánh dấu "đây là ô tỉ lệ" ở
 * tầng Entity, thêm field mới sẽ đụng DXF/IDF export — ngoài phạm vi M0 rẻ-độc lập). */
const TITLE_BLOCK_SCALE_PREFIX = 'Tỷ lệ ';

/**
 * M0 fix — trả về entities đã GHI ĐÈ đúng vị trí text tỉ lệ (nếu có, do `titleBlock()` chèn) bằng
 * `scaleLabel` TÍNH THẬT từ `fitBox()` tại đúng khổ giấy/lề sẽ dùng lúc xuất PDF này — KHÔNG đụng
 * `doc.entities` gốc (chỉ áp cho bản vẽ ra PDF), giữ nguyên field `scale` gõ tay trong app như cũ.
 * Entity không khớp tiền tố trả về NGUYÊN VẸN (giữ reference, không clone thừa).
 */
export function applyRealScaleToTitleBlock(entities: Entity[], scaleLabel: string): Entity[] {
  return entities.map((e) =>
    e.type === 'text' && e.text.startsWith(TITLE_BLOCK_SCALE_PREFIX)
      ? { ...e, text: `${TITLE_BLOCK_SCALE_PREFIX}${scaleLabel}` }
      : e,
  );
}

/** Dim style tối thiểu — bản sao cục bộ giống hệt DEFAULT_DIM_STYLE của render.ts (chủ đích
 * KHÔNG import từ store.ts để tránh kéo theo 'use client'/zustand vào module thuần này —
 * render.ts cũng tự định nghĩa riêng với lý do y hệt, xem comment ở đó). */
export interface CadPdfDimStyle {
  textHeight: number;
  arrowSize: number;
  dimScale: number;
}
const DEFAULT_DIM_STYLE: CadPdfDimStyle = { textHeight: 120, arrowSize: 80, dimScale: 1 };

export interface CadPdfOptions {
  /** khổ giấy mm [rộng, cao] — mặc định A3 ngang (420×297, đủ cho mặt bằng căn hộ nhỏ-vừa). */
  paper?: [number, number];
  /** lề mm quanh bản vẽ trong khổ giấy. */
  margin?: number;
  /** tiêu đề in góc dưới-trái trang (VD tên project + sheet). */
  title?: string;
  dimStyle?: CadPdfDimStyle;
}

const MM_PER_PT = 25.4 / 72;
const mmToPt = (mm: number) => Math.max(4, mm / MM_PER_PT);

function layerColorOf(doc: Doc, e: Entity, fallback: string): string {
  if (e.color) return e.color;
  const lay = doc.layers.find((l) => l.id === e.layer);
  return lay?.color ?? fallback;
}

/** Lineweight HIỆU DỤNG = mm trên giấy thật (KHÔNG nhân v.scale — xem comment đầu file). */
function lineWidthMmOf(doc: Doc, e: Entity): number {
  const lay = doc.layers.find((l) => l.id === e.layer);
  return Math.max(0.05, e.lineweight ?? lay?.lineweight ?? 0.25);
}

function blockLocalToWorld(lp: Pt, at: Pt, rot: number, sx: number, sy: number): Pt {
  const x = lp.x * sx;
  const y = lp.y * sy;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  return { x: at.x + x * cos - y * sin, y: at.y + x * sin + y * cos };
}

/** Xấp xỉ cung tròn (world mm, KHÔNG transform) thành đa giác — vẫn là ĐƯỜNG THẲNG THẬT
 * trong PDF (vector), chỉ là polyline mịn thay vì lệnh "arc" gốc của PDF (jsPDF 4.2.1 không
 * có API arc bậc thấp public để vẽ cung chuẩn — dùng polyline mịn là cách an toàn, phổ biến). */
function arcPoints(c: Pt, r: number, a1: number, a2: number): Pt[] {
  let sweep = a2 - a1;
  while (sweep <= 0) sweep += Math.PI * 2;
  while (sweep > Math.PI * 2) sweep -= Math.PI * 2;
  const segs = Math.max(8, Math.min(96, Math.ceil((sweep / (Math.PI * 2)) * 96)));
  const pts: Pt[] = [];
  for (let i = 0; i <= segs; i++) {
    const a = a1 + (sweep * i) / segs;
    pts.push({ x: c.x + r * Math.cos(a), y: c.y + r * Math.sin(a) });
  }
  return pts;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsPdf = any;

function setStroke(pdf: JsPdf, color: string, widthMm: number) {
  pdf.setDrawColor(color);
  pdf.setLineWidth(Math.max(0.03, widthMm));
}

function polylinePdf(pdf: JsPdf, pts: Pt[], closed: boolean) {
  for (let i = 0; i < pts.length - 1; i++) pdf.line(pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y);
  if (closed && pts.length > 2) pdf.line(pts[pts.length - 1].x, pts[pts.length - 1].y, pts[0].x, pts[0].y);
}

/** Fan-triangulation từ đỉnh 0 để tô đặc — CÙNG cách tiếp cận đã dùng cho HATCH SOLID khi xuất
 * DXF (xem comment lib/cad/model.ts trên HatchEntity: "tam-giác-hoá quạt từ đỉnh 0"), đủ cho đa
 * giác lồi/gần-lồi (quad tường do lệnh WALL sinh ra — phạm vi hatch đã tài liệu hoá). */
function fillPolygonPdf(pdf: JsPdf, pts: Pt[]) {
  for (let i = 1; i + 1 < pts.length; i++) {
    pdf.triangle(pts[0].x, pts[0].y, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y, 'F');
  }
}

function drawArrowPdf(pdf: JsPdf, from: Pt, tip: Pt, color: string, sizeMm: number) {
  const dx = tip.x - from.x;
  const dy = tip.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;
  const size = Math.max(0.8, sizeMm);
  const back = { x: tip.x - ux * size, y: tip.y - uy * size };
  pdf.setFillColor(color);
  pdf.triangle(tip.x, tip.y, back.x + px * size * 0.4, back.y + py * size * 0.4, back.x - px * size * 0.4, back.y - py * size * 0.4, 'F');
}

function drawPrimPdf(pdf: JsPdf, v: Viewport, prim: Prim, tf: (p: Pt) => Pt, color: string, widthMm: number) {
  const S = (p: Pt) => worldToScreen(v, tf(p));
  setStroke(pdf, color, widthMm);
  if (prim.k === 'line') {
    const a = S(prim.a);
    const b = S(prim.b);
    pdf.line(a.x, a.y, b.x, b.y);
  } else if (prim.k === 'poly') {
    polylinePdf(pdf, prim.pts.map(S), !!prim.closed);
  } else if (prim.k === 'circle') {
    const c = worldToScreen(v, tf(prim.c));
    pdf.circle(c.x, c.y, Math.max(0.1, Math.abs(prim.r) * v.scale), 'S');
  } else if (prim.k === 'arc') {
    const pts = arcPoints(prim.c, prim.r, prim.a1, prim.a2).map((p) => S(p));
    polylinePdf(pdf, pts, false);
  }
}

function drawHatchPdf(pdf: JsPdf, v: Viewport, e: Extract<Entity, { type: 'hatch' }>, color: string) {
  if (e.points.length < 3) return;
  const S = (p: Pt) => worldToScreen(v, p);
  const pattern = e.pattern ?? (e.solid === false ? 'ANSI31' : 'SOLID');
  if (pattern === 'SOLID') {
    pdf.setFillColor(color);
    fillPolygonPdf(pdf, e.points.map(S));
  } else if (pattern === 'DOTS') {
    pdf.setFillColor(color);
    for (const p of hatchDots(e.points, e.patternScale ?? 1)) {
      const s = S(p);
      pdf.circle(s.x, s.y, 0.15, 'F');
    }
  } else {
    setStroke(pdf, color, 0.1);
    for (const [p, q] of hatchLines(e.points, pattern, e.patternScale ?? 1, e.patternAngle ?? 0)) {
      const a = S(p);
      const b = S(q);
      pdf.line(a.x, a.y, b.x, b.y);
    }
  }
}

function drawDimPdf(pdf: JsPdf, v: Viewport, e: DimEntity, color: string, ds: CadPdfDimStyle) {
  const S = (p: Pt) => worldToScreen(v, p);
  const kind = e.kind ?? 'aligned';
  setStroke(pdf, color, 0.15);
  pdf.setTextColor(color);
  pdf.setFontSize(mmToPt(ds.textHeight * ds.dimScale * v.scale));
  const arrowMm = Math.max(0.8, ds.arrowSize * ds.dimScale * v.scale);

  if (kind === 'radius' || kind === 'diameter') {
    const diameter = kind === 'diameter';
    const r = Math.hypot(e.b.x - e.a.x, e.b.y - e.a.y);
    const from = diameter ? { x: e.a.x * 2 - e.b.x, y: e.a.y * 2 - e.b.y } : e.a;
    const sFrom = S(from);
    const sTo = S(e.b);
    pdf.line(sFrom.x, sFrom.y, sTo.x, sTo.y);
    drawArrowPdf(pdf, sFrom, sTo, color, arrowMm);
    if (diameter) drawArrowPdf(pdf, sTo, sFrom, color, arrowMm);
    const label = diameter ? `⌀${Math.round(r * 2)}` : `R${Math.round(r)}`;
    pdf.text(label, (sFrom.x + sTo.x) / 2, (sFrom.y + sTo.y) / 2 - 1);
  } else if (kind === 'angular' && e.c) {
    const ang1 = Math.atan2(e.a.y - e.c.y, e.a.x - e.c.x);
    const ang2 = Math.atan2(e.b.y - e.c.y, e.b.x - e.c.x);
    const r = Math.abs(e.off) || 500;
    const p1 = { x: e.c.x + r * Math.cos(ang1), y: e.c.y + r * Math.sin(ang1) };
    const p2 = { x: e.c.x + r * Math.cos(ang2), y: e.c.y + r * Math.sin(ang2) };
    const sc = S(e.c);
    const sp1 = S(p1);
    const sp2 = S(p2);
    pdf.line(sc.x, sc.y, sp1.x, sp1.y);
    pdf.line(sc.x, sc.y, sp2.x, sp2.y);
    polylinePdf(pdf, arcPoints(e.c, r, ang1, ang2).map(S), false);
    let sweep = ang2 - ang1;
    while (sweep <= 0) sweep += Math.PI * 2;
    const deg = Math.round((sweep * 180) / Math.PI);
    const mid = ang1 + sweep / 2;
    const tp = S({ x: e.c.x + r * Math.cos(mid), y: e.c.y + r * Math.sin(mid) });
    pdf.text(`${deg}°`, tp.x, tp.y);
  } else {
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
    pdf.line(sa0.x, sa0.y, sa.x, sa.y);
    pdf.line(sb0.x, sb0.y, sb.x, sb.y);
    pdf.line(sa.x, sa.y, sb.x, sb.y);
    pdf.text(`${Math.round(len)}`, (sa.x + sb.x) / 2, (sa.y + sb.y) / 2 - 1);
  }
}

function drawEntityPdf(pdf: JsPdf, v: Viewport, doc: Doc, e: Entity, ds: CadPdfDimStyle) {
  const S = (p: Pt) => worldToScreen(v, p);
  const color = layerColorOf(doc, e, '#111111');
  const widthMm = lineWidthMmOf(doc, e);
  setStroke(pdf, color, widthMm);

  switch (e.type) {
    case 'line': {
      const a = S(e.a);
      const b = S(e.b);
      pdf.line(a.x, a.y, b.x, b.y);
      break;
    }
    case 'polyline':
      polylinePdf(pdf, e.points.map(S), e.closed);
      break;
    case 'rect': {
      const p0 = S({ x: e.x, y: e.y });
      const p1 = S({ x: e.x + e.w, y: e.y + e.h });
      pdf.rect(Math.min(p0.x, p1.x), Math.min(p0.y, p1.y), Math.abs(p1.x - p0.x), Math.abs(p1.y - p0.y), 'S');
      break;
    }
    case 'circle': {
      const c = S(e.c);
      pdf.circle(c.x, c.y, Math.max(0.1, Math.abs(e.r) * v.scale), 'S');
      break;
    }
    case 'arc':
      polylinePdf(pdf, arcPoints(e.c, e.r, e.a1, e.a2).map(S), false);
      break;
    case 'text': {
      const at = S(e.at);
      pdf.setTextColor(color);
      pdf.setFontSize(mmToPt(Math.max(1, e.h) * v.scale));
      pdf.text(e.text, at.x, at.y);
      break;
    }
    case 'dim':
      drawDimPdf(pdf, v, e, color, ds);
      break;
    case 'block': {
      const def = BLOCK_MAP[e.block];
      if (!def) break;
      const tf = (p: Pt) => blockLocalToWorld(p, e.at, e.rot, e.sx, e.sy);
      for (const prim of def.prims) drawPrimPdf(pdf, v, prim, tf, color, widthMm);
      break;
    }
    case 'hatch':
      drawHatchPdf(pdf, v, e, color);
      break;
    // Zone tool (N2) — hỗ trợ tối thiểu trong PDF vector: ellipse/zone → polyline xấp xỉ,
    // arrow → polyline + 2 đoạn đầu mũi tên. Zone fill nhạt qua GState opacity (jsPDF hỗ trợ);
    // môi trường không hỗ trợ GState → chỉ vẽ viền + nhãn (không crash).
    case 'ellipse':
      polylinePdf(pdf, ellipseBoundaryPoints(e.c, e.rx, e.ry, e.rot ?? 0, 32).map(S), true);
      break;
    case 'arrow': {
      if (e.path.length < 2) break;
      pdf.setLineDashPattern?.([1.5, 1.2], 0);
      polylinePdf(pdf, e.path.map(S), false);
      pdf.setLineDashPattern?.([], 0);
      const head = (from: Pt, tip: Pt) => {
        const size = e.headSize ?? 250;
        const dx = tip.x - from.x;
        const dy = tip.y - from.y;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        const back = { x: tip.x - ux * size, y: tip.y - uy * size };
        const t = S(tip);
        const b1 = S({ x: back.x - uy * size * 0.4, y: back.y + ux * size * 0.4 });
        const b2 = S({ x: back.x + uy * size * 0.4, y: back.y - ux * size * 0.4 });
        pdf.line(b1.x, b1.y, t.x, t.y);
        pdf.line(b2.x, b2.y, t.x, t.y);
      };
      if (e.headEnd !== false) head(e.path[e.path.length - 2], e.path[e.path.length - 1]);
      if (e.headStart) head(e.path[1], e.path[0]);
      break;
    }
    case 'zone': {
      const pts = zoneBoundaryPoints(e, 32).map(S);
      if (pts.length < 3) break;
      const zColor = e.color ?? ZONE_GROUP_META[e.group]?.color ?? '#9a9488';
      setStroke(pdf, zColor, widthMm);
      try {
        const P = pdf as unknown as { GState?: new (o: { opacity: number }) => unknown; setGState?: (g: unknown) => void; setFillColor: (c: string) => void };
        if (P.GState && P.setGState) {
          P.setFillColor(zColor);
          P.setGState(new P.GState({ opacity: Math.max(0, Math.min(1, e.opacity ?? 0.4)) }));
          fillPolygonPdf(pdf, pts);
          P.setGState(new P.GState({ opacity: 1 }));
        }
      } catch {
        /* fallback: chỉ viền */
      }
      polylinePdf(pdf, pts, true);
      if (e.label) {
        const at = S(e.labelPos ?? zoneCentroid(e));
        pdf.setTextColor('#1E1B16');
        pdf.setFontSize(mmToPt(Math.max(2, 260 * v.scale)));
        pdf.text(e.label.toUpperCase(), at.x, at.y, { align: 'center' });
      }
      break;
    }
  }
}

/**
 * Dựng jsPDF instance đã vẽ xong Doc (tách riêng khỏi exportCadToPdf để test được — tạo Blob/
 * ArrayBuffer kiểm tra mà không cần DOM/anchor-click, xem lib/cad/pdf.node-check.mjs khi verify).
 */
export async function buildCadPdf(doc: Doc, opts: CadPdfOptions = {}) {
  const { jsPDF } = await import('jspdf');
  const [pw, ph] = opts.paper ?? DEFAULT_PDF_PAPER_MM;
  const margin = opts.margin ?? DEFAULT_PDF_MARGIN_MM;
  const ds = opts.dimStyle ?? DEFAULT_DIM_STYLE;
  const pdf = new jsPDF({ unit: 'mm', format: [pw, ph] });

  const box = docBox(doc) ?? { minX: -1000, minY: -1000, maxX: 1000, maxY: 1000 };
  const v: Viewport = fitBox(box, pw, ph, margin);
  // M0 fix (§1.6) — khoá lỗi tỉ lệ khung tên gõ tay không khớp tỉ lệ in thật: TÍNH LẠI "1:N" thật
  // từ chính v.scale (đã fitBox cho ĐÚNG khổ giấy pw×ph/lề margin của lần xuất này) rồi ghi đè vào
  // entity text khung tên trước khi vẽ — entity gốc trong doc/app KHÔNG đổi.
  const scaleLabel = fitScaleLabel(box, [pw, ph], margin);
  const entities = applyRealScaleToTitleBlock(doc.entities, scaleLabel);

  pdf.setLineCap?.(1); // 1 = round — nét nối mượt hơn (không bắt buộc, jsPDF fallback im lặng nếu thiếu)
  for (const e of entities) {
    const lay = doc.layers.find((l) => l.id === e.layer);
    if (lay && !lay.visible) continue; // layer ẩn trong app → không vẽ vào PDF (xem giới hạn OCG đầu file)
    drawEntityPdf(pdf, v, doc, e, ds);
  }
  if (opts.title) {
    pdf.setFontSize(9);
    pdf.setTextColor('#888888');
    pdf.text(opts.title, margin, ph - 6);
  }
  return pdf;
}

/** Xuất + tải xuống (client-only, giống exportDeckToPdf của Present). */
export async function exportCadToPdf(doc: Doc, filename = 'layout.pdf', opts: CadPdfOptions = {}): Promise<void> {
  if (typeof window === 'undefined') return;
  const pdf = await buildCadPdf(doc, opts);
  pdf.save(filename);
}
