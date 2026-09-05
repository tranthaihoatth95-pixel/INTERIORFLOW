/** Đo ĐỘ BIẾN THIÊN BÊN TRONG dải (thứ làm nó đọc ra là ÁNH SÁNG chứ không phải một mảng xám). */
import sharp from '/home/user/INTERIORFLOW/node_modules/sharp/dist/index.mjs';

const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const lum = (c) => 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);

for (const theme of ['dark', 'light']) {
  const { data, info } = await sharp(`.nen-kiem/out/home-${theme}.png`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = (x, y) => { const i = (info.width * y + x) * info.channels; return [data[i], data[i + 1], data[i + 2]]; };
  // BĂNG TRÊN HIỆN VẬT: y 100..200, x 246..1194 — dải trần, không nhãn (nhãn ở y 64..88)
  const mau = [];
  for (let y = 100; y <= 200; y += 4) for (let x = 246; x <= 1194; x += 6) mau.push(px(x, y));
  const L = mau.map(lum);
  const min = Math.min(...L), max = Math.max(...L);
  const rgbMin = mau[L.indexOf(min)], rgbMax = mau[L.indexOf(max)];
  const nen = px(260, 760);
  console.log(JSON.stringify({
    theme,
    nenApp: nen,
    daiToiNhat: rgbMin, daiSangNhat: rgbMax,
    bienThienTrongDai_dL: +(max - min).toFixed(4),
    bienThienTrongDai_tp: +(((max + 0.05) / (min + 0.05))).toFixed(3),
    sangNhat_vs_nen_tp: +(((Math.max(max, lum(nen)) + 0.05) / (Math.min(max, lum(nen)) + 0.05))).toFixed(3),
    huong: max > lum(nen) ? 'dải SÁNG hơn nền' : 'dải TỐI hơn nền',
  }));
}
