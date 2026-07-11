/**
 * lib/cad/commands.ts — LỆNH/MACRO NỘI THẤT cho chặng 1 "Layout CAD" (mức SƠ PHÁC DD —
 * Design Development). Mục tiêu: vẽ nhanh mặt bằng trình bày được (tường/phòng/cửa/kích
 * thước/nhãn), KHÔNG nhắm tới độ chính xác hồ sơ thi công (CD) — phần CAD chuyên nghiệp đầy
 * đủ (TRIM/EXTEND/FILLET/CHAMFER/HATCH pattern thật…) thuộc về app CAD tách rời (dự án EFC),
 * cố tình KHÔNG làm sâu ở đây.
 *
 * Mọi hàm ở đây THUẦN (nhận toạ độ/tham số → trả Entity[]), không đụng store/React — gọi từ
 * CadCanvas/CadEditor rồi addEntities(). Giữ file này là nơi DUY NHẤT chứa logic macro để
 * CadEditor/CadCanvas không phình.
 */

import type { Doc, Entity, Box } from './model';
import { newId } from './store';
import { BLOCK_MAP } from './furniture';

/* ───────────────────────── WALL — tường 2 nét + poché ───────────────────────── */

/** 1 đoạn tường tim-tường a→b, bề dày t (mm) → quad tô đặc (hatch) + biên nét mảnh. */
export function wallSegment(a: { x: number; y: number }, b: { x: number; y: number }, t: number, layer: string): Entity[] {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * (t / 2);
  const ny = (dx / len) * (t / 2);
  const p1 = { x: a.x + nx, y: a.y + ny };
  const p2 = { x: b.x + nx, y: b.y + ny };
  const p3 = { x: b.x - nx, y: b.y - ny };
  const p4 = { x: a.x - nx, y: a.y - ny };
  return [
    { id: newId('e'), type: 'hatch', layer, points: [p1, p2, p3, p4], solid: true },
    { id: newId('e'), type: 'polyline', layer, points: [p1, p2, p3, p4], closed: true },
  ];
}

/** Chuỗi tường qua nhiều điểm tim-tường (như polyline). closed=true khép vòng (phòng kín). */
export function wallChain(points: { x: number; y: number }[], t: number, layer: string, closed = false): Entity[] {
  const out: Entity[] = [];
  for (let i = 0; i < points.length - 1; i++) out.push(...wallSegment(points[i], points[i + 1], t, layer));
  if (closed && points.length > 2) out.push(...wallSegment(points[points.length - 1], points[0], t, layer));
  return out;
}

/* ───────────────────────── ROOM — phòng chữ nhật + nhãn + diện tích ───────────────────────── */

export interface RoomResult {
  entities: Entity[];
  areaM2: number;
}

/**
 * Vẽ 1 phòng chữ nhật từ 2 góc đối diện: 4 tường (wallChain khép vòng) + tên phòng + diện
 * tích thông thuỷ (trong tim tường trừ bề dày, xấp xỉ đủ dùng cho DD) căn giữa phòng.
 */
export function roomRect(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  t: number,
  name: string,
  wallLayer: string,
  textLayer: string,
): RoomResult {
  const x0 = Math.min(p0.x, p1.x);
  const y0 = Math.min(p0.y, p1.y);
  const x1 = Math.max(p0.x, p1.x);
  const y1 = Math.max(p0.y, p1.y);
  const corners = [
    { x: x0, y: y0 },
    { x: x1, y: y0 },
    { x: x1, y: y1 },
    { x: x0, y: y1 },
  ];
  const entities = wallChain(corners, t, wallLayer, true);
  const clearW = Math.max(0, x1 - x0 - t);
  const clearH = Math.max(0, y1 - y0 - t);
  const areaM2 = (clearW * clearH) / 1e6;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const h = Math.min(280, Math.max(160, Math.min(x1 - x0, y1 - y0) * 0.12));
  entities.push({ id: newId('e'), type: 'text', layer: textLayer, at: { x: cx - (name.length * h * 0.3), y: cy + h * 0.5 }, text: name, h });
  entities.push({
    id: newId('e'),
    type: 'text',
    layer: textLayer,
    at: { x: cx - h * 1.6, y: cy - h * 0.9 },
    text: `${areaM2.toFixed(1)} m²`,
    h: h * 0.72,
  });
  return { entities, areaM2 };
}

/* ───────────────────────── DOOR / WINDOW — chèn nhanh block có sẵn ───────────────────────── */

/** Đặt 1 block furniture (dùng cho DOOR/WIN — tái dùng block 'door'/'window' có sẵn trong furniture.ts). */
export function placeBlock(blockId: string, at: { x: number; y: number }, rot: number, layer: string): Entity | null {
  if (!BLOCK_MAP[blockId]) return null;
  return { id: newId('e'), type: 'block', layer, block: blockId, at, rot, sx: 1, sy: 1 };
}

/* ───────────────────────── LƯỚI TRỤC (grid axes) ───────────────────────── */

/** Lưới trục kiến trúc: số 1,2,3… dọc trục X (dưới), chữ A,B,C… dọc trục Y (trái), mỗi đầu có bong bóng tròn. */
export function axesGrid(box: Box, spacing: number, layer: string, margin = 800): Entity[] {
  const out: Entity[] = [];
  const r = 260;
  const x0 = Math.floor(box.minX / spacing) * spacing;
  const x1 = Math.ceil(box.maxX / spacing) * spacing;
  const y0 = Math.floor(box.minY / spacing) * spacing;
  const y1 = Math.ceil(box.maxY / spacing) * spacing;
  const bottom = box.minY - margin;
  const left = box.minX - margin;

  let n = 1;
  for (let x = x0; x <= x1 + 1; x += spacing) {
    out.push({ id: newId('e'), type: 'line', layer, a: { x, y: box.minY - margin * 0.3 }, b: { x, y: box.maxY + margin * 0.3 } });
    out.push({ id: newId('e'), type: 'circle', layer, c: { x, y: bottom - r }, r });
    out.push({ id: newId('e'), type: 'text', layer, at: { x: x - r * 0.35, y: bottom - r - r * 0.4 }, text: String(n), h: r * 0.9 });
    n += 1;
  }
  let letter = 65; // 'A'
  for (let y = y0; y <= y1 + 1; y += spacing) {
    out.push({ id: newId('e'), type: 'line', layer, a: { x: box.minX - margin * 0.3, y }, b: { x: box.maxX + margin * 0.3, y } });
    out.push({ id: newId('e'), type: 'circle', layer, c: { x: left - r, y }, r });
    out.push({ id: newId('e'), type: 'text', layer, at: { x: left - r - r * 0.35, y: y - r * 0.4 }, text: String.fromCharCode(letter), h: r * 0.9 });
    letter += 1;
  }
  return out;
}

/* ───────────────────────── KHUNG TÊN (cajetín) ───────────────────────── */

export interface TitleBlockInfo {
  project: string;
  drawing: string;
  scale: string;
  author?: string;
  date?: string;
}

/** Khung tên góc phải-dưới bản vẽ, neo tại `at` = góc phải-dưới của khung. */
export function titleBlock(at: { x: number; y: number }, info: TitleBlockInfo, wallLayer: string, textLayer: string): Entity[] {
  const w = 2600;
  const h = 900;
  const x0 = at.x - w;
  const y0 = at.y;
  const out: Entity[] = [];
  out.push({ id: newId('e'), type: 'rect', layer: wallLayer, x: x0, y: y0, w, h });
  out.push({ id: newId('e'), type: 'line', layer: wallLayer, a: { x: x0, y: y0 + h * 0.55 }, b: { x: x0 + w, y: y0 + h * 0.55 } });
  out.push({ id: newId('e'), type: 'text', layer: textLayer, at: { x: x0 + 60, y: y0 + h - 130 }, text: info.project || 'DỰ ÁN', h: 130 });
  out.push({ id: newId('e'), type: 'text', layer: textLayer, at: { x: x0 + 60, y: y0 + h * 0.55 + 40 }, text: info.drawing || 'MẶT BẰNG BỐ TRÍ — SƠ PHÁC DD', h: 90 });
  out.push({ id: newId('e'), type: 'text', layer: textLayer, at: { x: x0 + 60, y: y0 + 60 }, text: `Tỷ lệ ${info.scale}`, h: 90 });
  if (info.date) out.push({ id: newId('e'), type: 'text', layer: textLayer, at: { x: x0 + w * 0.5, y: y0 + 60 }, text: info.date, h: 90 });
  if (info.author) out.push({ id: newId('e'), type: 'text', layer: textLayer, at: { x: x0 + w * 0.72, y: y0 + 60 }, text: `VẼ: ${info.author}`, h: 90 });
  return out;
}

/* ───────────────────────── MŨI TÊN BẮC ───────────────────────── */

export function northArrow(at: { x: number; y: number }, size = 700, layer = 'l-text'): Entity[] {
  const r = size / 2;
  return [
    { id: newId('e'), type: 'circle', layer, c: at, r },
    {
      id: newId('e'),
      type: 'polyline',
      layer,
      closed: true,
      points: [
        { x: at.x, y: at.y + r * 0.85 },
        { x: at.x + r * 0.28, y: at.y - r * 0.5 },
        { x: at.x, y: at.y - r * 0.2 },
        { x: at.x - r * 0.28, y: at.y - r * 0.5 },
      ],
    },
    { id: newId('e'), type: 'text', layer, at: { x: at.x - r * 0.28, y: at.y + r + 60 }, text: 'B', h: r * 0.55 },
  ];
}

/* ───────────────────────── THƯỚC TỈ LỆ ───────────────────────── */

/** Thước tỉ lệ: vạch 1m xen kẽ, số mét dưới mỗi vạch. `at` = góc trái-dưới của thước. */
export function scaleBar(at: { x: number; y: number }, segments = 4, segLenMm = 1000, layer = 'l-text'): Entity[] {
  const out: Entity[] = [];
  const barH = 90;
  for (let i = 0; i < segments; i++) {
    const x0 = at.x + i * segLenMm;
    const filled = i % 2 === 0;
    if (filled) {
      out.push({
        id: newId('e'),
        type: 'hatch',
        layer,
        solid: true,
        points: [
          { x: x0, y: at.y },
          { x: x0 + segLenMm, y: at.y },
          { x: x0 + segLenMm, y: at.y + barH },
          { x: x0, y: at.y + barH },
        ],
      });
    }
    out.push({ id: newId('e'), type: 'rect', layer, x: x0, y: at.y, w: segLenMm, h: barH });
    out.push({ id: newId('e'), type: 'text', layer, at: { x: x0 - 40, y: at.y + barH + 60 }, text: String(i), h: 110 });
  }
  out.push({ id: newId('e'), type: 'text', layer, at: { x: at.x, y: at.y - 160 }, text: 'Tỷ lệ (m)', h: 110 });
  return out;
}

/* ───────────────────────── CHUỖI KÍCH THƯỚC (dimension chain) ───────────────────────── */

/** Ghi 1 chuỗi kích thước liên tiếp qua các điểm (thẳng hàng) — dùng cho cạnh ngoài mặt bằng. */
export function dimensionChain(points: { x: number; y: number }[], off: number, layer: string): Entity[] {
  const out: Entity[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    out.push({ id: newId('e'), type: 'dim', layer, a: points[i], b: points[i + 1], off });
  }
  return out;
}

/* ───────────────────────── mở rộng doc tiện dụng ───────────────────────── */

/** Thêm bộ tiện ích trình bày (lưới trục + khung tên + mũi tên Bắc + thước tỉ lệ) quanh 1 bản vẽ đã có. */
export function addPresentationKit(doc: Doc, box: Box, info: TitleBlockInfo): Entity[] {
  const out: Entity[] = [];
  out.push(...axesGrid(box, 3000, 'l-dim'));
  const tbAt = { x: box.maxX + 2600, y: box.minY - 400 };
  out.push(...titleBlock(tbAt, info, 'l-wall', 'l-text'));
  out.push(...northArrow({ x: box.maxX + 900, y: box.maxY - 300 }, 700, 'l-text'));
  out.push(...scaleBar({ x: box.minX, y: box.minY - 1400 }, 4, 1000, 'l-text'));
  void doc;
  return out;
}
