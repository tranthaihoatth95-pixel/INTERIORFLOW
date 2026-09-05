/**
 * lib/three/tao-khoi-3d.ts — TOÁN THUẦN cho cử chỉ DỰNG KHỐI trong khung nhìn 3D (kéo trên mặt
 * sàn ra tường/hộp/trụ, thay vì mở form gõ số). Tách khỏi `Scene3DViewer.tsx` vì đây là phần DUY
 * NHẤT kiểm được bằng test không cần WebGL — và vì cùng một phép đổi trục bị chép TAY ở 2 nơi là
 * gốc của bệnh lệch hệ toạ độ đã trả giá một lần (xem `onPointerUp` nhánh kéo đèn, nơi phép đổi
 * đó tự viết lại kèm lời đề nghị tách ra — nay tách thật).
 *
 * ⛔ KHÔNG ĐẺ ENGINE THỨ HAI — luật cứng, và đây là chỗ dễ phạm nhất.
 * File này KHÔNG tự sinh entity. Nó chỉ làm hai việc: (a) đổi đơn vị/hình học ở miền mm để VẼ XEM
 * TRƯỚC, (b) dịch một cử chỉ đã chốt sang ĐÚNG lời gọi của `lib/render-studio/tool3d.ts` —
 * `lineBlockEntities` · `rectBlockEntities` · `circleBlockEntities`. `tool3d` là hợp đồng đang
 * chạy (34 test) và bản thân nó đã tái dùng `wallSegmentOutline`/`ellipsePoints` của chặng CAD,
 * rồi phát ra ĐÚNG cặp `hatch`(solid, `elementType:'wall'`, `hostId`→outline) + `polyline`(kín) —
 * đúng thứ `docToObjScene()` lọc ở `wallHatches` (`lib/three/cad-to-obj.ts:579-581`) rồi đùn
 * thành khối. Cử chỉ vì thế là ĐƯỜNG VÀO THỨ HAI cho cùng bộ tool (đường thứ nhất là nhập số ở
 * `Tool3DBar`), không phải một bộ lệnh song song.
 *
 * ⚠️ Vì sao KHÔNG port `duongBaoKhoiDac()` của bản 24/08: hàm đó chép lại y nguyên
 * `polygonBlockEntities()` (private trong `tool3d.ts`) — hai bộ phát entity cho cùng một loại
 * hình là đúng cái luật này cấm. Bỏ nó, đi qua `tool3d`, mất 0 hành vi.
 *
 * ⚠️ HỆ QUẢ ĐÃ BIẾT, KHÔNG GIẤU: `clampWallHeight()` kẹp cao độ vào [2000,6000] mm cho MỌI khối
 * đi qua đường đùn này. Mặt phẳng mỏng và mặt cầu KHÔNG biểu diễn được bằng đường này — không bịa.
 */
import type { Entity, Pt } from '../cad/model';
import { ellipsePoints } from '../cad/geometry';
// `newId` cho `duongBaoKhoiDac` ở cuối tệp. Import TƯƠNG ĐỐI, KHÔNG alias '@/': đây là *value
// import*, sucrase-node sinh require() thật ⇒ alias làm mọi test chạm tệp này gãy lúc nạp.
import { newId } from '../cad/store';
import {
  lineBlockEntities,
  rectBlockEntities,
  circleBlockEntities,
} from '../render-studio/tool3d';

/** Ba cử chỉ dựng khối hiện có. Tên khoá giữ tiếng Anh vì là TÊN LỆNH DỰNG HÌNH (chốt 08/08).
 * Ánh xạ sang tool của `tool3d` (line/rect/circle) nằm ở `Viewport3D` — dock gọi theo HÌNH VẼ,
 * khối dựng ra gọi theo VẬT; cùng một lệnh, hai mặt tiền. */
export type CreateTool3D = 'wall' | 'box' | 'cylinder';

/** Bề dày tường mặc định khi kéo hai điểm — cùng số `FIRST_WALL` của mode Vẽ 3D. */
export const WALL_THICKNESS_MM = 200;
/** Cao độ mặc định của khối vừa kéo (kéo mặt trên để đổi sau — push-pull 3D-5 đã có). */
export const DEFAULT_HEIGHT_MM = 2700;
/** Số cạnh xấp xỉ hình tròn. 32 cạnh: sai số bán kính < 0,5% — mắt không đọc ra ở cỡ nội thất,
 * mà vẫn giữ đa giác đủ nhẹ cho `prism()` + `EdgesGeometry`. */
export const CYLINDER_SIDES = 32;

/** Cạnh nhỏ nhất coi là "đã kéo ra hình" (mm). Dưới ngưỡng này là cú click lỡ tay, không phải
 * hình — ghi vào Doc sẽ đẻ khối 0 chiều không xoá được bằng mắt. */
export const MIN_KICH_THUOC_MM = 20;

/**
 * three (m, Y-lên) → CAD (mm, Y-Bắc). Nghịch đảo `cadAxesToThree` (`cad-to-obj.ts`):
 * `y_cad = -z_three`, `z_cad = y_three`.
 */
export function threeMToCadMm(p: { x: number; y: number; z: number }): { x: number; y: number; z: number } {
  return { x: Math.round(p.x * 1000), y: Math.round(-p.z * 1000), z: Math.round(p.y * 1000) };
}

/** Hình chữ nhật thẳng trục từ hai góc đối (mm CAD), thứ tự ổn định bắt đầu từ góc (min,min).
 * Dùng CHUNG cho đường xem trước và cho việc quy hai góc kéo về `(góc, w, d)` mà
 * `rectBlockEntities` nhận — xem trước và kết quả không thể lệch nhau. */
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

/** Đa giác đều nội tiếp đường tròn — chỉ để VẼ XEM TRƯỚC ở miền mm nguyên.
 * Ruột là `ellipsePoints` của chặng CAD (rx=ry), không tự viết vòng lượng giác thứ hai; chỉ thêm
 * làm tròn về mm. Sai lệch với đường ghi thật (`circleBlockEntities` gọi thẳng `ellipsePoints`,
 * KHÔNG làm tròn) < 0,5 mm — dưới ngưỡng nhìn thấy, và cố ý: Doc nên nhận số nguyên mm. */
export function daGiacDeuMm(tam: Pt, banKinhMm: number, soCanh = CYLINDER_SIDES): Pt[] {
  const r = Math.max(1, banKinhMm);
  const n = Math.max(3, Math.round(soCanh));
  return ellipsePoints(tam, r, r, n).map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) }));
}

/** Đủ lớn để ghi vào Doc chưa? Dùng chung cho cả 3 cử chỉ (caller đưa 2 cạnh, hoặc chiều dài,
 * hoặc bán kính). */
export function duLonDeGhi(...canhMm: number[]): boolean {
  return canhMm.every((c) => Math.abs(c) >= MIN_KICH_THUOC_MM);
}

/**
 * Kết quả MỘT cử chỉ dựng đã chốt, hệ CAD (mm). Union phân biệt theo `tool`, và mỗi nhánh mang
 * ĐÚNG bộ tham số mà hàm tương ứng của `tool3d` cần — cố ý KHÔNG mang sẵn đa giác đáy, vì mang
 * đa giác thì nơi nhận buộc phải có một bộ phát entity riêng cho đa giác (= engine thứ hai).
 */
export type CreateSolidPayload =
  | { tool: 'wall'; aMm: Pt; bMm: Pt; thicknessMm: number; heightMm: number }
  | { tool: 'box'; aMm: Pt; bMm: Pt; heightMm: number }
  | { tool: 'cylinder'; centerMm: Pt; radiusMm: number; heightMm: number };

/**
 * Cử chỉ đã chốt → Entity[] sẵn sàng cho `useCadStore.addEntities` (vào lịch sử ⇒ Ctrl+Z lùi
 * được, KS4). KHÔNG ghi Doc ở đây — luật một nguồn, nơi gọi ghi.
 *
 * Toàn bộ thân hàm là ba lời gọi sang `tool3d`. Đó là điểm của file này: cử chỉ và nhập số cùng
 * đổ về MỘT bộ hàm dựng, nên không thể có chuyện kéo tay ra một loại khối còn gõ số ra loại khác.
 */
export function entityTuCuChi(p: CreateSolidPayload, layer: string): Entity[] {
  const o = { heightMm: p.heightMm, layer };
  if (p.tool === 'wall') return lineBlockEntities(p.aMm, p.bMm, p.thicknessMm, o);
  if (p.tool === 'box') {
    const [goc, , cheo] = hinhChuNhatMm(p.aMm, p.bMm);
    return rectBlockEntities(goc, cheo.x - goc.x, cheo.y - goc.y, o);
  }
  return circleBlockEntities(p.centerMm, p.radiusMm, o, CYLINDER_SIDES);
}

/* ══════════════════════════════════════════════════════════════════════════════════════════════
 * HOÀ NHÁNH 05/09 — `duongBaoKhoiDac` GIỮ LẠI CÓ ĐIỀU KIỆN, KHÔNG PHẢI GIỮ MÙ
 * Nhánh integration cố ý BỎ hàm này, lý do ghi ở đầu tệp: nó chép lại `polygonBlockEntities()`
 * (private trong `tool3d.ts`) ⇒ hai bộ phát entity cho cùng một loại hình. Lý do đó ĐÚNG.
 * Nhưng ở thời điểm hoà, `components/three/Viewport3D.tsx:175` VẪN gọi nó (tệp đó còn đang dở ở
 * làn khác), nên bỏ bây giờ là gãy bản dựng. Giữ lại để hoà nhánh không làm hỏng việc ai.
 * ⇒ VIỆC CÒN NỢ: khi `Viewport3D.tsx` chốt xong đường `entityTuCuChi`, XOÁ hàm này. Nó không có
 *   người gọi nào khác, và `tao-khoi-3d.test.ts` KHÔNG kiểm nó.
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 */

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
