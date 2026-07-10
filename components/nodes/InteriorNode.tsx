'use client';

import { memo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Play, Loader2, CircleAlert, CircleCheck, RotateCcw, ImagePlus, Paintbrush, X } from 'lucide-react';
import { getDefinition } from '@/lib/nodes/registry';
import { useFlowStore, type FlowNode } from '@/lib/store';
import { runNode } from '@/lib/execution';
import { CATEGORY_META, DATA_TYPE_COLORS, type ParamDef } from '@/lib/types';
import { NodeExtras } from '@/components/nodes/NodeExtras';
import { nodePop, pressableIcon } from '@/lib/motion';
import { cn } from '@/lib/utils';

const PORT_GAP = 26;
const PORT_TOP = 46;

function ParamField({
  nodeId,
  param,
  value,
}: {
  nodeId: string;
  param: ParamDef;
  value: string | number;
}) {
  const updateParam = useFlowStore((s) => s.updateParam);
  const fileRef = useRef<HTMLInputElement>(null);

  if (param.kind === 'text') {
    return (
      <label className="block">
        <span className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--t4)]">{param.label}</span>
        {param.multiline ? (
          <textarea
            className="nodrag w-full resize-none rounded-md border border-[var(--border)] bg-[var(--field)] px-2 py-1.5 text-xs text-[var(--t1)] placeholder-[var(--t5)] outline-none focus:border-[var(--accent-ring)]"
            rows={3}
            placeholder={param.placeholder}
            value={String(value)}
            onChange={(e) => updateParam(nodeId, param.id, e.target.value)}
          />
        ) : (
          <input
            className="nodrag w-full rounded-md border border-[var(--border)] bg-[var(--field)] px-2 py-1.5 text-xs text-[var(--t1)] placeholder-[var(--t5)] outline-none focus:border-[var(--accent-ring)]"
            placeholder={param.placeholder}
            value={String(value)}
            onChange={(e) => updateParam(nodeId, param.id, e.target.value)}
          />
        )}
      </label>
    );
  }

  if (param.kind === 'select') {
    return (
      <label className="block">
        <span className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--t4)]">{param.label}</span>
        <select
          className="nodrag w-full rounded-md border border-[var(--border)] bg-[var(--field)] px-2 py-1.5 text-xs text-[var(--t1)] outline-none focus:border-[var(--accent-ring)]"
          value={String(value)}
          onChange={(e) => updateParam(nodeId, param.id, e.target.value)}
        >
          {param.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (param.kind === 'slider') {
    // node cũ (autosave) có thể thiếu param mới → value undefined → NaN. Fallback về default.
    const sv = value == null || Number.isNaN(Number(value)) ? param.default : Number(value);
    return (
      <label className="block">
        <span className="mb-1 flex justify-between text-[10px] uppercase tracking-wider text-[var(--t4)]">
          {param.label}
          <span className="text-[var(--t3)]">{sv.toFixed(2)}</span>
        </span>
        <input
          type="range"
          className="nodrag w-full accent-[var(--accent)]"
          min={param.min}
          max={param.max}
          step={param.step}
          value={sv}
          onChange={(e) => updateParam(nodeId, param.id, Number(e.target.value))}
        />
      </label>
    );
  }

  if (param.kind === 'mask' || param.kind === 'annotate') {
    const isMask = param.kind === 'mask';
    const has = typeof value === 'string' && value.startsWith('data:');
    return (
      <div>
        {has && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={String(value)} alt={param.kind} className="mb-1.5 h-20 w-full rounded-md object-cover" loading="lazy" />
        )}
        <button
          className="nodrag flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-[var(--border-strong)] py-2 text-[11px] text-[var(--t3)] transition hover:border-[var(--accent-ring)] hover:text-[var(--t1)]"
          onClick={() =>
            isMask
              ? useFlowStore.getState().setMaskEditorNodeId(nodeId)
              : useFlowStore.getState().setAnnotateNodeId(nodeId)
          }
        >
          <Paintbrush size={13} />
          {isMask ? (has ? 'Sửa mask' : 'Vẽ mask') : has ? 'Sửa chú thích' : 'Chú thích lên ảnh'}
        </button>
      </div>
    );
  }

  // image upload — nhận cả data-URI (upload thật) LẪN URL ('/demo/…', '/detech/…', http…)
  const hasImage =
    typeof value === 'string' &&
    value.length > 0 &&
    (value.startsWith('data:') || value.startsWith('/') || value.startsWith('http'));
  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => updateParam(nodeId, param.id, String(reader.result));
          reader.readAsDataURL(file);
        }}
      />
      {hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={String(value)}
          alt="input"
          className="nodrag h-28 w-full cursor-pointer rounded-md object-cover"
          onClick={() => fileRef.current?.click()}
          loading="lazy"
        />
      ) : (
        <button
          className="nodrag flex h-24 w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed border-[var(--border-strong)] text-[var(--t4)] transition hover:border-[var(--accent-ring)] hover:text-[var(--t2)]"
          onClick={() => fileRef.current?.click()}
        >
          <ImagePlus size={18} />
          <span className="text-[11px]">Upload / drag ảnh</span>
        </button>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'running' || status === 'queued')
    return <Loader2 size={13} className="animate-spin text-[var(--accent)]" />;
  if (status === 'done') return <CircleCheck size={13} className="text-emerald-400" />;
  if (status === 'error') return <CircleAlert size={13} className="text-red-400" />;
  return null;
}

function InteriorNodeInner({ id, data, selected }: NodeProps<FlowNode>) {
  const def = getDefinition(data.defType);
  const meta = CATEGORY_META[def.category];
  const deleteNode = useFlowStore((s) => s.deleteNode);
  const { status, progress, error } = data.run;
  const busy = status === 'running' || status === 'queued';

  return (
    <motion.div
      variants={nodePop}
      initial="hidden"
      animate="visible"
      className={cn(
        'mat-card w-64 rounded-[16px] border shadow-xl shadow-black/30 transition-colors',
        selected ? 'border-[var(--accent-ring)]' : 'border-[var(--mat-hairline)]',
        status === 'error' && 'border-red-500/60',
      )}
    >
      {/* header */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: meta.color }} />
        <span className="flex-1 truncate text-xs font-medium text-[var(--t1)]">{def.title}</span>
        {def.creditCost > 0 && (
          <span className="rounded bg-[var(--hover)] px-1.5 py-0.5 text-[10px] text-[var(--t3)]">
            {def.creditCost}cr
          </span>
        )}
        <StatusIcon status={status} />
        <motion.button
          {...pressableIcon}
          title={status === 'error' ? 'Retry' : 'Run node (+ upstream)'}
          disabled={busy}
          onClick={() => runNode(id)}
          className="nodrag grid h-6 w-6 place-items-center rounded-md bg-[var(--accent-strong)] text-white transition-colors hover:bg-[var(--accent)] disabled:opacity-40"
        >
          {status === 'error' ? <RotateCcw size={12} /> : <Play size={12} className="translate-x-[1px]" />}
        </motion.button>
        <motion.button
          {...pressableIcon}
          title="Xoá node"
          disabled={busy}
          onClick={() => deleteNode(id)}
          className="nodrag grid h-6 w-6 place-items-center rounded-md text-[var(--t4)] transition-colors hover:bg-red-500/15 hover:text-red-400 disabled:opacity-40"
        >
          <X size={13} />
        </motion.button>
      </div>

      {/* body */}
      <div
        className="space-y-2.5 px-3 py-2.5"
        style={{ minHeight: Math.max(def.inputs.length, def.outputs.length) * PORT_GAP }}
      >
        {def.params.map((p) => (
          <ParamField key={p.id} nodeId={id} param={p} value={data.params[p.id]} />
        ))}

        {status === 'running' && (
          <div className="h-1 overflow-hidden rounded-full bg-[var(--hover)]">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-all duration-200"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        )}

        {status === 'error' && error && (
          <p className="rounded-md bg-red-500/10 px-2 py-1.5 text-[11px] leading-snug text-red-300">{error}</p>
        )}

        <NodeExtras nodeId={id} data={data} />
      </div>

      {/* ports */}
      {def.inputs.map((port, i) => (
        <Handle
          key={port.id}
          id={port.id}
          type="target"
          position={Position.Left}
          style={{
            top: PORT_TOP + i * PORT_GAP,
            background: DATA_TYPE_COLORS[port.dataType],
            width: 10,
            height: 10,
            border: '2px solid var(--bg)',
          }}
          title={`${port.label} · ${port.dataType}`}
        />
      ))}
      {def.outputs.map((port, i) => (
        <Handle
          key={port.id}
          id={port.id}
          type="source"
          position={Position.Right}
          style={{
            top: PORT_TOP + i * PORT_GAP,
            background: DATA_TYPE_COLORS[port.dataType],
            width: 10,
            height: 10,
            border: '2px solid var(--bg)',
          }}
          title={`${port.label} · ${port.dataType}`}
        />
      ))}
    </motion.div>
  );
}

export const InteriorNode = memo(InteriorNodeInner);
