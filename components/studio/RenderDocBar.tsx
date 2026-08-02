'use client';

/**
 * components/studio/RenderDocBar.tsx — "toolbar tài liệu" của chặng RENDERING, tách khỏi header
 * (03/08, SPEC-APP-SHELL-CHUNG §2 mục 5: "Tệp ▾/Việc ▾ chỉ có ở Rendering — hoặc mọi chặng đều
 * có, hoặc bỏ"). Chọn phương án C ĐÚNG BẢN CHẤT: chúng không thuộc HEADER CHUNG mà là toolbar
 * tài liệu RIÊNG của chặng render (CAD có fileBar, Present có Toolbar riêng — render trước đây
 * mượn header vì thiếu chỗ). Nay xuống slot `toolbar` của StageShell — header 3 chặng đồng nhất,
 * năng lực nhập/xuất/hàng-đợi GIỮ NGUYÊN 100% (code move nguyên văn từ AppChrome).
 */

import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { AiStatusDot } from '@/components/settings/AiDependencySettings';
import { UploadButton } from '@/components/studio/UploadButton';
import { RenderIOMenus } from '@/components/studio/RenderIOMenus';
import { TasksDropdown } from '@/components/TasksDropdown';
import { pressable } from '@/lib/motion';
import { useDismissable } from '@/lib/useDismissable';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function RenderDocBar() {
  const workspace = useFlowStore((s) => s.workspace);
  const tasksOpen = useFlowStore((s) => s.tasksOpen);
  const setTasksOpen = useFlowStore((s) => s.setTasksOpen);
  const flowRuns = useFlowStore((s) => s.flowRuns);
  const tr = useT();

  // 2.2.90 ĐỢT 2 (01/08) — Tasks dropdown đóng bằng bấm-ra-ngoài + Escape qua hook dùng chung.
  const tasksRef = useRef<HTMLDivElement>(null);
  useDismissable({ open: tasksOpen, onDismiss: () => setTasksOpen(false), refs: [tasksRef] });

  // 2.2.86 (30/07) — badge "Việc" = số lượt ĐANG CHẠY + ĐANG CHỜ (đơn vị FlowRun).
  const activeJobs = flowRuns.filter((r) => r.status === 'running' || r.status === 'queued').length;

  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-[var(--border)] bg-[var(--panel)] px-3 py-1.5">
      {(workspace ?? 'render') === 'render' ? <RenderIOMenus /> : <UploadButton />}
      <div className="flex-1" />
      <AiStatusDot />
      <div ref={tasksRef} className="relative shrink-0">
        <motion.button
          {...pressable}
          onClick={() => setTasksOpen(!tasksOpen)}
          className={cn(
            'flex items-center gap-1.5 rounded-[10px] border px-2.5 py-1.5 text-xs transition-colors duration-200 ease-[cubic-bezier(.32,.72,0,1)]',
            tasksOpen
              ? 'border-[var(--accent-ring)] bg-[var(--accent-soft)] text-[var(--accent)]'
              : 'border-[var(--border)] text-[var(--t2)] hover:bg-[var(--hover)]',
          )}
        >
          {tr('Việc', 'Tasks')}
          {activeJobs > 0 && (
            <span className="grid h-4 min-w-4 place-items-center rounded-full bg-[var(--accent)] px-1 text-[length:var(--fs-xs)] font-semibold text-white">
              {activeJobs}
            </span>
          )}
          <ChevronDown size={12} className={cn('transition-transform duration-200 ease-[cubic-bezier(.32,.72,0,1)]', tasksOpen && 'rotate-180')} />
        </motion.button>
        <AnimatePresence>{tasksOpen && <TasksDropdown />}</AnimatePresence>
      </div>
    </div>
  );
}
