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
import { chieuHopUv } from './uv-chieu-hop';

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
// Bỏ `uv` khỏi danh sách attribute Evaluator mang theo (mặc định là ['position','uv','normal']).
//
// 🔴 ĐÍNH CHÍNH 05/09 (V8c) — LÝ DO CŨ ĐÃ HẾT HIỆU LỰC, LÝ DO MỚI MẠNH HƠN. Lý do cũ ghi ở đây là
// *"hình học của app KHÔNG có `uv` nên `initFromGeometry` crash"*; từ bước 1 của V8c thì `geometryOf`
// LUÔN gắn `uv`, nên lập luận đó không còn đúng. Vẫn giữ nguyên dòng này, vì lý do KHÁC:
// CSG cắt ra MẶT MỚI (lòng hố cửa/cửa sổ) mà mặt mới đó vuông góc với trục KHÁC hẳn mặt gốc. Bảo
// Evaluator nội suy `uv` của mặt gốc sang mặt mới là dán vân theo phép chiếu của một mặt khác ⇒
// vân trên má cửa bị kéo thành vệt. Đúng cách là CHIẾU LẠI theo pháp tuyến THẬT của từng tam giác
// sau khi cắt — đúng việc `boxUvSauBoolean` dưới làm.
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
  return boxUvSauBoolean(result.geometry);
}

/**
 * Gắn lại `uv` chiếu hộp cho hình học VỪA RA KHỎI CSG. **Đây là cái bịt lỗ, không phải trang trí**:
 * mọi bức tường có cửa/cửa sổ đều đi qua `booleanOp`, và trước dòng này kết quả CSG không mang `uv`
 * ⇒ đúng những bức tường người ta nhìn nhiều nhất sẽ phẳng lì một màu trong khi tường đặc thì có
 * vân — hỏng lệch nhau, khó lần ra hơn hẳn hỏng đều.
 *
 * Vì phép chiếu chỉ phụ thuộc TOẠ ĐỘ THẾ GIỚI, mảng tường sau khi khoét vẫn khớp vân liền mạch với
 * chính nó trước khi khoét và với tường bên cạnh.
 *
 * Hình học có `index` thì phải rã ra không-chỉ-mục trước: một đỉnh dùng chung giữa hai mặt vuông góc
 * hai trục khác nhau **không thể** mang hai `uv`. Ba đường của app hiện đều không chỉ mục nên nhánh
 * này thường không chạy — giữ để không lặng lẽ sai nếu thư viện CSG đổi cách xuất.
 */
function boxUvSauBoolean(g: THREE.BufferGeometry): THREE.BufferGeometry {
  const phang = g.index ? g.toNonIndexed() : g;
  if (phang !== g) g.dispose();
  const pos = phang.getAttribute('position');
  if (!pos) return phang;
  phang.setAttribute('uv', new THREE.BufferAttribute(chieuHopUv(pos.array as ArrayLike<number>), 2));
  return phang;
}
