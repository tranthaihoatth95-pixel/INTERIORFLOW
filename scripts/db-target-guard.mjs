#!/usr/bin/env node
/**
 * scripts/db-target-guard.mjs — CỔNG MỤC TIÊU cho mọi lệnh có thể GHI vào cơ sở dữ liệu.
 *
 * ── VÌ SAO CÓ TỆP NÀY (sự cố F-18, 27/08) ──────────────────────────────────────────────────────
 * Tôi định chạy `prisma migrate resolve` trên BẢN SAO. Cách cách ly đã chọn:
 *     export DATABASE_URL="file:/tmp/…/thu.db"
 *     npx prisma migrate resolve --applied <tên>
 * **Prisma CLI tự nạp `.env`, và `.env` THẮNG biến vừa `export`.** Lệnh đi thẳng vào
 * `prisma/dev.db` THẬT. Phát hiện muộn ba lệnh, nhờ một lượt băm đưa vào vì lý do khác.
 * Lần đó không mất dữ liệu — nhưng đó là MAY. Cùng cơ chế với `migrate reset` là mất 38 MB.
 *
 * Bài học không phải "cẩn thận hơn". Bài học là: **`export` KHÔNG phải cách cách ly** với công cụ
 * tự nạp tệp cấu hình, và **niềm tin vào mục tiêu phải đến từ chính công cụ**, không từ ý định
 * của người gõ. Cổng này bắt điều đó thành máy, không thành lời dặn.
 *
 * ── NÓ LÀM GÌ ──────────────────────────────────────────────────────────────────────────────────
 *   ① Giải mục tiêu THẬT theo đúng thứ tự ưu tiên của Prisma — **`.env` thắng `process.env`**.
 *   ② In: đường dẫn TUYỆT ĐỐI · kích thước · sha256 TRƯỚC.
 *   ③ Đòi người gọi khai mục tiêu mong muốn qua `--expect <đường dẫn>`. **Lệch là DỪNG.**
 *      Không khai thì phải `--expect-any` — tức là ký tên vào việc mình không kiểm.
 *   ④ Chạy lệnh.
 *   ⑤ In sha256 SAU + nói rõ tệp CÓ ĐỔI hay KHÔNG. Đây là chốt chặn cuối: đổi ngoài dự kiến thì
 *      ít nhất **biết ngay**, thay vì phát hiện sau ba lệnh.
 *
 * ── DÙNG ──────────────────────────────────────────────────────────────────────────────────────
 *   node scripts/db-target-guard.mjs --expect prisma/dev.db -- npx prisma migrate status
 *   node scripts/db-target-guard.mjs --expect /tmp/thu.db  -- npx prisma migrate resolve --applied X
 *   node scripts/db-target-guard.mjs --dry-run --expect prisma/dev.db     (chỉ soi mục tiêu, không chạy)
 *
 * ⚠️ Cổng này KHÔNG cho phép `reset` / `db push` / `migrate resolve` trên DB thật. Nó chỉ làm cho
 * mục tiêu **không thể nhầm được**. Luật cấm nằm ở `docs/control/IF-CURRENT-STATE.md`.
 */

import { readFileSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const REPO = process.cwd();

/** Đọc `.env` đúng cách Prisma đọc: bóc cặp nháy bao quanh giá trị. */
function docEnvTep(tep) {
  if (!existsSync(tep)) return {};
  const ra = {};
  for (const dong of readFileSync(tep, 'utf8').split('\n')) {
    const i = dong.indexOf('=');
    if (i < 1 || dong.trimStart().startsWith('#')) continue;
    ra[dong.slice(0, i).trim()] = dong.slice(i + 1).trim().replace(/^(['"])([\s\S]*)\1$/, '$2');
  }
  return ra;
}

/**
 * Mục tiêu THẬT. Thứ tự này là điểm mấu chốt của cả tệp: **`.env` ĐỨNG TRƯỚC `process.env`**,
 * vì đó là thứ tự Prisma dùng, và cũng chính là thứ đã cắn ở F-18. Ai đọc tệp này mà đảo hai
 * dòng dưới đây cho "hợp trực giác" là dựng lại đúng cái bẫy.
 */
function mucTieuThat() {
  const tuEnv = docEnvTep(path.join(REPO, '.env')).DATABASE_URL;
  const nguon = tuEnv ? '.env' : process.env.DATABASE_URL ? 'process.env (KHÔNG có .env)' : 'không có';
  const url = tuEnv ?? process.env.DATABASE_URL ?? null;
  if (!url) return { url: null, nguon, duongDan: null };
  const duongDan = url.startsWith('file:')
    ? path.resolve(REPO, url.slice(5))
    : null; // không phải sqlite ⇒ không băm được tệp
  return { url, nguon, duongDan };
}

const bam = (p) => (existsSync(p) ? createHash('sha256').update(readFileSync(p)).digest('hex') : null);

/**
 * VÂN TAY **DỮ LIỆU** (không phải vân tay tệp).
 *
 * ⚠️ Đo được ngay lượt đầu chạy cổng này: băm cấp TỆP là **quá nhạy** với SQLite. Một lệnh
 * CHỈ ĐỌC (`migrate status`) cũng làm đổi byte — SQLite dọn trang, ghi lại tiêu đề, checkpoint
 * WAL. Đo thật: `dev.db` đổi từ `7a793e7b…` sang `e98478ca…` mà **0/25 bảng đổi nội dung**.
 *
 * Nếu cổng chỉ có băm tệp thì nó sẽ hô "TỆP ĐÃ ĐỔI" sau mỗi lệnh đọc — và một cái cổng kêu
 * nhầm liên tục là cái cổng người ta học cách bỏ qua (bài học F-02 trong sổ sai lầm). Nên phải
 * có **hai mức**: tệp đổi là *thông tin*; **dữ liệu đổi mới là chuông báo**.
 *
 * `.dump` mất ~0,2 giây cho 38 MB — đủ rẻ để chạy trước và sau mọi lệnh.
 */
function vanTayDuLieu(duongDan) {
  if (!duongDan || !existsSync(duongDan)) return null;
  const r = spawnSync('sqlite3', [duongDan, '.dump'], { encoding: 'buffer', maxBuffer: 1024 ** 3 });
  if (r.status !== 0 || !r.stdout) return null; // không có sqlite3 ⇒ khai KHÔNG ĐO ĐƯỢC, không đoán
  return createHash('sha256').update(r.stdout).digest('hex');
}

function inMucTieu(mt, nhan) {
  console.log(`\n── MỤC TIÊU CƠ SỞ DỮ LIỆU (${nhan}) ──`);
  console.log(`   nguồn cấu hình : ${mt.nguon}`);
  console.log(`   DATABASE_URL   : ${mt.url ?? '(không có)'}`);
  console.log(`   đường tuyệt đối: ${mt.duongDan ?? '(không phải tệp sqlite)'}`);
  if (mt.duongDan && existsSync(mt.duongDan)) {
    console.log(`   kích thước     : ${statSync(mt.duongDan).size.toLocaleString('vi-VN')} byte`);
    console.log(`   sha256         : ${bam(mt.duongDan)}`);
  } else if (mt.duongDan) {
    console.log('   ⚠️ tệp CHƯA TỒN TẠI — lệnh có thể tạo mới');
  }
  if (mt.nguon === '.env' && process.env.DATABASE_URL) {
    console.log('\n   🔴 CẢNH BÁO: bạn có đặt DATABASE_URL trong môi trường, NHƯNG `.env` THẮNG.');
    console.log('      Đây đúng là cơ chế đã gây sự cố F-18. `export` KHÔNG cách ly được.');
    console.log('      Muốn trỏ chỗ khác: chạy ở thư mục KHÔNG có `.env`, hoặc truyền --url tường minh.');
  }
}

const argv = process.argv.slice(2);
const iNgan = argv.indexOf('--');
const lenh = iNgan >= 0 ? argv.slice(iNgan + 1) : [];
const co = iNgan >= 0 ? argv.slice(0, iNgan) : argv;
const iExpect = co.indexOf('--expect');
const mongDoi = iExpect >= 0 ? path.resolve(REPO, co[iExpect + 1]) : null;
const chapNhanBatKy = co.includes('--expect-any');
const chayThu = co.includes('--dry-run');

const mt = mucTieuThat();
inMucTieu(mt, 'TRƯỚC');

if (!mongDoi && !chapNhanBatKy && !chayThu) {
  console.error('\n⛔ THIẾU `--expect <đường dẫn>`. Cổng này tồn tại để bạn KHAI TRƯỚC mục tiêu,');
  console.error('   rồi máy đối chiếu. Không khai thì không có gì để đối chiếu — và đó đúng là');
  console.error('   trạng thái đã gây sự cố F-18. Cố tình bỏ qua: dùng `--expect-any`.');
  process.exit(2);
}

if (mongDoi && mt.duongDan !== mongDoi) {
  console.error('\n⛔ MỤC TIÊU LỆCH — DỪNG, KHÔNG CHẠY LỆNH.');
  console.error(`   bạn mong : ${mongDoi}`);
  console.error(`   thật sự  : ${mt.duongDan ?? '(không phải tệp sqlite)'}`);
  console.error('   Đây chính xác là ca F-18. Cổng làm đúng việc của nó.');
  process.exit(1);
}

if (chayThu || lenh.length === 0) {
  console.log('\n(--dry-run hoặc không có lệnh sau `--`: chỉ soi mục tiêu, không chạy gì)\n');
  process.exit(0);
}

const truoc = mt.duongDan ? bam(mt.duongDan) : null;
const duLieuTruoc = vanTayDuLieu(mt.duongDan);
console.log(`\n── CHẠY: ${lenh.join(' ')} ──\n`);
const kq = spawnSync(lenh[0], lenh.slice(1), { stdio: 'inherit', shell: false });

const sau = mt.duongDan ? bam(mt.duongDan) : null;
const duLieuSau = vanTayDuLieu(mt.duongDan);
console.log('\n── SAU KHI CHẠY ──');
console.log(`   băm TỆP     : ${(truoc ?? '—').slice(0, 16)} → ${(sau ?? '—').slice(0, 16)}  ${truoc === sau ? '(không đổi)' : '(đổi)'}`);
if (duLieuTruoc === null) {
  console.log('   vân tay DỮ LIỆU: ⚪ KHÔNG ĐO ĐƯỢC (thiếu `sqlite3` hoặc không phải sqlite)');
} else {
  console.log(`   vân tay DỮ LIỆU: ${duLieuTruoc.slice(0, 16)} → ${(duLieuSau ?? '—').slice(0, 16)}`);
}

if (duLieuTruoc !== null && duLieuTruoc === duLieuSau) {
  console.log('   ✅ DỮ LIỆU KHÔNG ĐỔI.' + (truoc !== sau
    ? ' (Tệp đổi byte là bình thường: SQLite dọn trang kể cả khi chỉ đọc.)'
    : ''));
} else if (duLieuTruoc !== null) {
  console.log('   🔴 DỮ LIỆU ĐÃ ĐỔI — nếu ngoài dự kiến, KHÔI PHỤC TỪ BẢN SAO LƯU NGAY.');
} else if (truoc !== sau) {
  console.log('   ⚠️ Tệp đổi byte nhưng không đo được dữ liệu — coi như CHƯA BIẾT, đừng coi là an toàn.');
}
console.log(`   mã thoát lệnh: ${kq.status}\n`);
process.exit(kq.status ?? 0);
