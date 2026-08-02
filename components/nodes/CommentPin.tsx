'use client';

/**
 * components/nodes/CommentPin.tsx — G2 phần (2) (`docs/TICKET-CHANG2-BUILD-2026-08-02.md` G2,
 * `docs/SPEC-CHANG2-UI-2MODE.md` §3 "Sticky · comment @mention · reaction/vote | neo vào từng
 * object"): badge comment gắn TRỰC TIẾP vào 1 node (mount bên trong chính node đó — `InteriorNode`/
 * `NoteNode` — nên tự động neo đúng vị trí theo pan/zoom/kéo-thả, không cần `ViewportPortal` như
 * `GroupOverlay`). KHÁC HẲN `CommentLayer.tsx` (neo % toạ độ viewport + DOM `elementHint`, không
 * phải node ID thật, mặc định TẮT — không sửa file đó, không tái dùng cơ chế đó).
 *
 * NGOÀI PHẠM VI đợt này (ghi rõ, không lặng lẽ bỏ qua): @mention (không có autocomplete gõ `@` —
 * cần danh sách presence + filter, việc riêng) · reaction/vote (chưa có nút thả cảm xúc/đếm vote)
 * · sửa/xoá theo quyền tác giả (v1 ai cũng xoá được bất kỳ comment nào, khớp mức đơn giản sticky
 * note hiện có — không kiểm ownership).
 */

import { useRef, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { formatBackupRelativeTime } from '@/lib/cad/backup-diff';
import Popover from '@/components/ui/Popover';
import { useT } from '@/lib/i18n';

export default function CommentPin({ nodeId }: { nodeId: string }) {
  const comments = useFlowStore((s) => s.comments);
  const addComment = useFlowStore((s) => s.addComment);
  const removeComment = useFlowStore((s) => s.removeComment);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const btnRef = useRef<HTMLButtonElement>(null);
  const tr = useT();

  const own = comments.filter((c) => c.nodeId === nodeId);

  const onSend = () => {
    if (!draft.trim()) return;
    addComment(nodeId, draft);
    setDraft('');
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        title={tr('Bình luận', 'Comments')}
        className={cnPin(own.length > 0, open)}
      >
        <MessageCircle size={11} />
        {own.length > 0 && <span className="text-[9px] font-semibold tabular-nums">{own.length}</span>}
      </button>

      {open &&
        (() => {
          const r = btnRef.current?.getBoundingClientRect();
          if (!r) return null;
          return (
            <Popover
              anchorX={r.right}
              anchorY={r.bottom + 6}
              onDismiss={() => setOpen(false)}
              className="nodrag w-64 rounded-[12px] border border-[var(--border)] bg-[var(--panel)] p-2 shadow-xl"
              /* Cùng loại vi phạm với badge Thư viện (q0b): số cứng + thiếu -webkit- (bài học K3
                 — tablet không blur). Lấy thẳng token kính của app. */
              style={{ backdropFilter: 'blur(var(--blur))', WebkitBackdropFilter: 'blur(var(--blur))' }}
            >
              <div className="max-h-52 space-y-2 overflow-y-auto">
                {own.length === 0 && (
                  <p className="px-1 py-2 text-center text-[11px] text-[var(--t4)]">
                    {tr('Chưa có bình luận nào.', 'No comments yet.')}
                  </p>
                )}
                {own.map((c) => (
                  <div key={c.id} className="group/c rounded-[8px] bg-[var(--field)] px-2 py-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[10.5px] font-medium text-[var(--t2)]">{c.author}</span>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <span className="text-[9.5px] text-[var(--t5)]">{formatBackupRelativeTime(c.createdAt, Date.now())}</span>
                        <button
                          type="button"
                          onClick={() => removeComment(c.id)}
                          title={tr('Xoá bình luận', 'Delete comment')}
                          className="opacity-0 transition-opacity hover:text-red-400 group-hover/c:opacity-100"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    </div>
                    <p className="mt-0.5 whitespace-pre-wrap text-[11px] leading-snug text-[var(--t1)]">{c.text}</p>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-end gap-1.5 border-t border-[var(--border)] pt-2">
                <textarea
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      onSend();
                    }
                  }}
                  placeholder={tr('Viết bình luận…', 'Write a comment…')}
                  className="h-12 flex-1 resize-none rounded-[8px] border border-[var(--border)] bg-[var(--field)] px-2 py-1 text-[11px] text-[var(--t1)] outline-none focus:border-[var(--accent-ring)]"
                />
                <button
                  type="button"
                  onClick={onSend}
                  disabled={!draft.trim()}
                  className="shrink-0 rounded-[8px] border border-[var(--accent-ring)] bg-[var(--accent-soft)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--accent)] disabled:opacity-40"
                >
                  {tr('Gửi', 'Send')}
                </button>
              </div>
            </Popover>
          );
        })()}
    </>
  );
}

function cnPin(hasComments: boolean, open: boolean): string {
  const base =
    'nodrag absolute -right-2 -top-2 z-10 flex h-5 min-w-5 items-center justify-center gap-0.5 rounded-full px-1 shadow-sm transition-opacity';
  if (hasComments) return `${base} bg-[var(--accent)] text-white opacity-100`;
  return `${base} bg-[var(--panel)] text-[var(--t4)] border border-[var(--border)] ${open ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`;
}
