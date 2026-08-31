/**
 * CA ĐỘT BIẾN cho `cau-mo-hinh.mjs` — ba việc từ DISS REVISE của Codex
 * (phiếu `HO-20260830120509-23fe0005a0a2`).
 *
 * Luật của repo: *một luật chỉ là luật khi có chỗ được nạp · một cổng · một ca đột biến chứng
 * minh cổng bắt được*. Mỗi nhóm dưới đây có CẢ ca mong ĐỎ lẫn ca mong XANH — theo F-17, nhóm
 * chỉ toàn kỳ vọng phủ định thì không tin được (nó xanh cả khi cổng chết hẳn).
 *
 * ⚠️ Ca số ① là ca THẬT, không phải fixture bịa: đúng dấu thời gian của phiếu
 * `HO-20260830100659-a7557134a95d` — HANDOFF 10:06:59 → SEEN 10:12:38 → WAKE 10:25:23, KHÔNG có
 * SENT. Bản cũ xếp nó vào "CHƯA GỬI" và không có lối ra.
 */
// `import` tĩnh không dùng được: sucrase-node biên ra CommonJS, mà `cau-mo-hinh.mjs` là ESM
// (cùng khuôn mọi máy trong `scripts/`). Nạp động — vẫn là CÙNG MỘT tệp luật.

void (async () => {
const nap = new Function('u', 'return import(u)') as (u: string) => Promise<any>;
const M = await nap(new URL('./cau-mo-hinh.mjs', `file://${__dirname}/`).href);

let ok = 0, fail = 0;
const la = (ten: string, duoc: unknown, mong: unknown) => {
  const d = JSON.stringify(duoc), m = JSON.stringify(mong);
  if (d === m) { ok++; console.log(`  ok  - ${ten}`); }
  else { fail++; console.log(`  FAIL- ${ten}\n        mong ${m}\n        được ${d}`); }
};

/* ════════ ① PHÂN RỔ — rổ "CHƯA GỬI" phải có lối ra ════════ */
console.log('\n[①] PHÂN RỔ — SEEN/WAKE bao hàm SENT');

const BAY_GIO = Date.parse('2026-08-30T11:00:00.000Z');
const ho = (id: string, luc: string) => ({ type: 'HANDOFF', id, to: '06', topic: `phiếu ${id}`, createdAt: luc });
const mat = (type: string, handoffId: string) => ({ type, handoffId, lane: '06', createdAt: '2026-08-30T10:30:00.000Z' });

// CA THẬT: phiếu ROLE-GUARD — có SEEN + WAKE, KHÔNG có SENT.
const caThat = [
  ho('HO-20260830100659-a7557134a95d', '2026-08-30T10:06:59.000Z'),
  { ...mat('SEEN', 'HO-20260830100659-a7557134a95d'), createdAt: '2026-08-30T10:12:38.000Z' },
  { ...mat('WAKE', 'HO-20260830100659-a7557134a95d'), createdAt: '2026-08-30T10:25:23.000Z' },
];
const r1 = M.phanRo(caThat, 10, BAY_GIO);
la('① phiếu có SEEN+WAKE mà KHÔNG có SENT → KHÔNG còn nằm ở "CHƯA GỬI"', r1.chuaGui.length, 0);
la('①  … và rơi vào rổ THỨ BA "đã nhìn, chưa xử lý" (không được biến mất)', r1.daNhinChuaXuLy.map((e: any) => e.id), ['HO-20260830100659-a7557134a95d']);

// Ca mong ĐỎ — thật sự chưa ai giao: chỉ có HANDOFF.
const r2 = M.phanRo([ho('HO-A', '2026-08-30T10:00:00.000Z')], 10, BAY_GIO);
la('① phiếu TRƠ TRỌI (không SENT/WAKE/SEEN) → vẫn ở "CHƯA GỬI"', r2.chuaGui.map((e: any) => e.id), ['HO-A']);

// WAKE mà chưa SEEN → rổ giữa. Đây là ca phân biệt hai cách chữa khác hẳn nhau.
const r3 = M.phanRo([ho('HO-B', '2026-08-30T10:00:00.000Z'), mat('WAKE', 'HO-B')], 10, BAY_GIO);
la('① đã WAKE mà chưa SEEN → rổ "đã gửi, chưa ai nhìn"', [r3.chuaGui.length, r3.daGuiChuaNhin.map((e: any) => e.id)], [0, ['HO-B']]);

// SENT vẫn còn giá trị cho tuyến có bưu tá thật — không được bỏ mắt này.
const r4 = M.phanRo([ho('HO-C', '2026-08-30T10:00:00.000Z'), mat('SENT', 'HO-C')], 10, BAY_GIO);
la('① SENT vẫn tính là đã giao (tuyến có bưu tá thật)', r4.chuaGui.length, 0);

// ACK rồi thì biến khỏi mọi rổ.
const r5 = M.phanRo([ho('HO-D', '2026-08-30T10:00:00.000Z'), mat('SEEN', 'HO-D'), { type: 'ACK', handoffId: 'HO-D', lane: '06', outcome: 'DONE' }], 10, BAY_GIO);
la('① đã ACK → rỗng cả ba rổ', [r5.chuaGui.length, r5.daGuiChuaNhin.length, r5.daNhinChuaXuLy.length], [0, 0, 0]);

// Chưa quá ngưỡng thì chưa réo.
const r6 = M.phanRo([ho('HO-E', '2026-08-30T10:59:00.000Z')], 10, BAY_GIO);
la('① mới 1 phút, dưới ngưỡng 10 → chưa réo', r6.chuaGui.length, 0);

/* ════════ Đọc ngược biên nhận CŨ — không viết lại lịch sử ════════ */
console.log('\n[①b] BIÊN NHẬN CŨ — đọc được, không bị sửa');
la('①b ACK cũ (chỉ có `noted`) → đọc thành DONE-không-bằng-chứng, có cờ suyRa',
  M.docAck({ type: 'ACK', noted: 'gộp xong hai chỗ' }),
  { outcome: 'DONE', evidence: null, blocker: null, note: 'gộp xong hai chỗ', suyRa: true });
la('①b ACK mới → đọc nguyên, KHÔNG suy ra',
  M.docAck({ type: 'ACK', outcome: 'PARTIAL', evidence: 'npm test', note: null }),
  { outcome: 'PARTIAL', evidence: 'npm test', blocker: null, note: null, suyRa: false });
la('①b phanRo nêu tên ACK cũ để người ta biết mà không tin nhầm',
  M.phanRo([{ type: 'ACK', handoffId: 'HO-X', noted: 'ok' }], 10, BAY_GIO).ackCu.length, 1);

/* ════════ ② BIÊN NHẬN CÓ CẤU TRÚC ════════ */
console.log('\n[②] ACK CÓ CẤU TRÚC — bằng chứng phải mở lại được');

const cham = (o: any) => M.chamAck(o).ok;
la('② DONE + đường dẫn kèm số dòng → NHẬN', cham({ outcome: 'DONE', evidence: 'components/studio/LockScreen.tsx:412' }), true);
la('② DONE + lệnh chạy lại được → NHẬN', cham({ outcome: 'DONE', evidence: 'npm test' }), true);
la('② DONE + hash commit → NHẬN', cham({ outcome: 'DONE', evidence: 'ba3668ff' }), true);
la('② SUPERSEDED + id phiếu thay thế → NHẬN', cham({ outcome: 'SUPERSEDED', evidence: 'HO-20260830101114-3d8077bcaae3' }), true);
la('② BLOCKED + tên cái đang chặn → NHẬN', cham({ outcome: 'BLOCKED', evidence: 'cần Hoà chốt trực tiếp' }), true);

// Ca ĐỎ — đúng những thứ bản cũ cho lọt.
la('② ⛔ "xong" (rác kinh điển của bản free-text) → CHẶN', cham({ outcome: 'DONE', evidence: 'xong' }), false);
la('② ⛔ "ok" → CHẶN', cham({ outcome: 'DONE', evidence: 'ok' }), false);
la('② ⛔ DONE mà KHÔNG có bằng chứng → CHẶN', cham({ outcome: 'DONE', evidence: '' }), false);
la('② ⛔ PARTIAL mà không có bằng chứng → CHẶN', cham({ outcome: 'PARTIAL', evidence: '  ' }), false);
la('② ⛔ BLOCKED mà không nêu tên cái chặn → CHẶN', cham({ outcome: 'BLOCKED', evidence: '' }), false);
la('② ⛔ SUPERSEDED trơ trọi → CHẶN', cham({ outcome: 'SUPERSEDED', evidence: '' }), false);
la('② ⛔ outcome bịa → CHẶN', cham({ outcome: 'FINISHED', evidence: 'npm test' }), false);
la('② ⛔ thiếu outcome hẳn (đúng dạng lệnh CŨ 3 tham số) → CHẶN', cham({ outcome: undefined, evidence: 'gộp xong hai chỗ dựng câu' }), false);
la('② ⛔ câu văn xuôi dài, nghe rất đúng, nhưng không mở lại được → CHẶN',
  cham({ outcome: 'DONE', evidence: 'đã gộp hai chỗ dựng câu danh ngôn về một khuôn duy nhất' }), false);
la('② ⛔ note dài quá trần (bài văn) → CHẶN', cham({ outcome: 'DONE', evidence: 'npm test', note: 'x'.repeat(241) }), false);
la('② note vừa trần → NHẬN', cham({ outcome: 'DONE', evidence: 'npm test', note: 'x'.repeat(240) }), true);

/* ════════ ③ SỔ LANE ↔ PHIÊN ════════ */
console.log('\n[③] SỔ LANE — một phiên một lane, dòng ĐOÁN không có thẩm quyền');

// Ca thật 30/08: một phiên bị gán CẢ lane 04 lẫn 06.
const soCu = { 'cl:04': { phien: 'S1', luc: '2026-08-30T10:50:00.000Z' } };
const soMoi = M.buocLaneSo(soCu, 'cl:06', 'S1', false, '2026-08-30T10:59:00.000Z');
la('③ phiên S1 nhận cl:06 → tự RỜI cl:04 (một phiên ↔ một lane trong cùng hệ)', Object.keys(soMoi), ['cl:06']);

const soHaiPhien = M.buocLaneSo({ 'cl:04': { phien: 'S2', luc: '2026-08-30T10:50:00.000Z' } }, 'cl:06', 'S1', false, '2026-08-30T10:59:00.000Z');
la('③ phiên KHÁC giữ lane khác → KHÔNG bị đá ra', Object.keys(soHaiPhien).sort(), ['cl:04', 'cl:06']);

const haiHe = M.buocLaneSo({ 'cx:06': { phien: 'SAME', luc: '2026-08-30T10:50:00.000Z' } }, 'cl:06', 'SAME', false, '2026-08-30T10:59:00.000Z');
la('③ cx:06 và cl:06 cùng sống, cùng session string cũng không ghi đè', Object.keys(haiHe).sort(), ['cl:06', 'cx:06']);

const nhan = (so: any) => M.chuanHoaSo(so, BAY_GIO).map((r: any) => [r.lane, r.thamQuyen]);
la('③ dòng phiên TỰ KHAI, còn hạn → CÓ thẩm quyền',
  nhan({ 'cl:06': { phien: 'S1', luc: '2026-08-30T10:59:00.000Z' } }), [['cl:06', true]]);
la('③ ⛔ dòng ĐOÁN → KHÔNG thẩm quyền, dù mới tinh',
  nhan({ 'cl:06': { phien: 'S1', luc: '2026-08-30T10:59:00.000Z', doan: true } }), [['cl:06', false]]);
la('③ ⛔ dòng QUÁ HẠN (>120 phút) → KHÔNG thẩm quyền',
  nhan({ 'cl:06': { phien: 'S1', luc: '2026-08-30T08:00:00.000Z' } }), [['cl:06', false]]);
la('③ dòng quá hạn nêu ĐÚNG lý do (để người đọc biết phải làm gì)',
  M.chuanHoaSo({ 'cl:06': { phien: 'S1', luc: '2026-08-30T08:00:00.000Z' } }, BAY_GIO)[0].lyDo, 'quá hạn 120 phút');
la('③ ngay ranh giới TTL (đúng 120 phút) → VẪN có thẩm quyền, không lệch một phút',
  nhan({ 'cl:06': { phien: 'S1', luc: '2026-08-30T09:00:00.000Z' } }), [['cl:06', true]]);
la('③ legacy registry không bị mất nhưng mất thẩm quyền vì mơ hồ',
  M.chuanHoaSo({ '06': { phien: 'OLD', luc: '2026-08-30T10:59:00.000Z' } }, BAY_GIO)[0].lyDo,
  'LEGACY_AMBIGUOUS — không biết thuộc Codex hay Claude');

console.log('\n[③b] NAMESPACE — queue và receipt không cross-consume');
const sameId = 'HO-20260830150000-aaaaaaaaaaaa';
const cxHo = { type: 'HANDOFF', id: sameId, from: 'cl:00', to: 'cx:06', target_system: 'cx', target_lane: '06' };
const clHo = { type: 'HANDOFF', id: sameId, from: 'cx:00', to: 'cl:06', target_system: 'cl', target_lane: '06' };
la('③b cx:06 chỉ thấy queue cx:06', [cxHo, clHo].filter((e) => M.eventThuocDiaChi(e, 'cx:06')).length, 1);
la('③b cl:06 chỉ thấy queue cl:06', [cxHo, clHo].filter((e) => M.eventThuocDiaChi(e, 'cl:06')).length, 1);
la('③b cùng handoff ID nhưng khác system có khóa retry khác nhau', M.khoaHandoff(cxHo) === M.khoaHandoff(clHo), false);
la('③b legacy chỉ NN vẫn đọc được', M.eventThuocDiaChi({ type: 'HANDOFF', id: 'OLD', to: '06' }, '06'), true);
la('③b legacy không bị tự gán sang cx', M.eventThuocDiaChi({ type: 'HANDOFF', id: 'OLD', to: '06' }, 'cx:06'), false);

/* ════════ ④ HAI LỖ "CÔNG CỤ NÓI DỐI BẰNG CÁCH IM LẶNG" (phiếu `bd945a9950bc`) ════════
 *
 * Ca CHẠY THẬT lệnh `moc.mjs`, trên một cây cầu TẠM (`BOS_SHARED_LOG_ROOT`).
 * Phải chạy thật vì cả hai lỗi nằm ở TÁC DỤNG PHỤ và ở ĐẦU RA, không nằm ở hàm thuần.
 *
 * ⚠️ SỬA 31/08 — chú thích cũ ghi *"không chạm sổ thật"*. Câu đó ĐÚNG VỀ SỔ và SAI VỀ REPO, và
 * cái sai ấy che đúng chỗ đau: mỗi lần ghi biên nhận, `moc.mjs` spawn `phieu-ca.mjs --ghi-ban`
 * với cwd = REPO, mà đường ghi tệp bàn hồi đó cứng trong repo. Nên `npm test` cách ly sổ, rồi
 * ghi đè 9 tệp `docs/control/ban/*.md` THẬT bằng dữ liệu fixture của chính khối này.
 * ⇒ Cách ly phải nêu ĐỦ HAI đường: `BOS_SHARED_LOG_ROOT` (sổ) **và** `BOS_BAN_ROOT` (bàn).
 */
console.log('\n[④] HỘP RỖNG PHẢI NÓI · LỆNH CHẨN ĐOÁN PHẢI CHỈ-ĐỌC');
{
  const { execFileSync } = require('node:child_process') as typeof import('node:child_process');
  const { mkdtempSync, existsSync, readFileSync, appendFileSync } = require('node:fs') as typeof import('node:fs');
  const os = require('node:os') as typeof import('node:os');
  const pathm = require('node:path') as typeof import('node:path');

  const tam = mkdtempSync(pathm.join(os.tmpdir(), 'cau-'));
  const soLane = pathm.join(tam, 'lane-phien.json');
  /* Bàn TẠM — `moc.mjs` spawn `--ghi-ban` sau mỗi biên nhận; thiếu đường này là ghi vào bàn thật. */
  const banTam = pathm.join(tam, 'ban');
  const chay = (args: string[]) => {
    try {
      return { ma: 0, ra: execFileSync('node', ['scripts/moc.mjs', ...args],
        { encoding: 'utf8', env: { ...process.env, BOS_SHARED_LOG_ROOT: tam, BOS_BAN_ROOT: banTam, BOS_SESSION_ID: 'test-cl-session' }, stdio: ['ignore', 'pipe', 'pipe'] }) };
    } catch (e: any) { return { ma: e.status ?? -1, ra: `${e.stdout ?? ''}${e.stderr ?? ''}` }; }
  };

  // ① hộp rỗng: bản cũ in RỖNG TUYỆT ĐỐI ⇒ báo-an-toàn giống hệt báo-chết.
  const r = chay(['im', 'cl:06', '--chi-doc']);
  la('④ `im` hộp rỗng → PHẢI nói ra là rỗng, không được im', /hộp rỗng/.test(r.ra), true);
  la('④  … và nói kèm GIỜ KIỂM (để biết số này mới hay cũ)', /kiểm lúc \d{2}:\d{2}/.test(r.ra), true);
  la('④  … một dòng thôi — hook chạy mỗi lượt gõ, dài là đổ rác', r.ra.trim().split('\n').length, 1);

  // ② chỉ-đọc: ca thật 30/08 — chạy thử `im` ghi đè binding lane thật.
  la('④ ⛔ `--chi-doc` KHÔNG được ghi sổ lane (chạy thử không được làm bẩn thứ đang đo)', existsSync(soLane), false);
  chay(['im', 'cl:06']);
  la('④ `im` KHÔNG có cờ → vẫn ghi sổ lane như cũ (không phá đường sống)', existsSync(soLane), true);
  const truoc = readFileSync(soLane, 'utf8');
  chay(['im', 'cl:07', '--chi-doc']);
  la('④ ⛔ `--chi-doc` trên lane KHÁC cũng không đè binding đã có', readFileSync(soLane, 'utf8'), truoc);

  // Namespace writes fail closed; read-only legacy remains visible and labelled.
  la('④ ⛔ handoff ghi mới với NN trần → CHẶN', chay(['handoff', '00', '06', 'x', 'y']).ma, 2);
  const tao = chay(['handoff', 'cx:00', 'cl:06', 'namespace test', 'không cross consume']);
  la('④ handoff namespaced → NHẬN', tao.ma, 0);
  const newId = tao.ra.match(/HO-\d{14}-[0-9a-f]{12}/)?.[0] ?? '';
  const nsEvents = readFileSync(pathm.join(tam, 'agent-handoffs.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const newHo = nsEvents.find((e) => e.id === newId);
  la('④ event mới có system+lane+session_id+task_id/handoffId',
    [newHo.system, newHo.lane, newHo.session_id, newHo.task_id, newHo.handoffId],
    ['cx', '00', 'test-cl-session', newId, newId]);
  la('④ cl:06 thấy phiếu của mình', chay(['inbox', 'cl:06']).ra.includes(newId), true);
  la('④ cx:06 KHÔNG cross-consume phiếu cl:06', chay(['inbox', 'cx:06']).ra.includes(newId), false);
  la('④ ⛔ ACK sai namespace → CHẶN', chay(['ack', 'cx:06', newId, 'DONE', 'scripts/moc.mjs']).ma, 1);
  appendFileSync(pathm.join(tam, 'agent-handoffs.jsonl'), `${JSON.stringify({ type: 'HANDOFF', id: 'HO-LEGACY', from: '00', to: '06', topic: 'legacy', createdAt: new Date().toISOString() })}\n`);
  const legacyRead = chay(['inbox', '06']);
  la('④ legacy không mất và được gắn nhãn LEGACY_AMBIGUOUS', /HO-LEGACY[\s\S]*LEGACY_AMBIGUOUS/.test(legacyRead.ra), true);
  la('④ receipt authorship thiếu session thật không được suy từ artifact', (() => {
    const old = [process.env.BOS_SESSION_ID, process.env.CODEX_THREAD_ID, process.env.CLAUDE_SESSION_ID];
    delete process.env.BOS_SESSION_ID; delete process.env.CODEX_THREAD_ID; delete process.env.CLAUDE_SESSION_ID;
    try {
      const rr = execFileSync('node', ['scripts/moc.mjs', 'ack', 'cl:06', newId, 'DONE', 'scripts/moc.mjs'],
        { encoding: 'utf8', env: { ...process.env, BOS_SHARED_LOG_ROOT: tam, BOS_BAN_ROOT: banTam }, stdio: ['ignore', 'pipe', 'pipe'] });
      return rr;
    } catch (e: any) { return e.status; }
    finally {
      if (old[0]) process.env.BOS_SESSION_ID = old[0];
      if (old[1]) process.env.CODEX_THREAD_ID = old[1];
      if (old[2]) process.env.CLAUDE_SESSION_ID = old[2];
    }
  })(), 2);

  // ③ biên nhận mắt người — cổng bằng chứng dùng CHUNG khuôn với `ack`.
  la('④ ⛔ mat-nguoi + "đã xem rồi" → CHẶN (không phải con trỏ)',
    chay(['mat-nguoi', 'tuong-len-man', 'đã xem rồi']).ma, 2);
  la('④ ⛔ mat-nguoi cho việc MÁY chấm → CHẶN (mắt người không ký thay máy)',
    chay(['mat-nguoi', 'worker-sach', 'npm test']).ma, 2);
  la('④ ⛔ mat-nguoi cho mã việc không có thật → CHẶN',
    chay(['mat-nguoi', 'viec-bia-dat', 'npm test']).ma, 2);
  la('④ mat-nguoi + con trỏ mở lại được → NHẬN',
    chay(['mat-nguoi', 'tuong-len-man', 'scripts/proof/tuong-tu-hinh-hoc.ts']).ma, 0);
  const cau = readFileSync(pathm.join(tam, 'agent-handoffs.jsonl'), 'utf8');
  la('④  … và biên nhận APPEND vào đúng dòng sự kiện sẵn có, không kho thứ hai',
    cau.split('\n').filter(Boolean).map((l) => JSON.parse(l).type).includes('MAT_NGUOI'), true);
}

/* ⑤ ĐÃ DỌN 31/08 — khối ca `phieu-ca` từng TẠM TRÚ ở đây nay về đúng nhà:
 * `scripts/phieu-ca.test.ts`. Nó nằm nhờ ở tệp này không phải vì thuộc về đây, mà vì lease
 * `HO-phuc-hoi-ban` khoá 15 tệp và guard chưa có lệnh sửa danh sách tệp giữa phiên. Nợ đó trả
 * bằng `claude-lease.mjs amend` (HO-guard-v3 mục 5) — dòng này giữ lại làm dấu vết, vì "mã nằm
 * sai chỗ" ở đây là triệu chứng của một lỗ trong công cụ quản lý quyền, không phải của cẩu thả. */

console.log(`\n${ok} ok, ${fail} fail`);
if (fail) process.exit(1);
})();
