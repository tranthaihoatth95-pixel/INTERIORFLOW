/**
 * lib/cad/levels-idf-v2.test.ts — VIỆC 1d+1e: bump `IDF_VERSION` 1→2 + đường nâng cấp.
 * Chạy: node_modules/.bin/sucrase-node lib/cad/levels-idf-v2.test.ts
 *
 * ⚠️ ĐÂY LÀ ĐIỀU KIỆN SỐNG, không phải tuỳ chọn (phiếu ghi nguyên văn): **file .idf v1 phải đọc
 * được ở app v2**. Bản vẽ của studio là tài sản khách hàng — bump version mà làm hỏng đường đọc
 * file cũ là mất dữ liệu thật.
 *
 * File .idf v1 dưới đây dựng TAY đúng schema cũ (giống cách `zone.test.ts:93` làm), KHÔNG gọi
 * `exportIdf()` — vì `exportIdf` nay xuất v2, dùng nó thì test tự lừa mình.
 */
import { IDF_VERSION, exportIdf, importIdf, lastImportIdfError, migrateIdf } from './idf';
import { resolveElevation } from './levels';
import { emptyDoc } from './model';

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

/** File .idf v1 THẬT — schema trước khi có Level: entity chỉ có nhãn `storey`, doc không `levels`. */
function legacyV1Json(): string {
  const base = emptyDoc();
  const wall = base.layers[0].id;
  return JSON.stringify({
    idfVersion: 1,
    meta: { projectName: 'Hồ sơ cũ', createdAt: '2026-07-01T00:00:00Z', modifiedAt: '2026-07-02T00:00:00Z', appVersion: 'interiorflow-1.0.0' },
    sheets: [
      {
        id: 's0',
        name: 'Mặt bằng tầng trệt',
        doc: {
          entities: [
            { id: 'w1', type: 'hatch', layer: wall, points: [{ x: 0, y: 0 }, { x: 3000, y: 0 }, { x: 3000, y: 200 }], solid: true, storey: 'Tầng trệt', heightMm: 2700 },
            { id: 'w2', type: 'hatch', layer: wall, points: [{ x: 0, y: 0 }, { x: 3000, y: 0 }, { x: 3000, y: 200 }], solid: true, storey: 'Lầu 1', heightMm: 3200 },
            { id: 'w3', type: 'hatch', layer: wall, points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }], solid: true, storey: 'Tầng trệt' },
            { id: 'l1', type: 'line', layer: wall, a: { x: 0, y: 0 }, b: { x: 5000, y: 0 } }, // không nhãn tầng
          ],
          layers: base.layers,
          markups: [],
          photos: [],
          printScale: 50,
          paperKey: 'A3',
          studioName: 'Atelier Nord',
        },
      },
      { id: 's1', name: 'Mặt cắt', doc: { entities: [{ id: 'x1', type: 'line', layer: wall, a: { x: 0, y: 0 }, b: { x: 1, y: 0 } }], layers: base.layers } },
    ],
  });
}

/* ── [1] hằng số + file mới xuất ở v2 ── */
function testVersionConstant() {
  console.log('\n[1] IDF_VERSION đã bump lên 2');
  ok('IDF_VERSION === 2', (IDF_VERSION as number) === 2);
  ok('exportIdf xuất file ở idfVersion 2', JSON.parse(exportIdf([{ id: 's', name: 'n', doc: emptyDoc() }])).idfVersion === 2);
}

/* ── [2] ĐIỀU KIỆN SỐNG — .idf v1 mở được ở app v2, không mất gì ── */
function testV1OpensOnV2() {
  console.log('\n[2] ĐIỀU KIỆN SỐNG — file .idf v1 mở được ở app v2');
  const parsed = importIdf(legacyV1Json());
  ok('KHÔNG null — file v1 mở được', parsed !== null);
  if (!parsed) return;

  ok('lỗi cuối = null (không có cảnh báo giả)', lastImportIdfError() === null);
  ok('giữ ĐỦ 2 sheet', parsed.sheets.length === 2);
  ok('giữ đúng tên sheet', parsed.sheets[0].name === 'Mặt bằng tầng trệt');
  ok('meta giữ nguyên (không bị reset về mặc định)', parsed.meta.projectName === 'Hồ sơ cũ' && parsed.meta.createdAt === '2026-07-01T00:00:00Z');

  const d0 = parsed.sheets[0].doc;
  ok('giữ ĐỦ 4 entity, KHÔNG rơi rớt', d0.entities.length === 4);
  ok('giữ nguyên field cũ của Doc (printScale/paperKey/studioName)', d0.printScale === 50 && d0.paperKey === 'A3' && d0.studioName === 'Atelier Nord');
  ok('giữ nguyên hình học entity', (d0.entities[0] as { points: unknown[] }).points.length === 3);
  ok('giữ nguyên heightMm đã gõ tay', d0.entities[0].heightMm === 2700 && d0.entities[1].heightMm === 3200);

  // ⛔ storey KHÔNG bị đụng — DXF XDATA / cây đối tượng / nhóm BOQ vẫn đọc field này.
  ok('⛔ storey CÒN NGUYÊN trên cả 3 entity', d0.entities[0].storey === 'Tầng trệt' && d0.entities[1].storey === 'Lầu 1' && d0.entities[2].storey === 'Tầng trệt');
}

/* ── [3] Level sinh tự động đúng luật ── */
function testGeneratedLevels() {
  console.log('\n[3] Level sinh tự động từ nhãn storey');
  const parsed = importIdf(legacyV1Json());
  if (!parsed) { ok('parse được (tiền đề)', false); return; }
  const d0 = parsed.sheets[0].doc;

  ok('sinh ĐÚNG 2 Level (2 nhãn khác nhau)', d0.levels?.length === 2);
  ok('tên Level = đúng nhãn storey gốc', d0.levels?.map((l) => l.name).join(',') === 'Tầng trệt,Lầu 1');
  ok('MỌI Level elevationMm = 0 (file v1 không mang cao độ — KHÔNG bịa 3000/tầng)', d0.levels?.every((l) => l.elevationMm === 0) === true);
  ok('MỌI Level gắn cờ inferred (K3 — UI phải nói "máy đoán")', d0.levels?.every((l) => l.inferred === true) === true);

  const byId = new Map(d0.entities.map((e) => [e.id, e]));
  ok('2 entity cùng nhãn "Tầng trệt" trỏ CÙNG 1 levelId', byId.get('w1')!.levelId === byId.get('w3')!.levelId);
  ok('entity nhãn khác trỏ levelId khác', byId.get('w2')!.levelId !== byId.get('w1')!.levelId);
  ok('entity không nhãn KHÔNG bị gán levelId', byId.get('l1')!.levelId === undefined);
  ok('mọi levelId sinh ra đều tra được trong doc.levels', d0.entities.filter((e) => e.levelId).every((e) => d0.levels!.some((l) => l.id === e.levelId)));

  // Sheet 2 không entity nào có storey ⇒ KHÔNG sinh mảng levels rỗng cho có.
  ok('sheet không nhãn tầng nào → levels vẫn undefined', parsed.sheets[1].doc.levels === undefined);

  // RENDER KHÔNG ĐỔI: cao độ đáy mọi entity vẫn 0 y như trước khi có Level.
  ok('cao độ đáy mọi entity VẪN = 0 ⇒ dựng hình không đổi một pixel', d0.entities.every((e) => resolveElevation(e, d0) === 0));
}

/* ── [4] tất định — mở 2 lần ra cùng bộ id (levelId đã ghi ra file không mồ côi) ── */
function testDeterministic() {
  console.log('\n[4] TẤT ĐỊNH — mở cùng 1 file 2 lần ra cùng bộ id');
  const a = importIdf(legacyV1Json());
  const b = importIdf(legacyV1Json());
  ok('bộ Level id giống hệt nhau', JSON.stringify(a?.sheets[0].doc.levels) === JSON.stringify(b?.sheets[0].doc.levels));
  ok('levelId gán lên entity cũng giống hệt', JSON.stringify(a?.sheets[0].doc.entities.map((e) => e.levelId)) === JSON.stringify(b?.sheets[0].doc.entities.map((e) => e.levelId)));

  // Nâng v1 → xuất lại v2 → mở lại: idempotent, không nâng cấp chồng lên nhau.
  const once = importIdf(legacyV1Json())!;
  const twice = importIdf(exportIdf(once.sheets, once.meta))!;
  ok('export v2 rồi import lại — vẫn 2 Level, không nhân đôi', twice.sheets[0].doc.levels?.length === 2);
  ok('id không đổi qua vòng round-trip v2', JSON.stringify(twice.sheets[0].doc.levels) === JSON.stringify(once.sheets[0].doc.levels));
  ok('storey vẫn nguyên sau round-trip v2', twice.sheets[0].doc.entities[0].storey === 'Tầng trệt');
}

/* ── [5] biên: file hỏng/lai vẫn không sập, file mới hơn app vẫn từ chối rõ ràng ── */
function testEdges() {
  console.log('\n[5] biên — file hỏng/lai/quá mới');
  ok('sheets không phải mảng → null, không throw', importIdf(JSON.stringify({ idfVersion: 1, meta: {}, sheets: 'hỏng' })) === null);
  ok('sheet không phải object → bị bỏ, sheet tốt vẫn giữ', importIdf(JSON.stringify({ idfVersion: 1, meta: {}, sheets: [42, { id: 'ok', name: 'ok', doc: emptyDoc() }] }))?.sheets.length === 1);
  ok('doc không phải object → sheet bị bỏ (isValidDoc chặn)', importIdf(JSON.stringify({ idfVersion: 1, meta: {}, sheets: [{ id: 'a', name: 'a', doc: 5 }] })) === null);

  // File lai: đã khai v1 nhưng doc ĐÃ CÓ levels (ai đó sửa tay) — không đè lên dữ liệu người dùng.
  const hybrid = importIdf(JSON.stringify({
    idfVersion: 1,
    meta: {},
    sheets: [{ id: 'a', name: 'a', doc: { entities: [{ id: 'e', type: 'line', layer: 'l', a: { x: 0, y: 0 }, b: { x: 1, y: 0 }, storey: 'GF' }], layers: [], levels: [{ id: 'lv-tay', name: 'Khai tay', elevationMm: 3300, order: 0 }] } }],
  }));
  ok('doc v1 đã có levels khai tay → GIỮ NGUYÊN, không đè', hybrid?.sheets[0].doc.levels?.length === 1 && hybrid.sheets[0].doc.levels![0].elevationMm === 3300);
  ok('cũng KHÔNG tự gán levelId đè lên dữ liệu tay', hybrid?.sheets[0].doc.entities[0].levelId === undefined);

  ok('file v3 (mới hơn app v2) → null + lý do rõ', importIdf(JSON.stringify({ idfVersion: 3, sheets: [] })) === null && (lastImportIdfError() ?? '').includes('mới hơn'));
  ok('migrateIdf 1→2 giữ nguyên meta', (migrateIdf({ idfVersion: 1, meta: { projectName: 'X' }, sheets: [] }, 1, 2) as unknown as { meta: { projectName: string } })?.meta.projectName === 'X');
}

testVersionConstant();
testV1OpensOnV2();
testGeneratedLevels();
testDeterministic();
testEdges();

console.log(`\nlevels-idf-v2.test.ts — ${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
