#!/usr/bin/env node
/**
 * ═══ SOI CÂN NGOẶC CSS ═══════════════════════════════════════════════════════
 *
 * VÌ SAO CÓ MÁY NÀY — một ca thật, 05/09. Lúc hoà hai nhánh, một xung đột trong
 * `app/globals.css` được xử theo lối "giữ cả hai bên", và **chỗ ghép rơi vào giữa một khối
 * `@media` đang mở** ⇒ tệp thiếu đúng MỘT dấu `}`.
 *
 * 🔴 ĐIỀU ĐÁNG SỢ: mọi cổng đang có đều BÁO XANH.
 *      `tsc`            → 0 lỗi   (CSS không đi qua trình kiểm kiểu)
 *      toàn bộ test     → 0 đỏ    (không test nào phân tích CSS)
 *      `design-tokens`  → 181/0   (nó đọc token bằng regex, không cần cú pháp đúng)
 *      `soi:hinh-hoc`, `soi:tu-dien`, `soi:thao-tac` → y hệt trước
 *    Chỉ `next build` mới ngã, và ngã ở tận bước đóng gói:
 *      ./app/globals.css:2712:1  Syntax error: Unclosed block
 *
 * ⇒ Đây là một VÙNG MÙ, không phải một lần xui. Toàn bộ diện mạo app nằm trong tệp CSS mà
 *   không cổng nào soi nó, trong khi nó lại là tệp bị hoà nhánh đụng vào nhiều nhất.
 *
 * MÁY NÀY LÀM GÌ: bóc chú thích `/* *\/` và chuỗi, rồi đếm `{` `}` theo từng dòng. Lệch là ĐỎ,
 * kèm số dòng của khối mở ở mức ngoài cùng gần nhất — đủ để đi thẳng tới chỗ hỏng.
 * Cố ý KHÔNG phân tích CSS đầy đủ: cân ngoặc bắt được đúng lớp lỗi mà việc hoà nhánh đẻ ra,
 * và nó chạy trong mili giây nên cắm vào cổng nào cũng được.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const BO_QUA = ['node_modules', '.next', '.git', '.claude', 'dist-installer', 'release'];

function duyet(thuMuc, ra = []) {
  for (const ten of readdirSync(thuMuc)) {
    if (BO_QUA.includes(ten)) continue;
    const p = join(thuMuc, ten);
    let st;
    try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) duyet(p, ra);
    else if (ten.endsWith('.css')) ra.push(p);
  }
  return ra;
}

/** thay ruột chú thích và chuỗi bằng khoảng trắng, GIỮ xuống dòng ⇒ số dòng không lệch */
function boNhieu(s) {
  let ra = '', i = 0, n = s.length;
  while (i < n) {
    if (s[i] === '/' && s[i + 1] === '*') {
      const het = s.indexOf('*/', i + 2);
      const doan = s.slice(i, het < 0 ? n : het + 2);
      ra += doan.replace(/[^\n]/g, ' ');
      i += doan.length;
      continue;
    }
    if (s[i] === '"' || s[i] === "'") {
      const dau = s[i]; let j = i + 1;
      while (j < n && s[j] !== dau) { if (s[j] === '\\') j++; j++; }
      ra += ' '.repeat(Math.min(j, n) - i + 1);
      i = j + 1;
      continue;
    }
    ra += s[i]; i++;
  }
  return ra;
}

const chan = process.argv.includes('--chan');
let hong = 0;
for (const tep of duyet(ROOT)) {
  const sach = boNhieu(readFileSync(tep, 'utf8'));
  let sau = 0;
  const moNgoaiCung = [];
  sach.split('\n').forEach((dong, k) => {
    const truoc = sau;
    sau += (dong.match(/\{/g) || []).length - (dong.match(/\}/g) || []).length;
    if (truoc === 0 && sau > 0) moNgoaiCung.push({ dong: k + 1, chu: dong.trim().slice(0, 70) });
  });
  if (sau !== 0) {
    hong++;
    const dau = sau > 0 ? `THIẾU ${sau} dấu '}'` : `THỪA ${-sau} dấu '}'`;
    console.error(`🔴 ${relative(ROOT, tep)} — ${dau}`);
    const cuoi = moNgoaiCung[moNgoaiCung.length - 1];
    if (cuoi) console.error(`   khối mở ngoài cùng cuối cùng: dòng ${cuoi.dong}  ${cuoi.chu}`);
  }
}

if (hong === 0) console.log('✅ soi:css-can — mọi tệp .css cân ngoặc');
else if (chan) process.exit(1);
