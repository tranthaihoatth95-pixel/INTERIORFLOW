/**
 * lib/moodboard-boards.ts — 3 DẠNG moodboard editorial, dựng NGAY TRONG TRÌNH DUYỆT
 * bằng canvas từ N ảnh reference (KHÔNG giới hạn số ảnh, KHÔNG AI, không mạng).
 *
 * 3 dạng (theo hình mẫu user cấp ở test-input/1-moodboard):
 *  - 'material' — Bảng vật liệu: cụm swatch chồng nhau ở giữa + nhãn chú thích có leader-line.
 *  - 'space'    — Định hướng không gian: 1 hero lớn + thẻ ảnh chồng nhiều cỡ + tiêu đề serif đè.
 *  - 'story'    — Câu chuyện thiết kế: ảnh full-bleed điện ảnh + tiêu đề lớn + đoạn văn kể chuyện.
 *
 * Dùng chung engine palette/tile với lib/moodboard-collage.ts nhưng độc lập (file riêng).
 */

export type BoardVariant = 'material' | 'space' | 'story' | 'enso';

export interface BoardImage {
  url: string;
  label?: string; // tên vật liệu / chú thích (dạng material dùng)
}

/** Vị trí + tỉ lệ 1 ảnh trên khung, theo PHẦN TRĂM khung (0..1). Cho bảng draft chỉnh tay. */
export interface Placement {
  xf: number;
  yf: number;
  wf: number;
  hf: number;
}

export interface BoardOpts {
  variant: BoardVariant;
  eyebrow?: string; // nhãn section trên-trái, vd 'CẢM HỨNG THIẾT KẾ'
  title?: string; // tiêu đề lớn
  sub?: string; // phụ đề
  body?: string; // đoạn văn (dạng story)
  mark?: string; // tên dự án góc phải
  palette?: string[]; // palette ép sẵn (từ gu); rỗng = tự trích từ ảnh
  placements?: Placement[]; // bố cục tay từ bảng draft (song song images); thiếu = autoLayout
}

const W = 2400;
const H = 1350;
const BG = '#f5f1ea';
const INK = '#2b2622';
const MUTE = '#8c8377';
const MARGIN = 96;
const RADIUS = 10;
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "'Helvetica Neue', Arial, sans-serif";
const CJK = "'Hiragino Sans GB', 'Hiragino Sans', 'PingFang SC', 'Songti SC', serif";

interface RGB {
  r: number;
  g: number;
  b: number;
}

/* ───────────────────────── helpers ───────────────────────── */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image();
    if (!src.startsWith('data:')) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    // 1 ảnh lỗi/CORS KHÔNG phá cả board → trả 1 ô xám ấm thay thế (giữ nguyên chỉ số/bố cục).
    img.onerror = () => {
      const c = document.createElement('canvas');
      c.width = c.height = 8;
      const g = c.getContext('2d');
      if (g) {
        g.fillStyle = '#8c8377';
        g.fillRect(0, 0, 8, 8);
      }
      const fb = new Image();
      fb.onload = () => resolve(fb);
      fb.src = c.toDataURL();
    };
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** Vẽ ảnh cover-fit (crop giữa) vào ô [x,y,w,h] đã clip. */
function coverDraw(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const ir = img.width / img.height;
  const tr = w / h;
  let sw: number, sh: number, sx: number, sy: number;
  if (ir > tr) {
    sh = img.height;
    sw = sh * tr;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / tr;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/** Thẻ ảnh bo góc + shadow khối (dùng dạng space). */
function card(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  r = RADIUS,
) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.18)';
  ctx.shadowBlur = 26;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = '#fff';
  roundRect(ctx, x, y, w, h, r);
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.clip();
  coverDraw(ctx, img, x, y, w, h);
  ctx.restore();
}

/**
 * Vẽ ảnh cover-fit vào 1 canvas w×h với RÌA TAN MỜ (feather) — mask ellipse alpha:
 * đặc ở giữa, mờ dần về biên → khi drawImage chồng nhiều tile, các cạnh XOÁ NHOÀ blend
 * vào nhau (montage câu chuyện). `feather` = tỉ lệ dải mờ (0.1 rìa mảnh … 0.4 tan rộng).
 */
function featherTile(img: HTMLImageElement, w: number, h: number, feather = 0.3): HTMLCanvasElement {
  const o = document.createElement('canvas');
  o.width = Math.max(1, Math.round(w));
  o.height = Math.max(1, Math.round(h));
  const octx = o.getContext('2d')!;
  coverDraw(octx, img, 0, 0, o.width, o.height);
  // mask ellipse mềm bằng destination-in
  octx.globalCompositeOperation = 'destination-in';
  const cx = o.width / 2;
  const cy = o.height / 2;
  const rMax = Math.max(o.width, o.height) * 0.62;
  const g = octx.createRadialGradient(cx, cy, Math.min(o.width, o.height) * 0.08, cx, cy, rMax);
  g.addColorStop(0, 'rgba(0,0,0,1)');
  g.addColorStop(Math.max(0, 1 - feather), 'rgba(0,0,0,1)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  octx.fillStyle = g;
  octx.fillRect(0, 0, o.width, o.height);
  octx.globalCompositeOperation = 'source-over';
  return o;
}

function dominantColor(img: HTMLImageElement): RGB {
  const s = 48;
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s;
  const g = c.getContext('2d');
  if (!g) return { r: 200, g: 190, b: 178 };
  const ir = img.width / img.height;
  let sw: number, sh: number, sx: number, sy: number;
  if (ir > 1) {
    sh = img.height;
    sw = sh;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  g.drawImage(img, sx, sy, sw, sh, 0, 0, s, s);
  let data: Uint8ClampedArray;
  try {
    data = g.getImageData(0, 0, s, s).data;
  } catch {
    return { r: 200, g: 190, b: 178 };
  }
  const buckets = new Map<string, { r: number; g: number; b: number; n: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i],
      gg = data[i + 1],
      b = data[i + 2];
    const lum = 0.299 * r + 0.587 * gg + 0.114 * b;
    if (lum < 12 || lum > 246) continue;
    const key = `${r >> 4}-${gg >> 4}-${b >> 4}`;
    const e = buckets.get(key) ?? { r: 0, g: 0, b: 0, n: 0 };
    e.r += r;
    e.g += gg;
    e.b += b;
    e.n += 1;
    buckets.set(key, e);
  }
  if (!buckets.size) return { r: 200, g: 190, b: 178 };
  let best: { r: number; g: number; b: number; n: number } | null = null;
  for (const e of buckets.values()) if (!best || e.n > best.n) best = e;
  return { r: Math.round(best!.r / best!.n), g: Math.round(best!.g / best!.n), b: Math.round(best!.b / best!.n) };
}

const toHex = (c: RGB) =>
  '#' + [c.r, c.g, c.b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const fromHex = (h: string): RGB | null => {
  const m = /^#?([0-9a-f]{6})$/i.exec(h.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};
const dist = (a: RGB, b: RGB) => Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b);
const lumOf = (c: RGB) => 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;

function pickPalette(colors: RGB[], count: number): RGB[] {
  const picked: RGB[] = [];
  for (const c of colors) {
    if (picked.every((p) => dist(p, c) > 44)) picked.push(c);
    if (picked.length >= count) break;
  }
  for (const c of colors) {
    if (picked.length >= count) break;
    if (!picked.includes(c)) picked.push(c);
  }
  picked.sort((a, b) => lumOf(a) - lumOf(b));
  return picked.slice(0, count);
}

/** Chữ có letter-spacing (canvas không hỗ trợ tin cậy). */
function drawTracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  tracking: number,
  align: 'left' | 'right' = 'left',
) {
  if (!tracking) {
    const prev = ctx.textAlign;
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
    ctx.textAlign = prev;
    return;
  }
  const widths = [...text].map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((s, w) => s + w, 0) + tracking * Math.max(0, text.length - 1);
  let cx = align === 'right' ? x - total : x;
  const prevAlign = ctx.textAlign;
  ctx.textAlign = 'left';
  [...text].forEach((ch, i) => {
    ctx.fillText(ch, cx, y);
    cx += widths[i] + tracking;
  });
  ctx.textAlign = prevAlign;
}

/** Xuống dòng theo bề rộng — trả mảng dòng. */
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

/** Header dùng chung: eyebrow trên-trái + tên dự án góc phải + gạch chân. */
function drawHeader(ctx: CanvasRenderingContext2D, eyebrow: string, mark: string, ink: string, mute: string) {
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = mute;
  ctx.font = `600 20px ${SANS}`;
  drawTracked(ctx, 'ĐỊNH HƯỚNG THIẾT KẾ Ý TƯỞNG', MARGIN, 58, 2);
  ctx.fillStyle = ink;
  ctx.font = `800 34px ${SANS}`;
  drawTracked(ctx, eyebrow.toUpperCase(), MARGIN, 96, 1);

  ctx.fillStyle = ink;
  ctx.font = `700 24px ${SANS}`;
  drawTracked(ctx, mark.toUpperCase(), W - MARGIN, 88, 4, 'right');
}

/** Dải palette dưới cùng (dùng material/space). */
function drawPalette(ctx: CanvasRenderingContext2D, palette: RGB[], y: number) {
  const swW = 132;
  const swGap = 16;
  ctx.fillStyle = MUTE;
  ctx.font = `600 16px ${SANS}`;
  drawTracked(ctx, 'PALETTE — TRÍCH TỪ ẢNH', MARGIN, y - 12, 3);
  palette.forEach((c, i) => {
    const x = MARGIN + i * (swW + swGap);
    ctx.fillStyle = toHex(c);
    roundRect(ctx, x, y, swW, 48, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = MUTE;
    ctx.font = `13px ${SANS}`;
    drawTracked(ctx, toHex(c).toUpperCase(), x, y + 66, 1);
  });
}

/* ───────────────────────── AUTO-LAYOUT (bố cục tự động) ───────────────────────── */

const clampF = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

type Slot = [number, number, number, number]; // xf,yf,wf,hf

// Không gian: hero trái lớn + thẻ chồng nhiều cỡ.
const SPACE_SLOTS: Slot[] = [
  [0.03, 0.1, 0.42, 0.8],
  [0.4, 0.15, 0.22, 0.7],
  [0.62, 0.09, 0.35, 0.4],
  [0.62, 0.52, 0.35, 0.39],
  [0.04, 0.63, 0.17, 0.27],
  [0.22, 0.66, 0.15, 0.24],
  [0.8, 0.3, 0.17, 0.3],
  [0.45, 0.72, 0.15, 0.2],
];
// Câu chuyện: hero full + ảnh chồng feather.
const STORY_SLOTS: Slot[] = [
  [0, 0, 1, 1],
  [0.44, 0.1, 0.44, 0.5],
  [0.6, 0.5, 0.4, 0.48],
  [0.27, 0.4, 0.42, 0.5],
  [0.1, 0.24, 0.36, 0.52],
  [0.78, 0.28, 0.22, 0.4],
  [0.05, 0.55, 0.36, 0.44],
  [0.46, 0.02, 0.3, 0.36],
];

// ENSŌ concept wheel: N yếu tố ĐĂNG ĐỐI quanh tâm (chừa tâm cho vòng enso).
// 4 ảnh → 4 góc phủ canvas, feather vào tâm; nhiều hơn → thêm cạnh giữa.
const ENSO_SLOTS: Slot[] = [
  [0.0, 0.0, 0.5, 0.6],
  [0.5, 0.0, 0.5, 0.6],
  [0.0, 0.4, 0.5, 0.6],
  [0.5, 0.4, 0.5, 0.6],
  [0.27, 0.0, 0.46, 0.42],
  [0.27, 0.58, 0.46, 0.42],
  [0.0, 0.22, 0.4, 0.56],
  [0.6, 0.22, 0.4, 0.56],
];

function materialSlots(n: number): Slot[] {
  const cols = n <= 4 ? 2 : n <= 9 ? 3 : 4;
  const rows = Math.ceil(n / cols);
  const clusterW = 0.5;
  const clusterH = 0.62;
  const x0 = 0.25;
  const y0 = 0.16;
  const gap = 0.008;
  const cw = clusterW / cols;
  const ch = clusterH / rows;
  const out: Slot[] = [];
  for (let i = 0; i < n; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    out.push([x0 + c * cw, y0 + r * ch + (c % 2) * 0.01, cw - gap, ch - gap]);
  }
  return out;
}

/** Bố cục tự động theo dạng → N placement (fraction). Index 0 = ảnh chủ đạo (hero). */
export function autoLayout(variant: BoardVariant, n: number): Placement[] {
  if (n <= 0) return [];
  if (variant === 'material') return materialSlots(n).map(([xf, yf, wf, hf]) => ({ xf, yf, wf, hf }));
  const slots = variant === 'space' ? SPACE_SLOTS : variant === 'enso' ? ENSO_SLOTS : STORY_SLOTS;
  const out: Placement[] = [];
  for (let i = 0; i < n; i++) {
    let [x, y, w, h] = slots[i % slots.length];
    if (i >= slots.length) {
      const k = Math.floor(i / slots.length);
      w *= 0.7;
      h *= 0.7;
      x = clampF(x + 0.08 * k - 0.04, 0, 1 - w);
      y = clampF(y + 0.06 * k - 0.03, 0, 1 - h);
    }
    out.push({ xf: x, yf: y, wf: w, hf: h });
  }
  return out;
}

/* ───────────────────────── DẠNG 1: VẬT LIỆU ───────────────────────── */
/**
 * Swatch vật liệu (viền gọn, crisp) theo placements + nhãn chú thích 2 bên có leader-line.
 * Nhãn = label ảnh, toả trái/phải theo tâm ngang của swatch.
 */
function renderMaterial(
  ctx: CanvasRenderingContext2D,
  imgs: HTMLImageElement[],
  placements: Placement[],
  labels: string[],
  palette: RGB[],
  opts: BoardOpts,
) {
  drawHeader(ctx, opts.eyebrow || 'BẢNG VẬT LIỆU', opts.mark || 'INTERIORFLOW', INK, MUTE);
  if (opts.title) {
    ctx.fillStyle = INK;
    ctx.font = `italic 300 40px ${SERIF}`;
    drawTracked(ctx, opts.title, MARGIN, 150, 1);
  }

  interface Sw {
    x: number;
    y: number;
    w: number;
    h: number;
    label: string;
    side: 'l' | 'r';
    cy: number;
  }
  const sws: Sw[] = placements.map((p, i) => {
    const x = p.xf * W;
    const y = p.yf * H;
    const w = p.wf * W;
    const h = p.hf * H;
    const cx = x + w / 2;
    return { x, y, w, h, label: labels[i] || `Vật liệu ${i + 1}`, side: cx < W / 2 ? 'l' : 'r', cy: y + h / 2 };
  });

  // vẽ swatch crisp + shadow
  sws.forEach((s, i) => {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.16)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;
    roundRect(ctx, s.x, s.y, s.w, s.h, 6);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.restore();
    ctx.save();
    roundRect(ctx, s.x, s.y, s.w, s.h, 6);
    ctx.clip();
    coverDraw(ctx, imgs[i], s.x, s.y, s.w, s.h);
    ctx.restore();
  });

  // nhãn + leader-line
  ctx.font = `600 17px ${SANS}`;
  ctx.textBaseline = 'middle';
  for (const s of sws) {
    const isL = s.side === 'l';
    const anchorX = isL ? s.x : s.x + s.w;
    const labelX = isL ? MARGIN : W - MARGIN;
    ctx.strokeStyle = 'rgba(43,38,34,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(anchorX, s.cy);
    ctx.lineTo(labelX, s.cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(anchorX, s.cy, 3, 0, Math.PI * 2);
    ctx.fillStyle = INK;
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.textAlign = isL ? 'left' : 'right';
    const lines = wrapLines(ctx, s.label, Math.abs(anchorX - labelX) - 14);
    const lh = 22;
    const startY = s.cy - ((Math.min(2, lines.length) - 1) * lh) / 2;
    lines.slice(0, 2).forEach((ln, k) => ctx.fillText(ln, labelX, startY + k * lh));
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  drawPalette(ctx, palette, H - 92);
}

/* ───────────────────────── DẠNG 2: KHÔNG GIAN ───────────────────────── */
/**
 * Collage editorial theo placements — thẻ ảnh RÌA MỀM (feather nhẹ, bớt viền cứng),
 * chồng nhau, tiêu đề serif lớn đè góc dưới-trái. Index 0 = hero (feather ít nhất).
 */
function renderSpace(
  ctx: CanvasRenderingContext2D,
  imgs: HTMLImageElement[],
  placements: Placement[],
  palette: RGB[],
  opts: BoardOpts,
) {
  drawHeader(ctx, opts.eyebrow || 'ĐỊNH HƯỚNG KHÔNG GIAN', opts.mark || 'INTERIORFLOW', INK, MUTE);

  // vẽ từng ảnh với feather NHẸ → cạnh mềm, blend, không thẻ cứng
  placements.forEach((p, i) => {
    const w = p.wf * W;
    const h = p.hf * H;
    const x = Math.round(p.xf * W);
    const y = Math.round(p.yf * H);
    // bóng khối mềm dưới ảnh cho chiều sâu editorial
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.16)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 14;
    const tile = featherTile(imgs[i], w, h, i === 0 ? 0.1 : 0.18);
    ctx.drawImage(tile, x, y);
    ctx.restore();
  });

  // tiêu đề serif đè góc dưới-trái (theo hero placements[0])
  if (opts.title) {
    const hero = placements[0] ?? { xf: 0.03, yf: 0.1, wf: 0.42, hf: 0.8 };
    const tx = Math.round(hero.xf * W + 24);
    const ty = Math.round((hero.yf + hero.hf) * H - 24);
    ctx.fillStyle = MUTE;
    ctx.font = `600 22px ${SANS}`;
    if (opts.sub) drawTracked(ctx, opts.sub.toUpperCase(), tx + 6, ty - 96, 4);
    ctx.save();
    ctx.shadowColor = 'rgba(245,241,234,0.9)';
    ctx.shadowBlur = 24;
    ctx.fillStyle = INK;
    ctx.font = `italic 300 100px ${SERIF}`;
    ctx.fillText(opts.title, tx, ty);
    ctx.restore();
  }

  drawPalette(ctx, palette, H - 74);
}

/* ───────────────────────── DẠNG 3: CÂU CHUYỆN ───────────────────────── */
/**
 * MONTAGE điện ảnh liền mạch: N ảnh ghép CHỒNG với biên cạnh XOÁ NHOÀ (feather) blend
 * vào nhau như double-exposure — không thẻ viền cứng. + grade ấm hợp nhất tông, scrim
 * trái đậm cho chữ, tiêu đề serif lớn + đoạn văn kể chuyện. (giống ref "Silent Noise".)
 */
function renderStory(
  ctx: CanvasRenderingContext2D,
  imgs: HTMLImageElement[],
  placements: Placement[],
  palette: RGB[],
  opts: BoardOpts,
) {
  // nền tối
  ctx.fillStyle = '#141110';
  ctx.fillRect(0, 0, W, H);

  // vẽ từng ảnh theo placements, feather MẠNH → cạnh xoá nhoà, blend liền (hero index 0 feather nhẹ hơn)
  placements.forEach((p, i) => {
    const w = p.wf * W;
    const h = p.hf * H;
    const x = Math.round(p.xf * W);
    const y = Math.round(p.yf * H);
    const tile = featherTile(imgs[i], w, h, i === 0 ? 0.16 : 0.44);
    ctx.globalAlpha = i === 0 ? 1 : 0.9;
    ctx.drawImage(tile, x, y);
  });
  ctx.globalAlpha = 1;

  // grade ấm hợp nhất tông (soft-light)
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  const warm = ctx.createLinearGradient(0, 0, W, H);
  warm.addColorStop(0, 'rgba(120,80,30,0.38)');
  warm.addColorStop(1, 'rgba(184,146,86,0.3)');
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // vignette
  const vg = ctx.createRadialGradient(W * 0.5, H * 0.5, Math.min(W, H) * 0.28, W * 0.5, H * 0.5, Math.max(W, H) * 0.72);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(15,12,9,0.58)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);

  // scrim trái ĐẬM cho chữ (rộng + tối hơn để đoạn văn rõ)
  const grad = ctx.createLinearGradient(0, 0, W * 0.62, 0);
  grad.addColorStop(0, 'rgba(16,13,10,0.9)');
  grad.addColorStop(0.55, 'rgba(16,13,10,0.5)');
  grad.addColorStop(1, 'rgba(16,13,10,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  const gb = ctx.createLinearGradient(0, H * 0.5, 0, H);
  gb.addColorStop(0, 'rgba(16,13,10,0)');
  gb.addColorStop(1, 'rgba(16,13,10,0.55)');
  ctx.fillStyle = gb;
  ctx.fillRect(0, 0, W, H);

  // nền tối riêng sau KHỐI CHỮ (trái) — đảm bảo tiêu đề + đoạn văn luôn đọc rõ
  const ts = ctx.createLinearGradient(0, 0, W * 0.46, 0);
  ts.addColorStop(0, 'rgba(13,10,7,0.74)');
  ts.addColorStop(1, 'rgba(13,10,7,0)');
  ctx.fillStyle = ts;
  ctx.fillRect(0, Math.round(H * 0.22), Math.round(W * 0.46), Math.round(H * 0.72));

  const LIGHT = '#f3efe8';
  const LIGHT_MUTE = 'rgba(243,239,232,0.82)';
  drawHeader(ctx, opts.eyebrow || 'CẢM HỨNG THIẾT KẾ', opts.mark || 'INTERIORFLOW', LIGHT, LIGHT_MUTE);

  const tx = MARGIN;
  let ty = Math.round(H * 0.4);
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = LIGHT;
  ctx.font = `italic 300 128px ${SERIF}`;
  wrapLines(ctx, opts.title || 'CÂU CHUYỆN', W * 0.42).forEach((ln) => {
    ctx.fillText(ln, tx, ty);
    ty += 124;
  });

  if (opts.sub) {
    ctx.fillStyle = LIGHT;
    ctx.font = `700 30px ${SANS}`;
    wrapLines(ctx, opts.sub, W * 0.34).forEach((ln) => {
      ctx.fillText(ln, tx, ty);
      ty += 40;
    });
    ty += 14;
  }

  if (opts.body) {
    ctx.fillStyle = LIGHT_MUTE;
    ctx.font = `400 24px ${SANS}`;
    wrapLines(ctx, opts.body, W * 0.36)
      .slice(0, 9)
      .forEach((ln) => {
        ctx.fillText(ln, tx, ty);
        ty += 36;
      });
  }

  // dải palette nhỏ dưới-trái
  const py = H - 84;
  const swW = 92;
  palette.slice(0, 6).forEach((c, i) => {
    const x = MARGIN + i * (swW + 12);
    ctx.fillStyle = toHex(c);
    roundRect(ctx, x, py, swW, 38, 5);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });
}

/* ───────────────────────── DẠNG 4: 円相 ENSŌ (CONCEPT WHEEL) ───────────────────────── */

/** Vẽ vòng ENSŌ nét cọ Thiền (tapered, hở trên-phải) tại tâm. */
function drawEnsoRing(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number) {
  const steps = 620;
  const start = (148 * Math.PI) / 180;
  const end = start + (300 * Math.PI) / 180;
  let seed = 7;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280 - 0.5;
  };
  ctx.save();
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const a = start + (end - start) * t;
    const taper = Math.pow(Math.sin(Math.PI * t), 0.7);
    const bw = 5 + R * 0.085 * taper;
    const rr = R + Math.sin(a * 3 + 1) * R * 0.015 + rnd() * R * 0.02;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    ctx.globalAlpha = 0.3 + 0.6 * taper;
    ctx.fillStyle = '#EEE3CD';
    ctx.beginPath();
    ctx.arc(x, y, bw, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

/**
 * 円相 ENSŌ — bố cục ĐĂNG ĐỐI, điện ảnh: N yếu tố feather quanh tâm, vòng enso ở tâm,
 * đường tuần hoàn nối tâm↔yếu tố, nền đậm chiều sâu. Nhãn yếu tố = label ảnh.
 */
function renderEnso(
  ctx: CanvasRenderingContext2D,
  imgs: HTMLImageElement[],
  placements: Placement[],
  labels: string[],
  palette: RGB[],
  opts: BoardOpts,
) {
  const cx = W / 2;
  const cy = H / 2;
  // nền đậm ấm + radial nhẹ ở tâm
  ctx.fillStyle = '#0d0a07';
  ctx.fillRect(0, 0, W, H);
  const g0 = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.6);
  g0.addColorStop(0, 'rgba(58,40,22,0.55)');
  g0.addColorStop(1, 'rgba(13,10,7,0)');
  ctx.fillStyle = g0;
  ctx.fillRect(0, 0, W, H);

  // yếu tố feather
  placements.forEach((p, i) => {
    const w = p.wf * W;
    const h = p.hf * H;
    const x = Math.round(p.xf * W);
    const y = Math.round(p.yf * H);
    const tile = featherTile(imgs[i], w, h, 0.5);
    ctx.globalAlpha = 0.92;
    ctx.drawImage(tile, x, y);
  });
  ctx.globalAlpha = 1;

  // ÉP MOOD ĐIỆN ẢNH TỐI (multiply ấm) — để cả ảnh sáng/sketch cũng thành nền đậm.
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = 'rgba(44,31,18,0.82)';
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // grade ấm + vignette + well tối ở tâm
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = 'rgba(150,110,55,0.32)';
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  const vg = ctx.createRadialGradient(cx, cy, Math.min(W, H) * 0.28, cx, cy, Math.max(W, H) * 0.72);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(10,7,4,0.6)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  const wl = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.26);
  wl.addColorStop(0, 'rgba(12,9,6,0.62)');
  wl.addColorStop(1, 'rgba(12,9,6,0)');
  ctx.fillStyle = wl;
  ctx.fillRect(0, 0, W, H);

  const R = Math.round(W * 0.135);
  // đường tuần hoàn tâm → mỗi yếu tố
  placements.forEach((p) => {
    const ex = (p.xf + p.wf / 2) * W;
    const ey = (p.yf + p.hf / 2) * H;
    const dx = ex - cx;
    const dy = ey - cy;
    const px = cx + dx * 0.62;
    const py = cy + dy * 0.62;
    ctx.strokeStyle = 'rgba(206,168,110,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + dx * 0.28, cy + dy * 0.28);
    ctx.lineTo(px, py);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(220,192,140,0.85)';
    ctx.fill();
  });

  drawEnsoRing(ctx, cx, cy, R);

  const LIGHT = '#f0e9dc';
  const MUTE2 = 'rgba(178,160,132,0.95)';
  const ACC = '#cea668';
  // header
  ctx.textBaseline = 'middle';
  ctx.fillStyle = LIGHT;
  ctx.font = `600 30px ${CJK}`;
  ctx.textAlign = 'left';
  ctx.fillText('円相', MARGIN, 62);
  ctx.fillStyle = MUTE2;
  ctx.font = `700 19px ${SANS}`;
  ctx.fillText('—  ' + (opts.eyebrow || 'ĐỊNH HƯỚNG THIẾT KẾ Ý TƯỞNG'), MARGIN + 78, 62);
  ctx.textAlign = 'right';
  ctx.fillText((opts.mark || 'INTERIORFLOW').toUpperCase(), W - MARGIN, 62);

  // tâm
  ctx.textAlign = 'center';
  ctx.fillStyle = LIGHT;
  ctx.font = `600 52px ${CJK}`;
  ctx.fillText('円相', cx, cy - 52);
  ctx.font = `italic 300 92px ${SERIF}`;
  ctx.fillText(opts.title || 'ENSŌ', cx, cy + 28);
  ctx.fillStyle = ACC;
  ctx.font = `italic 300 31px ${SERIF}`;
  ctx.fillText(opts.sub || 'Vòng tuần hoàn vô cực', cx, cy + 96);

  // nhãn yếu tố (góc ngoài mỗi ảnh)
  ctx.textBaseline = 'middle';
  placements.forEach((p, i) => {
    const midx = p.xf + p.wf / 2;
    const midy = p.yf + p.hf / 2;
    const left = midx < 0.5;
    const top = midy < 0.5;
    const x = left ? MARGIN : W - MARGIN;
    const y = (top ? 0.1 : 0.9) * H;
    ctx.textAlign = left ? 'left' : 'right';
    ctx.fillStyle = LIGHT;
    ctx.font = `700 24px ${SANS}`;
    ctx.fillText(labels[i] || `Yếu tố ${i + 1}`, x, y);
    ctx.fillStyle = MUTE2;
    ctx.font = `400 15px ${SANS}`;
    ctx.fillText('yếu tố hình thành', x, y + 26);
  });

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

/* ───────────────────────── entry ───────────────────────── */

/**
 * Dựng 1 trang moodboard theo dạng → dataURL JPEG. Nhận N ảnh (không giới hạn).
 */
export async function renderMoodboard(images: BoardImage[], opts: BoardOpts): Promise<string> {
  if (typeof document === 'undefined') throw new Error('Moodboard chỉ dựng được ở client.');
  if (!images.length) throw new Error('Cần ít nhất 1 ảnh.');

  const imgs = await Promise.all(images.map((im) => loadImage(im.url)));
  const labels = images.map((im) => im.label || '');

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas không khả dụng.');

  // nền (story/enso tự vẽ nền tối full-bleed nên bỏ qua)
  if (opts.variant !== 'story' && opts.variant !== 'enso') {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
  }

  // palette: ưu tiên ép sẵn (gu) → hợp lệ; thiếu thì trích từ ảnh
  const forced = (opts.palette || []).map(fromHex).filter((c): c is RGB => Boolean(c));
  const palette = forced.length >= 4 ? forced.slice(0, 6) : pickPalette(imgs.map(dominantColor), 6);

  // bố cục: dùng placements tay (bảng draft) nếu khớp số ảnh; thiếu thì auto.
  const placements =
    opts.placements && opts.placements.length === imgs.length ? opts.placements : autoLayout(opts.variant, imgs.length);

  if (opts.variant === 'material') renderMaterial(ctx, imgs, placements, labels, palette, opts);
  else if (opts.variant === 'space') renderSpace(ctx, imgs, placements, palette, opts);
  else if (opts.variant === 'enso') renderEnso(ctx, imgs, placements, labels, palette, opts);
  else renderStory(ctx, imgs, placements, palette, opts);

  return canvas.toDataURL('image/jpeg', 0.92);
}

/* ───────────────────────── nhận diện style từ 1 ảnh ───────────────────────── */

export interface StyleGuess {
  descriptor: string; // mô tả style suy ra (nhồi prompt / gợi ý)
  palette: string[]; // 6 hex trích
  tone: string; // 'ấm' | 'lạnh' | 'trung tính'
  brightness: string; // 'sáng' | 'tối' | 'vừa'
  saturation: string; // 'trầm' | 'tươi' | 'vừa'
  tags: string[]; // từ khoá style gợi ý
}

/**
 * Suy luận style từ 1 ảnh upload — LOCAL, dựa palette (ấm/lạnh · sáng/tối · bão hoà).
 * Không VLM: đọc pixel → nhiệt màu, độ sáng, độ bão hoà → map sang descriptor gu.
 */
export async function inferStyleFromImage(url: string): Promise<StyleGuess> {
  const img = await loadImage(url);
  const s = 64;
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s;
  const g = c.getContext('2d');
  if (!g) throw new Error('Canvas không khả dụng.');
  coverDraw(g, img, 0, 0, s, s);
  let data: Uint8ClampedArray;
  try {
    data = g.getImageData(0, 0, s, s).data;
  } catch {
    throw new Error('Không đọc được pixel ảnh (CORS). Thử ảnh tải từ máy.');
  }

  let sumL = 0,
    sumSat = 0,
    sumWarm = 0,
    cnt = 0;
  const cols: RGB[] = [];
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i],
      gg = data[i + 1],
      b = data[i + 2];
    const max = Math.max(r, gg, b),
      min = Math.min(r, gg, b);
    const lum = (0.299 * r + 0.587 * gg + 0.114 * b) / 255;
    const sat = max === 0 ? 0 : (max - min) / max;
    sumL += lum;
    sumSat += sat;
    sumWarm += (r - b) / 255; // >0 ấm, <0 lạnh
    cnt++;
    if (i % 32 === 0) cols.push({ r, g: gg, b });
  }
  const L = sumL / cnt;
  const S = sumSat / cnt;
  const Wm = sumWarm / cnt;

  const tone = Wm > 0.06 ? 'ấm' : Wm < -0.04 ? 'lạnh' : 'trung tính';
  const brightness = L > 0.62 ? 'sáng' : L < 0.4 ? 'tối' : 'vừa';
  const saturation = S > 0.42 ? 'tươi' : S < 0.22 ? 'trầm' : 'vừa';

  // map heuristic → descriptor + tags
  const tags: string[] = [];
  if (tone === 'ấm' && saturation === 'trầm' && brightness !== 'tối') tags.push('quiet luxury', 'japandi', 'ấm', 'wabi-sabi');
  if (tone === 'ấm' && brightness === 'tối') tags.push('moody', 'cinematic', 'điện ảnh', 'ấm');
  if (tone === 'lạnh' && brightness === 'sáng') tags.push('bắc âu', 'tối giản', 'hiện đại');
  if (tone === 'lạnh' && brightness === 'tối') tags.push('industrial', 'đương đại', 'moody');
  if (tone === 'trung tính' && saturation === 'trầm') tags.push('tối giản', 'quiet luxury', 'đương đại');
  if (saturation === 'tươi') tags.push('organic', 'tự nhiên');
  if (!tags.length) tags.push('đương đại', 'tối giản');

  const uniqTags = [...new Set(tags)];
  const palette = pickPalette(cols, 6).map(toHex);
  const descriptor = `${uniqTags.slice(0, 3).join(', ')} · tông ${tone}, ${brightness}, sắc ${saturation}`;

  return { descriptor, palette, tone, brightness, saturation, tags: uniqTags };
}

/** Preset style dựng sẵn — chọn nhanh, khỏi gõ. */
export const STYLE_PRESETS: { id: string; label: string; prompt: string }[] = [
  { id: 'quiet', label: 'Quiet Luxury ấm', prompt: 'quiet luxury, ấm, travertine, gỗ óc chó, ánh sáng dịu, wabi-sabi' },
  { id: 'japandi', label: 'Japandi', prompt: 'japandi, tối giản, gỗ sồi, giấy washi, xanh rêu, tự nhiên' },
  { id: 'cinematic', label: 'Moody điện ảnh', prompt: 'moody, cinematic, tương phản cao, đồng, đá tối, ánh sáng kịch tính' },
  { id: 'scandi', label: 'Bắc Âu sáng', prompt: 'scandinavian, sáng, gỗ nhạt, trắng kem, tối giản, ấm cúng' },
  { id: 'industrial', label: 'Industrial đương đại', prompt: 'industrial, bê tông, thép, đương đại, xám, thô mộc' },
  { id: 'neoclassic', label: 'Tân cổ điển', prompt: 'neoclassic, tân cổ điển, marble, phào chỉ, đối xứng, sang trọng' },
];

export const BOARD_VARIANTS: { id: BoardVariant; label: string; hint: string }[] = [
  { id: 'enso', label: '円相 ENSŌ', hint: 'Đăng đối: vòng ở tâm + 4 yếu tố, nền tối điện ảnh' },
  { id: 'material', label: 'Vật liệu', hint: 'Swatch vật liệu + nhãn chú thích' },
  { id: 'space', label: 'Không gian', hint: 'Hero + thẻ ảnh, tiêu đề serif' },
  { id: 'story', label: 'Câu chuyện', hint: 'Full-bleed điện ảnh + đoạn văn' },
];
