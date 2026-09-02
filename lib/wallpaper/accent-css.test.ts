/**
 * Test `accent-css.ts` — chạy: node_modules/.bin/sucrase-node lib/wallpaper/accent-css.test.ts
 * (nằm sẵn trên đường `npm test`: `test:sweep` gom mọi `*.test.ts`.)
 *
 * ĐÂY LÀ TEST CỦA LƯỢT NỐI DÂY (chỉ đạo Hoà 01/09 11:20 — "accent đi theo bộ hình nền").
 * `mau-bo.test.ts` đã chứng minh CỔNG (`accentDat`/`soiCombo`) đúng 51/51 — tệp này KHÔNG lặp
 * lại việc đó, nó chỉ chứng minh `tokenAccentCuaBo()` GỌI ĐÚNG cổng đó và biến kết quả thành
 * đúng bốn chuỗi CSS, cộng đúng một điều mới: nhánh THOÁI LUI khi cổng đỏ.
 */
import {
  ACCENT_MAC_DINH,
  tokenAccentCuaBo,
} from './accent-css';
import { accentDat, accentRgb, bangMauCua, khoangSang } from './mau-bo';
import { WALLPAPER_SETS } from './sets';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) {
    pass++;
    console.log('  ok  -', name);
  } else {
    fail++;
    console.log('  FAIL-', name);
  }
}

/** Độ sáng tương đối WCAG của một hex — dùng để so "tối hơn", không so hex trực tiếp. */
function relLumHex(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

console.log('BỘ MẶC ĐỊNH — chưa ai chọn gì thì app KHÔNG đổi mặt');
{
  ok('WALLPAPER_SETS[0] vẫn là chan-troi', WALLPAPER_SETS[0].id === 'chan-troi');
  const t = tokenAccentCuaBo(WALLPAPER_SETS[0].id);
  ok('--accent bộ mặc định = hằng số đang ship #6a57f5', t.accent === ACCENT_MAC_DINH.accent);
  ok('--accent-strong bộ mặc định = hằng số đang ship #553ff3',
    t.accentStrong === ACCENT_MAC_DINH.accentStrong);
  ok('--accent-soft bộ mặc định khớp hằng số đang ship', t.accentSoft === ACCENT_MAC_DINH.accentSoft);
  ok('--accent-ring bộ mặc định khớp hằng số đang ship', t.accentRing === ACCENT_MAC_DINH.accentRing);
}

console.log('\nCẢ NĂM BỘ — accent phải THẬT SỰ đi theo bộ, và phải qua cổng WCAG (cả 2 theme)');
for (const s of WALLPAPER_SETS) {
  const bo = bangMauCua(s.id);
  const rgb = accentRgb(bo);
  /* 🔴 THÊM 02/09 — khi ca này đỏ, IN RA CỬA SỔ ĐỘ SÁNG HỢP LỆ.
     Trước đây nó chỉ báo "đỏ", nên người thêm một bộ mới phải MÒ giá trị `l`: tôi vừa mò hai
     lượt (0.5 rồi 0.48) và trượt cả hai. Cửa sổ hợp lệ phụ thuộc (hue, sat) nên không đoán
     được bằng cách nhìn một bộ hàng xóm — nó phải được TÍNH. `khoangSang()` đã có sẵn, cổng
     chỉ việc gọi. Một cổng nói được "sai, và đây là khoảng đúng" rẻ hơn nhiều lượt mò. */
  if (!accentDat(rgb)) {
    const cua = khoangSang(bo.accent.h, bo.accent.s);
    console.log(
      `        ↳ ${s.id}: l=${bo.accent.l} TRƯỢT. Cửa sổ hợp lệ cho (hue ${bo.accent.h}°, sat ${bo.accent.s}) = ` +
      (cua ? `[${cua[0].toFixed(3)} … ${cua[1].toFixed(3)}]` : 'KHÔNG CÓ — phải đổi hue hoặc sat, không kẹp được'),
    );
  }
  ok(`${s.id}: accentDat() xanh (accent hợp lệ cả theme sáng lẫn tối)`, accentDat(rgb));
  const t = tokenAccentCuaBo(s.id);
  ok(`${s.id}: không rơi về thoái lui (accentDat xanh ⇒ token ≠ ACCENT_MAC_DINH trừ chan-troi)`,
    s.id === 'chan-troi' || t.accent !== ACCENT_MAC_DINH.accent);
  ok(`${s.id}: accent-strong TỐI hơn accent gốc (đúng vai hover/active)`,
    relLumHex(t.accentStrong) < relLumHex(t.accent));
  ok(`${s.id}: accent-soft mang đúng alpha 0.14`, t.accentSoft.endsWith(', 0.14)'));
  ok(`${s.id}: accent-ring mang đúng alpha 0.55`, t.accentRing.endsWith(', 0.55)'));
}

console.log('\nCA ĐỘT BIẾN — cổng WCAG phải thật, không phải trang trí');
{
  // Đỏ tươi bão hoà cao, sáng vừa — chữ trắng/accent không đủ 4.5:1. Nếu accentDat() không
  // còn bắt được ca này (bị nới lỏng ở đâu đó), test này đỏ — đúng chỗ nó phải đỏ.
  const doTrot: [number, number, number] = [230, 60, 50];
  ok('accentDat() bắt được một màu trượt AA thật (không phải lời hứa suông)',
    accentDat(doTrot) === false);
}

console.log('\nSETID LẠ — không throw, thoái lui về bộ mặc định');
{
  const t = tokenAccentCuaBo('bo-khong-co-that');
  const macDinh = tokenAccentCuaBo(WALLPAPER_SETS[0].id);
  ok('setId không tồn tại → ra đúng token của WALLPAPER_SETS[0]',
    t.accent === macDinh.accent && t.accentStrong === macDinh.accentStrong);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
