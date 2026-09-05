/**
 * components/studio/vitals-eval-ui.test.ts — phần thuần của panel đánh giá. Chạy:
 *   node_modules/.bin/sucrase-node components/studio/vitals-eval-ui.test.ts
 * Canh: thứ tự nhóm (máy đo trước) · nhóm rỗng bị bỏ · nhãn lớp nói rõ "không phải luật" cho gu
 * · chấm trạng thái chỉ 'alert' khi có lỗi/cảnh báo THẬT.
 */
import type { EvalFinding, EvalRecord } from '../../lib/capabilities/vitals-eval-core';
import { LAYER_LABEL, confidencePct, groupByLayer, summaryLine, vitalsStateFor } from './vitals-eval-ui';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

const base = {
  rule: { id: 'r', version: '1', source: 's' },
  confidence: 0.5,
  moTa: 'm',
  why: 'w',
  evidence: { entityIds: [] },
  action: { kind: 'none' as const, label: ['-', '-'] as [string, string], reversible: true as const },
  domain: 'cad-drawing' as const,
};
const taste: EvalFinding = { ...base, id: 't1', layer: 'taste', basis: 'preference', trangThaiNguon: 'inferred' };
const info: EvalFinding = { ...base, id: 'd1', layer: 'deterministic', basis: 'standard', severity: 'info' };
const err: EvalFinding = { ...base, id: 'd2', layer: 'deterministic', basis: 'standard', severity: 'error', confidence: 1.7 };

const groups = groupByLayer([taste, info, err]);
ok('máy đo đứng trước gu dù vào sau', groups.map((g) => g.layer).join('|') === 'deterministic|taste');
ok('nhóm rỗng (learned/ai) bị bỏ', !groups.some((g) => g.layer === 'ai' || g.layer === 'learned'));
ok('giữ nguyên thứ tự trong nhóm', groups[0].findings.map((f) => f.id).join('|') === 'd1|d2');
ok('nhãn gu nói rõ không phải luật', /không phải luật/.test(LAYER_LABEL.taste[0]) && /not a rule/.test(LAYER_LABEL.taste[1]));
ok('confidencePct kẹp 0..100', confidencePct(err) === 100 && confidencePct(taste) === 50);

function rec(findings: EvalFinding[]): EvalRecord {
  return { version: 1, id: 'x', createdAt: 'now', stage: 'concept', subject: { kind: 'cad-doc', hash: 'h', projectId: null, entityCount: 0 }, engine: { name: 'vitals-eval-core', version: '1' }, dna: null, findings, feedback: [] };
}
ok('summaryLine đếm đúng', summaryLine(rec([taste, info, err]))[0] === '1 lỗi · 0 cảnh báo · 1 ghi nhận · 1 quan sát gu');
ok("chỉ gu/info ⇒ 'idle' (không giả cảnh báo)", vitalsStateFor(rec([taste, info])) === 'idle');
ok("có lỗi ⇒ 'alert'", vitalsStateFor(rec([err])) === 'alert');
ok("null ⇒ 'idle'", vitalsStateFor(null) === 'idle');

console.log(`\n${pass} ok · ${fail} fail`);
if (fail > 0) process.exit(1);
