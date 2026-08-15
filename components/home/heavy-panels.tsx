'use client';

/**
 * components/home/heavy-panels.tsx — wrapper `next/dynamic` cho dàn panel/modal NẶNG của
 * HomeScreen (phiếu `docs/phieu-giao/home-nav-lag.md`, 14/08).
 *
 * VÌ SAO: HomeScreen import TĨNH toàn bộ dàn này → chunk route `/` (và `/projects/[id]/render`)
 * phình 28,6 MB dev / 1.986 module (đo 14/08, xem báo cáo
 * `docs/bao-cao-phien/2026-08-14-NL-home-nav-lag.md`) — kéo cả `three-mesh-bvh`,
 * `three-bvh-csg`, d3 (ReactFlow)… vào đường nạp, dù phần lớn component CHỈ render theo
 * điều kiện (modal đóng, mode chưa bật, panel tự gate bằng store). Bấm điều hướng về Home
 * là phải tải + parse trọn khối đó → lag Hoà bắt được ở Lô duyệt mắt #1.
 *
 * CÁCH LÀM: cùng mẫu tiền lệ repo (`components/three/Scene3DPreviewModal.tsx`,
 * `components/present-editor/PresentSheets.tsx`) — `dynamic(..., { ssr: false })`, fallback
 * mặc định (null, không chế UI mới). Mỗi component giữ NGUYÊN tên + prop; HomeScreen chỉ đổi
 * nguồn import, KHÔNG đổi hành vi/thứ tự render có điều kiện.
 *
 * TỪNG CÁI — vì sao KHÔNG nằm trên đường first-paint:
 *   · MaskPainterModal / AnnotateModal / MoodboardModal / Lightbox / CommandPalette —
 *     modal tự gate bằng store, mount là return null khi đóng.
 *   · Dashboard — overlay gated `dashboardOpen` (nhánh gallery) · toàn màn CHỈ ở cover-mode
 *     (<480px, edge case foldable).
 *   · GalleryPanel / LibraryPanel / ChatPanel — sheet tự gate (`panel`/`chatOpen`).
 *   · NodeLibraryPanel — navigator ổ ② của canvas (khung AppShell tĩnh vẫn hiện ngay,
 *     ruột panel vào sau một nhịp — đổi này là chủ đích của phiếu, T đã liệt kê).
 *   · Object3DTree / Object3DInspector / Render3DModeSkeleton — chỉ mode 'model3d' (3d/3d);
 *     đây là nhánh kéo three-mesh-bvh/csg vào chunk.
 *   · RenderToolModeOverlay — overlay tool-window tự gate.
 *   · PresentOverlay — chỉ mount khi `presentModeOpen` (đã bọc điều kiện sẵn ở HomeScreen).
 *
 * GIỮ TĨNH ở HomeScreen (luôn hiện / thân chính): LoginScreen · DongStudioHome · AppShell ·
 * RenderDocBar · StatusBar · ModeShell · FlowCanvas · CommentLayer · WelcomeIntro · StageIntroCard.
 */

import dynamic from 'next/dynamic';

// ── Modal tự gate bằng store (đóng = null) ────────────────────────────────────────────────
export const MaskPainterModal = dynamic(
  () => import('@/components/MaskPainterModal').then((m) => m.MaskPainterModal),
  { ssr: false },
);
export const AnnotateModal = dynamic(
  () => import('@/components/AnnotateModal').then((m) => m.AnnotateModal),
  { ssr: false },
);
export const MoodboardModal = dynamic(
  () => import('@/components/MoodboardModal').then((m) => m.MoodboardModal),
  { ssr: false },
);
export const Lightbox = dynamic(() => import('@/components/Lightbox').then((m) => m.Lightbox), {
  ssr: false,
});
export const CommandPalette = dynamic(
  () => import('@/components/CommandPalette').then((m) => m.CommandPalette),
  { ssr: false },
);

// ── Panel/overlay gated ───────────────────────────────────────────────────────────────────
export const Dashboard = dynamic(() => import('@/components/Dashboard').then((m) => m.Dashboard), {
  ssr: false,
});
export const GalleryPanel = dynamic(
  () => import('@/components/GalleryPanel').then((m) => m.GalleryPanel),
  { ssr: false },
);
export const LibraryPanel = dynamic(
  () => import('@/components/LibraryPanel').then((m) => m.LibraryPanel),
  { ssr: false },
);
export const ChatPanel = dynamic(() => import('@/components/ChatPanel').then((m) => m.ChatPanel), {
  ssr: false,
});
export const NodeLibraryPanel = dynamic(
  () => import('@/components/NodeLibraryPanel').then((m) => m.NodeLibraryPanel),
  { ssr: false },
);
export const RenderToolModeOverlay = dynamic(
  () => import('@/components/render-studio/RenderToolModeOverlay'),
  { ssr: false },
);
export const PresentOverlay = dynamic(() => import('@/components/present/PresentOverlay'), {
  ssr: false,
});
/** Hàng đợi render (RQ) — cửa sổ nổi tự gate: hàng đợi rỗng thì component trả null. */
export const RenderQueuePanel = dynamic(
  () => import('@/components/render-studio/RenderQueuePanel'),
  { ssr: false },
);

// ── Nhánh mode 'model3d' (3d/3d) — nơi kéo three-mesh-bvh/three-bvh-csg ──────────────────
export const Object3DTree = dynamic(
  () => import('@/components/render-studio/Object3DTree').then((m) => m.Object3DTree),
  { ssr: false },
);
export const Object3DInspector = dynamic(
  () => import('@/components/render-studio/Object3DInspector').then((m) => m.Object3DInspector),
  { ssr: false },
);
export const Render3DModeSkeleton = dynamic(
  () => import('@/components/render-studio/Render3DModeSkeleton'),
  { ssr: false },
);
