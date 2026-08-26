'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  type IsValidConnection,
  type Edge,
  type OnConnectStart,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useFlowStore, type FlowNode, type Tool, type DrawTool } from '@/lib/store';
import { getDefinition, NODE_DEFINITIONS } from '@/lib/nodes/registry';
import { nodeScore } from '@/lib/nodes/search';
import { findMistypedEdges } from '@/lib/nodes/edge-validity';
import { InteriorNode } from '@/components/nodes/InteriorNode';
import { nodeIconFor } from '@/components/nodes/NodeIcons';
import { NoteNode } from '@/components/nodes/NoteNode';
import { BottomToolbar } from '@/components/BottomToolbar';
import { DND_MIME, MAT_MIME, MINDMAP_MIME } from '@/components/NodeLibraryPanel';
import { instantiateConceptMindmap, MINDMAP_TEMPLATE_ID } from '@/lib/render-studio/mindmap-templates';
import { ASSET_MIME } from '@/components/LibraryPanel';
import { CATEGORY_META, DATA_TYPE_COLORS, type NodeCategory, type NodeDefinition } from '@/lib/types';
import { PresenceBar } from '@/components/collab/PresenceBar';
import { GroupOverlay } from '@/components/nodes/GroupOverlay';
import { MacroSelectionToolbar } from '@/components/nodes/MacroSelectionToolbar';
import { MacroShelf } from '@/components/nodes/MacroShelf';
import { DrawLayer } from '@/components/render-studio/DrawLayer';
import DrawToolbar from '@/components/render-studio/DrawToolbar';
import { useCollabStore } from '@/lib/collabStore';
import { classifyWheel, findScrollableAncestor, normalizeWheelDelta, zoomAtPoint } from '@/lib/input/wheel';
import Popover from '@/components/ui/Popover';

const nodeTypes = { interior: InteriorNode, note: NoteNode };

// G2 phần (3) — hằng số vẽ tay, module-level (không đổi giữa các render — hoisting ra ngoài
// component để useCallback không phải liệt kê làm dependency, tránh tạo lại hàm mỗi render).
const DRAW_COLOR: Record<DrawTool, string> = { pen: '#2b2b30', marker: '#6a57f5', highlight: '#f5c542' };
const DRAW_WIDTH = 2;
const ERASE_RADIUS = 24; // bán kính tẩy, đơn vị flow-space

/** Menu thêm nút chuột phải (mock-if-bang-nut.html màn 04) — CÙNG thứ tự nhóm với ⌘K
 *  (CommandPalette.tsx CATEGORY_ORDER), không tự đặt taxonomy mới theo mock (xem báo cáo
 *  so sánh: đổi nhóm theo vai-trò-pipeline là quyết định nội dung riêng, ngoài phạm vi việc này). */
const NODE_CATEGORY_ORDER = ['INPUT', 'AI_GENERATE', 'AI_EDIT', 'SLIDE', 'UTILITY', 'OUTPUT'] as const;

/** Style item menu nạp nhanh — cùng nhịp cỡ với MenuItem trong EditorCanvas.tsx (VIỆC 2). */
const quickLoadItemStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  height: 34,
  textAlign: 'left',
  padding: '0 12px',
  borderRadius: 10,
  border: 'none',
  background: 'transparent',
  color: 'var(--t2)',
  fontSize: 'var(--fs-ui)',
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
  const setPanel = useFlowStore((s) => s.setPanel);
  const updateParam = useFlowStore((s) => s.updateParam);
  const currentFlowId = useFlowStore((s) => s.currentFlowId);

  const { screenToFlowPosition, getViewport, setViewport, fitView } = useReactFlow();
  const wrapperRef = useRef<HTMLDivElement>(null);

  /* G4-1a (đêm 04/08, BAO-CAO-DEM mục 3) — canvas TRỐNG thì đứng ở zoom 100% (defaultViewport),
   * KHÔNG fitView (fitView trên 0 node tụt thẳng về minZoom 0.15 → "zoom 15% trống trơn").
   * Có node (kể cả hydrate muộn sau mount) → fit MỘT lần, maxZoom 1 để 1-2 node không bị
   * phóng đại sát mặt. Prop `fitView={nodes.length > 0}` lo ca "đã có node ngay lúc mount". */
  const didFitRef = useRef(false);
  useEffect(() => {
    if (didFitRef.current || nodes.length === 0) return;
    didFitRef.current = true;
    // chờ 1 frame cho React Flow đo xong kích thước node rồi mới fit
    requestAnimationFrame(() => fitView({ padding: 0.2, maxZoom: 1 }));
  }, [nodes.length, fitView]);

  /* Đổi flow KHÔNG remount canvas → viewport flow cũ dính lại (thấy khi verify: flow mới trống
   * vẫn 15% thừa hưởng từ flow trước). Đổi currentFlowId → cho fit lại; flow trống → về 100%. */
  const prevFlowIdRef = useRef(currentFlowId);
  useEffect(() => {
    if (prevFlowIdRef.current === currentFlowId) return;
    prevFlowIdRef.current = currentFlowId;
    didFitRef.current = false;
    if (useFlowStore.getState().nodes.length === 0) setViewport({ x: 0, y: 0, zoom: 1 });
  }, [currentFlowId, setViewport]);

  /* NT3 (VIỆC ①, 28/07) — chuột phải trên NỀN canvas (không phải trên node) → menu nạp nhanh
   * tại chỗ con trỏ: Thêm ảnh từ máy · Từ thư viện · Dán URL. Tái dùng Popover.tsx (VIỆC 2) —
   * không viết lại logic lật hướng/viewport. `quickLoadPos` giữ TOẠ ĐỘ FLOW (không phải màn
   * hình) quy đổi ngay lúc mở menu, để node mới luôn rơi đúng chỗ vừa chuột phải dù panel/zoom
   * đổi trong lúc menu đang mở. */
  const [quickLoadMenu, setQuickLoadMenu] = useState<{ clientX: number; clientY: number; flowPos: { x: number; y: number } } | null>(null);
  const [pasteUrl, setPasteUrl] = useState('');
  const [nodeQuery, setNodeQuery] = useState('');
  const quickLoadFileRef = useRef<HTMLInputElement>(null);
  const aiTier = useFlowStore((s) => s.aiTier);

  const onPaneContextMenu = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      e.preventDefault();
      const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      setQuickLoadMenu({ clientX: e.clientX, clientY: e.clientY, flowPos });
      setPasteUrl('');
      setNodeQuery('');
    },
    [screenToFlowPosition],
  );

  /** Danh mục nút cho menu chuột phải — tái dùng NODE_DEFINITIONS + nodeScore (CÙNG kho tìm
   *  kiếm với ⌘K/Node Library, lib/nodes/search.ts), không viết bộ lọc riêng lần 3. Mức 1
   *  (Không AI) ẩn node AI, đúng khuôn CommandPalette.tsx. */
  const nodeMenuGroups = useMemo(() => {
    const noAi = aiTier === 1;
    const pool = NODE_DEFINITIONS.filter((d) => !(noAi && (d.category === 'AI_GENERATE' || d.category === 'AI_EDIT')));
    const q = nodeQuery.trim();
    const scored = pool
      .map((d) => ({ d, score: nodeScore(d, q) }))
      .filter((x) => x.score >= 0)
      .sort((a, b) => b.score - a.score);
    const byCat = new Map<NodeCategory, { d: NodeDefinition; score: number }[]>();
    for (const item of scored) {
      const arr = byCat.get(item.d.category);
      if (arr) arr.push(item);
      else byCat.set(item.d.category, [item]);
    }
    return NODE_CATEGORY_ORDER.filter((c) => byCat.has(c)).map((c) => ({ category: c as NodeCategory, items: byCat.get(c)! }));
  }, [aiTier, nodeQuery]);

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
  // (currentFlowId đã select ở đầu component — dùng chung cho cả reset-viewport lẫn collab)
  const user = useFlowStore((s) => s.user);
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

  // G2 phần (1) — tool='frame': kéo-vẽ khung phòng trên NỀN canvas (không trúng node/edge).
  // Preview vẽ bằng toạ độ MÀN HÌNH tương đối `wrapperRef` (đơn giản hơn ViewportPortal — preview
  // đang kéo không cần chính xác flow-space, chỉ quy đổi 1 LẦN lúc thả chuột qua
  // `screenToFlowPosition`, xem `onFramePointerUp`).
  const [frameDraft, setFrameDraft] = useState<{ start: { x: number; y: number }; now: { x: number; y: number } } | null>(null);

  // G2 phần (3) — tool='pen'|'marker'|'highlight': tích luỹ điểm FLOW-SPACE trực tiếp (khác
  // frameDraft — vẽ tay cần nhiều điểm trung gian cho đường cong mượt, quy đổi mỗi lần di chuột
  // chứ không phải 1 lần lúc thả). `DrawLayer.tsx` render `liveStroke` này đè lên các nét đã lưu.
  const [drawDraft, setDrawDraft] = useState<{ tool: DrawTool; points: { x: number; y: number }[] } | null>(null);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const p = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      setLocalCursor(p.x, p.y);
      if (frameDraft) {
        const rect = wrapperRef.current?.getBoundingClientRect();
        if (rect) setFrameDraft((d) => (d ? { ...d, now: { x: e.clientX - rect.left, y: e.clientY - rect.top } } : d));
      }
      if (drawDraft) setDrawDraft((d) => (d ? { ...d, points: [...d.points, p] } : d));
      // eraser giữ chuột kéo qua đâu tẩy tới đó (e.buttons===1 = nút trái đang nhấn khi move).
      if (tool === 'eraser' && e.buttons === 1) useFlowStore.getState().eraseAt(p, ERASE_RADIUS);
    },
    [screenToFlowPosition, setLocalCursor, frameDraft, drawDraft, tool],
  );

  const onCanvasPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Chỉ bắt khi bấm lên NỀN canvas thật (react-flow__pane) — bấm trúng node/edge/toolbar nổi
      // thì để hành vi mặc định (chọn/kéo node) chạy bình thường.
      if (!(e.target as HTMLElement).classList.contains('react-flow__pane')) return;
      if (tool === 'frame') {
        const rect = wrapperRef.current?.getBoundingClientRect();
        if (!rect) return;
        const p = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        setFrameDraft({ start: p, now: p });
      } else if (tool === 'pen' || tool === 'marker' || tool === 'highlight') {
        const p = screenToFlowPosition({ x: e.clientX, y: e.clientY });
        setDrawDraft({ tool, points: [p] });
      } else if (tool === 'eraser') {
        snapshot(); // ĐÚNG 1 lần lúc bắt đầu kéo — khuôn `onNodeDragStart={() => snapshot()}`.
        const p = screenToFlowPosition({ x: e.clientX, y: e.clientY });
        useFlowStore.getState().eraseAt(p, ERASE_RADIUS);
      }
    },
    [tool, screenToFlowPosition, snapshot],
  );

  const onCanvasPointerUp = useCallback(() => {
    if (frameDraft) {
      const rect = wrapperRef.current?.getBoundingClientRect();
      setFrameDraft(null);
      if (rect) {
        const p1 = screenToFlowPosition({ x: frameDraft.start.x + rect.left, y: frameDraft.start.y + rect.top });
        const p2 = screenToFlowPosition({ x: frameDraft.now.x + rect.left, y: frameDraft.now.y + rect.top });
        const width = Math.abs(p2.x - p1.x);
        const height = Math.abs(p2.y - p1.y);
        if (width >= 24 && height >= 24) {
          // quá nhỏ — coi như bấm nhầm, không tạo khung
          useFlowStore.getState().createRoomFrame(
            { x: Math.min(p1.x, p2.x), y: Math.min(p1.y, p2.y), width, height },
            'Phòng mới',
          );
          useFlowStore.getState().setTool('select'); // thao tác 1-lần — tự về select, khuôn addNode() cũ.
        }
      }
    }
    if (drawDraft) {
      useFlowStore.getState().addStroke({ tool: drawDraft.tool, points: drawDraft.points, color: DRAW_COLOR[drawDraft.tool], width: DRAW_WIDTH });
      setDrawDraft(null);
      // KHÔNG setTool('select') — vẽ tay là tool "dính" (sticky), vẽ liên tiếp nhiều nét như
      // Miro/Figma thật, khác 'frame' (thao tác 1-lần). Đổi tool là hành động chủ động của user
      // (bấm nút khác trong DrawToolbar).
    }
  }, [frameDraft, drawDraft, screenToFlowPosition]);

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

  /* Kéo dây từ 1 cổng — ghi kiểu dữ liệu cổng nguồn vào store để InteriorNode tô sáng cổng
     nhận cùng kiểu / mờ cổng khác kiểu trong lúc kéo (mock-if-bang-nut.html màn 03). */
  const setConnectFromType = useFlowStore((s) => s.setConnectFromType);
  const connectFromType = useFlowStore((s) => s.connectFromType);
  const onConnectStart: OnConnectStart = useCallback(
    (_event, { nodeId, handleId }) => {
      if (!nodeId || !handleId) return;
      const node = useFlowStore.getState().nodes.find((n) => n.id === nodeId);
      if (!node) return;
      const nodeDef = getDefinition(node.data.defType);
      const port = [...nodeDef.outputs, ...nodeDef.inputs].find((p) => p.id === handleId);
      if (port) setConnectFromType(port.dataType);
    },
    [setConnectFromType],
  );
  const onConnectEnd = useCallback(() => setConnectFromType(null), [setConnectFromType]);

  /* ② `docs/mocks/Bảng nút.dc.html` màn 02 — DÂY ĐANG CHẠY vẽ nét đứt bò dọc dây
     (`@keyframes bn-dash` + `.bn-edge-running`, app/globals.css). "Đang chạy" = dây CHẢY VÀO
     một node đang chạy/xếp hàng: đúng ảnh trong mock (node nguồn đã "Xong", dây tới node đang
     render mới chạy nét). Node nguồn đang chạy thì chưa có gì để chảy đi ⇒ không tính.
     Chỉ THÊM class, không đụng `style` của cạnh (màu/độ dày vẫn do `edgeStyleFor` quyết). */
  const busyNodeIds = useMemo(() => {
    const s = new Set<string>();
    for (const n of nodes) {
      const st = n.data?.run?.status;
      if (st === 'running' || st === 'queued') s.add(n.id);
    }
    return s;
  }, [nodes]);
  /* ③ (vế thứ hai) `docs/mocks/Bảng nút.dc.html` màn 01, dòng 141 — DÂY NỐI SAI KIỂU vẽ
     `stroke:var(--danger); stroke-dasharray:6 5`, và caption màn 01 nói rõ "hiện đỏ đứt đoạn".
     Thanh trạng thái đếm "M nối sai" (StatusBar) mà bảng không chỉ được dây nào thì con số đó là
     ngõ cụt — người dùng biết có lỗi, không biết lỗi ở đâu. Dùng CHUNG `findMistypedEdges` với
     StatusBar (một luật so kiểu, `lib/nodes/edge-validity.ts`), không viết luật thứ hai.
     Màu/nét đặt INLINE vì `edgeStyleFor` (lib/store.ts) cũng đặt inline — class sẽ thua. */
  const mistypedEdgeIds = useMemo(() => {
    const found = findMistypedEdges(nodes, edges, getDefinition);
    return new Set(found.map((m) => m.edgeId));
  }, [nodes, edges]);

  const renderEdges = useMemo(() => {
    if (busyNodeIds.size === 0 && mistypedEdgeIds.size === 0) return edges;
    return edges.map((e) =>
      mistypedEdgeIds.has(e.id)
        ? {
            ...e,
            className: [e.className, 'bn-edge-bad'].filter(Boolean).join(' '),
            style: { ...e.style, stroke: 'var(--danger)', strokeDasharray: '6 5' },
          }
        : busyNodeIds.has(e.target)
        ? {
            ...e,
            className: [e.className, 'bn-edge-running'].filter(Boolean).join(' '),
            // `edgeStyleFor` (lib/store.ts) gán `strokeDasharray:'6 3'` INLINE cho luồng dữ liệu
            // (text/number/table) — inline luôn thắng class ⇒ phải ghi đè tại đây, không thể để
            // CSS lo. Dây ảnh/video/mask không có dasharray inline nên nhận '6 6' của class;
            // ghi đè ở đây cho cả hai loại thì mẫu nét đồng nhất đúng mock (6 6).
            style: { ...e.style, strokeDasharray: '6 6' },
          }
        : e,
    );
  }, [edges, busyNodeIds, mistypedEdgeIds]);

  /* Dây ĐANG KÉO: cùng nét đứt chạy, và mang MÀU CỔNG nguồn (`--p-*` theo kiểu dữ liệu) thay
     cho hex tím cứng cũ — nhìn là biết đang kéo luồng ảnh hay luồng tham số. */
  const connectionLineStyle = useMemo(
    () => ({
      stroke: connectFromType ? DATA_TYPE_COLORS[connectFromType] : 'var(--p-img)',
      strokeWidth: 2,
      strokeDasharray: '6 6',
      animation: 'bn-dash 1s linear infinite',
    }),
    [connectFromType],
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
        // G2 phần (5) — swatch vật liệu ĐI KÈM DND_MIME (không thay thế): sau khi tạo đúng
        // loại node (`util.materialnote`), đọc thêm matId/name/code/... để updateParam ngay,
        // đúng khuôn nhánh ASSET_MIME bên dưới (nodes.at(-1) lấy node vừa thêm).
        const matJson = e.dataTransfer.getData(MAT_MIME);
        if (matJson) {
          try {
            const p = JSON.parse(matJson) as Record<string, string>;
            const store = useFlowStore.getState();
            const newNode = store.nodes.at(-1);
            if (newNode) {
              for (const [k, v] of Object.entries(p)) store.updateParam(newNode.id, k, v);
            }
          } catch {
            // JSON hỏng (kéo thả lạ) — bỏ qua, node vẫn tồn tại trống params, không crash.
          }
        }
        return;
      }
      // G2 phần (6) — "Form lập luận" kéo từ kệ: MIME riêng (không đi qua DND_MIME vì mindmap
      // dựng từ nhiều `note`, không phải 1 NodeDefinition qua addNode). Dùng đúng vị trí thả làm
      // tâm, khác đường bấm (luôn dựng giữa canvas).
      const mindmapId = e.dataTransfer.getData(MINDMAP_MIME);
      if (mindmapId === MINDMAP_TEMPLATE_ID) {
        const store = useFlowStore.getState();
        instantiateConceptMindmap(pos, {
          addNote: store.addNote,
          updateNote: store.updateNote,
          getLastNodeId: () => useFlowStore.getState().nodes.at(-1)?.id,
        });
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
    let toolBeforeSpace: Tool = 'select';
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
    <div
      ref={wrapperRef}
      onPointerMove={onPointerMove}
      onPointerDown={onCanvasPointerDown}
      onPointerUp={onCanvasPointerUp}
      className="flow-canvas-wrap relative flex-1 bg-[var(--bg)]"
    >
      {/* G4-1a — attribution React Flow: GIỮ theo license nhưng kín đáo (bỏ nền trắng — lộ rõ ở
          theme Tối). Selector có "__" nên không viết được bằng arbitrary variant Tailwind
          (underscore bị đổi thành space) → style tag cục bộ. */}
      <style>{`.flow-canvas-wrap .react-flow__attribution{background:transparent;font-size:9px;opacity:.55}`}</style>
      <ReactFlow<FlowNode>
        nodes={nodes}
        edges={renderEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onNodeDragStart={() => snapshot()}
        // G2 phần (1) — sau khi thả node, tự cập nhật thành viên khung phòng (rơi vào rect nào
        // thì gia nhập, ra ngoài thì rời) — CHỈ áp cho group có `rect` (xem syncRoomMembership).
        onNodeDragStop={(_, node) => useFlowStore.getState().syncRoomMembership(node.id, node.position)}
        onPaneContextMenu={onPaneContextMenu}
        onDrop={onDrop}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }}
        deleteKeyCode={['Backspace', 'Delete']}
        // tool='frame'|'pen'|'marker'|'highlight'|'eraser' — tắt cả pan-kéo và rubber-band select
        // mặc định, nhường quyền bắt pointer cho onCanvasPointerDown/Up (vẽ khung/nét) ở div cha.
        panOnDrag={tool === 'pan' ? [0, 1, 2] : tool === 'select' ? [1, 2] : false}
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
        /* DỌN ĐỊA TẦNG (Hoà 04/08, bug BAO-CAO-DEM 23:1x mục 3): fitView với 0 node kéo viewport
           về minZoom (0.15 = "15%" trong ảnh Hoà chê) — canvas trống phải đứng ở 100%. fitView
           là prop lúc mount: có node thì fit như cũ, trống thì bỏ qua (React Flow mặc định zoom 1). */
        fitView={nodes.length > 0}
        /* Gộp khi merge 03/08 (TỔNG): 2 prop từ nhanh-g4 (G4-1a) — fit không phóng quá 100%,
           viewport mặc định đứng 100%. Cùng mục tiêu với fix CHINH-6, không mâu thuẫn. */
        fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: false }}
        /* attribution GIỮ theo license React Flow (không ẩn) nhưng đặt gọn góc trái dưới —
           góc phải dưới là chỗ MiniMap, khi map ẩn chữ đứng trơ một mình (Hoà chê 04/08). */
        attributionPosition="bottom-left"
        defaultEdgeOptions={{ type: 'default' }}
        connectionLineStyle={connectionLineStyle}
        className={tool === 'pan' ? 'cursor-grab' : tool === 'select' ? '' : 'cursor-crosshair'}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} color="var(--dots)" />
        {/* Ẩn khi canvas ít node — viewport gần như trùng khung minimap, chỉ thấy 1 khối đen rỗng */}
        {nodes.length >= 3 && (
          <MiniMap
            pannable
            zoomable
            aria-label="Tổng quan bảng làm việc"
            className="!bottom-auto !right-4 !top-4 hidden rounded-[10px] border border-[var(--border)] shadow-[0_6px_20px_rgba(40,38,35,.10)] md:block"
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

      {/* G2 phần (1) — preview khung phòng đang kéo-vẽ (toạ độ MÀN HÌNH tương đối wrapperRef,
          xem chú thích frameDraft phía trên). pointer-events-none — không chặn onCanvasPointerUp
          bắt trên chính div cha. */}
      {frameDraft && (
        <div
          className="pointer-events-none absolute z-10 rounded-md border-2 border-dashed border-[var(--accent)] bg-[var(--accent)]/10"
          style={{
            left: Math.min(frameDraft.start.x, frameDraft.now.x),
            top: Math.min(frameDraft.start.y, frameDraft.now.y),
            width: Math.abs(frameDraft.now.x - frameDraft.start.x),
            height: Math.abs(frameDraft.now.y - frameDraft.start.y),
          }}
        />
      )}

      {/* Group overlay — vẽ khung bao quanh nhóm node (tự bọc ViewportPortal bên trong) */}
      <GroupOverlay />

      {/* NÚT TỔNG (docs/mocks/mock-if-nut-tong.html) — pill "Gom thành nút tổng" khi chọn ≥2 node
          + kệ "Nút tổng của tôi" (chỉ hiện khi flow đã có ≥1 nút tổng). */}
      <MacroSelectionToolbar />
      <MacroShelf />

      {/* G2 phần (3) — nét vẽ tay đã lưu + nét đang vẽ dở (flow-space, tự bọc ViewportPortal). */}
      <DrawLayer
        liveStroke={
          drawDraft ? { id: '__live__', tool: drawDraft.tool, points: drawDraft.points, color: DRAW_COLOR[drawDraft.tool], width: DRAW_WIDTH } : null
        }
      />
      <DrawToolbar />

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
            width: 264,
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 10,
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
                borderRadius: 6,
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
                borderRadius: 6,
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

          {/* Hợp nhất với danh mục nút của CommandPalette (⌘K, cùng NODE_DEFINITIONS/nodeScore) —
              trước đây menu này CHỈ có 3 mục ảnh, phải mở ⌘K riêng để thêm node khác
              (mock-if-bang-nut.html màn 04). Không sửa CommandPalette.tsx (vẫn phục vụ ⌘K toàn cục). */}
          <div style={{ height: 1, background: 'var(--border)', margin: '4px 4px' }} />
          <div style={{ padding: '6px 8px 4px' }}>
            <input
              value={nodeQuery}
              onChange={(e) => setNodeQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setQuickLoadMenu(null);
              }}
              placeholder="Tìm nút để thêm…"
              style={{
                width: '100%',
                padding: '5px 8px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--field)',
                color: 'var(--t1)',
                fontSize: 12,
                outline: 'none',
              }}
            />
          </div>
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            {nodeMenuGroups.length === 0 && (
              <p style={{ margin: 0, padding: '10px 12px', fontSize: 11.5, color: 'var(--t5)', textAlign: 'center' }}>
                Không có nút nào khớp “{nodeQuery}”.
              </p>
            )}
            {nodeMenuGroups.map(({ category, items }) => (
              <div key={category}>
                <p style={{ margin: 0, padding: '6px 12px 3px', fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--t5)' }}>
                  {CATEGORY_META[category].label}
                </p>
                {items.map(({ d }) => {
                  const Icon = nodeIconFor(d.type);
                  return (
                    <button
                      key={d.type}
                      type="button"
                      onClick={() => {
                        if (!quickLoadMenu) return;
                        addNode(d.type, quickLoadMenu.flowPos);
                        setQuickLoadMenu(null);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--gap)',
                        width: '100%',
                        height: 'var(--tap)',
                        textAlign: 'left',
                        padding: '0 12px',
                        borderRadius: 10,
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--t1)',
                        fontSize: 12.5,
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--field)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Icon size={18} className="shrink-0" />
                      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</span>
                      {d.creditCost > 0 && (
                        <span style={{ flex: 'none', fontSize: 10, color: 'var(--t4)', fontVariantNumeric: 'tabular-nums' }}>{d.creditCost}cr</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </Popover>
      )}

      {/* toast lỗi nối edge / lỗi flow */}
      {connectError && (
        <div className="absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-[10px] border border-red-500/40 bg-red-950/90 px-3.5 py-2 text-xs text-red-200 shadow-xl backdrop-blur">
          {connectError}
        </div>
      )}

      {/* toast thông báo smart-import (chuyển định dạng, giữ thông số gốc) */}
      {notice && !connectError && (
        <div className="absolute left-1/2 top-4 z-30 -translate-x-1/2 max-w-[92vw] rounded-[10px] border border-emerald-500/40 bg-emerald-950/90 px-3.5 py-2 text-xs text-emerald-100 shadow-xl backdrop-blur">
          {notice}
        </div>
      )}

      {/* empty state — M-EMPTY (07/08, Hoà chốt "bỏ hết dự án mẫu"): cụm DemoLauncher
          ("bắt đầu bằng 1 demo thực tế") đã GỠ cùng lib/demos/* — app thật bắt đầu trống,
          chỉ còn 1 câu mời + nút mở Thư viện khối (khuôn "Trống" SPEC-NGON-NGU §2 giữ nguyên). */}
      {nodes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
          <div className="max-w-[520px] text-center">
            <p className="text-sm text-[var(--t4)]">Canvas đang trống — kéo khối từ Thư viện vào đây</p>
            <button
              type="button"
              onClick={() => setPanel('library')}
              className="pointer-events-auto mt-3 rounded-full border border-[var(--accent-ring)] bg-[var(--accent-soft)] px-4 py-1.5 text-xs font-semibold text-[var(--accent)]"
            >
              Mở Thư viện khối
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
