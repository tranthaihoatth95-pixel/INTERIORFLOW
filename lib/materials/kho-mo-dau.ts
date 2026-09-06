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
import { getMaterial, type CommercialFacet } from './resolve';
import { normalizeMatIdCanonical } from './matid-identity';
import type { MaterialDef, MaterialTexture } from '../cad/materials';
import { mixHex } from '../cad/plan-depth';
import { materialTypeOf, type MaterialPreviewKind } from './material-edit';

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
    /* 🔴 05/09 — LẤY MÀU TỪ MẶT 2D, KHÔNG TỪ `pbr.baseColor`. Vật liệu có ảnh vân thì
       `baseColor` là **HỆ SỐ NHÂN** của glTF và phải bằng TRẮNG; đọc nó ra làm "màu của món"
       biến năm hàng thành năm ô TRẮNG. Bắt được bằng cách chụp app với WebGL tắt — lúc quả cầu
       không dựng được, ô rơi về `colorHex` và cái sai lộ ra ngay; `tsc`, test và ảnh ở máy có
       WebGL đều xanh. `hatch2d.color` là chỗ màu vẫn còn nghĩa là MÀU. */
    colorHex: v.hatch2d.color ?? v.pbr.baseColor ?? null,
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
 * đọc), vì `PickHatGiong` khi ấy chưa mang `matId`. Hệ quả: studio nhập một `ProductSpec` mang
 * ĐÚNG `matId` của một hạt giống nhưng đặt `sku` khác thì ô chọn 2D hiện HAI dòng cho cùng một vật.
 *
 * ✅ 05/09 (V8c bước 4) — `PickHatGiong` VÀ `MaterialPick` nay ĐỀU mang `matId`, nên khử trùng
 * dưới đây khử theo `matId` TRƯỚC rồi mới tới `sku`. Ca hai-dòng-cho-một-vật ở trên ĐÓNG.
 *
 * Trả hình CẤU TRÚC khớp `MaterialPick` mà KHÔNG import type đó — giữ `lib/materials/` không phụ
 * thuộc ngược lên `lib/library/`.
 */
export interface PickHatGiong {
  /** `id` của dòng hạt giống (`hat-giong:<uuid>`) — thứ rơi xuống `HatchEntity.specId`. */
  id: string;
  /** 05/09 (V8c bước 4) — UUID trần, thứ rơi xuống `Base.matId`. Chính là `id` đã gỡ tiền tố;
   * mang thẳng ra đây để nơi gọi khỏi phải tự cắt chuỗi lần nữa (cắt ở nhiều nơi là đẻ nguồn thứ
   * hai cho cùng một quy ước). */
  matId: string;
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
    matId: m.matId ?? '',
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
export function tronPickHatGiong<T extends { sku: string | null; matId?: string | null }>(
  kho: readonly T[] | null | undefined,
): (T | PickHatGiong)[] {
  const db = kho ?? [];
  const skuDaCo = new Set(db.map((m) => chuanSku(m.sku)).filter((x): x is string => !!x));
  const matIdDaCo = new Set(
    db.map((m) => (typeof m.matId === 'string' && m.matId ? normalizeMatIdCanonical(m.matId) : null)).filter((x): x is string => !!x),
  );
  return [
    ...pickHatGiong().filter((h) => !matIdDaCo.has(h.matId) && !skuDaCo.has(chuanSku(h.sku) ?? '')),
    ...db,
  ];
}

/**
 * MẶT TIỀN THỨ SÁU — MẶT 2D (`MaterialDef`), chân thứ ba của kiềng ba chân.
 *
 * ⛔ VÌ SAO TỒN TẠI (đo 05/09 trên app thật, `:3277`, tài khoản mới): chỉ báo ba mặt của **cả hai**
 * vật liệu ship theo bản cài đọc ra `2D – · 3D ✓ · Giá !`. Tức mặt 2D **chết trên 100% vật liệu
 * người dùng thấy ở lần mở app đầu tiên**. Nguyên nhân đo được, không suy:
 *   · `grep -c 'matId:' lib/cad/materials.ts` = **0** — 13 preset, không preset nào khai mã;
 *   · mặt 3D đã có `pbrMapHatGiong()`, mặt thương mại đã có `hangHatGiong()`,
 *     **`defsHatGiong()` thì KHÔNG TỒN TẠI** ⇒ `getMaterial().flat` luôn `null` ⇒ `ba-mat.ts`
 *     trả `chuaCo` cho mặt 2D, đúng như nó phải trả.
 * Hàm này là chân còn thiếu, dựng **đối xứng y hệt** `pbrMapHatGiong()`: cùng nguồn dữ liệu
 * (`VAT_LIEU_HAT_GIONG`), cùng luật bản-sao-mỗi-lần-gọi, cùng luật nhường (mã trùng ⇒ preset
 * người dùng THẮNG).
 *
 * 🔴 KHÔNG SỬA `MATERIALS`. Mảng preset đó là dữ liệu người dùng đang dùng ở ô chọn 2D; nhét
 * dòng hạt giống vào nó là đổi nội dung một kho đang sống. Hạt giống là tầng **DƯỚI**, trộn ở
 * đường ĐỌC (`tronDefsHatGiong`), đúng thứ tự ba tầng của `tang-phan-giai.ts`.
 *
 * ⚠️ HAI TRƯỜNG SUY RA, KHAI THẲNG LÀ SUY (không tự nhận là dữ liệu gốc):
 *  · `tones` — `MaterialDef` cần 3 tông để vẽ vân procedural, `VatLieuHatGiong` chỉ có MỘT màu.
 *    Ba tông **suy tất định** từ `hatch2d.color` bằng `mixHex` (`lib/cad/plan-depth.ts`) — tái
 *    dùng bộ pha màu đã có, KHÔNG chép một bộ thứ hai vào đây (đúng họ bệnh `soi:dong-dang` bắt).
 *    Chép cứng ba tông vào tệp này là dựng **nguồn sự thật thứ hai** cho màu của cùng một vật:
 *    ai đó đổi `baseColor` mà quên đổi `tones` thì vân và màu nói hai điều khác nhau.
 *  · `texture` — kiểu vân procedural, suy từ `pbr.typeId` qua `MATERIAL_TYPES[].previewKind`
 *    (bảng ĐÃ CÓ ở `material-edit.ts`), không đẻ bảng ánh xạ thứ hai. Họ nào chưa có kiểu vân
 *    riêng thì rơi về `'solid'` — **màu phẳng đúng còn hơn vân sai họ**.
 */

/** previewKind (bảng `MATERIAL_TYPES`) → kiểu vân procedural của `material-texture.ts`.
 * Chỉ ánh xạ chỗ có vân THẬT tương ứng; còn lại `'solid'` — xem ghi chú ⚠️ ở trên. */
const VAN_THEO_HO: Record<MaterialPreviewKind, MaterialTexture> = {
  wood: 'wood',
  stone: 'marble',
  metal: 'solid',
  paint: 'solid',
  fabric: 'solid',
  glass: 'solid',
};

/** Một vật liệu hạt giống → một `MaterialDef` (mặt 2D). */
function thanhDef(v: VatLieuHatGiong): MaterialDef {
  const mau = v.hatch2d.color ?? v.pbr.baseColor ?? '#888888';
  const ho = materialTypeOf(v.pbr.typeId)?.previewKind ?? null;
  return {
    /* Tiền tố y như dòng bảng — nhìn `id` là biết đến từ tầng nào, và không lẫn được với id
       preset gõ tay trong `MATERIALS`. `seedFromId` của `material-texture.ts` băm chính chuỗi
       này ⇒ vân của một vật liệu bất biến qua mọi lần mở app. */
    id: `${TIEN_TO_HAT_GIONG}${normalizeMatIdCanonical(v.matId)}`,
    name: v.name,
    /* NHÃN NHÓM của ô chọn 2D — hạt giống CHƯA vào ô chọn đó, nên trường này chưa nơi nào đọc.
       Đặt `'Sàn'` để trùng chỗ hai preset gỗ đang có (`san-go-soi` · `san-go-oc-cho`), khi nào
       hạt giống vào ô chọn thì chúng đứng đúng chỗ người dùng đã quen. KHÔNG phải khẳng định
       "gỗ sồi chỉ dùng cho sàn". */
    category: 'Sàn',
    hatchPattern: v.hatch2d.hatchPattern as MaterialDef['hatchPattern'],
    patternScale: v.hatch2d.patternScale ?? 1,
    patternAngle: v.hatch2d.patternAngle ?? 0,
    color: mau,
    texture: ho ? VAN_THEO_HO[ho] : 'solid',
    tones: [mixHex(mau, '#000000', 0.28), mau, mixHex(mau, '#ffffff', 0.3)],
    /* KHOÁ NỐI — đây là toàn bộ lý do hàm này tồn tại. `getMaterial()` tra `flat` bằng
       `d.matId` canonical; thiếu dòng này thì mặt 2D vẫn `chuaCo`. */
    matId: normalizeMatIdCanonical(v.matId),
  };
}

/** MỌI preset 2D của tầng hạt giống. Bản sao mỗi lần gọi (cùng kỷ luật `pbrMapHatGiong()`). */
export function defsHatGiong(): MaterialDef[] {
  return VAT_LIEU_HAT_GIONG.map(thanhDef);
}

/**
 * Trộn preset hạt giống vào danh sách preset 2D trước khi đưa cho `getMaterial()`.
 * Cùng luật nhường như `tronHatGiong`/`tronPickHatGiong`: hạt giống đứng TRƯỚC (nền của kho),
 * nhưng preset nào ĐÃ khai đúng `matId` đó thì **preset đó thắng** — studio tự khai ký hiệu 2D
 * riêng cho mã này thì bản của họ là bản dùng, không hiện hai ký hiệu cho một vật.
 */
export function tronDefsHatGiong(defs: readonly MaterialDef[] | null | undefined): MaterialDef[] {
  const co = defs ?? [];
  const daCo = new Set(
    co.map((d) => (typeof d.matId === 'string' ? normalizeMatIdCanonical(d.matId) : null))
      .filter((x): x is string => !!x),
  );
  return [...defsHatGiong().filter((d) => !daCo.has(d.matId ?? '')), ...co];
}

/* ═════════ MẶT TIỀN THỨ SÁU — BOQ (`app/api/boq/[projectId]/route.ts`) ═════════ */

/**
 * Hình THƯƠNG MẠI tối thiểu mà `computeBoq` cần — khớp cấu trúc `ProductSpecDtoLite`
 * (`lib/boq/from-project.ts`) mà KHÔNG import type đó, giữ `lib/materials/` không phụ thuộc
 * ngược lên `lib/boq/` (cùng kỷ luật `PickHatGiong` ở trên).
 */
export interface DongBoqHatGiong {
  id: string;
  name: string;
  vendor: string | null;
  sku: string | null;
  unit: string | null;
  priceVnd: number | null;
  wastagePercent: number | null;
}

/**
 * ⭐ 06/09 (lane ĐẦU RA NÓI THẬT) — DÒNG TRA CỨU cho BOQ, kèm MƯỢN mặt thương mại theo `matId`.
 *
 * 🔴 CA HỎNG ĐÃ TÁI HIỆN (chạy `computeBoqForProject` với `specDtos = []`, đúng thứ route có
 * trên máy sạch): người dùng mới tô một vùng bằng vật liệu ship kèm bản cài
 * (`HatchEntity.specId = 'hat-giong:<uuid>'`) rồi mở BOQ ⇒ **0 dòng**, kèm lỗi `spec-not-found`
 * nói *"không tìm thấy vật liệu này… **có thể vật liệu đã bị xoá/đổi**"*. Câu đó SAI: vật liệu
 * không bị ai xoá — nó chưa bao giờ là bản ghi `ProductSpec`, nó là tệp trong repo. Người dùng
 * đọc xong đi tìm một thứ không tồn tại.
 *
 * Nối hạt giống vào danh sách tra thì lỗi trở thành `missing-priceVnd` — *"chưa có đơn giá…
 * bổ sung giá rồi tính lại"*. Vẫn **0 dòng**, và đó là ĐÚNG: hạt giống cố ý không mang giá
 * (luật 2.1.9.i), còn BOQ chỉ nhận số đo được (Hoà chốt 15/08) nên không được đoán giá. Thứ
 * lượt này sửa là **LÝ DO NÓI THẬT**, không phải làm bảng đầy lên.
 *
 * 🔴 CA THỨ HAI, cũng đã tái hiện: studio SAU ĐÓ nhập bản thương mại có giá cho đúng vật liệu ấy
 * (`ProductSpec` mới, `matId` trùng, `id` cuid khác). Vùng tô cũ vẫn neo `hat-giong:<uuid>` ⇒ nếu
 * chỉ nối suông thì BOQ vẫn kêu *"chưa có đơn giá"* trong khi kho ĐÃ có giá — nói sai lần thứ hai,
 * nặng hơn lần đầu. ⇒ Dòng hạt giống MƯỢN mặt thương mại qua `getMaterial()` — hàm hợp nhất ba
 * mặt viết từ 07/08 mà tới nay chưa có nơi gọi nào ngoài test của chính nó ("dây có, chưa cắm
 * điện", sổ 17/08). Đây là chỗ cắm.
 *
 * ⛔ KHÔNG dùng `tronHatGiong` cho việc này: hàm đó khử trùng theo `matId` để DANH SÁCH hiển thị
 * không đếm hai lần một vật. Ở đây là TRA CỨU THEO `id` — bỏ dòng hạt giống đi vì kho đã có vật
 * cùng `matId` sẽ làm chính những vùng tô đang neo vào nó thành mồ côi.
 */
export function dongBoqHatGiong(dbSpecs: readonly CommercialFacet[]): DongBoqHatGiong[] {
  return hangHatGiong().map((m) => {
    const matId = m.matId ?? '';
    const tm = matId ? getMaterial(matId, { specs: dbSpecs }).commercial : null;
    const so = (v: number | string | null | undefined): number | null => {
      if (v === null || v === undefined) return null;
      const n = typeof v === 'number' ? v : Number(v);
      return Number.isFinite(n) ? n : null;
    };
    return {
      id: m.id,
      // Tên/mã giữ của hạt giống — đó là thứ người dùng đã chọn trên bản vẽ. Chỉ MẶT THƯƠNG MẠI
      // (nhà cung cấp · đơn vị · đơn giá · hao hụt) mới mượn từ kho.
      name: m.name,
      sku: m.sku,
      vendor: tm?.vendor ?? null,
      unit: tm?.unit ?? m.unit,
      priceVnd: so(tm?.priceVnd) ?? m.priceVnd,
      wastagePercent: so(tm?.wastagePercent),
    };
  });
}
