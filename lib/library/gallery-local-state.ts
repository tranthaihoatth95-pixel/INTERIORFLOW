'use client';

/**
 * lib/library/gallery-local-state.ts — "Đề xuất nguồn mới" cho Gallery liên ngành, HOÀN TOÀN cục
 * bộ (localStorage), cùng khuôn `lib/library/local-state.ts` (publish draft = "chờ duyệt" cục bộ,
 * chưa đụng Prisma/DB — đúng ràng buộc vùng file của phiếu `gallery-lien-nganh`: KHÔNG prisma,
 * KHÔNG cột DB mới, KHÔNG sửa `app/api/**`).
 *
 * Vì sao cần: VIỆC 4 của phiếu đòi "mọi ô nhập URL trong vùng library từ chối domain pinterest" —
 * Gallery hiện chưa có ô nhập URL nào (đã grep trước khi làm, xem báo cáo). Ô "Đề xuất nguồn mới"
 * ở đây là nơi DUY NHẤT một người xem Gallery gợi ý thêm một nguồn sạch (không phải upload ảnh) —
 * qua cửa NÀY, `checkGallerySourceUrl` (gallery-source-guard.ts) chặn Pinterest thật, không phải
 * chặn trang trí. Danh sách chỉ SỐNG TRONG máy người xem — KHÔNG ghi vào kho chung `LibraryAsset`
 * (việc đó cần API mới, ngoài vùng file được giao).
 */

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'interiorflow.gallery_lien_nganh.local_state_v1';

export interface SourceSuggestion {
  id: string;
  url: string;
  note: string;
  createdAt: number;
}

interface LocalState {
  suggestions: SourceSuggestion[];
}

const EMPTY: LocalState = { suggestions: [] };

function readStorage(): LocalState {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<LocalState>;
    return { ...EMPTY, ...parsed, suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [] };
  } catch {
    return EMPTY;
  }
}

function writeStorage(next: LocalState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // quota/private-mode — bỏ qua, danh sách cục bộ không cần bền tuyệt đối
  }
}

export function useGalleryLocalState() {
  const [state, setState] = useState<LocalState>(EMPTY);

  useEffect(() => {
    setState(readStorage());
  }, []);

  const mutate = useCallback((fn: (prev: LocalState) => LocalState) => {
    setState((prev) => {
      const next = fn(prev);
      writeStorage(next);
      return next;
    });
  }, []);

  /** Thêm 1 đề xuất — gọi SAU KHI `checkGallerySourceUrl(url).ok` đã đúng (nơi gọi tự kiểm, hàm
   * này không kiểm lại để tránh 2 nguồn sự thật). */
  const addSuggestion = useCallback(
    (url: string, note: string) => {
      const entry: SourceSuggestion = {
        id: `src-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        url,
        note,
        createdAt: Date.now(),
      };
      mutate((prev) => ({ ...prev, suggestions: [entry, ...prev.suggestions] }));
      return entry;
    },
    [mutate],
  );

  const removeSuggestion = useCallback(
    (id: string) => {
      mutate((prev) => ({ ...prev, suggestions: prev.suggestions.filter((s) => s.id !== id) }));
    },
    [mutate],
  );

  return { suggestions: state.suggestions, addSuggestion, removeSuggestion };
}
