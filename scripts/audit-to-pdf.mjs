/**
 * scripts/audit-to-pdf.mjs — dựng HTML báo cáo audit + xuất PDF cầm đi máy bay.
 * Chạy: node scripts/audit-to-pdf.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = 'docs/audit-2026-08-18';
const data = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'ket-qua.json'), 'utf8'));

function b64(p) {
  const buf = fs.readFileSync(p);
  return `data:image/png;base64,${buf.toString('base64')}`;
}

const cumLabel = {
  app: 'CỤM XƯỞNG (app)',
  'du-an': 'CỤM DỰ ÁN',
  legacy: 'ĐƯỜNG TẮT CŨ (nên dọn)',
  dev: 'DEV BENCH',
  auth: 'CỔNG VÀO',
};

const cums = ['app', 'du-an', 'legacy', 'dev', 'auth'];

// Bảng lệch cơ bản đo từ JSON
function chan(r) {
  const b = [];
  if (!r.ok) b.push(`🔴 FAIL: ${r.note}`);
  if (r.redirect) b.push(`↪ chuyển hướng → ${r.redirect}`);
  if (r.consoleErrors >= 5) b.push(`🔴 ${r.consoleErrors} lỗi console`);
  else if (r.consoleErrors >= 2) b.push(`🟡 ${r.consoleErrors} lỗi console`);
  if (r.ms > 15000) b.push(`⚠ compile chậm ${(r.ms/1000).toFixed(1)}s`);
  return b;
}

const overview = {
  total: data.results.length,
  ok: data.results.filter(r => r.ok).length,
  fail: data.results.filter(r => !r.ok).length,
  redirect: data.results.filter(r => r.redirect).length,
  err5plus: data.results.filter(r => r.consoleErrors >= 5).length,
  chuaLogin: data.results.filter(r => r.redirect === '/intro').length,
};

const html = `<!doctype html>
<html lang="vi"><head><meta charset="utf-8">
<title>Audit IF 18/08 — 25 route</title>
<style>
  @page { size: A4 landscape; margin: 12mm 10mm; }
  body { font: 11px/1.4 -apple-system, "SF Pro Text", "Helvetica Neue", sans-serif; color: #1a1a1a; background: #fff; margin: 0; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 16px; margin: 24px 0 8px; padding-bottom: 4px; border-bottom: 1px solid #ccc; }
  h3 { font-size: 13px; margin: 12px 0 4px; }
  .meta { color: #666; font-size: 10px; margin-bottom: 12px; }
  .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 8px; }
  .kpi { border: 1px solid #ddd; padding: 6px 8px; border-radius: 6px; }
  .kpi b { font-size: 16px; display: block; }
  .kpi span { color: #666; font-size: 10px; }
  .route { break-inside: avoid; page-break-inside: avoid; margin-bottom: 14px; border: 1px solid #ddd; border-radius: 6px; padding: 8px; }
  .route-head { display: flex; justify-content: space-between; gap: 8px; align-items: baseline; margin-bottom: 4px; }
  .route-title { font-weight: 600; font-size: 12px; }
  .route-url { font-family: ui-monospace, Menlo, monospace; color: #666; font-size: 10px; }
  .route-cum { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 9px; font-weight: 600; letter-spacing: 0.06em; background: #e6e6e6; color: #444; }
  .route-cum.du-an { background: #dfe9ff; color: #234; }
  .route-cum.legacy { background: #ffe4d6; color: #632; }
  .route-cum.dev { background: #eee; color: #666; }
  .route-cum.auth { background: #d6ffd6; color: #263; }
  .lech { font-size: 10px; margin: 4px 0; }
  .lech span { display: inline-block; margin-right: 6px; padding: 1px 5px; background: #fff5e6; border-radius: 3px; }
  .lech span.red { background: #ffe0e0; color: #900; }
  img { width: 100%; max-height: 300px; object-fit: contain; object-position: top; border: 1px solid #ddd; border-radius: 4px; display: block; }
  .luong { border: 1px solid #ddd; padding: 12px; border-radius: 6px; background: #fafafa; }
  .luong pre { margin: 0; font: 10px/1.5 ui-monospace, Menlo, monospace; white-space: pre-wrap; }
  .luat { background: #fffbe6; border: 1px solid #ffd; padding: 8px 10px; border-radius: 6px; margin: 10px 0; }
  .note { color: #666; font-size: 10px; margin-top: 4px; }
</style>
</head><body>

<h1>Audit InteriorFlow · 18/08/2026</h1>
<div class="meta">25 route chụp desktop 1440×900 · dev server localhost:3000 · headless Chrome · nguồn: <code>docs/audit-2026-08-18/</code></div>

<div class="grid-4">
  <div class="kpi"><b>${overview.total}</b><span>Route chụp</span></div>
  <div class="kpi"><b>${overview.fail}</b><span>Lỗi mở (timeout/HTTP)</span></div>
  <div class="kpi"><b>${overview.chuaLogin}</b><span>Redirect → /intro (chưa login)</span></div>
  <div class="kpi"><b>${overview.err5plus}</b><span>Console error ≥5</span></div>
</div>

<div class="luat">
<b>LUẬT MỚI Hoà đặt 18/08:</b> mọi thiết kế UI phải áp dụng Design System, cấm sinh "thiết kế mồ côi".
Audit này chấm sơ bộ 25 route theo TÌNH TRẠNG MỞ + LỆCH ROUTER + ERROR CONSOLE. Chấm chi tiết NT-1..18 làm sau khi Hoà điều chỉnh trên máy bay.
</div>

<h2>Sơ đồ luồng router</h2>
<div class="luong"><pre>
CỔNG VÀO
  /login  ──(auth ok)──▶  /  (Home dashboard)
  /intro  ──(giới thiệu)──▶  /login  or  /

CHƯA LOGIN
  6 route thầm redirect → /intro:
    /  ·  /projects/[id]/render  ·  /cad-editor  ·  /present-editor  ·  /photo-editor  ·  (dev bench thoải mái vào)

CỤM XƯỞNG (sidebar STUDIO)
  /            Home bento — Vitals + widget dự án + hình ánh sáng
  /tasks       Bảng việc
  /files       Files (chốt 17/08: hai TẦNG — thư mục hệ thống + Collection+ 8 gói)
  /library     Thư viện  → HIỆN đang redirect → /files (bất thường, cần đo)
  /library/gallery   Gallery ảnh tuyển
  /library/ingest    Nhập file lạ vào thư viện
  /materials         KỆ VẬT LIỆU ĐỨNG NGOÀI (sổ 17/08 chốt: gộp vào Thư viện, KHÔNG rail)
  /colors            BẢNG MÀU ĐỨNG NGOÀI (sổ 17/08 chốt: là BƯỚC trong chọn vật liệu)
                     → HIỆN redirect → /materials
  /workhub     Chat + tài liệu
  /settings    Cài đặt
    /about       Giới thiệu
    /avatar      🔴 FAIL — timeout
    /licenses    🔴 FAIL — chrome error

CỤM DỰ ÁN (mở khi có dự án đang mở)
  /projects/[id]/overview    Tổng quan dự án
  /projects/[id]/notebook    Ý tưởng + tài liệu
  /projects/[id]/cad         Chặng 1 — 2D Kỹ thuật
  /projects/[id]/render      Chặng 2 — 3D Thiết kế  (đang chặn login → /intro)
  /projects/[id]/present     Chặng 3 — Trình bày  (7 lỗi console — cao nhất)
  /projects/[id]/photo       Photo editor

ĐƯỜNG TẮT CŨ (nghi ngờ nên DỌN — trùng với đường /projects/[id]/*)
  /cad-editor      → hiện chỉ redirect /intro
  /present-editor  → nt
  /photo-editor    → nt

DEV / SHARE
  /dev-bench-3d-2   sandbox dev
  /share/[token]    xem hồ sơ share (không mở test được vì cần token)
</pre></div>

<div class="note">
✱ <b>Lệch cấu trúc phát hiện</b>: /materials và /colors là 2 route rail ĐỨNG NGOÀI Thư viện — trái chốt 17/08
"vật liệu là kệ TRONG Thư viện · bảng màu là BƯỚC trong chọn vật liệu".
Nên gộp về /library và bỏ 2 mục rail này. ↔ /library redirect → /files là bất thường,
có thể lỗi router (thư viện đáng lẽ mở tấm Thư viện).
</div>

${cums.map(cum => {
  const rs = data.results.filter(r => r.cum === cum);
  return `<h2>${cumLabel[cum]}</h2>
  ${rs.map(r => {
    const imgPath = path.join(OUT_DIR, 'anh', `${r.id}.png`);
    const img = fs.existsSync(imgPath) ? `<img src="${b64(imgPath)}" alt="${r.ten}">` : '<div class="note">(chưa chụp được)</div>';
    const b = chan(r);
    return `<div class="route">
      <div class="route-head">
        <div class="route-title">${r.ten}</div>
        <div class="route-url">${r.url}</div>
        <div class="route-cum ${r.cum}">${r.cum}</div>
      </div>
      ${b.length ? `<div class="lech">${b.map(x => `<span class="${x.startsWith('🔴') ? 'red' : ''}">${x}</span>`).join('')}</div>` : ''}
      ${img}
    </div>`;
  }).join('\n')}`;
}).join('\n')}

<h2>Đợt sửa gợi ý (T đề xuất — Hoà điều chỉnh trên máy bay)</h2>
<ol style="font-size: 11px; line-height: 1.6;">
  <li><b>Nợ 17/08 đã xử:</b> gỡ StageSwitcher góc trên · ô tìm dự án lên top + Vitals cạnh · PanelFlank tan vào nền (18/08 sáng nay).</li>
  <li><b>Sửa 2 FAIL routes ngay</b>: /settings/avatar và /settings/licenses timeout/chrome error — nghi Suspense hoặc lỗi module.</li>
  <li><b>Dọn 3 đường tắt cũ</b>: /cad-editor · /present-editor · /photo-editor đều chỉ redirect /intro — không có giá trị, gây rối cây route. Đề xuất xoá và redirect vĩnh viễn về đường /projects/[id]/*.</li>
  <li><b>Gộp /materials + /colors vào /library</b> đúng chốt 17/08. Bỏ 2 mục rail này.</li>
  <li><b>/library đang redirect → /files</b> là bất thường — Thư viện phải mở TẤM Thư viện chứ không phải file manager. Sửa router.</li>
  <li><b>/projects/[id]/present 7 lỗi console</b> — cao nhất. Cần đo lỗi cụ thể trước khi thêm tính năng.</li>
  <li><b>Home nợ còn</b>: card 3 nấc thu/vừa/full · widget cỡ định sẵn 1×1/2×1/2×2 (chốt 16/08, mâu thuẫn với bentoFillPercent hiện tại — cần Hoà xác nhận).</li>
</ol>

</body></html>`;

fs.writeFileSync(path.join(OUT_DIR, 'bao-cao.html'), html);
console.log('HTML written.');

// Convert to PDF
const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
const ctx = await browser.newContext();
const page = await ctx.newPage();
await page.goto('file://' + path.resolve(OUT_DIR, 'bao-cao.html'), { waitUntil: 'networkidle' });
await page.pdf({
  path: path.join(OUT_DIR, 'audit-if-18-08.pdf'),
  format: 'A4',
  landscape: true,
  printBackground: true,
  margin: { top: '12mm', bottom: '12mm', left: '10mm', right: '10mm' },
});
await browser.close();

console.log(`PDF: ${OUT_DIR}/audit-if-18-08.pdf`);
