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
import type { TuyChonTuong } from './tuong-hinh-hoc';

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

/* ═════════════════════════════════════════════════════════════════════════════════════════════
 * ⑩ ENGINE V2 (31/08) — thêm NGUỒN ĐOẠN và HẠ NGƯỠNG cho đoạn ngắn.
 *
 * Ba mũi, mỗi mũi một cặp ĐỎ/XANH:
 *   (a) biên HATCH là nguồn đoạn  — vách thạch cao thợ vẽ bằng một mảng tô, không phải hai nét
 *   (b) `beDayMinMm` 90 → 50      — bắt được vách 75mm, mà KHÔNG bắt nhầm vách kính 10mm
 *   (c) chồng lấn theo TỈ LỆ      — đoạn ngắn không còn bị ngưỡng tuyệt đối 500mm giết oan
 *
 * ⚠️ Mỗi mũi đều có ĐỐI CHỨNG khoá phần KHÔNG được nới: nới ngưỡng mà không có đối chứng thì
 * "bắt được nhiều hơn" và "bắt bừa" trông y hệt nhau trên bảng số.
 * ═════════════════════════════════════════════════════════════════════════════════════════════ */

/**
 * Ngưỡng TRƯỚC 31/08 — giữ lại làm mốc so, để chứng minh v2 không tụt so với v1.
 * `Infinity` chứ KHÔNG phải `1`: chỉ `Infinity` mới ép ngưỡng chồng lấn về đúng con số tuyệt đối
 * 500mm cũ (xem `TuyChonTuong.chongLanTiLeToiThieu`). Đặt `1` là đã dùng luật mới rồi — mốc so
 * sai thì mọi con số "v2 hơn v1" bên dưới đều vô nghĩa.
 */
const NGUONG_CU: TuyChonTuong = { ...TUONG_MAC_DINH, beDayMinMm: 90, chongLanTiLeToiThieu: Infinity };

const hatchChuNhat = (x0: number, y0: number, x1: number, y1: number, layer = 'l-A'): Entity =>
  ({
    id: `e${++seq}`, type: 'hatch', layer, solid: true,
    points: [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }],
  }) as Entity;

/* ══ ⑩a BIÊN HATCH LÀ NGUỒN ĐOẠN — vách gyp vẽ bằng MỘT mảng tô ══ */
{
  const doc = docVoi([hatchChuNhat(0, -37.5, 5000, 37.5)]);
  ok('⑩a docDoanThang bung 2 cạnh DÀI của hatch (2 cạnh 75mm bị lọc vì < 300mm)',
    docDoanThang(doc).length === 2);
  const { tuong } = nhanDienTuong(doc);
  ok('⑩a vách thạch cao vẽ bằng hatch ⇒ nhận ra 1 bức', tuong.length === 1);
  ok('⑩a …bề dày đọc đúng 75mm', tuong.length === 1 && tuong[0].d === 75);
  ok('⑩a ngưỡng CŨ (90mm) KHÔNG bắt được bức này — đây đúng là thứ v2 thêm vào',
    nhanDienTuong(doc, NGUONG_CU).tuong.length === 0);
}
{
  // ĐỐI CHỨNG: mảng tô SÀN (8000×6000) không được biến thành tường — ngoài dải bề dày.
  ok('⑩a hatch sàn lớn KHÔNG thành tường',
    nhanDienTuong(docVoi([hatchChuNhat(0, 0, 8000, 6000)])).tuong.length === 0);
}
{
  /* ĐỐI CHỨNG QUAN TRỌNG — MÁY KHÔNG ĐƯỢC ĂN ĐẦU RA CỦA CHÍNH NÓ. `tuongThanhEntities` sinh
   * hatch poché; nếu bộ đọc coi biên poché ấy là bằng chứng thì chạy hai lượt là tường nhân đôi. */
  const goc = docVoi([line(0, 100, 5000, 100), line(0, -100, 5000, -100)]);
  const { doc: lan1 } = apDungTuongHinhHoc(goc);
  const { ketQua: lan2 } = apDungTuongHinhHoc(lan1);
  ok('⑩a chạy lần 2 trên chính đầu ra ⇒ vẫn 1 bức, không tự nhân bản', lan2.tuong.length === 1);
}

/* ══ ⑩b BỀ DÀY 50–400mm — bắt vách mỏng, KHÔNG bắt hai nét kính ══ */
{
  ok('⑩b vách 75mm vẽ bằng hai nét ⇒ nhận ra',
    nhanDienTuong(docVoi([line(0, 37.5, 5000, 37.5), line(0, -37.5, 5000, -37.5)])).tuong.length === 1);
  ok('⑩b vách KÍNH hai nét cách 10mm ⇒ KHÔNG bắt nhầm (10 < 50)',
    nhanDienTuong(docVoi([line(0, 5, 5000, 5), line(0, -5, 5000, -5)])).tuong.length === 0);
  ok('⑩b sàn nhà cách 2000mm vẫn ngoài dải trên ⇒ 0 tường',
    nhanDienTuong(docVoi([line(0, 1000, 5000, 1000), line(0, -1000, 5000, -1000)])).tuong.length === 0);
}

/* ══ ⑩c CHỒNG LẤN THEO TỈ LỆ — đoạn ngắn có kiểm soát ══ */
{
  // Bức tường 400mm (hộp kỹ thuật/má cửa): dài hơn ngưỡng nét vụn 300mm nhưng ngắn hơn 500mm.
  const ngan = docVoi([line(0, 50, 400, 50), line(0, -50, 400, -50)]);
  ok('⑩c bức tường ngắn 400mm ⇒ nhận ra', nhanDienTuong(ngan).tuong.length === 1);
  ok('⑩c ngưỡng CŨ (chồng lấn tuyệt đối 500mm) giết oan bức này',
    nhanDienTuong(ngan, NGUONG_CU).tuong.length === 0);
}
{
  // ĐỐI CHỨNG "CÓ KIỂM SOÁT": hai nét DÀI mà chỉ chạm nhau một mẩu thì vẫn KHÔNG phải một tường
  // — tỉ lệ 50% của đoạn ngắn hơn (2500mm) vẫn bị trần tuyệt đối 500mm chặn trước.
  ok('⑩c hai nét 5000mm chồng lấn 400mm ⇒ vẫn 0 tường (không nới bừa)',
    nhanDienTuong(docVoi([line(0, 100, 5000, 100), line(4600, -100, 9600, -100)])).tuong.length === 0);
  ok('⑩c nét vụn < 300mm vẫn bị bỏ trước khi ghép',
    docDoanThang(docVoi([line(0, 50, 250, 50), line(0, -50, 250, -50)])).length === 0);
}

/* ══ ⑩d ARRAY/LOUVER VẪN BỊ LOẠI — nới ngưỡng không được mở cửa cho bậc thang ══ */
{
  // 5 bức 100mm, trục cách đều 250mm — chữ ký ARRAY, dù mỗi bức đều hợp lệ nếu xét riêng.
  const es: Entity[] = [];
  for (const c of [0, 250, 500, 750, 1000]) { es.push(line(0, c + 50, 5000, c + 50)); es.push(line(0, c - 50, 5000, c - 50)); }
  const { tuong, doDem } = nhanDienTuong(docVoi(es));
  ok('⑩d cụm 5 trục bước đều 250mm bị loại sạch', tuong.length === 0);
  ok('⑩d …và báo cáo nói ra đã loại bao nhiêu', doDem.loaiBoiArray === 5);
}

/* ══ ⑩e KHÔNG TỤT SO VỚI V1 — bản vẽ trộn đủ loại ══ */
{
  const es: Entity[] = [
    line(0, 100, 8000, 100), line(0, -100, 8000, -100),               // tường 200mm
    line(0, 3100, 8000, 3100), line(0, 2900, 8000, 2900),             // tường 200mm thứ hai
    ...[0, 250, 500, 750].map((c) => line(6000, c + 5000, 9000, c + 5000)), // bậc thang
    line(0, 4005, 5000, 4005), line(0, 3995, 5000, 3995),             // vách kính 10mm
  ];
  const doc = docVoi([...es, hatchChuNhat(0, 962.5, 6000, 1037.5)]);   // vách gyp 75mm bằng hatch
  const v2 = nhanDienTuong(doc);
  const v1 = nhanDienTuong(doc, NGUONG_CU);
  ok('⑩e v2 KHÔNG TỤT dưới v1 về số bức', v2.tuong.length >= v1.tuong.length);
  ok('⑩e v2 bắt được nhiều hơn v1 trên chính bản vẽ này', v2.tuong.length > v1.tuong.length);
  ok('⑩e hai bức 200mm vẫn còn nguyên trong v2', (v2.doDem.beDay[200] ?? 0) === 2);
  ok('⑩e vách gyp 75mm có mặt trong bảng bề dày', (v2.doDem.beDay[75] ?? 0) === 1);
  ok('⑩e vách kính 10mm KHÔNG lọt vào bảng', v2.doDem.beDay[10] === undefined);
  ok('⑩e tổng chiều dài không tụt', v2.doDem.tongDaiMm >= v1.doDem.tongDaiMm);
}

console.log(`\ntuong-hinh-hoc: ${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
