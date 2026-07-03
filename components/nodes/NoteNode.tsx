'use client';

import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { useFlowStore, type FlowNode } from '@/lib/store';
import { cn } from '@/lib/utils';

function NoteNodeInner({ id, data, selected }: NodeProps<FlowNode>) {
  const updateNote = useFlowStore((s) => s.updateNote);
  return (
    <div
      className={cn(
        'w-52 rounded-lg border bg-amber-200/95 p-2 shadow-lg shadow-black/30',
        selected ? 'border-amber-500' : 'border-amber-300/60',
      )}
    >
      <textarea
        className="nodrag h-24 w-full resize-none bg-transparent text-xs leading-snug text-amber-950 placeholder-amber-700/50 outline-none"
        placeholder="Ghi chú…"
        value={data.note ?? ''}
        onChange={(e) => updateNote(id, e.target.value)}
      />
    </div>
  );
}

export const NoteNode = memo(NoteNodeInner);
