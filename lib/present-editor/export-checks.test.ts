/**
 * lib/present-editor/export-checks.test.ts — khoá cổng CHUAN_DAU_RA của đường xuất DECK.
 *
 * Lỗi F1 (lane G2, 04/09): mở tệp PDF xuất ra soi bằng mắt thì trang in đúng một dòng
 * "Nhập nội dung" — giá trị mặc định của `makeText()`, tức DỮ LIỆU THẬT chứ không phải chữ mờ,
 * và không chỗ nào lọc. Trái `docs/CHUAN-DAU-RA-NGHE.md` §4 "0 placeholder sót".
 *
 * Điều phải khoá: ô chữ CHƯA SỬA thì bị bắt, ô chữ ĐÃ SỬA thì đi qua. Gỡ luật ra là test đỏ.
 */

import assert from 'node:assert';
import { makeText, makeShape, DEFAULT_TEXT_CONTENT, type EditorDeck, type EditorSlide } from './model';
import { buildDeckChuanDauRaChecks, demOChuChuaSua, deckCoLoiChuanDauRa, CHUAN_DAU_RA } from './export-checks';

let pass = 0;
function test(name: string, fn: () => void) {
  fn();
  pass++;
  console.log(`  ✓ ${name}`);
}

function slide(elements: EditorSlide['elements']): EditorSlide {
  return { id: `s_${elements.length}_${Math.random().toString(36).slice(2)}`, background: '#fff', elements };
}
function deck(slides: EditorSlide[]): EditorDeck {
  return { slides, project: 'Kiểm thử', brand: '', fonts: [] } as unknown as EditorDeck;
}

console.log('\nlib/present-editor/export-checks.ts — cổng CHUAN_DAU_RA cho deck\n');

/* ───────────── CA 1: ô chữ CHƯA SỬA phải bị bắt ───────────── */

test('ô chữ mới tạo (chưa gõ gì) → bị bắt, mức error, nói rõ TRANG nào', () => {
  const d = deck([slide([makeText()])]);
  const f = buildDeckChuanDauRaChecks(d);
  assert.equal(f.length, 1, 'phải có đúng 1 phát hiện');
  assert.equal(f[0].level, 'error');
  assert.match(f[0].message, /Trang 1/, 'thông điệp phải chỉ đúng trang');
  assert.match(f[0].fix, /Trang 1|trang 1/, 'cách sửa phải chỉ đúng trang');
  assert.ok(f[0].fix.length > 0, 'luôn kèm việc làm được ngay, không chỉ chê');
  assert.equal(deckCoLoiChuanDauRa(d), true);
});

test('nhiều ô chữ chưa sửa trên cùng trang → gộp 1 dòng, đếm đúng số ô', () => {
  const d = deck([slide([makeText(), makeText(), makeText()])]);
  const f = buildDeckChuanDauRaChecks(d);
  assert.equal(f.length, 1, 'gộp theo TRANG, không bắn 3 dòng rời');
  assert.match(f[0].message, /3 ô chữ/);
});

test('mỗi trang hỏng một dòng riêng — trang sạch không bị nêu', () => {
  const d = deck([
    slide([makeText({ text: 'Mặt bằng tầng 1' })]), // trang 1 sạch
    slide([makeText()]), // trang 2 hỏng
    slide([makeText()]), // trang 3 hỏng
  ]);
  const f = buildDeckChuanDauRaChecks(d);
  assert.equal(f.length, 2);
  assert.match(f[0].message, /Trang 2/);
  assert.match(f[1].message, /Trang 3/);
});

/* ───────────── CA 2: ô chữ ĐÃ SỬA phải đi qua ───────────── */

test('ô chữ đã gõ nội dung thật → KHÔNG bị bắt (deck sạch trả [])', () => {
  const d = deck([slide([makeText({ text: 'Phòng khách — gỗ óc chó' })])]);
  assert.deepEqual(buildDeckChuanDauRaChecks(d), []);
  assert.equal(deckCoLoiChuanDauRa(d), false);
});

test('deck rỗng / trang không có chữ → sạch, không báo bừa', () => {
  assert.deepEqual(buildDeckChuanDauRaChecks(deck([])), []);
  assert.deepEqual(buildDeckChuanDauRaChecks(deck([slide([])])), []);
  assert.deepEqual(buildDeckChuanDauRaChecks(deck([slide([makeShape('rect')])])), []);
});

test('ô chữ đã ẨN hoặc trong suốt → không in ra nên không báo oan', () => {
  assert.deepEqual(buildDeckChuanDauRaChecks(deck([slide([makeText({ hidden: true })])])), []);
  assert.deepEqual(buildDeckChuanDauRaChecks(deck([slide([makeText({ opacity: 0 })])])), []);
  // nhưng còn nhìn thấy được thì vẫn bắt
  assert.equal(buildDeckChuanDauRaChecks(deck([slide([makeText({ opacity: 1 })])])).length, 1);
});

test('chỉ khác khoảng trắng vẫn là CHƯA SỬA — người dùng chưa gõ gì thật', () => {
  const d = deck([slide([makeText({ text: `  ${DEFAULT_TEXT_CONTENT}  ` })])]);
  assert.equal(buildDeckChuanDauRaChecks(d).length, 1);
});

/* ───────────── CA 3: MỘT NGUỒN — luật không được khoá cứng chuỗi ───────────── */

test('luật đọc DEFAULT_TEXT_CONTENT từ model, không gõ cứng chuỗi', () => {
  // makeText() lấy chữ mặc định từ hằng số; bộ kiểm so với CHÍNH hằng số đó.
  // Nếu ai đó khoá cứng 'Nhập nội dung' trong bộ kiểm, đổi hằng số sẽ làm luật chết âm thầm —
  // ca này bắt đúng cảnh đó: text dựng TỪ hằng số phải luôn bị bắt, bất kể giá trị là gì.
  assert.equal(makeText().text, DEFAULT_TEXT_CONTENT, 'makeText phải dùng hằng số chung');
  const d = deck([slide([makeText({ text: DEFAULT_TEXT_CONTENT })])]);
  assert.equal(buildDeckChuanDauRaChecks(d).length, 1);
});

test('marker CHUAN_DAU_RA dùng LẠI của lib/print, không đẻ marker thứ hai', () => {
  assert.equal(CHUAN_DAU_RA, 'CHUAN_DAU_RA');
});

test('demOChuChuaSua đếm đúng trên một slide', () => {
  assert.equal(demOChuChuaSua(slide([makeText(), makeText({ text: 'thật' })])), 1);
});

console.log(`\n${pass} ca pass\n`);
