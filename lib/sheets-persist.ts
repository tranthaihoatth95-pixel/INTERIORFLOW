/**
 * lib/sheets-persist.ts — PERSISTENCE MULTI-SHEET vào IndexedDB (J-3 Sprint 2).
 *
 * Quyết định #6 (user 13/07): "nhớ CHÍNH XÁC từng sheet" — CadSheets/PresentSheets
 * trước đây giữ snapshot trong ref ⇒ reload là mất sạch trừ sheet đang mở.
 * Module này serialize CẢ BỘ sheet (tối đa 5) vào IndexedDB, khoá theo
 * `userId::route::projectId` — mỗi user, mỗi chặng (CAD / Present), **mỗi DỰ ÁN**
 * một bản ghi riêng.
 *
 * ⚠️ SỬA RÒ CHÉO DỰ ÁN (25/07): khoá cũ là `userId::route` — KHÔNG có dự án, nên bản vẽ
 * dự án A hiện lại khi mở dự án B trên cùng trình duyệt. Nay `projectId` vào khoá; thiếu
 * `projectId` (route toàn cục cũ `/cad-editor`) vẫn dùng khoá cũ để không đổi hành vi.
 * Bản ghi cũ được DI TRÚ 1 lần sang dự án mở đầu tiên (xem `loadSheets`) — không mất việc,
 * và sau khi di trú thì bucket chung biến mất nên dự án thứ hai không thấy nữa.
 *
 * Vì sao IndexedDB (không phải localStorage): deck Present có thể chứa ảnh dataURL
 * hàng MB — localStorage trần ~5MB là vỡ; IDB trần theo đĩa (hàng trăm MB).
 *
 * Thiết kế:
 *  · Payload sheet để GENERIC (unknown) — caller tự định hình (CAD: doc+viewport,
 *    Present: deck). Trước khi ghi, JSON round-trip để (1) chặn giá trị không
 *    serialize được (function/class) khỏi structured-clone, (2) đo kích thước bản ghi.
 *  · Autosaver debounce ≥1s — KHÔNG ghi mỗi keystroke; flush() cho beforeunload.
 *  · Mọi hàm im lặng khi lỗi (private mode / quota) — persistence là tiện nghi,
 *    không bao giờ được làm gãy editor.
 */

const DB_NAME = 'interiorflow-sheets';
const DB_VERSION = 1;
const STORE = 'sheets';

/** 1 sheet đã serialize — caller định hình payload, bắt buộc có id + name. */
export interface PersistedSheet {
  id: string;
  name: string;
  [k: string]: unknown;
}

/** Bản ghi 1 bộ sheet của (user, route). */
export interface SheetsRecord<S extends PersistedSheet = PersistedSheet> {
  v: 1;
  activeId: string;
  sheets: S[];
  ts: number;
}

/**
 * Khoá bản ghi. Có `projectId` → `userId::route::projectId` (bộ sheet RIÊNG của dự án).
 * Không có → khoá cũ `userId::route` (bucket chung, chỉ còn dùng cho route toàn cục cũ
 * và cho bản ghi trước 25/07 chờ di trú). Hàm THUẦN — test được không cần IndexedDB.
 */
export function sheetsKey(userId: string, route: string, projectId?: string | null): string {
  const p = typeof projectId === 'string' ? projectId.trim() : '';
  return p ? `${userId}::${route}::${p}` : `${userId}::${route}`;
}

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/** Bản ghi hợp lệ? (v=1, có ít nhất 1 sheet, mỗi sheet có id+name). */
function isValidRecord(r: unknown): r is SheetsRecord {
  const rec = r as SheetsRecord | undefined;
  return (
    !!rec &&
    rec.v === 1 &&
    Array.isArray(rec.sheets) &&
    rec.sheets.length > 0 &&
    rec.sheets.every((s) => s && typeof s.id === 'string' && typeof s.name === 'string')
  );
}

/** GET thô theo khoá — null khi thiếu/hỏng/IDB bị chặn. */
function idbGet(db: IDBDatabase, k: string): Promise<unknown> {
  return new Promise((resolve) => {
    try {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(k);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(undefined);
    } catch {
      resolve(undefined);
    }
  });
}

/** PUT + DELETE trong CÙNG 1 transaction — di trú không bao giờ để mất bản ghi giữa chừng. */
function idbMove(db: IDBDatabase, from: string, to: string, value: unknown): Promise<void> {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(value, to);
      tx.objectStore(STORE).delete(from);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

/**
 * Đọc bộ sheet đã lưu của (user, route, DỰ ÁN) — null nếu chưa có / hỏng / IDB bị chặn.
 *
 * DI TRÚ 1 LẦN: có `projectId` mà bucket dự án còn trống, trong khi bucket chung cũ
 * (`userId::route`, tồn tại từ trước 25/07) có dữ liệu ⇒ DỜI bản ghi cũ sang bucket dự án
 * này rồi xoá bucket chung. Nhờ vậy việc đang làm dở không mất, mà dự án mở sau đó không
 * còn thấy bản vẽ của dự án khác nữa.
 */
export async function loadSheets<S extends PersistedSheet>(
  userId: string,
  route: string,
  projectId?: string | null,
): Promise<SheetsRecord<S> | null> {
  if (!userId || !route) return null;
  const db = await openDb();
  if (!db) return null;
  try {
    const scopedKey = sheetsKey(userId, route, projectId);
    const scoped = await idbGet(db, scopedKey);
    if (isValidRecord(scoped)) return scoped as SheetsRecord<S>;

    const legacyKey = sheetsKey(userId, route);
    if (scopedKey === legacyKey) return null; // không có projectId → chỉ có bucket chung

    const legacy = await idbGet(db, legacyKey);
    if (!isValidRecord(legacy)) return null;
    await idbMove(db, legacyKey, scopedKey, legacy);
    return legacy as SheetsRecord<S>;
  } finally {
    db.close();
  }
}

/**
 * Ghi bộ sheet. Trả về kích thước bản ghi (byte, đo bằng JSON) — 0 nếu ghi hỏng.
 * JSON round-trip trước khi put: đảm bảo serializable + chính là số byte đo được.
 */
export async function saveSheets(
  userId: string,
  route: string,
  record: SheetsRecord,
  projectId?: string | null,
): Promise<number> {
  if (!userId || !route) return 0;
  let json: string;
  try {
    json = JSON.stringify(record);
  } catch {
    return 0; // payload có giá trị không serialize được — bỏ qua, không crash
  }
  const clean = JSON.parse(json) as SheetsRecord;
  const db = await openDb();
  if (!db) return 0;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(clean, sheetsKey(userId, route, projectId));
      tx.oncomplete = () => {
        db.close();
        resolve(json.length);
      };
      tx.onerror = () => {
        db.close();
        resolve(0);
      };
    } catch {
      db.close();
      resolve(0);
    }
  });
}

/** Xoá bộ sheet của (user, route, dự án) — dùng khi cần reset (chưa có UI gọi). */
export async function clearSheets(
  userId: string,
  route: string,
  projectId?: string | null,
): Promise<void> {
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(sheetsKey(userId, route, projectId));
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
  db.close();
}

/* ---------------- Autosaver debounce ---------------- */

export interface SheetsAutosaver {
  /** Đánh dấu "có thay đổi" — sẽ ghi sau `delay` ms kể từ lần touch cuối. */
  touch: () => void;
  /** Ghi NGAY nếu đang có thay đổi treo (beforeunload / đổi tab trình duyệt). */
  flush: () => void;
  /** Huỷ timer khi unmount. */
  dispose: () => void;
}

/**
 * Tạo autosaver debounce (mặc định 1200ms ≥ yêu cầu 1s — không ghi mỗi keystroke).
 * `getRecord` trả bản ghi hiện hành lúc ghi (null → bỏ lượt). `onSaved` nhận số byte
 * đã ghi (đo kích thước bản ghi cho report/debug). `onSavingChange` (VIỆC A, 28/07) báo
 * true ngay khi có thay đổi treo (để StatusBar hiện "Đang lưu…"), false khi ghi xong.
 */
export function createSheetsAutosaver(
  userId: string,
  route: string,
  getRecord: () => SheetsRecord | null,
  opts?: {
    delay?: number;
    onSaved?: (bytes: number) => void;
    projectId?: string | null;
    onSavingChange?: (saving: boolean) => void;
  },
): SheetsAutosaver {
  const delay = Math.max(1000, opts?.delay ?? 1200);
  let timer: ReturnType<typeof setTimeout> | null = null;
  let dirty = false;

  const write = () => {
    timer = null;
    if (!dirty) return;
    dirty = false;
    const record = getRecord();
    if (!record) {
      opts?.onSavingChange?.(false);
      return;
    }
    // Ghi vào ĐÚNG bucket dự án đã chốt lúc tạo autosaver — dù store có đổi dự án giữa
    // chừng thì nhịp ghi cuối vẫn về đúng chỗ cũ, không đè lên dự án khác.
    void saveSheets(userId, route, record, opts?.projectId).then((bytes) => {
      if (bytes > 0) opts?.onSaved?.(bytes);
      opts?.onSavingChange?.(false);
    });
  };

  return {
    touch: () => {
      const wasIdle = !dirty;
      dirty = true;
      if (wasIdle) opts?.onSavingChange?.(true);
      if (timer) clearTimeout(timer);
      timer = setTimeout(write, delay);
    },
    flush: () => {
      if (timer) clearTimeout(timer);
      write();
    },
    dispose: () => {
      if (timer) clearTimeout(timer);
      timer = null;
      dirty = false;
    },
  };
}

/** Suy `seq` tiếp theo từ các id dạng `<prefix>-<n>` để id mới không đụng id đã khôi phục. */
export function nextSeqFrom(ids: string[], prefix: string): number {
  let max = 0;
  for (const id of ids) {
    const m = new RegExp(`^${prefix}-(\\d+)$`).exec(id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max + 1;
}
