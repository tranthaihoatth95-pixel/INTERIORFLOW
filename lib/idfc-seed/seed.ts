/**
 * lib/idfc-seed/seed.ts — dựng HỌ TÀI SẢN SEED từ fixture tự tác (Slice 8, 09/2026).
 *
 * Đường: `SEED_BOXES` → `buildBoxGlb` (byte GLB tất định) → `normalizeAssetFamily` (đường THẬT,
 * không đường tắt cho seed) → họ tài sản có đủ plan-line · model3d · bounds · spec · .idfc.
 * Mục đích: (1) bằng chứng round-trip cho Slice 8 — cùng đường mọi ứng viên thật sẽ đi; (2) kho
 * seed nhỏ, hợp pháp, có biên lai, để UI/phiếu sau có thứ để hiển thị mà không tải model ngoài.
 *
 * KHÔNG ghi DB/FS ở đây — trả dữ liệu, caller (route/script) quyết ghi đâu.
 */

import { createHash } from 'crypto';
import { normalizeAssetFamily, type AssetFamilyCandidate, type NormalizedAssetFamily } from '../idfc-import/asset-family';
import { buildBoxGlb } from './fixture-glb';
import { SEED_BOXES, SEED_RECEIPT, seedLicenseClaim } from './receipt';

export interface SeedFamily {
  family: NormalizedAssetFamily;
  glb: Uint8Array;
  /** sha256 của byte GLB — cùng định nghĩa contentHash toàn app. */
  contentHash: string;
}

export function seedCandidate(box: (typeof SEED_BOXES)[number], glb: Uint8Array, contentHash: string): AssetFamilyCandidate {
  const src = SEED_RECEIPT.evidenceUrl;
  return {
    name: box.name,
    code: box.code,
    kind: box.kind,
    group: box.group,
    origin: {
      kind: 'if-seed',
      url: src,
      contentHash,
      originalName: `${box.code}.glb`,
      originalMime: 'model/gltf-binary',
      originalBytes: glb.byteLength,
    },
    license: seedLicenseClaim(),
    dims: {
      wMm: { value: box.wMm, flag: 'verified', source: src },
      dMm: { value: box.dMm, flag: 'verified', source: src },
      hMm: { value: box.hMm, flag: 'verified', source: src },
    },
    model3d: { payloadRef: `seed://${box.code}.glb`, format: 'glb', glb, upAxisDeclared: 'Y', flag: 'verified', source: src },
    tags: ['seed', 'fixture'],
  };
}

/** Dựng toàn bộ seed. `now` tiêm để tất định. */
export function buildSeedFamilies(now = '2026-09-02T00:00:00.000Z'): SeedFamily[] {
  return SEED_BOXES.map((box) => {
    const glb = buildBoxGlb({ wMm: box.wMm, dMm: box.dMm, hMm: box.hMm });
    const contentHash = createHash('sha256').update(glb).digest('hex');
    const family = normalizeAssetFamily(seedCandidate(box, glb, contentHash), { now });
    return { family, glb, contentHash };
  });
}
