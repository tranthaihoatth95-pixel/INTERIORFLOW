/**
 * lib/boq/compute.ts — BOQ ENGINE (02/08): quét `Doc` → gộp vùng tô theo vật liệu → thành tiền.
 * THUẦN (không React/DOM/Prisma) — test bằng sucrase-node như `lib/cad/schedule.ts`.
 *
 * Dùng lại hình học có sẵn (`polygonArea` — `lib/cad/hatch.ts`), KHÔNG tự viết engine hình học
 * mới (đúng chỉ đạo gốc). Xem `lib/boq/model.ts` đầu file để biết phạm vi v1 đã khoá.
 */

import type { Doc, HatchEntity, Pt } from '../cad/model';
import { polygonArea, pointInPolygon } from '../cad/hatch';
import type { BoqError, BoqResult, BoqRow, MaterialSpecLite } from './model';

const MM2_PER_M2 = 1_000_000;

/** Làm tròn m² về 2 chữ số thập phân — đủ độ chính xác cho báo giá, tránh số lẻ dài vô nghĩa
 * khi hiện lên bảng/XLSX. Tổng `totalAmount` cộng từ `thanhTien` ĐÃ làm tròn của từng dòng (không
 * cộng số chưa làm tròn rồi mới làm tròn tổng) — nhất quán với việc Hoà mở bảng ra cộng tay từng
 * dòng phải ra đúng con số tổng hiển thị. */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Thành tiền làm tròn về đồng (VND không có đơn vị nhỏ hơn 1đ trong thực tế báo giá). */
function roundVnd(n: number): number {
  return Math.round(n);
}

/** Tâm hình học ĐƠN GIẢN (trung bình cộng toạ độ đỉnh) — KHÔNG phải centroid diện-tích-trọng-số
 * chuẩn, nhưng đủ chính xác cho đa giác lồi/gần-lồi (quad phòng do CAD sinh ra) — dùng làm điểm
 * đại diện cho phép kiểm chồng lấn bên dưới, không cần chính xác tuyệt đối. */
function polygonCentroid(poly: Pt[]): Pt {
  let sx = 0;
  let sy = 0;
  for (const p of poly) {
    sx += p.x;
    sy += p.y;
  }
  return { x: sx / poly.length, y: sy / poly.length };
}

/**
 * BOQ v2 (Việc 3a, 02/08) — 2 vùng tô có "chồng lấn thật" không? Heuristic: TÂM đa giác này nằm
 * TRONG đa giác kia (hoặc ngược lại), dùng lại `pointInPolygon` có sẵn ở `lib/cad/hatch.ts`
 * (KHÔNG viết engine giao đa giác mới — hatch.ts/geometry.ts chưa có hàm cắt/giao đa giác thật,
 * viết mới là việc lớn ngoài phạm vi "logic thuần" của đợt này).
 *
 * Vì sao dùng TÂM chứ không dùng ĐỈNH: 2 phòng chỉ CHUNG 1 CẠNH TƯỜNG (ca thực tế phổ biến nhất
 * — 2 vùng tô liền kề, mép trùng toạ độ) có đỉnh nằm ĐÚNG TRÊN biên của nhau — kiểm tra "đỉnh
 * nằm trong đa giác kia" sẽ báo nhầm chồng lấn (false positive) ở MỌI cặp phòng liền kề, hỏng
 * nhiều hơn sửa. Tâm 2 đa giác chỉ liền kề (không chồng lấn diện tích) không bao giờ rơi vào
 * nhau — test [7b] `compute.test.ts` khoá đúng hành vi "liền kề không báo nhầm" này.
 *
 * GIỚI HẠN đã biết (ghi rõ, không giấu): bắt đúng ca "đè hẳn lên nhau" (lỗi vẽ nhầm thường gặp
 * nhất — copy/paste sai chỗ, vẽ lại đè lên vùng cũ). KHÔNG bắt được ca chồng lấn kiểu "cắt chéo
 * góc" mà CẢ HAI tâm đều nằm ngoài nhau (2 hình chữ nhật chỉ đè 1 góc nhỏ) — cần polygon
 * intersection thật để bắt đủ mọi kiểu, ngoài phạm vi lần này (xem BAO-CAO-PHU.md).
 */
function overlaps(a: HatchEntity, b: HatchEntity): boolean {
  const ca = polygonCentroid(a.points);
  const cb = polygonCentroid(b.points);
  return pointInPolygon(ca, b.points) || pointInPolygon(cb, a.points);
}

/** Mọi cặp (i,j) chồng lấn trong 1 nhóm cùng specId — O(n²), đủ nhanh cho số vùng tô/vật liệu
 * thực tế của 1 dự án (hàng chục, không phải hàng nghìn). */
function findOverlappingPairs(group: HatchEntity[]): [HatchEntity, HatchEntity][] {
  const pairs: [HatchEntity, HatchEntity][] = [];
  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      if (overlaps(group[i], group[j])) pairs.push([group[i], group[j]]);
    }
  }
  return pairs;
}

/**
 * computeBoq — hàm lõi. `specs` do caller tự tra (vd qua `GET /api/specs?kind=material`) và
 * truyền vào, KHÔNG fetch bên trong (giữ THUẦN).
 *
 * Luật lỗi (không tính bừa):
 *  - `HatchEntity` không có `specId` (hoặc chuỗi rỗng) → gộp chung 1 `BoqError`
 *    reason='missing-specId', KHÔNG vào rows/totalAmount.
 *  - có `specId` nhưng không khớp spec nào trong `specs[]` → 1 `BoqError` reason='spec-not-found'
 *    mỗi specId lạ (gộp theo specId, không phải theo từng entity — nhiều vùng cùng 1 specId lạ
 *    ra CHUNG 1 lỗi liệt kê đủ entityIds).
 *  - spec khớp nhưng `priceVnd === null` ("chưa có giá", đúng ngữ nghĩa Prisma schema) → 1
 *    `BoqError` reason='missing-priceVnd' mỗi specId.
 */
export function computeBoq(doc: Doc, specs: MaterialSpecLite[]): BoqResult {
  const specById = new Map(specs.map((s) => [s.id, s]));

  const hatches = doc.entities.filter((e): e is HatchEntity => e.type === 'hatch');

  const missingSpecIdIds: string[] = [];
  /** group theo specId — Map giữ thứ tự gặp lần đầu, để rows/errors ra ổn định (không phụ thuộc
   * thứ tự duyệt Map nội bộ khác implementation). */
  const bySpecId = new Map<string, HatchEntity[]>();

  for (const h of hatches) {
    const specId = h.specId && h.specId.trim() ? h.specId : undefined;
    if (!specId) {
      missingSpecIdIds.push(h.id);
      continue;
    }
    const group = bySpecId.get(specId);
    if (group) group.push(h);
    else bySpecId.set(specId, [h]);
  }

  const rows: BoqRow[] = [];
  const errors: BoqError[] = [];

  if (missingSpecIdIds.length) {
    errors.push({
      reason: 'missing-specId',
      entityIds: missingSpecIdIds,
      message: `${missingSpecIdIds.length} vùng tô chưa gán vật liệu (specId) — không tính vào BOQ. Gán vật liệu cho vùng tô trước khi xuất bảng khối lượng.`,
    });
  }

  for (const [specId, group] of bySpecId) {
    const entityIds = group.map((e) => e.id);
    const spec = specById.get(specId);

    if (!spec) {
      errors.push({
        reason: 'spec-not-found',
        entityIds,
        matId: specId,
        message: `${entityIds.length} vùng tô neo vào specId "${specId}" nhưng không tìm thấy vật liệu này trong danh sách ProductSpec truyền vào — có thể vật liệu đã bị xoá/đổi. Không tính vào BOQ.`,
      });
      continue;
    }

    if (spec.priceVnd === null) {
      errors.push({
        reason: 'missing-priceVnd',
        entityIds,
        matId: specId,
        message: `Vật liệu "${spec.name}" (${entityIds.length} vùng tô) chưa có đơn giá (priceVnd null trong ProductSpec) — không đoán giá, không tính vào BOQ. Bổ sung giá qua ATLAS sync rồi tính lại.`,
      });
      continue;
    }

    // Việc 3a (02/08) — chồng lấn trước khi cộng diện tích: 2+ vùng CÙNG vật liệu đè lên nhau
    // sẽ tính khống nếu cứ cộng thẳng — báo lỗi thay vì đoán phần chồng lấn bao nhiêu (đúng
    // "luật lỗi" chung của hàm này, xem đầu file).
    const overlapPairs = findOverlappingPairs(group);
    if (overlapPairs.length > 0) {
      const ids = Array.from(new Set(overlapPairs.flatMap(([a, b]) => [a.id, b.id])));
      errors.push({
        reason: 'overlapping-region',
        entityIds: ids,
        matId: specId,
        message: `${overlapPairs.length} cặp vùng tô cùng vật liệu "${spec.name}" bị chồng lấn lên nhau — diện tích KHÔNG cộng gộp (tránh tính khống). Tách lại vùng tô hoặc xoá vùng thừa trong bản vẽ rồi tính lại BOQ.`,
      });
      continue;
    }

    const areaM2Raw = group.reduce((sum, h) => sum + polygonArea(h.points) / MM2_PER_M2, 0);
    const wastage = spec.wastagePercent ?? 0;
    const m2 = round2(areaM2Raw);
    const thanhTien = roundVnd(areaM2Raw * (1 + wastage / 100) * spec.priceVnd);

    rows.push({
      matId: specId,
      ten: spec.name,
      ncc: spec.vendor ?? '',
      ma: spec.sku ?? '',
      m2,
      donGia: spec.priceVnd,
      haoHutPhanTram: wastage,
      thanhTien,
      entityIds,
    });
  }

  const totalAmount = rows.reduce((sum, r) => sum + r.thanhTien, 0);

  return { rows, errors, totalAmount };
}
