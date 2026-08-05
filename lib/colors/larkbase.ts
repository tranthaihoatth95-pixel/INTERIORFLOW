/**
 * lib/colors/larkbase.ts — VIỆC 1b: nạp bảng màu từ **Larkbase của chính studio**.
 *
 * PULL-ONLY, đúng luật `prisma/schema.prisma` §309-313 ("Larkbase là nguồn chân lý, IF chỉ
 * đọc/mirror, KHÔNG BAO GIỜ ghi ngược"): file này chỉ có đường ĐỌC. Không có `pushColorSource`,
 * không `create_record`/`update_record` — và `lib/integrations/providers/lark.ts` cũng không có
 * hàm ghi nào để lỡ tay gọi.
 *
 * ⚠️ RÀNG BUỘC RIÊNG CỦA HOÀ: **không dùng được UI Larkbase** ⇒ mọi thao tác phải xong trong IF,
 * không được bảo "mở Lark lên sửa cột cho khớp". Hệ quả thiết kế, không phải chi tiết vặt:
 *   1. Không ép tên cột cố định. IF `preview` bảng → **đọc ra danh sách tên cột THẬT** → người
 *      dùng ghép cột ngay trong IF (`guessColorMapping` đoán trước, sửa tay được).
 *   2. Không đòi thêm cột phụ, không đòi đổi tên cột, không đòi công thức.
 *   3. Bảng lệch/sai cột thì báo lỗi THEO DÒNG trong IF (dùng chung `buildColorSource`), người
 *      dùng sửa mapping trong IF rồi kéo lại — không phải sang Lark sửa dữ liệu.
 *
 * Phần THUẦN (record → lưới → `ColorSource`) nằm ở đây để test được bằng `sucrase-node`; phần
 * gọi mạng nằm ở `app/api/colors/lark/route.ts` (cần tenant token, chỉ chạy server).
 */

import { guessColorMapping, buildColorSource, type ColorColumnMapping, type ParsedGrid, type BuildColorSourceResult } from './build';
import type { ColorSourceScope } from './types';

/** Hình dạng tối thiểu của 1 bản ghi Bitable — CỐ Ý không import `LarkRecord` từ provider để
 *  module này (và test của nó) không kéo theo tầng mạng/env của `lark.ts`. */
export interface LarkColorRecord {
  record_id: string;
  fields: Record<string, unknown>;
}

/**
 * Rút giá trị field về chuỗi. TỰ LÀM chứ không dùng `textOf` của `lark.ts` vì lý do ranh giới ở
 * trên (không kéo provider vào module thuần) — nhưng phủ đúng các shape Bitable trả thật:
 * chuỗi/số/mảng đoạn văn `{text}`/object `{text}`/`{name}` (SingleSelect, Link).
 */
export function larkTextOf(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'true' : '';
  if (Array.isArray(v)) return v.map(larkTextOf).filter(Boolean).join(', ');
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (typeof o.text === 'string') return o.text;
    if (typeof o.name === 'string') return o.name;
    if (typeof o.value === 'string') return o.value;
  }
  return '';
}

/**
 * Danh sách tên cột THẬT của bảng — gộp key của nhiều bản ghi (Bitable bỏ hẳn key khi ô trống,
 * nên chỉ nhìn bản ghi ĐẦU TIÊN là sót cột; đây là bẫy thật, không phải phòng thủ thừa).
 * Thứ tự: theo lần xuất hiện đầu tiên, để bảng chọn trong IF không nhảy loạn giữa 2 lần kéo.
 */
export function larkFieldNames(records: LarkColorRecord[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const r of records) {
    for (const k of Object.keys(r.fields ?? {})) {
      if (!seen.has(k)) { seen.add(k); out.push(k); }
    }
  }
  return out;
}

/** Bản ghi Lark → lưới (headers = tên cột) để đi CHUNG đường `buildColorSource` với CSV. */
export function larkRecordsToGrid(records: LarkColorRecord[], fieldNames?: string[]): ParsedGrid {
  const headers = fieldNames ?? larkFieldNames(records);
  const rows = records.map((r) => headers.map((h) => larkTextOf((r.fields ?? {})[h])));
  return { headers, rows };
}

export interface LarkColorSourceInput {
  id: string;
  name: string;
  /** Ghép cột do người dùng chốt trong IF. Bỏ trống → tự đoán theo tên cột. */
  mapping?: ColorColumnMapping;
  scope: ColorSourceScope;
  projectId?: string;
  licenseNote?: string;
  now?: number;
}

/** Bản ghi Lark → `ColorSource` + danh sách dòng lỗi (cùng bộ kiểm với CSV, không luật thứ hai). */
export function mapLarkRecordsToColorSource(
  records: LarkColorRecord[],
  input: LarkColorSourceInput,
): BuildColorSourceResult & { fieldNames: string[]; mapping: ColorColumnMapping } {
  const fieldNames = larkFieldNames(records);
  const grid = larkRecordsToGrid(records, fieldNames);
  const mapping = input.mapping ?? guessColorMapping(fieldNames);
  const built = buildColorSource({
    ...grid,
    mapping,
    id: input.id,
    name: input.name,
    origin: 'larkbase',
    scope: input.scope,
    projectId: input.projectId,
    licenseNote: input.licenseNote,
    now: input.now,
  });
  return { ...built, fieldNames, mapping };
}

/* ═══════════════════════ Cửa gọi từ client ═══════════════════════ */

export interface LarkColorPullRequest {
  tableId: string;
  base?: 'atlas' | 'work';
  /** Có `mapping` = kéo thật; không có = chỉ xem trước tên cột + 20 dòng đầu. */
  mapping?: ColorColumnMapping;
  sourceName?: string;
}

export interface LarkColorPreviewResponse {
  ok: true;
  mode: 'preview';
  fieldNames: string[];
  /** Mapping IF tự đoán — UI đổ sẵn vào bảng ghép cột cho người dùng sửa. */
  guessed: ColorColumnMapping;
  sampleRows: string[][];
  recordCount: number;
}

export interface LarkColorPullResponse {
  ok: true;
  mode: 'pull';
  /** `ColorSource` đã dựng (chưa lưu — client quyết lưu vào studio hay dự án). */
  source: import('./types').ColorSource;
  errors: { row: number; reason: string }[];
  recordCount: number;
}

export type LarkColorResponse = LarkColorPreviewResponse | LarkColorPullResponse;

/**
 * Gọi `/api/colors/lark`. Ném `Error` có chữ đọc được để UI hiện thẳng (không nuốt lỗi — kéo hụt
 * im lặng rồi hiện bảng rỗng là kiểu hỏng khó nhận ra nhất).
 */
export async function pullLarkColorSource(req: LarkColorPullRequest): Promise<LarkColorResponse> {
  const res = await fetch('/api/colors/lark', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  const j = (await res.json().catch(() => null)) as (LarkColorResponse & { error?: string }) | null;
  if (!res.ok || !j || !('ok' in j)) throw new Error(j?.error || `Lỗi máy chủ (HTTP ${res.status}).`);
  return j;
}
