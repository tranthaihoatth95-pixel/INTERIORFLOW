/**
 * lib/cad/ai-layout-feedback.ts — vòng phản hồi Nhận/Bỏ cho panel "Đề bài chi tiết" (AiBriefPanel,
 * 20/07). TÁI DÙNG UX MẪU đã được user chấp nhận ở Presenting (components/present-editor/
 * LayoutShelf.tsx: cặp nút Nhận 👍/Bỏ 👎 → PairwisePerceptron học learning-to-rank) — file này
 * CHỈ định nghĩa vector đặc trưng RIÊNG cho "chọn phương án đặt nội thất CAD", KHÔNG phát minh
 * cơ chế feedback mới, KHÔNG đụng lib/gu/feature-dict.ts (từ điển đó dùng chung 3 chặng, namespace
 * `op:*` ở đó dành cho bài toán KHÁC — "furniture pick theo gu" nêu ở RESEARCH-MATERIAL-BRIDGE.md
 * §0, còn ở đây là xếp hạng GIỮA 3 BIẾN THỂ đặt nội thất của CÙNG 1 đề bài).
 *
 * Model dùng chung `PairwisePerceptron` (lib/gu/pairwise-perceptron.ts) — thuần TS, tất định,
 * 0 GPU/key, lưu localStorage. Vì chỉ có 3 lựa chọn/lượt và người dùng luôn thấy đủ cả 3 (không
 * cần model "cầm lái" ẩn bớt lựa chọn), phần học ở đây CHỦ YẾU mang tính giải thích được (explain
 * lý do) — không dùng để lọc/ẩn option nào.
 */

import type { FeatureVector } from '../gu/pairwise-perceptron';
import type { WallVariant } from './ai-assist';

/** Key localStorage — versioned giống quy ước PRESENT_TEMPLATE_MODEL_KEY. */
export const CAD_LAYOUT_OPTION_MODEL_KEY = 'interiorflow.gu.perceptron.cad-layout-option.v1';

export interface LayoutOptionSignal {
  variant: WallVariant;
  /** số vi phạm chuẩn (checkStandards) khi chèn option này vào bản vẽ hiện tại. */
  violationCount: number;
  /** số món nội thất đặt được / tổng số món đề bài yêu cầu — 1 = đặt đủ hết. */
  placedRatio: number;
}

/** Từ điển feature — thang ~[0,1], namespace `layout.*`/`variant:*` (RIÊNG file này, không đụng
 * feature-dict.ts dùng chung 3 chặng). */
export const LAYOUT_FEATURE_DOC: Record<string, string> = {
  'layout.violations': 'Số vi phạm Kiểm chuẩn khi chèn option, chuẩn hoá /6 (0..1, clamp).',
  'layout.placedRatio': 'Tỉ lệ món nội thất đặt được / tổng món yêu cầu (0..1).',
  'variant:*': 'One-hot biến thể tường (0=mặc định · 1=đối diện · 2=xoay 90°).',
};

const VARIANT_LABEL: Record<WallVariant, string> = { 0: 'default', 1: 'opposite', 2: 'rotate90' };

export function layoutOptionFeatures(sig: LayoutOptionSignal): FeatureVector {
  return {
    'layout.violations': Math.min(1, sig.violationCount / 6),
    'layout.placedRatio': Math.max(0, Math.min(1, sig.placedRatio)),
    [`variant:${VARIANT_LABEL[sig.variant]}`]: 1,
  };
}

/** Giải thích ngắn (tối đa 2 lý do) — dùng trọng số đã học nếu có, degrade về nhận xét tất định
 * nếu model chưa đủ dữ liệu (không bịa lý do). */
export function explainLayoutOption(sig: LayoutOptionSignal, weights?: Record<string, number>): string[] {
  const reasons: string[] = [];
  if (sig.violationCount === 0) reasons.push('Không phát hiện vi phạm chuẩn');
  else reasons.push(`${sig.violationCount} vi phạm chuẩn cần xem lại`);
  if (sig.placedRatio < 1) reasons.push('Thiếu chỗ cho một số món nội thất');
  else if (weights && (weights[`variant:${VARIANT_LABEL[sig.variant]}`] ?? 0) > 0.3) {
    reasons.push('Bạn hay chọn biến thể này trước đây');
  }
  return reasons.slice(0, 2);
}
