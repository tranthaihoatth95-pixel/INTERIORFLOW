/**
 * lib/distill/assurance.ts — MỘT thang ĐỘ ĐẢM BẢO (assurance grade) + PROVENANCE cho toàn xương
 * sống dữ liệu 2D → 3D → vật liệu/spec → BOQ → Trình bày.
 *
 * VÌ SAO (đo 02/09, [Đ2] nhìn-vào-trong-trước): repo đang có BỐN bộ từ vựng nói cùng một chuyện
 * "tin tới đâu", không bộ nào đọc được bộ kia:
 *   · `TrangThaiNguon`      measured | inferred | verified          (lib/distill/types.ts)
 *   · `FfeConfidence`       measured | inferred | manual            (lib/ffe/item.ts)
 *   · `SemanticProvenance`  declared | inferred | derived           (lib/cad/semantic-contract.ts)
 *   · `ProductSpec.verified` boolean + `AssetRepresentation.truthLevel` chuỗi (prisma/schema.prisma)
 * Hệ quả: BOQ/Present muốn hỏi "số này đo được hay máy đoán?" phải tự dịch từng bộ, và mỗi nơi
 * dịch một kiểu. File này KHÔNG thay bộ nào (đổi tên = vỡ persist, B3 Blueprint) — chỉ là
 * BỘ DỊCH một chiều về một thang chung, để nơi tiêu thụ hỏi đúng MỘT câu: `isVerifiedQuantity`.
 *
 * NĂM NẤC (đúng đề bài slice 5): `declared` · `catalog-approved` · `user-override` · `inferred` ·
 * `unknown`. Ba nấc đầu = LỚP ĐÃ ĐẢM BẢO (có người/tài liệu/danh mục đứng sau) — được vào BOQ
 * (luật Hoà 15/08: "BOQ chỉ nhận số đo được"). Hai nấc sau = PROXY — hiện được, KHÔNG cộng tiền.
 *
 * LUẬT CỨNG (khoá bằng test):
 *   1. Máy KHÔNG BAO GIỜ tự sinh ra nấc đã-đảm-bảo. `sanitizeProvenance` hạ mọi provenance có
 *      `source.kind === 'machine'` mà khai nấc đảm bảo xuống `inferred` — inferred không thể
 *      "trôi" thành verified qua một lần copy.
 *   2. Nâng nấc từ proxy lên đảm bảo PHẢI có `by` (người ký) — `canTransition` từ chối nếu thiếu.
 *   3. Gộp nhiều nguồn cho MỘT con số = MẮT XÍCH YẾU NHẤT (`weakestAssurance`): một đầu vào
 *      inferred là cả kết quả inferred.
 *
 * File THUẦN: không React/DOM/Prisma/fetch — chạy bằng sucrase-node. Import type-only từ các
 * bộ từ vựng cũ để adapter không lệch khi bộ cũ đổi.
 */

import type { TrangThaiNguon } from './types';
import type { FfeConfidence } from '../ffe/item';
import type { SemanticProvenance } from '../cad/semantic-contract';

export const ASSURANCE_GRADES = [
  'declared',
  'catalog-approved',
  'user-override',
  'inferred',
  'unknown',
] as const;

export type AssuranceGrade = (typeof ASSURANCE_GRADES)[number];

export const ASSURANCE_LABEL: Record<AssuranceGrade, { vi: string; en: string }> = {
  declared: { vi: 'Khai báo / đo được', en: 'Declared / measured' },
  'catalog-approved': { vi: 'Danh mục đã duyệt', en: 'Catalog-approved' },
  'user-override': { vi: 'Người sửa tay', en: 'User override' },
  inferred: { vi: 'Máy suy đoán', en: 'Inferred' },
  unknown: { vi: 'Chưa rõ nguồn', en: 'Unknown' },
};

export function isAssuranceGrade(x: unknown): x is AssuranceGrade {
  return typeof x === 'string' && (ASSURANCE_GRADES as readonly string[]).includes(x);
}

/** Ba nấc đầu là LỚP ĐÃ ĐẢM BẢO — BOQ/Present được cộng tiền. `inferred`/`unknown` là proxy. */
export function isVerifiedQuantity(grade: AssuranceGrade): boolean {
  return grade === 'declared' || grade === 'catalog-approved' || grade === 'user-override';
}

export function isProxyQuantity(grade: AssuranceGrade): boolean {
  return !isVerifiedQuantity(grade);
}

/**
 * Ai đứng sau giá trị này. `machine` = máy sinh (vision/AI/suy luận) — KHÔNG BAO GIỜ được mang
 * nấc đảm bảo (luật 1). `external` = hệ ngoài là nguồn sự thật (ATLAS/Lark sync).
 */
export type ProvenanceSourceKind = 'human' | 'document' | 'catalog' | 'external' | 'machine' | 'unknown';

export interface ProvenanceSource {
  kind: ProvenanceSourceKind;
  /** id truy ngược được: entityId · ProductSpec.id · assetId · projectFileId · userId… */
  id?: string;
}

export interface Provenance {
  grade: AssuranceGrade;
  source: ProvenanceSource;
  /** người ký/sửa — BẮT BUỘC khi nấc là `user-override` hoặc khi nâng từ proxy lên đảm bảo. */
  by?: string;
  /** ISO 8601 — caller cấp (lib thuần không tự Date.now, test tất định). */
  at?: string;
  note?: string;
}

const VERIFIED_SOURCE_KINDS: readonly ProvenanceSourceKind[] = ['human', 'document', 'catalog', 'external'];

/** Provenance có tự mâu thuẫn không: nấc đảm bảo mà nguồn là máy/không rõ ⇒ mâu thuẫn. */
export function isProvenanceConsistent(p: Provenance): boolean {
  if (!isAssuranceGrade(p.grade)) return false;
  if (isVerifiedQuantity(p.grade)) {
    if (!VERIFIED_SOURCE_KINDS.includes(p.source.kind)) return false;
    if (p.grade === 'user-override' && !p.by) return false;
  }
  return true;
}

/**
 * Hạ provenance mâu thuẫn về nấc trung thực nhất: máy khai `declared` ⇒ `inferred`; nguồn
 * `unknown` mà khai đảm bảo ⇒ `unknown`; `user-override` không có `by` ⇒ `inferred`.
 * Trả về CÙNG object nếu đã nhất quán (không clone thừa).
 */
export function sanitizeProvenance(p: Provenance): Provenance {
  if (isProvenanceConsistent(p)) return p;
  if (!isAssuranceGrade(p.grade)) return { ...p, grade: 'unknown' };
  if (p.source.kind === 'machine') return { ...p, grade: 'inferred' };
  if (p.source.kind === 'unknown') return { ...p, grade: 'unknown' };
  // nguồn hợp lệ nhưng thiếu người ký cho user-override
  return { ...p, grade: 'inferred' };
}

/** Dựng provenance đã qua `sanitizeProvenance` — cửa duy nhất nên dùng khi tạo mới. */
export function provenance(
  grade: AssuranceGrade,
  source: ProvenanceSource,
  extra: Pick<Provenance, 'by' | 'at' | 'note'> = {},
): Provenance {
  const p: Provenance = { grade, source };
  if (extra.by) p.by = extra.by;
  if (extra.at) p.at = extra.at;
  if (extra.note) p.note = extra.note;
  return sanitizeProvenance(p);
}

/**
 * Nâng/hạ nấc có hợp lệ không. Hạ luôn được (trung thực hơn không cần ai ký). Nâng từ proxy
 * (`inferred`/`unknown`) lên đảm bảo PHẢI có người ký (`actor.by`). Đổi giữa các nấc đảm bảo
 * với nhau (declared ↔ catalog-approved ↔ user-override) cũng cần người ký vì đó là đổi CHỦ
 * THỂ chịu trách nhiệm.
 */
export function canTransition(from: AssuranceGrade, to: AssuranceGrade, actor?: { by?: string }): boolean {
  if (from === to) return true;
  if (!isVerifiedQuantity(to)) return true; // hạ về proxy: luôn cho phép
  return typeof actor?.by === 'string' && actor.by.trim().length > 0;
}

/**
 * Mắt xích yếu nhất — dùng khi MỘT con số gộp từ nhiều đầu vào (m² = tổng vùng tô, tiền = qty ×
 * giá). Thứ tự yếu→mạnh: unknown < inferred < (lớp đảm bảo). Trong lớp đảm bảo, nếu trộn nhiều
 * nấc thì trả nấc "có người can thiệp gần nhất": user-override > declared > catalog-approved —
 * vì đó là nấc người đọc cần biết để truy ai đã sửa.
 */
export function weakestAssurance(grades: readonly AssuranceGrade[]): AssuranceGrade {
  if (grades.length === 0) return 'unknown';
  if (grades.includes('unknown')) return 'unknown';
  if (grades.includes('inferred')) return 'inferred';
  if (grades.includes('user-override')) return 'user-override';
  if (grades.includes('declared')) return 'declared';
  return 'catalog-approved';
}

/* ═══════════════ ADAPTER TỪ CÁC BỘ TỪ VỰNG ĐANG CHẠY (một chiều, không đổi tên bộ nào) ═══════ */

/**
 * `TrangThaiNguon` (DistillEngine / Thẻ DNA / AssetRepresentation.truthLevel):
 *   measured → declared · inferred → inferred · verified → user-override nếu nguồn có `'manual'`
 *   (người gõ đè), ngược lại declared (người xác nhận thứ đã có nguồn).
 * Chuỗi lạ (truthLevel là cột chuỗi tự do) → unknown, KHÔNG đoán.
 */
export function fromTrangThaiNguon(t: TrangThaiNguon | string | null | undefined, nguon: readonly string[] = []): AssuranceGrade {
  if (t === 'measured') return 'declared';
  if (t === 'inferred') return 'inferred';
  if (t === 'verified') return nguon.includes('manual') ? 'user-override' : 'declared';
  return 'unknown';
}

/**
 * `FfeConfidence` + `FfeSource` của một món rời:
 *   measured → declared · inferred → inferred · manual → user-override khi món KHÔNG do người tạo
 *   tay từ đầu (source vision/library/import — tức người đã SỬA số máy/bảng đưa ra), declared khi
 *   source = 'manual' (người khai từ đầu, không có gì để "đè").
 * Thiếu `confidence` ⇒ suy từ `source`: vision → inferred (máy đo chưa ai xác nhận) · manual/import
 * → declared (người/tài liệu khai) · library → catalog-approved nếu spec danh mục đã duyệt,
 * ngược lại declared (block/idfc thư viện là dữ liệu khai sẵn, không phải máy đoán).
 */
export function fromFfeConfidence(
  confidence: FfeConfidence | undefined,
  source: 'manual' | 'import' | 'vision' | 'library' | undefined,
  catalogVerified = false,
): AssuranceGrade {
  if (confidence === 'measured') return 'declared';
  if (confidence === 'inferred') return 'inferred';
  if (confidence === 'manual') return source && source !== 'manual' ? 'user-override' : 'declared';
  switch (source) {
    case 'vision':
      return 'inferred';
    case 'manual':
    case 'import':
      return 'declared';
    case 'library':
      return catalogVerified ? 'catalog-approved' : 'declared';
    default:
      return 'unknown';
  }
}

/** `SemanticProvenance` (2D→3D): declared → declared · inferred → inferred · derived → inferred
 * (hình học chỉ để chiếu, không có entity để đếm — KHÔNG được vào BOQ). */
export function fromSemanticProvenance(p: SemanticProvenance): AssuranceGrade {
  return p === 'declared' ? 'declared' : 'inferred';
}

/** `ProductSpec` (danh mục): `verified === true` → catalog-approved (IF/studio đã duyệt); ngược lại
 * declared — bản ghi danh mục là khai báo của studio hoặc hệ ngoài (Lark), không phải máy đoán. */
export function fromProductSpec(spec: { verified?: boolean | null } | null | undefined): AssuranceGrade {
  if (!spec) return 'unknown';
  return spec.verified === true ? 'catalog-approved' : 'declared';
}

/** BOQ override (`lib/present-editor/boq-overrides.ts`) — luôn là người sửa tay. */
export function fromBoqOverride(): AssuranceGrade {
  return 'user-override';
}
