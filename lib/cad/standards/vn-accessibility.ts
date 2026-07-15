/**
 * lib/cad/standards/vn-accessibility.ts — Tiếp cận cho người khuyết tật/người cao tuổi
 * (QCVN 10:2024/BXD — công trình xây dựng đảm bảo người khuyết tật tiếp cận sử dụng).
 *
 * NGUỒN SỐ LIỆU (đọc kỹ trước khi dùng cho hồ sơ chính thức): 4 trị số dưới đây do CHỦ DỰ ÁN
 * cung cấp trực tiếp trong phiên làm việc 2026-07-15, KHÔNG PHẢI do agent tự tra cứu web. Số
 * liệu này CHƯA được đối chiếu chéo với nguồn thứ 2 độc lập trong phiên này (khác với vn-fire.ts/
 * neufert.ts — nơi mọi trị số verified=true đều đã tra ≥2 nguồn công bố độc lập). Vì vậy giữ
 * verified=false cho TẤT CẢ rule trong file này dù số liệu là số "chính thức" QCVN 10:2024 (thay
 * thế QCVN 10:2014/BXD cũ) — mức tin cậy ở đây là "chủ dự án khẳng định", chưa phải "agent tự xác
 * nhận qua ≥2 nguồn" theo đúng quy ước verified ở đầu registry.ts. Trước khi dùng cho hồ sơ thẩm
 * duyệt chính thức, BẮT BUỘC đối chiếu bản QCVN 10:2024/BXD gốc (moc.gov.vn) 1 lần nữa.
 */
import type { RuleGroup } from './registry';

export const VN_ACCESSIBILITY: RuleGroup = {
  id: 'vn-accessibility',
  name: 'Tiếp cận người khuyết tật (QCVN 10:2024/BXD)',
  rules: [
    {
      id: 'vn-access-door-functional-room-min-width',
      source: 'QCVN 10:2024/BXD — Cửa phòng chức năng (trị số do chủ dự án cung cấp)',
      category: 'door-window',
      severity: 'error',
      region: 'VN',
      binding: 'mandatory',
      description: 'Cửa phòng chức năng (phòng ngủ, WC, bếp…): chiều rộng thông thủy không nhỏ hơn 800 mm để đảm bảo người dùng xe lăn tiếp cận.',
      params: { minWidthMm: 800 },
      verified: false,
      note: 'Trị số do chủ dự án cung cấp từ QCVN 10:2024/BXD, CHƯA đối chiếu chéo nguồn thứ 2 độc lập trong phiên này. Thay thế QCVN 10:2014/BXD (bản cũ) theo khẳng định của chủ dự án — cần xác nhận lại số hiệu mục cụ thể khi có bản PDF gốc.',
    },
    {
      id: 'vn-access-door-main-min-width',
      source: 'QCVN 10:2024/BXD — Cửa chính (trị số do chủ dự án cung cấp)',
      category: 'door-window',
      severity: 'error',
      region: 'VN',
      binding: 'mandatory',
      description: 'Cửa chính (lối vào căn hộ/công trình): chiều rộng thông thủy không nhỏ hơn 900 mm.',
      params: { minWidthMm: 900 },
      verified: false,
      note: 'Trị số do chủ dự án cung cấp từ QCVN 10:2024/BXD, CHƯA đối chiếu chéo nguồn thứ 2 độc lập trong phiên này. Cần xác nhận lại số hiệu mục cụ thể khi có bản PDF gốc.',
    },
    {
      id: 'vn-access-door-clear-space',
      source: 'QCVN 10:2024/BXD — Không gian trống trước/sau cửa (trị số do chủ dự án cung cấp)',
      category: 'clearance',
      severity: 'error',
      region: 'VN',
      binding: 'mandatory',
      description: 'Không gian trống trước và sau cửa (để xe lăn thao tác mở cửa/quay đầu): tối thiểu 1400×1400 mm.',
      params: { minWidthMm: 1400, minDepthMm: 1400 },
      verified: false,
      note: 'Trị số do chủ dự án cung cấp từ QCVN 10:2024/BXD, CHƯA đối chiếu chéo nguồn thứ 2 độc lập trong phiên này. CHƯA NỐI vào checker: field `clearance` hiện có của BlockDef cửa (lib/cad/furniture.ts) là "vùng quét cánh cửa mở" (door swing arc), khác Ý NGHĨA với "khoảng trống thao tác xe lăn 1400×1400" — 2 khái niệm cùng nằm trước cửa nhưng mục đích khác nhau (1 cái đo cung mở cánh, 1 cái đo không gian quay xe lăn). Ép dùng chung sẽ báo sai. Cần field/khái niệm riêng "wheelchair maneuvering clearance" nếu muốn đo tự động — chưa làm trong lần nối dây này, xem SỔ TRẠNG THÁI NỐI DÂY trong checker.ts.',
    },
    {
      id: 'vn-access-corridor-two-way-min-width',
      source: 'QCVN 10:2024/BXD — Hành lang 2 chiều tránh xe lăn (trị số do chủ dự án cung cấp)',
      category: 'corridor-stair',
      severity: 'error',
      region: 'VN',
      binding: 'mandatory',
      description: 'Hành lang cho 2 người/xe lăn tránh nhau (chiều đi ngược nhau): chiều rộng thông thủy không nhỏ hơn 1500 mm.',
      params: { minWidthMm: 1500 },
      verified: false,
      note: 'Trị số do chủ dự án cung cấp từ QCVN 10:2024/BXD, CHƯA đối chiếu chéo nguồn thứ 2 độc lập trong phiên này. Đo được ngay bằng room.minWidthMm — đã nối vào nhánh corridor của checkStandards() (checker.ts), dùng lại đúng bề rộng hành lang đã đo cho các rule corridor khác.',
    },
  ],
};
