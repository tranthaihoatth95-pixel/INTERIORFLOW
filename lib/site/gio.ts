/**
 * lib/site/gio.ts — GIÓ THỊNH HÀNH CỦA VÙNG (§12). THUẦN, không đụng đĩa, không gọi mạng.
 *
 * ⛔⛔ **ĐÂY KHÔNG PHẢI CFD. NÓI THẬT, KHÔNG NÓI QUÁ.**
 *   Thứ file này biết: *"vùng này mùa hè gió chủ yếu từ hướng Đông Nam, tốc độ trung bình 2–4 m/s"*.
 *   Thứ file này **KHÔNG** biết: luồng khí đi qua phòng khách, áp suất trên mặt đứng, hiệu quả
 *   thông gió chéo của một ô cửa cụ thể, gió lùa quanh khối nhà. Muốn biết mấy thứ đó phải giải
 *   phương trình dòng chảy trên hình học thật — IF không làm, và **không được nói như thể có làm**.
 *
 *   Vì sao ranh giới này gắt hơn chỗ khác: một câu như *"luồng khí qua phòng ngủ đạt 0,4 m/s"*
 *   nghe rất chuyên nghiệp và KTS sẽ tin, rồi đem nó đi thuyết phục chủ đầu tư. Nói quá ở đây
 *   không phải lỗi chữ nghĩa — nó là một khẳng định kỹ thuật sai đội lốt kết quả tính toán.
 *   ⇒ `NHAN_GIO` là nhãn bắt buộc, `viPhamCFD()` là máy canh, và cả hai bị khoá bằng test.
 *
 * ⚠️ **QUY ƯỚC HƯỚNG GIÓ — chỗ dễ sai gấp đôi.** Ngành khí tượng nói hướng gió là **hướng gió
 *   THỔI TỚI TỪ** (gió Đông Bắc = gió đến từ Đông Bắc, đi về Tây Nam). Trường `huongTuDeg` giữ
 *   đúng nghĩa đó, cùng hệ độ với `solar.ts` (0=Bắc, thuận kim đồng hồ). Muốn hướng gió ĐI VỀ thì
 *   gọi `huongThoiToiDeg()` — cấm tự cộng 180 rải rác trong code.
 */

import type { NguonGoc, PhamViDiaLy, SuThat } from './types';
import { coToaDo, type HoSoDiaDiem } from './types';
import type { Thang12 } from './khi-hau';
import { lechGoc } from './solar';

/* ═══════════════ §12 · NHÃN BẮT BUỘC + MÁY CANH NÓI QUÁ ═══════════════ */

/** Nhãn DUY NHẤT được phép gắn cho mọi số liệu gió của IF. */
export const NHAN_GIO = 'gió thịnh hành của vùng';

/**
 * Những cách nói ám chỉ đã tính dòng chảy. Bất kỳ chuỗi nào hiện ra UI mà chứa chúng là NÓI QUÁ.
 * Danh sách là **sàn dưới**, không phải trần — thêm được khi bắt gặp cách nói mới.
 */
export const CACH_NOI_CAM = [
  'luồng khí qua phòng',
  'luồng khí trong phòng',
  'thông gió chéo đạt',
  'vận tốc gió trong nhà',
  'mô phỏng dòng chảy',
  'cfd',
  'tính toán khí động',
  'áp suất trên mặt đứng',
] as const;

/** Trả về các cách nói VI PHẠM tìm thấy trong một chuỗi. Rỗng = sạch. */
export function viPhamCFD(text: string): string[] {
  const t = text.toLowerCase();
  return CACH_NOI_CAM.filter((c) => t.includes(c));
}

/**
 * IF **không** chạy CFD. Hàm này tồn tại để câu trả lời đó nằm trong CODE chứ không nằm trong
 * trí nhớ của người đọc tài liệu — và để test khoá được nó.
 */
export function laCFD(): false {
  return false;
}

/* ═══════════════ DỮ LIỆU GIÓ ═══════════════ */

export interface GioThinhHanh {
  /** Hướng gió THỔI TỚI TỪ, độ, thuận kim đồng hồ từ Bắc. `null` cho tháng chưa có dữ liệu. */
  huongTuTheoThangDeg?: Thang12<number | null>;
  /** Tốc độ trung bình từng tháng (m/s). */
  tocDoTbThangMs?: Thang12<number>;
  /** Khoảng tốc độ trung bình của vùng (m/s) — nói KHOẢNG, không nói một con số giả chính xác. */
  khoangTocDoMs?: { min: number; max: number };
  nguon?: NguonGoc;
  phamVi: PhamViDiaLy;
}

/**
 * §14 — gió thịnh hành là thống kê của VÙNG. Nhận nó ở thang `cong-truong`/`lan-can` là nói dối
 * về độ phân giải: quanh công trình, một hàng cây hay một khối nhà bên cạnh đủ đổi hẳn cục diện.
 */
export function phamViHopLeGio(p: PhamViDiaLy): boolean {
  return p !== 'cong-truong' && p !== 'lan-can';
}

/** Hướng gió ĐI VỀ, suy từ hướng gió thổi tới từ. Một chỗ duy nhất, để không ai lệch quy ước. */
export function huongThoiToiDeg(huongTuDeg: number): number {
  return ((huongTuDeg + 180) % 360 + 360) % 360;
}

/* ═══════════════ ĐƯỜNG CẮM NGUỒN THẬT (đang RỖNG) ═══════════════ */

export interface NguonGio {
  ten: string;
  tra(viDo: number, kinhDo: number): GioThinhHanh | null;
}

const KHO_NGUON: NguonGio[] = [];

export function dangKyNguonGio(n: NguonGio): void {
  KHO_NGUON.push(n);
}

export function xoaNguonGio(): void {
  KHO_NGUON.length = 0;
}

export function soNguonGio(): number {
  return KHO_NGUON.length;
}

/**
 * Tra gió cho hồ sơ dự án. `null` khi chưa có toạ độ hoặc chưa cắm nguồn nào.
 * Nguồn trả về ở thang địa lý sai (công trường/lân cận) bị **từ chối**, không phải hạ hạng —
 * số ấy không tồn tại ở thang đó, nhận vào là hợp thức hoá một tuyên bố sai.
 */
export function traGio(hoSo: HoSoDiaDiem): GioThinhHanh | null {
  if (!coToaDo(hoSo)) return null;
  const vi = hoSo.viTri.viDo as number;
  const kinh = hoSo.viTri.kinhDo as number;
  for (const n of KHO_NGUON) {
    const kq = n.tra(vi, kinh);
    if (kq && phamViHopLeGio(kq.phamVi)) return kq;
  }
  return null;
}

/* ═══════════════ SUY DẪN THUẦN ═══════════════ */

/** Nhóm tháng có cùng hướng gió chủ đạo (làm tròn về 8 hướng chính). `null` khi chưa có dữ liệu. */
export interface MuaGio {
  /** Hướng gió thổi tới từ, đã gom về 8 hướng chính (0/45/…/315). */
  huongTuDeg: number;
  thang: number[];
}

export function muaGio(g: GioThinhHanh): MuaGio[] | null {
  const h = g.huongTuTheoThangDeg;
  if (!h) return null;
  const gom = new Map<number, number[]>();
  for (let i = 0; i < 12; i++) {
    const v = h[i];
    if (v === null || v === undefined) continue;
    const tam = (Math.round((((v % 360) + 360) % 360) / 45) * 45) % 360;
    const ds = gom.get(tam) ?? [];
    ds.push(i + 1);
    gom.set(tam, ds);
  }
  if (gom.size === 0) return null;
  return [...gom.entries()]
    .map(([huongTuDeg, thang]) => ({ huongTuDeg, thang }))
    .sort((a, b) => b.thang.length - a.thang.length);
}

/** Hướng gió thịnh hành nhất cả năm (thổi tới từ, độ). `null` khi chưa có dữ liệu. */
export function huongThinhHanhNhatDeg(g: GioThinhHanh): number | null {
  const ds = muaGio(g);
  return ds && ds.length > 0 ? ds[0].huongTuDeg : null;
}

/**
 * Góc giữa hướng gió tháng đó và pháp tuyến mặt đứng, 0..180.
 * ⚠️ Đây là **QUAN HỆ HÌNH HỌC giữa hai phương vị** — nó nói *"mặt này quay về phía đầu gió"*,
 * KHÔNG nói gì về lượng khí thực sự vào nhà. Nhãn hiển thị vẫn phải là `NHAN_GIO`.
 */
export function gocGioToiMatDungDeg(
  g: GioThinhHanh,
  thang: number,
  matDungDeg: number,
): number | null {
  const h = g.huongTuTheoThangDeg;
  if (!h || thang < 1 || thang > 12) return null;
  const v = h[thang - 1];
  if (v === null || v === undefined) return null;
  return lechGoc(v, matDungDeg);
}

/** Tốc độ trung bình năm (m/s). `null` khi chưa có dữ liệu. */
export function tocDoTbNamMs(g: GioThinhHanh): number | null {
  const t = g.tocDoTbThangMs;
  if (!t) return null;
  return t.reduce((a, b) => a + b, 0) / 12;
}

/**
 * Câu mô tả gió — **cửa duy nhất** sinh chữ về gió cho người dùng đọc. Nó luôn mang `NHAN_GIO`
 * và luôn nói rõ thang địa lý, nên không có đường nào để một câu nói quá lọt ra ngoài.
 */
export function nhanGio(g: GioThinhHanh, thang?: number): string {
  const phan: string[] = [NHAN_GIO];
  const huong =
    typeof thang === 'number' && g.huongTuTheoThangDeg
      ? g.huongTuTheoThangDeg[thang - 1] ?? null
      : huongThinhHanhNhatDeg(g);
  if (huong !== null) phan.push(`thổi tới từ ${Math.round(huong)}°`);
  if (g.khoangTocDoMs) phan.push(`khoảng ${g.khoangTocDoMs.min}–${g.khoangTocDoMs.max} m/s`);
  phan.push(`thang địa lý: ${g.phamVi}`);
  return phan.join(' · ');
}

/* ═══════════════ ĐỔ RA SỰ THẬT (§3A) ═══════════════ */

function suThatGio<T>(giaTri: T, g: GioThinhHanh, moTa: string): SuThat<T> {
  return {
    giaTri,
    co: g.nguon ? 'verified' : 'inferred',
    nguon: g.nguon,
    ghiChu: g.nguon
      ? undefined
      : `${moTa} — chưa khai nguồn số liệu gió, cần đối chiếu trước khi tin`,
  };
}

/** Sự thật gió, khoá `gio.*` (khớp `Mien` ở `./anh-huong.ts`). Thiếu dữ liệu thì KHÔNG sinh khoá. */
export function suThatGioThinhHanh(g: GioThinhHanh): Record<string, SuThat<unknown>> {
  const ra: Record<string, SuThat<unknown>> = {};
  const huong = huongThinhHanhNhatDeg(g);
  if (huong !== null) ra['gio.huongThinhHanhTuDeg'] = suThatGio(huong, g, NHAN_GIO);
  const ms = tocDoTbNamMs(g);
  if (ms !== null) ra['gio.tocDoTbNamMs'] = suThatGio(ms, g, 'tốc độ gió trung bình năm');
  if (g.khoangTocDoMs) ra['gio.khoangTocDoMs'] = suThatGio(g.khoangTocDoMs, g, 'khoảng tốc độ gió');
  const mua = muaGio(g);
  if (mua) ra['gio.muaGio'] = suThatGio(mua, g, 'biến thiên hướng gió theo mùa');
  return ra;
}
