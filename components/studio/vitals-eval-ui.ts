/**
 * components/studio/vitals-eval-ui.ts — phần THUẦN của panel đánh giá Vitals: nhãn song ngữ,
 * gom nhóm theo lớp, dòng tóm tắt. Tách khỏi `VitalsEvalPanel.tsx` để test bằng sucrase-node
 * (không React/DOM) và để nhãn lớp chỉ có MỘT nguồn.
 *
 * Nhãn cố ý nói thẳng lớp nào là gì — người dùng phải nhìn là biết mục đang đọc do MÁY ĐO hay
 * do GU/AI (CHOT-TACH-AI §2: tách bằng DẤU, không tách bằng vị trí).
 */
import type { EvalFinding, EvalLayer, EvalRecord, EvalSeverity } from '../../lib/capabilities/vitals-eval-core';
import { summarizeRecord } from '../../lib/capabilities/vitals-eval-core';

export type Song = [string, string];

/** Thứ tự nhóm hiển thị — máy đo trước (đúng/sai có số), rồi học, gu, AI. */
export const LAYER_ORDER: readonly EvalLayer[] = ['deterministic', 'learned', 'taste', 'ai'] as const;

export const LAYER_LABEL: Record<EvalLayer, Song> = {
  deterministic: ['Máy đo · tất định', 'Measured · deterministic'],
  learned: ['Học từ phản hồi', 'Learned from feedback'],
  taste: ['Gu dự án (Thẻ DNA) · không phải luật', 'Project taste (DNA card) · not a rule'],
  ai: ['Góp ý AI · xác suất', 'AI critique · probabilistic'],
};

export const SEVERITY_LABEL: Record<EvalSeverity, Song> = {
  error: ['Lỗi', 'Error'],
  warning: ['Cảnh báo', 'Warning'],
  info: ['Ghi nhận', 'Note'],
};

export const VERDICT_LABEL = {
  accept: ['Nhận', 'Accept'] as Song,
  reject: ['Bỏ', 'Dismiss'] as Song,
};

/** Nhãn phụ nói rõ cơ sở ngưỡng — để "thông lệ" không bị đọc thành "quy chuẩn". */
export const BASIS_LABEL: Record<EvalFinding['basis'], Song> = {
  standard: ['quy chuẩn', 'standard'],
  'measured-convention': ['đo được · ngưỡng thông lệ', 'measured · convention threshold'],
  preference: ['gu', 'preference'],
};

export interface FindingGroup {
  layer: EvalLayer;
  label: Song;
  findings: EvalFinding[];
}

/** Gom theo lớp, GIỮ NGUYÊN thứ tự đã xếp hạng trong từng nhóm; nhóm rỗng bị bỏ. */
export function groupByLayer(findings: readonly EvalFinding[]): FindingGroup[] {
  return LAYER_ORDER.map((layer) => ({
    layer,
    label: LAYER_LABEL[layer],
    findings: findings.filter((f) => f.layer === layer),
  })).filter((g) => g.findings.length > 0);
}

/** Một dòng tóm tắt cho header panel — chỉ số đếm thật, không chấm điểm. */
export function summaryLine(record: EvalRecord): Song {
  const s = summarizeRecord(record);
  return [
    `${s.errors} lỗi · ${s.warnings} cảnh báo · ${s.infos} ghi nhận · ${s.taste} quan sát gu`,
    `${s.errors} errors · ${s.warnings} warnings · ${s.infos} notes · ${s.taste} taste observations`,
  ];
}

/** Phần trăm tin cậy hiển thị (làm tròn, kẹp 0..100). */
export function confidencePct(f: EvalFinding): number {
  return Math.max(0, Math.min(100, Math.round(f.confidence * 100)));
}

/** Dòng "nguồn · phiên bản" ngắn dưới mỗi thẻ. */
export function ruleLine(f: EvalFinding): string {
  return `${f.rule.id} · v${f.rule.version} · ${f.rule.source}`;
}

/** Tên chấm trạng thái Vitals theo kết quả — có lỗi/cảnh báo thật thì 'alert', không thì 'idle'. */
export function vitalsStateFor(record: EvalRecord | null): 'alert' | 'idle' {
  if (!record) return 'idle';
  const s = summarizeRecord(record);
  return s.errors + s.warnings > 0 ? 'alert' : 'idle';
}
