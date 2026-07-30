/**
 * lib/cad/safe-area.ts — 2.1.8.l (30/07): NGUỒN DUY NHẤT khai vùng canvas bị các dock nổi
 * (floating) che, để mọi thứ vẽ/đặt đè lên canvas CAD đọc từ đây thay vì tự đoán số cứng.
 *
 * Lý do tồn tại — đã né dock BẰNG SỐ CỨNG 3 LẦN trước khi có luật này, xác nhận toạ độ thật:
 *   `CadEditor.tsx:899` — panel Khung tên `maxHeight: calc(100% - 130px)`.
 *   `CadEditor.tsx:1969` — panel chọn (BIM/ShapeInfo) `bottom: 110` (thay "46 cũ" — đã né 2 lần).
 *   `CadCanvas.tsx:2949` — chữ toạ độ vẽ trên canvas, đè lên `CadTouchDock` ở góc dưới-trái
 *     (Sketch), xoá hẳn thay vì né — xem lib/cad/live-status.ts, StatusBar đã hiện cùng số liệu.
 * Mỗi lần là DỜI THỨ KHÁC ra khỏi đường đi của dock thay vì cho thứ khác BIẾT dock chiếm chỗ
 * nào. Số cứng không tự cập nhật khi dock đổi kích thước → vỡ lại ngay khi `CadTouchDock.tsx`
 * đổi layout (thêm/bớt nút, đổi padding…). File này khai 1 hàm — dock đổi kích thước thì SỬA
 * Ở ĐÂY, mọi nơi gọi hàm tự đúng theo, không phải sửa lại từng chỗ.
 */

import type { CadMode } from './store';

/** Khớp `CadTouchDock.tsx`: `TOUCH_MIN=44` (chiều cao nút) + `padding:5` 2 cạnh trên/dưới. */
const DOCK_HEIGHT = 44 + 5 * 2;
/** Khớp `CadTouchDock.tsx`: `left:14, bottom:14` — khoảng cách dock cách 2 mép màn. */
const DOCK_OFFSET = 14;
/** Khoảng hở thêm GIỮA mép trên dock và nội dung phía trên nó — thuần thẩm mỹ, không phải kích
 * thước dock (2 con số trên MỚI là kích thước thật, cái này là "thở" thêm bạn yêu cầu). */
const BREATHING_GAP = 14;

export interface SafeAreaInsets {
  left: number;
  bottom: number;
}

/**
 * Inset (px) mà canvas CAD bị các dock nổi hiện đang mount chiếm mất, theo `cadMode`.
 * `CadTouchDock` CHỈ mount khi `cadMode==='sketch'` (xem `CadTouchDock.tsx`: `if (cadMode !==
 * 'sketch') return null`) — Pro không có dock này nên trả về 0, không có gì phải né.
 */
export function canvasSafeAreaInsets(cadMode: CadMode): SafeAreaInsets {
  if (cadMode !== 'sketch') return { left: 0, bottom: 0 };
  return { left: 0, bottom: DOCK_OFFSET + DOCK_HEIGHT + BREATHING_GAP };
}
