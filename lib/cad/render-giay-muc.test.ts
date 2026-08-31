/**
 * lib/cad/render-giay-muc.test.ts — NGHIỆM THU NGÔN NGỮ CANVAS "GIẤY MỰC" (đợt A).
 * Chạy: `node_modules/.bin/sucrase-node lib/cad/render-giay-muc.test.ts`
 *
 * Đặc tả: `docs/control/IF-GIAY-MUC.md` — Hoà chốt + mắt chủ chấm "ỔN" 17:20 · 31/08, trên mock
 * `giay-muc-v1`. Bảy luật; đợt A thi công luật **1 · 2 · 3 · 4 · 5**, luật **6 (halftone vẽ-đè)**
 * và **7 (accent theo bộ)** còn là TODO có tên trong `render.ts` — xem `GIAY_MUC_CON_NO`.
 *
 * ⚠️ **VÌ SAO CÓ TỆP NÀY, KHÔNG NHÉT VÀO `render-z-order.test.ts`:** bản kia khoá THỨ TỰ vẽ và
 * ngôn ngữ lớp máy suy ra của bản **trước** giấy-mực. Hai bộ luật sống song song có chủ đích —
 * style KHÔNG mang `giayMuc` thì đường vẽ phải chạy y hệt hôm qua, không lệch một byte (ca ⑦).
 * Trộn hai bộ vào một tệp là đánh mất chính cái đối chứng đó.
 *
 * ctx GIẢ: cùng khuôn `render-z-order.test.ts` / `render-layer-index.test.ts` (luật 6 — không đẻ
 * khuôn test thứ ba). Proxy nuốt mọi lệnh vẽ, chỉ ghi NHẬT KÝ THAO TÁC có thứ tự.
 */
import type { Doc, Entity, Layer, Viewport } from './model';
import { drawEntities, drawEntity, BE_DAY_MUC, GIAY_MUC_PHA, SAN_NET_PX, TI_LE_MAC_DINH, bacMucCua, netMuc } from './render';
import type { GiayMuc } from './render';
import { mixHex } from './plan-depth';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean, got?: unknown) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label} → ${JSON.stringify(got)}`); }
}

/* ══ ctx giả ══ */
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

/* ══ khuôn dữ liệu ══ */
const GIAY = '#FAF9F6';   // luật 1 — trắng giấy ấm, một màu phẳng
const MUC = '#1E1B16';
const ACCENT = '#c08a5a'; // luật 7 — dẫn xuất từ BỘ; đợt A nhận qua tham số, chưa tự trích
const GM: GiayMuc = { giay: GIAY, muc: MUC, accent: ACCENT };

const layers: Layer[] = [
  { id: 'l-A', name: 'A-Draw', color: '#cc0000', visible: true, locked: false },
  { id: 'l-B', name: 'B-Note', color: '#0000cc', visible: true, locked: false },
  { id: 'l-W', name: 'A-WALL', color: '#00ff00', visible: true, locked: false },
  { id: 'l-D', name: 'A-DIMS', color: '#ffff00', visible: true, locked: false },
  { id: 'l-LW', name: 'X-KhaiBeDay', color: '#ff00ff', visible: true, locked: false, lineweight: 0.5 },
];
const lay = (id: string) => layers.find((l) => l.id === id);

let seq = 0;
const line = (layer = 'l-A', extra: Partial<Entity> = {}) =>
  ({ id: `e${++seq}`, type: 'line', layer, a: { x: 0, y: 0 }, b: { x: 5000, y: 0 }, ...extra }) as Entity;
const hatch = (layer = 'l-A', extra: Partial<Entity> = {}) =>
  ({
    id: `e${++seq}`, type: 'hatch', layer, solid: true,
    points: [{ x: 0, y: -100 }, { x: 5000, y: -100 }, { x: 5000, y: 100 }, { x: 0, y: 100 }],
    ...extra,
  }) as Entity;
const docVoi = (es: Entity[], them: Partial<Doc> = {}): Doc => ({ entities: es, layers, ...them } as Doc);

/** v.scale = px/mm. 0.02 ≈ nhìn cả mặt bằng; 0.2 ≈ phóng to một góc phòng. */
const V = (scale: number): Viewport => ({ scale, panX: 0, panY: 0 });
const BASE = { stroke: '#111111', lineWidth: 1.3, text: true, realLineweight: true };
const veTrinhBay = (d: Doc, v: Viewport, gm: Partial<GiayMuc> = {}) => {
  log = [];
  drawEntities(ctx, v, d, { ...BASE, background: GIAY, giayMuc: { ...GM, ...gm } } as never);
  return log;
};
const mau = (s: string) => s.split(' ')[1];
const rong = (s: string) => Number(s.split('w=')[1]);

/* ═══════════ ① LUẬT 4 · TRÌNH BÀY LÀ MẶC ĐỊNH — màu ACI BIẾN MẤT ═══════════ */
console.log('① TRÌNH BÀY: mọi nét về thang mực đơn sắc, màu ACI của layer biến mất');
{
  const l = veTrinhBay(docVoi([line('l-A'), line('l-B'), line('l-W')]), V(0.2));
  ok('① không nét nào còn mang màu layer gốc',
    l.every((s) => !s.includes('#cc0000') && !s.includes('#0000cc') && !s.includes('#00ff00')), l);
  ok('① ba nét ba layer khác màu ⇒ chỉ còn ĐƠN SẮC (mọi màu vẽ ra đều cùng một hệ mực)',
    new Set(l.map(mau)).size <= 2, l);
}
{
  // ĐỐI CHỨNG: một màu KHÔNG phải mực được phép tồn tại — accent (luật 5). Và chỉ đúng một.
  const l = veTrinhBay(docVoi([line('l-A'), line('l-B'), hatch('l-W', { inferred: true })]), V(0.2));
  ok('① accent có mặt trên canvas', l.some((s) => s.includes(ACCENT)), l);
}

/* ═══════════ ② LUẬT 2 · BA BẬC MỰC 0.50 / 0.25 / 0.13 ═══════════ */
console.log('② thang mực 3 bậc × stroke-scale: zoom đổi thì cả thang co giãn CÙNG NHAU');
{
  ok('② bảng bề dày đúng ISO 128-24 nội bộ',
    BE_DAY_MUC.cat === 0.5 && BE_DAY_MUC.thay === 0.25 && BE_DAY_MUC.manh === 0.13, BE_DAY_MUC);
}
{
  const v = V(0.2);
  const w = (b: 'cat' | 'thay' | 'manh') => netMuc(b, v, GM, TI_LE_MAC_DINH).px;
  ok('② thứ bậc đúng chiều: cắt > thấy > mảnh', w('cat') > w('thay') && w('thay') > w('manh'),
    [w('cat'), w('thay'), w('manh')]);
  const v2 = V(0.4);
  const w2 = (b: 'cat' | 'thay' | 'manh') => netMuc(b, v2, GM, TI_LE_MAC_DINH).px;
  ok('② zoom gấp đôi ⇒ CẢ BA nhân đôi (thang co giãn cùng nhau, không nhảy bậc)',
    Math.abs(w2('cat') - w('cat') * 2) < 1e-9 && Math.abs(w2('thay') - w('thay') * 2) < 1e-9
      && Math.abs(w2('manh') - w('manh') * 2) < 1e-9, [w('cat'), w2('cat')]);
  ok('② stroke-scale gắn TỈ LỆ BẢN VẼ: 1:100 dày gấp đôi 1:50 trên cùng một zoom',
    Math.abs(netMuc('cat', v, GM, 100).px - netMuc('cat', v, GM, 50).px * 2) < 1e-9);
}
{
  // Bảng map layer → bậc là HEURISTIC, và phải SỬA ĐƯỢC per-layer (luật 4, câu cuối).
  ok('② tên layer kiểu tường ⇒ bậc CẮT', bacMucCua(line('l-W'), lay('l-W'), GM) === 'cat');
  ok('② tên layer kiểu ghi chú/kích thước ⇒ bậc MẢNH', bacMucCua(line('l-D'), lay('l-D'), GM) === 'manh');
  ok('② layer không đoán được ⇒ bậc THẤY (giữa)', bacMucCua(line('l-A'), lay('l-A'), GM) === 'thay');
  const gmSua: GiayMuc = { ...GM, theoLayer: { 'l-D': 'cat', 'A-WALL': 'manh' } };
  ok('② override per-layer theo ID thắng heuristic', bacMucCua(line('l-D'), lay('l-D'), gmSua) === 'cat');
  ok('② override per-layer theo TÊN cũng ăn (người dùng nhìn thấy tên, không thấy id)',
    bacMucCua(line('l-W'), lay('l-W'), gmSua) === 'manh');
  ok('② bề dày KHAI BÁO trong tệp thắng đoán theo tên (0.5 ⇒ cắt)',
    bacMucCua(line('l-LW'), lay('l-LW'), GM) === 'cat');
  ok('② entity tự khai bề dày thì thắng cả layer',
    bacMucCua(line('l-W', { lineweight: 0.13 }), lay('l-W'), GM) === 'manh');
}

/* ═══════════ ③ LUẬT 2 · CHẠM SÀN PX THÌ NHẠT ĐI, KHÔNG MẢNH THÊM ═══════════ */
console.log('③ chạm sàn hiển thị: pha-màu-về-nền (CẤM alpha), bề dày giữ ở sàn');
{
  const v = V(0.05); // nhìn cả mặt bằng — bậc mảnh rơi dưới sàn, bậc cắt thì chưa
  const m = netMuc('manh', v, GM, TI_LE_MAC_DINH);
  ok('③ bậc mảnh chạm sàn ⇒ bề dày DỪNG ở sàn, không mảnh thêm', m.px === SAN_NET_PX, m);
  ok('③ …và bù bằng NHẠT: pha về giấy một lượng > 0', m.nhat > 0, m);
  ok('③ pha không bao giờ vượt trần (lớp nhạt nhất vẫn phải đọc được)',
    m.nhat <= GIAY_MUC_PHA.nhatToiDa, m);
  const c = netMuc('cat', v, GM, TI_LE_MAC_DINH);
  ok('③ ĐỐI CHỨNG: bậc cắt ở cùng zoom CHƯA chạm sàn ⇒ không nhạt tí nào', c.nhat === 0 && c.px > SAN_NET_PX, c);
  ok('③ thứ bậc KHÔNG bị đảo khi một bậc chạm sàn: cắt vẫn đậm hơn mảnh', c.px >= m.px, [c, m]);
}
{
  const v = V(0.05);
  const l = veTrinhBay(docVoi([line('l-D')]), v); // layer kích thước ⇒ bậc mảnh
  ok('③ trên canvas: nét chạm sàn vẽ ở đúng sàn px', rong(l[0]) === SAN_NET_PX, l);
  ok('③ …và màu đã pha về giấy đúng công thức mixHex, KHÔNG phải mực nguyên',
    mau(l[0]) === mixHex(MUC, GIAY, netMuc('manh', v, GM, TI_LE_MAC_DINH).nhat) && mau(l[0]) !== MUC, l);
}

/* ═══════════ ④ LUẬT 3 · POCHÉ TƯỜNG CẮT ═══════════ */
console.log('④ poché tường cắt: xám đậm 75–85% mực, có viền, KHÔNG đen đặc, KHÔNG alpha');
{
  const l = veTrinhBay(docVoi([hatch('l-W', { elementType: 'wall' })]), V(0.2));
  const to = l.find((s) => s.startsWith('fill'))!;
  ok('④ mảng tô tường nằm trong dải 75–85% mực',
    GIAY_MUC_PHA.pocheTuong >= 0.75 && GIAY_MUC_PHA.pocheTuong <= 0.85, GIAY_MUC_PHA.pocheTuong);
  ok('④ màu tô = mực pha về giấy đúng phần còn lại',
    mau(to) === mixHex(MUC, GIAY, 1 - GIAY_MUC_PHA.pocheTuong), to);
  ok('④ KHÔNG đen đặc — tô nhạt hơn mực nguyên', mau(to) !== MUC, to);
  ok('④ KHÔNG alpha (alpha chồng alpha ra vệt đậm giả ở mọi góc nhà)', to.endsWith('a=1'), to);
  ok('④ có viền nét cắt bao quanh mảng tô', l.some((s) => s.startsWith('stroke')), l);
}

/* ═══════════ ⑤ LUẬT 5 · PHẦN MÁY SUY RA = ĐÚNG MỘT MÀU ACCENT ═══════════ */
console.log('⑤ máy suy ra: accent LIỀN = đã xác nhận · fill pha còn 8–12% · một màu nóng, còn lại câm');
{
  const l = veTrinhBay(docVoi([hatch('l-W', { inferred: true, elementType: 'wall' })]), V(0.2));
  const to = l.find((s) => s.startsWith('fill'))!;
  const net = l.find((s) => s.startsWith('stroke'))!;
  ok('⑤ nét của phần máy suy ra dùng ĐÚNG accent', mau(net) === ACCENT, net);
  ok('⑤ fill accent còn lại 8–12%',
    GIAY_MUC_PHA.accentTo >= 0.08 && GIAY_MUC_PHA.accentTo <= 0.12, GIAY_MUC_PHA.accentTo);
  ok('⑤ …pha về NỀN đúng công thức mixHex, không alpha',
    mau(to) === mixHex(ACCENT, GIAY, 1 - GIAY_MUC_PHA.accentTo) && to.endsWith('a=1'), to);
  ok('⑤ mảng tô suy ra vẫn nằm DƯỚI mọi nét (z-order cũ không bị giấy-mực làm hỏng)',
    l[0].startsWith('fill'), l);
}
{
  // "một màu nóng, phần còn lại câm" — nét người vẽ tuyệt đối KHÔNG được nhuộm accent.
  const l = veTrinhBay(docVoi([line('l-A'), hatch('l-W', { inferred: true })]), V(0.2));
  const netNguoi = l[l.length - 1];
  ok('⑤ nét người vẽ vẫn là MỰC, không dính accent',
    !netNguoi.includes(ACCENT) && netNguoi.startsWith('stroke'), l);
}
{
  // ĐỐI CHỨNG: highlight/preview ép màu (`forceColor`) vẫn THẮNG — chọn một vật thì nó phải sáng
  // lên, kể cả vật do máy suy ra. Giữ nguyên luật đã khoá ở `render-z-order.test.ts`.
  log = [];
  drawEntity(ctx, V(0.2), docVoi([]), hatch('l-W', { inferred: true }),
    { ...BASE, background: GIAY, giayMuc: GM, forceColor: '#e0603a', outlineOnly: true } as never);
  ok('⑤ forceColor thắng cả giấy-mực lẫn accent', log.length === 1 && log[0].startsWith('stroke #e0603a'), log);
}

/* ═══════════ ⑥ LUẬT 4 · KHẢO SÁT — VAN AN TOÀN BẮT BUỘC ═══════════ */
console.log('⑥ KHẢO SÁT: wireframe 1px màu layer GỐC, tắt fill — và bật/tắt không để lại cặn');
{
  const d = docVoi([line('l-A'), line('l-B'), hatch('l-W', { elementType: 'wall' })]);
  const l = veTrinhBay(d, V(0.2), { khaoSat: true });
  ok('⑥ mọi nét đúng 1px', l.every((s) => s.startsWith('stroke') && rong(s) === 1), l);
  ok('⑥ tái hiện MÀU LAYER GỐC, không phải mực',
    l.some((s) => s.includes('#cc0000')) && l.some((s) => s.includes('#0000cc')) && l.some((s) => s.includes('#00ff00')), l);
  ok('⑥ TẮT FILL — không một thao tác tô nào', !l.some((s) => s.startsWith('fill')), l);
  ok('⑥ …kể cả mảng tô tường, vốn tô đặc ở TRÌNH BÀY',
    veTrinhBay(d, V(0.2)).some((s) => s.startsWith('fill')), l);
}
{
  // VAN AN TOÀN phải mở/đóng được: tắt khảo sát ⇒ trở lại TRÌNH BÀY y hệt, không cặn.
  const d = docVoi([line('l-A'), hatch('l-W', { elementType: 'wall' })]);
  const a = veTrinhBay(d, V(0.2));
  veTrinhBay(d, V(0.2), { khaoSat: true });
  const b = veTrinhBay(d, V(0.2));
  ok('⑥ bật rồi tắt ⇒ nhật ký vẽ khớp từng dòng với lần đầu', a.join('|') === b.join('|'), [a, b]);
}
{
  // Khảo sát là để SOI DỮ LIỆU GỐC: entity tự khai màu riêng vẫn phải hiện đúng màu ấy.
  const l = veTrinhBay(docVoi([line('l-A', { color: '#123456' })]), V(0.2), { khaoSat: true });
  ok('⑥ màu riêng của entity cũng được tái hiện nguyên', mau(l[0]) === '#123456', l);
}

/* ═══════════ ⑦ KHÔNG HỒI QUY — không `giayMuc` thì không đổi một byte ═══════════ */
console.log('⑦ style KHÔNG mang `giayMuc` ⇒ đường vẽ cũ chạy y hệt');
{
  const d = docVoi([hatch('l-A'), line('l-A')]);
  log = [];
  drawEntities(ctx, V(0.05), d, { ...BASE } as never);
  const cu = [...log];
  ok('⑦ vẫn đúng màu + alpha + bề dày GỐC như trước giấy-mực',
    cu.join('|') === 'fill #cc0000 a=0.9|stroke #cc0000 w=1', cu);
  log = [];
  drawEntities(ctx, V(0.05), d, { ...BASE, background: '#141210' } as never);
  ok('⑦ …và có `background` (đường POCHE_TAM cũ) cũng không đổi', log.join('|') === cu.join('|'), log);
}
{
  // Tỉ lệ bản vẽ đọc từ `doc.printScale` khi nơi gọi không truyền — dùng lại khái niệm ĐÃ CÓ
  // (`model.ts` printScale, N của "1:N"), không đẻ trường thứ hai cho cùng một thứ (luật 6).
  const v = V(0.1);
  const l100 = veTrinhBay(docVoi([line('l-W')], { printScale: 100 }), v);
  const l50 = veTrinhBay(docVoi([line('l-W')], { printScale: 50 }), v);
  ok('⑦ doc 1:100 cho nét dày hơn doc 1:50 trên cùng zoom', rong(l100[0]) > rong(l50[0]), [l100, l50]);
  const lEp = veTrinhBay(docVoi([line('l-W')], { printScale: 100 }), v, { strokeScale: 50 });
  ok('⑦ nơi gọi truyền strokeScale thì THẮNG printScale của doc', rong(lEp[0]) === rong(l50[0]), [lEp, l50]);
}

console.log(`\nrender-giay-muc: ${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
