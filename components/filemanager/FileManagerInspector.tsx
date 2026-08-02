'use client';

import { useState } from 'react';
import type { CommentEntry } from '@/lib/library/types';
import type { FmFile, FmRootKind } from '@/lib/filemanager/types';
import { formatBytes } from '@/lib/filemanager/types';
import { STORAGE_QUOTA_BYTES } from '@/lib/filemanager/queries';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { StorageGauge } from './StorageGauge';
import { FM } from './fm-tokens';
import { LIFECYCLE_LABEL } from './FileTile';

type Tab = 'mota' | 'binhluan';

const LIFECYCLE_ADDED_LABEL: Record<FmFile['lifecycle'], string> = { nhap: 'hôm nay', chinh_thuc: 'tuần này', luu_tru: 'đã lưu trữ' };

interface Props {
  file: FmFile | null;
  byRoot: Record<FmRootKind, number>;
  comments: CommentEntry[];
  onAddComment: (fileId: string, text: string) => void;
}

/** VẬT MẪU mock-files-polished.html `.insp` — card Dung lượng + card File (ambient tint,
 * tag CHÍNH THỨC, whorow, tabs "· N", nút "Mở trong InteriorFlow" tím đầy). */
export function FileManagerInspector({ file, byRoot, comments, onAddComment }: Props) {
  const [tab, setTab] = useState<Tab>('mota');
  const [draft, setDraft] = useState('');

  return (
    <aside className="flex w-[308px] shrink-0 flex-col gap-3.5 overflow-y-auto py-[26px] pr-[26px]">
      <StorageGauge byRoot={byRoot} quotaBytes={STORAGE_QUOTA_BYTES} />

      {!file ? (
        <div className="rounded-2xl p-4 text-center text-[12.5px]" style={{ background: FM.panel, border: `1px solid ${FM.line}`, boxShadow: FM.shadowSoft, color: FM.mut }}>
          Chọn 1 file để xem chi tiết.
        </div>
      ) : (
        <div className="rounded-2xl p-4" style={{ background: FM.panel, border: `1px solid ${FM.line}`, boxShadow: FM.shadowSoft }}>
          <div
            className="relative flex h-[118px] items-center justify-center rounded-xl"
            style={{
              background: file.thumbnail
                ? `radial-gradient(120px 80px at 30% 30%, ${file.thumbnail[0]}55, transparent), linear-gradient(135deg, ${file.thumbnail[0]}33, ${file.thumbnail[1]}33)`
                : 'radial-gradient(120px 80px at 30% 30%, #cfd9e8, transparent), linear-gradient(135deg,#e8edf4,#d5dde9)',
            }}
          >
            <div
              className="relative flex h-[70px] w-[58px] items-center justify-center rounded-[9px] bg-white text-[9px] font-extrabold tracking-wide"
              style={{ boxShadow: '0 8px 20px rgba(60,80,110,.25)', color: FM.accent }}
            >
              {file.ext.toUpperCase() || 'FILE'}
            </div>
          </div>

          <div className="mt-3 text-[15px] font-bold" style={{ color: FM.ink, letterSpacing: '-0.01em' }}>{file.name}</div>
          <div className="mt-1.5 flex items-center gap-2 text-[11.5px]" style={{ color: FM.mut }}>
            {formatBytes(file.sizeBytes)}
            <span
              className="rounded-md px-2 py-0.5 text-[9.5px] font-bold"
              style={
                file.lifecycle === 'chinh_thuc'
                  ? { background: '#e9f6ef', color: '#1f9d6b' }
                  : { background: FM.chip, color: FM.mut }
              }
            >
              {LIFECYCLE_LABEL[file.lifecycle].toUpperCase()}
            </span>
          </div>

          {file.matId && (
            <div className="mt-3 flex flex-col gap-1.5 rounded-xl p-3 text-[12px]" style={{ background: FM.chip }}>
              <div className="flex justify-between" style={{ color: FM.mut }}><span>matId</span><span className="font-mono" style={{ color: FM.ink }}>{file.matId}</span></div>
              <div className="flex justify-between" style={{ color: FM.mut }}><span>Hãng</span><span style={{ color: FM.ink }}>{file.brand}</span></div>
              <div className="flex justify-between" style={{ color: FM.mut }}><span>Giá</span><span style={{ color: FM.ink }}>{file.price}</span></div>
            </div>
          )}

          <div className="mt-3 flex items-center gap-1.5 text-[11.5px]" style={{ color: '#5a5a62' }}>
            <UserAvatar id={file.addedById} name={file.addedByName} size={20} />
            Thêm bởi <b style={{ color: FM.ink }}>{file.addedByName}</b> · {LIFECYCLE_ADDED_LABEL[file.lifecycle]}
          </div>

          <div className="mt-3.5 flex gap-[3px] rounded-[10px] p-[3px]" style={{ background: FM.chip }}>
            {(['mota', 'binhluan'] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className="flex-1 rounded-lg py-1.5 text-[11.5px]"
                style={tab === t ? { background: '#fff', color: FM.ink, fontWeight: 600, boxShadow: '0 1px 3px rgba(0,0,0,.08)' } : { color: '#77777f' }}
              >
                {t === 'mota' ? 'Mô tả' : `Bình luận${comments.length ? ` · ${comments.length}` : ''}`}
              </button>
            ))}
          </div>

          {tab === 'mota' ? (
            <p className="mt-2.5 text-[12px] leading-[1.55]" style={{ color: '#5a5a62' }}>{file.description}</p>
          ) : (
            <div className="mt-2.5 flex flex-col gap-2.5">
              {comments.length === 0 && <p className="text-[12px]" style={{ color: FM.mut }}>Chưa có bình luận.</p>}
              {comments.map((c) => (
                <div key={c.id} className="flex flex-col gap-0.5 text-[12px]">
                  <span className="font-semibold" style={{ color: FM.ink }}>{c.author}</span>
                  <span style={{ color: '#5a5a62' }}>{c.text}</span>
                </div>
              ))}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!draft.trim()) return;
                  onAddComment(file.id, draft.trim());
                  setDraft('');
                }}
                className="flex gap-1.5"
              >
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Viết bình luận…"
                  className="flex-1 rounded-lg px-2.5 py-1.5 text-[12px] outline-none"
                  style={{ background: FM.chip, color: FM.ink, border: `1px solid ${FM.line}` }}
                />
                <button type="submit" className="rounded-lg px-2.5 text-[12px] font-medium" style={{ background: FM.accentSoft, color: FM.accent }}>
                  Gửi
                </button>
              </form>
            </div>
          )}

          <button
            type="button"
            className="mt-3.5 h-10 w-full rounded-xl text-[12.5px] font-semibold text-white"
            style={{ background: FM.accent, boxShadow: '0 5px 16px rgba(106,87,245,.32)' }}
          >
            Mở trong InteriorFlow
          </button>
        </div>
      )}
    </aside>
  );
}
