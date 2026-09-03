/**
 * lib/ui/surface.test.ts — khoá RÀNG BUỘC của bề mặt chrome `components/ui/Surface.tsx`.
 * Chạy: `node_modules/.bin/sucrase-node lib/ui/surface.test.ts`
 *
 *  1. Năm vai rail/dock/inspector/widget/sheet, mỗi vai một lớp `.if-surface-*` CÓ THẬT trong CSS.
 *  2. Kính chọn lọc: inspector KHÔNG kính; bảng `SURFACE_GLASS` khớp CSS (không khai suông).
 *  3. `solid` gắn `.if-surface--solid`; `as` đổi thẻ; `data-surface` để máy/test nhận ra vai.
 *  4. Component không gõ số: 0 hex · 0 zIndex số · 0 backdrop-filter inline (mọi thứ qua lớp CSS).
 *  5. EmptyState: ba tone empty/loading/error đi qua MỘT component; nút mờ đi đường
 *     aria-disabled + aria-describedby (không `title`, không `disabled` — bài học 16/08).
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Surface, SURFACE_CLASS, SURFACE_GLASS, SURFACE_KINDS, surfaceClass } from '../../components/ui/Surface';

let fail = 0;
function ok(msg: string, cond: unknown) {
  if (cond) console.log('  ok  -', msg);
  else { fail += 1; console.log('  FAIL -', msg); }
}
const ROOT = join(__dirname, '..', '..');
const CSS = readFileSync(join(ROOT, 'app', 'globals.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const SRC = readFileSync(join(ROOT, 'components', 'ui', 'Surface.tsx'), 'utf8');

console.log('\nsurface — bề mặt chrome');

console.log('\n[1] năm vai, lớp có thật');
ok('đúng 5 vai', SURFACE_KINDS.length === 5);
for (const k of SURFACE_KINDS) {
  ok(`${k} → ${SURFACE_CLASS[k]} có trong globals.css`, new RegExp(`\\.${SURFACE_CLASS[k]}\\b`).test(CSS));
}

console.log('\n[2] kính chọn lọc khớp CSS');
function ruleOf(cls: string): string {
  // gom mọi khối có selector chứa lớp này (kể cả selector gộp) — ngoài media query
  const out: string[] = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  for (const m of CSS.matchAll(re)) {
    const sels = m[1].split(',').map((s) => s.trim());
    if (sels.includes(`.${cls}`)) out.push(m[2]);
  }
  return out.join('\n');
}
for (const k of SURFACE_KINDS) {
  const coKinh = /backdrop-filter:\s*(saturate|blur)/.test(ruleOf(SURFACE_CLASS[k]));
  ok(`${k}: SURFACE_GLASS=${SURFACE_GLASS[k]} khớp CSS (${coKinh})`, coKinh === SURFACE_GLASS[k]);
}
ok('inspector KHÔNG kính (nội dung dày chữ)', SURFACE_GLASS.inspector === false);

console.log('\n[3] render');
{
  const html = renderToStaticMarkup(createElement(Surface, { kind: 'dock', 'aria-label': 'Dock' } as never, 'x'));
  ok('dock: class if-surface-dock + data-surface', html.includes('class="if-surface-dock"') && html.includes('data-surface="dock"'));
  ok('dock: thẻ mặc định div', html.startsWith('<div'));
  const solid = renderToStaticMarkup(createElement(Surface, { kind: 'widget', solid: true, className: 'x1' } as never));
  ok('solid + className gộp đúng thứ tự', solid.includes('class="if-surface-widget if-surface--solid x1"'));
  const nav = renderToStaticMarkup(createElement(Surface, { kind: 'rail', as: 'nav' } as never));
  ok('as="nav" đổi thẻ', nav.startsWith('<nav'));
  ok('surfaceClass() = cùng chuỗi', surfaceClass('inspector', true) === 'if-surface-inspector if-surface--solid');
}

console.log('\n[4] không gõ số');
ok('Surface.tsx 0 hex', !/#[0-9a-fA-F]{3,8}\b/.test(SRC.replace(/\/\*[\s\S]*?\*\//g, '')));
ok('Surface.tsx 0 zIndex số', !/zIndex:\s*\d/.test(SRC));
ok('Surface.tsx 0 backdropFilter inline', !/backdropFilter/.test(SRC));

console.log('\n[5] EmptyState ba tone + nút mờ đúng đường');
{
  const es = readFileSync(join(ROOT, 'components', 'ui', 'EmptyState.tsx'), 'utf8');
  ok("tone?: 'empty' | 'loading' | 'error'", /tone\?:\s*'empty'\s*\|\s*'loading'\s*\|\s*'error'/.test(es));
  ok('loading dùng LightBar (một lõi tiến trình, không thanh thứ hai)', /import LightBar from '\.\/LightBar'/.test(es) && /createElement\(LightBar|<LightBar/.test(es));
  ok('loading không bịa %: value = progress (undefined ⇒ không đếm được)', /value=\{progress\}/.test(es));
  ok('nút mờ: aria-disabled + aria-describedby', /aria-disabled=/.test(es) && /aria-describedby=/.test(es));
  ok('nút mờ: không dùng thuộc tính disabled= hay title=', !/\sdisabled=\{a\.disabled\}/.test(es) && !/\stitle=\{/.test(es));
  ok('nút chính chữ var(--on-accent), không #fff', es.includes("'var(--on-accent)'") && !/'#fff'/.test(es));
  ok('độ mờ nút qua token --mo-vo-hieu', es.includes("'var(--mo-vo-hieu)'"));
  ok('error tone: role="alert"', /role=\{tone === 'error' \? 'alert'/.test(es));
}

console.log(`\n${fail ? '❌' : '✅'} surface: ${fail ? fail + ' fail' : 'tất cả đạt'}`);
process.exit(fail ? 1 : 0);
