/**
 * lib/cad/standards/vn-fire.ts — An toàn cháy & thoát nạn Việt Nam: QCVN 06:2022/BXD (+ Sửa
 * đổi 1:2023) và TCVN 2622 (tham chiếu lịch sử, phần lớn đã được QCVN 06 thay thế). Số liệu
 * tra cứu qua tìm kiếm web 2026-07-11 (các trang tổng hợp/trích dẫn QCVN 06, KHÔNG đọc trực
 * tiếp file PDF gốc trên moc.gov.vn) — đối chiếu bản gốc trước khi dùng cho hồ sơ PCCC chính
 * thức, đặc biệt các trị số phụ thuộc NHÓM NHÀ/HẠNG NGUY HIỂM CHÁY mà rule ở đây CHƯA phân
 * biệt hết (checker chỉ áp dụng mức tối thiểu chung, không thay thế thẩm duyệt PCCC thật).
 */
import type { RuleGroup } from './registry';

export const VN_FIRE: RuleGroup = {
  id: 'vn-fire',
  name: 'An toàn cháy & thoát nạn (QCVN 06:2022/BXD)',
  rules: [
    {
      id: 'vn-fire-corridor-min-width-f1-over15',
      source: 'QCVN 06:2022/BXD (+ Sửa đổi 1:2023)',
      category: 'corridor-stair',
      severity: 'error',
      description: 'Hành lang chung dùng thoát nạn cho hơn 15 người từ các gian phòng nhóm F1 (nhà ở, chung cư…): chiều rộng thông thuỷ không nhỏ hơn 1.2 m.',
      params: { minWidthMm: 1200, occupantThreshold: 15 },
      verified: true,
      note: 'Tra qua tổng hợp web (nhiều trang trích QCVN 06:2022/BXD) — đối chiếu bản PDF gốc (moc.gov.vn) trước khi dùng cho hồ sơ PCCC thẩm duyệt chính thức.',
    },
    {
      id: 'vn-fire-corridor-min-width-general',
      source: 'QCVN 06:2022/BXD (+ Sửa đổi 1:2023)',
      category: 'corridor-stair',
      severity: 'error',
      description: 'Chiều rộng thông thuỷ các đoạn nằm ngang của đường thoát nạn (hành lang, tiền sảnh…) trong các trường hợp còn lại: không nhỏ hơn 1.0 m.',
      params: { minWidthMm: 1000 },
      verified: true,
      note: 'Tra qua tổng hợp web — đối chiếu bản gốc trước khi dùng cho hồ sơ chính thức. Checker hiện CHƯA đo tự động được chiều rộng hành lang từ hình học (thiếu entity đánh dấu vùng hành lang) — rule này để tham khảo, chưa có violation tự động.',
    },
    {
      id: 'vn-fire-stair-min-width',
      source: 'QCVN 06:2022/BXD (+ Sửa đổi 1:2023)',
      category: 'corridor-stair',
      severity: 'error',
      description: 'Chiều rộng thông thuỷ bản thang thoát nạn không nhỏ hơn 1.0 m (một số loại nhà yêu cầu thang thoát nạn tối thiểu 1.35 m — CẦN xác định đúng nhóm nhà/hạng nguy hiểm cháy trước khi áp dụng trị số nào).',
      params: { minWidthMm: 1000, minWidthStrictMm: 1350 },
      verified: false,
      note: 'Search web cho ra cả 2 trị số (1.0m và 1.35m) áp dụng cho các trường hợp khác nhau (loại nhà/số tầng/hạng nguy hiểm cháy) mà snippet tìm được KHÔNG phân biệt rõ — cần đối chiếu bản gốc QCVN 06 để biết trị số nào áp dụng cho từng trường hợp cụ thể trước khi dùng.',
    },
    {
      id: 'vn-fire-exit-door-double-leaf-rule',
      source: 'QCVN 06:2022/BXD (+ Sửa đổi 1:2023)',
      category: 'door-window',
      severity: 'info',
      description: 'Cửa thoát nạn 2 cánh: chiều rộng lối ra thoát nạn chỉ tính bằng chiều rộng lối đi qua bên cánh MỞ (không tính cánh đóng/cố định); cửa phải có cơ cấu tự đóng, các cánh đóng lần lượt.',
      params: {},
      verified: true,
      note: 'Rule định tính (không có trị số mm cụ thể) — checker hiện CHƯA có cơ chế phát hiện cửa 2 cánh trong model (BlockEntity chỉ lưu 1 cửa 1 cánh), để tham khảo.',
    },
    {
      id: 'vn-fire-exit-door-height-min',
      source: 'QCVN 06:2022/BXD (nghi ngờ — xem note)',
      category: 'door-window',
      severity: 'info',
      description: 'Chiều CAO cửa trên lối thoát nạn thường được quy định tối thiểu khoảng 1.9m (KHÔNG PHẢI chiều rộng — kết quả tìm kiếm ban đầu có thể đã lẫn giữa 2 đại lượng này).',
      params: { minHeightMm: 1900 },
      verified: false,
      note: 'Kết quả web search trả về con số "1.900mm" gắn nhãn "kích thước cửa thoát nạn tối thiểu" nhưng rất có khả năng đây là CHIỀU CAO cửa (thông lệ phổ biến ~1.9-2.0m ở nhiều quy chuẩn), không phải chiều rộng — CẦN đối chiếu bản gốc QCVN 06 để xác nhận trước khi dùng. Model hiện tại (BlockEntity cửa) không lưu chiều cao nên checker không đo được rule này.',
    },
  ],
};
