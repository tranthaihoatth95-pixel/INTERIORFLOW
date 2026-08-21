'use client';

/**
 * components/studio/QuayVeTrinhBay.tsx — viên "Quay về Trình bày" (deep-link demo, 21/08).
 *
 * Hiện KHI VÀ CHỈ KHI có mốc quay-về đang sống (`present-return.ts` — tức người trình bày vừa
 * rời trình chiếu bằng một deep link trên slide) VÀ đang KHÔNG đứng ở chính trang Present đó.
 * Bấm = router.push về đường Present đã lưu — `PresentEditor` tự tiêu mốc, nhảy đúng slide, vào
 * lại chế độ trình chiếu. Nút ✕ nhỏ = huỷ mốc (thoát hẳn kịch bản demo, không quay về).
 *
 * Đứng cố định đáy-giữa, KHÔNG che dock công cụ nào (đáy các chặng chừa 44px status bar — viên
 * nổi trên 56px, z 75 dưới SlidePlayer z 80). Poll nhẹ 1s: mốc ghi từ tab/route khác trong cùng
 * phiên — không đáng mở kênh sự kiện riêng cho một viên tiện nghi.
 */

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Play, X } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { RADIUS } from '@/lib/geometry';
import { clearPresentReturn, peekPresentReturn, type PresentReturnMark } from '@/lib/present-editor/present-return';

export function QuayVeTrinhBay() {
  const tr = useT();
  const router = useRouter();
  const pathname = usePathname();
  const [mark, setMark] = useState<PresentReturnMark | null>(null);

  useEffect(() => {
    const doc = () => setMark(peekPresentReturn());
    doc();
    const t = setInterval(doc, 1000);
    return () => clearInterval(t);
  }, []);

  if (!mark || pathname === mark.path) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 56,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 75,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '5px 6px 5px 14px',
        borderRadius: RADIUS.full,
        background: 'color-mix(in srgb, var(--panel) 94%, transparent)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid var(--border-strong)',
        boxShadow: 'var(--shadow-pop)',
      }}
    >
      <button
        type="button"
        onClick={() => router.push(mark.path)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          border: 0,
          background: 'transparent',
          color: 'var(--t1)',
          fontSize: 12.5,
          fontWeight: 600,
          cursor: 'pointer',
          padding: '3px 4px',
        }}
      >
        <Play size={13} style={{ color: 'var(--accent)' }} />
        {tr(`Quay về Trình bày — slide ${mark.slideIndex + 1}`, `Back to Present — slide ${mark.slideIndex + 1}`)}
      </button>
      <button
        type="button"
        onClick={() => {
          clearPresentReturn();
          setMark(null);
        }}
        aria-label={tr('Thoát kịch bản trình bày', 'Leave the presentation flow')}
        style={{
          display: 'grid',
          placeItems: 'center',
          width: 24,
          height: 24,
          border: 0,
          borderRadius: RADIUS.full,
          background: 'transparent',
          color: 'var(--t4)',
          cursor: 'pointer',
        }}
      >
        <X size={12} />
      </button>
    </div>
  );
}

export default QuayVeTrinhBay;
