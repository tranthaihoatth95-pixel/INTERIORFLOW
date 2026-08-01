/**
 * lib/gu/gu-model-sync.test.ts — kiểm PHẦN THUẦN (xuất/nhập .json) của Đợt C. Chạy:
 *   node_modules/.bin/sucrase-node lib/gu/gu-model-sync.test.ts
 *
 * KHÔNG test loadGuModelFromServer/saveGuModelToServer (cần fetch/DOM thật) — chỉ test
 * buildGuModelExport/parseGuModelExport, mẫu hình giống brand-kit.test.ts.
 */
import { buildGuModelExport, parseGuModelExport, isGuKind, GU_KINDS } from './gu-model-sync';
import type { PerceptronState } from './pairwise-perceptron';

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

const STATE: PerceptronState = {
  version: 1,
  weights: { 'mood:warm': 0.3, 'op:office': -0.1 },
  pairsSeen: 12,
  updatedAt: 1000,
};

// ── isGuKind ──
ok('isGuKind: nhận đúng whitelist', GU_KINDS.every((k) => isGuKind(k)));
ok('isGuKind: chuỗi lạ → false', !isGuKind('present-template-v2'));
ok('isGuKind: rỗng → false', !isGuKind(''));

// ── build/parse round-trip ──
{
  const pkg = buildGuModelExport('cad-layout-option', STATE);
  ok('build: version=1', pkg.version === 1);
  ok('build: giữ kind', pkg.kind === 'cad-layout-option');
  ok('build: giữ nguyên state', JSON.stringify(pkg.state) === JSON.stringify(STATE));
  ok('build: exportedAt là số', typeof pkg.exportedAt === 'number');

  const json = JSON.stringify(pkg);
  const parsed = parseGuModelExport(json);
  ok('round-trip: parse ra khác null', parsed !== null);
  ok('round-trip: state khớp nguyên bản', JSON.stringify(parsed?.state) === JSON.stringify(STATE));
  ok('round-trip: kind khớp', parsed?.kind === 'cad-layout-option');
}

// ── parseGuModelExport: từ chối dữ liệu hỏng, không ném ──
ok('parse: JSON hỏng → null (không ném)', parseGuModelExport('{ not json') === null);
ok('parse: thiếu version → null', parseGuModelExport(JSON.stringify({ kind: 'cad-layout-option', state: STATE })) === null);
ok('parse: version sai → null', parseGuModelExport(JSON.stringify({ version: 2, kind: 'cad-layout-option', state: STATE })) === null);
ok(
  'parse: kind ngoài whitelist → null',
  parseGuModelExport(JSON.stringify({ version: 1, kind: 'not-a-real-kind', state: STATE })) === null,
);
ok(
  'parse: state.version sai → null',
  parseGuModelExport(JSON.stringify({ version: 1, kind: 'cad-layout-option', state: { ...STATE, version: 2 } })) === null,
);
ok(
  'parse: weights chứa NaN/Infinity → null',
  parseGuModelExport(
    JSON.stringify({ version: 1, kind: 'cad-layout-option', state: { ...STATE, weights: { a: Infinity } } }),
  ) === null,
);
ok(
  'parse: thiếu pairsSeen → null',
  parseGuModelExport(
    JSON.stringify({ version: 1, kind: 'cad-layout-option', state: { version: 1, weights: {}, updatedAt: 1 } }),
  ) === null,
);
ok('parse: null → null', parseGuModelExport('null') === null);
ok('parse: mảng thay vì object → null', parseGuModelExport('[]') === null);

// ── exportedAt fallback khi file cũ thiếu field ──
{
  const noExportedAt = { version: 1, kind: 'cad-layout-option', state: STATE };
  const parsed = parseGuModelExport(JSON.stringify(noExportedAt));
  ok('parse: thiếu exportedAt → fallback Date.now(), không null hoá cả gói', parsed !== null && typeof parsed.exportedAt === 'number');
}

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
