/**
 * lib/cad/levels.test.ts — VIỆC 1 (Level + resolveElevation) & VIỆC 2 (constraint cao độ +
 * computeHeights). Chạy: node_modules/.bin/sucrase-node lib/cad/levels.test.ts
 *
 * Trọng tâm nghiệm thu (theo phiếu):
 *  [5] đổi `Level.elevationMm` → 10 entity gắn vào nó đổi ĐÚNG theo.
 *  [6] TRUNG TÍNH — dữ liệu cũ (không levelId/constraint) ra ĐÚNG con số cũ: base 0, top = heightMm.
 */
import { emptyDoc } from './model';
import type { Doc, Entity, Level } from './model';
import { computeHeights, levelById, levelsFromStoreys, resolveElevation, sortedLevels, upgradeDocLevelsFromStorey } from './levels';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL - ${label}`);
  }
}

function hatch(id: string, extra: Partial<Entity> = {}): Entity {
  return { id, type: 'hatch', layer: 'l-wall', points: [], ...extra } as Entity;
}

const L_GF: Level = { id: 'lv-gf', name: 'Trệt', elevationMm: 0, order: 0 };
const L1: Level = { id: 'lv-1', name: 'Lầu 1', elevationMm: 3600, order: 1 };
const L2: Level = { id: 'lv-2', name: 'Lầu 2', elevationMm: 7200, order: 2 };

function docWithLevels(entities: Entity[], levels: Level[] = [L_GF, L1, L2]): Doc {
  return { ...emptyDoc(), entities, levels };
}

/* ── [1] tra cứu Level ── */
function testLookup() {
  console.log('\n[1] levelById / sortedLevels');
  const doc = docWithLevels([]);
  ok('tra đúng id', levelById(doc, 'lv-1')?.elevationMm === 3600);
  ok('id không tồn tại → undefined', levelById(doc, 'lv-999') === undefined);
  ok('id undefined → undefined', levelById(doc, undefined) === undefined);
  ok('doc chưa có levels → undefined', levelById(emptyDoc(), 'lv-1') === undefined);

  const scrambled = docWithLevels([], [L2, L_GF, L1]);
  ok('sortedLevels xếp theo order tăng dần', sortedLevels(scrambled).map((l) => l.id).join(',') === 'lv-gf,lv-1,lv-2');
  ok('sortedLevels KHÔNG sửa mảng gốc', scrambled.levels![0].id === 'lv-2');
  // Tầng lửng: cùng order thì cao độ thấp hơn xếp trước.
  const tie = docWithLevels([], [
    { id: 'a', name: 'A', elevationMm: 5000, order: 1 },
    { id: 'b', name: 'B', elevationMm: 1000, order: 1 },
  ]);
  ok('order hoà → xếp theo elevationMm', sortedLevels(tie).map((l) => l.id).join(',') === 'b,a');
  ok('doc không levels → sortedLevels trả mảng rỗng', sortedLevels(emptyDoc()).length === 0);
}

/* ── [2] VIỆC 1c — chuỗi lùi resolveElevation ── */
function testResolveElevation() {
  console.log('\n[2] resolveElevation — levelId → elevationMm → 0');
  const doc = docWithLevels([]);
  ok('có levelId tra được → cao độ Level', resolveElevation(hatch('e1', { levelId: 'lv-1' }), doc) === 3600);
  ok('không levelId, có elevationMm → elevationMm', resolveElevation(hatch('e2', { elevationMm: 900 }), doc) === 900);
  ok('không gì cả → 0', resolveElevation(hatch('e3'), doc) === 0);
  ok('levelId THẮNG elevationMm khi có cả hai', resolveElevation(hatch('e4', { levelId: 'lv-2', elevationMm: 900 }), doc) === 7200);
  ok('levelId mồ côi → lùi về elevationMm', resolveElevation(hatch('e5', { levelId: 'lv-xoa-roi', elevationMm: 450 }), doc) === 450);
  ok('levelId mồ côi, không elevationMm → 0', resolveElevation(hatch('e6', { levelId: 'lv-xoa-roi' }), doc) === 0);
  // K3 — KHÔNG suy đoán lúc chạy: có nhãn storey trùng tên Level nhưng không levelId ⇒ vẫn 0.
  ok('có storey trùng tên Level nhưng KHÔNG levelId → 0 (không suy đoán lúc chạy)', resolveElevation(hatch('e7', { storey: 'Lầu 1' }), doc) === 0);
  ok('cao độ ÂM (tầng hầm) trả đúng số âm', resolveElevation(hatch('e8', { levelId: 'lv-h' }), docWithLevels([], [{ id: 'lv-h', name: 'Hầm', elevationMm: -3000, order: 0 }])) === -3000);
}

/* ── [3] VIỆC 2 — computeHeights, đủ 4 nguồn đáy × 4 nguồn đỉnh ── */
function testComputeHeights() {
  console.log('\n[3] computeHeights — đáy/đỉnh/chiều cao + nguồn');
  const doc = docWithLevels([]);

  const plain = computeHeights(hatch('a', { heightMm: 2700 }), doc);
  ok('đáy mặc định 0, đỉnh = heightMm', plain.baseMm === 0 && plain.topMm === 2700 && plain.heightMm === 2700);
  ok('nguồn: default / entity', plain.baseFrom === 'default' && plain.topFrom === 'entity');

  const onLevel = computeHeights(hatch('b', { levelId: 'lv-1', heightMm: 2700 }), doc);
  ok('gắn Level → đáy 3600, đỉnh 6300', onLevel.baseMm === 3600 && onLevel.topMm === 6300 && onLevel.heightMm === 2700);
  ok('nguồn: level / entity', onLevel.baseFrom === 'level' && onLevel.topFrom === 'entity');

  // Bệ cửa sổ 900 TRÊN tầng 1 — ca mà resolveElevation đơn thuần làm mất 900 (đã ghi cảnh báo
  // trong docstring); baseConstraint cộng đúng cả hai.
  const sill = computeHeights(hatch('c', { baseConstraint: { levelId: 'lv-1', offsetMm: 900 }, topConstraint: { heightMm: 1200 } }), doc);
  ok('baseConstraint = cao độ Level + offset (3600+900)', sill.baseMm === 4500);
  ok('topConstraint {heightMm} = đáy + h (4500+1200)', sill.topMm === 5700 && sill.heightMm === 1200);
  ok('nguồn: baseConstraint / topConstraintHeight', sill.baseFrom === 'baseConstraint' && sill.topFrom === 'topConstraintHeight');

  // "Up to level" — tường chạy hết thông tầng.
  const upTo = computeHeights(hatch('d', { baseConstraint: { levelId: 'lv-1', offsetMm: 0 }, topConstraint: { levelId: 'lv-2', offsetMm: -200 } }), doc);
  ok('topConstraint {levelId,offset} = 7200−200', upTo.topMm === 7000 && upTo.heightMm === 3400);
  ok('nguồn đỉnh: topConstraintLevel', upTo.topFrom === 'topConstraintLevel');

  ok('baseConstraint THẮNG levelId khi có cả hai', computeHeights(hatch('e', { levelId: 'lv-2', baseConstraint: { levelId: 'lv-1', offsetMm: 100 } }), doc).baseMm === 3700);
  ok('topConstraint THẮNG heightMm khi có cả hai', computeHeights(hatch('f', { heightMm: 2700, topConstraint: { heightMm: 1000 } }), doc).heightMm === 1000);

  const unknown = computeHeights(hatch('g', { levelId: 'lv-1' }), doc);
  ok('không heightMm, không topConstraint → topMm undefined (KHÔNG bịa 2700)', unknown.topMm === undefined && unknown.heightMm === undefined);
  ok('nguồn đỉnh: unknown', unknown.topFrom === 'unknown');

  ok('offset ÂM ở đáy (đài móng dưới cốt tầng)', computeHeights(hatch('h', { baseConstraint: { levelId: 'lv-gf', offsetMm: -450 } }), doc).baseMm === -450);
  ok('heightMm = 0 vẫn tính ra 0, không thành undefined', computeHeights(hatch('i', { heightMm: 0 }), doc).heightMm === 0);
}

/* ── [4] edge case: tham chiếu mồ côi + hình học lộn ngược (A8 "làm nó SAI thì bấm gì") ── */
function testBrokenRefs() {
  console.log('\n[4] tham chiếu Level mồ côi + đỉnh thấp hơn đáy');
  const doc = docWithLevels([]);

  const b1 = computeHeights(hatch('a', { baseConstraint: { levelId: 'lv-da-xoa', offsetMm: 900 }, heightMm: 2700 }), doc);
  ok('baseConstraint mồ côi → lùi về 0, KHÔNG sập', b1.baseMm === 0 && b1.baseFrom === 'default');
  ok('ghi đúng id mồ côi', b1.danglingLevelIds?.[0] === 'lv-da-xoa');
  ok('vẫn tính được đỉnh từ heightMm', b1.topMm === 2700);

  const b2 = computeHeights(hatch('b', { levelId: 'lv-da-xoa', elevationMm: 500, topConstraint: { levelId: 'cung-mo-coi', offsetMm: 0 }, heightMm: 2700 }), doc);
  ok('levelId mồ côi → lùi về elevationMm', b2.baseMm === 500 && b2.baseFrom === 'entity');
  ok('topConstraint mồ côi → lùi về heightMm', b2.topMm === 3200 && b2.topFrom === 'entity');
  ok('gom ĐỦ 2 id mồ côi', b2.danglingLevelIds?.length === 2);

  ok('dữ liệu lành → KHÔNG có field danglingLevelIds', computeHeights(hatch('c', { levelId: 'lv-1' }), doc).danglingLevelIds === undefined);

  // Đỉnh thấp hơn đáy: người dùng gán tầng ngược. Không kẹp, chỉ gắn cờ.
  const flip = computeHeights(hatch('d', { baseConstraint: { levelId: 'lv-2', offsetMm: 0 }, topConstraint: { levelId: 'lv-gf', offsetMm: 0 } }), doc);
  ok('đỉnh dưới đáy → heightMm ÂM, KHÔNG bị kẹp', flip.heightMm === -7200);
  ok('gắn cờ degenerate', flip.degenerate === true);
  ok('heightMm = 0 cũng là degenerate', computeHeights(hatch('e', { topConstraint: { heightMm: 0 } }), doc).degenerate === true);
  ok('chiều cao dương KHÔNG có cờ degenerate', computeHeights(hatch('f', { heightMm: 2700 }), doc).degenerate === undefined);
}

/* ── [5] NGHIỆM THU PHIẾU: đổi Level.elevationMm → 10 entity gắn vào đổi đúng ── */
function testLevelPropagation() {
  console.log('\n[5] NGHIỆM THU — đổi cao độ Level, 10 entity gắn vào đổi theo');
  const ents: Entity[] = [];
  for (let i = 0; i < 10; i++) {
    // 5 gắn thẳng levelId, 5 gắn qua baseConstraint có offset riêng — cả 2 đường đều phải đi theo.
    ents.push(i < 5
      ? hatch(`e${i}`, { levelId: 'lv-1', heightMm: 2700 })
      : hatch(`e${i}`, { baseConstraint: { levelId: 'lv-1', offsetMm: i * 100 }, topConstraint: { heightMm: 2400 } }));
  }
  // 1 entity KHÔNG gắn tầng — chứng minh nó ĐỨNG YÊN (không "lây" theo Level).
  ents.push(hatch('doc-lap', { elevationMm: 150, heightMm: 2700 }));

  const before = docWithLevels(ents);
  const b = ents.map((e) => computeHeights(e, before));
  ok('trước: 5 entity levelId ở cao độ 3600', b.slice(0, 5).every((r) => r.baseMm === 3600));
  ok('trước: 5 entity constraint ở 3600 + offset riêng', b.slice(5, 10).every((r, i) => r.baseMm === 3600 + (i + 5) * 100));

  // ĐỔI cao độ tầng: 3600 → 4200 (nâng 600).
  const after = docWithLevels(ents, [L_GF, { ...L1, elevationMm: 4200 }, L2]);
  const a = ents.map((e) => computeHeights(e, after));
  ok('sau: CẢ 10 entity gắn tầng nâng đúng +600', a.slice(0, 10).every((r, i) => r.baseMm === b[i].baseMm! + 600));
  ok('sau: chiều cao 10 entity GIỮ NGUYÊN (chỉ dịch, không co giãn)', a.slice(0, 10).every((r, i) => r.heightMm === b[i].heightMm));
  ok('sau: đỉnh 10 entity cũng nâng đúng +600', a.slice(0, 10).every((r, i) => r.topMm === b[i].topMm! + 600));
  ok('entity KHÔNG gắn tầng ĐỨNG YÊN ở 150', a[10].baseMm === 150 && b[10].baseMm === 150);
  ok('không sửa entity nào tại chỗ (Doc là nguồn duy nhất)', ents[0].heightMm === 2700 && ents[0].levelId === 'lv-1');
}

/* ── [6] TRUNG TÍNH — dữ liệu cũ ra đúng con số cũ (không đổi một pixel render nào) ── */
function testNeutralOnLegacy() {
  console.log('\n[6] TRUNG TÍNH — .idf cũ (không levelId/constraint) ra đúng hành vi cũ');
  const legacy = emptyDoc();
  legacy.entities.push(
    hatch('w1', { heightMm: 2700 }),
    hatch('w2', { heightMm: 3200, storey: 'GF' }),
    hatch('cut', { elevationMm: 900, heightMm: 1200 }), // cutter cửa sổ hosted (hosting.ts)
    hatch('w3'), // không cao độ gì — scene tự lấy mặc định
  );
  for (const e of legacy.entities) {
    const r = computeHeights(e, legacy);
    const oldBase = e.elevationMm ?? 0; // đúng công thức cad-to-obj.ts:480
    const oldTop = e.heightMm === undefined ? undefined : oldBase + e.heightMm;
    ok(`${e.id}: đáy khớp công thức cũ (${oldBase})`, r.baseMm === oldBase);
    ok(`${e.id}: đỉnh khớp công thức cũ (${String(oldTop)})`, r.topMm === oldTop);
  }
  ok('cutter cửa sổ: bệ 900 KHÔNG bị nuốt', computeHeights(legacy.entities[2], legacy).baseMm === 900);
}

/* ── [7] migration storey → Level (hàm thuần; đường .idf thật ở levels-idf-v2.test.ts) ── */
function testStoreyUpgrade() {
  console.log('\n[7] upgradeDocLevelsFromStorey — sinh Level từ nhãn storey');
  const doc = emptyDoc();
  doc.entities.push(
    hatch('a', { storey: 'GF' }),
    hatch('b', { storey: 'Lầu 1' }),
    hatch('c', { storey: 'GF' }),
    hatch('d'), // không nhãn
    hatch('e', { storey: '  ' }), // toàn khoảng trắng — không tính là tầng
  );
  const up = upgradeDocLevelsFromStorey(doc);
  ok('sinh ĐÚNG 2 Level (dedupe GF)', up.levels?.length === 2);
  ok('thứ tự = thứ tự xuất hiện đầu tiên', up.levels?.map((l) => l.name).join(',') === 'GF,Lầu 1');
  ok('order đánh 0,1', up.levels?.map((l) => l.order).join(',') === '0,1');
  ok('MỌI Level đều elevationMm = 0 (file v1 không mang cao độ)', up.levels?.every((l) => l.elevationMm === 0) === true);
  ok('MỌI Level đều gắn cờ inferred (K3 — nói thật là máy đoán)', up.levels?.every((l) => l.inferred === true) === true);
  ok('id bỏ dấu tiếng Việt, tất định', up.levels?.map((l) => l.id).join(',') === 'level-gf,level-lau-1');

  const byId = new Map(up.entities.map((e) => [e.id, e]));
  ok('2 entity cùng nhãn GF trỏ CÙNG 1 Level', byId.get('a')?.levelId === 'level-gf' && byId.get('c')?.levelId === 'level-gf');
  ok('entity nhãn khác trỏ Level khác', byId.get('b')?.levelId === 'level-lau-1');
  ok('entity không nhãn KHÔNG bị gán levelId', byId.get('d')?.levelId === undefined);
  ok('nhãn toàn khoảng trắng KHÔNG sinh Level/levelId', byId.get('e')?.levelId === undefined);
  ok('⛔ KHÔNG đụng storey — còn nguyên', byId.get('a')?.storey === 'GF' && byId.get('b')?.storey === 'Lầu 1');
  ok('cao độ sau migrate = 0 ⇒ render KHÔNG đổi', up.entities.every((e) => resolveElevation(e, up) === 0));

  // Không có nhãn nào ⇒ không sinh mảng levels rỗng cho có.
  const bare = emptyDoc();
  bare.entities.push(hatch('x'));
  ok('doc không nhãn storey nào → GIỮ NGUYÊN, levels vẫn undefined', upgradeDocLevelsFromStorey(bare) === bare);
  ok('doc rỗng hoàn toàn → giữ nguyên', upgradeDocLevelsFromStorey(emptyDoc()).levels === undefined);

  // Doc đã có levels (file lai/đã nâng) — không đè lên dữ liệu người dùng.
  const already: Doc = { ...emptyDoc(), entities: [hatch('y', { storey: 'GF' })], levels: [L1] };
  ok('doc ĐÃ CÓ levels → không đè', upgradeDocLevelsFromStorey(already) === already);

  // Trùng slug sau khi bỏ dấu ('Lầu 1' vs 'Lau 1') — id phải KHÁC nhau, không đè nhau.
  const clash = levelsFromStoreys(['Lầu 1', 'Lau 1', 'LAU-1']);
  ok('slug trùng → id tự tách (không đè)', new Set(clash.map((l) => l.id)).size === 3);
  ok('nhãn không có ký tự latin nào vẫn ra id hợp lệ', levelsFromStoreys(['⑦'])[0].id === 'level-x');
}

testLookup();
testResolveElevation();
testComputeHeights();
testBrokenRefs();
testLevelPropagation();
testNeutralOnLegacy();
testStoreyUpgrade();

console.log(`\nlevels.test.ts — ${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
