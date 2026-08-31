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
import { drawEntities, drawEntity, BE_DAY_MUC, GIAY_MUC_DEM, GIAY_MUC_PHA, SAN_NET_PX, TI_LE_MAC_DINH, bacMucCua, netMuc } from './render';
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
/**
 * Poché của tường MÁY ĐỌC NGƯỢC TỪ HÌNH HỌC — mang ĐỦ CẶP `inferred` + `wallThicknessMm`, đúng
 * thứ `tuong-hinh-hoc.ts` sinh ra. Có khuôn riêng để không ca nào lỡ tay khoá bằng mỗi `inferred`:
 * dấu đó rộng hơn nhiều (element-infer đóng nó lúc nhập DXF) và chính chỗ lẫn ấy đã nhuộm accent
 * cả bản vẽ thật của khách — ảnh hiện trường 19:03 · 31/08.
 */
const hatchSuyRa = (layer = 'l-W', extra: Partial<Entity> = {}) =>
  hatch(layer, { inferred: true, elementType: 'wall', wallThicknessMm: 200, ...extra });

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
  const l = veTrinhBay(docVoi([line('l-A'), line('l-B'), hatchSuyRa()]), V(0.2));
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
  const l = veTrinhBay(docVoi([hatchSuyRa()]), V(0.2));
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
  /* 🔴 CA HIỆN TRƯỜNG 19:03 · 31/08 — ảnh app thật của Hoà: **TOÀN BẢN VẼ MỘT MÀU ACCENT**.
   * Gốc bệnh: `Entity.inferred` KHÔNG có nghĩa "máy đọc ngược từ hình học". `element-infer.ts`
   * đóng dấu `inferred: true` cho MỌI entity có tên layer khớp luật, ngay lúc nhập DXF — trên
   * bản vẽ thật (A-WALL · A-DOOR · A-FURN…) đó là gần như cả bản vẽ. Lấy `inferred` một mình làm
   * cờ accent tức là nhuộm accent cả tệp của khách, và "một màu nóng, phần còn lại câm" thành
   * "tất cả đều nóng" — đúng thứ luật 5 sinh ra để tránh.
   * Dấu ĐÚNG là CẶP `inferred` + `wallThicknessMm`: chỉ `tuong-hinh-hoc.ts` ghi cả hai
   * (`laPocheCuaChinhBoNay` ở tệp đó dùng đúng cặp này), `element-infer` không bao giờ ghi bề dày. */
  const dauElementInfer = hatch('l-W', { inferred: true, elementType: 'wall' });      // dấu của element-infer
  const dauTuongHinhHoc = hatch('l-W', { inferred: true, elementType: 'wall', wallThicknessMm: 200 });
  const l1 = veTrinhBay(docVoi([dauElementInfer]), V(0.2));
  ok('⑤ entity chỉ mang `inferred` (dấu element-infer) KHÔNG được nhuộm accent',
    !l1.some((s) => s.includes(ACCENT)), l1);
  ok('⑤ …nó là MỰC như mọi nét khác của khách', l1.some((s) => s.includes(MUC)), l1);
  const l2 = veTrinhBay(docVoi([dauTuongHinhHoc]), V(0.2));
  ok('⑤ tường MÁY ĐỌC NGƯỢC (inferred + bề dày) mới là accent', l2.some((s) => s.includes(ACCENT)), l2);
}
{
  // "một màu nóng, phần còn lại câm" — nét người vẽ tuyệt đối KHÔNG được nhuộm accent.
  const l = veTrinhBay(docVoi([line('l-A'), hatchSuyRa()]), V(0.2));
  const netNguoi = l[l.length - 1];
  ok('⑤ nét người vẽ vẫn là MỰC, không dính accent',
    !netNguoi.includes(ACCENT) && netNguoi.startsWith('stroke'), l);
}
{
  // ĐỐI CHỨNG: highlight/preview ép màu (`forceColor`) vẫn THẮNG — chọn một vật thì nó phải sáng
  // lên, kể cả vật do máy suy ra. Giữ nguyên luật đã khoá ở `render-z-order.test.ts`.
  log = [];
  drawEntity(ctx, V(0.2), docVoi([]), hatchSuyRa(),
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

/* ═══════════ ⑧ HIỆU NĂNG — ĐẾM LẦN TÍNH LẠI, KHÔNG ĐO MILI-GIÂY ═══════════ */
console.log('⑧ phép đắt nằm NGOÀI vòng vẽ: vẽ lại bản vẽ cũ ⇒ không tính lại gì');
/* Vì sao đếm chứ không đo ms: đo ms trong unit test là tự rước một ca ĐỎ NGẪU NHIÊN theo tải máy.
 * Cái cần khoá là TÍNH CHẤT — "phép đắt chạy một lần cho cả bản vẽ, không một lần mỗi hình" — và
 * tính chất đó đếm được, ổn định, đọc ra ngay nguyên nhân khi vỡ.
 * Con số ms để tham khảo (bản vẽ 12.436 hình, ctx giả): 6,59 → 19,51 ms/khung khi thêm giấy-mực,
 * xuống 2,15 ms/khung phụ trội sau khi đưa hai phép này ra ngoài vòng vẽ. */
const dem = () => ({ ...GIAY_MUC_DEM });
const lech = (a: { bang: number; bacLayer: number }, b: { bang: number; bacLayer: number }) =>
  ({ bang: b.bang - a.bang, bacLayer: b.bacLayer - a.bacLayer });
{
  const nhieu: Entity[] = [];
  for (let i = 0; i < 400; i++) nhieu.push(line(i % 2 ? 'l-A' : 'l-W'));
  // Mảng lớp RIÊNG (bản sao) — khoá cache là chính mảng `doc.layers`, nên dùng chung mảng của các
  // ca trên thì cache đã ấm sẵn và ca này đo nhầm một cái bếp người khác nhóm.
  const d = docVoi(nhieu, { layers: [...layers] });
  const v = V(0.2);
  const t0 = dem();
  veTrinhBay(d, v);
  const sauLan1 = lech(t0, dem());
  ok('⑧ 400 hình ⇒ bảng nét dựng ĐÚNG 1 lần, không 400 lần', sauLan1.bang === 1, sauLan1);
  ok('⑧ …bảng bậc-theo-lớp cũng đúng 1 lần', sauLan1.bacLayer === 1, sauLan1);
  const t1 = dem();
  veTrinhBay(d, v);
  veTrinhBay(d, v);
  ok('⑧ vẽ lại CÙNG bản vẽ, CÙNG zoom ⇒ KHÔNG tính lại gì', JSON.stringify(lech(t1, dem())) === '{"bang":0,"bacLayer":0}', lech(t1, dem()));
}
{
  // Zoom là thứ đổi mỗi khung khi người dùng lăn chuột. Nó ĐƯỢC dựng lại bảng nét (3 bậc, rẻ)
  // nhưng TUYỆT ĐỐI không được đụng bảng bậc-theo-lớp (tra lớp + regex tên — thứ đắt).
  const d = docVoi([line('l-A'), line('l-W')]);
  veTrinhBay(d, V(0.2));
  const t0 = dem();
  veTrinhBay(d, V(0.21));
  veTrinhBay(d, V(0.22));
  const l = lech(t0, dem());
  ok('⑧ zoom đổi ⇒ dựng lại bảng nét (đúng, màu/bề dày phụ thuộc zoom)', l.bang === 2, l);
  ok('⑧ …nhưng KHÔNG chạm bảng bậc-theo-lớp — regex tên lớp không chạy lại khi lăn chuột',
    l.bacLayer === 0, l);
}
{
  // Bảng sửa tay per-layer đổi ⇒ PHẢI tính lại, nếu không người dùng sửa mà màn hình không đổi.
  const d = docVoi([line('l-D')]);
  veTrinhBay(d, V(0.2));
  const t0 = dem();
  veTrinhBay(d, V(0.2), { theoLayer: { 'l-D': 'cat' } });
  ok('⑧ đổi bảng sửa tay ⇒ bảng bậc dựng lại (cache không được điếc)', lech(t0, dem()).bacLayer === 1, lech(t0, dem()));
}
{
  // ĐÚNG-TRƯỚC-NHANH-SAU: đường nhanh phải trả lời Y HỆT hàm gốc `bacMucCua`, kể cả ở ca xoắn
  // nhất — lớp CÓ sửa tay mà entity lại tự khai bề dày. Sửa tay thắng, đúng thứ tự hàm gốc.
  const gmSua: GiayMuc = { ...GM, theoLayer: { 'l-W': 'manh' } };
  const e = line('l-W', { lineweight: 0.5 });
  ok('⑧ hàm gốc: sửa tay thắng bề dày khai báo trên entity', bacMucCua(e, lay('l-W'), gmSua) === 'manh');
  const l = veTrinhBay(docVoi([e]), V(0.2), { theoLayer: { 'l-W': 'manh' } });
  const lCat = veTrinhBay(docVoi([line('l-W')]), V(0.2), { theoLayer: { 'l-W': 'cat' } });
  ok('⑧ đường nhanh trả lời GIỐNG hàm gốc ở ca xoắn ấy (mảnh ≠ cắt)', rong(l[0]) < rong(lCat[0]), [l, lCat]);
}

console.log(`\nrender-giay-muc: ${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
