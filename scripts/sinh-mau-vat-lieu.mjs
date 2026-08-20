#!/usr/bin/env node
/**
 * scripts/sinh-mau-vat-lieu.mjs — SINH ảnh mẫu vật liệu + ảnh tham chiếu bằng CHƯƠNG TRÌNH.
 *
 * VÌ SAO CÓ TỆP NÀY (phiếu DEMO-SACH, 20/08): kho `LibraryAsset` hiện có 1612 mục — 682 mang
 * tên khách thật, ~930 là ảnh đổ đống tên băm. KHÔNG có bộ tư liệu tuyển nào để demo. Bộ tư
 * liệu demo phải **sạch pháp lý tuyệt đối** (LUẬT NỀN TẢNG `CLAUDE.md`: IF là sản phẩm bán ra,
 * không dính tên/tài sản của studio nào) ⇒ KHÔNG tải ảnh từ mạng, KHÔNG chép ảnh khách.
 * Cách đúng và rẻ nhất: **vẽ bằng mã**, tất định, 0 rủi ro bản quyền.
 *
 * Tất định: mọi nhiễu đi qua PRNG mulberry32 có hạt cố định ⇒ chạy 10 lần ra 10 tệp byte-y-hệt.
 * Kiểm: `node scripts/sinh-mau-vat-lieu.mjs && shasum -a256 public/mau-vat-lieu/*.png`
 *
 * ⚠️ Đây là ảnh MINH HOẠ vật liệu (đủ để phân biệt vân/tông ở cỡ thẻ ≥168px theo chốt 07/08),
 * KHÔNG phải texture PBR chụp thật. Đừng dùng làm albedo cho render nghiệm thu chất lượng.
 *
 * Ghi ra: public/mau-vat-lieu/*.png (không đụng public/library-assets — kho thật của app).
 */
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const CANH = 512;
const RA = path.resolve(process.cwd(), 'public/mau-vat-lieu');

/** PRNG tất định — cùng hạt ⇒ cùng dãy số ⇒ cùng tệp PNG. */
function mulberry32(hat) {
  let a = hat >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const kep = (v) => (v < 0 ? 0 : v > 255 ? 255 : v | 0);
const hex2rgb = (h) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];
const tron = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

/** Nhiễu giá trị mượt (value noise) — nội suy song tuyến trên lưới thưa. */
function nhieuMuot(rnd, o) {
  const g = new Float32Array((o + 1) * (o + 1));
  for (let i = 0; i < g.length; i++) g[i] = rnd();
  return (x, y) => {
    const fx = x * o, fy = y * o;
    const x0 = Math.floor(fx), y0 = Math.floor(fy);
    const tx = fx - x0, ty = fy - y0;
    const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    const at = (i, j) => g[Math.min(o, j) * (o + 1) + Math.min(o, i)];
    const a = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * sx;
    const b = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * sx;
    return a + (b - a) * sy;
  };
}

/** Vẽ một mẫu: ham(x,y,rnd,fbm) trả [r,g,b] 0..255. */
async function ve(ten, hat, ham) {
  const rnd = mulberry32(hat);
  const n1 = nhieuMuot(rnd, 8), n2 = nhieuMuot(rnd, 24), n3 = nhieuMuot(rnd, 64);
  const fbm = (x, y) => n1(x, y) * 0.55 + n2(x, y) * 0.3 + n3(x, y) * 0.15;
  const grain = mulberry32(hat ^ 0x9e3779b9);
  const buf = Buffer.alloc(CANH * CANH * 3);
  for (let y = 0; y < CANH; y++) {
    for (let x = 0; x < CANH; x++) {
      const u = x / CANH, v = y / CANH;
      const c = ham(u, v, fbm);
      // hạt mịn chung — giữ mẫu khỏi trông "phẳng như vector"
      const h = (grain() - 0.5) * 7;
      const i = (y * CANH + x) * 3;
      buf[i] = kep(c[0] + h);
      buf[i + 1] = kep(c[1] + h);
      buf[i + 2] = kep(c[2] + h);
    }
  }
  const png = await sharp(buf, { raw: { width: CANH, height: CANH, channels: 3 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(path.join(RA, ten), png);
  return { ten, bytes: png.length };
}

/** Vân gỗ: dải dọc + thớ uốn + vài mắt gỗ nhạt. */
const go = (nhat, dam) => (u, v, fbm) => {
  const uon = fbm(u * 1.4, v * 0.35) * 0.22;
  const song = Math.sin((u + uon) * Math.PI * 2 * 9) * 0.5 + 0.5;
  const tho = fbm(u * 6, v * 1.2) * 0.35;
  const t = Math.min(1, Math.max(0, song * 0.55 + tho * 0.7));
  return tron(hex2rgb(nhat), hex2rgb(dam), t);
};

/** Đá vân: nền sáng + mạch vân mảnh chạy chéo. */
const daVan = (nen, mach, dam) => (u, v, fbm) => {
  const w = fbm(u * 1.1, v * 1.1);
  const d = Math.abs(Math.sin((u * 0.8 + v * 1.2 + w * 1.6) * Math.PI * 3));
  const manh = Math.pow(1 - Math.min(1, d * 3.2), 3); // vân mảnh, rìa mềm
  const bui = fbm(u * 5, v * 5) * 0.18;
  let c = tron(hex2rgb(nen), hex2rgb(dam), bui);
  return tron(c, hex2rgb(mach), manh * 0.85);
};

/** Terrazzo: nền xi măng + hạt đá tròn rải tất định. */
function terrazzo(nen, hatMau) {
  const r = mulberry32(4242);
  const hats = Array.from({ length: 190 }, () => ({
    x: r(), y: r(), b: 0.012 + r() * 0.026, m: hatMau[(r() * hatMau.length) | 0],
  }));
  return (u, v, fbm) => {
    let c = tron(hex2rgb(nen), [235, 233, 228], fbm(u * 4, v * 4) * 0.25);
    for (const h of hats) {
      const dx = u - h.x, dy = v - h.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < h.b) c = tron(c, hex2rgb(h.m), d < h.b * 0.82 ? 1 : 0.45);
    }
    return c;
  };
}

/** Vải dệt: sợi ngang + sợi dọc đan nhau. */
const vai = (nhat, dam) => (u, v, fbm) => {
  const sd = Math.sin(u * Math.PI * 2 * 78) * 0.5 + 0.5;
  const sn = Math.sin(v * Math.PI * 2 * 78) * 0.5 + 0.5;
  const dan = ((Math.floor(u * 78) + Math.floor(v * 78)) % 2 === 0 ? sd : sn) * 0.6;
  const xo = fbm(u * 3, v * 3) * 0.4;
  return tron(hex2rgb(nhat), hex2rgb(dam), Math.min(1, dan * 0.7 + xo * 0.5));
};

/** Kim loại xước: gradient dọc + vệt xước ngang rất mảnh. */
const kimLoai = (toi, sang) => (u, v, fbm) => {
  const anh = Math.pow(1 - Math.abs(v - 0.38) * 1.5, 2); // dải sáng lệch trên
  const xuoc = (fbm(u * 90, v * 1.5) - 0.5) * 0.28;
  const t = Math.min(1, Math.max(0, anh * 0.85 + xuoc));
  return tron(hex2rgb(toi), hex2rgb(sang), t);
};

/** Sơn matt: gần trơn, chỉ có vi hạt + biến thiên rất nhẹ. */
const son = (mau) => (u, v, fbm) => tron(hex2rgb(mau), hex2rgb('#ffffff'), fbm(u * 2, v * 2) * 0.07);

/**
 * Ảnh tham chiếu — KHÔNG giả làm ảnh chụp. Đây là **nghiên cứu ánh sáng**: dải sáng theo giờ
 * đổ trên mặt phẳng tường/sàn, đúng thứ "ánh sáng kể giờ" IF nói tới, và trung thực về việc
 * nó do máy vẽ (hình học phẳng, không chi tiết giả).
 */
const anhSang = (gio) => {
  // gio 0..1: 0 = sáng sớm lạnh, 1 = chiều muộn ấm
  const amGoc = tron(hex2rgb('#2b3440'), hex2rgb('#3a2f28'), gio);
  const amSang = tron(hex2rgb('#cfd8de'), hex2rgb('#e8c79a'), gio);
  const goc = 0.35 + gio * 0.5;
  return (u, v, fbm) => {
    const chanTuong = 0.62; // đường giao tường ↔ sàn
    const laSan = v > chanTuong;
    let nen = laSan ? tron(amGoc, [0, 0, 0], 0.25) : amGoc;
    // vệt nắng chéo qua cả tường lẫn sàn
    const s = u - (v - chanTuong) * (laSan ? 0.9 : 0) - goc;
    const dai = Math.exp(-Math.pow(s / 0.16, 2));
    const toa = Math.exp(-Math.pow((u - goc) / 0.55, 2)) * 0.35;
    let c = tron(nen, amSang, Math.min(1, dai * (laSan ? 0.95 : 0.55) + toa));
    // tối dần bốn góc + vi hạt qua fbm
    const vig = 1 - (Math.pow(u - 0.5, 2) + Math.pow(v - 0.5, 2)) * 0.85;
    c = c.map((x) => x * vig);
    return tron(c, [255, 255, 255], fbm(u * 3, v * 3) * 0.05);
  };
};

const BO = [
  ['go-soi-trang.png', 101, go('#d9c3a2', '#a8865c')],
  ['go-oc-cho.png', 102, go('#6b4a35', '#33221a')],
  ['da-cam-thach-trang.png', 103, daVan('#efeeea', '#9aa0a4', '#dcdad4')],
  ['da-terrazzo-xam.png', 104, terrazzo('#c9c7c1', ['#6f6f6b', '#e6e3dc', '#8c7f70', '#3f3f3d'])],
  ['vai-lanh-be.png', 105, vai('#d8cfbe', '#a4977f')],
  ['kim-loai-dong-xuoc.png', 106, kimLoai('#5b4626', '#d8b478')],
  ['son-matt-trang-nga.png', 107, son('#ece7dd')],
  ['tham-chieu-anh-sang-som.png', 201, anhSang(0.15)],
  ['tham-chieu-anh-sang-chieu.png', 202, anhSang(0.9)],
];

async function main() {
  await mkdir(RA, { recursive: true });
  const kq = [];
  for (const [ten, hat, ham] of BO) kq.push(await ve(ten, hat, ham));
  for (const r of kq) console.log(`${r.ten.padEnd(34)} ${String(r.bytes).padStart(7)} B`);
  console.log(`\n${kq.length} tệp → ${RA}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
