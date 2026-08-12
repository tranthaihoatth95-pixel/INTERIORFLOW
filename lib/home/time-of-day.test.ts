/** Test `time-of-day.ts` — chạy: node_modules/.bin/sucrase-node lib/home/time-of-day.test.ts */
import { timeOfDayFromHour, timeOfDayNow, sunPosition } from './time-of-day';

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

console.log('Mỗi khung có kelvin + lightLabel [vi,en] (v3 widget B)');
{
  const periods = [0, 6, 12, 18].map((h) => timeOfDayFromHour(h));
  ok('kelvin là số dương', periods.every((p) => typeof p.kelvin === 'number' && p.kelvin > 0));
  ok('lightLabel có [vi,en]', periods.every((p) => p.lightLabel.length === 2 && p.lightLabel[0] !== p.lightLabel[1]));
}

console.log('sunPosition() — cung bình minh(5h)→hoàng hôn(20h), thuần theo giờ');
{
  const sunrise = sunPosition(5);
  ok('5h = mép trái (x=0)', sunrise.xPercent === 0);
  ok('5h = chân trời (y=100)', sunrise.yPercent === 100);
  ok('5h không phải đêm', sunrise.belowHorizon === false);

  const noonish = sunPosition(12.5); // giữa cung [5,20)
  ok('giữa cung = đỉnh cung (y≈0)', Math.abs(noonish.yPercent - 0) < 1e-6);
  ok('giữa cung = x≈50', Math.abs(noonish.xPercent - 50) < 1e-6);

  const beforeSunset = sunPosition(19.999);
  ok('gần 20h = gần mép phải', beforeSunset.xPercent > 99);

  const midnight = sunPosition(0);
  ok('0h là đêm', midnight.belowHorizon === true);
  ok('0h clamp progress về 0', midnight.progress === 0);

  const duskEdge = sunPosition(20);
  ok('20h (biên) đã tính là đêm — cùng biên NIGHT của timeOfDayFromHour', duskEdge.belowHorizon === true);

  const wrap = sunPosition(-1); // an toàn input âm, giống timeOfDayFromHour
  ok('giờ âm không throw, tự chuẩn hoá (=23h, đêm)', wrap.belowHorizon === true);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
