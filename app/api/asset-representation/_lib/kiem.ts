/**
 * app/api/asset-representation/_lib/kiem.ts — phần THUẦN của route AssetRepresentation: đọc body,
 * kiểm từ vựng, dựng data ghi. Tách khỏi handler (cần session/Prisma) để test không cần DB —
 * cùng lối `app/api/project-files/_lib/luu-file.ts`.
 *
 * Từ vựng `kind`: chuỗi tự do CÓ CHỦ ĐÍCH (schema.prisma:350) — nhưng route CHỈ nhận các kind
 * đã có trong `REPRESENTATION_DB_KIND` (asset-family.ts) để không đẻ tên thứ hai cho cùng một
 * cách thể hiện. Thêm kind mới = thêm vào bảng đó, không phải nới ở đây.
 */

import { REPRESENTATION_DB_KIND } from '../../../../lib/idfc-import/asset-family';
import type { ProvenanceFlag } from '../../../../lib/idfc-import/from-photo';

export const DB_KINDS: readonly string[] = Object.values(REPRESENTATION_DB_KIND);
const TRUTH: readonly ProvenanceFlag[] = ['measured', 'inferred', 'verified'];

export interface RepresentationCreate {
  assetId: string;
  kind: string;
  payloadRef: string;
  truthLevel: ProvenanceFlag;
  provenance: string;
}

export type KiemResult = { ok: true; data: RepresentationCreate } | { ok: false; error: string };

const PAYLOAD_REF_MAX = 2048;

/**
 * Kiểm body POST. `truthLevel` mặc định `inferred` (đúng @default schema). `verified` KHÔNG được
 * đặt qua POST — chỉ qua PATCH ký (luật cửa duyệt 03: người GÕ/ký mới lên verified).
 */
export function kiemBodyTao(body: unknown): KiemResult {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return { ok: false, error: 'Body phải là JSON object.' };
  const b = body as Record<string, unknown>;
  const assetId = typeof b.assetId === 'string' ? b.assetId.trim() : '';
  const kind = typeof b.kind === 'string' ? b.kind.trim() : '';
  const payloadRef = typeof b.payloadRef === 'string' ? b.payloadRef.trim() : '';
  if (!assetId) return { ok: false, error: 'Thiếu assetId.' };
  if (!kind) return { ok: false, error: 'Thiếu kind.' };
  if (!DB_KINDS.includes(kind)) return { ok: false, error: `kind "${kind}" không thuộc từ vựng: ${DB_KINDS.join(' | ')}.` };
  if (!payloadRef) return { ok: false, error: 'Thiếu payloadRef (đường uploads · URL nguồn · inline:…).' };
  if (payloadRef.length > PAYLOAD_REF_MAX) return { ok: false, error: `payloadRef quá ${PAYLOAD_REF_MAX} ký tự — không nhúng payload nặng vào cột.` };
  if (payloadRef.startsWith('data:')) return { ok: false, error: 'payloadRef là dataURL — cấm nhúng payload vào cột (schema.prisma:354).' };

  let truthLevel: ProvenanceFlag = 'inferred';
  if (b.truthLevel !== undefined) {
    if (typeof b.truthLevel !== 'string' || !(TRUTH as readonly string[]).includes(b.truthLevel))
      return { ok: false, error: 'truthLevel phải là measured | inferred (verified chỉ qua PATCH ký).' };
    if (b.truthLevel === 'verified') return { ok: false, error: 'Không đặt verified qua POST — dùng PATCH {verify:true} để ký.' };
    truthLevel = b.truthLevel as ProvenanceFlag;
  }

  let provenance = '';
  if (b.provenance !== undefined) {
    if (typeof b.provenance === 'string') provenance = b.provenance;
    else {
      try {
        provenance = JSON.stringify(b.provenance);
      } catch {
        return { ok: false, error: 'provenance không chuyển được sang JSON.' };
      }
    }
    if (provenance.length > 20_000) return { ok: false, error: 'provenance quá 20.000 ký tự.' };
  }

  return { ok: true, data: { assetId, kind, payloadRef, truthLevel, provenance } };
}

export type PatchResult = { ok: true; verify: boolean } | { ok: false; error: string };

/** PATCH chỉ có MỘT việc: ký (`verify: true`). Hạ cấp/đổi payloadRef không có ở đây — cố ý. */
export function kiemBodyPatch(body: unknown): PatchResult {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return { ok: false, error: 'Body phải là JSON object.' };
  const b = body as Record<string, unknown>;
  if (b.verify !== true) return { ok: false, error: 'PATCH chỉ nhận {verify:true}.' };
  return { ok: true, verify: true };
}
