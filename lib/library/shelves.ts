// lib/library/shelves.ts — CẤU TRÚC KỆ cho Thư viện sheet (chặng 2 · G4).
//
// Nguồn: `docs/SPEC-STAGE-LIBRARIES.md` (kệ theo chặng · 3 động tác · 4 mức phạm vi) +
// `docs/mocks/mock-if-3chang.html` (vật mẫu — tên kệ, số đếm, mã món, gradient thumbnail
// đều CHÉP NGUYÊN VĂN từ mock, không tự chế).
//
// ⚠️ DỮ LIỆU MOCK: số đếm trên kệ (46/12/9/31/6…) và danh sách món là dữ liệu vật mẫu, CHƯA nối
// kho thật (`/api/library`, ATLAS matId). Khi nối backend thì thay `SHEET_ITEMS`/`count` bằng
// truy vấn thật — cấu trúc kệ + phạm vi giữ nguyên.

import type { ScopeLevel, StageKey } from './types';

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
  render: [
    { id: 'render-mat', label: ['Vật liệu', 'Materials'], count: 1449 },
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
  { id: 'common-atlas', label: ['Vật liệu ATLAS', 'ATLAS materials'], count: 1449 },
  { id: 'common-brand', label: ['Bộ nhận diện', 'Brand kits'], count: 3 },
  { id: 'common-asset', label: ['Ảnh & tài sản', 'Images & assets'], count: 218 },
  { id: 'common-theme', label: ['Phông · màu · nền', 'Type · color · background'], count: 14 },
];

/** Gradient thumbnail — CHÉP NGUYÊN VĂN bảng `TH` của mock (trang trí, không theo theme). */
export const SWATCH: Record<string, string> = {
  wall: 'linear-gradient(140deg,#3a3a43,#22222a)',
  furn: 'linear-gradient(140deg,#5c4b38,#33291f)',
  san: 'linear-gradient(140deg,#3d4a52,#232b31)',
  misc: 'linear-gradient(140deg,#2f4034,#1d281f)',
  w: 'linear-gradient(140deg,#c9a27a,#8a6a44)',
  s: 'linear-gradient(140deg,#e6e2da,#a9a49a)',
  p: 'linear-gradient(140deg,#efeae0,#c8c2b6)',
  f: 'linear-gradient(140deg,#b8a88f,#7d7160)',
  m: 'linear-gradient(140deg,#b08d5a,#6b5432)',
  g: 'linear-gradient(140deg,#9fb4bd,#5f727a)',
  c: 'linear-gradient(140deg,#4a4550,#26232b)',
  n: 'linear-gradient(140deg,#5b5560,#312e38)',
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
  swatch: keyof typeof SWATCH;
  scope: ScopeLevel;
  mechanic: Mechanic;
  /** Dùng gần đây — cho chip "Gần đây". */
  recent?: boolean;
}

// Phạm vi lặp CHUNG→STUDIO→DỰ ÁN→CHẶNG đúng công thức `SCOPE[n%4]` của mock, để bản port giống
// hệt vật mẫu ở trạng thái mặc định.
const SCOPE_CYCLE: ScopeLevel[] = ['chung', 'studio', 'du_an', 'chang'];
const scopeAt = (n: number): ScopeLevel => SCOPE_CYCLE[n % 4];

function build(shelfId: string, rows: [string, string, string][], startIdx = 0, mechanic: Mechanic = 'keo'): SheetItem[] {
  return rows.map((r, i) => ({
    id: `${shelfId}-${r[1]}`,
    shelfId,
    name: r[0],
    code: r[1],
    swatch: r[2] as keyof typeof SWATCH,
    scope: scopeAt(startIdx + i),
    mechanic,
    recent: (startIdx + i) % 5 === 0,
  }));
}

/** 12 món/chặng của kệ MẶC ĐỊNH — chép nguyên văn bảng `DATA` trong mock. */
const DEFAULT_ITEMS: Record<StageKey, [string, string, string][]> = {
  cad: [
    ['Cửa 1 cánh 800', 'DOOR-S-800', 'wall'], ['Cửa 2 cánh 1600', 'DOOR-D-1600', 'wall'],
    ['Cửa sổ trượt', 'WIN-SL-1800', 'wall'], ['Sofa 3 chỗ', 'SOFA-3S', 'furn'],
    ['Bàn ăn 6 ghế', 'TBL-D6', 'furn'], ['Giường 1m6', 'BED-160', 'furn'],
    ['Bồn cầu treo', 'WC-WH', 'san'], ['Lavabo bàn đá', 'LAV-CT', 'san'],
    ['Bếp chữ L', 'KIT-L', 'furn'], ['Tủ áo 2m4', 'WRD-240', 'furn'],
    ['Người · tỉ lệ', 'SCALE-H', 'misc'], ['Cây trong nhà', 'PLANT-M', 'misc'],
  ],
  render: [
    ['Gỗ sồi tự nhiên', 'OAK-NT-190', 'w'], ['Gỗ óc chó', 'WAL-DK-150', 'w'],
    ['Đá Calacatta', 'MRB-CAL', 's'], ['Đá đen Marquina', 'MRB-MQ', 's'],
    ['Sơn trắng ngà', 'PNT-IV', 'p'], ['Sơn xám khói', 'PNT-SM', 'p'],
    ['Vải lanh be', 'FAB-LIN-BE', 'f'], ['Vải nhung xanh rêu', 'FAB-VEL-GR', 'f'],
    ['Gạch terrazzo', 'TRZ-WH', 's'], ['Đồng thau xước', 'BRS-BR', 'm'],
    ['Thép sơn đen', 'STL-BK', 'm'], ['Kính mờ', 'GLS-FR', 'g'],
  ],
  present: [
    ['Bìa · ảnh tràn', 'COVER-FULL', 'c'], ['Bìa · chia đôi', 'COVER-SPLIT', 'c'],
    ['Mục lục 2 cột', 'TOC-2C', 'c'], ['Concept · 1 ảnh lớn', 'CPT-HERO', 'n'],
    ['Concept · lưới 4', 'CPT-G4', 'n'], ['Mặt bằng + chú thích', 'PLAN-ANNO', 'n'],
    ['Phối cảnh đôi', 'PSP-DUO', 'n'], ['Bảng vật liệu A3', 'MAT-A3', 'm'],
    ['Trước · sau', 'BA-COMPARE', 'n'], ['Bảng khối lượng', 'BOQ-STD', 'm'],
    ['Trang kết', 'END-CARD', 'c'], ['Thông tin liên hệ', 'CONTACT', 'c'],
  ],
};

/** Kệ mặc định mỗi chặng — đúng nút `.shrow.on` trong mock. */
export const DEFAULT_SHELF: Record<StageKey, string> = {
  cad: 'cad-kyhieu',
  render: 'render-mat',
  present: 'present-page',
};

// Món cho các kệ CÒN LẠI — ít hơn, đủ để bấm vào kệ không thấy trống. Mock chỉ vẽ kệ mặc định
// nên phần này KHÔNG có vật mẫu để chép; đặt tên theo đúng nghĩa từng kệ, đánh dấu rõ là mock.
const EXTRA: Record<string, [string, string, string][]> = {
  'cad-sheet': [['Khung tên A1', 'TB-A1', 'misc'], ['Khung tên A3', 'TB-A3', 'misc'], ['Bố cục 4 view', 'LAY-4V', 'misc']],
  'cad-room': [['Bếp chữ L', 'RM-KIT-L', 'furn'], ['WC 3m²', 'RM-WC-3', 'san'], ['Phòng ngủ master', 'RM-BED-M', 'furn']],
  'cad-hatch': [['Gạch 600×600', 'HT-TIL-600', 's'], ['Sàn gỗ', 'HT-WOOD', 'w'], ['Đá granite', 'HT-GRN', 's']],
  'cad-form': [['Dây chuyền công năng', 'FRM-FLOW', 'misc'], ['Sơ đồ bong bóng', 'FRM-BUBBLE', 'misc']],
  'render-preset': [['Nắng chiều', 'PRE-GOLD', 'p'], ['Trời phủ mây', 'PRE-OVC', 'p'], ['Đèn đêm', 'PRE-NIGHT', 'p']],
  'render-mood': [['Board theo phòng', 'MB-ROOM', 'f'], ['Board 9 ô A3', 'MB-A3-9', 'f']],
  'render-chain': [['Sketch→Render→Upscale', 'CH-SRU', 'm'], ['Ảnh→Đổi góc', 'CH-RECAM', 'm']],
  'render-form': [['Khung concept 5 nhánh', 'FRM-C5', 'n'], ['So sánh phương án', 'FRM-CMP', 'n'], ['6 chiếc mũ', 'FRM-6H', 'n']],
  'present-mata3': [['Lưới 9 ô', 'MB-9', 'm'], ['Lưới 6 ô + chú thích', 'MB-6N', 'm']],
  'present-boq': [['Dự toán cơ bản', 'BOQ-BASE', 'm'], ['Dự toán live-link CAD', 'BOQ-LIVE', 'm']],
  'present-doc': [['Thuyết minh song ngữ', 'DOC-BRIEF', 'c'], ['Hợp đồng mẫu', 'DOC-CTR', 'c']],
  'present-video': [['Timeline intro/outro', 'VID-IO', 'n'], ['Nhịp cắt theo nhạc', 'VID-BEAT', 'n']],
  'common-atlas': [['Gỗ óc chó W-102', 'W-102', 'w'], ['Travertine S-044', 'S-044', 's'], ['Sơn xanh rêu P-070', 'P-070', 'p']],
  'common-brand': [['Bộ nhận diện dự án', 'BK-PRJ', 'c'], ['Bộ nhận diện studio', 'BK-STD', 'c']],
  'common-asset': [['Ảnh khảo sát', 'AS-SURVEY', 'g'], ['Ảnh tham chiếu', 'AS-REF', 'g'], ['Texture rời', 'AS-TEX', 'f']],
  'common-theme': [['Cặp phông Editorial', 'TH-EDI', 'c'], ['Bảng màu ấm', 'TH-WARM', 'p'], ['Nền canvas kẻ ô', 'TH-GRID', 'n']],
};

/** Vật liệu/preset/hatch = ÁP lên vật đang chọn; còn lại = KÉO ra bàn làm việc. */
const APPLY_SHELVES = new Set(['render-mat', 'cad-hatch', 'render-preset', 'common-atlas', 'common-theme']);

function itemsForShelf(shelfId: string, stage: StageKey): SheetItem[] {
  const mech: Mechanic = APPLY_SHELVES.has(shelfId) ? 'ap' : 'keo';
  if (shelfId === DEFAULT_SHELF[stage]) return build(shelfId, DEFAULT_ITEMS[stage], 0, mech);
  return build(shelfId, EXTRA[shelfId] ?? [], 3, mech);
}

/** Mọi kệ của 1 chặng (nhóm trên + kệ chung). */
export function shelvesForStage(stage: StageKey): { stage: ShelfDef[]; common: ShelfDef[] } {
  return { stage: STAGE_SHELVES[stage], common: COMMON_SHELVES };
}

export type ScopeChip = 'all' | ScopeLevel | 'recent';

/** Món của 1 kệ, đã lọc theo chip phạm vi + từ khoá tìm. */
export function itemsFor(stage: StageKey, shelfId: string, chip: ScopeChip, query = ''): SheetItem[] {
  let out = itemsForShelf(shelfId, stage);
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
