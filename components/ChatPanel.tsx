'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Send } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface Msg {
  id: string;
  text: string;
  createdAt: string;
  userName: string;
  mine: boolean;
}

export function ChatPanel() {
  const open = useFlowStore((s) => s.chatOpen);
  const setOpen = useFlowStore((s) => s.setChatOpen);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [online, setOnline] = useState<{ id: string; name: string }[]>([]);
  const [text, setText] = useState('');
  const cursor = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // polling 3s — LAN nội bộ là đủ mượt; realtime WebSocket để dành bản cloud
  useEffect(() => {
    if (!open) return;
    let stop = false;
    const poll = async () => {
      try {
        const url = cursor.current ? `/api/chat?after=${encodeURIComponent(cursor.current)}` : '/api/chat';
        const res = await fetch(url);
        if (res.ok) {
          const body = await res.json();
          if (body.messages.length) {
            cursor.current = body.messages[body.messages.length - 1].createdAt;
            setMessages((prev) => [...prev, ...body.messages].slice(-300));
          }
          setOnline(body.online);
        }
      } catch {}
      if (!stop) setTimeout(poll, 3000);
    };
    poll();
    return () => {
      stop = true;
    };
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const clean = text.trim();
    if (!clean) return;
    setText('');
    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: clean }),
    }).catch(() => {});
  };

  if (!open) return null;

  return (
    <aside className="z-20 flex w-72 flex-col border-l border-[var(--border)] bg-[var(--panel)]">
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2.5">
        <span className="flex-1 text-xs font-semibold uppercase tracking-wider text-[var(--t3)]">
          Chat team
        </span>
        <button
          onClick={() => setOpen(false)}
          className="grid h-6 w-6 place-items-center rounded-md text-[var(--t4)] hover:bg-[var(--hover)] hover:text-[var(--t2)]"
        >
          <X size={13} />
        </button>
      </div>

      {/* online */}
      <div className="flex flex-wrap gap-1 border-b border-[var(--border)] px-3 py-2">
        {online.map((u) => (
          <span
            key={u.id}
            className="flex items-center gap-1 rounded-full bg-[var(--hover)] px-2 py-0.5 text-[10px] text-[var(--t2)]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {u.name}
          </span>
        ))}
        {online.length === 0 && <span className="text-[10px] text-[var(--t5)]">…</span>}
      </div>

      {/* messages */}
      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {messages.length === 0 && (
          <p className="pt-6 text-center text-xs text-[var(--t5)]">Chưa có tin nhắn — chào team đi 👋</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={cn('flex flex-col', m.mine ? 'items-end' : 'items-start')}>
            {!m.mine && <span className="mb-0.5 px-1 text-[9px] text-[var(--t5)]">{m.userName}</span>}
            <div
              className={cn(
                'max-w-[85%] whitespace-pre-wrap break-words rounded-xl px-2.5 py-1.5 text-xs leading-relaxed',
                m.mine
                  ? 'rounded-br-sm bg-violet-600 text-white'
                  : 'rounded-bl-sm bg-[var(--hover)] text-[var(--t1)]',
              )}
            >
              {m.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* input */}
      <div className="flex items-end gap-1.5 border-t border-[var(--border)] p-2.5">
        <textarea
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Nhắn team… (Enter gửi)"
          className="max-h-24 min-w-0 flex-1 resize-none rounded-lg border border-[var(--border)] bg-[var(--field)] px-2.5 py-2 text-xs text-[var(--t1)] placeholder-[var(--t5)] outline-none focus:border-violet-500/60"
        />
        <button
          onClick={send}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-violet-600 text-white hover:bg-violet-500"
        >
          <Send size={13} />
        </button>
      </div>
    </aside>
  );
}
