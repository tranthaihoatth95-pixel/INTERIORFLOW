/**
 * lib/present-editor/fill-overlay.test.ts — kiểm phần THUẦN của lớp phủ FILL (P3/E3,
 * `docs/CHOT-NGUYEN-LIEU-EDITOR-2026-08-01.md`). Chạy:
 *   node_modules/.bin/sucrase-node lib/present-editor/fill-overlay.test.ts
 *
 * `fillOverlayCss` VÀ `applyFillOverlayStyle` đều sống ở shape-geometry.ts (chuyển từ render.ts
 * sang 04/08 — hàm chỉ cần `CanvasRenderingContext2D` truyền vào, không đụng `@/lib/imaging`/
 * `document` như phần còn lại của render.ts, nên tách ra để test được qua sucrase-node mà không
 * phải kéo theo import nặng). `fillOverlayCss` THUẦN — test trực tiếp. `applyFillOverlayStyle`
 * cần `CanvasRenderingContext2D` thật — test bằng ctx GIẢ ghi lại fillStyle/globalAlpha/
 * globalCompositeOperation + tham số gọi createLinearGradient/createRadialGradient
 * (cùng kiểu ctx giả với `shape-geometry.test.ts`), đủ xác nhận ĐÚNG mà không cần canvas thật.
 * Mục tiêu chính: xác nhận CSS (xem-trước) và canvas (xuất PDF/PNG/PPTX) ra CÙNG 1 gradient —
 * so `fillOverlayCss` (chuỗi CSS) với thứ tự stop mà `applyFillOverlayStyle` gọi trên ctx giả.
 */
import { fillOverlayCss, applyFillOverlayStyle } from './shape-geometry';
import type { FillOverlay } from './model';

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

function testFillOverlayCssDirectional() {
  console.log('\n[1] fillOverlayCss — hướng ltr/rtl/ttb/btt: color ở đầu, colorTo ở cuối');
  const o: FillOverlay = { kind: 'gradient', color: '#111111', colorTo: '#eeeeee', direction: 'ltr', opacity: 1 };
  ok(
    'ltr → linear-gradient(to right, color 0%, colorTo 100%)',
    fillOverlayCss(o) === 'linear-gradient(to right, #111111 0%, #eeeeee 100%)',
  );
  ok(
    'rtl → to left',
    fillOverlayCss({ ...o, direction: 'rtl' }) === 'linear-gradient(to left, #111111 0%, #eeeeee 100%)',
  );
  ok(
    'ttb → to bottom',
    fillOverlayCss({ ...o, direction: 'ttb' }) === 'linear-gradient(to bottom, #111111 0%, #eeeeee 100%)',
  );
  ok(
    'btt → to top',
    fillOverlayCss({ ...o, direction: 'btt' }) === 'linear-gradient(to top, #111111 0%, #eeeeee 100%)',
  );
}

function testFillOverlayCssCenterEdges() {
  console.log('\n[2] fillOverlayCss — center/edges: đảo thứ tự colorTo/color (khớp makeOverlayGradient)');
  const o: FillOverlay = { kind: 'gradient', color: '#111111', colorTo: '#eeeeee', direction: 'center', opacity: 1 };
  ok(
    'center → radial, colorTo ở tâm (0%), color ở rìa (100%)',
    fillOverlayCss(o) === 'radial-gradient(circle at center, #eeeeee 0%, #111111 100%)',
  );
  ok(
    'edges → linear to right, colorTo/color/colorTo (đối xứng)',
    fillOverlayCss({ ...o, direction: 'edges' }) ===
      'linear-gradient(to right, #eeeeee 0%, #111111 50%, #eeeeee 100%)',
  );
}

function testFillOverlayCssColorToFallback() {
  console.log('\n[3] fillOverlayCss — không truyền colorTo → dùng lại color (dải đồng màu, hợp lệ)');
  const o: FillOverlay = { kind: 'gradient', color: '#8a6f4d', direction: 'ltr', opacity: 1 };
  ok('colorTo rỗng → cả 2 đầu cùng color', fillOverlayCss(o) === 'linear-gradient(to right, #8a6f4d 0%, #8a6f4d 100%)');
}

/** ctx GIẢ — ghi fillStyle/alpha/composite + tham số gọi tạo gradient (không vẽ thật). */
function fakeCtx() {
  const log: string[] = [];
  let fillStyle: unknown = '';
  let globalAlpha = 1;
  let globalCompositeOperation = 'source-over';
  const ctx = {
    get fillStyle() {
      return fillStyle;
    },
    set fillStyle(v: unknown) {
      fillStyle = v;
    },
    get globalAlpha() {
      return globalAlpha;
    },
    set globalAlpha(v: number) {
      globalAlpha = v;
    },
    get globalCompositeOperation() {
      return globalCompositeOperation;
    },
    set globalCompositeOperation(v: string) {
      globalCompositeOperation = v;
    },
    createLinearGradient: (x0: number, y0: number, x1: number, y1: number) => {
      log.push(`createLinearGradient(${x0},${y0},${x1},${y1})`);
      const stops: string[] = [];
      return { addColorStop: (o: number, c: string) => { stops.push(`${o}:${c}`); log.push(`addColorStop(${o},${c})`); }, _stops: stops };
    },
    createRadialGradient: (x0: number, y0: number, r0: number, x1: number, y1: number, r1: number) => {
      log.push(`createRadialGradient(${x0},${y0},${r0},${x1},${y1},${r1})`);
      const stops: string[] = [];
      return { addColorStop: (o: number, c: string) => { stops.push(`${o}:${c}`); log.push(`addColorStop(${o},${c})`); }, _stops: stops };
    },
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, log, getState: () => ({ fillStyle, globalAlpha, globalCompositeOperation }) };
}

function testApplyFillOverlayStyleColor() {
  console.log('\n[4] applyFillOverlayStyle — kind "color": fillStyle = màu thẳng, KHÔNG tạo gradient');
  const { ctx, log, getState } = fakeCtx();
  const o: FillOverlay = { kind: 'color', color: '#ff0000', opacity: 0.5 };
  applyFillOverlayStyle(ctx, o, 1, 0, 0, 100, 50);
  ok('fillStyle = màu thẳng', getState().fillStyle === '#ff0000');
  ok('KHÔNG gọi createLinearGradient/createRadialGradient', log.length === 0);
  ok('globalAlpha = baseAlpha(1) × overlay.opacity(0.5) = 0.5', getState().globalAlpha === 0.5);
  ok('không có blend → composite mặc định source-over', getState().globalCompositeOperation === 'source-over');
}

function testApplyFillOverlayStyleAlphaNhanDon() {
  console.log('\n[5] applyFillOverlayStyle — alpha NHÂN DỒN với baseAlpha (opacity element)');
  const { ctx, getState } = fakeCtx();
  applyFillOverlayStyle(ctx, { kind: 'color', color: '#000', opacity: 0.5 }, 0.4, 0, 0, 10, 10);
  ok('globalAlpha = 0.4 × 0.5 = 0.2', Math.abs(getState().globalAlpha - 0.2) < 1e-9);
}

function testApplyFillOverlayStyleOpacityClamp() {
  console.log('\n[6] applyFillOverlayStyle — overlay.opacity chặn trong [0,1] (dữ liệu lỗi vẫn an toàn)');
  const { ctx: c1, getState: g1 } = fakeCtx();
  applyFillOverlayStyle(c1, { kind: 'color', color: '#000', opacity: 5 }, 1, 0, 0, 10, 10);
  ok('opacity > 1 → chặn ở 1', g1().globalAlpha === 1);
  const { ctx: c2, getState: g2 } = fakeCtx();
  applyFillOverlayStyle(c2, { kind: 'color', color: '#000', opacity: -3 }, 1, 0, 0, 10, 10);
  ok('opacity âm → chặn ở 0', g2().globalAlpha === 0);
}

function testApplyFillOverlayStyleBlend() {
  console.log('\n[7] applyFillOverlayStyle — blend khác "normal" → composite đúng tên đó');
  const { ctx, getState } = fakeCtx();
  applyFillOverlayStyle(ctx, { kind: 'color', color: '#000', opacity: 1, blend: 'multiply' }, 1, 0, 0, 10, 10);
  ok('composite = multiply', getState().globalCompositeOperation === 'multiply');
}

function testApplyFillOverlayStyleGradientDirectional() {
  console.log('\n[8] applyFillOverlayStyle — kind "gradient" hướng ltr: linear (fx,fy)→(fx+fw,fy), stop color→colorTo');
  const { ctx, log } = fakeCtx();
  applyFillOverlayStyle(
    ctx,
    { kind: 'gradient', color: '#111111', colorTo: '#eeeeee', direction: 'ltr', opacity: 1 },
    1,
    10,
    20,
    100,
    50,
  );
  ok('createLinearGradient(10,20,110,20) — từ trái sang phải khung', log[0] === 'createLinearGradient(10,20,110,20)');
  ok('stop 0 = color, stop 1 = colorTo (KHỚP thứ tự fillOverlayCss ltr)', log[1] === 'addColorStop(0,#111111)' && log[2] === 'addColorStop(1,#eeeeee)');
}

function testApplyFillOverlayStyleGradientCenter() {
  console.log('\n[9] applyFillOverlayStyle — kind "gradient" hướng center: radial, stop colorTo→color (KHỚP fillOverlayCss center)');
  const { ctx, log } = fakeCtx();
  applyFillOverlayStyle(
    ctx,
    { kind: 'gradient', color: '#111111', colorTo: '#eeeeee', direction: 'center', opacity: 1 },
    1,
    0,
    0,
    100,
    50,
  );
  ok('createRadialGradient tâm khung, bán kính = max(fw,fh)/2 = 50', log[0] === 'createRadialGradient(50,25,0,50,25,50)');
  ok('stop 0 = colorTo, stop 1 = color', log[1] === 'addColorStop(0,#eeeeee)' && log[2] === 'addColorStop(1,#111111)');
}

testFillOverlayCssDirectional();
testFillOverlayCssCenterEdges();
testFillOverlayCssColorToFallback();
testApplyFillOverlayStyleColor();
testApplyFillOverlayStyleAlphaNhanDon();
testApplyFillOverlayStyleOpacityClamp();
testApplyFillOverlayStyleBlend();
testApplyFillOverlayStyleGradientDirectional();
testApplyFillOverlayStyleGradientCenter();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
