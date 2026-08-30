/**
 * lib/cad/sheet-migrate.test.ts — NC-13 BƯỚC 2: test bộ chuyển `mergeIdfSheetsToDoc`.
 * Chạy: node_modules/.bin/sucrase-node lib/cad/sheet-migrate.test.ts
 */
import { emptyDoc, entityBox, type Doc, type Entity } from './model';
import { mergeIdfSheetsToDoc } from './sheet-migrate';
import { exportIdf, importIdf, type IdfSheetData } from './idf';
import { newId } from './id';

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

function lineDoc(id: string, x0: number, y0: number, x1: number, y1: number, extraLayer?: string): Doc {
  const doc = emptyDoc();
  if (extraLayer) doc.layers.push({ id: extraLayer, name: extraLayer, color: '#123456', visible: true, locked: false });
  doc.entities.push({ id, type: 'line', layer: doc.layers[0].id, a: { x: x0, y: y0 }, b: { x: x1, y: y1 } });
  return doc;
}

function entitiesOfPrefix(doc: Doc, prefix: string): Entity[] {
  return doc.entities.filter((e) => e.id.startsWith(`${prefix}-`));
}

/* ── 1) không rơi rớt entity ── */
function testNoDataLoss() {
  console.log('\n[1] Gộp giữ đủ số entity, không rơi rớt');
  const sheetA: IdfSheetData = { id: 'sheet-a', name: 'A', doc: emptyDoc() };
  sheetA.doc.entities.push(
    { id: newId('e'), type: 'line', layer: sheetA.doc.layers[0].id, a: { x: 0, y: 0 }, b: { x: 1000, y: 0 } },
    { id: newId('e'), type: 'rect', layer: sheetA.doc.layers[0].id, x: 0, y: 0, w: 500, h: 500 },
    { id: newId('e'), type: 'block', layer: sheetA.doc.layers[1].id, block: 'sofa', at: { x: 200, y: 200 }, rot: 0, sx: 1, sy: 1 },
  );
  const sheetB: IdfSheetData = { id: 'sheet-b', name: 'B', doc: emptyDoc() };
  sheetB.doc.entities.push(
    { id: newId('e'), type: 'line', layer: sheetB.doc.layers[0].id, a: { x: 0, y: 0 }, b: { x: 2000, y: 0 } },
    { id: newId('e'), type: 'circle', layer: sheetB.doc.layers[0].id, c: { x: 100, y: 100 }, r: 50 },
  );
  const { doc } = mergeIdfSheetsToDoc([sheetA, sheetB]);
  ok('tổng entity = 3+2 = 5', doc.entities.length === 5);
}

/* ── 2) dịch offset để không chồng nhau ── */
function testNoOverlap() {
  console.log('\n[2] Dịch offset để 2 sheet cùng toạ độ gốc không còn chồng nhau');
  const sheetA: IdfSheetData = { id: 'a', name: 'A', doc: lineDoc(newId('e'), 0, 0, 1000, 1000) };
  const sheetB: IdfSheetData = { id: 'b', name: 'B', doc: lineDoc(newId('e'), 0, 0, 1000, 1000) };
  const { doc } = mergeIdfSheetsToDoc([sheetA, sheetB]);
  const boxA = entityBox(entitiesOfPrefix(doc, 's0')[0]);
  const boxB = entityBox(entitiesOfPrefix(doc, 's1')[0]);
  ok('sheet 0 neo đáy tại y=0 (minY=0)', boxA.minY === 0);
  ok('sheet 1 nằm hẳn bên PHẢI sheet 0, không giao nhau', boxB.minX >= boxA.maxX);
  ok('khoảng cách đúng SHEET_GAP_MM (2000)', boxB.minX - boxA.maxX === 2000);
}

/* ── 3) id trùng ở 2 sheet gốc vẫn tách biệt sau khi gộp ── */
function testIdCollision() {
  console.log('\n[3] Id entity trùng nhau ở 2 sheet gốc (mô phỏng 2 phiên tạo độc lập) — không đè nhau');
  const dupId = 'e-1-abcd';
  const sheetA: IdfSheetData = { id: 'a', name: 'A', doc: lineDoc(dupId, 0, 0, 100, 0) };
  const sheetB: IdfSheetData = { id: 'b', name: 'B', doc: lineDoc(dupId, 0, 0, 100, 0) };
  const { doc } = mergeIdfSheetsToDoc([sheetA, sheetB]);
  const ids = doc.entities.map((e) => e.id);
  ok('còn đủ 2 entity (không cái nào bị ghi đè)', ids.length === 2);
  ok('2 id khác nhau sau khi gộp', ids[0] !== ids[1]);
  ok('id mới mang tiền tố theo sheet (s0-.../s1-...)', ids[0] === `s0-${dupId}` && ids[1] === `s1-${dupId}`);
}

/* ── 4) BuildOp.withRef (NC-12 boolean) được ánh xạ lại đúng ── */
function testOpsWithRefRemap() {
  console.log('\n[4] ops[].withRef ánh xạ lại theo đúng bảng đổi tên của sheet đó');
  const doc = emptyDoc();
  const wallId = newId('e');
  const cutterId = newId('e');
  doc.entities.push(
    { id: wallId, type: 'hatch', layer: doc.layers[0].id, points: [{ x: 0, y: 0 }, { x: 1000, y: 0 }, { x: 1000, y: 200 }, { x: 0, y: 200 }], solid: true, ops: [{ op: 'boolean', kind: 'subtract', withRef: cutterId }] },
    { id: cutterId, type: 'rect', layer: doc.layers[0].id, x: 400, y: 0, w: 200, h: 200 },
  );
  const sheetA: IdfSheetData = { id: 'a', name: 'A', doc };
  const { doc: merged } = mergeIdfSheetsToDoc([sheetA]);
  const wallBack = merged.entities.find((e) => e.id === `s0-${wallId}`);
  const cutterBack = merged.entities.find((e) => e.id === `s0-${cutterId}`);
  ok('tường + cutter đều còn trong Doc gộp', !!wallBack && !!cutterBack);
  ok('withRef trỏ đúng sang id MỚI của cutter (không còn id cũ)', !!wallBack?.ops && wallBack.ops[0].op === 'boolean' && (wallBack.ops[0] as { withRef: string }).withRef === cutterBack!.id);
}

/* ── 5) layer trùng id (mặc định) gộp làm một, layer riêng vẫn giữ ── */
function testLayerDedup() {
  console.log('\n[5] Layer mặc định trùng id giữa các sheet gộp làm 1; layer riêng của từng sheet vẫn giữ đủ');
  const sheetA: IdfSheetData = { id: 'a', name: 'A', doc: lineDoc(newId('e'), 0, 0, 100, 0, 'custom-a') };
  const sheetB: IdfSheetData = { id: 'b', name: 'B', doc: lineDoc(newId('e'), 0, 0, 100, 0, 'custom-b') };
  const { doc } = mergeIdfSheetsToDoc([sheetA, sheetB]);
  // 5 layer mặc định (chung id, gộp còn 1 bộ) + 2 layer riêng (custom-a, custom-b) = 7.
  ok('layer = 5 mặc định (gộp) + 2 riêng = 7', doc.layers.length === 7);
  ok('không có 2 layer trùng id', new Set(doc.layers.map((l) => l.id)).size === doc.layers.length);
}

/* ── 6) Sheet/Viewport2D sinh đúng theo BƯỚC 2 ── */
function testSheetShape() {
  console.log('\n[6] Sinh đúng 1 Sheet + 1 Viewport2D, tỉ lệ mặc định 1:100');
  const sheetA: IdfSheetData = { id: 'a', name: 'A', doc: lineDoc(newId('e'), 0, 0, 1000, 1000) };
  const { sheet } = mergeIdfSheetsToDoc([sheetA]);
  ok('đúng 1 viewport', sheet.viewports.length === 1);
  ok('tỉ lệ mặc định 100 (1:100)', sheet.viewports[0].scale === 100);
  ok('viewport không khoá mặc định', sheet.viewports[0].locked === false);
  ok('khổ giấy mặc định A3', sheet.paper === 'A3');
  ok('titleBlock có đủ 4 field (rỗng, không thiếu key)', 'project' in sheet.titleBlock && 'drawnBy' in sheet.titleBlock && 'date' in sheet.titleBlock && 'revision' in sheet.titleBlock);
}

/* ── 7) sheet rỗng xen giữa — không crash, không mất dữ liệu 2 sheet còn lại ── */
function testEmptySheetInBetween() {
  console.log('\n[7] Sheet rỗng (0 entity) xen giữa — không crash, 2 sheet có nội dung vẫn đủ');
  const sheetA: IdfSheetData = { id: 'a', name: 'A', doc: lineDoc(newId('e'), 0, 0, 100, 0) };
  const sheetEmpty: IdfSheetData = { id: 'e', name: 'Empty', doc: emptyDoc() };
  const sheetC: IdfSheetData = { id: 'c', name: 'C', doc: lineDoc(newId('e'), 0, 0, 100, 0) };
  let threw = false;
  let doc: Doc | null = null;
  try {
    doc = mergeIdfSheetsToDoc([sheetA, sheetEmpty, sheetC]).doc;
  } catch {
    threw = true;
  }
  ok('không ném lỗi', !threw);
  ok('vẫn đủ 2 entity (sheet rỗng không đóng góp, không phá 2 sheet kia)', doc !== null && doc.entities.length === 2);
}

/* ── 8) đầu-cuối: .idf CŨ vẫn đọc được nguyên vẹn, rồi mới đưa qua bộ chuyển ── */
function testOldIdfStillReadable() {
  console.log('\n[8] File .idf CŨ (định dạng sheets[].doc) vẫn đọc được — KHÔNG vỡ — rồi mới chuyển sang Doc gộp');
  const sheetA: IdfSheetData = { id: 'sheet-a', name: 'Mặt bằng tầng 1', doc: lineDoc(newId('e'), 0, 0, 3000, 0) };
  const sheetB: IdfSheetData = { id: 'sheet-b', name: 'Mặt bằng tầng 2', doc: lineDoc(newId('e'), 0, 0, 4000, 0) };
  const json = exportIdf([sheetA, sheetB], { projectName: 'Dự án test NC-13' });
  const parsed = importIdf(json);
  ok('importIdf() vẫn đọc được file cũ (không sửa idf.ts)', parsed !== null);
  ok('đủ 2 sheet như lúc xuất', parsed?.sheets.length === 2);
  if (!parsed) return;
  const { doc, sheet } = mergeIdfSheetsToDoc(parsed.sheets, { sheetName: parsed.meta.projectName });
  ok('bộ chuyển ăn thẳng output của importIdf(), ra đủ 2 entity', doc.entities.length === 2);
  ok('Sheet mới lấy tên theo project', sheet.name === 'Dự án test NC-13');
}

/* ── 9) VIỆC 1+3 (05/08) — gộp KHÔNG được bỏ rơi `levels`/`wallTypes` (nếu bỏ ⇒ levelId mồ côi) ── */
function testLevelsAndWallTypesSurviveMerge() {
  console.log('\n[9] Gộp giữ được Doc.levels/Doc.wallTypes — levelId/typeId KHÔNG thành mồ côi');
  const mk = (eid: string, levelId?: string, typeId?: string): Doc => {
    const d = lineDoc(eid, 0, 0, 3000, 0);
    d.entities = d.entities.map((e) => ({ ...e, ...(levelId ? { levelId } : {}), ...(typeId ? { typeId } : {}) }));
    return d;
  };

  const a = mk('ea', 'level-tret', 'wt-100');
  a.levels = [{ id: 'level-tret', name: 'Trệt', elevationMm: 0, order: 0, inferred: true }];
  a.wallTypes = [{ id: 'wt-100', name: 'Gạch 100', thicknessMm: 100, kind: 'interior' }];

  const b = mk('eb', 'level-lau1', 'wt-220');
  // Tờ 2 lặp lại tầng Trệt (cùng id — cùng một tầng thật) + thêm Lầu 1. Cả hai đều đánh order từ 0.
  b.levels = [
    { id: 'level-tret', name: 'Trệt', elevationMm: 0, order: 0, inferred: true },
    { id: 'level-lau1', name: 'Lầu 1', elevationMm: 3600, order: 1 },
  ];
  b.wallTypes = [{ id: 'wt-220', name: 'Bao che 220', thicknessMm: 220, kind: 'exterior' }];

  const { doc } = mergeIdfSheetsToDoc([
    { id: 's-a', name: 'A', doc: a },
    { id: 's-b', name: 'B', doc: b },
  ]);

  ok('levels được mang sang Doc gộp', !!doc.levels?.length);
  ok('dedupe theo id — 2 tầng, không phải 3', doc.levels?.length === 2);
  ok('giữ đúng cao độ thật, không bịa lại', doc.levels?.find((l) => l.id === 'level-lau1')?.elevationMm === 3600);
  ok('giữ cờ inferred', doc.levels?.find((l) => l.id === 'level-tret')?.inferred === true);
  ok('order đánh lại 0..n-1, không đụng số', doc.levels?.map((l) => l.order).join(',') === '0,1');

  ok('wallTypes được mang sang, dedupe theo id', doc.wallTypes?.length === 2);
  ok('giữ đúng bề dày type', doc.wallTypes?.find((t) => t.id === 'wt-220')?.thicknessMm === 220);

  // Điểm cốt lõi: MỌI levelId/typeId trên entity sau khi gộp vẫn TRA ĐƯỢC.
  const withLevel = doc.entities.filter((e) => e.levelId);
  ok('cả 2 entity giữ levelId (không bị prefix như id entity)', withLevel.length === 2);
  ok('MỌI levelId tra được trong doc.levels — KHÔNG mồ côi', withLevel.every((e) => doc.levels!.some((l) => l.id === e.levelId)));
  ok('MỌI typeId tra được trong doc.wallTypes — KHÔNG mồ côi', doc.entities.filter((e) => e.typeId).every((e) => doc.wallTypes!.some((t) => t.id === e.typeId)));

  // Doc cũ (không levels/wallTypes) — KHÔNG sinh mảng rỗng cho có.
  const plain = mergeIdfSheetsToDoc([{ id: 's', name: 's', doc: lineDoc('e0', 0, 0, 1000, 0) }]);
  ok('sheet không có levels → Doc gộp không mọc field levels', plain.doc.levels === undefined);
  ok('sheet không có wallTypes → Doc gộp không mọc field wallTypes', plain.doc.wallTypes === undefined);
}

testNoDataLoss();
testNoOverlap();
testIdCollision();
testOpsWithRefRemap();
testLayerDedup();
testSheetShape();
testEmptySheetInBetween();
testOldIdfStillReadable();
testLevelsAndWallTypesSurviveMerge();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
