/**
 * lib/cad/standards/intl-egress.ts — Thoát nạn quốc tế cơ bản (NFPA 101 Life Safety Code / IBC
 * Chapter 10 Means of Egress) — dùng khi dự án tham chiếu chuẩn quốc tế thay vì QCVN VN. Số
 * liệu tra cứu qua tìm kiếm web 2026-07-11 (nguồn: up.codes, codes.iccsafe.org — bản tóm tắt,
 * không phải bản đầy đủ IBC/NFPA có phí) — đối chiếu bản đầy đủ trước khi dùng cho hồ sơ chính
 * thức ở khu vực áp dụng NFPA/IBC.
 */
import type { RuleGroup } from './registry';

export const INTL_EGRESS: RuleGroup = {
  id: 'intl-egress',
  name: 'Thoát nạn quốc tế (NFPA 101 / IBC)',
  rules: [
    {
      id: 'intl-egress-min-width-general',
      source: 'IBC Chapter 10 (Means of Egress) — tương tự NFPA 101',
      category: 'egress',
      severity: 'error',
      description: 'Chiều rộng lối thoát nạn tối thiểu chung: 44 inch (≈1118mm), TRỪ khi tải trọng người sử dụng (occupant load) < 50 người thì tối thiểu 36 inch (≈914mm).',
      params: { minWidthMmGeneral: 1118, minWidthMmUnder50Occupants: 914, occupantThreshold: 50 },
      verified: true,
      note: 'Tra qua tổng hợp web (up.codes, codes.iccsafe.org) — đây là bản tóm tắt phổ biến của IBC 2018 Chapter 10, đối chiếu bản đầy đủ IBC/NFPA 101 áp dụng tại địa phương trước khi dùng cho hồ sơ chính thức.',
    },
    {
      id: 'intl-egress-max-door-width',
      source: 'IBC Chapter 10',
      category: 'door-window',
      severity: 'warning',
      description: 'Cửa trên lối thoát nạn không được rộng quá 48 inch (≈1219mm) mỗi cánh.',
      params: { maxWidthMm: 1219 },
      verified: true,
      note: 'Tra qua tổng hợp web — đối chiếu bản đầy đủ trước khi dùng chính thức.',
    },
    {
      id: 'intl-egress-door-swing-encroachment',
      source: 'IBC Chapter 10',
      category: 'door-window',
      severity: 'info',
      description: 'Khi cửa mở hết cỡ, cánh cửa không được làm giảm chiều rộng lối thoát nạn yêu cầu quá 7 inch (≈178mm), và không giảm quá 1/2 chiều rộng tại bất kỳ điểm nào trong quá trình mở.',
      params: { maxEncroachmentMm: 178, maxEncroachmentRatio: 0.5 },
      verified: true,
      note: 'Tra qua tổng hợp web — checker hiện CHƯA mô phỏng hình học cung mở cửa để tự động kiểm rule này (mới chỉ có warning định tính), để dành cho bản nâng cấp sau.',
    },
  ],
};
