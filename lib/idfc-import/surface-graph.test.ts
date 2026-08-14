/**
 * lib/idfc-import/surface-graph.test.ts — test THUẦN tầng ĐỒ THỊ DIỆN (marker `surfaceGraph`).
 * ① chuanHoaMesh: weld hai không gian (pos+uv vs pos-only), bỏ tam giác suy biến, cạnh manifold
 * ② phanVungTheoDien trên HỘP tổng hợp → đúng 6 diện phẳng
 * ③ phanLoaiDien: trụ + xuyến rời → đúng loại + tham số ±1% (phiếu ⑥)
 * ④ fixture GỘP (hộp + trụ + xuyến rời nhau) → đúng số diện theo loại
 * ⑤ bienDien: hộp có 12 cạnh → mỗi diện 1 vòng 4 điểm sau Douglas-Peucker
 * ⑥ mauDien + suyVatLieu: atlas giả 2 màu → median đúng, họ vật liệu đúng
 * Chạy: node_modules/.bin/sucrase-node lib/idfc-import/surface-graph.test.ts
 */
import {
  bienDien,
  chuanHoaMesh,
  douglasPeucker3D,
  fitTron2D,
  mauDien,
  phanLoaiDien,
  phanVungTheoDien,
  rgbToHsv,
  suyVatLieu,
  svgWireframe,
  objTheoDien,
  xayDoThiDien,
  type RawMesh,
  type V3,
} from './surface-graph';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean, extra?: string) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}${extra ? ` · ${extra}` : ''}`); }
}
const within = (a: number, b: number, pct: number) => Math.abs(a - b) <= Math.abs(b) * pct / 100 + 1e-9;

/* ───────────────────── fixture tổng hợp ───────────────────── */
type Soup = { pos: number[]; uv: number[]; idx: number[] };
const soup = (): Soup => ({ pos: [], uv: [], idx: [] });

function quad(s: Soup, a: V3, b: V3, c: V3, d: V3, uv = 0.25) {
  const base = s.pos.length / 3;
  for (const p of [a, b, c, d]) { s.pos.push(...p); s.uv.push(uv, uv); }
  s.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
}

/** hộp chữ nhật w×h×d tâm tại c — 6 mặt phẳng, pháp tuyến hướng ra */
function hop(s: Soup, c: V3, w: number, h: number, d: number, uv = 0.25) {
  const [x, y, z] = c; const [a, b, e] = [w / 2, h / 2, d / 2];
  const P = (sx: number, sy: number, sz: number): V3 => [x + sx * a, y + sy * b, z + sz * e];
  quad(s, P(-1, -1, 1), P(1, -1, 1), P(1, 1, 1), P(-1, 1, 1), uv); // +Z
  quad(s, P(1, -1, -1), P(-1, -1, -1), P(-1, 1, -1), P(1, 1, -1), uv); // −Z
  quad(s, P(1, -1, 1), P(1, -1, -1), P(1, 1, -1), P(1, 1, 1), uv); // +X
  quad(s, P(-1, -1, -1), P(-1, -1, 1), P(-1, 1, 1), P(-1, 1, -1), uv); // −X
  quad(s, P(-1, 1, 1), P(1, 1, 1), P(1, 1, -1), P(-1, 1, -1), uv); // +Y
  quad(s, P(-1, -1, -1), P(1, -1, -1), P(1, -1, 1), P(-1, -1, 1), uv); // −Y
}

/** ống trụ HỞ hai đầu (chỉ mặt bên) trục Y, tâm c */
function ongTru(s: Soup, c: V3, r: number, h: number, seg = 48, uv = 0.75) {
  const base = s.pos.length / 3;
  for (let i = 0; i < seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    for (const sy of [-1, 1]) { s.pos.push(c[0] + r * Math.cos(a), c[1] + sy * h / 2, c[2] + r * Math.sin(a)); s.uv.push(uv, uv); }
  }
  for (let i = 0; i < seg; i++) {
    const a0 = base + i * 2, a1 = base + i * 2 + 1;
    const b0 = base + ((i + 1) % seg) * 2, b1 = base + ((i + 1) % seg) * 2 + 1;
    s.idx.push(a0, b0, b1, a0, b1, a1);
  }
}

/** xuyến trục Y tâm c, R lớn / r nhỏ */
function xuyen(s: Soup, c: V3, R: number, r: number, segU = 48, segV = 20, uv = 0.9) {
  const base = s.pos.length / 3;
  for (let i = 0; i < segU; i++) for (let j = 0; j < segV; j++) {
    const u = (i / segU) * Math.PI * 2, v = (j / segV) * Math.PI * 2;
    s.pos.push(c[0] + (R + r * Math.cos(v)) * Math.cos(u), c[1] + r * Math.sin(v), c[2] + (R + r * Math.cos(v)) * Math.sin(u));
    s.uv.push(uv, uv);
  }
  const at = (i: number, j: number) => base + (i % segU) * segV + (j % segV);
  for (let i = 0; i < segU; i++) for (let j = 0; j < segV; j++) {
    s.idx.push(at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j), at(i + 1, j + 1), at(i, j + 1));
  }
}

const toRaw = (s: Soup): RawMesh => ({ positions: Float32Array.from(s.pos), uvs: Float32Array.from(s.uv), indices: Uint32Array.from(s.idx) });

/* ───────────────────── ① chuẩn hoá ───────────────────── */
{
  const s = soup();
  hop(s, [0, 0, 0], 100, 100, 100);
  // thêm 1 tam giác suy biến (3 đỉnh trùng vị trí)
  const b = s.pos.length / 3;
  s.pos.push(0, 0, 0, 0, 0, 0, 0, 0, 0); s.uv.push(0, 0, 0, 0, 0, 0);
  s.idx.push(b, b + 1, b + 2);
  const m = chuanHoaMesh(toRaw(s));
  ok('① bỏ đúng 1 tam giác suy biến', m.soLieu.triSuyBien === 1 && m.soLieu.triRa === 12, `suyBien=${m.soLieu.triSuyBien} triRa=${m.soLieu.triRa}`);
  ok('① weld pos-only ra 8 lớp vị trí (hộp)', m.soLieu.lopViTri === 8 + 1, `lop=${m.soLieu.lopViTri}`);
  ok('① weld pos+uv giữ 24 đỉnh xuất (UV chung nên 8+1)', m.soLieu.dinhRa === 9, `dinhRa=${m.soLieu.dinhRa}`);
  ok('① hộp kín: 0 cạnh hở, 12 cạnh + 6 đường chéo = 18', m.soLieu.canhHo === 0 && m.soLieu.canhTong === 18, `ho=${m.soLieu.canhHo} tong=${m.soLieu.canhTong}`);
  ok('① mọi tam giác có đủ 3 hàng xóm', Array.from(m.triAdj).every((x) => x >= 0));
  ok('① diện tích hộp 100³ = 60.000', within(m.soLieu.dienTich, 60000, 0.01), `${m.soLieu.dienTich}`);

  // UV khác nhau ở cùng vị trí ⇒ tách đỉnh xuất, KHÔNG tách lớp vị trí (bài học CN-F1)
  const s2 = soup();
  hop(s2, [0, 0, 0], 100, 100, 100);
  for (let i = 0; i < s2.uv.length; i += 2) s2.uv[i] = (i / 2) / (s2.uv.length / 2); // UV mỗi góc mỗi khác
  const m2 = chuanHoaMesh(toRaw(s2));
  ok('① seam UV: 24 đỉnh xuất nhưng vẫn 8 lớp vị trí', m2.soLieu.dinhRa === 24 && m2.soLieu.lopViTri === 8, `${m2.soLieu.dinhRa}/${m2.soLieu.lopViTri}`);
  ok('① seam UV KHÔNG làm đứt topology', Array.from(m2.triAdj).every((x) => x >= 0));
}

/* ───────────────────── ② phân vùng: hộp → 6 diện ───────────────────── */
{
  const s = soup();
  hop(s, [0, 0, 0], 200, 120, 80);
  const m = chuanHoaMesh(toRaw(s));
  const v = phanVungTheoDien(m, { angleDeg: 15, minAreaFrac: 0 });
  ok('② hộp → đúng 6 diện', v.soDien === 6, `soDien=${v.soDien}`);
}

/* ───────────────────── ③ phân loại + tham số ───────────────────── */
{
  const s = soup();
  ongTru(s, [0, 0, 0], 40, 200, 64);
  const m = chuanHoaMesh(toRaw(s));
  const tris = Array.from({ length: m.triAreas.length }, (_, i) => i);
  const set = new Set<number>();
  for (const t of tris) for (let k = 0; k < 3; k++) set.add(m.indices[t * 3 + k]);
  const pts = new Float64Array(set.size * 3);
  let i = 0; for (const vtx of set) { pts[i * 3] = m.positions[vtx * 3]; pts[i * 3 + 1] = m.positions[vtx * 3 + 1]; pts[i * 3 + 2] = m.positions[vtx * 3 + 2]; i++; }
  const diag = Math.hypot(80, 200, 80);
  const kq = phanLoaiDien(pts, m.triNormals, diag);
  ok('③ ống trụ → cylindrical', kq.loai === 'cylindrical', kq.loai + ' ' + kq.rmsPct.toFixed(3) + '%');
  if (kq.thamSo && 'banKinh' in kq.thamSo) {
    ok('③ bán kính trụ ±1%', within(kq.thamSo.banKinh, 40, 1), `r=${kq.thamSo.banKinh.toFixed(3)}`);
    ok('③ cao trụ ±1%', within(kq.thamSo.cao, 200, 1), `h=${kq.thamSo.cao.toFixed(3)}`);
    ok('③ trục trụ ≈ Y', Math.abs(Math.abs(kq.thamSo.truc[1]) - 1) < 0.01, JSON.stringify(kq.thamSo.truc));
    ok('③ phủ góc trụ ≈ 360°', kq.thamSo.phuGocDeg > 350, `${kq.thamSo.phuGocDeg.toFixed(1)}`);
  } else ok('③ trụ có tham số', false);

  const s2 = soup();
  xuyen(s2, [0, 0, 0], 120, 25, 64, 24);
  const m2 = chuanHoaMesh(toRaw(s2));
  const set2 = new Set<number>();
  for (let t = 0; t < m2.triAreas.length; t++) for (let k = 0; k < 3; k++) set2.add(m2.indices[t * 3 + k]);
  const pts2 = new Float64Array(set2.size * 3);
  let j = 0; for (const vtx of set2) { pts2[j * 3] = m2.positions[vtx * 3]; pts2[j * 3 + 1] = m2.positions[vtx * 3 + 1]; pts2[j * 3 + 2] = m2.positions[vtx * 3 + 2]; j++; }
  const kq2 = phanLoaiDien(pts2, m2.triNormals, Math.hypot(290, 50, 290));
  ok('③ xuyến → toroidal', kq2.loai === 'toroidal', kq2.loai + ' ' + kq2.rmsPct.toFixed(3) + '%');
  if (kq2.thamSo && 'rLon' in kq2.thamSo) {
    ok('③ R lớn ±1%', within(kq2.thamSo.rLon, 120, 1), `R=${kq2.thamSo.rLon.toFixed(3)}`);
    ok('③ r nhỏ ±1%', within(kq2.thamSo.rNho, 25, 1), `r=${kq2.thamSo.rNho.toFixed(3)}`);
    ok('③ phủ góc xuyến ≥240°', kq2.thamSo.phuGocDeg >= 240, `${kq2.thamSo.phuGocDeg.toFixed(1)}`);
  } else ok('③ xuyến có tham số', false);

  ok('③ fitTron2D chính xác', (() => {
    const xs: number[] = [], ys: number[] = [];
    for (let k = 0; k < 20; k++) { const a = (k / 20) * Math.PI * 2; xs.push(5 + 3 * Math.cos(a)); ys.push(-2 + 3 * Math.sin(a)); }
    const c = fitTron2D(xs, ys)!;
    return within(c.cx, 5, 0.1) && within(c.cy, -2, 0.1) && within(c.r, 3, 0.1);
  })());
}

/* ───────────────────── ④ fixture GỘP → đúng số diện theo loại ───────────────────── */
{
  const s = soup();
  hop(s, [0, 0, 0], 200, 120, 80, 0.25);
  ongTru(s, [500, 0, 0], 40, 200, 64, 0.75);
  xuyen(s, [1000, 0, 0], 120, 25, 64, 32, 0.9);
  const g = xayDoThiDien(toRaw(s), { minAreaFrac: 0 });
  ok('④ tổng 8 diện (6 phẳng + 1 trụ + 1 xuyến)', g.tomTat.soDien === 8, JSON.stringify(g.tomTat.theoLoai));
  ok('④ 6 planar', g.tomTat.theoLoai.planar === 6, `${g.tomTat.theoLoai.planar}`);
  ok('④ 1 cylindrical', g.tomTat.theoLoai.cylindrical === 1, `${g.tomTat.theoLoai.cylindrical}`);
  ok('④ 1 toroidal', g.tomTat.theoLoai.toroidal === 1, `${g.tomTat.theoLoai.toroidal}`);
  ok('④ 0 freeform', g.tomTat.theoLoai.freeform === 0, `${g.tomTat.theoLoai.freeform}`);
  ok('④ không phải chia lại lần nào', g.tomTat.soLanChiaLai === 0, `${g.tomTat.soLanChiaLai}`);
  const tru = g.dien.find((d) => d.loai === 'cylindrical')!;
  ok('④ trụ giữ tham số r=40 sau pipeline đủ', tru.thamSo != null && 'banKinh' in tru.thamSo && within(tru.thamSo.banKinh, 40, 1));
  ok('④ lưới trụ có nu×nv > 0', tru.luoi.kieu === 'tru' && tru.luoi.soO > 0, JSON.stringify(tru.luoi));
  const phang = g.dien.filter((d) => d.loai === 'planar');
  ok('④ diện phẳng có lưới kiểu "phang"', phang.every((d) => d.luoi.kieu === 'phang'));
  ok('④ frame cục bộ: bề dày diện phẳng ≈ 0', phang.every((d) => Math.abs(d.frame.co[2]) < 1e-6));
  // Xuyến kín KHÔNG có cạnh đặc trưng nào (mặt kín, một diện duy nhất) ⇒ 0 polyline — đúng bản
  // chất, không phải lỗi. Hộp và ống trụ hở thì phải có biên.
  ok('④ chỉ diện KÍN (xuyến) là không có biên', g.dien.filter((d) => d.bien.length === 0).every((d) => d.loai === 'toroidal')
    && g.dien.filter((d) => d.loai !== 'toroidal').every((d) => d.bien.length >= 1),
    g.dien.map((d) => `${d.loai}:${d.bien.length}`).join(' '));
  ok('④ SVG 3 hình chiếu dựng được', (() => { const svg = svgWireframe(g); return svg.startsWith('<svg') && (svg.match(/<path/g) ?? []).length >= 8; })());
  ok('④ OBJ có đủ group theo diện', (() => { const { obj, mtl } = objTheoDien(g); return (obj.match(/^g dien_/gm) ?? []).length === 8 && (mtl.match(/newmtl/g) ?? []).length === 8; })());
}

/* ───────────────────── ⑤ biên diện (hộp) ───────────────────── */
{
  const s = soup();
  hop(s, [0, 0, 0], 200, 120, 80);
  const m = chuanHoaMesh(toRaw(s));
  const v = phanVungTheoDien(m, { minAreaFrac: 0 });
  const b = bienDien(m, v.nhan, v.soDien, 0.005);
  ok('⑤ hộp có đúng 12 cạnh đặc trưng', b.soCanhDacTrung === 12, `${b.soCanhDacTrung}`);
  ok('⑤ 6 polyline (1 vòng/diện)', b.soPolyline === 6, `${b.soPolyline}`);
  // hộp: mỗi vòng đã là 4 cạnh thẳng ⇒ DP KHÔNG được bỏ điểm nào (5 điểm = 4 góc + đóng vòng).
  // DP bỏ điểm thẳng hàng được kiểm riêng ở case dưới.
  ok('⑤ DP giữ nguyên 4 góc mỗi vòng (30 điểm)', b.soDiemTruoc === 30 && b.soDiemSau === 30, `${b.soDiemTruoc}→${b.soDiemSau}`);
  ok('⑤ mỗi vòng đúng 5 điểm (4 góc + đóng vòng)', b.theoDien.every((polys) => polys.every((p) => p.length === 5)));
  ok('⑤ DP giữ 2 đầu, bỏ điểm thẳng hàng', (() => {
    const line: V3[] = [[0, 0, 0], [1, 0, 0], [2, 0, 0], [3, 0.0001, 0], [4, 0, 0]];
    return douglasPeucker3D(line, 0.01).length === 2;
  })());
}

/* ───────────────────── ⑥ màu → vật liệu ───────────────────── */
{
  // atlas 2×1: nửa trái nâu gỗ (#8a5a32), nửa phải vàng đồng (#c9a227)
  const atlas = { width: 2, height: 1, channels: 3, data: Uint8Array.from([0x8a, 0x5a, 0x32, 0xc9, 0xa2, 0x27]) };
  const s = soup();
  hop(s, [0, 0, 0], 100, 100, 100, 0.25);   // uv 0.25 → cột trái
  ongTru(s, [400, 0, 0], 30, 150, 48, 0.75); // uv 0.75 → cột phải
  const g = xayDoThiDien(toRaw(s), { minAreaFrac: 0, atlas });
  ok('⑥ atlas được dùng', g.tomTat.coAtlas);
  const hopDien = g.dien.filter((d) => d.loai === 'planar');
  ok('⑥ 6 diện hộp ra màu nâu gỗ', hopDien.length === 6 && hopDien.every((d) => d.mauHex === '#8a5a32'), hopDien.map((d) => d.mauHex).join(','));
  ok('⑥ diện hộp suy ra họ "gỗ"', hopDien.every((d) => d.vatLieu?.ho === 'gỗ'), JSON.stringify(hopDien[0]?.vatLieu?.ho));
  const truDien = g.dien.find((d) => d.loai === 'cylindrical')!;
  ok('⑥ trụ ra màu vàng đồng', truDien.mauHex === '#c9a227', String(truDien.mauHex));
  ok('⑥ trụ suy ra họ "kim loại"', truDien.vatLieu?.ho === 'kim loại', String(truDien.vatLieu?.ho));
  ok('⑥ PBR kim loại: metallic=1', truDien.vatLieu?.pbr.metallic === 1, JSON.stringify(truDien.vatLieu?.pbr));
  ok('⑥ PBR gỗ: roughness 0.6 (kho quy tắc IF)', hopDien[0].vatLieu?.pbr.roughness === 0.6, JSON.stringify(hopDien[0].vatLieu?.pbr));
  ok('⑥ vatLieu LUÔN cờ inferred', g.dien.every((d) => !d.vatLieu || d.vatLieu.inferred === true));
  ok('⑥ gộp cấu kiện: 6 diện hộp về 1 cấu kiện, trụ riêng', g.cauKien.length === 2 && g.cauKien[0].dien.length === 6, JSON.stringify(g.cauKien.map((c) => c.dien.length)));
  ok('⑥ matId chưa preset nào khai ⇒ null, không bịa', g.dien.every((d) => !d.vatLieu || d.vatLieu.matId === null));
  ok('⑥ rgbToHsv đúng mốc', (() => { const h = rgbToHsv([255, 0, 0]); return h.h === 0 && h.s === 1 && h.v === 1; })());
  ok('⑥ suyVatLieu: gần trắng → sơn/nhựa', suyVatLieu('#f2f0ec', 'planar').ho === 'sơn/nhựa');
  ok('⑥ suyVatLieu: rất tối → vải/da', suyVatLieu('#1a1714', 'freeform').ho === 'vải/da');
  const mDien = mauDien(g.mesh, [0], atlas);
  ok('⑥ mauDien trả doLech + soMau', !!mDien && mDien.soMau === 4 && mDien.doLech === 0, JSON.stringify(mDien));
}

/* ───────────────────── ⑦ freeform: khai thật, cấm ép ───────────────────── */
{
  // mặt cầu — không phẳng, không trụ, không xuyến ⇒ phải là freeform + có lý do
  const s = soup();
  const R = 100, segU = 32, segV = 16;
  const base = 0;
  for (let i = 0; i <= segU; i++) for (let j = 0; j <= segV; j++) {
    const u = (i / segU) * Math.PI * 2, v = (j / segV) * Math.PI;
    s.pos.push(R * Math.sin(v) * Math.cos(u), R * Math.cos(v), R * Math.sin(v) * Math.sin(u));
    s.uv.push(0.25, 0.25);
  }
  const at = (i: number, j: number) => base + i * (segV + 1) + j;
  for (let i = 0; i < segU; i++) for (let j = 0; j < segV; j++) s.idx.push(at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j), at(i + 1, j + 1), at(i, j + 1));
  const g = xayDoThiDien(toRaw(s), { minAreaFrac: 0, splitMaxDepth: 0 });
  ok('⑦ mặt cầu KHÔNG bị ép thành trụ/xuyến', g.dien.every((d) => d.loai === 'freeform' || d.loai === 'planar'), JSON.stringify(g.tomTat.theoLoai));
  const ff = g.dien.find((d) => d.loai === 'freeform');
  ok('⑦ freeform có LÝ DO ghi rõ + số', !!ff?.lyDo && /%/.test(ff!.lyDo!), ff?.lyDo);
  ok('⑦ freeform vẫn có frame + bbox để định vị', !!ff && ff.frame.co.every((x) => x > 0));
  ok('⑦ freeform lưới kiểu "khong" (giữ tam giác)', ff?.luoi.kieu === 'khong');
}

console.log(`\n${pass} pass · ${fail} fail`);
if (fail) process.exit(1);
