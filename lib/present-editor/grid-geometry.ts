/**
 * lib/present-editor/grid-geometry.ts — PHA 1 ML "Gu Engine" (PRESENT · nhóm LÀM NGAY tất định).
 *
 * Hai bit tất định của proposal §3 CHƯA được phủ bởi detect-regions.ts / standards.ts:
 *   (6) GUTTER thật — `findGaps` (detect-regions.ts:50) hiện CHỈ trả TÂM khe, proposal ghi rõ cần
 *       "mở rộng trả cả BỀ RỘNG khe = gutter". File này thêm `gutterBands()` trả {center,width}
 *       mà KHÔNG sửa findGaps (đọc-only trên projection profile).
 *   (7) PATTERN/ICON heuristic — "nhiều vùng nhỏ đều → gợi icon-set; có dải màu lớn → gợi khối
 *       nền". Thêm `patternIconHint()` từ RegionCell (đọc-only type từ detect-regions.ts).
 *
 * FILE MỚI, thuần số học, test được, 0 key/GPU. KHÔNG sửa detect-regions.ts/suggest.ts.
 * HOOK (chủ dự án tự cắm sau): `detectRegions().{cols,rows}` + profile → `gutterBands` → suy
 *   spacing nạp vào template; `detectRegions().cells` → `patternIconHint` → gợi icon/khối nền
 *   trong `suggestTemplate` (suggest.ts:46).
 */

import type { RegionCell } from './detect-regions';

/* ═══════════════════════ GUTTER (bề rộng khe) ═══════════════════════ */

export interface GutterBand {
  /** tâm khe (đơn vị = chỉ số trong profile) — khớp findGaps để đối chiếu. */
  center: number;
  /** BỀ RỘNG khe (số mẫu liên tục dưới ngưỡng) — đây là "gutter" mà findGaps bỏ. */
  width: number;
}

/**
 * Như `findGaps` nhưng trả CẢ bề rộng mỗi khe. Cùng thuật toán ngưỡng (max×0.12) + FLUSH khe cuối
 * để center KHỚP `findGaps` (di trú không lệch). Deterministic.
 */
export function gutterBands(p: ArrayLike<number>, minGap = 6): GutterBand[] {
  let max = 0;
  for (let i = 0; i < p.length; i++) if (p[i] > max) max = p[i];
  if (max === 0) return [];
  const thr = max * 0.12;
  const bands: GutterBand[] = [];
  let run = 0;
  for (let i = 0; i < p.length; i++) {
    if (p[i] < thr) {
      run++;
    } else {
      if (run >= minGap) bands.push({ center: i - run / 2, width: run });
      run = 0;
    }
  }
  if (run >= minGap) bands.push({ center: p.length - run / 2, width: run });
  return bands;
}

/**
 * Gutter ĐẠI DIỆN (median bề rộng) — bỏ khe LỀ (chạm 2 mép profile) vì lề ≠ gutter giữa các ô.
 * Trả 0 nếu không có khe trong. `axisLen` = độ dài profile (để nhận diện khe chạm mép).
 */
export function dominantGutter(bands: GutterBand[], axisLen: number): number {
  const inner = bands.filter((b) => b.center - b.width / 2 > 0.5 && b.center + b.width / 2 < axisLen - 0.5);
  if (!inner.length) return 0;
  const widths = inner.map((b) => b.width).sort((a, b) => a - b);
  const mid = Math.floor(widths.length / 2);
  return widths.length % 2 ? widths[mid] : (widths[mid - 1] + widths[mid]) / 2;
}

/* ═══════════════════════ PATTERN / ICON heuristic ═══════════════════════ */

export interface PatternIconHint {
  /** nên gợi bộ ICON (nhiều ô nhỏ ĐỀU nhau → danh sách tính năng/dịch vụ). */
  suggestIconSet: boolean;
  /** nên gợi KHỐI MÀU nền (ít ô, có ô LỚN chiếm ưu thế → dải nền). */
  suggestColorBlock: boolean;
  /** tỉ lệ ô "nhỏ" trên tổng ô (0..1). */
  smallCellRatio: number;
  /** ô lớn nhất chiếm bao nhiêu % diện tích sân khấu. */
  largestCellAreaPct: number;
  reasons: string[];
}

/** Diện tích 1 ô theo % SÂN KHẤU (w,h đều 0..100 → w×h/100 = % của 100×100). */
function cellArea(c: RegionCell): number {
  return (c.w * c.h) / 100;
}

/**
 * Gợi ý pattern/icon từ tập ô lưới (RegionCell, toạ độ 0..100). Luật tất định:
 *   - Nhiều ô (≥6) mà phần LỚN là ô nhỏ (diện tích < `smallAreaPct`) và kích thước KHÁ ĐỀU →
 *     suggestIconSet (bố cục kiểu bảng icon/feature-grid).
 *   - Có 1 ô chiếm ≥ `bigAreaPct` diện tích sân khấu → suggestColorBlock (nền khối lớn/hero).
 */
export function patternIconHint(
  cells: RegionCell[],
  opts?: { smallAreaPct?: number; bigAreaPct?: number; evenCv?: number },
): PatternIconHint {
  const smallAreaPct = opts?.smallAreaPct ?? 12; // ô < 12%² coi là "nhỏ"
  const bigAreaPct = opts?.bigAreaPct ?? 45;     // ô ≥ 45% sân khấu coi là "khối lớn"
  const evenCv = opts?.evenCv ?? 0.6;            // hệ số biến thiên diện tích ô nhỏ ≤ 0.6 = "đều"
  const reasons: string[] = [];

  const n = cells.length;
  if (n === 0) {
    return { suggestIconSet: false, suggestColorBlock: false, smallCellRatio: 0, largestCellAreaPct: 0, reasons: ['không có ô'] };
  }

  const areas = cells.map(cellArea);
  const largest = Math.max(...areas);
  const smalls = areas.filter((a) => a < smallAreaPct);
  const smallCellRatio = smalls.length / n;

  // độ đều của ô nhỏ (coefficient of variation)
  let cv = 0;
  if (smalls.length >= 2) {
    const mean = smalls.reduce((s, a) => s + a, 0) / smalls.length;
    const varr = smalls.reduce((s, a) => s + (a - mean) ** 2, 0) / smalls.length;
    cv = mean > 0 ? Math.sqrt(varr) / mean : 0;
  }

  const suggestIconSet = n >= 6 && smallCellRatio >= 0.6 && cv <= evenCv;
  const suggestColorBlock = largest >= bigAreaPct;

  if (suggestIconSet) reasons.push(`${smalls.length}/${n} ô nhỏ đều (cv=${cv.toFixed(2)}) → gợi bộ icon`);
  if (suggestColorBlock) reasons.push(`ô lớn nhất ${largest.toFixed(0)}% sân khấu → gợi khối màu nền`);
  if (!suggestIconSet && !suggestColorBlock) reasons.push('bố cục trung tính — không ép pattern/icon');

  return { suggestIconSet, suggestColorBlock, smallCellRatio, largestCellAreaPct: largest, reasons };
}
