/**
 * lib/cad/standards/vn-lighting.ts — DỮ LIỆU TĨNH tham khảo chiếu sáng, KHÔNG PHẢI lux
 * calculator. Không có bất kỳ logic đo/tính lux nào ở đây hay nối vào checker.ts — đây chỉ là
 * mục registry để tra cứu sau này khi (nếu) nhóm E (MEP — điện/chiếu sáng) được build.
 *
 * CẢNH BÁO NGUỒN (đọc kỹ trước khi dùng — bắt buộc theo yêu cầu chủ dự án):
 * "TCVN 7114-1:2008 chính thức là tiêu chuẩn nơi làm việc (workplace), không có bảng gốc cho nhà
 * ở dân dụng. Các số liệu phòng khách/phòng ngủ/bếp trong file này là mức thực hành phổ biến
 * ngành chiếu sáng, KHÔNG PHẢI trích dẫn nguyên văn từ văn bản pháp quy. Cần xác minh lại trước
 * khi dùng làm căn cứ pháp lý."
 *
 * Số liệu tổng hợp từ các bài viết ngành chiếu sáng tham chiếu khuyến nghị của IES
 * (Illuminating Engineering Society) cho nhà ở dân dụng, KHÔNG PHẢI trích văn bản gốc IES/TCVN:
 * - superbrightleds.com/blog/residential-recommended-lighting-levels.html
 * - wosenled.com/standard-lux-level-chart
 * - a-square.group/lux-levels-for-buildings
 */
import type { RuleGroup } from './registry';

export const VN_LIGHTING: RuleGroup = {
  id: 'vn-lighting',
  name: 'Tham khảo chiếu sáng (thông tin, không phải calculator)',
  rules: [
    {
      id: 'vn-lighting-living-room-lux-reference',
      source: 'Thực hành phổ biến ngành chiếu sáng (tham chiếu IES, tổng hợp qua blog thứ cấp) — KHÔNG phải trích TCVN 7114-1:2008',
      category: 'other',
      severity: 'info',
      region: 'INTL',
      binding: 'advisory',
      description: 'Phòng khách: độ rọi tham khảo khoảng 150–300 lux (ánh sáng chung/ambient, thực hành phổ biến, không phải trích nguyên văn từ TCVN 7114-1:2008).',
      params: { minLux: 150, maxLux: 300 },
      verified: false,
      note: 'TCVN 7114-1:2008 chính thức là tiêu chuẩn nơi làm việc (workplace), không có bảng gốc cho nhà ở dân dụng. Số liệu phòng khách này là mức thực hành phổ biến ngành chiếu sáng, KHÔNG PHẢI trích dẫn nguyên văn từ văn bản pháp quy. Cần xác minh lại trước khi dùng làm căn cứ pháp lý. Đây CHỈ là dữ liệu tra cứu — KHÔNG có logic đo/tính lux nào trong checker.ts, không nối vào checkStandards().',
    },
    {
      id: 'vn-lighting-bedroom-lux-reference',
      source: 'Thực hành phổ biến ngành chiếu sáng (tham chiếu IES, tổng hợp qua blog thứ cấp) — KHÔNG phải trích TCVN 7114-1:2008',
      category: 'other',
      severity: 'info',
      region: 'INTL',
      binding: 'advisory',
      description: 'Phòng ngủ: độ rọi tham khảo khoảng 100–150 lux (ánh sáng chung/ambient, thực hành phổ biến, không phải trích nguyên văn từ TCVN 7114-1:2008).',
      params: { minLux: 100, maxLux: 150 },
      verified: false,
      note: 'TCVN 7114-1:2008 chính thức là tiêu chuẩn nơi làm việc (workplace), không có bảng gốc cho nhà ở dân dụng. Số liệu phòng ngủ này là mức thực hành phổ biến ngành chiếu sáng, KHÔNG PHẢI trích dẫn nguyên văn từ văn bản pháp quy. Cần xác minh lại trước khi dùng làm căn cứ pháp lý. Đây CHỈ là dữ liệu tra cứu — KHÔNG có logic đo/tính lux nào trong checker.ts, không nối vào checkStandards().',
    },
    {
      id: 'vn-lighting-kitchen-lux-reference',
      source: 'Thực hành phổ biến ngành chiếu sáng (tham chiếu IES, tổng hợp qua blog thứ cấp) — KHÔNG phải trích TCVN 7114-1:2008',
      category: 'other',
      severity: 'info',
      region: 'INTL',
      binding: 'advisory',
      description: 'Bếp: độ rọi tham khảo khoảng 300–500 lux (ánh sáng chung; khu vực nấu/bàn soạn thường cần cao hơn nhờ đèn task riêng — không quy định số liệu task lighting cụ thể ở đây). Thực hành phổ biến, không phải trích nguyên văn từ TCVN 7114-1:2008.',
      params: { minLux: 300, maxLux: 500 },
      verified: false,
      note: 'TCVN 7114-1:2008 chính thức là tiêu chuẩn nơi làm việc (workplace), không có bảng gốc cho nhà ở dân dụng. Số liệu bếp này là mức thực hành phổ biến ngành chiếu sáng, KHÔNG PHẢI trích dẫn nguyên văn từ văn bản pháp quy. Cần xác minh lại trước khi dùng làm căn cứ pháp lý. Đây CHỈ là dữ liệu tra cứu — KHÔNG có logic đo/tính lux nào trong checker.ts, không nối vào checkStandards().',
    },
  ],
};
