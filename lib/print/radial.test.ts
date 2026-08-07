/**
 * lib/print/radial.test.ts — Bảng tròn chọn bút (Màn 9).
 *
 * ⚠️ Đọc kỹ mục [C]: phiếu vòng 2 yêu cầu "clampToViewport phải có ca tái hiện bug keyframes".
 * Hai thứ đó KHÔNG cùng một hàm — bug keyframes nằm ở chuỗi CSS, không ở phép kẹp toạ độ, nên ca
 * tái hiện bug được đặt ĐÚNG chỗ nó sống (`RADIAL_MENU_KEYFRAMES`, mục [C]) chứ không nhét vào
 * test của `clampToViewport` cho có. Nhét sai chỗ thì test xanh mà bug vẫn về được — đúng cái
 * "test trang trí" mà phiếu muốn tránh.
 */

import assert from 'node:assert';
import {
  radialPositions,
  clampToViewport,
  RADIAL_DISC_SIZE,
  RADIAL_BTN_RADIUS,
  RADIAL_MENU_KEYFRAMES,
} from './radial';

let pass = 0;
function test(name: string, fn: () => void) {
  fn();
  pass++;
  console.log(`  ✓ ${name}`);
}

console.log('[A] radialPositions — phải khớp mock BangTron.dc.html từng số');

test('6 nút ra ĐÚNG 6 cặp toạ độ của mock', () => {
  const p = radialPositions(6, RADIAL_BTN_RADIUS);
  assert.deepStrictEqual(p, [
    { x: 0, y: -82 }, // Bút — đỉnh
    { x: 71, y: -41 }, // Hình
    { x: 71, y: 41 }, // Gôm
    { x: 0, y: 82 }, // Hoàn tác — đáy
    { x: -71, y: 41 }, // Đo
    { x: -71, y: -41 }, // Chữ
  ]);
});

test('nút đầu tiên LUÔN ở đỉnh (y âm), không lệch sang phải', () => {
  for (const n of [3, 4, 5, 6, 8, 12]) {
    const first = radialPositions(n, RADIAL_BTN_RADIUS)[0];
    assert.strictEqual(first.x, 0, `n=${n}: nút đầu phải nằm trên trục dọc`);
    assert.ok(first.y < 0, `n=${n}: nút đầu phải ở PHÍA TRÊN tâm (y=${first.y})`);
  }
});

test('mọi nút cách tâm đúng bán kính (sai số làm tròn ≤1px)', () => {
  for (const { x, y } of radialPositions(6, RADIAL_BTN_RADIUS)) {
    assert.ok(Math.abs(Math.hypot(x, y) - RADIAL_BTN_RADIUS) <= 1);
  }
});

test('các nút cách đều nhau — 6 nút thì 2 nút đối xứng qua tâm', () => {
  const p = radialPositions(6, RADIAL_BTN_RADIUS);
  for (let i = 0; i < 3; i++) {
    // so bằng TỔNG (không so `x === -x`): `Math.round` sinh ra `-0`, mà `-0 !== 0` với
    // `strictEqual` (Object.is) — bẫy này làm test đỏ oan chứ không phải hàm sai.
    assert.strictEqual(p[i].x + p[i + 3].x, 0);
    assert.strictEqual(p[i].y + p[i + 3].y, 0);
  }
});

test('0 nút không nổ, không trả rác', () => {
  assert.deepStrictEqual(radialPositions(0, RADIAL_BTN_RADIUS), []);
});

console.log('[B] clampToViewport — nửa bảng không được nằm ngoài màn hình');

const HALF = RADIAL_DISC_SIZE / 2; // 118

test('bấm giữa màn hình thì KHÔNG dịch', () => {
  assert.strictEqual(clampToViewport(700, 1440), 700);
  assert.strictEqual(clampToViewport(450, 900), 450);
});

test('bấm sát mép PHẢI → kéo vào đủ nửa đĩa', () => {
  assert.strictEqual(clampToViewport(1439, 1440), 1440 - HALF);
});

test('bấm sát mép TRÁI (kể cả toạ độ âm) → kéo vào đủ nửa đĩa', () => {
  assert.strictEqual(clampToViewport(0, 1440), HALF);
  assert.strictEqual(clampToViewport(-500, 1440), HALF);
});

test('bấm sát mép DƯỚI → kéo lên đủ nửa đĩa', () => {
  assert.strictEqual(clampToViewport(899, 900), 900 - HALF);
});

test('ngay tại ngưỡng thì giữ nguyên, không kẹp thừa', () => {
  assert.strictEqual(clampToViewport(HALF, 1440), HALF);
  assert.strictEqual(clampToViewport(1440 - HALF, 1440), 1440 - HALF);
});

test('khung nhìn HẸP HƠN cả đĩa → về giữa (không có chỗ nào thoả 2 mép)', () => {
  assert.strictEqual(clampToViewport(10, 200), 100);
  assert.strictEqual(clampToViewport(190, 200), 100);
  assert.strictEqual(clampToViewport(50, RADIAL_DISC_SIZE), RADIAL_DISC_SIZE / 2);
});

test('sau khi kẹp, cả đĩa LUÔN nằm trọn trong khung nhìn', () => {
  for (const extent of [1440, 900, 600, 300]) {
    for (const v of [-100, 0, 1, 50, 118, 300, extent - 1, extent, extent + 999]) {
      const c = clampToViewport(v, extent);
      assert.ok(c - HALF >= -0.001, `extent=${extent} v=${v}: tràn mép trái`);
      assert.ok(c + HALF <= extent + 0.001, `extent=${extent} v=${v}: tràn mép phải`);
    }
  }
});

console.log('[C] RADIAL_MENU_KEYFRAMES — CHẶN HỒI QUY bug đã vá 06/08');

/**
 * Bug thật đã xảy ra: mốc keyframe chỉ ghi `transform: scale(.86)`. Animation thắng inline style
 * trong cascade ⇒ `translate(-50%,-50%)` mà component đặt để dịch tâm bị NUỐT suốt lúc chạy ⇒ đĩa
 * nhảy lệch 118px xuống-phải rồi giật về. Test dưới đây SẬP nếu ai đó viết lại keyframe kiểu cũ.
 */
test('CẢ HAI mốc from/to đều giữ translate(-50%,-50%)', () => {
  const moc = RADIAL_MENU_KEYFRAMES.match(/\b(from|to)\s*\{[^}]*\}/g) ?? [];
  assert.strictEqual(moc.length, 2, 'phải có đúng 2 mốc from/to');
  for (const m of moc) {
    assert.ok(/transform\s*:/.test(m), `mốc thiếu transform: ${m}`);
    assert.ok(
      /translate\(\s*-50%\s*,\s*-50%\s*\)/.test(m),
      `MỐC NÀY NUỐT MẤT translate(-50%,-50%) — đĩa sẽ nhảy lệch nửa thân khi mở: ${m}`,
    );
  }
});

test('mốc nào có scale() thì scale() phải đứng SAU translate (đúng thứ tự dịch-rồi-thu)', () => {
  for (const m of RADIAL_MENU_KEYFRAMES.match(/\b(from|to)\s*\{[^}]*\}/g) ?? []) {
    if (!/scale\(/.test(m)) continue;
    assert.ok(
      m.indexOf('translate(') < m.indexOf('scale('),
      `sai thứ tự transform (scale trước translate thì tâm co về gốc sai chỗ): ${m}`,
    );
  }
});

test('vẫn đúng tên animation mà component gọi', () => {
  assert.ok(/@keyframes\s+bt-in\b/.test(RADIAL_MENU_KEYFRAMES));
});

console.log(`\nradial.test.ts — ${pass}/${pass} PASS`);
