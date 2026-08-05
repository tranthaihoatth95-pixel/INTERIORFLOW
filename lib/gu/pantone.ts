/**
 * lib/gu/pantone.ts — MÁY TRA MÀU (VIỆC 2 + VIỆC 3, phiếu 05/08 sau NC-16).
 *
 * ┌─ ĐỔI HƯỚNG 05/08 — đọc trước khi sửa ────────────────────────────────────────────────┐
 * │ Bản trước: `nearestPantone(hex)` tra trong `pantone-tcx.json` **2310 mã NHÚNG SẴN**.  │
 * │ Bảng đó **ĐÃ XOÁ** (Hoà chốt). Máy tra ở lại, KHO đi ra ngoài:                        │
 * │   `nearestColor(hex, source)` — `source` là `ColorSource` NẠP LÚC CHẠY                │
 * │   (`lib/colors/` — CSV studio kéo vào · clipboard · Larkbase). App không mang theo    │
 * │   bảng của ai cả.                                                                     │
 * │ Vì sao: NC-16 tra điều khoản gốc 6 hãng sơn — Dulux cấm scraping thương mại GỌI ĐÍCH  │
 * │ DANH; Jotun dùng đúng lập luận "selection and arrangement" của Pantone; cả hai là     │
 * │ công ty EU/EEA ⇒ có thêm sui generis database right. **Ranh giới nằm ở QUY MÔ BỘ SƯU  │
 * │ TẬP**, không nằm ở việc có hiển thị hay không — xem `docs/LICENSE-NOTES.md` §9.       │
 * │ Tên tệp GIỮ NGUYÊN `pantone.ts` cố ý: đây là file đã có lịch sử git, đổi tên làm mất  │
 * │ `git log`/blame của quyết định pháp lý này. Nội dung mới không còn dính Pantone.      │
 * └───────────────────────────────────────────────────────────────────────────────────────┘
 *
 * TOÁN (VIỆC 2, đổi so với bản F3b):
 *   sRGB → Lab (D65, 2°) → xếp hạng **ΔE00 (CIEDE2000)**, KHÔNG phải ΔE*76.
 *   ΔE76 sai lệch cảm nhận ở vùng lam/lục (xem docblock `deltaE2000` ở `color-psychology.ts`).
 *   Vẫn TÁI DÙNG `color-psychology.ts` chứ không viết lại toán màu lần hai (CLAUDE.md,
 *   "một cỗ máy nhiều mặt tiền").
 *
 * KỶ LUẬT TRẢ KẾT QUẢ — cố ý, đừng "gọn lại" thành 1 dòng:
 *   1. Trả **TOP 3-5 kèm số ΔE**, không trả một đáp án chắc nịch. Tra màu sơn là việc THU HẸP
 *      lựa chọn cho con người, không phải phán quyết của máy.
 *   2. ΔE nhỏ nhất > `DEFAULT_MAX_DELTA_E` (5) ⇒ `enough=false` — UI PHẢI nói "không có màu nào
 *      đủ gần trong thư viện này" thay vì bày ra một mã sai tông. (Bản cũ luôn trả mã gần nhất
 *      dù lệch bao nhiêu — đúng kiểu bịa tự tin.)
 */

import { hexToRgb, rgbToLab, deltaE2000, type Lab } from './color-psychology';
import type { ColorEntry, ColorSource } from '../colors/types';

export interface ColorMatch extends ColorEntry {
  /** ΔE00 tới hex đầu vào. Tham khảo: <1 mắt thường gần như không phân biệt · <2 rất sát ·
   *  2–5 cùng tông, khác nhẹ · >5 khác tông thật (xem `DEFAULT_MAX_DELTA_E`). */
  deltaE: number;
}

export interface ColorMatchResult {
  matches: ColorMatch[];
  /** ΔE của kết quả đầu bảng. `null` khi hex sai hoặc nguồn rỗng. */
  nearestDeltaE: number | null;
  /**
   * `false` ⇒ UI hiện "không có màu nào đủ gần trong thư viện này" (KHÔNG được im lặng bày
   * `matches` ra như đáp án). `matches` vẫn có dữ liệu để người dùng tự xem nếu muốn.
   */
  enough: boolean;
  /** Nguồn đã tra — để UI ghi rõ "gần nhất TRONG bảng X", không nói chung chung. */
  sourceId: string;
  sourceName: string;
}

export interface NearestColorOptions {
  /** Số kết quả trả về. Kẹp trong [1, 10]; mặc định 5. */
  limit?: number;
  /** Ngưỡng "đủ gần" theo ΔE00. Mặc định `DEFAULT_MAX_DELTA_E`. */
  maxDeltaE?: number;
}

/**
 * Ngưỡng "đủ gần" mặc định. 5 ΔE00 ≈ ranh giới trên của "cùng tông, khác nhẹ" trong thực hành
 * ngành sơn/dệt; trên mức đó thì đưa mã ra là gây hiểu nhầm cho người đi đặt hàng.
 */
export const DEFAULT_MAX_DELTA_E = 5;

/**
 * Lab của entry: **ưu tiên `entry.lab` đã lưu**, chỉ tính lại từ hex khi entry thiếu Lab
 * (dữ liệu đời cũ/tay người sửa). Đúng lý do đã ghi ở `ColorEntry.lab` — nguồn có Lab thật thì
 * Lab là số gốc, hex chỉ là bản chiếu có mất mát; tính ngược từ hex sẽ ra số khác mà không ai biết.
 */
function entryLab(entry: ColorEntry): Lab | null {
  if (entry.lab && typeof entry.lab.L === 'number') return entry.lab;
  const rgb = hexToRgb(entry.hex);
  return rgb ? rgbToLab(rgb) : null;
}

/** Xếp hạng cả nguồn theo ΔE00 tới `hex`, trả TOP N. */
export function nearestColors(hex: string, source: ColorSource, opts: NearestColorOptions = {}): ColorMatchResult {
  const limit = Math.max(1, Math.min(10, Math.round(opts.limit ?? 5)));
  const maxDeltaE = opts.maxDeltaE ?? DEFAULT_MAX_DELTA_E;
  const empty: ColorMatchResult = {
    matches: [], nearestDeltaE: null, enough: false, sourceId: source.id, sourceName: source.name,
  };

  const rgb = hexToRgb(hex);
  if (!rgb) return empty;
  const target = rgbToLab(rgb);

  const scored: ColorMatch[] = [];
  for (const entry of source.colors) {
    const lab = entryLab(entry);
    if (!lab) continue; // entry hex hỏng — bỏ QUA nó, không làm chết cả bảng
    scored.push({ ...entry, deltaE: Math.round(deltaE2000(target, lab) * 100) / 100 });
  }
  if (!scored.length) return empty;

  // Sắp xếp ổn định: ΔE tăng dần, hoà thì theo mã rồi tên — cùng đầu vào luôn ra cùng thứ tự
  // (tất định là điều kiện để test được và để người dùng không thấy bảng nhảy loạn giữa 2 lần tra).
  scored.sort((a, b) => a.deltaE - b.deltaE || a.code.localeCompare(b.code) || a.name.localeCompare(b.name));

  const nearestDeltaE = scored[0].deltaE;
  return {
    matches: scored.slice(0, limit),
    nearestDeltaE,
    enough: nearestDeltaE <= maxDeltaE,
    sourceId: source.id,
    sourceName: source.name,
  };
}

/**
 * MỘT màu gần nhất — mặt tiền hẹp của `nearestColors`, cho chỗ chỉ cần đúng 1 giá trị
 * (vd nhãn gợi ý cạnh swatch). `null` khi hex sai, nguồn rỗng, HOẶC không có màu nào đủ gần —
 * nhánh cuối là CỐ Ý: đã thu về 1 kết quả thì không được trả một mã lệch tông kèm ΔE=18 rồi
 * mong nơi gọi tự đọc con số đó. Cần thấy cả bảng thì gọi `nearestColors`.
 */
export function nearestColor(hex: string, source: ColorSource, opts: NearestColorOptions = {}): ColorMatch | null {
  const r = nearestColors(hex, source, { ...opts, limit: 1 });
  return r.enough ? r.matches[0] ?? null : null;
}

/** Áp `nearestColors` lên MỘT palette (mảng hex) — giữ đúng thứ tự palette, kể cả hex hỏng. */
export function paletteToColors(
  palette: string[],
  source: ColorSource,
  opts: NearestColorOptions = {},
): ColorMatchResult[] {
  return palette.map((hex) => nearestColors(hex, source, opts));
}
