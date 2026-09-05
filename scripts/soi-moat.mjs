#!/usr/bin/env node
/**
 * ═══ SOI MOAT — tuyên bố ↔ mã có SỐNG không ═══════════════════════════════════
 *
 * Câu hỏi máy này hỏi, và KHÔNG cổng nào khác đang hỏi:
 *   *"Điều ta TUYÊN BỐ là thế mạnh sản phẩm — mã của nó có đường nào tới người dùng không?"*
 *
 * Khác `soi:frontier` (sổ ↔ code có tồn tại) và khác `soi:cam-dien` (thư mục có được nhập).
 * Máy này dò TỚI CỬA VÀO THẬT, vì bẫy nằm ở bậc hai: *"có người gọi, nhưng người gọi ấy không
 * còn sống"*. Ca thật 05/09: `getRulesByRegion` có 1 nơi gọi ⇒ đếm một bậc thì thấy "sống";
 * nơi gọi đó là `getMandatoryRules`, mà hàm ấy 0 nơi gọi ⇒ cả nhánh chết.
 *
 * BA ĐIỀU MÁY TỰ KIỂM TRƯỚC KHI TIN CHÍNH NÓ:
 *   ① ký hiệu có TỒN TẠI trong tệp khai không — bài học cùng ngày: từng báo "boqFromDoc 0 nơi
 *      gọi" trong khi hàm đó KHÔNG TỒN TẠI (tên thật `computeBoq`). Đếm nhầm tên ra số nhầm, và
 *      số nhầm tệ hơn không đếm. Ký hiệu không tồn tại ⇒ ĐỎ NGAY, không âm thầm ra 0.
 *   ② tệp khai có TỒN TẠI không.
 *   ③ dò lan từ `app/` và `components/` — cửa vào thật của người dùng — chứ không đếm caller.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, normalize } from 'node:path';
import { TUYEN_BO_MOAT } from './moat-registry.mjs';

const ROOT = process.cwd();
const BO_QUA = new Set(['node_modules', '.next', '.git', '.claude', 'dist-installer', 'release', 'docs']);

function duyet(thuMuc, ra = []) {
  let ds;
  try { ds = readdirSync(thuMuc); } catch { return ra; }
  for (const ten of ds) {
    if (BO_QUA.has(ten)) continue;
    const p = join(thuMuc, ten);
    let st; try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) duyet(p, ra);
    else if (/\.(ts|tsx)$/.test(ten) && !/\.test\.tsx?$/.test(ten)) ra.push(p);
  }
  return ra;
}

/** giải một chuỗi import thành đường dẫn tệp thật */
function giai(tuTep, chuoi) {
  let t;
  if (chuoi.startsWith('@/')) t = join(ROOT, chuoi.slice(2));
  else if (chuoi.startsWith('.')) t = normalize(join(dirname(tuTep), chuoi));
  else return null;
  for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) if (existsSync(t + ext)) return t + ext;
  return existsSync(t) && statSync(t).isFile() ? t : null;
}

const tatCa = duyet(ROOT);
const canh = new Map();
for (const f of tatCa) {
  const s = readFileSync(f, 'utf8');
  const ra = [];
  for (const m of s.matchAll(/from\s+'([^']+)'/g)) { const t = giai(f, m[1]); if (t) ra.push(t); }
  for (const m of s.matchAll(/import\(\s*'([^']+)'\s*\)/g)) { const t = giai(f, m[1]); if (t) ra.push(t); }
  canh.set(f, ra);
}

// CỬA VÀO THẬT: mọi tệp dưới app/ và components/ (nơi người dùng chạm tới)
const goc = tatCa.filter((f) => f.startsWith(join(ROOT, 'app')) || f.startsWith(join(ROOT, 'components')));
const toi = new Set();
const hangDoi = [...goc];
while (hangDoi.length) {
  const p = hangDoi.pop();
  if (toi.has(p)) continue;
  toi.add(p);
  for (const k of canh.get(p) ?? []) hangDoi.push(k);
}

const chan = process.argv.includes('--chan');
let do_ = 0, vang = 0;
console.log('SOI MOAT — tuyên bố ↔ mã có sống tới người dùng không\n');
for (const t of TUYEN_BO_MOAT) {
  const tep = join(ROOT, t.khaiTrong);
  if (!existsSync(tep)) {
    console.error(`🔴 ${t.id} — TỆP KHAI KHÔNG TỒN TẠI: ${t.khaiTrong}`); do_++; continue;
  }
  const ma = readFileSync(tep, 'utf8');
  if (!new RegExp(`\\b(function|const|class)\\s+${t.kyHieu}\\b`).test(ma)) {
    console.error(`🔴 ${t.id} — KÝ HIỆU '${t.kyHieu}' KHÔNG CÓ trong ${t.khaiTrong}. Sổ ghi sai tên; sửa sổ trước khi tin số.`);
    do_++; continue;
  }
  // sống = tệp khai với tới được TỪ app/ hoặc components/, VÀ có nơi ngoài tệp đó thật sự gọi tên
  const coDuong = toi.has(tep);
  let coGoi = false;
  for (const f of toi) {
    if (f === tep) continue;
    if (new RegExp(`\\b${t.kyHieu}\\b`).test(readFileSync(f, 'utf8'))) { coGoi = true; break; }
  }
  const song = coDuong && coGoi;
  const khai = t.trangThai === 'song';
  if (song && khai) console.log(`  ✓ ${t.id} — sống, đúng như sổ khai`);
  else if (!song && !khai) { vang++; console.log(`  🟡 ${t.id} — CHƯA NỐI (sổ đã khai đúng: '${t.trangThai}')\n       ${t.chot}\n       ${t.kyHieu}() ở ${t.khaiTrong} — không đường nào từ giao diện tới`); }
  else if (!song && khai) { do_++; console.error(`  🔴 ${t.id} — SỔ KHAI 'song' NHƯNG MÃ CHẾT. ${t.kyHieu}() ở ${t.khaiTrong}\n       ${t.chot}`); }
  else { do_++; console.error(`  🔴 ${t.id} — mã nay ĐÃ SỐNG mà sổ còn ghi '${t.trangThai}'. Cập nhật sổ.`); }
}
console.log(`\n${TUYEN_BO_MOAT.length} tuyên bố · ${TUYEN_BO_MOAT.length - do_ - vang} sống · ${vang} chưa nối · ${do_} lệch sổ`);
if (do_ > 0 && chan) process.exit(1);
