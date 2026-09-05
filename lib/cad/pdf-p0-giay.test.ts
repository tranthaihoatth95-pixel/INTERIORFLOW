/**
 * lib/cad/pdf-p0-giay.test.ts — KHOÁ hai lỗi P0 của bản vẽ in ra (phiếu P0-GIAY, 05/09).
 *
 * Hai lỗi được khoá ở đây, cả hai đều làm hồ sơ THI CÔNG mang một con số SAI mà trông như đúng —
 * hạng lỗi nặng nhất về hậu quả nghề (`docs/CHUAN-DAU-RA-NGHE.md` §1, `docs/delivery/AUDIT-THAO-TAC-A2.md`):
 *
 *  · `A2-01` khung tên đặt trong MODEL SPACE ở toạ độ suy từ tỉ lệ ĐOÁN lúc chèn, trong khi tờ giấy
 *    in theo `Viewport2D.scale` riêng ⇒ khối văng ra ngoài vùng cắt, cột phải bị xén: đo trên PDF
 *    thật, chuỗi ở **x=1489pt trên trang 1190pt**; "Tỷ lệ 1:50" in ra "Tỷ lệ 1:5" — sai MƯỜI LẦN.
 *  · `A2-02` nấc "Vừa khổ" sinh tỉ lệ ngoài dãy chuẩn (**0/10** tổ hợp: 1:15·1:22·1:29·1:32·1:42·
 *    1:47·1:62·1:70·1:92) mà cổng `CHUAN_DAU_RA` vẫn tick xanh "Đạt chuẩn đầu ra: tỷ lệ".
 *
 * ⚠️ ĐỌC KỸ TRƯỚC KHI "TỐI ƯU" FILE NÀY: bài học 15/08 trong `docs/00-CHOT.md` — *test khẳng định
 * "trả về đường thoái lui" mà KHÔNG có test nào khẳng định đường CHÍNH chạy được thì đó là test
 * CHE bug*. Ở đây mỗi ca đều khẳng định ĐƯỜNG CHÍNH: con số thật, vị trí thật, cổng thật đỏ.
 */
import assert from 'node:assert';
import {
  emptyDoc, paperSizeMm, docScaleLabel, isStandardPrintScale, resolveDocPrintScaleN,
  PRINT_SCALE_STEPS, type Doc, type PaperKey, type PaperOrientation, type Entity,
} from './model';
import { timCacKhungTen, timKhungTen, viewportKhopO, DEFAULT_PDF_MARGIN_MM } from './pdf';
import { titleBlockPro } from './commands';
import { buildChuanDauRaChecks } from '../print/export-checks';

let pass = 0;
let fail = 0;
function test(ten: string, fn: () => void) {
  try { fn(); pass++; console.log(`  ✓ ${ten}`); }
  catch (e) { fail++; console.log(`  ✗ ${ten}\n      ${(e as Error).message}`); }
}

/** Bản vẽ tối thiểu: một phòng 10×6m — đủ để mọi khổ giấy ra một tỉ lệ khác nhau. */
function docPhong(w = 10_000, h = 6_000): Doc {
  const d = emptyDoc();
  d.entities = [{ id: 'r1', type: 'rect', layer: 'l-wall', x: 0, y: 0, w, h } as Entity];
  return d;
}

console.log('\nlib/cad/pdf-p0-giay.test.ts — P0 bản vẽ in ra\n');

/* ═════ [1] A2-02 — "Vừa khổ" phải rơi vào DÃY CHUẨN ở MỌI khổ × hướng ═════ */
console.log('[1] A2-02 · nấc "Vừa khổ" — mọi tổ hợp phải ra nấc chuẩn');

const TO_HOP: [PaperKey, PaperOrientation][] = [
  ['A0', 'landscape'], ['A1', 'landscape'], ['A1', 'portrait'], ['A2', 'landscape'],
  ['A2', 'portrait'], ['A3', 'landscape'], ['A3', 'portrait'], ['A4', 'landscape'], ['A4', 'portrait'],
];

test('10/10 tổ hợp khổ×hướng cho tỉ lệ THUỘC dãy chuẩn (trước: 0/10)', () => {
  const lech: string[] = [];
  for (const [key, o] of TO_HOP) {
    const doc = { ...docPhong(), paperKey: key, paperOrientation: o };
    const nhan = docScaleLabel(doc, paperSizeMm(key, o), DEFAULT_PDF_MARGIN_MM);
    const n = Number(nhan.replace('1:', ''));
    if (!isStandardPrintScale(n)) lech.push(`${key}/${o} → ${nhan}`);
  }
  assert.deepStrictEqual(lech, [], `còn tỉ lệ ngoài dãy chuẩn: ${lech.join(' · ')}`);
});

test('nhãn trên màn = con số đường xuất dùng (một nguồn, không còn hai phép tính)', () => {
  for (const [key, o] of TO_HOP) {
    const paperMm = paperSizeMm(key, o);
    const doc = { ...docPhong(), paperKey: key, paperOrientation: o };
    const nhan = docScaleLabel(doc, paperMm, DEFAULT_PDF_MARGIN_MM);
    const n = resolveDocPrintScaleN(doc, paperMm, DEFAULT_PDF_MARGIN_MM);
    assert.strictEqual(nhan, `1:${n}`, `${key}/${o}: màn "${nhan}" ≠ xuất "1:${n}"`);
  }
});

test('nấc bắt về LUÔN thu nhỏ (không phóng to) — bản vẽ chắc chắn còn lọt giấy', () => {
  for (const [key, o] of TO_HOP) {
    const paperMm = paperSizeMm(key, o);
    const doc = { ...docPhong(), paperKey: key, paperOrientation: o };
    const n = resolveDocPrintScaleN(doc, paperMm, DEFAULT_PDF_MARGIN_MM)!;
    const [pw, ph] = paperMm;
    const w = 10_000 / n;
    const hh = 6_000 / n;
    const lotNgang = w <= pw - DEFAULT_PDF_MARGIN_MM * 2 && hh <= ph - DEFAULT_PDF_MARGIN_MM * 2;
    assert.ok(lotNgang, `${key}/${o}: 1:${n} KHÔNG lọt giấy`);
  }
});

test('con số "1:47" mà LUẬT nêu làm ví dụ CẤM không còn sinh ra được', () => {
  for (const [key, o] of TO_HOP) {
    const doc = { ...docPhong(), paperKey: key, paperOrientation: o };
    const nhan = docScaleLabel(doc, paperSizeMm(key, o), DEFAULT_PDF_MARGIN_MM);
    assert.notStrictEqual(nhan, '1:47');
  }
});

/* ═════ [2] A2-02b — CỔNG phải ĐỎ khi tỉ lệ ngoài dãy chuẩn ═════ */
console.log('\n[2] A2-02b · cổng CHUAN_DAU_RA phải ĐỎ, không được gật');

/** Bản vẽ có khung tên đủ 9 ô — để cổng không đỏ vì lý do khác khi ta chỉ muốn soi mục tỉ lệ. */
function docCoKhungTen(printScale?: number): Doc {
  const d = docPhong();
  d.entities = [
    ...d.entities,
    ...titleBlockPro({ x: 40_000, y: 0 }, {
      project: 'DỰ ÁN X', category: 'NỘI THẤT', drawing: 'MẶT BẰNG', drawingNumber: 'IF-01',
      scale: '1:100', author: 'A', checker: 'B', date: '2026-09-05', revision: '01',
    } as never, 'l-wall', 'l-text', 100),
  ];
  return printScale === undefined ? d : { ...d, printScale };
}
const loiTiLe = (f: { level: string; message: string; fix: string }[]) =>
  f.filter((x) => x.level === 'error' && /tỷ lệ|Tỷ lệ/i.test(x.message));

test('người dùng gõ tường minh 1:47 (lọt giấy) ⇒ cổng ĐỎ, kèm nấc thay thế', () => {
  // Cố ý dùng bản vẽ TRẦN (không khung tên): khối khung tên neo ở x=40.000 làm bao hình nở ra,
  // 1:47 hết lọt A3 ⇒ đường xuất tự bắt về nấc chuẩn và cổng xanh — đúng, nhưng đó là ca KHÁC.
  // Ca cần khoá ở đây là 1:47 CÓ lọt giấy mà vẫn ngoài dãy chuẩn. (Lọc theo /tỷ lệ/ nên dòng
  // "chưa có khung tên" của bản vẽ trần không lẫn vào.)
  const nho = { ...docPhong(), printScale: 47 };
  const f = buildChuanDauRaChecks(nho, 'A3', 'landscape');
  const loi = loiTiLe(f);
  assert.ok(loi.length > 0, 'cổng KHÔNG đỏ cho 1:47 — đúng lỗi A2-02 đang khoá');
  assert.match(loi[0].message, /1:47/);
  assert.match(loi[0].fix, /1:50/, 'phải chỉ đúng nấc chuẩn thay thế');
});

test('tờ Paper in ở tỉ lệ ô nhìn ngoài dãy (1:47) ⇒ cổng ĐỎ — lỗ trước đây không ai kiểm', () => {
  const loi = loiTiLe(buildChuanDauRaChecks(docCoKhungTen(), 'A3', 'landscape', 47));
  assert.ok(loi.length > 0, 'cổng bỏ lọt tỉ lệ của Viewport2D');
  assert.match(loi[0].message, /1:47/);
});

test('mọi nấc TRONG dãy chuẩn ⇒ cổng KHÔNG đỏ vì tỉ lệ (không báo động giả)', () => {
  for (const n of PRINT_SCALE_STEPS) {
    const f = buildChuanDauRaChecks(docCoKhungTen(), 'A3', 'landscape', n);
    assert.deepStrictEqual(loiTiLe(f), [], `báo nhầm cho nấc chuẩn 1:${n}`);
  }
});

test('nấc "Vừa khổ" (không gõ tỉ lệ) ⇒ cổng KHÔNG đỏ, vì số in ra nay đã chuẩn', () => {
  assert.deepStrictEqual(loiTiLe(buildChuanDauRaChecks(docCoKhungTen(), 'A3', 'landscape')), []);
});

/* ═════ [3] A2-01 — khung tên là vật của TỜ GIẤY, không thể bị xén ═════ */
console.log('\n[3] A2-01 · khung tên nhận diện được và khớp ô giấy');

/** Dựng đúng đường `CadEditor.insert()`: neo khối ở `box.maxX + 500 + 180*k`. */
function chen(doc: Doc, k: number): Doc {
  const maxX = doc.entities.reduce((m, e) => (e.type === 'rect' ? Math.max(m, e.x + e.w) : m), 0);
  return { ...doc, entities: [...doc.entities, ...titleBlockPro(
    { x: maxX + 500 + 180 * k, y: 0 },
    { project: 'DỰ ÁN X', category: 'NỘI THẤT', drawing: 'MẶT BẰNG', drawingNumber: 'IF-01',
      scale: `1:${k}`, author: 'A', checker: 'B', date: '2026-09-05', revision: '01' } as never,
    'l-wall', 'l-text', k) ] };
}

test('nhận ra khung tên đã bake trong bản vẽ', () => {
  const kt = timKhungTen(chen(docPhong(), 50).entities);
  assert.ok(kt, 'không nhận ra khung tên');
  assert.strictEqual(Math.round(kt!.box.maxX - kt!.box.minX), 180 * 50);
  assert.strictEqual(Math.round(kt!.box.maxY - kt!.box.minY), 42 * 50);
});

test('bản vẽ KHÔNG có khung tên ⇒ không nhận bừa (rect phòng không bị nuốt)', () => {
  assert.strictEqual(timKhungTen(docPhong().entities), null);
});

test('chèn hai lần ⇒ nhận ĐỦ 2 khối, khối CHÍNH là khối rộng nhất', () => {
  const cac = timCacKhungTen(chen(chen(docPhong(), 50), 100).entities);
  assert.strictEqual(cac.length, 2, `nhận ${cac.length} khối, cần 2`);
  assert.strictEqual(Math.round(cac[0].box.maxX - cac[0].box.minX), 180 * 100);
});

test('khớp ô giấy: khối bake ở BẤT KỲ k nào cũng in ra đúng 180×42mm', () => {
  for (const k of [20, 50, 100, 200]) {
    const kt = timKhungTen(chen(docPhong(), k).entities)!;
    const slot = { x: 420 - 8 - 180, y: 297 - 8 - 42, w: 180, h: 42 };
    const v = viewportKhopO(kt.box, slot);
    const w = (kt.box.maxX - kt.box.minX) * v.scale;
    const h = (kt.box.maxY - kt.box.minY) * v.scale;
    assert.ok(Math.abs(w - 180) < 0.01, `k=${k}: rộng in ra ${w.toFixed(2)}mm ≠ 180mm`);
    assert.ok(Math.abs(h - 42) < 0.01, `k=${k}: cao in ra ${h.toFixed(2)}mm ≠ 42mm`);
  }
});

test('khối khớp ô giấy nằm TRỌN trong trang — không mép nào vượt (A2-01)', () => {
  for (const [key, o] of TO_HOP) {
    const [pw, ph] = paperSizeMm(key, o);
    const tbW = Math.min(180, pw - 16);
    const tbH = Math.min(42, ph - 16);
    const slot = { x: pw - 8 - tbW, y: ph - 8 - tbH, w: tbW, h: tbH };
    // chèn ở k=200 (khối world khổng lồ 36000mm) — ca xưa văng khỏi giấy
    const kt = timKhungTen(chen(docPhong(), 200).entities)!;
    const v = viewportKhopO(kt.box, slot);
    const x0 = kt.box.minX * v.scale + v.panX;
    const x1 = kt.box.maxX * v.scale + v.panX;
    const y0 = v.panY - kt.box.maxY * v.scale;
    const y1 = v.panY - kt.box.minY * v.scale;
    assert.ok(x0 >= -0.01 && x1 <= pw + 0.01, `${key}/${o}: x ${x0.toFixed(1)}…${x1.toFixed(1)} ngoài 0…${pw}`);
    assert.ok(y0 >= -0.01 && y1 <= ph + 0.01, `${key}/${o}: y ${y0.toFixed(1)}…${y1.toFixed(1)} ngoài 0…${ph}`);
  }
});

test('cổng CẢNH BÁO khi bản vẽ mang nhiều hơn một khung tên (bỏ khối thừa không im lặng)', () => {
  const doc = chen(chen(docPhong(), 50), 100);
  const w = buildChuanDauRaChecks(doc, 'A3', 'landscape').filter((f) => /khung tên/.test(f.message) && f.level === 'warn');
  assert.strictEqual(w.length, 1, 'không cảnh báo khung tên thừa');
});

console.log(`\nKẾT QUẢ: ${pass} pass · ${fail} fail`);
if (fail) process.exit(1);
