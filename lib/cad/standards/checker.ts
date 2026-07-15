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
 * sửa lại nhãn.
 *
 * Giới hạn cũ (phòng có vách đâm chữ T vào tường bao → dò biên trả null, phòng bị BỎ QUA khỏi
 * phép đo) đã được sửa trong hatch.ts: thay quy tắc rẽ-góc-nhỏ-nhất cục bộ bằng DCEL liệt kê
 * mặt toàn cục + khử cạnh trùng hatch/polyline — xem đầu file hatch.ts và test [7]/[8] của
 * hatch.test.ts + checker.test.ts. Nếu dò biên vẫn thất bại vì lý do khác (biên hở thật sự…),
 * checker giữ nguyên nguyên tắc an toàn: bỏ qua phòng đó, không đoán mò.
 */

import type { Doc, Entity, Pt } from '../model';
import { findHatchBoundary, polygonArea } from '../hatch';
import type { StandardRule, Severity } from './registry';
import { BLOCK_MAP } from '../furniture';
import { effectiveBlockSize } from '../shape-interactions';

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

export interface RoomInfo {
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

/** Dò ROOM-SET của bản vẽ: nhãn TEXT toàn-hoa (quy ước tên phòng) + biên phòng đo bằng
 *  findHatchBoundary. Export cho operator-profile (QA D1) tái dùng — hành vi checker KHÔNG đổi. */
export function findRoomLabels(doc: Doc): RoomInfo[] {
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

      // 2026-07-15: nối thêm 3 rule quốc tế/Neufert đo được bằng CHÍNH bề rộng hành lang đã đo
      // ở trên (room.minWidthMm) — cùng dữ liệu hình học, chỉ khác ngưỡng/nguồn trích dẫn. Xem
      // "SỔ TRẠNG THÁI NỐI DÂY" cuối file cho lý do các rule Neufert/NFPA/QCVN06 KHÁC chưa nối.
      const rIntlEgress = byId('intl-egress-corridor-min-width');
      if (rIntlEgress && room.minWidthMm !== null && room.minWidthMm < rIntlEgress.params.minWidthMmGeneral) {
        violations.push(mkViolation(rIntlEgress, `Hành lang "${room.name}": bề rộng đo được ≈${Math.round(room.minWidthMm)}mm < ${rIntlEgress.params.minWidthMmGeneral}mm tối thiểu theo IBC 2021 §1020.2 (đường thoát nạn chung, chưa xét sprinkler/số người).`, room.at));
      }
      const rNeufert1 = byId('neufert-circulation-one-person');
      if (rNeufert1 && room.minWidthMm !== null && room.minWidthMm < rNeufert1.params.minWidthMm) {
        violations.push(mkViolation(rNeufert1, `Hành lang "${room.name}": bề rộng đo được ≈${Math.round(room.minWidthMm)}mm < ${rNeufert1.params.minWidthMm}mm — dưới mức tối thiểu cho 1 người đi qua thoải mái (Neufert/Metric Handbook).`, room.at));
      }
      const rNeufert2 = byId('neufert-circulation-two-persons');
      if (rNeufert2 && room.minWidthMm !== null && room.minWidthMm < rNeufert2.params.minWidthMm) {
        violations.push(mkViolation(rNeufert2, `Hành lang "${room.name}": bề rộng đo được ≈${Math.round(room.minWidthMm)}mm < ${rNeufert2.params.minWidthMm}mm — dưới mức tiện dụng cho 2 người tránh nhau (Neufert/Metric Handbook).`, room.at));
      }

      // 2026-07-15: rule D1.7 accessibility (QCVN 10:2024/BXD) hành lang 2 chiều tránh xe lăn —
      // cùng cơ chế room.minWidthMm đã đo ở trên, chỉ khác ngưỡng/nguồn.
      const rAccessCorridor = byId('vn-access-corridor-two-way-min-width');
      if (rAccessCorridor && room.minWidthMm !== null && room.minWidthMm < rAccessCorridor.params.minWidthMm) {
        violations.push(mkViolation(rAccessCorridor, `Hành lang "${room.name}": bề rộng đo được ≈${Math.round(room.minWidthMm)}mm < ${rAccessCorridor.params.minWidthMm}mm tối thiểu để 2 người/xe lăn tránh nhau (QCVN 10:2024/BXD).`, room.at));
      }
    }
  }

  // D1.7 accessibility — chiều rộng thông thủy cửa (đo được từ BlockEntity vì chiều RỘNG cửa
  // top-view 2D CÓ lưu, khác với chiều CAO không lưu). HEURISTIC theo id block, KHÔNG PHẢI phân
  // loại ngữ nghĩa thật "cửa chính nhà" (app không có concept này tách biệt khỏi cửa phòng):
  // id 'door' → coi là cửa chính (ngưỡng 900mm); các id cửa khác (doorRoom/doorWC/doubleDoor/
  // slidingDoor/glassDoor) → coi là cửa phòng chức năng (ngưỡng 800mm). Bề rộng thật = w danh
  // nghĩa/variant (effectiveBlockSize) nhân |sx| (scale áp dụng khi đặt block, xem blockToWorld).
  const rDoorMain = byId('vn-access-door-main-min-width');
  const rDoorRoom = byId('vn-access-door-functional-room-min-width');
  if (rDoorMain || rDoorRoom) {
    for (const e of doc.entities) {
      if (e.type !== 'block') continue;
      const def = BLOCK_MAP[e.block];
      if (!def) continue;
      const isDoor = ['door', 'doorRoom', 'doorWC', 'doubleDoor', 'slidingDoor', 'glassDoor'].includes(e.block);
      if (!isDoor) continue;
      const { w } = effectiveBlockSize(e, BLOCK_MAP);
      const realWidthMm = w * Math.abs(e.sx || 1);
      if (e.block === 'door') {
        if (rDoorMain && realWidthMm < rDoorMain.params.minWidthMm) {
          violations.push(mkViolation(rDoorMain, `Cửa chính (block "${e.block}"): bề rộng ≈${Math.round(realWidthMm)}mm < ${rDoorMain.params.minWidthMm}mm tối thiểu (QCVN 10:2024/BXD).`, e.at));
        }
      } else if (rDoorRoom && realWidthMm < rDoorRoom.params.minWidthMm) {
        violations.push(mkViolation(rDoorRoom, `Cửa phòng chức năng (block "${e.block}"): bề rộng ≈${Math.round(realWidthMm)}mm < ${rDoorRoom.params.minWidthMm}mm tối thiểu (QCVN 10:2024/BXD).`, e.at));
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

/**
 * SỔ TRẠNG THÁI NỐI DÂY (2026-07-15) — rule nào đã áp dụng thật trong checkStandards():
 *
 * ĐÃ NỐI (sinh violation thật khi đo hình học vi phạm):
 *   vn-res-bedroom-min-area, vn-res-wc-min-area, vn-res-kitchen-dining-min-area,
 *   vn-res-living-min-area, vn-fire-corridor-min-width-general, iso128-thick-thin-ratio,
 *   intl-egress-corridor-min-width, neufert-circulation-one-person,
 *   neufert-circulation-two-persons.
 *   (3 rule trên nối 2026-07-15 sáng — dùng lại CHÍNH bề rộng hành lang room.minWidthMm đã đo
 *   cho vn-fire-corridor-min-width-general, chỉ khác ngưỡng/nguồn: IBC 1118mm, Neufert 1
 *   người 750mm, Neufert 2 người 1400mm.)
 *   vn-access-corridor-two-way-min-width (2026-07-15 chiều — D1.7 accessibility, cùng cơ chế
 *   room.minWidthMm, ngưỡng 1500mm QCVN 10:2024/BXD).
 *   vn-access-door-main-min-width, vn-access-door-functional-room-min-width (2026-07-15 chiều —
 *   D1.7 accessibility, đo THẬT bằng cách lặp doc.entities lọc type==='block', tra BLOCK_MAP lấy
 *   effectiveBlockSize (đọc đúng variant) × |sx|, phân loại cửa chính/cửa phòng theo HEURISTIC id
 *   block 'door' vs {doorRoom,doorWC,doubleDoor,slidingDoor,glassDoor} — KHÔNG phải phân loại
 *   ngữ nghĩa thật vì app không có concept "cửa chính nhà" tách biệt).
 *
 * CHƯA NỐI — registry-only, không có logic đo (D1.7 + nhóm chiếu sáng tham khảo mới):
 *   - vn-access-door-clear-space (không gian trống 1400×1400 trước/sau cửa): field `clearance`
 *     hiện có của BlockDef cửa (lib/cad/furniture.ts) là "vùng quét cánh cửa mở" (door swing
 *     arc) — KHÁC Ý NGHĨA với "khoảng trống thao tác xe lăn 1400×1400" dù cùng nằm trước cửa.
 *     Ép dùng chung sẽ báo sai; cần khái niệm "wheelchair maneuvering clearance" riêng nếu muốn
 *     đo tự động — chưa làm trong lần nối dây này.
 *   - vn-lighting-living-room-lux-reference: CHỦ Ý KHÔNG nối — đây là dữ liệu tĩnh tham khảo
 *     (severity 'info', binding 'advisory'), không có cách đo lux từ model 2D (không phải
 *     calculator), chỉ để tra cứu/hiển thị sau này khi nhóm E (MEP) được build.
 *
 * CHƯA NỐI (lý do — thiếu dữ liệu hình học mà model 2D hiện tại không lưu):
 *   - vn-fire-exit-clear-width-min / vn-fire-exit-clear-height-min: BlockEntity cửa (2D
 *     top-view) không lưu chiều cao cửa; chiều rộng có nhưng chưa nối vì cần phân biệt cửa
 *     thoát nạn khỏi cửa nội bộ — chưa có field đánh dấu "cửa thoát nạn" trong model.
 *   - vn-fire-min-exits-count / intl-egress-min-exits-count: cần occupant load (số người) —
 *     không có cách tính đáng tin từ diện tích phòng đơn thuần, cố tình không đoán mò.
 *   - vn-fire-corridor-min-width-f1-over15: ngưỡng phụ thuộc PHÂN LOẠI công trình (nhóm F1,
 *     >15 tầng) — model không lưu số tầng/nhóm nhà.
 *   - vn-fire-stair-min-width: verified=false CỐ Ý (tác giả rule không thống nhất được trị số
 *     giữa các nguồn) — KHÔNG được tự chọn 1 số rồi implement.
 *   - vn-fire-travel-distance-appendix-g / intl-egress-travel-distance /
 *     intl-egress-common-path-limit: cần mô phỏng đồ thị đường đi thoát nạn (travel distance) —
 *     không có trong model, không phải phép đo hình học đơn giản.
 *   - vn-fire-exit-door-double-leaf-rule: rule định tính, không có trị số mm; BlockEntity cửa
 *     hiện chỉ mô hình 1 cánh.
 *   - intl-egress-door-min-clear-width / intl-egress-max-door-width /
 *     intl-egress-door-swing-encroachment: cần chiều rộng thông thủy thực đo của cửa (không
 *     phải kích thước danh nghĩa BlockEntity) + hướng mở cánh — chưa có trong model.
 *   - intl-egress-width-capacity-factor: cần occupant load, giống nhóm exits-count ở trên.
 *   - intl-egress-min-ceiling-height: model 2D không lưu cao độ trần (không có trục Z).
 *   - neufert-kitchen-working-aisle / neufert-kitchen-worktop-height /
 *     neufert-clearance-front-of-storage / neufert-dining-space-per-person: CẦN liên kết vị
 *     trí/clearance-zone của từng BlockEntity nội thất (tủ bếp, tủ quần áo, bàn ăn) với "khoảng
 *     lưu thông" Neufert — đây là tính năng MỚI (liên kết clearance-zone Sprint 3 ↔ rule
 *     Neufert), không phải nối dây đơn thuần. Xem AUDIT-2026-07-15.md mục D — KHÔNG tự ý làm
 *     trong lần nối dây này, cần quyết định phạm vi riêng.
 *   - neufert-interior-door-clear-width: verified=false CỐ Ý (nguồn không thống nhất 1 trị số) —
 *     giữ nguyên trạng thái chưa đo được, không tự chọn số.
 *   - neufert-ceiling-height-habitable: nay ĐÃ CÓ số liệu VN cụ thể (QCVN 04:2021/BXD: phòng ở
 *     ≥2.6m, bếp/vệ sinh ≥2.3m, cập nhật 2026-07-15 chiều) nhưng VẪN chưa đo được — lý do khác
 *     với trước: không phải "chưa có số liệu VN" nữa, mà là model 2D không lưu trục Z/cao độ
 *     trần nên không có cách đo hình học nào cho rule này dù có số liệu.
 */
