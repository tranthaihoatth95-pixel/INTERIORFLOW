#!/usr/bin/env node
/**
 * scripts/nghiem-thu-ban-lam-viec/quet-doc-dinh-danh.mjs — ĐẾM HẾT HỌ BỆNH "ĐỌC ĐỊNH DANH ĐỒNG BỘ".
 *
 * ⛔ VÌ SAO TỒN TẠI. Ba ca đã lộ (D1 ghi · D6 ghi · D7 đọc) đều tìm được **do tình cờ**. Chừng nào
 * con số còn là "ba ca bắt được nhờ may" thì không ai biết còn bao nhiêu ca chưa bắt. Tệp này
 * biến nó thành **một danh sách đếm được**.
 *
 * ⚠️ ĐÂY LÀ MÁY GỢI Ý, KHÔNG PHẢI MÁY PHÁN. Nó phân loại bằng heuristic văn bản (chỗ gọi nằm
 * trong `useEffect` hay trong hàm xử lý sự kiện), nên **phải đọc tay từng dòng nó trả về**. Bài
 * học 04/09 đã ghi ba lần trong một ngày: máy soi gộp nhiều cơ chế vào một mẫu rồi báo quá tay.
 * Ở đây cột `doan` là PHỎNG ĐOÁN, cột `vi` mới là bằng chứng.
 *
 *   node scripts/nghiem-thu-ban-lam-viec/quet-doc-dinh-danh.mjs
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const GOC = process.cwd();
const QUET = ['components', 'lib', 'app'];
const DUOI = ['.ts', '.tsx'];
const BO = ['node_modules', '.next', '.git', 'worktrees'];

/** Ba cửa đọc định danh ĐỒNG BỘ. `danhTinhChoLuot`/`danhTinhSanSang` là đường CHỜ, không tính. */
const CUA = [
  { ten: 'getLastUserId', re: /\bgetLastUserId\s*\(/ },
  { ten: 'effectiveUserId', re: /\beffectiveUserId\s*\(/ },
  { ten: 'activeProjectRouteId', re: /\bactiveProjectRouteId\s*\(/ },
];

function duyet(d, ra = []) {
  for (const t of readdirSync(d)) {
    if (BO.some((b) => t.includes(b))) continue;
    const p = path.join(d, t);
    const st = statSync(p);
    if (st.isDirectory()) duyet(p, ra);
    else if (DUOI.includes(path.extname(t))) ra.push(p);
  }
  return ra;
}

/**
 * PHỎNG ĐOÁN NGỮ CẢNH của một dòng: nó nằm trong effect mount, trong hàm xử lý sự kiện, hay ở
 * thân render. Đọc ngược lên tối đa 40 dòng tìm dấu mở gần nhất.
 *
 * ⚠️ Heuristic thuần: hàm lồng nhau sâu hoặc callback truyền đi xa thì đoán sai. Vì vậy kết quả
 * in kèm dòng nguồn để người đọc tự phán.
 */
function doanNguCanh(dong, i) {
  for (let k = i; k >= Math.max(0, i - 40); k--) {
    const s = dong[k];
    if (/useEffect\s*\(|useLayoutEffect\s*\(/.test(s)) return 'effect-mount';
    if (/const\s+\w+\s*=\s*(async\s*)?\(\s*\)\s*=>|function\s+\w+\s*\(|on[A-Z]\w*\s*[=:]/.test(s)) return 'ham-goi-tay';
    if (/^export (default )?function |^function /.test(s)) return 'than-render';
  }
  return 'khong-ro';
}

/** Effect chạy ĐÚNG MỘT LẦN thì không tự lành khi định danh tới sau — dấu hiệu nặng nhất. */
function depsCoDinh(dong, i) {
  for (let k = i; k < Math.min(dong.length, i + 40); k++) {
    const m = dong[k].match(/^\s*\}\s*,\s*\[([^\]]*)\]\s*\)/);
    if (m) return m[1].trim();
  }
  return null;
}

const ket = [];
for (const g of QUET) {
  const d = path.join(GOC, g);
  try {
    statSync(d);
  } catch {
    continue;
  }
  for (const f of duyet(d)) {
    const noi = readFileSync(f, 'utf8');
    if (!CUA.some((c) => c.re.test(noi))) continue;
    const dong = noi.split('\n');
    dong.forEach((s, i) => {
      // Bỏ dòng import và dòng chú thích — chúng không phải chỗ GỌI.
      if (/^\s*(import|\*|\/\/)/.test(s)) return;
      for (const c of CUA) {
        if (!c.re.test(s)) continue;
        const nc = doanNguCanh(dong, i);
        ket.push({
          tep: path.relative(GOC, f),
          dong: i + 1,
          cua: c.ten,
          doan: nc,
          deps: nc === 'effect-mount' ? depsCoDinh(dong, i) : null,
          vi: s.trim().slice(0, 110),
        });
      }
    });
  }
}

const nhom = {};
for (const k of ket) (nhom[k.doan] ??= []).push(k);

console.log(`\n═══ ĐỌC ĐỊNH DANH ĐỒNG BỘ — ${ket.length} chỗ gọi ═══\n`);
for (const [n, ds] of Object.entries(nhom).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`── ${n} · ${ds.length} chỗ`);
  for (const k of ds) {
    const d = k.deps !== null ? `  deps=[${k.deps}]` : '';
    console.log(`   ${k.tep}:${k.dong}  ${k.cua}${d}`);
    console.log(`      ${k.vi}`);
  }
  console.log('');
}
console.log('⚠️ Cột "nhóm" là PHỎNG ĐOÁN theo văn bản. Đọc dòng nguồn rồi mới kết luận.');
