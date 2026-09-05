/**
 * lib/gu/inspiration-facets.test.ts — chạy: `node_modules/.bin/sucrase-node lib/gu/inspiration-facets.test.ts`
 */
import assert from 'assert';
import {
  buildInspirationTags,
  classifyLicense,
  extractFacetsFromText,
  normalizeLicenseTag,
  parseInspirationTags,
  stockPhotoImportTags,
  tagsToFreeText,
} from './inspiration-facets';

let n = 0;
function it(name: string, fn: () => void) {
  fn();
  n++;
  console.log(`  ✓ ${name}`);
}

console.log('inspiration-facets');

it('trích facet VI+EN từ chữ tự do — nhãn chuẩn EN, không trùng', () => {
  const f = extractFacetsFromText('Phòng khách japandi, sàn gỗ óc chó, đèn thả ấm 2700K, sofa bouclé');
  assert.deepStrictEqual(f.space, ['living room']);
  assert.ok(f.surface.includes('floor'));
  assert.ok(f.material.includes('walnut') && f.material.includes('wood') && f.material.includes('boucle'));
  assert.ok(f.light.includes('pendant light') && f.light.includes('warm 2700K') && f.light.includes('warm light'));
  assert.deepStrictEqual(f.style, ['japandi']);
  assert.ok(f.furniture.includes('sofa'));
});

it('chữ rỗng → mọi facet rỗng (không đoán)', () => {
  const f = extractFacetsFromText('');
  for (const k of Object.keys(f) as Array<keyof typeof f>) assert.deepStrictEqual(f[k], []);
});

it('build → parse tag đi vòng tròn, có inspo:1 đứng đầu, dấu phẩy trong giá trị bị thay', () => {
  const tags = buildInspirationTags({
    projectId: 'proj_1',
    license: 'cc-by-4.0',
    source: 'https://openverse.org/image/abc',
    facets: { space: ['living room'], surface: ['floor'], material: ['oak, walnut'], light: ['warm light'], style: ['japandi'] },
    extra: ['nganh:noi-that'],
  });
  assert.ok(tags.startsWith('inspo:1,'));
  const info = parseInspirationTags(tags);
  assert.strictEqual(info.isInspiration, true);
  assert.strictEqual(info.projectId, 'proj_1');
  assert.strictEqual(info.license, 'cc-by-4.0');
  assert.strictEqual(info.source, 'https://openverse.org/image/abc');
  assert.deepStrictEqual(info.facets.space, ['living room']);
  assert.deepStrictEqual(info.facets.surface, ['floor']);
  assert.deepStrictEqual(info.facets.material, ['oak; walnut']);
  assert.deepStrictEqual(info.facets.style, ['japandi']);
  assert.ok(tags.includes('nganh:noi-that'));
});

it('tag lạ / surface không hợp lệ bị bỏ qua, mat: được đọc như material:', () => {
  const info = parseInspirationTags('foo:bar,surface:roof,mat:brass,material:brass,material:oak');
  assert.strictEqual(info.isInspiration, false);
  assert.deepStrictEqual(info.facets.surface, []);
  assert.deepStrictEqual(info.facets.material, ['brass', 'oak']);
});

it('phân loại giấy phép: CC0/studio tự do · CC-BY/Unsplash ghi công · user tự chịu · ai · lạ=unknown', () => {
  assert.strictEqual(classifyLicense('cc0').cls, 'lawful-free');
  assert.strictEqual(classifyLicense('studio').cls, 'lawful-free');
  assert.strictEqual(classifyLicense('cc-by-4.0').cls, 'lawful-attribution');
  assert.strictEqual(classifyLicense('CC-BY-SA 4.0').attributionRequired, true);
  assert.strictEqual(classifyLicense('Unsplash License').cls, 'lawful-attribution');
  assert.strictEqual(classifyLicense('user').cls, 'user-responsibility');
  assert.strictEqual(classifyLicense('Người dùng tự chịu trách nhiệm bản quyền').cls, 'user-responsibility');
  assert.strictEqual(classifyLicense('ai').cls, 'ai');
  assert.strictEqual(classifyLicense('').cls, 'unknown');
  assert.strictEqual(classifyLicense('WTFPL').cls, 'unknown');
});

it('chuẩn hoá tag giấy phép theo nguồn nhập', () => {
  assert.strictEqual(normalizeLicenseTag('unsplash', 'Unsplash License'), 'unsplash');
  assert.strictEqual(normalizeLicenseTag('link', ''), 'user');
  assert.strictEqual(normalizeLicenseTag('openverse', 'BY 4.0'), 'cc-by-4.0');
  assert.strictEqual(normalizeLicenseTag('openverse', 'CC0 1.0'), 'cc0');
  assert.strictEqual(normalizeLicenseTag('openverse', 'BY-SA 4.0'), 'cc-by-sa-4.0');
  assert.strictEqual(normalizeLicenseTag('upload', 'studio'), 'studio');
  assert.strictEqual(normalizeLicenseTag('upload', ''), 'user');
});

it('tag nhập từ StockPhoto: giấy phép chuẩn hoá, nguồn = trang gốc, facet từ tiêu đề, ghi công', () => {
  const tags = stockPhotoImportTags(
    { id: 'ov1', source: 'openverse', title: 'Japandi living room with oak floor', license: 'BY 4.0', landing: 'https://flickr.com/p/1', full: 'https://img/1.jpg', creditName: 'Ann' },
    'proj_9',
  );
  const info = parseInspirationTags(tags);
  assert.strictEqual(info.isInspiration, true);
  assert.strictEqual(info.projectId, 'proj_9');
  assert.strictEqual(info.license, 'cc-by-4.0');
  assert.strictEqual(info.source, 'https://flickr.com/p/1');
  assert.deepStrictEqual(info.facets.space, ['living room']);
  assert.ok(info.facets.material.includes('oak'));
  assert.ok(tags.includes('credit:Ann') && tags.includes('nganh:noi-that'));
  const link = stockPhotoImportTags({ id: 'u', source: 'link', title: '', license: 'x', landing: 'https://cdn/a.jpg', full: 'https://cdn/a.jpg', creditName: '' }, null);
  assert.strictEqual(parseInspirationTags(link).license, 'user');
  assert.strictEqual(parseInspirationTags(link).projectId, null);
});

it('tag có tiền tố KHÔNG lọt vào chữ tự do (space:living room không được khớp thành "spa")', () => {
  const free = tagsToFreeText('inspo:1,space:living room,license:cc0,japandi,nguon:https://x.y');
  assert.strictEqual(free, 'japandi');
  assert.deepStrictEqual(extractFacetsFromText(free).space, []);
  assert.deepStrictEqual(extractFacetsFromText('space:living room').space, ['living room', 'spa']); // vì sao phải lọc
});

console.log(`${n} test PASS — inspiration-facets`);
