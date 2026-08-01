'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { stageTransition } from '@/lib/motion';
import { DEFAULT_PHASE } from '@/lib/phases';
import { getDefinition } from '@/lib/nodes/registry';
import { InteriorNode } from '@/components/nodes/InteriorNode';
import { NoteNode } from '@/components/nodes/NoteNode';
import { BottomToolbar } from '@/components/BottomToolbar';
import DemoLauncher from '@/components/DemoLauncher';
import { DND_MIME } from '@/components/NodeLibraryPanel';
import { ASSET_MIME } from '@/components/LibraryPanel';
import { CATEGORY_META } from '@/lib/types';
import { PresenceBar } from '@/components/collab/PresenceBar';
import { GroupOverlay } from '@/components/nodes/GroupOverlay';
import { useCollabStore } from '@/lib/collabStore';
import { classifyWheel, findScrollableAncestor, normalizeWheelDelta, zoomAtPoint } from '@/lib/input/wheel';
import Popover from '@/components/ui/Popover';

const nodeTypes = { interior: InteriorNode, note: NoteNode };

/** Style item menu nạp nhanh — cùng nhịp cỡ với MenuItem trong EditorCanvas.tsx (VIỆC 2). */
const quickLoadItemStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  height: 34,
  textAlign: 'left',
  padding: '0 12px',
  borderRadius: 8,
  border: 'none',
  background: 'transparent',
  color: 'var(--t2)',
  fontSize: 13,
  cursor: 'pointer',
};

export function FlowCanvas() {
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const onNodesChange = useFlowStore((s) => s.onNodesChange);
  const onEdgesChange = useFlowStore((s) => s.onEdgesChange);
  const onConnect = useFlowStore((s) => s.onConnect);
  const tool = useFlowStore((s) => s.tool);
  const snapGrid = useFlowStore((s) => s.snapGrid);
  const connectError = useFlowStore((s) => s.connectError);
  const setConnectError = useFlowStore((s) => s.setConnectError);
  const addNode = useFlowStore((s) => s.addNode);
  const addNote = useFlowStore((s) => s.addNote);
  const snapshot = useFlowStore((s) => s.snapshot);
  const workspace = useFlowStore((s) => s.workspace);
  const setPanel = useFlowStore((s) => s.setPanel);
  const updateParam = useFlowStore((s) => s.updateParam);

  const { screenToFlowPosition, getViewport, setViewport } = useReactFlow();
  const wrapperRef = useRef<HTMLDivElement>(null);

  /* NT3 (VIỆC ①, 28/07) — chuột phải trên NỀN canvas (không phải trên node) → menu nạp nhanh
   * tại chỗ con trỏ: Thêm ảnh từ máy · Từ thư viện · Dán URL. Tái dùng Popover.tsx (VIỆC 2) —
   * không viết lại logic lật hướng/viewport. `quickLoadPos` giữ TOẠ ĐỘ FLOW (không phải màn
   * hình) quy đổi ngay lúc mở menu, để node mới luôn rơi đúng chỗ vừa chuột phải dù panel/zoom
   * đổi trong lúc menu đang mở. */
  const [quickLoadMenu, setQuickLoadMenu] = useState<{ clientX: number; clientY: number; flowPos: { x: number; y: number } } | null>(null);
  const [pasteUrl, setPasteUrl] = useState('');
  const quickLoadFileRef = useRef<HTMLInputElement>(null);

  const onPaneContextMenu = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      e.preventDefault();
      const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      setQuickLoadMenu({ clientX: e.clientX, clientY: e.clientY, flowPos });
      setPasteUrl('');
    },
    [screenToFlowPosition],
  );

  const addImageNodeAt = useCallback(
    (dataUrl: string, flowPos: { x: number; y: number }) => {
      addNode('input.image', flowPos);
      const node = useFlowStore.getState().nodes.at(-1);
      if (node) updateParam(node.id, 'file', dataUrl);
    },
    [addNode, updateParam],
  );

  const onQuickLoadFiles = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      e.target.value = '';
      const at = quickLoadMenu?.flowPos ?? { x: 0, y: 0 };
      setQuickLoadMenu(null);
      let i = 0;
      for (const f of files) {
        const dataUrl = await new Promise<string>((res, rej) => {
          const reader = new FileReader();
          reader.onload = () => res(String(reader.result));
          reader.onerror = () => rej(reader.error);
          reader.readAsDataURL(f);
        });
        addImageNodeAt(dataUrl, { x: at.x + i * 40, y: at.y + i * 40 });
        i++;
      }
    },
    [quickLoadMenu, addImageNodeAt],
  );

  const onQuickLoadPasteUrl = useCallback(() => {
    const url = pasteUrl.trim();
    if (!url || !quickLoadMenu) return;
    addImageNodeAt(url, quickLoadMenu.flowPos);
    setQuickLoadMenu(null);
  }, [pasteUrl, quickLoadMenu, addImageNodeAt]);

  /* Chuột lăn = ZOOM trên canvas node (đồng bộ với chặng CAD).
   *
   * React Flow đang bật `panOnScroll` + `zoomOnPinch` — đúng cho trackpad (cuộn 2 ngón = pan, chụm
   * = zoom) nhưng người dùng CHUỘT thì lăn chỉ pan, muốn zoom phải giữ Ctrl. Ở đây chặn riêng cú
   * lăn chuột thật (phân loại bằng `lib/input/wheel.ts`) và tự zoom quanh con trỏ; trackpad/pinch
   * vẫn để React Flow xử lý nguyên vẹn.
   *
   * `capture: true` + `stopPropagation()` để cú lăn chuột KHÔNG lọt xuống pane của React Flow
   * (nếu lọt, nó vừa zoom vừa pan một lúc). `passive: false` để `preventDefault()` có tác dụng. */
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    function onWheelNative(e: WheelEvent) {
      const { dx, dy } = normalizeWheelDelta(e);
      // Panel/danh sách bên trong canvas cuộn được thì nhường cho nó.
      if (findScrollableAncestor(e.target as Element, dx, dy, el)) return;

      const intent = classifyWheel(e);
      // Chỉ giành lấy cú LĂN CHUỘT. Pinch (source 'pinch') và trackpad pan để React Flow lo.
      if (intent.kind !== 'zoom' || intent.source !== 'mouse') return;

      e.preventDefault();
      e.stopPropagation();
      const pane = el!.querySelector('.react-flow__pane') ?? el!;
      const r = pane.getBoundingClientRect();
      // minZoom/maxZoom phải khớp props đặt trên <ReactFlow> bên dưới.
      setViewport(zoomAtPoint(getViewport(), e.clientX - r.left, e.clientY - r.top, intent.factor, 0.15, 2.5));
    }

    el.addEventListener('wheel', onWheelNative, { passive: false, capture: true });
    return () => el.removeEventListener('wheel', onWheelNative, { capture: true });
  }, [getViewport, setViewport]);

  // ===== Collab thời-gian-thực (presence + live cursor, KHÔNG AI) =====
  const user = useFlowStore((s) => s.user);
  const currentFlowId = useFlowStore((s) => s.currentFlowId);
  const collabStart = useCollabStore((s) => s.start);
  const collabStop = useCollabStore((s) => s.stop);
  const setLocalCursor = useCollabStore((s) => s.setLocalCursor);

  useEffect(() => {
    // danh tính: user đăng nhập, hoặc guest ổn định theo tab (sessionStorage)
    let id = user?.id;
    let name = user?.name;
    if (!id) {
      let guestId = '';
      try {
        guestId = sessionStorage.getItem('interiorflow.guestId') ?? '';
        if (!guestId) {
          guestId = `guest_${Math.random().toString(36).slice(2, 9)}`;
          sessionStorage.setItem('interiorflow.guestId', guestId);
        }
      } catch {
        guestId = `guest_${Math.random().toString(36).slice(2, 9)}`;
      }
      id = guestId;
      name = 'Khách';
    }
    const flowId = currentFlowId ?? 'local';
    collabStart(flowId, { userId: id, name: name ?? 'Khách' });
    return () => collabStop();
  }, [user?.id, user?.name, currentFlowId, collabStart, collabStop]);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const p = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      setLocalCursor(p.x, p.y);
    },
    [screenToFlowPosition, setLocalCursor],
  );

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

  const notice = useFlowStore((s) => s.notice);
  const setNotice = useFlowStore((s) => s.setNotice);

  // Toast lỗi tự tắt sau 3.5s
  useEffect(() => {
    if (!connectError) return;
    const t = setTimeout(() => setConnectError(null), 3500);
    return () => clearTimeout(t);
  }, [connectError, setConnectError]);

  // Toast thông báo (smart-import) tự tắt sau 4.5s
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4500);
    return () => clearTimeout(t);
  }, [notice, setNotice]);

  // Drag & drop từ Node Library / Thư viện ảnh / FILE THÔ TỪ MÁY (smart-import)
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
        return;
      }
      // FILE THÔ kéo từ Finder/Explorer → smart-import (tự chuyển định dạng, giữ thông số gốc)
      const files = Array.from(e.dataTransfer.files || []);
      if (files.length) {
        const { smartImportImage, SmartImportError } = await import('@/lib/images/smart-ingest');
        // Mỗi ảnh 1 node Import Image, xếp so le để không chồng.
        let placed = 0;
        for (const file of files) {
          const nodePos = { x: pos.x + placed * 40, y: pos.y + placed * 40 };
          const store = useFlowStore.getState();
          store.addNode('input.image', nodePos);
          const node = useFlowStore.getState().nodes.at(-1);
          try {
            const { dataUrl, meta } = await smartImportImage(file);
            if (node) store.updateParam(node.id, 'file', dataUrl);
            setNotice(meta.converted ? `✓ ${meta.note}` : `✓ ${meta.note}`);
          } catch (err) {
            // node vừa tạo bị bỏ trống → gỡ đi cho sạch
            if (node) {
              const s2 = useFlowStore.getState();
              useFlowStore.setState({ nodes: s2.nodes.filter((n) => n.id !== node.id) });
            }
            setConnectError(
              err instanceof SmartImportError ? err.message : `Không nạp được “${file.name}”.`,
            );
          }
          placed++;
        }
      }
    },
    [screenToFlowPosition, addNode, setConnectError, setNotice],
  );

  // Keyboard (đồng bộ Mac ⌘ / Windows Ctrl): mod+D nhân bản, mod+Z undo, mod+⇧Z & mod+Y redo, Space giữ = pan tạm
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
      } else if (mod && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        useFlowStore.getState().groupSelected();
      } else if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) useFlowStore.getState().redo();
        else useFlowStore.getState().undo();
      } else if (mod && e.key.toLowerCase() === 'y') {
        // redo kiểu Windows (Ctrl+Y) — song song ⌘⇧Z của Mac
        e.preventDefault();
        useFlowStore.getState().redo();
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
    <div ref={wrapperRef} onPointerMove={onPointerMove} className="relative flex-1 bg-[var(--bg)]">
      <ReactFlow<FlowNode>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onNodeDragStart={() => snapshot()}
        onPaneContextMenu={onPaneContextMenu}
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
        snapToGrid={snapGrid}
        snapGrid={[16, 16]}
        minZoom={0.15}
        maxZoom={2.5}
        /* Bán kính bắt kết nối rộng hơn (mặc định 20) → chạm-kéo nối edge dễ
           trúng port trên màn cảm ứng foldable mà không cần ngắm chính xác. */
        connectionRadius={38}
        fitView
        proOptions={{ hideAttribution: false }}
        defaultEdgeOptions={{ type: 'default' }}
        connectionLineStyle={{ stroke: '#8b7cf7', strokeWidth: 2 }}
        className={tool === 'pan' ? 'cursor-grab' : ''}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} color="var(--dots)" />
        {/* Ẩn khi canvas ít node — viewport gần như trùng khung minimap, chỉ thấy 1 khối đen rỗng */}
        {nodes.length >= 3 && (
          <MiniMap
            pannable
            zoomable
            className="!bottom-4 !right-4 hidden rounded-lg border border-[var(--border)] md:block"
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
        )}
      </ReactFlow>

      {/* Group overlay — vẽ khung bao quanh nhóm node (tự bọc ViewportPortal bên trong) */}
      <GroupOverlay />

      {/* Collab: 7.4.11 (29/07) — LiveCursors TẠM ẨN, phương án A đã duyệt
          (docs/CHOT-SO-MA-2026-07-29.md §D): con trỏ hứa đồng bộ real-time nhưng
          nodes/edges/params KHÔNG hề đồng bộ (chỉ poll 900ms vị trí chuột) — lỗi tin cậy,
          người dùng thấy con trỏ bay tưởng đang cộng tác thật rồi ghi đè lẫn nhau.
          PresenceBar GIỮ NGUYÊN — "ai đang online" là thông tin thật, không hứa suông. */}
      <PresenceBar />

      <BottomToolbar onAddNote={handleAddNote} />

      {/* NT3 (VIỆC ①) — menu nạp nhanh khi chuột phải trên nền canvas. */}
      <input ref={quickLoadFileRef} type="file" accept="image/*" multiple hidden onChange={onQuickLoadFiles} />
      {quickLoadMenu && (
        <Popover
          anchorX={quickLoadMenu.clientX}
          anchorY={quickLoadMenu.clientY}
          onDismiss={() => setQuickLoadMenu(null)}
          style={{
            width: 220,
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 4,
            boxShadow: '0 8px 24px rgba(0,0,0,.35)',
            userSelect: 'none',
          }}
        >
          <button
            type="button"
            onClick={() => quickLoadFileRef.current?.click()}
            style={quickLoadItemStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--field)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            Thêm ảnh từ máy
          </button>
          <button
            type="button"
            onClick={() => {
              setPanel('assets');
              setQuickLoadMenu(null);
            }}
            style={quickLoadItemStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--field)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            Từ thư viện
          </button>
          <div style={{ display: 'flex', gap: 6, padding: '6px 8px 4px' }}>
            <input
              autoFocus
              value={pasteUrl}
              onChange={(e) => setPasteUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onQuickLoadPasteUrl();
                if (e.key === 'Escape') setQuickLoadMenu(null);
              }}
              placeholder="Dán URL ảnh…"
              style={{
                flex: 1,
                minWidth: 0,
                padding: '5px 8px',
                borderRadius: 7,
                border: '1px solid var(--border)',
                background: 'var(--field)',
                color: 'var(--t1)',
                fontSize: 12,
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={onQuickLoadPasteUrl}
              disabled={!pasteUrl.trim()}
              style={{
                padding: '5px 10px',
                borderRadius: 7,
                border: '1px solid var(--accent)',
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
                fontSize: 12,
                cursor: pasteUrl.trim() ? 'pointer' : 'default',
                opacity: pasteUrl.trim() ? 1 : 0.5,
              }}
            >
              Dán
            </button>
          </div>
        </Popover>
      )}

      {/* toast lỗi nối edge / lỗi flow */}
      {connectError && (
        <div className="absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-lg border border-red-500/40 bg-red-950/90 px-3.5 py-2 text-xs text-red-200 shadow-xl backdrop-blur">
          {connectError}
        </div>
      )}

      {/* toast thông báo smart-import (chuyển định dạng, giữ thông số gốc) */}
      {notice && !connectError && (
        <div className="absolute left-1/2 top-4 z-30 -translate-x-1/2 max-w-[92vw] rounded-lg border border-emerald-500/40 bg-emerald-950/90 px-3.5 py-2 text-xs text-emerald-100 shadow-xl backdrop-blur">
          {notice}
        </div>
      )}

      {/* empty state — mở đầu bằng demo THỰC TẾ LỌC theo chặng. Đổi chặng → cụm demo
          fade/trồi mượt (mask cảm giác đổi nội dung), key theo workspace. */}
      {nodes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
          <div className="max-w-[520px] text-center">
            <p className="text-sm text-[var(--t4)]">Canvas trống</p>
            <p className="mt-1 text-xs text-[var(--t5)]">
              Mở <span className="text-[var(--t3)]">Node Library</span> ở rail trái để kéo node — hoặc bắt đầu bằng 1 demo thực tế:
            </p>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={workspace ?? DEFAULT_PHASE}
                variants={stageTransition}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <DemoLauncher />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
