/**
 * lib/shell/last-stage.ts — [marker: lastStage] ghi/đọc "chặng đang dở" của TỪNG dự án
 * (phiếu docs/phieu-giao/home-overview-card.md, chốt 12/08 ④ Home = Tổng quan dự án).
 *
 * - Khoá theo dự án: `interiorflow.lastStage.<projectKey>` — projectKey là Project.id thật
 *   hoặc Flow.id (flow tự do), cùng quy ước id ổn định của card Gallery
 *   (`f.project?.id ?? f.id`, lib/scope-core.ts `pickStableRouteId`).
 * - Điểm GHI duy nhất: `pickStage()` (lib/studio/stage-nav.ts) — chỗ mọi lần đổi chặng
 *   từ header/mobile menu đều đi qua. Ghi cả 2 khoá (projectId + flowId) để card Gallery
 *   đọc bằng khoá nào cũng trúng.
 * - Điểm ĐỌC: card Gallery (ProjectSelect) — click card nhảy thẳng chặng đang dở,
 *   chưa có thì mặc định 'concept' (phiếu ④.1).
 * - localStorage best-effort (private mode/SSR → im lặng): đây là tiện nghi, không phải
 *   nguồn sự thật; mất giá trị chỉ khiến card mở về mặc định, không mất dữ liệu.
 */

// Import TƯƠNG ĐỐI (không '@/') để sucrase-node chạy được test trực tiếp — cùng lý do
// các lib thuần có test khác tránh alias; lib/phases.ts là module thuần, không kéo React/store.
import { isPhase, type Phase } from '../phases';

const PREFIX = 'interiorflow.lastStage.';

/** Ghi chặng đang dở cho một dự án. projectKey rỗng/null → bỏ qua (không có gì để neo). */
export function setLastStage(projectKey: string | null | undefined, phase: Phase): void {
  if (!projectKey) return;
  try {
    localStorage.setItem(PREFIX + projectKey, phase);
  } catch {
    /* localStorage bị chặn — bỏ qua, không phải nguồn sự thật */
  }
}

/** Đọc chặng đang dở — null nếu chưa từng ghi / giá trị hỏng / localStorage bị chặn. */
export function getLastStage(projectKey: string | null | undefined): Phase | null {
  if (!projectKey) return null;
  try {
    const v = localStorage.getItem(PREFIX + projectKey);
    return isPhase(v) ? v : null;
  } catch {
    return null;
  }
}
