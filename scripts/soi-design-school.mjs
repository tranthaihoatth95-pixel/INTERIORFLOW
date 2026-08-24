#!/usr/bin/env node
/**
 * scripts/soi-design-school.mjs — CANH TRƯỜNG THIẾT KẾ KHÔNG MỒ CÔI.
 *
 * ─── VÌ SAO CÓ MÁY NÀY ────────────────────────────────────────────────────────
 * `docs/IF-ARCHITECTURE-COMPASS.md` là bản đồ kiến trúc đầy đủ, 12KB, đúng thứ mọi phiên cần.
 * Một lượt đổi tên 28/07 làm đứt con trỏ trong `CLAUDE.md`. Tệp vẫn SỐNG, nhưng không ai trỏ
 * tới nữa ⇒ **19 NGÀY không phiên nào đọc**, và suốt 19 ngày đó các phiên tự suy diễn lại
 * những thứ đã có sẵn trong đó.
 *
 * Tri thức chết KHÔNG phải vì bị xoá. Nó chết vì **không ai còn đường đi tới**.
 *
 * Trường Thiết Kế có 40+ tệp. Không có máy này thì nó sẽ chết đúng y như thế — và chết ÊM,
 * vì mọi tệp vẫn nằm đó, `git status` sạch, không lỗi nào nổi lên.
 *
 * ─── CANH HAI CHIỀU ───────────────────────────────────────────────────────────
 *   ① CON TRỎ CHẾT — `SKILL.md` trỏ tới tệp KHÔNG tồn tại  ⇒ người đọc đi vào ngõ cụt
 *   ② TỆP MỒ CÔI  — tệp tồn tại mà KHÔNG con trỏ nào tới   ⇒ viết xong rồi không ai đọc
 * Chiều ② mới là chiều đã giết bản đồ cũ, và là chiều không ai nghĩ tới đi kiểm.
 *
 * Chạy: `npm run soi:design-school`
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TRUONG = join(ROOT, '.claude/skills/if-design');
const REVIEW = join(ROOT, '.claude/skills/if-design-review');

function quet(dir, ra = []) {
  if (!existsSync(dir)) return ra;
  for (const t of readdirSync(dir)) {
    const p = join(dir, t);
    if (statSync(p).isDirectory()) quet(p, ra);
    else if (t.endsWith('.md')) ra.push(relative(TRUONG, p));
  }
  return ra;
}

const tep = quet(TRUONG).filter((p) => p !== 'SKILL.md');
const skill = existsSync(join(TRUONG, 'SKILL.md')) ? readFileSync(join(TRUONG, 'SKILL.md'), 'utf8') : '';

// Con trỏ tính cả dạng thư mục (`knowledge/**`, `examples/BAD/`) — chỉ đường tới CỤM cũng là chỉ đường.
const troToi = (p) => {
  if (skill.includes(p)) return true;
  const thuMuc = p.split('/').slice(0, -1).join('/');
  return thuMuc ? skill.includes(`${thuMuc}/**`) || skill.includes(`${thuMuc}/`) : false;
};

const moCoi = tep.filter((p) => !troToi(p));

// Chiều ①: mọi đường dẫn `.md` SKILL.md nhắc tới, trong phạm vi trường, phải có thật.
const nhac = [...skill.matchAll(/`([A-Za-z0-9_\-./]+\.md)`/g)].map((m) => m[1]);
const chet = nhac.filter((p) => {
  if (p.startsWith('docs/') || p.startsWith('.claude/')) return !existsSync(join(ROOT, p));
  return !existsSync(join(TRUONG, p));
});

console.log(`\nSOI TRƯỜNG THIẾT KẾ — ${new Date().toISOString().slice(0, 10)}`);
console.log('─'.repeat(78));
console.log(`Tệp trong trường: ${tep.length} · skill soi độc lập: ${existsSync(REVIEW) ? 'CÓ' : '🔴 THIẾU'}`);

if (chet.length) {
  console.log(`\n🔴 CON TRỎ CHẾT — ${chet.length} (SKILL.md dẫn vào ngõ cụt)`);
  for (const p of chet) console.log(`   · ${p}`);
}
if (moCoi.length) {
  console.log(`\n🟠 TỆP MỒ CÔI — ${moCoi.length} (tồn tại nhưng KHÔNG lối vào)`);
  for (const p of moCoi) console.log(`   · ${p}`);
  console.log(`   ↳ Đây đúng cách IF-ARCHITECTURE-COMPASS chết 19 ngày: tệp sống, con trỏ đứt.`);
}
if (!chet.length && !moCoi.length) console.log('\n🟢 Không con trỏ chết, không tệp mồ côi.');

console.log('');
process.exit(chet.length || moCoi.length ? 1 : 0);
