'use client';

/** Load ảnh (fal URL / dataURL) vào HTMLImageElement, xin CORS để canvas không bị taint. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith('data:')) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Không tải được ảnh (URL hết hạn hoặc chặn CORS).'));
    img.src = src;
  });
}

/** Trích 6 màu chủ đạo — quantize 4bit/kênh rồi lấy bucket lớn nhất, tách màu gần trùng. */
export async function extractPalette(src: string): Promise<string[]> {
  const img = await loadImage(src);
  const size = 96;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, size, size);
  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, size, size).data;
  } catch {
    throw new Error('Ảnh bị chặn CORS — không đọc được pixel. Dùng ảnh upload hoặc output AI.');
  }
  const buckets = new Map<number, { count: number; r: number; g: number; b: number }>();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const bucket = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
    bucket.count++;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    buckets.set(key, bucket);
  }
  const sorted = [...buckets.values()].sort((a, b) => b.count - a.count);
  const picked: { r: number; g: number; b: number }[] = [];
  for (const bkt of sorted) {
    const c = { r: bkt.r / bkt.count, g: bkt.g / bkt.count, b: bkt.b / bkt.count };
    const tooClose = picked.some(
      (p) => Math.abs(p.r - c.r) + Math.abs(p.g - c.g) + Math.abs(p.b - c.b) < 60,
    );
    if (!tooClose) picked.push(c);
    if (picked.length === 6) break;
  }
  const hex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  return picked.map((c) => `#${hex(c.r)}${hex(c.g)}${hex(c.b)}`);
}

export interface BoardOptions {
  images: string[];
  projectName: string;
  studioName: string;
}

/** Ghép output thành presentation board 2480×1754 (A4 landscape 300dpi-ish), nền tối. */
export async function composeBoard({ images, projectName, studioName }: BoardOptions): Promise<string> {
  const W = 2480;
  const H = 1754;
  const PAD = 90;
  const HEADER = 200;
  const FOOTER = 90;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#111114';
  ctx.fillRect(0, 0, W, H);

  // header
  ctx.fillStyle = '#f4f4f5';
  ctx.font = '600 64px system-ui, sans-serif';
  ctx.fillText(projectName || 'Untitled project', PAD, 128);
  ctx.fillStyle = '#8b7cf7';
  ctx.font = '500 34px system-ui, sans-serif';
  ctx.fillText((studioName || 'InteriorFlow Studio').toUpperCase(), PAD, 182);
  ctx.strokeStyle = '#2a2a31';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD, HEADER + 10);
  ctx.lineTo(W - PAD, HEADER + 10);
  ctx.stroke();

  // layout ảnh theo số lượng
  const area = { x: PAD, y: HEADER + 50, w: W - PAD * 2, h: H - HEADER - 50 - FOOTER };
  const gap = 40;
  const cells: { x: number; y: number; w: number; h: number }[] = [];
  const n = Math.min(images.length, 4);
  if (n === 1) cells.push(area);
  else if (n === 2) {
    const w = (area.w - gap) / 2;
    cells.push({ ...area, w }, { ...area, x: area.x + w + gap, w });
  } else if (n === 3) {
    const w = (area.w - gap) / 2;
    const h = (area.h - gap) / 2;
    cells.push(
      { x: area.x, y: area.y, w, h: area.h },
      { x: area.x + w + gap, y: area.y, w, h },
      { x: area.x + w + gap, y: area.y + h + gap, w, h },
    );
  } else {
    const w = (area.w - gap) / 2;
    const h = (area.h - gap) / 2;
    cells.push(
      { x: area.x, y: area.y, w, h },
      { x: area.x + w + gap, y: area.y, w, h },
      { x: area.x, y: area.y + h + gap, w, h },
      { x: area.x + w + gap, y: area.y + h + gap, w, h },
    );
  }

  for (let i = 0; i < n; i++) {
    const img = await loadImage(images[i]);
    const cell = cells[i];
    // cover-fit
    const scale = Math.max(cell.w / img.naturalWidth, cell.h / img.naturalHeight);
    const sw = cell.w / scale;
    const sh = cell.h / scale;
    const sx = (img.naturalWidth - sw) / 2;
    const sy = (img.naturalHeight - sh) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(cell.x, cell.y, cell.w, cell.h, 18);
    ctx.clip();
    ctx.drawImage(img, sx, sy, sw, sh, cell.x, cell.y, cell.w, cell.h);
    ctx.restore();
  }

  // footer
  ctx.fillStyle = '#71717a';
  ctx.font = '400 26px system-ui, sans-serif';
  const date = new Date().toLocaleDateString('vi-VN');
  ctx.fillText(date, PAD, H - 44);
  const credit = 'Made with InteriorFlow';
  const tw = ctx.measureText(credit).width;
  ctx.fillText(credit, W - PAD - tw, H - 44);

  return canvas.toDataURL('image/jpeg', 0.92);
}

export interface AdjustOptions {
  brightness: number; // 0.5–1.5
  contrast: number;   // 0.5–1.5
  saturate: number;   // 0–2
  temperature: number; // -1 (lạnh) … 1 (ấm)
}

/** Chỉnh ảnh thủ công bằng canvas filter — local, tức thì, không tốn credit. */
export async function adjustImage(src: string, opt: AdjustOptions): Promise<string> {
  const img = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  if (typeof ctx.filter !== 'string') throw new Error('Trình duyệt không hỗ trợ canvas filter.');
  ctx.filter = `brightness(${opt.brightness}) contrast(${opt.contrast}) saturate(${opt.saturate})`;
  ctx.drawImage(img, 0, 0);
  ctx.filter = 'none';
  if (opt.temperature !== 0) {
    ctx.globalCompositeOperation = 'soft-light';
    ctx.globalAlpha = Math.min(0.55, Math.abs(opt.temperature) * 0.55);
    ctx.fillStyle = opt.temperature > 0 ? '#ff9a3c' : '#3c7dff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }
  try {
    return canvas.toDataURL('image/jpeg', 0.92);
  } catch {
    throw new Error('Ảnh bị chặn CORS — không export được. Dùng ảnh upload hoặc output AI.');
  }
}
