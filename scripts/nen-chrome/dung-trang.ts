/**
 * scripts/nen-chrome/dung-trang.ts — DỰNG TRANG THỬ BỘ NỀN CHROME (không cần server, không cần DB).
 *
 * Anh em với `scripts/chup-man-duyet-mat.mjs` nhưng KHÁC VIỆC, không thay thế nhau:
 *   chup-man-duyet-mat  → chụp MÀN THẬT của app (cần server 3000 + đăng nhập + DB) cho cửa duyệt mắt.
 *   nen-chrome          → dựng RIÊNG các nguyên thể chrome (Surface · TruthBadge · vòng focus) ra
 *                         HTML tĩnh rồi đo bằng Chromium. Chạy được cả khi DB/auth chưa có.
 *
 * Vì sao cần đường thứ hai: khẳng định "vòng focus đạt ≥3:1", "inspector KHÔNG kính" là khẳng định
 * về GIÁ TRỊ TÍNH RA CỦA TRÌNH DUYỆT — đọc mã không chứng minh được (bài học 16/08: lý do CÓ trong
 * mã nhưng KHÔNG tới được người dùng). Trang này để máy đo, không phải để đẹp.
 *
 * CHẠY:
 *   node_modules/.bin/sucrase-node scripts/nen-chrome/dung-trang.ts <thư-mục-ra>
 *   node scripts/nen-chrome/do-va-chup.js <thư-mục-ra>
 * Mặc định thư mục ra = `.nen-chrome-out/` (đã gitignore — ảnh KHÔNG vào repo, luật 24/07).
 */

import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Surface } from '../../components/ui/Surface';
import { TRUTH_KINDS, TruthBadgeView } from '../../lib/ui/truth';

const ROOT = join(__dirname, '..', '..');
const RA = process.argv[2] ?? join(ROOT, '.nen-chrome-out');
mkdirSync(RA, { recursive: true });

const css = readFileSync(join(ROOT, 'app', 'globals.css'), 'utf8').replace(/^@tailwind .*$/gm, '');
const nhan = (lang: 'vi' | 'en') =>
  TRUTH_KINDS.map((k) => renderToStaticMarkup(h(TruthBadgeView, { kind: k, lang }))).join(' ');
const badge = (k: 'measured' | 'inferred' | 'external' | 'stale') =>
  renderToStaticMarkup(h(TruthBadgeView, { kind: k, lang: 'vi' }));

const nut = (chu: string, them = '') =>
  `<button type="button" style="height:var(--tap);padding:0 12px;border-radius:var(--r-full);border:var(--stroke-hair) solid var(--border);background:var(--field);color:var(--t1);font:600 var(--fs-ui)/var(--lh-ui) inherit;${them}">${chu}</button>`;
const o = (chu: string, dangChon = false) =>
  `<button type="button" style="width:var(--tap-chinh);height:var(--tap-chinh);display:grid;place-items:center;border-radius:var(--r-full);border:1px solid ${dangChon ? 'var(--accent-ring)' : 'transparent'};background:${dangChon ? 'var(--accent-soft)' : 'transparent'};color:${dangChon ? 'var(--accent)' : 'var(--t2)'};font:600 12px/1 inherit" aria-label="${chu}">${chu.slice(0, 2)}</button>`;

const be = (kind: string, style: Record<string, unknown>, html: string, props: Record<string, unknown> = {}) =>
  renderToStaticMarkup(
    h(Surface, { kind, style, dangerouslySetInnerHTML: { __html: html }, ...props } as never),
  );

const rail = be('rail', { position: 'absolute', left: 16, top: 16, bottom: 16, width: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '10px 0' },
  ['Home', '2D', '3D', 'Files', 'Lib'].map((l, i) => o(l, i === 1)).join(''), { as: 'nav' });

const dock = be('dock', { position: 'absolute', left: '50%', bottom: 18, transform: 'translateX(-50%)', display: 'flex', gap: 2, height: 'var(--tap-lg)', padding: '0 6px', alignItems: 'center' },
  ['Select', 'Wall', 'Door', 'Dim', 'Copy', 'Mirror'].map((l, i) => o(l, i === 0)).join(''));

const inspector = be('inspector', { position: 'absolute', right: 0, top: 0, bottom: 0, width: 320, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 },
  `<div style="font:600 var(--fs-sm)/var(--lh-ui) inherit;color:var(--t1)">Inspector · Tường W-03</div>
   <div style="font:400 var(--fs-ui)/var(--lh-doc) inherit;color:var(--t3)">Bề mặt ĐẶC vì dày chữ. Chiều dài <b style="color:var(--t1)">4 250 mm</b> ${badge('measured')}<br/>Vật liệu sồi ${badge('inferred')}<br/>Giá NCC ${badge('external')} ${badge('stale')}</div>
   <div style="display:flex;gap:8px;flex-wrap:wrap">${nut('Nhận')}${nut('Huỷ')}</div>
   <div style="margin-top:auto;font:400 var(--fs-min)/var(--lh-doc) inherit;color:var(--t4)">EN: ${nhan('en')}</div>`, { as: 'aside' });

const widget = be('widget', { position: 'absolute', left: 96, top: 24, width: 300, padding: 16 },
  `<div style="font:600 var(--fs-sm)/var(--lh-ui) inherit;color:var(--t1)">Widget · Dự án gần đây</div>
   <div style="font:400 var(--fs-ui)/var(--lh-doc) inherit;color:var(--t3);margin-top:6px">Kính card trên hình nền (--nen-mo-card). Chữ Việt nhiều dòng dùng --lh-doc 1.5 nên dấu không chồng.</div>
   <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">${nhan('vi')}</div>`);

const sheet = be('sheet', { position: 'absolute', left: 96, top: 210, width: 420, padding: 18 },
  `<div style="font:600 var(--fs-md)/var(--lh-ui) inherit;color:var(--t1)">Sheet · Thư viện</div>
   <div style="font:400 var(--fs-ui)/var(--lh-doc) inherit;color:var(--t2);margin-top:6px">Lớp nổi kính, bo --r-4, bóng --shadow-sheet. Nút thứ hai đang có <b>focus bàn phím</b> (vòng --focus-ring, accent đặc, ≥3:1).</div>
   <div style="display:flex;gap:8px;margin-top:12px">${nut('Nút thường')}${nut('Nút focus').replace('<button', '<button id="do-focus"')}${nut('Nút mờ', 'opacity:var(--mo-vo-hieu)').replace('<button', '<button aria-disabled="true"')}</div>`,
  { className: 'if-reveal' });

const giamChoi = be('widget', { position: 'absolute', left: 420, top: 24, width: 220, padding: 14 },
  `<div style="font:600 var(--fs-ui)/var(--lh-ui) inherit;color:var(--t1)">Widget · nấc giảm chói</div>
   <div style="font:400 var(--fs-min)/var(--lh-doc) inherit;color:var(--t3);margin-top:4px">.if-surface--solid: tắt kính, giữ độ đọc (NT-16).</div>`, { solid: true });

const trang = (theme: string) => `<!doctype html><html data-theme="${theme}"><head><meta charset="utf-8"><style>${css}
body{margin:0;font-family:-apple-system,'Segoe UI',Roboto,system-ui,sans-serif}
.san{position:relative;width:1440px;height:900px;overflow:hidden;background:var(--surface-canvas)}
.nen{position:absolute;inset:0;background:
  radial-gradient(600px 400px at 30% 20%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 70%),
  radial-gradient(500px 500px at 80% 80%, color-mix(in srgb, var(--warning) 14%, transparent), transparent 70%),
  repeating-linear-gradient(45deg, transparent 0 40px, color-mix(in srgb, var(--t1) 5%, transparent) 40px 41px)}
.chu-thich{position:absolute;left:96px;bottom:90px;font:600 12px/1.3 inherit;color:var(--t4);letter-spacing:var(--ls-caps);text-transform:uppercase}
</style></head><body><div class="san"><div class="nen"></div>${rail}${widget}${giamChoi}${sheet}${dock}${inspector}<div class="chu-thich">Xưởng ${theme === 'dark' ? 'đêm' : 'sáng'} · rail (kính) · dock capsule (kính) · widget (kính card) · sheet (kính) · inspector (ĐẶC)</div></div></body></html>`;

for (const t of ['dark', 'light']) writeFileSync(join(RA, `trang-${t}.html`), trang(t));
console.log(`✅ dựng xong 2 trang → ${RA}`);
