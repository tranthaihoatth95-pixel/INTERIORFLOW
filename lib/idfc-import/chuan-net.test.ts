/**
 * lib/idfc-import/chuan-net.test.ts — test THUẦN bước chuẩn nét (marker `chuanNet`, 0 mạng 0 AI):
 * ① fit trụ/xuyến trên điểm tham số tự sinh → đúng tham số ±1% (phiếu ⑤)
 * ② parseGlbGeometry đọc đúng GLB nhị phân tự dựng tay (có chunk BIN)
 * ③ dựng lại qua build-ops → bbox khớp tham số
 * ④ pipeline đủ trên mesh tổng hợp (4 chân + vòng + khối nệm + bóng sàn) → tách/xoá/fit đúng loại
 * ⑧⑨ mirror-completion (14/08): đối xứng SINH kích thước — cặp/cụm part cùng vai trò hội tụ về
 *     bên RMS thấp hơn, tâm giữ nguyên, part lẻ (không đối tác) không bị đụng
 * Chạy: node_modules/.bin/sucrase-node lib/idfc-import/chuan-net.test.ts
 */
import {
  chuanNet,
  chuanNetGeometry,
  circumCircle3,
  fitCylinderPts,
  fitTorusPts,
  mirrorCompleteShapes,
  parseGlbGeometry,
  rebuildCylinderMm,
  rebuildTorusMm,
  type GlbGeometry,
  type MirrorableShape,
} from './chuan-net';

/** bộ ba toạ độ — khớp kiểu V3 nội bộ của chuan-net (module không xuất kiểu đó ra ngoài) */
type V3T = [number, number, number];

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}
const within = (a: number, b: number, pct: number) => Math.abs(a - b) <= Math.abs(b) * pct / 100 + 1e-12;

/* ── dựng mesh tham số làm fixture (triangle soup indexed) ── */
type Soup = { positions: number[]; indices: number[] };
function addQuadGrid(soup: Soup, f: (u: number, v: number) => [number, number, number], nu: number, nv: number, wrapU: boolean) {
  const base = soup.positions.length / 3;
  for (let i = 0; i <= (wrapU ? nu - 1 : nu); i++) for (let j = 0; j <= nv; j++) {
    const p = f(i / nu, j / nv);
    soup.positions.push(p[0], p[1], p[2]);
  }
  const cols = (wrapU ? nu : nu + 1);
  const at = (i: number, j: number) => base + (i % cols) * (nv + 1) + j;
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    soup.indices.push(at(i, j), at(i + 1, j), at(i + 1, j + 1));
    soup.indices.push(at(i, j), at(i + 1, j + 1), at(i, j + 1));
  }
}
function cylinderAt(soup: Soup, cx: number, cz: number, r: number, y0: number, y1: number, nu = 24, nv = 12) {
  addQuadGrid(soup, (u, v) => [cx + r * Math.cos(u * 2 * Math.PI), y0 + (y1 - y0) * v, cz + r * Math.sin(u * 2 * Math.PI)], nu, nv, true);
}
function torusAt(soup: Soup, cy: number, R: number, r: number, nu = 40, nv = 12) {
  addQuadGrid(soup, (u, v) => {
    const a = u * 2 * Math.PI; const b = v * 2 * Math.PI;
    const rho = R + r * Math.cos(b);
    return [rho * Math.cos(a), cy + r * Math.sin(b), rho * Math.sin(a)];
  }, nu, nv, true);
}
/** Xuyến trục X (mặt phẳng vòng ĐỨNG) — khuôn của vòng tay vịn. `gapDeg` cắt bớt cung để dựng ca
 * "vòng hở", thứ mà luật phủ ≥300° phải từ chối. */
function ringXInto(soup: Soup, cx: number, cy: number, R: number, r: number, gapDeg: number) {
  const span = (360 - gapDeg) / 360;
  addQuadGrid(soup, (u, v) => {
    const a = u * span * 2 * Math.PI; const b = v * 2 * Math.PI;
    const rho = R + r * Math.cos(b);
    return [cx + r * Math.sin(b), cy + rho * Math.cos(a), rho * Math.sin(a)];
  }, 56, 12, gapDeg === 0);
}
function boxAt(soup: Soup, cx: number, cy: number, cz: number, w: number, h: number, d: number) {
  const base = soup.positions.length / 3;
  const s = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
  for (const [x, y, z] of s) soup.positions.push(cx + x * w / 2, cy + y * h / 2, cz + z * d / 2);
  const quads = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [2, 3, 7, 6], [0, 3, 7, 4], [1, 2, 6, 5]];
  for (const [a, b, c, d2] of quads) { soup.indices.push(base + a, base + b, base + c, base + a, base + c, base + d2); }
}

/* ── ① fit trụ / xuyến ±1% ── */
console.log('fitCylinderPts — trụ tham số (kể cả trục nghiêng)');
{
  const soup: Soup = { positions: [], indices: [] };
  cylinderAt(soup, 0, 0, 0.02, -0.3, 0.3, 32, 20);
  const fit = fitCylinderPts(new Float64Array(soup.positions));
  ok('bán kính ±1% (0.02)', within(fit.radius, 0.02, 1));
  ok('cao ±1% (0.6)', within(fit.height, 0.6, 1));
  ok('trục ≈ Y', Math.abs(fit.axis[1]) > 0.999);
  ok('RMS ≈ 0', fit.rms < 1e-6);

  // trục nghiêng 30° quanh Z
  const c = Math.cos(Math.PI / 6); const s = Math.sin(Math.PI / 6);
  const tilted = new Float64Array(soup.positions.length);
  for (let i = 0; i < soup.positions.length; i += 3) {
    const x = soup.positions[i]; const y = soup.positions[i + 1];
    tilted[i] = c * x - s * y; tilted[i + 1] = s * x + c * y; tilted[i + 2] = soup.positions[i + 2];
  }
  const f2 = fitCylinderPts(tilted);
  ok('nghiêng 30°: bán kính ±1%', within(f2.radius, 0.02, 1));
  ok('nghiêng 30°: trục đúng (dot ≈ 1)', Math.abs(f2.axis[0] * -s + f2.axis[1] * c) > 0.999);
}

console.log('fitTorusPts — xuyến tham số');
{
  const soup: Soup = { positions: [], indices: [] };
  torusAt(soup, 0.1, 0.15, 0.012, 64, 24);
  const fit = fitTorusPts(new Float64Array(soup.positions));
  ok('R lớn ±1% (0.15)', within(fit.rMajor, 0.15, 1));
  ok('r nhỏ ±1% (0.012)', within(fit.rMinor, 0.012, 1));
  ok('trục ≈ Y', Math.abs(fit.axis[1]) > 0.999);
  ok('tâm y ≈ 0.1', within(fit.center[1], 0.1, 1));
  ok('RMS nhỏ (<5% r nhỏ)', fit.rms < 0.012 * 0.05);
}

/* ── ② parseGlbGeometry — GLB tự dựng có BIN ── */
console.log('parseGlbGeometry — GLB nhị phân tự dựng');
{
  const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1]);
  const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
  const bin = new Uint8Array(positions.byteLength + indices.byteLength + 2); // +2 pad 4B
  bin.set(new Uint8Array(positions.buffer), 0);
  bin.set(new Uint8Array(indices.buffer), positions.byteLength);
  const json = {
    asset: { version: '2.0' },
    accessors: [
      { componentType: 5126, type: 'VEC3', bufferView: 0, count: 4 },
      { componentType: 5123, type: 'SCALAR', bufferView: 1, count: 6 },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: positions.byteLength },
      { buffer: 0, byteOffset: positions.byteLength, byteLength: indices.byteLength },
    ],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1, mode: 4 }] }],
    buffers: [{ byteLength: bin.byteLength }],
  };
  let jsonBytes = new TextEncoder().encode(JSON.stringify(json));
  while (jsonBytes.byteLength % 4) jsonBytes = new Uint8Array([...jsonBytes, 0x20]);
  const total = 12 + 8 + jsonBytes.byteLength + 8 + bin.byteLength;
  const glb = new Uint8Array(total);
  const dv = new DataView(glb.buffer);
  dv.setUint32(0, 0x46546c67, true); dv.setUint32(4, 2, true); dv.setUint32(8, total, true);
  dv.setUint32(12, jsonBytes.byteLength, true); dv.setUint32(16, 0x4e4f534a, true);
  glb.set(jsonBytes, 20);
  const binOff = 20 + jsonBytes.byteLength;
  dv.setUint32(binOff, bin.byteLength, true); dv.setUint32(binOff + 4, 0x004e4942, true);
  glb.set(bin, binOff + 8);

  const g = parseGlbGeometry(glb);
  ok('parse được', g !== null);
  ok('4 đỉnh', g?.positions.length === 12);
  ok('2 tam giác', g?.indices.length === 6);
  ok('đỉnh[1] đúng (1,0,0)', g?.positions[3] === 1 && g?.positions[4] === 0);
  ok('chỉ số cuối = 3', g?.indices[5] === 3);
  ok('không phải GLB → null', parseGlbGeometry(new TextEncoder().encode('x'.repeat(64))) === null);
  ok('chuanNet mặt tiền cũng chạy (mesh bé → 1 mảnh mesh)', chuanNet(glb, { hMm: 1000 }) !== null);
}

/* ── ③ dựng lại qua build-ops → bbox khớp ── */
console.log('rebuild qua build-ops (CHỈ GỌI revolveProfile)');
{
  const cyl = rebuildCylinderMm({ axis: [0, 1, 0], center: [100, 200, 300], radius: 20, height: 400 }, 32);
  let mn = [Infinity, Infinity, Infinity]; let mx = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < cyl.length; i += 3) for (let d = 0; d < 3; d++) {
    mn[d] = Math.min(mn[d], cyl[i + d]); mx[d] = Math.max(mx[d], cyl[i + d]);
  }
  ok('trụ: cao 400 dọc Y quanh 200', within(mx[1] - mn[1], 400, 2) && within((mx[1] + mn[1]) / 2, 200, 2));
  ok('trụ: đường kính ≈ 40 (đa giác 32 cạnh hơi hụt)', mx[0] - mn[0] > 38 && mx[0] - mn[0] <= 40.1);
  ok('trụ: tâm XZ = (100,300)', within((mx[0] + mn[0]) / 2, 100, 2) && within((mx[2] + mn[2]) / 2, 300, 2));

  const tor = rebuildTorusMm({ axis: [0, 1, 0], center: [0, 50, 0], rMajor: 150, rMinor: 12 }, 48, 16);
  mn = [Infinity, Infinity, Infinity]; mx = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < tor.length; i += 3) for (let d = 0; d < 3; d++) {
    mn[d] = Math.min(mn[d], tor[i + d]); mx[d] = Math.max(mx[d], tor[i + d]);
  }
  ok('xuyến: rộng ≈ 2(R+r)=324', within(mx[0] - mn[0], 324, 3));
  ok('xuyến: dày ≈ 2r=24 quanh y=50', within(mx[1] - mn[1], 24, 5) && within((mx[1] + mn[1]) / 2, 50, 5));
}

/* ── ④ pipeline đủ trên mesh tổng hợp — ghế giả lập ── */
console.log('chuanNetGeometry — mesh tổng hợp: 4 chân + vòng + nệm + bóng sàn');
{
  const soup: Soup = { positions: [], indices: [] };
  // 4 chân trụ r=0.02, y -0.5..0.15 tại (±0.2, ±0.2)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cylinderAt(soup, 0.2 * sx, 0.2 * sz, 0.02, -0.5, 0.15, 20, 24);
  // vòng gác chân R=0.28 r=0.015 tại y=-0.15
  torusAt(soup, -0.15, 0.28, 0.015, 48, 12);
  // khối nệm (mesh hữu cơ giả lập bằng box) y 0.15..0.3
  boxAt(soup, 0, 0.225, 0, 0.45, 0.15, 0.45);
  // bóng sàn: đĩa phẳng mỏng sát đáy (box dẹt cao 0.004, rộng 0.5)
  boxAt(soup, 0, -0.498, 0, 0.55, 0.004, 0.55);

  const geom: GlbGeometry = {
    positions: new Float32Array(soup.positions),
    uvs: null,
    indices: new Uint32Array(soup.indices),
  };
  const polyTruoc = soup.indices.length / 3;
  const res = chuanNetGeometry(geom, { hMm: 800 });
  const cyls = res.parts.filter((p) => p.loai === 'cylinder');
  const tors = res.parts.filter((p) => p.loai === 'torus');
  const shadows = res.parts.filter((p) => p.loai === 'shadow-removed');
  const meshes = res.parts.filter((p) => p.loai === 'mesh');
  ok('4 chân → 4 mảnh cylinder', cyls.length === 4);
  ok('1 vòng → 1 mảnh torus', tors.length === 1);
  ok('bóng sàn bị XOÁ (≥1 mảnh shadow-removed)', shadows.length >= 1);
  ok('nệm giữ mesh (≥1 mảnh mesh)', meshes.length >= 1);
  ok('polyTruoc đúng', res.polyTruoc === polyTruoc);
  ok('polySau > 0 và không tính bóng', res.polySau > 0);
  if (cyls.length === 4 && cyls[0].loai === 'cylinder') {
    // scale: yExt = 0.804 (đáy bóng -0.5 .. nệm 0.3) → mmPerUnit = 800/0.8004
    const mm = res.scaleMmPerUnit;
    ok('bán kính chân ≈ 0.02×scale ±2%', within(cyls[0].thamSo.radiusMm, 0.02 * mm, 2));
    ok('sai số fit chân < 2%', cyls[0].saiSoPct < 2);
  }
  if (tors.length === 1 && tors[0].loai === 'torus') {
    const mm = res.scaleMmPerUnit;
    ok('R vòng ≈ 0.28×scale ±3%', within(tors[0].thamSo.rMajorMm, 0.28 * mm, 3));
    ok('r vòng ≈ 0.015×scale ±10%', within(tors[0].thamSo.rMinorMm, 0.015 * mm, 10));
    ok('sai số fit vòng < 2%', tors[0].saiSoPct < 2);
  }
  ok('OBJ có group + usemtl + mtllib', res.obj.includes('mtllib') && res.obj.includes('usemtl') && /(^|\n)o /.test(res.obj));
  ok('MTL có 2 material', res.mtl.includes('mat_primitive') && res.mtl.includes('mat_mesh'));
  const recipe = JSON.parse(res.recipeJson) as { marker: string; parts: Array<{ loai: string; buildOp?: { op: string } }> };
  ok('recipe marker chuanNet', recipe.marker === 'chuanNet');
  ok('recipe: mảnh primitive mang buildOp revolve', recipe.parts.filter((p) => p.buildOp?.op === 'revolve').length === cyls.length + tors.length);
}

/* ── ⑤ CN-F1 — dedupe KHÔNG lệch chỉ số vt, và trục V lật đúng quy ước OBJ ──
 * Hai khẳng định trong MỘT fixture, vì chúng dễ che nhau: nếu chỉ kiểm "có vt" thì cả hai lỗi
 * đều lọt. Fixture cố ý có SEAM UV (hai tam giác dùng chung vị trí nhưng KHÁC UV) — đúng ca mà
 * dedupe theo-vị-trí-suông sẽ gộp nhầm rồi kéo lệch mọi chỉ số phía sau. */
console.log('CN-F1 — dedupe giữ nguyên UV từng mặt + trục V lật sang quy ước OBJ');
{
  // 2 tam giác, đỉnh 1 và 2 TRÙNG VỊ TRÍ đỉnh 4 và 5 nhưng UV khác ⇒ không được gộp
  const positions = new Float32Array([
    0, 0, 0, /**/ 1, 0, 0, /**/ 1, 1, 0,
    0, 0, 0, /**/ 1, 1, 0, /**/ 0, 1, 0,
  ]);
  const uvs = new Float32Array([
    0.10, 0.20, /**/ 0.30, 0.40, /**/ 0.50, 0.60,
    0.70, 0.80, /**/ 0.15, 0.25, /**/ 0.35, 0.45,
  ]);
  const geom: GlbGeometry = { positions, uvs, indices: new Uint32Array([0, 1, 2, 3, 4, 5]) };
  const res = chuanNetGeometry(geom, { hMm: 1000 });

  // đọc lại OBJ như một trình xem sẽ đọc
  const vt: [number, number][] = [];
  const faces: number[][] = [];
  for (const line of res.obj.split('\n')) {
    if (line.startsWith('vt ')) { const p = line.slice(3).trim().split(/\s+/).map(Number); vt.push([p[0], p[1]]); }
    else if (line.startsWith('f ')) faces.push(line.slice(2).trim().split(/\s+/).map((t) => Number(t.split('/')[1])));
  }
  ok('2 mặt ghi ra OBJ', faces.length === 2);
  ok('SEAM giữ nguyên: 6 vt riêng, không gộp nhầm', vt.length === 6);

  let lechUv = 0; let lechFlip = 0;
  for (let t = 0; t < 2; t++) for (let k = 0; k < 3; k++) {
    const src = geom.indices[3 * t + k];
    const got = vt[faces[t][k] - 1];
    if (!got) { lechUv += 1; continue; }
    if (Math.abs(got[0] - uvs[2 * src]) > 1e-4) lechUv += 1;            // U phải y nguyên
    if (Math.abs(got[1] - (1 - uvs[2 * src + 1])) > 1e-4) lechFlip += 1; // V phải là 1 − v
  }
  ok('chỉ số vt trỏ ĐÚNG UV nguồn của từng mặt (dedupe vô can)', lechUv === 0);
  ok('trục V đã lật 1−v cho quy ước OBJ/MTL (map.flipY=true)', lechFlip === 0);
  ok('không mặt nào trỏ vt ngoài biên', faces.every((f) => f.every((i) => i >= 1 && i <= vt.length)));
}

/* ── ⑥ CN-F2 — primitive KẾ THỪA Kd từ texel mảng mesh nó thay ── */
console.log('CN-F2 — Kd trung vị từ atlas thay cho xám cứng');
{
  const soup: Soup = { positions: [], indices: [] };
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cylinderAt(soup, 0.2 * sx, 0.2 * sz, 0.02, -0.5, 0.15, 20, 24);
  boxAt(soup, 0, 0.225, 0, 0.45, 0.15, 0.45);
  const nV = soup.positions.length / 3;
  // atlas 2×1: nửa TRÁI nâu (128,80,40), nửa PHẢI xanh (0,200,0). Mọi đỉnh UV u<0.5 ⇒ chỉ nâu.
  const uvs = new Float32Array(nV * 2);
  for (let i = 0; i < nV; i++) { uvs[2 * i] = 0.25; uvs[2 * i + 1] = 0.5; }
  const texRgba = { width: 2, height: 1, channels: 4, data: new Uint8Array([128, 80, 40, 255, 0, 200, 0, 255]) };
  const geom: GlbGeometry = { positions: new Float32Array(soup.positions), uvs, indices: new Uint32Array(soup.indices) };
  const res = chuanNetGeometry(geom, { hMm: 800, texRgba });
  const cyls = res.parts.filter((p) => p.loai === 'cylinder');
  ok('vẫn tách được 4 chân', cyls.length === 4);
  const kd = cyls.every((p) => p.loai === 'cylinder' && p.kdSrgb !== null
    && Math.abs(p.kdSrgb[0] - 128 / 255) < 0.02
    && Math.abs(p.kdSrgb[1] - 80 / 255) < 0.02
    && Math.abs(p.kdSrgb[2] - 40 / 255) < 0.02);
  ok('mỗi chân mang Kd nâu của atlas (KHÔNG phải xám 0.72)', kd);
  const matNamed = cyls.every((p) => p.loai === 'cylinder' && p.matName !== 'mat_primitive' && res.mtl.includes(`newmtl ${p.matName}`));
  ok('MTL có material RIÊNG từng chân', matNamed);
  ok('OBJ dùng đúng material riêng đó', cyls.every((p) => p.loai === 'cylinder' && res.obj.includes(`usemtl ${p.matName}`)));

  // không đưa atlas ⇒ giữ xám dự phòng + KHAI THẬT
  const res2 = chuanNetGeometry(geom, { hMm: 800 });
  ok('không có atlas ⇒ Kd null + mat_primitive', res2.parts.every((p) => p.loai !== 'cylinder' || (p.kdSrgb === null && p.matName === 'mat_primitive')));
  ok('không có atlas ⇒ ghi chú khai thật', res2.ghiChu.some((g) => g.includes('texRgba')));
}

/* ── ⑦ vòng TRỤC NGANG (tay vịn) — RANSAC tách được khi dính khối, và KHÔNG ép khi vòng hở ── */
console.log('fitRingRansac + ④c2 — vòng trục ngang dính nệm');
{
  const p1: V3T = [1, 0, 0]; const p2: V3T = [0, 1, 0]; const p3: V3T = [-1, 0, 0];
  const cc = circumCircle3(p1, p2, p3);
  ok('circumCircle3: R=1 tâm gốc', cc !== null && within(cc.radius, 1, 0.1) && Math.abs(cc.center[0]) < 1e-9 && Math.abs(cc.center[1]) < 1e-9);
  ok('circumCircle3: 3 điểm thẳng hàng → null', circumCircle3([0, 0, 0], [1, 0, 0], [2, 0, 0]) === null);

  // xuyến trục X R=0.12 r=0.011 tại (0.25, 0.30, 0) — DÍNH liền khối nệm, đúng ca CN cũ chịu thua
  const soup: Soup = { positions: [], indices: [] };
  ringXInto(soup, 0.25, 0.30, 0.12, 0.006, 0);
  boxAt(soup, 0, 0.28, 0, 0.42, 0.30, 0.42);   // nệm ôm sát vòng
  boxAt(soup, 0, 0.60, 0, 0.42, 0.24, 0.10);   // lưng tựa
  const geom: GlbGeometry = { positions: new Float32Array(soup.positions), uvs: null, indices: new Uint32Array(soup.indices) };
  const res = chuanNetGeometry(geom, { hMm: 1000 });
  const rings = res.parts.filter((p) => p.loai === 'torus' && p.id.includes('vong-tay-vin'));
  ok('vòng trục NGANG dính khối vẫn tách được', rings.length === 1);
  if (rings.length === 1 && rings[0].loai === 'torus') {
    const mm = res.scaleMmPerUnit;
    ok('R ±5%', within(rings[0].thamSo.rMajorMm, 0.12 * mm, 5));
    ok('trục ≈ X (ngang)', Math.abs(rings[0].thamSo.axis[0]) > 0.95);
    ok('phủ ≥ 300°', (rings[0].phuDo ?? 0) >= 300);
    ok('sai số < 2%', rings[0].saiSoPct < 2);
  }

  // CUNG HỞ 140° (như thanh gác chân cong) ⇒ CẤM ÉP thành xuyến, phải giữ mesh
  const soupHo: Soup = { positions: [], indices: [] };
  ringXInto(soupHo, 0.25, 0.30, 0.12, 0.006, 220); // cắt 220° ⇒ còn 140°
  boxAt(soupHo, 0, 0.28, 0, 0.42, 0.30, 0.42);
  boxAt(soupHo, 0, 0.60, 0, 0.42, 0.24, 0.10);
  const gHo: GlbGeometry = { positions: new Float32Array(soupHo.positions), uvs: null, indices: new Uint32Array(soupHo.indices) };
  const rHo = chuanNetGeometry(gHo, { hMm: 1000 });
  ok('cung hở 140° KHÔNG bị ép thành xuyến', !rHo.parts.some((p) => p.loai === 'torus'));
  ok('… và phần đó nằm lại trong mảnh mesh giữ', rHo.parts.some((p) => p.loai === 'mesh'));
}

/* ── ⑧ MIRROR-COMPLETION (hàm THUẦN) — đối xứng SINH kích thước, không chỉ TỪ CHỐI (14/08) ── */
console.log('mirrorCompleteShapes — copy kích thước theo RMS thấp hơn qua mặt đối xứng');
{
  // ⑧a cặp đối xứng qua x=0 (RMS khác nhau) + 1 part LẺ vai trò khác (không đối tác)
  const pairA: MirrorableShape = { id: 'p1-chan', loai: 'cylinder', kind: 'chan', centerMm: [100, 0, 50], rms: 0.4, shape: [38, 300] };
  const pairB: MirrorableShape = { id: 'p2-chan', loai: 'cylinder', kind: 'chan', centerMm: [-100, 0, 50], rms: 3.1, shape: [41, 305] };
  const lone: MirrorableShape = { id: 'p3-vong', loai: 'torus', kind: 'vong', centerMm: [0, 0, 0], rms: 0.2, shape: [280, 15] };
  const res1 = mirrorCompleteShapes([pairA, pairB, lone]);
  ok('cặp đối xứng ⇒ đúng 1 kết quả (bên RMS cao hơn bị sửa)', res1.length === 1);
  const rB = res1.find((r) => r.id === 'p2-chan');
  ok('bên RMS cao hơn nhận đúng kích thước bên RMS thấp hơn', !!rB && rB.shape[0] === 38 && rB.shape[1] === 300);
  ok('ghi rõ mirroredFrom = bên gốc', rB?.mirroredFrom === 'p1-chan');
  ok('part LẺ (không đối tác cùng vai trò) không xuất hiện trong kết quả — giữ nguyên', !res1.some((r) => r.id === 'p3-vong'));

  // ⑧b 4 chân hình chữ nhật (2 mặt đối xứng trái-phải + trước-sau) → union-find gộp cả 4 vào MỘT
  // cụm liên thông dù mỗi part chỉ khớp trực tiếp qua MỘT trục. p1 RMS thấp nhất ⇒ làm gốc cho cả 3.
  const legs4: MirrorableShape[] = [
    { id: 'p1-chan', loai: 'cylinder', kind: 'chan', centerMm: [120, 0, 80], rms: 0.1, shape: [20, 400] },
    { id: 'p2-chan', loai: 'cylinder', kind: 'chan', centerMm: [-120, 0, 80], rms: 0.5, shape: [21, 402] },
    { id: 'p3-chan', loai: 'cylinder', kind: 'chan', centerMm: [120, 0, -80], rms: 0.6, shape: [22, 398] },
    { id: 'p4-chan', loai: 'cylinder', kind: 'chan', centerMm: [-120, 0, -80], rms: 0.9, shape: [19, 405] },
  ];
  const res2 = mirrorCompleteShapes(legs4);
  ok('4 chân hình chữ nhật ⇒ 3 part được sửa (1 làm gốc)', res2.length === 3);
  ok('CẢ BA đều nhận kích thước của p1 (RMS thấp nhất toàn cụm)', res2.every((r) => r.shape[0] === 20 && r.shape[1] === 400 && r.mirroredFrom === 'p1-chan'));

  // ⑧c 3 tâm LỆCH, KHÔNG có mặt đối xứng chung nào cho cả nhóm (2 điểm bất kỳ LUÔN có một mặt
  // phẳng trung trực — phản chiếu-khớp tầm thường — nên phép thử "không đối xứng" phải dùng ≥3
  // điểm: với số lẻ, không thể ghép hết thành cặp qua BẤT KỲ trục nào, nên mọi trục đều bị loại)
  // ⇒ không sửa gì — luật "không đạt thì giữ, cấm ép" [T0] áp cả ở tầng mirror-completion.
  const lech: MirrorableShape[] = [
    { id: 'p1-chan', loai: 'cylinder', kind: 'chan', centerMm: [100, 0, 0], rms: 0.1, shape: [20, 400] },
    { id: 'p2-chan', loai: 'cylinder', kind: 'chan', centerMm: [-40, 0, 77], rms: 0.5, shape: [25, 410] },
    { id: 'p3-chan', loai: 'cylinder', kind: 'chan', centerMm: [60, 0, -90], rms: 0.3, shape: [30, 420] },
  ];
  ok('3 tâm lệch, không mặt đối xứng chung ⇒ không sửa gì (giữ nguyên)', mirrorCompleteShapes(lech).length === 0);
}

/* ── ⑨ MIRROR-COMPLETION trong pipeline thật — mesh 2 chân (1 sạch, 1 lượn sóng) đối xứng qua
 * x=0 + 1 vòng (vai trò khác, không đối tác) ── */
console.log('chuanNetGeometry — mirror-completion: 2 chân hội tụ kích thước, tâm giữ nguyên, vòng không bị đụng');
{
  const soup: Soup = { positions: [], indices: [] };
  // chân SẠCH tại x=+0.2 — trụ tròn hoàn hảo, RMS gần 0
  cylinderAt(soup, 0.2, 0, 0.02, -0.5, 0.15, 24, 20);
  // chân LƯỢN SÓNG tại x=-0.2 — bán kính dao động ±0.0006 quanh 0.02 (4 múi) ⇒ RMS đo được > 0,
  // nhưng vẫn đạt ngưỡng 2% nên KHÔNG bị đẩy về giữ-mesh (đúng ca "khác nhau do noise", không phải
  // "hình khác hẳn nhau").
  addQuadGrid(soup, (u, v) => {
    const rr = 0.02 + 0.0006 * Math.sin(4 * u * 2 * Math.PI);
    return [-0.2 + rr * Math.cos(u * 2 * Math.PI), -0.5 + 0.65 * v, rr * Math.sin(u * 2 * Math.PI)];
  }, 24, 20, true);
  // vòng gác chân — vai trò KHÁC ("vong"), không có đối tác cùng vai trò ⇒ mirror-completion bỏ qua
  torusAt(soup, -0.15, 0.28, 0.015, 48, 12);

  const geom: GlbGeometry = { positions: new Float32Array(soup.positions), uvs: null, indices: new Uint32Array(soup.indices) };
  const res = chuanNetGeometry(geom, { hMm: 800 });
  const cyls = res.parts.filter((p) => p.loai === 'cylinder');
  const tors = res.parts.filter((p) => p.loai === 'torus');
  ok('2 chân tách được', cyls.length === 2);
  ok('1 vòng tách được', tors.length === 1);
  if (cyls.length === 2 && cyls[0].loai === 'cylinder' && cyls[1].loai === 'cylinder') {
    const a = cyls[0]; const b = cyls[1];
    ok('sau mirror-completion: radius 2 chân GIỐNG HỆT nhau', a.thamSo.radiusMm === b.thamSo.radiusMm);
    ok('sau mirror-completion: height 2 chân GIỐNG HỆT nhau', a.thamSo.heightMm === b.thamSo.heightMm);
    ok('đúng 1 trong 2 mang mirroredFrom (bên kia là gốc)', [a.mirroredFrom, b.mirroredFrom].filter(Boolean).length === 1);
    // tâm KHÔNG bị đổi/hoán vị — mỗi chân vẫn đứng đúng bên X của nó trong mesh gốc
    const posX = [a, b].find((c) => c.thamSo.centerMm[0] > 0);
    const negX = [a, b].find((c) => c.thamSo.centerMm[0] < 0);
    ok('chân +X vẫn ở +X (tâm không dịch chuyển)', !!posX && within(posX.thamSo.centerMm[0], 0.2 * res.scaleMmPerUnit, 5));
    ok('chân -X vẫn ở -X (tâm không dịch chuyển)', !!negX && within(Math.abs(negX.thamSo.centerMm[0]), 0.2 * res.scaleMmPerUnit, 5));
  }
  if (tors.length === 1 && tors[0].loai === 'torus') {
    ok('vòng (vai trò khác, không đối tác) KHÔNG mang mirroredFrom', tors[0].mirroredFrom === undefined);
    ok('vòng vẫn đúng bán kính như trước (không bị mirror-completion đụng)', within(tors[0].thamSo.rMajorMm, 0.28 * res.scaleMmPerUnit, 3));
  }
}

console.log(`\n${pass} pass · ${fail} fail`);
if (fail) process.exit(1);
