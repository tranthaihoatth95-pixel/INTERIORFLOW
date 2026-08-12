/**
 * scripts/frontier-registry.mjs — SỔ FRONTIER SỐNG (Hoà đặt bài 11/08: "bàn xong đợt 3 là
 * frontier đợt 1-2 biến mất — cách gì khắc phục, kỷ luật chặt, sự thật, mà cực rẻ").
 *
 * Nguyên lý: sổ giấy (md) mục theo thời gian — CHỈ MÁY KIỂM mới không quên. File này là
 * registry máy-đọc-được; `soi-frontier.mjs` grep code thật và BÁO ĐỎ khi lệch 2 chiều:
 *   - khai 'xong' mà bằng chứng không có  → nói dối / bị regress
 *   - khai 'chua' mà bằng chứng ĐÃ có     → code xong rồi mà sổ quên (đúng bệnh 11/08)
 *
 * `vai` (12/08 — cơ chế phân loại Hoà đặt): 'mvp' = lõi khác biệt (highlight, tập trung) ·
 * 'do' = support/đỡ (làm app chuyên nghiệp) · 'day' = kết nối chung (nhiều tính năng đứng lên).
 * Máy soi đếm cân bằng 3 vai — MVP đói hơn support là cảnh báo.
 *
 * KỶ LUẬT (ghi 00-CHOT 11/08): chốt tính năng mới = thêm 1 entry TẠI ĐÂY ngay lúc chốt,
 * TRƯỚC khi code. `bangChung` mô tả TRẠNG THÁI XONG: mảng điều kiện, mỗi điều kiện
 *   { file: 'đường/dẫn', mau: 'regex', can: true|false }   — can:false = xong nghĩa là KHÔNG còn khớp
 *   { dir: 'thư/mục', mau: 'regex' }                        — quét đệ quy .ts/.tsx/.mjs/.prisma
 */

export const FRONTIER = [
  // ── ĐÃ XONG (script canh regress) ────────────────────────────────────────────
  { id: 'h4-picker', vai: 'mvp', ten: 'Màn chọn 6 loại hồ sơ Trình chiếu (H4/V6)', he: 'Workspace', dot: 0, trangThai: 'xong',
    bangChung: [{ file: 'components/present-editor/PresentDocTypePicker.tsx', mau: '.' }] },
  { id: 'vitals-doccontext', vai: 'mvp', ten: 'Vitals đọc ngữ cảnh bản vẽ + lỗi chuẩn', he: 'ThinkDial', dot: 0, trangThai: 'xong',
    bangChung: [{ file: 'components/studio/VitalsGesture.tsx', mau: 'docContext' }] },
  { id: 'material-a3', vai: 'mvp', ten: 'Editor Bảng vật liệu A3 (lưu .idfp)', he: 'Workspace', dot: 0, trangThai: 'xong',
    bangChung: [{ file: 'components/present-editor/PresentSheets.tsx', mau: 'material-a3' }] },
  { id: 'dock-3d-that', vai: 'do', ten: 'Dock 3D thu gọn chỉ hiện nút thật', he: 'LibraryFirst', dot: 0, trangThai: 'xong',
    bangChung: [{ file: 'components/render-studio/ToolDock3D.tsx', mau: 'filter\\(\\(it\\) => !it\\.disabled\\)' }] },
  { id: 'pie-menu-2d', vai: 'do', ten: 'Đĩa lệnh (pie menu) đã mount ở 2D + In ấn', he: 'NhapLenh', dot: 0, trangThai: 'xong',
    bangChung: [{ file: 'components/cad/CadCanvas.tsx', mau: 'RadialToolMenu' }] },

  // ── ĐỢT 1 · KHÂU DÂY ─────────────────────────────────────────────────────────
  { id: 'project-profile', vai: 'mvp', ten: 'Hồ Sơ Dự Án (12/08: model+API+bảng khởi tạo 3 mảnh PLAN·TASK·TIMELINE từ ＋ Dự án mới)', he: 'TriTueDuAn', dot: 1, trangThai: 'xong',
    bangChung: [{ file: 'prisma/schema.prisma', mau: 'model ProjectProfile' }] },
  { id: 'scaffolder', vai: 'mvp', ten: 'Máy Sinh Khung v1 (12/08: suggestScaffold theo loại hình KÈM căn cứ, gieo việc mang stage TaskContext; thiếu loại hình → im, không đoán)', he: 'TriTueDuAn', dot: 1, trangThai: 'xong',
    bangChung: [{ dir: 'lib', mau: 'ProjectScaffolder' }] },
  { id: 'dna-card', vai: 'mvp', ten: 'Thẻ DNA Thiết kế (8 lớp · 3 đầu ra · trạng thái)', he: 'TriTueDuAn', dot: 1, trangThai: 'chua',
    bangChung: [{ dir: 'lib', mau: 'DnaCard|DesignDnaCard' }] },
  { id: 'task-context', vai: 'mvp', ten: 'Dây Việc–Ngữ Cảnh (12/08: schema+API+deep-link+chip chặng — chiều ngược Tạo-việc-từ-đây và đọc focusEntity ở chặng là entry riêng sau)', he: 'Workspace', dot: 1, trangThai: 'xong',
    bangChung: [{ file: 'prisma/schema.prisma', mau: 'workspaceId String\\?' }] }, // regex block-brace vấp dấu } trong docblock — đổi sang mẫu field trực tiếp (12/08)
  { id: 'library-data-that', vai: 'day', ten: 'Thư viện đọc kho THẬT (12/08: LibraryAsset qua API, số đếm thật, empty-state + nút Nhập; 17 seed minh hoạ Unsplash tải về uploads/ chạy offline, gỡ --undo)', he: 'LibraryFirst', dot: 1, trangThai: 'xong',
    bangChung: [{ file: 'lib/library/shelves.ts', mau: 'LIBRARY_DATA_IS_MOCK = true', can: false }] },
  { id: 'fm-data-that', vai: 'day', ten: 'FM đọc đĩa THẬT (12/08: bỏ mock-data, cây 5 root + real-fs, số 0 thật thay 2,1GB bịa; quyền per-folder = TODO entry riêng)', he: 'LibraryFirst', dot: 1, trangThai: 'xong',
    bangChung: [{ file: 'lib/filemanager/queries.ts', mau: "from '\\./mock-data'", can: false }] }, // mẫu cũ vấp comment kể-lịch-sử
  { id: 'think-dial', vai: 'day', ten: 'Nấc Suy Nghĩ — 4 nấc Vitals (12/08: fast/balanced/deep/research — research nối RAG notebook thật)', he: 'ThinkDial', dot: 1, trangThai: 'xong',
    bangChung: [{ dir: 'components', mau: 'ThinkDial' }] },
  { id: 'light-arc', vai: 'do', ten: 'LightArc — cung sáng tiến độ (12/08: components/ui/LightArc + ExportPdfDialog indeterminate thật)', he: 'LightState', dot: 1, trangThai: 'xong',
    bangChung: [{ dir: 'components/ui', mau: 'LightArc' }] },
  { id: 'capture-nut', vai: 'do', ten: 'Nút xuất PNG sequence (rời route bench)', he: 'DocCore', dot: 1, trangThai: 'chua',
    bangChung: [{ dir: 'components', mau: 'import \\{[^}]*captureSequence' }] },

  // ── ĐỢT 1b · CHẤT LƯỢNG ĐẦU RA (11/08 — soi MẮT file layout.pdf xuất thật, lần đầu
  //     nghiệm thu sản phẩm thay vì code; 3 lỗi khiến bản vẽ "chưa cầm đi gặp khách được") ──
  { id: 'label-ne-hinh', vai: 'mvp', ten: 'Né nhãn v1 (12/08: label-placer 8 hướng + leader — PHÒNG NGỦ hết đè giường)', he: 'DocCore', dot: 1, trangThai: 'xong',
    bangChung: [{ dir: 'lib/cad', mau: 'avoidLabelCollision|LabelPlacer' }] },
  // ⚠️ soi-frontier bắt được ngay 11/08: STANDARD_SCALES + hàm bắt nấc ĐÃ CÓ (model.ts:1059-1071)
  // nhưng đường xuất PDF không gọi → in "1:47". Việc là NỐI DÂY vào đường xuất, marker mới:
  { id: 'ty-le-chuan', vai: 'mvp', ten: 'Tỷ lệ bắt nấc chuẩn khi xuất (12/08: snapPrintScale — PDF soi mắt ra 1:50)', he: 'DocCore', dot: 1, trangThai: 'xong',
    bangChung: [{ dir: 'lib', mau: 'snapPrintScale|CHUAN_TY_LE_IN' }] },
  { id: 'khung-ten-sach', vai: 'mvp', ten: 'Khung tên 9 ô + strip jargon (12/08: drawingNumber, không bịa giá trị — PDF soi mắt sạch)', he: 'DocCore', dot: 1, trangThai: 'xong',
    bangChung: [{ dir: 'lib/cad', mau: 'drawingNumber|soHieuBanVe' }] },

  { id: 'story-set', vai: 'mvp', ten: 'BỘ HỒ SƠ KỂ CHUYỆN (Story Set) — hero output 6 chương: bìa editorial → DNA board → câu chuyện → ảnh điện ảnh → vật liệu tạp chí → phụ lục sự thật, template trung tính ship kèm app, ăn theo Thẻ DNA từng dự án', he: 'Workspace', dot: 1, trangThai: 'xong',
    bangChung: [{ dir: 'lib/present-editor', mau: 'StorySet|storySet' }] }, // 12/08: buildStorySetDeck 8 trang + thẻ đầu gallery, 38 test, 8 URL unsplash verify 200
  { id: 'material-impact-ui', vai: 'mvp', ten: 'Material Impact preview lên UI (12/08: MaterialImpactPreview + chèn trước applyMaterial, undo giữ nguyên)', he: 'LibraryFirst', dot: 1, trangThai: 'xong',
    bangChung: [{ dir: 'components', mau: 'MaterialImpact|impact-preview' }] },
  { id: 'chuan-dau-ra-gate', vai: 'mvp', ten: 'Máy chặn CHUAN_DAU_RA lúc xuất (12/08: tỷ lệ lẻ/thiếu ô/nhãn đè → error+fix trong dialog)', he: 'DocCore', dot: 1, trangThai: 'xong',
    bangChung: [{ dir: 'lib/print', mau: 'CHUAN_DAU_RA' }] },
  { id: 'label-ne-hinh-v2', vai: 'mvp', ten: 'Né nhãn v2 (12/08: labelInRoomBounds + dimOutsideRoom — audit mắt PDF: 0 nhãn đè, dim ra ngoài 2 lớp thẳng hàng; còn dim xiên/radius đếm vào gate)', he: 'DocCore', dot: 1, trangThai: 'xong',
    bangChung: [{ dir: 'lib/cad', mau: 'labelInRoomBounds|dimOutsideRoom' }] },
  { id: 'hinh-hoc-dong-tam', vai: 'day', ten: 'Đồng bộ hình học toàn app (Hoà 12/08: bo góc phải PHÁT TRIỂN TỪ TÂM — trong = ngoài − đệm như Apple §2d; hiện đường nét không nhất quán từ hệ thống tới chi tiết). Phần AUDIT+MÁY SOI xong 12/08 (AUDIT-HINH-HOC: 35% radius lẻ, 10/15 cặp lồng vi phạm, 8px×259 lần không thuộc thang nào)', he: 'DocCore', dot: 1, trangThai: 'xong',
    bangChung: [{ dir: 'scripts', mau: 'soi-hinh-hoc' }] },
  { id: 'hinh-hoc-ap-thang', vai: 'do', ten: 'Áp thang bo v1 (12/08: token --r-* + concentricRadius + migrate top-10 khả dụng, 498→442 off-scale; hàng đợi v2 trong báo cáo H: LightTab/LoginBackdrop/MaterialImportWizard...)', he: 'DocCore', dot: 1, trangThai: 'xong',
    bangChung: [{ file: 'app/globals.css', mau: '--r-full' }] },
  { id: 'card-kinh-gradient', vai: 'do', ten: 'Khôi phục card kính lỏng viền gradient chạy màu ở chặng render (Hoà 12/08: "rất đẹp") — tái sinh dạng ÁNH SÁNG CÓ NGHĨA: viền gradient chỉ chạy khi card ĐANG render/sinh ảnh (hợp luật ánh-sáng-là-trạng-thái + G1/G9)', he: 'LightState', dot: 1, trangThai: 'xong',
    bangChung: [{ dir: 'components', mau: 'glass-gradient-run|GlassGradientCard' }] }, // 12/08: viền gradient chạy CHỈ khi status=running (2 chỗ, grep xác nhận), G1/G9 sạch
  { id: 'bento-align-2d', vai: 'do', ten: 'Căn lưới bento vùng đầu chặng 2D (tab Bản vẽ · Mở tệp · rail LỚP chung một lề — Hoà chụp lệch 11/08)', he: 'DocCore', dot: 1, trangThai: 'chua',
    bangChung: [{ dir: 'components/cad', mau: 'BENTO_GRID|--bento-gutter' }] },

  { id: 'hatch-t-junction-cay-lai', vai: 'do', ten: 'Đánh giá + cấy lại nhánh fix/hatch-t-junction (11/07, +244 dòng DCEL biên phòng vách chữ T + 29 test — GIỮ nhánh, merge thẳng sẽ conflict vì lib/cad đã đổi)', he: 'DocCore', dot: 2, trangThai: 'chua',
    bangChung: [{ dir: 'lib/cad', mau: 'facesFromDcel|hatch-t-junction' }] },
  { id: 'gallery-lien-nganh', vai: 'mvp', ten: 'GALLERY — kho ảnh tuyển liên ngành (kiến trúc·nội thất·cảnh quan·graphic·art) phân nhóm + bộ sưu tập xu hướng CÓ NGUỒN; mặt tiền tuyển chọn của kệ Ảnh & tài sản (không đẻ kho mới); nguồn sạch giấy phép (CC0/Unsplash/studio/AI/user — cấm Pinterest); NUÔI Thẻ DNA + moodboard + Story Set ch.3', he: 'LibraryFirst', dot: 2, trangThai: 'chua',
    bangChung: [{ dir: 'components', mau: 'GalleryLienNganh|gallery-curated' }] },
  { id: 'home-overview-card', vai: 'do', ten: 'Home = Tổng quan dự án (12/08: card quy mô ProjectProfile + PresenceRow thành viên thật + click nhảy lastStage, thiếu dữ liệu tự ẩn; ⚠️ đổi hành vi: mặc định concept thay render — Hoà xem ở phiên duyệt mắt)', he: 'Workspace', dot: 2, trangThai: 'xong',
    bangChung: [{ dir: 'components', mau: 'lastStage|ProjectOverviewCard' }] },
  { id: 'chong-lech-dinh-nghia', vai: 'day', ten: 'Máy soi TỪ ĐIỂN CHUẨN (12/08: soi-tu-dien.mjs — phát đầu bắt 81 chỗ nhãn lệch; sửa khi chạm, nhãn hiển thị sửa ngay)', he: 'DocCore', dot: 1, trangThai: 'xong',
    bangChung: [{ dir: 'scripts', mau: 'soi-tu-dien' }] },
  { id: 'backup-offsite', vai: 'do', ten: 'Backup offsite (12/08: sqlite .backup + integrity trên bản sao + rsync --link-dest + rotation 7 + manifest — audit T tự chạy đích riêng OK)', he: 'DocCore', dot: 1, trangThai: 'xong',
    bangChung: [{ dir: 'scripts', mau: 'backup-offsite|backupOffsite' }] },
  { id: 'nguoi-dung-that', vai: 'do', ten: 'Vòng người dùng thật trước Cửa B: 2-3 người TTT chạy kịch bản Phiếu trên app, note về Cổng Duyệt/Dòng Hoạt Động', he: 'Workspace', dot: 2, trangThai: 'chua',
    bangChung: [{ dir: 'docs/bao-cao-phien', mau: 'nguoi-dung-that|phan-hoi-ttt' }] },
  { id: 'auto-define', vai: 'mvp', ten: 'TỰ ĐỊNH NGHĨA cấu kiện (Hoà đặt 12/08): intelligent core suy elementType/category/tham số từ hình học+ngữ cảnh thay vì bắt KTS nhập parametric tay — gắn cờ 3 nấc measured/inferred/verified (chốt 10/08); HUMAN-IN-LOOP 2 CHIỀU: máy suy→người xác nhận dần, người nhập→máy kiểm lệch — hai bên đỡ sai cho nhau, không bên nào là chân lý', he: 'TriTueDuAn', dot: 2, trangThai: 'chua',
    bangChung: [{ dir: 'lib', mau: 'autoDefine|suyDinhNghia' }] },
  { id: 'hieu-nang-do', vai: 'do', ten: 'ĐO hiệu năng có số (trụ 7 đói — cảnh báo 12/08): bản vẽ 5.000 entity · scene 100k tam giác · kệ 1.500 ảnh ảo hoá — đo trước Cửa B, ra bảng số + điểm gãy', he: 'DocCore', dot: 2, trangThai: 'chua',
    bangChung: [{ dir: 'docs/bao-cao-phien', mau: 'hieu-nang-do|benchmark-if' }] },
  { id: 'focus-entity-doc', vai: 'day', ten: 'Chặng đọc ?focusEntity (12/08: 2D select+bay camera · Trình chiếu nhảy trang; round-trip test khoá chung hằng với deep-link; nhánh 3D theo phiếu D)', he: 'Workspace', dot: 2, trangThai: 'xong',
    bangChung: [{ dir: 'components', mau: 'focusEntity' }] },
  { id: 'tao-viec-tu-day', vai: 'day', ten: 'Tạo việc từ đây (12/08: 2D menu chuột phải theo tên đối tượng thật · Trình chiếu nút Inspector trang, thiếu projectId thì mờ kèm lý do; nhánh 3D theo phiếu D)', he: 'Workspace', dot: 2, trangThai: 'xong',
    bangChung: [{ dir: 'components', mau: 'taoViecTuDay|createTaskFromContext' }] },
  { id: 'camera-pro', vai: 'do', ten: 'Camera mức nghề (2 điểm tụ · tiêu cự mm · DOF · safe frame · tỉ lệ khung — chốt 03/08 "rất cần cho góc nhìn/view/video"): thay tab Camera placeholder', he: 'BuildRecipe', dot: 2, trangThai: 'chua',
    bangChung: [{ dir: 'components/render-studio', mau: 'CameraPro|twoPointPerspective' }] },
  // ── ĐỢT 2 · LÕI DỰNG ────────────────────────────────────────────────────────
  { id: 'tool-state-3d', vai: 'day', ten: 'Máy trạng thái công cụ 3D (mở 12 nút dock chờ)', he: 'NhapLenh', dot: 2, trangThai: 'chua',
    bangChung: [{ file: 'components/render-studio/ToolDock3D.tsx', mau: 'CHUA_DUNG_DUOC', can: false }] },
  { id: 'build-recipe', vai: 'mvp', ten: 'Công Thức Khối — BuildOp thành stack sửa-lại-được', he: 'BuildRecipe', dot: 2, trangThai: 'chua',
    bangChung: [{ dir: 'lib/three', mau: 'BuildRecipe' }] },
  { id: 'snap-hop-nhat', vai: 'day', ten: 'Bắt Điểm Hợp Nhất — một engine 2D↔3D', he: 'SnapCore', dot: 2, trangThai: 'chua',
    bangChung: [{ dir: 'lib', mau: 'SnapCore' }] },
  { id: 'num-strip', vai: 'do', ten: 'Dải số nổi tại điểm thả (touch, nối vcb)', he: 'NhapLenh', dot: 2, trangThai: 'chua',
    bangChung: [{ dir: 'components', mau: 'NumStrip' }] },
  { id: 'pie-menu-3d', vai: 'do', ten: 'Đĩa lệnh theo đối tượng cho 3D (tái dùng RadialToolMenu)', he: 'NhapLenh', dot: 2, trangThai: 'chua',
    bangChung: [{ dir: 'components/render-studio', mau: 'RadialToolMenu' }] },
  { id: 'team-fit', vai: 'do', ten: 'Máy Hiểu Người (hồ sơ nguồn thành viên, gợi ý kèm căn cứ)', he: 'TriTueDuAn', dot: 2, trangThai: 'chua',
    bangChung: [{ dir: 'lib', mau: 'TeamFitEngine|hoSoNguonThanhVien' }] }, // 'TeamFit' trần vấp comment scaffolder
  // 11/08 tối — Hoà đặt bài "DNA công ty + smart transfer + nhãn trung tính để reset":
  { id: 'company-dna-pack', vai: 'mvp', ten: 'Hồ Sơ Công Ty (quy trình·quy định·gu·thư viện riêng — tham chiếu, không nhúng cứng)', he: 'TriTueDuAn', dot: 2, trangThai: 'chua',
    bangChung: [{ dir: 'lib', mau: 'CompanyDnaPack|HoSoCongTy' }] },
  { id: 'smart-ingest', vai: 'day', ten: 'Smart Ingest/Transfer — XUẤT NHẬP ĐA ĐỊNH DẠNG CƯỠNG CHẾ (Hoà nâng 12/08): nhập bất kỳ → nền TỰ chuyển định dạng + nén proxy tối ưu cho môi trường IF (gốc bất biến, xuất/in về gốc) → xuất đa đích linh hoạt; card tiến trình Smart Transfer là mặt visual', he: 'DocCore', dot: 2, trangThai: 'chua',
    bangChung: [{ dir: 'lib', mau: 'SmartIngest|IngestRouter' }] },
  { id: 'nhan-nguon-reset', vai: 'day', ten: 'Nhãn nguồn DataOrigin (app-core/studio/project/demo) trên mọi bản ghi + lệnh reset về trung tính', he: 'DocCore', dot: 2, trangThai: 'chua',
    bangChung: [{ dir: 'lib', mau: 'DataOrigin|NHAN_NGUON' }] },

  // 11/08 khuya — Hoà giao batch chat/khởi tạo/họp (3 agent mock+spec đang chạy):
  { id: 'presence-avatar-row', vai: 'do', ten: 'Dãy avatar online màu/offline trắng-đen (12/08: PresenceRow thay stack trong PresenceBar, khử hex ngoài token)', he: 'LightState', dot: 1, trangThai: 'xong',
    bangChung: [{ dir: 'components', mau: 'PresenceRow|presence-row' }] },
  { id: 'activity-feed', vai: 'day', ten: 'Dòng Hoạt Động dự án (ref #13): filter Tất-cả/Của-tôi/Đội, event card theo loại + thread inline — bề mặt nhận push Cổng Duyệt, phiếu điều chỉnh họp, báo đổi vật liệu', he: 'Workspace', dot: 2, trangThai: 'chua',
    bangChung: [{ dir: 'components', mau: 'ActivityFeed|DongHoatDong' }] },
  { id: 'vitals-3-window', vai: 'mvp', ten: 'Vitals 3 cấp window theo Siri mới (ref #14): ① pill/thẻ kết quả tại chỗ ② thẻ hội thoại nổi ③ trang phiên đầy đủ — kèm nấc giảm chói kính', he: 'ThinkDial', dot: 2, trangThai: 'chua',
    bangChung: [{ dir: 'components', mau: 'VitalsWindowTier|vitals-tier' }] },
  { id: 'hover-gradient-kem', vai: 'do', ten: 'Highlight gradient kem khi hover/select (ref #15) trên canvas tone be/xám-đen — chỉ phần tử chọn được, reduce-motion tức thì', he: 'LightState', dot: 2, trangThai: 'chua',
    bangChung: [{ dir: 'app', mau: 'hover-gradient-kem|--hl-kem' }] },
  { id: 'chat-ai-notebook', vai: 'do', ten: 'Stage chat nhóm bố cục NotebookLM (nguồn trái · luồng giữa · chưng cất phải) + toggle AI tham vấn', he: 'Workspace', dot: 2, trangThai: 'chua',
    bangChung: [{ dir: 'components', mau: 'ChatNhomAi|AiGroupChat' }] },
  { id: 'project-init-board', vai: 'do', ten: 'Bảng khởi tạo v1 (12/08 giao sớm cùng project-profile: 3 mảnh + căn cứ; phân quyền thư mục/gán chủ trì còn mờ chờ fm-quyền)', he: 'TriTueDuAn', dot: 2, trangThai: 'xong',
    bangChung: [{ dir: 'components', mau: 'ProjectInitBoard|BangKhoiTao' }] },
  { id: 'meeting-distill', vai: 'mvp', ten: 'Họp → nháp biên bản (biểu mẫu kho chuẩn) → chủ trì duyệt → 3 dòng: quyết định/việc/phiếu điều chỉnh gắn ĐỐI TƯỢNG (định tuyến theo entity, không theo chặng). KHÔNG tự xây engine video — nhận bản ghi từ ngoài', he: 'Workspace', dot: 3, trangThai: 'chua',
    bangChung: [{ dir: 'lib', mau: 'MeetingDistill|BienBanHop' }] },

  { id: 'neufert-tach-goi', vai: 'day', ten: 'Tách Neufert ra GÓI DỮ LIỆU ngoài repo (Hoà gật 12/08 — sách Wiley có bản quyền; app giữ cơ chế RuleGroup, gói nạp qua Kho tri thức/Company DNA Pack; nội bộ dùng tiếp, tách trước khi có người ngoài)', he: 'DocCore', dot: 3, trangThai: 'chua',
    bangChung: [{ file: 'lib/cad/standards/registry.ts', mau: "from '\\./neufert'", can: false }] },
  { id: 'color-system-packs', vai: 'day', ten: 'Hệ màu hãng thành GÓI NẠP NGOÀI: Pantone · Jotun · Dulux (Hoà 12/08: đưa hệ màu trở lại cho KTS chọn — cùng cơ chế pack như Neufert: app trung tính, studio tự nạp catalog, DataOrigin nhãn nguồn, map về matId)', he: 'LibraryFirst', dot: 3, trangThai: 'chua',
    bangChung: [{ dir: 'lib', mau: 'ColorSystemPack|colorPack' }] },
  // ── ĐỢT 3 · RA CỔNG ─────────────────────────────────────────────────────────
  { id: 'chat-project', vai: 'day', ten: 'Chat theo dự án (ChatMessage + projectId)', he: 'Workspace', dot: 3, trangThai: 'chua',
    bangChung: [{ file: 'prisma/schema.prisma', mau: 'model ChatMessage \\{[^}]*projectId' }] },
  { id: 'comment-neo-doi-tuong', vai: 'day', ten: 'Comment ghim vào đối tượng/vị trí (PHIẾU 5 Collaborate — XÂY MỚI, không phải nối dây)', he: 'Workspace', dot: 3, trangThai: 'chua',
    bangChung: [{ file: 'prisma/schema.prisma', mau: 'model Comment \\{[^}]*entityId' }] },
  { id: 'review-gate', vai: 'mvp', ten: 'Cổng Duyệt nội bộ: mốc time → Vitals push deep-link cho sếp/bộ phận → xem+note (gõ/voice-to-text) → note gom thành checklist chỉnh sửa → sạch mới gửi mail. CĐT ở NGOÀI hệ (chốt 11/08 khuya)', he: 'Workspace', dot: 3, trangThai: 'chua',
    bangChung: [{ dir: 'lib', mau: 'ReviewGate|CongDuyet' }] },
  { id: 'dwg-tach-tien-trinh', vai: 'day', ten: 'DWG converter tách tiến trình (mere aggregation)', he: 'DocCore', dot: 3, trangThai: 'chua',
    bangChung: [{ dir: 'scripts', mau: 'dwg-converter|dwgConverterProcess' }] },
];
