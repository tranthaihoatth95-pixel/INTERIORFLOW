'use client';

/**
 * components/studio/VitalsChatBubble.tsx — bong bóng tin nhắn + typing indicator dùng CHUNG
 * cho cả 2 nơi có chat Vitals: giọt kính ở chặng (VitalsStageDrop) + thanh Gallery (ProjectSelect).
 *
 * Phong cách iMessage/ChatGPT modern: bo tròn KHÔNG đối xứng, không viền cứng,
 * dùng CSS token (KHÔNG hardcode màu) — user dùng `--accent-soft`/`--card`, assistant dùng
 * `--panel`/nền neutral. Font-size 13.5px, line-height 1.55, max-width 75%.
 *
 * Typing indicator: 3 chấm nhấp nháy lệch pha (giống iMessage). prefers-reduced-motion:
 * hiện text tĩnh "Vitals đang trả lời…" thay vì animation.
 */

import type { CSSProperties, ReactNode } from 'react';

type Role = 'user' | 'assistant';

export function VitalsBubble({
  role,
  children,
  size = 'md',
}: {
  role: Role;
  children: ReactNode;
  size?: 'sm' | 'md';
}) {
  const isUser = role === 'user';
  const fontSize = size === 'sm' ? 12.5 : 13.5;

  // Bo tròn KHÔNG đối xứng: mép "nối vào đuôi" thu nhỏ 4px, còn lại 18px.
  // User (phải): góc phải-dưới thu · Assistant (trái): góc trái-dưới thu.
  const radius = isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px';

  const style: CSSProperties = {
    maxWidth: '75%',
    padding: '8px 13px',
    fontSize,
    lineHeight: 1.55,
    color: 'var(--t1)',
    borderRadius: radius,
    whiteSpace: 'pre-wrap',
    textAlign: 'left',
    // KHÔNG viền — chỉ nền, shadow nông cực nhẹ để tách khỏi .lq-card mà không thành "khung".
    border: 'none',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    // Dùng token — user tone accent-soft (đã có sẵn trong palette),
    // assistant tone neutral (mix panel/card qua rgba trung tính).
    background: isUser
      ? 'var(--accent-soft)'
      : 'color-mix(in srgb, var(--panel) 70%, transparent)',
  };

  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      <div style={style}>{children}</div>
    </div>
  );
}

/**
 * VitalsTyping — 3 chấm nhấp nháy lệch pha (0s / 0.2s / 0.4s).
 * prefers-reduced-motion: thay bằng text tĩnh "Vitals đang trả lời…".
 */
export function VitalsTyping({ label = 'Vitals đang trả lời…' }: { label?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '10px 14px',
          borderRadius: '18px 18px 18px 4px',
          background: 'color-mix(in srgb, var(--panel) 70%, transparent)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        }}
        aria-label={label}
        role="status"
      >
        <span className="vitals-typing-dot" style={{ animationDelay: '0s' }} />
        <span className="vitals-typing-dot" style={{ animationDelay: '0.16s' }} />
        <span className="vitals-typing-dot" style={{ animationDelay: '0.32s' }} />
        <span className="vitals-typing-fallback">{label}</span>
      </div>
    </div>
  );
}
