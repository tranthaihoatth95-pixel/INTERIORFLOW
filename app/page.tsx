'use client';

import { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { Loader2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { LeftRail } from '@/components/LeftRail';
import { NodeLibraryPanel } from '@/components/NodeLibraryPanel';
import { GalleryPanel } from '@/components/GalleryPanel';
import { LibraryPanel } from '@/components/LibraryPanel';
import { FlowsPanel } from '@/components/FlowsPanel';
import { ChatPanel } from '@/components/ChatPanel';
import { FlowCanvas } from '@/components/FlowCanvas';
import { MaskPainterModal } from '@/components/MaskPainterModal';
import { AnnotateModal } from '@/components/AnnotateModal';
import { Lightbox } from '@/components/Lightbox';
import { LoginScreen } from '@/components/LoginScreen';
import { useFlowStore } from '@/lib/store';
import { bootstrapWorkspace } from '@/lib/workspace';

export default function Home() {
  const user = useFlowStore((s) => s.user);

  // theme + flow local trước, rồi check session → workspace server
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
        await bootstrapWorkspace();
      })
      .catch(() => store.setUser(null));

    return () => clearInterval(t);
  }, []);

  if (user === undefined) {
    return (
      <div className="grid h-screen place-items-center bg-[var(--bg)]">
        <Loader2 size={22} className="animate-spin text-[var(--t4)]" />
      </div>
    );
  }

  if (user === null) return <LoginScreen />;

  return (
    <ReactFlowProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-[var(--bg)]">
        <Header />
        <div className="flex min-h-0 flex-1">
          <LeftRail />
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
      </div>
    </ReactFlowProvider>
  );
}
