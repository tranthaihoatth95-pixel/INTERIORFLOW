'use client';

import { create } from 'zustand';
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from '@xyflow/react';
import type { InteriorNodeData, Job, NodeRunState } from '@/lib/types';
import { DATA_TYPE_COLORS } from '@/lib/types';
import { getDefinition, defaultParams } from '@/lib/nodes/registry';
import {
  type AiTier, DEFAULT_TIER, isAiTier,
  type OneAiEngine, type OneAiRuntime, DEFAULT_ONE_AI_ENGINE, DEFAULT_ONE_AI_RUNTIME,
  isOneAiEngine, isOneAiRuntime,
} from '@/lib/ai/tiers';
import { type Phase, isPhase } from '@/lib/phases';
import { type Lang, DEFAULT_LANG, LANG_KEY, isLang } from '@/lib/lang';

export type FlowNode = Node<InteriorNodeData>;
export type Tool = 'select' | 'pan';
export type Panel = 'library' | 'search' | 'gallery' | 'assets' | 'flows' | null;
export type ThemePref = 'auto' | 'light' | 'dark';
/** 3 chặng mềm của cùng 1 pipeline (Concept → Render → Present) — xem lib/phases.ts.
 *  Không tách app; chỉ nhấn nhóm node + starter-flow theo ngữ cảnh, đi lại tự do. */
export type WorkspaceMode = Phase;
/** Kiểu giao diện làm việc — 'node' (hiện tại) | 'window' (kiểu Figma, làm sau) */
export type ViewMode = 'node' | 'window';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  credits: number;
  isAdmin: boolean;
}

interface HistoryEntry {
  nodes: FlowNode[];
  edges: Edge[];
}

interface FlowState {
  flowName: string;
  credits: number;
  nodes: FlowNode[];
  edges: Edge[];
  jobs: Job[];
  tool: Tool;
  panel: Panel;
  tasksOpen: boolean;
  /** Dashboard tổng quan project + team (overlay toàn màn) */
  dashboardOpen: boolean;
  /** Present mode — trình chiếu deck/board toàn màn (overlay) */
  presentModeOpen: boolean;
  /** Moodboard maker (chặng Concept) — overlay chọn ảnh + style → moodboard */
  moodboardOpen: boolean;
  connectError: string | null;
  /** Thông báo trung tính/thành công (vd smart-import đã chuyển định dạng) — banner xanh, tự tắt. */
  notice: string | null;
  /** nodeId đang mở Mask Painter modal */
  maskEditorNodeId: string | null;
  /** 'auto' = sáng 6h30–18h, tối ngoài giờ đó */
  themePref: ThemePref;
  appliedTheme: 'light' | 'dark';
  /** ngôn ngữ hiển thị — VI mặc định, EN cho demo song ngữ (persist localStorage) */
  lang: Lang;
  /** undefined = đang check session, null = chưa đăng nhập */
  user: SessionUser | null | undefined;
  currentFlowId: string | null;
  shareToken: string | null;
  chatOpen: boolean;
  /** lối làm việc đã chọn ở login (Presentation | 3D Render) */
  workspace: WorkspaceMode | null;
  /** kiểu xem canvas — node-flow hiện tại; 'window' (Figma) để mốc, chưa bật */
  viewMode: ViewMode;
  /** mức phụ thuộc AI (4=Cao cloud · 3=Vừa · 2=oneAI tự-host · 1=Không AI) */
  aiTier: AiTier;
  /** oneAI (mức 2): engine SD-portable vs FLUX-RTX + runtime WebGPU vs server */
  oneAiEngine: OneAiEngine;
  oneAiRuntime: OneAiRuntime;
  /** nodeId đang mở Annotate modal */
  annotateNodeId: string | null;
  /** URL ảnh đang mở lightbox */
  lightboxUrl: string | null;
  isRunningFlow: boolean;
  /** command palette (⌘K) đang mở */
  paletteOpen: boolean;
  /** snap node vào lưới khi kéo */
  snapGrid: boolean;
  past: HistoryEntry[];
  future: HistoryEntry[];

  setFlowName: (name: string) => void;
  setPaletteOpen: (open: boolean) => void;
  toggleSnap: () => void;
  /** tự sắp graph theo tầng (DAG longest-path), giữ note nguyên vị trí */
  autoLayout: () => void;
  setTool: (tool: Tool) => void;
  setPanel: (panel: Panel) => void;
  setTasksOpen: (open: boolean) => void;
  setDashboardOpen: (open: boolean) => void;
  setPresentModeOpen: (open: boolean) => void;
  setMoodboardOpen: (open: boolean) => void;
  setConnectError: (msg: string | null) => void;
  setNotice: (msg: string | null) => void;
  setMaskEditorNodeId: (nodeId: string | null) => void;
  setAnnotateNodeId: (nodeId: string | null) => void;
  setLightboxUrl: (url: string | null) => void;
  setThemePref: (pref: ThemePref) => void;
  applyTheme: () => void;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  hydrate: () => void;
  setUser: (user: SessionUser | null) => void;
  setCredits: (credits: number) => void;
  setCurrentFlowId: (id: string | null) => void;
  setShareToken: (token: string | null) => void;
  setChatOpen: (open: boolean) => void;
  setWorkspace: (mode: WorkspaceMode) => void;
  setViewMode: (mode: ViewMode) => void;
  setAiTier: (tier: AiTier) => void;
  setOneAiEngine: (engine: OneAiEngine) => void;
  setOneAiRuntime: (runtime: OneAiRuntime) => void;
  /** nạp graph từ server vào canvas, reset history */
  loadGraph: (graphJson: string, name: string, flowId: string, shareToken: string | null) => void;

  onNodesChange: (changes: NodeChange<FlowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;

  addNode: (defType: string, position: { x: number; y: number }) => void;
  addNote: (position: { x: number; y: number }) => void;
  deleteNode: (id: string) => void;
  duplicateSelected: () => void;
  updateParam: (nodeId: string, paramId: string, value: string | number) => void;
  updateNote: (nodeId: string, note: string) => void;
  setRunState: (nodeId: string, patch: Partial<NodeRunState>) => void;

  addJob: (job: Job) => void;
  updateJob: (jobId: string, patch: Partial<Job>) => void;
  spendCredits: (amount: number) => void;
  setRunningFlow: (running: boolean) => void;

  snapshot: () => void;
  undo: () => void;
  redo: () => void;
  loadDemoFlow: (kind?: DemoKind) => void;
}

export type DemoKind = 'sketch' | 'bedroom' | 'slide' | 'concept';

// Dev-only: expose store cho debugging (window.__flowStore)
declare global {
  interface Window {
    __flowStore?: unknown;
  }
}

let idCounter = 0;
export const nextId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${idCounter++}`;

const MAX_HISTORY = 50;
const SAVE_KEY = 'interiorflow.flow.v1';
const THEME_KEY = 'interiorflow.theme';

export function edgeStyleFor(dataType: string | undefined) {
  const color = DATA_TYPE_COLORS[(dataType ?? 'image') as keyof typeof DATA_TYPE_COLORS] ?? '#8b7cf7';
  return { stroke: color, strokeWidth: 1.5 };
}

export const useFlowStore = create<FlowState>((set, get) => ({
  flowName: 'Untitled flow',
  credits: 120,
  nodes: [],
  edges: [],
  jobs: [],
  tool: 'select',
  panel: null,
  tasksOpen: false,
  dashboardOpen: false,
  presentModeOpen: false,
  moodboardOpen: false,
  connectError: null,
  notice: null,
  maskEditorNodeId: null,
  annotateNodeId: null,
  lightboxUrl: null,
  themePref: 'auto',
  appliedTheme: 'dark',
  lang: DEFAULT_LANG,
  user: undefined,
  currentFlowId: null,
  shareToken: null,
  chatOpen: false,
  workspace: null,
  viewMode: 'node',
  aiTier: DEFAULT_TIER,
  oneAiEngine: DEFAULT_ONE_AI_ENGINE,
  oneAiRuntime: DEFAULT_ONE_AI_RUNTIME,
  isRunningFlow: false,
  paletteOpen: false,
  snapGrid: false,
  past: [],
  future: [],

  setFlowName: (flowName) => set({ flowName }),
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  toggleSnap: () => set((s) => ({ snapGrid: !s.snapGrid })),

  autoLayout: () => {
    const { nodes, edges } = get();
    const flowNodes = nodes.filter((n) => n.type !== 'note');
    if (!flowNodes.length) return;
    const ids = new Set(flowNodes.map((n) => n.id));

    // preds theo edge (chỉ giữa các flow node)
    const preds = new Map<string, string[]>();
    flowNodes.forEach((n) => preds.set(n.id, []));
    for (const e of edges) {
      if (ids.has(e.source) && ids.has(e.target)) preds.get(e.target)!.push(e.source);
    }

    // layer = longest-path từ node gốc, có chặn cycle
    const layer = new Map<string, number>();
    const computing = new Set<string>();
    const depth = (id: string): number => {
      const cached = layer.get(id);
      if (cached !== undefined) return cached;
      if (computing.has(id)) return 0; // cycle → coi như gốc
      computing.add(id);
      const ps = preds.get(id) ?? [];
      const d = ps.length ? Math.max(...ps.map((p) => depth(p) + 1)) : 0;
      computing.delete(id);
      layer.set(id, d);
      return d;
    };
    flowNodes.forEach((n) => depth(n.id));

    const byLayer = new Map<number, FlowNode[]>();
    flowNodes.forEach((n) => {
      const l = layer.get(n.id) ?? 0;
      const bucket = byLayer.get(l);
      if (bucket) bucket.push(n);
      else byLayer.set(l, [n]);
    });

    const COL = 340;
    const ROW_GAP = 44;
    const X0 = 80;
    const Y0 = 80;
    const posById = new Map<string, { x: number; y: number }>();
    [...byLayer.keys()]
      .sort((a, b) => a - b)
      .forEach((l) => {
        // giữ thứ tự dọc cũ để layout ổn định
        const col = byLayer.get(l)!.sort((a, b) => a.position.y - b.position.y);
        let y = Y0;
        col.forEach((n) => {
          posById.set(n.id, { x: X0 + l * COL, y });
          const h = n.measured?.height ?? 210;
          y += h + ROW_GAP;
        });
      });

    get().snapshot();
    set((s) => ({
      nodes: s.nodes.map((n) => (posById.has(n.id) ? { ...n, position: posById.get(n.id)! } : n)),
    }));
  },

  setTool: (tool) => set({ tool }),
  setPanel: (panel) => set((s) => ({ panel: s.panel === panel ? null : panel })),
  setTasksOpen: (tasksOpen) => set({ tasksOpen }),
  setDashboardOpen: (dashboardOpen) => set({ dashboardOpen }),
  setPresentModeOpen: (presentModeOpen) => set({ presentModeOpen }),
  setMoodboardOpen: (moodboardOpen) => set({ moodboardOpen }),
  setConnectError: (connectError) => set({ connectError }),
  setNotice: (notice) => set({ notice }),
  setMaskEditorNodeId: (maskEditorNodeId) => set({ maskEditorNodeId }),
  setAnnotateNodeId: (annotateNodeId) => set({ annotateNodeId }),
  setLightboxUrl: (lightboxUrl) => set({ lightboxUrl }),

  setUser: (user) => set({ user, credits: user?.credits ?? get().credits }),
  setCredits: (credits) =>
    set((s) => ({ credits, user: s.user ? { ...s.user, credits } : s.user })),
  setCurrentFlowId: (currentFlowId) => set({ currentFlowId }),
  setShareToken: (shareToken) => set({ shareToken }),
  setChatOpen: (chatOpen) => set({ chatOpen }),
  setWorkspace: (workspace) => {
    set({ workspace });
    try {
      localStorage.setItem('interiorflow.workspace', workspace);
    } catch {}
  },
  setViewMode: (viewMode) => set({ viewMode }),
  setAiTier: (aiTier) => {
    set({ aiTier });
    try {
      localStorage.setItem('interiorflow.aiTier', String(aiTier));
    } catch {}
  },
  setOneAiEngine: (oneAiEngine) => {
    set({ oneAiEngine });
    try {
      localStorage.setItem('interiorflow.oneAiEngine', oneAiEngine);
    } catch {}
  },
  setOneAiRuntime: (oneAiRuntime) => {
    set({ oneAiRuntime });
    try {
      localStorage.setItem('interiorflow.oneAiRuntime', oneAiRuntime);
    } catch {}
  },

  loadGraph: (graphJson, name, flowId, shareToken) => {
    try {
      const graph = JSON.parse(graphJson) as { nodes?: FlowNode[]; edges?: Edge[] };
      set({
        nodes: (graph.nodes ?? []).map((n) => ({
          ...n,
          data: {
            ...n.data,
            run:
              n.data.run?.status === 'running' || n.data.run?.status === 'queued'
                ? { status: 'idle' as const, progress: 0 }
                : n.data.run ?? { status: 'idle' as const, progress: 0 },
          },
        })),
        edges: graph.edges ?? [],
        flowName: name,
        currentFlowId: flowId,
        shareToken,
        past: [],
        future: [],
      });
    } catch {
      get().setConnectError('Graph của flow này bị hỏng — mở flow khác.');
    }
  },

  setThemePref: (themePref) => {
    set({ themePref });
    try {
      localStorage.setItem(THEME_KEY, themePref);
    } catch {}
    get().applyTheme();
  },
  applyTheme: () => {
    const pref = get().themePref;
    const hour = new Date().getHours() + new Date().getMinutes() / 60;
    const applied = pref === 'auto' ? (hour >= 6.5 && hour < 18 ? 'light' : 'dark') : pref;
    if (applied !== get().appliedTheme) set({ appliedTheme: applied });
    if (typeof document !== 'undefined') document.documentElement.dataset.theme = applied;
  },

  setLang: (lang) => {
    set({ lang });
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {}
    if (typeof document !== 'undefined') document.documentElement.lang = lang;
  },
  toggleLang: () => get().setLang(get().lang === 'vi' ? 'en' : 'vi'),

  hydrate: () => {
    // theme trước — tránh nháy màu
    try {
      const pref = localStorage.getItem(THEME_KEY) as ThemePref | null;
      if (pref === 'auto' || pref === 'light' || pref === 'dark') set({ themePref: pref });
    } catch {}
    try {
      const l = localStorage.getItem(LANG_KEY);
      if (isLang(l)) {
        set({ lang: l });
        if (typeof document !== 'undefined') document.documentElement.lang = l;
      }
    } catch {}
    try {
      const t = Number(localStorage.getItem('interiorflow.aiTier'));
      if (isAiTier(t)) set({ aiTier: t });
    } catch {}
    try {
      const e = localStorage.getItem('interiorflow.oneAiEngine');
      if (isOneAiEngine(e)) set({ oneAiEngine: e });
      const r = localStorage.getItem('interiorflow.oneAiRuntime');
      if (isOneAiRuntime(r)) set({ oneAiRuntime: r });
    } catch {}
    try {
      // chặng làm việc — migrate tên cũ 'presentation' → 'present'
      const raw = localStorage.getItem('interiorflow.workspace');
      const ws = raw === 'presentation' ? 'present' : raw;
      if (isPhase(ws)) set({ workspace: ws });
    } catch {}
    get().applyTheme();
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        flowName?: string;
        credits?: number;
        nodes?: FlowNode[];
        edges?: Edge[];
      };
      if (!Array.isArray(saved.nodes) || !saved.nodes.length) return;
      // node đang chạy dở lúc reload → về idle
      const nodes = saved.nodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          run:
            n.data.run?.status === 'running' || n.data.run?.status === 'queued'
              ? { status: 'idle' as const, progress: 0 }
              : n.data.run ?? { status: 'idle' as const, progress: 0 },
        },
      }));
      set({
        nodes,
        edges: saved.edges ?? [],
        flowName: saved.flowName ?? 'Untitled flow',
        credits: typeof saved.credits === 'number' ? saved.credits : 120,
      });
    } catch {
      // save hỏng → bỏ qua, bắt đầu flow trống
    }
  },

  onNodesChange: (changes) => {
    if (changes.some((c) => c.type === 'remove')) get().snapshot();
    set((s) => ({ nodes: applyNodeChanges(changes, s.nodes) }));
  },
  onEdgesChange: (changes) => {
    if (changes.some((c) => c.type === 'remove')) get().snapshot();
    set((s) => ({ edges: applyEdgeChanges(changes, s.edges) }));
  },
  onConnect: (connection) => {
    const { nodes } = get();
    const source = nodes.find((n) => n.id === connection.source);
    if (!source || source.type === 'note') return;
    const def = getDefinition(source.data.defType);
    const port = def.outputs.find((o) => o.id === connection.sourceHandle);
    get().snapshot();
    set((s) => ({
      edges: addEdge(
        { ...connection, style: edgeStyleFor(port?.dataType), animated: false },
        // 1 input port chỉ nhận 1 edge — bỏ edge cũ cùng target handle
        s.edges.filter(
          (e) => !(e.target === connection.target && e.targetHandle === connection.targetHandle),
        ),
      ),
    }));
  },

  addNode: (defType, position) => {
    const def = getDefinition(defType);
    get().snapshot();
    const node: FlowNode = {
      id: nextId('node'),
      type: 'interior',
      position,
      data: {
        defType,
        params: defaultParams(def),
        run: { status: 'idle', progress: 0 },
      },
    };
    set((s) => ({ nodes: [...s.nodes, node] }));
  },

  addNote: (position) => {
    get().snapshot();
    const node: FlowNode = {
      id: nextId('note'),
      type: 'note',
      position,
      data: { defType: 'note', params: {}, run: { status: 'idle', progress: 0 }, note: '' },
    };
    set((s) => ({ nodes: [...s.nodes, node], tool: 'select' }));
  },

  deleteNode: (id) => {
    get().snapshot();
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== id),
      edges: s.edges.filter((e) => e.source !== id && e.target !== id),
    }));
  },

  duplicateSelected: () => {
    const selected = get().nodes.filter((n) => n.selected);
    if (!selected.length) return;
    get().snapshot();
    const clones: FlowNode[] = selected.map((n) => ({
      ...n,
      id: nextId(n.type === 'note' ? 'note' : 'node'),
      position: { x: n.position.x + 40, y: n.position.y + 40 },
      selected: true,
      data: { ...n.data, run: { status: 'idle', progress: 0 } },
    }));
    set((s) => ({
      nodes: [...s.nodes.map((n) => ({ ...n, selected: false })), ...clones],
    }));
  },

  updateParam: (nodeId, paramId, value) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, params: { ...n.data.params, [paramId]: value } } }
          : n,
      ),
    })),

  updateNote: (nodeId, note) =>
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, note } } : n)),
    })),

  setRunState: (nodeId, patch) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, run: { ...n.data.run, ...patch } } } : n,
      ),
    })),

  addJob: (job) => set((s) => ({ jobs: [job, ...s.jobs].slice(0, 100) })),
  updateJob: (jobId, patch) =>
    set((s) => ({ jobs: s.jobs.map((j) => (j.id === jobId ? { ...j, ...patch } : j)) })),
  spendCredits: (amount) => set((s) => ({ credits: Math.max(0, s.credits - amount) })),
  setRunningFlow: (isRunningFlow) => set({ isRunningFlow }),

  snapshot: () => {
    const { nodes, edges } = get();
    set((s) => ({
      past: [...s.past, { nodes, edges }].slice(-MAX_HISTORY),
      future: [],
    }));
  },
  undo: () => {
    const { past, nodes, edges } = get();
    if (!past.length) return;
    const prev = past[past.length - 1];
    set((s) => ({
      past: s.past.slice(0, -1),
      future: [{ nodes, edges }, ...s.future].slice(0, MAX_HISTORY),
      nodes: prev.nodes,
      edges: prev.edges,
    }));
  },
  loadDemoFlow: (kind: DemoKind = 'sketch') => {
    get().snapshot();
    const mk = (defType: string, x: number, y: number): FlowNode => {
      const def = getDefinition(defType);
      return {
        id: nextId('node'),
        type: 'interior',
        position: { x, y },
        data: { defType, params: defaultParams(def), run: { status: 'idle', progress: 0 } },
      };
    };
    const edge = (a: FlowNode, ah: string, b: FlowNode, bh: string, dt = 'image') => ({
      id: nextId('edge'),
      source: a.id,
      sourceHandle: ah,
      target: b.id,
      targetHandle: bh,
      style: edgeStyleFor(dt),
    });
    const svg = (body: string, w = 768, h = 512) =>
      `data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${body}</svg>`,
      )}`;

    if (kind === 'slide') {
      // Ảnh ref brand — tông đá ấm / gỗ (quiet luxury) để trích palette
      const styleRef = svg(
        '<rect width="768" height="512" fill="#f2ede4"/><rect y="160" width="768" height="120" fill="#d9cfc2"/><rect y="280" width="768" height="90" fill="#b39776"/><rect y="370" width="768" height="80" fill="#6f5b40"/><rect y="450" width="768" height="62" fill="#2b2620"/><circle cx="620" cy="90" r="46" fill="#c7a397"/>',
      );
      const ref = mk('input.image', 40, 60);
      ref.data.params.file = styleRef;
      const c1 = mk('slide.concept', 40, 420);
      c1.data.params.kicker = 'Concept · Master bedroom';
      c1.data.params.title = 'SERENE';
      c1.data.params.body = 'Phòng ngủ Japandi 22m² — tĩnh, ấm, đủ.\nĐá ấm, gỗ sồi, vải linen thô.';
      const c2 = mk('slide.concept', 40, 800);
      c2.data.params.kicker = 'Định hướng vật liệu';
      c2.data.params.title = 'Chất liệu & ánh sáng';
      c2.data.params.body =
        '- Sàn gỗ sồi ghép xương cá, tường vữa mịn tông kem\n- Rèm 2 lớp: voan + linen chắn sáng\n- Đèn: 2700K, wall-wash quanh đầu giường\n- Đầu giường gỗ óc chó bo cong, nệm bọc bouclé';
      const s1 = mk('slide.composer', 460, 200);
      s1.data.params.layout = 'Cover';
      s1.data.params.brand = 'TTT Architects';
      s1.data.params.pageNo = '01';
      const s2 = mk('slide.composer', 460, 700);
      s2.data.params.layout = 'Nội dung + ảnh';
      s2.data.params.brand = 'TTT Architects';
      s2.data.params.pageNo = '02';
      const deck = mk('slide.deck', 900, 450);
      deck.data.params.deckName = 'Concept-SERENE-bedroom';
      set({
        nodes: [ref, c1, c2, s1, s2, deck],
        edges: [
          edge(c1, 'text', s1, 'content', 'text'),
          edge(c2, 'text', s2, 'content', 'text'),
          edge(ref, 'image', s1, 'styleref'),
          edge(ref, 'image', s2, 'styleref'),
          edge(ref, 'image', s2, 'hero'),
          edge(s1, 'image', deck, 'slide1'),
          edge(s2, 'image', deck, 'slide2'),
        ],
      });
      return;
    }

    if (kind === 'concept') {
      // Chặng Concept: ref vật liệu → palette; style preset → moodboard 4 concept
      const styleRef = svg(
        '<rect width="768" height="512" fill="#f2ede4"/><rect y="150" width="768" height="120" fill="#d9cfc2"/><rect y="270" width="768" height="90" fill="#b39776"/><rect y="360" width="768" height="80" fill="#6f5b40"/><rect y="440" width="768" height="72" fill="#2b2620"/><circle cx="620" cy="90" r="46" fill="#c7a397"/>',
      );
      const ref = mk('input.image', 40, 60);
      ref.data.params.file = styleRef;
      const palette = mk('util.palette', 460, 80);
      const style = mk('input.stylepreset', 40, 460);
      style.data.params.style = 'Japandi';
      const mood = mk('ai.moodboard', 460, 380);
      mood.data.params.style = 'Japandi';
      set({
        nodes: [ref, palette, style, mood],
        edges: [
          edge(ref, 'image', palette, 'image'),
          edge(style, 'text', mood, 'prompt', 'text'),
        ],
      });
      return;
    }

    if (kind === 'bedroom') {
      // Sketch phòng ngủ chi tiết cho ControlNet canny — giường, tủ đầu giường, cửa sổ, rèm, thảm
      const bedroomSketch = svg(
        `<rect width="1024" height="683" fill="#faf8f4"/>
<g stroke="#4a443c" stroke-width="3" fill="none">
<line x1="0" y1="430" x2="1024" y2="430"/>
<rect x="700" y="60" width="250" height="330"/>
<line x1="825" y1="60" x2="825" y2="390"/>
<line x1="700" y1="225" x2="950" y2="225"/>
<path d="M690 50 q 10 180 -18 350" stroke-width="2"/>
<path d="M962 50 q -10 180 18 350" stroke-width="2"/>
<rect x="260" y="180" width="330" height="120"/>
<rect x="250" y="290" width="350" height="140" rx="8"/>
<line x1="250" y1="360" x2="600" y2="360"/>
<rect x="280" y="300" width="130" height="46" rx="14"/>
<rect x="430" y="300" width="130" height="46" rx="14"/>
<rect x="150" y="330" width="80" height="100"/>
<rect x="170" y="290" width="40" height="40" rx="18"/>
<line x1="190" y1="330" x2="190" y2="310"/>
<rect x="630" y="330" width="80" height="100"/>
<rect x="650" y="290" width="40" height="40" rx="18"/>
<line x1="670" y1="330" x2="670" y2="310"/>
<ellipse cx="430" cy="530" rx="280" ry="60"/>
<rect x="40" y="90" width="90" height="340"/>
<line x1="85" y1="90" x2="85" y2="430"/>
<line x1="512" y1="0" x2="512" y2="70"/>
<circle cx="512" cy="100" r="32"/>
</g>
<text x="512" y="660" text-anchor="middle" font-family="system-ui" font-size="22" fill="#8a8378">sketch — master bedroom</text>`,
        1024,
        683,
      );
      const img = mk('input.image', 40, 60);
      img.data.params.file = bedroomSketch;
      const room = mk('input.roominfo', 40, 480);
      room.data.params.roomType = 'Phòng ngủ';
      room.data.params.area = '22';
      room.data.params.light = 'Đông (nắng sáng)';
      room.data.params.ceiling = '2.8';
      const prompt = mk('input.prompt', 40, 850);
      prompt.data.params.prompt =
        'serene japandi master bedroom, king bed with curved walnut headboard, cream boucle bench, oak herringbone floor, limewash plaster walls, sheer linen curtains glowing with morning light, warm 2700K wall sconces, wool rug, ceramic table lamps, minimal decor, quiet luxury editorial photography';
      const render = mk('ai.sketch2render', 480, 300);
      render.data.params.style = 'Japandi';
      const upscale = mk('ai.upscale', 880, 200);
      upscale.data.params.scale = '4';
      const gal = mk('out.gallery', 880, 620);
      gal.data.params.name = 'Bedroom SERENE — hero';
      set({
        nodes: [img, room, prompt, render, upscale, gal],
        edges: [
          edge(img, 'image', render, 'image'),
          edge(prompt, 'text', render, 'prompt', 'text'),
          edge(render, 'image', upscale, 'image'),
          edge(render, 'image', gal, 'image'),
        ],
      });
      return;
    }

    // mặc định: SẢN PHẨM TEST → flow demo DONE sẵn (Sketch→Render + Clay→Render).
    // Ảnh before/after thật ở /public/demo (do vòng test tạo ra bằng ComfyUI/SDXL).
    const done = (url: string) => ({
      status: 'done' as const,
      progress: 1,
      outputs: { image: { dataType: 'image' as const, value: url } },
    });
    const s1 = mk('input.image', 40, 60);
    s1.data.params.file = '/demo/sketch-in.jpg';
    s1.data.run = done('/demo/sketch-in.jpg');
    const s2 = mk('ai.sketch2render', 480, 60);
    s2.data.params.style = 'Scandinavian';
    s2.data.params.guidance = 15;
    s2.data.params.adherence = 0.6;
    s2.data.run = done('/demo/sketch-out.png');
    // 2) Clay → Photoreal → Upscale 4K (nối thêm 1 bước hậu kỳ)
    const c1 = mk('input.image', 40, 440);
    c1.data.params.file = '/demo/clay-in.jpg';
    c1.data.run = done('/demo/clay-in.jpg');
    const c2 = mk('ai.clay2render', 480, 440);
    c2.data.run = done('/demo/clay-out.png');
    const c3 = mk('ai.upscale', 920, 440);
    c3.data.params.scale = '4';
    c3.data.run = done('/demo/clay-4k.jpg'); // 4864×3328 — ESRGAN 4x thật (chi tiết, không interpolate)
    // 3) Moodboard: prompt → 4 ảnh concept (ảnh interior thật)
    const m1 = mk('input.prompt', 40, 820);
    m1.data.params.prompt =
      'interior moodboard, quiet luxury ấm, gỗ óc chó, đá travertine, ánh sáng tự nhiên';
    // Nguồn prompt cũng done + output ổn định → moodboard không bị re-exec khi Chạy flow
    m1.data.run = {
      status: 'done' as const,
      progress: 1,
      outputs: { text: { dataType: 'text' as const, value: String(m1.data.params.prompt) } },
    };
    const m2 = mk('ai.moodboard', 480, 820);
    m2.data.params.style = 'Japandi';
    m2.data.run = {
      status: 'done' as const,
      progress: 1,
      outputs: {
        image1: { dataType: 'image' as const, value: '/demo/mood1.jpg' },
        image2: { dataType: 'image' as const, value: '/demo/mood2.jpg' },
        image3: { dataType: 'image' as const, value: '/demo/mood3.jpg' },
        image4: { dataType: 'image' as const, value: '/demo/mood4.jpg' },
      },
    };
    const demoNodes = [s1, s2, c1, c2, c3, m1, m2];
    const demoEdges = [
      edge(s1, 'image', s2, 'image'),
      edge(c1, 'image', c2, 'image'),
      edge(c2, 'image', c3, 'image'),
      edge(m1, 'text', m2, 'prompt', 'text'),
    ];
    // "Niêm" inputHash cho các node đã done — khớp đúng công thức execNode.hashOf —
    // để "Chạy flow"/nút ▶ BỎ QUA (đã done), không re-exec. Nếu re-exec, provider
    // server-side sẽ fetch('/demo/…') = URL tương đối → "Failed to parse URL". Niêm hash chặn hẳn.
    for (const n of demoNodes) {
      if (n.data.run.status !== 'done') continue;
      const def = getDefinition(n.data.defType);
      const inputs: Record<string, unknown> = {};
      for (const port of def.inputs) {
        const e = demoEdges.find((ed) => ed.target === n.id && ed.targetHandle === port.id);
        if (e) {
          const srcNode = demoNodes.find((x) => x.id === e.source);
          inputs[port.id] = srcNode?.data.run.outputs?.[e.sourceHandle ?? ''];
        }
      }
      n.data.run.inputHash = JSON.stringify({ inputs, params: n.data.params });
    }
    set({
      nodes: demoNodes,
      edges: demoEdges,
      flowName: 'Demo — Sketch · Clay · Moodboard',
    });
  },

  redo: () => {
    const { future, nodes, edges } = get();
    if (!future.length) return;
    const next = future[0];
    set((s) => ({
      future: s.future.slice(1),
      past: [...s.past, { nodes, edges }].slice(-MAX_HISTORY),
      nodes: next.nodes,
      edges: next.edges,
    }));
  },
}));

// ===== Autosave (Phase 3-lite): debounce 2s vào localStorage =====
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let quotaWarned = false;

function persistNow() {
  const { flowName, credits, nodes, edges, user, currentFlowId } = useFlowStore.getState();

  // Đã đăng nhập + có flow server → autosave lên DB
  if (user && currentFlowId) {
    fetch(`/api/flows/${currentFlowId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ graphJson: JSON.stringify({ nodes, edges }), name: flowName }),
    }).catch(() => {});
    return;
  }

  // Đóng dấu CHỦ SỞ HỮU bản lưu local — để bootstrapWorkspace không bê flow của
  // người dùng trước trên cùng máy vào tài khoản mới. Khi CHƯA đăng nhập (vd sau
  // logout, canvas còn flow cũ trong memory) GIỮ owner cũ, không rửa thành 'anon' —
  // 'anon' chỉ dành cho máy chưa từng có ai đăng nhập (guest thật).
  let owner = user?.id;
  if (!owner) {
    try {
      owner = (JSON.parse(localStorage.getItem(SAVE_KEY) ?? '{}') as { owner?: string }).owner ?? 'anon';
    } catch {
      owner = 'anon';
    }
  }
  const payload = { version: 1, owner, flowName, credits, nodes, edges };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  } catch {
    // quota — thử bỏ outputs (ảnh kết quả) để nhẹ bớt
    try {
      const slim = {
        ...payload,
        nodes: nodes.map((n) => ({
          ...n,
          data: { ...n.data, run: { status: 'idle' as const, progress: 0 } },
        })),
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(slim));
    } catch {
      if (!quotaWarned) {
        quotaWarned = true;
        useFlowStore
          .getState()
          .setConnectError('Flow quá nặng để autosave (ảnh upload lớn) — kết quả vẫn chạy bình thường.');
      }
    }
  }
}

if (typeof window !== 'undefined') {
  useFlowStore.subscribe((state, prev) => {
    if (
      state.nodes === prev.nodes &&
      state.edges === prev.edges &&
      state.flowName === prev.flowName &&
      state.credits === prev.credits
    )
      return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(persistNow, 2000);
  });
}

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.__flowStore = useFlowStore;
}
