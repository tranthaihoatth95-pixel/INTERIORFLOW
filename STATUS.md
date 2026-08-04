# STATUS — InteriorFlow

## ✅ XONG (05/08 — ĐẶT LẠI TÊN NODE: tách VI/EN · 6 nhóm quy trình · 5 tên sai ngành, CHƯA COMMIT theo luật V6)
VIỆC 1: `NodeDefinition.titleEn` (mới, optional — `lib/types.ts`) · tách **46 nhãn** `'Việt · English'`
→ `title` chỉ tiếng Việt + `titleEn` ra TOOLTIP (bảng chọn node + mặt node trên canvas). EN interface
đảo lại (hiện tên EN, tooltip VI) — không mất chữ ở ngôn ngữ nào. Tên EN vào kho tìm kiếm
(`search.ts` + ⌘K `CommandPalette`) nên gõ "batch variants"/"inpainting" vẫn ra đúng node.
VIỆC 2: `lib/nodes/groups.ts` MỚI (6 nhóm quy trình archviz: Nguồn·Gu·Máy quay·Dựng ảnh·Sửa ảnh·Hồ sơ,
**1 node = 1 nhóm**) THAY `lib/nodes/tags.ts` (7 tag kỹ thuật, đã xoá — chỉ `NodeLibraryPanel` +
`edgecase-stress.test.ts` dùng, cả 2 chuyển sang groups). Xếp đủ **cả 46 node** registry, không chỉ 18.
VIỆC 3: 5 tên sai ngành → `Mặt nạ đối tượng`(Object Mask) · `Sửa vùng`(Inpainting) · `Ghi kích thước`
(Dimension Annotation) · `Bảng gu`(Style Reference) · `Hoạ tiết`(Pattern); nhãn cũ giữ trong `keywords.ts`
để người quen tên cũ vẫn tìm ra; đồng bộ `task-cards.ts` + chuỗi lỗi/mô tả nhắc tên cũ.
⛔ **id kỹ thuật KHỚP 100%** (diff `type: '...'` trước/sau = rỗng, 46/46) — không đụng tên file/key registry.
Verify browser thật (127.0.0.1:3002, server riêng phiên này): 6 nhóm + 6 chip hiện đúng thứ tự quy trình
· nhãn VI ngắn, `title` attr mang tên EN (đọc DOM 60 thẻ) · gõ "object mask"/"inpainting" ra đúng node ·
EN interface đổi cả chip lẫn nhãn thẻ · 0 lỗi console. `tsc -p .` sạch · `npm test` chỉ 1 fail CŨ đã biết
(`cad-to-obj` entityId nội thất) · +4 test `search.test.ts`, phần [1] `edgecase-stress` viết lại theo groups.
🟡 **3 sửa phụ bắt được LÚC VERIFY** (pre-existing, ghi rõ để Hoà biết đã đụng): (1) memo `groups` thiếu
`phase` trong deps → đổi chặng thì 6 nhóm giữ kết quả cũ, lặp node vùng Mood/Công cụ; (2) 2 vùng ghim
Mood/Công cụ bị ẩn hẳn khi đang gõ mà node của chúng cũng không lọt vào 6 nhóm ⇒ ở chặng 3D gõ tên 12
node Công cụ ra "Không tìm thấy khối nào" — nay vùng ghim tự lọc theo truy vấn; (3) dòng "Không tìm thấy"
nay đếm cả vùng ghim, không hiện sai khi có kết quả.
⚠️ **Cần Hoà biết**: cột "Đầu vào" từng bị bỏ ở layout nghỉ (Hoà 04/08) — nay ① NGUỒN hiện lại vì nó là
BƯỚC quy trình (chứa Tạo ảnh từ chữ · Phác tay · Bản vẽ → 3D), không phải cột "đầu vào thuần" cũ.

## ✅ XONG (05/08 — P12 chốt giá 3 task AI internal-free, CHƯA COMMIT theo luật V6)
Chốt giá Hoà giao TỔNG quyết: `removeBg`·`materialSwap`·`segment` MIỄN PHÍ khi luồng lớn gọi
NỘI BỘ, TÍNH PHÍ khi mở thẳng công cụ — "họ mua MỘT tấm ảnh, không mua ba lượt gọi mô hình".
Làm: `INTERNAL_FREE_TASKS` (whitelist cứng 3 task) + `costOfTask(task,{internal})` (`lib/ai/
tiers.ts`) · cờ đi `runImageJob(...,internal)` → body `/api/jobs` → `costOfTask` (`lib/ai/
client.ts` + `app/api/jobs/route.ts`, NGOÀI vùng khai báo nhưng bắt buộc — cờ không tự tới
server được, ghi rõ lý do) · bật `internal:true` đúng 3 chỗ: idmask `removeBg` + localedit
`materialSwap` (`render-v2.ts`) + SmartSelect `segment` (khôi phục đúng ý gốc "không tính
credit lần chạy lại"). `furnitureextract` GIỮ tính phí (removeBg = chính sản phẩm nút đó).
`lib/server/credits.ts` KHÔNG cần sửa (`spendCredits` sẵn no-op khi amount=0). Test
`tiers.test.ts` 31/31 (cả 2 đường + chốt an toàn: cờ không miễn phí được task ngoài whitelist)
· `tsc -p .` toàn repo sạch. Audit R2 đã ghi dòng chốt (hết "cần Hoà chốt"). ⚠️ Đánh đổi đã
ghi docblock: cờ do client khai ⇒ curl `internal:true` free được đúng 3 task này (nặng nhất
materialSwap 4); task đắt render/video vẫn chặn. VIỆC 2 (E4-E7 vào DUONG-VE-DICH): **đã có
sẵn trong working tree do phiên khác ghi, khớp brief 1-1 — không ghi trùng.**

## 🔴 XONG MỘT PHẦN (04/08 tối — P1-VERIFY nhập DWG bằng file thật, chi tiết `SO-KIEM-TONG.md` §11)
Verify `2236e0d` bằng 34 file .dwg thật + phát hiện khoảng trống: `openDwgFile()` có sẵn
`opts.signal`/`opts.onProgress` nhưng chưa nút nào gọi tới — nối vào `CadEditor.tsx` (state
`dwgImportAbort` + thanh nổi "Đang nhập DWG… [Huỷ]"). Verify browser thật 3 ca: **thành công**
(`Small office.dwg` 224KB → 315 đối tượng, đúng) · **tiến độ sống** (`ID-02-GN-200-00-001.dwg`
21MB → status cập nhật mỗi giây đúng giai đoạn `convertEx`) · **file hỏng báo lỗi rõ** (2 biến thể
chữ ký sai → thông báo có tên file cụ thể, đúng yêu cầu).
🟡 **BUG "Huỷ = treo tab": ĐÃ SỬA theo hướng Hoà chốt, nghiệm thu CÒN THIẾU** (chi tiết `SO-KIEM-
TONG.md` §11d). Hoà chốt: **Huỷ = BỎ RƠI worker, không `terminate()`**. Sửa xong ở `lib/cad/dwg.ts`
(`finish(settle, orphan)` + `orphanDwgWorker()` gỡ listener, trần 2 worker mồ côi, `console.warn`
để debug) — code đã nằm trong `dace0c4` (bị cuốn theo commit docs phiên khác, lần thứ 5, không mất
dữ liệu). `tsc` sạch · `dwg.test.ts` 21/21.
🔴 **CHƯA đo/chụp được "huỷ 9.7MB → UI sẵn sàng <1s"** như nghiệm thu yêu cầu: verify lại chính file
đó thì tab mất phản hồi CDP **ngay khi vừa dispatch**, chưa kịp bấm nút Huỷ (khác §11c — ở đó bấm
được rồi mới treo). Đo `ps`: renderer giữ ~100% một lõi liên tục, **elapsed 19:13 / CPU time 14:00**
mới can thiệp. **2 phát hiện MỚI nặng hơn §11c**: (1) nhánh `hardTimeout` 60s tự động gọi
`terminate()` mà CPU vẫn full tải ~18 phút sau mốc đó ⇒ `terminate()` không cắt được vòng WASM này;
(2) **đóng hẳn tab cũng KHÔNG giải phóng renderer** — phải `kill -9` tầng OS. ⇒ Giả định nền của
hướng "bỏ rơi" (*trình duyệt tự dọn khi tab đóng*) CHƯA chắc đúng cho ca vòng lặp nặng: worker mồ
côi có thể ăn nguyên 1 lõi vĩnh viễn; trần 2 worker chặn được RAM, KHÔNG chặn được CPU.
→ **Chờ Hoà quyết tiếp** (3 lựa chọn ghi ở §11d): (a) áp `orphan` cho cả nhánh timeout tự động ·
(b) cảnh báo/chặn theo ngưỡng dung lượng trước khi nhập · (c) chấp nhận, chỉ ghi TECH-DEBT.
Phụ (cũ, chưa đổi): file .dwg cắt cụt còn header → vào êm "0 đối tượng" thay vì báo lỗi rõ.
🔴 **VI PHẠM TRUNG TÍNH cần Hoà xử lý**: `public/__dwg-cancel-test.dwg` (9.7MB = bản sao hồ sơ khách
thật `01_BeachClub_TangHam.dwg`) **đã bị `add -A` của phiên khác commit vào lịch sử git** (`dace0c4`).
Bản trên đĩa nay đã mất (không phải phiên này xoá). Cần `git filter-repo` trước phát hành — xem §11d.

## ✅ XONG (04/08 — P5 luật kính lỏng + khuôn EmptyState toàn app)
VIỆC 1: `.glass-float`/`.glass-float--bar` vào `globals.css` (cạnh `.vitals-pop`) — panel 34% +
blur(--blur) saturate(1.3) + gờ trên sáng hơn (t1 26% vs 14%) + shadow 0 8px 32px; áp ĐÚNG 4 chỗ:
`ModeSwitchBar` (toolbelt canvas 3D) · nút "Dựng ảnh" (`Render3DModeSkeleton`, nền accent đặc →
kính, icon giữ accent) · ViewCube (`Viewport3D`+`ve3d-css` overflow:hidden) · nút đóng `Lightbox`.
Luật ghi APPEND vào `00-BAT-DAU-DOC-DAY.md` §4 (G9): cấm Inspector/cây tầng/bảng vật liệu/popover
Vitals (→`.vitals-pop`), trần 4 tấm backdrop trên WebGL. VIỆC 2: khuôn `components/ui/EmptyState.tsx`
rút từ mock `mock-if-thu-vien-trong.html` (cấu trúc thật ngăn kệ/hàng ghost + ≤2 nút làm việc TẠI
CHỖ, disabled phải kèm lý do §9) — nối vào `MaterialsScreen` (rỗng thật ≠ lọc rỗng, nút mở form/
wizard tại chỗ) · `BoqScreen` (docSource none) · `LibraryPanel` (rỗng thật, mở popover [+]) ·
`GalleryPanel` (disabled kèm lý do — ảnh chỉ vào qua node cùng canvas). Tệp/`FileManagerShell` ĐÃ
đúng khuôn sẵn (fan giấy + CTA tại chỗ) — không đụng. `tsc -p .` sạch; verify browser thật
(127.0.0.1:59978, server riêng autoPort vì 3005 bận): 3 chỗ kính đo computed style đúng số cả 2
theme + Lightbox mounted đúng class; EmptyState chụp Gallery panel + BOQ cả 2 theme, chữ rõ.
**CHƯA chụp được**: kho vật liệu rỗng (DB demo có 2 vật liệu thật — KHÔNG xoá dữ liệu để dựng ảnh)
· Trình chiếu không có màn rỗng chạm được (luôn sample deck). Lỗi console duy nhất = `EditorCanvas`
max-update CŨ đã ghi từ trước, không do việc này.

> ⚠️ Git là sự thật duy nhất — verify SHA bằng `git log`, không chép từ brief/memory.
> ⚠️ Sản phẩm = **Drafting CAD · Rendering · Presenting** + login/Gallery/Vitals/Notebook.
> ⚠️ **ĐỌC `CLAUDE.md` LUẬT NỀN TẢNG**: IF ĐỘC LẬP GLOBAL, không dính TTT. Brand Kit = nhận diện TỪNG DỰ ÁN.
> Lịch sử → `CHANGELOG.md` (không đọc mỗi phiên).

## ✅ XONG (04/08 — P8 sửa 4 lỗi màn Thiết kế 3D, `3305001`+`bdeffd3`, chi tiết `SO-KIEM-TONG.md` §10)
Trùng nút Tường/Cửa/Cửa sổ (`Command3DPanel.tsx`, gộp về đúng 1 nhóm Cấu kiện, Hộp/Sàn/Mái tách
"Khối cơ bản") · ViewCube3D vỡ khung (canvas thiếu `style.width/height`, tràn 2x theo DPR — sửa 1
dòng) · tooltip đè nút (mở rộng `Tooltip.tsx` dùng chung thêm `side='right'` tự lật trái khi hết
chỗ). LỖI 2 "lẫn theme" KHÔNG tái hiện được dù kiểm kỹ 4 tab × 2 theme × 3 độ rộng — không sửa,
ghi rõ không giả vờ. Phát hiện phụ NGOÀI phạm vi: Lockscreen bị canvas 3D che mất click (đã tách
việc riêng, xem task đã spawn). `tsc`/`npm test` sạch, không hồi quy.

## ✅ XONG (04/08 — P3 KHO VẬT LIỆU VIỆC 3+4: màn quản lý + nhập Excel/CSV, `0120987`)
`docs/PHIEU-CODE-IF-KHO-VAT-LIEU-V1.md` — VIỆC 1 (4 cột schema) đã xong từ trước (`9710611`).
**VIỆC 3**: `components/materials/*` (MaterialsScreen/Table/FormModal) — thêm/sửa/xoá/tìm/lọc/
gắn ảnh, dùng ĐÚNG API sẵn có `GET/POST /api/specs` + `PATCH/DELETE /api/specs/:id` (không route
mới). Mở từ Settings → Nâng cao → "Mở kho vật liệu" (`app/materials/page.tsx`, N6: grep xác nhận
`PixelSettingsShell.tsx` → router.push('/materials') → MaterialsScreen → MaterialTable/FormModal/
ImportWizard, chuỗi đủ).
**VIỆC 4**: `MaterialImportWizard.tsx` + `lib/materials/warehouse/*` — đọc xlsx/csv (thêm dep
`xlsx`), nhận diện định dạng qua `lib/gateway/detect.ts` CÓ SẴN (KHÔNG viết cửa nhận diện thứ
hai, đúng chỉ đạo phiếu) → ghép cột tay (đoán qua từ khoá VI/EN + nhớ theo chữ ký tiêu đề,
`column-mapping.ts`) → xem trước 20 dòng báo lỗi rõ dòng nào hỏng → ghép ảnh thư mục theo SKU
trùng tên file. **Bug thật bắt được lúc viết test**: SheetJS đọc CSV không tự nhận UTF-8 → mọi
ký tự có dấu tiếng Việt mojibake ("Mã" → "MÃ£") — sửa bằng tự giải mã UTF-8 trước khi đưa
`XLSX.read`; nhánh xlsx (ZIP+XML) không bị lỗi này, XML tự khai UTF-8 sẵn.
`lib/server/specs.ts`: vá `specToDto/specNormalize/specPatch` thêm `unit/priceVnd/scope/ownerId/
supplierId/verified` (cột VIỆC 1 đã khai DB, chưa ai đọc/ghi qua API) — `ownerId` LUÔN ép theo
session user (client không tự khai), `scope` ép cứng `'studio'` (tầng `global` chưa có luật
duyệt, đúng luật §9 phiếu). Đặt `lib/materials/warehouse/` làm subfolder RIÊNG trong
`lib/materials/` — không trộn file phẳng với `lib/materials/schema.ts` (đó là matId PBR thị
giác, đây là ProductSpec thương mại, đúng luật 2.1.9.i "cố ý không trộn").
53 test mới pass (`column-mapping`/`apply-import`/`image-match`/`xlsx-parse`), `npx tsc --noEmit
-p .` sạch phần của mình, `npm test` 0 fail mới (chỉ còn 1 fail cũ đã biết, `cad-to-obj.test.ts`,
không liên quan). Verify browser thật (127.0.0.1:3000): thêm tay 1 vật liệu → hiện đúng bảng ·
sửa giá vật liệu có sẵn → đúng chặn 403 "chỉ admin" (hành vi cũ, không phải bug) · nhập CSV 3
dòng (dấu tiếng Việt) → tự map đúng 8/8 cột, 2 dòng hợp lệ vào kho, 1 dòng thiếu "Tên" báo lỗi
rõ, không chặn 2 dòng còn lại. Đã xoá sạch dữ liệu test khỏi `dev.db` (query xác nhận 0 dòng còn
lại) sau khi verify.
🔴 **Hai phiên chung `.git` — lần này va ngay lúc code, không phải sau khi commit**: `tsc` phát
hiện `components/cad/CadToolbar.tsx` đổi lỗi TS giữa 2 lần chạy liên tiếp (khác bug set mỗi lần)
— phiên khác đang sửa DWG (`lib/cad/dwg-map.ts`/`dwg-worker.ts`/`dwg.ts` + `dwg.test.ts` mới,
đúng mục "2.1.6.d bug Nhập DWG" trong STATUS.md "Chờ USER quyết") SONG SONG lúc tôi verify. Đã
lọc chắc chắn lỗi tsc CHỈ nằm ở file đó (0 lỗi còn lại khi loại `CadToolbar.tsx` khỏi output) —
không đụng, không commit file của họ, commit của tôi giới hạn đúng pathspec 8 mục việc mình.

## ✅ XONG (04/08 — P7 ĐỔI TÊN 3 chặng: 2D Kỹ thuật/3D Thiết kế/Trình bày → Thiết kế 2D/Thiết kế 3D/Trình chiếu)
Hoà chốt: IF1/IF2 nay gộp chung nên ngữ nghĩa nhãn cần RỘNG hơn. Đổi CHỈ NHÃN hiển thị — khoá kỹ
thuật `concept/render/present`·`sketch/pro/revit`·`node/3d` GIỮ NGUYÊN TUYỆT ĐỐI (verify: không
đụng dòng nào ngoài `label:`/chuỗi hiển thị). Nguồn gốc `lib/phases.ts` (comment append-only, giữ
lịch sử tên cũ) + ~20 file UI đồng bộ theo: `ShortcutsPanel`·`AppCommandPalette`·`StageSwitcher`·
`VitalsGesture`·`LibrarySheet`·`CadEditor`·`ZonePanel`·`Toolbar` (present-editor)·`NodeExtras`·
`StageIntroCard`·`StagePresetPanel`·`IntroSequence`·`ReferencePane`·`PresentDeck`·`overview/page`
·`lib/shortcuts.ts`·`lib/ai/chat-assist.ts`·`lib/present-demo.ts`. Docs: `00-BAT-DAU-DOC-DAY.md`
(bộ tên chính thức, bản cũ giữ làm blockquote lịch sử) · `SPEC-MODE-PER-STAGE.md` (ghi chú đầu
file) · `CHECKLIST-TONG.md` (1 dòng changelog cuối file, không sửa đè hàng cũ).
`components/ProjectSelect.tsx` **CHƯA đổi** (thuộc vùng P5, bỏ qua tránh conflict theo đúng luật
hai-phiên-chung-git — 1 dòng "Cách dùng 2D Kỹ thuật · 3D Thiết kế · Trình bày?" còn sót).
`npx tsc --noEmit -p .` sạch (chạy nền, exit 0). Verify browser thật (127.0.0.1:3001, cổng riêng
phiên này, KHÔNG đụng cổng 3000/3004 đang chạy): header StageSwitcher, ⌘K palette, tab-tooltip
(title attr đọc qua `read_page`), toolbar Nhập/Xuất present-editor — cả 3 chặng đúng nhãn mới ở
2 route (`/present-editor`, `/cad-editor`) + màn Cài đặt. Chưa bấm riêng toggle EN qua UI (scroll
bị kẹt trong sandbox) nhưng chuỗi EN đã sửa đúng theo yêu cầu (chỉ "2D Technical"→"2D Design" đổi,
"3D Design"/"Presenting" giữ nguyên) — xác nhận bằng đọc lại source, chưa xác nhận bằng mắt UI.

## ✅ XONG (04/08 — P1 bug đỏ 2.1.6.d "nhập DWG treo vĩnh viễn": timeout+tiến độ+huỷ+lỗi rõ)
TÁI HIỆN bằng **34 file .dwg THẬT** (`~/Documents/Zalo Received Files` — dự án thật của studio,
không phải file tự chế, đúng luật N3): 4/34 file (11–21MB) vượt 25s không phản hồi; đo lại kỹ hơn
(không giới hạn) xác nhận KHÔNG phải vòng lặp vô hạn tuyệt đối trong các case đã thử — nhưng tốn
tới **39 giây** (file 21MB) và thời gian KHÔNG ổn định giữa các lần chạy (cùng 1 file: <10s hoặc
>25s tuỳ tải máy), với ZERO tiến độ/timeout/huỷ trước đó — đúng cảm giác "treo vĩnh viễn" người
dùng mô tả. Đo chính xác nút cổ chai: `dwg_read_data` luôn nhanh (vài giây kể cả 21MB), chậm là
`convertEx`. Không loại trừ file khác gây vòng lặp C thật sự (ngoài tầm sửa — code C biên dịch
WASM) — cách phòng thủ đúng bất kể nguyên nhân là timeout cứng từ NGOÀI.
Sửa (`lib/cad/dwg.ts`+`dwg-worker.ts`+`dwg-map.ts`, đúng vùng giao — không đụng `dxf*.ts` vì không
cần, không đụng `cad-to-obj.ts`/`findHatchBoundary` như cảnh báo vì KHÔNG liên quan): **timeout
cứng** mặc định 60s (`DEFAULT_DWG_IMPORT_TIMEOUT_MS`, chỉnh được qua `opts.timeoutMs`) — CHỈ làm
được từ main thread qua `worker.terminate()` (đã đọc `.d.ts` thật: `dwg_read_data`/`convertEx`
ĐỒNG BỘ, không callback/progress hook nào, worker không thể tự huỷ giữa chừng) · **tiến độ CÓ
THẬT** — worker báo 2 mốc giai đoạn thật (`reading`/`converting`, KHÔNG phải % giả) + heartbeat
elapsed-time mỗi 1s từ main thread, mặc định ghi thẳng `useCadStore.setStatus()` (làm NGAY trong
`dwg.ts` vì ticket giới hạn vùng file, không được sửa `CadEditor.tsx`) · **huỷ được** qua
`opts.signal` (AbortController, cơ chế sẵn — nút "Huỷ" thật cần sửa CadEditor.tsx, ngoài vùng file
ticket này) · **lỗi rõ hơn** — mọi thông báo lỗi/timeout nay có tên file, kích thước, phiên bản DWG
đọc từ header (bảng `DWG_VERSION_NAMES`), và ĐANG Ở GIAI ĐOẠN NÀO khi treo. `openDwgFile(f)` gọi
như cũ (1 tham số) vẫn chạy y nguyên — chỉ tự động được bảo vệ thêm, không phá caller cũ.
Test mới `lib/cad/dwg.test.ts` (21/21, các hàm thuần format thông báo — không test được
`openDwgFile`/Worker thật vì `dwg.ts` chứa `import.meta`, giống lý do `dwg-map.ts` tách riêng từ
đầu) + `dwg-flatten.test.ts` cũ 36/36 không hồi quy. `tsc --noEmit -p .` sạch.
**CHƯA LÀM lúc đó** (nút Huỷ + verify thật) → đã làm + phát hiện bug MỚI, xem entry P1-VERIFY phía
trên đầu file · chưa xác nhận được TRUE infinite loop trong `convertEx` (nếu tái diễn với timeout
60s vẫn "treo" → là bug C thật trong libredwg-web, cần báo upstream, không phải thiếu timeout nữa).

## ✅ XONG (04/08 — P4 xuất PDF: sàn nét in an toàn + số tờ/phiên bản, `df6ca85`)
Brief P4 mô tả "xuất PDF hiện là chụp màn hình" — **SAI so code thật** (đã kiểm `git log` trước
khi sửa): `lib/cad/pdf.ts` từ lâu đã là **vector plot thật** (từng Entity vẽ lại bằng API hình học
jsPDF, không `addImage()`) — A0-A4 × ngang/dọc đã tách trục độc lập (`PAPER_SIZES_MM`/
`paperSizeMm`, `model.ts`) · **plot-to-scale 1:N thật** (`fixedScaleViewport`/`doc.printScale`,
`STANDARD_SCALES` gồm đủ 10/20/25/50/100/200/500) · lineweight ISO 128 mm-trên-giấy thật (không
nhân zoom) · khung tên `titleBlockPro` (`commands.ts`) đã có project/drawing/scale/author/date/
checker/studio — đã có 24+19 test cũ (`pdf-scale.test.ts`/`pdf-sheetset.test.ts`) pass sẵn.
**Việc thật còn thiếu** (đúng vùng `lib/cad/pdf*.ts`): (1) sàn bề dày nét mảnh nhất 0.03mm — DƯỚI
lineweight ISO 128 mảnh nhất (0.13mm), rủi ro mất nét khi in phổ thông → nâng lên
`MIN_PRINTABLE_LINE_MM=0.1mm` (1 điểm sửa, `setStroke()`); (2) "số tờ"/"phiên bản" trong khung tên
— thêm `sheetIndex`/`sheetCount`/`version` vào `CadPdfOptions` + `pdfFooterLine()` (hàm thuần),
`buildSheetSetPdf` TỰ điền theo đúng thứ tự `sheets[]`. **CHƯA nối được vào khung tên ENTITY thật**
(chỉ vẽ ở dòng ghi chú cuối trang) — `TitleBlockInfoPro`/`titleBlockPro` sống ở `commands.ts`,
ngoài vùng file P4 được giao; cần phiên khác thêm field `version` rồi nối UI mới đủ.
Test mới `lib/cad/pdf-print-fidelity.test.ts` (14/14) — **GIẢI MÃ byte content stream PDF thật**
(không chỉ tin `scaleLabel`): đúng nghiệm thu gốc tường 4000mm @ 1:50 trên A3 → đo được 80.00mm ·
cả 4 tỉ lệ 20/50/100/200 → 200/80/40/20mm đúng · nét khai 0.01mm vẫn in ra ≥ sàn an toàn (không
biến mất). `tsc --noEmit -p .` sạch, không hồi quy 2 file test cũ. KHÔNG đụng
`components/cad/*`/`CadSheets.tsx` (đúng chỉ đạo, nhường P2 multi-sheet Sheet[]).

## ✅ XONG (04/08 — SPEC-DUNG-BO-LENH-3D VIỆC 1+2: nối extrude+arrayLinear thật)
`ops[]` trước chỉ boolean chạy thật (27d8c6d) — extrude/arrayLinear mới khai TYPE. Nay nối THẬT cả
2: **extrude** (bevel vát cạnh trên) áp ở `lib/three/cad-to-obj.ts` `ObjBuilder.prismBeveled()` (cần
đa giác gốc `h.points`, làm TRƯỚC khi xuống triangle soup — khác boolean/arrayLinear chạy ở tầng
ba.js) + `insetPolygonMm()` co đa giác (chép cục bộ công thức `offsetEntity` hatch của
`geometry.ts`, TRÁNH kéo `lib/cad/store.ts` vào module "thuần TS không DOM"). **arrayLinear**
(nhân bản dãy) áp ở `lib/three/build-ops.ts` `resolveGroupGeometry()` — SAU boolean (khoét trước,
nhân bản sau, đúng thứ tự modifier stack) — `repeatGeometry()` nối N bản dịch theo `cadToThreeM()`
(tái dùng phép đổi trục có sẵn). `lib/cad/commands.ts` thêm `setEntityBevel`/`setEntityArrayLinear`
(sửa-tại-chỗ, không cộng dồn — khác `cutHoleInWall` cố ý cộng dồn) + `railingPosts()` (dựng 1 cột
qua `wallSegment()` + gắn arrayLinear, dùng cho nút "Lan can"). VIỆC 2: `Object3DInspector.tsx`
thêm `BevelAction`/`ArrayAction` cạnh `CutHoleAction` (chọn tường → panel phải) · `Command3DPanel.tsx`
mở khoá nút **"Lan can"** (tầng ⑥, gọi `railingPosts` qua `Render3DModeSkeleton.tsx`), 8 nút cấu
kiện còn lại đổi từ lý do chung "đợi ops[]" sang lý do ĐÚNG riêng từng mục (cửa/cửa sổ: đã dựng
được qua thư viện đồ, chỉ chưa nối nút này; cầu thang/tủ bếp: chưa có lệnh tham số tầng ⑥; phào chỉ:
cần sweep chưa có; trần thả: cần khối nổi chưa có cơ chế) — sửa luôn câu "sua" tab cũ SAI (nói
"Bevel... sắp có" dù không có nút bevel nào ở tab đó, bevel thật nằm ở Inspector). CHƯA CÓ tay vịn
ngang cho lan can (tường luôn đùn từ sàn z=0, chưa có khối nổi — ghi rõ trong code, không giấu).
Test mới: `commands.test.ts` (+26), `cad-to-obj.test.ts` (+5, bevel), `build-ops.test.ts` (+5,
arrayLinear+compose với boolean) — toàn bộ pass, `npx tsc --noEmit -p .` sạch, `npm test` chỉ còn
đúng 1 fail cũ đã biết (entityId nội thất, không liên quan). Verify browser thật (127.0.0.1:3000,
"Dự án mẫu"): bấm "Lan can" → 9 cột thật xuất hiện trong cây đối tượng · Inspector 3 nút Khoét
hốc/Vát cạnh/Nhân bản dãy đổi nhãn đúng theo state · gộp cả 3 ops (boolean+extrude+arrayLinear)
trên cùng 1 entity không lỗi console — đã xoá sạch entity test khỏi "Dự án mẫu" sau khi verify
(qua `window.__cadStore.removeIds`, không đụng `setState` ghi đè).
🔴 **Hai phiên chung `.git` tái diễn**: 7/9 file việc này (mọi thứ trừ `STATUS.md` + 2 file test
`cad-to-obj.test.ts`/`build-ops.test.ts`) bị cuốn vào commit `a40adf2` "khoa duong ve dich 3 dot"
của phiên khác (họ `git add -A` thay vì giới hạn pathspec, đúng luật cấm ở `CLAUDE.md`). Đã verify
lại nội dung file thật khớp 100% (đọc code + chạy lại `tsc`/3 file test — sạch/pass) — KHÔNG mất
dữ liệu, chỉ lệch tên/nhãn commit. Không rewrite lịch sử.

## ✅ XONG (04/08 — mở rộng BOQ editor: quy cách/đơn vị · nhóm theo phòng · in A4 ngang)
BOQ editor UI **đã có sẵn từ trước** (`4991340`, B0-B6+B10, `components/present-editor/boq/*` —
STATUS.md cũ KHÔNG ghi việc này, chỉ phát hiện qua đọc `git log` trực tiếp) — không tạo bản song
song ở `components/boq/*`/`app/(boq)/*` như chỉ đạo gốc ghi, mà MỞ RỘNG bản có sẵn (đúng luật
"một cỗ máy nhiều mặt tiền"), KHÔNG đụng `lib/boq/*` (tầng tính). Thêm: 2 cột **Quy cách/Đơn vị**
(JOIN hiển thị theo `matId` qua `GET /api/specs`, `lib/present-editor/boq-spec-extra.ts`, MỚI) ·
**nhóm theo Phòng** (`groupBoqRowsByRoom`, `boq-group.ts` — tái dùng `findRoomLabels`/
`pointInPolygon` có sẵn, KHÔNG viết engine hình học mới; SUY ĐOÁN khi không dò được biên khép kín
→ cờ `inferred` lộ badge, đúng luật `SPEC-TANG-DU-LIEU-CAU-KIEN`) toggle song song với nhóm theo
Tầng cũ · **in A4 ngang** (`@media print` cô lập bảng, `@page{size:A4 landscape}`, đủ "in văn
phòng" — preset "gửi nhà in" +bleed/crop-marks CHƯA làm, B9 đầy đủ theo phiếu để sau). Tiện sửa
1 bug thật: `BoqErrorRows` colSpan hardcode=9 trong khi bảng lúc đó 8 cột (nay 10, export hằng
`BOQ_TABLE_COLUMN_COUNT` để không lệch lại) · phát hiện thêm `boq-group.ts` dùng alias `@/...`
nên `.test.ts` của nó **chưa từng chạy được** qua `sucrase-node`/`npm test` dù commit trước ghi
"27/27 pass" — đổi sang import tương đối theo đúng quy ước `boq-overrides.ts`.
Verify: `tsc --noEmit -p .` sạch · `boq-group.test.ts` 25/25 (thêm 15 ca phòng) · `boq-spec-
extra.test.ts` 13/13 (mới) · 4 file test `lib/boq/*` cũ vẫn xanh · browser thật (127.0.0.1:3001,
demo@if.local, "Dự án mẫu" → 2D Kỹ thuật → Trình bày → Bảng khối lượng BOQ): 10 cột hiện đúng thứ
tự, toggle Tầng↔Phòng không vỡ, không lỗi console liên quan BOQ. "Dự án mẫu" hiện **0 entities**
(sheet rỗng) nên chưa xem được số liệu thật/badge suy đoán trên UI — chỉ xác nhận cấu trúc không
vỡ, KHÔNG bơm dữ liệu test vào dự án mẫu (tránh lặp sự cố cũ). 1 lỗi console KHÔNG liên quan đã
thấy sẵn (`EditorCanvas.tsx` "Maximum update depth exceeded", chặng Trình bày mode Deck) — CHƯA
sửa, đúng §0d "không đụng Deck editor đang chạy", không phải do việc này gây ra.
🔴 **Hai phiên chung `.git` tái diễn LẦN NỮA** (giữa lúc code): làm việc xong phát hiện `git log`
đã có 2 commit MỚI của phiên khác (`39c55a5 wip`, `a40adf2 docs: khoa duong ve dich...`) **cuốn
theo toàn bộ file BOQ của tôi** (kể cả 1 bản sửa `boq-group.ts` họ tự làm thêm — đã đọc diff, TRÙNG
KHỚP với sửa alias tôi vừa làm, không xung đột) — **đã push lên `origin/main`** trước khi tôi kịp
biết. Không phải tôi chạy git, không mất nội dung (đã grep xác nhận file trên đĩa đúng), chỉ lệch
tên commit — không rewrite lịch sử. Không có gì để tôi tự commit thêm (đã nằm trong 2 commit trên).

## ✅ XONG (04/08 — sửa hero ProjectSelect chìm vào wallpaper tối)
`components/ProjectSelect.tsx` — hero (pill chào/tiêu đề/mô tả/2 nút "Chi tiết"·"Đồng bộ tiến độ"/
Vitals AI) trước đè `--t1`/`--t4` (token theo THEME) lên ảnh nền "ambient" (cover dự án đang
focus, carousel-only) → theme sáng làm `--t1` gần đen chìm mất chữ trên wallpaper tối. Fix: thêm
`heroPlan = useAdaptiveContrast(...)` (đo đúng vùng hero, `overlay` gộp đúng 2 lớp CSS ambient đã
đắp — brightness(0.5) + rgba(8,7,5,0.55) ⇒ alpha gộp 0.775), áp `adaptiveTextStyle(heroPlan)` cho
mọi chữ hero — CHỈ khi `showAmbient` (carousel), grid/mobile/reduce giữ nguyên token cũ (không có
wallpaper thì không cần thích ứng). Verify: `npx tsc --noEmit -p .` sạch, `npx tsx lib/adaptive-
contrast.test.ts` 28/28 pass. Browser thật (127.0.0.1:3000, demo@if.local): tái hiện bug trước
(ép `--t1` → chữ biến mất trên wallpaper tối, N3), rồi xác nhận fix (cream + shadow, đọc được) ở
CẢ 2 theme (light/dark, qua `window.__flowStore.setThemePref`) trên cùng ảnh thật `render_10.jpeg`.
Không đủ đa dạng ảnh thật trong dữ liệu demo (carousel bị kẹt `active` không tiến — nghi do poll
flows định kỳ reset index, KHÔNG liên quan fix này) nên bổ sung bằng toán đúng thuật toán production
(`readImageRegion` sampling) trên cả 5 cover thật có sẵn (`render_00/03/04/05/10`, luminance thô
0.209–0.449, độ rối 0.019–0.273) — composited luminance luôn ≤0.101 (trần lý thuyết 0.225 < ngưỡng
0.42) nên tone LUÔN là kem, đúng thiết kế lớp phủ tối cố định của ambient. Không tạo flow/dữ liệu
lạ trong `dev.db` (đã kiểm `createdAt` sau khi verify).

## ✅ XONG (04/08 — BA VIỆC UI: đường về Gallery · phím tắt tập trung · Lockscreen, `docs/SO-KIEM-TONG.md` §8)
- **VIỆC 1**: `HomeButton.tsx` (có sẵn, trước mồ côi) mount vào `AppChrome.tsx` cạnh logo + mục
  "Về Thư viện dự án" trong `AppLogoMenu.tsx` — cả 2 qua `goHomeConfirmed()` (`lib/resume.ts`),
  hỏi trước nếu còn thay đổi chưa lưu (`LeaveConfirmBar.tsx`, portal, không `window.confirm`).
- **VIỆC 2**: đăng ký phím tắt TOÀN CỤC mới (⌘0/⌘B/⌘L/⌃⌘Q) tập trung trong đúng effect có sẵn ở
  `AppChrome.tsx`. Đổi ⌘0→⌘9 (zoom fit CAD/Present/Photo) nhường ⌘0 cho "về Gallery". Bảng ⌘? nay
  liệt kê phím "chưa nối" MỜ + lý do thay vì giấu (`lib/shortcuts.ts` field `disabled/
  disabledReason`) — vd ⌘N đánh dấu chưa nối vì trình duyệt giữ cứng, kiểm kỹ không giả vờ chạy.
- **VIỆC 3**: Lockscreen kiểu macOS — `lib/lockscreen.ts` + `components/studio/LockScreen.tsx`
  (blur, đồng hồ sống, nhúng `LoginForm` có sẵn — mở khoá = đăng nhập lại, không tự chế mật
  khẩu/PIN) + `AppChrome.tsx` (⌃⌘Q, hẹn giờ tự khoá mặc định 15 phút, chặn phím khác khi đã khoá)
  + `components/settings/LockScreenSettings.tsx` (chỉnh số phút, nút "Khoá ngay"). Ép force-save
  TRƯỚC khi khoá (tái dùng `cad:force-save-request`/`present:force-save-request` có sẵn) — verify
  bằng RELOAD TOÀN TRANG sau khoá (khắt khe hơn unlock đơn thuần), dữ liệu còn nguyên.
- Bắt + sửa 2 lỗi ngay trong phiên trước khi báo xong: (1) lockscreen mồ côi trong header có
  `backdrop-filter` (containing block mới cho `position:fixed`) → portal ra `document.body`,
  đúng luật K4 đã có. (2) bộ chặn phím khi khoá thiếu guard `instanceof Element` cho
  `e.target` — vỡ khi test bằng `window.dispatchEvent` (target lúc đó là `window`, không có
  `.closest`); sửa xong còn phát hiện thêm cách test đó tự nó sai thứ tự capture/bubble, phải
  dispatch trên `document.body` mới đúng ngữ nghĩa phím thật.
- `npx tsc --noEmit -p .` sạch, `npm test` chỉ 1 fail cũ đã biết (không liên quan), không đụng
  `lib/cad/model.ts`.
- 🔴 **Hai phiên chung `.git` tái diễn**: code 3 việc này bị cuốn rải rác vào commit của phiên
  khác (`b7b5484`/`f77ce9d`/`9710611`/`c69c491`) — CHỈ VIỆC 2 (`e2f55d6`) là commit sạch của đúng
  phiên này. Đã đọc lại file thật để xác nhận nội dung ĐÚNG, không mất dữ liệu — chỉ lệch tên
  commit. Không rewrite lịch sử.

## 🟡 ĐANG CHẠY (04/08 — KHO VẬT LIỆU IF v1, VIỆC 1 xong — DỪNG theo lệnh, chờ Hoà trước VIỆC 2)
`docs/PHIEU-CODE-IF-KHO-VAT-LIEU-V1.md` VIỆC 1: thêm 4 cột `scope`/`ownerId`/`supplierId`/`verified`
vào `model ProductSpec` (`prisma/schema.prisma`) — khai chỗ cho kho 3 tầng, CHƯA code chức năng
`global`. `npx prisma validate` sạch. **CHƯA chạy migrate/db push/generate** — theo luật "KHÔNG
prisma db push/migrate qua sandbox" (mục Quy tắc session #4): lệnh soạn sẵn cho Hoà chạy máy thật
(xem cuối báo cáo phiên). Không đụng `components/cad/CadSheets.tsx`.

## ✅ XONG (04/08 đêm — ĐỢT 8 multi-sheet D2: GỠ TRẦN MAX_SHEETS, `b46fa30`, sổ §12; D3 HOÃN)
Hoà duyệt D2 + hoãn D3 (đổi định dạng file người dùng — chờ studio thật dùng thử mới làm).
D2: `SheetTabBar.tsx` prop `max` thành optional (không truyền = không trần) · `CadSheets.tsx`
3 chỗ · `PresentSheets.tsx` 9 chỗ (bỏ 4 `slice(0,5)` nạp/autosave/đĩa/import + thông báo vượt
trần + status) — đọc kỹ từng chỗ, không áp máy móc (Present mỗi sheet vẫn ôm deck, khác CAD).
Nghiệm thu browser thật (127.0.0.1:3002, dự án test riêng): CAD 13 tờ + Present 12 hồ sơ không
chặn/không chậm · `.idf` cũ 5 sheet mở đủ 5/5 entity (gộp 1 Doc đúng D1, thông báo rõ) · tsc
sạch · 22/22 + 13/13 test cũ pass · lỗi console duy nhất là bug CŨ `EditorCanvas.tsx` đã ghi sổ.
Rác cần Hoà dọn tay: 1 Flow test `cmser4yxk0001w97ydu3oy6je` trong `dev.db` (lệnh DELETE soạn ở
sổ §12). Nghi vấn NGOÀI phạm vi: click chuyển chặng Present→2D không điều hướng (phải hard-nav),
chưa rõ bug thật hay sandbox — ghi §12, chưa sửa.

## 🟡 D1 ĐỢT 8 (bối cảnh — đã xong từ trước, giữ ghi chú gốc)
`components/cad/CadSheets.tsx` + `components/cad/CadCanvas.tsx` — bỏ hẳn "hoán store" khi đổi tab
(mỗi sheet ôm 1 Doc riêng, K1 vi phạm) → `useCadStore` giờ giữ ĐÚNG 1 `doc`/`past`/`future` xuyên
suốt phiên; `sheets` chỉ còn metadata `Sheet`/`Viewport2D` (model.ts, Bước 1+2 cũ). Đổi tab = bay
camera tới `centerMm` viewport (sự kiện `cad:goto-box` mới, không đụng Doc). Verify browser thật
(dự án test tạo riêng, không đụng "Dự án mẫu"): vẽ tường ở tab 1 → sang tab 2 thấy ngay (tiêm qua
`window.__cadStore.addEntities()`, KHÔNG `setState({doc})` ghi đè) · Undo ở tab 1 xoá đúng thao tác
cuối dù thao tác đó làm lúc đang ở tab 2 → 1 dòng lịch sử chung, đúng AutoCAD.
**Quyết định tự chọn (chưa hỏi lại, xem lý do đủ trong code comment đầu `CadSheets.tsx`):** ĐỊNH
DẠNG LƯU (.idf/IndexedDB/.ifpack/backup) CHƯA đổi cấu trúc ở D1 — lý do: `lib/cad/cad3d-autosave-
core.ts` (autosave riêng mode 3D, vừa xong `d57067a`) đọc/ghi CHUNG bucket IndexedDB và có logic
"chỉ cập nhật đúng 1 sheet đang hoạt động, giữ nguyên sheet khác" — nếu D1 ghi N sheet cùng trỏ 1
Doc, logic đó dễ làm chúng lệch nhau rồi hồi sinh bản cũ khi gộp lại (rủi ro nhân đôi hình học).
An toàn hơn: LUÔN lưu/xuất ĐÚNG 1 sheet (tab đang mở, mang trọn Doc chung); nhiều tab UI trong 1
phiên CHƯA persist qua reload (session-only, việc D3). Mở `.idf`/cache CŨ có N sheet khác Doc (từ
trước luật này) → tự gộp về 1 Doc bằng `mergeIdfSheetsToDoc()` đã có + đã test, không rơi rớt entity.
`npx tsc --noEmit -p .` sạch · `sheet-migrate.test.ts` 22/22 · `cad3d-autosave-core.test.ts` 13/13
(test này verify ĐÚNG cái invariant D1 không được phá — pass nghĩa là mode 3D không bị ảnh hưởng).
**CHƯA LÀM**: D2 (gỡ trần `MAX_SHEETS=5` cả CadSheets + PresentSheets) · D3 (bump `IDF_VERSION` +
tách N sheet thật theo công thức offset Q1 khi mở file cũ, thay vì gộp về 1 như D1 đang làm tạm).

## ✅ XONG (04/08 — cửa/cửa sổ HOSTED, `d57067a`, chi tiết đủ trong message commit + `SO-KIEM-TONG.md` §7b)
- Nối dây `docs/SO-KIEM-TONG.md` §7 dòng "Cửa/cửa sổ HOSTED" (2D ⬜→✅, 3D 🟡→✅ khối cơ bản): `Block
  Entity.hostId` suy tự động qua `lib/cad/hosting.ts` `syncHostedOpenings()` (chạy sau mọi mutation
  doc) · xoá tường kéo theo xoá cửa/cửa sổ con (`expandDeleteWithHostedChildren`) · cửa sổ hết là
  khối kính chồng — sinh `BuildOp boolean subtract` thật vào `ops[]` tường chủ, kính chỉ còn tấm lắp
  lỗ · cửa có khung+cánh 3D (xám, không PBR). Đi qua đúng `ops[]`/`buildOpCutters` sẵn có (NC-12),
  không đường dựng thứ hai. 35 test mới, tsc -p . toàn repo sạch (tiện sửa 1 lỗi tsc có trước ở
  `Viewport3D.tsx`, không liên quan). Nghiệm thu browser thật: lỗ thật xuyên tường + cánh cửa nhô ra
  (ảnh chụp) · xoá tường → cửa/cửa sổ biến mất theo (state + màn hình).
- 🔴 **Sự cố rút kinh nghiệm** (không phải mất dữ liệu thật, xem §7b để đọc đủ): lúc tiêm doc test
  để verify, dùng `setState({doc:...})` GHI ĐÈ nguyên `doc` thay vì cộng thêm — xoá mất nội dung
  thật của "Dự án mẫu" trong cache IndexedDB **của trình duyệt sandbox** (đã xác nhận không đụng đĩa
  thật/`dev.db` — trình duyệt sandbox không nối file-handle nào, CAD sheet cũng không gọi API
  server). Luật rút ra: verify bằng tiêm store → luôn `addEntities()`, KHÔNG BAO GIỜ `setState({doc})`
  ghi đè trên route có autosave mount.

## ✅ XONG (03/08 đêm khuya muộn — NC-13 multi-sheet BƯỚC 1+2, DỪNG chờ Hoà duyệt trước bước 3)
- **BƯỚC 1**: khai kiểu đích `Sheet`/`Viewport2D`/`SheetTitleBlock` vào `lib/cad/model.ts` (cuối
  file, sau `fitScaleLabel`) — CHỈ KHAI KIỂU, chưa nơi nào dùng, `CadSheets.tsx` không đụng.
- **BƯỚC 2**: `lib/cad/sheet-migrate.ts` — bộ chuyển 1 chiều `mergeIdfSheetsToDoc()`: N sheet cũ
  (mỗi sheet 1 `Doc` riêng) → 1 `Doc` gộp (dịch offset xếp hàng ngang theo bbox thật, không chồng)
  + 1 `Sheet`/1 `Viewport2D` tỉ lệ 1:100 mặc định. Đổi tên id entity/markup/photo có tiền tố theo
  sheet (an toàn kể cả 2 sheet trùng id gốc), `ops[].withRef` (NC-12 boolean) ánh xạ lại đúng
  trong cùng sheet, layer dedupe theo id. `lib/cad/sheet-migrate.test.ts` — 22/22 test pass (không
  rơi rớt entity · không chồng nhau · id/ops remap đúng · layer dedupe · Sheet/Viewport2D sinh
  đúng hình dạng · sheet rỗng không crash · **`.idf` cũ đọc được nguyên vẹn qua `importIdf()` rồi
  mới đưa qua bộ chuyển, không sửa `idf.ts`**). `tsc --noEmit` toàn repo sạch.
- **DỪNG THEO YÊU CẦU** — KHÔNG làm bước 3 (đổi `SheetTabBar` đọc `Sheet[]`), bước 4 (gỡ
  `MAX_SHEETS`), bước 5 (bump `IDF_VERSION`). Lý do: bước 3 đổi kiến trúc UI lớn, cần Hoà nghiệm
  thu thiết kế trước khi động.

## ✅ XONG (03/08 đêm khuya — PHIẾU ĐỢT 7 chặng 3D: ViewCube thật + 3 lỗi UI + đối chiếu Revit)
- **Nhóm A** (`ccf9d46`): bảng "TRÌNH TỰ" kéo-thả tự do + thu gọn 1 dòng (khác nút ✕ = ẩn hẳn) ·
  chip Vitals StatusBar thêm viền/nền accent + chấm sống pulse 2s · thanh cuộn tối đúng cả 2 theme.
- **Nhóm B** (`68c6950`): **ViewCube 3D THẬT** thay SVG tĩnh cũ — `components/three/ViewCube3D.tsx`
  (renderer riêng 96×96, khối 26 vùng kiểu Rubik's cube, camera cube copy quaternion camera chính
  mỗi khung → xoay đồng bộ khi orbit) · bấm 1 vùng = bay camera tới bằng slerp ~350ms · kéo trên
  cube = orbit camera chính (giống SketchUp) · nhãn TRÊN/DƯỚI/TRƯỚC/SAU/TRÁI/PHẢI. `Scene3DViewer`
  xuất `Scene3DCameraApi` qua `cameraApiRef` làm cầu nối. Verify browser thật: orbit chuột → cube
  xoay theo · kéo cube → camera orbit · bấm mặt cube → bay tới top-down mượt, không lỗi console.
  **Không quay được gif** (không có công cụ ghi màn hình khả dụng ở surface trình duyệt chính;
  claude-in-chrome không nhận input trong sandbox phiên này dù đã thử nhiều cách) — bằng chứng thay
  thế là chuỗi screenshot trong transcript phiên.
- **Nhóm C** (`f796fef`): VIỆC C1 — bảng đối chiếu 6 cơ chế Revit (location line·cửa hosted·
  type/instance·tham số cấu kiện·level/tầng·constraint cao độ) × 2D/3D vào `docs/SO-KIEM-TONG.md`
  §7 — **cả 6 đều CHƯA ĐẦY ĐỦ ở cả 2 chặng**, điểm sáng duy nhất là `ops[]` boolean (NC-12) làm nền
  cho cửa hosted sau này. VIỆC C2 — nhóm nút "Cấu kiện" (đúng tầng ⑥ `SPEC-DUNG-BO-LENH-3D.md`)
  trong `Command3DPanel.tsx`: Tường (đã dựng, bấm được) + 9 mục còn lại (Cửa·Cửa sổ·Cầu thang
  thẳng/gấp/xoắn·Lan can·Phào chỉ·Trần thả·Tủ bếp module) mờ + tooltip đúng lý do, không ẩn/bỏ sót.
- `npx tsc --noEmit -p .` toàn repo SẠCH sau cả 3 nhóm, chạy NỀN (`run_in_background`) — KHÔNG bị
  timeout lần nào trong phiên này (3 lần chạy, mỗi lần vài chục giây). Sửa lại ghi chú cũ bên dưới
  (mục "🔴 PHIÊN SAU PHẢI BIẾT") — có thể do phiên trước chạy foreground bị cap 40-45s của Bash tool
  chứ không phải bản thân lệnh treo.

## 🟡 PHÁT HIỆN QUAN TRỌNG — đọc trước khi verify browser bất kỳ tính năng dùng `aiTier`/`credits`
`useFlowStore.hydrate()` (đọc `aiTier`/`credits`/theme từ localStorage) **CHỈ được gọi từ
`components/home/HomeScreen.tsx`**. Vào THẲNG URL con (vd `/present-editor`, hard reload/navigate
mới) → store luôn về mặc định (`aiTier=2`), BỎ QUA mọi thứ đã lưu trong Settings. Cách verify
đúng: mở `/` (hoặc để app tự resume) trước, RỒI điều hướng bằng click UI thật (client-side route,
không hard-navigate) sang trang cần test. Ghi vào TECH-DEBT nếu có ca thật user report "đổi mức
AI ở Settings không ăn" — nghi đúng nguyên nhân này (route không qua Home).

## ⬜ CHƯA BẮT ĐẦU (hàng đợi đã biết)
- Menu "3D — sắp có (Phase 3–4)" đã có sẵn trong header canvas (`ref` thấy khi verify) — CHƯA nối
  vào Scene3DViewer (3D-2..5 giờ đã xong hết, không còn "chờ mode" nữa) — việc nối menu này là việc
  UI riêng, chưa ai làm, xem trước khi động vào.
- V1.1 so le nội thất theo cửa chính · V2.1 look-at khoá điểm/khoá zone + panel chỉnh tốc độ/lens.
- Liên kết sống CAD→deck (moat) — sau P1-P3.
- Toàn bộ mục dưới "Chờ USER quyết" (chưa đổi) vẫn còn nguyên.

## 🔴 PHIÊN SAU PHẢI BIẾT
- **`.git/index.lock` stale LẦN 5** phiên này — hai phiên (tôi + code phụ) giờ **CHUNG 1 .git**,
  Hoà đã báo trực tiếp. Luật mới: commit theo CỤM NGẮN, không giữ lock lâu giữa các bước; nếu file
  đang STAGED sẵn (không phải của mình) → **dùng `git commit -- <pathspec>` giới hạn đúng file
  mình**, TUYỆT ĐỐI không `git add -A`/commit trơn (sẽ cuỗm cả staged của phiên kia).
- **`findHatchBoundary`** (`cad-to-obj.ts`, code CŨ) treo >2 phút ở mật độ phòng cực cao — né được
  trong bench 3D-1, ghi `TECH-DEBT.md`, chưa phải bug chặn.
- File scratch bench 3D-1 đã xoá sạch, ảnh test P3-2 đã xoá khỏi dự án mẫu, mức AI đã trả về
  "oneAI" (mặc định gốc) trước khi rời — dự án mẫu sạch, không còn dấu vết verify.
- 🟢 **ĐÍNH CHÍNH (03/08 đêm khuya, PHIẾU ĐỢT 7):** ghi chú cũ "`tsc --noEmit -p .` không chạy xong
  trong sandbox" — chạy **NỀN** (`Bash run_in_background:true`) thì XONG BÌNH THƯỜNG, không timeout
  (thử 3 lần, mỗi lần vài chục giây). Nghi vấn cũ chỉ đúng khi chạy FOREGROUND (Bash tool cap mặc
  định 40-45s không đủ cho lần compile đầu nguội cache). Tsc scoped (`tsconfig.scoped.json`) vẫn
  dùng tốt cho vòng lặp sửa nhanh, nhưng KHÔNG còn đúng là "buộc phải dùng vì -p . không chạy được".
- **2 file scratch KẸT lại, sandbox không xoá được** (FUSE, cùng loại cũ) — đã dọn rỗng nội dung,
  Hoà `rm` tay: `tsconfig.scoped.json` (tsc scoped tạm, xem trên) · `app/dev-bench-3d-2/page.tsx`
  (bench đo `captureSequence`, xem mục 3D-2 phía trên — CHỈ xoá SAU KHI đã chạy lấy số thật, đừng
  xoá trước).

## Worktree đang mở
- **`interiorflow-g4`** (nhánh `nhanh-g4`) — ĐÃ merge vào `main` (`12223cf`), nhưng KHÔNG xoá worktree:
  `git status` worktree này còn dirty (`​.claude/launch.json` sửa tay, chưa commit — thêm entry dev
  server `interiorflow-g4` port 3004) VÀ có dev server đang chạy thật ở port 3004. Thiếu 2/4 điều
  kiện an toàn (`CLAUDE.md` mục "Dọn cuối phiên") → giữ nguyên, chủ dự án quyết khi tiện.

## Nợ kỹ thuật
→ `docs/TECH-DEBT.md`.

## Chờ USER quyết
- **4.1.f thi công** (đổi hình dạng `brand-kit.json`) · **`knowledge/ttt-design-system/`** vi phạm
  LUẬT TRUNG TÍNH · **④ `FlowVersion`** không phải thủ phạm `dev.db` phình · **NT1/NT5**/**T3/T4**
  dời sau · **Figma** MCP lỗi, đường vòng đã có · **DWG** hướng GPL chưa chốt + `2.1.6.d` gốc đã
  vá (timeout/tiến độ/lỗi rõ) + "Huỷ = bỏ rơi worker" ĐÃ SỬA theo hướng Hoà chốt, nhưng 🔴 nghiệm
  thu "<1s" chưa đo được + phát hiện `terminate()`/đóng tab đều KHÔNG cắt được vòng WASM nặng —
  xem `SO-KIEM-TONG.md` §11d, chờ Hoà chọn 1 trong 3 hướng tiếp · Treo: VIỆC 4 cũ, #14, Xlsx probe · 3 nhánh
  `worktree-agent-*` merged còn local · Sprint BOQ ĐỢT 3 greenlight sau ĐỢT DEMO ·
  `2.2.16-2.2.21`/12 file SPEC-TỔNG §9/`2.2.83` chưa quyết. Chi tiết → CHANGELOG/`IF-FEATURE-TREE.md`.

## Quy tắc session
*(worktree/LUẬT NỀN TẢNG → `CLAUDE.md`. Chi tiết đầy đủ → memory: `feedback-docs-never-overwrite`,
`feedback-verify-before-trust`, `project-ben-doc-bundle-workflow`.)*
1. Không tự merge/push **main** nếu chưa hỏi.
2. **LUẬT MÁU verify browser**: qua `127.0.0.1:<port>` (KHÔNG `localhost`); KHÔNG logout/xoá cookie.
3. Login demo: `demo@if.local` / `demo1234`.
4. **KHÔNG `prisma db push`/`migrate` qua sandbox** (FUSE chặn khoá file SQLite) — soạn lệnh sẵn
   cho Hoà chạy máy thật. Backup: `sqlite3 dev.db ".backup 'ten'"`, không `cp`. Chi tiết →
   `docs/00-CHOT.md` mục "LUẬT VẬN HÀNH".
5. **Hai phiên chung `.git`** (mới 02/08) — commit cụm ngắn, `git commit -- <pathspec>` khi có
   file staged của phiên khác, không giữ lock lâu.
