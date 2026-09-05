# BẢN KIỂM KÊ NĂNG LỰC — cửa chặn trước khi đập giao diện

> Lập **05/09/2026**, worktree `nen-moi`, nhánh `nen-checkpoint`, mốc `af381ac6`.
> Đo tại nguồn trên đúng cây này. Server dev `http://localhost:3255` sống; 12 ảnh app thật ở
> `/tmp/mat-3255/` (1440×900, `do.json` ghi **0 lỗi console** ở cả 10 route).

---

## 0 · CÁCH ĐỌC BẢN NÀY

**Bản này KHÔNG mô tả giao diện.** Nó liệt kê **việc người dùng đang LÀM ĐƯỢC**. Bố cục được
phép đập; danh sách dưới đây thì không được rơi mất một dòng nào.

Căn cứ pháp lý: `docs/IF-ARCHITECTURE-BLUEPRINT.md` §B25 (NO-REBUILD) bảo vệ **NĂNG LỰC ·
HỢP ĐỒNG · DỮ LIỆU** — **không** bảo vệ bố cục thị giác lỗi thời. Bản kiểm kê này là chỗ ghi ba
thứ được bảo vệ đó thành danh sách đếm được.

### ⛔ LUẬT DÙNG BẢN NÀY

> **Chưa có mục cho màn nào thì chưa được đập màn đó.**
>
> Bản dựng mới của một bề mặt chỉ được nghiệm thu khi **mọi dòng của bề mặt đó** vẫn làm được —
> hoặc có một dòng ghi rõ *"cố ý bỏ, Hoà duyệt ngày …"*. Im lặng đánh rơi là **hồi quy**, không
> phải "đơn giản hoá".

### Cột chứng minh — cột quan trọng nhất, đọc kỹ ba nhãn

| Nhãn | Nghĩa | Được dùng làm danh sách nghiệm thu thế nào |
|---|---|---|
| 🟢 **CHẠY THẬT** | có hành trình đã chạy trên app thật, hoặc test khoá đúng hành vi đó | bản mới **phải** làm lại được, có bằng chứng cùng loại |
| 🟡 **CÓ MÃ, CHƯA CHỨNG MINH** | đọc mã thấy đường dây đủ, **chưa ai chạy đầu-cuối** | bản mới giữ đường dây; **đây là lúc rẻ nhất để chạy thử lần đầu** |
| 🔴 **DÂY CHƯA CẮM** | mã tồn tại, `grep` ra **0 nơi gọi** từ giao diện | bản mới **không được coi là mất** — nó vốn đã chưa tới người dùng. Quyết định: cắm, hay đóng dấu lỗi thời tại chỗ |

⛔ **Cấm ghi 🟢 bằng suy luận từ mã.** Đọc mã thấy hợp lý ⇒ vẫn là 🟡. Ảnh chụp màn chứng minh
*trang có dựng lên*, **không** chứng minh *việc có sống qua tải lại* — ảnh chỉ nâng được lên 🟡.

### Nguồn bằng chứng được trích trong bản này

| Nguồn | Nó chứng minh gì | Nó KHÔNG chứng minh gì |
|---|---|---|
| `docs/delivery/JOURNEY-MATRIX.md` J01–J23 | hành trình chạy đầu-cuối trên app thật, có hiệu chuẩn thế-giới-hỏng | những gì nằm ngoài 22 hành trình đó |
| 457 tệp test (`find … -name '*.test.ts*'`) | hàm/lõi chạy đúng | có nút bấm tới được nó hay không |
| `/tmp/mat-3255/*.png` + `do.json` | 10 route **dựng lên được**, 0 lỗi console | không hành vi nào |
| `npm run soi:cam-dien` (chạy 05/09) | **có đường dây** ở cấp tệp/module | **không chứng minh có nút bấm** — máy tự khai câu này |

---

## 1 · HỢP ĐỒNG DỮ LIỆU — đập bố cục mà làm hỏng đây là **MẤT DỮ LIỆU NGƯỜI DÙNG**

### 1.1 · Ba định dạng tệp đã ghi ra đĩa của người dùng

| Đuôi | Hằng số phiên bản | Định nghĩa | Bảng nâng cấp | Chứng minh |
|---|---|---|---|---|
| `.idf` — bản vẽ 2D, **tất cả** tờ + metadata | `IDF_VERSION = 2` (`lib/cad/idf.ts:25`) | `lib/cad/idf.ts` | có (`lib/cad/idf.ts:65`, v1→v2 tách sheet) | 🟢 `lib/cad/idf.test.ts` · `levels-idf-v2.test.ts` · `idf-neutrality.test.ts`; J07 PASS trên app thật |
| `.idfc` — MỘT cấu kiện, dùng lại xuyên dự án | `IDFC_VERSION = 3` (`lib/cad/idfc.ts:49`) | `lib/cad/idfc.ts` | `IDFC_MIGRATIONS` (`lib/cad/idfc.ts`) | 🟢 `lib/cad/idfc.test.ts` · `idfc-integrity.ts`; **J15 PASS đầy đủ** (ba lần đóng app, bản sửa còn nguyên) |
| `.idfp` — toàn bộ hồ sơ Trình chiếu | `IDFP_VERSION = 1` (`lib/present-editor/idfp.ts:34`) | `lib/present-editor/idfp.ts` | `IDFP_MIGRATIONS` (`:44`) | 🟢 `lib/present-editor/idfp.test.ts`; **J21 PASS đầy đủ** (nạp vào dự án trắng → mọc đúng 14 phần tử) |
| `.ifpack` — ZIP sao lưu dự án (chứa `drawing.idf` + ảnh markup) | — | `lib/cad/ifpack.ts:117,157` | — | 🟢 `lib/cad/ifpack.test.ts` |
| Gói Hồ Sơ Sống `.zip` (viewer HTML tự chứa) | — | `lib/ho-so-song/pack.ts` + `manifest.ts` | 3 tầng thoái lui | 🟡 `lib/ho-so-song/ho-so-song.test.ts`; chưa hành trình nào mở gói ra soi |

🔴 **Ràng buộc phải giữ khi dựng lại:** `lib/server/mime-sniff.ts:68,109` nhận diện tệp IF bằng
`idfpVersion`/`idfVersion` **là số** kèm `sheets` **là mảng**. Đổi hình dạng hai trường này ⇒ cửa
nhập tệp thôi nhận ra tệp của chính app.

### 1.2 · Khoá `localStorage` (đo tại nguồn, 05/09 — **≈78 khoá**)

Toàn bộ ở `docs/delivery/` không có nơi nào chép; dưới đây là **nhóm chức năng**, mỗi nhóm ghi
hậu quả nếu bản mới quên đọc.

| Nhóm | Khoá tiêu biểu | Mất thì mất gì |
|---|---|---|
| **Đường quay lại** (§2) | `interiorflow.resume.<userId>` · `interiorflow.tourDone.<userId>` · `interiorflow.lastUserId` | mất chỗ đang dở — **D6/D7 đã trả giá** |
| Trạng thái chặng | `interiorflow.cad.mode` · `interiorflow.stagemode.render` · `interiorflow.stageDone` | mở lại rơi về mode mặc định |
| Bàn giao giữa chặng | `interiorflow.cadHandoff` · `cadPresentHandoff` · `presentHandoff` · `presentReturn` · `photoEditorHandoffIn` · `photoEditorHandoffReturn` · `specPresentHandoff` · `toBanVeHandoff` | nút "Đưa sang…" thành nút chết |
| Tài sản studio (đã bắc cầu sang IDB) | `interiorflow.brandKits` · `brandKitActive` · `colorRegistry` · `colorSources` · `refManifest` · `if.library.idfc.v1` | mất kho `.idfc`, bảng màu, Brand Kit |
| Bày trên màn của tôi | `interiorflow.home.ke-widget.<userId>` (`lib/home/ke-widget-store.ts:24`) · `interiorflow.navigator.collapsed_v1` · `if-library-card-size` · `interiorflow.rail.ghim_v1` | mất cách bày; **đúng luật chung↔máy, KHÔNG lên máy chủ** |
| Vitals | `interiorflow.vitals.thinkLevel` · `hint_seen_v2` · `gesture_first_done` · `eval-model.v1` | mất nấc suy nghĩ + gợi ý đã tắt |
| Đơn vị · giao diện | `interiorflow.units_v1` · `interiorflow.theme` · `interiorflow.lang` · `interiorflow.wallpaper` · `canvas_wallpaper_v1` | đổi đơn vị/ngôn ngữ/theme về mặc định |
| Files · Thư viện · Gallery | `if.files.ngan_v1` · `if.files.thumuc_v1` · `interiorflow.filemanager_g4.local_state_v1` · `gallery_lien_nganh.local_state_v1` · `interiorflow.inspiration.local_state_v1` | mất nguồn tự thêm ở Gallery/Cảm hứng (**chỉ sống cục bộ, không gửi đi đâu**) |
| BOQ · Present | `if-boq-group-mode` · `if-boq-coach-dismissed` · `interiorflow.customTemplates` · `templateRequests` | mất template tự lưu |

### 1.3 · IndexedDB — **4 cơ sở dữ liệu**

| DB | Store/khoá | Chứa | Chứng minh |
|---|---|---|---|
| `interiorflow-sheets` (`lib/sheets-persist.ts:41`) | khoá `<userId>::<route>::<bucketId>` | **bản vẽ 2D · deck Trình chiếu · scene 3D** — nguồn sự thật cục bộ | 🟢 J06 · J07 · J12 · J16 PASS (đọc thẳng IDB, không đọc chữ trên màn) |
| ↳ nhánh `studio::<route>` (`lib/storage/studio-persist.ts`) | `studio::/studio-idfc` · bảng màu · Brand Kit · refManifest | tài sản tầng studio, đã bắc cầu **từ localStorage, bản cũ GIỮ NGUYÊN làm lưới an toàn** | 🟢 J15 PASS |
| `interiorflow-fonts` (`lib/present-editor/custom-fonts.ts:33`) | font người dùng nạp | font nhúng PDF/PPTX | 🟡 |
| `interiorflow-print-upscale` (`lib/present-editor/upscale-cache.ts:14`) | cache ảnh phóng to 300dpi | | 🟡 |
| kho handle thư mục (`lib/root-folder.ts:33` · `lib/cad/auto-backup.ts:51`) | `FileSystemDirectoryHandle` | thư mục đĩa người dùng đã cấp quyền | 🟡 |

### 1.4 · Endpoint API — **95 route**, phân theo mức đã cắm

Đếm nơi gọi từ `components/` + `app/` (không kể `app/api/`, không kể test):

| Endpoint | Nơi gọi | Ghi chú |
|---|---|---|
| `/api/library` | **28** | kho tài sản — nặng nhất |
| `/api/specs` | **17** | kho vật liệu thương mại |
| `/api/home/summary` · `/api/notebook` · `/api/dashboard` · `/api/integrations` | 8 · 6 · 6 · 6 | |
| `/api/jobs` · `/api/tasks` · `/api/asset-representation` | 7 · 5 · 5 | |
| `/api/flows` · `/api/project-files` · `/api/boq` · `/api/stock-photos` · `/api/vision/caption` | 4 mỗi cái | |
| `/api/comments` · `/api/credits` · `/api/share` · `/api/home/notes` · `/api/project-asset-usage` | 3 mỗi cái | |
| `/api/idfc-import` · `/api/vision/analyze` · `/api/lark-tasks` | 2 mỗi cái | |
| `/api/cursors` · `/api/strategy/scenarios` · `/api/illustration` · `/api/present/text` · `/api/pdf/extract` · `/api/colors/lark` | 1 mỗi cái | mỏng nhất — dễ đứt mà không ai biết |
| 🔴 `/api/manufacturer-import` (+ `/apply`) | **0** | có lõi `lib/capabilities/manufacturer-import-apply.ts` + test, **không mặt nào gọi** |
| 🔴 `/api/atlas-materials/sync` | **0** | |
| 🔴 `/api/organizations/[id]` (+ `/members`) | **0** | |

**Ghi đè có kiểm phiên bản:** `PUT /api/flows/[id]` nhận `expectedRev`; hai tab cùng ghi ⇒ tab sau
**409** (🟢 J18 PASS tầng cơ chế, đọc lại bằng SQL). Bản mới đổi đường lưu mà bỏ `expectedRev` là
mở lại lỗ mất-việc-âm-thầm.

### 1.5 · Nợ CSDL còn mở

`ProductSpec.matId` **null** trên dữ liệu thật ⇒ nhánh matId-UUID của BOQ **chưa chạy sống lần
nào** (J14 ghi rõ). Migration đã có sẵn trong repo (`fd83f343`), việc còn lại là `migrate deploy`
+ backfill (`scripts/backfill-material-matid.ts`, mặc định dry-run).

---

## 2 · ĐƯỜNG LƯU-VÀ-VÀO-LẠI (resume) — họ bệnh đã trả giá 4 lần

| # | Việc | Đường | Ghi ở đâu | Chứng minh |
|---|---|---|---|---|
| R1 | đóng app rồi mở lại **về đúng chặng đang dở** | thẻ tiêu điểm Home | `interiorflow.resume.<userId>` = `{route, flowId, scopeKind, sheetId}` | 🟢 **J05 PASS** — đóng HẲN trình duyệt, thẻ vẫn trỏ đúng; đo bằng **bàn phím thuần** (Tab 19 lần, ring `--focus-ring`, Enter → `/projects/<id>/cad`) |
| R2 | vào **thẳng** deep-link studio (tab mới · bookmark · F5) mà không mất việc | `lib/danh-tinh-phien.ts` gieo lại bộ đệm từ **phiên máy chủ** | IDB `<userId>::/cad-editor::<projectId>` | 🟢 **J16 PASS** — 0 khoá mơ hồ, không rơi về `local`/rỗng. Đóng **D1** (P0 mất bản vẽ) |
| R3 | vào thẳng deep-link **rồi về Home**, thẻ vẫn đủ đường quay lại | `computeResumePatch` ghi đủ `flowId` | localStorage | 🟢 **J16b PASS** — đóng **D6** |
| R4 | mở **bookmark route cũ** `/cad-editor` → về đúng dự án, **không loé Home** | `LegacyStageRedirect` | đọc resume | 🟢 **J23 PASS** (đo bằng `framenavigated`) — đóng **D7** |
| R5 | đóng app **đột ngột** (SIGKILL, không `beforeunload`) vẫn còn việc | autosave IDB | IDB | 🟢 **J17 PASS trên bản WEB**. 🟡 bản Electron đóng gói **chưa đo** |
| R6 | lưới đỡ máy chủ: bản vẽ 2D còn sau khi **xoá sạch hồ sơ trình duyệt** | `lib/cad/luu-len-may-chu.ts` → `POST /api/project-files`, nhịp 30s, tên `ban-ve.sao-luu.idf` | `ProjectFile` | 🟢 **J07 PASS** — mạnh hơn J16 vì hồ sơ đã bị xoá, sự thật chỉ có thể từ máy chủ |
| R7 | Trình chiếu nhớ **tờ đang mở** | `saveResume(userId,{route,sheetId})` (`PresentSheets.tsx:644`) | localStorage, **theo user+route, KHÔNG theo dự án** | 🟢 J12 PASS |
| R8 | 2D ghi thẳng `ban-ve.idf` ra **thư mục đĩa** người dùng chọn + đọc lại xác nhận | `CadSheets.tsx:144-148` (ghi → đọc lại → `importIdf` verify) | đĩa cục bộ | 🟡 có mã, đường ghi-rồi-đọc-lại đầy đủ; chưa hành trình nào đo |
| R9 | backup định kỳ 10 phút ra thư mục đĩa + khôi phục theo thang thời gian | `lib/cad/auto-backup.ts` | đĩa cục bộ | 🟡 `lib/cad/backup-diff.test.ts` khoá lõi; chưa chạy đầu-cuối |
| R10 | ba nấc Navigator / Inspector / zen nhớ qua phiên | `KHOA_INSPECTOR_AN` · `interiorflow.navigator.collapsed_v1` | localStorage | 🟡 |

🔴 **CÒN MỞ — D3 (`BLOCKED`, J03):** hai người dùng chung một máy — đăng xuất **không rửa**
`interiorflow.lastUserId` (`AccountSettings:54` · `AccountMenu:137` · `MobileMenu:160` ·
`PixelSettingsShell:191` chỉ xoá cookie). Bản mới **không được nhân bản** thêm cửa đăng xuất thứ
năm cũng quên rửa.

---

## 3 · PHÍM TẮT ĐANG CHẠY

Sổ khai: `lib/shortcuts.ts` (bảng ⌘/ đọc từ đây) · `lib/commands/registry.ts` (55 CommandDef, 97
alias) · `lib/kbd.ts` (`IS_MAC`, dịch `mod`/`shift` theo nền tảng).

⚠️ **Sổ khai ≠ đang chạy.** Dưới đây đã đối chiếu với nơi **đăng ký thật**.

### 3.1 · Toàn cục — nơi đăng ký đã xác minh

| Phím | Việc | Đăng ký ở | Chứng minh |
|---|---|---|---|
| `⌘/` · `?` | mở bảng tra phím tắt | `AppChrome.tsx:170` | 🟢 |
| `⌘K` | bảng lệnh nhanh | `AppCommandPalette` (mount trong `AppShell`) | 🟢 ảnh + `lib/commands/*.test.ts` |
| `⌘J` | mở khẩu độ Vitals | **`VitalsAperture.tsx:419`** | 🟡 — **sổ `00-CHOT` 04/09 ghi phím này CHẾT; đo lại 05/09 thì nó đã được nối lại.** `StageSwitcher:223` (mồ côi) và `VitalsRightEdgeHost:49` (chưa từng mount) đều đã gỡ |
| `⌘1` `⌘2` `⌘3` | nhảy chặng 2D / 3D / Trình chiếu | `AppChrome.tsx:178-180` | 🟡 — **`lib/shortcuts.ts` KHÔNG khai bộ này**; bảng ⌘/ do đó không dạy nó |
| `⌘0` | về Home, hỏi trước nếu chưa lưu | `AppChrome.tsx:188` | 🟡 |
| `⌘B` | ẩn/hiện Navigator | `AppChrome.tsx:193` **và** `AppShell.tsx:177` (phím `B`/`I` trần, CAD cần ⇧) | 🟡 — hai nơi đăng ký, cần soi khi dựng lại |
| `⌘L` | mở tấm Thư viện | `AppChrome.tsx:198` | 🟢 ảnh `06-thu-vien.png` |
| `⌘\` | zen — ẩn cả hai panel | `AppShell.tsx:167` | 🟡 |
| `⌃⌘Q` | khoá màn, ép lưu trước khi khoá | `AppChrome.tsx:163` | 🟡 |

### 3.2 · Theo chặng — khai trong `lib/shortcuts.ts`

- **2D**: `⌘Z` `⌘⇧Z` `⌘Y` `⌘C` `⌘V` `⌘A` `⌘D` `Delete` `Backspace` `⌘S` `⌘⇧S` `⌘P` `⌘9` `F`
  `⌘=` `⌘-` `F8` (Ortho) `F12` (Dynamic Input) `Space` giữ (pan) / gõ nhanh (lặp lệnh) `Enter` `Esc`
  — **cộng 97 alias lệnh gõ tay kiểu AutoCAD** (`lib/cad/command-aliases.ts`, gõ ở thanh trạng
  thái: `L` `W` `F` `TRIM` `XL` `AR` `ARP`…). 🟢 `lib/commands/*.test.ts` + `command-aliases`;
  bảng ⌘/ đọc thẳng từ đó nên **không lệch được**.
- **3D / bảng node**: `⌘D` `⌘G` `⌘Z` `⌘⇧Z` `⌘Y` `⌘9` `⌘=` `⌘-` `⌘'` `Space` `W` `V` `H` `Esc`
  · `Delete` xoá khối. 🟢 **J09 PASS sau khi vá** — trước đó `Delete` **không nối registry**
  (`Viewport3D.tsx`); đây là **ca thứ hai** chiều LÙI của 3D gãy, cùng gốc với `⌘Z`.
- **Trình chiếu**: `⌘A` `⌘Z` `⌘⇧Z` `⌘Y` `⌘D` `⌘C` `⌘V` `⌘G` `⌘⇧G` `Tab` `⌘⇧]` `⌘⇧[` `⌘S`
  `⌘=` `⌘-` `⌘9` `Esc`. 🟡
- **Files**: `Delete` xoá nhiều tệp đang chọn (`FileManagerShell.tsx:318`) · `⇧`-click chọn dải ·
  `⌘`-click chọn rời. 🟡

### 3.3 · Phím khai **mờ kèm lý do** — bản mới phải giữ cả lý do

`⌘G`/`⌘⇧G` ở 2D (chưa có khái niệm nhóm) · `⌘O` (menu Mở nhiều lựa chọn) · `⌘N` (trình duyệt giữ
cứng) · `⌘'` lưới · `⌘S` ở bảng node · `⌘⇧S` "lưu thành" ở Trình chiếu · `⌘P` ở Trình chiếu.
Lý do đi qua `aria-describedby` chứ **không** qua `disabled` — nút `disabled` bị Tab bỏ qua nên lý
do không tới người dùng bàn phím (bài học 16/08, đã thành luật).

---

## 4 · `/` HOME

Bề mặt sống: **`components/home/XuongHome.tsx`** (bọc `AppShell active="home"`).
Ảnh: `/tmp/mat-3255/01-home.png` — 1409 ký tự, 55 nút, 0 lỗi.

| # | Việc người dùng làm được | Vào bằng đâu | Mã | Ghi ra đâu | Chứng minh |
|---|---|---|---|---|---|
| H1 | **mở lại việc đang dở**, nhảy đúng chặng | thẻ tiêu điểm (bấm được **cả thân** qua lớp phủ `<Link>`) | `XuongHome.tsx:204` `.mo-lai` · `lib/home/the-tieu-diem.ts` `duongMoLai()` | đọc `interiorflow.resume.<userId>` | 🟢 **J05 PASS**, đo bằng bàn phím thuần |
| H2 | **tạo dự án mới** | nút "Tạo dự án mới" → `ProjectInitBoard` | `XuongHome.tsx:584` → `HomeScreen.tsx:671` | `POST /api/flows` → `Project`+`Flow` | 🟢 **J04 PASS** — `Project` 5→6, URL nhảy `/projects/<id>/render` |
| H3 | **mở dự án có sẵn** — đưa tiêu điểm sang cột dự án | nút "Mở dự án có sẵn" | `moCotDuAn` `XuongHome.tsx:576` | — | 🟡 |
| H4 | mở thẳng một dự án ở cột kề bên | thẻ cột phải | `moThu` `:598` | `router.push` | 🟡 |
| H5 | **nhập từ tệp** — hiện **MỜ kèm lý do** đúng luật §9 | nút thứ ba | `hanhBatDau.lyDo['nhap-tep']` `:589` | — | 🟢 D-J04a đóng: ba nút nay ba việc riêng, trước đó **cả ba dùng chung một `onClick` và không nút nào tạo được gì** |
| H6 | **bày lại kệ widget**: đổi thứ tự · ẩn · gọi lại | nút ⟨ ⟩ ✕ trên widget | `doiCho`/`anWidget`/`hienWidget` `:771-798` | `interiorflow.home.ke-widget.<userId>` — **ghi ngay tại thao tác**, không đợi rời trang | 🟡 `lib/home/ke-widget-store.test.ts` khoá lõi |
| H7 | xem số sống của xưởng: dự án · việc mở · xong hôm nay · đang online | thẻ phải | `widgetTuThat` `:113` ← `GET /api/home/summary` | — | 🟢 ảnh cho thấy số thật (1 dự án · 0 việc · 1 online) |
| H8 | mở bảng việc | nút "khi gọi" | `:742` `router.push('/tasks')` | — | 🟡 |
| H9 | nền **ánh sáng theo giờ** | tự động | `SystemWallpaper` (`DongStudioHome` cũ đã bỏ, nay ở `XuongHome`) · `lib/wallpaper/*` | `interiorflow.canvas_wallpaper_v1` | 🟢 ảnh: *"15:47 · ánh sáng ban ngày trung tính · 5600K"* |
| H10 | trạng thái rỗng ra **`RESUME → BEGIN`**, không phải "Home trừ ảnh hero" | máy chưa có việc dở | `XuongHome` nhánh `khiGoi` | — | 🟢 ảnh 01 chính là trạng thái này |

### 🔴 DÂY CHƯA CẮM Ở HOME — **cả một cây con**

`components/home/DongStudioHome.tsx` (900 dòng, **có test**) là bản Home cũ. Nó chỉ còn được nhắc
trong **một dòng chú thích** ở `HomeScreen.tsx:221`. Không nơi nào `import`. Cả cây con dưới nó
chết theo:

| Tệp | Dòng | Việc nó từng làm |
|---|---|---|
| `components/home/DongStudioHome.tsx` | 900 | Home bento |
| `components/ProjectSelect.tsx` | — | màn chọn dự án (còn được `DongStudioHome` gọi) |
| `components/home/BeMatHome.tsx` · `LivingCanvas.tsx` · `ProjectOverviewCard.tsx` · `BatDauNgaySoKhong.tsx` | — | chỉ được `DongStudioHome`/`ProjectSelect` gọi |
| **9 widget**: `QuickNotes` `WeeklyMaterial` `WeeklyImage` `ContributionGrid` `NewsFeed` `StageChart` `TodayStrip` `UpcomingList` `LightClock`(riêng LightClock vẫn được `XuongHome` dùng) | — | ghi chú nhanh · vật liệu của tuần · ảnh đẹp tuần · lưới đóng góp · tin studio · biểu đồ chặng · dải hôm nay · mốc sắp tới |
| `components/home/widgets/VitalsPill.tsx` | 87, **có test** | pill Vitals bản cũ |

⚠️ **Hệ quả cho đợt dựng lại:** `GET/POST/DELETE /api/home/notes` (ghi chú nhanh) **có route, có
`lib/home/notes-store.ts` + test, nhưng mặt tiêu thụ duy nhất là `QuickNotes` đang mồ côi** ⇒ trên
app thật hôm nay **không ai ghi được ghi chú nào**. Đây là một năng lực **đã mất rồi**, không phải
năng lực sắp mất — bản mới quyết định cắm lại hay đóng dấu lỗi thời, nhưng **phải quyết**.

---

## 5 · `/projects/[id]/cad` — THIẾT KẾ 2D

Ảnh `02-2d.png`: 2327 ký tự, **106 nút**, 0 lỗi — bề mặt dày nhất app.
Vỏ: `CadStageScreen.tsx` → `AppShell` (Navigator = `LayerPanel`, canvas = `FoldableDualPane`,
Inspector chỉ hiện khi **có chọn**, toolbelt = `CadToolbelt`).

| # | Việc | Vào bằng | Mã | Ghi ra đâu | Chứng minh |
|---|---|---|---|---|---|
| C1 | **vẽ 2D bằng 47 công cụ** — select · line · freehand · polyline · rect · circle · circle3p · arc · arccenter · move · copy · rotate · mirror · offset · dimension · measure · text · block · wall · room · pan · trim · extend · fillet · chamfer · arrayrect · arraypolar · scale · stretch · break · join · explode · lengthen · dimradius · dimdiameter · dimangular · dimcontinue · dimbaseline · hatch · markup · photo · polygon · spline · xline · ellipse · donut · divide · zone · arrow · campath | dock dưới · gõ lệnh ở thanh trạng thái · `⌘K` | `lib/cad/store.ts:53-120` (`Tool`) · `CadCanvas.tsx` (4372 dòng) · `lib/cad/commands.ts` | `Doc.entities` → IDB | 🟢 **109 tệp test** trong `lib/cad/` + J07 PASS đầu-cuối |
| C2 | **lưu tự động + `⌘S` ép lưu ngay** | tự động | `cad3d-autosave.ts` · `luu-len-may-chu.ts` | IDB **và** `POST /api/project-files` 30s | 🟢 J07 · J17 |
| C3 | **nhiều tờ bản vẽ** (thêm/đổi tên/chuyển) | `SheetTabBar` | `CadSheets.tsx` (1533 dòng) · `sheet-migrate.ts` | `.idf` `paperSheets[]` | 🟢 `lib/cad/*sheet*.test.ts` |
| C4 | **nhập tệp một cửa tự nhận định dạng** — IDF · IFpack · DXF · DWG · ảnh; định dạng chưa hỗ trợ **nói rõ lý do** | menu Nhập | `CadEditor.tsx:712-717` → `lib/gateway/detect.ts` | | 🟢 `dxf-import.test.ts` · `dwg-import.test.ts` · `dwg.roundtrip` |
| C5 | **xuất 7 đích**: PNG · DXF · PDF vector · `.idf` · **bộ hồ sơ PDF nhiều tờ** · `.ifpack` · handoff ảnh sang 3D / sang Trình chiếu | menu Xuất | `CadEditor.tsx:720-757` | tệp / handoff localStorage | 🟢 `dxf.roundtrip.test.ts` · `dxf-openable.test.ts`; 🟡 PDF nhiều tờ chưa mở tệp soi |
| C6 | **backup định kỳ ra thư mục đĩa** + **khôi phục từ backup** (tạo dự án MỚI, không đụng bản đang mở) | menu Xuất | `:735-753` · `lib/cad/auto-backup.ts` · `BackupRecoveryModal.tsx` | đĩa cục bộ | 🟡 `backup-diff.test.ts` khoá lõi |
| C7 | **điểm khởi đầu nhanh**: mở bản demo · mẫu dự án (Căn hộ/Văn phòng/Khách sạn) · **AI mô tả** → tự vẽ tường + đặt nội thất | menu "Bắt đầu" | `:759-767` · `lib/cad/ai-assist.ts` · `AiBriefPanel.tsx` | `Doc` | 🟢 `ai-assist.test.ts` · `ai-layout-feedback.test.ts` |
| C8 | **khung tên** (đọc Brand Kit dự án, không hardcode) | Công cụ bản vẽ | `titleBlockPro()` | `Doc` | 🟢 `idf-neutrality.test.ts` khoá tính trung tính |
| C9 | **thống kê · legend** tự đếm, đóng dấu lên bản vẽ | Công cụ bản vẽ | `SchedulePanel.tsx` · `lib/cad/legend.ts` | `Doc` | 🟢 `legend.test.ts` |
| C10 | **kiểm chuẩn TCVN/QCVN/ISO** — chỉ đọc & đề xuất, **không tự sửa** | Công cụ bản vẽ | `lib/cad/standards/*` (12 bộ luật) · `checker.ts` | không ghi | 🟢 nhiều test; hiến pháp `checker.ts:5-7` |
| C11 | **gợi ý tên phòng** — chỉ đề xuất, người bấm Áp dụng | Công cụ bản vẽ | `lib/cad/label-placer.ts` | `Doc` | 🟢 `label-placer.test.ts` |
| C12 | **nhận diện phòng**: nhãn + tường → cấu kiện phòng thật, biên đóng băng, m² sống, duyệt từng phòng | Công cụ bản vẽ | `lib/cad/room-detect*` | `Doc` | 🟢 |
| C13 | **MEP sơ cấp** — gợi ý chiếu sáng/công tắc/ổ cắm/máy lạnh | Công cụ bản vẽ | `lib/cad/mep*` | `Doc` | 🟡 |
| C14 | **lịch sử vẽ** — click một bước để Undo/Redo tới đó | Công cụ bản vẽ | `HistoryPanel.tsx` | | 🟡 |
| C15 | **chế độ trình bày** — cùng bản vẽ, cách hiển thị cho khách (nền sàn, cây, người, thảm) | công tắc riêng ngoài menu | `PlanPresentPanel.tsx` · `plan-present-store.ts` | | 🟡 |
| C16 | **vùng chức năng (zone)** + mũi tên circulation, xuất sang Trình chiếu | tool `zone`/`arrow` | `ZonePanel.tsx` · `exportZoneMapToPresent` | `Doc` + handoff | 🟡 |
| C17 | **đường cam (campath)** cho video mặt bằng | tool `campath` | `CamPathPanel.tsx` · `CamPathControlPanel.tsx` · `lib/cad/campath.ts` | `Doc` layer `IF_CAMPATH` | 🟡 `campath.test.ts` khoá lõi; panel **đã wire** (khác trạng thái sổ cũ ghi "chưa wire") |
| C18 | **thả cấu kiện `.idfc` từ Thư viện vào bản vẽ** | kéo-thả | `LibraryDropBridge.tsx` | `Doc` | 🔴 **LỖ CHẶN đã đo (J14)**: cấu kiện thả ra **nét rời**, `specId` KHÔNG gắn được (`LibraryDropBridge.tsx:112`) ⇒ **không bao giờ lên BOQ, và BOQ cũng không báo lỗi** |
| C19 | **bảng vật liệu 2D** (hatch/màu theo `matId`) | `MaterialPalette.tsx` | `lib/cad/materials.ts` | `Doc` | 🟡 |
| C20 | **ba mode**: Sơ phác ↔ Kỹ thuật ↔ Nội thất; người dùng **tự bấm chọn**, lựa chọn thủ công thắng vai trò | dải mode | `lib/cad/store.ts:155-159` `shouldShowProTools` | `interiorflow.cad.mode` | 🟢 |
| C21 | **báo cáo quy chuẩn ra PDF** | Kiểm chuẩn | `CadEditor.tsx:2231` | tệp | 🟡 |
| C22 | **"Chỉnh lệnh vừa chạy"** (kiểu Blender F9), phím `F9` | sau khi chạy lệnh | `ChinhLenhVuaChay.tsx` · `lib/commands/chinh-lenh-store.ts` | | 🟡 |
| C23 | **đưa bản vẽ sang Trình chiếu** | menu Xuất | `toPresent` | `interiorflow.cadPresentHandoff` | 🟢 **J11 PASS 3/3 lượt** |

🔴 **Mồ côi trong mảng 2D**: `components/cad/DrawOnPreview.tsx` (304 dòng) · `RevitSummaryPanel.tsx`
(87 dòng) — 0 nơi import.

---

## 6 · `/projects/[id]/render` — THIẾT KẾ 3D

Ảnh `03-3d.png`: 406 ký tự, 67 nút. Route mount `HomeScreen projectRouteId` → `AppShell` →
`ModeShell`; panel nặng nạp lười qua `components/home/heavy-panels.tsx`.

**Hai lối thao tác, một bộ lệnh** (chốt 15/08): mode **Node** (`FlowCanvas`) ↔ mode **Vẽ 3D**
(`Render3DModeSkeleton` → `Viewport3D` + `Command3DPanel` + `ToolDock3D`).

| # | Việc | Vào bằng | Mã | Ghi ra đâu | Chứng minh |
|---|---|---|---|---|---|
| R3D1 | **dựng bảng node**: thêm · nối dây · nhân bản (`⌘D`) · gộp nhóm (`⌘G`) · undo/redo · fit view | canvas node | `FlowCanvas.tsx` · `lib/store.ts` | `Flow` qua `PUT /api/flows/[id]` có `expectedRev` | 🟢 J06 PASS (danh tính thực thể còn nguyên qua 3 phiên) · J18 PASS 409 |
| R3D2 | **chạy 51 loại node** — 4 input · 13 node AI có phí · 34 node 0đ | node · `⌘K` | `lib/nodes/registry.ts` (28) + `lib/nodes/defs/*.ts` (23) | kết quả vào `Flow` | 🟢 `lib/nodes/*.test.ts` (13 tệp) |
| R3D3 | **biết giá TRƯỚC khi chạy** + node `done` cache-skip không tính lại | mỗi node | `estimateRunCredit` | `/api/credits` | 🟡 |
| R3D4 | **báo rõ khi thiếu API key / mất mạng**, không trả hàng giả | chạy node cloud | `POST /api/jobs` → 503 `PROVIDER_NOT_CONFIGURED` | — | 🟢 **J22 PASS trên môi trường THẬT không có `FAL_KEY`** |
| R3D5 | **hàng đợi render**: xem tiến trình · huỷ · huỷ tất cả · thumbnail đổi sang ảnh kết quả · ETA chỉ hiện khi có job xong | `RenderQueuePanel` | `lib/render-studio/render-queue-store.ts` | | 🟡 nghiệm thu 15/08 bằng **4 job diễn tập 0 credit**; đường job THẬT chưa chạy sống |
| R3D6 | **dựng khối 3D bằng cử chỉ**: Đường · Chữ nhật · Vòng tròn · Tường · **Kéo mặt** · **Bo cạnh** · **Cắt khối** · Cùng loại · Thư viện · Vật liệu · Góc | `ToolDock3D` | `ToolDock3D.tsx` · `Viewport3D.tsx` | `Doc` (luật X1 — dựng ở 3D ghi vào cùng Doc) | 🟢 **J08 PASS trên app thật 04/09** |
| R3D7 | **xoá khối đã chọn** (`Delete`) | bàn phím | `Viewport3D.tsx` | `Doc` | 🟢 **J09 PASS sau khi vá** — trước đó FAIL, phím không nối registry |
| R3D8 | **ngăn xếp lệnh không phá huỷ (BuildRecipe)** — 10 phép: `extrude` `boolean` `arrayLinear` `arrayRadial` `mirror` `bevelEx` `taper` `sweep` `revolve` `loft`; bật/tắt từng bước, đổi thứ tự | `BuildRecipeSection` (`Command3DPanel.tsx:1282`) | `lib/cad/model.ts:490-513` · `lib/three/build-recipe.ts:93` | `Doc` + `.idfc` | 🟢 test `lib/three/*`; đã chạy thật (recipe `revolve` cho 4 chân ghế Lincoln, ghi ra `.idfc` nạp-lại-chỉnh-được) |
| R3D9 | **cửa sổ công cụ trên canvas** — cụm môi trường + vệ tinh, 3 nấc, kéo bằng chuột **và bàn phím**, đổi cỡ, mở nhiều cụm | node | `CuaSoCongCu.tsx` · `ThanCuaSoNode.tsx` · `ToolWindow.tsx` · `NutLenhVeTinh.tsx` | | 🟡 **lệnh trong vệ tinh MỜ HẾT — dây nối, chưa có dòng điện** (tự khai P-R). Bất biến "không đá nhau" **khoá bằng test**: `lenhDamChan(môi trường)` luôn rỗng |
| R3D10 | **hộp công cụ bám vật** trên node | chọn node | `HopCongCuBamVat.tsx` (`NodeToolbar` thật của xyflow) | | 🟡 mới có ở node `interior`, **chưa phủ** `NoteNode`/`MacroNodeFace` |
| R3D11 | **khung nhìn không bị cắt trên màn retina** | mở 3D | `Viewport3D` | | 🟢 J10 PASS |
| R3D12 | **cây đối tượng + inspector 3D**, chọn/ẩn/đổi thuộc tính | panel phải | `Object3DTree.tsx` · `Object3DInspector.tsx` | `Doc` | 🟡 |
| R3D13 | **xuất chuỗi PNG** từ camera (`captureSequence`) | `CameraExportTab` | `lib/three/capture-live.ts` | tệp | 🟡 — `CameraExportTab.tsx:189` từng **bịa 0%**, đã sửa qua `tuPhanSo` |
| R3D14 | **chiếu sáng**: đèn, hướng sáng, giờ trong ngày | `LightTab.tsx` | `Doc.lighting` · `lib/three/lighting.ts` | `Doc` | 🟡 |
| R3D15 | **quản lý tầng (level)** | `LevelManagerPanel.tsx` | `Doc.levels` | `Doc` | 🟢 `levels-idf-v2.test.ts` |
| R3D16 | **trích mặt cắt** từ khối 3D | `SectionExtractPanel.tsx` · `SectionPreviewOverlay.tsx` | | | 🟡 |
| R3D17 | **ghế 3D từ ảnh** (`.idfc` cờ 3 nấc per-trường) | node · Thư viện | `lib/idfc-import/chuan-net.ts` (4830 dòng) | `.idfc` | 🟢 proof sống 14/08 (Trellis 25s) |
| R3D18 | **empty state làm được việc tại chỗ** — "Đùn từ bản vẽ" · "Dựng khối đầu tiên" (luật X2: không màn nào chặn vì chưa làm bước trước) | 3D trống | `Render3DModeSkeleton.tsx:507` | | 🟢 ảnh 03 |

🔴 **Mồ côi trong mảng 3D/collab**: `components/collab/CuaSoThaoLuan.tsx` (334 dòng — **Cửa sổ
Thảo luận**, thứ đã chốt 16/08 là cửa sổ THẢO LUẬN không có cổng ra) · `components/collab/
LiveCursors.tsx` (70 dòng — con trỏ nhiều người, `FlowCanvas.tsx:710` ghi *"TẠM ẨN, phương án A đã
duyệt"*) ⇒ **`/api/cursors` chỉ còn 1 nơi gọi và mặt tiêu thụ thì tắt.**

---

## 7 · `/projects/[id]/present` — TRÌNH CHIẾU

Ảnh `04-trinh-bay.png`: 347 ký tự, 52 nút.

| # | Việc | Vào bằng | Mã | Ghi ra đâu | Chứng minh |
|---|---|---|---|---|---|
| P1 | **chọn 6 loại hồ sơ**: Deck · Bảng vật liệu A3 · BOQ · Schedule · Văn bản · Video | `PresentDocTypePicker.tsx:43` | | | 🟡 — `canCreateBlank` chỉ đúng cho `deck`/`material`; 4 loại kia chưa tạo trống được |
| P2 | **"＋ Tạo hồ sơ trống" luôn ở cuối**, tạo ngay không qua form | picker | `:291` | | 🟢 ảnh |
| P3 | **sửa bố cục**: kéo-thả · chọn nhiều · nhóm/bỏ nhóm · z-order · căn hàng · nhân bản · undo/redo | canvas | `EditorCanvas.tsx` · `lib/present-editor/align.ts` | IDB `<userId>::/present-editor::<projectId>` | 🟢 **J12 PASS** — 7 phần tử / 1 trang, đóng HẲN trình duyệt còn nguyên |
| P4 | **3 loại phần tử**: `image` · `text` · `shape` | thanh công cụ | `lib/present-editor/model.ts:20` | | 🟢 45 tệp test `lib/present-editor/` |
| P5 | **nhiều trang / slide**, sorter, strip, navigator | `SlideSorter` · `SlideStrip` · `PresentNavigator` | | `.idfp` `sheets[]` | 🟢 J21 |
| P6 | **xuất 7 đích**: PDF · PPTX (**chữ còn chỉnh được**) · PNG mỗi slide · `.idfp` toàn dự án · **PDF in 300dpi A3/A4** · PDF theo tờ giấy · **Gói Hồ Sơ `.zip` (Living Dossier)** | menu Xuất `Toolbar.tsx:627-660` | `lib/present-editor/export.ts` · `lib/pptx.ts` · `lib/ho-so-song/pack.ts` | tệp | 🟢 **J20 PASS + 3 phát hiện chuẩn đầu ra** (đã mở tệp ra soi bằng mắt) · 🟢 J21 PASS `.idfp` |
| P7 | **trình chiếu** (player), chuyển cảnh, reveal phần tử | `SlidePlayer.tsx` · `PresentViewer.tsx` · `lib/present-editor/motion-present.ts` | | | 🟡 |
| P8 | **Brand Kit theo dự án** áp vào footer/watermark/khung tên | `BrandKitPanel.tsx` | `lib/present-editor/brand-kit.ts` → IDB studio | IDB | 🟢 `brand-kit.test.ts` · `brand-kit-disk.test.ts` |
| P9 | **BOQ**: sinh từ Doc sống · nhóm theo tầng · **sửa tay từng ô (override)** · undo override · xuất `.xlsx` kèm ảnh · nhập `.xlsx` | `BoqScreen.tsx` | `POST /api/boq/[projectId]` · `boq-overrides.ts` · `boq-overrides-persist.ts` (IDB) · `lib/boq/xlsx.ts` | IDB + tệp | 🟢 **J14 PASS đầy đủ** — đơn giá 1 500 000 · hao 10% · thành tiền 1 650 000 khớp hàng CSDL |
| P10 | **phụ lục BOQ từ bản vẽ** | menu Nhập | `lib/present-editor/boq-appendix.ts` | | 🟢 `boq-appendix.test.ts` |
| P11 | **font người dùng nạp** + nhúng thật vào PDF/PPTX (chữ Việt có dấu) | `custom-fonts.ts` | `lib/pdf-font.ts` · `lib/pptx-font-embed.ts` · `lib/pptx-zip-fonts.ts` | IDB `interiorflow-fonts` | 🟡 lõi có test; **3 module này `soi:cam-dien` xếp "CHỈ NỘI BỘ"** |
| P12 | **thiết lập trang / khổ giấy** (A3/A4, ngang/dọc, màn hình/chiếu) | `ThietLapTrangDayDu.tsx` · `CongThietLapTrang.tsx` | | `.idfp` | 🟡 |
| P13 | **kệ bố cục** (25+ template, không còn trần) + **template tự lưu** | `LayoutShelf.tsx` (825 dòng) | `lib/present-editor/custom-templates.ts` | `interiorflow.customTemplates` | 🟢 `custom-templates.test.ts` |
| P14 | **cổng kiểm chuẩn đầu ra** trước khi xuất | tự động | `lib/present-editor/export-checks.ts` (marker `CHUAN_DAU_RA`) | | 🟢 `export-checks.test.ts`; 🔴 J20 ghi: lượt đầu **trang TRẮNG TINH đi qua với chữ PASS** — bộ soi nay đo mực |
| P15 | **nhập PDF vector → deck 3 lớp** (Nền · Ảnh · Chữ, chữ thật) | menu Nhập | `lib/present-editor/pdf-import.ts` · `/api/pdf/extract` | | 🟡 |
| P16 | **nhớ tờ đang mở** khi quay lại | tự động | `PresentSheets.tsx:397-644` | `interiorflow.resume` `sheetId` | 🟢 J12 |
| P17 | **liên kết nguồn** — phần tử biết mình đến từ đâu (provenance) | `NguonLienKet.tsx` | `lib/present-editor/linked-assets.ts` · `linked-asset-recipe.ts` | `.idfp` | 🟢 `linked-assets.test.ts` |

🔴 **J21 mở tệp ra soi thấy**: `.idfp` xuất ra có **14/14 ô chữ là placeholder `"Nhập nội dung"`**
và **0 ô có `x`/`y`**. Nạp lại đúng 14 phần tử (hợp đồng dữ liệu **lành**), nhưng nội dung thì
rỗng. Bản dựng lại **không được coi đây là đã xong**.

---

## 8 · `/materials` — KHO VẬT LIỆU

Ảnh `05-vat-lieu.png`: 1672 ký tự, 57 nút. Vỏ `AppShell active="render"`.

| # | Việc | Mã | Ghi ra đâu | Chứng minh |
|---|---|---|---|---|
| M1 | **liệt kê + lọc + tìm** vật liệu theo tên/hãng/loại | `MaterialsScreen.tsx:41-50` | `GET /api/specs` | 🟢 ảnh có dữ liệu thật |
| M2 | **thêm / sửa / xoá** vật liệu | `:179` `DELETE /api/specs/:id` · `MaterialFormModal.tsx` | `ProductSpec` | 🟡 |
| M3 | **nhập Excel/CSV** có bước ghép cột tay | `MaterialImportWizard.tsx` · `lib/materials/warehouse/column-mapping.ts` | `ProductSpec` | 🟢 `lib/materials/*.test.ts` (17 tệp) |
| M4 | **sửa thông số PBR** (14 thông số chuẩn glTF) — panel **TỰ SINH từ định nghĩa** (IF-RNA v0) | `MaterialPbrEditor.tsx` · `RnaPanel.tsx` · `lib/rna/material-pbr.rna.ts` | `if.materials.pbr.v1` → IDB studio | 🟢 chứng minh lan-1-chỗ trên app 14/08 (editor 332→299 dòng) |
| M5 | ⭐ **BA MẶT của một vật liệu** — thị giác (PBR) · thương mại (giá/NCC/hao hụt) · 2D (hatch/màu) — **một `matId`, không tách** | `getMaterial()` `lib/materials/resolve.ts:52`, **cắm điện tại** `MaterialsScreen.tsx:145` và `app/files/_lib/ngan-tho.ts:149` | | 🟢 `resolve.test.ts` 5 ca. **📌 Đính chính sổ: `00-CHOT` 17/08 ghi *"0 nơi gọi ngoài test"* — đo 05/09 thì nay CÓ 2 nơi gọi thật.** Vẫn 🟡 ở chỗ chưa hành trình nào đi xuyên ba mặt |
| M6 | **xem tác động khi đổi vật liệu** (impact preview) | `MaterialImpactPreview.tsx` | | 🟡 |
| M7 | **bảng màu là MỘT BƯỚC trong chọn vật liệu** (không phải trang riêng) | nút → `/colors` `:238` | `interiorflow.colorRegistry` → IDB studio | 🟡 — `/colors` đã thôi là trang độc lập |
| M8 | **quả cầu xem trước** vật liệu (three.js + RoomEnvironment PMREM, cache PNG) | `components/three/MaterialSphere.tsx` · `lib/three/material-preview.ts` | cache | 🟡 |
| M9 | **màn hỏng nói rõ lý do** (401 chưa đăng nhập · mất mạng · không quyền) thay vì trống câm | `:126-129` `lyDoHong` | | 🟢 |

---

## 9 · `/library` + `/library/gallery` + `/library/ingest` (+ `/library/knowledge`, `/inspiration`)

Ảnh `06-thu-vien.png` (1797 ký tự, 64 nút) · `07-gallery.png` (462 ký tự, 50 nút).

| # | Việc | Mã | Ghi ra đâu | Chứng minh |
|---|---|---|---|---|
| L1 | **trang tổng Thư viện** — đếm số món từng kệ, mở kệ | `LibraryOverview.tsx` | `GET /api/library` | 🟢 ảnh |
| L2 | **tấm Thư viện** (`⌘L`) mở ở **mọi chặng**, tự lọc theo ngữ cảnh | `LibrarySheet.tsx` · `lib/library/shelves.ts` (**30 kệ**: 5 cad · 4 render · 5 present · 6 chung · 5 theo loại · 5 phạm vi) | | 🟢 ảnh + `lib/library/*.test.ts` |
| L3 | **ba nấc cỡ thẻ** (122 · 168 · 232px), nhớ lựa chọn | `library-sheet-css.ts` | `if-library-card-size` | 🟡 |
| L4 | **kéo-thả món ra bản vẽ / canvas** | `LibraryDropBridge.tsx` · `Library3DApplyBridge.tsx` | `Doc` | 🔴 xem C18 — `specId` không gắn được |
| L5 | **nhập `.idfc` vào kho, sửa (nhập lại cùng `meta.code` để đè)** | `lib/library/idfc-store.ts` | IDB `studio::/studio-idfc` | 🟢 **J15 PASS đầy đủ, ba lần đóng app** |
| L6 | **xuất bản món lên kệ** (publish) + huy hiệu phạm vi | `PublishModal.tsx` · `ScopeBadge.tsx` | `POST /api/library` | 🟡 |
| L7 | **món này đang dùng ở đâu** (where-used) | `AssetWhereUsed.tsx` · `/api/project-asset-usage` | | 🟡 |
| L8 | **Gallery liên ngành** — lọc theo ngành · giấy phép · bộ sưu tập; **tự thêm nguồn** (chỉ sống cục bộ, không gửi đi đâu) | `GalleryLienNganh.tsx` | `GET /api/library` + `gallery_lien_nganh.local_state_v1` | 🟢 ảnh |
| L9 | **`/library/ingest`**: kéo-thả nhiều tệp (ảnh · pdf · xlsx · csv · dxf · dwg) → gắn mục dùng → **caption bằng AI** → xuất AI manifest / full JSON | `app/library/ingest/page.tsx` | **IndexedDB `saveManifest`** | 🔴 **LỆCH đã đo (J13)**: đường này **KHÔNG** sinh `LibraryAsset` và **KHÔNG** đặt byte nào lên đĩa — `grep '/api/library'` trong tệp đó = **0** |
| L10 | **`/inspiration`** → `POST /api/library`: **đây mới là đường sinh hàng DB + byte thật trong `uploads/`** | `app/inspiration/page.tsx` · `lib/gu/inspiration-facets.ts` | `LibraryAsset` + `uploads/` | 🟢 **J13 PASS đầy đủ**, hiệu chuẩn ĐỎ khi chặn `POST /api/library` |
| L11 | **gợi ý chiến lược / pick hình minh hoạ** ở ingest | `/api/strategy/scenarios` · `/api/illustration` | | 🟡 mỗi cái **1 nơi gọi duy nhất** |
| L12 | **Kho tri thức** — quy chuẩn ngành + tài liệu Sổ tay dự án | `app/library/knowledge/page.tsx` · `lib/library/knowledge.ts` | `registry.ts` + `/api/notebook/[id]/sources` | 🟡 |
| L13 | **nhận diện cấu kiện từ ảnh** (cờ 3 nấc measured/inferred/verified) | `NhanDienCauKien.tsx` · `lib/idfc-import/nhan-dien-cau-kien.ts` | `.idfc` | 🟢 test |

---

## 10 · `/tasks` — BẢNG VIỆC

Ảnh `08-viec.png`: 801 ký tự, 57 nút.

| # | Việc | Mã | Ghi ra đâu | Chứng minh |
|---|---|---|---|---|
| T1 | **xem bảng việc**, lọc theo dự án | `TaskBoardScreen.tsx` · `TasksNavigator.tsx` | `GET /api/tasks` | 🟢 ảnh |
| T2 | **tạo / sửa / đổi trạng thái** việc | `/api/tasks` + `/api/tasks/[id]` | `Task` · `WorkflowState` | 🟡 |
| T3 | **gán người** | `AssigneePicker.tsx` | `Task` | 🟡 |
| T4 | **biểu đồ Gantt** | `GanttChart.tsx` | | 🟡 |
| T5 | **nhớ dự án đang lọc** | | `if.tasks.projectId` | 🟡 |
| T6 | **đồng bộ Lark** (mirror chỉ-đọc) | `/api/lark-tasks` (+ `/sync`, `/[recordId]/status`) | `LarkTaskRef` | 🟡 — 2 nơi gọi |

⚠️ Cả mảng này **không có hành trình J nào** đi qua. `lib/tasks` có 5 tệp test cấp lõi. Đây là bề
mặt **rủi ro cao nhất khi dựng lại**: nhiều nút, ít bằng chứng.

---

## 11 · `/files` — HAI TẦNG

Ảnh `09-files.png`: **2711 ký tự**, 67 nút — bề mặt nhiều chữ thứ hai.

Cấu trúc (chốt 17/08 tối): **tầng ① thư mục hệ thống 5 loại có quyền** (Dự án · Studio dùng chung ·
Nhà cung cấp · Đã duyệt · Lưu trữ) → **tầng ② Collection+ 8 gói** mã `COL-<LOẠI>-NNN`.

| # | Việc | Mã | Ghi ra đâu | Chứng minh |
|---|---|---|---|---|
| F1 | **duyệt hai tầng**, cuộn dọc, tầng ② nối tiếp tầng ① | `_components/HaiTang.tsx` · `CollectionPlus.tsx` | | 🟢 ảnh |
| F2 | **ngăn phần thô** (map texture · NCC · **range giá**) — nội dung thư mục "Nhà cung cấp" | `_components/NganPhanTho.tsx` · `_lib/ngan-tho.ts` | | 🟡 |
| F3 | **tải tệp lên qua MỘT CỬA Format Router** — nhận diện định dạng, loại chưa chặng nào mở được thì **nói rõ lý do** | `FileManagerShell.tsx:388` → `lib/gateway/upload.ts#planUpload` | `POST /api/project-files` → `uploads/` | 🟡 |
| F4 | **xem lưới / danh sách**, nhớ lựa chọn | `:479-482` | `interiorflow.filemanager_g4.view_pref_v1` | 🟡 |
| F5 | **chọn nhiều** (⇧ dải · ⌘ rời) + **`Delete` xoá nhiều** | `:318`, `:439` | | 🟡 |
| F6 | **tải tệp về** | `:258` `a.download` | | 🟡 |
| F7 | **lọc theo loại** (chip) | `:558-560` | | 🟡 |
| F8 | **breadcrumb + vào/ra thư mục** | `:506-514` | `if.files.thumuc_v1` | 🟡 |
| F9 | **menu chuột phải** | `FmContextMenu.tsx` | | 🟡 |
| F10 | **tệp thật trên đĩa** trong thư mục người dùng đã cấp quyền (File System Access) | `refreshReal` `:328-353` · `lib/root-folder.ts` | đĩa | 🟡 |
| F11 | **promote**: `ProjectFile` → `LibraryAsset` | `POST /api/project-files/[id]/promote` · `lib/server/promote.ts` | `LibraryAsset` | 🟡 |
| F12 | **tệp nguồn dự án** + trạng thái | `TepNguonDuAn.tsx` · `tep-nguon.ts` · `tep-nguon-trang-thai.ts` | | 🟢 2 tệp test |

🔴 **DỮ LIỆU MẪU TRỘN VỚI DỮ LIỆU THẬT**: `FileManagerShell.tsx:181-185` gộp `mock` +
`session.uploaded` + `realFiles` vào **một danh sách**. Món mẫu có `REASON_MOCK_ONLY` = *"Đây là
dữ liệu mẫu minh hoạ, không có file thật để đổi/tải/xoá"* (`:62`). Bản dựng lại **phải giữ được sự
phân biệt này** — gộp mất là app nói dối về thứ nó đang giữ.

🔴 **Mồ côi**: `app/files/_components/HaiNgan.tsx` (172 dòng, **có test**) — bản "hai NGĂN" đã bị
đè bởi bản "hai TẦNG"; tệp giữ lại **có chủ ý** (`page.tsx:24` ghi rõ *"đừng dựng lại nó lần thứ
ba"*). Đây là loại **(b) ĐÃ BỊ THAY**, không phải (a) CHƯA CẮM.

---

## 12 · `/settings` (+ `/settings/avatar` · `/about` · `/licenses`)

Ảnh `10-cai-dat.png`: **5230 ký tự, 116 nút** — bề mặt dày nhất theo cả hai thước đo.

| # | Việc | Mã | Ghi ra đâu | Chứng minh |
|---|---|---|---|---|
| S1 | **đổi theme** (sáng/tối/hệ thống) | `AppearanceCard.tsx:35` `setThemePref` | `interiorflow.theme` | 🟢 ảnh |
| S2 | **đổi ngôn ngữ VI/EN** | `StorageCard.tsx:135` `setLang` | `interiorflow.lang` | 🟢 |
| S3 | **chọn thư mục gốc trên đĩa** + kiểm tra kết nối | `StorageCard.tsx:98,108` · `lib/root-folder.ts` | handle → IDB | 🟡 |
| S4 | **giảm chuyển động** (reduce-motion) | `:141` | | 🟡 |
| S5 | **bật/tắt backup tự động** | `:145` | | 🟡 |
| S6 | **đổi avatar** → `/settings/avatar` | `ProfileCard.tsx:39` · `AvatarBuilder.tsx` (311) + `AvatarRenderer.tsx` (1271) | `/api/user/avatar` | 🟡 |
| S7 | **hình nền canvas** | `CanvasWallpaper.tsx` · `lib/wallpaper/*` | `interiorflow.canvas_wallpaper_v1` | 🟢 dùng chung với Home |
| S8 | **xem trạng thái provider AI** (server thấy biến môi trường; **không secret nào qua client**) | `AiTiersCard.tsx` · `/api/health` | không ghi | 🟢 J22 gián tiếp |
| S9 | **chọn tầng AI** (cloud ↔ Ollama ↔ …) | `AiTiersCard` · `lib/ai/text-tier.ts` | `interiorflow.aiTier` · `oneAiEngine` · `oneAiRuntime` | 🟡 |
| S10 | **lối vào nâng cao** → `/materials` `:76` · `/tasks` `:103` · `/settings/licenses` `:128` · `/settings/about` `:141` | | | 🟢 ảnh — **đây là lối vào DUY NHẤT tới Bảng việc và Kho vật liệu ngoài URL trực tiếp** |
| S11 | **đơn vị đo + tỉ lệ cấp app** | `UnitsScaleSettings.tsx` · `lib/units/*` | `interiorflow.units_v1` | 🟡 |
| S12 | **tích hợp** (Google · Zalo · Zoom · Team · Lark) — kết nối/ngắt/trạng thái/lịch | `/api/integrations/*` (6 route) · `lib/integrations/providers/*` | | 🔴 **4/5 provider mồ côi**: `lark-write.ts` · `google.ts` · `zalo.ts` · `zoom.ts` · `team.ts` đều 0 nơi gọi |

🔴 **Mồ côi trong mảng cài đặt**: `components/settings/AccountSettings.tsx` (70) ·
`AppearanceSettings.tsx` (63) · `StorageSettings.tsx` (134) — bản cũ, đã bị `_components/*Card.tsx`
thay. Loại **(b) ĐÃ BỊ THAY** — cần đóng dấu lỗi thời tại chỗ, không bỏ hoang.

---

## 13 · BỀ MẶT **NGOÀI PHẠM VI PHIẾU** — ghi để không ai tưởng là không có

Phiếu liệt kê 9 bề mặt. Repo có **28 route trang**. Phần dưới đây **chưa được kiểm kê chi tiết**;
đập giao diện mà quên chúng vẫn là đánh rơi năng lực.

| Route | Sống? | Việc chính |
|---|---|---|
| `/projects` | 🟢 sổ dự án toàn cục (chốt 22/08) | liệt kê mọi dự án |
| `/projects/[id]/overview` | 🟡 | tổng quan một dự án · `/api/projects/[id]/overview`, `/profile`, `/site`, `/dna`, `/members` |
| `/projects/[id]/notebook` | 🟡 | Sổ tay dự án — nạp nguồn, hỏi RAG (`lib/notebook/rag.ts`, 14 import) |
| `/projects/[id]/photo` | 🟡 | trình chỉnh ảnh (`components/photo-editor/`, `DocCanvas` · `LayersPanel`) |
| `/inspiration` | 🟢 **J13 PASS** | Cảm hứng → Design DNA → apply-intent |
| `/library/knowledge` | 🟡 | kho tri thức |
| `/colors` | ⚠️ **thôi là trang** (chốt 16/08: màu là một BƯỚC trong vật liệu) | |
| `/share/[token]` | 🟡 | xem chia sẻ qua link · `/api/share/*` |
| `/workhub` | 🔴 **vi phạm kiến trúc đang sống** | `WorkHubShell.tsx:140` `submitMessage()` nối **câu trả lời gõ cứng**, `grep "fetch("` = **0**, mà mặt đó **tự xưng là trợ lý** và khẳng định *"đang dùng ngữ cảnh từ…"* trong khi không đọc pane. Trái chốt 04/09 *"trong IF, mặt AI là Vitals"*. **Phải gỡ, không phải dựng lại** |
| `/login` · `/intro` | 🟢/🟡 | J01 · J02 **UNVERIFIED** trên bản đóng gói |
| `/cad-editor` · `/present-editor` · `/photo-editor` | 🟢 redirect | **J23 PASS** — bookmark cũ về đúng dự án, không loé Home |
| `/dev-bench-3d-2` | ⚠️ bench tạm, **tự khai không phải sản phẩm** | |

---

## 14 · TỔNG HỢP DÂY CHƯA CẮM — phát hiện đắt nhất của bản này

`npm run soi:cam-dien` (chạy 05/09) đếm **43 tệp mồ côi · 6871 dòng** (lib 19 · components 23 ·
app 1) + **1 module kho-chưa-mở** + **9 module chỉ-nội-bộ**.

⛔ **MỒ CÔI ≠ RÁC.** Ba loại khác hẳn — máy **không** phân loại hộ:
**(a) CHƯA CẮM** phải cắm · **(b) ĐÃ BỊ THAY** phải đóng dấu lỗi thời tại chỗ · **(c) MÁY ĐO SAI**
phải siết máy.

### 14.1 · Loại (a) — CHƯA CẮM, năng lực đã xây mà chưa ai chạm được

| Thứ | Dòng | Việc bị mất |
|---|---|---|
| 🔴 `lib/slide-templates.ts` | 229 | bộ preset trình bày — **0 nơi gọi ở mọi hướng** (ui 0 · lib 0 · phụ 0 · test 0) |
| 🔴 `POST /api/manufacturer-import` + `/apply` | — | nhập catalog hãng hàng loạt (lõi + test có, **không mặt nào gọi**) |
| 🔴 `POST /api/atlas-materials/sync` | — | đồng bộ vật liệu ATLAS |
| 🔴 `/api/organizations/[id]` + `/members` | — | quản lý tổ chức |
| 🔴 `lib/integrations/providers/` × 5 (`lark-write` · `google` · `zalo` · `zoom` · `team`) | 177 | 5 tích hợp có provider mà **không đường nào gọi** |
| 🔴 `lib/ai/web-lookup.ts` | 356, có test | tra web cho Vitals |
| 🔴 `lib/ui/design-tokens.ts` | 304, có test | đọc `globals.css` thành bảng token — **đúng thứ đợt dựng lại cần** |
| 🔴 `lib/cad/chuan-nap.ts` | 181, có test | |
| 🔴 `lib/wallpaper/contrast.ts` | 177, có test | kiểm tương phản nền — **đúng thứ luật kính/nền đang cần** |
| 🔴 `lib/capabilities/vitals-eval-harness.ts` | 122, có test | |
| 🔴 `lib/voice/sang-ghi-chu.ts` | 61, có test | giọng nói → ghi chú |
| 🔴 `lib/lighting/lux.ts` | 136 | tính lux — chỉ `lib/review/luat/rules-3d.ts` gọi, **chưa lên mặt nào** |
| 🔴 `components/collab/CuaSoThaoLuan.tsx` | 334 | **Cửa sổ Thảo luận** (moodboard · khung tư duy) — chốt 16/08, dựng xong, không mount |
| 🔴 `components/collab/LiveCursors.tsx` | 70 | con trỏ nhiều người — `FlowCanvas.tsx:710` *"TẠM ẨN"* |
| 🔴 `components/ui/BeMatNoi.tsx` | 432 | bề mặt nổi dùng chung |
| 🔴 `components/ui/SoCucBo.tsx` · `VanhTrangThai.tsx` · `MucNenDan.tsx` · `HienDan.tsx` · `TruthBadge.tsx` | 652 | 5 nguyên liệu UI, `TruthBadge` **có test** |
| 🔴 `components/cad/DrawOnPreview.tsx` | 304 | vẽ lên ảnh xem trước |
| 🔴 `components/cad/RevitSummaryPanel.tsx` | 87 | |
| 🔴 `components/notebook/NotebookButton.tsx` | 51 | lối vào Sổ tay |
| 🔴 `components/intro/TitleSequence.tsx` | 380 | |

### 14.2 · Loại (b) — ĐÃ BỊ THAY (giữ lại có chủ ý, **đừng dựng lại**)

`components/home/DongStudioHome.tsx` (900) + cây con của nó (`ProjectSelect` · `BeMatHome` ·
`LivingCanvas` · `ProjectOverviewCard` · `BatDauNgaySoKhong` + 8 widget) ·
`components/studio/StageSwitcher.tsx` (462, *"trục điều hướng duy nhất"* — **câu đó nay lỗi thời**,
docstring **chưa** đóng dấu) · `components/studio/VitalsRightEdgeHost.tsx` (43, **chưa từng mount**)
· `components/home/widgets/VitalsPill.tsx` (87) · `components/LoginScreen.tsx` (289 — bản sống là
`components/entry/LoginScreen.tsx`) · `components/StageSelect.tsx` (217) ·
`components/settings/{AccountSettings,AppearanceSettings,StorageSettings}.tsx` ·
`components/nav/NguCanhDuAn.tsx` (119, gỡ khỏi rail 23/08) · `app/files/_components/HaiNgan.tsx`
(172).

### 14.3 · Loại (c) — máy đo đúng nhưng đúng bản chất

`lib/site/index.ts` · `lib/auth/index.ts` · `components/site/index.ts` (barrel) ·
`lib/idfc-seed/seed.ts` · `lib/cad/shape-mocks.ts` (đồ nghề test).

---

## 15 · Ô KẾT

**VẤN ĐỀ.** Hoà chốt đập giao diện. `§B25` cho phép đập bố cục nhưng cấm đánh rơi năng lực — mà
trước bản này **không có danh sách năng lực nào để đối chiếu**, nên "đánh rơi" là chuyện không ai
phát hiện được cho tới khi người dùng kêu. Đó chính là hình dạng của *"xong rồi lại sửa, rồi lại
lặp lại vòng lặp"*.

**GIẢI PHÁP.** Một bản kiểm kê ở **mức hành vi**, mỗi dòng kèm `tệp:dòng`, nơi ghi dữ liệu, và
**nhãn chứng minh ba bậc** phân biệt rõ *chạy thật* ↔ *có mã* ↔ *chưa cắm dây*. Bản này thành
**danh sách nghiệm thu**: bề mặt mới chỉ qua khi mọi dòng của nó vẫn làm được, hoặc có dòng ghi
"cố ý bỏ, Hoà duyệt ngày…".

**RỦI RO.** Bản kiểm kê **nói dối thì nguy hiểm hơn không có** — vì nó sẽ được dùng làm cửa nghiệm
thu. Rủi ro lớn nhất là ghi 🟢 cho thứ chỉ đọc mã mà suy; đã chống bằng cách chỉ ghi 🟢 khi có
hành trình J đã chạy trên app thật hoặc test khoá đúng hành vi. Rủi ro thứ hai: **89 dòng 🟡 là
mảng lớn nhất** — nghĩa là phần lớn app *chưa ai chạy đầu-cuối lần nào*.

**ĐẠT ĐƯỢC.** **130 năng lực** đếm được trên 9 bề mặt + 3 nhóm cắt ngang, chia theo bậc chứng minh:

| | | |
|---|---|---|
| 🟢 **CHẠY THẬT** | **67** | có hành trình J đã chạy trên app thật, hoặc test khoá đúng hành vi |
| 🟡 **CÓ MÃ, CHƯA CHỨNG MINH** | **59** | đường dây đủ, **chưa ai chạy đầu-cuối** — 45% của app |
| 🔴 **DÂY CHƯA CẮM / có lỗ chặn** | **4** | C18 · L4 (`specId` không gắn được) · L9 (ingest không sinh `LibraryAsset`) · S12 (5 provider mồ côi) |

Ngoài bảng: 43 tệp mồ côi (6871 dòng) phân thành ba loại có thể hành động; 3 endpoint và 5
provider tích hợp lộ ra là **chưa từng có mặt tiêu thụ**; một cây con Home 900+ dòng đã chết mà
kéo theo **`/api/home/notes` mất mặt tiêu thụ duy nhất**; và hai đính chính cho sổ (`getMaterial`
**đã** được cắm điện; `⌘J` **đã** sống lại ở `VitalsAperture.tsx:419`).

⚠️ **Năm dòng mang hai nhãn** (đọc theo nhãn ĐẦU): R5 · C5 · P6 · P14 · M5 — phần sau nhãn đầu là
phần *cùng năng lực đó nhưng nhánh khác chưa chứng minh*.

---

## ⑦b · CHƯA CHẮC / CHƯA KIỂM — khai đủ, kể cả ô trống

1. **Không mở app bấm một nút nào.** Toàn bộ bản này là **đọc mã + đọc bằng chứng có sẵn** (12 ảnh
   05/09 · `JOURNEY-MATRIX` · 457 tệp test · `soi:cam-dien`). Phiếu cấm sửa mã, không cấm chạy —
   nhưng chạy đầu-cuối 130 hành vi vượt xa một lượt kiểm kê. ⇒ **Mọi dòng 🟡 nghĩa đen là "tôi
   chưa thấy nó chạy"**, không phải "nó hỏng".
2. **Con số 130 là SÀN, không phải trần.** Nó là số dòng tôi viết ra, không phải số hành vi app
   có. Bốn nguồn bỏ sót đã biết: ① 6 bề mặt ở §13 chưa kiểm kê chi tiết ② menu chuột phải và
   context menu hầu như chưa mở ③ trạng thái lỗi/rỗng của từng panel ④ hành vi bên trong 51 node.
3. **`grep` mù ba dạng**: ghép chuỗi động (`const p='Vitals'+'Pill'`), `import()` động ngoài
   `heavy-panels`, và component gọi qua map/registry theo khoá chuỗi. ⇒ danh sách mồ côi ở §14 là
   **sàn**; và ngược lại, có thể có tệp bị **oan** (được gọi qua đường tôi không thấy).
4. **`soi:cam-dien` tự khai 4 đường dẫn nó không giải nổi** (`./scripts/foundation-tran.json` ·
   `../cad/idfc` · `./types` · `./store`) và **18 entry dùng mẫu quét cả cây**. Số 43 mồ côi mang
   theo mức mù đó.
5. **Không đếm được đủ khoá localStorage.** Hai lượt grep (literal trong lời gọi + hằng số) ra
   ~78 khoá; khoá dựng động theo `userId`/`route`/`bucketId` (`interiorflow.resume.<userId>`,
   `<userId>::<route>::<bucketId>`) **không đếm được bằng grep**, chỉ mô tả được hình dạng.
6. **Không kiểm tra `.idf`/`.idfc`/`.idfp` thật nào bằng mắt.** Kết luận về hợp đồng dữ liệu dựa
   vào hằng số phiên bản, bảng nâng cấp và test — **không mở tệp người dùng ra soi**. J20/J21 đã
   cho thấy tệp "hợp lệ" vẫn có thể **trắng tinh** hoặc **toàn placeholder**.
7. **`JOURNEY-MATRIX` là bằng chứng mượn.** Tôi không chạy lại J01–J23; tôi trích trạng thái nó
   ghi. Nếu ma trận đó lệch thì bản này lệch theo. Nó tự khai `hạn dùng`: các hàng PASS gắn mốc
   `a64c0248`/04-05/09, còn cây này ở `af381ac6` — **có commit ở giữa mà tôi chưa đối chiếu**.
8. **Ba route API "0 nơi gọi" chỉ đo phía client.** Chúng có thể được gọi từ `electron/`, script,
   webhook, hoặc bằng tay — tôi không quét `electron/` và `scripts/`.
9. **Nhãn 🟢 cho phím tắt là yếu nhất trong bản này.** Tôi xác minh **nơi đăng ký**, không xác minh
   **phím bấm ra kết quả**. Ca `Delete` ở 3D (J09) chứng minh đúng chỗ này gãy được mà không ai
   biết: sổ khai có, `registry` có, mà đường bàn phím thì không nối.
10. **Không đánh giá chất lượng, không đánh giá thẩm mỹ, không xếp ưu tiên.** Bản này chỉ nói
    *"cái này đang làm được"*, không nói *"cái này đáng giữ"*. Quyết định giữ/bỏ là của Hoà.
