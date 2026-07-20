/**
 * lib/cad/ai-assist.test.ts — 20/07 "bảng đề bài" (nhiều option): kiểm describeToEntities() cũ
 * KHÔNG đổi hành vi (biến thể tường mặc định = variant 0, chữ ký/kết quả giữ nguyên) +
 * generateLayoutOptions() sinh đúng 3 option/biến thể tường khác nhau + tỉ lệ custom đơn giản
 * nhân đúng kích thước phòng. Chạy:
 *   node_modules/.bin/sucrase-node lib/cad/ai-assist.test.ts
 */
import { describeToEntities, layoutToEntities, generateLayoutOptions, parseDescription } from './ai-assist';
import type { Entity } from './model';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

const ORIGIN = { x: 0, y: 0 };
const WALL_LAYER = 'l-wall';
const TEXT_LAYER = 'l-text';
const FURN_LAYER = 'l-furniture';

function blocks(entities: Entity[]): Extract<Entity, { type: 'block' }>[] {
  return entities.filter((e): e is Extract<Entity, { type: 'block' }> => e.type === 'block');
}

/* ═══════════════════════ [1] describeToEntities cũ — hành vi KHÔNG đổi ═══════════════════════ */
function testDescribeUnchanged() {
  console.log('\n[1] describeToEntities — hành vi cũ giữ nguyên (variant mặc định)');
  const text = 'phòng ngủ 4x3.5 có giường và tủ áo';
  const a = describeToEntities(text, ORIGIN, WALL_LAYER, TEXT_LAYER, 110, FURN_LAYER);
  const b = layoutToEntities(parseDescription(text), ORIGIN, WALL_LAYER, TEXT_LAYER, FURN_LAYER, 110); // variant mặc định (không truyền)
  ok('describeToEntities và layoutToEntities(variant mặc định) ra CÙNG số entity', a.entities.length === b.entities.length);
  ok('có block giường (bedD)', blocks(a.entities).some((e) => e.block === 'bedD'));
  ok('có block tủ áo (wardrobe)', blocks(a.entities).some((e) => e.block === 'wardrobe'));
  ok('note không rỗng', a.note.length > 0);
}

/* ═══════════════════════ [2] generateLayoutOptions — 3 option, biến thể khác nhau ═══════════════════════ */
function testGenerateOptions() {
  console.log('\n[2] generateLayoutOptions — 3 option/biến thể tường + option[0] khớp describeToEntities');
  const text = 'phòng ngủ 4x3.5 có giường và tủ áo';
  const opts = generateLayoutOptions(text, ORIGIN, WALL_LAYER, TEXT_LAYER, 110, FURN_LAYER);
  ok('sinh đúng 3 option', opts.length === 3);
  ok('3 id khác nhau', new Set(opts.map((o) => o.id)).size === 3);
  ok('variant lần lượt 0/1/2', opts.map((o) => o.variant).join(',') === '0,1,2');
  ok('mỗi option đều có entity (không rỗng)', opts.every((o) => o.entities.length > 0));

  const baseline = describeToEntities(text, ORIGIN, WALL_LAYER, TEXT_LAYER, 110, FURN_LAYER);
  ok('option variant=0 khớp describeToEntities (cùng số entity)', opts[0].entities.length === baseline.entities.length);

  // giường ANCHOR mặc định áp tường N (rot=0) — variant 1 (đối diện) phải đổi rot vì đổi tường S.
  const bedDefault = blocks(opts[0].entities).find((e) => e.block === 'bedD');
  const bedOpposite = blocks(opts[1].entities).find((e) => e.block === 'bedD');
  ok('giường đặt được ở CẢ variant mặc định và đối diện', !!bedDefault && !!bedOpposite);
  ok('variant đối diện đổi toạ độ Y của giường (áp tường khác)', !!bedDefault && !!bedOpposite && Math.abs(bedDefault.at.y - bedOpposite.at.y) > 100);
}

/* ═══════════════════════ [3] tỉ lệ custom đơn giản — scaleFactor ═══════════════════════ */
function testScaleFactor() {
  console.log('\n[3] generateLayoutOptions scaleFactor — nhân kích thước phòng đã parse');
  const text = 'phòng ngủ 4x3.5';
  const normal = generateLayoutOptions(text, ORIGIN, WALL_LAYER, TEXT_LAYER, 110, FURN_LAYER);
  const scaled = generateLayoutOptions(text, ORIGIN, WALL_LAYER, TEXT_LAYER, 110, FURN_LAYER, { scaleFactor: 2 });
  // note ghi "AxB m" — đo qua chuỗi note đủ tin cậy vì layoutToEntities luôn in kích thước phòng.
  ok('note phòng gốc ghi 4.0×3.5m', normal[0].note.includes('4.0×3.5m'));
  ok('note phòng đã nhân đôi ghi 8.0×7.0m', scaled[0].note.includes('8.0×7.0m'));
  // scaleFactor <=0 hoặc không hữu hạn → coi như 1 (an toàn, không NaN/âm kích thước).
  const invalid = generateLayoutOptions(text, ORIGIN, WALL_LAYER, TEXT_LAYER, 110, FURN_LAYER, { scaleFactor: -5 });
  ok('scaleFactor âm bị bỏ qua (về 1, không NaN/âm)', invalid[0].note.includes('4.0×3.5m'));
}

testDescribeUnchanged();
testGenerateOptions();
testScaleFactor();

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
