/**
 * lib/cad/standards/vn-electrical.ts — Sprint 6, D2.2: mật độ ổ cắm điện dân dụng
 * (TCVN 9206:2012 — Đặt thiết bị điện trong nhà ở và công trình công cộng — Tiêu chuẩn thiết kế).
 *
 * NGUỒN SỐ LIỆU: tổng hợp qua 4+ trang thứ cấp (hethongphapluat.com, luatvietnam.vn,
 * bestray.com, chatluongcongtrinh.com) đều khớp nhau về khoảng 2-4 ổ cắm/phòng ở
 * (ngủ/khách) và 2-4 ổ cắm 15A riêng cho bếp/phòng ăn — CHƯA đối chiếu trực tiếp bản PDF gốc
 * (mtu.edu.vn/Resources/Docs/.../TCVN9206_2012.pdf). `verified: true` vì ≥2 nguồn ĐỘC LẬP khớp
 * nhau (thực tế xác nhận 4 nguồn), theo đúng nguyên tắc `verified` ở registry.ts — nhưng vẫn cần
 * đối chiếu bản gốc trước khi dùng cho hồ sơ thiết kế điện chính thức (ghi rõ trong `note`).
 *
 * Nối đo THẬT vào checkStandards() (checker.ts): đếm BlockEntity block='outlet' (lib/cad/mep.ts)
 * nằm trong biên từng phòng bedroom/living/kitchen đã phân loại — sinh warning nếu < 2 (dưới cả
 * cận thấp nhất của khoảng 2-4). KHÔNG cảnh báo nếu > 4 (thừa ổ cắm không phải vấn đề an toàn).
 */
import type { RuleGroup } from './registry';

export const VN_ELECTRICAL: RuleGroup = {
  id: 'vn-electrical',
  name: 'Điện dân dụng (TCVN 9206:2012)',
  rules: [
    {
      id: 'vn-electrical-outlet-density-living-bedroom',
      source: 'TCVN 9206:2012 (tổng hợp qua hethongphapluat.com, luatvietnam.vn, bestray.com, chatluongcongtrinh.com — CHƯA đối chiếu trực tiếp bản PDF gốc mtu.edu.vn/Resources/Docs/.../TCVN9206_2012.pdf)',
      category: 'other',
      severity: 'warning',
      region: 'VN',
      binding: 'adjustable',
      description: 'Phòng ở (phòng ngủ/phòng khách): số ổ cắm điện khuyến nghị 2–4 ổ/phòng.',
      params: { minOutlets: 2, maxOutlets: 4 },
      verified: true,
      note: '4 nguồn thứ cấp độc lập khớp nhau về khoảng 2-4 ổ cắm/phòng ở — CHƯA đối chiếu bản PDF gốc TCVN 9206:2012 (mtu.edu.vn). Đối chiếu bản gốc trước khi dùng cho hồ sơ thiết kế điện chính thức. Đo bằng cách đếm BlockEntity block="outlet" (lib/cad/mep.ts, mới thêm Sprint 6) nằm trong biên phòng — CHƯA có ổ cắm nào đặt = 0, không phải lỗi đo.',
    },
    {
      id: 'vn-electrical-outlet-density-kitchen',
      source: 'TCVN 9206:2012 (tổng hợp qua hethongphapluat.com, luatvietnam.vn, bestray.com, chatluongcongtrinh.com — CHƯA đối chiếu trực tiếp bản PDF gốc mtu.edu.vn/Resources/Docs/.../TCVN9206_2012.pdf)',
      category: 'other',
      severity: 'warning',
      region: 'VN',
      binding: 'adjustable',
      description: 'Bếp/phòng ăn: số ổ cắm 15A riêng khuyến nghị 2–4 ổ.',
      params: { minOutlets: 2, maxOutlets: 4 },
      verified: true,
      note: '4 nguồn thứ cấp độc lập khớp nhau về khoảng 2-4 ổ cắm 15A riêng cho bếp/phòng ăn — CHƯA đối chiếu bản PDF gốc TCVN 9206:2012 (mtu.edu.vn). Đối chiếu bản gốc trước khi dùng cho hồ sơ thiết kế điện chính thức. Đo bằng cách đếm BlockEntity block="outlet" trong biên phòng — model 2D không phân biệt được ổ cắm 15A riêng với ổ cắm thường (không có field amperage), nên đây là đếm TỔNG số ổ cắm, không lọc theo loại 15A.',
    },
  ],
};
