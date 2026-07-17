/**
 * lib/cad/material-texture.ts — SINH HOẠ TIẾT VẬT LIỆU BẰNG THUẬT TOÁN (procedural), thay cho
 * swatch gradient CSS phẳng cũ (materials.ts::materialSwatchStyle). Đây là phần code của E1.2
 * (xem IF-FEATURE-SPEC-P1-v2 §E1.2 + IF-PHASE1-CLOSEOUT-PLAN): "Palette hiện ẢNH THẬT vật liệu…
 * không phải tên code".
 *
 * VÌ SAO PROCEDURAL, KHÔNG DÙNG ẢNH CHỤP:
 *   InteriorFlow là tool NỘI BỘ TTT Architects. Chưa có thư viện ảnh vật liệu có license
 *   (ATLAS Vol.3 chưa nằm trên đĩa). Lấy ảnh bừa trên web rồi trưng như thư viện vật liệu của
 *   công ty là rủi ro bản quyền/nguỵ tạo — KHÔNG làm. Thay vào đó vẽ hoạ tiết bằng thuật toán:
 *   vân gỗ nhiều lớp + mắt gỗ, mạch gạch + nhiễu từng viên, vân đá midpoint-displacement, đốm
 *   granite, chip terrazzo… — trông ra "chất" vật liệu, phân biệt rõ giữa các preset, KHÔNG phải
 *   ảnh nhưng cũng KHÔNG phải ô màu phẳng. Đây là kỹ thuật CAD/design tool dùng phổ biến đúng vì
 *   lý do license này.
 *
 * KIẾN TRÚC: tách PHẦN THUẦN (generateTexturePixels — sinh buffer RGBA, KHÔNG đụng DOM, tất định,
 * test được bằng sucrase-node) khỏi PHẦN TRÌNH DUYỆT (materialTextureDataUrl — bọc buffer vào
 * <canvas> → data URL, có cache). Nhờ vậy thuật toán kiểm thử độc lập (material-texture.test.ts).
 *
 * FUTURE-PROOF: nếu SAU NÀY TTT cấp bộ ảnh thật (ATLAS Vol.3), chỉ cần set `photoUrl` cho preset
 * trong materials.ts — materialTextureDataUrl() tự ưu tiên ảnh đó, KHÔNG cần đổi code ở đây nữa.
 */

import type { MaterialDef, MaterialTexture } from './materials';

/* ───────────────────────── tiện ích thuần ───────────────────────── */

/** PRNG tất định (mulberry32) — cùng seed ⇒ cùng chuỗi số [0,1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash chuỗi → seed 32-bit (để mỗi material có hoạ tiết ổn định & khác nhau). */
export function seedFromId(id: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

type RGB = [number, number, number];

/** '#rrggbb' | '#rgb' → [r,g,b] 0..255. Màu lỗi ⇒ xám trung tính. */
export function hexToRgb(hex: string): RGB {
  let h = (hex || '').replace('#', '').trim();
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return [128, 128, 128];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

const clamp255 = (n: number): number => (n < 0 ? 0 : n > 255 ? 255 : n | 0);

/** Nội suy tuyến tính 2 màu, t 0..1. */
function mix(a: RGB, b: RGB, t: number): RGB {
  const u = t < 0 ? 0 : t > 1 ? 1 : t;
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
}

/** Cộng độ sáng (đơn vị 0..255) cho cả 3 kênh. */
function shade(c: RGB, d: number): RGB {
  return [c[0] + d, c[1] + d, c[2] + d];
}

/** Lấy tone thứ i (fallback về tone cuối/màu chính nếu thiếu). */
function toneRgb(m: MaterialDef, i: number): RGB {
  const t = m.tones && m.tones.length ? m.tones : [m.color];
  return hexToRgb(t[Math.min(i, t.length - 1)]);
}

/** Value-noise mượt trên lưới thô (bilinear) — dùng làm vân/nhiễu tần thấp. */
function makeValueNoise(size: number, cells: number, rnd: () => number): (x: number, y: number) => number {
  const g = cells + 1;
  const grid = new Float32Array(g * g);
  for (let i = 0; i < grid.length; i++) grid[i] = rnd();
  const step = size / cells;
  return (x, y) => {
    const gx = x / step;
    const gy = y / step;
    const x0 = Math.min(Math.floor(gx), cells - 1);
    const y0 = Math.min(Math.floor(gy), cells - 1);
    const fx = gx - x0;
    const fy = gy - y0;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const v00 = grid[y0 * g + x0];
    const v10 = grid[y0 * g + x0 + 1];
    const v01 = grid[(y0 + 1) * g + x0];
    const v11 = grid[(y0 + 1) * g + x0 + 1];
    const a = v00 + (v10 - v00) * sx;
    const b = v01 + (v11 - v01) * sx;
    return a + (b - a) * sy;
  };
}

/** Đường vân đá bằng midpoint-displacement: trả về mảng điểm polyline nối 2 mép. */
function veinPolyline(size: number, y0: number, rough: number, rnd: () => number): { x: number; y: number }[] {
  let pts = [
    { x: 0, y: y0 },
    { x: size, y: y0 + (rnd() - 0.5) * size * 0.3 },
  ];
  for (let iter = 0; iter < 5; iter++) {
    const next: { x: number; y: number }[] = [];
    const amp = (rough * size) / Math.pow(2, iter);
    for (let i = 0; i < pts.length - 1; i++) {
      const p = pts[i];
      const q = pts[i + 1];
      next.push(p);
      next.push({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 + (rnd() - 0.5) * amp });
    }
    next.push(pts[pts.length - 1]);
    pts = next;
  }
  return pts;
}

/** Khoảng cách điểm→đoạn (cho vẽ vân đá theo bề rộng). */
function distToSeg(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

/* ───────────────────────── sinh buffer RGBA ───────────────────────── */

/**
 * Sinh buffer RGBA (Uint8ClampedArray, dài size*size*4, alpha=255) cho 1 vật liệu.
 * THUẦN & TẤT ĐỊNH — cùng material ⇒ cùng buffer; material khác ⇒ buffer khác. KHÔNG đụng DOM.
 */
export function generateTexturePixels(m: MaterialDef, size = 96): Uint8ClampedArray {
  const buf = new Uint8ClampedArray(size * size * 4);
  const rnd = mulberry32(seedFromId(m.id));
  const painter = TEXTURE_PAINTERS[m.texture] ?? paintSolid;
  painter(buf, size, m, rnd);
  // đảm bảo alpha đục hoàn toàn
  for (let i = 3; i < buf.length; i += 4) buf[i] = 255;
  return buf;
}

type Painter = (buf: Uint8ClampedArray, size: number, m: MaterialDef, rnd: () => number) => void;

function put(buf: Uint8ClampedArray, size: number, x: number, y: number, c: RGB): void {
  const i = (y * size + x) * 4;
  buf[i] = clamp255(c[0]);
  buf[i + 1] = clamp255(c[1]);
  buf[i + 2] = clamp255(c[2]);
  buf[i + 3] = 255;
}

/* ── VÂN GỖ: nhiều lớp sin theo hướng thớ + biến thiên dải màu + 1–2 mắt gỗ ── */
function paintWood(buf: Uint8ClampedArray, size: number, m: MaterialDef, rnd: () => number): void {
  const dark = toneRgb(m, 0);
  const midC = toneRgb(m, 1);
  const light = toneRgb(m, 2);
  // hướng thớ theo patternAngle của preset (gỗ đứng vs ngang khác nhau)
  const ang = ((m.patternAngle || 0) * Math.PI) / 180;
  const ca = Math.cos(ang);
  const sa = Math.sin(ang);
  const warp = makeValueNoise(size, 4, rnd);
  const fiber = makeValueNoise(size, size / 2, rnd);
  const freq = 0.22 + rnd() * 0.06; // mật độ thớ
  // mắt gỗ
  const knots: { x: number; y: number; r: number }[] = [];
  const nKnots = 1 + (rnd() < 0.5 ? 0 : 1);
  for (let k = 0; k < nKnots; k++) {
    knots.push({ x: rnd() * size, y: rnd() * size, r: 4 + rnd() * 4 });
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const across = x * sa + y * ca; // toạ độ vuông góc thớ
      const w = (warp(x, y) - 0.5) * 10;
      const g = Math.sin((across + w) * freq);
      // dải màu: đáy→giữa→đỉnh vân
      let col: RGB = g < 0 ? mix(dark, midC, g + 1) : mix(midC, light, g);
      // sợi thớ mảnh
      col = shade(col, (fiber(x, y) - 0.5) * 14);
      // mắt gỗ: vòng đồng tâm sẫm
      for (const kn of knots) {
        const d = Math.hypot(x - kn.x, y - kn.y);
        if (d < kn.r * 2.4) {
          const ring = Math.sin(d * 1.5) * 0.5 + 0.5;
          const core = Math.max(0, 1 - d / (kn.r * 2.4));
          col = mix(col, shade(dark, -18), core * (0.45 + ring * 0.3));
        }
      }
      put(buf, size, x, y, col);
    }
  }
}

/* ── GẠCH/Ô LÁT: lưới mạch + nhiễu giá trị từng viên ── */
function paintTile(buf: Uint8ClampedArray, size: number, m: MaterialDef, rnd: () => number, cellPx?: number): void {
  const base = toneRgb(m, 0);
  const grout = toneRgb(m, 1);
  const cell = cellPx ?? Math.max(16, Math.round(size / 3));
  const groutW = Math.max(1.5, cell * 0.09);
  // sắc độ ngẫu nhiên mỗi viên
  const cols = Math.ceil(size / cell) + 1;
  const tileShade = new Float32Array(cols * cols);
  for (let i = 0; i < tileShade.length; i++) tileShade[i] = (rnd() - 0.5) * 22;
  const micro = makeValueNoise(size, size / 3, rnd);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cx = Math.floor(x / cell);
      const cy = Math.floor(y / cell);
      const inGroutX = x % cell < groutW || x % cell > cell - groutW;
      const inGroutY = y % cell < groutW || y % cell > cell - groutW;
      let col: RGB;
      if (inGroutX || inGroutY) {
        col = grout;
      } else {
        col = shade(base, tileShade[cy * cols + cx] + (micro(x, y) - 0.5) * 8);
      }
      put(buf, size, x, y, col);
    }
  }
}

/* ── GẠCH BÔNG/MOSAIC: viên nhỏ, nhiều tông xen kẽ ── */
function paintMosaic(buf: Uint8ClampedArray, size: number, m: MaterialDef, rnd: () => number): void {
  const tones = (m.tones && m.tones.length ? m.tones : [m.color]).map(hexToRgb);
  const cell = Math.max(8, Math.round(size / 8));
  const groutW = Math.max(1, cell * 0.14);
  const grout: RGB = [238, 236, 230];
  const cols = Math.ceil(size / cell) + 1;
  const idx = new Uint8Array(cols * cols);
  for (let i = 0; i < idx.length; i++) idx[i] = Math.floor(rnd() * tones.length);
  const micro = makeValueNoise(size, size / 2, rnd);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cx = Math.floor(x / cell);
      const cy = Math.floor(y / cell);
      const inGrout = x % cell < groutW || y % cell < groutW;
      let col: RGB;
      if (inGrout) col = grout;
      else col = shade(tones[idx[cy * cols + cx]], (micro(x, y) - 0.5) * 12);
      put(buf, size, x, y, col);
    }
  }
}

/* ── ĐÁ MARBLE: nền sáng + vân midpoint-displacement ── */
function paintMarble(buf: Uint8ClampedArray, size: number, m: MaterialDef, rnd: () => number): void {
  const base = toneRgb(m, 0);
  const mid = toneRgb(m, 1);
  const vein = toneRgb(m, 2);
  const mottle = makeValueNoise(size, 5, rnd);
  // nền: pha base↔mid theo nhiễu mềm
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      put(buf, size, x, y, mix(base, mid, mottle(x, y) * 0.6));
    }
  }
  // vân: vài đường chính + nhánh phụ
  const veins: { x: number; y: number }[][] = [];
  const nMain = 2 + Math.floor(rnd() * 2);
  for (let i = 0; i < nMain; i++) veins.push(veinPolyline(size, rnd() * size, 0.16, rnd));
  const nThin = 3 + Math.floor(rnd() * 3);
  for (let i = 0; i < nThin; i++) veins.push(veinPolyline(size, rnd() * size, 0.1, rnd));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let best = 999;
      for (const poly of veins) {
        for (let s = 0; s < poly.length - 1; s++) {
          const d = distToSeg(x, y, poly[s].x, poly[s].y, poly[s + 1].x, poly[s + 1].y);
          if (d < best) best = d;
          if (best < 0.5) break;
        }
      }
      if (best < 2.2) {
        const t = 1 - best / 2.2;
        const i = (y * size + x) * 4;
        const cur: RGB = [buf[i], buf[i + 1], buf[i + 2]];
        put(buf, size, x, y, mix(cur, vein, t * 0.7));
      }
    }
  }
}

/* ── ĐÁ GRANITE: nền + rất nhiều đốm nhỏ 2–3 tông ── */
function paintGranite(buf: Uint8ClampedArray, size: number, m: MaterialDef, rnd: () => number): void {
  const base = toneRgb(m, 0);
  const spA = toneRgb(m, 1);
  const spB = toneRgb(m, 2);
  const grain = makeValueNoise(size, size, rnd);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      put(buf, size, x, y, shade(base, (grain(x, y) - 0.5) * 10));
    }
  }
  const nSpeck = Math.round(size * size * 0.16);
  for (let s = 0; s < nSpeck; s++) {
    const x = Math.floor(rnd() * size);
    const y = Math.floor(rnd() * size);
    const c = rnd() < 0.5 ? spA : spB;
    const jitter = (rnd() - 0.5) * 24;
    put(buf, size, x, y, shade(c, jitter));
  }
}

/* ── ĐÁ TRAVERTINE: vệt ngang phân lớp + lỗ rỗ ── */
function paintTravertine(buf: Uint8ClampedArray, size: number, m: MaterialDef, rnd: () => number): void {
  const base = toneRgb(m, 0);
  const mid = toneRgb(m, 1);
  const dark = toneRgb(m, 2);
  const warp = makeValueNoise(size, 3, rnd);
  const grain = makeValueNoise(size, size / 2, rnd);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const band = Math.sin((y + (warp(x, y) - 0.5) * 14) * 0.35) * 0.5 + 0.5;
      let col = mix(base, mid, band * 0.7);
      col = shade(col, (grain(x, y) - 0.5) * 8);
      put(buf, size, x, y, col);
    }
  }
  // lỗ rỗ đặc trưng travertine
  const nPit = Math.round(size * 0.5);
  for (let p = 0; p < nPit; p++) {
    const cx = rnd() * size;
    const cy = rnd() * size;
    const r = 0.8 + rnd() * 1.8;
    for (let y = Math.max(0, Math.floor(cy - r)); y < Math.min(size, cy + r); y++) {
      for (let x = Math.max(0, Math.floor(cx - r)); x < Math.min(size, cx + r); x++) {
        if (Math.hypot(x - cx, y - cy) < r) {
          const i = (y * size + x) * 4;
          put(buf, size, x, y, mix([buf[i], buf[i + 1], buf[i + 2]], dark, 0.5));
        }
      }
    }
  }
}

/* ── TERRAZZO: nền + chip đá nhiều màu rải rác ── */
function paintTerrazzo(buf: Uint8ClampedArray, size: number, m: MaterialDef, rnd: () => number): void {
  const base = toneRgb(m, 0);
  const chips = (m.tones && m.tones.length > 1 ? m.tones.slice(1) : [m.color]).map(hexToRgb);
  const grain = makeValueNoise(size, size / 2, rnd);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      put(buf, size, x, y, shade(base, (grain(x, y) - 0.5) * 8));
    }
  }
  const nChip = Math.round(size * 0.9);
  for (let c = 0; c < nChip; c++) {
    const cx = rnd() * size;
    const cy = rnd() * size;
    const r = 1.2 + rnd() * 3.2;
    const col = shade(chips[Math.floor(rnd() * chips.length)], (rnd() - 0.5) * 16);
    // chip đa giác thô ≈ hình tròn méo
    const squash = 0.6 + rnd() * 0.8;
    for (let y = Math.max(0, Math.floor(cy - r)); y < Math.min(size, cy + r + 1); y++) {
      for (let x = Math.max(0, Math.floor(cx - r)); x < Math.min(size, cx + r + 1); x++) {
        const dx = (x - cx);
        const dy = (y - cy) / squash;
        if (Math.hypot(dx, dy) < r) put(buf, size, x, y, col);
      }
    }
  }
}

/* ── SƠN/ĐẶC: gần phẳng + vignette + nhiễu rất nhẹ (để không "trơ" cạnh vật liệu có vân) ── */
function paintSolid(buf: Uint8ClampedArray, size: number, m: MaterialDef, rnd: () => number): void {
  const base = toneRgb(m, 0);
  const lift = toneRgb(m, 1);
  const cx = size / 2;
  const cy = size / 2;
  const maxD = Math.hypot(cx, cy);
  const grain = makeValueNoise(size, size / 2, rnd);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - cx, y - cy) / maxD; // 0 giữa → 1 mép
      let col = mix(lift, base, d * 0.9); // sáng giữa, tối nhẹ mép
      col = shade(col, (grain(x, y) - 0.5) * 4);
      put(buf, size, x, y, col);
    }
  }
}

const TEXTURE_PAINTERS: Record<MaterialTexture, Painter> = {
  wood: paintWood,
  tile: (b, s, m, r) => paintTile(b, s, m, r),
  mosaic: paintMosaic,
  marble: paintMarble,
  granite: paintGranite,
  travertine: paintTravertine,
  terrazzo: paintTerrazzo,
  solid: paintSolid,
};

/* ───────────────────────── bọc trình duyệt (data URL + cache) ───────────────────────── */

const urlCache = new Map<string, string>();

/**
 * Trả về data URL PNG cho swatch vật liệu. Ưu tiên `photoUrl` (ảnh thật) nếu preset có set —
 * đây là điểm cắm ảnh ATLAS Vol.3 tương lai, không cần đổi code khác. Không có ảnh ⇒ vẽ procedural.
 * Có cache theo id+size. An toàn SSR (không có document ⇒ trả '' để component fallback CSS).
 */
export function materialTextureDataUrl(m: MaterialDef, size = 96): string {
  if (m.photoUrl) return m.photoUrl;
  const key = `${m.id}:${size}`;
  const hit = urlCache.get(key);
  if (hit !== undefined) return hit;
  if (typeof document === 'undefined') return '';
  try {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    const px = generateTexturePixels(m, size);
    const img = ctx.createImageData(size, size);
    img.data.set(px);
    ctx.putImageData(img, 0, 0);
    const url = canvas.toDataURL('image/png');
    urlCache.set(key, url);
    return url;
  } catch {
    return '';
  }
}
