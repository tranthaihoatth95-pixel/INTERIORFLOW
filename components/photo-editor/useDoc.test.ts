/**
 * components/photo-editor/useDoc.test.ts — G-M12-01 (07/08): `components/` che phủ test 0%.
 * Chọn `useDoc.ts` làm 1 trong 3 component rủi ro cao nhất trong vùng sở hữu vì đây là ĐÚNG
 * "đường mất dữ liệu" của trình chỉnh ảnh — lõi undo/redo (`reducer`). Bug ở đây không ném lỗi,
 * không đỏ console: nó chỉ ÂM THẦM làm người dùng bấm Undo mà mất thao tác, hoặc Redo ra sai
 * ảnh — phát hiện được là nhờ khách phàn nàn, không phải nhờ test suite. Test THUẦN qua
 * `sucrase-node` (không dựng React/DOM, đúng khuôn `checkpoint-core.test.ts`).
 *
 * Chạy: node_modules/.bin/sucrase-node components/photo-editor/useDoc.test.ts
 */

import { reducer } from './useDoc';
import { makeEmptyDoc, makeRasterLayer } from '../../lib/photo-editor/model';
import type { PhotoDoc } from '../../lib/photo-editor/model';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL - ${label}`);
  }
}

interface TestState {
  doc: PhotoDoc;
  selectedId: string | null;
  past: PhotoDoc[];
  future: PhotoDoc[];
}

function state(doc: PhotoDoc, past: PhotoDoc[] = [], future: PhotoDoc[] = []): TestState {
  return { doc, selectedId: null, past, future };
}

function withLayer(doc: PhotoDoc, name: string): PhotoDoc {
  return { ...doc, layers: [...doc.layers, makeRasterLayer('data:,x', { name })] };
}

console.log('commit — đẩy doc CŨ vào past, xoá future (nhánh mới ghi đè nhánh redo cũ)');
{
  const d0 = makeEmptyDoc();
  const d1 = withLayer(d0, 'a');
  const s0 = state(d0, [], [makeEmptyDoc()] /* future cũ, giả lập đã từng undo trước đó */);
  const s1 = reducer(s0, { type: 'commit', doc: d1 });
  ok('doc mới = d1', s1.doc === d1);
  ok('past có đúng 1 phần tử = d0 (bản TRƯỚC khi commit)', s1.past.length === 1 && s1.past[0] === d0);
  ok('commit MỚI xoá sạch future — nhánh redo cũ không còn ý nghĩa', s1.future.length === 0);
}

console.log('undo — lùi 1 bước, đẩy bản hiện tại sang future');
{
  const d0 = makeEmptyDoc();
  const d1 = withLayer(d0, 'a');
  const s0 = state(d1, [d0], []);
  const s1 = reducer(s0, { type: 'undo' });
  ok('doc quay lại d0', s1.doc === d0);
  ok('past rỗng sau khi lùi hết', s1.past.length === 0);
  ok('future nhận lại d1 (để redo)', s1.future.length === 1 && s1.future[0] === d1);
}

console.log('undo khi past rỗng — KHÔNG được đổi state (nút Undo phải tự khoá, đây là lưới an toàn)');
{
  const d0 = makeEmptyDoc();
  const s0 = state(d0, [], []);
  const s1 = reducer(s0, { type: 'undo' });
  ok('trả về NGUYÊN object state cũ (không tạo bản sao rỗng vô nghĩa)', s1 === s0);
}

console.log('redo — tiến 1 bước, đẩy bản hiện tại sang past');
{
  const d0 = makeEmptyDoc();
  const d1 = withLayer(d0, 'a');
  const s0 = state(d0, [], [d1]);
  const s1 = reducer(s0, { type: 'redo' });
  ok('doc tiến tới d1', s1.doc === d1);
  ok('future rỗng sau khi redo hết', s1.future.length === 0);
  ok('past nhận lại d0', s1.past.length === 1 && s1.past[0] === d0);
}

console.log('redo khi future rỗng — KHÔNG đổi state');
{
  const d0 = makeEmptyDoc();
  const s0 = state(d0, [], []);
  const s1 = reducer(s0, { type: 'redo' });
  ok('trả về NGUYÊN object state cũ', s1 === s0);
}

console.log('live — cập nhật doc để xem trước (kéo brush) nhưng KHÔNG tạo bước undo mới');
{
  const d0 = makeEmptyDoc();
  const d1 = withLayer(d0, 'a');
  const s0 = state(d0, ['PAST_MARKER' as unknown as PhotoDoc], []);
  const s1 = reducer(s0, { type: 'live', doc: d1 });
  ok('doc đổi sang d1 (xem trước sống)', s1.doc === d1);
  ok('past KHÔNG bị đụng — live không đẻ thêm bước lịch sử', s1.past === s0.past);
}

console.log('trần lịch sử MAX_HISTORY=40 — commit thứ 41 phải CẮT bớt bản CŨ NHẤT, không tràn bộ nhớ');
{
  let s = state(makeEmptyDoc(), [], []);
  const docs: PhotoDoc[] = [];
  for (let i = 0; i < 42; i += 1) {
    const next = withLayer(s.doc, `layer-${i}`);
    docs.push(s.doc);
    s = reducer(s, { type: 'commit', doc: next });
  }
  ok('past bị chặn ở đúng 40 phần tử, không phình vô hạn', s.past.length === 40);
  ok('bản CŨ NHẤT (docs[0]) đã bị đẩy ra khỏi past — cắt đúng đầu, không cắt nhầm đuôi', !s.past.includes(docs[0]));
  ok('bản GẦN NHẤT trước commit cuối vẫn còn trong past', s.past.includes(docs[41]));
}

/* ---- ĐỐI CHỨNG: chứng minh bộ test này CÓ RĂNG — một reducer SAI phải bị bắt ---- */
console.log('đối chứng — reducer cố tình sai (undo không cắt past) phải bị test bắt được');
{
  function brokenReducer(s: TestState, a: { type: string }): TestState {
    if (a.type === 'undo') {
      if (!s.past.length) return s;
      const prev = s.past[s.past.length - 1];
      // BUG cố ý: quên .slice(0, -1) — past không rút ngắn, undo lặp lại vô hạn cùng 1 bước.
      return { ...s, doc: prev, future: [s.doc, ...s.future] };
    }
    return s;
  }
  const d0 = makeEmptyDoc();
  const d1 = withLayer(d0, 'a');
  const broken = brokenReducer(state(d1, [d0], []), { type: 'undo' });
  const real = reducer(state(d1, [d0], []), { type: 'undo' });
  ok('reducer THẬT rút ngắn past (đúng)', real.past.length === 0);
  ok('reducer GIẢ (cố tình sai) KHÔNG rút ngắn past — test phân biệt được đúng/sai', broken.past.length === 1);
}

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
