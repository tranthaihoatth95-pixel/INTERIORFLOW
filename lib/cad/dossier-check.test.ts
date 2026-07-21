/**
 * lib/cad/dossier-check.test.ts — 21/07 quy trình CAD thực tế, BƯỚC 2 "check hồ sơ": kiểm
 * checkDossier() (hàm thuần) trên (a) doc trống, (b) mặt bằng có phòng kín + nhãn (sinh bằng
 * chính solver layoutToEntities — tái dùng, không dựng tay), (c) bổ sung cao độ/mặt cắt/DIM
 * thì checklist chuyển ✓. Chạy:
 *   node_modules/.bin/sucrase-node lib/cad/dossier-check.test.ts
 */
import { checkDossier } from './dossier-check';
import { layoutToEntities, parseDescription } from './ai-assist';
import { emptyDoc, type Doc, type Entity } from './model';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

function itemOf(doc: Doc, id: string) {
  return checkDossier(doc).items.find((i) => i.id === id);
}

/** Mặt bằng test: 1 phòng ngủ 4×3.5m khép kín + nhãn — sinh bằng solver thật. */
function planDoc(): Doc {
  const doc = emptyDoc();
  const r = layoutToEntities(parseDescription('phòng ngủ 4x3.5 có giường và tủ áo'), { x: 0, y: 0 }, 'l-wall', 'l-text', 'l-furniture', 110);
  doc.entities.push(...r.entities);
  return doc;
}

/* ═══ [1] doc trống — thiếu mặt bằng là 'missing', không đoán mò ═══ */
function testEmpty() {
  console.log('\n[1] doc trống');
  const res = checkDossier(emptyDoc());
  ok('plan-rooms = missing', res.items.find((i) => i.id === 'plan-rooms')?.status === 'missing');
  ok('canLayoutInSitu = false', res.canLayoutInSitu === false);
  ok('rooms rỗng', res.rooms.length === 0);
  ok('đủ 5 hạng mục checklist', res.items.length === 5);
}

/* ═══ [2] mặt bằng phòng kín + nhãn — plan/label ✓, cao độ/mặt cắt chỉ CẢNH BÁO (không chặn) ═══ */
function testPlan() {
  console.log('\n[2] mặt bằng 1 phòng ngủ khép kín có nhãn');
  const doc = planDoc();
  const res = checkDossier(doc);
  ok('plan-rooms = ok', res.items.find((i) => i.id === 'plan-rooms')?.status === 'ok');
  ok('room-labels = ok', res.items.find((i) => i.id === 'room-labels')?.status === 'ok');
  ok('dims = warn (chưa có DIM — không chặn)', res.items.find((i) => i.id === 'dims')?.status === 'warn');
  ok('elevation = warn (mặt bằng thường không có — không chặn)', res.items.find((i) => i.id === 'elevation')?.status === 'warn');
  ok('section = warn (mặt bằng thường không có — không chặn)', res.items.find((i) => i.id === 'section')?.status === 'warn');
  ok('canLayoutInSitu = true', res.canLayoutInSitu === true);
  ok('rooms[0].name = PHÒNG NGỦ', res.rooms[0]?.name === 'PHÒNG NGỦ');
  const it = res.rooms[0]?.interior;
  ok('interior nằm TRONG lòng phòng 4000×3500 (trừ tường)', !!it && it.ix0 > 0 && it.iy0 > 0 && it.ix1 < 4000 && it.iy1 < 3500);
  ok('interior rộng ≈ 3890mm (4000 − tường 110)', !!it && Math.abs((it.ix1 - it.ix0) - 3890) < 5);
}

/* ═══ [3] bổ sung cao độ / mặt cắt / DIM → hạng mục chuyển ✓ ═══ */
function testEnriched() {
  console.log('\n[3] bổ sung cao độ + mặt cắt + DIM');
  const doc = planDoc();
  const extra: Entity[] = [
    { id: 't-elev', type: 'text', layer: 'l-text', at: { x: 500, y: 5000 }, text: '±0.000', h: 150 },
    { id: 't-sec', type: 'text', layer: 'l-text', at: { x: 500, y: 5500 }, text: 'MẶT CẮT A-A', h: 150 },
    { id: 'd-1', type: 'dim', layer: 'l-dim', a: { x: 0, y: 0 }, b: { x: 4000, y: 0 }, off: -600 },
  ];
  doc.entities.push(...extra);
  ok('elevation = ok (±0.000)', itemOf(doc, 'elevation')?.status === 'ok');
  ok('section = ok (MẶT CẮT A-A)', itemOf(doc, 'section')?.status === 'ok');
  ok('dims = ok', itemOf(doc, 'dims')?.status === 'ok');
  // các dạng cao độ khác
  const d2 = planDoc();
  d2.entities.push({ id: 't2', type: 'text', layer: 'l-text', at: { x: 0, y: 6000 }, text: 'CĐ +3.600', h: 150 });
  ok('elevation = ok (CĐ +3.600)', itemOf(d2, 'elevation')?.status === 'ok');
  const d3 = planDoc();
  d3.entities.push({ id: 't3', type: 'text', layer: 'l-text', at: { x: 0, y: 6000 }, text: 'A-A', h: 150 });
  ok('section = ok (text "A-A" đứng riêng)', itemOf(d3, 'section')?.status === 'ok');
  // text thường KHÔNG bị nhận nhầm cao độ/mặt cắt
  const d4 = planDoc();
  d4.entities.push({ id: 't4', type: 'text', layer: 'l-text', at: { x: 0, y: 6000 }, text: 'GHI CHÚ VẬT LIỆU SÀN GỖ', h: 150 });
  ok('text thường không nhận nhầm cao độ', itemOf(d4, 'elevation')?.status === 'warn');
  ok('text thường không nhận nhầm mặt cắt', itemOf(d4, 'section')?.status === 'warn');
}

testEmpty();
testPlan();
testEnriched();

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
