/**
 * scripts/frontier-registry.mjs — SỔ FRONTIER SỐNG (Hoà đặt bài 11/08: "bàn xong đợt 3 là
 * frontier đợt 1-2 biến mất — cách gì khắc phục, kỷ luật chặt, sự thật, mà cực rẻ").
 *
 * Nguyên lý: sổ giấy (md) mục theo thời gian — CHỈ MÁY KIỂM mới không quên. File này là
 * registry máy-đọc-được; `soi-frontier.mjs` grep code thật và BÁO ĐỎ khi lệch 2 chiều:
 *   - khai 'xong' mà bằng chứng không có  → nói dối / bị regress
 *   - khai 'chua' mà bằng chứng ĐÃ có     → code xong rồi mà sổ quên (đúng bệnh 11/08)
 *
 * KỶ LUẬT (ghi 00-CHOT 11/08): chốt tính năng mới = thêm 1 entry TẠI ĐÂY ngay lúc chốt,
 * TRƯỚC khi code. `bangChung` mô tả TRẠNG THÁI XONG: mảng điều kiện, mỗi điều kiện
 *   { file: 'đường/dẫn', mau: 'regex', can: true|false }   — can:false = xong nghĩa là KHÔNG còn khớp
 *   { dir: 'thư/mục', mau: 'regex' }                        — quét đệ quy .ts/.tsx/.mjs/.prisma
 */

export const FRONTIER = [
  // ── ĐÃ XONG (script canh regress) ────────────────────────────────────────────
  { id: 'h4-picker', ten: 'Màn chọn 6 loại hồ sơ Trình chiếu (H4/V6)', he: 'Workspace', dot: 0, trangThai: 'xong',
    bangChung: [{ file: 'components/present-editor/PresentDocTypePicker.tsx', mau: '.' }] },
  { id: 'vitals-doccontext', ten: 'Vitals đọc ngữ cảnh bản vẽ + lỗi chuẩn', he: 'ThinkDial', dot: 0, trangThai: 'xong',
    bangChung: [{ file: 'components/studio/VitalsGesture.tsx', mau: 'docContext' }] },
  { id: 'material-a3', ten: 'Editor Bảng vật liệu A3 (lưu .idfp)', he: 'Workspace', dot: 0, trangThai: 'xong',
    bangChung: [{ file: 'components/present-editor/PresentSheets.tsx', mau: 'material-a3' }] },
  { id: 'dock-3d-that', ten: 'Dock 3D thu gọn chỉ hiện nút thật', he: 'LibraryFirst', dot: 0, trangThai: 'xong',
    bangChung: [{ file: 'components/render-studio/ToolDock3D.tsx', mau: 'filter\\(\\(it\\) => !it\\.disabled\\)' }] },
  { id: 'pie-menu-2d', ten: 'Đĩa lệnh (pie menu) đã mount ở 2D + In ấn', he: 'NhapLenh', dot: 0, trangThai: 'xong',
    bangChung: [{ file: 'components/cad/CadCanvas.tsx', mau: 'RadialToolMenu' }] },

  // ── ĐỢT 1 · KHÂU DÂY ─────────────────────────────────────────────────────────
  { id: 'project-profile', ten: 'Hồ Sơ Dự Án Thông Minh (form 60s, gốc 3 máy)', he: 'TriTueDuAn', dot: 1, trangThai: 'chua',
    bangChung: [{ dir: 'components', mau: 'ProjectProfile' }] },
  { id: 'scaffolder', ten: 'Máy Sinh Khung (Profile → cột/task/chuẩn/kệ)', he: 'TriTueDuAn', dot: 1, trangThai: 'chua',
    bangChung: [{ dir: 'lib', mau: 'ProjectScaffolder' }] },
  { id: 'dna-card', ten: 'Thẻ DNA Thiết kế (8 lớp · 3 đầu ra · trạng thái)', he: 'TriTueDuAn', dot: 1, trangThai: 'chua',
    bangChung: [{ dir: 'lib', mau: 'DnaCard|DesignDnaCard' }] },
  { id: 'task-context', ten: 'Dây Việc–Ngữ Cảnh (12/08: schema+API+deep-link+chip chặng — chiều ngược Tạo-việc-từ-đây và đọc focusEntity ở chặng là entry riêng sau)', he: 'Workspace', dot: 1, trangThai: 'xong',
    bangChung: [{ file: 'prisma/schema.prisma', mau: 'workspaceId String\\?' }] }, // regex block-brace vấp dấu } trong docblock — đổi sang mẫu field trực tiếp (12/08)
  { id: 'library-data-that', ten: 'Thư viện đọc kho THẬT (bỏ mock)', he: 'LibraryFirst', dot: 1, trangThai: 'chua',
    bangChung: [{ file: 'lib/library/shelves.ts', mau: 'LIBRARY_DATA_IS_MOCK = true', can: false }] },
  { id: 'fm-data-that', ten: 'File Manager đọc đĩa THẬT (bỏ mock-data)', he: 'LibraryFirst', dot: 1, trangThai: 'chua',
    bangChung: [{ file: 'lib/filemanager/queries.ts', mau: "mock-data", can: false }] },
  { id: 'think-dial', ten: 'Nấc Suy Nghĩ — 4 nấc Vitals (12/08: fast/balanced/deep/research — research nối RAG notebook thật)', he: 'ThinkDial', dot: 1, trangThai: 'xong',
    bangChung: [{ dir: 'components', mau: 'ThinkDial' }] },
  { id: 'light-arc', ten: 'LightArc — cung sáng tiến độ (12/08: components/ui/LightArc + ExportPdfDialog indeterminate thật)', he: 'LightState', dot: 1, trangThai: 'xong',
    bangChung: [{ dir: 'components/ui', mau: 'LightArc' }] },
  { id: 'capture-nut', ten: 'Nút xuất PNG sequence (rời route bench)', he: 'DocCore', dot: 1, trangThai: 'chua',
    bangChung: [{ dir: 'components', mau: 'import \\{[^}]*captureSequence' }] },

  // ── ĐỢT 1b · CHẤT LƯỢNG ĐẦU RA (11/08 — soi MẮT file layout.pdf xuất thật, lần đầu
  //     nghiệm thu sản phẩm thay vì code; 3 lỗi khiến bản vẽ "chưa cầm đi gặp khách được") ──
  { id: 'label-ne-hinh', ten: 'Né nhãn v1 (12/08: label-placer 8 hướng + leader — PHÒNG NGỦ hết đè giường)', he: 'DocCore', dot: 1, trangThai: 'xong',
    bangChung: [{ dir: 'lib/cad', mau: 'avoidLabelCollision|LabelPlacer' }] },
  // ⚠️ soi-frontier bắt được ngay 11/08: STANDARD_SCALES + hàm bắt nấc ĐÃ CÓ (model.ts:1059-1071)
  // nhưng đường xuất PDF không gọi → in "1:47". Việc là NỐI DÂY vào đường xuất, marker mới:
  { id: 'ty-le-chuan', ten: 'Tỷ lệ bắt nấc chuẩn khi xuất (12/08: snapPrintScale — PDF soi mắt ra 1:50)', he: 'DocCore', dot: 1, trangThai: 'xong',
    bangChung: [{ dir: 'lib', mau: 'snapPrintScale|CHUAN_TY_LE_IN' }] },
  { id: 'khung-ten-sach', ten: 'Khung tên 9 ô + strip jargon (12/08: drawingNumber, không bịa giá trị — PDF soi mắt sạch)', he: 'DocCore', dot: 1, trangThai: 'xong',
    bangChung: [{ dir: 'lib/cad', mau: 'drawingNumber|soHieuBanVe' }] },

  { id: 'story-set', ten: 'BỘ HỒ SƠ KỂ CHUYỆN (Story Set) — hero output 6 chương: bìa editorial → DNA board → câu chuyện → ảnh điện ảnh → vật liệu tạp chí → phụ lục sự thật, template trung tính ship kèm app, ăn theo Thẻ DNA từng dự án', he: 'Workspace', dot: 1, trangThai: 'xong',
    bangChung: [{ dir: 'lib/present-editor', mau: 'StorySet|storySet' }] }, // 12/08: buildStorySetDeck 8 trang + thẻ đầu gallery, 38 test, 8 URL unsplash verify 200
  { id: 'material-impact-ui', ten: 'Material Impact preview lên UI (12/08: MaterialImpactPreview + chèn trước applyMaterial, undo giữ nguyên)', he: 'LibraryFirst', dot: 1, trangThai: 'xong',
    bangChung: [{ dir: 'components', mau: 'MaterialImpact|impact-preview' }] },
  { id: 'chuan-dau-ra-gate', ten: 'Máy chặn CHUAN_DAU_RA lúc xuất (12/08: tỷ lệ lẻ/thiếu ô/nhãn đè → error+fix trong dialog)', he: 'DocCore', dot: 1, trangThai: 'xong',
    bangChung: [{ dir: 'lib/print', mau: 'CHUAN_DAU_RA' }] },
  { id: 'label-ne-hinh-v2', ten: 'Né nhãn v2 (12/08: labelInRoomBounds + dimOutsideRoom — audit mắt PDF: 0 nhãn đè, dim ra ngoài 2 lớp thẳng hàng; còn dim xiên/radius đếm vào gate)', he: 'DocCore', dot: 1, trangThai: 'xong',
    bangChung: [{ dir: 'lib/cad', mau: 'labelInRoomBounds|dimOutsideRoom' }] },
  { id: 'bento-align-2d', ten: 'Căn lưới bento vùng đầu chặng 2D (tab Bản vẽ · Mở tệp · rail LỚP chung một lề — Hoà chụp lệch 11/08)', he: 'DocCore', dot: 1, trangThai: 'chua',
    bangChung: [{ dir: 'components/cad', mau: 'BENTO_GRID|--bento-gutter' }] },

  // ── ĐỢT 2 · LÕI DỰNG ────────────────────────────────────────────────────────
  { id: 'tool-state-3d', ten: 'Máy trạng thái công cụ 3D (mở 12 nút dock chờ)', he: 'NhapLenh', dot: 2, trangThai: 'chua',
    bangChung: [{ file: 'components/render-studio/ToolDock3D.tsx', mau: 'CHUA_DUNG_DUOC', can: false }] },
  { id: 'build-recipe', ten: 'Công Thức Khối — BuildOp thành stack sửa-lại-được', he: 'BuildRecipe', dot: 2, trangThai: 'chua',
    bangChung: [{ dir: 'lib/three', mau: 'BuildRecipe' }] },
  { id: 'snap-hop-nhat', ten: 'Bắt Điểm Hợp Nhất — một engine 2D↔3D', he: 'SnapCore', dot: 2, trangThai: 'chua',
    bangChung: [{ dir: 'lib', mau: 'SnapCore' }] },
  { id: 'num-strip', ten: 'Dải số nổi tại điểm thả (touch, nối vcb)', he: 'NhapLenh', dot: 2, trangThai: 'chua',
    bangChung: [{ dir: 'components', mau: 'NumStrip' }] },
  { id: 'pie-menu-3d', ten: 'Đĩa lệnh theo đối tượng cho 3D (tái dùng RadialToolMenu)', he: 'NhapLenh', dot: 2, trangThai: 'chua',
    bangChung: [{ dir: 'components/render-studio', mau: 'RadialToolMenu' }] },
  { id: 'team-fit', ten: 'Máy Hiểu Người (hồ sơ nguồn thành viên, gợi ý kèm căn cứ)', he: 'TriTueDuAn', dot: 2, trangThai: 'chua',
    bangChung: [{ dir: 'lib', mau: 'TeamFit' }] },
  // 11/08 tối — Hoà đặt bài "DNA công ty + smart transfer + nhãn trung tính để reset":
  { id: 'company-dna-pack', ten: 'Hồ Sơ Công Ty (quy trình·quy định·gu·thư viện riêng — tham chiếu, không nhúng cứng)', he: 'TriTueDuAn', dot: 2, trangThai: 'chua',
    bangChung: [{ dir: 'lib', mau: 'CompanyDnaPack|HoSoCongTy' }] },
  { id: 'smart-ingest', ten: 'Smart Ingest: bản gốc bất biến + proxy + định tuyến trích xuất theo yêu cầu (nâng Gateway/refingest sẵn có)', he: 'DocCore', dot: 2, trangThai: 'chua',
    bangChung: [{ dir: 'lib', mau: 'SmartIngest|IngestRouter' }] },
  { id: 'nhan-nguon-reset', ten: 'Nhãn nguồn DataOrigin (app-core/studio/project/demo) trên mọi bản ghi + lệnh reset về trung tính', he: 'DocCore', dot: 2, trangThai: 'chua',
    bangChung: [{ dir: 'lib', mau: 'DataOrigin|NHAN_NGUON' }] },

  // 11/08 khuya — Hoà giao batch chat/khởi tạo/họp (3 agent mock+spec đang chạy):
  { id: 'presence-avatar-row', ten: 'Dãy avatar online màu/offline trắng-đen (12/08: PresenceRow thay stack trong PresenceBar, khử hex ngoài token)', he: 'LightState', dot: 1, trangThai: 'xong',
    bangChung: [{ dir: 'components', mau: 'PresenceRow|presence-row' }] },
  { id: 'activity-feed', ten: 'Dòng Hoạt Động dự án (ref #13): filter Tất-cả/Của-tôi/Đội, event card theo loại + thread inline — bề mặt nhận push Cổng Duyệt, phiếu điều chỉnh họp, báo đổi vật liệu', he: 'Workspace', dot: 2, trangThai: 'chua',
    bangChung: [{ dir: 'components', mau: 'ActivityFeed|DongHoatDong' }] },
  { id: 'chat-ai-notebook', ten: 'Stage chat nhóm bố cục NotebookLM (nguồn trái · luồng giữa · chưng cất phải) + toggle AI tham vấn', he: 'Workspace', dot: 2, trangThai: 'chua',
    bangChung: [{ dir: 'components', mau: 'ChatNhomAi|AiGroupChat' }] },
  { id: 'project-init-board', ten: 'Bảng khởi tạo dự án Plan-Task-Timeline: quản lý tạo + phân quyền, chủ trì gắn thẻ đầu mục', he: 'TriTueDuAn', dot: 2, trangThai: 'chua',
    bangChung: [{ dir: 'components', mau: 'ProjectInitBoard|BangKhoiTao' }] },
  { id: 'meeting-distill', ten: 'Họp → nháp biên bản (biểu mẫu kho chuẩn) → chủ trì duyệt → 3 dòng: quyết định/việc/phiếu điều chỉnh gắn ĐỐI TƯỢNG (định tuyến theo entity, không theo chặng). KHÔNG tự xây engine video — nhận bản ghi từ ngoài', he: 'Workspace', dot: 3, trangThai: 'chua',
    bangChung: [{ dir: 'lib', mau: 'MeetingDistill|BienBanHop' }] },

  // ── ĐỢT 3 · RA CỔNG ─────────────────────────────────────────────────────────
  { id: 'chat-project', ten: 'Chat theo dự án (ChatMessage + projectId)', he: 'Workspace', dot: 3, trangThai: 'chua',
    bangChung: [{ file: 'prisma/schema.prisma', mau: 'model ChatMessage \\{[^}]*projectId' }] },
  { id: 'comment-neo-doi-tuong', ten: 'Comment ghim vào đối tượng/vị trí (PHIẾU 5 Collaborate — XÂY MỚI, không phải nối dây)', he: 'Workspace', dot: 3, trangThai: 'chua',
    bangChung: [{ file: 'prisma/schema.prisma', mau: 'model Comment \\{[^}]*entityId' }] },
  { id: 'review-gate', ten: 'Cổng Duyệt nội bộ: mốc time → Vitals push deep-link cho sếp/bộ phận → xem+note (gõ/voice-to-text) → note gom thành checklist chỉnh sửa → sạch mới gửi mail. CĐT ở NGOÀI hệ (chốt 11/08 khuya)', he: 'Workspace', dot: 3, trangThai: 'chua',
    bangChung: [{ dir: 'lib', mau: 'ReviewGate|CongDuyet' }] },
  { id: 'dwg-tach-tien-trinh', ten: 'DWG converter tách tiến trình (mere aggregation)', he: 'DocCore', dot: 3, trangThai: 'chua',
    bangChung: [{ dir: 'scripts', mau: 'dwg-converter|dwgConverterProcess' }] },
];
