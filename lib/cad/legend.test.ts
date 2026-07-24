/**
 * lib/cad/legend.test.ts — C2 Hệ Legend: collectLegend() quét ký hiệu đang dùng +
 * legendToEntities() dựng khung chú giải. Chạy:
 *   node_modules/.bin/sucrase-node lib/cad/legend.test.ts
 */
import { collectLegend, legendToEntities } from './legend';
import { emptyDoc, type Doc, type BlockEntity, type Entity } from './model';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

let seq = 0;
function blk(block: string): BlockEntity {
  seq += 1;
  return { id: `b${seq}`, type: 'block', layer: 'l-furniture', block, at: { x: seq * 3000, y: 0 }, rot: 0, sx: 1, sy: 1 };
}

function planDoc(): Doc {
  const doc = emptyDoc();
  doc.entities.push(blk('sofa3'), blk('sofa3'), blk('door'), blk('khoi-la-dxf'));
  // line dùng nét khuất (override entity)
  doc.entities.push({ id: 'l1', type: 'line', layer: 'l-wall', lineType: 'hidden', a: { x: 0, y: 0 }, b: { x: 1000, y: 0 } } as Entity);
  // layer 'Trục' mặc định lineType center — entity không override vẫn phải nhận ra
  doc.entities.push({ id: 'l2', type: 'line', layer: 'l-axis', a: { x: 0, y: 0 }, b: { x: 0, y: 1000 } } as Entity);
  // hatch ANSI31 + SOLID (dữ liệu cũ solid:true không pattern)
  doc.entities.push({ id: 'h1', type: 'hatch', layer: 'l-wall', pattern: 'ANSI31', points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }] } as Entity);
  doc.entities.push({ id: 'h2', type: 'hatch', layer: 'l-wall', solid: true, points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }] } as Entity);
  return doc;
}

/* ═══ [1] doc trống — legend rỗng, không sinh khung ═══ */
console.log('\n[1] doc trống');
const empty = collectLegend(emptyDoc());
ok('0 block', empty.blocks.length === 0);
ok('0 linetype (continuous bỏ qua)', empty.lineTypes.length === 0);
ok('legendToEntities trả rỗng', legendToEntities(empty, { x: 0, y: 0 }).length === 0);

/* ═══ [2] collectLegend — chỉ chứa cái ĐANG dùng ═══ */
console.log('\n[2] collectLegend');
const items = collectLegend(planDoc());
ok('3 loại block (sofa3/door/khối lạ)', items.blocks.length === 3);
ok('sofa3 đứng đầu (count 2)', items.blocks[0].block === 'sofa3' && items.blocks[0].count === 2);
ok('sofa3 song ngữ EN', items.blocks[0].nameEn === '3-Seat Sofa');
ok('block DXF lạ giữ key thô làm tên', items.blocks.some((b) => b.block === 'khoi-la-dxf' && b.name === 'khoi-la-dxf'));
ok('hidden từ override entity', items.lineTypes.includes('hidden'));
ok('center từ lineType layer Trục', items.lineTypes.includes('center'));
ok('continuous KHÔNG vào legend', !items.lineTypes.includes('continuous'));
ok('hatch ANSI31 + SOLID (solid:true cũ)', items.hatches.includes('ANSI31') && items.hatches.includes('SOLID'));

/* ═══ [3] legendToEntities ═══ */
console.log('\n[3] legendToEntities');
const ents = legendToEntities(items, { x: 20000, y: 0 });
ok('có entity', ents.length > 0);
const texts = ents.filter((e) => e.type === 'text') as Extract<Entity, { type: 'text' }>[];
ok('tiêu đề CHÚ GIẢI · LEGEND', texts.some((t) => t.text === 'CHÚ GIẢI · LEGEND'));
ok('3 section (Ký hiệu/Nét vẽ/Vật liệu tô)', ['Ký hiệu · Symbols', 'Nét vẽ · Line types', 'Vật liệu tô · Hatches'].every((s) => texts.some((t) => t.text === s)));
const swatches = ents.filter((e) => e.type === 'block') as BlockEntity[];
ok('swatch = BlockEntity thu nhỏ (2 block chuẩn)', swatches.length === 2);
ok('swatch sofa3 scale < 1 (2100mm → lọt ô 800)', (swatches.find((s) => s.block === 'sofa3')?.sx ?? 1) < 1);
ok('nhãn kèm số lượng', texts.some((t) => t.text.includes('Sofa 3 chỗ · 3-Seat Sofa') && t.text.includes('(2)')));
const legendLine = ents.find((e) => e.type === 'line' && e.lineType === 'hidden');
ok('hàng nét khuất vẽ bằng chính lineType hidden', !!legendLine);
ok('hàng hatch có pattern ANSI31', ents.some((e) => e.type === 'hatch' && (e as Extract<Entity, { type: 'hatch' }>).pattern === 'ANSI31'));
const ids = new Set(ents.map((e) => e.id));
ok('id không trùng', ids.size === ents.length);

/* ═══ [4] tự cập nhật = regenerate từ Doc mới ═══ */
console.log('\n[4] regenerate theo Doc');
const doc2 = planDoc();
doc2.entities = doc2.entities.filter((e) => !(e.type === 'block' && (e as BlockEntity).block === 'sofa3'));
const items2 = collectLegend(doc2);
ok('xoá sofa3 khỏi bản vẽ → legend hết sofa3', !items2.blocks.some((b) => b.block === 'sofa3'));

console.log(`\nKẾT QUẢ: ${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
