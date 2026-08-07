// lib/library/shelves.ts — CẤU TRÚC KỆ cho Thư viện sheet (chặng 2 · G4).
//
// Nguồn: `docs/SPEC-STAGE-LIBRARIES.md` (kệ theo chặng · 3 động tác · 4 mức phạm vi) +
// `docs/mocks/mock-if-3chang.html` (vật mẫu — tên kệ, số đếm, mã món chép nguyên văn từ mock).
//
// ⚠️ DỮ LIỆU MOCK: số đếm trên kệ (46/12/9/31/18…) và danh sách món là dữ liệu vật mẫu, CHƯA nối
// kho thật (`/api/library`, ATLAS matId). Khi nối backend thì thay `ITEMS_BY_SHELF`/`count` bằng
// truy vấn thật — cấu trúc kệ + phạm vi giữ nguyên.
//
// 🔴 SỬA 04/08 (Hoà chê): (1) BỎ bảng `SWATCH` 12 gradient giả — ô xem trước giờ đi theo bậc
// thang quả-cầu / vân-procedural / ảnh-thật, xem `thumb-kinds.ts` + `components/library/ItemThumb`.
// Mỗi món khai `kind` (LOẠI) thay cho một gradient bịa. (2) GỘP vật liệu về MỘT kệ duy nhất
// (kệ chung "Vật liệu ATLAS") — trước đây kệ chặng Dựng ảnh cũng có kệ "Vật liệu" 1449 y hệt,
// cùng một kho hiện hai chỗ, đếm trùng.

import type { ScopeLevel, StageKey } from './types';
import type { ThumbKind } from './thumb-kinds';

/**
 * VIỆC 7b (07/08, Hoà giao giữa phiên) — trước đây `count` bịa số (1449/46/12…) và giao diện bày
 * y như hàng thật, không cách nào người dùng biết đây là dữ liệu mẫu. Cờ này là NGUỒN DUY NHẤT
 * quyết định UI có hiện nhãn "Dữ liệu mẫu" hay không (`LibrarySheet.tsx`) — khi nối `/api/library`
 * thật thì đổi ĐÚNG MỘT chỗ này thành `false`, không phải sửa rải rác nhiều component.
 */
export const LIBRARY_DATA_IS_MOCK = true;

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
  'common-brand': 'mau', 'common-theme': 'mau',
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
}

// Phạm vi lặp CHUNG→STUDIO→DỰ ÁN→CHẶNG đúng công thức `SCOPE[n%4]` của mock. Mỗi kệ lệch pha một
// chút (theo mã kệ) để lưới không rập khuôn y hệt nhau — thuần trang trí dữ liệu mock.
const SCOPE_CYCLE: ScopeLevel[] = ['chung', 'studio', 'du_an', 'chang'];
const shelfPhase = (shelfId: string) => [...shelfId].reduce((s, c) => s + c.charCodeAt(0), 0) % 4;

type Row = [name: string, code: string, kind: ThumbKind];

/** Món theo từng kệ. Kệ mặc định của mỗi chặng chép nguyên văn bảng `DATA` của mock; các kệ còn
 * lại mock không vẽ nên đặt tên theo đúng nghĩa kệ (đánh dấu rõ là mock ở đầu file). */
const ITEMS_BY_SHELF: Record<string, Row[]> = {
  // ── chặng Vẽ ─────────────────────────────────────────────────────────────────
  'cad-kyhieu': [
    ['Cửa 1 cánh 800', 'DOOR-S-800', 'block'], ['Cửa 2 cánh 1600', 'DOOR-D-1600', 'block'],
    ['Cửa sổ trượt', 'WIN-SL-1800', 'block'], ['Sofa 3 chỗ', 'SOFA-3S', 'furniture'],
    ['Bàn ăn 6 ghế', 'TBL-D6', 'furniture'], ['Giường 1m6', 'BED-160', 'furniture'],
    ['Bồn cầu treo', 'WC-WH', 'sanitary'], ['Lavabo bàn đá', 'LAV-CT', 'sanitary'],
    ['Bếp chữ L', 'KIT-L', 'furniture'], ['Tủ áo 2m4', 'WRD-240', 'furniture'],
    ['Người · tỉ lệ', 'SCALE-H', 'misc'], ['Cây trong nhà', 'PLANT-M', 'misc'],
  ],
  'cad-sheet': [['Khung tên A1', 'TB-A1', 'sheet'], ['Khung tên A3', 'TB-A3', 'sheet'], ['Bố cục 4 view', 'LAY-4V', 'sheet']],
  'cad-room': [['Bếp chữ L', 'RM-KIT-L', 'furniture'], ['WC 3m²', 'RM-WC-3', 'sanitary'], ['Phòng ngủ master', 'RM-BED-M', 'furniture']],
  // hatch = vật liệu 2D: GIỮ vân phẳng, không lên quả cầu (SPEC-VAT-LIEU §2, xem ItemThumb).
  'cad-hatch': [['Gạch 600×600', 'HT-TIL-600', 'stone'], ['Sàn gỗ', 'HT-WOOD', 'wood'], ['Đá granite', 'HT-GRN', 'stone']],
  'cad-form': [['Dây chuyền công năng', 'FRM-FLOW', 'page'], ['Sơ đồ bong bóng', 'FRM-BUBBLE', 'page']],

  // ── chặng Dựng ảnh (không còn kệ vật liệu — xem kệ chung) ────────────────────
  // VIỆC 7b (07/08) — mỗi preset ánh sáng mang ĐÚNG `kind` của nó (trước dùng chung 'sheet' nên
  // 3 ánh sáng đối lập vẽ ra 1 khung xám y hệt, xem `thumb-kinds.ts` đầu file phần 'light-*').
  'render-preset': [
    ['Nắng chiều', 'PRE-GOLD', 'light-gold'], ['Trời phủ mây', 'PRE-OVC', 'light-overcast'], ['Đèn đêm', 'PRE-NIGHT', 'light-night'],
    ['Nắng sớm', 'PRE-DAWN', 'light-dawn'], ['Studio trắng', 'PRE-STUDIO', 'light-studio'],
  ],
  'render-mood': [['Board theo phòng', 'MB-ROOM', 'sheet'], ['Board 9 ô A3', 'MB-A3-9', 'sheet']],
  'render-chain': [['Sketch→Render→Upscale', 'CH-SRU', 'block'], ['Ảnh→Đổi góc', 'CH-RECAM', 'block']],
  'render-form': [['Khung concept 5 nhánh', 'FRM-C5', 'page'], ['So sánh phương án', 'FRM-CMP', 'page'], ['6 chiếc mũ', 'FRM-6H', 'page']],

  // ── chặng Trình bày ──────────────────────────────────────────────────────────
  'present-page': [
    ['Bìa · ảnh tràn', 'COVER-FULL', 'page'], ['Bìa · chia đôi', 'COVER-SPLIT', 'page'],
    ['Mục lục 2 cột', 'TOC-2C', 'page'], ['Concept · 1 ảnh lớn', 'CPT-HERO', 'sheet'],
    ['Concept · lưới 4', 'CPT-G4', 'sheet'], ['Mặt bằng + chú thích', 'PLAN-ANNO', 'sheet'],
    ['Phối cảnh đôi', 'PSP-DUO', 'sheet'], ['Bảng vật liệu A3', 'MAT-A3', 'sheet'],
    ['Trước · sau', 'BA-COMPARE', 'sheet'], ['Bảng khối lượng', 'BOQ-STD', 'page'],
    ['Trang kết', 'END-CARD', 'page'], ['Thông tin liên hệ', 'CONTACT', 'page'],
  ],
  'present-mata3': [['Lưới 9 ô', 'MB-9', 'sheet'], ['Lưới 6 ô + chú thích', 'MB-6N', 'sheet']],
  'present-boq': [['Dự toán cơ bản', 'BOQ-BASE', 'page'], ['Dự toán live-link Thiết kế 2D', 'BOQ-LIVE', 'page']],
  'present-doc': [['Thuyết minh song ngữ', 'DOC-BRIEF', 'page'], ['Hợp đồng mẫu', 'DOC-CTR', 'page']],
  'present-video': [['Timeline intro/outro', 'VID-IO', 'sheet'], ['Nhịp cắt theo nhạc', 'VID-BEAT', 'sheet']],

  // ── kệ CHUNG ─────────────────────────────────────────────────────────────────
  // 12 món vật liệu (trước ở kệ "Vật liệu" của chặng Dựng ảnh) nay về đúng MỘT chỗ này.
  'common-atlas': [
    ['Gỗ sồi tự nhiên', 'OAK-NT-190', 'wood'], ['Gỗ óc chó', 'WAL-DK-150', 'wood'],
    ['Đá Calacatta', 'MRB-CAL', 'stone'], ['Đá đen Marquina', 'MRB-MQ', 'stone'],
    ['Sơn trắng ngà', 'PNT-IV', 'paint'], ['Sơn xám khói', 'PNT-SM', 'paint'],
    ['Vải lanh be', 'FAB-LIN-BE', 'fabric'], ['Vải nhung xanh rêu', 'FAB-VEL-GR', 'fabric'],
    ['Gạch terrazzo', 'TRZ-WH', 'stone'], ['Đồng thau xước', 'BRS-BR', 'metal'],
    ['Thép sơn đen', 'STL-BK', 'metal'], ['Kính mờ', 'GLS-FR', 'glass'],
  ],
  'common-brand': [['Bộ nhận diện dự án', 'BK-PRJ', 'page'], ['Bộ nhận diện studio', 'BK-STD', 'page']],
  'common-asset': [['Ảnh khảo sát', 'AS-SURVEY', 'sheet'], ['Ảnh tham chiếu', 'AS-REF', 'sheet'], ['Texture rời', 'AS-TEX', 'fabric']],
  'common-theme': [['Cặp phông Editorial', 'TH-EDI', 'page'], ['Bảng màu ấm', 'TH-WARM', 'paint'], ['Nền canvas kẻ ô', 'TH-GRID', 'block']],
};

/** Kệ mặc định mỗi chặng — chặng Dựng ảnh đổi sang Preset sau khi gộp kệ vật liệu. */
export const DEFAULT_SHELF: Record<StageKey, string> = {
  cad: 'cad-kyhieu',
  render: 'render-preset',
  present: 'present-page',
};

/** Vật liệu/preset/hatch = ÁP lên vật đang chọn; còn lại = KÉO ra bàn làm việc. */
const APPLY_SHELVES = new Set(['cad-hatch', 'render-preset', 'common-atlas', 'common-theme']);

function itemsForShelf(shelfId: string): SheetItem[] {
  const mech: Mechanic = APPLY_SHELVES.has(shelfId) ? 'ap' : 'keo';
  const phase = shelfPhase(shelfId);
  return (ITEMS_BY_SHELF[shelfId] ?? []).map(([name, code, kind], i) => ({
    id: `${shelfId}-${code}`,
    shelfId,
    name,
    code,
    kind,
    scope: SCOPE_CYCLE[(phase + i) % 4],
    mechanic: mech,
    recent: (phase + i) % 5 === 0,
  }));
}

/** Mọi kệ của 1 chặng (nhóm trên + kệ chung). */
export function shelvesForStage(stage: StageKey): { stage: ShelfDef[]; common: ShelfDef[] } {
  return { stage: STAGE_SHELVES[stage], common: COMMON_SHELVES };
}

export type ScopeChip = 'all' | ScopeLevel | 'recent';

/** Món của 1 kệ, đã lọc theo chip phạm vi + từ khoá tìm (+ nhóm vật liệu con nếu có chọn).
 *  `group` để trống = không lọc theo nhóm — giữ nguyên hành vi cũ cho mọi nơi gọi 4 tham số. */
export function itemsFor(
  stage: StageKey,
  shelfId: string,
  chip: ScopeChip,
  query = '',
  group: ThumbKind | null = null,
): SheetItem[] {
  let out = itemsForShelf(shelfId);
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
