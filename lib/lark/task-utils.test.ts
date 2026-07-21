/**
 * lib/lark/task-utils.test.ts — test cho phần logic THUẦN của cầu nối Larkbase (M1 Home/
 * Gallery, docs/RESEARCH-HOME-GALLERY-DASHBOARD.md). 3 việc yêu cầu verify rõ trong brief:
 *   1. Filter "Mã DA" phi-số → null (phát hiện §1.4/§1.5: record "Khác" lẫn trong dữ liệu thật)
 *   2. Tính "% tiến độ" nhóm theo larkProjectCode
 *   3. Sort logic bảng phẳng (mặc định deadline gần nhất trước, null luôn cuối)
 *
 * Chạy: node_modules/.bin/sucrase-node lib/lark/task-utils.test.ts
 */
import { normalizeProjectCode, computeProgressByCode, worstWarningByCode, sortTaskRows, warningRank } from './task-utils';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL - ${label}`);
  }
}

/* ── 1) normalizeProjectCode — đúng phát hiện dữ liệu thật §1.4/§1.5 ── */
function testNormalizeProjectCode() {
  console.log('\n[1] normalizeProjectCode() — "Mã DA" phi-số → null');
  ok('mã số thật giữ nguyên', normalizeProjectCode('7963') === '7963');
  ok('"Khác" (record thật đã thấy) → null', normalizeProjectCode('Khác') === null);
  ok('rỗng → null', normalizeProjectCode('') === null);
  ok('khoảng trắng thuần → null', normalizeProjectCode('   ') === null);
  ok('có khoảng trắng bao quanh số vẫn nhận (trim trước)', normalizeProjectCode('  8205  ') === '8205');
  ok('lẫn chữ+số → null (không phải mã DA thật)', normalizeProjectCode('DA-8205') === null);
  ok('undefined/null input → null', normalizeProjectCode(undefined) === null && normalizeProjectCode(null) === null);
  ok('number input (không phải string) → null', normalizeProjectCode(7963 as unknown) === null);
}

/* ── 2) computeProgressByCode — % tiến độ nhóm theo larkProjectCode ── */
function testComputeProgressByCode() {
  console.log('\n[2] computeProgressByCode() — % tiến độ nhóm theo dự án');
  const tasks = [
    { larkProjectCode: '7963', status: 'Hoàn thành' },
    { larkProjectCode: '7963', status: 'Đang làm' },
    { larkProjectCode: '7963', status: 'Đang làm' },
    { larkProjectCode: '7963', status: 'Ghi nhận' },
    { larkProjectCode: '8205', status: 'Hoàn thành' },
    { larkProjectCode: '8205', status: 'Hoàn thành' },
    { larkProjectCode: null, status: 'Đang làm' }, // "Khác" đã lọc null — KHÔNG được gộp vào nhóm nào
  ];
  const byCode = computeProgressByCode(tasks);
  ok('7963: 1/4 hoàn thành = 25%', byCode.get('7963')?.pct === 25 && byCode.get('7963')?.total === 4);
  ok('8205: 2/2 hoàn thành = 100%', byCode.get('8205')?.pct === 100);
  ok('code null (task "Khác") KHÔNG tạo nhóm riêng', !byCode.has('null') && byCode.size === 2);

  const empty = computeProgressByCode([{ larkProjectCode: '1', status: 'Đang làm' }]);
  ok('nhóm chưa có task hoàn thành nào = 0%, không chia 0', empty.get('1')?.pct === 0);
}

/* ── 2b) worstWarningByCode — pill Gallery card, chọn cảnh báo khẩn cấp nhất chưa xong ── */
function testWorstWarningByCode() {
  console.log('\n[2b] worstWarningByCode() — chọn cảnh báo khẩn cấp nhất (không tự tính lại)');
  const tasks = [
    { larkProjectCode: '1', status: 'Đang làm', warningLabel: '🟢 Đúng tiến độ', daysLeft: 10 },
    { larkProjectCode: '1', status: 'Đang làm', warningLabel: '🔴 Trễ 5 ngày', daysLeft: -5 },
    { larkProjectCode: '2', status: 'Hoàn thành', warningLabel: '✅ Hoàn thành', daysLeft: 0 },
  ];
  const worst = worstWarningByCode(tasks);
  ok('dự án 1: chọn 🔴 (khẩn cấp hơn 🟢), giữ NGUYÊN chuỗi gốc', worst.get('1') === '🔴 Trễ 5 ngày');
  ok('dự án 2: mọi task đã xong → ✅ Hoàn thành', worst.get('2') === '✅ Hoàn thành');
  ok('warningRank: 🔴 < 🟡 < 🟢 < ✅ (số nhỏ = khẩn cấp hơn)', warningRank('🔴 x') < warningRank('🟡 x') && warningRank('🟡 x') < warningRank('🟢 x') && warningRank('🟢 x') < warningRank('✅ x'));
}

/* ── 3) sortTaskRows — mặc định deadline gần nhất trước, null luôn cuối ── */
function testSortTaskRows() {
  console.log('\n[3] sortTaskRows() — mặc định sort Deadline gần nhất trước');
  const rows = [
    { larkProjectName: 'B', ownerAccount: 'b', status: 'Đang làm', deadline: '2026-08-01', warningLabel: null, daysLeft: 10 },
    { larkProjectName: 'A', ownerAccount: 'a', status: 'Đang làm', deadline: null, warningLabel: null, daysLeft: null },
    { larkProjectName: 'C', ownerAccount: 'c', status: 'Đang làm', deadline: '2026-07-22', warningLabel: null, daysLeft: 1 },
  ];
  const byDeadline = sortTaskRows(rows);
  ok('gần nhất trước (2026-07-22)', byDeadline[0].larkProjectName === 'C');
  ok('xa hơn thứ 2 (2026-08-01)', byDeadline[1].larkProjectName === 'B');
  ok('deadline null luôn xếp CUỐI', byDeadline[2].larkProjectName === 'A');

  const byProject = sortTaskRows(rows, 'project');
  ok('sort theo tên dự án A→B→C', byProject.map((r) => r.larkProjectName).join('') === 'ABC');

  const byOwnerDesc = sortTaskRows(rows, 'owner', -1);
  ok('sort theo chủ trì, đảo chiều (dir=-1) → c,b,a', byOwnerDesc.map((r) => r.ownerAccount).join(',') === 'c,b,a');
}

testNormalizeProjectCode();
testComputeProgressByCode();
testWorstWarningByCode();
testSortTaskRows();

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
