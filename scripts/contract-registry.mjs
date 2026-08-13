/**
 * scripts/contract-registry.mjs — SỔ DÂY FeatureContract MÁY-ĐỌC (P5 bậc 1, Hoà gật 13/08 đêm).
 *
 * Bệnh gốc (anti-pattern #1): "lõi dày, tính năng lẻ tẻ, KHÔNG sợi dây liên kết" — đo 08/08
 * có 14 kho code+test xong mà 0 nơi gọi (DOI-CHIEU-42-SPEC §1). FeatureContract 4 câu đã CHỐT
 * 11/08 nhưng chỉ nằm trong docs. File này máy hoá nó: mỗi engine/tính năng = 1 entry khai
 * 4 câu chữ người đọc + 2 điều kiện máy soi; `soi-contract.mjs` grep code thật, báo đỏ 2 chiều.
 * Đây là SỔ DÂY của luật [T2] "một cỗ máy, nhiều mặt tiền" — engine mất dây là máy báo,
 * không đợi ai đối chiếu tay 42 spec nữa. [T6][Đ2]
 *
 * Mỗi entry:
 *   { id, ten,
 *     doc, ghi, congThuc, anTheo,   // 4 CÂU hợp đồng (11/08): Đọc gì · Ghi gì · Để lại công
 *                                   // thức gì · Ai ăn theo — chữ người đọc, không phải regex
 *     loi: { file|dir, mau },       // HÀM LÕI CÓ TÊN — mất khớp = regress (engine bị xoá/đổi tên)
 *     day: { dirs, mau, loaiTru? }, // grep CALLER thật: file khớp trong dirs, NGOÀI module gốc
 *                                   // + ngoài test/spec + ngoài loaiTru — đếm dây thật
 *     trangThai: 'co-day'|'cho-day' }
 *
 * KỶ LUẬT (cùng họ frontier/thao-tac): tính năng/engine MỚI = thêm 1 entry TẠI ĐÂY ngay lúc
 * chốt, trước khi code. Trạng thái từng kho ghi theo GREP CODE HÔM NAY (13/08), KHÔNG chép
 * sổ 08/08 — 12/14 kho cũ hoá ra ĐÃ MỞ trong các đợt 12-13/08. [T0]
 * Miễn khai: các máy soi (soi-frontier/hinh-hoc/tu-dien/thao-tac/contract) — build-tooling,
 * không phải feature app.
 */

export const CONTRACTS = [
  // ── 14 KHO DOI-CHIEU-42-SPEC §1 (08/08) — trạng thái KIỂM LẠI bằng grep 13/08 ──────────

  { id: 'build-ops-9-ham',
    ten: '9 hàm dựng hình 3D (sweep·revolve·loft·bevelEx·chamfer·taper·fillet·arrayRadial·mirror) — ĐÃ MỞ: BuildOp union model.ts:490 nay đủ biến thể, UI tab Sửa gọi',
    doc: 'Hình học nhóm khối trong Doc (Group.positions · baseMm · heightMm · opCutters) + tham số BuildOp đã khai trên entity',
    ghi: 'Geometry three.js dựng lại tất định từ ops — không ghi ngược vào Doc, không giữ state riêng',
    congThuc: 'BuildOp union (lib/cad/model.ts:490) là công thức khai báo tái-chạy-được: extrude/boolean/arrayLinear/arrayRadial/mirror/bevelEx/taper/sweep/revolve',
    anTheo: 'Command3DPanel (tab Sửa) · Object3DInspector · Scene3DViewer · cad-to-obj (xuất OBJ/D5) · BuildRecipe (ngăn xếp non-destructive)',
    loi: { file: 'lib/three/build-ops.ts', mau: 'sweepProfile|revolveProfile' },
    day: { dirs: ['components'], mau: "arrayRadial|bevelEx|prismTapered|'revolve'" },
    trangThai: 'co-day' },

  { id: 'vitals-doc-context',
    ten: 'docContext + violations cho Vitals — ĐÃ MỞ (đợt 4 lúc 12/08, entry frontier vitals-doccontext): client gửi payload thật',
    doc: 'Doc đang mở (summarizeDoc: phòng/tường/đối tượng chọn) + top vi phạm chuẩn (topViolations)',
    ghi: 'Không ghi Doc — chỉ dựng khối ngữ cảnh đã sanitize gửi kèm payload chat AI',
    congThuc: 'DocContext là schema trung gian có sanitizeDocContext — server kiểm lại, không tin client',
    anTheo: 'VitalsGesture (chat Vitals selection-aware) · route ai-assist-chat · ThinkDial 4 nấc',
    loi: { file: 'lib/ai/doc-context.ts', mau: 'summarizeDoc' },
    day: { dirs: ['components/studio'], mau: 'docContext' },
    trangThai: 'co-day' },

  { id: 'capture-sequence',
    ten: 'captureSequence() xuất PNG sequence — CÓ DÂY 14/08: CameraExportTab (tab Camera Command3DPanel) gọi captureSequenceAsync, zip + LightArc + Huỷ',
    doc: 'Scene three.js + đường camera IF_CAMPATH (camPathSampleToThree — cùng hàm khung xem = khung xuất)',
    ghi: 'Dãy PNG từng khung theo duration đường cam — không đụng Doc',
    congThuc: 'planCaptureSequenceFrames tất định: cùng path + duration + fps → cùng dãy khung',
    anTheo: 'Tầng ① SPEC-TRINH-VIDEO-EDITOR (chưa nối) — video tạo+dựng chặng 2 theo chốt 13/08',
    loi: { file: 'lib/three/capture.ts', mau: 'captureSequence' },
    // mau import-based: Scene3DViewer import capture.ts nhưng KHÔNG import captureSequence
    // (chỉ comment nhắc tên) — pattern from-path sẽ báo sổ-quên giả.
    day: { dirs: ['components'], mau: 'import \\{[^}]*captureSequence' },
    trangThai: 'co-day' },

  { id: 'tasks-api',
    ten: '/api/tasks + lib/server/tasks.ts — ĐÃ MỞ (12/08): TaskBoardScreen · ProjectInitBoard · Render3DModeSkeleton · focus-entity gọi thật',
    doc: 'Bảng Task trong DB (migration 20260808000002) + TaskContext {stage, workspaceId?, entityId?}',
    ghi: 'CRUD Task qua API — nguồn duy nhất của Bảng việc/Kanban, client không giữ bản sao riêng',
    congThuc: 'TaskContext additive trên Task — bấm việc nhảy đúng workspace/đối tượng (deep-link)',
    anTheo: 'TaskBoardScreen · ProjectInitBoard (gieo việc scaffold) · Tạo-việc-từ-đây (2D/Trình chiếu) · Gantt/Lịch tương lai',
    loi: { file: 'lib/server/tasks.ts', mau: 'TASK_TABLES_READY' },
    day: { dirs: ['components', 'lib/tasks'], mau: "['\"`]/api/tasks" },
    trangThai: 'co-day' },

  { id: 'eyedropper-matchprop',
    ten: 'Ống hút thuộc tính MATCHPROP — ĐÃ MỞ: CadCanvas import matchPropsOne + nút CadToolbar (CustomEvent cad:eyedropper-toggle)',
    doc: 'Thuộc tính entity nguồn (layer · màu · nét · hatch) người dùng chấm',
    ghi: 'Áp bộ thuộc tính đó lên entity đích trong Doc (qua undo bình thường)',
    congThuc: 'matchPropsOne thuần — một nguồn một đích, không phụ thuộc UI',
    anTheo: 'CadToolbar (nút ống hút) · CadCanvas (luồng chấm-áp) — SPEC-LENH-VE-IF §4 khuyết ①',
    loi: { file: 'lib/cad/eyedropper.ts', mau: 'matchPropsOne' },
    day: { dirs: ['components/cad'], mau: "from '@/lib/cad/eyedropper'" },
    trangThai: 'co-day' },

  { id: 'vcb-go-so',
    ten: 'VCB gõ số sau thao tác (3x · /3) — ĐÃ MỞ: CadCanvas.tsx:2316 parseVcbToken + applyVcbToMoveCopy chạy thật',
    doc: 'Chuỗi người dùng gõ sau thao tác move/copy + baseSpanMm của kế hoạch đang áp',
    ghi: 'Kế hoạch move/copy tính lại TỪ SỐ GỐC mỗi lần gõ (không cộng dồn sai số)',
    congThuc: 'parseVcbToken ngữ pháp SketchUp: số trần · 3x nhân bản · /3 chia đoạn',
    anTheo: 'CadCanvas (2D) · NumStrip dải số touch (entry frontier num-strip, chưa làm) · Dòng lệnh desktop',
    loi: { file: 'lib/commands/vcb.ts', mau: 'parseVcbToken' },
    day: { dirs: ['components'], mau: 'parseVcbToken|applyVcbToMoveCopy' },
    trangThai: 'co-day' },

  { id: 'export-vray-d5',
    ten: 'Xuất V-Ray/D5 từ matId — ĐÃ MỞ: MaterialPbrEditor.tsx:133 gọi toVRayMtl/toD5Material (nút xuất tham số engine)',
    doc: 'MaterialPbr chuẩn glTF của matId (14 thuộc tính, mặc định trung tính khi trống)',
    ghi: 'Không ghi Doc — sinh bản dịch tham số cho engine ngoài (V-Ray: Use Roughness/IOR · D5: metal/rough)',
    congThuc: 'matId là nguồn duy nhất — một vật liệu dịch ra mọi engine, không nhập tay lại',
    anTheo: 'MaterialPbrEditor (nút xuất) · pipeline render ngoài (D5/V-Ray) — moat matId SPEC-MATERIAL-PIPELINE §5',
    loi: { file: 'lib/materials/export-vray.ts', mau: 'toVRayMtl' },
    day: { dirs: ['components'], mau: 'toVRayMtl|toD5Material' },
    trangThai: 'co-day' },

  { id: 'lux-l6',
    ten: 'Lux L6 phương pháp quang thông — CHỜ DÂY: lib/lighting/lux.ts viết 08/08 (roomLuxEstimate + luxVerdict, nguồn IESNA/CIE ghi rõ) nhưng 0 caller ngoài comment',
    doc: 'RoomLight.lumens (Doc.lighting) + roomAreaM2 (lib/cad/room.ts) + UF/MF tham số có mặc định ngành',
    ghi: 'Không ghi — trả ước tính E=(Φ·UF·MF)/A kèm nhãn ƯỚC TÍNH (chốt 10/08: lux trước IES/LDT phải ghi rõ)',
    congThuc: 'Hàm thuần tất định; MaterialPbr.reflectance đã khai chỗ cho bản sau tính UF thật',
    anTheo: '(chưa ai) — đích dự kiến: Inspector phòng chặng 2D/3D + lib/review lớp luật chiếu sáng',
    loi: { file: 'lib/lighting/lux.ts', mau: 'roomLuxEstimate' },
    day: { dirs: ['components', 'app'], mau: 'roomLuxEstimate|luxVerdict' },
    trangThai: 'cho-day' },

  { id: 'brief-pdf-extract',
    ten: 'Trích PDF cho đề bài — ĐÃ MỞ: AiBriefPanel.tsx:157 extractPdf (unpdf) nạp tệp .pdf/.txt/.md vào ô đề bài',
    doc: 'Tệp PDF/text người dùng chọn (Uint8Array)',
    ghi: 'Không tự chạy AI — đổ text trích được vào ô đề bài cho người đọc/sửa trước',
    congThuc: 'extractPdf dynamic-import unpdf — một đường trích duy nhất, không parser thứ hai',
    anTheo: 'AiBriefPanel (đề bài 2D) · route notebook source (RAG notebook) · Smart Convert bậc 1 dùng họ hàng pdf-import riêng cho VECTOR',
    loi: { file: 'lib/notebook/extract.ts', mau: 'extractPdf' },
    day: { dirs: ['components', 'app/api/notebook'], mau: 'extractPdf' },
    trangThai: 'co-day' },

  { id: 'commands-registry',
    ten: 'Sổ lệnh 97 alias — ĐÃ MỞ MỘT PHẦN: cmdsFor sống ở AppCommandPalette (⌘K) + statusbar; icon chưa điền, mặt dock/contextmenu/llm còn treo (việc hotkey-registry đợt 6)',
    doc: 'WhenCtx (chặng · mode · selection) để lọc lệnh đủ điều kiện',
    ghi: 'Không ghi — trả danh sách lệnh chạy được, lệnh thiếu điều kiện phải hiện mờ kèm lý do (chốt 10/08)',
    congThuc: 'MỘT registry cho mọi mặt nhập lệnh (CẤP 2 hệ tên 11/08) — tooltip/⌘K/⌘/ đọc chung, không khai lệch',
    anTheo: 'AppCommandPalette · AppShell statusbar · Render3DModeSkeleton · (chờ) dock · menu chuột phải · Vitals function-calling',
    loi: { file: 'lib/commands/registry.ts', mau: 'cmdsFor' },
    day: { dirs: ['components'], mau: "from '@/lib/commands/registry'" },
    trangThai: 'co-day' },

  { id: 'anh-recipe-lam-moi',
    ten: 'Ảnh dẫn xuất có công thức (T2) — ĐÃ MỞ: ImageElement.recipe (model.ts:471) + Inspector nút "Làm mới từ bản vẽ" gọi renderRecipeImage',
    doc: 'Doc dự án NGUỒN (neo lúc tạo ảnh) + LinkedAssetRecipe đã lưu trên phần tử ảnh',
    ghi: 'Dựng lại dataUrl ảnh bằng ĐÚNG công thức cũ — không phát minh cách render thứ hai',
    congThuc: 'recipe là công thức tái-chạy: bản vẽ đổi → bấm một nút ảnh trong deck khớp lại (ống kính dữ liệu)',
    anTheo: 'Inspector Trình chiếu · Story Set (ảnh chương 6 truy về nguồn) · boqFingerprint cùng họ',
    loi: { file: 'lib/present-editor/linked-asset-recipe.ts', mau: 'renderRecipeImage' },
    day: { dirs: ['components/present-editor'], mau: 'renderRecipeImage' },
    trangThai: 'co-day' },

  { id: 'library-fm-kho-that',
    ten: 'Thư viện + File Manager ruột THẬT — ĐÃ MỞ (12/08, entry frontier library-data-that + fm-data-that): LIBRARY_DATA_IS_MOCK=false, FM bỏ mock-data',
    doc: 'LibraryAsset trong DB (qua API) + cây đĩa thật real-fs — không còn mock-data.ts',
    ghi: 'Nhập/gỡ asset ghi DB thật; số đếm kệ là số thật, null = chưa có số',
    congThuc: 'Kệ (shelves) là lớp khai báo trên MỘT kho — tự lọc theo chặng, không đẻ kho thứ hai',
    anTheo: 'LibrarySheet · ItemThumb · Gallery liên ngành (/library/gallery) · Thẻ DNA (chọn ảnh nguồn)',
    loi: { file: 'lib/library/shelves.ts', mau: 'LIBRARY_DATA_IS_MOCK = false' },
    day: { dirs: ['components/library'], mau: "from '@/lib/library/shelves'" },
    trangThai: 'co-day' },

  { id: 'accent-warm-canh-bao',
    ten: 'Token --accent-warm nối trạng thái cảnh báo — ĐÃ MỞ: LightArc state warn + VitalsStateBadge + LightClock dùng var thật',
    doc: 'Trạng thái cảnh báo của tiến trình/Vitals (warn)',
    ghi: 'Không ghi — chỉ đổi màu qua token, cấm chế hex mới (luật L4)',
    congThuc: 'Ánh sáng CHỈ mang nghĩa trạng thái (LightState CẤP 1) — warn = --accent-warm, một token mọi nơi',
    anTheo: 'LightArc · VitalsStateBadge · LightClock (Home) · ShortcutsPanel',
    loi: { file: 'app/globals.css', mau: '--accent-warm' },
    day: { dirs: ['components'], mau: 'accent-warm' },
    trangThai: 'co-day' },

  { id: 'gu-profile',
    ten: 'Gu Engine (GuProfile từ Reference) — ĐÃ CÓ DÂY (code thật cãi sổ 08/08 "cố ý chặn"): ConceptForm guProfileFromPicked + PresentEditor buildGuProfile; phần chờ Reference.projectId vẫn gate có chủ đích',
    doc: 'Ảnh Reference người dùng CHỌN cho sản phẩm này (không phải trung bình toàn kho)',
    ghi: 'Không ghi — trả GuProfile (palette · chất liệu · từ khoá) đổ vào prompt/bố cục',
    congThuc: 'Gu trích từ Reference mỗi lần mỗi khác theo ảnh chọn — không hardcode gu studio nào [T3]',
    anTheo: 'ConceptForm (prompt render) · PresentEditor/LayoutShelf (gu dàn trang) · Thẻ DNA là họ hàng qua DistillEngine',
    loi: { file: 'lib/gu.ts', mau: 'buildGuProfile' },
    day: { dirs: ['components'], mau: 'buildGuProfile|guProfileFromPicked' },
    trangThai: 'co-day' },

  // ── ENGINE 12-13/08 (sinh sau sổ DOI-CHIEU — khai ngay theo kỷ luật entry-lúc-chốt) ─────

  { id: 'distill-engine',
    ten: 'DistillEngine — máy chưng cất generic (12/08 Đợt 4): 1 engine 3+ mặt tiền theo T phán §9 (dna-card · auto-define · company-dna-pack · phiếu đọc tham khảo)',
    doc: 'Nguồn có provenance (ảnh/ghi chú/spec) + DistillFieldSpec khai trường cần trích',
    ghi: 'Bản chưng cất có cờ 3 nấc measured/inferred/verified — người duyệt trước khi thành dữ liệu',
    congThuc: 'distill<TField> generic: mặt tiền mới = bộ FieldSpec mới, KHÔNG viết engine mới [T2]',
    anTheo: 'DesignDnaCardPanel (Thẻ DNA qua lib/dna/distiller) · GroundedRender reference-sheet (phiếu 4 cấp) · (chờ) meeting-distill · Dàn Ý Chờ Sẵn (mặt tiền thứ 4)',
    loi: { file: 'lib/distill/engine.ts', mau: 'DistillEngine' },
    day: { dirs: ['components', 'lib/dna', 'lib/grounded-render'], mau: 'lib/distill|distillDnaFromAssets' },
    trangThai: 'co-day' },

  { id: 'table-doc-engine',
    ten: 'TableDocEngine — engine bảng chung (12/08 Đợt 4): trừu tượng từ BOQ, docType schedule "Bảng thống kê" chạy trên nó',
    doc: 'Doc (đếm cửa/phòng giữ entityId) + overrides ô tay của người dùng',
    ghi: 'Bảng re-sync theo Doc mà KHÔNG đè ô tay đã sửa (human-in-loop [T5])',
    congThuc: 'Một engine bảng — schedule/spec-sheet/approval-form là mặt tiền sau, BOQ 0 hồi quy',
    anTheo: 'ScheduleScreen · TableDocGrid · PresentDocTypePicker (thẻ thật) · (chờ) BoqScreen rewire',
    loi: { file: 'lib/present-editor/table-doc-engine.ts', mau: 'TableDoc' },
    day: { dirs: ['components/present-editor'], mau: 'table-doc-engine' },
    trangThai: 'co-day' },

  { id: 'build-recipe',
    ten: 'BuildRecipe/evalRecipe — công thức khối non-destructive (12/08 Đợt 4): Base.recipe additive, UI ngăn xếp tab Sửa',
    doc: 'Hình học gốc khối (positions/baseMm/heightMm/opCutters) + danh sách bước recipe',
    ghi: 'Geometry dựng lại theo THỨ TỰ THẬT các bước; stepErrors tính bằng chính evalRecipe, UI không viết lại luật lỗi',
    congThuc: 'Recipe là event-log của dựng hình — toggle mắt/xoá/sắp xếp từng bước, ưu tiên khi có (ops[] cũ giữ nguyên)',
    anTheo: 'Command3DPanel BuildRecipeSection · (khuôn NÚM-STACK dùng lại cho bảng ánh xạ GroundedRender v1 + ThinkDial)',
    loi: { file: 'lib/three/build-recipe.ts', mau: 'evalRecipe' },
    day: { dirs: ['components'], mau: 'evalRecipe|BuildRecipeSection' },
    trangThai: 'co-day' },

  { id: 'pdf-to-deck',
    ten: 'Smart Convert bậc 1 pdfToDeck (13/08 SC): PDF-vector → deck IF lớp CHỮ thật (toạ độ+cỡ giữ, dấu Việt chuẩn), cắm cửa Mở tệp',
    doc: 'PDF vector người dùng nhập (gốc bất biến theo luật smart-ingest)',
    ghi: 'Deck IF là DẪN XUẤT có provenance — nối vào cuối deck đang mở, trang scan gắn badge chờ OCR bậc 2',
    congThuc: 'PDF → deck sửa được → PPTX, không đẻ đường chuyển đổi ngoài luật một-nguồn [T1]',
    anTheo: 'Toolbar Trình chiếu (Mở tệp) · PresentEditor (present:pdf-import-request) · vòng người-dùng-thật deck NamLong',
    loi: { file: 'lib/present-editor/pdf-import.ts', mau: 'pdfToDeck' },
    day: { dirs: ['components'], mau: 'pdfToDeck|pdf-import' },
    trangThai: 'co-day' },

  { id: 'goi-ho-so-song-pack',
    ten: 'Gói Hồ Sơ Sống v0 packHoSoSong (13/08 P4): ZIP + viewer HTML tự chứa (0 mạng ngoài), nút Toolbar Trình chiếu',
    doc: 'Artifact ĐÃ SINH SẴN từ các đường xuất hiện có (.idfp · ảnh trang · BOQ best-effort) — không tự render lại',
    ghi: 'Blob .zip manifest v1 + sha256 — kênh vắng khai thật, không giả nội dung',
    congThuc: 'Manifest đa kênh + 3 tầng thoái lui né chết-định-dạng; viewer là mặt tiền chung xem-gói (không đẻ viewer thứ hai)',
    anTheo: 'Toolbar Trình chiếu "Gói Hồ Sơ (.zip)" · (chờ) Story Set/.idfc dùng chung viewer · kênh PDF chờ export.ts thêm biến thể Blob',
    loi: { file: 'lib/ho-so-song/pack.ts', mau: 'packHoSoSong' },
    day: { dirs: ['components'], mau: 'packHoSoSong' },
    trangThai: 'co-day' },

  { id: 'grounded-render-v0',
    ten: 'GroundedRender v0 (13/08 GR): reference-sheet phiếu 4 cấp + region-inpaint mask cứng — 2 node ai.refsheet · ai.regionrender',
    doc: 'Ảnh trọng tâm + ảnh tham khảo + mask mảng (mask thiếu = lỗi cứng, không đoán)',
    ghi: 'Ảnh sinh TỪNG MẢNG qua mask — cửa duyệt phiếu TRƯỚC inpaint [T5], không trộn toàn cục',
    congThuc: 'Phiếu 4 cấp (tổng thể→trần tường sàn→vật liệu→chi tiết) là ProposalSheet; guidance import hằng F2 không chép số',
    anTheo: 'lib/nodes/defs/grounded-render (2 node chặng 2) · (v1 chờ) bảng ánh xạ + núm per-mảng + SAM2 · RegionId chiếu entity từ scene IF',
    loi: { dir: 'lib/grounded-render', mau: 'readReferenceSheet' },
    day: { dirs: ['lib/nodes'], mau: 'grounded-render' },
    trangThai: 'co-day' },

  { id: 'scaffolder-goi-y',
    ten: 'Máy Sinh Khung suggestScaffold (12/08): gợi ý khung việc theo loại hình KÈM căn cứ, thiếu loại hình thì im không đoán',
    doc: 'ProjectProfile (loại hình · quy mô) của dự án đang khởi tạo',
    ghi: 'Gieo việc THẬT qua POST /api/tasks (vào cột "Chưa làm") kèm TaskContext stage — người duyệt danh sách trước',
    congThuc: 'Đề xuất luôn kèm căn cứ (vì sao khung này) — khuôn ProposalSheet, không áp đặt',
    anTheo: 'ProjectInitBoard (＋ Dự án mới, 3 mảnh PLAN·TASK·TIMELINE) · Bảng việc nhận task đã gieo',
    loi: { file: 'lib/tasks/scaffolder.ts', mau: 'suggestScaffold' },
    day: { dirs: ['components'], mau: 'suggestScaffold' },
    trangThai: 'co-day' },

  { id: 'task-context-day',
    ten: 'Dây Việc–Ngữ Cảnh buildTaskDeepLink (12/08): bấm việc nhảy đúng workspace/đối tượng, chiều ngược Tạo-việc-từ-đây',
    doc: 'Task {projectId, stage, entityId} — TaskContext additive trên bảng Task',
    ghi: 'Không ghi — dựng deep-link ?focusEntity; chặng đích tự select/bay camera/nhảy trang',
    congThuc: 'MỘT hằng khoá deep-link dùng chung 2 chiều (round-trip test) — chỗ pipeline và task-lẻ gặp nhau',
    anTheo: 'TaskBoardScreen (chip chặng) · CadEditor + PresentEditor (đọc focusEntity) · Render3DModeSkeleton · focus-entity',
    loi: { file: 'lib/tasks/context.ts', mau: 'buildTaskDeepLink' },
    day: { dirs: ['components'], mau: 'tasks/context|buildTaskDeepLink' },
    trangThai: 'co-day' },
];
