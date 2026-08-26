/**
 * lib/site/khi-hau.ts — KHÍ HẬU CỦA ĐỊA ĐIỂM (§10). THUẦN, không đụng đĩa, không gọi mạng.
 *
 * ⛔ **KHÍ HẬU ≠ THỜI TIẾT — đây là ranh giới, không phải cách nói.**
 *   · KHÍ HẬU  = bối cảnh thiết kế DÀI HẠN (trung bình nhiều năm). Nó trả lời *"nhà này sẽ sống
 *     trong điều kiện nào suốt vòng đời"*.
 *   · THỜI TIẾT = trạng thái HÔM NAY. Nó trả lời *"chiều nay có mưa không"*.
 *   Trí tuệ thiết kế dùng cái thứ nhất. IF **KHÔNG dựng bảng điều khiển khí tượng** — không có
 *   trường "hiện tại", không có "dự báo", không có nút làm mới. Ranh giới này được khoá bằng
 *   `viPhamThoiTiet()` chứ không bằng lời dặn, vì lời dặn thì phiên sau bào mòn được.
 *
 * 🔴 **KHO NGUỒN KHÍ HẬU ĐANG RỖNG — CỐ Ý.** Repo chưa có bộ số liệu khí hậu nào kiểm chứng được,
 *   và luật cấm bịa: *thà rỗng thật còn hơn đầy giả*. Một bảng "nhiệt độ trung bình Hà Nội" gõ
 *   theo trí nhớ trông rất hợp lý và **không ai phát hiện được**, nhưng nó sẽ đẻ ra kết luận sai
 *   rồi đẻ tiếp đề xuất sai. Vì vậy `traKhiHau()` trả `null` cho tới khi có nguồn thật được cắm
 *   qua `dangKyNguonKhiHau()`. Mọi hàm suy dẫn dưới đây là HÀM THUẦN chạy trên dữ liệu ĐƯỢC ĐƯA
 *   VÀO — chúng không tự biết gì về nơi nào cả.
 *
 * [Đ2] Tái dùng, không đẻ mới: `SuThat`/`NguonGoc`/`ProvenanceFlag`/`PhamViDiaLy` lấy nguyên từ
 *   `./types`; tiền tố khoá `khi-hau.` khớp `Mien` đã khai ở `./anh-huong.ts`.
 */

import type { NguonGoc, PhamViDiaLy, ProvenanceFlag, SuThat } from './types';
import { coToaDo, type HoSoDiaDiem } from './types';

/** Mười hai tháng, **chỉ số 0 = tháng 1**. Dùng tuple để máy chặn mảng thiếu/thừa tháng. */
export type Thang12<T> = [T, T, T, T, T, T, T, T, T, T, T, T];

/** Bối cảnh bão — mùa bão của VÙNG, không phải cơn bão nào cụ thể (đó là thời tiết). */
export interface BoiCanhBao {
  /** Các tháng thường có bão (1..12). Rỗng = vùng không có mùa bão, `undefined` = chưa biết. */
  muaBaoThang: number[];
  ghiChu?: string;
}

/**
 * Hồ sơ khí hậu của một địa điểm. **Mọi trường đều tuỳ chọn** — thiếu là trạng thái hợp lệ (§5),
 * và hàm suy dẫn phải trả `null` chứ không được lấp chỗ trống.
 *
 * ⚠️ `phamVi` KHÔNG BAO GIỜ là `cong-truong`/`lan-can`: số liệu khí hậu là thống kê nhiều năm của
 * một trạm/ô lưới, không phải phép đo tại chân công trình. Khoá bằng `phamViHopLeKhiHau()`.
 */
export interface HoSoKhiHau {
  nhietDoTbThangC?: Thang12<number>;
  nhietDoMaxTbThangC?: Thang12<number>;
  nhietDoMinTbThangC?: Thang12<number>;
  doAmTbThangPc?: Thang12<number>;
  luongMuaThangMm?: Thang12<number>;
  /** Số giờ nắng trung bình mỗi tháng. */
  gioNangThangH?: Thang12<number>;
  /** Bức xạ mặt trời trên mặt ngang, kWh/m²/ngày, trung bình từng tháng. */
  buXaNgangThangKwhM2Ngay?: Thang12<number>;
  /** Cực trị nóng đã ghi nhận (°C) — dùng cho ca xấu nhất, không dùng làm số thiết kế thường. */
  cucTriNongC?: number;
  boiCanhBao?: BoiCanhBao;
  nguon?: NguonGoc;
  phamVi: PhamViDiaLy;
}

/** §14 — thang địa lý hợp lệ cho một số liệu khí hậu. */
export function phamViHopLeKhiHau(p: PhamViDiaLy): boolean {
  return p !== 'cong-truong' && p !== 'lan-can';
}

/* ═══════════════ §10 · CHẶN THỜI TIẾT LẺN VÀO ═══════════════ */

/**
 * Những mảnh tên trường mang nghĩa THỜI TIẾT. Trường nào chứa một trong số này là dấu hiệu
 * `HoSoKhiHau` đang bị biến thành bảng khí tượng — chặn ngay ở test, đừng đợi phát hiện trên UI.
 */
export const TU_CAM_THOI_TIET = [
  'homnay', 'hientai', 'bimgio', 'baygio', 'dubao', 'forecast', 'current', 'today', 'now',
  'realtime', 'live', 'lammoi', 'refresh', 'quantrac',
] as const;

/** Trả về danh sách tên trường VI PHẠM. Rỗng = sạch. Không ném lỗi — để nơi gọi tự quyết. */
export function viPhamThoiTiet(o: object): string[] {
  const chuan = (s: string) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/gi, '').toLowerCase();
  return Object.keys(o).filter((k) => {
    const c = chuan(k);
    return TU_CAM_THOI_TIET.some((t) => c.includes(t));
  });
}

/* ═══════════════ ĐƯỜNG CẮM NGUỒN THẬT (đang RỖNG) ═══════════════ */

/**
 * Một nguồn khí hậu cắm được. Bên cắm chịu trách nhiệm trả về `nguon` thật — không có `nguon`
 * thì dữ liệu ấy KHÔNG BAO GIỜ lên hạng `verified` (xem `nguonHopLe` ở `./types`).
 */
export interface NguonKhiHau {
  ten: string;
  tra(viDo: number, kinhDo: number): HoSoKhiHau | null;
}

const KHO_NGUON: NguonKhiHau[] = [];

export function dangKyNguonKhiHau(n: NguonKhiHau): void {
  KHO_NGUON.push(n);
}

/** Dọn kho — cho test chạy độc lập nhau. */
export function xoaNguonKhiHau(): void {
  KHO_NGUON.length = 0;
}

export function soNguonKhiHau(): number {
  return KHO_NGUON.length;
}

/**
 * Tra khí hậu cho một hồ sơ dự án. Trả `null` khi **chưa có toạ độ** hoặc **chưa cắm nguồn nào**.
 * ⛔ Tuyệt đối không có đường "ước lượng tạm" ở đây.
 */
export function traKhiHau(hoSo: HoSoDiaDiem): HoSoKhiHau | null {
  if (!coToaDo(hoSo)) return null;
  const vi = hoSo.viTri.viDo as number;
  const kinh = hoSo.viTri.kinhDo as number;
  for (const n of KHO_NGUON) {
    const kq = n.tra(vi, kinh);
    if (kq && phamViHopLeKhiHau(kq.phamVi)) return kq;
  }
  return null;
}

/* ═══════════════ HÀM SUY DẪN — THUẦN, CHẠY TRÊN DỮ LIỆU ĐƯỢC ĐƯA VÀO ═══════════════ */

function trungBinh(xs: readonly number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/** Tháng nóng nhất (1..12) theo nhiệt độ trung bình. `null` khi chưa có dữ liệu. */
export function thangNongNhat(kh: HoSoKhiHau): number | null {
  const t = kh.nhietDoTbThangC;
  if (!t) return null;
  let i = 0;
  for (let j = 1; j < 12; j++) if (t[j] > t[i]) i = j;
  return i + 1;
}

/** Tháng lạnh nhất (1..12). `null` khi chưa có dữ liệu. */
export function thangLanhNhat(kh: HoSoKhiHau): number | null {
  const t = kh.nhietDoTbThangC;
  if (!t) return null;
  let i = 0;
  for (let j = 1; j < 12; j++) if (t[j] < t[i]) i = j;
  return i + 1;
}

/** Biên độ nhiệt trong năm (°C) — chênh giữa tháng nóng nhất và lạnh nhất. */
export function bienDoNhietNam(kh: HoSoKhiHau): number | null {
  const t = kh.nhietDoTbThangC;
  if (!t) return null;
  return Math.max(...t) - Math.min(...t);
}

export function nhietDoTbNam(kh: HoSoKhiHau): number | null {
  return kh.nhietDoTbThangC ? trungBinh(kh.nhietDoTbThangC) : null;
}

export function doAmTbNam(kh: HoSoKhiHau): number | null {
  return kh.doAmTbThangPc ? trungBinh(kh.doAmTbThangPc) : null;
}

export function tongMuaNamMm(kh: HoSoKhiHau): number | null {
  return kh.luongMuaThangMm ? kh.luongMuaThangMm.reduce((a, b) => a + b, 0) : null;
}

export function tongGioNangNam(kh: HoSoKhiHau): number | null {
  return kh.gioNangThangH ? kh.gioNangThangH.reduce((a, b) => a + b, 0) : null;
}

/**
 * Ngưỡng mặc định để gọi một tháng là "tháng mưa" (mm).
 * ⚠️ Đây là **QUY ƯỚC LÀM VIỆC**, KHÔNG phải một chuẩn được ban hành — các tài liệu khí hậu nhiệt
 * đới dùng nhiều ngưỡng khác nhau. Vì vậy nó là THAM SỐ đổi được, và `muaMuaKho()` luôn ghi lại
 * ngưỡng đã dùng để người đọc biết con số này ra từ đâu.
 */
export const NGUONG_THANG_MUA_MM = 100;

export interface MuaMuaKho {
  thangMua: number[];
  thangKho: number[];
  nguongMm: number;
}

/** Phân mùa mưa/khô từ lượng mưa tháng. `null` khi chưa có dữ liệu mưa. */
export function muaMuaKho(kh: HoSoKhiHau, nguongMm = NGUONG_THANG_MUA_MM): MuaMuaKho | null {
  const m = kh.luongMuaThangMm;
  if (!m) return null;
  const thangMua: number[] = [];
  const thangKho: number[] = [];
  for (let i = 0; i < 12; i++) (m[i] >= nguongMm ? thangMua : thangKho).push(i + 1);
  return { thangMua, thangKho, nguongMm };
}

/** Bức xạ ngang trung bình năm (kWh/m²/ngày). */
export function buXaTbNam(kh: HoSoKhiHau): number | null {
  return kh.buXaNgangThangKwhM2Ngay ? trungBinh(kh.buXaNgangThangKwhM2Ngay) : null;
}

/* ═══════════════ ĐỔ RA SỰ THẬT (§3A) ═══════════════ */

/**
 * Hạng của một sự thật khí hậu: có `nguon` thì `verified`, không thì `inferred` kèm ghi chú nói
 * rõ còn thiếu gì. **Không có đường lên `measured`** — khí hậu không phải thứ người dùng tự đo.
 */
function suThatKh<T>(giaTri: T, kh: HoSoKhiHau, moTa: string): SuThat<T> {
  const co: ProvenanceFlag = kh.nguon ? 'verified' : 'inferred';
  return {
    giaTri,
    co,
    nguon: kh.nguon,
    ghiChu: kh.nguon ? undefined : `${moTa} — chưa khai nguồn số liệu khí hậu, cần đối chiếu trước khi tin`,
  };
}

/**
 * Chuyển hồ sơ khí hậu thành các SỰ THẬT có khoá `khi-hau.*` để cắm vào `HoSoDiaDiem.suThat`.
 * Trường nào thiếu thì **không có khoá tương ứng** — cấm sinh khoá với giá trị bịa.
 */
export function suThatKhiHau(kh: HoSoKhiHau): Record<string, SuThat<unknown>> {
  const ra: Record<string, SuThat<unknown>> = {};
  const nhiet = nhietDoTbNam(kh);
  if (nhiet !== null) ra['khi-hau.nhietDoTbNamC'] = suThatKh(nhiet, kh, 'nhiệt độ trung bình năm');
  const bienDo = bienDoNhietNam(kh);
  if (bienDo !== null) ra['khi-hau.bienDoNhietNamC'] = suThatKh(bienDo, kh, 'biên độ nhiệt năm');
  const am = doAmTbNam(kh);
  if (am !== null) ra['khi-hau.doAmTbNamPc'] = suThatKh(am, kh, 'độ ẩm trung bình năm');
  const mua = tongMuaNamMm(kh);
  if (mua !== null) ra['khi-hau.tongMuaNamMm'] = suThatKh(mua, kh, 'tổng lượng mưa năm');
  const nang = tongGioNangNam(kh);
  if (nang !== null) ra['khi-hau.gioNangNamH'] = suThatKh(nang, kh, 'số giờ nắng năm');
  const buXa = buXaTbNam(kh);
  if (buXa !== null) ra['khi-hau.buXaTbNamKwhM2Ngay'] = suThatKh(buXa, kh, 'bức xạ ngang trung bình năm');
  if (typeof kh.cucTriNongC === 'number') {
    ra['khi-hau.cucTriNongC'] = suThatKh(kh.cucTriNongC, kh, 'cực trị nóng đã ghi nhận');
  }
  const mm = muaMuaKho(kh);
  if (mm) ra['khi-hau.muaMuaKho'] = suThatKh(mm, kh, `phân mùa theo ngưỡng ${mm.nguongMm}mm`);
  if (kh.boiCanhBao) ra['khi-hau.boiCanhBao'] = suThatKh(kh.boiCanhBao, kh, 'bối cảnh mùa bão');
  return ra;
}
