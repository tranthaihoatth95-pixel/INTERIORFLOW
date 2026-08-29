/**
 * lib/cad/tuong-hinh-hoc.test.ts — nghiệm thu bộ đọc ngược thao tác người vẽ.
 * Chạy: `node_modules/.bin/sucrase-node lib/cad/tuong-hinh-hoc.test.ts`
 *
 * ⚠️ **CÓ CA MONG THẤY, không chỉ toàn ca phủ định (luật F-17).** Một bộ test chỉ gồm "không nhận
 * nhầm cái này, không nhận nhầm cái kia" sẽ PASS trọn vẹn với một hàm luôn trả `[]`. Nên ca số ①
 * là ca DƯƠNG và nó khoá cả ba con số: **số tường · trục · bề dày**.
 *
 * Nghiệm thu ĐẢO TRIM ở ca ③ dùng đúng luật tự chấm đã ghi trong `tuong-hinh-hoc.ts`:
 * số tường GIẢM, tổng chiều dài GẦN NHƯ KHÔNG ĐỔI.
 */
import { emptyDoc } from './model';
import type { Doc, Entity, Pt } from './model';
import {
  apDungTuongHinhHoc,
  boArray,
  daoTrim,
  docDoanThang,
  ghepDoiDocQuyen,
  nhanDienTuong,
  tuongHinhHocEnabled,
  TUONG_MAC_DINH,
} from './tuong-hinh-hoc';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}
const gan = (a: number, b: number, sai = 1) => Math.abs(a - b) <= sai;

let seq = 0;
const line = (ax: number, ay: number, bx: number, by: number, layer = 'l-A'): Entity =>
  ({ id: `e${++seq}`, type: 'line', layer, a: { x: ax, y: ay }, b: { x: bx, y: by } }) as Entity;
const pline = (pts: Pt[], layer = 'l-A'): Entity =>
  ({ id: `e${++seq}`, type: 'polyline', layer, points: pts, closed: false }) as Entity;
const docVoi = (es: Entity[]): Doc => ({ ...emptyDoc(), entities: es, layers: [] });

/* ══ ① CA MONG THẤY — hai nét song song CHÍNH LÀ một bức tường ══ */
{
  const doc = docVoi([line(0, 100, 5000, 100), line(0, -100, 5000, -100)]);
  const { tuong, doDem } = nhanDienTuong(doc);
  ok('① một cặp OFFSET → ĐÚNG 1 tường', tuong.length === 1);
  const t = tuong[0];
  ok('① bề dày = khoảng cách hai nét (200mm)', t.d === 200);
  ok('① trục nằm GIỮA hai nét (y≈0)', gan(t.ay, 0) && gan(t.by, 0));
  ok('① trục dài đúng phần chồng lấn (5000mm)', gan(Math.hypot(t.bx - t.ax, t.by - t.ay), 5000));
  ok('① tổng chiều dài báo về khớp trục', gan(doDem.tongDaiMm, 5000));
  ok('① bảng bề dày đếm được 1 bức 200mm', doDem.beDay[200] === 1);
}

/* ══ ② CẠNH POLYLINE cũng phải được tính — chống lại chính con bọ của phép thử gốc ══
 * `scripts/proof/tuong-tu-hinh-hoc.ts` đọc `e.pts` (model đặt tên `points`) nên âm thầm bỏ 1.858
 * cạnh polyline trên tệp đo thật. Không nổ, không cảnh báo, chỉ ra ít tường hơn. */
{
  const doc = docVoi([
    pline([{ x: 0, y: 100 }, { x: 5000, y: 100 }]),
    pline([{ x: 0, y: -100 }, { x: 5000, y: -100 }]),
  ]);
  ok('② docDoanThang() bung cạnh polyline', docDoanThang(doc).length === 2);
  ok('② tường vẽ bằng polyline vẫn nhận ra', nhanDienTuong(doc).tuong.length === 1);
}

/* ══ ③ ĐẢO TRIM — nghiệm thu TỰ CHẤM: số GIẢM, chiều dài GẦN NHƯ KHÔNG ĐỔI ══ */
{
  const doc = docVoi([
    line(0, 100, 2000, 100), line(0, -100, 2000, -100),        // mảnh trái
    line(2050, 100, 5000, 100), line(2050, -100, 5000, -100),  // mảnh phải, khe 50mm
  ]);
  const nets = docDoanThang(doc);
  const { tuong: truoc } = ghepDoiDocQuyen(nets);
  const sau = daoTrim(truoc, TUONG_MAC_DINH.kheHoTrimMm);
  const dai = (ds: typeof truoc) => ds.reduce((s, t) => s + Math.hypot(t.bx - t.ax, t.by - t.ay), 0);
  ok('③ trước khi đảo TRIM: 2 mảnh rời', truoc.length === 2);
  ok('③ SỐ TƯỜNG GIẢM → 1 bức liền', sau.length === 1);
  ok('③ CHIỀU DÀI GẦN NHƯ KHÔNG ĐỔI (không ăn mất tường)', Math.abs(dai(sau) - dai(truoc)) <= 100);
  ok('③ bề dày giữ nguyên qua bước nối', sau[0].d === 200);
}

/* ══ ③b khe hở QUÁ RỘNG (ô cửa 900mm) thì KHÔNG nối bừa ══ */
{
  const truoc = [
    { ax: 0, ay: 0, bx: 2000, by: 0, d: 200, layer: 'l-A' },
    { ax: 2900, ay: 0, bx: 5000, by: 0, d: 200, layer: 'l-A' },
  ];
  ok('③b khe 900mm > ngưỡng 100mm ⇒ vẫn là 2 bức', daoTrim(truoc, 100).length === 2);
}

/* ══ ④ ĐẢO ARRAY — 5 trục bước đều 250mm là BẬC THANG, không phải 5 bức tường ══ */
{
  const ds = [0, 250, 500, 750, 1000].map((y) => ({ ax: 0, ay: y, bx: 5000, by: y, d: 100, layer: 'l-A' }));
  const { giuLai, bo } = boArray(ds);
  ok('④ loại sạch cụm bước đều', bo.length === 5 && giuLai.length === 0);
}
{
  // ĐỐI CHỨNG: bước KHÔNG đều thì không được loại — nếu không, mọi dãy tường song song đều chết.
  const ds = [0, 250, 1900, 4300].map((y) => ({ ax: 0, ay: y, bx: 5000, by: y, d: 100, layer: 'l-A' }));
  ok('④ bước không đều ⇒ GIỮ nguyên, không loại nhầm tường', boArray(ds).bo.length === 0);
}

/* ══ ⑤ CA PHỦ ĐỊNH — thứ không phải tường thì đừng nhận ══ */
{
  ok('⑤ hai nét cách 2000mm (ngoài dải bề dày) ⇒ 0 tường',
    nhanDienTuong(docVoi([line(0, 1000, 5000, 1000), line(0, -1000, 5000, -1000)])).tuong.length === 0);
  ok('⑤ hai nét KHÁC LAYER ⇒ không ghép thành một tường',
    nhanDienTuong(docVoi([line(0, 100, 5000, 100, 'l-A'), line(0, -100, 5000, -100, 'l-B')])).tuong.length === 0);
  ok('⑤ hai nét chồng lấn quá ngắn (200mm) ⇒ 0 tường',
    nhanDienTuong(docVoi([line(0, 100, 5000, 100), line(4800, -100, 9000, -100)])).tuong.length === 0);
  ok('⑤ nét vụn < 300mm bị bỏ trước khi ghép',
    docDoanThang(docVoi([line(0, 0, 250, 0)])).length === 0);
}

/* ══ ⑥ GHÉP ĐÔI ĐỘC QUYỀN — một nét chỉ là mặt của MỘT bức tường ══
 * Tường 3 nét (hai mặt kết cấu + nét trát): ghép mọi cặp sẽ đẻ 3 trục chồng nhau — đúng lỗi Hoà
 * bắt bằng mắt 29/08. Độc quyền ⇒ tối đa 1 cặp, nét thừa bị bỏ lại. */
{
  const doc = docVoi([line(0, 100, 5000, 100), line(0, -100, 5000, -100), line(0, 0, 5000, 0)]);
  const { tuong, capUngVien } = ghepDoiDocQuyen(docDoanThang(doc));
  ok('⑥ có nhiều cặp ứng viên…', capUngVien >= 2);
  ok('⑥ …nhưng chỉ nhận 1 trục, không đẻ trục chồng', tuong.length === 1);
}

/* ══ ⑦ ĐƯA VÀO BẢN VẼ — THÊM, không thay thế; và là entity tường THẬT của IF ══ */
{
  const goc = docVoi([line(0, 100, 5000, 100), line(0, -100, 5000, -100)]);
  const soGoc = goc.entities.length;
  const { doc: sau, ketQua } = apDungTuongHinhHoc(goc);
  ok('⑦ hàm THUẦN — doc truyền vào không bị sửa', goc.entities.length === soGoc);
  ok('⑦ nét gốc của người vẽ được GIỮ NGUYÊN', sau.entities.slice(0, soGoc).every((e, i) => e === goc.entities[i]));
  const them = sau.entities.slice(soGoc);
  ok('⑦ thêm đúng cặp hatch poché + đường bao (khuôn wallSegmentOutline)',
    them.length === 2 && them.some((e) => e.type === 'hatch') && them.some((e) => e.type === 'polyline'));
  ok('⑦ mang elementType wall + bề dày đọc được', them.every((e) => e.elementType === 'wall' && e.wallThicknessMm === 200));
  ok('⑦ hatch được neo vào đường bao (hostId, luật poche.ts)',
    them.some((e) => e.type === 'hatch' && !!e.hostId));
  ok('⑦ tường sinh ra GIỮ layer của nét gốc — không nhét layer của studio nào',
    them.every((e) => e.layer === 'l-A'));
  ok('⑦ trả kèm số đo để nghiệm thu', ketQua.doDem.sauGopChum === 1);
}

/* ══ ⑧ CỜ — mặc định TẮT ở mọi môi trường ══ */
{
  const cu = process.env.NEXT_PUBLIC_IF_TUONG_HINH_HOC;
  delete process.env.NEXT_PUBLIC_IF_TUONG_HINH_HOC;
  ok('⑧ không đặt biến ⇒ TẮT', tuongHinhHocEnabled() === false);
  process.env.NEXT_PUBLIC_IF_TUONG_HINH_HOC = '0';
  ok('⑧ đặt "0" ⇒ vẫn TẮT', tuongHinhHocEnabled() === false);
  process.env.NEXT_PUBLIC_IF_TUONG_HINH_HOC = '1';
  ok('⑧ đặt "1" ⇒ BẬT', tuongHinhHocEnabled() === true);
  if (cu === undefined) delete process.env.NEXT_PUBLIC_IF_TUONG_HINH_HOC;
  else process.env.NEXT_PUBLIC_IF_TUONG_HINH_HOC = cu;
}

/* ══ ⑨ BẢN VẼ TRỐNG / RÁC — không được nổ ══ */
{
  ok('⑨ doc rỗng ⇒ 0 tường, không throw', nhanDienTuong(emptyDoc()).tuong.length === 0);
  const { doc: d } = apDungTuongHinhHoc(emptyDoc());
  ok('⑨ apDung trên doc rỗng trả đúng doc cũ', d.entities.length === 0);
}

console.log(`\ntuong-hinh-hoc: ${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
