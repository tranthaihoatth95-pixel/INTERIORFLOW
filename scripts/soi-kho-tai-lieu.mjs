#!/usr/bin/env node
/**
 * soi-kho-tai-lieu.mjs — ĐO độ phân mảnh của kho tài liệu, KHÔNG dời một tệp nào.
 *
 * Hoà 28/08: *"gốc rễ của sự rời rạc … dọn dẹp sắp xếp lại ngăn nắp được không?"*
 * Được — nhưng đo trước. Dời hàng loạt là gãy mọi tham chiếu (lớp lỗi B: đúng thao tác, sai
 * đối tượng). Máy này chỉ ĐỌC; nó nói kho đang hỏng ở đâu để việc dọn có mục tiêu.
 *
 * Bốn số nó trả lời:
 *   ① MỒ CÔI   — tệp không tệp nào trỏ tới. Viết ra rồi không ai đi tới thì bằng không (M-24).
 *   ② ĐÃ ĐÓNG DẤU — tự khai superseded/không-còn-cửa-vào. Đây là phần dọn AN TOÀN nhất.
 *   ③ TÊN KHẢO CỔ — tên mang ngày tháng hoặc tên máy sinh ra nó, không phải câu hỏi nó trả lời.
 *   ④ TRÙNG NỘI DUNG — cùng sha256, khác đường dẫn. Hai bản thật, phân kỳ chờ sẵn.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const REPO = process.cwd();
const BO = new Set(['node_modules', '.git', '.next', '.claude', 'worktrees']);

function quet(dir, ra = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (BO.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) quet(p, ra);
    else if (e.name.endsWith('.md')) ra.push(p);
  }
  return ra;
}

/* 🔴 SỬA 28/08 — PHẠM VI ĐO TỪNG THIẾU, và nó gây hỏng thật.
 * Lượt dọn sáng 28/08 dời 111 tệp "mồ côi". Một trong số đó — `SKILL-if-design-BAN-CU-23-08.md` —
 * **không hề mồ côi**: nó được trỏ tới từ `.claude/skills/if-design/SKILL.md`, tức **ngoài `docs/`**,
 * nơi phép đo này không quét tới. Máy nói "mồ côi" vì **nó không nhìn đủ rộng**, không phải vì
 * tệp thật sự không ai cần. Dọn xong thì `soi:design-school` báo con trỏ chết.
 * ⇒ Bài học: *"an toàn vì chỉ dời tệp mồ côi"* chỉ đúng khi **phạm vi đo phủ hết nơi có thể trỏ tới**.
 * Nay quét thêm `.claude/` khi tìm tham chiếu. */
const tep = quet(path.join(REPO, 'docs')).concat(
  readdirSync(REPO).filter((f) => f.endsWith('.md')).map((f) => path.join(REPO, f)),
);

// Gom toàn bộ chữ để tìm tham chiếu — đọc một lần, không quét lại 887 lần.
const noi = new Map();
for (const t of tep) { try { noi.set(t, readFileSync(t, 'utf8')); } catch { noi.set(t, ''); } }
/* Nguồn tham chiếu KHÔNG chỉ là `docs/` — gộp cả `.claude/` (skill, cấu hình agent) và mã nguồn,
 * vì một tệp tài liệu hoàn toàn có thể chỉ được trỏ tới từ đó. */
const nguonTro = [...noi.values()];
for (const d of ['.claude', 'scripts', 'lib', 'components', 'app']) {
  const goc = path.join(REPO, d);
  if (!existsSync(goc)) continue;
  const di = (t) => { for (const e of readdirSync(t, { withFileTypes: true })) {
    if (BO.has(e.name)) continue;
    const q = path.join(t, e.name);
    if (e.isDirectory()) di(q);
    else if (/\.(md|ts|tsx|mjs|json)$/.test(e.name)) { try { nguonTro.push(readFileSync(q, 'utf8')); } catch { /* bỏ qua */ } }
  } };
  di(goc);
}
const tatCa = nguonTro.join('\n');

const DAU_DONG = /KHÔNG CÒN LÀ CỬA VÀO|SUPERSEDED|THAY BỞI|đã bị thay thế|dấu vết|chuyển hướng/i;
const TEN_KHAO_CO = /\d{4}-\d{2}-\d{2}|\d{2}-\d{2}\.md$|^(AUDIT|SOI|PROMPT|BAN-GIAO|CHOT|BAO-CAO|PHIEU)/i;

const moCoi = [], daDong = [], khaoCo = [];
const bam = new Map();

for (const t of tep) {
  const ten = path.basename(t);
  const goc = ten.replace(/\.md$/, '');
  // được trỏ tới nếu tên xuất hiện ở BẤT KỲ tệp nào khác
  const soLan = tatCa.split(goc).length - 1;
  const tuNo = (noi.get(t).split(goc).length - 1);
  if (soLan - tuNo <= 0) moCoi.push(t);
  if (DAU_DONG.test(noi.get(t).slice(0, 1200))) daDong.push(t);
  if (TEN_KHAO_CO.test(ten)) khaoCo.push(t);
  const h = createHash('sha256').update(noi.get(t)).digest('hex');
  if (!bam.has(h)) bam.set(h, []);
  bam.get(h).push(t);
}
const trung = [...bam.values()].filter((v) => v.length > 1);

const r = (p) => path.relative(REPO, p);
const pc = (n) => `${((n / tep.length) * 100).toFixed(0)}%`;

console.log('SOI KHO TÀI LIỆU · chỉ đọc, không dời tệp nào\n');
console.log(`  tổng tệp .md          ${tep.length}`);
console.log(`  ① mồ côi              ${moCoi.length}  (${pc(moCoi.length)}) — không tệp nào trỏ tới`);
console.log(`  ② đã đóng dấu         ${daDong.length}  (${pc(daDong.length)}) — tự khai đã bị thay/không còn cửa vào`);
console.log(`  ③ tên khảo cổ         ${khaoCo.length}  (${pc(khaoCo.length)}) — tên mang ngày hoặc tên máy sinh`);
console.log(`  ④ trùng nội dung      ${trung.length} cặp — cùng sha256, khác đường dẫn`);

const vuaMoCoiVuaCu = moCoi.filter((t) => khaoCo.includes(t));
console.log(`\n  ⇒ VỪA mồ côi VỪA tên khảo cổ: ${vuaMoCoiVuaCu.length} — đây là phần dọn an toàn nhất`);

console.log('\n── ④ TRÙNG NỘI DUNG (nguy hiểm nhất: hai bản thật) ──');
if (!trung.length) console.log('  không có');
for (const g of trung.slice(0, 8)) console.log('  ' + g.map(r).join('\n    ≡ '));

console.log('\n── ① MỒ CÔI, 12 tệp lớn nhất ──');
for (const t of moCoi.map((t) => ({ t, s: statSync(t).size })).sort((a, b) => b.s - a.s).slice(0, 12)) {
  console.log(`  ${String(Math.round(t.s / 1024)).padStart(4)} KB  ${r(t.t)}`);
}
console.log('\nKhông tệp nào bị dời, đổi tên hay xoá trong lượt chạy này.');

/* ── BÁNH CÓC MỒ CÔI — cơ chế "KHÔNG ĐẺ" ──────────────────────────────────────────────────────
 * Hoà 28/08: *"trí nhớ không có, lưu thì sai chỗ rải rác khắp các thư mục… gốc bệnh nằm ở trí
 * nhớ. Làm sao cho khôn: cách mở mục KHÔNG ĐẺ, và xếp gọn theo mỗi chu kì."*
 *
 * Hai chữ đó là hai cơ chế khác nhau, và một bánh cóc làm được cả hai:
 *   · **không đẻ**  — tạo một tệp mà không tệp nào trỏ tới ⇒ số mồ côi TĂNG ⇒ **ĐỎ, chặn**.
 *                     Muốn thêm tệp thì phải nối nó vào một chỗ có người đi, **trong cùng lượt**.
 *   · **xếp gọn**   — mỗi lần dọn thật thì HẠ trần xuống. Trần chỉ đi một chiều.
 *
 * ⚠️ Đây là cổng **CHẶN**, không phải cảnh báo — đúng bài học vừa trả giá 28/08:
 * **dây cảnh báo không dẫn điện** (`IF-MOT-LOI.md` §bác bỏ). Cổng cảnh báo để 4 vi phạm nằm
 * nguyên; cổng chặn giữ được 0.
 *
 * ⚠️ Và cấm nới trần để qua cổng — nới lên là tháo ngòi dây bẫy (M-52). Nối tệp mới vào, hoặc
 * dọn một tệp cũ. Hai đường, không có đường thứ ba. */
{
  const tranTep = path.join(REPO, 'scripts/foundation-tran.json');
  if (existsSync(tranTep)) {
    const tran = JSON.parse(readFileSync(tranTep, 'utf8'));
    const tr = tran['F-MO-COI'];
    if (typeof tr === 'number') {
      console.log(`\nBÁNH CÓC MỒ CÔI  ${moCoi.length} / trần ${tr}`);
      if (moCoi.length > tr) {
        console.log(`🔴 VƯỢT TRẦN ${moCoi.length - tr} tệp — có tệp vừa sinh ra mà KHÔNG AI TRỎ TỚI.`);
        console.log('   Hai đường, không có đường thứ ba:');
        console.log('     · NỐI tệp mới vào một chỗ có người đi (mục lục, bộ nạp, tệp đang sống)');
        console.log('     · hoặc DỌN một tệp mồ côi cũ');
        console.log('   ⛔ CẤM nới trần để qua cổng — nới lên là tháo ngòi dây bẫy (M-52).');
        process.exit(1);
      }
      if (moCoi.length < tr) {
        console.log(`✅ Thấp hơn trần ${tr - moCoi.length} tệp — hạ trần xuống ${moCoi.length} trong foundation-tran.json.`);
      }
    }
  }
}
