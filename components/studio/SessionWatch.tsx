'use client';

/**
 * components/studio/SessionWatch.tsx — cảnh báo mất phiên NGAY TẠI CHẶNG STUDIO.
 *
 * Vì sao cần: các route studio (/cad-editor, /present-editor, /photo-editor) không hề
 * kiểm tra phiên đăng nhập. Phiên có thể chết từ lâu (cookie hết hạn, hoặc bị server
 * dev khác cùng host localhost xoá đè — xem ghi chú ở lib/server/auth.ts) mà người
 * dùng vẫn vẽ bình thường, tưởng mình đang đăng nhập. Mãi tới lúc bấm "Render" —
 * thao tác duy nhất quay về '/' và có kiểm tra phiên — mới bị đá ra màn đăng nhập.
 * Cảm giác là "bấm Render thì bị văng", thực chất phiên đã đứt từ trước đó rất lâu.
 *
 * Cách làm: hỏi phiên lúc mở chặng và mỗi khi cửa sổ được focus lại (rẻ, đúng lúc
 * người dùng quay lại). Mất phiên → hiện DẢI BÁO NHẸ ở đáy màn hình, KHÔNG chặn thao
 * tác vẽ đang dở. 503 (server lỗi) thì im lặng bỏ qua — phiên vẫn còn, không nag.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

/** Nhịp hỏi lại định kỳ khi tab mở liên tục — thưa, chỉ để không bỏ sót phiên hết hạn. */
const POLL_MS = 5 * 60_000;

export default function SessionWatch() {
  const router = useRouter();
  const [lost, setLost] = useState(false);
  // StrictMode dev mount effect 2 lần → chặn cú fetch trùng lúc mở chặng.
  const ran = useRef(false);

  const check = useCallback(async () => {
    try {
      const r = await fetch('/api/auth/me');
      if (r.ok) {
        setLost(false);
        return;
      }
      // 503 = hạ tầng lỗi, KHÔNG phải mất phiên → không báo gì.
      if (r.status === 503) return;
      setLost(true);
    } catch {
      /* mạng đứt — không kết luận mất phiên */
    }
  }, []);

  useEffect(() => {
    if (!ran.current) {
      ran.current = true;
      void check();
    }
    const onFocus = () => {
      if (document.visibilityState === 'visible') void check();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    const t = setInterval(() => void check(), POLL_MS);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
      clearInterval(t);
    };
  }, [check]);

  if (!lost) return null;

  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-4"
    >
      <div
        className="pointer-events-auto flex items-center gap-3 rounded-[10px] border px-4 py-2.5 text-[12.5px] shadow-lg"
        style={{
          borderColor: 'var(--border)',
          background: 'var(--panel, var(--bg))',
          color: 'var(--t2)',
        }}
      >
        <span>
          Phiên đăng nhập đã kết thúc · bản vẽ của bạn vẫn được giữ nguyên tại máy.
        </span>
        <button
          onClick={() => router.push('/')}
          className="shrink-0 rounded-md border px-2.5 py-1 text-[12px] transition-colors hover:bg-[var(--hover)]"
          style={{ borderColor: 'var(--border)', color: 'var(--t1)' }}
        >
          Đăng nhập lại
        </button>
      </div>
    </div>
  );
}
