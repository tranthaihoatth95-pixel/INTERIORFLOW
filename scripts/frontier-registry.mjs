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
  { id: 'dna-card', vai: 'mvp', ten: 'Thẻ DNA Thiết kế (12/08 Đợt 4: DistillEngine generic lib/distill + 8 lớp đúng NC:53 + cờ 3 nấc + lưu JSON per-project không bảng mới + panel Tổng quan; chọn ảnh tay vì LibraryAsset chưa có projectId — biên đề xuất T: cơ chế provenance project chung)', he: 'TriTueDuAn', dot: 1, trangThai: 'xong',
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
  { id: 'capture-nut', vai: 'do', ten: 'Nút xuất PNG sequence (14/08 CS: tab Camera Command3DPanel thay placeholder — CameraExportTab, zip qua jszip, LightArc tiến độ khung i/n + Huỷ AbortSignal, thiếu campath nút mờ kèm lý do; captureSequenceAsync additive nhả event-loop; giới hạn thật: PNG xám 0-credit, 1920×1080/15fps, trần 600 khung)', he: 'DocCore', dot: 1, trangThai: 'xong',
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
  { id: 'gallery-lien-nganh', vai: 'mvp', ten: 'GALLERY liên ngành (12/08 Đợt 4: route /library/gallery + quy ước tag nganh/license/nguon/bosuutap trên LibraryAsset 0 cột mới + bộ sưu tập bắt buộc nguồn + chặn Pinterest; seed 17 ảnh đã gắn tag trong script — CẦN CHẠY LẠI SEED để tag vào DB; đề xuất K: PATCH /api/library/[id] cho đề xuất nguồn ghi thật)', he: 'LibraryFirst', dot: 2, trangThai: 'xong',
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
  { id: 'hieu-nang-do', vai: 'do', ten: 'ĐO hiệu năng có số (13/08 P: bench tất định 500/2k/5k entity — điểm gãy pickHatchFace O(N²) hatch.ts:502 ×6,7 khi N×2,5; docToObjScene tuyến tính OK; 100k tam giác chưa chạm ở 5k entity nhưng recipe 10 bước nhân 660× tam giác/cấu kiện; kệ 1.500 ảnh cần browser = hàng đợi; việc SỬA pickHatchFace = entry mới đợt sau)', he: 'DocCore', dot: 2, trangThai: 'xong',
    bangChung: [{ dir: 'scripts/bench', mau: 'bench-2d|mulberry32' }] }, // 13/08: mẫu cũ trỏ .md — máy soi chỉ quét code, trỏ lại scripts/bench
  { id: 'focus-entity-doc', vai: 'day', ten: 'Chặng đọc ?focusEntity (12/08: 2D select+bay camera · Trình chiếu nhảy trang; round-trip test khoá chung hằng với deep-link; nhánh 3D theo phiếu D)', he: 'Workspace', dot: 2, trangThai: 'xong',
    bangChung: [{ dir: 'components', mau: 'focusEntity' }] },
  { id: 'tao-viec-tu-day', vai: 'day', ten: 'Tạo việc từ đây (12/08: 2D menu chuột phải theo tên đối tượng thật · Trình chiếu nút Inspector trang, thiếu projectId thì mờ kèm lý do; nhánh 3D theo phiếu D)', he: 'Workspace', dot: 2, trangThai: 'xong',
    bangChung: [{ dir: 'components', mau: 'taoViecTuDay|createTaskFromContext' }] },
  { id: 'camera-pro', vai: 'do', ten: 'Camera mức nghề (2 điểm tụ · tiêu cự mm · DOF · safe frame · tỉ lệ khung — chốt 03/08 "rất cần cho góc nhìn/view/video"): thay tab Camera placeholder', he: 'BuildRecipe', dot: 2, trangThai: 'chua',
    bangChung: [{ dir: 'components/render-studio', mau: 'CameraPro|twoPointPerspective' }] },
  // ── ĐỢT 2 · LÕI DỰNG ────────────────────────────────────────────────────────
  { id: 'tool-state-3d', vai: 'day', ten: 'Máy trạng thái công cụ 3D (12/08: useTool3D + Tool3DBar nhập số, dock disabled 12→5, gizmo-first giữ nguyên; nhánh 3D focusEntity+tạo-việc luôn; còn click-điểm viewport = đề xuất đợt sau)', he: 'NhapLenh', dot: 2, trangThai: 'xong',
    bangChung: [{ file: 'components/render-studio/ToolDock3D.tsx', mau: 'CHUA_DUNG_DUOC', can: false }] },
  { id: 'build-recipe', vai: 'mvp', ten: 'Công Thức Khối (12/08 Đợt 4: evalRecipe + Base.recipe additive không vỡ .idf cũ + UI ngăn xếp tab Sửa; ops[]/opsDisabled cũ giữ nguyên — recipe ưu tiên khi có; nợ D2 flag: opsDisabled 0 caller + hasOpsGeometry nhánh ops[] sót array/mirror/shape)', he: 'BuildRecipe', dot: 2, trangThai: 'xong',
    bangChung: [{ dir: 'lib/three', mau: 'BuildRecipe' }] },
  // 13/08 Đợt 5 — Hoà chốt kép: ĐỢT GIAO DIỆN THỐNG NHẤT + HOME "Dòng Studio" (00-CHOT 13/08):
  { id: 'home-dong-studio', vai: 'mvp', ten: 'HOME bento v4 (13/08 H1d sau 2 lần Hoà lật: CO GIÃN THEO ĐỘ DÀY DỮ LIỆU 3 nấc, widget dưới ngưỡng không render, seed CẤM lên Home, card fix tên+avatar+token theme, cung mặt trời đậm, shadow phân tầng sáng — T verify DOM app thật: seed sạch, tự ẩn đúng, card chuẩn, 1 màn; độ ĐẸP theme sáng chờ mắt Hoà)', he: 'Workspace', dot: 5, trangThai: 'xong',
    bangChung: [{ dir: 'components/home', mau: 'DongStudio|dong-studio' }] },
  { id: 'panel-handle-chung', vai: 'do', ten: 'Tay cầm thu/mở panel dùng chung — ĐÃ CÓ từ 07/08 dưới tên PanelFlank (ad2d23b): components/ui/PanelFlank.tsx lắp LibrarySheet + Render3DModeSkeleton + AppShell/FlankStrip; H2 13/08 phát hiện sổ ghi sai tên marker ("PanelHandle") nên soi lọt — đúng ca "khai chưa mà code có". Navigator 2D giữ cơ chế riêng CÓ CHỦ ĐÍCH (rail điều hướng có hàng nút đáy, không phải panel mép — T chốt 13/08)', he: 'DocCore', dot: 5, trangThai: 'xong',
    bangChung: [{ dir: 'components/ui', mau: 'PanelFlank' }] },
  { id: 'mat-do-con-tro', vai: 'do', ten: 'Token mật độ con trỏ đủ 5 (13/08 H3: +--pad-card/--fs-ui globals.css:117 + override cảm ứng :167; áp 28 chỗ hardcode trùng giá trị mặc định trong 7 file inline-style; 28 lượt Tailwind trùng số = hàng đợi có chủ ý, tránh đổi thị giác)', he: 'DocCore', dot: 5, trangThai: 'xong',
    bangChung: [{ file: 'app/globals.css', mau: '--fs-ui' }] },
  { id: 'hinh-hoc-v2', vai: 'do', ten: 'Radius v2 (13/08 H3: 442→335, 114 chỗ trong 12 file hàng đợi về thang theo bảng §3d — số literal khớp nấc 6/10/14/20, không ép var; 12 file rời top vi phạm)', he: 'DocCore', dot: 5, trangThai: 'xong',
    bangChung: [{ file: 'components/render-studio/LightTab.tsx', mau: 'rounded-\\[(?:6|10|14|20)px\\]' }] }, // T ghi nhầm studio/ + đòi var — sửa theo khuôn migrate thật
  { id: 'tu-dien-mocks-sach', vai: 'do', ten: 'Từ điển mocks sạch (13/08 H3: 77→0 lệch trong 42 file + 1 chỗ breadcrumb né máy soi sửa tay; ~15-20 "Trình bày" giữa câu văn xuôi = từ điển cố ý không bắt)', he: 'DocCore', dot: 5, trangThai: 'xong',
    bangChung: [{ dir: 'docs/mocks', mau: 'Trình bày', can: false }] },
  { id: 'hotkey-registry', vai: 'day', ten: 'MỘT registry lệnh+phím toàn app (chốt 10/08): tooltip/⌘K/bảng ⌘/ đọc chung một nguồn, lệnh chưa đủ điều kiện hiện mờ kèm lý do — thi công đợt sau, entry mở để sổ không quên', he: 'NhapLenh', dot: 6, trangThai: 'chua',
    bangChung: [{ dir: 'lib', mau: 'HotkeyRegistry|hotkey-registry' }] },
  { id: 'grounded-render', vai: 'mvp', ten: 'GROUNDED RENDER v0 XONG (13/08 GR: lib/grounded-render types+reference-sheet+region-inpaint, 2 node ai.refsheet "Phiếu đọc tham khảo"·ai.regionrender "Render bám ý (mảng)" — cửa duyệt phiếu TRƯỚC inpaint [T5], mask thiếu = lỗi cứng, guidance import hằng F2 không chép số; phiếu cấp ①③ nối VLM thật, cấp ②④ khung chờ route vision nhận prompt; 41 test) — v1 bảng ánh xạ+núm per-mảng+SAM2 · v2 metrology+kéo-thả đường vùng CÒN CHỜ (SPEC-GROUNDED-RENDER §4)', he: 'TriTueDuAn', dot: 6, trangThai: 'xong',
    bangChung: [{ dir: 'lib', mau: 'GroundedRender|grounded-render' }] },
  { id: 'triet-ly-if', vai: 'day', ten: 'TRIẾT LÝ IF thành văn bản lập hiến (13/08 P1: cây T0-T8 + 2 trục N1-N2 + 6 điều hành Đ1-Đ6, mã điều khoản trích được; nối dây khuôn phiếu §3 + khuôn plan §2b; KPI: số vòng làm-lại do lệch định hướng phải giảm — V đếm; 2 đợt không phiếu nào trích = chết lâm sàng, V báo)', he: 'DocCore', dot: 7, trangThai: 'xong',
    bangChung: [{ file: 'docs/TRIET-LY-IF.md', mau: 'Đ3' }, { file: 'docs/HOP-DONG-PHOI-HOP-T.md', mau: 'TRIET-LY-IF' }] },
  { id: 'nhip-van-hanh-p2', vai: 'day', ten: 'P2 nhịp vận hành (13/08: BƯỚC 0 soi tổng→chi tiết mỗi đợt [T4][Đ1] + THẺ VAI tự chứa 4 dòng [Đ4] + điều kiện nghiệm thu phân loại [Đ6] — vá HOP-DONG; đợt kế là ca chạy thử, V kiểm thêm mục làm-ngoài-vai)', he: 'DocCore', dot: 7, trangThai: 'xong',
    bangChung: [{ file: 'docs/HOP-DONG-PHOI-HOP-T.md', mau: 'BƯỚC 0|THẺ VAI TỰ CHỨA' }] },
  { id: 'nc-triet-ly-giao-dien', vai: 'day', ten: 'NC triết lý giao diện (Hoà giao 14/08 kèm 19 ảnh chat + 51 ảnh ~/Downloads/tham khao ui): cụm cơ chế từ ảnh ref + nguyên lý top-tier có nguồn + trả lời bài PHÂN LUỒNG (chung hiện · group-by · cử chỉ mở sâu) + chống không-biết-bắt-đầu-từ-đâu — nuôi khuôn nhóm B CHAN-DOAN-DS + spec luong-theo-viec — XONG 14/08: 12 cụm K1-K12/50 ảnh + 7 nguyên lý P1-P7 có nguồn + 3 tầng ①≤9 lệnh chung ②group-by ③cử chỉ/collapse + 4 khuôn KB-1..4 sẵn mock (gốc = dock capsule 3D) + 3 cảnh báo; T audit đạt, CHỜ HOÀ GẬT KHUÔN mới mock', he: 'DocCore', dot: 7, trangThai: 'xong',
    bangChung: [{ file: 'docs/nc/NC-TRIET-LY-GIAO-DIEN-2026-08-14.md', mau: 'PHÂN LUỒNG|phân luồng' }] },
  { id: 'nc-nguyen-tac-toan-app', vai: 'day', ten: 'NC-2 BỘ NGUYÊN TẮC GIAO DIỆN IF cấp toàn app (Hoà giao 14/08: lướt 3 board Pinterest Bentran_tth + tool 3D/render + videocall-trong-workspace): cơ chế theo cấp app/stage/luồng + hệ nút·phím·ký hiệu + visual theo loại trình bày technical/mood/vật liệu-fur → NT-1..n trình Hoà duyệt thành CHUẨN trước khi mock — XONG 14/08 (NB: 43 pin đọc mắt/3 board + K13-K17 mới, K14 chrome-kỹ-thuật-đánh-số 10 pin = chữ ký thị giác đề xuất, K6 kính 0/43; 18 NT + 3 lệch nặng L1-L3; web D5/Corona/Twinmotion có nguồn; T audit đạt) — CHỜ HOÀ DUYỆT NT thành chuẩn', he: 'DocCore', dot: 7, trangThai: 'xong',
    bangChung: [{ file: 'docs/nc/NC-NGUYEN-TAC-GIAO-DIEN-TOAN-APP-2026-08-14.md', mau: 'NT-1' }] },
  { id: 'intro-day-chuyen', vai: 'do', ten: 'Intro video "Dây chuyền · Bung nở · Một Nguồn" (Hoà đặt ý 14/08: dây chuyền → bung ra → co cụm 1 nguồn sự thật → logo |F + triết lý; KHÔNG CÓ NGƯỜI; vibe quiet-luxury art từ board what-i-see K17/K14/K8) — kịch bản 5 cảnh 9s một cú máy + 3 phương án câu triết lý CHỜ HOÀ CHỌN; thi công theo CHOT-INTRO-VIDEO 02/08 (video thay code), khúc bản vẽ có thể xuất từ engine 2D thật', he: 'Workspace', dot: 7, trangThai: 'chua',
    bangChung: [{ dir: 'components/entry', mau: 'IntroVideo|intro.*\\.mp4' }] },
  { id: 'present-magic-cua-vao', vai: 'mvp', ten: 'Magic = CỬA VÀO chặng 3 (Hoà phê 14/08: "800 bước mới tới AI, ô AI không ra AI nhập liệu không ra nhập liệu"): thêm lối "Máy dựng trước — tôi duyệt" NGAY TaskFirstStart (1 bước tới Magic, đúng chốt auto-deck 07/08 + P5 bắt-đầu-từ-việc) + tách ô nhập 2 vai rõ: prompt-bar AI đúng nghĩa (ref K12/C9) ≠ form dữ liệu; GenerateFlow thành mặt tiền được gọi từ cửa, không phải card chôn trong panel', he: 'Workspace', dot: 7, trangThai: 'chua',
    bangChung: [{ dir: 'components/present-editor', mau: 'magic-cua-vao|MagicEntry' }] },
  // 14/08 — Hoà chê khi duyệt mắt: "giao diện rất xấu, không thống nhất theo design system" — T ghi entry ngay:
  { id: 'dong-bo-ds-mat', vai: 'day', ten: 'ĐỒNG BỘ DS BẰNG MẮT — đợt A XONG (14/08: T chụp 7 màn + CHAN-DOAN-DS-MAT 6 bug hệ thống/6 lệch cấu trúc; DA sửa GỐC BỆNH FONT var chết → Times thường trực + statusbar đè + Files hẹp vỡ + jargon + đỏ sai nghĩa; DR rút radius 334→10 ngoài thang −97%, 107 file thuần radius) — NHÓM B cấu trúc (một khuôn thanh công cụ 3 stage · EmptyState chung · thumbnail strip) CHỜ ảnh tham khảo Hoà → mock Claude Design/Figma rồi mở phiếu riêng', he: 'DocCore', dot: 7, trangThai: 'xong',
    bangChung: [{ file: 'docs/CHAN-DOAN-DS-MAT-2026-08-14.md', mau: 'GỐC BỆNH|A1' }] },
  // 13/08 đêm — finding LÔ DUYỆT MẮT #1 của Hoà (điều hướng về Home lag) — T ghi entry ngay:
  { id: 'home-nav-lag', vai: 'do', ten: 'Điều hướng về Home lag — ĐO RỒI SỬA (14/08 NL: 15 component gated sang dynamic ssr:false qua heavy-panels.tsx — chunk route / 28,6→24,2 MB dev, −274 module, three-bvh ra hẳn, load warm 1209→1041ms; first-paint giữ tĩnh LoginScreen·DongStudioHome·AppShell·FlowCanvas) — cảm nhận hậu-login chờ MẮT Hoà; nếu vẫn lag thì nghi phạm kế là chuỗi fetch sau mount, phiếu riêng; 14/08 Hoà bấm lại XÁC NHẬN HẾT LAG', he: 'Workspace', dot: 7, trangThai: 'xong-mat',
    bangChung: [{ file: 'components/home/heavy-panels.tsx', mau: "dynamic\\(" }, { file: 'components/home/HomeScreen.tsx', mau: 'heavy-panels' }] },
  // 13/08 đêm — Hoà gật lộ trình P5-P6 ("ok tiếp" sau tổng kết đợt #2) — T ghi entry ngay lúc chốt:
  { id: 'feature-contract-may', vai: 'day', ten: 'P5 FeatureContract máy XONG (13/08 FC: contract-registry 22 entry đủ 4 câu = 20 có-dây + 2 chờ-dây capture-sequence·lux-l6; soi:contract 3 chiều regress/mất-dây/sổ-quên, day-pattern import-based né comment; PHÁT HIỆN LỚN: 12/14 kho sổ 08/08 hoá ra ĐÃ MỞ — eyedropper·vcb·export V-Ray/D5·brief-PDF·T2-recipe·build-ops union·registry lệnh·accent-warm·GuProfile 2 caller thật + 4 kho đã biết; sổ giấy mốc trong 5 ngày, từ nay máy canh)', he: 'DocCore', dot: 7, trangThai: 'xong',
    bangChung: [{ file: 'scripts/soi-contract.mjs', mau: 'anTheo' }, { file: 'scripts/contract-registry.mjs', mau: 'anTheo' }] },
  { id: 'if-rna-v0', vai: 'mvp', ten: 'P6 IF-RNA v0 XONG (14/08 RN: lib/rna IfRnaField + material-pbr.rna 19/19 key + RnaPanel generic collapse-theo-nhóm; editor 332→299 dòng, chuỗi nhãn field 14+→0; sửa-1-chỗ-lan-mọi-nơi chứng minh trên app thật /materials, anTheo điều khiển badge SUY ĐOÁN; drift-guard tsc 2 chiều; giữ tay khai thật: enum/quả cầu/5 trường object; 72 test — T soi mắt panel trên browser ĐẠT) — nhân rộng BuildOp theo 4 điều kiện trong báo cáo RN, chưa làm', he: 'DocCore', dot: 7, trangThai: 'xong',
    bangChung: [{ dir: 'lib', mau: 'IfRna|if-rna' }] },
  // 13/08 — T ghi bù 2 entry chuỗi nền P3/P4 đã được Hoà chốt cùng ngày (plan 4 phiên nền móng)
  // nhưng chưa vào registry — đúng ca "chốt không vào registry = chưa chốt", sổ quên tự bắt:
  { id: 'he-luat-thao-tac', vai: 'day', ten: 'P3 Hệ Luật Thao Tác (13/08 LT: kho 36 luật = 17 grep + 19 mắt chưng cất từ ~10 spec UI, mỗi luật có nguồn + tội danh 1-7 [N1][Đ5]; soi:thao-tac 3 kiểu điều kiện, exit 1 khi lệch, nợ mắt nhóm theo tội danh; lần chạy đầu bắt 5 lệch thật code app — Webkit prefix 18 file · focus-visible 31 · keydown né ô nhập 12 · chữ "tự động" 17 · hex inline 193 — là HÀNG ĐỢI SỬA đợt sau; 13/08 đêm TT+PE đã trả 3 luật cơ khí VỀ 0 kể cả present-editor, còn focus-visible + hex inline chờ mắt design)', he: 'DocCore', dot: 7, trangThai: 'xong',
    bangChung: [{ file: 'scripts/soi-thao-tac.mjs', mau: 'toiDanh' }, { file: 'scripts/thao-tac-registry.mjs', mau: 'toiDanh' }] },
  { id: 'goi-ho-so-song', vai: 'mvp', ten: 'P4 Gói Hồ Sơ Sống v0 XONG (13/08 HS: lib/ho-so-song manifest v1 + sha256 WebCrypto + packHoSoSong jszip + viewer HTML TỰ CHỨA — JSON nhúng script tag, 0 mạng ngoài khoá bằng test regex, tone kem editorial song ngữ, kênh vắng khai thật; điểm cắm Toolbar Trình chiếu "Gói Hồ Sơ (.zip)" gom .idfp + ảnh trang + BOQ best-effort; 22 test; gói mẫu T đã mở mắt; 13/08 đêm PE: kênh PDF ĐÃ NỐI — exportDeckToPdfBlob additive + fail-open, gói mẫu có out/ho-so.pdf T mở mắt) — treo: viewer nên thành mặt tiền chung xem-gói cho Story Set/.idfc, không đẻ viewer thứ hai', he: 'DocCore', dot: 7, trangThai: 'xong',
    bangChung: [{ dir: 'lib', mau: 'HoSoSong|ho-so-song' }] },
  { id: 'fix-f2-node-render', vai: 'do', ten: 'Fix F2 (13/08 R: CONTROL_GUIDANCE_DEFAULT 3.5 cho sketch2render/clay2render/exterior + controlImageSize ≤1024 bội-8 fail-open; styleTransfer/staging kiểm không dính; test scaleToMaxSide bị gỡ vì sucrase không đọc tsconfig paths — nợ hạ tầng test đã có từ trước, verify tay 12/12)', he: 'DocCore', dot: 5, trangThai: 'xong',
    bangChung: [{ file: 'lib/nodes/registry.ts', mau: 'image_size' }] },
  { id: 'kien-truc-tool-3-lop', vai: 'mvp', ten: 'Kiến trúc tool 3 lớp (Hoà chốt 13/08): thanh chung luôn hiện · gói group-by chọn được · master node = mini-tool sâu; chặng 2 chỉ Canvas+Vẽ 3D; video tạo+dựng về chặng 2, chặng 3 chỉ trình chiếu+filter — spec + thi công đợt Giao-diện-thống-nhất phần LUỒNG', he: 'Workspace', dot: 6, trangThai: 'chua',
    bangChung: [{ file: 'docs/SPEC-TOOL-3-LOP.md', mau: 'LỚP 1' }] },
  { id: 'dan-y-cho-san', vai: 'mvp', ten: 'Dàn Ý Chờ Sẵn (Hoà chốt 13/08): ý đã chốt ở chặng 2 (storyline·moodboard·Thẻ DNA·notes) → máy gói thành dàn ý deck đợi ở chặng 3 (trang + nội dung + asset + Brand Kit map) — mặt tiền thứ 4 DistillEngine, trình qua ProposalSheet; giết painpoint take-note-rồi-quên', he: 'TriTueDuAn', dot: 6, trangThai: 'chua',
    bangChung: [{ dir: 'lib', mau: 'DanYChoSan|deckOutline' }] },
  // 13/08 — DOGFOOD #1, Hoà chê thật "rối rắm, đang gấp không biết đường lần" (finding F1):
  { id: 'present-task-first', vai: 'mvp', ten: 'Trình chiếu dẫn THEO VIỆC (13/08 H4 sửa nóng F1: TaskFirstStart 3 lối + lối phụ ảnh-đã-dựng · toolbar 6 nút chính + nhóm Hình/⋯ · banner học-gu → toast 6s · cột phải chỉ hiện khi có nội dung — agent verify browser thật; toast chưa bắt được bằng mắt = nợ nhỏ)', he: 'Workspace', dot: 5, trangThai: 'xong',
    bangChung: [{ dir: 'components/present-editor', mau: 'task-first|TaskFirstStart' }] },
  { id: 'luong-theo-viec', vai: 'mvp', ten: 'Chuẩn LUỒNG THEO VIỆC toàn app (bệnh gốc F1: UI liệt kê công cụ, không dẫn theo việc) — nghiên cứu + spec tầng "lối vào theo việc" cho người gấp, áp 2D/3D/Trình chiếu — thi công đợt kế', he: 'Workspace', dot: 6, trangThai: 'chua',
    bangChung: [{ dir: 'docs', mau: 'SPEC-LUONG-THEO-VIEC' }] },
  // 13/08 — Hoà chốt Smart Convert (mở rộng smart-ingest, xem 00-CHOT 13/08):
  { id: 'smart-convert-pdf', vai: 'day', ten: 'Smart Convert bậc 1 (13/08 SC: pdfToDeck — lớp CHỮ thật toạ độ+cỡ giữ nguyên, dấu Việt chuẩn, trang scan badge OCR-bậc-2, cắm cửa Mở tệp, verify browser 1→3 slide; lớp Nền raster CHƯA làm — cần @napi-rs/canvas bị cấm dep, nợ bậc 1b; fix detached ArrayBuffer)', he: 'DocCore', dot: 5, trangThai: 'xong',
    bangChung: [{ dir: 'lib/present-editor', mau: 'pdf-import|pdfToDeck' }] },
  // 12/08 Đợt 4 — T mở entry theo uỷ quyền plan (docType đầu = schedule "Bảng thống kê"):
  { id: 'editor-bang-bieu-mau', vai: 'mvp', ten: 'Engine bảng chung (12/08 Đợt 4: TableDocEngine trừu tượng từ boq-overrides/boq-group + schedule "Bảng thống kê" cửa/phòng giữ entityId + re-sync không đè ô tay + thẻ thật trong picker, BOQ 0 hồi quy; BoqScreen chưa rewire qua engine — chủ đích, chờ verify browser; spec-sheet/approval-form là mặt tiền sau)', he: 'Workspace', dot: 4, trangThai: 'xong',
    bangChung: [{ dir: 'lib/present-editor', mau: 'TableDocEngine' }] },
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
