/**
 * lib/cad/standards/vn-residential.ts — TCVN/QCVN nhà ở dân dụng Việt Nam (diện tích tối
 * thiểu, tỉ lệ cửa sổ, quy mô căn hộ). Số liệu tra cứu qua tìm kiếm web 2026-07-11 từ nhiều
 * nguồn trích dẫn TCVN 4451:2012 (Nhà ở — Nguyên tắc cơ bản để thiết kế) — CHƯA đọc trực tiếp
 * bản PDF gốc (chỉ tổng hợp qua trang trích dẫn), nên mọi rule verified=true ở đây vẫn nên đối
 * chiếu lại bản gốc TCVN 4451:2012 trước khi dùng cho hồ sơ pháp lý/xin phép chính thức.
 */
import type { RuleGroup } from './registry';

export const VN_RESIDENTIAL: RuleGroup = {
  id: 'vn-residential',
  name: 'Nhà ở dân dụng Việt Nam (TCVN)',
  rules: [
    {
      id: 'vn-res-bedroom-min-area',
      source: 'TCVN 4451:2012 — Nhà ở, Nguyên tắc cơ bản để thiết kế',
      category: 'room-size',
      severity: 'warning',
      description: 'Diện tích sử dụng phòng ngủ trong nhà chung cư không nhỏ hơn 9 m².',
      params: { minAreaM2: 9 },
      verified: true,
      note: 'Tra qua tổng hợp web (nhiều trang trích dẫn TCVN 4451:2012), CHƯA đọc bản PDF gốc trực tiếp — nên đối chiếu lại trước khi dùng cho hồ sơ chính thức.',
    },
    {
      id: 'vn-res-wc-min-area',
      source: 'TCVN 4451:2012 (khuyến nghị)',
      category: 'room-size',
      severity: 'info',
      description: 'Diện tích sử dụng khuyến nghị cho phòng vệ sinh (WC) không nhỏ hơn 2.5 m².',
      params: { minAreaM2: 2.5 },
      verified: true,
      note: 'Tra qua tổng hợp web, là mức KHUYẾN NGHỊ (không phải bắt buộc cứng) theo các trang trích dẫn — đối chiếu bản gốc trước khi áp dụng như quy định bắt buộc.',
    },
    {
      id: 'vn-res-kitchen-dining-min-area',
      source: 'TCVN 4451:2012 (khuyến nghị)',
      category: 'room-size',
      severity: 'info',
      description: 'Diện tích sử dụng khuyến nghị cho khu bếp + ăn KHÔNG TÁCH RỜI không nhỏ hơn 10 m² (nếu bếp và ăn là 2 khu riêng biệt, quy chuẩn này không áp dụng nguyên trạng — cần cộng gộp diện tích 2 khu để so sánh).',
      params: { minAreaM2: 10 },
      verified: true,
      note: 'Mức khuyến nghị, tra qua tổng hợp web — đối chiếu bản gốc trước khi dùng chính thức. Checker cộng diện tích phòng "BẾP" + phòng "ĂN"/phần ăn trong "KHÁCH" nếu tách tên riêng được.',
    },
    {
      id: 'vn-res-window-floor-ratio',
      source: 'TCVN 4451:2012',
      category: 'other',
      severity: 'info',
      description: 'Tỉ lệ diện tích cửa sổ lấy sáng / diện tích sàn phòng khách & bếp: tối thiểu khoảng 1:8, không cần vượt quá 1:5 (chỉ số tham khảo, chưa đo tự động được từ hình học cửa sổ hiện tại).',
      params: { minRatioDenominator: 8, maxRatioDenominator: 5 },
      verified: true,
      note: 'Chưa có cơ chế đo diện tích kính thực tế của block cửa sổ (chỉ có chiều rộng danh nghĩa) — rule này hiện KHÔNG được checker.ts tự động kiểm (để dành, ghi nhận cho tương lai).',
    },
    {
      id: 'vn-res-apartment-min-area',
      source: 'TCVN 4451:2012',
      category: 'room-size',
      severity: 'info',
      description: 'Diện tích căn hộ tối thiểu: 30 m² (nhà ở xã hội) / 45 m² (nhà ở thương mại).',
      params: { minAreaSocialM2: 30, minAreaCommercialM2: 45 },
      verified: true,
      note: 'Tra qua tổng hợp web — đối chiếu bản gốc trước khi dùng cho hồ sơ chính thức. Checker hiện chưa phân biệt loại hình nhà ở xã hội/thương mại nên chỉ tham khảo, không tự động chấm.',
    },
    {
      id: 'vn-res-living-min-area',
      source: 'Kinh nghiệm thiết kế phổ biến (CHƯA tra được số trong văn bản TCVN cụ thể)',
      category: 'room-size',
      severity: 'info',
      description: 'Phòng khách căn hộ 1-2PN thường thiết kế không nhỏ hơn 12-16 m² để đủ bố trí sofa + lối đi cơ bản.',
      params: { minAreaM2: 12 },
      verified: false,
      note: 'Số liệu KINH NGHIỆM THỰC HÀNH (không phải trích dẫn trực tiếp 1 điều khoản TCVN cụ thể) — cần kiểm chứng với bản gốc quy chuẩn trước khi coi là bắt buộc; giữ severity=info (chỉ tham khảo).',
    },
  ],
};
