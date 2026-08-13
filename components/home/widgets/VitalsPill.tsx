'use client';

/**
 * components/home/widgets/VitalsPill.tsx — [marker: DongStudio] Vitals thu về PILL góc màn
 * (phiếu docs/phieu-giao/home-dong-studio.md, việc ④.3 — khuôn Siri §4b `docs/00-CHOT.md` 12/08:
 * pill nhỏ tại chỗ → bấm bung thẻ kết quả, KHÔNG chatbot toàn màn, KHÔNG orb).
 *
 * Thay thanh "Vitals AI" to (từng luôn-hiện ngang dưới hero, chiếm ~1/3 màn — xem
 * `ProjectSelect.tsx` prop `hideVitalsBar`). Tự chứa — KHÔNG sửa `ProjectSelect.tsx` state,
 * gọi thẳng CÙNG endpoint `/api/ai-assist-chat` với `stage:'gallery'` (giữ nguyên lý do KHÔNG
 * gửi docContext — Home không mở một Doc cụ thể nào, xem comment gốc ở ProjectSelect.tsx).
 * v1: lịch sử chat sống trong state cục bộ, mất khi đóng pill — chấp nhận được (bản gốc dòng
 * to cũng chỉ giữ trong state, không lưu DB).
 *
 * v4 (13/08, phiếu home-bento-v4.md ④.4) — GỠ tự định vị `fixed right-5 top-5` khỏi root: giờ
 * `DongStudioHome.tsx` bọc component này trong MỘT cụm `fixed` chung ở góc màn cùng nút "Chi
 * tiết" (i) + `LangToggle` (trước đây 2 nút đó neo LẠC bên trong ô A nhỏ của ProjectSelect —
 * lỗi #4 "VI/EN·(i) lơ lửng"). Cụm dùng `flex` nên khi panel chat mở rộng ra 300px, cả cụm tự
 * giãn sang trái (element `fixed right:…` không set `left` → rộng theo nội dung, neo phải cố
 * định) — Info/LangToggle tự dạt theo, không đè lên panel. Root ở đây chỉ còn `shrink-0` để
 * không bị 2 nút cạnh nó bóp hẹp khi cụm tính flex-basis.
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import { Loader2, Send, X } from 'lucide-react';
import VitalsIcon from '@/components/studio/VitalsIcon';
import { useT } from '@/lib/i18n';
import { brandContextForVitals } from '@/lib/present-editor/brand-kit';

type ChatTurn = { role: 'user' | 'assistant'; content: string };

export default function VitalsPill() {
  const tr = useT();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  // Esc đóng — cùng quy ước bàn phím của thanh Vitals gốc.
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [open]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    const next: ChatTurn[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/ai-assist-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, stage: 'gallery', brand: brandContextForVitals() }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof j?.error === 'string' ? j.error : tr('Có lỗi xảy ra — thử lại.', 'Something went wrong — try again.'));
        return;
      }
      setMessages((prev) => [...prev, { role: 'assistant', content: String(j?.reply ?? '').trim() }]);
    } catch {
      setError(tr('Mất kết nối — thử lại.', 'Connection failed — try again.'));
    } finally {
      setSending(false);
    }
  }, [input, messages, sending, tr]);

  return (
    <div className="shrink-0" data-vitals-pill="">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={tr('Mở Vitals', 'Open Vitals')}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors hover:bg-[var(--hover)]"
          style={{
            background: 'var(--mat-header, var(--panel))',
            border: '1px solid var(--border)',
            backdropFilter: 'blur(var(--blur)) saturate(150%)',
            WebkitBackdropFilter: 'blur(var(--blur)) saturate(150%)',
            boxShadow: '0 10px 28px -14px rgba(0,0,0,0.4)',
          }}
        >
          <VitalsIcon size={14} className="shrink-0" style={{ color: 'var(--accent)' }} />
          <span className="text-[length:var(--fs-xs)] font-medium text-[var(--t2)]">Vitals</span>
        </button>
      ) : (
        <div
          className="w-[300px] rounded-[var(--r-3)] p-3"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: '0 24px 60px -20px rgba(0,0,0,0.5)' }}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[length:var(--fs-xs)] uppercase tracking-wide text-[var(--t4)]">
              <VitalsIcon size={13} style={{ color: 'var(--accent)' }} />
              Vitals
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={tr('Đóng', 'Close')}
              className="grid h-5 w-5 place-items-center rounded-full text-[var(--t4)] hover:text-[var(--t1)]"
            >
              <X size={13} />
            </button>
          </div>

          {(messages.length > 0 || sending || error) && (
            <div ref={scrollRef} className="mb-2 max-h-40 space-y-1.5 overflow-y-auto text-[length:var(--fs-xs)]">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className="rounded-[var(--r-2)] px-2.5 py-1.5 leading-relaxed text-[var(--t1)]"
                  style={{ background: m.role === 'user' ? 'var(--accent-soft)' : 'var(--field)' }}
                >
                  {m.content}
                </div>
              ))}
              {sending && <div className="px-1 text-[var(--t4)]">{tr('Đang trả lời…', 'Replying…')}</div>}
              {error && (
                <div className="rounded-[var(--r-2)] px-2.5 py-1.5" style={{ background: 'rgba(200,64,40,0.12)', color: 'var(--t1)' }}>
                  {error}
                </div>
              )}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="flex items-center gap-1.5"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={tr('Hỏi Vitals…', 'Ask Vitals…')}
              className="min-w-0 flex-1 rounded-full px-3 py-1.5 text-[length:var(--fs-xs)] text-[var(--t1)] outline-none"
              style={{ background: 'var(--field)' }}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label={tr('Gửi', 'Send')}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-white disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: 'var(--accent)' }}
            >
              {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
