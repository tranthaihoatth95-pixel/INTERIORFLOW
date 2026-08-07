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
import { getRulesEffectiveOn } from '../../cad/standards/registry';
import type { FindingLuat } from '../types';

export function violationToFinding(v: Violation): FindingLuat {
  return {
    lop: 'luat',
    muc: v.severity === 'error' ? 'do' : 'vang',
    nguon: v.asOfNote ? `${v.source} · ${v.asOfNote}` : v.source,
    ruleId: v.ruleId,
    moTa: v.message,
    viTri: v.at ? { mm: v.at } : undefined,
    chuaKiemChung: v.verified === false ? true : undefined,
  };
}

/** Lượt kiểm lớp LUẬT chặng 2D — tất định (checkStandards thuần, cùng doc + cùng asOfDate ⇒
 * cùng kết quả; test tất định nằm ở rules-3d.test.ts case [tất định] chạy chung khuôn). */
export function luatCad(doc: Doc, opts?: { asOfDate?: string | null }): FindingLuat[] {
  const rules = getRulesEffectiveOn(opts?.asOfDate ?? null);
  return checkStandards(doc, rules, opts).map(violationToFinding);
}
