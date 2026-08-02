/**
 * lib/present-editor/element-filter.test.ts — kiểm `elementFilterToCssFilter` (P4/E4,
 * `docs/CHOT-NGUYEN-LIEU-EDITOR-2026-08-01.md` mục E4). Chạy:
 *   node_modules/.bin/sucrase-node lib/present-editor/element-filter.test.ts
 *
 * Hàm THUẦN (không đụng canvas/DOM) — test trực tiếp bằng so sánh chuỗi. Đây là chuỗi CSS
 * `filter` dùng CHUNG cho 2 đường xem-trước (Element.tsx, gán thẳng vào style React) VÀ
 * xuất canvas (render.ts, gán vào `ctx.filter`) — cú pháp giống hệt nhau nên 1 bộ test là đủ
 * cho cả hai đường.
 */
import { elementFilterToCssFilter, DEFAULT_ELEMENT_FILTER } from './model';
import type { ElementFilter } from './model';

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

function testUndefined() {
  ok('undefined -> none (phần tử chưa từng chỉnh filter)', elementFilterToCssFilter(undefined) === 'none');
}

function testAllDefault() {
  ok('mọi giá trị mặc định -> none', elementFilterToCssFilter(DEFAULT_ELEMENT_FILTER) === 'none');
  ok(
    'mặc định tường minh {blur:0,brightness:100,contrast:100,saturate:100} -> none',
    elementFilterToCssFilter({ blur: 0, brightness: 100, contrast: 100, saturate: 100 }) === 'none',
  );
}

function testSingleTerms() {
  const base: ElementFilter = { blur: 0, brightness: 100, contrast: 100, saturate: 100 };
  ok('chỉ blur -> "blur(8px)"', elementFilterToCssFilter({ ...base, blur: 8 }) === 'blur(8px)');
  ok('chỉ brightness -> "brightness(150%)"', elementFilterToCssFilter({ ...base, brightness: 150 }) === 'brightness(150%)');
  ok('chỉ contrast -> "contrast(60%)"', elementFilterToCssFilter({ ...base, contrast: 60 }) === 'contrast(60%)');
  ok('chỉ saturate -> "saturate(0%)"', elementFilterToCssFilter({ ...base, saturate: 0 }) === 'saturate(0%)');
}

function testBlurZeroOmitted() {
  // blur=0 nghĩa là "không mờ" — phải bị bỏ khỏi chuỗi dù có mặt trong object, kể cả khi
  // các trường khác đã đổi (không phải do object rỗng mà chuỗi rỗng).
  const f: ElementFilter = { blur: 0, brightness: 150, contrast: 100, saturate: 100 };
  const css = elementFilterToCssFilter(f);
  ok('blur=0 không xuất hiện trong chuỗi dù có trường khác đổi', !css.includes('blur'));
  ok('chuỗi chỉ còn brightness', css === 'brightness(150%)');
}

function testCombinedOrder() {
  // Thứ tự cố định: blur → brightness → contrast → saturate (khớp thứ tự field trong
  // ElementFilter/FilterControls — Element.tsx và render.ts dùng CHUNG hàm này nên chỉ cần
  // đúng 1 chỗ, tự động nhất quán xem-trước ↔ xuất file).
  const f: ElementFilter = { blur: 4, brightness: 120, contrast: 80, saturate: 200 };
  ok(
    'ghép đủ 4 filter, cách nhau 1 dấu cách, đúng thứ tự',
    elementFilterToCssFilter(f) === 'blur(4px) brightness(120%) contrast(80%) saturate(200%)',
  );
}

testUndefined();
testAllDefault();
testSingleTerms();
testBlurZeroOmitted();
testCombinedOrder();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
