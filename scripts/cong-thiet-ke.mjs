#!/usr/bin/env node
// scripts/cong-thiet-ke.mjs — CỔNG MÁY cho bản vẽ Claude Design (.dc.html)
// Hoà lệnh 01/09: "xây luật bằng máy hết cho tao. cấm sai."
// Chạy: node scripts/cong-thiet-ke.mjs <thư-mục-design>   (exit 1 khi có vi phạm)
// Sẽ được nối vào npm run test:sweep khi vào repo (lease lượt 3).
//
// Luật máy đo được (nguồn: docs/GU-PROFILE.md §2 + IF-CHUAN-NEN.md + nguyên văn Hoà 31/08
// "màu xanh màu tím tè le vậy" — Hoà chê RẢI NHIỀU accent, KHÔNG cấm màu nào cụ thể;
// suy diễn "cấm teal" là lỗi của cl:00, Hoà bắt 01/09 11:18):
//  L1  ĐƠN SẮC + 1 ACCENT: trong một artboard chỉ MỘT họ accent sắc độ (ngoài thang xám
//      và cam-cảnh-báo). Xuất hiện ≥2 họ accent trong cùng tệp = "tè le" = lỗi.
//      Trần mỗi họ ≤ 8 lần/tệp (logo · CTA · trạng thái chọn · đèn chạy).
//      Ghi chú A2 (HOME-SPEC): teal #1f7f88 là ứng viên MÀU KÊNH AI (--mau-ai token thật
//      trong globals.css) — dùng teal cho phần tử AI KHÔNG phải lỗi nếu nó là họ accent
//      nhất quán; chốt cuối thuộc Hoà (A2 đang chờ).
//  L2  TOKEN THẬT: nền tối phải là bộ token app (#0c0c0e/#141417/#1a1a1e/#202024/#2a2a31),
//      chữ #f2f2f4/#d6d6db/#9e9ea8 — cấm bịa mã xám lạ chênh lệch.
//  L3  FONT: chỉ 'Be Vietnam Pro' (+ system fallback) và ui-monospace.
//  L4  KHÔNG DATA GIẢ LỘ LIỄU: cấm 'Lorem', 'placeholder', 'TODO', 'xxx'.
//  L5  MỖI TỆP LÀ MỘT ARTBOARD HỢP LỆ: có <x-dc>, có root kích thước cố định.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2];
if (!dir) { console.error('dùng: node cong-thiet-ke.mjs <thư-mục chứa *.dc.html>'); process.exit(2); }

// QĐ Hoà 11:20-11:21 01/09: "tao không ấn định teal hay tím quần què gì cả" —
// accent ĐI THEO BỘ HÌNH NỀN người dùng chọn. Máy vì thế KHÔNG neo mã màu cụ thể:
// nó trích MỌI màu bão hoà trong tệp, gom theo cung hue, và bắt lỗi khi một màn
// mang ≥2 HỌ accent (ngoài thang xám + cam-cảnh-báo + màu vật liệu/gỗ trong ô mẫu).
const TRAN_MOI_HO = 12; // trần cứng; 8 là chuẩn, 9–12 phải có lý do "một trạng thái chọn nhiều nét"

function hexToHsl(hex) {
  let h6 = hex.length === 4 ? hex.replace(/[0-9a-f]/gi, c => c === '#' ? '#' : c + c) : hex;
  const r = parseInt(h6.slice(1, 3), 16) / 255, g = parseInt(h6.slice(3, 5), 16) / 255, b = parseInt(h6.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  return { h, s, l };
}
const CAM_CANH_BAO = h => h >= 15 && h <= 50;   // cam/hổ phách — kênh cảnh báo, không tính là accent
const VAT_LIEU = (h, s, l) => h >= 15 && h <= 55 && s < 0.45; // gỗ/đất trong ô mẫu vật liệu
function cacHoAccent(src) {
  const hexes = src.match(/#[0-9a-f]{6}\b|#[0-9a-f]{3}\b/gi) || [];
  const dem = new Map(); // hueCluster(30°) -> count
  for (const hx of hexes) {
    const { h, s, l } = hexToHsl(hx.toLowerCase());
    if (s < 0.25 || l < 0.08 || l > 0.95) continue; // thang xám/nền — bỏ
    if (CAM_CANH_BAO(h) || VAT_LIEU(h, s, l)) continue;
    const cum = Math.round(h / 30) * 30 % 360;
    dem.set(cum, (dem.get(cum) || 0) + 1);
  }
  // gộp cụm kề nhau (cách 30°) thành một họ
  const cums = [...dem.keys()].sort((a, b) => a - b);
  const ho = [];
  for (const c of cums) {
    const cuoi = ho[ho.length - 1];
    if (cuoi && (c - cuoi.toi === 30 || (c === 330 && cuoi.tu === 0))) { cuoi.toi = c; cuoi.n += dem.get(c); }
    else ho.push({ tu: c, toi: c, n: dem.get(c) });
  }
  return ho;
}
const FONT_CAM = /font-family:\s*['"]?(?!Be Vietnam Pro|ui-monospace|-apple-system|monospace|system-ui)([A-Z][A-Za-z ]+)['"]?/g;
const DATA_GIA = /\b(lorem|ipsum|placeholder|TODO|FIXME)\b/gi;

let loi = 0, canhBao = 0;
const files = readdirSync(dir).filter(f => f.endsWith('.dc.html'));
if (files.length === 0) { console.error(`✗ không thấy .dc.html nào trong ${dir}`); process.exit(1); }

for (const f of files) {
  const src = readFileSync(join(dir, f), 'utf8');
  const bao = (msg, isLoi = true) => { console.log(`${isLoi ? '✗' : '⚠'} ${f}: ${msg}`); isLoi ? loi++ : canhBao++; };

  const ho = cacHoAccent(src);
  if (ho.length >= 2) bao(`L1 "tè le" — ${ho.length} họ accent cùng màn (${ho.map(x => `hue ${x.tu}°–${x.toi}°: ${x.n}`).join(' · ')}); luật là MỘT họ/màn`);
  for (const x of ho) {
    if (x.n > TRAN_MOI_HO) bao(`L1 accent hue ${x.tu}° xuất hiện ${x.n} > trần ${TRAN_MOI_HO} — đang rải màu, không còn là accent`);
    else if (x.n > 8) bao(`L1 accent hue ${x.tu}° xuất hiện ${x.n} (chuẩn ≤8) — kiểm mắt: phải là MỘT trạng thái chọn nhiều nét`, false);
  }

  const fontLa = [...src.matchAll(FONT_CAM)].map(m => m[1]).filter(n => !/Be Vietnam/.test(n));
  if (fontLa.length) bao(`L3 font lạ: ${[...new Set(fontLa)].join(', ')}`);

  const gia = src.match(DATA_GIA) || [];
  if (gia.length) bao(`L4 dấu vết data giả: ${[...new Set(gia.map(s => s.toLowerCase()))].join(', ')}`);

  if (!src.includes('<x-dc>')) bao('L5 thiếu <x-dc> — không phải artboard hợp lệ');
  if (!/width:\s*\d{3,4}px;\s*height:\s*\d{3,4}px/.test(src)) bao('L5 root không có kích thước cố định', false);
}

console.log(`\n— cổng thiết kế: ${files.length} artboard · ${loi} lỗi · ${canhBao} cảnh báo`);
process.exit(loi ? 1 : 0);
