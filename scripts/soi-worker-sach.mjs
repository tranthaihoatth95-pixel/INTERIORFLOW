#!/usr/bin/env node
/**
 * soi-worker-sach.mjs — CHUỖI IMPORT CỦA WEB WORKER PHẢI SẠCH.
 *
 * ══ CA THẬT, 30/08/2026 ══
 * Nhập DXF **hỏng hoàn toàn trong dev** và không ai biết. Lane 06 tìm ra gốc:
 *
 *   `lib/cad/dxf-worker.ts` chạy trong Web Worker (KHÔNG có `window`). Chuỗi import TĨNH
 *   `dxf → hatch → modify → store` kéo CAD store vào worker. Next dev-mode tiêm mã React Refresh
 *   vào mọi module có React/hook, và mã tiêm đó chạm `window` ở PHẠM VI MODULE
 *   ⇒ `ReferenceError: window is not defined` ⇒ **worker chết IM**, giao diện chỉ quay mãi.
 *
 * Ba điều làm nó nguy hiểm hơn một lỗi thường:
 *   ① Nó **chết im** — không toast, không lỗi đỏ, chỉ "đang nạp" mãi mãi.
 *   ② Guard `typeof window` trong store **KHÔNG cứu được** — thứ chạm `window` là mã trình biên
 *      dịch tiêm vào, không phải mã người viết.
 *   ③ Import TĨNH nên nó bundle **bất kể cờ tính năng bật hay tắt**.
 *
 * ══ VÌ SAO CẦN CỔNG, KHI ĐÃ CÓ CẢNH BÁO ══
 * Lane 06 đã ghi cảnh báo vào đầu `dxf-worker.ts` — đúng việc, nhưng chú thích **không tự bảo vệ
 * mình**. Người sau thêm một dòng `import` là chết lại, và chết im. Hôm nay repo đã sửa hai lần
 * cùng một khuôn lỗi (danh sách route viết tay · con trỏ tri thức): luật có chỗ nạp mà không có
 * dây bẫy thì nó chỉ giữ được đúng những thứ có mặt lúc luật ra đời.
 *
 * ══ NÓ CANH GÌ ══
 * Đi theo chuỗi import TĨNH từ mỗi tệp worker, và đỏ khi chạm phải:
 *   · tệp `.tsx`                    — thành phần React, chắc chắn bị tiêm React Refresh
 *   · module nhập `react`           — kể cả `.ts`, hook cũng bị tiêm
 *   · module nhập `zustand`         — kho trạng thái, đúng thứ đã kéo chết worker lần này
 * Chỉ đi theo import TƯƠNG ĐỐI (`./` `../`) và alias `@/` — thư viện ngoài không phải việc của cổng này.
 *
 * ⛔ CHẶN (`--chan` → exit 1). Lỗi này chết im, nên không được để nó lọt lần nữa.
 */

import { readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Tệp chạy trong Web Worker. Thêm worker mới thì thêm vào đây. */
const WORKER = ['lib/cad/dxf-worker.ts', 'lib/cad/dwg-worker.ts'];

const BAN = [
  { ten: 'tệp .tsx', thu: (f) => f.endsWith('.tsx') },
  { ten: 'nhập react', thu: (_, s) => /from\s+['"]react['"]/.test(s) },
  { ten: 'nhập zustand', thu: (_, s) => /from\s+['"]zustand/.test(s) },
];

const DUOI = ['', '.ts', '.tsx', '/index.ts', '/index.tsx'];

function giai(tu, spec) {
  let goc;
  if (spec.startsWith('@/')) goc = path.join(REPO, spec.slice(2));
  else if (spec.startsWith('.')) goc = path.resolve(path.dirname(path.join(REPO, tu)), spec);
  else return null; // thư viện ngoài — ngoài phạm vi cổng này
  /* ⚠️ SỬA NGAY SAU KHI DỰNG: bản đầu dùng `!existsSync(path.join(p,'.'))` để loại thư mục —
     câu đó LUÔN SAI, nên hàm trả null với mọi tệp và cổng chỉ đi tới đúng 1 module rồi tuyên
     "sạch". Một cổng đi tới 1 module là PHÉP ĐO HỎNG, không phải kết quả tốt. Bắt được vì con số
     `(1 module)` vô lý — `dxf-worker.ts` nhập rõ hai thứ. */
  for (const d of DUOI) {
    const p = goc + d;
    try { if (statSync(p).isFile()) return path.relative(REPO, p); } catch { /* thử đuôi kế */ }
  }
  return null;
}

/** Đi theo chuỗi, ghi lại ĐƯỜNG ĐI để báo lỗi chỉ được đúng chỗ phải cắt. */
function di(vao) {
  const daQua = new Set();
  const bat = [];
  const hangDoi = [[vao, [vao]]];
  while (hangDoi.length) {
    const [f, duong] = hangDoi.shift();
    if (daQua.has(f)) continue;
    daQua.add(f);
    let s; try { s = readFileSync(path.join(REPO, f), 'utf8'); } catch { continue; }
    if (f !== vao) {
      for (const b of BAN) if (b.thu(f, s)) { bat.push({ tep: f, vi: b.ten, duong }); break; }
    }
    /* ⚠️ BÁO OAN ĐÃ SỬA, ngay lượt đầu chạy được: khuôn cũ bắt cả `import type`. Nhưng
       `import type` bị XOÁ lúc biên dịch — không có cạnh nào ở runtime, nên không thể kéo gì vào
       worker. Cổng cũ vì thế tố `query.ts → store.ts` trong khi dòng thật là
       `import type { SnapSettings } from './store'`. Cổng kêu oan là cổng người ta học cách tắt,
       nên phải bỏ qua import chỉ-kiểu. `import { type X }` lẻ tẻ vẫn tính — nó là import thật. */
    for (const m of s.matchAll(/(?:^|\n)\s*(?:import|export)(?!\s+type\s)[\s\S]{0,200}?from\s+['"]([^'"]+)['"]/g)) {
      const con = giai(f, m[1]);
      if (con && !daQua.has(con)) hangDoi.push([con, [...duong, con]]);
    }
  }
  return { soModule: daQua.size, bat };
}

const chan = process.argv.includes('--chan');
console.log('── chuỗi import của Web Worker ──');
let tongBat = 0;
for (const w of WORKER) {
  if (!existsSync(path.join(REPO, w))) { console.log(`  ⚠️  ${w} — không còn tệp, gỡ khỏi danh sách`); continue; }
  const { soModule, bat } = di(w);
  if (!bat.length) { console.log(`  ✅ ${w}  (${soModule} module, sạch)`); continue; }
  tongBat += bat.length;
  console.log(`  🔴 ${w}  (${soModule} module) — ${bat.length} chỗ kéo mã KHÔNG chạy được trong worker:`);
  for (const b of bat) {
    console.log(`       ${b.tep}  ·  ${b.vi}`);
    console.log(`       đường đi: ${b.duong.join(' → ')}`);
  }
}

if (tongBat) {
  console.log('\n  Lỗi này CHẾT IM: worker tắt, giao diện chỉ quay mãi, không toast không lỗi đỏ.');
  console.log('  Chữa: cắt đúng một mắt trong đường đi ở trên — đổi sang `import type`, hoặc tách');
  console.log('  phần thuần ra tệp riêng. Guard `typeof window` KHÔNG cứu được: thứ chạm `window`');
  console.log('  là mã React Refresh do trình biên dịch tiêm, không phải mã người viết.');
  if (chan) process.exit(1);
} else {
  console.log(`\n  ✅ ${WORKER.length} worker, chuỗi import sạch.`);
}
