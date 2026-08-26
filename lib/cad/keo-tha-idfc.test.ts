/**
 * lib/cad/keo-tha-idfc.test.ts — ĐÓNG LỖ "kệ đầy mà kéo không xuống".
 * Chạy: `node_modules/.bin/sucrase-node lib/cad/keo-tha-idfc.test.ts`
 *
 * 🔴 VÌ SAO CÓ TỆP NÀY: lane B (22/08) nạp 73 món thật lên kệ rồi TỰ KHAI rủi ro lớn nhất —
 * *"chưa thử kéo–thả một món mầm xuống bản vẽ; nhánh `via:'idfc'` có sẵn nhưng CHƯA CHẠY THẬT
 * LẦN NÀO"*. Nhánh có mã, tsc xanh, test cũ xanh — nhưng không có gì chứng minh **dữ liệu mầm
 * thật** đi hết được chuỗi. Đúng loại lỗ mà `soi:*` và tsc đều mù: mã đúng, dây đủ, mà đầu này
 * không khớp đầu kia.
 *
 * Chuỗi kiểm ĐÚNG chuỗi `LibraryDropBridge.dropItem` chạy khi người dùng thả:
 *   bản ghi mầm → `idfcGeom2dOf` → `resolveLibraryItem` → `clusterPrimsToEntities` → nét trên bản vẽ
 * Không giả lập mắt xích nào — mỗi hàm là hàm THẬT bridge gọi.
 *
 * Phần bridge KHÔNG phủ được ở đây (khai thật, không lấp liếm): `dropPoint()` (cần `window`),
 * `hydrateIdfcStore()` (cần IndexedDB), và cú thả bằng chuột thật. Ba thứ đó phải đo trên trình
 * duyệt. Cái đóng được bằng máy thì đóng bằng máy.
 */
import { SEED_IDFC_ITEMS } from '../idfc-seed';
import { idfcGeom2dOf, resolveLibraryItem } from './library-item-resolve';
import { clusterPrimsToEntities } from './block-library';

let fail = 0;
function ok(msg: string, cond: unknown) {
  if (cond) console.log('  ok  -', msg);
  else { fail += 1; console.log('  FAIL -', msg); }
}

console.log('\nkéo-thả .idfc — món mầm THẬT phải xuống được bản vẽ');

/** Đúng hình dạng `LibraryItemRef` mà LibrarySheet:323 dựng cho món kho studio. */
const refCua = (s: (typeof SEED_IDFC_ITEMS)[number]) => ({
  id: `idfc:${s.meta.code}`, shelfId: 'common-idfc', name: s.meta.name, code: s.meta.code,
});

console.log('\n[1] Kho mầm không rỗng (nếu rỗng thì mọi mục dưới đều đạt VÔ NGHĨA)');
ok('có món mầm', SEED_IDFC_ITEMS.length > 0);
console.log(`      (${SEED_IDFC_ITEMS.length} món)`);

console.log('\n[2] Món CÓ hình 2D phải đi hết chuỗi và ra NÉT THẬT');
const coHinh = SEED_IDFC_ITEMS.filter((s) => idfcGeom2dOf(s.body));
ok('ít nhất một món mang hình 2D', coHinh.length > 0);
console.log(`      (${coHinh.length}/${SEED_IDFC_ITEMS.length} món mang hình 2D)`);

let raNet = 0;
let khongIdfc: string[] = [];
let rong: string[] = [];
for (const s of coHinh) {
  const g = idfcGeom2dOf(s.body)!;
  const hit = resolveLibraryItem(refCua(s), null, undefined, g);
  if (!hit || hit.via !== 'idfc') { khongIdfc.push(s.meta.code); continue; }
  const ents = clusterPrimsToEntities(hit.geom2d.prims, { x: 0, y: 0 }, { layer: 'l-furniture' });
  if (ents.length === 0) { rong.push(s.meta.code); continue; }
  raNet += 1;
}
ok('MỌI món có hình 2D đều khớp nhánh via:"idfc"', khongIdfc.length === 0);
if (khongIdfc.length) console.log('      không ra nhánh idfc:', khongIdfc.slice(0, 5).join(', '));
ok('KHÔNG món nào ra 0 nét (thả xuống mà bản vẽ trống là hỏng câm)', rong.length === 0);
if (rong.length) console.log('      ra 0 nét:', rong.slice(0, 5).join(', '));
ok('số món xuống được bản vẽ = số món có hình', raNet === coHinh.length);
console.log(`      (${raNet} món xuống được bản vẽ THẬT)`);

console.log('\n[3] Nét thả xuống phải TRUY được về mẫu gốc (không phải nét mồ côi)');
{
  const s = coHinh[0];
  const hit = resolveLibraryItem(refCua(s), null, undefined, idfcGeom2dOf(s.body)!);
  const ents = clusterPrimsToEntities((hit as any).geom2d.prims, { x: 12, y: 34 }, { layer: 'l-furniture' })
    .map((e) => ({ ...e, srcBlock: s.meta.code, srcInsertId: 'ins-test' }));
  ok('mọi nét mang srcBlock = mã mẫu', ents.every((e: any) => e.srcBlock === s.meta.code));
  ok('mọi nét chung MỘT srcInsertId (bấm 1 nét chọn cả cụm)', new Set(ents.map((e: any) => e.srcInsertId)).size === 1);
  ok('nét nằm ở lớp nội thất', ents.every((e: any) => e.layer === 'l-furniture'));
}

console.log('\n[4] Món KHÔNG có hình 2D phải im — không được đẻ nét bịa');
{
  const khong = SEED_IDFC_ITEMS.filter((s) => !idfcGeom2dOf(s.body));
  console.log(`      (${khong.length} món không mang hình 2D)`);
  ok('món không hình ⇒ idfcGeom2dOf trả undefined (bridge báo đúng nguyên nhân)',
    khong.every((s) => idfcGeom2dOf(s.body) === undefined));
}

console.log(fail === 0 ? '\nTẤT CẢ ĐẠT\n' : `\n${fail} MỤC HỎNG\n`);
if (fail > 0) process.exit(1);

/* ═══════════════════════════════════════════════════════════════════════════════════════════
 * [5] CHẶN TÁI PHÁT — KỆ VÀ CÚ THẢ PHẢI ĐỌC CÙNG MỘT NGUỒN
 *
 * 🔴 Ca thật 22/08: kệ Thư viện dựng danh sách bằng `tronKhoMam(loadIdfcStore())` (kho studio
 * TRỘN kho mầm) còn `LibraryDropBridge` chỉ đọc `loadIdfcStore()` — CHỈ IndexedDB. Món mầm không
 * nằm trong IDB ⇒ kệ bày 73 món mà kéo xuống tra không thấy, tuột sang nhánh khớp-tên: ra 1 nét
 * chung chung thay vì 41 nét hình thật, `srcBlock` rỗng nên đứt đường truy về mẫu gốc.
 *
 * Vì sao mục [1]-[4] ở trên KHÔNG bắt được: chúng gọi thẳng hàm với dữ liệu mầm trong tay, tức
 * đã GIẢ ĐỊNH sẵn điều đang hỏng — nguồn nào nuôi bridge. Lỗi nằm ở CHỖ NỐI, không nằm trong hàm.
 * Nên mục này soi thẳng mã nguồn hai bên, thứ duy nhất chứng minh được hai đầu cùng một nguồn.
 * ══════════════════════════════════════════════════════════════════════════════════════════ */
{
  const { readFileSync } = require('fs') as typeof import('fs');
  const { join } = require('path') as typeof import('path');
  const doc = (p: string) => readFileSync(join(__dirname, '..', '..', p), 'utf8');
  const bridge = doc('components/cad/LibraryDropBridge.tsx');
  const sheet = doc('components/library/LibrarySheet.tsx');

  console.log('\n[5] Kệ và cú thả đọc CÙNG MỘT NGUỒN (chặn tái phát ca 22/08)');
  ok('kệ trộn kho mầm (tronKhoMam)', /tronKhoMam\s*\(/.test(sheet));
  ok('cú thả CŨNG trộn kho mầm — không đọc trống loadIdfcStore()', /tronKhoMam\s*\(\s*loadIdfcStore\(\)\s*\)/.test(bridge));
  ok(
    'cú thả KHÔNG còn đường đọc loadIdfcStore() trần (đường đẻ ra lỗi)',
    !/(?<!tronKhoMam\()\bloadIdfcStore\(\)\s*\.find/.test(bridge),
  );
}
console.log(fail === 0 ? '\nTẤT CẢ ĐẠT\n' : `\n${fail} MỤC HỎNG\n`);
if (fail > 0) process.exit(1);
