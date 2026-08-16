/**
 * lib/review/luat/cad.ts — CẮM bộ luật chặng 2D vào khung review. KHÔNG chép luật vào đây
 * (K1 — `lib/cad/standards/` 11 bộ · 3.074 dòng ĐANG CHẠY TỐT là kho duy nhất): file này chỉ
 * GỌI `checkStandards()` rồi DỊCH `Violation` → `FindingLuat` cho bảng kiểm dùng chung.
 *
 * Ánh xạ mức: severity 'error' → 'do' · 'warning'/'info' → 'vang'. ('info' không có bậc riêng
 * trong bảng kiểm — chốt phiếu chỉ có đỏ/vàng cho lớp luật; info là tham khảo nên xếp vàng,
 * `chuaKiemChung`/`asOfNote` mang đủ sắc thái còn lại.)
 */

import type { Doc } from '../../cad/model';
import { checkStandards, type Violation } from '../../cad/standards/checker';
import { getRulesEffectiveOn, type StandardRule } from '../../cad/standards/registry';
import type { FindingLuat } from '../types';

/**
 * P-B (16/08) — `Violation` KHÔNG mang `loaiNguon`/`nguyenVan`/`effectiveFrom`, và cố ý không
 * thêm: `checker.ts` là RULE ENGINE đo hình học, ba trường đó là XUẤT XỨ của rule chứ không phải
 * kết quả phép đo. Nhồi vào Violation thì mọi nhánh sinh vi phạm (hàng chục chỗ trong 41k dòng)
 * phải nhớ điền — đúng cơ chế đẻ ra "quên một chỗ, im lặng mất dữ liệu".
 * ⇒ Tra thẳng từ rule gốc BẰNG `ruleId` tại đây, nơi đã có sẵn danh sách rule.
 * Tra không thấy ⇒ để trống. KHÔNG đoán (rào B3 + rào ③).
 */
export function violationToFinding(v: Violation, rule?: StandardRule): FindingLuat {
  return {
    lop: 'luat',
    muc: v.severity === 'error' ? 'do' : 'vang',
    nguon: v.asOfNote ? `${v.source} · ${v.asOfNote}` : v.source,
    ruleId: v.ruleId,
    moTa: v.message,
    // p3c (08/08) — mang `entityId` qua (Violation.entityId, checker.ts): ReviewPanel select được
    // đúng vật thay vì chỉ zoom toạ độ. Không bịa: cả hai thiếu ⇒ viTri = undefined như cũ.
    viTri: v.at || v.entityId ? { mm: v.at, entityId: v.entityId } : undefined,
    chuaKiemChung: v.verified === false ? true : undefined,
    loaiNguon: rule?.loaiNguon,
    nguyenVan: rule?.nguyenVan,
    ngayHieuLuc: rule?.effectiveFrom,
  };
}

/** Lượt kiểm lớp LUẬT chặng 2D — tất định (checkStandards thuần, cùng doc + cùng asOfDate ⇒
 * cùng kết quả; test tất định nằm ở rules-3d.test.ts case [tất định] chạy chung khuôn). */
export function luatCad(doc: Doc, opts?: { asOfDate?: string | null }): FindingLuat[] {
  const rules = getRulesEffectiveOn(opts?.asOfDate ?? null);
  const theoId = new Map(rules.map((r) => [r.id, r]));
  return checkStandards(doc, rules, opts).map((v) => violationToFinding(v, theoId.get(v.ruleId)));
}
