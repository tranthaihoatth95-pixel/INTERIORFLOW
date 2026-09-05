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
import type { IdfcCommerce } from '../../cad/idfc';
import { SELLABLE_KINDS } from '../../cad/idfc';
import { isMatIdUuid, normalizeMatIdCanonical, normalizeSkuBusinessKey } from '../matid-identity';

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

/** Khoá đã dùng để nối được về kho. `sku` là BUSINESS KEY — nối được nhưng ĐỔI ĐƯỢC (đường lùi
 * cho tệp `.idfc` cũ chưa mang khoá bất biến); `specId`/`matId` là khoá BẤT BIẾN. */
export type SpecLinkVia = 'specId' | 'matId' | 'sku';

export interface ResolvedSpecLink<S> {
  spec: S;
  via: SpecLinkVia;
  /** `true` khi nối bằng khoá bất biến — nhà cung cấp đổi mã hàng thì liên kết VẪN ĐÚNG. */
  ben: boolean;
}

/**
 * ③ `.idfc` → bản ghi thương mại trong kho. THUẦN, caller tự nạp `specs` (đã fetch `/api/specs`).
 *
 * THỨ TỰ ƯU TIÊN — bất biến trước, business key sau:
 *   1. `commerce.specId` ↔ `ProductSpec.id`   — khoá BẤT BIẾN, cùng namespace `BlockEntity.specId`.
 *   2. `commerce.matId`  ↔ `ProductSpec.matId` — UUID canonical (`matid-identity.ts`), bất biến.
 *   3. `commerce.sku`    ↔ `ProductSpec.sku`   — ĐƯỜNG LÙI cho tệp `.idfc` ghi trước 04/09.
 *
 * ⚠️ VÌ SAO THỨ TỰ NÀY LÀ NỘI DUNG CHÍNH, không phải chi tiết: khi kho đổi `sku` (NCC đổi mã
 * hàng — chuyện thường), đường 3 TRẬT còn đường 1/2 vẫn trúng. Đảo thứ tự là mất đúng cái tính
 * chất mà `specId` sinh ra để có. `ben=false` là tín hiệu cho tầng trên biết liên kết này mỏng.
 *
 * `null` = không nối được — KHÔNG bịa, KHÔNG lấy bừa bản ghi gần đúng.
 * KHÔNG chép giá vào `.idfc` (luật 2.1.9.i): hàm này trả CON TRỎ tới bản ghi, giá đọc từ đó.
 */
export function resolveIdfcCommerceToSpec<S extends Pick<MaterialSpecDto, 'id' | 'matId' | 'sku'>>(
  commerce: IdfcCommerce | undefined,
  specs: readonly S[],
): ResolvedSpecLink<S> | null {
  if (!commerce) return null;

  if (typeof commerce.specId === 'string' && commerce.specId.trim()) {
    const key = commerce.specId.trim();
    const hit = specs.find((s) => s.id === key);
    if (hit) return { spec: hit, via: 'specId', ben: true };
  }

  if (typeof commerce.matId === 'string' && isMatIdUuid(commerce.matId)) {
    const key = normalizeMatIdCanonical(commerce.matId);
    const hit = specs.find((s) => typeof s.matId === 'string' && normalizeMatIdCanonical(s.matId) === key);
    if (hit) return { spec: hit, via: 'matId', ben: true };
  }

  if (typeof commerce.sku === 'string' && commerce.sku.trim()) {
    const key = normalizeSkuBusinessKey(commerce.sku);
    const hit = specs.find((s) => typeof s.sku === 'string' && normalizeSkuBusinessKey(s.sku) === key);
    if (hit) return { spec: hit, via: 'sku', ben: false };
  }

  return null;
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
