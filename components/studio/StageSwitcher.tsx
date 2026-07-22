'use client';

/**
 * components/studio/StageSwitcher.tsx — TRỤC ĐIỀU HƯỚNG DUY NHẤT của app: 3 chặng
 * Concept · Render · Present.
 *
 * Thuần presentational: parent quyết hành vi qua onPick (Header đổi workspace / studio
 * điều hướng route). Cùng 1 giao diện ở mọi nơi → app liền một mạch.
 *
 * 22/07 — BỎ VISUAL GIỌT KÍNH VITALS: user quyết chỉ giữ Vitals chat ở Gallery. Ở
 * StageSwitcher không còn giọt kính teardrop / motion drip / tooltip onboarding /
 * reminder loop / gesture kéo xuống mở panel / phím tắt ⌘J. Backend `/api/ai-assist-chat`
 * và VitalsChatBubble giữ nguyên cho Gallery. StageSwitcher trở lại vai trò gốc: 3 tab
 * chuyển chặng sạch, không marker thêm.
 */

import { motion } from 'framer-motion';
import { PencilRuler, Box, Presentation } from 'lucide-react';
import type { Phase } from '@/lib/phases';
import { PHASES, STAGE_TINT, STAGE_INDEX } from '@/lib/phases';
import { springSheet, pressable } from '@/lib/motion';

// Chặng 1 = Drafting CAD → icon thước-bút; Rendering = khối; Presenting = trình chiếu.
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
      {/* C-3 UNIFIED DOCK — vật liệu kính mờ (.if-dock, globals.css) dùng CHUNG
          Header app chính + StudioBar → 3 chặng nhìn/đứng y hệt nhau ở mọi nơi. */}
      <div
        className="if-dock"
        role="tablist"
        aria-label="Chặng làm việc"
      >
        {PHASES.map((p) => {
          const Icon = ICON[p.id];
          const on = p.id === active;
          return (
            <motion.button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={on}
              {...pressable}
              onClick={() => onPick(p.id)}
              title={`${p.label} — ${p.tagline}`}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 9,
                border: 'none',
                fontSize: 12.5,
                fontWeight: on ? 600 : 500,
                color: on ? 'var(--t1)' : 'var(--t4)',
                background: 'transparent',
                cursor: on ? 'default' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {/* pill "active" trượt mượt giữa 3 chặng (shared layout) — active-state rõ:
                  nền card + hairline viền + bóng 2 lớp nông (quiet-luxury, không neon). */}
              {on && (
                <motion.span
                  layoutId="stage-active-pill"
                  transition={springSheet}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 9,
                    background: 'var(--card)',
                    boxShadow:
                      'inset 0 0 0 1px var(--border), 0 1px 2px rgba(0,0,0,.1), 0 3px 8px -2px rgba(0,0,0,.12)',
                    zIndex: 0,
                  }}
                />
              )}
              <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon size={13} strokeWidth={on ? 2.2 : 2} /> {p.label}
              </span>
            </motion.button>
          );
        })}
      </div>
      {/* Nhãn micro "01 · DRAFTING CAD" — label tracked uppercase theo gu TTT. Vế thứ hai của việc
          phân định chặng: pill cho biết chọn được gì, nhãn này khẳng định đang ĐỨNG ở đâu.
          Ẩn trên màn hẹp (media query .if-stage-label trong globals.css) để không chen thanh đầu. */}
      <span
        className="if-stage-label"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 9.5,
          fontWeight: 600,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--t4)',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ width: 14, height: 1, background: STAGE_TINT[active] }} />
        {STAGE_INDEX[active]} · {PHASES.find((p) => p.id === active)?.label}
      </span>
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
