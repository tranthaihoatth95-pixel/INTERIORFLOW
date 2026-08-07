#!/usr/bin/env node
/**
 * db-sach.mjs — dựng một CSDL TRỐNG, đủ schema, để nghiệm thu như người dùng mới cài app.
 *
 * VÌ SAO CÓ TỆP NÀY (08/08 — Hoà chốt phương án B):
 * Đo `prisma/dev.db` sau phiếu p12 thì thấy **cả 9 dự án đều là rác thử nghiệm**:
 *   "Dự án verify inline input" · "Enter test 2" · "Test B3 (phục hồi backup)" ·
 *   "M-SCOPE test rỗng" · 4 dự án `__nb:` do notebook tự sinh
 * 45 flow mồ côi cũng vậy: "Untitled flow" × nhiều, "Dự án mẫu" × 2.
 * 1 516 tài sản thư viện thì tên là mã băm (`0d83e371…`, `z8013092465505_…`) — ảnh nhập
 * hàng loạt lúc thử, không phải thư viện có tổ chức.
 *
 * ⇒ `dev.db` là BÃI THỬ của đội làm app, không phải dữ liệu người dùng.
 * Nghiệm thu trên bãi thử thì không trả lời được câu quan trọng nhất:
 * **"người dùng mới cài app, làm một vòng, tắt đi mở lại — còn nguyên không?"**
 *
 * PHƯƠNG ÁN B (Hoà chốt): GIỮ NGUYÊN `dev.db` để thử lặt vặt · dựng thêm `dev-sach.db`
 * trống trơn để nghiệm thu. Không xoá gì cả.
 *
 * CÁCH DÙNG:
 *   node scripts/db-sach.mjs            ← xem trước, KHÔNG đụng gì
 *   node scripts/db-sach.mjs --that     ← dựng thật (từ chối ghi đè nếu tệp đã có)
 *   node scripts/db-sach.mjs --that --ghi-de   ← dựng lại từ đầu
 *
 * SAU KHI DỰNG, đổi một dòng trong `.env`:
 *   DATABASE_URL="file:<đường dẫn tuyệt đối>/prisma/dev-sach.db"
 * Nghiệm thu xong thì trỏ ngược về `dev.db`. Script in sẵn hai dòng đó.
 *
 * AN TOÀN: chỉ tạo tệp MỚI. Không sửa, không xoá `dev.db`. Không đụng `.env`
 * (in ra để người tự dán — đổi nguồn dữ liệu là việc người quyết, không phải máy).
 */

import { execFileSync } from 'node:child_process';
import { existsSync, unlinkSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const GOC = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DB_SACH = resolve(GOC, 'prisma/dev-sach.db');
const DB_THAT = resolve(GOC, 'prisma/dev.db');

const THAT = process.argv.includes('--that');
const GHI_DE = process.argv.includes('--ghi-de');

const url = (p) => `file:${p}`;

/** Đọc danh sách migration để biết sẽ áp gì — dẫn nguồn thay vì nói suông. */
function dsMigration() {
  try {
    return execFileSync('ls', [resolve(GOC, 'prisma/migrations')], { encoding: 'utf8' })
      .split('\n').filter((x) => x && !x.endsWith('.toml'));
  } catch { return []; }
}

/** Đếm bảng trong một tệp CSDL. Dùng để ĐO LẠI sau khi dựng, không tin lệnh vừa chạy. */
async function demBang(duongDan) {
  const { DatabaseSync } = await import('node:sqlite');
  const db = new DatabaseSync(duongDan, { readOnly: true });
  const t = db.prepare(
    "select name from sqlite_master where type='table' and name not like 'sqlite_%' and name not like '_prisma%'",
  ).all();
  return t.length;
}

function demModelTrongSchema() {
  const src = readFileSync(resolve(GOC, 'prisma/schema.prisma'), 'utf8');
  return [...src.matchAll(/^model\s+(\w+)/gm)].length;
}

const migrations = dsMigration();
const soModel = demModelTrongSchema();

console.log('CSDL sạch để nghiệm thu\n');
console.log(`  Sẽ tạo   : prisma/dev-sach.db`);
console.log(`  Giữ nguyên: prisma/dev.db  ${existsSync(DB_THAT) ? '(còn nguyên, không đụng)' : '(không thấy)'}`);
console.log(`  Áp ${migrations.length} migration:`);
migrations.forEach((m) => console.log(`     · ${m}`));
console.log(`  Đích     : ${soModel} bảng (bằng số model trong schema.prisma)\n`);

if (!THAT) {
  console.log('(xem trước — chưa đụng gì. Dựng thật: node scripts/db-sach.mjs --that)');
  process.exit(0);
}

if (existsSync(DB_SACH)) {
  if (!GHI_DE) {
    console.log('⚠️  prisma/dev-sach.db ĐÃ CÓ.');
    console.log('   Muốn dựng lại từ đầu: thêm cờ --ghi-de');
    console.log('   (cố ý bắt khai rõ — xoá dữ liệu nghiệm thu giữa chừng là mất công đo lại)');
    process.exit(1);
  }
  unlinkSync(DB_SACH);
  console.log('· đã xoá bản cũ để dựng lại\n');
}

// `migrate deploy` chỉ ÁP migration đã có, KHÔNG sinh mới, KHÔNG hỏi reset —
// đúng thứ cần cho một CSDL trống. (`migrate dev` thì ngược lại, sẽ đòi reset.)
try {
  execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
    cwd: GOC,
    env: { ...process.env, DATABASE_URL: url(DB_SACH) },
    stdio: 'inherit',
  });
} catch (e) {
  console.error('\n❌ Áp migration THẤT BẠI. Không dùng CSDL này để nghiệm thu.');
  process.exit(1);
}

// ── ĐO LẠI, KHÔNG TIN LỆNH VỪA CHẠY (luật N1) ───────────────────────────────
const soBang = await demBang(DB_SACH);
console.log(`\nBảng trong dev-sach.db : ${soBang}`);
console.log(`Model trong schema     : ${soModel}`);

if (soBang !== soModel) {
  console.log(`\n❌ THẤT BẠI — lệch ${Math.abs(soBang - soModel)} bảng. ĐỪNG nghiệm thu trên nền này.`);
  process.exit(1);
}

console.log('\n✅ CSDL sạch dựng xong, đủ bảng, 0 dữ liệu.\n');
console.log('── Bật CSDL sạch: sửa dòng đầu tệp .env thành ──');
console.log(`DATABASE_URL="${url(DB_SACH)}"`);
console.log('\n── Nghiệm thu xong, trả về bãi thử cũ ──');
console.log(`DATABASE_URL="${url(DB_THAT)}"`);
console.log('\n(đổi .env xong phải KHỞI ĐỘNG LẠI dev server thì mới ăn)');
