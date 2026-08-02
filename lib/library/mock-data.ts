// lib/library/mock-data.ts — dữ liệu mock cục bộ cho Kệ Thư viện (chưa DB, chưa Prisma).
// Nội dung theo docs/mocks/library-mock-note.md (Render = ví dụ chi tiết Hoà đã duyệt) +
// docs/SPEC-STAGE-LIBRARIES.md (bảng kệ CAD/Present). Tên người đăng/dữ liệu đều hư cấu,
// trung tính — không gắn thương hiệu studio nào (LUẬT NỀN TẢNG, CLAUDE.md).

import type { LibraryShelf, StageKey } from './types';

// Màu loại (node) mượn từ SPEC-DESIGN-SYSTEM-IF §1 — chỉ dùng làm cặp gradient thumbnail,
// không phải token trạng thái.
const C = {
  mood: '#e8804d',
  master: '#6a57f5',
  ok: '#3fb984',
  logic: '#4a90e2',
  comment: '#e86a9a',
  warn: '#e0a43a',
};

export const LIBRARY_SHELVES: LibraryShelf[] = [
  // ————————————————————————— CAD —————————————————————————
  {
    id: 'cad-sheet',
    stage: 'cad',
    icon: '◧',
    title: 'Template bản vẽ',
    items: [
      { id: 'cad-sheet-1', shelfId: 'cad-sheet', name: 'Khung tên A1 chuẩn TCVN', scope: 'chung', kind: 'Template bản vẽ', author: 'KTS. An', version: 'v1.3', usageCount: 214, description: 'Khung tên khổ A1, tỉ lệ tự co theo tỉ lệ bản vẽ.', thumbnail: [C.logic, C.ok], mechanic: 'keo' },
      { id: 'cad-sheet-2', shelfId: 'cad-sheet', name: 'Khung tên A3', scope: 'chung', kind: 'Template bản vẽ', author: 'KTS. An', version: 'v1.1', usageCount: 176, description: 'Khung tên khổ A3, dùng cho bản in nhanh.', thumbnail: [C.logic, C.ok], mechanic: 'keo' },
      { id: 'cad-sheet-3', shelfId: 'cad-sheet', name: 'Layout A1 nhiều view', scope: 'studio', kind: 'Template bản vẽ', author: 'KTS. Bình', version: 'v2.0', usageCount: 58, description: 'Bố cục sẵn 4 view (bằng/trần/mặt cắt/chi tiết) trên khổ A1.', thumbnail: [C.logic, C.master], mechanic: 'keo' },
      { id: 'cad-sheet-4', shelfId: 'cad-sheet', name: 'Tiêu chuẩn nét TCVN', scope: 'chung', kind: 'Template bản vẽ', author: 'Studio Admin', version: 'v1.0', usageCount: 302, description: 'Bộ nét/lineweight theo TCVN, áp cho layer mới.', thumbnail: [C.logic, C.ok], mechanic: 'ap' },
    ],
  },
  {
    id: 'cad-symbol',
    stage: 'cad',
    icon: '◫',
    title: 'Thư viện ký hiệu',
    items: [
      { id: 'cad-sym-1', shelfId: 'cad-symbol', name: 'Cửa 2 cánh 900', scope: 'chung', kind: 'Ký hiệu 2D', author: 'KTS. An', version: 'v1.0', usageCount: 441, description: 'Block cửa 2 cánh, giữ elementType khi đặt.', thumbnail: [C.ok, C.logic], mechanic: 'keo' },
      { id: 'cad-sym-2', shelfId: 'cad-symbol', name: 'Cửa sổ lùa', scope: 'chung', kind: 'Ký hiệu 2D', author: 'KTS. An', version: 'v1.0', usageCount: 268, description: 'Block cửa sổ lùa 2 cánh.', thumbnail: [C.ok, C.logic], mechanic: 'keo' },
      { id: 'cad-sym-3', shelfId: 'cad-symbol', name: 'TB vệ sinh — bồn cầu', scope: 'chung', kind: 'Ký hiệu 2D', author: 'KTS. Chi', version: 'v1.2', usageCount: 190, description: 'Thiết bị vệ sinh chuẩn, giữ matId khi đặt.', thumbnail: [C.ok, C.logic], mechanic: 'keo' },
      { id: 'cad-sym-4', shelfId: 'cad-symbol', name: 'Block ghế sofa 3 chỗ', scope: 'studio', kind: 'Ký hiệu 2D', author: 'KTS. Bình', version: 'v1.4', usageCount: 87, description: 'Sofa 3 chỗ nhìn bằng, scale chuẩn nội thất.', thumbnail: [C.ok, C.master], mechanic: 'keo' },
      { id: 'cad-sym-5', shelfId: 'cad-symbol', name: 'Người scale 1.7m', scope: 'chung', kind: 'Ký hiệu 2D', author: 'Studio Admin', version: 'v1.0', usageCount: 355, description: 'Hình người đứng, đối chiếu tỉ lệ nhanh.', thumbnail: [C.ok, C.logic], mechanic: 'keo' },
    ],
  },
  {
    id: 'cad-room',
    stage: 'cad',
    icon: '▦',
    title: 'Template phòng',
    items: [
      { id: 'cad-room-1', shelfId: 'cad-room', name: 'Layout bếp chữ L', scope: 'studio', kind: 'Template phòng', author: 'KTS. Bình', version: 'v1.1', usageCount: 63, description: 'Cụm bếp chữ L kèm đảo, layout mẫu.', thumbnail: [C.warn, C.ok], mechanic: 'keo' },
      { id: 'cad-room-2', shelfId: 'cad-room', name: 'Layout WC 3m²', scope: 'chung', kind: 'Template phòng', author: 'KTS. Chi', version: 'v1.0', usageCount: 121, description: 'WC nhỏ, bố trí thiết bị tối ưu 3m².', thumbnail: [C.warn, C.ok], mechanic: 'keo' },
      { id: 'cad-room-3', shelfId: 'cad-room', name: 'Layout phòng ngủ master', scope: 'du_an', kind: 'Template phòng', author: 'KTS. An', version: 'v1.0', usageCount: 9, description: 'Layout riêng cho dự án đang mở.', thumbnail: [C.warn, C.master], mechanic: 'keo' },
    ],
  },
  {
    id: 'cad-hatch',
    stage: 'cad',
    icon: '▨',
    title: 'Hatch / vật liệu 2D',
    items: [
      { id: 'cad-hatch-1', shelfId: 'cad-hatch', name: 'Hatch gạch 600×600', scope: 'chung', kind: 'Hatch 2D', author: 'Studio Admin', version: 'v1.0', usageCount: 288, description: 'Hatch lát gạch nền, tỉ lệ thật.', thumbnail: [C.comment, C.ok], mechanic: 'ap' },
      { id: 'cad-hatch-2', shelfId: 'cad-hatch', name: 'Hatch gỗ sàn', scope: 'chung', kind: 'Hatch 2D', author: 'Studio Admin', version: 'v1.0', usageCount: 199, description: 'Hatch sàn gỗ, hướng vân chỉnh được.', thumbnail: [C.comment, C.warn], mechanic: 'ap' },
      { id: 'cad-hatch-3', shelfId: 'cad-hatch', name: 'Hatch đá granite', scope: 'studio', kind: 'Hatch 2D', author: 'KTS. Chi', version: 'v1.1', usageCount: 44, description: 'Hatch đá vân mịn cho mặt bàn/ốp.', thumbnail: [C.comment, C.master], mechanic: 'ap' },
    ],
  },
  {
    id: 'cad-argument',
    stage: 'cad',
    icon: '◈',
    title: 'Form lập luận',
    items: [
      { id: 'cad-arg-1', shelfId: 'cad-argument', name: 'Dây chuyền công năng', scope: 'chung', kind: 'Form lập luận', author: 'Studio Admin', version: 'v1.0', usageCount: 132, description: 'Sơ đồ dòng di chuyển giữa các khu chức năng.', thumbnail: [C.master, C.logic], mechanic: 'keo' },
      { id: 'cad-arg-2', shelfId: 'cad-argument', name: 'Sơ đồ bong bóng', scope: 'chung', kind: 'Form lập luận', author: 'Studio Admin', version: 'v1.0', usageCount: 118, description: 'Bong bóng chức năng + quan hệ gần/xa.', thumbnail: [C.master, C.ok], mechanic: 'keo' },
    ],
  },

  // ————————————————————————— RENDER (ví dụ chi tiết đã duyệt) —————————————————————————
  {
    id: 'render-argument',
    stage: 'render',
    icon: '◈',
    title: 'Form lập luận · 6 mẫu',
    items: [
      { id: 'render-arg-1', shelfId: 'render-argument', name: 'Khung concept 5 nhánh', scope: 'studio', kind: 'Form lập luận', author: 'KTS. Bình', version: 'v1.2', usageCount: 76, description: 'Sơ đồ concept toả 5 nhánh từ ý tưởng gốc.', thumbnail: [C.master, C.comment], mechanic: 'keo' },
      { id: 'render-arg-2', shelfId: 'render-argument', name: 'So sánh phương án', scope: 'chung', kind: 'Form lập luận', author: 'Studio Admin', version: 'v1.0', usageCount: 205, description: 'Ma trận so sánh 2–4 phương án theo tiêu chí.', thumbnail: [C.master, C.logic], mechanic: 'keo' },
      { id: 'render-arg-3', shelfId: 'render-argument', name: '6 chiếc mũ', scope: 'chung', kind: 'Form lập luận', author: 'Studio Admin', version: 'v1.0', usageCount: 92, description: '6 góc nhìn tư duy (Six Thinking Hats) cho brief.', thumbnail: [C.master, C.warn], mechanic: 'keo' },
      { id: 'render-arg-4', shelfId: 'render-argument', name: 'SWOT không gian', scope: 'chung', kind: 'Form lập luận', author: 'Studio Admin', version: 'v1.0', usageCount: 84, description: 'SWOT áp cho phân tích không gian/site.', thumbnail: [C.master, C.ok], mechanic: 'keo' },
      { id: 'render-arg-5', shelfId: 'render-argument', name: 'Bảng chọn vật liệu', scope: 'studio', kind: 'Form lập luận', author: 'KTS. Chi', version: 'v1.1', usageCount: 51, description: 'Bảng tiêu chí chọn vật liệu theo hạng mục.', thumbnail: [C.master, C.comment], mechanic: 'keo' },
      { id: 'render-arg-6', shelfId: 'render-argument', name: 'Mood→Concept', scope: 'chung', kind: 'Form lập luận', author: 'Studio Admin', version: 'v1.0', usageCount: 140, description: 'Bắc cầu từ moodboard sang concept có cấu trúc.', thumbnail: [C.master, C.mood], mechanic: 'keo' },
    ],
  },
  {
    id: 'render-mood',
    stage: 'render',
    icon: '◱',
    title: 'Moodboard & Preset render',
    items: [
      { id: 'render-mood-1', shelfId: 'render-mood', name: 'Moodboard theo phòng', scope: 'chang', kind: 'Template moodboard', author: 'KTS. Bình', version: 'v1.0', usageCount: 67, description: 'Khung board chia theo từng phòng của dự án.', thumbnail: [C.mood, C.comment], mechanic: 'keo' },
      { id: 'render-mood-2', shelfId: 'render-mood', name: 'Preset nắng chiều', scope: 'du_an', kind: 'Preset render', author: 'KTS. An', version: 'v1.0', usageCount: 12, description: 'Ánh sáng + giờ nắng chiều, áp lên node render.', thumbnail: [C.mood, C.warn], mechanic: 'ap' },
      { id: 'render-mood-3', shelfId: 'render-mood', name: 'Pipeline Sketch→Render→Upscale', scope: 'chung', kind: 'Template pipeline', author: 'Studio Admin', version: 'v1.3', usageCount: 233, description: 'Chuỗi node dựng sẵn, kéo là có cả 3 bước.', thumbnail: [C.mood, C.logic], mechanic: 'keo' },
    ],
  },
  {
    id: 'material-common',
    stage: 'chung',
    icon: '◍',
    title: 'Vật liệu (chung · xuyên chặng) · V-Ray · D5 · IF/ATLAS',
    items: [
      { id: 'mat-1', shelfId: 'material-common', name: 'W-102 Gỗ óc chó', scope: 'chung', kind: 'Vật liệu (matId)', author: 'ATLAS', version: 'v1.0', usageCount: 512, description: 'matId W-102 — gỗ óc chó vân dọc, dùng chung V-Ray/D5/IF.', thumbnail: [C.warn, C.mood], mechanic: 'ap', matId: 'W-102' },
      { id: 'mat-2', shelfId: 'material-common', name: 'S-044 Travertine', scope: 'chung', kind: 'Vật liệu (matId)', author: 'ATLAS', version: 'v1.0', usageCount: 388, description: 'matId S-044 — đá travertine be sáng.', thumbnail: [C.logic, C.ok], mechanic: 'ap', matId: 'S-044' },
      { id: 'mat-3', shelfId: 'material-common', name: 'P-070 Sơn xanh rêu', scope: 'chung', kind: 'Vật liệu (matId)', author: 'ATLAS', version: 'v1.0', usageCount: 275, description: 'matId P-070 — sơn nội thất xanh rêu mờ.', thumbnail: [C.ok, C.comment], mechanic: 'ap', matId: 'P-070' },
    ],
  },

  // ————————————————————————— PRESENT —————————————————————————
  {
    id: 'present-deck',
    stage: 'present',
    icon: '◨',
    title: 'Template Deck',
    items: [
      { id: 'present-deck-1', shelfId: 'present-deck', name: 'Master page biên tối giản', scope: 'chung', kind: 'Template Deck', author: 'Studio Admin', version: 'v1.0', usageCount: 160, description: 'Master page trắng, biên rộng, đặt logo dự án theo Brand Kit.', thumbnail: [C.comment, C.logic], mechanic: 'keo' },
      { id: 'present-deck-2', shelfId: 'present-deck', name: 'Bố cục slide 3 cột', scope: 'chung', kind: 'Template Deck', author: 'Studio Admin', version: 'v1.1', usageCount: 98, description: 'Slide so sánh 3 phương án song song.', thumbnail: [C.comment, C.ok], mechanic: 'keo' },
      { id: 'present-deck-3', shelfId: 'present-deck', name: 'Deck concept 12 trang', scope: 'studio', kind: 'Template Deck', author: 'KTS. Chi', version: 'v2.1', usageCount: 34, description: 'Bộ 12 slide dựng sẵn cho trình bày concept.', thumbnail: [C.comment, C.master], mechanic: 'keo' },
    ],
  },
  {
    id: 'present-material-board',
    stage: 'present',
    icon: '▦',
    title: 'Template Material board',
    items: [
      { id: 'present-mb-1', shelfId: 'present-material-board', name: 'Lưới A3 · 9 ô', scope: 'chung', kind: 'Template Material board', author: 'Studio Admin', version: 'v1.0', usageCount: 143, description: 'Lưới 9 ô đều cho board vật liệu A3.', thumbnail: [C.ok, C.logic], mechanic: 'keo' },
      { id: 'present-mb-2', shelfId: 'present-material-board', name: 'Lưới A3 · 6 ô + chú thích', scope: 'studio', kind: 'Template Material board', author: 'KTS. Bình', version: 'v1.0', usageCount: 41, description: 'Lưới 6 ô lớn kèm khối chú thích bên phải.', thumbnail: [C.ok, C.master], mechanic: 'keo' },
    ],
  },
  {
    id: 'present-boq',
    stage: 'present',
    icon: '▤',
    title: 'Template Bảng tính / BOQ',
    items: [
      { id: 'present-boq-1', shelfId: 'present-boq', name: 'Biểu mẫu dự toán cơ bản', scope: 'chung', kind: 'Template BOQ', author: 'Studio Admin', version: 'v1.0', usageCount: 187, description: 'Bảng khối lượng — đơn giá — thành tiền, chưa liên kết CAD.', thumbnail: [C.logic, C.warn], mechanic: 'keo' },
      { id: 'present-boq-2', shelfId: 'present-boq', name: 'Biểu mẫu dự toán live-link CAD', scope: 'studio', kind: 'Template BOQ', author: 'KTS. An', version: 'v1.0', usageCount: 22, description: 'Khối lượng đọc trực tiếp từ bản vẽ CAD.', thumbnail: [C.logic, C.master], mechanic: 'keo' },
    ],
  },
  {
    id: 'present-word',
    stage: 'present',
    icon: '▥',
    title: 'Template Word biểu mẫu',
    items: [
      { id: 'present-word-1', shelfId: 'present-word', name: 'Thuyết minh thiết kế song ngữ', scope: 'chung', kind: 'Template Word', author: 'Studio Admin', version: 'v1.0', usageCount: 95, description: 'Mẫu thuyết minh VI/EN song song.', thumbnail: [C.warn, C.comment], mechanic: 'keo' },
      { id: 'present-word-2', shelfId: 'present-word', name: 'Hợp đồng mẫu song ngữ', scope: 'studio', kind: 'Template Word', author: 'KTS. Chi', version: 'v1.0', usageCount: 18, description: 'Mẫu hợp đồng VI/EN (hư cấu, chưa qua pháp lý).', thumbnail: [C.warn, C.logic], mechanic: 'keo' },
    ],
  },
  {
    id: 'present-video',
    stage: 'present',
    icon: '▶',
    title: 'Template Video',
    items: [
      { id: 'present-video-1', shelfId: 'present-video', name: 'Timeline intro/outro chuẩn', scope: 'chung', kind: 'Template Video', author: 'Studio Admin', version: 'v1.0', usageCount: 110, description: 'Đoạn mở/đóng dựng sẵn, chèn logo dự án.', thumbnail: [C.mood, C.logic], mechanic: 'keo' },
      { id: 'present-video-2', shelfId: 'present-video', name: 'Nhịp cắt theo nhạc nền', scope: 'studio', kind: 'Template Video', author: 'KTS. Bình', version: 'v1.0', usageCount: 27, description: 'Điểm cắt canh theo phách nhạc nền mẫu.', thumbnail: [C.mood, C.ok], mechanic: 'keo' },
    ],
  },
];

export function shelvesForStage(stage: 'all' | StageKey): LibraryShelf[] {
  if (stage === 'all') return LIBRARY_SHELVES;
  return LIBRARY_SHELVES.filter((s) => s.stage === stage || s.stage === 'chung');
}
