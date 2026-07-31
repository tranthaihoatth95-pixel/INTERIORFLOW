/**
 * lib/disk-sync.test.ts — B4 (mã `4.1.d`). Chạy: node_modules/.bin/sucrase-node lib/disk-sync.test.ts
 */
import { resolveSourceOfTruth, createDiskWriter, TIE_TOLERANCE_MS, type DiskWriteResult } from './disk-sync';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

function testResolveSourceOfTruth() {
  const base = { cacheTs: 1_000_000, diskSheetCount: 3, cacheSheetCount: 3 };

  ok(
    '① lệch < ngưỡng → tie → cache',
    resolveSourceOfTruth({ ...base, diskModifiedAtMs: base.cacheTs + TIE_TOLERANCE_MS - 1 }).kind === 'cache' &&
      (resolveSourceOfTruth({ ...base, diskModifiedAtMs: base.cacheTs + TIE_TOLERANCE_MS - 1 }) as { reason: string }).reason === 'tie',
  );
  ok(
    '① lệch ĐÚNG bằng ngưỡng → vẫn tie (biên đóng)',
    (resolveSourceOfTruth({ ...base, diskModifiedAtMs: base.cacheTs + TIE_TOLERANCE_MS }) as { reason: string }).reason === 'tie',
  );
  ok(
    '① lệch > ngưỡng, đĩa mới hơn → disk thắng',
    resolveSourceOfTruth({ ...base, diskModifiedAtMs: base.cacheTs + TIE_TOLERANCE_MS + 1 }).kind === 'disk',
  );
  ok(
    '① lệch > ngưỡng, cache mới hơn → cache-newer',
    (resolveSourceOfTruth({ ...base, diskModifiedAtMs: base.cacheTs - TIE_TOLERANCE_MS - 1 }) as { reason: string }).reason === 'cache-newer',
  );
  ok(
    'đĩa không đọc được (null) → disk-unreadable, DÙ mốc gì cũng vậy',
    (resolveSourceOfTruth({ diskModifiedAtMs: null, cacheTs: 999, diskSheetCount: null, cacheSheetCount: 5 }) as { reason: string })
      .reason === 'disk-unreadable',
  );
  ok(
    '② đĩa mới hơn NHIỀU nhưng ÍT sheet hơn cache → disk-incomplete, KHÔNG thay im lặng',
    (resolveSourceOfTruth({
      diskModifiedAtMs: base.cacheTs + 999_999,
      cacheTs: base.cacheTs,
      diskSheetCount: 2,
      cacheSheetCount: 5,
    }) as { reason: string }).reason === 'disk-incomplete',
  );
  ok(
    '② đĩa CÙNG số sheet (không phải ít hơn) → không bị chặn bởi guard ②, xét tiếp theo mốc thời gian',
    resolveSourceOfTruth({
      diskModifiedAtMs: base.cacheTs + TIE_TOLERANCE_MS + 1,
      cacheTs: base.cacheTs,
      diskSheetCount: 3,
      cacheSheetCount: 3,
    }).kind === 'disk',
  );
  ok(
    '② đĩa NHIỀU sheet hơn cache (thêm trang) → không bị chặn, đĩa vẫn có thể thắng',
    resolveSourceOfTruth({
      diskModifiedAtMs: base.cacheTs + TIE_TOLERANCE_MS + 1,
      cacheTs: base.cacheTs,
      diskSheetCount: 10,
      cacheSheetCount: 3,
    }).kind === 'disk',
  );
}

async function testDiskWriterThrottle() {
  // ③ touch() nhiều lần liên tiếp trong 1 đợt dồn dập → CHỈ 1 lượt ghi trong vòng intervalMs,
  // KHÔNG phải debounce (không được dời vô hạn theo mỗi touch()).
  let writeCount = 0;
  const results: DiskWriteResult[] = [];
  const writer = createDiskWriter(
    async () => {
      writeCount += 1;
      return { ok: true };
    },
    { intervalMs: 3000, onStatus: (r) => results.push(r) },
  );
  writer.touch();
  writer.touch();
  writer.touch();
  ok('touch() dồn dập chưa ghi ngay (đang chờ nhịp throttle)', writeCount === 0);
  await new Promise((r) => setTimeout(r, 60));
  writer.touch(); // vẫn trong cửa sổ đầu — không được reset timer kiểu debounce
  await new Promise((r) => setTimeout(r, 3100));
  ok('sau intervalMs → ghi ĐÚNG 1 lần dù touch() gọi nhiều lần', writeCount === 1);
  ok('onStatus nhận đúng kết quả ok:true', results.length === 1 && results[0].ok === true);
  writer.dispose();
}

async function testDiskWriterFlushNow() {
  let writeCount = 0;
  const writer = createDiskWriter(async () => { writeCount += 1; return { ok: true }; }, { intervalMs: 3000 });
  writer.touch();
  writer.flushNow();
  await new Promise((r) => setTimeout(r, 20));
  ok('flushNow() ghi NGAY, không đợi intervalMs', writeCount === 1);
  writer.dispose();
}

async function testDiskWriterCoalescesWhileWriting() {
  // touch() đến trong lúc ĐANG ghi (writing=true) → không mất, ghi lượt kế sau khi lượt hiện xong.
  // Mốc thời gian rộng rãi (không siết theo ms) — chỉ cần ghi ĐÚNG 2 lần, tránh test rung do
  // timer hệ điều hành có sai số vài chục ms.
  let writeCount = 0;
  const writer = createDiskWriter(
    async () => {
      writeCount += 1;
      await new Promise((r) => setTimeout(r, 150)); // giả lập ghi đĩa mất chút thời gian
      return { ok: true };
    },
    { intervalMs: 3000 },
  );
  writer.flushNow(); // ép lượt ghi #1 bắt đầu ngay, khỏi phụ thuộc mốc intervalMs đầu tiên
  await new Promise((r) => setTimeout(r, 50)); // chắc chắn đang giữa lượt ghi #1 (mất 150ms)
  writer.touch(); // đến giữa lúc đang ghi — phải được ghi nhận, không rơi mất
  await new Promise((r) => setTimeout(r, 3500)); // đợi hết lượt #1 + throttle + lượt #2
  ok('touch() giữa lúc đang ghi KHÔNG bị rơi mất — có lượt ghi thứ 2', writeCount === 2);
  writer.dispose();
}

async function testDiskWriterFailureReported() {
  const results: DiskWriteResult[] = [];
  const writer = createDiskWriter(
    async () => ({ ok: false, reason: 'no-permission' }),
    { intervalMs: 20, onStatus: (r) => results.push(r) },
  );
  writer.flushNow();
  await new Promise((r) => setTimeout(r, 30));
  ok('ghi thất bại → onStatus báo ok:false + lý do, KHÔNG nuốt im lặng', results.length === 1 && results[0].ok === false && results[0].reason === 'no-permission');
  writer.dispose();
}

testResolveSourceOfTruth();
void (async () => {
  await testDiskWriterThrottle();
  await testDiskWriterFlushNow();
  await testDiskWriterCoalescesWhileWriting();
  await testDiskWriterFailureReported();
  console.log(`\n${pass} ok, ${fail} fail`);
  if (fail > 0) process.exit(1);
})();
