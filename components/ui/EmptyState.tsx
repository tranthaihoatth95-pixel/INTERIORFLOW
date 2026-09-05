'use client';

/**
 * components/ui/EmptyState.tsx — KHUÔN MÀN TRỐNG dùng chung (P5, 04/08).
 *
 * Rút từ mock đã duyệt `docs/mocks/mock-if-thu-vien-trong.html`: màn trống KHÔNG phải khoảng
 * trắng — vẫn hiện CẤU TRÚC THẬT nơi đồ sẽ nằm (ngăn kệ nét đứt + bóng lõm kiểu kệ gỗ / hàng
 * bảng ghost), kèm tối đa 2 nút LÀM ĐƯỢC VIỆC TẠI CHỖ.
 *
 * ⛔ Luật (theo phiếu P5 + luật X2 trong 00-CHOT):
 *   - CẤM đá người dùng sang màn khác rồi bảo quay lại ("sang chặng 2D vẽ rồi quay lại" = sai).
 *     Action của EmptyState phải làm được việc NGAY TẠI MÀN NÀY (mở dialog, mở file picker,
 *     tải mẫu…). Không có việc tại chỗ thật → truyền action `disabled` KÈM `disabledReason`
 *     (luật §9 — cấm nút giả, cấm giấu ô trống).
 *   - Màu/bo/bóng qua token theme (--field · --border · --t1..t5 · --accent · --radius-sm/md) —
 *     tự đúng cả 2 theme.
 *
 * Ghost structure: `ghost="bays"` = lưới ngăn kệ 4:3 nét đứt (mock Thư viện) · `ghost="rows"` =
 * 3 hàng bảng ghost (bảng vật liệu/BOQ) · `ghost="none"` = chỉ icon+chữ+nút (panel hẹp).
 *
 * 04/09 — thêm trạng thái thứ TƯ `tone="offline"` (thu về từ `TrangThaiO` của dòng phát triển
 * 20/08, gộp vào đây thay vì dựng component thứ hai). Ngoại tuyến dùng chung dấu hiệu nặng-nề với
 * lỗi, nhưng khác ở chỗ quan trọng nhất: **không có nút "Thử lại"** — máy tự lọc, không dặn nơi
 * gọi. Kèm `lapDayO` cho ô có chiều cao cố định: khối trạng thái phải chiếm đúng chỗ nội dung
 * thật sẽ chiếm, không phải một viên 44px lơ lửng giữa ô 400px.
 *
 * 03/09 (Cloud Slice 9) — BA TRẠNG THÁI, MỘT KHUÔN: `tone="empty"` (mặc định, như cũ) ·
 * `tone="loading"` (thanh `LightBar` — lõi tiến trình chung, KHÔNG bịa %: chỉ truyền `progress`
 * khi có số thật, bỏ trống thì thanh tự sang hình thái không-đếm-được) · `tone="error"` (khung
 * icon màu `--danger`, `role="alert"`, nút hành động = thử lại/mở lỗi tại chỗ). Cùng một khuôn để
 * màn trống / đang tải / lỗi của mọi panel đứng cùng chỗ, cùng nhịp — không ba kiểu ba nơi.
 * Nút mờ đi đường `aria-disabled` + `aria-describedby` (bài học 16/08: `disabled` bị Tab bỏ qua,
 * `title` câm trên cảm ứng) — cùng đường với ToolbarChip.
 */

import { useId } from 'react';
import type { ReactNode, CSSProperties } from 'react';
import LightBar from './LightBar';

export interface EmptyStateAction {
  label: string;
  /** Việc làm được NGAY TẠI CHỖ — mở dialog/picker/tải mẫu. KHÔNG điều hướng sang màn khác. */
  onClick?: () => void;
  primary?: boolean;
  icon?: ReactNode;
  /** dòng phụ nhỏ dưới nhãn (vd "hoặc kéo thả vào đây"). */
  hint?: string;
  disabled?: boolean;
  /** BẮT BUỘC khi disabled — lý do tại chỗ, hiện ở title (luật §9: cấm nút giả không lý do). */
  disabledReason?: string;
}

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  desc?: string;
  actions?: EmptyStateAction[];
  ghost?: 'bays' | 'rows' | 'none';
  /** số ngăn ghost khi ghost="bays" (mặc định 10 = 2 hàng × 5). */
  bayCount?: number;
  /** nhãn mờ trong vài ngăn đầu (vd ['bàn','ghế','sofa']) — cho thấy kệ sẽ đựng GÌ. */
  bayCaptions?: string[];
  /** gọn cho panel hẹp (padding nhỏ, ghost thu lại). */
  compact?: boolean;
  /** trạng thái: trống (mặc định) · đang tải · lỗi · ngoại tuyến — MỘT khuôn cho cả bốn. */
  tone?: 'empty' | 'loading' | 'error' | 'offline';
  /**
   * Lấp đầy ô chứa (`height:100%`). Cái bị chê không phải "có khối trạng thái" mà là **một viên
   * 44px lơ lửng giữa một ô cao 400px** — khối trạng thái phải chiếm đúng chỗ nội dung thật sẽ
   * chiếm. Mặc định TẮT để không đổi hành vi của ~40 nơi đang gọi; bật ở ô có chiều cao cố định.
   */
  lapDayO?: boolean;
  /** 0..100 CHỈ khi đo được thật; bỏ trống = không đếm được (LightBar không in số). */
  progress?: number;
  style?: CSSProperties;
}

const dashedBox: CSSProperties = {
  border: '1px dashed var(--border-strong)',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--field)',
};

export function EmptyState({
  icon,
  title,
  desc,
  actions = [],
  ghost = 'none',
  bayCount = 10,
  bayCaptions = [],
  compact = false,
  tone = 'empty',
  progress,
  lapDayO = false,
  style,
}: EmptyStateProps) {
  const reasonBase = useId();
  /**
   * NGOẠI TUYẾN THÌ KHÔNG CÓ "THỬ LẠI". Mất mạng mà bảo người ta bấm lại là lời khuyên vô ích —
   * bấm mười lần cũng vậy, và mỗi lần bấm hụt là một lần app nói dối rằng nó làm được gì đó.
   * Đường đúng là nêu việc CỤC BỘ nào vẫn dùng được, rồi để app tự biết lúc mạng về (sự kiện
   * `online`). Lọc ở ĐÂY chứ không dặn nơi gọi: dặn thì sẽ có chỗ quên, lọc thì không.
   */
  const nutHienRa =
    tone === 'offline' ? actions.filter((a) => !/thử lại|retry|tải lại|reload/i.test(a.label)) : actions;
  // NGOẠI TUYẾN cũng là hỏng-việc-ngay ⇒ cùng dấu hiệu màu/khung với lỗi. Khác ở CHỖ KHÁC: nó
  // KHÔNG được có nút "Thử lại" (xem chỗ lọc `actions` dưới đây).
  const nangNe = tone === 'error' || tone === 'offline';
  return (
    <div
      role={nangNe ? 'alert' : undefined}
      aria-live={tone === 'loading' ? 'polite' : undefined}
      aria-busy={tone === 'loading' || undefined}
      data-tone={tone}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        padding: compact ? '18px 14px' : '28px 26px', gap: 0, minWidth: 0,
        ...(lapDayO ? { height: '100%', justifyContent: 'center' } : null),
        ...style,
      }}
    >
      {/* ── cấu trúc thật: kệ có ngăn (mock .shelf/.bays) hoặc hàng bảng ghost ── */}
      {ghost === 'bays' && (
        <div
          aria-hidden
          style={{
            position: 'relative', width: '100%', maxWidth: 560, padding: '12px 12px 16px',
            borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
            background: 'linear-gradient(180deg, var(--field), transparent)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,.18)', marginBottom: 18,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${compact ? 2 : 5}, 1fr)`, gap: 8 }}>
            {Array.from({ length: bayCount }, (_, i) => (
              <div
                key={i}
                style={{
                  ...dashedBox, aspectRatio: '4 / 3', display: 'grid', placeItems: 'center',
                  background: 'transparent',
                }}
              >
                <span style={{ fontSize: 9, lineHeight: 1.5, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--t5)' }}>
                  {bayCaptions[i] ?? 'trống'}
                </span>
              </div>
            ))}
          </div>
          {/* mép kệ dưới — bóng mờ giả gỗ, đúng mock .shelf::after */}
          <div style={{ position: 'absolute', left: 10, right: 10, bottom: 5, height: 5, borderRadius: 3, background: 'linear-gradient(180deg, var(--border-strong), transparent)', opacity: 0.6 }} />
        </div>
      )}
      {ghost === 'rows' && (
        <div aria-hidden style={{ width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 18 }}>
          {[0.9, 0.65, 0.4].map((op, i) => (
            <div key={i} style={{ ...dashedBox, height: compact ? 22 : 28, opacity: op }} />
          ))}
        </div>
      )}

      {tone === 'loading' && (
        <div style={{ width: compact ? 180 : 240, maxWidth: '100%', marginBottom: 14 }}>
          <LightBar value={progress} label={title} />
        </div>
      )}

      {icon && (
        <div
          style={{
            width: 44, height: 44, display: 'grid', placeItems: 'center', borderRadius: 'var(--radius-sm)',
            border: `1px solid ${nangNe ? 'var(--danger)' : 'var(--border-strong)'}`, background: 'var(--field)',
            color: nangNe ? 'var(--danger)' : 'var(--t4)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,.14)', marginBottom: 12,
          }}
        >
          {icon}
        </div>
      )}

      <p style={{ margin: 0, fontSize: 'var(--fs-sm)', fontWeight: 'var(--fw-semi)' as never, color: 'var(--t1)', lineHeight: 1.5 }}>
        {title}
      </p>
      {desc && (
        <p style={{ margin: '5px 0 0', maxWidth: 420, fontSize: 'var(--fs-2xs)', color: 'var(--t4)', lineHeight: 1.65, textWrap: 'pretty' as never }}>
          {desc}
        </p>
      )}

      {nutHienRa.length > 0 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 14 }}>
          {nutHienRa.map((a, i) => (
            <button
              key={a.label}
              type="button"
              onClick={a.disabled ? undefined : a.onClick}
              aria-disabled={a.disabled || undefined}
              aria-describedby={a.disabled && a.disabledReason ? `${reasonBase}-${i}` : undefined}
              style={{
                height: 32, padding: '0 14px', borderRadius: 999,
                display: 'inline-flex', alignItems: 'center', gap: 6,
                cursor: a.disabled ? 'not-allowed' : 'pointer',
                opacity: a.disabled ? 'var(--mo-vo-hieu)' : 1,
                fontSize: 'var(--fs-2xs)', fontWeight: 'var(--fw-semi)' as never, lineHeight: 1.5,
                border: a.primary ? '1px solid var(--accent)' : '1px solid var(--border-strong)',
                background: a.primary ? 'var(--accent)' : 'var(--field)',
                color: a.primary ? 'var(--on-accent)' : 'var(--t1)',
              }}
            >
              {a.icon}
              {a.label}
              {a.hint && !a.disabled && (
                <small style={{ fontWeight: 400, opacity: 0.75 }}>{a.hint}</small>
              )}
              {a.disabled && a.disabledReason && (
                <span id={`${reasonBase}-${i}`} className="if-tooltip-a11y">
                  {a.disabledReason}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
