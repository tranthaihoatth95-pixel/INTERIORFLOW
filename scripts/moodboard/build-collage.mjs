/**
 * build-collage.mjs — dựng moodboard collage chuyên nghiệp (headless, KHÔNG AI)
 * từ CHÍNH ảnh reference của user. Gu quiet-luxury editorial theo AKH-IKI showunit:
 * nền warm off-white, lưới ảnh gọn có gutter đều, title band (eyebrow + tên chủ đề),
 * và 1 dải palette 6 swatch trích màu trội từ ảnh. Caption chip nhỏ ở góc mỗi ảnh.
 *
 * Chạy:  node scripts/moodboard/build-collage.mjs [--layout=auto|grid|justified]
 *          auto      — hero+grid editorial (mặc định, ≥5 ảnh mới có hero)
 *          grid      — lưới đều, mọi ô bằng nhau
 *          justified — mỗi hàng lấp đầy ngang, GIỮ ĐÚNG tỉ lệ ảnh gốc (không crop)
 * Ra:    test-input/_results/moodboard/collage-caudesign.png
 *        test-input/_results/moodboard/collage-khonggian.png
 *        test-input/_results/moodboard/collage-vatlieu.png
 *        (justified/grid thêm hậu tố -<layout> vào tên file)
 *
 * Đồng bộ 1:1 bố cục với app: lib/moodboard-collage.ts
 * Chỉ phụ thuộc `sharp`. Không gọi mạng, không provider AI.
 */
import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---- Chọn bố cục qua CLI: --layout=auto|grid|justified (mặc định auto) ----
const LAYOUT_MODES = new Set(['auto', 'grid', 'justified']);
const layoutArg = (process.argv.find((a) => a.startsWith('--layout=')) || '').split('=')[1];
const LAYOUT = LAYOUT_MODES.has(layoutArg) ? layoutArg : 'auto';
const ROOT = path.resolve(__dirname, '..', '..');
const SRC_ROOT = path.join(ROOT, 'test-input', '1-moodboard');
const OUT_DIR = path.join(ROOT, 'test-input', '_results', 'moodboard');

// ---- Bảng gu / layout (quiet-luxury editorial) ----
const W = 2400;            // A-landscape ~16:9 rộng 2400
const H = 1350;            // 16:9
const BG = { r: 245, g: 241, b: 234 };   // #f5f1ea warm off-white
const INK = '#2b2622';     // chữ nâu-đen ấm
const MUTE = '#8c8377';    // caption/eyebrow xám ấm
const GUTTER = 26;         // khe giữa ảnh
const RADIUS = 10;         // bo góc ảnh
const MARGIN = 96;         // lề trang
const HEADER_H = 210;      // vùng title band
const PALETTE_H = 132;     // dải swatch dưới cùng

const IMG_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);

/** 3 chủ đề → tên file + tiêu đề song ngữ + eyebrow. */
const THEMES = [
  {
    dir: 'moodboard về câu chuyện thiết kế',
    out: 'collage-caudesign.png',
    eyebrow: 'MOODBOARD · ĐỊNH HƯỚNG THIẾT KẾ Ý TƯỞNG',
    title: 'CÂU CHUYỆN THIẾT KẾ',
    sub: 'DESIGN STORY',
  },
  {
    dir: 'moodboard về không gian',
    out: 'collage-khonggian.png',
    eyebrow: 'MOODBOARD · ĐỊNH HƯỚNG KHÔNG GIAN',
    title: 'KHÔNG GIAN',
    sub: 'SPACE & ATMOSPHERE',
  },
  {
    dir: 'moodboard về vật liệu',
    out: 'collage-vatlieu.png',
    eyebrow: 'MOODBOARD · BẢNG VẬT LIỆU',
    title: 'VẬT LIỆU',
    sub: 'MATERIALS & FINISHES',
  },
];

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function listImages(dir) {
  let files;
  try {
    files = await fs.readdir(dir);
  } catch {
    return [];
  }
  return files
    .filter((f) => IMG_EXT.has(path.extname(f).toLowerCase()) && !f.startsWith('.'))
    .sort()
    .map((f) => path.join(dir, f));
}

/** SVG bo góc để mask ảnh (rounded look). */
function roundedMask(w, h, r) {
  return Buffer.from(
    `<svg width="${w}" height="${h}"><rect x="0" y="0" width="${w}" height="${h}" rx="${r}" ry="${r}"/></svg>`,
  );
}

/** Resize + crop cover về đúng ô + bo góc → buffer PNG. */
async function fitTile(file, w, h) {
  w = Math.max(1, Math.round(w));
  h = Math.max(1, Math.round(h));
  const base = await sharp(file)
    .rotate() // tôn trọng EXIF
    .resize(w, h, { fit: 'cover', position: 'attention' })
    .png()
    .toBuffer();
  return sharp(base)
    .composite([{ input: roundedMask(w, h, RADIUS), blend: 'dest-in' }])
    .png()
    .toBuffer();
}

/**
 * Trích ~1 màu trội / ảnh bằng cách thu nhỏ về 1px (trung bình vùng),
 * rồi lọc trùng gần nhau để có palette đa dạng. Trả list {r,g,b}.
 */
async function dominantColor(file) {
  const { data } = await sharp(file)
    .rotate()
    .resize(48, 48, { fit: 'cover' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  // histogram 4-bit/kênh, chọn bucket đông nhất nhưng bỏ mẫu quá tối/quá sáng cực trị
  const buckets = new Map();
  for (let i = 0; i < data.length; i += 3) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum < 12 || lum > 246) continue; // bỏ đen/trắng tuyệt đối
    const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
    const e = buckets.get(key) ?? { r: 0, g: 0, b: 0, n: 0 };
    e.r += r; e.g += g; e.b += b; e.n += 1;
    buckets.set(key, e);
  }
  if (!buckets.size) return { r: 200, g: 190, b: 178 };
  let best = null;
  for (const e of buckets.values()) if (!best || e.n > best.n) best = e;
  return { r: Math.round(best.r / best.n), g: Math.round(best.g / best.n), b: Math.round(best.b / best.n) };
}

const hex = (c) =>
  '#' + [c.r, c.g, c.b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');

/** Khoảng cách màu thô để loại swatch trùng. */
function dist(a, b) {
  return Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b);
}

/** Chọn tối đa `count` màu khác biệt từ danh sách, sắp theo độ sáng. */
function pickPalette(colors, count) {
  const picked = [];
  for (const c of colors) {
    if (picked.every((p) => dist(p, c) > 44)) picked.push(c);
    if (picked.length >= count) break;
  }
  // thiếu thì bù bằng các màu còn lại (kể cả gần nhau)
  for (const c of colors) {
    if (picked.length >= count) break;
    if (!picked.includes(c)) picked.push(c);
  }
  picked.sort((a, b) => (0.299 * a.r + 0.587 * a.g + 0.114 * a.b) - (0.299 * b.r + 0.587 * b.g + 0.114 * b.b));
  return picked.slice(0, count);
}

/**
 * Bố cục "sắp chữ" (justified rows) — mỗi hàng lấp đầy chiều ngang, GIỮ ĐÚNG tỉ lệ ảnh
 * gốc (không crop). Cần `aspects` (rộng/cao mỗi ảnh, đã tính EXIF orientation).
 */
function justifiedTiles(files, aspects, area) {
  const { x0, y0, w, h } = area;
  const tiles = [];
  const n = files.length;
  if (!n) return tiles;
  const tag = (i) => `${String(i + 1).padStart(2, '0')}`;

  const desiredRows = n <= 2 ? 1 : n <= 6 ? 2 : n <= 12 ? 3 : 4;
  const targetH = h / desiredRows;

  // gom ảnh vào hàng: đóng hàng khi cao (để lấp đủ ngang) ≤ target
  const rows = [];
  let cur = [];
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

  // cao tự nhiên mỗi hàng → co giãn cho vừa chiều cao vùng
  const rowHeights = rows.map((row) => {
    const s = row.reduce((acc, i) => acc + aspects[i], 0);
    return (w - GUTTER * (row.length - 1)) / s;
  });
  const innerSum = rowHeights.reduce((a, b) => a + b, 0);
  const availInner = h - GUTTER * (rows.length - 1);
  const scale = innerSum > 0 ? availInner / innerSum : 1;

  let y = y0;
  rows.forEach((row, r) => {
    const rh = Math.max(1, Math.round(rowHeights[r] * scale));
    // Bề rộng chia theo tỉ lệ trong hàng → luôn khít, không âm (kể cả scale>1).
    const totalW = w - GUTTER * (row.length - 1);
    const sumA = row.reduce((s, i) => s + aspects[i], 0) || 1;
    let x = x0;
    let used = 0;
    row.forEach((idx, k) => {
      const isLast = k === row.length - 1;
      const tw = isLast ? Math.max(1, totalW - used) : Math.max(1, Math.round((aspects[idx] / sumA) * totalW));
      tiles.push({ x: Math.round(x), y: Math.round(y), w: tw, h: rh, file: files[idx], tag: tag(idx) });
      x += tw + GUTTER;
      used += tw;
    });
    y += rh + GUTTER;
  });
  return tiles;
}

/**
 * Bố cục lưới editorial: hàng đầu 1 ảnh "hero" rộng + 2 ảnh dọc; các hàng sau lưới đều.
 * Trả list ô {x,y,w,h,file,tag}. `mode`: auto (hero+grid) · grid (lưới đều) · justified.
 */
function layout(files, area, mode = 'auto', aspects = []) {
  const { x0, y0, w, h } = area;
  const tiles = [];
  const n = files.length;
  if (!n) return tiles;

  if (mode === 'justified') return justifiedTiles(files, aspects, area);
  if (mode === 'grid') {
    packGrid(files, area, tiles, 0);
    return tiles;
  }

  // auto: chia 2 dải hero (trên) + grid (dưới). Nếu ít ảnh thì chỉ grid.
  const useHero = n >= 5;
  let idx = 0;
  const tag = (i) => `${String(i + 1).padStart(2, '0')}`;

  if (useHero) {
    const heroH = Math.round(h * 0.46);
    const heroW = Math.round(w * 0.5) - GUTTER / 2;
    // hero lớn bên trái
    tiles.push({ x: x0, y: y0, w: heroW, h: heroH, file: files[idx], tag: tag(idx) }); idx++;
    // 2 ô xếp dọc giữa
    const colW = Math.round((w - heroW - GUTTER * 2) / 2);
    const halfH = Math.round((heroH - GUTTER) / 2);
    const midX = x0 + heroW + GUTTER;
    tiles.push({ x: midX, y: y0, w: colW, h: halfH, file: files[idx], tag: tag(idx) }); idx++;
    if (files[idx]) { tiles.push({ x: midX, y: y0 + halfH + GUTTER, w: colW, h: halfH, file: files[idx], tag: tag(idx) }); idx++; }
    // cột phải cao full hero
    const rightX = midX + colW + GUTTER;
    if (files[idx]) { tiles.push({ x: rightX, y: y0, w: x0 + w - rightX, h: heroH, file: files[idx], tag: tag(idx) }); idx++; }

    // dải grid dưới cho phần còn lại
    const rest = files.slice(idx);
    if (rest.length) {
      const gy = y0 + heroH + GUTTER;
      const gh = h - heroH - GUTTER;
      packGrid(rest, { x0, y0: gy, w, h: gh }, tiles, idx);
    }
  } else {
    packGrid(files, area, tiles, 0);
  }
  return tiles;
}

/** Lưới đều cols×rows cân theo số ảnh. */
function packGrid(files, area, out, startIdx) {
  const { x0, y0, w, h } = area;
  const n = files.length;
  const cols = n <= 3 ? n : n <= 6 ? 3 : n <= 8 ? 4 : Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  const cw = (w - GUTTER * (cols - 1)) / cols;
  const ch = (h - GUTTER * (rows - 1)) / rows;
  files.forEach((file, i) => {
    const c = i % cols;
    const r = Math.floor(i / cols);
    out.push({
      x: Math.round(x0 + c * (cw + GUTTER)),
      y: Math.round(y0 + r * (ch + GUTTER)),
      w: Math.round(cw),
      h: Math.round(ch),
      file,
      tag: String(startIdx + i + 1).padStart(2, '0'),
    });
  });
}

/** SVG overlay: title band, project mark, caption chip, palette label. */
function overlaySvg(theme, palette, tiles) {
  const chipParts = tiles
    .map((t) => {
      const cx = t.x + 18;
      const cy = t.y + t.h - 18;
      return `
        <g>
          <rect x="${cx}" y="${cy - 26}" width="46" height="30" rx="6"
                fill="#ffffff" fill-opacity="0.82"/>
          <text x="${cx + 23}" y="${cy - 6}" text-anchor="middle"
                font-family="Georgia, 'Times New Roman', serif" font-size="15"
                letter-spacing="1" fill="${INK}">${t.tag}</text>
        </g>`;
    })
    .join('');

  // dải palette
  const paX = MARGIN;
  const paY = H - PALETTE_H + 24;
  const swW = 150;
  const swGap = 18;
  const swatches = palette
    .map((c, i) => {
      const x = paX + i * (swW + swGap);
      return `
        <g>
          <rect x="${x}" y="${paY}" width="${swW}" height="54" rx="6" fill="${hex(c)}"
                stroke="#00000010" stroke-width="1"/>
          <text x="${x}" y="${paY + 74}" font-family="Georgia, serif" font-size="15"
                letter-spacing="1.5" fill="${MUTE}">${esc(hex(c).toUpperCase())}</text>
        </g>`;
    })
    .join('');

  return Buffer.from(`
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <!-- title band -->
      <text x="${MARGIN}" y="${76}" font-family="Georgia, 'Times New Roman', serif"
            font-size="22" letter-spacing="6" fill="${MUTE}">${esc(theme.eyebrow)}</text>
      <text x="${MARGIN}" y="${152}" font-family="Georgia, 'Times New Roman', serif"
            font-weight="bold" font-size="76" letter-spacing="3" fill="${INK}">${esc(theme.title)}</text>
      <text x="${MARGIN + 4}" y="${190}" font-family="Georgia, serif"
            font-style="italic" font-size="30" letter-spacing="6" fill="${MUTE}">${esc(theme.sub)}</text>

      <!-- project mark góc phải -->
      <text x="${W - MARGIN}" y="${76}" text-anchor="end"
            font-family="Georgia, serif" font-size="24" letter-spacing="5" fill="${INK}">
        INTERIORFLOW — MOODBOARD</text>
      <line x1="${W - MARGIN - 260}" y1="${92}" x2="${W - MARGIN}" y2="${92}"
            stroke="${MUTE}" stroke-width="1"/>

      <!-- caption chips -->
      ${chipParts}

      <!-- palette -->
      <text x="${MARGIN}" y="${paY - 14}" font-family="Georgia, serif" font-size="18"
            letter-spacing="4" fill="${MUTE}">PALETTE — TRÍCH TỪ ẢNH</text>
      ${swatches}
    </svg>
  `);
}

async function buildTheme(theme) {
  const dir = path.join(SRC_ROOT, theme.dir);
  const files = await listImages(dir);
  if (!files.length) {
    console.warn(`⚠ Bỏ qua "${theme.title}" — không có ảnh trong ${dir}`);
    return null;
  }

  // vùng lưới ảnh (dưới header, trên palette)
  const area = {
    x0: MARGIN,
    y0: HEADER_H,
    w: W - MARGIN * 2,
    h: H - HEADER_H - PALETTE_H - 24,
  };
  // tỉ lệ rộng/cao mỗi ảnh (đã tính EXIF orientation) — cho bố cục justified
  const aspects = [];
  for (const f of files) {
    const m = await sharp(f).metadata();
    const swap = (m.orientation || 1) >= 5;
    const mw = swap ? m.height : m.width;
    const mh = swap ? m.width : m.height;
    aspects.push(mw && mh ? mw / mh : 1);
  }
  const tiles = layout(files, area, LAYOUT, aspects);

  // dựng từng tile
  const composites = [];
  for (const t of tiles) {
    const buf = await fitTile(t.file, t.w, t.h);
    composites.push({ input: buf, left: t.x, top: t.y });
  }

  // palette từ màu trội mọi ảnh
  const colors = [];
  for (const f of files) colors.push(await dominantColor(f));
  const palette = pickPalette(colors, 6);

  // nền warm + shadow nhẹ dưới mỗi tile (giả khối) → composite ảnh → overlay
  const shadow = tiles.map((t) => ({
    input: Buffer.from(
      `<svg width="${t.w + 24}" height="${t.h + 24}"><rect x="12" y="14" width="${t.w}" height="${t.h}" rx="${RADIUS}" fill="#00000018"/></svg>`,
    ),
    left: t.x - 12,
    top: t.y - 10,
  }));

  const png = await sharp({
    create: { width: W, height: H, channels: 3, background: BG },
  })
    .composite([...shadow, ...composites, { input: overlaySvg(theme, palette, tiles), left: 0, top: 0 }])
    .png()
    .toBuffer();

  // justified/grid: thêm hậu tố layout để không đè bản auto
  const outName = LAYOUT === 'auto' ? theme.out : theme.out.replace(/\.png$/, `-${LAYOUT}.png`);
  const outPath = path.join(OUT_DIR, outName);
  await fs.writeFile(outPath, png);
  const meta = await sharp(png).metadata();
  console.log(`✓ ${outName}  ${meta.width}×${meta.height}  ${(png.length / 1024).toFixed(0)}KB  (${files.length} ảnh, ${palette.length} swatch)`);
  return outPath;
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  console.log(`Dựng moodboard collage (headless, dùng ảnh của user) · bố cục: ${LAYOUT}…\n`);
  for (const theme of THEMES) {
    try {
      await buildTheme(theme);
    } catch (err) {
      console.error(`✗ Lỗi khi dựng "${theme.title}":`, err.message);
    }
  }
  console.log(`\nXong. Output ở: ${path.relative(ROOT, OUT_DIR)}/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
