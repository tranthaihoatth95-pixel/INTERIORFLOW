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
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { Loader2, Maximize2, Send, X } from 'lucide-react';
import type { ChatTurn } from '@/lib/ai/chat-assist';
import type { Phase } from '@/lib/phases';
import { easeApple } from '@/lib/motion';
import { useFlowStore } from '@/lib/store';
import { brandContextForVitals } from '@/lib/present-editor/brand-kit';
import { useDismissable } from '@/lib/useDismissable';
import { VitalsBubble, VitalsTyping } from './VitalsChatBubble';
import { VitalsStateDot, type VitalsState } from './VitalsStateBadge';

// 27/07 chốt design tokens: --accent (tím) là accent CHÍNH THỨC toàn app.
const ACCENT = 'var(--accent)';

/** 05/08 VIỆC 1 (c) — gợi ý mở đầu theo chặng, PORT mock `Vitals v2.dc.html` màn "02" nhưng
 * SỬA layout: mock xếp 4 gợi ý thành cột dọc chiếm gần hết popover (lối bày điện thoại) — trên
 * desktop popover chỉ rộng 380px, đủ chỗ vẫn còn phải cuộn thread bên dưới. Đổi thành ĐÚNG 2
 * gợi ý/chặng, viên nhỏ xếp NGANG (không phải danh sách dọc). Chỉ hiện khi chưa có hội thoại
 * (`!hasThread`) — bấm gửi thẳng câu hỏi, không phải điền vào ô rồi bấm lần nữa. */
const STAGE_SUGGESTIONS: Record<Phase, [string, string]> = {
  concept: ['Đạt TCVN chưa?', 'Thiếu ký hiệu gì?'],
  render: ['Vật liệu hợp gu chưa?', 'Ánh sáng ổn chưa?'],
  present: ['Bố cục ổn chưa?', 'Đúng bộ nhận diện?'],
};

/** Lịch sử hội thoại sống ở mức MODULE — panel unmount không mất, reload mới mất. */
let vitalsSession: ChatTurn[] = [];
let vitalsUsed = false;

export function markVitalsUsed() {
  vitalsUsed = true;
}
export function wasVitalsUsed() {
  return vitalsUsed;
}

/** Nhãn hiển thị theo chặng — dùng ở header panel để user biết đang hỏi Vitals ở đâu.
 * 03/08 CHỐT TÊN vòng cuối (docs/CHOT-TEN-CHANG-MODE-2026-08-03.md). */
const STAGE_LABEL: Record<Phase, string> = {
  concept: '2D Kỹ thuật',
  render: '3D Thiết kế',
  present: 'Trình bày',
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
  direction = 'down',
  initialInput,
  autoSend,
  onConsumeInitial,
}: {
  originPx: number | null;
  open: boolean;
  onClose: () => void;
  /** Chặng hiện tại — gửi vào payload để backend pick system prompt phù hợp. */
  stage: Phase;
  /**
   * 'down' (mặc định, hành vi CŨ) = panel xổ XUỐNG từ mép trên container (gesture kéo ở
   * StageSwitcher, trên cùng màn). 'up' (VIỆC A, 28/07) = xổ LÊN từ mép dưới container —
   * dùng khi mở từ StatusBar (đáy màn hình), giống Spotlight/Siri macOS xổ lên từ thanh dưới.
   */
  direction?: 'down' | 'up';
  /** Gõ sẵn trong ô gọn ở StatusBar rồi bấm/Enter → panel mở kèm câu hỏi này (lib/vitals-ui.ts). */
  initialInput?: string;
  /** true = gửi luôn `initialInput` ngay khi panel mở, không cần gõ lại. */
  autoSend?: boolean;
  /** Panel đã tiêu thụ initialInput/autoSend — caller xoá khỏi store dùng chung, tránh gửi lặp. */
  onConsumeInitial?: () => void;
}) {
  const reduce = useReducedMotion();
  const router = useRouter();
  // SCOPE FIX (Task #18): điều hướng Notebook bằng id ổn định (Project.id thật hoặc
  // Flow.id) thay cho slug tên flow — tránh 2 dự án khác nhau chung notebook.
  const currentProjectId = useFlowStore((s) => s.currentProjectId);
  const currentFlowId = useFlowStore((s) => s.currentFlowId);
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

  // 2.2.90 ĐỢT 3 — chuyển sang useDismissable dùng chung (bản gốc đã tự dùng đúng họ sự kiện
  // pointerdown pha bắt, chỉ khác Escape trước đây ở window pha nổi).
  useDismissable({ open, onDismiss: onClose, refs: [rootRef] });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const send = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
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
        // `brand`: Brand Kit đang chọn (localStorage — backend không đọc được). Chưa có kit →
        // null, Vitals sẽ nói thẳng là dự án chưa có nhận diện thay vì bịa màu/font.
        body: JSON.stringify({ messages: next, stage, brand: brandContextForVitals() }),
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

  // VIỆC A (28/07) — mở từ StatusBar kèm sẵn câu hỏi (gõ ở ô gọn trước khi bấm/Enter).
  // Chỉ chạy khi `open` chuyển true (không phụ thuộc initialInput đổi liên tục — chỉ đọc 1 lần
  // lúc mở), tiêu thụ xong báo `onConsumeInitial` để store dùng chung xoá, tránh gửi lặp nếu
  // panel re-render hoặc mở lại mà không gõ gì mới.
  useEffect(() => {
    if (!open || !initialInput) return;
    setInput(initialInput);
    if (autoSend) void send(initialInput);
    onConsumeInitial?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /**
   * Mở NotebookLM full — điểm dừng thứ 2 của state machine kéo giọt Vitals.
   * Reachable qua: (a) bấm nút Mở rộng ở header popover này; (b) kéo dài
   * `LONG_DRAG_THRESHOLD_PX` ở StageSwitcher (fast-path, không cần dừng ở popover).
   * Điều hướng thay vì portal modal để tận dụng route hiện có (mobile tab, deep
   * link, back button đều hoạt động sẵn).
   */
  const openFullNotebook = useCallback(() => {
    const id = currentProjectId || currentFlowId || 'default';
    onClose();
    router.push(`/projects/${id}/notebook`);
  }, [currentProjectId, currentFlowId, router, onClose]);

  const hasThread = messages.length > 0 || sending || !!error;

  /* 05/08 VIỆC 1 (b) — nguồn thật DUY NHẤT hiện có là `sending` (đang chờ fetch, không streaming)
   * → map thẳng 'answering' (khớp nhãn VitalsTyping cũ). 'listening'/'thinking' chưa có nguồn
   * thật (không voice input, không streaming 2 pha) nên không gán ở đây — xem comment đầu
   * VitalsStateBadge.tsx. */
  const vitalsState: VitalsState = sending ? 'answering' : 'idle';

  return (
    <motion.div
      ref={rootRef}
      role="dialog"
      aria-label={`Vitals AI · ${STAGE_LABEL[stage]}`}
      aria-hidden={!open}
      data-vitals-chat=""
      initial={reduce ? { opacity: 0 } : { opacity: 0, scaleY: 0.7, scaleX: 0.95, y: direction === 'up' ? 6 : -6 }}
      animate={
        reduce
          ? { opacity: open ? 1 : 0, transition: { duration: 0.15 } }
          : open
            ? { opacity: 1, scaleY: 1, scaleX: 1, y: 0, transition: { duration: 0.22, ease: easeApple } }
            : {
                opacity: 0,
                scaleY: 0.7,
                scaleX: 0.95,
                y: direction === 'up' ? 6 : -6,
                transition: { duration: 0.14, ease: easeApple },
              }
      }
      exit={
        reduce
          ? { opacity: 0, transition: { duration: 0.12 } }
          : { opacity: 0, scaleY: 0.94, y: direction === 'up' ? 6 : -6, transition: { duration: 0.16, ease: easeApple } }
      }
      style={{
        position: 'absolute',
        ...(direction === 'up' ? { bottom: 'calc(100% + 10px)' } : { top: 'calc(100% + 10px)' }),
        left: 0,
        width: 'min(380px, calc(100vw - 24px))',
        zIndex: 60,
        originX: originPx == null ? 0.5 : `${originPx}px`,
        originY: direction === 'up' ? 1 : 0,
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
                fontSize: 9,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'var(--t4)',
              }}
            >
              <VitalsStateDot state={vitalsState} size={7} />
              Vitals · {STAGE_LABEL[stage]}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                type="button"
                aria-label="Mở NotebookLM đầy đủ · Full"
                title="Mở NotebookLM đầy đủ (kéo dài xuống cũng có tác dụng)"
                onClick={openFullNotebook}
                data-vitals-expand=""
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
                <Maximize2 size={11} />
              </button>
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
          </div>

          {!hasThread && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 10px 4px' }}>
              {STAGE_SUGGESTIONS[stage].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => void send(q)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    height: 26,
                    padding: '0 10px',
                    maxWidth: '100%',
                    borderRadius: 13,
                    border: '1px solid rgba(127,127,127,0.2)',
                    background: 'transparent',
                    color: 'var(--t2)',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ width: 5, height: 5, borderRadius: 2, background: ACCENT, flex: 'none' }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q}</span>
                </button>
              ))}
            </div>
          )}

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
                background: ACCENT,
                color: '#fff',
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
