/**
 * lib/cad/eyedropper.ts — SPEC-LENH-VE-IF §3/§4 khuyết ① "ống hút thuộc tính" (AutoCAD MATCHPROP,
 * "rẻ mà được yêu nhất"). Chỉ phần LÕI THUẦN (hàm tính, không UI/không đọc store) — nơi gọi
 * (CHINH/G4) tự lo chọn nguồn/đích qua UI rồi gọi hàm này, giống mọi module thuần khác trong
 * `lib/cad/` (so sánh `campath.ts`).
 *
 * Copy các thuộc tính STYLE (không phải hình học, không phải phân loại BIM) từ 1 entity nguồn
 * sang N entity đích: `layer` (lớp) · `color`/`lineweight`/`lineType` (nét) · `specId` (matId —
 * FK mềm ProductSpec, xem `BlockEntity.specId`/`HatchEntity.specId` trong `model.ts`).
 *
 * CỐ TÌNH KHÔNG copy: `id`/`type` (bản sắc entity) · hình học riêng từng loại (points/w/d/h/...) ·
 * `storey`/`elementType`/`wallKind`/`wallStructural` (phân loại BIM — MATCHPROP thật của AutoCAD
 * cũng không đụng vào "loại đối tượng", chỉ đụng "cách nó được vẽ ra sao").
 *
 * Hành vi khi nguồn KHÔNG có field (vd `source.specId === undefined`): field đích cũng bị đặt về
 * `undefined` — ĐÚNG ngữ nghĩa "match" (đích giống hệt nguồn), giống MATCHPROP thật (chọn nguồn
 * chưa gán màu riêng thì đích cũng mất màu riêng, quay về mặc định layer). KHÔNG đoán/giữ lại giá
 * trị cũ của đích — cùng nguyên tắc "không tự suy đoán" đã áp cho BOQ/`lib/boq/compute.ts`.
 */

/** Thuộc tính style tối thiểu chung cho MỌI entity (xem `Base` trong `model.ts`) — dùng generic
 * thay vì import toàn bộ union `AnyEntity` để module này không phụ thuộc ngược vào mọi loại entity
 * mới thêm sau này (chỉ cần entity có các field optional dưới đây, kể cả object rỗng). */
export interface StyleFields {
  layer?: string;
  color?: string;
  lineweight?: number;
  lineType?: string;
  /** matId — FK mềm ProductSpec.id. Có ý nghĩa khác nhau tuỳ loại entity (tường/hatch/block)
   * nhưng LUÔN cùng tên field + cùng cơ chế tra cứu (xem `BlockEntity.specId` trong `model.ts`). */
  specId?: string;
}

export type MatchPropField = keyof StyleFields;

/** Mặc định copy CẢ 5 field — nơi gọi có thể truyền `fields` hẹp hơn (vd chỉ `['layer']` khi UI
 * cho chọn "chỉ lớp" giống hộp thoại MATCHPROP thật của AutoCAD có tuỳ chọn bật/tắt từng nhóm). */
export const DEFAULT_MATCH_PROP_FIELDS: readonly MatchPropField[] = ['layer', 'color', 'lineweight', 'lineType', 'specId'];

/**
 * Áp style của `source` lên từng phần tử trong `targets` — trả về MẢNG ĐỐI TƯỢNG MỚI (thuần,
 * không sửa tại chỗ `targets` truyền vào — cùng phong cách immutable của `computeBoq`/`planCamPath`),
 * nơi gọi tự quyết ghi lại vào Doc qua `useCadStore.updateEntities` (giống `onPushPull` ở
 * `Scene3DViewer.tsx` — component/hàm thuần không tự ghi store).
 */
export function matchProps<T extends StyleFields>(source: StyleFields, targets: T[], fields: readonly MatchPropField[] = DEFAULT_MATCH_PROP_FIELDS): T[] {
  return targets.map((target) => {
    const patch: StyleFields = {};
    for (const f of fields) {
      patch[f] = source[f] as never;
    }
    return { ...target, ...patch };
  });
}

/** Tiện ích 1-đích (UI thường bắt đầu bằng "chọn nguồn → click từng đích 1"), tương đương
 * `matchProps(source, [target], fields)[0]` nhưng khỏi bọc/mở mảng ở nơi gọi. */
export function matchPropsOne<T extends StyleFields>(source: StyleFields, target: T, fields: readonly MatchPropField[] = DEFAULT_MATCH_PROP_FIELDS): T {
  return matchProps(source, [target], fields)[0];
}
