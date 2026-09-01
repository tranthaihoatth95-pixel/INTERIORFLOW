/**
 * lib/cad/query-snap-index.test.ts — CHỐT CHẶN cho CHỈ MỤC KHÔNG GIAN của findSnap (vá lag 01/09).
 *
 * Ba thứ phải chứng minh, không tin lời:
 *  ① NGỮ NGHĨA Y NGUYÊN — findSnap (chỉ mục) trả đúng {type, pt} như BẢN ĐỐI CHỨNG chép nguyên
 *    thuật toán quét-trọn-doc trước vá, trên hàng trăm truy vấn ngẫu nhiên (seed cố định) phủ
 *    đủ loại entity + lớp ẩn + `from` + dung sai từ 5mm tới 50m (nhánh tra-mọi-ô).
 *  ② CACHE KHÔNG MÙ — cùng khuôn `LAYER_INDEX_CACHE`: mảng entities mới ⇒ dựng lại; `push` vào
 *    mảng cũ (đường nhập DXF) ⇒ chốt `n` bắt; rê chuột N lần trên doc đứng yên ⇒ đúng 1 lần dựng;
 *    bật/tắt lớp TẠI CHỖ ⇒ thấy ngay, KHÔNG dựng lại.
 *  ③ NHANH HƠN THẬT — trên doc 12.000 entity, tổng thời gian 60 truy vấn qua chỉ mục phải THẤP
 *    hơn bản quét trọn (so tương đối, không neo số ms tuyệt đối cho đỡ phập phù theo máy).
 *
 * Chạy: node_modules/.bin/sucrase-node lib/cad/query-snap-index.test.ts
 */
import type { Doc, Entity, Layer, Pt } from './model';
import { dist, mid, nearestOnSeg, segIntersect, zoneBoundaryPoints, ellipseBoundaryPoints } from './model';
import { findSnap, entSegments, snapIndexFor, SNAP_INDEX_DEM, type SnapResult, type SnapType } from './query';
import type { SnapSettings } from './store';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean, got?: unknown) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label} → ${JSON.stringify(got)}`); }
}

const ALL_ON: SnapSettings = {
  enabled: true, endpoint: true, midpoint: true, center: true, intersection: true, grid: true,
  quadrant: true, node: true, nearest: true, perpendicular: true, tangent: true,
};

/* ══════════ BẢN ĐỐI CHỨNG — chép nguyên thuật toán findSnap TRƯỚC vá (quét trọn doc) ══════════ */

function refEndpoints(e: Entity): Pt[] {
  switch (e.type) {
    case 'line':
    case 'dim':
      return [e.a, e.b];
    case 'polyline':
      return e.points;
    case 'rect':
      return [
        { x: e.x, y: e.y },
        { x: e.x + e.w, y: e.y },
        { x: e.x + e.w, y: e.y + e.h },
        { x: e.x, y: e.y + e.h },
      ];
    case 'circle':
    case 'arc':
      return [];
    case 'text':
      return [e.at];
    case 'block':
      return [e.at];
    case 'hatch':
      return e.points;
    case 'ellipse':
      return ellipseBoundaryPoints(e.c, e.rx, e.ry, e.rot ?? 0, 8);
    case 'arrow':
      return e.path;
    case 'zone':
      return zoneBoundaryPoints(e, 16);
    case 'room':
      return e.boundary;
  }
}
function norm2pi(a: number): number { return ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2); }
function inSweep(ang: number, a1: number, a2: number): boolean {
  const sweep = norm2pi(a2 - a1) || Math.PI * 2;
  return norm2pi(ang - a1) <= sweep + 1e-9;
}
function refQuadrant(e: Entity): Pt[] {
  if (e.type !== 'circle' && e.type !== 'arc') return [];
  const pts = [
    { ang: 0, p: { x: e.c.x + e.r, y: e.c.y } },
    { ang: Math.PI / 2, p: { x: e.c.x, y: e.c.y + e.r } },
    { ang: Math.PI, p: { x: e.c.x - e.r, y: e.c.y } },
    { ang: (Math.PI * 3) / 2, p: { x: e.c.x, y: e.c.y - e.r } },
  ];
  if (e.type === 'circle') return pts.map((q) => q.p);
  return pts.filter((q) => inSweep(q.ang, e.a1, e.a2)).map((q) => q.p);
}
function refNode(e: Entity): Pt[] { return e.type === 'text' || e.type === 'block' ? [e.at] : []; }
function refNearestOn(e: Entity, world: Pt): { pt: Pt; d: number } | null {
  if (e.type === 'circle' || e.type === 'arc') {
    const ang = Math.atan2(world.y - e.c.y, world.x - e.c.x);
    if (e.type === 'arc' && !inSweep(ang, e.a1, e.a2)) return null;
    const pt = { x: e.c.x + e.r * Math.cos(ang), y: e.c.y + e.r * Math.sin(ang) };
    return { pt, d: dist(world, pt) };
  }
  let best: { pt: Pt; d: number } | null = null;
  for (const [a, b] of entSegments(e)) {
    const r = nearestOnSeg(world, a, b);
    if (!best || r.d < best.d) best = r;
  }
  return best;
}
function refPerp(e: Entity, from: Pt): Pt | null {
  if (e.type === 'circle' || e.type === 'arc') {
    const d = dist(from, e.c);
    if (d < 1e-6) return null;
    const ang = Math.atan2(from.y - e.c.y, from.x - e.c.x);
    const cands = [ang, ang + Math.PI].map((a) => ({ x: e.c.x + e.r * Math.cos(a), y: e.c.y + e.r * Math.sin(a) }));
    const valid = cands.filter((p) => e.type === 'circle' || inSweep(Math.atan2(p.y - e.c.y, p.x - e.c.x), e.a1, e.a2));
    if (!valid.length) return null;
    return valid.reduce((a, b) => (dist(from, a) < dist(from, b) ? a : b));
  }
  let best: { pt: Pt; d: number } | null = null;
  for (const [a, b] of entSegments(e)) {
    const r = nearestOnSeg(from, a, b);
    if (!best || r.d < best.d) best = r;
  }
  return best?.pt ?? null;
}
function refTangent(e: Entity, from: Pt): Pt[] {
  if (e.type !== 'circle' && e.type !== 'arc') return [];
  const d = dist(from, e.c);
  if (d <= e.r + 1e-6) return [];
  const baseAng = Math.atan2(from.y - e.c.y, from.x - e.c.x);
  const offset = Math.acos(Math.min(1, e.r / d));
  const cands = [baseAng + offset, baseAng - offset].map((a) => ({ x: e.c.x + e.r * Math.cos(a), y: e.c.y + e.r * Math.sin(a), ang: a }));
  return cands.filter((p) => e.type === 'circle' || inSweep(norm2pi(p.ang), e.a1, e.a2)).map((p) => ({ x: p.x, y: p.y }));
}

/** findSnap bản CŨ — chép nguyên văn logic trước vá (quét trọn doc mỗi lượt). */
function findSnapThamChieu(doc: Doc, world: Pt, tolMm: number, gridStep: number, snap: SnapSettings, from?: Pt): SnapResult {
  if (!snap.enabled) return { pt: world, type: 'none' };
  const visible = doc.entities.filter((e) => {
    const lay = doc.layers.find((l) => l.id === e.layer);
    return !lay || lay.visible;
  });
  const nearestOf = (pts: Pt[]): Pt | null => {
    let best: { pt: Pt; d: number } | null = null;
    for (const p of pts) {
      const d = dist(world, p);
      if (d <= tolMm && (!best || d < best.d)) best = { pt: p, d };
    }
    return best?.pt ?? null;
  };
  if (snap.endpoint) {
    const pts: Pt[] = [];
    for (const e of visible) pts.push(...refEndpoints(e).filter(() => e.type !== 'circle' && e.type !== 'arc'));
    const p = nearestOf(pts);
    if (p) return { pt: p, type: 'endpoint' };
  }
  if (snap.intersection) {
    const segs: [Pt, Pt][] = [];
    for (const e of visible) segs.push(...entSegments(e));
    const near = segs.filter(([a, b]) => nearestOnSeg(world, a, b).d < tolMm * 4);
    const xs: Pt[] = [];
    for (let i = 0; i < near.length; i++)
      for (let k = i + 1; k < near.length; k++) {
        const x = segIntersect(near[i][0], near[i][1], near[k][0], near[k][1]);
        if (x) xs.push(x);
      }
    const p = nearestOf(xs);
    if (p) return { pt: p, type: 'intersection' };
  }
  if (snap.center) {
    const pts: Pt[] = [];
    for (const e of visible) if (e.type === 'circle' || e.type === 'arc') pts.push(e.c);
    const p = nearestOf(pts);
    if (p) return { pt: p, type: 'center' };
  }
  if (snap.midpoint) {
    const pts: Pt[] = [];
    for (const e of visible) for (const [a, b] of entSegments(e)) pts.push(mid(a, b));
    const p = nearestOf(pts);
    if (p) return { pt: p, type: 'midpoint' };
  }
  if (from && (snap.perpendicular || snap.tangent)) {
    let best: { pt: Pt; type: SnapType; d: number } | null = null;
    if (snap.perpendicular) {
      for (const e of visible) {
        const p = refPerp(e, from);
        if (!p) continue;
        const d = dist(world, p);
        if (d <= tolMm && (!best || d < best.d)) best = { pt: p, type: 'perpendicular', d };
      }
    }
    if (snap.tangent) {
      for (const e of visible)
        for (const p of refTangent(e, from)) {
          const d = dist(world, p);
          if (d <= tolMm && (!best || d < best.d)) best = { pt: p, type: 'tangent', d };
        }
    }
    if (best) return { pt: best.pt, type: best.type };
  }
  if (snap.quadrant) {
    const pts: Pt[] = [];
    for (const e of visible) pts.push(...refQuadrant(e));
    const p = nearestOf(pts);
    if (p) return { pt: p, type: 'quadrant' };
  }
  if (snap.node) {
    const pts: Pt[] = [];
    for (const e of visible) pts.push(...refNode(e));
    const p = nearestOf(pts);
    if (p) return { pt: p, type: 'node' };
  }
  if (snap.nearest) {
    let bn: { pt: Pt; d: number } | null = null;
    for (const e of visible) {
      const r = refNearestOn(e, world);
      if (r && (!bn || r.d < bn.d)) bn = r;
    }
    if (bn && bn.d <= tolMm) return { pt: bn.pt, type: 'nearest' };
  }
  if (snap.grid) {
    const gp = { x: Math.round(world.x / gridStep) * gridStep, y: Math.round(world.y / gridStep) * gridStep };
    if (dist(world, gp) <= tolMm) return { pt: gp, type: 'grid' };
  }
  return { pt: world, type: 'none' };
}

/* ══════════ doc ngẫu nhiên seed cố định ══════════ */

let seed = 20260901;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const R = (lo: number, hi: number) => lo + rnd() * (hi - lo);

const layers: Layer[] = [
  { id: 'l1', name: 'A-Wall', color: '#ffffff', visible: true, locked: false },
  { id: 'l2', name: 'A-Hidden', color: '#888888', visible: false, locked: false },
];
function randomEntities(n: number): Entity[] {
  const out: Entity[] = [];
  for (let i = 0; i < n; i++) {
    const layer = rnd() < 0.25 ? 'l2' : 'l1';
    const id = `e${i}`;
    const x = R(0, 40000);
    const y = R(0, 40000);
    const kind = Math.floor(rnd() * 8);
    if (kind === 0) out.push({ id, type: 'line', layer, a: { x, y }, b: { x: x + R(-3000, 3000), y: y + R(-3000, 3000) } } as Entity);
    else if (kind === 1) out.push({ id, type: 'circle', layer, c: { x, y }, r: R(100, 1500) } as Entity);
    else if (kind === 2) out.push({ id, type: 'arc', layer, c: { x, y }, r: R(100, 1500), a1: R(0, 3), a2: R(3, 6) } as Entity);
    else if (kind === 3) out.push({ id, type: 'rect', layer, x, y, w: R(200, 4000), h: R(200, 4000) } as Entity);
    else if (kind === 4) {
      const pts: Pt[] = [];
      const m = 3 + Math.floor(rnd() * 3);
      for (let k = 0; k < m; k++) pts.push({ x: x + R(-2000, 2000), y: y + R(-2000, 2000) });
      out.push({ id, type: 'polyline', layer, points: pts, closed: rnd() < 0.5 } as Entity);
    } else if (kind === 5) out.push({ id, type: 'text', layer, at: { x, y }, text: 'GHI CHÚ', h: 200 } as Entity);
    else if (kind === 6) out.push({ id, type: 'hatch', layer, solid: true, points: [{ x, y }, { x: x + 800, y }, { x: x + 800, y: y + 800 }, { x, y: y + 800 }] } as Entity);
    else out.push({ id, type: 'dim', layer, a: { x, y }, b: { x: x + R(500, 3000), y }, off: R(-800, 800) } as Entity);
  }
  // 1 bản sao đặt xa 12 km — đúng ca hồ sơ thật từng gặp (khung bao kỳ dị, đoạn quá khổ).
  out.push({ id: 'far', type: 'line', layer: 'l1', a: { x: 12_000_000, y: 0 }, b: { x: 12_000_000, y: 12_000_000 } } as Entity);
  return out;
}

const doc: Doc = { entities: randomEntities(400), layers } as Doc;

/* ══════════ ① PARITY — chỉ mục trả y hệt bản quét trọn ══════════ */
console.log('① parity findSnap chỉ-mục vs bản quét trọn doc (seed cố định)');
{
  const CAU_HINH: SnapSettings[] = [
    ALL_ON,
    { ...ALL_ON, endpoint: false, midpoint: false },
    { ...ALL_ON, intersection: false, nearest: false },
    { ...ALL_ON, endpoint: false, intersection: false, center: false, midpoint: false, quadrant: false, node: false },
  ];
  let lech = 0;
  let soLuot = 0;
  for (let t = 0; t < 300; t++) {
    // con trỏ: 2/3 số lượt bám sát một entity thật (mới có ứng viên), 1/3 rơi tự do.
    let world: Pt;
    if (rnd() < 0.67) {
      const e = doc.entities[Math.floor(rnd() * doc.entities.length)];
      const anchor = refEndpoints(e)[0] ?? (e.type === 'circle' || e.type === 'arc' ? e.c : { x: 0, y: 0 });
      world = { x: anchor.x + R(-80, 80), y: anchor.y + R(-80, 80) };
    } else {
      world = { x: R(-2000, 42000), y: R(-2000, 42000) };
    }
    const tol = [5, 60, 400, 50000][Math.floor(rnd() * 4)];
    const from = rnd() < 0.4 ? { x: R(0, 40000), y: R(0, 40000) } : undefined;
    const snap = CAU_HINH[Math.floor(rnd() * CAU_HINH.length)];
    const a = findSnap(doc, world, tol, 100, snap, from);
    const b = findSnapThamChieu(doc, world, tol, 100, snap, from);
    soLuot += 1;
    const cung =
      a.type === b.type && Math.abs(a.pt.x - b.pt.x) < 1e-6 && Math.abs(a.pt.y - b.pt.y) < 1e-6;
    if (!cung) {
      lech += 1;
      if (lech <= 3) console.log(`    lệch @${t}: world=${JSON.stringify(world)} tol=${tol} moi=${JSON.stringify(a)} cu=${JSON.stringify(b)}`);
    }
  }
  ok(`300 truy vấn ngẫu nhiên (4 cấu hình snap, tol 5mm→50m, có/không from) trùng khớp 100%`, lech === 0, { lech, soLuot });
}

/* ══════════ ② CACHE — dựng đúng lúc, không dựng thừa ══════════ */
console.log('② chỉ mục dựng 1 lần / doc — rê chuột không làm nó nhúc nhích');
{
  const truoc = SNAP_INDEX_DEM.dung;
  for (let i = 0; i < 50; i++) findSnap(doc, { x: R(0, 40000), y: R(0, 40000) }, 60, 100, ALL_ON);
  ok('50 lượt findSnap trên doc đứng yên ⇒ 0 lần dựng thêm', SNAP_INDEX_DEM.dung === truoc, SNAP_INDEX_DEM.dung - truoc);
}
{
  // push vào MẢNG CŨ (đường nhập DXF) — chốt n phải bắt, và điểm mới phải snap được.
  const truoc = SNAP_INDEX_DEM.dung;
  doc.entities.push({ id: 'moi', type: 'line', layer: 'l1', a: { x: 90000, y: 90000 }, b: { x: 91000, y: 90000 } } as Entity);
  const r = findSnap(doc, { x: 90003, y: 90002 }, 50, 100, ALL_ON);
  ok('push vào mảng cũ ⇒ dựng lại đúng 1 lần', SNAP_INDEX_DEM.dung === truoc + 1, SNAP_INDEX_DEM.dung - truoc);
  ok('…và endpoint của entity vừa push snap được ngay', r.type === 'endpoint' && r.pt.x === 90000 && r.pt.y === 90000, r);
}
{
  // mảng entities MỚI (mutation qua store) ⇒ khoá WeakMap mới ⇒ dựng lại.
  const truoc = SNAP_INDEX_DEM.dung;
  const doc2: Doc = { ...doc, entities: [...doc.entities] } as Doc;
  findSnap(doc2, { x: 90003, y: 90002 }, 50, 100, ALL_ON);
  ok('mảng entities mới ⇒ dựng lại', SNAP_INDEX_DEM.dung === truoc + 1, SNAP_INDEX_DEM.dung - truoc);
}
{
  // bật/tắt lớp TẠI CHỖ — chỉ mục KHÔNG đổi, kết quả phải đổi ngay (bảng lớp tra mỗi lượt).
  const lineL2: Entity = { id: 'an', type: 'line', layer: 'l2', a: { x: 95000, y: 95000 }, b: { x: 96000, y: 95000 } } as Entity;
  doc.entities.push(lineL2);
  const anTruoc = findSnap(doc, { x: 95004, y: 95003 }, 50, 100, ALL_ON);
  ok('lớp đang ẩn ⇒ không snap vào entity của nó', anTruoc.type !== 'endpoint', anTruoc);
  const truoc = SNAP_INDEX_DEM.dung;
  layers[1].visible = true; // sửa TẠI CHỖ, không thay mảng
  const hien = findSnap(doc, { x: 95004, y: 95003 }, 50, 100, ALL_ON);
  ok('bật lớp tại chỗ ⇒ snap được NGAY, không dựng lại chỉ mục', hien.type === 'endpoint' && SNAP_INDEX_DEM.dung === truoc, { hien, dung: SNAP_INDEX_DEM.dung - truoc });
  layers[1].visible = false;
  const anLai = findSnap(doc, { x: 95004, y: 95003 }, 50, 100, ALL_ON);
  ok('tắt lại ⇒ mất ngay, vẫn không dựng lại', anLai.type !== 'endpoint' && SNAP_INDEX_DEM.dung === truoc, anLai);
}

/* ══════════ ③ PERF tương đối — 12.000 entity ══════════ */
console.log('③ 12.000 entity: chỉ mục phải NHANH hơn quét trọn (đo tương đối, cùng máy cùng lượt)');
{
  seed = 7;
  const big: Doc = { entities: randomEntities(12000), layers: [{ id: 'l1', name: 'A', color: '#fff', visible: true, locked: false }] } as Doc;
  const queries: Pt[] = [];
  for (let i = 0; i < 60; i++) queries.push({ x: R(0, 40000), y: R(0, 40000) });
  // làm ấm (dựng chỉ mục 1 lần — chi phí này tính NGOÀI vòng đo, đúng cách app trả nó 1 lần/doc)
  findSnap(big, queries[0], 60, 100, ALL_ON);
  const t0 = performance.now();
  for (const q of queries) findSnap(big, q, 60, 100, ALL_ON);
  const tIdx = performance.now() - t0;
  const t1 = performance.now();
  for (const q of queries) findSnapThamChieu(big, q, 60, 100, ALL_ON);
  const tRef = performance.now() - t1;
  console.log(`    chỉ mục: ${tIdx.toFixed(1)} ms / 60 lượt (${(tIdx / 60).toFixed(2)} ms/lượt) · quét trọn: ${tRef.toFixed(1)} ms (${(tRef / 60).toFixed(2)} ms/lượt)`);
  ok('tổng 60 lượt qua chỉ mục < tổng qua quét trọn', tIdx < tRef, { tIdx, tRef });
  ok('mỗi lượt qua chỉ mục dưới 16ms (ngân sách 1 khung hình)', tIdx / 60 < 16, tIdx / 60);
}
{
  // sổ chỉ mục kể đúng chuyện: đoạn 12km nằm ở danh sách quá khổ, không nhân bản ra nghìn ô.
  const idx = snapIndexFor(doc);
  ok('đoạn 12km vào danh sách quá khổ (không nổ số ô)', idx.segsQuaKho.length >= 1, idx.segsQuaKho.length);
}

console.log(`\nquery-snap-index: ${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
