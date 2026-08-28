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
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';

const REPO = process.cwd();
const SO = path.join(REPO, 'docs/control/IF-MOC.md');
const KHO = path.join(os.homedir(), '.claude/projects/-Users-tranben-Downloads-interiorflow');

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
