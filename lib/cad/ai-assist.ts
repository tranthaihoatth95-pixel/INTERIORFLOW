/**
 * lib/cad/ai-assist.ts — AI-ASSIST chặng 1 "Layout CAD" (mức SƠ PHÁC DD).
 *
 * KIẾN TRÚC 2 TẦNG (xem docs/CAD-AI-MECHANISM.md):
 *   Tầng 1 — PARSE: đề bài ngôn ngữ tự nhiên → `LayoutSpec` (JSON trung gian có cấu trúc:
 *     danh sách phòng {tên, công năng, w, h, nội thất}). Đây là CHỖ DUY NHẤT nên cắm LLM thật
 *     sau này (thay `parseDescription` bằng 1 lời gọi /api/jobs trả JSON đúng schema LayoutSpec).
 *   Tầng 2 — SOLVER: `layoutToEntities(spec)` HÌNH HỌC THUẦN, TẤT ĐỊNH (deterministic) — cùng
 *     input luôn ra cùng toạ độ ⇒ KHÔNG "nhảy lung tung". Nó (a) xếp phòng trên lưới không chồng
 *     nhau, (b) dựng tường qua roomRect (đúng layer Tường + nhãn/diện tích), (c) đặt nội thất
 *     THEO CÔNG NĂNG (áp đúng tường, đủ clearance) trên layer Nội thất, clamp trong lòng phòng.
 *
 * Vì tầng 2 tất định, mọi bug "sai thực tế / bố cục nhảy" của bản stub cũ được xử lý ở đây:
 *   - Nội thất về đúng layer `l-furniture` (không còn nằm nhầm layer Tường).
 *   - Toạ độ neo theo TƯỜNG của từng phòng (bed áp tường, sofa dọc tường, WC sát tường…), không
 *     phải 1 hàng ngang cứng ở góc trên-trái ⇒ không tràn ra ngoài phòng.
 *   - Clamp trong lòng phòng + tránh chồng lấn (AABB) + đa phòng.
 */

import type { Entity } from './model';
import { roomRect } from './commands';
import { newId } from './store';
import { BLOCK_MAP } from './furniture';

/* ═══════════════════════ JSON TRUNG GIAN (schema cho LLM) ═══════════════════════ */

export type RoomFunction =
  | 'bedroom'
  | 'living'
  | 'dining'
  | 'kitchen'
  | 'bath'
  | 'office'
  | 'corridor'
  | 'generic';

/** 1 phòng trong đề bài (đã chuẩn hoá). LLM chỉ cần trả đúng shape này (w/h/items có thể bỏ —
 * solver tự điền mặc định theo công năng). */
export interface RoomSpec {
  /** tên hiển thị, VD "PHÒNG NGỦ" */
  name: string;
  fn: RoomFunction;
  /** kích thước phủ bì mong muốn (mm) — thiếu ⇒ solver dùng mặc định theo `fn` */
  w: number;
  h: number;
  /** id block nội thất (khoá trong furniture.ts) — thiếu ⇒ solver dùng bộ mặc định theo `fn` */
  items: string[];
}

export interface LayoutSpec {
  rooms: RoomSpec[];
}

export interface AiAssistResult {
  entities: Entity[];
  note: string;
}

/* ═══════════════════════ THAM SỐ CÔNG NĂNG (nguồn: xem doc) ═══════════════════════ */

/** Kích thước phủ bì mặc định (mm) theo công năng — sát khung TCVN/thực hành DD. */
const DEFAULT_SIZE: Record<RoomFunction, { w: number; h: number }> = {
  bedroom: { w: 3400, h: 3600 },
  living: { w: 4200, h: 3600 },
  dining: { w: 3200, h: 3200 },
  kitchen: { w: 3600, h: 2700 }, // đủ dài cho bếp chữ I 3000 + lối đi
  bath: { w: 2200, h: 1800 },
  office: { w: 3000, h: 2800 },
  corridor: { w: 1300, h: 3000 },
  generic: { w: 3600, h: 3200 },
};

/** Nội thất bắt buộc/mặc định theo công năng (id block). */
const DEFAULT_ITEMS: Record<RoomFunction, string[]> = {
  bedroom: ['bedD', 'wardrobe'],
  living: ['sofa3', 'armchair'],
  dining: ['dining4'],
  kitchen: ['kitchenI'],
  bath: ['toilet', 'lavabo'],
  office: ['desk'],
  corridor: [],
  generic: [],
};

/** Tên hiển thị mặc định theo công năng. */
const DEFAULT_NAME: Record<RoomFunction, string> = {
  bedroom: 'PHÒNG NGỦ',
  living: 'PHÒNG KHÁCH',
  dining: 'PHÒNG ĂN',
  kitchen: 'BẾP',
  bath: 'WC',
  office: 'PHÒNG LÀM VIỆC',
  corridor: 'HÀNH LANG',
  generic: 'PHÒNG',
};

type Wall = 'N' | 'S' | 'E' | 'W' | 'C';

/**
 * Quy tắc đặt THEO CÔNG NĂNG cho từng block: áp tường nào, góc xoay để "lưng" quay vào tường.
 *  - flush=true: món áp sát tường (giường/tủ/sofa/bếp/WC) — chừa khe nhỏ tránh đè poché tường.
 *  - wall='C': đặt giữa phòng theo 1 hàng (bàn ăn, ghế bành) — hướng tâm.
 * rot khớp hệ block local (xem furniture.ts): giường/tủ/bếp có "mặt trước" ở +Y.
 */
const ANCHOR: Record<string, { wall: Wall; rot: number; flush: boolean }> = {
  bedD: { wall: 'N', rot: 0, flush: true },
  bedS: { wall: 'N', rot: 0, flush: true },
  wardrobe: { wall: 'W', rot: Math.PI / 2, flush: true },
  sofa3: { wall: 'W', rot: Math.PI / 2, flush: true },
  sofa2: { wall: 'W', rot: Math.PI / 2, flush: true },
  armchair: { wall: 'C', rot: 0, flush: false },
  dining4: { wall: 'C', rot: 0, flush: false },
  dining6: { wall: 'C', rot: 0, flush: false },
  dining8: { wall: 'C', rot: 0, flush: false },
  desk: { wall: 'N', rot: 0, flush: true },
  kitchenI: { wall: 'S', rot: 0, flush: true },
  toilet: { wall: 'E', rot: -Math.PI / 2, flush: true },
  lavabo: { wall: 'E', rot: -Math.PI / 2, flush: true },
  bathtub: { wall: 'N', rot: 0, flush: true },
};

/* clearance (mm) — nguồn: Neufert/NKBA (xem doc). Dùng làm KHE giữa các món & lề bắt đầu. */
const GAP_BETWEEN = 250; // khe giữa 2 món cùng tường
const GAP_START = 90; // lề bắt đầu (cách tường vuông góc) — nhỏ để món áp tường (bếp chữ I) chạy gần hết tường
const WALL_KEEP = 40; // khe nhỏ giữ món áp tường không đè poché tường

/* ═══════════════════════ TẦNG 1 — PARSE (stub, sẽ thay bằng LLM) ═══════════════════════ */

const KEYWORD_TO_BLOCK: Record<string, string> = {
  'giường đôi': 'bedD', 'giường đơn': 'bedS', 'giường': 'bedD',
  'tủ quần áo': 'wardrobe', 'tủ áo': 'wardrobe', 'tủ': 'wardrobe',
  'sofa 3': 'sofa3', 'sofa 2': 'sofa2', 'ghế sofa': 'sofa3', 'sofa': 'sofa3',
  'ghế bành': 'armchair',
  'bàn ăn 8': 'dining8', 'bàn ăn 6': 'dining6', 'bàn ăn 4': 'dining4', 'bàn ăn': 'dining4',
  'bàn làm việc': 'desk', 'bàn học': 'desk',
  'bồn cầu': 'toilet', 'lavabo': 'lavabo', 'chậu rửa': 'lavabo', 'bồn tắm': 'bathtub',
  'bếp': 'kitchenI',
};

/** từ khoá công năng → RoomFunction (khớp cụm dài trước cụm ngắn). */
const FUNCTION_KEYWORDS: [string, RoomFunction][] = [
  ['phòng ngủ', 'bedroom'], ['ngủ', 'bedroom'],
  ['phòng khách', 'living'], ['khách', 'living'],
  ['phòng ăn', 'dining'], ['bàn ăn', 'dining'], ['ăn', 'dining'],
  ['bếp', 'kitchen'],
  ['vệ sinh', 'bath'], ['nhà tắm', 'bath'], ['phòng tắm', 'bath'], ['wc', 'bath'], ['toilet', 'bath'],
  ['làm việc', 'office'], ['văn phòng', 'office'], ['học', 'office'],
  ['hành lang', 'corridor'],
];

/** Tách "4x3.5" / "4 x 3.5" (mét) → {w,h} mm. null nếu không thấy. */
function parseDims(text: string): { w: number; h: number } | null {
  const m = text.match(/(\d+(?:[.,]\d+)?)\s*[x×*]\s*(\d+(?:[.,]\d+)?)/i);
  if (!m) return null;
  const w = parseFloat(m[1].replace(',', '.')) * 1000;
  const h = parseFloat(m[2].replace(',', '.')) * 1000;
  if (!(Number.isFinite(w) && w > 500 && Number.isFinite(h) && h > 500)) return null;
  return { w, h };
}

/** Đoán công năng từ 1 mệnh đề. */
function detectFunction(clause: string): RoomFunction {
  for (const [kw, fn] of FUNCTION_KEYWORDS) if (clause.includes(kw)) return fn;
  return 'generic';
}

/** Rút danh sách block id từ 1 mệnh đề (dedupe, giữ thứ tự). Nhận cả block id thô lẫn từ khoá. */
function extractItems(clause: string): string[] {
  const out: string[] = [];
  const add = (id: string) => { if (BLOCK_MAP[id] && !out.includes(id)) out.push(id); };
  // khớp cụm dài trước (đã sắp trong KEYWORD_TO_BLOCK: "giường đôi" trước "giường")
  for (const [kw, id] of Object.entries(KEYWORD_TO_BLOCK)) if (clause.includes(kw)) add(id);
  // cho phép LLM trả thẳng block id
  for (const id of Object.keys(BLOCK_MAP)) if (new RegExp(`\\b${id}\\b`).test(clause)) add(id);
  return out;
}

/** Tên hiển thị: ưu tiên cụm "phòng X" trong text, nếu không có → tên mặc định theo công năng. */
function detectName(clause: string, fn: RoomFunction): string {
  const m = clause.match(/phòng\s+(?:ngủ|khách|ăn|tắm|làm việc)?\S*/);
  if (m) return m[0].trim().toUpperCase();
  return DEFAULT_NAME[fn];
}

/**
 * TẦNG 1 (stub rule-based). Tách đề bài → LayoutSpec. Nhiều phòng: ngăn bằng xuống dòng, ';',
 * hoặc ' và ' / ',' khi vế sau CÓ từ khoá phòng. Mỗi mệnh đề: dims + công năng + nội thất.
 * Khi cắm LLM: thay TOÀN BỘ hàm này bằng lời gọi model trả đúng JSON `LayoutSpec`.
 */
export function parseDescription(text: string): LayoutSpec {
  const lower = text.toLowerCase().trim();
  // tách thô theo dấu mạnh, rồi gộp lại các mảnh không phải "phòng" vào phòng trước đó
  const raw = lower.split(/\n|;|(?:,|\bvà\b)(?=[^,]*(?:phòng|bếp|wc|vệ sinh|hành lang))/);
  const clauses = raw.map((s) => s.trim()).filter(Boolean);
  const rooms: RoomSpec[] = clauses.map((clause) => {
    const fn = detectFunction(clause);
    const dims = parseDims(clause) ?? DEFAULT_SIZE[fn];
    const items = extractItems(clause);
    return {
      name: detectName(clause, fn),
      fn,
      w: dims.w,
      h: dims.h,
      items: items.length ? items : [...DEFAULT_ITEMS[fn]],
    };
  });
  return { rooms: rooms.length ? rooms : [{ name: DEFAULT_NAME.generic, fn: 'generic', ...DEFAULT_SIZE.generic, items: [] }] };
}

/* ═══════════════════════ TẦNG 2 — SOLVER (tất định, hình học thuần) ═══════════════════════ */

interface Footprint { x: number; y: number; ex: number; ey: number } // tâm + nửa-extent*2 (AABB đầy đủ)

function footprintOf(at: { x: number; y: number }, ex: number, ey: number): Footprint {
  return { x: at.x, y: at.y, ex, ey };
}

function aabbOverlap(a: Footprint, b: Footprint): boolean {
  return Math.abs(a.x - b.x) * 2 < a.ex + b.ex && Math.abs(a.y - b.y) * 2 < a.ey + b.ey;
}

function clamp(v: number, lo: number, hi: number): number {
  if (lo > hi) return (lo + hi) / 2; // block to hơn lòng phòng → về giữa
  return Math.max(lo, Math.min(hi, v));
}

interface Placement { at: { x: number; y: number }; ex: number; ey: number; rot: number }

/**
 * Góc xoay để "lưng" món quay vào tường — DẪN XUẤT TẤT ĐỊNH từ mặt tường (N/S/C→0, W→+90°,
 * E→−90°). Khớp đúng các trị đã tinh chỉnh trong bảng ANCHOR, nên món ở tường ưu tiên GIỮ NGUYÊN
 * kết quả cũ; khi phải thử tường thay thế cũng dùng cùng quy tắc ⇒ không sinh block xoay sai.
 */
function rotForWall(wall: Wall): number {
  if (wall === 'W') return Math.PI / 2;
  if (wall === 'E') return -Math.PI / 2;
  return 0; // N, S, C
}

/** Thứ tự tường THỬ cho 1 món: ưu tiên → đối diện → 2 tường vuông góc. Món 'C' luôn ở giữa. */
function candidateWalls(wall: Wall): Wall[] {
  if (wall === 'C') return ['C'];
  const opp: Record<'N' | 'S' | 'E' | 'W', Wall> = { N: 'S', S: 'N', E: 'W', W: 'E' };
  const perp: Wall[] = wall === 'N' || wall === 'S' ? ['E', 'W'] : ['N', 'S'];
  return [wall, opp[wall], ...perp];
}

/**
 * Tìm chỗ đặt món trên 1 mặt tường bằng cách QUÉT dọc theo tường (first-fit tất định): bắt đầu ở
 * lề, nếu ô hiện tại đè món đã đặt thì nhảy con trỏ qua mép xa của món đó + khe rồi thử lại — chỉ
 * trả null khi trượt hết chiều dài tường mà không còn ô đủ chỗ (hoặc món dài hơn tường). Nhờ vậy
 * một món bị 1 tường chắn sẽ tự trượt sang ô khác / đổi tường thay vì bị bỏ oan.
 */
function tryPlaceOnWall(
  def: { w: number; h: number },
  wall: Wall,
  flush: boolean,
  interior: { ix0: number; iy0: number; ix1: number; iy1: number },
  placed: Footprint[],
): Placement | null {
  const { ix0, iy0, ix1, iy1 } = interior;
  const midY = (iy0 + iy1) / 2;
  const quarter = wall === 'W' || wall === 'E';
  const ex = quarter ? def.h : def.w; // extent X sau xoay
  const ey = quarter ? def.w : def.h; // extent Y sau xoay
  const back = flush ? WALL_KEEP : 0;
  const horizontal = wall === 'N' || wall === 'S' || wall === 'C'; // trục tự do = X

  // lề bắt đầu GAP_START cách tường vuông góc (giữ y hệt hành vi cũ ở tường ưu tiên)
  const freeLo = horizontal ? ix0 + GAP_START + ex / 2 : iy0 + GAP_START + ey / 2;
  const freeHi = horizontal ? ix1 - ex / 2 : iy1 - ey / 2;
  const fixed = horizontal
    ? wall === 'N' ? iy1 - ey / 2 - back : wall === 'S' ? iy0 + ey / 2 + back : midY
    : wall === 'W' ? ix0 + ex / 2 + back : ix1 - ex / 2 - back;

  if (freeLo > freeHi + 1) return null; // món dài hơn tường → tường này không chứa được

  let pos = freeLo;
  for (let guard = 0; guard < 128 && pos <= freeHi + 1; guard++) {
    const at = horizontal ? { x: pos, y: fixed } : { x: fixed, y: pos };
    const fp = footprintOf(at, ex, ey);
    let advance = -Infinity;
    for (const p of placed) {
      if (aabbOverlap(p, fp)) {
        const farEdge = horizontal ? p.x + p.ex / 2 : p.y + p.ey / 2;
        const need = farEdge + GAP_BETWEEN + (horizontal ? ex / 2 : ey / 2);
        if (need > advance) advance = need;
      }
    }
    if (advance === -Infinity) {
      // không đè ai — kẹp trong lòng phòng (an toàn khi món sâu hơn phòng) rồi tái kiểm chồng
      const finalAt = horizontal
        ? { x: clamp(pos, ix0 + ex / 2, ix1 - ex / 2), y: clamp(fixed, iy0 + ey / 2, iy1 - ey / 2) }
        : { x: clamp(fixed, ix0 + ex / 2, ix1 - ex / 2), y: clamp(pos, iy0 + ey / 2, iy1 - ey / 2) };
      if (placed.some((p) => aabbOverlap(p, footprintOf(finalAt, ex, ey)))) return null; // kẹp làm đè lại
      return { at: finalAt, ex, ey, rot: rotForWall(wall) };
    }
    pos = advance;
  }
  return null;
}

/**
 * Đặt nội thất 1 phòng theo công năng. Mỗi món THỬ LẦN LƯỢT các mặt tường hợp công năng (ưu tiên
 * → đối diện → vuông góc) và các ô trống dọc mỗi tường; chỉ BỎ khi THẬT SỰ không còn chỗ đủ
 * clearance ở mọi tường. Kết quả TẤT ĐỊNH, đúng layer nội thất, kẹp trong lòng phòng, không chồng.
 */
function placeFurniture(
  items: string[],
  interior: { ix0: number; iy0: number; ix1: number; iy1: number },
  furnLayer: string,
): { entities: Entity[]; skipped: string[] } {
  const out: Entity[] = [];
  const skipped: string[] = [];
  const placed: Footprint[] = [];

  for (const id of items) {
    const def = BLOCK_MAP[id];
    if (!def) continue;
    const a = ANCHOR[id] ?? { wall: 'C' as Wall, rot: 0, flush: false };
    let placement: Placement | null = null;
    for (const wall of candidateWalls(a.wall)) {
      placement = tryPlaceOnWall(def, wall, a.flush, interior, placed);
      if (placement) break;
    }
    if (!placement) { skipped.push(def.name); continue; } // hết chỗ ở MỌI tường → bỏ (báo note)
    placed.push(footprintOf(placement.at, placement.ex, placement.ey));
    out.push({ id: newId('e'), type: 'block', layer: furnLayer, block: id, at: placement.at, rot: placement.rot, sx: 1, sy: 1 });
  }
  return { entities: out, skipped };
}

/**
 * TẦNG 2 chính. Xếp các phòng trên lưới (row-packing, tất định) → dựng tường + nhãn (roomRect) →
 * đặt nội thất theo công năng. `origin` = góc trái-dưới của cả cụm. Không phòng nào chồng nhau.
 */
export function layoutToEntities(
  spec: LayoutSpec,
  origin: { x: number; y: number },
  wallLayer: string,
  textLayer: string,
  furnLayer: string,
  wallThickness = 110,
): AiAssistResult {
  const entities: Entity[] = [];
  const ROOM_GAP = Math.max(300, wallThickness * 2); // khe giữa 2 phòng để tường không đè nhau
  const MAX_ROW = 12000; // bề rộng tối đa 1 hàng trước khi xuống dòng (mm)

  let cx = origin.x;
  let cy = origin.y;
  let rowH = 0;
  const summary: string[] = [];
  const skippedAll: string[] = [];

  for (const room of spec.rooms) {
    const w = Math.max(1000, room.w);
    const h = Math.max(1000, room.h);
    // xuống hàng nếu vượt bề rộng tối đa (giữ nguyên phòng đầu hàng)
    if (cx > origin.x && cx + w > origin.x + MAX_ROW) {
      cx = origin.x;
      cy += rowH + ROOM_GAP;
      rowH = 0;
    }
    const p0 = { x: cx, y: cy };
    const p1 = { x: cx + w, y: cy + h };

    const { entities: roomEnts, areaM2 } = roomRect(p0, p1, wallThickness, room.name, wallLayer, textLayer);
    entities.push(...roomEnts);

    // lòng phòng (thông thuỷ) = trong tim tường trừ nửa bề dày mỗi bên
    const interior = {
      ix0: p0.x + wallThickness / 2,
      iy0: p0.y + wallThickness / 2,
      ix1: p1.x - wallThickness / 2,
      iy1: p1.y - wallThickness / 2,
    };
    const fr = placeFurniture(room.items, interior, furnLayer);
    entities.push(...fr.entities);
    if (fr.skipped.length) skippedAll.push(`${room.name}: ${fr.skipped.join(', ')}`);

    summary.push(`${room.name} ${(w / 1000).toFixed(1)}×${(h / 1000).toFixed(1)}m (${areaM2.toFixed(1)} m²)`);
    cx += w + ROOM_GAP;
    rowH = Math.max(rowH, h);
  }

  const skipNote = skippedAll.length
    ? ` — CHƯA đủ chỗ (đã bỏ để tránh chồng lấn): ${skippedAll.join('; ')}.`
    : '';
  return {
    entities,
    note: `Solver bố cục: ${spec.rooms.length} phòng — ${summary.join(' · ')}.${skipNote}`,
  };
}

/* ═══════════════════════ API ngoài (giữ nguyên chữ ký cũ + tuỳ chọn furnLayer) ═══════════════════════ */

/**
 * Đầu vào của nút "AI mô tả": text ngắn → phòng(s) có tường + nhãn + nội thất đặt đúng công năng.
 * Chữ ký GIỮ NGUYÊN để CadEditor không phải đổi; thêm tham số tuỳ chọn `furnLayer` (mặc định
 * 'l-furniture' — khớp DEFAULT_LAYERS) để nội thất KHÔNG còn nằm nhầm layer Tường.
 */
export function describeToEntities(
  text: string,
  origin: { x: number; y: number },
  wallLayer: string,
  textLayer: string,
  wallThickness = 110,
  furnLayer = 'l-furniture',
): AiAssistResult {
  const spec = parseDescription(text);
  return layoutToEntities(spec, origin, wallLayer, textLayer, furnLayer, wallThickness);
}
