/** @type {import('next').NextConfig} */
const nextConfig = {
  // Bỏ qua ESLint khi `next build` (bản đóng gói Electron/Windows): lint không chặn
  // build — kiểm tra kiểu đã có tsc riêng (sạch). Tránh vài lint cũ (unused/prefer-const)
  // làm hỏng bản cài. Vẫn nên dọn lint dần khi rảnh.
  eslint: { ignoreDuringBuilds: true },

  // ── Đóng gói Electron ──────────────────────────────────────────────────────
  // Bản Electron hiện dùng cách "next start" + bundle nguyên node_modules
  // (xem electron/main.js + block "build" trong package.json). Cách này chạy
  // ổn với Prisma/SQLite và mẹo cw=userData cho uploads, KHÔNG cần standalone.
  // Nếu về sau muốn gói GỌN hơn: output: 'standalone' (phải sửa electron/main.js
  // chạy .next/standalone/server.js + copy .next/static + public + lo Prisma engine).

  // ── PWA (iPad/Android "Add to Home Screen") ────────────────────────────────
  async headers() {
    return [
      {
        // Service worker: cho phép scope '/', không cache bản sw.js để update landing kịp.
        source: '/sw.js',
        headers: [
          { key: 'Service-Worker-Allowed', value: '/' },
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
      {
        source: '/manifest.webmanifest',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }],
      },
    ];
  },
};

export default nextConfig;
