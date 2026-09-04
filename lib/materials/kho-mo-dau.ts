/**
 * lib/materials/kho-mo-dau.ts — ĐOẠN DÂY CẮM ĐIỆN cho tầng hạt giống ở màn Kho vật liệu.
 *
 * ⛔ VÌ SAO TỒN TẠI (đo 04/09, trước tệp này): lượt trước dựng xong `hat-giong.ts` +
 * `tang-phan-giai.ts` — có test, có nghiệm thu — nhưng `grep "pbrMapBaTang|hat-giong"` ngoài
 * `lib/materials/` trả về **0**. Tức trên app thật, máy sạch vẫn mở ra **kho RỖNG**: màn Kho vật
 * liệu dựng danh sách từ `GET /api/specs` (bảng `ProductSpec`), mà vật liệu hạt giống KHÔNG phải
 * bản ghi DB — nó là tệp trong repo. Có dây, chưa có điện.
 *
 * Tệp này biến `VatLieuHatGiong` thành **DÒNG BẢNG** dưới đúng hình dạng `MaterialSpecDto` mà màn
 * hình và `MaterialTable` đã biết vẽ — KHÔNG đẻ đường hiển thị thứ hai, KHÔNG thêm bảng DB, KHÔNG
 * ghi gì vào `/api/specs`.
 *
 * 🔴 BA RÀNG BUỘC:
 *  1. **CHỈ ĐỌC — MỘT CHIỀU.** Dòng hạt giống không sửa/xoá được ở màn kho (`laHangHatGiong`).
 *     Sửa mặt THỊ GIÁC thì được, nhưng bản chỉnh rơi xuống tầng ② STUDIO (`localStorage`), mẫu
 *     gốc trong repo **không đổi một byte**. Đúng ràng buộc `.idfc` chốt 07/08.
 *  2. **KHÔNG CHÉP GIÁ** (luật 2.1.9.i). `priceVnd`/`currency`/`unit`/`vendor` để `null` — vật
 *     liệu hạt giống TRỎ TỚI kho giá qua `matId`, không mang giá theo mình. Bảng sẽ hiện "—" ở
 *     cột Giá, và đó là **sự thật**, không phải ô trống lỗi.
 *  3. **KHÔNG ĐẺ ID MỚI MỖI LẦN GỌI.** `id` suy tất định từ `matId` bất biến — dòng bảng phải có
 *     cùng khoá React qua mỗi lần render, và cùng khoá qua mỗi lần mở app.
 *
 * THUẦN — không DOM, không fetch, không `localStorage`.
 */
import type { MaterialSpecDto } from './warehouse/dto';
import { VAT_LIEU_HAT_GIONG, type VatLieuHatGiong } from './hat-giong';
import { normalizeMatIdCanonical } from './matid-identity';

/** Tiền tố `id` của dòng hạt giống — cố ý KHÔNG phải dạng cuid của Prisma, để không lẫn được với
 * bản ghi DB thật ở bất cứ chỗ nào so `id`. */
export const TIEN_TO_HAT_GIONG = 'hat-giong:';

/** Ngày tạo cố định cho dòng hạt giống — chúng đi theo bản cài, không "được tạo lúc mở app".
 * Gán `new Date()` ở đây là bịa một sự kiện chưa xảy ra. */
const NGAY_THEO_BAN_CAI = '1970-01-01T00:00:00.000Z';

/** Dòng bảng này có phải vật liệu hạt giống không (⇒ chỉ đọc ở mặt thương mại). */
export function laHangHatGiong(m: Pick<MaterialSpecDto, 'id'>): boolean {
  return typeof m.id === 'string' && m.id.startsWith(TIEN_TO_HAT_GIONG);
}

/**
 * Khoá tra cứu ba mặt cho MỘT dòng bảng.
 *  · dòng hạt giống ⇒ `matId` (UUID) — đường CHÍNH của `getMaterial`. Truyền `sku` ở đây là tra
 *    theo business key, mà kho PBR hạt giống khoá theo UUID ⇒ **không bao giờ khớp**.
 *  · dòng DB ⇒ giữ nguyên `sku` như trước 04/09 (callsite legacy chưa migrate, chốt 19/08).
 * Trả `null` khi không có khoá nào — món chưa có mã, `MaterialsScreen` đã có nhánh riêng.
 */
export function khoaBaMat(
  /* `matId` nhận cả `undefined`: `CommercialFacet` (resolve.ts:43) cố ý khai `matId?` cho spec cũ
     chưa backfill, và ngăn Phần thô dùng đúng kiểu đó. Cả `undefined` lẫn `null` đều nghĩa "chưa
     có matId" ⇒ rơi về `sku`, không đổi hành vi. */
  m: Pick<MaterialSpecDto, 'id' | 'sku'> & { matId?: string | null },
): string | null {
  if (laHangHatGiong(m)) return m.matId ?? null;
  return m.sku ?? null;
}

/** Một vật liệu hạt giống → một dòng `MaterialSpecDto`. */
function thanhDong(v: VatLieuHatGiong): MaterialSpecDto {
  const matId = normalizeMatIdCanonical(v.matId);
  return {
    id: `${TIEN_TO_HAT_GIONG}${matId}`,
    kind: 'material',
    name: v.name,
    nameEn: v.nameEn,
    brand: null,
    /** mã nghề đọc được — KHÔNG phải danh tính (danh tính là `matId`), nhưng là thứ người dùng gõ
     * khi tìm, nên phải hiện ở cột Mã. */
    sku: v.code,
    matId,
    vendor: null,
    w: null,
    d: null,
    hUp: null,
    colorHex: v.pbr.baseColor ?? null,
    imageAssetId: null,
    priceNote: null,
    currency: null,
    note: v.danhMuc,
    larkRecordId: null,
    createdAt: NGAY_THEO_BAN_CAI,
    unit: null,
    priceVnd: null,
    scope: 'chung',
    ownerId: null,
    supplierId: null,
    /** `verified` ở đây nghĩa NGHIỆP VỤ "đã có người xác nhận", không phải "ship kèm app" — vật
     * liệu hạt giống là tham số tự dựng, chưa ai đối chiếu với mẫu thật ⇒ `false`. Gắn `true` cho
     * đẹp bảng là bịa một lần kiểm chưa xảy ra. */
    verified: false,
    room: null,
    confidence: null,
  };
}

/**
 * MỌI dòng hạt giống, dựng lại mỗi lần gọi (bản sao — nơi gọi lỡ sửa cũng không làm bẩn hằng số
 * module, cùng kỷ luật `pbrMapHatGiong()`).
 */
export function hangHatGiong(): MaterialSpecDto[] {
  return VAT_LIEU_HAT_GIONG.map(thanhDong);
}

/**
 * Trộn dòng hạt giống với danh sách từ DB. Hạt giống đứng TRƯỚC (chúng là nền của kho, có mặt từ
 * lần chạy đầu); dòng DB nào đã mang đúng `matId` của một hạt giống thì **dòng DB thắng** — studio
 * đã tự nhập bản thương mại cho mã đó, hiện hai dòng là đếm trùng một vật.
 */
export function tronHatGiong(dbItems: readonly MaterialSpecDto[] | null | undefined): MaterialSpecDto[] {
  const db = dbItems ?? [];
  const daCo = new Set(
    db
      .map((m) => (typeof m.matId === 'string' ? normalizeMatIdCanonical(m.matId) : null))
      .filter((x): x is string => !!x),
  );
  return [...hangHatGiong().filter((h) => !daCo.has(h.matId ?? '')), ...db];
}

/**
 * MẶT TIỀN THỨ NĂM — Ô CHỌN VẬT LIỆU Ở CHẶNG 2D (`components/cad/MaterialPalette.tsx`).
 *
 * ⛔ VÌ SAO CẦN HÀM RIÊNG chứ không gọi thẳng `tronHatGiong` (đo 04/09): ô chọn vật liệu 2D không
 * đọc `MaterialSpecDto` — nó đọc `MaterialPick` (`lib/library/spec-refs.ts`), hình lát MỎNG hơn,
 * cố ý **không mang `matId`** vì thứ ghi xuống `HatchEntity.specId` là `id`, không phải `matId`.
 * Hai hình khác nhau nên không dùng chung một hàm trộn được.
 *
 * 🔴 KHỬ TRÙNG Ở ĐÂY YẾU HƠN Ở TẦNG DTO — nói thẳng, đừng để phiên sau tưởng hai chỗ ngang nhau:
 * `tronHatGiong` khử theo `matId` (danh tính máy); ở đây chỉ khử được theo `sku` (mã nghề người
 * đọc), vì picks không mang `matId`. Hệ quả: studio nhập một `ProductSpec` mang ĐÚNG `matId` của
 * một hạt giống nhưng đặt `sku` khác thì ô chọn 2D hiện HAI dòng cho cùng một vật. Nhìn thấy
 * được, không âm thầm — cách chữa tận gốc là cho `MaterialPick` mang `matId`, việc của lượt sau
 * (đụng `lib/library/spec-refs.ts`, ngoài vùng ghi của lượt này).
 *
 * Trả hình CẤU TRÚC khớp `MaterialPick` mà KHÔNG import type đó — giữ `lib/materials/` không phụ
 * thuộc ngược lên `lib/library/`.
 */
export interface PickHatGiong {
  /** `id` của dòng hạt giống (`hat-giong:<uuid>`) — thứ rơi xuống `HatchEntity.specId`. */
  id: string;
  name: string;
  sku: string | null;
  colorHex: string | null;
  unit: string | null;
  priceVnd: number | null;
}

/** Chuẩn hoá `sku` để so trùng — mã nghề gõ tay nên hoa/thường và khoảng trắng không đáng kể. */
function chuanSku(s: string | null | undefined): string | null {
  const t = typeof s === 'string' ? s.trim().toUpperCase() : '';
  return t === '' ? null : t;
}

/** Dòng hạt giống dưới hình `MaterialPick`. Giá để `null` — luật 2.1.9.i, không chép giá. */
export function pickHatGiong(): PickHatGiong[] {
  return hangHatGiong().map((m) => ({
    id: m.id,
    name: m.name,
    sku: m.sku,
    colorHex: m.colorHex,
    unit: m.unit,
    priceVnd: m.priceVnd,
  }));
}

/**
 * Trộn hạt giống vào danh sách kho của ô chọn 2D. Cùng thứ tự và cùng luật nhường như
 * `tronHatGiong`: hạt giống đứng TRƯỚC, dòng kho thật THẮNG khi trùng.
 */
export function tronPickHatGiong<T extends { sku: string | null }>(
  kho: readonly T[] | null | undefined,
): (T | PickHatGiong)[] {
  const db = kho ?? [];
  const daCo = new Set(db.map((m) => chuanSku(m.sku)).filter((x): x is string => !!x));
  return [...pickHatGiong().filter((h) => !daCo.has(chuanSku(h.sku) ?? '')), ...db];
}
