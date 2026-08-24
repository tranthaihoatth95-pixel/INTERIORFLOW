#!/usr/bin/env node
/**
 * scripts/soi-visual-source.mjs — MÁY SOI HỢP ĐỒNG NGUỒN THỊ GIÁC.
 *
 * Vì sao có: dự án này đã lặp đúng một vòng hỏng nhiều lần — *bản vẽ tốt có sẵn · production vẫn
 * cũ · rồi một agent khác thiết kế lại chính thứ đó*. Sổ giấy không chặn được vòng đó vì không ai
 * bị BẮT LỖI khi quên. Máy thì bắt được.
 *
 * ⚠️ CHẠY HOÀN TOÀN OFFLINE. Nó kiểm HỢP ĐỒNG của manifest, KHÔNG gọi mạng, không hỏi
 * Claude Design/Figma. Máy soi phụ thuộc mạng là máy soi sẽ bị tắt.
 *
 * Bắt 6 lỗi:
 *  ① entry canonical mà TỆP KHÔNG CÒN
 *  ② surface có route production mà KHÔNG có đích ngắm
 *  ③ HAI canonical cho cùng một surface/route
 *  ④ source figma mà thiếu file key / node
 *  ⑤ source claude-design mà thiếu projectId / đường dẫn artifact
 *  ⑥ đã đánh dấu obsolete/superseded mà vẫn còn gọi là canonical
 * Kèm cảnh báo (không chặn): entry `needsReview: true` · productionComponents trỏ vào tệp không có.
 *
 * Quy ước thoát: 0 = sạch · 1 = có lỗi ĐỎ. Cảnh báo vàng KHÔNG làm đỏ — máy soi đỏ vì thứ không
 * sửa được là cách nhanh nhất để người ta học cách bỏ qua nó.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST = resolve(ROOT, 'config/visual-source-of-truth.json');

const do_ = [];
const vang = [];

if (!existsSync(MANIFEST)) {
  console.error('❌ Không thấy config/visual-source-of-truth.json — mọi màn người-dùng-thấy đang không có hợp đồng nguồn.');
  process.exit(1);
}

let m;
try {
  m = JSON.parse(readFileSync(MANIFEST, 'utf8'));
} catch (e) {
  console.error(`❌ Manifest hỏng cú pháp JSON: ${e.message}`);
  process.exit(1);
}

const surfaces = Array.isArray(m.surfaces) ? m.surfaces : [];
if (surfaces.length === 0) do_.push('Manifest không có surface nào.');

/** Gom canonical theo route để bắt lỗi ③ — hai bản vẽ cùng nhận là chuẩn cho một chỗ. */
const canonicalTheoRoute = new Map();

for (const s of surfaces) {
  const id = s.surfaceId ?? '(thiếu surfaceId)';
  const src = s.source ?? {};
  const laCanonical = s.status === 'canonical';

  // ① tệp đích còn không
  if (src.path && !existsSync(resolve(ROOT, src.path))) {
    do_.push(`[${id}] source.path KHÔNG TỒN TẠI: ${src.path}`);
  }

  // ② có route mà không có đích ngắm
  if (s.productionRoute && !src.path) {
    do_.push(`[${id}] có productionRoute "${s.productionRoute}" nhưng KHÔNG có đích ngắm (source.path trống).`);
  }

  // ③ hai canonical cho cùng một route
  if (laCanonical && s.productionRoute && s.productionRoute !== '*') {
    const truoc = canonicalTheoRoute.get(s.productionRoute);
    if (truoc) do_.push(`Route "${s.productionRoute}" có HAI canonical: "${truoc}" và "${id}". Mỗi surface chỉ được MỘT.`);
    else canonicalTheoRoute.set(s.productionRoute, id);
  }

  // ④ figma phải có bằng chứng
  if (src.type === 'figma') {
    const f = src.figma ?? {};
    if (!f.fileKey || !f.node) {
      do_.push(`[${id}] khai source.type=figma nhưng thiếu fileKey/node. Cấm gọi là Figma khi không chỉ ra được tệp thật.`);
    }
  }

  // ⑤ claude-design phải có bằng chứng
  if (src.type === 'claude-design') {
    const c = src.claudeDesign ?? {};
    if (!c.projectId || !c.path) {
      do_.push(`[${id}] khai source.type=claude-design nhưng thiếu projectId/path. Đẩy-lên-để-xem KHÔNG biến repo-html thành claude-design.`);
    }
  }

  // ⑥ obsolete mà vẫn canonical
  const noiDung = JSON.stringify(s).toLowerCase();
  if (laCanonical && /superseded|obsolete|bị bác|lỗi thời/.test(noiDung)) {
    do_.push(`[${id}] đang là canonical NHƯNG nội dung tự khai superseded/bị bác. Chọn một.`);
  }

  // cảnh báo vàng
  if (s.needsReview === true) {
    vang.push(`[${id}] needsReview=true — ${s.needsReviewReason ?? 'chưa ghi lý do'}`);
  }
  for (const c of s.productionComponents ?? []) {
    if (!c.includes('*') && !existsSync(resolve(ROOT, c))) {
      vang.push(`[${id}] productionComponents trỏ vào tệp không có: ${c}`);
    }
  }
}

const soCanonical = surfaces.filter((s) => s.status === 'canonical').length;
const soDaShip = surfaces.filter((s) => s.productionMatch?.status === 'pass').length;

console.log(`\nSOI NGUỒN THỊ GIÁC — ${surfaces.length} surface · ${soCanonical} canonical · ${soDaShip} đã chứng minh ship`);
if (m.partial) console.log(`⚠️  MANIFEST CHƯA ĐỦ: ${m.partialReason ?? ''}`);

for (const v of vang) console.log(`🟡 ${v}`);
for (const d of do_) console.log(`❌ ${d}`);

if (do_.length) {
  console.log(`\n❌ ${do_.length} lỗi hợp đồng.\n`);
  process.exit(1);
}
console.log(`\n✅ Hợp đồng nguồn thị giác sạch.${vang.length ? ` (${vang.length} cảnh báo, không chặn)` : ''}\n`);
