/**
 * lib/gu/color-psychology.ts — PHA 1 ML "Gu Engine" (RENDER · nhóm LÀM NGAY tất định).
 *
 * ÁNH XẠ TẤT ĐỊNH palette hex → tâm-lý-màu (emotion) + TRỘN/GOM palette theo LAB. Bám mục 2 của
 * docs/ML-GU-ENGINE-PROPOSAL.md (§2a.7 "Tâm lý màu" + §2b "Palette + tỉ trọng LAB"):
 *   "ánh xạ tất định palette→cảm xúc, KHÔNG phải model — dùng để giải thích vì sao gu này hợp
 *    không gian nghỉ dưỡng"; và bin/quantize LAB thay so-hex-khít.
 *
 * FILE MỚI — BẢN LAB ĐỘC LẬP, KHÔNG sửa `lib/gu.ts` (mergePalette cũ so-hex-khít vẫn nguyên).
 * 100% local, 0 key/GPU, thuần số học màu (sRGB→XYZ→CIELAB D65). Không phụ thuộc DOM/React.
 *
 * HOOK (để chủ dự án tự cắm sau, KHÔNG làm ở pha này):
 *   - `buildGuProfile` (lib/gu.ts:77) có thể thêm trường `moods = paletteMood(profile.palette)`.
 *   - `guToPrompt` (lib/gu.ts:128) nối `moods` vào prompt render.
 *   - thay `mergePalette` (lib/gu.ts:60) bằng `mixPaletteLab` khi muốn gom màu theo cảm quan.
 */

/* ═══════════════════════ KIỂU ═══════════════════════ */

/** Nhãn tâm-lý-màu (proposal §2a.7). */
export type ColorMood =
  | 'warm-inviting'    // đỏ/cam/nâu ấm — mời gọi, ấm cúng
  | 'calm-restorative' // xanh lá/greige — an dịu, phục hồi
  | 'serene-cool'      // xanh lam nhạt — thanh thoát, mát
  | 'dramatic-moody'   // tối/tương phản — kịch tính, trầm
  | 'luxe-neutral';    // kem/champagne/đen nhấn — sang, trung tính

export interface Lab { L: number; a: number; b: number }
export interface Rgb { r: number; g: number; b: number }

/** Nhãn mood + tỉ trọng (0..1) trong palette + vài lý do người đọc được. */
export interface MoodWeight {
  mood: ColorMood;
  weight: number;
}

export interface PaletteMood {
  dominant: ColorMood;
  moods: MoodWeight[];       // xếp giảm dần theo weight (tổng ≈ 1)
  reasons: string[];         // giải thích tất định ("#8a5a3c: nâu ấm → warm-inviting")
}

/* ═══════════════════════ CHUYỂN ĐỔI MÀU ═══════════════════════ */

/** '#rrggbb' | 'rrggbb' | '#rgb' → {r,g,b} 0..255. null nếu sai định dạng. */
export function hexToRgb(hex: string): Rgb | null {
  let h = (hex || '').trim().toLowerCase();
  if (h.startsWith('#')) h = h.slice(1);
  if (/^[0-9a-f]{3}$/.test(h)) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/.test(h)) return null;
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

function clampByte(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

export function rgbToHex(c: Rgb): string {
  const to = (v: number) => clampByte(v).toString(16).padStart(2, '0');
  return `#${to(c.r)}${to(c.g)}${to(c.b)}`;
}

function srgbToLinear(u8: number): number {
  const c = u8 / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function linearToSrgb(l: number): number {
  const c = l <= 0.0031308 ? l * 12.92 : 1.055 * Math.pow(l, 1 / 2.4) - 0.055;
  return c * 255;
}

// D65 reference white
const XN = 0.95047;
const YN = 1.0;
const ZN = 1.08883;

function fLab(t: number): number {
  const d = 6 / 29;
  return t > d * d * d ? Math.cbrt(t) : t / (3 * d * d) + 4 / 29;
}

function fLabInv(t: number): number {
  const d = 6 / 29;
  return t > d ? t * t * t : 3 * d * d * (t - 4 / 29);
}

export function rgbToLab(c: Rgb): Lab {
  const r = srgbToLinear(c.r);
  const g = srgbToLinear(c.g);
  const b = srgbToLinear(c.b);
  // linear sRGB → XYZ (D65)
  const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / XN;
  const y = (0.2126729 * r + 0.7151522 * g + 0.0721750 * b) / YN;
  const z = (0.0193339 * r + 0.1191920 * g + 0.9503041 * b) / ZN;
  const fx = fLab(x);
  const fy = fLab(y);
  const fz = fLab(z);
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

export function labToRgb(lab: Lab): Rgb {
  const fy = (lab.L + 16) / 116;
  const fx = fy + lab.a / 500;
  const fz = fy - lab.b / 200;
  const x = XN * fLabInv(fx);
  const y = YN * fLabInv(fy);
  const z = ZN * fLabInv(fz);
  // XYZ → linear sRGB
  const r = 3.2404542 * x - 1.5371385 * y - 0.4985314 * z;
  const g = -0.9692660 * x + 1.8760108 * y + 0.0415560 * z;
  const b = 0.0556434 * x - 0.2040259 * y + 1.0572252 * z;
  return { r: clampByte(linearToSrgb(r)), g: clampByte(linearToSrgb(g)), b: clampByte(linearToSrgb(b)) };
}

/** ΔE*76 (khoảng cách Euclid trong CIELAB) — đủ cho gom/so palette; rẻ, tất định. */
export function deltaE(a: Lab, b: Lab): number {
  return Math.hypot(a.L - b.L, a.a - b.a, a.b - b.b);
}

/**
 * ΔE00 (CIEDE2000, CIE 142-2001) — kL=kC=kH=1.
 *
 * VÌ SAO THÊM, KHÔNG THAY `deltaE` (05/08, phiếu bảng màu sơn VIỆC 2):
 *   ΔE*76 coi CIELAB là đều nhau mọi hướng — SAI với cảm nhận thật, nặng nhất ở **vùng lam/lục**:
 *   hai màu xanh lam lệch nhau rõ mắt thường vẫn cho ΔE76 nhỏ (Lab kéo giãn trục b* vùng lam),
 *   nên "màu gần nhất" tra ra sai hẳn tông. CIEDE2000 vá đúng chỗ đó bằng 4 hiệu chỉnh: bù chroma
 *   thấp (G, vùng gần trung tính), trọng số S_L/S_C/S_H theo vị trí trong không gian, và số hạng
 *   xoay R_T cho vùng lam (h′≈275°) — chính là số hạng làm ΔE00 ≠ ΔE76 nhiều nhất ở vùng đó.
 *   Tra MÃ SƠN thì sai tông là sai đơn hàng thật ⇒ dùng ΔE00.
 *
 *   `deltaE` (ΔE76) GIỮ NGUYÊN, không đụng — `paletteMood`/`mixPaletteLab`/`gu.ts` đang dùng nó
 *   để GOM/BIN palette (bài toán "hai hex này coi như một màu"), ở đó rẻ + tất định là đủ và đổi
 *   thước đo sẽ đổi kết quả gu đã học của người dùng. Hai thước đo, hai việc khác nhau (K4:
 *   không thêm thứ không có nơi tiêu thụ — nơi tiêu thụ ΔE00 là `lib/gu/pantone.ts nearestColor`).
 */
export function deltaE2000(a: Lab, b: Lab): number {
  const kL = 1;
  const kC = 1;
  const kH = 1;
  const rad = Math.PI / 180;
  const deg = 180 / Math.PI;

  const C1 = Math.hypot(a.a, a.b);
  const C2 = Math.hypot(b.a, b.b);
  const Cbar = (C1 + C2) / 2;
  const Cbar7 = Math.pow(Cbar, 7);
  // G: bù chroma thấp — kéo trục a* ra ở vùng gần trung tính, nơi ΔE76 đánh giá thiếu.
  const G = 0.5 * (1 - Math.sqrt(Cbar7 / (Cbar7 + Math.pow(25, 7))));

  const a1p = (1 + G) * a.a;
  const a2p = (1 + G) * b.a;
  const C1p = Math.hypot(a1p, a.b);
  const C2p = Math.hypot(a2p, b.b);

  // atan2 trả (-180,180] → đưa về [0,360). Chroma = 0 thì hue vô nghĩa, quy ước 0 (CIE 142-2001).
  const hue = (y: number, x: number): number => {
    if (y === 0 && x === 0) return 0;
    const h = Math.atan2(y, x) * deg;
    return h >= 0 ? h : h + 360;
  };
  const h1p = hue(a.b, a1p);
  const h2p = hue(b.b, a2p);

  const dLp = b.L - a.L;
  const dCp = C2p - C1p;

  let dhp: number;
  if (C1p * C2p === 0) dhp = 0;
  else {
    dhp = h2p - h1p;
    if (dhp > 180) dhp -= 360;
    else if (dhp < -180) dhp += 360;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp / 2) * rad);

  const Lbarp = (a.L + b.L) / 2;
  const Cbarp = (C1p + C2p) / 2;

  let hbarp: number;
  if (C1p * C2p === 0) hbarp = h1p + h2p;
  else if (Math.abs(h1p - h2p) <= 180) hbarp = (h1p + h2p) / 2;
  else if (h1p + h2p < 360) hbarp = (h1p + h2p + 360) / 2;
  else hbarp = (h1p + h2p - 360) / 2;

  const T =
    1 -
    0.17 * Math.cos((hbarp - 30) * rad) +
    0.24 * Math.cos(2 * hbarp * rad) +
    0.32 * Math.cos((3 * hbarp + 6) * rad) -
    0.2 * Math.cos((4 * hbarp - 63) * rad);

  const dTheta = 30 * Math.exp(-Math.pow((hbarp - 275) / 25, 2));
  const Cbarp7 = Math.pow(Cbarp, 7);
  const RC = 2 * Math.sqrt(Cbarp7 / (Cbarp7 + Math.pow(25, 7)));
  const SL = 1 + (0.015 * Math.pow(Lbarp - 50, 2)) / Math.sqrt(20 + Math.pow(Lbarp - 50, 2));
  const SC = 1 + 0.045 * Cbarp;
  const SH = 1 + 0.015 * Cbarp * T;
  const RT = -Math.sin(2 * dTheta * rad) * RC; // số hạng xoay — vùng lam h′≈275°

  const tL = dLp / (kL * SL);
  const tC = dCp / (kC * SC);
  const tH = dHp / (kH * SH);
  return Math.sqrt(tL * tL + tC * tC + tH * tH + RT * tC * tH);
}

/** HSL từ RGB (h 0..360, s/l 0..1) — dùng cho phân loại tâm-lý-màu theo hue. */
export function rgbToHsl(c: Rgb): { h: number; s: number; l: number } {
  const r = c.r / 255;
  const g = c.g / 255;
  const b = c.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r: h = ((g - b) / d) % 6; break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4; break;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, l };
}

/* ═══════════════════════ TÂM-LÝ-MÀU (tất định) ═══════════════════════ */

/**
 * 1 màu hex → nhãn tâm-lý-màu. Luật (tất định, theo lý thuyết màu). Dùng CHROMA LAB (không phải
 * độ bão hoà HSL) để tách trung tính, vì HSL-saturation phóng đại với màu SÁNG (kem/champagne có
 * hslS cao giả tạo dù thực chất rất nhạt màu):
 *   - rất tối (L < 22)                    → dramatic-moody
 *   - chroma LAB thấp (< 13)              → luxe-neutral (kem/greige/champagne/đen-trắng)
 *   - còn lại phân theo HUE:
 *       đỏ/cam/nâu ấm (h<45 hoặc ≥330)    → warm-inviting
 *       vàng-lục/lục (45..170)            → calm-restorative
 *       lam nhạt/lam (170..255)           → serene-cool
 *       tím/hồng-tím (255..330)           → dramatic-moody
 * Trả null nếu hex sai.
 */
export function colorMood(hex: string): ColorMood | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const lab = rgbToLab(rgb);
  const chroma = Math.hypot(lab.a, lab.b);
  const { h } = rgbToHsl(rgb);
  if (lab.L < 22) return 'dramatic-moody';
  if (chroma < 13) return 'luxe-neutral';
  if (h < 45 || h >= 330) return 'warm-inviting';
  if (h < 170) return 'calm-restorative';
  if (h < 255) return 'serene-cool';
  return 'dramatic-moody';
}

const MOOD_LABEL_VI: Record<ColorMood, string> = {
  'warm-inviting': 'ấm mời gọi',
  'calm-restorative': 'an dịu phục hồi',
  'serene-cool': 'thanh mát',
  'dramatic-moody': 'kịch tính trầm',
  'luxe-neutral': 'sang trung tính',
};

/**
 * Palette (mảng hex) → hồ sơ tâm-lý-màu tổng hợp. Mỗi màu 1 phiếu; đếm theo mood, chuẩn hoá về
 * tỉ trọng. `dominant` = mood nhiều phiếu nhất (tie-break theo thứ tự cố định để TẤT ĐỊNH).
 */
export function paletteMood(palette: string[]): PaletteMood {
  const order: ColorMood[] = ['warm-inviting', 'calm-restorative', 'serene-cool', 'dramatic-moody', 'luxe-neutral'];
  const tally: Record<ColorMood, number> = {
    'warm-inviting': 0, 'calm-restorative': 0, 'serene-cool': 0, 'dramatic-moody': 0, 'luxe-neutral': 0,
  };
  const reasons: string[] = [];
  let n = 0;
  for (const hex of palette) {
    const m = colorMood(hex);
    if (!m) continue;
    tally[m] += 1;
    n += 1;
    if (reasons.length < 6) reasons.push(`${hexToRgb(hex) ? rgbToHex(hexToRgb(hex)!) : hex}: ${MOOD_LABEL_VI[m]} → ${m}`);
  }
  if (n === 0) {
    return { dominant: 'luxe-neutral', moods: [], reasons: ['palette rỗng/không hợp lệ → mặc định trung tính'] };
  }
  const moods: MoodWeight[] = order
    .map((mood) => ({ mood, weight: tally[mood] / n }))
    .filter((m) => m.weight > 0)
    .sort((x, y) => (y.weight - x.weight) || order.indexOf(x.mood) - order.indexOf(y.mood));
  return { dominant: moods[0].mood, moods, reasons };
}

/* ═══════════════════════ TRỘN / GOM PALETTE THEO LAB ═══════════════════════ */

interface Cluster { lab: Lab; count: number; firstIdx: number }

/**
 * GOM palette theo LAB (bản MỚI thay cho so-hex-khít của gu.ts:mergePalette). Gộp các màu cách
 * nhau < `mergeDeltaE` (ΔE*76) vào 1 cụm (centroid = trung bình LAB có trọng số), rồi trả centroid
 * mỗi cụm dạng hex, XẾP GIẢM DẦN theo số màu trong cụm (tie-break theo thứ tự xuất hiện). Tất định.
 *
 * @param palette danh sách hex (có thể trùng / gần trùng)
 * @param opts.mergeDeltaE ngưỡng gộp (mặc định 12 — ΔE ~"khác vừa phải")
 * @param opts.maxColors số màu tối đa trả về (mặc định 6, khớp mergePalette cũ)
 */
export function mixPaletteLab(
  palette: string[],
  opts?: { mergeDeltaE?: number; maxColors?: number },
): string[] {
  const thr = opts?.mergeDeltaE ?? 12;
  const topN = opts?.maxColors ?? 6;
  const clusters: Cluster[] = [];

  palette.forEach((hex, idx) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return;
    const lab = rgbToLab(rgb);
    let best: Cluster | null = null;
    let bestD = Infinity;
    for (const c of clusters) {
      const d = deltaE(c.lab, lab);
      if (d < bestD) { bestD = d; best = c; }
    }
    if (best && bestD < thr) {
      // trung bình LAB có trọng số (running mean) → centroid ổn định
      const n = best.count + 1;
      best.lab = {
        L: (best.lab.L * best.count + lab.L) / n,
        a: (best.lab.a * best.count + lab.a) / n,
        b: (best.lab.b * best.count + lab.b) / n,
      };
      best.count = n;
    } else {
      clusters.push({ lab, count: 1, firstIdx: idx });
    }
  });

  return clusters
    .sort((x, y) => (y.count - x.count) || (x.firstIdx - y.firstIdx))
    .slice(0, topN)
    .map((c) => rgbToHex(labToRgb(c.lab)));
}

/** Trộn TUYẾN TÍNH 2 màu trong không gian LAB (t=0 → a, t=1 → b) rồi trả hex. */
export function mixLab(hexA: string, hexB: string, t = 0.5): string | null {
  const ra = hexToRgb(hexA);
  const rb = hexToRgb(hexB);
  if (!ra || !rb) return null;
  const la = rgbToLab(ra);
  const lb = rgbToLab(rb);
  const mix: Lab = {
    L: la.L + (lb.L - la.L) * t,
    a: la.a + (lb.a - la.a) * t,
    b: la.b + (lb.b - la.b) * t,
  };
  return rgbToHex(labToRgb(mix));
}
