#!/usr/bin/env node
/**
 * tra.mjs — BỘ ĐỊNH TUYẾN CA: gặp một vấn đề thì tra kho TRƯỚC, ra web SAU.
 *
 * Hoà 28/08 đọc ra công thức, chính xác từng bước:
 *   *"phân loại · ánh xạ cơ chế · đồng bộ quanh xem đã từng xử lý với nhóm này chưa?
 *     — có → xử lý với đúng công thức cũ. chưa → soi vào kho tri thức chung TRƯỚC KHI
 *     quyết định nhìn ra web."*
 *
 * Trước máy này, các mảnh có rải rác — `IF-HOI-DAP.md` có bước tra kho, ba công thức A/B/C có
 * phân loại, `IF-MOC.md` có con trỏ — nhưng **không mảnh nào nối vào nhau**, và việc nối phụ
 * thuộc agent có nhớ hay không. Thứ phụ thuộc trí nhớ thì **không phải luật** (F-02).
 *
 * Dùng:  npm run tra "tường không dựng được từ bản vẽ thật"
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

const REPO = process.cwd();
const hoi = process.argv.slice(2).join(' ').trim();
if (!hoi) { console.error('Dùng: npm run tra "mô tả vấn đề"'); process.exit(2); }

/* ═══ ① PHÂN LOẠI — ba công thức rút từ 21 lỗi (docs/control/IF-VI-SAO-CHUA-SHIP.md) ═══════════ */
const LOP = [
  { ma: 'A', ten: 'CÓ MẶT ≠ CÓ TÁC DỤNG',
    dau: /xanh|pass|tồn tại|có rồi|import|khai báo|máy soi|guard|test|đã có|nhưng không chạy|không gọi/i,
    thuoc: 'Mọi máy canh phải có CA ĐỘT BIẾN: cố tình làm hỏng, máy PHẢI đỏ. Không đỏ được thì nó không canh gì cả.' },
  { ma: 'B', ten: 'ĐÚNG THAO TÁC ≠ ĐÚNG ĐỐI TƯỢNG',
    dau: /nhầm|sai chỗ|sai đích|ghi đè|mất tệp|đường dẫn|env|target|db thật|add -A|dời|đổi tên|tham chiếu/i,
    thuoc: 'Mọi thao tác có hậu quả phải IN RA ĐÍCH THẬT và dừng chờ xác nhận trước khi chạy. Không tin biến môi trường, không tin ý định.' },
  { ma: 'C', ten: 'KHẲNG ĐỊNH VƯỢT QUÁ BẰNG CHỨNG',
    dau: /chắc|kết luận|nguyên nhân|root cause|calm|bình thường|tự chấm|đồng ý|gật|suy ra|có lẽ|chắc là/i,
    thuoc: 'Mọi kết luận phải MANG THEO PHẠM VI nó đúng, và chữ PASS chỉ do NGƯỜI KHÁC nói sau khi chạy thật.' },
];
const lop = LOP.filter((l) => l.dau.test(hoi));

/* ═══ ② + ③ TRA KHO — trước khi ra web ════════════════════════════════════════════════════════ */
const NGUON = [
  ['câu hỏi đã trả lời', 'docs/control/IF-HOI-DAP.md'],
  ['sổ lỗi đã trả giá', 'docs/design-campaign/02-FAILURE-LEDGER.md'],
  ['sai lầm giao diện', 'docs/control/IF-UXUI-OPERATING-MEMORY.md'],
  ['gốc bệnh', 'docs/control/IF-VI-SAO-CHUA-SHIP.md'],
  ['luật bền', 'docs/control/IF-CANONICAL.md'],
  ['mốc phiên', 'docs/control/IF-MOC.md'],
];
const BO = new Set(['là','và','của','có','không','thì','này','cái','bị','được','cho','với','một','các','khi','ở','ra','vào','từ','đã','sao','mà','nó','tôi']);
const tu = hoi.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((t) => t.length > 2 && !BO.has(t));

const thay = [];
for (const [nhan, rel] of NGUON) {
  const p = path.join(REPO, rel);
  if (!existsSync(p)) continue;
  for (const dong of readFileSync(p, 'utf8').split('\n')) {
    const d = dong.toLowerCase();
    const diem = tu.filter((t) => d.includes(t)).length;
    if (diem >= Math.max(2, Math.ceil(tu.length * 0.35))) thay.push({ nhan, rel, diem, dong: dong.trim().slice(0, 150) });
  }
}
thay.sort((a, b) => b.diem - a.diem);

/* ═══ IN ══════════════════════════════════════════════════════════════════════════════════════ */
console.log(`TRA KHO · "${hoi}"\n`);

console.log('① PHÂN LOẠI');
if (!lop.length) console.log('   không khớp lớp nào — có thể là ca MỚI, hoặc mô tả chưa đủ dấu hiệu');
for (const l of lop) console.log(`   [${l.ma}] ${l.ten}\n       thuốc chung: ${l.thuoc}`);

console.log(`\n② ĐÃ TỪNG XỬ LÝ NHÓM NÀY CHƯA — tra ${NGUON.length} nguồn trong kho`);
if (!thay.length) {
  console.log('   🟡 KHÔNG THẤY trong kho TỆP.');
  console.log('   ⛔ CHƯA được ra web. Còn KHO THỨ BA chưa tra — xem dưới.');
  console.log('       · thêm một dòng vào docs/control/IF-HOI-DAP.md');
  console.log('       · nếu là lỗi: ghi vào sổ lỗi kèm LỚP nó thuộc, không đẻ mục mới cho cùng một lớp');
} else {
  console.log(`   ✅ THẤY ${thay.length} chỗ — xử lý bằng ĐÚNG công thức cũ, đừng phát minh lại:\n`);
  for (const t of thay.slice(0, 8)) console.log(`   ${t.rel}\n     ${t.dong}\n`);
  if (thay.length > 8) console.log(`   … còn ${thay.length - 8} chỗ`);
  console.log('   ⛔ Chưa được ra web khi phần này chưa đọc hết.');
}

/* ═══ KHO THỨ BA — máy này KHÔNG với tới, agent phải tự tra ═══════════════════════════════════ */
console.log(`\n③ KHO THỨ BA — 109 phiên chat · 1,3 GB nguyên văn`);
console.log('   Máy này KHÔNG đọc được kho đó (nó nằm sau công cụ MCP, không phải tệp).');
console.log('   Agent PHẢI tự gọi:  mcp__ccd_session_mgmt__search_session_transcripts');
console.log('');
console.log('   ⚠️ Vì sao bước này bắt buộc, đo được 28/08: chẩn đoán gốc bệnh của IF');
console.log('      (bản vẽ thật → 3D ra rỗng) đã nằm trong tầm tay TỪ 07/08 và 15/08 —');
console.log('      hai phiên đã mở ĐÚNG hai tệp 03_TANG5B-TTT.dxf và 05_TANG9-TTT.dxf,');
console.log('      và một phiên đã ghi "poché tường 126–161 mảng/file KHÔNG neo vào cấu kiện".');
console.log('      Ba tuần sau phải đo lại từ đầu, vì không ai tra kho đó.');
console.log('');
console.log('   Chỉ khi CẢ BA kho đều trống mới được ra web.');
