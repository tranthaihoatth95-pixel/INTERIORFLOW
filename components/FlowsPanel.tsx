'use client';

import { useCallback, useEffect, useState } from 'react';
import { X, Plus, Trash2, FolderPlus, Link2 } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import {
  fetchFlows,
  openFlow,
  createFlow,
  createProject,
  deleteFlow,
  assignProject,
  type FlowMeta,
  type ProjectMeta,
} from '@/lib/workspace';
import { cn } from '@/lib/utils';

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'vừa xong';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h trước`;
  return `${Math.floor(h / 24)}d trước`;
}

export function FlowsPanel() {
  const panel = useFlowStore((s) => s.panel);
  const setPanel = useFlowStore((s) => s.setPanel);
  const currentFlowId = useFlowStore((s) => s.currentFlowId);
  const [flows, setFlows] = useState<FlowMeta[]>([]);
  const [projects, setProjects] = useState<ProjectMeta[]>([]);

  const refresh = useCallback(() => {
    fetchFlows()
      .then((d) => {
        setFlows(d.flows);
        setProjects(d.projects);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (panel === 'flows') refresh();
  }, [panel, refresh]);

  if (panel !== 'flows') return null;

  return (
    <aside className="absolute inset-y-0 left-12 right-0 z-40 flex flex-col border-r border-[var(--border)] bg-[var(--panel)] shadow-2xl md:static md:z-20 md:w-72 md:shadow-none">
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2.5">
        <span className="flex-1 text-xs font-semibold uppercase tracking-wider text-[var(--t3)]">
          Projects & Flows
        </span>
        <button
          title="Tạo project"
          onClick={async () => {
            const name = prompt('Tên project / khách hàng:');
            if (name) {
              await createProject(name);
              refresh();
            }
          }}
          className="grid h-6 w-6 place-items-center rounded-md text-[var(--t4)] hover:bg-[var(--hover)] hover:text-[var(--t2)]"
        >
          <FolderPlus size={13} />
        </button>
        <button
          title="Flow mới"
          onClick={async () => {
            const id = await createFlow('Untitled flow');
            await openFlow(id);
            refresh();
          }}
          className="grid h-6 w-6 place-items-center rounded-md text-[var(--t4)] hover:bg-[var(--hover)] hover:text-[var(--t2)]"
        >
          <Plus size={14} />
        </button>
        <button
          onClick={() => setPanel(null)}
          className="grid h-6 w-6 place-items-center rounded-md text-[var(--t4)] hover:bg-[var(--hover)] hover:text-[var(--t2)]"
        >
          <X size={13} />
        </button>
      </div>

      <div className="flex-1 space-y-1.5 overflow-y-auto p-2.5">
        {flows.length === 0 && (
          <p className="px-1 pt-4 text-center text-xs text-[var(--t5)]">Chưa có flow nào.</p>
        )}
        {flows.map((f) => (
          <div
            key={f.id}
            className={cn(
              'group rounded-lg border px-2.5 py-2 transition',
              f.id === currentFlowId
                ? 'border-violet-500/50 bg-violet-500/10'
                : 'border-[var(--border)] bg-[var(--field)] hover:border-violet-500/30',
            )}
          >
            <div className="flex items-center gap-1.5">
              <button
                className="min-w-0 flex-1 truncate text-left text-xs font-medium text-[var(--t1)]"
                onClick={() => openFlow(f.id)}
                title="Mở flow"
              >
                {f.name}
              </button>
              {f.shareToken && <Link2 size={11} className="shrink-0 text-emerald-400" />}
              <button
                title="Xoá flow"
                onClick={async () => {
                  if (confirm(`Xoá flow "${f.name}"?`)) {
                    await deleteFlow(f.id);
                    refresh();
                  }
                }}
                className="grid h-5 w-5 shrink-0 place-items-center rounded text-[var(--t4)] opacity-0 transition hover:text-red-400 group-hover:opacity-100"
              >
                <Trash2 size={11} />
              </button>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <select
                value={f.project?.id ?? ''}
                onChange={async (e) => {
                  await assignProject(f.id, e.target.value || null);
                  refresh();
                }}
                className="min-w-0 flex-1 truncate rounded border border-transparent bg-transparent text-[10px] text-[var(--t4)] outline-none hover:border-[var(--border)]"
              >
                <option value="">— không thuộc project —</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <span className="shrink-0 text-[10px] tabular-nums text-[var(--t5)]">
                v{f.version} · {timeAgo(f.updatedAt)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <p className="border-t border-[var(--border)] px-3 py-2 text-[9px] leading-relaxed text-[var(--t5)]">
        Autosave 2s lên server · Run flow tự snapshot version · Share bật ở nút Share trên header.
      </p>
    </aside>
  );
}
