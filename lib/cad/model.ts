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
  | 'hatch'
  // Zone tool (24/07 — docs GAP-COLOR-FILL, N1 additive): 3 loại mới, `.idf` cũ KHÔNG có
  // các type này nên parse/render như cũ, không breaking.
  | 'ellipse'
  | 'arrow'
  | 'zone';

/**
 * IF2-nền — phân loại phần tử BIM/IFC 4.0 (Quyết định 258/QĐ-TTg). Optional để `.idf` cũ
 * KHÔNG breaking — entity không có `elementType` vẫn parse/render bình thường, chỉ là chưa gán
 * ngữ nghĩa BIM. Union này khớp tập entity IFC hay dùng nhất cho nội thất/kiến trúc phổ thông
 * (IfcWall / IfcSlab / IfcColumn / IfcBeam / IfcDoor / IfcWindow / IfcFurnishingElement); giá trị
 * null CÓ Ý NGHĨA riêng — "đã kiểm và xác định không phải phần tử BIM" (phân biệt với `undefined`
 * = "chưa gán, dữ liệu cũ chưa migrate"). Xem IF1_IF2_BIGPICTURE.md §3, mở rộng khi cần.
 */
export type ElementType =
  | 'wall'
  | 'slab'
  | 'column'
  | 'beam'
  | 'door'
  | 'window'
  | 'furniture'
  /** B1 (24/07) — IfcSpace: vùng không gian/phòng (nhãn phòng, zone). Additive, không breaking. */
  | 'space'
  | null;

/**
 * B1 (24/07) — danh mục ElementType cho UI gán (property panel). `null` có nghĩa riêng
 * "đã kiểm, KHÔNG phải phần tử BIM"; undefined (không có trong list này) = chưa gán.
 * Nhãn song ngữ Việt dẫn trước theo quy ước TTT.
 */
export const ELEMENT_TYPE_OPTIONS: { value: Exclude<ElementType, null> | 'null'; label: string }[] = [
  { value: 'wall', label: 'Tường · IfcWall' },
  { value: 'slab', label: 'Sàn · IfcSlab' },
  { value: 'column', label: 'Cột · IfcColumn' },
  { value: 'beam', label: 'Dầm · IfcBeam' },
  { value: 'door', label: 'Cửa đi · IfcDoor' },
  { value: 'window', label: 'Cửa sổ · IfcWindow' },
  { value: 'furniture', label: 'Nội thất · IfcFurnishingElement' },
  { value: 'space', label: 'Không gian · IfcSpace' },
  { value: 'null', label: 'Không phải phần tử BIM' },
];

interface Base {
  id: string;
  type: EntityType;
  layer: string;
  /** override màu layer (hiếm dùng) */
  color?: string;
  /** override lineweight/lineType của layer (hiếm dùng — giống cơ chế override màu ở trên). */
  lineweight?: number;
  lineType?: LineType;
  /** IF2-nền — tầng chứa entity (BIM storey), VD 'GF' / 'L1' / 'L2'. Optional, `.idf` cũ không
   * có field này vẫn parse bình thường. Chưa có UI gán ở IF1; hiện chỉ nền dữ liệu cho IF2-C. */
  storey?: string;
  /** IF2-nền — phân loại BIM/IFC 4.0 (xem `ElementType`). Optional, backward-compatible. */
  elementType?: ElementType;
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

  // ---- MỚI (Hệ Legend X1 — docs/PROPOSAL-LEGEND-SYSTEM.md §2.2) ----
  /** FK mềm ProductSpec.id (bảng Prisma) — schedule/legend/spec-sheet đọc sku/brand/giá qua id
   * này. Optional + chỉ là chuỗi id ⇒ `.idf` cũ không có field vẫn parse bình thường (nguyên
   * tắc additive như elementType/storey); DXF export bỏ qua (không phá round-trip). */
  specId?: string;
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
  /** Zone tool (N1) — độ mờ per-entity 0–1, thay hardcode globalAlpha 0.9 trong render.ts.
   * Thiếu ⇒ 0.9 (GIỮ NGUYÊN hành vi cũ, backward-compat). Chỉ áp cho SOLID/DOTS. */
  opacity?: number;
}

/* ───────── Zone tool (N1 — GAP-COLOR-FILL) — entity ellipse/arrow/zone ───────── */

/** Ellipse THẬT (khác tool 'ellipse' cũ vốn xấp xỉ PolylineEntity 48 điểm): tâm + 2 bán trục
 * (mm) + góc xoay quanh tâm (rad, optional). Dùng làm biên zone oval + hình học độc lập. */
export interface EllipseEntity extends Base {
  type: 'ellipse';
  c: Pt;
  rx: number;
  ry: number;
  rot?: number;
}

/** Mũi tên tự do (circulation flow) — polyline 2+ điểm, đầu mũi tên tam giác ở đầu/cuối path.
 * Nét đứt: đặt `lineType: 'dashed'` (kế thừa Base) như mọi entity khác. */
export interface ArrowEntity extends Base {
  type: 'arrow';
  path: Pt[];
  /** mũi tên ở ĐIỂM ĐẦU path (mặc định false). */
  headStart?: boolean;
  /** mũi tên ở ĐIỂM CUỐI path (mặc định true). */
  headEnd?: boolean;
  /** kích thước đầu mũi tên (mm, mặc định 250). */
  headSize?: number;
}

/** 6 nhóm chức năng VN hoá (chốt 24/07): Khu ướt · Khu sinh hoạt chung · Khu riêng tư ·
 * Khu làm việc · Ban công/loggia · Phụ trợ/kỹ thuật. */
export type ZoneGroup = 'wet' | 'social' | 'private' | 'work' | 'balcony' | 'service';

/** Metadata hiển thị của từng nhóm zone — nguồn sự thật CHUNG cho render (màu fill), legend
 * panel và DXF export. Màu pastel hài hoà trên cả nền sáng/tối, opacity mặc định 0.4. */
export const ZONE_GROUP_META: Record<ZoneGroup, { vi: string; en: string; color: string }> = {
  wet: { vi: 'Khu ướt', en: 'Wet area', color: '#6FB5DC' },
  social: { vi: 'Khu sinh hoạt chung', en: 'Social', color: '#E9C46A' },
  private: { vi: 'Khu riêng tư', en: 'Private', color: '#E39A80' },
  work: { vi: 'Khu làm việc', en: 'Work', color: '#95BF7B' },
  balcony: { vi: 'Ban công / loggia', en: 'Balcony · Loggia', color: '#7FC9B4' },
  service: { vi: 'Phụ trợ / kỹ thuật', en: 'Service · MEP', color: '#A695C9' },
};

export const ZONE_GROUPS: ZoneGroup[] = ['wet', 'social', 'private', 'work', 'balcony', 'service'];

/** mặc định opacity zone (chốt 24/07: 40%). */
export const ZONE_DEFAULT_OPACITY = 0.4;

/**
 * Zone = vùng chức năng phủ đè mặt bằng ("mapa de zonas"). Biên là ellipse HOẶC polygon
 * (đúng 1 field được set — hỗ trợ CẢ 2, chốt 24/07). Màu lấy theo `group` qua ZONE_GROUP_META
 * (entity.color vẫn override được như mọi entity). Zone KHÔNG phải hình học thi công — render
 * ĐÈ TRÊN geometry, DƯỚI dimension/text (xem drawEntities trong render.ts).
 */
export interface ZoneEntity extends Base {
  type: 'zone';
  polygon?: Pt[];
  ellipse?: { c: Pt; rx: number; ry: number; rot?: number };
  /** nhãn chức năng in trên zone, VD "PHÒNG KHÁCH". */
  label: string;
  /** nhãn phụ tiếng Anh (optional, in nhỏ dưới label chính). */
  labelEn?: string;
  group: ZoneGroup;
  /** 0–1, mặc định ZONE_DEFAULT_OPACITY. */
  opacity: number;
  /** override vị trí nhãn; thiếu = centroid biên. */
  labelPos?: Pt;
}

/** Xấp xỉ biên zone thành polygon (ellipse → N điểm, có xoay). Dùng chung cho hit-test/bbox/
 * DXF export/centroid — 1 công thức duy nhất, không lệch nhau. */
export function zoneBoundaryPoints(z: ZoneEntity, segments = 32): Pt[] {
  if (z.polygon && z.polygon.length >= 3) return z.polygon;
  if (z.ellipse) return ellipseBoundaryPoints(z.ellipse.c, z.ellipse.rx, z.ellipse.ry, z.ellipse.rot ?? 0, segments);
  return [];
}

/** N điểm trên biên ellipse tâm c, bán trục rx/ry, xoay `rot` rad quanh tâm. */
export function ellipseBoundaryPoints(c: Pt, rx: number, ry: number, rot = 0, segments = 32): Pt[] {
  const n = Math.max(8, segments);
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const x = rx * Math.cos(t);
    const y = ry * Math.sin(t);
    pts.push({ x: c.x + x * cos - y * sin, y: c.y + x * sin + y * cos });
  }
  return pts;
}

/** Trọng tâm (centroid trung bình đỉnh — đủ cho vị trí nhãn) của biên zone. */
export function zoneCentroid(z: ZoneEntity): Pt {
  if (z.ellipse) return { ...z.ellipse.c };
  const pts = z.polygon ?? [];
  if (!pts.length) return { x: 0, y: 0 };
  let sx = 0;
  let sy = 0;
  for (const p of pts) {
    sx += p.x;
    sy += p.y;
  }
  return { x: sx / pts.length, y: sy / pts.length };
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
  | HatchEntity
  | EllipseEntity
  | ArrowEntity
  | ZoneEntity;

/**
 * Sprint 7 — Việc 3 (Markup overlay): ghim ghi chú KH đặt trên bản vẽ. KHÔNG phải hình học
 * (không vào Entity union) — annotation rời, không ảnh hưởng vẽ tường/phòng/hatch/DXF export.
 * Toạ độ world mm giống entity khác nên pan/zoom/scale-all vẫn đúng vị trí ghim.
 */
export interface MarkupPin {
  id: string;
  at: Pt;
  text: string;
  /** màu ghim, hex '#rrggbb'. */
  color: string;
  /** epoch ms lúc tạo — hiện trong tooltip. */
  ts: number;
}

/**
 * Sprint 7 — Việc 4 (Photo embed): ảnh hiện trường gắn tại 1 điểm trên bản vẽ (thumbnail nhỏ,
 * click xem full-size). Cũng là annotation rời như MarkupPin — KHÔNG vào Entity union.
 * `src` là data URL (giống pattern ảnh khác trong app — xem components/studio/UploadButton.tsx).
 */
export interface PhotoEmbed {
  id: string;
  at: Pt;
  src: string;
  caption?: string;
  ts: number;
}

/**
 * Zone tool (N3) — lớp ảnh site/aerial do user tự upload, TRẢI THEO WORLD BOUNDS (mm) nên
 * pan/zoom/scale-all đúng vị trí (khác PhotoEmbed vốn là thumbnail cố định px tại 1 điểm).
 * Render TRƯỚC mọi entity (nền dưới cùng). Optional — `.idf` cũ không có field này.
 */
export interface SiteImage {
  src: string; // data URL
  /** góc dưới-trái theo world mm (Y-up). */
  x: number;
  y: number;
  /** kích thước world mm. */
  w: number;
  h: number;
  /** 0–1, mặc định 0.6. */
  opacity: number;
  visible: boolean;
}

export interface Doc {
  entities: Entity[];
  layers: Layer[];
  /** Sprint 7 — annotation rời (markup + ảnh); optional để tương thích ngược dữ liệu cũ. */
  markups?: MarkupPin[];
  photos?: PhotoEmbed[];
  /** Zone tool — ảnh aerial nền (optional, backward-compat). */
  siteImage?: SiteImage | null;
  /**
   * B1 (24/07) — TỈ LỆ IN per-sheet: N của "1:N" (20/25/50/100/200…). undefined = auto-fit
   * (hành vi cũ nguyên vẹn — fitBox/fitScaleLabel). Lưu trong Doc nên tự per-sheet (mỗi sheet
   * giữ Doc riêng) + tự vào .idf (JSON). Xem STANDARD_SCALES/fixedScaleViewport bên dưới.
   */
  printScale?: number;
  /** B1 (24/07) — khổ giấy in per-sheet (A3/A2/A1, ngang). undefined = A3 (mặc định cũ). */
  paperKey?: PaperKey;
}

/* ───────────────────────── B1 — tỉ lệ bản vẽ chuẩn + khổ giấy (paper-space cơ bản) ───────────────────────── */

export type PaperKey = 'A3' | 'A2' | 'A1';

/** Khổ giấy ISO 216 NGANG (mm) — A3 khớp DEFAULT_PDF_PAPER_MM cũ của pdf.ts. */
export const PAPER_SIZES_MM: Record<PaperKey, [number, number]> = {
  A3: [420, 297],
  A2: [594, 420],
  A1: [841, 594],
};

/** Thang tỉ lệ kiến trúc chuẩn (1:N) — ISO 5455 / thực hành hồ sơ nội thất. */
export const STANDARD_SCALES = [10, 20, 25, 50, 100, 200, 500] as const;

/**
 * Gợi ý tỉ lệ CHUẨN nhỏ nhất (chi tiết nhất) mà bản vẽ vẫn lọt khổ giấy: N chuẩn đầu tiên
 * ≥ 1/fitScale. Vượt cả 1:500 → trả 500 (bản vẽ cực lớn, người dùng tự cân nhắc).
 */
export function suggestStandardScale(box: Box | null, paperMm: [number, number], margin: number): number {
  const b = box ?? { minX: -1000, minY: -1000, maxX: 1000, maxY: 1000 };
  const { scale } = fitBox(b, paperMm[0], paperMm[1], margin);
  if (!Number.isFinite(scale) || scale <= 0) return 100;
  const need = 1 / scale;
  for (const n of STANDARD_SCALES) if (n >= need - 1e-9) return n;
  return STANDARD_SCALES[STANDARD_SCALES.length - 1];
}

/**
 * Viewport in Ở TỈ LỆ CỐ ĐỊNH 1:N ("plot to scale" thay vì "fit to paper"): scale = 1/N
 * (mm-giấy trên mỗi mm-world), bản vẽ căn GIỮA khổ giấy. Cùng hệ toạ độ worldToScreen như
 * fitBox nên pdf.ts dùng thẳng, dimension/text nhân v.scale tự đúng cỡ giấy.
 */
export function fixedScaleViewport(box: Box | null, paperMm: [number, number], scaleN: number): Viewport {
  const b = box ?? { minX: -1000, minY: -1000, maxX: 1000, maxY: 1000 };
  const scale = 1 / Math.max(1, scaleN);
  const cx = (b.minX + b.maxX) / 2;
  const cy = (b.minY + b.maxY) / 2;
  return { scale, panX: paperMm[0] / 2 - cx * scale, panY: paperMm[1] / 2 + cy * scale };
}

/** Bản vẽ có LỌT khổ giấy ở tỉ lệ 1:N không (trừ lề)? Dùng để pdf.ts fallback auto-fit an toàn. */
export function fitsAtScale(box: Box | null, paperMm: [number, number], margin: number, scaleN: number): boolean {
  const b = box ?? { minX: -1000, minY: -1000, maxX: 1000, maxY: 1000 };
  const bw = (b.maxX - b.minX) / Math.max(1, scaleN);
  const bh = (b.maxY - b.minY) / Math.max(1, scaleN);
  return bw <= paperMm[0] - margin * 2 && bh <= paperMm[1] - margin * 2;
}

/**
 * Nhãn tỉ lệ HIỆU DỤNG của 1 Doc: printScale đã chọn (và còn lọt giấy) → "1:N" chuẩn;
 * chưa chọn/không lọt → fitScaleLabel (auto-fit, hành vi cũ). UI khung tên + pdf.ts dùng CHUNG
 * hàm này nên 2 con số không bao giờ lệch nhau.
 */
export function docScaleLabel(doc: Doc, paperMm: [number, number], margin: number): string {
  const box = docBox(doc);
  if (doc.printScale && fitsAtScale(box, paperMm, margin, doc.printScale)) return `1:${doc.printScale}`;
  return fitScaleLabel(box, paperMm, margin);
}

/** Khổ giấy hiệu dụng của Doc (mm) — paperKey per-sheet, mặc định A3 (khớp hành vi cũ). */
export function docPaperMm(doc: Doc): [number, number] {
  return PAPER_SIZES_MM[doc.paperKey ?? 'A3'];
}

export const DEFAULT_LAYERS: Layer[] = [
  { id: 'l-wall', name: 'Tường', color: '#47423a', visible: true, locked: false, lineweight: 0.6, lineType: 'continuous' },
  { id: 'l-furniture', name: 'Nội thất', color: '#c08a5a', visible: true, locked: false, lineweight: 0.3, lineType: 'continuous' },
  { id: 'l-dim', name: 'Kích thước', color: '#7aa2c4', visible: true, locked: false, lineweight: 0.15, lineType: 'continuous' },
  { id: 'l-text', name: 'Ghi chú', color: '#9a9488', visible: true, locked: false, lineweight: 0.15, lineType: 'continuous' },
  { id: 'l-axis', name: 'Trục', color: '#8a7a9a', visible: true, locked: false, lineweight: 0.13, lineType: 'center' },
];

export function emptyDoc(): Doc {
  return { entities: [], layers: DEFAULT_LAYERS.map((l) => ({ ...l })), markups: [], photos: [] };
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
    case 'ellipse': {
      // bao hình chặt của ellipse xoay: nửa-rộng = √(rx²cos²θ + ry²sin²θ), nửa-cao tương tự.
      const rot = e.rot ?? 0;
      const cos = Math.cos(rot);
      const sin = Math.sin(rot);
      const hw = Math.hypot(e.rx * cos, e.ry * sin);
      const hh = Math.hypot(e.rx * sin, e.ry * cos);
      growBox(box, { x: e.c.x - hw, y: e.c.y - hh });
      growBox(box, { x: e.c.x + hw, y: e.c.y + hh });
      break;
    }
    case 'arrow':
      e.path.forEach((p) => growBox(box, p));
      break;
    case 'zone':
      zoneBoundaryPoints(e).forEach((p) => growBox(box, p));
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

/**
 * M0 fix (docs/RESEARCH-TECHNICAL-DRAWING-PIPELINE.md §1.6/§4) — tỉ lệ "1:N" THẬT suy ra từ
 * `fitBox()` cho 1 khổ giấy cụ thể, dùng để khoá lỗi khung tên ghi tỉ lệ gõ tay không khớp tỉ lệ
 * in thật. N làm tròn: nguyên nếu ≥10, 1 chữ số thập phân nếu <10 (bản vẽ rất nhỏ/khổ rất lớn).
 * KHÔNG phải `suggestScale()` kiến trúc chuẩn của M1 (chưa duyệt, xem §2.2) — đây chỉ là con số
 * auto-fit thật đúng với những gì `fitBox()` sẽ dùng khi xuất PDF, không neo vào tập 1:20/50/100/…
 */
export function fitScaleLabel(box: Box | null, paperMm: [number, number], margin: number): string {
  const b = box ?? { minX: -1000, minY: -1000, maxX: 1000, maxY: 1000 };
  const { scale } = fitBox(b, paperMm[0], paperMm[1], margin);
  if (!Number.isFinite(scale) || scale <= 0) return '1:100';
  const n = 1 / scale;
  const rounded = n >= 10 ? Math.round(n) : Math.round(n * 10) / 10;
  return `1:${rounded}`;
}
