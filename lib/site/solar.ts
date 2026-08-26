/**
 * lib/site/solar.ts — HÌNH HỌC MẶT TRỜI THEO HỒ SƠ ĐỊA ĐIỂM (§11 · §25).
 *
 * ⛔ **KHÔNG hỏi LLM tính góc nắng.** Toàn bộ số ở đây là TẤT ĐỊNH.
 * [Đ2] KHÔNG viết lại thuật toán: `lib/three/lighting.ts#sunFromDateTime` đã cài NOAA và đã có
 * test đối chiếu bảng. File này chỉ là CỬA NỐI giữa miền Địa Điểm và bộ tính sẵn có — nó thêm
 * đúng ba thứ mà nơi kia không có: đọc toạ độ từ hồ sơ dự án, suy múi giờ, và bình minh/hoàng hôn.
 *
 * ⚠️ QUY ƯỚC PHƯƠNG VỊ dùng CHUNG với `lighting.ts`: độ, THEO CHIỀU KIM ĐỒNG HỒ TỪ BẮC
 * (0=Bắc · 90=Đông · 180=Nam · 270=Tây). Đổi quy ước ở một phía là lật gương mọi phân tích nắng.
 */

// ⚠️ IMPORT TƯƠNG ĐỐI, KHÔNG DÙNG `@/` — CÓ LÝ DO, ĐỪNG "DỌN" LẠI THÀNH ALIAS:
// bộ chạy test của repo là `sucrase-node` (xem `package.json` script `test`), nó **không phân
// giải alias `@/`**. Đây là *value import* nên nó sinh `require()` thật lúc chạy ⇒ alias làm
// MỌI test chạm tệp này gãy ngay lúc nạp. (`types.ts` dùng `@/` vẫn sống vì đó là `import type`
// — sucrase xoá hẳn, không sinh require.) `lib/three/lighting.ts` cũng dùng import tương đối.
// 🔴 Lỗi này từng lọt cổng: `npm test | grep 'FAIL -'` đếm ra 0 vì tệp CHẾT LÚC NẠP thì không
// in dòng FAIL nào — phải soi MÃ THOÁT (`npm test; echo $?`), đừng tin grep.
import { sunFromDateTime } from '../three/lighting';
import { coToaDo, type HoSoDiaDiem, type ProvenanceFlag } from './types';

export interface TrangThaiNang {
  /**
   * ⭐ HẠNG CỦA CHÍNH KẾT QUẢ NÀY — mắt xích yếu nhất trong dây tính.
   * Hình học mặt trời là TẤT ĐỊNH, nhưng nó ăn MÚI GIỜ; múi giờ suy từ kinh độ chỉ là xấp xỉ
   * ⇒ kết quả **không thể** chắc hơn múi giờ đã dùng. Nơi hiển thị PHẢI đọc trường này, cấm
   * bày nắng suy-từ-kinh-độ như thể đã kiểm chứng.
   */
  co: ProvenanceFlag;
  /** Vì sao có hạng đó — câu nói thẳng cho người đọc, không phải mã nội bộ. */
  vi: string;
  /** Phương vị mặt trời — độ, thuận kim đồng hồ từ Bắc. */
  phuongViDeg: number;
  /** Cao độ góc trên chân trời. **Âm = đã lặn** — nơi gọi phải xử, đừng vẽ nắng dưới đất. */
  caoDoDeg: number;
  /** Mặt trời có đang trên đường chân trời không. */
  tren: boolean;
  /** Góc tới mặt đứng chính, độ 0..180. `null` khi CHƯA khai hướng — KHÔNG mặc định 0 lặng lẽ. */
  gocToiMatDungDeg: number | null;
}

/**
 * Múi giờ dạng số. Ưu tiên `muiGio` IANA đã khai; thiếu thì XẤP XỈ từ kinh độ.
 * ⚠️ Xấp xỉ `lng/15` đúng cho VN (105.85 → +7) nhưng KHÔNG đúng ranh giới hành chính mọi nước —
 * đó là lý do `muiGio` tồn tại trong hồ sơ. Khai thật chỗ mình chỉ đoán.
 */
export function hangMuiGio(hoSo: HoSoDiaDiem): { co: ProvenanceFlag; vi: string } {
  const { muiGio, muiGioCo } = hoSo.viTri;
  if (muiGio && muiGioCo === 'verified') return { co: 'verified', vi: 'múi giờ tra từ nguồn' };
  if (muiGio && muiGioCo === 'measured') return { co: 'measured', vi: 'múi giờ do người dùng khai' };
  if (muiGio) return { co: 'inferred', vi: 'múi giờ đã khai nhưng chưa rõ nguồn' };
  return { co: 'inferred', vi: 'múi giờ SUY TỪ KINH ĐỘ — xấp xỉ, sai ở nước có ranh giới múi giờ theo chính trị' };
}

export function muiGioGio(hoSo: HoSoDiaDiem, thamChieu: Date): number | null {
  const { muiGio, kinhDo } = hoSo.viTri;
  if (muiGio) {
    try {
      // Chênh lệch thật giữa giờ vùng đó và UTC tại MỐC THAM CHIẾU — làm đúng cả với giờ mùa hè.
      const f = new Intl.DateTimeFormat('en-US', { timeZone: muiGio, timeZoneName: 'longOffset' });
      const phan = f.formatToParts(thamChieu).find((p) => p.type === 'timeZoneName')?.value ?? '';
      const m = /GMT([+-])(\d{2}):(\d{2})/.exec(phan);
      if (m) {
        const dau = m[1] === '-' ? -1 : 1;
        return dau * (Number(m[2]) + Number(m[3]) / 60);
      }
      if (/GMT$/.test(phan)) return 0;
    } catch {
      /* tên múi giờ hỏng → rơi xuống đường suy từ kinh độ, không văng lỗi ra UI */
    }
  }
  if (typeof kinhDo === 'number') return Math.round(kinhDo / 15);
  return null;
}

/** Chênh lệch góc nhỏ nhất giữa hai phương vị, 0..180. */
export function lechGoc(a: number, b: number): number {
  const d = Math.abs(((a - b) % 360) + 360) % 360;
  return d > 180 ? 360 - d : d;
}

/**
 * Trạng thái nắng tại một thời điểm. Trả `null` khi CHƯA có toạ độ — thiếu dữ kiện thì im,
 * KHÔNG đoán một vị trí mặc định rồi vẽ nắng sai (luật cấm bịa).
 *
 * @param hour giờ ĐỒNG HỒ ĐỊA PHƯƠNG (lẻ được: 16.5 = 16h30)
 */
export function trangThaiNang(hoSo: HoSoDiaDiem, ngay: Date, hour: number): TrangThaiNang | null {
  if (!coToaDo(hoSo)) return null;
  const tz = muiGioGio(hoSo, ngay) ?? undefined;
  const v = sunFromDateTime(hoSo.viTri.viDo as number, hoSo.viTri.kinhDo as number, ngay, hour, tz);
  const matDung = hoSo.huong.matDungChinhDeg;
  const hang = hangMuiGio(hoSo);
  return {
    co: hang.co,
    vi: hang.vi,
    phuongViDeg: v.azimuthDeg,
    caoDoDeg: v.altitudeDeg,
    tren: v.altitudeDeg > 0,
    gocToiMatDungDeg: typeof matDung === 'number' ? lechGoc(v.azimuthDeg, matDung) : null,
  };
}

/**
 * Bình minh / hoàng hôn — DÒ NHỊ PHÂN trên chính hàm cao độ đã có, thay vì cài công thức thứ hai.
 * Chậm hơn công thức đóng vài chục lần nhưng vẫn dưới một phần nghìn giây, và đổi lại: **không
 * có nguồn sự thật thứ hai về vị trí mặt trời** — hai công thức lệch nhau là loại lỗi âm thầm.
 * Trả `null` khi ngày đó không có mọc/lặn (vùng cực) — đó là sự thật, không phải lỗi.
 */
export function binhMinhHoangHon(
  hoSo: HoSoDiaDiem,
  ngay: Date,
): { binhMinh: number | null; hoangHon: number | null } | null {
  if (!coToaDo(hoSo)) return null;
  const cao = (h: number) => trangThaiNang(hoSo, ngay, h)?.caoDoDeg ?? -90;
  const moc = (tu: number, den: number): number | null => {
    let a = tu;
    let b = den;
    if (cao(a) > 0 === cao(b) > 0) return null;
    for (let i = 0; i < 40; i++) {
      const g = (a + b) / 2;
      if (cao(a) > 0 === cao(g) > 0) a = g;
      else b = g;
    }
    return (a + b) / 2;
  };
  return { binhMinh: moc(0, 12), hoangHon: moc(12, 24) };
}
