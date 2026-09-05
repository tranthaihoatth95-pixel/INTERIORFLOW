/**
 * lib/cad/idfc.ts — định dạng ".idfc": MỘT tệp = MỘT MẪU THƯ VIỆN (chữ C đọc là **CONTENT** từ
 * chốt 07/08 khuya — không còn là Component; giữ nguyên phần mở rộng tệp, chỉ đổi nghĩa trong sổ).
 *
 * Nguồn lệnh: `docs/00-CHOT.md` mục 11 "MỌI THỨ TRONG THƯ VIỆN ĐỀU LÀ .idfc" (Hoà chốt nguyên
 * văn 07/08 khuya: *"tất cả đều là idfc thì hợp lý hơn… như vậy mới liên kết mật thiết với nhau,
 * và đúng tinh thần dữ liệu linh hoạt"*). Gom một định dạng ⇒ mọi cơ chế chung (version · phạm vi
 * · thumbnail · tìm · đưa lên kệ · nhập/xuất) chỉ viết MỘT lần, và mẫu trang ↔ vật liệu ↔ video
 * tham chiếu chéo được nhau.
 *
 * V2 (07/08 khuya) — VỎ CHUNG + RUỘT THEO LOẠI (chốt 11.2, ⛔ CẤM interface phẳng toàn optional):
 *   meta      ← vỏ chung mọi loại: id? · tên · mã · kind · phạm vi? · thẻ? · phòng? · người tạo? · ngày
 *   body      ← ruột DISCRIMINATED UNION theo `BODY_TYPE_OF_KIND[meta.kind]` — máy kiểm được
 *               "video KHÔNG được có geom2d" thay vì 40 trường optional mỗi loại dùng 5.
 *   commerce? ← giá — CHỈ loại bán được (`SELLABLE_KINDS`).
 *   progress? ← tiến độ — CHƯA KHAI (luật K4: `model Task` chưa có, phiếu P1; thêm bằng migration
 *               sau khi có nơi tiêu thụ — ràng buộc 3 bên dưới).
 *
 * V3 (08/08, `00-CHOT.md` mục 08/08 — ĐÃ DUYỆT) — thêm `IdfcKind` thứ 12: **`preset`**. Kệ
 * "Preset dựng ảnh" (`shelves.ts` `render-preset`, 5 mục thật: Nắng chiều/Trời phủ mây/Đèn đêm/
 * Nắng sớm/Studio trắng — VIỆC 7b) là NƠI TIÊU THỤ thật (K4) — trước v3, 5 thumb `light-*` phải
 * tạm mượn kind `asset` (xem `thumb-kinds.ts` — không đúng bản chất, chỉ là chỗ đỗ tạm). V3 gỡ
 * chỗ mượn đó, `light-*` nay map đúng `preset`.
 *
 * HAI TRỤC PHÂN LOẠI (chốt 11.4, ĐỘC LẬP không trộn):
 *   ① `meta.kind` — *nó là cái gì* (11 loại, 6 loại đầu đúng cách hồ sơ nội thất CHIA THẦU).
 *   ② `BlockGroup` (geom2d.group) — *dùng ở đâu* (10 nhóm PHÒNG, giữ nguyên).
 *
 * Khuôn version/migration PORT NGUYÊN VĂN từ `lib/cad/idf.ts` (JSON versioned + bảng nâng từng
 * bậc) — không phát minh cơ chế thứ hai (N8). ĐÂY LÀ LẦN ĐẦU `IDFC_MIGRATIONS` có entry thật:
 * v1 khai `geom2d` BẮT BUỘC ở gốc file, v2 chuyển vào `body` ⇒ file v1 đã lưu ra đĩa PHẢI đi qua
 * `migrateIdfc` (test round-trip v1→v2 trong idfc.test.ts).
 *
 * BA RÀNG BUỘC (00-CHOT.md, KHÔNG được phá bởi bất kỳ hàm nào thêm vào file này):
 *  1. MỘT CHIỀU — file này chỉ có export/import, KHÔNG có hàm "ghi ngược" từ bản chèn về .idfc gốc.
 *  2. Bản chèn giữ liên kết qua FK MỀM (`BlockEntity.specId`/`HatchEntity.specId` đã có sẵn trong
 *     `model.ts`) — KHÔNG thêm field mới vào `Base`/`model.ts` (ngoài vùng sở hữu phiên này).
 *  3. Nhánh TIẾN ĐỘ phụ thuộc `model Task` (chưa có, phiếu P1 riêng) — KHÔNG khai trong v2, thêm
 *     ở migration sau khi có nơi tiêu thụ thật (K4).
 *
 * THUẦN (không React/DOM), test round-trip độc lập — cùng lối `idf.roundtrip` / `dwg-map.test.ts`.
 */

import type { Prim } from './furniture';
import type { BuildRecipe } from './model';
import type { BlockGroup, ShapeVariant, SnapAnchor, ClearanceZone } from './shared-types';
import type { MaterialPbr } from '../materials/schema';

export const IDFC_VERSION = 3 as const;
export const IDFC_APP_VERSION = 'interiorflow-1.0.0';

// Giống hệt cơ chế `currentIdfVersion` của idf.ts — tách hằng số THẬT (IDFC_VERSION, quyết định
// exportIdfc xuất version nào) khỏi "version đích test đang giả lập", để migrateIdfc test được
// mà không phải bump hằng số thật.
let currentIdfcVersion: number = IDFC_VERSION;

/** CHỈ DÙNG TRONG TEST — xem `__setCurrentIdfVersionForTest` (idf.ts) để biết vì sao cần tách. */
export function __setCurrentIdfcVersionForTest(v: number) {
  currentIdfcVersion = v;
}

/* ═══════════════ TRỤC ① — LOẠI (kind): "nó là cái gì" ═══════════════ */

/** 12 loại (11 chốt 11.4 + `preset` v3) — 6 loại đầu là cách hồ sơ nội thất CHIA THẦU (mỗi loại
 * một nhà thầu, một dòng hợp đồng); 6 loại sau là mẫu & hồ sơ (KHÔNG bán được, xem
 * `SELLABLE_KINDS`). `lighting` cũ (v1) GỘP vào `fixture` (đèn = thiết bị cố định, thầu M&E) —
 * migration v1→v2 tự đổi. `preset` (v3) — cấu hình dựng ảnh (ánh sáng/khí quyển/máy quay), KHÔNG
 * phải cấu kiện vật lý nên không chia thầu, cũng không phải "mẫu trang/hồ sơ" (page/doc) — tự nó
 * là một trục riêng, xem `IdfcBody` case `'preset'`. */
export type IdfcKind =
  | 'material' | 'furniture' | 'millwork' | 'fitout' | 'fixture' | 'soft'
  | 'page' | 'video' | 'doc' | 'asset' | 'brandkit' | 'preset';

export const IDFC_KINDS: readonly IdfcKind[] = [
  'material', 'furniture', 'millwork', 'fitout', 'fixture', 'soft',
  'page', 'video', 'doc', 'asset', 'brandkit', 'preset',
];

/** Loại BÁN ĐƯỢC — chỉ những loại này được mang `commerce` (chốt 11.2 "giá, chỉ loại nào bán
 * được"). importIdfc KHÔNG drop commerce của loại khác (dữ liệu người dùng không tự mất) nhưng
 * UI/BOQ chỉ đọc giá của các loại này. */
export const SELLABLE_KINDS: readonly IdfcKind[] = ['material', 'furniture', 'millwork', 'fitout', 'fixture', 'soft'];

/** Ruột nào cho loại nào — 5 loại cấu-kiện-vật-lý chung ruột 'component'. */
export const BODY_TYPE_OF_KIND: Record<IdfcKind, IdfcBody['type']> = {
  material: 'material',
  furniture: 'component', millwork: 'component', fitout: 'component', fixture: 'component', soft: 'component',
  page: 'page', video: 'video', doc: 'doc', asset: 'asset', brandkit: 'brandkit', preset: 'preset',
};

/* ═══════════════ VỎ CHUNG ═══════════════ */

/** Phạm vi kệ — khớp NGUYÊN VĂN `ScopeLevel` của `lib/library/types.ts` (khai lại literal ở đây
 * vì lib/cad không import ngược lib/library — tránh vòng; test khoá 2 union không lệch nhau). */
export type IdfcScope = 'chung' | 'studio' | 'du_an' | 'chang';

export interface IdfcMeta {
  /** id ổn định trong kho — optional (file trao tay ngoài kho không cần). */
  id?: string;
  name: string;
  nameEn?: string;
  code: string;
  /** TRỤC ① — bắt buộc từ v2 (v1 để trong commerce.kind, migration tự chuyển lên). */
  kind: IdfcKind;
  scope?: IdfcScope;
  tags?: string[];
  /** TRỤC ② dạng nhãn tự do cấp meta (phòng/khu) — trục chính thức của hình học vẫn là
   * `geom2d.group` (BlockGroup); field này cho loại KHÔNG có geom2d (video quay phòng nào…). */
  room?: string;
  author?: string;
  createdAt: string; // ISO 8601
  modifiedAt: string; // ISO 8601
  appVersion: string;
  /** ID nguồn trong kho Thư viện lúc xuất — CHỈ để hiển thị "xuất từ đâu", KHÔNG dùng để ghi
   * ngược (ràng buộc 1 — một chiều). `lib/library/*` KHÔNG đọc field này để đồng bộ tự động. */
  sourceLibraryId?: string;
  /**
   * ⚙️ IDFC-INTEGRITY-001 (26/08) — TÚI VẬN CHUYỂN cho khoá lạ ở **CẤP GỐC** của file.
   *
   * Vì sao túi này nằm trong `meta` chứ không ở cấp gốc, dù nó chứa khoá cấp gốc:
   * `importIdfc` trả `ParsedIdfc`, nhưng **mọi nơi gọi `exportIdfc` đều bóc tách**
   * `{ meta, body, commerce }` — một trường mới ở cấp gốc sẽ bị bỏ lại ở đúng mọi nơi gọi hiện
   * có, và ta lại mất dữ liệu y như cũ, chỉ khác là lần này có thêm một field trông như đã sửa.
   * `meta` thì LUÔN được truyền nguyên khối. Nên túi đi nhờ `meta` là đường DUY NHẤT sống sót
   * mà không phải sửa mọi nơi gọi (và không phải tin rằng mọi nơi gọi TƯƠNG LAI sẽ nhớ).
   *
   * `exportIdfc` trả những khoá này về **đúng cấp gốc** và **xoá `meta.x`** khỏi file ghi ra —
   * nên vị trí trên đĩa được giữ nguyên văn, không có field lạ nào mọc thêm.
   *
   * Khoá lạ của CHÍNH `meta` thì KHÔNG cần túi: chúng được giữ **tại chỗ** trên `meta`.
   *
   * ⚠️ `x` là tên DÀNH RIÊNG cho cơ chế này. File nào mang sẵn `meta.x` sẽ bị coi là túi.
   */
  x?: Record<string, unknown>;
  /** Khoá lạ của `meta` giữ TẠI CHỖ — khai index signature để TypeScript không chặn. */
  [khoaLa: string]: unknown;
}

/* ═══════════════ RUỘT THEO LOẠI ═══════════════ */

/** ① mặt Thiết kế 2D — snapshot TỰ CHỨA (không phụ thuộc registry `BLOCKS` của app đích, vì
 * `.idfc` phải mở được ở dự án/máy KHÁC nơi sinh ra nó — registry hai bên có thể lệch). */
export interface IdfcGeom2d {
  group: BlockGroup;
  w: number;
  h: number;
  prims: Prim[];
  variants?: ShapeVariant[];
  anchors?: SnapAnchor[];
  clearance?: ClearanceZone[];
}

/** ② mặt Thiết kế 3D — K1: KHÔNG lưu mesh rời, chỉ lưu THAM SỐ để tầng 3D suy từ `geom2d` giống
 * hệt cách `cad-to-obj.ts` đùn tường. `matId` ưu tiên; `pbr` nhúng chỉ khi cấu kiện chưa có
 * matId trong kho chung.
 *
 * ⚠️ SUPERSEDED 19/08 (comment cũ ghi `matId (= ProductSpec.sku)`): matId nay là IF-owned
 * immutable UUID (Hoà chốt hòa giải Decision Conflict). `.idfc` v3+ export ghi UUID; `.idfc` v1-v3
 * cũ có thể có matId=sku legacy — importIdfc resolve qua `lib/materials/matid-identity.ts`
 * `resolveInputMatId` khi bảng mapping có sẵn. Xem frontier `material-matid-uuid`. */
export interface IdfcGeom3d {
  heightMm?: number;
  bevelMm?: number;
  matId?: string;
  pbr?: MaterialPbr;
  /**
   * ⭐ G6 (04/09) — CÔNG THỨC KHỐI đi cùng cấu kiện. Trước dòng này `grep "recipe" lib/cad/idfc.ts`
   * = **0**: `BuildRecipe` sống được qua `.idf` (tệp dự án, `Base.recipe`) nhưng **MẤT** ngay khi
   * cấu kiện rời khỏi bản vẽ để lên kho studio dưới dạng `.idfc` — tức đúng lúc nó thành TÀI SẢN
   * DÙNG LẠI thì nó thôi là tham số và trở lại thành lưới chết. Đó là thứ hợp đồng G4 §3 cấm.
   *
   * ADDITIVE, optional: `.idfc` v1-v3 đã ghi ra đĩa KHÔNG có trường này vẫn đọc y nguyên, không
   * cần bậc migration nào (v3 giữ nguyên số hiệu — thêm trường tuỳ chọn không đổi nghĩa trường
   * nào đã có). Kiểu lấy từ `./model` — lõi THUẦN, `idfc.ts` không vì thế mà chạm `three`.
   *
   * Ngữ nghĩa GIỐNG HỆT `Base.recipe`: thứ tự mảng là thứ tự áp dụng; bậc `enabled:false` giữ
   * nguyên tham số. Nơi tiêu thụ là `evalRecipe`/`resolveSceneGroupGeometry` sẵn có — KHÔNG
   * evaluator thứ hai.
   */
  recipe?: BuildRecipe;
}

/** Ký hiệu 2D của VẬT LIỆU (hatch trên bản vẽ) — khuôn con `MaterialDef` (lib/cad/materials.ts),
 * chỉ phần đi theo file được. */
export interface IdfcHatch2d {
  hatchPattern: string;
  patternScale?: number;
  patternAngle?: number;
  color?: string;
}

/**
 * RUỘT — discriminated union theo `type` (= `BODY_TYPE_OF_KIND[meta.kind]`, importIdfc kiểm khớp).
 *
 * ⚠️ K4 với 4 ruột `page`/`video`/`doc`/`brandkit`: app CHƯA có producer/consumer thật cho payload
 * chi tiết (mẫu trang sống trong deck editor p12 · video trong SPEC-VIDEO · brandkit trong
 * brand-kit.json). Khai KHỞI ĐIỂM TỐI THIỂU đủ để (a) nhánh union TỒN TẠI — máy chặn được "video
 * không được có geom2d" ngay từ v2, (b) file không mất dữ liệu (`payload` giữ nguyên JSON gốc).
 * Mở rộng shape chi tiết = migration khi nối nơi tiêu thụ thật — KHÔNG đoán trước schema.
 *
 * `preset` (v3) CÙNG kỷ luật K4: kệ "Preset dựng ảnh" hôm nay chỉ có tên/mã (`shelves.ts`), CHƯA
 * có bộ tham số ánh sáng/camera thật nào để đóng gói (`lib/lighting/`/`lib/three/lighting.ts`
 * đang code — NGOÀI vùng sở hữu phiên này). `params: Record<string,unknown>` là khởi điểm tối
 * thiểu giữ chỗ, KHÔNG bịa trước shape `{sun, kelvin, …}` — khi tầng lighting xong sẽ đặc tả lại.
 */
export type IdfcBody =
  | { type: 'component'; geom2d: IdfcGeom2d; geom3d?: IdfcGeom3d; params?: ShapeVariant[] }
  | {
      type: 'material';
      /**
       * ⭐ G6 (04/09) — DANH TÍNH của vật liệu đi theo tệp. Trước dòng này ruột `material` mang đủ
       * PBR và hatch nhưng **không mang mã**: xuất một vật liệu ra `.idfc` rồi nhập lại ở máy
       * khác là ra một vật liệu **vô danh** — mọi bản chèn `.idf` đang trỏ vào `matId` cũ không
       * tìm lại được nó. `meta.code` KHÔNG thay được vai này: code là business key (đổi được),
       * `matId` là UUID bất biến (chốt 19/08, `matid-identity.ts`).
       * Optional vì tệp cũ không có — nhập lại vẫn đọc được, chỉ là không nối được danh tính.
       */
      matId?: string;
      pbr: MaterialPbr;
      hatch2d?: IdfcHatch2d;
      /** ký hiệu 2D dạng block (vật liệu có swatch vẽ được) — cũng là nơi giữ `geom2d` của file
       * v1 kind material khi nâng cấp, KHÔNG vứt dữ liệu (KS4). */
      symbol2d?: IdfcGeom2d;
    }
  | { type: 'page'; slide: Record<string, unknown> }
  | { type: 'video'; shots: unknown[]; music?: string }
  | { type: 'doc'; template: Record<string, unknown> }
  | { type: 'asset'; imageUrl: string; wPx?: number; hPx?: number; caption?: string }
  | { type: 'brandkit'; logoUrl?: string; colors: string[]; fonts?: string[] }
  | { type: 'preset'; params: Record<string, unknown> };

/** ③ mặt Trình chiếu/thương mại — khuôn con `ProductSpec`. V2 BỎ `kind` (đã lên `meta.kind` —
 * một sự thật một chỗ); `priceVnd` để `number` (JSON không có Decimal — tầng ghi DB tự đổi). */
export interface IdfcCommerce {
  /**
   * ⭐ KHOÁ BẤT BIẾN — `ProductSpec.id` (FK mềm, CÙNG namespace `BlockEntity.specId`/
   * `HatchEntity.specId` mà `Doc` và `computeBoq` đang neo). ADDITIVE 04/09, KHÔNG bump
   * `IDFC_VERSION`: trường optional thuần, tệp v3 cũ (chỉ có `sku`) mở lại y nguyên và rơi về
   * đường lùi sku — xem `resolveIdfcCommerceToSpec` (lib/materials/warehouse/catalog-link.ts).
   *
   * ⚠️ VÌ SAO CẦN, đo được: `sku` là BUSINESS KEY — nhà cung cấp đổi mã là mất nối. Trước 04/09
   * cấu kiện rời chỉ nối bằng `sku`, trong khi bản chèn trong `Doc` nối bằng `specId`; hai đầu
   * của CÙNG một vật neo bằng hai khoá khác hạng bền. `CatalogLink` (idfc-import/asset-family.ts
   * :129) vốn ĐÃ mang `specId`+`matId`, nhưng đường sinh chỉ chép `brand/sku/vendor` sang
   * `commerce` — hai khoá bất biến bị bỏ lại trong khoá mở rộng `xAssetFamily`, nên chỗ tiêu thụ
   * (`catalog-link.ts:readCatalog`) phải parse lại JSON thô mới lấy được, và `.idfc` sinh bằng
   * `exportIdfc` thuần (không có `xAssetFamily`) thì mất hẳn.
   *
   * ⛔ KHÔNG phá luật 2.1.9.i: đây là CON TRỎ, không phải bản sao. Giá vẫn nằm ở `ProductSpec`;
   * `priceVnd` dưới đây chỉ là ảnh chụp lúc nhập của cấu kiện rời, `specId` mới là đường về nguồn.
   */
  specId?: string;
  /** Khoá bất biến hạng vật liệu — matId UUID canonical (`lib/materials/matid-identity.ts`).
   * Cùng lý do như `specId`; dùng khi vật là `material` và kho đã backfill `ProductSpec.matId`. */
  matId?: string;
  brand?: string;
  sku?: string;
  vendor?: string;
  priceVnd?: number;
  priceNote?: string;
  currency?: 'VND' | 'USD' | 'EUR';
  unit?: string;
  materials?: string[];
  finishes?: string[];
}

export interface IdfcFile {
  idfcVersion: typeof IDFC_VERSION;
  meta: IdfcMeta;
  body: IdfcBody;
  commerce?: IdfcCommerce;
  /** Khoá lạ cấp gốc giữ TẠI CHỖ. Ca thật đã mất dữ liệu: `xFromPhoto` (xuất xứ 3 nấc
   * `measured|inferred|verified` của `lib/idfc-import/from-photo.ts`) đặt ở cấp gốc. */
  [khoaLa: string]: unknown;
}

export interface ParsedIdfc {
  meta: IdfcMeta;
  body: IdfcBody;
  commerce?: IdfcCommerce;
  /** Khoá lạ cấp gốc — giữ TẠI CHỖ để nơi đọc thấy đúng thứ file có. Bản sao vận chuyển nằm ở
   * `meta.x` (xem lý do ở đó). */
  [khoaLa: string]: unknown;
}

/** Khoá cấp GỐC mà app hiểu — mọi khoá khác vào túi `x`. */
const KHOA_GOC_DA_BIET = ['idfcVersion', 'meta', 'body', 'commerce'] as const;
/** Khoá của `meta` mà app hiểu — mọi khoá khác vào túi `meta.x`. */
const KHOA_META_DA_BIET = [
  'id', 'name', 'nameEn', 'code', 'kind', 'scope', 'tags', 'room', 'author',
  'createdAt', 'modifiedAt', 'appVersion', 'sourceLibraryId', 'x',
] as const;

/** Gom những khoá KHÔNG nằm trong `daBiet` thành một túi. Rỗng ⇒ `undefined` (không đẻ `{}` thừa
 * vào mọi file, tránh làm nhiễu so sánh round-trip của dữ liệu cũ). */
function tuiKhoaLa(
  o: Record<string, unknown>,
  daBiet: readonly string[],
): Record<string, unknown> | undefined {
  const tui: Record<string, unknown> = {};
  for (const k of Object.keys(o)) if (!daBiet.includes(k)) tui[k] = o[k];
  return Object.keys(tui).length ? tui : undefined;
}

/* ═══════════════ MIGRATION ═══════════════ */

/** v1 `commerce.kind` → `meta.kind` v2 (chốt 11.4: `lighting` gộp vào `fixture`). */
const V1_KIND_MAP: Record<string, IdfcKind> = {
  furniture: 'furniture', material: 'material', lighting: 'fixture', millwork: 'millwork', fixture: 'fixture',
};

/**
 * v1 → v2 — LẦN ĐẦU bảng này có entry thật (v1 khai `geom2d` bắt buộc ở GỐC file, v2 chuyển vào
 * `body`). Quy tắc, mỗi dòng một quyết định có lý do:
 *  · `kind` lấy từ `commerce.kind` (chỗ duy nhất v1 khai loại); thiếu commerce ⇒ 'furniture'
 *    (mọi file v1 đều là cấu kiện có hình học — đó là loại cấu kiện trung tính nhất).
 *  · kind='material' + có `geom3d.pbr` ⇒ ruột 'material' đúng nghĩa (pbr lên làm ruột chính,
 *    `geom2d` cũ GIỮ ở `symbol2d` — không vứt dữ liệu, KS4). Material KHÔNG pbr ⇒ vẫn ruột
 *    material với `pbr:{}` rỗng (MaterialPbr mọi trường optional — "chưa đo" là trạng thái hợp lệ,
 *    không bịa số, N4).
 *  · các kind khác ⇒ ruột 'component' (geom2d/geom3d di nguyên).
 *  · `commerce` giữ nguyên TRỪ trường `kind` (đã lên meta — không giữ hai bản sự thật).
 */
function migrateV1ToV2(f: Record<string, unknown>): Record<string, unknown> {
  const commerce = isPlainObject(f.commerce) ? { ...(f.commerce as Record<string, unknown>) } : undefined;
  const kindRaw = typeof commerce?.kind === 'string' ? (commerce.kind as string) : 'furniture';
  const kind: IdfcKind = V1_KIND_MAP[kindRaw] ?? 'furniture';
  if (commerce) delete commerce.kind;

  const geom2d = f.geom2d;
  const geom3d = isPlainObject(f.geom3d) ? (f.geom3d as unknown as IdfcGeom3d) : undefined;

  let body: Record<string, unknown>;
  if (kind === 'material') {
    body = { type: 'material', pbr: geom3d?.pbr ?? {}, symbol2d: geom2d };
  } else {
    body = { type: 'component', geom2d, geom3d };
  }

  const meta = isPlainObject(f.meta) ? { ...(f.meta as Record<string, unknown>) } : {};
  meta.kind = kind;

  return { idfcVersion: 2, meta, body, commerce };
}

/**
 * v2 → v3 — THUẦN BUMP VERSION. `preset` là kind MỚI THÊM (additive), không đổi ý nghĩa/hình dạng
 * bất kỳ trường nào của 11 kind cũ ⇒ không có dữ liệu nào cần biến đổi. Vẫn khai hàm thật (không
 * bỏ trống bảng) để `migrateIdfc` đi được trọn đường v1→v2→v3 cho file v1 cũ (test round-trip
 * `idfc.test.ts` "v1 xuyên 2 lần nâng cấp").
 */
function migrateV2ToV3(f: Record<string, unknown>): Record<string, unknown> {
  return { ...f, idfcVersion: 3 };
}

/**
 * Bảng nâng cấp — mỗi khoá `fromV` nâng ĐÚNG 1 bậc, cùng khuôn `IDF_MIGRATIONS` (idf.ts).
 */
const IDFC_MIGRATIONS: Record<number, (f: Record<string, unknown>) => Record<string, unknown>> = {
  1: migrateV1ToV2,
  2: migrateV2ToV3,
};

export function migrateIdfc(
  file: unknown,
  fromVersion: number,
  toVersion: number = currentIdfcVersion,
): IdfcFile | null {
  if (!isPlainObject(file)) return null;
  if (fromVersion > toVersion) return null;
  let cur: Record<string, unknown> = file;
  let v = fromVersion;
  while (v < toVersion) {
    const step = IDFC_MIGRATIONS[v];
    if (!step) return null; // đứt gãy — chưa viết hàm nâng cho version này
    cur = step(cur);
    v += 1;
  }
  return cur as unknown as IdfcFile;
}

let lastImportError: string | null = null;
/** Lý do CỤ THỂ của lần `importIdfc` gần nhất trả `null` — cùng cơ chế `lastImportIdfError` (idf.ts). */
export function lastImportIdfcError(): string | null {
  return lastImportError;
}

/* ═══════════════ EXPORT ═══════════════ */

export function exportIdfc(input: {
  meta: Partial<IdfcMeta> & Pick<IdfcMeta, 'name' | 'code' | 'kind'>;
  body: IdfcBody;
  commerce?: IdfcCommerce;
  /** IDFC-INTEGRITY-001 — khoá lạ cấp gốc, rải trở lại nguyên văn. Thường KHÔNG cần truyền:
   * `importIdfc` đã nhét bản sao vào `meta.x` chính vì mọi nơi gọi đều bóc tách và sẽ quên
   * trường này. Truyền ở đây chỉ để nơi gọi nào muốn khai tường minh. */
  x?: Record<string, unknown>;
}): string {
  const now = new Date().toISOString();
  // `meta.x` là TÚI VẬN CHUYỂN khoá cấp gốc (xem `IdfcMeta.x`) — bóc ra khỏi meta, trả về gốc.
  const { x: tuiGoc, ...metaConLai } = input.meta as IdfcMeta;
  const file: IdfcFile = {
    idfcVersion: IDFC_VERSION,
    meta: {
      ...metaConLai, // khoá lạ của meta đi kèm ở đây, giữ nguyên vị trí
      name: input.meta.name,
      code: input.meta.code,
      kind: input.meta.kind,
      createdAt: input.meta.createdAt || now,
      modifiedAt: now,
      appVersion: input.meta.appVersion || IDFC_APP_VERSION,
    },
    body: input.body,
    commerce: input.commerce,
  };
  // Túi rải TRƯỚC, khoá đã biết ĐÈ LÊN SAU: một file lạ không bao giờ đổi được `idfcVersion`,
  // `meta`, `body`, `commerce` của bản ghi ra. Nếu nó làm được thì mở-rồi-lưu một file cố ý
  // độc hại có thể thay ruột món khác.
  const raGoc: Record<string, unknown> = {
    ...(tuiGoc ?? {}),
    ...(input.x ?? {}),
    ...file,
  };
  if (raGoc.commerce === undefined) delete raGoc.commerce;
  return JSON.stringify(raGoc);
}

/* ═══════════════ IMPORT + VALIDATE ═══════════════ */

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isValidGeom2d(v: unknown): v is IdfcGeom2d {
  if (!isPlainObject(v)) return false;
  return (
    typeof v.group === 'string' &&
    typeof v.w === 'number' &&
    typeof v.h === 'number' &&
    Array.isArray(v.prims)
  );
}

/** Kiểm RUỘT khớp LOẠI — trả thông báo lỗi cụ thể hoặc null nếu hợp lệ. Đây chính là chỗ union
 * trả công: "video không được có geom2d" bị chặn Ở ĐÂY, không phải if rải khắp caller. */
function bodyError(kind: IdfcKind, body: unknown): string | null {
  if (!isPlainObject(body)) return 'File .idfc thiếu phần ruột (body).';
  const expected = BODY_TYPE_OF_KIND[kind];
  if (body.type !== expected) {
    return `File .idfc loại "${kind}" phải mang ruột "${expected}", đang là "${String(body.type)}".`;
  }
  switch (body.type) {
    case 'component':
      if (!isValidGeom2d(body.geom2d)) return 'File .idfc thiếu hoặc hỏng phần hình học 2D.';
      return null;
    case 'material':
      if (!isPlainObject(body.pbr)) return 'File .idfc vật liệu thiếu phần PBR.';
      return null;
    case 'page':
      if (!isPlainObject(body.slide)) return 'File .idfc mẫu trang thiếu phần bố cục (slide).';
      return null;
    case 'video':
      if (!Array.isArray(body.shots)) return 'File .idfc video thiếu danh sách cảnh (shots).';
      return null;
    case 'doc':
      if (!isPlainObject(body.template)) return 'File .idfc văn bản thiếu phần template.';
      return null;
    case 'asset':
      if (typeof body.imageUrl !== 'string' || !body.imageUrl) return 'File .idfc ảnh thiếu đường dẫn ảnh.';
      return null;
    case 'brandkit':
      if (!Array.isArray(body.colors)) return 'File .idfc bộ nhận diện thiếu bảng màu.';
      return null;
    case 'preset':
      if (!isPlainObject(body.params)) return 'File .idfc preset dựng ảnh thiếu phần tham số (params).';
      return null;
    default:
      return 'Ruột .idfc không thuộc loại nào app biết.';
  }
}

/**
 * Đọc chuỗi JSON .idfc → dữ liệu mẫu hoặc `null` nếu hỏng/sai định dạng/mới hơn app hiện tại
 * (KHÔNG throw — an toàn gọi trực tiếp từ UI, đúng hành vi `importIdf`). File v1 tự nâng qua
 * `migrateIdfc` rồi mới validate — một đường validate duy nhất cho mọi version.
 */
export function importIdfc(json: string): ParsedIdfc | null {
  lastImportError = null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    // IDFC-INTEGRITY-001 — TRƯỚC ĐÂY đường này `return null` KHÔNG đặt `lastImportError`. Mọi
    // đường từ chối khác đều có câu chữ; riêng ca hỏng PHỔ BIẾN NHẤT (file cụt, tải dở, sửa tay
    // sai dấu phẩy) là ca DUY NHẤT câm. UI nhận `null` và không có gì để nói với người dùng.
    const chiTiet = e instanceof Error ? e.message : String(e);
    lastImportError = `File .idfc không phải JSON hợp lệ (${chiTiet}). File có thể bị cắt cụt hoặc hỏng khi tải/chép.`;
    return null;
  }
  if (!isPlainObject(parsed)) {
    lastImportError = 'File .idfc phải là một đối tượng JSON — nhận được mảng hoặc giá trị đơn.';
    return null;
  }

  const fileVersion = parsed.idfcVersion;
  if (typeof fileVersion !== 'number') {
    lastImportError = 'File .idfc thiếu số phiên bản (`idfcVersion`) — có thể không phải file .idfc.';
    return null;
  }

  let file: Record<string, unknown> = parsed;
  if (fileVersion !== currentIdfcVersion) {
    if (fileVersion > currentIdfcVersion) {
      lastImportError = 'File .idfc tạo bởi bản IF mới hơn. Cập nhật app để mở được.';
      return null;
    }
    const migrated = migrateIdfc(file, fileVersion);
    if (!migrated) {
      lastImportError = 'Không nâng cấp được file .idfc từ phiên bản cũ này.';
      return null;
    }
    file = migrated as unknown as Record<string, unknown>;
  }

  const rawMeta = isPlainObject(file.meta) ? file.meta : {};
  if (typeof rawMeta.name !== 'string' || typeof rawMeta.code !== 'string') {
    lastImportError = 'File .idfc thiếu tên hoặc mã.';
    return null;
  }
  const kind = rawMeta.kind;
  if (typeof kind !== 'string' || !(IDFC_KINDS as readonly string[]).includes(kind)) {
    lastImportError = `File .idfc mang loại không hợp lệ ("${String(kind)}").`;
    return null;
  }

  const bErr = bodyError(kind as IdfcKind, file.body);
  if (bErr) {
    lastImportError = bErr;
    return null;
  }

  const meta: IdfcMeta = {
    id: typeof rawMeta.id === 'string' ? rawMeta.id : undefined,
    name: rawMeta.name,
    nameEn: typeof rawMeta.nameEn === 'string' ? rawMeta.nameEn : undefined,
    code: rawMeta.code,
    kind: kind as IdfcKind,
    scope: rawMeta.scope === 'chung' || rawMeta.scope === 'studio' || rawMeta.scope === 'du_an' || rawMeta.scope === 'chang' ? rawMeta.scope : undefined,
    tags: Array.isArray(rawMeta.tags) ? (rawMeta.tags as unknown[]).filter((t): t is string => typeof t === 'string') : undefined,
    room: typeof rawMeta.room === 'string' ? rawMeta.room : undefined,
    author: typeof rawMeta.author === 'string' ? rawMeta.author : undefined,
    createdAt: typeof rawMeta.createdAt === 'string' ? rawMeta.createdAt : new Date().toISOString(),
    modifiedAt: typeof rawMeta.modifiedAt === 'string' ? rawMeta.modifiedAt : new Date().toISOString(),
    appVersion: typeof rawMeta.appVersion === 'string' ? rawMeta.appVersion : 'unknown',
    sourceLibraryId: typeof rawMeta.sourceLibraryId === 'string' ? rawMeta.sourceLibraryId : undefined,
  };
  // ⚙️ IDFC-INTEGRITY-001 — GIỮ khoá lạ thay vì vứt. Gom từ `file` (đã qua migration), không từ
  // `parsed`: migration có thể dời khoá lên/xuống, gom bản trước migration là gom nhầm chỗ.
  //
  // Khoá lạ của `meta`  → giữ TẠI CHỖ trên `meta` (meta luôn được truyền nguyên khối khi xuất).
  // Khoá lạ CẤP GỐC     → giữ TẠI CHỖ trên object trả về (để nơi đọc thấy đúng thứ file có)
  //                        + bản sao trong `meta.x` để sống sót qua nơi gọi bóc tách.
  Object.assign(meta, tuiKhoaLa(rawMeta, KHOA_META_DA_BIET) ?? {});
  const laGoc = tuiKhoaLa(file, KHOA_GOC_DA_BIET);
  if (laGoc) meta.x = laGoc;

  const commerce = isPlainObject(file.commerce) ? (file.commerce as unknown as IdfcCommerce) : undefined;

  return { meta, body: file.body as IdfcBody, commerce, ...(laGoc ?? {}) };
}
