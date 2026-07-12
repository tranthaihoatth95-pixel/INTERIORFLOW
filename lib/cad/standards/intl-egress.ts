/**
 * lib/cad/standards/intl-egress.ts — Thoát nạn quốc tế (NFPA 101 Life Safety Code & IBC 2021
 * Chapter 10 Means of Egress) — dùng khi dự án tham chiếu chuẩn quốc tế thay vì QCVN VN. Số liệu
 * tra cứu & đối chiếu chéo qua codes.iccsafe.org, up.codes, nfpa.org, meltplan.com — 2026-07-12
 * (bản tóm tắt các mục IBC/NFPA; văn bản đầy đủ có phí). Đối chiếu bản đầy đủ + tu chỉnh địa
 * phương (local amendment) trước khi dùng cho hồ sơ chính thức ở khu vực áp dụng NFPA/IBC.
 *
 * Đơn vị gốc là inch (đã quy đổi sang mm, 1 in = 25.4 mm). Nhiều trị số phụ thuộc occupant load
 * và việc công trình có hệ chữa cháy tự động (sprinklered) hay không — ghi rõ trong params/note.
 */
import type { RuleGroup } from './registry';

export const INTL_EGRESS: RuleGroup = {
  id: 'intl-egress',
  name: 'Thoát nạn quốc tế (NFPA 101 / IBC 2021)',
  rules: [
    {
      id: 'intl-egress-door-min-clear-width',
      source: 'IBC 2021 §1010.1.1 (Size of doors) — tương đương NFPA 101 §7.2.1',
      category: 'door-window',
      severity: 'error',
      region: 'US',
      binding: 'mandatory',
      description: 'Chiều rộng thông thủy tối thiểu của cửa trên lối thoát nạn: 32 inch (813 mm), đo khi cánh mở 90°. Đây là mức sàn kể cả khi công thức theo occupant load ra nhỏ hơn.',
      params: { minClearWidthMm: 813 },
      verified: true,
      note: 'Xác nhận qua codes.iccsafe.org / meltplan (IBC 2021 §1010.1.1). Đối chiếu bản đầy đủ + local amendment trước khi dùng chính thức.',
    },
    {
      id: 'intl-egress-corridor-min-width',
      source: 'IBC 2021 §1020.2 (Corridor width) — tương đương NFPA 101',
      category: 'corridor-stair',
      severity: 'error',
      region: 'US',
      binding: 'mandatory',
      description: 'Chiều rộng hành lang tối thiểu: 44 inch (1118 mm) khi phục vụ occupant load ≥ 50; cho phép 36 inch (914 mm) khi phục vụ < 50 người. Nhà y tế nhóm I-2 (giường bệnh di chuyển) yêu cầu tới 96 inch (2438 mm).',
      params: { minWidthMmGeneral: 1118, minWidthMmUnder50: 914, occupantThreshold: 50, minWidthMmHealthcareI2: 2438 },
      verified: true,
      note: 'Xác nhận qua codes.iccsafe.org / buildingcodetrainer (IBC 2021 §1020.2). Đối chiếu bản đầy đủ trước khi dùng chính thức.',
    },
    {
      id: 'intl-egress-width-capacity-factor',
      source: 'IBC 2021 §1005.3 / NFPA 101 §7.3.3 (Egress width capacity)',
      category: 'egress',
      severity: 'error',
      region: 'US',
      binding: 'mandatory',
      description: 'Chiều rộng thoát nạn tối thiểu = occupant load × hệ số/người. Cầu thang: 0.3 in/người (7.62 mm) — 0.2 in (5.08 mm) nếu có sprinkler + báo cháy bằng giọng nói. Cấu kiện phẳng (hành lang, cửa, dốc): 0.2 in/người (5.08 mm) — 0.15 in (3.81 mm) nếu có sprinkler.',
      params: {
        stairFactorMmPerOccupant: 7.62, stairFactorSprinkleredMmPerOccupant: 5.08,
        levelFactorMmPerOccupant: 5.08, levelFactorSprinkleredMmPerOccupant: 3.81,
      },
      verified: true,
      note: 'Xác nhận qua nfpa.org / usmadesupply / meltplan (IBC 2021 §1005.3.1/§1005.3.2; NFPA 101 §7.3.3.1/§7.3.3.2). Hệ số giảm CHỈ áp dụng cho công trình đủ điều kiện sprinkler + hệ báo cháy giọng nói ở nhà xây mới. Checker chưa tính occupant load nên chưa áp tự động.',
    },
    {
      id: 'intl-egress-min-exits-count',
      source: 'IBC 2021 Table 1006.2.1 / §1006.3.1; NFPA 101 §7.4',
      category: 'egress',
      severity: 'error',
      region: 'US',
      binding: 'mandatory',
      description: 'Tối thiểu 2 lối ra khi occupant load 50–500 (hoặc common path vượt giới hạn); 3 lối ra khi > 500; 4 lối ra khi > 1000 người.',
      params: { twoExitsMinOccupants: 50, threeExitsMinOccupants: 500, fourExitsMinOccupants: 1000 },
      verified: true,
      note: 'Xác nhận qua codes.iccsafe.org / meltplan (IBC 2021 §1006). Ngưỡng thấp hơn (space có 1 lối ra) phụ thuộc nhóm sử dụng + common path — tra Table 1006.2.1 bản gốc. Checker chưa tính occupant load.',
    },
    {
      id: 'intl-egress-common-path-limit',
      source: 'NFPA 101 §7.5 / IBC 2021 §1006.2.1 (Common path of egress travel)',
      category: 'egress',
      severity: 'warning',
      region: 'US',
      binding: 'mandatory',
      description: 'Common path of travel (đoạn người thoát chưa có 2 hướng chọn lựa) thường giới hạn 75–100 ft (≈22.9–30.5 m) tùy nhóm sử dụng và có sprinkler hay không.',
      params: { commonPathTypicalFtMm: 22860, commonPathMaxFtMm: 30480 },
      verified: true,
      note: 'Xác nhận qua nfpa.org (NFPA 101 §7.5) — trị số chính xác thay đổi theo occupancy chapter. Checker chưa mô phỏng đường đi để đo common path.',
    },
    {
      id: 'intl-egress-travel-distance',
      source: 'IBC 2021 Table 1017.2 / NFPA 101 (Exit access travel distance)',
      category: 'egress',
      severity: 'warning',
      region: 'US',
      binding: 'mandatory',
      description: 'Khoảng cách đi tới lối thoát (travel distance) giới hạn theo nhóm sử dụng: nhóm B (văn phòng) 200 ft (61 m) không sprinkler / 300 ft (91 m) có sprinkler; nhóm nguy hiểm H-1 chỉ 75 ft (23 m).',
      params: { groupBUnsprinkleredMm: 61000, groupBSprinkleredMm: 91000, groupH1Mm: 23000 },
      verified: true,
      note: 'Xác nhận qua codes.iccsafe.org / meltplan (IBC 2021 Table 1017.2). Là BẢNG theo nhóm sử dụng — các trị số ở đây là ví dụ điển hình, tra đúng dòng nhóm sử dụng của dự án. Checker chưa đo travel distance.',
    },
    {
      id: 'intl-egress-min-ceiling-height',
      source: 'IBC 2021 §1003.2 (Ceiling height, means of egress)',
      category: 'clearance',
      severity: 'warning',
      region: 'US',
      binding: 'mandatory',
      description: 'Chiều cao thông thủy tối thiểu trên đường thoát nạn: 7 ft 6 in (2286 mm); cho phép nhô cục bộ tối đa (VD dầm) theo §1003.3.',
      params: { minCeilingHeightMm: 2286 },
      verified: true,
      note: 'Xác nhận qua codes.iccsafe.org (IBC 2021 §1003.2). Model 2D chưa lưu cao độ trần nên checker chưa đo tự động.',
    },
    {
      id: 'intl-egress-max-door-width',
      source: 'IBC 2021 §1010.1.1 (Maximum door leaf width)',
      category: 'door-window',
      severity: 'warning',
      region: 'US',
      binding: 'mandatory',
      description: 'Cửa trên lối thoát nạn không rộng quá 48 inch (1219 mm) mỗi cánh.',
      params: { maxWidthMm: 1219 },
      verified: true,
      note: 'Xác nhận qua codes.iccsafe.org (IBC 2021 §1010.1.1). Đối chiếu bản đầy đủ trước khi dùng chính thức.',
    },
    {
      id: 'intl-egress-door-swing-encroachment',
      source: 'IBC 2021 §1005.7 (Encroachment)',
      category: 'door-window',
      severity: 'info',
      region: 'US',
      binding: 'mandatory',
      description: 'Khi cửa mở hết cỡ, cánh cửa không được làm giảm chiều rộng lối thoát nạn yêu cầu quá 7 inch (178 mm), và không giảm quá 1/2 chiều rộng tại bất kỳ điểm nào trong quá trình mở.',
      params: { maxEncroachmentMm: 178, maxEncroachmentRatio: 0.5 },
      verified: true,
      note: 'Xác nhận qua up.codes (IBC 2021 §1005.7) — checker hiện CHƯA mô phỏng cung mở cửa để tự kiểm rule này (mới là warning định tính), để dành bản nâng cấp sau.',
    },
  ],
};
