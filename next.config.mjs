import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const GOI_DWG_GPL = '@mlightcad/libredwg-web';
const GOC = dirname(fileURLToPath(import.meta.url));

/**
 * MỘT chỗ duy nhất quyết định đường DWG có mặt trong bản dựng hay không — cùng biến môi trường
 * mà `lib/cad/dwg-flag.ts` dùng ở runtime, cố ý KHÔNG đẻ cờ thứ hai (luật 6). Xuất ra để
 * `lib/cad/dwg-build-exclusion.test.ts` kiểm được, thay vì tin lời chú thích.
 */
export function dwgImportBatTrongBanDung(env = process.env) {
  return env.NEXT_PUBLIC_IF_DWG_IMPORT === '1';
}

/** Bảng alias gỡ gói GPL khỏi cây dựng. Trả bảng (không tự gán) để test soi được nội dung. */
export function aliasGoGpl() {
  return { [GOI_DWG_GPL]: join(GOC, 'lib', 'cad', 'dwg-engine-tat.ts') };
}

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

  // ── DWG import ─────────────────────────────────────────────────────────────
  // lib/cad/dwg-worker.ts import `@mlightcad/libredwg-web` (GPL — xem docs/LICENSE-NOTES.md).
  // Glue code Emscripten của thư viện có nhánh dành cho Node.js dùng `import("node:module")` +
  // `require("node:fs"/"node:path"/"node:url")` — nhánh này chỉ CHẠY khi phát hiện môi trường
  // Node (KHÔNG chạy trong Worker trình duyệt), nhưng webpack vẫn cố static-resolve các "node:"
  // specifier này khi bundle cho Worker/browser → lỗi build "UnhandledSchemeError". Bỏ qua các
  // import đó (IgnorePlugin) — an toàn vì code nhánh Node chết (dead code) trong ngữ cảnh Worker.
  // CHỈ áp dụng cho bundle client/worker (isServer=false) — route API server vẫn cần "node:*"
  // hoạt động bình thường.
  //
  // ── GỠ MÃ GPL KHỎI BẢN DỰNG KHI CỜ TẮT (29/08) ────────────────────────────
  // `lib/cad/dwg.ts` đẻ worker bằng `new Worker(new URL('./dwg-worker.ts', import.meta.url))`,
  // nên webpack dựng worker đó VÔ ĐIỀU KIỆN và sao cả mã GPL + `.wasm` vào `.next/`. Sau đó
  // `build.files` gói `".next/**/*"` ⇒ bản sao đã nằm trong bộ cài trước khi electron-builder
  // kịp loại trừ nguồn. Đo thật 29/08: 2 bản wasm 9.399.820 byte + glue Emscripten trong
  // `chunks/6995.js`, trong khi `!node_modules/@mlightcad/**` VẪN có hiệu lực.
  // ⇒ Chặn ở tầng PHÂN GIẢI MODULE: trỏ gói GPL về một bản thay thế rỗng khi cờ tắt. Webpack
  // không đọc tới gói ⇒ không có gì để sao. Bật cờ là gói thật quay lại — xem
  // `lib/cad/dwg-engine-tat.ts` để biết vì sao chọn cách này thay vì loại trừ theo tên tệp.
  webpack: (config, { webpack, isServer }) => {
    if (!isServer) {
      config.plugins.push(new webpack.IgnorePlugin({ resourceRegExp: /^node:/ }));
    }
    if (!dwgImportBatTrongBanDung()) {
      config.resolve = config.resolve ?? {};
      config.resolve.alias = { ...(config.resolve.alias ?? {}), ...aliasGoGpl() };
    }
    return config;
  },

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
