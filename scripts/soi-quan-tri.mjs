/**
 * scripts/soi-quan-tri.mjs — MÁY CANH cho `IF-ADVICE-VERIFICATION-GATE-001`.
 *
 * ── VÌ SAO CÓ TỆP NÀY ──────────────────────────────────────────────────────────────────────────
 * Protocol quản trị viết ra ngày 27/08 tự khai ở §8: *"KHÔNG TỰ CHẠY. Hôm nay nó là kỷ luật
 * đọc-và-điền, và đó là điểm yếu lớn nhất của chính nó."* Một protocol không có máy canh thì chết
 * trong ba tuần — đúng như mọi sổ giấy khác đã chết (bài đặt của Hoà 11/08 khi dựng frontier).
 *
 * ── NGUYÊN TẮC CHỌN LUẬT: CHỈ CANH THỨ ĐÃ CẮN ─────────────────────────────────────────────────
 * Bốn luật dưới đây, mỗi luật ứng với **một lỗi đã xảy ra thật**, có số hiệu trong sổ sai lầm.
 * Không luật nào canh một lỗi tưởng tượng. Đây là lý do nó rẻ và là lý do nó đáng tin.
 *
 *   L1 · `EV-*` thiếu `Sensitivity`/`Scope`      ← F-21 (ô để trống là chỗ 23 ảnh lọt qua)
 *   L2 · một quyết định vừa CURRENT vừa SUPERSEDED ← F-19 (ba ô người-ghi cùng sống)
 *   L3 · `PASS` không kèm bề mặt                 ← F-16 (PASS một mình là chữ rỗng)
 *   L4 · chạm LUẬT NỀN mà không trích lý do      ← F-21 (cả hai cùng gật, cùng chưa đọc)
 *
 * ── VÀ MỘT LUẬT CANH CHÍNH SỔ FRONTIER ────────────────────────────────────────────────────────
 *   L5 · entry frontier khai `nhay` khác `public` hoặc có `luatNen` ⇒ **phải** có `dec` + `ev`,
 *        và W2+ phải có `diss`. Đây là chỗ Hoà kiểm soát được protocol bằng MỘT lệnh.
 *
 * Chạy: `npm run soi:quan-tri`
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { FRONTIER } from './frontier-registry.mjs';

const REPO = process.cwd();
const loi = [];
const canhBao = [];

/** Luật nền — phá/nới thì phải trích nguyên văn lý do. Danh sách CỐ Ý NGẮN. */
const LUAT_NEN = ['.gitignore', 'CLAUDE.md', 'docs/control/IF-CANONICAL.md', 'prisma/schema.prisma'];

function moiTepMd(goc) {
  const ra = [];
  const di = (d) => {
    for (const t of readdirSync(d)) {
      const p = path.join(d, t);
      if (t === 'node_modules' || t.startsWith('.')) continue;
      const st = statSync(p);
      if (st.isDirectory()) di(p);
      else if (t.endsWith('.md')) ra.push(p);
    }
  };
  di(goc);
  return ra;
}

const tepDocs = moiTepMd(path.join(REPO, 'docs'));

/* ═══ L1 · EV-* phải khai Sensitivity và Scope ═══════════════════════════════════════════════
 * Đây là ô đã bắt được case 23 ảnh: `EV-001` là bằng chứng MẠNH cho "UI hiện ra thế nào" nhưng
 * `Sensitivity: client-data` và `Scope` không khớp câu hỏi đang hỏi. Ô để trống = lọt.
 * Chỉ soi những tệp THẬT SỰ khai bằng chứng (có dòng bắt đầu bằng `EV-<số>`), không soi mọi
 * chỗ nhắc tới chuỗi "EV-" trong văn xuôi. */
for (const tep of tepDocs) {
  const noi = readFileSync(tep, 'utf8');
  const khoi = [...noi.matchAll(/^\s*(?:###\s*)?`?(EV-\d+)`?\b([\s\S]{0,900}?)(?=^\s*(?:###\s*)?`?EV-\d+`?\b|^\s*##\s|$(?![\s\S]))/gm)];
  for (const [, ma, than] of khoi) {
    const thieu = [];
    if (!/Sensitivity/i.test(than)) thieu.push('Sensitivity');
    if (!/Scope/i.test(than)) thieu.push('Scope');
    if (thieu.length) {
      loi.push(`L1 · ${path.relative(REPO, tep)} — \`${ma}\` thiếu ô bắt buộc: ${thieu.join(', ')}.
       Ô để trống chính là chỗ 23 ảnh lọt qua (F-21). Không cần ai tinh ý — chỉ cần điền.`);
    }
  }
}

/* ═══ L2 · một quyết định KHÔNG được vừa CURRENT vừa SUPERSEDED/REJECTED ═════════════════════
 * F-19: `IF-CURRENT-STATE.md` từng mang BA ô người-ghi cùng sống vì artifact mới dán lên mà
 * artifact cũ không ai đóng dấu. Hai sự thật cùng sống thì phiên nguội đọc trúng cái nào là hên xui. */
for (const tep of tepDocs) {
  const noi = readFileSync(tep, 'utf8');
  /* Cắt tệp thành khối theo mốc `IF-DEC-<n>` rồi soi TỪNG khối. Lượt đầu tôi dùng lookahead có
   * `\Z` — cú pháp Python/PCRE, trong JS nó khớp chữ 'Z' ⇒ khối không bao giờ đóng đúng ⇒ máy
   * soi CÂM. Kiểm đột biến bắt được. Nay cắt bằng chỉ số, không bằng lookahead — ít mẹo hơn,
   * và cái gì ít mẹo hơn thì ít câm hơn. */
  const moc = [...noi.matchAll(/`?(IF-DEC-\d+)`?/g)];
  for (let k = 0; k < moc.length; k++) {
    const ma = moc[k][1];
    const batDau = moc[k].index ?? 0;
    const ketThuc = k + 1 < moc.length ? (moc[k + 1].index ?? noi.length) : noi.length;
    const than = noi.slice(batDau, Math.min(ketThuc, batDau + 700));
    const co = (t) => new RegExp(`\\b${t}\\b`).test(than);
    if (co('CURRENT') && (co('SUPERSEDED') || co('REJECTED'))) {
      loi.push(`L2 · ${path.relative(REPO, tep)} — \`${ma}\` vừa CURRENT vừa SUPERSEDED/REJECTED.
       Hai sự thật cùng sống (F-19). Đóng dấu cái cũ TRƯỚC, rồi cập nhật mọi pointer.`);
    }
  }
}

/* ═══ L3 · ĐÃ BỎ — và lý do đáng ghi hơn cả luật ═══════════════════════════════════════════
 *
 * L3 định canh: `PASS` phải kèm bề mặt đã chạm (F-16). Ý đúng. **Máy soi thì sai.**
 *
 * Lượt chạy đầu: kêu **10 chỗ, cả 10 đều oan** — chúng chỉ đang BÀN VỀ chữ `PASS`
 * (*"chưa cái nào PASS"*, *"Quality mới nâng PASS"*, *"chưa dùng để cấp PASS được"*).
 * Siết lại còn 6, vẫn **5 oan**. Và chỗ thứ sáu — `**PASS ở tầng máy chủ**` — **có** nêu bề mặt,
 * chỉ là không đúng dấu câu tôi bắt.
 *
 * Máy phân biệt được **tuyên bố** với **bàn luận** thì cần hiểu ngữ cảnh; ở đó regex thua. Và
 * một cổng kêu oan là một cổng sẽ bị tắt — đúng bài học **F-02** mà tôi vừa trích trong chính
 * chú thích của luật này. Ship nó là tự tay dựng thứ mình vừa cấm.
 *
 * ⇒ **Bỏ.** Luật F-16 ở lại trong sổ như luật ĐỌC, không thành luật MÁY. Một luật máy không canh
 * chính xác được thì đáng bỏ hơn đáng ship — thà biết mình đang dựa vào kỷ luật người, còn hơn
 * tưởng có máy canh trong khi cái máy đó đang kêu bừa. Ai làm được phiên bản chính xác thì mở
 * lại; đừng mở lại bằng regex.
 */

/* ═══ L4 · CHẠM LUẬT NỀN ⇒ PHẢI TRÍCH LÝ DO ═════════════════════════════════════════════════
 * Đây là luật rẻ nhất và bắt đúng loại lỗi vừa xảy ra. Codex đề xuất phá `.gitignore` mà chưa
 * đọc nhãn của nó; MAIN gật theo. Cả hai đều đủ giỏi — chỉ là không ai mở tệp ra đọc.
 * Máy soi cây LÀM VIỆC (chưa commit): chạm luật nền mà không có `IF-DEC-*` nào khai `luatNen`
 * tương ứng ⇒ CẢNH BÁO. Không chặn cứng, vì sửa một dòng chú thích trong `CLAUDE.md` không đáng
 * một thẻ quyết định — nhưng phải kêu để người sửa nhìn thấy. */
{
  let doi = [];
  try {
    doi = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' })
      .split('\n').map((l) => l.slice(3).trim()).filter(Boolean);
  } catch { /* không phải repo git — bỏ qua */ }
  const chamLuat = LUAT_NEN.filter((l) => doi.includes(l));
  if (chamLuat.length) {
    const khai = FRONTIER.flatMap((e) => e.quanTri?.luatNen ?? []);
    for (const l of chamLuat) {
      if (!khai.includes(l)) {
        canhBao.push(`L4 · đang sửa LUẬT NỀN \`${l}\` mà không entry frontier nào khai \`luatNen\` chứa nó.
       Trước khi phá/nới một luật: MỞ TỆP, ĐỌC LÝ DO, TRÍCH NGUYÊN VĂN (F-21). Không trích được
       ⇒ chưa đủ tư cách đề xuất.`);
      }
    }
  }
}

/* ═══ L5 · SỔ FRONTIER — chỗ Hoà kiểm soát bằng MỘT lệnh ════════════════════════════════════
 * Entry nhạy cảm hoặc chạm luật nền thì phải có thẻ quyết định + bằng chứng; W2+ phải có phản
 * biện độc lập. `quanTri` cố ý TUỲ CHỌN cho 90% entry còn lại — bắt mọi entry điền là cách nhanh
 * nhất giết một protocol. */
for (const e of FRONTIER) {
  const q = e.quanTri;
  if (!q) continue;
  const nhayCam = q.nhay && q.nhay !== 'public';
  const chamLuat = (q.luatNen ?? []).length > 0;
  if ((nhayCam || chamLuat) && !q.dec) {
    loi.push(`L5 · frontier \`${e.id}\` — nhạy cảm (${q.nhay}) hoặc chạm luật nền nhưng KHÔNG có \`dec\`.`);
  }
  if ((nhayCam || chamLuat) && !(q.ev ?? []).length) {
    loi.push(`L5 · frontier \`${e.id}\` — không có \`ev\`. Không bằng chứng ⇒ chỉ được ghi UNKNOWN, cấm nói thành fact.`);
  }
  if ((q.bac === 'W2' || q.bac === 'W3') && !q.diss) {
    canhBao.push(`L5 · frontier \`${e.id}\` — bậc ${q.bac} nhưng chưa có \`diss\` (phản biện độc lập).`);
  }
  if (q.bac === 'W3' && !q.gate) {
    canhBao.push(`L5 · frontier \`${e.id}\` — bậc W3 nhưng chưa có \`gate\`.`);
  }
}

/* ═══ BÁO CÁO ═══════════════════════════════════════════════════════════════════════════════ */
const coQuanTri = FRONTIER.filter((e) => e.quanTri);
console.log('SOI QUẢN TRỊ · IF-ADVICE-VERIFICATION-GATE-001');
console.log(`  entry frontier: ${FRONTIER.length} · có \`quanTri\`: ${coQuanTri.length}`);
for (const e of coQuanTri) {
  const q = e.quanTri;
  console.log(`    · ${e.id.padEnd(24)} ${q.bac} · ${q.nhay} · ${q.dec ?? '—'} · ev ${(q.ev ?? []).length} · diss ${q.diss ?? '—'}`);
}
console.log(`  tệp .md đã soi: ${tepDocs.length}`);

if (canhBao.length) {
  console.log(`\n🟡 ${canhBao.length} CẢNH BÁO`);
  for (const c of canhBao) console.log(`  ${c}`);
}
if (loi.length) {
  console.log(`\n🔴 ${loi.length} VI PHẠM CHẶN`);
  for (const l of loi) console.log(`  ${l}`);
  console.log('\nCổng đỏ. Xem `docs/control/IF-ADVICE-VERIFICATION-GATE.md`.');
  process.exit(1);
}
console.log('\n🟢 Cổng quản trị XANH.');
