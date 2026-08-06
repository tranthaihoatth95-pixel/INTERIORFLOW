/**
 * lib/materials/warehouse/apply-import.ts — VIỆC 4: từ bảng đã ghép cột → payload tạo
 * ProductSpec, rồi thật sự gọi API. Tách 2 việc: `buildImportRows` THUẦN (test được, không
 * fetch), `runImport` gọi `POST /api/specs` (đã có sẵn, KHÔNG thêm route bulk mới — "một cỗ máy
 * nhiều mặt tiền": nhập Excel chỉ là một MẶT TIỀN gọi lặp lại API tạo-1-dòng đã có).
 *
 * ─── 06/08 · hai thay đổi, đọc kỹ ranh giới ───────────────────────────────────────────────
 * (1) G-M3-07 — `kind` KHÔNG còn ép cứng `'material'`. Món nội thất rời nhập vào kho từng biến
 *     thành "vật liệu" dù `ProductSpec.kind` có sẵn giá trị `'furniture'`. Nay: `guessImportKind`
 *     đoán theo dữ liệu, người nhập chọn đè trên UI (`MaterialImportWizard`).
 * (2) G-M3-05/08 — mỗi dòng nay dựng SONG SONG hai thứ:
 *       · `payload` → `ProductSpec` (DANH MỤC: món này tồn tại, giá bao nhiêu) — đi vào DB;
 *       · `ffe`     → `FfeItem`     (LẦN XUẤT HIỆN: mấy cái, ở phòng nào, tin tới đâu) — KHÔNG
 *         đi vào DB đợt này, xem `SPEC_ROOM_COLUMN_READY` ở `lib/server/specs.ts`.
 *     Đây KHÔNG phải hai nguồn sự thật cạnh tranh: chúng là hai tầng khác nhau của cùng một món,
 *     nối nhau bằng `specId` sau khi tạo xong (`runImport` gắn lại id thật trả về từ API).
 */
import type { ParsedSheet } from './xlsx-parse';
import type { ColumnMapping } from './column-mapping';
import type { MaterialWritePayload } from './dto';
import { uploadMaterialImage, isDirectImageUrl } from './image-match';
import { makeFfeItem, normalizeQty, isCountUnit, FFE_DEFAULT_UNIT, type FfeConfidence, type FfeItem, type FfeTable } from '../../ffe/item';
import { emptyFfeTable } from '../../ffe/port';
import { splitMaterials, normalizeColorHex } from '../../ffe/from-measurement';

export interface ImportRowResult {
  rowIndex: number; // 0-based, tính TỪ dòng dữ liệu đầu tiên (không tính header)
  payload: MaterialWritePayload | null;
  /**
   * Món rời tương ứng dòng này — mang những trường `ProductSpec` KHÔNG có chỗ chứa (số lượng ·
   * phòng · độ tin cậy). `null` khi dòng hỏng (cùng lúc với `payload === null`).
   */
  ffe: FfeItem | null;
  /** Lỗi ghép cột/giá trị — null nghĩa dòng hợp lệ, sẵn sàng gửi. */
  error: string | null;
  /**
   * CẢNH BÁO (06/08, vòng KIỂM PHẢN BIỆN) — dòng VẪN được nhập, nhưng có thứ app không đọc được
   * và người dùng phải biết. Khác `error` (dòng bị loại hẳn). Trống = không có gì phải nói.
   */
  warnings: string[];
  /** Giá trị thô của cột "Ảnh" (tên file hoặc URL) — dùng để ghép ảnh theo dòng. */
  imageRef?: string;
}

/**
 * Đọc một ô SỐ. Nhận được cả `2.450.000`, `2,450,000`, `2 450 000`, `2450000 VND`, `2.450.000 đ`,
 * `1.234,5`.
 *
 * ⑥ (KIỂM PHẢN BIỆN 06/08) — trước đây `'2.450.000 đ'` trả `undefined` ⇒ `buildImportRows` VỨT CẢ
 * DÒNG. Bảng giá NCC Việt Nam ghi kèm "đ"/"VND" là chuyện thường; vứt cả món chỉ vì cái đuôi tiền
 * tệ là quá tay, trong khi hệ thống đã có sẵn ngữ nghĩa `priceVnd = null` = "chưa có giá" và bảng
 * FF&E đã có ô hiện đúng chữ đó.
 *
 * Cách đọc: bỏ ký hiệu tiền tệ + chữ cái + khoảng trắng → còn lại chỉ số/dấu. Nếu có CẢ `.` và
 * `,` thì dấu ĐỨNG SAU là dấu thập phân (hợp cả `1.234,5` kiểu VN lẫn `1,234.5` kiểu Anh–Mỹ).
 * Nếu chỉ có một loại dấu và nó phân nhóm 3 chữ số (`2.450.000`) thì đó là dấu ngăn NGHÌN.
 */
/** Đuôi ĐƯỢC PHÉP bỏ đi vì KHÔNG đổi ĐỘ LỚN con số: ký hiệu tiền tệ, đơn vị đếm, và `mm` (đúng
 * bằng đơn vị của chính cột kích thước). Danh sách CÓ HẠN, cố ý.
 * ⛔ KHÔNG có `m`/`cm`/`m2` ở đây: cột khai là mm mà ô ghi `1,5m` thì con số thật là 1500, bóc chữ
 * `m` đi rồi nhận 1,5 chính là kiểu sai âm thầm mà bản vá này sinh ra để diệt. Thà từ chối ồn ào. */
const HARMLESS_NUMBER_SUFFIX = /^(đ|d|vnd|₫|\$|vnđ|dong|đồng|mm|cái|cai|chiếc|chiec|bộ|bo|pcs)$/i;

export function parseNumberCell(v: string): number | undefined {
  const raw = v.trim();
  if (!raw) return undefined;

  /* 🔴 VÁ VÒNG 2 (kiểm phản biện 06/08) — bản trước bóc SẠCH mọi chữ trước khi đọc số, nên đuôi
     ĐỘ LỚN bị nuốt và ra số sai mà KHÔNG báo gì: `2.45tr` → **2,45đ** · `2tr5` → 25đ · `1,5 triệu`
     → 1,5đ · `50k` → 50đ · `1e3` → 13 (bản CŨ ra đúng 1000 — hồi quy thuần) · `(1.500.000)` →
     **+1.500.000** (lách luôn chốt giá-âm vì dấu ngoặc đã bị bóc). Cùng parser này dùng cho w/d/h:
     `1,5m` → w = 1.5 mm thay vì 1500.
     Số SAI mà trông như đúng nguy hiểm hơn hẳn số bị từ chối — trước bản vá cả 6 ca này đều bị
     TỪ CHỐI (ồn ào, người dùng sửa được). Nay: chỉ bỏ những đuôi KHÔNG đổi độ lớn; còn lại từ
     chối. Hậu tố độ lớn (tr/triệu/k/tỷ) cố ý CHƯA hỗ trợ — quy đổi ngầm số tiền là việc phải
     Hoà chốt, không phải thứ tự quyết trong một bản vá. */
  const accounting = /^\(\s*[\d.,\s]+\s*\)$/.test(raw); // (1.500.000) = âm, quy ước kế toán
  const core = accounting ? raw.replace(/[()]/g, '') : raw;
  const leftover = core.replace(/[\d.,\-\s ]/g, '').trim();
  if (leftover && !HARMLESS_NUMBER_SUFFIX.test(leftover)) return undefined;

  let s = core.replace(/[^\d.,\-]/g, '');
  if (!s || !/\d/.test(s)) return undefined;
  if (accounting) s = `-${s}`;

  const lastDot = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');
  if (lastDot >= 0 && lastComma >= 0) {
    const decimalSep = lastDot > lastComma ? '.' : ',';
    const groupSep = decimalSep === '.' ? ',' : '.';
    s = s.split(groupSep).join('').replace(decimalSep, '.');
  } else {
    const sep = lastDot >= 0 ? '.' : lastComma >= 0 ? ',' : '';
    if (sep) {
      const parts = s.split(sep);
      // mọi nhóm sau dấu đều đúng 3 chữ số ⇒ dấu ngăn NGHÌN (2.450.000); ngược lại ⇒ thập phân
      const isGrouping = parts.length > 1 && parts.slice(1).every((p) => /^\d{3}$/.test(p));
      s = isGrouping ? parts.join('') : parts.join('.');
    }
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function numOrUndef(v: string): number | undefined {
  return parseNumberCell(v);
}

/** Chuẩn hoá chuỗi độ tin cậy người ta gõ trong Excel về đúng 3 mức của `FfeConfidence`.
 * Không nhận ra ⇒ `undefined` (chưa biết) — KHÔNG đoán thành 'measured', vì khoe "đo được" cho
 * một con số thật ra là ước lượng chính là kiểu sai nguy hiểm nhất trong hồ sơ kỹ thuật. */
export function parseConfidenceCell(raw: string): FfeConfidence | undefined {
  const s = raw
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim();
  if (!s) return undefined;
  if (/(do duoc|da do|measured|chinh xac|exact)/.test(s)) return 'measured';
  if (/(suy|uoc|inferred|estimate|khoang|~)/.test(s)) return 'inferred';
  if (/(tay|manual|nhap)/.test(s)) return 'manual';
  return undefined;
}

/**
 * Đoán LOẠI bản ghi cho cả lô, theo dữ liệu thật chứ không theo tên file (G-M3-07).
 * Luật đoán, đơn giản và giải thích được cho người dùng:
 *  - có ĐỦ 3 chiều rộng/sâu/cao **và** đơn vị là đơn vị ĐẾM (cái/bộ/chiếc…) ⇒ `'furniture'`
 *    (một món có kích thước 3 chiều và đếm bằng cái = đồ rời, không phải vật liệu bán theo m²);
 *  - còn lại ⇒ `'material'` (giữ nguyên hành vi cũ — không đổi kết quả của mọi file NCC đang dùng).
 * Chỉ là ĐOÁN: UI luôn cho chọn đè, và giá trị đoán được hiện rõ để người dùng đối chiếu.
 */
export function guessImportKind(sheet: ParsedSheet, mapping: ColumnMapping): 'material' | 'furniture' {
  const has3d = mapping.w != null && mapping.d != null && mapping.hUp != null;
  if (!has3d) return 'material';
  const unitIdx = mapping.unit;
  if (unitIdx == null) return 'furniture'; // đủ 3 chiều mà không khai đơn vị ⇒ nghiêng về đồ rời
  const sample = sheet.rows.slice(0, 20).map((r) => (r[unitIdx] ?? '').trim()).filter(Boolean);
  if (sample.length === 0) return 'furniture';
  const countish = sample.filter((u) => isCountUnit(u)).length;
  return countish * 2 >= sample.length ? 'furniture' : 'material';
}

/** Ghép TOÀN BỘ bảng đã đọc theo mapping — mỗi dòng → payload + món rời + lỗi (nếu thiếu field
 * bắt buộc `name`, giá không đọc được số, hoặc số lượng không đọc được số). THUẦN — không I/O,
 * dùng cho cả preview 20 dòng VÀ nhập thật toàn bộ. */
export function buildImportRows(sheet: ParsedSheet, mapping: ColumnMapping): ImportRowResult[] {
  const get = (row: string[], field: keyof ColumnMapping): string => {
    const idx = mapping[field];
    return idx == null ? '' : (row[idx] ?? '').trim();
  };
  return sheet.rows.map((row, rowIndex) => {
    const warnings: string[] = [];
    const bad = (error: string): ImportRowResult => ({ rowIndex, payload: null, ffe: null, error, warnings });

    const name = get(row, 'name');
    if (!name) return bad('Thiếu "Tên" — bỏ qua dòng này.');

    const priceRaw = get(row, 'priceVnd');
    const priceVnd = priceRaw ? numOrUndef(priceRaw) : undefined;
    // ⑥ — KHÔNG vứt cả dòng vì mỗi ô giá. Nhận món, để giá TRỐNG ("chưa có giá" là trạng thái hợp
    // lệ có sẵn của hệ thống), và nói thẳng ra. Vứt dòng = mất luôn tên/mã/kích thước người ta đã
    // gõ, chỉ vì một ô phụ.
    if (priceRaw && priceVnd === undefined) {
      warnings.push(`Giá "${priceRaw}" không đọc được thành số — món vẫn được nhập nhưng ĐỂ TRỐNG giá.`);
    }
    if (priceVnd !== undefined && priceVnd < 0) {
      // Giá âm lọt xuống BOQ sẽ thành thành-tiền âm (ca ④d). Chặn NGAY tại cửa nhập.
      return bad(`Giá "${priceRaw}" là số ÂM — không nhập. Sửa lại trong file rồi nhập lại.`);
    }

    const unit = get(row, 'unit') || FFE_DEFAULT_UNIT;
    const qtyRaw = get(row, 'qty');
    // Ô trống ⇒ 1 (mặc định hợp lý). Có chữ mà không ra số ⇒ BÁO LỖI, không âm thầm thay bằng 1:
    // đoán số lượng là đoán tiền (G-M3-09).
    const qty = qtyRaw ? normalizeQty(qtyRaw, unit) : 1;
    if (qty === null) return bad(`Số lượng "${qtyRaw}" không đọc được thành số.`);

    const materials = splitMaterials(get(row, 'materials'));
    const finishes = splitMaterials(get(row, 'finishes'));
    const colorHex = normalizeColorHex(get(row, 'colorHex'));
    const w = numOrUndef(get(row, 'w'));
    const d = numOrUndef(get(row, 'd'));
    const hUp = numOrUndef(get(row, 'hUp'));
    const sku = get(row, 'sku') || undefined;
    const note = get(row, 'note') || undefined;
    const imageRef = get(row, 'image') || undefined;

    const payload: MaterialWritePayload = {
      name,
      sku,
      brand: get(row, 'brand') || undefined,
      unit: get(row, 'unit') || undefined,
      priceVnd,
      note,
      w,
      d,
      hUp,
      materials,
      finishes,
      colorHex,
    };

    const ffe = makeFfeItem({
      name,
      qty,
      unit,
      sku,
      room: get(row, 'room') || undefined,
      confidence: parseConfidenceCell(get(row, 'confidence')),
      confidenceBasis: get(row, 'confidence') || undefined,
      materials,
      finish: finishes?.[0],
      colorHex,
      w,
      d,
      hUp,
      priceVnd: priceVnd ?? null,
      note,
      // URL dùng thẳng được thì gắn luôn vào món (không cần thư mục ảnh); tên file thì để
      // `matchImagesForRows` tìm trong thư mục người dùng kéo vào.
      imageUrl: imageRef && isDirectImageUrl(imageRef) ? imageRef : undefined,
      source: 'import',
    });

    return { rowIndex, payload, ffe, error: null, warnings, imageRef };
  });
}

/** Gom món rời của cả lô thành MỘT bảng — thứ mang `phòng`/`độ tin cậy`/`số lượng` mà
 * `ProductSpec` chưa có chỗ chứa (xem `SPEC_ROOM_COLUMN_READY`). Dòng hỏng bị bỏ, đúng như
 * dòng hỏng không được gửi lên API. */
export function buildFfeTable(rows: ImportRowResult[], label?: string): FfeTable {
  const table = emptyFfeTable(label);
  for (const r of rows) if (r.ffe && !r.error) table.items.push(r.ffe);
  return table;
}

/** Tải TUẦN TỰ mọi ảnh đã ghép theo SKU lên Thư viện — chạy TRƯỚC `runImport` để có
 * `imageAssetId` truyền vào. Ảnh lỗi (quá lớn/hỏng) KHÔNG chặn cả lô — bỏ qua SKU đó, dòng liên
 * quan vẫn tạo được, chỉ là chưa có ảnh (đúng tinh thần "báo lỗi dòng hỏng", không sập cả import). */
export async function uploadMatchedImages<K>(
  imageByKey: Map<K, File>,
  onProgress?: (done: number, total: number) => void,
): Promise<Map<K, string>> {
  const out = new Map<K, string>();
  const entries = [...imageByKey.entries()];
  for (let i = 0; i < entries.length; i++) {
    const [key, file] = entries[i];
    try {
      const { imageAssetId } = await uploadMaterialImage(file);
      out.set(key, imageAssetId);
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
  /**
   * Bảng món của cả lô — `specId`/`imageAssetId` đã gắn lại theo id THẬT do API trả về. Đây là
   * nơi DUY NHẤT giữ `room`/`confidence`/`qty` cho tới khi cột DB được migrate.
   */
  table: FfeTable;
}

/** Gửi TỪNG dòng hợp lệ lên `POST /api/specs` — tuần tự (không Promise.all) để: (a) không dội N
 * request cùng lúc lên 1 API vốn cho nhập tay 1-dòng, (b) `onProgress` báo đúng tiến độ cho UI.
 * `imageBySku` (nếu có, từ VIỆC 4 "ghép ảnh theo SKU") gắn `imageAssetId` TRƯỚC khi tạo dòng —
 * ảnh phải có sẵn asset id mới gắn được.
 *
 * `kind` (06/08, G-M3-07): loại bản ghi cho CẢ LÔ. Mặc định `'material'` giữ nguyên hành vi cũ
 * cho mọi caller chưa truyền — nhưng `MaterialImportWizard` LUÔN truyền, sau khi cho người dùng
 * xác nhận giá trị `guessImportKind` đoán được. */
export async function runImport(
  rows: ImportRowResult[],
  opts: {
    kind?: string;
    /** @deprecated dùng `imageAssetIdByRow` — khoá theo SKU bỏ sót mọi dòng KHÔNG có SKU, và
     * không dùng được cột "Ảnh". Giữ lại cho caller cũ. */
    imageAssetIdBySku?: Map<string, string>;
    /** Ảnh đã tải lên, khoá theo `ImportRowResult.rowIndex` (xem `matchImagesForRows`). Ưu tiên
     * hơn `imageAssetIdBySku` khi cả hai cùng có. */
    imageAssetIdByRow?: Map<number, string>;
    onProgress?: (done: number, total: number) => void;
    tableLabel?: string;
  } = {},
): Promise<RunImportOutcome> {
  const kind = opts.kind || 'material';
  const valid = rows.filter((r) => r.payload && !r.error);
  const failed: RunImportOutcome['failed'] = rows
    .filter((r) => r.error)
    .map((r) => ({ rowIndex: r.rowIndex, name: '', error: r.error! }));
  const table = emptyFfeTable(opts.tableLabel);
  let ok = 0;
  for (let i = 0; i < valid.length; i++) {
    const { payload, rowIndex, ffe } = valid[i];
    const p = payload!;
    const imageAssetId =
      opts.imageAssetIdByRow?.get(rowIndex)
      ?? (p.sku && opts.imageAssetIdBySku ? opts.imageAssetIdBySku.get(p.sku) : undefined);
    try {
      const res = await fetch('/api/specs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, ...p, imageAssetId: imageAssetId ?? p.imageAssetId }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        failed.push({ rowIndex, name: p.name, error: j?.error || `HTTP ${res.status}` });
      } else {
        ok++;
        // Nối LẦN XUẤT HIỆN ↔ DANH MỤC bằng id thật vừa tạo. Đọc id lỗi (API đổi shape) thì món
        // vẫn vào bảng, chỉ là chưa nối được — không đánh rơi dòng vì một trường phụ.
        const created = await res.json().catch(() => null);
        if (ffe) {
          const specId = created?.spec?.id;
          table.items.push({
            ...ffe,
            specId: typeof specId === 'string' ? specId : ffe.specId,
            imageAssetId: imageAssetId ?? ffe.imageAssetId,
          });
        }
      }
    } catch (e) {
      failed.push({ rowIndex, name: p.name, error: e instanceof Error ? e.message : String(e) });
    }
    opts.onProgress?.(i + 1, valid.length);
  }
  return { ok, failed, table };
}
