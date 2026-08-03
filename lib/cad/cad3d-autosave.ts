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
import { startCad3DAutosave, getLastUserId } from './cad3d-autosave-core';

export function useCad3DAutosave(): void {
  const bucketId = useSheetsBucketId();

  useEffect(() => {
    const userId = getLastUserId();
    const handle = startCad3DAutosave(userId ?? '', bucketId);

    const onHide = () => {
      if (document.visibilityState === 'hidden') handle.flushNow();
    };
    window.addEventListener('beforeunload', handle.flushNow);
    document.addEventListener('visibilitychange', onHide);

    return () => {
      window.removeEventListener('beforeunload', handle.flushNow);
      document.removeEventListener('visibilitychange', onHide);
      handle.dispose();
    };
  }, [bucketId]);
}
