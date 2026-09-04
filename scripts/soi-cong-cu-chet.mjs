#!/usr/bin/env node
/**
 * scripts/soi-cong-cu-chet.mjs — máy canh "CÔNG CỤ NÀY BẤM VÀO CÓ CHẠY KHÔNG".
 * Chạy: `npm run soi:cong-cu-chet` — cùng họ soi-frontier / soi-tu-dien / soi-cam-dien.
 *
 * ─── VÌ SAO CÓ TỆP NÀY — một ca thật, không phải lo xa ───────────────────────────
 * Đo được trong chính repo này: `VitalsGesturePanel` chỉ mount ở `StageSwitcher.tsx:446`,
 * mà `StageSwitcher` KHÔNG còn được mount ở đâu từ 17/08 (sidebar thành hệ router).
 * `StatusBar.tsx` vẫn gọi `useVitalsUi.open()`. Tổ hợp Cmd+J đăng ký ở hai chỗ: một chỗ
 * chết, một chỗ chưa từng mount. ⇒ gõ câu hỏi rồi Enter là MẤT CÂU HỎI; Cmd+J không làm gì.
 * `tsc` xanh · `npm test` xanh · không máy soi nào kêu. Ca đó nay đã sửa (khẩu độ mép trên
 * `VitalsAperture.tsx`), nhưng thứ ĐỂ NÓ SỐNG SÓT BA TUẦN thì vẫn còn: không máy nào canh
 * ba câu chủ dự án ra luật —
 *   · phím tắt khai mà không mặt nào tiêu thụ  = TRƯỢT
 *   · nút tồn tại mà không có đường chạy       = TRƯỢT
 *   · công cụ bấm vào im lặng không làm gì     = TRƯỢT
 *
 * ─── MÁY NÀY KHÁC `soi-cam-dien` Ở ĐÂU (đã đọc hết mã nó trước khi dựng) ─────────
 * `soi-cam-dien` đi từ `lib/` hỏi ngược lên mặt: *engine này có dây chưa?* Nó tự khai giới
 * hạn ngay trong docstring: *"máy chứng minh CÓ ĐƯỜNG DÂY, KHÔNG chứng minh CÓ NÚT BẤM.
 * Một engine được import vào component sống vẫn có thể nằm sau nhánh `if` không bao giờ
 * chạy."* ⇒ Máy này đi CHIỀU NGƯỢC LẠI, TỪ MẶT XUỐNG: *cái nút này có ai mount không, phím
 * này có ai nghe không, tay cầm này có rỗng không.* Hai máy trả lời hai câu khác nhau trên
 * cùng đồ thị import; giữ chung từ vựng (*sống* · *mồ côi*) để không thành hai bản của một
 * thứ. [T2 — một cỗ máy nhiều mặt tiền]
 * `soi-that` mù chỗ này vì nó do SỔ dẫn đường; ca Vitals không văn bản nào khai.
 *
 * ─── BA LẦN DỰ ÁN NÀY ĐÃ TRẢ GIÁ VÌ MÁY SOI BÁO QUÁ TAY — đã vá sẵn ở đây ────────
 * ① `soi-thao-tac` đọc chữ trong CHÚ THÍCH rồi báo vi phạm, bắt trúng cả câu tự dặn đừng
 *    vi phạm. ⇒ đây bóc chú thích TRƯỚC khi quét, kể cả block comment GIỮA DÒNG (chỗ
 *    `soi-cam-dien` tự khai còn hở), thay bằng khoảng trắng cùng độ dài để số dòng không lệch.
 * ② mẫu `outline-none` gộp BA cơ chế CSS khác hẳn nhau vào một rọ ⇒ 24/32 ca báo nhầm.
 *    ⇒ đây tách hẳn BỐN HỌ, mỗi họ một tiêu chí, in riêng — không gộp một con số tổng.
 * ③ `chan-doan-noi-luu-repo.sh` dùng `pgrep -fli` nên TỰ KHỚP CHÍNH NÓ vì danh sách từ khoá
 *    nằm trong chính tệp ⇒ báo "9 công cụ đồng bộ đang chạy" trong container trống.
 *    ⇒ đây TỰ LOẠI TRỪ CHÍNH MÌNH: vùng quét chỉ `app/` + `components/` + `lib/`, và có guard
 *    `TU_LOAI_TRU` chặn cứng nếu ai đó nới vùng quét sang `scripts/`.
 * ⇒ Thà BẮT ÍT MÀ ĐÚNG còn hơn bắt nhiều rồi bị bỏ qua. Máy soi báo nhầm vài lần là máy soi
 *   chết mà chưa ai tuyên bố.
 *
 * ─── BỐN HỌ ─────────────────────────────────────────────────────────────────────
 *   H1 MỒ CÔI      component `.tsx` trả JSX mà không chuỗi import nào từ entry `app/` tới
 *   H2 PHÍM CÂM    `key:` khai trong registry mà không nơi-nghe-bàn-phím SỐNG nào so tới
 *   H3 TAY RỖNG    onX rỗng thân · undefined · null · chỉ console.*
 *   H4 DÂY ĐỨT     có nơi SỐNG gọi `open()`, mà 0 nhà tiêu thụ SỐNG nào dựng mặt ra
 *
 * ⚠️ GIỚI HẠN — in mỗi lần chạy, cố ý. Máy chứng minh CÓ ĐƯỜNG MOUNT, KHÔNG chứng minh BẤM
 *    VÀO CÓ VIỆC GÌ XẢY RA. Một nút mount thật vẫn có thể gọi hàm trả về sớm. Muốn biết cái
 *    sau phải MỞ APP BẤM THẬT (luật PASS: thao tác → ghi → tải lại → vào lại → cùng sự thật).
 *
 * ⚠️ KHÔNG CHẶN (exit 0) ở phát đầu. Cùng lý do `soi-tu-dien`/`soi-cam-dien`: máy soi báo đỏ
 *    thứ chưa sửa ngay được thì chết theo cách tệ nhất — người ta học cách bỏ qua nó.
 *    ⇒ ĐIỀU KIỆN SIẾT `--nghiem` (exit 1): siết theo TỪNG HỌ, mỗi khi họ đó về 0 và đứng yên
 *    một đợt. Siết H3 trước (rẻ nhất, tiêu chí không cãi được), rồi H4, rồi H2, H1 sau cùng
 *    (H1 nhiễu nhất vì cây `app/` còn màn chưa nối). Số đứng yên mà không ai sửa = máy soi đã
 *    chết mà chưa ai tuyên bố.
 *
 * ⛔ KHÔNG dùng AI. Tất định, 0đ, chạy 10 lần ra 10 kết quả giống nhau (Hoà chốt 15/08:
 *    *"kiểm tiêu chuẩn = việc của MÁY, không phải của AI"*).
 *
 * ─── H5 · CHẠM-TỚI-ĐƯỢC — nhánh CHẠY TRÊN TRÌNH DUYỆT, cố ý OPT-IN ──────────────
 * Bốn họ trên đều là suy luận TĨNH trên đồ thị import, nên chúng mù đúng thứ giới hạn ở
 * trên tự khai: *một nút mount thật, có đường chạy thật, vẫn có thể bị vật khác nằm đè lên
 * và người dùng bấm không trúng.* Ca thật 04/09: công tắc "Vẽ 3D" (1296,817,112×34) bị thẻ
 * mách nước (1284,756,300×128) đè TRỌN ⇒ người bấm thì im lặng, trong khi `.click()` của
 * Playwright vẫn chạy qua DOM nên **mọi test tự động đều xanh**. Không họ nào H1-H4 thấy nó.
 *
 * LUẬT H5 (chủ dự án phát biểu): *mọi phần tử bấm được và đang hiện phải có
 * `elementFromPoint(tâm)` trả về CHÍNH NÓ (hoặc con nó)*.
 *
 * ⚠️ VÌ SAO OPT-IN CHỨ KHÔNG CHẠY MẶC ĐỊNH: bốn họ trên là tất định, 0 phụ thuộc, chạy
 * được ở mọi nơi kể cả CI không mạng. H5 cần **dev server sống + Chromium**. Gộp cứng vào
 * là biến một máy soi luôn-chạy-được thành máy soi hay-hỏng-vì-môi-trường — mà máy soi hỏng
 * vặt thì chết theo đúng cách docstring này đã cảnh báo: người ta học cách bỏ qua nó.
 * ⇒ `playwright` nạp bằng **dynamic import** chỉ khi có cờ; không cờ thì hành vi cũ y nguyên.
 *
 * ⚠️ BẢO THỦ CÓ CHỦ Ý (vá sẵn cạm bẫy "báo quá tay" lần thứ tư): CHỈ tính TRƯỢT khi tâm bị
 * che bởi phần tử KHÔNG có quan hệ họ hàng. Bỏ qua: `disabled`/`aria-disabled` (không kỳ
 * vọng bấm) · `pointer-events:none` (cố ý không nhận chuột) · tâm ngoài khung nhìn ·
 * `elementFromPoint` trả `null`. Và PASS cả khi kết quả là TỔ TIÊN của nó — `<label>` bọc
 * `<input>` là ca hợp lệ, bấm vào nhãn vẫn kích hoạt ô.
 *
 * CỜ: `--goc=<thư mục>` chạy trên cây khác (dùng để HIỆU CHUẨN trên ảnh chụp lịch sử)
 *     `--gon` chỉ in bảng tổng · `--nghiem` exit 1 khi còn ca
 *     `--cham` bật H5 (cần dev server) · `--url=` gốc app · `--pid=` projectId
 *     `--tu-kiem` tự chèn lớp phủ để HIỆU CHUẨN H5 (phải ĐỎ rồi XANH mới tin được máy)
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve as duongTuyetDoi, relative, extname, basename } from 'node:path';

const coGoc = process.argv.find((a) => a.startsWith('--goc='));
const ROOT = coGoc ? duongTuyetDoi(coGoc.slice(6)) : duongTuyetDoi(new URL('..', import.meta.url).pathname);
const HIEN_SONG = !process.argv.includes('--gon');
const NGHIEM = process.argv.includes('--nghiem');
/* H5 — nhánh chạy-trên-trình-duyệt, mặc định TẮT (xem docstring: giữ 4 họ tĩnh luôn chạy được). */
const CHAM = process.argv.includes('--cham');
const TU_KIEM = process.argv.includes('--tu-kiem');
const layCo = (ten, mac) => {
  const a = process.argv.find((x) => x.startsWith(`--${ten}=`));
  return a ? a.slice(ten.length + 3) : mac;
};
const H5_URL = layCo('url', process.env.IF_URL ?? 'http://localhost:3094');
const H5_PID = layCo('pid', process.env.IF_PID ?? '');
const H5_CHROME = process.env.IF_CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

/* ── QUÉT CÂY ───────────────────────────────────────────────────────────────── */
const BO_QUA = new Set(['node_modules', '.next', '.git', 'dist', 'dist-installer', 'out', 'coverage', 'uploads', 'public']);
/** Loại theo tên thư mục CÓ CHỨA chữ, không so chuỗi cứng — bug này đã phải vá ba lần trong
 *  dự án (`npm test` 16/08 · `soi-that` 17/08). Cố ý không in ra stdout. */
const laCayPhu = (ten) => ten.includes('worktree');
const DUOI_MA = new Set(['.ts', '.tsx']);
const laTest = (rel) => /\.(test|spec)\./.test(rel);

/** TỰ LOẠI TRỪ — xem cạm bẫy ③. Máy này quét văn bản, nên danh sách từ khoá của nó nằm ngay
 *  trong chính tệp này. Vùng quét cố ý KHÔNG có `scripts/`; guard dưới chặn cứng nếu ai nới. */
const GOC_QUET = ['app', 'components', 'lib'];
const TU_LOAI_TRU = ['scripts'];
for (const g of GOC_QUET) {
  if (TU_LOAI_TRU.includes(g)) {
    console.error(`⛔ Vùng quét chứa '${g}' — máy soi sẽ tự khớp chính mình (cạm bẫy ③). Dừng.`);
    process.exit(2);
  }
}

function quet(thuMuc, ra = []) {
  let ds;
  try { ds = readdirSync(thuMuc); } catch { return ra; }
  for (const ten of ds) {
    if (BO_QUA.has(ten) || laCayPhu(ten)) continue;
    const p = join(thuMuc, ten);
    let st;
    try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) quet(p, ra);
    else if (DUOI_MA.has(extname(ten))) ra.push(relative(ROOT, p));
  }
  return ra;
}
const TEP = [];
for (const g of GOC_QUET) if (existsSync(join(ROOT, g))) quet(join(ROOT, g), TEP);

const THO = new Map();
const docTho = (rel) => {
  if (!THO.has(rel)) {
    try { THO.set(rel, readFileSync(join(ROOT, rel), 'utf8')); } catch { THO.set(rel, ''); }
  }
  return THO.get(rel);
};

/* ── BÓC CHÚ THÍCH — vá cạm bẫy ① ───────────────────────────────────────────── */
/**
 * Thay mọi chú thích dòng và chú thích khối bằng khoảng trắng CÙNG ĐỘ DÀI ⇒ chỉ số ký tự
 * không đổi nên số dòng vẫn tính đúng. Máy trạng thái nhỏ, có nhận biết chuỗi nháy đơn, nháy
 * kép và backtick để không ăn nhầm hai dấu gạch trong URL và không cắt giữa chuỗi.
 * KHÔNG bóc nội dung chuỗi (regex literal chứa dấu mở chú thích khối là ca hiếm — khai ở mục
 * CHƯA CHẮC của báo cáo chứ không giấu).
 */
function bocChuThich(src) {
  let ra = '';
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    const d = src[i + 1];
    if (c === '/' && d === '/') {
      let j = src.indexOf('\n', i);
      if (j === -1) j = n;
      ra += ' '.repeat(j - i);
      i = j;
      continue;
    }
    if (c === '/' && d === '*') {
      let j = src.indexOf('*' + '/', i + 2);
      j = j === -1 ? n : j + 2;
      ra += src.slice(i, j).replace(/[^\n]/g, ' ');
      i = j;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') {
      const mo = c;
      let j = i + 1;
      while (j < n) {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === mo) { j++; break; }
        if (mo !== '`' && src[j] === '\n') break;
        j++;
      }
      ra += src.slice(i, j);
      i = j;
      continue;
    }
    ra += c;
    i++;
  }
  return ra;
}
const SACH = new Map();
const doc = (rel) => {
  if (!SACH.has(rel)) SACH.set(rel, bocChuThich(docTho(rel)));
  return SACH.get(rel);
};
const dongCua = (src, i) => src.slice(0, i).split('\n').length;

/* ── ĐỒ THỊ IMPORT ──────────────────────────────────────────────────────────── */
const DUOI_THU = ['', '.ts', '.tsx', '.js', '.jsx', '.d.ts'];
const INDEX_THU = ['/index.ts', '/index.tsx', '/index.js'];
/** Giải đường dẫn THẬT — mượn nguyên bài học của `soi-cam-dien` cạm bẫy ①: grep chuỗi
 *  `lib/<tên>` từng báo oan 4 module vì `lib/cad/pdf.ts` gọi `'../pdf-font'`, không có chữ
 *  "lib/" nào trong chuỗi. */
function giaiDuongDan(spec, tuTep) {
  let goc;
  if (spec.startsWith('@/')) goc = join(ROOT, spec.slice(2));
  else if (spec.startsWith('.')) goc = duongTuyetDoi(dirname(join(ROOT, tuTep)), spec);
  else return null; // gói ngoài (node_modules) — ngoài phạm vi
  for (const d of [...DUOI_THU, ...INDEX_THU]) {
    const p = goc + d;
    try { if (statSync(p).isFile()) return relative(ROOT, p); } catch { /* thử tiếp */ }
  }
  return null;
}
const MAU_IMPORT = [
  /\bfrom\s*['"]([^'"]+)['"]/g,
  /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /\bimport\s+['"]([^'"]+)['"]/g,
  /new\s+URL\s*\(\s*['"]([^'"]+)['"]\s*,\s*import\.meta\.url/g,
];
const NHAP = new Map(); // tệp → Set(tệp nó với tới)
for (const rel of TEP) {
  const s = new Set();
  for (const mau of MAU_IMPORT) {
    for (const m of doc(rel).matchAll(mau)) {
      const d = giaiDuongDan(m[1], rel);
      if (d) s.add(d);
    }
  }
  NHAP.set(rel, s);
}

/* ── AI CÒN SỐNG — BFS từ entry của Next App Router ─────────────────────────── */
/** Quy ước tên tệp của App Router: những tệp này Next TỰ NẠP, không ai import chúng.
 *  Không trừ ra là báo oan cả trăm ca — bẫy nặng nhất của họ H1. */
const TEN_ENTRY = new Set(['page.tsx', 'layout.tsx', 'route.ts', 'error.tsx', 'not-found.tsx',
  'template.tsx', 'loading.tsx', 'global-error.tsx', 'default.tsx', 'middleware.ts', 'instrumentation.ts']);
const laEntry = (rel) => rel.startsWith('app/') && TEN_ENTRY.has(basename(rel));

const SONG = new Set();
{
  const hangDoi = TEP.filter(laEntry);
  for (const t of hangDoi) SONG.add(t);
  while (hangDoi.length) {
    const t = hangDoi.pop();
    for (const d of NHAP.get(t) ?? []) {
      if (laTest(d) || SONG.has(d)) continue;
      SONG.add(d);
      hangDoi.push(d);
    }
  }
}
const laSong = (rel) => SONG.has(rel);

/* ── H1 · COMPONENT MỒ CÔI ──────────────────────────────────────────────────── */
/** Chỉ tính tệp THẬT SỰ dựng giao diện: có khai xuất VÀ có thẻ JSX đóng. Tệp `.tsx` chỉ chứa
 *  kiểu/hằng không phải "công cụ" — loại ra kẻo phình bảng bằng rác, đúng bài học `soi-cam-dien`
 *  phải vá vòng 1 vì tệp test biến thành "module 0 dòng". */
const coJSX = (rel) => /<\/[A-Za-z]|\/>/.test(doc(rel));
const coXuat = (rel) => /\bexport\s+(default|function|const|class)\b/.test(doc(rel));
const H1 = TEP
  .filter((r) => r.startsWith('components/') && r.endsWith('.tsx') && !laTest(r) && coJSX(r) && coXuat(r) && !laSong(r))
  .map((r) => {
    // Ai import nó? Nếu CHỈ test import ⇒ nói rõ: đó là "xanh giả" điển hình.
    const nguoiGoi = TEP.filter((t) => t !== r && (NHAP.get(t) ?? new Set()).has(r));
    const chiTest = nguoiGoi.length > 0 && nguoiGoi.every(laTest);
    return { tep: r, nguoiGoi: nguoiGoi.length, chiTest };
  });

/* ── H2 · PHÍM CÂM ─────────────────────────────────────────────────────────── */
/** Nguồn phím = `key: [...]` trong `lib/commands/` + `lib/shortcuts.ts`. Nơi nghe = tệp SỐNG
 *  có `keydown`/`onKeyDown`. Token modifier bỏ qua (không ai đi so chuỗi 'mod'). */
const MOD = new Set(['mod', 'shift', 'alt', 'ctrl', 'meta', 'cmd']);
const nguonPhim = TEP.filter((r) => (r.startsWith('lib/commands/') || r === 'lib/shortcuts.ts') && !laTest(r));
const NGHE = TEP.filter((r) => laSong(r) && /keydown|onKeyDown/.test(doc(r)));
const vanNghe = NGHE.map(doc).join('\n').toLowerCase();
const phimKhai = new Map(); // token → { tep, dong, id }
for (const r of nguonPhim) {
  const s = doc(r);
  for (const m of s.matchAll(/\bkey\s*:\s*\[([^\]]*)\]/g)) {
    const toks = [...m[1].matchAll(/['"]([^'"]+)['"]/g)].map((x) => x[1]).filter((t) => !MOD.has(t.toLowerCase()));
    if (!toks.length) continue;
    const truoc = s.slice(Math.max(0, m.index - 400), m.index);
    const idm = [...truoc.matchAll(/\bid\s*:\s*['"]([^'"]+)['"]/g)].pop();
    for (const t of toks) if (!phimKhai.has(t)) phimKhai.set(t, { tep: r, dong: dongCua(s, m.index), id: idm ? idm[1] : '?' });
  }
}
/** Có ai NGHE token này không. So chữ thường; token ngắn phải đứng trong dấu nháy để không
 *  khớp bừa (chữ 'z' xuất hiện khắp nơi) — đây là chỗ dễ báo nhầm nhất của H2, cùng loại lỗi
 *  với ca `outline-none` gộp ba cơ chế. */
function coNguoiNghe(tok) {
  const t = tok.toLowerCase();
  if (t.length <= 2) return new RegExp(`['"\`]${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]`).test(vanNghe);
  return vanNghe.includes(t);
}
const H2 = [...phimKhai.entries()].filter(([t]) => !coNguoiNghe(t)).map(([tok, o]) => ({ tok, ...o }));

/* ── H3 · TAY CẦM RỖNG ─────────────────────────────────────────────────────── */
/** Cố ý KHÔNG bắt dạng nuốt sự kiện (`onClick={(e) => e.stopPropagation()}`) — đó là việc
 *  THẬT. Chỉ bắt bốn hình dạng không thể cãi. */
const MAU_RONG = [
  { ten: 'thân rỗng', re: /\bon[A-Z]\w*\s*=\s*\{\s*\(?\s*[\w\s,{}:]*\)?\s*=>\s*\{\s*\}\s*\}/g },
  { ten: 'undefined', re: /\bon[A-Z]\w*\s*=\s*\{\s*undefined\s*\}/g },
  { ten: 'null', re: /\bon[A-Z]\w*\s*=\s*\{\s*null\s*\}/g },
  { ten: 'chỉ console', re: /\bon[A-Z]\w*\s*=\s*\{\s*\(?\s*[\w\s,{}:]*\)?\s*=>\s*console\.\w+\([^)]*\)\s*\}/g },
];
const H3 = [];
for (const r of TEP) {
  if (laTest(r) || !r.endsWith('.tsx')) continue;
  const s = doc(r);
  for (const { ten, re } of MAU_RONG) {
    for (const m of s.matchAll(re)) {
      H3.push({ tep: r, dong: dongCua(s, m.index), kieu: ten, song: laSong(r), trich: m[0].replace(/\s+/g, ' ').slice(0, 56) });
    }
  }
}

/* ── H4 · DÂY ĐỨT ──────────────────────────────────────────────────────────── */
/** Khuôn ca Vitals: kho khai `open()`, có nơi SỐNG bấm công tắc, mà mặt do kho đó điều khiển
 *  thì đã rơi khỏi cây mount ⇒ bấm xong KHÔNG GÌ HIỆN RA.
 *
 *  🔴 VÒNG 1 CỦA HỌ NÀY HỤT ĐÚNG CA VITALS — bắt được nhờ hiệu chuẩn, không nhờ suy luận.
 *  Bản đầu đòi "MỌI mặt đều chết", mà tệp bấm công tắc (`StatusBar`) cũng có JSX nên tự nó bị
 *  đếm là một "mặt SỐNG" ⇒ điều kiện không bao giờ đúng. Thử tách hai vai theo DẠNG GỌI cũng
 *  hỏng: đo `StatusBar.tsx:106-107` thấy nó đọc `panelOpen` VÀ lấy `open` cùng một kiểu
 *  selector `useVitalsUi((s) => …)` — dạng gọi không phân biệt được ai bật ai hiện.
 *  ⇒ Tiêu chí dùng là QUAN HỆ, không phải vai: *công tắc còn người sống bấm, mà có mặt của nó
 *  đã mồ côi*. Bảo thủ hơn (không đòi mọi mặt chết) nhưng đúng thứ cần báo, và nó nối được
 *  nguyên nhân với hậu quả — thứ H1 một mình không nói ra: H1 chỉ bảo "tệp này mồ côi", H4 bảo
 *  "và vẫn có người bấm nút gọi nó". */
const MO_ACTION = /\b(open|show|mo|moPanel|bat|toggle)\s*:\s*\(/;
const khoUi = TEP.filter((r) => r.startsWith('lib/') && !laTest(r) && /\bcreate[<(]/.test(doc(r)) && MO_ACTION.test(doc(r)));
const H4 = [];
for (const k of khoUi) {
  const nguoiDung = TEP.filter((t) => t !== k && !laTest(t) && (NHAP.get(t) ?? new Set()).has(k));
  const nguoiBat = nguoiDung.filter((t) => laSong(t) && /\.(open|show|mo|bat|toggle)\s*\(|\bs\.(open|show|mo|bat|toggle)\b/.test(doc(t)));
  const matRoi = nguoiDung.filter((t) => t.endsWith('.tsx') && coJSX(t) && !laSong(t));
  if (nguoiBat.length && matRoi.length) {
    H4.push({ kho: k, bat: nguoiBat.length, batVd: nguoiBat[0], mat: matRoi.length, matVd: matRoi[0] });
  }
}

/* ── H5 · CHẠM-TỚI-ĐƯỢC (chỉ khi `--cham`) ─────────────────────────────────── */
/**
 * Hàm chạy TRONG trang. Tách rời khỏi phần tĩnh ở trên: nó không đọc tệp nào, chỉ hỏi
 * trình duyệt một câu duy nhất — *ai đang đứng tại tâm của phần tử bấm được này?*
 */
const DO_TRONG_TRANG = () => {
  const CHON = [
    'button', 'a[href]', 'input', 'select', 'textarea', 'summary',
    '[role="button"]', '[role="link"]', '[role="tab"]', '[role="switch"]',
    '[role="checkbox"]', '[role="menuitem"]', '[role="option"]',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');

  const mo = (el) => {
    if (!el) return 'null';
    const cls = typeof el.className === 'string' ? el.className : (el.className?.baseVal ?? '');
    const id = el.id ? `#${el.id}` : '';
    return `${el.tagName.toLowerCase()}${id}${cls ? '.' + cls.trim().split(/\s+/).slice(0, 2).join('.') : ''}`;
  };
  const ten = (el) => (
    el.getAttribute('aria-label')
    || el.getAttribute('title')
    || (el.textContent || '').trim().slice(0, 40)
    || el.getAttribute('placeholder')
    || mo(el)
  );

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const ra = { xet: 0, boQua: 0, truot: [] };

  for (const e of document.querySelectorAll(CHON)) {
    const r = e.getBoundingClientRect();
    // ── loại trừ BẢO THỦ: thứ không kỳ vọng bấm, hoặc không nằm trong khung nhìn ──
    if (r.width < 2 || r.height < 2) { ra.boQua++; continue; }
    const cs = getComputedStyle(e);
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) { ra.boQua++; continue; }
    if (cs.pointerEvents === 'none') { ra.boQua++; continue; }
    if (e.disabled || e.getAttribute('aria-disabled') === 'true') { ra.boQua++; continue; }
    const cx = r.x + r.width / 2;
    const cy = r.y + r.height / 2;
    if (cx < 0 || cy < 0 || cx > vw || cy > vh) { ra.boQua++; continue; }

    const top = document.elementFromPoint(cx, cy);
    if (!top) { ra.boQua++; continue; }          // ngoài vùng vẽ — không kết luận
    ra.xet++;
    // PASS: chính nó · con nó · TỔ TIÊN nó (<label> bọc <input> là ca hợp lệ)
    if (top === e || e.contains(top) || top.contains(e)) continue;

    const tr = top.getBoundingClientRect();
    ra.truot.push({
      ten: ten(e),
      nut: mo(e),
      hop: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      che: mo(top),
      cheTen: ten(top).slice(0, 40),
      cheHop: { x: Math.round(tr.x), y: Math.round(tr.y), w: Math.round(tr.width), h: Math.round(tr.height) },
    });
  }
  return ra;
};

const H5 = [];
let h5Xet = 0;
let h5Man = 0;
let h5HieuChuan = null;
if (CHAM) {
  const { chromium } = await import('/home/user/INTERIORFLOW/node_modules/playwright/index.mjs');
  const b = await chromium.launch({ executablePath: H5_CHROME });
  const ctx = await b.newContext({ viewport: { width: 1600, height: 900 } });
  {
    const p = await ctx.newPage();
    const r = await p.request.post(`${H5_URL}/api/auth/login`, {
      data: { identifier: 'kiem@localhost.test', password: 'matkhau123' },
    });
    if (!r.ok()) console.error(`⚠️  login ${r.status()} — màn sau đây có thể là màn đăng nhập, không phải app.`);
    const me = await (await p.request.get(`${H5_URL}/api/auth/me`)).json().catch(() => ({}));
    await p.goto(H5_URL);
    await p.evaluate((id) => { try { localStorage.setItem(`interiorflow.tourDone.${id}`, '1'); } catch {} }, me?.user?.id ?? '');
    await p.close();
  }
  const page = await ctx.newPage();

  const MAN = [
    ['Home', '/'],
    ['Files', '/files'],
    ['Thư viện', '/library'],
    ['Bảng việc', '/tasks'],
    ['Cài đặt', '/settings'],
    ...(H5_PID ? [
      ['2D', `/projects/${H5_PID}/cad`],
      ['3D', `/projects/${H5_PID}/render`],
      ['Trình chiếu', `/projects/${H5_PID}/present`],
    ] : []),
  ];

  for (const [ten, duong] of MAN) {
    try {
      await page.goto(`${H5_URL}${duong}`, { waitUntil: 'networkidle', timeout: 45000 });
    } catch { /* mạng lặng không về — vẫn đo cái đang có */ }
    await page.waitForTimeout(2600);
    const r = await page.evaluate(DO_TRONG_TRANG);
    h5Man++;
    h5Xet += r.xet;
    for (const t of r.truot) H5.push({ man: ten, ...t });

    /* HIỆU CHUẨN — chỉ ở màn đầu, và chỉ khi `--tu-kiem`. Dựng lại ĐÚNG ca thật: một tấm
       phủ lên tâm một nút đang lành. Luật phải ĐỎ; gỡ tấm ra phải XANH lại. Không có bước
       này thì luật chỉ là lời khai. */
    if (TU_KIEM && !h5HieuChuan) {
      const truocKhiChe = r.truot.length;
      const ok = await page.evaluate(() => {
        const n = [...document.querySelectorAll('button')].find((e) => {
          const b = e.getBoundingClientRect();
          const cs = getComputedStyle(e);
          return b.width > 30 && b.height > 20 && cs.display !== 'none' && cs.visibility !== 'hidden'
            && b.x >= 0 && b.y >= 0 && b.x + b.width <= innerWidth && b.y + b.height <= innerHeight
            && document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2) === e;
        });
        if (!n) return null;
        const b = n.getBoundingClientRect();
        const d = document.createElement('div');
        d.id = '__hieu-chuan-h5';
        d.style.cssText = `position:fixed;left:${b.x - 6}px;top:${b.y - 6}px;width:${b.width + 12}px;height:${b.height + 12}px;background:rgba(255,0,0,.25);z-index:2147483647`;
        document.body.appendChild(d);
        return { ten: (n.textContent || '').trim().slice(0, 30) };
      });
      if (!ok) {
        h5HieuChuan = { chay: false, ly_do: 'không tìm được nút lành để thử — KHÔNG KẾT LUẬN (đây là LỖI hạ tầng, không phải TRƯỢT)' };
      } else {
        const sauKhiChe = (await page.evaluate(DO_TRONG_TRANG)).truot.length;
        await page.evaluate(() => document.getElementById('__hieu-chuan-h5')?.remove());
        const goRa = (await page.evaluate(DO_TRONG_TRANG)).truot.length;
        h5HieuChuan = {
          chay: true, nut: ok.ten, truoc: truocKhiChe, khiChe: sauKhiChe, sauGo: goRa,
          DAT: sauKhiChe > truocKhiChe && goRa === truocKhiChe,
        };
      }
    }
  }
  await b.close();
}

/* ── IN ─────────────────────────────────────────────────────────────────────── */
const in_ = (...a) => console.log(...a);
in_('\n🔦 SOI CÔNG CỤ CHẾT — mặt tiền có đường chạy không');
in_(`   gốc: ${ROOT}`);
in_(`   quét ${TEP.length} tệp · entry router ${TEP.filter(laEntry).length} · sống ${SONG.size} · nơi nghe bàn phím sống ${NGHE.length}\n`);

in_(`H1 · COMPONENT MỒ CÔI — ${H1.length}`);
if (HIEN_SONG) {
  for (const o of H1) {
    const vi = o.nguoiGoi === 0 ? '0 nơi import'
      : o.chiTest ? `${o.nguoiGoi} nơi import — TOÀN TEST (xanh giả)`
      : `${o.nguoiGoi} nơi import, đều chết theo`;
    in_(`   🔴 ${o.tep} — ${vi}`);
  }
}

in_(`\nH2 · PHÍM CÂM — ${H2.length}`);
if (HIEN_SONG) for (const o of H2) in_(`   🔴 '${o.tok}'  ← ${o.id}  (${o.tep}:${o.dong}) — không nơi-nghe SỐNG nào so tới`);

in_(`\nH3 · TAY CẦM RỖNG — ${H3.length}  (${H3.filter((o) => o.song).length} nằm trong tệp SỐNG = người dùng bấm được)`);
if (HIEN_SONG) for (const o of H3) in_(`   ${o.song ? '🔴' : '🟡'} ${o.tep}:${o.dong} — ${o.kieu} — ${o.trich}`);

in_(`\nH4 · DÂY ĐỨT — ${H4.length}`);
if (HIEN_SONG) for (const o of H4) in_(`   🔴 ${o.kho} — ${o.bat} nơi SỐNG bấm (vd ${o.batVd}) · ${o.mat} mặt dựng ra nhưng CHẾT HẾT (vd ${o.matVd})`);

if (CHAM) {
  in_(`\nH5 · BỊ CHE, BẤM KHÔNG TRÚNG — ${H5.length}   (${h5Man} màn · ${h5Xet} phần tử bấm-được đã xét)`);
  if (h5HieuChuan) {
    if (!h5HieuChuan.chay) {
      in_(`   ⚠️  HIỆU CHUẨN KHÔNG CHẠY ĐƯỢC — ${h5HieuChuan.ly_do}`);
      in_('       ⇒ số H5 dưới đây CHƯA ĐƯỢC BẢO CHỨNG. LỖI hạ tầng ≠ ĐẠT.');
    } else {
      in_(`   ${h5HieuChuan.DAT ? '✅' : '🔴'} HIỆU CHUẨN trên nút "${h5HieuChuan.nut}": `
        + `thường ${h5HieuChuan.truoc} → khi bị che ${h5HieuChuan.khiChe} → gỡ che ${h5HieuChuan.sauGo}`
        + `${h5HieuChuan.DAT ? '' : '  ⇐ KHÔNG ĐẠT, đừng tin số H5'}`);
    }
  }
  if (HIEN_SONG) {
    for (const o of H5) {
      in_(`   🔴 [${o.man}] "${o.ten}" ${o.nut} (${o.hop.x},${o.hop.y},${o.hop.w}×${o.hop.h})`);
      in_(`        bị đè bởi ${o.che} "${o.cheTen}" (${o.cheHop.x},${o.cheHop.y},${o.cheHop.w}×${o.cheHop.h})`);
    }
  }
}

const tong = H1.length + H2.length + H3.length + H4.length + (CHAM ? H5.length : 0);
in_(`\n── TỔNG ${tong} ca · H1 ${H1.length} · H2 ${H2.length} · H3 ${H3.length} · H4 ${H4.length}`
  + (CHAM ? ` · H5 ${H5.length}` : ' · H5 (tắt — thêm --cham)'));
if (!CHAM) {
  in_('⚠️  Máy chứng minh CÓ ĐƯỜNG MOUNT, KHÔNG chứng minh BẤM VÀO CÓ VIỆC XẢY RA.');
  in_('   Cửa cuối vẫn là: thao tác → ghi xuống → tải lại → vào lại → cùng một sự thật.');
} else {
  in_('⚠️  H5 chứng minh TÂM NÚT KHÔNG BỊ VẬT KHÁC ĐỨNG ĐÈ. Vẫn KHÔNG chứng minh bấm vào thì có việc xảy ra.');
  in_('   Cửa cuối vẫn là: thao tác → ghi xuống → tải lại → vào lại → cùng một sự thật.');
}
if (!NGHIEM) in_('ℹ️  Không chặn build (exit 0) ở phát đầu — xem ĐIỀU KIỆN SIẾT trong docstring.');
process.exit(NGHIEM && tong ? 1 : 0);
