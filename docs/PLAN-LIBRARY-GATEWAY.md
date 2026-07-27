# PLAN — Hợp nhất Library ↔ Gateway ↔ File Manager

> **[CẦN HOÀ DUYỆT]** · Chỉ VIẾT KẾ HOẠCH — KHÔNG code gì ở tài liệu này (VIỆC 8, 28/07).
> 5 nguyên tắc (NT1–NT5) do Hoà chốt sẵn trong `PROMPT-2807-RUN.txt`, chép nguyên văn ở mục
> tương ứng bên dưới trước khi phân tích. Đối chiếu với CODE THẬT hiện có (không phải docs cũ).

---

## 0. Đọc TRƯỚC — chỗ bất khả thi / xung đột với code thật (không tự chọn giùm)

| # | Xung đột | Vì sao |
|---|---|---|
| 1 | **NT1 "bỏ hẳn popover `[+]`"** ngược với việc VỪA LÀM sáng nay | Sáng 28/07 (VIỆC 2→6 phiên này, commit `848eaf2` trở về trước) tôi vừa THÊM popover `[+]` vào `components/LibraryPanel.tsx` theo đúng yêu cầu lúc đó ("thấy ảnh trước, lọc sau" — ẩn Upload/"Nạp vào thư viện"/tag/usage sau `[+]`). NT1 giờ nói bỏ hẳn popover, gộp `/library/ingest` thành 1 CHẾ ĐỘ của panel. Đây là **đảo ngược kiến trúc vừa chốt, không phải xây tiếp** — cần Hoà xác nhận có thật sự muốn bỏ popover (đổi hướng) hay giữ popover, chỉ thêm 1 mục "Nạp hàng loạt" trỏ vào cùng luồng ingest.
| 2 | **NT2 "Gateway" chưa tồn tại** | `docs/IF-ARCHITECTURE-BLUEPRINT-v1.md` §5B đánh dấu Gateway "✅" nhưng grep code thật: `grep -rn "class Gateway|IFGateway"` → **0 kết quả**. Không có tầng nhận-diện-định-dạng-tự-động nào cả — mỗi chặng tự liệt kê cứng danh sách định dạng trong `IOMenu`. "Một cửa nuốt mọi đuôi" phải XÂY MỚI từ đầu, không phải bật 1 flag có sẵn.
| 3 | **NT3 Render "chuột phải → menu nạp nhanh"** chưa có móc nào | `components/FlowCanvas.tsx` **không có `onContextMenu` handler nào** (grep xác nhận). `components/cad/CadCanvas.tsx` có `onContextMenu={(e) => e.preventDefault()}` — tức đang **CHẶN THẲNG** chuột phải, chưa từng có menu ngữ cảnh nạp file. Cả 2 chặng phải làm mới, không có nền để "bật thêm".
| 4 | **NT4 Linked Asset — giới hạn trình duyệt thật** | `lib/present-editor/linked-assets.ts` (đã có, dùng trong VIỆC 2 phiên này) chỉ link nhiều INSTANCE ảnh trong deck với nhau qua `assetId` nội bộ (đổi 1 nơi, mọi instance cùng `assetId` đổi theo) — **không có path đĩa thật, không theo dõi file ngoài app**. Theo dõi file THẬT trên máy (như InDesign) cần File System Access API (`showOpenFilePicker`/`FileSystemFileHandle`) — **chỉ Chrome/Edge hỗ trợ, Safari/Firefox KHÔNG** (kiểm tra thật trước khi cam kết tính năng này cho mọi trình duyệt).
| 5 | **NT5 — chưa có gì để "phân quyền" trên** | `docs/SPEC-FILE-MANAGER.md` (chính tài liệu Hoà vừa duyệt §7 hôm nay) tự ghi rõ: cây thư mục thật (`~/InteriorFlow/Projects/…`) là Pha 1, CHƯA LÀM (`⬜`). Hôm nay app lưu qua Prisma (`Project`/`Flow`/`LibraryAsset` rows) + IndexedDB + thư mục `/uploads` phẳng — **không có khái niệm `Knowledge/`/`_System/`/`01-input/` nào tồn tại trên đĩa thật**. Phân quyền đọc/ghi/khoá ở NT5 vô nghĩa cho tới khi Pha 1 (cây thư mục) xong.

---

## 1. NT1 — THƯ VIỆN LÀ MỘT NƠI DUY NHẤT

> *Một panel · một giao diện · một cách dùng; chỉ khác NỘI DUNG ƯU TIÊN theo chặng... `/library/
> ingest` KHÔNG còn là trang riêng, thành MỘT CHẾ ĐỘ của panel... BỎ HẲN popover `[+]` 2 lựa
> chọn. Lý do: 90% người dùng không phân biệt được "tải thư viện" với "nạp vài ảnh".*

**Thực trạng code — 3 implementation RIÊNG, không phải 1:**

| Chặng | File | Dòng | Đặc điểm riêng |
|---|---|---|---|
| Render | `components/LibraryPanel.tsx` | 317 | 5 category, search, popover `[+]` (Upload/Nạp vào thư viện/tag/usage) |
| Present | `components/present-editor/LibraryBrowser.tsx` | 354 | Gom theo dự án/tag, `StockPhotoPicker` (Unsplash/Openverse), upload LOCAL riêng (không qua `/api/library`) |
| CAD | `lib/cad/block-library.ts` + `components/cad-library/BlockLibraryDemo.tsx` | 218+? | Block/furniture, KHÔNG liên quan ảnh — dữ liệu hoàn toàn khác 2 cái trên |

**(a) File cần đổi/tạo:**
- TẠO `components/library/LibraryPanel.tsx` (panel dùng chung mới, thay thế cả 3 file trên) —
  nhận prop `stage: 'cad' | 'render' | 'present'` để quyết định thứ tự ưu tiên category + có
  hiện block/furniture hay không.
- TẠO `components/library/BulkIngestMode.tsx` — logic từ `app/library/ingest/page.tsx` (đọc
  file/PDF/Excel/CAD, chưng cất manifest, AI Content Strategist) chuyển thành 1 MODE trong
  panel thay vì route riêng.
- SỬA `app/library/ingest/page.tsx` → redirect sang panel ở chế độ bulk (giữ URL cũ cho ai có
  bookmark, hoặc xoá hẳn nếu Hoà đồng ý phá link cũ).
- SỬA `components/present-editor/PresentEditor.tsx` (bỏ `LibraryBrowser` cũ, dùng panel mới).
- SỬA `components/cad/CadEditor.tsx` / `CadCanvas.tsx` (thêm entry point panel mới cho CAD —
  hiện CAD dùng `BlockLibraryDemo` tách biệt, cần hoà vào).
- XOÁ (sau khi migrate xong) `components/present-editor/LibraryBrowser.tsx`,
  `components/cad-library/BlockLibraryDemo.tsx` cũ.

**(b) Rẻ làm trước:** Giữ nguyên `/api/library` (đã hoạt động, không đổi backend) — chỉ hợp nhất
tầng UI. Có thể làm TRƯỚC bằng cách gộp `LibraryPanel.tsx` + `LibraryBrowser.tsx` (cùng là ảnh,
khác chỉ ở gom-nhóm/nguồn ảnh ngoài) — 2 cái này gần nhau nhất, rẻ nhất trong 3.

**(c) Phải đợi:** Gộp block/furniture (CAD) vào CÙNG 1 panel với ảnh (Render/Present) đòi
`LibraryAsset` phải biểu diễn được CẢ HAI loại nội dung (ảnh + block 3D/2D) — cần xem lại schema
`LibraryAsset` (hiện chỉ có `mime`/`path`/`palette` hướng ẢNH, không có field cho block metadata)
HOẶC chấp nhận panel có 2 "ngăn" con bên trong (ảnh dùng `LibraryAsset`, block dùng
`block-library.ts` JSON tĩnh) — cần Hoà quyết trước khi code.

**(d) Mâu thuẫn code thật:** Xem mục 0.1 — bỏ popover `[+]` đảo ngược việc vừa chốt sáng nay.

**(e) Ước lượng:** LỚN (gộp 3 UI khác kiến trúc + quyết định lại data model cho block).

---

## 2. NT2 — MỘT CỬA NUỐT MỌI ĐUÔI (Gateway)

> *"Mở tệp" là cửa duy nhất, nhận mọi định dạng, tự nhận diện và đưa đúng chỗ (IF Gateway).*

**(a) File cần tạo:**
- TẠO `lib/gateway/detect.ts` — nhận diện định dạng từ đuôi file + magic byte (đầu file),
  KHÔNG chỉ dựa vào đuôi (user đổi tên `.jpg`→`.png` vẫn phải nhận đúng).
- TẠO `lib/gateway/route.ts` — bảng ánh xạ định dạng → đích: `.idf`→CAD project ·
  `.dxf/.dwg`→CAD import · ảnh→tuỳ chặng (Render node / Present slide / CAD photo) ·
  `.pptx/.pdf`→Present · `.xlsx/.csv`→bulk ingest (NT1) · `.ifpack`→phục hồi dự án (đã có,
  VIỆC 5 hôm nay — `lib/cad/ifpack.ts`).
- SỬA `components/ui/IOMenu.tsx` — nhánh "import": thay danh sách định dạng cứng bằng 1 nút
  "Mở tệp" duy nhất gọi `lib/gateway/detect.ts` rồi route tự động; GIỮ property `items` cũ cho
  chặng nào chưa migrate (tương thích ngược khi làm dần).

**(b) Rẻ làm trước:** Bảng ánh xạ định dạng→đích (thuần dữ liệu, không UI) — làm được ngay,
không phụ thuộc gì. Test độc lập dễ (input đuôi/magic byte → output đích, giống style
`lib/cad/idf.test.ts`).

**(c) Phải đợi:** Tích hợp thật vào từng chặng phải đợi NT1 xong trước (Gateway cần biết "library
panel mới" tồn tại để route ảnh reference vào đúng đó thay vì route thẳng vào canvas).

**(d) Mâu thuẫn code thật:** Không có — đây là phần THUẦN MỚI, không đè lên cái gì đang chạy.

**(e) Ước lượng:** VỪA (nhận diện định dạng: nhỏ; tích hợp route vào 3 chặng: vừa).

---

## 3. NT3 — HÀNH VI NẠP THEO CHẶNG

> *CAD + Present: nút trên bar trên · Render: CHUỘT PHẢI trên canvas (di động: CHẠM GIỮ) → menu
> nạp nhanh tại chỗ con trỏ · Present: chuột phải trên ảnh → "Thay ảnh" (khớp VIỆC 2).*

**Thực trạng:** Present's "chuột phải → Thay ảnh" **ĐÃ XONG** (VIỆC 2, hôm nay — `EditorCanvas.tsx`
+ `ReplaceImageDialog.tsx`, dùng `components/ui/Popover.tsx`). CAD + Render's nút trên bar
**ĐÃ CÓ** (`IOMenu` nút "Mở tệp"/"Thêm vào canvas"). Phần **CHƯA CÓ** duy nhất: Render's
chuột-phải-trên-canvas → menu nạp nhanh (mục 0.3 đã xác nhận `FlowCanvas.tsx` không có
`onContextMenu` nào).

**(a) File cần đổi:**
- SỬA `components/FlowCanvas.tsx` — thêm `onContextMenu` trên nền canvas (không phải trên node),
  mở `Popover` (component có sẵn từ VIỆC 2!) chứa menu nhanh: "Thêm ảnh từ máy" / "Từ thư viện" /
  dán URL — TÁI DÙNG `components/ui/Popover.tsx` + logic 2-lựa-chọn của
  `components/present-editor/ReplaceImageDialog.tsx` thay vì viết lại từ đầu.
- SỬA `components/cad/CadCanvas.tsx` dòng ~2873 — đổi `onContextMenu={(e) => e.preventDefault()}`
  thành mở menu tương tự (nếu Hoà muốn CAD cũng có hành vi này — NT3 chỉ nói rõ Render, CAD có
  thể giữ nút bar như hiện tại; cần xác nhận có áp cho CAD không).
- Di động (chạm giữ = long-press): cần thêm listener `pointerdown` + timer ~500ms riêng (browser
  không có "contextmenu" event tự nhiên từ chạm giữ trên mọi thiết bị) — việc RIÊNG, không tự
  động có kèm theo khi làm chuột phải.

**(b) Rẻ làm trước:** Vì `Popover.tsx` + mẫu 2-lựa-chọn ĐÃ CÓ SẴN (VIỆC 2), phần Render này là
**rẻ nhất trong cả 5 nguyên tắc** — chỉ còn nối dây, không phải xây component mới.

**(c) Phải đợi:** Không — làm được ngay, độc lập với NT1/NT2/NT4/NT5.

**(d) Mâu thuẫn code thật:** Không.

**(e) Ước lượng:** NHỎ (desktop chuột phải) + NHỎ-VỪA (di động chạm giữ, việc riêng).

---

## 4. NT4 — LINKED ASSET

> *Ảnh trong deck GIỮ ĐƯỜNG DẪN tới file trên máy (kiểu InDesign): render lại ảnh đó → deck TỰ
> CẬP NHẬT. Cần: trường path trong asset · theo dõi file đổi · nút "Cập nhật liên kết" khi file
> mất/đổi.*

**Thực trạng:** `lib/present-editor/linked-assets.ts` đã có 1 NỬA khái niệm — link nhiều
INSTANCE ảnh trong CÙNG 1 app-session với nhau qua `assetId`, KHÔNG có path đĩa thật (xem mục 0.4).

**(a) File cần đổi/tạo — ĐÃ SỬA LẠI 28/07 theo quyết định Q3 (không kén trình duyệt cho pha NAY):**
- SỬA `lib/present-editor/model.ts` `ImageElement` — thêm field `diskPath?: string` (path thật,
  optional — ảnh cũ/paste không có path vẫn hoạt động như hiện tại) + `diskPathMissing?: boolean`
  (đánh dấu lần cập nhật gần nhất user chọn nhầm file khác/không tìm thấy).
  ~~File System Access API (`showOpenFilePicker`/`FileSystemFileHandle`)~~ — BỎ, chỉ Chrome/Edge
  hỗ trợ, vi phạm quyết định Q3 ("bản web là kênh cho khách xem deck, không được kén"). THAY BẰNG
  `&lt;input type="file"&gt;` thường (chạy MỌI trình duyệt) — user bấm "Cập nhật liên kết" → chọn
  lại file THẬT trên máy → đọc `File.name` lưu vào `diskPath` (chỉ để hiển thị/đối chiếu tên, không
  phải path hệ điều hành thật — trình duyệt không cho JS đọc full path vì lý do bảo mật, giới hạn
  chung của MỌI web app, không riêng cách làm này) → data URL mới thay `src`.
- SỬA `components/present-editor/Inspector.tsx` — thêm nút "Cập nhật liên kết" khi element có
  `diskPath`, mở file input ẩn, luôn bật (không disable theo trình duyệt vì không còn phụ thuộc
  File System Access API).

**(b) Rẻ làm trước:** Field `diskPath` + nút "Cập nhật liên kết" thủ công (user tự bấm, không tự
động watch) — làm được mà không cần giải quyết bài toán "watch file nền" khó.

**(c) Phải đợi:** Watch NỀN tự động (không cần user bấm) — đợi quyết định có chấp nhận
"chỉ Chrome/Edge" hay không, hoặc chờ 1 giải pháp khác (vd Electron wrapper có fs.watch thật —
liên quan tới `dist-installer/` đã thấy trong repo, có vẻ app đã có bản đóng gói desktop?).

**(d) Mâu thuẫn code thật:** Không đè lên gì đang chạy — field mới optional.

**(e) Ước lượng:** VỪA (path + nút cập nhật thủ công) / LỚN (watch nền tự động, nếu làm).

---

## 5. NT5 — CỬA HÀNG ↔ CHỢ ĐẦU MỐI (File Manager)

> *(Nội dung y hệt `docs/SPEC-FILE-MANAGER.md` §7, đã duyệt hôm nay — không chép lại, xem mục 0.5
> về lý do NT5 chưa làm được: cây thư mục thật là hạ tầng nền, Pha 1 SPEC-FILE-MANAGER.md, chưa
> có 1 dòng code nào.)*

**(a) File cần tạo (đúng thứ tự Pha ở `SPEC-FILE-MANAGER.md` §6):**
- Pha 1: `lib/file-manager/tree.ts` (cây thư mục thật trên đĩa, quy ước tên) + đăng ký `.idf` mở
  từ Finder (`package.json` file-associations, cần build lại installer).
- Pha 2: `lib/file-manager/ifpack-backup.ts` — **CÓ THỂ TÁI DÙNG `lib/cad/ifpack.ts` (VIỆC 5 hôm
  nay) làm nền** — `.ifpack` đã là đúng định dạng backup 1 dự án, chỉ cần thêm lịch tự động
  (hiện chỉ có nút bấm tay).
- Pha 3: watch folder `01-input/` → tự phân loại vào Library (phụ thuộc NT1 xong — cần "Library"
  là 1 nơi duy nhất trước khi có chỗ để "tự phân loại vào").
- Phân quyền `Knowledge/`/`_System/` (khoá đọc/ghi) — phụ thuộc Pha 1 xong (cây thư mục thật phải
  tồn tại trước khi có gì để khoá).

**(b) Rẻ làm trước:** Không có mục nào trong NT5 là "rẻ" — toàn bộ phụ thuộc Pha 1 (cây thư mục
thật) chưa tồn tại. Mục ít phụ thuộc nhất: mở rộng `.ifpack` (VIỆC 5) thêm lịch tự động — vì đã
có sẵn hàm `buildIfpack()`, chỉ cần 1 `setInterval`/cron-like trong app.

**(c) Phải đợi:** TOÀN BỘ NT5 đợi `SPEC-FILE-MANAGER.md` Pha 1 — xem mục 0.5.

**(d) Mâu thuẫn code thật:** Không có gì để mâu thuẫn — 0% code hiện có liên quan.

**(e) Ước lượng:** RẤT LỚN (đổi toàn bộ mô hình lưu trữ từ Prisma-row + `/uploads` phẳng sang cây
thư mục thật trên đĩa — ảnh hưởng mọi API `/api/library`, `/api/projects`, migration dữ liệu cũ).

---

## 6. Thứ tự đề xuất tổng — RẺ trước, ĐẮT sau, phụ thuộc rõ

| Thứ tự | Việc | Vì sao đây | Ước lượng |
|---|---|---|---|
| 1 | NT3 — Render chuột phải → menu nạp nhanh | Component `Popover`+dialog ĐÃ CÓ (VIỆC 2), chỉ nối dây, 0 phụ thuộc | NHỎ |
| 2 | NT2 — bảng ánh xạ định dạng→đích (thuần dữ liệu, chưa tích hợp UI) | Không phụ thuộc gì, test độc lập dễ, mở đường cho NT1 dùng sau | NHỎ |
| 3 | NT1 — gộp `LibraryPanel.tsx` + `LibraryBrowser.tsx` (bỏ CAD block ra khỏi đợt này) | 2 cái GẦN NHAU NHẤT (cùng là ảnh), rẻ hơn gộp cả 3 | VỪA |
| 4 | NT4 — field `diskPath` + nút "Cập nhật liên kết" thủ công (KHÔNG làm watch nền) | Giá trị thật (tránh ảnh vỡ khi đổi tên file) mà không cần giải bài toán khó (watch nền) | VỪA |
| 5 | NT1 phần 2 — gộp block/furniture CAD vào panel chung + xoá `/library/ingest` route riêng | Đợi sau khi 3-4 ổn định, và đợi Hoà quyết mục 0.1 (giữ hay bỏ popover `[+]`) | LỚN |

**KHÔNG xếp NT5 vào bảng trên** — toàn bộ phụ thuộc hạ tầng chưa tồn tại (mục 0.5), không có
phần nào "làm được ngay" để xếp thứ tự cùng các việc khác.

---

## Câu hỏi cần Hoà quyết trước khi bắt tay code — ĐÃ CHỐT 28/07

1. **NT1 vs popover `[+]` vừa làm sáng nay** — bỏ hẳn (đúng NT1) hay giữ, chỉ thêm 1 mục "Nạp
   hàng loạt" trỏ vào luồng ingest?
   > **CHỐT: BỎ HẲN, đúng NT1.** Không giữ, không thêm mục. Thay bằng: thả file vào panel → tự
   > nhận. Nhiều file hoặc có PDF/Excel/CAD → tự chuyển sang chế độ "nạp hàng loạt" TRONG CÙNG
   > PANEL, không hỏi người dùng. *(Thuộc phạm vi NT1 — xem §1(a); NT1 xếp việc ④, chỉ làm nếu
   > còn thời gian đợt này — xem "Thứ tự đề xuất tổng" bên dưới.)*
2. **NT3 áp cho CAD không?** — nguyên tắc chỉ nói rõ Render; CAD giữ nút bar hiện tại hay cũng
   thêm chuột-phải?
   > **CHỐT: CÓ, CAD cũng thêm chuột phải** — chuột phải là quy ước hệ điều hành, không riêng
   > Render. CAD nền trống: Dán · Nhập tệp vào đây · Thêm block. CAD trên đối tượng: Sửa · Nhân
   > bản · Xoá · Đổi vật liệu. GIỮ nút bar (đường chính thức); chuột phải là đường tắt.
3. **NT4 watch nền** — chấp nhận giới hạn "chỉ Chrome/Edge" (File System Access API), hay đợi
   giải pháp khác?
   > **CHỐT: chia 2 pha.** NAY = `diskPath` + nút "Cập nhật liên kết" bấm tay, chạy MỌI trình
   > duyệt (không dùng File System Access API cho pha này — xem §1(a) VIỆC ③ sửa lại bên dưới).
   > SAU = watch nền tự động, CHỈ Electron desktop (`dist-installer/` đã có). KHÔNG chấp nhận giới
   > hạn chỉ-Chrome/Edge cho bản web — bản web là kênh cho khách xem deck, không được kén trình
   > duyệt.
4. **NT1 block/furniture (CAD)** — gộp chung 1 `LibraryAsset` model với ảnh, hay giữ 2 "ngăn" dữ
   liệu khác nhau trong cùng 1 panel UI?
   > **CHỐT: MỘT model `LibraryAsset` chung** + trường `type` + trường mở rộng theo loại — đúng
   > nguyên tắc "một xương sống, mỗi loại một bộ mặt" đã ghi ở `SPEC-IF-LIBRARY.md §2` ("Không
   > làm 8 thư viện rời. Cũng không nhét mọi thứ vào một bảng phẳng"). KHÔNG tách 2 model — tách
   > là quay lại đúng bệnh "hai nơi, hai cách dùng" mà NT1 đang chống.

## Thứ tự làm — đợt 28/07 tối (theo ước lượng ở mục 1-5, không đổi)

① ✅ XONG — NT3 Render chuột phải (`FlowCanvas.tsx`) + CAD chuột phải theo Q2 (`CadCanvas.tsx`,
`CadEditor.tsx`, `lib/cad/store.ts`) · commit `9a52f83`.
② ✅ XONG — NT2 bảng ánh xạ định dạng→đích (`lib/gateway/detect.ts` + `route.ts`, 34/34 test
PASS, thuần dữ liệu, CHƯA nối UI) · commit `bfd5fe9`.
③ ✅ XONG — NT4 pha 1: `diskPath` + nút "Cập nhật liên kết" (`lib/present-editor/model.ts` +
`Inspector.tsx`), verify browser thật (chọn lại file → ảnh đổi ngay) · commit `1f637ba`.
④ NT1 gộp `LibraryPanel` + `LibraryBrowser` (LỚN) — CHƯA làm đợt này (Hoà giao thêm VIỆC A/B
ngay sau ①②③, ưu tiên trước ④). Đợi đợt sau, xem `STATUS.md`.
⑤ NT5 cây thư mục thật (RẤT LỚN) — KHÔNG làm đợt này, chờ ở `STATUS.md`.

---

*v1.2 (①②③ xong, ④ dời sau — Hoà giao thêm VIỆC A/B) · 2026-07-28 · Ben soạn theo ý Hoà.*
*v1.1 (chốt 4 câu hỏi + thứ tự làm đợt 28/07 tối) · 2026-07-28 · Ben soạn theo ý Hoà.*
*v1.0 · 2026-07-28 · Ben soạn theo ý Hoà — VIỆC 8, chỉ kế hoạch, chưa code dòng nào.*
