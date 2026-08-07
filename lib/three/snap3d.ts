/**
 * lib/three/snap3d.ts — BẮT ĐIỂM 3D (T4, NC-12 §3.2-3.3) — nút chặn lớn nhất của chặng Vẽ 3D.
 *
 * ⛔ KHÔNG đẻ SnapSettings thứ hai (K1): nhận đúng `SnapSettings` của `lib/cad/store.ts:191`
 * (11 công tắc 2D) — file này chỉ ÁNH XẠ thang 7 nấc 3D (NC-12 §3.3) về các công tắc đó:
 *
 *   nấc 3D                    | công tắc SnapSettings | nhãn VN (luật ② — bài học SketchUp)
 *   1 đầu mút cạnh            | endpoint              | "Đầu mút"
 *   2 giao tuyến (cạnh 2 mặt) | intersection          | "Giao tuyến"
 *   3 tâm mặt                 | center                | "Tâm mặt"
 *   4 giữa cạnh               | midpoint              | "Giữa cạnh"
 *   5 vuông góc / tiếp tuyến  | perpendicular/tangent | "Vuông góc" (cần điểm neo mới có nghĩa)
 *   6 trên mặt phẳng          | nearest               | "Trên mặt"
 *   7 lưới sàn                | grid                  | "Lưới sàn"
 *
 * Thang là ƯU TIÊN CỨNG THEO LOẠI (chuẩn AutoCAD OSNAP — cùng luật `findSnap()` 2D đã có test
 * bảo vệ `snap-priority.test.ts`), KHÔNG phải "ai gần con trỏ hơn thắng"; trong CÙNG nấc mới so
 * khoảng cách. Luật ① (bài học Blender): khoảng cách đo bằng PIXEL MÀN HÌNH, không bằng mm thế
 * giới — không thì điểm ở xa (nhỏ trên màn) ăn tranh điểm ở gần. Dung sai mặc định = nửa token
 * `--tap:44px` (globals.css) — nơi gọi đọc token thật rồi truyền vào, số ở đây chỉ là fallback.
 *
 * Luật ③: ⇧ khoá suy luận đang bắt (`lockKind`) · X/Y/Z khoá trục (`axisLock` + `AXIS_COLORS`
 * X đỏ · Y xanh lá · Z xanh dương — SPEC-DUNG-3D-THONG-NHAT §3.2 đã chốt). ⚠️ Bám ĐIỂM (file
 * này) và bám HƯỚNG (axisLock) là HAI hạng mục — axisLock có API riêng, đừng coi là một nấc snap.
 *
 * VIỆC 3 (mặt phẳng làm việc tự động): mọi kết quả có mặt dưới con trỏ đều kèm `workPlane`
 * (điểm + pháp tuyến thế giới) — rê lên sàn thì vẽ trên sàn, rê lên tường thì vẽ trên tường.
 *
 * Hình học vào là TRIANGLE SOUP (SceneGroup, không topology) ⇒ đặc trưng (đỉnh/cạnh/mặt) phải
 * TỰ RÚT: hàn đỉnh theo lưới 0.1mm → cạnh đặc trưng = cạnh biên (1 tam giác) hoặc cạnh gãy
 * (2 tam giác lệch pháp tuyến) — cạnh chéo do fan-triangulation trên cùng mặt phẳng KHÔNG tính.
 * Rút 1 lần mỗi geometry, cache WeakMap (runtime thuần — K1, không ghi Doc).
 */
import * as THREE from 'three';
import type { SnapSettings } from '../cad/store';

export type Snap3DKind =
  | 'endpoint'
  | 'intersection'
  | 'center'
  | 'midpoint'
  | 'perpendicular'
  | 'onface'
  | 'grid';

/** nhãn tiếng Việt — luật ② NC-12 §3.3, đúng SPEC-NGON-NGU-CHI-DAN (không jargon). */
export const SNAP3D_LABELS: Record<Snap3DKind, string> = {
  endpoint: 'Đầu mút',
  intersection: 'Giao tuyến',
  center: 'Tâm mặt',
  midpoint: 'Giữa cạnh',
  perpendicular: 'Vuông góc',
  onface: 'Trên mặt',
  grid: 'Lưới sàn',
};

/** thứ tự = thang ưu tiên cứng (nấc 1 → 7). */
const SNAP3D_PRIORITY: Snap3DKind[] = ['endpoint', 'intersection', 'center', 'midpoint', 'perpendicular', 'onface', 'grid'];

/** X đỏ · Y xanh lá · Z xanh dương (trục HỆ CAD — SPEC-DUNG-3D-THONG-NHAT §3.2). */
export const AXIS_COLORS = { x: '#e5484d', y: '#46a758', z: '#3e63dd' } as const;
export type CadAxis = keyof typeof AXIS_COLORS;

/** fallback khi nơi gọi không đọc được token --tap (44px) từ CSS — nửa vùng chạm. */
export const DEFAULT_SNAP_TOLERANCE_PX = 22;

export interface Snap3DResult {
  kind: Snap3DKind;
  label: string;
  /** điểm bắt, hệ three (m, Y-up) — cùng hệ SceneGroup.positions. */
  point: THREE.Vector3;
  /** khoảng cách con trỏ → điểm bắt trên MÀN HÌNH (px) — luật ①. */
  screenDistPx: number;
  /** VIỆC 3 — mặt phẳng làm việc dưới con trỏ (điểm chạm + pháp tuyến thế giới). Nấc grid: sàn y=0. */
  workPlane: { point: THREE.Vector3; normal: THREE.Vector3 } | null;
}

/* ───────────────────── rút đặc trưng từ triangle soup ───────────────────── */

interface FeatureIndex {
  /** đỉnh trên cạnh đặc trưng (local space) */
  endpoints: THREE.Vector3[];
  /** cạnh đặc trưng [a,b] (local) — nguồn cho giữa-cạnh + giao-tuyến */
  edges: [THREE.Vector3, THREE.Vector3][];
  /** trung điểm cạnh đặc trưng (local) */
  midpoints: THREE.Vector3[];
  /** tâm (trọng tâm theo diện tích) từng MẶT PHẲNG ghép (local) */
  faceCenters: THREE.Vector3[];
}

const WELD_EPS = 1e-4; // 0.1mm hệ mét — cùng bậc dung sai hàn của cad-to-obj (toFixed(4))
const COPLANAR_DOT = 0.9995; // 2 tam giác lệch pháp tuyến dưới ~1.8° coi là cùng mặt

const featureCache = new WeakMap<THREE.BufferGeometry, FeatureIndex>();

function weldKey(x: number, y: number, z: number): string {
  return `${Math.round(x / WELD_EPS)},${Math.round(y / WELD_EPS)},${Math.round(z / WELD_EPS)}`;
}

/** Rút đỉnh/cạnh/tâm-mặt từ soup — O(n tam giác), chạy 1 lần mỗi geometry rồi cache. */
export function featureIndexOf(geometry: THREE.BufferGeometry): FeatureIndex {
  const cached = featureCache.get(geometry);
  if (cached) return cached;

  const pos = geometry.attributes.position;
  const verts: THREE.Vector3[] = [];
  const vertId = new Map<string, number>();
  const idOf = (i: number): number => {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const k = weldKey(x, y, z);
    let id = vertId.get(k);
    if (id === undefined) {
      id = verts.length;
      vertId.set(k, id);
      verts.push(new THREE.Vector3(x, y, z));
    }
    return id;
  };

  // mỗi cạnh: đếm số tam giác + gom pháp tuyến các tam giác kề
  const edgeMap = new Map<string, { a: number; b: number; normals: THREE.Vector3[] }>();
  // mặt phẳng ghép: khoá theo (pháp tuyến + offset) lượng tử — gom tâm theo diện tích
  const planeAcc = new Map<string, { centroid: THREE.Vector3; area: number }>();

  const va = new THREE.Vector3();
  const vb = new THREE.Vector3();
  const vc = new THREE.Vector3();
  const e1 = new THREE.Vector3();
  const e2 = new THREE.Vector3();
  const n = new THREE.Vector3();

  const triCount = Math.floor(pos.count / 3);
  for (let t = 0; t < triCount; t++) {
    const i0 = t * 3;
    const ia = idOf(i0);
    const ib = idOf(i0 + 1);
    const ic = idOf(i0 + 2);
    if (ia === ib || ib === ic || ia === ic) continue; // tam giác suy biến (hàn dính)
    va.copy(verts[ia]);
    vb.copy(verts[ib]);
    vc.copy(verts[ic]);
    e1.subVectors(vb, va);
    e2.subVectors(vc, va);
    n.crossVectors(e1, e2);
    const area2 = n.length();
    if (area2 < 1e-12) continue;
    n.divideScalar(area2); // pháp tuyến đơn vị (chiều tuỳ winding — so bằng |dot|)

    for (const [p, q] of [[ia, ib], [ib, ic], [ic, ia]] as const) {
      const k = p < q ? `${p}|${q}` : `${q}|${p}`;
      let rec = edgeMap.get(k);
      if (!rec) {
        rec = { a: p, b: q, normals: [] };
        edgeMap.set(k, rec);
      }
      rec.normals.push(n.clone());
    }

    // khoá mặt phẳng: pháp tuyến chuẩn hoá chiều (thành phần lớn nhất dương) + offset lượng tử 0.1mm
    const sign = Math.abs(n.x) >= Math.abs(n.y) && Math.abs(n.x) >= Math.abs(n.z) ? Math.sign(n.x) || 1 : Math.abs(n.y) >= Math.abs(n.z) ? Math.sign(n.y) || 1 : Math.sign(n.z) || 1;
    const nx = n.x * sign;
    const ny = n.y * sign;
    const nz = n.z * sign;
    const off = (va.x * nx + va.y * ny + va.z * nz) * 1;
    const pk = `${Math.round(nx * 500)},${Math.round(ny * 500)},${Math.round(nz * 500)}|${Math.round(off / WELD_EPS)}`;
    const area = area2 / 2;
    const cx = (va.x + vb.x + vc.x) / 3;
    const cy = (va.y + vb.y + vc.y) / 3;
    const cz = (va.z + vb.z + vc.z) / 3;
    const acc = planeAcc.get(pk);
    if (acc) {
      acc.centroid.x += cx * area;
      acc.centroid.y += cy * area;
      acc.centroid.z += cz * area;
      acc.area += area;
    } else {
      planeAcc.set(pk, { centroid: new THREE.Vector3(cx * area, cy * area, cz * area), area });
    }
  }

  const edges: [THREE.Vector3, THREE.Vector3][] = [];
  const endpointIds = new Set<number>();
  for (const rec of edgeMap.values()) {
    // cạnh đặc trưng = biên (1 tam giác) HOẶC gãy (tồn tại cặp pháp tuyến lệch nhau) —
    // cạnh chéo fan trên cùng mặt phẳng có 2 pháp tuyến trùng ⇒ loại.
    let feature = rec.normals.length === 1;
    if (!feature) {
      for (let i = 0; i < rec.normals.length && !feature; i++)
        for (let j = i + 1; j < rec.normals.length; j++)
          if (Math.abs(rec.normals[i].dot(rec.normals[j])) < COPLANAR_DOT) {
            feature = true;
            break;
          }
    }
    if (feature) {
      edges.push([verts[rec.a], verts[rec.b]]);
      endpointIds.add(rec.a);
      endpointIds.add(rec.b);
    }
  }

  const index: FeatureIndex = {
    endpoints: [...endpointIds].map((id) => verts[id]),
    edges,
    midpoints: edges.map(([a, b]) => new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5)),
    faceCenters: [...planeAcc.values()].filter((p) => p.area > 1e-9).map((p) => p.centroid.divideScalar(p.area)),
  };
  featureCache.set(geometry, index);
  return index;
}

/* ───────────────────── tìm điểm bắt ───────────────────── */

export interface Snap3DQuery {
  /** raycaster ĐÃ setFromCamera (nơi gọi có sẵn trong pointermove) — mesh đã ensureBoundsTree. */
  raycaster: THREE.Raycaster;
  camera: THREE.Camera;
  /** vị trí con trỏ trong khung nhìn (px, gốc trái-trên) + kích thước khung (px). */
  pointerPx: { x: number; y: number };
  viewportPx: { w: number; h: number };
  meshes: THREE.Mesh[];
  snap: SnapSettings;
  /** luật ① — dung sai px màn hình. Nơi gọi đọc token --tap rồi /2; thiếu thì fallback 22. */
  tolerancePx?: number;
  /** bước lưới sàn (m) cho nấc 7 — map từ `gridStep` mm của store (nơi gọi /1000). */
  gridStepM?: number;
  /** điểm neo đang kéo/vẽ (nấc 5 vuông-góc mới có nghĩa — NC-12 §3.3). */
  anchor?: THREE.Vector3 | null;
  /** ⇧ đang giữ — khoá đúng loại đang bắt trước đó, các nấc khác bị bỏ qua. */
  lockKind?: Snap3DKind | null;
}

function projectPx(p: THREE.Vector3, camera: THREE.Camera, vp: { w: number; h: number }, out: THREE.Vector3): { x: number; y: number; behind: boolean } {
  out.copy(p).project(camera);
  return { x: ((out.x + 1) / 2) * vp.w, y: ((1 - out.y) / 2) * vp.h, behind: out.z > 1 };
}

/** điểm trên đoạn [a,b] gần TIA con trỏ nhất (giao tuyến — bắt trượt dọc cạnh). */
function closestOnSegmentToRay(a: THREE.Vector3, b: THREE.Vector3, ray: THREE.Ray, out: THREE.Vector3): void {
  const seg = new THREE.Vector3().subVectors(b, a);
  const segLen = seg.length();
  if (segLen < 1e-9) {
    out.copy(a);
    return;
  }
  // three có sẵn distanceSqToSegment trả điểm gần nhất trên đoạn — không tự viết toán lần 2
  ray.distanceSqToSegment(a, b, undefined, out);
}

/**
 * Tìm điểm bắt 3D dưới con trỏ theo thang 7 nấc. Trả null khi không nấc nào ăn (kể cả grid tắt).
 * KHÔNG side-effect — nơi gọi tự vẽ dấu + chữ (marker/label là việc của viewer).
 */
export function findSnap3D(q: Snap3DQuery): Snap3DResult | null {
  if (!q.snap.enabled) return null;
  const tol = q.tolerancePx ?? DEFAULT_SNAP_TOLERANCE_PX;
  const tmp = new THREE.Vector3();
  const world = new THREE.Vector3();

  // 1 tia xuyên cảnh — mesh đã BVH nên rẻ (21,6 µs/tia theo NC-12)
  const hit = q.meshes.length ? q.raycaster.intersectObjects(q.meshes, false)[0] : undefined;
  const workPlane = hit?.face
    ? { point: hit.point.clone(), normal: hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize() }
    : null;

  type Cand = { kind: Snap3DKind; point: THREE.Vector3; d: number };
  const cands: Cand[] = [];
  const consider = (kind: Snap3DKind, p: THREE.Vector3) => {
    if (q.lockKind && kind !== q.lockKind) return;
    const s = projectPx(p, q.camera, q.viewportPx, tmp);
    if (s.behind) return;
    const d = Math.hypot(s.x - q.pointerPx.x, s.y - q.pointerPx.y);
    if (d <= tol) cands.push({ kind, point: p.clone(), d });
  };

  if (hit) {
    const mesh = hit.object as THREE.Mesh;
    const fi = featureIndexOf(mesh.geometry as THREE.BufferGeometry);
    const m = mesh.matrixWorld;

    if (q.snap.endpoint) for (const p of fi.endpoints) consider('endpoint', world.copy(p).applyMatrix4(m));
    if (q.snap.midpoint) for (const p of fi.midpoints) consider('midpoint', world.copy(p).applyMatrix4(m));
    if (q.snap.center) for (const p of fi.faceCenters) consider('center', world.copy(p).applyMatrix4(m));
    if (q.snap.intersection) {
      const a = new THREE.Vector3();
      const b = new THREE.Vector3();
      const on = new THREE.Vector3();
      for (const [la, lb] of fi.edges) {
        a.copy(la).applyMatrix4(m);
        b.copy(lb).applyMatrix4(m);
        closestOnSegmentToRay(a, b, q.raycaster.ray, on);
        consider('intersection', on);
      }
    }
    // nấc 5 — chân vuông góc từ điểm neo xuống mặt đang trỏ (cần anchor mới có nghĩa)
    if (q.snap.perpendicular && q.anchor && workPlane) {
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(workPlane.normal, workPlane.point);
      const foot = new THREE.Vector3();
      plane.projectPoint(q.anchor, foot);
      consider('perpendicular', foot);
    }
    // nấc 6 — điểm chạm trên mặt (map công tắc `nearest` 2D — "trên vật gần nhất")
    if (q.snap.nearest) consider('onface', hit.point);
  }

  // nấc 7 — lưới sàn: chỉ khi không có gì khác (thang cứng tự lo vì grid đứng chót)
  if (q.snap.grid && q.gridStepM && q.gridStepM > 0) {
    const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const gp = new THREE.Vector3();
    if (q.raycaster.ray.intersectPlane(ground, gp)) {
      gp.x = Math.round(gp.x / q.gridStepM) * q.gridStepM;
      gp.z = Math.round(gp.z / q.gridStepM) * q.gridStepM;
      gp.y = 0;
      consider('grid', gp);
    }
  }

  if (!cands.length) return null;
  // thang ƯU TIÊN CỨNG THEO LOẠI — trong cùng loại mới so px (đúng luật snap-priority 2D)
  for (const kind of SNAP3D_PRIORITY) {
    let inKind = cands.filter((c) => c.kind === kind);
    if (!inKind.length) continue;
    inKind.sort((p, r) => p.d - r.d);
    // Bắt được lúc VERIFY app thật (07/08): 'intersection' là bắt TRƯỢT dọc cạnh (liên tục) —
    // giữ nguyên thang thì "Giữa cạnh" KHÔNG BAO GIỜ hiện được (giữa-cạnh nằm ngay trên cạnh,
    // điểm trượt luôn lọt dung sai cùng lúc). Luật bổ sung: điểm ĐẶC BIỆT trên CÙNG đường
    // (midpoint) thắng điểm TRƯỢT chung chung khi cả hai cùng lọt dung sai — cùng tinh thần
    // SketchUp ("Midpoint" nổi trên "On Edge"), không đổi thứ tự thang giữa các loại RỜI nhau.
    if (kind === 'intersection') {
      const mids = cands.filter((c) => c.kind === 'midpoint');
      if (mids.length) {
        mids.sort((p, r) => p.d - r.d);
        inKind = mids;
      }
    }
    const win = inKind[0];
    return {
      kind: win.kind,
      label: SNAP3D_LABELS[win.kind],
      point: win.point,
      screenDistPx: win.d,
      workPlane: win.kind === 'grid' && !workPlane ? { point: win.point.clone(), normal: new THREE.Vector3(0, 1, 0) } : workPlane,
    };
  }
  return null;
}

/* ───────────────────── bám HƯỚNG — khoá trục (hạng mục riêng, luật ③) ───────────────────── */

/** Chiếu `point` lên đường thẳng qua `anchor` theo trục CAD (X/Y/Z). Trục hệ CAD map sang three:
 * X→(1,0,0) · Y→(0,0,−1) · Z→(0,1,0) (cùng phép `cadAxesToThree`). Trả điểm đã khoá + màu trục. */
export function lockToAxis(anchor: THREE.Vector3, point: THREE.Vector3, axis: CadAxis): { point: THREE.Vector3; color: string } {
  const dir = axis === 'x' ? new THREE.Vector3(1, 0, 0) : axis === 'y' ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(0, 1, 0);
  const t = new THREE.Vector3().subVectors(point, anchor).dot(dir);
  return { point: new THREE.Vector3().copy(anchor).addScaledVector(dir, t), color: AXIS_COLORS[axis] };
}
