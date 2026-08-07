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

/**
 * ⛔ CỤM CHẶN — tiêu đề "nổi tiếng không phải thứ ta tưởng" (06/08 vòng 3).
 *
 * Chấm điểm + gán tham lam (xem `guessMapping`) chữa được phần lớn ca cột-bị-cướp, nhưng KHÔNG
 * chữa được ca chỉ có MỘT ứng viên: bảng không có cột "Hãng" nào khác thì "Nhóm hàng" vẫn là
 * ứng viên tốt nhất của `brand`, và điểm cao đến mấy cũng chỉ là điểm cao của một câu trả lời SAI.
 * Tiêu đề chứa cụm chặn ⇒ field tương ứng KHÔNG được nhận nó; cột rơi vào `unmappedColumns` để
 * người dùng ghép tay (thà bắt ghép tay 1 cột còn hơn im lặng nhập sai cả kho).
 *
 * Thêm cụm mới thì ghi luôn LÝ DO ở đây — danh sách này là trí nhớ của phiên sau.
 */
const BLOCKED_HEADER_PHRASES: Partial<Record<MaterialField, readonly string[]>> = {
  // 'Đánh giá' = xếp hạng sao (ô ghi `4,5` đọc ra 4.5 ⇒ cả kho vào giá 4 đồng, đã đo được).
  // 'Gia công' = phí/hạng mục gia công, không phải đơn giá món.
  // 'Thành tiền'/'Tổng tiền'/'Extended Price' = tiền của CẢ DÒNG (qty × đơn giá), nhân tiếp là
  // nhân hai lần. 'Giá trị còn lại' = kế toán khấu hao, không phải giá bán.
  priceVnd: ['danh gia', 'gia cong', 'thanh tien', 'tong tien', 'extended price', 'gia tri con lai'],
  // 'sau thuế' = VAT ("Đơn giá sau thuế" phải về ô Giá, không về ô Sâu).
  // 'đại lý' = kênh phân phối. 'dài hạn'/'ngày' là chữ khác, không dính 'dai'.
  d: ['sau thue', 'dai ly', 'dai han'],
  // 'báo cáo' = tên loại tài liệu. 'cao su' = VẬT LIỆU cao su, không phải chiều cao.
  hUp: ['bao cao', 'cao su', 'nang cao'],
  // 'trọng lượng' = khối lượng kg (chứa 'rong' nhưng không phải chiều rộng).
  w: ['trong luong'],
  // 4 cụm đều chứa 'hang' nhưng nói về SỐ LƯỢNG/ĐƠN HÀNG/PHÂN NHÓM, không phải hãng sản xuất.
  brand: ['so luong hang', 'hang ton', 'ton hang', 'nhom hang', 'so don hang', 'don hang'],
  // 'mã màu' là mã MÀU (về ô Màu), 'bản mã' là chi tiết thép trong bảng vật tư xây dựng.
  sku: ['ma mau', 'ban ma'],
  // 'Unit Price' là ĐƠN GIÁ tiếng Anh, không phải cột đơn vị tính.
  unit: ['unit price'],
  // 'Item Code' là MÃ, không phải tên món.
  name: ['item code', 'ma hang'],
};

function isBlocked(field: MaterialField, normHeader: string): boolean {
  const phrases = BLOCKED_HEADER_PHRASES[field];
  if (!phrases) return false;
  return phrases.some((p) => normHeader.includes(p));
}

/* ═══════════ CHẤM ĐIỂM MỘT CẶP (field, cột) ═══════════
   3 mức khớp, cách nhau đủ xa để mức mạnh luôn thắng mức yếu:
     1000 — tiêu đề ĐÚNG BẰNG từ khoá ("Phòng" ↔ 'phong');
      500 — từ khoá là MỘT TỪ/CỤM TỪ TRỌN VẸN trong tiêu đề ("Chiều cao (mm)" ↔ 'cao');
      100 — từ khoá chỉ là CHUỖI CON ("Trọng lượng" ↔ 'rong') — mức yếu nhất, đúng như tên gọi.
   Cộng thêm `tỉ lệ độ dài từ khoá / độ dài tiêu đề × 100`: từ khoá phủ càng gần trọn tiêu đề thì
   càng chắc chắn đó là cột ta tìm. Nhờ đó "Giá bán lẻ" (khớp cụm 'gia ban', 7/10 ký tự) THẮNG
   "Đánh giá" (chỉ khớp từ 'gia', 3/8) — ca đã đo được là sai. */
const SCORE_EXACT = 1000;
const SCORE_WORD = 500;
const SCORE_SUBSTRING = 100;

/** Tiêu đề đã tách thành các từ, nối lại bằng đúng 1 dấu cách — để so "cụm từ trọn vẹn" bằng
 * `includes(' cụm ')` mà không vướng dấu ngoặc/gạch ("cao (h mm)" → " cao h mm "). */
function wordSpace(normHeader: string): string {
  return ` ${normHeader.replace(/[^a-z0-9]+/g, ' ').trim()} `;
}

interface Candidate {
  field: MaterialField;
  col: number;
  score: number;
  /** thứ tự từ khoá trong `KEYWORDS[field]` — nhỏ hơn = từ khoá chính danh hơn. Dùng để phá hoà:
   * "Phòng" (từ khoá #0 của room) thắng "Khu vực" (#2) khi cả hai cùng khớp nguyên cụm. */
  kwRank: number;
  /** vị trí từ khoá trong tiêu đề — sớm hơn = chủ đề chính của tiêu đề. */
  pos: number;
}

/** Điểm tốt nhất của 1 cặp (field, tiêu đề) — `null` nếu không khớp hoặc bị cụm chặn loại. */
function scorePair(field: MaterialField, normHeader: string): Omit<Candidate, 'field' | 'col'> | null {
  if (!normHeader || isBlocked(field, normHeader)) return null;
  const exactOnly = EXACT_ONLY_KEYWORDS[field] ?? [];
  const spaced = wordSpace(normHeader);
  let best: Omit<Candidate, 'field' | 'col'> | null = null;

  KEYWORDS[field].forEach((kw, kwRank) => {
    let base = 0;
    let pos = normHeader.length;
    if (normHeader === kw) {
      base = SCORE_EXACT;
      pos = 0;
    } else if (spaced.includes(` ${kw} `)) {
      base = SCORE_WORD;
      pos = spaced.indexOf(` ${kw} `);
    } else if (
      kw.length > SHORT_KEYWORD_MAX
      && !exactOnly.includes(kw)
      && headerMatchesKeyword(normHeader, kw)
    ) {
      base = SCORE_SUBSTRING;
      pos = normHeader.indexOf(kw);
    }
    if (!base) return;
    const score = base + (kw.length / normHeader.length) * 100;
    if (
      !best
      || score > best.score + 1e-9
      || (Math.abs(score - best.score) < 1e-9 && (kwRank < best.kwRank || (kwRank === best.kwRank && pos < best.pos)))
    ) {
      best = { score, kwRank, pos };
    }
  });
  return best;
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

/**
 * Đoán mapping ban đầu từ tiêu đề cột.
 *
 * ⛔ ĐỌC TRƯỚC KHI ĐỔI — 06/08 vòng 3, ĐỔI TRỤC THUẬT TOÁN.
 * Bản cũ duyệt theo THỨ TỰ FIELD (`MATERIAL_FIELDS`) và mỗi field vồ CỘT ĐẦU TIÊN khớp. Hệ quả:
 * field đứng trước cướp cột của field đặc hiệu hơn, và cột đúng đứng sau thì mất luôn — im lặng.
 * Loạt ca đã đo được trên bản cũ (nay đều có test khoá trong `column-mapping.test.ts`):
 *   · ['Tên hàng','Đánh giá','Giá bán lẻ']        → priceVnd ← "Đánh giá"  (ô `4,5` ⇒ cả kho giá 4đ)
 *   · ['Tên hàng','Gia công','Giá NCC']           → priceVnd ← "Gia công"
 *   · [… ,'Đơn giá sau thuế', …]                  → d (Sâu) ← "Đơn giá sau thuế"
 *   · ['Tên','Báo cáo tồn kho','Chiều cao (mm)']  → hUp ← "Báo cáo tồn kho"
 *   · ['Tên','Cao su','Chiều cao (mm)']           → hUp ← "Cao su"
 *   · ['Tên','Đại lý phân phối','Chiều sâu (mm)'] → d ← "Đại lý phân phối"
 *   · ['Tên','Trọng lượng','Chiều rộng (mm)']     → w ← "Trọng lượng"
 *   · ['Extended Price','Product Name','Unit Price'] → unit ← "Unit Price" · priceVnd ← "Extended Price"
 *   · ['Item Code','Item Name','Price']           → name ← "Item Code"
 *   · ['Tên','Mã màu','Màu sắc']                  → sku ← "Mã màu"
 *   · ['Tên','Bản mã thép', …]                    → sku ← "Bản mã thép"
 *   · ['Tên','Số lượng hàng','Đơn giá']           → brand ← "Số lượng hàng"
 *   · ['Tên món','Khu vực','Phòng','Số lượng']    → room ← "Khu vực", cột "Phòng" bỏ rơi
 *
 * Nay: CHẤM ĐIỂM MỌI CẶP (field, cột) rồi GÁN THAM LAM theo điểm cao nhất — cột chỉ về tay field
 * chấm nó cao nhất, không về tay field đứng sớm nhất trong mảng. Cộng thêm danh sách
 * `BLOCKED_HEADER_PHRASES` cho những tiêu đề mà điểm số không cứu được.
 * `MATERIAL_FIELDS` nay CHỈ còn là thứ tự liệt kê (UI, phá hoà cuối cùng), KHÔNG còn là thứ tự ưu
 * tiên tranh cột.
 */
export function guessMapping(headers: string[]): ColumnMapping {
  const norm = headers.map(normalizeHeader);
  const out: ColumnMapping = { ...EMPTY_MAPPING };

  const candidates: Candidate[] = [];
  MATERIAL_FIELDS.forEach((field) => {
    norm.forEach((h, col) => {
      const s = scorePair(field, h);
      if (s) candidates.push({ field, col, ...s });
    });
  });

  // Thứ tự gán: điểm cao trước; hoà thì từ khoá chính danh hơn (kwRank), rồi từ khoá xuất hiện
  // SỚM hơn trong tiêu đề, rồi cột bên trái, rồi thứ tự khai field — 4 nấc phá hoà này khiến kết
  // quả TẤT ĐỊNH (cùng đầu vào luôn ra cùng mapping, không phụ thuộc thứ tự duyệt).
  const fieldRank = new Map(MATERIAL_FIELDS.map((f, i) => [f, i]));
  candidates.sort((a, b) =>
    b.score - a.score
    || a.kwRank - b.kwRank
    || a.pos - b.pos
    || a.col - b.col
    || (fieldRank.get(a.field) ?? 0) - (fieldRank.get(b.field) ?? 0));

  const usedCols = new Set<number>();
  const takenFields = new Set<MaterialField>();
  for (const c of candidates) {
    if (usedCols.has(c.col) || takenFields.has(c.field)) continue;
    out[c.field] = c.col;
    usedCols.add(c.col);
    takenFields.add(c.field);
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
