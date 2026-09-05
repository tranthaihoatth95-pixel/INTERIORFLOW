/**
 * lib/capabilities/vitals-eval-harness.ts — BỘ KIỂM CHUẨN NHỎ, TẤT ĐỊNH cho lõi đánh giá.
 *
 * KHÔNG phải benchmark, KHÔNG có bộ dữ liệu bịa: harness chỉ là MÁY CHẠY — nhận ca kiểm do nơi
 * gọi cung cấp (test dựng bản vẽ tổng hợp nhỏ; về sau Hoà nạp bản vẽ thật + nhãn thật), rồi đo:
 *   ① đúng luật nào PHẢI bắt (mustHave) · luật nào KHÔNG được bắt (mustNotHave)
 *   ② tất định: chạy 2 lần cùng input ⇒ JSON y hệt
 *   ③ mọi phát hiện đủ hợp đồng (id · nguồn · phiên bản · tin cậy [0,1] · lý do · hành động lùi được)
 *   ④ lớp gu/ai/học KHÔNG mang severity (rào runtime cho dữ liệu ngoài)
 * Số đếm hit/miss/falseAlarm là số đếm thật trên ca đưa vào — không suy ra "độ chính xác toàn cục".
 *
 * File THUẦN — import tương đối, test bằng sucrase-node.
 */

import type { Doc } from '../cad/model';
import {
  EVAL_DOMAINS,
  evaluateCadDoc,
  type EvalCadOptions,
  type EvalFinding,
} from './vitals-eval-core';

export interface EvalCase {
  id: string;
  doc: Doc;
  options?: EvalCadOptions;
  /** id luật PHẢI xuất hiện (ít nhất một phát hiện). */
  mustHave?: string[];
  /** id luật KHÔNG được xuất hiện. */
  mustNotHave?: string[];
}

export interface ContractIssue {
  findingId: string;
  problem: string;
}

export interface EvalCaseResult {
  id: string;
  findings: number;
  hits: string[];
  misses: string[];
  falseAlarms: string[];
  deterministic: boolean;
  contractIssues: ContractIssue[];
  pass: boolean;
}

export interface EvalHarnessSummary {
  cases: EvalCaseResult[];
  totalCases: number;
  passed: number;
  hits: number;
  misses: number;
  falseAlarms: number;
  nonDeterministic: number;
  contractIssues: number;
}

/** Kiểm hợp đồng MỘT phát hiện — dùng cả cho dữ liệu đọc từ ngoài (AI/IDB). */
export function checkFindingContract(f: EvalFinding): ContractIssue[] {
  const out: ContractIssue[] = [];
  const bad = (problem: string) => out.push({ findingId: f.id, problem });
  if (!f.id) bad('thiếu id');
  if (!(EVAL_DOMAINS as readonly string[]).includes(f.domain)) bad(`miền lạ: ${String(f.domain)}`);
  if (!f.rule || !f.rule.id) bad('thiếu rule.id');
  if (!f.rule?.version) bad('thiếu rule.version');
  if (!f.rule?.source) bad('thiếu rule.source');
  if (!(typeof f.confidence === 'number' && f.confidence >= 0 && f.confidence <= 1)) bad('confidence ngoài [0,1]');
  if (!f.moTa?.trim()) bad('thiếu moTa');
  if (!f.why?.trim()) bad('thiếu why');
  if (!f.evidence || !Array.isArray(f.evidence.entityIds)) bad('thiếu evidence.entityIds');
  if (!f.action || f.action.reversible !== true) bad('hành động không lùi được');
  const sev = (f as { severity?: unknown }).severity;
  if (f.layer !== 'deterministic' && sev !== undefined) bad(`lớp ${f.layer} không được mang severity`);
  if (f.layer === 'deterministic') {
    if (sev !== 'error' && sev !== 'warning' && sev !== 'info') bad('severity lạ');
    if (f.basis === 'measured-convention' && sev === 'error') bad('ngưỡng thông lệ không được là error');
    if (f.chuaKiemChung && f.confidence >= 1) bad('chưa kiểm chứng mà tin cậy 1.0');
  }
  // rào runtime cho dữ liệu ngoài (AI/IDB) — kiểu đã khoá nên TS coi nhánh này là never, đọc qua string
  const basis = (f as { basis: string }).basis;
  const layer = (f as { layer: string }).layer;
  if (layer !== 'deterministic' && basis !== 'preference') bad(`lớp ${layer} phải basis=preference`);
  return out;
}

export function runEvalCase(c: EvalCase): EvalCaseResult {
  const a = evaluateCadDoc(c.doc, c.options);
  const b = evaluateCadDoc(c.doc, c.options);
  const deterministic = JSON.stringify(a) === JSON.stringify(b);
  const rules = new Set(a.map((f) => f.rule.id));
  const hits = (c.mustHave ?? []).filter((r) => rules.has(r));
  const misses = (c.mustHave ?? []).filter((r) => !rules.has(r));
  const falseAlarms = (c.mustNotHave ?? []).filter((r) => rules.has(r));
  const contractIssues = a.flatMap(checkFindingContract);
  return {
    id: c.id,
    findings: a.length,
    hits,
    misses,
    falseAlarms,
    deterministic,
    contractIssues,
    pass: deterministic && misses.length === 0 && falseAlarms.length === 0 && contractIssues.length === 0,
  };
}

export function runEvalHarness(cases: readonly EvalCase[]): EvalHarnessSummary {
  const results = cases.map(runEvalCase);
  return {
    cases: results,
    totalCases: results.length,
    passed: results.filter((r) => r.pass).length,
    hits: results.reduce((n, r) => n + r.hits.length, 0),
    misses: results.reduce((n, r) => n + r.misses.length, 0),
    falseAlarms: results.reduce((n, r) => n + r.falseAlarms.length, 0),
    nonDeterministic: results.filter((r) => !r.deterministic).length,
    contractIssues: results.reduce((n, r) => n + r.contractIssues.length, 0),
  };
}
