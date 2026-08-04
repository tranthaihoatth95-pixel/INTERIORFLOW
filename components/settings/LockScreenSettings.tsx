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
import { DEFAULT_LOCK_IDLE_MINUTES, getLockIdleMinutes, setLockIdleMinutes, lockScreenNow } from '@/lib/lockscreen';
import { useT } from '@/lib/i18n';

export function LockScreenSettings() {
  const tr = useT();
  const userId = useFlowStore((s) => s.user?.id) ?? getLastUserId() ?? '';
  const [minutes, setMinutes] = useState(() => getLockIdleMinutes(userId));

  const commit = (n: number) => {
    const clamped = Math.min(180, Math.max(1, Math.round(n)));
    setMinutes(clamped);
    setLockIdleMinutes(userId, clamped);
  };

  return (
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
            className="w-16 rounded-[8px] border border-[var(--border)] bg-[var(--field)] px-2 py-1 text-center text-[13px] text-[var(--t1)] outline-none"
          />
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
  );
}
