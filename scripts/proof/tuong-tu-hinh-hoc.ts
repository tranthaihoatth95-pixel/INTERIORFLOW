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
/* GHÉP CẶP ĐỘC QUYỀN — một nét chỉ là mặt của MỘT bức tường.
 * Bản trước ghép MỌI cặp thoả điều kiện ⇒ tường vẽ 3–4 nét (hai mặt kết cấu + nét
 * trát/ốp) đẻ ra 6 trục chồng nhau. Hoà nhìn ảnh phóng to bắt được: "bị sai" —
 * cái tưởng là một tường liền thật ra là nhiều vật xếp đè.
 * Sửa bằng GHÉP ĐÔI ĐỘC QUYỀN: xếp mọi cặp ứng viên theo độ tin cậy (chồng lấn dài
 * nhất trước, rồi bề dày mỏng hơn = cặp nét sát nhau nhất), duyệt lần lượt, chỉ
 * nhận khi CẢ HAI nét còn tự do. Mỗi nét vào đúng một tường, hết chồng.  */
type UngVien = { i:number; j:number; t:Truc; ov:number };
const uv: UngVien[] = [];
for (let i = 0; i < THANG.length; i++) for (let j = i+1; j < THANG.length; j++) {
  const p = THANG[i], q = THANG[j];
  if (p.layer !== q.layer) continue;
  let dg = Math.abs(goc(p) - goc(q)); if (dg > Math.PI/2) dg = Math.PI - dg;
  if (dg > 0.02) continue;
  const ux = Math.cos(goc(p)), uy = Math.sin(goc(p));
  const d = Math.abs((q.a.x-p.a.x)*-uy + (q.a.y-p.a.y)*ux);
  if (d < 90 || d > 400) continue;
  const t = (pt:any) => (pt.x-p.a.x)*ux + (pt.y-p.a.y)*uy;
  const [p0,p1]=[t(p.a),t(p.b)].sort((a,b)=>a-b), [q0,q1]=[t(q.a),t(q.b)].sort((a,b)=>a-b);
  const lo = Math.max(p0,q0), hi = Math.min(p1,q1);
  if (hi - lo < 500) continue;
  const mx = (p.a.x + q.a.x)/2, my = (p.a.y + q.a.y)/2;
  const khop = (hi-lo) / Math.max(p1-p0, q1-q0);   // OFFSET tạo bản sao DÀI BẰNG NHAU
  uv.push({ i, j, ov: khop,
    t: { ax: mx+ux*lo, ay: my+uy*lo, bx: mx+ux*hi, by: my+uy*hi, d: Math.round(d), layer: p.layer } });
}
uv.sort((a,b) => b.ov - a.ov || a.t.d - b.t.d);   // khớp-nhau nhất trước, rồi mỏng hơn
const daDung = new Set<number>();
const giu: Truc[] = [];
for (const c of uv) {
  if (daDung.has(c.i) || daDung.has(c.j)) continue;
  daDung.add(c.i); daDung.add(c.j); giu.push(c.t);
}
console.log(`ghép đôi độc quyền: ${uv.length} cặp ứng viên → ${giu.length} tường (dùng ${daDung.size}/${THANG.length} nét)`);
const tongDai = giu.reduce((s,t)=>s+Math.hypot(t.bx-t.ax, t.by-t.ay), 0);
console.log(`\n⇒ TƯỜNG gộp được: ${giu.length}  ·  tổng chiều dài ${(tongDai/1000).toFixed(1)} m`);
const dd = new Map<number,number>(); for (const t of giu) dd.set(t.d,(dd.get(t.d)??0)+1);
console.log('   bề dày:', [...dd.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6).map(([k,v])=>`${k}mm×${v}`).join(' · '));

/* ── ĐẢO TRIM — nối lại những gì lệnh TRIM đã cắt rời ─────────────────────────
 * Người vẽ chạy TRIM ở mỗi chỗ giao ⇒ MỘT bức tường dài bị chẻ thành nhiều đoạn.
 * Đảo lại: gom các trục CÙNG ĐƯỜNG THẲNG (cùng layer · cùng bề dày · cùng phương ·
 * cùng khoảng lệch vuông góc) rồi hợp các khoảng chồng/kề trên trục đó.
 * NGHIỆM THU TỰ CHẤM: số tường GIẢM MẠNH · tổng chiều dài GẦN NHƯ KHÔNG ĐỔI.
 *   giảm cả hai  ⇒ đang ăn mất tường
 *   không giảm   ⇒ chưa nối được gì
 *   dài tăng vọt ⇒ đang nối bừa qua ô cửa (khe hở quá rộng)
 */
function daoTrim(ds: Truc[], kheHo: number) {
  type Nhom = { ux:number; uy:number; c:number; d:number; layer:string; kh:[number,number][] };
  const nhoms: Nhom[] = [];
  for (const t of ds) {
    const L = Math.hypot(t.bx-t.ax, t.by-t.ay); if (L < 1) continue;
    let ux = (t.bx-t.ax)/L, uy = (t.by-t.ay)/L;
    if (ux < 0 || (Math.abs(ux) < 1e-9 && uy < 0)) { ux = -ux; uy = -uy; }   // hướng chuẩn hoá
    const c = t.ax*-uy + t.ay*ux;                                            // lệch vuông góc
    const s0 = t.ax*ux + t.ay*uy, s1 = t.bx*ux + t.by*uy;
    const lo = Math.min(s0,s1), hi = Math.max(s0,s1);
    const n = nhoms.find(g => g.layer===t.layer && Math.abs(g.d-t.d)<=20
      && Math.abs(g.ux*ux + g.uy*uy) > 0.9998                                // lệch phương < ~1°
      && Math.abs(g.c - c) < 60);                                            // cùng một đường
    if (n) n.kh.push([lo,hi]); else nhoms.push({ux,uy,c,d:t.d,layer:t.layer,kh:[[lo,hi]]});
  }
  const ra: Truc[] = [];
  for (const n of nhoms) {
    n.kh.sort((a,b)=>a[0]-b[0]);
    let [lo,hi] = n.kh[0];
    const xuat = () => {
      const px = -n.uy*n.c, py = n.ux*n.c;                                   // điểm gốc trên đường
      ra.push({ ax: px+n.ux*lo, ay: py+n.uy*lo, bx: px+n.ux*hi, by: py+n.uy*hi, d:n.d, layer:n.layer });
    };
    for (let i=1;i<n.kh.length;i++) {
      const [a,b] = n.kh[i];
      if (a - hi <= kheHo) hi = Math.max(hi,b); else { xuat(); [lo,hi]=[a,b]; }
    }
    xuat();
  }
  return ra;
}
const doDai = (ds: Truc[]) => ds.reduce((s,t)=>s+Math.hypot(t.bx-t.ax,t.by-t.ay),0)/1000;
console.log(`\nĐẢO TRIM — trước: ${giu.length} đoạn · ${doDai(giu).toFixed(1)} m`);
for (const kh of [0, 100, 300, 900]) {
  const r = daoTrim(giu, kh);
  console.log(`   khe hở ≤${String(kh).padStart(4)}mm  →  ${String(r.length).padStart(4)} tường · ${doDai(r).toFixed(1)} m`);
}
const noi = daoTrim(giu, 100);
console.log(`\n⇒ CHỐT (khe ≤100mm): ${giu.length} → ${noi.length} tường  ·  ${doDai(giu).toFixed(1)} → ${doDai(noi).toFixed(1)} m`);
{
  const d = noi.map(t=>Math.hypot(t.bx-t.ax,t.by-t.ay)).sort((a,b)=>a-b);
  console.log(`   dài trung bình ${(doDai(noi)*1000/noi.length/1000).toFixed(2)} m · dài nhất ${(d.at(-1)!/1000).toFixed(1)} m · trung vị ${(d[d.length>>1]/1000).toFixed(2)} m`);
}

/* ── ĐẢO ARRAY — bậc thang KHÔNG phải tường ──────────────────────────────────
 * Chữ ký hình học, KHÔNG đọc tên layer: ≥4 trục song song, cùng phương, xếp
 * cách đều nhau bước 200–400mm. Đó là dấu tay của lệnh ARRAY/OFFSET lặp —
 * người vẽ dựng BẬC THANG (hoặc gạch lát), không dựng bốn bức tường sát nhau.
 */
function boArray(ds: Truc[]) {
  const nhom: Truc[][] = [];
  for (const t of ds) {
    const L=Math.hypot(t.bx-t.ax,t.by-t.ay); if(L<1) continue;
    let ux=(t.bx-t.ax)/L, uy=(t.by-t.ay)/L; if(ux<0||(Math.abs(ux)<1e-9&&uy<0)){ux=-ux;uy=-uy;}
    const g = nhom.find(g=>{const a=g[0];const la=Math.hypot(a.bx-a.ax,a.by-a.ay);
      const vx=(a.bx-a.ax)/la, vy=(a.by-a.ay)/la;
      if(Math.abs(vx*ux+vy*uy)<0.999) return false;
      const s=(p:Truc)=>(p.ax-a.ax)*vx+(p.ay-a.ay)*vy;      // vị trí dọc trục
      return Math.abs(s(t)-0)<L+la && Math.abs((t.ax-a.ax)*-vy+(t.ay-a.ay)*vx)<3000; });
    if(g) g.push(t); else nhom.push([t]);
  }
  const bo = new Set<Truc>();
  for (const g of nhom) {
    if (g.length < 4) continue;
    const a=g[0], la=Math.hypot(a.bx-a.ax,a.by-a.ay);
    const vx=(a.bx-a.ax)/la, vy=(a.by-a.ay)/la;
    const c = g.map(p=>(p.ax-a.ax)*-vy+(p.ay-a.ay)*vx).sort((x,y)=>x-y);
    const b: number[] = []; for(let i=1;i<c.length;i++) b.push(c[i]-c[i-1]);
    const deu = b.filter(x=>x>150&&x<420);
    if (deu.length >= 3) {                                   // ≥4 bậc ⇒ ≥3 bước đều
      const tb = deu.reduce((s,x)=>s+x,0)/deu.length;
      if (deu.every(x=>Math.abs(x-tb)<60)) g.forEach(p=>bo.add(p));
    }
  }
  return { giuLai: ds.filter(t=>!bo.has(t)), bo: [...bo] };
}
const { giuLai, bo } = boArray(noi);
const m=(ds:Truc[])=>ds.reduce((s,t)=>s+Math.hypot(t.bx-t.ax,t.by-t.ay),0)/1000;
console.log(`\nĐẢO ARRAY — loại ${bo.length} đối tượng bước đều (${m(bo).toFixed(0)} m) ⇒ KHÔNG phải tường`);
console.log(`⇒ TƯỜNG THẬT: ${giuLai.length} · ${m(giuLai).toFixed(0)} m`);
const ten=(id:string)=>layers.get(id)??id;
const demLayer=(ds:Truc[])=>{const t=new Map<string,number>();for(const x of ds)t.set(ten(x.layer),(t.get(ten(x.layer))??0)+1);
  return [...t].sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k}×${v}`).join(' · ');};
console.log(`   giữ lại: ${demLayer(giuLai)}`);
console.log(`   loại ra: ${demLayer(bo)}`);

/* ── GỘP CHÙM NÉT → LẤY BAO NGOÀI ────────────────────────────────────────────
 * Hoà nhìn ảnh phóng to 29/08: vẫn 3–4 vệt song song trên CÙNG một bức tường.
 * Vì sao: thợ vẽ tường bằng nhiều nét (hai mặt kết cấu + nét trát/ốp mỗi bên), ghép đôi độc
 * quyền cho ra mấy cặp rời — mỗi cặp một trục, chồng lên nhau.
 * Đảo OFFSET cho ĐÚNG phải lấy CẶP NGOÀI CÙNG: bề dày tường = khoảng cách hai nét ngoài cùng
 * của chùm, nét giữa là lớp hoàn thiện chứ không phải mặt tường.
 *
 * ⛔ BẢN TRƯỚC ĐÃ TRƯỢT — "giữ trục dày nhất trong vùng" làm mất 74% chiều dài, vì một trục
 * 400mm dài nuốt trọn các tường 200mm nằm cùng đường. Lần này KHÔNG chọn-một-bỏ-phần-còn-lại
 * mà GỘP: chỉ gom những trục THỰC SỰ chồng nhau, và tường mới phải TRÙM đúng phần chúng phủ.
 */
function gopChum(ds: Truc[]) {
  const L = (t: Truc) => Math.hypot(t.bx - t.ax, t.by - t.ay);
  const chua = ds.map((t) => ({ t, id: -1 }));
  const trucCua = (t: Truc) => {
    const l = L(t); let ux = (t.bx-t.ax)/l, uy = (t.by-t.ay)/l;
    if (ux < 0 || (Math.abs(ux) < 1e-9 && uy < 0)) { ux = -ux; uy = -uy; }
    return { ux, uy, c: t.ax*-uy + t.ay*ux, s0: Math.min(t.ax*ux+t.ay*uy, t.bx*ux+t.by*uy),
             s1: Math.max(t.ax*ux+t.ay*uy, t.bx*ux+t.by*uy) };
  };
  const g = chua.map((x) => trucCua(x.t));
  // hai trục cùng MỘT bức tường khi: cùng phương · chồng nhau dọc trục · lệch vuông góc nhỏ hơn
  // nửa tổng bề dày (tức nét kia nằm TRONG thân bức tường đang xét, không phải tường bên cạnh)
  const cungTuong = (i: number, j: number) => {
    const a = g[i], b = g[j];
    if (Math.abs(a.ux*b.ux + a.uy*b.uy) < 0.999) return false;
    if (Math.abs(a.c - b.c) > (chua[i].t.d + chua[j].t.d) / 2) return false;
    if (chua[i].t.layer !== chua[j].t.layer) return false;
    return Math.min(a.s1, b.s1) - Math.max(a.s0, b.s0) > 0.5 * Math.min(a.s1-a.s0, b.s1-b.s0);
  };
  let soChum = 0;
  for (let i = 0; i < chua.length; i++) {
    if (chua[i].id >= 0) continue;
    chua[i].id = soChum;
    for (let j = i + 1; j < chua.length; j++)
      if (chua[j].id < 0 && cungTuong(i, j)) chua[j].id = soChum;
    soChum++;
  }
  const ra: Truc[] = [];
  for (let k = 0; k < soChum; k++) {
    const nhom = chua.filter((x) => x.id === k);
    if (!nhom.length) continue;
    if (nhom.length === 1) { ra.push(nhom[0].t); continue; }
    const cai = g[chua.indexOf(nhom[0])];
    const cs = nhom.map((x) => g[chua.indexOf(x)]);
    const lo = Math.min(...cs.map((x) => x.s0)), hi = Math.max(...cs.map((x) => x.s1));
    // BAO NGOÀI: mép ngoài cùng hai bên = tâm trục ± nửa bề dày, lấy min/max qua cả chùm
    const mepTren = Math.max(...nhom.map((x, n) => cs[n].c + x.t.d / 2));
    const mepDuoi = Math.min(...nhom.map((x, n) => cs[n].c - x.t.d / 2));
    const cGiua = (mepTren + mepDuoi) / 2, beDay = Math.round(mepTren - mepDuoi);
    const px = -cai.uy * cGiua, py = cai.ux * cGiua;
    ra.push({ ax: px + cai.ux*lo, ay: py + cai.uy*lo, bx: px + cai.ux*hi, by: py + cai.uy*hi,
              d: beDay, layer: nhom[0].t.layer });
  }
  return ra;
}
const tuong = gopChum(giuLai);
console.log(`\nGỘP CHÙM NÉT → BAO NGOÀI: ${giuLai.length} → ${tuong.length} tường · ${m(giuLai).toFixed(0)} → ${m(tuong).toFixed(0)} m`);
{
  const dt = tuong.map((t) => Math.hypot(t.bx-t.ax, t.by-t.ay)).sort((a,b)=>a-b);
  const bd = new Map<number, number>(); for (const t of tuong) bd.set(t.d, (bd.get(t.d) ?? 0) + 1);
  console.log(`   dài trung bình ${(m(tuong)/tuong.length).toFixed(1)} m · trung vị ${(dt[dt.length>>1]/1000).toFixed(1)} m · dài nhất ${(dt.at(-1)!/1000).toFixed(1)} m`);
  console.log(`   bề dày: ${[...bd].sort((a,b)=>b[1]-a[1]).slice(0,7).map(([k,v])=>`${k}mm×${v}`).join(' · ')}`);
  console.log(`   layer:  ${demLayer(tuong)}`);
}

/* ── VẼ RA: bản vẽ gốc (nhạt) + tường IF nhận ra (đậm) ── */
import { writeFileSync } from 'node:fs';
let minx=1e18,miny=1e18,maxx=-1e18,maxy=-1e18;
for (const s of THANG) for (const p of [s.a,s.b]) { minx=Math.min(minx,p.x); miny=Math.min(miny,p.y); maxx=Math.max(maxx,p.x); maxy=Math.max(maxy,p.y); }
const W=maxx-minx, H=maxy-miny, S=1600/Math.max(W,H);
const X=(x:number)=>((x-minx)*S).toFixed(1), Y=(y:number)=>((maxy-y)*S).toFixed(1);
const nen = THANG.map(s=>`<line x1="${X(s.a.x)}" y1="${Y(s.a.y)}" x2="${X(s.b.x)}" y2="${Y(s.b.y)}"/>`).join('');
const veTuong = tuong.map(t=>`<line x1="${X(t.ax)}" y1="${Y(t.ay)}" x2="${X(t.bx)}" y2="${Y(t.by)}" stroke-width="${Math.max(1.2,t.d*S)}"/>`).join('');
writeFileSync('/tmp/tuong-nhan-ra.svg',
`<svg xmlns="http://www.w3.org/2000/svg" width="${(W*S).toFixed(0)}" height="${(H*S).toFixed(0)}" viewBox="0 0 ${(W*S).toFixed(0)} ${(H*S).toFixed(0)}">
<rect width="100%" height="100%" fill="#F7F9FA"/>
<g stroke="#C6CFD6" stroke-width="0.7" fill="none">${nen}</g>
<g stroke="#B03528" stroke-linecap="butt" opacity="0.75" fill="none">${veTuong}</g>
</svg>`);
console.log(`\n🖼  /tmp/tuong-nhan-ra.svg  ·  ${(W/1000).toFixed(1)} × ${(H/1000).toFixed(1)} m`);
