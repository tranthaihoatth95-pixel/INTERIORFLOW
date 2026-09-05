/**
 * lib/idfc-import/units-axis.ts — KIỂM ĐƠN VỊ + TRỤC cho hình học nhập (Slice 8, 09/2026).
 *
 * Luật nền: KHÔNG ĐOÁN KÍCH THƯỚC (Hoà chốt 15/08 "con số chỉ đến từ chỗ đo được"; DF3: cao mặt
 * ngồi không suy nổi từ ảnh — thiếu thì để trống). Tệp này chỉ làm hai việc tất định:
 *   ① kiểm số đã khai (hữu hạn, dương, trong dải nghề) — KHÔNG điền số thiếu;
 *   ② đối chiếu hộp bao mesh (glTF: MÉT, +Y lên) với số đã khai → báo LỆCH ĐƠN VỊ / LỆCH TRỤC
 *      kèm hệ số nghi ngờ (×1000 = mesh dựng bằng mm, ×25.4 = inch…) — KHÔNG tự sửa. Người xem
 *      rồi quyết; máy chỉ nói "lệch bao nhiêu, giống lỗi gì".
 *
 * THUẦN — test: units-axis.test.ts.
 */

import type { GlbBounds } from './glb-stats';

/** Dải nghề cho một chiều của cấu kiện nội thất/thiết bị (mm). Ngoài dải ⇒ nghi sai đơn vị. */
export const DIM_MIN_MM = 1;
export const DIM_MAX_MM = 50_000;

export interface DimsMm {
  wMm?: number;
  dMm?: number;
  hMm?: number;
}

export interface UnitsIssue {
  code:
    | 'dim-not-finite'
    | 'dim-not-positive'
    | 'dim-out-of-range'
    | 'mesh-scale-mismatch'
    | 'mesh-scale-implausible'
    | 'axis-declared-z-up'
    | 'axis-mismatch-likely'
    | 'mesh-bounds-missing';
  /** cấp: 'error' = biểu diễn liên quan không dùng được · 'warn' = dùng được nhưng phải hiện. */
  level: 'error' | 'warn';
  message: string;
  /** số liệu kèm để người đối chiếu — không có suy diễn nào bị giấu trong chữ. */
  detail?: Record<string, number | string>;
}

const DIM_KEYS = ['wMm', 'dMm', 'hMm'] as const;

/** ① Kiểm số đã khai. Chiều THIẾU không phải lỗi (thiếu là hợp lệ, bịa mới là lỗi). */
export function validateDimsMm(d: DimsMm): UnitsIssue[] {
  const out: UnitsIssue[] = [];
  for (const k of DIM_KEYS) {
    const v = d[k];
    if (v === undefined) continue;
    if (typeof v !== 'number' || !Number.isFinite(v)) {
      out.push({ code: 'dim-not-finite', level: 'error', message: `${k} không phải số hữu hạn.`, detail: { dim: k } });
      continue;
    }
    if (v <= 0) {
      out.push({ code: 'dim-not-positive', level: 'error', message: `${k} phải > 0 mm.`, detail: { dim: k, value: v } });
      continue;
    }
    if (v < DIM_MIN_MM || v > DIM_MAX_MM) {
      out.push({
        code: 'dim-out-of-range',
        level: 'error',
        message: `${k} = ${v} mm ngoài dải nghề ${DIM_MIN_MM}–${DIM_MAX_MM} mm — nghi sai đơn vị.`,
        detail: { dim: k, value: v },
      });
    }
  }
  return out;
}

export interface BoundsMm {
  /** kích thước hộp bao theo trục glTF, đã đổi sang mm: x (rộng) · y (cao, +Y lên) · z (sâu). */
  xMm: number;
  yMm: number;
  zMm: number;
  minMm: [number, number, number];
  maxMm: [number, number, number];
}

/** glTF mét → mm. Trả null nếu hộp suy biến (max < min hoặc không hữu hạn). */
export function glbBoundsToMm(b: GlbBounds): BoundsMm | null {
  const all = [...b.min, ...b.max];
  if (!all.every((n) => Number.isFinite(n))) return null;
  const size = [b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]];
  if (size.some((s) => s < 0)) return null;
  const mm = (m: number) => Math.round(m * 1000 * 1000) / 1000; // mm, 3 chữ số thập phân — tất định
  return {
    xMm: mm(size[0]),
    yMm: mm(size[1]),
    zMm: mm(size[2]),
    minMm: [mm(b.min[0]), mm(b.min[1]), mm(b.min[2])],
    maxMm: [mm(b.max[0]), mm(b.max[1]), mm(b.max[2])],
  };
}

/** Các hệ số nhân hay gặp khi exporter dựng sai đơn vị (so với mét glTF). */
const SUSPECT_FACTORS: Array<{ factor: number; label: string }> = [
  { factor: 1000, label: 'mesh dựng bằng mm nhưng khai là mét' },
  { factor: 100, label: 'mesh dựng bằng cm nhưng khai là mét' },
  { factor: 25.4, label: 'mesh dựng bằng inch nhưng khai là mét' },
  { factor: 0.001, label: 'mesh dựng bằng mét nhưng số khai là mm (hoặc mesh nhỏ 1000 lần)' },
  { factor: 0.01, label: 'mesh nhỏ 100 lần so với số khai' },
];

function nearest(ratio: number): { factor: number; label: string } | null {
  for (const f of SUSPECT_FACTORS) {
    if (Math.abs(ratio / f.factor - 1) < 0.08) return f;
  }
  return null;
}

/**
 * ② Đối chiếu hộp bao mesh với số đã khai.
 *  - Trục: glTF quy định +Y lên ⇒ cao = yMm. Nếu `hMm` khớp zMm mà lệch yMm ⇒ nghi mesh Z-up
 *    (exporter quên đổi trục) — báo 'axis-mismatch-likely', KHÔNG tự xoay.
 *  - Đơn vị: tỉ số (khai / đo) gần 1000·100·25.4… ⇒ 'mesh-scale-mismatch' kèm nhãn hệ số.
 *  - Không có số khai: chỉ kiểm dải nghề của chính hộp bao ('mesh-scale-implausible').
 * `tolerance` = sai số tương đối chấp nhận (mặc định 5% — mesh hãng thường lệch vài mm vì bo góc).
 */
export function checkMeshAgainstDeclared(
  bounds: BoundsMm,
  declared: DimsMm,
  opts: { tolerance?: number; upAxisDeclared?: 'Y' | 'Z' } = {},
): UnitsIssue[] {
  const tol = opts.tolerance ?? 0.05;
  const out: UnitsIssue[] = [];

  if (opts.upAxisDeclared === 'Z') {
    out.push({
      code: 'axis-declared-z-up',
      level: 'error',
      message: 'Khai trục lên là Z — glTF bắt buộc +Y lên. Cần chuyển trục ở nguồn trước khi nhập, máy không tự xoay.',
    });
  }

  const hasDeclared = DIM_KEYS.some((k) => typeof declared[k] === 'number' && Number.isFinite(declared[k] as number));
  if (!hasDeclared) {
    // Không có số khai ⇒ chỉ kiểm dải nghề của hộp bao — vẫn KHÔNG biến hộp bao thành số khai.
    const dims = [bounds.xMm, bounds.yMm, bounds.zMm];
    if (dims.some((v) => v > DIM_MAX_MM) || dims.every((v) => v < DIM_MIN_MM)) {
      out.push({
        code: 'mesh-scale-implausible',
        level: 'error',
        message: `Hộp bao mesh ${fmt(bounds)} ngoài dải nghề ${DIM_MIN_MM}–${DIM_MAX_MM} mm — nghi sai đơn vị, không dùng làm kích thước.`,
        detail: { xMm: bounds.xMm, yMm: bounds.yMm, zMm: bounds.zMm },
      });
    }
    return out;
  }

  // So từng chiều: w↔x, h↔y, d↔z. Ghi tỉ số khai/đo để dò hệ số đơn vị.
  const pairs: Array<{ k: keyof DimsMm; measured: number; axis: string }> = [
    { k: 'wMm', measured: bounds.xMm, axis: 'x' },
    { k: 'hMm', measured: bounds.yMm, axis: 'y' },
    { k: 'dMm', measured: bounds.zMm, axis: 'z' },
  ];
  const ratios: number[] = [];
  const mismatched: Array<{ k: string; declared: number; measured: number }> = [];
  for (const p of pairs) {
    const dv = declared[p.k];
    if (typeof dv !== 'number' || !Number.isFinite(dv) || dv <= 0) continue;
    if (p.measured <= 0) {
      mismatched.push({ k: p.k, declared: dv, measured: p.measured });
      continue;
    }
    const r = dv / p.measured;
    ratios.push(r);
    if (Math.abs(r - 1) > tol) mismatched.push({ k: p.k, declared: dv, measured: p.measured });
  }

  if (mismatched.length === 0) return out;

  // Nghi lệch trục: h khai khớp z đo, còn y đo khớp d khai (hoán vị Y↔Z).
  const h = declared.hMm;
  const d = declared.dMm;
  if (
    typeof h === 'number' && Number.isFinite(h) && h > 0 && bounds.zMm > 0 &&
    Math.abs(h / bounds.zMm - 1) <= tol &&
    Math.abs(h / Math.max(bounds.yMm, 1e-9) - 1) > tol &&
    (d === undefined || (bounds.yMm > 0 && Math.abs(d / bounds.yMm - 1) <= tol))
  ) {
    out.push({
      code: 'axis-mismatch-likely',
      level: 'error',
      message: `Chiều cao khai ${h} mm khớp trục Z của mesh (${bounds.zMm} mm) chứ không khớp trục Y (${bounds.yMm} mm) — nghi mesh dựng Z-up. Chuyển trục ở nguồn, máy không tự xoay.`,
      detail: { hMm: h, yMm: bounds.yMm, zMm: bounds.zMm },
    });
    return out;
  }

  // Nghi lệch đơn vị: mọi tỉ số cùng gần một hệ số quen.
  const uniform = ratios.length > 0 && ratios.every((r) => Math.abs(r / ratios[0] - 1) < 0.08);
  const suspect = uniform ? nearest(ratios[0]) : null;
  out.push({
    code: 'mesh-scale-mismatch',
    level: 'error',
    message: suspect
      ? `Số khai lệch mesh đều ×${round3(ratios[0])} — giống ca "${suspect.label}". Không tự scale; sửa ở nguồn hoặc khai lại.`
      : `Số khai lệch hộp bao mesh quá ${Math.round(tol * 100)}% (${mismatched.map((m) => `${m.k} ${m.declared}↔${m.measured}`).join(' · ')}). Không tự scale.`,
    detail: {
      ...(suspect ? { suspectFactor: suspect.factor } : {}),
      ...(ratios.length ? { ratio: round3(ratios[0]) } : {}),
      mismatched: mismatched.length,
    },
  });
  return out;
}

function fmt(b: BoundsMm): string {
  return `${b.xMm}×${b.yMm}×${b.zMm} mm`;
}
function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}
