'use client';

/**
 * lib/colors/store.ts — VIỆC 1: NƠI CẤT bảng màu. Hai tầng, đúng yêu cầu "lưu theo dự án VÀ theo
 * studio":
 *
 *   • **studio** → `localStorage` của máy đó. Bảng dùng chung cho mọi dự án (bảng NCC ruột, bảng
 *     nội bộ studio tự đo). Cùng pattern `lib/present-editor/brand-kit.ts` (đọc/ghi JSON, guard
 *     `window`, hỏng thì coi như rỗng chứ không ném).
 *   • **dự án** → tệp `colors.json` trong THƯ MỤC DỰ ÁN trên đĩa, qua `lib/root-folder.ts`.
 *     Cùng pattern `brand-kit-disk.ts`: đi theo dự án khi copy/gửi máy khác, và **trả LÝ DO CỤ
 *     THỂ khi ghi hỏng** chứ không `boolean` mập mờ (sự cố mất-dữ-liệu-im-lặng 31/07).
 *
 * ⛔ KHÔNG có tầng thứ ba "bảng cài sẵn theo app". Đó là cả điểm của việc này — xem `types.ts`.
 *
 * Vì sao KHÔNG dựng bảng Prisma: (a) `CLAUDE.md` cấm chạy `prisma db push`/`migrate` qua sandbox
 * nên không thể tạo migration trong phiên code; (b) K4 "field mới chỉ thêm khi ĐÃ CÓ nơi tiêu
 * thụ" — bảng màu hiện chỉ có 1 nơi dùng, chưa cần chia sẻ giữa nhiều người; (c) đĩa là nguồn sự
 * thật cho dữ liệu ĐI THEO DỰ ÁN (`QUYET-DINH-HA-TANG-2026-07-31.md` ①B). Muốn lên server sau
 * này thì thêm một `ColorSourceStore` thứ ba, KHÔNG phải sửa nơi gọi.
 */

import { getProjectFolderHandle, writeTextFile, readTextFile, type FolderAccessFailure } from '../root-folder';
import { parseColorSource, type ColorSource, type ProjectColorFile } from './types';

const STUDIO_KEY = 'interiorflow.colorSources';
const PROJECT_FILE = 'colors.json';

/* ═══════════════════════ TẦNG STUDIO (localStorage) ═══════════════════════ */

export function listStudioColorSources(): ColorSource[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = JSON.parse(localStorage.getItem(STUDIO_KEY) || '[]');
    if (!Array.isArray(raw)) return [];
    return raw.map(parseColorSource).filter((s): s is ColorSource => s !== null);
  } catch {
    return []; // JSON hỏng — coi như chưa có, KHÔNG ném (một tệp hỏng không được chặn cả app)
  }
}

function writeStudio(list: ColorSource[]): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(STUDIO_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false; // localStorage đầy (bảng vài nghìn màu là thật) — caller PHẢI báo người dùng
  }
}

/** Thêm/ghi đè theo `id`. Trả `false` khi không ghi được (quota) — caller phải hiện lỗi, đừng nuốt. */
export function saveStudioColorSource(source: ColorSource): boolean {
  const list = listStudioColorSources().filter((s) => s.id !== source.id);
  list.push({ ...source, scope: 'studio', projectId: undefined });
  return writeStudio(list);
}

export function removeStudioColorSource(id: string): boolean {
  return writeStudio(listStudioColorSources().filter((s) => s.id !== id));
}

/* ═══════════════════════ TẦNG DỰ ÁN (tệp trong thư mục dự án) ═══════════════════════ */

export type WriteColorsResult = { ok: true } | { ok: false; reason: FolderAccessFailure | 'write-failed' };

export async function readProjectColorSources(projectId: string, projectName: string): Promise<ColorSource[]> {
  const res = await getProjectFolderHandle(projectId, projectName, { create: false });
  if (!res.ok) return []; // chưa bật lưu trữ thư mục — im lặng ĐÚNG, tính năng opt-in
  const text = await readTextFile(res.dir, PROJECT_FILE);
  if (!text) return [];
  try {
    const j = JSON.parse(text) as Partial<ProjectColorFile>;
    if (!Array.isArray(j?.sources)) return [];
    return j.sources
      .map(parseColorSource)
      .filter((s): s is ColorSource => s !== null)
      .map((s) => ({ ...s, scope: 'project' as const, projectId }));
  } catch {
    return [];
  }
}

export async function writeProjectColorSources(
  projectId: string,
  projectName: string,
  sources: ColorSource[],
): Promise<WriteColorsResult> {
  const res = await getProjectFolderHandle(projectId, projectName, { create: true });
  if (!res.ok) return res;
  const payload: ProjectColorFile = {
    version: 1,
    exportedAt: Date.now(),
    sources: sources.map((s) => ({ ...s, scope: 'project', projectId })),
  };
  const wrote = await writeTextFile(res.dir, PROJECT_FILE, JSON.stringify(payload, null, 2));
  return wrote ? { ok: true } : { ok: false, reason: 'write-failed' };
}

/** Thêm/ghi đè 1 nguồn trong tệp dự án (đọc-sửa-ghi cả tệp — vài chục nguồn là cùng). */
export async function saveProjectColorSource(
  projectId: string,
  projectName: string,
  source: ColorSource,
): Promise<WriteColorsResult> {
  const cur = await readProjectColorSources(projectId, projectName);
  return writeProjectColorSources(projectId, projectName, [...cur.filter((s) => s.id !== source.id), source]);
}

export async function removeProjectColorSource(
  projectId: string,
  projectName: string,
  id: string,
): Promise<WriteColorsResult> {
  const cur = await readProjectColorSources(projectId, projectName);
  return writeProjectColorSources(projectId, projectName, cur.filter((s) => s.id !== id));
}
