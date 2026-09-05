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
 *
 * ══════════ HOÀ NHÁNH 05/09 — HAI BỘ HÀM MẶT TRỜI, CỐ Ý ĐỨNG CHUNG ══════════
 * Hai nhánh cùng làm "mặt trời" nhưng ở HAI TẦNG khác nhau, 0 tên trùng, cả hai đều có người
 * gọi thật:
 *   · `trangThaiNang`/`binhMinhHoangHon` — CỬA NỐI từ `HoSoDiaDiem` sang `sunFromDateTime`
 *     (`components/site/nang-tu-ho-so.ts`, `TomTatDiaDiem.tsx`, `scene3d-ui.ts`);
 *   · `viTriMatTroi`/`mocLan`/`tomTatMatTroi` — bộ NOAA THUẦN theo (lat,lng,ngày), sinh ra
 *     `SolarSummary` cho La bàn dự án (`SunArc.tsx`, `lib/site/derive.ts`).
 * Bỏ bên nào cũng gãy một nửa. Lời của nhánh integration giữ nguyên dưới đây:
 *
 * lib/site/solar.ts — Thiên văn mặt trời TẤT ĐỊNH từ ghim (lat/lng) + ngày. Công thức NOAA
 * (Solar Calculator, "General Solar Position Calculations") — sai số vài phút, đủ cho hướng
 * nắng/che nắng; KHÔNG thay cho mô phỏng ánh sáng IES (STATUS: "lux trước IES phải ghi ước tính").
 *
 * Khác `lib/home/time-of-day.ts` (cung 5h→20h cố định cho Home, không có toạ độ): ở đây có toạ độ
 * thật ⇒ bình minh/hoàng hôn/phương vị đúng theo nơi đặt ghim. Home KHÔNG đổi sang file này —
 * nó là widget cảm nhận, không phải phép đo.
 *
 * THUẦN, không side-effect, không Date.now() ngầm — ngày truyền vào.
 */
import type { SolarSummary } from './types';

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

/* ══════════ NOAA THUẦN — (lat,lng,ngày) → SolarSummary. Không đọc hồ sơ, không side-effect. ══════════ */

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;
/** Thiên đỉnh lúc mọc/lặn kể cả khúc xạ (NOAA): 90.833°. */
const ZENITH_MOC_LAN = 90.833;

export interface NgayUTC {
  y: number;
  m: number; // 1-12
  d: number; // 1-31
}

/** Ngày thứ mấy trong năm (1..366) — thuần từ y/m/d, không dùng Date địa phương. */
export function ngayTrongNam({ y, m, d }: NgayUTC): number {
  const start = Date.UTC(y, 0, 1);
  const cur = Date.UTC(y, m - 1, d);
  return Math.floor((cur - start) / 86_400_000) + 1;
}

function laNamNhuan(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

/** Góc năm phân số γ (radian) tại giờ UTC `hourUtc` (mặc định 12h). */
function gamma(ngay: NgayUTC, hourUtc = 12): number {
  const soNgay = laNamNhuan(ngay.y) ? 366 : 365;
  return ((2 * Math.PI) / soNgay) * (ngayTrongNam(ngay) - 1 + (hourUtc - 12) / 24);
}

/** Phương trình thời gian (phút) + xích vĩ mặt trời (độ). */
export function eqTimeVaXichVi(ngay: NgayUTC, hourUtc = 12): { eqTimePhut: number; xichViDo: number } {
  const g = gamma(ngay, hourUtc);
  const eqTimePhut =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(g) -
      0.032077 * Math.sin(g) -
      0.014615 * Math.cos(2 * g) -
      0.040849 * Math.sin(2 * g));
  const decl =
    0.006918 -
    0.399912 * Math.cos(g) +
    0.070257 * Math.sin(g) -
    0.006758 * Math.cos(2 * g) +
    0.000907 * Math.sin(2 * g) -
    0.002697 * Math.cos(3 * g) +
    0.00148 * Math.sin(3 * g);
  return { eqTimePhut, xichViDo: decl * DEG };
}

export interface ViTriMatTroi {
  /** độ cao trên chân trời (độ, âm = dưới chân trời). */
  doCaoDo: number;
  /** phương vị (độ, 0 = Bắc, 90 = Đông, 180 = Nam, 270 = Tây). */
  phuongViDo: number;
}

/**
 * Vị trí mặt trời tại `gioDiaPhuong` (giờ thập phân 0..24) của ngày `ngay`, múi giờ `muiGioPhut`.
 * `ngay` hiểu là ngày ĐỊA PHƯƠNG; quy về UTC để tính γ (sai số bỏ qua được cho mục đích này).
 */
export function viTriMatTroi(
  lat: number,
  lng: number,
  ngay: NgayUTC,
  gioDiaPhuong: number,
  muiGioPhut: number,
): ViTriMatTroi {
  const hourUtc = gioDiaPhuong - muiGioPhut / 60;
  const { eqTimePhut, xichViDo } = eqTimeVaXichVi(ngay, hourUtc);
  const timeOffset = eqTimePhut + 4 * lng - muiGioPhut;
  const tst = gioDiaPhuong * 60 + timeOffset; // true solar time (phút)
  const ha = tst / 4 - 180; // hour angle (độ)
  const latR = lat * RAD;
  const declR = xichViDo * RAD;
  const cosZen = Math.sin(latR) * Math.sin(declR) + Math.cos(latR) * Math.cos(declR) * Math.cos(ha * RAD);
  const zen = Math.acos(Math.max(-1, Math.min(1, cosZen)));
  const doCaoDo = 90 - zen * DEG;
  let az: number;
  const sinZen = Math.sin(zen);
  if (sinZen < 1e-9) {
    az = 180;
  } else {
    // NOAA spreadsheet: acos(((sin φ · cos Z) − sin δ) / (cos φ · sin Z)); sáng = 540 − a, chiều = a + 180.
    const cosAz = (Math.sin(latR) * cosZen - Math.sin(declR)) / (Math.cos(latR) * sinZen);
    const a = Math.acos(Math.max(-1, Math.min(1, cosAz))) * DEG;
    az = ha > 0 ? a + 180 : 540 - a;
  }
  return { doCaoDo, phuongViDo: ((az % 360) + 360) % 360 };
}

export interface MocLan {
  /** phút giờ địa phương kể từ 0h; null = không mọc/lặn (vùng cực: ngày/đêm trắng). */
  binhMinhPhut: number | null;
  hoangHonPhut: number | null;
  giuaTruaPhut: number;
  doCaoGiuaTruaDo: number;
  xichViDo: number;
}

export function mocLan(lat: number, lng: number, ngay: NgayUTC, muiGioPhut: number): MocLan {
  const { eqTimePhut, xichViDo } = eqTimeVaXichVi(ngay, 12);
  const latR = lat * RAD;
  const declR = xichViDo * RAD;
  const cosHa0 =
    Math.cos(ZENITH_MOC_LAN * RAD) / (Math.cos(latR) * Math.cos(declR)) - Math.tan(latR) * Math.tan(declR);
  const giuaTruaUtc = 720 - 4 * lng - eqTimePhut;
  const giuaTruaPhut = giuaTruaUtc + muiGioPhut;
  const doCaoGiuaTruaDo = 90 - Math.abs(lat - xichViDo);
  if (cosHa0 > 1 || cosHa0 < -1) {
    return { binhMinhPhut: null, hoangHonPhut: null, giuaTruaPhut, doCaoGiuaTruaDo, xichViDo };
  }
  const ha0 = Math.acos(cosHa0) * DEG;
  return {
    binhMinhPhut: 720 - 4 * (lng + ha0) - eqTimePhut + muiGioPhut,
    hoangHonPhut: 720 - 4 * (lng - ha0) - eqTimePhut + muiGioPhut,
    giuaTruaPhut,
    doCaoGiuaTruaDo,
    xichViDo,
  };
}

/** Múi giờ ƯỚC TÍNH từ kinh độ (15°/giờ) — chỉ dùng khi ghim không mang múi giờ, gắn cờ rõ. */
export function muiGioTuKinhDo(lng: number): number {
  return Math.round(lng / 15) * 60;
}

export function phutThanhHHMM(phut: number | null): string | null {
  if (phut === null || !Number.isFinite(phut)) return null;
  const p = ((Math.round(phut) % 1440) + 1440) % 1440;
  const h = Math.floor(p / 60);
  const m = p % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function yyyymmdd({ y, m, d }: NgayUTC): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Tóm tắt mặt trời cho một ngày tại ghim — cái UI vẽ. Hai điểm chí lấy 21/06 và 21/12. */
export function tomTatMatTroi(
  lat: number,
  lng: number,
  ngay: NgayUTC,
  muiGioPhut: number | undefined,
): SolarSummary {
  const muiGioUocTinh = muiGioPhut === undefined;
  const tz = muiGioPhut ?? muiGioTuKinhDo(lng);
  const homNay = mocLan(lat, lng, ngay, tz);
  const he = mocLan(lat, lng, { y: ngay.y, m: 6, d: 21 }, tz);
  const dong = mocLan(lat, lng, { y: ngay.y, m: 12, d: 21 }, tz);
  const doDai = (m: MocLan) => (m.binhMinhPhut !== null && m.hoangHonPhut !== null ? m.hoangHonPhut - m.binhMinhPhut : null);
  const phuongVi = (phut: number | null) =>
    phut === null ? null : Math.round(viTriMatTroi(lat, lng, ngay, phut / 60, tz).phuongViDo);
  // bán cầu Nam: "chí hè" là 21/12 — đặt tên theo MÙA của nơi ghim, không theo lịch Bắc bán cầu.
  const [chiHe, chiDong] = lat >= 0 ? [he, dong] : [dong, he];
  return {
    ngay: yyyymmdd(ngay),
    binhMinh: phutThanhHHMM(homNay.binhMinhPhut),
    hoangHon: phutThanhHHMM(homNay.hoangHonPhut),
    giuaTrua: phutThanhHHMM(homNay.giuaTruaPhut) ?? '12:00',
    doDaiNgayPhut: doDai(homNay),
    doCaoGiuaTruaDo: Math.round(homNay.doCaoGiuaTruaDo * 10) / 10,
    phuongViBinhMinhDo: phuongVi(homNay.binhMinhPhut),
    phuongViHoangHonDo: phuongVi(homNay.hoangHonPhut),
    phuongViGiuaTruaDo: phuongVi(homNay.giuaTruaPhut) ?? 180,
    chiHe: { doCaoGiuaTruaDo: Math.round(chiHe.doCaoGiuaTruaDo * 10) / 10, doDaiNgayPhut: doDai(chiHe) },
    chiDong: { doCaoGiuaTruaDo: Math.round(chiDong.doCaoGiuaTruaDo * 10) / 10, doDaiNgayPhut: doDai(chiDong) },
    muiGioPhut: tz,
    muiGioUocTinh,
  };
}

/** Tiện: Date (bất kỳ múi) → NgayUTC theo lịch UTC. UI muốn "hôm nay tại ghim" thì cộng múi giờ trước. */
export function ngayTuDate(d: Date, muiGioPhut = 0): NgayUTC {
  const shifted = new Date(d.getTime() + muiGioPhut * 60_000);
  return { y: shifted.getUTCFullYear(), m: shifted.getUTCMonth() + 1, d: shifted.getUTCDate() };
}
