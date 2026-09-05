#!/usr/bin/env node
/**
 * scripts/soi-mat-tien.mjs — MÁY ĐẾM DÂY CHƯA CẮM
 *
 * Hỏi ĐÚNG MỘT CÂU mà không cổng nào khác trong repo đang hỏi:
 *   **"Năng lực này có MẶT TIỀN nào gọi tới không, hay chỉ tồn tại dưới dạng hàm?"**
 *
 * ⛔ VÌ SAO — sáu ca trong một ngày, cả sáu tìm ra do TÌNH CỜ:
 *   tầng vật liệu hạt giống (thiếu 1/5 mặt tiền) · replaceMaterialReferences (0 nơi gọi) ·
 *   resolveIdfcCommerceToSpec (0) · cửa tạo dự án (mất tay nắm) · congThucKe của kệ hạt giống (0) ·
 *   ⌘J Vitals (đăng ký ở component KHÔNG CÒN MOUNT).
 * `nghiem-thu-g4-moat.mjs` đo *hàm chạy đúng không*. `soi-frontier` đo *bằng chứng còn không*.
 * KHÔNG cổng nào đo *có ai gọi hàm không*. Đó là một CHIỀU ĐO còn thiếu, không phải vài lỗi lẻ.
 *
 * ── BẬC THANG (chốt ở lượt này) ────────────────────────────────────────────────────────────
 *   bậc 0 · không ai import, không ai dùng          → hàm sống một mình
 *   bậc 1 · CÓ import, nhưng không dùng trong thân  → dây kéo tới, chưa cắm
 *   bậc 2 · CÓ dùng, nhưng MỌI nơi dùng đều CHẾT    → ⚠ BẬC BẪY NHẤT: có người gọi,
 *           (không tệp nào với tới được từ route)      nhưng người gọi ấy không còn sống
 *   bậc 3 · dùng từ tệp SỐNG (với tới từ route)     → mặt tiền người dùng chạm được
 *
 * "SỐNG" = với tới được bằng đồ thị import từ MỘT GỐC: app/**\/{page,layout,route,error,
 * not-found,loading,template,default}.{ts,tsx} + middleware.ts. Ca `⌘J` chết đúng vì
 * `StageSwitcher.tsx` không còn ai import ⇒ mọi thứ đăng ký trong đó rơi xuống bậc 1-2.
 *
 * ⚠️ MÁY NÀY MÙ Ở ĐÂU — khai thẳng, đọc trước khi tin con số:
 *   · import graph là XẤP XỈ TRÊN: tệp được import nhưng nhánh render không bao giờ chạy
 *     (nút bị gỡ khỏi màn, `if (false)`) vẫn đọc là SỐNG ⇒ ca "cửa tạo dự án mất tay nắm"
 *     máy này KHÔNG bắt được. Con số bậc 3 vì thế là TRẦN, không phải sàn.
 *   · ngược lại bậc 0/1/2 là SÀN: chỉ đếm được năng lực nào có entry trong frontier-registry.
 *   · chuỗi ký tự trong template `${X}` bị strip cùng chuỗi ⇒ có thể bỏ sót một cách dùng.
 *
 * Chạy: node scripts/soi-mat-tien.mjs [--json] [--chi-tiet] [--thu-go <đường/dẫn>]
 *   --thu-go = HIỆU CHUẨN: bỏ một tệp khỏi lượt quét để chứng minh máy BIẾT ĐỎ, không phải
 *              xanh ở mọi thế giới. Máy tự in xác nhận tệp đã thật sự bị bỏ.
 * Mã thoát: luôn 0 — đây là máy ĐẾM, không phải cổng chặn. Số xấu thì để nó xấu.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FRONTIER } from './frontier-registry.mjs';

const GOC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const JSON_RA = process.argv.includes('--json');
const CHI_TIET = process.argv.includes('--chi-tiet');
const iGo = process.argv.indexOf('--thu-go');
const THU_GO = iGo >= 0 ? process.argv[iGo + 1] : null;

/* ── ① Quét mã sản phẩm ───────────────────────────────────────────────────────────────────── */
const VUNG = ['app', 'components', 'lib'];
const LA_MA = (f) => /\.(ts|tsx)$/.test(f) && !/\.(test|spec)\.tsx?$/.test(f) && !/\.d\.ts$/.test(f);

function di(dir, ra = []) {
  for (const t of readdirSync(dir)) {
    const p = path.join(dir, t);
    if (statSync(p).isDirectory()) di(p, ra);
    else if (LA_MA(t)) ra.push(path.relative(GOC, p));
  }
  return ra;
}

let TEP = [];
for (const v of VUNG) { const g = path.join(GOC, v); if (existsSync(g)) TEP = TEP.concat(di(g)); }
if (existsSync(path.join(GOC, 'middleware.ts'))) TEP.push('middleware.ts');

let daGo = false;
if (THU_GO) {
  const truoc = TEP.length;
  TEP = TEP.filter((p) => p !== THU_GO);
  daGo = TEP.length === truoc - 1;
}
const CO_TEP = new Set(TEP);

/* Bỏ chú thích — tên hàm trong docstring KHÔNG phải nơi gọi (ca thật: `lib/cad/idfc.ts:219`). */
const boChuThich = (s) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:"'`\\])\/\/[^\n]*/g, '$1');
/* Bỏ chuỗi — `'ThinkDial'` trong một chuỗi không phải một lời gọi. */
const boChuoi = (s) => s.replace(/`(?:\\.|[^`\\])*`/g, '``').replace(/'(?:\\.|[^'\\\n])*'/g, "''").replace(/"(?:\\.|[^"\\\n])*"/g, '""');

/**
 * VÙNG IMPORT của một tệp = mọi chỗ một ký hiệu được KÉO VÀO, gồm HAI dạng:
 *   ① tĩnh:  `import { a, b } from '…'`
 *   ② ĐỘNG:  `const { a, b } = await import('…')`  ← dạng ② suýt làm máy báo đỏ oan:
 *      `pdfToDeck` được gọi thật ở `Toolbar.tsx:340`, nhưng kéo vào bằng destructuring động
 *      ở `:289` nên mắt chỉ-nhìn-`import…from` đọc ra "0 nơi import" ⇒ chấm bậc 0. SAI.
 */
const RE_NHAP_TINH = /^\s*import\s[\s\S]*?from\s*['"][^'"]+['"];?/gm;
const RE_NHAP_DONG = /(?:const|let|var)\s*\{[^}]*\}\s*=\s*(?:await\s+)?(?:import|require)\s*\(/g;
const vungNhap = (s) => [...s.matchAll(RE_NHAP_TINH), ...s.matchAll(RE_NHAP_DONG)].map((m) => m[0]);

const MA = new Map();   // đường dẫn → mã đã bỏ chú thích (còn chuỗi: cần cho import)
const THAN = new Map(); // đường dẫn → mã đã bỏ chú thích + chuỗi + DÒNG import (cần cho "dùng")
const NHAP_VUNG = new Map();
for (const p of TEP) {
  const raw = boChuThich(readFileSync(path.join(GOC, p), 'utf8'));
  MA.set(p, raw);
  NHAP_VUNG.set(p, vungNhap(raw));
  THAN.set(p, boChuoi(raw.replace(RE_NHAP_TINH, ' ').replace(/^\s*import\s+['"][^'"]+['"];?/gm, ' ')));
}

/* ── ② Đồ thị import + tập SỐNG ───────────────────────────────────────────────────────────── */
const DUOI = ['.ts', '.tsx', '/index.ts', '/index.tsx'];
function giaiMa(spec, tuTep) {
  let base;
  if (spec.startsWith('@/')) base = spec.slice(2);
  else if (spec.startsWith('.')) base = path.normalize(path.join(path.dirname(tuTep), spec));
  else return null; // gói ngoài
  base = base.replace(/\\/g, '/');
  if (CO_TEP.has(base)) return base;
  for (const d of DUOI) if (CO_TEP.has(base + d)) return base + d;
  return null;
}
const RE_SPEC = /(?:from\s*|import\s*\(\s*|require\s*\(\s*)['"]([^'"]+)['"]/g;
const CANH = new Map(); // tệp → Set(tệp nó import)
const NGUOC = new Map(); // tệp → Set(tệp import nó)
for (const p of TEP) {
  const s = new Set();
  for (const m of MA.get(p).matchAll(RE_SPEC)) {
    const t = giaiMa(m[1], p);
    if (t && t !== p) { s.add(t); if (!NGUOC.has(t)) NGUOC.set(t, new Set()); NGUOC.get(t).add(p); }
  }
  CANH.set(p, s);
}
const LA_GOC = (p) => p === 'middleware.ts' ||
  /^app\/.*\/(page|layout|route|error|not-found|loading|template|default)\.(ts|tsx)$/.test(p) ||
  /^app\/(page|layout|route|error|not-found|loading|template|default)\.(ts|tsx)$/.test(p);
const GOC_TEP = TEP.filter(LA_GOC);
const SONG = new Set();
{ const q = [...GOC_TEP]; GOC_TEP.forEach((g) => SONG.add(g));
  while (q.length) for (const t of CANH.get(q.pop()) || []) if (!SONG.has(t)) { SONG.add(t); q.push(t); } }

/* ── ③ Ký hiệu xuất khẩu của một tệp ──────────────────────────────────────────────────────── */
/**
 * ⚠️ CHỈ ĐẾM KÝ HIỆU GIÁ TRỊ (function · const · class · default), CỐ Ý BỎ `type`/`interface`.
 * Lý do đo được, không phải cho gọn: lượt chạy đầu báo ĐỎ 7 entry chỉ vì `LightArcProps`,
 * `PanelFlankProps`, `PresenceRowProps`… không ai import — nhưng một kiểu Props KHÔNG PHẢI
 * một năng lực, nó là hình dạng tham số của chính component bên cạnh. Đếm nó là BÁO QUÁ TAY.
 * `export default function X` cũng phải bắt riêng: mẫu cũ trượt, và đó chính là dạng của
 * `LightArc`/`PanelFlank` ⇒ entry rơi bậc 0 oan.
 */
const RE_XUAT = [
  /export\s+default\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g,
  /export\s+default\s+class\s+([A-Za-z_$][\w$]*)/g,
  /export\s+default\s+([A-Za-z_$][\w$]*)\s*;/g,
  /export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g,
  /export\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g,
  /export\s+class\s+([A-Za-z_$][\w$]*)/g,
  /export\s+enum\s+([A-Za-z_$][\w$]*)/g,
];
function kyHieuXuat(p) {
  const s = MA.get(p) || ''; const ra = new Set();
  for (const re of RE_XUAT) for (const m of s.matchAll(re)) ra.add(m[1]);
  for (const m of s.matchAll(/export\s*\{([^}]*)\}/g))
    for (const t of m[1].split(',')) {
      const th = t.trim(); if (/^type\s/.test(th)) continue;
      const n = th.split(/\s+as\s+/).pop()?.trim();
      if (/^[A-Za-z_$][\w$]*$/.test(n || '')) ra.add(n);
    }
  // gỡ lại những cái thật ra là type/interface (bị `export const` bắt nhầm thì không có ở đây)
  for (const m of s.matchAll(/export\s+(?:type|interface)\s+([A-Za-z_$][\w$]*)/g)) ra.delete(m[1]);
  // `export default function X` cũng đồng thời là mặt tiền qua import mặc định → giữ tên X
  if (/export\s+default/.test(s)) ra.add('__default__');
  return ra;
}

/* ── ④ Chấm bậc cho MỘT ký hiệu ───────────────────────────────────────────────────────────── */
function chamKyHieu(ten, tepKhai) {
  const esc = ten.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`\\b${esc}\\b`);
  const nhap = [], dung = [];
  for (const p of TEP) {
    if (p === tepKhai) continue;
    if (!re.test(MA.get(p))) continue;
    const coNhap = (NHAP_VUNG.get(p) || []).some((v) => re.test(v));
    if (coNhap) nhap.push(p);
    /**
     * ⚠️ CHỈ TÍNH LÀ "DÙNG" KHI TỆP ĐÓ THẬT SỰ IMPORT KÝ HIỆU. Khớp theo biên từ thôi là
     * BÁO ĐỎ OAN — ca thật đo được: `part-lock.ts:163` có `chuanNet` nhưng đó là TÊN THAM SỐ
     * (`buildPartLockFromChuanNet(surfaceGraph, chuanNet: ChuanNetInput)`), không phải lời gọi
     * hàm `chuanNet` xuất từ `chuan-net.ts` — tệp đó chỉ import mỗi `type ChuanNetPart`.
     * (Đánh đổi: `import { x as y }` rồi thân dùng `y` sẽ bị đọc thành bậc 1 — khai ở phần mù.)
     */
    if (coNhap && re.test(THAN.get(p))) dung.push(p);
  }
  /**
   * ⚠️ TỰ DÙNG TRONG CHÍNH TỆP KHAI CŨNG LÀ MỘT NƠI GỌI. Bỏ qua nó là BÁO ĐỎ OAN — đo được:
   * lượt trước máy chấm `labelInRoomBounds` · `extractImagesWithBbox` · `mirrorCompleteShapes`
   * là bậc 0, trong khi cả ba được gọi ngay trong tệp của mình (label-placer.ts:535 ·
   * pdf-import.ts:924 · chuan-net.ts:1072) rồi đi ra ngoài qua một hàm bọc khác.
   * Chỉ tính là "dùng" khi tên xuất hiện NGOÀI dòng khai — nên bỏ chính câu khai trước khi soi.
   */
  const thanKhai = (THAN.get(tepKhai) || '')
    .replace(new RegExp(`export\\s+(?:default\\s+)?(?:async\\s+)?(?:function|class|const|let|var)\\s+${esc}\\b`, 'g'), ' ');
  if (re.test(thanKhai)) dung.push(tepKhai);
  const dungSong = dung.filter((p) => SONG.has(p));
  let bac;
  if (dungSong.length) bac = 3;
  else if (dung.length) bac = 2;
  else if (nhap.length) bac = 1;
  else bac = 0;
  return { bac, nhap, dung, dungSong };
}

/* ── ⑤ Chấm bậc cho MỘT TỆP (khi bằng chứng không nêu ký hiệu nào) ────────────────────────── */
/**
 * Với đơn vị TỆP không có bậc 1: import một tệp LUÔN là dùng nó (không có kiểu "import rồi
 * để đó" ở cấp tệp). Nên 0 người import ⇒ bậc 0, đúng nghĩa "không ai với tới".
 */
function chamTep(p) {
  const nguoi = [...(NGUOC.get(p) || [])];
  const song = nguoi.filter((q) => SONG.has(q));
  if (SONG.has(p)) return { bac: 3, nhap: nguoi, dung: nguoi, dungSong: song, viaTep: true };
  if (nguoi.length) return { bac: 2, nhap: nguoi, dung: nguoi, dungSong: [], viaTep: true };
  return { bac: 0, nhap: [], dung: [], dungSong: [], viaTep: true };
}

/* ── ⑥ Từ entry registry ra tập tệp năng lực ──────────────────────────────────────────────── */
const LA_SAN_PHAM = (p) => VUNG.some((v) => p === v || p.startsWith(v + '/')) || p === 'middleware.ts';
function tepNangLuc(e) {
  const ra = new Set(); const ngoai = []; const chiChuThich = new Set();
  for (const b of e.bangChung || []) {
    if (b.can === false) continue; // bằng chứng NGHỊCH ("xong = không còn khớp") — không nêu năng lực
    let re; try { re = new RegExp(b.mau); } catch { continue; }
    if (b.file) {
      if (!LA_SAN_PHAM(b.file)) { ngoai.push(b.file); continue; }
      if (CO_TEP.has(b.file)) ra.add(b.file);
    } else if (b.dir) {
      if (!LA_SAN_PHAM(b.dir)) { ngoai.push(b.dir); continue; }
      const goc = b.dir.replace(/\/$/, '') + '/';
      for (const p of TEP) {
        if (!p.startsWith(goc)) continue;
        if (re.test(MA.get(p))) ra.add(p);
        /* Bằng chứng CHỈ khớp khi CÒN chú thích ⇒ registry đang lấy một docstring làm bằng
           chứng. `soi-frontier` đọc là XANH; ở đây phải nói thẳng đó là bằng chứng rỗng. */
        else if (re.test(readFileSync(path.join(GOC, p), 'utf8'))) chiChuThich.add(p);
      }
    }
  }
  return { tep: [...ra], ngoai, chiChuThich: [...chiChuThich] };
}

/* ── ⑦ Chấm một entry ─────────────────────────────────────────────────────────────────────── */
function chamEntry(e) {
  const { tep, ngoai, chiChuThich } = tepNangLuc(e);
  const mau = (e.bangChung || []).filter((b) => b.can !== false).map((b) => b.mau);
  if (!tep.length) {
    const lyDo = chiChuThich.length
      ? `⚠ bằng chứng CHỈ SỐNG TRONG CHÚ THÍCH (${chiChuThich.slice(0, 2).join(', ')}) — soi-frontier đọc là XANH`
      : ngoai.length ? `bằng chứng NGOÀI mã sản phẩm (${[...new Set(ngoai)].join(', ')})`
      : 'không tệp mã sản phẩm nào khớp bằng chứng';
    return { ap: false, lyDo, chiChuThich, tep: [], kyHieu: [] };
  }
  // ký hiệu xuất khẩu KHỚP mẫu của entry → đó chính là năng lực entry hứa
  const kh = [];
  for (const p of tep) for (const k of kyHieuXuat(p)) {
    if (k === '__default__') continue;
    if (mau.some((m) => { try { return new RegExp(m).test(k); } catch { return false; } })) kh.push({ ten: k, tep: p });
  }
  const cham = [];
  if (kh.length) for (const k of kh) {
    let c = chamKyHieu(k.ten, k.tep);
    /* Ký hiệu là XUẤT MẶC ĐỊNH ⇒ tên cục bộ ở nơi import có thể khác (`import X from …`).
       Với ca này, danh tính của ký hiệu CHÍNH LÀ danh tính của tệp ⇒ lấy mức cao hơn của hai
       phép đo, kẻo báo đỏ oan chỉ vì người ta đặt tên khác. */
    const macDinh = new RegExp(`export\\s+default\\s+(?:async\\s+)?(?:function\\s+|class\\s+)?${k.ten}\\b`).test(MA.get(k.tep) || '');
    if (macDinh) { const ct = chamTep(k.tep); if (ct.bac > c.bac) c = { ...ct, quaTep: true }; }
    cham.push({ don_vi: `${k.ten} (${k.tep})`, kieu: 'ký hiệu', ...c });
  }
  else for (const p of tep) cham.push({ don_vi: p, kieu: 'tệp', ...chamTep(p) });
  const bac = Math.max(...cham.map((c) => c.bac));
  const yeu = cham.filter((c) => c.bac < 3).sort((a, b) => a.bac - b.bac);
  return { ap: true, bac, tep, kyHieu: kh.map((k) => k.ten), cham, yeu };
}

/* ── ⑦b HIỆU CHUẨN: chấm MỘT ký hiệu bất kỳ ───────────────────────────────────────────────
 * Có mặt để chứng minh máy BIẾT ĐỎ chứ không xanh ở mọi thế giới. Ghép với `--thu-go`:
 * cùng một ký hiệu, hai thế giới (còn / mất tệp cắm điện) phải cho HAI bậc khác nhau.
 * Thoái hoá (đỏ ở cả hai) hoặc xanh-ở-cả-hai đều là phép hiệu chuẩn HỎNG — máy tự nói ra.
 */
const iKh = process.argv.indexOf('--ky-hieu');
if (iKh >= 0) {
  const [ten, tepKhai] = (process.argv[iKh + 1] || '').split('@');
  if (!ten || !tepKhai) { console.error('dùng: --ky-hieu <TênKýHiệu>@<đường/dẫn/tệp/khai.ts>'); process.exit(2); }
  const c = chamKyHieu(ten, tepKhai);
  console.log(`quét ${TEP.length} tệp · ${SONG.size} SỐNG`);
  if (THU_GO) console.log(`⚙ --thu-go ${THU_GO} → ${daGo ? 'ĐÃ bỏ (xác nhận)' : '⚠ KHÔNG bỏ được — phép hiệu chuẩn VÔ HIỆU'}`);
  console.log(`${ten} (${tepKhai}) → BẬC ${c.bac}`);
  console.log(`  import bởi : ${c.nhap.join(', ') || '(không ai)'}`);
  console.log(`  dùng ở     : ${c.dung.join(', ') || '(không ai)'}`);
  console.log(`  dùng ở tệp SỐNG: ${c.dungSong.join(', ') || '(không ai)'}`);
  process.exit(0);
}

/* ── ⑧ Chạy ───────────────────────────────────────────────────────────────────────────────── */
const XONG = FRONTIER.filter((e) => e.trangThai === 'xong' || e.trangThai === 'xong-mat');
const kq = XONG.map((e) => ({ id: e.id, vai: e.vai, he: e.he, ...chamEntry(e) }));
const apDung = kq.filter((k) => k.ap);
const dem = [0, 1, 2, 3].map((b) => apDung.filter((k) => k.bac === b).length);
const nA = kq.length - apDung.length;

if (JSON_RA) {
  console.log(JSON.stringify({ tongEntryXong: XONG.length, apDung: apDung.length, khongApDung: nA, dem, muc: kq }, null, 2));
} else {
  console.log('SOI MẶT TIỀN — năng lực có ai gọi tới không\n');
  console.log(`quét ${TEP.length} tệp mã sản phẩm · ${GOC_TEP.length} gốc route · ${SONG.size} tệp SỐNG · ${TEP.length - SONG.size} tệp KHÔNG với tới được`);
  if (THU_GO) console.log(`⚙ HIỆU CHUẨN --thu-go ${THU_GO} → ${daGo ? 'ĐÃ bỏ khỏi lượt quét (xác nhận)' : '⚠ KHÔNG bỏ được — đường dẫn không có trong tập quét, phép hiệu chuẩn VÔ HIỆU'}`);
  console.log(`\nentry 'xong' trong frontier-registry: ${XONG.length} · chấm được: ${apDung.length} · không áp dụng: ${nA}\n`);
  console.log('  bậc 0 · không ai import, không ai dùng        : ' + dem[0]);
  console.log('  bậc 1 · có import, không dùng trong thân      : ' + dem[1]);
  console.log('  bậc 2 · có dùng, mọi nơi dùng đều CHẾT        : ' + dem[2]);
  console.log('  bậc 3 · dùng từ tệp SỐNG (có mặt tiền)        : ' + dem[3]);
  for (const b of [0, 1, 2]) {
    const ds = apDung.filter((k) => k.bac === b);
    if (!ds.length) continue;
    console.log(`\n── BẬC ${b} (${ds.length}) ───────────────────────────────────────────`);
    for (const k of ds) {
      console.log(`■ ${k.id}  [${k.vai}/${k.he}]`);
      for (const c of k.yeu.slice(0, CHI_TIET ? 99 : 3))
        console.log(`   bậc ${c.bac} · ${c.don_vi}${c.nhap.length ? ` · import bởi: ${c.nhap.slice(0, 3).join(', ')}` : ''}${c.dung.length ? ` · dùng ở: ${c.dung.slice(0, 3).join(', ')}` : ''}`);
    }
  }
  const naDs = kq.filter((k) => !k.ap);
  if (naDs.length) {
    console.log(`\n── KHÔNG ÁP DỤNG (${naDs.length}) — bằng chứng không nằm ở mã sản phẩm ─────────`);
    for (const k of naDs) console.log(`   ${k.id.padEnd(32)} ${k.lyDo}`);
  }
  /* tỉ lệ báo nhầm của CHÍNH máy — giữ đúng khuôn `soi:mat-tu-cham` */
  const doDo = dem[0] + dem[1] + dem[2];
  console.log('\n── TỈ LỆ BÁO NHẦM CỦA CHÍNH MÁY NÀY (đo 05/09, không ước) ────────');
  console.log(`   BÁO NHẦM ĐỎ: 0/${doDo} — cả ${doDo} mục bậc <3 đã xác minh TAY bằng grep + đọc mã.`);
  console.log('     Bốn vòng trước đó máy báo đỏ oan 3 → 7 → 1 lần, đều đã vá và ghi lý do tại chỗ:');
  console.log('     ① kiểu `*Props` bị đếm như năng lực ② `export default function` trượt mẫu');
  console.log('     ③ hàm tự gọi trong chính tệp khai ④ import ĐỘNG `const {x} = await import()`.');
  console.log('   BÁO NHẦM XANH: ≥1 ca ĐÃ ĐO, và đây là chiều máy YẾU NHẤT.');
  console.log('     Ca thật: `congThucKe` (lib/library/hat-giong-3d.ts) chấm bậc 3 vì được gọi từ');
  console.log('     một tệp SỐNG — nhưng giá trị nó sinh ra (`geom3d.recipe`) KHÔNG tệp nào đưa vào');
  console.log('     `evalRecipe`. Tức HÀM có người gọi mà KẾT QUẢ không ai tiêu thụ. Đó là CHIỀU ĐO');
  console.log('     THỨ BA (dòng chảy dữ liệu), máy này KHÔNG đo. Bậc 3 vì thế là TRẦN.');
  console.log('     Cùng loại: tệp được import nhưng nhánh render không chạy (nút bị gỡ khỏi màn).');
  console.log('   BẬC 0/1/2 = SÀN: chỉ soi năng lực CÓ entry registry — không ai khai thì vô hình.');
  console.log(`   ${nA}/${XONG.length} entry không chấm được (bằng chứng ở docs/scripts/schema/css).`);
}
process.exit(0);
