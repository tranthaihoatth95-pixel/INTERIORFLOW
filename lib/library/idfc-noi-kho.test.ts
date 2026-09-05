/** Test `idfc-noi-kho.ts` — chạy: npx tsx lib/library/idfc-noi-kho.test.ts
 *  Import TƯƠNG ĐỐI theo quy ước các test chạy dưới sucrase-node. */
import { noiIdfcVeKho, type DongKhoToiThieu } from './idfc-noi-kho';
import { nhanNoiKho } from './spec-panel';
import type { IdfcBody, IdfcCommerce } from '../cad/idfc';
import type { MaterialPbr } from '../materials/schema';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) { pass++; console.log('  ok  -', name); }
  else { fail++; console.log('  FAIL-', name); }
}

const UUID_SOI = 'f77b3a78-f2e3-4b19-b70f-20643c8a6243';

const kho: DongKhoToiThieu[] = [
  { id: 'ps-ke', name: 'Kệ sách sồi 900', sku: 'KE-900', matId: null, brand: 'Xưởng A', unit: 'bộ', priceVnd: 4_200_000 },
  { id: 'ps-soi', name: 'Ván sồi 18mm', sku: 'OAK-18', matId: UUID_SOI, brand: 'Gỗ Việt', unit: 'm²', priceVnd: 980_000 },
];

const PBR = { baseColorHex: '#c8a97a', roughness: 0.6, metalness: 0 } as unknown as MaterialPbr;
const ruotVatLieu = (matId?: string): IdfcBody => ({ type: 'material', pbr: PBR, ...(matId ? { matId } : {}) });
const ruotCauKien = (matId?: string): IdfcBody => ({
  type: 'component',
  geom2d: { group: 'Phòng khách', w: 900, h: 300, prims: [] },
  ...(matId ? { geom3d: { heightMm: 18, matId } } : {}),
});

console.log('① NỐI CHẮC — khoá bất biến thắng, và kho THẮNG số chép trong tệp (luật 2.1.9.i)');
{
  // Tệp mang giá CŨ 3 900 000 + khoá bất biến. Kho đang bán 4 200 000.
  const c: IdfcCommerce = { specId: 'ps-ke', sku: 'KE-900', brand: 'Hãng cũ', unit: 'cái', priceVnd: 3_900_000 };
  const r = noiIdfcVeKho(ruotCauKien(), c, kho);
  ok('via = specId', r.via === 'specId');
  ok('trạng thái = ben', r.trangThai?.kieu === 'ben');
  ok('tên hàng lấy từ KHO', r.trangThai?.kieu === 'ben' && r.trangThai.tenHang === 'Kệ sách sồi 900');
  ok('giá lấy SỐNG từ kho (4 200 000), KHÔNG phải ảnh chụp 3 900 000', r.nguon?.priceVnd === 4_200_000);
  ok('hãng lấy sống từ kho', r.nguon?.supplier === 'Xưởng A');
  ok('đơn vị lấy sống từ kho', r.nguon?.unit === 'bộ');
}

console.log('② ĐỔI MÃ HÀNG TRONG KHO — nối bằng khoá bất biến thì VẪN ĐÚNG');
{
  const c: IdfcCommerce = { specId: 'ps-ke', sku: 'KE-900' };
  const khoDoiSku = kho.map((s) => (s.id === 'ps-ke' ? { ...s, sku: 'KE-900-V2' } : s));
  const r = noiIdfcVeKho(ruotCauKien(), c, khoDoiSku);
  ok('vẫn nối được sau khi kho đổi mã hàng', r.trangThai?.kieu === 'ben');
  ok('vẫn đúng bản ghi', r.nguon?.priceVnd === 4_200_000);

  // ĐỐI CHỨNG: bỏ khoá bất biến đi thì chính ca đó ĐỨT — đây là thứ chứng minh cờ `ben` có nghĩa.
  const chiSku = noiIdfcVeKho(ruotCauKien(), { sku: 'KE-900' }, khoDoiSku);
  ok('ĐỐI CHỨNG — chỉ có mã hàng thì đổi mã là ĐỨT', chiSku.trangThai?.kieu === 'khong-thay');
}

console.log('③ NỐI MỎNG — chỉ có mã hàng ⇒ ben=false, câu chữ phải cảnh báo');
{
  const r = noiIdfcVeKho(ruotCauKien(), { sku: 'ke-900 ' }, kho);
  ok('via = sku', r.via === 'sku');
  ok('trạng thái = mong', r.trangThai?.kieu === 'mong');
  ok('vẫn đọc được giá sống', r.nguon?.priceVnd === 4_200_000);
  const nhan = r.trangThai ? nhanNoiKho(r.trangThai) : null;
  ok('câu chữ nói ra hậu quả "đứt"', !!nhan && /đứt/.test(nhan.chinh[0]));
  ok('câu chữ KHÔNG lộ chữ máy sku/specId/matId', !!nhan && !/\b(sku|specId|matId)\b/.test(nhan.chinh[0] + nhan.phu[0]));
}

console.log('④ RUỘT VẬT LIỆU tự mang danh tính ⇒ nối chắc dù KHÔNG có commerce');
{
  const r = noiIdfcVeKho(ruotVatLieu(UUID_SOI.toUpperCase()), undefined, kho);
  ok('nối được qua danh tính của chính vật liệu', r.trangThai?.kieu === 'ben');
  ok('via = matId', r.via === 'matId');
  ok('trỏ đúng ván sồi', r.nguon?.priceVnd === 980_000);
}

console.log('⑤ RANH GIỚI — vật liệu cấu kiện ĐƯỢC LÀM BẰNG không được nhận nhầm là chính nó');
{
  // Kệ sách làm bằng ván sồi. TUYỆT ĐỐI không được hiện giá ván sồi làm giá cái kệ.
  const r = noiIdfcVeKho(ruotCauKien(UUID_SOI), undefined, kho);
  ok('KHÔNG nối vào ván sồi', r.trangThai?.kieu === 'chua-khai');
  ok('không bịa giá', r.nguon === undefined);
  ok('via rỗng', r.via === null);
}

console.log('⑥ CHƯA KHAI ≠ KHÔNG THẤY — hai sự thật khác nhau, hai câu khác nhau');
{
  const chuaKhai = noiIdfcVeKho(ruotCauKien(), undefined, kho);
  ok('tệp trắng ⇒ chua-khai', chuaKhai.trangThai?.kieu === 'chua-khai');

  const khongThay = noiIdfcVeKho(ruotCauKien(), { specId: 'ps-khong-co', priceVnd: 1_000_000, unit: 'cái' }, kho);
  ok('có khai mà kho không có ⇒ khong-thay', khongThay.trangThai?.kieu === 'khong-thay');
  ok('rơi về số chép trong tệp', khongThay.nguon?.priceVnd === 1_000_000);
  ok('và NÓI RA đó là ảnh chụp',
    khongThay.trangThai?.kieu === 'khong-thay' && khongThay.trangThai.coSoTrongTep === true
    && /chép trong tệp/.test(nhanNoiKho(khongThay.trangThai).phu[0]));

  const nhanA = nhanNoiKho({ kieu: 'chua-khai' }).chinh[0];
  const nhanB = nhanNoiKho({ kieu: 'khong-thay', coSoTrongTep: false }).chinh[0];
  ok('hai câu KHÁC NHAU (không gộp)', nhanA !== nhanB);
}

console.log('⑦ KHO CHƯA TẢI XONG ⇒ KHÔNG khẳng định gì, không hiện câu nào');
{
  const r = noiIdfcVeKho(ruotCauKien(), { specId: 'ps-ke' }, null);
  ok('trạng thái = null (chưa biết)', r.trangThai === null);
  ok('không suy ra "kho chưa có món này"', r.trangThai === null);
}

console.log('⑧ Kho RỖNG — khai đúng là kho không có, không phải tệp thiếu');
{
  const r = noiIdfcVeKho(ruotCauKien(), { specId: 'ps-ke', sku: 'KE-900' }, []);
  ok('kho rỗng ⇒ khong-thay (không đổ cho tệp)', r.trangThai?.kieu === 'khong-thay');
}

console.log(`\n${pass} pass · ${fail} fail`);
if (fail) process.exit(1);
