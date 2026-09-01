/**
 * lib/cad/render-cull.test.ts — CHỐT CHẶN cho VIEWPORT CULLING + chữ ký TẦNG TĨNH của
 * `drawEntities` (vá lag 01/09).
 *
 * Bốn thứ phải chứng minh:
 *  ① CÓ CULL: ctx mang canvas đo được ⇒ entity nằm trọn ngoài khung KHÔNG được vẽ.
 *  ② KHÔNG CULL OAN: dim/text/nhãn sát mép (trong vùng đệm) và transform không-thuần-scale
 *    vẫn vẽ ĐỦ — mọi ngờ vực nghiêng về phía vẽ.
 *  ③ KHÔNG ĐỔI THỨ TỰ: z-order 5 lượt giữ nguyên giữa các entity còn lại; ctx giả KHÔNG canvas
 *    (đúng khuôn test cũ `render-z-order`/`render-layer-index`) đi đường cũ, vẽ đủ 100%.
 *  ④ CHỮ KÝ TẦNG TĨNH đổi khi và chỉ khi đầu-vào-vẽ đổi (viewport, trạng thái lớp, giấy mực…).
 *    (Bản thân tầng tĩnh cần `document` nên không chạy trong Node — guard đó chính là điều
 *    đang kiểm ở ③: thiếu điều kiện thì rơi về đường vẽ thẳng, không âm thầm cache.)
 *
 * Chạy: node_modules/.bin/sucrase-node lib/cad/render-cull.test.ts
 */
import type { Doc, Entity, Layer, Viewport } from './model';
import { drawEntities, tangTinhSig, type DrawStyle } from './render';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean, got?: unknown) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label} → ${JSON.stringify(got)}`); }
}

/** ctx giả cùng khuôn `render-z-order.test.ts` — thêm được `canvas`/`getTransform` tuỳ ca. */
function taoCtx(extra: Record<string, unknown> = {}) {
  const log: string[] = [];
  const noop = () => {};
  const t: Record<string, unknown> = { ...extra };
  const ctx = new Proxy(t, {
    get: (tt, k) => {
      switch (k) {
        case 'measureText': return () => ({ width: 10 });
        case 'fill': return () => log.push(`fill ${String(tt.fillStyle)}`);
        case 'stroke': return () => log.push(`stroke ${String(tt.strokeStyle)}`);
        case 'strokeRect': return () => log.push(`stroke ${String(tt.strokeStyle)}`);
        case 'fillText': return () => log.push(`text ${String(tt.fillStyle)}`);
        default: return k in tt ? tt[k as string] : noop;
      }
    },
    set: (tt, k, v) => { tt[k as string] = v; return true; },
  }) as unknown as CanvasRenderingContext2D;
  return { ctx, log };
}

/** Khung nhìn: canvas 800×600, scale 1 (1px = 1mm), world hiển thị x 0..800, y 0..600. */
const V: Viewport = { scale: 1, panX: 0, panY: 600 };
const STYLE: DrawStyle = { stroke: '#111111', lineWidth: 1.3, text: true };

const layers: Layer[] = [
  { id: 'l-A', name: 'A', color: '#cc0000', visible: true, locked: false },
  { id: 'l-B', name: 'B', color: '#0000cc', visible: true, locked: false },
];
let seq = 0;
const line = (x: number, y: number, layer = 'l-A') =>
  ({ id: `e${++seq}`, type: 'line', layer, a: { x, y }, b: { x: x + 100, y: y + 100 } }) as Entity;
const docVoi = (es: Entity[]): Doc => ({ entities: es, layers } as Doc);

console.log('① viewport culling — entity ngoài khung không vẽ (khi canvas đo được)');
{
  const gan = line(100, 100);
  const xa = line(100000, 100000);
  const { ctx, log } = taoCtx({ canvas: { width: 800, height: 600 } });
  drawEntities(ctx, V, docVoi([gan, xa]), STYLE);
  ok('① line trong khung vẽ, line cách 100m bị bỏ qua', log.length === 1 && log[0] === 'stroke #cc0000', log);
}
{
  // ctx giả KHÔNG canvas (khuôn test cũ) ⇒ không cull, vẽ đủ — đường cũ nguyên vẹn.
  const { ctx, log } = taoCtx();
  drawEntities(ctx, V, docVoi([line(100, 100), line(100000, 100000)]), STYLE);
  ok('① thiếu canvas ⇒ không cull, vẽ đủ 2 (test ctx-giả cũ đi đường cũ)', log.length === 2, log);
}
{
  // vẽ 2 lượt liên tiếp trong Node (không document) ⇒ 2 lượt đều vẽ thật, không có cache ma.
  const d = docVoi([line(100, 100)]);
  const { ctx, log } = taoCtx({ canvas: { width: 800, height: 600 } });
  drawEntities(ctx, V, d, STYLE);
  drawEntities(ctx, V, d, STYLE);
  ok('① không document ⇒ không tầng tĩnh, 2 lượt = 2 lần vẽ', log.length === 2, log);
}

console.log('② không cull oan — đệm an toàn cho dim/nhãn, transform lạ thì thôi cull');
{
  // dim ngay NGOÀI mép phải (900..1500) nhưng trong vùng đệm chú thích ⇒ vẫn vẽ.
  const dimGan = { id: 'd1', type: 'dim', layer: 'l-A', a: { x: 900, y: 300 }, b: { x: 1500, y: 300 }, off: 0 } as unknown as Entity;
  const dimXa = { id: 'd2', type: 'dim', layer: 'l-A', a: { x: 50000, y: 50000 }, b: { x: 51000, y: 50000 }, off: 0 } as unknown as Entity;
  const { ctx, log } = taoCtx({ canvas: { width: 800, height: 600 } });
  drawEntities(ctx, V, docVoi([dimGan, dimXa]), STYLE);
  const strokes = log.filter((s) => s.startsWith('stroke')).length;
  const texts = log.filter((s) => s.startsWith('text')).length;
  ok('② dim sát mép vẫn vẽ (đệm), dim cách 50m bị bỏ (đúng 1 nhãn số)', strokes >= 1 && texts === 1, log);
}
{
  // text 'X' tại x=900 (trong đệm nhãn 260px) vẽ; tại x=1500 (ngoài đệm) bỏ.
  const t1 = { id: 't1', type: 'text', layer: 'l-A', at: { x: 900, y: 300 }, text: 'X', h: 300 } as unknown as Entity;
  const t2 = { id: 't2', type: 'text', layer: 'l-A', at: { x: 1500, y: 300 }, text: 'X', h: 300 } as unknown as Entity;
  const { ctx, log } = taoCtx({ canvas: { width: 800, height: 600 } });
  drawEntities(ctx, V, docVoi([t1, t2]), STYLE);
  ok('② text trong đệm vẽ, text ngoài đệm bỏ', log.length === 1 && log[0].startsWith('text'), log);
}
{
  // zone polygon ngoài khung nhưng labelPos người dùng kéo VÀO khung ⇒ phải vẽ (hộp ôm labelPos).
  const zone = {
    id: 'z1', type: 'zone', layer: 'l-A', group: 'social', label: 'KHU TIẾP KHÁCH', opacity: 0.4,
    color: '#0f0f0f',
    polygon: [{ x: 60000, y: 100 }, { x: 60800, y: 100 }, { x: 60800, y: 500 }, { x: 60000, y: 500 }],
    labelPos: { x: 400, y: 300 },
  } as unknown as Entity;
  const { ctx, log } = taoCtx({ canvas: { width: 800, height: 600 } });
  drawEntities(ctx, V, docVoi([zone]), STYLE);
  ok('② zone có labelPos trong khung ⇒ không bị cull dù biên ở xa', log.some((s) => s.includes('#0f0f0f')), log);
}
{
  // transform có xoay/nghiêng ⇒ không suy được khung ⇒ TẮT cull, vẽ đủ.
  const { ctx, log } = taoCtx({
    canvas: { width: 800, height: 600 },
    getTransform: () => ({ a: 1, b: 0.5, c: 0, d: 1, e: 0, f: 0 }),
  });
  drawEntities(ctx, V, docVoi([line(100, 100), line(100000, 100000)]), STYLE);
  ok('② transform không thuần scale ⇒ thôi cull, vẽ đủ 2', log.length === 2, log);
}
{
  // transform dpr (scale thuần ×2, canvas device 1600×1200 = CSS 800×600) ⇒ cull đúng như ca ①.
  const { ctx, log } = taoCtx({
    canvas: { width: 1600, height: 1200 },
    getTransform: () => ({ a: 2, b: 0, c: 0, d: 2, e: 0, f: 0 }),
  });
  drawEntities(ctx, V, docVoi([line(100, 100), line(100000, 100000)]), STYLE);
  ok('② dpr 2× ⇒ khung CSS 800×600, cull y ca ①', log.length === 1, log);
}

console.log('③ z-order 5 lượt giữ nguyên giữa các entity còn lại');
{
  const hatch = {
    id: 'h1', type: 'hatch', layer: 'l-A', solid: true,
    points: [{ x: 50, y: 50 }, { x: 300, y: 50 }, { x: 300, y: 200 }, { x: 50, y: 200 }],
  } as unknown as Entity;
  const text = { id: 't9', type: 'text', layer: 'l-B', at: { x: 100, y: 100 }, text: 'X', h: 200 } as unknown as Entity;
  const { ctx, log } = taoCtx({ canvas: { width: 800, height: 600 } });
  // stream: text → line xa (cull) → line gần → hatch. Kỳ vọng: fill hatch TRƯỚC, text CUỐI.
  drawEntities(ctx, V, docVoi([text, line(100000, 100000), line(100, 100), hatch]), STYLE);
  ok('③ hatch chìm đáy, text nổi cuối, line xa biến mất — thứ tự còn lại y luật cũ',
    log.length === 3 && log[0].startsWith('fill') && log[1] === 'stroke #cc0000' && log[2].startsWith('text'), log);
}

console.log('④ chữ ký tầng tĩnh — đổi khi và chỉ khi đầu vào vẽ đổi');
{
  const d = docVoi([line(100, 100)]);
  const sig = () => tangTinhSig(V, d, STYLE, 800, 600, 1, 1);
  const a = sig();
  ok('④ cùng đầu vào ⇒ cùng chữ ký', a === sig(), a.length);
  const b = tangTinhSig({ ...V, scale: 2 }, d, STYLE, 800, 600, 1, 1);
  ok('④ đổi zoom ⇒ chữ ký đổi', a !== b);
  layers[1].visible = false; // sửa TẠI CHỖ — không đổi danh tính mảng, chữ ký PHẢI bắt được
  const c = sig();
  ok('④ ẩn lớp tại chỗ ⇒ chữ ký đổi (cache không mù trước layer sửa tại chỗ)', a !== c);
  layers[1].visible = true;
  ok('④ bật lại ⇒ chữ ký về như cũ', a === sig());
  const e = tangTinhSig(V, d, { ...STYLE, giayMuc: { giay: '#FAF9F6', muc: '#1E1B16', accent: '#c08a5a' } }, 800, 600, 1, 1);
  ok('④ thêm giấy mực ⇒ chữ ký đổi', a !== e);
  const f = tangTinhSig(V, d, STYLE, 800, 600, 2, 2);
  ok('④ đổi dpr ⇒ chữ ký đổi', a !== f);
}

console.log(`\nrender-cull: ${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
