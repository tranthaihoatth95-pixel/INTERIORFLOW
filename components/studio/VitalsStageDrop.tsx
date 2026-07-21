'use client';

/**
 * components/studio/VitalsStageDrop.tsx — khung chat NHỎ của Vitals AI "chảy ra" từ thanh chặng.
 *
 * Vitals ở các chặng = GIỌT KÍNH LỎNG ẩn trong chính thanh chuyển chặng (StageSwitcher):
 * bình thường thanh trông + hoạt động y hệt cũ; TRỎ vào tab rồi KÉO XUỐNG vượt ngưỡng
 * (lib/input/stage-drop.ts) → panel này tách ra như giọt nước, neo ngay dưới thanh.
 *
 * KHÁC bản Vitals Gallery (ProjectSelect.tsx — thanh nhập luôn hiện + overlay lớn):
 * đây là panel gọn ~380px, overlay tuyệt đối KHÔNG đè backdrop lên canvas — luồng việc
 * bên dưới vẫn thao tác được, chỉ click ra ngoài/Esc/X là panel thu về.
 *
 * TÁI DÙNG route app/api/ai-assist-chat + shape ChatTurn của lib/ai/chat-assist —
 * KHÔNG route/model mới. v1 không lưu DB; lịch sử giữ ở biến module (sống qua các lần
 * mở/đóng panel + đổi chặng trong cùng tab, mất khi reload — chấp nhận được, giống Gallery).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Loader2, Send, X } from 'lucide-react';
import type { ChatTurn } from '@/lib/ai/chat-assist';
import { easeApple } from '@/lib/motion';
import VitalsIcon from './VitalsIcon';
import { VitalsBubble, VitalsTyping } from './VitalsChatBubble';

/** Màu đồng — chữ ký thị giác của Vitals (đồng bộ bản Gallery/Login). */
const COPPER = '#c79a63';
const MONO = '"SF Mono","SFMono-Regular",ui-monospace,Menlo,monospace';

/* Lịch sử hội thoại sống ở mức MODULE — panel unmount (đóng/chuyển chặng) không mất,
   reload tab mới mất (đúng phạm vi v1 "state client" như bản Gallery). */
let vitalsSession: ChatTurn[] = [];
/** Đã từng gọi Vitals trong phiên tab này chưa — để thôi hiện tooltip gợi ý cử chỉ. */
let vitalsUsed = false;

export function markVitalsUsed() {
  vitalsUsed = true;
}
export function wasVitalsUsed() {
  return vitalsUsed;
}

export default function VitalsDropPanel({
  originPx,
  open,
  onClose,
}: {
  /** px ngang (trên panel) nơi giọt được kéo ra làm transform-origin · null = giữa (⌘J). */
  originPx: number | null;
  /**
   * 21/07 tối — pre-mount fix motion khưng drag→panel: parent (StageSwitcher) mount panel
   * NGAY khi drag bắt đầu (dragging=true) với `open=false` → React commit + effect setup
   * chạy TRONG lúc user còn kéo, không gộp vào 1 tick với drop-release. Khi threshold hit
   * → parent set `open=true` → chỉ toggle opacity/scale, không phải cold-mount.
   */
  open: boolean;
  onClose: () => void;
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

  // Focus vào input khi PANEL THẬT SỰ MỞ (không phải lúc pre-mount trong drag) — tránh
  // steal focus khi user còn đang thao tác thanh chặng.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Đóng: Esc + click/tap ra ngoài panel (canvas bên dưới KHÔNG bị backdrop chặn).
  // CHỈ gắn listener khi panel THỰC SỰ mở — pre-mount lúc drag không được nghe pointerdown,
  // vì mọi pointer sự kiện trong drag sẽ khớp "ngoài panel" và đóng panel trước khi mở.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener('keydown', onKey);
    // CAPTURE phase: canvas (React Flow/CAD) stopPropagation pointerdown ở bubble —
    // bấm ra canvas sẽ không bao giờ tới document nếu nghe bubble → panel không đóng.
    document.addEventListener('pointerdown', onDown, true);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown, true);
    };
  }, [open, onClose]);

  // Tin mới → cuộn xuống đáy.
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
        body: JSON.stringify({ messages: next }),
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
  }, [input, sending, messages]);

  const hasThread = messages.length > 0 || sending || !!error;

  return (
    <motion.div
      ref={rootRef}
      role="dialog"
      aria-label="Vitals AI"
      aria-hidden={!open}
      // 21/07 tối — motion khưng fix: KHÔNG dùng springSheet (settle ~300ms) nữa. Pre-mount
      // với opacity 0 trong lúc drag → khi open bật, chỉ tween 220ms easeApple (khớp nhịp
      // với droplet exit 120ms). Giọt kính tách khỏi thanh: mọc từ ĐÚNG điểm kéo (originX).
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
          {/* đầu panel — nhãn tracked uppercase + nút đóng */}
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
              Vitals · hỏi nhanh
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

          {/* hội thoại — chỉ chiếm chỗ khi có nội dung; panel trống thì gọn như một thanh hỏi */}
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

          {/* ô nhập + gửi */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 8px 8px 12px' }}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                // KHÔNG cho phím lọt xuống shortcut canvas/CAD (pattern input status Gallery).
                // NHƯNG ⌘J phải toggle được cả khi đang gõ — stopPropagation chặn mất listener
                // window của StageSwitcher, nên xử lý ngay tại đây.
                e.stopPropagation();
                if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
                  e.preventDefault();
                  onClose();
                  return;
                }
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void send();
                }
                if (e.key === 'Escape') onClose();
              }}
              disabled={sending}
              aria-label="Hỏi Vitals"
              placeholder="Hỏi Vitals — vật liệu, phong cách, cách dùng app…"
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
