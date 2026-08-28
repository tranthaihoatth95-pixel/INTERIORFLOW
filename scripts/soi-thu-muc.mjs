#!/usr/bin/env node
/**
 * soi-thu-muc.mjs — MỖI THƯ MỤC PHẢI CÓ NGƯỜI QUYẾT (28/08).
 *
 * Hoà: *"cứ mỗi một thư mục được để ra trong dự án thì git phải trỏ tới; còn commit hay không
 * thì phải có hội đồng thẩm định quyết, chứ không dựa vào người không chuyên môn như tôi."*
 *
 * Câu thứ hai mới là câu quan trọng. Suốt nay Hoà phải trả lời những câu **kỹ thuật** —
 * *"cái này có nên commit không?"* — trong khi đó là phán đoán chuyên môn, không phải quyết định
 * sản phẩm. Máy này biến nó thành **luật máy chạy được**, để Hoà không phải quyết nữa.
 *
 * ── BA TRẠNG THÁI, KHÔNG CÓ TRẠNG THÁI THỨ TƯ ─────────────────────────────────────────────────
 *   ✅ THEO DÕI   — git biết. Có người đã quyết: giữ.
 *   ✅ BỎ QUA     — `.gitignore` khai. Có người đã quyết: không giữ, và **nói ra lý do**.
 *   🔴 MỒ CÔI     — không tracked, không ignored. **Chưa ai quyết gì cả.**
 *
 * Trạng thái ba là trạng thái nguy hiểm: thư mục nằm đó, không ai bảo giữ, không ai bảo bỏ, nên
 * lần dọn nào cũng có thể mang nó đi — và đó đúng là cơ chế Hoà mô tả:
 * *"worktree cứ chuyển ra chuyển vào repo rồi bị mất đi, bị im, bị dọn, bị lỗi thời,
 *  mặc dù rất nhiều cái rất tinh rất hay đã từng được xây dựng."*
 *
 * ⚠️ Máy này **không xoá, không thêm, không sửa `.gitignore`**. Nó chỉ chỉ ra chỗ chưa ai quyết.
 * Quyết định là việc của người có chuyên môn — nhưng ít nhất nay **nhìn thấy được** chỗ cần quyết.
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const REPO = process.cwd();
/** Thư mục hạ tầng — không thuộc quyền quyết của ai, luôn bỏ qua khi soi. */
const NGOAI = new Set(['.git', 'node_modules', '.next']);

const g = (...a) => { try { return execFileSync('git', a, { cwd: REPO, encoding: 'utf8' }); } catch { return ''; } };

/** Thư mục có tệp nào được git theo dõi không? */
const daTheoDoi = new Set(
  g('ls-files').split('\n').filter(Boolean).map((f) => path.dirname(f)).flatMap((d) => {
    const ra = []; let c = d;
    while (c && c !== '.') { ra.push(c); c = path.dirname(c); }
    return ra;
  }),
);

function boQua(rel) {
  try { execFileSync('git', ['check-ignore', '-q', rel], { cwd: REPO }); return true; } catch { return false; }
}

const moCoi = [], boQuaCo = [];
function di(dir, sau = 0) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory() || NGOAI.has(e.name)) continue;
    const p = path.join(dir, e.name);
    const rel = path.relative(REPO, p);
    if (boQua(rel)) { boQuaCo.push(rel); continue; }          // có người quyết: bỏ
    if (daTheoDoi.has(rel)) { if (sau < 2) di(p, sau + 1); continue; } // có người quyết: giữ
    moCoi.push(rel);                                            // CHƯA AI QUYẾT
  }
}
di(REPO);

console.log('SOI THƯ MỤC · mỗi thư mục phải có người quyết\n');
console.log(`  ✅ được theo dõi  ${daTheoDoi.size}`);
console.log(`  ✅ khai bỏ qua    ${boQuaCo.length}`);
console.log(`  ${moCoi.length ? '🔴' : '✅'} MỒ CÔI         ${moCoi.length}  — không tracked, không ignored, chưa ai quyết\n`);

if (moCoi.length) {
  for (const m of moCoi) {
    let n = 0; try { n = readdirSync(path.join(REPO, m)).length; } catch { /* không đọc được */ }
    console.log(`  🔴 ${m}  (${n} mục)`);
  }
  console.log('\n  Quyết bằng MỘT trong hai, không có đường thứ ba:');
  console.log('    · giữ  → `git add <thư mục>` rồi commit');
  console.log('    · bỏ   → thêm một dòng vào `.gitignore` KÈM lý do ngay trên dòng đó');
  console.log('  Không quyết = lần dọn sau nó biến mất và không ai biết đã mất gì.');
  // Cảnh báo ở vòng dev, CHẶN ở vòng phát hành. Chặn ngay bây giờ là đỏ vĩnh viễn cho mọi lane
  // — và cổng luôn đỏ là cổng người ta học cách ngó lơ (F-02, đã trả giá bằng luật L3).
  process.exit(process.argv.includes('--chan') ? 1 : 0);
}
console.log('  Không thư mục nào đang chờ người quyết.');
