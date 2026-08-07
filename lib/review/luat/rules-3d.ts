/**
 * lib/review/luat/rules-3d.ts — LUẬT ĐO ĐƯỢC cho chặng 3D (p3 VIỆC 2, 07/08). VẪN LÀ LỚP LUẬT:
 * thuần hình học/số học trên Doc, tất định (test [tất định] chạy 10 lần so sánh JSON), 0 AI, 0đ.
 *
 * Ba nhóm theo phiếu — ghi rõ CÁCH DIỄN GIẢI vì dữ liệu thật quyết định đo được gì (N5):
 *
 * (a) "Đèn có khớp bóng đổ không" — viewer IF CỐ Ý không render bóng đổ (`MeshBasicMaterial`,
 *     SPEC-3D-CORE quyết định #3: không đèn/bóng "cho đẹp") ⇒ KHÔNG tồn tại "hướng bóng render"
 *     để so. Thứ đo được tất định hôm nay là ĐÈN ↔ HÌNH HỌC: đèn nằm ngoài mặt bằng · đèn treo
 *     cao hơn khối cao nhất · mặt trời dưới chân trời mà không có đèn phòng nào (cảnh sẽ đen).
 *     Khi nào viewer có bóng thật thì mới so được "đèn ↔ bóng" đúng nghĩa đen — ghi ở báo cáo,
 *     không giả vờ đo thứ chưa có dữ liệu.
 *
 * (b) Độ rọi theo công năng — NỐI DÂY `vn-lighting.ts` (đã có `params.minLux/maxLux`, tự khai
 *     "KHÔNG có logic đo/tính lux nào trong checker.ts") vào phép ước lượng lumen: phòng dò
 *     biên bằng ĐÚNG bộ dò của checker (wallLikeDoc + hatch face — K1, không chép thuật toán),
 *     E ước lượng = Σ(lumens đèn có xy trong phòng) × UF / diện tích(m²). UF=0.4 (hệ số sử dụng
 *     quang thông, thực hành chiếu sáng phổ thông cho phòng ở trần sáng) — GHI RÕ trong nguồn
 *     là ƯỚC LƯỢNG, và mang `chuaKiemChung` theo đúng `verified:false` của bộ rule gốc.
 *
 * (c) Khối hở / mặt không kín — khối 3D của IF đùn từ hình 2D (`docToObjScene`): polyline CÓ
 *     `heightMm` mà KHÔNG khép kín ⇒ lăng trụ hở sườn (mặt không kín, hỏng xuất khối kín/in 3D
 *     về sau). Đo bằng cờ `closed` + so điểm đầu-cuối, thuần Doc.
 */

import type { Doc, Entity, Pt } from '../../cad/model';
import { findRoomLabels, wallLikeDoc } from '../../cad/standards/checker';
import { VN_LIGHTING } from '../../cad/standards/vn-lighting';
import { collectBoundarySegments, buildHatchFaceIndex, pickHatchFace, polygonArea, pointInPolygon } from '../../cad/hatch';
import { buildLightRig } from '../../three/lighting';
import type { FindingLuat } from '../types';

/** Hệ số sử dụng quang thông cho ước lượng độ rọi trung bình (phòng ở, trần/tường màu sáng,
 * đèn trần) — con số THỰC HÀNH phổ thông, không phải trích chuẩn ⇒ mọi finding nhóm (b) đều
 * `chuaKiemChung`. Khai hằng để test tất định trỏ vào cùng một số. */
export const UF_UOC_LUONG = 0.4;

/** Ánh xạ rule vn-lighting ↔ công năng phòng của `classifyRoom` — chỉ 3 công năng bộ luật gốc
 * có số; phòng công năng khác KHÔNG kiểm (thà thiếu còn hơn bịa ngưỡng, K3). */
const LUX_RULE_BY_KIND: Record<string, string> = {
  living: 'vn-lighting-living-room-lux-reference',
  bedroom: 'vn-lighting-bedroom-lux-reference',
  kitchen: 'vn-lighting-kitchen-lux-reference',
};

function bboxOf(doc: Doc): { minX: number; minY: number; maxX: number; maxY: number } | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let seen = false;
  for (const e of doc.entities) {
    const pts = entityPts(e);
    for (const p of pts) {
      seen = true;
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
  }
  return seen ? { minX, minY, maxX, maxY } : null;
}

function entityPts(e: Entity): Pt[] {
  if (e.type === 'line') return [e.a, e.b];
  if (e.type === 'polyline' || e.type === 'hatch') return e.points ?? [];
  if (e.type === 'circle') return [{ x: e.c.x - e.r, y: e.c.y - e.r }, { x: e.c.x + e.r, y: e.c.y + e.r }];
  if (e.type === 'rect') return [{ x: e.x, y: e.y }, { x: e.x + e.w, y: e.y + e.h }];
  return [];
}

function maxKhoiCaoMm(doc: Doc): number {
  let max = 0;
  for (const e of doc.entities) {
    const h = (e as { heightMm?: number }).heightMm;
    if (typeof h === 'number' && h > max) max = h;
  }
  return max;
}

/** (a) Đèn ↔ hình học. */
export function luatDenHinhHoc(doc: Doc): FindingLuat[] {
  const out: FindingLuat[] = [];
  const rig = buildLightRig(doc);
  const box = bboxOf(doc);
  const LE_MM = 500;
  const caoNhat = maxKhoiCaoMm(doc);

  // Cảnh báo dữ liệu hỏng từ chính rig (lumens ≤ 0, levelId mồ côi…) — nguồn có sẵn, chỉ dịch.
  for (const w of rig.warnings) {
    out.push({
      lop: 'luat', muc: 'vang', ruleId: 'r3d-rig-du-lieu', nguon: 'lib/three/lighting.ts buildLightRig() (kiểm dữ liệu tất định)',
      moTa: w,
    });
  }

  for (const light of rig.rooms) {
    const p = light.posCadMm;
    if (box && (p.x < box.minX - LE_MM || p.x > box.maxX + LE_MM || p.y < box.minY - LE_MM || p.y > box.maxY + LE_MM)) {
      out.push({
        lop: 'luat', muc: 'vang', ruleId: 'r3d-den-ngoai-mat-bang',
        nguon: 'Hình học thuần: vị trí đèn so với khung bao mặt bằng (+500mm)',
        moTa: `Đèn ${light.id} nằm ngoài mặt bằng (x ${Math.round(p.x)} · y ${Math.round(p.y)}mm) — sẽ không chiếu vào không gian nào.`,
        viTri: { mm: { x: p.x, y: p.y }, entityId: light.id },
        cachSua: 'Kéo dấu đèn về trong mặt bằng (khung nhìn 3D, tab Đèn).',
      });
    }
    if (caoNhat > 0 && p.z > caoNhat + 300) {
      out.push({
        lop: 'luat', muc: 'vang', ruleId: 'r3d-den-cao-bat-thuong',
        nguon: `Hình học thuần: cao độ đèn so với khối cao nhất (${caoNhat}mm)`,
        moTa: `Đèn ${light.id} treo ở ${Math.round(p.z)}mm — cao hơn khối cao nhất ${caoNhat}mm, lơ lửng ngoài không gian.`,
        viTri: { mm: { x: p.x, y: p.y }, entityId: light.id },
        cachSua: 'Giữ Shift kéo dấu đèn hạ cao độ (quy ước Shift đổi trục của khung nhìn).',
      });
    }
  }

  if (rig.sun.belowHorizon && rig.rooms.length === 0) {
    out.push({
      lop: 'luat', muc: 'vang', ruleId: 'r3d-canh-toi-den',
      nguon: 'Số học thuần: sun.altitudeDeg < 0 và 0 đèn phòng',
      moTa: 'Mặt trời đang dưới chân trời mà cảnh chưa có đèn phòng nào — render giờ này sẽ tối đen.',
      cachSua: 'Thêm đèn phòng (Shift+N) hoặc kéo giờ nắng lên (phím [ / ]).',
    });
  }
  return out;
}

/** (b) Độ rọi ước lượng theo công năng — nối vn-lighting.ts. */
export function luatDoRoi(doc: Doc): FindingLuat[] {
  const out: FindingLuat[] = [];
  const rig = buildLightRig(doc);
  if (rig.rooms.length === 0) return out; // chưa có đèn nào — nhóm (a) đã lo cảnh tối, không lặp
  const segs = collectBoundarySegments(wallLikeDoc(doc));
  if (segs.length === 0) return out;
  const index = buildHatchFaceIndex(segs);

  for (const room of findRoomLabels(doc)) {
    const ruleId = LUX_RULE_BY_KIND[room.kind];
    if (!ruleId) continue;
    const rule = VN_LIGHTING.rules.find((r) => r.id === ruleId);
    if (!rule) continue;
    const poly = pickHatchFace(index, room.at);
    if (!poly) continue; // không dò được biên — bỏ qua, không đoán (nguyên tắc checker giữ nguyên)
    const areaM2 = Math.abs(polygonArea(poly)) / 1e6;
    if (areaM2 < 0.5) continue;
    const lumens = rig.rooms
      .filter((l) => pointInPolygon({ x: l.posCadMm.x, y: l.posCadMm.y }, poly))
      .reduce((s, l) => s + Math.max(0, l.lumens), 0);
    const lux = (lumens * UF_UOC_LUONG) / areaM2;
    const { minLux } = (rule.params ?? {}) as { minLux?: number };
    if (typeof minLux === 'number' && lux < minLux) {
      out.push({
        lop: 'luat', muc: 'vang', ruleId: `r3d-do-roi-${room.kind}`,
        nguon: `${rule.source} · ước lượng E = Σlumens×${UF_UOC_LUONG}/diện tích`,
        moTa: `${room.name}: độ rọi ước lượng ~${Math.round(lux)} lux, dưới mức tham khảo ${minLux} lux cho công năng này (${areaM2.toFixed(1)}m², ${Math.round(lumens)} lm trong phòng).`,
        viTri: { mm: room.at },
        cachSua: 'Thêm đèn phòng (Shift+N, tab Đèn) hoặc tăng quang thông bóng.',
        chuaKiemChung: true, // rule gốc verified:false + UF là số thực hành — không phải căn cứ pháp lý
      });
    }
  }
  return out;
}

/** (c) Khối hở — polyline có heightMm nhưng không khép kín. */
export function luatKhoiHo(doc: Doc): FindingLuat[] {
  const out: FindingLuat[] = [];
  for (const e of doc.entities) {
    if (e.type !== 'polyline') continue;
    const h = (e as { heightMm?: number }).heightMm;
    if (typeof h !== 'number' || h <= 0) continue;
    const pts = e.points ?? [];
    if (pts.length < 3) {
      out.push({
        lop: 'luat', muc: 'vang', ruleId: 'r3d-khoi-ho-thieu-diem',
        nguon: 'Hình học thuần: lăng trụ cần đa giác đáy ≥3 điểm',
        moTa: `Nét ${e.id} có cao độ đùn ${h}mm nhưng chỉ ${pts.length} điểm — không tạo được khối kín.`,
        viTri: pts[0] ? { mm: pts[0], entityId: e.id } : { entityId: e.id },
      });
      continue;
    }
    const dau = pts[0];
    const cuoi = pts[pts.length - 1];
    const khepKin = e.closed === true || (Math.hypot(dau.x - cuoi.x, dau.y - cuoi.y) < 1);
    if (!khepKin) {
      out.push({
        lop: 'luat', muc: 'vang', ruleId: 'r3d-khoi-ho',
        nguon: 'Hình học thuần: đa giác đáy hở (điểm đầu ≠ điểm cuối, không cờ closed)',
        moTa: `Nét ${e.id} đùn cao ${h}mm từ đường HỞ — khối sinh ra không kín mặt, sẽ hỏng khi xuất khối kín/in 3D.`,
        viTri: { mm: dau, entityId: e.id },
        cachSua: 'Khép kín đa giác (nối điểm cuối về điểm đầu) rồi đùn lại.',
      });
    }
  }
  return out;
}

/** Lượt kiểm lớp LUẬT chặng 3D — gộp 3 nhóm, tất định. */
export function luat3d(doc: Doc): FindingLuat[] {
  return [...luatDenHinhHoc(doc), ...luatDoRoi(doc), ...luatKhoiHo(doc)];
}
