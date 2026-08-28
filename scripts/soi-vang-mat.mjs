#!/usr/bin/env node
/**
 * soi-vang-mat.mjs — KHẲNG ĐỊNH VẮNG MẶT PHẢI KÈM LỆNH CHỨNG MINH.
 *
 * ── Vì sao lớp này nguy hiểm riêng (28/08) ────────────────────────────────────────────────────
 * Khẳng định **CÓ** thì nhìn một cái là bác được. Khẳng định **KHÔNG CÓ** chỉ đúng **trong phạm
 * vi mình đã nhìn** — nhìn nhầm chỗ là **sai âm thầm**, và không ai phát hiện được, kể cả người
 * viết. Nó đọc y hệt một kết luận đã kiểm.
 *
 * Ba câu sai của MAIN trong ngày 28/08, cùng một hình dạng:
 *   · `42/48` flow tên rác          → thật `32/52`   (số nhớ, không đo lại)
 *   · `16 máy soi ÷ 5`              → thật `14/14`   (chính MAIN vừa nối 8 máy rồi vẫn trích số cũ)
 *   · *"bản đóng gói Electron **chưa dựng, chưa chạy**"* → **336 MB nằm trong `dist/` từ 15/07**
 * Câu thứ ba là khẳng định vắng mặt, và MAIN viết nó **mà không mở `dist/` ra nhìn**.
 * Cả ba **chỉ lộ ra vì Hoà hỏi**. Đó không phải cơ chế — đó là may.
 *
 * ── Phạm vi máy này, khai thẳng ───────────────────────────────────────────────────────────────
 * Nó **KHÔNG** bắt được mọi câu khẳng định vội — chính `IF-MOT-LOI.md` đã ghi *"không cổng nào
 * bắt được một câu khẳng định vội trong văn xuôi"*. Nó bắt **đúng một lớp con hẹp**: câu tuyên bố
 * **vắng mặt** trong control plane mà **không kèm lệnh để người khác kiểm lại**.
 * Hẹp, nhưng đó là lớp đã gây ra lỗi nặng nhất trong ngày.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const REPO = process.cwd();
const THU_MUC = path.join(REPO, 'docs/control');

/** Câu tuyên bố VẮNG MẶT. Hẹp có chủ ý — thà bỏ sót còn hơn kêu oan (F-02). */
/* 🔴 SIẾT lượt 2 — lượt đầu bắt cả CÂU LUẬT, không chỉ khẳng định về thế giới.
 * `"thư mục chưa ai quyết"` là **tên một luật**; `"chưa tra thì nói tôi chưa tra"` là **lời luật**.
 * Phạt chúng là kêu oan, và máy kêu oan thì người học cách ngó lơ (F-02 — đúng lý do luật `L3`
 * đã bị bỏ). Bỏ các cụm chung chung (`chưa có` · `chưa ai` · `chưa từng` · `KHÔNG có`), chỉ giữ
 * cụm mang hình dạng **một phép đo đã chạy**: có con số 0, hoặc tuyên bố một vật cụ thể không có. */
const VANG_MAT = /(chưa dựng|chưa chạy lần nào|không tồn tại|\b0 (nơi|tệp|dòng|chỗ|module|máy|lần)\b|\bkhông có (tệp|thư mục|route|bảng|model)\b)/;
/** Dấu hiệu câu đó KÈM cách kiểm lại — lệnh chạy được, hoặc đường dẫn cụ thể để mở ra nhìn. */
const CO_LENH = /npm run |node scripts\/|grep -|sqlite3 |git |find |ls |`[^`]*\.(mjs|ts|tsx|json|db|md)`/;

const loi = [];
let tong = 0;
for (const f of existsSync(THU_MUC) ? readdirSync(THU_MUC).filter((x) => x.endsWith('.md')) : []) {
  const p = path.join(THU_MUC, f);
  const dong = readFileSync(p, 'utf8').split('\n');
  dong.forEach((l, i) => {
    if (!VANG_MAT.test(l)) return;
    tong++;
    // cửa sổ 2 dòng: lệnh chứng minh thường nằm ngay dưới câu khẳng định
    const quanh = [l, dong[i + 1] ?? '', dong[i + 2] ?? ''].join(' ');
    if (!CO_LENH.test(quanh)) loi.push({ f, dong: i + 1, cau: l.trim().slice(0, 96) });
  });
}

console.log('SOI KHẲNG ĐỊNH VẮNG MẶT · docs/control/\n');
console.log(`  câu tuyên bố vắng mặt: ${tong}`);
console.log(`  ${loi.length ? '🔴' : '✅'} thiếu lệnh chứng minh: ${loi.length}\n`);

const tranTep = path.join(REPO, 'scripts/foundation-tran.json');
const tran = existsSync(tranTep) ? JSON.parse(readFileSync(tranTep, 'utf8'))['F-VANG-MAT'] : undefined;

if (loi.length) {
  for (const e of loi.slice(0, 8)) console.log(`   ${e.f}:${e.dong}  ${e.cau}`);
  if (loi.length > 8) console.log(`   … còn ${loi.length - 8}`);
  console.log('\n   Sửa: thêm NGAY DƯỚI câu đó lệnh để người khác chạy lại — `npm run …`, `grep …`,');
  console.log('   hoặc đường dẫn cụ thể để mở ra nhìn. Không có lệnh thì câu đó chỉ đúng trong');
  console.log('   phạm vi người viết đã nhìn, và không ai biết phạm vi đó rộng tới đâu.');
}
if (typeof tran === 'number') {
  console.log(`\nBÁNH CÓC  ${loi.length} / trần ${tran}`);
  if (loi.length > tran) { console.log(`🔴 VƯỢT TRẦN ${loi.length - tran} — cấm nới trần (M-52).`); process.exit(1); }
  if (loi.length < tran) console.log(`✅ thấp hơn trần ${tran - loi.length} — hạ trần xuống ${loi.length}.`);
}
