#!/usr/bin/env node
/**
 * scripts/soi-thao-tac.mjs — máy soi HỆ LUẬT THAO TÁC (xem thao-tac-registry.mjs).
 * Chạy: `npm run soi:thao-tac` — cùng họ soi-frontier/soi-hinh-hoc/soi-tu-dien.
 *
 * Luật loai:'grep' soi 2 chiều:
 *   🔴 điều kiện can:true mất khớp        → bằng chứng bắt buộc MẤT (regress)
 *   🔴 điều kiện CẤM có khớp              → vi phạm luật, in file:dòng + tội danh
 *   🔴 mauCo/mauThieu: file có mà thiếu   → vi phạm, in danh sách file
 * Luật loai:'mat' KHÔNG tính lệch — in BẢNG NỢ NGHIỆM THU MẮT nhóm theo tội danh [Đ6].
 * Exit 1 khi có lệch grep.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { LUAT, TOI_DANH } from './thao-tac-registry.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const EXT = new Set(['.ts', '.tsx', '.css']);
const SKIP = new Set(['node_modules', '.next', '.worktrees', '.git', 'dist', 'out']);
// Kho luật + máy soi không được tự khớp chính mình (chứa chuỗi mẫu).
const SKIP_FILES = new Set(['thao-tac-registry.mjs', 'soi-thao-tac.mjs']);

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) yield* walk(p);
    else if (EXT.has(name.slice(name.lastIndexOf('.'))) && !SKIP_FILES.has(name)) yield p;
  }
}

/** danh sách file của một điều kiện (file đơn hoặc quét dir) */
function filesOf(dk) {
  if (dk.file) {
    const p = join(ROOT, dk.file);
    return existsSync(p) ? [p] : [];
  }
  const d = join(ROOT, dk.dir);
  return existsSync(d) ? [...walk(d)] : [];
}

/** tất cả vị trí khớp `mau` — trả [{file, line}] */
function timKhop(dk) {
  const re = new RegExp(dk.mau, 'm');
  const hits = [];
  for (const f of filesOf(dk)) {
    const noiDung = readFileSync(f, 'utf8');
    if (!re.test(noiDung)) continue;
    const reLine = new RegExp(dk.mau);
    const lines = noiDung.split('\n');
    let inLine = false;
    lines.forEach((line, i) => { if (reLine.test(line)) { hits.push({ file: f.replace(ROOT, ''), line: i + 1 }); inLine = true; } });
    // mẫu nhiều dòng (không khớp dòng đơn) — vẫn ghi nhận ở mức file
    if (!inLine) hits.push({ file: f.replace(ROOT, ''), line: 0 });
  }
  return hits;
}

/** kiểu mauCo/mauThieu — file có mauCo mà thiếu mauThieu */
function timThieu(dk) {
  const reCo = new RegExp(dk.mauCo, 'm');
  const reThieu = new RegExp(dk.mauThieu, 'm');
  const xau = [];
  for (const f of filesOf(dk)) {
    const s = readFileSync(f, 'utf8');
    if (reCo.test(s) && !reThieu.test(s)) xau.push(f.replace(ROOT, ''));
  }
  return xau;
}

const IN_TOI_DA = 5; // in tối đa 5 vị trí mỗi lỗi, còn lại đếm gộp

let lech = 0;
console.log('\nHỆ LUẬT THAO TÁC — soi-thao-tac ' + new Date().toISOString().slice(0, 10));
console.log('─'.repeat(100));

// ── Khối 1: luật grep — soi 2 chiều ──────────────────────────────────────────
for (const l of LUAT) {
  if (l.loai !== 'grep') continue;
  const loi = [];
  for (const dk of l.soi) {
    if (dk.mauCo) {
      const xau = timThieu(dk);
      if (xau.length) loi.push({ kieu: 'thieu', dk, xau });
    } else if (dk.can === true) {
      if (timKhop(dk).length === 0) loi.push({ kieu: 'mat', dk });
    } else {
      const hits = timKhop(dk);
      if (hits.length) loi.push({ kieu: 'cam', dk, hits });
    }
  }
  if (!loi.length) { console.log(`  ✅ ${l.id}`); continue; }
  lech++;
  console.log(`  🔴 ${l.id} — [tội ${l.toiDanh} · ${TOI_DANH[l.toiDanh]}]`);
  console.log(`     LUẬT: ${l.luat}`);
  console.log(`     NGUỒN: ${l.nguon}`);
  for (const e of loi) {
    if (e.kieu === 'mat') console.log(`     ↳ bằng chứng bắt buộc MẤT: ${e.dk.file || e.dk.dir} thiếu /${e.dk.mau}/ — regress?`);
    if (e.kieu === 'cam') {
      console.log(`     ↳ ${e.hits.length}× vi phạm (mẫu cấm /${e.dk.mau}/):`);
      e.hits.slice(0, IN_TOI_DA).forEach((h) => console.log(`        ${h.file}${h.line ? ':' + h.line : ''}`));
      if (e.hits.length > IN_TOI_DA) console.log(`        … +${e.hits.length - IN_TOI_DA} chỗ nữa`);
    }
    if (e.kieu === 'thieu') {
      console.log(`     ↳ ${e.xau.length} file CÓ /${e.dk.mauCo}/ mà THIẾU /${e.dk.mauThieu}/:`);
      e.xau.slice(0, IN_TOI_DA).forEach((f) => console.log(`        ${f}`));
      if (e.xau.length > IN_TOI_DA) console.log(`        … +${e.xau.length - IN_TOI_DA} file nữa`);
    }
  }
}

// ── Khối 2: luật chỉ-mắt — nợ nghiệm thu, nhóm theo tội danh [Đ6] ────────────
const mat = LUAT.filter((l) => l.loai === 'mat');
console.log('─'.repeat(100));
console.log(`👁 BẢNG NỢ NGHIỆM THU MẮT — ${mat.length} luật chỉ soi được bằng mắt (không tính lệch):`);
for (const td of Object.keys(TOI_DANH)) {
  const nhom = mat.filter((l) => String(l.toiDanh) === td);
  if (!nhom.length) continue;
  console.log(`  · Tội ${td} — ${TOI_DANH[td]}:`);
  for (const l of nhom) console.log(`    👁 ${l.id} — ${l.luat}  (${l.nguon})`);
}

console.log('─'.repeat(100));
const soGrep = LUAT.filter((l) => l.loai === 'grep').length;
console.log(`🔴 ${lech} LỆCH (trên ${soGrep} luật grep) · 👁 ${mat.length} luật chờ mắt${lech ? '  ← lệch trong code app GHI BÁO CÁO cho T quyết, không nới pattern' : ''}\n`);
process.exit(lech ? 1 : 0);
