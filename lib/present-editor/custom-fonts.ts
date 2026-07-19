/**
 * lib/present-editor/custom-fonts.ts — FONT NGƯỜI DÙNG TẢI LÊN (#1).
 *
 * Đọc .ttf/.otf/.woff/.woff2 → data URL → đăng ký FontFace vào document.fonts → dùng được
 * NGAY trên DOM (Element.tsx) lẫn canvas (render.ts, cho PDF/PNG) mà không cần reload.
 *
 * HAI TẦNG LƯU — có chủ ý:
 *
 *   1. NHÚNG THEO DECK (chính) — `EditorDeck.customFonts`, xem model.ts.
 *      Font đi THEO dự án: deck đã lưu qua lib/sheets-persist.ts (IndexedDB) nên đóng/mở lại
 *      vẫn còn; xuất/nhập JSON deck hay mở trên máy khác cũng còn. Đây là điều user yêu cầu
 *      ("font theo dự án/deck để mở lại vẫn còn").
 *
 *   2. THƯ VIỆN MÁY (phụ) — IndexedDB riêng ở đây.
 *      Để font đã tải một lần dùng lại được ở deck KHÁC mà không phải tải lại file. Thuần
 *      tiện nghi: mất tầng này (xoá cache trình duyệt) deck vẫn hiển thị đúng nhờ tầng 1.
 *
 * VÌ SAO KHÔNG localStorage (bản trước dùng, đã thay): một file .otf tiếng Việt đủ dấu
 * thường 200–600KB; base64 phồng thêm ~33%. Trần localStorage ~5MB ⇒ chỉ vài font là vỡ,
 * và vỡ IM LẶNG (QuotaExceededError bị nuốt) — user mất font mà không hiểu vì sao.
 * IndexedDB trần theo đĩa, cùng cơ chế mà deck đang dùng.
 *
 * VÌ SAO KHÔNG upload lên server như thư viện ảnh (`/api/library` + `./uploads/`): font là
 * tài sản CÓ BẢN QUYỀN. Đẩy file font lên server dùng chung nghĩa là phát tán bản sao cho
 * mọi user của instance — rủi ro giấy phép thật, và không ai yêu cầu chia sẻ font giữa các
 * tài khoản. Giữ font trong phạm vi deck của chính người tải là ranh giới đúng.
 */

import type { EmbeddedFont } from './model';

export type CustomFont = EmbeddedFont;

const DB_NAME = 'interiorflow-fonts';
const DB_VERSION = 1;
const STORE = 'fonts';

/** Trần cho MỘT file font. 8MB đã rộng rãi cho font Việt đủ dấu (thường < 1MB). */
export const MAX_FONT_BYTES = 8 * 1024 * 1024;

/** Đuôi file được chấp nhận. */
const ALLOWED_EXT = /\.(ttf|otf|woff2?|ttc)$/i;

/** Lỗi có thông điệp ĐỌC ĐƯỢC để UI hiện thẳng cho user (tiếng Việt). */
export class FontError extends Error {}

/* ------------------------------------------------------------------ */
/* Nhận dạng file font THẬT (không tin mỗi phần mở rộng)              */
/* ------------------------------------------------------------------ */

/**
 * Kiểm tra "magic number" 4 byte đầu — cách duy nhất đáng tin để biết đây có phải font hay
 * không. Đuôi .ttf có thể là file gì cũng được; đổi tên ảnh thành .otf là qua mặt kiểm tra
 * theo tên. Bảng theo spec OpenType/WOFF:
 *   0x00010000 / 'true' / 'ttcf' → TrueType   · 'OTTO' → CFF/OpenType
 *   'wOFF' → WOFF                             · 'wOF2' → WOFF2
 */
async function sniffFontType(file: File): Promise<string | null> {
  const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  if (head.length < 4) return null;
  const tag = String.fromCharCode(...head);
  if (tag === 'OTTO') return 'font/otf';
  if (tag === 'true' || tag === 'ttcf') return 'font/ttf';
  if (tag === 'wOFF') return 'font/woff';
  if (tag === 'wOF2') return 'font/woff2';
  if (head[0] === 0x00 && head[1] === 0x01 && head[2] === 0x00 && head[3] === 0x00) return 'font/ttf';
  return null;
}

/* ------------------------------------------------------------------ */
/* IndexedDB — thư viện font cấp máy                                   */
/* ------------------------------------------------------------------ */

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
    } catch {
      resolve(null);
    }
  });
}

/** Đọc toàn bộ thư viện font của máy. Lỗi → mảng rỗng (tiện nghi, không được làm gãy editor). */
export async function getLibraryFonts(): Promise<CustomFont[]> {
  const db = await openDb();
  if (!db) return [];
  return new Promise((resolve) => {
    try {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
      req.onsuccess = () => resolve((req.result as CustomFont[]) ?? []);
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

async function putLibraryFont(f: CustomFont): Promise<void> {
  const db = await openDb();
  if (!db) return;
  try {
    db.transaction(STORE, 'readwrite').objectStore(STORE).put(f, f.stack);
  } catch {
    /* quota / private mode — deck vẫn giữ font ở tầng 1 */
  }
}

/* ------------------------------------------------------------------ */
/* Đăng ký FontFace                                                    */
/* ------------------------------------------------------------------ */

const registered = new Set<string>();

/** Đăng ký 1 font vào document (bỏ qua nếu đã đăng ký — rẻ, gọi lại thoải mái). */
export async function registerFont(f: CustomFont): Promise<void> {
  if (typeof document === 'undefined' || !('fonts' in document)) return;
  if (registered.has(f.face)) return;
  const ff = new FontFace(f.face, `url(${f.dataUrl})`);
  await ff.load();
  (document.fonts as unknown as { add: (x: FontFace) => void }).add(ff);
  registered.add(f.face);
}

/**
 * Đăng ký cả một danh sách, bỏ qua font hỏng. Gọi khi mở editor VÀ mỗi khi nạp deck khác —
 * truyền `deck.customFonts` để font của deck sẵn sàng trước lần vẽ đầu.
 */
export async function registerFonts(list: CustomFont[] | undefined): Promise<void> {
  if (!list?.length) return;
  await Promise.all(
    list.map((f) =>
      registerFont(f).catch(() => {
        /* 1 font hỏng không được chặn các font còn lại */
      }),
    ),
  );
}

/** Nạp + đăng ký toàn bộ thư viện font của máy (gọi 1 lần khi mở editor). */
export async function registerLibraryFonts(): Promise<CustomFont[]> {
  const list = await getLibraryFonts();
  await registerFonts(list);
  return list;
}

/* ------------------------------------------------------------------ */
/* Thêm font mới                                                       */
/* ------------------------------------------------------------------ */

function fileToDataUrl(f: File, mime: string): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    // Ép MIME đã sniff được: nhiều máy trả type rỗng cho .otf → data URL thành
    // "data:application/octet-stream" và một số trình duyệt từ chối nạp làm font.
    r.onload = () => {
      const raw = String(r.result);
      res(raw.replace(/^data:[^;]*;/, `data:${mime};`));
    };
    r.onerror = () => rej(new FontError('Không đọc được file font.'));
    r.readAsDataURL(f);
  });
}

/**
 * Tải 1 file font người dùng → kiểm tra → đăng ký → lưu thư viện máy → trả entry để caller
 * nhúng vào `deck.customFonts`.
 *
 * NÉM `FontError` với thông điệp tiếng Việt đọc được khi file sai — caller PHẢI bắt và hiện
 * cho user (đừng nuốt im lặng như bản trước).
 */
export async function addCustomFont(file: File): Promise<CustomFont> {
  if (!ALLOWED_EXT.test(file.name)) {
    throw new FontError('Chỉ nhận file font .ttf, .otf, .woff hoặc .woff2.');
  }
  if (file.size > MAX_FONT_BYTES) {
    throw new FontError(
      `File nặng ${(file.size / 1024 / 1024).toFixed(1)}MB — vượt giới hạn ${MAX_FONT_BYTES / 1024 / 1024}MB.`,
    );
  }
  if (file.size === 0) throw new FontError('File rỗng.');

  const mime = await sniffFontType(file);
  if (!mime) {
    throw new FontError('File này không phải font hợp lệ (sai định dạng bên trong, dù đúng đuôi file).');
  }

  const dataUrl = await fileToDataUrl(file, mime);
  const base = file.name.replace(ALLOWED_EXT, '').trim().slice(0, 40) || 'Font tải lên';
  // face phải DUY NHẤT: hai file khác nhau cùng tên "Helvetica" mà chung face sẽ đè nhau.
  const face = `${base.replace(/["'`]/g, '')}-${Date.now().toString(36).slice(-4)}`;

  const cf: CustomFont = {
    label: `${base} (tải lên)`,
    stack: `"${face}", system-ui, sans-serif`,
    face,
    dataUrl,
    bytes: file.size,
  };

  try {
    await registerFont(cf);
  } catch {
    throw new FontError('Trình duyệt không đọc được font này — file có thể đã hỏng hoặc bị khoá bản quyền.');
  }

  await putLibraryFont(cf);
  return cf;
}

/** Gộp font của deck + thư viện máy, khử trùng theo `stack` (deck ưu tiên). */
export function mergeFontLists(deckFonts: CustomFont[] | undefined, libFonts: CustomFont[]): CustomFont[] {
  const out: CustomFont[] = [...(deckFonts ?? [])];
  const seen = new Set(out.map((f) => f.stack));
  for (const f of libFonts) if (!seen.has(f.stack)) out.push(f);
  return out;
}

/** Font này có phải font tải lên không (để cảnh báo lúc xuất PPTX). */
export function isCustomStack(stack: string | undefined, fonts: CustomFont[]): boolean {
  if (!stack) return false;
  return fonts.some((f) => f.stack === stack);
}
