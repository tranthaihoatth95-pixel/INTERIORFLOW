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
import { boChuThich } from './_chu-thich.mjs';
import path from 'node:path';
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

/** kiểu mauCo/mauThieu — file có mauCo mà thiếu mauThieu.
 *
 * 🔴 SỬA 28/08 — TRƯỚC ĐÂY soi cả CHÚ THÍCH. Luật `kinh-webkit-prefix` báo đỏ **ba tệp**
 * (`SearchProjectsInput` · `Render3DModeSkeleton` · `BeMatNoi`) chỉ vì chúng **NHẮC**
 * `backdrop-filter` trong chú thích — để giải thích vì sao chúng **KHÔNG dùng** nó.
 * Máy phạt đúng những tệp đã cân nhắc kỹ nhất.
 *
 * Cùng lớp lỗi mà `soi-foundation` họ `F-NHAN-BIA` mắc phải sáng cùng ngày ⇒ **một cỗ máy,
 * nhiều mặt tiền**: dùng chung `scripts/_chu-thich.mjs`, cấm chép hàm sang tệp thứ hai (M-26). */
function timThieu(dk) {
  const reCo = new RegExp(dk.mauCo, 'm');
  const reThieu = new RegExp(dk.mauThieu, 'm');
  const xau = [];
  for (const f of filesOf(dk)) {
    const s = boChuThich(readFileSync(f, 'utf8'));   // soi MÃ, không soi lời kể về mã
    if (reCo.test(s) && !reThieu.test(s)) xau.push(f.replace(ROOT, ''));
  }
  return xau;
}

const IN_TOI_DA = 5; // in tối đa 5 vị trí mỗi lỗi, còn lại đếm gộp

let lech = 0;
console.log('\nHỆ LUẬT THAO TÁC — soi-thao-tac ' + new Date().toISOString().slice(0, 10));
console.log('─'.repeat(100));

/** Số tệp vi phạm của mỗi luật grep — nguồn cho bánh cóc ở cuối tệp. */
const xauTheoLuat = [];

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
  const soTep = loi.reduce((n, e) => n + (e.xau?.length ?? e.hits?.length ?? 0), 0);
  xauTheoLuat.push({ id: l.id, xau: { length: soTep } });
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

/* ── BÁNH CÓC — nối máy này vào cổng chung mà không chặn đứng mọi lane ─────────────────────────
 * Hoà 28/08: *"làm cái dang dở đi, phân ra làm bù làm tiến độ."*
 * Máy này TỒN TẠI từ lâu nhưng **chưa bao giờ nằm trên đường `npm test`** — đúng gốc bệnh
 * *tạo mà không nối*. Nối thẳng lúc này là chặn mọi lane vì hai luật đang đỏ với **42 tệp**:
 *   · `outline-can-focus-visible` 33 tệp — bàn phím không thấy mình đang ở đâu
 *   · `keydown-ne-o-nhap` 9 tệp — gõ chữ trong ô là kích hoạt phím tắt
 * Cả hai là lỗi **thật**, người dùng chạm phải, nhưng sửa mù 42 tệp là đổi một lỗi lấy một lỗi.
 *
 * ⇒ Bánh cóc: **khoá trần ở số hiện tại, chỉ được siết xuống**. Máy vào được cổng chung ngay
 * hôm nay, nợ không tăng thêm được, và mỗi lần dọn thật thì hạ trần. Cấm nới lên (M-52). */
{
  const tranTep = path.join(ROOT, 'scripts/foundation-tran.json');
  if (existsSync(tranTep)) {
    const tran = JSON.parse(readFileSync(tranTep, 'utf8'));
    let vuot = 0;
    for (const e of xauTheoLuat) {
      const key = `T-${e.id}`;
      const tr = tran[key];
      if (typeof tr !== 'number') continue;
      const n = e.xau.length;
      console.log(`   bánh cóc ${key.padEnd(28)} ${String(n).padStart(3)} / trần ${tr}`);
      if (n > tr) { console.log(`   🔴 VƯỢT TRẦN ${n - tr} tệp — sửa mã, CẤM nới trần (M-52).`); vuot++; }
      else if (n < tr) console.log(`   ✅ thấp hơn trần ${tr - n} — hạ trần xuống ${n}.`);
    }
    /* Chỉ ĐỎ khi VƯỢT TRẦN, hoặc khi một luật đang đỏ mà CHƯA có trần — luật xanh thì không
     * cần trần. Bản đầu bắt mọi luật phải có trần ⇒ 15 luật xanh cũng làm cổng đỏ: một cổng
     * đòi hỏi vô lý là cổng người ta học cách ngó lơ (F-02). */
    const doMaChuaCoTran = xauTheoLuat.filter((e) => e.xau.length > 0 && typeof tran[`T-${e.id}`] !== 'number');
    for (const e of doMaChuaCoTran) console.log(`   🔴 ${e.id} đỏ ${e.xau.length} tệp mà CHƯA có trần — thêm "T-${e.id}" vào foundation-tran.json`);
    process.exit(vuot || doMaChuaCoTran.length ? 1 : 0);
  }
}
process.exit(lech ? 1 : 0);
