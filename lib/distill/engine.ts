/**
 * lib/distill/engine.ts — `DistillEngine`: chưng cất GENERIC nhiều nguồn có provenance
 * thành dữ liệu có cấu trúc theo trường, kèm cờ trạng thái + nguồn.
 *
 * KHÔNG biết gì về khái niệm "Thẻ DNA" — chỉ nhận một danh sách `ProvenanceInput` và một
 * danh sách "field spec" (trường đích + hàm rút giá trị từ 1 nguồn). Ai muốn chưng cất gì
 * (Thẻ DNA · auto-define cấu kiện · Company DNA Pack — 3 mặt tiền theo `00-CHOT.md`
 * [12/08 group-by]) chỉ cần viết field spec riêng, gọi lại đúng `distill()` này — KHÔNG
 * viết lại vòng lặp gộp/khử trùng/gắn cờ lần thứ hai.
 *
 * Luật (khuôn scaffolder X2 — không đoán bừa khi thiếu dữ liệu):
 *  - 0 nguồn đóng góp giá trị cho 1 trường ⇒ trường đó TRỐNG (`emptyField()`), KHÔNG bịa.
 *  - ≥1 nguồn đóng góp ⇒ gộp toàn bộ giá trị (khử trùng lặp NGUYÊN VĂN, KHÔNG tự chọn 1
 *    giá trị "đúng nhất") ⇒ trạng thái luôn `'inferred'` (máy suy, CHỜ người duyệt) — muốn
 *    thành `'verified'` phải qua thao tác người xác nhận ở tầng gọi (xem `lib/dna/types.ts`).
 */

import { emptyField, type DistilledField, type ProvenanceInput } from './types';

/** Rút một tập giá trị ứng viên (0..n) từ MỘT nguồn, cho MỘT trường đích. Trả mảng rỗng
 * nếu nguồn này không nói gì về trường đó — KHÔNG được đoán/bịa trong hàm này. */
export type FieldExtractor = (source: ProvenanceInput) => string[];

export interface DistillFieldSpec<TField extends string> {
  field: TField;
  extract: FieldExtractor;
}

/** Chưng cất `sources` theo từng field spec trong `specs`. Trả về đủ MỌI field khai trong
 * `specs` (kể cả field không nguồn nào đóng góp — giá trị `emptyField()`), để tầng gọi
 * không phải tự kiểm `in`/`undefined`. */
export function distill<TField extends string>(
  sources: readonly ProvenanceInput[],
  specs: readonly DistillFieldSpec<TField>[],
): Record<TField, DistilledField<string>> {
  const out = {} as Record<TField, DistilledField<string>>;
  for (const spec of specs) {
    const values: string[] = [];
    const nguon: string[] = [];
    for (const source of sources) {
      const contributed = spec.extract(source);
      if (contributed.length === 0) continue;
      let addedAny = false;
      for (const v of contributed) {
        const trimmed = v.trim();
        if (!trimmed) continue;
        if (!values.includes(trimmed)) values.push(trimmed);
        addedAny = true;
      }
      if (addedAny && !nguon.includes(source.id)) nguon.push(source.id);
    }
    out[spec.field] = values.length > 0 ? { values, trangThai: 'inferred', nguon } : emptyField();
  }
  return out;
}

/** Namespace object — giữ để `grep DistillEngine` (nghiệm thu ⑥) bắt được đúng định danh,
 * và để nơi gọi có thể `import { DistillEngine } from '.../engine'` như một "cỗ máy" thay vì
 * hàm rời nếu thấy tự nhiên hơn. Hai cách import đều hợp lệ, cùng một cài đặt. */
export const DistillEngine = { distill } as const;
