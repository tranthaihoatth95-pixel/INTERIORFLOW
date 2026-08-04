/**
 * lib/gu/pantone.ts — F3b (phiếu Moodboard, tách khỏi F3a UI mock "Claude Design dựng trước").
 *
 * Tra mã Pantone TCX GẦN NHẤT theo hex — TÁI DÙNG đúng toán màu LAB đã có ở `color-psychology.ts`
 * (`hexToRgb`/`rgbToLab`/`deltaE`), KHÔNG viết lại lần hai (luật "một cỗ máy nhiều mặt tiền",
 * CLAUDE.md). So màu bằng ΔE*76 trong CIELAB — cùng thước đo `paletteMood`/`mixPaletteLab` đã
 * dùng, KHÔNG so-hex-khít (2 hex gần giống mắt thường nhưng khác bit vẫn phải ra cùng 1 mã).
 *
 * ⚠️ GIẤY PHÉP DỮ LIỆU — `pantone-tcx.json` biên soạn lại từ 1 repo GitHub cộng đồng, KHÔNG có
 * license file rõ ràng (tên màu do README nguồn tự ghi "copyright Pantone", hex "freely available
 * on Pantone's website" — chưa phải giấy phép chính thức). ĐỌC `docs/LICENSE-NOTES.md` §9 trước
 * khi phát hành thương mại — cùng cổng chặn với vụ GPL DWG (§8), KHÔNG ship tới khi rà pháp lý
 * xong hoặc đổi sang nguồn có license/mua Pantone Connect.
 */

import pantoneData from './pantone-tcx.json';
import { hexToRgb, rgbToLab, deltaE, type Lab } from './color-psychology';

export interface PantoneEntry {
  /** Mã TCX kiểu "13-0752" (dệt may/nội thất — KHÔNG phải mã "Pantone C" in ấn, khác bảng). */
  code: string;
  name: string;
  hex: string;
}

export interface PantoneMatch extends PantoneEntry {
  /** ΔE*76 tới hex đầu vào — 0 = trùng khít; tham khảo mắt thường: <2 khó phân biệt, <10 vẫn
   * "cùng tông", lớn hơn nữa là bảng 2310 mã không có màu nào đủ gần (vẫn trả về gần nhất). */
  deltaE: number;
}

const PANTONE_TCX = pantoneData as PantoneEntry[];

// Cache LAB của cả bảng — tính 1 LẦN (2310 mã), không lặp lại mỗi lần gọi nearestPantone. Module-
// level, KHÔNG phụ thuộc DOM/React (giữ đúng ranh giới "thuần" của color-psychology.ts).
let labTableCache: { entry: PantoneEntry; lab: Lab }[] | null = null;
function labTable(): { entry: PantoneEntry; lab: Lab }[] {
  if (labTableCache) return labTableCache;
  labTableCache = PANTONE_TCX.reduce<{ entry: PantoneEntry; lab: Lab }[]>((acc, entry) => {
    const rgb = hexToRgb(entry.hex);
    if (rgb) acc.push({ entry, lab: rgbToLab(rgb) }); // bỏ qua hex hỏng thay vì sập (không có trong dữ liệu thật, phòng thủ)
    return acc;
  }, []);
  return labTableCache;
}

/** Mã Pantone TCX GẦN NHẤT với 1 màu hex bất kỳ. `null` nếu hex không hợp lệ hoặc bảng rỗng. */
export function nearestPantone(hex: string): PantoneMatch | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const table = labTable();
  if (!table.length) return null;
  const targetLab = rgbToLab(rgb);
  let best = table[0];
  let bestDist = deltaE(targetLab, table[0].lab);
  for (let i = 1; i < table.length; i++) {
    const d = deltaE(targetLab, table[i].lab);
    if (d < bestDist) {
      bestDist = d;
      best = table[i];
    }
  }
  return { ...best.entry, deltaE: Math.round(bestDist * 100) / 100 };
}

/**
 * Áp `nearestPantone` lên MỘT palette (mảng hex) — mặt tiền tiện cho nơi gọi khỏi tự loop+lọc
 * null. Nhận `string[]` THUẦN (không đụng Prisma/`LibraryAsset` trực tiếp — nơi gọi tự
 * `JSON.parse(asset.palette)` trước, giống cách `lib/gu.ts`/`app/api/library/route.ts` đã làm,
 * xem `safeArr(a.palette)`) — giữ module này không phụ thuộc schema DB, đúng ranh giới
 * `color-psychology.ts` đã đặt. Dùng cho "cột Pantone bên phải" (F3a).
 */
export function paletteToPantone(palette: string[]): PantoneMatch[] {
  const out: PantoneMatch[] = [];
  for (const hex of palette) {
    const m = nearestPantone(hex);
    if (m) out.push(m);
  }
  return out;
}
