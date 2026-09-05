'use client';

/**
 * components/home/HomeScreen.tsx — SHELL app chính (trước là `app/page.tsx`, tách ra ở
 * Task #21 · ĐỔ NỀN 1B để hai route cùng mount ĐÚNG một component):
 *
 *   · `/`                       → `<HomeScreen />`            (route toàn cục, hành vi cũ:
 *                                 login → Gallery/ProjectSelect → canvas, auto-resume…).
 *   · `/projects/[id]/render`   → `<HomeScreen projectRouteId={id} />` (SCOPE DỰ ÁN).
 *
 * Khi có `projectRouteId`: **URL là nguồn sự thật** — bỏ qua toàn bộ nhánh ProjectSelect /
 * auto-resume (những thứ đoán "đang ở dự án nào" từ store/localStorage) và ép store nạp
 * đúng dự án của URL qua `ensureProjectScope`. Logic nghiệp vụ canvas giữ nguyên 100%.
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ReactFlowProvider } from '@xyflow/react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { LoginScreen } from '@/components/entry/LoginScreen';
import { WelcomeIntro } from '@/components/entry/WelcomeIntro';
import { StageIntroCard } from '@/components/onboarding/StageIntroCard';
import { AppShell } from '@/components/studio/AppShell';
import { RenderDocBar } from '@/components/studio/RenderDocBar';
import { FlowCanvas } from '@/components/FlowCanvas';
import StatusBar from '@/components/studio/StatusBar';
// Dàn panel/modal NẶNG chỉ-render-theo-điều-kiện → `next/dynamic` (ssr:false) qua wrapper
// `heavy-panels.tsx` — tách khỏi chunk route `/` (28,6 MB dev → xem phiếu home-nav-lag).
// Tên + prop giữ NGUYÊN, chỉ đổi nguồn import; hành vi/thứ tự render có điều kiện không đổi.
import {
  NodeLibraryPanel,
  GalleryPanel,
  LibraryPanel,
  ChatPanel,
  MoodboardModal,
  CommandPalette,
  MaskPainterModal,
  AnnotateModal,
  Lightbox,
  Dashboard,
  RenderToolModeOverlay,
  Render3DModeSkeleton,
  Object3DTree,
  Object3DInspector,
  PresentOverlay,
  RenderQueuePanel,
} from '@/components/home/heavy-panels';
import { useTree3DUi } from '@/lib/render-studio/tree3d-ui';
import ModeShell from '@/components/shell/ModeShell';
import { useStageMode, useHydrateRenderMode } from '@/lib/stage-mode';
// 04/09 (bản khoá Home, `docs/delivery/DESIGN-LOCK-HOME.md`) — thân Home đổi từ lưới bento
// (`DongStudioHome`) sang THANG CHÚ Ý bốn bậc (`XuongHome`). D-DR2 đòi ĐÚNG MỘT tiêu điểm và
// N-10 xếp "bento làm mặc định" vào cờ đỏ; NO-REBUILD §B25 bảo vệ NĂNG LỰC/HỢP ĐỒNG/DỮ LIỆU,
// **không** bảo vệ bố cục thị giác đã bị đè. Năng lực của bản cũ được mang sang nguyên vẹn:
// `SystemWallpaper` · `loadResume`/`buildResumeCard`/`resumeHref` · `/api/home/summary`.
// 🔴 05/09 — `DongStudioHome.tsx` (+ `ProjectSelect.tsx` + `ProjectOverviewCard.tsx`) ĐÃ XOÁ khỏi
// cây. Câu cũ ở đây ("giữ lại làm bằng chứng — không xoá, không mount") HẾT HIỆU LỰC: giữ mã chết
// trong cây KHÔNG phải cách lưu bằng chứng — lịch sử git mới là chỗ đó (`931cf3c9` · `a2bc9bda` ·
// `388a8932`), còn mã chết nằm lại chỉ khiến phiên sau tưởng nó là khuôn mẫu đang dùng.
// Sổ cách ly: `docs/delivery/LEGACY-DESIGN-QUARANTINE.md`.
import XuongHome from '@/components/home/XuongHome';
// 04/09 — ĐƯỜNG TẠO DỰ ÁN THẬT cho Home. KHÔNG dựng mới: `ProjectInitBoard` đã là cửa tạo dự án
// chuẩn từ 12/08 (createProject → createFlow gắn thẳng projectId → gieo hồ sơ/việc), trước nay chỉ
// mở được từ `ProjectSelect` — mà `ProjectSelect` thôi mount ở '/' từ khi Home đổi sang XuongHome.
// Đây là CONNECT theo NO-REBUILD §B25, không phải NEW.
import { ProjectInitBoard } from '@/components/project-init/ProjectInitBoard';
import { createFlow, openFlow } from '@/lib/workspace';
import { useLang } from '@/lib/i18n';
import { CommentLayer } from '@/components/CommentLayer';
import { useFlowStore } from '@/lib/store';
// [marker: cuaVaoDashboard] `bootstrapWorkspace`/`openFlow` ĐÃ BỎ khỏi file này (16/08): nơi gọi
// duy nhất là nhánh auto-resume "vào thẳng canvas" vừa cắt. Việc mở flow nay do `ProjectSelect`
// (người dùng bấm dự án) và `ensureProjectScope` (route scope dự án) lo — không mất đường nào.
import { applyCadHandoff } from '@/lib/cad/handoff';
import { fade } from '@/lib/motion';
import {
  loadResume,
  saveResume,
  setLastUserId,
  isTourDone,
  markTourDone,
  consumeForceGallery,
  GO_HOME_EVENT,
} from '@/lib/resume';
import { ensureProjectScope } from '@/lib/project-scope';
import { stableProjectRouteId } from '@/lib/scope';
import { stageRoutePath } from '@/lib/scope-core';
import { defineMode, requireMode, type ModeId } from '@/lib/shell/mode-registry';
import type { RenderStageMode } from '@/lib/stage-mode';
import { doTaiKhoanTrong, duocChaoTuDong } from '@/lib/ui/tai-khoan-trong';

/**
 * Ngưỡng bề rộng phân biệt màn HẸP (cover foldable / điện thoại) vs màn ĐỦ RỘNG.
 * Oppo Find N6: cover ~410px · inner ~884px. Đặt 480px: bám sát cover (410) để KHÔNG
 * bắt nhầm cửa sổ desktop hẹp / tablet dọc (≥480 vẫn vào full app). Có nút "Mở toàn bộ
 * app" nên kể cả màn hẹp cũng không kẹt.
 */
const COVER_MAX_WIDTH = 480;

/**
 * 05/08 VIỆC A3 (`docs/PHIEU-CODE-IF-DOT6-2026-08-03.md`, Trụ 4) — khai 2 mode chặng Dựng
 * (3D Thiết kế) qua `defineMode()` thay cho `if (mode === 'render') … else …` từng nằm thẳng
 * trong `content={(mode) => …}` của `<ModeShell>` bên dưới.
 *
 * VIỆC "MỘT THƯ VIỆN" (`PHIEU-CODE-IF-DOT6`, 05/08 — SỬA lại đoạn dưới đây, trước ghi "Navigator
 * KHÔNG đổi theo renderMode... đúng hành vi THẬT", nay KHÔNG còn đúng nữa): `RENDER_NAVIGATOR`
 * (NodeLibraryPanel, có kệ Vật liệu ATLAS riêng) và `Command3DPanel` bên trong
 * `Render3DModeSkeleton` (cũng có tab Vật liệu riêng) từng CÙNG HIỆN một lúc ở mode '3d/3d' — Hoà
 * chụp màn bắt được vật liệu hiện Ở BA CHỖ (sidebar trái · panel giữa · sheet Thư viện). Navigator
 * nay ĐỔI theo renderMode: `3d/node` (canvas node) vẫn `RENDER_NAVIGATOR` như cũ; `3d/3d` (Vẽ 3D)
 * đổi sang `RENDER_3D_NAVIGATOR` (`Object3DTree` — cây đối tượng theo tầng, không có kệ vật liệu
 * nào cả, xoá đúng 1 trong 3 chỗ). Panel thuộc tính của vật đang chọn (kích thước/vật liệu quả
 * cầu/tầng) dời sang ổ ④ Inspector (`Object3DInspector`, xem `inspectorContent` dưới `<AppShell>`).
 *
 * `renderMode` (`'render'|'model3d'`, `lib/stage-mode.ts`) là KHOÁ KỸ THUẬT đã persist
 * localStorage — GIỮ NGUYÊN, chỉ map sang `ModeId` Trụ-4 lúc tra registry (cùng cách
 * `CadStageScreen.tsx` map `cadMode` → `ModeId`).
 */
const RENDER_NAVIGATOR: ReactNode = <NodeLibraryPanel embedded />;
const RENDER_3D_NAVIGATOR: ReactNode = <Object3DTree />;
const RENDER_NODE_CANVAS: ReactNode = (
  <>
    {/* NodeLibraryPanel giờ sống Ở NAVIGATOR (embedded, xem RENDER_NAVIGATOR trên) — KHÔNG mount
        thêm bản sheet-trượt ở đây nữa (tránh 2 bản SketchStudioModal/SmartSelectModal/
        WarpCornersModal cùng lúc — cả 3 modal đó mount BÊN TRONG NodeLibraryPanel, xem
        component). Command Palette "Mở Node Library" giờ vô hại/không còn tác dụng hiển thị
        (Navigator luôn hiện sẵn) — chưa dọn action đó, không phải regression, panel không
        "mất" mà LUÔN ở đó. */}
    <GalleryPanel />
    <LibraryPanel />
    {/* Cả 3 chặng đều là canvas node (Present sang studio riêng). Nút Tải lên/Concept = moodboard. */}
    <FlowCanvas />
    <RenderToolModeOverlay />
    <ChatPanel />
  </>
);

defineMode('3d/node', {
  stage: 'render',
  label: ['Node', 'Node'],
  navigator: RENDER_NAVIGATOR,
  canvas: RENDER_NODE_CANVAS,
  shelves: ['render-preset', 'render-mood', 'render-chain', 'render-form'],
  commands: 'render.node.*',
});
defineMode('3d/3d', {
  stage: 'render',
  label: ['3D', '3D'],
  navigator: RENDER_3D_NAVIGATOR,
  canvas: <Render3DModeSkeleton />,
  // 'camera'/'massing' trong ví dụ Trụ 4 của spec chưa có id kệ thật trong lib/library/shelves.ts
  // (chỉ 'common-atlas' tồn tại) — khai đúng cái CÓ THẬT, không bịa id chưa tồn tại.
  shelves: ['common-atlas'],
  commands: 'render.3d.*',
});

/** `'render'` (canvas node) → `'3d/node'`, `'model3d'` (Vẽ 3D) → `'3d/3d'`. */
function renderModeToModeId(m: RenderStageMode): ModeId {
  return m === 'render' ? '3d/node' : '3d/3d';
}

/**
 * Hook đọc bề rộng viewport — SSR-safe (khởi tạo undefined, đo trong effect để tránh
 * hydration mismatch). Tự cập nhật khi gập/mở máy (resize).
 */
function useIsCoverScreen(): boolean {
  const [isCover, setIsCover] = useState(false);
  useEffect(() => {
    const check = () => setIsCover(window.innerWidth < COVER_MAX_WIDTH);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isCover;
}

export default function HomeScreen({ projectRouteId }: { projectRouteId?: string } = {}) {
  const user = useFlowStore((s) => s.user);
  // H1 (docs/SPEC-MODE-PER-STAGE.md §1) — mode chặng Render: 'render' (canvas node + Mood/Collab,
  // mặc định, hành vi cũ nguyên vẹn) ↔ 'model3d' (Vẽ 3D, skeleton mới — xem components/render-studio/Render3DModeSkeleton.tsx).
  useHydrateRenderMode();
  const { mode: renderMode, setMode: setRenderMode } = useStageMode('render');
  // VIỆC "MỘT THƯ VIỆN" — quyết định hiện/ẩn khung Inspector (ổ ④) cho mode 'model3d': chỉ khi đã
  // chọn một khối trong cây (`Object3DTree`, ổ ② — state chia sẻ qua `useTree3DUi`).
  const selected3DName = useTree3DUi((s) => s.selectedName);
  // Màn ngoài (cover) hẹp → chỉ cho XEM Dashboard; mọi thao tác ở màn trong.
  const isCover = useIsCoverScreen();
  // Sau khi auth thành công → hiện màn CHỌN DỰ ÁN (ProjectSelect) trước canvas.
  // stageDone bật khi người dùng đã chọn dự án & vào canvas.
  //
  // 🔴 Bug chặng CAD↔Rendering (21/07): trước đây khởi tạo `false` rồi chỉ chuyển thành
  //    `true` sau khi enterAfterAuth() chạy XONG (async, sau /api/auth/me). Mỗi lần
  //    Home mount lại (vd bấm Render từ /cad-editor → router.push('/')), giữa khoảng mount
  //    và fetch xong (~50-300ms) return của component rơi vào nhánh `!stageDone` → render
  //    ProjectSelect (Gallery) BÊN DƯỚI StageVeil. Veil kéo ra sau 2 rAF (~32ms) tiết lộ
  //    Gallery → dăm milli-giây sau enterAfterAuth setStageDone(true) → flash sang canvas.
  //    Cảm giác đúng là "chuyển chặng lag/nhảy/văng về đăng nhập" user báo.
  //    Fix: đọc cờ đồng bộ ngay lúc init state; nếu localStorage stageDone === user.id đã
  //    có trong store (returning từ studio route) → stageDone=true NGAY từ render đầu.
  //    Không đụng flow cold-start (user chưa có → false → ProjectSelect như cũ).
  //
  //    Task #21: đứng trên `/projects/[id]/render` thì URL ĐÃ nói rõ dự án nào → không có
  //    khái niệm "chưa chọn dự án", stageDone = true ngay từ render đầu (không bao giờ
  //    nháy qua ProjectSelect).
  // B-1: cờ "đã xem /intro" — đọc lazy trong useState(() => ...) giống mẫu stageDone bên
  // dưới để tránh hydration mismatch (SSR không có localStorage). true = đã xem/bỏ qua,
  // false = chưa từng thấy (kể cả lỗi đọc localStorage — coi như chưa xem, an toàn hơn).
  const [introSeen] = useState(() => {
    if (typeof window === 'undefined') return true;
    try {
      return localStorage.getItem('if_intro_seen_v1') === '1';
    } catch {
      return true;
    }
  });
  //
  // 🟢 [marker: cuaVaoDashboard] 16/08 (Hoà chốt, phiếu P-N) — ĐĂNG NHẬP LUÔN DỪNG Ở DASHBOARD.
  //    Khối đọc `localStorage 'interiorflow.stageDone'` ở đây ĐÃ GỠ: nó là nhánh "returning-user
  //    thì vào thẳng canvas, bỏ qua Home" — chính thứ Hoà bảo đổi. Nay route TOÀN CỤC '/' luôn
  //    khởi tạo `false` ⇒ luôn dựng `<XuongHome/>` (04/09 đổi từ `<DongStudioHome/>`; tệp đó nay
  //    đã xoá — xem khối chú thích ở đầu tệp). Việc đang dở KHÔNG mất: nó lên bậc tiêu điểm của
  //    thang chú ý — đổi từ ÉP sang MỜI.
  //    Bug flash 21/07 (ghi ở khối comment trên) KHÔNG tái phát: nó xảy ra vì Gallery là màn
  //    TRUNG GIAN nháy qua trước khi nhảy canvas; nay Gallery/dashboard LÀ ĐÍCH, không có cú
  //    nhảy nào sau nó nên không còn gì để nháy.
  //    Route SCOPE DỰ ÁN `/projects/[id]/render` giữ nguyên `true` — URL đã nói rõ dự án nào,
  //    đó là người dùng CHỦ ĐỘNG mở một chặng, không phải "tự nhảy" lúc đăng nhập.
  const [stageDone, setStageDone] = useState(() => !!projectRouteId);
  // Onboarding Tầng 1 (thay Smart Tour cũ) — WelcomeIntro bật cho user CHƯA có dấu chân
  // (không resume, không stageDone, chưa tourDone). Bỏ qua/hoàn tất → markTourDone theo
  // user.id, không hiện lại (help menu "Xem lại hướng dẫn" là cách DUY NHẤT hiện lại).
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  // Cover (màn ngoài Oppo) mặc định chỉ Dashboard; nút "Mở toàn bộ app" ép vào full app
  // để KHÔNG bị kẹt khi viewport hẹp (điện thoại thường / cửa sổ nhỏ).
  const [forceFullApp, setForceFullApp] = useState(false);
  const router = useRouter();
  const currentFlowId = useFlowStore((s) => s.currentFlowId);
  const workspace = useFlowStore((s) => s.workspace);
  const panel = useFlowStore((s) => s.panel);
  const chatOpen = useFlowStore((s) => s.chatOpen);
  const setPanel = useFlowStore((s) => s.setPanel);
  const setChatOpen = useFlowStore((s) => s.setChatOpen);
  const presentModeOpen = useFlowStore((s) => s.presentModeOpen);
  const setPresentModeOpen = useFlowStore((s) => s.setPresentModeOpen);
  // Trên mobile các panel đè lên canvas → cần lớp nền mờ để bấm ra ngoài là đóng.
  const overlayOpen = panel !== null || chatOpen;

  // StrictMode dev chạy effect mount 2 lần → 2 chuỗi bootstrapWorkspace song song,
  // openFlow của chuỗi sau đè graph (mất node CAD-handoff vừa apply). Ref sống qua
  // simulated-remount nên chặn được lần 2; remount THẬT (điều hướng) ref mới → chạy lại.
  const bootRan = useRef(false);

  /** Huỷ phép đo "tài khoản có trống không" nếu người dùng rời đi trước khi server trả lời. */
  const chaoAbort = useRef<AbortController | null>(null);
  useEffect(() => () => chaoAbort.current?.abort(), []);
  /* ── ĐƯỜNG TẠO DỰ ÁN TỪ HOME (04/09, đóng lỗi chặn D-J04a) ────────────────────────────── */
  const lang = useLang();
  const [initOpen, setInitOpen] = useState(false);

  // Rail dẫn về đây kèm `?mo=du-an` khi người dùng bấm một chặng mà CHƯA có dự án nào
  // (xem `components/nav/muc-dieu-huong.ts` → `duongCua`). Bung sẵn hộp khởi tạo để một cú bấm
  // ra đúng việc họ đang muốn, thay vì đổ họ về Home rồi để tự mò.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('mo') !== 'du-an') return;
    setInitOpen(true);
    // Dọn tham số khỏi thanh địa chỉ: F5 hay chia sẻ link không nên bung lại hộp thoại.
    sp.delete('mo');
    const q = sp.toString();
    window.history.replaceState(null, '', window.location.pathname + (q ? `?${q}` : ''));
  }, []);
  const [initLoi, setInitLoi] = useState<string | null>(null);

  /**
   * Task #21 — NÂNG URL từ route toàn cục `/` lên scope dự án `/projects/[id]/render`
   * sau khi đã biết chắc đang mở dự án nào (store vừa nạp flow). Chỉ chạy ở chế độ toàn
   * cục; khi đã đứng trên route dự án thì không làm gì (URL đã là chân lý).
   *
   * Dùng `replace` chứ không `push`: đây là "chuẩn hoá địa chỉ", không phải một bước
   * điều hướng mới — Back của trình duyệt phải về chỗ trước đó, không kẹt vòng `/` ⇄ dự án.
   */
  const toProjectRender = useCallback(() => {
    const id = stableProjectRouteId('');
    // Đã đứng đúng id rồi → không đụng URL (tránh vòng replace vô tận).
    if (!id || id === projectRouteId) return;
    router.replace(stageRoutePath(id, 'render'));
  }, [router, projectRouteId]);

  /**
   * VÀO DỰ ÁN VỪA TẠO. Đi đúng đường cũ của `ProjectSelect`: nạp graph vào store (`openFlow`)
   * → consume handoff CAD nếu có → điều hướng sang chặng của dự án. `router.push` chứ không
   * `replace`: người dùng vừa CHỦ ĐỘNG tạo, nút Lùi phải đưa họ về Home được.
   */
  const vaoDuAnVuaTao = useCallback(
    async (flowId: string) => {
      setInitLoi(null);
      try {
        await openFlow(flowId);
        applyCadHandoff();
        const id = stableProjectRouteId('');
        setInitOpen(false);
        if (id) router.push(stageRoutePath(id, 'render'));
        else setStageDone(true);
      } catch {
        // Dự án ĐÃ được tạo trên máy chủ; chỉ khâu mở là hỏng ⇒ nói đúng như thế, đừng để
        // người dùng bấm tạo lần hai rồi đẻ dự án trùng.
        setInitLoi(
          lang === 'en'
            ? 'The project was created but could not be opened — reload the page and pick it in the project column.'
            : 'Dự án đã tạo xong nhưng chưa mở được — tải lại trang rồi chọn nó ở cột dự án.',
        );
      }
    },
    [router, lang],
  );

  /** "Bỏ qua, tạo trống" trong bảng khởi tạo — đường 1-click cũ, giữ nguyên (luật X2). */
  const taoTrongRoiVao = useCallback(async () => {
    setInitLoi(null);
    try {
      const flowId = await createFlow(lang === 'en' ? 'New project' : 'Dự án mới', JSON.stringify({ nodes: [], edges: [] }));
      await vaoDuAnVuaTao(flowId);
    } catch {
      setInitLoi(lang === 'en' ? 'Could not create the project — try again.' : 'Không tạo được dự án — thử lại.');
    }
  }, [vaoDuAnVuaTao, lang]);

  /**
   * Điều phối SAU-AUTH — gọi khi có user (session cũ qua /api/auth/me hoặc vừa login).
   *
   * 🟢 [marker: cuaVaoDashboard] 16/08 — VIẾT LẠI: **mọi lối đều dừng ở dashboard.**
   *   · SCOPE DỰ ÁN (`/projects/[id]/render`): URL là chân lý, vào thẳng chặng đó (không đổi).
   *   · Bấm "Home" (`consumeForceGallery`): dashboard (không đổi).
   *   · LẦN ĐẦU: dashboard + WelcomeIntro.
   *   · QUAY LẠI: **dashboard** — trước 16/08 nhánh này tự `router.push(resume.route)` hoặc tự
   *     `setStageDone(true)` để vào thẳng canvas. Việc đang dở nay là **widget** trên dashboard
   *     (`widgets/ResumeWork.tsx`), người tự bấm khi muốn vào.
   * Bản mô tả B-3/B-4 cũ ở chỗ này đã lỗi thời — thay hẳn, không để hai bản song song.
   */
  const enterAfterAuth = useCallback(
    (userId: string) => {
      setLastUserId(userId); // ResumeTracker ở route studio cần biết ghi resume cho ai

      // Task #21 — SCOPE DỰ ÁN theo URL: `[id]` là chân lý, KHÔNG đoán từ resume/stageFlag.
      // Vào thẳng canvas chặng Rendering của đúng dự án đó; ensureProjectScope tự nạp lại
      // flow đúng nếu store đang giữ dự án khác (chống lẫn dữ liệu giữa 2 dự án).
      if (projectRouteId) {
        useFlowStore.getState().setWorkspace('render');
        setStageDone(true);
        if (!bootRan.current) {
          bootRan.current = true;
          void ensureProjectScope(projectRouteId).then(() => {
            applyCadHandoff();
            // CHUẨN HOÁ URL: vào bằng flowId (vd redirect từ route cũ đọc resume-state) mà
            // flow ĐÃ thuộc một Project → thay id trên URL bằng Project.id thật.
            toProjectRender();
          });
        }
        return;
      }

      // Lối vào Home chủ động (docs/RESEARCH-HOME-GALLERY-DASHBOARD.md §5.1 quyết định 3):
      // nút "Home"/logo IF ở StudioBar gọi requestGallery() rồi router.push('/') — route '/'
      // remount, enterAfterAuth chạy lại. Cờ này có nghĩa "user VỪA CHỦ ĐỘNG bấm về Gallery"
      // → bỏ qua toàn bộ auto-resume bên dưới, luôn dừng ở ProjectSelect, dù có resume/stageFlag.
      if (consumeForceGallery()) {
        setStageDone(false);
        // "Xem lại hướng dẫn" (help menu) xoá tourDone RỒI mới requestGallery() — kiểm tra lại
        // ở đây để WelcomeIntro hiện ngay, không chỉ dừng ở Gallery trơn. Người dùng bấm "Home"
        // bình thường thì tourDone luôn đã '1' từ trước (đã qua onboarding) nên nhánh này không
        // đổi hành vi cũ cho họ.
        if (!isTourDone(userId)) setWelcomeOpen(true);
        return;
      }

      const resume = loadResume(userId);

      // 🟢 [marker: cuaVaoDashboard] 16/08 — DASHBOARD LÀ CỬA VÀO, không còn nhánh tự-nhảy nào.
      //
      // ĐÃ GỠ Ở ĐÂY (cả hai đều là "tự điều hướng thay người dùng lúc đăng nhập"):
      //   ① `if (resume && resume.route !== '/' && !resumedThisSession) router.push(resume.route)`
      //      — nhảy thẳng sang route studio đã thoát (kèm khoá `sessionStorage
      //      'interiorflow.sessionResumed'`; khoá đó nay KHÔNG CÒN AI ĐỌC nên gỡ luôn, không
      //      để cờ chết).
      //   ② `if (resume?.flowId || stageFlag) setStageDone(true) + openFlow(...)` — bỏ qua
      //      dashboard, vào thẳng canvas chặng 3D. Cùng với nó là `stageFlag`
      //      (`localStorage 'interiorflow.stageDone'`) — đọc ở đây và ở khối `useState` trên là
      //      HAI nơi đọc duy nhất, cắt cả hai nên cờ đó cũng hết vai (xem ⑦ báo cáo: còn 1 nơi
      //      GHI ngoài vùng phiếu này, `components/ProjectSelect.tsx:786`, cần T dọn nốt).
      //      `openFlow()` không mất đi đâu: `ProjectSelect` vẫn tự gọi khi người dùng bấm vào
      //      dự án, và widget "Việc đang dở" đưa thẳng về route chặng (ensureProjectScope nạp).
      //
      // CÒN LẠI ĐÚNG MỘT VIỆC: khôi phục CHẶNG đã lưu vào store. Đây KHÔNG phải điều hướng —
      // nó chỉ đảm bảo khi người dùng tự bấm vào canvas thì đứng đúng chặng cũ, không văng về
      // mặc định. Người vẫn là người quyết lúc nào bước vào ([T5] con người quyết cuối).
      if (resume?.phase) useFlowStore.getState().setWorkspace(resume.phase);

      // Người dùng LẦN ĐẦU → WelcomeIntro trên dashboard. Người đã dùng rồi → dashboard trơn.
      //
      // 28/08 · L2-06 — TRƯỚC ĐÂY dòng này là `if (!resume && !isTourDone(userId))`. Cả hai vế
      // đều đọc **localStorage**, tức nó hỏi TRÌNH DUYỆT chứ không hỏi DỮ LIỆU: xoá storage /
      // đổi máy / cửa sổ ẩn danh ⇒ một tài khoản 17 dự án nhận màn "Tạo dự án của tôi", ngay
      // trên nền dải dự án đang có. Nay phải ĐO ĐƯỢC là trống mới chào (`lib/ui/tai-khoan-trong.ts`).
      // Hỏi không được ⇒ `chua-biet` ⇒ KHÔNG chào. Im lặng nhầm chỉ mất một lời chào; nói bừa
      // là bảo người đã làm ba tháng rằng họ chưa có gì.
      if (!resume && !isTourDone(userId)) {
        const bo = new AbortController();
        chaoAbort.current?.abort();
        chaoAbort.current = bo;
        void doTaiKhoanTrong(undefined, bo.signal).then((trangThai) => {
          if (bo.signal.aborted) return;
          if (duocChaoTuDong({ coDauChan: false, daBoQua: false, trangThai })) setWelcomeOpen(true);
        });
      }
    },
    [router, projectRouteId, toProjectRender],
  );

  // StrictMode dev chạy effect mount 2 lần → không guard sẽ bắn 2 request
  // /api/auth/me gần như đồng thời. Ref riêng (không dùng chung bootRan — khác
  // mục đích) chỉ chặn phần fetch; hydrate()/setInterval bên dưới vẫn chạy như cũ.
  const authCheckRan = useRef(false);

  /**
   * Lý do phiên đứt, hiện kèm màn đăng nhập. Trước đây mọi thất bại đều im lặng đá
   * về đăng nhập nên người dùng tưởng "bấm Render là bị văng" — thật ra phiên đã
   * chết từ trước, chặng CAD không kiểm tra nên không ai biết.
   */
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  /** Server không trả lời được (503/mạng) — KHÁC "chưa đăng nhập", không được đá về login. */
  const [authOffline, setAuthOffline] = useState(false);
  /**
   * Sprint "ĐỔ NỀN 1B — dọn route song song" (26/07): banner "Chọn dự án trước" khi
   * `LegacyStageRedirect` đá về đây vì không có dự án đang hoạt động (route cũ /cad-editor,
   * /present-editor, /photo-editor). Đọc query param bằng `URLSearchParams(location.search)`
   * trong effect (client-only) — CÙNG mẫu `app/demo-resort/page.tsx` đọc `?scene=`, tránh
   * dùng hook `useSearchParams()` của Next (cần bọc <Suspense>, repo chưa có tiền lệ đó).
   * Đọc xong dọn ngay query khỏi URL (`router.replace('/')`) để F5 không lặp lại banner.
   */
  const [chooseProjectNotice, setChooseProjectNotice] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(location.search).get('notice') !== 'choose-project') return;
    setChooseProjectNotice(true);
    router.replace('/', { scroll: false });
  }, [router]);

  // B-1: user chưa đăng nhập & CHƯA từng xem `/intro` → nối vào luồng first-run trước
  // màn đăng nhập. `/intro` (components/intro/IntroSequence.tsx) tự set
  // `if_intro_seen_v1=1` rồi router.push('/login') khi xong/bỏ qua — không lặp lại nếu
  // quay về '/' sau đó (introSeen đã đọc '1' từ lazy useState ở trên).
  useEffect(() => {
    if (user === null && !introSeen) router.replace('/intro');
  }, [user, introSeen, router]);

  const checkAuth = useCallback(async () => {
    const store = useFlowStore.getState();
    try {
      const r = await fetch('/api/auth/me');

      // 503 = DB/hạ tầng lỗi. Phiên VẪN hợp lệ → giữ nguyên, cho thử lại.
      if (r.status === 503) {
        setAuthOffline(true);
        return;
      }

      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        // Chỉ giải thích khi CÓ cookie mà cookie đã chết; 'anonymous' là vào lần đầu,
        // hiện màn đăng nhập trơn là đúng, không cần cảnh báo gì.
        if (body?.reason && body.reason !== 'anonymous') {
          setAuthNotice(
            body.reason === 'expired'
              ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
              : 'Phiên đăng nhập không còn hiệu lực. Vui lòng đăng nhập lại.',
          );
        }
        setAuthOffline(false);
        store.setUser(null);
        return;
      }

      const body = await r.json();
      setAuthOffline(false);
      setAuthNotice(null);
      store.setUser(body.user);
      if (body.user?.id) enterAfterAuth(body.user.id);
    } catch {
      // Mạng đứt — cũng KHÔNG phải "chưa đăng nhập".
      setAuthOffline(true);
    }
  }, [enterAfterAuth]);

  // theme + flow local trước, rồi check session. `store.hydrate()` đã chuyển lên
  // `components/entry/StoreHydrator.tsx` (mount ở app/layout.tsx, chạy MỌI route — deep-link
  // thẳng vào /present-editor v.v. không còn bỏ qua bước này, xem STATUS.md "PHÁT HIỆN QUAN
  // TRỌNG" 02/08). Effect này chỉ còn lo phần riêng của Home: theme auto-refresh + check session.
  // KHÔNG bootstrap workspace ở đây — ProjectSelect tự openFlow khi user chọn dự án.
  useEffect(() => {
    const t = setInterval(() => useFlowStore.getState().applyTheme(), 60_000);

    if (!authCheckRan.current) {
      authCheckRan.current = true;
      void checkAuth();
    }

    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // B-3: đang làm việc trên canvas → ghi resume-state NHẸ (route + flowId + chặng,
  // KHÔNG serialize graph) mỗi khi flow/chặng đổi. Login lại là về đúng đây.
  useEffect(() => {
    if (!user || !stageDone) return;
    saveResume(user.id, {
      route: '/',
      flowId: currentFlowId ?? undefined,
      // ⚠️ Đây là FLOW id, không phải project id. Khai tường minh (27/08, P0 `L2-02`): trước lát
      // này `resume.flowId` mang hai loại danh tính mà không có gì phân biệt, và rail dán nó
      // thẳng vào `/projects/<id>/…` ⇒ trỏ vào một dự án không tồn tại. Xem `lib/resume.ts`.
      scopeKind: 'flow',
      phase: workspace ?? undefined,
    });
  }, [user, stageDone, currentFlowId, workspace]);

  // "Home"/logo IF bấm trong khi ĐÃ đứng ở route '/' (canvas) — router.push('/') không remount
  // (cùng route) nên consumeForceGallery() trong enterAfterAuth không có dịp chạy lại. Nghe
  // trực tiếp CustomEvent để quay về Gallery ngay, không cần round-trip qua route.
  //
  // Task #21: trên `/projects/[id]/render` thì "về Gallery" là ĐỔI ROUTE (push '/'), không
  // phải đổi state tại chỗ — bỏ qua event để không nháy ProjectSelect dưới URL dự án.
  useEffect(() => {
    if (projectRouteId) return;
    const onGoHome = () => {
      setStageDone(false);
      // Cùng lý do nhánh consumeForceGallery() ở enterAfterAuth: "Xem lại hướng dẫn" bấm
      // trong khi ĐÃ đứng ở route '/' (không remount) chỉ đi qua đường CustomEvent này.
      const u = useFlowStore.getState().user;
      if (u && !isTourDone(u.id)) setWelcomeOpen(true);
    };
    window.addEventListener(GO_HOME_EVENT, onGoHome);
    return () => window.removeEventListener(GO_HOME_EVENT, onGoHome);
  }, [projectRouteId]);

  // Đóng WelcomeIntro (bỏ qua bằng nút "Bỏ qua", HOẶC sau khi 1 trong 2 nút hành động
  // chính đã tạo/mở xong dự án) — không hiện lại cho user này (trừ "Xem lại hướng dẫn").
  const closeWelcome = useCallback(() => {
    setWelcomeOpen(false);
    const u = useFlowStore.getState().user;
    if (u) markTourDone(u.id);
  }, []);

  // Server không trả lời (503 / mất mạng) — KHÔNG đá về đăng nhập: phiên vẫn còn,
  // chỉ là chưa hỏi được. Cho thử lại tại chỗ để không mất việc đang làm dở.
  if (authOffline) {
    return (
      <div className="grid h-[100dvh] place-items-center bg-[var(--bg)] px-6 text-center">
        <div className="max-w-sm">
          <p className="text-sm text-[var(--t2)]">Chưa kết nối được máy chủ · Server unreachable</p>
          <p className="mt-2 text-xs leading-normal text-[var(--t4)]">
            Phiên đăng nhập của bạn vẫn còn — không cần đăng nhập lại.
          </p>
          <button
            onClick={() => {
              setAuthOffline(false);
              void checkAuth();
            }}
            className="mt-4 rounded-[10px] border border-[var(--border)] px-4 py-2 text-xs leading-normal text-[var(--t2)] transition-colors hover:bg-[var(--hover)]"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (user === undefined) {
    return (
      <div className="grid h-[100dvh] place-items-center bg-[var(--bg)]">
        <Loader2 size={20} className="animate-spin text-[var(--t4)]" />
      </div>
    );
  }

  // B-1: Chưa đăng nhập, ĐÃ xem `/intro` (hoặc bỏ qua) → MÀN ĐĂNG NHẬP đứng riêng.
  // Chưa từng xem `/intro` → effect ở trên đã router.replace('/intro'); ở đây chỉ hiện
  // loader chờ điều hướng xong, tránh nháy LoginScreen một khung hình trước khi rời trang.
  // Đăng nhập thành công → enterAfterAuth quyết: first-time vào gallery (+tour),
  // returning auto-resume đúng chỗ cũ.
  if (user === null && !introSeen) {
    return (
      <div className="grid h-[100dvh] place-items-center bg-[var(--bg)]">
        <Loader2 size={20} className="animate-spin text-[var(--t4)]" />
      </div>
    );
  }

  if (user === null) {
    return (
      <LoginScreen
        notice={authNotice}
        onAuthed={() => {
          setAuthNotice(null);
          const u = useFlowStore.getState().user;
          if (u) enterAfterAuth(u.id);
        }}
      />
    );
  }

  // Đã đăng nhập nhưng chưa chọn dự án → MÀN CHỌN DỰ ÁN (gallery 3D visionOS).
  // ProjectSelect tự openFlow/createFlow trước khi gọi onEnter → không cần bootstrap.
  //
  // 17/08 (phiếu P-ROUTER-HOME) — bọc DongStudioHome trong `<AppShell active="home">` để rail
  // điều hướng (RailDieuHuong V1) hiện ở '/' (Hoà chốt 16/08 "sidebar là hệ router toàn app,
  // LUÔN hiện ở mọi chặng"). Trước: nhánh này render DongStudioHome trực tiếp ⇒ '/' là route
  // DUY NHẤT trong app không có bản đồ.
  // Ở home KHÔNG truyền toolbar/navigator/inspector/toolbelt — AppShell tự gate: rail + AppChrome
  // + children (Ổ ③), các ổ khác ẩn hẳn. WelcomeIntro là modal z-cao nổi trên AppShell (z overlay
  // của WelcomeIntro thuộc chính component đó, không phụ thuộc container). Dashboard tự mount
  // BÊN TRONG AppShell (line 186 AppShell.tsx) — GỠ mount đôi cũ ở nhánh này để không có 2
  // overlay chồng nhau khi mở panel Chi tiết.
  if (!stageDone) {
    return (
      <AppShell active="home">
        {chooseProjectNotice && (
          <div
            role="status"
            style={{
              position: 'fixed',
              top: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 60,
              padding: '10px 18px',
              borderRadius: 10,
              background: 'var(--panel)',
              border: '1px solid var(--border)',
              color: 'var(--t2)',
              fontSize: 13,
              boxShadow: '0 8px 24px rgba(0,0,0,.16)',
            }}
          >
            Chọn dự án trước · Choose a project first
            <button
              type="button"
              onClick={() => setChooseProjectNotice(false)}
              style={{
                marginLeft: 10,
                background: 'none',
                border: 'none',
                color: 'var(--t4)',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              ✕
            </button>
          </div>
        )}
        {/* Home BẢN KHOÁ 04/09 — THANG CHÚ Ý bốn bậc, đúng một tiêu điểm (D-DR2).
            Bậc do TRẠNG THÁI tính ra (`lib/home/thang-chu-y.ts`, hàm thuần có test), và bậc
            quyết định vật được cấp bao nhiêu thân ⇒ mật độ tăng thì vật TỤT BẬC chứ không
            đòi thêm chỗ.
            🔴 04/09 — prop `onEnter` cũ ĐÃ BỎ (đóng lỗi chặn D-J04a). Nó là đường DUY NHẤT Home
            gọi ra ngoài và chỉ nối vào ba nút "lối vào"; ba nút đó dùng chung một `onClick` nên
            bấm cái nào cũng gọi `onEnter`, mà `onEnter` → `toProjectRender()` thì trên máy chưa
            có dự án nào sẽ `return` ngay ⇒ bấm xong KHÔNG có gì xảy ra (đo: `Project` 20 → 20).
            Nay Home nhận `onTaoDuAn` — mở đúng bảng khởi tạo dự án. */}
        <XuongHome onTaoDuAn={() => setInitOpen(true)} />
        {/* Bảng khởi tạo dự án — CÙNG component `ProjectSelect` vẫn dùng, không bản thứ hai. */}
        <ProjectInitBoard
          open={initOpen}
          en={lang === 'en'}
          onClose={() => setInitOpen(false)}
          onSkip={() => void taoTrongRoiVao()}
          onCreated={(flowId) => void vaoDuAnVuaTao(flowId)}
        />
        {initLoi && (
          <div
            role="alert"
            style={{
              position: 'fixed',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 60,
              padding: '10px 18px',
              borderRadius: 'var(--r-2, 10px)',
              background: 'var(--panel)',
              border: '1px solid var(--border)',
              color: 'var(--t2)',
              fontSize: 13,
            }}
          >
            {initLoi}
          </div>
        )}
        {/* Onboarding Tầng 1 — modal căn giữa TRÊN gallery, thay bước 'gallery' cũ của
            SmartTour. onEnter dùng CHUNG callback đưa cho DongStudioHome ở trên (nút
            "Tạo dự án của tôi" đi đúng đường "+ Dự án mới" cũ đi). */}
        {welcomeOpen && (
          <WelcomeIntro
            userId={user.id}
            onEnter={() => {
              setStageDone(true);
              // [marker: cuaVaoDashboard] — cùng lý do nút onEnter của DongStudioHome ở trên.
              toProjectRender();
            }}
            onDismiss={closeWelcome}
          />
        )}
        {/* Panel "Chi tiết" — Dashboard mount BÊN TRONG AppShell (line 186 AppShell.tsx) đã
            đủ; comment cũ ("mutually exclusive với nhánh canvas") không còn đúng vì nay AppShell
            là container chung ở cả hai nhánh, mount 2 lần cùng chỗ đẻ 2 subscription store. */}
      </AppShell>
    );
  }

  // MÀN HÌNH HẸP (cover foldable / điện thoại, <480px): chỉ Dashboard read-only — KHÔNG
  // canvas/studio/toolbar. Mở rộng (≥480) hook tự cập nhật, hoặc bấm "Mở toàn bộ app"
  // (forceFullApp) để vào ngay mà không cần đổi màn.
  if (isCover && !forceFullApp) {
    return (
      <motion.div
        variants={fade}
        initial="hidden"
        animate="visible"
        className="h-[100dvh] overflow-hidden bg-[var(--bg)]"
      >
        <Dashboard coverMode onEnterFullApp={() => setForceFullApp(true)} />
      </motion.div>
    );
  }

  return (
    <ReactFlowProvider>
      {/* h-[100dvh]: chiều cao viewport động — trên mobile không bị thanh trình duyệt che.
          motion fade-in nhẹ khi shell mount (StageSelect/cover → canvas) cho chuyển mượt. */}
      <motion.div
        variants={fade}
        initial="hidden"
        animate="visible"
        className="h-[100dvh] overflow-hidden bg-[var(--bg)]"
      >
        {/* VIỆC 2 mở rộng (03/08) — <AppShell> thay <StageShell> (Hoà: rail capsule biến mất
            khỏi CẢ app). Navigator = `NodeLibraryPanel` NGUYÊN BẢN (`embedded` prop mới — xem
            component đó) gắn thẳng vào ổ ②, KHÔNG viết lại nội dung. Rộng 280 (AppShell tự tính
            theo `active==='render'`) cho card thở.
            05/08 VIỆC A3 — `navigator` đọc `requireMode(renderModeToModeId(renderMode)).navigator`
            (registry Trụ 4, CÙNG nguồn với `content` bên dưới) thay vì literal JSX riêng ở đây.
            05/08 VIỆC "MỘT THƯ VIỆN" (`PHIEU-CODE-IF-DOT6`, sửa lại phần trên) — navigator giờ THẬT
            SỰ đổi theo renderMode (trước đây registry đã khai đúng nhưng nơi gọi vẫn đọc thẳng
            `RENDER_NAVIGATOR` tĩnh — nợ đã ghi ở comment cũ, nay khép): mode 'model3d' (Vẽ 3D)
            dùng `RENDER_3D_NAVIGATOR` (cây đối tượng), không còn kệ Vật liệu NodeLibraryPanel
            song song với tab Vật liệu của Command3DPanel. Inspector (ổ ④, vốn KHÔNG dùng cho chặng
            Render trước đây) nay có nội dung CHỈ ở mode 'model3d' khi đã chọn một khối
            (`Object3DInspector`) — AppShell tự ẩn hẳn khung khi `undefined` (không CSS-ẩn). */}
        <AppShell
          active="render"
          toolbar={<RenderDocBar />}
          statusBar={<StatusBar stage="render" hidden={presentModeOpen} />}
          navigator={requireMode(renderModeToModeId(renderMode)).navigator}
          navigatorAddLabel="Khối mới"
          navigatorCollapsedLabel="Khối"
          inspector={renderMode === 'model3d' && selected3DName ? <Object3DInspector /> : undefined}
        >
          {/* mỗi panel tự quản AnimatePresence riêng (iOS sheet, key duy nhất) */}

          {/* Nền mờ khi mở panel trên mobile — bấm ra ngoài để đóng. Ẩn từ md trở lên. */}
          {overlayOpen && (
            <div
              className="absolute inset-0 z-30 bg-black/40 md:hidden"
              onClick={() => {
                setPanel(null);
                setChatOpen(false);
              }}
              aria-hidden
            />
          )}

          {/* H1 (SPEC-MODE-PER-STAGE §1) — mode Render: 'render' (canvas node cũ, mặc định) ↔
              'model3d' (Vẽ 3D, skeleton). Đổi mode = đổi CẢ nội dung, không phải thêm nút.
              G1 (SPEC-CHANG2-UI-2MODE §1) — tắt segmented control có sẵn của ModeShell
              (hideBuiltInSwitcher). G1c (Hoà chốt phương án B) — công tắc "Vẽ 3D" giờ SỐNG BÊN
              TRONG mỗi canvas riêng (cuối `<BottomToolbar>` ở mode 'render' · `<ModeSwitchBar>`
              trong `Render3DModeSkeleton` ở mode 'model3d'), KHÔNG còn nút rời mount ở đây —
              tránh lệch tâm ngang do khác positioned-ancestor với `LeftRail` (xem ghi chú
              `ModeSwitchBar.tsx`).
              05/08 VIỆC A3 (Trụ 4) — `content` giờ CHỈ tra `requireMode(renderModeToModeId(mode))
              .canvas`, không còn `mode === 'render' ? … : …` literal ở đây; 2 nhánh JSX đã dời
              vào `defineMode('3d/node'|'3d/3d', …)` đầu file (RENDER_NODE_CANVAS/
              `<Render3DModeSkeleton/>`). */}
          <ModeShell
            hideBuiltInSwitcher
            // Nhãn KHÔNG hiện ra màn hình (hideBuiltInSwitcher=true, xem ModeShell.tsx) nhưng vẫn
            // đồng bộ với `defineMode('3d/node'|'3d/3d', {label:[...]})` đầu file + chốt nhãn mode
            // chặng 2 "Node ↔ 3D" (docs/00-CHOT.md 07/08, RÀ NHÃN README-mocks.md dòng 116-123: mock
            // ghi "Vẽ 3D" là nhãn CŨ, đúng phải là "3D") — trước đây lệch cả hai chuỗi.
            modes={[
              { value: 'render', label: 'Node' },
              { value: 'model3d', label: '3D' },
            ]}
            active={renderMode}
            onChange={setRenderMode}
            content={(mode) => requireMode(renderModeToModeId(mode)).canvas}
          />
        </AppShell>
        <MaskPainterModal />
        <AnnotateModal />
        {/* RQ — hàng đợi render theo view. Mount NGOÀI <AppShell> (cửa sổ nổi `position:fixed`,
            góc phải-dưới) nên sống chung cho CẢ hai mode 'render'/'model3d' của chặng 3D: loạt
            view chạy tiếp khi người dùng gạt sang Vẽ 3D, hàng đợi không bị ngắt theo mode.
            Tự ẩn hoàn toàn khi hàng đợi rỗng. */}
        <RenderQueuePanel />
        <Lightbox />
        <MoodboardModal />
        {presentModeOpen && <PresentOverlay onClose={() => setPresentModeOpen(false)} />}
        <CommandPalette />
        <CommentLayer />
        {/* Onboarding Tầng 2 — thẻ giới thiệu lần đầu chặng Rendering (thay 3 bước 'canvas'
            cũ của SmartTour, vốn chỉ trỏ "phase-switcher"/"dock" mà không dạy cách làm việc). */}
        <StageIntroCard stage="render" userId={user?.id} />
      </motion.div>
    </ReactFlowProvider>
  );
}
