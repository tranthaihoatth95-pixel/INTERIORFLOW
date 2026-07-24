/**
 * lib/cad/store.ts — STORE RIÊNG cho trình CAD 2D (KHÔNG đụng lib/store.ts của canvas node).
 *
 * Giữ: doc (entities+layers), selection, tool đang chọn, cấu hình snap, viewport (pan/zoom),
 * lớp hiện hành, block chờ đặt, undo/redo (snapshot ≤50). Mọi mutation cấu trúc đều snapshot()
 * trước để Undo đúng. Zustand hoạt động cả server; không chạm localStorage/window ở module scope.
 */

'use client';

import { create } from 'zustand';
import type { Doc, Entity, Layer, LineType, Viewport, HatchPattern, MarkupPin, PhotoEmbed } from './model';
import { emptyDoc } from './model';
import { pasteEntities } from './geometry';

// Dev-only: expose store cho debugging (window.__cadStore) — cùng pattern với
// window.__flowStore trong lib/store.ts, không lọt vào bản build production.
declare global {
  interface Window {
    __cadStore?: unknown;
  }
}

/** Id các layer KHÔNG được thao tác (khoá HOẶC đang ẩn) — entity trên đó không chọn/sửa/xoá được. */
function lockedLayerIds(doc: Doc): Set<string> {
  return new Set(doc.layers.filter((l) => l.locked || !l.visible).map((l) => l.id));
}

/** Dim style TỐI THIỂU (Nấc 3) — tương đương vài biến DIMSTYLE hay chỉnh nhất của AutoCAD.
 * textHeight/arrowSize là mm ở tỉ lệ 1:1; dimScale nhân thêm (như DIMSCALE) để chữ/mũi tên
 * không tí hin khi in ở tỉ lệ nhỏ (1:50, 1:100…). Đơn vị hiển thị luôn là mm (khớp toàn app). */
export interface DimStyle {
  textHeight: number;
  arrowSize: number;
  dimScale: number;
}

export type Tool =
  | 'select'
  | 'line'
  | 'polyline'
  | 'rect'
  | 'circle'
  | 'circle3p'
  | 'arc'
  | 'arccenter'
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
  | 'lengthen'
  | 'dimradius'
  | 'dimdiameter'
  | 'dimangular'
  | 'dimcontinue'
  | 'dimbaseline'
  | 'hatch'
  /** Sprint 7 — Việc 3: đặt ghim markup (click → prompt text → ghim tại điểm click). */
  | 'markup'
  /** Sprint 7 — Việc 4: đặt ảnh hiện trường (chờ `pendingPhotoSrc` từ upload rồi click đặt —
   * cùng pattern với 'block'+pendingBlock). */
  | 'photo'
  /** Sprint 10 — Việc 2: đa giác đều — click tâm → click bán kính (số cạnh = polygonSides). */
  | 'polygon'
  /** Sprint 10 — Việc 3.1: spline — click nhiều control point; Enter/double-click kết thúc. */
  | 'spline'
  /** Sprint 10 — Việc 3.2: construction line (Xline) — click 2 điểm xác định hướng, kéo dài
   * rất xa 2 đầu, đặt vào layer riêng 'Tham chiếu' (không phải hình học thi công thật). */
  | 'xline'
  /** Sprint 10 — Việc 3.3: ellipse — click tâm → click góc xác định 2 bán trục (rx,ry). */
  | 'ellipse'
  /** Sprint 10 — Việc 3.4: donut — click tâm, đặt liên tiếp (giữ tool, giống 'block'); bán
   * kính trong/ngoài = donutInnerR/donutOuterR. */
  | 'donut'
  /** Sprint 10 — Việc 3.5: Divide/Measure — click 1 đối tượng → prompt chọn N đoạn (chia đều)
   * hoặc khoảng cách cố định (đo), đặt marker tròn nhỏ tại mỗi điểm chia. */
  | 'divide';

/** Sprint 9 — 2 chế độ UI cho cùng 1 editor (KHÔNG phải 2 app khác nhau, dữ liệu/Doc dùng
 * chung): 'sketch' ẩn bớt công cụ vẽ-chính-xác-kiểu-AutoCAD để giữ đúng triết lý Phase 1
 * ("Sketch, không phải Draft" — xem IF-FEATURE-SPEC-P1-v2.md), 'pro' hiện đủ (Sprint 10). */
export type CadMode = 'sketch' | 'pro';

/**
 * IF2-nền — VAI TRÒ đang đăng nhập (relay pipeline theo IF1_IF2_BIGPICTURE.md §2). Không phải
 * "chức danh nhân sự" mà là VAI TRÒ tại thời điểm mở file: cùng 1 người có thể đổi vai qua nút
 * chuyển vai/impersonation về sau. 'crea' = sáng tạo (mặc định, tương thích user IF1 cũ chưa có
 * role), 'drafter' = hoạ viên kỹ thuật, 'bim' = team triển khai BIM, 'viewer' = chỉ xem (khách/
 * BGĐ demo). Union này là tối thiểu — mở rộng khi có role mới, KHÔNG rename giá trị cũ.
 * ACCESS-CONTROL M1: thêm 'owner' (chủ dự án — full quyền mọi chặng, khớp ProjectMember.role
 * server-side, lib/server/access.ts).
 */
export type CadRole = 'owner' | 'crea' | 'drafter' | 'bim' | 'viewer';

/**
 * IF2-nền — CHẶNG bàn giao dự án theo relay pipeline (IF1_IF2_BIGPICTURE.md §2). Mặc định
 * 'sketch' cho project mới (user IF1 cũ chưa có stage). Chuyển tiếp CHỈ qua `handoff` (bàn
 * giao snapshot version — xem lib/cad/handoff.ts) để chống mất dữ liệu; setStage() thủ công
 * chỉ dùng cho debug/dev.
 */
export type CadStage = 'sketch' | 'technical' | 'bim';

/**
 * IF2-nền — điều kiện HIỂN THỊ tool Pro theo role + stage (mở rộng gate cũ vốn chỉ theo cadMode).
 * Đúng nguyên tắc BIGPICTURE §1: hoạ viên (drafter) hoặc team BIM ở chặng kỹ thuật/BIM mới thấy
 * bộ công cụ Pro; CREA ở chặng sketch chỉ thấy sketch tool. `cadMode='pro'` là OVERRIDE thủ công
 * (backward-compat với UI Sketch/Pro cũ) — kể cả CREA vẫn có thể bật Pro override để mượn tool.
 */
export function shouldShowProTools(role: CadRole, stage: CadStage, cadMode: CadMode): boolean {
  if (cadMode === 'pro') return true; // override thủ công (backward-compat)
  if (role === 'owner') return true; // ACCESS-CONTROL M1: owner full quyền mọi chặng
  return (role === 'drafter' || role === 'bim') && (stage === 'technical' || stage === 'bim');
}

/* ══ ACCESS-CONTROL M1 — cầu nối ProjectMember (server) → store (client) ══════════════════
 * Server lưu ProjectMember.role ('owner'|'crea'|'drafter'|'bim'|'viewer') + Project.currentStage
 * ('concept'|'render'|'present'). 2 hàm thuần dưới đây map về union client; giá trị lạ / null
 * (flow không gắn projectId — nháp cá nhân) → mặc định IF1 cũ ('crea'/'sketch') = backward-
 * compatible: không có membership thì hành vi y hệt hôm nay, gate vẫn theo cadMode thủ công. */

/** ProjectMember.role → CadRole. null/undefined/lạ → 'crea' (mặc định IF1 cũ). */
export function cadRoleFromProjectRole(r: string | null | undefined): CadRole {
  return r === 'owner' || r === 'crea' || r === 'drafter' || r === 'bim' || r === 'viewer' ? r : 'crea';
}

/** Project.currentStage → CadStage ("đã-bàn-giao-chưa": stage tiến lên = GATE trước đã qua).
 * concept→sketch · render→technical · present→bim. null/lạ → 'sketch'. */
export function cadStageFromProjectStage(s: string | null | undefined): CadStage {
  if (s === 'render') return 'technical';
  if (s === 'present') return 'bim';
  return 'sketch'; // 'concept' | null | giá trị lạ
}

/** Công cụ chỉ hiện khi cadMode='pro' (đối chiếu CadToolbar.tsx — nơi ẩn nút tương ứng).
 * Dùng ở setCadMode() để tự trả `tool` về 'select' nếu đang ở 1 tool Pro mà chuyển về Sketch,
 * tránh canvas vẫn "kẹt" hành vi của tool đã ẩn khỏi toolbar. */
export const PRO_ONLY_TOOLS: ReadonlySet<Tool> = new Set<Tool>([
  'polyline', 'circle3p', 'arc', 'arccenter', 'polygon', 'ellipse', 'donut', 'spline', 'xline', 'divide',
  'offset', 'trim', 'extend', 'fillet', 'chamfer', 'arrayrect', 'arraypolar', 'scale', 'stretch',
  'break', 'join', 'explode', 'lengthen',
  'dimension', 'dimradius', 'dimdiameter', 'dimangular', 'dimcontinue', 'dimbaseline',
]);

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
  /** Sprint 9 — mặc định 'sketch' (đúng triết lý Phase 1, xem PRO_ONLY_TOOLS). */
  cadMode: CadMode;
  /** IF2-nền — vai trò user đang mở file (relay pipeline). Mặc định 'crea' cho user IF1 cũ. */
  role: CadRole;
  /** IF2-nền — chặng dự án hiện tại. Mặc định 'sketch'. */
  stage: CadStage;
  /** layer nhận entity mới */
  currentLayer: string;
  snap: SnapSettings;
  /** bước lưới mm (mặc định 100mm, vạch đậm mỗi 1m) */
  gridStep: number;
  /** Nấc 2 — polar tracking: bật/tắt + góc bước (độ, VD 15/30/45/90) */
  polarTracking: boolean;
  polarStep: number;
  /** Ortho khoá hướng ngang/dọc khi vẽ — phím F8 (giữ Shift vẫn là ortho TẠM THỜI, xử lý riêng
   * trong CadCanvas). Đưa lên store (trước đây nằm trong ref nội bộ CadCanvas) để cụm nút cảm
   * ứng ở chế độ Sketch bật/tắt được mà không cần bàn phím vật lý. */
  orthoLock: boolean;
  /** Dynamic Input — HUD số/độ dài cạnh con trỏ, phím F12 (mặc định BẬT). Lên store cùng lý do
   * với orthoLock: thiết bị cảm ứng không có dãy phím F. */
  dynInput: boolean;
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
  /** Nấc 3 — dim style tối thiểu */
  dimStyle: DimStyle;
  /** Nấc 4 — pattern/scale/góc nhớ cho lệnh HATCH (H) */
  hatchPattern: HatchPattern;
  hatchScale: number;
  hatchAngle: number;
  /** Sprint 5 — Việc 1 (material palette): màu áp cho hatch tiếp theo khi chọn 1 "vật liệu"
   * (preset pattern+scale+angle+màu, xem lib/cad/materials.ts). '' = dùng màu layer như cũ. */
  hatchColor: string;
  /** tên vật liệu đang chọn (chỉ để hiện status/tô sáng panel — không lưu vào entity). */
  hatchMaterialId: string | null;
  past: Doc[];
  future: Doc[];
  /** dòng lệnh mini + thông báo trạng thái */
  status: string;
  /** Sprint 4 — clipboard nội bộ bàn phím (Ctrl+C/Ctrl+V), KHÔNG dùng Clipboard API của OS
   * (tránh permission popup) — chỉ copy-paste được TRONG cùng bản vẽ này. */
  clipboard: Entity[];
  /** Sprint 7 — Việc 4: data URL ảnh vừa chọn từ máy, CHỜ click trên canvas để đặt (tool='photo'
   * tự bật khi set khác null — giống pendingBlock). null sau khi đặt xong hoặc Esc huỷ. */
  pendingPhotoSrc: string | null;
  /** Sprint 10 — Việc 2: số cạnh nhớ cho lệnh POLYGON (3-12, mặc định lục giác). */
  polygonSides: number;
  /** Sprint 10 — Việc 3.4: bán kính trong/ngoài nhớ cho lệnh DONUT (mm). */
  donutInnerR: number;
  donutOuterR: number;

  // actions
  setTool: (t: Tool) => void;
  /** Sprint 9 — chuyển Sketch↔Pro. Nếu đang chuyển VỀ 'sketch' mà tool hiện tại là Pro-only,
   * tự trả về 'select' (nút tool đó vừa biến mất khỏi toolbar, không để canvas kẹt hành vi cũ). */
  setCadMode: (m: CadMode) => void;
  /** IF2-nền — đổi vai trò (debug/impersonate). Sau khi đổi, nếu Pro tools không còn được bật
   * theo shouldShowProTools() mà tool hiện tại thuộc PRO_ONLY_TOOLS, tự trả tool về 'select'. */
  setRole: (r: CadRole) => void;
  /** IF2-nền — đổi chặng (debug/dev — sản xuất phải đi qua handoff). Auto-reset tool như setRole. */
  setStage: (s: CadStage) => void;
  /** ACCESS-CONTROL M1 — áp role+stage từ ProjectMember/Project server (GET /api/projects/[id]/
   * members trả myRole + currentStage). Gọi khi mở flow CÓ projectId; flow nháp (không project)
   * thì KHÔNG gọi → giữ mặc định 'crea'/'sketch' như IF1 cũ (backward-compatible). */
  applyProjectAccess: (memberRole: string | null, currentStage: string | null) => void;
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

  /** Sprint 4 — copy-paste bàn phím: copySelection() chép các entity ĐANG chọn vào clipboard
   * nội bộ; pasteClipboard(dx?, dy?) dán bản sao id mới dịch (dx,dy) mm (mặc định +20/+20mm —
   * đủ thấy lệch, không đè bản gốc), rồi tự chọn bản vừa dán. */
  copySelection: () => void;
  pasteClipboard: (dx?: number, dy?: number) => void;

  setViewport: (v: Viewport) => void;
  setSnap: (patch: Partial<SnapSettings>) => void;
  setGridStep: (n: number) => void;
  setPolarTracking: (on: boolean) => void;
  setPolarStep: (deg: number) => void;
  /** F8 — bật/tắt Ortho khoá (hoặc nút cảm ứng tương đương ở CadTouchDock). */
  setOrthoLock: (on: boolean) => void;
  /** F12 — bật/tắt Dynamic Input HUD (hoặc nút cảm ứng tương đương). */
  setDynInput: (on: boolean) => void;
  setCurrentLayer: (id: string) => void;
  addLayer: () => void;
  updateLayer: (id: string, patch: Partial<Layer>) => void;
  removeLayer: (id: string) => void;
  /** Sprint 10 — Việc 3.2 (Xline): tìm layer theo TÊN, tạo mới nếu chưa có (KHÔNG đổi
   * currentLayer, khác addLayer() vốn dành cho nút "+ Lớp" trong panel). Trả về id layer. */
  ensureLayerByName: (name: string, color: string, lineType?: LineType) => string;

  setPendingBlock: (b: string | null) => void;
  setOffsetDist: (d: number) => void;
  setWallThickness: (d: number) => void;
  setFilletRadius: (d: number) => void;
  setChamferDist: (d1: number, d2: number) => void;
  setLengthenDelta: (d: number) => void;
  setDimStyle: (patch: Partial<DimStyle>) => void;
  setHatchPattern: (p: HatchPattern) => void;
  setHatchScale: (n: number) => void;
  setHatchAngle: (n: number) => void;
  setHatchColor: (hex: string) => void;
  /** áp 1 preset vật liệu: đổi cả pattern/scale/angle/màu cùng lúc + chuyển sang tool Hatch. */
  applyMaterial: (id: string, pattern: HatchPattern, scale: number, angle: number, color: string) => void;

  importDoc: (d: Doc, mode: 'replace' | 'merge') => void;
  scaleAll: (factor: number) => void;
  reset: () => void;

  /** Sprint 7 — Việc 3 (markup) + Việc 4 (photo embed): annotation rời trong doc.markups/
   * doc.photos (KHÔNG phải Entity — xem lib/cad/model.ts). Có snapshot() để Undo/Redo áp dụng
   * luôn cho markup/photo, nhất quán với mọi mutation cấu trúc khác trong store này. */
  addMarkup: (pin: MarkupPin) => void;
  removeMarkup: (id: string) => void;
  addPhoto: (photo: PhotoEmbed) => void;
  removePhoto: (id: string) => void;
  /** đặt/huỷ ảnh chờ đặt — truyền src bật tool='photo', truyền null trả tool về 'select'. */
  setPendingPhoto: (src: string | null) => void;

  setPolygonSides: (n: number) => void;
  setDonutRadii: (inner: number, outer: number) => void;
}

function clone(d: Doc): Doc {
  return {
    entities: d.entities.map((e) => ({ ...e })),
    layers: d.layers.map((l) => ({ ...l })),
    markups: (d.markups ?? []).map((m) => ({ ...m })),
    photos: (d.photos ?? []).map((p) => ({ ...p })),
  };
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
  cadMode: 'sketch',
  role: 'crea',
  stage: 'sketch',
  currentLayer: 'l-wall',
  snap: {
    enabled: true, endpoint: true, midpoint: true, center: true, intersection: true, grid: true,
    quadrant: true, node: true, nearest: false, perpendicular: true, tangent: true,
  },
  gridStep: 100,
  polarTracking: false,
  polarStep: 15,
  orthoLock: false,
  dynInput: true,
  viewport: { scale: 0.08, panX: 300, panY: 400 },
  pendingBlock: null,
  offsetDist: 100,
  wallThickness: 110,
  filletRadius: 0,
  chamferD1: 100,
  chamferD2: 100,
  lengthenDelta: 100,
  dimStyle: { textHeight: 120, arrowSize: 80, dimScale: 1 },
  hatchPattern: 'ANSI31',
  hatchScale: 1,
  hatchAngle: 0,
  hatchColor: '',
  hatchMaterialId: null,
  past: [],
  future: [],
  status: 'Sẵn sàng — chọn công cụ hoặc gõ lệnh (L, PL, REC, C…).',
  clipboard: [],
  pendingPhotoSrc: null,
  polygonSides: 6,
  donutInnerR: 50,
  donutOuterR: 150,

  setTool: (tool) =>
    set({
      tool,
      status: toolHint(tool),
      pendingBlock: tool === 'block' ? get().pendingBlock : null,
      // Sprint 7 — Esc/đổi tool tay trong lúc chờ đặt ảnh phải huỷ pendingPhotoSrc, không thì
      // lần click canvas tiếp theo (dù đã đổi tool khác) vẫn "dính" ảnh cũ nếu quay lại 'photo'.
      pendingPhotoSrc: tool === 'photo' ? get().pendingPhotoSrc : null,
    }),
  setStatus: (status) => set({ status }),

  setCadMode: (cadMode) =>
    set((s) => ({
      cadMode,
      tool: !shouldShowProTools(s.role, s.stage, cadMode) && PRO_ONLY_TOOLS.has(s.tool) ? 'select' : s.tool,
    })),

  setRole: (role) =>
    set((s) => ({
      role,
      tool: !shouldShowProTools(role, s.stage, s.cadMode) && PRO_ONLY_TOOLS.has(s.tool) ? 'select' : s.tool,
    })),

  setStage: (stage) =>
    set((s) => ({
      stage,
      tool: !shouldShowProTools(s.role, stage, s.cadMode) && PRO_ONLY_TOOLS.has(s.tool) ? 'select' : s.tool,
    })),

  applyProjectAccess: (memberRole, currentStage) =>
    set((s) => {
      const role = cadRoleFromProjectRole(memberRole);
      const stage = cadStageFromProjectStage(currentStage);
      return {
        role,
        stage,
        tool: !shouldShowProTools(role, stage, s.cadMode) && PRO_ONLY_TOOLS.has(s.tool) ? 'select' : s.tool,
      };
    }),

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
    // Không sửa entity thuộc layer đang KHOÁ (thói quen CAD: layer khoá = bất khả xâm phạm).
    const locked = lockedLayerIds(get().doc);
    const editable = es.filter((e) => !locked.has(e.layer));
    if (!editable.length) return;
    get().snapshot();
    const map = new Map(editable.map((e) => [e.id, e]));
    set((s) => ({ doc: { ...s.doc, entities: s.doc.entities.map((e) => map.get(e.id) ?? e) } }));
  },
  deleteSelected: () => {
    // Chỉ xoá entity KHÔNG thuộc layer khoá (phòng thủ — select() đã lọc, nhưng chắc chắn).
    const sel = new Set(get().selection);
    if (!sel.size) return;
    const locked = lockedLayerIds(get().doc);
    const removable = new Set(
      get().doc.entities.filter((e) => sel.has(e.id) && !locked.has(e.layer)).map((e) => e.id),
    );
    if (!removable.size) return;
    get().snapshot();
    set((s) => ({ doc: { ...s.doc, entities: s.doc.entities.filter((e) => !removable.has(e.id)) }, selection: [] }));
  },
  removeIds: (ids) => {
    const set0 = new Set(ids);
    if (!set0.size) return;
    get().snapshot();
    set((s) => ({ doc: { ...s.doc, entities: s.doc.entities.filter((e) => !set0.has(e.id)) }, selection: [] }));
  },

  select: (ids, additive) =>
    set((s) => {
      // KHÔNG cho chọn entity thuộc layer KHOÁ hoặc ĐANG ẨN (thói quen AutoCAD) → chặn luôn
      // mọi thao tác sửa/xoá/grip downstream vì selection rỗng.
      const locked = lockedLayerIds(s.doc);
      const byId = new Map(s.doc.entities.map((e) => [e.id, e]));
      const allowed = ids.filter((id) => {
        const e = byId.get(id);
        return e ? !locked.has(e.layer) : false;
      });
      return { selection: additive ? Array.from(new Set([...s.selection, ...allowed])) : allowed };
    }),
  clearSelection: () => set({ selection: [] }),

  copySelection: () => {
    const sel = new Set(get().selection);
    if (!sel.size) return;
    const copied = get().doc.entities.filter((e) => sel.has(e.id)).map((e) => ({ ...e }));
    if (!copied.length) return;
    set({ clipboard: copied });
  },
  pasteClipboard: (dx = 20, dy = 20) => {
    const clip = get().clipboard;
    if (!clip.length) return;
    const pasted = pasteEntities(clip, dx, dy);
    get().addEntities(pasted);
    set({ selection: pasted.map((e) => e.id) });
  },

  setViewport: (viewport) => set({ viewport }),
  setSnap: (patch) => set((s) => ({ snap: { ...s.snap, ...patch } })),
  setGridStep: (gridStep) => set({ gridStep }),
  setPolarTracking: (polarTracking) => set({ polarTracking }),
  setPolarStep: (polarStep) => set({ polarStep }),
  setOrthoLock: (orthoLock) => set({ orthoLock }),
  setDynInput: (dynInput) => set({ dynInput }),
  setCurrentLayer: (currentLayer) => set({ currentLayer }),

  addLayer: () => {
    get().snapshot();
    const id = newId('l');
    const palette = ['#47423a', '#c08a5a', '#7aa2c4', '#8fae7a', '#c47a9a', '#b0a07a'];
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
  ensureLayerByName: (name, color, lineType) => {
    const existing = get().doc.layers.find((l) => l.name === name);
    if (existing) return existing.id;
    get().snapshot();
    const id = newId('l');
    set((s) => ({
      doc: { ...s.doc, layers: [...s.doc.layers, { id, name, color, visible: true, locked: false, lineType }] },
    }));
    return id;
  },
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

  // Đặt cửa/cửa sổ/nội thất (toolbar D, lệnh D/WIN, hoặc chọn từ panel Nội thất) đều
  // đi thẳng qua đây, KHÔNG qua setTool → thiếu status hint (thanh dưới đứng yên nội
  // dung tool trước đó, người dùng không biết đang ở chế độ đặt block). Đồng bộ status
  // giống setTool để luôn có phản hồi rõ ràng khi vào chế độ đặt block.
  setPendingBlock: (pendingBlock) =>
    set({
      pendingBlock,
      tool: pendingBlock ? 'block' : get().tool,
      status: pendingBlock ? toolHint('block') : get().status,
    }),
  setOffsetDist: (offsetDist) => set({ offsetDist }),
  setPolygonSides: (n) => set({ polygonSides: Math.max(3, Math.min(12, Math.round(n))) }),
  setDonutRadii: (inner, outer) => set({ donutInnerR: Math.max(0, inner), donutOuterR: Math.max(1, outer) }),
  setWallThickness: (wallThickness) => set({ wallThickness }),
  setFilletRadius: (filletRadius) => set({ filletRadius }),
  setChamferDist: (chamferD1, chamferD2) => set({ chamferD1, chamferD2 }),
  setLengthenDelta: (lengthenDelta) => set({ lengthenDelta }),
  setDimStyle: (patch) => set((s) => ({ dimStyle: { ...s.dimStyle, ...patch } })),
  setHatchPattern: (hatchPattern) => set({ hatchPattern, hatchMaterialId: null }),
  setHatchScale: (hatchScale) => set({ hatchScale, hatchMaterialId: null }),
  setHatchAngle: (hatchAngle) => set({ hatchAngle, hatchMaterialId: null }),
  setHatchColor: (hatchColor) => set({ hatchColor, hatchMaterialId: null }),
  applyMaterial: (hatchMaterialId, hatchPattern, hatchScale, hatchAngle, hatchColor) =>
    set({ hatchMaterialId, hatchPattern, hatchScale, hatchAngle, hatchColor, tool: 'hatch', status: toolHint('hatch') }),

  importDoc: (d, mode) => {
    get().snapshot();
    set((s) =>
      mode === 'replace'
        ? { doc: d, selection: [], currentLayer: d.layers[0]?.id ?? s.currentLayer }
        : {
            doc: {
              entities: [...s.doc.entities, ...d.entities],
              layers: mergeLayers(s.doc.layers, d.layers),
              // giữ markup/photo hiện có khi merge (nhánh 'replace' ở trên đã thay nguyên `d`,
              // không qua đây) — DXF/import khác không mang markup/photo nên chỉ có phía `s.doc`.
              markups: s.doc.markups ?? [],
              photos: s.doc.photos ?? [],
            },
          },
    );
  },
  scaleAll: (factor) => {
    get().snapshot();
    set((s) => ({
      doc: {
        ...s.doc,
        entities: s.doc.entities.map((e) => scaleEntity(e, factor)),
        markups: (s.doc.markups ?? []).map((m) => ({ ...m, at: { x: m.at.x * factor, y: m.at.y * factor } })),
        photos: (s.doc.photos ?? []).map((p) => ({ ...p, at: { x: p.at.x * factor, y: p.at.y * factor } })),
      },
    }));
  },

  reset: () => set({ doc: emptyDoc(), selection: [], past: [], future: [], currentLayer: 'l-wall', pendingPhotoSrc: null }),

  addMarkup: (pin) => {
    get().snapshot();
    set((s) => ({ doc: { ...s.doc, markups: [...(s.doc.markups ?? []), pin] } }));
  },
  removeMarkup: (id) => {
    get().snapshot();
    set((s) => ({ doc: { ...s.doc, markups: (s.doc.markups ?? []).filter((m) => m.id !== id) } }));
  },
  addPhoto: (photo) => {
    get().snapshot();
    set((s) => ({ doc: { ...s.doc, photos: [...(s.doc.photos ?? []), photo] } }));
  },
  removePhoto: (id) => {
    get().snapshot();
    set((s) => ({ doc: { ...s.doc, photos: (s.doc.photos ?? []).filter((p) => p.id !== id) } }));
  },
  setPendingPhoto: (pendingPhotoSrc) =>
    set({
      pendingPhotoSrc,
      tool: pendingPhotoSrc ? 'photo' : get().tool === 'photo' ? 'select' : get().tool,
      status: pendingPhotoSrc ? toolHint('photo') : get().status,
    }),
}));

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.__cadStore = useCadStore;
}

function mergeLayers(a: Layer[], b: Layer[]): Layer[] {
  const byName = new Map(a.map((l) => [l.name, l]));
  const out = [...a];
  for (const l of b) if (!byName.has(l.name)) out.push(l);
  return out;
}

function scaleEntity(e: Entity, f: number): Entity {
  switch (e.type) {
    case 'line':
      return { ...e, a: { x: e.a.x * f, y: e.a.y * f }, b: { x: e.b.x * f, y: e.b.y * f } };
    case 'dim':
      return {
        ...e,
        a: { x: e.a.x * f, y: e.a.y * f },
        b: { x: e.b.x * f, y: e.b.y * f },
        off: e.off * f,
        ...(e.c ? { c: { x: e.c.x * f, y: e.c.y * f } } : {}),
      };
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

// export để CadCanvas reset status bar về hint của tool hiện tại khi Backspace xoá hết
// dynBuf (không thì status còn hiển thị "Nhập độ dài: …" cũ dù buffer đã rỗng).
export function toolHint(t: Tool): string {
  const H: Record<Tool, string> = {
    select: 'Chọn: click vào đối tượng, hoặc quây khung. Xoá = Delete/Backspace/E.',
    line: 'Line (L): click điểm đầu → điểm cuối. Gõ số + Enter = độ dài. Esc huỷ.',
    polyline: 'Polyline (PL): click các điểm; Enter/double-click kết thúc; C đóng.',
    rect: 'Rect (REC): click 2 góc đối diện.',
    circle: 'Circle (C): click tâm → điểm trên đường tròn (hoặc gõ bán kính).',
    circle3p: 'Circle 3-điểm: click 3 điểm bất kỳ nằm trên đường tròn cần vẽ.',
    arc: 'Arc 3-điểm: click 3 điểm (đầu · giữa · cuối).',
    arccenter: 'Arc tâm+góc: click tâm → điểm bắt đầu (bán kính+góc đầu) → điểm kết thúc (góc cuối).',
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
    dimradius: 'Dim Radius (DRA): click lên CIRCLE/ARC cần ghi bán kính.',
    dimdiameter: 'Dim Diameter (DDI): click lên CIRCLE/ARC cần ghi đường kính.',
    dimangular: 'Dim Angular (DAN): click 2 đường LINE tạo góc → click vị trí đặt cung đo.',
    dimcontinue: 'Dim Continue (DCO): click điểm tiếp theo — nối từ điểm cuối của dim gần nhất, cùng đường kích thước.',
    dimbaseline: 'Dim Baseline (DBA): click điểm tiếp theo — đo từ gốc chung của dim gần nhất, xếp lớp ra ngoài.',
    hatch: 'Hatch (H): click 1 điểm bên trong vùng kín cần tô. Gõ lệnh "H ANSI31/ANSI32/ANSI37/SOLID/DOTS" để đổi pattern.',
    markup: 'Markup (MK): click vào bản vẽ → gõ ghi chú phản hồi KH → Enter. Rê chuột qua ghim để xem lại, click ghim để xoá.',
    photo: 'Ảnh hiện trường: click vào vị trí trên bản vẽ để gắn ảnh vừa chọn.',
    polygon: 'Polygon (POL): click tâm → click bán kính (hoặc gõ số). Gõ "POL 8" đổi số cạnh trước khi vẽ.',
    spline: 'Spline (SPL): click các control point; Enter/double-click kết thúc; C đóng vòng.',
    xline: 'Xline (XL): click 2 điểm xác định hướng — tạo đường tham chiếu kéo dài rất xa 2 đầu, nằm ở layer "Tham chiếu".',
    ellipse: 'Ellipse (EL): click tâm → click góc xác định 2 bán trục (rx theo X, ry theo Y).',
    donut: 'Donut (DO): click tâm để đặt (đặt liên tiếp). Gõ "DO 50 150" đổi bán kính trong/ngoài trước khi đặt.',
    divide: 'Divide/Measure (DIV/MEA): click 1 line/polyline/circle/arc → nhập số đoạn (Divide) hoặc khoảng cách (Measure).',
  };
  return H[t];
}
