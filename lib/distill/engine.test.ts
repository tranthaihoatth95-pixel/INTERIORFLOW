/** Test `engine.ts` — chạy: node_modules/.bin/sucrase-node lib/distill/engine.test.ts
 *  Import TƯƠNG ĐỐI (không `@/…`), khuôn copy từ `lib/library/idfc-store.test.ts`.
 *  Module này THUẦN (không window/fs) nên không cần dựng môi trường giả.
 */
import { distill, DistillEngine, type DistillFieldSpec } from './engine';
import type { ProvenanceInput } from './types';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) { pass++; console.log('  ok  -', name); }
  else { fail++; console.log('  FAIL-', name); }
}
function eq(name: string, a: unknown, b: unknown) {
  ok(`${name} (${JSON.stringify(a)} = ${JSON.stringify(b)})`, JSON.stringify(a) === JSON.stringify(b));
}

type F = 'style' | 'color' | 'intent';

const styleFromTag: DistillFieldSpec<F> = {
  field: 'style',
  extract: (s) => (s.kind === 'image' ? (s.tags ?? []).filter((t) => t.startsWith('style:')).map((t) => t.slice(6)) : []),
};
const colorFromPalette: DistillFieldSpec<F> = {
  field: 'color',
  extract: (s) => (s.kind === 'image' ? s.palette ?? [] : []),
};
// field không extractor nào trả gì — luôn trống, kiểm luật "không đoán bừa".
const intentNeverExtracted: DistillFieldSpec<F> = { field: 'intent', extract: () => [] };

console.log('distill() — CÓ NGUỒN, 1 ảnh, không mâu thuẫn');
{
  const sources: ProvenanceInput[] = [
    { kind: 'image', id: 'img_1', tags: ['style:toi-gian'], palette: ['#111111', '#eeeeee'] },
  ];
  const out = distill(sources, [styleFromTag, colorFromPalette, intentNeverExtracted]);
  eq('style.values', out.style.values, ['toi-gian']);
  eq('style.trangThai', out.style.trangThai, 'inferred');
  eq('style.nguon', out.style.nguon, ['img_1']);
  eq('color.values', out.color.values, ['#111111', '#eeeeee']);
}

console.log('distill() — THIẾU NGUỒN cho 1 trường thì trường đó TRỐNG, không bịa');
{
  const sources: ProvenanceInput[] = [{ kind: 'image', id: 'img_1', tags: [], palette: [] }];
  const out = distill(sources, [styleFromTag, colorFromPalette, intentNeverExtracted]);
  eq('style.values rỗng', out.style.values, []);
  eq('style.nguon rỗng', out.style.nguon, []);
  eq('intent.values rỗng (field không extractor nào trả)', out.intent.values, []);
  eq('intent.trangThai vẫn có giá trị hợp lệ dù trống', out.intent.trangThai, 'inferred');
}

console.log('distill() — NHIỀU NGUỒN MÂU THUẪN → GIỮ CẢ HAI + inferred');
{
  const sources: ProvenanceInput[] = [
    { kind: 'image', id: 'img_a', tags: ['style:toi-gian'] },
    { kind: 'image', id: 'img_b', tags: ['style:co-dien'] },
  ];
  const out = distill(sources, [styleFromTag, colorFromPalette, intentNeverExtracted]);
  eq('giữ cả 2 giá trị mâu thuẫn', out.style.values, ['toi-gian', 'co-dien']);
  eq('nguồn ghi đủ cả 2 ảnh', out.style.nguon, ['img_a', 'img_b']);
  eq('mâu thuẫn vẫn chỉ là inferred, không tự xử', out.style.trangThai, 'inferred');
}

console.log('distill() — khử trùng lặp giá trị GIỐNG HỆT từ nhiều nguồn');
{
  const sources: ProvenanceInput[] = [
    { kind: 'image', id: 'img_a', tags: ['style:toi-gian'] },
    { kind: 'image', id: 'img_b', tags: ['style:toi-gian'] },
  ];
  const out = distill(sources, [styleFromTag, colorFromPalette, intentNeverExtracted]);
  eq('không nhân đôi giá trị trùng', out.style.values, ['toi-gian']);
  eq('nguồn vẫn ghi đủ 2 ảnh đóng góp', out.style.nguon, ['img_a', 'img_b']);
}

console.log('distill() — 0 nguồn truyền vào → mọi trường trống, không throw');
{
  const out = distill([], [styleFromTag, colorFromPalette, intentNeverExtracted]);
  eq('style trống', out.style.values, []);
  eq('color trống', out.color.values, []);
  eq('intent trống', out.intent.values, []);
}

console.log('DistillEngine namespace export — cùng cài đặt với distill() rời');
{
  const sources: ProvenanceInput[] = [{ kind: 'image', id: 'img_1', tags: ['style:toi-gian'] }];
  const a = distill(sources, [styleFromTag]);
  const b = DistillEngine.distill(sources, [styleFromTag]);
  eq('DistillEngine.distill == distill', a, b);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
