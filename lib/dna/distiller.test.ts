/** Test `distiller.ts` + `types.ts` — chạy: node_modules/.bin/sucrase-node lib/dna/distiller.test.ts
 *  Import TƯƠNG ĐỐI, thuần (không window/fs) — không cần dựng môi trường giả.
 */
import { distillDnaFromAssets, distillDnaFromSources, mergeDistilledIntoCard, type DnaSourceAsset } from './distiller';
import type { ProvenanceInput } from '../distill/types';
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

console.log('distillDnaFromSources() — STICKY: text chảy vào yDo (ĐỦ dữ liệu)');
{
  const sources: ProvenanceInput[] = [
    { kind: 'sticky', id: 'note_1', text: 'Không gian ấm áp cho cuối tuần', author: 'Hoà' },
    { kind: 'sticky', id: 'note_2', text: 'Tránh chi tiết Bắc Âu quá thô', x: 120, y: 40 },
  ];
  const layers = distillDnaFromSources(sources);
  eq('yDo gộp text từ 2 sticky', layers.yDo.values, ['Không gian ấm áp cho cuối tuần', 'Tránh chi tiết Bắc Âu quá thô']);
  eq('yDo.nguon đủ 2 sticky id', layers.yDo.nguon, ['note_1', 'note_2']);
  eq('yDo.trangThai vẫn inferred (chưa ai duyệt)', layers.yDo.trangThai, 'inferred');
  ok('mauTyLe trống vì không có ảnh', layers.mauTyLe.values.length === 0);
  ok('ngonNguKhongGian trống vì không có form poles', layers.ngonNguKhongGian.values.length === 0);
}

console.log('distillDnaFromSources() — STICKY: text rỗng/whitespace BỊ BỎ QUA, không throw');
{
  const sources: ProvenanceInput[] = [
    { kind: 'sticky', id: 'note_empty', text: '   ' },
    { kind: 'sticky', id: 'note_ok', text: 'Ý tưởng thật' },
  ];
  const layers = distillDnaFromSources(sources);
  eq('yDo chỉ giữ text không-trắng', layers.yDo.values, ['Ý tưởng thật']);
  eq('yDo.nguon chỉ ghi sticky đóng góp thật (không tính note_empty)', layers.yDo.nguon, ['note_ok']);
}

console.log('distillDnaFromSources() — FORM ba-hoi: 3 hồi chảy vào yDo');
{
  const sources: ProvenanceInput[] = [
    {
      kind: 'form',
      id: 'form_bahoi_1',
      formKind: 'ba-hoi',
      fields: {
        act1: 'Mở: căn nhà cũ ẩm mốc',
        act2: 'Xung đột: khách muốn giữ tường gạch',
        act3: 'Giải quyết: dùng gỗ ấm phá đối lập',
      },
    },
  ];
  const layers = distillDnaFromSources(sources);
  eq('yDo gộp cả 3 hồi', layers.yDo.values, [
    'Mở: căn nhà cũ ẩm mốc',
    'Xung đột: khách muốn giữ tường gạch',
    'Giải quyết: dùng gỗ ấm phá đối lập',
  ]);
  eq('yDo.nguon = form id', layers.yDo.nguon, ['form_bahoi_1']);
}

console.log('distillDnaFromSources() — FORM poles: mỗi cực thành 1 giá trị trong ngonNguKhongGian');
{
  const sources: ProvenanceInput[] = [
    {
      kind: 'form',
      id: 'form_poles_1',
      formKind: 'poles',
      fields: {
        'toi-gian_am-ap': '2',
        'kin_mo': '-1',
        'don-sac_phong-phu': '0',
      },
    },
  ];
  const layers = distillDnaFromSources(sources);
  eq('ngonNguKhongGian giữ cả 3 cực với giá trị', layers.ngonNguKhongGian.values, [
    'toi-gian_am-ap: 2', 'kin_mo: -1', 'don-sac_phong-phu: 0',
  ]);
  eq('ngonNguKhongGian.nguon = form id', layers.ngonNguKhongGian.nguon, ['form_poles_1']);
  ok('yDo trống — poles không nuôi yDo', layers.yDo.values.length === 0);
}

console.log('distillDnaFromSources() — FORM moodboard: không chảy vào lớp text (ảnh đi kênh image)');
{
  const sources: ProvenanceInput[] = [
    { kind: 'form', id: 'form_mood', formKind: 'moodboard', fields: { note: 'Xem thêm ảnh bên cạnh' } },
  ];
  const layers = distillDnaFromSources(sources);
  ok('yDo trống — moodboard không nuôi yDo', layers.yDo.values.length === 0);
  ok('ngonNguKhongGian trống — moodboard không nuôi styles', layers.ngonNguKhongGian.values.length === 0);
}

console.log('distillDnaFromSources() — ASSET image: label ưu tiên hơn id trong anhNguon');
{
  const sources: ProvenanceInput[] = [
    { kind: 'asset', id: 'asset_ghe_01', assetKind: 'image', label: 'Ghế Wegner CH24', source: 'gallery' },
    { kind: 'asset', id: 'asset_ban_02', assetKind: 'image', source: 'master-library' }, // không label → dùng id
  ];
  const layers = distillDnaFromSources(sources);
  eq('anhNguon: label khi có, id khi không', layers.anhNguon.values, ['Ghế Wegner CH24', 'asset_ban_02']);
  eq('anhNguon.nguon = 2 asset id', layers.anhNguon.nguon, ['asset_ghe_01', 'asset_ban_02']);
}

console.log('distillDnaFromSources() — ASSET material: id chảy vào vatLieuMatId; ASSET other bị bỏ qua');
{
  const sources: ProvenanceInput[] = [
    { kind: 'asset', id: 'mat_go_soi_ep_02', assetKind: 'material' },
    { kind: 'asset', id: 'mat_da_marble_04', assetKind: 'material', label: 'Đá marble Ý' },
    { kind: 'asset', id: 'other_thing', assetKind: 'other' }, // không extractor nào nhận
  ];
  const layers = distillDnaFromSources(sources);
  eq('vatLieuMatId: dùng id không dùng label (đây là mã matId)', layers.vatLieuMatId.values, [
    'mat_go_soi_ep_02', 'mat_da_marble_04',
  ]);
  eq('vatLieuMatId.nguon: chỉ 2 asset material đóng góp (bỏ other)', layers.vatLieuMatId.nguon, [
    'mat_go_soi_ep_02', 'mat_da_marble_04',
  ]);
  ok('anhNguon trống — asset material không nuôi anhNguon', layers.anhNguon.values.length === 0);
}

console.log('distillDnaFromSources() — HỖN HỢP 3 kind mới + 1 ảnh cũ: mỗi nguồn nuôi đúng lớp mình');
{
  const sources: ProvenanceInput[] = [
    { kind: 'image', id: 'img_1', tags: ['style:toi-gian', 'material:go-soi'], palette: ['#111', '#eee'] },
    { kind: 'sticky', id: 'note_1', text: 'Ưu tiên ánh sáng ấm cuối chiều' },
    { kind: 'form', id: 'form_poles', formKind: 'poles', fields: { 'kin_mo': '2' } },
    { kind: 'asset', id: 'mat_da_travertine', assetKind: 'material' },
  ];
  const layers = distillDnaFromSources(sources);
  eq('ngonNguKhongGian: image style + form poles gộp', layers.ngonNguKhongGian.values, ['toi-gian', 'kin_mo: 2']);
  eq('vatLieuMatId: image tag + asset material gộp', layers.vatLieuMatId.values, ['go-soi', 'mat_da_travertine']);
  eq('mauTyLe: chỉ từ image.palette', layers.mauTyLe.values, ['#111', '#eee']);
  eq('yDo: chỉ từ sticky', layers.yDo.values, ['Ưu tiên ánh sáng ấm cuối chiều']);
  ok('rangBuocDoTin trống — rule-based không chạm', layers.rangBuocDoTin.values.length === 0);
}

console.log('distillDnaFromSources() — merge sau distill KHÔNG XOÁ verified từ người');
{
  const current = emptyDnaLayers();
  current.yDo = { values: ['Ý đồ đã chốt với sếp'], trangThai: 'verified', nguon: ['manual'] };
  const distilled = distillDnaFromSources([{ kind: 'sticky', id: 'note_new', text: 'Ý mới sau họp' }]);
  const merged = mergeDistilledIntoCard(current, distilled);
  eq('yDo verified KHÔNG bị đè bởi sticky mới', merged.yDo.values, ['Ý đồ đã chốt với sếp']);
  eq('yDo.trangThai giữ verified', merged.yDo.trangThai, 'verified');
}

console.log('distillDnaFromSources() — input rỗng: đủ 8 lớp trống, không throw');
{
  const layers = distillDnaFromSources([]);
  eq('đủ 8 khoá', Object.keys(layers), [...DNA_LAYER_KEYS]);
  for (const k of DNA_LAYER_KEYS) ok(`${k} trống`, layers[k].values.length === 0);
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
