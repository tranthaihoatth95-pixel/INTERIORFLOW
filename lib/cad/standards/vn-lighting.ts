/**
 * lib/cad/standards/vn-lighting.ts — DỮ LIỆU TĨNH tham khảo chiếu sáng, KHÔNG PHẢI lux
 * calculator. Không có bất kỳ logic đo/tính lux nào ở đây hay nối vào checker.ts — đây chỉ là
 * mục registry để tra cứu sau này khi (nếu) nhóm E (MEP — điện/chiếu sáng) được build.
 *
 * CẢNH BÁO NGUỒN (đọc kỹ trước khi dùng — bắt buộc theo yêu cầu chủ dự án 2026-07-15): TCVN
 * 7114-1:2008 là tiêu chuẩn chiếu sáng cho NƠI LÀM VIỆC (workplace), KHÔNG PHẢI tiêu chuẩn nhà
 * ở. Số liệu lux nhà ở ở đây (150–300 lux phòng khách) là mức THỰC HÀNH PHỔ BIẾN tham khảo quốc
 * tế, KHÔNG phải trích nguyên văn từ bảng gốc TCVN 7114-1:2008. Ghi rõ để tránh nhầm lẫn nếu sau
 * này có audit pháp lý dẫn nhầm nguồn.
 */
import type { RuleGroup } from './registry';

export const VN_LIGHTING: RuleGroup = {
  id: 'vn-lighting',
  name: 'Tham khảo chiếu sáng (thông tin, không phải calculator)',
  rules: [
    {
      id: 'vn-lighting-living-room-lux-reference',
      source: 'Thực hành phổ biến quốc tế (tham khảo) — KHÔNG phải trích TCVN 7114-1:2008',
      category: 'other',
      severity: 'info',
      region: 'VN',
      binding: 'advisory',
      description: 'Phòng khách: độ rọi tham khảo khoảng 150–300 lux (thực hành phổ biến, không phải trích nguyên văn từ TCVN 7114-1:2008).',
      params: { minLux: 150, maxLux: 300 },
      verified: false,
      note: 'TCVN 7114-1:2008 là tiêu chuẩn chiếu sáng cho NƠI LÀM VIỆC (workplace), KHÔNG PHẢI tiêu chuẩn nhà ở. Số liệu lux nhà ở ở đây (150-300 lux phòng khách) là mức THỰC HÀNH PHỔ BIẾN tham khảo quốc tế, KHÔNG phải trích nguyên văn từ bảng gốc TCVN 7114-1:2008. Ghi rõ để tránh nhầm lẫn nếu sau này có audit pháp lý dẫn nhầm nguồn. Đây CHỈ là dữ liệu tra cứu — KHÔNG có logic đo/tính lux nào trong checker.ts, không nối vào checkStandards().',
    },
  ],
};
