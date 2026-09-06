/**
 * Material Impact — kiểm kê và thay một tham chiếu ProductSpec trong MỘT Doc chung.
 *
 * Trong UI/nghiệp vụ người dùng gọi đây là `matId`; trong Doc hiện tại neo bền là `specId`
 * (= ProductSpec.id). Module này cố ý không đẻ field thứ hai. Khi `specId` đổi, 2D/3D/BOQ
 * đều đọc lại cùng Doc, thay vì mỗi chặng giữ một bản sao vật liệu riêng.
 *
 * Thuần dữ liệu, immutable, không React/DOM/DB/network. Caller phải hiển thị `impact` để người
 * dùng xác nhận trước khi gọi `replaceMaterialReferences()` cho phạm vi toàn dự án.
 */

import type { BlockEntity, Doc, HatchEntity, WallType } from '../cad/model';

export type MaterialUsageKind = 'surface' | 'component' | 'wall-default' | 'wall-layer';

export interface MaterialUsage {
  kind: MaterialUsageKind;
  /** Entity id với surface/component; WallType.id với hai loại wall. */
  ownerId: string;
  /** Nhãn có sẵn trong Doc, không tự bịa tên vật liệu. */
  label: string;
  layerIndex?: number;
  /**
   * V6 (06/09) — KHOÁ ỔN ĐỊNH của MỘT chỗ dùng, để phạm vi áp nói được tới cấp từng chỗ.
   *
   * ⛔ VÌ SAO KHÔNG DÙNG `ownerId` LÀM KHOÁ: một `WallType` có thể dùng vật liệu này ở CẢ giá trị
   * mặc định LẪN nhiều lớp cấu tạo ⇒ nhiều chỗ dùng khác nhau trùng `ownerId`. Bỏ chọn "lớp ốp gỗ"
   * mà máy hiểu thành "bỏ chọn cả loại tường" là đổi sai thứ người dùng không hề trỏ vào.
   */
  key: string;
}

/** Khoá của một chỗ dùng — sinh ở MỘT chỗ để mọi nơi so khớp cùng một cách. */
export function usageKey(kind: MaterialUsageKind, ownerId: string, layerIndex?: number): string {
  return layerIndex === undefined ? `${kind}:${ownerId}` : `${kind}:${ownerId}:${layerIndex}`;
}

export interface MaterialConsumers {
  drawing2d: boolean;
  model3d: boolean;
  boq: boolean;
  elevations: boolean;
  materialBoard: boolean;
  presenting: boolean;
}

export interface MaterialImpact {
  specId: string;
  usages: MaterialUsage[];
  counts: Record<MaterialUsageKind, number>;
  totalReferences: number;
  /** Những đầu ra PHẢI đọc lại từ Doc; không phải số file/slide đã lưu ở nơi khác. */
  consumers: MaterialConsumers;
}

const EMPTY_COUNTS: Record<MaterialUsageKind, number> = {
  surface: 0,
  component: 0,
  'wall-default': 0,
  'wall-layer': 0,
};

export function inspectMaterialImpact(doc: Doc, specId: string): MaterialImpact {
  const usages: MaterialUsage[] = [];

  for (const entity of doc.entities) {
    if (entity.type === 'hatch' && entity.specId === specId) {
      usages.push({ kind: 'surface', ownerId: entity.id, label: entity.layer, key: usageKey('surface', entity.id) });
    } else if (entity.type === 'block' && entity.specId === specId) {
      usages.push({ kind: 'component', ownerId: entity.id, label: entity.block, key: usageKey('component', entity.id) });
    }
  }

  for (const wallType of doc.wallTypes ?? []) {
    if (wallType.specId === specId) {
      usages.push({ kind: 'wall-default', ownerId: wallType.id, label: wallType.name, key: usageKey('wall-default', wallType.id) });
    }
    wallType.layers?.forEach((layer, layerIndex) => {
      if (layer.specId === specId) {
        usages.push({
          kind: 'wall-layer',
          ownerId: wallType.id,
          label: `${wallType.name} · ${layer.name}`,
          layerIndex,
          key: usageKey('wall-layer', wallType.id, layerIndex),
        });
      }
    });
  }

  const counts = { ...EMPTY_COUNTS };
  for (const usage of usages) counts[usage.kind] += 1;
  const hasEntity = counts.surface + counts.component > 0;
  const hasWall = counts['wall-default'] + counts['wall-layer'] > 0;
  const hasAny = hasEntity || hasWall;

  return {
    specId,
    usages,
    counts,
    totalReferences: usages.length,
    consumers: {
      drawing2d: hasAny,
      model3d: hasAny,
      boq: hasEntity,
      elevations: hasWall || counts.component > 0,
      materialBoard: hasAny,
      presenting: hasAny,
    },
  };
}

export interface MaterialReplaceScope {
  /** Thiếu = mọi entity. Có = chỉ đổi đúng entity được chọn. */
  entityIds?: readonly string[];
  /** Mặc định true khi không truyền entityIds, false khi đang đổi một vùng/món được chọn. */
  includeWallTypes?: boolean;
  /**
   * V6 (06/09) — PHẠM VI TỚI TỪNG CHỖ DÙNG (`MaterialUsage.key`). Có giá trị ⇒ THẮNG cả
   * `entityIds` lẫn `includeWallTypes`: chỉ đúng những chỗ có khoá trong danh sách mới đổi.
   *
   * ⛔ VÌ SAO CẦN, đo 06/09: hai trường trên chỉ nói được *toàn bộ entity* ↔ *một tập entity*, và
   * `includeWallTypes` là công tắc NHỊ PHÂN cho MỌI loại tường. Người dùng muốn đổi 8 trong 12 chỗ
   * thì không có đường nào diễn đạt. Mảng rỗng `[]` = KHÔNG chỗ nào (khác `undefined` = không giới
   * hạn) — hai trạng thái này nói hai điều khác nhau nên cố ý không gộp.
   */
  usageKeys?: readonly string[];
}

/**
 * Giá trị MỚI đi kèm lượt thay, cho những mặt mà `specId` một mình không chở nổi.
 *
 * ⛔ VÌ SAO PHẢI CÓ `matId`: `Base.matId` là **UUID vật liệu**, thứ chặng 3D đọc để tra ảnh vân
 * (`lib/three/cad-to-obj.ts`). Trước 06/09 hàm này chỉ đổi `specId` ⇒ entity nằm NGOÀI vùng đang
 * chọn mang mã thương mại MỚI mà vẫn giữ UUID CŨ ⇒ 3D dựng ra vân của vật liệu vừa bị thay. Danh
 * tính đi một nửa còn tệ hơn không đi: người dùng thấy con số đổi mà mắt thấy vật liệu cũ.
 */
export interface MaterialReplaceValue {
  /**
   * `undefined` = KHÔNG đụng (giữ mã đang có — mọi nơi gọi cũ chạy y như trước).
   * Chuỗi = ghi UUID mới. `null` = XOÁ hẳn, dùng khi vật liệu mới THẬT SỰ chưa có UUID: 3D rơi về
   * màu phẳng, đó là sự thật của bản ghi đó — còn giữ UUID cũ là dựng một danh tính không tồn tại.
   */
  matId?: string | null;
}

export interface MaterialReplaceResult {
  doc: Doc;
  before: MaterialImpact;
  after: MaterialImpact;
  changedReferences: number;
}

/**
 * Thay tham chiếu vật liệu có kiểm soát. Không sửa object đầu vào; không có gì đổi thì trả lại
 * đúng `doc` cũ để store không tạo snapshot/undo thừa.
 */
export function replaceMaterialReferences(
  doc: Doc,
  fromSpecId: string,
  toSpecId: string,
  scope: MaterialReplaceScope = {},
  value: MaterialReplaceValue = {},
): MaterialReplaceResult {
  const before = inspectMaterialImpact(doc, fromSpecId);
  if (!fromSpecId || !toSpecId || fromSpecId === toSpecId) {
    return { doc, before, after: inspectMaterialImpact(doc, toSpecId), changedReferences: 0 };
  }

  // `usageKeys` là phạm vi HẸP NHẤT nên nó thắng; thiếu nó thì hai trường cũ giữ nguyên nghĩa cũ.
  const keys = scope.usageKeys ? new Set(scope.usageKeys) : null;
  const selected = scope.entityIds ? new Set(scope.entityIds) : null;
  const includeWallTypes = keys ? true : scope.includeWallTypes ?? selected === null;
  const nhanUsage = (key: string, ownerInScope: boolean): boolean => (keys ? keys.has(key) : ownerInScope);
  // `undefined` ⇒ không đụng `matId`; có khai (kể cả `null`) ⇒ ghi đè, `null` thành "xoá field".
  const doiMatId = Object.prototype.hasOwnProperty.call(value, 'matId');
  const patchMatId = doiMatId
    ? (value.matId ? { matId: value.matId } : { matId: undefined })
    : null;
  let changedReferences = 0;

  const entities = doc.entities.map((entity) => {
    if (entity.type === 'hatch' && entity.specId === fromSpecId) {
      if (!nhanUsage(usageKey('surface', entity.id), !selected || selected.has(entity.id))) return entity;
      changedReferences += 1;
      return { ...entity, specId: toSpecId, ...(patchMatId ?? {}) } as HatchEntity;
    }
    if (entity.type === 'block' && entity.specId === fromSpecId) {
      if (!nhanUsage(usageKey('component', entity.id), !selected || selected.has(entity.id))) return entity;
      changedReferences += 1;
      return { ...entity, specId: toSpecId, ...(patchMatId ?? {}) } as BlockEntity;
    }
    return entity;
  });

  let wallTypes = doc.wallTypes;
  if (includeWallTypes && wallTypes) {
    wallTypes = wallTypes.map((wallType): WallType => {
      let changed = false;
      let next: WallType = wallType;
      if (wallType.specId === fromSpecId && nhanUsage(usageKey('wall-default', wallType.id), true)) {
        changed = true;
        changedReferences += 1;
        next = { ...next, specId: toSpecId };
      }
      const nhanLop = (i: number) => nhanUsage(usageKey('wall-layer', wallType.id, i), true);
      if (wallType.layers?.some((layer, i) => layer.specId === fromSpecId && nhanLop(i))) {
        const layers = wallType.layers.map((layer, i) => {
          if (layer.specId !== fromSpecId || !nhanLop(i)) return layer;
          changedReferences += 1;
          return { ...layer, specId: toSpecId };
        });
        next = { ...next, layers };
        changed = true;
      }
      return changed ? next : wallType;
    });
  }

  if (changedReferences === 0) {
    return { doc, before, after: inspectMaterialImpact(doc, toSpecId), changedReferences: 0 };
  }

  const nextDoc: Doc = { ...doc, entities, ...(wallTypes ? { wallTypes } : {}) };
  return {
    doc: nextDoc,
    before,
    after: inspectMaterialImpact(nextDoc, toSpecId),
    changedReferences,
  };
}

