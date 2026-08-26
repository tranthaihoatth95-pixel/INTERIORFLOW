/**
 * components/home/widgets/light-clock.test.ts — CANH NHÁNH ĐÃ BỊ BÁC KHÔNG SỐNG LẠI.
 * Chạy: `node_modules/.bin/sucrase-node components/home/widgets/light-clock.test.ts`
 *
 * 🔴 Vì sao có tệp này (§17 SAFE CONVERGENCE): đánh dấu "superseded" trong sổ mà mã vẫn render
 * được thì đó là LỖI SẢN XUẤT, không phải nợ giấy tờ. Ca thật 22/08: Home có BA chỗ mount
 * `LightClock`, chỉ MỘT truyền cờ `truong`, nên hai chỗ kia vẫn dựng nguyên đồng hồ đo mà Hoà đã
 * bác — cờ che được một chỗ, không che được cả cây.
 * ⇒ Nay khối đo bị XOÁ HẲN. Test này canh cho nó không quay lại bằng bất kỳ cờ nào.
 *
 * Ánh sáng ngày ở lại dưới dạng MÔI TRƯỜNG (độ sáng · ấm/lạnh · tên buổi) — thứ người dùng CẢM.
 * Thứ bị cấm là thứ người dùng phải ĐỌC như một biểu đồ telemetry.
 */
import { readFileSync } from 'fs';
import { join } from 'path';

let fail = 0;
const ok = (m: string, c: unknown) => { if (c) console.log('  ok  -', m); else { fail++; console.log('  FAIL -', m); } };

/** Bỏ comment — chỉ soi MÃ SỐNG. Nhắc tên thứ đã xoá trong comment là hợp lệ và cần thiết. */
function maSong(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '\n')
    .split('\n').filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*')).join('\n');
}

const src = maSong(readFileSync(join(__dirname, 'LightClock.tsx'), 'utf8'));
const home = maSong(readFileSync(join(__dirname, '..', 'DongStudioHome.tsx'), 'utf8'));

console.log('\nLightClock — đồng hồ đo ánh sáng KHÔNG được sống lại');

console.log('\n[1] Dấu vết Hoà bác — không còn trong mã sống');
for (const [ten, mau] of [
  ['mốc giờ 05:00 / 20:00', /\b(05:00|20:00)\b/],
  ['nhãn kelvin (2700K/5600K)', /\d{4}K|tod\.kelvin/],
  ['cung mặt trời (svg)', /<svg/],
  ['toạ độ cung', /\barc[XY]\b/],
] as const) {
  ok(`${ten} — 0 chỗ`, !mau.test(src));
}

console.log('\n[2] Không cờ nào bật lại được khối đo');
ok('không còn nhánh `!khongDongHo && (` dựng khối đo', !/!khongDongHo\s*&&\s*\(/.test(src));

console.log('\n[3] Ánh sáng ngày VẪN CÒN — dưới dạng môi trường, không bị xoá nhầm');
ok('vẫn còn tên buổi (không khí)', /tod\.label/.test(src));
ok('Home vẫn dựng LightClock', /<LightClock/.test(home));

console.log(fail === 0 ? '\nTẤT CẢ ĐẠT\n' : `\n${fail} MỤC HỎNG\n`);
if (fail > 0) process.exit(1);
