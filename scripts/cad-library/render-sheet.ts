/**
 * scripts/cad-library/render-sheet.ts — RENDER nhiều block ra MỘT ảnh PNG lưới CÓ NHÃN.
 *
 * Vì sao cần: `tsc` xanh · `npm test` xanh · DXF parse 100% mà hình vẫn có thể ra "mặt cười".
 * Chỉ MẮT NGƯỜI bắt được. Script này là cửa nghiệm thu bắt buộc sau mỗi đợt vẽ block.
 *
 * Dựng thẳng từ `LIB_BLOCKS` (cùng nguồn hình học mà generator dùng) → một SVG lưới → PNG bằng
 * `sharp` (đã có sẵn trong dependencies, không thêm dep mới).
 *
 * Nhãn cố ý dùng **id ASCII + số đo ĐO LẠI TỪ HÌNH** (không phải số khai tay) — vừa tránh phụ
 * thuộc font có dấu tiếng Việt của librsvg, vừa lộ ngay block nào lệch số đo.
 *
 * Chạy:
 *   npx tsx scripts/cad-library/render-sheet.ts --category van-phong --out docs/screenshots/x.png
 *   npx tsx scripts/cad-library/render-sheet.ts --ids a,b,c --out ... --title "..." --cols 4
 */

import { mkdirSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { LIB_BLOCKS, type LibBlockDef } from './blocks-data';
import type { Prim } from '../../lib/cad/furniture';
import type { Pt } from '../../lib/cad/model';

/* ───────────────────────── tham số dòng lệnh ───────────────────────── */

function argOf(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

/* ───────────────────────── hình học ───────────────────────── */

const ARC_STEPS = 48; // mượt hơn generator (16) vì đây là ảnh để SOI, không phải file giao đi

function sampleArc(c: Pt, r: number, a1: number, a2: number, n = ARC_STEPS): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a1 + ((a2 - a1) * i) / n;
    pts.push({ x: c.x + r * Math.cos(a), y: c.y + r * Math.sin(a) });
  }
  return pts;
}

function bboxOf(prims: Prim[]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const grow = (p: Pt) => {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
  };
  for (const p of prims) {
    if (p.k === 'line') { grow(p.a); grow(p.b); }
    else if (p.k === 'poly') p.pts.forEach(grow);
    else if (p.k === 'circle') { grow({ x: p.c.x - p.r, y: p.c.y - p.r }); grow({ x: p.c.x + p.r, y: p.c.y + p.r }); }
    else if (p.k === 'arc') sampleArc(p.c, p.r, p.a1, p.a2).forEach(grow);
  }
  return Number.isFinite(minX) ? { minX, minY, maxX, maxY } : { minX: -1, minY: -1, maxX: 1, maxY: 1 };
}

/* ───────────────────────── vẽ một ô ───────────────────────── */

const CELL_W = 460;
const CELL_H = 480;
const PAD = 34;        // lề trong ô
const LABEL_H = 62;    // dải nhãn dưới ô

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const f2 = (n: number) => (Math.round(n * 100) / 100).toString();

/**
 * Chuyển hình sang toạ độ pixel NGAY TRONG JS (không lồng `transform` SVG) — để `stroke-width`
 * là **một cấp nét đều tuyệt đối** cho mọi block bất kể tỉ lệ thu phóng (§1 nguồn tham chiếu).
 */
function cellSvg(b: LibBlockDef, ox: number, oy: number): string {
  const bb = bboxOf(b.prims);
  const gw = Math.max(1, bb.maxX - bb.minX);
  const gh = Math.max(1, bb.maxY - bb.minY);
  const drawW = CELL_W - PAD * 2;
  const drawH = CELL_H - LABEL_H - PAD * 2;
  const s = Math.min(drawW / gw, drawH / gh);
  const cx = ox + CELL_W / 2;
  const cy = oy + PAD + (CELL_H - LABEL_H - PAD * 2) / 2;
  const midX = (bb.minX + bb.maxX) / 2;
  const midY = (bb.minY + bb.maxY) / 2;
  const X = (x: number) => cx + (x - midX) * s;
  const Y = (y: number) => cy - (y - midY) * s; // lật trục Y (world Y lên → SVG Y xuống)

  const out: string[] = [];
  const poly = (pts: Pt[], closed?: boolean) =>
    `<path d="${pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${f2(X(p.x))} ${f2(Y(p.y))}`).join(' ')}${closed ? ' Z' : ''}" />`;

  for (const p of b.prims) {
    if (p.k === 'line') out.push(`<line x1="${f2(X(p.a.x))}" y1="${f2(Y(p.a.y))}" x2="${f2(X(p.b.x))}" y2="${f2(Y(p.b.y))}" />`);
    else if (p.k === 'poly') out.push(poly(p.pts, p.closed));
    else if (p.k === 'circle') out.push(`<circle cx="${f2(X(p.c.x))}" cy="${f2(Y(p.c.y))}" r="${f2(p.r * s)}" />`);
    else if (p.k === 'arc') out.push(poly(sampleArc(p.c, p.r, p.a1, p.a2), false));
  }

  const labelY = oy + CELL_H - LABEL_H + 26;
  return `  <g>
    <rect x="${ox + 6}" y="${oy + 6}" width="${CELL_W - 12}" height="${CELL_H - 12}" fill="#ffffff" stroke="#ded8cc" stroke-width="1" rx="10" />
    <g fill="none" stroke="#26241f" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round">
      ${out.join('\n      ')}
    </g>
    <text x="${ox + CELL_W / 2}" y="${labelY}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="17" fill="#26241f">${esc(b.id)}</text>
    <text x="${ox + CELL_W / 2}" y="${labelY + 24}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="15" fill="#7a7364">${b.w} x ${b.h} mm · ${b.prims.length} net</text>
  </g>`;
}

/* ───────────────────────── ghép tờ ───────────────────────── */

function main() {
  const idsArg = argOf('ids');
  const category = argOf('category');
  const outArg = argOf('out') ?? 'docs/screenshots/sheet.png';
  const title = argOf('title') ?? (category ?? 'block');
  const cols = Number(argOf('cols') ?? 4);

  let blocks: LibBlockDef[];
  if (idsArg) {
    const ids = idsArg.split(',').map((s) => s.trim()).filter(Boolean);
    blocks = ids.map((id) => {
      const b = LIB_BLOCKS.find((x) => x.id === id);
      if (!b) throw new Error(`Không có block id "${id}" trong LIB_BLOCKS`);
      return b;
    });
  } else if (category) {
    blocks = LIB_BLOCKS.filter((b) => b.category === category);
  } else {
    throw new Error('Cần --ids hoặc --category');
  }
  if (blocks.length === 0) throw new Error('Không có block nào để render');

  const rows = Math.ceil(blocks.length / cols);
  const HEAD = 76;
  const W = cols * CELL_W;
  const H = HEAD + rows * CELL_H;

  const cells = blocks.map((b, i) => cellSvg(b, (i % cols) * CELL_W, HEAD + Math.floor(i / cols) * CELL_H));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#f7f4ee" />
  <text x="28" y="48" font-family="Helvetica, Arial, sans-serif" font-size="30" fill="#26241f">${esc(title)}</text>
  <text x="${W - 28}" y="48" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="18" fill="#7a7364">${blocks.length} block · don vi mm · mot cap net</text>
${cells.join('\n')}
</svg>
`;

  const outPath = path.resolve(process.cwd(), outArg);
  mkdirSync(path.dirname(outPath), { recursive: true });
  sharp(Buffer.from(svg), { density: 96 })
    .png()
    .toFile(outPath)
    .then(() => console.log(`Đã render ${blocks.length} block → ${outPath} (${W}×${H}px)`))
    .catch((e) => { console.error('LỖI render:', e); process.exitCode = 1; });
}

main();
