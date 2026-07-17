/**
 * lib/cad/mep.ts — Sprint 6, D1.3/D2.2: ký hiệu 2D cho MEP sơ cấp (đèn + ổ cắm điện).
 *
 * Cùng PATTERN `BlockDef` với lib/cad/furniture.ts (Sprint 3, 41 shape nội thất) — KHÔNG tạo hệ
 * thống riêng. Các BlockDef ở đây được furniture.ts import và nối vào CHÍNH `BLOCKS`/`BLOCK_MAP`
 * (xem cuối furniture.ts) để tương thích ShapePalette/auto-snap/collision/clearance có sẵn mà
 * không cần sửa gì ở các module đó.
 *
 * Phạm vi Sprint 6 (xem AUDIT-2026-07-15.md mục E):
 *  - D1.3: 4 ký hiệu đèn — downlight (Ø100mm), pendant (đèn thả trần), track (đèn ray, nhiều
 *    điểm), wall light (đèn tường).
 *  - D2.2: 1 ký hiệu ổ cắm điện đơn giản (80×80mm) — dùng để đo mật độ ổ cắm thật trong
 *    checker.ts (xem lib/cad/standards/vn-electrical.ts + SỔ TRẠNG THÁI NỐI DÂY checker.ts).
 *
 * KHÔNG LÀM (xác nhận thiếu dữ liệu, xem AUDIT + brief Sprint 6): "hộp gen kỹ thuật" (D2.3-D2.5)
 * — không có quy ước DXF/tên block thật nào cho gen kỹ thuật trong dữ liệu hiện có của dự án,
 * dựng logic quét/né tránh gen mà không có ví dụ DXF thật sẽ là ĐOÁN MÒ (rủi ro an toàn thi
 * công cao hơn các gap khác). Cần ảnh/DXF mẫu có hộp gen thật trước khi làm — KHÔNG thêm
 * BlockDef/logic gen ở đây.
 */

import type { Pt } from './model';
import type { BlockDef, Prim } from './furniture';

function rect(x: number, y: number, w: number, h: number, closed = true): Prim {
  return { k: 'poly', closed, pts: [
    { x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h },
  ] };
}
function box(w: number, h: number): Prim {
  return rect(-w / 2, -h / 2, w, h);
}

// Đèn downlight — ký hiệu CAD phổ biến: vòng tròn + 2 nét chéo (X) bên trong.
function lightDownlight(): Prim[] {
  const r = 50; // Ø100mm
  const k = r * 0.6;
  return [
    { k: 'circle', c: { x: 0, y: 0 }, r },
    { k: 'line', a: { x: -k, y: -k }, b: { x: k, y: k } },
    { k: 'line', a: { x: -k, y: k }, b: { x: k, y: -k } },
  ];
}

// Đèn thả trần (pendant) — chao đèn (vòng ngoài) + bóng đèn (vòng trong).
function lightPendant(): Prim[] {
  return [
    { k: 'circle', c: { x: 0, y: 0 }, r: 150 },
    { k: 'circle', c: { x: 0, y: 0 }, r: 40 },
  ];
}

// Đèn ray (track light) — thanh ray + nhiều điểm đèn dọc thanh (mặc định 3 điểm).
function lightTrack(w: number, fixtures = 3): Prim[] {
  const prims: Prim[] = [{ k: 'line', a: { x: -w / 2, y: 0 }, b: { x: w / 2, y: 0 } }];
  for (let i = 0; i < fixtures; i++) {
    const x = fixtures === 1 ? 0 : -w / 2 + (w / (fixtures - 1)) * i;
    prims.push({ k: 'circle', c: { x, y: 0 }, r: 60 });
  }
  return prims;
}

// Đèn tường (wall light/sconce) — hộp áp tường thấp + chao đèn hình bán nguyệt hướng ra phòng.
function lightWall(w: number): Prim[] {
  const d = 100;
  return [
    box(w, d),
    { k: 'arc', c: { x: 0, y: -d / 2 }, r: w / 2, a1: 0, a2: Math.PI },
  ];
}

// Ổ cắm điện đơn giản — hộp vuông nhỏ + 2 lỗ (ký hiệu ổ đôi).
function outlet(): Prim[] {
  const w = 80, d = 80;
  return [
    box(w, d),
    { k: 'circle', c: { x: -15, y: 0 }, r: 6 },
    { k: 'circle', c: { x: 15, y: 0 }, r: 6 },
  ];
}

export const MEP_BLOCKS: BlockDef[] = [
  {
    id: 'lightDownlight', name: 'Đèn downlight (Ø100)', group: 'Điện', w: 100, h: 100,
    prims: lightDownlight(),
  },
  {
    id: 'lightPendant', name: 'Đèn thả trần (pendant)', group: 'Điện', w: 300, h: 300,
    prims: lightPendant(),
  },
  {
    id: 'lightTrack', name: 'Đèn ray (track light)', group: 'Điện', w: 1200, h: 120,
    prims: lightTrack(1200),
  },
  {
    id: 'lightWall', name: 'Đèn tường (wall light)', group: 'Điện', w: 200, h: 100,
    prims: lightWall(200),
    // mặt sau áp tường ở -y (giống rangeHood/refrigerator — xem furniture.ts)
    anchors: [{ kind: 'wall-back', pt: { x: 0, y: -50 } as Pt, normal: { x: 0, y: -1 } }],
  },
  {
    id: 'outlet', name: 'Ổ cắm điện', group: 'Điện', w: 80, h: 80,
    prims: outlet(),
    anchors: [{ kind: 'wall-back', pt: { x: 0, y: -40 } as Pt, normal: { x: 0, y: -1 } }],
  },
];
