/**
 * lib/cad/block-library-infer.test.ts — CHỐT CHẶN hồi quy G-M1-19 (06/08).
 * Chạy: `node_modules/.bin/sucrase-node lib/cad/block-library-infer.test.ts`
 *
 * Chuyện đã xảy ra: bộ suy `elementType` theo tên layer (`element-infer.ts`) được cắm vào
 * `parseDxfEx()` và BẬT MẶC ĐỊNH. `parseDxf()` là lớp mỏng gọi thẳng vào đó ⇒ bộ suy tự chạy cả ở
 * `block-library.ts` `loadBlockDoc()`, nơi nạp 54 block .dxf của Thư viện.
 *
 * Vì sao sai: bộ suy đọc tên layer của MẶT BẰNG, nơi tên layer mô tả CẤU KIỆN (`A-Wall`,
 * `A-Column`). Thư viện thì đặt tên layer theo PHÒNG CHỨA ĐỒ (`NT_VAN_PHONG`, `NT_PHONG_KHACH`,
 * `NT_PHONG_NGU`) — token `phong` khớp luật "phòng · không gian" ⇒ sofa, giường, bàn làm việc, tủ
 * hồ sơ, ghế quầy bar đều thành `space`. Đo được **30/54 block · 455 hình**. Không phải lỗi lý
 * thuyết: `plan-present.ts` xếp `space` vào `role:'annotation'`, nên thả đồ từ Thư viện vào bản vẽ
 * rồi trình bày mặt bằng là cả cụm biến thành GHI CHÚ.
 *
 * File này khoá cả HAI vế, vì chỉ khoá một vế là hồi quy quay lại được:
 *   [1] HÀNH VI — nạp 54 file .dxf THẬT theo đúng cách `loadBlockDoc` nạp ⇒ 0 hình bị gán loại.
 *   [2] ĐƯỜNG GỌI — `block-library.ts` phải THẬT SỰ truyền `inferRules: null`. Không có vế này thì
 *       ai đó bỏ tuỳ chọn đi mà vế [1] vẫn xanh (vì [1] tự truyền tuỳ chọn, không đi qua file kia).
 *
 * ⚠️ Block thư viện muốn khai loại cấu kiện thì khai TƯỜNG MINH ở `LibraryBlockMeta` — đoán qua
 * tên layer là bịa ngữ nghĩa (K3).
 */

import fs from 'fs';
import path from 'path';
import { parseDxf } from './dxf';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean, extra = '') {
  if (cond) { pass += 1; console.log(`  ok  - ${name}`); }
  else { fail += 1; console.log(`  FAIL - ${name}${extra ? ` — ${extra}` : ''}`); }
}

const ROOT = path.join(__dirname, '..', '..');
const LIB_DIR = path.join(ROOT, 'public', 'cad-library');

function dxfFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...dxfFiles(f));
    else if (e.name.toLowerCase().endsWith('.dxf')) out.push(f);
  }
  return out;
}

console.log('\n[1] 54 block .dxf THẬT — nạp kiểu Thư viện thì KHÔNG hình nào bị gán loại cấu kiện');
{
  const files = dxfFiles(LIB_DIR);
  ok('tìm thấy kho block (đừng để test xanh vì 0 file)', files.length >= 40, `${files.length} file`);

  let dirty = 0;
  let dirtyEnts = 0;
  const viDu: string[] = [];
  for (const f of files) {
    const doc = parseDxf(fs.readFileSync(f, 'utf8'), { inferRules: null });
    const gan = doc.entities.filter((e) => e.elementType !== undefined);
    if (gan.length) {
      dirty += 1;
      dirtyEnts += gan.length;
      if (viDu.length < 3) viDu.push(`${path.relative(LIB_DIR, f)}: ${gan.length} hình`);
    }
  }
  ok('0 block bị gán elementType', dirty === 0, `${dirty} block / ${dirtyEnts} hình — ${viDu.join(' · ')}`);

  // Vế đối chứng: BẬT bộ suy thì bệnh cũ tái hiện. Nếu ca này không còn tái hiện được thì bảng
  // luật đã đổi, và người sửa cần đọc lại docstring trên trước khi gỡ file test này.
  let sick = 0;
  for (const f of files) {
    if (parseDxf(fs.readFileSync(f, 'utf8')).entities.some((e) => e.elementType !== undefined)) sick += 1;
  }
  ok('ca bệnh vẫn tái hiện khi BẬT bộ suy (chứng minh test có răng)', sick > 0, `${sick} block`);
}

console.log('\n[2] Đường gọi thật — block-library.ts phải tắt bộ suy, không chỉ test tự tắt');
{
  const src = fs.readFileSync(path.join(ROOT, 'lib', 'cad', 'block-library.ts'), 'utf8');
  const goi = src.match(/parseDxf\s*\([^)]*\)/g) ?? [];
  ok('có gọi parseDxf', goi.length > 0, JSON.stringify(goi));
  ok(
    'MỌI lời gọi parseDxf ở đây đều truyền inferRules: null',
    goi.every((g) => /inferRules\s*:\s*null/.test(g)),
    JSON.stringify(goi),
  );
}

console.log(`\n${path.basename(__filename)} — ${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
