'use client';

/**
 * lib/gu/inspiration-store.ts — trạng thái CỤC BỘ (localStorage) của bề mặt Cảm hứng, cùng khuôn
 * `lib/library/gallery-local-state.ts`: KHÔNG bảng DB mới, KHÔNG route mới.
 *
 * Giữ hai thứ thuộc "MÁY MÌNH" theo luật lưu chung↔máy (16/08):
 *   · bản đọc ảnh (`ImageIntelligenceSummary`, không mask) theo imgId — để mở lại không phải đọc
 *     lại từ đầu; VẬT (ảnh) và KẾT QUẢ ÁP (Thẻ DNA) vẫn ở kho chung.
 *   · nhật ký intent đã áp kèm bản `before` của Thẻ DNA — cửa "Hoàn tác" (KS4). Bản before nằm
 *     đây là tạm thời; PUT lại lên `/api/projects/:id/dna` là thao tác lùi thật.
 *   · dự án đang chọn (tiện, không bắt chọn lại mỗi lần mở).
 */

import { useCallback, useEffect, useState } from 'react';
import type { DesignDnaCard, DnaLayerKey } from '../dna/types';
import type { ImageIntelligenceSummary } from '../smartselect/image-intelligence';

const STORAGE_KEY = 'interiorflow.inspiration.local_state_v1';
/** Không giữ quá nhiều bản đọc — mỗi bản ~2KB, localStorage có trần. */
const MAX_ANALYSES = 200;
const MAX_INTENTS = 50;

export interface IntentLogEntry {
  id: string;
  imgId: string;
  assetName: string;
  projectId: string;
  cardId: string;
  cardName: string;
  before: DesignDnaCard;
  appliedAt: string;
  layers: DnaLayerKey[];
}

interface LocalState {
  analyses: Record<string, { at: string; summary: ImageIntelligenceSummary }>;
  intents: IntentLogEntry[];
  projectId: string | null;
}

const EMPTY: LocalState = { analyses: {}, intents: [], projectId: null };

function read(): LocalState {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const p = JSON.parse(raw) as Partial<LocalState>;
    return {
      analyses: p.analyses && typeof p.analyses === 'object' ? p.analyses : {},
      intents: Array.isArray(p.intents) ? p.intents : [],
      projectId: typeof p.projectId === 'string' ? p.projectId : null,
    };
  } catch {
    return EMPTY;
  }
}

function write(next: LocalState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // quota / private mode — bản đọc lại được, không cần bền tuyệt đối
  }
}

/** Cắt bớt bản đọc cũ nhất khi vượt trần (thuần — test được nếu cần). */
export function pruneAnalyses(a: LocalState['analyses'], max = MAX_ANALYSES): LocalState['analyses'] {
  const keys = Object.keys(a);
  if (keys.length <= max) return a;
  keys.sort((x, y) => (a[x].at < a[y].at ? -1 : 1));
  const out: LocalState['analyses'] = {};
  for (const k of keys.slice(keys.length - max)) out[k] = a[k];
  return out;
}

export function useInspirationLocal() {
  const [state, setState] = useState<LocalState>(EMPTY);

  useEffect(() => {
    setState(read());
  }, []);

  const update = useCallback((fn: (s: LocalState) => LocalState) => {
    setState((cur) => {
      const next = fn(cur);
      write(next);
      return next;
    });
  }, []);

  const saveAnalysis = useCallback(
    (imgId: string, summary: ImageIntelligenceSummary) =>
      update((s) => ({
        ...s,
        analyses: pruneAnalyses({ ...s.analyses, [imgId]: { at: new Date().toISOString(), summary } }),
      })),
    [update],
  );

  const addIntent = useCallback(
    (entry: IntentLogEntry) => update((s) => ({ ...s, intents: [entry, ...s.intents].slice(0, MAX_INTENTS) })),
    [update],
  );

  const removeIntent = useCallback(
    (id: string) => update((s) => ({ ...s, intents: s.intents.filter((i) => i.id !== id) })),
    [update],
  );

  const setProjectId = useCallback((projectId: string | null) => update((s) => ({ ...s, projectId })), [update]);

  return {
    analyses: state.analyses,
    intents: state.intents,
    projectId: state.projectId,
    saveAnalysis,
    addIntent,
    removeIntent,
    setProjectId,
  };
}
