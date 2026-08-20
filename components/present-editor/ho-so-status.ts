/**
 * components/present-editor/ho-so-status.ts — cờ "hồ sơ đang mở ĐÃ CÓ TRANG chưa" dùng chung.
 *
 * VÌ SAO CẦN (đo 20/08 trên app thật, tiền cảnh): `PresentNavigator` mount ở
 * `PresentStageScreen`, là ANH EM của `PresentSheets` — nó không thấy `deck`/`slides` vốn sống
 * sâu trong `PresentSheets`. Nên nó in chỉ dẫn *"Chuyển trang ở dải thumbnail dưới canvas"*
 * kể cả khi màn giữa đang là THƯ VIỆN MẪU và **chưa có canvas nào**: chỉ dẫn trỏ vào hư không.
 *
 * ⛔ KHÔNG mở cơ chế mới (**[Đ2]** · NO-REBUILD §B25): đây là **đúng khuôn**
 * `lib/present-editor/play-status.ts` đã dùng cho ca y hệt (cờ `playing` để StatusBar ngoài
 * `PresentEditor` đọc được). Một cờ, một `set`, không state-lift xuyên nhiều lớp.
 *
 * `null` = CHƯA BIẾT (chưa hydrate) ⇒ nơi đọc giữ nguyên câu cũ, không đoán hộ.
 */

import { create } from 'zustand';

interface HoSoStatusState {
  /** `true` = hồ sơ đang mở có ít nhất một trang · `false` = đang ở thư viện mẫu · `null` = chưa biết. */
  coHoSo: boolean | null;
  setCoHoSo: (v: boolean | null) => void;
}

export const useHoSoStatus = create<HoSoStatusState>((set) => ({
  coHoSo: null,
  setCoHoSo: (coHoSo) => set({ coHoSo }),
}));
