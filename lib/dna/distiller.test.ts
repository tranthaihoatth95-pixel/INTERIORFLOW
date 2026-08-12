/** Test `distiller.ts` + `types.ts` — chạy: node_modules/.bin/sucrase-node lib/dna/distiller.test.ts
 *  Import TƯƠNG ĐỐI, thuần (không window/fs) — không cần dựng môi trường giả.
 */
import { distillDnaFromAssets, mergeDistilledIntoCard, type DnaSourceAsset } from './distiller';
import { DNA_LAYER_KEYS, emptyDnaLayers, newDnaCard, isDesignDnaCard } from './types';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) { pass++; console.log('  ok  -', name); }
  else { fail++; console.log('  FAIL-', name); }
}
function eq(name: string, a: unknown, b: unknown) {
  ok(`${name} (${JSON.stringify(a)} = ${JSON.stringify(b)})`, JSON.stringify(a) === JSON.stringify(b));
}

console.log('distillDnaFromAssets() — đủ 8 lớp, kể cả lớp trống');
{
  const layers = distillDnaFromAssets([]);
  eq('đủ 8 khoá đúng thứ tự DNA_LAYER_KEYS', Object.keys(layers), [...DNA_LAYER_KEYS]);
  for (const k of DNA_LAYER_KEYS) ok(`${k} trống khi 0 nguồn`, layers[k].values.length === 0);
}

console.log('distillDnaFromAssets() — CÓ NGUỒN: 1 ảnh đủ tag 4 lớp + palette + caption');
{
  const assets: DnaSourceAsset[] = [
    {
      id: 'img_A',
      caption: 'Phòng khách ánh nắng chiều',
      palette: ['#2b2620', '#c9b896'],
      tags: 'style:toi-gian, material:go-soi, light:hoang-hon, frame:can-canh',
    },
  ];
  const layers = distillDnaFromAssets(assets);
  eq('anhNguon nhận caption', layers.anhNguon.values, ['Phòng khách ánh nắng chiều']);
  eq('anhNguon.nguon = assetId', layers.anhNguon.nguon, ['img_A']);
  eq('ngonNguKhongGian từ tag style:', layers.ngonNguKhongGian.values, ['toi-gian']);
  eq('vatLieuMatId từ tag material:', layers.vatLieuMatId.values, ['go-soi']);
  eq('anhSang từ tag light:', layers.anhSang.values, ['hoang-hon']);
  eq('khungHinh từ tag frame:', layers.khungHinh.values, ['can-canh']);
  eq('mauTyLe từ palette', layers.mauTyLe.values, ['#2b2620', '#c9b896']);
  eq('mauTyLe.trangThai = inferred (chưa ai duyệt)', layers.mauTyLe.trangThai, 'inferred');
  ok('yDo luôn trống ở rule-based (không suy từ ảnh)', layers.yDo.values.length === 0);
  ok('rangBuocDoTin luôn trống ở rule-based', layers.rangBuocDoTin.values.length === 0);
}

console.log('distillDnaFromAssets() — THIẾU NGUỒN: ảnh không tag/không palette/không caption');
{
  const assets: DnaSourceAsset[] = [{ id: 'img_B' }];
  const layers = distillDnaFromAssets(assets);
  eq('anhNguon rơi về assetId khi không caption', layers.anhNguon.values, ['img_B']);
  ok('ngonNguKhongGian trống (không tag style:)', layers.ngonNguKhongGian.values.length === 0);
  ok('mauTyLe trống (không palette)', layers.mauTyLe.values.length === 0);
}

console.log('distillDnaFromAssets() — NHIỀU NGUỒN MÂU THUẪN → giữ cả hai, inferred, mat: và material: gộp chung lớp');
{
  const assets: DnaSourceAsset[] = [
    { id: 'img_C1', tags: 'style:toi-gian, material:go-soi' },
    { id: 'img_C2', tags: 'style:co-dien, mat:da-marble' },
  ];
  const layers = distillDnaFromAssets(assets);
  eq('ngonNguKhongGian giữ cả 2 style mâu thuẫn', layers.ngonNguKhongGian.values, ['toi-gian', 'co-dien']);
  eq('ngonNguKhongGian.nguon đủ 2 ảnh', layers.ngonNguKhongGian.nguon, ['img_C1', 'img_C2']);
  eq('vatLieuMatId gộp cả tiền tố material: và mat:', layers.vatLieuMatId.values, ['go-soi', 'da-marble']);
  eq('trạng thái vẫn inferred khi mâu thuẫn', layers.ngonNguKhongGian.trangThai, 'inferred');
}

console.log('mergeDistilledIntoCard() — lớp verified của người GIỮ NGUYÊN, lớp khác bị thay bằng bản mới');
{
  const current = emptyDnaLayers();
  current.ngonNguKhongGian = { values: ['toi-gian (đã chốt)'], trangThai: 'verified', nguon: ['manual'] };
  const distilled = distillDnaFromAssets([{ id: 'img_D', tags: 'style:cong-nghiep, material:thep' }]);
  const merged = mergeDistilledIntoCard(current, distilled);
  eq('ngonNguKhongGian KHÔNG bị đè vì đã verified', merged.ngonNguKhongGian.values, ['toi-gian (đã chốt)']);
  eq('ngonNguKhongGian.trangThai giữ verified', merged.ngonNguKhongGian.trangThai, 'verified');
  eq('vatLieuMatId (chưa verified) được cập nhật theo bản chưng cất mới', merged.vatLieuMatId.values, ['thep']);
}

console.log('newDnaCard() + isDesignDnaCard() — round-trip JSON giữ nguyên cấu trúc');
{
  const card = newDnaCard('proj_1', 'Phương án A', '2026-08-12T00:00:00.000Z');
  ok('newDnaCard() hợp lệ theo isDesignDnaCard', isDesignDnaCard(card));
  eq('đủ 8 lớp, mọi lớp trống lúc khởi tạo', Object.keys(card.layers), [...DNA_LAYER_KEYS]);
  card.layers.mauTyLe = { values: ['#000000'], trangThai: 'verified', nguon: ['manual'] };
  const roundTripped = JSON.parse(JSON.stringify(card));
  eq('round-trip JSON giữ nguyên nội dung', roundTripped, card);
  ok('round-trip vẫn hợp lệ theo isDesignDnaCard', isDesignDnaCard(roundTripped));
}

console.log('isDesignDnaCard() — từ chối dữ liệu hỏng (chống ghi rác từ client)');
{
  ok('null bị từ chối', !isDesignDnaCard(null));
  ok('thiếu layers bị từ chối', !isDesignDnaCard({ id: 'x', projectId: 'p', name: 'n', createdAt: '', updatedAt: '' }));
  const bad = newDnaCard('p', 'n');
  // @ts-expect-error — cố tình phá trangThai để kiểm guard
  bad.layers.yDo.trangThai = 'khong-hop-le';
  ok('trangThai lạ bị từ chối', !isDesignDnaCard(bad));
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
