/**
 * lib/cad/standards/fix-suggest.ts — Sprint 8, VIỆC 3 (D2.3): gợi ý sửa CỤ THỂ (text kèm khoảng
 * dịch chuyển ước tính, mm) cho từng Violation ĐÃ ĐO ĐƯỢC hình học thật trong checker.ts.
 *
 * NGUYÊN TẮC (cùng "hiến pháp" checker.ts/room-autolabel.ts/mep-suggest.ts): `suggestFix()` CHỈ
 * ĐỌC `doc` + 1 Violation đã có sẵn (từ checkStandards()) và TRẢ VỀ 1 dòng text — KHÔNG BAO GIỜ
 * tự move/stretch tường/entity nào. UI (CadEditor.tsx, panel "Kiểm chuẩn") CHỈ HIỂN THỊ text này
 * cạnh mỗi violation; user tự làm MOVE/STRETCH nếu đồng ý với gợi ý.
 *
 * Phạm vi (chỉ 2 nhóm violation ĐÃ có phép đo hình học thật, đủ dữ liệu để tính 1 con số mm cụ
 * thể — các loại khác trả về `null`, KHÔNG ép viết gợi ý mơ hồ, xem cuối file):
 *
 *  1) Diện tích phòng thiếu (4 rule vn-residential.ts: bedroom/wc/kitchen/living min-area).
 *     deficitM2 = minAreaM2 (registry) − areaM2 (đo lại bằng findHatchBoundary tại đúng
 *     `violation.at`, TÁI DÙNG thuật toán dò biên của checker.ts/hatch.ts). Dựng lại bounding
 *     box (w×h) của phòng → GIỮ NGUYÊN cạnh dài hơn, gợi ý kéo cạnh NGẮN hơn ra thêm:
 *       shiftMm = (deficitM2 × 1e6) / cạnh_dài_giữ_nguyên
 *     (giữ cạnh dài cố định cho ra shift nhỏ hơn so với giữ cạnh ngắn — 1 gợi ý khả thi, KHÔNG
 *     phải giải pháp hình học tối ưu duy nhất; áp dụng cho phòng gần-chữ-nhật, phòng hình dạng
 *     phức tạp hơn thì bbox chỉ là xấp xỉ, user tự cân nhắc).
 *
 *  2) Hành lang hẹp (5 rule nguồn khác nhau đều dùng CHUNG room.minWidthMm đã đo — xem checker.ts
 *     nhánh 'corridor'): deficitMm = minWidthMm (registry, tên field khác nhau theo rule) −
 *     minWidthMm (đo được) → gợi ý dồn hết 1 bên (deficitMm) hoặc chia đều 2 bên (deficitMm/2).
 *
 * Loại KHÔNG có gợi ý cụ thể (trả `null`): occupant-load (info-only, không phải lỗi hình học cần
 * "sửa"), door width (thiếu → cần đổi block cửa khác, không phải "kéo tường"), outlet density
 * (thiếu ổ cắm → đã có nút "Đặt" riêng ở MEP panel, không phải dịch chuyển tường), ISO lineweight
 * ratio (không gắn 1 vị trí hình học cụ thể).
 */

import type { Doc, Pt } from '../model';
import { findHatchBoundary, polygonArea } from '../hatch';
import { getAllRules } from './registry';
import { findRoomLabels, type Violation, type RoomInfo } from './checker';

/* ───────────────────────── helper (nhân bản cục bộ, cùng lý do room-autolabel.ts/mep-suggest.ts
   đã làm: tránh export thêm nội bộ khỏi checker.ts ngoài phạm vi Sprint 8 này) ───────────────────────── */

function wallLikeDoc(doc: Doc): Doc {
  const axisLayerIds = new Set(doc.layers.filter((l) => l.name === 'Trục' || l.id === 'l-axis').map((l) => l.id));
  return {
    layers: doc.layers,
    entities: doc.entities.filter((e) => e.type !== 'dim' && e.type !== 'text' && !axisLayerIds.has(e.layer)),
  };
}

function bboxOf(poly: Pt[]): { w: number; h: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of poly) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { w: maxX - minX, h: maxY - minY };
}

const AT_EPS = 1e-6;

/** Tìm lại RoomInfo (đo MỚI, không cache) khớp đúng vị trí `at` của 1 violation — cùng cơ chế
 * findRoomLabels() đã dùng bởi checker.ts để sinh violation này, nên (x,y) khớp chính xác. */
function findRoomAt(doc: Doc, at: Pt): RoomInfo | null {
  const rooms = findRoomLabels(doc);
  return rooms.find((r) => Math.abs(r.at.x - at.x) < AT_EPS && Math.abs(r.at.y - at.y) < AT_EPS) ?? null;
}

/* ───────────────────────── nhóm 1 — diện tích phòng thiếu ───────────────────────── */

const AREA_RULE_IDS = new Set([
  'vn-res-bedroom-min-area',
  'vn-res-wc-min-area',
  'vn-res-kitchen-dining-min-area',
  'vn-res-living-min-area',
]);

function suggestAreaFix(violation: Violation, doc: Doc): string | null {
  if (!violation.at) return null;
  const rule = getAllRules().find((r) => r.id === violation.ruleId);
  const minAreaM2 = rule?.params.minAreaM2;
  if (typeof minAreaM2 !== 'number') return null;

  const room = findRoomAt(doc, violation.at);
  if (!room || room.areaM2 === null) return null;
  const deficitM2 = minAreaM2 - room.areaM2;
  if (!(deficitM2 > 0)) return null; // đã đạt (hoặc dữ liệu lệch) — không có gì để gợi ý

  const poly = findHatchBoundary(wallLikeDoc(doc), violation.at);
  if (!poly || poly.length < 3) return null;
  const { w, h } = bboxOf(poly);
  if (!(w > 0) || !(h > 0)) return null;

  const deficitMm2 = deficitM2 * 1e6;
  const wIsLonger = w >= h;
  const longSide = wIsLonger ? w : h;
  const shortSide = wIsLonger ? h : w;
  const shiftMm = deficitMm2 / longSide;
  const axisLabel = wIsLonger ? 'trục Y (cạnh ngắn hơn)' : 'trục X (cạnh ngắn hơn)';

  return (
    `Thiếu ${deficitM2.toFixed(1)}m² so với ${minAreaM2}m² tối thiểu (đo được ${room.areaM2.toFixed(1)}m²) — ` +
    `gợi ý kéo tường theo ${axisLabel}, hiện ~${Math.round(shortSide)}mm, ra thêm ~${Math.round(shiftMm)}mm ` +
    `(giữ nguyên cạnh còn lại ~${Math.round(longSide)}mm).`
  );
}

/* ───────────────────────── nhóm 2 — hành lang hẹp ───────────────────────── */

/** ruleId → tên field chứa trị số minWidthMm trong params (khác nhau giữa các rule nguồn). */
const CORRIDOR_WIDTH_PARAM_KEY: Record<string, string> = {
  'vn-fire-corridor-min-width-general': 'minWidthMm',
  'intl-egress-corridor-min-width': 'minWidthMmGeneral',
  'neufert-circulation-one-person': 'minWidthMm',
  'neufert-circulation-two-persons': 'minWidthMm',
  'vn-access-corridor-two-way-min-width': 'minWidthMm',
};

function suggestCorridorFix(violation: Violation, doc: Doc): string | null {
  if (!violation.at) return null;
  const paramKey = CORRIDOR_WIDTH_PARAM_KEY[violation.ruleId];
  if (!paramKey) return null;
  const rule = getAllRules().find((r) => r.id === violation.ruleId);
  const minWidthMm = rule?.params[paramKey];
  if (typeof minWidthMm !== 'number') return null;

  const room = findRoomAt(doc, violation.at);
  if (!room || room.minWidthMm === null) return null;
  const deficitMm = minWidthMm - room.minWidthMm;
  if (!(deficitMm > 0)) return null;

  const half = deficitMm / 2;
  return (
    `Hành lang hẹp hơn ${Math.round(deficitMm)}mm so với ${minWidthMm}mm tối thiểu (đo được ≈${Math.round(room.minWidthMm)}mm) — ` +
    `gợi ý kéo 1 trong 2 vách ra thêm ~${Math.round(deficitMm)}mm (dồn hết 1 bên), hoặc ~${Math.round(half)}mm mỗi bên (chia đều 2 bên).`
  );
}

/* ───────────────────────── entry point ───────────────────────── */

/**
 * Sinh gợi ý sửa CỤ THỂ cho 1 violation (từ checkStandards()) — CHỈ ĐỌC, không tự sửa doc. Trả
 * `null` nếu loại vi phạm này KHÔNG có cách tính gợi ý cụ thể (xem "Loại KHÔNG có gợi ý" ở đầu
 * file) — không ép viết gợi ý mơ hồ cho mọi loại.
 */
export function suggestFix(violation: Violation, doc: Doc): string | null {
  if (!violation.at) return null;
  if (AREA_RULE_IDS.has(violation.ruleId)) return suggestAreaFix(violation, doc);
  if (violation.ruleId in CORRIDOR_WIDTH_PARAM_KEY) return suggestCorridorFix(violation, doc);
  return null;
}
