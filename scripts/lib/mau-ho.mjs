/**
 * scripts/lib/mau-ho.mjs — LÕI DÙNG CHUNG: đổi màu sang HSL và gom thành HỌ ACCENT.
 *
 * Vì sao tách ra: cùng một phép "gom hue thành họ" sắp có HAI mặt tiền —
 *   ① `cong-thiet-ke.mjs`  chấm BẢN VẼ  (`*.dc.html`, đọc hex trong nguồn)
 *   ② `soi-mat/cham-pattern.mjs` chấm MÀN APP THẬT (đọc màu đã tính từ trình duyệt)
 * Viết hai bản là đúng bệnh `may-soi-dong-dang` sinh ra để bắt: hai cỗ máy cùng bản chất, khác
 * tên, rồi phân kỳ mà không ai biết. Một lõi, hai mặt tiền.
 */

/** #rgb | #rrggbb → {h,s,l} (h theo độ, s/l 0..1) */
export function hexToHsl(hex) {
  const h6 = hex.length === 4 ? hex.replace(/[0-9a-f]/gi, (c) => (c === '#' ? '#' : c + c)) : hex;
  const r = parseInt(h6.slice(1, 3), 16) / 255,
    g = parseInt(h6.slice(3, 5), 16) / 255,
    b = parseInt(h6.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s, l };
}

/** `rgb(r, g, b)` / `rgba(r, g, b, a)` → {h,s,l,a}. Trả null nếu trong suốt hoàn toàn. */
export function rgbToHsl(str) {
  const m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.]+))?/.exec(str);
  if (!m) return null;
  const a = m[4] === undefined ? 1 : Number(m[4]);
  if (a === 0) return null; // trong suốt ⇒ không phải màu người dùng nhìn thấy
  const to = (n) => Math.max(0, Math.min(255, Math.round(Number(n)))).toString(16).padStart(2, '0');
  return { ...hexToHsl(`#${to(m[1])}${to(m[2])}${to(m[3])}`), a };
}

/**
 * Gom danh sách {h,s,l} thành các HỌ accent (cụm 30°, họ kề nhau nối lại).
 * `boQua(h,s,l)` để nơi gọi loại thang xám / màu nội dung / kênh ngữ nghĩa theo luật của mình —
 * lõi này KHÔNG tự quyết cái gì đáng bỏ, vì mỗi mặt tiền có bằng chứng khác nhau.
 */
export function gomHoAccent(mau, boQua = () => false) {
  const dem = new Map();
  for (const { h, s, l } of mau) {
    if (s < 0.25 || l < 0.08 || l > 0.95) continue; // thang xám/nền
    if (boQua(h, s, l)) continue;
    const cum = (Math.round(h / 30) * 30) % 360;
    dem.set(cum, (dem.get(cum) || 0) + 1);
  }
  const cums = [...dem.keys()].sort((a, b) => a - b);
  const ho = [];
  for (const c of cums) {
    const cuoi = ho[ho.length - 1];
    if (cuoi && (c - cuoi.toi === 30 || (c === 330 && cuoi.tu === 0))) { cuoi.toi = c; cuoi.n += dem.get(c); }
    else ho.push({ tu: c, toi: c, n: dem.get(c) });
  }
  return ho;
}

/**
 * Luật BỎ QUA chuẩn — dùng chung cho cả hai mặt tiền, vì đây chính là chỗ chúng dễ phân kỳ nhất.
 * 🔴 CA THẬT (05/09): bản đầu của `cham-pattern.mjs` KHÔNG mang theo hai luật này, nên nó kết tội
 * cam-cảnh-báo là một họ accent — cùng một màu, cùng một luật, hai cỗ máy phán khác nhau. Bắt được
 * ngay lượt chạy thứ hai (theme sáng), trước khi kịp có ai tin con số. Đó đúng là lý do tách lõi.
 */
export const CAM_CANH_BAO = (h) => h >= 15 && h <= 50;          // cam/hổ phách — kênh cảnh báo
export const VAT_LIEU = (h, s, l) => h >= 15 && h <= 55 && s < 0.45; // gỗ/đất trong ô mẫu
export const boQuaChuan = (h, s, l) => CAM_CANH_BAO(h) || VAT_LIEU(h, s, l);

/** Trần lần xuất hiện của MỘT họ — CHỈ dùng cho BẢN VẼ. Mặt tiền app cố ý không dùng; lý do
 * ghi tại `scripts/soi-mat/cham-pattern.mjs` (số lần xuất hiện trên màn app đi theo số phần tử
 * đang hiển thị, không theo ý đồ người vẽ). */
export const TRAN_MOI_HO = 12;   // >12 = đang rải màu, không còn là accent
export const CHUAN_MOI_HO = 8;   // 9–12 phải giải thích được là "một trạng thái chọn nhiều nét"
