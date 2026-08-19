/**
 * lib/storage/studio-persist.ts — W0.3 (19/08, finding A-4 FINAL-AUDIT): kho BLOB tầng STUDIO
 * xuống IndexedDB, TÁI DÙNG nguyên primitive `lib/sheets-persist.ts` (DB `interiorflow-sheets`,
 * store `sheets`) — đúng khuôn `boq-overrides-persist.ts`, KHÔNG bịa DB mới.
 *
 * Vì sao tồn tại: tài sản studio (kho `.idfc`, bảng màu, Brand Kit, refManifest) trước 19/08
 * sống trong localStorage — "Clear site data" là mất vĩnh viễn, và trần ~5MB dễ vỡ. IndexedDB
 * trần theo đĩa và các trình duyệt đối xử tử tế hơn khi dọn.
 *
 * Đây KHÔNG phải framework storage mới — chỉ là 2 mảnh:
 *   1. `idbBlobIo`  — load/save MỘT payload theo `route`, khoá `studio::<route>` (tài sản studio
 *      là per-máy, không per-user/per-dự-án — giữ đúng ngữ nghĩa localStorage cũ).
 *   2. `createStudioBlobStore` — khuôn cache-in-memory + hydrate async + flush async để các store
 *      SYNC hiện có (idfc-store, colors/store, brand-kit, refingest) GIỮ NGUYÊN chữ ký public,
 *      caller không phải sửa. 4 store dùng chung một khuôn thay vì chép 4 lần.
 *
 * CẦU TƯƠNG THÍCH (bridge): lần hydrate đầu, IDB trống mà localStorage cũ có dữ liệu → dời sang
 * IDB. Bản localStorage GIỮ NGUYÊN (không xoá) làm lưới an toàn trong window chuyển tiếp.
 * Idempotent: marker chính là SỰ TỒN TẠI của bản ghi IDB — lần sau IDB đã có thì không di trú nữa
 * (kể cả khi payload là mảng rỗng: kho "đã dọn sạch" khác kho "chưa từng có").
 *
 * Import TƯƠNG ĐỐI (không `@/…`) để test sucrase-node của các store resolve được.
 */
import { loadSheets, saveSheets, type PersistedSheet, type SheetsRecord } from '../sheets-persist';

/** userId cố định cho tài sản tầng studio — kho là per-MÁY, đúng ngữ nghĩa localStorage cũ. */
const STUDIO_USER = 'studio';
const SHEET_ID = 'data';

interface BlobSheet extends PersistedSheet {
  payload: unknown;
}

/** IO tối giản — tách interface để test node (không có indexedDB) inject bản in-memory. */
export interface StudioBlobIo {
  /** `undefined` = CHƯA CÓ bản ghi (phân biệt với payload rỗng hợp lệ). */
  load(route: string): Promise<unknown>;
  save(route: string, payload: unknown): Promise<boolean>;
}

export const idbBlobIo: StudioBlobIo = {
  async load(route) {
    const rec = await loadSheets<BlobSheet>(STUDIO_USER, route);
    const sheet = rec?.sheets.find((s) => s.id === SHEET_ID);
    // dùng 'payload' in sheet (không phải !== undefined) — payload có thể là null hợp lệ
    return sheet && 'payload' in sheet ? sheet.payload : undefined;
  },
  async save(route, payload) {
    const record: SheetsRecord<BlobSheet> = {
      v: 1,
      activeId: SHEET_ID,
      sheets: [{ id: SHEET_ID, name: route, payload }],
      ts: Date.now(),
    };
    return (await saveSheets(STUDIO_USER, route, record)) > 0;
  },
};

export interface StudioBlobStore<T> {
  /** Đọc SYNC từ cache (lần đầu: đọc localStorage cũ + kích hydrate IDB chạy nền). */
  get(): T;
  /** Ghi SYNC vào cache + flush async xuống IDB. KHÔNG ghi localStorage nữa. */
  set(next: T): void;
  /** Chờ IDB nạp xong (UI nào cần dữ liệu tươi thì await rồi get() lại). */
  hydrate(): Promise<void>;
  /** Test-only: xoá cache/trạng thái hydrate để mô phỏng phiên mới. */
  __resetForTest(): void;
}

export function createStudioBlobStore<T>(opts: {
  route: string;
  /** Đọc bản localStorage CŨ (bridge). `undefined` = không có / hỏng. KHÔNG được xoá key cũ. */
  readLegacy: () => T | undefined;
  empty: T;
  /** Kiểm payload đọc từ IDB (dữ liệu ngoài không tin mù). `undefined` = coi như chưa có. */
  parse: (v: unknown) => T | undefined;
  io?: StudioBlobIo;
}): StudioBlobStore<T> {
  const io = opts.io ?? idbBlobIo;
  let cache: T | undefined;
  let dirty = false; // đã có lượt set() trong phiên — bản tay thắng bản IDB đến sau
  let hydrating: Promise<void> | null = null;

  const readLegacySafe = (): T => {
    try {
      return opts.readLegacy() ?? opts.empty;
    } catch {
      return opts.empty;
    }
  };

  const hydrate = (): Promise<void> => {
    if (typeof window === 'undefined') return Promise.resolve();
    if (!hydrating) {
      hydrating = (async () => {
        let fromIdb: T | undefined;
        try {
          const raw = await io.load(opts.route);
          fromIdb = raw === undefined ? undefined : opts.parse(raw);
        } catch {
          fromIdb = undefined;
        }
        if (fromIdb !== undefined) {
          if (dirty) {
            // người dùng đã ghi TRONG LÚC chờ hydrate — bản tay mới hơn, flush đè lên IDB
            void io.save(opts.route, cache as T);
          } else {
            cache = fromIdb; // IDB là nguồn canonical sau di trú
          }
          return;
        }
        // IDB trống → bridge một lần từ localStorage cũ (nếu có gì để dời)
        const legacy = readLegacySafe();
        if (cache === undefined) cache = legacy;
        const worthSaving = dirty || JSON.stringify(cache) !== JSON.stringify(opts.empty);
        if (worthSaving) void io.save(opts.route, cache);
      })();
    }
    return hydrating;
  };

  return {
    get() {
      if (typeof window === 'undefined') return opts.empty;
      if (cache === undefined) {
        cache = readLegacySafe();
        void hydrate();
      }
      return cache;
    },
    set(next) {
      cache = next;
      dirty = true;
      if (typeof window === 'undefined') return;
      // tuần tự qua hydrate để di trú không đè mất lượt ghi (và ngược lại)
      void hydrate().then(() => io.save(opts.route, cache as T));
    },
    hydrate,
    __resetForTest() {
      cache = undefined;
      dirty = false;
      hydrating = null;
    },
  };
}
