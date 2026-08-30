#!/usr/bin/env node
/**
 * chon-tuyen.mjs — NẤC ĐỘNG CHỌN TUYẾN LÀM VIỆC + CHUÔNG AN TOÀN TRƯỚC KHI GỬI RA NGOÀI.
 *
 * ══ VÌ SAO CÓ TỆP NÀY ══
 * 30/08/2026 Codex hết quota giữa chừng, lane 07 đứng lại. Hoà hỏi phương án dự phòng, rồi chốt:
 * *"thiết lập nấc động kèm chuông an toàn. Chọn C khi ưu tiên những việc khai thác lợi thế của C,
 * chọn B với nội dung tương tự."*
 *
 * Ba tuyến, và chúng KHÔNG thay thế nhau — mỗi tuyến bù một lỗ khác:
 *
 *   A · PHIÊN CÓ REPO   Codex hoặc Claude Code, đọc mã, chạy lệnh, nhận phiếu qua cầu.
 *                       Tuyến chính. Chết khi hết quota.
 *   B · CHAT NGOÀI      Dán phiếu tự chứa vào ChatGPT/Claude web, kể cả trên điện thoại.
 *                       Bù lỗ HẾT MÁY — thứ duy nhất còn chạy khi mọi tuyến có repo đều cạn.
 *                       Giá: dữ liệu RỜI MÁY, và thêm một chặng người trung chuyển.
 *   C · SUBAGENT        Chạy trong phiên đang mở, thừa hưởng đúng quyền của phiên mẹ.
 *                       Bù lỗ VIỆC VỤN — gọn, đo được, không đáng mở cả một phiên.
 *                       KHÔNG cứu được lúc hết quota: nó tiêu chính túi đang cạn.
 *
 * ══ NẤC ĐỘNG — hỏi theo thứ tự, dừng ở câu đầu tiên trả lời ĐÚNG ══
 *   ① Việc cần ĐỌC MÃ hoặc CHẠY LỆNH để làm được?        → A, và nếu A cạn thì C
 *   ② Việc là NGHIÊN CỨU/ĐỊNH HƯỚNG thuần, ra văn bản?    → B  (phiếu tự chứa là đủ)
 *   ③ Việc GỌN, phạm vi rõ, đo được, dưới một lượt?       → C
 *   ④ Mọi tuyến có repo đều cạn?                          → B, không còn lựa chọn khác
 *
 * ⚠️ Nấc này KHÔNG tự đọc được quota — máy không thấy được hạn mức của bất kỳ nhà cung cấp nào.
 * Người quyết vẫn là người. Việc của tệp này là **rung chuông trước khi tuyến B làm rò dữ liệu**.
 *
 * ══ CHUÔNG AN TOÀN — chỉ áp cho tuyến B ══
 * Tuyến B gửi thứ ra khỏi máy. Đo được 30/08: ảnh `50-01-cai-dat.png` trong bộ 24 ảnh định gửi
 * cho tuyến nghiên cứu **hiện rõ Gmail cá nhân của Hoà** cùng ảnh đại diện thật. Không ai cố ý;
 * ảnh chụp app thật thì app thật có gì nó chụp nấy.
 *
 * Chuông làm hai việc, cả hai đều XÁC ĐỊNH, không đoán:
 *   ① Quét TỆP CHỮ tìm email · điện thoại VN · khoá API · chuỗi bí mật.
 *   ② Với ẢNH thì không đọc được chữ trong ảnh, nên soi NGƯỢC TỪ MÃ: tìm component nào vẽ ra
 *      dữ liệu cá nhân, suy ra route nào mang chúng, rồi gắn cờ ảnh của đúng route đó.
 *      Đo 30/08: 4 component (`ProfileCard` · `AccountMenu` · `AccountSettings` · `LockScreen`)
 *      ⇒ mọi ảnh `50-*` (cài đặt) và `00-01-man-khoa`.
 *
 * Dùng:  node scripts/chon-tuyen.mjs --gui <thư-mục|tệp> [...]     ⇒ chuông trước khi gửi
 *        node scripts/chon-tuyen.mjs --nac                          ⇒ in bảng nấc động
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* ── Khuôn nhận dạng. Cố ý CHẶT, thà báo thừa còn hơn bỏ sót một địa chỉ thật. ── */
const KHUON = [
  ['email', /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g],
  ['điện thoại VN', /\b(?:\+?84|0)(?:3|5|7|8|9)\d{8}\b/g],
  ['khoá API', /\b(?:sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|AIza[A-Za-z0-9_-]{20,})\b/g],
  ['chuỗi bí mật', /\b(?:SECRET|PASSWORD|PRIVATE_KEY|TOKEN)\s*[=:]\s*["']?[^\s"']{8,}/gi],
];

/* Email KHÔNG phải người thật — miền thử của chính dự án. Bỏ qua để chuông không kêu oan. */
const MIEN_THU = /@(if\.local|test\.local|example\.(com|org)|ttt\.test|localhost)$/i;

const CHU = /\.(md|txt|json|ts|tsx|js|mjs|css|html|csv|yml|yaml)$/i;
const ANH = /\.(png|jpe?g|webp|gif|avif|svg)$/i;

/** Soi ngược từ mã: component nào vẽ dữ liệu cá nhân ⇒ route nào mang nó ⇒ ảnh nào rủi ro. */
function routeCoPII() {
  let hits = [];
  try {
    hits = execFileSync('git', ['grep', '-l', '-E', String.raw`user\.email|\.email\}|me\.email|user\?\.email|\.phone\}`,
      '--', 'app', 'components'], { cwd: REPO, encoding: 'utf8' }).split('\n').filter(Boolean);
  } catch { /* không tìm thấy ⇒ mảng rỗng, chuông chỉ dựa vào tệp chữ */ }
  /* Ánh xạ sang KHUÔN TÊN ẢNH của `chup-man-duyet-mat.mjs`. Giữ bảng ở ĐÂY, một chỗ. */
  const khuonAnh = [];
  if (hits.some((f) => /settings|AccountSettings|ProfileCard|AccountMenu/i.test(f))) khuonAnh.push(/^50-/);
  if (hits.some((f) => /LockScreen/i.test(f))) khuonAnh.push(/^00-01/);
  return { hits, khuonAnh };
}

function liet(p, ra = []) {
  let st; try { st = statSync(p); } catch { return ra; }
  if (st.isFile()) { ra.push(p); return ra; }
  for (const e of readdirSync(p)) liet(path.join(p, e), ra);
  return ra;
}

/* ══ chế độ --nac ══ */
if (process.argv.includes('--nac') || process.argv.length <= 2) {
  console.log(`
── NẤC ĐỘNG CHỌN TUYẾN ──  dừng ở câu ĐẦU TIÊN trả lời ĐÚNG

  ① cần ĐỌC MÃ hoặc CHẠY LỆNH?            → A · phiên có repo   (A cạn ⇒ dùng C)
  ② nghiên cứu/định hướng thuần, ra chữ?   → B · chat ngoài      (phiếu tự chứa là đủ)
  ③ gọn, phạm vi rõ, đo được, một lượt?    → C · subagent
  ④ mọi tuyến có repo đều cạn?             → B, không còn cách khác

  B bù lỗ HẾT MÁY   · giá: dữ liệu rời máy + thêm chặng trung chuyển
  C bù lỗ VIỆC VỤN  · KHÔNG cứu lúc hết quota, nó tiêu chính túi đang cạn

  ⚠️ Máy không đọc được quota của bất kỳ nhà cung cấp nào — người vẫn quyết nấc.
     Việc của máy là RUNG CHUÔNG trước khi tuyến B làm rò dữ liệu:

       node scripts/chon-tuyen.mjs --gui artifacts/man-30-08 docs/phieu-giao/khao-sat-ux-toan-cau.md
`);
  process.exit(0);
}

/* ══ chế độ --gui ══ */
const dich = process.argv.slice(process.argv.indexOf('--gui') + 1).filter((a) => !a.startsWith('--'));
if (!dich.length) { console.error('Dùng: node scripts/chon-tuyen.mjs --gui <thư-mục|tệp> [...]'); process.exit(2); }

const { hits, khuonAnh } = routeCoPII();
console.log('── chuông an toàn · trước khi gửi ra ngoài máy ──');
console.log(`  ${hits.length} component vẽ dữ liệu cá nhân ⇒ ${khuonAnh.length} khuôn ảnh rủi ro`);

const tep = dich.flatMap((d) => (existsSync(d) ? liet(d) : []));
let keu = 0;
const anhRuiRo = [];

for (const f of tep) {
  const ten = path.basename(f);
  if (ANH.test(ten)) {
    if (khuonAnh.some((k) => k.test(ten))) anhRuiRo.push(f);
    continue;
  }
  if (!CHU.test(ten)) continue;
  let s; try { s = readFileSync(f, 'utf8'); } catch { continue; }
  for (const [nhan, re] of KHUON) {
    const thay = [...new Set(s.match(re) ?? [])].filter((v) => !(nhan === 'email' && MIEN_THU.test(v)));
    if (thay.length) {
      keu++;
      console.log(`  🔴 ${path.relative(REPO, f)} — ${nhan}: ${thay.slice(0, 3).join(' · ')}${thay.length > 3 ? ` …+${thay.length - 3}` : ''}`);
    }
  }
}

if (anhRuiRo.length) {
  keu++;
  console.log(`  🟠 ${anhRuiRo.length} ảnh chụp màn CÓ THỂ hiện dữ liệu cá nhân (máy không đọc chữ trong ảnh — suy từ mã):`);
  for (const f of anhRuiRo) console.log(`       ${path.relative(REPO, f)}`);
}

console.log(`\n  ${tep.length} tệp soi · ${keu} chuông`);
if (keu) {
  console.log('\n  🔔 ĐỪNG GỬI NGUYÊN BỘ. Ba đường, chọn một:');
  console.log('    ① BỎ những tệp trên ra khỏi lô gửi — hỏi trước: bên nhận có THẬT SỰ cần chúng không?');
  console.log('    ② CHE vùng dữ liệu cá nhân rồi mới gửi');
  console.log('    ③ Đổi sang tuyến C — subagent không đưa gì ra khỏi máy');
  console.log('  ⛔ Không có cờ "bỏ qua". Muốn gửi thì phải sửa lô gửi, không phải sửa chuông.');
  process.exit(1);
}
console.log('  ✅ Không thấy dữ liệu cá nhân trong lô này.');
