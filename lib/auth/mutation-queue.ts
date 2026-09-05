/**
 * lib/auth/mutation-queue.ts — HÀNG ĐỢI MUTATION local-first (THUẦN, dùng ở client).
 *
 * Luật: mất mạng / máy chủ từ chối KHÔNG được lặng lẽ vứt thao tác của người dùng. Mỗi thao
 * tác vào hàng đợi với: `opId` (idempotency — server `applyOp` nhận lại không nhân bản),
 * `actorUserId` (danh tính lúc thao tác — gửi lại bằng phiên khác là KHÁC người, phải từ chối),
 * `projectId`, `kind`, `payload`, và TRẠNG THÁI tường minh:
 *   pending → sending → applied
 *                     ↘ denied   (server 401/403/404: quyền đã mất — giữ lại để người dùng thấy,
 *                                 không tự xoá, không tự thử lại)
 *                     ↘ failed   (mạng/5xx — thử lại được)
 * Serialize được ra localStorage (theo user) — reload vẫn còn hàng đợi.
 */

export type QueuedState = 'pending' | 'sending' | 'applied' | 'denied' | 'failed';

export interface QueuedMutation<P = unknown> {
  opId: string;
  actorUserId: string;
  projectId: string;
  kind: string;
  payload: P;
  createdAt: number;
  state: QueuedState;
  attempts: number;
  /** lý do từ chối/thất bại gần nhất (DenialReason hoặc thông điệp) */
  lastError?: string;
}

export interface MutationQueue {
  items: QueuedMutation[];
}

export function newOpId(prefix = 'op'): string {
  const bytes = new Uint8Array(8);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return `${prefix}:${Date.now().toString(36)}:${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
}

export function emptyQueue(): MutationQueue {
  return { items: [] };
}

/** Thêm vào hàng đợi — cùng opId thì KHÔNG thêm lần hai (idempotent ngay từ client). */
export function enqueue<P>(q: MutationQueue, m: Omit<QueuedMutation<P>, 'state' | 'attempts' | 'createdAt'> & { createdAt?: number }): MutationQueue {
  if (q.items.some((x) => x.opId === m.opId)) return q;
  const item: QueuedMutation<P> = { ...m, createdAt: m.createdAt ?? Date.now(), state: 'pending', attempts: 0 };
  return { items: [...q.items, item as QueuedMutation] };
}

/** Mục kế tiếp cần gửi (pending/failed, theo thứ tự tạo) — chỉ của ĐÚNG người đang đăng nhập. */
export function nextToSend(q: MutationQueue, actorUserId: string): QueuedMutation | null {
  return (
    q.items
      .filter((x) => x.actorUserId === actorUserId && (x.state === 'pending' || x.state === 'failed'))
      .sort((a, b) => a.createdAt - b.createdAt)[0] ?? null
  );
}

function setState(q: MutationQueue, opId: string, patch: Partial<QueuedMutation>): MutationQueue {
  return { items: q.items.map((x) => (x.opId === opId ? { ...x, ...patch } : x)) };
}

export function markSending(q: MutationQueue, opId: string): MutationQueue {
  const cur = q.items.find((x) => x.opId === opId);
  return setState(q, opId, { state: 'sending', attempts: (cur?.attempts ?? 0) + 1 });
}
export function markApplied(q: MutationQueue, opId: string): MutationQueue {
  return setState(q, opId, { state: 'applied', lastError: undefined });
}
export function markDenied(q: MutationQueue, opId: string, reason: string): MutationQueue {
  return setState(q, opId, { state: 'denied', lastError: reason });
}
export function markFailed(q: MutationQueue, opId: string, reason: string): MutationQueue {
  return setState(q, opId, { state: 'failed', lastError: reason });
}

/** Phân loại HTTP status → hành động với mục trong hàng đợi. */
export function classifyResponse(status: number): 'applied' | 'denied' | 'failed' {
  if (status >= 200 && status < 300) return 'applied';
  if (status === 401 || status === 403 || status === 404) return 'denied';
  if (status === 400 || status === 409 || status === 422) return 'denied'; // lỗi nội dung — gửi lại y hệt vẫn sai
  return 'failed';
}

/** Dọn mục đã áp (giữ denied để người dùng còn thấy). */
export function pruneApplied(q: MutationQueue): MutationQueue {
  return { items: q.items.filter((x) => x.state !== 'applied') };
}

/** Mục đang chờ / bị từ chối — cho badge UI. */
export function queueSummary(q: MutationQueue, actorUserId: string): { pending: number; denied: number } {
  let pending = 0;
  let denied = 0;
  for (const x of q.items) {
    if (x.actorUserId !== actorUserId) continue;
    if (x.state === 'pending' || x.state === 'failed' || x.state === 'sending') pending += 1;
    if (x.state === 'denied') denied += 1;
  }
  return { pending, denied };
}

export function serializeQueue(q: MutationQueue): string {
  return JSON.stringify(q);
}
export function parseQueue(raw: string | null | undefined): MutationQueue {
  if (!raw) return emptyQueue();
  try {
    const p = JSON.parse(raw) as MutationQueue;
    if (!p || !Array.isArray(p.items)) return emptyQueue();
    // 'sending' dở dang lúc reload → coi là pending để gửi lại (opId giữ nguyên → server không nhân bản)
    return { items: p.items.map((x) => (x.state === 'sending' ? { ...x, state: 'pending' } : x)) };
  } catch {
    return emptyQueue();
  }
}

export function queueStorageKey(userId: string): string {
  return `if.collab.queue.${userId}`;
}
