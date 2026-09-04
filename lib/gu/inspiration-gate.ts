/**
 * lib/gu/inspiration-gate.ts — CỔNG ĐẦU VÀO cho ảnh tham khảo TRƯỚC KHI nó được phép ảnh hưởng
 * thiết kế (Thẻ DNA / Gu). Thuần, tất định, test bằng sucrase-node.
 *
 * Bắt ba họ lỗi (đề bài slice 11): ① QUYỀN (giấy phép không rõ · link trang Pinterest · AI sinh)
 * ② KHÔNG HỖ TRỢ (ảnh quá nhỏ · tỉ lệ cực đoan · chưa phân tích) ③ ĐỘ TIN THẤP (chỉ đọc được
 * palette, không hình học/không ngữ nghĩa/không vùng).
 *
 * Luật hai lớp (chốt 07/08 §12): đây là LỚP LUẬT — đúng/sai có lý do, chạy 10 lần ra 10 kết quả,
 * KHÔNG gọi AI. Mức `block` chặn nút Áp; mức `warn` cho đi tiếp nhưng bắt người XÁC NHẬN quyền khi
 * cần (`needsRightsAck`) — [T5] con người quyết cuối, máy không tự cho qua.
 */

import { isPinterestPageUrl } from '../stock-photos';
import { classifyLicense } from './inspiration-facets';
import type { SurfaceKind } from './inspiration-facets';

/** Phần của bản đọc ảnh mà cổng cần — cấu trúc, nên NHẬN CẢ `ImageIntelligence` (đầy đủ, có mask)
 * LẪN `ImageIntelligenceSummary` (bản lưu, không mask). */
export interface GateAnalysisLike {
  overallConfidence: number;
  geometry: { calibrated: boolean };
  furniture: { available: boolean };
  surfaces: Record<SurfaceKind, { available: boolean }>;
  semantic: { confidence: number };
}

export type GateSeverity = 'block' | 'warn' | 'info';

export type GateCode =
  | 'rights-pinterest'
  | 'rights-unknown'
  | 'rights-user'
  | 'ai-generated'
  | 'attribution-required'
  | 'too-small'
  | 'extreme-aspect'
  | 'not-analyzed'
  | 'low-confidence'
  | 'thin-evidence';

export interface GateIssue {
  code: GateCode;
  severity: GateSeverity;
  vi: string;
  en: string;
}

export interface GateResult {
  verdict: 'ok' | 'warn' | 'block';
  issues: GateIssue[];
  /** có ít nhất một vấn đề QUYỀN cần người bấm "tôi có quyền dùng ảnh này" mới được Áp. */
  needsRightsAck: boolean;
}

export interface GateInput {
  license: string | null | undefined;
  /** URL/tên nguồn (tag `nguon:`) — dùng để bắt link TRANG Pinterest. */
  source?: string | null;
  width?: number | null;
  height?: number | null;
  /** kết quả đọc ảnh — thiếu = chưa phân tích (chặn Áp). */
  analysis?: GateAnalysisLike | null;
}

/** Ảnh dưới cạnh này không đủ pixel để đọc gì có nghĩa. */
export const MIN_SIDE_PX = 256;
/** Tỉ lệ cạnh vượt ngưỡng này (dài/ngắn) thường là panorama/dải băng — cảnh báo, không chặn. */
export const MAX_ASPECT = 4;
/** Dưới ngưỡng này thì không nên để ảnh ảnh hưởng thiết kế. */
export const LOW_CONFIDENCE_BLOCK = 0.2;

const SEV_RANK: Record<GateSeverity, number> = { info: 0, warn: 1, block: 2 };

export function gateInspiration(input: GateInput): GateResult {
  const issues: GateIssue[] = [];

  /* ── ① quyền ── */
  if (input.source && isPinterestPageUrl(input.source)) {
    issues.push({
      code: 'rights-pinterest',
      severity: 'block',
      vi: 'Nguồn là TRANG Pinterest — không có giấy phép, không được dùng làm tham khảo thiết kế.',
      en: 'Source is a Pinterest PAGE — no license, cannot be used as a design reference.',
    });
  }
  const lic = classifyLicense(input.license);
  switch (lic.cls) {
    case 'unknown':
      issues.push({
        code: 'rights-unknown',
        severity: 'warn',
        vi: 'Chưa rõ giấy phép — chỉ dùng tham khảo nội bộ; xác nhận quyền trước khi áp vào Thẻ DNA.',
        en: 'License unknown — internal reference only; confirm rights before applying to the DNA card.',
      });
      break;
    case 'user-responsibility':
      issues.push({
        code: 'rights-user',
        severity: 'warn',
        vi: 'Ảnh tự dán/tải — bạn tự chịu trách nhiệm bản quyền. Xác nhận để áp.',
        en: 'Pasted/uploaded image — you are responsible for its rights. Confirm to apply.',
      });
      break;
    case 'ai':
      issues.push({
        code: 'ai-generated',
        severity: 'warn',
        vi: 'Ảnh AI sinh — hình học trong ảnh KHÔNG phải bằng chứng đo thật, chỉ lấy màu/không khí.',
        en: 'AI-generated — geometry in this image is NOT measured evidence; use colour/mood only.',
      });
      break;
    case 'lawful-attribution':
      issues.push({
        code: 'attribution-required',
        severity: 'info',
        vi: 'Dùng được — phải ghi công tác giả khi đưa vào hồ sơ.',
        en: 'Usable — credit the author when it enters deliverables.',
      });
      break;
    default:
      break;
  }

  /* ── ② không hỗ trợ ── */
  const w = input.width ?? 0;
  const h = input.height ?? 0;
  if (w > 0 && h > 0) {
    if (Math.min(w, h) < MIN_SIDE_PX) {
      issues.push({
        code: 'too-small',
        severity: 'block',
        vi: `Ảnh quá nhỏ (${w}×${h}) — cần cạnh ngắn ≥ ${MIN_SIDE_PX}px để đọc được gì có nghĩa.`,
        en: `Image too small (${w}×${h}) — short side must be ≥ ${MIN_SIDE_PX}px to read anything meaningful.`,
      });
    }
    const aspect = Math.max(w, h) / Math.min(w, h);
    if (aspect > MAX_ASPECT) {
      issues.push({
        code: 'extreme-aspect',
        severity: 'warn',
        vi: 'Tỉ lệ khung cực đoan (panorama/dải) — bố cục và hình học đọc kém tin cậy.',
        en: 'Extreme aspect ratio (panorama/strip) — composition and geometry reads are unreliable.',
      });
    }
  }

  /* ── ③ độ tin ── */
  const a = input.analysis;
  if (!a) {
    issues.push({
      code: 'not-analyzed',
      severity: 'block',
      vi: 'Chưa đọc ảnh — bấm Phân tích trước khi áp.',
      en: 'Image not analysed yet — run Analyse before applying.',
    });
  } else {
    if (a.overallConfidence < LOW_CONFIDENCE_BLOCK) {
      issues.push({
        code: 'low-confidence',
        severity: 'block',
        vi: 'Độ tin quá thấp — không đọc được gì ngoài màu. Thêm tên/caption hoặc chọn ảnh rõ hơn.',
        en: 'Confidence too low — nothing readable beyond colour. Add a name/caption or pick a clearer image.',
      });
    } else {
      const anySurface = (['ceiling', 'wall', 'floor'] as const).some((k) => a.surfaces[k].available);
      const semanticAny = a.semantic.confidence > 0;
      if (!a.geometry.calibrated && !a.furniture.available && !anySurface && !semanticAny) {
        issues.push({
          code: 'thin-evidence',
          severity: 'warn',
          vi: 'Chỉ đọc được màu và ánh sáng — áp sẽ chỉ nuôi lớp Màu + Ánh sáng của Thẻ DNA.',
          en: 'Only colour and light were readable — applying will feed only the Colour + Light layers.',
        });
      }
    }
  }

  const top = issues.reduce<GateSeverity>((m, i) => (SEV_RANK[i.severity] > SEV_RANK[m] ? i.severity : m), 'info');
  const verdict: GateResult['verdict'] = top === 'block' ? 'block' : top === 'warn' ? 'warn' : 'ok';
  const needsRightsAck = issues.some((i) => i.code === 'rights-unknown' || i.code === 'rights-user');
  return { verdict, issues, needsRightsAck };
}

/** Nút Áp được bật khi không bị chặn VÀ (không cần xác nhận quyền HOẶC đã xác nhận). */
export function canApply(gate: GateResult, rightsAcknowledged: boolean): boolean {
  if (gate.verdict === 'block') return false;
  if (gate.needsRightsAck && !rightsAcknowledged) return false;
  return true;
}
