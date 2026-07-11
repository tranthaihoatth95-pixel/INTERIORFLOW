/**
 * scripts/cad-library/blocks-data.ts — DỮ LIỆU GỐC của thư viện block CAD nội thất/kiến trúc.
 *
 * Toàn bộ hình học ở đây là TỰ DỰNG (nguyên bản, không chép từ nguồn thứ 3) theo đúng phong
 * cách đã dùng ở `lib/cad/furniture.ts`: danh sách Prim (line/poly/circle/arc) trong hệ toạ độ
 * LOCAL milimét, gốc ở TÂM block, trục X phải / Y lên. Kích thước theo cataloge nội thất phổ
 * biến VN/quốc tế (mm). File này CHỈ chứa dữ liệu — không phụ thuộc DOM/React, dùng được cả
 * trong script Node (generate-library.ts) lẫn (nếu cần sau này) trong app.
 *
 * KHÔNG import gì từ đây vào `lib/cad/furniture.ts` hay `components/cad/**` — thư viện này độc
 * lập hoàn toàn, chỉ dùng type `Prim` (đọc, không sửa) để khớp định dạng.
 */

import type { Prim } from '../../lib/cad/furniture';

export type Category =
  | 'phong-khach'
  | 'phong-an'
  | 'phong-ngu'
  | 'bep'
  | 've-sinh'
  | 'cua'
  | 'cay-canh'
  | 'xe'
  | 'cau-thang'
  | 'cot'
  | 'ky-hieu';

export const CATEGORY_LABEL: Record<Category, string> = {
  'phong-khach': 'Phòng khách',
  'phong-an': 'Phòng ăn',
  'phong-ngu': 'Phòng ngủ',
  bep: 'Bếp',
  've-sinh': 'Vệ sinh',
  cua: 'Cửa & cửa sổ',
  'cay-canh': 'Cây cảnh',
  xe: 'Xe',
  'cau-thang': 'Cầu thang',
  cot: 'Cột',
  'ky-hieu': 'Ký hiệu',
};

export interface LibBlockDef {
  id: string;
  name: string;
  category: Category;
  /** kích thước bao (mm) — dùng để tính viewBox thumbnail + hiển thị trong panel */
  w: number;
  h: number;
  prims: Prim[];
  /** nguồn dữ liệu: URL+license nếu lấy từ web, hoặc 'tự dựng' */
  source: string;
  license: string;
}

/* ───────────────────────── helper hình học (local mm, gốc tâm) ───────────────────────── */

function rect(x: number, y: number, w: number, h: number, closed = true): Prim {
  return { k: 'poly', closed, pts: [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }] };
}
function box(w: number, h: number): Prim {
  return rect(-w / 2, -h / 2, w, h);
}
function line(ax: number, ay: number, bx: number, by: number): Prim {
  return { k: 'line', a: { x: ax, y: ay }, b: { x: bx, y: by } };
}
function circ(cx: number, cy: number, r: number): Prim {
  return { k: 'circle', c: { x: cx, y: cy }, r };
}
function arc(cx: number, cy: number, r: number, a1: number, a2: number): Prim {
  return { k: 'arc', c: { x: cx, y: cy }, r, a1, a2 };
}
/** bo góc bằng bát giác xấp xỉ (đủ cho ký hiệu mặt bằng, không cần bezier) */
function octagon(w: number, h: number, cut: number): Prim {
  const x = w / 2;
  const y = h / 2;
  const c = Math.min(cut, x, y);
  return {
    k: 'poly',
    closed: true,
    pts: [
      { x: -x + c, y: -y }, { x: x - c, y: -y }, { x, y: -y + c },
      { x, y: y - c }, { x: x - c, y }, { x: -x + c, y },
      { x: -x, y: y - c }, { x: -x, y: -y + c },
    ],
  };
}
function hatchX(w: number, h: number): Prim[] {
  return [line(-w / 2, -h / 2, w / 2, h / 2), line(-w / 2, h / 2, w / 2, -h / 2)];
}
const SRC_SELF = 'tự dựng (nguyên bản, theo phong cách lib/cad/furniture.ts)';
const LIC_SELF = 'CC0 — tự do sử dụng/sửa/phân phối (tài sản gốc của dự án InteriorFlow)';

/* ───────────────────────── PHÒNG KHÁCH ───────────────────────── */

function sofa(w: number, d: number, seats: number): Prim[] {
  const arm = 120;
  const backY = d / 2 - 140;
  const prims: Prim[] = [
    box(w, d),
    line(-w / 2, backY, w / 2, backY),
    line(-w / 2 + arm, -d / 2, -w / 2 + arm, backY),
    line(w / 2 - arm, -d / 2, w / 2 - arm, backY),
  ];
  const inner = w - arm * 2;
  const seatW = inner / seats;
  for (let i = 0; i < seats; i++) {
    const sx = -inner / 2 + i * seatW;
    prims.push(rect(sx + 30, -d / 2 + 60, seatW - 60, backY - -d / 2 - 100));
  }
  return prims;
}

function sofaL(): Prim[] {
  // sofa góc chữ L: nhánh ngang 2600x900 + nhánh dọc (chaise) 900x1700, ghép ở góc trái-dưới
  const prims: Prim[] = [];
  prims.push(rect(-1300, -450, 2600, 900)); // thân ngang
  prims.push(rect(-1300, -450, 900, -1250)); // chaise vươn xuống (âm h = vẽ xuống dưới)
  prims.push(line(-1300 + 120, -450, -1300 + 120, 450 - 140));
  prims.push(line(1300 - 120, -450, 1300 - 120, 450 - 140));
  prims.push(rect(-1300 + 150, -450 + 60, 900, 900 - 100 - 140));
  prims.push(rect(-1300 + 150 + 900, -450 + 60, 700, 900 - 100 - 140));
  return prims;
}

function armchair(): Prim[] {
  return sofa(800, 800, 1);
}

function coffeeTable(): Prim[] {
  return [box(1200, 600), rect(-500, -250, 1000, 500)];
}

function tvConsole(): Prim[] {
  return [box(1600, 400), line(-700, 0, 700, 0), circ(0, 0, 60)];
}

function bookshelf(): Prim[] {
  const w = 900, h = 350;
  const prims: Prim[] = [box(w, h)];
  for (let i = 1; i < 4; i++) prims.push(line(-w / 2 + (i * w) / 4, -h / 2, -w / 2 + (i * w) / 4, h / 2));
  return prims;
}

/* ───────────────────────── PHÒNG ĂN ───────────────────────── */

function diningChair(cx: number, cy: number, up: boolean): Prim[] {
  const cw = 420, cd = 420;
  const y0 = up ? cy : cy - cd;
  return [rect(cx - cw / 2, y0, cw, cd)];
}

function diningTableRect(seats: 4 | 6): Prim[] {
  const w = seats === 4 ? 1200 : 1800;
  const d = seats === 4 ? 750 : 900;
  const prims: Prim[] = [box(w, d)];
  const perSide = seats / 2;
  const gap = w / perSide;
  for (let i = 0; i < perSide; i++) {
    const cx = -w / 2 + gap / 2 + i * gap;
    prims.push(...diningChair(cx, d / 2 + 80, true));
    prims.push(...diningChair(cx, -d / 2 - 80, false));
  }
  return prims;
}

function diningTableRound(seats: 4): Prim[] {
  const r = 600;
  const prims: Prim[] = [circ(0, 0, r)];
  for (let i = 0; i < seats; i++) {
    const ang = (i / seats) * Math.PI * 2;
    const cx = Math.cos(ang) * (r + 290);
    const cy = Math.sin(ang) * (r + 290);
    prims.push({ k: 'poly', closed: true, pts: chairSquareAt(cx, cy, ang) });
  }
  return prims;
}
function chairSquareAt(cx: number, cy: number, faceAngle: number): { x: number; y: number }[] {
  const s = 420;
  const local = [{ x: -s / 2, y: -s / 2 }, { x: s / 2, y: -s / 2 }, { x: s / 2, y: s / 2 }, { x: -s / 2, y: s / 2 }];
  const cos = Math.cos(faceAngle), sin = Math.sin(faceAngle);
  return local.map((p) => ({ x: cx + p.x * cos - p.y * sin, y: cy + p.x * sin + p.y * cos }));
}

function barStool(): Prim[] {
  return [circ(0, 0, 175), circ(0, 0, 130)];
}

function sideboard(): Prim[] {
  const w = 1600, h = 450;
  return [box(w, h), line(-w / 2 + w / 3, -h / 2, -w / 2 + w / 3, h / 2), line(-w / 2 + (2 * w) / 3, -h / 2, -w / 2 + (2 * w) / 3, h / 2)];
}

/* ───────────────────────── PHÒNG NGỦ ───────────────────────── */

function bed(w: number, l: number, pillows: number): Prim[] {
  const prims: Prim[] = [box(w, l)];
  const blanketY = -l / 2 + l * 0.62;
  prims.push(line(-w / 2, blanketY, w / 2, blanketY));
  const pw = (w - 120) / pillows;
  for (let i = 0; i < pillows; i++) {
    const px = -w / 2 + 60 + i * pw;
    prims.push(rect(px + 30, l / 2 - 380, pw - 60, 300));
  }
  return prims;
}

function nightstand(): Prim[] {
  return [box(450, 400), line(-225, 0, 225, 0)];
}

function wardrobe(w: number, doors: 2 | 3): Prim[] {
  const d = 600;
  const prims: Prim[] = [box(w, d), line(-w / 2, d / 2 - 40, w / 2, d / 2 - 40)];
  const seg = w / doors;
  for (let i = 0; i < doors; i++) {
    const cx = -w / 2 + i * seg;
    prims.push(line(cx, -d / 2, cx + seg / 2, d / 2 - 40));
    prims.push(line(cx + seg, -d / 2, cx + seg / 2, d / 2 - 40));
  }
  return prims;
}

function dresser(): Prim[] {
  const w = 1000, h = 500;
  const prims: Prim[] = [box(w, h)];
  for (let i = 1; i < 3; i++) prims.push(line(-w / 2, -h / 2 + (i * h) / 3, w / 2, -h / 2 + (i * h) / 3));
  return prims;
}

/* ───────────────────────── BẾP ───────────────────────── */

function sinkSingle(): Prim[] {
  return [box(600, 500), rect(-220, -170, 440, 340)];
}
function stove4(): Prim[] {
  const prims: Prim[] = [box(600, 600)];
  const off = 140;
  [[-off, -off], [off, -off], [-off, off], [off, off]].forEach(([x, y]) => prims.push(circ(x, y, 90)));
  return prims;
}
function fridge(): Prim[] {
  return [box(700, 700), line(-350, 100, 350, 100), line(0, 100, 0, 350)];
}
function kitchenIsland(): Prim[] {
  const w = 2000, d = 900;
  return [box(w, d), rect(-w / 2 + 200, -d / 2 + 100, 500, d - 200), circ(w / 2 - 500, 0, 30)];
}
function cabinetRunL(): Prim[] {
  const w1 = 3000, d1 = 600, w2 = 1500, d2 = 600;
  const prims: Prim[] = [];
  prims.push(rect(-w1 / 2, -d1 / 2, w1, d1));
  prims.push(rect(w1 / 2 - d2, -d1 / 2 - w2, d2, w2));
  for (let i = 1; i < 6; i++) prims.push(line(-w1 / 2 + (i * w1) / 6, -d1 / 2, -w1 / 2 + (i * w1) / 6, d1 / 2));
  return prims;
}

/* ───────────────────────── VỆ SINH ───────────────────────── */

function toilet(): Prim[] {
  return [
    rect(-190, 180, 380, 220),
    { k: 'poly', closed: true, pts: [
      { x: -170, y: 180 }, { x: 170, y: 180 }, { x: 200, y: -40 },
      { x: 120, y: -220 }, { x: -120, y: -220 }, { x: -200, y: -40 },
    ] },
    circ(0, -30, 130),
  ];
}
function bidet(): Prim[] {
  return [
    rect(-160, 150, 320, 180),
    { k: 'poly', closed: true, pts: [
      { x: -140, y: 150 }, { x: 140, y: 150 }, { x: 160, y: -60 },
      { x: 0, y: -180 }, { x: -160, y: -60 },
    ] },
    circ(0, -20, 100),
  ];
}
function lavabo(): Prim[] {
  return [box(600, 460), circ(0, -20, 170), circ(0, 190, 22)];
}
function bathtub(): Prim[] {
  const w = 1700, d = 750;
  return [box(w, d), rect(-w / 2 + 90, -d / 2 + 90, w - 180, d - 180)];
}
function showerStall(): Prim[] {
  const s = 900;
  return [box(s, s), arc(-s / 2, -s / 2, s * 0.9, 0, Math.PI / 2), circ(s / 2 - 150, s / 2 - 150, 40)];
}

/* ───────────────────────── CỬA & CỬA SỔ ───────────────────────── */

function doorSwing(w = 900): Prim[] {
  return [line(-w / 2, 0, -w / 2, w), arc(-w / 2, 0, w, 0, Math.PI / 2), line(-w / 2, 0, w / 2, 0)];
}
function doorDouble(w = 1500): Prim[] {
  const half = w / 2;
  return [
    line(-half, 0, -half, half), arc(-half, 0, half, 0, Math.PI / 2), line(-half, 0, 0, 0),
    line(half, 0, half, half), arc(half, 0, half, Math.PI / 2, Math.PI), line(half, 0, 0, 0),
  ];
}
function doorSliding(w = 1800): Prim[] {
  const t = 60;
  return [
    rect(-w / 2, -t / 2, w * 0.55, t),
    rect(-w / 2 + w * 0.4, -t / 2 - 70, w * 0.55, t),
    line(-w / 2, -t / 2 - 140, w / 2, -t / 2 - 140),
  ];
}
function windowN(w = 1200): Prim[] {
  const t = 100;
  return [
    line(-w / 2, t / 2, w / 2, t / 2), line(-w / 2, -t / 2, w / 2, -t / 2),
    line(-w / 2, 0, w / 2, 0), line(-w / 2, t / 2, -w / 2, -t / 2), line(w / 2, t / 2, w / 2, -t / 2),
  ];
}
function windowDouble(w = 1800): Prim[] {
  const t = 100;
  const base = windowN(w);
  base.push(line(0, t / 2, 0, -t / 2));
  return base;
}
function windowBay(): Prim[] {
  // cửa sổ góc/vòm: 3 nhịp kính gấp khúc lồi ra ngoài
  const seg = 700;
  return [
    line(-seg, 0, -seg * 0.5, -300), line(-seg * 0.5, -300, seg * 0.5, -300), line(seg * 0.5, -300, seg, 0),
    line(-seg, 60, -seg * 0.5, -240), line(-seg * 0.5, -240, seg * 0.5, -240), line(seg * 0.5, -240, seg, 60),
  ];
}

/* ───────────────────────── CÂY CẢNH ───────────────────────── */

function pottedPlant(r: number, leaves: number): Prim[] {
  const prims: Prim[] = [circ(0, 0, r * 0.35), circ(0, 0, r)];
  for (let i = 0; i < leaves; i++) {
    const a1 = (i / leaves) * Math.PI * 2;
    prims.push(arc(0, 0, r * 0.75, a1, a1 + Math.PI / (leaves * 1.4)));
  }
  return prims;
}
function treeTop(): Prim[] {
  const r = 900;
  return [circ(0, 0, r), circ(0, 0, r * 0.65), circ(0, 0, r * 0.32), line(-r, 0, r, 0), line(0, -r, 0, r)];
}

/* ───────────────────────── XE ───────────────────────── */

function carSedan(): Prim[] {
  return [
    octagon(4500, 1800, 500),
    line(-1500, -900, -1500, 900), line(1200, -900, 1200, 900),
    line(-900, -900, 1300, -900), line(-900, 900, 1300, 900),
  ];
}
function carSuv(): Prim[] {
  return [
    octagon(4700, 1950, 450),
    line(-1600, -975, -1600, 975), line(1300, -975, 1300, 975),
    line(-1000, -975, 1400, -975), line(-1000, 975, 1400, 975),
  ];
}

/* ───────────────────────── CẦU THANG ───────────────────────── */

function stairsStraight(): Prim[] {
  const w = 1000, l = 3000, steps = 12;
  const prims: Prim[] = [rect(-w / 2, -l / 2, w, l)];
  for (let i = 1; i < steps; i++) {
    const y = -l / 2 + (i * l) / steps;
    prims.push(line(-w / 2, y, w / 2, y));
  }
  prims.push({ k: 'poly', closed: false, pts: [{ x: -w / 2 + 120, y: -l / 2 + 200 }, { x: 0, y: -l / 2 + 400 }, { x: -w / 2 + 120, y: -l / 2 + 600 }] });
  return prims;
}
function stairsL(): Prim[] {
  const w = 1000;
  const flight1Len = 1400, landing = 1000, flight2Len = 1400;
  const prims: Prim[] = [];
  prims.push(rect(-w / 2, -flight1Len / 2 - landing / 2, w, flight1Len));
  for (let i = 1; i < 6; i++) {
    const y = -flight1Len / 2 - landing / 2 + (i * flight1Len) / 6;
    prims.push(line(-w / 2, y, w / 2, y));
  }
  const landY = flight1Len / 2 - landing / 2;
  prims.push(rect(-w / 2, landY, w + flight2Len, landing));
  prims.push(rect(w / 2 + landing - w, landY + landing, flight2Len - (landing - w), w));
  return prims;
}

/* ───────────────────────── CỘT ───────────────────────── */

function columnSquare(s = 400): Prim[] {
  return [box(s, s), ...hatchX(s * 0.8, s * 0.8)];
}
function columnRound(r = 200): Prim[] {
  return [circ(0, 0, r), line(-r * 0.7, -r * 0.7, r * 0.7, r * 0.7), line(-r * 0.7, r * 0.7, r * 0.7, -r * 0.7)];
}

/* ───────────────────────── KÝ HIỆU ───────────────────────── */

function northArrow(): Prim[] {
  const r = 400;
  return [
    circ(0, 0, r),
    { k: 'poly', closed: true, pts: [{ x: 0, y: r - 40 }, { x: -90, y: -r * 0.3 }, { x: 0, y: -r * 0.1 }, { x: 90, y: -r * 0.3 }] },
  ];
}

/* ───────────────────────── DANH SÁCH TỔNG ───────────────────────── */

export const LIB_BLOCKS: LibBlockDef[] = [
  // Phòng khách
  { id: 'living-sofa-2seat', name: 'Sofa 2 chỗ', category: 'phong-khach', w: 1600, h: 850, prims: sofa(1600, 850, 2), source: SRC_SELF, license: LIC_SELF },
  { id: 'living-sofa-3seat', name: 'Sofa 3 chỗ', category: 'phong-khach', w: 2100, h: 850, prims: sofa(2100, 850, 3), source: SRC_SELF, license: LIC_SELF },
  { id: 'living-sofa-lshape', name: 'Sofa góc chữ L', category: 'phong-khach', w: 2600, h: 1700, prims: sofaL(), source: SRC_SELF, license: LIC_SELF },
  { id: 'living-armchair', name: 'Ghế bành', category: 'phong-khach', w: 800, h: 800, prims: armchair(), source: SRC_SELF, license: LIC_SELF },
  { id: 'living-coffee-table', name: 'Bàn trà', category: 'phong-khach', w: 1200, h: 600, prims: coffeeTable(), source: SRC_SELF, license: LIC_SELF },
  { id: 'living-tv-console', name: 'Kệ TV', category: 'phong-khach', w: 1600, h: 400, prims: tvConsole(), source: SRC_SELF, license: LIC_SELF },
  { id: 'living-bookshelf', name: 'Kệ sách', category: 'phong-khach', w: 900, h: 350, prims: bookshelf(), source: SRC_SELF, license: LIC_SELF },

  // Phòng ăn
  { id: 'dining-table-4', name: 'Bàn ăn 4 ghế', category: 'phong-an', w: 1200, h: 1760, prims: diningTableRect(4), source: SRC_SELF, license: LIC_SELF },
  { id: 'dining-table-6', name: 'Bàn ăn 6 ghế', category: 'phong-an', w: 1800, h: 1860, prims: diningTableRect(6), source: SRC_SELF, license: LIC_SELF },
  { id: 'dining-table-round-4', name: 'Bàn tròn 4 ghế', category: 'phong-an', w: 1780, h: 1780, prims: diningTableRound(4), source: SRC_SELF, license: LIC_SELF },
  { id: 'dining-bar-stool', name: 'Ghế bar', category: 'phong-an', w: 350, h: 350, prims: barStool(), source: SRC_SELF, license: LIC_SELF },
  { id: 'dining-sideboard', name: 'Tủ búp phê', category: 'phong-an', w: 1600, h: 450, prims: sideboard(), source: SRC_SELF, license: LIC_SELF },

  // Phòng ngủ
  { id: 'bed-single', name: 'Giường đơn (1m)', category: 'phong-ngu', w: 1000, h: 2000, prims: bed(1000, 2000, 1), source: SRC_SELF, license: LIC_SELF },
  { id: 'bed-double', name: 'Giường đôi (1m4)', category: 'phong-ngu', w: 1400, h: 2000, prims: bed(1400, 2000, 2), source: SRC_SELF, license: LIC_SELF },
  { id: 'bed-queen', name: 'Giường Queen (1m6)', category: 'phong-ngu', w: 1600, h: 2000, prims: bed(1600, 2000, 2), source: SRC_SELF, license: LIC_SELF },
  { id: 'bed-king', name: 'Giường King (1m8)', category: 'phong-ngu', w: 1800, h: 2000, prims: bed(1800, 2000, 2), source: SRC_SELF, license: LIC_SELF },
  { id: 'bedroom-nightstand', name: 'Táp đầu giường', category: 'phong-ngu', w: 450, h: 400, prims: nightstand(), source: SRC_SELF, license: LIC_SELF },
  { id: 'bedroom-wardrobe-2door', name: 'Tủ áo 2 cánh', category: 'phong-ngu', w: 1200, h: 600, prims: wardrobe(1200, 2), source: SRC_SELF, license: LIC_SELF },
  { id: 'bedroom-wardrobe-3door', name: 'Tủ áo 3 cánh', category: 'phong-ngu', w: 1800, h: 600, prims: wardrobe(1800, 3), source: SRC_SELF, license: LIC_SELF },
  { id: 'bedroom-dresser', name: 'Tủ ngăn kéo', category: 'phong-ngu', w: 1000, h: 500, prims: dresser(), source: SRC_SELF, license: LIC_SELF },

  // Bếp
  { id: 'kitchen-sink', name: 'Bồn rửa đơn', category: 'bep', w: 600, h: 500, prims: sinkSingle(), source: SRC_SELF, license: LIC_SELF },
  { id: 'kitchen-stove-4', name: 'Bếp 4 vòng', category: 'bep', w: 600, h: 600, prims: stove4(), source: SRC_SELF, license: LIC_SELF },
  { id: 'kitchen-fridge', name: 'Tủ lạnh', category: 'bep', w: 700, h: 700, prims: fridge(), source: SRC_SELF, license: LIC_SELF },
  { id: 'kitchen-island', name: 'Đảo bếp', category: 'bep', w: 2000, h: 900, prims: kitchenIsland(), source: SRC_SELF, license: LIC_SELF },
  { id: 'kitchen-cabinet-l', name: 'Tủ bếp chữ L', category: 'bep', w: 3000, h: 2100, prims: cabinetRunL(), source: SRC_SELF, license: LIC_SELF },

  // Vệ sinh
  { id: 'bath-toilet', name: 'Bồn cầu', category: 've-sinh', w: 400, h: 620, prims: toilet(), source: SRC_SELF, license: LIC_SELF },
  { id: 'bath-bidet', name: 'Bồn tiểu nữ (bidet)', category: 've-sinh', w: 320, h: 480, prims: bidet(), source: SRC_SELF, license: LIC_SELF },
  { id: 'bath-lavabo', name: 'Lavabo', category: 've-sinh', w: 600, h: 460, prims: lavabo(), source: SRC_SELF, license: LIC_SELF },
  { id: 'bath-bathtub', name: 'Bồn tắm', category: 've-sinh', w: 1700, h: 750, prims: bathtub(), source: SRC_SELF, license: LIC_SELF },
  { id: 'bath-shower', name: 'Vòi sen (phòng tắm đứng)', category: 've-sinh', w: 900, h: 900, prims: showerStall(), source: SRC_SELF, license: LIC_SELF },

  // Cửa & cửa sổ
  { id: 'arch-door-single', name: 'Cửa đi 1 cánh', category: 'cua', w: 900, h: 900, prims: doorSwing(900), source: SRC_SELF, license: LIC_SELF },
  { id: 'arch-door-double', name: 'Cửa đi 2 cánh', category: 'cua', w: 1500, h: 750, prims: doorDouble(1500), source: SRC_SELF, license: LIC_SELF },
  { id: 'arch-door-sliding', name: 'Cửa lùa', category: 'cua', w: 1800, h: 200, prims: doorSliding(1800), source: SRC_SELF, license: LIC_SELF },
  { id: 'arch-window-single', name: 'Cửa sổ đơn', category: 'cua', w: 1200, h: 100, prims: windowN(1200), source: SRC_SELF, license: LIC_SELF },
  { id: 'arch-window-double', name: 'Cửa sổ đôi', category: 'cua', w: 1800, h: 100, prims: windowDouble(1800), source: SRC_SELF, license: LIC_SELF },
  { id: 'arch-window-bay', name: 'Cửa sổ vòm góc', category: 'cua', w: 1400, h: 300, prims: windowBay(), source: SRC_SELF, license: LIC_SELF },

  // Cây cảnh
  { id: 'plant-pot-small', name: 'Chậu cây nhỏ', category: 'cay-canh', w: 400, h: 400, prims: pottedPlant(200, 5), source: SRC_SELF, license: LIC_SELF },
  { id: 'plant-pot-large', name: 'Chậu cây lớn', category: 'cay-canh', w: 700, h: 700, prims: pottedPlant(350, 7), source: SRC_SELF, license: LIC_SELF },
  { id: 'plant-tree-top', name: 'Cây (nhìn từ trên)', category: 'cay-canh', w: 1800, h: 1800, prims: treeTop(), source: SRC_SELF, license: LIC_SELF },

  // Xe
  { id: 'vehicle-car-sedan', name: 'Xe sedan', category: 'xe', w: 4500, h: 1800, prims: carSedan(), source: SRC_SELF, license: LIC_SELF },
  { id: 'vehicle-car-suv', name: 'Xe SUV', category: 'xe', w: 4700, h: 1950, prims: carSuv(), source: SRC_SELF, license: LIC_SELF },

  // Cầu thang
  { id: 'stairs-straight', name: 'Thang thẳng', category: 'cau-thang', w: 1000, h: 3000, prims: stairsStraight(), source: SRC_SELF, license: LIC_SELF },
  { id: 'stairs-l-shape', name: 'Thang chữ L', category: 'cau-thang', w: 2400, h: 2400, prims: stairsL(), source: SRC_SELF, license: LIC_SELF },

  // Cột
  { id: 'column-square', name: 'Cột vuông', category: 'cot', w: 400, h: 400, prims: columnSquare(400), source: SRC_SELF, license: LIC_SELF },
  { id: 'column-round', name: 'Cột tròn', category: 'cot', w: 400, h: 400, prims: columnRound(200), source: SRC_SELF, license: LIC_SELF },

  // Ký hiệu
  { id: 'symbol-north', name: 'Ký hiệu hướng Bắc', category: 'ky-hieu', w: 800, h: 800, prims: northArrow(), source: SRC_SELF, license: LIC_SELF },
];
