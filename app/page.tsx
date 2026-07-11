'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ReactFlowProvider } from '@xyflow/react';
import { Loader2 } from 'lucide-react';
import { IntroSequence } from '@/components/IntroSequence';
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
import { bootstrapWorkspace } from '@/lib/workspace';
import { applyCadHandoff } from '@/lib/cad/handoff';
import { fade } from '@/lib/motion';

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
  // Cover (màn ngoài Oppo) mặc định chỉ Dashboard; nút "Mở toàn bộ app" ép vào full app
  // để KHÔNG bị kẹt khi viewport hẹp (điện thoại thường / cửa sổ nhỏ).
  const [forceFullApp, setForceFullApp] = useState(false);
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

  // theme + flow local trước, rồi check session.
  // KHÔNG bootstrap workspace ở đây — ProjectSelect tự openFlow khi user chọn dự án.
  useEffect(() => {
    const store = useFlowStore.getState();
    store.hydrate();
    const t = setInterval(() => useFlowStore.getState().applyTheme(), 60_000);

    fetch('/api/auth/me')
      .then(async (r) => {
        if (!r.ok) {
          store.setUser(null);
          return;
        }
        const body = await r.json();
        store.setUser(body.user);
        // Đã đăng nhập + trước đó đã qua ProjectSelect → bỏ qua, vào thẳng canvas.
        try {
          if (localStorage.getItem('interiorflow.stageDone') === '1') {
            setStageDone(true);
            // ProjectSelect bị bỏ qua nên openFlow() không chạy → currentFlowId
            // sẽ null → autosave rơi xuống localStorage thay vì DB, và reload sau khôi phục
            // flow cũ. Bootstrap ở đây để nạp flow server mới nhất + đặt currentFlowId.
            if (!bootRan.current) {
              bootRan.current = true;
              void bootstrapWorkspace().then(() => applyCadHandoff());
            }
          }
        } catch {
          /* localStorage chặn — bỏ qua */
        }
      })
      .catch(() => store.setUser(null));

    return () => clearInterval(t);
  }, []);

  if (user === undefined) {
    return (
      <div className="grid h-[100dvh] place-items-center bg-[var(--bg)]">
        <Loader2 size={22} className="animate-spin text-[var(--t4)]" />
      </div>
    );
  }

  // Chưa đăng nhập → intro điện ảnh (ô đăng nhập nằm ở cảnh cuối).
  // Đăng nhập thành công → LoginForm setUser → re-render sang màn chọn chặng.
  if (user === null) {
    return (
      <IntroSequence
        onDone={() => {
          setStageDone(false);
          try {
            localStorage.removeItem('interiorflow.stageDone');
          } catch {
            /* bỏ qua */
          }
        }}
      />
    );
  }

  // Đã đăng nhập nhưng chưa chọn dự án → MÀN CHỌN DỰ ÁN (gallery 3D visionOS).
  // ProjectSelect tự openFlow/createFlow trước khi gọi onEnter → không cần bootstrap.
  if (!stageDone) {
    return (
      <ProjectSelect
        onEnter={() => {
          setStageDone(true);
          // Ghi nhớ để lần quay về '/' vào thẳng canvas (thoát các studio route).
          try {
            localStorage.setItem('interiorflow.stageDone', '1');
          } catch {
            /* bỏ qua */
          }
        }}
      />
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
      </motion.div>
    </ReactFlowProvider>
  );
}
