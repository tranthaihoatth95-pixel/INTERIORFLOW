// InteriorFlow Service Worker — nhẹ, không thư viện.
// Chiến lược:
//   - /api/*            → network-first (dữ liệu auth/credits/flows phải mới; offline mới fallback cache)
//   - navigation (HTML) → network-first (luôn lấy app shell mới nhất; offline fallback về '/')
//   - asset tĩnh        → cache-first (icon, font, ảnh, _next/static… bất biến theo hash)
// Đổi CACHE_VERSION mỗi lần muốn ép làm mới toàn bộ cache.

const CACHE_VERSION = 'iflow-v1';
const APP_SHELL = `${CACHE_VERSION}-shell`;
const RUNTIME = `${CACHE_VERSION}-runtime`;

// App shell tối thiểu để mở được khi offline
const SHELL_URLS = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  // cài shell rồi vào hàng đợi active ngay
  event.waitUntil(
    caches
      .open(APP_SHELL)
      .then((cache) => cache.addAll(SHELL_URLS).catch(() => undefined))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  // dọn cache phiên bản cũ + nhận quyền điều khiển tab đang mở
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

// Cho phép client bảo SW cập nhật ngay (dùng bởi PWARegister)
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/fonts/') ||
    /\.(?:png|jpe?g|svg|gif|webp|avif|ico|woff2?|ttf|otf|css|js|webmanifest)$/i.test(url.pathname)
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return; // POST/PUT/DELETE (auth, upload, credits) không đụng vào

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // bỏ qua cross-origin (fal.ai, CDN…)

  // API: network-first, fallback cache khi mất mạng
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, RUNTIME));
    return;
  }

  // Điều hướng trang (HTML): network-first, offline fallback về app shell '/'
  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirst(request, APP_SHELL).catch(() => caches.match('/')),
    );
    return;
  }

  // Asset tĩnh (đã hash bất biến): cache-first
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, RUNTIME));
    return;
  }

  // Còn lại: network-first cho an toàn
  event.respondWith(networkFirst(request, RUNTIME));
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw err;
  }
}
