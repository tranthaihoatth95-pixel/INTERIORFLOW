#!/usr/bin/env node
/**
 * scripts/soi-bo-cuc.mjs — MÁY SOI NHỊP LƯỚI BỐ CỤC (họ `soi:`, khuôn soi-hinh-hoc.mjs).
 *
 * Lấp lỗ §5 mảng ① của `docs/control/IF-CHUAN-NEN.md` (*"Bố cục — lưới, tỉ lệ khung, thứ bậc
 * thị giác"*, lệnh kiểm ra **0**). Chuẩn + ngưỡng + nguồn: `docs/control/IF-CHUAN-BO-CUC.md`.
 *
 * ── SOI CÁI GÌ, VÀ VÌ SAO CHỈ CÁI ĐÓ ────────────────────────────────────────────────────────
 * ⭐ BC-1 · NHỊP LƯỚI 4px — mọi KHOẢNG CÁCH gõ cứng phải là bội số của 4.
 *    Nguồn: Material Design đặt mọi thành phần lên **lưới nền 8dp**, phần tử nhỏ và chữ lên
 *    **lưới 4dp** (m1.material.io/layout/responsive-ui · Android Design "Metrics & Grids").
 *    Đây KHÔNG phải chuyện gọn mắt: lưới là thứ làm cho hai khối **rời nhau vẫn thẳng hàng**,
 *    và thẳng hàng là kênh mà mắt dùng để đọc "cái này thuộc nhóm kia" (Gestalt · liên tục).
 *    Token của IF ĐÃ nằm trọn trên lưới 4 (`--gap:8 · --pad-card:8/12 · --row:28 · --tap:32/44`)
 *    ⇒ mọi giá trị lẻ là chỗ **đi vòng qua token**, không phải một lựa chọn thiết kế.
 *
 * ⭐ BC-2 · ĐỘ DÀI DÒNG — `max-width` khai bằng `ch` phải nằm trong **45–75ch**.
 *    Nguồn: Bringhurst, *The Elements of Typographic Style* §2.1.2 — *"anything from 45 to 75
 *    characters is widely regarded as a satisfactory length of line for a single-column page"*,
 *    66 ký tự là lý tưởng.
 *
 * ── VÌ SAO KHÔNG SOI NHỮNG THỨ NGHE CŨNG HỢP LÝ ─────────────────────────────────────────────
 * · **Không** soi `border-radius` — `soi:hinh-hoc` đã soi. Hai máy cùng đếm một thứ là hai con
 *   số cãi nhau, và người đọc không biết tin con nào.
 * · **Không** soi `width/height/top/left` — chúng là KÍCH THƯỚC và VỊ TRÍ, không phải NHỊP.
 *   Một ảnh 141px hay một panel 214px là con số có lý do riêng; ép chúng lên lưới 4 là bịa luật.
 * · **Không** soi giá trị < 4px — nét tóc, vạch, nhích quang học. Lưới 4 là lưới của KHOẢNG THỞ,
 *   không phải của đường kẻ. (Cùng cách `soi-hinh-hoc` chừa nấc vi mô ≤4.)
 * · **Không** soi `docs/mocks/` — kho hợp đồng thiết kế đã có bánh cóc riêng `T-MOCKS`.
 *
 * ── HAI ĐIỀU MÁY NÀY KHÔNG LÀM ĐƯỢC, KHAI THẲNG ─────────────────────────────────────────────
 * ① Nó KHÔNG chấm được **thứ bậc thị giác** (cái gì trội, cái gì nền). N-16 đã chốt máy không
 *    phán được bố cục và gu — máy này chỉ đẩy đường biên đó lùi lại đúng phần **nhịp đo được**.
 * ② Nó soi **khai báo tĩnh**. Khoảng cách do lớp Tailwind sinh ra lúc chạy, hoặc tính bằng JS,
 *    thì phải đo sống: `PORT=<cổng> node scripts/soi-mat/do-chuan-bo-cuc.mjs`.
 *
 * CHẠY:
 *   npm run soi:bo-cuc              báo cáo, exit 0
 *   npm run soi:bo-cuc -- --tran    đối chiếu bánh cóc scripts/foundation-tran.json, vượt ⇒ exit 1
 *   npm run soi:bo-cuc -- --tu-kiem chạy ca BIẾT TRƯỚC kết quả, sai ⇒ exit 3
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { boChuThich } from './_chu-thich.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const TRAN_TEP = join(ROOT, 'scripts/foundation-tran.json');
const doiTran = process.argv.includes('--tran');
const tuKiem = process.argv.includes('--tu-kiem');

/* ── LƯỚI ─────────────────────────────────────────────────────────────────────────────────────
   Bội số 4. Dưới 4 là nấc VI MÔ (nét/vạch/nhích quang học) — tha, đúng cách soi-hinh-hoc tha ≤4. */
const BUOC = 4;
const VI_MO = 4; // |v| < 4 ⇒ không xét
const trenLuoi = (v) => Math.abs(v) < VI_MO || Math.abs(v) % BUOC === 0;

/* ── ĐỘ DÀI DÒNG ─────────────────────────────────────────────────────────────────────────── */
const CH_MIN = 45, CH_MAX = 75;

/* ── VÙNG QUÉT ───────────────────────────────────────────────────────────────────────────────
   `components/` + `app/` — đúng vùng soi-hinh-hoc đã mở rộng tới 05/09.
   ⛔ TỰ LOẠI TRỪ CHÍNH MÌNH: `scripts/` không nằm trong vùng quét, nên tệp này và mọi ca thử
   trong nó KHÔNG bao giờ tự kết tội mình. Đây là ca đã trả giá 3 lần trong ngày 05/09
   (mẫu quét bắt trúng chính nó / bắt trúng chú thích của chính bản vá). */
const SCAN_DIRS = ['components', 'app'];
const EXT = new Set(['.ts', '.tsx', '.css']);
const SKIP = new Set(['node_modules', '.next', '.worktrees', '.git', 'dist', 'out', 'mocks']);

function* walk(dir) {
  let ds; try { ds = readdirSync(dir); } catch { return; }
  for (const name of ds) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    let st; try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) yield* walk(p);
    else if (EXT.has(name.slice(name.lastIndexOf('.')))) yield p;
  }
}

/* ── BA HỌ CÚ PHÁP SINH RA KHOẢNG CÁCH ────────────────────────────────────────────────────────
   Chỉ THUỘC TÍNH KHOẢNG CÁCH. `inset/top/left` cố ý KHÔNG có mặt (vị trí ≠ nhịp). */
const CSS_PROP = 'padding|margin|gap|row-gap|column-gap';
const JSX_PROP = 'padding|paddingTop|paddingBottom|paddingLeft|paddingRight|paddingBlock|paddingInline'
  + '|margin|marginTop|marginBottom|marginLeft|marginRight|gap|rowGap|columnGap';
/* Tailwind: `gap-1.5` = 6px, `px-2.5` = 10px … (1 nấc = 4px ⇒ nửa nấc = 2px, lệch lưới khi lẻ).
   `-0.5` → 2px NẰM DƯỚI ngưỡng vi mô ⇒ tha, đúng luật VI_MO ở trên. */
const TW_PRE = 'p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|gap-x|gap-y|space-x|space-y';

const HO = [
  { ten: 'css', re: new RegExp(`(?:${CSS_PROP})(?:-(?:top|right|bottom|left|block|inline))?\\s*:\\s*([^;{}\\n]+)`, 'g'),
    lay: (m) => [...m[1].matchAll(/(-?\d+(?:\.\d+)?)px/g)].map((x) => Number(x[1])) },
  { ten: 'jsx', re: new RegExp(`\\b(?:${JSX_PROP})\\s*:\\s*(-?\\d+(?:\\.\\d+)?)\\s*[,}\\n]`, 'g'),
    lay: (m) => [Number(m[1])] },
  { ten: 'tw-nua-nac', re: new RegExp(`(?:^|[\\s"'\`])-?(?:${TW_PRE})-(\\d+\\.5)\\b`, 'g'),
    lay: (m) => [Number(m[1]) * 4] },
  { ten: 'tw-tuy-y', re: new RegExp(`(?:^|[\\s"'\`])-?(?:${TW_PRE})-\\[(-?\\d+(?:\\.\\d+)?)px\\]`, 'g'),
    lay: (m) => [Number(m[1])] },
];
const RE_CH = /max-width\s*:\s*(\d+(?:\.\d+)?)ch/g;

function soiNguon(src, rel, thu) {
  const sach = boChuThich(src); // ⇒ lời kể về mã không bị kết tội như mã
  for (const { ten, re, lay } of HO) {
    re.lastIndex = 0;
    for (const m of sach.matchAll(re)) {
      for (const v of lay(m)) {
        if (!Number.isFinite(v) || v === 0) continue;
        thu.tongLuoi++;
        if (trenLuoi(v)) continue;
        thu.viPhamLuoi.push({ rel, v, ho: ten, dong: sach.slice(0, m.index).split('\n').length });
      }
    }
  }
  RE_CH.lastIndex = 0;
  for (const m of sach.matchAll(RE_CH)) {
    const ch = Number(m[1]);
    thu.tongCh++;
    if (ch < CH_MIN || ch > CH_MAX) {
      thu.viPhamCh.push({ rel, ch, dong: sach.slice(0, m.index).split('\n').length });
    }
  }
}

function thuMoi() { return { tongLuoi: 0, viPhamLuoi: [], tongCh: 0, viPhamCh: [] }; }

/* ════════════════════════════════════════════════════════════════════════════════════════════
   TỰ KIỂM — ca BIẾT TRƯỚC kết quả, khoá CẢ HAI CHIỀU.
   Chỉ hỏi "bắt được cái sai không" là nửa bộ đề: máy soi hỏng kiểu tốn kém nhất của repo này
   là **báo oan**, không phải bỏ sót. Nên mỗi luật có ca PHẢI BẮT và ca PHẢI THA.
   ════════════════════════════════════════════════════════════════════════════════════════════ */
if (tuKiem) {
  const ca = [
    // ── PHẢI BẮT ──
    ['bắt CSS padding lệch lưới', '.a{padding:10px}', 1, 0],
    ['bắt CSS gap lệch lưới', '.a{gap:6px}', 1, 0],
    ['bắt CSS margin ÂM lệch lưới', '.a{margin-top:-6px}', 1, 0],
    ['bắt JSX gap lệch lưới', 'const s={gap:14,color:1}', 1, 0],
    ['bắt Tailwind nửa nấc gap-1.5', '<div className="gap-1.5" />', 1, 0],
    ['bắt Tailwind tuỳ ý p-[10px]', '<div className="p-[10px]" />', 1, 0],
    ['bắt max-width 100ch (quá dài)', '.a{max-width:100ch}', 0, 1],
    ['bắt max-width 30ch (quá ngắn)', '.a{max-width:30ch}', 0, 1],
    // ── PHẢI THA ── (mỗi ca là một cách máy này TỪNG có thể báo oan)
    ['tha giá trị đúng lưới 8px', '.a{padding:8px}', 0, 0],
    ['tha giá trị đúng lưới 12/16', '.a{margin:12px 16px}', 0, 0],
    ['tha nấc VI MÔ 2px (nét/nhích)', '.a{gap:2px}', 0, 0],
    ['tha Tailwind gap-0.5 (=2px, vi mô)', '<div className="gap-0.5" />', 0, 0],
    ['tha số lệch nằm trong CHÚ THÍCH //', '// padding:10px là sai\n.a{padding:8px}', 0, 0],
    ['tha số lệch trong chú thích KHỐI', '/* gap:6px cũ */\n.a{gap:8px}', 0, 0],
    ['tha border-radius (việc của soi:hinh-hoc)', '.a{border-radius:10px}', 0, 0],
    ['tha width/height (kích thước ≠ nhịp)', '.a{width:141px;height:214px}', 0, 0],
    ['tha top/left (vị trí ≠ nhịp)', '.a{top:10px;left:6px}', 0, 0],
    ['tha font-size lẻ (việc của thang chữ)', '.a{font-size:13px}', 0, 0],
    ['tha max-width 66ch (Bringhurst lý tưởng)', '.a{max-width:66ch}', 0, 0],
    ['tha max-width px (không suy được ra ch)', '.a{max-width:720px}', 0, 0],
    ['tha chữ "gap-1.5" trong câu văn thường', 'Ghi chú ở đây nói gap-1.5 nhưng không phải class', 1, 0],
  ];
  let truot = 0;
  console.log('\nTỰ KIỂM soi:bo-cuc — ca biết trước kết quả');
  console.log('─'.repeat(86));
  for (const [ten, src, mongLuoi, mongCh] of ca) {
    const t = thuMoi();
    soiNguon(src, '«ao».tsx', t);
    const ok = t.viPhamLuoi.length === mongLuoi && t.viPhamCh.length === mongCh;
    if (!ok) truot++;
    console.log(`${ok ? '✅' : '🔴'} ${ten.padEnd(46)} lưới ${t.viPhamLuoi.length}/${mongLuoi} · ch ${t.viPhamCh.length}/${mongCh}`);
  }
  console.log('─'.repeat(86));
  /* ⚠️ Ca cuối CỐ Ý mong 1: máy soi văn bản KHÔNG phân biệt được `gap-1.5` viết trong câu tiếng
     Việt với `gap-1.5` là class. Khai thẳng giới hạn thay vì giả vờ không có — vùng quét chỉ có
     `.ts/.tsx/.css` nên rủi ro thấp, nhưng nó CÓ THẬT. */
  console.log('Ghi chú: ca cuối mong 1 là GIỚI HẠN ĐÃ BIẾT, không phải lỗi — xem chú thích trong mã.');
  if (truot) { console.log(`🔴 TỰ KIỂM TRƯỢT — ${truot} ca không đạt.\n`); process.exitCode = 3; }
  else console.log(`✅ TỰ KIỂM ĐẠT — ${ca.length}/${ca.length} ca đúng cả hai chiều.\n`);
} else {
  /* ── SOI THẬT ─────────────────────────────────────────────────────────────────────────────── */
  const thu = thuMoi();
  const files = [];
  for (const d of SCAN_DIRS) files.push(...walk(join(ROOT, d)));
  for (const p of files) {
    let src; try { src = readFileSync(p, 'utf8'); } catch { continue; }
    soiNguon(src, relative(ROOT, p), thu);
  }

  const theoGiaTri = new Map(), theoFile = new Map(), theoHo = new Map();
  for (const v of thu.viPhamLuoi) {
    theoGiaTri.set(v.v, (theoGiaTri.get(v.v) ?? 0) + 1);
    theoFile.set(v.rel, (theoFile.get(v.rel) ?? 0) + 1);
    theoHo.set(v.ho, (theoHo.get(v.ho) ?? 0) + 1);
  }

  console.log('\nSOI BỐ CỤC · NHỊP LƯỚI — ' + new Date().toISOString().slice(0, 10));
  console.log('Chuẩn: khoảng cách gõ cứng là bội số 4px (Material 4dp/8dp) · <4px = vi mô, tha');
  console.log('       max-width theo `ch` nằm trong 45–75ch (Bringhurst §2.1.2)');
  console.log('─'.repeat(86));
  console.log(`BC-1 · NHỊP LƯỚI 4px   ${thu.viPhamLuoi.length} lệch / ${thu.tongLuoi} khoảng cách đã xét`);
  if (theoHo.size) {
    console.log('   theo họ cú pháp: ' + [...theoHo.entries()].sort((a, b) => b[1] - a[1])
      .map(([h, c]) => `${h}=${c}`).join(' · '));
  }
  if (theoGiaTri.size) {
    console.log('   giá trị lệch hay gặp: ' + [...theoGiaTri.entries()].sort((a, b) => b[1] - a[1])
      .slice(0, 10).map(([v, c]) => `${v}px×${c}`).join(' · '));
    console.log('   top tệp:');
    for (const [f, c] of [...theoFile.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)) {
      console.log(`      ${String(c).padStart(4)}  ${f}`);
    }
  }
  console.log(`BC-2 · ĐỘ DÀI DÒNG     ${thu.viPhamCh.length} lệch / ${thu.tongCh} khai báo max-width theo ch`);
  for (const v of thu.viPhamCh.slice(0, 10)) console.log(`      ${v.ch}ch  ${v.rel}:${v.dong}`);
  console.log('─'.repeat(86));
  console.log(`Đã quét ${files.length} tệp.`);

  if (doiTran) {
    let tran;
    try { tran = JSON.parse(readFileSync(TRAN_TEP, 'utf8')); }
    catch { console.log(`🟠 KHÔNG ĐỌC ĐƯỢC TRẦN: ${TRAN_TEP}\n`); process.exitCode = 2; }
    if (tran) {
      let vuot = 0;
      for (const [khoa, so] of [['BC-LUOI-4', thu.viPhamLuoi.length], ['BC-DO-DAI-DONG', thu.viPhamCh.length]]) {
        const t = tran[khoa];
        if (typeof t !== 'number') { console.log(`🟠 CHƯA CÓ TRẦN cho ${khoa} — mở sổ ở ${so}`); continue; }
        const dau = so > t ? '🔴' : so < t ? '🟢' : '✅';
        console.log(`${dau} ${khoa.padEnd(16)} ${so} / trần ${t}`);
        if (so > t) vuot++;
      }
      if (vuot) {
        console.log(`\n🔴 CỔNG ĐỎ — ${vuot} họ vượt trần. Sửa mã, đừng sửa trần (M-52).\n`);
        process.exitCode = 1;
      } else { console.log('\n✅ Trong trần.\n'); }
    }
  } else {
    console.log('(báo cáo — thêm `-- --tran` để đối chiếu bánh cóc)\n');
  }
}

/* 🔴 `process.exitCode` CHỨ KHÔNG `process.exit()` — đo được 05/09: khi stdout là pipe,
   `process.exit()` vứt hàng đợi ghi chưa xả và làm MẤT ~45% báo cáo. Mã thoát vẫn đúng,
   chữ thì mất — tức máy soi im lặng đúng lúc người ta cần đọc nó nhất. */
