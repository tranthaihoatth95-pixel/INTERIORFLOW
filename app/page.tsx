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
import { CommandPalette } from '@/components/CommandPalette';
import { MaskPainterModal } from '@/components/MaskPainterModal';
import { AnnotateModal } from '@/components/AnnotateModal';
import { Lightbox } from '@/components/Lightbox';
import { Dashboard } from '@/components/Dashboard';
import { LoginScreen } from '@/components/LoginScreen';
import { useFlowStore } from '@/lib/store';
import { bootstrapWorkspace } from '@/lib/workspace';

export default function Home() {
  const user = useFlowStore((s) => s.user);
  const [showIntro, setShowIntro] = useState(false);
  const panel = useFlowStore((s) => s.panel);
  const chatOpen = useFlowStore((s) => s.chatOpen);
  const setPanel = useFlowStore((s) => s.setPanel);
  const setChatOpen = useFlowStore((s) => s.setChatOpen);
  // Trên mobile các panel đè lên canvas → cần lớp nền mờ để bấm ra ngoài là đóng.
  const overlayOpen = panel !== null || chatOpen;

  // theme + flow local trước, rồi check session → workspace server
  useEffect(() => {
    const store = useFlowStore.getState();
    store.hydrate();
    // intro chỉ hiện lần đầu (chưa xem) — user có thể xem lại từ login
    if (typeof window !== 'undefined' && !localStorage.getItem('if-intro-seen')) setShowIntro(true);
    const t = setInterval(() => useFlowStore.getState().applyTheme(), 60_000);

    fetch('/api/auth/me')
      .then(async (r) => {
        if (!r.ok) {
          store.setUser(null);
          return;
        }
        const body = await r.json();
        store.setUser(body.user);
        await bootstrapWorkspace();
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

  if (user === null) {
    if (showIntro) {
      return (
        <IntroSequence
          onDone={() => {
            try {
              localStorage.setItem('if-intro-seen', '1');
            } catch {}
            setShowIntro(false);
          }}
        />
      );
    }
    return <LoginScreen onReplayIntro={() => setShowIntro(true)} />;
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
          <FlowCanvas />
          <ChatPanel />
        </div>
        <MaskPainterModal />
        <AnnotateModal />
        <Lightbox />
        <Dashboard />
        <CommandPalette />
      </div>
    </ReactFlowProvider>
  );
}
