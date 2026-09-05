/**
 * lib/materials/hat-giong.ts — TẦNG HẠT GIỐNG của kho vật liệu: thứ CÓ MẶT trên máy sạch, lần
 * chạy đầu tiên, TRƯỚC KHI người dùng chạm vào bất cứ gì.
 *
 * ⛔ VÌ SAO PHẢI CÓ TẦNG NÀY (đo `pbr-store.ts` 04/09): kho PBR đang sống ở `localStorage`
 * (`if.materials.pbr.v1`). Lựa chọn đó ĐÚNG cho vật liệu người dùng tự tạo — và có lý do ghi rõ
 * tại chỗ (nhồi PBR vào `ProductSpec` là phá luật 2.1.9.i). Nhưng thư viện MỞ ĐẦU thì không sống
 * ở đó được: `localStorage` **trống trơn** ở lần mở app đầu tiên ⇒ người dùng mở ra thấy kho rỗng.
 * Tệp này là tầng thứ ba, nằm TRONG REPO, CHỈ ĐỌC.
 *
 * THỨ TỰ PHÂN GIẢI (thi hành ở `tang-phan-giai.ts`, KHÔNG ở đây):
 *   HẠT GIỐNG (tệp repo, chỉ đọc) → STUDIO (`localStorage`, người dùng ghi đè) → DỰ ÁN (bản chèn).
 * MỘT CHIỀU, đúng khuôn `.idfc` chốt 07/08: sửa ở dự án KHÔNG đổi mẫu gốc.
 *
 * 🔴 BA RÀNG BUỘC KHÔNG ĐƯỢC PHÁ — có test canh từng cái (`hat-giong.test.ts`):
 *  1. `matId` là **UUID gõ cứng một lần, KHÔNG BAO GIỜ đổi**. Nó đi vào tệp `.idf`/`.idfc` người
 *     dùng lưu; sinh lại mỗi lần build là **làm mồ côi dữ liệu cũ**. ⇒ CẤM `generateMatId()`,
 *     `crypto.randomUUID()`, `Date.now()` ở tệp này. Test khoá cứng từng chuỗi UUID.
 *  2. **KHÔNG CHÉP GIÁ** (luật 2.1.9.i, 30/07). Vật liệu **TRỎ TỚI** bản ghi thương mại qua
 *     `matId`; giá đổi hằng ngày, texture thì không. Test quét mọi khoá cấm.
 *  3. **CHỈ ĐƯỢC TRỎ VÀO ẢNH CỦA CHÍNH IF** (`/mau-vat-lieu/…`), không ảnh ngoài, không data-URI.
 *     🔴 SỬA 05/09 — bản cũ cấm **mọi** bản đồ texture ("ship THAM SỐ, texture đi theo gói nạp").
 *     Lý do của luật đó là **giấy phép** (0 byte ⇒ 0 rủi ro), và lý do đó nay **không còn áp cho
 *     hai món này**: `public/mau-vat-lieu/*.png` do CHÍNH IF sinh ra bằng
 *     `scripts/sinh-mau-vat-lieu.mjs` (sharp + PRNG hạt cố định, tất định, không tải mạng, không
 *     chép của ai — báo cáo `docs/bao-cao-phien/2026-08-20-DEMO-SACH.md` §1.1).
 *     Cái giá của việc giữ nguyên luật cũ thì ĐO ĐƯỢC: 9 ảnh vân THẬT nằm trong repo từ 20/08 mà
 *     `grep -rn "mau-vat-lieu" lib/ components/ app/` = **0 dòng** — mồ côi 16 ngày, trong khi mọi
 *     quả cầu rơi về `twoToneTexture` (hai màu, KHÔNG VÂN). Xem `docs/delivery/PROBE-DUONG-ONG-ANH.md`.
 *     ⇒ Luật không bị bỏ, nó bị **thu hẹp đúng phần đã hết lý do**: test nay chặn ảnh NGOÀI
 *     (http · data: · thư mục khác) và chặn cả URL trỏ vào tệp KHÔNG TỒN TẠI.
 *
 * KHÔNG ĐỤNG `normalizeMatId` cũ (upper+trim) — dữ liệu `localStorage` đang sống giả định đúng
 * ngữ nghĩa đó. Tệp này chỉ dùng `normalizeMatIdCanonical` (lowercase, RFC 4122) vì mọi matId
 * hạt giống ĐỀU là UUID thật.
 *
 * `inferPbrFromCategory` (17 họ) GIỮ NGUYÊN VAI: nó là **đường suy khi thiếu**, không phải kho.
 * Trường `hoPbr` dưới đây khai vật liệu này thuộc họ nào để máy đối chiếu được hai bên —
 * KHÔNG phải để đọc giá trị từ đó ra.
 *
 * THUẦN — không DOM, không FS, không network.
 */
import type { MaterialPbr } from './schema';
import { isMatIdUuid, normalizeMatIdCanonical } from './matid-identity';

/** Ký hiệu hatch 2D đi kèm — khuôn con `MaterialDef` (`lib/cad/materials.ts`), chỉ phần đi theo
 * tệp được. Cùng hình dạng `IdfcHatch2d` để một vật liệu hạt giống xuất thẳng ra `.idfc`. */
export interface HatGiongHatch2d {
  hatchPattern: string;
  patternScale?: number;
  patternAngle?: number;
  color?: string;
}

export interface VatLieuHatGiong {
  /** UUID GÕ CỨNG — xem ràng buộc 1. */
  matId: string;
  /** mã nghề đọc được, dùng cho tìm kiếm/hiển thị. KHÔNG phải danh tính (danh tính là `matId`). */
  code: string;
  name: string;
  nameEn: string;
  /** một trong 17 họ mà `inferPbrFromCategory` biết suy — để máy đối chiếu, không để đọc số ra. */
  hoPbr: string;
  /** chuỗi "Danh mục" thô như người gõ trong ATLAS — đầu vào của `inferPbrFromCategory`. */
  danhMuc: string;
  tags: readonly string[];
  /** THAM SỐ render + (nếu có) bản đồ màu của chính IF — xem ràng buộc 3. */
  pbr: MaterialPbr;
  hatch2d: HatGiongHatch2d;
  /** luật phân phối, không thương lượng (hợp đồng G4 §2). */
  license: string;
  source: string;
}

const GIAY_PHEP_CC0 = 'CC0 — tự do sử dụng/sửa/phân phối (tài sản gốc của dự án InteriorFlow)';
const NGUON_TU_DUNG =
  'tự dựng — tham số chọn theo họ vật liệu của lib/materials/pbr-from-category.ts, không sao chép bảng của bên nào; ảnh vân sinh bằng scripts/sinh-mau-vat-lieu.mjs (sharp + PRNG hạt cố định, tất định, không tải mạng)';

/**
 * BƯỚC LẶP VÂN của một tấm ván gỗ, mm thật. **Thứ tự w×h KHÔNG tuỳ tiện**: `uvScaleMm.w` là số mm
 * mà BỀ RỘNG ẢNH phủ, `h` là số mm mà CHIỀU CAO ẢNH phủ (schema ghi rõ). Vân trong
 * `go-soi-trang.png`/`go-oc-cho.png` chạy theo TRỤC ĐỨNG của ảnh ⇒ trục đứng là chiều DÀI tấm ván
 * (1200 mm), trục ngang là bề RỘNG tấm (190 mm). Khai ngược lại thì vân chạy ngang thớ — người
 * nghề nhìn một nhịp là thấy sai.
 * 190×1200: khổ ván sàn/ốp thông dụng. Trước 05/09 chỗ này ghi `{ w: 1200, h: 190 }` — chọn khi
 * CHƯA CÓ ảnh nào để mà đúng hay sai; nay có ảnh thật thì con số phải khớp ảnh thật.
 */
const KHO_VAN_GO = { w: 190, h: 1200 } as const;

/**
 * ⚠️ MỖI DÒNG UUID Ở ĐÂY LÀ MỘT CAM KẾT VĨNH VIỄN. Thêm vật liệu ⇒ thêm UUID mới; SỬA một UUID
 * đã ship ⇒ mọi tệp `.idf`/`.idfc` đang trỏ vào nó thành mồ côi.
 *
 * VÌ SAO CHỈ HAI MÓN (khai thật, không tô): lượt này làm **bộ đại diện tối thiểu** để chạy trọn
 * vòng nghề `tìm → xem trước → đặt → biến đổi → thay thế → lưu → đóng → mở lại`. Cần ĐÚNG HAI
 * vật liệu vì khâu **thay thế** phải đổi từ mã này sang mã kia — một món thì không có gì để đổi.
 * Bộ phủ đủ 17 họ là mục tiêu sau, và nó là DỮ LIỆU thêm vào bảng này, KHÔNG phải máy móc mới.
 */
export const VAT_LIEU_HAT_GIONG: readonly VatLieuHatGiong[] = [
  {
    matId: 'f77b3a78-f2e3-4b19-b70f-20643c8a6243',
    code: 'IF-MAT-GO-SOI',
    name: 'Gỗ sồi tự nhiên',
    nameEn: 'Natural oak',
    hoPbr: 'go',
    danhMuc: 'Gỗ tự nhiên',
    tags: ['gỗ', 'sồi', 'oak', 'wood', 'tự nhiên'],
    pbr: {
      baseColor: '#ffffff',
      roughness: 0.6,
      metallic: 0,
      specular: 0.04,
      /* ẢNH VÂN THẬT của chính IF. `baseColor` để TRẮNG là cố ý: glTF nhân `baseColorFactor ×
         baseColorTexture`, nên màu khác trắng sẽ ÁM lên ảnh — `buildPbrMaterial` đã ghi đúng luật
         đó. Màu gỗ nay đến từ ảnh, không từ một mã màu đoán. */
      baseColorMapUrl: '/mau-vat-lieu/go-soi-trang.png',
      // bước lặp vân THẬT tính bằng mm — thiếu nó thì tấm ván 1200mm render ra vân sai tỉ lệ.
      uvScaleMm: { ...KHO_VAN_GO },
      reflectance: 0.4,
      typeId: 'go',
    },
    hatch2d: { hatchPattern: 'ANSI31', patternScale: 0.9, patternAngle: 0, color: '#b98a54' },
    license: GIAY_PHEP_CC0,
    source: NGUON_TU_DUNG,
  },
  {
    matId: 'e1f4694e-b25c-4dcb-86d4-0c787b69f857',
    code: 'IF-MAT-GO-OC-CHO',
    name: 'Gỗ óc chó',
    nameEn: 'American walnut',
    hoPbr: 'go',
    danhMuc: 'Gỗ tự nhiên',
    tags: ['gỗ', 'óc chó', 'walnut', 'wood', 'tự nhiên'],
    pbr: {
      baseColor: '#ffffff',
      roughness: 0.55,
      metallic: 0,
      specular: 0.04,
      baseColorMapUrl: '/mau-vat-lieu/go-oc-cho.png',
      uvScaleMm: { ...KHO_VAN_GO },
      reflectance: 0.18,
      typeId: 'go',
    },
    hatch2d: { hatchPattern: 'ANSI31', patternScale: 0.9, patternAngle: 0, color: '#5a3a26' },
    license: GIAY_PHEP_CC0,
    source: NGUON_TU_DUNG,
  },
];

/** Bảng tra theo `matId` canonical (lowercase). Dựng MỘT LẦN lúc nạp module — bảng bất biến. */
const THEO_MAT_ID: ReadonlyMap<string, VatLieuHatGiong> = new Map(
  VAT_LIEU_HAT_GIONG.map((v) => [normalizeMatIdCanonical(v.matId), v] as const),
);

/** Tra một vật liệu hạt giống theo `matId`. Trả `null` khi không có — KHÔNG bịa mặc định. */
export function vatLieuHatGiong(matId: string): VatLieuHatGiong | null {
  if (typeof matId !== 'string' || !isMatIdUuid(matId)) return null;
  return THEO_MAT_ID.get(normalizeMatIdCanonical(matId)) ?? null;
}

/**
 * Kho PBR của tầng hạt giống dưới ĐÚNG hình dạng `Record<matId, MaterialPbr>` mà `resolve.ts` và
 * `pbr-store.ts` đang dùng — để tầng phân giải xếp chồng ba tầng bằng MỘT phép hợp nhất, không
 * phải viết đường đọc riêng. Trả BẢN SAO mỗi lần gọi: kho hạt giống chỉ-đọc, người gọi lỡ ghi đè
 * cũng không làm bẩn hằng số module.
 */
export function pbrMapHatGiong(): Record<string, MaterialPbr> {
  const out: Record<string, MaterialPbr> = {};
  for (const v of VAT_LIEU_HAT_GIONG) out[normalizeMatIdCanonical(v.matId)] = { ...v.pbr };
  return out;
}

/** TÌM — khâu đầu của vòng nghề. So khớp không dấu trên tên/mã/thẻ. Chuỗi rỗng ⇒ trả cả kho
 * (đúng hành vi "mở kệ ra thấy hết", không phải "không gõ thì không có gì"). */
export function timVatLieuHatGiong(tuKhoa: string): VatLieuHatGiong[] {
  const q = boDau(tuKhoa ?? '').trim();
  if (!q) return [...VAT_LIEU_HAT_GIONG];
  return VAT_LIEU_HAT_GIONG.filter((v) =>
    [v.name, v.nameEn, v.code, ...v.tags].some((s) => boDau(s).includes(q)),
  );
}

function boDau(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase();
}
