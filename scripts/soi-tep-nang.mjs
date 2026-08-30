#!/usr/bin/env node
/**
 * soi-tep-nang.mjs — TỆP NẶNG VÀ TỆP KHÔNG NÊN NẰM TRONG GIT.
 *
 * ══ CA THẬT, 30/08/2026 ══
 * Hoà cho phép đẩy nhánh `checkpoint/2026-08-24-control-plane` lên GitHub. Push chạy ~10 phút,
 * tải hết, rồi **bị từ chối ở phút cuối**:
 *
 *   remote: error: File release/2026-08-22/InteriorFlow-0.1.0-arm64.dmg is 337.73 MB;
 *                  this exceeds GitHub's file size limit of 100.00 MB
 *   ! [remote rejected] (pre-receive hook declined)
 *
 * Tệp `.dmg` ấy vào lịch sử ngày 26/08 (`147f66a`), nay nằm sâu **115 commit** phía sau. Nghĩa là
 * nhánh này **chưa bao giờ đẩy lên được** và sẽ không bao giờ, chừng nào blob còn trong lịch sử.
 * Hậu quả đo được: 7 ngày làm việc tồn tại đúng một bản trên máy, không Time Machine, và cả hai
 * lần push đều tưởng là "chậm" chứ không ai biết là "bị chặn".
 *
 * ⚠️ Cổng này KHÔNG chữa được lịch sử — gỡ blob khỏi lịch sử là việc riêng, đổi SHA hàng loạt,
 * phải có người quyết. Cổng này chặn **lần sau**, và đó mới là việc của cổng.
 *
 * ══ HAI NGƯỠNG, HAI LÝ DO KHÁC NHAU ══
 *   90 MB  🔴 GitHub từ chối ở 100 MB. Để 90 làm biên an toàn — một commit nữa vào cùng tệp là
 *             vượt. Vượt ngưỡng này thì **cả nhánh không đẩy được**, không riêng tệp đó.
 *   20 MB  🟡 Chưa chặn được gì, nhưng git lưu **mọi phiên bản** của mọi tệp: một tệp 20 MB sửa
 *             mười lần là 200 MB kho vĩnh viễn. Không xoá lại được bằng cách xoá tệp.
 *
 * ══ VÀ MỘT LOẠI KHÔNG TÍNH BẰNG KÍCH THƯỚC ══
 * Bản sao cơ sở dữ liệu (`*.db`, `*.db.bak-*`, `*.sqlite`) **không nên nằm trong git ở bất kỳ cỡ
 * nào**: nó chứa dữ liệu người dùng thật, và git thì không quên. Đo 30/08:
 * `backups/dev.db.bak-2026-08-21-1400` 36,7 MB đang theo git — dưới 100 MB nên GitHub không chặn,
 * nên **không ai biết**. Luật trung tính (24/07) cấm dữ liệu khách nằm trong sản phẩm bán ra.
 */

import { execFileSync } from 'node:child_process';
import { statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const CHAN_MB = 90;   // GitHub chặn ở 100 — để biên
const CANH_MB = 20;   // git giữ mọi phiên bản, tệp to sửa nhiều lần là kho phình vĩnh viễn
const LA_CSDL = /\.(db|sqlite3?|db\.bak[-.\w]*|dump|mdb)$/i;

/** Ngoại lệ ĐÃ BIẾT, chờ xử lý riêng. Bỏ tên khỏi đây khi đã dọn — KHÔNG thêm để né cổng. */
const NGOAI_LE = new Map([
  // ⚠️ Danh sách này CHỈ có hai mục, và cả hai là nợ CẦN NGƯỜI QUYẾT (gỡ blob khỏi lịch sử).
  // Hai tệp CSDL rỗng ở gốc repo mà cổng bắt được lần chạy đầu (`dev.db` 0 byte ·
  // `dev.db.bak-truoc-hash-20-08`) KHÔNG được thêm vào đây — chúng đã bị `git rm --cached` và
  // `.gitignore` đã bịt khe. Đó là cách đúng: cổng bắt thì DỌN, không phải ghi tên vào ngoại lệ.
  ['release/2026-08-22/InteriorFlow-0.1.0-arm64.dmg',
   'đã trong lịch sử từ 147f66a (26/08) — gỡ được chỉ bằng viết lại lịch sử, chờ Hoà quyết'],
  ['backups/dev.db.bak-2026-08-21-1400',
   'bản sao DB, đã trong lịch sử — cần Hoà xác nhận không có dữ liệu khách trước khi gỡ'],
]);

function tepTheoGit() {
  try {
    return execFileSync('git', ['ls-files'], { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
      .split('\n').filter(Boolean);
  } catch { return []; }
}

const chan = process.argv.includes('--chan');
console.log('── tệp nặng / tệp không nên nằm trong git ──');

const doa = [];
const canh = [];
const csdl = [];
for (const f of tepTheoGit()) {
  const p = path.join(REPO, f);
  if (!existsSync(p)) continue;
  let mb;
  try { mb = statSync(p).size / 1048576; } catch { continue; }
  if (LA_CSDL.test(f)) csdl.push([f, mb]);
  else if (mb >= CHAN_MB) doa.push([f, mb]);
  else if (mb >= CANH_MB) canh.push([f, mb]);
}

const in_ = (nhan, ds) => {
  for (const [f, mb] of ds.sort((a, b) => b[1] - a[1])) {
    const cu = NGOAI_LE.get(f);
    console.log(`  ${cu ? '⏳' : nhan} ${mb.toFixed(1)} MB  ${f}`);
    if (cu) console.log(`       ngoại lệ đã biết: ${cu}`);
  }
};

in_('🔴', doa);
in_('🟠', csdl);
in_('🟡', canh);

const moi = [...doa, ...csdl].filter(([f]) => !NGOAI_LE.has(f));
const tong = doa.length + csdl.length + canh.length;
console.log(`\n  ${tong} tệp bị nêu · ${NGOAI_LE.size} ngoại lệ đã biết · ${moi.length} MỚI`);

if (moi.length) {
  console.log('\n  🔴 CÓ TỆP MỚI vượt ngưỡng hoặc là bản sao CSDL.');
  console.log('  Chữa — theo thứ tự này, KHÔNG đảo:');
  console.log('    ① gỡ khỏi chỉ mục NGAY khi chưa push: `git rm --cached <tệp>`');
  console.log('    ② thêm khuôn tên vào `.gitignore` để lần sau không lọt');
  console.log('    ③ đã push rồi thì phải viết lại lịch sử — việc riêng, phải có người quyết');
  console.log('  ⛔ CẤM thêm tên vào NGOAI_LE để qua cổng. Ngoại lệ là chỗ ghi NỢ, không phải cửa sau.');
  if (chan) process.exit(1);
} else if (NGOAI_LE.size) {
  console.log('  Không có tệp mới. Các ngoại lệ trên là NỢ ĐÃ CÓ TÊN, chưa xử lý.');
}
