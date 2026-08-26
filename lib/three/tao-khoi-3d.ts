/**
 * lib/three/tao-khoi-3d.ts — TOÁN THUẦN cho cử chỉ DỰNG KHỐI trong khung nhìn 3D (kéo-thả tại chỗ
 * thay vì mở form gõ số). Tách khỏi `Scene3DViewer.tsx` vì đây là phần DUY NHẤT kiểm được bằng
 * test không cần WebGL — và vì cùng một phép đổi trục bị chép tay ở 2 nơi là gốc của bệnh lệch
 * hệ toạ độ đã trả giá một lần (xem chú thích 03/08 trong `Scene3DViewer.tsx`).
 *
 * ⛔ KHÔNG đẻ cách biểu diễn hình học thứ hai. Khối đặc trong IF chỉ có MỘT dạng duy nhất:
 * `hatch` tô đặc `elementType:'wall'` (đường bao) + `polyline` kín cùng điểm + `heightMm` — đúng
 * thứ `docToObjScene()` lọc ở `wallHatches` (`lib/three/cad-to-obj.ts:579`) rồi `prism()` lên
 * khối, và đúng thứ `buildMassingWalls()` biến thành mesh chọn/kéo-đẩy được. Hộp và trụ ở đây
 * KHÁC TƯỜNG ĐÚNG MỘT CHỖ: cách sinh ra đa giác đáy. Không có engine khối thứ hai.
 *
 * ⚠️ HỆ QUẢ ĐÃ BIẾT, KHÔNG GIẤU: `clampWallHeight()` kẹp cao độ vào [2000,6000] mm cho MỌI khối đi
 * qua đường này. Vì vậy cử chỉ kéo cao ở đây cũng kẹp đúng dải đó — thà kéo tới đâu ra tới đó, còn
 * hơn ghi 500mm vào Doc rồi màn hình dựng 2000mm (nói dối người dùng). Mặt phẳng mỏng và mặt cầu
 * KHÔNG biểu diễn được bằng đường này — xem báo cáo phiên, không bịa.
 */
import type { Entity, Pt } from '@/lib/cad/model';
import { newId } from '@/lib/cad/store';

/** Ba cử chỉ dựng khối hiện có. Tên khoá giữ tiếng Anh vì là TÊN LỆNH DỰNG HÌNH (chốt 08/08). */
export type CreateTool3D = 'wall' | 'box' | 'cylinder';

/** Bề dày tường mặc định khi vẽ hai điểm — cùng số `FIRST_WALL` của mode Vẽ 3D. */
export const WALL_THICKNESS_MM = 200;
/** Cao độ mặc định của tường vẽ hai điểm (kéo mặt trên để đổi sau). */
export const DEFAULT_HEIGHT_MM = 2700;
/** Số cạnh xấp xỉ hình tròn. 32 cạnh: sai số bán kính < 0,5% — mắt không đọc ra ở cỡ nội thất,
 * mà vẫn giữ đa giác đủ nhẹ cho `prism()` + `EdgesGeometry`. */
export const CYLINDER_SIDES = 32;

/**
 * three (m, Y-lên) → CAD (mm, Y-Bắc). Nghịch đảo `cadAxesToThree` (`cad-to-obj.ts`): `y_cad =
 * -z_three`. Trước bản này phép đổi được chép TAY trong `Scene3DViewer.onPointerUp` kèm chú thích
 * tự đề nghị tách ra — nay tách thật, hai nơi đọc một nguồn.
 */
export function threeMToCadMm(p: { x: number; y: number; z: number }): { x: number; y: number; z: number } {
  return { x: Math.round(p.x * 1000), y: Math.round(-p.z * 1000), z: Math.round(p.y * 1000) };
}

/** Hình chữ nhật thẳng trục từ hai góc đối (mm CAD), chiều kim đồng hồ ổn định. */
export function hinhChuNhatMm(a: Pt, b: Pt): Pt[] {
  const x0 = Math.min(a.x, b.x);
  const x1 = Math.max(a.x, b.x);
  const y0 = Math.min(a.y, b.y);
  const y1 = Math.max(a.y, b.y);
  return [
    { x: x0, y: y0 },
    { x: x1, y: y0 },
    { x: x1, y: y1 },
    { x: x0, y: y1 },
  ];
}

/** Đa giác đều nội tiếp đường tròn — đáy của khối trụ. */
export function daGiacDeuMm(tam: Pt, banKinhMm: number, soCanh = CYLINDER_SIDES): Pt[] {
  const r = Math.max(1, banKinhMm);
  const n = Math.max(3, Math.round(soCanh));
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    out.push({ x: Math.round(tam.x + r * Math.cos(t)), y: Math.round(tam.y + r * Math.sin(t)) });
  }
  return out;
}

/**
 * Đường bao khối đặc → cặp entity `hatch`+`polyline` mà `docToObjScene()` đùn thành khối.
 * CÙNG hình dạng dữ liệu `wallSegmentOutline()` (`lib/cad/commands.ts:106`) sinh ra — chỉ bỏ
 * `wallThicknessMm` vì hộp/trụ không có khái niệm bề dày tường (để lại số bịa ở đó sẽ chảy thẳng
 * vào BOQ). Caller gắn `heightMm` (giống `taoTuongMau`), KHÔNG gắn ở đây để một chỗ quyết cao độ.
 */
export function duongBaoKhoiDac(points: Pt[], layer: string): Entity[] {
  const outlineId = newId('e');
  return [
    { id: newId('e'), type: 'hatch', layer, points, solid: true, elementType: 'wall', hostId: outlineId },
    { id: outlineId, type: 'polyline', layer, points, closed: true, elementType: 'wall' },
  ];
}

/** Cạnh nhỏ nhất coi là "đã kéo ra hình" (mm). Dưới ngưỡng này là cú click lỡ tay, không phải hình
 * — ghi vào Doc sẽ đẻ khối 0 chiều không xoá được bằng mắt. */
export const MIN_KICH_THUOC_MM = 20;

/** Đủ lớn để ghi vào Doc chưa? Dùng chung cho cả 3 cử chỉ (caller đưa 2 cạnh/bán kính). */
export function duLonDeGhi(...canhMm: number[]): boolean {
  return canhMm.every((c) => Math.abs(c) >= MIN_KICH_THUOC_MM);
}
