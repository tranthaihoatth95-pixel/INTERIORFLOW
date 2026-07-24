/**
 * lib/server/specs.ts — helper dùng chung cho app/api/specs/* (Hệ Legend X1).
 * Tách khỏi route.ts vì Next chỉ cho route file export HTTP method — helper chung để đây.
 */

export const SPEC_KINDS = ['furniture', 'material', 'lighting', 'millwork', 'fixture'] as const;

export function specSafeArr(s: string): string[] {
  try {
    const v = JSON.parse(s || '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** Serialize 1 row Prisma cho client — materials/finishes JSON string → mảng an toàn. */
export function specToDto(s: {
  id: string; kind: string; name: string; nameEn: string | null; brand: string | null;
  sku: string | null; vendor: string | null; w: number | null; d: number | null; hUp: number | null;
  materials: string; finishes: string; colorHex: string | null; imageAssetId: string | null;
  drawingBlock: string | null; priceNote: string | null; currency: string | null; note: string | null;
  larkRecordId: string | null; createdAt: Date; syncedAt: Date | null;
}) {
  return {
    id: s.id,
    kind: s.kind,
    name: s.name,
    nameEn: s.nameEn,
    brand: s.brand,
    sku: s.sku,
    vendor: s.vendor,
    w: s.w,
    d: s.d,
    hUp: s.hUp,
    materials: specSafeArr(s.materials),
    finishes: specSafeArr(s.finishes),
    colorHex: s.colorHex,
    imageAssetId: s.imageAssetId,
    drawingBlock: s.drawingBlock,
    priceNote: s.priceNote,
    currency: s.currency,
    note: s.note,
    larkRecordId: s.larkRecordId,
    createdAt: s.createdAt,
    syncedAt: s.syncedAt,
  };
}

const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
const int = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : null);
const arr = (v: unknown) =>
  JSON.stringify(Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);

/** Ép field body POST về đúng kiểu cột — bỏ qua field lạ (không mass-assign). */
export function specNormalize(b: Record<string, unknown>, kind: string, name: string) {
  return {
    kind,
    name,
    nameEn: str(b.nameEn),
    brand: str(b.brand),
    sku: str(b.sku),
    vendor: str(b.vendor),
    w: int(b.w),
    d: int(b.d),
    hUp: int(b.hUp),
    materials: arr(b.materials),
    finishes: arr(b.finishes),
    colorHex: str(b.colorHex),
    imageAssetId: str(b.imageAssetId),
    drawingBlock: str(b.drawingBlock),
    priceNote: str(b.priceNote),
    currency: str(b.currency),
    note: str(b.note),
  };
}

/** Patch PATCH — CHỈ field có mặt trong body mới được sửa (partial update). */
export function specPatch(b: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  const strKeys = ['nameEn', 'brand', 'sku', 'vendor', 'colorHex', 'imageAssetId', 'drawingBlock', 'priceNote', 'currency', 'note'];
  for (const k of strKeys) if (k in b) out[k] = str(b[k]);
  for (const k of ['w', 'd', 'hUp']) if (k in b) out[k] = int(b[k]);
  for (const k of ['materials', 'finishes']) if (k in b) out[k] = arr(b[k]);
  if (typeof b.name === 'string' && b.name.trim()) out.name = b.name.trim();
  if (typeof b.kind === 'string' && (SPEC_KINDS as readonly string[]).includes(b.kind)) out.kind = b.kind;
  return out;
}
