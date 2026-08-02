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

export interface ShelfDef {
  id: string;
  label: [string, string];
  /** Số món trong kho (mock — xem cảnh báo đầu file). */
  count: number;
}

/** Kệ NHÓM TRÊN — đổi theo chặng đang mở (contextual shelf, SPEC-STAGE-LIBRARIES). */
export const STAGE_SHELVES: Record<StageKey, ShelfDef[]> = {
  cad: [
    { id: 'cad-kyhieu', label: ['Ký hiệu · khối', 'Symbols · blocks'], count: 46 },
    { id: 'cad-sheet', label: ['Template bản vẽ', 'Sheet templates'], count: 12 },
    { id: 'cad-room', label: ['Template phòng', 'Room templates'], count: 9 },
    { id: 'cad-hatch', label: ['Hatch · vật liệu 2D', 'Hatch · 2D materials'], count: 31 },
    { id: 'cad-form', label: ['Form lập luận', 'Reasoning forms'], count: 6 },
  ],
  // Không còn kệ "Vật liệu" ở đây — vật liệu chỉ có MỘT chỗ: kệ chung "Vật liệu ATLAS" dưới.
  render: [
    { id: 'render-preset', label: ['Preset dựng ảnh', 'Render presets'], count: 18 },
    { id: 'render-mood', label: ['Template moodboard', 'Moodboard templates'], count: 7 },
    { id: 'render-chain', label: ['Chuỗi khối sẵn', 'Prebuilt node chains'], count: 5 },
    { id: 'render-form', label: ['Form lập luận', 'Reasoning forms'], count: 6 },
  ],
  present: [
    { id: 'present-page', label: ['Mẫu trang', 'Page templates'], count: 24 },
    { id: 'present-mata3', label: ['Bảng vật liệu A3', 'A3 material board'], count: 4 },
    { id: 'present-boq', label: ['Biểu mẫu dự toán', 'BOQ forms'], count: 3 },
    { id: 'present-doc', label: ['Văn bản song ngữ', 'Bilingual documents'], count: 6 },
    { id: 'present-video', label: ['Mẫu video', 'Video templates'], count: 2 },
  ],
};

/** Kệ NHÓM DƯỚI — kệ CHUNG, luôn có ở mọi chặng (không lặp lại theo chặng). */
export const COMMON_SHELVES: ShelfDef[] = [
  // NƠI DUY NHẤT của vật liệu trong toàn Thư viện (gộp 04/08).
  { id: 'common-atlas', label: ['Vật liệu ATLAS', 'ATLAS materials'], count: 1449 },
  { id: 'common-brand', label: ['Bộ nhận diện', 'Brand kits'], count: 3 },
  { id: 'common-asset', label: ['Ảnh & tài sản', 'Images & assets'], count: 218 },
  { id: 'common-theme', label: ['Phông · màu · nền', 'Type · color · background'], count: 14 },
];

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
  'render-preset': [
    ['Nắng chiều', 'PRE-GOLD', 'sheet'], ['Trời phủ mây', 'PRE-OVC', 'sheet'], ['Đèn đêm', 'PRE-NIGHT', 'sheet'],
    ['Nắng sớm', 'PRE-DAWN', 'sheet'], ['Studio trắng', 'PRE-STUDIO', 'sheet'],
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
  'present-boq': [['Dự toán cơ bản', 'BOQ-BASE', 'page'], ['Dự toán live-link CAD', 'BOQ-LIVE', 'page']],
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

/** Món của 1 kệ, đã lọc theo chip phạm vi + từ khoá tìm. */
export function itemsFor(stage: StageKey, shelfId: string, chip: ScopeChip, query = ''): SheetItem[] {
  let out = itemsForShelf(shelfId);
  if (chip === 'recent') out = out.filter((i) => i.recent);
  else if (chip !== 'all') out = out.filter((i) => i.scope === chip);
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
