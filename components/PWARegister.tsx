'use client';

import { useEffect } from 'react';

// Đăng ký service worker cho PWA (cài lên iPad/Android/điện thoại).
// Xử lý update gọn: khi có SW mới đang "waiting", bảo nó skipWaiting rồi
// reload đúng 1 lần khi controller đổi — người dùng luôn chạy bản mới nhất.
export function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    /* 🔴 Q-4 (02/09) — DEV KHÔNG CHỈ "KHÔNG ĐĂNG KÝ", DEV PHẢI CHỦ ĐỘNG DỌN.
     *
     * Câu `if (NODE_ENV !== 'production') return;` là ĐÚNG nhưng KHÔNG ĐỦ, và cái thiếu đó đã
     * đốt trọn buổi sáng 02/09 của hai lane:
     *   · bản production từng chạy trên CÙNG origin `localhost:3001` ⇒ SW `iflow-v1` cắm vào
     *     origin đó và ở lại trong TỪNG PROFILE TRÌNH DUYỆT đã mở nó;
     *   · `public/sw.js` cache-first mọi `/_next/static/*`, mà chunk DEV không có hash trong tên
     *     ⇒ SW trả bản CŨ mãi mãi.
     * Không đăng ký thêm thì cũng không gỡ cái đã cắm. Hệ quả: đĩa đúng, tiến trình đúng, HTTP
     * đúng, mà màn hình vẫn sai — `rm -rf .next` vô ích, restart dev vô ích, vì độc không nằm
     * trong repo.
     *
     * ⇒ Ở dev, GỠ ĐĂNG KÝ + XOÁ CACHE. Đây là chỗ duy nhất chữa được bằng mã: nó chạy TRONG
     * đúng cái profile đang bị nhiễm, tự lành, không cần ai nhớ dán câu lệnh vào console.
     * Việc này chỉ đụng SW của CHÍNH origin dev — không chạm gì của production.
     */
    if (process.env.NODE_ENV !== 'production') {
      const donDev = async () => {
        try {
          const regs = await navigator.serviceWorker.getRegistrations();
          const daCoNguoiLai = Boolean(navigator.serviceWorker.controller);
          await Promise.all(regs.map((r) => r.unregister()));
          if ('caches' in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
          }
          /* Gỡ đăng ký KHÔNG rút SW ra khỏi trang ĐANG mở — trang này vẫn do nó lái tới lượt
           * tải sau. Nên phải tải lại đúng một lần, và chỉ khi thật sự CÓ người lái; không thì
           * mọi lượt dev đều tự reload vô cớ.
           * Chốt chặn vòng lặp là `sessionStorage`, KHÔNG phải biến trong module: sau reload
           * module dựng lại từ đầu nên biến nào cũng về mặc định — đúng công thức lặp vô hạn. */
          const KHOA = 'interiorflow.sw-da-don';
          if (daCoNguoiLai && regs.length > 0 && !sessionStorage.getItem(KHOA)) {
            sessionStorage.setItem(KHOA, '1');
            console.warn('[PWARegister] Gỡ service worker cũ ở dev (bản prod từng chạy trên cổng này) — tải lại một lần.');
            window.location.reload();
          }
        } catch {
          // im lặng — dọn được thì tốt, không dọn được cũng không chặn dev chạy
        }
      };
      donDev();
      return;
    }

    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    const promptUpdate = (reg: ServiceWorkerRegistration) => {
      const sw = reg.waiting;
      if (sw) sw.postMessage('SKIP_WAITING');
    };

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

        // Đã có bản mới chờ sẵn ngay lúc load
        if (reg.waiting) promptUpdate(reg);

        // Bản mới được tìm thấy khi đang chạy
        reg.addEventListener('updatefound', () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              promptUpdate(reg);
            }
          });
        });

        // Chủ động kiểm tra update mỗi khi quay lại tab
        const onVisible = () => {
          if (document.visibilityState === 'visible') reg.update().catch(() => {});
        };
        document.addEventListener('visibilitychange', onVisible);
      } catch {
        // im lặng — thiếu SW không được chặn app chạy
      }
    };

    register();
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  return null;
}
