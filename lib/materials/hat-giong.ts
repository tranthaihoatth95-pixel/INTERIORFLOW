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
 * 📄 HỢP ĐỒNG NÀY LÀ THỨ SCENE 3D SẼ ĐỌC — phiếu ĐANG SỐNG là
 * `docs/phieu-giao/P-V8b-DANH-TINH-VAT-LIEU-LEN-3D.md`; bản đầu
 * `docs/phieu-giao/P-V8-SCENE-DOC-VAT-LIEU.md` giữ làm dấu vết (nó tra vật liệu bằng
 * `ProductSpec.id` — cuid, không phải UUID ⇒ rơi xuống nhánh legacy-sku và `pbr` null vĩnh viễn;
 * đúng điều `lib/boq/model.ts:64` đã cấm bằng chữ hoa).
 * Khai đủ ở ĐÂY để V8 chỉ việc **đọc**, không phải đoán thêm gì: `baseColorMapUrl` (đường dẫn
 * cùng gốc) · `uvScaleMm` (mm thật, đúng thứ tự w×h theo hướng vân) · `baseColor` trắng làm hệ
 * số nhân. `lib/three/pbr-three.ts` đã dịch trọn bộ đó ra `MeshPhysicalMaterial` — V8 gọi
 * `buildPbrMaterial`, không dựng đường thứ hai.
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
 * BẢY MÓN, NĂM HỌ (05/09 — trước đó hai món, cùng một họ GỖ).
 * Hai món gỗ đủ để chạy vòng nghề *tìm → xem trước → đặt → thay thế → lưu → mở lại* (khâu **thay
 * thế** cần đúng hai mã để đổi qua lại). Nhưng chúng KHÔNG đủ để chứng minh **đường ống**: cả hai
 * cùng `metallic: 0`, cùng độ nhám, cùng previewKind `wood` ⇒ nhánh kim loại và nhánh nhám-cao
 * chưa chạy thật lần nào. Năm món thêm rơi vào **năm họ khác nhau** (đá · gạch terrazzo · vải ·
 * kim loại · sơn) chính là để ép các nhánh đó chạy — và cũng là thứ nấc SCAN cần để có nghĩa: hai
 * ô gỗ nâu cạnh nhau thì "nhận ra món nào" không phải một câu hỏi thật.
 *
 * 🔴 BA MÓN CÓ ẢNH VÂN, HAI MÓN KHÔNG — và đó là QUYẾT ĐỊNH, không phải bỏ sót:
 * `uvScaleMm` là **tỉ lệ vật lý**, không phải một trường cho đủ. Ảnh nào không suy ra được bước
 * lặp thật thì món đó ship THAM SỐ, không ship ảnh — bịa tỉ lệ tệ hơn không có ảnh.
 *   · **kim loại đồng xước** — ảnh nướng sẵn một VỆT SÁNG vào màu gốc (`kimLoai()` trong
 *     `scripts/sinh-mau-vat-lieu.mjs`: `anh = (1 − |v − 0.38|·1.5)²`). Đó là ÁNH SÁNG, không phải
 *     vật liệu: lát nó ra sẽ thành một dải sáng lặp lại mỗi tấm, và nhét ánh sáng vào `baseColor`
 *     là đúng lỗi chiếu-sáng-hai-lần. Thêm nữa, cái làm kim loại xước ra "xước" là **nhám dị
 *     hướng**, thứ `MaterialPbr` chưa mang.
 *   · **sơn matt** — sơn KHÔNG CÓ bước lặp. Ảnh gần như phẳng (`fbm(u·2, v·2) · 0.07`); khai bất
 *     kỳ `uvScaleMm` nào cũng là dựng một con số vật lý không tồn tại.
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
  {
    matId: '2c7d5e10-9b64-4f2a-8e31-5d0a7c4b1f68',
    code: 'IF-MAT-DA-CAM-THACH-TRANG',
    name: 'Đá cẩm thạch trắng',
    nameEn: 'White marble',
    hoPbr: 'da',
    danhMuc: 'Đá tự nhiên',
    tags: ['đá', 'cẩm thạch', 'marble', 'stone', 'trắng'],
    pbr: {
      baseColor: '#ffffff',
      roughness: 0.3,
      metallic: 0,
      specular: 0.05,
      baseColorMapUrl: '/mau-vat-lieu/da-cam-thach-trang.png',
      /* 600×600 — khổ VIÊN ĐÁ LÁT thông dụng nhất, và vân trong ảnh trải trọn một viên
         (`daVan()` dựng vân theo toạ độ 0..1 của tấm). Lát ở khổ khác thì mạch rơi sai chỗ so
         với bản vẽ, và mạch là thứ người nghề nhìn đầu tiên trên sàn đá. */
      uvScaleMm: { w: 600, h: 600 },
      reflectance: 0.7,
      typeId: 'da-tu-nhien',
    },
    hatch2d: { hatchPattern: 'ANSI37', patternScale: 1, patternAngle: 0, color: '#e6e4de' },
    license: GIAY_PHEP_CC0,
    source: NGUON_TU_DUNG,
  },
  {
    matId: '8f3a6b22-1c47-4d95-a0e8-6b2f9d31c704',
    code: 'IF-MAT-TERRAZZO-XAM',
    name: 'Gạch terrazzo xám',
    nameEn: 'Grey terrazzo',
    hoPbr: 'gach',
    danhMuc: 'Gạch terrazzo',
    tags: ['terrazzo', 'gạch', 'đá mài', 'tile', 'xám'],
    pbr: {
      baseColor: '#ffffff',
      roughness: 0.3,
      metallic: 0,
      specular: 0.05,
      baseColorMapUrl: '/mau-vat-lieu/da-terrazzo-xam.png',
      /* 400×400 — SUY TỪ CHÍNH HẠT ĐÁ trong ảnh, không phải chọn cho tròn số. `terrazzo()` rải
         190 hạt bán kính 0,012–0,038 của tấm ⇒ đường kính 2,4–7,6% cạnh tấm. Ở 400 mm ra hạt
         **9,6–30 mm**, đúng dải hạt terrazzo thật; ở 600 mm thành 14–46 mm (thô quá cỡ thường),
         ở 300 mm thành 7–23 mm (mịn hơn thực tế của mẫu này). 400×400 cũng là khổ viên thông dụng. */
      uvScaleMm: { w: 400, h: 400 },
      reflectance: 0.55,
      typeId: 'gach-men',
    },
    hatch2d: { hatchPattern: 'DOTS', patternScale: 1, patternAngle: 0, color: '#c9c7c1' },
    license: GIAY_PHEP_CC0,
    source: NGUON_TU_DUNG,
  },
  {
    matId: 'b41e8d07-53f6-4a28-9c6d-7e0b2a95f3d1',
    code: 'IF-MAT-VAI-LANH-BE',
    name: 'Vải lanh be',
    nameEn: 'Beige linen',
    hoPbr: 'vai',
    danhMuc: 'Vải lanh',
    tags: ['vải', 'lanh', 'linen', 'fabric', 'be'],
    pbr: {
      baseColor: '#ffffff',
      roughness: 0.9,
      metallic: 0,
      specular: 0.03,
      baseColorMapUrl: '/mau-vat-lieu/vai-lanh-be.png',
      /* 60×60 — SUY TỪ MẬT ĐỘ SỢI. `vai()` dệt **78 sợi** ngang và 78 sợi dọc trên một tấm ⇒ ở
         60 mm ra **13 sợi/cm**, đúng dải lanh dệt trung bình. Ở 200 mm chỉ còn 3,9 sợi/cm (thưa
         như bao tải), ở 20 mm thành 39 sợi/cm (dày như lụa). */
      uvScaleMm: { w: 60, h: 60 },
      sheen: 0.35,
      reflectance: 0.5,
      typeId: 'vai',
    },
    hatch2d: { hatchPattern: 'ANSI31', patternScale: 0.4, patternAngle: 45, color: '#d0c6b4' },
    license: GIAY_PHEP_CC0,
    source: NGUON_TU_DUNG,
  },
  {
    matId: 'd90c47f5-6ab3-4e71-b28f-3c5e1074a9b6',
    code: 'IF-MAT-KIM-LOAI-DONG-XUOC',
    name: 'Đồng xước',
    nameEn: 'Brushed bronze',
    hoPbr: 'kim-loai',
    danhMuc: 'Kim loại đồng',
    tags: ['kim loại', 'đồng', 'bronze', 'brass', 'metal', 'xước'],
    pbr: {
      /* KHÔNG có ảnh vân ⇒ `baseColor` là MÀU THẬT (không phải hệ số nhân). Xem 🔴 ở đầu bảng. */
      baseColor: '#a07a4d',
      roughness: 0.35,
      metallic: 1,
      specular: 0.5,
      reflectance: 0.35,
      typeId: 'kim-loai',
    },
    hatch2d: { hatchPattern: 'ANSI32', patternScale: 1, patternAngle: 0, color: '#a07a4d' },
    license: GIAY_PHEP_CC0,
    source: NGUON_TU_DUNG,
  },
  {
    matId: '6e25b93a-8d10-4c5f-91a7-04f8e2b6d3c9',
    code: 'IF-MAT-SON-MATT-TRANG-NGA',
    name: 'Sơn matt trắng ngà',
    nameEn: 'Ivory matt paint',
    hoPbr: 'son',
    danhMuc: 'Sơn nước',
    tags: ['sơn', 'matt', 'paint', 'trắng ngà', 'tường'],
    pbr: {
      baseColor: '#ece7dd',
      roughness: 0.7,
      metallic: 0,
      specular: 0.03,
      reflectance: 0.78,
      typeId: 'son',
    },
    /* SOLID: lớp sơn mỏng, mặt cắt bản vẽ tô đặc — không có hoạ tiết để vẽ. */
    hatch2d: { hatchPattern: 'SOLID', patternScale: 1, patternAngle: 0, color: '#ece7dd' },
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
