#!/usr/bin/env node
/**
 * scripts/soi-frontier.mjs — máy kiểm SỔ FRONTIER SỐNG (xem frontier-registry.mjs).
 * Chạy: `npm run soi:frontier` — ĐẦU MỖI PHIÊN, thay cho việc tin trí nhớ/sổ giấy.
 *
 * Báo đỏ 2 chiều:
 *   🔴 khai 'xong' mà bằng chứng mất  → regress hoặc khai láo
 *   🔴 khai 'chua' mà bằng chứng ĐỦ   → code có rồi mà sổ quên → cập nhật registry + nối dây
 * Exit 1 khi có đỏ — gắn được vào CI/pre-push nếu muốn.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { FRONTIER } from './frontier-registry.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const EXT = new Set(['.ts', '.tsx', '.mjs', '.prisma']);
const SKIP = new Set(['node_modules', '.next', '.worktrees', '.git', 'dist', 'out']);
// Sổ không được tự khớp chính mình (registry chứa chuỗi mẫu của tương lai).
const SKIP_FILES = new Set(['frontier-registry.mjs', 'soi-frontier.mjs']);

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) yield* walk(p);
    else if (EXT.has(name.slice(name.lastIndexOf('.'))) && !SKIP_FILES.has(name)) yield p;
  }
}

/** một điều kiện bằng chứng có ĐANG khớp không (chưa xét can) */
function matches(bc) {
  const re = new RegExp(bc.mau, 'm');
  if (bc.file) {
    const p = join(ROOT, bc.file);
    if (!existsSync(p)) return false;
    return re.test(readFileSync(p, 'utf8'));
  }
  const d = join(ROOT, bc.dir);
  if (!existsSync(d)) return false;
  for (const f of walk(d)) if (re.test(readFileSync(f, 'utf8'))) return true;
  return false;
}

/** trạng-thái-XONG có đang đúng trên code không */
function doneHolds(item) {
  return item.bangChung.every((bc) => (bc.can === false ? !matches(bc) : matches(bc)));
}

let red = 0;
const rows = [];
for (const it of FRONTIER) {
  const holds = doneHolds(it);
  let mark, note;
  const done = it.trangThai === 'xong' || it.trangThai === 'xong-mat';
  // 22/08 — BẬC 'engine' (Hoà đặt sau audit kiến trúc: THƯ MỤC TỒN TẠI ≠ SẢN PHẨM TỒN TẠI).
  // Nghĩa: engine CÓ THẬT, test có thể xanh — nhưng KHÔNG có đường chạy tới người dùng.
  // Nó KHÔNG phải 'xong' (nói dối về sản phẩm) và cũng KHÔNG phải 'chua' (xoá công đã làm).
  // Ai gác bậc này: `soi-cam-dien.mjs` (đồ thị import thật, bỏ type-only) — không phải máy này.
  if (it.trangThai === 'engine') {
    mark = holds ? '🧩' : '🔴';
    note = holds ? 'ENGINE CÓ — CHƯA tới người dùng (soi:cam-dien gác)' : 'khai engine mà bằng chứng MẤT';
    if (!holds) red++;
  }
  else if (it.trangThai === 'xong-mat' && holds) { mark = '👁'; note = 'đã qua mắt Hoà'; }
  else if (it.trangThai === 'xong' && holds) { mark = '✅'; note = 'xong-MÁY (chưa qua mắt Hoà)'; }
  else if (it.trangThai === 'chua' && !holds) { mark = '⬜'; note = 'chưa làm (đúng sổ)'; }
  else if (done && !holds) { mark = '🔴'; note = 'KHAI XONG mà bằng chứng MẤT — regress?'; red++; }
  else { mark = '🔴'; note = 'CODE CÓ RỒI mà sổ ghi chưa — cập nhật registry + nối dây'; red++; }
  rows.push({ mark, dot: it.dot, id: it.id, he: it.he, ten: it.ten, note });
}

rows.sort((a, b) => a.dot - b.dot || a.id.localeCompare(b.id));
const w = Math.max(...rows.map((r) => r.id.length));
console.log('\nSỔ FRONTIER SỐNG — soi-frontier ' + new Date().toISOString().slice(0, 10));
console.log('─'.repeat(100));
let lastDot = -1;
for (const r of rows) {
  if (r.dot !== lastDot) { console.log(`\n· ĐỢT ${r.dot === 0 ? '0 (đã xong — canh regress)' : r.dot}`); lastDot = r.dot; }
  console.log(`  ${r.mark} ${r.id.padEnd(w)}  [${r.he}] ${r.ten}${r.mark === '🔴' ? `\n     ↳ ${r.note}` : ''}`);
}
const mayOnly = rows.filter((r) => r.mark === '✅').length;
const mat = rows.filter((r) => r.mark === '👁').length;
const todo = rows.filter((r) => r.mark === '⬜').length;
console.log('─'.repeat(100));
const byVai = { mvp: [0, 0], day: [0, 0], do: [0, 0] }; // [xong, tổng]
for (const it of FRONTIER) {
  const v = byVai[it.vai || 'do'];
  v[1]++;
  if (it.trangThai === 'xong' || it.trangThai === 'xong-mat') v[0]++;
}
const pct = (v) => v[1] ? Math.round((v[0] / v[1]) * 100) : 0;
console.log(`VAI — ⭐MVP ${byVai.mvp[0]}/${byVai.mvp[1]} (${pct(byVai.mvp)}%) · 🔗Kết nối ${byVai.day[0]}/${byVai.day[1]} (${pct(byVai.day)}%) · 🧰Đỡ ${byVai.do[0]}/${byVai.do[1]} (${pct(byVai.do)}%)`);
if (pct(byVai.mvp) < pct(byVai.do)) console.log('⚠️  MVP đang ĐÓI hơn support — lệch trọng tâm (anti-pattern #3), đợt kế ưu tiên entry ⭐');
// GROUP-BY GỢI Ý (12/08 — Hoà: máy tự phát hiện nhóm cùng thuộc tính → đề xuất gộp phiếu /
// dùng chung engine lõi; máy chỉ GỢI theo trục hệ×vai, đẳng cấu ngữ nghĩa do T phán §9)
const clusters = {};
for (const it of FRONTIER) {
  if (it.trangThai !== 'chua') continue;
  const k = `${it.he} · ${it.vai || 'do'}`;
  (clusters[k] ||= []).push(it.id);
}
const goiY = Object.entries(clusters).filter(([, ids]) => ids.length >= 3);
if (goiY.length) {
  console.log('💡 GROUP-BY GỢI Ý (≥3 việc chờ cùng hệ×vai → xét 1 phiếu chung / chung engine lõi):');
  for (const [k, ids] of goiY) console.log(`   ${k}: ${ids.join(' · ')}`);
}
const engineOnly = rows.filter((r) => r.mark === '🧩').length;
console.log(`👁 ${mat} qua mắt Hoà · ✅ ${mayOnly} xong-MÁY (NỢ NGHIỆM THU MẮT) · 🧩 ${engineOnly} ENGINE-CHƯA-TỚI-NGƯỜI-DÙNG · ⬜ ${todo} chờ · 🔴 ${red} LỆCH${red ? '  ← xử lệch TRƯỚC khi bàn việc mới' : ''}`);
if (engineOnly) console.log('   ⓘ 🧩 KHÔNG tính là xong: engine chạy được nhưng chưa có đường tới người dùng (soi:cam-dien gác bậc này).');
console.log('');
process.exit(red ? 1 : 0);
