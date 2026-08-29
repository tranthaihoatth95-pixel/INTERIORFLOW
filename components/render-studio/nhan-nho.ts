/**
 * NHÃN NHỎ — khuôn chữ dùng chung cho nhãn phụ trong các bảng 3D.
 *
 * VÌ SAO CÓ TỆP NÀY (29/08). Khuôn nhãn nhỏ trước đây được CHÉP TAY qua 9 tệp
 * `components/render-studio/` (~35 dòng), dạng
 * `text-[9px] font-bold uppercase tracking-wide text-[var(--t4)]` cùng các biến thể
 * 9.5 / 10 / 10.5 / 11px. Mọi bản chép đều phạm hai luật chữ Việt cùng lúc:
 *
 *  - **V-1** — `uppercase` trên chuỗi CÓ DẤU. Chữ hoa cao hơn ⇒ hết chỗ đặt dấu thanh,
 *    `Ế Ề Ễ` dính nhau hoặc bị cắt cụt. Nhãn ở đây là chữ Việt thật ("Bề dày", "Cấu tạo
 *    lớp", "Nhiệt màu nắng"), không phải mã kỹ thuật không dấu ⇒ không thuộc ngoại lệ V-7.
 *  - **V-6** — cỡ sàn 12px. Dưới 12px thì dấu hỏi ↔ dấu ngã không phân biệt được.
 *
 * Nhấn mạnh nay bằng **font-weight + màu --t4**, đúng lối luật chỉ ra ("muốn nhấn thì
 * đậm hơn một nấc", không dùng chữ hoa). `tracking-wide` (+0.025em) giữ nguyên: V-3 chỉ
 * cấm letter-spacing ÂM.
 *
 * Sửa khuôn thì sửa Ở ĐÂY, đừng chép thêm bản thứ hai (luật 6 — tái dùng khuôn canonical).
 * Luật nguyên văn: `.claude/skills/if-design/knowledge/typography-vietnamese.md`.
 */
import type { CSSProperties } from 'react';

/** Khuôn nhãn KHÔNG kèm màu — dùng khi chỗ gọi cần màu khác `--t4`. */
export const NHAN_NHO_BASE = 'text-[12px] font-bold leading-[1.6] tracking-wide';

/** Khuôn nhãn đầy đủ (màu `--t4`) — dạng dùng ở hầu hết chỗ gọi. */
export const NHAN_NHO = `${NHAN_NHO_BASE} text-[var(--t4)]`;

/**
 * Bản `style` cho vài chỗ còn viết bằng đối tượng style nội tuyến
 * (`ThanCuaSoNode.tsx`, `SuaCoKiemSoat.tsx`) — cùng một khuôn, khác cách gắn.
 */
export const NHAN_NHO_STYLE: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  lineHeight: 1.6,
  letterSpacing: '.06em',
  color: 'var(--t4)',
};
