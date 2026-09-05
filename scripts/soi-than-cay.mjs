#!/usr/bin/env node
/**
 * scripts/soi-than-cay.mjs — MÁY CANH THÂN CÂY.
 *
 * ─── VÌ SAO CÓ TỆP NÀY (05/09) ────────────────────────────────────────────────────────────
 * Hoà: "chuyện này không phải bị lần đầu, bị hoài — cần giải pháp triệt để."
 * Đo tại nguồn hôm đó, bốn con số nói hết:
 *
 *   · 14 PR đang mở · 13 là bản nháp · cái cũ nhất mở 31/08 · **0 cái đã gộp vào main**
 *   · 12/12 nhánh `claude/slice-*` NẰM TRỌN trong nhánh làm việc ⇒ **không mất việc nào**,
 *     nhưng 12 PR đó vẫn treo — tức chúng là SỔ SÁCH MỐC, không phải việc dở
 *   · `main` đứng yên từ 03/09 trong khi nhánh làm việc đi trước **565 commit**
 *   · 20 commit gần nhất của `main` đều là commit THẲNG — **không một commit gộp nào**
 *
 * ⇒ GỐC BỆNH KHÔNG PHẢI "QUÊN GỘP". Có HAI hệ chạy song song:
 *     ① hệ THẬT   — làm trên nhánh phiên, thỉnh thoảng đẩy thẳng vào `main`
 *     ② hệ NGHI LỄ — PR tự mở theo luật, không luật nào ĐÓNG chúng
 *   Cửa VÀO có, cửa RA không. Mọi hệ như thế đều phình, và khi phình thì danh sách PR THÔI
 *   LÀM TÍN HIỆU: 14 dòng mà 12 dòng đã được chứa trọn ⇒ 2 dòng đáng đọc bị chôn.
 *
 *   Và hệ quả nặng hơn: **`main` thôi làm thân cây.** Không ai gộp vào nó, nên mỗi phiên phải
 *   tự quyết "nhánh nào là thật" — đó chính là chỗ đẻ ra `integration/...`, `nen-checkpoint`,
 *   `dung-mac`, `dung-checkpoint`, và cả lần lệch 2 commit phải gộp tay hôm 05/09.
 *
 * ─── VÌ SAO PHẢI LÀ MÁY, KHÔNG PHẢI THÓI QUEN ────────────────────────────────────────────
 * Repo này đã trả giá nhiều lần cho cùng một bài học: luật nằm trong sổ thì trôi, luật nằm
 * trong máy thì sống. `soi:frontier` sinh ra vì sổ giấy quên; máy này sinh ra vì **thân cây
 * chẻ đôi là thứ không ai thấy cho tới lúc phải gộp tay**.
 *
 * ─── ĐO GÌ (thuần git, chạy offline, không cần token) ────────────────────────────────────
 *   ① THÂN CÂY TỤT   — `main` tụt sau nhánh sống nhất bao nhiêu commit / bao nhiêu ngày
 *   ② NHÁNH MA       — nhánh chưa gộp NHƯNG nằm TRỌN trong một nhánh khác ⇒ việc đã được
 *                      chứa, nhánh chỉ còn là sổ sách; PR của nó là PR ma
 *   ③ NHÁNH BỎ HOANG — chưa gộp, không nằm trong nhánh nào, im lặng quá N ngày
 *   ④ THÂN CÂY CHẺ   — hai nhánh cùng đi trước `main` mà KHÔNG nhánh nào chứa nhánh kia
 *                      ⇒ đang có hai "sự thật" song song. Đây là ca đắt nhất.
 *
 * ⚠️ MÁY NÀY KHÔNG XOÁ, KHÔNG GỘP, KHÔNG ĐÓNG PR. Nó chỉ ĐO và NÓI. Quyết định gộp/xoá là
 * việc của người — đúng luật đã ghi ở `soi-cam-dien.mjs`: máy phân loại hộ là máy vượt quyền.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const git = (...a) => execFileSync('git', a, { encoding: 'utf8' }).trim();
const soDong = (s) => (s ? s.split('\n').filter(Boolean) : []);
const CHAN = process.argv.includes('--chan');
const THAN = process.env.IF_THAN_CAY || 'origin/main';

/* Nhánh hạ tầng: cố ý sống lâu, KHÔNG tính là thân cây chẻ. Khai tường minh, không đoán. */
const HA_TANG = [/^origin\/dung-/, /^origin\/backup\//, /^origin\/worktree-agent-/];
const laHaTang = (b) => HA_TANG.some((r) => r.test(b));

let tt = 0;
const bao = (s) => console.log(s);

const tatCa = soDong(git('branch', '-r', '--format=%(refname:short)')).filter((b) => !b.includes('HEAD'));
const chuaGop = soDong(git('branch', '-r', '--no-merged', THAN, '--format=%(refname:short)')).filter((b) => !b.includes('HEAD'));
const ngay = (b) => git('log', '-1', '--format=%ad', '--date=short', b);
const soNgay = (b) => Math.round((Date.now() - Number(git('log', '-1', '--format=%at', b)) * 1000) / 86400000);
const truoc = (b) => Number(git('rev-list', '--count', `${THAN}..${b}`));
const chua = (a, b) => { // a nằm trọn trong b?
  try { execFileSync('git', ['merge-base', '--is-ancestor', a, b], { stdio: 'ignore' }); return true; } catch { return false; }
};

bao(`\n🌳 THÂN CÂY — ${THAN} · ${tatCa.length} nhánh · ${chuaGop.length} chưa gộp\n`);

/* ── ① THÂN CÂY TỤT ───────────────────────────────────────────────────────────────────── */
const song = chuaGop.map((b) => ({ b, truoc: truoc(b), ngay: ngay(b), nghi: soNgay(b) })).sort((x, y) => y.truoc - x.truoc);
const dan = song[0];
if (dan) {
  const ff = chua(THAN, dan.b);
  bao(`① THÂN CÂY TỤT`);
  bao(`   ${THAN} (${ngay(THAN)}) tụt sau ${dan.b} — ${dan.truoc} commit`);
  bao(`   ${ff ? '✅ ĐI THẲNG ĐƯỢC (fast-forward), 0 xung đột — gộp là một lệnh'
             : '⚠️ KHÔNG fast-forward — hai bên đã rẽ, gộp phải xử xung đột'}`);
  if (dan.truoc > 0) tt++;
}

/* ── ② NHÁNH MA ───────────────────────────────────────────────────────────────────────── */
const ma = [];
for (const x of song) {
  const trong = chuaGop.find((k) => k !== x.b && chua(x.b, k));
  if (trong) ma.push({ ...x, trong });
}
bao(`\n② NHÁNH MA — chưa gộp, nhưng NỘI DUNG ĐÃ NẰM TRỌN trong nhánh khác: ${ma.length}`);
for (const m of ma) bao(`   👻 ${m.b.padEnd(48)} ⊂ ${m.trong}`);
if (ma.length) {
  bao(`   ⓘ Việc KHÔNG mất — đã được chứa. Thứ còn treo là SỔ SÁCH: nhánh + PR của nó.`);
  bao(`   ⓘ Đóng PR + xoá nhánh là DỌN TÍN HIỆU, không phải bỏ việc.`);
  tt++;
}

/* ── ③ NHÁNH BỎ HOANG ─────────────────────────────────────────────────────────────────── */
const NGUONG_NGAY = 14;
const hoang = song.filter((x) => !ma.some((m) => m.b === x.b) && x.nghi > NGUONG_NGAY);
bao(`\n③ NHÁNH BỎ HOANG — chưa gộp, không nằm trong nhánh nào, im > ${NGUONG_NGAY} ngày: ${hoang.length}`);
for (const h of hoang) bao(`   🕸  ${h.b.padEnd(48)} ${h.nghi} ngày · ${h.truoc} commit riêng`);
if (hoang.length) { bao(`   ⓘ Đây mới là chỗ CÓ THỂ mất việc thật — mỗi nhánh phải được phân loại: cứu hay khai tử.`); tt++; }

/* ── ④ THÂN CÂY CHẺ ───────────────────────────────────────────────────────────────────── */
const ungVien = song.filter((x) => x.truoc >= 20 && !laHaTang(x.b) && !ma.some((m) => m.b === x.b));
const che = [];
for (let i = 0; i < ungVien.length; i++)
  for (let j = i + 1; j < ungVien.length; j++)
    if (!chua(ungVien[i].b, ungVien[j].b) && !chua(ungVien[j].b, ungVien[i].b))
      che.push([ungVien[i], ungVien[j]]);
bao(`\n④ THÂN CÂY CHẺ — hai nhánh cùng đi trước ${THAN} mà không nhánh nào chứa nhánh kia: ${che.length} cặp`);
for (const [a, b] of che) {
  const rieng = Number(git('rev-list', '--count', `${b.b}..${a.b}`));
  const rieng2 = Number(git('rev-list', '--count', `${a.b}..${b.b}`));
  bao(`   ⚡ ${a.b} (riêng ${rieng}) ⟷ ${b.b} (riêng ${rieng2})`);
}
if (che.length) {
  bao(`   ⛔ ĐÂY LÀ CA ĐẮT NHẤT: mỗi nhánh là một "sự thật", và mỗi phiên mới phải TỰ ĐOÁN`);
  bao(`      nhánh nào là thật. Càng để lâu càng lệch, và lệch thì gộp tay — đúng chỗ mất giờ.`);
  tt++;
}

/* ── TRẦN (bánh cóc) ──────────────────────────────────────────────────────────────────── */
let tran = null;
try { tran = JSON.parse(readFileSync(new URL('./foundation-tran.json', import.meta.url), 'utf8')); } catch {}
const soCheck = { 'T-than-cay-tut': dan ? dan.truoc : 0, 'T-nhanh-ma': ma.length, 'T-nhanh-hoang': hoang.length, 'T-than-cay-che': che.length };
bao('\n' + '─'.repeat(96));
let vuot = 0;
for (const [k, v] of Object.entries(soCheck)) {
  const t = tran && k in tran ? tran[k] : null;
  if (t === null) { bao(`   bánh cóc ${k.padEnd(22)} ${String(v).padStart(4)} / trần CHƯA KHAI`); continue; }
  const co = v > t;
  if (co) vuot++;
  bao(`   ${co ? '🔴' : '  '} bánh cóc ${k.padEnd(22)} ${String(v).padStart(4)} / trần ${t}`);
}
bao(`\n🌳 ${tt}/4 dấu hiệu có mặt${vuot ? ` · 🔴 ${vuot} bánh cóc VƯỢT TRẦN` : ''}`);
bao('   ⛔ Máy này KHÔNG gộp, KHÔNG xoá, KHÔNG đóng PR — nó chỉ đo và nói. Quyết là việc của người.\n');
if (CHAN && vuot) process.exitCode = 1;
