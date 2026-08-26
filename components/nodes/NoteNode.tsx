'use client';

import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { X } from 'lucide-react';
import { useFlowStore, type FlowNode } from '@/lib/store';
import { cn } from '@/lib/utils';
import CommentPin from '@/components/nodes/CommentPin';

function NoteNodeInner({ id, data, selected }: NodeProps<FlowNode>) {
  const updateNote = useFlowStore((s) => s.updateNote);
  const deleteNode = useFlowStore((s) => s.deleteNode);
  return (
    // Port mock-mood-collab-g2 `.sticky` (docs/mocks/mock-mood-collab-g2-2026-08-03.html:241) —
    // nền mix từ `--warning` + `--card` (KHÔNG hex mới, đúng chú thích mock + luật ③ "màu qua CSS
    // var app, cấm hex cứng"). Trước đây dùng thẳng bảng màu amber-* của Tailwind (bg-amber-200,
    // border-amber-500…) — đó LÀ hex cứng trá hình (không theo theme token), đổi sang color-mix
    // (khuôn đã dùng ở ProjectSelect.tsx/TaskBoardScreen.tsx/MaterialPbrEditor.tsx…).
    <div
      className={cn('group relative w-52 rounded-[10px] border p-2')}
      style={{
        background: 'color-mix(in srgb, var(--warning) 26%, var(--card))',
        borderColor: selected ? 'var(--accent-ring)' : 'color-mix(in srgb, var(--warning) 45%, transparent)',
        boxShadow: 'var(--shadow-node)',
      }}
    >
      {/* G2 phần (2) — comment neo vào sticky note này. */}
      <CommentPin nodeId={id} />

      <button
        title="Xoá ghi chú"
        onClick={() => deleteNode(id)}
        className="nodrag absolute right-1 top-1 grid h-5 w-5 place-items-center rounded text-[var(--t3)] opacity-0 transition hover:bg-[var(--hover)] hover:text-[var(--t1)] group-hover:opacity-100"
      >
        <X size={14} />
      </button>
      <textarea
        className="nodrag h-24 w-full resize-none bg-transparent text-xs leading-snug text-[var(--t1)] placeholder-[var(--t4)] outline-none"
        placeholder="Ghi chú…"
        value={data.note ?? ''}
        onChange={(e) => updateNote(id, e.target.value)}
      />
    </div>
  );
}

export const NoteNode = memo(NoteNodeInner);
