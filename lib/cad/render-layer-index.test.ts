/**
 * lib/cad/render-layer-index.test.ts — CHỐT CHẶN cho bảng tra lớp (LAYER_INDEX_CACHE) mới thêm
 * vào `render.ts` (thay `doc.layers.find(...)` quét tuyến tính bằng Map tra O(1)).
 *
 * Rủi ro DUY NHẤT của việc đổi này là **cache mù**: `doc.layers` đổi giữa chừng mà bảng tra
 * vẫn trả bản cũ ⇒ sai màu / sai bề dày / lớp ẩn vẫn hiện. Mỗi ca dưới đây là một đường THẬT
 * làm `doc.layers` đổi trong app:
 *   (1) store.ts đổi lớp bằng mảng MỚI (`.map`/spread)   (2) sửa TẠI CHỖ 1 Layer (visible)
 *   (3) `dxf.ts`/`dwg-map.ts` `push` vào mảng CŨ         (4) `splice` bỏ lớp khỏi mảng cũ
 *
 * Bắt màu nét bằng ctx GIẢ (Proxy nuốt mọi lệnh vẽ, chỉ ghi lại `strokeStyle`) — không cần DOM.
 * Chạy: node_modules/.bin/sucrase-node lib/cad/render-layer-index.test.ts
 */
import type { Doc, Entity, Layer, Viewport } from './model';
import { drawEntities, drawEntity } from './render';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean, got?: unknown) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label} → ${JSON.stringify(got)}`); }
}

/** ctx 2D giả: mọi phương thức là no-op, riêng gán `strokeStyle` thì ghi lại để kiểm. */
let strokes: string[] = [];
const noop = () => {};
const ctx = new Proxy({} as Record<string, unknown>, {
  get: (t, k) => (k === 'measureText' ? () => ({ width: 10 }) : k in t ? t[k as string] : noop),
  set: (t, k, v) => {
    if (k === 'strokeStyle') strokes.push(String(v));
    t[k as string] = v;
    return true;
  },
}) as unknown as CanvasRenderingContext2D;

const V: Viewport = { scale: 0.05, panX: 0, panY: 0 };
/** realLineweight:true ⇒ đi qua CẢ 3 đường tra lớp (màu · bề dày · nét đứt). */
const STYLE = { stroke: '#111111', lineWidth: 1, text: false, realLineweight: true };
const ent = (id: string, layer: string) =>
  ({ id, type: 'line', layer, a: { x: 0, y: 0 }, b: { x: 1, y: 1 } }) as Entity;
const draw = (d: Doc) => { strokes = []; drawEntities(ctx, V, d, STYLE); return strokes; };

const layers: Layer[] = [
  { id: 'l-a', name: 'A', color: '#aa0000', visible: true, locked: false },
  { id: 'l-b', name: 'B', color: '#00bb00', visible: true, locked: false },
];
const doc: Doc = { entities: [ent('e1', 'l-a'), ent('e2', 'l-b')], layers };

console.log('Bảng tra lớp — đường cơ bản');
{
  const s = draw(doc);
  ok('mỗi entity lấy đúng màu lớp của nó', s.join() === '#aa0000,#00bb00', s);
}

console.log('(1) store.ts thay mảng layers MỚI (map/spread) — cache phải theo mảng, không theo Doc');
{
  const doc2: Doc = { ...doc, layers: layers.map((l) => (l.id === 'l-a' ? { ...l, color: '#123456' } : l)) };
  const s2 = draw(doc2);
  ok('doc mới → thấy màu MỚI', s2[0] === '#123456', s2);
  const s1 = draw(doc);
  ok('doc cũ → vẫn màu CŨ (hai mảng không lây cache của nhau)', s1[0] === '#aa0000', s1);
}

console.log('(2) sửa TẠI CHỖ một Layer (ẩn lớp) — Map giữ tham chiếu nên thấy ngay, không cần dựng lại');
{
  layers[1].visible = false;
  const s = draw(doc);
  ok('lớp ẩn bị lọc, chỉ còn 1 entity được vẽ', s.length === 1 && s[0] === '#aa0000', s);
  layers[1].visible = true;
  ok('bật lại → 2 entity vẽ đủ', draw(doc).length === 2, strokes);
}

console.log('(3) push lớp vào mảng CŨ (đường nhập DXF/DWG) — khoá cache không đổi, chốt độ dài phải bắt');
{
  layers.push({ id: 'l-c', name: 'C', color: '#cc00cc', visible: true, locked: false });
  doc.entities.push(ent('e3', 'l-c'));
  const s = draw(doc);
  ok('tra được lớp vừa push, KHÔNG rơi về màu mặc định', s[2] === '#cc00cc', s);
}

console.log('(4) splice bỏ lớp khỏi mảng cũ — entity mồ côi rơi về màu mặc định của style');
{
  layers.splice(2, 1);
  const s = draw(doc);
  ok('entity mất lớp → dùng style.stroke', s[2] === '#111111', s);
}

console.log('(5) drawEntity gọi LẺ (đường highlight/preview của CadCanvas)');
{
  strokes = [];
  drawEntity(ctx, V, doc, doc.entities[1], STYLE);
  ok('vẫn đúng màu lớp khi không đi qua drawEntities', strokes[0] === '#00bb00', strokes);
}

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
