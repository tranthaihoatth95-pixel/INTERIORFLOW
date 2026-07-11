/**
 * scripts/cad-library/generate-library.ts — SINH THƯ VIỆN BLOCK CAD ra public/cad-library/.
 *
 * Đọc `blocks-data.ts` (hình học Prim tự dựng), với mỗi block sinh:
 *   - 1 file .dxf (ASCII, đơn vị mm) — parse lại được bằng lib/cad/dxf.ts (đã tự viết, không
 *     phụ thuộc thư viện ngoài) vì chỉ dùng LINE / LWPOLYLINE / CIRCLE / ARC trong ENTITIES.
 *   - 1 file .svg thumbnail (nền be nhạt tông quiet-luxury, nét sậm) để hiển thị lưới trong
 *     panel/demo mà không cần parse DXF phía client.
 * Rồi gom lại `public/cad-library/manifest.json` liệt kê toàn bộ block + metadata.
 *
 * Chạy: npx tsx scripts/cad-library/generate-library.ts
 */

import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import path from 'node:path';
import { LIB_BLOCKS, CATEGORY_LABEL, type LibBlockDef } from './blocks-data';
import type { Prim } from '../../lib/cad/furniture';
import type { Pt } from '../../lib/cad/model';

const OUT_DIR = path.resolve(__dirname, '../../public/cad-library');

/* ───────────────────────── DXF ───────────────────────── */

function dxfPair(code: number, value: string | number): string {
  return `${code}\n${value}`;
}

function dxfFromPrims(prims: Prim[], layerName: string): string {
  const out: string[] = [];
  out.push(dxfPair(0, 'SECTION'), dxfPair(2, 'HEADER'), dxfPair(9, '$INSUNITS'), dxfPair(70, 4), dxfPair(0, 'ENDSEC'));
  out.push(dxfPair(0, 'SECTION'), dxfPair(2, 'ENTITIES'));

  const round = (n: number) => Math.round(n * 100) / 100;

  for (const p of prims) {
    if (p.k === 'line') {
      out.push(
        dxfPair(0, 'LINE'), dxfPair(8, layerName),
        dxfPair(10, round(p.a.x)), dxfPair(20, round(p.a.y)), dxfPair(30, 0),
        dxfPair(11, round(p.b.x)), dxfPair(21, round(p.b.y)), dxfPair(31, 0),
      );
    } else if (p.k === 'poly') {
      out.push(dxfPair(0, 'LWPOLYLINE'), dxfPair(8, layerName), dxfPair(90, p.pts.length), dxfPair(70, p.closed ? 1 : 0));
      p.pts.forEach((pt: Pt) => out.push(dxfPair(10, round(pt.x)), dxfPair(20, round(pt.y))));
    } else if (p.k === 'circle') {
      out.push(dxfPair(0, 'CIRCLE'), dxfPair(8, layerName), dxfPair(10, round(p.c.x)), dxfPair(20, round(p.c.y)), dxfPair(30, 0), dxfPair(40, round(p.r)));
    } else if (p.k === 'arc') {
      out.push(
        dxfPair(0, 'ARC'), dxfPair(8, layerName),
        dxfPair(10, round(p.c.x)), dxfPair(20, round(p.c.y)), dxfPair(30, 0), dxfPair(40, round(p.r)),
        dxfPair(50, round((p.a1 * 180) / Math.PI)), dxfPair(51, round((p.a2 * 180) / Math.PI)),
      );
    }
  }

  out.push(dxfPair(0, 'ENDSEC'), dxfPair(0, 'EOF'));
  return out.join('\n');
}

/* ───────────────────────── SVG thumbnail ───────────────────────── */

function sampleArc(c: Pt, r: number, a1: number, a2: number, n = 16): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a1 + ((a2 - a1) * i) / n;
    pts.push({ x: c.x + r * Math.cos(a), y: c.y + r * Math.sin(a) });
  }
  return pts;
}

function svgFromPrims(prims: Prim[], w: number, h: number): string {
  const pad = Math.max(w, h) * 0.1 + 60;
  const W = w + pad * 2;
  const H = h + pad * 2;
  const sw = Math.max(12, Math.max(w, h) / 160);
  const fmt = (n: number) => (Math.round(n * 100) / 100).toString();

  const parts: string[] = [];
  for (const p of prims) {
    if (p.k === 'line') {
      parts.push(`<line x1="${fmt(p.a.x)}" y1="${fmt(p.a.y)}" x2="${fmt(p.b.x)}" y2="${fmt(p.b.y)}" />`);
    } else if (p.k === 'poly') {
      const d = p.pts.map((pt: Pt, i: number) => `${i === 0 ? 'M' : 'L'}${fmt(pt.x)} ${fmt(pt.y)}`).join(' ');
      parts.push(`<path d="${d}${p.closed ? ' Z' : ''}" fill="none" />`);
    } else if (p.k === 'circle') {
      parts.push(`<circle cx="${fmt(p.c.x)}" cy="${fmt(p.c.y)}" r="${fmt(p.r)}" fill="none" />`);
    } else if (p.k === 'arc') {
      const pts = sampleArc(p.c, p.r, p.a1, p.a2);
      const d = pts.map((pt, i) => `${i === 0 ? 'M' : 'L'}${fmt(pt.x)} ${fmt(pt.y)}`).join(' ');
      parts.push(`<path d="${d}" fill="none" />`);
    }
  }

  return `<svg viewBox="${fmt(-W / 2)} ${fmt(-H / 2)} ${fmt(W)} ${fmt(H)}" xmlns="http://www.w3.org/2000/svg">
  <rect x="${fmt(-W / 2)}" y="${fmt(-H / 2)}" width="${fmt(W)}" height="${fmt(H)}" fill="#f7f4ee" />
  <g transform="scale(1,-1)" stroke="#3d3a34" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round">
    ${parts.join('\n    ')}
  </g>
</svg>
`;
}

/* ───────────────────────── ghi file + manifest ───────────────────────── */

interface ManifestBlock {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  w: number;
  h: number;
  file: string;
  thumb: string;
  source: string;
  license: string;
}

function slugLayer(category: string): string {
  return `NT_${category.toUpperCase().replace(/-/g, '_')}`;
}

function main() {
  if (existsSync(OUT_DIR)) rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });

  const byCategory = new Map<string, LibBlockDef[]>();
  for (const b of LIB_BLOCKS) {
    if (!byCategory.has(b.category)) byCategory.set(b.category, []);
    byCategory.get(b.category)!.push(b);
  }

  const manifestBlocks: ManifestBlock[] = [];

  for (const [category, blocks] of byCategory) {
    const dir = path.join(OUT_DIR, category);
    mkdirSync(dir, { recursive: true });
    for (const b of blocks) {
      const dxf = dxfFromPrims(b.prims, slugLayer(category));
      const svg = svgFromPrims(b.prims, b.w, b.h);
      writeFileSync(path.join(dir, `${b.id}.dxf`), dxf, 'utf-8');
      writeFileSync(path.join(dir, `${b.id}.svg`), svg, 'utf-8');
      manifestBlocks.push({
        id: b.id,
        name: b.name,
        category,
        categoryLabel: CATEGORY_LABEL[b.category],
        w: b.w,
        h: b.h,
        file: `/cad-library/${category}/${b.id}.dxf`,
        thumb: `/cad-library/${category}/${b.id}.svg`,
        source: b.source,
        license: b.license,
      });
    }
  }

  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    unit: 'mm',
    count: manifestBlocks.length,
    categories: Array.from(byCategory.keys()).map((slug) => ({ slug, label: CATEGORY_LABEL[slug as keyof typeof CATEGORY_LABEL] })),
    blocks: manifestBlocks,
  };

  writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');

  console.log(`Đã sinh ${manifestBlocks.length} block vào ${OUT_DIR}`);
  console.log(`Danh mục: ${Array.from(byCategory.entries()).map(([k, v]) => `${k}(${v.length})`).join(', ')}`);
}

main();
