'use client';

/**
 * NotebookSourcesSidebar — cột trái Project Notebook (30% desktop).
 *
 * - Upload zone drag-drop file, hoặc paste URL/text (tab nhỏ).
 * - Source list: icon theo kind, title, size, badge status (processing/ready/error).
 * - Filter tabs: All / PDF / Image / Text / URL / Meeting.
 * - Click source → highlight ở Source viewer bên phải.
 * - Nút ⋯ xoá source.
 *
 * Design: hairline keyline 1px, bo góc gần vuông (rx 0-4), palette TTT
 * (var(--surface-page), var(--border), --t1/t2/t3, cam TTT accent).
 */

import { useRef, useState } from 'react';
import { FileText, Image as ImageIcon, Link as LinkIcon, Mic, Upload, Plus, MoreHorizontal, Trash2 } from 'lucide-react';
import type { NotebookSource, SourceKind } from './types';
import { SOURCE_KIND_LABEL } from './types';

const FILTERS: Array<{ key: 'all' | SourceKind; vi: string; en: string }> = [
  { key: 'all', vi: 'Tất cả', en: 'All' },
  { key: 'pdf', vi: 'PDF', en: 'PDF' },
  { key: 'image', vi: 'Ảnh', en: 'Image' },
  { key: 'text', vi: 'Văn bản', en: 'Text' },
  { key: 'url', vi: 'Liên kết', en: 'URL' },
  { key: 'meeting', vi: 'Cuộc họp', en: 'Meeting' },
];

function KindIcon({ kind, size = 14 }: { kind: SourceKind; size?: number }) {
  const cls = { color: 'var(--t2)' } as const;
  if (kind === 'pdf') return <FileText size={size} style={cls} />;
  if (kind === 'image') return <ImageIcon size={size} style={cls} />;
  if (kind === 'url') return <LinkIcon size={size} style={cls} />;
  if (kind === 'meeting') return <Mic size={size} style={cls} />;
  return <FileText size={size} style={cls} />;
}

function formatSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function StatusBadge({ status }: { status: NotebookSource['status'] }) {
  const map = {
    processing: { label: 'Đang xử lý', color: 'var(--t3)', bg: 'transparent' },
    ready: { label: 'Sẵn sàng', color: '#3D7A57', bg: 'transparent' },
    error: { label: 'Lỗi', color: '#B4443A', bg: 'transparent' },
  } as const;
  const m = map[status];
  return (
    <span
      style={{
        fontSize: 10,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: m.color,
        borderLeft: `2px solid ${m.color}`,
        paddingLeft: 6,
      }}
    >
      {m.label}
    </span>
  );
}

interface Props {
  sources: NotebookSource[];
  selectedSourceId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onUploadFile: (file: File) => void;
  onAddText: (title: string, content: string) => void;
  onAddUrl: (title: string, url: string) => void;
}

export function NotebookSourcesSidebar({
  sources,
  selectedSourceId,
  onSelect,
  onRemove,
  onUploadFile,
  onAddText,
  onAddUrl,
}: Props) {
  const [filter, setFilter] = useState<'all' | SourceKind>('all');
  const [dragOver, setDragOver] = useState(false);
  const [addMode, setAddMode] = useState<null | 'text' | 'url'>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const filtered = filter === 'all' ? sources : sources.filter((s) => s.kind === filter);

  return (
    <aside
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--border)',
        background: 'var(--surface-page, #F1ECE3)',
        minHeight: 0,
        height: '100%',
      }}
    >
      {/* Header cột */}
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--border)' }}>
        <div
          style={{
            fontSize: 10,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: 'var(--t3)',
            marginBottom: 4,
          }}
        >
          Nguồn · Sources
        </div>
        <div style={{ fontSize: 13, color: 'var(--t2)' }}>
          {sources.length} nguồn · {sources.filter((s) => s.status === 'ready').length} sẵn sàng
        </div>
      </div>

      {/* Upload zone */}
      <div style={{ padding: 12 }}>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const files = Array.from(e.dataTransfer.files);
            files.forEach(onUploadFile);
          }}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `1px dashed ${dragOver ? 'var(--accent, #F06020)' : 'var(--border)'}`,
            background: dragOver ? 'color-mix(in srgb, var(--accent, #F06020) 6%, transparent)' : 'transparent',
            borderRadius: 4,
            padding: '18px 14px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.18s ease',
          }}
        >
          <Upload size={16} style={{ color: 'var(--t2)', margin: '0 auto 8px' }} />
          <div style={{ fontSize: 12.5, color: 'var(--t1)', marginBottom: 3 }}>
            Kéo thả file · <span style={{ color: 'var(--t3)' }}>Drop files here</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--t3)' }}>PDF · Ảnh · Text · Meeting</div>
          <input
            ref={fileRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              files.forEach(onUploadFile);
              e.target.value = '';
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <button type="button" onClick={() => setAddMode('url')} style={pillBtn}>
            <LinkIcon size={11} /> URL
          </button>
          <button type="button" onClick={() => setAddMode('text')} style={pillBtn}>
            <Plus size={11} /> Text
          </button>
        </div>

        {addMode && (
          <div
            style={{
              marginTop: 10,
              border: '1px solid var(--border)',
              borderRadius: 4,
              padding: 10,
              background: 'var(--field, #FAF7F1)',
            }}
          >
            <input
              placeholder="Tiêu đề · Title"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              style={inputStyle}
            />
            {addMode === 'url' ? (
              <input
                placeholder="https://…"
                value={draftBody}
                onChange={(e) => setDraftBody(e.target.value)}
                style={{ ...inputStyle, marginTop: 6 }}
              />
            ) : (
              <textarea
                placeholder="Dán nội dung văn bản · Paste text…"
                value={draftBody}
                onChange={(e) => setDraftBody(e.target.value)}
                style={{ ...inputStyle, marginTop: 6, height: 80, resize: 'vertical', fontFamily: 'inherit' }}
              />
            )}
            <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setAddMode(null);
                  setDraftTitle('');
                  setDraftBody('');
                }}
                style={pillBtn}
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!draftTitle.trim() || !draftBody.trim()) return;
                  if (addMode === 'url') onAddUrl(draftTitle.trim(), draftBody.trim());
                  else onAddText(draftTitle.trim(), draftBody.trim());
                  setAddMode(null);
                  setDraftTitle('');
                  setDraftBody('');
                }}
                style={{ ...pillBtn, background: 'var(--accent, #F06020)', color: '#fff', borderColor: 'transparent' }}
              >
                Thêm nguồn
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ padding: '0 12px', display: 'flex', gap: 4, flexWrap: 'wrap', paddingBottom: 8 }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            style={{
              fontSize: 10.5,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              padding: '4px 8px',
              border: '1px solid',
              borderColor: filter === f.key ? 'var(--t1)' : 'var(--border)',
              background: filter === f.key ? 'var(--t1)' : 'transparent',
              color: filter === f.key ? 'var(--surface-page, #F1ECE3)' : 'var(--t2)',
              borderRadius: 2,
              cursor: 'pointer',
            }}
          >
            {f.vi}
          </button>
        ))}
      </div>

      {/* Source list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 12px 20px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--t3)', fontSize: 12, padding: '32px 0' }}>
            Chưa có nguồn nào<br />
            <span style={{ fontSize: 10.5, letterSpacing: '0.06em' }}>Add sources to begin</span>
          </div>
        ) : (
          filtered.map((s) => {
            const selected = s.id === selectedSourceId;
            return (
              <div
                key={s.id}
                onClick={() => onSelect(s.id)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  padding: '10px 10px',
                  borderTop: '1px solid var(--border)',
                  cursor: 'pointer',
                  background: selected ? 'color-mix(in srgb, var(--accent, #F06020) 8%, transparent)' : 'transparent',
                  position: 'relative',
                }}
              >
                <div style={{ marginTop: 2 }}>
                  <KindIcon kind={s.kind} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12.5,
                      color: 'var(--t1)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={s.title}
                  >
                    {s.title}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 3 }}>
                    <span style={{ fontSize: 10.5, color: 'var(--t3)' }}>
                      {SOURCE_KIND_LABEL[s.kind].vi}
                      {s.size ? ` · ${formatSize(s.size)}` : ''}
                    </span>
                    <StatusBadge status={s.status} />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(menuOpen === s.id ? null : s.id);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 4,
                    cursor: 'pointer',
                    color: 'var(--t3)',
                  }}
                >
                  <MoreHorizontal size={14} />
                </button>
                {menuOpen === s.id && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 6,
                      top: 32,
                      background: 'var(--surface-page, #F1ECE3)',
                      border: '1px solid var(--border)',
                      borderRadius: 3,
                      padding: 4,
                      zIndex: 10,
                      minWidth: 120,
                      boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(s.id);
                        setMenuOpen(null);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        width: '100%',
                        padding: '6px 8px',
                        background: 'transparent',
                        border: 'none',
                        color: '#B4443A',
                        fontSize: 12,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <Trash2 size={12} /> Xoá nguồn
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

const pillBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 11,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  padding: '4px 8px',
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--t2)',
  borderRadius: 2,
  cursor: 'pointer',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  fontSize: 12.5,
  padding: '6px 8px',
  border: '1px solid var(--border)',
  background: 'var(--surface-page, #F1ECE3)',
  color: 'var(--t1)',
  borderRadius: 2,
  outline: 'none',
};
