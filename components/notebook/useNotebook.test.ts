/**
 * components/notebook/useNotebook.test.ts — G-M12-01 + G-M20-09 (07/08).
 *
 * `useNotebook.ts` là 1 trong 3 component rủi ro cao nhất chọn để test trong vùng sở hữu: đây
 * là "đường mất dữ liệu/câu trả lời" — trước khi sửa G-M20-09, lỗi HTTP (404/500) có thân JSON
 * hợp lệ bị đọc như thành công, khiến người dùng thấy câu trả lời AI RỖNG hoặc nguồn tài liệu
 * "processing" mãi mãi thay vì báo lỗi rõ. Hook dùng `useState`/`useEffect` nên không dựng được
 * (repo không có jsdom/@testing-library — xem `StoreHydrator.test.ts`); test THUẦN 2 phần:
 *  ① hàm `httpErrorMessage` (logic thật, thuần, export riêng cho việc này)
 *  ② bất biến cấu trúc: MỌI `res.json()` trong file phải có `if (!res.ok)` đứng NGAY TRƯỚC nó
 *     — quét bằng regex trên SOURCE THẬT (đúng khuôn `StoreHydrator.test.ts`), không phải DOM giả.
 *
 * Chạy: node_modules/.bin/sucrase-node components/notebook/useNotebook.test.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { httpErrorMessage } from './useNotebook';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL - ${label}`);
  }
}

console.log('httpErrorMessage — chữ lỗi thật, kèm mã trạng thái + ngữ cảnh (không phải chuỗi rỗng)');
{
  const m = httpErrorMessage(500, 'Hỏi Notebook');
  ok('chứa mã trạng thái', m.includes('500'));
  ok('chứa ngữ cảnh truyền vào', m.includes('Hỏi Notebook'));
  ok('không rỗng', m.length > 10);
  const m2 = httpErrorMessage(404, 'Tải nguồn lên');
  ok('đổi ngữ cảnh ra đúng chữ khác — không phải chuỗi hardcode 1 câu', m2 !== m && m2.includes('404'));
}

/* ---- Bất biến cấu trúc: mọi res.json() phải có "if (!res.ok)" NGAY TRƯỚC nó ---- */
const src = fs.readFileSync(path.join(__dirname, 'useNotebook.ts'), 'utf8');

/** Đúng logic dùng để quét file thật VÀ để chạy đối chứng — tách riêng để 2 lần gọi nhất quán. */
function everyResJsonGuarded(source: string): { guarded: number; unguarded: number } {
  const lines = source.split('\n');
  let guarded = 0;
  let unguarded = 0;
  for (let i = 0; i < lines.length; i += 1) {
    if (!/res\.json\(\)/.test(lines[i])) continue;
    // Cho phép "if (!res.ok) throw ..." nằm ở TỐI ĐA 3 dòng ngay trước — đủ chỗ cho fetch() nhiều dòng.
    const windowBefore = lines.slice(Math.max(0, i - 3), i).join('\n');
    // Chấp nhận CẢ 2 kiểu canh: `if (!res.ok) throw/return` (early-exit) HOẶC `if (res.ok) { … }`
    // (đọc JSON chỉ khi đúng nhánh thành công, kiểu `probe()`) — cả hai đều không đọc JSON mù.
    if (/if\s*\(\s*!res\.ok\s*\)/.test(windowBefore) || /if\s*\(\s*res\.ok\s*\)/.test(windowBefore)) guarded += 1;
    else unguarded += 1;
  }
  return { guarded, unguarded };
}

console.log('bất biến — TOÀN BỘ res.json() trong useNotebook.ts đều có res.ok đứng trước (G-M20-09)');
{
  const count = (src.match(/res\.json\(\)/g) || []).length;
  ok('file có ĐÚNG 4 chỗ gọi res.json() — probe + uploadFile + addTextOrUrl + ask (đo 07/08, đổi số thì phải cập nhật test)', count === 4);
  const { guarded, unguarded } = everyResJsonGuarded(src);
  ok('cả 4 chỗ đều được canh res.ok — 0 chỗ đọc JSON mù', unguarded === 0 && guarded === count);
}

/* ---- ĐỐI CHỨNG: chứng minh bộ quét CÓ RĂNG — snippet thiếu res.ok phải bị bắt ---- */
console.log('đối chứng — snippet CỐ TÌNH thiếu res.ok phải bị hàm quét bắt được (test không phải luôn xanh)');
{
  const brokenSnippet = `
async function ask() {
  const res = await fetch('/api/x');
  const data = await res.json();
  return data;
}`;
  const { guarded, unguarded } = everyResJsonGuarded(brokenSnippet);
  ok('snippet thiếu res.ok → hàm quét báo unguarded > 0 (bắt được lỗi giả lập)', unguarded === 1 && guarded === 0);

  const fixedSnippet = `
async function ask() {
  const res = await fetch('/api/x');
  if (!res.ok) throw new Error('lỗi');
  const data = await res.json();
  return data;
}`;
  const fixedResult = everyResJsonGuarded(fixedSnippet);
  ok('cùng snippet sau khi thêm res.ok → hàm quét báo sạch', fixedResult.unguarded === 0 && fixedResult.guarded === 1);
}

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
