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
  { id: 'task-context', ten: 'Dây Việc–Ngữ Cảnh (Task mang stage/workspace/entity)', he: 'Workspace', dot: 1, trangThai: 'chua',
    bangChung: [{ file: 'prisma/schema.prisma', mau: 'model Task \\{[^}]*workspaceId' }] },
  { id: 'library-data-that', ten: 'Thư viện đọc kho THẬT (bỏ mock)', he: 'LibraryFirst', dot: 1, trangThai: 'chua',
    bangChung: [{ file: 'lib/library/shelves.ts', mau: 'LIBRARY_DATA_IS_MOCK = true', can: false }] },
  { id: 'fm-data-that', ten: 'File Manager đọc đĩa THẬT (bỏ mock-data)', he: 'LibraryFirst', dot: 1, trangThai: 'chua',
    bangChung: [{ file: 'lib/filemanager/queries.ts', mau: "mock-data", can: false }] },
  { id: 'think-dial', ten: 'Nấc Suy Nghĩ — cần gạt 4 nấc Vitals', he: 'ThinkDial', dot: 1, trangThai: 'chua',
    bangChung: [{ dir: 'components', mau: 'ThinkDial' }] },
  { id: 'light-arc', ten: 'LightArc — cung sáng tiến độ (upload/queue/xuất)', he: 'LightState', dot: 1, trangThai: 'chua',
    bangChung: [{ dir: 'components/ui', mau: 'LightArc' }] },
  { id: 'capture-nut', ten: 'Nút xuất PNG sequence (rời route bench)', he: 'DocCore', dot: 1, trangThai: 'chua',
    bangChung: [{ dir: 'components', mau: 'import \\{[^}]*captureSequence' }] },

  // ── ĐỢT 1b · CHẤT LƯỢNG ĐẦU RA (11/08 — soi MẮT file layout.pdf xuất thật, lần đầu
  //     nghiệm thu sản phẩm thay vì code; 3 lỗi khiến bản vẽ "chưa cầm đi gặp khách được") ──
  { id: 'label-ne-hinh', ten: 'Nhãn phòng/dim NÉ hình học khi xuất (PDF: chữ đè giường/WC/dim chồng nhau)', he: 'DocCore', dot: 1, trangThai: 'chua',
    bangChung: [{ dir: 'lib/cad', mau: 'avoidLabelCollision|LabelPlacer' }] },
  { id: 'ty-le-chuan', ten: 'Bắt tỷ lệ về nấc chuẩn khi fit trang (PDF in "1:47" — nghề chỉ có 1:50/1:100)', he: 'DocCore', dot: 1, trangThai: 'chua',
    bangChung: [{ dir: 'lib', mau: 'snapToStandardScale|STANDARD_SCALES' }] },
  { id: 'khung-ten-sach', ten: 'Khung tên sạch jargon + đủ ô (mã bản vẽ·ngày·người vẽ/kiểm; bỏ "(đã rà công năng)")', he: 'DocCore', dot: 1, trangThai: 'chua',
    bangChung: [{ dir: 'lib/cad', mau: 'drawingNumber|soHieuBanVe' }] },

  { id: 'chuan-dau-ra-gate', ten: 'Máy chặn CHUAN-DAU-RA-NGHE lúc xuất (mở rộng export-checks)', he: 'DocCore', dot: 1, trangThai: 'chua',
    bangChung: [{ dir: 'lib/print', mau: 'CHUAN_DAU_RA' }] },

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

  // ── ĐỢT 3 · RA CỔNG ─────────────────────────────────────────────────────────
  { id: 'chat-project', ten: 'Chat theo dự án (ChatMessage + projectId)', he: 'Workspace', dot: 3, trangThai: 'chua',
    bangChung: [{ file: 'prisma/schema.prisma', mau: 'model ChatMessage \\{[^}]*projectId' }] },
  { id: 'dwg-tach-tien-trinh', ten: 'DWG converter tách tiến trình (mere aggregation)', he: 'DocCore', dot: 3, trangThai: 'chua',
    bangChung: [{ dir: 'scripts', mau: 'dwg-converter|dwgConverterProcess' }] },
];
