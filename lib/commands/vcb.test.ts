/**
 * lib/commands/vcb.test.ts — chạy: node_modules/.bin/sucrase-node lib/commands/vcb.test.ts
 */
import { parseVcbToken, applyVcbToMoveCopy, type MoveCopyPlan } from './vcb';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

// ── parseVcbToken ──
ok('số trần → value mm', JSON.stringify(parseVcbToken('2400')) === JSON.stringify({ kind: 'value', valueMm: 2400 }));
ok('số thập phân dấu chấm → value', JSON.stringify(parseVcbToken('150.5')) === JSON.stringify({ kind: 'value', valueMm: 150.5 }));
ok('số thập phân dấu phẩy VN → value (đổi , thành .)', JSON.stringify(parseVcbToken('150,5')) === JSON.stringify({ kind: 'value', valueMm: 150.5 }));
ok('khoảng trắng thừa vẫn parse được', JSON.stringify(parseVcbToken('  2400  ')) === JSON.stringify({ kind: 'value', valueMm: 2400 }));
ok('"3x" → multiply n=3', JSON.stringify(parseVcbToken('3x')) === JSON.stringify({ kind: 'multiply', n: 3 }));
ok('"x3" → multiply n=3 (thứ tự ngược)', JSON.stringify(parseVcbToken('x3')) === JSON.stringify({ kind: 'multiply', n: 3 }));
ok('"3X" hoa → multiply n=3', JSON.stringify(parseVcbToken('3X')) === JSON.stringify({ kind: 'multiply', n: 3 }));
ok('"/3" → divide n=3', JSON.stringify(parseVcbToken('/3')) === JSON.stringify({ kind: 'divide', n: 3 }));
ok('"0/3" → divide n=3 (có 0 đứng trước)', JSON.stringify(parseVcbToken('0/3')) === JSON.stringify({ kind: 'divide', n: 3 }));
ok('chuỗi rỗng → invalid', parseVcbToken('').kind === 'invalid');
ok('0 → invalid (không có nghĩa làm khoảng cách)', parseVcbToken('0').kind === 'invalid');
ok('số âm → invalid', parseVcbToken('-5').kind === 'invalid');
ok('"3x0" (n=0) → invalid', parseVcbToken('0x').kind === 'invalid');
ok('chữ rác → invalid', parseVcbToken('abc').kind === 'invalid');

// ── applyVcbToMoveCopy ──
{
  // Kéo tay ban đầu: 1 bản sao cách 600mm — baseSpanMm = 600 (khoảng đã kéo lần đầu, cố định).
  const dragged: MoveCopyPlan = { copyCount: 1, stepMm: 600 };
  const BASE = 600;

  const afterValue = applyVcbToMoveCopy(dragged, { kind: 'value', valueMm: 800 }, BASE);
  ok('gõ số mới → đổi stepMm, giữ copyCount', afterValue.stepMm === 800 && afterValue.copyCount === 1);

  const after3x = applyVcbToMoveCopy(dragged, { kind: 'multiply', n: 3 }, BASE);
  ok('gõ "3x" → 3 bản, MỖI bước = khoảng đã kéo (600, không đổi)', after3x.copyCount === 3 && after3x.stepMm === 600);

  const afterDiv3 = applyVcbToMoveCopy(dragged, { kind: 'divide', n: 3 }, BASE);
  ok('gõ "/3" → 3 bản, TỔNG khoảng giữ nguyên 600 ⇒ mỗi bước 200', afterDiv3.copyCount === 3 && afterDiv3.stepMm === 200);

  const afterInvalid = applyVcbToMoveCopy(dragged, { kind: 'invalid', raw: 'x' }, BASE);
  ok('gõ dở/sai → giữ nguyên kế hoạch hiện tại', afterInvalid.copyCount === 1 && afterInvalid.stepMm === 600);

  // Chỉnh lại nhiều lần liên tiếp (tính lại từ BASE gốc, không cộng dồn) — gõ /3 rồi đổi ý gõ 3x.
  const step1 = applyVcbToMoveCopy(dragged, { kind: 'divide', n: 3 }, BASE); // {3, 200}
  const step2 = applyVcbToMoveCopy(step1, { kind: 'multiply', n: 3 }, BASE); // phải về lại {3, 600}, KHÔNG phải {3, 200*3}
  ok('chỉnh lại nhiều lần dùng LẠI base gốc (không trôi số qua các lần gõ)', step2.stepMm === 600);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
