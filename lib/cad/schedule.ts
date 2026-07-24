/**
 * lib/cad/schedule.ts — Hệ Legend C1 (docs/PROPOSAL-LEGEND-SYSTEM.md §3): BẢNG THỐNG KÊ tự đếm
 * (furniture/door/window schedule) từ doc.entities — group theo block key (+variant) và
 * elementType, đếm số lượng, kèm kích thước danh nghĩa từ BlockDef/variant.
 *
 * THUẦN (không React/DOM/store-instance) — test bằng sucrase-node như dossier-check.ts.
 * Đóng dấu lên bản vẽ: scheduleToEntities() trả text/line entity THƯỜNG (Q-L3 đã chốt: entity
 * thường + nút "Cập nhật lại", KHÔNG object sống) ⇒ PDF/DXF/PNG export ăn theo pipeline có sẵn,
 * user xoá/di chuyển được như mọi entity khác.
 */

import type { Doc, Entity, BlockEntity, ElementType } from './model';
import { BLOCK_MAP } from './furniture';
import { newId } from './store';

export interface ScheduleRow {
  /** khoá group: 'block:sofa3' / 'block:bedD:king-1800' / 'elem:door' / 'unclassified' */
  key: string;
  /** tên hiển thị — BlockDef/variant name hoặc nhãn elementType song ngữ */
  label: string;
  count: number;
  /** kích thước danh nghĩa mm (block/variant); elementType thuần không có */
  w?: number;
  h?: number;
  /** block key (nếu group là block) — để nối ProductSpec qua drawingBlock */
  block?: string;
  /** BlockEntity.specId đầu tiên gặp trong group (nếu user đã gán) */
  specId?: string;
  /** id các entity thuộc group — click row highlight trên canvas */
  ids: string[];
}

/** Nhãn song ngữ cho elementType (IF2-nền). */
export const ELEMENT_TYPE_LABELS: Record<Exclude<ElementType, null>, string> = {
  wall: 'Tường · Wall',
  slab: 'Sàn · Slab',
  column: 'Cột · Column',
  beam: 'Dầm · Beam',
  door: 'Cửa đi · Door',
  window: 'Cửa sổ · Window',
  furniture: 'Nội thất · Furniture',
  space: 'Không gian · Space',
};

export type ScheduleFilter = Exclude<ElementType, null> | 'all';

/** Tên + kích thước danh nghĩa của 1 BlockEntity (variant ưu tiên). */
function blockInfo(e: BlockEntity): { label: string; w?: number; h?: number } {
  const def = BLOCK_MAP[e.block];
  if (!def) return { label: e.block }; // block DXF/lạ — vẫn đếm, label = key thô
  if (e.variant && def.variants) {
    const v = def.variants.find((x) => x.id === e.variant);
    if (v) return { label: v.name, w: v.w, h: v.h };
  }
  return { label: def.name, w: def.w, h: def.h };
}

/**
 * Đếm entity theo group. Quy tắc:
 *  - BlockEntity → group 'block:<key>[:variant]' (đại diện vật thể đặt được — nội thất/cửa/thiết bị).
 *  - Entity thường CÓ elementType → group 'elem:<type>' (tường/sàn/cột... vẽ bằng line/hatch).
 *  - Entity thường KHÔNG elementType (line/text/dim trang trí…) → BỎ QUA (không phải "vật thể
 *    đếm được"; hàng "Chưa phân loại" chỉ tính hatch/polyline kín thiếu elementType — dữ liệu
 *    cũ chưa migrate, xem rủi ro §8 proposal).
 */
export function buildSchedule(doc: Doc, filter: ScheduleFilter = 'all'): ScheduleRow[] {
  const rows = new Map<string, ScheduleRow>();
  const bump = (key: string, e: Entity, init: () => Omit<ScheduleRow, 'key' | 'count' | 'ids'>) => {
    let r = rows.get(key);
    if (!r) {
      r = { key, count: 0, ids: [], ...init() };
      rows.set(key, r);
    }
    r.count += 1;
    r.ids.push(e.id);
    if (!r.specId && e.type === 'block' && (e as BlockEntity).specId) r.specId = (e as BlockEntity).specId;
  };

  for (const e of doc.entities) {
    if (filter !== 'all' && e.elementType !== filter) continue;
    if (e.type === 'block') {
      const b = e as BlockEntity;
      const key = `block:${b.block}${b.variant ? `:${b.variant}` : ''}`;
      bump(key, e, () => ({ ...blockInfo(b), block: b.block }));
      continue;
    }
    if (e.elementType) {
      bump(`elem:${e.elementType}`, e, () => ({ label: ELEMENT_TYPE_LABELS[e.elementType as Exclude<ElementType, null>] }));
      continue;
    }
    // hatch/polyline kín thiếu elementType = "có thể là phần tử BIM chưa migrate" → gom 1 hàng.
    if (filter === 'all' && (e.type === 'hatch' || (e.type === 'polyline' && e.closed))) {
      bump('unclassified', e, () => ({ label: 'Chưa phân loại · Unclassified' }));
    }
  }
  return [...rows.values()].sort((a, b) => b.count - a.count);
}

/* ───────────────────────── Đóng dấu bảng lên bản vẽ ───────────────────────── */

/** Cột bảng schedule (mm world, vẽ ở tỉ lệ 1:1 như khung tên 2600mm của titleBlock). */
const COL_W = [500, 3400, 1500, 700, 2600] as const; // # · Tên · KT (mm) · SL · Ghi chú
const ROW_H = 380;
const HEAD_H = 420;
const TITLE_H = 520;
const PAD = 90;

export const SCHEDULE_TABLE_W = COL_W.reduce((a, b) => a + b, 0);

/** Ghi chú per-row (sku/brand từ ProductSpec) — UI tra map rồi truyền vào; thuần không fetch. */
export type ScheduleNotes = Record<string, string>; // key → note

/**
 * Dựng bảng schedule thành entity text/line THƯỜNG tại `at` = góc TRÊN-TRÁI bảng (world mm).
 * Mọi entity gắn text tag ở hàng tiêu đề "THỐNG KÊ · SCHEDULE" — user muốn cập nhật thì xoá
 * bảng cũ + bấm đóng dấu lại (Q-L3, M1 chưa làm object sống).
 */
export function scheduleToEntities(
  rows: ScheduleRow[],
  at: { x: number; y: number },
  opts?: { lineLayer?: string; textLayer?: string; notes?: ScheduleNotes; title?: string },
): Entity[] {
  const lineLayer = opts?.lineLayer ?? 'l-wall';
  const textLayer = opts?.textLayer ?? 'l-text';
  const notes = opts?.notes ?? {};
  const W = SCHEDULE_TABLE_W;
  const bodyRows = Math.max(1, rows.length);
  const H = TITLE_H + HEAD_H + bodyRows * ROW_H;
  const x0 = at.x;
  const yTop = at.y;
  const y0 = yTop - H; // đáy bảng (Y-up)
  const out: Entity[] = [];

  // khung ngoài + vạch ngang
  out.push({ id: newId('e'), type: 'rect', layer: lineLayer, x: x0, y: y0, w: W, h: H });
  const yTitle = yTop - TITLE_H;
  const yHead = yTitle - HEAD_H;
  out.push({ id: newId('e'), type: 'line', layer: lineLayer, a: { x: x0, y: yTitle }, b: { x: x0 + W, y: yTitle } });
  out.push({ id: newId('e'), type: 'line', layer: lineLayer, a: { x: x0, y: yHead }, b: { x: x0 + W, y: yHead } });
  for (let i = 1; i < bodyRows; i++) {
    const y = yHead - i * ROW_H;
    out.push({ id: newId('e'), type: 'line', layer: lineLayer, a: { x: x0, y }, b: { x: x0 + W, y } });
  }
  // vạch dọc (chỉ vùng head+body, không cắt hàng tiêu đề)
  let cx = x0;
  for (let c = 0; c < COL_W.length - 1; c++) {
    cx += COL_W[c];
    out.push({ id: newId('e'), type: 'line', layer: lineLayer, a: { x: cx, y: y0 }, b: { x: cx, y: yTitle } });
  }

  const text = (x: number, y: number, t: string, h: number) =>
    out.push({ id: newId('e'), type: 'text', layer: textLayer, at: { x, y }, text: t, h });

  // tiêu đề song ngữ TTT (VI dẫn trước · EN bổ trợ)
  text(x0 + PAD, yTitle + 130, opts?.title ?? 'THỐNG KÊ · SCHEDULE', 200);

  // header
  const colX = (c: number) => x0 + COL_W.slice(0, c).reduce((a, b) => a + b, 0) + PAD;
  const heads = ['#', 'Tên · Name', 'KT (mm)', 'SL', 'Ghi chú · Note'];
  heads.forEach((hd, c) => text(colX(c), yHead + 120, hd, 130));

  // body
  rows.forEach((r, i) => {
    const y = yHead - (i + 1) * ROW_H + 110;
    text(colX(0), y, String(i + 1), 130);
    text(colX(1), y, r.label, 130);
    text(colX(2), y, r.w && r.h ? `${r.w}×${r.h}` : '—', 130);
    text(colX(3), y, String(r.count), 130);
    const note = notes[r.key] ?? '';
    if (note) text(colX(4), y, note, 120);
  });

  return out;
}
