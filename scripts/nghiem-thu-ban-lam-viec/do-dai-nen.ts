/**
 * ĐO DẢI NỀN so với nền trang — cả hai theme, đủ 4 chặng giờ × 5 bộ.
 *
 * Câu hỏi phải trả lời bằng SỐ: dải nền có TỐI HƠN trang không, và biến thiên trong dải còn
 * bao nhiêu (dải phải vẫn "kể được giờ", không được làm phẳng lì).
 *
 * ⚠️ Đo bằng chính `bangMau()` của app (không chép công thức) — sai số duy nhất còn lại là
 * lớp phủ/độ mờ khi vẽ lên màn, khai ở phần CHƯA CHẮC của báo cáo.
 *
 * Chạy: npx sucrase-node scripts/nghiem-thu-ban-lam-viec/do-dai-nen.mjs
 */
import { bangMau, WALLPAPER_SETS } from '../../lib/wallpaper/sets';

/** Độ sáng tương đối WCAG — dùng để so "sáng hơn/tối hơn" một cách khách quan. */
function lum([r, g, b]: [number, number, number]) {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
const hex = (h: string): [number, number, number] => [
  parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16),
];

/* --bg đo tại nguồn `app/globals.css` (dark :224 · light :327) */
const BG = { dark: hex('#0c0c0e'), light: hex('#f2efe9') } as const;
const PERIODS = ['night', 'dawn', 'day', 'dusk'] as const;

for (const theme of ['light', 'dark'] as const) {
  const bg = lum(BG[theme]);
  console.log(`\n════ THEME ${theme.toUpperCase()} — nền trang lum=${bg.toFixed(4)} ════`);
  let toiHon = 0;
  let tong = 0;
  for (const period of PERIODS) {
    const dong: string[] = [];
    for (const set of WALLPAPER_SETS) {
      const p = bangMau(set, period, theme);
      tong++;
      // "tối hơn trang" = điểm SÁNG NHẤT của dải vẫn thua nền trang
      const toi = p.lumMax < bg;
      if (toi) toiHon++;
      const bienThien = p.lumMax / Math.max(p.lumMin, 1e-6);
      dong.push(`${set.id.padEnd(9)} min=${p.lumMin.toFixed(4)} max=${p.lumMax.toFixed(4)} bt=${bienThien.toFixed(3)}${toi ? ' 🔴TỐI HƠN TRANG' : ''}`);
    }
    console.log(` ${period}:`);
    for (const d of dong) console.log('   ' + d);
  }
  console.log(` ⇒ ${toiHon}/${tong} bảng có ĐIỂM SÁNG NHẤT vẫn tối hơn nền trang`);
}
