/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Đóng gói Electron ──────────────────────────────────────────────────────
  // Bản Electron hiện dùng cách "next start" + bundle nguyên node_modules
  // (xem electron/main.js + block "build" trong package.json). Cách này chạy
  // ổn với Prisma/SQLite và mẹo cw=userData cho uploads, KHÔNG cần standalone.
  //
  // Nếu về sau muốn gói GỌN hơn, có thể bật standalone:
  //     output: 'standalone',
  // Lưu ý khi bật: Next sẽ tạo `.next/standalone/server.js` kèm node_modules tối
  // giản; phải sửa electron/main.js để chạy `node .next/standalone/server.js`
  // (thay cho `next start`), copy thủ công `.next/static` + `public` vào standalone,
  // và tự lo Prisma query engine + `prisma migrate deploy`. Không bật ở đây để
  // tránh rủi ro và để `next dev`/`next start` chạy y như cũ.
};

export default nextConfig;
