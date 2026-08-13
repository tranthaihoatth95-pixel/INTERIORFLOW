/**
 * lib/ho-so-song/viewer-template.ts — sinh `index.html` TỰ CHỨA cho Gói Hồ Sơ Sống (tầng ①).
 *
 * TỰ CHỨA LÀ SỐNG CÒN: 0 request ra ngoài — không CDN, không font ngoài, không fetch.
 * Dữ liệu NHÚNG THẲNG vào trang qua `<script type="application/json">` (KHÔNG fetch
 * `data/deck.json` — fetch qua giao thức file bị nhiều trình duyệt chặn, đường nhúng là
 * đường chắc ăn; đã ghi trong phiếu goi-ho-so-song ④.3). Ảnh tham chiếu ĐƯỜNG TƯƠNG ĐỐI
 * `out/images/…` — thẻ <img> đường tương đối chạy tốt qua giao thức file.
 *
 * Màu: tone be/xám-đen — GIÁ TRỊ CHÉP từ `app/globals.css` (light `--bg:#f2efe9`, mực
 * `#221f1a` họ --t1, giấy kem `#f2efe9`) vì viewer phải tự chứa, không import được token.
 * [T3] trung tính: 0 brand cứng ngoài dòng "Tạo bởi InteriorFlow" nhỏ ở chân trang.
 * MARKER: HoSoSong.
 */

import type { HoSoSongBoqTomTat, HoSoSongKenh } from './types';

/** Dữ liệu viewer cần — tập con của gói, KHÔNG gồm entry của chính index.html (tự thân). */
export interface HoSoSongViewerData {
  projectId: string;
  tenDuAn: string;
  taoLuc: string;
  /** Kênh tầng ② + ③ (nganh/ruot) — viewer liệt kê để người nhận biết trong gói có gì. */
  kenh: HoSoSongKenh[];
  /** Ảnh trang deck theo thứ tự — path tương đối trong zip. */
  pages: Array<{ path: string; name: string }>;
  boq?: HoSoSongBoqTomTat;
  /** Kênh VẮNG (vd 'pdf', 'boq') — viewer ghi rõ, không giả vờ đủ [T0]. */
  vang: string[];
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** JSON an toàn nhúng trong <script>: thoát `<` để "</script>" trong dữ liệu không phá trang. */
function jsonForEmbed(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function renderViewerHtml(data: HoSoSongViewerData): string {
  const ten = escapeHtml(data.tenDuAn || 'Hồ sơ dự án');
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${ten} — Gói Hồ Sơ Sống</title>
<style>
  /* Giá trị màu chép từ app/globals.css (viewer tự chứa, không import được token) */
  :root{
    --bg:#f2efe9;         /* kem — globals.css light --bg */
    --ink:#221f1a;        /* mực đậm — họ --t1 */
    --muted:#6f6a61;
    --line:#dcd7cc;
    --card:#faf8f4;
    --dark:#0c0c0e;       /* globals.css dark --bg — dùng cho header */
  }
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--bg);color:var(--ink);
    font-family:ui-serif,Georgia,"Times New Roman",serif;line-height:1.55}
  .wrap{max-width:960px;margin:0 auto;padding:28px 24px 64px}
  header{border-bottom:1px solid var(--ink);padding:26px 0 18px;margin-bottom:26px}
  .kicker{font-family:ui-sans-serif,system-ui,sans-serif;font-size:11px;letter-spacing:.18em;
    text-transform:uppercase;color:var(--muted);margin-bottom:8px}
  h1{font-size:34px;font-weight:600;letter-spacing:-.01em}
  .sub{font-family:ui-sans-serif,system-ui,sans-serif;font-size:13px;color:var(--muted);margin-top:6px}
  h2{font-size:15px;font-family:ui-sans-serif,system-ui,sans-serif;letter-spacing:.14em;
    text-transform:uppercase;font-weight:600;margin:34px 0 12px}
  h2 .en{font-weight:400;color:var(--muted);letter-spacing:.06em;text-transform:none}
  ul.kenh{list-style:none}
  ul.kenh li{display:flex;gap:10px;align-items:baseline;padding:7px 0;
    border-bottom:1px dashed var(--line);font-family:ui-sans-serif,system-ui,sans-serif;font-size:13.5px}
  ul.kenh .tag{font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);
    border:1px solid var(--line);border-radius:999px;padding:1px 8px;white-space:nowrap}
  ul.kenh a{color:var(--ink)}
  ul.kenh .sha{margin-left:auto;font-family:ui-monospace,Menlo,monospace;font-size:10.5px;color:var(--muted)}
  .vang{font-family:ui-sans-serif,system-ui,sans-serif;font-size:12.5px;color:var(--muted);
    background:var(--card);border:1px solid var(--line);border-radius:9px;padding:9px 12px;margin-top:10px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px}
  .grid figure{background:var(--card);border:1px solid var(--line);border-radius:9px;overflow:hidden}
  .grid img{display:block;width:100%;height:auto}
  .grid figcaption{font-family:ui-sans-serif,system-ui,sans-serif;font-size:11.5px;
    color:var(--muted);padding:7px 10px}
  table{width:100%;border-collapse:collapse;font-family:ui-sans-serif,system-ui,sans-serif;font-size:13px}
  th{text-align:left;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);
    border-bottom:1px solid var(--ink);padding:6px 8px}
  td{border-bottom:1px solid var(--line);padding:7px 8px}
  td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}
  tr.tong td{font-weight:600;border-bottom:none;border-top:1px solid var(--ink)}
  footer{margin-top:48px;padding-top:14px;border-top:1px solid var(--line);
    font-family:ui-sans-serif,system-ui,sans-serif;font-size:11px;color:var(--muted)}
  .empty{color:var(--muted);font-family:ui-sans-serif,system-ui,sans-serif;font-size:13px}
</style>
</head>
<body>
<script type="application/json" id="ho-so-song-data">${jsonForEmbed(data)}</script>
<div class="wrap">
  <header>
    <div class="kicker">Gói Hồ Sơ Sống · Living Dossier</div>
    <h1 id="ten"></h1>
    <div class="sub" id="meta"></div>
  </header>
  <section>
    <h2>Trong gói <span class="en">· In this package</span></h2>
    <ul class="kenh" id="kenh"></ul>
    <div class="vang" id="vang" hidden></div>
  </section>
  <section id="sec-pages" hidden>
    <h2>Trang hồ sơ <span class="en">· Pages</span></h2>
    <div class="grid" id="pages"></div>
  </section>
  <section id="sec-boq" hidden>
    <h2>Khối lượng tóm tắt <span class="en">· BOQ summary</span></h2>
    <table id="boq"></table>
  </section>
  <footer>
    Mở tệp gốc trong <code>out/</code> bằng app phổ thông · dữ liệu máy-đọc trong
    <code>data/</code> + <code>manifest.json</code> — bất kỳ tầng nào không mở được,
    tầng còn lại vẫn dùng được. · Open the files in <code>out/</code> with common apps;
    machine-readable data lives in <code>data/</code>. <br>Tạo bởi InteriorFlow.
  </footer>
</div>
<script>
(function () {
  'use strict';
  var el = document.getElementById('ho-so-song-data');
  var d;
  try { d = JSON.parse(el.textContent); } catch (e) { return; }
  var byId = function (id) { return document.getElementById(id); };
  byId('ten').textContent = d.tenDuAn || 'Hồ sơ dự án';
  byId('meta').textContent = 'Xuất lúc · Exported ' + (d.taoLuc || '') +
    (d.projectId ? ' · ' + d.projectId : '');

  var TAG = { nganh: 'Tệp chuẩn ngành', ruot: 'Dữ liệu máy-đọc', viewer: 'Trang xem' };
  var ulk = byId('kenh');
  (d.kenh || []).forEach(function (k) {
    var li = document.createElement('li');
    var tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = TAG[k.loai] || k.loai;
    var a = document.createElement('a');
    a.href = k.path;
    a.textContent = k.path;
    var sha = document.createElement('span');
    sha.className = 'sha';
    sha.textContent = (k.sha256 || '').slice(0, 12);
    li.appendChild(tag); li.appendChild(a); li.appendChild(sha);
    ulk.appendChild(li);
  });
  if (!(d.kenh || []).length) {
    var liE = document.createElement('li');
    liE.className = 'empty';
    liE.textContent = 'Gói không có tệp đính kèm nào ngoài trang này.';
    ulk.appendChild(liE);
  }
  if ((d.vang || []).length) {
    var v = byId('vang');
    v.hidden = false;
    v.textContent = 'Kênh vắng trong gói này (không có dữ liệu lúc xuất — không phải lỗi tệp): '
      + d.vang.join(', ') + ' · Channels absent from this package: ' + d.vang.join(', ');
  }

  if ((d.pages || []).length) {
    byId('sec-pages').hidden = false;
    var g = byId('pages');
    d.pages.forEach(function (p, i) {
      var f = document.createElement('figure');
      var img = document.createElement('img');
      img.src = p.path; img.alt = p.name; img.loading = 'lazy';
      var cap = document.createElement('figcaption');
      cap.textContent = String(i + 1).padStart(2, '0') + ' · ' + p.name;
      f.appendChild(img); f.appendChild(cap);
      g.appendChild(f);
    });
  }

  if (d.boq && (d.boq.rows || []).length) {
    byId('sec-boq').hidden = false;
    var t = byId('boq');
    var fmt = function (n) { return Number(n || 0).toLocaleString('vi-VN'); };
    var thead = document.createElement('tr');
    ['Hạng mục · Item', 'KL · Qty', 'ĐV · Unit', 'Thành tiền · Amount'].forEach(function (h, i) {
      var th = document.createElement('th');
      if (i > 0) th.className = 'n';
      th.textContent = h;
      thead.appendChild(th);
    });
    t.appendChild(thead);
    d.boq.rows.forEach(function (r) {
      var tr = document.createElement('tr');
      [r.ten, fmt(r.qty), r.unit, fmt(r.thanhTien)].forEach(function (c, i) {
        var td = document.createElement('td');
        if (i > 0) td.className = 'n';
        td.textContent = String(c == null ? '' : c);
        tr.appendChild(td);
      });
      t.appendChild(tr);
    });
    var trT = document.createElement('tr');
    trT.className = 'tong';
    ['Tổng · Total', '', '', fmt(d.boq.tong)].forEach(function (c, i) {
      var td = document.createElement('td');
      if (i > 0) td.className = 'n';
      td.textContent = c;
      trT.appendChild(td);
    });
    t.appendChild(trT);
  }
})();
</script>
</body>
</html>
`;
}
