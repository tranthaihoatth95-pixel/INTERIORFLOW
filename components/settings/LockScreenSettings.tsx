'use client';

/**
 * components/settings/LockScreenSettings.tsx — VIỆC 3 UI (04/08, docs/SO-KIEM-TONG.md).
 * Chỉnh số phút tự khoá màn khi không thao tác — mặc định `DEFAULT_LOCK_IDLE_MINUTES` (15),
 * lưu theo user (`lib/lockscreen.ts`, cùng khuôn `interiorflow.galleryView.<userId>` ở
 * lib/resume.ts). Cùng vị trí "Nâng cao" với `ExperienceSettings.tsx` — tính năng thật, chưa có
 * trong bản mẫu pixel (PixelSettingsShell.tsx đã ghi rõ khu này).
 */

import { useEffect, useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { getLastUserId } from '@/lib/resume';
import { DEFAULT_LOCK_IDLE_MINUTES, getLockIdleMinutes, setLockIdleMinutes, lockScreenNow } from '@/lib/lockscreen';
import { WallpaperSettings } from '@/components/wallpaper/WallpaperSettings';
import { useT } from '@/lib/i18n';

export function LockScreenSettings() {
  const tr = useT();
  const userId = useFlowStore((s) => s.user?.id) ?? getLastUserId() ?? '';
  const [minutes, setMinutes] = useState(() => getLockIdleMinutes(userId));

  /**
   * 🔴 D8 (04/09) — CA DUY NHẤT CỦA HỌ BỆNH LÀ **MẤT**, KHÔNG PHẢI **CHẬM**. Tái hiện được
   * trên app thật (`scripts/nghiem-thu-ban-lam-viec/tai-hien-d8.mjs`, hai thế giới lệch đúng
   * một biến), số đọc từ localStorage:
   *
   *   vào THẲNG `/settings` (tab mới/bookmark/F5) → gõ 42 phút → **ô hiện 42**
   *   → đóng hẳn trình duyệt → mở lại → **ô về 15, đĩa `null`**
   *
   * Cơ chế: `useFlowStore.user` không bao giờ được đặt trên route này và `getLastUserId()` đọc
   * localStorage (KHÔNG phản ứng) ⇒ `userId` đứng yên ở `''` suốt vòng đời component; rồi
   * `lib/lockscreen.ts:87` có chốt `if (!userId) return;` ⇒ **không một byte nào xuống đĩa và
   * không một dòng báo nào**. Giao diện nói dối: nó hiện 42 trong khi chưa lưu gì.
   *
   * Chữa gốc nằm ở `lib/danh-tinh-phien.ts` (nay nạp luôn hồ sơ vào store ⇒ component render
   * lại khi định danh tới). Hai việc dưới đây là phần CÒN LẠI mà tầng nguồn không lo hộ được:
   *
   * ① ĐỌC LẠI khi định danh tới. `useState(() => …)` chỉ chạy ở lượt render ĐẦU; định danh tới
   *    sau đó thì con số đã chốt ở mặc định 15 dù đĩa có 42. Deps `[userId]` nên hiệu ứng này
   *    KHÔNG chạy khi người dùng đang gõ (gõ không đổi userId) — không có chuyện đè mất số họ
   *    vừa nhập.
   */
  useEffect(() => {
    if (!userId) return;
    setMinutes(getLockIdleMinutes(userId));
  }, [userId]);

  /**
   * ② KHÔNG NHẬN THAO TÁC KHI CHƯA CÓ ĐỊNH DANH. Ô nhập bị vô hiệu trong cửa sổ đó — thà không
   * cho gõ còn hơn nhận rồi nuốt im lặng, đúng luật §9 "cấm nút giả bấm không ra gì". Cửa sổ này
   * thường chỉ vài chục ms (`/api/auth/me` đã single-flight); nó chỉ kéo dài khi máy chủ thật sự
   * không với tới — và lúc đó vô hiệu là câu trả lời TRUNG THỰC, không phải hỏng.
   */
  const sanSang = !!userId;

  const commit = (n: number) => {
    if (!sanSang) return;
    const clamped = Math.min(180, Math.max(1, Math.round(n)));
    setMinutes(clamped);
    setLockIdleMinutes(userId, clamped);
  };

  return (
    <>
    <section>
      <h2 className="text-[15px] font-semibold text-[var(--t1)]">{tr('Khoá màn', 'Lock screen')}</h2>
      <p className="mt-1 text-[12px] text-[var(--t2)]">
        {tr(
          '⌃⌘Q khoá ngay bất cứ lúc nào, hoặc tự khoá sau bấy nhiêu phút không thao tác.',
          '⌃⌘Q locks instantly, or auto-lock after this many idle minutes.',
        )}
      </p>
      <div className="mt-4 flex items-center gap-3">
        <label className="flex items-center gap-2 text-[13px] text-[var(--t2)]">
          {tr('Tự khoá sau', 'Auto-lock after')}
          <input
            type="number"
            min={1}
            max={180}
            value={minutes}
            onChange={(e) => commit(Number(e.target.value) || DEFAULT_LOCK_IDLE_MINUTES)}
            disabled={!sanSang}
            aria-describedby={sanSang ? undefined : 'lock-idle-cho-dinh-danh'}
            className="w-16 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-2 py-1 text-center text-[13px] text-[var(--t1)] disabled:opacity-[var(--mo-vo-hieu)]"
          />
          {!sanSang && (
            <span id="lock-idle-cho-dinh-danh" className="sr-only">
              {tr('Đang nhận diện tài khoản — chờ một chút rồi chỉnh.', 'Identifying your account — try again in a moment.')}
            </span>
          )}
          {tr('phút', 'minutes')}
        </label>
        <button
          type="button"
          onClick={() => lockScreenNow()}
          className="flex items-center gap-2 rounded-[10px] border border-[var(--border)] px-3 py-2 text-[13px] text-[var(--t2)] transition-colors hover:bg-[var(--hover)]"
        >
          <LockKeyhole size={14} />
          {tr('Khoá ngay', 'Lock now')}
        </button>
      </div>
    </section>

    {/* Phiếu P-O `docs/phieu-giao/P-O-5-bo-hinh-nen-dong.md` việc ⑤ — HÌNH NỀN HỆ THỐNG.
     * 📍 Vì sao đứng ở đây: đây là tệp DUY NHẤT vừa nằm trong vùng ghi của phiếu P-O vừa đã
     * được mount thật (`app/settings/_components/PixelSettingsShell.tsx:218`). Chỗ đúng về
     * nghĩa lâu dài là `AppearanceSettings` — đường may cần dọn, đã khai ở báo cáo ⑦, đừng
     * để phiên sau tưởng là cố ý xếp nhầm. */}
    <WallpaperSettings />
    </>
  );
}
