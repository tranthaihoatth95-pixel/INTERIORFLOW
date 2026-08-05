/**
 * lib/colors/types.ts — TẦNG MÀU CẮM RỜI (VIỆC 1, phiếu 05/08 sau NC-16).
 *
 * ⛔ LUẬT NỀN CỦA CẢ THƯ MỤC `lib/colors/`:
 *   KHÔNG hãng sơn nào được nhúng vào bundle. Không `import bangMau from './dulux.json'`,
 *   không mảng hằng 2000 mã trong file .ts. Mọi bảng màu ĐẾN LÚC CHẠY — từ CSV/Excel studio tự
 *   kéo vào, từ clipboard, hoặc pull từ Larkbase của chính studio đó.
 *
 * VÌ SAO (NC-16 tra điều khoản gốc 6 hãng sơn, Hoà chốt 05/08):
 *   - **Dulux** (AkzoNobel) — điều khoản cấm scraping thương mại GỌI ĐÍCH DANH ⇒ rủi ro cao nhất.
 *   - **Jotun** — dùng đúng lập luận "selection and arrangement" mà Pantone dùng (bộ sưu tập là
 *     tác phẩm biên soạn, không phải từng hex rời).
 *   - Cả hai là công ty EU/EEA ⇒ còn thêm **sui generis database right** (Directive 96/9/EC —
 *     quyền RIÊNG cho người bỏ vốn xây CSDL, tồn tại ĐỘC LẬP với bản quyền; kể cả khi từng con
 *     số không được bảo hộ thì việc rút "phần đáng kể" của bộ vẫn bị chặn).
 *   ⇒ KHÔNG nhúng hãng nào vào app. Ai muốn có bảng của hãng nào thì TỰ nạp vào máy mình —
 *     IF là cái máy tra, không phải cái kho.
 *
 * LỢI THẾ KIẾN TRÚC (lý do Hoà nêu): có thư yêu cầu gỡ thì **đổi cấu hình lúc chạy**
 * (`registry.ts` — chặn theo `sourceId`/theo `brand`) hoặc xoá đúng tệp dữ liệu — **không build
 * lại app, không phát hành bản vá, không ai phải cập nhật**.
 *
 * Module THUẦN — không DOM, không React, không Prisma (chạy được qua `sucrase-node` trong test).
 */

// Import TƯƠNG ĐỐI (không alias `@/…`) — bắt buộc cho mọi module có `.test.ts` chạy qua
// `sucrase-node` (không resolve alias; xem sự cố `boq-group.ts` 04/08 trong STATUS.md).
import type { Lab } from '../gu/color-psychology';

/** Một màu trong thư viện. */
export interface ColorEntry {
  /** Mã của hãng/studio ("N-1073", "RAL 9010", "S-01"). Rỗng được — khi bảng chỉ có tên. */
  code: string;
  name: string;
  /** Chuẩn hoá về '#rrggbb' thường hoá khi nạp (xem `user-csv.ts`). */
  hex: string;
  /**
   * ⚠️ LƯU CẢ LAB, KHÔNG chỉ hex — hex-only KHÔNG đảo lại được:
   * sRGB→Lab phụ thuộc điểm trắng + không gian màu nguồn (D65/2° ở đây). Nếu sau này bảng đến
   * từ nguồn đo thật (spectro, D50, hoặc Lab do hãng công bố) thì Lab là SỐ GỐC còn hex chỉ là
   * bản chiếu có mất mát — tính ngược hex→Lab sẽ ra số khác với Lab hãng công bố mà không ai
   * biết. Giữ cả hai ⇒ về sau nạp Lab thật chỉ việc ghi đè trường này, toán tra màu không đổi.
   */
  lab: Lab;
  brand?: string;
  note?: string;
}

/** Nguồn bảng màu đã nạp. `id` phải ổn định để cấu hình chặn (`registry.ts`) bám vào được. */
export interface ColorSource {
  id: string;
  name: string;
  colors: ColorEntry[];
  /** Nạp từ đâu — hiện trên UI để người dùng biết dữ liệu này là của ai, gỡ ở đâu. */
  origin: ColorSourceOrigin;
  /** `studio` = dùng chung mọi dự án (localStorage máy đó) · `project` = tệp trong thư mục dự án. */
  scope: ColorSourceScope;
  /** Chỉ có khi `scope === 'project'`. */
  projectId?: string;
  updatedAt: number;
  /**
   * Ghi chú pháp lý do CHÍNH STUDIO khai lúc nạp ("bảng nội bộ tự đo", "được NCC gửi cho dùng").
   * IF không thẩm định hộ — nhưng bắt khai để có dấu vết khi cần trả lời thư yêu cầu gỡ.
   */
  licenseNote?: string;
}

export type ColorSourceOrigin = 'user-csv' | 'user-paste' | 'larkbase';
export type ColorSourceScope = 'studio' | 'project';

/** Hình dạng tệp `colors.json` trong thư mục dự án (cùng mẫu `brand-kit.json` v2). */
export interface ProjectColorFile {
  version: 1;
  exportedAt: number;
  sources: ColorSource[];
}

export function isColorEntry(v: unknown): v is ColorEntry {
  if (!v || typeof v !== 'object') return false;
  const e = v as Partial<ColorEntry>;
  return (
    typeof e.code === 'string' &&
    typeof e.name === 'string' &&
    typeof e.hex === 'string' &&
    !!e.lab &&
    typeof e.lab === 'object' &&
    typeof (e.lab as Lab).L === 'number' &&
    typeof (e.lab as Lab).a === 'number' &&
    typeof (e.lab as Lab).b === 'number'
  );
}

/**
 * Đọc 1 `ColorSource` từ JSON lạ (tệp đĩa/localStorage đời trước/tay người sửa). Trả `null` thay
 * vì ném — một tệp hỏng KHÔNG được làm chết cả danh sách nguồn (bài học `read()` của
 * `brand-kit.ts`: bọc try/catch, hỏng thì coi như rỗng). Entry hỏng bị BỎ từng cái, phần còn lại
 * giữ nguyên — mất 1 dòng còn hơn mất cả bảng 500 màu.
 */
export function parseColorSource(v: unknown): ColorSource | null {
  if (!v || typeof v !== 'object') return null;
  const s = v as Partial<ColorSource>;
  if (typeof s.id !== 'string' || !s.id) return null;
  if (typeof s.name !== 'string' || !s.name) return null;
  if (!Array.isArray(s.colors)) return null;
  const colors = s.colors.filter(isColorEntry);
  const origin: ColorSourceOrigin =
    s.origin === 'user-csv' || s.origin === 'user-paste' || s.origin === 'larkbase' ? s.origin : 'user-csv';
  const scope: ColorSourceScope = s.scope === 'project' ? 'project' : 'studio';
  return {
    id: s.id,
    name: s.name,
    colors,
    origin,
    scope,
    projectId: typeof s.projectId === 'string' ? s.projectId : undefined,
    updatedAt: typeof s.updatedAt === 'number' ? s.updatedAt : 0,
    licenseNote: typeof s.licenseNote === 'string' ? s.licenseNote : undefined,
  };
}
