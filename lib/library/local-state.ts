'use client';

// lib/library/local-state.ts — mô phỏng cơ chế kéo=instantiate / áp=preset / publish=chờ duyệt
// HOÀN TOÀN cục bộ (localStorage), CHƯA đụng Prisma/DB — đúng ràng buộc VIỆC G4.
// Publish KHÔNG tự lên kệ chung — chỉ ghi trạng thái "chờ duyệt" (SPEC-STAGE-LIBRARIES: publish
// = chủ studio duyệt trước khi công khai). Duyệt thật nối backend sau, ngoài phạm vi việc này.

import { useEffect, useState } from 'react';
import type { CommentEntry, PublishDraft } from './types';

const STORAGE_KEY = 'interiorflow.library_g4.local_state_v1';

interface LocalState {
  /** số lần đã "kéo/áp" mỗi item, cộng dồn vào usageCount mock. */
  usageDelta: Record<string, number>;
  pending: PublishDraft[];
  comments: Record<string, CommentEntry[]>;
}

const EMPTY: LocalState = { usageDelta: {}, pending: [], comments: {} };

function readStorage(): LocalState {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<LocalState>;
    return { ...EMPTY, ...parsed };
  } catch {
    return EMPTY;
  }
}

function writeStorage(next: LocalState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // quota/private-mode — bỏ qua, mock không cần bền tuyệt đối
  }
}

/**
 * State khởi tạo LUÔN rỗng (khớp server) rồi nạp localStorage ở effect — tránh hydration
 * mismatch (server không có localStorage, client thì có, hiện chỉ sau mount).
 */
export function useLibraryLocalState() {
  const [state, setState] = useState<LocalState>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(readStorage());
    setHydrated(true);
  }, []);

  const mutate = (fn: (prev: LocalState) => LocalState) => {
    setState((prev) => {
      const next = fn(prev);
      writeStorage(next);
      return next;
    });
  };

  const bumpUsage = (itemId: string) => {
    mutate((prev) => ({
      ...prev,
      usageDelta: { ...prev.usageDelta, [itemId]: (prev.usageDelta[itemId] ?? 0) + 1 },
    }));
  };

  const addPublishDraft = (draft: Omit<PublishDraft, 'id' | 'createdAt' | 'status'>) => {
    const entry: PublishDraft = {
      ...draft,
      id: `pending-${draft.name}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
      status: 'cho_duyet',
    };
    mutate((prev) => ({ ...prev, pending: [entry, ...prev.pending] }));
    return entry;
  };

  const addComment = (itemId: string, text: string) => {
    const entry: CommentEntry = {
      id: `c-${Math.random().toString(36).slice(2, 8)}`,
      author: 'Bạn',
      text,
      createdAt: Date.now(),
    };
    mutate((prev) => ({
      ...prev,
      comments: { ...prev.comments, [itemId]: [...(prev.comments[itemId] ?? []), entry] },
    }));
  };

  return { state, hydrated, bumpUsage, addPublishDraft, addComment };
}
