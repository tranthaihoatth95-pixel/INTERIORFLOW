'use client';

/**
 * components/TasksDropdown.tsx — menu "Việc" = HÀNG ĐỢI THẬT (2.2.86, 30/07, Hoà chốt). Trước là
 * nhật ký job lẻ theo node; nay đơn vị là FlowRun (1 lượt chạy: ▶ node + upstream, "Kết xuất"
 * thẻ Tool Mode, hoặc "Run flow" toàn graph — xem lib/execution.ts), 3 nhóm rõ ràng: ĐANG CHẠY ·
 * ĐANG CHỜ (có thứ tự) · ĐÃ XONG (done/error/cancelled). Huỷ được: mục đang chờ xoá hẳn khỏi
 * hàng đợi; mục đang chạy đặt cờ dừng ở ranh giới node kế tiếp (không cắt giữa 1 lần gọi API).
 */

import { motion } from 'framer-motion';
import { Loader2, CircleAlert, CircleCheck, CircleX, Clock3, X } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { estimateRunCredit } from '@/lib/execution';
import { fadeRise } from '@/lib/motion';
import type { FlowRun } from '@/lib/types';

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5) return 'vừa xong';
  if (s < 60) return `${s}s trước`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m trước`;
  return `${Math.floor(m / 60)}h trước`;
}

function statusIcon(status: FlowRun['status']) {
  switch (status) {
    case 'running':
      return <Loader2 size={14} className="mt-0.5 shrink-0 animate-spin text-[var(--accent)]" />;
    case 'queued':
      return <Clock3 size={14} className="mt-0.5 shrink-0 text-[var(--t4)]" />;
    case 'done':
      return <CircleCheck size={14} className="mt-0.5 shrink-0 text-emerald-400" />;
    case 'error':
      return <CircleAlert size={14} className="mt-0.5 shrink-0 text-red-400" />;
    case 'cancelled':
      return <CircleX size={14} className="mt-0.5 shrink-0 text-[var(--t4)]" />;
  }
}

function RunRow({ run, queuePosition }: { run: FlowRun; queuePosition?: number }) {
  const requestCancelFlowRun = useFlowStore((s) => s.requestCancelFlowRun);
  const total = run.nodeIds.length;
  // Credit ước tính chỉ còn ý nghĩa TRƯỚC/ĐANG chạy — sau khi xong thì tiền đã trừ thật ở từng
  // Job rồi (xem execNode()), không phải ước tính nữa nên không hiện lại ở nhóm Đã xong.
  const credit = run.status === 'queued' || run.status === 'running' ? estimateRunCredit(run.nodeIds) : 0;

  let detail: string;
  if (run.status === 'running') detail = `${Math.min(total, Math.max(0, run.currentIndex) + 1)}/${total} node`;
  else if (run.status === 'queued') detail = `Đứng thứ ${queuePosition} · ${total} node`;
  else if (run.status === 'error') detail = `Lỗi · ${timeAgo(run.finishedAt ?? run.queuedAt)}`;
  else if (run.status === 'cancelled') detail = `Đã huỷ · ${timeAgo(run.finishedAt ?? run.queuedAt)}`;
  else detail = `${total} node · ${timeAgo(run.finishedAt ?? run.queuedAt)}`;

  return (
    <div className="flex items-start gap-2.5 border-b border-[var(--border)] px-3 py-2.5 last:border-0">
      {statusIcon(run.status)}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-[var(--t1)]">{run.label}</p>
        <p className="truncate text-[10px] text-[var(--t4)]">
          {detail}
          {credit > 0 && ` · ~${credit}cr`}
        </p>
      </div>
      {(run.status === 'queued' || run.status === 'running') && (
        <button
          type="button"
          onClick={() => requestCancelFlowRun(run.id)}
          title={run.status === 'running' ? 'Dừng (ở ranh giới node kế tiếp, không cắt giữa)' : 'Huỷ khỏi hàng đợi'}
          className="shrink-0 rounded-md p-1 text-[var(--t4)] transition-colors hover:bg-[var(--hover)] hover:text-red-400"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}

function GroupLabel({ children }: { children: string }) {
  return <div className="px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--t4)]">{children}</div>;
}

export function TasksDropdown() {
  const flowRuns = useFlowStore((s) => s.flowRuns);
  const running = flowRuns.filter((r) => r.status === 'running');
  const queued = flowRuns.filter((r) => r.status === 'queued').sort((a, b) => a.queuedAt - b.queuedAt);
  // 20 mục gần nhất — đủ để xem lại, không để "Đã xong" cuộn vô hạn theo cả phiên dài.
  const finished = flowRuns
    .filter((r) => r.status === 'done' || r.status === 'error' || r.status === 'cancelled')
    .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0))
    .slice(0, 20);
  const empty = running.length === 0 && queued.length === 0 && finished.length === 0;

  return (
    <motion.div
      variants={fadeRise}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="mat-card absolute right-0 top-full z-50 mt-2 w-80 origin-top-right overflow-hidden rounded-[14px] border border-[var(--border)] shadow-pop"
    >
      <div className="border-b border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--t2)]">Việc</div>
      <div className="max-h-96 overflow-y-auto">
        {empty && (
          <p className="px-3 py-6 text-center text-xs text-[var(--t4)]">
            Chưa có lượt chạy nào — bấm ▶ trên node hoặc &quot;Kết xuất&quot; trên thẻ.
          </p>
        )}
        {running.length > 0 && (
          <>
            <GroupLabel>Đang chạy</GroupLabel>
            {running.map((r) => (
              <RunRow key={r.id} run={r} />
            ))}
          </>
        )}
        {queued.length > 0 && (
          <>
            <GroupLabel>Đang chờ</GroupLabel>
            {queued.map((r, i) => (
              <RunRow key={r.id} run={r} queuePosition={i + 1} />
            ))}
          </>
        )}
        {finished.length > 0 && (
          <>
            <GroupLabel>Đã xong</GroupLabel>
            {finished.map((r) => (
              <RunRow key={r.id} run={r} />
            ))}
          </>
        )}
      </div>
    </motion.div>
  );
}
