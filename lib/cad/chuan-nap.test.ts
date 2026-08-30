/**
 * lib/cad/chuan-nap.test.ts — CHẠY CHUẨN NẠP TRÊN MỌI TỆP DXF CÓ TRONG REPO.
 *
 * Đây là cổng thi hành cho `chuan-nap.ts`. Nó nằm trong `npm test` nhờ khuôn `*.test.ts` sẵn có —
 * KHÔNG dựng bộ chạy thứ hai (luật 6: tái dùng khuôn canonical).
 *
 * ⚠️ Chỉ chạy trên DXF **của repo** (`public/cad-library/**`). Tuyệt đối không nạp DXF khách vào
 * đây — dữ liệu khách không được nằm trong repo (luật cứng 24/07).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { parseDxfEx } from './dxf';
import { demTho, chamChuanNap } from './chuan-nap';

const REPO = path.resolve(__dirname, '..', '..');

function timDxf(dir: string, ra: string[] = []): string[] {
  let muc: string[];
  try { muc = readdirSync(dir); } catch { return ra; }
  for (const e of muc) {
    const p = path.join(dir, e);
    if (statSync(p).isDirectory()) timDxf(p, ra);
    else if (e.toLowerCase().endsWith('.dxf')) ra.push(p);
  }
  return ra;
}

const tep = timDxf(path.join(REPO, 'public', 'cad-library'));
let fail = 0;
let tongThucThe = 0;

console.log(`chuan-nap — ${tep.length} tệp DXF trong public/cad-library/`);

if (tep.length === 0) {
  /* Không có tệp để chấm thì KHÔNG được tuyên xanh — đó là "PASS vì rỗng", một dạng PASS giả. */
  console.log('  🔴 KHÔNG có tệp DXF nào để chấm. Chuẩn nạp chưa được chứng minh trên gì cả.');
  process.exit(1);
}

for (const f of tep) {
  const ten = path.relative(REPO, f);
  const text = readFileSync(f, 'utf8');
  const tho = demTho(text);
  const { doc, report } = parseDxfEx(text);
  const kq = chamChuanNap(tho, report as never, doc.layers.length);
  tongThucThe += tho.tong;

  if (kq.dat) {
    console.log(`  ok  - ${ten}  (${tho.tong} thực thể · ${tho.lop.length} lớp)`);
  } else {
    fail++;
    console.log(`  FAIL- ${ten}`);
    for (const t of kq.tieuChi.filter((x) => !x.dat)) console.log(`        🔴 ${t.ten}: ${t.do}`);
  }
}

console.log(`\n  ${tep.length - fail}/${tep.length} tệp ĐẠT chuẩn nạp · ${tongThucThe} thực thể đã đối chiếu`);
console.log('  Đối chiếu bằng PHƯƠNG PHÁP KHÁC bộ đọc: `demTho()` quét văn bản DXF thô theo đặc tả');
console.log('  cặp (mã nhóm, giá trị). Dùng chính bộ đọc để kiểm bộ đọc là phép đo rỗng (M-59).');
if (fail) process.exit(1);
