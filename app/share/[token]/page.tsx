'use client';

import { useEffect, useState } from 'react';
import { ReactFlow, ReactFlowProvider, Background, BackgroundVariant, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { InteriorNode } from '@/components/nodes/InteriorNode';
import { NoteNode } from '@/components/nodes/NoteNode';
import type { FlowNode } from '@/lib/store';

const nodeTypes = { interior: InteriorNode, note: NoteNode };

export default function SharePage({ params }: { params: { token: string } }) {
  const [data, setData] = useState<{ name: string; owner: string; nodes: FlowNode[]; edges: Edge[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.__ifReadOnly = true;
    fetch(`/api/share/${params.token}`)
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error ?? 'Lỗi tải flow.');
        const graph = JSON.parse(body.graphJson);
        setData({ name: body.name, owner: body.owner, nodes: graph.nodes ?? [], edges: graph.edges ?? [] });
      })
      .catch((e) => setError(e.message));
  }, [params.token]);

  if (error)
    return (
      <div className="grid h-screen place-items-center bg-[var(--bg)] text-sm text-[var(--t3)]">{error}</div>
    );
  if (!data)
    return (
      <div className="grid h-screen place-items-center bg-[var(--bg)] text-sm text-[var(--t4)]">Đang tải…</div>
    );

  return (
    <div className="flex h-screen flex-col bg-[var(--bg)]">
      <header className="flex h-12 items-center gap-3 border-b border-[var(--border)] bg-[var(--panel)] px-4">
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 text-[13px] font-bold text-white">
          IF
        </div>
        <span className="text-sm font-medium text-[var(--t1)]">{data.name}</span>
        <span className="text-xs text-[var(--t4)]">· chia sẻ bởi {data.owner}</span>
        <div className="flex-1" />
        <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-300">
          Chỉ xem
        </span>
      </header>
      <div className="min-h-0 flex-1">
        <ReactFlowProvider>
          <ReactFlow
            nodes={data.nodes}
            edges={data.edges}
            nodeTypes={nodeTypes}
            fitView
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            edgesFocusable={false}
            panOnScroll
            zoomOnPinch
            minZoom={0.1}
          >
            <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} color="var(--dots)" />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </div>
  );
}
