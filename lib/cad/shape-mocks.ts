/**
 * lib/cad/shape-mocks.ts — BlockDef MOCK cho Sprint 3 / Agent C (B2 — tương tác shape).
 *
 * Agent A/B đang thêm shape THẬT (variants/anchors/clearance/meta) song song trong worktree
 * khác — Agent C KHÔNG chờ họ, tự khai báo 2-3 BlockDef giả ở đây (đúng interface
 * SHAPE-SCHEMA.md) để build + test B2.1-B2.8. Khi merge, code B2 tự động ăn theo field thật
 * của A/B vì cùng interface (BlockDef), không cần sửa gì thêm.
 *
 * KHÔNG thêm vào BLOCK_MAP/BLOCKS (lib/cad/furniture.ts) — chỉ dùng nội bộ cho demo/test.
 */

import type { BlockDef, Prim } from './furniture';

function rect(x: number, y: number, w: number, h: number, closed = true): Prim {
  return { k: 'poly', closed, pts: [
    { x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h },
  ] };
}
function box(w: number, h: number): Prim {
  return rect(-w / 2, -h / 2, w, h);
}

/** Giường mock — có variants (đơn/đôi), anchor áp lưng vào tường, clearance lối đi 2 bên. */
export const MOCK_BED: BlockDef = {
  id: 'mock-bed',
  name: 'Giường (mock)',
  group: 'Phòng ngủ',
  w: 1000,
  h: 2000,
  prims: [box(1000, 2000)],
  variants: [
    { id: 'single', name: 'Giường đơn', w: 1000, h: 2000, prims: [box(1000, 2000)] },
    { id: 'double', name: 'Giường đôi', w: 1600, h: 2000, prims: [box(1600, 2000)] },
  ],
  anchors: [
    // đầu giường (y dương = đầu nằm) áp lưng vào tường phía sau; normal trỏ VÀO tường.
    { kind: 'wall-back', pt: { x: 0, y: 1000 }, normal: { x: 0, y: 1 } },
  ],
  clearance: [
    // lối đi tối thiểu 2 bên hông giường
    { x: -1300, y: -1000, w: 300, h: 2000, reason: 'Lối đi tối thiểu 700-900mm cạnh giường' },
    { x: 1000, y: -1000, w: 300, h: 2000, reason: 'Lối đi tối thiểu 700-900mm cạnh giường' },
  ],
  meta: { price: 8500000, vendor: 'Nội Thất Xinh', sku: 'BED-MOCK-01' },
};

/** Tủ bếp mock — anchor áp lưng vào tường (không variant), clearance mở cửa tủ phía trước. */
export const MOCK_CABINET: BlockDef = {
  id: 'mock-cabinet',
  name: 'Tủ bếp (mock)',
  group: 'Bếp',
  w: 900,
  h: 600,
  prims: [box(900, 600)],
  anchors: [
    { kind: 'wall-back', pt: { x: 0, y: 300 }, normal: { x: 0, y: 1 } },
  ],
  clearance: [
    { x: -450, y: -900, w: 900, h: 600, reason: 'Bán kính mở cửa tủ 600mm phía trước' },
  ],
  meta: { price: 3200000, vendor: 'Nội Thất Xinh', sku: 'CAB-MOCK-01' },
};

/** Bồn cầu mock — có variant 1/2 khối, KHÔNG anchor (đặt tự do), clearance vòng quanh. */
export const MOCK_TOILET: BlockDef = {
  id: 'mock-toilet',
  name: 'Bồn cầu (mock)',
  group: 'Vệ sinh',
  w: 400,
  h: 620,
  prims: [box(400, 620)],
  variants: [
    { id: '1-piece', name: 'Bồn cầu 1 khối', w: 400, h: 620, prims: [box(400, 620)] },
    { id: '2-piece', name: 'Bồn cầu 2 khối', w: 400, h: 700, prims: [box(400, 700)] },
  ],
  clearance: [
    { x: -450, y: -310, w: 900, h: 900, reason: 'Vùng trống thao tác tối thiểu 900×900mm' },
  ],
  meta: { sku: 'WC-MOCK-01' }, // chưa có giá thật — bỏ qua price
};

export const MOCK_BLOCKS: BlockDef[] = [MOCK_BED, MOCK_CABINET, MOCK_TOILET];
export const MOCK_BLOCK_MAP: Record<string, BlockDef> = Object.fromEntries(MOCK_BLOCKS.map((b) => [b.id, b]));
