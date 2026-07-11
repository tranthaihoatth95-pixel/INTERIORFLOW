/**
 * lib/cad/standards/checker.ts — RULE ENGINE: đo hình học thật từ `doc` rồi đối chiếu với
 * StandardRule (registry.ts) → danh sách Violation cho panel "Kiểm chuẩn".
 *
 * NGUYÊN TẮC (điều khoản hiến pháp của hệ sinh thái): hàm ở đây CHỈ ĐỌC doc và TRẢ VỀ đề xuất
 * — KHÔNG BAO GIỜ tự sửa entity/tường/nhãn. Toàn bộ hành động sửa (nếu user đồng ý) phải do
 * user tự làm bằng các lệnh CAD thường (MOVE/STRETCH/…), không có nút "tự sửa" nào ở đây.
 *
 * Đo diện tích/bề rộng phòng: TÁI DÙNG thuật toán dò biên của HATCH (lib/cad/hatch.ts,
 * findHatchBoundary) — nhãn tên phòng (TEXT, quy ước app: đặt BÊN TRONG phòng, xem
 * demo-plan.ts/commands.ts roomRect) làm pick-point để dò ra đúng đa giác phòng, rồi đo diện
 * tích + bề rộng nhỏ nhất (polygonMinWidth — xấp xỉ "rotating calipers" bằng cách chiếu lên
 * pháp tuyến từng cạnh, đủ tốt cho phòng hình chữ nhật/gần chữ nhật). Cách này CHÍNH XÁC HƠN
 * so với đọc text diện tích có sẵn (VD "12.2 m²") vì không bị lệch nếu user sửa tường mà quên
 * sửa lại nhãn — NHƯNG có 1 giới hạn THẬT đã phát hiện khi kiểm bằng mặt bằng demo thực tế
 * (xem GIỚI HẠN ĐÃ BIẾT bên dưới).
 *
 * ─────────────────────────── GIỚI HẠN ĐÃ BIẾT (đã kiểm chứng, không phải suy đoán) ───────────
 * `findHatchBoundary` dò biên đáng tin cậy cho 1 phòng ĐƠN, khép kín bằng 1 wallChain KHÔNG có
 * vách khác đâm vào giữa tường bao (test hatch.test.ts + phòng NGỦ/WC trong demo-plan.ts đo
 * đúng, đã xác minh bằng tay). NHƯNG với phòng có tường bao bị 1 vách ngăn khác ĐÂM VÀO tạo chữ
 * T (rất phổ biến trong mặt bằng nhiều phòng — VD Phòng khách kề vách dọc 5400, Bếp kề vách tại
 * góc cửa) — do wallChain vẽ mỗi đoạn tường là 1 quad ĐỘC LẬP không vát góc (miter), các quad
 * chồng lấn nhau tại góc/chữ T tạo ra các "khe hở" hình học nhỏ (~ bằng bề dày tường). Thuật
 * toán half-edge face-traversal (traceFace) đôi khi bắt vào khe hở nhỏ đó thay vì đường bao
 * phòng thật — ĐÃ TÁI HIỆN bằng debug thủ công (thử nhiều điểm bắt đầu + tia bắn lên/xuống,
 * cả 2 chiều xoay cw/ccw, không thành công cho phòng "PHÒNG KHÁCH + ĂN"/"BẾP" của demo-plan.ts
 * dù phòng "NGỦ"/"WC" cùng file lại đo ĐÚNG — khác biệt do vị trí nhãn/tường liên quan tới góc
 * chữ T thế nào). Checker XỬ LÝ AN TOÀN: nếu dò biên thất bại (trả null) → BỎ QUA phòng đó,
 * không tạo violation sai (đúng nguyên tắc "không đoán mò"), nhưng nghĩa là MỘT SỐ VI PHẠM THẬT
 * CÓ THỂ BỊ BỎ SÓT (false negative) ở phòng có hình học phức tạp. Cần 1 thuật toán face-finding
 * chắc hơn (VD dùng half-edge DCEL đúng chuẩn + loại bỏ cạnh trùng lặp từ hatch+polyline chồng
 * nhau, hoặc sửa wallChain vát góc thay vì quad độc lập) — để dành cho bản nâng cấp sau, KHÔNG
 * sửa vội trong phạm vi thời gian hiện tại vì rủi ro phá vỡ Nấc 4 (HATCH) đã hoạt động đúng cho
 * trường hợp phổ biến (phòng đơn).
 * ──────────────────────────────────────────────────────────────────────────────────────────────
 */

import type { Doc, Entity, Pt } from '../model';
import { findHatchBoundary, polygonArea } from '../hatch';
import type { StandardRule, Severity } from './registry';

export interface Violation {
  ruleId: string;
  source: string;
  severity: Severity;
  category: string;
  message: string;
  verified: boolean;
  /** Vị trí để click-zoom tới (world mm) — undefined nếu không gắn được với 1 vị trí cụ thể. */
  at?: Pt;
}

/** Xấp xỉ bề rộng NHỎ NHẤT của 1 đa giác (chiếu lên pháp tuyến từng cạnh, lấy nhỏ nhất) — đủ
 * tốt cho phòng/hành lang hình chữ nhật hoặc gần chữ nhật (không phải giải rotating-calipers
 * đầy đủ cho đa giác lồi bất kỳ). */
function polygonMinWidth(poly: Pt[]): number {
  let minW = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    if (len < 1e-6) continue; // cạnh suy biến (VD điểm đóng vòng trùng điểm đầu) — bỏ qua
    const nx = -dy / len;
    const ny = dx / len;
    let minP = Infinity;
    let maxP = -Infinity;
    for (const p of poly) {
      const proj = p.x * nx + p.y * ny;
      minP = Math.min(minP, proj);
      maxP = Math.max(maxP, proj);
    }
    minW = Math.min(minW, maxP - minP);
  }
  return minW === Infinity ? 0 : minW;
}

interface RoomInfo {
  name: string;
  at: Pt;
  areaM2: number | null;
  minWidthMm: number | null;
}

// TOÀN chữ hoa Unicode (khớp cả chữ Việt có dấu hoa)/số/khoảng trắng/dấu chấm/dấu cộng — lọc
// nhãn TÊN PHÒNG ra khỏi các TEXT khác (tiêu đề, chú thích có chữ thường, số đo "12.2 m²"…).
const ROOM_NAME_RE = /^[\p{Lu}0-9\s.+]+$/u;

/**
 * Doc chỉ giữ hình học "tường thật" cho mục đích dò biên phòng — loại bỏ 2 nguồn nhiễu:
 *  (1) entity 'dim' (đường kích thước dùng chung code segment với line trong hatch.ts nên
 *      VÔ TÌNH bị coi là biên nếu không lọc — 1 chuỗi kích thước chạy dọc mặt ngoài nhà có
 *      thể cắt ngang phòng và cho ra diện tích sai).
 *  (2) layer lưới trục ('Trục'/'l-axis', xem model.ts DEFAULT_LAYERS + commands.ts axesGrid) —
 *      các đường lưới kiến trúc là THAM CHIẾU, không phải tường, nhưng vẫn là entity 'line' nên
 *      cũng vô tình cắt ngang phòng nếu không loại riêng theo layer.
 * lib/cad/hatch.ts (dùng cho lệnh H) KHÔNG lọc như vầy — cố tình generic để user tự quyết định
 * hatch theo bất kỳ hình học nào họ chọn; bộ lọc này CHỈ áp dụng cho phép đo tự động của
 * checker, không đụng hành vi hatch.ts.
 */
function wallLikeDoc(doc: Doc): Doc {
  const axisLayerIds = new Set(doc.layers.filter((l) => l.name === 'Trục' || l.id === 'l-axis').map((l) => l.id));
  return {
    layers: doc.layers,
    entities: doc.entities.filter((e) => e.type !== 'dim' && e.type !== 'text' && !axisLayerIds.has(e.layer)),
  };
}

function findRoomLabels(doc: Doc): RoomInfo[] {
  const texts = doc.entities.filter((e): e is Extract<Entity, { type: 'text' }> => e.type === 'text');
  const boundaryDoc = wallLikeDoc(doc);
  const rooms: RoomInfo[] = [];
  for (const t of texts) {
    const s = t.text.trim();
    if (s.length < 2) continue; // loại số bong bóng trục "1".."9"/"A".."Z" đơn ký tự
    if (/M2|M²/i.test(s)) continue; // loại text diện tích "12.2 m²"
    if (!ROOM_NAME_RE.test(s)) continue;
    const poly = findHatchBoundary(boundaryDoc, t.at);
    rooms.push({
      name: s,
      at: t.at,
      areaM2: poly ? polygonArea(poly) / 1e6 : null,
      minWidthMm: poly ? polygonMinWidth(poly) : null,
    });
  }
  return rooms;
}

type RoomKind = 'bedroom' | 'wc' | 'kitchen' | 'living' | 'corridor' | 'other';

function classifyRoom(name: string): RoomKind {
  const s = name.toUpperCase();
  if (s.includes('NGỦ')) return 'bedroom';
  if (s.includes('WC') || s.includes('VỆ SINH') || /\bVS\b/.test(s)) return 'wc';
  if (s.includes('BẾP')) return 'kitchen';
  if (s.includes('KHÁCH')) return 'living';
  if (s.includes('HÀNH LANG') || s.includes('H.LANG') || s.includes('LANG')) return 'corridor';
  return 'other';
}

function mkViolation(r: StandardRule, message: string, at?: Pt): Violation {
  return { ruleId: r.id, source: r.source, severity: r.severity, category: r.category, message, verified: r.verified, at };
}

/** Chạy toàn bộ rule đo được trên `doc`. Rule không có cách đo tự động (chưa đủ dữ liệu hình
 * học, VD chiều cao cửa) thì KHÔNG sinh violation — không đoán mò, không báo sai. */
export function checkStandards(doc: Doc, rules: StandardRule[]): Violation[] {
  const violations: Violation[] = [];
  const byId = (id: string) => rules.find((r) => r.id === id);
  const rooms = findRoomLabels(doc);

  for (const room of rooms) {
    if (room.areaM2 === null) continue; // không dò được biên kín — bỏ qua, không đoán mò
    const kind = classifyRoom(room.name);

    if (kind === 'bedroom') {
      const r = byId('vn-res-bedroom-min-area');
      if (r && room.areaM2 < r.params.minAreaM2) {
        violations.push(mkViolation(r, `Phòng ngủ "${room.name}": diện tích ${room.areaM2.toFixed(1)}m² < ${r.params.minAreaM2}m² tối thiểu.`, room.at));
      }
    } else if (kind === 'wc') {
      const r = byId('vn-res-wc-min-area');
      if (r && room.areaM2 < r.params.minAreaM2) {
        violations.push(mkViolation(r, `WC "${room.name}": diện tích ${room.areaM2.toFixed(1)}m² < ${r.params.minAreaM2}m² khuyến nghị.`, room.at));
      }
    } else if (kind === 'kitchen') {
      const r = byId('vn-res-kitchen-dining-min-area');
      if (r && room.areaM2 < r.params.minAreaM2) {
        violations.push(mkViolation(r, `Bếp "${room.name}": diện tích ${room.areaM2.toFixed(1)}m² < ${r.params.minAreaM2}m² khuyến nghị (lưu ý: nếu bếp+ăn tách biệt, đây chỉ là diện tích riêng bếp — quy chuẩn gốc tính GỘP bếp+ăn).`, room.at));
      }
    } else if (kind === 'living') {
      const r = byId('vn-res-living-min-area');
      if (r && room.areaM2 < r.params.minAreaM2) {
        violations.push(mkViolation(r, `Phòng khách "${room.name}": diện tích ${room.areaM2.toFixed(1)}m² < ${r.params.minAreaM2}m² tham khảo (số liệu kinh nghiệm, chưa trích dẫn được điều khoản TCVN cụ thể).`, room.at));
      }
    } else if (kind === 'corridor') {
      const r = byId('vn-fire-corridor-min-width-general');
      if (r && room.minWidthMm !== null && room.minWidthMm < r.params.minWidthMm) {
        violations.push(mkViolation(r, `Hành lang "${room.name}": bề rộng đo được ≈${Math.round(room.minWidthMm)}mm < ${r.params.minWidthMm}mm tối thiểu.`, room.at));
      }
    }
  }

  // ISO 128 — tỉ lệ nét đậm/mảnh giữa các layer đang dùng.
  const rLw = byId('iso128-thick-thin-ratio');
  if (rLw) {
    const weights = doc.layers.map((l) => l.lineweight ?? 0.25).filter((w) => w > 0);
    if (weights.length >= 2) {
      const ratio = Math.max(...weights) / Math.min(...weights);
      if (ratio < rLw.params.minRatio) {
        violations.push(mkViolation(rLw, `Tỉ lệ nét đậm/mảnh hiện tại ≈${ratio.toFixed(1)}:1 < ${rLw.params.minRatio}:1 khuyến nghị (nét các layer quá đồng đều, khó phân biệt tường/kích thước khi in).`));
      }
    }
  }

  return violations;
}
