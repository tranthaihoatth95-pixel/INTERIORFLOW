#!/usr/bin/env node
/**
 * scripts/soi-contract.mjs — máy soi SỔ DÂY FeatureContract (xem contract-registry.mjs).
 * Chạy: `npm run soi:contract` — cùng họ soi-frontier/soi-thao-tac.
 *
 * 2 CHIỀU + 1 SỔ:
 *   🔴 REGRESS   — entry nào `loi` mất khớp (engine bị xoá/đổi tên mà sổ vẫn khai)
 *   🔴 MẤT DÂY   — entry `co-day` mà đếm caller = 0 (dây từng có nay đứt)
 *   🔴 SỔ QUÊN   — entry `cho-day` mà caller ≥ 1 (kho đã được mở mà sổ chưa flip → in gợi ý)
 *   🟡 KHO CHỜ DÂY — `cho-day` đúng 0 caller: bảng xếp theo đòn bẩy (thứ tự trong registry),
 *      KHÔNG tính lệch — đây là hàng đợi nối dây cho phiếu sau.
 *
 * Caller "thật" = file khớp `day.mau` trong `day.dirs`, loại trừ: module lõi của chính entry ·
 * *.test.* / *.spec.* · các mảnh `day.loaiTru`. Exit 1 CHỈ khi có 🔴.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { CONTRACTS } from './contract-registry.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const EXT = new Set(['.ts', '.tsx', '.mjs', '.prisma', '.css']);
const SKIP = new Set(['node_modules', '.next', '.worktrees', '.git', 'dist', 'out']);
// Sổ và máy soi không được tự khớp chính mình (chứa chuỗi mẫu).
const SKIP_FILES = new Set(['contract-registry.mjs', 'soi-contract.mjs']);

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) yield* walk(p);
    else if (EXT.has(name.slice(name.lastIndexOf('.'))) && !SKIP_FILES.has(name)) yield p;
  }
}

/** điều kiện LÕI có đang khớp không (file đơn hoặc quét dir) */
function loiOk(loi) {
  const re = new RegExp(loi.mau, 'm');
  if (loi.file) {
    const p = join(ROOT, loi.file);
    return existsSync(p) && re.test(readFileSync(p, 'utf8'));
  }
  const d = join(ROOT, loi.dir);
  if (!existsSync(d)) return false;
  for (const f of walk(d)) if (re.test(readFileSync(f, 'utf8'))) return true;
  return false;
}

/** đếm DÂY thật: file khớp trong day.dirs, ngoài module lõi + ngoài test + ngoài loaiTru */
function demDay(entry) {
  const { loi, day } = entry;
  const re = new RegExp(day.mau, 'm');
  const goc = loi.file ? [loi.file] : [loi.dir + '/'];
  const loaiTru = day.loaiTru ?? [];
  const hits = [];
  for (const dir of day.dirs) {
    const d = join(ROOT, dir);
    if (!existsSync(d)) continue;
    for (const f of walk(d)) {
      const rel = relative(ROOT, f);
      if (/\.(test|spec)\./.test(rel)) continue;
      if (goc.some((g) => rel === g || rel.startsWith(g))) continue;
      if (loaiTru.some((x) => rel.includes(x))) continue;
      if (re.test(readFileSync(f, 'utf8'))) hits.push(rel);
    }
  }
  return hits;
}

const regress = [], matDay = [], soQuen = [], choDay = [], ok = [];
for (const e of CONTRACTS) {
  const coLoi = loiOk(e.loi);
  const hits = coLoi ? demDay(e) : [];
  if (!coLoi) regress.push({ e, hits });
  else if (e.trangThai === 'co-day' && hits.length === 0) matDay.push({ e, hits });
  else if (e.trangThai === 'cho-day' && hits.length >= 1) soQuen.push({ e, hits });
  else if (e.trangThai === 'cho-day') choDay.push({ e, hits });
  else ok.push({ e, hits });
}

console.log('\nSỔ DÂY FEATURECONTRACT — soi-contract ' + new Date().toISOString().slice(0, 10));
console.log('─'.repeat(100));

console.log('\n① 🔴 REGRESS — khai lõi mà bằng chứng lõi MẤT:' + (regress.length ? '' : ' (không có)'));
for (const { e } of regress)
  console.log(`  🔴 ${e.id} — lõi "${e.loi.mau}" không còn khớp ${e.loi.file ?? e.loi.dir}`);

console.log('\n② 🔴 MẤT DÂY — khai co-day mà 0 caller thật:' + (matDay.length ? '' : ' (không có)'));
for (const { e } of matDay)
  console.log(`  🔴 ${e.id} — "${e.day.mau}" 0 khớp trong ${e.day.dirs.join(', ')}\n     ↳ ăn theo đã khai: ${e.anTheo}`);

console.log('\n③ 🔴 SỔ QUÊN — khai cho-day mà kho ĐÃ MỞ (có caller):' + (soQuen.length ? '' : ' (không có)'));
for (const { e, hits } of soQuen)
  console.log(`  🔴 ${e.id} — ${hits.length} caller: ${hits.slice(0, 3).join(' · ')}${hits.length > 3 ? ' …' : ''}\n     ↳ FLIP: đổi trangThai 'cho-day' → 'co-day' trong contract-registry.mjs`);

console.log('\n🟡 KHO CHỜ DÂY — lõi sống, 0 caller (hàng đợi nối dây, xếp theo đòn bẩy, KHÔNG tính lệch):'
  + (choDay.length ? '' : ' (trống — mọi kho khai đều có dây)'));
for (const { e } of choDay)
  console.log(`  🟡 ${e.id} — ${e.ten.split('—')[0].trim()}\n     ↳ chờ ai ăn theo: ${e.anTheo}`);

console.log('\n🔗 CÓ DÂY — hợp đồng sống, caller thật:');
const w = ok.length ? Math.max(...ok.map(({ e }) => e.id.length)) : 0;
for (const { e, hits } of ok) console.log(`  ✅ ${e.id.padEnd(w)}  ${hits.length} caller`);

const red = regress.length + matDay.length + soQuen.length;
console.log('─'.repeat(100));
console.log(`CONTRACT — 🔗 ${ok.length} có dây · 🟡 ${choDay.length} chờ dây · 🔴 ${red} LỆCH${red ? '  ← xử lệch TRƯỚC khi bàn việc mới' : ''}\n`);
process.exit(red ? 1 : 0);
