'use client';

/**
 * components/auth/useCollabQueue.ts — HÀNG ĐỢI MUTATION local-first (vỏ React cho
 * `lib/auth/mutation-queue.ts`). Mỗi thao tác cộng tác (góp ý · duyệt · giao việc) đi qua đây:
 * sinh opId + gắn danh tính → gửi → 2xx applied · 401/403/404/400 denied (GIỮ, không vứt, không
 * tự thử lại) · mạng/5xx failed (thử lại khi online / bấm "Gửi lại"). Lưu localStorage theo user.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useFlowStore } from '@/lib/store';
import {
  classifyResponse, emptyQueue, enqueue, markApplied, markDenied, markFailed, markSending, newOpId,
  nextToSend, parseQueue, pruneApplied, queueStorageKey, queueSummary, serializeQueue,
  type MutationQueue, type QueuedMutation,
} from '@/lib/auth/mutation-queue';

export interface CollabMutation {
  kind: string;
  projectId: string;
  method: 'POST' | 'PATCH' | 'DELETE';
  url: string;
  /** body JSON — opId được chèn thêm tự động */
  body?: Record<string, unknown>;
}

export interface CollabQueueApi {
  /** gửi ngay; mất mạng thì nằm chờ. Trả kết quả lượt gửi đầu (null = chưa gửi được). */
  submit: (m: CollabMutation) => Promise<{ status: number; json: unknown } | null>;
  flush: () => Promise<void>;
  summary: { pending: number; denied: number };
  items: QueuedMutation[];
  dismissDenied: (opId: string) => void;
}

export function useCollabQueue(): CollabQueueApi {
  const userId = useFlowStore((s) => s.user?.id ?? null);
  const [queue, setQueue] = useState<MutationQueue>(emptyQueue());
  const qRef = useRef(queue);
  qRef.current = queue;
  const flushing = useRef(false);

  // nạp từ localStorage theo user
  useEffect(() => {
    if (!userId) { setQueue(emptyQueue()); return; }
    try { setQueue(parseQueue(window.localStorage.getItem(queueStorageKey(userId)))); } catch { setQueue(emptyQueue()); }
  }, [userId]);

  const persist = useCallback((q: MutationQueue) => {
    qRef.current = q;
    setQueue(q);
    if (!userId) return;
    try { window.localStorage.setItem(queueStorageKey(userId), serializeQueue(pruneApplied(q))); } catch { /* tiện ích */ }
  }, [userId]);

  const sendOne = useCallback(async (item: QueuedMutation): Promise<{ status: number; json: unknown } | null> => {
    const p = item.payload as CollabMutation;
    persist(markSending(qRef.current, item.opId));
    let status = 0;
    let json: unknown = null;
    try {
      const r = await fetch(p.url, {
        method: p.method,
        headers: { 'Content-Type': 'application/json' },
        body: p.method === 'DELETE' ? undefined : JSON.stringify({ ...(p.body ?? {}), opId: item.opId }),
        cache: 'no-store',
      });
      status = r.status;
      json = await r.json().catch(() => null);
    } catch {
      status = 0;
    }
    const cls = classifyResponse(status);
    if (cls === 'applied') persist(markApplied(qRef.current, item.opId));
    else if (cls === 'denied') persist(markDenied(qRef.current, item.opId, String((json as { reason?: string; error?: string } | null)?.reason ?? (json as { error?: string } | null)?.error ?? status)));
    else persist(markFailed(qRef.current, item.opId, status ? `HTTP ${status}` : 'offline'));
    return status ? { status, json } : null;
  }, [persist]);

  const flush = useCallback(async () => {
    if (!userId || flushing.current) return;
    flushing.current = true;
    try {
      let next = nextToSend(qRef.current, userId);
      let guard = 0;
      while (next && guard++ < 50) {
        const r = await sendOne(next);
        if (!r) break; // offline — dừng, giữ hàng đợi
        next = nextToSend(qRef.current, userId);
      }
    } finally {
      flushing.current = false;
    }
  }, [userId, sendOne]);

  useEffect(() => {
    const on = () => { void flush(); };
    window.addEventListener('online', on);
    return () => window.removeEventListener('online', on);
  }, [flush]);

  const submit = useCallback(async (m: CollabMutation) => {
    if (!userId) return null;
    const opId = newOpId(m.kind);
    // DELETE mang opId trên query — server đọc `?opId=`
    const url = m.method === 'DELETE' ? `${m.url}${m.url.includes('?') ? '&' : '?'}opId=${encodeURIComponent(opId)}` : m.url;
    persist(enqueue(qRef.current, { opId, actorUserId: userId, projectId: m.projectId, kind: m.kind, payload: { ...m, url } }));
    const item = qRef.current.items.find((x) => x.opId === opId)!;
    return sendOne(item);
  }, [userId, persist, sendOne]);

  const dismissDenied = useCallback((opId: string) => {
    persist({ items: qRef.current.items.filter((x) => x.opId !== opId) });
  }, [persist]);

  return { submit, flush, summary: queueSummary(queue, userId ?? ''), items: queue.items, dismissDenied };
}
