/**
 * Semantic contract shared by the 2D document and every 3D projection.
 *
 * This module deliberately stores no second model.  A spatial item keeps the
 * identity, level and type that already live on its source Entity; a 3D lens
 * can add `derived` items (such as a preview floor) without pretending that
 * they are editable document entities.
 */
import type { Entity } from './model';

/** Stable, tool-neutral buckets used by scene trees, filters and inspectors. */
export type SpatialKind =
  | 'wall'
  | 'floor'
  | 'ceiling'
  | 'room'
  | 'furniture'
  | 'door'
  | 'window'
  | 'other';

/** How a spatial kind was obtained.  UI must not present inferred data as authored data. */
export type SemanticProvenance = 'declared' | 'inferred' | 'derived';

/**
 * The minimum link a projection needs to return to the one CAD Doc.
 * `entityId` is intentionally absent for derived preview geometry: it has no
 * independent document object to select, edit or count in BOQ.
 */
export interface SpatialIdentity {
  /** Named to spread directly into a projection's scene metadata. */
  semanticKind: SpatialKind;
  semanticProvenance: SemanticProvenance;
  entityId?: string;
  levelId?: string;
  typeId?: string;
}

/** Make a scene-safe identity from an existing source entity, without cloning it. */
export function spatialIdentity(
  entity: Entity,
  kind: SpatialKind,
  provenance: Exclude<SemanticProvenance, 'derived'>,
): SpatialIdentity {
  return {
    semanticKind: kind,
    semanticProvenance: provenance,
    entityId: entity.id,
    ...(entity.levelId ? { levelId: entity.levelId } : {}),
    ...(entity.typeId ? { typeId: entity.typeId } : {}),
  };
}

/** Mark geometry synthesized only for a projection (bbox slabs, fallback rooms, guides). */
export function derivedSpatial(kind: Extract<SpatialKind, 'floor' | 'ceiling' | 'room'>): SpatialIdentity {
  return { semanticKind: kind, semanticProvenance: 'derived' };
}
