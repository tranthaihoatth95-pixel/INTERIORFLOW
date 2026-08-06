/**
 * lib/ffe/item.ts — KIỂU DỮ LIỆU "MÓN RỜI" (FF&E item), hợp đồng dùng chung (06/08).
 *
 * Vì sao có file này (đọc `docs/M3-OUT.md` §1c–1e + `docs/GAP-IF.md` G-M3-01/02/04/05/08/09/11):
 * IF đang thiếu MỘT chỗ duy nhất mô tả "một món đồ rời" — nên mỗi tầng tự chế nửa vời:
 *   · vision đo được số nhưng không có chỗ cất tên/mã/ảnh của món;
 *   · kho vật liệu (`ProductSpec`) có mã/giá nhưng KHÔNG có trường phòng, và cửa nhập Excel chỉ
 *     nhận 9 trường ⇒ vật liệu·màu·độ tin cậy·phòng rơi mất;
 *   · BOQ chỉ biết vùng tô (m²) ⇒ món đếm được (cái/bộ) rơi khỏi báo giá KHÔNG MỘT TIẾNG NÀO;
 *   · luồng node không có kiểu BẢNG ⇒ danh sách N món không tồn tại được như dữ liệu chạy.
 * Tất cả bốn chỗ trên cùng cần một hình lát: **món · đếm · phòng · ảnh · độ tin cậy**.
 *
 * Nguyên tắc (luật "một cỗ máy nhiều mặt tiền" + N7 "đã có thì NỐI, đừng dựng lại"):
 *  - KHÔNG thay `ProductSpec` (Prisma) — đó là DANH MỤC (catalogue: món này TỒN TẠI, giá bao
 *    nhiêu). `FfeItem` là LẦN XUẤT HIỆN trong một dự án/bảng (instance: món này ở PHÒNG nào, MẤY
 *    cái, ảnh nào, tin tới đâu). Nối nhau bằng `specId` (FK mềm, cùng khuôn `BlockEntity.specId`).
 *  - KHÔNG bịa hệ đơn vị mới: `unit` là chuỗi tự do đúng như `ProductSpec.unit` trong
 *    `prisma/schema.prisma` ('m2' | 'm' | 'cai' | 'bo' | 'm3' | …). Ở đây chỉ thêm bộ NHẬN BIẾT
 *    đơn vị ĐẾM (`isCountUnit`) — không ràng buộc enum, vì ATLAS/Lark có thể thêm đơn vị mới.
 *  - Độ tin cậy mượn nguyên ngữ nghĩa `MeasurementValue.kind` của `lib/vision/single-view-
 *    metrology.ts` ('measured' | 'inferred') + 'manual' cho số người gõ tay, KHÔNG chế thang
 *    điểm 0-100 mới (đúng luật K3 "suy thì gắn cờ `inferred`, không chặn").
 *
 * File THUẦN: không React/DOM/Prisma/fetch — chạy được bằng sucrase-node như `lib/boq/model.ts`.
 */

/** Nguồn gốc của một món — luôn nói rõ máy vừa làm gì (8 luật vận hành, luật 6). */
export type FfeSource =
  /** người dùng gõ tay trong app */
  | 'manual'
  /** nhập từ bảng tính (.xlsx/.csv) qua cửa nhập kho */
  | 'import'
  /** bốc tách + đo từ ảnh (`ai.furnitureextract` → `vision.measureobject`) */
  | 'vision'
  /** thả từ Thư viện block/cụm xuống bản vẽ */
  | 'library';

/** Mức tin của các SỐ trong món (kích thước/số lượng). Khớp `MeasurementValue.kind` + 'manual'. */
export type FfeConfidence = 'measured' | 'inferred' | 'manual';

export const FFE_CONFIDENCE_LABEL: Record<FfeConfidence, { vi: string; en: string }> = {
  measured: { vi: 'Đo được', en: 'Measured' },
  inferred: { vi: 'Suy đoán', en: 'Inferred' },
  manual: { vi: 'Nhập tay', en: 'Manual' },
};

/** Đơn vị ĐẾM (ra số nguyên cái/bộ) — phân biệt với đơn vị ĐO (m2/m/m3, tính theo hình học).
 * Chuẩn hoá trước khi so: bỏ dấu + thường hoá, nên 'Cái'/'cái'/'CAI' đều nhận. */
export const FFE_COUNT_UNITS = ['cai', 'bo', 'chiec', 'pcs', 'set', 'ea', 'nos'] as const;

/** Đơn vị mặc định khi không ai khai — món rời đếm bằng CÁI (không phải m²; đoán m² là gốc của
 * G-M3-09: bảng trông "đủ" mà thiếu tiền thật). */
export const FFE_DEFAULT_UNIT = 'cai';

function normUnit(u: string): string {
  return u
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim();
}

/** Đơn vị này có phải đơn vị đếm không (⇒ số lượng phải là số nguyên ≥ 0). */
export function isCountUnit(unit: string | null | undefined): boolean {
  if (!unit) return false;
  const n = normUnit(unit);
  return (FFE_COUNT_UNITS as readonly string[]).includes(n);
}

/**
 * MỘT MÓN RỜI trong một bảng/dự án.
 *
 * Mọi field ngoài `id`/`name`/`qty`/`unit` đều optional — đúng luật X4 "thiếu dữ liệu thì SUY,
 * không CHẶN": bốc từ ảnh ra mới có mỗi ảnh + số đo cũng phải tạo được món, rồi bổ sung dần.
 */
export interface FfeItem {
  /** `ffe_...` — luật vận hành #5 "output không có id thì không ship". */
  id: string;
  /** tên hiển thị (tiếng Việt hoặc theo bảng nguồn) */
  name: string;
  nameEn?: string;

  /** FK mềm `ProductSpec.id` — nối sang DANH MỤC để lấy giá/NCC/ảnh chuẩn. Không có = món chưa
   * vào kho (vẫn hợp lệ: vừa bốc từ ảnh ra thì chưa có mã). */
  specId?: string;
  sku?: string;
  brand?: string;
  vendor?: string;

  /** ĐẾM: số lượng + đơn vị. `unit` đếm ⇒ `qty` phải nguyên (xem `normalizeQty`). */
  qty: number;
  unit: string;

  /** PHÒNG/vị trí — thứ `ProductSpec` không có chỗ lưu (G-M3-08). Chuỗi tự do theo nhãn phòng
   * trên bản vẽ (`findRoomLabels`), KHÔNG ép enum: hồ sơ mỗi dự án gọi tên phòng một kiểu. */
  room?: string;
  /** ký hiệu vị trí chi tiết hơn nếu có (vd 'L2-A03') — chưa có máy nào sinh, để chỗ. */
  locationCode?: string;

  /** ẢNH: ưu tiên `imageAssetId` (LibraryAsset, lưu-theo-tham-chiếu như `ProductSpec.imageAssetId`).
   * `imageUrl` chỉ dùng cho ảnh vừa bốc ra chưa kịp cất kho (dataURL/blob URL) — KHÔNG persist
   * dataURL vào .idf/DB (phình file), phải cất thành asset trước khi lưu. */
  imageAssetId?: string;
  imageUrl?: string;

  /** kích thước danh nghĩa mm — cùng tên field `ProductSpec.w/d/hUp` (không bịa tên song song). */
  w?: number;
  d?: number;
  hUp?: number;

  /** vật liệu/màu/hoàn thiện — bảng FF&E chuẩn ngành luôn có 3 cột này. */
  materials?: string[];
  colorHex?: string;
  finish?: string;

  /** ĐỘ TIN CẬY của các số ở trên + căn cứ (mượn `MeasurementValue.basis`, câu tiếng Việt). */
  confidence?: FfeConfidence;
  confidenceBasis?: string;

  /** đơn giá VND. `null` = "chưa có giá" (đúng ngữ nghĩa `ProductSpec.priceVnd`) — BOQ phải HIỆN
   * rõ, KHÔNG đoán, KHÔNG bỏ dòng. `undefined` = chưa tra kho lần nào. */
  priceVnd?: number | null;

  /** id entity trên bản vẽ đã sinh ra/neo tới món này — để soi ngược (highlight). */
  entityIds?: string[];

  source: FfeSource;
  note?: string;
}

/** BẢNG N MÓN — thứ chạy được giữa các khối trong luồng node (G-M3-02) và là ruột của hồ sơ
 * FF&E (G-M3-04) lẫn BOQ món rời (G-M3-09). Cố ý ĐƠN GIẢN: chỉ là danh sách + nhãn. */
export interface FfeTable {
  /** `ffetab_...` */
  id: string;
  /** nhãn hiển thị, vd "FF&E — Tầng 2" */
  label?: string;
  items: FfeItem[];
  /** ảnh/nguồn đã sinh ra bảng này (vd id ảnh phối cảnh đã bốc tách) — truy vết. */
  sourceRef?: string;
}

/* ─────────────────────────── hàm thuần (test được, không DOM) ─────────────────────────── */

let seq = 0;
/** id ổn định trong phiên; KHÔNG dùng Date.now() để test lặp lại được. */
export function makeFfeId(prefix: 'ffe' | 'ffetab' = 'ffe'): string {
  seq += 1;
  return `${prefix}_${seq.toString(36).padStart(4, '0')}`;
}

/** Reset bộ đếm id — CHỈ dùng trong test. */
export function __resetFfeIdSeq(): void {
  seq = 0;
}

/** Ép số lượng về hợp lệ: đơn vị đếm ⇒ số nguyên ≥ 0; đơn vị đo ⇒ giữ thập phân, ≥ 0.
 * Trả `null` khi đầu vào không phải số ⇒ caller BÁO LỖI, không tự thay bằng 1 (đoán số lượng là
 * đoán tiền — đúng chỗ đau G-M3-09).
 *
 * 🔴 VÁ 06/08 (bắt được lúc viết test khối "Bảng món", `lib/nodes/defs/ffe-table.test.ts` §[4]):
 * hàm này TRƯỚC ĐÓ KHÔNG làm đúng điều docblock trên hứa. Bộ lọc `replace(/[^\d.,-]/g,'')` bóc
 * sạch chữ, nên ô Excel ghi "khoảng chục cái" / "liên hệ" / ô TRỐNG đều thành chuỗi rỗng →
 * `Number('')` = **0** → hợp lệ → dòng đó vào bảng với số lượng 0, thành tiền 0đ, KHÔNG một
 * tiếng báo. Đúng kiểu thiếu-âm-thầm mà G-M3-09 mô tả, chỉ đổi chỗ xảy ra.
 * Vá: không có CHỮ SỐ nào trong đầu vào ⇒ `null` ngay. Hệ quả có chủ ý: ô trống nay cũng trả
 * `null` ("chưa khai") thay vì 0 — caller nào muốn mặc định 1 thì tự đặt mặc định TRƯỚC khi gọi
 * (cả `defs/ffe-table.ts` lẫn `warehouse/apply-import.ts` đều làm vậy), chứ hàm này không được
 * tự bịa ra một con số. */
export function normalizeQty(raw: unknown, unit: string): number | null {
  if (typeof raw !== 'number' && !/\d/.test(String(raw ?? ''))) return null;
  const n = typeof raw === 'number' ? raw : Number(String(raw).replace(/[^\d.,-]/g, '').replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) return null;
  return isCountUnit(unit) ? Math.round(n) : n;
}

/** Tạo món với mặc định an toàn — đơn vị mặc định là CÁI, số lượng mặc định 1. */
export function makeFfeItem(init: Partial<FfeItem> & { name: string; source: FfeSource }): FfeItem {
  const unit = init.unit ?? FFE_DEFAULT_UNIT;
  return {
    ...init,
    id: init.id ?? makeFfeId('ffe'),
    name: init.name,
    qty: init.qty ?? 1,
    unit,
  };
}

/** Thành tiền 1 dòng: `qty × priceVnd`. `null` khi chưa có giá ⇒ caller phải hiện "chưa có giá",
 * KHÔNG coi như 0 (0 đồng và "chưa biết giá" là hai chuyện khác nhau). */
export function ffeLineAmount(item: FfeItem): number | null {
  if (item.priceVnd === null || item.priceVnd === undefined) return null;
  return item.qty * item.priceVnd;
}

/** Gộp theo phòng, giữ thứ tự gặp lần đầu. Món không khai phòng vào khoá `''` (caller hiện
 * "Chưa gán phòng" — KHÔNG giấu, KHÔNG bỏ). */
export function groupByRoom(items: FfeItem[]): Map<string, FfeItem[]> {
  const m = new Map<string, FfeItem[]>();
  for (const it of items) {
    const key = (it.room ?? '').trim();
    const arr = m.get(key);
    if (arr) arr.push(it);
    else m.set(key, [it]);
  }
  return m;
}
