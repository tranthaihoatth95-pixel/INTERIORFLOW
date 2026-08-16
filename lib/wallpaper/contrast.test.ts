/** Test `contrast.ts` — chạy: node_modules/.bin/sucrase-node lib/wallpaper/contrast.test.ts
 *
 * 📏 ĐÂY LÀ CỬA NGHIỆM THU V4 của phiếu P-O: tương phản **tại chân chữ**, đạt ở **mọi tổ hợp**
 * 5 bộ × 4 thời điểm × 2 theme. Không tổ hợp nào được bỏ cho dễ qua cửa.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  ALPHA_KINH_GOC,
  ALPHA_THEO_NAC,
  NGUONG,
  TOKEN,
  bangDayDu,
  doChanChu,
  hangTruot,
  nenChanChu,
} from './contrast';
import { WALLPAPER_SETS, bangMau } from './sets';
import { PERIODS, THEMES, type NacGiamChoi } from './types';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) { pass++; console.log('  ok  -', name); }
  else { fail++; console.log('  FAIL-', name); }
}

const ROOT = join(__dirname, '..', '..');
const CSS = readFileSync(join(ROOT, 'app', 'globals.css'), 'utf8');

/** Lấy giá trị token trong ĐÚNG khối theme (dark = khối `:root,\n:root[data-theme='dark']`). */
function tokenTrongKhoi(theme: 'dark' | 'light', ten: string): string {
  const moc =
    theme === 'dark'
      ? CSS.indexOf(":root[data-theme='dark']")
      : CSS.indexOf(":root[data-theme='light'] {");
  if (moc < 0) return '';
  const doan = CSS.slice(moc, moc + 4000);
  const m = doan.match(new RegExp(`--${ten}:\\s*([^;]+);`));
  return m ? m[1].trim() : '';
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

console.log('🔒 DRIFT-GUARD — bản sao token trong contrast.ts khớp app/globals.css');
{
  for (const theme of THEMES) {
    for (const ten of ['t1', 't2', 't3', 'card'] as const) {
      const gt = tokenTrongKhoi(theme, ten);
      const that = hexToRgb(gt);
      const khai = TOKEN[theme][ten];
      ok(
        `${theme}/--${ten} = ${gt} khớp bản sao [${khai.join(',')}]`,
        gt.startsWith('#') && that.join() === khai.join(),
      );
    }
    // --nen-mo-header là rgba(...) — kiểm cả màu lẫn alpha
    const gt = tokenTrongKhoi(theme, 'nen-mo-header');
    const m = gt.match(/rgba\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)[,\s/]+([\d.]+)\s*\)/);
    const khai = TOKEN[theme].nenMoHeader;
    ok(
      `${theme}/--nen-mo-header = ${gt} khớp bản sao + alpha ${ALPHA_KINH_GOC}`,
      !!m &&
        [m[1], m[2], m[3]].map(Number).join() === khai.join() &&
        Math.abs(Number(m[4]) - ALPHA_KINH_GOC) < 0.001,
    );
  }
}

console.log('V4 — BẢNG ĐẦY ĐỦ: 5 bộ × 4 thời điểm × 2 theme × 2 bề mặt × 3 bậc chữ');
{
  const bang = bangDayDu(0);
  ok('đúng 240 phép đo, không bỏ tổ hợp nào', bang.length === 5 * 4 * 2 * 2 * 3);
  ok(
    'phủ đủ 40 tổ hợp (bộ × thời điểm × theme)',
    new Set(bang.map((h) => `${h.setId}|${h.period}|${h.theme}`)).size === 40,
  );
  const truot = hangTruot(0);
  for (const t of truot) {
    console.log(
      `  ↳ TRƯỢT ${t.setId}/${t.period}/${t.theme}/${t.beMat}/${t.bac} = ${t.ratio} (< ${NGUONG})`,
    );
  }
  ok(`0 tổ hợp trượt ở nấc giảm chói mặc định (thấy ${truot.length})`, truot.length === 0);
}

console.log('V4 — in bảng số TẠI CHÂN CHỮ, bề mặt pill kính (chỗ nền THẬT SỰ lọt vào)');
{
  for (const theme of THEMES) {
    console.log(`  ── theme ${theme} ──`);
    for (const s of WALLPAPER_SETS) {
      const dong = PERIODS.map((p) => {
        const r = doChanChu(s, p, theme, 'pill-kinh', 0);
        return `${p}: t1 ${r[0].ratio} · t2 ${r[1].ratio} · t3 ${r[2].ratio}`;
      });
      console.log(`     ${s.id.padEnd(10)} | ${dong.join('  |  ')}`);
    }
  }
  ok('bảng số đã in đủ (bằng chứng cho báo cáo ⑦)', true);
}

console.log('V4 — nấc giảm chói CẮT ÁNH KIM, KHÔNG BAO GIỜ cắt độ đọc');
{
  for (const nac of [1, 2] as NacGiamChoi[]) {
    ok(`nấc ${nac}: 0 tổ hợp trượt`, hangTruot(nac).length === 0);
  }
  /* ⚠️ FINDING vòng 1 — khẳng định đầu tiên của tôi SAI, ghi lại thay vì sửa số cho đẹp:
   * tôi từng viết "nấc cao hơn ⇒ tương phản luôn TĂNG". Không đúng. Ở theme tối, ban đêm,
   * bảng màu nền có chặng TỐI HƠN cả `--nen-mo-header` (lum 0.002 < 0.0065) ⇒ đặc kính lên
   * làm nền hiệu dụng SÁNG hơn một chút ⇒ chữ kem giảm tương phản ~0.1.
   *
   * Bất biến ĐÚNG (và đúng nghĩa "cắt ánh kim, không cắt độ đọc") là: nấc càng cao thì nền
   * càng ÍT ẢNH HƯỞNG — tỉ số tiến đều về giá trị HẰNG SỐ của nấc 2. Cộng với: mọi nấc đều
   * vượt ngưỡng. Hai điều đó mới là thứ bảo vệ người dùng. */
  let tienVeHangSo = true;
  let viPham = '';
  for (const s of WALLPAPER_SETS) {
    for (const p of PERIODS) {
      for (const t of THEMES) {
        const a = doChanChu(s, p, t, 'pill-kinh', 0);
        const b = doChanChu(s, p, t, 'pill-kinh', 1);
        const c = doChanChu(s, p, t, 'pill-kinh', 2);
        for (let i = 0; i < a.length; i++) {
          const d0 = Math.abs(a[i].ratio - c[i].ratio);
          const d1 = Math.abs(b[i].ratio - c[i].ratio);
          if (d1 > d0 + 0.001) {
            tienVeHangSo = false;
            viPham = `${s.id}/${p}/${t}/${a[i].bac}: |n0-n2|=${d0.toFixed(2)} < |n1-n2|=${d1.toFixed(2)}`;
          }
        }
      }
    }
  }
  if (viPham) console.log('  ↳', viPham);
  ok('nấc càng cao, nền càng ít ảnh hưởng (tỉ số tiến đều về hằng số nấc 2)', tienVeHangSo);
  ok('nấc 2 = kính đặc hoàn toàn (alpha 1)', ALPHA_THEO_NAC[2] === 1);
  // nấc 2 ⇒ nền không còn ảnh hưởng ⇒ mọi bộ cho CÙNG một tỉ số
  const cung = new Set(
    WALLPAPER_SETS.flatMap((s) =>
      PERIODS.map((p) => doChanChu(s, p, 'dark', 'pill-kinh', 2)[2].ratio),
    ),
  );
  ok('nấc 2: tương phản thành HẰNG SỐ, không phụ thuộc bộ/giờ', cung.size === 1);
}

console.log('V4 — thẻ ĐẶC: nền không lọt vào (luật B1 "kính là VỎ, ruột ĐẶC")');
{
  const cung = new Set(
    WALLPAPER_SETS.flatMap((s) =>
      PERIODS.flatMap((p) => THEMES.map((t) => `${t}|${doChanChu(s, p, t, 'the-dac', 0)[2].ratio}`)),
    ),
  );
  ok('thẻ đặc chỉ có 2 giá trị (một cho mỗi theme), không đổi theo bộ/giờ', cung.size === 2);
}

console.log('V4 — SÀN THEME SÁNG là ràng buộc THẬT, không phải chọn theo mắt');
{
  // Tái hiện con số nêu trong docblock `sets.ts`: hạ nền sáng xuống ~0.80 là TRƯỢT.
  const { hslToRgb } = require('./sets') as typeof import('./sets');
  const t3 = TOKEN.light.t3;
  const { contrastRatio } = require('../adaptive-contrast') as typeof import('../adaptive-contrast');
  const thu = (l: number) => {
    const nen = hslToRgb(205, 0.05, l);
    return contrastRatio(t3, nenChanChu('light', 'pill-kinh', 0, nen));
  };
  const sanThat = thu(0.862);
  const haXuong = thu(0.8);
  console.log(`  ↳ sàn 0.862 → ${sanThat.toFixed(2)} · hạ xuống 0.80 → ${haXuong.toFixed(2)}`);
  ok(`sàn 0.862 ĐẠT (${sanThat.toFixed(2)} ≥ 4.5)`, sanThat >= NGUONG);
  ok(`hạ xuống 0.80 TRƯỢT (${haXuong.toFixed(2)} < 4.5) — ràng buộc có thật`, haXuong < NGUONG);
}

console.log('V4 — đo CỰC TRỊ chứ không đo trung bình (trung bình là cách giấu lỗi)');
{
  const s = WALLPAPER_SETS[0];
  const pal = bangMau(s, 'day', 'dark');
  const r = doChanChu(s, 'day', 'dark', 'pill-kinh', 0);
  // ca xấu nhất cho chữ SÁNG = chặng nền SÁNG nhất (stops[0])
  const bgSang = nenChanChu('dark', 'pill-kinh', 0, pal.stops[0]);
  const { contrastRatio } = require('../adaptive-contrast') as typeof import('../adaptive-contrast');
  const rSang = Math.round(contrastRatio(TOKEN.dark.t3, bgSang) * 100) / 100;
  ok('tỉ số báo ra đúng bằng ca xấu nhất (không phải trung bình)', r[2].ratio === rSang);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
