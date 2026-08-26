/**
 * app/api/project-files/_lib/guard.ts — hai tiện ích dùng chung cho 3 route của `project-files`.
 *
 * ⚠️ NẰM Ở `_lib/` CÓ LÝ DO, đừng dời vào `route.ts`: Next 14 **validate danh sách export của
 * route.ts** (chỉ cho GET/POST/… + vài config). Export thêm một hàm thường ở đó là lỗi kiểu lúc
 * build. Thư mục `_lib` có gạch dưới ⇒ Next không coi là route.
 */
import { NextResponse } from 'next/server';
import { AccessError } from '../../../../lib/server/access';
import { prisma } from '../../../../lib/server/db';

/**
 * ⛔ KHÔNG BAO GIỜ ĐỂ LỖI THOÁT RA NGOÀI HANDLER — ca thật 20/08 ở `project-asset-usage`:
 * `throw e` cho lỗi non-AccessError khiến Next trả **500 body RỖNG, không log gì**, không chẩn
 * được. Mọi lỗi phải đi qua đây: luôn có body JSON + `console.error` phía server.
 */
export function loiJson(e: unknown, nhan: string, cho: string) {
  if (e instanceof AccessError) return NextResponse.json({ error: e.message }, { status: e.status });
  console.error(`[${nhan}] ${cho} — lỗi không lường trước:`, e);
  const detail = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
  return NextResponse.json(
    {
      error: 'Lỗi máy chủ khi xử lý project-files.',
      // Chi tiết CHỈ lộ ngoài production — đủ để chẩn lúc dev, không rò nội tạng khi phát hành.
      ...(process.env.NODE_ENV === 'production' ? {} : { detail }),
    },
    { status: 500 },
  );
}

/**
 * `ProjectFile` sinh cùng lượt `prisma generate` với `ProjectAssetUsage` (H6) ⇒ dính CÙNG bẫy đã
 * đo 20/08: tiến trình dev server sống dai giữ `@prisma/client` CŨ trong module cache ⇒ delegate
 * là `undefined` ⇒ `TypeError: Cannot read properties of undefined` — query chạy tay thì OK, qua
 * browser thì chết. Guard này để nhận ra trong 1 giây thay vì đọc một TypeError câm.
 * ⇒ Cách chữa là **KHỞI ĐỘNG LẠI dev server**, không phải sửa query.
 */
export function kiemDelegate(nhan: string) {
  if (typeof (prisma as { projectFile?: unknown }).projectFile !== 'undefined') return null;
  const msg =
    'Prisma Client đang chạy KHÔNG có model ProjectFile — tiến trình server khởi động trước ' +
    'lần `prisma generate` gần nhất. KHỞI ĐỘNG LẠI dev server (không phải lỗi dữ liệu).';
  console.error(`[${nhan}] ${msg}`);
  return NextResponse.json({ error: msg }, { status: 503 });
}

/** Trường trả ra cho client — MỘT nơi khai, 3 route dùng chung. */
export const FILE_SELECT = {
  id: true,
  projectId: true,
  name: true,
  mime: true,
  path: true,
  contentHash: true,
  uploadedBy: true,
  uploadedAt: true,
} as const;
