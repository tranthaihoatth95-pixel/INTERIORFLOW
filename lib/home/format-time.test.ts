/** Test `format-time.ts` — chạy: node_modules/.bin/sucrase-node lib/home/format-time.test.ts */
import { timeAgo } from './format-time';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) { pass++; console.log('  ok  -', name); }
  else { fail++; console.log('  FAIL-', name); }
}

const NOW = new Date(2026, 7, 13, 12, 0, 0);

console.log('timeAgo() — nấc phút/giờ/ngày/tháng, vi + en');
{
  ok('< 1 phút → vừa xong', timeAgo(new Date(NOW.getTime() - 10_000).toISOString(), false, NOW) === 'vừa xong');
  ok('5 phút trước', timeAgo(new Date(NOW.getTime() - 5 * 60_000).toISOString(), false, NOW) === '5 phút trước');
  ok('3 giờ trước', timeAgo(new Date(NOW.getTime() - 3 * 3600_000).toISOString(), false, NOW) === '3 giờ trước');
  ok('2 ngày trước', timeAgo(new Date(NOW.getTime() - 2 * 24 * 3600_000).toISOString(), false, NOW) === '2 ngày trước');
  ok('2 tháng trước (>30 ngày)', timeAgo(new Date(NOW.getTime() - 65 * 24 * 3600_000).toISOString(), false, NOW) === '2 tháng trước');
  ok('EN: 5m ago', timeAgo(new Date(NOW.getTime() - 5 * 60_000).toISOString(), true, NOW) === '5m ago');
  ok('EN: 1 day ago (số ít)', timeAgo(new Date(NOW.getTime() - 1 * 24 * 3600_000).toISOString(), true, NOW) === '1 day ago');
}

console.log('timeAgo() — ISO hỏng/tương lai không throw');
{
  ok('ISO hỏng → vừa xong', timeAgo('not-a-date', false, NOW) === 'vừa xong');
  ok('tương lai (diff âm) → vừa xong', timeAgo(new Date(NOW.getTime() + 60_000).toISOString(), false, NOW) === 'vừa xong');
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
