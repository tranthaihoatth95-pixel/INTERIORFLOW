'use client';

/**
 * NotebookChatPanel — cột giữa Project Notebook (50% desktop).
 *
 * - Header: Vitals icon + "Vitals · Project Notebook".
 * - Message list: câu hỏi user + answer với inline citation `[1] [2]` click nhảy
 *   tới source viewer.
 * - Suggested questions (4 câu Việt-Anh) khi hội thoại rỗng.
 * - Input: textarea + send. Enter gửi, Shift+Enter xuống dòng.
 * - Typing indicator 3 chấm khi Vitals đang trả lời.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import VitalsIcon from '@/components/studio/VitalsIcon';
import type { ChatMessage, Citation } from './types';
import { SUGGESTED_QUESTIONS } from './types';

interface Props {
  messages: ChatMessage[];
  querying: boolean;
  onAsk: (q: string) => void;
  onCitationClick: (sourceId: string) => void;
  hasSources: boolean;
}

function renderAnswerWithCitations(content: string, citations: Citation[] | undefined, onClick: (id: string) => void) {
  if (!citations || citations.length === 0) return content;
  // Nếu content chứa [n] token → replace tại chỗ; nếu không → append cụm citation
  const tokens = content.split(/(\[\d+\])/g);
  const hasTokens = tokens.some((t) => /^\[\d+\]$/.test(t));
  if (hasTokens) {
    return tokens.map((t, i) => {
      const m = t.match(/^\[(\d+)\]$/);
      if (!m) return <span key={i}>{t}</span>;
      const idx = Number(m[1]) - 1;
      const c = citations[idx];
      if (!c) return <span key={i}>{t}</span>;
      return (
        <button
          key={i}
          type="button"
          onClick={() => onClick(c.sourceId)}
          title={`${c.sourceTitle}${c.page ? ` · trang ${c.page}` : ''}`}
          style={{
            display: 'inline-block',
            padding: '0 4px',
            margin: '0 2px',
            fontSize: 11,
            color: 'var(--accent, #F06020)',
            border: '1px solid var(--accent, #F06020)',
            background: 'transparent',
            borderRadius: 2,
            cursor: 'pointer',
            verticalAlign: 'baseline',
            lineHeight: 1.4,
          }}
        >
          {m[1]}
        </button>
      );
    });
  }
  return (
    <>
      <span>{content}</span>
      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {citations.map((c, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onClick(c.sourceId)}
            title={c.snippet}
            style={{
              fontSize: 11,
              padding: '2px 8px',
              color: 'var(--accent, #F06020)',
              border: '1px solid var(--accent, #F06020)',
              background: 'transparent',
              borderRadius: 2,
              cursor: 'pointer',
            }}
          >
            [{i + 1}] {c.sourceTitle}
            {c.page ? ` · tr ${c.page}` : ''}
          </button>
        ))}
      </div>
    </>
  );
}

function TypingDots() {
  return (
    <div style={{ display: 'inline-flex', gap: 3, padding: '4px 0' }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--t3)',
            animation: `nbdot 1.2s ${i * 0.15}s infinite ease-in-out`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes nbdot {
          0%,
          80%,
          100% {
            opacity: 0.3;
            transform: translateY(0);
          }
          40% {
            opacity: 1;
            transform: translateY(-2px);
          }
        }
      `}</style>
    </div>
  );
}

export function NotebookChatPanel({ messages, querying, onAsk, onCitationClick, hasSources }: Props) {
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length, querying]);

  const send = (q?: string) => {
    const text = (q ?? input).trim();
    if (!text || querying) return;
    onAsk(text);
    if (!q) setInput('');
  };

  const suggestions = useMemo(() => SUGGESTED_QUESTIONS, []);

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        background: 'var(--surface-page, #F1ECE3)',
      }}
      data-vitals-chat
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '14px 20px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <VitalsIcon size={20} />
        <div>
          <div style={{ fontSize: 13.5, color: 'var(--t1)', fontWeight: 500 }}>Vitals · Project Notebook</div>
          <div style={{ fontSize: 10.5, letterSpacing: '0.08em', color: 'var(--t3)', textTransform: 'uppercase' }}>
            Sổ tay dự án · RAG trên nguồn
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={listRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          minHeight: 0,
        }}
      >
        {messages.length === 0 && (
          <div style={{ margin: 'auto', textAlign: 'center', maxWidth: 460 }}>
            <VitalsIcon size={36} />
            <div style={{ marginTop: 12, fontSize: 15, color: 'var(--t1)' }}>
              Hỏi Vitals bất cứ điều gì về dự án này.
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: 'var(--t3)' }}>
              Ask anything about this project — grounded in your sources.
            </div>
            {!hasSources && (
              <div
                style={{
                  marginTop: 16,
                  padding: '10px 12px',
                  border: '1px dashed var(--border)',
                  fontSize: 11.5,
                  color: 'var(--t3)',
                  borderRadius: 2,
                }}
              >
                Chưa có nguồn — thêm PDF/URL/Text ở cột trái để Vitals trả lời có trích dẫn.
              </div>
            )}
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '100%',
            }}
          >
            <div
              style={{
                fontSize: 10,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--t3)',
                marginBottom: 4,
              }}
            >
              {m.role === 'user' ? 'Bạn · You' : 'Vitals'}
            </div>
            <div
              style={{
                fontSize: 13.5,
                lineHeight: 1.55,
                color: 'var(--t1)',
                background: m.role === 'user' ? 'var(--field, #FAF7F1)' : 'transparent',
                border: m.role === 'user' ? '1px solid var(--border)' : 'none',
                borderLeft: m.role === 'assistant' ? '2px solid var(--accent, #F06020)' : undefined,
                padding: m.role === 'user' ? '10px 14px' : '2px 0 2px 14px',
                borderRadius: m.role === 'user' ? 4 : 0,
                maxWidth: 640,
                whiteSpace: 'pre-wrap',
              }}
            >
              {m.pending ? <TypingDots /> : renderAnswerWithCitations(m.content, m.citations, onCitationClick)}
            </div>
          </div>
        ))}
      </div>

      {/* Suggested questions */}
      {messages.length === 0 && (
        <div style={{ padding: '0 28px 12px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => send(s.vi)}
              style={{
                fontSize: 12,
                padding: '6px 10px',
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--t2)',
                borderRadius: 2,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {s.vi} <span style={{ color: 'var(--t3)' }}>· {s.en}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div
        style={{
          borderTop: '1px solid var(--border)',
          padding: '12px 20px',
          display: 'flex',
          gap: 8,
          alignItems: 'flex-end',
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              e.nativeEvent.stopImmediatePropagation();
              send();
            }
          }}
          placeholder="Hỏi về dự án… · Ask about this project…"
          rows={1}
          style={{
            flex: 1,
            fontSize: 13.5,
            padding: '10px 12px',
            border: '1px solid var(--border)',
            background: 'var(--field, #FAF7F1)',
            color: 'var(--t1)',
            borderRadius: 2,
            outline: 'none',
            resize: 'none',
            maxHeight: 140,
            fontFamily: 'inherit',
            lineHeight: 1.5,
          }}
        />
        <button
          type="button"
          onClick={() => send()}
          disabled={querying || !input.trim()}
          style={{
            height: 38,
            padding: '0 14px',
            border: '1px solid transparent',
            background: querying || !input.trim() ? 'var(--field, #FAF7F1)' : 'var(--accent, #F06020)',
            color: querying || !input.trim() ? 'var(--t3)' : '#fff',
            borderRadius: 2,
            cursor: querying || !input.trim() ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          <Send size={13} /> Gửi
        </button>
      </div>
    </section>
  );
}
