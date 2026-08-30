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
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';

const REPO = process.cwd();
const SO = path.join(REPO, 'docs/control/IF-MOC.md');
const KHO = path.join(os.homedir(), '.claude/projects/-Users-tranben-Downloads-interiorflow');
const LOG_ROOT = process.env.BOS_SHARED_LOG_ROOT || path.join(os.homedir(), 'PROJECT/SHARED/LOG');
const CAU = path.join(LOG_ROOT, 'agent-handoffs.jsonl');

/* ══ BẢN ĐỒ LANE — MỘT bản, dùng chung giữa MỌI hệ agent ══
 *
 * Hoà 30/08 cho xem cấu trúc bên Codex: 9 lane, các phiên **phản biện nhau** rồi dồn về MAIN,
 * MAIN viết phiếu, bỏ vào hộp thư cầu, bên kia đọc và thi hành.
 *
 * ⚠️ LỖI ĐO ĐƯỢC CÙNG NGÀY: bản đồ hai bên **lệch nhau** mà không ai biết.
 *   Codex:  03 PRODUCT · 04 DESIGN · 05 ARCH · 06 BUILD
 *   Claude: 03 UI      · (không có) · 05 THIẾT KẾ/NC · 06 2D3D
 * Lane 00 đã gửi **6 phiếu vào lane 05** nghĩ là thiết kế/nghiên cứu — bên kia 05 là **ARCH**.
 * Và **4 lane `01·02·04·08` chưa từng được dùng** dù bên kia đang chạy chúng.
 * Cầu chở phiếu đúng số nhưng **sai vai** thì kiểm chéo mất tác dụng — người đọc không phải người
 * đáng đọc. ⇒ Lấy bản đồ của Codex làm chuẩn chung, vì nó đầy đủ hơn và đang chạy thật.
 */
const VAI = {
  '00': 'MAIN · điều phối, tổng hợp, viết phiếu',
  '01': 'MEMORY · trí nhớ, chống lặp, chống quên',
  '02': 'RESEARCH / CASE · tra chuẩn ngoài, ca thật',
  '03': 'PRODUCT · quyết định sản phẩm, phạm vi',
  '04': 'DESIGN · thẩm mỹ, bố cục, ngôn ngữ thị giác',
  '05': 'ARCH · kiến trúc hệ thống, hợp đồng, ADR',
  '06': 'BUILD · thi công mã',
  '07': 'QUALITY · bằng chứng, biên nhận, phản biện',
  '08': 'TTT · khách hàng đầu tiên',
  '99': 'tạm / thử',
};
const LANES = new Set(Object.keys(VAI));
const bamNgan = (s) => createHash('sha256').update(s).digest('hex').slice(0, 12);

function docSuKien() {
  if (!existsSync(CAU)) return [];
  return readFileSync(CAU, 'utf8').split('\n').filter(Boolean).flatMap((line) => {
    try { return [JSON.parse(line)]; } catch { return []; }
  });
}

function ghiSuKien(event) {
  mkdirSync(LOG_ROOT, { recursive: true });
  appendFileSync(CAU, `${JSON.stringify(event)}\n`, 'utf8');
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
  if (!LANES.has(from) || !LANES.has(to) || !topic || !body) {
    console.error('Dùng: node scripts/moc.mjs handoff <from-lane> <to-lane> "chủ đề" "nội dung" "nguồn#hash"');
    console.error('  Lane — bản đồ DÙNG CHUNG với Codex, gửi sai số là gửi sai VAI:');
    for (const [k, v] of Object.entries(VAI)) console.error(`    ${k}  ${v}`);
    process.exit(2);
  }
  const createdAt = new Date().toISOString();
  const id = `HO-${createdAt.replace(/\D/g, '').slice(0, 14)}-${bamNgan(`${from}|${to}|${topic}|${body}|${randomUUID()}`)}`;
  ghiSuKien({ schema: 'BOS-HANDOFF-v1', id, type: 'HANDOFF', from, to, topic, body, source, sensitivity: 'BUILDER', createdAt });
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
if (lenh === 'im' || lenh === 'inbox' || lenh === 'peek') {
  const cam = lenh === 'im';
  const chiDoc = lenh !== 'im';
  const lane = process.argv[3];
  if (!LANES.has(lane)) {
    console.error('Dùng: node scripts/moc.mjs inbox <lane>');
    process.exit(2);
  }
  const events = docSuKien();
  const acked = new Set(events.filter((e) => e.type === 'ACK' && e.lane === lane).map((e) => e.handoffId));
  const seen = new Set(events.filter((e) => e.type === 'SEEN' && e.lane === lane).map((e) => e.handoffId));
  const open = events.filter((e) => e.type === 'HANDOFF' && e.to === lane && !acked.has(e.id));
  if (!open.length) {
    if (!cam) console.log(`✅ ${lane}: không có handoff mới`);
    process.exit(0);
  }
  if (cam) console.log(`📬 ${open.length} phiếu CHƯA XỬ LÝ cho lane ${lane} — đọc rồi \`moc.mjs ack ${lane} <id>\`:`);
  for (const e of open) {
    console.log(`${e.id}${seen.has(e.id) ? '' : '  🆕'}\n  ${e.from} → ${e.to} · ${e.topic}\n  ${e.body}\n  nguồn: ${e.source}\n`);
    // SEEN ghi MỘT LẦN cho mỗi phiếu — biên nhận "đã tới mắt", khác hẳn ACK "đã xử lý".
    // CHỈ `im` (hook tại đích) được ghi. `peek`/`inbox` đi qua đây mà không để lại gì.
    if (!chiDoc && !seen.has(e.id)) ghiSuKien({ schema: 'BOS-HANDOFF-v1', id: `SEEN-${randomUUID()}`, type: 'SEEN', lane, handoffId: e.id, createdAt: new Date().toISOString() });
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
  const [hoId, duong, bienNhan] = process.argv.slice(3);
  if (!hoId || !duong) {
    console.error('Dùng: node scripts/moc.mjs sent <handoffId> <đường-giao> [biên-nhận]');
    process.exit(2);
  }
  const co = docSuKien().find((e) => e.type === 'HANDOFF' && e.id === hoId);
  if (!co) { console.error(`Không thấy phiếu ${hoId}.`); process.exit(1); }
  ghiSuKien({ schema: 'BOS-HANDOFF-v1', id: `SENT-${randomUUID()}`, type: 'SENT',
    handoffId: hoId, lane: co.to, transport: duong, receipt: bienNhan ?? null,
    createdAt: new Date().toISOString() });
  console.log(`📤 ${hoId} · đã giao qua ${duong}${bienNhan ? ' · ' + bienNhan : ''}`);
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
  const [handoffId, cach] = process.argv.slice(3);
  if (!handoffId || !cach) {
    console.error('Dùng: node scripts/moc.mjs danh-thuc <handoffId> "<cơ chế đã dùng>"');
    console.error('  Ví dụ: … danh-thuc HO-2026… "SendMessage → local_51cf773f"');
    process.exit(2);
  }
  const events = docSuKien();
  const ho = events.find((e) => e.type === 'HANDOFF' && e.id === handoffId);
  if (!ho) { console.error(`Không có phiếu ${handoffId}`); process.exit(2); }
  ghiSuKien({ schema: 'BOS-HANDOFF-v1', id: `WAKE-${randomUUID()}`, type: 'WAKE',
    handoffId, lane: ho.to, cach, createdAt: new Date().toISOString() });
  console.log(`⏰ đã ghi ĐÁNH THỨC cho ${handoffId} → lane ${ho.to} · ${cach}`);
  process.exit(0);
}

if (lenh === 'chua-nhan') {
  const nguong = Number(process.argv[3] ?? 10);
  const events = docSuKien();
  const sent = new Set(events.filter((e) => e.type === 'SENT').map((e) => e.handoffId));
  const seen = new Set(events.filter((e) => e.type === 'SEEN').map((e) => e.handoffId));
  const acked = new Set(events.filter((e) => e.type === 'ACK').map((e) => e.handoffId));
  const now = Date.now();
  const phutCua = (e) => Math.round((now - Date.parse(e.createdAt)) / 60000);
  const mo = events.filter((e) => e.type === 'HANDOFF' && !acked.has(e.id) && phutCua(e) >= nguong);

  /* HAI RỔ, HAI CÁCH CHỮA KHÁC HẲN — đây là lý do phải tách:
   *   CHƯA GỬI   → chưa ai bấm nút giao. Việc của BƯU TÁ: đi giao.
   *   GỬI RỒI, CHƯA AI NHÌN → đã giao mà đích không mở lên. Việc của NGƯỜI: đánh thức phiên đó.
   * Gộp hai rổ lại thì bưu tá gửi lại phiếu đã gửi — và mỗi lần gửi lại là một cơ hội đẻ
   * biên nhận giả. */
  const chuaGui = mo.filter((e) => !sent.has(e.id));
  const guiRoiChuaNhin = mo.filter((e) => sent.has(e.id) && !seen.has(e.id));

  if (!chuaGui.length && !guiRoiChuaNhin.length) {
    console.log(`✅ không có phiếu nào treo quá ${nguong} phút`);
    process.exit(0);
  }
  for (const e of chuaGui) console.log(`📮 CHƯA GỬI · ${e.id} · lane ${e.to} · ${phutCua(e)} phút · ${e.topic}`);
  for (const e of guiRoiChuaNhin) console.log(`⏳ ĐÃ GỬI, CHƯA AI NHÌN · ${e.id} · lane ${e.to} · ${phutCua(e)} phút · ${e.topic}`);
  process.exit(1);   // exit 1 = CÓ việc phải làm (đi giao, hoặc đánh thức)
}

if (lenh === 'ack') {
  const [lane, handoffId] = process.argv.slice(3);
  if (!LANES.has(lane) || !handoffId) {
    console.error('Dùng: node scripts/moc.mjs ack <lane> <event-id>');
    process.exit(2);
  }
  const target = docSuKien().find((e) => e.type === 'HANDOFF' && e.id === handoffId);
  if (!target || target.to !== lane) {
    console.error(`Không thấy handoff ${handoffId} dành cho lane ${lane}.`);
    process.exit(1);
  }
  ghiSuKien({ schema: 'BOS-HANDOFF-v1', id: `ACK-${randomUUID()}`, type: 'ACK', lane, handoffId, createdAt: new Date().toISOString() });
  console.log(`✅ ${lane} đã nhận ${handoffId}`);
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
