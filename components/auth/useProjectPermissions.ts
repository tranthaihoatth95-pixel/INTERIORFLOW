'use client';

/**
 * components/auth/useProjectPermissions.ts — hook đọc QUYỀN HIỆU DỤNG trên dự án từ
 * GET /api/auth/permissions, hoà với cache theo (userId, projectId) đúng hợp đồng
 * `lib/auth/permission-cache.ts`: server là sự thật · ngoại tuyến dùng cache có đánh dấu
 * `stale` · server từ chối thì xoá cache ngay. Không bịa quyền khi chưa biết (`unknown`).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useFlowStore } from '@/lib/store';
import {
  reconcilePermission, parseCachedGrant, permissionStorageKey, canLocally,
  type CachedGrant, type PermissionResolution, type ServerAnswer,
} from '@/lib/auth/permission-cache';
import type { Capability, Denial } from '@/lib/auth/roles';
import type { MemberSummary } from '@/lib/auth/authorize';

export interface ProjectPermissions {
  resolution: PermissionResolution;
  members: MemberSummary[];
  /** tiện: quyền theo năng lực — false khi chưa biết */
  can: (cap: Capability) => boolean;
  refresh: () => Promise<void>;
  loading: boolean;
  userId: string | null;
}

function readCache(userId: string, projectId: string): CachedGrant | null {
  try {
    return parseCachedGrant(window.localStorage.getItem(permissionStorageKey(userId, projectId)), userId, projectId);
  } catch {
    return null;
  }
}
function writeCache(userId: string, projectId: string, g: CachedGrant | null) {
  try {
    const k = permissionStorageKey(userId, projectId);
    if (g) window.localStorage.setItem(k, JSON.stringify(g));
    else window.localStorage.removeItem(k);
  } catch {
    /* localStorage bị chặn — cache là tiện ích, không phải sự thật */
  }
}

export function useProjectPermissions(projectId: string | null | undefined): ProjectPermissions {
  const userId = useFlowStore((s) => s.user?.id ?? null);
  const [resolution, setResolution] = useState<PermissionResolution>({ kind: 'unknown', reason: 'loading' });
  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  const refresh = useCallback(async () => {
    if (!projectId || !userId) {
      setResolution({ kind: 'unknown', reason: 'loading' });
      setMembers([]);
      return;
    }
    setLoading(true);
    const cached = readCache(userId, projectId);
    let answer: ServerAnswer;
    let nextMembers: MemberSummary[] | null = null;
    try {
      const r = await fetch(`/api/auth/permissions?projectId=${encodeURIComponent(projectId)}`, { cache: 'no-store' });
      const j = await r.json().catch(() => null);
      if (r.ok && j?.grant) {
        answer = { kind: 'grant', grant: { userId, projectId, role: j.grant.role, storedRole: j.grant.storedRole ?? null, currentStage: j.grant.currentStage, capabilities: j.grant.capabilities ?? [] } };
        nextMembers = Array.isArray(j.members) ? j.members : [];
      } else if (r.status === 503 || !j) {
        answer = { kind: 'unreachable' };
      } else {
        const denial: Denial = j?.denied ? { denied: true, reason: j.reason, capability: j.capability, role: j.role } : { denied: true, reason: 'not-member' };
        answer = { kind: 'denied', denial };
      }
    } catch {
      answer = { kind: 'unreachable' };
    }
    const { resolution: res, nextCache } = reconcilePermission(cached, answer, Date.now());
    writeCache(userId, projectId, nextCache);
    if (!alive.current) return;
    setResolution(res);
    if (nextMembers) setMembers(nextMembers);
    else if (res.kind !== 'grant') setMembers([]);
    setLoading(false);
  }, [projectId, userId]);

  useEffect(() => { void refresh(); }, [refresh]);

  return {
    resolution,
    members,
    can: (cap) => canLocally(resolution, cap),
    refresh,
    loading,
    userId,
  };
}
