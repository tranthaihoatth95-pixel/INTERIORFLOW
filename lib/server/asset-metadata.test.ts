/**
 * lib/server/asset-metadata.test.ts — cửa TRÍCH + cửa DỰNG BẢN GHI.
 *
 * ⭐ CÁCH KIỂM KÍCH THƯỚC ĐÁNG GHI LẠI: **hai bản cài độc lập phải đồng ý với nhau.**
 * Ảnh fixture do `sharp` SINH THẬT (không phải header bịa tay), rồi parser header thuần của ta
 * đọc lại và phải khớp ĐÚNG số mà sharp khai. Nếu ta tự dựng header rồi tự đọc header thì test
 * chỉ chứng minh ta nhất quán với chính mình — không chứng minh ta đọc đúng ảnh thật.
 *
 * KHÔNG chạm DB, KHÔNG ghi `./uploads` — thuần + fixture trong bộ nhớ.
 * Chạy: node_modules/.bin/sucrase-node lib/server/asset-metadata.test.ts
 */
import assert from 'node:assert';
import {
  docKichThuocTuHeader,
  trichPaletteTuRgba,
  trichSieuDuLieu,
  dungBanGhiLibraryAsset,
  PALETTE_TOI_DA,
} from './asset-metadata';
import { bamContentHash } from '../../app/api/project-files/_lib/luu-file';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass++; console.log('  ok  -', label); }
  else { fail++; console.log('  FAIL-', label); }
}

type SharpTao = (o?: unknown) => {
  png(): { toBuffer(): Promise<Buffer> };
  jpeg(): { toBuffer(): Promise<Buffer> };
  gif(): { toBuffer(): Promise<Buffer> };
  webp(o?: unknown): { toBuffer(): Promise<Buffer> };
};

async function main() {
  const mod = (await import('sharp')) as unknown as { default?: SharpTao };
  const sharp = (mod.default ?? (mod as unknown as SharpTao)) as SharpTao;
  const ve = (w: number, h: number, rgb: { r: number; g: number; b: number }) =>
    sharp({ create: { width: w, height: h, channels: 3, background: rgb } } as unknown);

  const do1 = { r: 200, g: 30, b: 40 };

  /* ═══ ① KÍCH THƯỚC TỪ HEADER — đối chiếu với ảnh sharp sinh thật ═══ */
  console.log('docKichThuocTuHeader — parser thuần vs ảnh sharp sinh thật');
  const png = await ve(20, 12, do1).png().toBuffer();
  assert.deepEqual(docKichThuocTuHeader(png), { w: 20, h: 12 });
  ok('PNG 20×12 — đọc đúng từ IHDR', true);

  const jpg = await ve(33, 17, { r: 10, g: 200, b: 90 }).jpeg().toBuffer();
  assert.deepEqual(docKichThuocTuHeader(jpg), { w: 33, h: 17 });
  ok('JPEG 33×17 — quét marker tới SOF, KHÔNG nhầm DHT/RSTn', true);

  const gif = await ve(14, 6, { r: 9, g: 9, b: 9 }).gif().toBuffer();
  assert.deepEqual(docKichThuocTuHeader(gif), { w: 14, h: 6 });
  ok('GIF 14×6 — little-endian (đọc big-endian sẽ ra số rác)', true);

  const webp = await ve(41, 23, { r: 5, g: 5, b: 200 }).webp().toBuffer();
  assert.deepEqual(docKichThuocTuHeader(webp), { w: 41, h: 23 });
  ok('WEBP lossy (chunk VP8 ) 41×23', true);

  const webpLl = await ve(8, 9, { r: 1, g: 2, b: 3 }).webp({ lossless: true }).toBuffer();
  assert.deepEqual(docKichThuocTuHeader(webpLl), { w: 8, h: 9 });
  ok('WEBP lossless (chunk VP8L) 8×9 — nhồi bit 14+14, off-by-one là sai ngay', true);

  // Không đoán bừa: rác / quá ngắn / PDF ⇒ null, KHÔNG trả 0×0 giả vờ đã đọc.
  assert.equal(docKichThuocTuHeader(Buffer.from('khong phai anh gi ca', 'utf8')), null);
  assert.equal(docKichThuocTuHeader(Buffer.alloc(4)), null);
  assert.equal(docKichThuocTuHeader(Buffer.from('%PDF-1.4\n% x\n'.padEnd(64, ' '), 'utf8')), null);
  ok('rác · buffer cụt · PDF ⇒ null (không bịa kích thước)', true);

  /* ═══ ② PALETTE — thuần, không cần ảnh ═══ */
  console.log('trichPaletteTuRgba — thuần');
  const dac = (n: number, r: number, g: number, b: number) => {
    const out = Buffer.alloc(n * 4);
    for (let i = 0; i < n; i++) { out[i * 4] = r; out[i * 4 + 1] = g; out[i * 4 + 2] = b; out[i * 4 + 3] = 255; }
    return out;
  };
  assert.deepEqual(trichPaletteTuRgba(dac(50, 0xc8, 0x1e, 0x28)), ['#c81e28']);
  ok('một màu đặc ⇒ đúng 1 hex', true);

  // Trong suốt hoàn toàn ⇒ RỖNG, không phải '#000000'. Đây đúng ca dễ bịa nhất.
  const trong = Buffer.alloc(40 * 4);
  assert.deepEqual(trichPaletteTuRgba(trong), []);
  ok('alpha=0 toàn bộ ⇒ palette RỖNG (không trả đen giả)', true);

  // Hai màu cách xa ⇒ tách; hai màu sát nhau ⇒ gộp (ngưỡng 60).
  assert.equal(trichPaletteTuRgba(Buffer.concat([dac(30, 250, 0, 0), dac(30, 0, 0, 250)])).length, 2);
  assert.equal(trichPaletteTuRgba(Buffer.concat([dac(30, 100, 100, 100), dac(30, 105, 103, 101)])).length, 1);
  ok('tách màu xa · gộp màu gần (ngưỡng 60) — cùng luật bản trình duyệt', true);

  const nhieu = Buffer.concat(
    Array.from({ length: 12 }, (_, i) => dac(10, (i * 21) % 256, (i * 83) % 256, (i * 141) % 256)),
  );
  assert.ok(trichPaletteTuRgba(nhieu).length <= PALETTE_TOI_DA);
  ok(`trần ${PALETTE_TOI_DA} màu được tôn trọng`, true);

  /* ═══ ③ TRÍCH TRỌN GÓI ═══ */
  console.log('trichSieuDuLieu — w/h/palette/contentHash cùng một lượt');
  const meta = await trichSieuDuLieu(png);
  assert.equal(meta.w, 20);
  assert.equal(meta.h, 12);
  assert.equal(meta.contentHash, bamContentHash(png), 'PHẢI là cùng hàm băm với ProjectFile');
  assert.equal(meta.contentHash.length, 64);
  assert.ok(meta.palette.length >= 1, 'ảnh đặc màu phải ra ít nhất 1 màu');
  assert.ok(/^#[0-9a-f]{6}$/.test(meta.palette[0]));
  ok('PNG thật ⇒ w=20 h=12, palette có màu, hash khớp bamContentHash', true);

  // hash có sẵn (từ ProjectFile.contentHash) ⇒ DÙNG LẠI, không băm lần hai.
  const gia = 'a'.repeat(64);
  assert.equal((await trichSieuDuLieu(png, gia)).contentHash, gia);
  // …nhưng chuỗi không phải sha256 hex 64 ký tự thì KHÔNG tin, tự băm lại.
  assert.equal((await trichSieuDuLieu(png, 'ngan')).contentHash, bamContentHash(png));
  ok('hash có sẵn được dùng lại; hash dị dạng bị bỏ, tự băm lại', true);

  // PDF: sharp không giải mã được ⇒ w/h = 0 và PHẢI có ghi chú, không im lặng.
  const pdf = Buffer.from('%PDF-1.4\n% test\n');
  const metaPdf = await trichSieuDuLieu(pdf);
  assert.equal(metaPdf.w, 0);
  assert.equal(metaPdf.h, 0);
  assert.deepEqual(metaPdf.palette, []);
  assert.equal(metaPdf.contentHash, bamContentHash(pdf));
  assert.ok(metaPdf.ghiChu.length > 0, 'thiếu dữ liệu thì PHẢI khai lý do');
  ok('PDF ⇒ 0×0 + palette rỗng + CÓ ghi chú lý do (khai thật, không bịa)', true);

  /* ═══ ④ DỰNG BẢN GHI — nửa "ghi" của hàm chung ═══ */
  console.log('dungBanGhiLibraryAsset — một khuôn cho cả hai cửa ghi');
  const r1 = dungBanGhiLibraryAsset({
    userId: 'u1', name: 'x', category: 'ref-render', mime: 'image/png', path: 'a.png',
    usage: 'ref-render', tags: 'license:user', meta,
  });
  assert.equal(r1.w, 20);
  assert.equal(r1.h, 12);
  assert.equal(r1.contentHash, meta.contentHash);
  assert.deepEqual(JSON.parse(r1.palette), meta.palette);
  ok('có meta ⇒ w/h/palette/contentHash đi thẳng vào bản ghi', true);

  // Không trích được ⇒ contentHash NULL (không phải ''), và rơi về giá trị client khai.
  const r2 = dungBanGhiLibraryAsset({
    userId: 'u1', name: 'x', category: 'c', mime: 'image/png', path: 'a.png', usage: 'ref-render',
    meta: null, wDuPhong: 640, hDuPhong: 480, paletteDuPhong: ['#123456', 7, '#abcdef'],
  });
  assert.equal(r2.contentHash, null, "chưa hash được thì phải là NULL, '' sẽ gom thành nhóm trùng giả");
  assert.equal(r2.w, 640);
  assert.equal(r2.h, 480);
  assert.deepEqual(JSON.parse(r2.palette), ['#123456', '#abcdef'], 'phần tử không phải chuỗi bị loại');
  ok('không meta ⇒ contentHash NULL + đường lùi client, lọc phần tử rác', true);

  const r3 = dungBanGhiLibraryAsset({
    userId: 'u1', name: 'y'.repeat(300), category: 'c', mime: 'image/png', path: 'a.png',
    usage: 'ref-render', meta: null, caption: 'z'.repeat(900),
  });
  assert.equal(r3.name.length, 120);
  assert.equal(r3.caption.length, 400);
  assert.equal(r3.palette, '', 'không có màu ⇒ chuỗi rỗng, không phải "[]"');
  ok('trần độ dài name/caption giữ nguyên như cửa cũ', true);

  console.log(`\n${pass} pass, ${fail} fail`);
  if (fail) process.exit(1);
}

void main();
