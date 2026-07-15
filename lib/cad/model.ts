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

/**
 * Nét vẽ (linetype) — tối thiểu theo ISO 128: continuous (liền), hidden (khuất, gạch ngắn đều),
 * center (trục, chain gạch dài-ngắn-dài), dashed (nét đứt trung), phantom (gạch dài-ngắn-ngắn).
 */
export type LineType = 'continuous' | 'hidden' | 'center' | 'dashed' | 'phantom';

/**
 * Bề dày nét (lineweight, mm) — thang chuẩn hay dùng trong DXF/AutoCAD (khớp enum group 370,
 * xem dxf.ts). Phân cấp theo ISO 128 cho bản vẽ kiến trúc nội thất tỉ lệ 1:50-1:100:
 *   0.13/0.18 — mảnh: kích thước, hatch, nét khuất, trục lưới
 *   0.25/0.35 — trung: thiết bị/nội thất/cửa sổ/đường bao không cắt
 *   0.50/0.70 — đậm: tường bị mặt phẳng cắt qua (mặt bằng) + khung tên/khung bao
 */
export const STANDARD_LINEWEIGHTS = [0.13, 0.18, 0.25, 0.35, 0.5, 0.7, 1.0] as const;

/**
 * Chiều cao chữ chuẩn ISO 3098 (mm, ĐO TRÊN GIẤY sau khi in — không phải mm world lưu trong
 * TextEntity.h, vốn là kích thước THẬT ngoài đời ở tỉ lệ 1:1). Quy đổi: h_world = h_iso ×
 * tỉ lệ bản vẽ (VD tỉ lệ 1:50 → muốn chữ cao 3.5mm trên giấy thì h_world = 3.5×50 = 175mm).
 * Cần pipeline in ấn (Nấc 7 — paper space/tỉ lệ khổ giấy) để tự động hoá quy đổi này; hiện tại
 * đây là hằng số THAM CHIẾU cho người vẽ tự chọn khi đặt TEXT/DIM (chưa có UI tự tính).
 */
export const ISO_TEXT_HEIGHTS_MM = [2.5, 3.5, 5, 7, 10] as const;

/** Lớp (layer) — entity mới rơi vào layer hiện hành; ẩn/khoá theo cờ. */
export interface Layer {
  id: string;
  name: string;
  /** màu hex '#rrggbb' — dùng cho mọi entity thuộc layer trừ khi entity tự override. */
  color: string;
  visible: boolean;
  locked: boolean;
  /** bề dày nét mặc định của layer (mm, khổ giấy in — xem STANDARD_LINEWEIGHTS). Thiếu ⇒ 0.25
   * (tương thích ngược với layer cũ tạo trước khi có field này). */
  lineweight?: number;
  /** nét vẽ mặc định của layer. Thiếu ⇒ 'continuous' (tương thích ngược). */
  lineType?: LineType;
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
  /** override lineweight/lineType của layer (hiếm dùng — giống cơ chế override màu ở trên). */
  lineweight?: number;
  lineType?: LineType;
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

  // ---- MỚI (Sprint 3, B2 — xem SHAPE-SCHEMA.md) ----
  /** id của ShapeVariant (lib/cad/furniture.ts) đang chọn; thiếu = variant mặc định (w/h/prims gốc). */
  variant?: string;
  /** true khi overlap object khác — tính lại mỗi lần render/move (lib/cad/shape-interactions.ts),
   * KHÔNG phải dữ liệu bền vững, KHÔNG serialize vào .idf/DXF. */
  collision?: boolean;
}

/**
 * Vùng tô đặc (poché tường / fill mặt bằng). Biên là 1 đa giác đơn giản (lồi hoặc gần-lồi —
 * đủ cho quad tường do lệnh WALL sinh ra). Xuất DXF: tam-giác-hoá quạt từ đỉnh 0 thành các
 * entity SOLID (an toàn ở mọi bản DXF, không cần bảng BLOCK_RECORD như HATCH thật).
 */
/** Pattern hatch (Nấc 4). Thiếu `pattern` (dữ liệu cũ — poché tường từ WALL) ⇒ coi như SOLID
 * đặc, giữ đúng hành vi cũ (tô đặc, không đường gạch). */
export type HatchPattern = 'SOLID' | 'ANSI31' | 'ANSI32' | 'ANSI37' | 'DOTS';

export interface HatchEntity extends Base {
  type: 'hatch';
  points: Pt[];
  /** true = tô đặc. Khi có `pattern`, field này chỉ còn ý nghĩa lịch sử (giữ tương thích ngược
   * với dữ liệu cũ); ưu tiên đọc `pattern` nếu có. */
  solid?: boolean;
  pattern?: HatchPattern;
  /** tỉ lệ khoảng cách nét gạch (1 = mặc định ~60mm/nét); chỉ áp dụng khi pattern != SOLID. */
  patternScale?: number;
  /** góc nét gạch, độ (0-360); chỉ áp dụng khi pattern != SOLID/DOTS. */
  patternAngle?: number;
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
  { id: 'l-wall', name: 'Tường', color: '#e8e4dc', visible: true, locked: false, lineweight: 0.6, lineType: 'continuous' },
  { id: 'l-furniture', name: 'Nội thất', color: '#c08a5a', visible: true, locked: false, lineweight: 0.3, lineType: 'continuous' },
  { id: 'l-dim', name: 'Kích thước', color: '#7aa2c4', visible: true, locked: false, lineweight: 0.15, lineType: 'continuous' },
  { id: 'l-text', name: 'Ghi chú', color: '#9a9488', visible: true, locked: false, lineweight: 0.15, lineType: 'continuous' },
  { id: 'l-axis', name: 'Trục', color: '#8a7a9a', visible: true, locked: false, lineweight: 0.13, lineType: 'center' },
];

export function emptyDoc(): Doc {
  return { entities: [], layers: DEFAULT_LAYERS.map((l) => ({ ...l })) };
}

/* ───────────────────────── hình học tiện ích ───────────────────────── */

export function dist(a: Pt, b: Pt): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Biến đổi 1 điểm LOCAL (mm, gốc tâm block) sang WORLD theo phép biến hình của BlockEntity:
 * scale → rotate → translate (khớp `blockLocalToWorld` trong lib/cad/render.ts — dùng CHUNG
 * công thức này ở lib/cad/grips.ts + lib/cad/shape-interactions.ts để không lệch nhau).
 */
export function blockToWorld(local: Pt, xf: { at: Pt; rot: number; sx: number; sy: number }): Pt {
  const x = local.x * xf.sx;
  const y = local.y * xf.sy;
  const cos = Math.cos(xf.rot);
  const sin = Math.sin(xf.rot);
  return { x: xf.at.x + x * cos - y * sin, y: xf.at.y + x * sin + y * cos };
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
