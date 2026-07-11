'use client';

/**
 * components/studio/StageSwitcher.tsx — TRỤC ĐIỀU HƯỚNG DUY NHẤT của app: 3 chặng
 * Concept · Render · Present.
 *
 * Trước đây header có tới 3 cụm switcher chồng vai trò (2 cụm cùng ghi "Node"):
 * PhaseSwitcher + ViewToggle(Node/Window "soon") + uiMode(Node/Form — đã bỏ). Nay gom về 1:
 *   - Concept/Render = xưởng làm việc (canvas node) ở route '/'.
 *   - Present = slide studio (/present-editor) — chính là "Window view" từng hứa.
 *   - Chỉnh ảnh (Photo) KHÔNG phải chặng — là công cụ con của Render (photoContext).
 *
 * Thuần presentational: parent quyết hành vi qua onPick (Header đổi workspace / studio
 * điều hướng route). Cùng 1 giao diện ở mọi nơi → app liền một mạch.
 */

import { motion } from 'framer-motion';
import { PencilRuler, Box, Presentation } from 'lucide-react';
import type { Phase } from '@/lib/phases';
import { PHASES } from '@/lib/phases';
import { springSheet, pressable } from '@/lib/motion';

// Chặng 1 = Layout CAD → icon thước-bút; Render = khối; Present = trình chiếu.
const ICON: Record<Phase, typeof PencilRuler> = { concept: PencilRuler, render: Box, present: Presentation };

interface Props {
  /** chặng đang sáng. */
  active: Phase;
  /** click 1 chặng. */
  onPick: (p: Phase) => void;
  /** true khi đang ở photo-editor (active=render + hiện nhãn "Chỉnh ảnh"). */
  photoContext?: boolean;
}

export default function StageSwitcher({ active, onPick, photoContext }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          display: 'flex',
          gap: 2,
          padding: 3,
          borderRadius: 10,
          background: 'var(--field)',
          border: '1px solid var(--border)',
        }}
      >
        {PHASES.map((p) => {
          const Icon = ICON[p.id];
          const on = p.id === active;
          return (
            <motion.button
              key={p.id}
              type="button"
              {...pressable}
              onClick={() => onPick(p.id)}
              title={`${p.label} — ${p.tagline}`}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 7,
                border: 'none',
                fontSize: 12.5,
                fontWeight: on ? 600 : 500,
                color: on ? 'var(--t1)' : 'var(--t4)',
                background: 'transparent',
                cursor: on ? 'default' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {/* pill "active" trượt mượt giữa 3 chặng (shared layout) */}
              {on && (
                <motion.span
                  layoutId="stage-active-pill"
                  transition={springSheet}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 7,
                    background: 'var(--card)',
                    boxShadow: '0 1px 2px rgba(0,0,0,.08)',
                    zIndex: 0,
                  }}
                />
              )}
              <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon size={13} /> {p.label}
              </span>
            </motion.button>
          );
        })}
      </div>
      {photoContext && (
        <span
          style={{
            fontSize: 11.5,
            color: 'var(--t3)',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ width: 4, height: 4, borderRadius: 4, background: 'var(--accent)' }} />
          Chỉnh ảnh
        </span>
      )}
    </div>
  );
}
