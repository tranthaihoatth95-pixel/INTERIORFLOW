/**
 * components/studio/mot-cho-dung.test.ts — MÁY CANH LUẬT **MỘT CHỖ ĐỨNG** cho Vitals (04/09).
 * Chạy: `node_modules/.bin/sucrase-node components/studio/mot-cho-dung.test.ts`
 *
 * VÌ SAO CẦN MỘT MÁY CANH, KHÔNG PHẢI MỘT DÒNG LUẬT TRONG SỔ — ca thật đã sống nhiều tuần:
 *   · `VitalsGesturePanel` chỉ được mount ở `StageSwitcher.tsx`;
 *   · `StageSwitcher` bị gỡ khỏi `AppChrome` 17/08 khi sidebar thành hệ router;
 *   · từ đó ô gõ nhanh ở `StatusBar` gọi `useVitalsUi.open()` vào một panel KHÔNG CÒN MOUNT —
 *     **gõ câu hỏi rồi Enter là mất câu hỏi**, và ⌘J không làm gì.
 * Không có bước biên dịch nào đỏ, không test nào đỏ: đường dây đứt ở đoạn cuối. Đúng loại lỗi
 * 5 máy soi hiện có không bắt được (không lệch nhãn · không lệch hình học · không lệch sổ).
 *
 * BA KHẲNG ĐỊNH, mỗi cái khoá một cách hỏng đã xảy ra hoặc đã lường:
 *   [1] `VitalsGesturePanel` được mount ở ĐÚNG MỘT tệp  — chống mount đôi (`SO-KIEM-TONG` §1).
 *   [2] ⌘J/Ctrl+J đăng ký ở ĐÚNG MỘT tệp                — chống hai nơi cùng nghe một phím.
 *   [3] Chỗ đứng đó là KHẨU ĐỘ MÉP TRÊN, và nó được MOUNT THẬT trong vỏ app — chống lặp lại
 *       đúng ca 17/08: chỗ mount duy nhất nằm trong một component không ai mount.
 *
 * ⚠️ Đây là phép soi CHỮ trên mã nguồn (cùng họ `soi-tu-dien`/`soi-hinh-hoc`), không phải render
 * thật: nó bắt được "có mount trong mã hay không", KHÔNG bắt được "có hiện lên màn hay không".
 * Phần sau chỉ mắt người và ảnh chụp trả lời được.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const GOC = join(__dirname, '..', '..');
const QUET = ['components', 'app', 'lib'];
const DUOI = ['.ts', '.tsx'];

let pass = 0;
const loi: string[] = [];
function ok(ten: string, dieu: boolean, them = '') {
  if (dieu) { pass++; console.log(`  ok  - ${ten}`); }
  else { loi.push(`${ten}${them ? ` — ${them}` : ''}`); console.log(`  FAIL- ${ten}${them ? ` — ${them}` : ''}`); }
}

function moiTep(thuMuc: string, ra: string[] = []): string[] {
  for (const ten of readdirSync(thuMuc)) {
    if (ten === 'node_modules' || ten.startsWith('.')) continue;
    const p = join(thuMuc, ten);
    if (statSync(p).isDirectory()) moiTep(p, ra);
    else if (DUOI.some((d) => ten.endsWith(d)) && !ten.endsWith('.test.ts') && !ten.endsWith('.test.tsx')) ra.push(p);
  }
  return ra;
}

/**
 * 🔴 BỎ CHÚ THÍCH TRƯỚC KHI ĐẾM — không phải mẹo, đây là điều kiện đúng/sai của cả máy canh.
 * Lần chạy đầu nó báo 3 lỗi giả: `StatusBar.tsx` và `AppChrome.tsx` có `<VitalsGesturePanel>` /
 * `<VitalsPill/>` **trong chú thích đóng dấu lỗi thời** — tức đúng những dòng ta vừa viết để
 * giải thích rằng chúng ĐÃ ĐƯỢC GỠ. Một máy canh trừng phạt việc ghi lại lịch sử thì người ta
 * sẽ xoá lịch sử để nó xanh; hỏng cả hai.
 * ⚠️ Phép bỏ này thô: `//` trong chuỗi (vd `https://…`) cũng bị cắt tới cuối dòng. Chấp nhận —
 * ta chỉ tìm thẻ JSX, và không ai dựng thẻ JSX sau một URL trên cùng một dòng.
 */
function boChuThich(n: string): string {
  return n.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

const teps = QUET.flatMap((d) => moiTep(join(GOC, d)));
const doc = new Map<string, string>(
  teps.map((p) => [p.slice(GOC.length + 1), boChuThich(readFileSync(p, 'utf8'))]),
);

console.log('\nmot-cho-dung — Vitals chỉ được có MỘT chỗ đứng vật lý\n');

/* ── [1] MOUNT PANEL ─────────────────────────────────────────────────────────────────────────
   Đếm nơi thật sự DỰNG thẻ `<VitalsGesturePanel …>`, không đếm chỗ nhắc tên trong chú thích. */
console.log('[1] `VitalsGesturePanel` mount ở ĐÚNG MỘT tệp');
const mount = [...doc.entries()].filter(([, n]) => /<VitalsGesturePanel[\s/>]/.test(n)).map(([f]) => f);
ok('đúng 1 nơi mount', mount.length === 1, `thấy ${mount.length}: ${mount.join(' · ') || '(không nơi nào)'}`);
ok('nơi đó là khẩu độ mép trên', mount[0] === 'components/studio/VitalsAperture.tsx', mount[0] ?? '(trống)');

/* ── [2] ⌘J ──────────────────────────────────────────────────────────────────────────────────
   Bắt theo mẫu điều kiện phím thật (`e.key === 'j'`), không bắt chữ "⌘J" trong chú thích —
   chú thích nhắc lại phím tắt là chuyện bình thường và không được tính là một nơi đăng ký. */
console.log('\n[2] ⌘J / Ctrl+J đăng ký ở ĐÚNG MỘT tệp');
const phimJ = [...doc.entries()]
  .filter(([, n]) => /\.key\s*===\s*['"]j['"]/i.test(n) && /metaKey|ctrlKey/.test(n))
  .map(([f]) => f);
ok('đúng 1 nơi đăng ký', phimJ.length === 1, `thấy ${phimJ.length}: ${phimJ.join(' · ') || '(không nơi nào)'}`);
ok('nơi đó là khẩu độ mép trên', phimJ[0] === 'components/studio/VitalsAperture.tsx', phimJ[0] ?? '(trống)');

/* ── [3] KHẨU ĐỘ PHẢI ĐƯỢC MOUNT THẬT ────────────────────────────────────────────────────────
   Chính là ca 17/08: chỗ mount duy nhất nằm trong một component không ai mount nữa. */
console.log('\n[3] Khẩu độ có chỗ đứng THẬT trong vỏ app');
const dungKhauDo = [...doc.entries()].filter(([f, n]) => f !== 'components/studio/VitalsAperture.tsx' && /<VitalsAperture[\s/>]/.test(n)).map(([f]) => f);
ok('có ít nhất 1 nơi mount khẩu độ', dungKhauDo.length >= 1, dungKhauDo.join(' · ') || '(mồ côi — đúng ca 17/08)');
ok('mount trong vỏ app (AppChrome)', dungKhauDo.includes('components/studio/AppChrome.tsx'), dungKhauDo.join(' · '));

/* ── [4] HAI BIA MỘ KHÔNG ĐƯỢC HỒI SINH ──────────────────────────────────────────────────────
   `VitalsPill` (chỗ đứng góc màn ở Home) và `VitalsRightEdgeHost` (cạnh trục phải) đều là chỗ
   đứng đã bị EXS §7 đè. Mount lại bất kỳ cái nào = hai chỗ đứng cho một Vitals. */
console.log('\n[4] Chỗ đứng đã bỏ thì không mọc lại');
for (const bia of ['VitalsPill', 'VitalsRightEdgeHost']) {
  const nguoiDung = [...doc.entries()]
    .filter(([f, n]) => !f.endsWith(`${bia}.tsx`) && new RegExp(`<${bia}[\\s/>]`).test(n))
    .map(([f]) => f);
  ok(`\`${bia}\` không được mount ở đâu`, nguoiDung.length === 0, nguoiDung.join(' · '));
}

/* ── [5] AMBIENT PHẢI NHÌN THẤY ĐƯỢC ────────────────────────────────────────────────────────
   Lô ảnh 04/09: khẩu độ ở mức Ambient đọc ra như "ô trống chưa kịp style" — mờ hơn cả ô tìm
   kiếm ngay cạnh, trong khi EXS §7 gọi Vitals là *signature interaction*. Đó KHÔNG phải chuyện
   gu: WCAG 1.4.11 đòi phần nhìn-thấy-được định danh một control đạt ≥3:1 với nền của nó.
   Đo thẳng trên giá trị token ĐANG CHẠY, ở CẢ HAI nền — cùng cách `lib/ui/design-tokens.test.ts`
   đã làm cho `--focus-ring` và nút mờ. */
console.log('\n[5] Mức Ambient đạt ngưỡng nhìn-thấy-được (WCAG 1.4.11, 3:1)');
{
  const css = readFileSync(join(GOC, 'app', 'globals.css'), 'utf8');
  const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const lin = (c: number) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const L = (c: number[]) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  const tp = (a: number[], b: number[]) => { const x = L(a), y = L(b); const [hi, lo] = x > y ? [x, y] : [y, x]; return (hi + 0.05) / (lo + 0.05); };
  const pha = (fg: number[], bg: number[], a: number) => fg.map((c, i) => c * a + bg[i] * (1 - a));

  /** Lấy giá trị token trong khối `:root` (nền tối) hoặc khối theme sáng — đọc lần XUẤT HIỆN thứ n. */
  const doc = (ten: string, lan: number) => {
    const m = [...css.matchAll(new RegExp(`--${ten}:\\s*(#[0-9a-fA-F]{6})`, 'g'))];
    if (!m[lan]) throw new Error(`không đọc được --${ten} (lần ${lan})`);
    return hex(m[lan][1]);
  };
  // lần 0 = khối `:root` (nền tối) · lần 1 = khối theme sáng. Cùng quy ước design-tokens.test.
  for (const [ten, lan] of [['tối', 0], ['sáng', 1]] as const) {
    const field = doc('field', lan);
    const t3 = doc('t3', lan);
    const loi_ = tp(t3, field);                 // lõi: đục hẳn
    const net = tp(pha(t3, field, 0.55), field); // nét quỹ đạo lúc nghỉ
    ok(`[${ten}] LÕI (phần định danh) ≥ 3:1 — đo ${loi_.toFixed(2)}`, loi_ >= 3);
    // Nét quỹ đạo là hình bao, không phải phần định danh ⇒ không áp 3:1; nhưng phải hơn hẳn bản
    // cũ (`--t4` @0.34 = 1,45/1,35) để thôi đọc ra "ô trống".
    ok(`[${ten}] nét quỹ đạo > 1,8:1 (bản cũ 1,4) — đo ${net.toFixed(2)}`, net > 1.8);
  }

  // Khoá luôn ở tầng MÃ: lõi không được pha loãng lại, nét không được rơi về `--t4`.
  const qd = readFileSync(join(GOC, 'components', 'studio', 'VitalsQuyDao.tsx'), 'utf8');
  ok('lõi KHÔNG còn `fillOpacity` pha loãng lúc nghỉ', !/fillOpacity=\{coTinHieu \? 1 : 0\.7\}/.test(qd));
  ok('nét quỹ đạo lúc nghỉ dùng `--t3`, không rơi lại `--t4`', /coTinHieu \? 'var\(--accent\)' : 'var\(--t3\)'/.test(qd));
}

console.log(`\n${loi.length === 0 ? '✅' : '❌'} mot-cho-dung: ${pass} pass · ${loi.length} fail`);
if (loi.length) process.exit(1);
