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
 *               v3 khi có nơi tiêu thụ — ràng buộc 3 bên dưới).
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
import type { BlockGroup, ShapeVariant, SnapAnchor, ClearanceZone } from './shared-types';
import type { MaterialPbr } from '../materials/schema';

export const IDFC_VERSION = 2 as const;
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

/** 11 loại chốt 11.4 — 6 loại đầu là cách hồ sơ nội thất CHIA THẦU (mỗi loại một nhà thầu, một
 * dòng hợp đồng); 5 loại sau là mẫu & hồ sơ. `lighting` cũ (v1) GỘP vào `fixture` (đèn = thiết bị
 * cố định, thầu M&E) — migration v1→v2 tự đổi. */
export type IdfcKind =
  | 'material' | 'furniture' | 'millwork' | 'fitout' | 'fixture' | 'soft'
  | 'page' | 'video' | 'doc' | 'asset' | 'brandkit';

export const IDFC_KINDS: readonly IdfcKind[] = [
  'material', 'furniture', 'millwork', 'fitout', 'fixture', 'soft',
  'page', 'video', 'doc', 'asset', 'brandkit',
];

/** Loại BÁN ĐƯỢC — chỉ những loại này được mang `commerce` (chốt 11.2 "giá, chỉ loại nào bán
 * được"). importIdfc KHÔNG drop commerce của loại khác (dữ liệu người dùng không tự mất) nhưng
 * UI/BOQ chỉ đọc giá của các loại này. */
export const SELLABLE_KINDS: readonly IdfcKind[] = ['material', 'furniture', 'millwork', 'fitout', 'fixture', 'soft'];

/** Ruột nào cho loại nào — 5 loại cấu-kiện-vật-lý chung ruột 'component'. */
export const BODY_TYPE_OF_KIND: Record<IdfcKind, IdfcBody['type']> = {
  material: 'material',
  furniture: 'component', millwork: 'component', fitout: 'component', fixture: 'component', soft: 'component',
  page: 'page', video: 'video', doc: 'doc', asset: 'asset', brandkit: 'brandkit',
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
 * hệt cách `cad-to-obj.ts` đùn tường. `matId` (= ProductSpec.sku) ưu tiên; `pbr` nhúng chỉ khi
 * cấu kiện chưa có matId trong kho chung. */
export interface IdfcGeom3d {
  heightMm?: number;
  bevelMm?: number;
  matId?: string;
  pbr?: MaterialPbr;
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
 * Mở rộng shape chi tiết = migration v3 khi nối nơi tiêu thụ thật — KHÔNG đoán trước schema.
 */
export type IdfcBody =
  | { type: 'component'; geom2d: IdfcGeom2d; geom3d?: IdfcGeom3d; params?: ShapeVariant[] }
  | {
      type: 'material';
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
  | { type: 'brandkit'; logoUrl?: string; colors: string[]; fonts?: string[] };

/** ③ mặt Trình chiếu/thương mại — khuôn con `ProductSpec`. V2 BỎ `kind` (đã lên `meta.kind` —
 * một sự thật một chỗ); `priceVnd` để `number` (JSON không có Decimal — tầng ghi DB tự đổi). */
export interface IdfcCommerce {
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
}

export interface ParsedIdfc {
  meta: IdfcMeta;
  body: IdfcBody;
  commerce?: IdfcCommerce;
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
 * Bảng nâng cấp — mỗi khoá `fromV` nâng ĐÚNG 1 bậc, cùng khuôn `IDF_MIGRATIONS` (idf.ts).
 */
const IDFC_MIGRATIONS: Record<number, (f: Record<string, unknown>) => Record<string, unknown>> = {
  1: migrateV1ToV2,
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
}): string {
  const now = new Date().toISOString();
  const file: IdfcFile = {
    idfcVersion: IDFC_VERSION,
    meta: {
      ...input.meta,
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
  return JSON.stringify(file);
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
  } catch {
    return null;
  }
  if (!isPlainObject(parsed)) return null;

  const fileVersion = parsed.idfcVersion;
  if (typeof fileVersion !== 'number') return null;

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
  const commerce = isPlainObject(file.commerce) ? (file.commerce as unknown as IdfcCommerce) : undefined;

  return { meta, body: file.body as IdfcBody, commerce };
}
