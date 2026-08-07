/**
 * lib/print/lineweight.test.ts — vạch minh hoạ độ đậm của Bảng nét in (Màn 8).
 * Khoá đúng 3 bậc mà mock `docs/mocks/BangNetIn.dc.html` vẽ, để lần sau ai sửa ngưỡng thì biết
 * mình đang lệch khỏi mock chứ không phải "chỉnh cho đẹp".
 */

import assert from 'node:assert';
import { lineweightBarHeightPx } from './lineweight';

let pass = 0;
function test(name: string, fn: () => void) {
  fn();
  pass++;
  console.log(`  ✓ ${name}`);
}

test('7 hàng của mock ra đúng 7 chiều cao vạch mock vẽ', () => {
  // (mm, px) đọc thẳng từ BangNetIn.dc.html: height:3px / 2px / 2px / 1px / 1px / 1px / 1px
  const mock: [number, number][] = [
    [0.5, 3], // Tường chịu lực
    [0.35, 2], // Tường ngăn
    [0.25, 2], // Cửa và cửa sổ
    [0.18, 1], // Đồ đạc
    [0.13, 1], // Kích thước
    [0.13, 1], // Ký hiệu và ghi chú
    [0.09, 1], // Đường trục
  ];
  for (const [mm, px] of mock) {
    assert.strictEqual(lineweightBarHeightPx(mm), px, `${mm}mm phải ra ${px}px`);
  }
});

test('đúng NGAY TẠI ngưỡng (0.5 và 0.25 thuộc bậc trên, không phải bậc dưới)', () => {
  assert.strictEqual(lineweightBarHeightPx(0.5), 3);
  assert.strictEqual(lineweightBarHeightPx(0.49), 2);
  assert.strictEqual(lineweightBarHeightPx(0.25), 2);
  assert.strictEqual(lineweightBarHeightPx(0.24), 1);
});

test('nét rất đậm vẫn chỉ 3px — vạch minh hoạ có TRẦN, không phình theo mm', () => {
  assert.strictEqual(lineweightBarHeightPx(1.4), 3);
  assert.strictEqual(lineweightBarHeightPx(2.0), 3);
});

test('nét rất mảnh / 0 / âm vẫn vẽ được 1px, không ra 0 hay số âm', () => {
  for (const mm of [0.05, 0.01, 0, -1]) {
    assert.strictEqual(lineweightBarHeightPx(mm), 1, `${mm}mm phải vẫn còn thấy vạch`);
  }
});

test('đơn điệu — mm to hơn thì vạch không bao giờ mảnh hơn', () => {
  let truoc = 0;
  for (let mm = 0; mm <= 2; mm += 0.01) {
    const px = lineweightBarHeightPx(Number(mm.toFixed(2)));
    assert.ok(px >= truoc, `tụt bậc tại ${mm}mm`);
    truoc = px;
  }
});

console.log(`\nlineweight.test.ts — ${pass}/${pass} PASS`);
