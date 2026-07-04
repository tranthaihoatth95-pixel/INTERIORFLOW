'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { sheetSlide, pressableIcon } from '@/lib/motion';
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
    <AnimatePresence>
      {panel === 'flows' && (
        <motion.aside
          key="flows"
      variants={sheetSlide('left')}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="mat-panel z-20 flex w-72 flex-col border-r border-[var(--border)]"
    >
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2.5">
        <span className="flex-1 text-xs font-semibold uppercase tracking-wider text-[var(--t3)]">
          Projects & Flows
        </span>
        <motion.button
          {...pressableIcon}
          title="Tạo project"
          onClick={async () => {
            const name = prompt('Tên project / khách hàng:');
            if (name) {
              await createProject(name);
              refresh();
            }
          }}
          className="grid h-6 w-6 place-items-center rounded-md text-[var(--t4)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--t2)]"
        >
          <FolderPlus size={13} />
        </motion.button>
        <motion.button
          {...pressableIcon}
          title="Flow mới"
          onClick={async () => {
            const id = await createFlow('Untitled flow');
            await openFlow(id);
            refresh();
          }}
          className="grid h-6 w-6 place-items-center rounded-md text-[var(--t4)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--t2)]"
        >
          <Plus size={14} />
        </motion.button>
        <motion.button
          {...pressableIcon}
          onClick={() => setPanel(null)}
          className="grid h-6 w-6 place-items-center rounded-md text-[var(--t4)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--t2)]"
        >
          <X size={13} />
        </motion.button>
      </div>

      <div className="flex-1 space-y-1.5 overflow-y-auto p-2.5">
        {flows.length === 0 && (
          <p className="px-1 pt-4 text-center text-xs text-[var(--t5)]">Chưa có flow nào.</p>
        )}
        {flows.map((f) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.26, ease: [0.32, 0.72, 0, 1] }}
            className={cn(
              'group rounded-[10px] border px-2.5 py-2 transition-colors',
              f.id === currentFlowId
                ? 'border-[var(--accent-ring)] bg-[var(--accent-soft)]'
                : 'border-[var(--border)] bg-[var(--field)] hover:border-[var(--accent-ring)]',
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
                className="grid h-5 w-5 shrink-0 place-items-center rounded text-[var(--t4)] opacity-0 transition group-hover:opacity-100 hover:text-red-400"
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
          </motion.div>
        ))}
      </div>

      <p className="border-t border-[var(--border)] px-3 py-2 text-[9px] leading-relaxed text-[var(--t5)]">
        Autosave 2s lên server · Run flow tự snapshot version · Share bật ở nút Share trên header.
      </p>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
