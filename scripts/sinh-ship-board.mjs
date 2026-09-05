#!/usr/bin/env node
/**
 * scripts/sinh-ship-board.mjs — sinh `docs/ship/IF-SHIP-BOARD.html`.
 *
 * BẢN CHẤT: **người quan sát SẢN PHẨM**, không phải tính năng của IF, không phải dashboard.
 * Hoà chốt 05/09: *"I want to follow InteriorFlow, not follow Claude."*
 *
 * VÌ SAO LÀ MÁY SINH CHỨ KHÔNG PHẢI HTML VIẾT TAY: bảng này phải **đọc từ bằng chứng đã có**
 * (§2 "board KHÔNG tự phát minh trạng thái"). Viết tay là mở đường cho việc gõ một trạng thái
 * đẹp hơn sự thật. Máy sinh thì mỗi ô trên bảng truy được về một tệp nguồn.
 * ⚠️ Nhưng nó **KHÔNG phải hệ thống mới** (§16): 0 backend · 0 API · 0 CSDL · 0 route sản phẩm.
 * Dữ liệu **nhúng thẳng** vào HTML lúc sinh ⇒ mở bằng `file://` là chạy, không cần máy chủ,
 * không dính CORS khi đọc JSON cạnh bên.
 *
 * NGUỒN — hai tệp, không hơn:
 *   · `docs/ship/bang-chung.json`   — trích từ 14 sổ/báo cáo, mỗi mục có `nguon`
 *   · `docs/ship/anh/xuat-xu.json`  — 21 ảnh app THẬT + nhãn xuất xứ + số đo từng màn
 *
 * LUẬT KHÔNG ĐƯỢC PHÁ:
 *  ① Trạng thái chỉ có bốn: PASS · PARTIAL · FAIL · UNVERIFIED. Không phần trăm bịa.
 *  ② Ảnh **luôn** mang nhãn xuất xứ. Chưa có ảnh app thật ⇒ ghi thẳng "NO CURRENT REAL-APP
 *     EVIDENCE", KHÔNG lấy mock trám vào — mock trông như bản đang chạy là cách nói dối im lặng.
 *  ③ Hai nguồn đá nhau ⇒ hiện CONFLICT, không chọn số đẹp hơn.
 *  ④ Không đếm commit · test · dòng mã · route. Bảng nói **người dùng LÀM ĐƯỢC GÌ**.
 */

import fs from 'node:fs';
import path from 'node:path';

const GOC = process.cwd();
const bangChung = JSON.parse(fs.readFileSync(path.join(GOC, 'docs/ship/bang-chung.json'), 'utf8'));
const anh = JSON.parse(fs.readFileSync(path.join(GOC, 'docs/ship/anh/xuat-xu.json'), 'utf8'));

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ── BẢY CỔNG — trạng thái LẤY TỪ `docs/delivery/SHIP-BLOCKERS.md`, không tự chấm ────────────
 * Ngoại lệ DUY NHẤT, khai rõ: G4 trong sổ ghi "CHỜ MẮT HOÀ". Hoà bỏ hẳn trạng thái đó ngày
 * 05/09 (§9 "owner không phải routine visual gate; visual chưa đạt thì ghi FAIL/PARTIAL, không
 * chờ owner phán"). Nên G4 ghi PARTIAL kèm dòng nói rõ trạng thái cũ đã bị bãi. Đây là THI HÀNH
 * một luật mới, không phải tự nâng điểm — và nó không làm G4 đẹp hơn. */
const CONG = [
  { ma: 'G1', ten: 'DATA SAFE', tt: 'PASS',
    so: '12 ca trên app thật · 5/5 màn có định danh',
    cau: 'Việc anh làm có được ghi xuống đĩa không, và có ghi nhầm sang kho người khác không.',
    ghi: 'Hoà đóng băng 05/09 — chỉ mở lại nếu có hồi quy.' },
  { ma: 'G2', ten: 'PROFESSIONAL FLOW', tt: 'PARTIAL',
    so: '13/22 hành trình có cột ĐÃ LƯU',
    cau: 'Một kiến trúc sư đi trọn được bao nhiêu mạch việc nghề.',
    ghi: 'Mạch có GHI chỉ tính PASS khi đủ: làm → lưu → đóng hẳn → vào lại → cùng sự thật.' },
  { ma: 'G3', ten: 'WORKSPACES & TOOLS', tt: 'PARTIAL',
    so: '27 ca công cụ chết (26 mồ côi · 1 dây đứt)',
    cau: 'Bàn làm việc có đủ đồ nghề, và đồ nghề có chạm tới được không.',
    ghi: 'Vật liệu · Thư viện · Trình chiếu · BOQ · Duyệt CHƯA audit.' },
  { ma: 'G4', ten: 'DESIGN TRUTH / MOAT', tt: 'PARTIAL',
    so: 'định danh 13/13 sau khi đóng hẳn trình duyệt',
    cau: 'Sửa một chỗ thì mọi nơi khác có tự đúng theo không.',
    ghi: 'Sổ ghi "CHỜ MẮT HOÀ" — trạng thái đó bị BÃI 05/09; nay chấm bằng bằng chứng.' },
  { ma: 'G5', ten: 'EXPERIENCE', tt: 'PARTIAL',
    so: '4/4 màn chính TRƯỢT bản chấm độc lập',
    cau: 'Nhìn có ra sản phẩm nghề không, dùng có vấp không.',
    ghi: 'Metric "nợ mắt chủ dự án" đã BỎ (§9). Chưa đạt thì ghi FAIL/PARTIAL, không chờ phán.' },
  { ma: 'G6', ten: 'CONTENT & INTELLIGENCE', tt: 'PARTIAL',
    so: '2 vật liệu · 1 cấu kiện 3D — phủ 1/17 họ',
    cau: 'Mở app ra có sẵn thứ để làm việc, hay là một cái kho rỗng.',
    ghi: 'Bán được "vật liệu render được và nhớ gốc gác"; CHƯA bán được "đổi vật liệu thì số tự đúng".' },
  { ma: 'G7', ten: 'DESKTOP RELEASE', tt: 'PARTIAL',
    so: 'AppImage 338 MB dựng được · macOS chưa ai mở',
    cau: 'Có bộ cài mở được trên máy thật không.',
    ghi: 'Cổng "mở bộ cài" VẪN TRỐNG. Dựng được ≠ phát hành đạt.' },
];

/* ── NGƯỜI DÙNG NAY LÀM ĐƯỢC GÌ TỐT HƠN — tối đa 5, chỉ thứ NGƯỜI DÙNG chạm được ────────────
 * ⛔ Cấm: "thêm 14 test" · "99 commit" · "CI xanh". Mỗi dòng phải nói được một việc người dùng
 * làm được hôm nay mà hôm qua không, hoặc một cách mất dữ liệu nay không xảy ra nữa. */
const TOT_HON = [
  { ngay: '05/09', chu: 'Mở Kho vật liệu là NHÌN THẤY vật liệu — phân biệt gỗ sồi với gỗ óc chó bằng mắt.',
    them: 'Trước đó ô mẫu 32×32 chứa biểu tượng ảnh-hỏng 14 px: 3/3 ô hỏng, 0 pixel vật liệu. Nay 44×44 mẫu vật vẽ ra, 0/202 ô hỏng dưới tải.', cong: 'G6' },
  { ngay: '05/09', chu: 'Đăng nhập tài khoản khác trên cùng một máy KHÔNG còn mở được thư mục dự án của người trước.',
    them: 'Trước đó lời cấp quyền thư mục nằm dưới một khoá cố định, ai đăng nhập sau cũng dùng lại được.', cong: 'G1' },
  { ngay: '05/09', chu: 'Món cấu kiện thả từ Thư viện xuống bản vẽ nay HIỆN RA trong bảng khối lượng.',
    them: 'Trước đó nó rã thành nét rời, không lên BOQ, và BOQ cũng không báo thiếu — mất một dòng tiền, im lặng.', cong: 'G4' },
  { ngay: '05/09', chu: 'Vào thẳng màn Cài đặt không còn làm trang tự dựng lại giữa chừng.',
    them: '11 lỗi khi mở trang → còn 2, và 2 cái còn lại là theo hợp đồng.', cong: 'G5' },
  { ngay: '04/09', chu: 'Mở thẳng một bản vẽ bằng bookmark rồi làm việc — việc được ghi xuống đĩa.',
    them: 'Trước đó app im lặng không ghi một byte nào và không báo gì.', cong: 'G1' },
  { ngay: '05/09', chu: 'Bấm bàn phím đi khắp app nay luôn thấy vòng sáng đang-ở-đâu.',
    them: '8 chỗ trước đây tắt vòng đó; 24 chỗ khác đang an toàn nhờ thứ tự nạp CSS — đã ghi cảnh báo tại chỗ.', cong: 'G5' },
];

/* ── ĐANG DỰNG — cái gì · vì sao · người dùng sẽ được gì. Không kể diễn biến nội bộ (§12) ──── */
const DANG_DUNG = [
  { ten: 'Vật liệu · lát cắt dọc V1–V4', vi: 'Kho vật liệu đang bày TÊN chứ không bày VẬT — ô mẫu 32×32 px, không đủ để phân biệt gỗ sồi với gỗ óc chó.',
    duoc: 'Mở kho là NHÌN ra vân gỗ và phán được, không phải đọc tên rồi đoán.' },
  { ten: 'Ranh giới danh tính khi thả cấu kiện', vi: 'Cờ trong mã đang trả lời "đây có phải BlockEntity không" — một câu về cách vẽ — trong khi cái cần biết là "nó có còn là một món có danh tính không".',
    duoc: 'Đặt món xuống giữ danh tính; chỉ khi người dùng CHỦ ĐỘNG rã món thì nó mới thành hình học rời.' },
];

const mau = { PASS: '#2f9e6b', PARTIAL: '#c08a2e', FAIL: '#c04a4a', UNVERIFIED: '#6b7280', CONFLICT: '#8b5cf6' };
/** Cắt theo ranh giới TỪ — cắt giữa chữ ra "cà h" thì người đọc tưởng dữ liệu hỏng. */
const catGon = (s, n) => { const t = String(s); if (t.length <= n) return t;
  const c = t.slice(0, n); return c.slice(0, c.lastIndexOf(' ')) + '…'; };
const chip = (tt) => `<span class="tt" style="--c:${mau[tt] || mau.UNVERIFIED}">${esc(tt)}</span>`;

/* Ảnh cho mỗi bề mặt — khớp theo tên tệp. Không khớp ⇒ KHÔNG lấy ảnh khác trám (luật ②). */
const anhTheoMan = new Map(anh.man.filter((m) => !m.loi).map((m) => [m.tep, m]));
const timAnh = (goi) => anhTheoMan.get(goi) || null;

const BE_MAT = [
  ['HOME', '01-home.png'], ['DỰ ÁN', '02-du-an.png'], ['THIẾT KẾ 2D', '03-2d.png'],
  ['THIẾT KẾ 3D', '04-3d.png'], ['TRÌNH CHIẾU', '05-trinh-chieu.png'], ['VẬT LIỆU', '09-vat-lieu.png'],
  ['THƯ VIỆN', '11-thu-vien.png'], ['FILES', '16-files.png'], ['BẢNG VIỆC', '17-viec.png'],
  ['GALLERY', '12-gallery.png'], ['CẢM HỨNG', '15-cam-hung.png'], ['NHẬP TÀI SẢN', '13-nhap-tai-san.png'],
  ['TỔNG QUAN DỰ ÁN', '06-tong-quan-du-an.png'], ['SỔ TAY', '07-so-tay.png'], ['ẢNH DỰ ÁN', '08-anh-du-an.png'],
  ['KHO TRI THỨC', '14-kho-tri-thuc.png'], ['CÀI ĐẶT', '18-cai-dat.png'], ['WORKHUB', '22-workhub.png'],
];

/* GHI ĐÈ CÓ NGUỒN — bề mặt vừa đổi sau khi bản trích chạy. Khai rõ vì sao không để bản trích
 * quyết: nó đọc sổ lúc 20:xx, còn V1–V4 lên lúc 21:xx. Đè bằng thứ ĐO ĐƯỢC, không bằng lời hứa,
 * và cố ý KHÔNG nâng lên PASS — hai điểm trượt còn nguyên. */
const DE_LEN = {
  'VẬT LIỆU': { trangThai: 'PARTIAL',
    chan: 'V1–V4 xong (2/2 vật liệu có mã hiện mẫu vật thật, ba mặt 2D✓3D✓). CÒN: ở nấc SCAN 44px đọc ra MÀU và ĐỘ BÓNG, chưa đọc ra VÂN — quả cầu PBR phủ kín lớp vân; và chưa đăng nhập thì /materials ra màn "Cần đăng nhập lại", 0 hàng. V5–V9 chưa làm.' },
};
const beMatTheoTen = new Map(bangChung.beMat.map((b) => [String(b.ten).split(' ')[0].toUpperCase(), b]));
function trangThaiBeMat(ten, tep) {
  const khoa = ten.split(' ')[0].toUpperCase();
  const b = beMatTheoTen.get(khoa) || bangChung.beMat.find((x) => String(x.ten).toUpperCase().includes(khoa));
  const de = DE_LEN[ten];
  return de ? { ...(b || {}), ...de } : (b || null);
}

const theMan = ([ten, tep]) => {
  const a = timAnh(tep);
  const b = trangThaiBeMat(ten, tep);
  const tt = b?.trangThai || 'UNVERIFIED';
  const hinh = a
    ? `<img loading="lazy" src="anh/${esc(tep)}" alt="${esc(ten)} — ảnh app thật">
       <span class="xx">REAL APP · ${esc(anh.khiChup)}</span>`
    : `<div class="khong">NO CURRENT REAL-APP EVIDENCE</div>`;
  const so = a ? `${a.chu} ký tự · ${a.nut} nút · ${a.hinh} hình` : '—';
  return `<article class="man">
    <div class="khung">${hinh}</div>
    <h3>${esc(ten)} ${chip(tt)}</h3>
    <p class="do">${esc(a?.route || '')} — ${esc(so)}</p>
    ${b?.chan ? `<p class="chan">⛔ ${esc(catGon(b.chan, 190))}</p>` : ''}
  </article>`;
};

const hanhTrinhSap = [...bangChung.hanhTrinh].sort((x, y) => {
  const r = { FAIL: 0, PARTIAL: 1, UNVERIFIED: 2, PASS: 3 };
  return (r[x.trangThai] ?? 9) - (r[y.trangThai] ?? 9);
});

const chanThat = bangChung.chan.filter((c) => ['P0', 'P1'].includes(c.mucDo));

const html = `<!doctype html>
<html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>InteriorFlow · Ship Board</title>
<style>
:root{--nen:#0d0e11;--tam:#15171c;--vien:#23262e;--muc:#e8eaed;--muc2:#a0a6b0;--muc3:#6b7280;--nhan:#7c5cff}
*{box-sizing:border-box}
body{margin:0;background:var(--nen);color:var(--muc);font:15px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
.bao{max-width:1240px;margin:0 auto;padding:40px 28px 96px}
h1{font-size:30px;letter-spacing:-.02em;margin:0 0 6px}
h2{font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:var(--muc3);
   margin:56px 0 18px;font-weight:600;border-top:1px solid var(--vien);padding-top:18px}
h3{font-size:15px;margin:12px 0 2px;font-weight:600}
p{margin:0 0 8px}
.deu{color:var(--muc2)}
.nho{font-size:12.5px;color:var(--muc3)}
.tt{display:inline-block;padding:1px 9px;border-radius:999px;font:600 11px/1.7 ui-monospace,Menlo,monospace;
    letter-spacing:.06em;color:#fff;background:var(--c);vertical-align:2px}
/* cổng */
.cong{display:grid;gap:10px}
.hang{display:grid;grid-template-columns:52px 1fr auto;gap:16px;align-items:start;
      padding:15px 18px;background:var(--tam);border:1px solid var(--vien);border-radius:12px}
.hang b{font:600 13px/1.6 ui-monospace,Menlo,monospace;color:var(--muc3)}
.hang .ten{font-weight:600}
.hang .cau{color:var(--muc2);font-size:14px}
.hang .ghi{color:var(--muc3);font-size:12.5px;margin-top:5px}
.hang .so{font:600 12px/1.7 ui-monospace,Menlo,monospace;color:var(--muc2);text-align:right;white-space:nowrap}
/* tốt hơn */
.tot li{margin:0 0 14px;padding-left:2px}
.tot .chu{font-size:16px}
.tot .them{color:var(--muc3);font-size:13px}
/* màn */
.luoi{display:grid;grid-template-columns:repeat(auto-fill,minmax(272px,1fr));gap:22px}
.man .khung{position:relative;aspect-ratio:16/10;overflow:hidden;border-radius:10px;
            border:1px solid var(--vien);background:#000}
.man img{width:100%;height:100%;object-fit:cover;object-position:top left;display:block}
.man .xx{position:absolute;left:8px;bottom:8px;padding:2px 8px;border-radius:5px;
         background:rgba(0,0,0,.78);font:600 10px/1.8 ui-monospace,Menlo,monospace;
         letter-spacing:.05em;color:#8ee0b0}
.man .khong{display:grid;place-items:center;height:100%;color:#c04a4a;
            font:600 11px/1.6 ui-monospace,Menlo,monospace;text-align:center;padding:16px}
.man .do{font:12px/1.6 ui-monospace,Menlo,monospace;color:var(--muc3);margin:2px 0 0;overflow-wrap:anywhere}
.man .chan{font-size:12.5px;color:#d08a8a;margin-top:6px;overflow-wrap:anywhere}
/* bảng */
table{width:100%;border-collapse:collapse;font-size:13.5px}
th{text-align:left;font:600 11px/1.8 ui-monospace,Menlo,monospace;letter-spacing:.09em;
   color:var(--muc3);border-bottom:1px solid var(--vien);padding:0 12px 9px 0}
td{padding:11px 12px 11px 0;border-bottom:1px solid var(--vien);vertical-align:top;color:var(--muc2)}
td.ma{font:600 12px/1.6 ui-monospace,Menlo,monospace;color:var(--muc);white-space:nowrap}
/* phát hành */
.hai{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px}
.hop{background:var(--tam);border:1px solid var(--vien);border-radius:12px;padding:18px 20px}
.nac{display:grid;grid-template-columns:1fr auto;gap:8px;padding:7px 0;border-bottom:1px solid var(--vien);font-size:13.5px}
.nac:last-child{border:0}
.nac span:first-child{font:600 11.5px/1.7 ui-monospace,Menlo,monospace;letter-spacing:.07em;color:var(--muc3)}
/* mâu thuẫn */
.mt{background:var(--tam);border:1px solid var(--vien);border-left:3px solid ${mau.CONFLICT};
    border-radius:10px;padding:14px 18px;margin-bottom:10px}
.mt .ve{font-weight:600;margin-bottom:6px}
.mt .n{font-size:12.5px;color:var(--muc3);margin:3px 0}
@media(max-width:760px){.hai{grid-template-columns:1fr}.hang{grid-template-columns:44px 1fr}.hang .so{display:none}}
</style></head><body><div class="bao">

<h1>InteriorFlow · Ship Board</h1>
<p class="deu">Sản phẩm đang thành hình tới đâu — đọc trong 10 giây, không phải đọc nhật ký.</p>
<p class="nho">Ảnh chụp app thật ${esc(anh.khiChup)} · nhánh <code>${esc(anh.nhanh)}</code> ·
${esc(anh.soMan.chupDuoc)}/${esc(anh.soMan.tong)} màn · bằng chứng trích ${esc(bangChung.ngayTrich)}.
Mọi trạng thái đọc từ sổ có sẵn — bảng này không tự chấm.</p>

<h2>Người dùng nay làm được gì tốt hơn</h2>
<ul class="tot">${TOT_HON.map((t) => `<li>
  <div class="chu">${esc(t.chu)}</div>
  <div class="them">${esc(t.ngay)} · ${esc(t.cong)} — ${esc(t.them)}</div></li>`).join('')}</ul>

<h2>Bảy cổng ship</h2>
<div class="cong">${CONG.map((c) => `<div class="hang">
  <b>${esc(c.ma)}</b>
  <div><div class="ten">${esc(c.ten)} ${chip(c.tt)}</div>
    <div class="cau">${esc(c.cau)}</div><div class="ghi">${esc(c.ghi)}</div></div>
  <div class="so">${esc(c.so)}</div></div>`).join('')}</div>

<h2>Bản đồ app — ${BE_MAT.length} bề mặt</h2>
<div class="luoi">${BE_MAT.map(theMan).join('')}</div>

<h2>Hành trình nghề — ${bangChung.hanhTrinhTongKet?.cotDaLuu || '?'} có cột ĐÃ LƯU</h2>
<p class="nho">Mạch có GHI chỉ tính <b>PASS</b> khi đủ chuỗi:
làm → lưu → <b>đóng/tải lại hẳn</b> → vào lại → <b>cùng sự thật</b>. Mới tới bước làm ⇒ PARTIAL.</p>
<table><thead><tr><th>Mã</th><th>Hành trình</th><th>Trạng thái</th><th>Tới đâu rồi</th></tr></thead><tbody>
${hanhTrinhSap.map((h) => `<tr><td class="ma">${esc(h.ma)}</td><td>${esc(String(h.ten).slice(0, 120))}</td>
<td>${chip(h.trangThai)}</td><td class="nho">${esc(h.toiDauRoi || '—')}</td></tr>`).join('')}
</tbody></table>

<h2>Moat — sự thật thiết kế</h2>
<table><thead><tr><th>Trục</th><th>Trạng thái</th><th>Hành trình chứng minh</th></tr></thead><tbody>
${bangChung.moat.map((m) => `<tr><td class="ma">${esc(String(m.truc).split('—')[0].trim())}</td>
<td>${chip(m.trangThai)}</td><td>${esc(String(m.hanhTrinhChung || '').slice(0, 180))}</td></tr>`).join('')}
</tbody></table>

<h2>Phát hành desktop</h2>
<p class="nho">Bốn nấc, không gộp: <b>BUILT</b> dựng xong · <b>PACKAGED</b> ra tệp cài ·
<b>INSTALLED</b> mở được trên máy đích · <b>REAL-MACHINE VERIFIED</b> đi hết mạch nghề trên máy thật.
Dựng được <b>không phải</b> là phát hành đạt.</p>
<div class="hai">
${Object.keys(bangChung.phatHanh).filter((k) => k !== 'dinhNghiaBonNac').map((k) => {
  const p = bangChung.phatHanh[k] || {};
  return `<div class="hop"><h3>${esc({ macos: 'macOS', windows: 'Windows', linux: 'Linux' }[k] || k)}</h3>
  <p class="nho">${esc(p.vaiTro || 'UNVERIFIED')}</p>
  ${['BUILT', 'PACKAGED', 'INSTALLED', 'REAL-MACHINE VERIFIED'].map((n) =>
    `<div class="nac"><span>${n}</span>${chip(p[n] || 'UNVERIFIED')}</div>`).join('')}
  ${p.kienTruc ? `<p class="nho" style="margin-top:10px">${esc(p.kienTruc)}</p>` : ''}</div>`;
}).join('')}
</div>

<h2>Chặn thật — ${chanThat.length} mục P0/P1</h2>
<table><thead><tr><th>Mã</th><th>Ảnh hưởng người dùng</th><th>Mức</th><th>Cổng</th><th>Cần Hoà?</th></tr></thead><tbody>
${chanThat.map((c) => `<tr><td class="ma">${esc(c.ma)}</td>
<td>${esc(String(c.anhHuongNguoiDung || c.ten || '').slice(0, 200))}</td>
<td>${chip(c.mucDo === 'P0' ? 'FAIL' : 'PARTIAL')} <span class="nho">${esc(c.mucDo)}</span></td>
<td class="nho">${esc(c.cong)}</td><td class="nho">${c.canChuDuAn ? '<b>CÓ</b>' : 'không'}</td></tr>`).join('')}
</tbody></table>

<h2>Đang dựng</h2>
${DANG_DUNG.map((d) => `<div class="hop" style="margin-bottom:12px">
<h3 style="margin-top:0">${esc(d.ten)}</h3>
<p class="deu" style="font-size:14px"><b>Vì sao:</b> ${esc(d.vi)}</p>
<p class="deu" style="font-size:14px;margin:0"><b>Người dùng sẽ được:</b> ${esc(d.duoc)}</p></div>`).join('')}

<h2>Hai nguồn đá nhau — ${bangChung.mauThuan.length} chỗ</h2>
<p class="nho">Không chọn số đẹp hơn. Chỗ nào hai sổ nói khác nhau thì hiện cả hai.</p>
<div class="hop" style="margin-bottom:16px">
<p style="margin:0 0 8px"><b>Thứ tự ưu tiên khi phân xử</b> — Hoà chốt 05/09:</p>
<p class="deu" style="font:600 12.5px/2 ui-monospace,Menlo,monospace;margin:0">
BẰNG CHỨNG SẢN PHẨM SỐNG &nbsp;&gt;&nbsp; BẰNG CHỨNG MÁY HIỆN HÀNH &nbsp;&gt;&nbsp;
QUYẾT ĐỊNH CHÍNH TẮC HIỆN HÀNH &nbsp;&gt;&nbsp; SỔ HIỆN HÀNH &nbsp;&gt;&nbsp; BÁO CÁO LỊCH SỬ</p>
<p class="nho" style="margin:10px 0 0">Nghĩa là: <b>mở app ra thấy gì thì cái đó thắng</b> mọi
tài liệu; máy soi chạy hôm nay thắng sổ; sổ thắng báo cáo cũ.
⛔ <b>KHÔNG sửa hàng loạt báo cáo lịch sử chỉ để con số khớp nhau</b> — báo cáo cũ là dấu vết của
một thời điểm, sửa nó là xoá bằng chứng chứ không phải dọn dẹp. Chỗ nào lệch thì để lệch, và
phân xử bằng thang trên khi cần dùng.</p></div>
${bangChung.mauThuan.slice(0, 8).map((m) => `<div class="mt">
<div class="ve">${chip('CONFLICT')} ${esc(m.ve)}</div>
<div class="n">A — ${esc(String(m.nguonA).slice(0, 210))}</div>
<div class="n">B — ${esc(String(m.nguonB).slice(0, 210))}</div></div>`).join('')}
${bangChung.mauThuan.length > 8 ? `<p class="nho">…còn ${bangChung.mauThuan.length - 8} chỗ nữa trong <code>docs/ship/bang-chung.json</code>.</p>` : ''}

<h2>Bảng này KHÔNG nói gì</h2>
<p class="deu">Không đếm commit · không đếm test · không đếm dòng mã · không đếm route ·
không kể CI hay Vercel. Cũng không còn mục <i>nợ nghiệm thu mắt chủ dự án</i> —
Hoà bỏ nó ngày 05/09: chưa đạt thì ghi thẳng FAIL/PARTIAL, không treo chờ ai phán.</p>
<p class="nho">Sinh bằng <code>node scripts/sinh-ship-board.mjs</code>.
Nguồn: <code>docs/ship/bang-chung.json</code> · <code>docs/ship/anh/xuat-xu.json</code>.
Cập nhật khi <b>cổng đổi trạng thái · hành trình đổi · bề mặt có bản dựng mới · có ảnh app mới ·
chặn mở/đóng · gói desktop đổi</b> — không cập nhật vì có commit mới.</p>

</div></body></html>`;

fs.writeFileSync(path.join(GOC, 'docs/ship/IF-SHIP-BOARD.html'), html);
console.log(`Ship Board: ${(html.length / 1024).toFixed(0)} KB · ${BE_MAT.length} bề mặt · ` +
  `${anh.soMan.chupDuoc} ảnh app thật · ${hanhTrinhSap.length} hành trình · ` +
  `${chanThat.length} chặn P0/P1 · ${bangChung.mauThuan.length} mâu thuẫn`);
