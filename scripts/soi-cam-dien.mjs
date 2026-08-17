#!/usr/bin/env node
/**
 * scripts/soi-cam-dien.mjs — máy canh "ENGINE NÀY ĐÃ TỚI TAY NGƯỜI DÙNG CHƯA".
 * Chạy: `npm run soi:cam-dien` — cùng họ soi-frontier / soi-tu-dien / soi-contract / soi-that.
 *
 * ─── VÌ SAO CÓ TỆP NÀY ──────────────────────────────────────────────────────────
 * Công cốc có bốn loại. Ba loại đầu tốn phút. Loại thứ tư tốn TUẦN:
 *   **xây xong, test xanh, sổ đánh ✅ — mà không một người dùng nào chạm được.**
 * Đo tay 17/08 (docs/nc/DO-ENGINE-7-MANH-2026-08-17.md): `lib/idfc-import` 3.339 dòng,
 * 64 test xanh, proof thật (ghế Lincoln 327), hai entry frontier ✅ — và **0 nơi gọi từ
 * bất kỳ đâu**. Năm tệp trong đó chỉ gọi lẫn nhau: một hòn đảo.
 *
 * Đo tay bắt được một lần rồi thôi. Máy thì bắt mỗi lần chạy.
 *
 * ─── MÁY NÀY KHÁC 6 MÁY KIA Ở ĐÂU (đã đọc mã cả 6 trước khi dựng) ───────────────
 * Anh em gần nhất KHÔNG phải `soi-that.mjs` mà là **`soi-contract.mjs`** — nó đã đếm
 * caller và đã có sẵn nhãn 🟡 KHO CHỜ DÂY. Nhưng nó **do SỔ dẫn đường**: chỉ soi 22
 * entry người ta nhớ mà khai. Đo 17/08: trong 8 kho chết đã biết, `contract-registry`
 * phủ **đúng 1** (`lighting/lux`). Kho nguy hiểm nhất là kho **không ai nhớ để khai** —
 * mở rộng máy sổ-dẫn-đường không chạm tới được, vì muốn phủ 94 module thì phải viết tay
 * 94 entry, đúng phần việc mà máy sinh ra để thay.
 *   ⇒ Máy này **do CODE dẫn đường**: quét `lib/` rồi hỏi ngược lên `app/`+`components/`.
 *     Hai máy trả lời hai câu khác nhau; giữ chung từ vựng (*caller* · *kho chưa mở*)
 *     để không thành hai bản của cùng một thứ. [T2]
 *
 * `soi-that.mjs` 🟡 nghe giống mà không phải: nó soi **cấp tên xuất**, và chỉ soi tên nào
 * **văn bản có nhắc kèm dấu ✅** (lần chạy 17/08 mù 407/512 tệp văn bản). Nó ra 10 dòng 🟡
 * — **không dòng nào là `lib/idfc-import`**, vì không văn bản nào nêu đích danh một tên
 * hàm của nó cạnh dấu ✅. Máy sổ-dẫn-đường mù đúng chỗ tối nhất.
 *
 * ─── HAI CẠM BẪY ĐO LƯỜNG (phiên Đ1 đã trả giá — §4⑤ bản đo) ────────────────────
 * ① 🔴 **TÌM THEO CHUỖI ĐƯỜNG DẪN LÀ BÁO OAN.** Bản đo v1 grep chuỗi `lib/<tên>` ⇒ kết
 *    luận `lib/pdf-font.ts` là kho chết. Thật ra `lib/cad/pdf.ts:43` gọi nó bằng
 *    `'../pdf-font'` — **không có chữ "lib/" trong chuỗi**. Nếu không phát hiện, bản đo
 *    đã báo oan 4 module. ⇒ máy này **GIẢI ĐƯỜNG DẪN THẬT** (`giaiDuongDan`): `@/…`,
 *    `./`, `../`, thiếu đuôi, `index.ts`.
 * ② 🔴 **NẠP ĐỘNG KHÔNG ĐI QUA IMPORT TĨNH.** `lib/cad/dwg-worker.ts` (349 dòng) hiện
 *    "0 nơi gọi" nhưng **sống thật**, nạp qua `new Worker(new URL('./dxf-worker.ts',
 *    import.meta.url))` tại `lib/cad/dxf-open.ts:40`. Ai tin bảng mà xoá là **giết đường
 *    nhập DWG/DXF**. ⇒ `MAU_IMPORT` dò cả `new URL(…, import.meta.url)` và `import()`
 *    động. Dạng nào vẫn không dò nổi thì khai ở `KHONG_DO_NOI`, không im lặng.
 * ③ Loại trừ theo **tên thư mục CHỨA chữ của cây phụ**, không so chuỗi cứng — bug này
 *    đã phải vá **ba lần** (`npm test` 16/08 · `soi-that` 17/08 · `check-chot` còn nợ).
 *
 * ─── ĐỌC KẾT QUẢ ───────────────────────────────────────────────────────────────
 *   🟢 SỐNG        ≥1 tệp trong `app/` hoặc `components/` gọi tới
 *   🔵 CHỈ NỘI BỘ  chỉ lib khác gọi — chưa lên tới mặt
 *   🔴 KHO CHƯA MỞ 0 nơi gọi ngoài test của chính nó
 *
 * ⚠️ GIỚI HẠN — in mỗi lần chạy, cố ý: máy chứng minh **CÓ ĐƯỜNG DÂY**, KHÔNG chứng minh
 *    **CÓ NÚT BẤM**. Một engine được import vào component sống vẫn có thể nằm sau nhánh
 *    `if` không bao giờ chạy. Muốn biết cái sau phải **mở app bấm thật**.
 *
 * ⚠️ KHÔNG CHẶN (exit 0). Cùng lý do `soi-tu-dien` để 🟡 không chặn: một máy soi báo đỏ
 *    thứ chưa sửa ngay được thì chết theo cách tệ nhất — người ta học cách bỏ qua nó.
 *
 * ⛔ KHÔNG dùng AI. Tất định, 0đ, chạy 10 lần ra 10 kết quả giống nhau (Hoà chốt 15/08:
 *    *"kiểm tiêu chuẩn = việc của MÁY, không phải của AI"*).
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve as duongTuyetDoi, relative, extname } from 'node:path';
import { FRONTIER } from './frontier-registry.mjs';

const ROOT = duongTuyetDoi(new URL('..', import.meta.url).pathname);
const HIEN_SONG = !process.argv.includes('--gon');

/* ── QUÉT CÂY ───────────────────────────────────────────────────────────────── */
const BO_QUA = new Set(['node_modules', '.next', '.git', 'dist', 'dist-installer', 'out', 'coverage', 'uploads', 'public']);
/**
 * Loại theo *tên thư mục CÓ CHỨA* chữ dưới đây, không so chuỗi cứng — xem cạm bẫy ③.
 * Đặt ở đâu (`.worktrees` · `.claude/worktrees` · `x/y/worktrees`) đều thủng như nhau
 * nếu so chuỗi cứng. Chữ này cố ý KHÔNG in ra stdout: cửa nghiệm thu của phiếu là
 * `grep -c <chữ đó>` trong kết quả phải = 0, in ra là tự tạo báo động giả.
 */
const laCayPhu = (ten) => ten.includes('worktree');
const DUOI_MA = new Set(['.ts', '.tsx', '.mjs']);
const laTest = (rel) => /\.(test|spec)\./.test(rel);

/** Gốc quét. `app`+`components` = MẶT TIỀN · `lib` = engine · còn lại = đường phụ (CLI/build). */
const GOC_MAT = ['app', 'components'];
const GOC_PHU = ['electron', 'scripts'];
const GOC_QUET = ['lib', ...GOC_MAT, ...GOC_PHU];

function quet(thuMuc, ra = []) {
  let ds;
  try { ds = readdirSync(thuMuc); } catch { return ra; }
  for (const ten of ds) {
    if (BO_QUA.has(ten) || laCayPhu(ten)) continue;
    const p = join(thuMuc, ten);
    let st; try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) quet(p, ra);
    else if (DUOI_MA.has(extname(ten))) ra.push(relative(ROOT, p));
  }
  return ra;
}

const TEP = [];
for (const g of GOC_QUET) if (existsSync(join(ROOT, g))) quet(join(ROOT, g), TEP);

const NOI_DUNG = new Map();
const doc = (rel) => {
  if (!NOI_DUNG.has(rel)) {
    try { NOI_DUNG.set(rel, readFileSync(join(ROOT, rel), 'utf8')); } catch { NOI_DUNG.set(rel, ''); }
  }
  return NOI_DUNG.get(rel);
};

/* ── GIẢI ĐƯỜNG DẪN THẬT — vá cạm bẫy ① ─────────────────────────────────────── */
const DUOI_THU = ['', '.ts', '.tsx', '.mjs', '.js', '.jsx', '.d.ts'];
const INDEX_THU = ['/index.ts', '/index.tsx', '/index.mjs', '/index.js'];

function giaiDuongDan(spec, tuTep) {
  let goc;
  if (spec.startsWith('@/')) goc = join(ROOT, spec.slice(2));
  else if (spec.startsWith('.')) goc = duongTuyetDoi(dirname(join(ROOT, tuTep)), spec);
  else return null; // gói ngoài (node_modules) — không thuộc phạm vi
  for (const d of [...DUOI_THU, ...INDEX_THU]) {
    const p = goc + d;
    try { if (statSync(p).isFile()) return relative(ROOT, p); } catch { /* thử tiếp */ }
  }
  return null;
}

/**
 * Mọi dạng "tệp này với tới tệp kia". Dạng ⑤ là dạng cứu `dwg-worker`/`dxf-worker` —
 * xem cạm bẫy ②. Cố ý bắt `new URL(…, import.meta.url)` chứ không bắt `new Worker(…)`:
 * rộng hơn, và không phụ thuộc người viết có bọc trong `new Worker` cùng dòng hay không.
 */
/**
 * 🔴 LỌC CHÚ THÍCH — vá vòng 3, tìm ra bằng đầu dò chứ không bằng suy luận.
 * `lib/cad/dwg-map.ts:200` có docstring *"(thật: `new Worker(new URL('./dwg-worker.ts', …))`)"*.
 * Không lọc thì **một dòng chú thích đủ làm một tệp chết trông như còn sống** — đúng chiều sai
 * NGUY HIỂM của máy này: báo oan làm người ta bực, còn bỏ sót làm 3.000 dòng nằm im thêm một
 * tháng. Repo này docstring rất dày (nhiều tệp 20-40 dòng đầu là lập luận) nên rủi ro là thật,
 * không phải lo xa.
 * Heuristic: dòng bắt đầu bằng `*` hoặc `//` = chú thích. Không bóc `/* … *​/` giữa dòng — khai
 * ở mục CHƯA CHẮC của báo cáo, không giấu.
 */
const dongChua = (src, i) => {
  const a = src.lastIndexOf('\n', i) + 1;
  const b = src.indexOf('\n', i);
  return src.slice(a, b === -1 ? undefined : b);
};
const laChuThich = (dong) => /^\s*(\*|\/\/)/.test(dong);

const MAU_IMPORT = [
  /\bfrom\s*['"]([^'"]+)['"]/g,                                  // ① import/export … from '…'
  /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,                      // ② import('…') động
  /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,                     // ③ require('…')
  /\bimport\s+['"]([^'"]+)['"]/g,                                // ④ import '…' (chạy lấy hiệu ứng)
  /new\s+URL\s*\(\s*['"]([^'"]+)['"]\s*,\s*import\.meta\.url/g,  // ⑤ worker / tài nguyên nạp động
];

/* ── ĐƠN VỊ "MODULE" ────────────────────────────────────────────────────────── */
/**
 * Module = **thư mục cấp 1 trong `lib/`** hoặc **tệp rời cấp 1**. `lib/cad/standards/*`
 * gộp vào `lib/cad`. Ranh giới này là CHỌN, không phải hằng số của dự án — bản đo Đ1 §5.5
 * đã khai vậy; chọn khác sẽ ra con số khác.
 */
function moduleCua(rel) {
  const p = rel.split('/');
  if (p[0] !== 'lib') return null;
  // VÁ vòng 1: `lib/foo.test.ts` KHÔNG phải một module — nó là bài kiểm CỦA module khác.
  // Không loại thì mỗi tệp test cấp 1 hoá thành một "module 0 dòng, 0 nơi gọi" ⇒ bảng
  // KHO CHƯA MỞ phình từ 3 lên 18 dòng toàn rác, đúng kiểu làm người ta bỏ qua máy soi.
  if (p.length === 2) return laTest(rel) ? null : rel;
  return `${p[0]}/${p[1]}`;
}

const MODULE = new Map(); // id → { tep[], ui:Set, lib:Set, phu:Set, test:Set }
for (const rel of TEP) {
  const id = moduleCua(rel);
  if (!id) continue;
  if (!MODULE.has(id)) MODULE.set(id, { tep: [], ui: new Set(), lib: new Set(), phu: new Set(), test: new Set() });
  MODULE.get(id).tep.push(rel);
}
/**
 * Test NẰM TRONG chính module (vd `lib/idfc-import/*.test.ts`) bị `modDich === modGoi` loại
 * khỏi cột `test` — đúng đặc tả *"0 nơi gọi NGOÀI test của chính nó"*, nhưng đọc lên thành
 * `test=0` thì giấu mất sự thật "64 test xanh". Đếm riêng, in riêng: kho chưa mở CÓ test là
 * tin khác hẳn kho chưa mở KHÔNG test.
 */
const testRieng = new Map();
for (const [id, o] of MODULE) testRieng.set(id, o.tep.filter(laTest).length);
for (const rel of TEP) {
  if (!laTest(rel) || rel.split('/').length !== 2) continue;
  const cham = new Set(); // đếm MỘT lần/tệp test, không đếm theo số dòng import
  for (const mau of MAU_IMPORT) {
    for (const m of doc(rel).matchAll(mau)) {
      if (laChuThich(dongChua(doc(rel), m.index))) continue;
      const d = giaiDuongDan(m[1], rel);
      const md = d && moduleCua(d);
      if (md && MODULE.has(md)) cham.add(md);
    }
  }
  for (const md of cham) testRieng.set(md, (testRieng.get(md) ?? 0) + 1);
}

/* ── DỰNG ĐỒ THỊ GỌI ────────────────────────────────────────────────────────── */
const KHONG_DO_NOI = []; // đặc tả yêu cầu: dò không nổi thì KHAI, không im lặng
for (const tuTep of TEP) {
  const src = doc(tuTep);
  const gocGoi = tuTep.split('/')[0];
  const modGoi = moduleCua(tuTep);
  const specs = new Set();
  for (const mau of MAU_IMPORT) for (const m of src.matchAll(mau)) if (!laChuThich(dongChua(src, m.index))) specs.add(m[1]);

  for (const spec of specs) {
    if (!spec.startsWith('.') && !spec.startsWith('@/')) continue; // gói ngoài
    const dich = giaiDuongDan(spec, tuTep);
    if (!dich) {
      // Tha: chuỗi trỏ vào THƯ MỤC (vd `new URL('..', import.meta.url)` để tính gốc repo — đúng
      // dòng 6 máy soi đang dùng). Đó là phép tính đường dẫn, không phải nạp module ⇒ "không
      // giải nổi" ở đây là đúng, không phải mù. Chỉ báo thứ thật sự trỏ vào một mô-đun.
      let laThuMuc = false;
      try { laThuMuc = statSync(spec.startsWith('@/') ? join(ROOT, spec.slice(2)) : duongTuyetDoi(dirname(join(ROOT, tuTep)), spec)).isDirectory(); } catch { /* không phải thư mục */ }
      if (!laThuMuc) KHONG_DO_NOI.push({ tuTep, spec });
      continue;
    }
    const modDich = moduleCua(dich);
    if (!modDich || !MODULE.has(modDich)) continue;
    if (modDich === modGoi) continue;                    // gọi trong cùng module = nội bộ, không tính
    const o = MODULE.get(modDich);
    if (laTest(tuTep)) o.test.add(tuTep);
    else if (GOC_MAT.includes(gocGoi)) o.ui.add(tuTep);
    else if (gocGoi === 'lib') o.lib.add(tuTep);
    else o.phu.add(tuTep);
  }
}

/* ── TRẠNG THÁI + SỔ TRA ────────────────────────────────────────────────────── */
const SONG = 'SỐNG', NOI_BO = 'CHỈ NỘI BỘ', CHUA_MO = 'KHO CHƯA MỞ';
const CO = { [SONG]: '🟢', [NOI_BO]: '🔵', [CHUA_MO]: '🔴' };

/** Tệp đại diện của module — nơi lấy dòng docstring đầu (sổ tra máy sẵn có, ④.3). */
function tepDaiDien(o) {
  const idx = o.tep.find((t) => /\/index\.(ts|tsx|mjs)$/.test(t));
  if (idx) return idx;
  return o.tep.filter((t) => !laTest(t)).sort((a, b) => doc(b).length - doc(a).length)[0] ?? o.tep[0];
}

/** Dòng đầu docstring — trả lời "máy này làm việc gì", diệt loại công cốc xây-lại-cái-đã-có. */
function moTa(rel) {
  const src = doc(rel);
  const kh = src.match(/\/\*\*([\s\S]*?)\*\//);
  if (kh) {
    for (const raw of kh[1].split('\n')) {
      const l = raw.replace(/^\s*\*?\s?/, '').trim();
      if (l && !/^[-=─]+$/.test(l)) return l;
    }
  }
  const d = src.match(/^\s*\/\/\s*(.+)$/m);
  return d ? d[1].trim() : '';
}

const BANG = [];
for (const [id, o] of MODULE) {
  const khongTest = o.tep.filter((t) => !laTest(t));
  const dong = khongTest.reduce((s, t) => s + doc(t).split('\n').length, 0);
  const tt = o.ui.size ? SONG : o.lib.size ? NOI_BO : CHUA_MO;
  const dd = tepDaiDien(o);
  BANG.push({ id, dong, tep: khongTest.length, ui: o.ui.size, lib: o.lib.size, phu: o.phu.size, test: o.test.size, rieng: testRieng.get(id) ?? 0, tt, mo: moTa(dd) });
}
BANG.sort((a, b) => b.dong - a.dong);
const theoTt = (tt) => BANG.filter((r) => r.tt === tt);

/* ── TỆP MỒ CÔI (cấp TỆP) — nơi cạm bẫy ② thật sự sống ──────────────────────── */
/**
 * Bảng chính ở cấp MODULE. Nhưng `dwg-worker.ts` nằm trong `lib/cad` — một module rõ ràng
 * SỐNG — nên ở cấp module nó không bao giờ kêu, và bài kiểm "không được báo worker là chết"
 * hoá ra rỗng. Cấp TỆP mới là chỗ câu hỏi đó có nghĩa. Đ1 §1 cũng ghi: *"cấp tệp mới là chỗ
 * lộ vấn đề"*.
 */
/**
 * 🔴 VÁ vòng 2 — LỖI NÀY SUÝT NUỐT MẤT BA CA ĐÃ BIẾT. Bản đầu gom `duocGoi` từ **mọi** tệp,
 * kể cả test. Nhưng `lib/ui/thao-tac-glyph.tsx` (240 dòng) và `lib/ai/web-lookup.ts` (355)
 * **chỉ được test của chính chúng import** ⇒ bị đánh dấu "có nơi gọi" ⇒ biến mất khỏi bảng,
 * dù đó đúng là hai kho chưa cắm điện mà bản đo Đ1 nêu đích danh. Người gọi phải là NGƯỜI
 * DÙNG, không phải bài kiểm: test chứng minh engine CHẠY ĐÚNG, không chứng minh có ai DÙNG.
 * (Đây cũng chính là luật đã ghi 15/08: test khẳng định đường thoái lui mà không có test nào
 * khẳng định đường chính chạy được thì là test che bug.)
 */
const duocGoi = new Set();
for (const tuTep of TEP) {
  if (laTest(tuTep)) continue;
  const src = doc(tuTep);
  for (const mau of MAU_IMPORT) {
    for (const m of src.matchAll(mau)) {
      if (laChuThich(dongChua(src, m.index))) continue;
      const d = giaiDuongDan(m[1], tuTep);
      if (d && d !== tuTep) duocGoi.add(d);
    }
  }
}
/** Tha = máy VẪN THẤY nhưng cố ý không kêu, kèm lý do đọc được (khuôn `soi-tu-dien.mjs`). */
const THA_MO_COI = [
  [/\.d\.ts$/, 'khai báo kiểu cho gói ngoài — theo bản chất KHÔNG ai import, TypeScript nạp qua `include` của tsconfig. "0 nơi gọi" ở đây là đúng, không phải thiếu.'],
];
const moCoi = TEP.filter((t) => t.startsWith('lib/') && !laTest(t) && !duocGoi.has(t) && !THA_MO_COI.some(([re]) => re.test(t)))
  .map((t) => ({ t, dong: doc(t).split('\n').length, rieng: TEP.some((x) => laTest(x) && doc(x).includes(t.split('/').pop().replace(/\.[^.]+$/, ''))) }))
  .sort((a, b) => b.dong - a.dong);

/* ── ĐỐI CHIẾU FRONTIER (④.5) — CHỈ IN, KHÔNG SỬA REGISTRY ──────────────────── */
const ttCua = new Map(BANG.map((r) => [r.id, r.tt]));
const chuaCamDien = [];
for (const e of FRONTIER) {
  if (e.trangThai !== 'xong' || !Array.isArray(e.bangChung)) continue;
  const khop = new Set();
  for (const bc of e.bangChung) {
    if (bc.can === false) continue; // 'xong' nghĩa là KHÔNG còn khớp — không dùng để định vị code
    let re; try { re = new RegExp(bc.mau, 'm'); } catch { continue; }
    if (bc.file) {
      if (existsSync(join(ROOT, bc.file)) && re.test(doc(bc.file))) khop.add(bc.file);
    } else if (bc.dir) {
      const tien = bc.dir.endsWith('/') ? bc.dir : bc.dir + '/';
      for (const t of TEP) if (t.startsWith(tien) && !laTest(t) && re.test(doc(t))) khop.add(t);
    }
  }
  if (!khop.size) continue;
  const ds = [...khop];
  const toanChuaMo = ds.every((t) => ttCua.get(moduleCua(t) ?? '') === CHUA_MO);
  if (toanChuaMo) chuaCamDien.push({ e, ds });
}

/* ── IN ─────────────────────────────────────────────────────────────────────── */
const n = (x, w) => String(x).padStart(w);
console.log(`\nCẮM ĐIỆN — soi-cam-dien ${new Date().toISOString().slice(0, 10)}`);
console.log('─'.repeat(104));
console.log(`Quét ${TEP.length} tệp · ${MODULE.size} module lib · cột: ui = app|components gọi · lib = lib khác gọi · phụ = CLI/build · test`);
console.log('⚠️ Máy này chứng minh CÓ ĐƯỜNG DÂY, KHÔNG chứng minh CÓ NÚT BẤM — muốn biết nút thì phải mở app bấm thật.');

function inNhom(tt, ghiChu) {
  const ds = theoTt(tt);
  console.log(`\n${CO[tt]} ${tt} — ${ds.length} module${ghiChu ? ' · ' + ghiChu : ''}${ds.length ? '' : ' (không có)'}`);
  const w = ds.length ? Math.min(34, Math.max(...ds.map((r) => r.id.length))) : 0;
  for (const r of ds) {
    console.log(`  ${CO[tt]} ${r.id.padEnd(w)} ${n(r.dong, 5)} dòng · ui=${n(r.ui, 2)} lib=${n(r.lib, 2)} phụ=${n(r.phu, 2)} test=${n(r.test, 2)} tự-kiểm=${n(r.rieng, 2)}`);
    if (r.mo) console.log(`     ↳ ${r.mo.slice(0, 92)}`);
  }
}

inNhom(CHUA_MO, 'xây xong mà chưa ai chạm được — đây là loại công cốc đắt nhất');
inNhom(NOI_BO, 'lib khác dùng, chưa lên tới mặt');
if (HIEN_SONG) inNhom(SONG, 'SỔ TRA MÁY SẴN CÓ — đọc trước khi định xây mới [Đ2]');
else console.log(`\n${CO[SONG]} ${SONG} — ${theoTt(SONG).length} module (ẩn bởi --gon; bỏ cờ để hiện sổ tra)`);

console.log(`\n📄 TỆP MỒ CÔI trong lib/ — 0 nơi gọi TỪ NGƯỜI DÙNG ở cấp TỆP (${moCoi.length} tệp · ${moCoi.reduce((s, x) => s + x.dong, 0)} dòng)`);
console.log('   ⓘ "có test" = engine chạy đúng nhưng chưa ai dùng — hai chuyện khác nhau.');
for (const { t, dong, rieng } of moCoi) console.log(`  📄 ${t.padEnd(52)} ${n(dong, 5)} dòng${rieng ? ' · có test' : ''}`);
for (const [, ly] of THA_MO_COI) console.log(`  ⚪ tha: ${ly}`);

console.log(`\n🔗 FRONTIER "✅ nhưng CHƯA CẮM ĐIỆN" — entry khai xong, mọi bằng chứng nằm trong ${CHUA_MO} (${chuaCamDien.length})`);
for (const { e, ds } of chuaCamDien) {
  console.log(`  ⚡ ${e.id} — ${e.ten.split('(')[0].trim().slice(0, 76)}`);
  console.log(`     ↳ bằng chứng: ${ds.slice(0, 3).join(' · ')}${ds.length > 3 ? ` … +${ds.length - 3}` : ''}`);
}
if (!chuaCamDien.length) console.log('  (không có)');
console.log('  ⓘ CHỈ IN, không sửa registry — flip trạng thái là việc của người audit.');

if (KHONG_DO_NOI.length) {
  const gom = new Map();
  for (const { spec } of KHONG_DO_NOI) gom.set(spec, (gom.get(spec) ?? 0) + 1);
  console.log(`\n❓ KHÔNG GIẢI NỔI ĐƯỜNG DẪN — ${KHONG_DO_NOI.length} lượt · ${gom.size} dạng (máy MÙ ở đây, khai để không ai tin quá tay)`);
  for (const [spec, sl] of [...gom].sort((a, b) => b[1] - a[1]).slice(0, 8)) console.log(`  ❓ ${spec}  ×${sl}`);
}

const cm = theoTt(CHUA_MO);
console.log('─'.repeat(104));
console.log(`CẮM ĐIỆN — 🟢 ${theoTt(SONG).length} sống · 🔵 ${theoTt(NOI_BO).length} chỉ nội bộ · 🔴 ${cm.length} kho chưa mở (${cm.reduce((s, r) => s + r.dong, 0)} dòng) · 📄 ${moCoi.length} tệp mồ côi · ⚡ ${chuaCamDien.length} frontier chưa cắm điện\n`);
process.exit(0);
