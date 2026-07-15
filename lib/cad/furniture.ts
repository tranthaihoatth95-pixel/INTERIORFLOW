/**
 * lib/cad/furniture.ts — THƯ VIỆN BLOCK NỘI THẤT 2D (top-view chuẩn bản vẽ mặt bằng).
 *
 * Mỗi block là danh sách primitive vẽ tay trong hệ toạ độ LOCAL (mm), gốc ở TÂM block,
 * X phải / Y lên. Kích thước thật theo cataloge nội thất VN. Phần render (CadCanvas) sẽ
 * áp phép biến hình của BlockEntity (translate → rotate → scale) rồi vẽ từng primitive.
 * Thuần dữ liệu, không đụng DOM → test & SSR an toàn.
 */

import type { Pt } from './model';

export type Prim =
  | { k: 'line'; a: Pt; b: Pt }
  | { k: 'poly'; pts: Pt[]; closed?: boolean }
  | { k: 'circle'; c: Pt; r: number }
  | { k: 'arc'; c: Pt; r: number; a1: number; a2: number };

/**
 * Nhóm palette — 7 nhóm cũ + 2 nhóm mới (Sprint 3, để sẵn cho Agent B — B1.9 Cầu thang,
 * B1.10 Thiết bị). Xem SHAPE-SCHEMA.md mục 1.
 */
export type BlockGroup =
  | 'Phòng khách' | 'Phòng ăn' | 'Phòng ngủ' | 'Bếp' | 'Vệ sinh'
  | 'Làm việc' | 'Kiến trúc'
  | 'Cầu thang' | 'Thiết bị';

/** Dạng thay thế của 1 BlockDef (vd size/hình khác) — B2.5 UI switch trong palette. */
export interface ShapeVariant {
  /** duy nhất trong 1 BlockDef, vd 'single' | 'double' | 'corner-left' */
  id: string;
  /** tên hiển thị, vd "Giường đơn" / "Giường đôi" */
  name: string;
  w: number;
  h: number;
  prims: Prim[];
}

/**
 * Điểm neo dùng cho auto-snap-to-wall (B2.2). Toạ độ LOCAL mm, gốc TÂM block — giống hệ prims.
 * `normal` là hướng "áp vào tường" (vector đơn vị) tính từ tâm ra mép sát tường.
 */
export interface SnapAnchor {
  kind: 'wall-back' | 'wall-side' | 'floor';
  pt: Pt;
  normal: { x: number; y: number };
}

/**
 * Vùng chờ bắt buộc quanh shape (B2.7) — hcn LOCAL mm, gốc TÂM block, KHÔNG tự xoay riêng
 * (xoay theo block khi block xoay).
 */
export interface ClearanceZone {
  x: number;
  y: number;
  w: number;
  h: number;
  /** vd "Bán kính mở cửa tủ 700mm", "Lối đi tối thiểu 700mm" */
  reason: string;
}

/** Info panel (B2.4) — giá/mã/nhà cung cấp. Chưa có dữ liệu giá thật → để trống. */
export interface ShapeMeta {
  price?: number;
  vendor?: string;
  sku?: string;
}

export interface BlockDef {
  id: string;
  name: string;
  /** nhóm để gom trong panel */
  group: BlockGroup;
  /** kích thước danh nghĩa (mm) — dùng cho preview & tỉ lệ (variant mặc định) */
  w: number;
  h: number;
  prims: Prim[];

  // ---- MỚI (Sprint 3, xem SHAPE-SCHEMA.md) ----
  /** B2.5 — nếu không có, shape chỉ có 1 dạng (dùng w/h/prims gốc) */
  variants?: ShapeVariant[];
  /** B2.2 — điểm neo để auto-snap vào tường */
  anchors?: SnapAnchor[];
  /** B2.7 — vùng trống bắt buộc quanh shape */
  clearance?: ClearanceZone[];
  /** B2.4 — info panel: giá, mã, nhà cung cấp */
  meta?: ShapeMeta;
}

/* helper dựng hình trong local mm, gốc tâm */
function rect(x: number, y: number, w: number, h: number, closed = true): Prim {
  return { k: 'poly', closed, pts: [
    { x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h },
  ] };
}
/** rect canh giữa gốc */
function box(w: number, h: number): Prim {
  return rect(-w / 2, -h / 2, w, h);
}

// Sofa: khung + tựa lưng + 2 tay + đệm ngồi
function sofa(w: number, d: number, seats: number): Prim[] {
  const arm = 120;
  const backY = d / 2 - 140;
  const prims: Prim[] = [
    box(w, d),
    { k: 'line', a: { x: -w / 2, y: backY }, b: { x: w / 2, y: backY } },
    { k: 'line', a: { x: -w / 2 + arm, y: -d / 2 }, b: { x: -w / 2 + arm, y: backY } },
    { k: 'line', a: { x: w / 2 - arm, y: -d / 2 }, b: { x: w / 2 - arm, y: backY } },
  ];
  const inner = w - arm * 2;
  const seatW = inner / seats;
  for (let i = 0; i < seats; i++) {
    const sx = -inner / 2 + i * seatW;
    prims.push(rect(sx + 30, -d / 2 + 60, seatW - 60, backY - (-d / 2) - 100));
  }
  return prims;
}

function armchair(): Prim[] {
  return sofa(760, 780, 1);
}

// Bàn ăn chữ nhật + ghế quanh
function diningTable(seats: 4 | 6 | 8): Prim[] {
  const w = seats === 4 ? 1200 : seats === 6 ? 1600 : 2200;
  const d = 800;
  const prims: Prim[] = [box(w, d)];
  const chair = (cx: number, cy: number, up: boolean): Prim[] => {
    const cw = 420, cd = 420;
    const y0 = up ? cy : cy - cd;
    return [rect(cx - cw / 2, y0, cw, cd)];
  };
  const perSide = seats / 2;
  const gap = w / perSide;
  for (let i = 0; i < perSide; i++) {
    const cx = -w / 2 + gap / 2 + i * gap;
    prims.push(...chair(cx, d / 2 + 80, true));
    prims.push(...chair(cx, -d / 2 - 80, false));
  }
  return prims;
}

// Giường: khung + 2 gối + đường mép chăn
function bed(w: number, l: number, pillows: number): Prim[] {
  const prims: Prim[] = [box(w, l)];
  const blanketY = -l / 2 + l * 0.62;
  prims.push({ k: 'line', a: { x: -w / 2, y: blanketY }, b: { x: w / 2, y: blanketY } });
  const pw = (w - 120) / pillows;
  for (let i = 0; i < pillows; i++) {
    const px = -w / 2 + 60 + i * pw;
    prims.push(rect(px + 30, l / 2 - 380, pw - 60, 300));
  }
  return prims;
}

// Tủ áo: hộp + đường ray + nét chéo cửa mở
function wardrobe(w: number): Prim[] {
  const d = 600;
  return [
    box(w, d),
    { k: 'line', a: { x: -w / 2, y: d / 2 - 40 }, b: { x: w / 2, y: d / 2 - 40 } },
    { k: 'line', a: { x: -w / 2, y: -d / 2 }, b: { x: 0, y: d / 2 - 40 } },
    { k: 'line', a: { x: w / 2, y: -d / 2 }, b: { x: 0, y: d / 2 - 40 } },
  ];
}

// Tủ đầu giường (bedside table/nightstand): hộp + đường ngăn kéo + núm
function nightstand(w: number, d: number): Prim[] {
  return [
    box(w, d),
    { k: 'line', a: { x: -w / 2 + 40, y: 0 }, b: { x: w / 2 - 40, y: 0 } },
    { k: 'circle', c: { x: 0, y: d / 2 - 60 }, r: 12 },
  ];
}

// Bàn trang điểm: mặt bàn + gương (nét cong sát tường) + ghế đôn phía trước
function dressingTable(w: number, d: number): Prim[] {
  const stoolR = 180;
  return [
    box(w, d),
    // gương — cạnh sát tường (+y)
    { k: 'arc', c: { x: 0, y: d / 2 }, r: w / 2 - 60, a1: Math.PI * 0.15, a2: Math.PI * 0.85 },
    // đôn ngồi phía trước (-y)
    { k: 'circle', c: { x: 0, y: -d / 2 - stoolR - 80 }, r: stoolR },
  ];
}

// Sofa góc (L-shape): 2 nhánh vuông góc — mirror=false: nhánh phụ bên TRÁI, mirror=true: bên PHẢI.
// Bounding box vuông cạnh `size`, gốc tâm bounding box.
function cornerSofa(size: number, mirror: boolean): Prim[] {
  const legD = 950; // độ sâu ghế mỗi nhánh
  const half = size / 2;
  // Đa giác L: chạy dọc theo nhánh ngang (đáy, đầy chiều rộng) rồi nhánh dọc (1 bên, phần còn lại)
  const outline: Pt[] = mirror
    ? [
        { x: -half, y: -half }, { x: half, y: -half }, { x: half, y: -half + legD },
        { x: -half + legD, y: -half + legD }, { x: -half + legD, y: half }, { x: -half, y: half },
      ]
    : [
        { x: -half, y: -half }, { x: half, y: -half }, { x: half, y: half },
        { x: half - legD, y: half }, { x: half - legD, y: -half + legD }, { x: -half, y: -half + legD },
      ];
  const prims: Prim[] = [{ k: 'poly', closed: true, pts: outline }];
  // tựa lưng dọc theo 2 cạnh ngoài áp tường (đáy + 1 bên)
  const backInset = 140;
  prims.push({ k: 'line', a: { x: -half, y: -half + backInset }, b: { x: half, y: -half + backInset } });
  if (mirror) {
    prims.push({ k: 'line', a: { x: -half + legD - backInset, y: -half + legD }, b: { x: -half + legD - backInset, y: half } });
  } else {
    prims.push({ k: 'line', a: { x: half - legD + backInset, y: -half + legD }, b: { x: half - legD + backInset, y: half } });
  }
  return prims;
}

// Bàn trà: mặt bàn hcn + gờ mép
function coffeeTable(w: number, d: number): Prim[] {
  return [box(w, d), rect(-w / 2 + 40, -d / 2 + 40, w - 80, d - 80, true)];
}

// Kệ TV: hộp thấp áp tường + màn hình (nét mỏng phía sau, sát tường)
function tvConsole(w: number, d: number): Prim[] {
  return [
    box(w, d),
    { k: 'line', a: { x: -w / 2 + 200, y: d / 2 + 30 }, b: { x: w / 2 - 200, y: d / 2 + 30 } },
  ];
}

// Bàn làm việc + ghế
function desk(): Prim[] {
  const w = 1400, d = 700;
  return [
    box(w, d),
    { k: 'circle', c: { x: 0, y: -d / 2 - 300 }, r: 220 },
    { k: 'arc', c: { x: 0, y: -d / 2 - 300 }, r: 300, a1: Math.PI * 0.1, a2: Math.PI * 0.9 },
  ];
}

// Bồn cầu (toilet) top-view
function toilet(): Prim[] {
  return [
    rect(-190, 180, 380, 220),
    { k: 'poly', closed: true, pts: [
      { x: -170, y: 180 }, { x: 170, y: 180 }, { x: 200, y: -40 },
      { x: 120, y: -220 }, { x: -120, y: -220 }, { x: -200, y: -40 },
    ] },
    { k: 'circle', c: { x: 0, y: -30 }, r: 130 },
  ];
}

// Lavabo (chậu rửa)
function lavabo(): Prim[] {
  return [
    box(600, 460),
    { k: 'circle', c: { x: 0, y: -20 }, r: 170 },
    { k: 'circle', c: { x: 0, y: 190 }, r: 22 },
  ];
}

// Bồn tắm
function bathtub(): Prim[] {
  const w = 1700, d = 750;
  return [box(w, d), rect(-w / 2 + 90, -d / 2 + 90, w - 180, d - 180)];
}

// Bếp chữ I: dãy tủ + bồn rửa + 2 vòng bếp
function kitchenI(): Prim[] {
  const w = 3000, d = 600;
  return [
    box(w, d),
    rect(-w / 2 + 300, -d / 2 + 90, 700, d - 180),
    { k: 'circle', c: { x: -w / 2 + 650, y: 0 }, r: 30 },
    { k: 'circle', c: { x: w / 2 - 800, y: 0 }, r: 160 },
    { k: 'circle', c: { x: w / 2 - 400, y: 0 }, r: 120 },
  ];
}

// Cửa đi (swing) — khung + cánh + cung quét
function door(w = 900): Prim[] {
  return [
    { k: 'line', a: { x: -w / 2, y: 0 }, b: { x: -w / 2, y: w } },
    { k: 'arc', c: { x: -w / 2, y: 0 }, r: w, a1: 0, a2: Math.PI / 2 },
    { k: 'line', a: { x: -w / 2, y: 0 }, b: { x: w / 2, y: 0 } },
  ];
}

// Cửa sổ — 2 nét tường + 2 nét kính
function window2(w = 1200): Prim[] {
  const t = 100;
  return [
    { k: 'line', a: { x: -w / 2, y: t / 2 }, b: { x: w / 2, y: t / 2 } },
    { k: 'line', a: { x: -w / 2, y: -t / 2 }, b: { x: w / 2, y: -t / 2 } },
    { k: 'line', a: { x: -w / 2, y: 0 }, b: { x: w / 2, y: 0 } },
    { k: 'line', a: { x: -w / 2, y: t / 2 }, b: { x: -w / 2, y: -t / 2 } },
    { k: 'line', a: { x: w / 2, y: t / 2 }, b: { x: w / 2, y: -t / 2 } },
  ];
}

export const BLOCKS: BlockDef[] = [
  {
    id: 'sofa2', name: 'Sofa 2 chỗ', group: 'Phòng khách', w: 1600, h: 900, prims: sofa(1600, 900, 2),
    // sofa áp tường: tựa lưng nằm về phía +y (xem sofa() — backY gần +d/2)
    anchors: [{ kind: 'wall-back', pt: { x: 0, y: 450 }, normal: { x: 0, y: 1 } }],
  },
  {
    id: 'sofa3', name: 'Sofa 3 chỗ', group: 'Phòng khách', w: 2100, h: 900, prims: sofa(2100, 900, 3),
    anchors: [{ kind: 'wall-back', pt: { x: 0, y: 450 }, normal: { x: 0, y: 1 } }],
  },
  { id: 'armchair', name: 'Ghế bành', group: 'Phòng khách', w: 760, h: 780, prims: armchair() },
  {
    id: 'sofaCorner', name: 'Sofa góc', group: 'Phòng khách', w: 2600, h: 2600, prims: cornerSofa(2600, false),
    // 2 cạnh ngoài áp 2 tường vuông góc (đáy + bên phải) — xem cornerSofa() mirror=false
    anchors: [
      { kind: 'wall-back', pt: { x: 0, y: -1300 }, normal: { x: 0, y: -1 } },
      { kind: 'wall-side', pt: { x: 1300, y: 0 }, normal: { x: 1, y: 0 } },
    ],
    variants: [
      {
        id: 'corner-left', name: 'Sofa góc (nhánh trái)', w: 2600, h: 2600, prims: cornerSofa(2600, false),
      },
      {
        id: 'corner-right', name: 'Sofa góc (nhánh phải)', w: 2600, h: 2600, prims: cornerSofa(2600, true),
      },
    ],
  },
  { id: 'coffeeTable', name: 'Bàn trà', group: 'Phòng khách', w: 1200, h: 600, prims: coffeeTable(1200, 600) },
  {
    id: 'tvConsole', name: 'Kệ TV', group: 'Phòng khách', w: 1800, h: 450, prims: tvConsole(1800, 450),
    anchors: [{ kind: 'wall-back', pt: { x: 0, y: 225 }, normal: { x: 0, y: 1 } }],
  },
  { id: 'dining4', name: 'Bàn ăn 4', group: 'Phòng ăn', w: 1200, h: 1760, prims: diningTable(4) },
  { id: 'dining6', name: 'Bàn ăn 6', group: 'Phòng ăn', w: 1600, h: 1760, prims: diningTable(6) },
  { id: 'dining8', name: 'Bàn ăn 8', group: 'Phòng ăn', w: 2200, h: 1760, prims: diningTable(8) },
  {
    id: 'bedS', name: 'Giường đơn', group: 'Phòng ngủ', w: 1000, h: 2000, prims: bed(1000, 2000, 1),
    // đầu giường (gối) nằm về phía +y — xem bed(): pillows gần +l/2
    anchors: [{ kind: 'wall-back', pt: { x: 0, y: 1000 }, normal: { x: 0, y: 1 } }],
    clearance: [
      { x: -500 - 700, y: -1000, w: 700, h: 2000, reason: 'Lối đi bên trái giường tối thiểu 700mm' },
      { x: 500, y: -1000, w: 700, h: 2000, reason: 'Lối đi bên phải giường tối thiểu 700mm' },
    ],
    variants: [
      { id: 'single-1000', name: 'Giường đơn 1m', w: 1000, h: 2000, prims: bed(1000, 2000, 1) },
      { id: 'single-1200', name: 'Giường đơn rộng 1.2m', w: 1200, h: 2000, prims: bed(1200, 2000, 1) },
    ],
  },
  {
    id: 'bedD', name: 'Giường đôi', group: 'Phòng ngủ', w: 1600, h: 2000, prims: bed(1600, 2000, 2),
    anchors: [{ kind: 'wall-back', pt: { x: 0, y: 1000 }, normal: { x: 0, y: 1 } }],
    clearance: [
      { x: -800 - 700, y: -1000, w: 700, h: 2000, reason: 'Lối đi bên trái giường tối thiểu 700mm' },
      { x: 800, y: -1000, w: 700, h: 2000, reason: 'Lối đi bên phải giường tối thiểu 700mm' },
    ],
    variants: [
      { id: 'queen-1500', name: 'Giường đôi Queen 1.5m', w: 1500, h: 2000, prims: bed(1500, 2000, 2) },
      { id: 'king-1800', name: 'Giường đôi King 1.8m', w: 1800, h: 2000, prims: bed(1800, 2000, 2) },
    ],
  },
  {
    id: 'wardrobe', name: 'Tủ áo', group: 'Phòng ngủ', w: 1800, h: 600, prims: wardrobe(1800),
    // mặt sau (không bản lề) ở +y — xem wardrobe(): bản lề mở tại y=-d/2, gặp nhau ở y=d/2-40
    anchors: [{ kind: 'wall-back', pt: { x: 0, y: 300 }, normal: { x: 0, y: 1 } }],
    clearance: [
      { x: -900, y: -300 - 700, w: 1800, h: 700, reason: 'Bán kính mở cửa tủ tối thiểu 700mm' },
    ],
  },
  {
    id: 'nightstand', name: 'Tủ đầu giường', group: 'Phòng ngủ', w: 450, h: 400, prims: nightstand(450, 400),
    anchors: [{ kind: 'wall-back', pt: { x: 0, y: 200 }, normal: { x: 0, y: 1 } }],
  },
  {
    id: 'dressingTable', name: 'Bàn trang điểm', group: 'Phòng ngủ', w: 1000, h: 450, prims: dressingTable(1000, 450),
    anchors: [{ kind: 'wall-back', pt: { x: 0, y: 225 }, normal: { x: 0, y: 1 } }],
  },
  { id: 'desk', name: 'Bàn làm việc + ghế', group: 'Làm việc', w: 1400, h: 1300, prims: desk() },
  { id: 'toilet', name: 'Bồn cầu', group: 'Vệ sinh', w: 400, h: 620, prims: toilet() },
  { id: 'lavabo', name: 'Lavabo', group: 'Vệ sinh', w: 600, h: 460, prims: lavabo() },
  { id: 'bathtub', name: 'Bồn tắm', group: 'Vệ sinh', w: 1700, h: 750, prims: bathtub() },
  { id: 'kitchenI', name: 'Bếp chữ I', group: 'Bếp', w: 3000, h: 600, prims: kitchenI() },
  { id: 'door', name: 'Cửa mở 900 (cửa chính)', group: 'Kiến trúc', w: 900, h: 900, prims: door(900) },
  { id: 'doorRoom', name: 'Cửa mở 800 (cửa phòng)', group: 'Kiến trúc', w: 800, h: 800, prims: door(800) },
  { id: 'doorWC', name: 'Cửa mở 700 (cửa WC)', group: 'Kiến trúc', w: 700, h: 700, prims: door(700) },
  { id: 'window', name: 'Cửa sổ', group: 'Kiến trúc', w: 1200, h: 100, prims: window2(1200) },
];

export const BLOCK_MAP: Record<string, BlockDef> = Object.fromEntries(BLOCKS.map((b) => [b.id, b]));
