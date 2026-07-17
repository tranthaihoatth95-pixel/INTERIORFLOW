/**
 * lib/cad/mep-suggest.ts — Sprint 6, MEP sơ cấp (nhóm E, xem AUDIT-2026-07-15.md mục E): chiếu
 * sáng (D1.1/D1.2/D1.4/D1.5) + ổ cắm/AC (D2.1/D2.6).
 *
 * NGUYÊN TẮC (cùng "hiến pháp" với lib/cad/standards/checker.ts và lib/cad/room-autolabel.ts):
 * mọi hàm ở đây CHỈ ĐỌC `doc` và TRẢ VỀ đề xuất — KHÔNG BAO GIỜ tự chèn BlockEntity vào bản vẽ.
 * UI (CadEditor.tsx) hiển thị đề xuất ra panel, user phải bấm "Đặt" thì mới thật sự addEntity().
 *
 * Phạm vi (đã thu hẹp theo brief Sprint 6):
 *  - D1.1 estimateLightingSuggestion — lux cần theo diện tích × mức lux tham khảo
 *    (lib/cad/standards/vn-lighting.ts, TÁI DÙNG số liệu có sẵn) → tổng lumen + số đèn downlight
 *    (giả định 900lm/đèn — GIẢ ĐỊNH THỰC HÀNH PHỔ BIẾN, KHÔNG PHẢI trích chuẩn).
 *  - D1.2 suggestLightGridPositions/suggestRoomLightingPlans — rải đều đèn theo lưới đơn giản
 *    dựa theo bounding box phòng, lọc điểm nằm trong biên thật (pointInPolygon).
 *  - D1.4 suggestSwitchPositions — vị trí công tắc cạnh cửa, ước lệ 150-200mm, KHÔNG trích chuẩn.
 *  - D1.5 suggestCircuitGroups — gợi ý nhóm mạch chính/phụ theo loại đèn (hiển thị text, không
 *    có logic đi dây/tính công suất thật).
 *  - D2.1 suggestOutletPlacements — vị trí ổ cắm cạnh đồ nội thất cố định (tủ đầu giường/bàn làm
 *    việc/bếp).
 *  - D2.6 checkAcUnitBedProximity — CHỈ gợi ý đơn giản "cách đầu giường ≥Xmm" (không xét hướng
 *    nhà/hướng thổi thật vì model 2D không lưu dữ liệu này — xem brief Sprint 6, giới hạn CỐ Ý).
 *
 * KHÔNG LÀM (D2.3-D2.5 — hộp gen kỹ thuật): xem lib/cad/mep.ts đầu file cho lý do đầy đủ.
 */

import type { Doc, Pt } from './model';
import { blockToWorld } from './model';
import { findHatchBoundary, pointInPolygon } from './hatch';
import { BLOCK_MAP } from './furniture';
import type { BlockDef } from './furniture';
import { effectiveBlockSize } from './shape-interactions';
import { findRoomLabels, classifyRoom, type RoomKind, type RoomInfo } from './standards/checker';
import { VN_LIGHTING } from './standards/vn-lighting';

/* ═══════════════════════════ D1.1 — lux suggest ═══════════════════════════ */

/** giả định thực hành phổ biến (đèn downlight LED gia dụng cỡ trung) — KHÔNG PHẢI trích chuẩn. */
export const ASSUMED_LUMENS_PER_DOWNLIGHT = 900;

export type LightingRoomKind = 'living' | 'bedroom' | 'kitchen';

const LUX_RULE_ID_BY_KIND: Record<LightingRoomKind, string> = {
  living: 'vn-lighting-living-room-lux-reference',
  bedroom: 'vn-lighting-bedroom-lux-reference',
  kitchen: 'vn-lighting-kitchen-lux-reference',
};

/** RoomKind (checker.ts, nhiều loại hơn) → LightingRoomKind (chỉ 3 loại có số liệu lux tham
 * khảo trong vn-lighting.ts) — các loại khác (wc/corridor/office/assembly/other) trả về null,
 * KHÔNG bịa số. */
export function toLightingRoomKind(kind: RoomKind): LightingRoomKind | null {
  if (kind === 'living' || kind === 'bedroom' || kind === 'kitchen') return kind;
  return null;
}

export interface LightingSuggestion {
  roomKind: LightingRoomKind;
  areaM2: number;
  minLux: number;
  maxLux: number;
  /** trung bình min/max — mức lux "mục tiêu" dùng để tính số đèn */
  targetLux: number;
  totalLumensLow: number;
  totalLumensHigh: number;
  totalLumensTarget: number;
  assumedLumensPerDownlight: number;
  recommendedDownlightCount: number;
  /** id rule vn-lighting.ts đã dùng để lấy minLux/maxLux — TÁI DÙNG, không tự nghĩ số khác */
  sourceRuleId: string;
}

/**
 * D1.1 — tính lux cần theo diện tích phòng × mức lux tham khảo (vn-lighting.ts) → tổng lumen +
 * số đèn downlight gợi ý. areaM2 <= 0 hoặc kind không có số liệu tham khảo (ngoài 3 loại
 * living/bedroom/kitchen) → null, không đoán mò.
 */
export function estimateLightingSuggestion(areaM2: number, kind: LightingRoomKind): LightingSuggestion | null {
  if (!(areaM2 > 0)) return null;
  const ruleId = LUX_RULE_ID_BY_KIND[kind];
  const rule = VN_LIGHTING.rules.find((r) => r.id === ruleId);
  if (!rule) return null;
  const minLux = rule.params.minLux;
  const maxLux = rule.params.maxLux;
  const targetLux = (minLux + maxLux) / 2;
  const totalLumensLow = areaM2 * minLux;
  const totalLumensHigh = areaM2 * maxLux;
  const totalLumensTarget = areaM2 * targetLux;
  const recommendedDownlightCount = Math.max(1, Math.round(totalLumensTarget / ASSUMED_LUMENS_PER_DOWNLIGHT));
  return {
    roomKind: kind, areaM2, minLux, maxLux, targetLux, totalLumensLow, totalLumensHigh, totalLumensTarget,
    assumedLumensPerDownlight: ASSUMED_LUMENS_PER_DOWNLIGHT, recommendedDownlightCount, sourceRuleId: ruleId,
  };
}

/* ═══════════════════════════ D1.2 — light placement suggest ═══════════════════════════ */

function bboxOf(poly: Pt[]): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of poly) {
    minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY };
}

/**
 * D1.2 — rải đều `count` điểm trong đa giác phòng bằng lưới đơn giản (hàng×cột gần khớp tỉ lệ
 * khung bao), lọc lại điểm nào thật sự nằm trong biên (pointInPolygon) — thuần toán học, không
 * đụng doc/DOM, dễ test. Với phòng không phải hình chữ nhật (chữ L…), lưới có thể loại bỏ vài
 * điểm rơi ra ngoài biên thật, trả về ÍT HƠN `count` — chấp nhận được (không đoán mò vị trí thay
 * thế), user tự điều chỉnh khi đặt.
 */
export function suggestLightGridPositions(roomPoly: Pt[], count: number, marginMm = 400): Pt[] {
  if (count <= 0 || roomPoly.length < 3) return [];
  const { minX, minY, maxX, maxY } = bboxOf(roomPoly);
  const w = maxX - minX;
  const h = maxY - minY;
  if (!(w > 0) || !(h > 0)) return [];
  const aspect = w / h;
  let cols = Math.max(1, Math.round(Math.sqrt(count * aspect)));
  let rows = Math.max(1, Math.ceil(count / cols));
  while (cols * rows < count) {
    if (cols <= rows) cols += 1; else rows += 1;
  }
  const marginX = Math.min(marginMm, w / 2 - 1);
  const marginY = Math.min(marginMm, h / 2 - 1);
  const usableW = Math.max(0, w - marginX * 2);
  const usableH = Math.max(0, h - marginY * 2);
  const pts: Pt[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (pts.length >= count) break;
      const fx = cols === 1 ? 0.5 : (c + 0.5) / cols;
      const fy = rows === 1 ? 0.5 : (r + 0.5) / rows;
      pts.push({ x: minX + marginX + fx * usableW, y: minY + marginY + fy * usableH });
    }
  }
  return pts.filter((p) => pointInPolygon(p, roomPoly));
}

export interface RoomLightingPlan {
  roomName: string;
  roomAt: Pt;
  areaM2: number;
  lighting: LightingSuggestion;
  /** vị trí gợi ý (world mm) — có thể ÍT HƠN lighting.recommendedDownlightCount nếu phòng không
   * phải hình chữ nhật (xem suggestLightGridPositions). */
  positions: Pt[];
}

/** Nhân bản checker.wallLikeDoc (không export, cùng lý do room-autolabel.ts đã làm — tránh sửa
 * checker.ts ngoài phạm vi): loại 'dim'/'text'/layer trục khỏi hình học dùng để dò biên phòng. */
function wallLikeDocForMep(doc: Doc): Doc {
  const axisLayerIds = new Set(doc.layers.filter((l) => l.name === 'Trục' || l.id === 'l-axis').map((l) => l.id));
  return {
    layers: doc.layers,
    entities: doc.entities.filter((e) => e.type !== 'dim' && e.type !== 'text' && !axisLayerIds.has(e.layer)),
  };
}

/** D1.1 + D1.2 gộp cho 1 phòng cụ thể (RoomInfo từ findRoomLabels) — dùng bởi
 * suggestRoomLightingPlans, cũng export riêng để test/tái dùng có mục tiêu. */
export function suggestRoomLightingPlan(doc: Doc, room: RoomInfo): RoomLightingPlan | null {
  if (room.areaM2 === null) return null;
  const kind = toLightingRoomKind(classifyRoom(room.name));
  if (!kind) return null;
  const lighting = estimateLightingSuggestion(room.areaM2, kind);
  if (!lighting) return null;
  const boundaryDoc = wallLikeDocForMep(doc);
  const poly = findHatchBoundary(boundaryDoc, room.at);
  const positions = poly ? suggestLightGridPositions(poly, lighting.recommendedDownlightCount) : [];
  return { roomName: room.name, roomAt: room.at, areaM2: room.areaM2, lighting, positions };
}

/** D1.1 + D1.2 cho MỌI phòng living/bedroom/kitchen dò được trong `doc`. */
export function suggestRoomLightingPlans(doc: Doc): RoomLightingPlan[] {
  const plans: RoomLightingPlan[] = [];
  for (const room of findRoomLabels(doc)) {
    const plan = suggestRoomLightingPlan(doc, room);
    if (plan) plans.push(plan);
  }
  return plans;
}

/* ═══════════════════════════ D1.4 — switch position suggest ═══════════════════════════ */

/** ước lệ 150-200mm cách khung cửa — thực hành phổ biến điện dân dụng VN, KHÔNG trích chuẩn cụ thể. */
export const SWITCH_OFFSET_FROM_DOOR_FRAME_MM = 175;

const DOOR_BLOCK_IDS = new Set(['door', 'doorRoom', 'doorWC', 'doubleDoor', 'slidingDoor', 'glassDoor']);

export interface SwitchPositionSuggestion {
  doorEntityId: string;
  doorBlock: string;
  at: Pt;
  note: string;
}

/**
 * D1.4 — vị trí công tắc cạnh cửa ra vào. Quy ước cục bộ dùng chung bởi door()/doorRoom/doorWC/
 * doubleDoor/glassDoor (lib/cad/furniture.ts): tâm mở cửa tại local (0,0), bề rộng mở nằm dọc
 * trục X từ -w/2 đến +w/2, "phía trong phòng" là +Y (hướng cung quét cửa). Với door()/doorRoom/
 * doorWC/glassDoor, bản lề ở x=-w/2 nên "phía khoá" (latch side) là +w/2 — điểm gợi ý đặt ở
 * local (w/2 + offset, offset). doubleDoor (2 cánh đối xứng, không có 1 phía bản lề duy nhất) và
 * slidingDoor (không có bản lề) dùng CÙNG quy ước +w/2 làm mặc định — GIỚI HẠN đã biết, ghi rõ
 * trong `note` để user tự điều chỉnh bên nào phù hợp thực tế.
 */
export function suggestSwitchPositions(
  doc: Doc,
  blockMap: Record<string, BlockDef> = BLOCK_MAP,
  offsetMm = SWITCH_OFFSET_FROM_DOOR_FRAME_MM,
): SwitchPositionSuggestion[] {
  const out: SwitchPositionSuggestion[] = [];
  for (const e of doc.entities) {
    if (e.type !== 'block') continue;
    if (!DOOR_BLOCK_IDS.has(e.block)) continue;
    const { w } = effectiveBlockSize(e, blockMap);
    const local: Pt = { x: w / 2 + offsetMm, y: offsetMm };
    const at = blockToWorld(local, e);
    const limitNote = e.block === 'doubleDoor' || e.block === 'slidingDoor'
      ? ' Cửa 2 cánh/cửa trượt không có "phía bản lề" rõ ràng — vị trí chỉ mang tính minh hoạ 1 bên, tự điều chỉnh theo thực tế.'
      : '';
    out.push({
      doorEntityId: e.id,
      doorBlock: e.block,
      at,
      note: `Gợi ý vị trí công tắc cạnh cửa "${blockMap[e.block]?.name ?? e.block}" — ước lệ cách khung cửa ${offsetMm}mm, phía trong phòng. Thực hành phổ biến điện dân dụng VN, KHÔNG trích chuẩn cụ thể.${limitNote}`,
    });
  }
  return out;
}

/* ═══════════════════════════ D1.5 — circuit group hint ═══════════════════════════ */

const MAIN_LIGHT_BLOCKS = new Set(['lightDownlight', 'lightPendant']);
const ACCENT_LIGHT_BLOCKS = new Set(['lightTrack', 'lightWall']);

export interface CircuitGroupHint {
  mainCircuitCount: number;
  accentCircuitCount: number;
  note: string;
}

/** D1.5 — gợi ý nhóm mạch (chính = downlight/pendant, phụ/accent = track/wall) — CHỈ đếm & hiển
 * thị text, KHÔNG tính công suất/aptomat/dây dẫn thật. */
export function suggestCircuitGroups(doc: Doc): CircuitGroupHint {
  let main = 0;
  let accent = 0;
  for (const e of doc.entities) {
    if (e.type !== 'block') continue;
    if (MAIN_LIGHT_BLOCKS.has(e.block)) main += 1;
    else if (ACCENT_LIGHT_BLOCKS.has(e.block)) accent += 1;
  }
  const note = main + accent === 0
    ? 'Chưa có đèn nào trong bản vẽ để gợi ý nhóm mạch.'
    : `Gợi ý phân nhóm mạch: ${main} đèn downlight/pendant → mạch chiếu sáng CHÍNH; ${accent} đèn ray/tường → mạch PHỤ (accent/trang trí). Chỉ là gợi ý phân nhóm hiển thị, KHÔNG phải bản vẽ đi dây điện thật (không tính công suất/aptomat/tiết diện dây).`;
  return { mainCircuitCount: main, accentCircuitCount: accent, note };
}

/* ═══════════════════════════ D2.1 — outlet placement suggest ═══════════════════════════ */

/** đồ nội thất cố định dùng làm mốc gợi ý ổ cắm — id BlockDef trong lib/cad/furniture.ts. */
const OUTLET_NEAR_FURNITURE = new Set(['nightstand', 'desk', 'officeChair', 'kitchenI', 'kitchenIsland']);

/** ước lệ khoảng cách mép đồ nội thất → ổ cắm — thực hành phổ biến, KHÔNG trích chuẩn cụ thể. */
export const OUTLET_OFFSET_FROM_FURNITURE_MM = 150;

export interface OutletPlacementSuggestion {
  forBlockId: string;
  forBlock: string;
  at: Pt;
  note: string;
}

/**
 * D2.1 — gợi ý vị trí ổ cắm cạnh đồ nội thất đã đặt (tủ đầu giường/bàn làm việc+ghế văn phòng/
 * bếp chữ I/đảo bếp). Vị trí = mép PHẢI (local +x) của bounding box đồ nội thất, cách offset mm
 * — heuristic CHUNG cho mọi loại, KHÔNG phân biệt hướng quay/loại đồ nội thất cụ thể (vd tủ đầu
 * giường quay úp mặt vào tường thì "phải" có thể không phải chỗ tiện đặt ổ cắm nhất) — ghi rõ
 * trong `note`, user tự điều chỉnh theo bố trí thật.
 */
export function suggestOutletPlacements(
  doc: Doc,
  blockMap: Record<string, BlockDef> = BLOCK_MAP,
  offsetMm = OUTLET_OFFSET_FROM_FURNITURE_MM,
): OutletPlacementSuggestion[] {
  const out: OutletPlacementSuggestion[] = [];
  for (const e of doc.entities) {
    if (e.type !== 'block') continue;
    if (!OUTLET_NEAR_FURNITURE.has(e.block)) continue;
    const { w } = effectiveBlockSize(e, blockMap);
    const local: Pt = { x: w / 2 + offsetMm, y: 0 };
    const at = blockToWorld(local, e);
    out.push({
      forBlockId: e.id,
      forBlock: e.block,
      at,
      note: `Gợi ý ổ cắm cạnh "${blockMap[e.block]?.name ?? e.block}" — ước lệ cách mép ${offsetMm}mm, phía bên phải theo hướng đặt hiện tại. Không phân biệt hướng quay thực tế của đồ nội thất — kiểm tra lại theo bố trí thật trước khi thi công.`,
    });
  }
  return out;
}

/* ═══════════════════════════ D2.6 — AC unit position suggest ═══════════════════════════ */

/** ước lệ khoảng cách tối thiểu máy lạnh ↔ đầu giường — thực hành phổ biến (tránh thổi thẳng
 * vào người nằm), KHÔNG trích chuẩn cụ thể. */
export const AC_MIN_DISTANCE_FROM_BED_HEAD_MM = 1800;

export interface AcUnitProximityCheck {
  acEntityId: string;
  bedEntityId: string;
  distanceMm: number;
  tooClose: boolean;
  note: string;
}

/** Điểm "đầu giường" (headboard) world — theo anchor 'wall-back' của bedS/bedD (xem
 * furniture.ts: pt.y dương gần mép gối). Không có anchor (block lạ/tuỳ biến) → fallback cạnh
 * +y của bounding box. */
function bedHeadWorldPt(e: { at: Pt; rot: number; sx: number; sy: number; block: string }, blockMap: Record<string, BlockDef>): Pt {
  const def = blockMap[e.block];
  const anchor = def?.anchors?.find((a) => a.kind === 'wall-back');
  const localY = anchor ? anchor.pt.y : effectiveBlockSize(e, blockMap).h / 2;
  return blockToWorld({ x: 0, y: localY }, e);
}

/**
 * D2.6 — CHỈ gợi ý đơn giản "máy lạnh cách đầu giường ≥ AC_MIN_DISTANCE_FROM_BED_HEAD_MM" bằng
 * khoảng cách Euclid thuần giữa tâm máy lạnh (acUnit) và điểm đầu giường (bedS/bedD) — KHÔNG xét
 * hướng thổi/hướng tường/hướng nhà thật vì model 2D không lưu dữ liệu này (xem brief Sprint 6,
 * giới hạn CỐ Ý — phức tạp hơn cần dữ liệu hướng nhà không có sẵn).
 */
export function checkAcUnitBedProximity(
  doc: Doc,
  blockMap: Record<string, BlockDef> = BLOCK_MAP,
  minDistanceMm = AC_MIN_DISTANCE_FROM_BED_HEAD_MM,
): AcUnitProximityCheck[] {
  const acUnits = doc.entities.filter((e) => e.type === 'block' && e.block === 'acUnit');
  const beds = doc.entities.filter((e) => e.type === 'block' && (e.block === 'bedS' || e.block === 'bedD'));
  const out: AcUnitProximityCheck[] = [];
  for (const ac of acUnits) {
    if (ac.type !== 'block') continue;
    for (const bed of beds) {
      if (bed.type !== 'block') continue;
      const headPt = bedHeadWorldPt(bed, blockMap);
      const d = Math.hypot(headPt.x - ac.at.x, headPt.y - ac.at.y);
      const tooClose = d < minDistanceMm;
      out.push({
        acEntityId: ac.id,
        bedEntityId: bed.id,
        distanceMm: d,
        tooClose,
        note: tooClose
          ? `Máy lạnh cách đầu giường ≈${Math.round(d)}mm < ${minDistanceMm}mm khuyến nghị — có thể thổi thẳng vào người nằm. Ước lệ thực hành phổ biến, KHÔNG trích chuẩn cụ thể, KHÔNG xét hướng thổi/hướng tường ngoài thật (model không lưu hướng nhà).`
          : `Máy lạnh cách đầu giường ≈${Math.round(d)}mm — đạt khoảng cách tối thiểu ${minDistanceMm}mm tham khảo.`,
      });
    }
  }
  return out;
}
