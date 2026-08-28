/**
 * scripts/_cap-da-nhau.mjs — HAI CHỮ CÙNG DÒNG, NGHĨA LOẠI TRỪ NHAU.
 * Tách khỏi `soi-tu-dien.mjs` để CẢ MÁY SOI LẪN TEST cùng gọi một hàm — cùng khuôn
 * `_chu-thich.mjs` đã làm. Luật không có test là lời chúc; test gọi bản sao thứ hai của luật
 * thì test đó chứng minh bản sao, không chứng minh luật.
 *
 * ══ BA TRỤC — Hoà chuẩn hoá 29/08, ĐÈ bản đầu của tôi ══════════════════════════════════════
 * Bản đầu tôi lấy cặp «per-user ↔ localStorage» làm mâu thuẫn. SAI, và Hoà đưa phản ví dụ phá
 * được ngay:  "Thiết lập thuộc người dùng, lưu trong localStorage, chỉ có hiệu lực trên trình
 * duyệt hiện tại."  — câu này ĐÚNG HOÀN TOÀN mà cổng cũ báo đỏ.
 * Vì `per-user` nói về AI SỞ HỮU, còn `localStorage` nói về CẤT Ở ĐÂU. Hai câu hỏi khác nhau,
 * không đá nhau. Dữ liệu hoàn toàn có thể phân vùng theo `userId` mà vẫn chỉ sống trên một
 * trình duyệt. Ba trục phải tách rời:
 *
 *   ① Owner    — của ai:      user · project · workspace
 *   ② Storage  — cất ở đâu:   localStorage · IndexedDB · DB
 *   ③ Reach    — với tới đâu: browser-local · device-local · account-synced
 *
 * MÂU THUẪN THẬT nằm ở trục ③ chọi trục ②: hứa "đi theo tài khoản, đổi máy vẫn còn"
 * (account-synced) mà cất vào kho chỉ sống trong một trình duyệt. Đó mới là điều không thể
 * đồng thời đúng. Câu gốc `P-A-don-vi-ty-le.md:40` sai vì THIẾU TRỤC ③, không phải vì có
 * `per-user`.
 */

/** ③ CHẶN — hứa vươn tới nhiều máy, mà cất trong kho một-trình-duyệt. Không thể cùng đúng. */
export const CAP_DA_NHAU = [
  {
    ten: 'account-synced ↔ browser-local',
    // trục ③ hứa xuyên thiết bị. CỐ Ý KHÔNG có "per-user"/"theo người dùng" — đó là trục ①.
    a: /\b(account[-\s]?synced|server[-\s]?persisted|cross[-\s]?device)\b|đồng bộ (theo )?(tài khoản|giữa các máy|đa thiết bị)|đổi máy vẫn (còn|giữ)|xuyên thiết bị|máy nào (cũng|đăng nhập)/i,
    // trục ② kho chỉ sống trong một trình duyệt
    b: /\b(localStorage|sessionStorage|IndexedDB|browser[-\s]?local|device[-\s]?local)\b/i,
    vi_sao:
      'Hứa đi theo tài khoản (Reach = account-synced) mà cất trong kho một-trình-duyệt (Storage = browser-local). Chọn một.',
    pham_vi: ['docs/phieu-giao', 'docs/control', '.claude/skills'],
    ngoai_le: ['docs/phieu-giao/P-A-don-vi-ty-le.md'], // CA GỐC — giữ làm dấu vết
  },
];

/** ② CẢNH BÁO — nói Owner + Storage mà KHÔNG nói Reach. Đây đúng là chỗ câu gốc 16/08 hụt. */
export const THIEU_REACH = {
  ten: 'thiếu trục Reach',
  owner: /\bper[-\s]?user\b|theo (từng )?(người dùng|tài khoản|user)|thuộc (về )?người dùng/i,
  storage: /\b(localStorage|sessionStorage|IndexedDB)\b/i,
  reach: /\b(browser[-\s]?local|device[-\s]?local|account[-\s]?synced)\b|trình duyệt (này|hiện tại)|máy này|đổi máy|đồng bộ|chỉ có hiệu lực trên/i,
  vi_sao:
    'Nói CỦA AI và CẤT Ở ĐÂU nhưng không nói VƯƠN TỚI ĐÂU — người đọc tự suy, và suy sai là mất dữ liệu.',
};

/** @returns 'chan' | 'canh-bao' | null */
export function soiDong(dong, cap = CAP_DA_NHAU[0]) {
  if (cap.a.test(dong) && cap.b.test(dong)) return 'chan';
  if (
    THIEU_REACH.owner.test(dong) &&
    THIEU_REACH.storage.test(dong) &&
    !THIEU_REACH.reach.test(dong)
  )
    return 'canh-bao';
  return null;
}
