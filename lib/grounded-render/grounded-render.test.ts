/**
 * Test GroundedRender phần THUẦN — chạy:
 *   node_modules/.bin/sucrase-node lib/grounded-render/grounded-render.test.ts
 * Import tương đối (khuôn lib/distill/engine.test.ts). Không gọi mạng.
 *
 * Khoá 3 luật của phiếu grounded-render-v0:
 *  · phiếu round-trip encode/decode, cờ chỉ inferred/verified;
 *  · sheetFromCaption đi qua DistillEngine — cấp ②④ TRỐNG không bịa, nguồn truy ngược;
 *  · composeRegionInpaint: guidance đúng hằng F2 (import, không chép số), THIẾU MASK = LỖI
 *    RÕ RÀNG không fallback trộn toàn cục, seed truyền qua nguyên vẹn.
 */
import { CONTROL_GUIDANCE_DEFAULT } from '../ai/models';
import {
  decodeReferenceSheet,
  emptyReferenceSheet,
  encodeReferenceSheet,
  regionLabelToId,
  sheetToText,
  sheetValues,
} from './types';
import { sheetFromCaption, draftReferenceSheetPrompt } from './reference-sheet';
import {
  composeRegionInpaint,
  fitMaskImageSize,
  keepLabelToId,
  REGION_INPAINT_GUIDANCE,
  REGION_INPAINT_TASK,
} from './region-inpaint';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) { pass++; console.log('  ok  -', name); }
  else { fail++; console.log('  FAIL-', name); }
}
function eq(name: string, a: unknown, b: unknown) {
  ok(`${name} (${JSON.stringify(a)} = ${JSON.stringify(b)})`, JSON.stringify(a) === JSON.stringify(b));
}
function throwsWith(name: string, fn: () => void, part: string) {
  try {
    fn();
    ok(`${name} — PHẢI throw`, false);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    ok(`${name} ("${msg.slice(0, 60)}…")`, msg.includes(part));
  }
}

console.log('phiếu — emptyReferenceSheet đủ 4 cấp, mọi dòng trống + inferred');
{
  const sheet = emptyReferenceSheet('img_b1');
  const mucs = new Set(sheet.lines.map((l) => l.muc));
  eq('đủ 4 cấp', [...mucs].sort(), ['chi-tiet', 'tong-the', 'tran-tuong-san', 'vat-lieu']);
  ok('mọi dòng value trống', sheet.lines.every((l) => l.value === ''));
  ok('mọi dòng flag inferred', sheet.lines.every((l) => l.flag === 'inferred'));
}

console.log('phiếu — round-trip encode → decode giữ nguyên');
{
  const sheet = emptyReferenceSheet('img_b1');
  sheet.lines[0].value = 'ấm, gỗ sáng';
  sheet.lines[0].flag = 'verified';
  sheet.lines[0].nguon = ['img_b1'];
  const back = decodeReferenceSheet(encodeReferenceSheet(sheet));
  ok('decode không lỗi', !!back.sheet && !back.error);
  eq('round-trip nguyên vẹn', back.sheet, sheet);
}

console.log('phiếu — decode chuỗi hỏng trả LỖI CHỮ RÕ, không phiếu rỗng lặng lẽ');
{
  const bad = decodeReferenceSheet('{không phải json');
  ok('có error', !!bad.error && !bad.sheet);
  const sai = decodeReferenceSheet('{"version":2,"lines":[]}');
  ok('version lạ bị chặn', !!sai.error);
  // flag lạ bị ép về inferred (không nhận nấc thứ ba tự chế)
  const laFlag = decodeReferenceSheet(
    JSON.stringify({ version: 1, imageBId: 'x', lines: [{ id: 'a', muc: 'tong-the', label: 'A', value: 'v', flag: 'measured', nguon: [] }] }),
  );
  eq('flag lạ → inferred', laFlag.sheet?.lines[0].flag, 'inferred');
}

console.log('sheetFromCaption — qua DistillEngine: cấp ①③ điền, cấp ②④ TRỐNG không bịa');
{
  const sheet = sheetFromCaption(
    { caption: 'Phòng khách tông ấm, gỗ sồi và vải linen', style: 'Japandi', materials: ['gỗ sồi', 'vải linen'], room: 'phòng khách' },
    'img_b9',
  );
  const by = (id: string) => sheet.lines.find((l) => l.id === id);
  eq('tone', by('tong-the.tone')?.value, 'Phòng khách tông ấm, gỗ sồi và vải linen');
  eq('phong cách', by('tong-the.phong-cach')?.value, 'Japandi');
  eq('loại phòng', by('tong-the.loai-phong')?.value, 'phòng khách');
  eq('vật liệu gộp', by('vat-lieu.chinh')?.value, 'gỗ sồi · vải linen');
  eq('nguồn truy ngược', by('tong-the.tone')?.nguon, ['img_b9']);
  eq('cấp ② trần TRỐNG', by('tran-tuong-san.tran')?.value, '');
  eq('cấp ④ chi tiết TRỐNG', by('chi-tiet.diem-nhan')?.value, '');
  ok('mọi dòng máy điền là inferred', sheet.lines.every((l) => l.flag === 'inferred'));
  ok('sheetToText có nhãn chờ duyệt', sheetToText(sheet).includes('chờ duyệt'));
  eq('sheetValues vat-lieu', sheetValues(sheet, 'vat-lieu'), ['gỗ sồi · vải linen']);
}

console.log('sheetFromCaption — caption rỗng thì dòng TRỐNG (không đoán bừa)');
{
  const sheet = sheetFromCaption({ caption: '', style: '', materials: [], room: '' }, 'img_x');
  ok('mọi dòng trống', sheet.lines.every((l) => l.value === ''));
  ok('mọi nguồn rỗng', sheet.lines.every((l) => l.nguon.length === 0));
}

console.log('composeRegionInpaint — guidance đúng hằng F2, tham số đủ');
{
  const job = composeRegionInpaint({
    imageA: 'data:image/png;base64,AAA',
    mask: 'data:image/png;base64,BBB',
    regionId: 'san',
    instruction: 'sàn gỗ sồi bản lớn phủ mờ',
    keep: 'vua',
    seed: 4213,
    imageSize: { width: 1024, height: 768 },
  });
  eq('task tái dùng materialSwap', job.task, REGION_INPAINT_TASK);
  ok('guidance = hằng F2 (import, không chép số)', job.input.guidance_scale === REGION_INPAINT_GUIDANCE
    && REGION_INPAINT_GUIDANCE === (CONTROL_GUIDANCE_DEFAULT.sketch2render ?? 4));
  eq('seed truyền nguyên', job.input.seed, 4213);
  eq('image_size truyền nguyên', job.input.image_size, { width: 1024, height: 768 });
  ok('prompt chứa chỉ dẫn', String(job.input.prompt).includes('sàn gỗ sồi bản lớn phủ mờ'));
  ok('mask_url có mặt', job.input.mask_url === 'data:image/png;base64,BBB');
}

console.log('composeRegionInpaint — LUẬT [T6]: thiếu mask/chỉ dẫn = lỗi rõ, không trộn toàn cục');
{
  throwsWith('thiếu mask', () => composeRegionInpaint({ imageA: 'x', mask: '', regionId: 'san', instruction: 'abc', keep: 'vua' }), 'mask');
  throwsWith('thiếu ảnh A', () => composeRegionInpaint({ imageA: ' ', mask: 'm', regionId: 'san', instruction: 'abc', keep: 'vua' }), 'ảnh trọng tâm');
  throwsWith('thiếu chỉ dẫn', () => composeRegionInpaint({ imageA: 'x', mask: 'm', regionId: 'san', instruction: '  ', keep: 'vua' }), 'chỉ dẫn');
}

console.log('composeRegionInpaint — không seed thì KHÔNG có field seed (không seed=NaN)');
{
  const job = composeRegionInpaint({ imageA: 'x', mask: 'm', regionId: 'tran', instruction: 'trần thạch cao phẳng', keep: 'chat' });
  ok('không field seed', !('seed' in job.input));
  ok('không field image_size', !('image_size' in job.input));
}

console.log('fitMaskImageSize — luật F2: ≤1024 cạnh dài, bội 8, giữ tỉ lệ, không phóng to');
{
  eq('2048×1536 → 1024×768', fitMaskImageSize(2048, 1536), { width: 1024, height: 768 });
  eq('800×600 giữ nguyên (bội 8)', fitMaskImageSize(800, 600), { width: 800, height: 600 });
  const odd = fitMaskImageSize(1023, 767);
  ok('bội 8', odd.width % 8 === 0 && odd.height % 8 === 0);
  ok('không phóng to', odd.width <= 1023 + 4 && odd.height <= 767 + 4);
}

console.log('map nhãn — regionLabelToId / keepLabelToId');
{
  eq('Tường trái → tuong-trai', regionLabelToId('Tường trái'), 'tuong-trai');
  eq('id giữ nguyên', regionLabelToId('san'), 'san');
  eq('nhãn lạ → slug', regionLabelToId('Vách CNC'), 'vách-cnc');
  eq('Chặt → chat', keepLabelToId('Chặt'), 'chat');
  eq('lạ → vua', keepLabelToId('???'), 'vua');
}

console.log('draftReferenceSheetPrompt — có đủ 4 khối JSON kỳ vọng (khung chờ nối, không giả)');
{
  const p = draftReferenceSheetPrompt();
  ok('4 khối', ['tongThe', 'tranTuongSan', 'vatLieu', 'chiTiet'].every((k) => p.includes(k)));
}

console.log(`\n${pass} pass · ${fail} fail`);
if (fail > 0) process.exit(1);
