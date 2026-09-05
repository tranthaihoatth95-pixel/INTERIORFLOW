/**
 * scripts/dung-cua-duyet-mat.mjs — DỰNG TRANG CỬA DUYỆT MẮT (một tệp HTML tự chứa).
 *
 * VÌ SAO CÓ TỆP NÀY: nút thắt của dự án không phải code — là **nợ nghiệm thu mắt**
 * (76 mục xong-máy đối 1 mục qua mắt). Cơ chế thư mục Drive (chốt 16/08) chỉ chạy trên
 * máy Hoà; phiên đám mây không với tới thư mục sync đó. Trang này là mặt tiền thứ hai của
 * CÙNG cơ chế: gom ảnh bằng chứng đã có trong repo thành MỘT trang Hoà mở trên điện thoại,
 * bấm Đạt/Sửa ngay tại chỗ. Không đẻ kho ảnh mới — nó chỉ ĐỌC `docs/delivery/anh-duyet-mat/`.
 *
 * CHẠY:
 *   node scripts/dung-cua-duyet-mat.mjs          → in ra đường dẫn tệp HTML dựng được
 *   IF_RA=<đường dẫn>                            đổi chỗ ghi (mặc định: thư mục tạm)
 *
 * ẢNH: nén sang JPEG rộng 1280 rồi nhúng thẳng dạng data URI — trang phải TỰ CHỨA vì nó
 * được xuất bản ra ngoài repo, không kéo được tệp kèm. Nguồn ảnh vẫn là repo, luôn luôn.
 *
 * ⚠️ KHÔNG phải nguồn sự thật giao diện. Nguồn vẫn là `docs/mocks/` (luật 02/08).
 *    Tệp này chỉ là cái khay bưng ảnh ra trước mắt người duyệt.
 */
import fs from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { nap } from './lib/anh-duyet-mat.mjs';

/* Nạp trước toàn bộ ảnh vào bộ nhớ rồi mới dựng chuỗi — để phần dựng HTML dưới đây
   ở dạng đồng bộ, đọc thẳng một mạch. Thiếu một ảnh là `nap` ném lỗi, không dựng nửa vời. */
const _kho = new Map();
const anh = (t) => {
  const v = _kho.get(t);
  if (!v) throw new Error(`ảnh "${t}" chưa được nạp trước — thêm vào danh sách TEN_ANH`);
  return v;
};

const khung = (ten, ma, chu) =>
  `<figure class="khung">
     <img class="anh anh-sang" src="${anh(ten + '-sang')}" alt="${chu}">
     <img class="anh anh-toi"  src="${anh(ten + '-toi')}"  alt="${chu}">
     <figcaption><b class="ma">${ma}</b> ${chu}</figcaption>
   </figure>`;

const phan = (id, hoi) =>
  `<div class="phan" data-id="${id}">
     <p class="phan-hoi">${hoi}</p>
     <div class="phan-hang">
       <div class="phan-nut" role="group" aria-label="Phán quyết ${id}">
         <button type="button" class="nut nut-dat" data-y="dat" aria-pressed="false"><span class="dau"></span>Đạt</button>
         <button type="button" class="nut nut-sua" data-y="sua" aria-pressed="false"><span class="dau"></span>Sửa</button>
       </div>
       <input class="ghi" type="text" placeholder="Sai chỗ nào — một câu là đủ" aria-label="Ghi chú cho ${id}">
     </div>
     <p class="phan-tt" role="status">chưa phán</p>
     <p class="phan-in">Đạt ☐&nbsp;&nbsp;&nbsp;Sửa ☐&nbsp;&nbsp;&nbsp;ghi chú: &nbsp;<span class="ke"></span></p>
   </div>`;

const VT = [
  ['vitals-home-light-ambient', 'vitals-home-dark-ambient', 'VT·1', 'Mức nghỉ — khẩu độ ở mép trên, cạnh ô tìm kiếm'],
  ['vitals-home-light-peek', 'vitals-home-dark-peek', 'VT·2', 'Mức hé — cùng tâm đó nở ra, chưa chiếm chỗ'],
  ['vitals-home-light-engage', 'vitals-home-dark-engage', 'VT·3', 'Mức vào việc — bảng mọc xuống TỪ chính khẩu độ'],
  ['vitals-home-light-cmdJ', 'vitals-home-dark-cmdJ', 'VT·4', 'Mở bằng ⌘J — đường bàn phím, không phải chuột'],
];
const VT2 = [
  ['vitals-cad-light-ambient', 'vitals-cad-dark-ambient', 'VT·5', 'Nghỉ — trong chặng Thiết kế 2D'],
  ['vitals-cad-light-engage', 'vitals-cad-dark-engage', 'VT·6', 'Vào việc — trong chặng Thiết kế 2D'],
  ['vitals-files-light-ambient', 'vitals-files-dark-ambient', 'VT·7', 'Nghỉ — ở Tệp'],
  ['vitals-files-light-engage', 'vitals-files-dark-engage', 'VT·8', 'Vào việc — ở Tệp'],
];
const khungVT = (r) =>
  `<figure class="khung">
     <img class="anh anh-sang" src="${anh(r[0])}" alt="${r[3]}">
     <img class="anh anh-toi"  src="${anh(r[1])}" alt="${r[3]}">
     <figcaption><b class="ma">${r[2]}</b> ${r[3]}</figcaption>
   </figure>`;

const H = (n) => [
  [`mock-home-h${n}-a-1600x900`, `H${n}·a`, 'Ngày thường — có việc đang dở'],
  [`mock-home-h${n}-b-rong-1600x900`, `H${n}·b`, 'Studio rỗng — chưa có dự án nào'],
  [`mock-home-h${n}-c-nhieu-1600x900`, `H${n}·c`, 'Bảy dự án — và một loại nội dung khác'],
];

/** Mọi tên ảnh trang này dùng — nạp trước, một chỗ khai duy nhất. */
const TEN_ANH = [
  ...VT.flatMap((r) => [r[0], r[1]]),
  ...VT2.flatMap((r) => [r[0], r[1]]),
  ...[1, 2, 3].flatMap((n) => H(n).flatMap((r) => [r[0] + '-sang', r[0] + '-toi'])),
];
for (const t of TEN_ANH) _kho.set(t, await nap(t));

const html = `<title>Cửa Duyệt Mắt 04/09</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnamese+Pro:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
:root{
  --nen:#f4f4f8; --mat:#ffffff; --muc:#17171d; --mo:#63637a; --nhat:#8b8ba0;
  --vien:#e3e3ec; --vien-dam:#cfcfdd; --nhan:#6a57f5;
  --dat:#0f7350; --dat-nen:#e6f4ee; --sua:#a92c2c; --sua-nen:#fbe9e9;
  --anh-vien:#dedee9;
  --r1:6px; --r2:10px; --r3:14px; --r4:20px; --r-tron:999px;
}
:root:not([data-theme="light"]){}
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
    --nen:#111116; --mat:#191920; --muc:#e9e9f2; --mo:#9494a8; --nhat:#77778a;
    --vien:#27272f; --vien-dam:#3a3a45; --nhan:#9184ff;
    --dat:#54c894; --dat-nen:#12271e; --sua:#ff9a9a; --sua-nen:#2a1616;
    --anh-vien:#2c2c36;
  }
}
:root[data-theme="dark"]{
  --nen:#111116; --mat:#191920; --muc:#e9e9f2; --mo:#9494a8; --nhat:#77778a;
  --vien:#27272f; --vien-dam:#3a3a45; --nhan:#9184ff;
  --dat:#54c894; --dat-nen:#12271e; --sua:#ff9a9a; --sua-nen:#2a1616;
  --anh-vien:#2c2c36;
}
*{box-sizing:border-box}
body{background:var(--nen);color:var(--muc);
  font-family:"Be Vietnamese Pro",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
  font-size:16px;line-height:1.6;-webkit-font-smoothing:antialiased}
.ma,.so{font-family:"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,monospace;
  font-variant-numeric:tabular-nums}

/* ── thanh đỉnh ─────────────────────────────────────────── */
.dinh{position:sticky;top:0;z-index:9;background:color-mix(in srgb,var(--nen) 88%,transparent);
  backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  border-bottom:1px solid var(--vien)}
.dinh-trong{max-width:1120px;margin:0 auto;padding:11px 24px;
  display:flex;align-items:center;gap:18px;flex-wrap:wrap}
.dinh-ten{font-weight:600;font-size:15px;letter-spacing:-.01em;margin-right:auto}
.dinh-ten em{font-style:normal;color:var(--mo);font-weight:400}
.doi{display:inline-flex;padding:3px;gap:2px;background:var(--mat);
  border:1px solid var(--vien);border-radius:var(--r-tron)}
.doi button{appearance:none;border:0;background:none;cursor:pointer;color:var(--mo);
  font:inherit;font-size:13px;font-weight:500;padding:5px 15px;border-radius:var(--r-tron)}
.doi button[aria-pressed="true"]{background:var(--muc);color:var(--nen)}
.dem{font-size:13px;color:var(--mo)}
.dem b{color:var(--muc);font-weight:600}

/* ── thân ───────────────────────────────────────────────── */
main{max-width:1120px;margin:0 auto;padding:0 24px 96px}
.mo{padding:52px 0 40px;max-width:66ch;display:flex;flex-direction:column;gap:16px}
h1{font-size:clamp(30px,4.4vw,44px);line-height:1.12;font-weight:700;letter-spacing:-.025em;
  margin:0;text-wrap:balance}
.mo p{margin:0;color:var(--mo);font-size:17px}
.mo p strong{color:var(--muc);font-weight:600}
.canh{border-left:2px solid var(--vien-dam);padding:2px 0 2px 16px;
  font-size:15px;color:var(--mo)}
.canh b{color:var(--muc);font-weight:600}

.lo{padding-top:44px;border-top:1px solid var(--vien);margin-top:44px}
.lo-dau{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin-bottom:6px}
.lo-so{font-size:12px;font-weight:500;letter-spacing:.13em;text-transform:uppercase;
  color:var(--nhan)}
h2{font-size:26px;font-weight:600;letter-spacing:-.02em;margin:0}
.lo-phu{margin:8px 0 0;color:var(--mo);max-width:70ch}
.lo-phu code{font-family:"IBM Plex Mono",monospace;font-size:.88em;
  background:var(--mat);border:1px solid var(--vien);border-radius:var(--r1);padding:1px 5px}

h3{font-size:19px;font-weight:600;margin:38px 0 4px;letter-spacing:-.01em}
h3 .cach{color:var(--nhat);font-weight:400}
.ta{margin:0 0 18px;color:var(--mo);max-width:70ch}

/* ── ảnh ────────────────────────────────────────────────── */
.day{display:flex;flex-direction:column;gap:26px;margin:20px 0 4px}
.khung{margin:0;display:flex;flex-direction:column;gap:9px}
.anh{display:block;width:100%;height:auto;border:1px solid var(--anh-vien);
  border-radius:var(--r2);background:var(--mat)}
:root[data-anh="sang"] .anh-toi{display:none}
:root:not([data-anh="toi"]) .anh-toi{display:none}
:root[data-anh="toi"] .anh-sang{display:none}
:root[data-anh="toi"] .anh-toi{display:block}
figcaption{font-size:13.5px;color:var(--mo);display:flex;gap:10px;align-items:baseline}
figcaption .ma{color:var(--muc);font-size:12px;font-weight:500;flex:0 0 auto}

/* ── phán quyết ─────────────────────────────────────────── */
.phan{margin:26px 0 0;padding:18px 20px;background:var(--mat);
  border:1px solid var(--vien);border-left:3px solid var(--vien-dam);border-radius:var(--r2);
  display:flex;flex-direction:column;gap:12px}
.phan[data-y="dat"]{border-left-color:var(--dat);background:var(--dat-nen)}
.phan[data-y="sua"]{border-left-color:var(--sua);background:var(--sua-nen)}
.phan-hoi{margin:0;font-weight:600;font-size:15px}
.phan-hang{display:flex;gap:12px;flex-wrap:wrap;align-items:center}
.phan-nut{display:flex;gap:8px}
.nut{appearance:none;cursor:pointer;font:inherit;font-size:14px;font-weight:600;
  padding:8px 18px;border-radius:var(--r-tron);background:var(--nen);
  border:1px solid var(--vien-dam);color:var(--muc);
  display:inline-flex;align-items:center;gap:8px}
.dau{width:9px;height:9px;border:1.5px solid currentColor;border-radius:var(--r-tron);
  opacity:.45}
.nut-dat[aria-pressed="true"]{background:var(--dat);border-color:var(--dat);color:var(--nen)}
.nut-sua[aria-pressed="true"]{background:var(--sua);border-color:var(--sua);color:var(--nen)}
.nut[aria-pressed="true"] .dau{background:currentColor;opacity:1;border-radius:2px}
.nut-dat[aria-pressed="true"] .dau{border-radius:var(--r-tron)}
.ghi{flex:1 1 260px;min-width:0;font:inherit;font-size:14px;padding:8px 13px;
  border-radius:var(--r2);border:1px solid var(--vien-dam);background:var(--nen);color:var(--muc)}
.ghi::placeholder{color:var(--nhat)}
.phan-tt{margin:0;font-size:13px;color:var(--mo)}
:focus-visible{outline:2px solid var(--nhan);outline-offset:2px}

.cuoi{margin-top:56px;padding-top:26px;border-top:1px solid var(--vien);
  font-size:14px;color:var(--mo);max-width:70ch;display:flex;flex-direction:column;gap:10px}

/* ── BẢN IN / PDF ───────────────────────────────────────────
   Trang này có hai đời sống: trên màn thì bấm được, in ra thì viết tay lên.
   Nút bấm và ô nhập vô nghĩa trên giấy ⇒ thay bằng ô tick + dòng kẻ. */
.phan-in{display:none}
.ke{display:inline-block;flex:1;min-width:180px;border-bottom:1px solid var(--vien-dam);
  height:1.1em;vertical-align:bottom}
@media print{
  :root{print-color-adjust:exact;-webkit-print-color-adjust:exact}
  .dinh{display:none}
  .doi,.phan-nut,.ghi,.phan-tt{display:none}
  .phan-in{display:flex;align-items:baseline;gap:6px;margin:0;font-size:14px;font-weight:600}
  main{max-width:none;padding:0}
  .mo{padding:0 0 22px}
  h1{font-size:32px}
  .lo{break-before:page;page-break-before:always;margin-top:0;padding-top:0;border-top:0}
  .khung,.phan{break-inside:avoid;page-break-inside:avoid}
  h3{break-after:avoid;page-break-after:avoid}
  .day{gap:18px}
  a{color:inherit}
}
@page{size:A4;margin:14mm 13mm}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
@media (max-width:640px){
  main{padding:0 16px 72px} .dinh-trong{padding:10px 16px;gap:12px}
  .mo{padding:34px 0 26px} .dinh-ten{flex:1 1 100%;margin-right:0}
}
</style>

<header class="dinh"><div class="dinh-trong">
  <span class="dinh-ten">Cửa duyệt mắt <em>· 04/09</em></span>
  <div class="doi" role="group" aria-label="Nền của ảnh">
    <button type="button" data-nen="sang" aria-pressed="true">Nền sáng</button>
    <button type="button" data-nen="toi" aria-pressed="false">Nền tối</button>
  </div>
  <span class="dem"><b id="dem-so">0</b>/4 đã phán</span>
</div></header>

<main>
  <section class="mo">
    <h1>Bốn thứ đang đứng chờ mắt anh</h1>
    <p>Máy đã phán hết phần máy phán được: <strong>0 tràn khung · 0 vượt khổ · 0 chữ dưới ngưỡng</strong>.
       Phần còn lại máy không phán nổi — <strong>bố cục và gu</strong> — nên nó dừng ở đây.</p>
    <div class="canh">
      <b>Lô A · Vitals</b> là <b>ảnh app thật</b>, chụp sau bản sửa 03:15 (nhãn thôi nói dối chặng).<br>
      <b>Lô B · Home</b> là <b>bản vẽ, 0 dòng mã</b> — ba hướng khác nhau ở <b>cơ chế</b>, không phải ở lớp sơn.
    </div>
    <p>Bấm <strong>Đạt</strong> hoặc <strong>Sửa</strong> dưới mỗi mục. Phán quyết lưu lại, tôi đọc được.
       Gạt <em>Nền tối</em> ở trên để soi cả hai nền.</p>
  </section>

  <section class="lo">
    <div class="lo-dau"><span class="lo-so">Lô A</span><h2>Khẩu độ Vitals ở mép trên</h2></div>
    <p class="lo-phu">Trong IF, chỗ nói chuyện với AI là <b>Vitals</b> — một khẩu độ sống ở mép trên,
      nở ba mức từ chính tâm nó. Không phải hộp thoại, không phải trợ lý riêng ở góc.
      Nó có mặt ở <b>mọi</b> màn, mắc ở <code>AppChrome</code> chứ không riêng Home.</p>

    <h3>Ba mức, tại Home <span class="cach">· nghỉ → hé → vào việc</span></h3>
    <p class="ta">Câu hỏi duy nhất: ba khung này có đọc ra <b>một vật đang nở</b> không —
      hay ra <b>ba vật khác nhau</b>?</p>
    <div class="day">${VT.map(khungVT).join('')}</div>

    <h3>Cùng khẩu độ đó, ở chặng khác <span class="cach">· 2D · Tệp</span></h3>
    <p class="ta">Để xác nhận nó không phải đồ trang trí riêng của Home.</p>
    <div class="day">${VT2.map(khungVT).join('')}</div>
    ${phan('vitals', 'Khẩu độ Vitals — đứng đúng chỗ, nở đúng cách chưa?')}
  </section>

  <section class="lo">
    <div class="lo-dau"><span class="lo-so">Lô B</span><h2>Home — ba hướng hệ thống</h2></div>
    <p class="lo-phu">Home không phải trang Resume, không phải bảng điều khiển.
      Nó là <b>studio cá nhân đang sống</b>. Việc đang làm là <b>một</b> đối tượng trội trong Home,
      không phải toàn bộ Home. Mỗi hướng dựng ba khung để không ai đoán được nó chỉ đẹp lúc dữ liệu đẹp.</p>

    <h3>H1 · Tường sống <span class="cach">· môi trường mạnh nhất</span></h3>
    <p class="ta">Tường ảnh <b>là mặt phẳng của Home</b>, không phải hình dán sau lưng nội dung.
      Lớp chính không có hộp chứa nào ⇒ <b>không thể có hộp rỗng khổng lồ</b>. Chữ đè hình, đọc được
      nhờ dải dìm cục bộ ở chân chữ. Rủi ro: chữ trên ảnh — <b>đọc được hay không phụ thuộc ảnh của
      chính người dùng</b>.</p>
    <div class="day">${H(1).map((r) => khung(r[0], r[1], r[2])).join('')}</div>
    ${phan('h1', 'H1 · Tường sống')}

    <h3>H2 · Xưởng cá nhân <span class="cach">· cân bằng nhất</span></h3>
    <p class="ta">Vật <b>chồng lớp theo chiều sâu</b> như mặt bàn thật: việc đang làm mở sẵn ở lớp trên,
      mẫu vật liệu và mẩu ghi tay gập lại lệch lớp, dự án khác lùi ra rìa phải. Không lưới, không thẻ
      đều nhau. Môi trường cố ý <b>tĩnh</b> để vật là thứ được nhìn. Rủi ro: đông vật ⇒ dễ trôi về
      “bàn bừa”.</p>
    <div class="day">${H(2).map((r) => khung(r[0], r[1], r[2])).join('')}</div>
    ${phan('h2', 'H2 · Xưởng cá nhân')}

    <h3>H3 · Bàn lặng <span class="cach">· ít vật nhất</span></h3>
    <p class="ta">Thường trực đúng <b>ba</b> vật: một vật việc · một chồng dự án ở góc · một dòng chân.
      Mọi năng lực khác <b>gọi mới hiện</b> — đây là cách duy nhất giữ được “không widget nào có trọng
      lượng thường trực chỉ vì năng lực tồn tại” mà không mất đường vào. Rủi ro: ít quá ⇒ dễ thành
      <b>trang giới thiệu</b>.</p>
    <div class="day">${H(3).map((r) => khung(r[0], r[1], r[2])).join('')}</div>
    ${phan('h3', 'H3 · Bàn lặng')}
  </section>

  <div class="cuoi">
    <p><b>Nếu muốn ghép:</b> bấm Sửa cho hai hướng không chọn, rồi viết vào ô ghi chú
      của hướng còn lại — ví dụ <em>“lấy xương H2, lấy cách xử chữ của H1”</em>.</p>
    <p><b>Chưa xác minh, nói thẳng:</b> lô B chưa chạy trên app thật một dòng nào — số đo lấy từ bản vẽ.
      Chữ nằm trên ảnh thì máy <b>không đo được</b> tương phản (H1 nhiều nhất: 31 · 8 · 31 đoạn),
      đó chính là cái giá của việc chữ đè hình, và chỉ mắt anh phán được.</p>
  </div>
</main>

<script>
(function(){
  var goc = document.documentElement;
  goc.setAttribute('data-anh','sang');
  document.querySelectorAll('.doi button').forEach(function(b){
    b.addEventListener('click', function(){
      goc.setAttribute('data-anh', b.dataset.nen);
      document.querySelectorAll('.doi button').forEach(function(x){
        x.setAttribute('aria-pressed', String(x === b));
      });
    });
  });

  var kho = null, so = document.getElementById('dem-so');
  var trangThai = {};
  function demLai(){
    so.textContent = String(Object.keys(trangThai).filter(function(k){ return trangThai[k]; }).length);
  }
  function ve(o, y, ghi, luu){
    o.setAttribute('data-y', y || '');
    o.querySelectorAll('.nut').forEach(function(n){
      n.setAttribute('aria-pressed', String(n.dataset.y === y));
    });
    if (ghi != null && o.querySelector('.ghi') !== document.activeElement) o.querySelector('.ghi').value = ghi;
    var tt = o.querySelector('.phan-tt');
    if (!y) { tt.textContent = 'chưa phán'; }
    else { tt.textContent = (y === 'dat' ? 'Đạt' : 'Sửa') + (luu === false ? ' — chưa lưu được, nhắn thẳng cho T' : ' — đã ghi lại'); }
    trangThai[o.dataset.id] = y || '';
    demLai();
  }
  document.querySelectorAll('.phan').forEach(function(o){
    var id = o.dataset.id;
    function gui(){
      var y = o.getAttribute('data-y') || '';
      if (!y) return;
      var ghi = o.querySelector('.ghi').value;
      if (!kho) { ve(o, y, null, false); return; }
      kho.doc('phan-quyet/' + id).set({ y: y, ghi: ghi, luc: new Date().toISOString() })
        .then(function(){ ve(o, y, null, true); })
        .catch(function(){ ve(o, y, null, false); });
    }
    o.querySelectorAll('.nut').forEach(function(n){
      n.addEventListener('click', function(){
        o.setAttribute('data-y', o.getAttribute('data-y') === n.dataset.y ? '' : n.dataset.y);
        ve(o, o.getAttribute('data-y'), null, true);
        gui();
      });
    });
    var hen;
    o.querySelector('.ghi').addEventListener('input', function(){
      clearTimeout(hen); hen = setTimeout(gui, 700);
    });
  });

  if (window.claude && window.claude.use) {
    window.claude.use('db').then(function(d){
      if (!d) return;
      kho = d;
      document.querySelectorAll('.phan').forEach(function(o){
        kho.doc('phan-quyet/' + o.dataset.id).onSnapshot(function(t){
          if (t && t.y) ve(o, t.y, t.ghi, true);
        });
      });
    }).catch(function(){});
  }
})();
</script>`;

const RA = process.env.IF_RA ?? join(tmpdir(), 'cua-duyet-mat.html');
fs.writeFileSync(RA, html);
console.log(`✅ ${RA} — ${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MB · ${TEN_ANH.length} ảnh`);
