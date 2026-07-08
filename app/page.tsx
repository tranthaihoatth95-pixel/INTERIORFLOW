'use client';

import { useEffect, useState } from 'react';
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
import { FormSurface } from '@/components/form/FormSurface';
import { CommandPalette } from '@/components/CommandPalette';
import { MaskPainterModal } from '@/components/MaskPainterModal';
import { AnnotateModal } from '@/components/AnnotateModal';
import { Lightbox } from '@/components/Lightbox';
import { Dashboard } from '@/components/Dashboard';
import PresentOverlay from '@/components/present/PresentOverlay';
import { StageSelect } from '@/components/StageSelect';
import { useFlowStore } from '@/lib/store';

export default function Home() {
  const user = useFlowStore((s) => s.user);
  // Sau khi auth thành công → hiện màn CHỌN 3 CHẶNG (StageSelect) trước canvas.
  // stageDone bật khi người dùng đã chọn chặng & vào canvas.
  // Persist để quay về '/' (vd thoát khỏi /present-editor hay /photo-editor) vào THẲNG
  // canvas, không rớt lại StageSelect. Khởi tạo false (hydration-safe) rồi khôi phục ở effect.
  const [stageDone, setStageDone] = useState(false);
  const panel = useFlowStore((s) => s.panel);
  const chatOpen = useFlowStore((s) => s.chatOpen);
  const setPanel = useFlowStore((s) => s.setPanel);
  const setChatOpen = useFlowStore((s) => s.setChatOpen);
  const presentModeOpen = useFlowStore((s) => s.presentModeOpen);
  const setPresentModeOpen = useFlowStore((s) => s.setPresentModeOpen);
  const uiMode = useFlowStore((s) => s.uiMode);
  const workspace = useFlowStore((s) => s.workspace);
  const setUiMode = useFlowStore((s) => s.setUiMode);
  // Trên mobile các panel đè lên canvas → cần lớp nền mờ để bấm ra ngoài là đóng.
  const overlayOpen = panel !== null || chatOpen;

  // IA: chỉ Present mới có mặt Form. Concept/Render trên DESKTOP luôn là canvas node —
  // gỡ kẹt nếu uiMode='form' còn sót (đã bỏ nút Canvas/Form ở 2 chặng này). Mobile giữ form.
  useEffect(() => {
    if (
      workspace &&
      workspace !== 'present' &&
      uiMode === 'form' &&
      typeof window !== 'undefined' &&
      window.innerWidth >= 640
    ) {
      setUiMode('node');
    }
  }, [workspace, uiMode, setUiMode]);

  // theme + flow local trước, rồi check session.
  // KHÔNG bootstrap workspace ở đây — để màn StageSelect làm sau khi chọn chặng.
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
        // Đã đăng nhập + trước đó đã qua StageSelect → bỏ qua, vào thẳng canvas.
        try {
          if (localStorage.getItem('interiorflow.stageDone') === '1') setStageDone(true);
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

  // Đã đăng nhập nhưng chưa chọn chặng → MÀN CHỜ CHỌN 3 GIAI ĐOẠN.
  if (!stageDone) {
    return (
      <StageSelect
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

  return (
    <ReactFlowProvider>
      {/* h-[100dvh]: chiều cao viewport động — trên mobile không bị thanh trình duyệt che */}
      <div className="flex h-[100dvh] flex-col overflow-hidden bg-[var(--bg)]">
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
          {/* Form mode: thay canvas node bằng form cảm ứng (giữ nguyên engine + panel + rail) */}
          {uiMode === 'form' ? <FormSurface /> : <FlowCanvas />}
          <ChatPanel />
        </div>
        <MaskPainterModal />
        <AnnotateModal />
        <Lightbox />
        <Dashboard />
        {presentModeOpen && <PresentOverlay onClose={() => setPresentModeOpen(false)} />}
        <CommandPalette />
      </div>
    </ReactFlowProvider>
  );
}
