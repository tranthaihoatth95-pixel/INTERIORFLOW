/**
 * lib/three/section.ts — mặt cắt cho `Scene3DViewer` mode `section` (3D-4, SPEC-3D-CORE.md §2
 * quyết định #5: "Cắt lớp = clippingPlanes có sẵn của three — 0 thuật toán tự viết"). Nền cho
 * chế độ Công trường — cắt lớp (tablet), xem `RANG-BUOC-IF2-CHO-IF1.md` "đích thứ 5".
 *
 * Quy ước GIỮ/CẮT (chọn 1 hướng cố định — chưa có yêu cầu đảo hướng, thêm sau nếu cần): GIỮ phần
 * có toạ độ CAD trên trục đã chọn ≤ `at`, CẮT phần > `at`. VD `axis:'z'` (cao độ) `at:1200` →
 * giữ mọi thứ cao ≤1200mm, cắt trần/tầng trên — đúng cảnh "đứng tại chỗ, nhìn xuống mặt bằng
 * tầng đang đứng" của chế độ Công trường.
 *
 * Hàm THUẦN (chỉ `THREE.Plane`/`Vector3` — toán, không WebGL/DOM) — test được bằng sucrase-node,
 * xem `section.test.ts`.
 */
import * as THREE from 'three';

export interface SectionSpec {
  axis: 'x' | 'y' | 'z';
  /** mm, hệ CAD. */
  at: number;
}

/**
 * `THREE.Plane` cắt tương ứng `spec`, hệ toạ độ three.js (mét, Y-up — CÙNG quy ước
 * `cadAxesToThree()` ở `cad-to-obj.ts`, suy trực tiếp từ đó chứ không phát minh lại):
 *   - `axis:'x'` → three.x GIỮ ≤ at/1000 → normal (-1,0,0), constant = at/1000.
 *   - `axis:'z'` (cao độ CAD) → three.y (= z CAD) GIỮ ≤ at/1000 → normal (0,-1,0), constant = at/1000.
 *   - `axis:'y'` → three.z = -y_CAD, GIỮ y_CAD ≤ at ⟺ three.z ≥ -at/1000 → normal (0,0,1), constant = at/1000.
 * Cả 3 trường hợp `constant = at/1000` — chỉ đổi `normal`, xem test cho chứng minh bằng số.
 */
export function sectionPlane(spec: SectionSpec): THREE.Plane {
  const constant = spec.at / 1000;
  if (spec.axis === 'x') return new THREE.Plane(new THREE.Vector3(-1, 0, 0), constant);
  if (spec.axis === 'z') return new THREE.Plane(new THREE.Vector3(0, -1, 0), constant);
  return new THREE.Plane(new THREE.Vector3(0, 0, 1), constant); // axis 'y'
}
