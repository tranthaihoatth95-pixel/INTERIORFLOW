#!/usr/bin/env node
/**
 * soi-so-khong-ngay.mjs — SỐ ĐO VIẾT TAY MÀ KHÔNG CÓ NGÀY ĐO LÀ MỘT LỜI NÓI DỐI CÓ HẠN SỬ DỤNG.
 *
 * ══ CA THẬT — Hoà cảnh báo 30/08/2026 ══
 *   *"Cảnh báo nội dung đã cũ. Tôi không chắc, nhưng vẫn nhắc — vì nếu Claude sau trỏ vào đây
 *   mà đọc thì là thảm hoạ nha."*
 *
 * Bảng 4173 hiện những thẻ như: *"Hiện 81 bức tường lên màn. Máy đọc được rồi — 12.274 nét →
 * 81 tường · 286,0 m · 23 ms."* Mọi con số đó **viết tay vào sổ**, đúng tại một thời điểm.
 * Sổ không có ô ngày ⇒ chúng **không bao giờ hết hạn**, và một phiên nguội đọc chúng như hiện trạng.
 *
 * Đây chính là cơ chế đẻ ra **SỰ THẬT BẨN** (`IF-SKILL-HOA-DAY.md` §7), nhưng ở dạng độc hơn:
 * sự thật bẩn thường lộ ra khi ai đó đo lại; **số không ngày thì không ai biết là phải đo lại**.
 *
 * ⚠️ Nó KHÁC cổng `soat-toan-dien`: cổng đó chấm `bang` — thứ MÁY tự chạy được, nên luôn tươi.
 * Cổng này canh phần CHỮ do người viết, thứ máy không chạy được và vì thế không tự tươi.
 *
 * ══ NÓ CANH GÌ ══
 * Mọi chuỗi mô tả trong sổ mà CHỨA SỐ ĐO (kèm đơn vị, hoặc số ≥ 3 chữ số / có dấu phân cách)
 * thì mục đó BẮT BUỘC có trường `do: 'YYYY-MM-DD'`. Thiếu ⇒ đỏ.
 * Số thứ tự, mã lane, phiên bản (`v1`, `§7`, `2 mức`) KHÔNG tính là số đo.
 *
 * ⛔ CHẶN (`--chan` → exit 1). Cách chữa là ghi ngày, hoặc bỏ con số ra khỏi chữ.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SO = path.join(REPO, 'scripts/bos-so-viec.mjs');

/** Số ĐO: có đơn vị đi kèm, hoặc là số lớn/có dấu phân cách. Không bắt số thứ tự nhỏ. */
const CO_SO_DO = [
  /\d[\d.,]*\s*(ms|s\b|px|MB|GB|KB|m\b|mm|cm|%|nét|tệp|gói|dòng|mục|ảnh|tường|module|ký tự)/i,
  /\b\d{1,3}[.,]\d{3}\b/,          // 12.274 · 1,580
  /\b\d{3,}\b/,                     // 175 · 8100
];

const src = readFileSync(SO, 'utf8');
const chan = process.argv.includes('--chan');

/* Cắt sổ thành từng mục theo dấu mở `{` ở đầu một phần tử mảng. */
const muc = [];
const re = /\n\s{2}\{([\s\S]*?)\n\s{2}\},/g;
let m;
while ((m = re.exec(src))) {
  const than = m[1];
  const ma = /\bma:\s*'([^']+)'/.exec(than)?.[1] ?? '(không mã)';
  const chuoi = [...than.matchAll(/\b(ten|y|mo|ghi):\s*'((?:[^'\\]|\\.)*)'/g)].map((x) => ({ o: x[1], v: x[2] }));
  const coNgay = /\bdo:\s*'\d{4}-\d{2}-\d{2}'/.test(than);
  muc.push({ ma, chuoi, coNgay, dong: src.slice(0, m.index).split('\n').length + 1 });
}

console.log('── số đo viết tay trong sổ việc · phải có NGÀY ĐO ──');
console.log(`  (số máy tự chạy ra thì luôn tươi — cổng này chỉ canh phần CHỮ do người viết)`);

let loi = 0;
for (const M of muc) {
  const dinh = M.chuoi.filter((c) => CO_SO_DO.some((r) => r.test(c.v)));
  if (!dinh.length || M.coNgay) continue;
  loi++;
  console.log(`  🔴 ${M.ma}  (dòng ~${M.dong}) — có số đo, KHÔNG có \`do:\``);
  for (const d of dinh) console.log(`       ${d.o}: "${d.v.slice(0, 78)}"`);
}

if (loi) {
  console.log(`\n  🔴 ${loi} mục mang số đo mà không ghi ngày đo.`);
  console.log('  Một phiên nguội đọc sổ này KHÔNG có cách nào biết con số đã cũ hay còn đúng.');
  console.log("  Chữa: thêm  do: 'YYYY-MM-DD'  vào mục — hoặc bỏ con số ra khỏi chữ mô tả.");
  console.log('  ⛔ Không có cờ bỏ qua. Số không ngày là số không dùng được.');
  if (chan) process.exit(1);
} else {
  console.log(`\n  ✅ ${muc.length} mục — mọi số đo viết tay đều có ngày đo.`);
}
