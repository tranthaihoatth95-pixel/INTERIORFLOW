/**
 * lib/ui/design-tokens.test.ts — MÁY CANH TOKEN của `app/globals.css` (Cloud Slice 9, 03/09).
 * Chạy: `node_modules/.bin/sucrase-node lib/ui/design-tokens.test.ts`
 *
 * Mỗi mục là một cách hỏng ĐÃ XẢY RA hoặc đã lường trước — không có mục "cho đủ":
 *  [thang bo]      thang 6/10/14/20/999 + bí danh cũ trỏ về thang (Hoà duyệt 12/08).
 *  [hai theme]     token khai ở theme này thì theme kia cũng giải được — chống "Xưởng đêm" và
 *                  "Xưởng sáng" trộn màu (một theme thiếu token thì rơi về giá trị theme kia).
 *  [giấy]          `--paper*` CHỈ ở khối dùng chung — giấy in theo CHẾ ĐỘ LÀM VIỆC, không theo theme.
 *  [tương phản]    đo BẰNG SỐ trên giá trị đang chạy: chữ 4,5:1 · trạng thái 4,5:1 · chữ trên nhấn
 *                  4,5:1 · vòng focus 3:1 · nút mờ 3:1 (tái hiện đúng 4,01 / 3,36 phiên 16/08).
 *  [var chưa khai] mọi `var(--x)` trong globals + components/ui + lib/ui phải trỏ vào token có thật
 *                  (bug `--surface-page` 05/08 · `--font-geist-sans` 14/08 là loại này).
 *  [hex trần]      components/ui + lib/ui không gõ hex (luật ③ giao diện) — trừ mask (chỉ đọc alpha).
 *  [focus]         luật `:focus-visible` toàn app tồn tại, dùng token ring + stroke.
 *  [chuyển động]   reduced-motion đưa duration về ~0; reduced-transparency tắt kính CẢ 4 mặt kính.
 *  [z]             thang lớp xếp chồng đúng thứ tự.
 *  [chạm]          32/44 desktop · ≥44/≥56 cảm ứng.
 *  [chữ]           sàn 11px · nhịp dòng nhiều dòng ≥1,5 (chữ Việt).
 *  [bề mặt]        Inspector ĐẶC (alpha 1) · rail/dock/widget/sheet KÍNH (alpha < 1).
 *  [accent đóng băng] `--accent*` giữ nguyên byte cho tới khi Hoà chọn màu nhấn thứ hai.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import {
  contrastOn,
  parseCssColor,
  parseTokenSheet,
  px,
  resolveToken,
  tokenColor,
  type RGBA,
  type ThemeName,
  type TokenSheet,
} from './design-tokens';

let fail = 0;
let pass = 0;
function ok(msg: string, cond: unknown) {
  if (cond) {
    pass += 1;
    console.log('  ok  -', msg);
  } else {
    fail += 1;
    console.log('  FAIL -', msg);
  }
}
const r2 = (n: number) => Math.round(n * 100) / 100;

const ROOT = join(__dirname, '..', '..');
const CSS_PATH = join(ROOT, 'app', 'globals.css');
const sheet: TokenSheet = parseTokenSheet(readFileSync(CSS_PATH, 'utf8'));
const THEMES: ThemeName[] = ['dark', 'light'];

console.log('\ndesign-tokens — máy canh app/globals.css');

/* ── [parser] tự kiểm trước khi tin ─────────────────────────────────────────────── */
console.log('\n[parser] parser đọc được ba khối chuẩn');
ok('khối dùng chung có --accent', sheet.shared.has('--accent'));
ok('khối tối có --bg', sheet.dark.has('--bg'));
ok('khối sáng có --bg', sheet.light.has('--bg'));
ok('khối cảm ứng có --tap', sheet.coarse.has('--tap'));
ok('mở var lồng: --p-img → màu accent', resolveToken(sheet, '--p-img', 'dark') === resolveToken(sheet, '--accent', 'dark'));
ok('parseCssColor hex 6', JSON.stringify(parseCssColor('#6a57f5')) === JSON.stringify({ rgb: [106, 87, 245], a: 1 }));
ok('parseCssColor rgba', JSON.stringify(parseCssColor('rgba(106, 87, 245, 0.55)')) === JSON.stringify({ rgb: [106, 87, 245], a: 0.55 }));
{
  const mix = parseCssColor('color-mix(in srgb, #000000 50%, transparent)');
  ok('parseCssColor color-mix premultiplied (đen 50% + trong suốt = đen alpha .5)', !!mix && mix.a === 0.5 && mix.rgb.join(',') === '0,0,0');
}
{
  // hiệu chuẩn bộ đo bằng cặp số đã biết (WCAG mẫu): trắng/đen = 21:1
  const c = contrastOn({ rgb: [255, 255, 255], a: 1 }, { rgb: [0, 0, 0], a: 1 });
  ok('contrastOn trắng/đen = 21', Math.abs(c - 21) < 0.01);
}

/* ── [thang bo] ────────────────────────────────────────────────────────────────── */
console.log('\n[thang bo] 6 / 10 / 14 / 20 / capsule');
ok('--r-1 = 6', px(resolveToken(sheet, '--r-1', 'dark')) === 6);
ok('--r-2 = 10', px(resolveToken(sheet, '--r-2', 'dark')) === 10);
ok('--r-3 = 14', px(resolveToken(sheet, '--r-3', 'dark')) === 14);
ok('--r-4 = 20', px(resolveToken(sheet, '--r-4', 'dark')) === 20);
ok('--r-full = 999', px(resolveToken(sheet, '--r-full', 'dark')) === 999);
for (const alias of ['--radius-sm', '--radius-md', '--radius-lg', '--radius-xl', '--radius']) {
  const v = px(resolveToken(sheet, alias, 'dark'));
  ok(`${alias} trỏ về thang (${v})`, [6, 10, 14, 20].includes(v));
}

/* ── [hai theme] ───────────────────────────────────────────────────────────────── */
console.log('\n[hai theme] token theme này giải được ở theme kia');
{
  let lech = 0;
  for (const name of sheet.dark.keys()) if (resolveToken(sheet, name, 'light') === undefined) { lech += 1; console.log('     tối có, sáng không:', name); }
  for (const name of sheet.light.keys()) if (resolveToken(sheet, name, 'dark') === undefined) { lech += 1; console.log('     sáng có, tối không:', name); }
  ok('0 token chỉ tồn tại ở một theme', lech === 0);
  // các họ theo theme phải có ở CẢ hai khối (không được để một theme rơi về khối dùng chung)
  for (const name of ['--bg', '--panel', '--card', '--field', '--hover', '--border', '--border-strong', '--t1', '--t2', '--t3', '--t4', '--t5',
    '--nen-mo-header', '--nen-mo-panel', '--nen-mo-card', '--nen-mo-overlay', '--vien-mo', '--mo-vo-hieu',
    '--shadow-sheet', '--shadow-pop', '--shadow-node', '--danger', '--warning', '--success', '--p-text', '--p-video', '--surface-page']) {
    ok(`${name} khai riêng ở CẢ tối lẫn sáng`, sheet.dark.has(name) && sheet.light.has(name));
  }
}

/* ── [giấy] ────────────────────────────────────────────────────────────────────── */
console.log('\n[giấy] --paper* không theo theme');
{
  const paper = [...sheet.declared].filter((n) => n.startsWith('--paper'));
  ok('có họ --paper*', paper.length >= 4);
  for (const n of paper) {
    ok(`${n} chỉ ở khối dùng chung`, sheet.shared.has(n) && !sheet.dark.has(n) && !sheet.light.has(n) && !sheet.coarse.has(n));
  }
  const p = tokenColor(sheet, '--paper', 'dark');
  const ink = tokenColor(sheet, '--paper-ink', 'dark');
  ok('mực trên giấy ≥ 7:1 (in được)', !!p && !!ink && contrastOn(ink, p) >= 7);
}

/* ── [tương phản] ──────────────────────────────────────────────────────────────── */
console.log('\n[tương phản] đo bằng số trên giá trị đang chạy');
function color(name: string, theme: ThemeName): RGBA {
  const c = tokenColor(sheet, name, theme);
  if (!c) throw new Error(`${name} @${theme} không phải màu: ${resolveToken(sheet, name, theme)}`);
  return c;
}
for (const theme of THEMES) {
  const nen = ['--bg', '--panel', '--card'] as const;
  for (const fg of ['--t1', '--t2']) for (const bg of nen) {
    const c = contrastOn(color(fg, theme), color(bg, theme));
    ok(`${theme}: ${fg} trên ${bg} ≥ 4,5 (${r2(c)})`, c >= 4.5);
  }
  for (const bg of ['--panel', '--card'] as const) {
    const c = contrastOn(color('--t3', theme), color(bg, theme));
    ok(`${theme}: --t3 trên ${bg} ≥ 4,5 (${r2(c)})`, c >= 4.5);
  }
  for (const st of ['--danger', '--warning', '--success']) for (const bg of ['--panel', '--card'] as const) {
    const c = contrastOn(color(st, theme), color(bg, theme));
    ok(`${theme}: ${st} trên ${bg} ≥ 4,5 (${r2(c)})`, c >= 4.5);
  }
  {
    const c = contrastOn(color('--on-accent', theme), color('--accent', theme));
    ok(`${theme}: --on-accent trên --accent ≥ 4,5 (${r2(c)})`, c >= 4.5);
  }
  // vòng focus toàn app: --focus-ring đắp lên nền, so với nền — WCAG 1.4.11 ≥ 3:1
  for (const bg of nen) {
    const c = contrastOn(color('--focus-ring', theme), color(bg, theme));
    ok(`${theme}: vòng focus --focus-ring trên ${bg} ≥ 3 (${r2(c)})`, c >= 3);
    // GHI NHẬN (không chặn): --accent-ring alpha .55 là màu 18 ring tự chế đang dùng — số này là
    // bằng chứng cho nợ migrate sang --focus-ring, in ra để phiên sau không phải đo lại.
    const cu = contrastOn(color('--accent-ring', theme), color(bg, theme));
    console.log(`     ghi nhận: --accent-ring (alpha .55) trên ${bg} @${theme} = ${r2(cu)}:1 ${cu >= 3 ? '' : '← DƯỚI 3:1'}`);
  }
  // nút mờ: --t2 hoà theo --mo-vo-hieu lên nền, so với nền — ≥3:1 (tái hiện số 16/08)
  const mo = parseFloat(resolveToken(sheet, '--mo-vo-hieu', theme) ?? 'NaN');
  ok(`${theme}: --mo-vo-hieu là số 0..1 (${mo})`, mo > 0 && mo < 1);
  for (const bg of nen) {
    const t2 = color('--t2', theme);
    const c = contrastOn({ rgb: t2.rgb, a: mo }, color(bg, theme));
    ok(`${theme}: nút mờ (--t2 × ${mo}) trên ${bg} ≥ 3 (${r2(c)})`, c >= 3);
  }
  // nhãn nguồn sự thật: màu chỉ ở dấu/viền — thành phần giao diện ≥ 3:1 trên --panel
  for (const k of ['measured', 'verified', 'inferred', 'external', 'stale']) {
    const c = contrastOn(color(`--truth-${k}`, theme), color('--panel', theme));
    ok(`${theme}: --truth-${k} trên --panel ≥ 3 (${r2(c)})`, c >= 3);
  }
}

/* ── [var chưa khai] ───────────────────────────────────────────────────────────── */
console.log('\n[var chưa khai] mọi var(--x) trỏ vào token có thật');
function* walk(dir: string): Generator<string> {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (/\.(tsx?|css)$/.test(n) && !/\.test\.tsx?$/.test(n)) yield p;
  }
}
const UI_FILES = [CSS_PATH, ...walk(join(ROOT, 'components', 'ui')), ...walk(join(ROOT, 'lib', 'ui'))];
// Biến do NƠI GỌI đặt inline (không phải token toàn cục) — khai rõ từng cái, kèm chỗ đặt.
const DAT_TAI_CHO = new Set([
  '--lq-tint', // lib/adaptive-contrast cardTextVars() đặt theo ảnh nền
  '--if-origin', // .if-reveal: nơi gọi đặt toạ độ nguồn mở
  '--tt-delay', // Tooltip.tsx đặt theo prop delayMs
  '--truth-color', // .if-truth tự đặt theo data-truth
]);
{
  let thieu = 0;
  for (const f of UI_FILES) {
    const raw = readFileSync(f, 'utf8');
    const src = f.endsWith('.css') ? raw.replace(/\/\*[\s\S]*?\*\//g, '') : raw;
    const local = new Set([...src.matchAll(/(--[A-Za-z0-9_-]+)\s*:/g)].map((m) => m[1]));
    for (const m of src.matchAll(/var\(\s*(--[A-Za-z0-9_-]+)\s*([,)])/g)) {
      const name = m[1];
      const coFallback = m[2] === ',';
      if (sheet.declared.has(name) || local.has(name) || DAT_TAI_CHO.has(name) || coFallback) continue;
      thieu += 1;
      console.log('     chưa khai:', name, '←', f.replace(ROOT + '/', ''));
    }
  }
  ok(`0 var() chưa khai trong ${UI_FILES.length} tệp`, thieu === 0);
}

/* ── [hex trần] ────────────────────────────────────────────────────────────────── */
console.log('\n[hex trần] components/ui + lib/ui không gõ mã màu');
{
  let hex = 0;
  for (const f of UI_FILES) {
    if (f === CSS_PATH) continue;
    const src = readFileSync(f, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .filter((l) => !/^\s*\/\//.test(l) && !/mask/i.test(l)) // mask chỉ đọc alpha, màu vô nghĩa
      .join('\n');
    for (const m of src.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
      hex += 1;
      console.log('     hex:', m[0], '←', f.replace(ROOT + '/', ''));
    }
  }
  ok('0 hex trần', hex === 0);
}

/* ── [focus] ───────────────────────────────────────────────────────────────────── */
console.log('\n[focus] vòng focus bàn phím toàn app');
{
  const css = sheet.css;
  const m = css.match(/:where\([^)]*button[^)]*\):focus-visible\s*\{([^}]*)\}/);
  ok('có luật :where(…button…):focus-visible (specificity 0)', !!m);
  ok('vòng focus dùng --focus-ring + --stroke-focus', !!m && /var\(--stroke-focus\)/.test(m[1]) && /var\(--focus-ring\)/.test(m[1]));
  ok('--focus-ring là màu ĐẶC (alpha 1) ở cả hai theme', THEMES.every((th) => tokenColor(sheet, '--focus-ring', th)?.a === 1));
  ok('có .if-focus-inset cho vùng cuộn', /\.if-focus-inset:focus-visible\s*\{/.test(css));
  ok('chuột bấm không hiện ring (:focus:not(:focus-visible))', /:focus:not\(:focus-visible\)\s*\{\s*outline:\s*none/.test(css));
  ok('--stroke-focus ≥ 2px', px(resolveToken(sheet, '--stroke-focus', 'dark')) >= 2);
}

/* ── [chuyển động] ─────────────────────────────────────────────────────────────── */
console.log('\n[chuyển động] reduced-motion / reduced-transparency');
{
  const css = sheet.css;
  const rm = css.match(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*\*,[\s\S]*?\}/);
  ok('khối reduced-motion `*` tồn tại', !!rm);
  ok('reduced-motion đưa duration VÀ delay về 0', !!rm && /animation-duration:\s*0\.001ms/.test(rm[0]) && /transition-delay:\s*0ms/.test(rm[0]));
  const rt = css.match(/@media \(prefers-reduced-transparency: reduce\)\s*\{([\s\S]*?)\n\}/);
  ok('khối reduced-transparency tồn tại', !!rt);
  for (const k of ['rail', 'dock', 'sheet', 'widget']) {
    ok(`reduced-transparency tắt kính .if-surface-${k}`, !!rt && rt[1].includes(`.if-surface-${k}`) && /backdrop-filter:\s*none/.test(rt[1]));
  }
  ok('.if-reveal chỉ animate transform (không opacity trên kính — luật G1)', /@keyframes if-reveal\s*\{[^}]*transform[^}]*\}\s*to\s*\{[^}]*transform[^}]*\}/.test(css) && !/@keyframes if-reveal[\s\S]{0,200}opacity/.test(css));
  ok('--dur-exit < --dur-base (đóng nhanh hơn mở)', parseFloat(resolveToken(sheet, '--dur-exit', 'dark') ?? '9') < parseFloat(resolveToken(sheet, '--dur-base', 'dark') ?? '0'));
}

/* ── [z] ───────────────────────────────────────────────────────────────────────── */
console.log('\n[z] thang lớp xếp chồng');
{
  const z = (n: string) => parseFloat(resolveToken(sheet, `--z-${n}`, 'dark') ?? 'NaN');
  ok('canvas < rail', z('canvas') < z('rail'));
  ok('rail ≤ inspector', z('rail') <= z('inspector'));
  ok('inspector < dock', z('inspector') < z('dock'));
  ok('dock < sheet', z('dock') < z('sheet'));
  ok('sheet < popover', z('sheet') < z('popover'));
  ok('popover < toast', z('popover') < z('toast'));
  ok('toast < tooltip', z('toast') < z('tooltip'));
  ok('tooltip = 1000 (khớp .if-tooltip-tag)', z('tooltip') === 1000 && /\.if-tooltip-tag\s*\{[^}]*z-index:\s*1000/.test(sheet.css));
}

/* ── [chạm] ────────────────────────────────────────────────────────────────────── */
console.log('\n[chạm] cỡ ô chạm desktop / cảm ứng');
ok('--tap desktop = 32', px(sheet.shared.get('--tap')) === 32);
ok('--tap-lg = 44 và KHÔNG override khi chạm', px(sheet.shared.get('--tap-lg')) === 44 && !sheet.coarse.has('--tap-lg'));
ok('--tap-chinh desktop = 44', px(sheet.shared.get('--tap-chinh')) === 44);
ok('cảm ứng: --tap ≥ 44', px(sheet.coarse.get('--tap')) >= 44);
ok('cảm ứng: --row ≥ 44', px(sheet.coarse.get('--row')) >= 44);
ok('cảm ứng: --tap-chinh ≥ 56', px(sheet.coarse.get('--tap-chinh')) >= 56);

/* ── [chữ] ─────────────────────────────────────────────────────────────────────── */
console.log('\n[chữ] sàn đọc được chữ Việt');
{
  const fsMin = px(sheet.shared.get('--fs-min'));
  ok('--fs-min = 11 (= MIN_LABEL_PX)', fsMin === 11);
  for (const n of ['--fs-2xs', '--fs-xs', '--fs-sm', '--fs-md', '--fs-lg', '--fs-xl', '--fs-ui']) {
    ok(`${n} ≥ sàn 11px`, px(sheet.shared.get(n)) >= fsMin);
  }
  ok('--lh-doc ≥ 1.5 (dấu tiếng Việt không chồng)', parseFloat(sheet.shared.get('--lh-doc') ?? '0') >= 1.5);
  ok('--lh-ui < --lh-doc < --lh-loose', parseFloat(sheet.shared.get('--lh-ui') ?? '9') < parseFloat(sheet.shared.get('--lh-doc') ?? '0') && parseFloat(sheet.shared.get('--lh-doc') ?? '9') < parseFloat(sheet.shared.get('--lh-loose') ?? '0'));
}

/* ── [bề mặt] ──────────────────────────────────────────────────────────────────── */
console.log('\n[bề mặt] inspector đặc · kính có alpha');
for (const theme of THEMES) {
  const insp = color('--surface-inspector', theme);
  ok(`${theme}: --surface-inspector ĐẶC (alpha 1)`, insp.a === 1);
  for (const k of ['rail', 'dock', 'widget', 'sheet']) {
    const c = color(`--surface-${k}`, theme);
    ok(`${theme}: --surface-${k} là kính (alpha ${c.a} < 1)`, c.a < 1 && c.a > 0.5);
  }
  ok(`${theme}: --surface-canvas = --bg`, resolveToken(sheet, '--surface-canvas', theme) === resolveToken(sheet, '--bg', theme));
}
for (const k of ['rail', 'dock', 'inspector', 'widget', 'sheet']) {
  ok(`.if-surface-${k} có trong CSS`, new RegExp(`\\.if-surface-${k}\\b`).test(sheet.css));
}
ok('.if-surface-inspector KHÔNG có backdrop-filter (đặc)', !/\.if-surface-inspector\s*\{[^}]*backdrop-filter/.test(sheet.css));
ok('.if-surface-dock là capsule (--r-full)', /\.if-surface-dock\s*\{[^}]*border-radius:\s*var\(--r-full\)/.test(sheet.css));

/* ── [accent đóng băng] ────────────────────────────────────────────────────────── */
console.log('\n[accent đóng băng] --accent* giữ nguyên tới khi Hoà chọn màu nhấn thứ hai');
const FROZEN: Record<string, string> = {
  '--accent': '#6a57f5',
  '--accent-strong': '#553ff3',
  '--accent-soft': 'rgba(106, 87, 245, 0.14)',
  '--accent-ring': 'rgba(106, 87, 245, 0.55)',
  '--accent-warm': '#c79a63',
};
for (const [n, v] of Object.entries(FROZEN)) ok(`${n} = ${v}`, sheet.shared.get(n) === v);

console.log(`\n${fail ? '❌' : '✅'} design-tokens: ${pass} pass · ${fail} fail`);
process.exit(fail ? 1 : 0);
