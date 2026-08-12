#!/usr/bin/env node
/**
 * backup-offsite.mjs — [marker: backup-offsite] sao lưu dev.db + uploads/ RA NGOÀI máy.
 *
 * VÌ SAO: toàn bộ dữ liệu studio (dev.db + uploads) đang nằm trên MỘT đĩa —
 * cháy đĩa là mất sạch. Script này đẩy một bản sao sang đích thứ hai
 * (ổ rời /Volumes/... hoặc thư mục iCloud/Drive được đồng bộ).
 *
 * CÁCH DÙNG:
 *   IF_BACKUP_DIR=/Volumes/OFFSITE npm run backup:offsite
 *   node scripts/backup-offsite.mjs /Volumes/OFFSITE          ← argv thắng env
 *   IF_BACKUP_KEEP=14 ... (mặc định giữ 7 bản mới nhất, bản cũ hơn bị xoá)
 *
 * AN TOÀN (luật 00-CHOT "LUẬT VẬN HÀNH"):
 *   - dev.db chỉ bị ĐỌC qua `sqlite3 .backup` (an toàn khi app đang chạy,
 *     KHÔNG dùng cp — cp giữa lúc ghi là ra file rách).
 *   - Không đụng gì trong repo. Chỉ ghi vào <đích>/if-backup/.
 *   - Đích chưa gắn / không ghi được → thoát mã 1, nói rõ, không im lặng.
 */

import { execFileSync } from 'node:child_process';
import {
  existsSync, mkdirSync, rmSync, writeFileSync, statSync, readdirSync,
} from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const GOC = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DB = resolve(GOC, 'prisma/dev.db');
const UPLOADS = resolve(GOC, 'uploads');
const KEEP = Math.max(1, parseInt(process.env.IF_BACKUP_KEEP || '7', 10) || 7);

function chet(ly_do) {
  console.error(`✗ backup-offsite DỪNG: ${ly_do}`);
  process.exit(1);
}

// ---- 1. Xác định đích -------------------------------------------------------
const thoRaw = process.argv[2] || process.env.IF_BACKUP_DIR;
if (!thoRaw) {
  chet('chưa chỉ đích. Đặt IF_BACKUP_DIR=/Volumes/<ổ> hoặc truyền argv: node scripts/backup-offsite.mjs <đích>');
}
const DICH_GOC = resolve(thoRaw.replace(/^~(?=\/|$)/, os.homedir()));
if (!existsSync(DICH_GOC)) {
  chet(`đích "${DICH_GOC}" không tồn tại — ổ chưa gắn? Gắn ổ rồi chạy lại.`);
}
const KHO = join(DICH_GOC, 'if-backup');
try {
  mkdirSync(KHO, { recursive: true });
  const thu = join(KHO, `.ghi-thu-${process.pid}`);
  writeFileSync(thu, 'ok');
  rmSync(thu);
} catch (e) {
  chet(`không ghi được vào "${KHO}" (${e.code || e.message}). Kiểm quyền/ổ chỉ-đọc.`);
}

// ---- 2. Kiểm nguồn ----------------------------------------------------------
if (!existsSync(DB)) chet(`không thấy CSDL nguồn ${DB}`);
if (!existsSync(UPLOADS)) chet(`không thấy thư mục uploads ${UPLOADS}`);

// ---- 3. Tạo thư mục bản mới -------------------------------------------------
const bay = new Date();
const p2 = (n) => String(n).padStart(2, '0');
let ten = `${bay.getFullYear()}-${p2(bay.getMonth() + 1)}-${p2(bay.getDate())}-${p2(bay.getHours())}${p2(bay.getMinutes())}`;
if (existsSync(join(KHO, ten))) ten += `-${p2(bay.getSeconds())}`; // 2 lần cùng phút vẫn ra 2 bản
const BAN = join(KHO, ten);
mkdirSync(BAN, { recursive: true });

// Danh sách bản cũ (trước khi tạo bản này) — để tìm --link-dest và để xoay vòng.
const banCu = readdirSync(KHO, { withFileTypes: true })
  .filter((d) => d.isDirectory() && /^\d{4}-\d{2}-\d{2}-\d{4}/.test(d.name) && d.name !== ten)
  .map((d) => d.name)
  .sort(); // tên = thời gian nên sort chuỗi là sort thời gian

console.log(`→ Đích: ${BAN}  (giữ ${KEEP} bản mới nhất)`);

// ---- 4. sqlite3 .backup (KHÔNG cp) -----------------------------------------
const dbDich = join(BAN, 'dev.db');
try {
  execFileSync('sqlite3', [DB, `.backup '${dbDich}'`], { stdio: 'inherit' });
} catch {
  rmSync(BAN, { recursive: true, force: true });
  chet('sqlite3 .backup thất bại — bản dở đã xoá, kho backup cũ còn nguyên.');
}
console.log(`✓ dev.db → ${dbDich} (${(statSync(dbDich).size / 1048576).toFixed(1)} MB)`);

// ---- 5. integrity_check trên BẢN SAO ---------------------------------------
const integrity = execFileSync('sqlite3', [dbDich, 'PRAGMA integrity_check;'], { encoding: 'utf8' }).trim();
if (integrity !== 'ok') {
  rmSync(BAN, { recursive: true, force: true });
  chet(`integrity_check trên bản sao KHÔNG ok:\n${integrity}`);
}
console.log('✓ integrity_check: ok');

// ---- 6. rsync uploads/ (--link-dest tiết kiệm nếu có bản trước) -------------
const banTruoc = banCu.length ? banCu[banCu.length - 1] : null;
const rsyncArgs = ['-a', '--delete'];
if (banTruoc && existsSync(join(KHO, banTruoc, 'uploads'))) {
  rsyncArgs.push(`--link-dest=${join(KHO, banTruoc, 'uploads')}`);
  console.log(`→ rsync dùng --link-dest bản trước (${banTruoc}): file không đổi chỉ hardlink, không chép lại.`);
}
rsyncArgs.push(`${UPLOADS}/`, `${join(BAN, 'uploads')}/`);
try {
  execFileSync('rsync', rsyncArgs, { stdio: 'inherit' });
} catch {
  rmSync(BAN, { recursive: true, force: true });
  chet('rsync uploads thất bại — bản dở đã xoá.');
}

// ---- 7. manifest.json -------------------------------------------------------
const soFile = parseInt(execFileSync('sh', ['-c', `find '${join(BAN, 'uploads')}' -type f | wc -l`], { encoding: 'utf8' }), 10);
const dungLuong = execFileSync('du', ['-sk', BAN], { encoding: 'utf8' }).split('\t')[0].trim();
const manifest = {
  marker: 'backup-offsite',
  luc: bay.toISOString(),
  may: os.hostname(),
  nguon: { db: DB, uploads: UPLOADS },
  db_bytes: statSync(dbDich).size,
  uploads_so_file: soFile,
  // du của RIÊNG bản này — hardlink bị đếm đủ, nên KHÔNG phải "dung lượng chiếm thêm".
  // Có link_dest thì phần chiếm thêm thật ≈ dev.db + các file uploads MỚI/ĐỔI.
  tong_kb_ban: parseInt(dungLuong, 10),
  integrity_check: integrity,
  link_dest: banTruoc || null,
};
writeFileSync(join(BAN, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`✓ uploads: ${soFile} file · cỡ bản ${(parseInt(dungLuong, 10) / 1024).toFixed(1)} MB${banTruoc ? ' (file không đổi là hardlink với bản trước — không tốn thêm chỗ)' : ''}`);

// ---- 8. Xoay vòng: giữ KEEP bản mới nhất ------------------------------------
const tatCa = [...banCu, ten].sort();
const xoa = tatCa.slice(0, Math.max(0, tatCa.length - KEEP));
for (const cu of xoa) {
  rmSync(join(KHO, cu), { recursive: true, force: true });
  console.log(`✓ xoay vòng: xoá bản cũ ${cu}`);
}
console.log(`✓ XONG. Kho ${KHO} hiện có ${tatCa.length - xoa.length} bản.`);
