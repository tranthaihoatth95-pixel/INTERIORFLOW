'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ReactFlowProvider } from '@xyflow/react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { LoginScreen } from '@/components/entry/LoginScreen';
import { SmartTour } from '@/components/entry/SmartTour';
import { Header } from '@/components/Header';
import { LeftRail } from '@/components/LeftRail';
import { NodeLibraryPanel } from '@/components/NodeLibraryPanel';
import { GalleryPanel } from '@/components/GalleryPanel';
import { LibraryPanel } from '@/components/LibraryPanel';
import { FlowsPanel } from '@/components/FlowsPanel';
import { ChatPanel } from '@/components/ChatPanel';
import { FlowCanvas } from '@/components/FlowCanvas';
import { MoodboardModal } from '@/components/MoodboardModal';
import { CommandPalette } from '@/components/CommandPalette';
import { MaskPainterModal } from '@/components/MaskPainterModal';
import { AnnotateModal } from '@/components/AnnotateModal';
import { Lightbox } from '@/components/Lightbox';
import { Dashboard } from '@/components/Dashboard';
import PresentOverlay from '@/components/present/PresentOverlay';
import { ProjectSelect } from '@/components/ProjectSelect';
import { CommentLayer } from '@/components/CommentLayer';
import { useFlowStore } from '@/lib/store';
import { bootstrapWorkspace, openFlow } from '@/lib/workspace';
import { applyCadHandoff } from '@/lib/cad/handoff';
import { fade } from '@/lib/motion';
import { loadResume, saveResume, setLastUserId, isTourDone, markTourDone } from '@/lib/resume';

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

export default function Home() {
  const user = useFlowStore((s) => s.user);
  // Màn ngoài (cover) hẹp → chỉ cho XEM Dashboard; mọi thao tác ở màn trong.
  const isCover = useIsCoverScreen();
  // Sau khi auth thành công → hiện màn CHỌN DỰ ÁN (ProjectSelect) trước canvas.
  // stageDone bật khi người dùng đã chọn dự án & vào canvas.
  // Persist để quay về '/' (vd thoát khỏi /present-editor hay /photo-editor) vào THẲNG
  // canvas, không rớt lại ProjectSelect. Khởi tạo false (hydration-safe) rồi khôi phục ở effect.
  const [stageDone, setStageDone] = useState(false);
  // B-5: Smart Tour lần đầu — bật cho user CHƯA có dấu chân (không resume, không stageDone,
  // chưa tourDone). Bỏ qua/hoàn tất → markTourDone theo user.id, không hiện lại.
  const [tourOn, setTourOn] = useState(false);
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
      const resume = loadResume(userId);
      let stageFlag = false;
      try {
        // C1: cờ "đã qua ProjectSelect" gắn theo user id (không phải '1' gắn máy).
        stageFlag = localStorage.getItem('interiorflow.stageDone') === userId;
      } catch {
        /* localStorage chặn — coi như chưa */
      }

      // B-4 first-time → gallery (mặc định stageDone=false) + Smart Tour.
      if (!resume && !stageFlag) {
        if (!isTourDone(userId)) setTourOn(true);
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
          void boot.then(() => applyCadHandoff());
        }
      }
      // resume tồn tại nhưng không flowId & chưa stageFlag → rơi về gallery (an toàn).
    },
    [router],
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

  // theme + flow local trước, rồi check session.
  // KHÔNG bootstrap workspace ở đây — ProjectSelect tự openFlow khi user chọn dự án.
  useEffect(() => {
    const store = useFlowStore.getState();
    store.hydrate();
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

  // B-5: kết thúc tour (hoàn tất hoặc bỏ qua) — không hiện lại cho user này.
  const endTour = useCallback(() => {
    setTourOn(false);
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

  // B-1: Chưa đăng nhập → MÀN ĐĂNG NHẬP đứng riêng (intro điện ảnh ĐÃ GỠ khỏi luồng —
  // components/IntroSequence.tsx giữ nguyên file để khôi phục khi có hình/video).
  // Đăng nhập thành công → enterAfterAuth quyết: first-time vào gallery (+tour),
  // returning auto-resume đúng chỗ cũ.
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
          }}
        />
        {/* B-5: bước "chọn dự án" của Smart Tour — chỉ first-time user */}
        {tourOn && <SmartTour screen="gallery" onFinish={endTour} onSkip={endTour} />}
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
        className="flex h-[100dvh] flex-col overflow-hidden bg-[var(--bg)]"
      >
        <Header />
        {/* relative: neo các panel overlay (mobile) vào vùng dưới header */}
        <div className="relative flex min-h-0 flex-1">
          <LeftRail />
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

          <NodeLibraryPanel />
          <GalleryPanel />
          <LibraryPanel />
          <FlowsPanel />
          {/* Cả 3 chặng đều là canvas node (Present sang studio riêng). Nút Tải lên/Concept = moodboard. */}
          <FlowCanvas />
          <ChatPanel />
        </div>
        <MaskPainterModal />
        <AnnotateModal />
        <Lightbox />
        <Dashboard />
        <MoodboardModal />
        {presentModeOpen && <PresentOverlay onClose={() => setPresentModeOpen(false)} />}
        <CommandPalette />
        <CommentLayer />
        {/* B-5: các bước canvas của Smart Tour (3 chặng → dock) — nối tiếp từ gallery */}
        {tourOn && <SmartTour screen="canvas" onFinish={endTour} onSkip={endTour} />}
      </motion.div>
    </ReactFlowProvider>
  );
}
