'use client';

import { motion } from 'framer-motion';
import { Loader2, CircleAlert, CircleCheck, Clock3 } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { fadeRise } from '@/lib/motion';

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5) return 'vừa xong';
  if (s < 60) return `${s}s trước`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m trước`;
  return `${Math.floor(m / 60)}h trước`;
}

export function TasksDropdown() {
  const jobs = useFlowStore((s) => s.jobs);

  return (
    // material card + fade-rise (Header bọc trong AnimatePresence)
    <motion.div
      variants={fadeRise}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="mat-card absolute right-0 top-full z-50 mt-2 w-80 origin-top-right overflow-hidden rounded-[14px] border border-[var(--border)] shadow-pop"
    >
      <div className="border-b border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--t2)]">
        Tasks
      </div>
      <div className="max-h-80 overflow-y-auto">
        {jobs.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-[var(--t4)]">
            Chưa có job nào — bấm ▶ trên node hoặc Run flow.
          </p>
        )}
        {jobs.map((j) => (
          <div key={j.id} className="flex items-center gap-2.5 border-b border-[var(--border)] px-3 py-2.5 last:border-0">
            {j.status === 'running' && <Loader2 size={14} className="shrink-0 animate-spin text-[var(--accent)]" />}
            {j.status === 'queued' && <Clock3 size={14} className="shrink-0 text-[var(--t4)]" />}
            {j.status === 'done' && <CircleCheck size={14} className="shrink-0 text-emerald-400" />}
            {j.status === 'error' && <CircleAlert size={14} className="shrink-0 text-red-400" />}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-[var(--t1)]">{j.nodeTitle}</p>
              <p className="truncate text-[10px] text-[var(--t4)]">
                {j.status === 'error' ? j.error : timeAgo(j.createdAt)}
                {j.creditCost > 0 && ` · ${j.creditCost}cr${j.status === 'error' ? ' (đã hoàn)' : ''}`}
              </p>
            </div>
            <span className="shrink-0 text-[10px] uppercase tracking-wider text-[var(--t5)]">{j.status}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
