/**
 * lib/cad/cad-core-b1.test.ts — B1 (24/07) củng cố logic lõi chặng CAD:
 *  [1] Tỉ lệ chuẩn: suggestStandardScale / fixedScaleViewport / docScaleLabel / fitsAtScale.
 *  [2] Khung tên TTT: titleBlockTTT — kích thước theo khổ giấy × N, tiền tố "Tỷ lệ " giữ nguyên
 *      (applyRealScaleToTitleBlock của pdf.ts vẫn ghi đè được), đủ trường song ngữ.
 *  [3] Nền IFC: DXF round-trip storey/elementType qua XDATA (+ APPID), file cũ không XDATA vẫn
 *      parse với field undefined; .idf round-trip printScale/paperKey.
 *  [4] AI Brief: placedCount/requestedCount đo thật; obstacles trong TargetRoom được solver né.
 *  [5] Store: undo giữ nguyên printScale/paperKey (clone spread ...d).
 *
 * Chạy: node_modules/.bin/sucrase-node lib/cad/cad-core-b1.test.ts
 */

import {
  emptyDoc, docBox, suggestStandardScale, fixedScaleViewport, docScaleLabel, fitsAtScale,
  fitScaleLabel, PAPER_SIZES_MM, docPaperMm,
} from './model';
import type { Doc, Entity, TextEntity } from './model';
import { newId, useCadStore } from './store';
import { titleBlockTTT } from './commands';
import { applyRealScaleToTitleBlock } from './pdf';
import { exportDxf, parseDxf } from './dxf';
import { exportIdf, importIdf } from './idf';
import { generateLayoutOptions, type TargetRoom } from './ai-assist';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

function docWithLine(len: number): Doc {
  const doc = emptyDoc();
  const wall = doc.layers[0].id;
  doc.entities.push({ id: newId('e'), type: 'line', layer: wall, a: { x: 0, y: 0 }, b: { x: len, y: 0 } });
  return doc;
}

/* ── [1] Tỉ lệ chuẩn ── */
function testScales() {
  console.log('\n[1] Tỉ lệ bản vẽ chuẩn (1:N) — suggest / fixed viewport / label');
  const doc = docWithLine(10000); // 10m — A3 usable 390mm → cần N ≥ 25.6 → chuẩn kế tiếp = 50
  const box = docBox(doc);
  const n = suggestStandardScale(box, PAPER_SIZES_MM.A3, 15);
  ok(`suggestStandardScale(10m, A3) = 50 (được ${n})`, n === 50);

  const v = fixedScaleViewport(box, PAPER_SIZES_MM.A3, 50);
  ok('fixedScaleViewport scale = 1/50', Math.abs(v.scale - 1 / 50) < 1e-12);
  // tâm bản vẽ (5000,0) phải rơi đúng giữa trang (210, 148.5)
  const cx = 5000 * v.scale + v.panX;
  const cy = -0 * v.scale + v.panY;
  ok('tâm bản vẽ nằm giữa trang A3', Math.abs(cx - 210) < 1e-9 && Math.abs(cy - 148.5) < 1e-9);

  ok('fitsAtScale 1:50 lọt A3', fitsAtScale(box, PAPER_SIZES_MM.A3, 15, 50));
  ok('fitsAtScale 1:20 KHÔNG lọt A3 (10m/20=500mm > 390mm)', !fitsAtScale(box, PAPER_SIZES_MM.A3, 15, 20));

  doc.printScale = 50;
  ok('docScaleLabel = "1:50" khi printScale lọt giấy', docScaleLabel(doc, PAPER_SIZES_MM.A3, 15) === '1:50');
  doc.printScale = 20;
  const fallback = fitScaleLabel(box, PAPER_SIZES_MM.A3, 15);
  ok(`docScaleLabel fallback auto-fit ("${fallback}") khi 1:20 không lọt`, docScaleLabel(doc, PAPER_SIZES_MM.A3, 15) === fallback);

  doc.paperKey = 'A2';
  ok('docPaperMm đọc paperKey per-sheet (A2)', docPaperMm(doc)[0] === 594 && docPaperMm(doc)[1] === 420);
  const plain = emptyDoc();
  ok('docPaperMm mặc định A3 (backward)', docPaperMm(plain)[0] === 420);
}

/* ── [2] Khung tên TTT ── */
function testTitleBlockTTT() {
  console.log('\n[2] Khung tên TTT — theo khổ giấy × N, song ngữ, tiền tố "Tỷ lệ " giữ nguyên');
  const ents = titleBlockTTT({ x: 0, y: 0 }, {
    project: 'Căn hộ Sunrise', drawing: 'MẶT BẰNG BỐ TRÍ', scale: '1:50',
    drawingNo: 'IF-07', author: 'A', checker: 'B', date: '2026-07-24',
  }, 'l-wall', 'l-text', 50);
  const rect = ents.find((e) => e.type === 'rect') as Extract<Entity, { type: 'rect' }>;
  ok('có khung bao rect', !!rect);
  ok('rộng khung = 180mm giấy × 50 = 9000mm world', Math.abs(rect.w - 180 * 50) < 1e-9);
  ok('cao khung = 42mm giấy × 50 = 2100mm world', Math.abs(rect.h - 42 * 50) < 1e-9);
  const texts = ents.filter((e): e is TextEntity => e.type === 'text').map((t) => t.text);
  ok('có wordmark TTT ARCHITECTS', texts.includes('TTT ARCHITECTS'));
  ok('có nhãn song ngữ DỰ ÁN · PROJECT', texts.includes('DỰ ÁN · PROJECT'));
  ok('có số bản vẽ IF-07', texts.includes('IF-07'));
  ok('có text "Tỷ lệ 1:50" (đúng tiền tố cho pdf.ts ghi đè)', texts.includes('Tỷ lệ 1:50'));
  ok('có Vẽ · Drawn + Kiểm · Checked', texts.some((t) => t.includes('Vẽ · Drawn: A') && t.includes('Kiểm · Checked: B')));
  // pdf.ts vẫn ghi đè được tỉ lệ thật lúc xuất
  const over = applyRealScaleToTitleBlock(ents, '1:100');
  const scaleTexts = over.filter((e): e is TextEntity => e.type === 'text' && e.text.startsWith('Tỷ lệ '));
  ok('applyRealScaleToTitleBlock ghi đè → "Tỷ lệ 1:100"', scaleTexts.length === 1 && scaleTexts[0].text === 'Tỷ lệ 1:100');
  // B1 fix: caption thước tỉ lệ "Tỷ lệ (m)" KHÔNG được bị ghi đè (tiền tố cũ bắt nhầm).
  const barCaption: Entity = { id: newId('e'), type: 'text', layer: 'l-text', at: { x: 0, y: 0 }, text: 'Tỷ lệ (m)', h: 110 };
  const over2 = applyRealScaleToTitleBlock([barCaption], '1:100');
  ok('caption thước "Tỷ lệ (m)" giữ nguyên khi xuất PDF', (over2[0] as TextEntity).text === 'Tỷ lệ (m)');
}

/* ── [3] Nền IFC — DXF XDATA round-trip + .idf print settings ── */
function testIfcSerialization() {
  console.log('\n[3] IF2-nền — DXF XDATA storey/elementType round-trip + .idf printScale/paperKey');
  const doc = emptyDoc();
  const wall = doc.layers[0].id;
  doc.entities.push(
    { id: newId('e'), type: 'line', layer: wall, a: { x: 0, y: 0 }, b: { x: 5000, y: 0 }, storey: 'L2', elementType: 'wall' },
    { id: newId('e'), type: 'circle', layer: wall, c: { x: 100, y: 100 }, r: 50, elementType: 'column' },
    { id: newId('e'), type: 'text', layer: wall, at: { x: 0, y: 0 }, text: 'GHI CHÚ', h: 200, elementType: null },
    { id: newId('e'), type: 'line', layer: wall, a: { x: 0, y: 500 }, b: { x: 1000, y: 500 } }, // không BIM
  );
  const dxf = exportDxf(doc);
  ok('DXF có APPID INTERIORFLOW', dxf.includes('INTERIORFLOW'));
  ok('DXF có IF_STOREY=L2', dxf.includes('IF_STOREY=L2'));
  const back = parseDxf(dxf);
  const lines = back.entities.filter((e) => e.type === 'line');
  const withBim = lines.find((e) => e.storey === 'L2');
  ok('line round-trip giữ storey=L2 + elementType=wall', !!withBim && withBim.elementType === 'wall');
  const circle = back.entities.find((e) => e.type === 'circle');
  ok('circle round-trip elementType=column, storey undefined', circle?.elementType === 'column' && circle?.storey === undefined);
  const text = back.entities.find((e) => e.type === 'text');
  ok('text round-trip elementType=null (đã kiểm, không phải BIM)', text?.elementType === null);
  const plainLine = lines.find((e) => e.storey === undefined && e.elementType === undefined);
  ok('entity không BIM giữ nguyên undefined (không tự thêm)', !!plainLine);
  // file cũ (không XDATA) mở bình thường
  const oldDoc = docWithLine(3000);
  const oldBack = parseDxf(exportDxf(oldDoc));
  ok('DXF cũ (0 XDATA) parse sạch, field undefined', oldBack.entities.length === 1 && oldBack.entities[0].storey === undefined);

  // .idf — printScale/paperKey per-sheet đi theo Doc (JSON)
  const idfDoc = docWithLine(4000);
  idfDoc.printScale = 50;
  idfDoc.paperKey = 'A2';
  const json = exportIdf([{ id: 's1', name: 'Bản vẽ 1', doc: idfDoc }]);
  const parsed = importIdf(json);
  ok('.idf round-trip printScale=50', parsed?.sheets[0].doc.printScale === 50);
  ok('.idf round-trip paperKey=A2', parsed?.sheets[0].doc.paperKey === 'A2');
  // .idf CŨ không có 2 field → vẫn mở được (backward)
  const legacy = importIdf(exportIdf([{ id: 's1', name: 'Bản vẽ 1', doc: docWithLine(1000) }]));
  ok('.idf cũ không printScale/paperKey vẫn parse', !!legacy && legacy.sheets[0].doc.printScale === undefined);
}

/* ── [4] AI Brief — placedCount thật + obstacles được né ── */
function testAiBrief() {
  console.log('\n[4] AI Brief — placedCount/requestedCount đo thật + solver né obstacles');
  const opts = generateLayoutOptions('phòng ngủ 3.4x3.6 có giường và tủ áo', { x: 0, y: 0 }, 'l-wall', 'l-text');
  ok('3 option', opts.length === 3);
  ok('requestedCount = 2 (giường + tủ)', opts.every((o) => o.requestedCount === 2));
  ok('placedCount hợp lệ (0..2) trên mọi option', opts.every((o) => (o.placedCount ?? -1) >= 0 && (o.placedCount ?? 9) <= 2));

  // In-situ: 1 phòng thật 4×4m với obstacle chiếm nguyên dải tường Bắc → giường (ưu tiên N) phải
  // né sang chỗ khác hoặc bị bỏ — nhưng TUYỆT ĐỐI không đè obstacle.
  const target: TargetRoom = {
    name: 'PHÒNG NGỦ',
    interior: { ix0: 0, iy0: 0, ix1: 4000, iy1: 4000 },
    obstacles: [{ x: 2000, y: 3500, ex: 4000, ey: 1000 }], // dải trên cùng
  };
  const inSitu = generateLayoutOptions('phòng ngủ có giường', { x: 10000, y: 0 }, 'l-wall', 'l-text', 110, 'l-furniture', { targetRooms: [target] });
  const opt0 = inSitu[0];
  ok('option in-situ có placedInto', !!opt0.placedInto && opt0.placedInto.includes('PHÒNG NGỦ'));
  const blocks = opt0.entities.filter((e): e is Extract<Entity, { type: 'block' }> => e.type === 'block');
  const overlapsObstacle = blocks.some((b) => Math.abs(b.at.x - 2000) * 2 < 4000 + 500 && Math.abs(b.at.y - 3500) * 2 < 1000 + 500);
  ok(`block đặt vào KHÔNG đè obstacle (${blocks.length} block)`, blocks.length === 0 || !overlapsObstacle);
}

/* ── [5] Store — undo giữ printScale/paperKey ── */
function testStoreClone() {
  console.log('\n[5] Store — undo/redo không làm mất printScale/paperKey (clone ...d)');
  const st = useCadStore.getState();
  st.reset();
  useCadStore.getState().setPrintSettings({ printScale: 100, paperKey: 'A2' });
  // snapshot xảy ra trong addEntity — doc lúc đó ĐÃ có printScale
  useCadStore.getState().addEntity({ id: newId('e'), type: 'line', layer: 'l-wall', a: { x: 0, y: 0 }, b: { x: 1, y: 1 } });
  useCadStore.getState().addEntity({ id: newId('e'), type: 'line', layer: 'l-wall', a: { x: 0, y: 0 }, b: { x: 2, y: 2 } });
  useCadStore.getState().undo();
  const d = useCadStore.getState().doc;
  ok('sau undo: printScale=100 còn nguyên', d.printScale === 100);
  ok('sau undo: paperKey=A2 còn nguyên', d.paperKey === 'A2');
  useCadStore.getState().setPrintSettings({ printScale: null });
  ok('setPrintSettings(null) xoá field', useCadStore.getState().doc.printScale === undefined);
}

testScales();
testTitleBlockTTT();
testIfcSerialization();
testAiBrief();
testStoreClone();

console.log(`\nKẾT QUẢ: ${pass} pass · ${fail} fail`);
if (fail > 0) process.exit(1);
