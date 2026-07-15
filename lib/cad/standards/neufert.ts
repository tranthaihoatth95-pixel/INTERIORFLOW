/**
 * lib/cad/standards/neufert.ts — Thông số NHÂN TRẮC & KHÔNG GIAN theo Neufert "Architects' Data"
 * (Bauentwurfslehre) và Metric Handbook. Đây là dữ liệu THIẾT KẾ TIỆN DỤNG phổ quát (không phải
 * văn bản pháp quy của 1 quốc gia): khoảng lưu thông cho người đi, khoảng trống thao tác trước
 * tủ/bếp, chiều cao mặt bàn, khổ cửa/thông thủy, chiều cao trần, chỗ ngồi ăn…
 *
 * KHÁC NHAU THEO QUỐC GIA — điểm mấu chốt (yêu cầu của hệ standards):
 *   - CÙNG một thông số Neufert có thể được LUẬT HÓA thành BẮT BUỘC ở nước này (VD chiều cao
 *     trần tối thiểu ghi trong luật xây dựng Đức/Anh) nhưng chỉ là KHUYẾN NGHỊ điều chỉnh được ở
 *     nước khác. Vì vậy phần lớn rule dưới đây đặt `binding: 'adjustable'` (thiết kế được phép
 *     tinh chỉnh theo bối cảnh + đối chiếu quy chuẩn địa phương), một số ít mang tính nền tảng
 *     nhân trắc gần như bất biến thì để `advisory`.
 *   - `region: 'INTL'` = tham số phổ quát, KHÔNG gắn 1 hệ quốc gia; khi áp cho dự án VN/US phải
 *     đối chiếu tương ứng với TCVN/QCVN (vn-*) hoặc NFPA/IBC (intl-egress) — Neufert bổ trợ tiện
 *     nghi, KHÔNG thay quy chuẩn pháp lý.
 *
 * Nguồn: Neufert Architects' Data (các ấn bản 3rd/4th) + Metric Handbook, đối chiếu qua
 * firstinarchitecture.co.uk (Metric Data 04 — Circulation) và các bản trích Neufert residential
 * — 2026-07-12. Đơn vị mm. Checker chưa nối tự động các rule này (thiếu đồ đạc/nội thất trong
 * model 2D hiện tại) — đưa vào registry để tra cứu + làm cơ sở kiểm nội thất tương lai.
 */
import type { RuleGroup } from './registry';

export const NEUFERT: RuleGroup = {
  id: 'neufert',
  name: 'Nhân trắc & không gian (Neufert Architects’ Data)',
  rules: [
    {
      id: 'neufert-circulation-one-person',
      source: 'Neufert Architects’ Data / Metric Handbook — Circulation',
      category: 'clearance',
      severity: 'info',
      region: 'INTL',
      binding: 'adjustable',
      description: 'Bề rộng lối đi cho 1 người đi lại thoải mái: ≈ 750 mm (thân người đứng ≈ 625 mm; 750 mm để đi tự nhiên).',
      params: { minWidthMm: 750, bodyWidthMm: 625 },
      verified: true,
      note: 'Trị số 750 mm (1 người) xác nhận qua firstinarchitecture Metric Data 04 (dữ liệu Neufert/Metric Handbook). Là mức tiện dụng — đối chiếu quy chuẩn thoát nạn địa phương nếu lối đi kiêm đường thoát nạn (VN ≥ 1000 mm, US ≥ 914 mm).',
    },
    {
      id: 'neufert-circulation-two-persons',
      source: 'Neufert Architects’ Data / Metric Handbook — Circulation',
      category: 'clearance',
      severity: 'info',
      region: 'INTL',
      binding: 'adjustable',
      description: 'Bề rộng để 2 người tránh nhau/đi song song: ≈ 1400 mm (2 người đứng cạnh nhau ≈ 1150 mm).',
      params: { minWidthMm: 1400, sideBySideMm: 1150 },
      verified: true,
      note: 'Xác nhận qua firstinarchitecture Metric Data 04. Cầu thang cho 2 người lên xuống cùng lúc: Neufert nêu ≈ 1250 mm — xem rule stair riêng nếu cần.',
    },
    {
      id: 'neufert-kitchen-working-aisle',
      source: 'Neufert Architects’ Data — Kitchens',
      category: 'clearance',
      severity: 'warning',
      region: 'INTL',
      binding: 'adjustable',
      description: 'Khoảng trống thao tác (lối làm việc) giữa hai dãy bếp/giữa bếp và tủ đối diện: tối thiểu ≈ 1200 mm để mở cánh + cúi thao tác; ≥ 1000 mm là mức tối thiểu tuyệt đối cho bếp 1 người.',
      params: { recommendedMm: 1200, absoluteMinMm: 1000 },
      verified: true,
      note: 'Trị số 1200 mm xác nhận qua bản trích Neufert residential (movement area 1200 mm giữa các dãy worktop). Checker chưa nhận diện tủ bếp trong model.',
    },
    {
      id: 'neufert-kitchen-worktop-height',
      source: 'Neufert Architects’ Data — Kitchens',
      category: 'clearance',
      severity: 'info',
      region: 'INTL',
      binding: 'adjustable',
      description: 'Chiều cao mặt bàn bếp (worktop): ≈ 850 mm (dải phổ biến 850–900 mm theo chiều cao người dùng); tủ treo cách mặt bàn ≈ 450–500 mm.',
      params: { worktopHeightMm: 850, worktopHeightMaxMm: 900, wallUnitGapMm: 450 },
      verified: true,
      note: 'Xác nhận qua bản trích Neufert residential (worktop 0.85 m; tủ treo cách 450–500 mm). Chiều cao tùy nhân trắc người dùng — adjustable.',
    },
    {
      id: 'neufert-clearance-front-of-storage',
      source: 'Neufert Architects’ Data — Storage / Wardrobes',
      category: 'clearance',
      severity: 'info',
      region: 'INTL',
      binding: 'adjustable',
      description: 'Tủ quần áo sâu ≈ 600 mm; cần khoảng trống thao tác trước tủ tối thiểu ≈ 600 mm để mở cánh + đứng, khuyến nghị ≈ 900 mm để cúi lấy đồ ngăn thấp.',
      params: { wardrobeDepthMm: 600, clearanceMinMm: 600, clearanceRecommendedMm: 900 },
      verified: true,
      note: 'Kích thước tủ 1200×600 mm và nhu cầu khoảng trống thao tác xác nhận qua bản trích Neufert; trị số 600/900 mm là mức thực hành phổ biến (thân người + tầm với).',
    },
    {
      id: 'neufert-dining-space-per-person',
      source: 'Neufert Architects’ Data — Dining',
      category: 'clearance',
      severity: 'info',
      region: 'INTL',
      binding: 'adjustable',
      description: 'Chỗ ngồi ăn cho 1 người tại bàn: bề rộng ≈ 600 mm (bộ đồ ăn ≈ 600 mm rộng × 350–400 mm sâu), thêm ≈ 200 mm ở giữa cho đĩa/tô chung; cần ≈ 750–800 mm phía sau ghế để kéo ghế + đi lại.',
      params: { seatWidthMm: 600, placeSettingDepthMm: 400, chairPullbackMm: 750 },
      verified: true,
      note: 'Xác nhận qua bản trích Neufert (bộ đồ ăn ≈ 60 cm rộng, 30–40 cm sâu, +20 cm giữa bàn). Khoảng lùi ghế 750–800 mm là mức thực hành phổ biến.',
    },
    {
      id: 'neufert-interior-door-clear-width',
      source: 'Neufert Architects’ Data — Doors',
      category: 'door-window',
      severity: 'info',
      region: 'INTL',
      binding: 'adjustable',
      description: 'Khổ cửa thông thủy khuyến nghị: cửa phòng ở ≈ 800–900 mm; cửa WC/phòng tắm ≈ 700–800 mm; cửa chính căn hộ ≈ 900–1000 mm. Cửa cho xe lăn cần thông thủy ≥ 800 (tốt hơn ≥ 850) mm.',
      params: { roomDoorMm: 800, bathroomDoorMm: 700, entranceDoorMm: 900, wheelchairMinMm: 800 },
      verified: false,
      note: 'Dải khổ cửa là thực hành phổ biến theo Neufert/Metric Handbook nhưng CÁC NGUỒN tra được không cho 1 con số chính thức duy nhất (thay đổi theo quốc gia + yêu cầu tiếp cận cho người khuyết tật) — đối chiếu quy chuẩn tiếp cận địa phương (VN: QCVN 10:2014/BXD) trước khi coi là chuẩn cứng.',
    },
    {
      id: 'neufert-ceiling-height-habitable',
      source: 'Neufert Architects’ Data — Room heights (thay đổi theo luật xây dựng quốc gia)',
      category: 'clearance',
      severity: 'info',
      region: 'INTL',
      binding: 'adjustable',
      description: 'Chiều cao thông thủy phòng ở: dải phổ biến quốc tế 2400–2500 mm (Đức thường ≥ 2400 mm, nhiều nước ≥ 2500 mm). Đây là ví dụ điển hình về thông số ĐƯỢC LUẬT HÓA khác nhau theo quốc gia. Việt Nam (QCVN 04:2021/BXD): phòng ở ≥ 2.6 m, bếp/vệ sinh ≥ 2.3 m — xem `vnResidentialMinMm`/`vnWetAreaMinMm`.',
      params: { typicalMinMm: 2400, commonMinMm: 2500, vnResidentialMinMm: 2600, vnWetAreaMinMm: 2300 },
      verified: false,
      note: 'Chiều cao trần tối thiểu là trị số ĐƯỢC LUẬT HÓA riêng theo từng nước (Đức 2.40 m, một số nơi 2.50 m). Số liệu VN — QCVN 04:2021/BXD (số liệu do chủ dự án cung cấp): phòng ở ≥ 2.6 m (2600 mm), bếp/vệ sinh ≥ 2.3 m (2300 mm) — CHƯA đối chiếu chéo nguồn thứ 2 độc lập trong phiên này, cần xác nhận lại số hiệu mục khi có bản gốc. Model 2D chưa lưu cao độ trần (không có trục Z) nên rule này CHƯA đo được — có số liệu VN nhưng model 2D chưa lưu Z nên vẫn chưa đo được, giữ verified=false.',
    },
  ],
};
