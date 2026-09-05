#!/usr/bin/env node
/**
 * scripts/sinh-anh-chan-doan.mjs — sinh MỘT ảnh chẩn đoán tất định cho đường ống ảnh/texture.
 *
 * VÌ SAO KHÔNG DÙNG GỖ SỒI / ÓC CHÓ để dò: ảnh gỗ thật **hỏng mà vẫn trông ổn**. Mất map và chỉ
 * còn màu trung bình ⇒ vẫn ra một mảng nâu; lật ảnh ⇒ vân vẫn "trông giống gỗ"; sai tỉ lệ UV ⇒
 * vẫn là gỗ, chỉ khác thớ. Ảnh đẹp là ảnh dò tồi.
 *
 * Ảnh này cố ý XẤU và cố ý BẤT ĐỐI XỨNG để mọi kiểu hỏng đều lộ ngay bằng mắt:
 *   · ô cờ 4×4 lớn      → mất map ⇒ chỉ còn MỘT màu trung bình xám, không còn ô nào
 *   · chữ `IF` + `▲`    → lật ngang/dọc ⇒ chữ ngược, tam giác quay sai
 *   · góc đánh dấu 1234 → xoay 90° ⇒ số về sai góc
 *   · sọc dọc mảnh dần  → sai tỉ lệ UV ⇒ sọc dày/mảnh sai, hoặc bệt thành xám khi lấy mẫu sai
 *   · vạch đo 100 mm    → tỉ lệ vật lý sai ⇒ vạch không khớp cỡ thật của vật
 *   · một chấm đỏ LỆCH  → mọi phép lật/xoay đều đổi chỗ chấm này
 *
 * Kích thước 512×512, và ô cờ khai **1 chu kỳ = 400×400 mm** để kiểm `uvScaleMm`: dán lên bức
 * tường 4000 mm phải thấy **đúng 10 chu kỳ**, không phải 1 ảnh kéo giãn phủ cả tường.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const N = 512;
const O = N / 4; // 4×4 ô cờ

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${N}" height="${N}" shape-rendering="crispEdges">
<rect width="${N}" height="${N}" fill="#f2f2f2"/>
${[0, 1, 2, 3].flatMap((r) => [0, 1, 2, 3].map((c) => ((r + c) % 2 === 0
  ? `<rect x="${c * O}" y="${r * O}" width="${O}" height="${O}" fill="#141414"/>` : ''))).join('')}
<!-- sọc dọc MẢNH DẦN — sai tỉ lệ UV là bệt ngay, và bệt ở dải nào cho biết sai bao nhiêu -->
${Array.from({ length: 24 }, (_, i) => {
  const w = 10 - i * 0.36, x = 8 + i * 20;
  return `<rect x="${x.toFixed(1)}" y="${N - 96}" width="${Math.max(0.6, w).toFixed(2)}" height="56" fill="#e01b24"/>`;
}).join('')}
<!-- vạch đo: đúng 100 mm ở tỉ lệ khai 400 mm / 512 px -->
<rect x="8" y="${N - 30}" width="128" height="12" fill="#0a84ff"/>
<text x="144" y="${N - 19}" font-family="monospace" font-size="17" font-weight="700" fill="#0a84ff">100 mm</text>
<!-- chữ + tam giác: bắt LẬT -->
<text x="${N / 2}" y="${N / 2 - 6}" text-anchor="middle" font-family="monospace" font-size="104"
      font-weight="700" fill="#ffcc00" stroke="#141414" stroke-width="4">IF</text>
<polygon points="${N / 2},${N / 2 + 18} ${N / 2 - 42},${N / 2 + 96} ${N / 2 + 42},${N / 2 + 96}"
         fill="#00c07f" stroke="#141414" stroke-width="4"/>
<!-- bốn góc đánh số: bắt XOAY -->
${[['1', 26, 40], ['2', N - 26, 40], ['3', N - 26, N - 118], ['4', 26, N - 118]].map(([t, x, y]) =>
  `<text x="${x}" y="${y}" text-anchor="middle" font-family="monospace" font-size="34" font-weight="700"
         fill="#f2f2f2" stroke="#141414" stroke-width="5" paint-order="stroke">${t}</text>`).join('')}
<!-- chấm đỏ LỆCH TÂM: mọi phép lật/xoay đều đổi chỗ nó -->
<circle cx="${N * 0.78}" cy="${N * 0.24}" r="17" fill="#e01b24" stroke="#f2f2f2" stroke-width="4"/>
<rect x="1" y="1" width="${N - 2}" height="${N - 2}" fill="none" stroke="#141414" stroke-width="2"/>
</svg>`;

const dich = path.join(process.cwd(), 'public/textures/chan-doan');
fs.mkdirSync(dich, { recursive: true });
fs.writeFileSync(path.join(dich, 'chan-doan-512.svg'), svg);

const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
fs.writeFileSync(path.join(dich, 'chan-doan-512.png'), png);

/* Bản NHÁM (normal/roughness giả lập) — KHÔNG phải map thật của một vật liệu thật; chỉ để chứng
 * minh đường ống nhận được map PHI-MÀU (linear) khác đường map màu (sRGB). Gán nhầm colorSpace là
 * lệch gamma toàn cục — `pbr-three.ts` cảnh báo đúng ca này, nên phải có ảnh để thử. */
const rough = `<svg xmlns="http://www.w3.org/2000/svg" width="${N}" height="${N}">
<rect width="${N}" height="${N}" fill="#808080"/>
${[0, 1, 2, 3].flatMap((r) => [0, 1, 2, 3].map((c) => ((r + c) % 2 === 0
  ? `<rect x="${c * O}" y="${r * O}" width="${O}" height="${O}" fill="#1a1a1a"/>` : ''))).join('')}
</svg>`;
fs.writeFileSync(path.join(dich, 'chan-doan-rough-512.png'),
  await sharp(Buffer.from(rough)).png({ compressionLevel: 9 }).toBuffer());

const m = await sharp(path.join(dich, 'chan-doan-512.png')).metadata();
console.log(`ảnh chẩn đoán: ${m.width}×${m.height} · ${(png.length / 1024).toFixed(0)} KB → ${path.relative(process.cwd(), dich)}`);
console.log('quy ước: 1 chu kỳ ảnh = 400×400 mm ⇒ tường 4000 mm phải thấy ĐÚNG 10 chu kỳ.');
