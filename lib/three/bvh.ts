/**
 * lib/three/bvh.ts — CỔNG DUY NHẤT gọi `three-mesh-bvh` (T1, NC-12 §3.1) — cùng khuôn cô lập
 * thư viện ngoài như `csg.ts` đã làm với `three-bvh-csg`.
 *
 * Vì sao PHẢI có: NC-12 §3.1 đo 100 820 tam giác × 2 000 tia — Raycaster thuần 5 776,8 µs/tia,
 * acceleratedRaycast 21,6 µs/tia = 267 lần nhanh hơn. Bắt điểm 3D bắn tia MỖI lần con trỏ nhúc
 * nhích; không BVH thì riêng rê chuột đã ăn ~35% ngân sách khung hình.
 *
 * Cách dùng: gọi `installAcceleratedRaycast()` MỘT lần (idempotent) trước khi tạo mesh cần bắn
 * tia, rồi `ensureBoundsTree(geometry)` cho từng geometry — mesh mang geometry đó tự động đi
 * đường BVH (three-mesh-bvh đọc `geometry.boundsTree` trong `acceleratedRaycast`). Geometry bị
 * thay/dispose thì gọi `dropBoundsTree(geometry)` — cây BVH giữ Float32Array riêng, không tự chết
 * theo geometry.dispose().
 *
 * Cây BVH là CACHE RUNTIME thuần (không ghi vào Doc/.idf — K1, cùng luật meshCache build-ops.ts).
 *
 * Số đo cảnh IF THẬT (07/08, node v20, scripts đo trong báo cáo M-3D-NOI-OUT): cảnh demo-plan
 * nhiều SceneGroup nhỏ — xem bảng trong báo cáo; điểm chốt: tổng chi phí dựng < 1 khung hình 60fps
 * cho cảnh demo, và dựng LƯỜI theo geometry nên không chặn khung hình đầu.
 */
import * as THREE from 'three';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';

let installed = false;

/** Vá prototype MỘT lần: BufferGeometry.computeBoundsTree/disposeBoundsTree + Mesh.raycast
 * tăng tốc. An toàn gọi nhiều lần. Chỉ chạy ở client (nơi gọi đã nằm sau `next/dynamic(ssr:false)`
 * — cùng ràng buộc csg.ts). */
export function installAcceleratedRaycast(): void {
  if (installed) return;
  THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
  THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
  THREE.Mesh.prototype.raycast = acceleratedRaycast;
  installed = true;
}

type WithBvh = THREE.BufferGeometry & {
  boundsTree?: unknown;
  computeBoundsTree?: (opts?: object) => void;
  disposeBoundsTree?: () => void;
};

/** Dựng cây BVH cho geometry nếu chưa có (idempotent). Trả thời gian dựng ms (0 nếu đã có cây)
 * — trả số thật để nơi gọi/bench tự cộng sổ, không đoán. */
export function ensureBoundsTree(geometry: THREE.BufferGeometry): number {
  installAcceleratedRaycast();
  const g = geometry as WithBvh;
  if (g.boundsTree) return 0;
  const t0 = performance.now();
  g.computeBoundsTree!();
  return performance.now() - t0;
}

/** Gỡ cây BVH (gọi khi dispose geometry — cây giữ mảng riêng, không tự chết theo geometry). */
export function dropBoundsTree(geometry: THREE.BufferGeometry): void {
  const g = geometry as WithBvh;
  if (g.boundsTree && g.disposeBoundsTree) g.disposeBoundsTree();
}
