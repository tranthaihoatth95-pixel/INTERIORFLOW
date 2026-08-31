#!/usr/bin/env node
/**
 * soi-cau.mjs — GHI PHIẾU KHÔNG PHẢI GIAO VIỆC.
 *
 * ══ LUẬT, Hoà chốt 30/08/2026 ══
 *   *"Thì phải ràng buộc chứ. Hệ AI nào đang giao việc thì hệ đó phải TỰ ĐÁNH THỨC.
 *   Bạn là main bên đầu Claude, ngang hàng với main bên đầu Codex hay hệ Agent khác."*
 *
 * ══ CA THẬT SINH RA LUẬT ══
 * 30/08 lane 00 ghi hai phiếu quan trọng vào cầu (bản đồ nghiên cứu 38 lĩnh vực), rồi coi như đã
 * giao. Lane 05 **đang mở và rảnh** — nó vừa giao xong hai đặc tả trước đó — nhưng **không biết có
 * việc mới**, vì `moc.mjs handoff` CHỈ GHI VÀO SỔ. Hai phiếu nằm im tới khi Hoà hỏi *"lane 5 đâu?"*.
 *
 * Điều đáng nói: lane 00 **đã tự viết giới hạn này** vào `.claude/settings.json` từ 29/08 —
 * *"hook chạy ở ranh giới lượt, không phải chuông; thứ đánh thức được một phiên đang sống là
 * SendMessage"* — rồi hôm sau vi phạm chính nó. **Biết mà vẫn quên là bằng chứng cần cổng, không
 * phải cần nhắc.**
 *
 * ══ CẦU LÀ GÌ — Hoà nói rõ 30/08, và nó KHÔNG phải cái tôi tưởng ══
 *   *"Cầu chỉ giao phiếu để KIỂM CHÉO, làm sao mọi thứ đều có người kiểm kê,
 *   CHỐNG SUY DIỄN CÙNG HỆ AGENT diễn ra thôi."*
 *
 * ⇒ Cầu **không phải đường giao việc**. Nó là **sổ để bên khác kiểm chéo**.
 * Giá trị của nó nằm ở chỗ: thứ do hệ này làm ra thì **hệ khác** đọc và đối chiếu — Claude viết
 * thì Codex soi, và ngược lại. Một hệ tự kiểm chính mình thì nó chỉ xác nhận lại suy diễn của
 * chính nó; đó đúng là bài học **M-59** ở tầng tổ chức: phép đo tự soi mình là phép đo rỗng.
 *
 * ⇒ Hai việc TÁCH HẲN, và lẫn chúng là gốc của lỗi 30/08:
 *     GIAO VIỆC   việc của BÊN GIAO — tự đánh thức bằng cơ chế hệ mình
 *     KIỂM CHÉO   việc của CẦU — để phiếu có người thứ hai đối chiếu, khác hệ
 *
 * ══ CHUỖI BIÊN NHẬN ĐẦY ĐỦ — mỗi mắt một người khác ghi ══
 * ```
 *   HANDOFF  bên giao viết phiếu
 *   WAKE     BÊN GIAO tự đánh thức bằng cơ chế của hệ mình   ← mắt này từng thiếu
 *   SENT     bưu tá ghi khi chuyển
 *   SEEN     hook tại đích ghi khi phiếu tới mắt
 *   ACK      lane nhận việc ghi
 * ```
 * Thiếu `WAKE` thì `HANDOFF → SEEN` không có gì ở giữa, và đó chính là chỗ hệ thống được phép nói
 * dối câu *"đã giao rồi"*. Nay không nói dối được: không có WAKE thì **chưa ai được gọi**.
 *
 * ══ NÓ CANH GÌ ══
 * Mọi phiếu chưa `ACK`, quá `NGUONG_PHUT`, mà **không có mắt `WAKE`** ⇒ đỏ.
 * Phiếu vừa ghi xong thì bỏ qua — bên giao cần vài phút để đánh thức, đỏ ngay là đỏ oan.
 *
 * ⛔ CHẶN (`--chan` → exit 1). Ghi phiếu rồi bỏ đó là mất việc trong im lặng, đúng loại lỗi
 * không ai phát hiện cho tới khi có người hỏi.
 */

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { khoaHandoff } from './cau-mo-hinh.mjs';

const CAU = path.join(process.env.BOS_SHARED_LOG_ROOT || path.join(os.homedir(), 'PROJECT/SHARED/LOG'),
  'agent-handoffs.jsonl');

/** Bên giao có ngần này phút để đánh thức trước khi cổng kêu. */
const NGUONG_PHUT = Number(process.env.IF_NGUONG_DANH_THUC ?? 15);

const chan = process.argv.includes('--chan');

if (!existsSync(CAU)) {
  console.log('── cầu bàn giao ──');
  console.log('  (chưa có sổ cầu — không có gì để soi)');
  process.exit(0);
}

const su = readFileSync(CAU, 'utf8').split('\n').filter(Boolean)
  .flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } });

const acked = new Set(su.filter((e) => e.type === 'ACK').map(khoaHandoff));
const wake = new Map();
// `WAKE` là schema cũ; `WAKE_ATTEMPTED` nói đúng hơn và không giả đã tới mắt.
for (const e of su) if (e.type === 'WAKE' || e.type === 'WAKE_ATTEMPTED') wake.set(khoaHandoff(e), e);

const now = Date.now();
const phut = (e) => Math.round((now - Date.parse(e.createdAt)) / 60000);

const mo = su.filter((e) => e.type === 'HANDOFF' && !acked.has(khoaHandoff(e)));
const quaHan = mo.filter((e) => phut(e) >= NGUONG_PHUT);
const chuaDanhThuc = quaHan.filter((e) => !wake.has(khoaHandoff(e)));

console.log('── cầu bàn giao · phiếu đã GHI nhưng chưa GIAO ──');
console.log('  (cầu = sổ KIỂM CHÉO giữa các hệ agent, KHÔNG phải đường giao việc)');
console.log(`  ${mo.length} phiếu đang mở · ${quaHan.length} quá ${NGUONG_PHUT} phút · ${mo.length - quaHan.length} còn trong hạn`);

for (const e of quaHan) {
  const w = wake.get(khoaHandoff(e));
  if (w) console.log(`  ✅ ${e.id}  → ${e.to}  · đánh thức bằng: ${w.cach}`);
  else console.log(`  🔴 ${e.id}  → ${e.to}  · ${phut(e)} phút · CHƯA AI ĐÁNH THỨC\n       "${(e.topic ?? '').slice(0, 76)}"`);
}

if (chuaDanhThuc.length) {
  console.log(`\n  🔴 ${chuaDanhThuc.length} phiếu ĐÃ GHI mà CHƯA GIAO.`);
  console.log('  Cầu chỉ chở nội dung — nó KHÔNG đánh thức ai. Bên giao phải tự gọi bằng cơ chế');
  console.log('  của hệ mình (Claude Code: SendMessage · Codex: cơ chế phía đó · người: mở phiên),');
  console.log('  rồi ghi lại:  node scripts/moc.mjs danh-thuc <handoffId> "<cơ chế đã dùng>"');
  console.log('  ⛔ Không có cờ bỏ qua. Ghi "đã báo" mà không nói cơ chế cũng không tính.');
  if (chan) process.exit(1);
} else {
  console.log('\n  ✅ Mọi phiếu quá hạn đều đã có mắt ĐÁNH THỨC.');
}
