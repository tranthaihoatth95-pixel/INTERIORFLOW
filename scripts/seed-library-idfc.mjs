#!/usr/bin/env node
/**
 * scripts/seed-library-idfc.mjs — SINH KHO MẦM `.idfc` TỪ TÀI SẢN CÓ THẬT TRONG REPO.
 *
 * ▸ VÌ SAO (Lane B, 22/08): kệ Thư viện đang RỖNG ở gần hết các kệ — `common-idfc` đọc
 *   `lib/library/idfc-store.ts` (IndexedDB, máy mới = 0 món), còn `BUILTIN_ITEMS` của
 *   `shelves.ts` chỉ khai 12 dòng chữ cho MỘT kệ (`cad-kyhieu`) trong khi
 *   `public/cad-library/manifest.json` có **54 block .dxf thật**. Giao kệ rỗng là giao vỏ.
 *
 * ▸ [Đ2] KHÔNG DỰNG KHO THỨ HAI. Script này KHÔNG đẻ định dạng mới: nó chưng cất tài sản
 *   ĐÃ CÓ trong repo thành đúng `ParsedIdfc` (`lib/cad/idfc.ts`) — vỏ `meta` + ruột `body`
 *   theo `BODY_TYPE_OF_KIND`. Kệ `common-idfc` của `LibrarySheet` đọc thẳng, không sửa kệ.
 *
 * ▸ BA NGUỒN THẬT, không nguồn nào bịa:
 *   ① `public/cad-library/manifest.json` — 54 block, mỗi block có **.dxf thật + .svg thật**
 *      trên đĩa (script kiểm `existsSync` từng tệp, thiếu là BỎ món đó, không dựng vỏ rỗng).
 *      Hình học `geom2d.prims` PARSE THẬT từ .dxf bằng `lib/cad/dxf.ts` (`parseDxf`) —
 *      không gõ tay toạ độ nào.
 *   ② `lib/cad/materials.ts` `MATERIALS` — vật liệu 2D thật (hatchPattern/scale/angle/color).
 *   ③ `lib/cad/workstation-clusters.ts` `CLUSTER_SPECS` — cụm bàn sinh bằng hàm, gọi
 *      `build(mặc-định)` lấy `prims` thật.
 *
 * ▸ ⛔ CẤM BỊA (luật kệ-có-hàng): KHÔNG số lượt dùng, KHÔNG "trending", KHÔNG giá.
 *   `commerce` CHỈ gắn khi có nguồn giá thật — hiện **0 món** có, nên 0 món mang commerce.
 *   `geom3d.heightMm` CHỈ gắn cho cửa/cửa sổ vì đó là chỗ DUY NHẤT repo có số cao thật
 *   (`OPENING_STANDARD_HEIGHT_MM`, `lib/cad/hatch.ts:97`). Món khác: không có thì bỏ trống.
 *
 * ▸ ĐỘ TIN CẬY — dùng đúng 3 nấc `measured|inferred|verified`, KHÔNG đẻ nấc thứ tư:
 *   · `measured` — đọc thẳng từ tệp/hằng số trong repo (prims từ .dxf, hatch từ MaterialDef).
 *   · `inferred` — máy suy (PBR suy từ tên danh mục qua `pbr-from-category.ts`, luôn `suyDoan`).
 *   · `verified` — KHÔNG món mầm nào được nhận nấc này (chưa ai duyệt bằng mắt).
 *
 * CHẠY:  node scripts/seed-library-idfc.mjs
 * RA:    lib/idfc-seed/seed.generated.ts  (kiểm vào git — app không parse .dxf lúc chạy)
 */

import { createRequire } from 'node:module';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
require('sucrase/register');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');

const { parseDxf } = require(path.join(ROOT, 'lib/cad/dxf.ts'));
const { MATERIALS } = require(path.join(ROOT, 'lib/cad/materials.ts'));
const { CLUSTER_SPECS } = require(path.join(ROOT, 'lib/cad/workstation-clusters.ts'));
const { OPENING_STANDARD_HEIGHT_MM } = require(path.join(ROOT, 'lib/cad/hatch.ts'));
const { inferPbrFromCategory } = require(path.join(ROOT, 'lib/materials/pbr-from-category.ts'));

const APP_VERSION = 'interiorflow-1.0.0';
/** Mốc thời gian CỐ ĐỊNH — kho mầm đi kèm bản cài, không phải "vừa tạo lúc chạy script". */
const SEED_AT = '2026-08-22T00:00:00.000Z';
const AUTHOR = 'InteriorFlow (kho mầm đi kèm bản cài)';

/* ─────────────────── ① 54 block .dxf → .idfc cấu kiện ─────────────────── */

/**
 * Danh mục phòng (trục ② `BlockGroup`) → LOẠI (trục ① `IdfcKind`). Hai trục ĐỘC LẬP
 * (chốt 11.4) nên bảng này chỉ nói "món trong nhóm phòng đó thường là loại gì".
 * ⚠️ KHAI THẬT: `cau-thang` · `cot` · `xe` · `ky-hieu` KHÔNG phải cấu kiện mua-bán — chúng là
 * KÝ HIỆU BẢN VẼ. `IdfcKind` chưa có loại cho ký hiệu (12 loại của idfc.ts), nên tạm xếp
 * `fitout` VÀ gắn thẻ `ky-hieu-ban-ve` để lọc lại được khi có loại đúng. KHÔNG im lặng
 * xếp chúng thành `furniture` — bảng khối lượng sẽ đếm nhầm thành đồ rời phải mua.
 */
const KIND_OF_CATEGORY = {
  'phong-khach': 'furniture',
  'phong-an': 'furniture',
  'phong-ngu': 'furniture',
  'van-phong': 'furniture',
  'cay-canh': 'fitout',
  bep: 'millwork',
  've-sinh': 'fixture',
  cua: 'fitout',
  'cau-thang': 'fitout',
  cot: 'fitout',
  xe: 'fitout',
  'ky-hieu': 'fitout',
};

/** Nhóm phòng `BlockGroup` — chỉ dùng giá trị CÓ THẬT trong `lib/cad/shared-types.ts`. */
const GROUP_OF_CATEGORY = {
  'phong-khach': 'Phòng khách',
  'phong-an': 'Phòng ăn',
  'phong-ngu': 'Phòng ngủ',
  'van-phong': 'Làm việc',
  bep: 'Bếp',
  've-sinh': 'Vệ sinh',
  cua: 'Kiến trúc',
  'cau-thang': 'Cầu thang',
  // `BlockGroup` chỉ có 10 giá trị và KHÔNG có nhóm trung tính — cột · cây · xe · ký hiệu đều
  // là thứ vẽ trên mặt bằng kiến trúc, nên xếp 'Kiến trúc'. Nói rõ đây là CHỌN theo nhóm gần
  // nhất, không phải phân loại đo được; thẻ `ky-hieu-ban-ve` giữ lối lọc lại sau.
  cot: 'Kiến trúc',
  'cay-canh': 'Kiến trúc',
  xe: 'Kiến trúc',
  'ky-hieu': 'Kiến trúc',
};

const SYMBOL_CATEGORIES = new Set(['cau-thang', 'cot', 'xe', 'ky-hieu']);

const r3 = (n) => Math.round(n * 1000) / 1000;
const pt = (p) => ({ x: r3(p.x), y: r3(p.y) });

/** Entity (parse từ .dxf) → `Prim` của `lib/cad/furniture.ts`. `text` bỏ (Prim không có chữ). */
function entityToPrim(e) {
  switch (e.type) {
    case 'line':
      return { k: 'line', a: pt(e.a), b: pt(e.b) };
    case 'polyline':
      return { k: 'poly', pts: e.points.map(pt), ...(e.closed ? { closed: true } : {}) };
    case 'circle':
      return { k: 'circle', c: pt(e.c), r: r3(e.r) };
    case 'arc':
      return { k: 'arc', c: pt(e.c), r: r3(e.r), a1: r3(e.a1), a2: r3(e.a2) };
    default:
      return null;
  }
}

/** Mã món — HOA, ổn định, dẫn xuất tất định từ id block trong manifest (không sinh ngẫu nhiên). */
const codeOf = (prefix, id) => `${prefix}-${id.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}`;

function seedFromManifest(out, prov) {
  const manifestPath = path.join(PUBLIC, 'cad-library/manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  let boQua = 0;

  for (const b of manifest.blocks) {
    const dxfPath = path.join(PUBLIC, b.file);
    const svgPath = path.join(PUBLIC, b.thumb);
    // Tệp không có trên đĩa ⇒ BỎ, không dựng món trỏ vào hư không.
    if (!existsSync(dxfPath) || !existsSync(svgPath)) {
      boQua += 1;
      continue;
    }
    const doc = parseDxf(readFileSync(dxfPath, 'utf8'));
    const prims = doc.entities.map(entityToPrim).filter(Boolean);
    if (prims.length === 0) {
      boQua += 1;
      continue;
    }

    const kind = KIND_OF_CATEGORY[b.category] ?? 'furniture';
    const code = codeOf('BLK', b.id);
    const laKyHieu = SYMBOL_CATEGORIES.has(b.category);
    const hosted = /door|cua-di|cua-1|cua-2/.test(b.id) ? 'door' : /window|cua-so/.test(b.id) ? 'window' : null;

    const geom3d = hosted ? { heightMm: OPENING_STANDARD_HEIGHT_MM[hosted] } : undefined;

    out.push({
      meta: {
        id: `seed:${b.id}`,
        name: b.name,
        code,
        kind,
        scope: 'chung',
        tags: ['kho-mam', `phong:${b.category}`, ...(laKyHieu ? ['ky-hieu-ban-ve'] : []), ...(b.category === 'cay-canh' ? ['cay-canh'] : [])],
        room: b.categoryLabel,
        author: AUTHOR,
        createdAt: SEED_AT,
        modifiedAt: SEED_AT,
        appVersion: APP_VERSION,
      },
      body: {
        type: 'component',
        geom2d: { group: GROUP_OF_CATEGORY[b.category] ?? 'Kiến trúc', w: b.w, h: b.h, prims },
        ...(geom3d ? { geom3d } : {}),
      },
    });

    prov[code] = {
      nguon: b.file,
      anhXemTruoc: b.thumb,
      giayPhep: b.license,
      moTaNguon: b.source,
      doTinCay: {
        // Hình học đọc thẳng từ tệp .dxf gốc — không suy, không gõ tay.
        geom2d: 'measured',
        // Bao ngoài w/h khai trong manifest, cùng nguồn với tệp .dxf.
        kichThuoc: 'measured',
        // Cao chỉ có ở cửa/cửa sổ và lấy từ hằng số chuẩn ngành — là dải chuẩn, không phải đo món.
        ...(geom3d ? { cao: 'inferred' } : {}),
      },
    };
  }
  return boQua;
}

/* ─────────────────── ② MATERIALS → .idfc vật liệu ─────────────────── */

function seedFromMaterials(out, prov) {
  for (const m of MATERIALS) {
    const code = codeOf('MAT', m.id);
    const suy = inferPbrFromCategory(`${m.name} ${m.category}`);
    out.push({
      meta: {
        id: `seed:${m.id}`,
        name: m.name,
        code,
        kind: 'material',
        scope: 'chung',
        tags: ['kho-mam', `nhom:${m.category}`, 'pbr:suy-doan'],
        author: AUTHOR,
        createdAt: SEED_AT,
        modifiedAt: SEED_AT,
        appVersion: APP_VERSION,
      },
      body: {
        type: 'material',
        // PBR SUY từ tên danh mục — `inferPbrFromCategory` luôn trả `suyDoan:true`, nên nấc
        // tin cậy dưới đây là `inferred`. KHÔNG bịa thêm trường PBR nào không suy được.
        pbr: { roughness: suy.roughness, metallic: suy.metallic },
        // Ký hiệu 2D là dữ liệu THẬT khai tay trong `MaterialDef` — đây là mặt 2D của vật liệu.
        hatch2d: {
          hatchPattern: m.hatchPattern,
          ...(m.patternScale !== undefined ? { patternScale: m.patternScale } : {}),
          ...(m.patternAngle !== undefined ? { patternAngle: m.patternAngle } : {}),
          ...(m.color ? { color: m.color } : {}),
        },
      },
    });
    prov[code] = {
      nguon: 'lib/cad/materials.ts (MATERIALS)',
      giayPhep: 'tài sản gốc của dự án InteriorFlow',
      moTaNguon: `preset vật liệu 2D — danh mục "${m.category}"`,
      doTinCay: { hatch2d: 'measured', pbr: 'inferred' },
    };
  }
}

/* ─────────────────── ③ CLUSTER_SPECS → .idfc đồ mộc đóng ─────────────────── */

function seedFromClusters(out, prov) {
  for (const spec of CLUSTER_SPECS) {
    const values = Object.fromEntries(spec.params.map((p) => [p.id, p.default]));
    let built;
    try {
      built = spec.build(values);
    } catch {
      continue; // cụm không dựng được với tham số mặc định ⇒ bỏ, không dựng vỏ rỗng
    }
    const prims = built.prims.map((p) => normalizePrim(p)).filter(Boolean);
    if (prims.length === 0) continue;

    const code = codeOf('CLU', spec.id);
    out.push({
      meta: {
        id: `seed:${spec.id}`,
        name: spec.label[0],
        nameEn: spec.label[1],
        code,
        // Cụm bàn = hệ bàn + vách dựng theo kích thước tại chỗ ⇒ đồ mộc đóng (millwork).
        kind: 'millwork',
        scope: 'chung',
        tags: ['kho-mam', 'cum-ban', `cho-ngoi:${built.seats}`],
        room: 'Văn phòng',
        author: AUTHOR,
        createdAt: SEED_AT,
        modifiedAt: SEED_AT,
        appVersion: APP_VERSION,
      },
      body: {
        type: 'component',
        geom2d: {
          group: 'Làm việc',
          w: Math.round(built.sizeMm.w),
          h: Math.round(built.sizeMm.h),
          prims,
          ...(built.clearance?.length ? { clearance: built.clearance } : {}),
        },
      },
    });
    prov[code] = {
      nguon: 'lib/cad/workstation-clusters.ts (CLUSTER_SPECS)',
      giayPhep: 'tài sản gốc của dự án InteriorFlow',
      moTaNguon: `${spec.desc[0]} — sinh bằng hàm với tham số mặc định (${spec.params.map((p) => `${p.id}=${p.default}`).join(', ')})`,
      doTinCay: {
        // Hình học tính bằng hàm từ tham số — tất định, chạy lại ra y hệt.
        geom2d: 'measured',
        // Bao ngoài đo TỪ CHÍNH prims (ClusterResult.sizeMm), không phải số khai tay.
        kichThuoc: 'measured',
      },
    };
  }
}

function normalizePrim(p) {
  switch (p.k) {
    case 'line':
      return { k: 'line', a: pt(p.a), b: pt(p.b) };
    case 'poly':
      return { k: 'poly', pts: p.pts.map(pt), ...(p.closed ? { closed: true } : {}) };
    case 'circle':
      return { k: 'circle', c: pt(p.c), r: r3(p.r) };
    case 'arc':
      return { k: 'arc', c: pt(p.c), r: r3(p.r), a1: r3(p.a1), a2: r3(p.a2) };
    default:
      return null;
  }
}

/* ─────────────────── xuất ─────────────────── */

const items = [];
const prov = {};
const boQuaManifest = seedFromManifest(items, prov);
seedFromMaterials(items, prov);
seedFromClusters(items, prov);

const demKind = {};
for (const it of items) demKind[it.meta.kind] = (demKind[it.meta.kind] ?? 0) + 1;

const header = `// lib/idfc-seed/seed.generated.ts — TỆP SINH TỰ ĐỘNG, ĐỪNG SỬA TAY.
// Sinh bởi: scripts/seed-library-idfc.mjs — chạy lại: \`node scripts/seed-library-idfc.mjs\`
//
// Mọi món dưới đây chưng cất từ tài sản CÓ THẬT trong repo (xem \`SEED_PROVENANCE\` để biết
// từng món đến từ tệp nào, giấy phép gì, nấc tin cậy nào). Không món nào có giá hay số lượt
// dùng — repo không có nguồn thật cho hai thứ đó, nên chúng KHÔNG tồn tại ở đây.
//
// Số món theo loại: ${JSON.stringify(demKind)}
// Bỏ qua (thiếu tệp .dxf/.svg hoặc parse ra 0 hình): ${boQuaManifest}

import type { ParsedIdfc } from '../cad/idfc';
import type { SeedProvenance } from './types';

export const SEED_IDFC_ITEMS: readonly ParsedIdfc[] = `;

const body = `${JSON.stringify(items, null, 1)} as unknown as readonly ParsedIdfc[];

export const SEED_PROVENANCE: Readonly<Record<string, SeedProvenance>> = ${JSON.stringify(prov, null, 1)};
`;

const outPath = path.join(ROOT, 'lib/idfc-seed/seed.generated.ts');
writeFileSync(outPath, header + body, 'utf8');

console.log(`✔ ${items.length} món → ${path.relative(ROOT, outPath)}`);
console.log('  theo loại:', demKind);
console.log('  bỏ qua (manifest):', boQuaManifest);
console.log(`  cỡ tệp: ${(readFileSync(outPath).length / 1024).toFixed(0)} KB`);
