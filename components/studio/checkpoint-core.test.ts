/**
 * components/studio/checkpoint-core.test.ts — phần THUẦN của Checkpoint duyệt (S5, 05/08).
 * Chạy: node_modules/.bin/sucrase-node components/studio/checkpoint-core.test.ts
 *
 * Import TƯƠNG ĐỐI (không dùng alias `@/`) — sucrase-node không giải được alias; bài học
 * `lib/present-editor/boq-group.ts` (test tưởng pass nhưng chưa từng chạy được).
 */
import {
  toggleItem,
  setAllSelected,
  selectedIds,
  selectionState,
  acceptGate,
  formatProgress,
  formatSeed,
  mergeParamsForRetry,
  type CheckpointItem,
} from './checkpoint-core';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

function items(): CheckpointItem[] {
  return [
    { id: 'a', label: 'Tường trục A', detail: '4200mm', selected: true },
    { id: 'b', label: 'Tường trục B', detail: '3600mm', selected: true },
    { id: 'c', label: 'Cửa P1', detail: '900mm', selected: false },
  ];
}

console.log('toggleItem — bật/tắt đúng 1 phần, không đụng phần khác');
{
  const out = toggleItem(items(), 'a');
  ok('a bị đảo về false', out[0].selected === false);
  ok('b giữ nguyên true', out[1].selected === true);
  ok('c giữ nguyên false', out[2].selected === false);
  ok('trả mảng MỚI (React so tham chiếu)', out !== items());
  const src = items();
  toggleItem(src, 'a');
  ok('KHÔNG sửa mảng gốc tại chỗ', src[0].selected === true);
  ok('id lạ → không đổi gì', selectedIds(toggleItem(items(), 'zzz')).length === 2);
}

console.log('setAllSelected / selectionState — ô "Chọn tất cả" 3 dạng');
{
  ok('all → mọi phần selected', selectedIds(setAllSelected(items(), true)).length === 3);
  ok('none → rỗng', selectedIds(setAllSelected(items(), false)).length === 0);
  ok('trạng thái some', selectionState(items()) === 'some');
  ok('trạng thái all', selectionState(setAllSelected(items(), true)) === 'all');
  ok('trạng thái none', selectionState(setAllSelected(items(), false)) === 'none');
  ok('danh sách rỗng = none', selectionState([]) === 'none');
}

console.log('acceptGate — KS3 + luật §9 (disabled phải kèm lý do)');
{
  const empty = acceptGate([]);
  ok('rỗng → chặn', empty.enabled === false);
  ok('rỗng → CÓ lý do, không im lặng', typeof empty.reason === 'string' && empty.reason.length > 0);

  const noneTicked = acceptGate(setAllSelected(items(), false));
  ok('bỏ tick hết → chặn', noneTicked.enabled === false);
  ok('bỏ tick hết → lý do nói rõ phải tick', (noneTicked.reason || '').includes('tick'));

  const good = acceptGate(items());
  ok('có tick → cho nhận', good.enabled === true);
  ok('cho nhận thì KHÔNG kèm lý do thừa', good.reason === null);
}

console.log('formatProgress — KHÔNG bịa % giả (bài học nhập DWG)');
{
  ok('0.62 → 62%', formatProgress(0.62, 5000) === '62%');
  ok('0 → 0%', formatProgress(0, 0) === '0%');
  ok('1 → 100%', formatProgress(1, 0) === '100%');
  ok('kẹp trên: 5 → 100%', formatProgress(5, 0) === '100%');
  ok('kẹp dưới: -3 → 0%', formatProgress(-3, 0) === '0%');
  ok('null → hiện GIÂY, không hiện %', formatProgress(null, 7400) === 'Đang chạy… 7s');
  ok('NaN → cũng rơi về giây', formatProgress(NaN, 3000).includes('3s'));
}

console.log('formatSeed — KS2 seed null phải NÓI THẲNG, không im lặng');
{
  ok('số → chuỗi số', formatSeed(12345) === '12345');
  ok('chuỗi giữ nguyên', formatSeed('abc-1') === 'abc-1');
  ok('null → cảnh báo chạy lại có thể khác', formatSeed(null).includes('có thể ra khác'));
  ok('rỗng → cũng cảnh báo', formatSeed('').includes('có thể ra khác'));
}

console.log('mergeParamsForRetry — [Làm lại] GIỮ NGUYÊN tham số cũ');
{
  const prev = { seed: 7, scale: 50, note: 'giữ' };
  const out = mergeParamsForRetry(prev, { scale: 100 });
  ok('trường sửa được cập nhật', out.scale === 100);
  ok('trường KHÔNG sửa giữ nguyên', out.seed === 7 && out.note === 'giữ');
  ok('không sửa object gốc', prev.scale === 50);
  const out2 = mergeParamsForRetry(prev, { scale: undefined });
  ok('undefined KHÔNG xoá tham số cũ', out2.scale === 50);
  ok('patch rỗng → y hệt cũ', JSON.stringify(mergeParamsForRetry(prev, {})) === JSON.stringify(prev));
}

console.log(`\n${pass} pass · ${fail} fail`);
if (fail > 0) process.exit(1);
