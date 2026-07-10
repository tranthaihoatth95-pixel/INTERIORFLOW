/**
 * lib/moodboard-collage.ts — dựng 1 trang moodboard editorial (quiet-luxury AKH-IKI)
 * NGAY TRONG TRÌNH DUYỆT bằng canvas, từ nhiều ảnh reference. KHÔNG AI, không mạng.
 *
 * Port 1:1 bố cục từ scripts/moodboard/build-collage.mjs (bản sharp offline):
 * nền warm off-white, hero+grid thích ứng số ảnh, caption chip số, và dải palette
 * 6 swatch trích màu trội từ chính ảnh. Chạy trong node execute (client-side) → dataURL JPEG.
 */

export type CollageLayout = 'auto' | 'grid' | 'justified';

export interface CollageOpts {
  eyebrow?: string;
  title?: string;
  sub?: string;
  mark?: string;
  layout?: CollageLayout;
}

// ---- Bảng gu / layout (đồng bộ với bản sharp) ----
const W = 2400;
const H = 1350;
const BG = '#f5f1ea';
const INK = '#2b2622';
const MUTE = '#8c8377';
const GUTTER = 26;
const RADIUS = 10;
const MARGIN = 96;
const HEADER_H = 210;
const PALETTE_H = 132;
const SERIF = "Georgia, 'Times New Roman', serif";

interface Tile {
  x: number;
  y: number;
  w: number;
  h: number;
  img: HTMLImageElement;
  tag: string;
}
interface RGB {
  r: number;
  g: number;
  b: number;
}

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

/** Vẽ ảnh cover-fit (crop giữa) vào ô bo góc. */
function drawTile(ctx: CanvasRenderingContext2D, t: Tile) {
  // shadow giả khối
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.09)';
  roundRect(ctx, t.x - 2, t.y + 4, t.w, t.h, RADIUS);
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundRect(ctx, t.x, t.y, t.w, t.h, RADIUS);
  ctx.clip();
  const ir = t.img.width / t.img.height;
  const tr = t.w / t.h;
  let sw: number, sh: number, sx: number, sy: number;
  if (ir > tr) {
    sh = t.img.height;
    sw = sh * tr;
    sx = (t.img.width - sw) / 2;
    sy = 0;
  } else {
    sw = t.img.width;
    sh = sw / tr;
    sx = 0;
    sy = (t.img.height - sh) / 2;
  }
  ctx.drawImage(t.img, sx, sy, sw, sh, t.x, t.y, t.w, t.h);
  ctx.restore();

  // caption chip (số) góc dưới-trái
  const cx = t.x + 18;
  const cy = t.y + t.h - 18;
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  roundRect(ctx, cx, cy - 26, 46, 30, 6);
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.font = `15px ${SERIF}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(t.tag, cx + 23, cy - 6);
  ctx.restore();
}

/** Trích màu trội 1 ảnh (histogram 4-bit/kênh, bỏ đen/trắng cực trị). */
function dominantColor(img: HTMLImageElement): RGB {
  const s = 48;
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s;
  const g = c.getContext('2d');
  if (!g) return { r: 200, g: 190, b: 178 };
  // cover-fit vào 48x48
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

const hex = (c: RGB) =>
  '#' + [c.r, c.g, c.b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
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

interface Cell {
  x: number;
  y: number;
  w: number;
  h: number;
  i: number;
}

function packGrid(n: number, area: { x0: number; y0: number; w: number; h: number }, startIdx: number): Cell[] {
  const { x0, y0, w, h } = area;
  const cols = n <= 3 ? n : n <= 6 ? 3 : n <= 8 ? 4 : Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  const cw = (w - GUTTER * (cols - 1)) / cols;
  const ch = (h - GUTTER * (rows - 1)) / rows;
  const out: Cell[] = [];
  for (let i = 0; i < n; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    out.push({
      x: Math.round(x0 + c * (cw + GUTTER)),
      y: Math.round(y0 + r * (ch + GUTTER)),
      w: Math.round(cw),
      h: Math.round(ch),
      i: startIdx + i,
    });
  }
  return out;
}

/**
 * Bố cục "sắp chữ" (justified rows) — mỗi hàng lấp đầy chiều ngang, GIỮ ĐÚNG tỉ lệ ảnh
 * gốc (không crop). Chuẩn magazine: ảnh ngang rộng, ảnh dọc hẹp, cao bằng nhau trong hàng.
 */
function justifiedCells(
  aspects: number[],
  area: { x0: number; y0: number; w: number; h: number },
): Cell[] {
  const n = aspects.length;
  if (!n) return [];
  const { x0, y0, w, h } = area;
  const desiredRows = n <= 2 ? 1 : n <= 6 ? 2 : n <= 12 ? 3 : 4;
  const targetH = h / desiredRows;

  // Gom ảnh vào các hàng: đóng hàng khi cao (để lấp đủ ngang) ≤ target.
  const rows: number[][] = [];
  let cur: number[] = [];
  let sumAspect = 0;
  for (let i = 0; i < n; i++) {
    cur.push(i);
    sumAspect += aspects[i];
    const rowH = (w - GUTTER * (cur.length - 1)) / sumAspect;
    if (rowH <= targetH) {
      rows.push(cur);
      cur = [];
      sumAspect = 0;
    }
  }
  if (cur.length) rows.push(cur);

  // Cao tự nhiên mỗi hàng (khi lấp đủ ngang) rồi co giãn cho vừa chiều cao vùng.
  const rowHeights = rows.map((row) => {
    const s = row.reduce((acc, i) => acc + aspects[i], 0);
    return (w - GUTTER * (row.length - 1)) / s;
  });
  const totalH = rowHeights.reduce((a, b) => a + b, 0) + GUTTER * (rows.length - 1);
  const scale = totalH > 0 ? (h - GUTTER * (rows.length - 1)) / (totalH - GUTTER * (rows.length - 1)) : 1;

  const cells: Cell[] = [];
  let y = y0;
  rows.forEach((row, r) => {
    const rh = Math.max(1, Math.round(rowHeights[r] * scale));
    // Bề rộng tile chia theo TỈ LỆ trong hàng → luôn khít khung, không bao giờ âm
    // (kể cả khi scale>1 làm hàng cao lên). Tile cuối "nuốt" phần dư làm tròn.
    const totalW = w - GUTTER * (row.length - 1);
    const sumA = row.reduce((s, i) => s + aspects[i], 0) || 1;
    let x = x0;
    let used = 0;
    row.forEach((idx, k) => {
      const isLast = k === row.length - 1;
      const tw = isLast ? Math.max(1, totalW - used) : Math.max(1, Math.round((aspects[idx] / sumA) * totalW));
      cells.push({ x: Math.round(x), y: Math.round(y), w: tw, h: rh, i: idx });
      x += tw + GUTTER;
      used += tw;
    });
    y += rh + GUTTER;
  });
  return cells;
}

/** Bố cục editorial: hero+grid nếu ≥5 ảnh, ngược lại grid đều. Trả cell theo index ảnh. */
function layoutCells(
  imgs: HTMLImageElement[],
  area: { x0: number; y0: number; w: number; h: number },
  mode: CollageLayout = 'auto',
): Cell[] {
  const n = imgs.length;
  const { x0, y0, w, h } = area;
  if (!n) return [];
  if (mode === 'justified') return justifiedCells(imgs.map((im) => im.width / im.height || 1), area);
  if (mode === 'grid') return packGrid(n, area, 0);
  const useHero = n >= 5;
  if (!useHero) return packGrid(n, area, 0);

  const cells: Cell[] = [];
  let idx = 0;
  const heroH = Math.round(h * 0.46);
  const heroW = Math.round(w * 0.5) - GUTTER / 2;
  cells.push({ x: x0, y: y0, w: heroW, h: heroH, i: idx++ });
  const colW = Math.round((w - heroW - GUTTER * 2) / 2);
  const halfH = Math.round((heroH - GUTTER) / 2);
  const midX = x0 + heroW + GUTTER;
  if (idx < n) cells.push({ x: midX, y: y0, w: colW, h: halfH, i: idx++ });
  if (idx < n) cells.push({ x: midX, y: y0 + halfH + GUTTER, w: colW, h: halfH, i: idx++ });
  const rightX = midX + colW + GUTTER;
  if (idx < n) cells.push({ x: rightX, y: y0, w: x0 + w - rightX, h: heroH, i: idx++ });
  const rest = n - idx;
  if (rest > 0) {
    const gy = y0 + heroH + GUTTER;
    const gh = h - heroH - GUTTER;
    cells.push(...packGrid(rest, { x0, y0: gy, w, h: gh }, idx));
  }
  return cells;
}

function tag(i: number) {
  return String(i + 1).padStart(2, '0');
}

/**
 * Dựng moodboard collage → dataURL JPEG (chất lượng cao, nhẹ hơn PNG cho autosave).
 * @param images danh sách URL/dataURL ảnh reference (theo thứ tự).
 */
export async function buildMoodboardCollage(images: string[], opts: CollageOpts = {}): Promise<string> {
  if (typeof document === 'undefined') throw new Error('Collage chỉ dựng được ở client.');
  if (!images.length) throw new Error('Cần ít nhất 1 ảnh.');

  const imgs = await Promise.all(images.map(loadImage));

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas không khả dụng.');

  // nền warm
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // vùng lưới ảnh
  const area = { x0: MARGIN, y0: HEADER_H, w: W - MARGIN * 2, h: H - HEADER_H - PALETTE_H - 24 };
  const cells = layoutCells(imgs, area, opts.layout ?? 'auto');
  const tiles: Tile[] = cells.map((c) => ({ x: c.x, y: c.y, w: c.w, h: c.h, img: imgs[c.i], tag: tag(c.i) }));
  for (const t of tiles) drawTile(ctx, t);

  // palette từ màu trội mọi ảnh
  const palette = pickPalette(imgs.map(dominantColor), 6);

  // ---- title band ----
  const eyebrow = (opts.eyebrow || 'MOODBOARD').toUpperCase();
  const title = (opts.title || 'MOODBOARD').toUpperCase();
  const sub = (opts.sub || '').toUpperCase();
  const mark = (opts.mark || 'INTERIORFLOW — MOODBOARD').toUpperCase();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = MUTE;
  ctx.font = `22px ${SERIF}`;
  drawTracked(ctx, eyebrow, MARGIN, 76, 6);
  ctx.fillStyle = INK;
  ctx.font = `bold 76px ${SERIF}`;
  drawTracked(ctx, title, MARGIN, 152, 3);
  if (sub) {
    ctx.fillStyle = MUTE;
    ctx.font = `italic 30px ${SERIF}`;
    drawTracked(ctx, sub, MARGIN + 4, 190, 6);
  }

  // project mark góc phải
  ctx.fillStyle = INK;
  ctx.font = `24px ${SERIF}`;
  ctx.textAlign = 'right';
  drawTracked(ctx, mark, W - MARGIN, 76, 5, 'right');
  ctx.strokeStyle = MUTE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W - MARGIN - 300, 92);
  ctx.lineTo(W - MARGIN, 92);
  ctx.stroke();
  ctx.textAlign = 'left';

  // ---- palette strip ----
  const paX = MARGIN;
  const paY = H - PALETTE_H + 24;
  const swW = 150;
  const swGap = 18;
  ctx.fillStyle = MUTE;
  ctx.font = `18px ${SERIF}`;
  drawTracked(ctx, 'PALETTE — TRÍCH TỪ ẢNH', MARGIN, paY - 14, 4);
  palette.forEach((c, i) => {
    const x = paX + i * (swW + swGap);
    ctx.fillStyle = hex(c);
    roundRect(ctx, x, paY, swW, 54, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = MUTE;
    ctx.font = `15px ${SERIF}`;
    drawTracked(ctx, hex(c).toUpperCase(), x, paY + 74, 1.5);
  });

  return canvas.toDataURL('image/jpeg', 0.92);
}

/** Vẽ chữ có letter-spacing (canvas không hỗ trợ sẵn tin cậy trên mọi bản). */
function drawTracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  tracking: number,
  align: 'left' | 'right' = 'left',
) {
  if (!tracking) {
    ctx.fillText(text, x, y);
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
