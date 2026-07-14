/**
 * lib/sheets-persist.ts — PERSISTENCE MULTI-SHEET vào IndexedDB (J-3 Sprint 2).
 *
 * Quyết định #6 (user 13/07): "nhớ CHÍNH XÁC từng sheet" — CadSheets/PresentSheets
 * trước đây giữ snapshot trong ref ⇒ reload là mất sạch trừ sheet đang mở.
 * Module này serialize CẢ BỘ sheet (tối đa 5) vào IndexedDB, khoá theo
 * `userId::route` — mỗi user mỗi bộ, mỗi chặng (CAD / Present) một bản ghi riêng.
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

const key = (userId: string, route: string) => `${userId}::${route}`;

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

/** Đọc bộ sheet đã lưu — null nếu chưa có / hỏng / IDB bị chặn. */
export async function loadSheets<S extends PersistedSheet>(
  userId: string,
  route: string,
): Promise<SheetsRecord<S> | null> {
  if (!userId || !route) return null;
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key(userId, route));
      req.onsuccess = () => {
        db.close();
        const r = req.result as SheetsRecord<S> | undefined;
        if (
          r &&
          r.v === 1 &&
          Array.isArray(r.sheets) &&
          r.sheets.length > 0 &&
          r.sheets.every((s) => s && typeof s.id === 'string' && typeof s.name === 'string')
        ) {
          resolve(r);
        } else resolve(null);
      };
      req.onerror = () => {
        db.close();
        resolve(null);
      };
    } catch {
      db.close();
      resolve(null);
    }
  });
}

/**
 * Ghi bộ sheet. Trả về kích thước bản ghi (byte, đo bằng JSON) — 0 nếu ghi hỏng.
 * JSON round-trip trước khi put: đảm bảo serializable + chính là số byte đo được.
 */
export async function saveSheets(
  userId: string,
  route: string,
  record: SheetsRecord,
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
      tx.objectStore(STORE).put(clean, key(userId, route));
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

/** Xoá bộ sheet của (user, route) — dùng khi cần reset (chưa có UI gọi). */
export async function clearSheets(userId: string, route: string): Promise<void> {
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(key(userId, route));
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
 * đã ghi (đo kích thước bản ghi cho report/debug).
 */
export function createSheetsAutosaver(
  userId: string,
  route: string,
  getRecord: () => SheetsRecord | null,
  opts?: { delay?: number; onSaved?: (bytes: number) => void },
): SheetsAutosaver {
  const delay = Math.max(1000, opts?.delay ?? 1200);
  let timer: ReturnType<typeof setTimeout> | null = null;
  let dirty = false;

  const write = () => {
    timer = null;
    if (!dirty) return;
    dirty = false;
    const record = getRecord();
    if (!record) return;
    void saveSheets(userId, route, record).then((bytes) => {
      if (bytes > 0) opts?.onSaved?.(bytes);
    });
  };

  return {
    touch: () => {
      dirty = true;
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
