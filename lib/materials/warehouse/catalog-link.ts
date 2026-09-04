/**
 * lib/materials/warehouse/catalog-link.ts — DÂY NỐI họ tài sản ↔ kho thương mại (Slice 8, 09/2026).
 *
 * Luật 2.1.9.i (30/07) GIỮ NGUYÊN: vật liệu TRỎ TỚI bản ghi thương mại, KHÔNG chép giá vào mình.
 * Tệp này chỉ làm hai chiều nối, THUẦN:
 *   ① `catalogLinkFromSpec(spec)` — từ một `MaterialSpecDto` (đã có trong kho) ra `CatalogLink`
 *      để họ tài sản trỏ tới (`specId`/`matId`/`sku`/`brand`/`vendor`).
 *   ② `catalogPayloadFromFamily(family)` — từ họ tài sản đã chuẩn hoá ra `MaterialWritePayload`
 *      cho `POST /api/specs` (đường tạo ProductSpec ĐÃ CÓ — không đẻ route bulk). Chỉ chiều
 *      `measured`/`verified` mới đi vào w/d/hUp (Hoà 15/08: con số chỉ từ chỗ đo được); cờ
 *      `confidence` ánh xạ sang `FfeConfidence` đúng nghĩa. Loại không bán được ⇒ null.
 */

import type { MaterialSpecDto, MaterialWritePayload } from './dto';
import type { CatalogLink, NormalizedAssetFamily } from '../../idfc-import/asset-family';
import type { ProvenanceFlag } from '../../idfc-import/from-photo';
import type { FfeConfidence } from '../../ffe/item';
import { SELLABLE_KINDS } from '../../cad/idfc';

/** ① kho → họ tài sản. */
export function catalogLinkFromSpec(spec: Pick<MaterialSpecDto, 'id' | 'matId' | 'sku' | 'brand' | 'vendor'>): CatalogLink {
  return {
    specId: spec.id,
    ...(spec.matId ? { matId: spec.matId } : {}),
    ...(spec.sku ? { sku: spec.sku } : {}),
    ...(spec.brand ? { brand: spec.brand } : {}),
    ...(spec.vendor ? { vendor: spec.vendor } : {}),
  };
}

/**
 * Cờ ba nấc → `FfeConfidence`: `verified` (người ký) = 'manual' · `measured` = 'measured' ·
 * `inferred` = 'inferred'. Không có cờ nào "nâng" lên khi đổi từ vựng.
 */
export function confidenceFromFlag(flag: ProvenanceFlag): FfeConfidence {
  return flag === 'verified' ? 'manual' : flag;
}

/** ② họ tài sản → payload tạo ProductSpec. `null` khi loại không bán được (page/video/doc…). */
export function catalogPayloadFromFamily(f: NormalizedAssetFamily): MaterialWritePayload | null {
  if (!(SELLABLE_KINDS as readonly string[]).includes(f.kind)) return null;
  const idfcCommerce = f.idfc.ok ? f.idfc.parsed.commerce : undefined;
  const catalog = readCatalog(f);

  const eligible = (['wMm', 'dMm', 'hMm'] as const)
    .map((k) => f.dims[k])
    .filter((v): v is NonNullable<typeof v> => Boolean(v) && (v!.flag === 'measured' || v!.flag === 'verified'));
  const allDims = (['wMm', 'dMm', 'hMm'] as const).map((k) => f.dims[k]).filter(Boolean);
  // confidence = cờ YẾU NHẤT trong các chiều đã khai (kể cả chiều không đủ điều kiện vào kho) —
  // để người đọc kho biết còn chiều nào máy suy.
  const rank: Record<ProvenanceFlag, number> = { inferred: 0, measured: 1, verified: 2 };
  const weakest = allDims.reduce<ProvenanceFlag | undefined>((acc, v) => (!acc || rank[v!.flag] < rank[acc] ? v!.flag : acc), undefined);

  const dim = (k: 'wMm' | 'dMm' | 'hMm') => {
    const v = f.dims[k];
    return v && (v.flag === 'measured' || v.flag === 'verified') ? v.value : undefined;
  };

  const payload: MaterialWritePayload = {
    name: f.name,
    ...(catalog?.sku ?? idfcCommerce?.sku ? { sku: catalog?.sku ?? idfcCommerce?.sku } : {}),
    ...(catalog?.brand ?? idfcCommerce?.brand ? { brand: catalog?.brand ?? idfcCommerce?.brand } : {}),
    ...(catalog?.vendor ?? idfcCommerce?.vendor ? { vendor: catalog?.vendor ?? idfcCommerce?.vendor } : {}),
    ...(dim('wMm') !== undefined ? { w: dim('wMm') } : {}),
    ...(dim('dMm') !== undefined ? { d: dim('dMm') } : {}),
    ...(dim('hMm') !== undefined ? { hUp: dim('hMm') } : {}),
    ...(idfcCommerce?.unit ? { unit: idfcCommerce.unit } : {}),
    ...(typeof idfcCommerce?.priceVnd === 'number' ? { priceVnd: idfcCommerce.priceVnd } : {}),
    ...(idfcCommerce?.currency ? { currency: idfcCommerce.currency } : {}),
    ...(idfcCommerce?.materials?.length ? { materials: idfcCommerce.materials } : {}),
    ...(idfcCommerce?.finishes?.length ? { finishes: idfcCommerce.finishes } : {}),
    ...(weakest ? { confidence: confidenceFromFlag(weakest) } : {}),
    note: `family:${f.familyId} · tier:${f.acquisition.tier} · nguồn:${f.origin.kind}${f.origin.url ? ` · ${f.origin.url}` : ''}${eligible.length < allDims.length ? ' · có chiều máy suy, KHÔNG vào kho' : ''}`,
  };
  return payload;
}

function readCatalog(f: NormalizedAssetFamily): CatalogLink | undefined {
  if (!f.idfc.ok) return undefined;
  try {
    const raw = JSON.parse(f.idfc.json) as { xAssetFamily?: { catalog?: CatalogLink } };
    return raw.xAssetFamily?.catalog;
  } catch {
    return undefined;
  }
}
