/**
 * components/studio/cu-chi-nhan-giu.ts — hai mốc thời gian/khoảng cách của cử chỉ "rê vào" và
 * "nhấn giữ", dùng cho khẩu độ Vitals.
 *
 * ⚠️ ĐÂY KHÔNG PHẢI SỐ MỚI. Cả hai đã sống trong app từ trước ở `components/ui/Tooltip.tsx`
 * (:30 `TOOLTIP_DEFAULT_DELAY_MS = 150`, :33 `TOOLTIP_LONG_PRESS_MS = 500`, :37
 * `LONG_PRESS_SLOP_PX = 8`). Phiếu dặn giữ NGUYÊN giá trị 500ms/8px — file này giữ đúng bằng
 * cách **nhập lại** hằng số đã export thay vì chép con số.
 *
 * 🔴 NỢ ĐÃ KHAI, chưa trả: `LONG_PRESS_SLOP_PX` của Tooltip KHÔNG export nên `SLOP_PX` dưới đây
 * là **bản sao con số thứ hai** — đúng họ bệnh "cùng một thứ khai nhiều chỗ" mà `may-soi-dong-dang`
 * sinh ra để bắt. Cách trả nợ đúng (một dòng, thuần thêm): export nó ở `Tooltip.tsx` rồi nhập vào
 * đây, HOẶC dời cả ba sang một kho cử chỉ dùng chung (`lib/gesture/`) cho cả Tooltip lẫn Vitals
 * cùng đọc. Cả hai đường đều nằm NGOÀI vùng ghi của phiếu COHERENCE-SHELL (`components/studio/**`)
 * nên phiên này không tự làm; ghi ra để phiên sau không tưởng đây là số tự chế.
 *
 * Vì sao không dùng thẳng tên `TOOLTIP_*` ở chỗ Vitals: tiền tố nói rõ hằng số đó THUỘC Tooltip,
 * mà khẩu độ Vitals không phải tooltip (bài học 00-CHOT 16/08 — T từng ghi sai đúng chỗ này).
 * Bí danh ở đây đặt lại tên theo CỬ CHỈ, giá trị thì trỏ về một nguồn.
 */

import { TOOLTIP_DEFAULT_DELAY_MS, TOOLTIP_LONG_PRESS_MS } from '@/components/ui/Tooltip';

/** Rê chuột phải DỪNG LẠI bấy nhiêu mới bung — chốt 16/08 "kiểu tai thỏ MacBook": chuột đi
 * ngang qua KHÔNG được kích hoạt. */
export const TRE_RE_VAO_MS = TOOLTIP_DEFAULT_DELAY_MS;

/** Cảm ứng/bút: giữ bấy nhiêu thì bung (tablet không được giấu sau hover). */
export const NHAN_GIU_MS = TOOLTIP_LONG_PRESS_MS;

/** Trượt quá bấy nhiêu px trong lúc giữ = đang CUỘN, không phải đang hỏi → huỷ. */
export const SLOP_PX = 8;
