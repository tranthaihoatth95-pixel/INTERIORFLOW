'use client';

/**
 * components/dashboard/ProjectMembersPanel.tsx — ACCESS-CONTROL M1: panel "Thành viên dự án"
 * trong tab Nhân sự của Dashboard (đặt TRÊN roster Larkbase — 2 khối tách bạch: đây là quyền
 * nội bộ IF/ProjectMember, roster dưới là mirror Larkbase chỉ-đọc).
 *
 * - Chọn dự án → GET /api/projects/[id]/members (myRole + canManage + members).
 * - Chỉ owner (canManage) thấy nút thêm/xoá/đổi vai — server vẫn là chốt chặn thật.
 */

import { useCallback, useEffect, useState } from 'react';
import { Loader2, ShieldCheck, Trash2, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

const ROLE_OPTIONS = ['owner', 'crea', 'drafter', 'bim', 'viewer'] as const;
const ROLE_LABELS: Record<(typeof ROLE_OPTIONS)[number], string> = {
  owner: 'Owner · Chủ dự án',
  crea: 'CREA · Sáng tạo',
  drafter: 'Drafter · Hoạ viên',
  bim: 'BIM · Triển khai',
  viewer: 'Viewer · Chỉ xem',
};

interface MemberRow {
  userId: string;
  name: string;
  role: string;
  joinedAt: string;
}
interface MembersData {
  myRole: string;
  canManage: boolean;
  currentStage: string;
  stageLocked: boolean;
  members: MemberRow[];
}

export function ProjectMembersPanel({ projects, teamUsers }: {
  projects: { id: string; name: string }[];
  teamUsers: { id: string; name: string }[];
}) {
  const [projectId, setProjectId] = useState<string>(projects[0]?.id ?? '');
  const [data, setData] = useState<MembersData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [addUserId, setAddUserId] = useState('');
  const [addRole, setAddRole] = useState<string>('viewer');

  const load = useCallback(() => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/projects/${projectId}/members`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => null))?.error ?? String(r.status));
        return r.json();
      })
      .then((d: MembersData) => setData(d))
      .catch((e: Error) => {
        setData(null);
        setError(e.message === '404' ? 'Bạn không phải thành viên dự án này.' : e.message);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const call = useCallback(
    async (init: RequestInit & { qs?: string }) => {
      setBusy(true);
      setError(null);
      try {
        const r = await fetch(`/api/projects/${projectId}/members${init.qs ?? ''}`, init);
        if (!r.ok) setError((await r.json().catch(() => null))?.error ?? `Lỗi ${r.status}`);
        load();
      } finally {
        setBusy(false);
      }
    },
    [projectId, load],
  );

  const addable = teamUsers.filter((u) => !data?.members.some((m) => m.userId === u.id));

  if (projects.length === 0) {
    return (
      <p className="mb-4 rounded-[14px] border border-dashed border-[var(--border)] p-4 text-center text-sm text-[var(--t4)]">
        Chưa có dự án nào — tạo dự án trước để quản lý thành viên.
      </p>
    );
  }

  return (
    <section className="mb-5">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-[var(--t2)]">
          <ShieldCheck size={14} className="text-[var(--accent)]" /> Thành viên dự án · Quyền IF
        </h3>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="rounded-[8px] border border-[var(--border)] bg-[var(--field)] px-2 py-1 text-[11px] text-[var(--t1)]"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {data && (
          <span className="rounded-full bg-[var(--hover)] px-2 py-0.5 text-[10px] text-[var(--t3)]">
            vai của bạn: {ROLE_LABELS[data.myRole as keyof typeof ROLE_LABELS] ?? data.myRole} · chặng: {data.currentStage}
            {data.stageLocked ? ' · đã qua GATE' : ''}
          </span>
        )}
      </div>

      {error && (
        <p className="mb-2 rounded-[10px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>
      )}

      {loading && !data ? (
        <div className="grid h-20 place-items-center text-[var(--t4)]">
          <Loader2 size={18} className="animate-spin" />
        </div>
      ) : data ? (
        <div className="mat-card divide-y divide-[var(--border)] overflow-hidden rounded-[16px] border border-[var(--mat-hairline)]">
          {data.members.map((m) => (
            <div key={m.userId} className="flex items-center gap-3 px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-[var(--t1)]">{m.name}</div>
                <div className="truncate text-[11px] text-[var(--t4)]">
                  vào {new Date(m.joinedAt).toLocaleDateString('vi-VN')}
                </div>
              </div>
              {data.canManage ? (
                <>
                  <select
                    value={m.role}
                    disabled={busy}
                    onChange={(e) =>
                      call({
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: m.userId, role: e.target.value }),
                      })
                    }
                    className="rounded-[8px] border border-[var(--border)] bg-[var(--field)] px-1.5 py-1 text-[11px] text-[var(--t1)]"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={busy}
                    title="Gỡ khỏi dự án"
                    onClick={() => call({ method: 'DELETE', qs: `?userId=${m.userId}` })}
                    className="grid h-7 w-7 place-items-center rounded-[8px] border border-[var(--border)] text-[var(--t4)] hover:bg-[var(--hover)] hover:text-red-400 disabled:opacity-50"
                  >
                    <Trash2 size={12} />
                  </button>
                </>
              ) : (
                <span className="shrink-0 rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] text-[var(--accent)]">
                  {ROLE_LABELS[m.role as keyof typeof ROLE_LABELS] ?? m.role}
                </span>
              )}
            </div>
          ))}

          {data.canManage && (
            <div className="flex flex-wrap items-center gap-1.5 px-4 py-2.5">
              <UserPlus size={13} className="text-[var(--t4)]" />
              <select
                value={addUserId}
                onChange={(e) => setAddUserId(e.target.value)}
                className="rounded-[8px] border border-[var(--border)] bg-[var(--field)] px-1.5 py-1 text-[11px] text-[var(--t1)]"
              >
                <option value="">Thêm thành viên…</option>
                {addable.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
              <select
                value={addRole}
                onChange={(e) => setAddRole(e.target.value)}
                className="rounded-[8px] border border-[var(--border)] bg-[var(--field)] px-1.5 py-1 text-[11px] text-[var(--t1)]"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
              <button
                type="button"
                disabled={!addUserId || busy}
                onClick={() =>
                  call({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: addUserId, role: addRole }),
                  }).then(() => setAddUserId(''))
                }
                className={cn(
                  'rounded-[8px] bg-[var(--accent-strong)] px-2.5 py-1 text-[11px] font-medium text-white disabled:opacity-50',
                )}
              >
                {busy ? <Loader2 size={11} className="animate-spin" /> : 'Thêm'}
              </button>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
