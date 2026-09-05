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

/* Bộ giải alias `@/` cho `sucrase-node` — nó không đọc `paths` của tsconfig, nên MỌI component
   nhập `@/lib/...` đều `MODULE_NOT_FOUND` khi render trong test. Đó chính là lý do các test
   trước nay phải khớp CHỮ TRONG MÃ thay vì render thật; mười hai dòng dưới đây gỡ trần đó. */
{
  const Mod = require('module');
  const gocResolve = Mod._resolveFilename;
  Mod._resolveFilename = function (req: string, ...rest: unknown[]) {
    return gocResolve.call(this, req.startsWith('@/') ? join(ROOT, req.slice(2)) : req, ...rest);
  };
  /* `sucrase-node` dịch JSX theo lối CỔ ĐIỂN (`React.createElement`) trong khi mã sản phẩm viết
     theo lối TỰ ĐỘNG của Next (không `import React`). Đặt React vào phạm vi toàn cục là cách rẻ
     nhất để render được component thật ở đây — chỉ sống trong tiến trình test, không đụng mã sản
     phẩm và không đổi cách app biên dịch. */
  (globalThis as { React?: unknown }).React = require('react');
}
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
  ok('loading dùng LightBar (một lõi tiến trình, không thanh thứ hai)', /import LightBar from '\.\/LightBar'/.test(es) && /createElement\(LightBar|<LightBar/.test(es));
  ok('loading không bịa %: value = progress (undefined ⇒ không đếm được)', /value=\{progress\}/.test(es));
  ok('nút mờ: aria-disabled + aria-describedby', /aria-disabled=/.test(es) && /aria-describedby=/.test(es));
  ok('nút mờ: không dùng thuộc tính disabled= hay title=', !/\sdisabled=\{a\.disabled\}/.test(es) && !/\stitle=\{/.test(es));
  ok('nút chính chữ var(--on-accent), không #fff', es.includes("'var(--on-accent)'") && !/'#fff'/.test(es));
  ok('độ mờ nút qua token --mo-vo-hieu', es.includes("'var(--mo-vo-hieu)'"));
  // Khẳng định HÀNH VI chứ không khớp chữ trong mã: cả `error` lẫn `offline` đều là hỏng-việc-ngay
  // ⇒ đều phải `role="alert"`. (Bản trước khớp nguyên văn `tone === 'error' ? 'alert'` nên đỏ ngay
  // khi thêm nấc thứ tư, dù hành vi không xấu đi — đó là test khoá cách viết, không khoá hành vi.)
  ok("tone='error' | 'offline': đều role=alert", /role=\{nangNe \? 'alert'/.test(es) && /tone === 'error' \|\| tone === 'offline'/.test(es));
  ok("tone?: có đủ bốn nấc kể cả 'offline'", /tone\?:\s*'empty'\s*\|\s*'loading'\s*\|\s*'error'\s*\|\s*'offline'/.test(es));
  ok('ngoại tuyến LỌC BỎ nút Thử lại ngay trong component (không dặn nơi gọi)', /tone === 'offline'\s*\?\s*actions\.filter/.test(es) && /thử lại\|retry/i.test(es));
}

console.log('\n[6] EmptyState — RENDER THẬT, không khớp chữ trong mã');
{
  // `any` có chủ đích: component nạp động qua require nên TS không suy được kiểu props ở đây.
  const { EmptyState } = require('../../components/ui/EmptyState') as { EmptyState: any };
  const nut = [
    { label: 'Thử lại', onClick: () => {} },
    { label: 'Mở thư mục cục bộ', onClick: () => {} },
  ];
  const loi = renderToStaticMarkup(createElement(EmptyState, { title: 'Hỏng', actions: nut, tone: 'error' }));
  const ngoai = renderToStaticMarkup(createElement(EmptyState, { title: 'Mất mạng', actions: nut, tone: 'offline' }));
  ok('lỗi: GIỮ nút Thử lại', loi.includes('Thử lại'));
  ok('ngoại tuyến: BỎ nút Thử lại (bấm lại là lời khuyên vô ích khi mất mạng)', !ngoai.includes('Thử lại'));
  ok('ngoại tuyến: GIỮ việc cục bộ vẫn làm được', ngoai.includes('Mở thư mục cục bộ'));
  ok('cả hai đều role=alert', /role="alert"/.test(loi) && /role="alert"/.test(ngoai));
  ok('ngoại tuyến không aria-busy (không phải đang tải)', !/aria-busy/.test(ngoai));
  const thuong = renderToStaticMarkup(createElement(EmptyState, { title: 'Trống', tone: 'empty' }));
  ok('trống: không role=alert', !/role="alert"/.test(thuong));
  const day = renderToStaticMarkup(createElement(EmptyState, { title: 'x', tone: 'empty', lapDayO: true }));
  ok('lapDayO: lấp đầy ô chứa (height:100%)', /height:100%/.test(day.replace(/\s/g, '')));
  ok('mặc định KHÔNG lấp đầy (không đổi hành vi ~40 nơi đang gọi)', !/height:100%/.test(thuong.replace(/\s/g, '')));
}

console.log(`\n${fail ? '❌' : '✅'} surface: ${fail ? fail + ' fail' : 'tất cả đạt'}`);
process.exit(fail ? 1 : 0);
