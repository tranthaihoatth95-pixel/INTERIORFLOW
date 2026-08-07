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
 *       · `ffe`     → `FfeItem`     (LẦN XUẤT HIỆN: mấy cái, ở phòng nào, tin tới đâu).
 *     🟢 CẬP NHẬT 06/08 VÒNG 2: `room` + `confidence` NAY ĐI VÀO DB THẬT (chủ dự án đã chạy
 *     `prisma db push` + `generate`, cờ `SPEC_ROOM_COLUMN_READY` = true) — xem chỗ dựng `payload`.
 *     Riêng `qty` vẫn CHỈ sống ở `ffe`: `ProductSpec` là danh mục dùng chung nhiều dự án, số
 *     lượng là của từng dự án — không có cột, và cố ý không thêm.
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
import { parseNumberCell } from '../../ffe/parse-number';

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
 * Bộ đọc số nay sống ở `lib/ffe/parse-number.ts` — MỘT cỗ máy dùng chung cho cả cửa nhập Excel
 * lẫn `normalizeQty` (`lib/ffe/item.ts`). Trước 06/08 hai nơi có HAI bộ đọc khác nhau, và bộ yếu
 * hơn lại đứng đúng chỗ tính tiền: đo được `normalizeQty('1.200','cai') = 1` trong khi
 * `parseNumberCell('1.200') = 1200` ⇒ hồ sơ FF&E ra 300.000đ thay vì 300.000.000đ, 0 lỗi 0
 * cảnh báo. Một cỗ máy đọc số, không hai — mọi luật đọc/từ chối nay ghi ở đúng một chỗ.
 * Re-export tại đây để caller/test cũ (`import { parseNumberCell } from './apply-import'`) không
 * phải đổi đường import.
 */
export { parseNumberCell };

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
    const w = numOrUndef(get(row, 'w'));
    const d = numOrUndef(get(row, 'd'));
    const hUp = numOrUndef(get(row, 'hUp'));
    const sku = get(row, 'sku') || undefined;
    const imageRef = get(row, 'image') || undefined;

    /* ─── MÀU + ĐỘ TIN CẬY: ghép ĐÚNG CỘT rồi vẫn RƠI GIÁ TRỊ, im lặng (vá 06/08 vòng 3) ───
       Đo được: `normalizeColorHex('Trắng sữa'|'Xám'|'RAL 9010'|'NCS S 1000-N') = undefined` và
       `parseConfidenceCell('Cao'|'Thấp'|'90%') = undefined` ⇒ dòng thật đi vào kho KHÔNG có
       `colorHex`, `warnings: []`. Bảng giá NCC Việt gần như không bao giờ ghi mã hex — nghĩa là
       cột "Màu" người ta bỏ công đưa vào bị nuốt gần như MỌI lần, không một tiếng báo.
       Hai cột xử lý KHÁC NHAU, có lý do:
        · MÀU — chữ gốc KHÔNG còn chỗ nào giữ (`ProductSpec` chỉ có `colorHex` dạng #rrggbb).
          Nếu chỉ cảnh báo thì chữ "Trắng sữa" mất hẳn khỏi kho. ⇒ cảnh báo VÀ gộp nguyên văn vào
          `note` theo khuôn "Màu: Trắng sữa" (note là text tự do, cả 2 tầng đều có) — người dùng
          vẫn tra được, và ngày IF có bảng màu thì đó là dữ liệu để đối chiếu.
          ⛔ KHÔNG đoán hex từ tên màu ("xám" → #808080): swatch sai làm khách đặt nhầm hàng, đúng
          lý do `normalizeColorHex` trả `undefined` ngay từ đầu.
        · ĐỘ TIN CẬY — chữ gốc ĐÃ được giữ nguyên trong `FfeItem.confidenceBasis` (dòng dưới), nên
          chỉ cần CẢNH BÁO là đủ; nhét thêm vào `note` là ghi hai lần cùng một thứ. */
    const colorRaw = get(row, 'colorHex');
    const colorHex = normalizeColorHex(colorRaw);
    const confidenceRaw = get(row, 'confidence');
    const confidence = parseConfidenceCell(confidenceRaw);
    const noteParts = [get(row, 'note')];
    if (colorRaw && !colorHex) {
      warnings.push(`Màu "${colorRaw}" không phải mã màu dạng #rrggbb — món vẫn được nhập, chữ gốc giữ trong Ghi chú, ô Màu để trống (IF không đoán mã màu từ tên gọi).`);
      noteParts.push(`Màu: ${colorRaw}`);
    }
    if (confidenceRaw && !confidence) {
      warnings.push(`Độ tin cậy "${confidenceRaw}" không khớp mức nào của IF (Đo được / Suy đoán / Nhập tay) — món vẫn được nhập, chữ gốc giữ làm căn cứ, mức tin để TRỐNG.`);
    }
    const note = noteParts.filter(Boolean).join(' · ') || undefined;

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
      /* 06/08 VÒNG 2 (G-M3-08) — PHÒNG + ĐỘ TIN CẬY nay xuống được DB thật. Trước hôm nay 2 giá
         trị này CHỈ nằm trong `ffe` (dưới) = state màn hình ⇒ nhập 100 món rồi đóng tab là mất
         sạch. Cột `room`/`confidence` đã có trong `ProductSpec` (chủ dự án chạy `db push` 06/08)
         và `specNormalize()` đã ép kiểu chúng — chỉ còn thiếu đúng 2 dòng này để nối.
         `confidence` gửi MỨC đã nhận ra được; chữ gốc không khớp mức nào ('Cao', '90%') thì để
         TRỐNG + đã cảnh báo ở trên, KHÔNG bịa mức — mức tin bịa còn tệ hơn không có mức tin. */
      room: get(row, 'room') || undefined,
      confidence,
    };

    const ffe = makeFfeItem({
      name,
      qty,
      unit,
      sku,
      room: get(row, 'room') || undefined,
      confidence,
      confidenceBasis: confidenceRaw || undefined,
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

/** Gom món rời của cả lô thành MỘT bảng — tầng LẦN XUẤT HIỆN của lô vừa nhập. Từ 06/08 vòng 2,
 * `phòng`/`độ tin cậy` đã có cột riêng trong `ProductSpec` nên không còn phụ thuộc bảng này để
 * khỏi mất; `số lượng` thì vẫn CHỈ có ở đây (danh mục không giữ số lượng — xem docblock đầu file).
 * Dòng hỏng bị bỏ, đúng như dòng hỏng không được gửi lên API. */
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
