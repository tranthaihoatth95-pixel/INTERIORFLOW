'use client';

/**
 * lib/cad/cad3d-autosave.ts — HOOK THẬT, gọi Ở GỐC `Render3DModeSkeleton.tsx` (mount/unmount
 * đúng lúc mode "3D Thiết kế" bật/tắt) — sửa `docs/TECH-DEBT.md` mục "Mode 3D Thiết kế KHÔNG
 * autosave xuống IndexedDB".
 *
 * NGUYÊN NHÂN (đọc code): `/projects/[id]/cad` và `/projects/[id]/render` là HAI ROUTE Next.js
 * riêng (không `layout.tsx` chung ngoài root) — `CadSheets` (nơi DUY NHẤT có
 * `useCadStore.subscribe(...)` + `createSheetsAutosaver(...)`) chỉ mount ở route `/cad`. Mode 3D
 * (route `/render`) sửa CÙNG `useCadStore` singleton nhưng không ai lắng nghe khi `CadSheets`
 * chưa mount.
 *
 * SỬA: KHÔNG viết cơ chế lưu thứ hai (K1) — cốt lõi (`startCad3DAutosave`, `cad3d-autosave-
 * core.ts`) gọi lại ĐÚNG `loadSheets`/`saveSheets`/`createSheetsAutosaver` (`lib/sheets-
 * persist.ts`), CÙNG khoá `userId::/cad-editor::bucketId` mà `CadSheets` dùng.
 *
 * File NÀY chỉ thêm lớp `window`/`document` (beforeunload/visibilitychange, cùng khuôn
 * `CadSheets.tsx`) + `useSheetsBucketId()` (cần `next/navigation`, không chạy ngoài React) —
 * logic thật nằm hết ở `cad3d-autosave-core.ts` (THUẦN, test bằng sucrase-node ở
 * `cad3d-autosave-core.test.ts`, không cần file này/không cần DOM).
 */

import { useEffect } from 'react';
import { useSheetsBucketId } from '../scope';
import { startCad3DAutosave, type Cad3DAutosaveHandle } from './cad3d-autosave-core';
import { danhTinhChoLuot } from '../danh-tinh-phien';

export function useCad3DAutosave(): void {
  const bucketId = useSheetsBucketId();

  useEffect(() => {
    let cancelled = false;
    let handle: Cad3DAutosaveHandle | null = null;

    /**
     * P0 04/09 — `getLastUserId()` ĐỒNG BỘ ở đây trả `null` khi vào thẳng URL (bộ đệm chưa được
     * gieo, xem `lib/danh-tinh-phien.ts`) ⇒ `startCad3DAutosave('')` trả handle RỖNG ⇒ khối 3D
     * dựng xong KHÔNG ghi một byte nào, KHÔNG báo lỗi. Nay chờ định danh giải từ PHIÊN MÁY CHỦ.
     *
     * Hai chỗ nghe sự kiện PHẢI đăng ký NGAY (đồng bộ), không đợi định danh: người dùng có thể
     * đóng tab trước khi định danh về, và gỡ listener đòi đúng tham chiếu đã đăng ký — nên chúng
     * trỏ qua `flush`, còn `handle` thì lắp sau. Chưa có handle ⇒ `flush()` là no-op, đúng nghĩa
     * "chưa có gì để lưu".
     */
    const flush = () => handle?.flushNow();
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', onHide);

    void (async () => {
      const { tiepTuc, userId } = await danhTinhChoLuot(() => !cancelled);
      // Không có userId (thật sự chưa đăng nhập) ⇒ không dựng autosave — y hành vi cũ, chỉ khác
      // là nay kết luận đó dựa trên câu trả lời của máy chủ chứ không dựa trên bộ đệm rỗng.
      if (!tiepTuc || !userId) return;
      handle = startCad3DAutosave(userId, bucketId);
    })();

    return () => {
      cancelled = true;
      window.removeEventListener('beforeunload', flush);
      document.removeEventListener('visibilitychange', onHide);
      handle?.dispose();
    };
  }, [bucketId]);
}
