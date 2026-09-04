/** Test `overview.ts` — chạy: node_modules/.bin/sucrase-node lib/library/overview.test.ts
 *
 * Chứng minh: ① mọi mục đều có mặt ở mọi trạng thái dữ liệu (kể cả kho rỗng — ô trống là bằng
 * chứng còn việc, không biến mất); ② số đếm chỉ từ dữ liệu, không bịa; ③ ô chưa có mã hiện
 * `chuaNoi` kèm lý do; ④ số ô liền mạch 01..N.
 */
import { buildLibraryOverview, idfcKindBreakdown, sectionIndexMap, OVERVIEW_SECTIONS, type OverviewInput } from './overview';
import type { SheetItem } from './shelves';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) { pass++; console.log('  ok  -', name); }
  else { fail++; console.log('  FAIL-', name); }
}

const item = (id: string, shelfId: string, extra: Partial<SheetItem> = {}): SheetItem => ({
  id, shelfId, name: id, code: id.toUpperCase(), kind: 'sheet', scope: 'studio', mechanic: 'keo', ...extra,
});

const RONG: OverviewInput = { daTaiKho: true, items: [], idfcKinds: [], dna: { soThe: 0, soDuAn: 0 }, knowledge: { tong: 0, daKiem: 0, hienHanh: 0, daThayThe: 0, theoLoai: { 'quy-chuan': 0, 'tai-lieu-du-an': 0 } } };

console.log('buildLibraryOverview() — kho RỖNG: mọi mục vẫn hiện, không mục nào bịa số');
{
  const s = buildLibraryOverview(RONG);
  ok('đủ số mục như bảng khai', s.length === OVERVIEW_SECTIONS.length);
  ok('thứ tự giữ nguyên bảng khai', s.map((x) => x.id).join() === OVERVIEW_SECTIONS.map((x) => x.id).join());
  ok('Collection+ = chuaNoi kèm lý do', (() => { const c = s.find((x) => x.id === 'bo-suu-tap'); return c?.trangThai === 'chuaNoi' && c.chinh.kieu === 'khong' && c.chinh.lyDo[0].length > 0; })());
  ok('vật liệu/ảnh/3D/mẫu = trong, count 0', ['vat-lieu', 'anh-tai-san', 'mo-hinh-3d', 'mau-ho-so'].every((id) => { const x = s.find((y) => y.id === id); return x?.trangThai === 'trong' && x.count === 0; }));
  ok('ký hiệu 2D vẫn SỐNG nhờ block đi kèm app (>0)', (() => { const x = s.find((y) => y.id === 'ky-hieu-2d'); return x?.trangThai === 'song' && (x.count ?? 0) > 0 && x.chiTiet.length === 1; })());
  ok('files là route thuần: count null, song', (() => { const x = s.find((y) => y.id === 'files'); return x?.count === null && x.trangThai === 'song' && x.chinh.kieu === 'route'; })());
  ok('không thumb nào khi không có ảnh', s.every((x) => x.thumbs.length === 0));
}

console.log('buildLibraryOverview() — ĐANG TẢI: mục DB báo dangTai, mục cục bộ vẫn đếm');
{
  const s = buildLibraryOverview({ ...RONG, daTaiKho: false, dna: null, knowledge: null, idfcKinds: ['furniture'] });
  ok('vật liệu dangTai, count null', (() => { const x = s.find((y) => y.id === 'vat-lieu'); return x?.trangThai === 'dangTai' && x.count === null; })());
  ok('Thẻ DNA dangTai khi chưa tải', s.find((y) => y.id === 'the-dna')?.trangThai === 'dangTai');
  ok('tri thức dangTai khi chưa tải', s.find((y) => y.id === 'tri-thuc')?.trangThai === 'dangTai');
  ok('cấu kiện (kho cục bộ) vẫn đếm được 1', (() => { const x = s.find((y) => y.id === 'cau-kien'); return x?.count === 1 && x.trangThai === 'song'; })());
}

console.log('buildLibraryOverview() — có dữ liệu: đếm theo kệ, thumb tối đa 4, 3D nhận qua tên');
{
  const items: SheetItem[] = [
    item('m1', 'common-atlas', { imageUrl: '/a/1' }), item('m2', 'common-atlas'),
    item('a1', 'common-asset', { imageUrl: '/b/1' }), item('a2', 'common-asset', { imageUrl: '/b/2' }), item('a3', 'common-asset', { imageUrl: '/b/3' }),
    item('a4', 'common-asset', { imageUrl: '/b/4' }), item('a5', 'common-asset', { imageUrl: '/b/5' }),
    item('g1', 'common-asset', { name: 'Ghế bar Lincoln 327', imageUrl: '/g/1' }),
    item('p1', 'present-page'), item('t1', 'cad-sheet'), item('k1', 'cad-kyhieu'),
  ];
  const s = buildLibraryOverview({ ...RONG, items, idfcKinds: ['furniture', 'material', 'furniture'], dna: { soThe: 3, soDuAn: 2 }, knowledge: { tong: 40, daKiem: 30, hienHanh: 38, daThayThe: 2, theoLoai: { 'quy-chuan': 39, 'tai-lieu-du-an': 1 } } });
  const by = (id: string) => s.find((x) => x.id === id)!;
  ok('vật liệu = 2, thumb chỉ món có ảnh (1)', by('vat-lieu').count === 2 && by('vat-lieu').thumbs.length === 1);
  ok('ảnh = 6 (gồm ghế), thumb cắt ở 4', by('anh-tai-san').count === 6 && by('anh-tai-san').thumbs.length === 4);
  ok('mô hình 3D = 1 (Lincoln 327 qua bảng object-3d-models)', by('mo-hinh-3d').count === 1 && by('mo-hinh-3d').thumbs[0]?.url === '/g/1');
  ok('mẫu hồ sơ gom mọi kệ ngăn "mau" = 2', by('mau-ho-so').count === 2);
  ok('ký hiệu 2D = built-in + 1 món DB', by('ky-hieu-2d').count === 12 + 1);
  ok('cấu kiện = 3, chi tiết theo loại đúng thứ tự chuẩn (Vật liệu trước Đồ rời)', by('cau-kien').count === 3 && by('cau-kien').chiTiet.map((c) => c[0]).join(' · ') === 'Vật liệu 1 · Đồ rời 2');
  ok('Thẻ DNA = 3 thẻ / 2 dự án', by('the-dna').count === 3 && by('the-dna').chiTiet[0][0] === '2 dự án đã soi');
  ok('tri thức = 40, dòng đã đối chiếu 30', by('tri-thuc').count === 40 && by('tri-thuc').chiTiet[0][0] === 'Đã đối chiếu nguồn 30');
  ok('không mục nào vượt 4 thumb', s.every((x) => x.thumbs.length <= 4));
}

console.log('idfcKindBreakdown() · sectionIndexMap()');
{
  ok('rỗng → rỗng', idfcKindBreakdown([]).length === 0);
  ok('loại 0 không hiện', idfcKindBreakdown(['soft']).length === 1);
  const idx = sectionIndexMap(buildLibraryOverview(RONG));
  const nums = OVERVIEW_SECTIONS.map((d) => idx[d.id]);
  ok('số ô liền mạch 01..N, 2 chữ số', nums.join() === OVERVIEW_SECTIONS.map((_, i) => String(i + 1).padStart(2, '0')).join());
  ok('mọi mục có `khong` đều mang lý do song ngữ', OVERVIEW_SECTIONS.every((d) => d.chinh.kieu !== 'khong' || (d.chinh.lyDo[0] && d.chinh.lyDo[1])));
  ok('mọi mục có nhãn + mô tả song ngữ', OVERVIEW_SECTIONS.every((d) => d.label[0] && d.label[1] && d.moTa[0] && d.moTa[1]));
}

console.log(`\n${pass} ok · ${fail} fail`);
if (fail > 0) process.exit(1);
