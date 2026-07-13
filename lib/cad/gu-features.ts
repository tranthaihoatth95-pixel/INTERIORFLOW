/**
 * lib/cad/gu-features.ts — ĐẶC TRƯNG BỐ CỤC mặt bằng cho Gu Engine (Sprint 2, M-3 / A-6 gaps).
 *
 * Rút 3 tầng đặc trưng THUẦN HÌNH HỌC từ 1 `Doc` (0 key, 0 GPU, tất định):
 *   1. OCCUPANCY GRID 8×8 — mật độ nội thất (block) trên lưới đều phủ bao hình bản vẽ.
 *   2. ADJACENCY GRAPH — đồ thị kề giữa các PHÒNG CÓ BIÊN KÍN (2 phòng "kề" khi biên của
 *      chúng chỉ cách nhau ≤ 1 bề dày tường).
 *   3. LAYOUT TYPOLOGY — phân loại bố cục: linear · island · perimeter · open-plan · cellular.
 *
 * RÀNG BUỘC (Sprint 2): CHỈ import `findHatchBoundary`/`polygonArea` từ hatch.ts — KHÔNG sửa
 * hatch.ts/query.ts. Không import checker (tránh kéo cả registry); phần lọc "tường thật" +
 * regex nhãn phòng NHÂN BẢN cùng ngữ nghĩa với checker.wallLikeDoc/ROOM_NAME_RE (comment tại
 * chỗ). Typology nối vào classifyOperator như TÍN HIỆU BỔ SUNG additive — xem
 * `classifyOperatorWithLayout` cuối file (operator-profile chỉ nhận `typology?` optional,
 * thiếu = hành vi y cũ).
 */

import type { Doc, Entity, Pt, Box } from './model';
import { entityBox, nearestOnSeg } from './model';
import { findHatchBoundary, polygonArea } from './hatch';
import { classifyOperator, type OperatorProfile } from './operator-profile';

/* ═══════════════════════ KIỂU ═══════════════════════ */

/** Phân loại bố cục mặt bằng (typology) — luật tất định từ hình học. */
export type LayoutTypology = 'linear' | 'island' | 'perimeter' | 'open-plan' | 'cellular';

/** Cạnh lưới occupancy (số ô mỗi chiều). */
export const GRID_N = 8;

/** Ngưỡng "kề" giữa 2 biên phòng (mm) — 1 bề dày tường phổ biến (110/220) + dung sai. */
export const ADJACENT_GAP_MM = 400;

export interface RoomFeature {
  name: string;
  /** vị trí nhãn TEXT. */
  at: Pt;
  /** biên kín dò bằng findHatchBoundary (toạ độ mm). */
  poly: Pt[];
  areaM2: number;
  centroid: Pt;
}

export interface GuCadFeatures {
  /** lưới 8×8 [hàng][cột] — hàng 0 = mép TRÊN (maxY, hệ Y-up), giá trị 0..1 = tỉ lệ ô bị nội thất phủ. */
  grid: number[][];
  /** tỉ lệ tổng mật độ / số ô (0..1) — bản vẽ trống = 0. */
  occupiedRatio: number;
  /** các phòng có nhãn + biên kín. */
  rooms: RoomFeature[];
  /** cạnh kề [i, j] (chỉ số trong `rooms`, i < j). */
  adjacency: Array<[number, number]>;
  typology: LayoutTypology;
  /** giải thích người đọc được (explainable — cùng triết lý operator-profile.evidence). */
  reasons: string[];
}

/* ═══════════════════════ LỌC HÌNH HỌC "TƯỜNG THẬT" ═══════════════════════ */

/**
 * Nhân bản ngữ nghĩa checker.wallLikeDoc (hàm đó KHÔNG export — không sửa checker để export
 * vì ngoài phạm vi): bỏ 'dim' + 'text' + layer trục ('Trục'/'l-axis') để đường kích thước /
 * lưới trục không bị coi là biên phòng.
 */
function wallLike(doc: Doc): Doc {
  const axisLayerIds = new Set(doc.layers.filter((l) => l.name === 'Trục' || l.id === 'l-axis').map((l) => l.id));
  return {
    layers: doc.layers,
    entities: doc.entities.filter((e) => e.type !== 'dim' && e.type !== 'text' && !axisLayerIds.has(e.layer)),
  };
}

/** Bao hình của phần hình học tường + nội thất (bỏ text/dim/trục) — nền cho lưới occupancy. */
function planBox(doc: Doc): Box | null {
  const w = wallLike(doc);
  if (!w.entities.length) return null;
  const box: Box = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  for (const e of w.entities) {
    const b = entityBox(e);
    if (!Number.isFinite(b.minX)) continue;
    box.minX = Math.min(box.minX, b.minX);
    box.minY = Math.min(box.minY, b.minY);
    box.maxX = Math.max(box.maxX, b.maxX);
    box.maxY = Math.max(box.maxY, b.maxY);
  }
  return Number.isFinite(box.minX) && box.maxX > box.minX && box.maxY > box.minY ? box : null;
}

/* ═══════════════════════ 1. OCCUPANCY GRID 8×8 ═══════════════════════ */

/**
 * Lưới mật độ NỘI THẤT: chia bao hình bản vẽ thành GRID_N×GRID_N ô đều; mỗi block furniture
 * đóng góp phần DIỆN TÍCH bao hình của nó giao với từng ô (entityBox — xấp xỉ đủ cho mật độ).
 * Giá trị ô kẹp về [0,1]. Bản vẽ không có block → toàn 0.
 */
export function occupancyGrid(doc: Doc, n = GRID_N): number[][] {
  const grid: number[][] = Array.from({ length: n }, () => Array<number>(n).fill(0));
  const box = planBox(doc);
  if (!box) return grid;
  const cw = (box.maxX - box.minX) / n;
  const ch = (box.maxY - box.minY) / n;
  if (cw <= 0 || ch <= 0) return grid;

  for (const e of doc.entities as Entity[]) {
    if (e.type !== 'block') continue;
    const b = entityBox(e);
    // quét các ô giao với bao hình block, cộng tỉ lệ diện tích giao / diện tích ô.
    const c0 = Math.max(0, Math.floor((b.minX - box.minX) / cw));
    const c1 = Math.min(n - 1, Math.floor((b.maxX - box.minX) / cw));
    for (let col = c0; col <= c1; col++) {
      const cellX0 = box.minX + col * cw;
      const overX = Math.min(b.maxX, cellX0 + cw) - Math.max(b.minX, cellX0);
      if (overX <= 0) continue;
      const r0 = Math.max(0, Math.floor((b.minY - box.minY) / ch));
      const r1 = Math.min(n - 1, Math.floor((b.maxY - box.minY) / ch));
      for (let rowUp = r0; rowUp <= r1; rowUp++) {
        const cellY0 = box.minY + rowUp * ch;
        const overY = Math.min(b.maxY, cellY0 + ch) - Math.max(b.minY, cellY0);
        if (overY <= 0) continue;
        // hàng 0 = mép TRÊN (Y-up → đảo chỉ số hàng) cho trực giác "nhìn như bản vẽ".
        const row = n - 1 - rowUp;
        grid[row][col] = Math.min(1, grid[row][col] + (overX * overY) / (cw * ch));
      }
    }
  }
  return grid;
}

/* ═══════════════════════ 2. PHÒNG + ADJACENCY ═══════════════════════ */

/** Quy ước nhãn phòng: TEXT toàn-hoa ≥2 ký tự, không phải dòng diện tích — CÙNG ngữ nghĩa
 *  checker.ROOM_NAME_RE (nhân bản vì hằng đó không export). */
const ROOM_LABEL_RE = /^[\p{Lu}0-9\s.+]+$/u;

function centroidOf(poly: Pt[]): Pt {
  let x = 0;
  let y = 0;
  for (const p of poly) {
    x += p.x;
    y += p.y;
  }
  const n = Math.max(1, poly.length);
  return { x: x / n, y: y / n };
}

/** Dò các phòng CÓ BIÊN KÍN từ nhãn TEXT (findHatchBoundary trên doc đã lọc tường thật). */
export function roomFeatures(doc: Doc): RoomFeature[] {
  const boundaryDoc = wallLike(doc);
  const rooms: RoomFeature[] = [];
  for (const e of doc.entities as Entity[]) {
    if (e.type !== 'text') continue;
    const s = e.text.trim();
    if (s.length < 2) continue;
    if (/M2|M²/i.test(s)) continue;
    if (!ROOM_LABEL_RE.test(s)) continue;
    const poly = findHatchBoundary(boundaryDoc, e.at);
    if (!poly || poly.length < 3) continue; // chỉ nhận phòng biên KÍN (khác operator-profile: ở đây cần poly thật)
    rooms.push({ name: s, at: e.at, poly, areaM2: polygonArea(poly) / 1e6, centroid: centroidOf(poly) });
  }
  return rooms;
}

/** Khoảng cách nhỏ nhất từ điểm p đến biên (các cạnh) của poly. */
function distToPoly(p: Pt, poly: Pt[]): number {
  let best = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const { d } = nearestOnSeg(p, poly[i], poly[(i + 1) % poly.length]);
    if (d < best) best = d;
  }
  return best;
}

/**
 * 2 phòng "kề" khi có ĐOẠN TƯỜNG CHUNG (không tính chạm GÓC): lấy mẫu mỗi cạnh của A tại
 * t = 1/4, 1/2, 3/4 — chỉ cần 1 điểm giữa-cạnh cách biên B ≤ gap là kề. Chạm góc thuần
 * (2 phòng chéo nhau qua 1 điểm) không có điểm giữa-cạnh nào gần → KHÔNG kề (đúng ý đồ).
 */
function sharesWall(a: Pt[], b: Pt[], gapMm: number): boolean {
  for (let i = 0; i < a.length; i++) {
    const p0 = a[i];
    const p1 = a[(i + 1) % a.length];
    for (const t of [0.25, 0.5, 0.75]) {
      const p = { x: p0.x + (p1.x - p0.x) * t, y: p0.y + (p1.y - p0.y) * t };
      if (distToPoly(p, b) <= gapMm) return true;
    }
  }
  return false;
}

/**
 * Đồ thị kề: phòng i kề phòng j khi biên 2 phòng có đoạn tường chung, cách nhau
 * ≤ ADJACENT_GAP_MM (2 phía của 1 tường). Đo 2 chiều để không phụ thuộc mật độ đỉnh.
 */
export function adjacencyGraph(rooms: RoomFeature[], gapMm = ADJACENT_GAP_MM): Array<[number, number]> {
  const edges: Array<[number, number]> = [];
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      if (sharesWall(rooms[i].poly, rooms[j].poly, gapMm) || sharesWall(rooms[j].poly, rooms[i].poly, gapMm)) {
        edges.push([i, j]);
      }
    }
  }
  return edges;
}

/* ═══════════════════════ 3. TYPOLOGY ═══════════════════════ */

interface GridStats {
  total: number; // tổng mật độ
  borderShare: number; // phần mật độ nằm ở vành ngoài lưới
  centerShare: number; // phần mật độ nằm ở lõi (2..n-3)
  aspect: number; // độ giãn dài của đám mật độ (sd trục lớn / sd trục nhỏ) — ≥1
}

function gridStats(grid: number[][]): GridStats {
  const n = grid.length;
  let total = 0;
  let border = 0;
  let center = 0;
  let sx = 0;
  let sy = 0;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const v = grid[r][c];
      if (v <= 0) continue;
      total += v;
      sx += v * c;
      sy += v * r;
      const isBorder = r === 0 || c === 0 || r === n - 1 || c === n - 1;
      if (isBorder) border += v;
      const core = r >= 2 && r <= n - 3 && c >= 2 && c <= n - 3;
      if (core) center += v;
    }
  }
  if (total <= 0) return { total: 0, borderShare: 0, centerShare: 0, aspect: 1 };
  const mx = sx / total;
  const my = sy / total;
  let vx = 0;
  let vy = 0;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const v = grid[r][c];
      if (v <= 0) continue;
      vx += v * (c - mx) ** 2;
      vy += v * (r - my) ** 2;
    }
  }
  const sdx = Math.sqrt(vx / total);
  const sdy = Math.sqrt(vy / total);
  const lo = Math.max(Math.min(sdx, sdy), 0.15); // sàn tránh chia ~0 (mọi block 1 hàng)
  return { total, borderShare: border / total, centerShare: center / total, aspect: Math.max(sdx, sdy) / lo };
}

/**
 * Phân loại TYPOLOGY — luật tất định, thứ tự ưu tiên rõ (luật khớp TRƯỚC thắng):
 *   1. cellular  — ≥4 phòng biên kín VÀ tổng diện tích phòng ≥ 50% bao hình → chia ô nhỏ.
 *   2. linear    — đám nội thất giãn dài 1 trục (aspect ≥ 2.6) → tuyến (dãy bàn/hành lang).
 *   3. perimeter — mật độ dồn vành ngoài (≥62%) + lõi thưa (≤25%) → bám chu vi (kệ/quầy quanh tường).
 *   4. island    — mật độ dồn lõi (≥50%) + vành thưa (≤30%) → cụm đảo giữa sàn.
 *   5. open-plan — mặc định còn lại (≤3 phòng kín, nội thất tản đều).
 */
export function classifyTypology(doc: Doc): { typology: LayoutTypology; reasons: string[]; stats: GridStats; rooms: RoomFeature[] } {
  const grid = occupancyGrid(doc);
  const stats = gridStats(grid);
  const rooms = roomFeatures(doc);
  const reasons: string[] = [];

  const box = planBox(doc);
  const planM2 = box ? ((box.maxX - box.minX) * (box.maxY - box.minY)) / 1e6 : 0;
  const roomsM2 = rooms.reduce((s, r) => s + r.areaM2, 0);
  const roomCover = planM2 > 0 ? roomsM2 / planM2 : 0;

  if (rooms.length >= 4 && roomCover >= 0.5) {
    reasons.push(`${rooms.length} phòng biên kín phủ ${(roomCover * 100).toFixed(0)}% mặt bằng → cellular`);
    return { typology: 'cellular', reasons, stats, rooms };
  }
  if (stats.total > 0 && stats.aspect >= 2.6) {
    reasons.push(`nội thất giãn dài 1 trục (aspect ${stats.aspect.toFixed(1)}) → linear`);
    return { typology: 'linear', reasons, stats, rooms };
  }
  if (stats.total > 0 && stats.borderShare >= 0.62 && stats.centerShare <= 0.25) {
    reasons.push(`${(stats.borderShare * 100).toFixed(0)}% mật độ bám vành ngoài, lõi thưa → perimeter`);
    return { typology: 'perimeter', reasons, stats, rooms };
  }
  if (stats.total > 0 && stats.centerShare >= 0.5 && stats.borderShare <= 0.3) {
    reasons.push(`${(stats.centerShare * 100).toFixed(0)}% mật độ dồn lõi giữa sàn → island`);
    return { typology: 'island', reasons, stats, rooms };
  }
  reasons.push(
    rooms.length <= 1
      ? 'ít phòng kín, nội thất tản đều → open-plan'
      : `${rooms.length} phòng kín nhưng không đủ tín hiệu chia ô → open-plan`,
  );
  return { typology: 'open-plan', reasons, stats, rooms };
}

/* ═══════════════════════ HÀM CHÍNH ═══════════════════════ */

/** Rút TRỌN BỘ đặc trưng Gu-CAD từ 1 Doc — grid + phòng + adjacency + typology. Tất định. */
export function guCadFeatures(doc: Doc): GuCadFeatures {
  const grid = occupancyGrid(doc);
  const { typology, reasons, stats, rooms } = classifyTypology(doc);
  const n = grid.length;
  return {
    grid,
    occupiedRatio: n > 0 ? Math.min(1, stats.total / (n * n)) : 0,
    rooms,
    adjacency: adjacencyGraph(rooms),
    typology,
    reasons,
  };
}

/**
 * TÍN HIỆU BỔ SUNG cho operator classifier (additive): chạy guCadFeatures rồi đưa typology
 * vào classifyOperator qua field `typology?` (operator-profile). KHÔNG truyền typology =
 * classifyOperator hành vi y cũ — 54 test cũ giữ nguyên.
 */
export function classifyOperatorWithLayout(doc: Doc): { profile: OperatorProfile; features: GuCadFeatures } {
  const features = guCadFeatures(doc);
  return { profile: classifyOperator({ doc, typology: features.typology }), features };
}
