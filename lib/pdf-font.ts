/**
 * lib/pdf-font.ts — NHÚNG FONT CÓ DẤU TIẾNG VIỆT VÀO jsPDF (fix #25: PDF mất dấu).
 *
 * ── VẤN ĐỀ GỐC ──────────────────────────────────────────────────────────────────────────────
 * jsPDF 4.2.1 chỉ có 14 font "standard" dựng sẵn (helvetica/times/courier…) và mã hoá chúng
 * theo bảng WinAnsi (cp1252). WinAnsi KHÔNG có ký tự tiếng Việt (ê/ẩ/ệ/ỉ/Ư/Đ…), nên
 * `pdf.text('Tiêu chuẩn', …)` xuất ra "Tieu chuan" hoặc ký tự rác. Cách DUY NHẤT để có dấu
 * thật là nhúng một file TrueType có glyph tiếng Việt (`addFileToVFS` + `addFont`) rồi
 * `setFont` sang nó.
 *
 * ── LUẬT TRUNG TÍNH (CLAUDE.md) ─────────────────────────────────────────────────────────────
 * Module này KHÔNG hardcode một font duy nhất. Font dùng để xuất được RESOLVE theo thứ tự:
 *   1. `opts.fontId` — caller chỉ định tường minh (VD sau này UI cho chọn font xuất).
 *   2. `opts.brandFonts` — suy từ Brand Kit của dự án đang mở.
 *   3. `DEFAULT_PDF_FONT_ID` (Be Vietnam Pro) — mặc định trung tính, OFL, phủ đủ tiếng Việt,
 *      CÙNG hệ chữ với UI app (docs/FIGMA-HANDOFF.md) ⇒ UI → bản vẽ → PDF → deck một mạch.
 *   4. `helvetica` — chỉ khi nạp file font thất bại. Mất dấu, nhưng KHÔNG crash chức năng xuất.
 *
 * ⚠️ GIỚI HẠN ĐÃ KIỂM, ĐỌC TRƯỚC KHI SỬA — nhánh (2) HIỆN LUÔN RƠI VỀ MẶC ĐỊNH:
 * Brand Kit CHƯA mang file font. `BrandKit.fonts` là `FontPairing` — một enum 3 preset
 * ('Editorial' | 'Modern' | 'Elegant', `lib/slides.ts`) map sang CSS font stack HỆ THỐNG
 * (Georgia / Helvetica Neue / Segoe UI…), dùng để vẽ slide bằng canvas. jsPDF không xài được
 * font hệ thống — muốn nhúng phải có file .ttf thật, mà Brand Kit không có, và
 * `lib/custom-fonts.ts` (được nhắc trong comment `brand-kit.ts`) KHÔNG tồn tại. Vì vậy
 * `PAIRING_TO_FONT` dưới đây CỐ Ý để rỗng: không preset nào ánh xạ được sang font nhúng, và
 * ta KHÔNG cố nạp Georgia/Helvetica từ máy người dùng (không có file, không có quyền phân phối).
 * MỞ LẠI nhánh này khi Brand Kit cho phép tải lên .ttf — chỉ cần thêm mục vào registry +
 * `PAIRING_TO_FONT`, không phải sửa logic.
 *
 * ── ĐÓNG GÓI ────────────────────────────────────────────────────────────────────────────────
 * File .ttf nằm ở `public/fonts/`, NẠP LÚC XUẤT PDF — cố ý KHÔNG `import` base64 vào module:
 * nhồi vào TS thì mọi bundle JS (kể cả trang không hề xuất PDF) phải cõng thêm ~270KB. Nạp
 * runtime + cache ở mức module là đổi 1 request lấy bundle nhẹ.
 *
 * Chạy được CẢ 2 môi trường:
 *   - Browser: `fetch('/fonts/…')` (Next phục vụ `public/` ở gốc URL).
 *   - Node (test `sucrase-node`, script CLI): `node:fs/promises` đọc từ `process.cwd()`.
 *     `next.config.mjs` đã có `IgnorePlugin(/^node:/)` cho bundle client nên nhánh này không
 *     làm vỡ build web; ngoài ra nó nằm sau guard `typeof window === 'undefined'`.
 *
 * Giấy phép font: SIL OFL 1.1 — bản gốc ở `public/fonts/OFL.txt`, attribution ở
 * `docs/LICENSE-NOTES.md`. File .ttf giữ NGUYÊN BẢN upstream (không subset/không đổi tên).
 */

import type { FontPairing } from './slides';

/* ───────────────────────── Registry font nhúng được ───────────────────────── */

/** Mô tả một font có thể nhúng vào PDF. Thêm font mới = thêm 1 mục, không sửa logic. */
export interface EmbeddablePdfFont {
  /** Tên family đăng ký vào jsPDF — cũng là chuỗi truyền cho `pdf.setFont(family, style)`. */
  family: string;
  /** Nhãn cho người đọc (UI/report/log). */
  label: string;
  /** Tên file .ttf trong `public/fonts/` theo từng kiểu. */
  files: Record<PdfFontStyle, string>;
  /** Giấy phép — để truy vết khi rà license (docs/LICENSE-NOTES.md). */
  license: string;
}

/** Chỉ 2 kiểu được nhúng — đủ cho mọi chỗ đang gọi `setFont(…, 'normal'|'bold')`. */
export type PdfFontStyle = 'normal' | 'bold';

export const EMBEDDABLE_PDF_FONTS: Readonly<Record<string, EmbeddablePdfFont>> = {
  BeVietnamPro: {
    family: 'BeVietnamPro',
    label: 'Be Vietnam Pro',
    files: { normal: 'BeVietnamPro-Regular.ttf', bold: 'BeVietnamPro-Bold.ttf' },
    license: 'SIL Open Font License 1.1',
  },
};

/** Mặc định trung tính khi không resolve được gì khác. */
export const DEFAULT_PDF_FONT_ID = 'BeVietnamPro';

/** Font dựng sẵn dùng khi nhúng thất bại (mất dấu, nhưng không vỡ chức năng xuất). */
export const PDF_FALLBACK_FONT = 'helvetica';

/**
 * Brand Kit `FontPairing` → id trong registry. CỐ Ý RỖNG — xem "GIỚI HẠN ĐÃ KIỂM" ở đầu file:
 * 3 preset hiện chỉ là CSS stack font hệ thống, không có file .ttf để nhúng.
 */
const PAIRING_TO_FONT: Partial<Record<FontPairing, string>> = {};

/* ───────────────────────── Resolve ───────────────────────── */

export interface PdfFontOptions {
  /** (1) Caller ép font — id trong `EMBEDDABLE_PDF_FONTS`. Không hợp lệ ⇒ bỏ qua, xuống bước sau. */
  fontId?: string;
  /** (2) `BrandKit.fonts` của dự án đang mở. */
  brandFonts?: FontPairing;
}

/** Trả id font nhúng theo chuỗi ưu tiên (1) caller → (2) Brand Kit → (3) mặc định. */
export function resolvePdfFontId(opts: PdfFontOptions = {}): string {
  if (opts.fontId && EMBEDDABLE_PDF_FONTS[opts.fontId]) return opts.fontId;
  if (opts.fontId) {
    console.warn(`[pdf-font] fontId "${opts.fontId}" không có trong registry — dùng mặc định.`);
  }
  if (opts.brandFonts) {
    const mapped = PAIRING_TO_FONT[opts.brandFonts];
    if (mapped && EMBEDDABLE_PDF_FONTS[mapped]) return mapped;
    // Không log ầm ĩ: đây là đường đi BÌNH THƯỜNG hiện nay (Brand Kit chưa mang file font).
  }
  return DEFAULT_PDF_FONT_ID;
}

/* ───────────────────────── Nạp + cache ───────────────────────── */

/** Thư mục phục vụ font (URL trong browser / đường dẫn tương đối cwd trong Node). */
const FONT_DIR = 'fonts';
const FONT_PUBLIC_DIR = 'public';

/** Phần bề mặt jsPDF mà helper này cần — khai báo hẹp để không phụ thuộc type của jspdf. */
export interface JsPdfFontTarget {
  addFileToVFS: (fileName: string, data: string) => unknown;
  addFont: (postScriptName: string, id: string, fontStyle: string) => unknown;
  setFont: (fontName: string, fontStyle?: string) => unknown;
}

interface LoadedFont {
  file: string;
  style: PdfFontStyle;
  base64: string;
}

/** Cache Ở MỨC MODULE, theo từng fontId: đọc + encode base64 chỉ 1 lần mỗi tab/tiến trình. */
const fontDataCache = new Map<string, Promise<LoadedFont[] | null>>();
const warnedFor = new Set<string>();

function warnOnce(key: string, reason: unknown): void {
  if (warnedFor.has(key)) return;
  warnedFor.add(key);
  console.warn(
    `[pdf-font] Không nạp được font "${key}" — PDF sẽ dùng ${PDF_FALLBACK_FONT} và MẤT DẤU tiếng Việt.`,
    reason,
  );
}

/**
 * Uint8Array → base64. Dùng `btoa` (có sẵn cả trong trình duyệt lẫn Node ≥16) và cắt khúc
 * 32KB để không tràn stack khi `apply` mảng đối số lớn.
 */
function bytesToBase64(bytes: Uint8Array): string {
  const CHUNK = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK)));
  }
  return btoa(binary);
}

async function readFontBytes(file: string): Promise<Uint8Array> {
  if (typeof window !== 'undefined') {
    const res = await fetch(`/${FONT_DIR}/${file}`);
    if (!res.ok) throw new Error(`fetch /${FONT_DIR}/${file} → HTTP ${res.status}`);
    return new Uint8Array(await res.arrayBuffer());
  }
  // Node: test (sucrase-node) và script CLI chạy từ gốc repo.
  const fs = await import('node:fs/promises');
  const buf = await fs.readFile(`${process.cwd()}/${FONT_PUBLIC_DIR}/${FONT_DIR}/${file}`);
  return new Uint8Array(buf);
}

/**
 * Nạp + encode mọi weight của một font trong registry, CACHE lại. Trả `null` (KHÔNG throw)
 * nếu hỏng — caller tự fallback. Lần hỏng sẽ XOÁ cache để lần xuất sau còn thử lại được.
 */
export function loadPdfFontData(fontId: string = DEFAULT_PDF_FONT_ID): Promise<LoadedFont[] | null> {
  const cached = fontDataCache.get(fontId);
  if (cached) return cached;

  const spec = EMBEDDABLE_PDF_FONTS[fontId];
  if (!spec) {
    warnOnce(fontId, new Error(`fontId "${fontId}" không có trong EMBEDDABLE_PDF_FONTS`));
    return Promise.resolve(null);
  }

  const p = (async (): Promise<LoadedFont[]> => {
    const out: LoadedFont[] = [];
    for (const style of ['normal', 'bold'] as PdfFontStyle[]) {
      const file = spec.files[style];
      const bytes = await readFontBytes(file);
      if (bytes.length < 1024) throw new Error(`${file} rỗng/hỏng (${bytes.length} byte)`);
      out.push({ file, style, base64: bytesToBase64(bytes) });
    }
    return out;
  })().catch((err) => {
    warnOnce(fontId, err);
    fontDataCache.delete(fontId); // cho phép thử lại lần xuất sau
    return null;
  });

  fontDataCache.set(fontId, p);
  return p;
}

/* ───────────────────────── API chính ───────────────────────── */

/**
 * Đăng ký font có dấu (Regular + Bold) vào ĐÚNG instance jsPDF được truyền vào rồi `setFont`
 * sang nó. Trả về TÊN FAMILY để caller dùng tiếp: `pdf.setFont(family, 'bold')`.
 *
 * ⚠️ LUÔN `await` TRƯỚC khi vẽ chữ / `save()` — nếu để promise trôi, jsPDF ghi trang bằng
 * helvetica rồi font mới kịp đăng ký ⇒ PDF vẫn mất dấu.
 *
 * @returns family của font đã nhúng (VD 'BeVietnamPro'), hoặc `'helvetica'` khi phải fallback.
 */
export async function ensureVietnameseFont(
  pdf: JsPdfFontTarget,
  opts: PdfFontOptions = {},
): Promise<string> {
  const fontId = resolvePdfFontId(opts);
  try {
    const fonts = await loadPdfFontData(fontId);
    if (!fonts) return useFallback(pdf);
    const family = EMBEDDABLE_PDF_FONTS[fontId].family;
    for (const f of fonts) {
      pdf.addFileToVFS(f.file, f.base64);
      pdf.addFont(f.file, family, f.style);
    }
    pdf.setFont(family, 'normal');
    return family;
  } catch (err) {
    warnOnce(fontId, err);
    return useFallback(pdf);
  }
}

function useFallback(pdf: JsPdfFontTarget): string {
  try {
    pdf.setFont(PDF_FALLBACK_FONT, 'normal');
  } catch {
    /* instance lạ không có setFont → kệ, caller vẫn nhận tên fallback */
  }
  return PDF_FALLBACK_FONT;
}

/** Xoá cache — CHỈ dùng cho test (mỗi case tự nạp lại từ đầu). */
export function resetPdfFontCache(): void {
  fontDataCache.clear();
  warnedFor.clear();
}
