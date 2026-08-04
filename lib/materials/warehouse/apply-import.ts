/**
 * lib/materials/warehouse/apply-import.ts — VIỆC 4: từ bảng đã ghép cột → payload tạo
 * ProductSpec, rồi thật sự gọi API. Tách 2 việc: `buildImportRows` THUẦN (test được, không
 * fetch), `runImport` gọi `POST /api/specs` (đã có sẵn, KHÔNG thêm route bulk mới — "một cỗ máy
 * nhiều mặt tiền": nhập Excel chỉ là một MẶT TIỀN gọi lặp lại API tạo-1-dòng đã có).
 */
import type { ParsedSheet } from './xlsx-parse';
import type { ColumnMapping } from './column-mapping';
import type { MaterialWritePayload } from './dto';
import { uploadMaterialImage } from './image-match';

export interface ImportRowResult {
  rowIndex: number; // 0-based, tính TỪ dòng dữ liệu đầu tiên (không tính header)
  payload: MaterialWritePayload | null;
  /** Lỗi ghép cột/giá trị — null nghĩa dòng hợp lệ, sẵn sàng gửi. */
  error: string | null;
}

function numOrUndef(v: string): number | undefined {
  if (!v.trim()) return undefined;
  const n = Number(v.trim().replace(/[.,](?=\d{3}\b)/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
}

/** Ghép TOÀN BỘ bảng đã đọc theo mapping — mỗi dòng → payload + lỗi (nếu thiếu field bắt buộc
 * `name` hoặc giá không đọc được số). THUẦN — không I/O, dùng cho cả preview 20 dòng VÀ nhập
 * thật toàn bộ. */
export function buildImportRows(sheet: ParsedSheet, mapping: ColumnMapping): ImportRowResult[] {
  const get = (row: string[], field: keyof ColumnMapping): string => {
    const idx = mapping[field];
    return idx == null ? '' : (row[idx] ?? '').trim();
  };
  return sheet.rows.map((row, rowIndex) => {
    const name = get(row, 'name');
    if (!name) {
      return { rowIndex, payload: null, error: 'Thiếu "Tên" — bỏ qua dòng này.' };
    }
    const priceRaw = get(row, 'priceVnd');
    const priceVnd = priceRaw ? numOrUndef(priceRaw) : undefined;
    if (priceRaw && priceVnd === undefined) {
      return { rowIndex, payload: null, error: `Giá "${priceRaw}" không đọc được thành số.` };
    }
    const payload: MaterialWritePayload = {
      name,
      sku: get(row, 'sku') || undefined,
      brand: get(row, 'brand') || undefined,
      unit: get(row, 'unit') || undefined,
      priceVnd,
      note: get(row, 'note') || undefined,
      w: numOrUndef(get(row, 'w')),
      d: numOrUndef(get(row, 'd')),
      hUp: numOrUndef(get(row, 'hUp')),
    };
    return { rowIndex, payload, error: null };
  });
}

/** Tải TUẦN TỰ mọi ảnh đã ghép theo SKU lên Thư viện — chạy TRƯỚC `runImport` để có
 * `imageAssetId` truyền vào. Ảnh lỗi (quá lớn/hỏng) KHÔNG chặn cả lô — bỏ qua SKU đó, dòng liên
 * quan vẫn tạo được, chỉ là chưa có ảnh (đúng tinh thần "báo lỗi dòng hỏng", không sập cả import). */
export async function uploadMatchedImages(
  imageBySku: Map<string, File>,
  onProgress?: (done: number, total: number) => void,
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const entries = [...imageBySku.entries()];
  for (let i = 0; i < entries.length; i++) {
    const [sku, file] = entries[i];
    try {
      const { imageAssetId } = await uploadMaterialImage(file);
      out.set(sku, imageAssetId);
    } catch {
      /* 1 ảnh lỗi không chặn lô — dòng đó tạo được, chỉ thiếu ảnh */
    }
    onProgress?.(i + 1, entries.length);
  }
  return out;
}

export interface RunImportOutcome {
  ok: number;
  failed: { rowIndex: number; name: string; error: string }[];
}

/** Gửi TỪNG dòng hợp lệ lên `POST /api/specs` (kind='material') — tuần tự (không Promise.all)
 * để: (a) không dội N request cùng lúc lên 1 API vốn cho nhập tay 1-dòng, (b) `onProgress` báo
 * đúng tiến độ cho UI. `imageBySku` (nếu có, từ VIỆC 4 "ghép ảnh theo SKU") gắn `imageAssetId`
 * TRƯỚC khi tạo dòng — ảnh phải có sẵn asset id mới gắn được. */
export async function runImport(
  rows: ImportRowResult[],
  opts: {
    imageAssetIdBySku?: Map<string, string>;
    onProgress?: (done: number, total: number) => void;
  } = {},
): Promise<RunImportOutcome> {
  const valid = rows.filter((r) => r.payload && !r.error);
  const failed: RunImportOutcome['failed'] = rows
    .filter((r) => r.error)
    .map((r) => ({ rowIndex: r.rowIndex, name: '', error: r.error! }));
  let ok = 0;
  for (let i = 0; i < valid.length; i++) {
    const { payload, rowIndex } = valid[i];
    const p = payload!;
    const imageAssetId = p.sku && opts.imageAssetIdBySku ? opts.imageAssetIdBySku.get(p.sku) : undefined;
    try {
      const res = await fetch('/api/specs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'material', ...p, imageAssetId: imageAssetId ?? p.imageAssetId }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        failed.push({ rowIndex, name: p.name, error: j?.error || `HTTP ${res.status}` });
      } else {
        ok++;
      }
    } catch (e) {
      failed.push({ rowIndex, name: p.name, error: e instanceof Error ? e.message : String(e) });
    }
    opts.onProgress?.(i + 1, valid.length);
  }
  return { ok, failed };
}
