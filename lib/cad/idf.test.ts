/**
 * lib/cad/idf.test.ts — round-trip exportIdf/importIdf (Sprint 7 Việc 2), theo pattern
 * lib/cad/dxf.roundtrip.test.ts. Chạy: node_modules/.bin/sucrase-node lib/cad/idf.test.ts
 */
import { exportIdf, importIdf, IDF_VERSION, migrateIdf, lastImportIdfError, __setCurrentIdfVersionForTest } from './idf';
import type { IdfSheetData } from './idf';
import { emptyDoc } from './model';
import type { Doc } from './model';
import { newId } from './store';
import { createMarkupPin, createPhotoEmbed } from './markup';

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

function buildDoc(seedX: number): Doc {
  const doc = emptyDoc();
  const wall = doc.layers[0].id;
  doc.entities.push(
    { id: newId('e'), type: 'line', layer: wall, a: { x: seedX, y: 0 }, b: { x: seedX + 3000, y: 0 } },
    { id: newId('e'), type: 'rect', layer: wall, x: seedX, y: 0, w: 4000, h: 3000 },
    { id: newId('e'), type: 'text', layer: doc.layers[3].id, at: { x: seedX, y: 100 }, text: 'PHONG NGU', h: 250 },
  );
  doc.markups = [createMarkupPin({ x: seedX + 500, y: 500 }, 'KH muốn đổi màu sàn', '#e0603a', 1700000000000)];
  doc.photos = [createPhotoEmbed({ x: seedX + 1000, y: 1000 }, 'data:image/png;base64,iVBORw0KGgo=', 'hiện trạng', 1700000001000)];
  return doc;
}

/* ── 1) round-trip 1 sheet: entities/layers/markups/photos đầy đủ ── */
function testSingleSheetRoundtrip() {
  console.log('\n[1] 1 sheet — round-trip entities/layers/markups/photos 1:1');
  const doc = buildDoc(0);
  const sheets: IdfSheetData[] = [{ id: 'cadsheet-0', name: 'Bản vẽ 1', doc }];
  const json = exportIdf(sheets, { projectName: 'Căn hộ demo' });

  ok('JSON hợp lệ (parse không lỗi)', (() => { try { JSON.parse(json); return true; } catch { return false; } })());
  ok('có field idfVersion đúng', JSON.parse(json).idfVersion === IDF_VERSION);

  const parsed = importIdf(json);
  ok('import thành công (không null)', parsed !== null);
  if (!parsed) return;
  ok('meta.projectName giữ đúng', parsed.meta.projectName === 'Căn hộ demo');
  ok('đúng 1 sheet', parsed.sheets.length === 1);
  const back = parsed.sheets[0];
  ok('sheet id/name giữ nguyên', back.id === 'cadsheet-0' && back.name === 'Bản vẽ 1');
  ok('đúng 3 entity', back.doc.entities.length === 3);
  ok('đúng 5 layer mặc định', back.doc.layers.length === 5);

  const line = back.doc.entities.find((e) => e.type === 'line');
  ok('LINE toạ độ đúng', !!line && line.type === 'line' && line.a.x === 0 && line.b.x === 3000);
  const rect = back.doc.entities.find((e) => e.type === 'rect');
  ok('RECT kích thước đúng', !!rect && rect.type === 'rect' && rect.w === 4000 && rect.h === 3000);
  const txt = back.doc.entities.find((e) => e.type === 'text');
  ok('TEXT nội dung đúng', !!txt && txt.type === 'text' && txt.text === 'PHONG NGU');

  ok('markups round-trip đúng 1 ghim', (back.doc.markups?.length ?? 0) === 1);
  ok('markup text/color/ts đúng', back.doc.markups?.[0]?.text === 'KH muốn đổi màu sàn' && back.doc.markups?.[0]?.color === '#e0603a' && back.doc.markups?.[0]?.ts === 1700000000000);
  ok('photos round-trip đúng 1 ảnh', (back.doc.photos?.length ?? 0) === 1);
  ok('photo src/caption đúng', back.doc.photos?.[0]?.src === 'data:image/png;base64,iVBORw0KGgo=' && back.doc.photos?.[0]?.caption === 'hiện trạng');
}

/* ── 2) round-trip NHIỀU sheet (project thật có ≥2 bản vẽ) ── */
function testMultiSheetRoundtrip() {
  console.log('\n[2] Nhiều sheet — round-trip TẤT CẢ sheet trong project, không lẫn dữ liệu');
  const sheets: IdfSheetData[] = [
    { id: 'cadsheet-0', name: 'Tầng 1', doc: buildDoc(0) },
    { id: 'cadsheet-1', name: 'Tầng 2', doc: buildDoc(10000) },
    { id: 'cadsheet-2', name: 'Tầng 3', doc: buildDoc(20000) },
  ];
  const json = exportIdf(sheets);
  const parsed = importIdf(json);
  ok('import thành công', parsed !== null);
  if (!parsed) return;
  ok('đúng 3 sheet, đúng thứ tự', parsed.sheets.map((s) => s.name).join(',') === 'Tầng 1,Tầng 2,Tầng 3');
  const t2 = parsed.sheets.find((s) => s.id === 'cadsheet-1')!;
  const line2 = t2.doc.entities.find((e) => e.type === 'line');
  ok('sheet "Tầng 2" giữ đúng toạ độ riêng (seedX=10000, không lẫn Tầng 1/3)', !!line2 && line2.type === 'line' && line2.a.x === 10000);
}

/* ── 3) xoá entity RỒI import lại — mô phỏng đúng kịch bản verify UI của brief ── */
function testDeleteThenReimport() {
  console.log('\n[3] Xoá entity trong bản vẽ rồi mở lại .idf đã xuất TRƯỚC đó → khôi phục đúng bản gốc');
  const original = buildDoc(0);
  const json = exportIdf([{ id: 'cadsheet-0', name: 'Bản vẽ 1', doc: original }]);

  // mô phỏng user xoá bớt entity trên canvas SAU khi đã export — .idf export KHÔNG bị ảnh hưởng
  // (chuỗi json bất biến), import lại phải cho đúng dữ liệu GỐC lúc export, không phải bản đã xoá.
  const mutatedInMemory: Doc = { ...original, entities: original.entities.slice(0, 1) };
  ok('(sanity) bản trong bộ nhớ đã bị xoá còn 1 entity', mutatedInMemory.entities.length === 1);

  const parsed = importIdf(json);
  ok('import lại từ .idf khôi phục đủ 3 entity gốc (không phải bản đã xoá)', parsed?.sheets[0]?.doc.entities.length === 3);
}

/* ── 4) file hỏng/sai định dạng → null, KHÔNG throw ── */
function testInvalidInput() {
  console.log('\n[4] File hỏng/sai định dạng → importIdf trả null, không throw crash app');
  let threw = false;
  let r1: unknown;
  try {
    r1 = importIdf('{ khong phai json hop le');
  } catch {
    threw = true;
  }
  ok('JSON hỏng: không throw', !threw);
  ok('JSON hỏng: trả null', r1 === null);

  ok('thiếu idfVersion → null', importIdf(JSON.stringify({ sheets: [] })) === null);
  ok('idfVersion sai số → null', importIdf(JSON.stringify({ idfVersion: 99, sheets: [] })) === null);
  ok('sheets rỗng → null', importIdf(JSON.stringify({ idfVersion: 1, sheets: [] })) === null);
  ok('không phải object (số/null) → null', importIdf('42') === null && importIdf('null') === null);

  // 1 sheet hỏng (doc thiếu layers) lẫn với 1 sheet tốt → giữ sheet tốt, bỏ sheet hỏng, không crash
  const mixed = JSON.stringify({
    idfVersion: 1,
    meta: {},
    sheets: [
      { id: 's-bad', name: 'Hỏng', doc: { entities: [] } }, // thiếu layers
      { id: 's-good', name: 'Tốt', doc: emptyDoc() },
    ],
  });
  const parsedMixed = importIdf(mixed);
  ok('sheet hỏng bị bỏ qua, sheet tốt vẫn giữ (best-effort, không crash)', parsedMixed !== null && parsedMixed.sheets.length === 1 && parsedMixed.sheets[0].id === 's-good');
}

/* ── 5) meta mặc định khi không truyền ── */
function testDefaultMeta() {
  console.log('\n[5] meta mặc định — projectName/appVersion/createdAt/modifiedAt luôn có giá trị hợp lệ');
  const json = exportIdf([{ id: 'x', name: 'y', doc: emptyDoc() }]);
  const parsed = importIdf(json);
  ok('projectName mặc định không rỗng', !!parsed?.meta.projectName);
  ok('appVersion mặc định không rỗng', !!parsed?.meta.appVersion);
  ok('createdAt là ISO string hợp lệ', !!parsed && !Number.isNaN(new Date(parsed.meta.createdAt).getTime()));
  ok('modifiedAt là ISO string hợp lệ', !!parsed && !Number.isNaN(new Date(parsed.meta.modifiedAt).getTime()));
}

/* ── 6) T3 migration path (VIỆC 4, 28/07) — file .idf cũ vẫn mở được sau khi app bump version ── */
function testMigrationPath() {
  console.log('\n[6] Migration path — file idfVersion cũ vẫn parse được khi app "bump" version (giả lập, không đổi hằng số thật)');

  // migrateIdf thô — kiểm dispatcher độc lập với importIdf.
  // 05/08 — bậc 1→2 KHÔNG còn là khung identity: nay sinh Doc.levels từ nhãn storey (VIỆC 1).
  // Ruột phép nâng có test riêng đầy đủ ở `levels-idf-v2.test.ts`; ở đây chỉ kiểm DISPATCHER.
  const up = migrateIdf({ idfVersion: 1, meta: {}, sheets: [] }, 1, 2);
  ok('migrateIdf nâng 1→2 thành công (dispatcher)', up !== null && (up as unknown as { idfVersion: number }).idfVersion === 2);

  ok('migrateIdf: fromVersion CAO HƠN toVersion → null (không "hạ cấp")', migrateIdf({ idfVersion: 3 }, 3, 1) === null);
  ok('migrateIdf: đứt gãy giữa đường (thiếu bậc nâng) → null', migrateIdf({ idfVersion: 5 }, 5, 7) === null);
  ok('migrateIdf: không phải object → null', migrateIdf('not-an-object', 1, 2) === null);

  // importIdf thật — GIẢ LẬP app ở version CAO HƠN version file, để kiểm đường nâng cấp chạy thật.
  // ⚠️ 05/08: trước đây chỗ này `exportIdf()` rồi giả lập app ở v2 — nhưng từ khi IDF_VERSION bump
  // lên 2, file export RA ĐÃ LÀ v2 nên không còn bậc nào phải nâng, test tự lừa mình (vẫn xanh mà
  // không kiểm gì). Nay dựng file ở ĐÚNG version thật hiện tại rồi giả lập app ở version+1.
  const doc = buildDoc(0);
  const json = exportIdf([{ id: 'cadsheet-0', name: 'Bản vẽ cũ', doc }]);
  ok('(sanity) file export ở đúng IDF_VERSION thật', JSON.parse(json).idfVersion === IDF_VERSION);

  __setCurrentIdfVersionForTest(IDF_VERSION + 1);
  try {
    const parsed = importIdf(json);
    // Bậc nâng IDF_VERSION→IDF_VERSION+1 CHƯA VIẾT (chưa có v3) ⇒ đứt gãy ⇒ null + lý do rõ.
    // Đây chính là hành vi phải có: không im lặng nuốt file, không "nâng bừa".
    ok('thiếu bậc nâng cho version tiếp theo → null (không nâng bừa)', parsed === null);
    ok('… và có lý do cụ thể, không im lặng', (lastImportIdfError() ?? '').includes('Không nâng cấp được'));
  } finally {
    __setCurrentIdfVersionForTest(IDF_VERSION); // reset — KHÔNG để rò sang test khác
  }

  // Đường nâng THẬT đang có (v1 → v2) — file v1 dựng tay, phải mở được ở app v2 hiện tại.
  // (Nghiệm thu đầy đủ VIỆC 1e nằm ở `lib/cad/levels-idf-v2.test.ts`.)
  const v1File = JSON.stringify({ idfVersion: 1, meta: {}, sheets: [{ id: 's0', name: 'Cũ', doc }] });
  const upgraded = importIdf(v1File);
  ok('file idfVersion=1 VẪN MỞ ĐƯỢC ở app v2 (điều kiện SỐNG)', upgraded !== null);
  ok('dữ liệu sheet giữ nguyên sau khi migrate', upgraded?.sheets[0]?.doc.entities.length === 3);

  // File CAO HƠN version app (99 > IDF_VERSION thật) — vẫn `null` (không có đường hạ cấp), nhưng
  // KHÔNG còn im lặng: lastImportIdfError() phải có lý do cụ thể, không phải câu chung chung.
  const tooNew = importIdf(JSON.stringify({ idfVersion: 99, sheets: [] }));
  ok('file version CAO HƠN app → vẫn null', tooNew === null);
  ok('nhưng KHÔNG còn im lặng — lastImportIdfError() có lý do cụ thể', (lastImportIdfError() ?? '').includes('mới hơn'));
}

testSingleSheetRoundtrip();
testMultiSheetRoundtrip();
testDeleteThenReimport();
testInvalidInput();
testDefaultMeta();
testMigrationPath();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
