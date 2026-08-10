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
      usages.push({ kind: 'surface', ownerId: entity.id, label: entity.layer });
    } else if (entity.type === 'block' && entity.specId === specId) {
      usages.push({ kind: 'component', ownerId: entity.id, label: entity.block });
    }
  }

  for (const wallType of doc.wallTypes ?? []) {
    if (wallType.specId === specId) {
      usages.push({ kind: 'wall-default', ownerId: wallType.id, label: wallType.name });
    }
    wallType.layers?.forEach((layer, layerIndex) => {
      if (layer.specId === specId) {
        usages.push({
          kind: 'wall-layer',
          ownerId: wallType.id,
          label: `${wallType.name} · ${layer.name}`,
          layerIndex,
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
): MaterialReplaceResult {
  const before = inspectMaterialImpact(doc, fromSpecId);
  if (!fromSpecId || !toSpecId || fromSpecId === toSpecId) {
    return { doc, before, after: inspectMaterialImpact(doc, toSpecId), changedReferences: 0 };
  }

  const selected = scope.entityIds ? new Set(scope.entityIds) : null;
  const includeWallTypes = scope.includeWallTypes ?? selected === null;
  let changedReferences = 0;

  const entities = doc.entities.map((entity) => {
    if (selected && !selected.has(entity.id)) return entity;
    if (entity.type === 'hatch' && entity.specId === fromSpecId) {
      changedReferences += 1;
      return { ...entity, specId: toSpecId } as HatchEntity;
    }
    if (entity.type === 'block' && entity.specId === fromSpecId) {
      changedReferences += 1;
      return { ...entity, specId: toSpecId } as BlockEntity;
    }
    return entity;
  });

  let wallTypes = doc.wallTypes;
  if (includeWallTypes && wallTypes) {
    wallTypes = wallTypes.map((wallType): WallType => {
      let changed = false;
      let next: WallType = wallType;
      if (wallType.specId === fromSpecId) {
        changed = true;
        changedReferences += 1;
        next = { ...next, specId: toSpecId };
      }
      if (wallType.layers?.some((layer) => layer.specId === fromSpecId)) {
        const layers = wallType.layers.map((layer) => {
          if (layer.specId !== fromSpecId) return layer;
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

