'use client';

/**
 * components/settings/LockScreenSettings.tsx — VIỆC 3 UI (04/08, docs/SO-KIEM-TONG.md).
 * Chỉnh số phút tự khoá màn khi không thao tác — mặc định `DEFAULT_LOCK_IDLE_MINUTES` (15),
 * lưu theo user (`lib/lockscreen.ts`, cùng khuôn `interiorflow.galleryView.<userId>` ở
 * lib/resume.ts). Cùng vị trí "Nâng cao" với `ExperienceSettings.tsx` — tính năng thật, chưa có
 * trong bản mẫu pixel (PixelSettingsShell.tsx đã ghi rõ khu này).
 */

import { useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { getLastUserId } from '@/lib/resume';
import {
  LOCK_IDLE_CHOICES,
  type LockIdleChoice,
  getLockIdleChoice,
  setLockIdleChoice,
  lockScreenNow,
} from '@/lib/lockscreen';
import { WallpaperSettings } from '@/components/wallpaper/WallpaperSettings';
import { useT } from '@/lib/i18n';

export function LockScreenSettings() {
  const tr = useT();
  const userId = useFlowStore((s) => s.user?.id) ?? getLastUserId() ?? '';
  const [choice, setChoice] = useState<LockIdleChoice>(() => getLockIdleChoice(userId));

  /** Lane K (22/08): NẤC chọn sẵn thay ô nhập số tự do — 5/15/30/60/Không bao giờ. Ô số tự do
   * bắt người dùng nghĩ ra một con số cho việc họ không có ý kiến, và mở cửa cho giá trị vô
   * nghĩa (1 phút = khoá giữa lúc đang ngắm bản vẽ). */
  const commit = (n: LockIdleChoice) => {
    setChoice(n);
    setLockIdleChoice(userId, n);
  };

  const nhan = (n: LockIdleChoice) =>
    n === 0 ? tr('Không bao giờ', 'Never') : tr(`${n} phút`, `${n} min`);

  return (
    <>
    <section>
      <h2 className="text-[15px] font-semibold text-[var(--t1)]">{tr('Khoá màn', 'Lock screen')}</h2>
      <p className="mt-1 text-[12px] text-[var(--t2)]">
        {tr(
          'Khoá giữ nguyên việc đang làm — dự án, chặng, góc nhìn, và cả bản render đang chạy. Mở lại là về đúng chỗ cũ.',
          'Locking keeps your work as-is — project, stage, viewport, and any render still running. Resuming returns you to the same place.',
        )}
      </p>
      <div className="mt-4">
        <div className="text-[12px] text-[var(--t2)]">{tr('Tự khoá sau', 'Auto-lock after')}</div>
        <div className="mt-2 inline-flex flex-wrap gap-1 rounded-[var(--r-full,999px)] p-1" style={{ background: 'var(--field)', border: '1px solid var(--border)' }}>
          {LOCK_IDLE_CHOICES.map((n) => {
            const dangChon = n === choice;
            return (
              <button
                key={n}
                type="button"
                aria-pressed={dangChon}
                onClick={() => commit(n)}
                className="rounded-[var(--r-full,999px)] px-3 py-1.5 text-[12px] transition-colors"
                style={
                  dangChon
                    ? { background: 'var(--accent)', color: '#fff' }
                    : { color: 'var(--t2)' }
                }
              >
                {nhan(n)}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => lockScreenNow('tay')}
          className="flex items-center gap-2 rounded-[10px] border border-[var(--border)] px-3 py-2 text-[13px] text-[var(--t2)] transition-colors hover:bg-[var(--hover)]"
        >
          <LockKeyhole size={14} />
          {tr('Khoá ngay', 'Lock now')}
        </button>
        {/* Phím tắt hiện NGAY CẠNH lệnh — dạy phím tại chỗ dùng, không bắt đi tra bảng.
         * Nguồn phím là sổ lệnh chung (`app.lock`), chỗ này chỉ hiển thị. */}
        <kbd className="rounded-[6px] px-2 py-1 text-[11px] text-[var(--t3)]" style={{ border: '1px solid var(--border)' }}>
          {tr('⌘⇧L · Ctrl⇧L', '⌘⇧L · Ctrl⇧L')}
        </kbd>
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
