/**
 * lib/present-editor/shape-geometry.test.ts — kiểm phần THUẦN của hình học mask ảnh
 * (P1/E2, `docs/CHOT-NGUYEN-LIEU-EDITOR-2026-08-01.md`). Chạy:
 *   node_modules/.bin/sucrase-node lib/present-editor/shape-geometry.test.ts
 *
 * `imageMaskClipPath` THUẦN (không đụng DOM) — test trực tiếp. `imageMaskCanvasPath` cần
 * `CanvasRenderingContext2D` thật (trình duyệt, sucrase-node/Node không có) — test bằng ctx
 * GIẢ ghi lại lệnh gọi (beginPath/moveTo/lineTo/closePath/ellipse), đủ xác nhận ĐÚNG chuỗi
 * lệnh hình học mà không cần canvas thật (`render.ts#drawImageEl`/`export.ts` mới thật sự vẽ
 * lên canvas thật, chỉ chạy được ở trình duyệt — ngoài phạm vi test này).
 */
import { imageMaskClipPath, imageMaskCanvasPath, shapeClipPath } from './shape-geometry';
import type { ImageMask } from './model';

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

function testImageMaskClipPath() {
  console.log('\n[1] imageMaskClipPath — CSS clip-path cho mask ảnh');
  ok('không mask → undefined (ảnh chữ nhật/bo góc như cũ)', imageMaskClipPath(undefined) === undefined);
  ok(
    'ellipse → hàm ellipse() CSS (khớp box, kể cả không vuông)',
    imageMaskClipPath({ shape: 'ellipse' }) === 'ellipse(50% 50% at 50% 50%)',
  );
  ok(
    'triangle → TÁI DÙNG NGUYÊN shapeClipPath (không viết lại hình học lần 2)',
    imageMaskClipPath({ shape: 'triangle' }) === shapeClipPath('triangle'),
  );
  ok(
    'polygon 6 cạnh → TÁI DÙNG shapeClipPath với đúng sides',
    imageMaskClipPath({ shape: 'polygon', sides: 6 }) === shapeClipPath('polygon', 6),
  );
  ok('arrow → TÁI DÙNG shapeClipPath', imageMaskClipPath({ shape: 'arrow' }) === shapeClipPath('arrow'));
}

/** ctx GIẢ — chỉ ghi lại tên lệnh + toạ độ, không vẽ thật (không có canvas ở Node). */
function fakeCtx() {
  const calls: string[] = [];
  const ctx = {
    beginPath: () => calls.push('beginPath'),
    moveTo: (x: number, y: number) => calls.push(`moveTo(${x},${y})`),
    lineTo: (x: number, y: number) => calls.push(`lineTo(${x},${y})`),
    closePath: () => calls.push('closePath'),
    ellipse: (x: number, y: number, rx: number, ry: number) => calls.push(`ellipse(${x},${y},${rx},${ry})`),
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls };
}

function testImageMaskCanvasPath() {
  console.log('\n[2] imageMaskCanvasPath — path canvas khớp HÌNH DẠNG với clip-path CSS ở trên');

  const ellipseMask: ImageMask = { shape: 'ellipse' };
  const { ctx: c1, calls: calls1 } = fakeCtx();
  imageMaskCanvasPath(c1, ellipseMask, 10, 20, 100, 60);
  ok('ellipse: beginPath rồi ellipse() đúng tâm/bán trục (fx+fw/2, fy+fh/2, fw/2, fh/2)', calls1[0] === 'beginPath' && calls1[1] === 'ellipse(60,50,50,30)');
  ok('ellipse: KHÔNG closePath (ctx.ellipse() tự khép vòng)', !calls1.includes('closePath'));
  ok('ellipse: đúng 2 lệnh, không thừa moveTo/lineTo', calls1.length === 2);

  const triMask: ImageMask = { shape: 'triangle' };
  const { ctx: c2, calls: calls2 } = fakeCtx();
  imageMaskCanvasPath(c2, triMask, 0, 0, 100, 100);
  ok(
    'triangle: đúng 3 đỉnh (1 moveTo + 2 lineTo) rồi closePath',
    calls2.filter((c) => c.startsWith('moveTo')).length === 1 &&
      calls2.filter((c) => c.startsWith('lineTo')).length === 2 &&
      calls2[calls2.length - 1] === 'closePath',
  );
  ok('triangle: đỉnh đầu đúng toạ độ (0.5,0)×100 = (50,0)', calls2[1] === 'moveTo(50,0)');
  ok('triangle: 2 đỉnh sau đúng toạ độ (1,1) và (0,1) ×100', calls2[2] === 'lineTo(100,100)' && calls2[3] === 'lineTo(0,100)');

  const polyMask: ImageMask = { shape: 'polygon', sides: 4 };
  const { ctx: c3, calls: calls3 } = fakeCtx();
  imageMaskCanvasPath(c3, polyMask, 0, 0, 100, 100);
  ok('polygon 4 cạnh: 1 moveTo + 3 lineTo (4 đỉnh) rồi closePath', calls3.filter((c) => c.startsWith('moveTo')).length === 1 && calls3.filter((c) => c.startsWith('lineTo')).length === 3 && calls3[calls3.length - 1] === 'closePath');

  const arrowMask: ImageMask = { shape: 'arrow' };
  const { ctx: c4, calls: calls4 } = fakeCtx();
  imageMaskCanvasPath(c4, arrowMask, 0, 0, 100, 100);
  ok('arrow: 7 đỉnh (1 moveTo + 6 lineTo) rồi closePath — khớp polygonPoints01', calls4.filter((c) => c.startsWith('moveTo')).length === 1 && calls4.filter((c) => c.startsWith('lineTo')).length === 6 && calls4[calls4.length - 1] === 'closePath');

  // offset khác 0 (x/y khác gốc) — xác nhận toạ độ CỘNG offset chứ không thay thế.
  const { ctx: c5, calls: calls5 } = fakeCtx();
  imageMaskCanvasPath(c5, triMask, 10, 20, 100, 100);
  ok('có offset (x=10,y=20): đỉnh đầu dịch đúng (10+50, 20+0)', calls5[1] === 'moveTo(60,20)');
}

testImageMaskClipPath();
testImageMaskCanvasPath();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
