/**
 * lib/cad/render-z-order.test.ts — KHOÁ THỨ TỰ VẼ của `drawEntities` + NGÔN NGỮ THỊ GIÁC của
 * mảng tô MÁY SUY RA (`Entity.inferred`).
 * Chạy: `node_modules/.bin/sucrase-node lib/cad/render-z-order.test.ts`
 *
 * Hai bệnh đo được trên app thật (điều tra 31/08), cùng một gốc — **mảng tô vẽ SAU nét**:
 *   ① HATCH CHÌM: DXF của khách xếp `HATCH` ở bất kỳ đâu trong stream. Rơi vào sau một `LINE`
 *      là mảng tô ĐÈ mất chính nét ấy. Bản vẽ nghề thì poché luôn nằm DƯỚI mọi nét.
 *   ② TƯỜNG SUY RA đè nét gốc của khách: `tuongThanhEntities` sinh hatch poché SOLID, tức một
 *      SUY ĐOÁN của máy vẽ đậm ngang hàng dữ liệu người vẽ.
 *
 * ⚠️ Ca ĐỎ phải ĐỎ vì đúng lý do, nên mỗi khối đều có ĐỐI CHỨNG khoá phần KHÔNG được đổi — nếu
 * không, "sửa" bằng cách xếp lại bừa cả bản vẽ cũng qua bài.
 *
 * ctx GIẢ: Proxy nuốt mọi lệnh vẽ, chỉ ghi lại NHẬT KÝ THAO TÁC CÓ THỨ TỰ (`fill`/`stroke`/`text`
 * kèm màu · bề dày · alpha). Không cần DOM. Cùng khuôn `render-layer-index.test.ts` (luật 6 —
 * không đẻ khuôn test thứ hai); khác một điều: bản kia ghi MÀU, bản này ghi THỨ TỰ.
 */
import type { Doc, Entity, Layer, Viewport } from './model';
import { drawEntities, drawEntity } from './render';
import { mixHex } from './plan-depth';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean, got?: unknown) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label} → ${JSON.stringify(got)}`); }
}

/* ══ ctx giả: ghi nhật ký thao tác theo đúng thứ tự gọi ══ */
let log: string[] = [];
const noop = () => {};
const st: Record<string, unknown> = {};
const num = (v: unknown) => (typeof v === 'number' ? Math.round(v * 100) / 100 : v);
const ctx = new Proxy(st, {
  get: (t, k) => {
    switch (k) {
      case 'measureText': return () => ({ width: 10 });
      case 'fill': return () => log.push(`fill ${String(t.fillStyle)} a=${num(t.globalAlpha ?? 1)}`);
      case 'stroke': return () => log.push(`stroke ${String(t.strokeStyle)} w=${num(t.lineWidth)}`);
      case 'strokeRect': return () => log.push(`stroke ${String(t.strokeStyle)} w=${num(t.lineWidth)}`);
      case 'fillText': return () => log.push(`text ${String(t.fillStyle)}`);
      default: return k in t ? t[k as string] : noop;
    }
  },
  set: (t, k, v) => { t[k as string] = v; return true; },
}) as unknown as CanvasRenderingContext2D;

const V: Viewport = { scale: 0.05, panX: 0, panY: 0 };
/** realLineweight:true ⇒ bề dày đi qua đúng đường tính thật, so được số. */
const BASE = { stroke: '#111111', lineWidth: 1.3, text: true, realLineweight: true };
const NEN = '#141210';                        // nền canvas sống của IF (`--bg`)
const STYLE_NEN = { ...BASE, background: NEN };
const draw = (d: Doc, style: Record<string, unknown> = BASE) => {
  log = [];
  drawEntities(ctx, V, d, style as never);
  return log;
};
/** chỉ giữ động từ + màu — đọc cho nhanh khi FAIL. */
const verbs = (l: string[]) => l.map((s) => s.split(' ').slice(0, 2).join(' '));

const layers: Layer[] = [
  { id: 'l-A', name: 'A-Draw', color: '#cc0000', visible: true, locked: false, lineweight: 0.25 },
  { id: 'l-B', name: 'B', color: '#0000cc', visible: true, locked: false, lineweight: 0.25 },
];
let seq = 0;
const line = (layer = 'l-A', extra: Partial<Entity> = {}) =>
  ({ id: `e${++seq}`, type: 'line', layer, a: { x: 0, y: 0 }, b: { x: 5000, y: 0 }, ...extra }) as Entity;
const hatch = (layer = 'l-A', extra: Partial<Entity> = {}) =>
  ({
    id: `e${++seq}`, type: 'hatch', layer, solid: true,
    points: [{ x: 0, y: -100 }, { x: 5000, y: -100 }, { x: 5000, y: 100 }, { x: 0, y: 100 }],
    ...extra,
  }) as Entity;
const docVoi = (es: Entity[]): Doc => ({ entities: es, layers } as Doc);
/** màu poché tạm mà mã PHẢI cho ra — tính lại tại chỗ, không chép hằng số chết vào test. */
const MAU_TAM = mixHex('#cc0000', NEN, 0.72);

/* ═══════════════════════ ① HATCH CHÌM ═══════════════════════ */
console.log('① HATCH luôn nằm DƯỚI mọi nét, bất kể vị trí trong stream');
{
  // ĐỎ trước khi sửa: hatch đứng SAU line trong stream ⇒ fill gọi sau stroke ⇒ ăn mất nét.
  const l = draw(docVoi([line(), hatch()]));
  ok('① hatch đứng SAU line trong stream vẫn được vẽ TRƯỚC (fill trước mọi stroke)',
    verbs(l)[0] === 'fill #cc0000' && verbs(l).slice(1).every((s) => s.startsWith('stroke')), l);
}
{
  // ĐỐI CHỨNG: hatch vốn đã đứng trước thì không được xáo đi đâu cả.
  const l = draw(docVoi([hatch(), line()]));
  ok('① hatch vốn đứng TRƯỚC ⇒ giữ nguyên', verbs(l)[0] === 'fill #cc0000', l);
}
{
  // ĐỐI CHỨNG: thứ tự GIỮA các hatch với nhau vẫn là insertion-order, không được sắp lại.
  const l = draw(docVoi([hatch('l-B'), line(), hatch('l-A')]));
  ok('① nhiều hatch giữ nguyên thứ tự chèn với nhau',
    verbs(l).slice(0, 2).join('|') === 'fill #0000cc|fill #cc0000', l);
}
{
  // ĐỐI CHỨNG KHÔNG-HỒI-QUY: bản vẽ KHÔNG có hatch ⇒ nhật ký y hệt insertion-order như trước.
  const l = draw(docVoi([line('l-A'), line('l-B'), line('l-A')]));
  ok('① doc không hatch ⇒ thứ tự y nguyên',
    verbs(l).join('|') === 'stroke #cc0000|stroke #0000cc|stroke #cc0000', l);
}
{
  // ĐỐI CHỨNG: khuôn 3 lượt cũ (Zone tool N2) còn nguyên — overlay ĐÈ hình học, text vẫn CUỐI.
  const arrow = { id: 'a1', type: 'arrow', layer: 'l-B', path: [{ x: 0, y: 0 }, { x: 1000, y: 0 }] } as unknown as Entity;
  const text = { id: 't1', type: 'text', layer: 'l-A', at: { x: 0, y: 0 }, text: 'X', h: 200 } as unknown as Entity;
  const l = draw(docVoi([text, arrow, line(), hatch()]));
  ok('① hatch xuống đáy, dưới cả overlay', l[0] === 'fill #cc0000 a=0.9', l);
  ok('① lượt cuối vẫn là text (nhãn không bao giờ bị màng màu che)', l[l.length - 1].startsWith('text'), l);
  ok('① overlay vẫn nằm SAU hình học',
    l.findIndex((s) => s.includes('#0000cc')) > l.findIndex((s) => s.startsWith('stroke #cc0000')), l);
}

/* ═══════════════════════ ② TƯỜNG SUY RA — poché tạm CÓ NHÃN ═══════════════════════ */
console.log('② mảng tô MÁY SUY RA: nhạt hơn, mảnh hơn, và nằm dưới cùng');
{
  const l = draw(docVoi([line(), hatch('l-A', { inferred: true })]), STYLE_NEN);
  const fills = l.filter((s) => s.startsWith('fill'));
  ok('② hatch suy ra KHÔNG tô bằng màu gốc của lớp',
    fills.length === 1 && !fills[0].includes('#cc0000'), l);
  ok('② …mà pha về NỀN đúng công thức mixHex', fills[0].includes(MAU_TAM), fills);
  ok('② …và KHÔNG dùng alpha (alpha chồng alpha ra vệt đậm giả)', fills[0].endsWith('a=1'), fills);
  ok('② hatch suy ra vẫn nằm TRƯỚC nét gốc của khách', l[0].startsWith('fill'), l);
  ok('② nét gốc của khách KHÔNG bị pha, vẫn đậm nguyên', l[l.length - 1] === 'stroke #cc0000 w=1', l);
}
{
  // Máy đoán không được đè dữ liệu người — kể cả mảng tô của người.
  const l = draw(docVoi([hatch('l-B'), hatch('l-A', { inferred: true })]), STYLE_NEN);
  const iSuyRa = l.findIndex((s) => s.startsWith('fill') && s.includes(MAU_TAM));
  const iNguoi = l.findIndex((s) => s.includes('#0000cc'));
  ok('② hatch suy ra xuống ĐÁY, dưới cả hatch người vẽ', iSuyRa === 0 && iNguoi > iSuyRa, l);
}
{
  const w = (s: string) => Number(s.split('w=')[1]);
  const lNguoi = draw(docVoi([line('l-A')]), STYLE_NEN);
  const lMay = draw(docVoi([line('l-A', { inferred: true })]), STYLE_NEN);
  ok('② viền lớp suy ra MẢNH hơn nét người vẽ', w(lMay[0]) < w(lNguoi[0]), [lNguoi, lMay]);
  ok('② …và nhạt đi theo cùng một công thức', lMay[0].includes(MAU_TAM), lMay);
}
{
  // CHƯA BIẾT NỀN ⇒ KHÔNG ĐOÁN (K3): pha nhầm hướng thì lớp "nhạt" lại SÁNG LÊN trên nền tối,
  // tức đè mạnh hơn cả lúc chưa sửa. Thà chỉ viền còn hơn tô sai chiều.
  const l = draw(docVoi([hatch('l-A', { inferred: true })]), BASE);
  ok('② thiếu `background` ⇒ chỉ viền, KHÔNG tô bừa', l.length === 1 && l[0].startsWith('stroke'), l);
}
{
  // ĐỐI CHỨNG BIT-IDENTICAL: cờ NEXT_PUBLIC_IF_TUONG_HINH_HOC tắt ⇒ doc KHÔNG có entity
  // `inferred` nào ⇒ nhánh mới không được chạm một byte nào của đường vẽ cũ.
  const sach = docVoi([hatch('l-A'), line('l-A')]);
  const a = draw(sach, BASE);
  const b = draw(sach, STYLE_NEN);
  ok('② doc KHÔNG có `inferred` ⇒ có hay không có `background` đều cho ra y hệt',
    a.join('|') === b.join('|'), [a, b]);
  ok('② …và vẫn đúng màu + alpha + bề dày GỐC như trước 31/08',
    a.join('|') === 'fill #cc0000 a=0.9|stroke #cc0000 w=1', a);
}
{
  // Đường highlight/preview của CadCanvas gọi drawEntity LẺ — nó cũng phải hiểu lớp tạm.
  log = [];
  drawEntity(ctx, V, docVoi([]), hatch('l-A', { inferred: true }), STYLE_NEN as never);
  ok('② drawEntity gọi lẻ cũng áp ngôn ngữ tạm',
    log.some((s) => s.startsWith('fill') && s.includes(MAU_TAM)), log);
}
{
  /* ĐỐI CHỨNG: `forceColor` THẮNG lớp tạm. Nơi gọi ép màu là đang vẽ lớp ACCENT có chủ đích
   * (highlight vật đang chọn, ghost preview). Pha nhạt một lớp accent là làm hỏng đúng việc nó
   * sinh ra để làm — tường suy ra được chọn thì phải sáng lên như mọi vật khác. */
  log = [];
  drawEntity(ctx, V, docVoi([]), hatch('l-A', { inferred: true }),
    { ...STYLE_NEN, forceColor: '#e0603a', outlineOnly: true } as never);
  ok('② highlight accent vẫn thắng lớp tạm, không bị pha mờ',
    log.length === 1 && log[0].startsWith('stroke #e0603a'), log);
}

console.log(`\nrender-z-order: ${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
