/**
 * lib/cad/geometry.ts — PHÉP BIẾN HÌNH entity (translate / rotate / mirror) + offset.
 * Tách khỏi component để thuần & test được. Toạ độ mm, Y-up.
 */

import type { Entity, Pt } from './model';
import { newId } from './store';

/**
 * Sprint 5 — Việc 2 (Circle 3-điểm) + Việc 3 (Arc tâm+góc): 2 hàm hình học THUẦN, tách riêng
 * để test độc lập (không đụng store/canvas). `circumcircle` là tâm+bán kính đường tròn đi qua
 * 3 điểm bất kỳ (công thức đường tròn ngoại tiếp chuẩn) — CadCanvas.tsx tái dùng cho cả
 * Arc 3-điểm (arcFrom3) VÀ Circle 3-điểm (circle3p) để không trùng logic.
 */
export function circumcircle(p1: Pt, p2: Pt, p3: Pt): { c: Pt; r: number } | null {
  const ax = p1.x, ay = p1.y;
  const bx = p2.x, by = p2.y;
  const cx = p3.x, cy = p3.y;
  const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  if (Math.abs(d) < 1e-6) return null; // 3 điểm thẳng hàng — không xác định được đường tròn
  const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
  const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;
  const c = { x: ux, y: uy };
  const r = Math.hypot(ax - ux, ay - uy);
  return { c, r };
}

/**
 * Arc "tâm + góc" (Việc 3): click tâm `c` → click điểm `s` (xác định bán kính + góc bắt đầu)
 * → click điểm `e` (chỉ xác định góc kết thúc, bán kính giữ nguyên theo `s` — đúng thói quen
 * AutoCAD lệnh ARC "Center, Start, End"). Trả null nếu `s` trùng tâm (bán kính suy biến).
 */
export function arcFromCenterStartEnd(c: Pt, s: Pt, e: Pt): { c: Pt; r: number; a1: number; a2: number } | null {
  const r = Math.hypot(s.x - c.x, s.y - c.y);
  if (r < 1e-6) return null;
  const a1 = Math.atan2(s.y - c.y, s.x - c.x);
  const a2 = Math.atan2(e.y - c.y, e.x - c.x);
  return { c, r, a1, a2 };
}

export function translatePt(p: Pt, dx: number, dy: number): Pt {
  return { x: p.x + dx, y: p.y + dy };
}
export function rotatePt(p: Pt, c: Pt, ang: number): Pt {
  const cos = Math.cos(ang);
  const sin = Math.sin(ang);
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  return { x: c.x + dx * cos - dy * sin, y: c.y + dx * sin + dy * cos };
}
/** phản chiếu p qua đường thẳng đi qua `o` với góc `phi`. */
export function mirrorPt(p: Pt, o: Pt, phi: number): Pt {
  const cos = Math.cos(-phi);
  const sin = Math.sin(-phi);
  // dời về gốc, xoay -phi, lật y, xoay phi, dời lại
  let dx = p.x - o.x;
  let dy = p.y - o.y;
  const rx = dx * cos - dy * sin;
  let ry = dx * sin + dy * cos;
  ry = -ry;
  const cos2 = Math.cos(phi);
  const sin2 = Math.sin(phi);
  dx = rx * cos2 - ry * sin2;
  dy = rx * sin2 + ry * cos2;
  return { x: o.x + dx, y: o.y + dy };
}

export function translateEntity(e: Entity, dx: number, dy: number): Entity {
  const t = (p: Pt) => translatePt(p, dx, dy);
  switch (e.type) {
    case 'line':
      return { ...e, a: t(e.a), b: t(e.b) };
    case 'dim':
      return { ...e, a: t(e.a), b: t(e.b), ...(e.c ? { c: t(e.c) } : {}) };
    case 'polyline':
      return { ...e, points: e.points.map(t) };
    case 'rect':
      return { ...e, x: e.x + dx, y: e.y + dy };
    case 'circle':
    case 'arc':
      return { ...e, c: t(e.c) };
    case 'text':
      return { ...e, at: t(e.at) };
    case 'block':
      return { ...e, at: t(e.at) };
    case 'hatch':
      return { ...e, points: e.points.map(t) };
  }
}

function rectToPolyPts(e: { x: number; y: number; w: number; h: number }): Pt[] {
  return [
    { x: e.x, y: e.y },
    { x: e.x + e.w, y: e.y },
    { x: e.x + e.w, y: e.y + e.h },
    { x: e.x, y: e.y + e.h },
  ];
}

export function rotateEntity(e: Entity, c: Pt, ang: number): Entity {
  const r = (p: Pt) => rotatePt(p, c, ang);
  switch (e.type) {
    case 'line':
      return { ...e, a: r(e.a), b: r(e.b) };
    case 'dim':
      return { ...e, a: r(e.a), b: r(e.b), ...(e.c ? { c: r(e.c) } : {}) };
    case 'polyline':
      return { ...e, points: e.points.map(r) };
    case 'rect':
      return { id: e.id, type: 'polyline', layer: e.layer, color: e.color, closed: true, points: rectToPolyPts(e).map(r) };
    case 'circle':
      return { ...e, c: r(e.c) };
    case 'arc':
      return { ...e, c: r(e.c), a1: e.a1 + ang, a2: e.a2 + ang };
    case 'text':
      return { ...e, at: r(e.at) };
    case 'block':
      return { ...e, at: r(e.at), rot: e.rot + ang };
    case 'hatch':
      return { ...e, points: e.points.map(r) };
  }
}

export function mirrorEntity(e: Entity, o: Pt, phi: number): Entity {
  const m = (p: Pt) => mirrorPt(p, o, phi);
  switch (e.type) {
    case 'line':
      return { ...e, a: m(e.a), b: m(e.b) };
    case 'dim':
      return { ...e, a: m(e.a), b: m(e.b), ...(e.c ? { c: m(e.c) } : {}) };
    case 'polyline':
      return { ...e, points: e.points.map(m) };
    case 'rect':
      return { id: e.id, type: 'polyline', layer: e.layer, color: e.color, closed: true, points: rectToPolyPts(e).map(m) };
    case 'circle':
      return { ...e, c: m(e.c) };
    case 'arc': {
      // phản chiếu đảo chiều: đổi & phản góc quanh phi
      const ma = (a: number) => 2 * phi - a;
      return { ...e, c: m(e.c), a1: ma(e.a2), a2: ma(e.a1) };
    }
    case 'text':
      return { ...e, at: m(e.at) };
    case 'block':
      return { ...e, at: m(e.at), rot: 2 * phi - e.rot, sx: -e.sx };
    case 'hatch':
      return { ...e, points: e.points.map(m) };
  }
}

/** copy có đổi id (cho Copy/Mirror-copy). */
export function withNewId(e: Entity): Entity {
  return { ...e, id: newId('e') };
}

/**
 * Sprint 4 — Copy-paste bàn phím (Ctrl+C / Ctrl+V kiểu Office/Canva), KHÁC với tool "Copy"
 * kiểu AutoCAD (geometry.ts không đổi, tool đó vẫn dùng withNewId trực tiếp + base point).
 * Đây là hàm THUẦN: nhận danh sách entity đã "chép" (clipboard nội bộ, không phải Clipboard API
 * của OS), trả về bản sao id mới dịch nhẹ (dx/dy mm, mặc định +20/+20 để thấy được là đã dán,
 * không đè hệt lên bản gốc).
 */
export function pasteEntities(entities: Entity[], dx = 20, dy = 20): Entity[] {
  return entities.map((e) => withNewId(translateEntity(e, dx, dy)));
}

/** Offset 1 entity một khoảng `d` về phía điểm `side`. Trả null nếu không hỗ trợ. */
export function offsetEntity(e: Entity, d: number, side: Pt): Entity | null {
  switch (e.type) {
    case 'line': {
      const nx = -(e.b.y - e.a.y);
      const ny = e.b.x - e.a.x;
      const len = Math.hypot(nx, ny) || 1;
      let ux = (nx / len) * d;
      let uy = (ny / len) * d;
      // chọn phía: nếu side nằm phía ngược, đảo dấu
      const mid = { x: (e.a.x + e.b.x) / 2, y: (e.a.y + e.b.y) / 2 };
      if ((side.x - mid.x) * ux + (side.y - mid.y) * uy < 0) {
        ux = -ux;
        uy = -uy;
      }
      return { ...e, id: newId('e'), a: { x: e.a.x + ux, y: e.a.y + uy }, b: { x: e.b.x + ux, y: e.b.y + uy } };
    }
    case 'circle': {
      const inside = Math.hypot(side.x - e.c.x, side.y - e.c.y) < e.r;
      const r = inside ? Math.max(1, e.r - d) : e.r + d;
      return { ...e, id: newId('e'), r };
    }
    case 'rect': {
      const inside = side.x > Math.min(e.x, e.x + e.w) && side.x < Math.max(e.x, e.x + e.w) &&
        side.y > Math.min(e.y, e.y + e.h) && side.y < Math.max(e.y, e.y + e.h);
      const s = inside ? -d : d;
      const sw = Math.sign(e.w) || 1;
      const sh = Math.sign(e.h) || 1;
      return { ...e, id: newId('e'), x: e.x - sw * s, y: e.y - sh * s, w: e.w + 2 * sw * s, h: e.h + 2 * sh * s };
    }
    case 'polyline':
    case 'hatch': {
      // xấp xỉ: dời mỗi đỉnh theo pháp tuyến trung bình các cạnh kề, phía gần `side`.
      // hatch (poché tường do WALL/ROOM sinh ra) luôn là đa giác kín (quad), khác polyline
      // chỉ có 'closed' khi người dùng bấm C — coi hatch như closed=true.
      const closed = e.type === 'hatch' ? true : e.closed;
      const pts = e.points;
      const out: Pt[] = pts.map((p, i) => {
        const prev = pts[i - 1] ?? (closed ? pts[pts.length - 1] : p);
        const next = pts[i + 1] ?? (closed ? pts[0] : p);
        let nx = -(next.y - prev.y);
        let ny = next.x - prev.x;
        const len = Math.hypot(nx, ny) || 1;
        nx /= len;
        ny /= len;
        if ((side.x - p.x) * nx + (side.y - p.y) * ny < 0) {
          nx = -nx;
          ny = -ny;
        }
        return { x: p.x + nx * d, y: p.y + ny * d };
      });
      return { ...e, id: newId('e'), points: out };
    }
    default:
      return null;
  }
}

/* ───────────────────────── Sprint 10 — Việc 2/3: Polygon đều · Ellipse · Spline · Divide/Measure ─────────────────────────
 * Toàn bộ hàm dưới đây THUẦN (không đụng store/canvas) — quyết định Sprint 10: polygon/spline
 * lưu như PolylineEntity, ellipse xấp xỉ bằng PolylineEntity khép kín — KHÔNG thêm Entity type
 * mới vào model.ts để tránh phải sửa dxf.ts/render.ts (rủi ro thấp nhất, polyline nhiều đỉnh đã
 * render/export sẵn). Donut/Xline dùng thẳng CircleEntity/LineEntity có sẵn — xử lý ở CadCanvas. */

function norm2piLocal(a: number): number {
  return ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
}

/** Đa giác đều N cạnh (3-12, kẹp biên) nội tiếp đường tròn tâm `center`, bán kính =
 * dist(center, radiusPt); đỉnh ĐẦU TIÊN trùng `radiusPt` (góc bắt đầu = hướng vừa click, giống
 * POLYGON "Inscribed" của AutoCAD đơn giản hoá). Trả N đỉnh theo chiều CCW (world Y-up). */
export function polygonVertices(center: Pt, radiusPt: Pt, sides: number): Pt[] {
  const n = Math.max(3, Math.min(12, Math.round(sides)));
  const r = Math.hypot(radiusPt.x - center.x, radiusPt.y - center.y);
  const a0 = Math.atan2(radiusPt.y - center.y, radiusPt.x - center.x);
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = a0 + (i * Math.PI * 2) / n;
    pts.push({ x: center.x + r * Math.cos(a), y: center.y + r * Math.sin(a) });
  }
  return pts;
}

/** Xấp xỉ ellipse (tâm + 2 bán trục THẲNG TRỤC, không xoay — đơn giản hoá tối đa cho DD) bằng N
 * điểm quanh biên. `segments` càng lớn càng mượt (mặc định 48 đủ mịn ở tỉ lệ nội thất). */
export function ellipsePoints(center: Pt, rx: number, ry: number, segments = 48): Pt[] {
  const n = Math.max(12, segments);
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    pts.push({ x: center.x + rx * Math.cos(t), y: center.y + ry * Math.sin(t) });
  }
  return pts;
}

/**
 * Spline Catmull-Rom qua các control point (đi ĐÚNG qua từng điểm — khác Bézier chỉ chạm
 * đầu/cuối). Xấp xỉ bằng `stepsPerSpan` đoạn thẳng ngắn/khoảng giữa 2 control point liên tiếp.
 * < 3 control point → không đủ để nội suy cong, trả nguyên input (thoái hoá thành đoạn thẳng).
 * `closed`=true nối vòng qua control point đầu (KHÔNG lặp lại điểm đầu ở cuối mảng — polyline
 * closed:true tự nối đoạn cuối→đầu khi vẽ/export).
 */
export function catmullRomSpline(control: Pt[], stepsPerSpan = 12, closed = false): Pt[] {
  const pts = control;
  if (pts.length < 3) return pts.slice();
  const get = (i: number): Pt => (closed ? pts[(i + pts.length) % pts.length] : pts[Math.max(0, Math.min(pts.length - 1, i))]);
  const out: Pt[] = [];
  const spanCount = closed ? pts.length : pts.length - 1;
  for (let seg = 0; seg < spanCount; seg++) {
    const p0 = get(seg - 1);
    const p1 = get(seg);
    const p2 = get(seg + 1);
    const p3 = get(seg + 2);
    const isLastOpenSpan = !closed && seg === spanCount - 1;
    const steps = isLastOpenSpan ? stepsPerSpan + 1 : stepsPerSpan;
    for (let s = 0; s < steps; s++) {
      const t = s / stepsPerSpan;
      const t2 = t * t;
      const t3 = t2 * t;
      const x = 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
      const y = 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
      out.push({ x, y });
    }
  }
  return out;
}

/** Tổng chiều dài biên entity (line/polyline/circle/arc) — 0 nếu loại không có nghĩa "chia đều"
 * (rect/hatch/text/dim/block, dùng cho Divide/Measure). */
export function entityLength(e: Entity): number {
  switch (e.type) {
    case 'line':
      return Math.hypot(e.b.x - e.a.x, e.b.y - e.a.y);
    case 'polyline': {
      let len = 0;
      const pts = e.points;
      for (let i = 0; i < pts.length - 1; i++) len += Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
      if (e.closed && pts.length > 2) len += Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].y - pts[pts.length - 1].y);
      return len;
    }
    case 'circle':
      return 2 * Math.PI * e.r;
    case 'arc':
      return e.r * (norm2piLocal(e.a2 - e.a1) || Math.PI * 2);
    default:
      return 0;
  }
}

/** Điểm cách điểm đầu `s` mm dọc biên entity (kẹp trong [0, entityLength]) — null nếu loại
 * không hỗ trợ hoặc entity suy biến (dài 0). Dùng cho Divide/Measure. */
export function pointAtLength(e: Entity, s: number): Pt | null {
  const total = entityLength(e);
  if (total <= 0) return null;
  const sc = Math.max(0, Math.min(total, s));
  switch (e.type) {
    case 'line': {
      const t = sc / total;
      return { x: e.a.x + (e.b.x - e.a.x) * t, y: e.a.y + (e.b.y - e.a.y) * t };
    }
    case 'polyline': {
      const pts = e.points;
      const segs: [Pt, Pt][] = [];
      for (let i = 0; i < pts.length - 1; i++) segs.push([pts[i], pts[i + 1]]);
      if (e.closed && pts.length > 2) segs.push([pts[pts.length - 1], pts[0]]);
      let acc = 0;
      for (let i = 0; i < segs.length; i++) {
        const [a, b] = segs[i];
        const segLen = Math.hypot(b.x - a.x, b.y - a.y);
        const isLast = i === segs.length - 1;
        if (sc <= acc + segLen + 1e-9 || isLast) {
          const t = segLen > 0 ? Math.min(1, Math.max(0, (sc - acc) / segLen)) : 0;
          return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
        }
        acc += segLen;
      }
      return null;
    }
    case 'circle': {
      const ang = sc / e.r;
      return { x: e.c.x + e.r * Math.cos(ang), y: e.c.y + e.r * Math.sin(ang) };
    }
    case 'arc': {
      const ang = e.a1 + sc / e.r;
      return { x: e.c.x + e.r * Math.cos(ang), y: e.c.y + e.r * Math.sin(ang) };
    }
    default:
      return null;
  }
}

/** DIVIDE — chia entity thành `n` đoạn bằng nhau, trả các điểm chia (KHÔNG gồm 2 đầu mút của
 * entity hở — line/polyline hở/arc chỉ có `n-1` điểm; entity KÍN — circle/polyline closed — có
 * đủ `n` điểm vì không có "đầu mút"). n<2 hoặc entity suy biến → []. */
export function divideEntity(e: Entity, n: number): Pt[] {
  const total = entityLength(e);
  if (total <= 0 || n < 2) return [];
  const closed = e.type === 'circle' || (e.type === 'polyline' && e.closed);
  const count = closed ? n : n - 1;
  const pts: Pt[] = [];
  for (let i = 1; i <= count; i++) {
    const p = pointAtLength(e, (total * i) / n);
    if (p) pts.push(p);
  }
  return pts;
}

/** MEASURE — đặt điểm mỗi `segLen` mm dọc entity tính từ đầu, KHÔNG đặt điểm ở phần dư cuối
 * cùng (đúng hành vi lệnh MEASURE của AutoCAD). segLen<=0 hoặc entity suy biến → []. */
export function measureEntity(e: Entity, segLen: number): Pt[] {
  const total = entityLength(e);
  if (total <= 0 || segLen <= 0) return [];
  const pts: Pt[] = [];
  for (let s = segLen; s < total - 1e-6; s += segLen) {
    const p = pointAtLength(e, s);
    if (p) pts.push(p);
  }
  return pts;
}
