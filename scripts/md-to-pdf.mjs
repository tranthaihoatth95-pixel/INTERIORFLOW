/**
 * scripts/md-to-pdf.mjs — gộp 2 md thành 1 PDF cầm đi.
 * Chạy: node scripts/md-to-pdf.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT = process.env.PDF_OUT || 'docs/audit-2026-08-18/if-y-lon-y-dac-sac.pdf';
const files = process.env.PDF_FILES
  ? JSON.parse(process.env.PDF_FILES)
  : [{ title: 'InteriorFlow · Ý LỚN + Ý ĐẶC SẮC KHÁC LẠ THÔNG MINH', path: 'docs/IF-Y-LON-Y-DAC-SAC.md' }];

// Md → HTML rất đơn giản (không dùng thư viện — tránh dep)
function md2html(md) {
  let h = md;
  h = h.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  h = h.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  h = h.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  h = h.replace(/```([\s\S]*?)```/g, (_, code) => `<pre><code>${code.replace(/</g, '&lt;')}</code></pre>`);
  h = h.replace(/`([^`]+)`/g, '<code>$1</code>');
  h = h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  h = h.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  // Bảng
  h = h.replace(/((?:^\|.+\|\n)+)/gm, (block) => {
    const rows = block.trim().split('\n').filter(Boolean);
    if (rows.length < 2) return block;
    const cells = (r) => r.split('|').slice(1, -1).map(c => c.trim());
    const isSep = (r) => /^\|[\s:|-]+\|$/.test(r);
    let html = '<table>';
    rows.forEach((r, i) => {
      if (isSep(r)) return;
      const tag = i === 0 ? 'th' : 'td';
      html += '<tr>' + cells(r).map(c => `<${tag}>${c}</${tag}>`).join('') + '</tr>';
    });
    html += '</table>';
    return html;
  });
  // Blockquote
  h = h.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
  h = h.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
  // Danh sách
  h = h.replace(/((?:^[-*] .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map(l => l.replace(/^[-*] /, '').trim());
    return '<ul>' + items.map(i => `<li>${i}</li>`).join('') + '</ul>';
  });
  h = h.replace(/((?:^\d+\. .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map(l => l.replace(/^\d+\. /, '').trim());
    return '<ol>' + items.map(i => `<li>${i}</li>`).join('') + '</ol>';
  });
  // Đoạn văn
  h = h.split(/\n\n+/).map(p => {
    p = p.trim();
    if (!p) return '';
    if (/^<(h[1-6]|ul|ol|pre|table|blockquote)/.test(p)) return p;
    return `<p>${p.replace(/\n/g, '<br>')}</p>`;
  }).join('\n');
  return h;
}

const parts = files.map((f, i) => `
<section class="doc">
  <h1 class="doc-title">${f.title}</h1>
  <div class="meta">Nguồn: <code>${f.path}</code></div>
  ${md2html(fs.readFileSync(f.path, 'utf8'))}
</section>
${i < files.length - 1 ? '<div class="page-break"></div>' : ''}
`).join('');

const html = `<!doctype html>
<html lang="vi"><head><meta charset="utf-8">
<title>IF Kiến trúc tổng hợp · 18/08</title>
<style>
  @page { size: A4; margin: 15mm 12mm; }
  body { font: 11px/1.55 -apple-system, "SF Pro Text", "Helvetica Neue", sans-serif; color: #1a1a1a; margin: 0; }
  .doc { }
  .doc-title { font-size: 24px; margin: 0 0 4px; border-bottom: 2px solid #333; padding-bottom: 6px; }
  .meta { color: #666; font-size: 10px; margin-bottom: 14px; font-family: ui-monospace, Menlo, monospace; }
  h1 { font-size: 20px; margin: 22px 0 8px; }
  h2 { font-size: 15px; margin: 18px 0 6px; border-bottom: 1px solid #ddd; padding-bottom: 3px; }
  h3 { font-size: 12px; margin: 12px 0 4px; }
  p { margin: 6px 0; }
  code { font-family: ui-monospace, Menlo, monospace; font-size: 10px; background: #f2f2f2; padding: 1px 4px; border-radius: 3px; }
  pre { background: #f5f5f5; border: 1px solid #e0e0e0; padding: 8px 10px; border-radius: 4px; overflow-x: auto; font-size: 9.5px; line-height: 1.4; break-inside: avoid; }
  pre code { background: none; padding: 0; }
  ul, ol { margin: 6px 0; padding-left: 20px; }
  li { margin: 2px 0; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; margin: 8px 0; break-inside: avoid; }
  th, td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; vertical-align: top; }
  th { background: #f0f0f0; font-weight: 600; }
  blockquote { border-left: 3px solid #6a57f5; margin: 8px 0; padding: 4px 10px; background: #f7f5ff; color: #333; }
  .page-break { page-break-after: always; height: 0; }
  strong { font-weight: 600; }
</style>
</head><body>
${parts}
</body></html>`;

fs.writeFileSync(OUT.replace('.pdf', '.html'), html);

const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
const page = await browser.newContext().then(c => c.newPage());
await page.goto('file://' + path.resolve(OUT.replace('.pdf', '.html')), { waitUntil: 'networkidle' });
await page.pdf({ path: OUT, format: 'A4', printBackground: true, margin: { top: '15mm', bottom: '15mm', left: '12mm', right: '12mm' } });
await browser.close();

const kb = Math.round(fs.statSync(OUT).size / 1024);
console.log(`PDF: ${OUT} (${kb}KB)`);
