'use client';

import { useEffect } from 'react';

// Đăng ký service worker cho PWA (cài lên iPad/Android/điện thoại).
// Xử lý update gọn: khi có SW mới đang "waiting", bảo nó skipWaiting rồi
// reload đúng 1 lần khi controller đổi — người dùng luôn chạy bản mới nhất.
export function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    // Không đăng ký ở môi trường dev để tránh cache làm nhiễu hot-reload.
    if (process.env.NODE_ENV !== 'production') return;

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
