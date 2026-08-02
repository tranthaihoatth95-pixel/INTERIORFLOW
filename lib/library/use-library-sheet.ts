'use client';

/**
 * lib/library/use-library-sheet.ts — MỘT cửa vào duy nhất cho Thư viện sheet.
 *
 * `docs/SPEC-NAVIGATION-MODEL.md` §1 ghi bệnh "nhiều lối vào khác nhau cho cùng 1 thứ". Nên mọi
 * nơi muốn mở Thư viện (nút "Thư viện" ở Navigator mọi chặng · ô Vật liệu trong Inspector · phím
 * tắt L) đều gọi CÙNG 1 hàm `openLibrarySheet()` — KHÔNG ai tự dựng sheet riêng, không truyền
 * prop xuyên nhiều tầng.
 *
 * Dùng CustomEvent trên `window` thay vì context provider: sheet sống trong `StageShell`
 * (`components/studio/*` — NGOÀI vùng code G4), nên bên gọi và bên nghe không chung cây React.
 * Cùng cơ chế `cad:*-request` app đã dùng sẵn (xem ghi chú trong `AppChrome.tsx`).
 */

import { useEffect, useState } from 'react';
import type { StageKey } from './types';

const OPEN_EVENT = 'if:library-open';

export interface OpenLibraryDetail {
  /** Mở thẳng vào 1 kệ (vd ô Vật liệu trong Inspector mở kệ "Vật liệu"). */
  shelfId?: string;
  /** Ép chặng — bỏ trống thì sheet dùng chặng đang mở. */
  stage?: StageKey;
}

/** Mở Thư viện từ bất kỳ đâu (nút Navigator · ô Vật liệu Inspector · phím tắt). */
export function openLibrarySheet(detail: OpenLibraryDetail = {}): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<OpenLibraryDetail>(OPEN_EVENT, { detail }));
}

/**
 * Trạng thái đóng/mở của sheet + phím tắt.
 * - `L` mở/đóng (khớp mock: `if(k==='l')`), CHỈ khi không đang gõ trong ô nhập.
 * - `Escape` đóng — nghe ở pha bắt (capture) để ô tìm kiếm bên trong sheet không nuốt mất phím.
 */
export function useLibrarySheetState() {
  const [open, setOpen] = useState(false);
  const [shelfId, setShelfId] = useState<string | null>(null);
  const [stageOverride, setStageOverride] = useState<StageKey | null>(null);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent<OpenLibraryDetail>).detail ?? {};
      setShelfId(d.shelfId ?? null);
      setStageOverride(d.stage ?? null);
      setOpen(true);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
      if (e.key === 'Escape') {
        // Không chặn Escape của lớp khác khi sheet đang đóng.
        setOpen((cur) => {
          if (cur) e.stopPropagation();
          return false;
        });
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.toLowerCase() === 'l') setOpen((o) => !o);
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, []);

  return { open, setOpen, shelfId, setShelfId, stageOverride };
}
