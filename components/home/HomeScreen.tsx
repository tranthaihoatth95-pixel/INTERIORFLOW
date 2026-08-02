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

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ReactFlowProvider } from '@xyflow/react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { LoginScreen } from '@/components/entry/LoginScreen';
import { WelcomeIntro } from '@/components/entry/WelcomeIntro';
import { StageIntroCard } from '@/components/onboarding/StageIntroCard';
import { AppShell } from '@/components/studio/AppShell';
import { RenderNavigator } from '@/components/render-studio/RenderNavigator';
import { RenderDocBar } from '@/components/studio/RenderDocBar';
import { NodeLibraryPanel } from '@/components/NodeLibraryPanel';
import { GalleryPanel } from '@/components/GalleryPanel';
import { LibraryPanel } from '@/components/LibraryPanel';
import { ChatPanel } from '@/components/ChatPanel';
import { FlowCanvas } from '@/components/FlowCanvas';
import { MoodboardModal } from '@/components/MoodboardModal';
import { CommandPalette } from '@/components/CommandPalette';
import { MaskPainterModal } from '@/components/MaskPainterModal';
import { AnnotateModal } from '@/components/AnnotateModal';
import { Lightbox } from '@/components/Lightbox';
import { Dashboard } from '@/components/Dashboard';
import StatusBar from '@/components/studio/StatusBar';
import RenderToolModeOverlay from '@/components/render-studio/RenderToolModeOverlay';
import Render3DModeSkeleton from '@/components/render-studio/Render3DModeSkeleton';
import ModeShell from '@/components/shell/ModeShell';
import { useStageMode, useHydrateRenderMode } from '@/lib/stage-mode';
import PresentOverlay from '@/components/present/PresentOverlay';
import { ProjectSelect } from '@/components/ProjectSelect';
import { CommentLayer } from '@/components/CommentLayer';
import { useFlowStore } from '@/lib/store';
import { bootstrapWorkspace, openFlow } from '@/lib/workspace';
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

/**
 * Ngưỡng bề rộng phân biệt màn HẸP (cover foldable / điện thoại) vs màn ĐỦ RỘNG.
 * Oppo Find N6: cover ~410px · inner ~884px. Đặt 480px: bám sát cover (410) để KHÔNG
 * bắt nhầm cửa sổ desktop hẹp / tablet dọc (≥480 vẫn vào full app). Có nút "Mở toàn bộ
 * app" nên kể cả màn hẹp cũng không kẹt.
 */
const COVER_MAX_WIDTH = 480;

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
  const [stageDone, setStageDone] = useState(() => {
    if (projectRouteId) return true;
    if (typeof window === 'undefined') return false;
    try {
      const flag = localStorage.getItem('interiorflow.stageDone');
      if (!flag) return false;
      const u = useFlowStore.getState().user;
      return !!(u && u.id === flag);
    } catch {
      return false;
    }
  });
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
   * Điều phối SAU-AUTH (B-3/B-4) — gọi khi có user (session cũ qua /api/auth/me
   * hoặc vừa login qua LoginScreen):
   *   · FIRST-TIME (không resume, chưa qua ProjectSelect): ở lại gallery + bật Smart
   *     Tour (nếu user chưa từng xem/bỏ qua).
   *   · RETURNING: khôi phục đúng chỗ đã thoát — route studio (/cad-editor…) thì
   *     push sang; canvas '/' thì khôi phục chặng (workspace) + mở đúng flowId đã lưu
   *     (fallback bootstrapWorkspace như hành vi C1 cũ nếu flow mở lỗi/không lưu id).
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
      let stageFlag = false;
      try {
        // C1: cờ "đã qua ProjectSelect" gắn theo user id (không phải '1' gắn máy).
        stageFlag = localStorage.getItem('interiorflow.stageDone') === userId;
      } catch {
        /* localStorage chặn — coi như chưa */
      }

      // B-4 first-time → gallery (mặc định stageDone=false) + WelcomeIntro (Tầng 1).
      if (!resume && !stageFlag) {
        if (!isTourDone(userId)) setWelcomeOpen(true);
        return;
      }

      // B-3 returning — thoát ở route studio → quay lại đúng route đó, nhưng CHỈ
      // 1 lần cho mỗi phiên trình duyệt (sessionStorage): lần đầu mở app thì
      // auto-resume; sau đó user chủ động quay về '/' (StudioBar → canvas) thì
      // KHÔNG bật ngược lại studio nữa — tránh kẹt vòng lặp không về được canvas.
      let resumedThisSession = false;
      try {
        resumedThisSession = sessionStorage.getItem('interiorflow.sessionResumed') === '1';
        sessionStorage.setItem('interiorflow.sessionResumed', '1');
      } catch {
        /* sessionStorage chặn — coi như đã resume, bỏ redirect */
        resumedThisSession = true;
      }
      if (resume && resume.route !== '/' && !resumedThisSession) {
        router.push(resume.route);
        return;
      }

      // Returning trên canvas '/': khôi phục chặng + vào thẳng canvas với đúng flow.
      if (resume?.phase) useFlowStore.getState().setWorkspace(resume.phase);
      if (resume?.flowId || stageFlag) {
        setStageDone(true);
        // ProjectSelect bị bỏ qua nên openFlow() của nó không chạy → tự nạp ở đây để
        // currentFlowId có giá trị (autosave vào DB thay vì rơi xuống localStorage).
        if (!bootRan.current) {
          bootRan.current = true;
          const boot = resume?.flowId
            ? openFlow(resume.flowId).catch(() => bootstrapWorkspace())
            : bootstrapWorkspace();
          void boot.then(() => {
            applyCadHandoff();
            // Task #21: flow đã nạp → biết dự án nào → NÂNG URL lên scope dự án
            // (`/projects/[id]/render`) để URL thành nguồn sự thật. `replace` (không push)
            // nên nút Back của trình duyệt vẫn về đúng chỗ trước đó, bookmark `/` không vỡ.
            toProjectRender();
          });
        }
      }
      // resume tồn tại nhưng không flowId & chưa stageFlag → rơi về gallery (an toàn).
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
          <p className="mt-2 text-xs text-[var(--t4)]">
            Phiên đăng nhập của bạn vẫn còn — không cần đăng nhập lại.
          </p>
          <button
            onClick={() => {
              setAuthOffline(false);
              void checkAuth();
            }}
            className="mt-4 rounded-[10px] border border-[var(--border)] px-4 py-2 text-xs text-[var(--t2)] transition-colors hover:bg-[var(--hover)]"
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
        <Loader2 size={22} className="animate-spin text-[var(--t4)]" />
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
        <Loader2 size={22} className="animate-spin text-[var(--t4)]" />
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
  if (!stageDone) {
    return (
      <>
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
        <ProjectSelect
          onEnter={() => {
            setStageDone(true);
            // Ghi nhớ để lần quay về '/' vào thẳng canvas (thoát các studio route).
            // C1: lưu user id để cờ chỉ đúng cho chính user này (không gắn máy).
            try {
              localStorage.setItem('interiorflow.stageDone', user.id);
            } catch {
              /* bỏ qua */
            }
            // Task #21: ProjectSelect đã openFlow/createFlow xong → store biết dự án nào →
            // đưa URL sang `/projects/[id]/render` (URL = nguồn sự thật, F5 vào đúng dự án).
            toProjectRender();
          }}
        />
        {/* Onboarding Tầng 1 — modal căn giữa TRÊN gallery, thay bước 'gallery' cũ của
            SmartTour. onEnter dùng CHUNG callback đưa cho ProjectSelect ở trên (nút
            "Tạo dự án của tôi" đi đúng đường "+ Dự án mới" cũ đi). */}
        {welcomeOpen && (
          <WelcomeIntro
            userId={user.id}
            onEnter={() => {
              setStageDone(true);
              try {
                localStorage.setItem('interiorflow.stageDone', user.id);
              } catch {
                /* bỏ qua */
              }
              toProjectRender();
            }}
            onDismiss={closeWelcome}
          />
        )}
        {/* Panel "Chi tiết" (docs/RESEARCH-HOME-GALLERY-DASHBOARD.md §2.2(b)) — Dashboard.tsx
            overlay đã có sẵn (fixed inset-0 z-50), gated bởi store dashboardOpen. TRƯỚC ĐÂY
            chỉ mount ở nhánh canvas bên dưới → 2 nút "Chi tiết"/"Đồng bộ tiến độ" mới thêm
            trên Gallery gọi openDashboardTab() cập nhật store nhưng KHÔNG CÓ GÌ render, vì
            Gallery (nhánh !stageDone) chưa từng mount <Dashboard/>. Mount thêm ở đây — mutually
            exclusive với nhánh canvas (chỉ 1 trong 2 return chạy tại 1 thời điểm), không tạo 2
            overlay chồng nhau. */}
        <Dashboard />
      </>
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
            khỏi CẢ app). Navigator = RenderNavigator (outline khối trên canvas, ĐỘC LẬP với
            renderMode — Command3DPanel của mode 'model3d' vẫn sống trong Render3DModeSkeleton
            như cũ, KHÔNG lồng 2 sidebar). ⚠️ CHƯA kiểm lại canh giữa "Vẽ 3D" toggle trong
            ModeSwitchBar.tsx (trước neo theo bề rộng LeftRail cũ ~76px, Navigator nay 214px —
            xem lại nếu lệch tâm khi verify). */}
        <AppShell
          active="render"
          toolbar={<RenderDocBar />}
          statusBar={<StatusBar stage="render" hidden={presentModeOpen} />}
          navigator={<RenderNavigator />}
          navigatorAddLabel="Khối mới"
          onOpenLibrary={() => setPanel('library')}
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
              `ModeSwitchBar.tsx`). */}
          <ModeShell
            hideBuiltInSwitcher
            modes={[
              { value: 'render', label: 'Render + Mood + Collab' },
              { value: 'model3d', label: 'Vẽ 3D' },
            ]}
            active={renderMode}
            onChange={setRenderMode}
            content={(mode) =>
              mode === 'render' ? (
                <>
                  <NodeLibraryPanel />
                  <GalleryPanel />
                  <LibraryPanel />
                  {/* Cả 3 chặng đều là canvas node (Present sang studio riêng). Nút Tải lên/Concept = moodboard. */}
                  <FlowCanvas />
                  <RenderToolModeOverlay />
                  <ChatPanel />
                </>
              ) : (
                <Render3DModeSkeleton />
              )
            }
          />
        </AppShell>
        <MaskPainterModal />
        <AnnotateModal />
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
