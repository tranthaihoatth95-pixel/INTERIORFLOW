/**
 * scripts/bench/bench-util.ts — tiện ích dùng chung cho bench-2d.ts/bench-3d.ts (phiếu
 * `docs/phieu-giao/hieu-nang-do.md`). Đo bằng `process.hrtime.bigint()` (đồng hồ đơn điệu, không
 * lệch giờ hệ thống), lặp N lần lấy MEDIAN (chống nhiễu do 1 lần đo dính GC/context-switch — median
 * bền hơn mean với outlier). KHÔNG Math.random ở đây — mọi tính "ngẫu nhiên" trong bộ đo nằm ở
 * `gen-doc.ts` (mulberry32 seed cố định), file này thuần đo thời gian + in bảng.
 */

export function median(nums: number[]): number {
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export interface TimeResult<T> {
  medianMs: number;
  minMs: number;
  maxMs: number;
  allMs: number[];
  result: T;
}

/** Chạy `fn` `reps` lần (mặc định 5, đúng luật phiếu "lặp ≥5 lần lấy median"), trả median/min/max
 * (ms) + kết quả LẦN CUỐI (đủ dùng cho mọi bench ở đây — kết quả tất định, mọi lần chạy ra cùng
 * giá trị vì đầu vào tất định, chỉ thời gian dao động). */
export function timeMs<T>(fn: () => T, reps = 5): TimeResult<T> {
  if (reps < 1) throw new Error('reps phải ≥ 1');
  const times: number[] = [];
  let result!: T;
  for (let i = 0; i < reps; i++) {
    const t0 = process.hrtime.bigint();
    result = fn();
    const t1 = process.hrtime.bigint();
    times.push(Number(t1 - t0) / 1e6);
  }
  return { medianMs: median(times), minMs: Math.min(...times), maxMs: Math.max(...times), allMs: times, result };
}

export function fmt(n: number, digits = 2): string {
  return n.toFixed(digits);
}

/** Bảng text canh cột đơn giản — in thẳng ra console, dán nguyên văn vào báo cáo được. */
export function printTable(headers: string[], rows: (string | number)[][]): void {
  const cells = [headers, ...rows.map((r) => r.map((c) => String(c)))];
  const widths = headers.map((_, i) => Math.max(...cells.map((row) => row[i].length)));
  const line = (row: string[]) => row.map((c, i) => c.padEnd(widths[i])).join(' | ');
  console.log(line(headers));
  console.log(widths.map((w) => '-'.repeat(w)).join('-|-'));
  for (const r of rows) console.log(line(r.map((c) => String(c))));
}

/** Tỉ lệ tăng thời gian so với tỉ lệ tăng N — dùng để gắn cờ "phi tuyến" trong báo cáo.
 * O(n) lý tưởng ⇒ tRatio ≈ nRatio (hệ số ~1). Hệ số > ~1.5× kéo dài thành nghi phạm phi tuyến
 * (ngưỡng chọn bằng tay, không phải luật cứng — mọi con số kèm bảng gốc để người đọc tự đánh giá). */
export function growthFactor(nFrom: number, nTo: number, tFromMs: number, tToMs: number): number {
  const nRatio = nTo / nFrom;
  const tRatio = tToMs / Math.max(tFromMs, 1e-6);
  return tRatio / nRatio;
}
