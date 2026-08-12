/** Test `greeting.ts` — chạy: node_modules/.bin/sucrase-node lib/home/greeting.test.ts */
import { buildGreeting } from './greeting';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) { pass++; console.log('  ok  -', name); }
  else { fail++; console.log('  FAIL-', name); }
}

const NOW = new Date(2026, 7, 13, 9, 0); // Thứ Năm 13/08/2026

console.log('buildGreeting() — có tên → chào bằng tên; ngày tháng đi kèm');
{
  const r = buildGreeting({ name: 'Trần Hoà', now: NOW, en: false, dueTodayCount: 0, recentProjectName: null });
  ok('headline chứa "Chào Hoà"', r.headline.startsWith('Chào Hoà'));
  ok('headline chứa ngày 13/08', r.headline.includes('13/08'));
}

console.log('buildGreeting() — không tên → chào chung, không lỗi/không rỗng');
{
  const r = buildGreeting({ name: null, now: NOW, en: false, dueTodayCount: 0, recentProjectName: null });
  ok('headline không rỗng', r.headline.length > 0);
  ok('headline chứa InteriorFlow', r.headline.includes('InteriorFlow'));
}

console.log('buildGreeting() — có việc đến hạn hôm nay → tín hiệu ưu tiên SỐ VIỆC, không quote sáo');
{
  const r = buildGreeting({ name: 'Hoà', now: NOW, en: false, dueTodayCount: 3, recentProjectName: 'Detech Complex' });
  ok('signal đúng số việc', r.signal === '3 việc đến hạn hôm nay');
}

console.log('buildGreeting() — 1 việc thì số ít (EN), không "1 tasks"');
{
  const r = buildGreeting({ name: 'Hoà', now: NOW, en: true, dueTodayCount: 1, recentProjectName: null });
  ok('EN số ít đúng ngữ pháp', r.signal === '1 task due today');
}

console.log('buildGreeting() — không việc đến hạn nhưng có dự án vừa động → dùng tín hiệu dự án');
{
  const r = buildGreeting({ name: 'Hoà', now: NOW, en: false, dueTodayCount: 0, recentProjectName: 'Detech Complex' });
  ok('signal đúng tên dự án', r.signal === 'Detech Complex vừa có chuyển động');
}

console.log('buildGreeting() — không có gì đáng nói → signal null (TỰ ẨN, không bịa số 0)');
{
  const r = buildGreeting({ name: 'Hoà', now: NOW, en: false, dueTodayCount: 0, recentProjectName: null });
  ok('signal = null', r.signal === null);
}

console.log('buildGreeting() — dueTodayCount âm/NaN không throw, coi như 0');
{
  const r1 = buildGreeting({ name: 'Hoà', now: NOW, en: false, dueTodayCount: -5, recentProjectName: null });
  const r2 = buildGreeting({ name: 'Hoà', now: NOW, en: false, dueTodayCount: NaN, recentProjectName: null });
  ok('âm → null', r1.signal === null);
  ok('NaN → null', r2.signal === null);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
