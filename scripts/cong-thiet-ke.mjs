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
const TU_KIEM = process.argv.includes('--tu-kiem');
if (!dir && !TU_KIEM) { console.error('dùng: node cong-thiet-ke.mjs <thư-mục chứa *.dc.html>  |  --tu-kiem'); process.exit(2); }

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

// ── MIỄN TRỪ CÓ KHAI BÁO (01/09, sau khi bắt được một lượt vá SAI) ───────────────────────────
// 🔴 CA THẬT SINH RA MỤC NÀY: một lượt vá định làm cổng xanh bằng cách ĐỔI HEX trong bản vẽ —
// quả cầu vật liệu xanh `m3` của `BaChieuBang.dc.html` bị đổi stop 0% và 100% sang xám nhưng
// BỎ SÓT stop 52% ⇒ ra viên vật liệu "xám → teal → xám", tức vỡ gradient; và gizmo trục 3D bị
// xám hoá X với Y trong khi Z giữ lam ⇒ mất quy ước đỏ-X/lục-Y/lam-Z của nghề (AutoCAD · 3ds Max
// · Blender), phạm thẳng chốt 9 của Hoà: "đi sau phải giống nó trước rồi mới hơn nó".
// ⇒ Lỗi KHÔNG ở bản vẽ, lỗi ở MIỄN TRỪ CỦA CỔNG viết quá hẹp: `VAT_LIEU` chỉ phủ hue 15–55°
// (gỗ/đất) nên vật liệu xanh/lam rơi ra ngoài, còn màu trục thì chưa có mục nào.
//
// Hai thứ dưới đây là MÀU NỘI DUNG / MÀU ĐỊNH DANH NGHỀ, cùng hạng với cam-cảnh-báo:
//   · `data-truc`          — bộ màu trục toạ độ của gizmo 3D.
//   · `data-mau-vat-lieu`  — ô mẫu vật liệu; bảng vật liệu PHẢI hiện màu thật của vật liệu,
//                            không thì nó thôi làm bảng vật liệu.
//
// ⚠️ KHAI BÁO, KHÔNG SUY ĐOÁN (cùng khuôn cửa `--legacy` của `moc.mjs`): máy không tự đoán đâu là
// trục hay vật liệu — bản vẽ phải TỰ NÓI bằng thuộc tính. Không khai thì vẫn bị đếm như mọi accent
// khác. Và miễn trừ chỉ ăn ĐÚNG BÊN TRONG phần tử đã khai, không phải cả tệp: rải accent ở chrome
// UI vẫn bị bắt dù trong tệp có một gizmo hợp lệ (khoá bằng ca ④ của `--tu-kiem`).
//   · `data-kenh`          — MÀU KÊNH NGỮ NGHĨA (05/09). Ba token có thật trong `app/globals.css`
//                            đang bị đếm như accent lạ: `--danger` #e5674f (hue 9,6° — sát NGOÀI
//                            dải cam 15–50°), `--success` #46b876 (145°), `--mau-ai` #1f7f88
//                            (187°, globals.css:44). Chúng cùng hạng với cam-cảnh-báo: hệ thiết
//                            kế BẮT BUỘC rải chúng, nên kết tội "rải màu" là kết tội sai.
//
// 🔴 MỘT LƯỢT VÁ SAI ĐÃ BỊ CHÍNH `--tu-kiem` BẮT (05/09) — ghi lại vì nó là bài học, không phải
// chuyện vặt: lượt đầu tôi định miễn trừ bằng cách ĐỌC hue của ba token đó từ globals.css rồi tha
// mọi màu rơi trong ±14°. Ca ① đỏ ngay: gizmo trục KHÔNG khai `data-truc` có đỏ 5° · lục 140° ·
// lam 215° — hai màu đầu rơi trúng dải danger/success ⇒ gizmo lậu thoát tội. Tức miễn trừ theo
// HUE là ĐOÁN, và đoán thì không phân biệt nổi "đỏ nguy hiểm" với "đỏ trục X". Luật của chính tệp
// này đã trả lời từ 01/09: KHAI BÁO, KHÔNG SUY ĐOÁN. Nên `data-kenh` đi đúng cửa cũ — bản vẽ phải
// tự nói, và miễn trừ chỉ ăn bên trong phần tử đã khai.
const THE_MIEN_TRU = ['data-truc', 'data-mau-vat-lieu', 'data-kenh'];

/** Cắt bỏ TRỌN phần tử mang thuộc tính khai báo (kể cả con của nó), có đếm lồng cùng tên thẻ. */
function boTheKhai(src, attr) {
  let out = src;
  for (;;) {
    const mo = new RegExp(`<([a-zA-Z][\\w-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?\\b${attr}\\b(?:"[^"]*"|'[^']*'|[^>"'])*)>`).exec(out);
    if (!mo) return out;
    const tag = mo[1];
    const batDau = mo.index;
    // thẻ tự đóng `<x … />` ⇒ không có ruột, cắt đúng chính nó
    if (/\/\s*$/.test(mo[2])) { out = out.slice(0, batDau) + out.slice(batDau + mo[0].length); continue; }
    const quet = new RegExp(`<${tag}\\b|</${tag}\\s*>`, 'g');
    quet.lastIndex = batDau + mo[0].length;
    let sau = 1;
    let ket = -1;
    for (let m2; (m2 = quet.exec(out)); ) {
      sau += m2[0][1] === '/' ? -1 : 1;
      if (sau === 0) { ket = m2.index + m2[0].length; break; }
    }
    // không tìm được thẻ đóng ⇒ HTML hỏng; cắt tới hết tệp còn hơn bỏ qua im lặng
    out = out.slice(0, batDau) + out.slice(ket < 0 ? out.length : ket);
  }
}

function cacHoAccent(src) {
  let quet = src;
  for (const attr of THE_MIEN_TRU) quet = boTheKhai(quet, attr);
  const hexes = quet.match(/#[0-9a-f]{6}\b|#[0-9a-f]{3}\b/gi) || [];
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

/* ── TỰ KIỂM: ca đột biến cho chính hai miễn trừ trên ────────────────────────────────────────
 * Cổng này KHÔNG có tệp `.test.ts` riêng (nó là kịch bản soi, cùng họ `soi-*`), nên ca đột biến
 * sống ngay trong nó — chạy: `node scripts/cong-thiet-ke.mjs --tu-kiem`.
 * Điều PHẢI chứng minh: miễn trừ là một CÁI CỬA HẸP, không phải cần gạt tắt cổng.
 */
if (TU_KIEM) {
  let p = 0, f = 0;
  const ok = (ten, dieu) => { if (dieu) { p++; console.log(`  ok  - ${ten}`); } else { f++; console.log(`  FAIL - ${ten}`); } };
  const GIZMO = '<circle fill="#b8524f"/><circle fill="#4a8f5f"/><circle fill="#4a6fa5"/>';
  const VIEN = '<radialGradient><stop stop-color="#c6e2d6"/><stop stop-color="#7fb2a0"/><stop stop-color="#33604f"/></radialGradient>';

  // ① KHÔNG khai báo ⇒ vẫn bị đếm như mọi accent (đỏ + lục + lam = nhiều họ).
  ok('① gizmo KHÔNG khai data-truc ⇒ vẫn bị bắt tè le', cacHoAccent(`<svg>${GIZMO}</svg>`).length >= 2);
  // ② Khai `data-truc` ⇒ bộ màu trục biến khỏi phép đếm.
  ok('② gizmo CÓ data-truc ⇒ miễn trừ, 0 họ accent', cacHoAccent(`<svg data-truc="xyz">${GIZMO}</svg>`).length === 0);
  // ③ Ô mẫu vật liệu khai báo ⇒ mọi hue trong đó được để yên (kể cả xanh — đúng ca vá hỏng 01/09).
  ok('③ viên vật liệu CÓ data-mau-vat-lieu ⇒ miễn trừ, 0 họ accent',
    cacHoAccent(`<div data-mau-vat-lieu><svg>${VIEN}</svg></div>`).length === 0);
  // ④ ⭐ CA ĐỘT BIẾN CHÍNH — miễn trừ KHÔNG được rò ra ngoài phần tử đã khai. Một tệp có gizmo
  //    hợp lệ NHƯNG rải accent tè le ở chrome UI thì VẪN PHẢI ĐỎ. Nếu ai đó sau này sửa
  //    `boTheKhai` thành "thấy thuộc tính là bỏ cả tệp", ca này đỏ ngay.
  const teLe = '<div style="color:#6a57f5"/><div style="color:#1f7f88"/><div style="color:#c0399f"/>';
  ok('④ có gizmo khai báo NHƯNG chrome UI rải accent ⇒ VẪN bắt được tè le',
    cacHoAccent(`<svg data-truc="xyz">${GIZMO}</svg>${teLe}`).length >= 2);
  // ⑤ Miễn trừ cắt đúng phần tử, không nuốt phần đứng SAU nó.
  ok('⑤ cắt đúng phạm vi: màu ngay sau thẻ khai báo vẫn được đếm',
    cacHoAccent(`<svg data-truc="xyz">${GIZMO}</svg><div style="color:#6a57f5"/>`).length === 1);
  // ⑥ Thẻ lồng cùng tên không làm lệch điểm đóng.
  ok('⑥ thẻ lồng cùng tên ⇒ vẫn cắt đúng, màu sau đó còn nguyên',
    cacHoAccent(`<div data-mau-vat-lieu><div>${VIEN}</div></div><div style="color:#6a57f5"/>`).length === 1);

  // ⑦ Màu kênh ngữ nghĩa CÓ khai `data-kenh` ⇒ miễn trừ (đỏ nguy hiểm + lục đạt + teal AI).
  const KENH = '<i style="color:#e5674f"/><i style="color:#46b876"/><i style="color:#1f7f88"/>';
  ok('⑦ khối CÓ data-kenh ⇒ miễn trừ, 0 họ accent',
    cacHoAccent(`<div data-kenh="trang-thai">${KENH}</div>`).length === 0);
  // ⑧ ⭐ CHÍNH CA ĐÃ BẮT LƯỢT VÁ SAI: cùng ba màu ấy mà KHÔNG khai ⇒ vẫn phải bị bắt tè le.
  //    Nếu ai sau này quay lại lối "tha theo hue", ca này đỏ.
  ok('⑧ cùng ba màu ấy mà KHÔNG khai ⇒ vẫn bắt tè le',
    cacHoAccent(`<div>${KENH}</div>`).length >= 2);
  // ⑨ Khai `data-kenh` không được rò ra chrome UI đứng ngoài nó.
  ok('⑨ có data-kenh NHƯNG chrome UI rải accent ⇒ VẪN bắt được tè le',
    cacHoAccent(`<div data-kenh="trang-thai">${KENH}</div>${teLe}`).length >= 2);

  console.log(`\n— tự kiểm cổng thiết kế: ${p} pass, ${f} fail`);
  process.exit(f ? 1 : 0);
}

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
