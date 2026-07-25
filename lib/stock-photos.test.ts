/**
 * lib/stock-photos.test.ts — chạy: `node_modules/.bin/sucrase-node lib/stock-photos.test.ts`
 * (KHÔNG vitest — xem STATUS.md quy tắc session).
 *
 * Bọc phần THUẦN của nguồn ảnh ngoài: chặn SSRF, nhận diện link trang Pinterest, chuẩn hoá
 * kết quả Unsplash/Openverse, dòng ghi công, và luật "thiếu key → ẩn nguồn".
 */

import assert from 'assert';
import {
  availableSources,
  creditLine,
  isFetchableImageUrl,
  isPinterestPageUrl,
  normalizeOpenverse,
  normalizeUnsplash,
  photoFromLink,
  UNSPLASH_UTM,
} from './stock-photos';

let n = 0;
function it(name: string, fn: () => void) {
  fn();
  n++;
  console.log(`  ✓ ${name}`);
}

console.log('stock-photos');

/* ── chặn SSRF / URL rác ── */
it('nhận URL ảnh https công khai', () => {
  const r = isFetchableImageUrl('https://images.unsplash.com/photo-1?w=800');
  assert.ok(r.ok);
});
it('từ chối host nội bộ, loopback, dải riêng, .local', () => {
  for (const bad of [
    'http://localhost:3000/a.jpg',
    'http://127.0.0.1/a.jpg',
    'http://10.0.0.5/a.jpg',
    'http://192.168.1.9/a.jpg',
    'http://172.16.0.1/a.jpg',
    'http://169.254.169.254/latest/meta-data',
    'http://nas.local/a.jpg',
    'http://[::1]/a.jpg',
  ]) {
    const r = isFetchableImageUrl(bad);
    assert.strictEqual(r.ok, false, `phải chặn: ${bad}`);
  }
});
it('từ chối giao thức khác http(s) và URL rỗng/sai', () => {
  assert.strictEqual(isFetchableImageUrl('file:///etc/passwd').ok, false);
  assert.strictEqual(isFetchableImageUrl('data:image/png;base64,AAA').ok, false);
  assert.strictEqual(isFetchableImageUrl('   ').ok, false);
  assert.strictEqual(isFetchableImageUrl('không-phải-url').ok, false);
});

/* ── Pinterest: chỉ NHẬN DIỆN để hướng dẫn, KHÔNG scrape ── */
it('nhận diện link trang Pinterest (pinterest.com, pinterest.co.uk, pin.it)', () => {
  assert.ok(isPinterestPageUrl('https://www.pinterest.com/pin/12345/'));
  assert.ok(isPinterestPageUrl('https://pinterest.co.uk/board/abc/'));
  assert.ok(isPinterestPageUrl('https://pin.it/abcdef'));
});
it('URL ảnh CDN Pinterest không bị coi là link trang', () => {
  assert.strictEqual(isPinterestPageUrl('https://i.pinimg.com/originals/aa/bb/x.jpg'), false);
  assert.ok(isFetchableImageUrl('https://i.pinimg.com/originals/aa/bb/x.jpg').ok);
});

/* ── chuẩn hoá Unsplash ── */
it('normalizeUnsplash: map đủ field + gắn UTM vào link ghi công', () => {
  const [p] = normalizeUnsplash([
    {
      id: 'abc',
      alt_description: 'warm stone lobby',
      width: 4000,
      height: 3000,
      urls: { small: 'https://i/s.jpg', regular: 'https://i/r.jpg' },
      links: { html: 'https://unsplash.com/photos/abc', download_location: 'https://api.unsplash.com/photos/abc/download' },
      user: { name: 'Ai Đó', links: { html: 'https://unsplash.com/@aido' } },
    },
  ]);
  assert.strictEqual(p.source, 'unsplash');
  assert.strictEqual(p.full, 'https://i/r.jpg');
  assert.strictEqual(p.thumb, 'https://i/s.jpg');
  assert.strictEqual(p.creditName, 'Ai Đó');
  assert.strictEqual(p.license, 'Unsplash License');
  assert.ok(p.landing.includes(UNSPLASH_UTM), 'landing phải có UTM');
  assert.ok(p.creditUrl.includes(UNSPLASH_UTM), 'creditUrl phải có UTM');
  assert.strictEqual(p.downloadLocation, 'https://api.unsplash.com/photos/abc/download');
});
it('normalizeUnsplash: bỏ bản ghi thiếu ảnh/id, chịu được input rác', () => {
  assert.strictEqual(normalizeUnsplash([{ id: 'x' }, { urls: { regular: 'https://i/a.jpg' } }]).length, 0);
  assert.strictEqual(normalizeUnsplash(null).length, 0);
  assert.strictEqual(normalizeUnsplash('nope').length, 0);
});

/* ── chuẩn hoá Openverse ── */
it('normalizeOpenverse: gộp license + version, giữ landing', () => {
  const [p] = normalizeOpenverse([
    {
      id: 'ov1',
      url: 'https://o/full.jpg',
      thumbnail: 'https://o/t.jpg',
      title: 'Ghế gỗ',
      creator: 'Tác Giả',
      license: 'by-sa',
      license_version: '4.0',
      license_url: 'https://creativecommons.org/licenses/by-sa/4.0/',
      foreign_landing_url: 'https://flickr/1',
    },
  ]);
  assert.strictEqual(p.source, 'openverse');
  assert.strictEqual(p.license, 'BY-SA 4.0');
  assert.strictEqual(p.landing, 'https://flickr/1');
  assert.strictEqual(p.downloadLocation, '');
});
it('normalizeOpenverse: bỏ bản ghi không có url', () => {
  assert.strictEqual(normalizeOpenverse([{ id: 'a' }]).length, 0);
});

/* ── ghi công ── */
it('creditLine ghi đủ tác giả · giấy phép · nguồn', () => {
  const [u] = normalizeUnsplash([
    { id: 'a', urls: { regular: 'https://i/r.jpg' }, user: { name: 'Nam' }, links: {} },
  ]);
  assert.strictEqual(creditLine(u), 'Nam · Unsplash License · Unsplash');
  const [o] = normalizeOpenverse([{ url: 'https://o/a.jpg', creator: 'Mai', license: 'by' }]);
  assert.strictEqual(creditLine(o), 'Mai · BY · Openverse');
});
it('creditLine: thiếu tác giả vẫn không rỗng (ảnh API), link dán thì ghi host', () => {
  const [o] = normalizeOpenverse([{ url: 'https://o/a.jpg', license: 'cc0' }]);
  assert.ok(creditLine(o).includes('Không rõ tác giả'));
  const l = photoFromLink('https://i.pinimg.com/originals/x.jpg');
  assert.strictEqual(l.source, 'link');
  assert.strictEqual(l.creditName, 'i.pinimg.com');
  assert.ok(creditLine(l).includes('i.pinimg.com'));
});

/* ── ẩn nguồn khi thiếu key ── */
it('thiếu UNSPLASH_ACCESS_KEY → nguồn unsplash biến mất khỏi danh sách', () => {
  const off = availableSources(false).map((s) => s.id);
  assert.deepStrictEqual(off, ['openverse', 'link']);
  const on = availableSources(true).map((s) => s.id);
  assert.deepStrictEqual(on, ['openverse', 'unsplash', 'link']);
});
it('mọi nguồn có ghi chú song ngữ (UI phải nói rõ giới hạn)', () => {
  for (const s of availableSources(true)) {
    assert.ok(s.noteVi && s.noteVi.length > 10, `${s.id} thiếu noteVi`);
    assert.ok(s.noteEn && s.noteEn.length > 10, `${s.id} thiếu noteEn`);
  }
});

console.log(`\n${n} test PASS — stock-photos\n`);
