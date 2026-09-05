/**
 * Test — VỎ KÍNH WIDGET PHẢI ĐỌC RA LÀ KÍNH, đo bằng số.
 * Chạy: node_modules/.bin/sucrase-node lib/wallpaper/kinh-hien.test.ts
 *
 * ── CA THẬT (02/09, ảnh 20:56) ───────────────────────────────────────────────────────────────
 * Kính hai tầng đọc ĐÚNG ở theme sáng: vành .55 cho thấy lưới caro xuyên qua, lõi .90 đặc —
 * mắt đọc ra "một tấm đặt trên một mặt". Ở theme TỐI thì vành và lõi **không phân biệt được**:
 * cả hai đều `rgba(26,26,30, …)` hoà lên nền `rgb(25,26,27)` — ba màu gần trùng nhau, nên thẻ
 * đọc ra một khối đặc, không ra kính.
 *
 * 📌 Cùng họ với lỗi MỰC-TRONG-DẢI vừa sửa (`caro-hien.test.ts`): lấy màu của vật NẰM TRONG
 * vùng màu của nền thì alpha bao nhiêu cũng không tách được nó ra. Alpha điều khiển ĐỘ MỜ, nó
 * không tạo ra ĐỘ TƯƠNG PHẢN. Hai lần trong một ngày, hai bề mặt khác nhau, cùng một cách sai.
 *
 * ⇒ Cổng này đo cái đang thiếu: vành có tách khỏi NỀN không, và lõi có tách khỏi VÀNH không.
 * Nó KHÔNG chấm đẹp — đậm nhạt là cá tính, phần đó Hoà chấm. Nó chỉ chặn ca "ba lớp một màu".
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { WALLPAPER_SETS, bangMau } from './sets';
import { relLuminance } from '../adaptive-contrast';
import type { Rgb, WallpaperTheme } from './types';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) { pass++; console.log('  ok  -', name); }
  else { fail++; console.log('  FAIL-', name); }
}

const ROOT = join(__dirname, '..', '..');
const CSS = readFileSync(join(ROOT, 'app', 'globals.css'), 'utf8');

/** Lấy token trong ĐÚNG khối theme — cùng khuôn `contrast.test.ts`, không đẻ cách đọc thứ hai. */
function token(theme: WallpaperTheme, ten: string): string {
  const moc = theme === 'dark'
    ? CSS.indexOf(":root[data-theme='dark']")
    : CSS.indexOf(":root[data-theme='light'] {");
  if (moc < 0) return '';
  // 🔴 SỬA 05/09 — TRƯỚC ĐÂY cắt cứng `moc + 4000` ký tự. Hoà nhánh làm chú thích trong khối
  // theme dài thêm, và `--nen-mo-vanh` rơi RA NGOÀI cửa sổ 4000 ⇒ test báo "token không khai
  // được ở theme tối" trong khi nó khai đầy đủ ở dòng 340. Báo nhầm kiểu này tốn đúng một
  // lượt đi tìm lỗi không tồn tại.
  // ⇒ Đọc tới ĐÚNG DẤU ĐÓNG của khối (`\n}` đầu tiên), không đoán độ dài.
  const het = CSS.indexOf('\n}', moc);
  const khoi = CSS.slice(moc, het < 0 ? CSS.length : het);
  const m = khoi.match(new RegExp(`--${ten}:\\s*([^;]+);`));
  return m ? m[1].trim() : '';
}

/** `rgba(r, g, b, a)` → [rgb, a]. */
function docRgba(s: string): { mau: Rgb; a: number } | null {
  const m = s.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?\s*\)/);
  if (!m) return null;
  return { mau: [Number(m[1]), Number(m[2]), Number(m[3])] as unknown as Rgb, a: m[4] ? Number(m[4]) : 1 };
}

function hoa(tren: Rgb, duoi: Rgb, a: number): Rgb {
  return [0, 1, 2].map((i) => Math.round(tren[i] * a + duoi[i] * (1 - a))) as unknown as Rgb;
}
function tiSo(x: Rgb, y: Rgb): number {
  const a = relLuminance(x);
  const b = relLuminance(y);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/* Ngưỡng — CỐ Ý THẤP, và nói rõ vì sao. Đây không phải ngưỡng ĐỌC CHỮ (4,5). Nó chỉ trả lời
   "mắt có tách được ba lớp này ra không". Cao hơn nữa là biến kính thành viền kẻ. */
const SAN_VANH_TREN_NEN = 1.15;
const SAN_LOI_TREN_VANH = 1.08;

const bo = WALLPAPER_SETS.find((s) => s.layer === 'caro')!;

console.log('[1] Token vành/lõi có mặt ở CẢ HAI theme');
for (const theme of ['dark', 'light'] as WallpaperTheme[]) {
  ok(`${theme}: --nen-mo-vanh khai được`, Boolean(docRgba(token(theme, 'nen-mo-vanh'))));
  ok(`${theme}: --nen-mo-loi khai được`, Boolean(docRgba(token(theme, 'nen-mo-loi'))));
}

console.log('\n[2] BA LỚP PHẢI TÁCH NHAU — nền → vành → lõi');
for (const theme of ['dark', 'light'] as WallpaperTheme[]) {
  const p = bangMau(bo, 'night', theme);
  const nen = p.stops[p.stops.length - 1];
  const v = docRgba(token(theme, 'nen-mo-vanh'))!;
  const l = docRgba(token(theme, 'nen-mo-loi'))!;
  const vanh = hoa(v.mau, nen, v.a);
  const loi = hoa(l.mau, vanh, l.a);
  const tVanh = tiSo(vanh, nen);
  const tLoi = tiSo(loi, vanh);
  console.log(`        ↳ ${theme}: nền ${nen.join(',')} → vành ${vanh.join(',')} → lõi ${loi.join(',')}`);
  ok(`${theme}: vành tách khỏi NỀN ${tVanh.toFixed(3)} ≥ ${SAN_VANH_TREN_NEN}`, tVanh >= SAN_VANH_TREN_NEN);
  ok(`${theme}: lõi tách khỏi VÀNH ${tLoi.toFixed(3)} ≥ ${SAN_LOI_TREN_VANH}`, tLoi >= SAN_LOI_TREN_VANH);
}

console.log('\n[3] ĐỐI CHỨNG — bản dark CŨ (vành cùng vùng màu với nền) phải TRƯỢT');
{
  /* Bản đang chạy trước lát này: vành dark = rgba(26,26,30,.55). Nếu ngưỡng ở [2] mà bản đó
     vẫn qua thì cổng không phân biệt được sai/đúng, tức nó vô dụng. */
  const p = bangMau(bo, 'night', 'dark');
  const nen = p.stops[p.stops.length - 1];
  const cu = hoa([26, 26, 30] as unknown as Rgb, nen, 0.55);
  const t = tiSo(cu, nen);
  console.log(`        ↳ bản CŨ dark: vành ${cu.join(',')} trên nền ${nen.join(',')} ⇒ ${t.toFixed(3)}`);
  ok(`bản CŨ dark trượt ngưỡng (${t.toFixed(3)} < ${SAN_VANH_TREN_NEN})`, t < SAN_VANH_TREN_NEN);
}

console.log('\n[4] KHÔNG ĐƯỢC PHÁ TRẦN ĐỌC — vỏ sáng lên thì chữ trên vỏ vẫn phải đọc được');
{
  /* `sets.ts:164`: chữ `--t3` trên pill kính đạt 4,5 khi kênh nền hiệu dụng ≤ 138. Vỏ widget là
     nền hiệu dụng của chữ trong widget, nên nó cũng phải dưới trần đó ở theme tối. */
  const p = bangMau(bo, 'night', 'dark');
  const nen = p.stops[p.stops.length - 1];
  const v = docRgba(token('dark', 'nen-mo-vanh'))!;
  const l = docRgba(token('dark', 'nen-mo-loi'))!;
  const loi = hoa(l.mau, hoa(v.mau, nen, v.a), l.a);
  ok(`dark: kênh cao nhất của LÕI ${Math.max(...loi)} ≤ 138 (chữ trên lõi còn đạt 4,5)`, Math.max(...loi) <= 138);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
