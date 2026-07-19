'use client';

/**
 * components/present-editor/StagePresetPanel.tsx — Panel chọn KHỔ TRÌNH BÀY (PS-4).
 *
 * 5 khổ: 16:9 (mặc định) · A4 ngang/dọc · A3 ngang/dọc — board trình bày nội thất (nhiều
 * hồ sơ khách vẫn in A3 dọc). Bấm 1 khổ → ÁP NGAY (đổi + dàn lại, không cần bước "Áp dụng"
 * riêng — giống chọn brush trong Figma/Canva). Dàn lại (reflow) = tái sắp xếp tiêu đề/ảnh/
 * nội dung theo lưới/margin DECK_STANDARDS cho khổ mới (bản gọn Magic Resize, KHÔNG AI) —
 * xem lib/present-editor/reflow.ts.
 *
 * NHÃN BẮT BUỘC (spec PS-4): đây là khổ MÀN HÌNH/CHIẾU, KHÔNG phải in production 300dpi —
 * render hiện tại (~1920×1080 composite, hero ảnh AI tối đa ~1344px) chỉ đủ ~116dpi trên
 * khổ A3 giấy thật. In nét thật chờ chặng Render nâng độ phân giải (NGOÀI PHẠM VI PS-4).
 */

import { STAGE_PRESET_ORDER, STAGE_PRESETS, DEFAULT_STAGE_PRESET, type StagePresetId } from '@/lib/present-editor/stage-presets';

interface Props {
  current?: StagePresetId;
  onClose: () => void;
  /** áp khổ đã chọn — parent đổi deck.stagePreset + dàn lại (reflowDeckForStage). */
  onApply: (id: StagePresetId) => void;
}

export default function StagePresetPanel({ current, onClose, onApply }: Props) {
  const active = current ?? DEFAULT_STAGE_PRESET;

  return (
    <div
      role="dialog"
      aria-label="Khổ trình bày"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        background: 'rgba(0,0,0,.45)',
        display: 'grid',
        placeItems: 'center',
      }}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: 430,
          maxWidth: '94vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: 18,
          boxShadow: '0 24px 70px rgba(0,0,0,.5)',
          color: 'var(--t1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <strong style={{ fontSize: 15 }}>Khổ trình bày</strong>
          <button type="button" onClick={onClose} title="Đóng" style={xBtn}>
            ×
          </button>
        </div>

        <p style={{ fontSize: 11.5, color: 'var(--t4)', lineHeight: 1.55, marginBottom: 14 }}>
          Khổ trình bày (màn hình/chiếu) — dùng để xem trên màn hình/máy chiếu hoặc xuất
          PDF·PNG độ phân giải màn hình. KHÔNG phải khổ in production 300dpi — in nét thật cần
          chặng Rendering nâng độ phân giải, chưa làm ở bản này.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
          {STAGE_PRESET_ORDER.map((id) => {
            const s = STAGE_PRESETS[id];
            const isActive = id === active;
            const landscape = s.w >= s.h;
            const short = 30;
            const long = 30 * Math.max(s.w, s.h) / Math.min(s.w, s.h);
            return (
              <button
                key={id}
                type="button"
                onClick={() => onApply(id)}
                title={`${s.label} — ${s.w}×${s.h}px (màn hình/chiếu)`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 7,
                  padding: '12px 6px',
                  borderRadius: 10,
                  border: isActive ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                  background: isActive ? 'var(--accent-soft)' : 'var(--field)',
                  color: isActive ? 'var(--accent)' : 'var(--t2)',
                  cursor: 'pointer',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    width: landscape ? long : short,
                    height: landscape ? short : long,
                    maxWidth: 44,
                    maxHeight: 44,
                    border: '1.5px solid currentColor',
                    borderRadius: 2,
                  }}
                />
                <span style={{ fontSize: 11.5, fontWeight: 600 }}>{s.label}</span>
              </button>
            );
          })}
        </div>

        <p style={{ fontSize: 11, color: 'var(--t4)', lineHeight: 1.55 }}>
          Đổi khổ sẽ TỰ DÀN LẠI (compact reflow) vị trí tiêu đề/ảnh/nội dung cho vừa tỉ lệ mới
          — không phải AI, giữ nguyên chữ/ảnh gốc, chỉ đổi vị trí/kích thước. Xuất PowerPoint
          (.pptx) luôn giữ khổ 16:9 (không theo khổ đã chọn ở đây).
        </p>
      </div>
    </div>
  );
}

const xBtn: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: 'var(--t3)',
  cursor: 'pointer',
  fontSize: 20,
  lineHeight: 1,
};
