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
import { upgradeDocLevelsFromStorey } from './levels';

/**
 * v2 (VIỆC 1 — TẦNG THẬT): thêm `Doc.levels` + `Base.levelId`. Bump vì file v2 mang cấu trúc mà
 * app v1 KHÔNG hiểu (nó sẽ bỏ qua `levels` rồi ghi đè mất khi lưu lại) — đúng ca `IDF_VERSION`
 * sinh ra để chặn. `.idf` v1 vẫn mở được bình thường qua `IDF_MIGRATIONS[1]` (điều kiện SỐNG, có
 * test riêng ở `levels-idf-v2.test.ts`).
 */
export const IDF_VERSION = 2 as const;
/** Version app hiển thị trong metadata — cập nhật thủ công khi bump app version thật có ý nghĩa
 * (hiện chưa có nguồn version tập trung trong app — package.json version không public ở client). */
export const IDF_APP_VERSION = 'interiorflow-1.0.0';

// T3 — migration path (VIỆC 4, 28/07). Trước đây `idfVersion !== IDF_VERSION` là từ chối thẳng
// (return null) — bump version LẦN ĐẦU sẽ khiến MỌI file .idf cũ đọc lỗi im lặng. `currentIdfVersion`
// tách khỏi hằng số `IDF_VERSION` (giữ nguyên = version THẬT app đang xuất) để test có thể "giả
// bump" version đích của import mà KHÔNG đổi hằng số thật trong code (xem __setCurrentIdfVersionForTest).
let currentIdfVersion: number = IDF_VERSION;

/**
 * CHỈ DÙNG TRONG TEST — giả lập app đang ở version `v` khi kiểm `migrateIdf`/`importIdf`, không
 * đụng vào `IDF_VERSION` thật (hằng số đó vẫn quyết định `exportIdf` xuất file ở version nào).
 * Gọi lại `__setCurrentIdfVersionForTest(IDF_VERSION)` để reset sau khi test xong.
 */
export function __setCurrentIdfVersionForTest(v: number) {
  currentIdfVersion = v;
}

/**
 * v1 → v2: sinh `Doc.levels` từ tập nhãn `Base.storey` đã dùng trong TỪNG sheet, rồi gắn
 * `levelId` cho đúng những entity mang nhãn đó. Xem `lib/cad/levels.ts`
 * `upgradeDocLevelsFromStorey` để biết vì sao mọi Level sinh ra có `elevationMm = 0` +
 * `inferred: true` (tóm tắt: file v1 KHÔNG mang thông tin cao độ nào — đoán 3000/tầng là bịa số
 * vào hồ sơ kỹ thuật; 0 cũng là con số GIỮ NGUYÊN hành vi dựng hình hôm nay).
 *
 * **KHÔNG đụng `storey`** — hai field sống song song (DXF XDATA `IF_STOREY`, cây đối tượng, nhóm
 * BOQ vẫn đọc `storey`; không phiên nào phải sửa theo).
 *
 * Best-effort như phần còn lại của file: sheet/doc hình dạng lạ thì GIỮ NGUYÊN, không ném lỗi —
 * `importIdf` phía dưới vẫn có vòng lọc `isValidDoc` riêng để bỏ sheet hỏng.
 */
function migrateV1ToV2(f: Record<string, unknown>): Record<string, unknown> {
  const sheets = Array.isArray(f.sheets)
    ? f.sheets.map((s) => {
        if (!isPlainObject(s) || !isPlainObject(s.doc)) return s;
        return { ...s, doc: upgradeDocLevelsFromStorey(s.doc as unknown as Doc) };
      })
    : f.sheets;
  return { ...f, sheets, idfVersion: 2 };
}

/**
 * Bảng nâng cấp — mỗi entry khoá `fromV` là hàm nâng ĐÚNG 1 BẬC (fromV → fromV+1). `migrateIdf`
 * chạy nối tiếp qua bảng này. Thêm khoá `2` khi ra v3.
 */
const IDF_MIGRATIONS: Record<number, (f: Record<string, unknown>) => Record<string, unknown>> = {
  1: migrateV1ToV2,
};

/**
 * Nâng 1 file .idf từ `fromVersion` lên `toVersion` (mặc định = version hiện tại). `null` nếu:
 * không phải object · `fromVersion` CAO HƠN `toVersion` (không có "hạ cấp", `importIdf` tự chặn
 * case này trước khi gọi) · hoặc ĐỨT GÃY giữa đường (thiếu hàm nâng cho 1 version nào đó).
 */
export function migrateIdf(
  file: unknown,
  fromVersion: number,
  toVersion: number = currentIdfVersion,
): IdfFile | null {
  if (!isPlainObject(file)) return null;
  if (fromVersion > toVersion) return null;
  let cur: Record<string, unknown> = file;
  let v = fromVersion;
  while (v < toVersion) {
    const step = IDF_MIGRATIONS[v];
    if (!step) return null; // chưa viết hàm nâng cho version này — đứt gãy, không nâng được
    cur = step(cur);
    v += 1;
  }
  return cur as unknown as IdfFile;
}

/** Lý do CỤ THỂ của lần `importIdf` gần nhất trả `null` (vd "file mới hơn app") — `null` nếu lần
 * gần nhất thành công, hoặc lỗi chung "file hỏng/sai định dạng" (giữ nguyên thông báo cũ cho các
 * case đó, không đổi hành vi UI đã quen). UI (CadSheets.tsx) đọc hàm này SAU KHI thấy `importIdf`
 * trả null, để hiện đúng lý do thay vì gộp chung 1 câu "file hỏng" mơ hồ. */
let lastImportError: string | null = null;
export function lastImportIdfError(): string | null {
  return lastImportError;
}

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
  idfVersion: typeof IDF_VERSION;
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
  lastImportError = null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (!isPlainObject(parsed)) return null;

  const fileVersion = parsed.idfVersion;
  if (typeof fileVersion !== 'number') return null;

  let file: Record<string, unknown> = parsed;
  if (fileVersion !== currentIdfVersion) {
    if (fileVersion > currentIdfVersion) {
      // File từ 1 bản IF MỚI HƠN — không có đường "hạ cấp" ngược, phải từ chối, nhưng KHÔNG còn
      // im lặng: lý do cụ thể qua lastImportIdfError() cho UI hiện đúng câu, thay vì gộp chung
      // "file hỏng/sai định dạng" (dễ hiểu lầm lỗi ở FILE trong khi thật ra lỗi ở APP quá cũ).
      lastImportError = 'File tạo bởi bản IF mới hơn. Cập nhật app để mở file này.';
      return null;
    }
    const migrated = migrateIdf(file, fileVersion);
    if (!migrated) {
      lastImportError = 'Không nâng cấp được file .idf từ phiên bản cũ này.';
      return null;
    }
    file = migrated as unknown as Record<string, unknown>;
  }
  if (!Array.isArray(file.sheets)) return null;

  const sheets: IdfSheetData[] = [];
  for (const raw of file.sheets) {
    if (!isPlainObject(raw)) continue;
    if (typeof raw.id !== 'string' || typeof raw.name !== 'string') continue;
    if (!isValidDoc(raw.doc)) continue;
    sheets.push({ id: raw.id, name: raw.name, doc: raw.doc });
  }
  if (!sheets.length) return null;

  const rawMeta = isPlainObject(file.meta) ? file.meta : {};
  const meta: IdfMeta = {
    projectName: typeof rawMeta.projectName === 'string' ? rawMeta.projectName : 'InteriorFlow project',
    createdAt: typeof rawMeta.createdAt === 'string' ? rawMeta.createdAt : new Date().toISOString(),
    modifiedAt: typeof rawMeta.modifiedAt === 'string' ? rawMeta.modifiedAt : new Date().toISOString(),
    appVersion: typeof rawMeta.appVersion === 'string' ? rawMeta.appVersion : 'unknown',
  };
  return { meta, sheets };
}
