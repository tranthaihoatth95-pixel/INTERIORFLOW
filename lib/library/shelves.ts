// lib/library/shelves.ts — CẤU TRÚC KỆ cho Thư viện sheet (chặng 2 · G4).
//
// Nguồn: `docs/SPEC-STAGE-LIBRARIES.md` (kệ theo chặng · 3 động tác · 4 mức phạm vi) +
// `docs/mocks/mock-if-3chang.html` (vật mẫu — tên kệ, số đếm, mã món chép nguyên văn từ mock).
//
// ✅ 12/08 (`library-data-that`): kệ ĐÃ nối kho thật — món từ DB `LibraryAsset` (qua
// `lib/library/db-items.ts` + `GET /api/library`) trộn với món built-in có tài nguyên thật
// đứng sau (xem `BUILTIN_ITEMS`). Cấu trúc kệ + phạm vi giữ nguyên.
//
// 🔴 SỬA 04/08 (Hoà chê): (1) BỎ bảng `SWATCH` 12 gradient giả — ô xem trước giờ đi theo bậc
// thang quả-cầu / vân-procedural / ảnh-thật, xem `thumb-kinds.ts` + `components/library/ItemThumb`.
// Mỗi món khai `kind` (LOẠI) thay cho một gradient bịa. (2) GỘP vật liệu về MỘT kệ duy nhất
// (kệ chung "Vật liệu ATLAS") — trước đây kệ chặng Dựng ảnh cũng có kệ "Vật liệu" 1449 y hệt,
// cùng một kho hiện hai chỗ, đếm trùng.

import type { ScopeLevel, StageKey } from './types';
import type { ThumbKind } from './thumb-kinds';
import { VAT_LIEU_HAT_GIONG } from '../materials/hat-giong';

/**
 * VIỆC 7b (07/08) → ĐÓNG 12/08 (`library-data-that`): kệ đã nối kho THẬT — món đọc từ DB
 * `LibraryAsset` qua `GET /api/library` (xem `lib/library/db-items.ts`), dữ liệu bịa
 * (`ITEMS_BY_SHELF` cũ) đã gỡ. Cờ giữ lại `false` để không vỡ import (`LibrarySheet.tsx` dùng nó
 * ẩn nhãn "Dữ liệu mẫu") — đừng bật lại trừ khi cố ý quay về mock.
 */
export const LIBRARY_DATA_IS_MOCK = false;

export interface ShelfDef {
  id: string;
  label: [string, string];
  /** Số món trong kho — `null` = CHƯA CÓ SỐ THẬT (mock, xem `LIBRARY_DATA_IS_MOCK`). Trước đây
   * field này bịa số cố định không khớp `ITEMS_BY_SHELF` thật (vd kệ "Ký hiệu · khối" khai 46
   * nhưng mảng mock chỉ có 12 dòng) — thà để trống còn hơn bịa, giao diện hiện "—" thay vì số. */
  count: number | null;
  /**
   * Chấm màu LOẠI kệ — port `docs/mocks/Thư viện.dc.html` màn 01 (cột kệ 214px: mỗi kệ một
   * chấm 10px màu riêng, nhìn là biết đang ở nhóm nào mà không cần đọc chữ).
   * Giá trị LUÔN là tên token CSS, không hex (L4 cấm hex tự chế). Mock dùng đúng 6 màu:
   * --accent · --t2 · --success · --t3 · --k-doc · --warning.
   * ⚠️ Danh mục kệ của mock (Vật liệu · Đồ đạc · Khối ba chiều · Ký hiệu bản vẽ · Mẫu hồ sơ ·
   * Bộ nhận diện) KHÔNG trùng danh mục kệ thật của app (kệ tự lọc theo chặng). Ở đây gán màu
   * theo Ý NGHĨA tương đương, không cố ép 6 kệ cho khớp số lượng của mock.
   */
  dot: string;
}

/** Kệ NHÓM TRÊN — đổi theo chặng đang mở (contextual shelf, SPEC-STAGE-LIBRARIES). */
export const STAGE_SHELVES: Record<StageKey, ShelfDef[]> = {
  cad: [
    { id: 'cad-kyhieu', label: ['Ký hiệu · khối', 'Symbols · blocks'], count: null, dot: 'var(--t3)' },
    { id: 'cad-sheet', label: ['Template bản vẽ', 'Sheet templates'], count: null, dot: 'var(--k-doc)' },
    { id: 'cad-room', label: ['Template phòng', 'Room templates'], count: null, dot: 'var(--k-doc)' },
    { id: 'cad-hatch', label: ['Hatch · vật liệu 2D', 'Hatch · 2D materials'], count: null, dot: 'var(--accent)' },
    { id: 'cad-form', label: ['Form lập luận', 'Reasoning forms'], count: null, dot: 'var(--t2)' },
  ],
  // Không còn kệ "Vật liệu" ở đây — vật liệu chỉ có MỘT chỗ: kệ chung "Vật liệu ATLAS" dưới.
  render: [
    { id: 'render-preset', label: ['Preset dựng ảnh', 'Render presets'], count: null, dot: 'var(--success)' },
    { id: 'render-mood', label: ['Template moodboard', 'Moodboard templates'], count: null, dot: 'var(--k-doc)' },
    { id: 'render-chain', label: ['Chuỗi khối sẵn', 'Prebuilt node chains'], count: null, dot: 'var(--t2)' },
    { id: 'render-form', label: ['Form lập luận', 'Reasoning forms'], count: null, dot: 'var(--t2)' },
  ],
  present: [
    { id: 'present-page', label: ['Mẫu trang', 'Page templates'], count: null, dot: 'var(--k-doc)' },
    { id: 'present-mata3', label: ['Bảng vật liệu A3', 'A3 material board'], count: null, dot: 'var(--accent)' },
    { id: 'present-boq', label: ['Biểu mẫu dự toán', 'BOQ forms'], count: null, dot: 'var(--k-doc)' },
    { id: 'present-doc', label: ['Văn bản song ngữ', 'Bilingual documents'], count: null, dot: 'var(--k-doc)' },
    { id: 'present-video', label: ['Mẫu video', 'Video templates'], count: null, dot: 'var(--t3)' },
  ],
};

/** Kệ NHÓM DƯỚI — kệ CHUNG, luôn có ở mọi chặng (không lặp lại theo chặng). */
export const COMMON_SHELVES: ShelfDef[] = [
  /** VIỆC 1 M-IDFC (07/08) — kệ CẤU KIỆN `.idfc`: kệ DỮ LIỆU THẬT đầu tiên của tấm (đọc
   * `lib/library/idfc-store.ts`, không phải `ITEMS_BY_SHELF` mock — LibrarySheet tự trộn). Nằm
   * ĐẦU danh sách vì là ngăn số 1 của chốt 4 ngăn (Cấu kiện · Vật liệu · Node · Ảnh tham chiếu). */
  { id: 'common-idfc', label: ['Cấu kiện (.idfc)', 'Components (.idfc)'], count: null, dot: 'var(--k-doc)' },
  // NƠI DUY NHẤT của vật liệu trong toàn Thư viện (gộp 04/08).
  { id: 'common-atlas', label: ['Vật liệu ATLAS', 'ATLAS materials'], count: null, dot: 'var(--accent)' },
  // "Bộ nhận diện" — cùng tên VÀ cùng màu chấm (--warning) với kệ thứ 6 của mock.
  { id: 'common-brand', label: ['Bộ nhận diện', 'Brand kits'], count: null, dot: 'var(--warning)' },
  { id: 'common-asset', label: ['Ảnh & tài sản', 'Images & assets'], count: null, dot: 'var(--t2)' },
  { id: 'common-direction', label: ['Định hướng thiết kế', 'Design directions'], count: null, dot: 'var(--accent-warm)' },
  { id: 'common-theme', label: ['Phông · màu · nền', 'Type · color · background'], count: null, dot: 'var(--success)' },
];

/**
 * NHÓM VẬT LIỆU CON — port `docs/mocks/Thư viện.dc.html` màn 01, khối "NHÓM VẬT LIỆU" dưới
 * danh sách kệ (Gỗ tự nhiên · Sơn và vữa · Đá tự nhiên · Vải và da · Kim loại).
 * Nhãn tiếng Việt chép NGUYÊN VĂN từ mock; mỗi nhóm nối vào `ThumbKind` CÓ SẴN của món nên
 * đây là bộ lọc THẬT, không phải nhãn trang trí.
 * ⚠️ Mock chỉ vẽ 5 nhóm nên ở đây đúng 5 — loại `glass` (Kính mờ) KHÔNG có nhóm riêng, vẫn
 * thấy được khi không chọn nhóm nào (mặc định). Không tự thêm nhóm thứ 6 mock không có.
 */
export const MATERIAL_GROUPS: { kind: ThumbKind; label: [string, string] }[] = [
  { kind: 'wood', label: ['Gỗ tự nhiên', 'Natural wood'] },
  { kind: 'paint', label: ['Sơn và vữa', 'Paint & plaster'] },
  { kind: 'stone', label: ['Đá tự nhiên', 'Natural stone'] },
  { kind: 'fabric', label: ['Vải và da', 'Fabric & leather'] },
  { kind: 'metal', label: ['Kim loại', 'Metal'] },
];

/** Kệ nào có khối "Nhóm vật liệu" — chỉ kệ vật liệu, đúng mock (khối nằm ngay dưới kệ đang mở
 *  là "Vật liệu"). Kệ khác không có nhóm con nên khối này ẩn hẳn, không hiện rỗng. */
export const MATERIAL_GROUP_SHELF = 'common-atlas';

/**
 * VIỆC 2 M-IDFC (07/08, Hoà chốt "GỘP THƯ VIỆN VỀ MỘT TẤM") — 4 NGĂN theo LOẠI: Cấu kiện ·
 * Vật liệu · Node · Ảnh tham chiếu. Kệ hiện có xếp vào ngăn qua `BAY_OF_SHELF`; ngăn thứ 5
 * "Mẫu & hồ sơ" là chỗ TẠM cho các kệ template (khung tên/form/mẫu trang…) — chốt 4 ngăn không
 * gọi tên nhóm này, KHÔNG tự bịa cách xếp, chờ Hoà xếp (ghi M-IDFC-OUT). Kệ vẫn tự lọc theo
 * chặng như cũ (SPEC-STAGE-LIBRARIES) — ngăn chỉ là tầng NHÓM hiển thị trong cột kệ.
 */
export type ShelfBay = 'cau-kien' | 'vat-lieu' | 'node' | 'anh' | 'mau';

export const BAYS: { id: ShelfBay; label: [string, string] }[] = [
  { id: 'cau-kien', label: ['Cấu kiện', 'Components'] },
  { id: 'vat-lieu', label: ['Vật liệu', 'Materials'] },
  { id: 'node', label: ['Node', 'Nodes'] },
  { id: 'anh', label: ['Ảnh tham chiếu', 'Reference images'] },
  { id: 'mau', label: ['Mẫu & hồ sơ', 'Templates & documents'] },
];

export const BAY_OF_SHELF: Record<string, ShelfBay> = {
  'common-idfc': 'cau-kien', 'cad-kyhieu': 'cau-kien', 'cad-room': 'cau-kien', 'cad-clusters': 'cau-kien',
  'common-atlas': 'vat-lieu', 'cad-hatch': 'vat-lieu',
  'render-chain': 'node', 'render-preset': 'node',
  'common-asset': 'anh', 'render-mood': 'anh',
  'cad-sheet': 'mau', 'cad-form': 'mau', 'render-form': 'mau',
  'present-page': 'mau', 'present-mata3': 'mau', 'present-boq': 'mau', 'present-doc': 'mau', 'present-video': 'mau',
  'common-brand': 'mau', 'common-direction': 'mau', 'common-theme': 'mau',
};

/** Cơ chế dùng món — SPEC-STAGE-LIBRARIES "3 động tác". */
export type Mechanic = 'keo' | 'ap';

export interface SheetItem {
  id: string;
  shelfId: string;
  /** Tên hiển thị (dòng .a trong mock). */
  name: string;
  /** Mã món, hiện dạng monospace (dòng .b trong mock). */
  code: string;
  /** LOẠI món — quyết định ô xem trước (quả cầu / vân procedural / icon). */
  kind: ThumbKind;
  scope: ScopeLevel;
  mechanic: Mechanic;
  /** Ảnh thật khi ATLAS sync có cột "Ảnh" (bậc cao nhất của ô xem trước) — chưa nối. */
  imageUrl?: string;
  /** Dùng gần đây — cho chip "Gần đây". */
  recent?: boolean;
  /**
   * 05/09 — con trỏ tới KHỐI 3D XEM ĐƯỢC của món, đọc từ kho (tag `mo3d:<id biểu diễn>`) chứ
   * không suy từ tên. Trước đó tấm Thư viện nhận ra món-có-3D bằng một bảng regex TÊN gõ cứng
   * (`object-3d-models.ts`), nên món thứ hai không bao giờ hiện được. Vắng mặt = món không có khối.
   */
  model3d?: { glbUrl: string; mtlUrl?: string };
}

type Row = [name: string, code: string, kind: ThumbKind];

/**
 * 12/08 (`library-data-that`) — DỌN MOCK: bảng `ITEMS_BY_SHELF` cũ bịa món cho ~20 kệ (vật liệu
 * OAK-NT-190, mẫu trang COVER-FULL… không có gì đứng sau). Nay chỉ giữ kệ có TÀI NGUYÊN THẬT
 * trong app đứng sau từng dòng:
 *   · `cad-kyhieu` — mỗi dòng resolve ra `BlockDef`/block .dxf thật (`lib/cad/block-library.ts`,
 *     `public/cad-library/manifest.json`; test canh: `lib/cad/library-item-resolve.test.ts` [5]).
 * Mọi kệ khác đọc kho THẬT: DB `LibraryAsset` qua `lib/library/db-items.ts` (tham số `dbItems`
 * của `itemsFor`), kệ `.idfc` đọc `idfc-store`. Kho rỗng → UI hiện empty-state có nút nhập,
 * KHÔNG bịa món cho đầy kệ.
 */
/**
 * ⚡ 04/09 — CẮM ĐIỆN TẦNG HẠT GIỐNG VÀO KỆ VẬT LIỆU. Kệ `common-atlas` trước lượt này chỉ đọc
 * `LibraryAsset` từ DB ⇒ **máy sạch mở kệ ra là rỗng**, dù repo đã ship sẵn vật liệu render được.
 * Dòng dưới SINH TỪ `VAT_LIEU_HAT_GIONG` chứ không chép tay tên/mã — chép tay là đẻ nguồn thứ
 * hai, và nó sẽ lệch ngay lần đầu ai đó thêm một vật liệu.
 *
 * `code` = mã nghề (`v.code`), KHÔNG phải `matId`: cột mã trên thẻ là thứ người dùng đọc và gõ
 * khi tìm; danh tính máy vẫn là UUID, sống ở `lib/materials/hat-giong.ts`.
 *
 * `ThumbKind` suy từ `hoPbr` — họ vật liệu đã khai sẵn ở tầng hạt giống, không đoán lại từ tên.
 */
const THUMB_THEO_HO_PBR: Record<string, ThumbKind> = {
  go: 'wood', da: 'stone', kimloai: 'metal', son: 'paint', vai: 'fabric', kinh: 'glass',
};

function hangVatLieuHatGiong(): Row[] {
  return VAT_LIEU_HAT_GIONG.map((v) => [v.name, v.code, THUMB_THEO_HO_PBR[v.hoPbr] ?? 'paint'] as Row);
}

const BUILTIN_ITEMS: Record<string, Row[]> = {
  'common-atlas': hangVatLieuHatGiong(),
  'cad-kyhieu': [
    ['Cửa 1 cánh 800', 'DOOR-S-800', 'block'], ['Cửa 2 cánh 1600', 'DOOR-D-1600', 'block'],
    ['Cửa sổ trượt', 'WIN-SL-1800', 'block'], ['Sofa 3 chỗ', 'SOFA-3S', 'furniture'],
    ['Bàn ăn 6 ghế', 'TBL-D6', 'furniture'], ['Giường 1m6', 'BED-160', 'furniture'],
    ['Bồn cầu treo', 'WC-WH', 'sanitary'], ['Lavabo bàn đá', 'LAV-CT', 'sanitary'],
    ['Bếp chữ L', 'KIT-L', 'furniture'], ['Tủ áo 2m4', 'WRD-240', 'furniture'],
    ['Người · tỉ lệ', 'SCALE-H', 'misc'], ['Cây trong nhà', 'PLANT-M', 'misc'],
  ],
};

/** Kệ mặc định mỗi chặng — chặng Dựng ảnh đổi sang Preset sau khi gộp kệ vật liệu. */
export const DEFAULT_SHELF: Record<StageKey, string> = {
  cad: 'cad-kyhieu',
  render: 'render-preset',
  present: 'present-page',
};

/** Vật liệu/preset/hatch = ÁP lên vật đang chọn; còn lại = KÉO ra bàn làm việc. */
const APPLY_SHELVES = new Set(['cad-hatch', 'render-preset', 'common-atlas', 'common-theme']);

/** Cơ chế dùng của 1 kệ — export cho `db-items.ts` gán đúng cơ chế cho món từ DB. */
export function mechanicOfShelf(shelfId: string): Mechanic {
  return APPLY_SHELVES.has(shelfId) ? 'ap' : 'keo';
}

function itemsForShelf(shelfId: string): SheetItem[] {
  const mech = mechanicOfShelf(shelfId);
  // Món built-in đi kèm app ⇒ phạm vi CHUNG thật (mọi studio đều có), không còn xoay vòng phạm vi
  // trang trí như bản mock; `recent` bỏ — "gần đây" chỉ có nghĩa với kho thật có lịch sử dùng.
  return (BUILTIN_ITEMS[shelfId] ?? []).map(([name, code, kind]) => ({
    id: `${shelfId}-${code}`,
    shelfId,
    name,
    code,
    kind,
    scope: 'chung',
    mechanic: mech,
  }));
}

/** Số món built-in của 1 kệ — cộng với số món DB để ra số đếm THẬT trên cột kệ. */
export function builtinCount(shelfId: string): number {
  return (BUILTIN_ITEMS[shelfId] ?? []).length;
}

/** Mọi kệ của 1 chặng (nhóm trên + kệ chung). */
export function shelvesForStage(stage: StageKey): { stage: ShelfDef[]; common: ShelfDef[] } {
  return { stage: STAGE_SHELVES[stage], common: COMMON_SHELVES };
}

export type ScopeChip = 'all' | ScopeLevel | 'recent';

/** Món của 1 kệ, đã lọc theo chip phạm vi + từ khoá tìm (+ nhóm vật liệu con nếu có chọn).
 *  `group` để trống = không lọc theo nhóm — giữ nguyên hành vi cũ cho mọi nơi gọi 4 tham số.
 *  `dbItems` (12/08, `library-data-that`) = món từ kho THẬT `LibraryAsset` (đã map ở
 *  `db-items.ts`, mang `shelfId` sẵn) — trộn sau món built-in, cùng một đường lọc. */
export function itemsFor(
  stage: StageKey,
  shelfId: string,
  chip: ScopeChip,
  query = '',
  group: ThumbKind | null = null,
  dbItems: SheetItem[] = [],
): SheetItem[] {
  let out = [...itemsForShelf(shelfId), ...dbItems.filter((i) => i.shelfId === shelfId)];
  if (chip === 'recent') out = out.filter((i) => i.recent);
  else if (chip !== 'all') out = out.filter((i) => i.scope === chip);
  if (group) out = out.filter((i) => i.kind === group);
  const q = query.trim().toLowerCase();
  if (q) out = out.filter((i) => i.name.toLowerCase().includes(q) || i.code.toLowerCase().includes(q));
  return out;
}

/** Nhãn chip theo đúng thứ tự mock: Tất cả · Chung · Studio · Chặng này · Dự án này · Gần đây. */
export const SCOPE_CHIPS: { id: ScopeChip; label: [string, string] }[] = [
  { id: 'all', label: ['Tất cả', 'All'] },
  { id: 'chung', label: ['Chung', 'Shared'] },
  { id: 'studio', label: ['Studio', 'Studio'] },
  { id: 'chang', label: ['Chặng này', 'This stage'] },
  { id: 'du_an', label: ['Dự án này', 'This project'] },
  { id: 'recent', label: ['Gần đây', 'Recent'] },
];

/** Chữ trên badge góc thumbnail — mock viết HOA. */
export const SCOPE_BADGE_TEXT: Record<ScopeLevel, string> = {
  chung: 'CHUNG',
  studio: 'STUDIO',
  chang: 'CHẶNG',
  du_an: 'DỰ ÁN',
};
