'use client';

/**
 * components/studio/VitalsGesture.tsx — panel chat NHỎ của Vitals AI mở ra khi
 * người dùng KÉO XUỐNG từ handle line ở đáy StageSwitcher.
 *
 * 23/07 refactor (từ VitalsStageDrop cũ): BỎ toàn bộ visual giọt kính teardrop
 * (SVG, drip motion, breathing) — user chốt "bỏ hiệu ứng giọt kính nhưng phải
 * chừa lại cho người ra cử chỉ kéo xuống hiện ô chat được tối ưu trả lời cho
 * từng chặng". Chỉ giữ:
 *   - Panel chat 380px, tách khỏi thanh chặng (pre-mount fix motion khưng
 *     8d3b6a4 vẫn còn: parent mount với open=false trong lúc drag → threshold
 *     hit set open=true, không cold-mount).
 *   - Payload gửi kèm `stage` (concept/render/present/gallery) → route
 *     ai-assist-chat pick system prompt tuỳ chặng.
 *
 * KHÔNG mount ở Gallery — Gallery có VitalsChatBubble riêng (ProjectSelect.tsx).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Loader2, Send, X } from 'lucide-react';
import type { ChatTurn } from '@/lib/ai/chat-assist';
import type { Phase } from '@/lib/phases';
import { easeApple } from '@/lib/motion';
import VitalsIcon from './VitalsIcon';
import { VitalsBubble, VitalsTyping } from './VitalsChatBubble';

const COPPER = '#c79a63';
const MONO = '"SF Mono","SFMono-Regular",ui-monospace,Menlo,monospace';

/** Lịch sử hội thoại sống ở mức MODULE — panel unmount không mất, reload mới mất. */
let vitalsSession: ChatTurn[] = [];
let vitalsUsed = false;

export function markVitalsUsed() {
  vitalsUsed = true;
}
export function wasVitalsUsed() {
  return vitalsUsed;
}

/** Nhãn hiển thị theo chặng — dùng ở header panel để user biết đang hỏi Vitals ở đâu. */
const STAGE_LABEL: Record<Phase, string> = {
  concept: 'Drafting CAD',
  render: 'Rendering',
  present: 'Presenting',
};

const STAGE_PLACEHOLDER: Record<Phase, string> = {
  concept: 'Hỏi Vitals — TCVN, kích thước, dossier check…',
  render: 'Hỏi Vitals — materials, lighting, camera angle…',
  present: 'Hỏi Vitals — brand guideline, typography, layout…',
};

export default function VitalsGesturePanel({
  originPx,
  open,
  onClose,
  stage,
}: {
  originPx: number | null;
  open: boolean;
  onClose: () => void;
  /** Chặng hiện tại — gửi vào payload để backend pick system prompt phù hợp. */
  stage: Phase;
}) {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<ChatTurn[]>(() => vitalsSession);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);

  useEffect(() => {
    vitalsSession = messages;
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown, true);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown, true);
    };
  }, [open, onClose]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

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
        body: JSON.stringify({ messages: next, stage }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError({
          message: typeof j?.error === 'string' ? j.error : 'Có lỗi xảy ra — thử lại.',
          code: typeof j?.code === 'string' ? j.code : undefined,
        });
        return;
      }
      setMessages((prev) => [...prev, { role: 'assistant', content: String(j?.reply ?? '').trim() }]);
    } catch {
      setError({ message: 'Mất kết nối — thử lại.' });
    } finally {
      setSending(false);
    }
  }, [input, sending, messages, stage]);

  const hasThread = messages.length > 0 || sending || !!error;

  return (
    <motion.div
      ref={rootRef}
      role="dialog"
      aria-label={`Vitals AI · ${STAGE_LABEL[stage]}`}
      aria-hidden={!open}
      data-vitals-chat=""
      initial={reduce ? { opacity: 0 } : { opacity: 0, scaleY: 0.7, scaleX: 0.95, y: -6 }}
      animate={
        reduce
          ? { opacity: open ? 1 : 0, transition: { duration: 0.15 } }
          : open
            ? { opacity: 1, scaleY: 1, scaleX: 1, y: 0, transition: { duration: 0.22, ease: easeApple } }
            : { opacity: 0, scaleY: 0.7, scaleX: 0.95, y: -6, transition: { duration: 0.14, ease: easeApple } }
      }
      exit={
        reduce
          ? { opacity: 0, transition: { duration: 0.12 } }
          : { opacity: 0, scaleY: 0.94, y: -6, transition: { duration: 0.16, ease: easeApple } }
      }
      style={{
        position: 'absolute',
        top: 'calc(100% + 10px)',
        left: 0,
        width: 'min(380px, calc(100vw - 24px))',
        zIndex: 60,
        originX: originPx == null ? 0.5 : `${originPx}px`,
        originY: 0,
        pointerEvents: open ? 'auto' : 'none',
      }}
    >
      <div className="lq-card" style={{ borderRadius: 16, overflow: 'hidden' }}>
        <div className="lq-content">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px 7px',
              borderBottom: '1px solid rgba(127,127,127,0.2)',
            }}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: MONO,
                fontSize: 9,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'var(--t4)',
              }}
            >
              <VitalsIcon size={12} style={{ color: COPPER }} />
              Vitals · {STAGE_LABEL[stage]}
            </span>
            <button
              type="button"
              aria-label="Đóng Vitals"
              onClick={onClose}
              style={{
                display: 'grid',
                placeItems: 'center',
                width: 22,
                height: 22,
                borderRadius: 11,
                border: 'none',
                background: 'transparent',
                color: 'var(--t4)',
                cursor: 'pointer',
              }}
            >
              <X size={12} />
            </button>
          </div>

          {hasThread && (
            <div
              ref={scrollRef}
              style={{
                maxHeight: '36vh',
                overflowY: 'auto',
                padding: '10px 10px 4px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {messages.map((m, i) => (
                <VitalsBubble key={i} role={m.role} size="sm">
                  {m.content}
                </VitalsBubble>
              ))}
              {sending && <VitalsTyping label="Vitals đang trả lời…" />}
              {error && (
                <div
                  style={{
                    borderRadius: 10,
                    padding: '7px 10px',
                    fontSize: 11.5,
                    lineHeight: 1.5,
                    color: 'var(--t1)',
                    background: 'rgba(200,64,40,0.12)',
                    border: '1px solid rgba(200,64,40,0.3)',
                    textAlign: 'left',
                  }}
                >
                  {error.code === 'NO_TEXT_PROVIDER'
                    ? 'AI chưa được cấu hình — ' + error.message
                    : error.code === 'NVIDIA_FREE_EXHAUSTED'
                      ? 'AI tạm hết lượt miễn phí — ' + error.message
                      : error.message}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 8px 8px 12px' }}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void send();
                }
                if (e.key === 'Escape') onClose();
              }}
              disabled={sending}
              aria-label="Hỏi Vitals"
              placeholder={STAGE_PLACEHOLDER[stage]}
              style={{
                flex: 1,
                minWidth: 0,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: 12.5,
                color: 'var(--t1)',
              }}
            />
            <button
              type="button"
              aria-label="Gửi cho Vitals"
              onClick={() => void send()}
              disabled={sending || !input.trim()}
              style={{
                display: 'grid',
                placeItems: 'center',
                width: 28,
                height: 28,
                borderRadius: 14,
                border: 'none',
                background: COPPER,
                color: '#1c1409',
                cursor: sending || !input.trim() ? 'not-allowed' : 'pointer',
                opacity: sending || !input.trim() ? 0.35 : 1,
                flex: '0 0 auto',
              }}
            >
              {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
