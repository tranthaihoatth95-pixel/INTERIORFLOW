/**
 * lib/materials/warehouse/column-mapping.ts — ghép cột tay (VIỆC 4): đoán mapping ban đầu từ
 * tên tiêu đề cột, để người dùng CHỈNH TAY, rồi NHỚ lại theo chữ ký hàng tiêu đề (không cần đặt
 * tên nhà cung cấp) — lần sau nhập đúng file cùng NCC (tiêu đề y hệt) thì tự điền lại.
 */

/**
 * 06/08 — MỞ RỘNG 9 → 15 trường (G-M3-05, `docs/GAP-IF.md`). Bảng FF&E bốc từ ảnh ra có 9 cột
 * (tên · mã · rộng · sâu · cao · vật liệu · màu · độ tin cậy · phòng) nhưng cửa nhập chỉ nhận 9
 * trường KHÁC ⇒ **vật liệu · màu · độ tin cậy · phòng rơi mất, không một tiếng báo**. Kho dữ liệu
 * thật thì đã có sẵn chỗ: `ProductSpec.materials`/`finishes`/`colorHex` (`prisma/schema.prisma`)
 * — chỉ là cửa nhập chưa nối tới. 6 trường thêm:
 *   · `qty` · `room` · `confidence` — KHÔNG có cột tương ứng trong `ProductSpec` (đó là DANH MỤC:
 *     "món này tồn tại, giá bao nhiêu"; số lượng/phòng/mức tin là chuyện của LẦN XUẤT HIỆN trong
 *     một dự án). Chúng đi vào `FfeTable` mà cửa nhập dựng song song — xem `apply-import.ts`.
 *   · `materials` · `finishes` · `colorHex` — CÓ cột sẵn trong DB, nay nối thẳng xuống.
 * Thứ tự trong mảng = thứ tự ưu tiên khi đoán cột (`guessMapping` gán trước–giữ chỗ), nên 6
 * trường mới xếp SAU 9 trường cũ: hành vi đoán của mọi file NCC đang dùng không đổi.
 */
/**
 * 06/08 (vòng KIỂM PHẢN BIỆN) — thêm trường thứ 16 `image`. Trước đó `MATERIAL_FIELDS` KHÔNG có
 * trường ảnh nào: đường ảnh DUY NHẤT là `matchImagesBySku` (khớp **tên file == SKU**). Bảng thật
 * ghi `ghe-xoay.jpg` trong khi SKU là `CH-MESH-01` ⇒ đo được **0/5 món có ảnh**, và cột "Ảnh"
 * người dùng đưa vào bị bỏ rơi KHÔNG một tiếng nào. `image` nhận: tên file trong thư mục ảnh
 * (`ghe-xoay.jpg`), hoặc URL http(s)/data: dùng thẳng.
 */
export const MATERIAL_FIELDS = [
  'name', 'sku', 'brand', 'unit', 'priceVnd', 'w', 'd', 'hUp', 'note',
  'qty', 'materials', 'finishes', 'colorHex', 'room', 'confidence', 'image',
] as const;
export type MaterialField = (typeof MATERIAL_FIELDS)[number];

export const MATERIAL_FIELD_LABEL: Record<MaterialField, { vi: string; en: string; required?: boolean }> = {
  name: { vi: 'Tên', en: 'Name', required: true },
  sku: { vi: 'Mã (SKU)', en: 'SKU' },
  brand: { vi: 'Hãng', en: 'Brand' },
  unit: { vi: 'Đơn vị', en: 'Unit' },
  priceVnd: { vi: 'Giá', en: 'Price' },
  w: { vi: 'Rộng (mm)', en: 'Width (mm)' },
  d: { vi: 'Sâu (mm)', en: 'Depth (mm)' },
  hUp: { vi: 'Cao (mm)', en: 'Height (mm)' },
  note: { vi: 'Ghi chú', en: 'Note' },
  qty: { vi: 'Số lượng', en: 'Quantity' },
  materials: { vi: 'Vật liệu', en: 'Materials' },
  finishes: { vi: 'Hoàn thiện', en: 'Finishes' },
  colorHex: { vi: 'Màu', en: 'Colour' },
  room: { vi: 'Phòng', en: 'Room' },
  confidence: { vi: 'Độ tin cậy', en: 'Confidence' },
  image: { vi: 'Ảnh (tên file / URL)', en: 'Image (filename / URL)' },
};

/** cột nguồn → field đích. `null` = cột đó không map vào đâu (bỏ qua khi nhập). */
export type ColumnMapping = Record<MaterialField, number | null>;

const EMPTY_MAPPING: ColumnMapping = {
  name: null, sku: null, brand: null, unit: null, priceVnd: null, w: null, d: null, hUp: null, note: null,
  qty: null, materials: null, finishes: null, colorHex: null, room: null, confidence: null, image: null,
};

/** Từ khoá đoán cột theo tên tiêu đề (chuẩn hoá: bỏ dấu, thường hoá) — VN + EN, đúng thói quen
 * bảng giá thật của NCC VN (thường xen tiếng Anh). Thứ tự trong mảng = ưu tiên khi nhiều cột
 * cùng khớp — nhưng thực tế mỗi field chỉ gán CỘT ĐẦU TIÊN khớp (xem `guessMapping`). */
const KEYWORDS: Record<MaterialField, string[]> = {
  name: ['ten san pham', 'ten hang', 'product name', 'ten', 'name', 'item', 'description', 'mo ta'],
  sku: ['ma sp', 'ma san pham', 'sku', 'ma hang', 'ma', 'code', 'item code', 'part no', 'part number'],
  brand: ['hang', 'thuong hieu', 'brand', 'nha san xuat', 'manufacturer'],
  unit: ['dvt', 'don vi tinh', 'don vi', 'unit', 'uom'],
  priceVnd: ['gia', 'don gia', 'price', 'unit price', 'gia tham khao', 'gia ban'],
  w: ['rong', 'w', 'width', 'ngang'],
  d: ['sau', 'd', 'depth', 'dai', 'length', 'dai mm'],
  hUp: ['cao', 'h', 'height', 'chieu cao'],
  note: ['ghi chu', 'note', 'remark'],
  qty: ['so luong', 'sl', 'qty', 'quantity', 'so bo', 'count'],
  materials: ['vat lieu', 'chat lieu', 'material', 'materials'],
  finishes: ['hoan thien', 'be mat', 'finish', 'finishes', 'lop phu'],
  colorHex: ['mau sac', 'mau', 'color', 'colour', 'ma mau', 'hex'],
  room: ['phong', 'khong gian', 'khu vuc', 'vi tri', 'room', 'space', 'location', 'zone'],
  confidence: ['do tin cay', 'tin cay', 'do tin', 'confidence', 'muc do tin cay'],
  image: ['ten file anh', 'file anh', 'duong dan anh', 'link anh', 'url anh', 'hinh anh', 'image url', 'image', 'photo', 'picture', 'anh', 'hinh'],
};

/**
 * Từ khoá CHỈ được khớp NGUYÊN CỤM (vòng 1), CẤM khớp "chứa" (vòng 2).
 *
 * Vì sao cần: `'anh'` là chuỗi con của nhiều tiêu đề tiếng Việt thường gặp — `"Thành tiền"` →
 * `"thanh tien"` CHỨA `"anh"`. `image` là field CUỐI trong `MATERIAL_FIELDS` nên nó nhặt mọi cột
 * chưa ai lấy ⇒ cột "Thành tiền" sẽ bị gán vào ô Ảnh. Cùng đúng cái bẫy đã cắn ở G-M3-06 ('h' của
 * Cao nuốt cột "Phòng"), chỉ khác là 3 ký tự nên `SHORT_KEYWORD_MAX = 2` không chặn được.
 * Giữ chúng ở vòng 1 để tiêu đề đúng bằng "Ảnh"/"Hình" vẫn tự nhận.
 */
const EXACT_ONLY_KEYWORDS: Partial<Record<MaterialField, readonly string[]>> = {
  image: ['anh', 'hinh'],
};

/**
 * ⛔ SỬA BUG G-M3-06 (06/08) — ĐỌC TRƯỚC KHI ĐỔI HÀM NÀY.
 *
 * Trước đây vòng "khớp chứa" dùng `header.includes(keyword)` cho MỌI từ khoá, kể cả từ khoá
 * MỘT CHỮ CÁI (`'h'` của Cao, `'w'` của Rộng, `'d'` của Sâu — chúng có mặt để bắt tiêu đề kiểu
 * "Cao (H mm)"). Hậu quả đo được thật:
 *   · tiêu đề "Phòng" → chuẩn hoá "phong" → CHỨA chữ 'h' ⇒ bị gán vào ô **Cao**;
 *     cột "Cao (H mm)" thật đứng SAU thì bị bỏ luôn (mỗi field chỉ lấy cột đầu tiên khớp)
 *     ⇒ cả lô nhập vào MẤT CHIỀU CAO mà không báo gì.
 *   · tiêu đề "Độ tin cậy" → "do tin cay" → CHỨA 'd' ⇒ bị gán vào ô **Sâu**, cột "Sâu (D mm)"
 *     thật bị bỏ. (Cùng một cái bẫy, đang chờ sẵn ở 'w'.)
 * Cả hai ca đã tái hiện được và khoá lại trong `column-mapping.test.ts`.
 *
 * Cách sửa: từ khoá NGẮN (≤2 ký tự) chỉ khớp khi nó là MỘT TỪ RIÊNG trong tiêu đề — cắt tiêu đề
 * theo ranh giới không-phải-chữ-số ("cao (h mm)" → ['cao','h','mm']). Từ khoá dài giữ nguyên
 * cách khớp "chứa" (an toàn: 3 ký tự trở lên hiếm khi lọt ngẫu nhiên vào từ khác, và đổi cả
 * sang khớp-từ sẽ làm hỏng các tiêu đề dính liền kiểu "ĐVT/ĐƠNGIÁ").
 */
const SHORT_KEYWORD_MAX = 2;

function headerMatchesKeyword(normHeader: string, keyword: string): boolean {
  if (keyword.length > SHORT_KEYWORD_MAX) return normHeader.includes(keyword);
  return normHeader.split(/[^a-z0-9]+/).includes(keyword);
}

const COMBINING_DIACRITICS = /[̀-ͯ]/g;

function normalizeHeader(h: string): string {
  return h
    .normalize('NFD')
    .replace(COMBINING_DIACRITICS, '') // bỏ dấu tiếng Việt (combining marks sau NFD)
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/** Đoán mapping ban đầu từ tiêu đề cột — khớp CHÍNH XÁC chuỗi chuẩn hoá trước, rồi mới khớp
 * "chứa" (contains) để không vồ nhầm cột dài chứa từ khoá ngắn của field khác (vd "đơn vị" vs
 * "đơn giá" đều chứa "đơn" — so khớp cả cụm tránh lẫn). */
export function guessMapping(headers: string[]): ColumnMapping {
  const norm = headers.map(normalizeHeader);
  const out: ColumnMapping = { ...EMPTY_MAPPING };
  const used = new Set<number>();
  for (const field of MATERIAL_FIELDS) {
    const kws = KEYWORDS[field];
    // vòng 1: khớp đúng nguyên cụm
    let idx = norm.findIndex((h, i) => !used.has(i) && kws.includes(h));
    // vòng 2: khớp chứa (dài nhất trước — ưu tiên từ khoá đặc hiệu hơn "ten"/"ma" trơn).
    // Bỏ ra các từ khoá chỉ-khớp-nguyên-cụm (xem `EXACT_ONLY_KEYWORDS`).
    if (idx < 0) {
      const exactOnly = EXACT_ONLY_KEYWORDS[field] ?? [];
      const sortedKws = kws.filter((k) => !exactOnly.includes(k)).sort((a, b) => b.length - a.length);
      idx = norm.findIndex((h, i) => !used.has(i) && sortedKws.some((k) => headerMatchesKeyword(h, k)));
    }
    if (idx >= 0) {
      out[field] = idx;
      used.add(idx);
    }
  }
  return out;
}

/**
 * Các cột NGƯỜI DÙNG ĐƯA VÀO mà app KHÔNG nhận — trước 06/08 `guessMapping` lẳng lặng bỏ chúng và
 * UI không nói gì (đo được: file có cột "Ảnh" ở vị trí 12 ⇒ mapping bỏ rơi, màn hình im lặng).
 * Cột trống tên (thường là cột thừa của Excel) KHÔNG tính là "bị bỏ rơi" — báo nó chỉ gây nhiễu.
 */
export function unmappedColumns(headers: string[], mapping: ColumnMapping): { header: string; index: number }[] {
  const taken = new Set(Object.values(mapping).filter((v): v is number => v != null));
  return headers
    .map((header, index) => ({ header: header.trim(), index }))
    .filter((c) => c.header.length > 0 && !taken.has(c.index));
}

const STORAGE_PREFIX = 'if-materials-import-mapping:';

/** Chữ ký hàng tiêu đề — cùng 1 NCC xuất file lần sau gần như chắc chắn CÙNG tiêu đề, đủ làm
 * khoá nhớ mapping mà không cần hỏi tên NCC. */
export function headerSignature(headers: string[]): string {
  return headers.map(normalizeHeader).join('|');
}

export function loadSavedMapping(headers: string[]): ColumnMapping | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + headerSignature(headers));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ColumnMapping>;
    return { ...EMPTY_MAPPING, ...parsed };
  } catch {
    return null;
  }
}

export function saveMapping(headers: string[], mapping: ColumnMapping): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + headerSignature(headers), JSON.stringify(mapping));
  } catch {
    /* private mode / quota — tiện nghi, không chặn import nếu lưu lỗi */
  }
}

export function emptyMapping(): ColumnMapping {
  return { ...EMPTY_MAPPING };
}
