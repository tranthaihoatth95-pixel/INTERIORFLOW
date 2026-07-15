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

// ===== B1.3 — Bếp: tách thêm tủ lạnh / đảo bếp / hút mùi / lò vi sóng =====

// Tủ lạnh — hộp + đường phân 2 cánh + tay nắm
function refrigerator(): Prim[] {
  const w = 700, d = 700;
  return [
    box(w, d),
    { k: 'line', a: { x: -w / 2, y: 0 }, b: { x: w / 2, y: 0 } },
    { k: 'line', a: { x: -60, y: -d / 2 + 60 }, b: { x: -60, y: -60 } },
    { k: 'line', a: { x: 60, y: 60 }, b: { x: 60, y: d / 2 - 60 } },
  ];
}

// Đảo bếp — mặt bàn + bồn rửa nhỏ + bếp đôi
function kitchenIsland(): Prim[] {
  const w = 1800, d = 900;
  return [
    box(w, d),
    rect(-w / 2 + 150, -100, 500, 200),
    { k: 'circle', c: { x: w / 2 - 500, y: 0 }, r: 130 },
    { k: 'circle', c: { x: w / 2 - 220, y: 0 }, r: 130 },
  ];
}

// Máy hút mùi — hình chữ nhật nhỏ áp tường trên bếp + nét chỉ hướng hút
function rangeHood(): Prim[] {
  const w = 800, d = 500;
  return [
    box(w, d),
    rect(-w / 2 + 60, -d / 2 + 60, w - 120, d - 120),
    { k: 'line', a: { x: -100, y: 0 }, b: { x: 100, y: 0 } },
  ];
}

// Lò vi sóng — hộp nhỏ đặt trên mặt bếp/kệ
function microwave(): Prim[] {
  const w = 500, d = 400;
  return [box(w, d), rect(-w / 2 + 40, -d / 2 + 40, w - 160, d - 80)];
}

// ===== B1.4 — Phòng tắm: vòi sen đứng + gương =====

// Vòi sen đứng (shower stall) — khay vuông + thoát sàn tròn + ký hiệu vòi
function showerStall(): Prim[] {
  const w = 900, d = 900;
  return [
    box(w, d),
    rect(-w / 2 + 40, -d / 2 + 40, w - 80, d - 80),
    { k: 'circle', c: { x: 0, y: 0 }, r: 60 },
    { k: 'circle', c: { x: -w / 2 + 100, y: d / 2 - 100 }, r: 30 },
  ];
}

// Gương — 1 line đơn giản áp tường (theo gợi ý spec)
function mirror(w = 700): Prim[] {
  return [{ k: 'line', a: { x: -w / 2, y: 0 }, b: { x: w / 2, y: 0 } }];
}

// ===== B1.6 — Văn phòng: ghế văn phòng riêng + tủ hồ sơ + kệ sách =====

// Ghế văn phòng (tách khỏi desk) — vòng tròn lưng + đế xoay
function officeChair(): Prim[] {
  const r = 220;
  return [
    { k: 'circle', c: { x: 0, y: 0 }, r },
    { k: 'circle', c: { x: 0, y: 0 }, r: 40 },
    { k: 'arc', c: { x: 0, y: 0 }, r: r - 30, a1: Math.PI * 0.15, a2: Math.PI * 0.85 },
  ];
}

// Tủ hồ sơ — hộp + 2-3 ngăn kéo
function filingCabinet(): Prim[] {
  const w = 450, d = 600;
  const prims: Prim[] = [box(w, d)];
  for (let i = 1; i < 3; i++) {
    const y = -d / 2 + (d / 3) * i;
    prims.push({ k: 'line', a: { x: -w / 2 + 30, y }, b: { x: w / 2 - 30, y } });
  }
  return prims;
}

// Kệ sách — hộp áp tường + các ngăn ngang
function bookshelf(): Prim[] {
  const w = 900, d = 300;
  const prims: Prim[] = [box(w, d)];
  for (let i = 1; i < 4; i++) {
    const x = -w / 2 + (w / 4) * i;
    prims.push({ k: 'line', a: { x, y: -d / 2 }, b: { x, y: d / 2 } });
  }
  return prims;
}

// ===== B1.7 — Cửa: 2 cánh / trượt / kính =====

// Cửa 2 cánh — 2 cánh swing đối xứng, mỗi cánh quét w/2
function doubleDoor(w = 1600): Prim[] {
  const hw = w / 2;
  return [
    { k: 'line', a: { x: -hw, y: 0 }, b: { x: 0, y: 0 } },
    { k: 'line', a: { x: 0, y: 0 }, b: { x: hw, y: 0 } },
    { k: 'line', a: { x: -hw, y: 0 }, b: { x: -hw, y: hw } },
    { k: 'arc', c: { x: -hw, y: 0 }, r: hw, a1: 0, a2: Math.PI / 2 },
    { k: 'line', a: { x: hw, y: 0 }, b: { x: hw, y: hw } },
    { k: 'arc', c: { x: hw, y: 0 }, r: hw, a1: Math.PI / 2, a2: Math.PI },
  ];
}

// Cửa trượt — khung + 2 tấm lùa chồng nhau, không có cung quét
function slidingDoor(w = 1800): Prim[] {
  const t = 80;
  const half = w / 2;
  return [
    { k: 'line', a: { x: -half, y: 0 }, b: { x: half, y: 0 } },
    rect(-half, -t / 2, half + half * 0.55, t),
    rect(-half * 0.55, -t / 2 - t, half + half * 0.55, t),
  ];
}

// Cửa kính — giống door 1 cánh nhưng nét đôi song song (ký hiệu kính) thay vì nét đơn
function glassDoor(w = 900): Prim[] {
  return [
    { k: 'line', a: { x: -w / 2, y: 0 }, b: { x: -w / 2, y: w } },
    { k: 'arc', c: { x: -w / 2, y: 0 }, r: w, a1: 0, a2: Math.PI / 2 },
    { k: 'line', a: { x: -w / 2, y: 0 }, b: { x: w / 2, y: 0 } },
    { k: 'line', a: { x: -w / 2, y: 40 }, b: { x: w / 2, y: 40 } },
  ];
}

// ===== B1.8 — Cửa sổ: trượt / cố định =====

// Cửa sổ trượt — 2 nét tường + 2 tấm kính lùa chồng mép (khác cửa sổ mở ở giữa)
function slidingWindow(w = 1200): Prim[] {
  const t = 100;
  return [
    { k: 'line', a: { x: -w / 2, y: t / 2 }, b: { x: w / 2, y: t / 2 } },
    { k: 'line', a: { x: -w / 2, y: -t / 2 }, b: { x: w / 2, y: -t / 2 } },
    { k: 'line', a: { x: -w / 2, y: t / 2 }, b: { x: -w / 2, y: -t / 2 } },
    { k: 'line', a: { x: w / 2, y: t / 2 }, b: { x: w / 2, y: -t / 2 } },
    { k: 'line', a: { x: -w * 0.05, y: t / 2 }, b: { x: -w * 0.05, y: -t / 2 } },
  ];
}

// Cửa sổ cố định — không ký hiệu mở, chỉ khung + 1 nét kính giữa
function fixedWindow(w = 1200): Prim[] {
  const t = 100;
  return [
    { k: 'line', a: { x: -w / 2, y: t / 2 }, b: { x: w / 2, y: t / 2 } },
    { k: 'line', a: { x: -w / 2, y: -t / 2 }, b: { x: w / 2, y: -t / 2 } },
    { k: 'line', a: { x: -w / 2, y: t / 2 }, b: { x: -w / 2, y: -t / 2 } },
    { k: 'line', a: { x: w / 2, y: t / 2 }, b: { x: w / 2, y: -t / 2 } },
  ];
}

// ===== B1.9 — Cầu thang (nhóm mới 'Cầu thang') =====
// Ghi chú: thang XOẮN bỏ qua theo gợi ý spec — hình xoắn ốc top-view cần
// nhiều prim cung lồng nhau + số liệu bước chân phức tạp hơn `Prim` hiện có
// hỗ trợ tốt (chỉ có line/poly/circle/arc, không có path xoắn ốc thật);
// làm ẩu sẽ ra hình sai lệch tỉ lệ. Thẳng + chữ L đã đủ dùng cho sơ phác DD.

// Thang thẳng — dãy bậc thang song song + mũi tên hướng lên
function straightStairs(): Prim[] {
  const w = 1000, d = 3000;
  const steps = 12;
  const prims: Prim[] = [box(w, d)];
  const stepH = d / steps;
  for (let i = 1; i < steps; i++) {
    const y = -d / 2 + i * stepH;
    prims.push({ k: 'line', a: { x: -w / 2, y }, b: { x: w / 2, y } });
  }
  // mũi tên hướng đi lên (từ chân → đỉnh)
  prims.push({ k: 'line', a: { x: 0, y: -d / 2 + 200 }, b: { x: 0, y: d / 2 - 200 } });
  prims.push({ k: 'line', a: { x: -80, y: d / 2 - 350 }, b: { x: 0, y: d / 2 - 200 } });
  prims.push({ k: 'line', a: { x: 80, y: d / 2 - 350 }, b: { x: 0, y: d / 2 - 200 } });
  return prims;
}

// Thang chữ L — 2 vế vuông góc quanh chiếu nghỉ (landing)
function lStairs(): Prim[] {
  const w = 1000;
  const run1 = 2200, run2 = 1800;
  const landing = 1000;
  const prims: Prim[] = [];
  // vế 1: chạy dọc trục Y (đi lên)
  prims.push(rect(-w / 2, -run1 / 2 - landing / 2, w, run1));
  const steps1 = 8;
  for (let i = 1; i < steps1; i++) {
    const y = -run1 / 2 - landing / 2 + (run1 / steps1) * i;
    prims.push({ k: 'line', a: { x: -w / 2, y }, b: { x: w / 2, y } });
  }
  // chiếu nghỉ vuông
  prims.push(rect(-w / 2, run1 / 2 - landing / 2, w, landing));
  // vế 2: chạy ngang trục X (rẽ 90°) từ mép chiếu nghỉ
  const landingTop = run1 / 2 + landing / 2;
  prims.push(rect(w / 2, landingTop - w, run2, w));
  const steps2 = 7;
  for (let i = 1; i < steps2; i++) {
    const x = w / 2 + (run2 / steps2) * i;
    prims.push({ k: 'line', a: { x, y: landingTop - w }, b: { x, y: landingTop } });
  }
  return prims;
}

// ===== B1.10 — Thiết bị (nhóm mới 'Thiết bị') — đèn thuộc nhóm E, bỏ qua =====

// Máy lạnh treo tường — hcn dẹt + vài đường chỉ cánh gió
function acUnit(): Prim[] {
  const w = 800, d = 200;
  return [
    box(w, d),
    { k: 'line', a: { x: -w / 2 + 60, y: -d / 2 + 60 }, b: { x: w / 2 - 60, y: -d / 2 + 60 } },
    { k: 'line', a: { x: -w / 2 + 60, y: 0 }, b: { x: w / 2 - 60, y: 0 } },
  ];
}

// Quạt trần — vòng tròn thân + 4 cánh quạt đơn giản
function ceilingFan(): Prim[] {
  const r = 600;
  const prims: Prim[] = [{ k: 'circle', c: { x: 0, y: 0 }, r: 80 }];
  for (let i = 0; i < 4; i++) {
    const ang = (Math.PI / 2) * i;
    const x = Math.cos(ang) * r;
    const y = Math.sin(ang) * r;
    prims.push({ k: 'line', a: { x: 0, y: 0 }, b: { x, y } });
  }
  prims.push({ k: 'circle', c: { x: 0, y: 0 }, r });
  return prims;
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
  {
    id: 'refrigerator', name: 'Tủ lạnh', group: 'Bếp', w: 700, h: 700, prims: refrigerator(),
    anchors: [{ kind: 'wall-back', pt: { x: 0, y: -350 }, normal: { x: 0, y: -1 } }],
  },
  {
    id: 'kitchenIsland', name: 'Đảo bếp', group: 'Bếp', w: 1800, h: 900, prims: kitchenIsland(),
    clearance: [{ x: 0, y: 700, w: 1800, h: 900, reason: 'Lối đi thao tác quanh đảo bếp ≥900mm' }],
  },
  {
    id: 'rangeHood', name: 'Máy hút mùi', group: 'Bếp', w: 800, h: 500, prims: rangeHood(),
    anchors: [{ kind: 'wall-back', pt: { x: 0, y: -250 }, normal: { x: 0, y: -1 } }],
  },
  { id: 'microwave', name: 'Lò vi sóng', group: 'Bếp', w: 500, h: 400, prims: microwave() },
  {
    id: 'showerStall', name: 'Vòi sen đứng', group: 'Vệ sinh', w: 900, h: 900, prims: showerStall(),
    anchors: [
      { kind: 'wall-back', pt: { x: 0, y: -450 }, normal: { x: 0, y: -1 } },
      { kind: 'wall-side', pt: { x: -450, y: 0 }, normal: { x: -1, y: 0 } },
    ],
    clearance: [{ x: 0, y: 500, w: 900, h: 700, reason: 'Vùng đứng ra vào vòi sen' }],
  },
  {
    id: 'mirror', name: 'Gương', group: 'Vệ sinh', w: 700, h: 20, prims: mirror(700),
    anchors: [{ kind: 'wall-back', pt: { x: 0, y: 0 }, normal: { x: 0, y: -1 } }],
  },
  { id: 'officeChair', name: 'Ghế văn phòng', group: 'Làm việc', w: 440, h: 440, prims: officeChair() },
  {
    id: 'filingCabinet', name: 'Tủ hồ sơ', group: 'Làm việc', w: 450, h: 600, prims: filingCabinet(),
    anchors: [{ kind: 'wall-back', pt: { x: 0, y: -300 }, normal: { x: 0, y: -1 } }],
    clearance: [{ x: 0, y: 400, w: 450, h: 400, reason: 'Bán kính mở ngăn kéo' }],
  },
  {
    id: 'bookshelf', name: 'Kệ sách', group: 'Làm việc', w: 900, h: 300, prims: bookshelf(),
    anchors: [{ kind: 'wall-back', pt: { x: 0, y: -150 }, normal: { x: 0, y: -1 } }],
  },
  {
    id: 'door', name: 'Cửa mở 900 (cửa chính)', group: 'Kiến trúc', w: 900, h: 900, prims: door(900),
    clearance: [{ x: 0, y: 450, w: 900, h: 900, reason: 'Vùng quét cánh cửa' }],
  },
  {
    id: 'doorRoom', name: 'Cửa mở 800 (cửa phòng)', group: 'Kiến trúc', w: 800, h: 800, prims: door(800),
    clearance: [{ x: 0, y: 400, w: 800, h: 800, reason: 'Vùng quét cánh cửa' }],
  },
  {
    id: 'doorWC', name: 'Cửa mở 700 (cửa WC)', group: 'Kiến trúc', w: 700, h: 700, prims: door(700),
    clearance: [{ x: 0, y: 350, w: 700, h: 700, reason: 'Vùng quét cánh cửa' }],
  },
  {
    id: 'doubleDoor', name: 'Cửa 2 cánh', group: 'Kiến trúc', w: 1600, h: 800, prims: doubleDoor(1600),
    clearance: [{ x: 0, y: 400, w: 1600, h: 800, reason: 'Vùng quét 2 cánh cửa' }],
  },
  { id: 'slidingDoor', name: 'Cửa trượt', group: 'Kiến trúc', w: 1800, h: 160, prims: slidingDoor(1800) },
  {
    id: 'glassDoor', name: 'Cửa kính', group: 'Kiến trúc', w: 900, h: 900, prims: glassDoor(900),
    clearance: [{ x: 0, y: 450, w: 900, h: 900, reason: 'Vùng quét cánh cửa' }],
  },
  { id: 'window', name: 'Cửa sổ', group: 'Kiến trúc', w: 1200, h: 100, prims: window2(1200) },
  { id: 'slidingWindow', name: 'Cửa sổ trượt', group: 'Kiến trúc', w: 1200, h: 100, prims: slidingWindow(1200) },
  { id: 'fixedWindow', name: 'Cửa sổ cố định', group: 'Kiến trúc', w: 1200, h: 100, prims: fixedWindow(1200) },
  {
    id: 'straightStairs', name: 'Thang thẳng', group: 'Cầu thang', w: 1000, h: 3000, prims: straightStairs(),
    clearance: [{ x: 0, y: 1700, w: 1000, h: 400, reason: 'Chiều cao đầu (headroom) tối thiểu ở chiếu tới' }],
  },
  {
    id: 'lStairs', name: 'Thang chữ L', group: 'Cầu thang', w: 3000, h: 3000, prims: lStairs(),
    clearance: [{ x: 0, y: 0, w: 1000, h: 1000, reason: 'Chiếu nghỉ — chiều cao đầu tối thiểu' }],
  },
  {
    id: 'acUnit', name: 'Máy lạnh treo tường', group: 'Thiết bị', w: 800, h: 200, prims: acUnit(),
    anchors: [{ kind: 'wall-back', pt: { x: 0, y: -100 }, normal: { x: 0, y: -1 } }],
  },
  { id: 'ceilingFan', name: 'Quạt trần', group: 'Thiết bị', w: 1200, h: 1200, prims: ceilingFan() },
];

export const BLOCK_MAP: Record<string, BlockDef> = Object.fromEntries(BLOCKS.map((b) => [b.id, b]));
