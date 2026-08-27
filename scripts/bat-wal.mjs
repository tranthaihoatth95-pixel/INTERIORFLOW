/**
 * scripts/bat-wal.mjs — bật `journal_mode=WAL` cho tệp SQLite của IF.
 *
 * ── VÌ SAO ─────────────────────────────────────────────────────────────────────────────────────
 * Đo 27/08 trên `prisma/dev.db`: `journal_mode = delete`. Ở chế độ đó, **mỗi lần ghi khoá độc
 * quyền toàn bộ tệp** — người đọc bị chặn. Mà `getSession()` ghi `lastSeenAt` ở gần như mọi
 * request, nên trong một phiên dùng bình thường, người đọc và người ghi chặn nhau liên tục.
 * Cộng `busy_timeout = 0` (chờ vô hạn) ⇒ dev server **kẹt cứng sau ~6 phút**, mọi route treo,
 * không lỗi, không timeout. Đây là P0 `L2-01` mà lane UX đo được.
 *
 * WAL: người đọc **không chặn** người ghi và ngược lại. Đây là chế độ đúng cho một ứng dụng
 * local-first có một tiến trình vừa đọc vừa ghi liên tục.
 *
 * ── ĐÂY LÀ THAY ĐỔI BỀN TRÊN TỆP DB, NÊN ──────────────────────────────────────────────────────
 * ① chạy qua cổng mục tiêu (`scripts/db-target-guard.mjs`) — cấm chạy trần;
 * ② sao lưu trước;
 * ③ WAL sinh thêm `dev.db-wal` và `dev.db-shm` — **mọi đường sao lưu phải chép cả ba tệp**.
 *    `scripts/proof/_db-tam.mjs` và `scripts/backup-offsite.mjs` đã chép cả `-wal`/`-shm`.
 * ④ Lùi: `PRAGMA journal_mode=DELETE;` — cùng một lệnh, đổi giá trị. Không mất dữ liệu.
 *
 * Chạy:
 *   node scripts/db-target-guard.mjs --expect prisma/dev.db -- node scripts/bat-wal.mjs --bat
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const BAT = process.argv.includes('--bat');
const dong = readFileSync('.env', 'utf8').split('\n').find((l) => l.startsWith('DATABASE_URL'));
const url = dong.slice(dong.indexOf('=') + 1).trim().replace(/^(['"])([\s\S]*)\1$/, '$2');
const db = path.resolve(process.cwd(), url.replace(/^file:/, ''));
if (!existsSync(db)) throw new Error(`Không thấy DB: ${db}`);

const pragma = (q) => execFileSync('sqlite3', [db, q], { encoding: 'utf8' }).trim();

console.log(`DB      : ${db}`);
console.log(`journal : ${pragma('PRAGMA journal_mode;')}`);
console.log(`busy_to : ${pragma('PRAGMA busy_timeout;')}`);

if (!BAT) {
  console.log('\n(chưa đổi gì — thêm `--bat` để thi hành)');
  process.exit(0);
}

const truoc = pragma('PRAGMA journal_mode;');
const sau = pragma('PRAGMA journal_mode=WAL;');
console.log(`\njournal_mode: ${truoc} → ${sau}`);
if (sau !== 'wal') {
  console.error('🔴 KHÔNG đặt được WAL — kiểm quyền ghi và tiến trình đang giữ khoá.');
  process.exit(1);
}
console.log(`integrity_check: ${pragma('PRAGMA integrity_check;')}`);
console.log('✅ WAL đã bật. Nhớ: bản sao lưu từ nay phải chép cả `-wal` và `-shm`.');
