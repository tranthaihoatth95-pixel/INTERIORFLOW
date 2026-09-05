/**
 * components/three/ve3d-css.test.ts — máy canh cho lỗi CẮT CỤT VIEWPORT 3D TRÊN RETINA.
 * Chạy: `node_modules/.bin/sucrase-node components/three/ve3d-css.test.ts`
 *
 * VÌ SAO CÓ TỆP NÀY: `Scene3DViewer.tsx` gọi `setSize(w, h, FALSE)` (không ghi style) kèm
 * `setPixelRatio(min(dpr, 1.5))`. Với `setSize(…, false)`, three.js CỐ Ý không đụng style — hợp
 * đồng là CSS phải tự ghim cỡ hiển thị của canvas. Thiếu luật đó thì trình duyệt vẽ canvas ở đúng
 * cỡ BUFFER, tức container × 1.5.
 *
 * ĐO ĐƯỢC (Chromium, khung 600×400):
 *    DPR = 1  → canvas 600×400, tràn 0px      ← vì thế bộ kiểm headless mặc định KHÔNG BAO GIỜ bắt được
 *    DPR = 2, không vá → canvas 900×600, TRÀN 300px, bị `.vp3d{overflow:hidden}` cắt cụt
 *    DPR = 2, có vá    → canvas 600×400, tràn 0px, buffer vẫn 900×600 (vẫn nét)
 *
 * ⚠️ Xoá luật `.vpscene>canvas` mà không đồng thời đổi `setSize(…, false)` thành `true` là làm
 * hỏng lại đúng lỗi này — chỉ người dùng màn retina thấy, còn máy CI thì im.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

let fail = 0;
function ok(msg: string, cond: unknown) {
  if (cond) console.log('  ok  -', msg);
  else { fail += 1; console.log('  FAIL -', msg); }
}
const ROOT = join(__dirname, '..', '..');
const CSS = readFileSync(join(ROOT, 'components', 'three', 've3d-css.ts'), 'utf8');
const VIEWER = readFileSync(join(ROOT, 'components', 'three', 'Scene3DViewer.tsx'), 'utf8');

console.log('\nve3d-css — chống cắt cụt viewport 3D trên retina');

const luat = /\.vpscene\s*>\s*canvas\s*\{([^}]*)\}/.exec(CSS);
ok('có luật ghim cỡ hiển thị cho canvas trong .vpscene', !!luat);
ok('luật ghim CẢ chiều rộng và chiều cao theo container', !!luat && /width:\s*100%/.test(luat[1]) && /height:\s*100%/.test(luat[1]));
ok('canvas là display:block (bỏ khoảng thừa của inline)', !!luat && /display:\s*block/.test(luat[1]));

// Nếu ai đó đổi sang setSize(..., true) thì three.js tự ghi style và luật CSS thành thừa —
// lúc đó test này phải được viết lại có ý thức, không im lặng bỏ qua.
const setSizeFalse = /setSize\([^)]*,\s*false\s*\)/.test(VIEWER);
ok('Scene3DViewer vẫn dùng setSize(…, false) — tiền đề của luật CSS trên còn đúng', setSizeFalse);
ok('Scene3DViewer vẫn đặt pixelRatio > 1 (nguồn của độ lệch buffer/hiển thị)', /setPixelRatio\(/.test(VIEWER));

console.log(`\n${fail ? '❌' : '✅'} ve3d-css: ${fail ? fail + ' fail' : 'tất cả đạt'}`);
process.exit(fail ? 1 : 0);
