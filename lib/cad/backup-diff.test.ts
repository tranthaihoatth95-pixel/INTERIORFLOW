/**
 * lib/cad/backup-diff.test.ts — chạy: node_modules/.bin/sucrase-node lib/cad/backup-diff.test.ts
 * B3 (30/07) — đây là lớp có RỦI RO CAO NHẤT của sprint (mất dữ liệu không sửa lại được), nên
 * test nặng hơn bình thường: round-trip diff/apply, tỉa theo thang thời gian + đúc-trước-khi-xoá,
 * và đặc biệt kịch bản "1 file giữa chuỗi hỏng/mất" — đúng tình huống Hoà yêu cầu thử tay ở B3.
 */
import {
  diffSheets, applyDiff, planRetention, reconstructUpTo, formatBackupRelativeTime,
  backupFileName, parseBackupFileName, type BackupEntry, type BackupDiff,
} from './backup-diff';
import type { IdfSheetData } from './idf';
import type { LineEntity, Doc } from './model';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

const LAY = 'l-1';
function line(id: string, x: number): LineEntity {
  return { id, type: 'line', layer: LAY, a: { x, y: 0 }, b: { x, y: 100 } };
}
function doc(entities: LineEntity[], extra?: Partial<Doc>): Doc {
  return { entities, layers: [{ id: LAY, name: 'L', visible: true, locked: false, color: '#000' }], ...extra } as Doc;
}
function sheet(id: string, entities: LineEntity[], name = id, extra?: Partial<Doc>): IdfSheetData {
  return { id, name, doc: doc(entities, extra) };
}

/* ── [1] diffSheets/applyDiff round-trip — mọi kiểu đổi ── */
function testRoundTrip() {
  console.log('\n[1] diffSheets/applyDiff — round-trip đủ kiểu đổi');

  const base = [sheet('s1', [line('e1', 0), line('e2', 100)]), sheet('s2', [line('e3', 0)])];

  // (a) không đổi gì → diff rỗng, apply ra y hệt.
  const dNoop = diffSheets(base, base);
  ok('không đổi gì → diff.sheets rỗng', dNoop.sheets.length === 0);
  ok('apply diff rỗng → y hệt base', JSON.stringify(applyDiff(base, dNoop)) === JSON.stringify(base));

  // (b) đổi 1 entity (e1 dịch chuyển).
  const nextMoved = [sheet('s1', [line('e1', 500), line('e2', 100)]), sheet('s2', [line('e3', 0)])];
  const dMoved = diffSheets(base, nextMoved);
  ok('đổi 1 entity → chỉ 1 sheet đổi trong diff', dMoved.sheets.length === 1 && dMoved.sheets[0].sheetId === 's1');
  ok('đổi 1 entity → upsertEntities đúng 1 phần tử (e1)', dMoved.sheets[0].upsertEntities?.length === 1 && dMoved.sheets[0].upsertEntities?.[0].id === 'e1');
  ok('apply lại → khớp nextMoved', JSON.stringify(applyDiff(base, dMoved)) === JSON.stringify(nextMoved));

  // (c) thêm entity mới.
  const nextAdded = [sheet('s1', [line('e1', 0), line('e2', 100), line('e4', 200)]), sheet('s2', [line('e3', 0)])];
  const dAdded = diffSheets(base, nextAdded);
  ok('thêm entity → apply khớp', JSON.stringify(applyDiff(base, dAdded)) === JSON.stringify(nextAdded));

  // (d) xoá entity.
  const nextRemoved = [sheet('s1', [line('e1', 0)]), sheet('s2', [line('e3', 0)])];
  const dRemoved = diffSheets(base, nextRemoved);
  ok('xoá entity → removeEntityIds đúng', dRemoved.sheets[0].removeEntityIds?.includes('e2') === true);
  ok('apply xoá → khớp', JSON.stringify(applyDiff(base, dRemoved)) === JSON.stringify(nextRemoved));

  // (e) thêm sheet mới hoàn toàn.
  const nextNewSheet = [...base, sheet('s3', [line('e5', 0)])];
  const dNewSheet = diffSheets(base, nextNewSheet);
  ok('thêm sheet mới → full sheet trong diff', dNewSheet.sheets.some((x) => x.sheetId === 's3' && !!x.full));
  ok('apply thêm sheet → khớp', JSON.stringify(applyDiff(base, dNewSheet)) === JSON.stringify(nextNewSheet));

  // (f) xoá cả sheet.
  const nextDropSheet = [sheet('s1', [line('e1', 0), line('e2', 100)])];
  const dDropSheet = diffSheets(base, nextDropSheet);
  ok('xoá sheet → entry removed:true', dDropSheet.sheets.some((x) => x.sheetId === 's2' && x.removed));
  ok('apply xoá sheet → khớp', JSON.stringify(applyDiff(base, dDropSheet)) === JSON.stringify(nextDropSheet));

  // (g) đổi field KHÁC entities (thêm layer mới) → phải fallback full sheet, không cố diff field đó.
  const nextLayerChanged = [sheet('s1', [line('e1', 0), line('e2', 100)], 's1', {
    layers: [{ id: LAY, name: 'L', visible: true, locked: false, color: '#000' }, { id: 'l-2', name: 'L2', visible: true, locked: false, color: '#111' }],
  } as unknown as Partial<Doc>), sheet('s2', [line('e3', 0)])];
  const dLayer = diffSheets(base, nextLayerChanged);
  ok('đổi layers (field khác entities) → full sheet, không upsert lẻ', dLayer.sheets[0].full !== undefined && dLayer.sheets[0].upsertEntities === undefined);
  ok('apply đổi layers → khớp', JSON.stringify(applyDiff(base, dLayer)) === JSON.stringify(nextLayerChanged));

  // (h) apply diff tham chiếu sheet KHÔNG tồn tại trong base (diff hỏng/lệch ngữ cảnh) → không throw, bỏ qua.
  const brokenDiff: BackupDiff = { sheets: [{ sheetId: 'khong-ton-tai', upsertEntities: [line('ex', 0)] }] };
  let threw = false;
  let result: IdfSheetData[] = [];
  try { result = applyDiff(base, brokenDiff); } catch { threw = true; }
  ok('apply diff tham chiếu sheet lạ → KHÔNG throw', !threw);
  ok('apply diff tham chiếu sheet lạ → base không đổi', JSON.stringify(result) === JSON.stringify(base));
}

/* ── [2] planRetention — thang thời gian + đúc trước khi xoá ── */
function testRetention() {
  console.log('\n[2] planRetention — thang thời gian + materialize trước khi xoá');
  const HOUR = 60 * 60 * 1000;
  const now = new Date(2026, 6, 30, 12, 0, 0).getTime(); // mốc cố định, không dùng Date.now()

  const full0 = sheet('s1', [line('e1', 0)]);
  const full0Sheets = [full0];

  const contentByName = new Map<string, IdfSheetData[] | BackupDiff>();
  function full(name: string, sheets: IdfSheetData[]) { contentByName.set(name, sheets); return { name, sheets }; }
  function diffEntry(name: string, d: BackupDiff) { contentByName.set(name, d); return { name, diff: d }; }

  // Chuỗi giả lập: 1 full lúc t=-10h, rồi 9 diff mỗi 1h (t=-9h..-1h), rồi 1 diff ở t=-30' (trong vùng giữ MỌI bản).
  const entries: BackupEntry[] = [];
  const names: string[] = [];
  full(`p_full0`, full0Sheets);
  entries.push({ name: 'p_full0', timestampMs: now - 10 * HOUR, kind: 'full' });
  names.push('p_full0');

  let prevState = full0Sheets;
  for (let h = 9; h >= 1; h--) {
    const nextState = [sheet('s1', [line('e1', 0), line(`e_h${h}`, h)])];
    const d = diffSheets(prevState, nextState);
    const name = `p_diff_h${h}`;
    diffEntry(name, d);
    entries.push({ name, timestampMs: now - h * HOUR, kind: 'diff' });
    names.push(name);
    prevState = nextState;
  }
  // 1 diff gần (30 phút trước — vùng "giữ mọi bản").
  const recentState = [sheet('s1', [line('e1', 0), line('e_recent', 999)])];
  const dRecent = diffSheets(prevState, recentState);
  diffEntry('p_diff_recent', dRecent);
  entries.push({ name: 'p_diff_recent', timestampMs: now - 30 * 60 * 1000, kind: 'diff' });

  const loadContent = (name: string) => contentByName.get(name)!;
  const plan = planRetention(entries, now, loadContent);

  ok('bản trong vùng "giữ mọi bản" (30 phút trước) KHÔNG bị xoá', !plan.deleteNames.includes('p_diff_recent'));
  // Mỗi diff cách nhau đúng 1 giờ THẬT (đồng hồ) → mỗi bản rơi vào 1 bucket giờ RIÊNG của chính
  // nó (bucketKey nhóm theo giờ đồng hồ thật, không phải "cách nay bao lâu") → không có 2 bản
  // nào trùng bucket để cạnh tranh đại diện → KHÔNG có gì đáng tỉa trong kịch bản thưa này.
  ok('các bản cách đều 1 giờ, không trùng bucket nào → không tỉa gì (đúng, để lại kịch bản dày đặc ở dưới thử tỉa thật)', plan.deleteNames.length === 0);
  ok('không tỉa gì → không cần đúc gì', plan.materialize.length === 0);
  ok('KHÔNG có entry nào vừa bị xoá vừa cần đúc (2 việc loại trừ nhau)', plan.materialize.every((m) => !plan.deleteNames.includes(m.name)));

  // Kịch bản ép buộc CÓ tỉa giữa chuỗi: nhiều diff trong CÙNG 1 giờ (đại diện chỉ giữ 1).
  const denseEntries: BackupEntry[] = [{ name: 'd_full', timestampMs: now - 5 * HOUR, kind: 'full' }];
  const denseContent = new Map<string, IdfSheetData[] | BackupDiff>();
  denseContent.set('d_full', full0Sheets);
  let s = full0Sheets;
  for (let i = 1; i <= 4; i++) {
    // 4 bản trong CÙNG 1 giờ (cách nhau 10 phút, cùng giờ đồng hồ) — nằm ngoài vùng "giữ mọi bản" (>1h trước).
    const t = now - 5 * HOUR + i * 10 * 60 * 1000;
    const next = [sheet('s1', [line('e1', 0), line(`e_dense${i}`, i)])];
    const d = diffSheets(s, next);
    const name = `d_diff${i}`;
    denseContent.set(name, d);
    denseEntries.push({ name, timestampMs: t, kind: 'diff' });
    s = next;
  }
  const densePlan = planRetention(denseEntries, now, (n) => denseContent.get(n)!);
  // full anchor + 4 diff đều rơi CÙNG 1 bucket giờ (cách nhau 10 phút, cùng giờ đồng hồ) → chỉ 1
  // đại diện được giữ (d_diff4, mới nhất) — kể cả bản FULL gốc cũng bị tỉa nếu không phải đại
  // diện, ĐÚNG miễn là đại diện được giữ tự đứng được (đã đúc) trước khi xoá cả chuỗi cũ.
  ok('cùng bucket giờ → chỉ giữ 1 đại diện, tỉa cả 4 bản còn lại (kể cả full anchor gốc)', densePlan.deleteNames.length === 4 && densePlan.deleteNames.includes('d_full'));
  ok('đại diện được GIỮ (d_diff4, mới nhất trong giờ) mà là diff phụ thuộc bản bị xoá → phải đúc thành full', densePlan.materialize.some((m) => m.name === 'd_diff4'));
  const materializedD4 = densePlan.materialize.find((m) => m.name === 'd_diff4');
  ok('nội dung đúc đúng = trạng thái thật tại d_diff4 (có entity e_dense4)', !!materializedD4 && materializedD4.sheets[0].doc.entities.some((e) => e.id === 'e_dense4'));

  void names; // giữ biến khỏi cảnh báo unused nếu về sau không dùng hết

  // Kịch bản 2 đại diện KHÁC bucket cùng bị "gãy" bởi 1 lần xoá ở giữa — cả 2 phải đúc ĐỘC LẬP,
  // không chỉ đúc bản cuối cùng (bug dễ mắc nếu code chỉ nhìn "bản mới nhất trong đoạn gãy").
  const HOUR2 = 60 * 60 * 1000;
  const fBase = full0Sheets;
  const entries2: BackupEntry[] = [{ name: 'g_full', timestampMs: now - 30 * HOUR2, kind: 'full' }];
  const content2 = new Map<string, IdfSheetData[] | BackupDiff>([['g_full', fBase]]);
  let st = fBase;
  // 3 bản CÙNG 1 giờ (giờ 27 trước, sẽ có 1 đại diện) rồi 3 bản CÙNG giờ khác (giờ 20 trước, đại diện khác).
  const hoursAgo = [27, 27, 27, 20, 20, 20];
  hoursAgo.forEach((hAgo, i) => {
    const t = now - hAgo * HOUR2 + i * 60 * 1000; // lệch vài phút để có thứ tự rõ, vẫn cùng giờ đồng hồ trong nhóm
    const next = [sheet('s1', [line('e1', 0), line(`e_g${i}`, i)])];
    const d = diffSheets(st, next);
    const name = `g_diff${i}`;
    content2.set(name, d);
    entries2.push({ name, timestampMs: t, kind: 'diff' });
    st = next;
  });
  const plan2 = planRetention(entries2, now, (n) => content2.get(n)!);
  ok('2 nhóm bucket giờ khác nhau trong đoạn gãy → CẢ 2 đại diện đều được đúc (không chỉ 1)', plan2.materialize.length === 2);
  ok('full gốc bị xoá (không phải đại diện của bucket nào)', plan2.deleteNames.includes('g_full'));
}

/* ── [3] reconstructUpTo — phục hồi tại điểm bất kỳ + gãy chuỗi ── */
function testReconstruct() {
  console.log('\n[3] reconstructUpTo — phục hồi tại điểm bất kỳ, gãy chuỗi không crash');
  const T = (i: number) => new Date(2026, 6, 30, 10, i, 0).getTime();

  const s0 = [sheet('s1', [line('e1', 0)])];
  const s1 = [sheet('s1', [line('e1', 0), line('e2', 1)])];
  const s2 = [sheet('s1', [line('e1', 0), line('e2', 1), line('e3', 2)])];
  const s3 = [sheet('s1', [line('e1', 0), line('e2', 1), line('e3', 2), line('e4', 3)])];

  const entries: BackupEntry[] = [
    { name: 'full0', timestampMs: T(0), kind: 'full' },
    { name: 'diff1', timestampMs: T(1), kind: 'diff' },
    { name: 'diff2', timestampMs: T(2), kind: 'diff' },
    { name: 'diff3', timestampMs: T(3), kind: 'diff' },
  ];
  const content = new Map<string, IdfSheetData[] | BackupDiff>([
    ['full0', s0],
    ['diff1', diffSheets(s0, s1)],
    ['diff2', diffSheets(s1, s2)],
    ['diff3', diffSheets(s2, s3)],
  ]);
  const load = (name: string) => content.get(name) ?? null;

  const rLatest = reconstructUpTo(entries, 3, load);
  ok('ráp trọn chuỗi tới bản mới nhất (targetIndex=3) → không degraded', !rLatest.degraded);
  ok('ráp trọn tới bản mới nhất → khớp s3', JSON.stringify(rLatest.sheets) === JSON.stringify(s3));
  ok('recoveredAsOf = diff3 (đúng điểm yêu cầu)', rLatest.recoveredAsOf === 'diff3');

  // Điểm 6: lấy bản GIỮA chuỗi (không chỉ mới nhất) — targetIndex=1.
  const rMiddle = reconstructUpTo(entries, 1, load);
  ok('ráp tới điểm GIỮA chuỗi (targetIndex=1, không phải mới nhất) → khớp s1', JSON.stringify(rMiddle.sheets) === JSON.stringify(s1));
  ok('ráp điểm giữa → không degraded (chuỗi nguyên vẹn tới đó)', !rMiddle.degraded);

  // Điểm 5: xoá 1 file diff GIỮA chuỗi (diff2 mất) → phục hồi bản MỚI NHẤT phải lùi về mốc trước đó (sau diff1), KHÔNG crash.
  const contentBroken = new Map(content);
  contentBroken.delete('diff2'); // giả lập file mất/hỏng
  const loadBroken = (name: string) => contentBroken.get(name) ?? null;
  const rBroken = reconstructUpTo(entries, 3, loadBroken);
  ok('diff2 mất giữa chuỗi, xin bản mới nhất → KHÔNG throw (test tới được đây)', true);
  ok('diff2 mất → degraded = true (không ráp trọn được tới target)', rBroken.degraded);
  ok('diff2 mất → trả về ĐÚNG trạng thái mốc TRƯỚC ĐÓ (s1, sau diff1)', JSON.stringify(rBroken.sheets) === JSON.stringify(s1));
  ok('diff2 mất → recoveredAsOf báo đúng diff1 (không giả vờ là diff3)', rBroken.recoveredAsOf === 'diff1');

  // Mốc full CHÍNH nó hỏng → không còn full nào trước đó → trả rỗng, không throw.
  const contentAnchorGone = new Map(content);
  contentAnchorGone.delete('full0');
  const loadAnchorGone = (name: string) => contentAnchorGone.get(name) ?? null;
  const rAnchorGone = reconstructUpTo(entries, 3, loadAnchorGone);
  ok('mốc full duy nhất cũng hỏng → không throw, trả sheets rỗng + degraded', rAnchorGone.degraded && rAnchorGone.sheets.length === 0);

  // Mốc full hỏng NHƯNG có full khác trước đó → phải lùi về full trước.
  const entries2: BackupEntry[] = [
    { name: 'fullA', timestampMs: T(0), kind: 'full' },
    { name: 'fullB', timestampMs: T(2), kind: 'full' }, // full thứ 2 (giả lập mốc đúc mỗi 20 bản)
    { name: 'diffC', timestampMs: T(3), kind: 'diff' },
  ];
  const content2 = new Map<string, IdfSheetData[] | BackupDiff>([
    ['fullA', s0],
    ['fullB', s2],
    ['diffC', diffSheets(s2, s3)],
  ]);
  content2.delete('fullB'); // fullB hỏng
  const load2 = (name: string) => content2.get(name) ?? null;
  const r2 = reconstructUpTo(entries2, 2, load2);
  ok('mốc full gần nhất (fullB) hỏng nhưng target CHÍNH LÀ fullB → lùi về fullA, không throw', r2.degraded && JSON.stringify(r2.sheets) === JSON.stringify(s0));
}

/* ── [4] formatBackupRelativeTime ── */
function testFormatRelativeTime() {
  console.log('\n[4] formatBackupRelativeTime — thang hiển thị');
  const now = new Date(2026, 6, 30, 12, 0, 0).getTime(); // thứ Năm 30/07/2026 12:00
  const MIN = 60_000;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;
  ok('0 phút → "vừa xong"', formatBackupRelativeTime(now, now) === 'vừa xong');
  ok('10 phút trước', formatBackupRelativeTime(now - 10 * MIN, now) === '10 phút trước');
  ok('1 giờ trước (59-60 phút biên)', formatBackupRelativeTime(now - 61 * MIN, now) === '1 giờ trước');
  ok('hôm qua HH:mm', formatBackupRelativeTime(now - 1 * DAY - 3 * HOUR + 20 * MIN, now).startsWith('hôm qua'));
  ok('trong tuần → tên thứ', /^thứ|Chủ Nhật/.test(formatBackupRelativeTime(now - 3 * DAY, now)));
  ok('~10 ngày trước → "N tuần trước"', formatBackupRelativeTime(now - 10 * DAY, now).includes('tuần trước'));
  ok('~60 ngày trước → "N tháng trước"', formatBackupRelativeTime(now - 60 * DAY, now).includes('tháng trước'));
  ok('~2 năm trước → ngày tháng năm cụ thể', /^\d{4}-\d{2}-\d{2}$/.test(formatBackupRelativeTime(now - 730 * DAY, now)));
}

/* ── [5] backupFileName/parseBackupFileName round-trip ── */
function testFileNameRoundTrip() {
  console.log('\n[5] backupFileName/parseBackupFileName — round-trip');
  const ts = new Date(2026, 6, 30, 9, 5, 3).getTime();
  const nameFull = backupFileName('proj1', ts, 'full');
  const nameDiff = backupFileName('proj1', ts, 'diff');
  ok('full → đuôi .ifpack', nameFull.endsWith('.ifpack'));
  ok('diff → đuôi .ifdiff.json', nameDiff.endsWith('.ifdiff.json'));
  const parsedFull = parseBackupFileName(nameFull);
  const parsedDiff = parseBackupFileName(nameDiff);
  ok('parse ngược full → kind đúng', parsedFull?.kind === 'full');
  ok('parse ngược full → timestamp khớp', parsedFull?.timestampMs === ts);
  ok('parse ngược diff → kind đúng', parsedDiff?.kind === 'diff');
  ok('tên KHÔNG đúng quy ước → null, không throw', parseBackupFileName('random-file.txt') === null);
}

testRoundTrip();
testRetention();
testReconstruct();
testFormatRelativeTime();
testFileNameRoundTrip();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
