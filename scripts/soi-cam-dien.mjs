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
 * ─── VÙNG MÙ ĐÃ VÁ 05/09: `components/` CŨNG LÀ CHỦ THỂ ────────────────────────
 * Trước 05/09 `moduleCua()` trả `null` cho mọi thứ ngoài `lib/`, và bảng mồ côi lọc
 * `t.startsWith('lib/')` ⇒ `app/` và `components/` **chỉ bao giờ đóng vai NGƯỜI GỌI**, không
 * bao giờ bị hỏi ngược *"có ai gọi mày không"*. Một nguyên thể dựng trong `components/` mà
 * không ai import thì **vô hình với máy**. Đo được lúc vá: 24 tệp như vậy, trong đó
 * `components/home/DongStudioHome.tsx` 900 dòng và `components/studio/StageSwitcher.tsx` 462
 * dòng — cả hai đã bị thay mà chưa ai đóng dấu.
 * ⚠️ Phần khó KHÔNG phải mã, là **định nghĩa "mồ côi"**: đo thô ra 149 tệp 0-nơi-gọi, nhưng
 * **125 là ĐIỂM VÀO khung Next** (`route.ts`/`page.tsx`/`layout.tsx` — khung gọi theo TÊN TỆP,
 * không qua import). Gộp vào là báo quá tay 5 lần. ⇒ tha có LÝ DO IN RA, không lọc im lặng.
 * ⚠️ VẪN MÙ Ở CẤP TÊN XUẤT: tệp được import CHO MỘT HẰNG SỐ vẫn tính là "có nơi gọi" dù
 * component chính chưa ai dùng — ca thật `components/ui/Icon.tsx` (`BeMatHome.tsx:43` lấy
 * `ICON_STROKE`, còn `<Icon>` thì 0 nơi dùng). Đó là câu hỏi CẤP TÊN XUẤT, đất của
 * `soi-that.mjs`; máy này KHÔNG nhận đã phủ. Xem `docs/delivery/SOI-CAM-DIEN-VUNG-MU.md`.
 *
 * ─── ĐỌC KẾT QUẢ ───────────────────────────────────────────────────────────────
 *   🟢 SỐNG        ≥1 tệp trong `app/` hoặc `components/` gọi tới
 *   🔵 CHỈ NỘI BỘ  chỉ lib khác gọi — chưa lên tới mặt
 *   🔴 KHO CHƯA MỞ 0 nơi gọi ngoài test của chính nó
 *   📄 MỒ CÔI      cấp TỆP, gốc `lib/`+`components/`+`app/` — 0 nơi gọi từ người dùng
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
  if (!MODULE.has(id)) MODULE.set(id, { tep: [], ui: new Set(), lib: new Set(), phu: new Set(), test: new Set(), kieu: new Set(), goiToi: new Set() });
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
  // 22/08 — CẠM BẪY ③ (bắt được khi audit kiến trúc): `import type … from '…'` BỊ XOÁ lúc
  // biên dịch. Nó KHÔNG phải một lời gọi. Mẫu ① chỉ nhìn mệnh đề `from` nên trước nay đếm nó
  // như caller thật ⇒ `lib/idfc-import` có 3 "caller" mà cả 3 chỉ mượn ĐÚNG MỘT type alias
  // (`ProvenanceFlag`) ⇒ máy xếp nó vào CHỈ NỘI BỘ thay vì KHO CHƯA MỞ ⇒ khối đối chiếu
  // frontier (chỉ bắn khi mọi bằng chứng nằm trong KHO CHƯA MỞ) im lặng trả 0, và hai entry
  // 'xong' sống sót. Máy đã CÓ, chỗ hở nằm ở phép đếm.
  // Hướng THẬN TRỌNG cố ý: chỉ loại dạng KHÔNG THỂ NHẦM (`import type` / `export type` mở đầu
  // mệnh đề). Dạng trộn `import { type A, b }` VẪN tính là runtime — báo oan "chết" đắt hơn
  // nhiều so với bỏ sót một type-only.
  const specs = new Map(); // spec → chiRiengKieu (true = mọi lượt gặp đều là type-only)
  for (const mau of MAU_IMPORT) {
    for (const m of src.matchAll(mau)) {
      const dong = dongChua(src, m.index);
      if (laChuThich(dong)) continue;
      const chiKieu = /^\s*(?:import|export)\s+type\s/.test(dong);
      specs.set(m[1], specs.has(m[1]) ? specs.get(m[1]) && chiKieu : chiKieu);
    }
  }

  for (const [spec, chiKieu] of specs) {
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
    if (chiKieu) { o.kieu.add(tuTep); continue; } // type-only: KHÔNG phải lời gọi, đếm riêng
    if (laTest(tuTep)) o.test.add(tuTep);
    else if (GOC_MAT.includes(gocGoi)) o.ui.add(tuTep);
    else if (gocGoi === 'lib') { o.lib.add(tuTep); if (modGoi) o.goiToi.add(modGoi); }
    else o.phu.add(tuTep);
  }
}

/* ── TỚI ĐƯỢC NGƯỜI DÙNG (bắc cầu) ──────────────────────────────────────────────
 * `ui > 0` chỉ trả lời "có mặt tiền gọi thẳng". Nó KHÔNG trả lời "người dùng chạm được".
 * Hai chiều sai ngược nhau nếu chỉ đếm trực tiếp:
 *   · module A chỉ được B gọi, mà B có mặt tiền  ⇒ A TỚI ĐƯỢC (đếm thẳng nói "chỉ nội bộ")
 *   · module A chỉ được B gọi, mà B cũng không ai gọi ⇒ A KHÔNG tới được (cả hai là một đảo)
 * Nên phải lấy điểm bất động: hạt giống = module có mặt tiền; lan theo cạnh module→module.
 * Đây là bậc "USER REACHABLE" ở CẤP MÃ — điều kiện CẦN, chưa phải điều kiện ĐỦ. Bấm được
 * nút thật vẫn phải mở app kiểm; máy này không tự nhận đã chứng minh điều đó.
 */
const TOI_DUOC = new Set();
{
  const hang = [];
  for (const [id, o] of MODULE) if (o.ui.size > 0) { TOI_DUOC.add(id); hang.push(id); }
  // cạnh ngược: X.goiToi chứa module ĐANG GỌI X ⇒ nếu kẻ gọi tới được thì X tới được
  while (hang.length) {
    const cha = hang.pop();
    for (const [id, o] of MODULE) {
      if (TOI_DUOC.has(id)) continue;
      if (o.goiToi.has(cha)) { TOI_DUOC.add(id); hang.push(id); }
    }
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
/**
 * 🔴 TỰ LOẠI TRỪ CHÍNH MÌNH — 05/09. Máy này QUÉT VĂN BẢN và bản thân nó nằm trong vùng quét
 * (`GOC_PHU` có `scripts`). Docstring của nó nêu đích danh hàng chục đường dẫn thật
 * (`lib/cad/dwg-worker.ts`, `components/ui/Icon.tsx`, bảng hiệu chuẩn…). `laChuThich` đã lọc
 * dòng chú thích, nhưng đó là hàng rào MỎNG: chỉ cần một ví dụ viết ở dạng mã sống trong tệp
 * này là một tệp CHẾT hoá ra "còn sống", và máy tự cấp chứng chỉ cho chính mình.
 * Ba lần trong ngày 04/09 đã hỏng đúng kiểu này: `soi-thao-tac` đọc trúng chú thích của nó ·
 * mẫu `outline-none` gộp ba cơ chế · máy chẩn đoán `pgrep` tự khớp mình rồi báo 9 công cụ đang
 * chạy trong container trống trơn. ⇒ Lời khai của máy soi KHÔNG được tính là bằng chứng.
 * Kiểm được: `grep -c "components/ui/Icon.tsx" <kết quả>` không được xanh hoá tệp đó.
 */
const TU_LOAI_TRU = new Set([
  relative(ROOT, duongTuyetDoi(new URL(import.meta.url).pathname)), // chính tệp này
  'scripts/soi-cam-dien.test.ts',                                   // và bài kiểm của nó
]);
for (const tuTep of TEP) {
  if (laTest(tuTep) || TU_LOAI_TRU.has(tuTep)) continue;
  const src = doc(tuTep);
  for (const mau of MAU_IMPORT) {
    for (const m of src.matchAll(mau)) {
      if (laChuThich(dongChua(src, m.index))) continue;
      const d = giaiDuongDan(m[1], tuTep);
      if (d && d !== tuTep) duocGoi.add(d);
    }
  }
}

/* ── VÙNG MÙ 05/09: `components/` CŨNG LÀ CHỦ THỂ ───────────────────────────────
 * Đo được: `moduleCua()` trả `null` cho mọi thứ ngoài `lib/`, và bảng mồ côi lọc
 * `t.startsWith('lib/')`. ⇒ `app/` và `components/` chỉ bao giờ đóng vai NGƯỜI GỌI, không
 * bao giờ bị hỏi ngược "có ai gọi mày không". Một primitive dựng trong `components/` mà không
 * ai import thì VÔ HÌNH với máy — mà đó đúng là chỗ `components/ui/BeMatNoi.tsx` (432 dòng,
 * docstring tự xưng "nguyên thể dùng chung") và `components/studio/StageSwitcher.tsx` (462
 * dòng, đã bị sidebar-router thay từ 17/08) đang nằm.
 *
 * 🔴 PHẦN KHÓ KHÔNG PHẢI MÃ — LÀ ĐỊNH NGHĨA "MỒ CÔI". Đo thô: 149 tệp 0-nơi-gọi, trong đó
 * **125 là ĐIỂM VÀO khung Next** (94 `route.ts` · 29 `page.tsx` · 2 `layout.tsx`) — khung gọi
 * chúng theo QUY ƯỚC TÊN TỆP, không qua import. Gộp chúng vào là báo quá tay 5 lần, và một
 * máy soi đỏ thứ không sửa được thì chết theo cách tệ nhất: người ta học cách bỏ qua nó.
 * ⇒ Tha có LÝ DO ĐỌC ĐƯỢC, in kèm mỗi lần chạy — không im lặng lọc.
 */
/**
 * ⚠️ BẪY TỰ GÂY: `icon.tsx` là tên quy ước của App Router, nhưng `components/ui/Icon.tsx` thì
 * KHÔNG. Luật này vì thế phải NEO VÀO `app/`, không so tên trần toàn cây — so tên trần là tự
 * bịt mắt mình ở đúng tệp đang muốn soi.
 */
const TEN_QUY_UOC_APP = new Set([
  'page', 'layout', 'template', 'loading', 'error', 'global-error', 'not-found', 'default',
  'route', 'middleware', 'instrumentation', 'sitemap', 'robots', 'manifest',
  'opengraph-image', 'twitter-image', 'icon', 'apple-icon',
]);

/** Tha = máy VẪN THẤY nhưng cố ý không kêu, kèm lý do đọc được (khuôn `soi-tu-dien.mjs`). */
const THA_MO_COI = [
  [(t) => /\.d\.ts$/.test(t),
    'khai báo kiểu cho gói ngoài — theo bản chất KHÔNG ai import, TypeScript nạp qua `include` của tsconfig. "0 nơi gọi" ở đây là đúng, không phải thiếu.'],
  [(t) => t.startsWith('app/') && TEN_QUY_UOC_APP.has(t.split('/').pop().replace(/\.(ts|tsx|mjs)$/, '')),
    'điểm vào App Router — Next gọi theo TÊN TỆP (`page`/`layout`/`route`…), không qua import. 0 nơi gọi là ĐÚNG BẢN CHẤT. Neo vào `app/`: `components/ui/Icon.tsx` KHÔNG dính luật này.'],
];

/** Gốc được HỎI NGƯỢC. `lib` là phần cũ; `components`+`app` là phần mở rộng 05/09. */
const GOC_CHU_THE = ['lib/', 'components/', 'app/'];
const thaVi = (t) => THA_MO_COI.find(([hop]) => hop(t))?.[1] ?? null;
const demTha = new Map(THA_MO_COI.map(([, ly]) => [ly, 0]));

const moCoi = [];
for (const t of TEP) {
  if (!GOC_CHU_THE.some((g) => t.startsWith(g)) || laTest(t) || duocGoi.has(t)) continue;
  const ly = thaVi(t);
  if (ly) { demTha.set(ly, demTha.get(ly) + 1); continue; }
  moCoi.push({
    t,
    goc: t.split('/')[0],
    dong: doc(t).split('\n').length,
    // ⚠️ Đây là GỢI Ý hiển thị (khớp chuỗi tên trần), KHÔNG phải phép đo — không tham gia
    // quyết định mồ côi. Với tên ngắn/phổ biến nó báo dư; khai ở mục CHƯA CHẮC của báo cáo.
    rieng: TEP.some((x) => laTest(x) && doc(x).includes(t.split('/').pop().replace(/\.[^.]+$/, ''))),
  });
}
moCoi.sort((a, b) => (a.goc === b.goc ? b.dong - a.dong : GOC_CHU_THE.indexOf(a.goc + '/') - GOC_CHU_THE.indexOf(b.goc + '/')));

/* ── ĐỐI CHIẾU FRONTIER (④.5) — CHỈ IN, KHÔNG SỬA REGISTRY ──────────────────── */
const ttCua = new Map(BANG.map((r) => [r.id, r.tt]));
const chuaCamDien = [];
const lanLon = []; // entry 'xong' có bằng chứng NỬA trong nửa ngoài đường tới người dùng
const bangChungRong = []; // entry 'xong' lấy bằng chứng bằng mẫu QUÉT CẢ CÂY
for (const e of FRONTIER) {
  if (e.trangThai !== 'xong' || !Array.isArray(e.bangChung)) continue;
  // 22/08 · §2 — BẰNG CHỨNG PHẢI CÓ PHẠM VI. `dir: 'lib'` quét CẢ CÂY: một mẫu đủ rộng có thể
  // trúng thư mục cài đặt thật VÀ trúng một hằng số tên-tác-vụ ở module sống chẳng liên quan
  // (ca thật `import-ghe-tu-hinh`: `imageTo3d` là tên tác vụ trong lib/ai/models.ts). Lúc đó
  // entry xanh nhờ thứ không phải là nó. Chỉ CẢNH BÁO, không tự đỏ: 19 entry đang dính, và một
  // máy soi đỏ hàng loạt thứ chưa sửa được thì chết theo cách tệ nhất — người ta học cách bỏ qua.
  if (e.bangChung.some((bc) => bc.dir && /^(lib|app|components)$/.test(bc.dir))) bangChungRong.push(e);
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
  // 22/08 — TRƯỚC: `every(... === CHUA_MO)`. Chỗ hở thứ hai: nó chỉ bắn khi bằng chứng nằm
  // trong nhóm KHO CHƯA MỞ. Module hạng CHỈ NỘI BỘ cũng KHÔNG tới tay người dùng, mà lại
  // lọt lưới — cộng với lỗi đếm type-only ở trên, đúng hai entry `idfc-import` thoát cả hai
  // tầng. NAY: hỏi thẳng câu cần hỏi — bằng chứng có nằm trên đường tới người dùng không.
  const toanKhongToi = ds.every((t) => {
    const md = moduleCua(t);
    return md ? !TOI_DUOC.has(md) : false;
  });
  if (toanKhongToi) chuaCamDien.push({ e, ds });
  else if (ds.some((t) => { const md = moduleCua(t); return md && !TOI_DUOC.has(md); })) {
    // BẰNG CHỨNG LẪN LỘN — nửa nằm trên đường tới người dùng, nửa nằm ngoài.
    // Không tự động đỏ: mẫu grep rộng có thể vô tình quét trúng một hằng số ở module sống
    // (ca thật: `imageTo3d` là TÊN TÁC VỤ trong lib/ai/models.ts, không phải đường mesh).
    // Máy KHÔNG đoán hộ ý định — nó chỉ chỉ đúng chỗ mẫu quá rộng để người audit siết lại.
    lanLon.push({ e, ngoai: ds.filter((t) => { const md = moduleCua(t); return md && !TOI_DUOC.has(md); }) });
  }
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
    const k = MODULE.get(r.id)?.kieu.size ?? 0;
    const toi = TOI_DUOC.has(r.id) ? 'tới-được' : 'CHƯA-TỚI';
    console.log(`  ${CO[tt]} ${r.id.padEnd(w)} ${n(r.dong, 5)} dòng · ui=${n(r.ui, 2)} lib=${n(r.lib, 2)} phụ=${n(r.phu, 2)} test=${n(r.test, 2)} tự-kiểm=${n(r.rieng, 2)} · ${toi}${k ? ` · type-only=${k}` : ''}`);
    if (r.mo) console.log(`     ↳ ${r.mo.slice(0, 92)}`);
  }
}

inNhom(CHUA_MO, 'xây xong mà chưa ai chạm được — đây là loại công cốc đắt nhất');
inNhom(NOI_BO, 'lib khác dùng, chưa lên tới mặt');
if (HIEN_SONG) inNhom(SONG, 'SỔ TRA MÁY SẴN CÓ — đọc trước khi định xây mới [Đ2]');
else console.log(`\n${CO[SONG]} ${SONG} — ${theoTt(SONG).length} module (ẩn bởi --gon; bỏ cờ để hiện sổ tra)`);

const demGoc = (g) => moCoi.filter((x) => x.goc === g).length;
console.log(`\n📄 TỆP MỒ CÔI — 0 nơi gọi TỪ NGƯỜI DÙNG ở cấp TỆP (${moCoi.length} tệp · ${moCoi.reduce((s, x) => s + x.dong, 0)} dòng)`);
console.log(`   ⓘ theo gốc: lib ${demGoc('lib')} · components ${demGoc('components')} · app ${demGoc('app')}`);
console.log('   ⓘ "có test" = engine chạy đúng nhưng chưa ai dùng — hai chuyện khác nhau.');
console.log('   ⛔ MỒ CÔI ≠ RÁC. Ba loại khác hẳn: (a) CHƯA CẮM — phải cắm · (b) ĐÃ BỊ THAY — phải đóng');
console.log('      dấu lỗi thời tại chỗ, đừng bỏ hoang · (c) MÁY ĐO SAI — siết máy. Máy KHÔNG phân loại hộ,');
console.log('      KHÔNG xoá, KHÔNG sửa registry. Phân biệt ba loại đó là việc của người audit.');
let gocDangIn = '';
for (const { t, goc, dong, rieng } of moCoi) {
  if (goc !== gocDangIn) { gocDangIn = goc; console.log(`  ── ${goc}/`); }
  console.log(`  📄 ${t.padEnd(56)} ${n(dong, 5)} dòng${rieng ? ' · có test' : ''}`);
}
if (!moCoi.length) console.log('  (không có)');
for (const [, ly] of THA_MO_COI) console.log(`  ⚪ tha ${n(demTha.get(ly), 3)}: ${ly}`);

console.log(`\n🔗 FRONTIER "✅ nhưng CHƯA CẮM ĐIỆN" — entry khai xong, mọi bằng chứng nằm trong ${CHUA_MO} (${chuaCamDien.length})`);
for (const { e, ds } of chuaCamDien) {
  console.log(`  ⚡ ${e.id} — ${e.ten.split('(')[0].trim().slice(0, 76)}`);
  console.log(`     ↳ bằng chứng: ${ds.slice(0, 3).join(' · ')}${ds.length > 3 ? ` … +${ds.length - 3}` : ''}`);
}
if (!chuaCamDien.length) console.log('  (không có)');
console.log('  \u24d8 CHỈ IN, không sửa registry — flip trạng thái là việc của người audit.');

console.log(`\n\u26a0\ufe0f  BẰNG CHỨNG LẪN LỘN — entry 'xong' có bằng chứng NỬA ngoài đường tới người dùng (${lanLon.length})`);
for (const { e, ngoai } of lanLon) {
  console.log(`  \u26a0\ufe0f  ${e.id} — ${e.ten.split('(')[0].trim().slice(0, 72)}`);
  console.log(`     \u21b3 phần CHƯA TỚI: ${ngoai.slice(0, 3).join(' · ')}${ngoai.length > 3 ? ` … +${ngoai.length - 3}` : ''}`);
}
if (!lanLon.length) console.log('  (không có)');
console.log(`  \u24d8 KHÔNG tự động đỏ: mẫu grep rộng quét trúng module sống là chuyện thật. Siết \`mau\` cho hẹp rồi chạy lại.`);

console.log(`\n\ud83d\udd0d BẰNG CHỨNG QUÁ RỘNG — entry 'xong' dùng mẫu quét CẢ CÂY (${bangChungRong.length})`);
console.log("   Bằng chứng nên có PHẠM VI: đường import runtime chính xác · tên export chính xác ·");
console.log("   id capability đã đăng ký · route/component sở hữu. Tránh mẫu quét toàn repo.");
for (const e of bangChungRong.slice(0, 12)) console.log(`  \ud83d\udd0d ${e.id}`);
if (bangChungRong.length > 12) console.log(`     … +${bangChungRong.length - 12} entry nữa`);
if (!bangChungRong.length) console.log('  (không có)');
console.log('  \u24d8 KHÔNG tự động đỏ: mẫu grep rộng quét trúng module sống là chuyện thật. Siết `mau` cho hẹp rồi chạy lại.');
console.log('  ⓘ CHỈ IN, không sửa registry — flip trạng thái là việc của người audit.');

if (KHONG_DO_NOI.length) {
  const gom = new Map();
  for (const { spec } of KHONG_DO_NOI) gom.set(spec, (gom.get(spec) ?? 0) + 1);
  console.log(`\n❓ KHÔNG GIẢI NỔI ĐƯỜNG DẪN — ${KHONG_DO_NOI.length} lượt · ${gom.size} dạng (máy MÙ ở đây, khai để không ai tin quá tay)`);
  for (const [spec, sl] of [...gom].sort((a, b) => b[1] - a[1]).slice(0, 8)) console.log(`  ❓ ${spec}  ×${sl}`);
}

/* ── BẬC HOÀN THÀNH (22/08) ─────────────────────────────────────────────────────
 * Luật Hoà đặt sau audit kiến trúc: THƯ MỤC TỒN TẠI ≠ SẢN PHẨM TỒN TẠI.
 * Máy chỉ phán được ba bậc dưới. Hai bậc trên KHÔNG suy ra được từ mã — phải mở app,
 * phải có mắt người. Máy khai thẳng giới hạn đó thay vì im lặng để người đọc tự suy.
 */
const soCoCaller = [...MODULE].filter(([, o]) => o.ui.size + o.lib.size + o.phu.size > 0).length;
console.log('\n🪜 BẬC HOÀN THÀNH — máy phán được 3/5 bậc');
console.log(`  ① ENGINE CÓ MẶT        ${String(MODULE.size).padStart(3)} module lib`);
console.log(`  ② CÓ DÂY CHẠY THẬT     ${String(soCoCaller).padStart(3)} module có caller không-phải-type-only`);
console.log(`  ③ TỚI ĐƯỢC NGƯỜI DÙNG  ${String(TOI_DUOC.size).padStart(3)} module bắc cầu được về app|components`);
console.log('  ④ KIỂM TRÊN APP THẬT   — máy KHÔNG phán được (phải mở app bấm)');
console.log('  ⑤ QUA MẮT NGƯỜI DUYỆT  — máy KHÔNG phán được (trạng thái thiết kế, sổ riêng)');
console.log('  ⓘ ③ là điều kiện CẦN, không phải ĐỦ: có đường dây ≠ có nút bấm.');

const cm = theoTt(CHUA_MO);
console.log('─'.repeat(104));
console.log(`CẮM ĐIỆN — 🟢 ${theoTt(SONG).length} sống · 🔵 ${theoTt(NOI_BO).length} chỉ nội bộ · 🔴 ${cm.length} kho chưa mở (${cm.reduce((s, r) => s + r.dong, 0)} dòng) · 📄 ${moCoi.length} tệp mồ côi · ⚡ ${chuaCamDien.length} frontier chưa cắm điện\n`);
// 22/08 — MÃ THOÁT. Luật Hoà: KHÔNG đỏ vì "hàm phụ chết" (kho chưa mở/tệp mồ côi là THÔNG TIN,
// người audit đọc rồi quyết) — chỉ đỏ khi VI PHẠM HỢP ĐỒNG FRONTIER đã khai: entry tự nhận
// 'xong' mà toàn bộ bằng chứng nằm ngoài đường tới người dùng. Đó là lời khai sai, không phải
// một lựa chọn kiến trúc.
/* 🔴 CẤM `process.exit()` Ở ĐÂY — ĐO ĐƯỢC 05/09, và nó là bug THẬT chứ không phải test đỏ vặt.
 *
 * `console.log` ghi ra PIPE là BẤT ĐỒNG BỘ trong Node (ra TTY hoặc tệp thì đồng bộ). Máy này in
 * ~32 KB. Chạy một mình thì đường ống rỗng, ghi xong ngay, `process.exit(0)` vô hại. Nhưng khi
 * `test:sweep` chạy 8 tiến trình song song (`xargs -P8`), bên đọc rút chậm, đường ống đầy, phần
 * ghi còn lại nằm trong hàng đợi — và `process.exit()` **VỨT HÀNG ĐỢI ĐÓ ĐI**.
 *
 * Hệ quả đã bắt tận tay: `soi-cam-dien.test.ts` đỏ với HAI thông điệp KHÁC NHAU ở hai lượt chạy
 * liên tiếp — lượt một mất dòng `theo gốc:`, lượt hai còn dòng đó nhưng mất sạch 43 dòng `📄`.
 * Hai chỗ cắt khác nhau của cùng một hiện tượng. Chạy đơn lẻ thì XANH. CI cũng đỏ.
 *
 * ⇒ Máy soi này lúc bị đọc qua đường ống thì **NÓI SAI VỀ THẾ GIỚI** — đúng họ bệnh mà chính nó
 * sinh ra để bắt. Ai đọc stdout của nó bằng `spawnSync`/pipe đều có thể nhận bản cụt mà không
 * hay biết, vì mã thoát vẫn là 0.
 *
 * Cách chữa: đặt `process.exitCode` rồi ĐỂ NODE TỰ THOÁT — nó chỉ thoát sau khi xả hết hàng đợi.
 * Không đổi một dòng in nào, không đổi mã thoát nào. */
if (chuaCamDien.length) {
  console.log(`🔴 ${chuaCamDien.length} entry khai 'xong' mà bằng chứng KHÔNG tới được người dùng — sửa trạng thái trong frontier-registry.mjs, đừng sửa máy soi.\n`);
  process.exitCode = 1;
}
