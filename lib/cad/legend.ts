/**
 * lib/cad/legend.ts — Hệ Legend C2 (docs/PROPOSAL-LEGEND-SYSTEM.md §3): KHUNG CHÚ GIẢI ký hiệu
 * tự sinh từ những gì bản vẽ ĐANG DÙNG — quét doc.entities lấy tập block key + linetype + hatch
 * pattern thực dùng, KHÔNG hardcode danh sách. Legend là VIEW thuần từ Doc (không bảng DB mới).
 *
 * Swatch block = chính BlockEntity thu nhỏ (renderer lib/cad/render.ts vẽ được sẵn) ⇒ đặt lên
 * bản vẽ là entity THƯỜNG như schedule (Q-L3): PDF/DXF/PNG export ăn theo, user xoá/regenerate.
 * THUẦN — test bằng sucrase-node.
 */

import type { Doc, Entity, BlockEntity, HatchEntity, HatchPattern, LineType } from './model';
import { BLOCK_MAP } from './furniture';
import { newId } from './store';

export interface LegendBlockItem {
  block: string;
  /** tên VI từ BlockDef; block DXF lạ = key thô */
  name: string;
  /** tên EN bổ trợ (song ngữ TTT) — có trong EN_BLOCK_NAMES thì kèm, không thì bỏ */
  nameEn?: string;
  count: number;
}

export interface LegendItems {
  blocks: LegendBlockItem[];
  lineTypes: LineType[];
  hatches: HatchPattern[];
}

/** EN bổ trợ cho block hay dùng — thiếu key nào legend chỉ hiện tên VI (không đoán mò). */
export const EN_BLOCK_NAMES: Record<string, string> = {
  sofa2: '2-Seat Sofa', sofa3: '3-Seat Sofa', armchair: 'Armchair', sofaCorner: 'Corner Sofa',
  coffeeTable: 'Coffee Table', tvConsole: 'TV Console',
  dining4: 'Dining Table 4', dining6: 'Dining Table 6', dining8: 'Dining Table 8',
  bedS: 'Single Bed', bedD: 'Double Bed', wardrobe: 'Wardrobe', nightstand: 'Nightstand',
  dressingTable: 'Dressing Table', desk: 'Desk + Chair',
  toilet: 'Toilet', lavabo: 'Basin', bathtub: 'Bathtub', showerStall: 'Shower', mirror: 'Mirror',
  kitchenI: 'Kitchen I-Shape', kitchenIsland: 'Kitchen Island', refrigerator: 'Refrigerator',
  rangeHood: 'Range Hood', microwave: 'Microwave',
  door: 'Door 900', doorRoom: 'Door 800', doorWC: 'Door 700', doubleDoor: 'Double Door',
  slidingDoor: 'Sliding Door', glassDoor: 'Glass Door',
  window: 'Window', slidingWindow: 'Sliding Window', fixedWindow: 'Fixed Window',
  straightStairs: 'Straight Stairs', lStairs: 'L-Shape Stairs',
  acUnit: 'AC Unit', ceilingFan: 'Ceiling Fan',
  officeChair: 'Office Chair', filingCabinet: 'Filing Cabinet', bookshelf: 'Bookshelf',
};

/** Nhãn song ngữ linetype (ISO 128). */
export const LINETYPE_LABELS: Record<LineType, string> = {
  continuous: 'Nét liền · Continuous',
  hidden: 'Nét khuất · Hidden',
  dashed: 'Nét đứt · Dashed',
  center: 'Tim trục · Center',
  phantom: 'Nét phantom · Phantom',
};

/** Nhãn song ngữ hatch pattern. */
export const HATCH_LABELS: Record<HatchPattern, string> = {
  SOLID: 'Tô đặc · Solid fill',
  ANSI31: 'Gạch chéo 45° · ANSI31',
  ANSI32: 'Gạch thép · ANSI32',
  ANSI37: 'Lưới chéo · ANSI37',
  DOTS: 'Chấm · Dots',
};

/**
 * Quét Doc → tập ký hiệu ĐANG dùng. Linetype lấy theo hiệu dụng (override entity trước, layer
 * sau — cùng thứ tự render.ts); 'continuous' bỏ khỏi legend (mặc định, chú giải thừa).
 */
export function collectLegend(doc: Doc): LegendItems {
  const blockCount = new Map<string, number>();
  const lts = new Set<LineType>();
  const hatches = new Set<HatchPattern>();
  const layerLt = new Map(doc.layers.map((l) => [l.id, l.lineType ?? 'continuous'] as const));

  for (const e of doc.entities) {
    if (e.type === 'block') {
      const b = e as BlockEntity;
      blockCount.set(b.block, (blockCount.get(b.block) ?? 0) + 1);
    }
    const lt: LineType = e.lineType ?? layerLt.get(e.layer) ?? 'continuous';
    if (lt !== 'continuous') lts.add(lt);
    if (e.type === 'hatch') {
      const h = e as HatchEntity;
      hatches.add(h.pattern ?? (h.solid === false ? 'ANSI31' : 'SOLID'));
    }
  }

  const blocks: LegendBlockItem[] = [...blockCount.entries()]
    .map(([block, count]) => ({
      block,
      name: BLOCK_MAP[block]?.name ?? block,
      nameEn: EN_BLOCK_NAMES[block],
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const LT_ORDER: LineType[] = ['hidden', 'dashed', 'center', 'phantom', 'continuous'];
  const HATCH_ORDER: HatchPattern[] = ['SOLID', 'ANSI31', 'ANSI32', 'ANSI37', 'DOTS'];
  return {
    blocks,
    lineTypes: LT_ORDER.filter((t) => lts.has(t)),
    hatches: HATCH_ORDER.filter((h) => hatches.has(h)),
  };
}

/* ───────────────────────── Đặt legend lên bản vẽ ───────────────────────── */

const LEGEND_W = 4800;
const ROW_H = 700; // mỗi hàng có swatch block thu nhỏ nên cao hơn schedule
const TITLE_H = 520;
const SECTION_H = 420;
const PAD = 90;
const SWATCH_W = 900; // ô swatch bên trái mỗi hàng

export const LEGEND_TABLE_W = LEGEND_W;

/**
 * Dựng khung legend thành entity THƯỜNG tại `at` = góc TRÊN-TRÁI (world mm).
 * Swatch block = BlockEntity scale để lọt ô ~800×560mm; linetype = LineEntity override lineType;
 * hatch = HatchEntity vùng nhỏ đúng pattern. Tên song ngữ VI · EN nối bằng '·' (chuẩn TTT).
 */
export function legendToEntities(
  items: LegendItems,
  at: { x: number; y: number },
  opts?: { lineLayer?: string; textLayer?: string },
): Entity[] {
  const lineLayer = opts?.lineLayer ?? 'l-wall';
  const textLayer = opts?.textLayer ?? 'l-text';
  const out: Entity[] = [];
  const x0 = at.x;
  let y = at.y; // con trỏ Y chạy xuống (Y-up ⇒ trừ dần)

  const sections =
    (items.blocks.length ? 1 : 0) + (items.lineTypes.length ? 1 : 0) + (items.hatches.length ? 1 : 0);
  const rowsTotal = items.blocks.length + items.lineTypes.length + items.hatches.length;
  const H = TITLE_H + sections * SECTION_H + rowsTotal * ROW_H;
  if (!rowsTotal) return out; // bản vẽ chưa dùng ký hiệu nào — không sinh khung rỗng

  out.push({ id: newId('e'), type: 'rect', layer: lineLayer, x: x0, y: at.y - H, w: LEGEND_W, h: H });

  const text = (x: number, ty: number, t: string, h: number) =>
    out.push({ id: newId('e'), type: 'text', layer: textLayer, at: { x, y: ty }, text: t, h });

  // tiêu đề
  y -= TITLE_H;
  out.push({ id: newId('e'), type: 'line', layer: lineLayer, a: { x: x0, y }, b: { x: x0 + LEGEND_W, y } });
  text(x0 + PAD, y + 130, 'CHÚ GIẢI · LEGEND', 200);

  const sectionHead = (label: string) => {
    y -= SECTION_H;
    text(x0 + PAD, y + 110, label, 140);
    out.push({ id: newId('e'), type: 'line', layer: lineLayer, a: { x: x0, y }, b: { x: x0 + LEGEND_W, y } });
  };

  // ── ký hiệu block ──
  if (items.blocks.length) {
    sectionHead('Ký hiệu · Symbols');
    for (const it of items.blocks) {
      y -= ROW_H;
      const def = BLOCK_MAP[it.block];
      if (def) {
        // scale block lọt ô ~800×560, không phóng to block bé (giữ ≤ 1:1 cho ký hiệu nhỏ như đèn)
        const s = Math.min(800 / def.w, 560 / def.h, 1);
        const blk: BlockEntity = {
          id: newId('e'), type: 'block', layer: lineLayer,
          block: it.block, at: { x: x0 + PAD + SWATCH_W / 2, y: y + ROW_H / 2 }, rot: 0, sx: s, sy: s,
        };
        out.push(blk);
      } else {
        // block lạ (DXF import) — ô vuông placeholder
        out.push({ id: newId('e'), type: 'rect', layer: lineLayer, x: x0 + PAD + 150, y: y + 150, w: 500, h: 400 });
      }
      const label = it.nameEn ? `${it.name} · ${it.nameEn}` : it.name;
      text(x0 + PAD + SWATCH_W + 120, y + ROW_H / 2 - 60, `${label}  (${it.count})`, 130);
    }
  }

  // ── nét vẽ ──
  if (items.lineTypes.length) {
    sectionHead('Nét vẽ · Line types');
    for (const lt of items.lineTypes) {
      y -= ROW_H;
      out.push({
        id: newId('e'), type: 'line', layer: lineLayer, lineType: lt,
        a: { x: x0 + PAD, y: y + ROW_H / 2 }, b: { x: x0 + PAD + SWATCH_W - 100, y: y + ROW_H / 2 },
      });
      text(x0 + PAD + SWATCH_W + 120, y + ROW_H / 2 - 60, LINETYPE_LABELS[lt], 130);
    }
  }

  // ── hatch ──
  if (items.hatches.length) {
    sectionHead('Vật liệu tô · Hatches');
    for (const h of items.hatches) {
      y -= ROW_H;
      const hx = x0 + PAD;
      const hy = y + 120;
      const hatch: HatchEntity = {
        id: newId('e'), type: 'hatch', layer: lineLayer, pattern: h, solid: h === 'SOLID',
        patternScale: 0.6,
        points: [
          { x: hx, y: hy }, { x: hx + SWATCH_W - 200, y: hy },
          { x: hx + SWATCH_W - 200, y: hy + ROW_H - 240 }, { x: hx, y: hy + ROW_H - 240 },
        ],
      };
      out.push(hatch);
      out.push({ id: newId('e'), type: 'rect', layer: lineLayer, x: hx, y: hy, w: SWATCH_W - 200, h: ROW_H - 240 });
      text(x0 + PAD + SWATCH_W + 120, y + ROW_H / 2 - 60, HATCH_LABELS[h], 130);
    }
  }

  return out;
}
