/**
 * lib/cad/id.ts — SINH ID ENTITY. Module LÁ: không import gì, không chạm biến trình duyệt.
 *
 * VÌ SAO TÁCH RA KHỎI `store.ts` (30/08, lane 06): `newId` vốn nằm trong `store.ts`, mà
 * `commands.ts` (`wallSegmentOutline`) lại cần nó. Khi bật cờ `NEXT_PUBLIC_IF_TUONG_HINH_HOC`,
 * `dxf-worker.ts` gọi `apDungTuongHinhHoc` → `tuong-hinh-hoc.ts` → `commands.ts` → `store.ts`,
 * tức KÉO CẢ STORE VÀO WEB WORKER. Trong dev, Next tiêm mã React Refresh vào module client và
 * mã đó chạm `window` ở phạm vi module — Worker không có `window` ⇒
 * `ReferenceError: window is not defined`, worker chết im, người dùng chỉ thấy nạp mãi không xong.
 * (Bắt được bằng stack thật từ `worker.onerror`, không phải đoán: store.ts, dòng biên dịch 894.)
 *
 * ⚠️ Guard `typeof window !== 'undefined'` trong `store.ts` KHÔNG cứu được ca này — thứ chạm
 * `window` là mã do trình biên dịch tiêm vào, không phải mã mình viết. Cách chữa đúng là ĐỪNG
 * để worker phụ thuộc module client, chứ không phải guard thêm.
 *
 * `store.ts` re-export lại `newId` từ đây nên 60 nơi gọi cũ không phải sửa một dòng nào.
 */

let seq = 0;

/**
 * Id entity mới. Dạng `<tiền tố>-<số thứ tự>-<4 ký tự ngẫu nhiên>`.
 * Bộ đếm là cục bộ theo MODULE, nên luồng chính và worker đếm riêng — phần ngẫu nhiên ở đuôi lo
 * chuyện không trùng, đúng như hành vi vốn có từ trước khi tách.
 */
export function newId(prefix = 'e'): string {
  seq += 1;
  return `${prefix}-${seq}-${Math.random().toString(36).slice(2, 6)}`;
}
