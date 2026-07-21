'use client';

/**
 * components/dashboard/LarkPanels.tsx — 3 tab Larkbase trong panel "Chi tiết" (Dashboard.tsx
 * overlay đã có sẵn): Bảng · Kanban · Nhân sự (docs/RESEARCH-HOME-GALLERY-DASHBOARD.md §2.2(c)
 * /(d), §5.1 quyết định 4 — kanban là 1 tab TRONG đây, KHÔNG phải chế độ Gallery riêng).
 *
 * CHỈ ĐỌC — không có thao tác nào ghi ngược Larkbase (kéo-thả kanban KHÔNG đổi trạng thái,
 * §5.1 quyết định 2). Duy nhất "Gán tài khoản IF" ghi vào Prisma nội bộ (LarkUserMap), không
 * đụng Larkbase.
 */

import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Link2, Loader2, RefreshCw, UserPlus } from 'lucide-react';
import { sortTaskRows, computeProgressByCode, type SortKey } from '@/lib/lark/task-utils';
import { cn } from '@/lib/utils';

export interface LarkTaskRow {
  id: string;
  larkRecordId: string;
  task: string;
  larkProjectName: string;
  larkProjectCode: string | null;
  ownerAccount: string | null;
  status: string;
  deadline: string | null;
  daysLeft: number | null;
  warningLabel: string | null;
  syncedAt: string;
}
export interface LarkPersonRow {
  larkAccount: string;
  fullName: string;
  title: string | null;
  department: string | null;
  isCrea: boolean;
}
export interface LarkUserMapRow {
  larkAccount: string;
  userId: string;
}
export interface LarkData {
  tasks: LarkTaskRow[];
  persons: LarkPersonRow[];
  userMap: LarkUserMapRow[];
  distinctCodes: { code: string; name: string }[];
  lastSyncedAt: string | null;
}

export function useLarkData(enabled: boolean) {
  const [data, setData] = useState<LarkData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch('/api/lark-tasks')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: LarkData) => setData(d))
      .catch(() => setError('Không tải được dữ liệu Larkbase (đã đồng bộ chưa?).'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (enabled) reload();
  }, [enabled, reload]);

  return { data, loading, error, reload };
}

const STATUS_COLS = ['Đang làm', 'Hoàn thành', 'Ghi nhận'] as const;

function OwnerLabel({ row, persons, userMap, teamById }: {
  row: LarkTaskRow;
  persons: LarkPersonRow[];
  userMap: LarkUserMapRow[];
  teamById: Map<string, string>;
}) {
  if (!row.ownerAccount) return <span className="text-[var(--t4)]">—</span>;
  const map = userMap.find((m) => m.larkAccount === row.ownerAccount);
  const ifName = map ? teamById.get(map.userId) : null;
  const person = persons.find((p) => p.larkAccount === row.ownerAccount);
  return (
    <span title={person?.title ? `${person.title}${person.department ? ' · ' + person.department : ''}` : undefined}>
      {ifName ?? person?.fullName ?? row.ownerAccount}
    </span>
  );
}

/* ---------- Tab "Bảng" — bảng phẳng sort được, mặc định Deadline gần nhất trước ---------- */

export function LarkBoardTab({ data, filterCode, persons, userMap, teamById }: {
  data: LarkData;
  filterCode: string | null;
  persons: LarkPersonRow[];
  userMap: LarkUserMapRow[];
  teamById: Map<string, string>;
}) {
  const [sortKey, setSortKey] = useState<SortKey>('deadline');
  const [dir, setDir] = useState<1 | -1>(1);

  const rows = filterCode ? data.tasks.filter((t) => t.larkProjectCode === filterCode) : data.tasks;
  const sorted = sortTaskRows(rows, sortKey, dir);
  const progress = computeProgressByCode(data.tasks);
  const seenCode = new Set<string>();

  const Th = ({ label, k }: { label: string; k: SortKey }) => (
    <button
      type="button"
      onClick={() => {
        if (sortKey === k) setDir((d) => (d === 1 ? -1 : 1));
        else {
          setSortKey(k);
          setDir(1);
        }
      }}
      className="flex items-center gap-1 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--t4)] hover:text-[var(--t2)]"
    >
      {label}
      {sortKey === k && (dir === 1 ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
    </button>
  );

  if (rows.length === 0) {
    return (
      <p className="rounded-[14px] border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--t4)]">
        {data.tasks.length === 0
          ? 'Chưa có dữ liệu tiến độ — bấm "Đồng bộ tiến độ" ở Gallery trước.'
          : 'Dự án này chưa có công việc nào đồng bộ từ Larkbase.'}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <th className="px-2 py-2"><Th label="Dự án" k="project" /></th>
            <th className="px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--t4)]">Công việc</th>
            <th className="px-2 py-2"><Th label="Chủ trì" k="owner" /></th>
            <th className="px-2 py-2"><Th label="Trạng thái" k="status" /></th>
            <th className="px-2 py-2"><Th label="Deadline" k="deadline" /></th>
            <th className="px-2 py-2"><Th label="Cảnh báo" k="warning" /></th>
            <th className="px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--t4)]">% tiến độ</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((t) => {
            const showPct = t.larkProjectCode && !seenCode.has(t.larkProjectCode);
            if (t.larkProjectCode) seenCode.add(t.larkProjectCode);
            const pct = t.larkProjectCode ? progress.get(t.larkProjectCode)?.pct : undefined;
            return (
              <tr key={t.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--hover)]">
                <td className="max-w-[160px] truncate px-2 py-2 text-[var(--t1)]">{t.larkProjectName}</td>
                <td className="max-w-[220px] truncate px-2 py-2 text-[var(--t1)]">{t.task}</td>
                <td className="px-2 py-2 text-[var(--t2)]">
                  <OwnerLabel row={t} persons={persons} userMap={userMap} teamById={teamById} />
                </td>
                <td className="px-2 py-2 text-[var(--t2)]">{t.status}</td>
                <td className="px-2 py-2 text-[var(--t2)]">{t.deadline ? new Date(t.deadline).toLocaleDateString('vi-VN') : '—'}</td>
                <td className="whitespace-nowrap px-2 py-2 text-[var(--t2)]">{t.warningLabel ?? '—'}</td>
                <td className="px-2 py-2 text-[var(--t2)]">{showPct && pct !== undefined ? `${pct}%` : ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Tab "Kanban" — 3 cột đúng "Trạng thái" Larkbase, CHỈ ĐỌC ---------- */

export function LarkKanbanTab({ data, filterCode }: { data: LarkData; filterCode: string | null }) {
  const rows = filterCode ? data.tasks.filter((t) => t.larkProjectCode === filterCode) : data.tasks;
  if (rows.length === 0) {
    return (
      <p className="rounded-[14px] border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--t4)]">
        Chưa có dữ liệu tiến độ — bấm &quot;Đồng bộ tiến độ&quot; ở Gallery trước.
      </p>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {STATUS_COLS.map((col) => {
        const items = rows.filter((t) => t.status === col);
        return (
          <div key={col} className="rounded-[14px] border border-[var(--border)] bg-[var(--field)] p-2.5">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-[var(--t2)]">{col}</span>
              <span className="rounded-full bg-[var(--hover)] px-1.5 text-[10px] text-[var(--t4)]">{items.length}</span>
            </div>
            <div className="max-h-[52vh] space-y-1.5 overflow-y-auto">
              {items.map((t) => (
                <div key={t.id} className="mat-card rounded-[10px] border border-[var(--mat-hairline)] p-2 text-xs">
                  <div className="truncate font-medium text-[var(--t1)]">{t.task}</div>
                  <div className="mt-0.5 truncate text-[var(--t4)]">{t.larkProjectName}</div>
                  {t.warningLabel && <div className="mt-1 text-[11px]">{t.warningLabel}</div>}
                </div>
              ))}
              {items.length === 0 && <p className="px-1 text-[11px] text-[var(--t5,var(--t4))]">Trống</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Tab "Nhân sự" — roster Larkbase + "Gán tài khoản IF" ---------- */

export function LarkRosterTab({ data, teamUsers, onMapped }: {
  data: LarkData;
  teamUsers: { id: string; name: string }[];
  onMapped: () => void;
}) {
  const [assigning, setAssigning] = useState<string | null>(null);
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const assign = useCallback(
    async (larkAccount: string) => {
      const userId = picked[larkAccount];
      if (!userId) return;
      setBusy(larkAccount);
      try {
        await fetch('/api/lark-user-map', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ larkAccount, userId }),
        });
        setAssigning(null);
        onMapped();
      } finally {
        setBusy(null);
      }
    },
    [picked, onMapped],
  );

  if (data.persons.length === 0) {
    return (
      <p className="rounded-[14px] border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--t4)]">
        Chưa có dữ liệu Nhân sự — bấm &quot;Đồng bộ tiến độ&quot; ở Gallery trước.
      </p>
    );
  }

  return (
    <div className="mat-card divide-y divide-[var(--border)] overflow-hidden rounded-[16px] border border-[var(--mat-hairline)]">
      {data.persons.map((p) => {
        const mapped = data.userMap.find((m) => m.larkAccount === p.larkAccount);
        const mappedName = mapped ? teamUsers.find((u) => u.id === mapped.userId)?.name : null;
        return (
          <div key={p.larkAccount} className="flex items-center gap-3 px-4 py-2.5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 truncate text-sm font-medium text-[var(--t1)]">
                {p.fullName}
                {p.isCrea && <span className="rounded bg-[var(--accent-soft)] px-1 text-[9px] text-[var(--accent)]">Crea</span>}
              </div>
              <div className="truncate text-[11px] text-[var(--t4)]">
                {[p.title, p.department].filter(Boolean).join(' · ') || p.larkAccount}
              </div>
            </div>
            {mapped ? (
              <span className="shrink-0 rounded-full bg-[var(--hover)] px-2 py-1 text-[11px] text-[var(--t3)]">
                <Link2 size={11} className="mr-1 inline" />
                {mappedName ?? 'đã gán'}
              </span>
            ) : assigning === p.larkAccount ? (
              <div className="flex shrink-0 items-center gap-1.5">
                <select
                  value={picked[p.larkAccount] ?? ''}
                  onChange={(e) => setPicked((prev) => ({ ...prev, [p.larkAccount]: e.target.value }))}
                  className="rounded-[8px] border border-[var(--border)] bg-[var(--field)] px-1.5 py-1 text-[11px] text-[var(--t1)]"
                >
                  <option value="">Chọn User…</option>
                  {teamUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!picked[p.larkAccount] || busy === p.larkAccount}
                  onClick={() => assign(p.larkAccount)}
                  className="rounded-[8px] bg-[var(--accent-strong)] px-2 py-1 text-[11px] text-white disabled:opacity-50"
                >
                  {busy === p.larkAccount ? <Loader2 size={11} className="animate-spin" /> : 'Gán'}
                </button>
                <button
                  type="button"
                  onClick={() => setAssigning(null)}
                  className="rounded-[8px] border border-[var(--border)] px-2 py-1 text-[11px] text-[var(--t3)]"
                >
                  Huỷ
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAssigning(p.larkAccount)}
                className="flex shrink-0 items-center gap-1 rounded-full border border-[var(--border)] px-2.5 py-1 text-[11px] text-[var(--t3)] hover:bg-[var(--hover)]"
              >
                <UserPlus size={12} /> Gán tài khoản IF
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Thanh trên: đồng bộ lại + thời điểm đồng bộ gần nhất ---------- */

export function LarkSyncBar({ data, loading, onReload }: { data: LarkData | null; loading: boolean; onReload: () => void }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2 text-[11px] text-[var(--t4)]">
      <span>
        {data?.lastSyncedAt
          ? `Đồng bộ gần nhất: ${new Date(data.lastSyncedAt).toLocaleString('vi-VN')}`
          : 'Chưa đồng bộ lần nào.'}
      </span>
      <button
        type="button"
        onClick={onReload}
        disabled={loading}
        className={cn('flex items-center gap-1 rounded-full border border-[var(--border)] px-2 py-1 hover:bg-[var(--hover)]', loading && 'opacity-60')}
      >
        {loading ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
        Tải lại
      </button>
    </div>
  );
}
