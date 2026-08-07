/**
 * lib/three/snap3d.test.ts — bắt điểm 3D (T4): rút đặc trưng từ soup + thang ưu tiên cứng +
 * dung sai PIXEL + khoá loại (⇧) + khoá trục (X/Y/Z) + mặt phẳng làm việc. Test ĐO toạ độ thật.
 * Chạy: node_modules/.bin/sucrase-node lib/three/snap3d.test.ts
 */
import * as THREE from 'three';
import { featureIndexOf, findSnap3D, lockToAxis, SNAP3D_LABELS, AXIS_COLORS } from './snap3d';
import { ensureBoundsTree, installAcceleratedRaycast } from './bvh';
import type { SnapSettings } from '../cad/store';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL - ${label}`);
  }
}
const near = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) < eps;

const SNAP_ALL: SnapSettings = {
  enabled: true, endpoint: true, midpoint: true, center: true, intersection: true,
  grid: true, quadrant: true, node: true, nearest: true, perpendicular: true, tangent: true,
};

installAcceleratedRaycast();

// khối hộp 1×1×1 m, tâm gốc — 12 cạnh đặc trưng, 8 đỉnh, 6 tâm mặt
const boxGeom = new THREE.BoxGeometry(1, 1, 1).toNonIndexed();
const box = new THREE.Mesh(boxGeom, new THREE.MeshBasicMaterial());
box.updateMatrixWorld(true);
ensureBoundsTree(boxGeom);

console.log('featureIndexOf — hộp: đúng 8 đỉnh · 12 cạnh (chéo fan cùng mặt bị loại) · 6 tâm mặt');
{
  const fi = featureIndexOf(boxGeom);
  ok('8 đỉnh đặc trưng', fi.endpoints.length === 8);
  ok('12 cạnh đặc trưng (không dính 12 đường chéo mặt)', fi.edges.length === 12);
  ok('6 tâm mặt', fi.faceCenters.length === 6);
  ok('tâm một mặt đúng toạ độ (±0.5,0,0)…', fi.faceCenters.some((c) => near(Math.abs(c.x), 0.5) && near(c.y, 0) && near(c.z, 0)));
}

const VP = { w: 800, h: 600 };
const camera = new THREE.PerspectiveCamera(50, VP.w / VP.h, 0.05, 100);
camera.position.set(3, 2.2, 3);
camera.lookAt(0, 0, 0);
camera.updateProjectionMatrix();
camera.updateMatrixWorld(true);

function pxOf(p: THREE.Vector3): { x: number; y: number } {
  const v = p.clone().project(camera);
  return { x: ((v.x + 1) / 2) * VP.w, y: ((1 - v.y) / 2) * VP.h };
}
function query(pointerPx: { x: number; y: number }, over: Partial<Parameters<typeof findSnap3D>[0]> = {}) {
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(new THREE.Vector2((pointerPx.x / VP.w) * 2 - 1, -(pointerPx.y / VP.h) * 2 + 1), camera);
  return findSnap3D({ raycaster, camera, pointerPx, viewportPx: VP, meshes: [box], snap: SNAP_ALL, tolerancePx: 12, ...over });
}

console.log('findSnap3D — rê đúng đỉnh (0.5,0.5,0.5): trả "Đầu mút" tại đúng toạ độ');
{
  const corner = new THREE.Vector3(0.5, 0.5, 0.5);
  const r = query(pxOf(corner));
  ok('có kết quả', !!r);
  ok('kind=endpoint, nhãn "Đầu mút"', r?.kind === 'endpoint' && r.label === SNAP3D_LABELS.endpoint);
  ok('đúng toạ độ đỉnh', !!r && r.point.distanceTo(corner) < 1e-6);
  ok('kèm workPlane (mặt dưới con trỏ)', !!r?.workPlane);
}

console.log('findSnap3D — thang ƯU TIÊN CỨNG: đỉnh và giữa-cạnh cùng lọt dung sai ⇒ đầu mút THẮNG dù xa con trỏ hơn');
{
  const corner = new THREE.Vector3(0.5, 0.5, 0.5);
  const mid = new THREE.Vector3(0.5, 0.5, 0); // giữa cạnh trên-phải
  const pxCorner = pxOf(corner);
  const pxMid = pxOf(mid);
  // con trỏ đặt LỆCH về phía giữa-cạnh (gần mid hơn corner trên màn) nhưng cả 2 trong dung sai lớn
  const pointer = { x: pxMid.x + (pxCorner.x - pxMid.x) * 0.3, y: pxMid.y + (pxCorner.y - pxMid.y) * 0.3 };
  const r = query(pointer, { tolerancePx: Math.hypot(pxCorner.x - pxMid.x, pxCorner.y - pxMid.y) + 20 });
  ok('endpoint thắng midpoint dù màn hình xa hơn (ưu tiên theo LOẠI, không theo px)', r?.kind === 'endpoint');
}

console.log('findSnap3D — luật ① dung sai PIXEL: ngoài tolerancePx thì không bắt');
{
  const corner = new THREE.Vector3(0.5, 0.5, 0.5);
  const px = pxOf(corner);
  const r = query({ x: px.x + 40, y: px.y }, { tolerancePx: 12, snap: { ...SNAP_ALL, nearest: false, grid: false, intersection: false, center: false, midpoint: false } });
  ok('cách 40px với dung sai 12px ⇒ null', r === null);
}

console.log('findSnap3D — công tắc SnapSettings: tắt endpoint thì nấc dưới lên thay');
{
  const corner = new THREE.Vector3(0.5, 0.5, 0.5);
  const r = query(pxOf(corner), { snap: { ...SNAP_ALL, endpoint: false }, tolerancePx: 30 });
  ok('không trả endpoint khi công tắc tắt', !!r && r.kind !== 'endpoint');
}

console.log('findSnap3D — giữa cạnh THẮNG điểm trượt trên cạnh (bug bắt lúc verify app thật 07/08)');
{
  const mid = new THREE.Vector3(0.5, 0.5, 0); // giữa cạnh trên — điểm trượt trên cạnh cũng lọt dung sai
  const r = query(pxOf(mid), { tolerancePx: 15 });
  ok('rê đúng giữa cạnh (intersection bật) ⇒ midpoint hiện, không bị che', r?.kind === 'midpoint');
  // rê LỆCH khỏi giữa cạnh (vẫn trên cạnh, ngoài dung sai của midpoint) ⇒ về lại giao tuyến
  const off = new THREE.Vector3(0.5, 0.5, 0.3);
  const r2 = query(pxOf(off), { tolerancePx: 10, snap: { ...SNAP_ALL, endpoint: false } });
  ok('rê giữa đoạn xa midpoint ⇒ vẫn là giao tuyến (bắt trượt dọc cạnh)', r2?.kind === 'intersection');
}

console.log('findSnap3D — ⇧ khoá loại (lockKind): chỉ trả đúng loại đang khoá');
{
  const mid = new THREE.Vector3(0.5, 0.5, 0);
  const r = query(pxOf(mid), { lockKind: 'midpoint', tolerancePx: 40 });
  ok('khoá midpoint ⇒ trả midpoint dù đỉnh cũng gần', r?.kind === 'midpoint');
  ok('đúng toạ độ giữa cạnh', !!r && r.point.distanceTo(mid) < 1e-6);
}

console.log('findSnap3D — tâm mặt: rê giữa mặt hộp trả "Tâm mặt" + workPlane pháp tuyến đúng mặt đó');
{
  const faceCenter = new THREE.Vector3(0.5, 0, 0); // tâm mặt +X
  const r = query(pxOf(faceCenter), { tolerancePx: 10, snap: { ...SNAP_ALL, intersection: false } });
  ok('kind=center', r?.kind === 'center');
  ok('workPlane pháp tuyến ≈ +X', !!r?.workPlane && Math.abs(r.workPlane.normal.x) > 0.99);
}

console.log('findSnap3D — nấc 6 "Trên mặt": giữa mặt, tắt center/intersection ⇒ onface tại điểm chạm');
{
  const p = new THREE.Vector3(0.5, 0.1, 0.1); // trên mặt +X, lệch tâm
  const r = query(pxOf(p), { snap: { ...SNAP_ALL, center: false, intersection: false, endpoint: false, midpoint: false }, tolerancePx: 12 });
  ok('kind=onface nhãn "Trên mặt"', r?.kind === 'onface' && r.label === 'Trên mặt');
  ok('điểm nằm đúng mặt x=0.5', !!r && near(r.point.x, 0.5, 1e-4));
}

console.log('findSnap3D — nấc 7 lưới sàn: không mesh nào dưới con trỏ ⇒ bắt vào mắt lưới');
{
  const gp = new THREE.Vector3(3, 0, -2); // ngoài hộp, trên sàn
  const r = query(pxOf(gp), { tolerancePx: 25, gridStepM: 1 });
  ok('kind=grid nhãn "Lưới sàn"', r?.kind === 'grid' && r.label === 'Lưới sàn');
  ok('toạ độ tròn mắt lưới 1m', !!r && near(r.point.x % 1, 0, 1e-9) && near(r.point.z % 1, 0, 1e-9) && near(r.point.y, 0));
  ok('workPlane = sàn (pháp tuyến +Y)', !!r?.workPlane && near(r.workPlane.normal.y, 1));
}

console.log('findSnap3D — nấc 5 vuông góc: có anchor ⇒ chân vuông góc từ neo xuống mặt đang trỏ');
{
  const anchor = new THREE.Vector3(2, 1.3, 0.1); // điểm neo lơ lửng ngoài hộp
  const onFace = new THREE.Vector3(0.5, 0.2, 0.1);
  const r = query(pxOf(new THREE.Vector3(0.5, 1.3 * 0 + 0.2, 0.1)), {
    anchor, tolerancePx: 400, // chân vuông góc có thể xa con trỏ — nới dung sai để kiểm toạ độ
    snap: { ...SNAP_ALL, endpoint: false, midpoint: false, center: false, intersection: false, nearest: false, grid: false },
  });
  void onFace;
  ok('kind=perpendicular', r?.kind === 'perpendicular');
  // mặt +X (x=0.5): chân vuông góc của anchor = (0.5, anchor.y, anchor.z)
  ok('chân vuông góc đúng toạ độ (0.5, 1.3, 0.1)', !!r && near(r.point.x, 0.5, 1e-4) && near(r.point.y, 1.3, 1e-4) && near(r.point.z, 0.1, 1e-4));
}

console.log('findSnap3D — snap.enabled=false ⇒ null tuyệt đối');
{
  const r = query(pxOf(new THREE.Vector3(0.5, 0.5, 0.5)), { snap: { ...SNAP_ALL, enabled: false } });
  ok('tắt tổng ⇒ null', r === null);
}

console.log('lockToAxis — bám HƯỚNG (luật ③): X đỏ · Y xanh lá · Z xanh dương, chiếu đúng trục CAD');
{
  const anchor = new THREE.Vector3(1, 2, 3);
  const p = new THREE.Vector3(4, 5, 6);
  const rx = lockToAxis(anchor, p, 'x');
  ok('trục X (three X): chỉ x đổi', near(rx.point.x, 4) && near(rx.point.y, 2) && near(rx.point.z, 3) && rx.color === AXIS_COLORS.x);
  const ry = lockToAxis(anchor, p, 'y');
  ok('trục Y CAD (three −Z): chỉ z đổi', near(ry.point.x, 1) && near(ry.point.y, 2) && near(ry.point.z, 6) && ry.color === AXIS_COLORS.y);
  const rz = lockToAxis(anchor, p, 'z');
  ok('trục Z CAD (three Y): chỉ y đổi', near(rz.point.x, 1) && near(rz.point.y, 5) && near(rz.point.z, 3) && rz.color === AXIS_COLORS.z);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
