'use client';

/**
 * components/render-studio/ToolModeHome.tsx — lưới 6 thẻ việc, MÀN MẶC ĐỊNH chặng Render
 * (VIỆC B, 28/07, docs/SPEC-RENDER-STUDIO.md §1B). Chọn 1 thẻ → ToolModeForm (2 cột).
 */

import { TASK_CARDS } from '@/lib/render-studio/task-cards';
import { useToolModeUi, useIsSmallScreenForCanvas } from '@/lib/render-studio/tool-mode-ui';

export default function ToolModeHome() {
  const selectCard = useToolModeUi((s) => s.selectCard);
  const openCanvas = useToolModeUi((s) => s.openCanvas);
  const smallScreen = useIsSmallScreenForCanvas();

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        // z-index: FlowCanvas.tsx có toast lỗi/thông báo z-30 + empty-state z-10 NGAY BÊN
        // TRONG cùng cây DOM cha (position:relative không tạo stacking context riêng) — phải
        // vượt qua để overlay này thật sự "che kín" canvas như B5 yêu cầu, không bị lộ qua khe.
        zIndex: 35,
        overflowY: 'auto',
        background: 'var(--bg)',
        padding: '48px 32px',
      }}
    >
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: 'var(--t1)',
            marginBottom: 6,
            textAlign: 'center',
          }}
        >
          Chọn việc muốn làm
        </h1>
        <p style={{ fontSize: 13, color: 'var(--t3)', textAlign: 'center', marginBottom: 32 }}>
          Không dây, không node — chọn 1 việc, thả ảnh, bấm Render.
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
          }}
        >
          {TASK_CARDS.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => selectCard(card.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                textAlign: 'left',
                border: '1px solid var(--border)',
                borderRadius: 12,
                background: 'var(--panel)',
                overflow: 'hidden',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  height: 120,
                  background: 'var(--field)',
                }}
              >
                {card.before && card.after ? (
                  <>
                    <img src={card.before} alt="Trước" style={{ width: '50%', height: '100%', objectFit: 'cover' }} />
                    <img src={card.after} alt="Sau" style={{ width: '50%', height: '100%', objectFit: 'cover' }} />
                  </>
                ) : (
                  <div
                    style={{
                      width: '100%',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 11,
                      color: 'var(--t4)',
                    }}
                  >
                    Chờ ảnh thật
                  </div>
                )}
              </div>
              <div style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--t1)', marginBottom: 3 }}>{card.label}</div>
                <div style={{ fontSize: 11.5, color: 'var(--t3)', lineHeight: 1.4 }}>{card.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {!smallScreen && (
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <button
              type="button"
              onClick={openCanvas}
              style={{
                fontSize: 12,
                color: 'var(--t3)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
              title="Vào thẳng node graph (nối node thủ công) — dành cho việc phức tạp hơn 6 thẻ trên"
            >
              Mở canvas (nâng cao) →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
