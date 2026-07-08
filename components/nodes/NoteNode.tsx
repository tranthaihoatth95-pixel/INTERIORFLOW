'use client';

import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { X } from 'lucide-react';
import { useFlowStore, type FlowNode } from '@/lib/store';
import { cn } from '@/lib/utils';

function NoteNodeInner({ id, data, selected }: NodeProps<FlowNode>) {
  const updateNote = useFlowStore((s) => s.updateNote);
  const deleteNode = useFlowStore((s) => s.deleteNode);
  return (
    <div
      className={cn(
        'group relative w-52 rounded-lg border bg-amber-200/95 p-2 shadow-lg shadow-black/30',
        selected ? 'border-amber-500' : 'border-amber-300/60',
      )}
    >
      <button
        title="Xoá ghi chú"
        onClick={() => deleteNode(id)}
        className="nodrag absolute right-1 top-1 grid h-5 w-5 place-items-center rounded text-amber-800/70 opacity-0 transition hover:bg-amber-900/15 hover:text-amber-950 group-hover:opacity-100"
      >
        <X size={12} />
      </button>
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
