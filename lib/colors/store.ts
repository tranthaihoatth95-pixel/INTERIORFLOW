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
import { createStudioBlobStore } from '../storage/studio-persist';

/** Key localStorage CŨ — W0.3 (19/08): chỉ đọc làm cầu di trú sang IndexedDB, không ghi mới. */
const STUDIO_KEY = 'interiorflow.colorSources';
const PROJECT_FILE = 'colors.json';

/* ═══════════════════════ TẦNG STUDIO (IndexedDB, W0.3 — trước là localStorage) ═══════════════
 * FINAL-AUDIT A-4: bảng màu studio là TÀI SẢN — clear-site-data trên localStorage là mất vĩnh
 * viễn, và bảng vài nghìn màu vỡ trần ~5MB là chuyện thật (comment cũ tự khai). Dời xuống IDB
 * qua `studio-persist` (tái dùng DB `interiorflow-sheets`). Chữ ký public GIỮ NGUYÊN (sync). */

function parseList(v: unknown): ColorSource[] | undefined {
  if (!Array.isArray(v)) return undefined;
  return v.map(parseColorSource).filter((s): s is ColorSource => s !== null);
}

const studioStore = createStudioBlobStore<ColorSource[]>({
  route: '/studio-colors',
  readLegacy: () => {
    if (typeof window === 'undefined') return undefined;
    try {
      return parseList(JSON.parse(localStorage.getItem(STUDIO_KEY) || 'null'));
    } catch {
      return undefined; // JSON hỏng — coi như chưa có, KHÔNG ném
    }
  },
  empty: [],
  parse: parseList,
});

/** Chờ IDB nạp xong (màn Thư viện màu await rồi đọc lại nếu cần dữ liệu tươi nhất). */
export function hydrateStudioColorSources(): Promise<void> {
  return studioStore.hydrate();
}

export function listStudioColorSources(): ColorSource[] {
  return studioStore.get();
}

function writeStudio(list: ColorSource[]): boolean {
  if (typeof window === 'undefined') return false;
  studioStore.set(list);
  // IDB trần theo đĩa — quota gần như không còn là ca thật; flush async, lỗi im lặng như
  // sheets-persist. Trả true = đã nhận vào cache (caller cũ đọc lại thấy ngay).
  return true;
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

/** Gói xuất bảng màu studio — versioned, để nút backup/đem-máy-khác gọi (W0.3, luật 7). */
export interface StudioColorsExport {
  version: 1;
  exportedAt: number;
  sources: ColorSource[];
}

export function exportStudioColorSourcesJson(): string {
  const pkg: StudioColorsExport = { version: 1, exportedAt: Date.now(), sources: listStudioColorSources() };
  return JSON.stringify(pkg, null, 2);
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
