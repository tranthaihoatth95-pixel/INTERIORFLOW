'use client';

/**
 * lib/nav/lui-an-toan.ts — MỘT lời giải duy nhất cho câu "bấm Quay lại thì đi đâu".
 *
 * ─ BỆNH (đo trên app thật 05/09, `docs/delivery/AUDIT-THAO-TAC-A1.md` A1-01) ─────────────────
 * Tám nút "Quay lại" trong app dùng một trong hai cách, cả hai đều SAI cùng một kiểu:
 *   · `router.back()` trần (notebook · 3 màn settings);
 *   · lá chắn `window.history.length > 1` rồi mới `back()` (colors · ingest · photo · present).
 * `history.length` KHÔNG trả lời được câu ta cần hỏi. Câu ta cần hỏi là *"phía sau tôi có trang
 * NÀO CỦA IF không"*; `history.length` chỉ đếm số ô trong ngăn lịch sử của TAB, kể cả ô của
 * trang ngoài. Đo được: mở tab mới rồi dán thẳng `/projects/default/notebook` cho
 * **`history.length === 2`** (ô `about:blank` + ô vừa mở) ⇒ lá chắn `> 1` **qua**, `back()` chạy,
 * người dùng rơi ra **`about:blank`** — trang trắng, không đường về. Trên `/colors` còn nặng hơn:
 * nó `back()` ngay lúc tải nên dán link là ra trang trắng, không cần bấm gì.
 *
 * ─ LỜI GIẢI: ĐÓNG DẤU CHỈ SỐ CỦA CHÍNH MÌNH VÀO `history.state` ────────────────────────────
 * Mỗi ô lịch sử do IF tạo ra mang thêm `ifIdx` (thứ tự trong chuỗi IF của tài liệu này) và
 * `ifLen` (`history.length` lúc đóng dấu). Ô đầu tiên mang `ifIdx = 0` ⇒ **`ifIdx > 0` mới có
 * đường lui**. Đây không phải sáng chế: Next.js Pages Router lưu đúng một `idx` như vậy.
 *
 * VÌ SAO ĐỌC ĐƯỢC PUSH ↔ RESTORE — đo tại nguồn trong `node_modules/next` (14.2.35):
 *   · `client/components/app-router.js:103` dựng state mới bằng
 *     `{ ...(pushRef.preserveCustomHistoryState ? window.history.state : {}), __NA, tree }`;
 *   · `router-reducer/reducers/navigate-reducer.js:101,219` đặt `preserveCustomHistoryState=false`
 *     ⇒ **điều hướng mới thì key lạ bị BỎ**;
 *   · `router-reducer/reducers/restore-reducer.js:38` đặt `true`
 *     ⇒ **back/forward thì key lạ được GIỮ**.
 *   ⇒ "không thấy dấu" ⇔ ô mới tinh · "thấy dấu" ⇔ ô được khôi phục. Đó là cả cơ chế.
 *
 * PUSH ↔ REPLACE thì Next bỏ dấu như nhau, nên phân biệt bằng `history.length`: đẩy thêm ô thì
 * length TĂNG, đè lên ô cũ thì length GIỮ NGUYÊN.
 *
 * ─ HAI GIỚI HẠN CỐ Ý, ghi ra để phiên sau không tưởng là sót ────────────────────────────────
 * ① **Tải trang cứng làm mất chuỗi.** Biến `truoc` sống trong tài liệu; `window.location.href=…`
 *    hay F5 là tài liệu mới, chuỗi về 0 ⇒ có trang IF phía sau mà ta vẫn báo "không có đường lui"
 *    và đi đường dự phòng. **Chọn có ý thức.** Đường chữa hiển nhiên là `sessionStorage` — và nó
 *    làm CHUYỆN TỆ HƠN: sessionStorage sống suốt tab, nên ai đó rời sang trang ngoài rồi dán một
 *    URL IF mới trong CÙNG tab sẽ mang theo chỉ số cũ ⇒ ta báo "có đường lui" trong khi ô phía
 *    sau là trang ngoài ⇒ **bật ra ngoài app, đúng bệnh đang chữa**. Báo thiếu thì người dùng về
 *    một trang IF có thật; báo thừa thì người dùng ra `about:blank`. Chỉ một chiều sai là chấp
 *    nhận được.
 * ② **`history.length` đụng trần 50 của Chromium.** Ở trần thì đẩy thêm ô cũng không tăng length
 *    ⇒ ta đọc nhầm push thành replace ⇒ chỉ số đứng yên ⇒ lại rơi về "báo thiếu" — cùng chiều an
 *    toàn với ①.
 */

import { useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const KHOA_IDX = 'ifIdx';
const KHOA_LEN = 'ifLen';

export type DauLichSu = { idx: number; len: number };

/** Ô lịch sử ta đang đứng, theo trí nhớ của TÀI LIỆU này. `null` = chưa đứng ở ô IF nào. */
let truoc: DauLichSu | null = null;

/** Chỉ dùng cho test — trả module về trạng thái "tài liệu vừa mở". */
export function _datLaiChuoi(): void {
  truoc = null;
}

/** Chỉ dùng cho test — đọc trí nhớ hiện tại. */
export function _chuoiHienTai(): DauLichSu | null {
  return truoc;
}

/**
 * LÕI THUẦN — tính dấu cho ô lịch sử đang đứng. Không đụng `window`, nên test được bằng node.
 *
 * @param dauCu     `history.state.ifIdx` của ô hiện tại (undefined = ô chưa từng được đóng dấu)
 * @param lenCu     `history.state.ifLen` của ô hiện tại
 * @param truocDo   dấu của ô ta vừa rời khỏi trong CÙNG tài liệu (null = chưa có)
 * @param lenBayGio `window.history.length` lúc này
 */
export function tinhDau(
  dauCu: number | undefined,
  lenCu: number | undefined,
  truocDo: DauLichSu | null,
  lenBayGio: number,
): DauLichSu {
  // (a) Ô đã mang dấu ⇒ nó được back/forward khôi phục. Dấu cũ là sự thật, không tính lại.
  if (typeof dauCu === 'number') {
    return { idx: dauCu, len: typeof lenCu === 'number' ? lenCu : lenBayGio };
  }
  // (b) Ô mới tinh, và tài liệu này chưa từng đứng ở ô IF nào ⇒ đây là ô ĐẦU CHUỖI.
  //     Vào ngang bằng URL rơi đúng nhánh này ⇒ idx 0 ⇒ không có đường lui.
  if (!truocDo) return { idx: 0, len: lenBayGio };
  // (c) Ô mới tinh, đã có ô IF phía trước: length tăng ⇒ ĐẨY THÊM ô ⇒ tiến một bậc;
  //     length giữ nguyên ⇒ ĐÈ LÊN ô cũ (replace) ⇒ đứng nguyên bậc, vì ô phía sau không đổi.
  return { idx: lenBayGio > truocDo.len ? truocDo.idx + 1 : truocDo.idx, len: lenBayGio };
}

/**
 * Đóng dấu ô lịch sử đang đứng. Gọi bao nhiêu lần cũng ra một kết quả (lần hai thấy dấu rồi thì
 * rơi vào nhánh (a)) — cần vậy vì cả vỏ chung lẫn từng màn đều gọi.
 *
 * ⚠️ `history.replaceState` ở đây đi qua bản VÁ của Next (`app-router.js:447`). Ta trải state cũ
 * nên `__NA` còn nguyên, và bản vá thấy `__NA` thì gọi thẳng hàm gốc, KHÔNG đụng tới router —
 * đó là lý do phải MERGE chứ không được thay cả state (thay là mất
 * `__PRIVATE_NEXTJS_INTERNALS_TREE`, gãy điều hướng của Next).
 */
export function ghiDau(): void {
  if (typeof window === 'undefined') return;
  const st = (window.history.state ?? null) as Record<string, unknown> | null;
  const dauCu = typeof st?.[KHOA_IDX] === 'number' ? (st[KHOA_IDX] as number) : undefined;
  const lenCu = typeof st?.[KHOA_LEN] === 'number' ? (st[KHOA_LEN] as number) : undefined;

  const moi = tinhDau(dauCu, lenCu, truoc, window.history.length);
  truoc = moi;

  if (dauCu === moi.idx && lenCu === moi.len) return; // đã đúng, không ghi lại cho đỡ ồn
  try {
    window.history.replaceState({ ...(st ?? {}), [KHOA_IDX]: moi.idx, [KHOA_LEN]: moi.len }, '', window.location.href);
  } catch {
    /* Safari giới hạn số lần replaceState; hỏng thì `truoc` vẫn đúng cho tài liệu này. */
  }
}

/** Phía sau tôi có trang NÀO CỦA IF không? Đọc lúc BẤM, không đọc lúc render. */
export function coDuongLui(): boolean {
  if (typeof window === 'undefined') return false;
  const st = window.history.state as Record<string, unknown> | null;
  const idx = typeof st?.[KHOA_IDX] === 'number' ? (st[KHOA_IDX] as number) : truoc?.idx;
  return typeof idx === 'number' && idx > 0;
}

/**
 * Lui một bậc nếu bậc đó là trang IF; không thì đi đường dự phòng.
 * `day` để trang truyền `router.push`/`router.replace` vào (điều hướng mềm, giữ nguyên state app).
 */
export function luiAnToan(tuyChon: { duPhong?: string; day?: (url: string) => void } = {}): void {
  if (typeof window === 'undefined') return;
  if (coDuongLui()) {
    window.history.back();
    return;
  }
  const duPhong = tuyChon.duPhong ?? '/';
  if (tuyChon.day) tuyChon.day(duPhong);
  else window.location.assign(duPhong);
}

/**
 * Đóng dấu theo vòng đời React. Mount ở vỏ chung (`AppChrome`) để phủ mọi màn có vỏ, và gọi
 * thêm ở từng màn KHÔNG có vỏ (notebook · photo · present · colors) — idempotent nên chồng nhau
 * vô hại.
 *
 * ⚠️ Chỉ theo `pathname`: đổi query trên cùng một đường dẫn không đóng dấu lại. Chưa gặp ca hỏng
 * vì chuyện đó, và `useSearchParams` kéo theo ràng buộc Suspense nên không đổi lấy.
 */
export function useDongDauLichSu(): void {
  const pathname = usePathname();
  useEffect(() => {
    ghiDau();
    // back/forward về CÙNG một đường dẫn thì effect trên không chạy lại ⇒ nghe thẳng popstate.
    const nghe = () => ghiDau();
    window.addEventListener('popstate', nghe);
    return () => window.removeEventListener('popstate', nghe);
  }, [pathname]);
}

/**
 * Nút "Quay lại" của một màn: trả về đúng một hàm để gắn vào `onClick`.
 * @param duPhong đích khi không có đường lui — phải là trang CÓ THẬT và đã có sẵn tại chỗ.
 * @param day     điều hướng mềm (thường là `router.push`); bỏ trống thì tải cứng.
 */
export function useLuiAnToan(duPhong = '/', day?: (url: string) => void): () => void {
  useDongDauLichSu();
  return useCallback(() => luiAnToan({ duPhong, day }), [duPhong, day]);
}
