/**
 * lib/ffe/parse-number.ts — MỘT bộ đọc số cho mọi ô người dùng gõ (06/08).
 *
 * ─── VÌ SAO TÁCH RA ─────────────────────────────────────────────────────────────────────────
 * IF từng có HAI bộ đọc số, và bộ yếu hơn đứng đúng chỗ tính tiền:
 *   · `parseNumberCell` (cửa nhập Excel, `lib/materials/warehouse/apply-import.ts`) đọc đúng
 *     `1.200 → 1200`, `1.234,5 → 1234.5`, `(1.500.000) → -1500000`, và TỪ CHỐI `2.45tr`/`50k`;
 *   · `normalizeQty` (`lib/ffe/item.ts`) tự bóc `[^\d.,-]` rồi `replace(',', '.')` — đo được
 *     `normalizeQty('1.200','cai') = 1` · `('2,450','cai') = 2` · `('1.234.567','cai') = null`.
 * Hậu quả đã chạy thật: hồ sơ FF&E ra `1.2 m2 × 250.000 = 300.000đ` thay vì
 * `1200 × 250.000 = 300.000.000đ`, **0 lỗi 0 cảnh báo** — sai 1000 lần, im lặng.
 * Một cỗ máy đọc số, không hai. File này là cỗ máy đó; `apply-import.ts` và `item.ts` đều gọi nó.
 *
 * File THUẦN: không React/DOM/fetch — chạy được bằng sucrase-node.
 *
 * ─── LUẬT ĐỌC (giữ nguyên 100% hành vi bản `parseNumberCell` đã có test) ─────────────────────
 * Nhận: `2.450.000`, `2,450,000`, `2 450 000`, `2450000 VND`, `2.450.000 đ`, `1.234,5`,
 * `1,234.5`, `1500 mm`, `12 cái`, `(1.500.000)` (âm theo quy ước kế toán).
 * TỪ CHỐI (trả `undefined` — đường báo lỗi/cảnh báo của caller): `2.45tr`, `2tr5`, `1,5 triệu`,
 * `50k`, `1e3`, `50%`, `1,5m`, `liên hệ`, `1.234.5`.
 * Dạng nhập nhằng thì thà TỪ CHỐI ỒN ÀO còn hơn đoán bừa: số sai mà trông như đúng nguy hiểm
 * hơn hẳn số bị từ chối (người dùng sửa được cái thứ hai, không thấy cái thứ nhất).
 */

/** Đuôi ĐƯỢC PHÉP bỏ đi vì KHÔNG đổi ĐỘ LỚN con số: ký hiệu tiền tệ, đơn vị đếm, và `mm` (đúng
 * bằng đơn vị của chính cột kích thước). Danh sách CÓ HẠN, cố ý.
 * ⛔ KHÔNG có `m`/`cm`/`m2` ở đây: cột khai là mm mà ô ghi `1,5m` thì con số thật là 1500, bóc chữ
 * `m` đi rồi nhận 1,5 chính là kiểu sai âm thầm mà bản vá này sinh ra để diệt. Thà từ chối ồn ào. */
const HARMLESS_NUMBER_SUFFIX = /^(đ|d|vnd|₫|\$|vnđ|dong|đồng|mm|cái|cai|chiếc|chiec|bộ|bo|pcs)$/i;

/**
 * Đọc một ô SỐ do người dùng gõ. `undefined` = "không đọc chắc được" — caller PHẢI báo (lỗi dòng
 * hoặc cảnh báo), tuyệt đối không tự thay bằng 0/1.
 *
 * Cách đọc: bỏ ký hiệu tiền tệ + chữ cái + khoảng trắng → còn lại chỉ số/dấu. Nếu có CẢ `.` và
 * `,` thì dấu ĐỨNG SAU là dấu thập phân (hợp cả `1.234,5` kiểu VN lẫn `1,234.5` kiểu Anh–Mỹ).
 * Nếu chỉ có một loại dấu và nó phân nhóm 3 chữ số (`2.450.000`) thì đó là dấu ngăn NGHÌN.
 *
 * 🔴 Lịch sử vá (giữ nguyên, đừng làm lại vòng cũ):
 *  ⑥ 06/08 — `'2.450.000 đ'` từng trả `undefined` ⇒ VỨT CẢ DÒNG. Bảng giá NCC Việt ghi kèm
 *    "đ"/"VND" là chuyện thường; vứt cả món vì cái đuôi tiền tệ là quá tay.
 *  🔴 vòng 2 06/08 — bản vá ⑥ lại bóc SẠCH mọi chữ trước khi đọc, nên đuôi ĐỘ LỚN bị nuốt và ra
 *    số sai KHÔNG báo gì: `2.45tr` → 2,45đ · `2tr5` → 25đ · `50k` → 50đ · `1e3` → 13 ·
 *    `(1.500.000)` → **+1.500.000** (lách luôn chốt giá-âm vì dấu ngoặc đã bị bóc). Nay chỉ bỏ
 *    những đuôi KHÔNG đổi độ lớn; còn lại từ chối. Hậu tố độ lớn (tr/triệu/k/tỷ) cố ý CHƯA hỗ trợ
 *    — quy đổi ngầm số tiền là việc phải Hoà chốt, không phải thứ tự quyết trong một bản vá.
 */
export function parseNumberCell(v: string): number | undefined {
  const raw = v.trim();
  if (!raw) return undefined;

  const accounting = /^\(\s*[\d.,\s]+\s*\)$/.test(raw); // (1.500.000) = âm, quy ước kế toán
  const core = accounting ? raw.replace(/[()]/g, '') : raw;
  const leftover = core.replace(/[\d.,\-\s ]/g, '').trim();
  if (leftover && !HARMLESS_NUMBER_SUFFIX.test(leftover)) return undefined;

  let s = core.replace(/[^\d.,\-]/g, '');
  if (!s || !/\d/.test(s)) return undefined;
  if (accounting) s = `-${s}`;

  const lastDot = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');
  if (lastDot >= 0 && lastComma >= 0) {
    const decimalSep = lastDot > lastComma ? '.' : ',';
    const groupSep = decimalSep === '.' ? ',' : '.';
    s = s.split(groupSep).join('').replace(decimalSep, '.');
  } else {
    const sep = lastDot >= 0 ? '.' : lastComma >= 0 ? ',' : '';
    if (sep) {
      const parts = s.split(sep);
      // mọi nhóm sau dấu đều đúng 3 chữ số ⇒ dấu ngăn NGHÌN (2.450.000); ngược lại ⇒ thập phân
      const isGrouping = parts.length > 1 && parts.slice(1).every((p) => /^\d{3}$/.test(p));
      s = isGrouping ? parts.join('') : parts.join('.');
    }
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}
