/**
 * scripts/proof/db-target-guard.mjs — chứng minh CỔNG MỤC TIÊU (`scripts/db-target-guard.mjs`).
 *
 * Cổng này sinh ra từ sự cố F-18 (Prisma nạp `.env`, `.env` thắng `export`, lệnh ghi nhầm đích).
 * Một cái cổng không được chứng minh thì chỉ là một lời hứa dài — nên nó phải có bài kiểm riêng,
 * và bài kiểm phải **dựng lại đúng kịch bản đã xảy ra**, không phải một kịch bản giống giống.
 *
 * ⚠️ CỔNG HARNESS (F-15) ở CA 0. ⚠️ Luật F-17: phải có ca **mong THẤY**, không chỉ toàn ca chặn.
 * ⛔ Không lệnh nào ở đây GHI vào `prisma/dev.db` — chỉ `migrate status` (chỉ đọc), và chính cổng
 *    kiểm chứng điều đó bằng vân tay dữ liệu trước/sau.
 */

import { spawnSync, execFileSync } from 'node:child_process';
import { copyFileSync, rmSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const REPO = process.cwd();
const GUARD = path.join(REPO, 'scripts', 'db-target-guard.mjs');
const THAT = path.join(REPO, 'prisma', 'dev.db');
const BANSAO = '/tmp/if-guard-proof.db';
const ket = [];

function ca(ten, mong, got, ghiChu = '') {
  const dat = JSON.stringify(mong) === JSON.stringify(got);
  ket.push({ ten, dat });
  console.log(`${dat ? '  ok  ' : ' KHÔNG '} ${ten} — mong ${JSON.stringify(mong)}, nhận ${JSON.stringify(got)}`);
  if (!dat && ghiChu) console.log(`         ${ghiChu}`);
  return dat;
}

const chay = (args, env = {}) =>
  spawnSync(process.execPath, [GUARD, ...args], { encoding: 'utf8', env: { ...process.env, ...env } });

const banDuLieu = (p) =>
  createHash('sha256').update(execFileSync('sqlite3', [p, '.dump'], { encoding: 'buffer', maxBuffer: 1024 ** 3 })).digest('hex');

// ── CA 0 · CỔNG HARNESS ─────────────────────────────────────────────────────
// Đòi: cổng tồn tại, CHẠY được, và **cư xử đúng** ở một ca không tầm thường (thiếu --expect phải
// thoát mã 2). Một tệp rỗng hay một stub in-rồi-thoát-0 sẽ chết ngay tại đây.
{
  const r = chay(['--', 'true']);
  const ok = existsSync(GUARD) && r.status === 2 && /THIẾU `--expect/.test(r.stderr);
  ca('CA 0 · HARNESS: cổng tồn tại, chạy được, và từ chối đúng khi thiếu --expect (mã 2)', true, ok,
    `mã ${r.status} · stderr: ${(r.stderr || '').slice(0, 120)}`);
  if (!ok) { console.error('\n⛔ HARNESS ĐỎ — dừng.'); process.exit(1); }
}

// ── CA 1-3 · DỰNG LẠI ĐÚNG F-18 ─────────────────────────────────────────────
copyFileSync(THAT, BANSAO);
{
  // Đây là câu lệnh đã gây sự cố, nguyên văn cơ chế: export trỏ bản sao, `.env` trỏ DB thật.
  const r = chay(['--expect', BANSAO, '--', 'npx', 'prisma', 'migrate', 'status'],
    { DATABASE_URL: `file:${BANSAO}` });
  ca('CA 1 · F-18 dựng lại: `export` trỏ bản sao nhưng `.env` thắng ⇒ cổng CHẶN (mã 1)', 1, r.status);
  ca('CA 2 · và nói rõ mong gì / thật sự là gì', true,
    /bạn mong/.test(r.stderr) && /thật sự/.test(r.stderr) && r.stderr.includes('prisma/dev.db'));
  ca('CA 3 · và cảnh báo đích danh cơ chế `.env` thắng `export`', true,
    /`\.env` THẮNG/.test(r.stdout) && /F-18/.test(r.stdout));
}

// ── CA 4 · ĐƯỜNG ĐÚNG (mong THẤY) ───────────────────────────────────────────
{
  const truoc = banDuLieu(THAT);
  const r = chay(['--expect', 'prisma/dev.db', '--', 'npx', 'prisma', 'migrate', 'status']);
  ca('CA 4 · **mong THẤY** — khai đúng mục tiêu ⇒ lệnh CHẠY, thoát 0', 0, r.status);
  ca('CA 5 · in đường TUYỆT ĐỐI của mục tiêu, không phải chuỗi cấu hình', true,
    r.stdout.includes(THAT));
  ca('CA 6 · in vân tay DỮ LIỆU trước và sau', true, /vân tay DỮ LIỆU/.test(r.stdout));
  ca('CA 7 · kết luận đúng: lệnh chỉ-đọc ⇒ DỮ LIỆU KHÔNG ĐỔI', true,
    /✅ DỮ LIỆU KHÔNG ĐỔI/.test(r.stdout));
  ca('CA 8 · và dữ liệu thật sự không đổi (kiểm độc lập, không tin lời cổng)', truoc, banDuLieu(THAT));
}

// ── CA 9 · HAI MỨC: tệp đổi ≠ dữ liệu đổi ───────────────────────────────────
// Đây là khiếm khuyết đã đo được của bản cổng ĐẦU TIÊN: nó chỉ băm cấp TỆP, mà SQLite đổi byte
// cả khi chỉ đọc (đo thật: `7a793e7b…` → `e98478ca…` với 0/25 bảng đổi nội dung). Cổng kêu nhầm
// liên tục là cổng người ta học cách bỏ qua.
{
  const nguon = readFileSync(GUARD, 'utf8');
  ca('CA 9 · cổng phân biệt HAI MỨC — băm tệp (thông tin) vs vân tay dữ liệu (chuông báo)', true,
    /vanTayDuLieu/.test(nguon) && /SQLite dọn trang/.test(nguon));
  ca('CA 10 · thiếu `sqlite3` thì khai KHÔNG ĐO ĐƯỢC, không im lặng coi là an toàn', true,
    /KHÔNG ĐO ĐƯỢC/.test(nguon) && /đừng coi là an toàn/.test(nguon));
}

// ── CA 11 · --expect-any là lối thoát CÓ KÝ TÊN, không phải mặc định ────────
{
  const r = chay(['--expect-any', '--', 'npx', 'prisma', 'migrate', 'status']);
  ca('CA 11 · `--expect-any` chạy được (lối thoát tồn tại)', 0, r.status);
  const r2 = chay(['--', 'npx', 'prisma', 'migrate', 'status']);
  ca('CA 12 · nhưng KHÔNG khai gì thì vẫn chặn — bỏ qua phải là hành động CÓ Ý', 2, r2.status);
}

// ── CA 13 · --dry-run: soi mà không chạy ────────────────────────────────────
{
  const r = chay(['--dry-run', '--expect', 'prisma/dev.db']);
  ca('CA 13 · `--dry-run` soi mục tiêu, thoát 0, không chạy gì', 0, r.status);
  ca('CA 14 · và vẫn in đủ đường tuyệt đối + sha256 để đối chiếu bằng mắt', true,
    r.stdout.includes(THAT) && /sha256/.test(r.stdout));
}

rmSync(BANSAO, { force: true });
const fail = ket.filter((k) => !k.dat);
console.log(`\n${ket.length - fail.length}/${ket.length} ĐẠT`);
process.exit(fail.length ? 1 : 0);
