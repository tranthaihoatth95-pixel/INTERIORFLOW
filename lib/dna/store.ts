/**
 * lib/dna/store.ts — LƯU TRỮ Thẻ DNA, KHÔNG BẢNG DB MỚI (phiếu ④.3, CẤM tuyệt đối sửa
 * `prisma/schema.prisma`).
 *
 * Theo ĐÚNG pattern JSON-per-project đã có trong repo (`app/api/notebook/[projectId]/source/route.ts`
 * dùng `path.join(UPLOAD_ROOT, projectId)`; `app/api/comments/route.ts` dùng file JSON gọn cho
 * dữ liệu không cần quan hệ/DB) — ghi 1 file JSON tại `uploads/dna/<projectId>/cards.json`,
 * chứa TOÀN BỘ danh sách Thẻ DNA của dự án đó (N thẻ/dự án).
 *
 * SERVER ONLY (dùng `fs/promises`) — KHÔNG import file này từ component `'use client'`. Route
 * `app/api/projects/[id]/dna/route.ts` là nơi gọi duy nhất.
 *
 * Phần THUẦN (encode/decode JSON, không đụng đĩa) tách riêng để test bằng sucrase-node —
 * xem `lib/dna/store.test.ts`.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { isDesignDnaCard, type DesignDnaCard } from './types';

const DNA_ROOT = path.join(process.cwd(), 'uploads', 'dna');

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

function fileFor(projectId: string): string {
  // projectId đi qua Prisma trước khi tới đây (route đã `assertProjectAccess`) nhưng vẫn
  // chặn path traversal ở tầng thấp nhất — không tin bất kỳ input nào chạm tới `fs`.
  const safe = projectId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(DNA_ROOT, safe, 'cards.json');
}

export async function readDnaCards(projectId: string): Promise<DesignDnaCard[]> {
  try {
    const raw = await fs.readFile(fileFor(projectId), 'utf8');
    return parseCardsFile(raw);
  } catch {
    return []; // chưa từng có file = dự án chưa có Thẻ DNA nào, hợp lệ (khuôn X2)
  }
}

async function writeDnaCards(projectId: string, cards: readonly DesignDnaCard[]): Promise<void> {
  const file = fileFor(projectId);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, serializeCardsFile(cards), 'utf8');
}

/** Upsert 1 thẻ theo `id` (thêm mới nếu chưa có, đè nếu đã có) → trả về TOÀN BỘ danh sách
 * sau khi ghi. `card.projectId` PHẢI khớp `projectId` tham số (route kiểm trước khi gọi). */
export async function upsertDnaCard(projectId: string, card: DesignDnaCard): Promise<DesignDnaCard[]> {
  const cards = await readDnaCards(projectId);
  const idx = cards.findIndex((c) => c.id === card.id);
  if (idx >= 0) cards[idx] = card;
  else cards.push(card);
  await writeDnaCards(projectId, cards);
  return cards;
}

export async function deleteDnaCard(projectId: string, cardId: string): Promise<DesignDnaCard[]> {
  const cards = (await readDnaCards(projectId)).filter((c) => c.id !== cardId);
  await writeDnaCards(projectId, cards);
  return cards;
}
