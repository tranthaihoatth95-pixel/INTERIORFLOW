'use client';

/**
 * NotebookSourceViewer — cột phải Project Notebook (20% desktop).
 *
 * PDF → <object> fallback <iframe> vào file URL.
 * Image → <img> full-width zoom-on-click.
 * Text/URL → header + link/nội dung placeholder.
 * Rỗng → "Chọn 1 nguồn để xem".
 */

import { useState } from 'react';
import type { NotebookSource } from './types';
import { ExternalLink, ZoomIn, ZoomOut } from 'lucide-react';

interface Props {
  projectId: string;
  source: NotebookSource | null;
}

export function NotebookSourceViewer({ projectId, source }: Props) {
  const [zoomed, setZoomed] = useState(false);

  if (!source) {
    return (
      <aside
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderLeft: '1px solid var(--border)',
          background: 'var(--surface-page, #F1ECE3)',
          height: '100%',
          padding: 20,
        }}
      >
        <div style={{ textAlign: 'center', color: 'var(--t3)', fontSize: 12 }}>
          Chọn 1 nguồn để xem<br />
          <span style={{ fontSize: 10.5, letterSpacing: '0.06em' }}>Select a source to preview</span>
        </div>
      </aside>
    );
  }

  const fileUrl = `/api/notebook/${projectId}/source/${source.id}/file`;

  return (
    <aside
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid var(--border)',
        background: 'var(--surface-page, #F1ECE3)',
        height: '100%',
        minHeight: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            fontSize: 10,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: 'var(--t3)',
            marginBottom: 4,
          }}
        >
          Xem nguồn · Source
        </div>
        <div
          style={{
            fontSize: 13,
            color: 'var(--t1)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={source.title}
        >
          {source.title}
        </div>
        {source.url && (
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              color: 'var(--accent, #F06020)',
              marginTop: 4,
              textDecoration: 'none',
            }}
          >
            <ExternalLink size={11} /> Mở link gốc
          </a>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {source.kind === 'pdf' && (
          <object data={fileUrl} type="application/pdf" style={{ width: '100%', height: '100%', minHeight: 400 }}>
            <iframe src={fileUrl} style={{ width: '100%', height: '100%', border: 'none', minHeight: 400 }} />
          </object>
        )}
        {source.kind === 'image' && (
          <div style={{ padding: 12 }}>
            <button
              type="button"
              onClick={() => setZoomed((z) => !z)}
              style={{
                fontSize: 11,
                padding: '4px 8px',
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--t2)',
                borderRadius: 2,
                cursor: 'pointer',
                marginBottom: 8,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {zoomed ? <ZoomOut size={11} /> : <ZoomIn size={11} />} {zoomed ? '100%' : 'Vừa khung'}
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fileUrl}
              alt={source.title}
              style={{ width: zoomed ? 'auto' : '100%', maxWidth: zoomed ? 'none' : '100%', display: 'block' }}
            />
          </div>
        )}
        {(source.kind === 'text' || source.kind === 'url' || source.kind === 'meeting') && (
          <div style={{ padding: 16, fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {source.kind === 'url' ? (
              <>
                Xem nội dung URL trong tab mới bằng nút "Mở link gốc" phía trên.
                <br />
                <br />
                <span style={{ color: 'var(--t3)', fontSize: 11 }}>
                  Preview inline sẽ có ở Phase 2 (fetch + sanitize HTML).
                </span>
              </>
            ) : (
              <>
                Nội dung văn bản đã lưu vào chỉ mục RAG.
                <br />
                <br />
                <span style={{ color: 'var(--t3)', fontSize: 11 }}>
                  Preview full text sẽ hiện khi API `/file` trả về (Agent P1a Phase 1a).
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
