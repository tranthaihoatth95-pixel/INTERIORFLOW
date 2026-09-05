/**
 * Test Image→Spec phần THUẦN — chạy: node_modules/.bin/sucrase-node lib/vision/image-spec.test.ts
 * Không gọi mạng. Khoá 5 luật:
 *  · pixelEvidence TẤT ĐỊNH (cùng ảnh = cùng kết quả), đúng số đo trên ảnh tự dựng;
 *  · không dò được điểm tụ → dòng TRỐNG kèm lý do, KHÔNG bịa đường/số;
 *  · VLM: giá trị rỗng KHÔNG sinh dòng; mọi dòng VLM inferred + confidence null (không bịa %);
 *  · người sửa → verified/manual, thắng máy; round-trip encode/decode giữ nguyên;
 *  · chiếu ra phiếu 4 cấp điền ĐỦ cấp ②④ · vật liệu → PBR nháp suyDoan · chỉ dẫn mảng đúng RegionId.
 */
import type { RgbaImage } from './single-view-metrology';
import {
  buildImageSpec,
  decodeImageSpec,
  encodeImageSpec,
  imageSpecPrompt,
  materialDrafts,
  mergeVlmReading,
  parseVlmReading,
  pixelEvidence,
  regionInstructions,
  rgbToHex,
  setFieldByUser,
  specToReferenceSheet,
  specToText,
} from './image-spec';
import { decodeReferenceSheet, encodeReferenceSheet } from '../grounded-render/types';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) { pass++; console.log('  ok  -', name); }
  else { fail++; console.log('  FAIL-', name); }
}
function eq(name: string, a: unknown, b: unknown) {
  ok(`${name} (${JSON.stringify(a)} = ${JSON.stringify(b)})`, JSON.stringify(a) === JSON.stringify(b));
}

/** Ảnh tự dựng: trên xám sáng, dưới nâu ấm tối; trái sáng hơn phải. */
function makeImage(w = 64, h = 48): RgbaImage {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4;
      const upper = y < h / 2;
      const boost = x < w / 3 ? 40 : 0;
      if (upper) { data[o] = 200 + boost * 0.5; data[o + 1] = 200 + boost * 0.5; data[o + 2] = 205 + boost * 0.5; }
      else { data[o] = 120 + boost; data[o + 1] = 80 + boost * 0.6; data[o + 2] = 40 + boost * 0.3; }
      data[o + 3] = 255;
    }
  }
  return { width: w, height: h, data };
}

console.log('rgbToHex');
{
  eq('trắng', rgbToHex(255, 255, 255), '#ffffff');
  eq('kẹp', rgbToHex(-5, 300, 7.6), '#00ff08');
}

console.log('pixelEvidence — tất định + đúng số đo trên ảnh tự dựng');
{
  const img = makeImage();
  const a = pixelEvidence(img, 'img-1');
  const b = pixelEvidence(img, 'img-1');
  eq('tất định: 2 lần giống hệt', a, b);
  const by = new Map(a.map((f) => [f.id, f]));
  ok('mọi dòng pixel là measured', a.every((f) => f.origin === 'pixel' && f.trangThai === 'measured'));
  ok('nguồn truy ngược [imageId, pixel]', a.every((f) => f.nguon[0] === 'img-1' && f.nguon[1] === 'pixel'));
  const pal = by.get('bang-mau.chu-dao')!;
  const sw = pal.data!.swatches as Array<{ hex: string; share: number }>;
  ok('bảng màu có swatch + tổng share ≈ 1', sw.length >= 2 && Math.abs(sw.reduce((s, x) => s + x.share, 0) - 1) < 0.02);
  ok('swatch sắp giảm dần theo share', sw.every((s, i) => i === 0 || sw[i - 1].share >= s.share));
  ok('nhiệt màu: ảnh có nửa nâu ấm → không "lạnh"', !by.get('anh-sang.nhiet-mau')!.value.startsWith('lạnh'));
  ok('hướng sáng: trái sáng hơn + trên sáng hơn', by.get('anh-sang.huong-sang')!.value.includes('trái') && by.get('anh-sang.huong-sang')!.value.includes('trên'));
  ok('hướng sáng có độ tin cậy 0..1', typeof by.get('anh-sang.huong-sang')!.confidence === 'number');
  ok('khung ngang', by.get('bo-cuc.khung')!.value.startsWith('ngang'));
  const pc = by.get('bo-cuc.phoi-canh')!;
  ok('không dò được điểm tụ → dòng TRỐNG + lý do, không bịa', pc.value === '' && pc.confidence === null && typeof pc.data!.reason === 'string');
  ok('không có dòng chân trời bịa', !by.has('bo-cuc.chan-troi'));
  const band = by.get('tran-tuong-san.dai-anh')!;
  ok('dải trên sáng hơn dải dưới (hex)', String(band.data!.top) > String(band.data!.bottom));
  ok('nhãn dải ảnh nói rõ chưa nhận dạng mặt', band.label.includes('chưa nhận dạng'));
}

console.log('pixelEvidence — ảnh hỏng ném lỗi chữ rõ');
{
  let threw = '';
  try { pixelEvidence({ width: 4, height: 4, data: new Uint8ClampedArray(8) }, 'x'); } catch (e) { threw = (e as Error).message; }
  ok('ném lỗi', threw.includes('không hợp lệ'));
}

console.log('parseVlmReading — chịu chữ thừa, rỗng không bịa, lỗi rõ');
{
  const raw = '```json\n{"loaiPhong":"phòng khách","phongCach":"Japandi","tongThe":{"tone":"ấm","anhSang":"","nuocHinh":"mờ"},"tranTuongSan":{"tran":"thạch cao trắng","tuong":"sơn be","san":"gỗ sồi"},"vatLieu":["gỗ sồi","vải lanh",""],"doNoiThat":["sofa"],"chiTiet":[]}\n```';
  const p = parseVlmReading(raw);
  ok('đọc được', !!p.reading && !p.error);
  eq('loại phòng', p.reading!.loaiPhong, 'phòng khách');
  eq('vật liệu bỏ chuỗi rỗng', p.reading!.vatLieu, ['gỗ sồi', 'vải lanh']);
  eq('anhSang rỗng giữ rỗng', p.reading!.tongThe.anhSang, '');
  ok('không JSON → error', !!parseVlmReading('không có gì').error);
  ok('JSON hỏng → error', !!parseVlmReading('{"a":').error);
  ok('shape cũ room/style vẫn đọc', parseVlmReading('{"room":"bedroom","style":"Wabi"}').reading!.loaiPhong === 'bedroom');
}

console.log('mergeVlmReading — inferred · confidence null · rỗng không sinh dòng · nguồn có tầng/model');
{
  const img = makeImage();
  const base = pixelEvidence(img, 'img-1');
  const r = parseVlmReading('{"loaiPhong":"phòng khách","phongCach":"Japandi","tongThe":{"tone":"ấm","anhSang":"","nuocHinh":""},"tranTuongSan":{"tran":"","tuong":"sơn be","san":"gỗ sồi"},"vatLieu":["gỗ sồi","đá mài bóng"],"doNoiThat":[],"chiTiet":["phào chỉ"]}').reading!;
  const merged = mergeVlmReading(base, r, { imageId: 'img-1', tier: 'local', model: 'llava:13b' });
  const vlm = merged.filter((f) => f.origin === 'vlm');
  ok('giữ nguyên dòng pixel', merged.filter((f) => f.origin === 'pixel').length === base.length);
  ok('mọi dòng VLM inferred + confidence null', vlm.every((f) => f.trangThai === 'inferred' && f.confidence === null));
  ok('nguồn ghi tầng+model', vlm.every((f) => f.nguon.includes('vlm:local:llava:13b')));
  const ids = new Set(vlm.map((f) => f.id));
  ok('rỗng KHÔNG sinh dòng (trần, ánh sáng, nước hình, đồ)', !ids.has('tran-tuong-san.tran') && !ids.has('anh-sang.mo-ta') && !ids.has('khong-gian.nuoc-hinh') && !ids.has('do-noi-that.danh-sach'));
  ok('có dòng tường/sàn/vật liệu/chi tiết', ids.has('tran-tuong-san.tuong') && ids.has('tran-tuong-san.san') && ids.has('do-noi-that.vat-lieu') && ids.has('do-noi-that.chi-tiet'));
  // gộp lại lần 2 KHÔNG nhân đôi dòng VLM
  const again = mergeVlmReading(merged, r, { imageId: 'img-1', tier: 'local', model: 'llava:13b' });
  eq('merge lần 2 không nhân đôi', again.length, merged.length);

  const spec = buildImageSpec({ imageId: 'img-1', width: 64, height: 48, fields: merged, ai: { tier: 'local', model: 'llava:13b' } });

  console.log('setFieldByUser — người sửa thắng máy, round-trip giữ nguyên');
  const edited = setFieldByUser(spec, 'tran-tuong-san.san', 'sàn gỗ óc chó bản lớn');
  const f = edited.fields.find((x) => x.id === 'tran-tuong-san.san')!;
  ok('verified/user/manual', f.origin === 'user' && f.trangThai === 'verified' && f.nguon[0] === 'manual' && f.confidence === null);
  ok('spec gốc không bị mutate', spec.fields.find((x) => x.id === 'tran-tuong-san.san')!.origin === 'vlm');
  const added = setFieldByUser(spec, 'tran-tuong-san.tran', 'trần thạch cao phẳng', 'Trần');
  ok('dòng mới thêm đúng section', added.fields.find((x) => x.id === 'tran-tuong-san.tran')!.section === 'tran-tuong-san');
  const back = decodeImageSpec(encodeImageSpec(edited));
  ok('decode không lỗi', !!back.spec && !back.error);
  eq('round-trip nguyên vẹn', back.spec, edited);
  ok('decode chuỗi hỏng → error', !!decodeImageSpec('{x').error);
  ok('version lạ bị chặn', !!decodeImageSpec('{"version":2,"fields":[]}').error);
  // confidence tự chế cho dòng VLM bị gạt về null; ai thiếu → none có lý do
  const tamper = decodeImageSpec(JSON.stringify({ version: 1, imageId: 'x', width: 1, height: 1, fields: [{ id: 'khong-gian.tone', section: 'khong-gian', label: 'T', value: 'v', origin: 'vlm', confidence: 0.9 }] }));
  ok('VLM confidence bịa → null', tamper.spec!.fields[0].confidence === null);
  ok('ai thiếu → none + lý do', tamper.spec!.ai.tier === 'none' && 'reason' in tamper.spec!.ai);

  console.log('specToReferenceSheet — điền đủ 4 cấp, cờ chỉ inferred/verified, người sửa → verified');
  const sheet = specToReferenceSheet(edited);
  const line = (id: string) => sheet.lines.find((l) => l.id === id);
  eq('cấp ① loại phòng', line('tong-the.loai-phong')!.value, 'phòng khách');
  eq('cấp ② tường', line('tran-tuong-san.tuong')!.value, 'sơn be');
  eq('cấp ② sàn = bản người sửa, verified', [line('tran-tuong-san.san')!.value, line('tran-tuong-san.san')!.flag], ['sàn gỗ óc chó bản lớn', 'verified']);
  eq('cấp ② trần trống (VLM rỗng) giữ trống', line('tran-tuong-san.tran')!.value, '');
  eq('cấp ③ vật liệu', line('vat-lieu.chinh')!.value, 'gỗ sồi · đá mài bóng');
  eq('cấp ④ chi tiết', line('chi-tiet.diem-nhan')!.value, 'phào chỉ');
  ok('dòng đo pixel vào phiếu dưới cờ inferred (hợp đồng phiếu)', line('tong-the.bang-mau')!.flag === 'inferred' && line('tong-the.bang-mau')!.value.includes('#'));
  ok('không có cờ measured trong phiếu', sheet.lines.every((l) => l.flag === 'inferred' || l.flag === 'verified'));
  const rt = decodeReferenceSheet(encodeReferenceSheet(sheet));
  ok('phiếu round-trip qua decode của grounded-render', !!rt.sheet && rt.sheet.lines.length === sheet.lines.length);

  console.log('materialDrafts / regionInstructions — chiếu ra chặng 3D + Render bám ý');
  const drafts = materialDrafts(edited);
  eq('2 vật liệu → 2 PBR nháp', drafts.map((d) => d.ten), ['gỗ sồi', 'đá mài bóng']);
  ok('gỗ → roughness 0.6 · đá bóng → 0.15 (rule sẵn có), luôn suyDoan', drafts[0].pbr.roughness === 0.6 && drafts[1].pbr.roughness === 0.15 && drafts.every((d) => d.pbr.suyDoan));
  const regs = regionInstructions(edited);
  eq('sàn 1 mảng + tường 3 mảng, trần trống bỏ', regs.map((r) => r.regionId), ['san', 'tuong-trai', 'tuong-phai', 'tuong-cuoi']);
  ok('chỉ dẫn sàn = bản người sửa', regs[0].instruction === 'sàn gỗ óc chó bản lớn' && regs[0].nguon[0] === 'manual');
  ok('spec rỗng → không nháp, không chỉ dẫn', materialDrafts(buildImageSpec({ imageId: 'e', width: 1, height: 1, fields: [], ai: { tier: 'none', reason: 'x' } })).length === 0);

  console.log('specToText — nói rõ tầng AI + dòng trống có lý do');
  const t = specToText(edited);
  ok('có tầng AI', t.includes('Tầng AI: local · llava:13b'));
  ok('dòng trống ghi lý do', t.includes('(trống — Không dò được'));
  const t2 = specToText({ ...edited, ai: { tier: 'none', reason: 'chưa có key' } });
  ok('none ghi lý do', t2.includes('không chạy — chưa có key'));
}

console.log('imageSpecPrompt — đủ 7 khối, cấm đoán bừa');
{
  const p = imageSpecPrompt();
  ok('7 khối', ['loaiPhong', 'phongCach', 'tongThe', 'tranTuongSan', 'vatLieu', 'doNoiThat', 'chiTiet'].every((k) => p.includes(k)));
  ok('có luật không đoán', p.includes('KHÔNG đoán'));
}

console.log(`\n${pass} pass · ${fail} fail`);
if (fail > 0) process.exit(1);
