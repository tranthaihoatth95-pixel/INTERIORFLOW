/**
 * lib/present-editor/idfp.ts — B2 (31/07, ĐỢT B lớp lưu trữ, mã `4.1.b`): định dạng ".idfp"
 * (KHÔNG phải binary mới — JSON schema versioned, ĐÚNG khuôn `lib/cad/idf.ts`) chứa toàn bộ
 * deck (slide/bố cục/ảnh nhúng/font nhúng-theo-deck/khổ trình bày per-sheet) của TẤT CẢ sheet
 * trong project Present hiện tại. Vai trò tương đương `.idf` của chặng CAD — file rời để
 * export/tải xuống/chia sẻ/backup, KHÁC autosave nội bộ IndexedDB (`lib/sheets-persist.ts`,
 * không đụng).
 *
 * Trước B2, chặng 3 (Present) KHÔNG CÓ đường xuất file rời nào — deck chỉ sống trong
 * IndexedDB (`docs/QUYET-DINH-HA-TANG-2026-07-31.md` §②/⑥). `.idfp` lấp lỗ đó.
 *
 * BẮT BUỘC mang theo (Hoà chỉ đích danh, 31/07) — tất cả đã nằm SẴN trong `EditorDeck`
 * (`lib/present-editor/model.ts`), nên serialize NGUYÊN VẸN cả object `deck` (không hand-pick
 * field, tránh bỏ sót) là đủ:
 *  · slide + bố cục          → `deck.slides` (đã có)
 *  · ảnh nhúng (dataURL)      → `ImageElement.src` (dataURL khi upload qua FileReader — mọi nơi
 *                               upload trong Present đều `readAsDataURL`, xác nhận grep 31/07)
 *  · font nhúng-theo-deck     → `deck.customFonts` (EmbeddedFont[], đã có dataURL base64 sẵn)
 *  · khổ trình bày per-sheet  → `deck.stagePreset` (mỗi sheet 1 deck riêng, tự mang theo)
 *
 * Brand Kit KHÔNG nằm trong `EditorDeck` (sống riêng ở localStorage toàn cục, xem
 * `lib/present-editor/brand-kit.ts`) — palette/fonts/watermark deck đã COPY giá trị vào deck
 * lúc tạo (`seedDeckWithBrandKit`, không phải id tham chiếu), nhưng Hoà yêu cầu thêm 1 bản CHỤP
 * rõ ràng ở cấp file (giống `.idf` nhúng `studioName` — chuỗi đã chốt, không phải tra lại Brand
 * Kit "đang chọn" lúc SAU NÀY mở file, vì lúc đó có thể đã đổi/xoá kit). `brandKitSnapshot` do
 * NGƯỜI GỌI (UI) đọc `getActiveBrandKit()` TẠI THỜI ĐIỂM XUẤT rồi truyền vào — file này giữ
 * THUẦN (không đụng localStorage/DOM), đúng triết lý `idf.ts` ("test round-trip độc lập").
 */

import type { EditorDeck } from './model';
import type { BrandKit } from './brand-kit';
import { IDF_APP_VERSION } from '../cad/idf';

export const IDFP_VERSION = 1 as const;

let currentIdfpVersion: number = IDFP_VERSION;

/** CHỈ DÙNG TRONG TEST — cùng khuôn `__setCurrentIdfVersionForTest` (`lib/cad/idf.ts`). */
export function __setCurrentIdfpVersionForTest(v: number) {
  currentIdfpVersion = v;
}

/** Bảng nâng cấp — cùng khuôn `IDF_MIGRATIONS`. Mới có v1 nên khoá `1` chỉ là KHUNG identity. */
const IDFP_MIGRATIONS: Record<number, (f: Record<string, unknown>) => Record<string, unknown>> = {
  1: (f) => ({ ...f, idfpVersion: 2 }),
};

export function migrateIdfp(
  file: unknown,
  fromVersion: number,
  toVersion: number = currentIdfpVersion,
): IdfpFile | null {
  if (!isPlainObject(file)) return null;
  if (fromVersion > toVersion) return null;
  let cur: Record<string, unknown> = file;
  let v = fromVersion;
  while (v < toVersion) {
    const step = IDFP_MIGRATIONS[v];
    if (!step) return null;
    cur = step(cur);
    v += 1;
  }
  return cur as unknown as IdfpFile;
}

let lastImportError: string | null = null;
export function lastImportIdfpError(): string | null {
  return lastImportError;
}

/** 1 sheet trong project Present — id/name khớp SheetTab (components/studio/SheetTabBar) + deck đầy đủ. */
export interface IdfpSheetData {
  id: string;
  name: string;
  deck: EditorDeck;
}

export interface IdfpMeta {
  projectName: string;
  createdAt: string; // ISO 8601
  modifiedAt: string; // ISO 8601
  appVersion: string;
}

export interface IdfpFile {
  idfpVersion: 1;
  meta: IdfpMeta;
  /** Bản CHỤP Brand Kit đang active LÚC XUẤT — snapshot, KHÔNG phải id tham chiếu sống.
   * `null` nếu chưa có Brand Kit nào lúc xuất. */
  brandKitSnapshot: BrandKit | null;
  sheets: IdfpSheetData[];
}

export interface ParsedIdfp {
  meta: IdfpMeta;
  brandKitSnapshot: BrandKit | null;
  sheets: IdfpSheetData[];
}

/**
 * Xuất bộ sheet Present → chuỗi JSON `.idfp`. `brandKitSnapshot` do caller đọc SẴN từ
 * `getActiveBrandKit()` ngay trước khi gọi hàm này (giữ hàm THUẦN, không tự đụng localStorage).
 */
export function exportIdfp(
  sheets: IdfpSheetData[],
  brandKitSnapshot: BrandKit | null,
  meta?: Partial<IdfpMeta>,
): string {
  const now = new Date().toISOString();
  const file: IdfpFile = {
    idfpVersion: IDFP_VERSION,
    meta: {
      projectName: meta?.projectName?.trim() || 'InteriorFlow project',
      createdAt: meta?.createdAt || now,
      modifiedAt: now,
      appVersion: meta?.appVersion || IDF_APP_VERSION,
    },
    brandKitSnapshot,
    sheets,
  };
  try {
    return JSON.stringify(file);
  } catch {
    // Payload có field không serialize được (hiếm) — loại sheet lỗi thay vì crash toàn bộ
    // export, cùng triết lý "im lặng khi lỗi" của exportIdf/sheets-persist.
    const safeSheets = sheets.filter((s) => {
      try {
        JSON.stringify(s);
        return true;
      } catch {
        return false;
      }
    });
    return JSON.stringify({ ...file, sheets: safeSheets });
  }
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Deck hợp lệ tối thiểu: `slides` là mảng, có `id` (nội dung element không kiểm sâu — cùng mức
 * khoan dung `isValidDoc` của idf.ts với entity CAD "lạ"). */
function isValidDeck(v: unknown): v is EditorDeck {
  if (!isPlainObject(v)) return false;
  return typeof v.id === 'string' && Array.isArray(v.slides);
}

function isValidBrandKitSnapshot(v: unknown): v is BrandKit | null {
  if (v === null) return true;
  if (!isPlainObject(v)) return false;
  return typeof v.id === 'string' && typeof v.name === 'string' && Array.isArray(v.palette);
}

/**
 * Đọc chuỗi JSON `.idfp` → `{ meta, brandKitSnapshot, sheets }` hoặc `null` nếu file hỏng/sai
 * định dạng (KHÔNG throw — an toàn gọi trực tiếp từ UI). Cùng khuôn `importIdf`.
 */
export function importIdfp(json: string): ParsedIdfp | null {
  lastImportError = null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (!isPlainObject(parsed)) return null;

  const fileVersion = parsed.idfpVersion;
  if (typeof fileVersion !== 'number') return null;

  let file: Record<string, unknown> = parsed;
  if (fileVersion !== currentIdfpVersion) {
    if (fileVersion > currentIdfpVersion) {
      lastImportError = 'File tạo bởi bản IF mới hơn. Cập nhật app để mở file này.';
      return null;
    }
    const migrated = migrateIdfp(file, fileVersion);
    if (!migrated) {
      lastImportError = 'Không nâng cấp được file .idfp từ phiên bản cũ này.';
      return null;
    }
    file = migrated as unknown as Record<string, unknown>;
  }
  if (!Array.isArray(file.sheets)) return null;

  const sheets: IdfpSheetData[] = [];
  for (const raw of file.sheets) {
    if (!isPlainObject(raw)) continue;
    if (typeof raw.id !== 'string' || typeof raw.name !== 'string') continue;
    if (!isValidDeck(raw.deck)) continue;
    sheets.push({ id: raw.id, name: raw.name, deck: raw.deck });
  }
  if (!sheets.length) return null;

  const rawMeta = isPlainObject(file.meta) ? file.meta : {};
  const meta: IdfpMeta = {
    projectName: typeof rawMeta.projectName === 'string' ? rawMeta.projectName : 'InteriorFlow project',
    createdAt: typeof rawMeta.createdAt === 'string' ? rawMeta.createdAt : new Date().toISOString(),
    modifiedAt: typeof rawMeta.modifiedAt === 'string' ? rawMeta.modifiedAt : new Date().toISOString(),
    appVersion: typeof rawMeta.appVersion === 'string' ? rawMeta.appVersion : 'unknown',
  };

  const brandKitSnapshot = isValidBrandKitSnapshot(file.brandKitSnapshot) ? file.brandKitSnapshot : null;

  return { meta, brandKitSnapshot, sheets };
}
