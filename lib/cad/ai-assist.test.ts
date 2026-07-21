/**
 * lib/cad/ai-assist.test.ts — 20/07 "bảng đề bài" (nhiều option): kiểm describeToEntities() cũ
 * KHÔNG đổi hành vi (biến thể tường mặc định = variant 0, chữ ký/kết quả giữ nguyên) +
 * generateLayoutOptions() sinh đúng 3 option/biến thể tường khác nhau + tỉ lệ custom đơn giản
 * nhân đúng kích thước phòng. Chạy:
 *   node_modules/.bin/sucrase-node lib/cad/ai-assist.test.ts
 */
import { describeToEntities, layoutToEntities, generateLayoutOptions, parseDescription, matchBriefToRooms, type TargetRoom } from './ai-assist';
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

/* ═══════════════════════ [4] 21/07 — bố trí VÀO hiện trạng (targetRooms) ═══════════════════════ */
function inBox(e: Extract<Entity, { type: 'block' }>, b: { ix0: number; iy0: number; ix1: number; iy1: number }): boolean {
  return e.at.x >= b.ix0 && e.at.x <= b.ix1 && e.at.y >= b.iy0 && e.at.y <= b.iy1;
}

function testParseMerge() {
  console.log('\n[4] parseDescription — mảnh chỉ liệt kê nội thất gộp vào phòng trước (không sinh phòng generic thừa)');
  const spec = parseDescription('bố trí phòng khách có sofa, bàn trà; phòng ngủ có giường tủ');
  ok('đúng 2 phòng (KHÔNG có phòng generic thừa từ "bàn trà")', spec.rooms.length === 2);
  ok('phòng khách nhận cả sofa + bàn trà', spec.rooms[0].items.includes('sofa3') && spec.rooms[0].items.includes('coffeeTable'));
  ok('phòng ngủ nhận giường + tủ', spec.rooms[1].items.includes('bedD') && spec.rooms[1].items.includes('wardrobe'));
}

function testMatchRooms() {
  console.log('\n[5] matchBriefToRooms — map tên gần đúng, mỗi phòng hiện trạng dùng 1 lần');
  const targets: TargetRoom[] = [
    { name: 'PHÒNG NGỦ 1', interior: { ix0: 0, iy0: 0, ix1: 3400, iy1: 3600 } },
    { name: 'PHÒNG KHÁCH + ĂN', interior: { ix0: 5000, iy0: 0, ix1: 9200, iy1: 3600 } },
    { name: 'P.NGỦ 2', interior: { ix0: 0, iy0: 5000, ix1: 3400, iy1: 8600 } },
  ];
  const spec = parseDescription('phòng khách có sofa; phòng ngủ có giường; phòng ngủ có giường đơn');
  const m = matchBriefToRooms(spec.rooms, targets);
  ok('phòng khách → PHÒNG KHÁCH + ĂN (chứa nhau)', m[0] === 1);
  ok('phòng ngủ thứ 1 → PHÒNG NGỦ 1', m[1] === 0);
  ok('phòng ngủ thứ 2 → P.NGỦ 2 (viết tắt, khớp CÔNG NĂNG)', m[2] === 2);
  const noMatch = matchBriefToRooms(parseDescription('bếp có bếp').rooms, [targets[0]]);
  ok('bếp không khớp phòng ngủ → null', noMatch[0] === null);
}

function testInSituOptions() {
  console.log('\n[6] generateLayoutOptions targetRooms — nội thất đặt VÀO phòng thật, không vẽ tường mới');
  const targets: TargetRoom[] = [
    { name: 'PHÒNG NGỦ 1', interior: { ix0: 1000, iy0: 1000, ix1: 4400, iy1: 4600 } },
    { name: 'PHÒNG KHÁCH + ĂN', interior: { ix0: 5000, iy0: 1000, ix1: 9200, iy1: 4600 } },
  ];
  const text = 'bố trí phòng khách có sofa, bàn trà; phòng ngủ có giường tủ';
  const opts = generateLayoutOptions(text, ORIGIN, WALL_LAYER, TEXT_LAYER, 110, FURN_LAYER, { targetRooms: targets });
  ok('vẫn sinh 3 option, variant 0/1/2', opts.length === 3 && opts.map((o) => o.variant).join(',') === '0,1,2');
  ok('placedInto ghi đủ 2 phòng hiện trạng', opts.every((o) => o.placedInto?.length === 2));
  ok('option chỉ chứa BLOCK nội thất (không vẽ tường/nhãn mới cho phòng khớp)', opts.every((o) => o.entities.every((e) => e.type === 'block')));
  const bs = blocks(opts[0].entities);
  const bed = bs.find((e) => e.block === 'bedD');
  const sofa = bs.find((e) => e.block === 'sofa3');
  const coffee = bs.find((e) => e.block === 'coffeeTable');
  ok('giường nằm TRONG lòng phòng ngủ hiện trạng', !!bed && inBox(bed, targets[0].interior));
  ok('sofa nằm TRONG lòng phòng khách hiện trạng', !!sofa && inBox(sofa, targets[1].interior));
  ok('bàn trà nằm TRONG lòng phòng khách hiện trạng', !!coffee && inBox(coffee, targets[1].interior));
  ok('note ghi rõ map phòng', opts[0].note.includes('Bố trí VÀO hiện trạng') && opts[0].note.includes('PHÒNG NGỦ 1'));
  // variant đối diện vẫn đổi tường trong CÙNG phòng thật
  const bedOpp = blocks(opts[1].entities).find((e) => e.block === 'bedD');
  ok('variant đối diện đổi toạ độ giường nhưng vẫn trong phòng thật', !!bed && !!bedOpp && Math.abs(bed.at.y - bedOpp.at.y) > 100 && inBox(bedOpp!, targets[0].interior));

  // không khớp → fallback hành vi cũ: sinh phòng mới cạnh bản vẽ (có tường/nhãn) + note rõ
  const fb = generateLayoutOptions('bếp có bếp', ORIGIN, WALL_LAYER, TEXT_LAYER, 110, FURN_LAYER, { targetRooms: [targets[0]] });
  ok('không khớp: sinh cả entity ngoài block (tường/nhãn phòng mới)', fb[0].entities.some((e) => e.type !== 'block'));
  ok('không khớp: note ghi "KHÔNG khớp phòng hiện trạng"', fb[0].note.includes('KHÔNG khớp phòng hiện trạng'));
  // targetRooms rỗng/không truyền → đường cũ nguyên vẹn
  const legacy = generateLayoutOptions(text, ORIGIN, WALL_LAYER, TEXT_LAYER, 110, FURN_LAYER, { targetRooms: [] });
  const legacy2 = generateLayoutOptions(text, ORIGIN, WALL_LAYER, TEXT_LAYER, 110, FURN_LAYER);
  ok('targetRooms rỗng = hành vi cũ (cùng số entity với không truyền)', legacy[0].entities.length === legacy2[0].entities.length && legacy[0].placedInto === undefined);
}

testDescribeUnchanged();
testGenerateOptions();
testScaleFactor();
testParseMerge();
testMatchRooms();
function testObstacles() {
  console.log('\n[7] targetRooms.obstacles — solver né đồ có sẵn trong phòng hiện trạng');
  // Phòng khách 4200×3600 với 1 sofa đã đặt sẵn giữa mặt tường W (nơi ANCHOR mặc định của sofa)
  // → solver phải trượt sofa mới sang chỗ khác (hoặc bỏ nếu hết chỗ), KHÔNG chồng.
  const targets: TargetRoom[] = [
    {
      name: 'PHÒNG KHÁCH',
      interior: { ix0: 0, iy0: 0, ix1: 4200, iy1: 3600 },
      obstacles: [{ x: 200, y: 1800, ex: 400, ey: 2000 }], // chiếm nguyên mặt tường W
    },
  ];
  const opts = generateLayoutOptions('phòng khách có sofa', ORIGIN, WALL_LAYER, TEXT_LAYER, 110, FURN_LAYER, { targetRooms: targets });
  const sofa = blocks(opts[0].entities).find((e) => e.block === 'sofa3');
  // sofa mới (nếu đặt được) phải KHÔNG chồng lên obstacle: AABB không giao nhau
  if (sofa) {
    const sw = 2050;
    const sh = 850;
    const c = Math.abs(Math.cos(sofa.rot));
    const s = Math.abs(Math.sin(sofa.rot));
    const ex = sw * c + sh * s;
    const ey = sw * s + sh * c;
    const overlapX = Math.abs(sofa.at.x - 200) * 2 < ex + 400;
    const overlapY = Math.abs(sofa.at.y - 1800) * 2 < ey + 2000;
    ok('sofa mới KHÔNG chồng obstacle (đã trượt sang tường khác)', !(overlapX && overlapY));
  } else {
    ok('sofa bỏ vì hết chỗ (chấp nhận được, không chồng)', opts[0].note.includes('CHƯA đủ chỗ'));
  }
}

testInSituOptions();
testObstacles();

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
