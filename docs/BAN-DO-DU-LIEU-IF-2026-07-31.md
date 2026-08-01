# BẢN ĐỒ DỮ LIỆU — InteriorFlow (31/07/2026)

> Đây là **BẢN ĐỒ**, không phải bản quy hoạch — không có đề xuất giải pháp/kiến trúc mới/dọn dẹp
> trong file này. Khảo sát bằng đọc code trực tiếp (grep + đọc toàn văn từng file liên quan),
> KHÔNG sửa bất kỳ file .ts/.tsx/config/schema nào, KHÔNG chạy migration/seed/reset.
>
> Chú thích cột "Mất khi nào" (5 tình huống, viết tắt): **①** xoá dữ liệu trình duyệt · **②** đổi
> trình duyệt (cùng máy) · **③** đổi máy · **④** gỡ/cài lại app · **⑤** xoá `prisma/dev.db`.
> Ký hiệu: **M** = Mất · **K** = Không ảnh hưởng (dữ liệu vẫn còn) · **?** = CHƯA XÁC MINH.

---

## A · BẢNG CHÍNH — một dòng cho mỗi LOẠI dữ liệu

### A.1 — Lưu trong trình duyệt (IndexedDB)

| # | Dữ liệu | Nơi lưu | Ai GHI (file:dòng) | Ai ĐỌC (file:dòng) | Cỡ điển hình | Mất khi nào |
|---|---|---|---|---|---|---|
| 1 | **Bộ sheet CAD/Present đang làm việc** (entities/layers/markups/photos mỗi sheet, tối đa 5 sheet/chặng/dự án) | IndexedDB `interiorflow-sheets`, object store `sheets`, khoá `userId::route::projectId` | `lib/sheets-persist.ts:172` (`saveSheets`, autosave debounce ≥1s) — gọi từ editor CAD/Present | `lib/sheets-persist.ts:130` (`loadSheets`) — gọi khi mở editor | Vài trăm KB – vài MB/dự án (deck Present có ảnh dataURL) | ①M — bị xoá cùng "site data/cookies" ②M — IndexedDB không đồng bộ giữa trình duyệt ③M — trừ khi đã xuất `.idf`/có backup đĩa thật ④**?** — Electron: xem hàng 34 (chưa xác minh trình gỡ cài có xoá `userData` hay không) ⑤K — độc lập hoàn toàn với SQLite |
| 2 | **Handle thư mục backup đã chọn** (con trỏ tới thư mục thật trên đĩa, KHÔNG phải nội dung backup) | IndexedDB `interiorflow-backup`, object store `handles`, key `backupDir` | `lib/cad/auto-backup.ts:70` (`storeHandle`) | `lib/cad/auto-backup.ts:78` (`loadHandle`) | Rất nhỏ (1 handle object) | ①M ②M ③M ④**?** giống hàng 1 ⑤K — user phải bấm lại "chọn thư mục" nếu mất handle, KHÔNG mất nội dung backup thật (nằm trên đĩa, xem hàng 3) |
| 3 | **Thư viện font đã tải lên (cấp máy)** | IndexedDB `interiorflow-fonts`, object store `fonts`, key = `stack` font | `lib/present-editor/custom-fonts.ts:110` (`putLibraryFont`) | `lib/present-editor/custom-fonts.ts:97` (`getLibraryFonts`) | ~200–600KB/font (trần 8MB/font, base64 +33%) | ①M ②M ③M ④**?** ⑤K — deck vẫn hiện đúng font nhờ bản NHÚNG THEO DECK (hàng 1, `EditorDeck.customFonts` — cùng cơ chế IndexedDB sheet, không phải store riêng) |

### A.2 — Lưu trong trình duyệt (localStorage)

| # | Dữ liệu | Nơi lưu (khoá) | Ai GHI (file:dòng) | Ai ĐỌC (file:dòng) | Cỡ điển hình | Mất khi nào |
|---|---|---|---|---|---|---|
| 4 | **Canvas node-flow (Concept)** — bản lưu CỤC BỘ, đóng dấu `owner` | `interiorflow.flow.v1` | `lib/store.ts:390,415` (`persistNow`, debounce 2s — CHỈ ghi khi chưa đăng nhập hoặc chưa gán `currentFlowId`, xem §B.1) | `lib/store.ts:340` (`hydrate`) · `lib/workspace.ts:110` (`localFlowBelongsTo`, kiểm chủ sở hữu trước khi mang canvas local vào tài khoản mới) | Vài chục KB – vài MB (tự giảm tải `outputs` khi vỡ quota, dòng 425) | ①M ②M ③M ④**?** ⑤K |
| 5 | **Model học "Gu" — chọn template Present** (trọng số perceptron) | `interiorflow.gu.perceptron.present-template.v1` (hằng số `PRESENT_TEMPLATE_MODEL_KEY`, `lib/gu/feature-dict.ts:53`) | `lib/gu/pairwise-perceptron.ts:168` (`saveToLocalStorage`) — gọi tại `components/present-editor/LayoutShelf.tsx:220` sau mỗi lần user bấm 👍 Nhận | `lib/gu/pairwise-perceptron.ts:178` (`loadFromLocalStorage`) — gọi tại `LayoutShelf.tsx:159` lúc mount | Vài KB (JSON trọng số sparse) | ①M ②M ③M ④**?** ⑤K — xem phân tích đầy đủ ở **Câu hỏi ③** |
| 6 | **Model học "Gu" — chọn phương án đặt nội thất CAD** | `interiorflow.gu.perceptron.cad-layout-option.v1` (hằng số `CAD_LAYOUT_OPTION_MODEL_KEY`, `lib/cad/ai-layout-feedback.ts:20`) | `pairwise-perceptron.ts:168` — gọi tại `components/cad/AiBriefPanel.tsx:274,276` (ước đoán số dòng lưu liền sau `.update`, xem ghi chú) | `pairwise-perceptron.ts:178` — gọi trong `AiBriefPanel.tsx` (cùng luồng feedback) | Vài KB | ①M ②M ③M ④**?** ⑤K — cùng bản chất hàng 5, xem **Câu hỏi ③** |
| 7 | **Manifest ảnh/PDF tham khảo đã nạp cho AI** (`app/library/ingest`) | `interiorflow.refManifest` | `lib/refingest.ts:169` (`saveManifest`) — gọi tại `app/library/ingest/page.tsx:63` | `lib/refingest.ts:161` (`loadManifest`) — gọi tại `app/library/ingest/page.tsx:56` | Có thể vài MB (mỗi asset có `thumb` dataURL — file tự nhận biết dễ vỡ quota, comment dòng 171) | ①M ②M ③M ④**?** ⑤K |
| 8 | **Gallery ảnh đã lưu (tối đa 200 mục)** | `interiorflow.gallery.v1` | `lib/gallery.ts:32` (`saveToGallery`) | `lib/gallery.ts:16` (`listGallery`) | Có thể lớn — mỗi item giữ `url` (thường dataURL ảnh kết quả AI) × tới 200 mục | ①M ②M ③M ④**?** ⑤K |
| 9 | **Brand Kit của dự án** (logo/màu/font) — danh sách + kit đang chọn | `interiorflow.brandKits` (mảng) · `interiorflow.brandKitActive` (id) | `lib/present-editor/brand-kit.ts:58-59` | `lib/present-editor/brand-kit.ts:69-71` — dùng rộng ở `BrandKitPanel.tsx`, `PresentEditor.tsx`, `PresentSheets.tsx`, `CadEditor.tsx` (khung tên bản vẽ), `ToolModeForm.tsx`, `chat-assist.ts` | Vài trăm KB nếu logo là dataURL | ①M ②M ③M ④**?** ⑤K — **không có bất kỳ bản sao nào ở Prisma/đĩa** — xem cảnh báo ở **Câu hỏi ①** |
| 10 | **Template Present tự tạo (custom)** | `interiorflow.customTemplates` | `lib/present-editor/custom-templates.ts:50` | `lib/present-editor/custom-templates.ts:60` — dùng tại `LayoutShelf.tsx` | Vài chục–vài trăm KB | ①M ②M ③M ④**?** ⑤K |
| 11 | **Luật Kiểm chuẩn CAD tự thêm (custom rules)** | `interiorflow.cad.standards.customRules.v1` | `lib/cad/standards/registry.ts:90` (dùng `window.localStorage` — khác cách viết các file khác, đã ghi chú) | `lib/cad/standards/registry.ts:102` | Nhỏ | ①M ②M ③M ④**?** ⑤K |
| 12 | **Nháp + lịch sử "Đề bài chi tiết" (AiBriefPanel)** | `interiorflow.cad.aibrief.draft.v1` · `interiorflow.cad.aibrief.history.v1` (giữ tối đa 20 mục, `HISTORY_MAX`) | `components/cad/AiBriefPanel.tsx:69,79` | `components/cad/AiBriefPanel.tsx:92,95` | Nhỏ–vừa | ①M ②M ③M ④**?** ⑤K |
| 13 | **Handoff Photo Editor** (payload chuyển ảnh giữa 2 màn hình) | `interiorflow.photoEditorHandoffReturn` | `lib/photo-editor/handoff.ts:103` | `lib/photo-editor/handoff.ts:113`, xoá ở `:125` sau khi dùng | Tạm thời, nhỏ–vừa (có thể chứa ảnh) | ①M ②M ③M ④**?** ⑤K — **có chủ đích tạm thời**, tự xoá sau 1 lần dùng |
| 14 | **UI Render Studio (view + card đang chọn)** | `interiorflow.render.toolmode.view` · `interiorflow.render.toolmode.selectedCard` | `lib/render-studio/tool-mode-ui.ts:37,45-47` | `lib/render-studio/tool-mode-ui.ts:28` | Rất nhỏ | ①M ②M ③M ④**?** ⑤K |
| 15 | **UI Present Editor (kích thước panel)** — **KHÔNG có tiền tố `interiorflow.`, khác quy ước mọi khoá còn lại** | `pe-panelW` · `pe-inspectorW` · `pe-inspectorOpen` | `components/present-editor/PresentEditor.tsx:167,174,181` | `components/present-editor/PresentEditor.tsx:155,157,159` | Rất nhỏ | ①M ②M ③M ④**?** ⑤K |
| 16 | **UI CAD Toolbar (chế độ đang chọn)** | `interiorflow.cad.mode` | `components/cad/CadToolbar.tsx:166` | `components/cad/CadToolbar.tsx:157` | Rất nhỏ | ①M ②M ③M ④**?** ⑤K |
| 17 | **Nháp Notebook (mock, theo từng dự án)** | `` interiorflow.notebook.${projectId}.mock.v1 `` (hàm `LS_KEY(projectId)`) | `components/notebook/useNotebook.ts:36` | `components/notebook/useNotebook.ts:25` | Nhỏ–vừa | ①M ②M ③M ④**?** ⑤K — **CHƯA XÁC MINH quan hệ với `NotebookSource`/`NotebookChunk` thật ở Prisma (hàng 30) — tên gọi "mock" gợi ý đây là bản NHÁP/THỬ NGHIỆM riêng, chưa chắc là dữ liệu Notebook thật đang chạy** |
| 18 | **Trạng thái resume/tour/coachmark (theo từng user)** — nhóm | `interiorflow.resume.<userId>` · `interiorflow.tourDone.<userId>` · `interiorflow.lastUserId` · `interiorflow.stageIntro.<stage>.<userId>` · `interiorflow.coachmark.<name>.<userId>` | `lib/resume.ts` (nhiều hàm, đủ chu trình ghi/đọc/xoá cho từng prefix) | `lib/resume.ts` (đối xứng ghi) | Nhỏ | ①M ②M ③M ④**?** ⑤K |
| 19 | **Tuỳ chọn giao diện chung** — nhóm (theme/ngôn ngữ/mức AI/engine oneAI/runtime oneAI/chặng đang mở) | `interiorflow.theme` (`THEME_KEY`) · `interiorflow.lang` (`LANG_KEY`, `lib/lang.ts:7`) · `interiorflow.aiTier` · `interiorflow.oneAiEngine` · `interiorflow.oneAiRuntime` · `interiorflow.workspace` | `lib/store.ts:352,362,371,379,387,405,415` (các action `set*`) — RIÊNG `interiorflow.workspace` còn được ghi từ `lib/studio/stage-nav.ts:55` (2 điểm gọi CÓ CHỦ ĐÍCH cho cùng 1 khoá, xem comment đầu file đó — không phải nguồn nhập nhằng) | `lib/store.ts:335-360` (`hydrate`) · `components/CommentLayer.tsx:79` (đọc `interiorflow.workspace`, mặc định `'app'`) | Rất nhỏ | ①M ②M ③M ④**?** ⑤K |
| 20 | **Cờ onboarding/flag rời rạc** — nhóm, **KHÔNG có tiền tố `interiorflow.` ở 1 khoá** | `if_intro_seen_v1` · `interiorflow.stageDone` · `interiorflow.labs.dualpane` (`FLAG_KEY`) · `interiorflow.vitals.gesture_hint_seen`/`_first_done` · `interiorflow.login-bg` (`LS_KEY`) | `components/intro/IntroSequence.tsx:66` · `components/home/HomeScreen.tsx:500,518` · (dualpane: chỉ đọc, xem cột kế) · `components/studio/StageSwitcher.tsx:148,156` · `components/entry/LoginBackdrop.tsx:145,169` | `app/intro/page.tsx:18` · `components/home/HomeScreen.tsx:110,119` · `components/studio/FoldableDualPane.tsx:32` (`FLAG_KEY`, **chỉ thấy `getItem` trong lần grep — CHƯA XÁC MINH nơi ghi**, có thể là flag bật tay qua devtools/URL param) · `components/studio/StageSwitcher.tsx:104,110,209,221` · `components/entry/LoginBackdrop.tsx:145,169` | Rất nhỏ | ①M ②M ③M ④**?** ⑤K |
| 21 | **Migration nội bộ 1 lần** (đổi tên khoá cũ → mới, dọn khoá rác) | `interiorflow.vitals.migrated_from_vitas` · `interiorflow.vitals.stage_drop_cleaned_v1` (cờ đánh dấu đã migrate) | `app/layout.tsx:68-69` (`<script>` inline, chạy trước hydrate React) | cùng script | Rất nhỏ | ①M (chạy lại migrate — vô hại, đã migrate lần nữa không đổi gì) ②M ③M ④**?** ⑤K |

### A.3 — Lưu trên đĩa thật (file hệ thống)

| # | Dữ liệu | Nơi lưu | Ai GHI (file:dòng) | Ai ĐỌC (file:dòng) | Cỡ điển hình | Mất khi nào |
|---|---|---|---|---|---|---|
| 22 | **Bản sao lưu tự động CAD** (đầy đủ `.ifpack` mỗi N lượt + chênh lệch `.ifdiff.json` giữa 2 lượt, tự tỉa theo thang thời gian) | Thư mục thật do user CHỌN TAY (File System Access API, `showDirectoryPicker`), **KHÔNG do app tự quyết định đường dẫn** | `lib/cad/auto-backup.ts:246` (`writeAndPrune`) — chạy mỗi 10 phút (`INTERVAL_MS`) HOẶC ngay sau mỗi lượt autosave thật | `lib/cad/auto-backup.ts:295` (`listBackupsForUi`) + `:311` (`recoverBackup`, do UI gọi khi user chủ động chọn khôi phục — **KHÔNG tự động nạp lại**) | Mỗi bản full ~ cỡ project (nén .ifpack); diff nhỏ hơn nhiều | ①K — đĩa thật, không liên quan trình duyệt ②K ③M — nếu không copy thư mục theo ④K/M tuỳ — **nằm ngoài mọi thư mục app quản lý, người dùng tự chọn, gỡ app không đụng tới trừ khi user chọn đúng thư mục cài đặt (hiếm)** ⑤K |
| 23 | **Xuất `.idf`** (file rời — tương đương `.dwg`) | User tự chọn nơi lưu khi bấm "Xuất" | `lib/cad/idf.ts:117` (`exportIdf`) — gọi từ `CadSheets.tsx` (menu Xuất) | `lib/cad/idf.ts:172` (`importIdf`) | Phụ thuộc nội dung — CÓ nhúng ảnh dataURL (`SiteImage`, có thể `PhotoEmbed`) nên có thể vài MB | Hoàn toàn NGOÀI 5 tình huống — chỉ mất nếu user tự xoá file đó. Xem field-level đầy đủ ở **Câu hỏi ②** |
| 24 | **Thư viện ảnh dùng chung team** (file vật lý) | `<cwd>/uploads/*` (dev) hoặc `<userData>/uploads/*` (Electron đóng gói, xem hàng 34) | `app/api/library/route.ts:70,73` · `app/api/library/clip/route.ts:43,46` (2 route KHÁC NHAU nhưng cùng khai `UPLOAD_DIR = path.join(process.cwd(),'uploads')` — **đã xác minh: cùng biểu thức, cùng trỏ 1 thư mục vật lý, không lệch**) | `app/api/library/[id]/file/route.ts:13` (đọc theo `asset.path` lưu trong Prisma `LibraryAsset`, xem hàng 30) | Ảnh gốc, có thể vài trăm KB – vài MB/ảnh | ①K ②K ③M nếu không copy `uploads/` theo ④xem hàng 34 ⑤**Ảnh vẫn còn trên đĩa nhưng MẤT MỌI METADATA** (tên/tag/palette/liên kết) vì `LibraryAsset` ở Prisma — file trở thành rác không tên, không route nào tự quét lại thư mục — xem **Câu hỏi ①** |
| 25 | **File nguồn Notebook dự án** (PDF/ảnh user tải lên cho RAG) | `<cwd>/uploads/notebook/{projectId}/*` | `app/api/notebook/[projectId]/source/route.ts:207,210` — **cùng request ghi file VÀ ghi `filePath` vào Prisma (`:213`)** | `app/api/notebook/[projectId]/source/[sourceId]/file/route.ts:37` · `.../route.ts:36` (đọc qua `filePath` lưu trong DB) | Theo file gốc (PDF thường vài trăm KB–vài MB) | ①K ②K ③M nếu không copy ④xem hàng 34 ⑤**Mất `NotebookSource`/`NotebookChunk` (embedding) ở DB → file vẫn nằm trên đĩa nhưng KHÔNG route nào biết `filePath` nữa** (route đọc file luôn phải qua DB trước) |
| 26 | **Góp ý trong app (Claude review)** — text + ảnh minh hoạ | `comments-review.json` ở **GỐC REPO** (không phải trong `uploads/`) + `public/comments-images/*.{png,jpg,webp,gif}` | `app/api/comments/route.ts:56` (`writeAll`) + `:41-46` (`saveImage`) | `app/api/comments/route.ts:49` (`readAll`) | Nhỏ (text) + ảnh vài trăm KB | ①K ②K ③M nếu không copy 2 đường dẫn này theo ④xem hàng 34 (nhưng **CHƯA XÁC MINH** — 2 đường dẫn này KHÔNG nằm dưới `uploads/` nên có thể KHÔNG được `main.js` dời theo `cwd=userData`, cần đọc lại `main.js` để chắc — hiện chỉ thấy `uploads/` được nhắc rõ, `comments-review.json`/`public/comments-images` không thấy trong ghi chú electron) ⑤K — độc lập DB. **Cả 2 đường dẫn đều nằm trong `.gitignore`** (dòng 22-23) — không bao giờ vào git, kể cả khi commit code |
| 27 | **DB SQLite chính** (`prisma/dev.db`) | `prisma/dev.db` (dev, theo `.env`: `file:/Users/.../interiorflow/prisma/dev.db` — path TUYỆT ĐỐI, không phải path tương đối `file:./dev.db` như comment trong `schema.prisma` gợi ý) hoặc `<userData>/dev.db` (Electron, xem hàng 34) | Prisma ORM ghi trực tiếp qua mọi API route dùng `prisma.*.create/update/upsert` | Prisma ORM đọc qua mọi API route dùng `prisma.*.find*` | 143MB tại thời điểm khảo sát (sandbox này) | ①K ②K ③M nếu không copy file `.db` theo ④xem hàng 34 ⑤**LÀ CHÍNH NÓ — mất sạch mọi model liệt kê ở §A.4** |

### A.4 — Lưu trong Prisma/SQLite (16 model, `prisma/schema.prisma`)

| # | Dữ liệu | Model | Quan hệ chính | Cỡ điển hình | Mất khi nào |
|---|---|---|---|---|---|
| 28 | Tài khoản người dùng (email/phone, mật khẩu đã hash, credits, avatar config) | `User` | 1—n với hầu hết model khác | ~1 dòng/user | ①②③K (server-side) ④xem hàng 34 ⑤M (cùng hàng 27) |
| 29 | Token OAuth tích hợp ngoài (Google/MS365/Zoom/Zalo/Spotify/...) — **đã mã hoá AES-256-GCM** | `IntegrationAccount` | `User` 1—n, unique theo `(userId, provider)` | Nhỏ | ⑤M — **mất hết mọi kết nối tích hợp, user phải đăng nhập lại từng dịch vụ** |
| 30 | Dự án (Project) + phân quyền thành viên (role: owner/crea/drafter/bim/viewer) — **nguồn chân lý DUY NHẤT cho "ai thấy/sửa dự án nào"** (comment trong schema, dòng ProjectMember) | `Project`, `ProjectMember` | `Project` 1—n `ProjectMember`; soft-delete qua `deletedAt` | Nhỏ/dòng | ⑤M — **mất luôn phân quyền, không phải chỉ mất dữ liệu hiển thị** |
| 31 | Notebook dự án (nguồn PDF/ảnh/note + chunk đã embedding cho RAG) | `ProjectNotebook`, `NotebookSource`, `NotebookChunk` | `ProjectNotebook` 1—1 `Project`; 1—n `NotebookSource`; 1—n `NotebookChunk` (embedding JSON float32[] dạng string) | Chunk: vài KB text + embedding vector text | ⑤M — mất cả chunk lẫn embedding, phải ingest lại từ file gốc (nếu file gốc còn, xem hàng 25) |
| 32 | Flow (canvas node-flow đã lưu server) + snapshot version | `Flow`, `FlowVersion` | `Flow` 1—n `FlowVersion` (snapshot MỖI LẦN bấm Run — KHÔNG ghi đè) | `graphJson` có thể vài trăm KB (nhiều node/ảnh output) | ⑤M — xem thêm **`FlowVersion` là ORPHAN, câu hỏi ⑤** |
| 33 | Giao dịch credit (log nạp/trừ) | `CreditTransaction` | `User` 1—n | Nhỏ/dòng | ⑤M |
| 34 | Tin nhắn chat (trợ lý AI) | `ChatMessage` | `User` 1—n | Nhỏ/dòng, có thể dài nếu AI trả lời dài | ⑤M |
| 35 | Metadata thư viện ảnh (tên/tag/palette/caption/usage — Gu Engine chưng cất từ ref) | `LibraryAsset` | `User` 1—n; `path` trỏ file thật (hàng 24) | Nhỏ/dòng (ảnh thật nằm trên đĩa) | ⑤**M nhưng file ảnh VẪN CÒN trên đĩa** — xem **Câu hỏi ①** |
| 36 | Mirror Larkbase — công việc + nhân sự (PULL-ONLY, Larkbase là nguồn chân lý, IF không bao giờ ghi ngược) | `LarkTaskRef`, `LarkPersonRef` | Độc lập, đồng bộ định kỳ qua `app/api/lark-tasks/sync` | Nhỏ/dòng, có `raw` JSON giữ nguyên field gốc | ⑤M — sync lại lần kế tiếp sẽ tự đắp lại (pull-only, không mất ý nghĩa dài hạn nếu Larkbase còn) |
| 37 | Ánh xạ tài khoản Larkbase ↔ User nội bộ (chỉ để hiển thị, KHÔNG quyết quyền truy cập) | `LarkUserMap` | `User` 1—n | Nhỏ/dòng | ⑤M — phải map tay lại |
| 38 | Spec sản phẩm/vật liệu (Hệ Legend — dùng cho legend/schedule/BOQ ở cả 3 chặng) | `ProductSpec` | Tham chiếu MỀM từ `BlockEntity.specId` (hàng CAD, §Câu hỏi ②) | Nhỏ/dòng, có `priceVnd` (Decimal) cho BOQ | ⑤M — **các bản vẽ CAD đã export/backup TRƯỚC ĐÓ vẫn giữ `specId` nhưng ID đó không resolve được nữa** (dangling reference) |

### A.5 — Electron (bản đóng gói desktop)

| # | Dữ liệu | Nơi lưu | Ai GHI | Ai ĐỌC | Cỡ điển hình | Mất khi nào |
|---|---|---|---|---|---|---|
| 39 | **Toàn bộ 3 nhóm ở trên (`uploads/`, `dev.db`, log) khi ĐÓNG GÓI** — main process dời `cwd` của Next.js server sang thư mục ghi-được | `<userData>/uploads/`, `<userData>/dev.db`, `<userData>/config.json`, `<userData>/db-push.log` (`app.getPath('userData')` — vd Windows: `%APPDATA%/InteriorFlow`) | `electron/main.js:118-129` (`prepareWritablePaths`) — set `DATABASE_URL` + cwd của tiến trình `next start` con | Next.js server con đọc như bình thường (không biết mình đang ở `userData`, chỉ thấy `process.cwd()` đổi) | Bằng tổng 3 mục trên | ①②③ (không áp dụng — đây LÀ nơi lưu cho các mục ①-③ ở dạng đóng gói) ④**CHƯA XÁC MINH** — file này không kiểm tra được uninstaller (NSIS/dmg) có xoá `userData` hay không; đây là hành vi của TRÌNH CÀI ĐẶT, không phải code app — cần test thật trên máy Windows/Mac ⑤M (`dev.db` trong `userData` là chính nó) |
| 40 | **Cấu hình user desktop** (API key, `AUTH_SECRET`...) | `<userData>/config.json`, khởi tạo từ `electron/config.example.json` nếu chưa có | `electron/main.js:176` (`loadUserConfig`, ghi lần đầu) | `electron/main.js:150-152` (đọc mỗi lần khởi động app) | Nhỏ (vài dòng JSON) | Giống hàng 39 |

> **Ghi chú quan trọng cho §A.5**: `electron/preload.js` **CỐ Ý KHÔNG mở kênh IPC** cho phía renderer (giao diện web) đụng vào filesystem thật — chỉ phơi ra `isElectron`/`platform`/`versions` (đọc-only, tĩnh). Toàn bộ việc "dùng hệ tệp thật" nằm ở **main process** (Node thuần), KHÔNG phải renderer gọi `fs` trực tiếp. IndexedDB/localStorage (§A.1, §A.2) trong bản Electron vẫn là **profile Chromium nội bộ mà Electron tự quản lý** — KHÔNG phải cùng cơ chế với việc dời `uploads/`/`dev.db`. Xem phân tích đầy đủ ở **Câu hỏi ④**.

---

## B · NĂM CÂU HỎI

### ① Nguồn sự thật nhập nhằng — nguy hiểm nhất

**Đã tìm được 4 cặp cụ thể**, xếp theo mức nguy hiểm:

**Cặp 1 — Canvas node-flow (Concept): Prisma `Flow.graphJson` vs localStorage `interiorflow.flow.v1`.**
Đây LÀ tình huống ví dụ user nêu, và code đã xử lý CÓ CHỦ ĐÍCH (không phải bug):
- Khi ĐÃ đăng nhập + đã có `currentFlowId` (flow đã tồn tại trên server): `persistNow()` (`lib/store.ts:392-398`) ghi thẳng lên Prisma qua `PUT /api/flows/{id}` và **RETURN NGAY** — không đụng `localStorage.SAVE_KEY` trong nhánh này.
- Khi CHƯA đăng nhập hoặc chưa có `currentFlowId`: ghi vào `localStorage.SAVE_KEY` (dòng 415).
- **Thứ tự nạp lúc mở app** (đã xác minh bằng grep thứ tự gọi, và có comment tường minh xác nhận tại `lib/cad/handoff.ts:8`: *"hydrate() đọc localStorage rồi bootstrapWorkspace()/openFlow() loadGraph đè nodes"*): `store.hydrate()` chạy TRƯỚC (đọc `localStorage.SAVE_KEY` vào state), sau đó `bootstrapWorkspace()`/`openFlow()` chạy SAU và gọi `loadGraph()` — **GHI ĐÈ** `nodes/edges/flowName/currentFlowId` bằng dữ liệu Prisma nếu server có flow.
- **Kết luận: khi 2 nơi lệch nhau và user ĐÃ đăng nhập có flow trên server → Prisma THẮNG** (vì loadGraph chạy sau, ghi đè). localStorage chỉ còn ý nghĩa khi CHƯA đăng nhập, hoặc như bản nháp tạm trong khoảng thời gian ngắn giữa lúc mount và lúc `bootstrapWorkspace()` fetch xong (có độ trễ mạng thật, không phải tức thời).
- **Rủi ro còn lại chưa kiểm hết**: nếu 2 tab trình duyệt cùng mở, 1 tab autosave lên Prisma trong khi tab kia đang hydrate từ localStorage cũ → có thể hiện tạm dữ liệu cũ vài giây. **CHƯA XÁC MINH** có cơ chế nào (polling/broadcast channel) đồng bộ 2 tab hay không.

**Cặp 2 — Bản vẽ CAD/Present: IndexedDB (sống) vs `.idf` xuất ra vs backup đĩa thật.**
- Editor CAD/Present khi MỞ **CHỈ đọc từ IndexedDB** (`loadSheets`, `lib/sheets-persist.ts:130`) — đây là nguồn SỐNG, tự động, không cần thao tác tay.
- `.idf` (xuất tay, `idf.ts`) và backup đĩa thật (tự động mỗi 10 phút, `auto-backup.ts`) đều là **snapshot MỘT CHIỀU** — app KHÔNG BAO GIỜ tự đọc lại 2 nguồn này. Muốn khôi phục từ backup đĩa, user phải bấm tay để gọi `recoverBackup()` (`auto-backup.ts:311`), và hàm đó **GHI THẲNG VÀO IndexedDB** (qua editor gọi lại `saveSheets` sau khi nhận kết quả — chưa đọc code UI gọi cụ thể, nhưng bản chất recover = nạp lại rồi lưu như làm việc bình thường).
- **Kết luận: IndexedDB luôn là nguồn thật khi mở editor bình thường; `.idf`/backup chỉ "thắng" khi user chủ động chọn khôi phục.** Không nhập nhằng về mặt code, nhưng **nhập nhằng về mặt CON NGƯỜI**: nếu máy hỏng ổ cứng, IndexedDB mất, user phải nhớ tự tìm & khôi phục từ backup đĩa hoặc `.idf` cũ nhất — không có cảnh báo tự động nào so sánh "phiên bản nào mới hơn".

**Cặp 3 — Brand Kit dự án: CHỈ tồn tại ở localStorage, KHÔNG có bản sao Prisma.**
`interiorflow.brandKits`/`brandKitActive` (hàng 9, §A.2) là nguồn DUY NHẤT — không phải "2 nơi nhập nhằng" mà là **rủi ro ngược: chỉ có 1 nơi, và nơi đó dễ mất nhất** (localStorage). `.idf` xuất ra chỉ nhúng `studioName` (chuỗi text), KHÔNG nhúng logo/màu/font của Brand Kit — xem **Câu hỏi ②**. Đổi máy = Brand Kit của MỌI dự án biến mất, phải nhập lại tay.

**Cặp 4 — File vật lý (`uploads/`) vs metadata Prisma (`LibraryAsset`/`NotebookSource`).**
Đã có ghi chú TRONG CHÍNH schema (`LibraryAsset`, đoạn soft-delete): xoá record KHÔNG xoá file thật — "xoá file thật là việc của job dọn dẹp SAU NÀY, chưa làm ở đây". Vậy chiều "file mồ côi vì DB mất" đã được chính đội dev nhận diện trước. Chiều ngược (DB còn, file bị xoá tay khỏi `uploads/`) thì route đọc file (`app/api/library/[id]/file/route.ts`) sẽ lỗi 404 khi user bấm xem — **CHƯA XÁC MINH UI có bắt lỗi này rõ ràng hay hiện ảnh vỡ im lặng.**

---

### ② Xuất `.idf` mang theo gì, bỏ lại gì

Đọc toàn văn `lib/cad/idf.ts` + field-level `Doc`/entity types trong `lib/cad/model.ts`.

**MANG THEO (nằm trong file `.idf`, tự chứa được — mở trên máy khác không cần gì thêm, TRỪ các FK mềm nêu dưới):**
- `idfVersion`, `meta.{projectName, createdAt, modifiedAt, appVersion}`
- Với MỖI sheet: `id`, `name`, và `doc` gồm:
  - `entities[]` — toàn bộ hình học + style (Line/Polyline/Rect/Circle/Arc/Text/Dim/Block/Hatch/Ellipse/Arrow/Zone...). Riêng `BlockEntity` mang `specId?` — CHỈ LÀ CHUỖI ID trỏ tới `ProductSpec` ở Prisma, KHÔNG mang theo sku/brand/giá thật (xem mục "BỎ LẠI").
  - `layers[]`
  - `markups?` (ghim chú thích, gồm `text`/`color`/toạ độ — TỰ CHỨA, không có ảnh)
  - `photos?` (`PhotoEmbed[]`: `src` — **CHƯA XÁC MINH** `src` là dataURL tự chứa hay URL tham chiếu ngoài; `SiteImage.src` thì ĐÃ XÁC MINH là dataURL tự chứa qua comment tường minh trong `model.ts`, nhiều khả năng `PhotoEmbed` cùng quy ước nhưng chưa đọc được nơi gán giá trị để chắc 100%)
  - `siteImage?` (ảnh nền vệ tinh cho công cụ Zone — dataURL, tự chứa, có thể làm file `.idf` nặng)
  - `printScale?`, `paperKey?`, `paperOrientation?` (thiết lập in per-sheet)
  - `studioName?` — **chỉ 1 chuỗi text** (tên studio/công ty in khung tên), lấy từ Brand Kit dự án tại THỜI ĐIỂM xuất — không phải tham chiếu sống.

**BỎ LẠI (KHÔNG có trong `.idf`, ở nơi khác):**
- **Deck Present** (slide, layout) — hoàn toàn KHÔNG nằm trong `.idf`. `.idf` chỉ export sheet CAD (`Doc` type là kiểu CAD thuần — entities/layers/CAD-specific fields). Deck Present được lưu RIÊNG ở cùng cơ chế IndexedDB (`sheets-persist.ts`) nhưng với `route` khác ('present' thay vì 'cad') và KHÔNG có đường xuất `.idf` tương đương (chưa thấy route/hàm export nào cho Present trong phạm vi đã đọc).
- **Font tuỳ chỉnh** (cả 2 tầng — nhúng-theo-deck lẫn thư viện-máy) — vì Font gắn với `EditorDeck` (Present), mà Present đã không nằm trong `.idf` (mục trên), nên font càng không.
- **Brand Kit đầy đủ** (logo ảnh, bảng màu, font pairing) — chỉ có `studioName` (text) đi theo; đổi Brand Kit sau khi export không ảnh hưởng file cũ, và mở file trên máy KHÔNG có Brand Kit đó thì mọi chỗ khác đọc Brand Kit (khung tên UI, PresentEditor...) sẽ KHÔNG resolve được gì thêm ngoài chuỗi tên đã đóng băng.
- **`ProductSpec` thật** (giá/sku/brand/nhà cung cấp) — chỉ có `specId` (ID) đi theo qua `BlockEntity.specId`; mở `.idf` trên máy/DB khác mà `ProductSpec` đó không tồn tại → tham chiếu treo (dangling), UI đọc theo id sẽ không tìm thấy spec (không rõ có hiện lỗi hay im lặng bỏ qua — **CHƯA XÁC MINH**, chưa đọc UI phần schedule/legend).
- **Model học "Gu"** (2 bộ trọng số perceptron) — hoàn toàn không liên quan `.idf`.
- **Metadata dự án ở Prisma** (`Project`, `ProjectMember`/phân quyền, `Flow`/`FlowVersion`, `LibraryAsset` — thư viện ảnh dùng chung) — không có gì trong số này đi theo `.idf`.
- **`collision?` trên `BlockEntity`** — có comment tường minh: *"KHÔNG phải dữ liệu bền vững, KHÔNG serialize vào .idf/DXF"* — tính lại mỗi lần render, cố ý loại khỏi export.

---

### ③ Bộ học "Gu" — lưu ở đâu, sống bao lâu, đổi máy có theo không

**Con số/đường dẫn thật (không phỏng đoán):**

Có **HAI** model perceptron độc lập, cùng cơ chế, khác phạm vi:

1. **Present-template** — khoá `interiorflow.gu.perceptron.present-template.v1** (hằng số `PRESENT_TEMPLATE_MODEL_KEY`, định nghĩa tại `lib/gu/feature-dict.ts:53`). Ghi/đọc qua `lib/gu/pairwise-perceptron.ts:168/178` (`saveToLocalStorage`/`loadFromLocalStorage`), gọi trực tiếp từ `components/present-editor/LayoutShelf.tsx:159` (load lúc mount) và `:220` (save ngay sau mỗi lần user bấm 👍 "Nhận" một template khi trước đó đã có template bị 👎 "Bỏ" cùng kệ — logic ghép cặp tại `LayoutShelf.tsx:210-221`).
2. **CAD-layout-option** — khoá `interiorflow.gu.perceptron.cad-layout-option.v1` (hằng số `CAD_LAYOUT_OPTION_MODEL_KEY`, định nghĩa tại `lib/cad/ai-layout-feedback.ts:20`). Ghi/đọc cùng cơ chế, gọi từ `components/cad/AiBriefPanel.tsx:274` (`model.update(...)` khi user chọn 1 trong 3 phương án đặt nội thất).

**Cả hai model ĐANG THỰC SỰ được cắm vào UI thật (đã xác minh trực tiếp bằng grep `.update(` — không phải suy đoán từ comment).**

> ⚠️ **Lưu ý sửa lại một phát hiện trước đó trong phiên này**: đầu phiên tôi đọc thấy header comment của `lib/gu/pairwise-perceptron.ts` ghi *"CHƯA cắm UI feedback ở pha này (Sprint 2)"* và tạm coi đây là dấu hiệu "mồ côi". Sau khi đọc trực tiếp `LayoutShelf.tsx` (có ghi chú riêng, mới hơn, ngày 20/07: *"👍 Nhận / bấm áp bố cục: tạo CẶP... → update → lưu"*) và `AiBriefPanel.tsx`, xác nhận **CẢ HAI đã được cắm thật, comment trong `pairwise-perceptron.ts` đã LỖI THỜI** (viết từ Sprint 2, chưa cập nhật sau khi 2 nơi gọi trên được thêm vào). Đây là ví dụ cụ thể "comment trong code không phải sự thật code đang chạy" — bảng này ưu tiên bằng chứng gọi hàm thật (`grep ".update("`) hơn comment.

**Trả lời trực tiếp câu hỏi của Hoà:**
- **Lưu ở đâu**: `localStorage`, KHÔNG có nơi nào khác. Bản thân class `PairwisePerceptron` được thiết kế "storage-agnostic" (chỉ cần JSON-serializable, header comment nói rõ CÓ THỂ đưa vào IndexedDB) nhưng **Sprint 2 CHỈ implement 2 hàm tiện ích cho localStorage** (`saveToLocalStorage`/`loadFromLocalStorage`) — không có bản IndexedDB nào tồn tại trong code hiện tại.
- **Sống được bao lâu**: vô thời hạn VỀ MẶT CODE (không có TTL/expiry nào), nhưng bị ràng buộc bởi mọi giới hạn của localStorage — dễ bị trình duyệt tự dọn khi thiếu chỗ (private mode, quota, "Clear browsing data").
- **Đổi máy có theo không**: **KHÔNG.** localStorage gắn với 1 (trình duyệt, origin) trên 1 máy — không có đồng bộ nào (không qua Prisma, không qua tài khoản user, không qua export/import tay). Đây **ĐÚNG NHƯ ĐIỀU HOÀ LO NGẠI**: *"học xong là mất"* nếu đổi máy hoặc đổi trình duyệt, kể cả cùng tài khoản đăng nhập.
- **Không phân biệt theo user/máy**: khoá localStorage là 1 chuỗi CỐ ĐỊNH (không có `<userId>` hay `<projectId>` chèn vào như các khoá khác ở §A.2 hàng 18/17) — nghĩa là NẾU nhiều người dùng chung 1 trình duyệt/máy (vd máy chung ở studio), trọng số học được BỊ TRỘN LẪN giữa mọi người dùng máy đó, không tách riêng theo tài khoản.
- **Độ "học giỏi"**: `minPairs = 10` (mặc định, `DEFAULTS` trong `pairwise-perceptron.ts`) — dưới 10 cặp accept/reject thì `rank()` tự động giảm cấp về heuristic thuần (không dùng trọng số học được), nghĩa là cần ÍT NHẤT 10 lượt tương tác THẬT trên CÙNG 1 máy/trình duyệt trước khi mô hình bắt đầu ảnh hưởng tới gợi ý — và mọi tiến độ đó biến mất ngay khi đổi máy, phải học lại từ 0.

**Kết luận cho mong muốn của Hoà** ("tầng 1 học giỏi nhất, học xong không mất"): hiện trạng code **CHƯA đáp ứng** — đây là bản đồ, không phải khuyến nghị, nên chỉ dừng ở việc chỉ ra sự thật này chứ không đề xuất hướng sửa.

---

### ④ Electron đã dùng hệ tệp thật chưa

**Đã dùng — nhưng KHÔNG theo cách renderer (giao diện web) tự ý đụng filesystem.** Cụ thể:

- `electron/preload.js` (22 dòng, đọc toàn văn) **CHỦ ĐÍCH KHÔNG mở bất kỳ kênh IPC nào** cho phía web đụng `fs`/Node API — chỉ `contextBridge.exposeInMainWorld('interiorflowDesktop', { isElectron, platform, versions })`, toàn field tĩnh, không hàm nào. Comment trong file: *"App web InteriorFlow vốn tự chạy độc lập trong trình duyệt... nên KHÔNG cần cầu IPC nào để hoạt động."*
- **Toàn bộ việc dùng `fs` thật nằm ở `electron/main.js`** (main process, Node thuần — không phải renderer), qua hàm `prepareWritablePaths()` (dòng 115-129):
  - `app.getPath('userData')` → thư mục ghi-được chuẩn OS (vd Windows `%APPDATA%/InteriorFlow`).
  - `fs.mkdirSync` tạo `<userData>` và `<userData>/uploads`.
  - `DATABASE_URL` bị **ghi đè** thành path tuyệt đối `<userData>/dev.db` (Prisma chấp nhận path tuyệt đối).
  - Khi spawn tiến trình `next start` con, `cwd` được đặt = `<userData>` — nhờ vậy MỌI code app hiện có dùng `process.cwd()/uploads` (route Library/Notebook, xem §A.3) **tự động** ghi đúng chỗ ghi-được, **KHÔNG PHẢI SỬA route nào** (comment tường minh trong `main.js` dòng cuối phần đầu file).
  - `loadUserConfig()` (dòng 147) đọc/ghi `<userData>/config.json` (copy từ `config.example.json` nếu chưa có) — chứa cấu hình như API key/`AUTH_SECRET`.
  - `runDbPush()` (dòng 192) chạy `prisma db push` idempotent vào `<userData>/dev.db` lúc khởi động (kể cả `electron .` lúc dev), có ghi log debug ra `<userData>/db-push.log`.

- **Mức độ dùng: TOÀN DIỆN cho phần "server-side" (DB + upload), GẦN NHƯ KHÔNG dùng cho phần "client-side" (IndexedDB/localStorage của renderer).** IndexedDB/localStorage trong bản Electron vẫn là profile Chromium NỘI BỘ do Electron/Chromium tự quản lý vị trí lưu trữ trên đĩa (thường cũng nằm đâu đó dưới `userData` theo quy ước Chromium, nhưng đây là Chromium tự làm, KHÔNG phải code app trong `electron/main.js` chủ động ghi/đọc gì vào đó).
- `lib/cad/auto-backup.ts` (đã đọc toàn văn ở phần đầu phiên) dùng **File System Access API** (`showDirectoryPicker`) chạy được thẳng trong Electron (Chromium thật) — comment tường minh trong file xác nhận đây LÀ LÝ DO không cần thêm cầu IPC: *"chạy được cả trong Electron... KHÔNG cần thêm cầu IPC nào (`electron/preload.js` cố ý không mở quyền filesystem)"*. Đây là ĐƯỜNG DUY NHẤT renderer chạm được filesystem thật NGOÀI vùng `userData`, và nó đi qua Web API chuẩn của Chromium chứ không qua Electron IPC.

**CHƯA XÁC MINH**: hành vi của trình gỡ cài đặt (uninstaller Windows NSIS / xoá app trên Mac) đối với thư mục `userData` — không có cách kiểm tra trong phạm vi đọc code (đây là hành vi hệ điều hành + cấu hình `electron-builder`, không nằm trong `electron/main.js`/`preload.js`). Ảnh hưởng trực tiếp tới cột "④ gỡ/cài lại app" của MỌI hàng liên quan `userData` trong bảng A — đã đánh dấu **?** nhất quán ở mọi hàng đó thay vì đoán.

---

### ⑤ Dữ liệu mồ côi

**Ghi mà không ai đọc (write-only) — 1 trường hợp xác nhận chắc chắn:**

- **`FlowVersion`** (Prisma model, §A.4 hàng 32) — `grep "prisma.flowVersion."` trên toàn bộ `app/`+`lib/` chỉ ra **ĐÚNG 1 điểm dùng duy nhất**: `app/api/flows/[id]/route.ts:37`, `prisma.flowVersion.create(...)`. **KHÔNG có bất kỳ `findMany`/`findUnique`/`findFirst` nào đọc lại model này ở đâu trong code hiện tại.** Đây là ca giống hệt ví dụ Hoà nêu (bảng tri thức Google Flow bị ghi mà không ai import) — model được tạo mỗi lần user bấm "Run flow" (snapshot lịch sử phiên bản), nhưng hiện KHÔNG có UI/route nào (lịch sử phiên bản, "xem bản cũ", rollback...) đọc lại các bản snapshot đó. Bảng đang phình dần theo mỗi lượt Run mà không phục vụ tính năng nào đang chạy.

**Đọc mà không ai ghi (read-only, khả năng orphan ngược) — 1 trường hợp cần lưu ý:**

- `components/studio/FoldableDualPane.tsx:32` đọc `FLAG_KEY` = `interiorflow.labs.dualpane` (`getItem`) nhưng **grep repo-wide KHÔNG tìm thấy `setItem` nào ghi khoá này** ở bất kỳ file `.ts`/`.tsx` nào đã quét. **CHƯA XÁC MINH đầy đủ** — có thể đây là flag "bật tay qua DevTools Console" có chủ đích (kiểu feature-flag ẩn cho tester, không cần UI bật/tắt chính thức), hoặc là code còn sót từ 1 UI đã bị gỡ. Không đủ bằng chứng để kết luận chắc chắn, ghi CHƯA XÁC MINH thay vì đoán.

**Không phải orphan dù ban đầu nghi ngờ (đã xác minh lại, liệt kê để tránh hiểu lầm khi đọc bảng A):**

- `lib/refingest.ts` (`interiorflow.refManifest`) — ban đầu nghi ngờ vì không thấy trong danh sách sơ bộ của Hoà, nhưng đã xác minh có UI thật gọi: `app/library/ingest/page.tsx`.
- `lib/present-editor/custom-templates.ts` (`interiorflow.customTemplates`) — có UI gọi: `LayoutShelf.tsx`.
- `lib/present-editor/brand-kit.ts` — dùng rộng ở 6+ file component/lib.
- 2 model perceptron "Gu" — đã xác minh KHÔNG mồ côi, xem **Câu hỏi ③**.

---

## C · CHỖ CHƯA XÁC MINH ĐƯỢC (tổng hợp — không đoán để lấp đầy bảng)

1. **Hành vi uninstaller Electron với thư mục `userData`** (Windows NSIS / macOS) — ảnh hưởng cột "④ gỡ/cài lại app" ở TẤT CẢ các hàng liên quan `userData`, `dev.db`, `uploads`, IndexedDB/localStorage trong bản đóng gói. Cần test tay trên máy thật, không thể xác minh từ code.
2. **`PhotoEmbed.src`** — chưa tìm được nơi gán giá trị để xác nhận 100% là dataURL tự chứa (giống `SiteImage.src`, đã xác minh) hay có khả năng là URL tham chiếu ngoài.
3. **`components/studio/FoldableDualPane.tsx`'s `FLAG_KEY`** (`interiorflow.labs.dualpane`) — có `setItem` ở đâu đó ngoài phạm vi grep đã chạy, hay là flag chỉ bật tay qua console/query param.
4. **`comments-review.json` + `public/comments-images/`** có được `electron/main.js` dời theo `userData` giống `uploads/` hay không — code chỉ nhắc rõ `uploads/`, 2 đường dẫn này nằm ngoài `uploads/` nên KHÔNG CHẮC có được dời theo hay vẫn nằm trong thư mục cài đặt (có thể không ghi được khi đóng gói).
5. **`interiorflow.notebook.<projectId>.mock.v1`** (localStorage, `useNotebook.ts`) — tên gọi "mock" gợi ý đây là dữ liệu NHÁP/THỬ NGHIỆM tách biệt khỏi `NotebookSource`/`NotebookChunk` thật ở Prisma, nhưng chưa đọc đủ `useNotebook.ts`/route liên quan để xác nhận quan hệ chính xác giữa 2 nguồn này (có đồng bộ 1 chiều? có phải fallback khi API lỗi?).
6. **UI đọc `BlockEntity.specId`/legend/schedule** khi `ProductSpec` bị xoá (dangling FK sau khi xoá `dev.db` hoặc xoá tay `ProductSpec`) — có hiện cảnh báo rõ ràng hay lặng lẽ bỏ qua dòng đó. Chưa đọc component vẽ legend/schedule.
7. **`recoverBackup()` (auto-backup.ts) ghi kết quả khôi phục trở lại IndexedDB qua đường nào cụ thể** — đã xác minh hàm trả về `{sheets, degraded, recoveredAsOf}` nhưng chưa đọc UI gọi hàm này để xác nhận bước cuối "ghi vào `saveSheets()`" diễn ra chính xác ở đâu.
8. **Đồng bộ nhiều tab trình duyệt** cho canvas node-flow (Cặp 1, Câu hỏi ①) — chưa tìm thấy `BroadcastChannel`/`storage` event listener nào trong `lib/store.ts`; nếu không có, 2 tab có thể tạm thời hiện dữ liệu lệch nhau vài giây, nhưng chưa xác minh chắc chắn có/không cơ chế này ở nơi khác trong repo.

**Kích thước dữ liệu**: mọi con số "cỡ điển hình" trong bảng A là ước lượng ĐỊNH TÍNH dựa trên comment code + kiểu dữ liệu (dataURL vs text vs Decimal...), **KHÔNG phải đo thật** trên dữ liệu sản xuất (không có quyền chạy DB thật/không có dữ liệu mẫu trong phạm vi khảo sát này).
