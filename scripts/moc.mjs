#!/usr/bin/env node
/**
 * moc.mjs — ĐÓNG MỐC vào bản ghi nguyên văn (28/08).
 *
 * ── ĐIỀU ĐO ĐƯỢC, VÀ NÓ ĐỔI CẢ BÀI TOÁN ───────────────────────────────────────────────────────
 * `~/.claude/projects/-Users-tranben-Downloads-interiorflow/` chứa **109 phiên · 1,3 GB** bản ghi
 * NGUYÊN VĂN. Từng chữ của mọi phiên đã được lưu sẵn. **Chưa ai từng mở lại.**
 *
 * ⇒ Bài toán KHÔNG phải "lưu gì". Nguyên văn đã có. Bài toán là **con trỏ**: tìm lại một đoạn
 * trong 1,3 GB. Hoà hỏi *"sao không chụp màn nguyên văn"* — đáp án là đã chụp rồi, thiếu mục lục.
 *
 * ── VÌ SAO MÁY SINH, KHÔNG PHẢI NGƯỜI CHỌN ────────────────────────────────────────────────────
 * Hoà hỏi câu sắc nhất: *"phần tinh do ai đánh giá?"* Hiện tại là **tôi, một mình** — tức tôi tự
 * chấm cái gì đáng giữ **về việc của chính tôi**. Đó là xung đột lợi ích, và nó chính là cơ chế
 * làm mất tri thức: thứ tôi thấy chán thì không ai còn thấy nữa.
 * ⇒ Bỏ khâu đánh giá. Mốc đóng theo **sự kiện đo được** — mỗi commit, mỗi phép đo — không theo gu.
 * Máy không có gu thì máy không bỏ sót vì chán.
 *
 * ── VÌ SAO GHI LIÊN TỤC, KHÔNG CHỜ LÚC NÉN ────────────────────────────────────────────────────
 * Hoà đề xuất: trước khi nén thì gọi mốc, chụp, tóm, lưu, rồi nén, rồi cộng gộp. Ý đúng — nhưng
 * **tôi không móc được vào lúc nén**: nén xảy ra VỚI tôi, không do tôi gọi, và tôi không biết
 * trước nó tới lúc nào. Một cơ chế chỉ chạy khi bắt kịp đúng khoảnh khắc thì sẽ trượt.
 * ⇒ Đổi thành ghi **liên tục**. Nén tới lúc nào cũng được: phần tinh đã nằm ngoài context.
 *
 * Dùng:  node scripts/moc.mjs "chủ đề" "một dòng nội dung"
 * Đọc lại chi tiết: mở `.jsonl` của phiên tại số dòng ghi trong mốc.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync, spawn } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
/* Bản đồ lane — NGUỒN DUY NHẤT ở `bos-so-viec.mjs`. Chép lại là tạo bản thứ hai,
 * và bản thứ hai đã lệch một lần rồi (30/08, sau đúng mười phút). */
import { VAI } from './bos-so-viec.mjs';
/* Ba quyết định THUẦN của cầu sống ở module lá để CÓ THỂ KIỂM ĐƯỢC (`scripts/cau-mo-hinh.test.ts`).
 * Tệp này vẫn là cửa DUY NHẤT ghi vào cầu — module kia không ghi một dòng nào. */
import { phanRo, chamAck, KET_QUA, buocLaneSo, chuanHoaSo, laConTro,
  docDiaChi, dichEvent, eventThuocDiaChi, khoaHandoff } from './cau-mo-hinh.mjs';
import { VIEC } from './bos-so-viec.mjs';

const REPO = process.cwd();
const SO = path.join(REPO, 'docs/control/IF-MOC.md');
const KHO = path.join(os.homedir(), '.claude/projects/-Users-tranben-Downloads-interiorflow');
const LOG_ROOT = process.env.BOS_SHARED_LOG_ROOT || path.join(os.homedir(), 'PROJECT/SHARED/LOG');
const CAU = path.join(LOG_ROOT, 'agent-handoffs.jsonl');
/* SỔ BUỘC LANE ↔ PHIÊN — Hoà chốt 30/08: *"đường nó đọc khi nhận việc phải LUÔN MỚI VÀ ĐÚNG"*.
 * Trước đây lane chỉ sống trong biến `IF_LANE` lúc mở phiên; KHÔNG ĐÂU ghi lại phiên nào đang
 * giữ lane nào. Hệ quả đo được 30/08: 3 phiếu nằm ~100 phút không ai đánh thức, không phải vì
 * quên mà vì **không tra được phải gọi ai**. MAIN đánh thức được lane 04 chỉ nhờ còn nhớ ID
 * trong ngữ cảnh — và ngữ cảnh thì mất.
 * Nay MÁY tự ghi, tại đúng lúc phiên chạm việc, nên sổ này không thể cũ hơn lần gõ gần nhất. */
const SO_LANE = path.join(LOG_ROOT, 'lane-phien.json');

const LANES = new Set(Object.keys(VAI));
const bamNgan = (s) => createHash('sha256').update(s).digest('hex').slice(0, 12);

/** Ghi: lane này đang do phiên nào giữ. Gọi mỗi lần hook chạm — tự lành, không cần ai dọn. */
function docSession() {
  let session = process.env.BOS_SESSION_ID || process.env.CODEX_THREAD_ID || process.env.CLAUDE_SESSION_ID || null;
  try {
    if (!session && !process.stdin.isTTY) session = JSON.parse(readFileSync(0, 'utf8')).session_id ?? null;
  } catch { /* stdin không phải JSON */ }
  return session;
}

function danhTinhGhi(address) {
  const dc = docDiaChi(address, false);
  if (!dc.ok || !LANES.has(dc.lane)) return { ok: false, loi: dc.loi ?? 'lane không tồn tại' };
  const session_id = docSession();
  if (!session_id) return { ok: false, loi: 'thiếu session_id thật — đặt BOS_SESSION_ID; cấm suy từ transcript/artifact' };
  return { ok: true, ...dc, session_id };
}

function tacGia(dt, task_id, handoffId = null) {
  return { system: dt.system, lane: dt.lane, session_id: dt.session_id,
    task_id: task_id ?? handoffId, ...(handoffId ? { handoffId } : {}) };
}

function buocLane(address, identity = null) {
  /* ID PHIÊN PHẢI ĐẾN TỪ CHÍNH PHIÊN, KHÔNG ĐƯỢC ĐOÁN.
   * Bản đầu dùng `conTro()` — "tệp .jsonl vừa được chạm gần nhất". Sai ngay khi có hai phiên
   * chạy song song: đo 30/08 lúc 5 phiên cùng sống, sổ gán lane 04 và 06 cho CÙNG một id, và
   * gán lane 03 cho phiên MAIN vốn chưa bao giờ nhận lane đó. Một sổ sai còn tệ hơn không có
   * sổ — nó khiến MAIN gọi nhầm người rồi tin là đã gọi đúng.
   * Hook của Claude Code đưa JSON vào stdin, trong đó có `session_id` THẬT. Đọc nó trước;
   * chỉ khi không có mới lùi về phỏng đoán, VÀ khi lùi thì đánh dấu `doan: true` để người đọc
   * biết dòng đó không chắc. */
  const dt = identity ?? danhTinhGhi(address);
  if (!dt.ok) throw new Error(dt.loi);
  const phien = dt.session_id, doan = false;
  let so = {};
  try { so = JSON.parse(readFileSync(SO_LANE, 'utf8')); } catch { /* chưa có sổ */ }
  /* MỘT PHIÊN ↔ MỘT LANE ACTIVE (Codex DISS 30/08). Bản cũ chỉ gán thêm, nên một phiên tích luỹ
   * được nhiều lane và sổ nói dối về cả hai. Nhận lane mới ⇒ tự rời lane cũ, không cần ai dọn. */
  so = buocLaneSo(so, dt.address, phien, doan);
  try { mkdirSync(path.dirname(SO_LANE), { recursive: true }); writeFileSync(SO_LANE, JSON.stringify(so, null, 2)); }
  catch { /* không ghi được thì thôi — cấm làm hỏng phiên vì một sổ phụ */ }
}

function docSuKien() {
  if (!existsSync(CAU)) return [];
  return readFileSync(CAU, 'utf8').split('\n').filter(Boolean).flatMap((line) => {
    try { return [JSON.parse(line)]; } catch { return []; }
  });
}

function ghiSuKien(event) {
  mkdirSync(LOG_ROOT, { recursive: true });
  appendFileSync(CAU, `${JSON.stringify(event)}\n`, 'utf8');
  /* MỘT NGUỒN, BA ĐÍCH, LUÔN CẬP NHẬT — Hoà chốt 30/08.
   * Đích 3 (`docs/control/PHIEU-CA.md`) là TỆP, và tệp thì già đi. Nó chỉ "luôn cập nhật" nếu
   * được sinh lại ĐÚNG LÚC NGUỒN ĐỔI — tức ngay đây, chỗ duy nhất ghi vào cầu.
   * Sinh lại ở nơi khác (cron, tay, đầu phiên) là mở cửa cho một cửa sổ mà tệp nói dối.
   * Tách tiến trình + `unref` ⇒ không lệnh nào của cầu bị chậm hay chết vì việc phụ này. */
  try {
    const con = spawn(process.execPath, [path.join(REPO, 'scripts/phieu-ca.mjs'), '--ghi-ban'],
      { detached: true, stdio: 'ignore', cwd: REPO });
    con.unref();
  } catch { /* sinh lại thất bại KHÔNG được làm hỏng việc ghi biên nhận */ }
}

/**
 * Cầu Claude ↔ Codex dùng CHÍNH máy mốc, không dựng máy receipt thứ hai.
 *
 *   node scripts/moc.mjs handoff 00 05 "chủ đề" "nội dung" "nguồn#hash"
 *   node scripts/moc.mjs inbox 05
 *   node scripts/moc.mjs ack 05 <event-id>
 */
const lenh = process.argv[2];
if (lenh === 'handoff') {
  const [from, to, topic, body, source = 'chat-unverified'] = process.argv.slice(3);
  const tac = danhTinhGhi(from);
  const dich = docDiaChi(to, false);
  if (!tac.ok || !dich.ok || !LANES.has(dich.lane) || !topic || !body) {
    console.error('Dùng: node scripts/moc.mjs handoff <cx:NN|cl:NN> <cx:NN|cl:NN> "chủ đề" "nội dung" "nguồn#hash"');
    console.error(`⛔ ${tac.loi ?? dich.loi ?? 'thiếu topic/body'}. Địa chỉ trần NN chỉ được dùng để đọc legacy.`);
    for (const [k, v] of Object.entries(VAI)) console.error(`    ${k}  ${v}`);
    process.exit(2);
  }
  const createdAt = new Date().toISOString();
  const id = `HO-${createdAt.replace(/\D/g, '').slice(0, 14)}-${bamNgan(`${from}|${to}|${topic}|${body}|${randomUUID()}`)}`;
  ghiSuKien({ schema: 'BOS-HANDOFF-v2', id, handoffId: id, type: 'HANDOFF', from: tac.address, to: dich.address,
    ...tacGia(tac, id, id), target_system: dich.system, target_lane: dich.lane,
    topic, body, source, sensitivity: 'BUILDER', createdAt });
  console.log(`${id} · ${from} → ${to} · ${topic}`);
  console.log('');
  console.log('  ⛔ PHIẾU ĐÃ GHI — NHƯNG CHƯA GIAO. Cầu chỉ chở nội dung, nó KHÔNG đánh thức ai.');
  console.log(`  Bên giao phải tự đánh thức lane ${to} bằng cơ chế của hệ mình, rồi ghi lại:`);
  console.log(`      node scripts/moc.mjs danh-thuc ${id} "<cơ chế đã dùng>"`);
  console.log('  Không có mắt ĐÁNH THỨC thì `soi:cau` sẽ đỏ, và đúng như vậy — phiếu chưa tới ai.');
  process.exit(0);
}

/* `im <lane>` — bản CÂM của `inbox`, dành riêng cho hook.
 * Hook chạy ở MỖI lượt; in "không có phiếu mới" mỗi lượt là đổ rác vào ngữ cảnh, và rác đều
 * đặn thì người ta học cách bỏ qua. Rỗng ⇒ im lặng tuyệt đối, exit 0. Có phiếu ⇒ in, và
 * ĐÁNH DẤU SEEN — đó là mắt xích giữa SENT và ACK mà cầu này đang thiếu. */
/* 🔴 SỬA 29/08 theo phiếu HO-…-a1a71250c5c9 — LỖI THẬT: `inbox` và `im` CÙNG ghi SEEN.
 * Hậu quả: bưu tá dùng `inbox` để soi xem có gì phải gửi → nó tạo SEEN NGAY LÚC SOI, tức biên
 * nhận "đã tới mắt" được sinh ra TRƯỚC KHI giao. Biên nhận giả còn tệ hơn không có biên nhận:
 * nó làm hệ thống tin rằng phiếu đã tới nơi.
 * ⇒ Nay chỉ MỘT lệnh được ghi SEEN: `im`, và nó chỉ do HOOK TẠI ĐÍCH chạy.
 *   `peek`/`inbox` — CHỈ ĐỌC tuyệt đối, ai soi cũng được, không để lại dấu.
 *   `im`           — hook tại đích, in VÀ ghi SEEN. */
/* AI ĐANG GIỮ LANE NÀO — lệnh MAIN cần để đánh thức đúng người. Chỉ đọc, không ghi gì. */
if (lenh === 'ai-giu') {
  let so = {};
  try { so = JSON.parse(readFileSync(SO_LANE, 'utf8')); } catch { /* chưa có sổ */ }
  const loc = process.argv[3];
  const q = loc ? docDiaChi(loc, true) : null;
  if (loc && !q.ok) { console.error(q.loi); process.exit(2); }
  const hang = Object.entries(so).filter(([l]) => !loc || l === q.address);
  if (!hang.length) {
    console.log(loc ? `⚪ lane ${loc}: chưa phiên nào khai giữ lane này` : '⚪ sổ trống — chưa phiên nào chạm việc');
    process.exit(0);
  }
  /* THẨM QUYỀN, KHÔNG PHẢI CẢNH BÁO. Bản cũ in "⚠️ ĐOÁN, chưa chắc" rồi vẫn để người đọc dùng
   * dòng đó mà gọi — cảnh báo cho-qua-được thì chỉ là trang trí, và nó đã gán nhầm lane 04/06
   * cho cùng một phiên hôm 30/08. Nay dòng ĐOÁN và dòng QUÁ HẠN bị TÁCH KHỎI câu trả lời:
   * thà nói KHÔNG BIẾT còn hơn gọi nhầm người rồi tin là đã gọi đúng. */
  const bang = chuanHoaSo(Object.fromEntries(hang), Date.now());
  const that = bang.filter((r) => r.thamQuyen);
  const khong = bang.filter((r) => !r.thamQuyen);
  if (that.length) {
    console.log('── lane ↔ phiên đang giữ ──');
    for (const r of that) console.log(`  ${r.lane}  ${r.phien}  · gõ lần cuối ${r.phut} phút trước`);
  }
  if (khong.length) {
    console.log(`${that.length ? '\n' : ''}── KHÔNG DÙNG ĐƯỢC ĐỂ ĐÁNH THỨC (giữ lại chỉ để biết "có thể là ai") ──`);
    for (const r of khong) console.log(`  ${r.lane}  ${r.phien}  · ${r.phut} phút · ⛔ ${r.lyDo}`);
  }
  if (!that.length) {
    console.log(`\n⛔ Không có dòng nào đủ thẩm quyền${loc ? ` cho lane ${loc}` : ''}. ĐỪNG đoán —`);
    console.log('   bảo phiên đó chạy `node scripts/moc.mjs im <lane>` để tự khai, rồi tra lại.');
    process.exit(1);
  }
  process.exit(0);
}

/* Read-only migration view: không sửa log cũ, chỉ cho thấy phần nào đã có namespace và phần nào
 * buộc phải giữ LEGACY_AMBIGUOUS. Đây là pointer duy nhất khi di trú. */
if (lenh === 'namespace-view') {
  const events = docSuKien();
  const handoffs = events.filter((e) => e.type === 'HANDOFF');
  const dem = new Map();
  for (const e of handoffs) {
    const d = dichEvent(e);
    const k = d.legacy ? 'LEGACY_AMBIGUOUS' : d.address;
    dem.set(k, (dem.get(k) ?? 0) + 1);
  }
  console.log('── MOC namespace migration view · READ-ONLY ──');
  for (const [k, n] of [...dem.entries()].sort()) console.log(`  ${k.padEnd(20)} ${n}`);
  console.log('  pointer: docs/control/IF-SHARED-MEMORY-BRIDGE.md#namespace-migration');
  process.exit(0);
}

if (lenh === 'im' || lenh === 'inbox' || lenh === 'peek') {
  const cam = lenh === 'im';
  const chiDocEp = process.argv.includes('--chi-doc');
  const chiDoc = lenh !== 'im' || chiDocEp;
  const dc = docDiaChi(process.argv[3], chiDoc);
  if (!dc.ok || !LANES.has(dc.lane)) {
    console.error('Dùng: node scripts/moc.mjs inbox <cx:NN|cl:NN>; `NN` chỉ đọc LEGACY_AMBIGUOUS');
    process.exit(2);
  }
  /* ⛔ LỆNH CHẨN ĐOÁN PHẢI CHỈ-ĐỌC (phiếu `bd945a9950bc`).
   * Ca thật 30/08: MAIN chạy thử `im` với `session_id` giả để đo xem hook có treo không, và nó
   * GHI THẲNG "test-abc" vào lane 00, đè mất binding thật — phải dọn tay. Chạy thử một lệnh CÓ
   * GHI là làm bẩn đúng thứ mình đang đo. Nay `--chi-doc` cho phép đo mà không để lại dấu. */
  let dt = null;
  if (cam && !chiDocEp) {
    dt = danhTinhGhi(dc.address);
    if (!dt.ok) { console.error(`⛔ ${dt.loi}`); process.exit(2); }
    buocLane(dc.address, dt);
  }
  let daChiBan = false;
  const events = docSuKien();
  const acked = new Set(events.filter((e) => e.type === 'ACK').map(khoaHandoff));
  const seen = new Set(events.filter((e) => e.type === 'SEEN').map(khoaHandoff));
  const open = events.filter((e) => e.type === 'HANDOFF' && eventThuocDiaChi(e, dc.address) && !acked.has(khoaHandoff(e)));
  if (!open.length) {
    /* 🔴 HỘP RỖNG PHẢI NÓI RA LÀ RỖNG (phiếu `bd945a9950bc`).
     * Bản cũ: `im` rỗng ⇒ IM TUYỆT ĐỐI. Hệ quả đo được 30/08: Hoà thấy cầu im và tưởng nó hỏng,
     * phải đi hỏi MAIN, MAIN phải đo ba thứ mới loại được nghi ngờ. **Báo-an-toàn trông y hệt
     * báo-chết** — đó là M-59 ở dạng ngược, và nó đắt hơn một dòng chữ rất nhiều.
     * Một dòng NGẮN, có giờ, vì hook chạy mỗi lượt gõ: dài là đổ rác, im là nói dối. */
    const gio = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    console.log(`📭 ${dc.legacy ? 'LEGACY_AMBIGUOUS ' : ''}${dc.address} · hộp rỗng · kiểm lúc ${gio}`);
    process.exit(0);
  }
  if (cam) console.log(`📬 ${open.length} phiếu CHƯA XỬ LÝ cho ${dc.address} — đọc rồi \`moc.mjs ack ${dc.address} <id> …\`:`);
  for (const e of open) {
    const key = khoaHandoff(e);
    console.log(`${e.id}${seen.has(key) ? '' : '  🆕'}${dc.legacy ? '  · LEGACY_AMBIGUOUS' : ''}\n  ${e.from} → ${e.to} · ${e.topic}\n  ${e.body}\n  nguồn: ${e.source}\n`);
    // SEEN ghi MỘT LẦN cho mỗi phiếu — biên nhận "đã tới mắt", khác hẳn ACK "đã xử lý".
    // CHỈ `im` (hook tại đích) được ghi. `peek`/`inbox` đi qua đây mà không để lại gì.
    if (!daChiBan) {
      /* Ngồi vào bàn thì phải đọc bàn giao TRƯỚC khi gõ — kiến thức nằm ở bàn, không ở người ngồi
       * (Hoà 30/08). In một dòng, không in cả bàn: bàn có thể dài, và đổ dài mỗi lượt là đổ rác. */
      console.log(`📋 BÀN ${dc.address} · ${VAI[dc.lane] ?? ''}\n   đọc bàn giao TRƯỚC khi gõ:  docs/control/ban/${dc.lane}.md`);
      daChiBan = true;
    }
    if (!chiDoc && !seen.has(key)) ghiSuKien({ schema: 'BOS-HANDOFF-v2', id: `SEEN-${randomUUID()}`, type: 'SEEN',
      ...tacGia(dt, e.task_id ?? e.id, e.id), target_system: dc.system, target_lane: dc.lane, createdAt: new Date().toISOString() });
  }
  process.exit(0);
}

/* `chua-nhan [phút]` — cho phiên TUẦN TRA. Liệt kê phiếu đã GỬI mà chưa ai NHÌN THẤY quá N
 * phút, kèm lane đích. Đây là thứ biến hòm thư thành cầu: có nó thì người tuần tra biết
 * PHẢI ĐÁNH THỨC AI, thay vì mọi phiên tự hỏi "có ai nhắn mình không". */
/* `sent <handoffId> <đường-giao> <biên-nhận>` — ghi SAU KHI giao thành công, KHÔNG trước.
 * Sổ trước đây chỉ có HANDOFF (= đã VIẾT phiếu) rồi nhảy thẳng tới SEEN — thiếu hẳn mắt
 * "đã GIAO". Thiếu nó thì không phân biệt được *chưa ai gửi* với *gửi rồi mà không ai nhìn*,
 * mà hai ca đó cần hai cách chữa khác hẳn nhau.
 * `đường-giao` là cách giao thật (`send_message`, `cron`, `tay`), `biên-nhận` là bằng chứng
 * bên kia trả về. Gửi THẤT BẠI thì ĐỪNG gọi lệnh này — không có SENT là đúng sự thật. */
if (lenh === 'sent') {
  const [author, hoId, duong, bienNhan] = process.argv.slice(3);
  const dt = danhTinhGhi(author);
  if (!dt.ok || !hoId || !duong) {
    console.error('Dùng: node scripts/moc.mjs sent <cx:NN|cl:NN> <handoffId> <đường-giao> [biên-nhận]');
    process.exit(2);
  }
  const co = docSuKien().find((e) => e.type === 'HANDOFF' && e.id === hoId);
  if (!co) { console.error(`Không thấy phiếu ${hoId}.`); process.exit(1); }
  const dich = dichEvent(co);
  ghiSuKien({ schema: 'BOS-HANDOFF-v2', id: `SENT-${randomUUID()}`, type: 'SENT',
    ...tacGia(dt, co.task_id ?? hoId, hoId), target_system: dich.system, target_lane: dich.lane,
    transport: duong, receipt: bienNhan ?? null,
    createdAt: new Date().toISOString() });
  console.log(`📤 ${hoId} · đã giao qua ${duong}${bienNhan ? ' · ' + bienNhan : ''}`);
  process.exit(0);
}

/* `dispatch-attempt` — nhật ký APPEND-ONLY của bưu tá. Ghi TRƯỚC/Sau mỗi lần gọi connector để
 * restart không quên backoff. Đây không phải SENT: connector lỗi hoặc không trả receipt thì tuyệt
 * đối không được nâng trạng thái giao. `nextAt` là ISO-8601 có timezone, do bưu tá tính. */
if (lenh === 'dispatch-attempt') {
  const [author, handoffId, ketQua, connector, nextAt = '', chiTiet = ''] = process.argv.slice(3);
  const dt = danhTinhGhi(author);
  const events = docSuKien();
  const ho = events.find((e) => e.type === 'HANDOFF' && e.id === handoffId);
  if (!dt.ok || !ho || !['STARTED', 'FAILED'].includes(ketQua) || !connector) {
    console.error('Dùng: node scripts/moc.mjs dispatch-attempt <cx:NN|cl:NN> <handoffId> <STARTED|FAILED> <connector> [nextAt-ISO] [chi-tiết]');
    process.exit(2);
  }
  if (nextAt && !Number.isFinite(Date.parse(nextAt))) {
    console.error('nextAt phải là ISO-8601 hợp lệ.');
    process.exit(2);
  }
  const dich = dichEvent(ho);
  ghiSuKien({ schema: 'BOS-HANDOFF-v2', id: `DISPATCH-${randomUUID()}`, type: 'DISPATCH_ATTEMPT',
    ...tacGia(dt, ho.task_id ?? handoffId, handoffId), target_system: dich.system, target_lane: dich.lane,
    outcome: ketQua, connector, nextAt: nextAt || null,
    detail: chiTiet ? chiTiet.slice(0, 240) : null, createdAt: new Date().toISOString() });
  console.log(`📯 ${handoffId} · ${ketQua} qua ${connector}${nextAt ? ` · thử lại ${nextAt}` : ''}`);
  process.exit(0);
}

/* ══ `danh-thuc <handoffId> <cách>` — MẮT XÍCH CÒN THIẾU CỦA CẦU ══
 *
 * Hoà chốt 30/08, và đây là RÀNG BUỘC chứ không phải lời nhắc:
 *   *"hệ AI nào đang giao việc thì hệ đó phải TỰ ĐÁNH THỨC. Bạn là main bên đầu Claude, ngang
 *   hàng với main bên đầu Codex hay hệ Agent khác."*
 *
 * Ca thật sinh ra luật: 30/08 lane 00 ghi hai phiếu quan trọng vào cầu rồi coi như đã giao. Lane 05
 * **đang mở và rảnh** nhưng không biết có việc mới — vì `handoff` CHỈ GHI VÀO SỔ, nó không phải
 * chuông. Hai phiếu nằm im tới khi Hoà hỏi *"lane 5 đâu?"*.
 *
 * ⛔ **GHI PHIẾU KHÔNG PHẢI GIAO VIỆC.** Phiếu chỉ chở nội dung; nó không thay được người gọi.
 * Bên giao phải đánh thức bằng **cơ chế của chính hệ mình**, rồi ghi lại đã dùng cơ chế nào:
 *   · Claude Code  → `SendMessage` / `ccd_session_mgmt.send_message`
 *   · Codex        → cơ chế đánh thức của phía đó
 *   · người        → mở phiên và gõ
 * `cách` là chuỗi tự do NHƯNG phải nói được cơ chế thật, không được ghi "đã báo".
 */
if (lenh === 'danh-thuc') {
  const [author, handoffId, cach] = process.argv.slice(3);
  const dt = danhTinhGhi(author);
  if (!dt.ok || !handoffId || !cach) {
    console.error('Dùng: node scripts/moc.mjs danh-thuc <cx:NN|cl:NN> <handoffId> "<cơ chế đã dùng>"');
    console.error('  Ví dụ: … danh-thuc HO-2026… "SendMessage → local_51cf773f"');
    process.exit(2);
  }
  const events = docSuKien();
  const ho = events.find((e) => e.type === 'HANDOFF' && e.id === handoffId);
  if (!ho) { console.error(`Không có phiếu ${handoffId}`); process.exit(2); }
  /* Schema mới gọi đúng sự thật: đây là NỖ LỰC đánh thức, không phải bằng chứng đã tới mắt.
   * Reader vẫn nhận `WAKE` cũ như alias; sổ cũ tuyệt đối không viết lại. */
  const dich = dichEvent(ho);
  ghiSuKien({ schema: 'BOS-HANDOFF-v2', id: `WAKE-${randomUUID()}`, type: 'WAKE_ATTEMPTED',
    ...tacGia(dt, ho.task_id ?? handoffId, handoffId), target_system: dich.system, target_lane: dich.lane,
    cach, createdAt: new Date().toISOString() });
  console.log(`⏰ đã ghi ĐÁNH THỨC cho ${handoffId} → lane ${ho.to} · ${cach}`);
  process.exit(0);
}

/* ══ `mat-nguoi <mã-việc> "<bằng chứng>" ["note"]` — BIÊN NHẬN CHO ĐẦU VIỆC CHỜ MẮT NGƯỜI ══
 *
 * 🔴 LỖ HỔNG ĐÃ ĐO 30/08, VÀ NÓ CHẶN ĐÚNG CHUỖI SHIP:
 * `soat-toan-dien.mjs` chấm đầu việc `{ bang: { tay } }` bằng MỘT DÒNG VÔ ĐIỀU KIỆN —
 * `if (v.bang.tay) return { trang: 'tay' }`. Nghĩa là **không có đường nào để một đầu việc chờ
 * mắt người trở thành ✅**. `tuong-len-man` đã được chứng minh trên app thật (81 tường · 286 m,
 * ảnh phóng to, số trên màn khớp số máy đo) mà sổ vẫn 🟡, và phiên sau lại được bảo *"chưa mặt
 * nào đọc con số đó"*. Việc làm xong hai lần vẫn hiện là chưa làm — đó không phải thận trọng,
 * đó là sổ nói sai.
 *
 * Chữa bằng CÁI ĐÃ CÓ, không đẻ kho thứ hai: biên nhận ghi vào ĐÚNG dòng sự kiện append-only
 * mà cầu đang dùng, qua `ghiSuKien`. Bằng chứng đi qua ĐÚNG cổng của `ack` (`laConTro`) — một
 * khuôn cho "thế nào là bằng chứng", không phải hai.
 * Kèm `commit` lúc xác nhận: mắt người chấm một trạng thái mã CỤ THỂ, không chấm vĩnh viễn.
 */
if (lenh === 'mat-nguoi') {
  const [ma, bangChung, note] = process.argv.slice(3);
  const viec = VIEC.find((v) => v.ma === ma);
  const ev = (bangChung ?? '').trim();
  if (!viec || !viec.bang?.tay || !ev || !laConTro(ev)) {
    console.error('Dùng: node scripts/moc.mjs mat-nguoi <mã-việc> "<bằng chứng>" ["note ngắn"]');
    if (!viec) console.error(`⛔ không có đầu việc "${ma ?? ''}" trong sổ BOS.`);
    else if (!viec.bang?.tay) console.error(`⛔ "${ma}" là việc MÁY chấm — nó có lệnh riêng, mắt người không ký thay được.`);
    else if (!ev) console.error(`⛔ thiếu bằng chứng. Đòi hỏi của sổ: ${viec.bang.tay}`);
    else console.error(`⛔ bằng chứng phải MỞ LẠI ĐƯỢC (đường dẫn · hash · lệnh), nhận được: "${ev.slice(0, 60)}"`);
    console.error('   Việc chờ mắt người trong sổ:');
    for (const v of VIEC.filter((v) => v.bang?.tay)) console.error(`     ${v.ma.padEnd(16)} ${v.bang.tay}`);
    process.exit(2);
  }
  let commit = '';
  try { commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: REPO, encoding: 'utf8' }).trim(); } catch { /* ngoài git */ }
  ghiSuKien({ schema: 'BOS-HANDOFF-v1', id: `MAT-${randomUUID()}`, type: 'MAT_NGUOI',
    viec: ma, evidence: ev, note: note ?? null, commit, createdAt: new Date().toISOString() });
  console.log(`👁 đã ký mắt người · ${ma} · ${ev}${commit ? ' · @' + commit : ''}`);
  process.exit(0);
}

if (lenh === 'chua-nhan') {
  const nguong = Number(process.argv[3] ?? 10);
  /* BA RỔ, BA NGƯỜI PHẢI LÀM — luật phân rổ nằm ở `cau-mo-hinh.mjs` (`phanRo`), nơi có ca đột
   * biến. Ở đây chỉ còn phần IN.
   * 🔴 Bản cũ phân rổ theo MỖI mắt `SENT`, mà tuyến Claude không có ai ghi SENT ⇒ rổ "CHƯA GỬI"
   * là rổ KHÔNG THOÁT RA ĐƯỢC: phiếu đã tới mắt, đã được gọi, vẫn nằm trong đó. Codex đọc rổ ấy
   * rồi kết luận cầu tự mâu thuẫn — lỗi làm hỏng LÒNG TIN giữa hai hệ, không phải lỗi hiển thị. */
  const { chuaGui, daGuiChuaNhin, daNhinChuaXuLy, ackCu, phutCua } = phanRo(docSuKien(), nguong);

  if (!chuaGui.length && !daGuiChuaNhin.length && !daNhinChuaXuLy.length) {
    console.log(`✅ không có phiếu nào treo quá ${nguong} phút`);
    if (ackCu.length) console.log(`   (${ackCu.length} biên nhận CŨ không có outcome — đọc thành DONE-không-bằng-chứng)`);
    process.exit(0);
  }
  for (const e of chuaGui) console.log(`📮 CHƯA GỬI · ${e.id} · lane ${e.to} · ${phutCua(e)} phút · ${e.topic}`);
  for (const e of daGuiChuaNhin) console.log(`⏳ ĐÃ GỬI, CHƯA AI NHÌN · ${e.id} · lane ${e.to} · ${phutCua(e)} phút · ${e.topic}`);
  for (const e of daNhinChuaXuLy) console.log(`👁 ĐÃ NHÌN, CHƯA XỬ LÝ · ${e.id} · lane ${e.to} · ${phutCua(e)} phút · ${e.topic}`);
  if (chuaGui.length) console.log('   → CHƯA GỬI: việc của BÊN GIAO — đánh thức rồi `moc.mjs danh-thuc <id> "<cơ chế>"`');
  if (daGuiChuaNhin.length) console.log('   → ĐÃ GỬI: phiên đích chưa mở lên — gọi lại phiên đó');
  if (daNhinChuaXuLy.length) console.log('   → ĐÃ NHÌN: việc của NGƯỜI NGỒI LANE — `moc.mjs ack <lane> <id> <outcome> "<bằng chứng>"`');
  if (ackCu.length) console.log(`   ⚠️ ${ackCu.length} biên nhận CŨ không có outcome — đọc thành DONE-không-bằng-chứng, KHÔNG viết lại lịch sử`);
  process.exit(1);   // exit 1 = CÓ việc phải làm
}

if (lenh === 'ack') {
  const [address, handoffId, ketQua, bangChung, note] = process.argv.slice(3);
  const dt = danhTinhGhi(address);
  /* BIÊN NHẬN CÓ CẤU TRÚC (Codex DISS 30/08, tôi đồng ý — nó tốt hơn bản tôi làm).
   * Bản cũ bắt buộc `noted` chữ tự do rồi KHÔNG có cổng nào chấm chất lượng chữ đó. Một ràng
   * buộc không đo được thì không lọc ra thứ tốt — nó chỉ dạy người ta gõ "ok/xong" cho qua.
   * Luật chấm nằm ở `cau-mo-hinh.mjs` (`chamAck`), nơi có ca đột biến. FAIL CLOSED. */
  const cham = chamAck({ outcome: ketQua, evidence: bangChung, note });
  if (!dt.ok || !handoffId || !cham.ok) {
    console.error('Dùng: node scripts/moc.mjs ack <cx:NN|cl:NN> <event-id> <' + KET_QUA.join('|') + '> "<bằng chứng>" ["note ngắn"]');
    console.error('  DONE/PARTIAL → con trỏ MỞ LẠI ĐƯỢC (đường dẫn · hash · lệnh)');
    console.error('  BLOCKED      → TÊN cái đang chặn');
    console.error('  SUPERSEDED   → phiếu/quyết định đã thay nó');
    if (cham.loi) console.error(`⛔ ${cham.loi}`);
    console.error('ℹ️  Bài học KHÔNG viết vào đây — viết vào bàn `docs/control/ban/' + (dt.ok ? dt.lane : 'NN') + '.md`.');
    process.exit(2);
  }
  const target = docSuKien().find((e) => e.type === 'HANDOFF' && e.id === handoffId);
  if (!target || !eventThuocDiaChi(target, dt.address)) {
    console.error(`Không thấy handoff ${handoffId} dành cho ${dt.address}.`);
    process.exit(1);
  }
  const ev = bangChung.trim();
  ghiSuKien({
    schema: 'BOS-HANDOFF-v2', id: `ACK-${randomUUID()}`, type: 'ACK',
    ...tacGia(dt, target.task_id ?? handoffId, handoffId), target_system: dt.system, target_lane: dt.lane,
    outcome: ketQua,
    evidence: ketQua === 'BLOCKED' ? null : ev,
    blocker: ketQua === 'BLOCKED' ? ev : null,
    note: note ?? null,
    /* `noted` GIỮ LẠI cho mặt cũ (`phieu-ca.mjs` dựng bàn đọc trường này). Đổi tên trường là
     * bắt một tệp khác phải sửa cùng lúc — đúng thứ luật 6 cấm. Dòng gộp, không phải nguồn. */
    noted: [ketQua, ev, note].filter(Boolean).join(' · '),
    createdAt: new Date().toISOString(),
  });
  console.log(`✅ ${dt.address} · ${handoffId} · ${ketQua}${ev ? ' · ' + ev : ''}`);
  process.exit(0);
}

const chuDe = process.argv[2];
const noiDung = process.argv[3] ?? '';
if (!chuDe) {
  console.error('Dùng: node scripts/moc.mjs "chủ đề" "một dòng nội dung"');
  process.exit(2);
}

/** Phiên đang chạy = tệp .jsonl mới đụng gần nhất. Con trỏ = số dòng hiện tại của nó. */
function conTro() {
  if (!existsSync(KHO)) return null;
  const tep = readdirSync(KHO)
    .filter((f) => f.endsWith('.jsonl'))
    .map((f) => ({ f, t: statSync(path.join(KHO, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t)[0];
  if (!tep) return null;
  const duong = path.join(KHO, tep.f);
  let dong = 0;
  try { dong = readFileSync(duong, 'utf8').split('\n').length; } catch { /* tệp lớn/đang ghi */ }
  return { phien: tep.f.replace('.jsonl', ''), dong };
}

const git = (...a) => { try { return execFileSync('git', a, { encoding: 'utf8' }).trim(); } catch { return '?'; } };
const head = git('rev-parse', '--short', 'HEAD');
const nhanh = git('rev-parse', '--abbrev-ref', 'HEAD');
const ban = git('status', '--short').split('\n').filter(Boolean).length;
const ct = conTro();
const gio = new Date().toISOString().replace('T', ' ').slice(0, 16);

if (!existsSync(SO)) {
  mkdirSync(path.dirname(SO), { recursive: true });
  writeFileSync(SO, `# IF · SỔ MỐC — con trỏ vào bản ghi nguyên văn

> **Đây không phải bản tóm tắt.** Nguyên văn đã nằm ở \`~/.claude/projects/…/<phiên>.jsonl\`
> (109 phiên · 1,3 GB). Sổ này chỉ là **mục lục** để tìm lại đúng đoạn.
>
> Cần chi tiết một mốc: mở \`.jsonl\` của phiên đó, đi tới **số dòng** ghi trong cột con trỏ.
> Mốc do **máy** đóng theo sự kiện đo được, **không** do ai chấm "cái này đáng giữ".

| Lúc | Chủ đề | Một dòng | HEAD | Con trỏ |
|---|---|---|---|---|
`, 'utf8');
}

const troChu = ct ? `\`${ct.phien.slice(0, 8)}\` d.${ct.dong}` : '—';
appendFileSync(SO, `| ${gio} | **${chuDe}** | ${noiDung} | \`${head}\`${ban ? ` +${ban} bẩn` : ''} | ${troChu} |\n`, 'utf8');

console.log(`✅ mốc: ${chuDe}`);
console.log(`   ${gio} · ${nhanh} @ ${head}${ban ? ` · ${ban} tệp bẩn` : ' · cây sạch'}`);
console.log(`   con trỏ: ${ct ? `${ct.phien}.jsonl dòng ~${ct.dong}` : 'không thấy kho phiên'}`);
console.log(`   sổ: docs/control/IF-MOC.md`);
