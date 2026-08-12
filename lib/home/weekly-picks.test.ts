/** Test `weekly-picks.ts` — chạy: node_modules/.bin/sucrase-node lib/home/weekly-picks.test.ts */
import { isoWeekNumber, pickWeeklyItem, pickWeeklyImages, guessMaterialKind } from './weekly-picks';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) { pass++; console.log('  ok  -', name); }
  else { fail++; console.log('  FAIL-', name); }
}
function eq(name: string, a: unknown, b: unknown) {
  ok(`${name} (${JSON.stringify(a)} = ${JSON.stringify(b)})`, JSON.stringify(a) === JSON.stringify(b));
}

console.log('isoWeekNumber() — mốc đã biết trước (kiểm tay theo lịch ISO-8601)');
{
  eq('2026-01-01 (thứ Năm) = tuần 1', isoWeekNumber(new Date(2026, 0, 1)), 1);
  eq('2026-08-13 (thứ Năm) = tuần 33', isoWeekNumber(new Date(2026, 7, 13)), 33);
  eq('2025-12-29 (thứ Hai, thuộc tuần 1/2026)', isoWeekNumber(new Date(2025, 11, 29)), 1);
}

console.log('pickWeeklyItem() — TẤT ĐỊNH: cùng tuần luôn ra cùng phần tử, không random');
{
  const items = ['gỗ sồi', 'đá marble', 'vải lanh', 'kim loại đồng'];
  const mon = new Date(2026, 7, 10); // thứ Hai tuần 33
  const fri = new Date(2026, 7, 14); // thứ Sáu CÙNG tuần 33
  const a = pickWeeklyItem(items, mon);
  const b = pickWeeklyItem(items, fri);
  eq('cùng tuần → cùng kết quả', a, b);

  const nextWeek = new Date(2026, 7, 20); // tuần 34
  ok('đổi tuần → index đổi theo isoWeekNumber', pickWeeklyItem(items, nextWeek) !== null);

  eq('danh sách rỗng → null', pickWeeklyItem([], mon), null);
}

console.log('pickWeeklyImages() — lọc theo usage, giữ thứ tự gốc, cắt limit');
{
  const assets = [
    { id: 'a', usage: 'ref-render' },
    { id: 'b', usage: 'material' },
    { id: 'c', usage: 'ref-render' },
    { id: 'd', usage: 'slide' },
    { id: 'e', usage: 'ref-render' },
  ];
  const picked = pickWeeklyImages(assets, 'ref-render', 2);
  eq('lọc đúng usage + cắt limit 2, giữ thứ tự', picked.map((p) => p.id), ['a', 'c']);
  eq('usage không khớp → rỗng', pickWeeklyImages(assets, 'brief', 5), []);
  eq('mảng rỗng → rỗng', pickWeeklyImages([], 'ref-render', 5), []);
}

console.log('guessMaterialKind() — đoán loại từ chuỗi tự do VI/EN, mặc định an toàn "paint"');
{
  eq('gỗ sồi tự nhiên', guessMaterialKind('Gỗ sồi tự nhiên', ''), 'wood');
  eq('marble tile', guessMaterialKind('', 'marble, tile, bathroom'), 'stone');
  eq('thép không gỉ', guessMaterialKind('Thép không gỉ', ''), 'metal');
  eq('linen curtain', guessMaterialKind('Rèm vải lanh', 'linen'), 'fabric');
  eq('kính cường lực', guessMaterialKind('Kính cường lực', ''), 'glass');
  eq('sơn matte', guessMaterialKind('Sơn tường matte', ''), 'paint');
  eq('không khớp gì → paint mặc định', guessMaterialKind('Đồ trang trí lạ', 'misc'), 'paint');
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
