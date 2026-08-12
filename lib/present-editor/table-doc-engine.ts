/**
 * lib/present-editor/table-doc-engine.ts — TableDocEngine (Đợt 4, `docs/phieu-giao/
 * editor-bang-bieu-mau.md`): ENGINE BẢNG DÙNG CHUNG cho mọi hồ sơ dạng bảng ở chặng Trình chiếu —
 * `schedule` (Bảng thống kê, v1 sống thật ở đợt này) → `spec-sheet` → `approval-form` (2 loại sau
 * CHƯA có UI, xem `PresentDocTypePicker`) — "một cỗ máy, nhiều mặt tiền" (CLAUDE.md).
 *
 * TRỪU TƯỢNG TỪ BOQ (KHÔNG viết engine lần 2): cơ chế cột/dòng/override ở đây là sự khái quát hoá
 * TRỰC TIẾP của 2 file đã có sẵn cho BOQ, đọc kỹ trước khi sửa gì ở đây:
 *   - `lib/present-editor/boq-overrides.ts` — "sửa tay 1 ô = LỚP PHỦ trên dữ liệu máy, không ghi
 *     đè". Ở đây tổng quát hoá `BoqOverride{matId,field}` → `TableCellOverride{rowId,colKey}`.
 *   - `lib/present-editor/boq-group.ts` — nhóm dòng + subtotal theo 1 khoá. Ở đây tổng quát hoá
 *     thành `groupTableRows()` đọc thẳng `row.groupKey`/`row.groupLabel` (đã gắn sẵn lúc gieo dòng,
 *     xem `TableRowSeed`) thay vì tính lại từ `Doc` mỗi lần group (BOQ tính lại vì group của nó —
 *     tầng/phòng — có thể đổi độc lập với `computeBoq`; ở TableDocEngine, phép gieo dòng NÀO cũng
 *     đi kèm quyết định nhóm luôn, nên lưu thẳng trên dòng là đủ, không cần tham số `Doc` rời).
 *
 * KHÁC BOQ một điểm CÓ CHỦ Ý (ghi rõ, không giấu — CLAUDE.md §"khi phát hiện tài liệu sai"):
 * BOQ không cần theo dõi "dòng đã biến mất khỏi bản vẽ" vì `computeBoq` LUÔN quét lại TOÀN BỘ
 * `Doc` mỗi lần và trả đúng tập dòng hiện có — không dòng nào "mồ côi" cả (đổi bản vẽ ⇒ đổi hẳn
 * tập `matId`, override cũ chỉ đơn giản không còn khớp `matId` nào thì im lặng không hiện, không
 * cần cờ riêng). TableDocEngine phục vụ THÊM ca BOQ không cần: `schedule` gắn 1 DÒNG = 1 ENTITY
 * (không gộp theo vật liệu) — người dùng xoá 1 cửa trên bản vẽ thì dòng đó "biến mất khỏi nguồn"
 * nhưng có thể ĐANG MANG ghi chú tay quan trọng (vd "cửa này đặt hàng rồi") — xoá âm thầm là mất
 * dữ liệu tay (luật 6, CLAUDE.md). Nên đây có thêm `resyncTableRows()` + cờ `TableRow.orphaned`,
 * BOQ không cần khái niệm này.
 *
 * THUẦN — không React/DOM/store-instance/import alias `@/` (test bằng sucrase-node thẳng, cùng
 * khuôn `boq-group.ts`/`boq-overrides.ts`).
 */

/* ────────────────────────────── CỘT ────────────────────────────── */

export type TableCellValue = string | number | null;

export interface TableColumnDef {
  key: string;
  /** [vi, en] — nhãn hiển thị. SPEC-NGON-NGU: không lộ jargon docType ra chữ này. */
  label: [string, string];
  kind?: 'text' | 'number' | 'currency';
  align?: 'left' | 'right' | 'center';
  /** Người dùng sửa tay được ô này không (mặc định coi như true nếu bỏ trống — xem
   * `isColumnEditable`). Cột suy từ danh tính entity (vd tên) thường đặt false. */
  editable?: boolean;
  /** true = cột này cộng dồn được ở dòng tổng nhóm (`groupTableRows`) — chỉ có ý nghĩa với
   * `kind:'number'`/`'currency'`. */
  summable?: boolean;
}

export function isColumnEditable(col: TableColumnDef): boolean {
  return col.editable !== false;
}

/* ────────────────────────────── DÒNG ────────────────────────────── */

/**
 * 1 dòng — GIÁ TRỊ MÁY thuần trong `cells` (chưa áp override, cùng nguyên tắc `BoqRow` không biết
 * gì về override của chính nó). Sửa tay là LỚP PHỦ riêng, xem `TableOverrideMap` bên dưới.
 */
export interface TableRow {
  /** id ỔN ĐỊNH. Quy ước: `entity:<entityId>` khi dòng gieo từ 1 entity Doc thật (để `resync`
   * khớp đúng dòng cũ/mới cùng entity đó) — dòng thêm tay dùng `newRowId()`. */
  id: string;
  /** entity nguồn (Doc 2D) — có giá trị ⇒ dòng "lấy từ mô hình", bấm để soi trên bản vẽ (đúng UX
   * đã có ở `BoqScreen#viewOnDrawing`). Bỏ trống = dòng nhập tay thuần, không có gì để re-sync. */
  entityId?: string;
  groupKey?: string;
  groupLabel?: string;
  cells: Record<string, TableCellValue>;
  /**
   * true = lần `resyncTableRows` GẦN NHẤT không còn thấy `entityId` này trong tập dòng gieo mới
   * (nghĩa là entity đã bị xoá/đổi trên bản vẽ). Dòng VẪN GIỮ NGUYÊN (có thể còn override tay) —
   * KHÔNG xoá âm thầm, chỉ đánh dấu để UI hiện rõ (luật 6, CLAUDE.md).
   */
  orphaned?: boolean;
}

/** Dòng GIEO từ nguồn (Doc 2D / nhập file …) — input của `buildTableRows`/`resyncTableRows`. */
export interface TableRowSeed {
  id: string;
  entityId?: string;
  groupKey?: string;
  groupLabel?: string;
  /** CHỈ khai cột nào MÁY có ý kiến. Cột không xuất hiện ở đây (vd "Ghi chú" — cột chỉ nhập tay)
   * được xem là "máy không có gì để nói", giữ nguyên giá trị cũ (nếu có) khi resync — KHÔNG bị
   * ép về rỗng mỗi lần gieo lại. */
  cells: Record<string, TableCellValue>;
}

let _seq = 0;
/** id ổn định cho dòng THÊM TAY (không gắn entity) — khác bộ đếm của `lib/present-editor/model.ts`
 * để module này giữ ĐỘC LẬP (không import file có phụ thuộc React/registry, đúng luật đầu file). */
export function newRowId(prefix = 'row'): string {
  _seq += 1;
  return `${prefix}_${Date.now().toString(36)}_${_seq.toString(36)}`;
}

/** Build dòng LẦN ĐẦU từ danh sách seed — mọi ô đều là giá trị máy (chưa có override nào cả, xem
 * `TableOverrideMap`). Cột seed không khai (vd "Ghi chú") ⇒ dòng có `cells` KHÔNG chứa key đó
 * (undefined khi đọc — hiển thị coi như rỗng, người dùng gõ vào sẽ tạo override, xem
 * `applyTableOverrides`). */
export function buildTableRows(seeds: TableRowSeed[]): TableRow[] {
  return seeds.map((s) => ({
    id: s.id,
    entityId: s.entityId,
    groupKey: s.groupKey,
    groupLabel: s.groupLabel,
    cells: { ...s.cells },
  }));
}

export interface ResyncResult {
  rows: TableRow[];
  /** dòng entity MỚI xuất hiện trong bản vẽ, chưa từng có ở lần gieo trước. */
  added: number;
  /** dòng entity đã CÓ từ trước, khớp lại (giá trị máy có thể đã đổi). */
  matched: number;
  /** dòng entity đã có TỪ TRƯỚC nhưng lần gieo NÀY không còn thấy — đánh dấu `orphaned`, không xoá. */
  orphanedNow: number;
}

/**
 * RE-SYNC ("Cập nhật từ bản vẽ", luật 6): gieo lại từ `Doc` hiện tại, giữ NGUYÊN mọi dòng cũ +
 * cập nhật GIÁ TRỊ MÁY của các cột seed khai — override tay (`TableOverrideMap`, áp ở bước hiển
 * thị `applyTableOverrides`, KHÔNG nằm trong `TableRow.cells`) không hề bị đụng tới vì hàm này
 * chỉ thao tác trên `cells` (giá trị máy), tách bạch hoàn toàn khỏi override — đúng cách BOQ đã
 * làm (`applyBoqOverrides` không bao giờ ghi vào `BoqRow` gốc).
 *
 * Dòng KHÔNG có `entityId` (thêm tay thuần) không tham gia re-sync theo bất kỳ chiều nào — seed
 * luôn có `entityId`, nên dòng tay không match/không bị đánh `orphaned`.
 */
export function resyncTableRows(prevRows: TableRow[], seeds: TableRowSeed[]): ResyncResult {
  const prevById = new Map(prevRows.map((r) => [r.id, r]));
  const seedIds = new Set(seeds.map((s) => s.id));
  let added = 0;
  let matched = 0;

  const nextRows: TableRow[] = seeds.map((s) => {
    const prev = prevById.get(s.id);
    if (!prev) {
      added += 1;
      return { id: s.id, entityId: s.entityId, groupKey: s.groupKey, groupLabel: s.groupLabel, cells: { ...s.cells } };
    }
    matched += 1;
    // Giữ mọi cột CŨ (kể cả cột seed không khai, vd cột chỉ-nhập-tay), CHỈ ghi đè cột seed CÓ khai
    // — đây chính là "giá trị máy" mới nhất; override tay nằm ở map RIÊNG nên không bị ảnh hưởng.
    return {
      id: s.id,
      entityId: s.entityId,
      groupKey: s.groupKey,
      groupLabel: s.groupLabel,
      cells: { ...prev.cells, ...s.cells },
      orphaned: false,
    };
  });

  let orphanedNow = 0;
  for (const prev of prevRows) {
    if (!prev.entityId) continue; // dòng thêm tay — không thuộc phạm vi re-sync
    if (seedIds.has(prev.id)) continue; // đã xử lý ở nhánh match trên
    orphanedNow += 1;
    nextRows.push({ ...prev, orphaned: true });
  }
  // Dòng thêm tay thuần (không entityId) luôn được GIỮ NGUYÊN, không đi qua seed nào cả.
  for (const prev of prevRows) {
    if (prev.entityId) continue;
    nextRows.push(prev);
  }

  return { rows: nextRows, added, matched, orphanedNow };
}

/* ────────────────────────────── OVERRIDE (sửa tay) ────────────────────────────── */
/* Tổng quát hoá TRỰC TIẾP `boq-overrides.ts` — matId::field → rowId::colKey. */

export interface TableCellOverride {
  rowId: string;
  colKey: string;
  value: TableCellValue;
  /** epoch ms lúc sửa — hiện "Sửa lúc", cùng `BoqOverride.at`. */
  at: number;
}

export function overrideKey(rowId: string, colKey: string): string {
  return `${rowId}::${colKey}`;
}

export type TableOverrideMap = Record<string, TableCellOverride>;

export interface TableCellOverrideInfo {
  value: TableCellValue;
  machineValue: TableCellValue;
  at: number;
}

export interface TableDisplayRow extends TableRow {
  /** colKey → thông tin override — CHỈ có mặt ở cột đang bị sửa tay (đúng cách `BoqDisplayRow`
   * chỉ set `m2Override`/`donGiaOverride` khi có). */
  overrides?: Record<string, TableCellOverrideInfo>;
}

/**
 * Áp override lên dòng máy — THUẦN, không đọc IDB. Dòng không có override nào trả về Y NGUYÊN
 * tham chiếu gốc (không tạo object mới) — cùng chủ ý `applyBoqOverrides`: UI/test so identity biết
 * dòng nào KHÔNG bị đụng.
 */
export function applyTableOverrides(rows: TableRow[], overrides: TableOverrideMap): TableDisplayRow[] {
  return rows.map((row) => {
    const rowOverrides: Record<string, TableCellOverrideInfo> = {};
    let has = false;
    for (const key of Object.keys(overrides)) {
      const ov = overrides[key];
      if (ov.rowId !== row.id) continue;
      rowOverrides[ov.colKey] = { value: ov.value, machineValue: row.cells[ov.colKey] ?? null, at: ov.at };
      has = true;
    }
    if (!has) return row;
    const cells: Record<string, TableCellValue> = { ...row.cells };
    for (const colKey of Object.keys(rowOverrides)) cells[colKey] = rowOverrides[colKey].value;
    return { ...row, cells, overrides: rowOverrides };
  });
}

/** Đặt 1 override — hàm THUẦN, immutable update (cùng chữ ký tinh thần `setOverride` của BOQ).
 * `value === null` (ô bị xoá trắng tay) VẪN là 1 override hợp lệ — khác BOQ (nơi NaN = revert) vì
 * cột chữ ("Ghi chú") hợp lệ để RỖNG CÓ CHỦ Ý, không phải "bỏ sửa". Muốn quay lại số máy thì gọi
 * `revertTableOverride`, không suy đoán từ giá trị. */
export function setTableOverride(
  map: TableOverrideMap,
  rowId: string,
  colKey: string,
  value: TableCellValue,
  now: number,
): TableOverrideMap {
  return { ...map, [overrideKey(rowId, colKey)]: { rowId, colKey, value, at: now } };
}

/** Revert 1 ô về giá trị máy — xoá override khỏi map. */
export function revertTableOverride(map: TableOverrideMap, rowId: string, colKey: string): TableOverrideMap {
  const key = overrideKey(rowId, colKey);
  if (!(key in map)) return map;
  const { [key]: _omit, ...rest } = map;
  return rest;
}

/** Đếm cho thanh trạng thái "Lấy từ mô hình N · Đã sửa tay M" — 1 dòng có ÍT NHẤT 1 ô override
 * tính là "đã sửa tay" (cùng cách đếm `countOverrideStatus` của BOQ: đếm DÒNG, không đếm Ô). */
export function countTableOverrideStatus(rows: TableDisplayRow[]): { fromModel: number; handEdited: number; orphaned: number } {
  let handEdited = 0;
  let orphaned = 0;
  for (const r of rows) {
    if (r.overrides && Object.keys(r.overrides).length > 0) handEdited += 1;
    if (r.orphaned) orphaned += 1;
  }
  return { fromModel: rows.length - handEdited, handEdited, orphaned };
}

/* ────────────────────────────── NHÓM + TỔNG ────────────────────────────── */

export interface TableGroup {
  key: string;
  label: string;
  rows: TableDisplayRow[];
  /** số dòng trong nhóm — luôn có, không cần cột nào `summable`. */
  count: number;
  /** colKey → tổng (chỉ cột `summable`, chỉ cộng giá trị `number` — ô chữ/null bỏ qua). */
  totals: Record<string, number>;
}

const NO_GROUP_KEY = '__none__';

/** Nhóm dòng theo `row.groupKey` (đã gắn sẵn lúc gieo — xem docstring đầu file) — thứ tự nhóm =
 * thứ tự GẶP LẦN ĐẦU trong `rows` (ổn định, không phụ thuộc thứ tự Map nội bộ), cùng bất biến của
 * `groupBoqRowsByStorey`. */
export function groupTableRows(rows: TableDisplayRow[], columns: TableColumnDef[]): TableGroup[] {
  const order: string[] = [];
  const groups = new Map<string, TableGroup>();
  const summableKeys = columns.filter((c) => c.summable).map((c) => c.key);

  for (const row of rows) {
    const key = row.groupKey ?? NO_GROUP_KEY;
    const label = row.groupLabel ?? key;
    let g = groups.get(key);
    if (!g) {
      g = { key, label, rows: [], count: 0, totals: {} };
      groups.set(key, g);
      order.push(key);
    }
    g.rows.push(row);
    g.count += 1;
    for (const colKey of summableKeys) {
      const v = row.cells[colKey];
      if (typeof v === 'number' && Number.isFinite(v)) g.totals[colKey] = (g.totals[colKey] ?? 0) + v;
    }
  }

  return order.map((k) => groups.get(k) as TableGroup);
}

/* ────────────────────────────── TÀI LIỆU BẢNG (persist) ────────────────────────────── */

/** Gói 1 docType bảng thành 1 đối tượng — dùng khi cần lưu/khôi phục NGUYÊN VẸN (rows + cấu hình
 * cột) mà không cần đọc lại Doc, vd xem lại 1 bảng đã đóng băng. V1 (`schedule`) KHÔNG dùng dạng
 * gói này để lưu — persist thật đi qua `TableRow[]`/`TableOverrideMap` riêng (xem
 * `table-doc-persist.ts`) vì cột suy từ CONFIG của docType (không đổi theo dự án), lưu lại cột mỗi
 * lần là dư thừa. Giữ hàm gói/mở gói ở đây cho ca SAU cần round-trip đầy đủ (spec-sheet/
 * approval-form có thể cần đóng băng cả cấu hình cột nếu cho phép tuỳ biến cột theo dự án).
 */
export interface TableDoc {
  docType: string;
  columns: TableColumnDef[];
  rows: TableRow[];
  syncedAt: number;
}

interface TableDocFile {
  v: 1;
  doc: TableDoc;
}

export function serializeTableDoc(doc: TableDoc): string {
  const file: TableDocFile = { v: 1, doc };
  return JSON.stringify(file);
}

/** Parse — trả `null` khi JSON hỏng/sai version (KHÔNG throw, đúng thói quen `importIdfp`). */
export function parseTableDoc(json: string): TableDoc | null {
  try {
    const parsed = JSON.parse(json) as Partial<TableDocFile>;
    if (parsed?.v !== 1 || !parsed.doc || !Array.isArray(parsed.doc.rows) || !Array.isArray(parsed.doc.columns)) return null;
    return parsed.doc;
  } catch {
    return null;
  }
}
