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

const LANES = new Set(['00', '01', '02', '03', '04', '05', '06', '07', '08', '99']);
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
    process.exit(2);
  }
  const createdAt = new Date().toISOString();
  const id = `HO-${createdAt.replace(/\D/g, '').slice(0, 14)}-${bamNgan(`${from}|${to}|${topic}|${body}|${randomUUID()}`)}`;
  ghiSuKien({ schema: 'BOS-HANDOFF-v1', id, type: 'HANDOFF', from, to, topic, body, source, sensitivity: 'BUILDER', createdAt });
  console.log(`${id} · ${from} → ${to} · ${topic}`);
  process.exit(0);
}

if (lenh === 'inbox') {
  const lane = process.argv[3];
  if (!LANES.has(lane)) {
    console.error('Dùng: node scripts/moc.mjs inbox <lane>');
    process.exit(2);
  }
  const events = docSuKien();
  const acked = new Set(events.filter((e) => e.type === 'ACK' && e.lane === lane).map((e) => e.handoffId));
  const open = events.filter((e) => e.type === 'HANDOFF' && e.to === lane && !acked.has(e.id));
  if (!open.length) console.log(`✅ ${lane}: không có handoff mới`);
  for (const e of open) console.log(`${e.id}\n  ${e.from} → ${e.to} · ${e.topic}\n  ${e.body}\n  nguồn: ${e.source}\n`);
  process.exit(0);
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
