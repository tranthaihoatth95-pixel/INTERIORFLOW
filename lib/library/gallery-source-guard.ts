// lib/library/gallery-source-guard.ts — CHẶN PINTEREST cho mọi ô nhập URL trong vùng Thư viện
// (phiếu `gallery-lien-nganh` ④). Hàm THUẦN (không DOM) — test bằng sucrase-node.
//
// Lý do chặn (①  bối cảnh phiếu): KTS tìm cảm hứng qua Pinterest/Google ra ảnh không rõ nguồn,
// không rõ giấy phép, không tái dùng được cho hồ sơ khách — đối lập trực tiếp với luật ③
// "ảnh THIẾU nguồn/giấy phép không vào được bộ sưu tập". Chặn ở CỬA NHẬP thay vì lọc sau.

export interface UrlGuardResult {
  ok: boolean;
  /** Thông điệp song ngữ theo SPEC-NGON-NGU-CHI-DAN: hành động trước, lý do + hướng thay thế,
   * không jargon nội bộ. Rỗng khi `ok`. */
  message: [string, string];
}

const OK: UrlGuardResult = { ok: true, message: ['', ''] };

/** `host` khớp `pinterest.<tld...>` (mọi miền quốc gia: .com/.co.uk/.de/.jp…), `www.pinterest.*`,
 * hoặc rút gọn `pin.it`. So khớp theo ĐUÔI domain, không dùng `includes()` (tránh chặn nhầm domain
 * lạ vô tình chứa chữ "pinterest" ở path/subdomain khác chủ). */
function isPinterestHost(host: string): boolean {
  const h = host.toLowerCase();
  return h === 'pin.it' || h.endsWith('.pin.it') || /(^|\.)pinterest\.[a-z.]+$/i.test(h);
}

/** Kiểm 1 URL nguồn trước khi cho vào ô nhập. Rỗng/không hợp lệ/pinterest → `ok:false` kèm thông
 * điệp gợi ý hướng thay thế (kho CC0/Unsplash đã tải sẵn — đúng seed `scripts/seed-library-minh-hoa.ts`). */
export function checkGallerySourceUrl(raw: string): UrlGuardResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, message: ['Dán một đường dẫn nguồn trước đã.', 'Paste a source link first.'] };
  }
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { ok: false, message: ['Đường dẫn không đọc được — kiểm tra lại.', "That link doesn't look valid — check it again."] };
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, message: ['Chỉ nhận đường dẫn http/https.', 'Only http/https links are accepted.'] };
  }
  if (isPinterestHost(url.hostname)) {
    return {
      ok: false,
      message: [
        'Pinterest không dùng được — ảnh ở đó không rõ nguồn, không rõ giấy phép. Dùng kho CC0/Unsplash đã tải sẵn.',
        "Pinterest links aren't accepted — sources and licenses there are unclear. Use the CC0/Unsplash store instead.",
      ],
    };
  }
  return OK;
}
