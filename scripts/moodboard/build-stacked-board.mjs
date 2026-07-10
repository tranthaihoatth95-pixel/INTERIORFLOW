/**
 * build-stacked-board.mjs — BẢNG VẬT LIỆU khổ DỌC, bố cục XẾP CHỒNG (overlap) art-directed
 * theo gu ref "Warm · Natural · Luxury" (Decolegno): vài slab vật liệu lớn đè lên nhau,
 * bóng đổ mềm tạo khối vật lý, nhãn tên vật liệu serif ở góc. KHÔNG AI, chỉ `sharp`.
 *
 * Khác bản grid/justified: đây là bố cục ĐẶT TAY (không thuật toán) — mỗi slab có toạ độ,
 * z-order (vẽ sau = nằm trên), và góc đặt nhãn cố định. Dễ tinh chỉnh từng ô.
 *
 * Chạy:  node scripts/moodboard/build-stacked-board.mjs
 * Ra:    test-input/_results/moodboard/stacked-board.png  (khổ dọc A4)
 */
import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const MAT = path.join(ROOT, 'test-input', '1-moodboard', 'moodboard về vật liệu');
const OUT_DIR = path.join(ROOT, 'test-input', '_results', 'moodboard');

// ---- Khổ dọc A4 + gu warm-natural-luxury ----
const W = 1400;
const H = 1980;                       // A4 dọc (1:1.414)
const BG = { r: 239, g: 233, b: 223 };// #efe9df warm greige
const INK = '#2b2622';
const MUTE = '#8c8377';
const CREAM = '#efe9df';
const RADIUS = 8;
const SERIF = "Georgia, 'Times New Roman', serif";

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Các slab vật liệu — z-order theo thứ tự mảng (sau = trên).
 * corner: nơi đặt nhãn (tl|tr|bl|br). file: ảnh nguồn trong thư mục vật liệu.
 * GỖ SÁNG ĐÃ ĐỔI THÀNH GỖ ĐẬM (#6 wabi-sabi) làm slab chủ đạo.
 */
const SLABS = [
  // slab chủ đạo — GỖ ĐẬM (thay gỗ sáng), tall bên trái · crop dải trên (tránh chữ WABI SABI)
  { x: 120, y: 270, w: 540, h: 900, file: 'b3f321b39beeac2dd6bdf92e60c178b8.jpg',
    crop: { l: 0.02, t: 0.02, w: 0.96, h: 0.34 },
    name: 'Sồi hun khói', en: 'Smoked Oak', corner: 'bl' },
  // rattan ấm — center-right, xuống đáy (đè dưới đá)
  { x: 640, y: 700, w: 600, h: 1010, file: 'e1e5164cfe8986dbafdec9f5038e4e61.jpg',
    name: 'Mây đan', en: 'Woven Rattan', corner: 'br' },
  // đá thạch anh — top-right vuông, đè lên gỗ + rattan · crop nửa phải (tránh chữ)
  { x: 560, y: 220, w: 660, h: 600, file: 'tải xuống.png',
    crop: { l: 0.05, t: 0.355, w: 0.9, h: 0.125 },
    name: 'Đá thạch anh', en: 'Patagonia Quartzite', corner: 'tr' },
  // travertine sáng — bottom-left, tương phản sáng, đè lên gỗ · crop tránh bàn tay
  { x: 175, y: 1085, w: 480, h: 595, file: '6ab5347ca08242807f79c6fe06946ad7.jpg',
    crop: { l: 0.0, t: 0.52, w: 0.46, h: 0.46 },
    name: 'Travertine', en: 'Silver Travertine', corner: 'bl' },
  // THÊM THẮT #1 — mosaic thuỷ tinh xanh, accent nhỏ đè seam gỗ/đá
  { x: 455, y: 480, w: 235, h: 300, file: 'b11f89f72c737c1f7ad169630442e1db.jpg',
    name: 'Mosaic xanh', en: 'Glass Mosaic', corner: 'tl' },
  // THÊM THẮT #2 — vữa vôi, accent nhỏ bắc cầu travertine/rattan ở đáy
  { x: 560, y: 1450, w: 270, h: 270, file: '5bc9df73b3ec2d826d8fa58910ae974b.jpg',
    crop: { l: 0.05, t: 0.25, w: 0.9, h: 0.4 },
    name: 'Vữa vôi', en: 'Limewash Plaster', corner: 'bl' },
];

/** SVG bo góc để mask ảnh. */
const roundedMask = (w, h, r) =>
  Buffer.from(`<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${r}" ry="${r}"/></svg>`);

/** Nguồn ảnh đã xoay EXIF + (tuỳ chọn) cắt vùng sạch theo tỉ lệ {l,t,w,h}. */
async function sourceBuf(file, crop) {
  const oriented = await sharp(path.join(MAT, file)).rotate().toBuffer();
  if (!crop) return oriented;
  const m = await sharp(oriented).metadata();
  const left = Math.max(0, Math.round(crop.l * m.width));
  const top = Math.max(0, Math.round(crop.t * m.height));
  const width = Math.max(1, Math.min(m.width - left, Math.round(crop.w * m.width)));
  const height = Math.max(1, Math.min(m.height - top, Math.round(crop.h * m.height)));
  return sharp(oriented).extract({ left, top, width, height }).toBuffer();
}

/** Ảnh cover-fit về ô + bo góc → buffer PNG. */
async function fitTile(file, w, h, crop) {
  w = Math.max(1, Math.round(w));
  h = Math.max(1, Math.round(h));
  const base = await sharp(await sourceBuf(file, crop))
    .resize(w, h, { fit: 'cover', position: 'attention' })
    .toBuffer();
  return sharp(base).composite([{ input: roundedMask(w, h, RADIUS), blend: 'dest-in' }]).png().toBuffer();
}

/** Bóng đổ mềm (blur) cho 1 slab → buffer + vị trí đặt. */
async function softShadow(s) {
  const pad = 60;
  const sw = s.w + pad * 2;
  const sh = s.h + pad * 2;
  const rect = Buffer.from(
    `<svg width="${sw}" height="${sh}"><rect x="${pad}" y="${pad}" width="${s.w}" height="${s.h}" rx="${RADIUS}" fill="black" fill-opacity="0.22"/></svg>`,
  );
  const buf = await sharp(rect).blur(22).png().toBuffer();
  return { input: buf, left: Math.round(s.x - pad), top: Math.round(s.y - pad + 20) };
}

/** Độ sáng trung bình vùng slab (chọn màu chữ nhãn cho tương phản). */
async function meanLum(file, crop) {
  const { data } = await sharp(await sourceBuf(file, crop)).resize(12, 12).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let s = 0, n = 0;
  for (let i = 0; i < data.length; i += 3) { s += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]; n++; }
  return s / n;
}

/** Nhãn tên vật liệu đặt trong slab, ở góc chỉ định, màu theo độ sáng slab. */
function labelSvg(s, dark) {
  const col = dark ? '#f3ede2' : '#2b2622';
  const sub = dark ? 'rgba(243,237,226,0.7)' : 'rgba(43,38,34,0.6)';
  const pad = 22;
  let x, y, anchor;
  if (s.corner === 'tl') { x = s.x + pad; y = s.y + pad + 22; anchor = 'start'; }
  else if (s.corner === 'tr') { x = s.x + s.w - pad; y = s.y + pad + 22; anchor = 'end'; }
  else if (s.corner === 'bl') { x = s.x + pad; y = s.y + s.h - pad; anchor = 'start'; }
  else { x = s.x + s.w - pad; y = s.y + s.h - pad; anchor = 'end'; }
  return `
    <text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${SERIF}" font-size="27"
          letter-spacing="0.5" fill="${col}">${esc(s.en)}</text>
    <text x="${x}" y="${y + 26}" text-anchor="${anchor}" font-family="${SERIF}" font-style="italic"
          font-size="19" letter-spacing="0.5" fill="${sub}">${esc(s.name)}</text>`;
}

function headerSvg() {
  return `
    <text x="${W / 2}" y="130" text-anchor="middle" font-family="${SERIF}" font-size="20"
          letter-spacing="8" fill="${MUTE}">BẢNG VẬT LIỆU · MATERIAL BOARD</text>
    <text x="${W / 2}" y="196" text-anchor="middle" font-family="${SERIF}" font-size="46"
          letter-spacing="10" fill="${INK}">WARM · NATURAL · LUXURY</text>
    <line x1="${W / 2 - 90}" y1="222" x2="${W / 2 + 90}" y2="222" stroke="${MUTE}" stroke-width="1"/>
    <text x="${W / 2}" y="${H - 70}" text-anchor="middle" font-family="${SERIF}" font-size="20"
          letter-spacing="6" fill="${MUTE}">INTERIORFLOW — MOODBOARD</text>`;
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  console.log('Dựng bảng vật liệu khổ dọc — bố cục xếp chồng…\n');

  const shadows = [];
  const tiles = [];
  let labels = '';
  for (const s of SLABS) {
    shadows.push(await softShadow(s));
    tiles.push({ input: await fitTile(s.file, s.w, s.h, s.crop), left: Math.round(s.x), top: Math.round(s.y) });
    const dark = (await meanLum(s.file, s.crop)) < 140;
    labels += labelSvg(s, dark);
  }
  const overlay = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${headerSvg()}${labels}</svg>`);

  const png = await sharp({ create: { width: W, height: H, channels: 3, background: BG } })
    .composite([...shadows, ...tiles, { input: overlay, left: 0, top: 0 }])
    .png()
    .toBuffer();

  const outPath = path.join(OUT_DIR, 'stacked-board.png');
  await fs.writeFile(outPath, png);
  const meta = await sharp(png).metadata();
  console.log(`✓ stacked-board.png  ${meta.width}×${meta.height}  ${(png.length / 1024).toFixed(0)}KB  (${SLABS.length} vật liệu)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
