/**
 * lib/legal/third-party-licenses.ts — dữ liệu THUẦN cho trang "Third-party licenses"
 * (`app/settings/licenses/page.tsx`). Nguồn sự thật đầy đủ hơn: `docs/LICENSE-NOTES.md`.
 * File này chỉ giữ phần CẦN HIỂN THỊ TRONG APP cho người dùng cuối — không lặp lại toàn bộ
 * phân tích nội bộ của LICENSE-NOTES.md (đó là tài liệu cho đội dev/luật sư).
 */

/** GPL-3 §5(a): "ghi rõ phần nào của IF dưới GPL" — CHỈ 2 mục này, không phải cả app. */
export const GPL_SCOPE_FILES = [
  'lib/cad/dwg-worker.ts — Worker DUY NHẤT gọi @mlightcad/libredwg-web để đọc file .dwg',
  'public/wasm/libredwg-web.wasm — WASM binary biên dịch từ GNU LibreDWG',
] as const;

export const GPL_COPYRIGHT_NOTICE =
  'GNU LibreDWG — Copyright (C) các tác giả GNU LibreDWG & Free Software Foundation (FSF). ' +
  'Bản build WASM dùng trong IF: @mlightcad/libredwg-web (MLight Lee) — Copyright (C) MLight Lee, ' +
  'dựa trên GNU LibreDWG, phát hành theo GNU General Public License v3.0 (GPL-3.0). ' +
  'IF KHÔNG sở hữu bản quyền phần này — chỉ dùng lại nguyên trạng, có nghĩa vụ conveying theo GPL-3 §4/§5/§6.';

/**
 * GPL-3 §6(b): "written offer, valid for at least three years... to give anyone who possesses
 * the object code either (1) a copy of the Corresponding Source... or (2) access to copy the
 * Corresponding Source from a network server at no charge."
 *
 * ⚠️ `contactPlaceholder` CHƯA CÓ giá trị thật — IF chưa chốt kênh liên hệ công khai (không có
 * domain/email hỗ trợ nào tồn tại sẵn trong repo, đã grep xác nhận 0 kết quả). Lời chào hàng bên
 * dưới KHÔNG có hiệu lực pháp lý cho tới khi điền kênh liên hệ thật — xem cảnh báo ở
 * `app/settings/licenses/page.tsx`. Corresponding Source thật (mã nguồn GNU LibreDWG + patch của
 * MLight Lee nếu có) cũng CHƯA được đóng gói sẵn để gửi — offer này hứa nhưng chưa có gì sau lưng.
 */
export const GPL_WRITTEN_OFFER = {
  contactPlaceholder: '[KÊNH LIÊN HỆ CHƯA CHỐT — điền trước khi phát hành thương mại]',
  validityYears: 3,
  textVi:
    'InteriorFlow cam kết cung cấp Corresponding Source (mã nguồn đầy đủ, có thể build lại) cho ' +
    'phần mềm GPL-3.0 nêu trên, miễn phí hoặc với chi phí không vượt quá chi phí sao chép vật lý ' +
    'hợp lý, cho bất kỳ ai sở hữu bản object code của IF. Lời chào hàng này có hiệu lực trong ' +
    'VÒNG TỐI THIỂU 3 NĂM kể từ ngày phát hành bản IF tương ứng. Liên hệ để yêu cầu:',
  textEn:
    'InteriorFlow offers to provide the Corresponding Source (complete, rebuildable source code) ' +
    'for the GPL-3.0 software listed above, free of charge or at a cost not exceeding the ' +
    'reasonable cost of physically performing the source distribution, to anyone who possesses ' +
    "the object code of InteriorFlow. This offer is valid for a MINIMUM OF 3 YEARS from the date " +
    'of the corresponding IF release. Contact to request:',
};

export interface OtherLicenseEntry {
  name: string;
  license: string;
  note: string;
}

/** §5 LICENSE-NOTES.md: các dep cần attribution rõ ràng (không copyleft, không chặn phát hành). */
export const OTHER_LICENSES: OtherLicenseEntry[] = [
  {
    name: 'jszip',
    license: 'MIT',
    note:
      'jszip cấp phép kép (MIT OR GPL-3.0-or-later) — IF CHỌN nhánh MIT, không dùng nhánh GPL. ' +
      'Không phát sinh nghĩa vụ conveying nào từ dep này.',
  },
  {
    name: 'sharp (và libvips)',
    license: 'LGPL-3.0-or-later',
    note:
      'Dynamic link, không sửa đổi mã nguồn thư viện — LGPL-3 cho phép dùng trong sản phẩm ' +
      'thương mại mà KHÔNG lây nhiễm giấy phép sang mã nguồn IF (khác GPL thường ở chỗ này).',
  },
  {
    name: 'Be Vietnam Pro',
    license: 'SIL Open Font License 1.1',
    note:
      'Font nhúng vào PDF xuất ra. Giữ nguyên bản upstream, giữ public/fonts/OFL.txt cạnh font, ' +
      'không bán font tách riêng, không đổi tên font. Copyright 2021 The Be Vietnam Pro Project Authors.',
  },
];
