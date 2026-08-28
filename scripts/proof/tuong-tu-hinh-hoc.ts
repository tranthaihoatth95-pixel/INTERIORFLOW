/** ĐO KHẢ THI — tường trong bản vẽ nghề có thật sự là hai đường song song không? */
import { readFileSync } from 'node:fs';
import { parseDxfEx } from '/Users/tranben/Downloads/interiorflow/lib/cad/dxf';

const doc = parseDxfEx(readFileSync(process.argv[2], 'latin1')).doc;
const layers = new Map((doc.layers ?? []).map((l: any) => [l.id, l.name ?? l.id]));

// gom mọi đoạn thẳng: line + mỗi cạnh của polyline
type Seg = { a: {x:number;y:number}; b: {x:number;y:number}; layer: string };
const segs: Seg[] = [];
for (const e of doc.entities as any[]) {
  if (e.type === 'line') segs.push({ a: e.a ?? e.p1, b: e.b ?? e.p2, layer: e.layer });
  else if (e.type === 'polyline' && Array.isArray(e.pts)) {
    for (let i = 0; i + 1 < e.pts.length; i++) segs.push({ a: e.pts[i], b: e.pts[i+1], layer: e.layer });
    if (e.closed && e.pts.length > 2) segs.push({ a: e.pts.at(-1), b: e.pts[0], layer: e.layer });
  }
}
const dai = (s: Seg) => Math.hypot(s.b.x - s.a.x, s.b.y - s.a.y);
const goc = (s: Seg) => { let g = Math.atan2(s.b.y - s.a.y, s.b.x - s.a.x); if (g < 0) g += Math.PI; return g; };

const THANG = segs.filter((s) => dai(s) > 300);           // bỏ đoạn vụn < 30cm
console.log(`đoạn thẳng dựng được: ${segs.length}  ·  dài > 300mm: ${THANG.length}`);

// cặp song song, cách nhau trong khoảng bề dày tường hợp lý (60–400mm), có chồng lấn dọc trục
let cap = 0; const theoLayer = new Map<string, number>(); const beDay: number[] = [];
for (let i = 0; i < THANG.length; i++) {
  for (let j = i + 1; j < THANG.length; j++) {
    const p = THANG[i], q = THANG[j];
    if (p.layer !== q.layer) continue;
    let dg = Math.abs(goc(p) - goc(q)); if (dg > Math.PI/2) dg = Math.PI - dg;
    if (dg > 0.02) continue;                                // ~1 độ
    const ux = Math.cos(goc(p)), uy = Math.sin(goc(p));
    const d = Math.abs((q.a.x - p.a.x) * -uy + (q.a.y - p.a.y) * ux);
    if (d < 60 || d > 400) continue;
    const t = (pt: any) => (pt.x - p.a.x) * ux + (pt.y - p.a.y) * uy;
    const [p0,p1]=[t(p.a),t(p.b)].sort((a,b)=>a-b), [q0,q1]=[t(q.a),t(q.b)].sort((a,b)=>a-b);
    if (Math.min(p1,q1) - Math.max(p0,q0) < 300) continue;   // chồng lấn ít nhất 30cm
    cap++; beDay.push(Math.round(d));
    const n = layers.get(p.layer) ?? p.layer;
    theoLayer.set(n, (theoLayer.get(n) ?? 0) + 1);
  }
}
console.log(`\nCẶP SONG SONG khoảng cách 60–400mm, chồng lấn ≥300mm:  ${cap}`);
const dem = new Map<number, number>();
for (const b of beDay) { const k = Math.round(b/10)*10; dem.set(k, (dem.get(k) ?? 0) + 1); }
console.log('bề dày hay gặp (mm):', [...dem.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>`${k}×${v}`).join(' · '));
console.log('layer:', [...theoLayer.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>`${k}×${v}`).join(' · '));

/* ── GỘP cặp → TƯỜNG: mỗi cặp cho một trục giữa; gộp trục trùng nhau ── */
type Truc = { ax:number; ay:number; bx:number; by:number; d:number; layer:string };
const trucs: Truc[] = [];
for (let i = 0; i < THANG.length; i++) for (let j = i+1; j < THANG.length; j++) {
  const p = THANG[i], q = THANG[j];
  if (p.layer !== q.layer) continue;
  let dg = Math.abs(goc(p) - goc(q)); if (dg > Math.PI/2) dg = Math.PI - dg;
  if (dg > 0.02) continue;
  const ux = Math.cos(goc(p)), uy = Math.sin(goc(p));
  const d = Math.abs((q.a.x-p.a.x)*-uy + (q.a.y-p.a.y)*ux);
  if (d < 90 || d > 400) continue;                       // siết: bỏ khe 60–90mm (kính, khe co giãn)
  const t = (pt:any) => (pt.x-p.a.x)*ux + (pt.y-p.a.y)*uy;
  const [p0,p1]=[t(p.a),t(p.b)].sort((a,b)=>a-b), [q0,q1]=[t(q.a),t(q.b)].sort((a,b)=>a-b);
  const lo = Math.max(p0,q0), hi = Math.min(p1,q1);
  if (hi - lo < 500) continue;                            // tường ngắn hơn 50cm thì bỏ
  const mx = (p.a.x + q.a.x)/2, my = (p.a.y + q.a.y)/2;
  trucs.push({ ax: mx+ux*lo, ay: my+uy*lo, bx: mx+ux*hi, by: my+uy*hi, d: Math.round(d), layer: p.layer });
}
// gộp trục gần trùng
const giu: Truc[] = [];
for (const t of trucs) {
  const trung = giu.find(g =>
    Math.hypot(g.ax-t.ax, g.ay-t.ay) < 150 && Math.hypot(g.bx-t.bx, g.by-t.by) < 150 && Math.abs(g.d-t.d) < 30);
  if (!trung) giu.push(t);
}
const tongDai = giu.reduce((s,t)=>s+Math.hypot(t.bx-t.ax, t.by-t.ay), 0);
console.log(`\n⇒ TƯỜNG gộp được: ${giu.length}  ·  tổng chiều dài ${(tongDai/1000).toFixed(1)} m`);
const dd = new Map<number,number>(); for (const t of giu) dd.set(t.d,(dd.get(t.d)??0)+1);
console.log('   bề dày:', [...dd.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6).map(([k,v])=>`${k}mm×${v}`).join(' · '));

/* ── VẼ RA: bản vẽ gốc (nhạt) + tường IF nhận ra (đậm) ── */
import { writeFileSync } from 'node:fs';
let minx=1e18,miny=1e18,maxx=-1e18,maxy=-1e18;
for (const s of THANG) for (const p of [s.a,s.b]) { minx=Math.min(minx,p.x); miny=Math.min(miny,p.y); maxx=Math.max(maxx,p.x); maxy=Math.max(maxy,p.y); }
const W=maxx-minx, H=maxy-miny, S=1600/Math.max(W,H);
const X=(x:number)=>((x-minx)*S).toFixed(1), Y=(y:number)=>((maxy-y)*S).toFixed(1);
const nen = THANG.map(s=>`<line x1="${X(s.a.x)}" y1="${Y(s.a.y)}" x2="${X(s.b.x)}" y2="${Y(s.b.y)}"/>`).join('');
const tuong = giu.map(t=>`<line x1="${X(t.ax)}" y1="${Y(t.ay)}" x2="${X(t.bx)}" y2="${Y(t.by)}" stroke-width="${Math.max(1.2,t.d*S)}"/>`).join('');
writeFileSync('/tmp/tuong-nhan-ra.svg',
`<svg xmlns="http://www.w3.org/2000/svg" width="${(W*S).toFixed(0)}" height="${(H*S).toFixed(0)}" viewBox="0 0 ${(W*S).toFixed(0)} ${(H*S).toFixed(0)}">
<rect width="100%" height="100%" fill="#F7F9FA"/>
<g stroke="#C6CFD6" stroke-width="0.7" fill="none">${nen}</g>
<g stroke="#B03528" stroke-linecap="butt" opacity="0.75" fill="none">${tuong}</g>
</svg>`);
console.log(`\n🖼  /tmp/tuong-nhan-ra.svg  ·  ${(W/1000).toFixed(1)} × ${(H/1000).toFixed(1)} m`);
