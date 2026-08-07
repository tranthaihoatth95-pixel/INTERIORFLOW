/**
 * lib/integrations/external-ref-core.ts — phần THUẦN của bảng cầu `ExternalRef` (L-EXT1, §0v).
 *
 * Tách khỏi `external-ref.ts` vì file kia chạm Prisma client: `npm test` chạy từng `*.test.ts`
 * bằng sucrase-node thuần (không resolve alias `@/`, và dựng `new PrismaClient()` là thừa cho
 * phép kiểm logic). Cùng lối `lib/print/radial.ts` vừa tách khỏi `.tsx`.
 */

/** Loại thực thể LÕI IDF được phép nối ra hệ ngoài. Chuỗi, không enum DB — thêm loại không migrate. */
export type ExternalEntityType = 'task' | 'project' | 'person' | 'material';

export interface ExternalRefKey {
  /** mã hệ ngoài do adapter khai (`lib/integrations/registry.ts`) — vd hệ bảng dữ liệu đang dùng. */
  system: string;
  /** id bản ghi BÊN HỆ NGOÀI. */
  externalId: string;
}

export interface CoreEntityKey {
  entityType: ExternalEntityType;
  entityId: string;
}

/**
 * Chuẩn hoá khoá: cắt khoảng trắng hai đầu, hạ chữ thường phần `system`.
 *
 * Vì sao `system` hạ chữ thường mà `externalId` KHÔNG: tên hệ là do MÌNH đặt (adapter khai), gõ
 * hoa/thường lung tung vẫn phải ra một hệ. Còn `externalId` là chuỗi của NGƯỜI TA — nhiều hệ
 * sinh id phân biệt hoa/thường (`recABC` ≠ `recabc`), hạ chữ thường là làm hỏng khoá.
 */
export function normalizeExternalKey(key: ExternalRefKey): ExternalRefKey {
  return { system: key.system.trim().toLowerCase(), externalId: key.externalId.trim() };
}

/** Khoá rỗng/toàn khoảng trắng là LỖI GỌI, không phải "không tìm thấy" — bắt sớm còn hơn ghi rác. */
export function isValidExternalKey(key: ExternalRefKey): boolean {
  const n = normalizeExternalKey(key);
  return n.system.length > 0 && n.externalId.length > 0;
}

export function isValidCoreKey(key: CoreEntityKey): boolean {
  return key.entityId.trim().length > 0;
}

/** Khoá tổng hợp `@@unique([system, externalId])` dưới dạng chuỗi — dùng để so sánh/log/dedupe. */
export function externalRefKeyString(key: ExternalRefKey): string {
  const n = normalizeExternalKey(key);
  return `${n.system}:${n.externalId}`;
}
