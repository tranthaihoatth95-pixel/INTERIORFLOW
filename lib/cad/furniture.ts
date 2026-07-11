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

export interface BlockDef {
  id: string;
  name: string;
  /** nhóm để gom trong panel */
  group: 'Phòng khách' | 'Phòng ăn' | 'Phòng ngủ' | 'Bếp' | 'Vệ sinh' | 'Làm việc' | 'Kiến trúc';
  /** kích thước danh nghĩa (mm) — dùng cho preview & tỉ lệ */
  w: number;
  h: number;
  prims: Prim[];
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
  { id: 'sofa2', name: 'Sofa 2 chỗ', group: 'Phòng khách', w: 1600, h: 900, prims: sofa(1600, 900, 2) },
  { id: 'sofa3', name: 'Sofa 3 chỗ', group: 'Phòng khách', w: 2100, h: 900, prims: sofa(2100, 900, 3) },
  { id: 'armchair', name: 'Ghế bành', group: 'Phòng khách', w: 760, h: 780, prims: armchair() },
  { id: 'dining4', name: 'Bàn ăn 4', group: 'Phòng ăn', w: 1200, h: 1760, prims: diningTable(4) },
  { id: 'dining6', name: 'Bàn ăn 6', group: 'Phòng ăn', w: 1600, h: 1760, prims: diningTable(6) },
  { id: 'dining8', name: 'Bàn ăn 8', group: 'Phòng ăn', w: 2200, h: 1760, prims: diningTable(8) },
  { id: 'bedS', name: 'Giường đơn', group: 'Phòng ngủ', w: 1000, h: 2000, prims: bed(1000, 2000, 1) },
  { id: 'bedD', name: 'Giường đôi', group: 'Phòng ngủ', w: 1600, h: 2000, prims: bed(1600, 2000, 2) },
  { id: 'wardrobe', name: 'Tủ áo', group: 'Phòng ngủ', w: 1800, h: 600, prims: wardrobe(1800) },
  { id: 'desk', name: 'Bàn làm việc + ghế', group: 'Làm việc', w: 1400, h: 1300, prims: desk() },
  { id: 'toilet', name: 'Bồn cầu', group: 'Vệ sinh', w: 400, h: 620, prims: toilet() },
  { id: 'lavabo', name: 'Lavabo', group: 'Vệ sinh', w: 600, h: 460, prims: lavabo() },
  { id: 'bathtub', name: 'Bồn tắm', group: 'Vệ sinh', w: 1700, h: 750, prims: bathtub() },
  { id: 'kitchenI', name: 'Bếp chữ I', group: 'Bếp', w: 3000, h: 600, prims: kitchenI() },
  { id: 'door', name: 'Cửa mở', group: 'Kiến trúc', w: 900, h: 900, prims: door(900) },
  { id: 'window', name: 'Cửa sổ', group: 'Kiến trúc', w: 1200, h: 100, prims: window2(1200) },
];

export const BLOCK_MAP: Record<string, BlockDef> = Object.fromEntries(BLOCKS.map((b) => [b.id, b]));
