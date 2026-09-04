/**
 * components/studio/mot-cho-dung.test.ts — MÁY CANH LUẬT **MỘT CHỖ ĐỨNG** cho Vitals (04/09).
 * Chạy: `node_modules/.bin/sucrase-node components/studio/mot-cho-dung.test.ts`
 *
 * VÌ SAO CẦN MỘT MÁY CANH, KHÔNG PHẢI MỘT DÒNG LUẬT TRONG SỔ — ca thật đã sống nhiều tuần:
 *   · `VitalsGesturePanel` chỉ được mount ở `StageSwitcher.tsx`;
 *   · `StageSwitcher` bị gỡ khỏi `AppChrome` 17/08 khi sidebar thành hệ router;
 *   · từ đó ô gõ nhanh ở `StatusBar` gọi `useVitalsUi.open()` vào một panel KHÔNG CÒN MOUNT —
 *     **gõ câu hỏi rồi Enter là mất câu hỏi**, và ⌘J không làm gì.
 * Không có bước biên dịch nào đỏ, không test nào đỏ: đường dây đứt ở đoạn cuối. Đúng loại lỗi
 * 5 máy soi hiện có không bắt được (không lệch nhãn · không lệch hình học · không lệch sổ).
 *
 * BA KHẲNG ĐỊNH, mỗi cái khoá một cách hỏng đã xảy ra hoặc đã lường:
 *   [1] `VitalsGesturePanel` được mount ở ĐÚNG MỘT tệp  — chống mount đôi (`SO-KIEM-TONG` §1).
 *   [2] ⌘J/Ctrl+J đăng ký ở ĐÚNG MỘT tệp                — chống hai nơi cùng nghe một phím.
 *   [3] Chỗ đứng đó là KHẨU ĐỘ MÉP TRÊN, và nó được MOUNT THẬT trong vỏ app — chống lặp lại
 *       đúng ca 17/08: chỗ mount duy nhất nằm trong một component không ai mount.
 *
 * ⚠️ Đây là phép soi CHỮ trên mã nguồn (cùng họ `soi-tu-dien`/`soi-hinh-hoc`), không phải render
 * thật: nó bắt được "có mount trong mã hay không", KHÔNG bắt được "có hiện lên màn hay không".
 * Phần sau chỉ mắt người và ảnh chụp trả lời được.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const GOC = join(__dirname, '..', '..');
const QUET = ['components', 'app', 'lib'];
const DUOI = ['.ts', '.tsx'];

let pass = 0;
const loi: string[] = [];
function ok(ten: string, dieu: boolean, them = '') {
  if (dieu) { pass++; console.log(`  ok  - ${ten}`); }
  else { loi.push(`${ten}${them ? ` — ${them}` : ''}`); console.log(`  FAIL- ${ten}${them ? ` — ${them}` : ''}`); }
}

function moiTep(thuMuc: string, ra: string[] = []): string[] {
  for (const ten of readdirSync(thuMuc)) {
    if (ten === 'node_modules' || ten.startsWith('.')) continue;
    const p = join(thuMuc, ten);
    if (statSync(p).isDirectory()) moiTep(p, ra);
    else if (DUOI.some((d) => ten.endsWith(d)) && !ten.endsWith('.test.ts') && !ten.endsWith('.test.tsx')) ra.push(p);
  }
  return ra;
}

/**
 * 🔴 BỎ CHÚ THÍCH TRƯỚC KHI ĐẾM — không phải mẹo, đây là điều kiện đúng/sai của cả máy canh.
 * Lần chạy đầu nó báo 3 lỗi giả: `StatusBar.tsx` và `AppChrome.tsx` có `<VitalsGesturePanel>` /
 * `<VitalsPill/>` **trong chú thích đóng dấu lỗi thời** — tức đúng những dòng ta vừa viết để
 * giải thích rằng chúng ĐÃ ĐƯỢC GỠ. Một máy canh trừng phạt việc ghi lại lịch sử thì người ta
 * sẽ xoá lịch sử để nó xanh; hỏng cả hai.
 * ⚠️ Phép bỏ này thô: `//` trong chuỗi (vd `https://…`) cũng bị cắt tới cuối dòng. Chấp nhận —
 * ta chỉ tìm thẻ JSX, và không ai dựng thẻ JSX sau một URL trên cùng một dòng.
 */
function boChuThich(n: string): string {
  return n.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

const teps = QUET.flatMap((d) => moiTep(join(GOC, d)));
const doc = new Map<string, string>(
  teps.map((p) => [p.slice(GOC.length + 1), boChuThich(readFileSync(p, 'utf8'))]),
);

console.log('\nmot-cho-dung — Vitals chỉ được có MỘT chỗ đứng vật lý\n');

/* ── [1] MOUNT PANEL ─────────────────────────────────────────────────────────────────────────
   Đếm nơi thật sự DỰNG thẻ `<VitalsGesturePanel …>`, không đếm chỗ nhắc tên trong chú thích. */
console.log('[1] `VitalsGesturePanel` mount ở ĐÚNG MỘT tệp');
const mount = [...doc.entries()].filter(([, n]) => /<VitalsGesturePanel[\s/>]/.test(n)).map(([f]) => f);
ok('đúng 1 nơi mount', mount.length === 1, `thấy ${mount.length}: ${mount.join(' · ') || '(không nơi nào)'}`);
ok('nơi đó là khẩu độ mép trên', mount[0] === 'components/studio/VitalsAperture.tsx', mount[0] ?? '(trống)');

/* ── [2] ⌘J ──────────────────────────────────────────────────────────────────────────────────
   Bắt theo mẫu điều kiện phím thật (`e.key === 'j'`), không bắt chữ "⌘J" trong chú thích —
   chú thích nhắc lại phím tắt là chuyện bình thường và không được tính là một nơi đăng ký. */
console.log('\n[2] ⌘J / Ctrl+J đăng ký ở ĐÚNG MỘT tệp');
const phimJ = [...doc.entries()]
  .filter(([, n]) => /\.key\s*===\s*['"]j['"]/i.test(n) && /metaKey|ctrlKey/.test(n))
  .map(([f]) => f);
ok('đúng 1 nơi đăng ký', phimJ.length === 1, `thấy ${phimJ.length}: ${phimJ.join(' · ') || '(không nơi nào)'}`);
ok('nơi đó là khẩu độ mép trên', phimJ[0] === 'components/studio/VitalsAperture.tsx', phimJ[0] ?? '(trống)');

/* ── [3] KHẨU ĐỘ PHẢI ĐƯỢC MOUNT THẬT ────────────────────────────────────────────────────────
   Chính là ca 17/08: chỗ mount duy nhất nằm trong một component không ai mount nữa. */
console.log('\n[3] Khẩu độ có chỗ đứng THẬT trong vỏ app');
const dungKhauDo = [...doc.entries()].filter(([f, n]) => f !== 'components/studio/VitalsAperture.tsx' && /<VitalsAperture[\s/>]/.test(n)).map(([f]) => f);
ok('có ít nhất 1 nơi mount khẩu độ', dungKhauDo.length >= 1, dungKhauDo.join(' · ') || '(mồ côi — đúng ca 17/08)');
ok('mount trong vỏ app (AppChrome)', dungKhauDo.includes('components/studio/AppChrome.tsx'), dungKhauDo.join(' · '));

/* ── [4] HAI BIA MỘ KHÔNG ĐƯỢC HỒI SINH ──────────────────────────────────────────────────────
   `VitalsPill` (chỗ đứng góc màn ở Home) và `VitalsRightEdgeHost` (cạnh trục phải) đều là chỗ
   đứng đã bị EXS §7 đè. Mount lại bất kỳ cái nào = hai chỗ đứng cho một Vitals. */
console.log('\n[4] Chỗ đứng đã bỏ thì không mọc lại');
for (const bia of ['VitalsPill', 'VitalsRightEdgeHost']) {
  const nguoiDung = [...doc.entries()]
    .filter(([f, n]) => !f.endsWith(`${bia}.tsx`) && new RegExp(`<${bia}[\\s/>]`).test(n))
    .map(([f]) => f);
  ok(`\`${bia}\` không được mount ở đâu`, nguoiDung.length === 0, nguoiDung.join(' · '));
}

console.log(`\n${loi.length === 0 ? '✅' : '❌'} mot-cho-dung: ${pass} pass · ${loi.length} fail`);
if (loi.length) process.exit(1);
