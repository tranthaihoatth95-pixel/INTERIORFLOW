/**
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
