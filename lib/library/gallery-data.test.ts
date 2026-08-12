/** Test phần THUẦN của `gallery-data.ts` (bỏ qua `useGalleryAssets`, đó là hook cần DOM/fetch) —
 *  chạy: node_modules/.bin/sucrase-node lib/library/gallery-data.test.ts
 *  Import TƯƠNG ĐỐI theo đúng quy ước test sucrase-node. */
import { collectionLabel, collectionsFrom, groupByIndustry, ungroupedOf, type GalleryAsset } from './gallery-data';
import type { GalleryIndustry } from './gallery-tags';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) { pass++; console.log('  ok  -', name); }
  else { fail++; console.log('  FAIL-', name); }
}
function eq(name: string, a: unknown, b: unknown) {
  ok(`${name} (${JSON.stringify(a)} = ${JSON.stringify(b)})`, JSON.stringify(a) === JSON.stringify(b));
}

function asset(over: Partial<GalleryAsset>): GalleryAsset {
  return {
    id: over.id ?? 'x', imgId: over.imgId ?? 'img_x', name: over.name ?? 'Ảnh', category: over.category ?? 'c',
    caption: over.caption ?? '', url: over.url ?? 'https://x/y.jpg', mine: over.mine ?? false,
    nganh: over.nganh ?? null, license: over.license ?? null, nguon: over.nguon ?? null,
    bosuutap: over.bosuutap ?? [], hasSource: over.hasSource ?? false,
  };
}

console.log('groupByIndustry — giữ THỨ TỰ order truyền vào, bỏ nhóm rỗng');
const ORDER: GalleryIndustry[] = ['kien-truc', 'noi-that', 'canh-quan', 'graphic', 'art'];
const assets = [
  asset({ id: '1', nganh: 'noi-that' }),
  asset({ id: '2', nganh: 'kien-truc' }),
  asset({ id: '3', nganh: 'noi-that' }),
  asset({ id: '4', nganh: null }), // chưa gắn nhóm — không rơi vào group nào
];
const groups = groupByIndustry(assets, ORDER);
eq('thứ tự group đúng ORDER, bỏ canh-quan/graphic/art rỗng', groups.map((g) => g.id), ['kien-truc', 'noi-that']);
eq('nhóm noi-that có 2 món', groups.find((g) => g.id === 'noi-that')?.items.length, 2);

console.log('ungroupedOf — ảnh chưa gắn nganh: rơi ra ngoài, KHÔNG đoán bừa (N4)');
eq('1 ảnh chưa gắn nhóm', ungroupedOf(assets).map((a) => a.id), ['4']);

console.log('collectionsFrom — CHỈ tính ảnh hasSource, bỏ ảnh thiếu nguồn dù có gắn bosuutap:');
const col = [
  asset({ id: 'a', hasSource: true, bosuutap: ['gio-vang'] }),
  asset({ id: 'b', hasSource: true, bosuutap: ['gio-vang'] }),
  asset({ id: 'c', hasSource: false, bosuutap: ['gio-vang'] }), // thiếu nguồn -> KHÔNG được tính
  asset({ id: 'd', hasSource: true, bosuutap: ['toi-gian'] }),
];
const cols = collectionsFrom(col);
eq('2 bộ sưu tập', cols.map((c) => c.slug).sort(), ['gio-vang', 'toi-gian']);
eq('gio-vang chỉ có 2 món (a,b — bỏ c thiếu nguồn)', cols.find((c) => c.slug === 'gio-vang')?.items.map((i) => i.id), ['a', 'b']);
ok('sắp theo số món giảm dần', cols[0].items.length >= cols[1].items.length);

console.log('collectionLabel — slug -> nhãn hiển thị được');
eq('anh-sang-tu-nhien', collectionLabel('anh-sang-tu-nhien'), 'Anh Sang Tu Nhien');
eq('rỗng -> rỗng', collectionLabel(''), '');

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
