/** Test `time-of-day.ts` — chạy: node_modules/.bin/sucrase-node lib/home/time-of-day.test.ts */
import { timeOfDayFromHour, timeOfDayNow } from './time-of-day';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) { pass++; console.log('  ok  -', name); }
  else { fail++; console.log('  FAIL-', name); }
}

console.log('timeOfDayFromHour() — 4 khung phủ đủ 24h, không chồng lấn');
{
  ok('0h = night', timeOfDayFromHour(0).period === 'night');
  ok('4h = night', timeOfDayFromHour(4).period === 'night');
  ok('5h = dawn (biên dưới)', timeOfDayFromHour(5).period === 'dawn');
  ok('7h = dawn', timeOfDayFromHour(7).period === 'dawn');
  ok('8h = day (biên dưới)', timeOfDayFromHour(8).period === 'day');
  ok('16h = day', timeOfDayFromHour(16).period === 'day');
  ok('17h = dusk (biên dưới)', timeOfDayFromHour(17).period === 'dusk');
  ok('19h = dusk', timeOfDayFromHour(19).period === 'dusk');
  ok('20h = night (biên dưới)', timeOfDayFromHour(20).period === 'night');
  ok('23h = night', timeOfDayFromHour(23).period === 'night');
}

console.log('timeOfDayFromHour() — input lệch (âm/>23) không throw, tự chuẩn hoá');
{
  ok('-1h an toàn (= 23h night)', timeOfDayFromHour(-1).period === 'night');
  ok('25h an toàn (= 1h night)', timeOfDayFromHour(25).period === 'night');
}

console.log('Mỗi khung có gradient khác nhau + trả đủ 2 ngôn ngữ label');
{
  const periods = [0, 6, 12, 18].map((h) => timeOfDayFromHour(h));
  const gradients = new Set(periods.map((p) => p.gradient));
  ok('4 gradient khác nhau', gradients.size === 4);
  ok('label có [vi,en]', periods.every((p) => p.label.length === 2 && p.label[0] !== p.label[1]));
}

console.log('timeOfDayNow() — dùng Date truyền vào, không lệ thuộc đồng hồ máy lúc test chạy');
{
  ok('9h sáng → day', timeOfDayNow(new Date(2026, 7, 13, 9, 0)).period === 'day');
  ok('22h đêm → night', timeOfDayNow(new Date(2026, 7, 13, 22, 0)).period === 'night');
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
