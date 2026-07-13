'use client';

/**
 * components/studio/FoldableDualPane.tsx — D-1: khung DUAL-PANE cho máy gập (Find N6).
 *
 * Nguyên tắc: CHỈ COMPOSE, không đụng nội bộ CadSheets/PresentSheets.
 *   - Màn thường  → render ĐÚNG `primary` như cũ (secondary không mount) — zero khác biệt.
 *   - Máy gập MỞ  → `@media (horizontal-viewport-segments: 2)`: 2 pane cạnh nhau,
 *     khe bản lề chừa bằng env(viewport-segment-*) (CSS .if-dualpane, globals.css).
 *   - Fallback thử nghiệm: màn rộng ≥840px CHỈ KHI bật cờ labs — KHÔNG ép mọi màn
 *     rộng thành dual. Bật bằng localStorage `interiorflow.labs.dualpane = '1'`
 *     hoặc query `?dualpane=1` (test nhanh trong browser/DevTools).
 */

import { useEffect, useState, type ReactNode } from 'react';

const FLAG_KEY = 'interiorflow.labs.dualpane';
const SEGMENTS_MQ = '(horizontal-viewport-segments: 2)';
/** Ngưỡng fallback: đủ rộng cho 2 pane làm việc thật (≈ inner Find N6 landscape). */
const WIDE_MIN = 840;

/** true khi nên bày 2 pane: máy gập mở, hoặc màn rộng + cờ labs bật. */
export function useDualPane(): boolean {
  const [dual, setDual] = useState(false);

  useEffect(() => {
    const compute = () => {
      try {
        // matchMedia với feature lạ trả matches=false trên trình duyệt chưa hỗ trợ → an toàn.
        const segments = window.matchMedia?.(SEGMENTS_MQ)?.matches ?? false;
        const flagOn =
          localStorage.getItem(FLAG_KEY) === '1' ||
          new URLSearchParams(window.location.search).get('dualpane') === '1';
        setDual(segments || (flagOn && window.innerWidth >= WIDE_MIN));
      } catch {
        setDual(false);
      }
    };
    compute();
    window.addEventListener('resize', compute);
    let mq: MediaQueryList | null = null;
    try {
      mq = window.matchMedia(SEGMENTS_MQ);
      mq.addEventListener?.('change', compute);
    } catch {
      /* trình duyệt cũ — resize đủ dùng */
    }
    return () => {
      window.removeEventListener('resize', compute);
      mq?.removeEventListener?.('change', compute);
    };
  }, []);

  return dual;
}

interface Props {
  /** Pane chính — nội dung route y như bản single-pane. */
  primary: ReactNode;
  /** Pane phụ — CHỈ mount khi dual bật (màn thường không trả thêm DOM). */
  secondary?: ReactNode;
}

export default function FoldableDualPane({ primary, secondary }: Props) {
  const dual = useDualPane();
  return (
    <div className="if-dualpane">
      <div className="if-pane-primary">{primary}</div>
      {dual && secondary != null && <div className="if-pane-secondary">{secondary}</div>}
    </div>
  );
}
