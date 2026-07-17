/**
 * lib/cad/idf.ts — Sprint 7 Việc 2: định dạng ".idf" (KHÔNG phải binary mới — file JSON có
 * schema versioned) chứa toàn bộ Doc (entities/layers/markups/photos) của TẤT CẢ sheet trong
 * project CAD hiện tại + metadata (tên project, ngày tạo/sửa, version app). Vai trò tương
 * đương ".dwg" của AutoCAD: file rời để export/tải xuống/chia sẻ/backup — KHÁC autosave nội bộ
 * IndexedDB (lib/sheets-persist.ts, vẫn giữ nguyên, không đụng).
 *
 * THUẦN (không React/DOM) — test round-trip độc lập, giống lib/cad/dxf.roundtrip.test.ts.
 *
 * Serialize-safety: JSON.stringify trước khi ghi (loại field không serialize được như function/
 * class), cùng nguyên tắc với saveSheets() trong lib/sheets-persist.ts — tái dùng ý tưởng đó
 * chứ không import trực tiếp (sheets-persist gắn với IndexedDB/user/route, idf.ts là file rời
 * không cần userId/route).
 */

import type { Doc } from './model';

export const IDF_VERSION = 1 as const;
/** Version app hiển thị trong metadata — cập nhật thủ công khi bump app version thật có ý nghĩa
 * (hiện chưa có nguồn version tập trung trong app — package.json version không public ở client). */
export const IDF_APP_VERSION = 'interiorflow-1.0.0';

/** 1 sheet trong project — id/name khớp SheetTab (components/studio/SheetTabBar) + Doc đầy đủ. */
export interface IdfSheetData {
  id: string;
  name: string;
  doc: Doc;
}

export interface IdfMeta {
  projectName: string;
  createdAt: string; // ISO 8601
  modifiedAt: string; // ISO 8601
  appVersion: string;
}

export interface IdfFile {
  idfVersion: 1;
  meta: IdfMeta;
  sheets: IdfSheetData[];
}

export interface ParsedIdf {
  meta: IdfMeta;
  sheets: IdfSheetData[];
}

/**
 * Xuất bộ sheet → chuỗi JSON .idf. `meta.createdAt` nên truyền vào từ lần export ĐẦU (nếu có,
 * VD lưu trong resume-state) để giữ đúng "ngày tạo" qua nhiều lần xuất — thiếu thì dùng luôn
 * thời điểm xuất hiện tại (chấp nhận được, tương đương "ngày tạo file" của lần export đầu).
 */
export function exportIdf(sheets: IdfSheetData[], meta?: Partial<IdfMeta>): string {
  const now = new Date().toISOString();
  const file: IdfFile = {
    idfVersion: IDF_VERSION,
    meta: {
      projectName: meta?.projectName?.trim() || 'InteriorFlow project',
      createdAt: meta?.createdAt || now,
      modifiedAt: now,
      appVersion: meta?.appVersion || IDF_APP_VERSION,
    },
    sheets,
  };
  try {
    return JSON.stringify(file);
  } catch {
    // Payload có field không serialize được (hiếm — doc chỉ chứa dữ liệu thuần) — loại bỏ
    // sheet lỗi thay vì crash toàn bộ export, giống triết lý "im lặng khi lỗi" của sheets-persist.
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

/** Doc hợp lệ tối thiểu: entities[]/layers[] là mảng (nội dung entity không kiểm sâu — DXF
 * import cũng chấp nhận entity "lạ" tương tự, xem parseDxf bỏ qua entity không hiểu). */
function isValidDoc(v: unknown): v is Doc {
  if (!isPlainObject(v)) return false;
  return Array.isArray(v.entities) && Array.isArray(v.layers);
}

/**
 * Đọc chuỗi JSON .idf → { meta, sheets } hoặc `null` nếu file hỏng/sai định dạng/không phải
 * .idf (KHÔNG throw — an toàn gọi trực tiếp từ UI, tự quyết định thông báo lỗi).
 */
export function importIdf(json: string): ParsedIdf | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (!isPlainObject(parsed)) return null;
  if (parsed.idfVersion !== IDF_VERSION) return null;
  if (!Array.isArray(parsed.sheets)) return null;

  const sheets: IdfSheetData[] = [];
  for (const raw of parsed.sheets) {
    if (!isPlainObject(raw)) continue;
    if (typeof raw.id !== 'string' || typeof raw.name !== 'string') continue;
    if (!isValidDoc(raw.doc)) continue;
    sheets.push({ id: raw.id, name: raw.name, doc: raw.doc });
  }
  if (!sheets.length) return null;

  const rawMeta = isPlainObject(parsed.meta) ? parsed.meta : {};
  const meta: IdfMeta = {
    projectName: typeof rawMeta.projectName === 'string' ? rawMeta.projectName : 'InteriorFlow project',
    createdAt: typeof rawMeta.createdAt === 'string' ? rawMeta.createdAt : new Date().toISOString(),
    modifiedAt: typeof rawMeta.modifiedAt === 'string' ? rawMeta.modifiedAt : new Date().toISOString(),
    appVersion: typeof rawMeta.appVersion === 'string' ? rawMeta.appVersion : 'unknown',
  };
  return { meta, sheets };
}
