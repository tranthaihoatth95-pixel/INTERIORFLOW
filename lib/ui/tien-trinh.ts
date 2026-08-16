/**
 * lib/ui/tien-trinh.ts — [marker: tienTrinh] LÕI CHUNG của mọi chỉ báo tiến trình trong IF.
 *
 * MỘT lõi, NHIỀU mặt tiền (TRIET-LY-IF **[T2]** "một cỗ máy, nhiều mặt tiền"): `LightArc` là
 * mặt tiền VÒNG CUNG, `LightBar` là mặt tiền THANH. Cả hai đọc chung file này — cấm đẻ bộ
 * logic thứ hai. File này KHÔNG sáng tác mới: nó rút phần chung vốn đã sống trong `LightArc`
 * ra một chỗ (**[Đ2]** nhìn-vào-trong-trước — chưng cất/nối dây, không sáng tác trùng).
 *
 * ⛔ LUẬT ĐẮT NHẤT — CẤM BỊA PHẦN TRĂM (Hoà chốt 16/08, 00-CHOT).
 *   Việc ĐO ĐƯỢC (tải tệp · xuất PDF · hàng đợi render) chạy theo SỐ THẬT.
 *   Việc KHÔNG ĐO ĐƯỢC (gọi AI · dò tệp · chờ máy chủ) KHÔNG có con số nào.
 *   Người dùng bắt được một lần app bịa % thì mất niềm tin vào MỌI con số khác —
 *   mà IF bán đúng cái "con số truy được về một nguồn" ([N1] human-centric, khai thật).
 *
 * ⭐ FILE NÀY THIẾT KẾ ĐỂ VIỆC BỊA SỐ *KHÓ XẢY RA*, không phải để nhắc nhau đừng bịa:
 *   ① `TienTrinh` là **union phân biệt** — nhánh không-đo-được KHÔNG CÓ trường `pct`.
 *      Đọc `t.pct` mà chưa hẹp kiểu ⇒ TypeScript báo lỗi ngay lúc biên dịch.
 *   ② `tuPhanSo(done, total)` với `total ≤ 0` trả **không đo được**, KHÔNG trả 0%.
 *      (Mẹo `done / Math.max(1, total)` đang dùng vài nơi cho ra 0% giả khi total=0.)
 *   ③ `phanTramHienThi()` trả `null` khi không đo được ⇒ chỗ render không có gì để in.
 *   ④ `ariaTienTrinh()` TỰ BỎ `aria-valuenow` khi không đo được (đúng chuẩn ARIA cho
 *      indeterminate) ⇒ không thể lỡ tay phát ra một con số cho trình đọc màn hình.
 *   ⑤ File này **CỐ Ý KHÔNG CÓ** hàm ước lượng thời gian còn lại. Muốn hiện "còn X phút"
 *      thì nơi gọi phải CÓ SẴN con số đó và tự truyền vào — lõi không suy hộ.
 */

/**
 * Trạng thái tiến trình. Hai nhánh, KHÔNG có nhánh thứ ba "đo được nhưng chưa biết %".
 * Chưa biết % nghĩa là chưa đo được — không có vùng xám ở giữa để lách.
 */
export type TienTrinh =
  | { readonly doDuoc: true; readonly pct: number }
  | { readonly doDuoc: false };

/** Hằng dùng chung cho nhánh không đo được — khỏi rắc `{ doDuoc: false }` khắp nơi. */
export const KHONG_DO_DUOC: TienTrinh = { doDuoc: false };

/** Kẹp về 0..100. Số vô nghĩa (NaN/Infinity) coi như KHÔNG đo được, không kẹp về 0. */
function kep(v: number): number {
  return Math.max(0, Math.min(100, v));
}

/**
 * Đọc tiến trình từ một con số phần trăm 0..100.
 * `undefined` · `null` · `NaN` · `±Infinity` ⇒ **không đo được** (đúng nghĩa "chưa có số thật").
 */
export function tuPhanTram(value?: number | null): TienTrinh {
  if (value == null || typeof value !== 'number' || !Number.isFinite(value)) return KHONG_DO_DUOC;
  return { doDuoc: true, pct: kep(value) };
}

/**
 * Đọc tiến trình từ phân số `done / total` (ca hay gặp nhất: khung i/n, trang i/n, job i/n).
 *
 * `total ≤ 0` hoặc số vô nghĩa ⇒ **không đo được**. Đây là điểm khác biệt cố ý so với
 * `done / Math.max(1, total)`: chưa biết tổng thì không có tiến trình để nói, chứ không phải 0%.
 */
export function tuPhanSo(done?: number | null, total?: number | null): TienTrinh {
  if (done == null || total == null) return KHONG_DO_DUOC;
  if (!Number.isFinite(done) || !Number.isFinite(total)) return KHONG_DO_DUOC;
  if (total <= 0) return KHONG_DO_DUOC;
  return { doDuoc: true, pct: kep((done / total) * 100) };
}

/**
 * Chuỗi phần trăm để HIỂN THỊ, hoặc `null` khi không đo được.
 * Trả `null` chứ không trả `''` để chỗ gọi buộc phải rẽ nhánh, không lỡ in chuỗi rỗng
 * vào đúng khe đáng ra là con số.
 */
export function phanTramHienThi(t: TienTrinh): string | null {
  return t.doDuoc ? `${Math.round(t.pct)}%` : null;
}

/** Thuộc tính ARIA của một chỉ báo tiến trình. `aria-valuenow` chỉ có khi ĐO ĐƯỢC. */
export interface AriaTienTrinh {
  role: 'progressbar';
  'aria-label': string;
  'aria-valuemin': 0;
  'aria-valuemax': 100;
  'aria-valuenow'?: number;
}

/**
 * Sinh thuộc tính ARIA đúng chuẩn cho cả hai loại.
 * Không đo được (indeterminate) ⇒ **bỏ hẳn `aria-valuenow`** — đó là cách WAI-ARIA khai
 * "đang chạy nhưng chưa biết tới đâu". Đưa 0 vào là nói dối trình đọc màn hình.
 */
export function ariaTienTrinh(t: TienTrinh, label: string): AriaTienTrinh {
  const chung = {
    role: 'progressbar',
    'aria-label': label,
    'aria-valuemin': 0,
    'aria-valuemax': 100,
  } as const;
  return t.doDuoc ? { ...chung, 'aria-valuenow': Math.round(t.pct) } : { ...chung };
}

/** Kết quả chia vạch cho mặt tiền THANH. */
export interface ChiaVach {
  /** Số vạch đã sáng, 0..soVach. Luôn 0 khi không đo được. */
  readonly soVachSang: number;
  /**
   * Chỉ số vạch mang ĐIỂM SÁNG ĐẦU MÚT (0-based), hoặc `null` khi không có mút —
   * lúc chưa đo được, lúc 0%, và lúc đã 100% (xong rồi thì không còn "đang ở đâu").
   */
  readonly viTriMut: number | null;
}

/**
 * Chia thanh thành `soVach` vạch rồi tính bao nhiêu vạch sáng + vạch nào là đầu mút.
 *
 * Mỗi vạch là MỘT ĐƠN VỊ ĐỌC ĐƯỢC, điểm sáng nói *đang ở đâu* — chi tiết MANG TIN,
 * không phải hoa văn (nguyên tắc `simpleCoChiTiet`, chốt 16/08).
 *
 * Làm tròn xuống có sàn: đã chạy được chút xíu (pct > 0) thì luôn sáng ÍT NHẤT 1 vạch —
 * để "vừa bắt đầu" khác hẳn "chưa bắt đầu". Ngược lại chỉ đủ 100% mới sáng hết,
 * không cho làm tròn lên thành đầy khi thật ra còn thiếu.
 */
export function chiaVach(t: TienTrinh, soVach: number): ChiaVach {
  const n = Number.isFinite(soVach) ? Math.max(1, Math.floor(soVach)) : 1;
  if (!t.doDuoc) return { soVachSang: 0, viTriMut: null };
  if (t.pct <= 0) return { soVachSang: 0, viTriMut: null };
  if (t.pct >= 100) return { soVachSang: n, viTriMut: null };
  const sang = Math.max(1, Math.min(n - 1, Math.floor((t.pct / 100) * n)));
  return { soVachSang: sang, viTriMut: sang - 1 };
}

/* ════════════════════════════════════════════════════════════════════════════════════════════
   VỆT SÁNG — ánh sáng MANG TIN, không phải cho đẹp
   ════════════════════════════════════════════════════════════════════════════════════════════
   Hoà 16/08: *"phần hiệu ứng tiến trình nên thêm sáng"*. Luật NT-11 + LightState: ánh sáng CHỈ
   mang nghĩa, cấm glow tĩnh trang trí ⇒ "thêm sáng" phải đọc là **ánh sáng nói thêm được điều
   gì**, không phải tăng độ chói.

   Cách giải: **sáng nhất ở ĐẦU MÚT, nguội dần về sau** — như vệt sao chổi. Ba tin đọc được từ
   MỘT khung hình đứng yên (không cần xem chuyển động):
     ① ĐANG Ở ĐÂU  — chỗ chói nhất là chỗ việc đang diễn ra ngay lúc này
     ② ĐI HƯỚNG NÀO — vệt nằm PHÍA SAU mút, nên nhìn phát biết chạy về bên nào
     ③ NHANH HAY CHẬM — vệt DÀI = đang chạy nhanh, vệt ngắn = ì ạch (mượn quy ước nhoè-chuyển-động)

   ⭐ Hệ quả cố ý: **xong (100%) thì KHÔNG có vệt** (`viTriMut === null` ⇒ mọi cường độ = 0).
   Vệt là dấu hiệu *đang có việc xảy ra*; xong rồi thì không còn gì đang xảy ra để mà sáng.
   Nhờ vậy nó không thể tụt thành trang trí — trang trí thì lúc nào cũng sáng.
   ════════════════════════════════════════════════════════════════════════════════════════════ */

/** Vệt ngắn nhất — dưới mức này thì mút trông trơ trọi, không đọc ra hướng. */
export const VET_NGAN_NHAT = 2;

/**
 * Độ dài vệt sáng (tính bằng SỐ VẠCH), suy từ TỐC ĐỘ thật giữa hai lần đo.
 *
 * Đây là chỗ tin ③ được mã hoá. Số liệu vào là hai lần đọc `%` cách nhau `dtMs` — tức là
 * **đo thật**, không phải hằng số cho đẹp. Không đủ dữ kiện (lần đầu · thời gian ≤ 0 · lùi lại)
 * thì trả vệt ngắn nhất, KHÔNG đoán bừa một độ dài — cùng tinh thần "không có số thì đừng bịa".
 */
export function doDaiVet(deltaPct: number, dtMs: number, soVach: number): number {
  const n = Number.isFinite(soVach) ? Math.max(1, Math.floor(soVach)) : 1;
  // Trần = 1/5 thanh: dài hơn nữa thì vệt nuốt mất phần "đã chạy xong", mất tin ①.
  const tran = Math.max(VET_NGAN_NHAT, Math.floor(n / 5));
  if (!Number.isFinite(deltaPct) || !Number.isFinite(dtMs)) return VET_NGAN_NHAT;
  if (dtMs <= 0 || deltaPct <= 0) return VET_NGAN_NHAT;
  const vachMoiGiay = ((deltaPct / 100) * n) / (dtMs / 1000);
  const dai = Math.round(VET_NGAN_NHAT + vachMoiGiay * 0.6);
  return Math.max(VET_NGAN_NHAT, Math.min(tran, dai));
}

/**
 * Cường độ sáng của vạch thứ `i`, thang 0..1 — `1` ở đúng đầu mút, giảm đều về `0` ở cuối vệt.
 *
 * `0` KHÔNG có nghĩa "tắt": vạch đã chạy qua vẫn sáng bằng màu nhấn nền: `0` nghĩa là "đã nguội,
 * về mức nền". Nơi vẽ dùng số này để pha màu và để giãn quầng sáng — pha về phía `--t1` (màu mực
 * của theme) chứ không pha về trắng, xem `LightBar.tsx`.
 */
export function cuongDoVach(i: number, viTriMut: number | null, doDaiVetVach: number): number {
  if (viTriMut == null) return 0; // chưa bắt đầu, hoặc đã xong — không có gì "đang xảy ra"
  if (!Number.isFinite(i) || !Number.isFinite(doDaiVetVach)) return 0;
  const khoangCach = viTriMut - i;
  if (khoangCach < 0) return 0; // vạch chưa chạy tới
  const dai = Math.max(1, Math.floor(doDaiVetVach));
  if (khoangCach >= dai) return 0; // đã nguội hẳn
  return 1 - khoangCach / dai;
}
