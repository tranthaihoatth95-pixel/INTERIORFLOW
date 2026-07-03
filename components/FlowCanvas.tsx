'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  type IsValidConnection,
  type Edge,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useFlowStore, type FlowNode } from '@/lib/store';
import { getDefinition } from '@/lib/nodes/registry';
import { InteriorNode } from '@/components/nodes/InteriorNode';
import { NoteNode } from '@/components/nodes/NoteNode';
import { BottomToolbar } from '@/components/BottomToolbar';
import { DND_MIME } from '@/components/NodeLibraryPanel';
import { ASSET_MIME } from '@/components/LibraryPanel';
import { CATEGORY_META } from '@/lib/types';

const nodeTypes = { interior: InteriorNode, note: NoteNode };

export function FlowCanvas() {
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const onNodesChange = useFlowStore((s) => s.onNodesChange);
  const onEdgesChange = useFlowStore((s) => s.onEdgesChange);
  const onConnect = useFlowStore((s) => s.onConnect);
  const tool = useFlowStore((s) => s.tool);
  const connectError = useFlowStore((s) => s.connectError);
  const setConnectError = useFlowStore((s) => s.setConnectError);
  const addNode = useFlowStore((s) => s.addNode);
  const addNote = useFlowStore((s) => s.addNote);
  const snapshot = useFlowStore((s) => s.snapshot);

  const { screenToFlowPosition } = useReactFlow();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Type-safe ports: chỉ cho nối cùng dataType
  const isValidConnection: IsValidConnection<Edge> = useCallback(
    (conn) => {
      const { nodes: ns } = useFlowStore.getState();
      const source = ns.find((n) => n.id === conn.source);
      const target = ns.find((n) => n.id === conn.target);
      if (!source || !target || source.type === 'note' || target.type === 'note') return false;
      if (conn.source === conn.target) return false;
      const outPort = getDefinition(source.data.defType).outputs.find((o) => o.id === conn.sourceHandle);
      const inPort = getDefinition(target.data.defType).inputs.find((i) => i.id === conn.targetHandle);
      if (!outPort || !inPort) return false;
      if (outPort.dataType !== inPort.dataType) {
        setConnectError(
          `Không nối được: output "${outPort.label}" (${outPort.dataType}) ≠ input "${inPort.label}" (${inPort.dataType}).`,
        );
        return false;
      }
      return true;
    },
    [setConnectError],
  );

  // Toast lỗi tự tắt sau 3.5s
  useEffect(() => {
    if (!connectError) return;
    const t = setTimeout(() => setConnectError(null), 3500);
    return () => clearTimeout(t);
  }, [connectError, setConnectError]);

  // Drag & drop từ Node Library / Thư viện ảnh
  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const pos = { x: position.x - 128, y: position.y - 20 };

      const defType = e.dataTransfer.getData(DND_MIME);
      if (defType) {
        addNode(defType, pos);
        return;
      }
      // asset từ thư viện team → tải file, tạo node Import Image gắn sẵn ảnh
      const assetUrl = e.dataTransfer.getData(ASSET_MIME);
      if (assetUrl) {
        try {
          const blob = await (await fetch(assetUrl)).blob();
          const dataUrl = await new Promise<string>((res, rej) => {
            const reader = new FileReader();
            reader.onload = () => res(String(reader.result));
            reader.onerror = () => rej(reader.error);
            reader.readAsDataURL(blob);
          });
          const store = useFlowStore.getState();
          store.addNode('input.image', pos);
          const newNode = useFlowStore.getState().nodes.at(-1);
          if (newNode) store.updateParam(newNode.id, 'file', dataUrl);
        } catch (err) {
          setConnectError(err instanceof Error ? err.message : String(err));
        }
      }
    },
    [screenToFlowPosition, addNode, setConnectError],
  );

  // Keyboard: Cmd+D duplicate, Cmd+Z / Cmd+Shift+Z undo-redo, Space giữ = pan tạm
  useEffect(() => {
    let spaceHeld = false;
    let toolBeforeSpace: 'select' | 'pan' = 'select';
    const handler = (e: KeyboardEvent) => {
      const inField =
        e.target instanceof HTMLElement &&
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);
      if (inField) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        useFlowStore.getState().duplicateSelected();
      } else if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) useFlowStore.getState().redo();
        else useFlowStore.getState().undo();
      } else if (e.key === ' ' && !spaceHeld) {
        e.preventDefault();
        spaceHeld = true;
        toolBeforeSpace = useFlowStore.getState().tool;
        useFlowStore.getState().setTool('pan');
      } else if (e.key.toLowerCase() === 'v' && !mod) {
        useFlowStore.getState().setTool('select');
      } else if (e.key.toLowerCase() === 'h' && !mod) {
        useFlowStore.getState().setTool('pan');
      }
    };
    const upHandler = (e: KeyboardEvent) => {
      if (e.key === ' ' && spaceHeld) {
        spaceHeld = false;
        useFlowStore.getState().setTool(toolBeforeSpace);
      }
    };
    window.addEventListener('keydown', handler);
    window.addEventListener('keyup', upHandler);
    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('keyup', upHandler);
    };
  }, []);

  const handleAddNote = useCallback(() => {
    const el = wrapperRef.current;
    const rect = el?.getBoundingClientRect();
    const center = screenToFlowPosition({
      x: (rect?.left ?? 0) + (rect?.width ?? 800) / 2,
      y: (rect?.top ?? 0) + (rect?.height ?? 600) / 2,
    });
    addNote({ x: center.x - 104, y: center.y - 60 });
  }, [screenToFlowPosition, addNote]);

  return (
    <div ref={wrapperRef} className="relative flex-1 bg-[var(--bg)]">
      <ReactFlow<FlowNode>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onNodeDragStart={() => snapshot()}
        onDrop={onDrop}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }}
        deleteKeyCode={['Backspace', 'Delete']}
        panOnDrag={tool === 'pan' ? [0, 1, 2] : [1, 2]}
        selectionOnDrag={tool === 'select'}
        panOnScroll
        zoomOnPinch
        minZoom={0.15}
        maxZoom={2.5}
        fitView
        proOptions={{ hideAttribution: false }}
        defaultEdgeOptions={{ type: 'default' }}
        connectionLineStyle={{ stroke: '#8b7cf7', strokeWidth: 1.5 }}
        className={tool === 'pan' ? 'cursor-grab' : ''}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} color="var(--dots)" />
        <MiniMap
          pannable
          zoomable
          className="!bottom-4 !right-4 rounded-lg border border-[var(--border)]"
          style={{ background: 'var(--card)', width: 160, height: 110 }}
          nodeColor={(n) => {
            if (n.type === 'note') return '#fbbf24';
            try {
              const def = getDefinition((n.data as { defType: string }).defType);
              return CATEGORY_META[def.category].color;
            } catch {
              return '#52525b';
            }
          }}
          maskColor="var(--minimap-mask)"
        />
      </ReactFlow>

      <BottomToolbar onAddNote={handleAddNote} />

      {/* toast lỗi nối edge / lỗi flow */}
      {connectError && (
        <div className="absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-lg border border-red-500/40 bg-red-950/90 px-3.5 py-2 text-xs text-red-200 shadow-xl backdrop-blur">
          {connectError}
        </div>
      )}

      {/* empty state */}
      {nodes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
          <div className="text-center">
            <p className="text-sm text-[var(--t4)]">Canvas trống</p>
            <p className="mt-1 text-xs text-[var(--t5)]">
              Mở <span className="text-[var(--t3)]">Node Library</span> ở rail trái và kéo node vào đây
            </p>
            <div className="pointer-events-auto mt-4 flex flex-wrap justify-center gap-2">
              <button
                data-testid="load-demo"
                onClick={() => useFlowStore.getState().loadDemoFlow('sketch')}
                className="rounded-lg border border-violet-500/40 bg-violet-500/10 px-3.5 py-1.5 text-xs text-violet-300 transition hover:bg-violet-500/20"
              >
                Flow mẫu: Sketch → Render
              </button>
              <button
                data-testid="load-demo-bedroom"
                onClick={() => useFlowStore.getState().loadDemoFlow('bedroom')}
                className="rounded-lg border border-violet-500/40 bg-violet-500/10 px-3.5 py-1.5 text-xs text-violet-300 transition hover:bg-violet-500/20"
              >
                Flow mẫu: Phòng ngủ hoàn chỉnh
              </button>
              <button
                data-testid="load-demo-slide"
                onClick={() => useFlowStore.getState().loadDemoFlow('slide')}
                className="rounded-lg border border-orange-500/40 bg-orange-500/10 px-3.5 py-1.5 text-xs text-orange-300 transition hover:bg-orange-500/20"
              >
                Flow mẫu: Concept → Slide deck
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
