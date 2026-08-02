'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { LibraryShell } from '@/components/library/LibraryShell';
import { LibrarySheet } from '@/components/library/LibrarySheet';
import { openLibrarySheet } from '@/lib/library/use-library-sheet';
import type { StageKey } from '@/lib/library/types';

/**
 * `/library` = Master Library dạng TRANG (kho đầy đủ). Thư viện dạng SHEET trượt lên là cửa dùng
 * NHANH trong lúc làm việc — chỗ ở thật của nó là `StageShell` (mọi chặng), NGOÀI vùng code G4.
 * Mount ở đây để chạy/nghiệm thu được thật; `?stage=cad|render|present` đổi kệ theo chặng.
 * Xem `docs/BAO-CAO-G4-LIB.md` cho 1 dòng CHINH cần thêm vào StageShell.
 */
function LibraryPageInner() {
  const params = useSearchParams();
  const raw = params.get('stage');
  const stage: StageKey = raw === 'cad' || raw === 'present' ? raw : 'render';

  return (
    <>
      <LibraryShell />
      <LibrarySheet stage={stage} />
      <button
        type="button"
        onClick={() => openLibrarySheet()}
        className="fixed bottom-5 right-5 z-10 flex h-10 items-center gap-2 rounded-full bg-[var(--accent)] px-4 text-[12.5px] font-semibold text-white shadow-[var(--shadow-pop)] transition-colors hover:bg-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
      >
        Thư viện <kbd className="rounded bg-white/20 px-1.5 py-0.5 text-[10px]">L</kbd>
      </button>
    </>
  );
}

export default function LibraryPage() {
  return (
    <Suspense>
      <LibraryPageInner />
    </Suspense>
  );
}
