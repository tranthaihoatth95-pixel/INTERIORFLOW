/**
 * lib/boq/from-project.test.ts — BOQ v2 Việc 1 (02/08): `computeBoqForProject`/`specDtoToMaterialLite`.
 * Chạy: node_modules/.bin/sucrase-node lib/boq/from-project.test.ts
 */
import { computeBoqForProject, specDtoToMaterialLite, type ProductSpecDtoLite } from './from-project';
import { __clearAllBoqCacheForTest } from './cache';
import { emptyDoc, type Doc, type HatchEntity } from '../cad/model';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

let seq = 0;
function rectHatch(wMm: number, dMm: number, extra?: Partial<HatchEntity>): HatchEntity {
  seq += 1;
  return {
    id: `h${seq}`,
    type: 'hatch',
    layer: 'l-floor',
    solid: true,
    points: [
      { x: 0, y: 0 },
      { x: wMm, y: 0 },
      { x: wMm, y: dMm },
      { x: 0, y: dMm },
    ],
    ...extra,
  };
}

function docWith(...ents: HatchEntity[]): Doc {
  const doc = emptyDoc();
  doc.entities.push(...ents);
  return doc;
}

/* ═══ [1] specDtoToMaterialLite — ánh xạ đủ field, không bịa/mất field ═══ */
console.log('\n[1] specDtoToMaterialLite ánh xạ đúng');
{
  const dto: ProductSpecDtoLite = {
    id: 'spec-1', name: 'Sàn gỗ', vendor: 'An Cường', sku: 'AC-01',
    unit: 'm2', priceVnd: 300_000, wastagePercent: 5,
  };
  const lite = specDtoToMaterialLite(dto);
  ok('id đúng', lite.id === 'spec-1');
  ok('name đúng', lite.name === 'Sàn gỗ');
  ok('vendor đúng', lite.vendor === 'An Cường');
  ok('sku đúng', lite.sku === 'AC-01');
  ok('unit đúng', lite.unit === 'm2');
  ok('priceVnd đúng', lite.priceVnd === 300_000);
  ok('wastagePercent đúng', lite.wastagePercent === 5);
}

/* ═══ [2] specDtoToMaterialLite — null-safe (vendor/sku/priceVnd null giữ nguyên null) ═══ */
console.log('\n[2] specDtoToMaterialLite giữ nguyên null (không đoán 0/rỗng)');
{
  const dto: ProductSpecDtoLite = {
    id: 'spec-2', name: 'Đá chưa báo giá', vendor: null, sku: null,
    unit: null, priceVnd: null, wastagePercent: null,
  };
  const lite = specDtoToMaterialLite(dto);
  ok('vendor null', lite.vendor === null);
  ok('sku null', lite.sku === null);
  ok('unit null', lite.unit === null);
  ok('priceVnd null (BOQ phải báo "chưa có giá", không đoán)', lite.priceVnd === null);
  ok('wastagePercent null', lite.wastagePercent === null);
}

/* ═══ [3] computeBoqForProject — nối đúng Doc + specDtos → ra BOQ đúng số ═══ */
console.log('\n[3] computeBoqForProject tính đúng từ Doc + specDtos thật');
{
  __clearAllBoqCacheForTest();
  const dto: ProductSpecDtoLite = {
    id: 'spec-san-go', name: 'Sàn gỗ công nghiệp', vendor: 'An Cường', sku: 'AC-SG-08',
    unit: 'm2', priceVnd: 300_000, wastagePercent: 5,
  };
  const h = rectHatch(2000, 3000, { specId: dto.id }); // 6m²
  const doc = docWith(h);

  const { result, hit } = computeBoqForProject('du-an-tu-project', doc, [dto]);
  ok('lần đầu hit:false', hit === false);
  ok('0 lỗi', result.errors.length === 0);
  ok('1 dòng BOQ', result.rows.length === 1);
  ok('m² đúng 6', result.rows[0]?.m2 === 6);
  ok('thành tiền đúng (6 × 1.05 × 300.000 = 1.890.000)', result.rows[0]?.thanhTien === 1_890_000);
}

/* ═══ [4] computeBoqForProject — cacheKey = projectId, gọi lại cùng project → hit:true ═══ */
console.log('\n[4] gọi lại CÙNG projectId, Doc/specDtos không đổi → hit:true (dùng lại cache)');
{
  __clearAllBoqCacheForTest();
  const dto: ProductSpecDtoLite = {
    id: 'spec-1', name: 'Gạch', vendor: null, sku: null,
    unit: 'm2', priceVnd: 200_000, wastagePercent: 0,
  };
  const h = rectHatch(1000, 1000, { specId: dto.id }); // 1m²
  const doc = docWith(h);

  const first = computeBoqForProject('du-an-lap-lai', doc, [dto]);
  const second = computeBoqForProject('du-an-lap-lai', doc, [dto]);
  ok('lần đầu hit:false', first.hit === false);
  ok('lần 2 hit:true', second.hit === true);
  ok('2 project khác nhau không đụng cache (đổi id thử)', (() => {
    const other = computeBoqForProject('du-an-khac', doc, [dto]);
    return other.hit === false; // project khác, chưa từng tính, PHẢI hit:false
  })());
}

console.log(`\nKẾT QUẢ: ${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
