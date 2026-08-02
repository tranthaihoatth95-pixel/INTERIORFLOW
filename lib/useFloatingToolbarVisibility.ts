'use client';

/**
 * lib/useFloatingToolbarVisibility.ts — nguyên liệu dùng CHUNG cho thanh công cụ nổi bám theo
 * phần tử đang chọn (mã `2.2.91`, `docs/IF-FEATURE-TREE.md`). Trước hook này, `TextToolbar.tsx`
 * (Present) không tự thu khi kéo — bám theo con trỏ và ĐÈ lên vùng đang thao tác (Hoà phát hiện
 * khi xem ảnh chụp lúc verify roundtrip 4.1.b/B2). Vá thẳng trong TextToolbar.tsx là SAI PHẠM VI
 * (spec bắt buộc "sửa ở TẦNG NGUYÊN LIỆU dùng chung... KHÔNG vá riêng") — CAD/Render tự dựng
 * toolbar-nổi-theo-selection tương tự sau này sẽ dính lại đúng lỗi này lần nữa nếu không có hook
 * chung. Nơi gọi: `EditorCanvas.tsx` (Present, ĐANG DÙNG) — hiện diện tại CHỈ có ở Present, CAD/
 * Render CHƯA xác nhận có toolbar-nổi tương tự nào khác cần gộp (ghi rõ trong spec gốc).
 *
 * BA TRẠNG THÁI bắt buộc (đã chọn+đứng yên → hiện đủ / đang kéo (di chuyển HOẶC resize-handle)
 * → thu lại / vừa thả → bung lại + tính lại vị trí) do NƠI GỌI lắp ráp bằng 2 mảnh hook này trả
 * về (`hidden`, `pos`) + tự đo ngưỡng ~4px trước khi coi là "đang kéo" (xem
 * `Element.tsx#onPointerMove`, ngưỡng đo bằng PIXEL con trỏ thật — bấm để CHỌN không bao giờ
 * chớp tắt thanh, vì ẩn NGAY từ pointerdown là sai theo đúng phát hiện gốc của Hoà).
 *
 * `hidden`: đi thẳng theo `dragging` — KHÔNG debounce bằng setTimeout. Cảm giác "mờ đi ~80ms /
 * hiện lại ~150ms CÓ TRỄ NHẸ" nằm ở CSS `transition` phía component gọi (đổi thời lượng theo
 * hướng ẩn/hiện), không phải độ trễ trước khi state đổi — trễ TRƯỚC khi đổi state (debounce) sẽ
 * làm thanh phản ứng chậm ngay lúc BẮT ĐẦU kéo (cảm giác ì), còn opacity chuyển ÊM qua CSS mới
 * là thứ triệt "nhấp nháy" khi tay rung dao động quanh ngưỡng 4px (mỗi lần dao động chỉ đổi
 * target opacity, transition đang chạy dở tự nối tiếp mượt — không có bước nhảy giật cục nào để
 * mắt bắt được là "nhấp nháy").
 *
 * `pos`: ĐÓNG BĂNG vị trí trong lúc `dragging === true`, chỉ đồng bộ lại theo `livePos` khi
 * `dragging === false` — bao gồm CẢ lúc "đứng yên" (mỗi render đều đồng bộ, không có gì đổi so
 * với trước hook này) LẪN đúng thời điểm `dragging` vừa chuyển true→false ("vừa thả" — effect
 * chạy lại vì `dragging` đổi, bắt được `livePos` MỚI NHẤT tại thời điểm đó). Giải quyết đúng chi
 * tiết bắt buộc "tính lại vị trí CHỈ lúc THẢ, không phải mỗi khung hình lúc đang kéo" — trước đây
 * `EditorCanvas.tsx` tính `leftPct/topPct/below` thẳng từ `soleTextEl.frame` mỗi lần render, mà
 * `onFrame(f, true)` gọi live trên MỌI `pointermove` → vị trí thanh giật theo từng khung hình.
 */

import { useEffect, useState } from 'react';

export function useFloatingToolbarVisibility<T>(
  dragging: boolean,
  livePos: T,
): { hidden: boolean; pos: T } {
  const [pos, setPos] = useState<T>(livePos);

  useEffect(() => {
    if (!dragging) setPos(livePos);
    // Cố ý CHỈ theo [dragging, livePos] — không thêm setPos (setter ổn định, React đảm bảo).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, livePos]);

  return { hidden: dragging, pos };
}
