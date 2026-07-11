/**
 * lib/cad/model.ts — MÔ HÌNH dữ liệu bản vẽ 2D (đơn vị: milimét, mm).
 *
 * Trục toạ độ THẾ GIỚI: X sang phải, Y HƯỚNG LÊN (chuẩn CAD). Canvas có Y hướng xuống
 * nên phần render sẽ lật Y (xem viewport helpers cuối file). Mọi entity lưu toạ độ mm thật;
 * chỉ khi vẽ mới đổi sang pixel. Giữ module này THUẦN (không phụ thuộc React/DOM) để test dễ
 * và không dính SSR.
 */

export interface Pt {
  x: number;
  y: number;
}

/** Lớp (layer) — entity mới rơi vào layer hiện hành; ẩn/khoá theo cờ. */
export interface Layer {
  id: string;
  name: string;
  /** màu hex '#rrggbb' — dùng cho mọi entity thuộc layer trừ khi entity tự override. */
  color: string;
  visible: boolean;
  locked: boolean;
}

export type EntityType =
  | 'line'
  | 'polyline'
  | 'rect'
  | 'circle'
  | 'arc'
  | 'text'
  | 'dim'
  | 'block'
  | 'hatch';

interface Base {
  id: string;
  type: EntityType;
  layer: string;
  /** override màu layer (hiếm dùng) */
  color?: string;
}

export interface LineEntity extends Base {
  type: 'line';
  a: Pt;
  b: Pt;
}

export interface PolylineEntity extends Base {
  type: 'polyline';
  points: Pt[];
  closed: boolean;
}

/** Rect lưu 1 góc + rộng/cao (w,h có thể âm). Vẽ như 4 cạnh. */
export interface RectEntity extends Base {
  type: 'rect';
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CircleEntity extends Base {
  type: 'circle';
  c: Pt;
  r: number;
}

/** Cung tròn: từ a1 → a2 (radian, ngược chiều kim đồng hồ trong hệ Y-up). */
export interface ArcEntity extends Base {
  type: 'arc';
  c: Pt;
  r: number;
  a1: number;
  a2: number;
}

export interface TextEntity extends Base {
  type: 'text';
  at: Pt;
  text: string;
  /** chiều cao chữ (mm) */
  h: number;
}

/** Loại dimension (Nấc 3). Thiếu `kind` (dữ liệu cũ) ⇒ coi như 'aligned' (tương thích ngược). */
export type DimKind = 'aligned' | 'radius' | 'diameter' | 'angular';

/**
 * Dimension — Nấc 3 mở rộng 4 kiểu, vẫn dùng chung a/b/off (+ c cho angular) để KHÔNG phá vỡ
 * mọi chỗ đang xử lý 'dim' như 1 đối tượng "2 điểm" (translate/rotate/mirror/hitTest…):
 *  - aligned  (DAL): a/b = 2 điểm đo, off = độ lệch đường kích thước (mm, dấu = phía).
 *  - radius   (DRA): a = tâm, b = điểm trên đường tròn/cung (xác định hướng leader); r = |a-b|.
 *  - diameter (DDI): giống radius nhưng vẽ xuyên tâm (điểm đối xứng qua a).
 *  - angular  (DAN): c = đỉnh góc; a/b = điểm bất kỳ trên mỗi cạnh (chỉ lấy HƯỚNG từ c); off =
 *    bán kính cung đo góc.
 */
export interface DimEntity extends Base {
  type: 'dim';
  kind?: DimKind;
  a: Pt;
  b: Pt;
  /** độ lệch đường ghi kích thước (aligned) HOẶC bán kính cung đo (angular), mm */
  off: number;
  /** CHỈ dùng khi kind==='angular': đỉnh góc */
  c?: Pt;
}

/** Thể hiện 1 block furniture: key tra trong lib/cad/furniture.ts + phép biến hình. */
export interface BlockEntity extends Base {
  type: 'block';
  block: string;
  at: Pt;
  /** góc xoay (radian) */
  rot: number;
  /** tỉ lệ; sx<0 = lật gương ngang */
  sx: number;
  sy: number;
}

/**
 * Vùng tô đặc (poché tường / fill mặt bằng). Biên là 1 đa giác đơn giản (lồi hoặc gần-lồi —
 * đủ cho quad tường do lệnh WALL sinh ra). Xuất DXF: tam-giác-hoá quạt từ đỉnh 0 thành các
 * entity SOLID (an toàn ở mọi bản DXF, không cần bảng BLOCK_RECORD như HATCH thật).
 */
export interface HatchEntity extends Base {
  type: 'hatch';
  points: Pt[];
  /** true = tô đặc (mặc định). Để ngỏ cho pattern sau này. */
  solid?: boolean;
}

export type Entity =
  | LineEntity
  | PolylineEntity
  | RectEntity
  | CircleEntity
  | ArcEntity
  | TextEntity
  | DimEntity
  | BlockEntity
  | HatchEntity;

export interface Doc {
  entities: Entity[];
  layers: Layer[];
}

export const DEFAULT_LAYERS: Layer[] = [
  { id: 'l-wall', name: 'Tường', color: '#e8e4dc', visible: true, locked: false },
  { id: 'l-furniture', name: 'Nội thất', color: '#c08a5a', visible: true, locked: false },
  { id: 'l-dim', name: 'Kích thước', color: '#7aa2c4', visible: true, locked: false },
  { id: 'l-text', name: 'Ghi chú', color: '#9a9488', visible: true, locked: false },
];

export function emptyDoc(): Doc {
  return { entities: [], layers: DEFAULT_LAYERS.map((l) => ({ ...l })) };
}

/* ───────────────────────── hình học tiện ích ───────────────────────── */

export function dist(a: Pt, b: Pt): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function mid(a: Pt, b: Pt): Pt {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/** Khoảng cách từ điểm p đến đoạn thẳng a-b + điểm gần nhất trên đoạn. */
export function nearestOnSeg(p: Pt, a: Pt, b: Pt): { pt: Pt; d: number } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const pt = { x: a.x + t * dx, y: a.y + t * dy };
  return { pt, d: dist(p, pt) };
}

/** Giao 2 đoạn thẳng (nếu có, trong biên đoạn). null nếu song song / không cắt. */
export function segIntersect(a: Pt, b: Pt, c: Pt, d: Pt): Pt | null {
  const r = { x: b.x - a.x, y: b.y - a.y };
  const s = { x: d.x - c.x, y: d.y - c.y };
  const denom = r.x * s.y - r.y * s.x;
  if (Math.abs(denom) < 1e-9) return null;
  const t = ((c.x - a.x) * s.y - (c.y - a.y) * s.x) / denom;
  const u = ((c.x - a.x) * r.y - (c.y - a.y) * r.x) / denom;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return { x: a.x + t * r.x, y: a.y + t * r.y };
}

export interface Box {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function growBox(box: Box, p: Pt) {
  box.minX = Math.min(box.minX, p.x);
  box.minY = Math.min(box.minY, p.y);
  box.maxX = Math.max(box.maxX, p.x);
  box.maxY = Math.max(box.maxY, p.y);
}

/** Bao hình của 1 entity (xấp xỉ với block/text). */
export function entityBox(e: Entity): Box {
  const box: Box = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  switch (e.type) {
    case 'line':
      growBox(box, e.a);
      growBox(box, e.b);
      break;
    case 'dim':
      growBox(box, e.a);
      growBox(box, e.b);
      if (e.c) growBox(box, e.c);
      break;
    case 'polyline':
      e.points.forEach((p) => growBox(box, p));
      break;
    case 'rect':
      growBox(box, { x: e.x, y: e.y });
      growBox(box, { x: e.x + e.w, y: e.y + e.h });
      break;
    case 'circle':
    case 'arc':
      growBox(box, { x: e.c.x - e.r, y: e.c.y - e.r });
      growBox(box, { x: e.c.x + e.r, y: e.c.y + e.r });
      break;
    case 'text':
      growBox(box, e.at);
      growBox(box, { x: e.at.x + e.text.length * e.h * 0.6, y: e.at.y + e.h });
      break;
    case 'block':
      // xấp xỉ: block chuẩn ~2000mm; scale áp vào. Đủ cho zoom-extents.
      growBox(box, { x: e.at.x - 1200 * Math.abs(e.sx), y: e.at.y - 1200 * Math.abs(e.sy) });
      growBox(box, { x: e.at.x + 1200 * Math.abs(e.sx), y: e.at.y + 1200 * Math.abs(e.sy) });
      break;
    case 'hatch':
      e.points.forEach((p) => growBox(box, p));
      break;
  }
  return box;
}

/** Bao hình toàn bản vẽ; null nếu rỗng. */
export function docBox(doc: Doc): Box | null {
  if (!doc.entities.length) return null;
  const box: Box = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  for (const e of doc.entities) {
    const b = entityBox(e);
    if (Number.isFinite(b.minX)) {
      box.minX = Math.min(box.minX, b.minX);
      box.minY = Math.min(box.minY, b.minY);
      box.maxX = Math.max(box.maxX, b.maxX);
      box.maxY = Math.max(box.maxY, b.maxY);
    }
  }
  return Number.isFinite(box.minX) ? box : null;
}

/* ───────────────────────── viewport (world mm ↔ screen px) ───────────────────────── */

/** scale = px trên mỗi mm; pan = vị trí px của gốc toạ độ (world 0,0) trên canvas. */
export interface Viewport {
  scale: number;
  panX: number;
  panY: number;
}

export function worldToScreen(v: Viewport, w: Pt): Pt {
  return { x: w.x * v.scale + v.panX, y: -w.y * v.scale + v.panY };
}

export function screenToWorld(v: Viewport, s: Pt): Pt {
  return { x: (s.x - v.panX) / v.scale, y: (v.panY - s.y) / v.scale };
}

/** Zoom quanh 1 điểm màn hình (giữ điểm world dưới con trỏ cố định). */
export function zoomAt(v: Viewport, screen: Pt, factor: number, min = 0.002, max = 20): Viewport {
  const w = screenToWorld(v, screen);
  const scale = Math.max(min, Math.min(max, v.scale * factor));
  return { scale, panX: screen.x - w.x * scale, panY: screen.y + w.y * scale };
}

/** Fit bao hình vào khung (Zoom Extents) với lề. */
export function fitBox(box: Box, width: number, height: number, pad = 60): Viewport {
  const bw = Math.max(1, box.maxX - box.minX);
  const bh = Math.max(1, box.maxY - box.minY);
  const scale = Math.min((width - pad * 2) / bw, (height - pad * 2) / bh);
  const cx = (box.minX + box.maxX) / 2;
  const cy = (box.minY + box.maxY) / 2;
  return { scale, panX: width / 2 - cx * scale, panY: height / 2 + cy * scale };
}
