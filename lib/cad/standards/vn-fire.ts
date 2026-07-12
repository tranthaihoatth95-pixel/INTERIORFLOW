/**
 * lib/cad/standards/vn-fire.ts — An toàn cháy & thoát nạn Việt Nam: QCVN 06:2022/BXD + Sửa đổi
 * 1:2023 (ban hành kèm Thông tư 09/2023/TT-BXD ngày 16/10/2023). Các trị số dưới đây tra cứu &
 * đối chiếu chéo qua nhiều nguồn công bố QCVN 06 (tài liệu hội thảo phổ biến của Bộ Xây dựng
 * moc.gov.vn; thuvienphapluat.vn; các bản trích QCVN 06:2022 + Sửa đổi 1:2023) — 2026-07-12.
 *
 * QUY ƯỚC "verified":
 *   - verified=true khi TRỊ SỐ được xác nhận trùng khớp qua ≥2 nguồn công bố QCVN 06. Tuy nhiên
 *     nhiều trị số PHỤ THUỘC nhóm nhà (F1..F5)/bậc chịu lửa/số người — checker chỉ áp mức tối
 *     thiểu chung, KHÔNG thay thẩm duyệt PCCC. Note ghi rõ caveat + số MỤC để đối chiếu bản gốc.
 *   - Số hiệu mục (VD 3.2.5, 3.3.x, 3.4.x, Phụ lục G) là vị trí điều khoản THÔNG DỤNG được các
 *     nguồn dẫn — vẫn nên mở bản PDF gốc moc.gov.vn xác nhận đúng khoản cho từng nhóm nhà.
 */
import type { RuleGroup } from './registry';

export const VN_FIRE: RuleGroup = {
  id: 'vn-fire',
  name: 'An toàn cháy & thoát nạn (QCVN 06:2022/BXD + SĐ1:2023)',
  rules: [
    {
      id: 'vn-fire-exit-clear-width-min',
      source: 'QCVN 06:2022/BXD (SĐ1:2023) mục 3.2.5 — Lối ra thoát nạn',
      category: 'door-window',
      severity: 'error',
      region: 'VN',
      binding: 'mandatory',
      description: 'Chiều rộng thông thủy tối thiểu của lối ra thoát nạn (cửa/lối đi trên đường thoát nạn): không nhỏ hơn 0.8 m (800 mm) trong trường hợp chung.',
      params: { minWidthMm: 800 },
      verified: true,
      note: 'Trị số 0.8 m xác nhận qua nhiều nguồn dẫn QCVN 06:2022 mục 3.2.5. Một số trường hợp (số người thoát lớn, nhóm nhà cụ thể) yêu cầu rộng hơn — đối chiếu mục 3.2.5 + Phụ lục G bản gốc. Model cửa (BlockEntity) hiện chưa nối tự động vào checker cho rule này.',
    },
    {
      id: 'vn-fire-exit-clear-height-min',
      source: 'QCVN 06:2022/BXD (SĐ1:2023) mục 3.2.5 — Lối ra thoát nạn',
      category: 'door-window',
      severity: 'error',
      region: 'VN',
      binding: 'mandatory',
      description: 'Chiều CAO thông thủy tối thiểu của lối ra thoát nạn: không nhỏ hơn 1.9 m (1900 mm). (Đây là chiều cao, KHÔNG phải chiều rộng.)',
      params: { minHeightMm: 1900 },
      verified: true,
      note: 'Trị số 1.9 m xác nhận qua nhiều nguồn dẫn QCVN 06:2022 mục 3.2.5 (đã sửa nhầm lẫn cao/rộng của bản rule cũ). BlockEntity cửa hiện không lưu chiều cao nên checker chưa đo tự động rule này.',
    },
    {
      id: 'vn-fire-min-exits-count',
      source: 'QCVN 06:2022/BXD (SĐ1:2023) mục 3.2.6 — Số lối ra thoát nạn',
      category: 'egress',
      severity: 'error',
      region: 'VN',
      binding: 'mandatory',
      description: 'Gian phòng/tầng thường phải có tối thiểu 2 lối ra thoát nạn khi số người thoát nạn vượt 50 người (nhiều loại gian còn xét theo diện tích/khoảng cách). Dưới ngưỡng có thể cho phép 1 lối ra theo điều kiện cụ thể.',
      params: { minExits: 2, occupantThreshold: 50 },
      verified: true,
      note: 'Ngưỡng "2 lối ra khi >50 người" xác nhận qua nhiều nguồn QCVN 06:2022 mục 3.2.6; điều kiện đầy đủ còn phụ thuộc nhóm nhà, diện tích gian, khoảng cách — tra mục 3.2.6.1/3.2.6.2 + Phụ lục G bản gốc. Checker chưa tính occupant load tự động.',
    },
    {
      id: 'vn-fire-corridor-min-width-f1-over15',
      source: 'QCVN 06:2022/BXD (SĐ1:2023) mục 3.3 — Đường thoát nạn',
      category: 'corridor-stair',
      severity: 'error',
      region: 'VN',
      binding: 'mandatory',
      description: 'Hành lang chung dùng thoát nạn cho hơn 15 người từ các gian phòng nhóm F1 (nhà ở, chung cư…): chiều rộng thông thủy không nhỏ hơn 1.2 m (1200 mm).',
      params: { minWidthMm: 1200, occupantThreshold: 15 },
      verified: true,
      note: 'Xác nhận qua nhiều nguồn dẫn QCVN 06:2022 mục 3.3. Đối chiếu bản PDF gốc (moc.gov.vn) cho hồ sơ thẩm duyệt chính thức.',
    },
    {
      id: 'vn-fire-corridor-min-width-general',
      source: 'QCVN 06:2022/BXD (SĐ1:2023) mục 3.3 — Đường thoát nạn',
      category: 'corridor-stair',
      severity: 'error',
      region: 'VN',
      binding: 'mandatory',
      description: 'Chiều rộng thông thủy các đoạn nằm ngang của đường thoát nạn (hành lang, tiền sảnh…) trong các trường hợp còn lại: không nhỏ hơn 1.0 m (1000 mm). Lối đi chỉ dẫn tới chỗ làm việc đơn lẻ có thể ≥ 0.7 m.',
      params: { minWidthMm: 1000, minWidthToSingleWorkplaceMm: 700 },
      verified: true,
      note: 'Trị số 1.0 m (chung) / 0.7 m (tới chỗ làm việc đơn lẻ) xác nhận qua nhiều nguồn QCVN 06:2022 mục 3.3. Checker ĐO được bề rộng đoạn thoát nạn khi có nhãn phòng "HÀNH LANG" (dò biên hình học); đối chiếu bản gốc cho hồ sơ chính thức.',
    },
    {
      id: 'vn-fire-stair-min-width',
      source: 'QCVN 06:2022/BXD (SĐ1:2023) mục 3.4 — Cầu thang bộ & bản thang thoát nạn',
      category: 'corridor-stair',
      severity: 'error',
      region: 'VN',
      binding: 'mandatory',
      description: 'Chiều rộng thông thủy bản thang bộ thoát nạn không nhỏ hơn 0.9 m (900 mm) với nhà ở nhỏ; nhiều loại nhà yêu cầu ≥ 1.05 m hoặc ≥ 1.2 m theo số người/nhóm nhà (xác định đúng nhóm nhà trước khi áp trị số).',
      params: { minWidthMm: 900, minWidthCommonMm: 1050, minWidthStrictMm: 1200 },
      verified: false,
      note: 'QCVN 06 quy định NHIỀU trị số bản thang (0.9 / 1.05 / 1.2 m…) theo nhóm nhà, số tầng, số người thoát — các nguồn tra được không thống nhất trị số nào cho từng trường hợp. CẦN đối chiếu mục 3.4.1 bản gốc trước khi dùng; giữ verified=false để không áp cứng sai.',
    },
    {
      id: 'vn-fire-travel-distance-appendix-g',
      source: 'QCVN 06:2022/BXD (SĐ1:2023) Phụ lục G — Khoảng cách giới hạn tới lối ra thoát nạn',
      category: 'egress',
      severity: 'warning',
      region: 'VN',
      binding: 'mandatory',
      description: 'Khoảng cách xa nhất từ một điểm bất kỳ tới lối ra thoát nạn gần nhất bị giới hạn theo bảng Phụ lục G (phụ thuộc nhóm nhà, bậc chịu lửa, mật độ người). Ngưỡng tham chiếu phổ biến cho nhà ở/công cộng khoảng 25–75 m tùy trường hợp.',
      params: { maxTravelDistanceTypicalMm: 75000 },
      verified: false,
      note: 'Phụ lục G là BẢNG nhiều giá trị theo nhóm nhà/bậc chịu lửa/mật độ — không có 1 con số duy nhất. Trị số 75 m chỉ là mốc tham chiếu ĐẦU BẢNG, KHÔNG áp dụng chung. Bắt buộc tra Phụ lục G bản gốc. Checker chưa đo travel distance (cần đồ hình đường đi).',
    },
    {
      id: 'vn-fire-exit-door-double-leaf-rule',
      source: 'QCVN 06:2022/BXD (SĐ1:2023) mục 3.2 — Cửa trên lối thoát nạn',
      category: 'door-window',
      severity: 'info',
      region: 'VN',
      binding: 'mandatory',
      description: 'Cửa thoát nạn 2 cánh: chiều rộng lối ra thoát nạn chỉ tính bằng chiều rộng lối đi qua cánh MỞ (không tính cánh đóng/cố định); cửa phải có cơ cấu tự đóng, các cánh đóng lần lượt.',
      params: {},
      verified: true,
      note: 'Rule định tính (không có trị số mm) — xác nhận qua nhiều nguồn QCVN 06:2022 mục 3.2. Checker chưa phát hiện cửa 2 cánh trong model (BlockEntity chỉ lưu 1 cửa 1 cánh), để tham khảo.',
    },
  ],
};
