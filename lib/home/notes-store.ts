/**
 * lib/home/notes-store.ts — [marker: DongStudio] "Ghi chú nhanh kiểu Tot" (phiếu
 * docs/phieu-giao/home-dong-studio.md, việc ④.8) — LƯU JSON PER-USER, KHÔNG BẢNG DB MỚI
 * (CẤM tuyệt đối sửa `prisma/schema.prisma`, y hệt ràng buộc `lib/dna/store.ts`).
 *
 * Ghi 1 file JSON tại `uploads/home-notes/<userId>.json` chứa TOÀN BỘ ghi chú nhanh của
 * user đó (không phải per-project — ghi chú Home xuyên dự án, chỉ GẮN THẺ dự án tuỳ chọn).
 *
 * SERVER ONLY (`fs/promises`) — KHÔNG import từ component `'use client'`. Route
 * `app/api/home/notes/route.ts` là nơi gọi duy nhất. Phần THUẦN (parse/serialize) tách riêng
 * để test bằng sucrase-node — xem `lib/home/notes-store.test.ts`.
 */

import { promises as fs } from 'fs';
import path from 'path';

const NOTES_ROOT = path.join(process.cwd(), 'uploads', 'home-notes');

/** Số ghi chú tối đa giữ lại — đây là "ghi chú nhanh" (Tot), không phải kho lưu trữ vô hạn. */
const MAX_NOTES = 40;

export interface HomeNote {
  id: string;
  /** Gắn thẻ dự án tuỳ chọn — null = ghi chú chung, không thuộc dự án nào. */
  projectId: string | null;
  text: string;
  createdAt: string; // ISO
}

interface StoredFile {
  notes: HomeNote[];
}

function isHomeNote(v: unknown): v is HomeNote {
  if (!v || typeof v !== 'object') return false;
  const n = v as Record<string, unknown>;
  return (
    typeof n.id === 'string' &&
    n.id.length > 0 &&
    (n.projectId === null || typeof n.projectId === 'string') &&
    typeof n.text === 'string' &&
    n.text.trim().length > 0 &&
    typeof n.createdAt === 'string' &&
    !Number.isNaN(new Date(n.createdAt).getTime())
  );
}

/** Phần THUẦN — parse nội dung file thành danh sách ghi chú hợp lệ; bản ghi hỏng bị lọc bỏ
 * thay vì làm hỏng cả file (cùng nguyên tắc `lib/dna/store.ts`). */
export function parseNotesFile(raw: string): HomeNote[] {
  if (!raw.trim()) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  const list = Array.isArray((parsed as StoredFile)?.notes) ? (parsed as StoredFile).notes : [];
  return list.filter(isHomeNote);
}

/** Phần THUẦN — serialize, giữ tối đa `MAX_NOTES` bản MỚI NHẤT (theo thứ tự truyền vào, đầu mảng = mới nhất). */
export function serializeNotesFile(notes: readonly HomeNote[]): string {
  const payload: StoredFile = { notes: notes.slice(0, MAX_NOTES) };
  return JSON.stringify(payload, null, 2);
}

function fileFor(userId: string): string {
  const safe = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(NOTES_ROOT, `${safe}.json`);
}

export async function readHomeNotes(userId: string): Promise<HomeNote[]> {
  try {
    const raw = await fs.readFile(fileFor(userId), 'utf8');
    return parseNotesFile(raw);
  } catch {
    return []; // chưa từng ghi = chưa có ghi chú nào, hợp lệ
  }
}

/** Thêm 1 ghi chú vào ĐẦU danh sách (mới nhất trước) → trả toàn bộ danh sách sau khi ghi. */
export async function appendHomeNote(
  userId: string,
  note: Omit<HomeNote, 'id' | 'createdAt'> & { id?: string; createdAt?: string },
): Promise<HomeNote[]> {
  const existing = await readHomeNotes(userId);
  const full: HomeNote = {
    id: note.id ?? `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    projectId: note.projectId,
    text: note.text,
    createdAt: note.createdAt ?? new Date().toISOString(),
  };
  const next = [full, ...existing];
  const file = fileFor(userId);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, serializeNotesFile(next), 'utf8');
  return next.slice(0, MAX_NOTES);
}

export async function deleteHomeNote(userId: string, noteId: string): Promise<HomeNote[]> {
  const next = (await readHomeNotes(userId)).filter((n) => n.id !== noteId);
  const file = fileFor(userId);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, serializeNotesFile(next), 'utf8');
  return next;
}
