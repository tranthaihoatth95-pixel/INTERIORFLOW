#!/usr/bin/env node
/**
 * soi-that.mjs — ĐỐI CHIẾU 57 SPEC ↔ CODE THẬT. Chạy TRƯỚC khi soạn bất kỳ phiếu nào.
 *
 * VÌ SAO CÓ TỆP NÀY (08/08) — Hoà hỏi thẳng: "cái lỗi gì mà lặp lại hoài vậy, không khám à?"
 *
 * Đúng. Trong MỘT đêm, TỔNG giao việc-đã-xong BỐN lần:
 *   ① "27 chỗ trần 5 sheet"   → thật ra 2 comment, MAX_SHEETS gỡ từ 04/08
 *   ② "10 mock còn lại"        → thật ra 60
 *   ③ "114 lệnh dựng ❌"       → tầng ③ đủ 8/8, tầng ① đủ 12/12, nằm sẵn trong build-ops.ts
 *   ④ "xây camera tham số"     → 5 mảnh đã xong CÓ TEST (SPEC-DUNG-CAMERA §0.2 liệt kê đủ)
 *
 * GỐC BỆNH — không phải bốn lỗi lẻ, mà MỘT lỗ hổng quy trình:
 *   Sổ GAP-IF ghi ❌  ·  SPEC ghi "đã có, chỉ thiếu dây nối"  ·  KHÔNG AI ĐỐI CHIẾU
 * Sổ là ảnh chụp cũ (§0ab). Spec là hợp đồng. Code là sự thật.
 * Đọc sổ mà không đọc spec ⇒ đi xây lại thứ đã có ⇒ đẻ ra HAI bản của cùng một thứ.
 *
 * Vá bằng lời nhắc thì lần sau vẫn quên. Vá bằng cửa kiểm chạy được thì không quên nổi.
 * (Cùng lý do đã dựng scripts/check-chot.mjs 07/08.)
 *
 * CÁCH DÙNG:
 *   node scripts/soi-that.mjs                 ← quét toàn bộ, in bảng tổng
 *   node scripts/soi-that.mjs camera          ← chỉ spec có chữ "camera" trong tên
 *   node scripts/soi-that.mjs --do            ← chỉ in dòng ĐỎ (spec bảo có, code không thấy)
 *
 * CÁCH ĐỌC KẾT QUẢ:
 *   ✅ spec nói có · code CÓ THẬT      → đừng giao lại, chỉ nối UI nếu chưa mount
 *   ❌ spec nói có · code KHÔNG THẤY   → hoặc đã xoá, hoặc đổi tên → phải người kiểm
 *   ⬜ spec nói chưa có                 → đây mới là việc thật
 *
 * GIỚI HẠN THÀNH THẬT (N5): script tìm theo TÊN HÀM/HẰNG SỐ trong bảng spec. Spec nào viết
 * bằng văn xuôi không nêu tên định danh thì script không đọc được — nó sẽ báo "0 định danh",
 * lúc đó PHẢI đọc tay. Script này thu hẹp việc đọc tay, không thay thế.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { execFileSync } from 'node:child_process';

const GOC = process.cwd();
const LOC = process.argv.find((a) => !a.startsWith('-') && !a.endsWith('.mjs') && !a.endsWith('node'));
const CHI_DO = process.argv.includes('--do');

/* ── gom toàn bộ mã nguồn một lần, tránh grep 57×N lần ─────────────────────── */
const BO_QUA = new Set(['node_modules', '.next', '.git', 'dist', 'dist-installer', '.worktrees', 'coverage', 'docs']);
const DUOI = new Set(['.ts', '.tsx', '.mjs']);

function quet(thuMuc, ra = []) {
  let ds;
  try { ds = readdirSync(thuMuc); } catch { return ra; }
  for (const ten of ds) {
    if (BO_QUA.has(ten)) continue;
    const p = join(thuMuc, ten);
    let st; try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) quet(p, ra);
    else if (DUOI.has(extname(ten)) && !ten.includes('.test.')) ra.push(p);
  }
  return ra;
}

const TEP_MA = quet(GOC);
const MA = TEP_MA.map((p) => {
  try { return { p: p.replace(GOC + '/', ''), src: readFileSync(p, 'utf8') }; }
  catch { return { p, src: '' }; }
});

/** Tìm một định danh trong toàn bộ mã. Trả về file:dòng đầu tiên khai nó, hoặc null. */
function timDinhDanh(ten) {
  const re = new RegExp(`\\b(function|const|let|class|interface|type|enum)\\s+${ten}\\b`);
  const reGoi = new RegExp(`\\b${ten}\\b`);
  let noiGoi = null;
  for (const { p, src } of MA) {
    if (!reGoi.test(src)) continue;
    const dong = src.split('\n');
    for (let i = 0; i < dong.length; i++) {
      if (re.test(dong[i])) return { file: p, dong: i + 1, khai: true };
      if (!noiGoi && reGoi.test(dong[i])) noiGoi = { file: p, dong: i + 1, khai: false };
    }
  }
  return noiGoi;
}

/** Đếm số nơi GỌI một định danh, ngoài chính tệp khai nó — để biết đã mount chưa (N6). */
function demNoiGoi(ten, fileKhai) {
  let n = 0;
  const re = new RegExp(`\\b${ten}\\b`);
  for (const { p, src } of MA) {
    if (p === fileKhai) continue;
    if (re.test(src)) n++;
  }
  return n;
}

/* ── rút định danh từ mỗi spec ─────────────────────────────────────────────── */
/**
 * Spec trong repo này hay viết `file.ts:123` hoặc `` `tenHam()` `` trong bảng đối chiếu.
 * Rút hai dạng đó — chúng là thứ spec CAM KẾT là đã có.
 */
function rutDinhDanh(src) {
  const ra = new Map(); // ten → dòng spec nói gì
  const dong = src.split('\n');
  for (const d of dong) {
    // chỉ soi dòng có dấu hiệu KHẲNG ĐỊNH đã có
    const noiDaCo = /✅|ĐÃ CÓ|đã có|xong|có test|sẵn có|SẴN/.test(d);
    if (!noiDaCo) continue;
    // VÁ N5 (08/08): dòng bảng nhiều cột có thể vừa chứa ✅ (cột khác) vừa chứa ⬜ THÊM
    // cho chính định danh đó ⇒ 17/20 ❌ lần chạy đầu là báo động giả. Dòng nào còn dấu
    // CHƯA-CÓ thì bỏ qua — không được tính là spec cam kết "đã có".
    const noiChuaCo = /⬜|❌|THÊM/.test(d);
    if (noiChuaCo) continue;
    for (const m of d.matchAll(/`([A-Za-z_$][A-Za-z0-9_$]{2,})\(\)`/g)) ra.set(m[1], d.trim());
    for (const m of d.matchAll(/`([A-Z][A-Z0-9_]{3,})`/g)) ra.set(m[1], d.trim());
  }
  return ra;
}

/* ── chạy ──────────────────────────────────────────────────────────────────── */
let specs = readdirSync(join(GOC, 'docs')).filter((f) => /^SPEC-.*\.md$/.test(f));
if (LOC) specs = specs.filter((f) => f.toLowerCase().includes(LOC.toLowerCase()));

console.log(`Đối chiếu ${specs.length} spec ↔ ${MA.length} tệp mã nguồn\n`);

let tongCo = 0, tongMat = 0, tongMoCoi = 0, specKhongDoc = [];

for (const ten of specs) {
  const src = readFileSync(join(GOC, 'docs', ten), 'utf8');
  const dd = rutDinhDanh(src);
  if (dd.size === 0) { specKhongDoc.push(ten); continue; }

  const dongIn = [];
  for (const [id, cauSpec] of dd) {
    const vt = timDinhDanh(id);
    if (!vt) {
      tongMat++;
      dongIn.push(`  ❌ ${id.padEnd(26)} spec nói CÓ · code KHÔNG THẤY`);
      dongIn.push(`     spec: ${cauSpec.slice(0, 100)}`);
      continue;
    }
    tongCo++;
    const goi = demNoiGoi(id, vt.file);
    const moCoi = goi === 0;
    if (moCoi) tongMoCoi++;
    if (CHI_DO && !moCoi) continue;
    dongIn.push(
      `  ${moCoi ? '🟡' : '✅'} ${id.padEnd(26)} ${vt.file}:${vt.dong}` +
      (moCoi ? '   ⚠️ 0 NƠI GỌI — code có, chưa ai dùng (N6)' : `   ${goi} nơi gọi`),
    );
  }
  if (dongIn.length) {
    console.log(`── ${ten}`);
    dongIn.forEach((l) => console.log(l));
    console.log('');
  }
}

console.log('─'.repeat(70));
console.log(`✅ spec nói có · code CÓ THẬT & đã dùng : ${tongCo - tongMoCoi}`);
console.log(`🟡 code CÓ nhưng 0 NƠI GỌI             : ${tongMoCoi}   ← đây là "kho chưa mở cửa"`);
console.log(`❌ spec nói có · code KHÔNG THẤY       : ${tongMat}   ← phải người kiểm`);
if (specKhongDoc.length) {
  console.log(`\n⚠️ ${specKhongDoc.length} spec KHÔNG rút được định danh (viết bằng văn xuôi) — PHẢI ĐỌC TAY:`);
  console.log('   ' + specKhongDoc.join(' · '));
}
console.log('\nLuật §0ae: đọc spec trước khi tin sổ. Sổ là ảnh chụp cũ, code là sự thật.');
