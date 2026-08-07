#!/usr/bin/env node
/**
 * don-trung-unicode.mjs — dọn tệp bị git theo dõi HAI LẦN dưới hai cách viết tên.
 *
 * VÌ SAO CÓ TỆP NÀY (08/08):
 * `git status` trên máy Hoà ra 41 mục, trong hộp cát Linux ra 21. Cùng một repo, cùng một lúc.
 * Đào ra: 7 tệp trong `docs/mocks/` đang bị git theo dõi DƯỚI HAI TÊN, khác nhau đúng ở cách
 * mã hoá dấu tiếng Việt:
 *
 *   "2D Kỹ thuật.dc.html"   NFC — chữ "ỹ" là MỘT ký tự
 *   "2D Kỹ thuật.dc.html"   NFD — chữ "y" + dấu ngã rời, ghép lại thành "ỹ"
 *
 * Nhìn bằng mắt thì y hệt. Với git là HAI đường dẫn khác nhau. Cả 7 cặp có SHA giống hệt
 * (cùng nội dung), nên đây là bản sao thừa, không phải hai phiên bản.
 *
 * VÌ SAO ĐẺ RA: macOS lưu tên tệp theo NFD, còn công cụ (Claude Design, trình soạn thảo) ghi
 * theo NFC. Một số commit vào lúc `core.precomposeunicode` chưa bật ⇒ lọt cả hai dạng vào chỉ mục.
 *
 * HẠI CHỖ NÀO: grep/đếm tệp ra số sai · `git add -A` đẻ thêm bản sao · nhìn `git status` không
 * biết đâu là thật ⇒ đúng cái đã làm sai lệch mọi con số đo tối 07/08.
 *
 * CÁCH DÙNG:
 *   node scripts/don-trung-unicode.mjs          ← chạy khô, chỉ in ra, KHÔNG đụng gì
 *   node scripts/don-trung-unicode.mjs --that   ← gỡ bản NFD khỏi chỉ mục git (giữ tệp trên đĩa)
 *
 * AN TOÀN: chỉ gỡ khi ĐỦ CẢ HAI điều kiện — có đủ cặp NFC/NFD, VÀ hai bên cùng SHA.
 * Lệch một điều là bỏ qua, in cảnh báo. Chỉ `git rm --cached` (bỏ khỏi chỉ mục),
 * KHÔNG BAO GIỜ xoá tệp thật trên đĩa.
 */

import { execFileSync } from 'node:child_process';

const THAT = process.argv.includes('--that');

/** Đọc chỉ mục git kèm SHA, tách bằng NUL để tên có dấu/khoảng trắng không vỡ. */
function docChiMuc() {
  const raw = execFileSync('git', ['ls-files', '-s', '-z'], { maxBuffer: 64 * 1024 * 1024 });
  return raw.toString('utf8').split('\0').filter(Boolean).map((dong) => {
    const tab = dong.indexOf('\t');
    const sha = dong.slice(0, tab).split(' ')[1];
    return { sha, duongDan: dong.slice(tab + 1) };
  });
}

const chiMuc = docChiMuc();

// gom theo TÊN LOGIC (chuẩn hoá về NFC) — hai cách viết cùng một tên sẽ rơi chung một rổ
const ro = new Map();
for (const m of chiMuc) {
  const khoa = m.duongDan.normalize('NFC');
  if (!ro.has(khoa)) ro.set(khoa, []);
  ro.get(khoa).push(m);
}

const capTrung = [...ro.entries()].filter(([, v]) => v.length > 1);

console.log(`Đường dẫn git theo dõi : ${chiMuc.length}`);
console.log(`Tên logic khác nhau    : ${ro.size}`);
console.log(`Cặp trùng NFC/NFD      : ${capTrung.length}\n`);

if (capTrung.length === 0) {
  console.log('✅ Không có cặp trùng nào. Không cần làm gì.');
  process.exit(0);
}

const canGo = [];
const boQua = [];

for (const [khoa, ds] of capTrung) {
  const nfc = ds.filter((m) => m.duongDan === m.duongDan.normalize('NFC'));
  const nfd = ds.filter((m) => m.duongDan !== m.duongDan.normalize('NFC'));
  const cungSha = new Set(ds.map((m) => m.sha)).size === 1;

  if (nfc.length !== 1 || nfd.length < 1) {
    boQua.push([khoa, `không đủ cặp NFC/NFD (NFC ${nfc.length}, NFD ${nfd.length})`]);
    continue;
  }
  if (!cungSha) {
    // KHÁC nội dung ⇒ không phải bản sao, có thể là hai tệp thật. Người quyết, không phải máy.
    boQua.push([khoa, 'KHÁC nội dung — cần người xem, script không tự xử']);
    continue;
  }
  nfd.forEach((m) => canGo.push({ khoa, duongDan: m.duongDan, sha: m.sha }));
}

console.log('── SẼ GỠ KHỎI CHỈ MỤC (giữ nguyên tệp trên đĩa) ──');
for (const m of canGo) {
  console.log(`  NFD  ${m.sha.slice(0, 8)}  ${m.khoa}`);
}
if (boQua.length) {
  console.log('\n── BỎ QUA, CẦN NGƯỜI XEM ──');
  for (const [k, ly] of boQua) console.log(`  ⚠️  ${k}\n      ${ly}`);
}

if (!THAT) {
  console.log(`\n(chạy khô — chưa đụng gì. Muốn làm thật: node ${process.argv[1].split('/').pop()} --that)`);
  process.exit(0);
}

let xong = 0;
for (const m of canGo) {
  try {
    execFileSync('git', ['rm', '--cached', '--', m.duongDan], { stdio: 'pipe' });
    xong++;
  } catch (e) {
    console.error(`  ❌ không gỡ được: ${m.khoa}\n     ${String(e.stderr || e).slice(0, 160)}`);
  }
}

console.log(`\n✅ Đã gỡ ${xong}/${canGo.length} đường dẫn thừa khỏi chỉ mục.`);
console.log('   Tệp trên đĩa còn nguyên. Xem lại bằng: git status --short');
console.log('   Rồi commit như bình thường.');
