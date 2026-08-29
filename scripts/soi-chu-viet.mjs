#!/usr/bin/env node
/**
 * soi-chu-viet.mjs — CỔNG CHẶN cho luật chữ tiếng Việt (V-2 · V-3 · V-6).
 *
 * Luật nguồn: `.claude/skills/if-design/knowledge/typography-vietnamese.md`
 *   V-2  line-height < 1.5 trên chữ CÓ DẤU  → dòng dưới đội lên chạm dấu dòng trên
 *   V-3  letter-spacing ÂM  trên chữ CÓ DẤU → dấu chữ này đè thân chữ kia
 *   V-6  cỡ < 12px          trên chữ CÓ DẤU → không phân biệt được hỏi ↔ ngã
 *
 * VÌ SAO PHẢI LÀ MÁY, KHÔNG PHẢI "lưu ý khi review" (29/08):
 * kiểm kê đếm ~198 dòng vi phạm trong `app/` + `components/`. Có worker đang sửa. Nhưng sửa mà
 * không có cổng thì lỗi MỌC LẠI — và ổ nặng nhất chứng minh: `text-xs` của Tailwind có
 * line-height **1.333**; ai viết chữ nhỏ cũng với tay lấy nó và **tự động dính V-2 mà không biết**.
 * Không có "một gốc" để sửa một lần. Luật của chính dự án: *một luật chỉ là luật khi có đủ ba —
 * chỗ được nạp · một CỔNG · một ca đột biến chứng minh cổng bắt được.*
 *
 * ⚠️ HAI CÁI BẪY REPO NÀY ĐÃ TRẢ GIÁ, và máy này né cả hai:
 *  ① **Chú thích không phải mã.** `soi-foundation` (F-NHAN-BIA) và `soi-thao-tac`
 *    (kinh-webkit-prefix) từng báo đỏ vì tệp **NHẮC** mẫu xấu trong lời kể. Máy này dùng
 *    `_chu-thich.mjs` dùng chung — KHÔNG có bản sao thứ ba.
 *  ② **Ứng viên ≠ vi phạm.** Nếu định nghĩa ứng viên = vi phạm thì sửa xong ra "0 ứng viên",
 *    và **phép đo cho ra 0 ứng viên là phép đo HỎNG** (bài học F-NHAN-BIA lượt hai). Nên máy in
 *    **hai số**: bao nhiêu chỗ có `leading-*`/cỡ nhỏ (ỨNG VIÊN) và bao nhiêu trong đó thật sự
 *    áp lên chữ CÓ DẤU (VI PHẠM). Ứng viên tụt về 0 là dấu hiệu thước gãy, phải điều tra.
 *
 * ĐIỀU KIỆN CỐT LÕI: chỉ tính vi phạm khi thuộc tính đó áp lên **chuỗi CÓ DẤU**.
 * `leading-tight` trên `"BOQ"` · `"3D"` · `"A3"` là **HỢP LỆ** (V-7: không dấu ⇒ chữ kỹ thuật).
 *
 * Chạy:  node scripts/soi-chu-viet.mjs          → báo cáo
 *        node scripts/soi-chu-viet.mjs --chan   → exit 1 khi vượt trần
 *        node scripts/soi-chu-viet.mjs --het    → in đủ, không cắt danh sách
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { boChuThich } from './_chu-thich.mjs';

/* ── TRẦN BÁNH CÓC ─────────────────────────────────────────────────────────────────────────────
 * Cùng khuôn `soi-kho-tai-lieu.mjs`: chỉ được GIẢM. Đang có worker sửa song song nên số sẽ tụt —
 * đó là điều tốt; cấm TĂNG. Ưu tiên đọc khoá `T-CHU-VIET` trong `scripts/foundation-tran.json`
 * (nơi mọi trần khác sống); chưa có khoá thì dùng số dưới đây.
 * ⛔ CẤM nới trần để qua cổng — nới lên là tháo ngòi dây bẫy (M-52). */
const TRAN_MAC_DINH = 850;

const REPO = process.cwd();
const VUNG = ['app', 'components'];
const BO = new Set(['node_modules', '.git', '.next', '.claude', 'worktrees', '.worktrees']);

/* ── "CÓ DẤU" là gì ────────────────────────────────────────────────────────────────────────────
 * Nguyên âm mang dấu phụ Latin-1 / Extended-A (`à â ê ô ù ý ă đ ĩ ũ ơ ư`) + toàn khối
 * **Latin Extended Additional U+1EA0–U+1EF9** (nơi chứa mọi tổ hợp hai tầng dấu của tiếng Việt),
 * + dấu thanh rời U+0300–U+0323 (chuỗi ở dạng NFD). */
const CO_DAU =
  /[À-ÅÈ-ÏÒ-ÖÙ-Ýà-åè-ïò-öù-ýĂăĐđĨĩŨũƠơƯưẠ-ỹ̀-̣̃̉]/;

function quet(dir, ra = []) {
  if (!existsSync(dir)) return ra;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (BO.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) quet(p, ra);
    else if (/\.(tsx|ts|jsx|js)$/.test(e.name)) ra.push(p);
  }
  return ra;
}

/* ── LẤY VÙNG CHỮ mà thuộc tính này áp lên ─────────────────────────────────────────────────────
 * Từ vị trí khớp, lùi về thẻ JSX đang mở, rồi đi xuống **tối đa 2 lớp con**. Sâu hơn 2 lớp thì
 * bỏ qua: chữ ở đó thường thuộc một thẻ khác đã mang class riêng của nó, tính vào đây là báo oan.
 */
function vungChu(src, i) {
  // ① lùi tìm `<` mở thẻ (theo sau là chữ cái hoặc `>` của fragment)
  let mo = i;
  for (;;) {
    mo = src.lastIndexOf('<', mo - 1);
    if (mo < 0) return '';
    if (/[A-Za-z]/.test(src[mo + 1] || '')) break;
    if (mo === 0) return '';
  }
  // ② tìm `>` đóng thẻ mở, bỏ qua `>` nằm trong chuỗi hoặc trong `{...}`
  let j = mo, nhay = null, ngoac = 0, gt = -1;
  while (j < src.length && j < mo + 4000) {
    const c = src[j];
    if (nhay) { if (c === nhay && src[j - 1] !== '\\') nhay = null; }
    else if (c === '"' || c === "'" || c === '`') nhay = c;
    else if (c === '{') ngoac++;
    else if (c === '}') ngoac--;
    else if (c === '>' && ngoac === 0) { gt = j; break; }
    j++;
  }
  if (gt < 0) return src.slice(mo, Math.min(src.length, mo + 400));
  const theMo = src.slice(mo, gt + 1);
  if (src[gt - 1] === '/') return theMo; // thẻ tự đóng: chữ chỉ có thể nằm trong thuộc tính

  // ③ đi xuống tối đa 2 lớp, gom chữ ở lớp 0–2
  let k = gt + 1, sau = 0, gom = '';
  nhay = null;
  while (k < src.length && k < gt + 6000) {
    const c = src[k];
    if (nhay) { if (sau <= 2) gom += c; if (c === nhay && src[k - 1] !== '\\') nhay = null; k++; continue; }
    if (c === '<') {
      if (src[k + 1] === '/') {
        if (sau === 0) break;          // thẻ đóng của chính phần tử này
        sau--;
        k = src.indexOf('>', k); if (k < 0) break; k++; continue;
      }
      if (/[A-Za-z]/.test(src[k + 1] || '')) {
        const dong = src.indexOf('>', k);
        if (dong < 0) break;
        if (src[dong - 1] !== '/') sau++; // thẻ tự đóng không tạo lớp mới
        if (sau <= 2) gom += src.slice(k, dong + 1);
        k = dong + 1; continue;
      }
    }
    if (c === '"' || c === "'" || c === '`') { nhay = c; if (sau <= 2) gom += c; k++; continue; }
    if (sau <= 2) gom += c;
    k++;
  }
  return theMo + gom;
}

/** Vùng này có chữ tiếng Việt CÓ DẤU không? */
export function coChuVietCoDau(vung) {
  return CO_DAU.test(vung);
}

/** Chuỗi className (nằm giữa cặp nháy) bao quanh vị trí `i`. */
function chuoiBaoQuanh(src, i) {
  let d = i;
  while (d > 0 && !/['"`]/.test(src[d])) d--;
  let c = i;
  while (c < src.length && !/['"`]/.test(src[c])) c++;
  return src.slice(d + 1, c);
}

/* ── LUẬT ─────────────────────────────────────────────────────────────────────────────────────
 * Mỗi luật: tìm ỨNG VIÊN, rồi mới hỏi "có áp lên chữ có dấu không?".
 * `loc` trả về false ⇒ không phải ứng viên (vd `leading-[1.6]` là hợp lệ, không tính). */
const LUAT = [
  { ma: 'V-2', ten: 'leading-none/tight/snug', re: /\bleading-(?:none|tight|snug)\b/g },
  {
    ma: 'V-2', ten: 'leading-[x] với x < 1.5', re: /\bleading-\[([0-9.]+)\]/g,
    loc: (m) => Number(m[1]) < 1.5,
  },
  {
    ma: 'V-2', ten: 'lineHeight < 1.5', re: /lineHeight:\s*['"]?([0-9.]+)['"]?\s*[,}\n]/g,
    loc: (m) => Number(m[1]) > 0 && Number(m[1]) < 1.5,
  },
  {
    /* ⭐ Ổ NẶNG NHẤT. `text-xs` Tailwind = 12px/16px = **1.333** — dưới sàn 1.5. Chỉ hợp lệ khi
     * có `leading-*` ghi đè TRONG CÙNG chuỗi class. Đây là bẫy im lặng: không ai gõ "1.333". */
    ma: 'V-2', ten: 'text-xs (line-height 1.333) không có leading-* ghi đè', re: /\btext-xs\b/g,
    loc: (m, src, i) => !/\bleading-/.test(chuoiBaoQuanh(src, i)),
  },
  { ma: 'V-3', ten: 'tracking-tight/tighter', re: /\btracking-(?:tight|tighter)\b/g },
  { ma: 'V-3', ten: 'tracking-[âm]', re: /\btracking-\[-[0-9.]/g },
  { ma: 'V-3', ten: 'letterSpacing âm', re: /letterSpacing:\s*['"`]?-[0-9.]/g },
  {
    ma: 'V-6', ten: 'text-[Npx] với N < 12', re: /\btext-\[([0-9.]+)px\]/g,
    loc: (m) => Number(m[1]) < 12,
  },
  {
    ma: 'V-6', ten: 'fontSize < 12', re: /fontSize:\s*['"]?([0-9.]+)(?:px)?['"]?\s*[,}\n]/g,
    loc: (m) => Number(m[1]) > 0 && Number(m[1]) < 12,
  },
  {
    /* Biến đã biết giá trị (xác minh trong `app/globals.css` 29/08):
     * `--fs-xs` = 12px (ĐẠT sàn, không tính) · `--fs-2xs` = **11px** (dưới sàn) · `--fs-ui` = 13px.
     * `--fs-3xs` nêu trong đề bài **KHÔNG tồn tại** trong globals.css — không bịa ra luật cho nó. */
    ma: 'V-6', ten: '--fs-2xs (11px)', re: /--fs-2xs\)/g,
  },
];

/** Soi MỘT tệp nguồn. Trả về { ungVien: [], viPham: [] }. Xuất ra để tệp test dùng lại. */
export function soiNguon(src, ten = '(bộ nhớ)') {
  const sach = boChuThich(src); // ① chú thích KHÔNG phải mã — dùng chung, không sao chép
  const ungVien = [], viPham = [];
  for (const l of LUAT) {
    l.re.lastIndex = 0;
    let m;
    while ((m = l.re.exec(sach))) {
      if (l.loc && !l.loc(m, sach, m.index)) continue;
      const dong = sach.slice(0, m.index).split('\n').length;
      const vung = vungChu(sach, m.index);
      const ghi = { ma: l.ma, ten: l.ten, tep: ten, dong, khop: m[0].trim() };
      ungVien.push(ghi);
      if (coChuVietCoDau(vung)) viPham.push(ghi); // ② ứng viên ≠ vi phạm
    }
  }
  return { ungVien, viPham };
}

/* ── CHẠY ─────────────────────────────────────────────────────────────────────────────────── */
const laChinh = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (laChinh) {
  const chan = process.argv.includes('--chan');
  const het = process.argv.includes('--het');
  const tep = VUNG.flatMap((v) => quet(path.join(REPO, v)));

  const ungVien = [], viPham = [];
  for (const t of tep) {
    let src; try { src = readFileSync(t, 'utf8'); } catch { continue; }
    const r = soiNguon(src, path.relative(REPO, t));
    ungVien.push(...r.ungVien); viPham.push(...r.viPham);
  }

  const dem = (ds, ma) => ds.filter((x) => x.ma === ma).length;
  console.log('SOI CHỮ VIỆT · V-2 line-height · V-3 letter-spacing · V-6 cỡ sàn');
  console.log(`quét ${tep.length} tệp trong app/ + components/ — chú thích đã bị loại trước khi soi\n`);
  console.log('                    ỨNG VIÊN   VI PHẠM   (vi phạm = áp lên chuỗi CÓ DẤU)');
  for (const ma of ['V-2', 'V-3', 'V-6']) {
    console.log(`  ${ma}  ${String(dem(ungVien, ma)).padStart(18)}${String(dem(viPham, ma)).padStart(10)}`);
  }
  console.log(`  ────────────────────────────────────────`);
  console.log(`  TỔNG${String(ungVien.length).padStart(18)}${String(viPham.length).padStart(10)}`);

  if (!ungVien.length) {
    console.log('\n🟠 0 ỨNG VIÊN — nghi THƯỚC GÃY, không phải "sạch".');
    console.log('   Không thể có chuyện cả app/ + components/ không còn một chỗ nào dùng leading-*/cỡ nhỏ.');
    console.log('   Điều tra máy soi trước khi tin con số này (bài học F-NHAN-BIA lượt hai).');
  }

  // gom theo tệp để người sửa đi một lượt
  const theoTep = new Map();
  for (const v of viPham) { if (!theoTep.has(v.tep)) theoTep.set(v.tep, []); theoTep.get(v.tep).push(v); }
  const xep = [...theoTep.entries()].sort((a, b) => b[1].length - a[1].length);
  console.log(`\n── VI PHẠM theo tệp (${theoTep.size} tệp) ──`);
  for (const [t, ds] of het ? xep : xep.slice(0, 15)) {
    console.log(`  ${String(ds.length).padStart(3)}×  ${t}`);
    for (const v of (het ? ds : ds.slice(0, 4))) console.log(`         :${v.dong}  ${v.ma}  ${v.khop}  — ${v.ten}`);
    if (!het && ds.length > 4) console.log(`         … còn ${ds.length - 4} (chạy --het để xem đủ)`);
  }
  if (!het && xep.length > 15) console.log(`  … còn ${xep.length - 15} tệp (chạy --het)`);

  /* ── CẢNH BÁO, KHÔNG CHẶN: CSS thuần ────────────────────────────────────────────────────────
   * `line-height`/`letter-spacing`/`font-size` trong `.css` cũng vi phạm được, nhưng phân tích
   * tĩnh KHÔNG biết selector đó rơi vào chữ nào — không có cách nối luật với chuỗi có dấu.
   * In ra để người biết, KHÔNG tính vào bánh cóc: đếm thứ mình không chứng minh được là PASS giả. */
  const css = ['app/globals.css'].map((f) => path.join(REPO, f)).filter(existsSync);
  const nhacCss = [];
  for (const f of css) {
    const s = boChuThich(readFileSync(f, 'utf8'));
    for (const re of [/line-height:\s*(0?\.[0-9]+|1\.[0-4][0-9]*)\s*[;\n]/g, /letter-spacing:\s*-[0-9.]/g, /font-size:\s*([0-9.]+)px/g]) {
      let m; re.lastIndex = 0;
      while ((m = re.exec(s))) {
        if (/font-size/.test(m[0]) && Number(m[1]) >= 12) continue;
        nhacCss.push(`${path.relative(REPO, f)}:${s.slice(0, m.index).split('\n').length}  ${m[0].trim()}`);
      }
    }
  }
  console.log(`\n── ⚠️ CẢNH BÁO (KHÔNG chặn): ${nhacCss.length} chỗ trong CSS thuần ──`);
  console.log('   Không nối được selector với chuỗi có dấu ⇒ không chứng minh được ⇒ không tính vào trần.');
  for (const n of nhacCss.slice(0, het ? 999 : 6)) console.log(`   ${n}`);

  /* ── BÁNH CÓC ─────────────────────────────────────────────────────────────────────────────── */
  let tran = TRAN_MAC_DINH;
  const tranTep = path.join(REPO, 'scripts/foundation-tran.json');
  if (existsSync(tranTep)) {
    try {
      const j = JSON.parse(readFileSync(tranTep, 'utf8'));
      if (typeof j['T-CHU-VIET'] === 'number') tran = j['T-CHU-VIET'];
    } catch { /* giữ trần mặc định trong tệp này */ }
  }
  console.log(`\nBÁNH CÓC CHỮ VIỆT  ${viPham.length} / trần ${tran}`);
  if (viPham.length > tran) {
    console.log(`🔴 VƯỢT TRẦN ${viPham.length - tran} — có chữ Việt MỚI bị ép chiều cao/bề ngang/cỡ.`);
    console.log('   Sửa mã, đừng nới trần. ⛔ Nới lên là tháo ngòi dây bẫy (M-52).');
    if (chan) process.exit(1);
  } else if (viPham.length < tran) {
    console.log(`✅ Thấp hơn trần ${tran - viPham.length} — HẠ trần xuống ${viPham.length}.`);
  } else {
    console.log('✅ Đúng trần.');
  }
}
