'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check } from 'lucide-react';

interface ToastMsg {
  id: number;
  text: string;
}

let pushExternal: ((text: string) => void) | null = null;

/** Gọi từ bất kỳ đâu trong khu Library — không cần prop-drilling state toast. */
export function pushLibraryToast(text: string): void {
  pushExternal?.(text);
}

/**
 * Portal ra body — panel nổi PHẢI portal (LUẬT `docs/00-CHOT.md` mục K4, học từ bug kính lồng
 * kính chặn blur/click xuyên thấu khi lồng trong chrome kính).
 */
export function LibraryToastHost() {
  const [msgs, setMsgs] = useState<ToastMsg[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let seq = 0;
    pushExternal = (text: string) => {
      const id = ++seq;
      setMsgs((prev) => [...prev, { id, text }]);
      window.setTimeout(() => {
        setMsgs((prev) => prev.filter((m) => m.id !== id));
      }, 2600);
    };
    return () => {
      pushExternal = null;
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-[200] flex -translate-x-1/2 flex-col items-center gap-2">
      {msgs.map((m) => (
        <div
          key={m.id}
          className="pointer-events-auto flex items-center gap-2 rounded-[var(--radius-lg)] px-4 py-2.5 text-[13px] font-medium shadow-[var(--shadow-pop)] backdrop-blur-[var(--blur)] animate-apple-rise"
          style={{
            background: 'var(--mat-panel)',
            color: 'var(--t1)',
            border: '1px solid var(--mat-hairline)',
          }}
        >
          <Check size={14} style={{ color: '#3fb984' }} />
          {m.text}
        </div>
      ))}
    </div>,
    document.body
  );
}
