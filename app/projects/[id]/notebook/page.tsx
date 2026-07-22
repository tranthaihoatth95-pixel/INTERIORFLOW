'use client';

/**
 * /projects/[id]/notebook — Project Notebook UI (Phase 1b MVP).
 *
 * Layout 3 cột desktop: Sources (30%) | Chat (50%) | Source viewer (20%).
 * Mobile: 1 cột, 3 tab. Design theo TTT quiet-luxury (Archivo, hairline 1px,
 * beige ground, cam #F06020 làm accent tiết chế, bo góc gần vuông).
 *
 * State/API do `useNotebook` hook chủ trì. Contract khớp với backend do
 * Agent P1a triển khai song song; nếu API chưa sẵn, hook fallback in-memory
 * + localStorage để verify layout.
 */

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, PanelLeft, MessagesSquare, FileText } from 'lucide-react';
import { NotebookSourcesSidebar } from '@/components/notebook/NotebookSourcesSidebar';
import { NotebookChatPanel } from '@/components/notebook/NotebookChatPanel';
import { NotebookSourceViewer } from '@/components/notebook/NotebookSourceViewer';
import { useNotebook } from '@/components/notebook/useNotebook';

type MobileTab = 'sources' | 'chat' | 'viewer';

export default function ProjectNotebookPage() {
  const params = useParams<{ id: string }>();
  const projectId = params?.id ?? 'default';
  const router = useRouter();
  const [mobileTab, setMobileTab] = useState<MobileTab>('chat');

  const nb = useNotebook(projectId);
  const selectedSource = nb.sources.find((s) => s.id === nb.selectedSourceId) ?? null;

  return (
    <div
      className="ttt-architects"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        background: 'var(--surface-page, #F1ECE3)',
        color: 'var(--t1, #1E1B16)',
        fontFamily: 'var(--font-sans), system-ui, sans-serif',
      }}
    >
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface-page, #F1ECE3)',
        }}
      >
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 8px',
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--t2)',
            borderRadius: 2,
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          <ChevronLeft size={13} /> Quay lại
        </button>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 10,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: 'var(--t3)',
            }}
          >
            <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>
              InteriorFlow
            </Link>{' '}
            / Dự án · Project #{projectId} /
          </div>
          <div style={{ fontSize: 14, color: 'var(--t1)', fontWeight: 500, marginTop: 2 }}>
            Notebook · Sổ tay dự án
          </div>
        </div>
        <div style={{ flex: 1 }} />
        {nb.apiAvailable === false && (
          <div
            style={{
              fontSize: 10.5,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#B4443A',
              border: '1px dashed #B4443A',
              padding: '3px 8px',
              borderRadius: 2,
            }}
            title="API /api/notebook chưa merge — đang dùng mock localStorage"
          >
            Mock mode
          </div>
        )}
      </header>

      {/* Mobile tabs */}
      <div
        className="nb-mobile-tabs"
        style={{
          display: 'none',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {(
          [
            { key: 'sources', label: 'Nguồn', icon: <PanelLeft size={13} /> },
            { key: 'chat', label: 'Chat', icon: <MessagesSquare size={13} /> },
            { key: 'viewer', label: 'Xem', icon: <FileText size={13} /> },
          ] as Array<{ key: MobileTab; label: string; icon: React.ReactNode }>
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setMobileTab(t.key)}
            style={{
              flex: 1,
              padding: '10px 8px',
              background: mobileTab === t.key ? 'var(--field, #FAF7F1)' : 'transparent',
              border: 'none',
              borderBottom: mobileTab === t.key ? '2px solid var(--accent, #F06020)' : '2px solid transparent',
              fontSize: 12,
              color: mobileTab === t.key ? 'var(--t1)' : 'var(--t2)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Main 3-col grid (desktop) / stacked (mobile) */}
      <main
        className="nb-grid"
        style={{
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: '30% 50% 20%',
        }}
      >
        <div className="nb-col nb-col-sources" data-active={mobileTab === 'sources'}>
          <NotebookSourcesSidebar
            sources={nb.sources}
            selectedSourceId={nb.selectedSourceId}
            onSelect={(id) => {
              nb.setSelectedSourceId(id);
              setMobileTab('viewer');
            }}
            onRemove={nb.removeSource}
            onUploadFile={nb.uploadFile}
            onAddText={(title, content) => nb.addTextOrUrl({ kind: 'text', title, content })}
            onAddUrl={(title, url) => nb.addTextOrUrl({ kind: 'url', title, url })}
          />
        </div>
        <div className="nb-col nb-col-chat" data-active={mobileTab === 'chat'}>
          <NotebookChatPanel
            messages={nb.messages}
            querying={nb.querying}
            onAsk={nb.ask}
            onCitationClick={(id) => {
              nb.setSelectedSourceId(id);
              setMobileTab('viewer');
            }}
            hasSources={nb.sources.length > 0}
          />
        </div>
        <div className="nb-col nb-col-viewer" data-active={mobileTab === 'viewer'}>
          <NotebookSourceViewer projectId={projectId} source={selectedSource} />
        </div>
      </main>

      <style jsx>{`
        @media (max-width: 900px) {
          .nb-grid {
            grid-template-columns: 1fr !important;
          }
          .nb-mobile-tabs {
            display: flex !important;
          }
          .nb-col {
            display: none;
          }
          .nb-col[data-active='true'] {
            display: block;
          }
        }
        .nb-col {
          min-height: 0;
          height: 100%;
          display: block;
        }
      `}</style>
    </div>
  );
}
