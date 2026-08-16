/**
 * lib/units/scale.ts — MARKER SCALE_CHUAN
 *
 * Dãy tỉ lệ chuẩn ISO cấp app (Phiếu P-A). TÁI DÙNG `PRINT_SCALE_STEPS` đã có ở `lib/cad/model.ts`
 * (việc `ty-le-chuan`, kiểm ở `docs/CHUAN-DAU-RA-NGHE.md` §1: 1:1·1:2·1:5·1:10·1:20·1:25·1:50·
 * 1:100·1:200·1:500) — KHÔNG định nghĩa dãy số thứ hai. Đúng luật [Đ2] "nhìn vào trong trước,
 * cấm đẻ khuôn mới", và tránh đúng bệnh "5 sổ lệnh song song" mà `docs/00-CHOT.md` 15/08 ghi lại
 * (nhiều nơi tự khai cùng một danh sách rồi phân kỳ âm thầm).
 *
 * KHÔNG đụng `lib/cad/model.ts` (ngoài vùng file ③ của phiếu) — file này chỉ IMPORT export sẵn có.
 */

import { PRINT_SCALE_STEPS, isStandardPrintScale, snapPrintScale } from '../cad/model';

/** MARKER SCALE_CHUAN — dãy tỉ lệ in chuẩn, N của "1:N", TĂNG DẦN. */
export const SCALE_CHUAN: readonly number[] = PRINT_SCALE_STEPS;

/** N có phải một nấc tỉ lệ chuẩn không — cấm chọn/lưu tỉ lệ lẻ kiểu "1:47". */
export function isValidScale(n: number): boolean {
  return isStandardPrintScale(n);
}

/**
 * Chọn tỉ lệ CHUẨN gần nhất cho một N thô (vd từ auto-fit khổ giấy) — bắt về nấc phía NHỎ HƠN
 * (N chuẩn lớn hơn hoặc bằng), cùng hành vi `snapPrintScale` đã kiểm ở cổng xuất PDF
 * (`lib/print/export-checks.ts`) để KHÔNG có hai quy tắc "làm tròn tỉ lệ" khác nhau trong app.
 */
export function chooseNearestScale(n: number): number {
  return snapPrintScale(n);
}

/** Định dạng hiển thị chuẩn "1:N". */
export function formatScale(n: number): string {
  return `1:${n}`;
}
