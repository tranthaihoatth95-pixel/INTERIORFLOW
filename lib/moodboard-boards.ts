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

export type BoardVariant = 'material' | 'space' | 'story';

export interface BoardImage {
  url: string;
  label?: string; // tên vật liệu / chú thích (dạng material dùng)
}

export interface BoardOpts {
  variant: BoardVariant;
  eyebrow?: string; // nhãn section trên-trái, vd 'CẢM HỨNG THIẾT KẾ'
  title?: string; // tiêu đề lớn
  sub?: string; // phụ đề
  body?: string; // đoạn văn (dạng story)
  mark?: string; // tên dự án góc phải
  palette?: string[]; // palette ép sẵn (từ gu); rỗng = tự trích từ ảnh
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

interface RGB {
  r: number;
  g: number;
  b: number;
}

/* ───────────────────────── helpers ───────────────────────── */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith('data:')) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Không tải được 1 ảnh reference.'));
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

/* ───────────────────────── DẠNG 1: VẬT LIỆU ───────────────────────── */
/**
 * Cụm swatch chồng nhau ở giữa + nhãn chú thích 2 bên có leader-line.
 * Ảnh xếp thành khối lệch tâm (bố cục brick lệch), nhãn = label ảnh, toả trái/phải.
 */
function renderMaterial(
  ctx: CanvasRenderingContext2D,
  imgs: HTMLImageElement[],
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

  const n = imgs.length;
  // Khối swatch: lưới brick lệch tâm, chừa lề 2 bên cho nhãn.
  const clusterW = Math.round(W * 0.5);
  const clusterX = Math.round((W - clusterW) / 2);
  const top = 210;
  const bottom = H - 180;
  const clusterH = bottom - top;

  const cols = n <= 4 ? 2 : n <= 9 ? 3 : 4;
  const rows = Math.ceil(n / cols);
  const gap = 14;
  const cw = (clusterW - gap * (cols - 1)) / cols;
  const ch = (clusterH - gap * (rows - 1)) / rows;

  interface Sw {
    x: number;
    y: number;
    w: number;
    h: number;
    label: string;
    side: 'l' | 'r';
    cx: number;
    cy: number;
  }
  const sws: Sw[] = [];
  for (let i = 0; i < n; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    // lệch brick: hàng lẻ dịch xuống chút
    const offY = (c % 2) * 12;
    const x = Math.round(clusterX + c * (cw + gap));
    const y = Math.round(top + r * (ch + gap) + offY);
    const side: 'l' | 'r' = c < cols / 2 ? 'l' : 'r';
    sws.push({ x, y, w: Math.round(cw), h: Math.round(ch), label: labels[i] || `Vật liệu ${i + 1}`, side, cx: x + cw / 2, cy: y + ch / 2 });
  }

  // vẽ swatch (chồng nhẹ bằng shadow)
  for (const s of sws) {
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
    coverDraw(ctx, imgs[sws.indexOf(s)], s.x, s.y, s.w, s.h);
    ctx.restore();
  }

  // nhãn + leader-line
  ctx.font = `600 17px ${SANS}`;
  ctx.textBaseline = 'middle';
  for (const s of sws) {
    const isL = s.side === 'l';
    const anchorX = isL ? s.x : s.x + s.w;
    const labelX = isL ? MARGIN : W - MARGIN;
    const elbowX = isL ? clusterX - 40 : clusterX + clusterW + 40;
    // đường dẫn
    ctx.strokeStyle = 'rgba(43,38,34,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(anchorX, s.cy);
    ctx.lineTo(elbowX, s.cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(anchorX, s.cy, 3, 0, Math.PI * 2);
    ctx.fillStyle = INK;
    ctx.fill();
    // nhãn (bọc 2 dòng nếu dài)
    ctx.fillStyle = INK;
    ctx.textAlign = isL ? 'left' : 'right';
    const lines = wrapLines(ctx, s.label, Math.abs(elbowX - labelX) - 12);
    const lh = 22;
    const startY = s.cy - ((lines.length - 1) * lh) / 2;
    lines.slice(0, 2).forEach((ln, k) => ctx.fillText(ln, labelX, startY + k * lh));
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  drawPalette(ctx, palette, H - 92);
}

/* ───────────────────────── DẠNG 2: KHÔNG GIAN ───────────────────────── */
/**
 * Collage editorial: 1 hero lớn trái + cột thẻ dọc giữa + cụm thẻ nhỏ phải,
 * thẻ chồng nhau nhẹ, tiêu đề serif lớn đè góc dưới-trái.
 */
function renderSpace(
  ctx: CanvasRenderingContext2D,
  imgs: HTMLImageElement[],
  palette: RGB[],
  opts: BoardOpts,
) {
  drawHeader(ctx, opts.eyebrow || 'ĐỊNH HƯỚNG KHÔNG GIAN', opts.mark || 'INTERIORFLOW', INK, MUTE);

  const top = 140;
  const bottom = H - 150;
  const areaH = bottom - top;
  const n = imgs.length;
  const gap = 22;

  // hero trái (~46% rộng)
  const heroW = Math.round(W * 0.4);
  const heroX = MARGIN;
  card(ctx, imgs[0], heroX, top, heroW, areaH, 12);

  let idx = 1;
  // cột giữa: 1 thẻ dọc lớn chồng lên hero
  const midW = Math.round(W * 0.2);
  const midX = heroX + heroW - 40; // chồng 40px
  if (idx < n) {
    const mh = Math.round(areaH * 0.82);
    const my = top + Math.round((areaH - mh) / 2);
    card(ctx, imgs[idx++], midX, my, midW, mh, 10);
  }

  // cụm phải: lưới thẻ nhỏ
  const rightX = midX + midW + gap;
  const rightW = W - MARGIN - rightX;
  const rest = n - idx;
  if (rest > 0) {
    const cols = rest <= 2 ? 1 : 2;
    const rows = Math.ceil(rest / cols);
    const cw = (rightW - gap * (cols - 1)) / cols;
    const chh = (areaH - gap * (rows - 1)) / rows;
    for (let k = 0; k < rest; k++) {
      const c = k % cols;
      const r = Math.floor(k / cols);
      const x = Math.round(rightX + c * (cw + gap));
      const y = Math.round(top + r * (chh + gap));
      card(ctx, imgs[idx + k], x, y, Math.round(cw), Math.round(chh), 10);
    }
  }

  // tiêu đề serif đè góc dưới-trái
  if (opts.title) {
    const ty = bottom - 30;
    ctx.fillStyle = MUTE;
    ctx.font = `600 22px ${SANS}`;
    if (opts.sub) drawTracked(ctx, opts.sub.toUpperCase(), heroX + 30, ty - 96, 4);
    ctx.save();
    ctx.shadowColor = 'rgba(245,241,234,0.9)';
    ctx.shadowBlur = 24;
    ctx.fillStyle = INK;
    ctx.font = `italic 300 108px ${SERIF}`;
    ctx.fillText(opts.title, heroX + 24, ty);
    ctx.restore();
  }

  drawPalette(ctx, palette, H - 74);
}

/* ───────────────────────── DẠNG 3: CÂU CHUYỆN ───────────────────────── */
/**
 * Full-bleed điện ảnh: ảnh chủ đạo phủ nền + scrim tối trái, tiêu đề serif lớn +
 * đoạn văn kể chuyện bên trái. Ảnh phụ chồng dạng thẻ nghiêng góc phải.
 */
function renderStory(
  ctx: CanvasRenderingContext2D,
  imgs: HTMLImageElement[],
  palette: RGB[],
  opts: BoardOpts,
) {
  // nền = ảnh đầu full-bleed
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  ctx.clip();
  coverDraw(ctx, imgs[0], 0, 0, W, H);
  ctx.restore();

  // scrim: tối bên trái → trong bên phải (cho chữ nổi)
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, 'rgba(20,17,14,0.86)');
  grad.addColorStop(0.5, 'rgba(20,17,14,0.42)');
  grad.addColorStop(1, 'rgba(20,17,14,0.08)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  // thêm scrim đáy nhẹ
  const gb = ctx.createLinearGradient(0, H * 0.5, 0, H);
  gb.addColorStop(0, 'rgba(20,17,14,0)');
  gb.addColorStop(1, 'rgba(20,17,14,0.5)');
  ctx.fillStyle = gb;
  ctx.fillRect(0, 0, W, H);

  const LIGHT = '#f3efe8';
  const LIGHT_MUTE = 'rgba(243,239,232,0.72)';
  drawHeader(ctx, opts.eyebrow || 'CẢM HỨNG THIẾT KẾ', opts.mark || 'INTERIORFLOW', LIGHT, LIGHT_MUTE);

  // ảnh phụ: thẻ chồng góc phải
  const extras = imgs.slice(1, 4);
  extras.forEach((im, k) => {
    const w = 460;
    const h = 300;
    const x = W - MARGIN - w + k * 8;
    const y = 200 + k * 250;
    card(ctx, im, x, y, w, h, 10);
  });

  // tiêu đề serif lớn
  const tx = MARGIN;
  let ty = Math.round(H * 0.42);
  ctx.fillStyle = LIGHT;
  ctx.font = `italic 300 132px ${SERIF}`;
  const titleLines = (opts.title || 'CÂU CHUYỆN').split(/\s+/);
  // xuống dòng thủ công theo 1-2 từ mỗi dòng cho khối tiêu đề cao
  const tLines = wrapLines(ctx, opts.title || 'CÂU CHUYỆN', W * 0.42);
  tLines.forEach((ln) => {
    ctx.fillText(ln, tx, ty);
    ty += 130;
  });
  void titleLines;

  if (opts.sub) {
    ctx.fillStyle = LIGHT;
    ctx.font = `700 30px ${SANS}`;
    const sLines = wrapLines(ctx, opts.sub, W * 0.36);
    sLines.forEach((ln) => {
      ctx.fillText(ln, tx, ty);
      ty += 40;
    });
    ty += 12;
  }

  if (opts.body) {
    ctx.fillStyle = LIGHT_MUTE;
    ctx.font = `400 24px ${SANS}`;
    const bLines = wrapLines(ctx, opts.body, W * 0.38);
    bLines.slice(0, 10).forEach((ln) => {
      ctx.fillText(ln, tx, ty);
      ty += 36;
    });
  }

  // dải palette nhỏ dưới-trái (trên nền tối → viền sáng)
  const py = H - 88;
  const swW = 96;
  palette.slice(0, 6).forEach((c, i) => {
    const x = MARGIN + i * (swW + 12);
    ctx.fillStyle = toHex(c);
    roundRect(ctx, x, py, swW, 40, 5);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });
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

  // nền (story vẽ đè ảnh full-bleed nên bỏ qua)
  if (opts.variant !== 'story') {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
  }

  // palette: ưu tiên ép sẵn (gu) → hợp lệ; thiếu thì trích từ ảnh
  const forced = (opts.palette || []).map(fromHex).filter((c): c is RGB => Boolean(c));
  const palette = forced.length >= 4 ? forced.slice(0, 6) : pickPalette(imgs.map(dominantColor), 6);

  if (opts.variant === 'material') renderMaterial(ctx, imgs, labels, palette, opts);
  else if (opts.variant === 'space') renderSpace(ctx, imgs, palette, opts);
  else renderStory(ctx, imgs, palette, opts);

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
  { id: 'material', label: 'Vật liệu', hint: 'Swatch vật liệu + nhãn chú thích' },
  { id: 'space', label: 'Không gian', hint: 'Hero + thẻ ảnh, tiêu đề serif' },
  { id: 'story', label: 'Câu chuyện', hint: 'Full-bleed điện ảnh + đoạn văn' },
];
