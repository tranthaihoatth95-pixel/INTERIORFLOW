/**
 * lib/cad/store.ts — STORE RIÊNG cho trình CAD 2D (KHÔNG đụng lib/store.ts của canvas node).
 *
 * Giữ: doc (entities+layers), selection, tool đang chọn, cấu hình snap, viewport (pan/zoom),
 * lớp hiện hành, block chờ đặt, undo/redo (snapshot ≤50). Mọi mutation cấu trúc đều snapshot()
 * trước để Undo đúng. Zustand hoạt động cả server; không chạm localStorage/window ở module scope.
 */

'use client';

import { create } from 'zustand';
import type { Doc, Entity, Layer, Viewport } from './model';
import { emptyDoc } from './model';

export type Tool =
  | 'select'
  | 'line'
  | 'polyline'
  | 'rect'
  | 'circle'
  | 'arc'
  | 'move'
  | 'copy'
  | 'rotate'
  | 'mirror'
  | 'offset'
  | 'dimension'
  | 'measure'
  | 'text'
  | 'block'
  | 'wall'
  | 'room'
  | 'pan'
  | 'trim'
  | 'extend'
  | 'fillet'
  | 'chamfer'
  | 'arrayrect'
  | 'arraypolar'
  | 'scale'
  | 'stretch'
  | 'break'
  | 'join'
  | 'explode'
  | 'lengthen';

export interface SnapSettings {
  enabled: boolean;
  endpoint: boolean;
  midpoint: boolean;
  center: boolean;
  intersection: boolean;
  grid: boolean;
  /** Nấc 2 — bắt điểm bổ sung (chuẩn AutoCAD OSNAP) */
  quadrant: boolean;
  node: boolean;
  nearest: boolean;
  perpendicular: boolean;
  tangent: boolean;
}

const MAX_HISTORY = 50;

interface CadState {
  doc: Doc;
  selection: string[];
  tool: Tool;
  /** layer nhận entity mới */
  currentLayer: string;
  snap: SnapSettings;
  /** bước lưới mm (mặc định 100mm, vạch đậm mỗi 1m) */
  gridStep: number;
  /** Nấc 2 — polar tracking: bật/tắt + góc bước (độ, VD 15/30/45/90) */
  polarTracking: boolean;
  polarStep: number;
  viewport: Viewport;
  /** block furniture đang chờ click đặt (khi tool='block') */
  pendingBlock: string | null;
  /** offset distance nhớ cho lệnh Offset (mm) */
  offsetDist: number;
  /** bề dày tường nhớ cho lệnh WALL (mm) */
  wallThickness: number;
  /** bán kính nhớ cho lệnh FILLET (mm, 0 = vuông góc) */
  filletRadius: number;
  /** khoảng cách nhớ cho lệnh CHAMFER (mm) — d1 cạnh chọn trước, d2 cạnh chọn sau */
  chamferD1: number;
  chamferD2: number;
  /** độ dài/góc nhớ cho lệnh LENGTHEN (mm cho line; quy đổi ra rad qua bán kính cho arc) */
  lengthenDelta: number;
  past: Doc[];
  future: Doc[];
  /** dòng lệnh mini + thông báo trạng thái */
  status: string;

  // actions
  setTool: (t: Tool) => void;
  setStatus: (s: string) => void;
  snapshot: () => void;
  undo: () => void;
  redo: () => void;

  addEntity: (e: Entity) => void;
  addEntities: (es: Entity[]) => void;
  updateEntities: (es: Entity[]) => void;
  deleteSelected: () => void;
  removeIds: (ids: string[]) => void;

  select: (ids: string[], additive?: boolean) => void;
  clearSelection: () => void;

  setViewport: (v: Viewport) => void;
  setSnap: (patch: Partial<SnapSettings>) => void;
  setGridStep: (n: number) => void;
  setPolarTracking: (on: boolean) => void;
  setPolarStep: (deg: number) => void;
  setCurrentLayer: (id: string) => void;
  addLayer: () => void;
  updateLayer: (id: string, patch: Partial<Layer>) => void;
  removeLayer: (id: string) => void;

  setPendingBlock: (b: string | null) => void;
  setOffsetDist: (d: number) => void;
  setWallThickness: (d: number) => void;
  setFilletRadius: (d: number) => void;
  setChamferDist: (d1: number, d2: number) => void;
  setLengthenDelta: (d: number) => void;

  importDoc: (d: Doc, mode: 'replace' | 'merge') => void;
  scaleAll: (factor: number) => void;
  reset: () => void;
}

function clone(d: Doc): Doc {
  return { entities: d.entities.map((e) => ({ ...e })), layers: d.layers.map((l) => ({ ...l })) };
}

let seq = 0;
export function newId(prefix = 'e'): string {
  seq += 1;
  return `${prefix}-${seq}-${Math.random().toString(36).slice(2, 6)}`;
}

export const useCadStore = create<CadState>((set, get) => ({
  doc: emptyDoc(),
  selection: [],
  tool: 'select',
  currentLayer: 'l-wall',
  snap: {
    enabled: true, endpoint: true, midpoint: true, center: true, intersection: true, grid: true,
    quadrant: true, node: true, nearest: false, perpendicular: true, tangent: true,
  },
  gridStep: 100,
  polarTracking: false,
  polarStep: 15,
  viewport: { scale: 0.08, panX: 300, panY: 400 },
  pendingBlock: null,
  offsetDist: 100,
  wallThickness: 110,
  filletRadius: 0,
  chamferD1: 100,
  chamferD2: 100,
  lengthenDelta: 100,
  past: [],
  future: [],
  status: 'Sẵn sàng — chọn công cụ hoặc gõ lệnh (L, PL, REC, C…).',

  setTool: (tool) => set({ tool, status: toolHint(tool), pendingBlock: tool === 'block' ? get().pendingBlock : null }),
  setStatus: (status) => set({ status }),

  snapshot: () =>
    set((s) => ({
      past: [...s.past.slice(-(MAX_HISTORY - 1)), clone(s.doc)],
      future: [],
    })),

  undo: () =>
    set((s) => {
      if (!s.past.length) return s;
      const prev = s.past[s.past.length - 1];
      return { doc: prev, past: s.past.slice(0, -1), future: [clone(s.doc), ...s.future].slice(0, MAX_HISTORY), selection: [] };
    }),

  redo: () =>
    set((s) => {
      if (!s.future.length) return s;
      const next = s.future[0];
      return { doc: next, future: s.future.slice(1), past: [...s.past, clone(s.doc)].slice(-MAX_HISTORY), selection: [] };
    }),

  addEntity: (e) => {
    get().snapshot();
    set((s) => ({ doc: { ...s.doc, entities: [...s.doc.entities, e] } }));
  },
  addEntities: (es) => {
    if (!es.length) return;
    get().snapshot();
    set((s) => ({ doc: { ...s.doc, entities: [...s.doc.entities, ...es] } }));
  },
  updateEntities: (es) => {
    get().snapshot();
    const map = new Map(es.map((e) => [e.id, e]));
    set((s) => ({ doc: { ...s.doc, entities: s.doc.entities.map((e) => map.get(e.id) ?? e) } }));
  },
  deleteSelected: () => {
    const sel = new Set(get().selection);
    if (!sel.size) return;
    get().snapshot();
    set((s) => ({ doc: { ...s.doc, entities: s.doc.entities.filter((e) => !sel.has(e.id)) }, selection: [] }));
  },
  removeIds: (ids) => {
    const set0 = new Set(ids);
    if (!set0.size) return;
    get().snapshot();
    set((s) => ({ doc: { ...s.doc, entities: s.doc.entities.filter((e) => !set0.has(e.id)) }, selection: [] }));
  },

  select: (ids, additive) =>
    set((s) => ({ selection: additive ? Array.from(new Set([...s.selection, ...ids])) : ids })),
  clearSelection: () => set({ selection: [] }),

  setViewport: (viewport) => set({ viewport }),
  setSnap: (patch) => set((s) => ({ snap: { ...s.snap, ...patch } })),
  setGridStep: (gridStep) => set({ gridStep }),
  setPolarTracking: (polarTracking) => set({ polarTracking }),
  setPolarStep: (polarStep) => set({ polarStep }),
  setCurrentLayer: (currentLayer) => set({ currentLayer }),

  addLayer: () => {
    get().snapshot();
    const id = newId('l');
    const palette = ['#e8e4dc', '#c08a5a', '#7aa2c4', '#8fae7a', '#c47a9a', '#b0a07a'];
    set((s) => ({
      doc: {
        ...s.doc,
        layers: [
          ...s.doc.layers,
          { id, name: `Lớp ${s.doc.layers.length + 1}`, color: palette[s.doc.layers.length % palette.length], visible: true, locked: false },
        ],
      },
      currentLayer: id,
    }));
  },
  updateLayer: (id, patch) =>
    set((s) => ({ doc: { ...s.doc, layers: s.doc.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)) } })),
  removeLayer: (id) =>
    set((s) => {
      if (s.doc.layers.length <= 1) return s;
      get().snapshot();
      return {
        doc: {
          entities: s.doc.entities.filter((e) => e.layer !== id),
          layers: s.doc.layers.filter((l) => l.id !== id),
        },
        currentLayer: s.currentLayer === id ? s.doc.layers.find((l) => l.id !== id)!.id : s.currentLayer,
      };
    }),

  setPendingBlock: (pendingBlock) => set({ pendingBlock, tool: pendingBlock ? 'block' : get().tool }),
  setOffsetDist: (offsetDist) => set({ offsetDist }),
  setWallThickness: (wallThickness) => set({ wallThickness }),
  setFilletRadius: (filletRadius) => set({ filletRadius }),
  setChamferDist: (chamferD1, chamferD2) => set({ chamferD1, chamferD2 }),
  setLengthenDelta: (lengthenDelta) => set({ lengthenDelta }),

  importDoc: (d, mode) => {
    get().snapshot();
    set((s) =>
      mode === 'replace'
        ? { doc: d, selection: [], currentLayer: d.layers[0]?.id ?? s.currentLayer }
        : {
            doc: {
              entities: [...s.doc.entities, ...d.entities],
              layers: mergeLayers(s.doc.layers, d.layers),
            },
          },
    );
  },
  scaleAll: (factor) => {
    get().snapshot();
    set((s) => ({ doc: { ...s.doc, entities: s.doc.entities.map((e) => scaleEntity(e, factor)) } }));
  },

  reset: () => set({ doc: emptyDoc(), selection: [], past: [], future: [], currentLayer: 'l-wall' }),
}));

function mergeLayers(a: Layer[], b: Layer[]): Layer[] {
  const byName = new Map(a.map((l) => [l.name, l]));
  const out = [...a];
  for (const l of b) if (!byName.has(l.name)) out.push(l);
  return out;
}

function scaleEntity(e: Entity, f: number): Entity {
  switch (e.type) {
    case 'line':
    case 'dim':
      return { ...e, a: { x: e.a.x * f, y: e.a.y * f }, b: { x: e.b.x * f, y: e.b.y * f } };
    case 'polyline':
      return { ...e, points: e.points.map((p) => ({ x: p.x * f, y: p.y * f })) };
    case 'rect':
      return { ...e, x: e.x * f, y: e.y * f, w: e.w * f, h: e.h * f };
    case 'circle':
      return { ...e, c: { x: e.c.x * f, y: e.c.y * f }, r: e.r * f };
    case 'arc':
      return { ...e, c: { x: e.c.x * f, y: e.c.y * f }, r: e.r * f };
    case 'text':
      return { ...e, at: { x: e.at.x * f, y: e.at.y * f }, h: e.h * f };
    case 'block':
      return { ...e, at: { x: e.at.x * f, y: e.at.y * f }, sx: e.sx * f, sy: e.sy * f };
    case 'hatch':
      return { ...e, points: e.points.map((p) => ({ x: p.x * f, y: p.y * f })) };
  }
}

function toolHint(t: Tool): string {
  const H: Record<Tool, string> = {
    select: 'Chọn: click vào đối tượng, hoặc quây khung. Xoá = Delete/E.',
    line: 'Line (L): click điểm đầu → điểm cuối. Gõ số + Enter = độ dài. Esc huỷ.',
    polyline: 'Polyline (PL): click các điểm; Enter/double-click kết thúc; C đóng.',
    rect: 'Rect (REC): click 2 góc đối diện.',
    circle: 'Circle (C): click tâm → điểm trên đường tròn (hoặc gõ bán kính).',
    arc: 'Arc: click 3 điểm (đầu · giữa · cuối).',
    move: 'Move (M): chọn đối tượng → click điểm gốc → điểm đích.',
    copy: 'Copy (CO): chọn đối tượng → điểm gốc → điểm đích (giữ nguyên bản gốc).',
    rotate: 'Rotate (RO): chọn → click tâm xoay → click hướng (Shift = bậc 90°).',
    mirror: 'Mirror (MI): chọn → click 2 điểm trục đối xứng.',
    offset: 'Offset (O): nhập khoảng cách → click đối tượng → click phía offset.',
    dimension: 'Dim: click 2 điểm để ghi kích thước (mm).',
    measure: 'Measure: click 2 điểm để đo nhanh.',
    text: 'Text: click vị trí rồi gõ nội dung.',
    block: 'Đặt block: click để đặt. R = xoay 90°, gõ số + Enter cũng xoay.',
    wall: 'Wall (W): click các điểm tim tường liên tiếp; Enter/double-click kết thúc. Gõ số + Enter = bề dày (mm).',
    room: 'Room: click 2 góc phòng → tự vẽ 4 tường + nhãn tên/diện tích.',
    pan: 'Pan: kéo để di chuyển khung nhìn.',
    trim: 'Trim (TR): click phần đối tượng cần xoá (dùng đối tượng đang chọn làm biên cắt, hoặc toàn bộ bản vẽ nếu chưa chọn gì).',
    extend: 'Extend (EX): click đầu đối tượng cần kéo dài tới biên gần nhất (biên = đối tượng đang chọn, hoặc toàn bộ bản vẽ).',
    fillet: 'Fillet (F): click 2 đường cần bo góc. Gõ số + Enter = bán kính (mm, 0 = vuông góc).',
    chamfer: 'Chamfer (CHA): click 2 đường cần vát góc. Gõ số + Enter = khoảng cách d1 (mm, dùng chung d2).',
    arrayrect: 'Array chữ nhật (AR): chọn đối tượng trước → click để nhập số hàng/cột/khoảng cách.',
    arraypolar: 'Array tròn (ARP): chọn đối tượng trước → click tâm mảng → nhập số bản/góc quét.',
    scale: 'Scale (SC): chọn đối tượng trước → click điểm gốc (base) → nhập hệ số scale.',
    stretch: 'Stretch (S): click 2 góc khung crossing bao phần cần kéo dãn → click điểm gốc → điểm đích.',
    break: 'Break (BR): click đối tượng tại điểm cắt 1 → click điểm cắt 2 (Enter sau 1 click = cắt tại đúng điểm đó).',
    join: 'Join (J): click đối tượng thứ nhất → click đối tượng thứ 2 cần nối.',
    explode: 'Explode (X): click block/polyline/rect cần rã thành line/primitive rời.',
    lengthen: 'Lengthen (LEN): click gần đầu đối tượng cần đổi độ dài. Gõ số + Enter = delta (mm, âm = rút ngắn).',
  };
  return H[t];
}
