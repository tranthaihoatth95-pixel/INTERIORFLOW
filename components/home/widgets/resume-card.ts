/**
 * components/home/widgets/resume-card.ts — [marker: vietDangDo] LÕI THUẦN của widget
 * "Việc đang dở" (phiếu docs/phieu-giao/P-N-dashboard-la-cua-vao.md, V2).
 *
 * VÌ SAO TÁCH THUẦN: đây là chỗ trả lời hai câu nghiệm thu ĐO ĐƯỢC của phiếu —
 *   ① "không có việc dở → widget TỰ ẨN"  ⇒ `buildResumeCard()` trả `null`
 *   ② "về đúng chỗ cũ ≤ 2 cú bấm"        ⇒ `resumeHref()` trả MỘT đường dẫn, bấm 1 lần là tới
 * Thuần (không React/DOM/localStorage) nên test được bằng sucrase-node, không cần chạy app.
 *
 * ⚠️ CẤM BỊA (ràng buộc V2 của phiếu): mọi trường ở đây phải có NGUỒN THẬT.
 *   · `stage`      ← `ResumeState.route` (ResumeTracker ghi) hoặc `ResumeState.phase` (HomeScreen ghi)
 *   · `daysAgo`    ← `ResumeState.ts` (dấu thời gian thật lúc ghi resume); ts=0 (bản ghi cũ,
 *                     trước khi có trường này) ⇒ `null`, KHÔNG đoán thành "hôm nay"
 *   · `projectName`← khớp id với `recentProjects` của `/api/home/summary`; không khớp ⇒ `null`
 *                     và widget nói "Dự án gần nhất", KHÔNG bịa tên
 *   · ảnh xem trước: KHÔNG CÓ NGUỒN ⇒ không có trường ảnh trong kiểu này (xem ⑦b báo cáo).
 */

// Import TƯƠNG ĐỐI (không '@/') để sucrase-node chạy test trực tiếp — cùng lý do
// `lib/shell/last-stage.ts` và `lib/home/aggregate.ts` làm vậy.
import { isPhase, type Phase } from '../../../lib/phases';

/** Bản sao TỐI THIỂU của `ResumeState` (lib/resume.ts) — chỉ trường lõi này dùng, để file
 * thuần không phải kéo theo zustand/`useSaveStatus` của module đó vào runtime test. */
export interface ResumeLite {
  route: string;
  flowId?: string;
  phase?: Phase;
  ts: number;
}

export interface ResumeCard {
  /** Chặng đang dở — nguồn: route studio đã ghi, hoặc `phase` khi đang ở canvas '/'. */
  stage: Phase;
  /** id điều hướng (`Project.id` thật hoặc `Flow.id`) — null khi không suy được từ đâu. */
  routeId: string | null;
  /** Tên dự án — null = CHƯA BIẾT (không có trong `recentProjects`), không phải "không có tên". */
  projectName: string | null;
  /** Số ngày kể từ lần ghi resume; null = bản ghi cũ không mang dấu thời gian. */
  daysAgo: number | null;
}

/**
 * Route studio đã lưu ↔ chặng. Ngược chiều `LEGACY_STAGE_ROUTE` (lib/scope-core.ts) và khớp
 * `activeToPhase()` (lib/studio/stage-nav.ts) ở điểm `/photo-editor` thuộc chặng 'render'.
 * `'/'` KHÔNG có ở đây: nó là canvas chặng 3D nhưng chặng thật đọc từ `resume.phase`
 * (người dùng có thể đứng ở '/' với workspace='present'), xem `buildResumeCard`.
 */
const ROUTE_TO_PHASE: Record<string, Phase> = {
  '/cad-editor': 'concept',
  '/present-editor': 'present',
  '/photo-editor': 'render',
};

/** Một ngày, tính bằng mili-giây — dùng cho `daysAgo`. */
const DAY_MS = 86_400_000;

/**
 * Dựng dữ liệu thẻ "Việc đang dở", hoặc `null` khi KHÔNG có việc dở.
 *
 * Trả `null` (⇒ widget tự ẩn) khi: chưa từng có resume · resume không suy ra được chặng nào
 * (vd route '/' mà chưa từng lưu `phase`, tức người dùng chưa thật sự vào canvas lần nào).
 */
export function buildResumeCard(
  resume: ResumeLite | null | undefined,
  opts: {
    /** `recentProjects` của `/api/home/summary` — chỉ dùng để TRA TÊN, không quyết định hiện/ẩn. */
    recentProjects?: readonly { id: string; name: string }[];
    /** Dự án đang mở trong store (nếu có) — ưu tiên hơn `resume.flowId` khi điều hướng. */
    currentProjectId?: string | null;
    now?: number;
  } = {},
): ResumeCard | null {
  if (!resume) return null;

  const stage: Phase | null =
    ROUTE_TO_PHASE[resume.route] ?? (isPhase(resume.phase) ? resume.phase : null);
  if (!stage) return null;

  const routeId = opts.currentProjectId || resume.flowId || null;
  const recent = opts.recentProjects ?? [];
  const projectName = routeId ? (recent.find((p) => p.id === routeId)?.name ?? null) : null;

  // ts=0 là bản ghi trước khi `lib/resume.ts` có trường `ts` (nó tự đọc về 0 khi thiếu) —
  // KHÔNG được hiểu thành "1970" hay "hôm nay". Trả null, UI bỏ hẳn dòng thời gian.
  const now = opts.now ?? Date.now();
  const daysAgo = resume.ts > 0 ? Math.max(0, Math.floor((now - resume.ts) / DAY_MS)) : null;

  return { stage, routeId, projectName, daysAgo };
}

/**
 * Đường dẫn về ĐÚNG CHỖ CŨ — MỘT cú bấm từ dashboard (điều kiện "≤ 2 cú bấm" của phiếu).
 *
 * Có `routeId` ⇒ route scope dự án `/projects/<id>/<chặng>` (URL = nguồn sự thật, Task #21).
 * Không có ⇒ rơi về route toàn cục cũ, vốn là cầu redirect tự tra lại dự án
 * (`LegacyStageRedirect`) — vẫn 1 cú bấm, không bắt người dùng tự tìm đường.
 */
export function resumeHref(card: ResumeCard): string {
  const segment = card.stage === 'concept' ? 'cad' : card.stage;
  if (card.routeId) return `/projects/${encodeURIComponent(card.routeId)}/${segment}`;
  return card.stage === 'concept' ? '/cad-editor' : card.stage === 'present' ? '/present-editor' : '/';
}

/**
 * Câu thời gian, song ngữ — `daysAgo` null thì KHÔNG có câu nào (thiếu nguồn thì im lặng,
 * không độn chữ cho đầy chỗ).
 */
export function daysAgoLabel(daysAgo: number | null, en: boolean): string | null {
  if (daysAgo === null) return null;
  if (daysAgo === 0) return en ? 'today' : 'hôm nay';
  if (daysAgo === 1) return en ? 'yesterday' : 'hôm qua';
  return en ? `${daysAgo} days ago` : `${daysAgo} ngày trước`;
}
