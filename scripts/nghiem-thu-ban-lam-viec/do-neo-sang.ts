/**
 * DÒ NEO ĐỘ SÁNG cho nhánh nền SÁNG — tìm bộ neo thoả cả hai điều kiện cùng lúc:
 *   ① dải nền KHÔNG được tối hơn trang: `lumMin ≥ lum(--bg)` với MỌI bộ × MỌI chặng giờ
 *   ② dải vẫn phải KỂ ĐƯỢC GIỜ: biến thiên không phẳng lì, và bốn chặng còn phân biệt
 *      được với nhau (đêm tối hơn ngày)
 *
 * ⚠️ VÌ SAO PHẢI DÒ CHỨ KHÔNG CHỈNH TAY: nền trang sáng (lum 0.865) nên trần vật lý chỉ còn
 * [0.865 … 1.0] ⇒ biến thiên tối đa đạt được là **1.156**, trong khi dải cũ có bộ đạt 1.21.
 * Tức KHÔNG THỂ vừa "sáng hơn trang" vừa giữ nguyên biến thiên cũ — phải biết chính xác
 * mình đánh đổi bao nhiêu, thay vì chỉnh tới lúc "trông ổn".
 *
 * Sửa `DE_XUAT` rồi chạy lại để thử bộ neo khác:
 *   node_modules/.bin/sucrase-node scripts/nghiem-thu-ban-lam-viec/do-neo-sang.ts
 */
import { hslToRgb, WALLPAPER_SETS } from '../../lib/wallpaper/sets';

type Chang = 'night' | 'dawn' | 'day' | 'dusk';
type Rgb = [number, number, number];

function lum([r, g, b]: Rgb) {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

const BG_LIGHT = lum([242, 239, 233]); // --bg #f2efe9 — app/globals.css:327
const PERIODS: Chang[] = ['night', 'dawn', 'day', 'dusk'];

/* Ba hằng dưới CHÉP từ `lib/wallpaper/sets.ts` — nếu bên đó đổi thì đổi cả ở đây, nếu không
   bộ dò sẽ đo một thế giới khác với thế giới app đang vẽ. */
const HE_SO_BAO_HOA: Record<Chang, number> = { dawn: 1.0, day: 0.55, dusk: 0.95, night: 0.8 };
const DICH_HUE: Record<Chang, number> = { dawn: 8, day: 0, dusk: -10, night: -5 };
const SO_STOP = 4;

/** Neo ĐANG ĐỀ XUẤT (đã áp vào `sets.ts` 04/09). Đổi số ở đây để thử bộ khác. */
const DE_XUAT: Record<Chang, [number, number]> = {
  night: [0.943, 0.970],
  dawn: [0.951, 0.982],
  day: [0.960, 0.996],
  dusk: [0.944, 0.973],
};

console.log(`nền trang (light) lum = ${BG_LIGHT.toFixed(4)}`);
console.log(`trần vật lý của biến thiên khi phải ≥ nền trang: ${(1 / BG_LIGHT).toFixed(3)}\n`);

let xau = 0;
const btAll: number[] = [];
const theoChang: Record<string, number[]> = {};

for (const period of PERIODS) {
  const [lo, hi] = DE_XUAT[period];
  console.log(`${period}  neo [${lo}, ${hi}]`);
  theoChang[period] = [];
  for (const set of WALLPAPER_SETS) {
    const giua = (lo + hi) / 2;
    const nua = ((hi - lo) / 2) * set.spread;
    const lums: number[] = [];
    for (let i = 0; i < SO_STOP; i++) {
      const t = i / (SO_STOP - 1);
      const l = giua + nua - t * (nua * 2);
      const c = hslToRgb(
        set.hue + DICH_HUE[period],
        set.sat * HE_SO_BAO_HOA[period] * (0.85 + 0.3 * t),
        l,
      ) as Rgb;
      lums.push(lum(c));
    }
    const mn = Math.min(...lums);
    const mx = Math.max(...lums);
    btAll.push(mx / mn);
    theoChang[period].push((mn + mx) / 2);
    const dat = mn >= BG_LIGHT;
    if (!dat) xau++;
    console.log(
      `   ${set.id.padEnd(9)} min=${mn.toFixed(4)} max=${mx.toFixed(4)} bt=${(mx / mn).toFixed(3)}`
      + ` ${dat ? '✅' : '🔴 vẫn tối hơn trang'}`,
    );
  }
}

console.log(`\n⇒ ${xau} bảng còn tối hơn trang (cần 0)`);
console.log(`⇒ biến thiên: min=${Math.min(...btAll).toFixed(3)} max=${Math.max(...btAll).toFixed(3)}`);
const tb = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
console.log('⇒ độ sáng trung bình theo chặng (phải còn phân biệt được giờ):');
for (const p of PERIODS) console.log(`   ${p.padEnd(6)} ${tb(theoChang[p]).toFixed(4)}`);
