/**
 * lib/three/csg.ts — CỔNG DUY NHẤT gọi `three-bvh-csg` (NC-12 §1.6: thư viện còn bản 0.0.x, tác
 * giả chưa tuyên bố API ổn định — cô lập rủi ro vào ĐÚNG 1 file, cùng khuôn `lib/cad/dwg-worker.ts`
 * đã làm đúng với libredwg trước đây). Đổi thư viện CSG sau này (`manifold-3d` — phương án B, xem
 * NC-12 §1.6) = sửa đúng file này.
 *
 * Import `three`/`three-bvh-csg` TĨNH — chỉ an toàn vì nơi gọi (`build-ops.ts` →
 * `obj-scene-to-geometry.ts` → `Scene3DViewer.tsx`) luôn ở nhánh `next/dynamic(ssr:false)`, đúng
 * cảnh báo đã ghi ở đầu `obj-scene-to-geometry.ts` — KHÔNG import file này từ code tải khi mở app.
 *
 * `three-bvh-csg` KHÔNG đòi mesh watertight (lý do số 1 chọn nó ở NC-12 §1.3 — hình IF vẽ tay
 * không bảo đảm kín khối, khác `manifold-3d` sẽ ném lỗi "Not manifold" ngay trên dữ liệu thật).
 */
import * as THREE from 'three';
import { Brush, Evaluator, ADDITION, SUBTRACTION, INTERSECTION } from 'three-bvh-csg';

export type BooleanKind = 'union' | 'subtract' | 'intersect';

// `CSGOperation` (khai `enum{}` rỗng trong .d.ts của thư viện) chỉ dùng để định type — lấy kiểu
// qua `typeof ADDITION` thay vì import tên `CSGOperation` (tránh phụ thuộc 1 khai báo enum rỗng
// khó đọc, cùng giá trị runtime).
type CSGOp = typeof ADDITION;

const OP_OF: Record<BooleanKind, CSGOp> = { union: ADDITION, subtract: SUBTRACTION, intersect: INTERSECTION };

// 1 Evaluator dùng lại cho mọi phép — NC-12 §1.2 đo `useGroups=true` giữ material theo 2 nguồn
// (khối gốc/mặt mới cắt), không có state nào khác cần tách riêng giữa các lần gọi.
const evaluator = new Evaluator();
evaluator.useGroups = true;
// Bỏ `uv` khỏi danh sách attribute bắt buộc (mặc định của Evaluator là ['position','uv','normal']):
// hình học của app (tam-giác-hoá thẳng từ `cad-to-obj.ts`, vật liệu màu phẳng không texture) KHÔNG
// có `uv` — `GeometryBuilder.initFromGeometry` đọc thẳng `geometry.attributes[key].array` không
// guard `undefined`, thiếu `uv` là crash cứng ("Cannot read properties of undefined"). App không
// cần UV (không PBR/texture ở tầng preview này, xem `SPEC-3D-CORE.md` §6 "xám trơn không PBR").
evaluator.attributes = ['position', 'normal'];

/**
 * Trừ/hợp/giao 2 hình học (mm hay m đều được — thuần hình học, không quy đổi đơn vị, không di
 * chuyển `a`/`b`: cả hai phải đã ở CÙNG một hệ toạ độ trước khi gọi). Trả `BufferGeometry` MỚI,
 * không sửa `a`/`b` tại chỗ (Evaluator tự nhân bản attribute vào brush kết quả).
 */
export function booleanOp(a: THREE.BufferGeometry, b: THREE.BufferGeometry, kind: BooleanKind): THREE.BufferGeometry {
  const brushA = new Brush(a);
  const brushB = new Brush(b);
  const result = evaluator.evaluate(brushA, brushB, OP_OF[kind]);
  return result.geometry;
}
