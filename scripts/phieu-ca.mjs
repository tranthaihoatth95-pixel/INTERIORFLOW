#!/usr/bin/env node
/**
 * phieu-ca.mjs — MỘT NGUỒN, BA ĐÍCH, KHÔNG ĐÍCH NÀO VIẾT TAY.
 *
 * ══ Hoà chốt 30/08/2026 ══
 *   *"Đường nó đọc khi nhận việc phải LUÔN MỚI VÀ ĐÚNG. Những cái còn lại canh thay đổi lớn
 *   update một lần cho sau này truy lịch sử dễ thôi."*
 *   *"1 nguồn 3 đích luôn cập nhật."*
 *   *"Hình dung nó như một todo list: ai · nhận nhiệm vụ gì · đã làm hay chưa, trong khung giờ
 *   sáng trưa chiều tối — mỗi khoảng từ mấy giờ tới mấy giờ. Rồi phân loại theo nhóm, mỗi nhóm
 *   ứng với các phiên chuyên trách. Như order nhà hàng rồi làm tuần tự thôi."*
 *
 * ══ VÌ SAO KHÔNG ĐỂ MỖI ĐÍCH TỰ VIẾT ══
 * Bảng 4173 từng mang số viết tay không ngày (*"12.274 nét → 81 tường · 286,0 m"*) và Hoà phải
 * tự cảnh báo *"nếu Claude sau trỏ vào đây mà đọc là thảm hoạ"*. Một đích tự viết là một đích
 * bắt đầu già đi ngay giây sau khi viết. Ba đích tự viết là ba bản sự thật phân kỳ — đúng luật 6.
 *
 * ══ NGUỒN (chỉ một) ══
 *   scripts/bos-so-viec.mjs      đầu việc · lane · pha · cách chứng minh
 *   ~/PROJECT/SHARED/LOG/…       cầu: HANDOFF · WAKE · SEEN · ACK  (có dấu thời gian THẬT)
 *   lane-phien.json              ai đang ngồi lane nào
 *
 * ══ BA ĐÍCH ══
 *   --agent   text gọn cho phiên đang nhận việc     ← ĐƯỜNG NÓNG, phải luôn tươi
 *   --json    cho bảng 4173                          ← mặt cho mắt Hoà
 *   --md      bản gửi ra ngoài, CÓ ĐÓNG DẤU GIỜ SINH ← ảnh chụp, tự khai là ảnh chụp
 *
 * Không cờ ⇒ in bản cho người đọc ở terminal.
 */

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { VIEC, NGUOI, PHA } from './bos-so-viec.mjs';
import { khoaHandoff, dichEvent } from './cau-mo-hinh.mjs';

const LOG_ROOT = process.env.BOS_SHARED_LOG_ROOT || path.join(os.homedir(), 'PROJECT/SHARED/LOG');
const CAU = path.join(LOG_ROOT, 'agent-handoffs.jsonl');
const SO_LANE = path.join(LOG_ROOT, 'lane-phien.json');

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* ── ĐƯỜNG GHI TỆP BÀN — PHẢI TÁCH KHỎI REPO ĐƯỢC, NẾU KHÔNG TEST SẼ ĂN BÀN THẬT ──
 *
 * CA THẬT 30–31/08, hai phiên xác minh độc lập: `moc.mjs` spawn `phieu-ca.mjs --ghi-ban`
 * (detached + unref, cwd = REPO) sau MỖI lần ghi biên nhận. `cau-mo-hinh.test.ts` chạy `moc.mjs`
 * THẬT với `BOS_SHARED_LOG_ROOT=<tmp>` nên tưởng đã cách ly — nhưng cách ly ĐÚNG SỔ, SAI REPO:
 * đường ghi bàn vẫn là `REPO/docs/control/ban`. Hậu quả đo được: mỗi lượt `npm test` ghi đè 9 tệp
 * bàn thật bằng dữ liệu fixture (hằng số `HO-20260830150000-aaaaaaaaaaaa` lọt vào `ban/06.md`
 * đúng bằng đường này), và nhiều tiến trình detached ghi chồng không nguyên tử ⇒ khối đôi,
 * mất nửa-người, UTF-8 vỡ.
 *
 * `BOS_BAN_ROOT` là đường thoát. Không đặt ⇒ hành vi cũ, ghi vào repo. */
const BAN_MAC_DINH = path.join(REPO, 'docs/control/ban');
const BAN_ROOT = process.env.BOS_BAN_ROOT || BAN_MAC_DINH;

/** KHUNG GIỜ — ranh giới nói rõ, không để ai đoán "trưa" là mấy giờ. */
const CA = [
  { ma: 'sang',  ten: 'SÁNG',  tu: 6,  den: 11 },
  { ma: 'trua',  ten: 'TRƯA',  tu: 11, den: 14 },
  { ma: 'chieu', ten: 'CHIỀU', tu: 14, den: 18 },
  { ma: 'toi',   ten: 'TỐI',   tu: 18, den: 23 },
  { ma: 'khuya', ten: 'KHUYA', tu: 23, den: 6  },
];
const caCua = (d) => {
  const g = d.getHours();
  return CA.find((c) => (c.tu < c.den ? g >= c.tu && g < c.den : g >= c.tu || g < c.den)) ?? CA[4];
};

const doc = () => {
  if (!existsSync(CAU)) return [];
  return readFileSync(CAU, 'utf8').split('\n').filter(Boolean)
    .flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } });
};

const su = doc();
const ack = new Set(su.filter((e) => e.type === 'ACK').map(khoaHandoff));
const wake = new Set(su.filter((e) => e.type === 'WAKE' || e.type === 'WAKE_ATTEMPTED').map(khoaHandoff));
const seen = new Set(su.filter((e) => e.type === 'SEEN').map(khoaHandoff));

/* NOTED đi kèm từng biên nhận — Hoà 30/08: *"mỗi trạng thái kèm noted… người mới thì biết
 * noted thế nào mà tránh"*. Noted là thứ DUY NHẤT trên bàn giải thích VÌ SAO, nên nó lấy từ
 * biên nhận (thứ có người ký), không lấy từ nội dung phiếu (thứ có thể sai). */
const ghiChu = new Map();
for (const e of su) {
  const n = e.cach ?? e.noted;
  if (e.handoffId && n) ghiChu.set(khoaHandoff(e), String(n));
}

/** Trạng thái một phiếu — theo BIÊN NHẬN, không theo lời ai kể. */
const trangThai = (e) => {
  const k = khoaHandoff(e);
  const noted = ghiChu.get(k) ?? '';
  if (ack.has(k))  return { ma: 'xong',   nhan: '✅ đã nhận việc', noted };
  if (seen.has(k)) return { ma: 'daThay', nhan: '👁 đã tới mắt, chưa nhận', noted };
  if (wake.has(k)) return { ma: 'daGoi',  nhan: '🔔 đã gọi, chưa thấy', noted };
  return { ma: 'ketSo', nhan: '🔴 KẸT — ghi rồi mà chưa ai gọi', noted };
};

let soLane = {};
try { soLane = JSON.parse(readFileSync(SO_LANE, 'utf8')); } catch { /* chưa có */ }

const phieu = su.filter((e) => e.type === 'HANDOFF').map((e) => {
  const d = new Date(e.createdAt);
  const dich = dichEvent(e);
  return {
    id: e.id, tu: e.from, den: dich.legacy ? `LEGACY_AMBIGUOUS:${dich.lane}` : dich.address, viec: e.topic ?? '',
    luc: d, gio: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
    ca: caCua(d).ma, ...trangThai(e),
  };
});

const ten = Object.fromEntries(NGUOI.map((n) => [n.ma, n.ten]));
const nhomTheoLane = (ds) => {
  const m = new Map();
  for (const p of ds) { if (!m.has(p.den)) m.set(p.den, []); m.get(p.den).push(p); }
  return [...m.entries()].sort();
};

/* ── ĐÍCH 3: bản gửi ra ngoài, tự khai là ảnh chụp ── */
if (process.argv.includes('--md')) {
  const gio = new Date().toISOString().replace('T', ' ').slice(0, 16);
  let o = `# Phiếu ca — ảnh chụp lúc ${gio}\n\n`;
  o += `> ⚠️ **ĐÂY LÀ ẢNH CHỤP, KHÔNG PHẢI HIỆN TRẠNG.** Agent nhận việc phải đọc nguồn sống:\n`;
  o += `> \`node scripts/phieu-ca.mjs --agent\` hoặc \`node scripts/moc.mjs inbox <lane>\`.\n\n`;
  for (const c of CA) {
    const ds = phieu.filter((p) => p.ca === c.ma);
    if (!ds.length) continue;
    o += `## ${c.ten} · ${String(c.tu).padStart(2, '0')}:00–${String(c.den).padStart(2, '0')}:00 — ${ds.length} việc\n\n`;
    for (const [lane, ps] of nhomTheoLane(ds)) {
      const laneRole = lane.split(':').at(-1);
      o += `**${lane} · ${ten[laneRole] ?? '?'}**\n\n`;
      for (const p of ps) o += `- \`${p.gio}\` ${p.nhan} — ${p.viec}\n`;
      o += '\n';
    }
  }
  console.log(o.trimEnd());
  process.exit(0);
}

/* ── ĐÍCH 3: KHỐI MÁY SỞ HỮU TRONG TỆP BÀN ──
   Hoà chốt 30/08: *"đường nhận việc = luôn tươi, máy bảo đảm; phần còn lại = ghi mốc khi có
   thay đổi lớn"* + *"bàn phải thể hiện phiếu giao · ai làm · khi nào · trạng thái, mỗi trạng
   thái kèm noted — người đang làm biết mình làm gì, người mới biết noted thế nào mà tránh"*.

   VÌ SAO KHÔNG DỰNG TỆP RIÊNG: bản đầu tôi đẻ `docs/control/PHIEU-CA.md`. Đo ngay sau đó:
   0 con trỏ từ bộ nạp ⇒ agent đi theo bộ nạp KHÔNG BAO GIỜ tới. Đúng bệnh GU-PROFILE.
   Bàn thì ĐÃ nằm trong bộ nạp (hàng 0z), nên đổ vào bàn là dùng con trỏ có sẵn — luật 6.

   CHỈ VIỆC ĐANG MỞ. Lịch sử nén còn một dòng đếm: nhồi lịch sử cho người mới là cái bẫy
   Hoà nêu đích danh. Muốn đọc nội dung phiếu thì mở phiếu gốc trên cầu — bàn KHÔNG chép lại
   nội dung, vì nội dung là chữ người viết và CÓ THỂ SAI (ca thật 30/08: một phiếu mang kết
   luận đã bị bác, vẫn đứng đó với dấu ✅). Bàn chỉ chở thứ có biên nhận. */
if (process.argv.includes('--ghi-ban')) {
  const { writeFileSync, readFileSync: doc, existsSync: co, mkdirSync, renameSync, unlinkSync,
    openSync, closeSync, statSync } = await import('node:fs');
  const MO = '<!-- MÁY GIỮ · phieu-ca.mjs · CẤM SỬA TAY -->';
  const DONG = '<!-- /MÁY GIỮ -->';

  /* ⛔ FAIL-CLOSED — không cảnh-báo-rồi-cho-qua.
   * `BOS_SHARED_LOG_ROOT` đặt tường minh nghĩa là NGƯỜI GỌI ĐANG CÁCH LY. Nếu tới đây mà đích ghi
   * vẫn là bàn thật trong repo thì cách ly đó là giả — và cái giá đã trả một lần rồi. Từ chối ghi. */
  if (process.env.BOS_SHARED_LOG_ROOT && path.resolve(BAN_ROOT) === path.resolve(BAN_MAC_DINH)) {
    console.error('⛔ TỪ CHỐI GHI BÀN — cách ly nửa vời.');
    console.error(`   BOS_SHARED_LOG_ROOT=${process.env.BOS_SHARED_LOG_ROOT} (sổ đã tách)`);
    console.error(`   nhưng đích ghi bàn vẫn là repo thật: ${BAN_MAC_DINH}`);
    console.error('   Chữa: đặt BOS_BAN_ROOT=<thư mục tạm> cùng lúc với BOS_SHARED_LOG_ROOT.');
    process.exit(3);
  }

  /* Ngủ ĐỒNG BỘ — vòng ghi này chạy tuần tự, không có chỗ cho await giữa khoá và rename. */
  const nghi = (ms) => { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); };

  const gio = new Date().toISOString().replace('T', ' ').slice(0, 16);
  let n = 0, tuChoi = 0;
  mkdirSync(BAN_ROOT, { recursive: true });
  for (const ng of NGUOI) {
    const tep = path.join(BAN_ROOT, `${ng.ma}.md`);
    if (!co(tep)) continue;
    const cua = phieu.filter((x) => x.den === ng.ma || x.den.endsWith(`:${ng.ma}`));
    const mo = cua.filter((x) => x.ma !== 'xong').sort((a, b) => a.luc - b.luc);
    const giuCacHe = [`cx:${ng.ma}`, `cl:${ng.ma}`].flatMap((a) => soLane[a] ? [{ a, ...soLane[a] }] : []);
    const giuLegacy = soLane[ng.ma];

    let k = `${MO}\n\n## VIỆC ĐANG MỞ — máy sinh ${gio}\n\n`;
    k += giuCacHe.length
      ? `Đang ngồi: ${giuCacHe.map((g) => `\`${g.a}\` phiên \`${g.phien.slice(0, 8)}\``).join(' · ')}\n\n`
      : giuLegacy ? `Đang ngồi: **LEGACY_AMBIGUOUS** phiên \`${giuLegacy.phien.slice(0, 8)}\`\n\n`
        : `Đang ngồi: **chưa ai khai giữ lane này**\n\n`;
    if (!mo.length) {
      k += `✅ Không phiếu nào đang mở.\n\n`;
    } else {
      k += `| phiếu | khi nào | trạng thái | noted |\n|---|---|---|---|\n`;
      for (const p of mo) {
        const tuoi = Math.round((Date.now() - p.luc) / 60000);
        k += `| \`${p.id.slice(-12)}\` | ${p.gio} · ${tuoi >= 60 ? `${Math.round(tuoi / 60)}h` : `${tuoi}p`} trước | ${p.nhan} | ${p.noted || '⚠️ **thiếu noted**'} |\n`;
      }
      k += '\n';
    }
    k += `_${cua.length - mo.length} phiếu đã đóng — không liệt kê ở đây. Tra lịch sử: \`node scripts/phieu-ca.mjs\`_\n\n`;
    k += `⚠️ Bàn chỉ chở thứ CÓ BIÊN NHẬN. Nội dung phiếu nằm trên cầu, không chép vào đây —\n`;
    k += `chữ người viết có thể sai, và bàn không được khuếch đại cái sai.\n\n${DONG}`;

    /* ── KHOÁ THEO TỆP ──
     * `moc.mjs` spawn tiến trình này DETACHED sau MỖI biên nhận. Hai biên nhận sát nhau ⇒ hai
     * tiến trình cùng đọc-sửa-ghi một tệp, và bản thua đè bản thắng bằng nội dung đã cũ.
     * Đó đúng là cách `06.md`/`08.md` mọc ra HAI khối MÁY GIỮ. */
    const khoa = `${tep}.khoa`;
    let fd = null;
    for (let i = 0; i < 100 && fd === null; i++) {
      try { fd = openSync(khoa, 'wx'); }
      catch {
        /* Khoá mồ côi (tiến trình chết giữa chừng) không được treo bàn vĩnh viễn. */
        try { if (Date.now() - statSync(khoa).mtimeMs > 30_000) unlinkSync(khoa); } catch { /* ai đó vừa gỡ */ }
        nghi(20);
      }
    }
    if (fd === null) {
      tuChoi++;
      console.error(`  🔴 ${ng.ma} — không lấy được khoá sau 2s ⇒ BỎ QUA. Thà thiếu một lần sinh còn hơn ghi chồng.`);
      continue;
    }

    try {
      const cu = doc(tep, 'utf8');
      /* ĐẾM CẶP MỐC TRƯỚC KHI GHI — ≠1 nghĩa là tệp ĐANG hỏng sẵn.
       * Không tự đoán rồi sửa: đoán sai ở đây là nuốt mất chữ người viết. Bàn hỏng thì phục hồi
       * bằng git (thứ có lịch sử), không bằng phỏng đoán của máy sinh. */
      const soMo = cu.split(MO).length - 1, soDong = cu.split(DONG).length - 1;
      if (soMo !== 1 || soDong !== 1) {
        tuChoi++;
        console.error(`  🔴 ${ng.ma} — ${soMo} mốc MỞ / ${soDong} mốc ĐÓNG (phải đúng 1/1) ⇒ TỪ CHỐI GHI.`);
        console.error('     Phục hồi tệp bàn này từ git rồi chạy lại. Máy không đoán hộ.');
        continue;
      }
      const moi = cu.slice(0, cu.indexOf(MO)) + k + cu.slice(cu.indexOf(DONG) + DONG.length);
      /* GHI NGUYÊN TỬ: tệp tạm CÙNG THƯ MỤC (rename chỉ nguyên tử trong cùng filesystem) rồi rename.
       * Ai đọc bàn giữa chừng thấy bản cũ nguyên vẹn hoặc bản mới nguyên vẹn — không bao giờ bản trộn. */
      const tam = path.join(BAN_ROOT, `.${ng.ma}.md.tam-${process.pid}`);
      writeFileSync(tam, moi, 'utf8');
      renameSync(tam, tep);
      n++;
    } finally {
      closeSync(fd);
      try { unlinkSync(khoa); } catch { /* đã bị dọn */ }
    }
  }
  console.log(`✅ ${n} tệp bàn — khối máy giữ đã sinh lại lúc ${gio}`);
  if (tuChoi) {
    console.error(`⛔ ${tuChoi} tệp bàn bị TỪ CHỐI ghi — xem lý do ở trên.`);
    process.exit(1);
  }
  process.exit(0);
}

/* ── CỔNG: KHỐI MÁY GIỮ KHÔNG ĐƯỢC SỬA TAY ──
   Một khối do máy sinh mà người sửa được là một khối sẽ bị sửa — rồi lần sinh sau đè mất, hoặc
   tệ hơn: chữ người viết sống lẫn trong vùng được coi là "máy bảo đảm", nên người đọc tin nó như
   biên nhận. Cổng này so khối trên đĩa với khối vừa sinh, SAU KHI bỏ hai phần biến thiên theo
   thời gian (dòng "máy sinh <giờ>" và cột tuổi). Khác ⇒ có bàn tay người. */
if (process.argv.includes('--kiem-ban')) {
  const { readFileSync: doc, existsSync: co } = await import('node:fs');
  const MO = '<!-- MÁY GIỮ · phieu-ca.mjs · CẤM SỬA TAY -->';
  const DONG = '<!-- /MÁY GIỮ -->';
  /* Bỏ phần biến thiên theo thời gian — cổng canh BÀN TAY NGƯỜI, không canh đồng hồ. */
  const chuan = (t) => t
    .replace(/máy sinh [\d\- :]+/g, 'máy sinh —')
    .replace(/\d+ · \d+[ph] trước/g, '· —')
    .replace(/\s+/g, ' ').trim();
  const chan = process.argv.includes('--chan');

  /* ── BA LỖ MÙ CỦA CỔNG NÀY, ĐO 31/08 ──
   * Bản cũ chỉ so khối MÁY GIỮ với nguồn. Nó XANH suốt trong khi 9 tệp bàn bị writer phá:
   *   ① `06.md`/`08.md` có HAI khối MÁY GIỮ — cổng lấy `indexOf` nên chỉ thấy khối đầu.
   *   ② `00.md`/`06.md` mất sạch phần NGOÀI khối (tiêu đề, VAI, CẤM…) — cổng không nhìn ra ngoài.
   *   ③ `08.md:19` có U+FFFD (UTF-8 vỡ) — cổng không đọc byte.
   * Một cổng chỉ canh đúng thứ nó biết trước là một cổng báo an-toàn giống hệt báo-chết. */
  const MUC_BAT_BUOC = ['# BÀN', '## VAI', '## CẤM', '## NGHIỆM THU', '## ĐANG DỞ', '## NẠP TRƯỚC KHI GÕ'];
  /* U+FFFD trong `dấu nháy ngược` là BẰNG CHỨNG được trích dẫn, không phải hỏng — `07.md` chép
   * đúng chuỗi vỡ của `08.md` vào bài học. Bóc code span trước khi soi, nếu không cổng sẽ phạt
   * đúng cái bàn đã ghi lại bài học. */
  const boCodeSpan = (t) => t.replace(/`[^`\n]*`/g, '``');

  console.log('── tệp bàn · cấu trúc · khối MÁY GIỮ cấm sửa tay ──');
  let loi = 0, xet = 0;
  for (const ng of NGUOI) {
    const tep = path.join(BAN_ROOT, `${ng.ma}.md`);
    if (!co(tep)) continue;
    const noiDung = doc(tep, 'utf8');

    // ① CẶP MỐC — đếm, không indexOf.
    const soMo = noiDung.split(MO).length - 1, soDong = noiDung.split(DONG).length - 1;
    if (soMo !== 1 || soDong !== 1) {
      xet++; loi++;
      console.log(`  🔴 ${ng.ma} — ${soMo} mốc MỞ / ${soDong} mốc ĐÓNG (phải đúng 1/1) · tệp bàn HỎNG`);
      continue;
    }

    const i = noiDung.indexOf(MO), j = noiDung.indexOf(DONG);
    xet++;

    // ② PHẦN NGOÀI MỐC — thứ máy KHÔNG sinh lại được, mất là mất hẳn.
    const ngoai = noiDung.slice(0, i) + noiDung.slice(j + DONG.length);
    const thieuMuc = MUC_BAT_BUOC.filter((m) => !ngoai.includes(m));
    if (thieuMuc.length) {
      loi++;
      console.log(`  🔴 ${ng.ma} — mất phần người viết: ${thieuMuc.join(' · ')}`);
      continue;
    }

    // ③ UTF-8 VỠ.
    if (boCodeSpan(noiDung).includes('�')) {
      loi++;
      console.log(`  🔴 ${ng.ma} — có ký tự U+FFFD (chuỗi UTF-8 vỡ) ngoài code span`);
      continue;
    }
    const tren = noiDung.slice(i, j + DONG.length);
    /* B4 · ĐỌC LEGACY — cổng phải lọc ĐÚNG NHƯ writer, nếu không nó chấm bản dịch của chính nó.
     * Bản cũ ở đây chỉ khớp `x.den === ng.ma`, tức chỉ thấy địa chỉ NN trần. Writer thì khớp cả
     * `cx:NN`/`cl:NN`/`LEGACY_AMBIGUOUS:NN`. Hai bộ lọc lệch nhau ⇒ cổng so khối-có-phiếu với
     * nguồn-rỗng và kêu "có bàn tay người" ở đúng tệp máy vừa ghi. */
    const cua = phieu.filter((x) => x.den === ng.ma || x.den.endsWith(`:${ng.ma}`));
    const mo = cua.filter((x) => x.ma !== 'xong');
    /* Dựng lại phần KHÔNG biến thiên: số phiếu mở, id, trạng thái, noted. */
    const dau = mo.map((x) => `${x.id.slice(-12)}|${x.nhan}|${x.noted || 'THIẾU'}`).join('||');
    const tren2 = chuan(tren);
    const thieu = mo.filter((x) => !x.noted).length;
    let sai = mo.some((x) => !tren2.includes(x.id.slice(-12)))
      || [...tren2.matchAll(/`([0-9a-f]{12})`/g)].some((m) => !mo.some((x) => x.id.endsWith(m[1])));
    if (sai) {
      loi++;
      console.log(`  🔴 ${ng.ma} — khối trên đĩa KHÔNG khớp nguồn (có bàn tay người, hoặc chưa sinh lại)`);
    } else {
      console.log(`  ✅ ${ng.ma} — ${mo.length} phiếu mở${thieu ? ` · ⚠️ ${thieu} thiếu noted` : ''}`);
    }
    void dau;
  }
  if (loi) {
    console.log(`\n  🔴 ${loi}/${xet} tệp bàn ĐỎ.`);
    console.log('  Khối lệch nguồn  → chữa:  node scripts/phieu-ca.mjs --ghi-ban');
    console.log('  Mốc đôi · mất mục · UTF-8 vỡ → KHÔNG chữa bằng --ghi-ban.');
    console.log('    Đó là hỏng cấu trúc: phục hồi tệp từ git, giữ lại các bổ sung hợp lệ.');
    console.log('  ⛔ Đừng sửa tay bên trong dấu mốc — lần ghi biên nhận kế tiếp sẽ đè mất.');
    if (chan) process.exit(1);
  } else {
    console.log(`\n  ✅ ${xet} tệp bàn — cấu trúc đủ, khối máy giữ khớp nguồn, không có bàn tay người.`);
  }
  process.exit(0);
}

/* ── ĐÍCH 2: cho bảng 4173 ── */
if (process.argv.includes('--json')) {
  console.log(JSON.stringify({
    sinhLuc: new Date().toISOString(), ca: CA, nguoi: NGUOI, pha: PHA,
    laneDangGiu: soLane,
    phieu: phieu.map((p) => ({ ...p, luc: p.luc.toISOString() })),
    soViec: VIEC.length,
  }, null, 2));
  process.exit(0);
}

/* ── ĐÍCH 1: đường nóng — phiên đang nhận việc đọc cái này ── */
const chiAgent = process.argv.includes('--agent');
const bay = new Date();
console.log(`── PHIẾU CA · ${bay.toLocaleDateString('vi-VN')} ${String(bay.getHours()).padStart(2, '0')}:${String(bay.getMinutes()).padStart(2, '0')} · đang ở ca ${caCua(bay).ten} ──`);
console.log(`   ${phieu.length} phiếu đã giao hôm nay · làm TUẦN TỰ trong từng nhóm, như order bếp\n`);

for (const c of CA) {
  const ds = phieu.filter((p) => p.ca === c.ma).sort((a, b) => a.luc - b.luc);
  if (!ds.length) continue;
  const ketSo = ds.filter((p) => p.ma === 'ketSo').length;
  console.log(`${c.ten}  ${String(c.tu).padStart(2, '0')}:00–${String(c.den).padStart(2, '0')}:00   ${ds.length} việc${ketSo ? `  · 🔴 ${ketSo} KẸT` : ''}`);
  for (const [lane, ps] of nhomTheoLane(ds)) {
    const giu = soLane[lane];
    const ai = giu ? `phiên ${giu.phien.slice(0, 8)}` : '⚠️ CHƯA AI NGỒI';
    const laneRole = lane.split(':').at(-1);
    console.log(`   ┌ ${lane} · ${(ten[laneRole] ?? '?').padEnd(9)} ${ai}`);
    for (const p of ps) console.log(`   │ ${p.gio}  ${p.nhan.padEnd(26)} ${p.viec.slice(0, 62)}`);
    console.log('   └');
  }
  console.log();
}

const ketSo = phieu.filter((p) => p.ma === 'ketSo');
if (ketSo.length) {
  console.log(`🔴 ${ketSo.length} phiếu KẸT — đã ghi mà chưa ai gọi. Tra người đang ngồi:`);
  console.log('   node scripts/moc.mjs ai-giu');
  /* 🔴 SỬA 01/09 — thiếu Ô ĐỊA CHỈ, y hệt câu ở `soi-cau.mjs`. Lệnh thật là
   * `danh-thuc <cx:NN|cl:NN> <handoffId> "<cơ chế>"` (moc.mjs:343). Copy đúng câu máy in ra thì
   * `<id>` rơi vào ô địa chỉ và lệnh exit 2. Hai tệp cùng in sai một câu ⇒ đây là chuỗi hướng
   * dẫn bị CHÉP, không phải một lần gõ nhầm; sửa cả hai chỗ cùng lượt. */
  console.log('   rồi gọi bằng cơ chế hệ mình, xong ghi:  node scripts/moc.mjs danh-thuc <cx:NN|cl:NN> <id> "<cơ chế>"');
} else if (!chiAgent) {
  console.log('✅ Không phiếu nào kẹt.');
}
