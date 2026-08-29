/**
 * lib/cad/dxf-worker-tuong.test.ts — khoá ĐIỂM GỌI DUY NHẤT của bộ nhận diện tường hình học
 * (`lib/cad/dxf-worker.ts`, ngay sau `parseDxfEx`).
 * Chạy: `node_modules/.bin/sucrase-node lib/cad/dxf-worker-tuong.test.ts`
 *
 * 🔴 **NGHIỆM THU SỐ 1 CỦA CẢ VIỆC NÀY: CỜ TẮT ⇒ KHÔNG SUY SUYỂN MỘT CHÚT NÀO.**
 * Test module thuần (`tuong-hinh-hoc.test.ts`) chứng minh thuật toán đúng, nhưng nó KHÔNG chứng
 * minh được điều đó — chỉ có chạy đúng cái worker mà tệp DXF của người dùng đi qua mới chứng minh
 * được. Nên ở đây dựng `self` giả rồi nạp thật `dxf-worker.ts`, bơm một tệp DXF vào, và so `doc`
 * trả ra với `doc` của `parseDxfEx` trần: phải BẰNG NHAU TỪNG BYTE.
 *
 * `dxf-worker.ts` chỉ dùng `self.addEventListener` + `self.postMessage` (đúng 2 hàm, xem docstring
 * của nó) nên giả được trọn vẹn, không cần môi trường Worker thật.
 */
import { exportDxf, parseDxfEx } from './dxf';
import { emptyDoc } from './model';
import type { Doc, Entity } from './model';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

/* Một bức tường vẽ đúng kiểu thợ: hai đường song song cách 200mm, KHÔNG có hatch poché nào. */
const banVe: Doc = {
  ...emptyDoc(),
  layers: [{ id: 'l-A', name: 'A-Draw', color: '#ffffff', visible: true, locked: false }],
  entities: [
    { id: 'e1', type: 'line', layer: 'l-A', a: { x: 0, y: 100 }, b: { x: 5000, y: 100 } },
    { id: 'e2', type: 'line', layer: 'l-A', a: { x: 0, y: -100 }, b: { x: 5000, y: -100 } },
  ] as Entity[],
};
const DXF = exportDxf(banVe);

/* ── self giả: worker chỉ cần đúng 2 hàm này ── */
interface Msg { kind: string; doc?: Doc; report?: Record<string, unknown>; message?: string }
const nhan: Msg[] = [];
let onMessage: ((ev: { data: { text?: string } }) => void) | null = null;
(globalThis as unknown as { self: unknown }).self = {
  addEventListener: (_t: string, fn: (ev: { data: { text?: string } }) => void) => { onMessage = fn; },
  postMessage: (m: Msg) => nhan.push(m),
};

const cuCo = process.env.NEXT_PUBLIC_IF_TUONG_HINH_HOC;
delete process.env.NEXT_PUBLIC_IF_TUONG_HINH_HOC;

// Nạp SAU khi đã dựng `self` — worker gắn listener ngay lúc nạp.
// eslint-disable-next-line @typescript-eslint/no-var-requires -- phải nạp trễ, xem trên
require('./dxf-worker');
ok('worker gắn được listener', typeof onMessage === 'function');

function chay(text: string): Msg {
  nhan.length = 0;
  onMessage!({ data: { text } });
  const done = nhan.find((m) => m.kind === 'done');
  if (!done) throw new Error(`worker không trả 'done': ${JSON.stringify(nhan)}`);
  return done;
}

/* ══ ① CỜ TẮT — y hệt hôm nay, không một byte khác ══ */
{
  const tran = parseDxfEx(DXF);
  const ra = chay(DXF);
  ok('① số entity y hệt parseDxfEx trần', ra.doc!.entities.length === tran.doc.entities.length);
  /* So SAU KHI BỎ ID: `parseDxfEx` cấp id layer kèm một `uid` tăng dần theo mỗi lần nạp
   * (`dxf.ts` `ensureLayer`: `l-${nm}-${uid}`) — hai lần nạp CÙNG một tệp đã khác id sẵn từ trước
   * việc này. So chuỗi thô sẽ đỏ vì lý do chẳng liên quan gì tới cờ. Cái cần khoá là HÌNH HỌC +
   * thuộc tính, và nó phải trùng khít. */
  const khongId = (d: Doc) => JSON.stringify({
    e: d.entities.map(({ id, layer, ...r }) => r),
    l: d.layers.map((l) => l.name),
  });
  ok('① doc TRÙNG KHÍT (bỏ id do parse tự cấp)', khongId(ra.doc!) === khongId(tran.doc));
  ok('① báo cáo TRÙNG KHÍT từng byte', JSON.stringify(ra.report) === JSON.stringify(tran.report));
  ok('① không có trường tuongHinhHoc trong báo cáo', ra.report!.tuongHinhHoc === undefined);
  ok('① KHÔNG sinh hatch nào (bản vẽ gốc chỉ có 2 line)',
    ra.doc!.entities.every((e) => e.type === 'line'));
}

/* ══ ② CỜ BẬT — bản vẽ nghề đi được vào IF ══ */
{
  process.env.NEXT_PUBLIC_IF_TUONG_HINH_HOC = '1';
  const truoc = parseDxfEx(DXF).doc.entities.length;
  const ra = chay(DXF);
  ok('② nét gốc vẫn còn nguyên (THÊM, không thay thế)', ra.doc!.entities.length === truoc + 2);
  const them = ra.doc!.entities.slice(truoc);
  ok('② sinh ra tường THẬT của IF: hatch poché + đường bao',
    them.some((e) => e.type === 'hatch' && e.elementType === 'wall') &&
    them.some((e) => e.type === 'polyline' && e.elementType === 'wall'));
  ok('② bề dày đọc đúng con số người vẽ gõ vào OFFSET (200mm)',
    them.every((e) => e.wallThicknessMm === 200));
  const dd = ra.report!.tuongHinhHoc as { sauGopChum: number; tongDaiMm: number } | undefined;
  ok('② báo cáo mang số đo để nghiệm thu', !!dd && dd.sauGopChum === 1 && Math.abs(dd.tongDaiMm - 5000) <= 2);
}

/* ══ ③ CỜ BẬT trên bản vẽ KHÔNG có tường ⇒ không thêm gì, không nổ ══ */
{
  const trong = exportDxf({ ...emptyDoc(), layers: banVe.layers, entities: [] });
  const ra = chay(trong);
  ok('③ bản vẽ trống ⇒ 0 entity, worker vẫn trả done', ra.doc!.entities.length === 0);
}

/* ══ ④ lỗi vẫn báo đúng như cũ ══ */
{
  nhan.length = 0;
  onMessage!({ data: {} });
  ok('④ không có text ⇒ trả error như cũ', nhan.length === 1 && nhan[0].kind === 'error');
}

if (cuCo === undefined) delete process.env.NEXT_PUBLIC_IF_TUONG_HINH_HOC;
else process.env.NEXT_PUBLIC_IF_TUONG_HINH_HOC = cuCo;

console.log(`\ndxf-worker × tuong-hinh-hoc: ${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
