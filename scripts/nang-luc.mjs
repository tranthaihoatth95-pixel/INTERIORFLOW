#!/usr/bin/env node
/**
 * nang-luc.mjs — SỔ NĂNG LỰC TỰ SINH: mỗi máy tự khai nó bắt gì, và nó có nằm trên đường đi không.
 *
 * Hoà 28/08: *"các cơ chế với nhau không nối thì làm sao chúng biết chúng tồn tại vì điều gì,
 * và đâu biết vai trò mình mạnh ra sao để đề xuất tốt?"*
 *
 * Đo được cùng ngày: `IF-TOOLING-RECEIPT.md` — sổ năng lực **viết tay** — đo 23/08 và chỉ nhắc
 * **5** máy soi, trong khi đã có **17**. Sổ viết tay thì **luôn cũ hơn thực tế**, nên máy không
 * biết mình để làm gì và agent không biết mình cầm gì.
 *
 * ⇒ **Sinh ra, không viết tay.** Không sửa 17 tệp: ba nguồn cần thiết ĐÃ TỒN TẠI, chỉ chưa ai nối.
 *     ① dòng mô tả đầu mỗi script  — nó bắt gì
 *     ② `package.json → scripts.test` — nó có nằm trên đường mọi người đi không
 *     ③ mã thoát khi chạy thật     — nó CHẶN hay chỉ CẢNH BÁO
 * Cột ③ là cột không sổ viết tay nào có, và là cột quan trọng nhất sau bài học 28/08:
 * **dây cảnh báo không dẫn điện.**
 */
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const REPO = process.cwd();
const pkg = JSON.parse(readFileSync(path.join(REPO, 'package.json'), 'utf8'));
const duongTest = pkg.scripts.test ?? '';
const chay = process.argv.includes('--chay');

/** Câu mô tả: dòng đầu tiên có nghĩa trong khối chú thích đầu tệp. */
function moTa(tep) {
  if (!existsSync(tep)) return '(không thấy tệp)';
  const src = readFileSync(tep, 'utf8').slice(0, 2500);
  const m = src.match(/^\s*\*\s*[\w./-]+\.mjs\s*[—-]\s*(.+)$/m) || src.match(/^\s*\*\s*([A-ZĐÀ-Ỹ][^*\n]{15,})$/m);
  return m ? m[1].trim().replace(/\.$/, '') : '(chưa khai trong chú thích đầu tệp)';
}

const may = Object.entries(pkg.scripts)
  .filter(([k, v]) => /^(soi|check):/.test(k) && v.startsWith('node scripts/'))
  .map(([k, v]) => {
    const tep = path.join(REPO, v.replace(/^node\s+/, '').split(' ')[0]);
    return { lenh: k, tep, moTa: moTa(tep), tren: duongTest.includes(k) };
  });

console.log('SỔ NĂNG LỰC — tự sinh, không viết tay\n');
console.log(`  ${may.length} máy · ${may.filter((m) => m.tren).length} nằm trên đường \`npm test\`\n`);

for (const m of may) {
  let day = '?';
  if (chay) {
    try { execFileSync('npm', ['run', m.lenh], { stdio: 'ignore' }); day = 'xanh'; }
    catch (e) { day = e.status === 1 ? 'ĐỎ' : `thoát ${e.status}`; }
  }
  const noi = m.tren ? '✅ trên đường' : '🔴 NGOÀI đường';
  console.log(`${noi.padEnd(16)} ${m.lenh.padEnd(20)} ${chay ? `[${day}] ` : ''}${m.moTa.slice(0, 96)}`);
}

const ngoai = may.filter((m) => !m.tren);
if (ngoai.length) {
  console.log(`\n🔴 ${ngoai.length} máy TỒN TẠI mà không nằm trên đường ai đi: ${ngoai.map((m) => m.lenh).join(' · ')}`);
  console.log('   Một máy canh ngoài đường thi công thì nó không canh gì cả — nó chỉ là một tệp.');
}
console.log('\nChạy kèm `--chay` để biết máy nào đang đỏ (chậm hơn, vì nó chạy thật từng máy).');
