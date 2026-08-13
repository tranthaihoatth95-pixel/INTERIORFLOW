'use client';

/**
 * components/shell/ModeShell.tsx — H1 (`docs/TICKET-UI-HATANG-2026-08-02.md`,
 * `docs/SPEC-MODE-PER-STAGE.md` §1): khung chuyển mode DÙNG CHUNG — thanh chọn mode (segmented
 * control, cùng ngôn ngữ hình `ModeSwitch` của CadToolbar.tsx) + đổi TOÀN BỘ nội dung bên dưới
 * theo mode đang chọn (không phải hiện/ẩn thêm nút trong 1 layout cố định).
 *
 * `content` là hàm (mode) => ReactNode — nơi gọi tự quyết định layout cho TỪNG mode (kể cả khác
 * hẳn nhau về cấu trúc DOM, không bị ép chung 1 khung). Component này CHỈ lo phần "vỏ chọn mode +
 * chỗ trống hiện nội dung", không biết gì về nội dung từng mode.
 *
 * G1 (`docs/SPEC-CHANG2-UI-2MODE.md` §1, `docs/SPEC-DESIGN-SYSTEM-IF.md` §3) — 2 điểm chỉnh cho
 * chặng Render: `hideBuiltInSwitcher` (nơi gọi tự vẽ công tắc đổi mode RIÊNG thay vì dùng segmented
 * control có sẵn ở đây — G1c: công tắc giờ sống trong `ModeSwitchCell.tsx`, gắn cuối
 * `<BottomToolbar>`/trong `<ModeSwitchBar>` tuỳ mode, xem 2 file đó), và nội dung đổi mode
 * CROSSFADE spring (không giật khô) — `AnimatePresence mode="wait"` + `springPop`, tắt hẳn khi
 * `prefers-reduced-motion` (guard, thắng tất cả đúng luật thiết kế).
 */

import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { springPop } from '@/lib/motion';
import { guard } from '@/lib/motion-apple';

export interface ModeOption<M extends string> {
  value: M;
  label: string;
}

export interface ModeShellProps<M extends string> {
  modes: ModeOption<M>[];
  active: M;
  onChange: (m: M) => void;
  /** nội dung ĐÚNG mode đang chọn — hàm để nơi gọi lazy-tính, không dựng cả 2 nhánh cùng lúc. */
  content: (mode: M) => ReactNode;
  /** hiện cạnh thanh chọn mode (vd nút "Mở canvas", badge trạng thái) — tuỳ chọn. */
  toolbarExtra?: ReactNode;
  /** neo thanh chọn mode trên/dưới — mặc định 'top'. Bỏ qua khi `hideBuiltInSwitcher`. */
  barPosition?: 'top' | 'bottom';
  /** G1 — nơi gọi tự vẽ nút chuyển mode RIÊNG (vd "1 nút rời" cạnh BottomToolbar), ModeShell chỉ
   * lo phần đổi nội dung + crossfade, không vẽ segmented control có sẵn nữa. */
  hideBuiltInSwitcher?: boolean;
  className?: string;
}

export default function ModeShell<M extends string>({
  modes,
  active,
  onChange,
  content,
  toolbarExtra,
  barPosition = 'top',
  hideBuiltInSwitcher = false,
  className,
}: ModeShellProps<M>) {
  const reduce = !!useReducedMotion();
  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {!hideBuiltInSwitcher && (
        <div
          style={{
            position: 'absolute',
            ...(barPosition === 'top' ? { top: 12 } : { bottom: 12 }),
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 33,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div
            style={{
              display: 'flex',
              background: 'color-mix(in srgb, var(--panel) 92%, transparent)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)', // K3: thiếu prefix = tablet không blur
              border: '1px solid var(--border)',
              borderRadius: 999,
              padding: 2,
              gap: 1,
              boxShadow: '0 8px 24px rgba(0,0,0,.14)',
            }}
          >
            {modes.map((m) => {
              const isActive = m.value === active;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => onChange(m.value)}
                  aria-pressed={isActive}
                  style={{
                    appearance: 'none',
                    border: isActive ? '1px solid var(--accent-ring)' : '1px solid transparent',
                    background: isActive ? 'var(--accent-soft)' : 'transparent',
                    color: isActive ? 'var(--accent)' : 'var(--t2)',
                    fontSize: 12,
                    fontWeight: 650,
                    height: 30,
                    padding: '0 14px',
                    borderRadius: 999,
                    cursor: 'pointer',
                  }}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
          {toolbarExtra}
        </div>
      )}
      <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        {/* mode mặc định (KHÔNG "wait") — 2 nhánh chồng lên nhau lúc chuyển, đúng nghĩa
            "crossfade" (mờ dần Ra + mờ dần VÀO cùng lúc), không phải tuần tự cắt-rồi-mới-hiện. */}
        <AnimatePresence initial={false}>
          <motion.div
            key={active}
            // display:flex (ROW, mặc định — KHÔNG đổi flexDirection) — trước H1, content này
            // (NodeLibraryPanel/GalleryPanel/.../FlowCanvas/ChatPanel) là con trực tiếp của
            // `<div className="relative flex min-h-0 flex-1">` (flex ROW thật, xem HomeScreen.tsx
            // trước commit c72cfbf): panel `w-64/w-72 flex flex-col` đứng CẠNH `FlowCanvas`'s
            // wrapperRef (`relative flex-1`) nhờ đó. H1 lồng thêm `ModeShell` nhưng div bọc
            // `content()` bên trong nó KHÔNG `display:flex` → panel xếp chồng dọc (block flow) +
            // wrapperRef của FlowCanvas mất `flex-1` (cha không flex) → sập height:0 → mọi định vị
            // `absolute bottom-*` bên trong (vd BottomToolbar) bắn lên NGOÀI viewport (bug phát
            // hiện lúc verify G1, xem docs/BAO-CAO-CHINH.md "DỞ 1"). Thêm `display:flex` (row) ở
            // ĐÂY phục hồi đúng ngữ cảnh flex row gốc — KHÔNG phải bịa mới.
            style={{ position: 'absolute', inset: 0, display: 'flex', minHeight: 0 }}
            {...guard(reduce, {
              initial: { opacity: 0 },
              animate: { opacity: 1 },
              exit: { opacity: 0 },
              transition: springPop,
            })}
          >
            {content(active)}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
