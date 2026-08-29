#!/usr/bin/env node
/**
 * soi-route-dev.mjs — MỌI ROUTE DEV/THỬ PHẢI CÓ CHỐT CHẶN PHÁT HÀNH.
 *
 * ══ CA THẬT ══
 * 23/08 một lượt audit đếm được **4 route dev/demo nằm trong cây route sản phẩm**
 * (`/dev-bench-3d-2` · `/demo/ghe-3d` · `/thu-be-mat` · `/thu-trang-thai`). Chúng không có lối vào
 * từ giao diện nên không ai thấy — nhưng trong bản đóng gói thì **ai gõ đúng đường dẫn là vào
 * được**, và thứ họ thấy là bàn thử với dữ liệu bịa. Lượt đó chữa bằng cách đặt `layout.tsx` gọi
 * `notFound()` khi `NODE_ENV === 'production'`, và ghi danh sách bốn route vào chú thích.
 *
 * 30/08 đo lại: **4/5 có chốt**. Route thứ năm — `app/thu-the-khoa`, tạo ngày 29/08, tức SAU lượt
 * audit — không có chốt. Không ai làm sai cả: danh sách viết tay trong một chú thích **không tự
 * lớn theo repo**. Đây đúng là hình mẫu của lỗi mà repo đã đặt tên:
 *
 *   MỘT LUẬT CHỈ LÀ LUẬT KHI CÓ ĐỦ BA: chỗ được nạp · MỘT CỔNG · MỘT CA ĐỘT BIẾN.
 *
 * Chú thích 23/08 là "chỗ được nạp". Tệp này là cái còn thiếu.
 *
 * ══ CÁCH ĐẾM ══
 * Route dev = thư mục dưới `app/` mà tên (hoặc tên tổ tiên của nó) khớp `TIEN_TO_THU`. Máy **đếm
 * cây thư mục**, không đọc danh sách nào — nên một route dev mới mọc ra là tự động bị soi, kể cả
 * khi không ai nhớ cập nhật tệp này.
 *
 * Có chốt = trong `layout.tsx` của chính nó (hoặc của một tổ tiên vẫn nằm trong vùng dev) có gọi
 * `notFound()` kèm điều kiện `production`. Chỉ có `notFound()` mà không có điều kiện thì route
 * chết cả ở dev — đó là hỏng công cụ, nên cũng bị nêu, ở mức khác.
 *
 * ⛔ CHẶN (`--chan` → exit 1). Một route thử lọt vào bản bán ra là bề mặt sản phẩm nói dối.
 */

import { readdirSync, existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP = path.join(REPO, 'app');

/** Tên thư mục nói "đây là bàn thử". Thêm tiền tố mới thì thêm ở ĐÂY, một chỗ. */
const TIEN_TO_THU = /^(thu-|dev-|demo$|demo-|test-|__)/;

/** Thư mục không bao giờ là route. */
const BO_QUA = new Set(['api', 'node_modules']);

function quet(dir, duong = [], ra = []) {
  let muc;
  try { muc = readdirSync(dir, { withFileTypes: true }); } catch { return ra; }
  for (const e of muc) {
    if (!e.isDirectory() || BO_QUA.has(e.name) || e.name.startsWith('.')) continue;
    const duongMoi = [...duong, e.name];
    const laThu = duongMoi.some((seg) => TIEN_TO_THU.test(seg));
    const con = path.join(dir, e.name);
    if (laThu && existsSync(path.join(con, 'page.tsx'))) ra.push(duongMoi);
    quet(con, duongMoi, ra);
  }
  return ra;
}

/** Đi ngược từ route lên, dừng khi ra khỏi vùng dev — chốt ở tổ tiên dev vẫn tính là có chốt. */
function timChot(duong) {
  for (let i = duong.length; i >= 1; i--) {
    const seg = duong.slice(0, i);
    if (!seg.some((s) => TIEN_TO_THU.test(s))) break;
    const lay = path.join(APP, ...seg, 'layout.tsx');
    if (!existsSync(lay)) continue;
    const src = readFileSync(lay, 'utf8');
    if (!/notFound\s*\(/.test(src)) continue;
    const coDieuKien = /NODE_ENV\s*===\s*['"]production['"]|process\.env\.NODE_ENV/.test(src);
    return { tep: path.join('app', ...seg, 'layout.tsx'), coDieuKien };
  }
  return null;
}

const chan = process.argv.includes('--chan');
const routes = quet(APP);
console.log('── chốt chặn phát hành cho route dev/thử ──');

let ho = 0;
let cung = 0;
for (const r of routes.sort((a, b) => a.join('/').localeCompare(b.join('/')))) {
  const url = '/' + r.join('/');
  const chot = timChot(r);
  if (!chot) {
    ho++;
    console.log(`  🔴 ${url} — KHÔNG CÓ CHỐT, bản phát hành vào được`);
  } else if (!chot.coDieuKien) {
    cung++;
    console.log(`  🟡 ${url} — chốt CHẶN CẢ Ở DEV (${chot.tep}), mất luôn công cụ`);
  } else {
    console.log(`  ✅ ${url}  ← ${chot.tep}`);
  }
}

console.log(`\n  ${routes.length} route thử · ${ho} hở · ${cung} chặn quá tay`);
if (ho) {
  console.log('  Chữa: thêm `app/<route>/layout.tsx` gọi `notFound()` khi NODE_ENV === "production".');
  console.log('  Khuôn có sẵn ở `app/dev-bench-3d-2/layout.tsx` — chép, đừng nghĩ lại.');
}
if ((ho || cung) && chan) process.exit(1);
