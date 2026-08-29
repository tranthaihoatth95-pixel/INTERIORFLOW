#!/usr/bin/env node
/**
 * soi-con-tro.mjs — CANH CON TRỎ TỚI NGUỒN ĐÃ CHƯNG CẤT.
 *
 * ══ VÌ SAO CÓ TỆP NÀY ══
 * Hoà, 30/08/2026: *"việc này làm đi làm lại hoài chán luôn, đã từng có phiên nó chưng cất rồi,
 * có bản mock trong artifact rồi"*.
 *
 * Đo được ngay hôm đó: `docs/GU-PROFILE.md` — gu thẩm mỹ của Hoà, chưng cất 11/07 từ **4 board
 * Pinterest** (`pinterest.com/Bentran_tth`, ~1.500+ pin, cluster k-means) — có **0 con trỏ** từ
 * `CLAUDE.md`, `docs/control/`, `.claude/`. Nó chỉ được 5 tài liệu sâu nhắc tên. Hậu quả cơ học:
 * **mỗi phiên tự suy lại gu từ đầu**, rồi Hoà phải tả lại. Đó là luật N8 ("đề xuất lại thứ đã có")
 * ở dạng nặng nhất — không phải quên một lần, mà là **quên có hệ thống**.
 *
 * ══ VÌ SAO KHÔNG CHỮA BẰNG CÁCH THÊM MỘT HÀNG ══
 * Phiên này đã thêm hàng `0e` vào `CLAUDE.md` và suýt gọi đó là "sửa bằng cấu trúc". Hoà bắt
 * đúng chỗ đó: *"có biết noted lại thực thi ko? hay là nói cho có rồi không đỏ"*.
 * Một hàng trong tài liệu **không tự bảo vệ mình**. Xoá nó đi thì không gì đỏ lên, và sáu tháng
 * sau lại đúng câu "làm đi làm lại hoài". Luật của repo (`IF-TRAT-TU-MOI.md`) đã viết sẵn:
 *   MỘT LUẬT CHỈ LÀ LUẬT KHI CÓ ĐỦ BA: chỗ được nạp · MỘT CỔNG · MỘT CA ĐỘT BIẾN.
 * Tệp này là cái thứ hai.
 *
 * ══ NÓ CANH GÌ ══
 * Mỗi mục trong `KHO_DA_CHUNG_CAT` phải **được ít nhất một tệp trong BỘ NẠP nhắc tên**.
 * BỘ NẠP = thứ một phiên nguội chắc chắn đọc: `CLAUDE.md` · `docs/control/**` · `.claude/**`.
 * Nhắc tên ở `docs/` sâu KHÔNG tính — đó đúng là chỗ `GU-PROFILE.md` đã nằm suốt 50 ngày.
 *
 * ⛔ Cổng này CHẶN (`--chan` → exit 1). Khác `soi-thu-muc.mjs` (chỉ báo, vì đó là thư mục của
 * Hoà, máy không có quyền). Ở đây là tài liệu trong repo, và mất đường tới nó là mất công sức
 * đã bỏ ra — đúng loại việc cổng phải chặn.
 */

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Nơi một phiên nguội CHẮC CHẮN đi qua. Sửa danh sách này là sửa định nghĩa "được nạp". */
const BO_NAP = ['CLAUDE.md', 'docs/control', '.claude'];

/**
 * KHO ĐÃ CHƯNG CẤT — thứ tốn công làm một lần, và mất đường tới là làm lại từ đầu.
 * Thêm mục mới khi (và chỉ khi) một phiên chưng cất xong thứ gì đó đáng giữ.
 * `ten` phải là chuỗi tìm được bằng `git grep --fixed-strings`.
 */
const KHO_DA_CHUNG_CAT = [
  {
    ten: 'GU-PROFILE.md',
    tep: 'docs/GU-PROFILE.md',
    la: 'gu thẩm mỹ Hoà — chưng cất 11/07 từ 4 board Pinterest, ~1.500+ pin',
    matGiKhiLac: 'mỗi phiên tự suy lại gu, Hoà phải tả lại — đã xảy ra thật 30/08',
  },
  {
    ten: 'd0b75c15-eb2a-44ff-bb29-d807f456545c',
    tep: null, // artifact, không nằm trong repo
    la: 'artifact "InteriorFlow · Bộ màn thiết kế" — 44 mock .dc.html (26/08). '
      + 'DÙNG CHO NGÔN NGỮ THỊ GIÁC (~65% đúng theo Hoà 30/08). '
      + 'KHÔNG DÙNG CHO NỘI DUNG TỪNG ROUTE — Hoà 30/08: "nội dung theo router thì không cái nào đúng", '
      + 'NGOẠI LỆ DUY NHẤT: màn Home "còn đúng 1 chút". Ngoại lệ này ghi ra để khỏi ai đọc thành '
      + '"bỏ sạch" rồi vứt luôn phần Home vẫn dùng được.',
    matGiKhiLac: 'phiên sau vẽ lại mock đã có (lãng phí), HOẶC tệ hơn: '
      + 'tưởng nó là đặc tả rồi dựng nội dung theo — sai 100% vì mức đúng nội dung là 0%',
  },
];

function coAiTro(ten) {
  try {
    const out = execFileSync('git', ['grep', '-l', '--fixed-strings', ten, '--', ...BO_NAP], {
      cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    });
    return out.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

const chan = process.argv.includes('--chan');
console.log('── con trỏ tới nguồn ĐÃ CHƯNG CẤT ──');
console.log(`  bộ nạp = ${BO_NAP.join(' · ')}`);

let lac = 0;
for (const m of KHO_DA_CHUNG_CAT) {
  if (m.tep && !existsSync(path.join(REPO, m.tep))) {
    console.log(`  ⚠️  ${m.ten} — KHÔNG CÒN TỆP (${m.tep}). Đã xoá có chủ ý thì gỡ khỏi danh sách.`);
    lac++;
    continue;
  }
  const tro = coAiTro(m.ten);
  if (tro.length) {
    console.log(`  ✅ ${m.ten}  ← ${tro.join(', ')}`);
  } else {
    lac++;
    console.log(`  🔴 ${m.ten} — KHÔNG BỘ NẠP NÀO TRỎ TỚI`);
    console.log(`       là: ${m.la}`);
    console.log(`       mất gì: ${m.matGiKhiLac}`);
  }
}

if (lac) {
  console.log(`\n  ${lac} nguồn đã chưng cất đang LẠC ĐƯỜNG.`);
  console.log('  Chữa: nhắc tên nó trong `CLAUDE.md` hoặc `docs/control/` — kèm MỘT CÂU nói nó');
  console.log('  trả lời câu hỏi gì, không chỉ dán tên. Con trỏ không nói để làm gì thì không ai bấm.');
  if (chan) process.exit(1);
} else {
  console.log(`\n  ✅ ${KHO_DA_CHUNG_CAT.length}/${KHO_DA_CHUNG_CAT.length} có đường về.`);
}
