/**
 * lib/cad/shared-types.ts — Hợp đồng dữ liệu Shape Library (Sprint 3, B1+B2).
 *
 * 5 type dùng chung giữa nhiều agent/module: BlockGroup, ShapeVariant, SnapAnchor,
 * ClearanceZone, ShapeMeta. Xem SHAPE-SCHEMA.md để biết ngữ cảnh đầy đủ.
 *
 * QUY TẮC: mọi chỗ cần dùng 5 type này PHẢI import từ đây — KHÔNG định nghĩa lại
 * (từng gây conflict merge lặp lại 3 lần ở Sprint 3 khi 3 agent song song đều tự
 * thêm bản sao vào đầu furniture.ts).
 */

import type { Pt } from './model';
import type { Prim } from './furniture';

/**
 * Nhóm palette — 7 nhóm cũ + 2 nhóm mới (Sprint 3 — B1.9 Cầu thang, B1.10 Thiết bị) + 1 nhóm mới
 * (Sprint 6 — D1.3/D2.2 MEP sơ cấp: đèn + ổ cắm điện, xem lib/cad/mep.ts).
 */
export type BlockGroup =
  | 'Phòng khách' | 'Phòng ăn' | 'Phòng ngủ' | 'Bếp' | 'Vệ sinh'
  | 'Làm việc' | 'Kiến trúc'
  | 'Cầu thang' | 'Thiết bị' | 'Điện';

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
