/**
 * lib/auth/permission-cache.ts — CACHE QUYỀN Ở CLIENT + hành vi NGOẠI TUYẾN / THU HỒI (THUẦN).
 *
 * Hợp đồng (test khoá, `permission-cache.test.ts`):
 *  1. Nguồn sự thật là SERVER. Cache chỉ là bản chụp có `fetchedAt`, theo (userId, projectId).
 *  2. NGOẠI TUYẾN (fetch lỗi mạng / 503): dùng cache nếu còn trong `OFFLINE_GRACE_MS`, đánh dấu
 *     `source:'cache'` + `stale:true` — UI PHẢI hiện "đang dùng quyền đã lưu". Local-first: đọc/
 *     soạn tiếp được, nhưng mọi mutation vào hàng đợi (mutation-queue) chờ server xác nhận.
 *  3. TỪ CHỐI TỪ SERVER (401/403/404 = anonymous/stale/insufficient/not-member/revoked): XOÁ
 *     cache ngay, trả `denied`. Quyền thu hồi được biết ở lần đồng bộ kế tiếp — không có cửa
 *     "cache nói còn quyền thì cứ ghi": mọi ghi vẫn đi qua server, server từ chối thì mục hàng
 *     đợi thành `denied`, không mất, không giả thành công.
 *  4. Cache quá `MAX_AGE_MS` dù ngoại tuyến cũng KHÔNG dùng — hết hạn thì coi như chưa biết.
 */

import type { Capability, CollabRole, Denial } from './roles';
import { can } from './roles';

export const OFFLINE_GRACE_MS = 24 * 60 * 60 * 1000; // 1 ngày
export const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 ngày — trần tuyệt đối

export interface CachedGrant {
  userId: string;
  projectId: string;
  role: CollabRole;
  storedRole: string | null;
  currentStage: string;
  capabilities: Capability[];
  fetchedAt: number;
}

export type PermissionResolution =
  | { kind: 'grant'; grant: CachedGrant; source: 'server' | 'cache'; stale: boolean }
  | { kind: 'denied'; denial: Denial; source: 'server' }
  | { kind: 'unknown'; reason: 'offline-no-cache' | 'cache-expired' | 'loading' };

export type ServerAnswer =
  | { kind: 'grant'; grant: Omit<CachedGrant, 'fetchedAt'> }
  | { kind: 'denied'; denial: Denial }
  | { kind: 'unreachable' };

/** Hợp nhất câu trả lời server với cache — trả về resolution + cache mới (null = xoá). */
export function reconcilePermission(
  cached: CachedGrant | null,
  answer: ServerAnswer,
  now: number,
): { resolution: PermissionResolution; nextCache: CachedGrant | null } {
  if (answer.kind === 'grant') {
    const grant = { ...answer.grant, fetchedAt: now };
    return { resolution: { kind: 'grant', grant, source: 'server', stale: false }, nextCache: grant };
  }
  if (answer.kind === 'denied') {
    // thu hồi/không đủ quyền/không member: xoá cache — không giữ bản chụp còn "quyền"
    return { resolution: { kind: 'denied', denial: answer.denial, source: 'server' }, nextCache: null };
  }
  // unreachable
  if (!cached) return { resolution: { kind: 'unknown', reason: 'offline-no-cache' }, nextCache: null };
  const age = now - cached.fetchedAt;
  if (age > MAX_AGE_MS || age > OFFLINE_GRACE_MS) {
    return { resolution: { kind: 'unknown', reason: 'cache-expired' }, nextCache: age > MAX_AGE_MS ? null : cached };
  }
  return { resolution: { kind: 'grant', grant: cached, source: 'cache', stale: true }, nextCache: cached };
}

/** Client được phép BẤM thao tác không? — chỉ khi có grant (server hoặc cache còn hạn). */
export function canLocally(res: PermissionResolution, cap: Capability): boolean {
  return res.kind === 'grant' && can(res.grant.role, cap);
}

export function permissionStorageKey(userId: string, projectId: string): string {
  return `if.collab.perm.${userId}.${projectId}`;
}

export function parseCachedGrant(raw: string | null | undefined, userId: string, projectId: string): CachedGrant | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as CachedGrant;
    if (!p || p.userId !== userId || p.projectId !== projectId || typeof p.fetchedAt !== 'number') return null;
    if (!Array.isArray(p.capabilities) || typeof p.role !== 'string') return null;
    return p;
  } catch {
    return null;
  }
}
