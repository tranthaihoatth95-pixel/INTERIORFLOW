'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useDismissable } from '@/lib/useDismissable';
import type { PublishDraft, ScopeLevel, StageKey } from '@/lib/library/types';
import { SCOPE_META, STAGE_META } from '@/lib/library/types';
import { ScopeBadge } from './ScopeBadge';

interface Props {
  open: boolean;
  defaultStage: StageKey;
  onClose: () => void;
  onSubmit: (draft: Omit<PublishDraft, 'id' | 'createdAt' | 'status'>) => void;
}

/**
 * Modal "Đưa lên kệ" — portal ra body (LUẬT PORTAL, `docs/00-CHOT.md` K4), kính lỏng
 * (`backdrop-filter` + biên sáng, SPEC-DESIGN-SYSTEM-IF §2b). Submit chỉ ghi trạng thái CHỜ DUYỆT
 * cục bộ — publish thật ("chủ studio duyệt") chưa có backend, xem docs/BAO-CAO-G4-LIB.md.
 *
 * 03/08: TÊN DUY NHẤT là "Đưa lên kệ" — trước đây có 2 tên cho cùng 1 việc ("Publish lên kệ" ở
 * trang cũ vs "Đưa lên kệ" ở sheet). Chữ "publish" là jargon, không lộ ra UI
 * (`docs/SPEC-NGON-NGU-CHI-DAN.md` — từ điển nội bộ→người dùng).
 */
export function PublishModal({ open, defaultStage, onClose, onSubmit }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState('');
  const [stage, setStage] = useState<StageKey>(defaultStage);
  const [scope, setScope] = useState<ScopeLevel>('du_an');
  const [kind, setKind] = useState('');
  const [description, setDescription] = useState('');
  const [mounted] = useState(() => typeof document !== 'undefined');

  useDismissable({ open, onDismiss: onClose, refs: [panelRef] });

  // Modal ở-lại-DOM giữa các lần mở (chỉ `open` đổi) — `useState(defaultStage)` chỉ đọc prop LẦN
  // ĐẦU mount, đổi tab rồi mở lại publish sẽ KHÔNG theo tab mới nếu thiếu effect này.
  useEffect(() => {
    if (!open) return;
    setStage(defaultStage);
    setName('');
    setKind('');
    setDescription('');
    setScope('du_an');
  }, [open, defaultStage]);

  const canSubmit = useMemo(() => name.trim().length > 0, [name]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[190] flex items-center justify-center px-4" style={{ background: 'var(--nen-mo-overlay)' }}>
      <div
        ref={panelRef}
        className="flex w-full max-w-[420px] flex-col gap-4 rounded-[var(--radius-xl)] p-5 animate-apple-in"
        style={{
          background: 'var(--nen-mo-panel)',
          backdropFilter: `blur(var(--blur))`,
          WebkitBackdropFilter: `blur(var(--blur))`,
          border: '1px solid var(--vien-mo)',
          boxShadow: 'var(--shadow-sheet)',
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold" style={{ color: 'var(--t1)' }}>Đưa lên kệ</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1" style={{ color: 'var(--t4)' }} aria-label="Đóng">
            <X size={16} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSubmit) return;
            onSubmit({ name: name.trim(), stage, scope, kind: kind.trim() || 'Chưa phân loại', description: description.trim() });
          }}
          className="flex flex-col gap-3.5"
        >
          <label className="flex flex-col gap-1 text-[12px]" style={{ color: 'var(--t3)' }}>
            Tên
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="vd. Bảng tiêu chí chọn vật liệu — phòng khách"
              className="rounded-[var(--radius-sm)] px-3 py-2 text-[13px] outline-none"
              style={{ background: 'var(--field)', color: 'var(--t1)', border: '1px solid var(--border)' }}
            />
          </label>

          <label className="flex flex-col gap-1 text-[12px]" style={{ color: 'var(--t3)' }}>
            Chặng
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as StageKey)}
              className="rounded-[var(--radius-sm)] px-3 py-2 text-[13px] outline-none"
              style={{ background: 'var(--field)', color: 'var(--t1)', border: '1px solid var(--border)' }}
            >
              {(Object.keys(STAGE_META) as StageKey[]).map((s) => (
                <option key={s} value={s}>{STAGE_META[s].label}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-[12px]" style={{ color: 'var(--t3)' }}>
            Loại
            <input
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              placeholder="vd. Form lập luận, Template moodboard…"
              className="rounded-[var(--radius-sm)] px-3 py-2 text-[13px] outline-none"
              style={{ background: 'var(--field)', color: 'var(--t1)', border: '1px solid var(--border)' }}
            />
          </label>

          <div className="flex flex-col gap-1.5 text-[12px]" style={{ color: 'var(--t3)' }}>
            Phạm vi
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(SCOPE_META) as ScopeLevel[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScope(s)}
                  className="rounded-full transition-shadow duration-[var(--dur-fast)]"
                  style={{ boxShadow: scope === s ? '0 0 0 2px var(--accent)' : 'none' }}
                >
                  <ScopeBadge scope={s} />
                </button>
              ))}
            </div>
          </div>

          <label className="flex flex-col gap-1 text-[12px]" style={{ color: 'var(--t3)' }}>
            Mô tả
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Dùng khi nào, cho ai…"
              className="resize-none rounded-[var(--radius-sm)] px-3 py-2 text-[13px] outline-none"
              style={{ background: 'var(--field)', color: 'var(--t1)', border: '1px solid var(--border)' }}
            />
          </label>

          <p className="text-[11px] leading-snug" style={{ color: 'var(--t4)' }}>
            Publish không lên kệ chung ngay — vào hàng chờ duyệt của chủ studio trước.
          </p>

          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-[var(--radius-md)] py-2.5 text-[13.5px] font-semibold text-white transition-opacity duration-[var(--dur-fast)] disabled:opacity-40"
            style={{ background: 'var(--accent)' }}
          >
            Gửi lên kệ — chờ duyệt
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}
