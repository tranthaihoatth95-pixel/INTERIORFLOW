/**
 * lib/ui/so-cuc-bo.ts — [marker: soCucBo] LÕI CHUNG của mọi "con số hiện ngay cạnh điểm thao tác".
 *
 * MỘT lõi, BA mặt tiền ([T2] một cỗ máy, nhiều mặt tiền):
 *   ① 2D CHÍNH XÁC — thước + vạch + số lớn ngay cạnh chỗ đang đo/sửa
 *   ② 3D ĐỔI CỠ    — dải giá trị chạm, chiều đang sửa được nhấn, chiều phụ lùi lại
 *   ③ HÍT NAM CHÂM — cùng phép tính đó nói "đang hít vào đâu, còn cách bao xa"
 * Ba việc này trước nay nghe như ba tính năng khác nhau; bản chất chỉ là MỘT: chiếu một giá
 * trị liên tục lên một thước có mốc, rồi nói xem nó đang ở đâu so với mốc gần nhất.
 *
 * [Đ2] NHÌN VÀO TRONG TRƯỚC — grep trước khi dựng: `lib/cad/` có bắt điểm hình học của bản vẽ
 * (toạ độ thật, đơn vị mm), file này KHÔNG đụng vào đó và KHÔNG thay nó. Đây là tầng TRÌNH BÀY
 * con số cho mắt người: chia vạch, chọn mốc để nhấn, tính lực hít để phản hồi cho tay. Hai
 * tầng khác vai — trộn vào nhau là lẫn "đo đúng" với "hiện đẹp".
 *
 * ⛔ KHÔNG LÀM TRÒN HỘ Ở LÕI. Lõi giữ số thật; làm tròn là việc của lúc hiển thị, và phải hiện
 * rõ đơn vị. Cùng tinh thần với `tien-trinh.ts`: lõi không bịa, không suy hộ nơi gọi.
 * ⛔ KHÔNG TỰ CHỌN ĐƠN VỊ. Đơn vị + tỉ lệ là chuyện cấp toàn app (chốt 15/08), nơi gọi truyền vào.
 */

/* ════════════════════════════════════════════════════════════════════════════════════════════
   ① THƯỚC — chia vạch
   ════════════════════════════════════════════════════════════════════════════════════════════ */

export interface Vach {
  /** Giá trị thật tại vạch (đơn vị do nơi gọi quy định). */
  readonly giaTri: number;
  /** Vạch CHÍNH (dài, có số) hay vạch phụ (ngắn, không số). */
  readonly chinh: boolean;
}

/**
 * Chia một khoảng thành vạch. `moiVachChinh` = cứ bao nhiêu vạch thì có một vạch chính.
 *
 * Trả mảng RỖNG khi tham số vô nghĩa (bước ≤ 0, khoảng ngược, số không hữu hạn) — không dựng
 * bừa một cái thước sai. Thước sai còn tệ hơn không có thước: nó trông như đo được.
 */
export function vachThuoc(
  min: number,
  max: number,
  buoc: number,
  moiVachChinh = 5,
): Vach[] {
  if (![min, max, buoc].every(Number.isFinite)) return [];
  if (buoc <= 0 || max <= min) return [];
  // Trần cứng: thước quá dày thì mắt đọc thành một mảng xám, mất hết tin. Thà không vẽ.
  const soVach = Math.floor((max - min) / buoc) + 1;
  if (soVach > 4000) return [];
  const nhip = Number.isFinite(moiVachChinh) ? Math.max(1, Math.floor(moiVachChinh)) : 1;
  const ra: Vach[] = [];
  for (let i = 0; i < soVach; i += 1) {
    ra.push({ giaTri: min + i * buoc, chinh: i % nhip === 0 });
  }
  return ra;
}

/** Vị trí 0..1 của một giá trị trên thước — dùng để đặt con trỏ/nhãn. Kẹp trong [0,1]. */
export function viTriTrenThuoc(giaTri: number, min: number, max: number): number {
  if (![giaTri, min, max].every(Number.isFinite) || max <= min) return 0;
  return Math.max(0, Math.min(1, (giaTri - min) / (max - min)));
}

/* ════════════════════════════════════════════════════════════════════════════════════════════
   ② HÍT NAM CHÂM — phản hồi cho tay, dùng chung cho bắt điểm 2D lẫn đích neo/dock
   ════════════════════════════════════════════════════════════════════════════════════════════ */

export interface KetQuaHut {
  /** Có đang trong tầm hít không. */
  readonly dangHut: boolean;
  /** Giá trị của mốc bị hít vào, hoặc `null` khi ngoài tầm. */
  readonly dich: number | null;
  /** Khoảng cách tới mốc đó (luôn ≥ 0), hoặc `null` khi không có mốc nào. */
  readonly khoangCach: number | null;
  /**
   * LỰC HÍT 0..1 — `1` là trùng khít, `0` là vừa chạm mép tầm hít.
   * Đây là con số nơi vẽ dùng để tăng dần dấu hiệu: càng gần thì đích càng sáng lên, chứ
   * KHÔNG phải bật-tắt phựt một cái. Hít là chuyện liên tục, phản hồi cũng phải liên tục.
   */
  readonly luc: number;
}

export const KHONG_HUT: KetQuaHut = { dangHut: false, dich: null, khoangCach: null, luc: 0 };

/**
 * Tìm mốc gần nhất trong tầm `nguong` và tính lực hít.
 *
 * ⛔ KHÔNG tự dời giá trị. Lõi chỉ NÓI "đang hít vào đâu, mạnh cỡ nào"; việc có thật sự nhảy
 * vào mốc hay không là quyết định của nơi gọi. Tách vậy để phản hồi thị giác chạy được kể cả
 * khi người dùng đang giữ phím bỏ-bắt-điểm.
 */
export function hutNamCham(
  giaTri: number,
  cacDich: readonly number[],
  nguong: number,
): KetQuaHut {
  if (!Number.isFinite(giaTri) || !Number.isFinite(nguong) || nguong <= 0) return KHONG_HUT;
  let gan: number | null = null;
  let d = Number.POSITIVE_INFINITY;
  for (const dich of cacDich) {
    if (!Number.isFinite(dich)) continue;
    const k = Math.abs(dich - giaTri);
    if (k < d) {
      d = k;
      gan = dich;
    }
  }
  if (gan == null || d > nguong) return KHONG_HUT;
  return { dangHut: true, dich: gan, khoangCach: d, luc: 1 - d / nguong };
}

/* ════════════════════════════════════════════════════════════════════════════════════════════
   ③ NHẤN CHIỀU ĐANG SỬA — mặt tiền 3D đổi cỡ
   ════════════════════════════════════════════════════════════════════════════════════════════ */

export const CHIEU = ['rong', 'sau', 'cao'] as const;
export type Chieu = (typeof CHIEU)[number];

export const TEN_CHIEU: Readonly<Record<Chieu, string>> = {
  rong: 'Rộng',
  sau: 'Sâu',
  cao: 'Cao',
};

export interface OChieu {
  readonly chieu: Chieu;
  readonly giaTri: number;
  /** Chiều đang được sửa — nhấn lên. Các chiều còn lại LÙI LẠI, không biến mất. */
  readonly nhanManh: boolean;
}

/**
 * Xếp ba chiều, nhấn đúng chiều đang sửa.
 *
 * ⭐ Chiều phụ LÙI chứ KHÔNG ẨN: người dựng cần thấy tỉ lệ giữa ba chiều ngay lúc kéo, mà giấu
 * đi thì mất luôn thứ đó. Đây là chỗ dễ làm sai vì "giấu cho gọn" nghe hợp lý.
 * `dangSua = null` (chưa kéo chiều nào) ⇒ không chiều nào được nhấn, cả ba ngang nhau.
 */
export function xepChieu(
  soDo: Readonly<Record<Chieu, number>>,
  dangSua: Chieu | null,
): OChieu[] {
  return CHIEU.map((chieu) => ({
    chieu,
    giaTri: soDo[chieu],
    nhanManh: dangSua === chieu,
  }));
}

/* ════════════════════════════════════════════════════════════════════════════════════════════
   ④ VÒNG ĐỜI — hiện khi đang sửa, LÙI ĐI khi chốt xong
   ════════════════════════════════════════════════════════════════════════════════════════════ */

export const PHA_SO = ['an', 'dangSua', 'vuaChot'] as const;
export type PhaSo = (typeof PHA_SO)[number];

/**
 * Con số cục bộ CHỈ sống lúc đang có việc, rồi lùi đi. Nó KHÔNG phải một ô thông tin thường trực.
 *
 * `vuaChot` là pha ngắn giữa "vừa buông tay" và "biến mất": giữ số nán lại một nhịp để mắt kịp
 * xác nhận kết quả, rồi mới lùi. Không có pha này thì số tắt phựt lúc buông tay, người dùng
 * không kịp đọc con số cuối — đúng cái họ vừa nhọc công chỉnh.
 */
export function phaSo(dangKeo: boolean, vuaBuong: boolean): PhaSo {
  if (dangKeo) return 'dangSua';
  if (vuaBuong) return 'vuaChot';
  return 'an';
}

/** Con số có được VẼ RA ở pha này không. */
export function coHien(pha: PhaSo): boolean {
  return pha !== 'an';
}
