'use client';
/**
 * components/present/PresentOverlay.tsx — Present mode TRONG APP.
 *
 * Lớp phủ full-bleed (tách khỏi node graph) để trình chiếu deck/board ngay trong
 * app. Đây là TRÌNH XEM, không phải trình soạn — giữ đơn giản, khó vỡ.
 *
 * CÁCH TÍCH HỢP (cho integrator):
 *   - Đây là component tự chứa. Mount khi cần vào Present mode, unmount khi thoát.
 *   - Ví dụ trong nơi mount overlay của app (vd cạnh Dashboard overlay trong store):
 *       {presentModeOpen && <PresentOverlay onClose={() => setPresentModeOpen(false)} />}
 *   - Cần thêm 1 cờ store `presentModeOpen` + setter, và 1 nút kích hoạt ở Header
 *     (chỉ hiện khi phase === 'present'). Xem báo cáo agent để biết đề xuất chi tiết.
 *   - Mặc định trình chiếu deck Detech mẫu (DEMO_DECK). Khi pipeline Present của app
 *     xuất được mảng slide thật, truyền vào PresentDeck qua prop `deck`.
 */
import { useEffect } from 'react';
import PresentDeck from './PresentDeck';
import type { PresentDeck as PresentDeckData } from '@/lib/present-demo';

export interface PresentOverlayProps {
  onClose: () => void;
  /** deck thật từ pipeline app (nếu có); bỏ trống = deck mẫu Detech. */
  deck?: PresentDeckData;
}

export default function PresentOverlay({ onClose, deck }: PresentOverlayProps) {
  // khoá cuộn nền khi overlay mở
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Present mode"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'var(--bg)',
      }}
    >
      <PresentDeck deck={deck} onClose={onClose} />
    </div>
  );
}
