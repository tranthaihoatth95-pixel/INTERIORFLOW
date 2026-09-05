/**
 * lib/dna/store.ts — LƯU TRỮ Thẻ DNA, KHÔNG BẢNG DB MỚI (phiếu ④.3, CẤM tuyệt đối sửa
 * `prisma/schema.prisma`).
 *
 * Theo ĐÚNG pattern JSON-per-project đã có trong repo (`app/api/notebook/[projectId]/source/route.ts`
 * dùng `path.join(UPLOAD_ROOT, projectId)`; `app/api/comments/route.ts` dùng file JSON gọn cho
 * dữ liệu không cần quan hệ/DB) — ghi 1 file JSON tại `uploads/dna/<projectId>/cards.json`,
 * chứa TOÀN BỘ danh sách Thẻ DNA của dự án đó (N thẻ/dự án).
 *
 * ⭐ SLICE 5 (02/09) — CÓ SỔ PHIÊN BẢN + GHI NGUYÊN TỬ, qua `lib/storage/revisioned-json-file.ts`:
 *   · `cards.json` GIỮ NGUYÊN định dạng (reader cũ không đổi) — nay ghi tmp+rename, không còn
 *     file nửa chừng khi crash giữa `writeFile`.
 *   · `ledger.json` + `revisions/<revisionId>.json` — mỗi upsert/delete là một entry, khôi phục
 *     bằng `restoreDnaRevision` (entry mới, không cắt lịch sử). `objectId` trong sổ là UUID bền
 *     của "bộ thẻ DNA dự án này", độc lập projectId/route/UI.
 *   · Thẻ trong file vẫn mang `trangThai` 3 nấc; nơi tiêu thụ đọc thang chung qua
 *     `fromTrangThaiNguon` (`lib/distill/assurance.ts`) — store KHÔNG nâng nấc, chỉ ghi đúng thứ
 *     route đã kiểm.
 *
 * SERVER ONLY (dùng `fs/promises`) — KHÔNG import file này từ component `'use client'`. Route
 * `app/api/projects/[id]/dna/route.ts` là nơi gọi duy nhất.
 *
 * Phần THUẦN (encode/decode JSON, không đụng đĩa) tách riêng để test bằng sucrase-node —
 * xem `lib/dna/store.test.ts`; phần đĩa thật xem `lib/dna/store-revisions.test.ts`.
 */

import path from 'path';
import { openRevisionedJsonFile, type RevisionedJsonStore } from '../storage/revisioned-json-file';
import type { RevisionEntry, RevisionLedger } from '../storage/revision-ledger';
import { isDesignDnaCard, type DesignDnaCard } from './types';

let DNA_ROOT = path.join(process.cwd(), 'uploads', 'dna');

/** Test-only: trỏ kho sang thư mục tạm — KHÔNG đụng `uploads/dna` thật khi chạy test. */
export function __setDnaRootForTest(dir: string): void {
  DNA_ROOT = dir;
}

interface StoredFile {
  cards: DesignDnaCard[];
}

/** Phần THUẦN — parse nội dung file (hoặc chuỗi rỗng khi file chưa tồn tại) thành danh sách
 * thẻ hợp lệ. Thẻ hỏng (không qua `isDesignDnaCard`) bị LỌC BỎ thay vì làm hỏng cả file —
 * một bản ghi rác không được kéo sập cả dự án. */
export function parseCardsFile(raw: string): DesignDnaCard[] {
  if (!raw.trim()) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  const list = Array.isArray((parsed as StoredFile)?.cards) ? (parsed as StoredFile).cards : [];
  return list.filter(isDesignDnaCard);
}

/** Phần THUẦN — serialize danh sách thẻ ra JSON ổn định (khoá `cards`, 2-space indent để
 * người/agent đọc file trực tiếp cũng dễ soi, cùng tinh thần `comments-review.json`). */
export function serializeCardsFile(cards: readonly DesignDnaCard[]): string {
  const payload: StoredFile = { cards: [...cards] };
  return JSON.stringify(payload, null, 2);
}

function dirFor(projectId: string): string {
  // projectId đi qua Prisma trước khi tới đây (route đã `assertProjectAccess`) nhưng vẫn
  // chặn path traversal ở tầng thấp nhất — không tin bất kỳ input nào chạm tới `fs`.
  const safe = projectId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(DNA_ROOT, safe);
}

function storeFor(projectId: string): RevisionedJsonStore<DesignDnaCard[]> {
  return openRevisionedJsonFile<DesignDnaCard[]>({
    dir: dirFor(projectId),
    fileName: 'cards.json',
    subject: { kind: 'dna-cards', key: projectId },
    parse: parseCardsFile,
    serialize: serializeCardsFile,
  });
}

/** Ai ghi + lúc nào — route truyền `by = user.id`; thiếu thì sổ KHÔNG bịa. */
export interface DnaWriteMeta {
  by?: string;
  at?: string;
}

export async function readDnaCards(projectId: string): Promise<DesignDnaCard[]> {
  try {
    return (await storeFor(projectId).read()) ?? [];
  } catch {
    return []; // chưa từng có file = dự án chưa có Thẻ DNA nào, hợp lệ (khuôn X2)
  }
}

/** Upsert 1 thẻ theo `id` (thêm mới nếu chưa có, đè nếu đã có) → trả về TOÀN BỘ danh sách
 * sau khi ghi. `card.projectId` PHẢI khớp `projectId` tham số (route kiểm trước khi gọi). */
export async function upsertDnaCard(projectId: string, card: DesignDnaCard, meta: DnaWriteMeta = {}): Promise<DesignDnaCard[]> {
  const store = storeFor(projectId);
  const cards = (await store.read()) ?? [];
  const idx = cards.findIndex((c) => c.id === card.id);
  if (idx >= 0) cards[idx] = card;
  else cards.push(card);
  await store.write(cards, { reason: 'upsert', ...meta });
  return cards;
}

export async function deleteDnaCard(projectId: string, cardId: string, meta: DnaWriteMeta = {}): Promise<DesignDnaCard[]> {
  const store = storeFor(projectId);
  const cards = ((await store.read()) ?? []).filter((c) => c.id !== cardId);
  await store.write(cards, { reason: 'delete', ...meta });
  return cards;
}

/** Sổ phiên bản của bộ thẻ — `null` khi dự án chưa từng ghi thẻ nào. */
export function listDnaRevisions(projectId: string): Promise<RevisionLedger | null> {
  return storeFor(projectId).ledger();
}

/** Khôi phục bộ thẻ về một phiên bản cũ — ghi entry MỚI (không cắt lịch sử). `null` = id lạ. */
export async function restoreDnaRevision(
  projectId: string,
  revisionId: string,
  meta: DnaWriteMeta = {},
): Promise<{ cards: DesignDnaCard[]; revision: RevisionEntry } | null> {
  const r = await storeFor(projectId).restore(revisionId, meta);
  return r ? { cards: r.value, revision: r.entry } : null;
}
