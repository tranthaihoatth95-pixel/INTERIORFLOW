# MA TRẬN HÀNH TRÌNH NGHỀ — cổng G2

> Lập 04/09 tại mốc `a64c0248` (`origin/integration/2026-09-04`).
> Chủ sở hữu tài liệu: **lane 02 · WORKFLOW**.
>
> **Ma trận này KHÔNG phải bản audit route.** Nó không đi qua 28 trang và 81 route API một cách
> đều tay. Nó chỉ lấy **tập nhỏ nhất các hành trình đi xuyên đồ thị sản phẩm** — mỗi hành trình là
> một đường mà nếu đứt thì người dùng mất việc, chứ không phải một màn hình bị xấu.
>
> **Luật trạng thái, không có ngoại lệ:**
>
> | | |
> |---|---|
> | **PASS** | có bằng chứng **đã chạy thật**, ghi rõ bằng chứng nằm ở đâu |
> | **UNVERIFIED** | chưa ai chạy đầu-cuối. Mã có thể đúng — nhưng chưa ai biết |
> | **BLOCKED** | biết chắc hỏng, có `tệp:dòng` |
>
> ⛔ **Cấm ghi PASS bằng suy luận từ mã.** Đọc mã thấy hợp lý ⇒ vẫn là `UNVERIFIED`.
> ⛔ **Ảnh chụp màn KHÔNG phải PASS.** `scripts/audit-routes.mjs` chứng minh *trang có dựng lên*,
> không chứng minh *việc có sống qua tải lại*. Hai thứ khác hẳn nhau.
> ⛔ **Không nhân bản thứ test cấp thấp đã chứng minh.** Chỗ nào test đơn vị đã khoá thì ghi con
> trỏ tới nó, không dựng lại kịch bản.

---

## 0 · ĐỌC MA TRẬN NÀY THẾ NÀO

**Hành trình ≠ màn hình.** Một hành trình luôn có **đích đến đo được**, và đích đó gần như luôn là
*thứ vừa làm có còn không sau khi mở lại*. Vì vậy mỗi dòng có hai cột kết quả tách bạch:

- **KẾT QUẢ HỆ THỐNG** — chuyện xảy ra ngay lúc thao tác (màn đổi, khối hiện ra, panel mở).
- **KẾT QUẢ ĐÃ LƯU** — chuyện còn lại **trên đĩa** sau đó. Đây mới là thứ chặn phát hành.

Rất nhiều bề mặt của IF *xanh ở cột thứ nhất và trống ở cột thứ hai*. Đó chính là hình dạng của
rủi ro hiện tại, và là lý do ma trận này tách hai cột thay vì gộp thành một chữ "hoạt động".

**Bốn chiều bắt buộc xét, không chỉ chiều tiến:**

| Chiều | Câu hỏi | Vì sao dễ rơi |
|---|---|---|
| **TIẾN** | làm được việc không | ai cũng thử chiều này |
| **LÙI** | hoàn tác / thoát giữa chừng có sạch không | ít ai thử |
| **MỞ LẠI** | đóng app mở lại còn không | chỗ mất dữ liệu sống |
| **SỬA LẠI** | mở thứ cũ sửa tiếp có giữ gia phả không | chỗ hợp đồng dữ liệu gãy |
| **VÀO THẲNG** | deep-link / tab mới / F5 | **chỗ đang có lỗi P0** |

---

## 1 · MA TRẬN

Ký hiệu chủ sở hữu: `01` CORE · `02` WORKFLOW · `04` DESIGN · `05` ASSET · `07` RELEASE.

### 1.1 · Vào app và định danh

| # | KHỞI ĐIỂM | THAO TÁC | KẾT QUẢ HỆ THỐNG | KẾT QUẢ ĐÃ LƯU | VÀO LẠI | TRẠNG THÁI | CHỦ | CHẶN CỔNG |
|---|---|---|---|---|---|---|---|---|
| **J01** | máy sạch, chưa có tài khoản | mở app → `/login` → đăng ký | User vào DB | `User` + cookie phiên | đóng/mở app còn đăng nhập | **UNVERIFIED** — chưa ai chạy trên **bản đóng gói**. Đường này mới chỉ được chạm gián tiếp qua `scripts/tai-khoan-kiem.mjs`, vốn tự khai là *đồ nghề, không phải tính năng* | 01 | **G5** |
| **J02** | đã đăng nhập | thoát app → mở lại | vào thẳng, không hỏi lại | cookie ký bằng `AUTH_SECRET` | — | **UNVERIFIED** — `AUTH_SECRET` sinh-ngẫu-nhiên-rồi-persist ở `electron/main.js:215-222`. Rủi ro thật chưa ai đo: nếu ghi `config.json` thất bại (ổ chỉ-đọc — nhánh `catch` rỗng ở `:224-226`) thì **mỗi lần mở app là một secret mới ⇒ đăng xuất âm thầm mỗi lần khởi động** | 01 | **G5** |
| **J03** | hai người dùng chung một máy | A đăng xuất → B đăng nhập | B vào được | ⚠️ **đệm định danh của A không bị rửa** | tab cũ của A có thể ghi vào bucket của A | **BLOCKED** — `PRODUCT-DEFECTS.md` **D3**: `AccountSettings:54` · `AccountMenu:137` · `MobileMenu:160` · `PixelSettingsShell:191` chỉ xoá cookie, **không chỗ nào xoá `lastUserId`**; `danh-tinh-phien.ts:82-83` trả `da-co` mà không xác thực lại | 01 | không chặn bản một-người-một-máy; **chặn** bản dùng chung máy |

### 1.2 · Dự án và Home

| # | KHỞI ĐIỂM | THAO TÁC | KẾT QUẢ HỆ THỐNG | KẾT QUẢ ĐÃ LƯU | VÀO LẠI | TRẠNG THÁI | CHỦ | CHẶN CỔNG |
|---|---|---|---|---|---|---|---|---|
| **J04** | Home rỗng | tạo dự án mới | ✅ dự án + bản vẽ sinh thật | ✅ `Project` 5 → **6** · `Flow` **6** (đọc bằng SQL) | ✅ **đóng HẲN trình duyệt rồi mở lại vẫn thấy** | **PASS trên app thật 04/09** (`--ca=J04`) sau khi đóng **D-J04a** (xem §1.7). Hành trình đầy-đủ: Home → *"Tạo dự án mới"* → **bảng khởi tạo dự án** → *"Tạo dự án"* → URL nhảy sang `/projects/<id>/render`. Hiệu chuẩn nay **hết thoái hoá**: chặn `POST /api/flows` ⇒ ĐỎ, thế giới lành ⇒ XANH | 04 + 02 | **G2** |
| **J05** | Home có việc dở | bấm thẻ Resume | ✅ nhảy đúng chặng đang dở | ✅ `interiorflow.resume.<userId>` đọc thẳng từ localStorage (route + flowId) | ✅ **đóng HẲN trình duyệt rồi mở lại, thẻ vẫn trỏ đúng đường đó** | **PASS trên app thật 04/09** (`--ca=J05`). Sửa: thẻ tiêu điểm nay bấm được CẢ THÂN qua lớp phủ `<Link>` (`XuongHome.tsx` `.mo-lai`), lời hứa ở chân thẻ và đường dây dùng CHUNG một nguồn `duongMoLai()` (`lib/home/the-tieu-diem.ts`) nên không còn trạng thái hứa-mà-không-làm. **Đo bằng BÀN PHÍM THUẦN**: Tab 19 lần tới lớp phủ · ring `2px solid rgb(106,87,245)` (= `--focus-ring`) · Enter → `/projects/<id>/cad`. Hiệu chuẩn hai tầng: chặn ghi resume ⇒ ĐỎ · gỡ hẳn lớp phủ trong mã ⇒ ĐỎ ở đúng khẳng định trung tâm · cắm lại ⇒ XANH | 04 + 02 | **G2** |
| **J06** | dự án đã có | mở lại dự án cũ, sửa tiếp | tải lại doc, sửa được | ✅ **1 → 2 thực thể** trong IndexedDB | ✅ **TOÀN BỘ ID của lần trước còn nguyên** | **PASS trên app thật 04/09** (`--ca=J06`) — ba phiên gói trong khuôn hai phiên: vẽ nét A → đóng hẳn → mở lại vẽ nét B → đọc lại. **Điểm đo là DANH TÍNH, không phải số đếm**: xoá sạch rồi vẽ lại hai nét cũng làm số tăng, và đó đúng là *đứt gia phả*. Ghi đè có kiểm `rev` vẫn do `app/api/flows/[id]/route.test.ts` khoá (Prisma thật, P2025) | 02 | **G2** |

### 1.3 · Ba chặng nghề

| # | KHỞI ĐIỂM | THAO TÁC | KẾT QUẢ HỆ THỐNG | KẾT QUẢ ĐÃ LƯU | VÀO LẠI | TRẠNG THÁI | CHỦ | CHẶN CỔNG |
|---|---|---|---|---|---|---|---|---|
| **J07** | `/projects/[id]/cad` | vẽ 2D → lưu | nét vào doc | ✅ **hàng `ProjectFile` `ban-ve.sao-luu.idf`** — parse lại ra đúng số thực thể | ✅ **XOÁ SẠCH hồ sơ trình duyệt rồi mở lại: nét quay về đúng ID cũ** | **PASS trên app thật 04/09** (`--ca=J07`). 🔴 **Cột ĐÃ LƯU của hàng này ghi sai từ đầu**: bản vẽ **KHÔNG** đi qua `Flow` — `grep "api/flows"` trong `components/cad/` + `lib/cad/` = **0**; đường thật là `lib/cad/luu-len-may-chu.ts` → `POST /api/project-files`, nhịp 30s, và lưới đỡ khôi phục ở `components/cad/CadSheets.tsx:458`. Vì thế J07 mạnh hơn J16: J16 mở lại **cùng hồ sơ** (chứng minh IndexedDB), J07 **xoá hồ sơ** nên sự thật chỉ có thể đến từ máy chủ | 02 | **G2** |
| **J08** | chặng 3D | dựng khối bằng cử chỉ | khối hiện trong khung nhìn | — | — | **PASS** — chạy trên app thật 04/09: `docs/bao-cao-phien/2026-09-04-kiem-app-that-3d-present.md` mục 1 | 02 | **G2** |
| **J09** | chặng 3D, có khối | chọn khối → `Delete` | khối bị xoá | — | — | **PASS sau khi vá** — cùng báo cáo mục 2. **Trước khi vá là FAIL**: đường bàn phím không nối lệnh registry (`components/three/Viewport3D.tsx`). Đây là **ca thứ hai cùng một gốc** với ⌘Z ⇒ chiều **LÙI** của 3D là vùng đã gãy hai lần, đáng nghi nhất khi mở rộng kiểm | 02 | **G2** |
| **J10** | chặng 3D trên màn retina | mở khung nhìn | không bị cắt | — | — | **PASS** — cùng báo cáo mục 3 | 04 | cổng thị giác |
| **J11** | có bản vẽ 2D | đưa bản vẽ sang Trình bày | trang Trình bày nhận đúng bản vẽ | — | — | **PASS 3/3 lượt** — cùng báo cáo mục 4. ⚠️ Bản FAIL 9/10 trước đó là **hiện vật của bộ đo**, không phải lỗi sản phẩm; giữ lại vì chính nó dẫn tới rủi ro J16 | 02 | **G2** |
| **J12** | chặng Trình bày | sửa bố cục → lưu → mở lại | trang nhận nội dung | ✅ **`userId::/present-editor::projectId`, 7 phần tử / 1 trang** — đọc từ IndexedDB, không đọc chữ trên màn | ✅ **đóng HẲN trình duyệt rồi mở lại: còn nguyên 7** | **PASS trên app thật 04/09** (`--ca=J12`). Payload là `deck.slides[].elements[]` (`components/present-editor/PresentSheets.tsx:426`), KHÔNG phải `doc.entities` như chặng Vẽ. ⚠️ Đường vào phải đi vòng lỗi chặn D-J04b (xem §1.7) | 02 | **G2** |

### 1.4 · Vật liệu · thư viện · tài sản

| # | KHỞI ĐIỂM | THAO TÁC | KẾT QUẢ HỆ THỐNG | KẾT QUẢ ĐÃ LƯU | VÀO LẠI | TRẠNG THÁI | CHỦ | CHẶN CỔNG |
|---|---|---|---|---|---|---|---|---|
| **J13** | `/library/ingest` | nhập tệp thô → gắn định nghĩa → lưu vào thư viện | asset có định nghĩa | `LibraryAsset` + tệp trên đĩa | mở lại còn tệp | **UNVERIFIED** đầu-cuối; tầng ghi có khoá riêng: `lib/server/library-save.test.ts` · `lib/server/mime-sniff.test.ts` | 05 | **G5** (mục *tài sản*) |
| **J14** | dự án đang mở | dùng một vật liệu → xuất BOQ | số trong BOQ khớp vật liệu | `ProductSpec.matId` | — | **UNVERIFIED**; kèm **nợ dữ liệu đã biết**: hàng cũ chưa có `matId`, phải chạy `scripts/backfill-material-matid.ts` (mặc định dry-run) — `SHIP-BLOCKERS` xếp **P3** | 05 + 07 | **G5** |
| **J15** | thư viện | mở lại một `.idfc` đã lưu, sửa, ghi lại | — | — | — | **UNVERIFIED** đầu-cuối. **Không dựng lại** phần đã khoá: `lib/library/idfc-store.test.ts` · `lib/idfc-import/part-lock.test.ts` · `lib/idfc-import/chuan-net.test.ts` · `lib/idfc-import/asset-family.test.ts` | 05 | **G5** |

### 1.5 · Lưu · tải lại · vào thẳng — vùng rủi ro nặng nhất

| # | KHỞI ĐIỂM | THAO TÁC | KẾT QUẢ HỆ THỐNG | KẾT QUẢ ĐÃ LƯU | VÀO LẠI | TRẠNG THÁI | CHỦ | CHẶN CỔNG |
|---|---|---|---|---|---|---|---|---|
| **J16** | **đã đăng nhập**, mở **thẳng** deep-link studio (tab mới · bookmark · F5) | làm việc | màn hiện bình thường | ✅ **`userId::/cad-editor::projectId`, 1 thực thể** — đọc từ IndexedDB, không đọc chữ trên màn | ✅ **đóng HẲN trình duyệt rồi mở lại: còn nguyên** | **PASS trên app thật 04/09** — bộ chạy `scripts/nghiem-thu-g2-hanh-trinh.mjs` (hồ sơ Chromium trên đĩa = máy người dùng; đóng bối cảnh = đóng app). Bằng chứng: `docs/bao-cao-phien/2026-09-04-g2-chay-that.md` · ảnh `anh-duyet-mat/g2-hanh-trinh/J16-*.png`. Bản vá D1 nay có người nhìn: **0 khoá mơ hồ**, không rơi về `local`/rỗng | 01 | **G2 + G5** |
| **J16b** | **đã đăng nhập**, mở **thẳng** deep-link studio rồi **về Home** | không thao tác gì | màn hiện bình thường | ✅ **`interiorflow.resume.<userId>` mang ĐỦ `flowId`** — đọc từ localStorage, không đọc chữ trên màn | ✅ **đóng HẲN trình duyệt rồi mở lại: vẫn đủ** | **PASS trên app thật 04/09** (`--ca=J16b`). Tách khỏi J16 **có lý do đo được**: thế giới hỏng của J16 là *chặn IndexedDB*, ở đó khẳng định IDB đỏ TRƯỚC nên khẳng định `flowId` **không bao giờ chạy tới** ⇒ hiệu chuẩn của J16 không chứng minh được khẳng định đường-quay-lại. J16b có thế giới hỏng RIÊNG (`chanResume`). Đóng **D6**: trước vá, resume ghi ra `{route,sheetId}` thiếu `flowId` ⇒ thẻ tiêu điểm dội về `/` | 01 | **G2** |
| **J23** | **đã đăng nhập**, mở **bookmark route cũ** `/cad-editor` (không ghé Home, không ghé deep-link trước) | không thao tác gì | ✅ **cầu chuyển hướng đưa thẳng tới `/projects/<id>/cad`**, và đo bằng `framenavigated` nên biết **không loé Home** dọc đường | ✅ **`interiorflow.resume.<userId>` đủ `flowId`** — điều kiện để cầu đọc ra đích | ✅ **đóng HẲN trình duyệt, mở lại với bộ đệm định danh NGUỘI: vẫn về đúng dự án** | **PASS trên app thật 04/09** (`--ca=J23`). Đóng **D7** — đường **ĐỌC**, khác hẳn J16b (đường **GHI**): D7 là ca resume ĐÃ ĐỦ trên đĩa mà cầu vẫn dội về `/?notice=choose-project`, tức **J16b xanh trong khi người dùng vẫn không vào được việc của mình**. Hiệu chuẩn hai lớp: thế giới `chanResume` ĐỎ, **và** gỡ bản vá ra thì ĐỎ đúng khẳng định lượt-hai. ⚠️ Lượt hai **cố ý xoá `interiorflow.lastUserId`** để dựng đúng trạng thái D7 — không làm thế thì hồ sơ đĩa mang bộ đệm ẤM và hành trình xanh cả khi bệnh còn nguyên (đúng bẫy J16/J16b đã dính) | 01 | **G2** |
| **J17** | đang làm việc | đóng app đột ngột (không bấm lưu) | — | ✅ **autosave kịp** | ✅ còn việc sau khi mở lại | **PASS trên app thật 04/09** — bối cảnh bị **SIGKILL** giữa lúc vẽ (không `beforeunload`, không `flush()`): neo an toàn 2 thực thể, mở lại đọc IndexedDB thấy **3**. ⚠️ **Chỉ đo trên bản WEB** — bản đóng gói Electron (`killServer()` gửi SIGTERM cho server Next) **chưa đo**, vẫn thuộc lượt G5 | 01 + 07 | **G5** |
| **J18** | hai tab cùng một dự án | cùng sửa, cùng lưu | ✅ tab A **200** · tab B **409** | ✅ **đọc SQL: CSDL giữ đúng bản của tab A (`rev 1`)** | — | **PASS tầng cơ chế TRÊN APP THẬT 04/09** (`--ca=J18`, hai tab thật trong cùng hồ sơ, đọc lại bằng Prisma). **TẦNG NGƯỜI DÙNG VẪN UNVERIFIED — và bộ đo tự khai vì sao**: tab B gửi `fetch` PUT thô nên **đi vòng** qua bộ xử 409 của client (`lib/store.ts:1224`), nên "màn không hiện gì" ở đây KHÔNG phải bằng chứng app im lặng. Ba dữ kiện về tầng người dùng thì **đọc được từ mã** và đáng soi bằng mắt: client CÓ xử 409 (`lib/store.ts:1224-1228`, `setNotice`) · nhưng `notice` chỉ render ở `components/FlowCanvas.tsx:884` (route canvas) · **tự tắt sau 4,5s** (`:437-440`) và mang **màu emerald** — tức cảnh báo mất-việc đang mặc áo màu thành-công | 01 | **G2** |
| **J19** | máy đã có dữ liệu | cài đè bản app mới hơn | snapshot trước khi đụng schema | ✅ `backups/<thời-gian>-before-0.0.9` | ✅ dữ liệu gốc **không đổi một hàng** | **PASS 04/09** — chạy **đúng thân hàm đang ship** (`snapshotBeforeUpgrade` trích từ `electron/main.js`, chỉ thay `app.getVersion()`), trên CSDL SQLite **thật có hàng thật**; bản sao đọc lại **bằng SQL** khớp gốc `{user 2, project 6, flow 6, member 5}` + kèm `uploads/`. ⚠️ **KHÔNG chạy Electron đóng gói** — phần đó vẫn là G5/lane 07 | 07 | **G5** |

### 1.6 · Đầu ra

| # | KHỞI ĐIỂM | THAO TÁC | KẾT QUẢ HỆ THỐNG | KẾT QUẢ ĐÃ LƯU | VÀO LẠI | TRẠNG THÁI | CHỦ | CHẶN CỔNG |
|---|---|---|---|---|---|---|---|---|
| **J20** | Trình bày có nội dung | xuất PDF | tệp sinh ra | ✅ tệp trên đĩa, mở được **độc lập với app** | 👁 **đã mở tệp ra soi bằng mắt** | **PASS invariant, KÈM 3 PHÁT HIỆN CHUẨN ĐẦU RA** (xem dưới bảng) — 04/09, tệp 24 KB · 1 trang · khổ **2560×1440pt** · 1 ảnh JPEG nhúng. 🔴 Lượt ĐẦU cho **trang TRẮNG TINH** đi qua với chữ PASS — chỉ lộ khi bóc ảnh ra NHÌN; bộ soi nay đo mực (mọi điểm ảnh = 255 ⇒ FAIL). ⚠️ **Lượt chạy lại đợt 3 (04/09) KHÔNG KẾT LUẬN được ở đây**: `waitForEvent('download')` hết 120 s, khung ghi **LỖI (hạ tầng)** chứ không phải FAIL — đúng luật *ngã vì hạ tầng thì không tính là đỏ*. Đã A/B trên đúng nghi phạm: hoàn nguyên `lib/project-scope.ts` về HEAD rồi chạy lại ⇒ **ngã y hệt** ⇒ **không phải hồi quy của đợt 3**. Bằng chứng PASS của đợt 2 còn nguyên (`J20-deck-xuat.pdf` · `J20-trang-1.png` không bị lượt sau ghi đè) | 02 + 07 | **G5** |
| **J21** | dự án | xuất `.idf` / gói `.idfp` | gói sinh ra | — | nạp lại được | **UNVERIFIED** — `SHIP-BLOCKERS` **B4**: *".idf/.idfc sinh từ máy sạch chưa chạy lại sau khi thu 11 slice"*, ⬜ chưa mở. Tầng định dạng có khoá: `lib/present-editor/idfp.test.ts` | 07 | **G5** |
| **J22** | mất mạng / không có API key | dùng một năng lực cần cloud | ✅ **503 · `PROVIDER_NOT_CONFIGURED`**, câu báo nói rõ việc phải làm | — (không sinh gì, đúng bản chất) | — | **PASS trên app thật 04/09** (`--ca=J22`) — môi trường kiểm **thật sự không có `FAL_KEY`** nên đây là ca thật, không mô phỏng. Gọi `POST /api/jobs` từ trong app với phiên thật: **không trả hàng giả**, không nút chạy-mà-không-làm-gì. Hiệu chuẩn: ép cửa đó trả 200 kèm job bịa ⇒ khẳng định ĐỎ đúng như phải thế | 02 | **G5** |

---

### 1.6b · J20 — MỞ TỆP RA SOI: thứ không máy soi nào trong repo bắt được

> LUẬT nghiệm thu 11/08: hành trình sinh tệp thì nghiệm thu = **mở tệp đầu ra** soi theo
> `docs/CHUAN-DAU-RA-NGHE.md`. Đây là lần đầu luật đó được thi hành cho PDF deck.

| # | Soi thấy gì | Đối chiếu chuẩn | Nặng nhẹ |
|---|---|---|---|
| **F1** | Trang in ra đúng **một dòng chữ `Nhập nội dung`** — và đo tiếp ra: đó là **giá trị mặc định trong MODEL** (`lib/present-editor/model.ts:654`, `makeText()`), **không phải chữ mờ lúc hiển thị** ⇒ nó là dữ liệu thật, xuất ra như mọi nội dung khác | `CHUAN-DAU-RA-NGHE` §4 đòi **0 placeholder** trong tệp giao khách | 🔴 **nặng nhất**: KTS thêm ô chữ, quên điền, xuất gửi khách ⇒ hồ sơ khách có chữ "Nhập nội dung". Đường xuất **không lọc placeholder**, cũng không cảnh báo |
| **F2** | **0 ký tự trích được** — mỗi trang là **một ảnh JPEG full-page** (`/Filter /DCTDecode`), 14 font khai trong tệp nhưng **không font nào mang glyph thật** | chữ trong PDF **không chọn/tìm/copy được** | 🟡 **cố ý theo thiết kế** (WYSIWYG 1:1 với editor, `lib/present-editor/export.ts:53-66`) — nhưng phải khai thẳng: PDF deck của IF là **ảnh**, không phải văn bản. Chữ-sửa-được là đường PPTX |
| **F3** | Khổ trang **2560×1440 pt = 35,6 × 20 inch**; ảnh nhúng 2560×1440 px ⇒ **72 dpi** | `LUAT-300DPI` (29/07) | 🟡 đúng vai *deck màn hình*; đường in 300dpi là hàm **riêng** (`exportDeckToPdfAtPaperSize`, chỉ chạy với A4/A3) — **chưa hành trình nào chạm**, xếp việc lượt sau |

**Đọc được bằng mắt, ghi lại vì nó là điểm sáng:** dấu tiếng Việt dựng chồng đúng
(`Nhập nội` — không vỡ, không mất mũ), đúng `LUAT-CHU-VIET-7.1.23`.

🔴 **Bài học của chính bộ đo, không phải của sản phẩm:** vòng đầu bộ khẳng định chỉ hỏi
*mở được · có trang · đủ byte* ⇒ nó **cho một trang trắng tinh đi qua với chữ PASS**. Ba câu đó
đều đúng mà kết luận vẫn sai. Nay bộ soi bóc ảnh nhúng ra **đo mực** (mọi điểm ảnh = 255 ⇒ FAIL)
và giữ lại `J20-trang-1.jpg` làm bằng chứng **nhìn được**. **F1 thì máy vẫn KHÔNG bắt nổi** — chữ
đã thành điểm ảnh, không grep được; nó chỉ chết dưới mắt người. Đó đúng là lý do luật 11/08 tồn tại.

---

### 1.7 · HAI LỖI CHẶN ĐỢT 2 TÌM RA — cùng một họ: **nút làm một nửa rồi đứng im** · ✅ ĐÃ ĐÓNG 04/09

Cả hai đều đo trên app thật, dự án mới tinh, và cả hai đều **không** bị `tsc` · `npm test` ·
`soi:cong-cu-chet` bắt: nút CÓ mount, CÓ handler, handler CÓ chạy — nó chỉ không đi tới đích.

| Mã | Chỗ đứt | Đo được gì | Hệ quả cho người dùng |
|---|---|---|---|
| **D-J04a** 🔴 | `components/home/XuongHome.tsx:184` nút *"Tạo dự án mới"* → `moVat` (`:456-460`) → `onEnter` → `HomeScreen.tsx:575` `toProjectRender()` | bấm xong: URL `/` **không đổi** · `Project` **20 → 20** · `Flow` **12 → 12** · lệnh gọi API khác GET **chỉ `POST /api/cursors`** (nhịp presence) | **không tạo được dự án từ Home.** Kèm theo: ba nút *"Tạo dự án mới"* · *"Mở dự án có sẵn"* · *"Nhập từ tệp"* (`:184,187,190`) **dùng CHUNG một `onClick={onMo}`** — ba nhãn khác nhau, một hành vi |
| **D-J04b** 🔴 | `components/studio/ProjectScopeEmptyState.tsx` `handleCreate` (`:64-77`) kết bằng `goToStage(routeId)` → `router.push(stageRoutePath(routeId, stage))` = **ĐÚNG URL đang đứng** | dự án mới tinh, **cả `/cad` LẪN `/present`**: máy chủ sinh Flow thật **0 → 1**, nhưng màn **kẹt "Đang tạo…" vô hạn** (đo 20s, `canvas` = 0). **Tải lại trang thì vào được** | bấm một nút, dữ liệu ĐÃ được tạo, mà màn hình đứng im ⇒ người dùng đọc ra là *app treo*. `handleAttachOrphan` (`:79-93`) kết y hệt nên dính cùng bệnh |

✅ **ĐÃ SỬA 04/09 (lane 04 DESIGN + 02 WORKFLOW), đo lại trên app thật:**

| Mã | Sửa ở đâu | Đo lại được gì |
|---|---|---|
| **D-J04a** | `lib/home/xuong-demo.ts` — ba nút thôi là ba chuỗi nhãn, thành ba mã việc `tao-du-an` · `mo-du-an` · `nhap-tep` (kiểu bắt buộc khai, thêm lối vào mà quên nối là `tsc` đỏ). `XuongHome.tsx` — mỗi mã một hàm thi hành riêng; nút chưa có đường thì MỜ kèm lý do qua `aria-describedby` (không dùng `disabled`, vì Tab bỏ qua thì lý do không tới ai). `HomeScreen.tsx` — nối `ProjectInitBoard` (cửa tạo dự án đã có từ 12/08, trước nay chỉ mở được từ `ProjectSelect` vốn đã thôi mount ở `/`) | **J04 PASS**: `Project` **5 → 6** · `Flow` **6** · URL `/` → `/projects/<id>/render` · đóng HẲN trình duyệt rồi mở lại vẫn thấy dự án qua `GET /api/flows` |
| **D-J04b** | Gốc ở `lib/project-scope.ts`: `useProjectScopeSync` nay nhận `currentFlowId` làm **đầu vào** nên mở flow xong là scope tự tính lại; đường tắt của `ensureProjectScope` đòi **có flow thật** (nhánh dọn canvas tự đặt `currentProjectId = routeId` nên chỉ khớp id thôi là sai). `ProjectScopeEmptyState.tsx`: gỡ cờ bận trong `finally` (không chỉ `catch`), khoá bấm-hai-lần bằng `ref`, điều hướng cùng-đường thì không `push` | **J07 · J12 PASS mà KHÔNG cần `reload()`**; probe riêng `scripts/nghiem-thu-ban-lam-viec/kiem-cua-du-an-rong.mjs` **4/4 đạt ở cả `/cad` lẫn `/present`**, gồm ca **bấm hai lần → vẫn đúng 1 bản vẽ** (đọc bằng SQL) |

⇒ **`reload()` giấu bệnh trong `quaCuaDuAnRong()` ĐÃ GỠ.** Nay hàm đó bấm rồi **đợi màn rỗng biến
mất** — bệnh quay lại là các hành trình dùng nó sẽ ĐỎ, không còn xanh nhờ liều thuốc.
⚠️ Điều kiện dừng cố ý **không** phải "có `<canvas>`": chặng Trình bày không dựng canvas nào, đợi
canvas ở đó là ngã vì **hạ tầng** chứ không vì khẳng định — đúng thứ khung này cấm (và đã trượt
một lượt thật vì lỗi đó trước khi sửa).

📌 **Vì sao đáng ghi thành một mục riêng**: đây là biến thể nặng hơn của *nút chết*. Nút chết thì
người dùng biết mà đi đường khác; nút này **ghi dữ liệu xong rồi đứng im**, nên người dùng bấm lại
hoặc bỏ đi — và trong ca D-J04b thì cái Flow vừa sinh ra vẫn nằm đó. Cùng họ với ca WorkHub
*"nút nói dối việc nó vừa làm"* đã ghi trong `00-CHOT` 04/09.

---

## 2 · TỔNG KẾT SỐ

| Trạng thái | Số hành trình | Ghi chú |
|---|---|---|
| **PASS đầy đủ (có cột ĐÃ LƯU)** | **9** | J16 · J17 · J19 · J20 · J07 · J12 · J06 · J04 · **J05** — chạy bằng bộ `nghiem-thu-g2-hanh-trinh.mjs` (J04 vào ở đợt 3; **J05 vào ở đợt 4**, 04/09, sau khi thẻ tiêu điểm bấm được cả thân) |
| **PASS không có cột ĐÃ LƯU để kiểm** | **1** | J22 — bản chất nó không sinh gì để lưu; điều phải chứng minh là *báo rõ, không chạy giả* |
| **PASS chỉ ở cột hệ thống** | **4** | J08 · J09 · J10 · J11 — lượt kiểm 04/09, không chạm chuyện *còn sau khi đóng app* |
| **PASS một phần** | **1** | J18 — tầng cơ chế nay đo trên **app thật + đọc SQL**; tầng người dùng vẫn chưa |
| **FAIL** | **0** | — (J04 đã chuyển sang PASS đợt 3; hai lỗi chặn D-J04a/D-J04b đã đóng, xem §1.7) |
| **UNVERIFIED** | **6** | J01 J02 J13 J14 J15 J21 — J05 đã rời nhóm này (đợt 4, 04/09) |
| **BLOCKED** | **1** | J03 (D3) |

⚠️ Đếm lại cho đúng: 22 = 9 PASS-đủ + 1 PASS-không-có-cột + 4 PASS-hệ-thống + 1 PASS-một-phần
+ 0 FAIL + **6 UNVERIFIED** + 1 BLOCKED.

### ⭐ CỘT **KẾT QUẢ ĐÃ LƯU**: **1/22 → 4/22 → 7/22 → 8/22 → 9/22** (đợt 5: **vẫn 9/22** · đợt 6: **vẫn 9/22**)

🔴 **ĐỢT 6 (04/09, D7) CŨNG KHÔNG LÀM CON SỐ NÀY TĂNG — cùng lý do, giữ nguyên luật đếm.** `J23`
là hành trình **MỚI THÊM** như `J16b`, không nằm trong 22 hành trình gốc ⇒ **không cộng vào tử số,
không đổi mẫu số**. Nếu muốn đếm cả hành trình mới thì phải đổi **cả hai** vế và nói rõ là đang đổi
thước — cộng một vế là tự chấm điểm.
Thứ đợt 6 thật sự đổi: **J16b xanh mà người dùng vẫn kẹt**. J16b chứng minh *dấu vết được GHI đủ*;
nó không hỏi *có ai ĐỌC được dấu vết đó và đưa người ta tới nơi không*. Hai câu độc lập, và D7 hỏng
đúng câu thứ hai. ⇒ **Bài học đếm được: một cột xanh chỉ bảo chứng cho câu hỏi mà nó thật sự hỏi.**

🔴 **ĐỢT 5 (04/09, D6) KHÔNG LÀM CON SỐ NÀY TĂNG — nói thẳng thay vì thổi lên 10.** `J16b` là
hành trình **MỚI THÊM**, không phải một trong 22 hành trình gốc; cộng nó vào tử số mà giữ mẫu số
22 là **tự chấm điểm bằng cách đổi luật đếm**. Thứ đợt 5 thật sự đổi là **CHẤT của J16**: nó thôi
chỉ hỏi *"việc còn không"* mà hỏi thêm *"quay lại được không"* — hai câu khác nhau, và ca deep-link
hỏng đúng câu thứ hai trong khi câu thứ nhất vẫn xanh. Một hành trình xanh nửa vời **đắt hơn** một
hành trình đỏ, vì nó phát chứng chỉ cho thứ nó chưa từng đo.

Con số này là thứ duy nhất đáng theo dõi ở cổng G2. Đợt 2 (04/09) thêm **J07 · J12 · J06**;
đợt 3 cùng ngày thêm **J04** sau khi đóng hai lỗi chặn ở §1.7; **đợt 4 thêm J05**.
🔴 Đợt 2 tăng 3 chứ không tăng 6, và ba chữ "chưa" đó là số thật: **J04 đỏ thật** (lỗi sản phẩm,
không phải lỗi bộ đo — nay đã sửa), **J18 mới xong nửa dưới** (cơ chế), **J22 không có cột này để
mà đầy**.
⭐ Và J04 đáng ghi riêng một dòng: nó là hành trình duy nhất tới giờ **đỏ vì sản phẩm hỏng chứ
không vì bộ đo thiếu** — tức bộ G2 đã làm đúng việc nó sinh ra để làm.

Tám hành trình nay đi trọn bất biến:

> **THAO TÁC → GHI XUỐNG → ĐÓNG/TẢI LẠI HẲN → VÀO LẠI → CÙNG MỘT SỰ THẬT**

🔴 **"ĐÓNG HẲN" nay có nghĩa thật.** Bộ chạy dùng `launchPersistentContext(<hồ sơ trên đĩa>)` —
đóng bối cảnh = đóng app, mở lại cùng thư mục = mở lại app. Dùng `browser.newContext()` (cách bộ
G1 làm) thì IndexedDB **bị vứt lúc đóng**, nên phép "mở lại" vô nghĩa ngay từ định nghĩa —
**đó là lý do mắt này chưa từng được chứng minh, chứ không phải vì chưa ai thử.**

**Hiệu chuẩn:** mỗi lượt chạy dựng trước một **thế giới biết chắc hỏng** và đòi ĐÚNG bộ khẳng định
đó phải ĐỎ. Bộ chỉ tính là đỏ khi đỏ **vì khẳng định**; ngã vì hạ tầng bị đánh dấu *không kết luận*
— vì thứ đỏ ở mọi thế giới thì không chứng minh được gì. Lần chạy 04/09 (đợt 2): **hiệu chuẩn ĐẠT**
trên **9 hành trình khai thế-giới-hỏng** (J20 chưa khai, bộ tự in dòng cảnh báo *"mọi chữ PASS của
nó chỉ là lời khai"*).

Ba thứ đợt 2 phải sửa trong chính phép hiệu chuẩn, ghi lại vì cả ba đều là bẫy chung:

1. **ĐỎ GIẢ VÌ CHẶN SAI ĐƯỜNG.** Bản đầu của J07 dựng thế giới hỏng bằng cách chặn
   `IDBObjectStore.put` ⇒ `CadSheets` không chốt được cờ hydrate, canvas không mount, bộ ngã ở
   `waitForSelector` sau 60s. Đó là **LỖI (hạ tầng)**, không phải **FAIL (khẳng định)** — và
   khung đã bắt đúng, in *"HIỆU CHUẨN KHÔNG KẾT LUẬN"*. ⇒ Thế giới hỏng phải cắt **đúng đường mà
   hành trình đó khẳng định** (với J07 là đường máy chủ), để mọi thứ khác chạy y như thật.
2. **HIỆU CHUẨN THOÁI HOÁ.** Hành trình đã ĐỎ ở **thế giới lành** thì phép hiệu chuẩn của nó
   không chứng minh gì — nó đỏ ở cả hai thế giới. Bộ nay **tự in cảnh báo** cho đúng những mã đó
   (lượt 04/09: `J04`), thay vì để chữ "HIỆU CHUẨN ĐẠT" che mất.
3. **CUỘC ĐUA DO CHÍNH BỘ ĐO TẠO RA.** J18 bản đầu mở tab ở `/projects/[id]/render`; mount
   `FlowCanvas` là `persistNow()` tự PUT và **đẩy `rev`** ⇒ tab A nhận 409 trước cả khi ca tranh
   ghi được dựng. Đứng ở route trung tính (`/files`) thì hai lệnh PUT của bộ đo là **hai người
   viết duy nhất** ⇒ phép đo tất định.

## 3 · BA HÀNH TRÌNH ĐÁNG CHẠY TRƯỚC NHẤT — **ĐÃ CHẠY 04/09**

✅ Cả ba đã chạy trên app thật và **PASS**: J16 (P0 duy nhất đang mở, nay có người nhìn) ·
J19+J17 (hành trình duy nhất phá được dữ liệu thật và không sửa được sau phát hành) ·
J20 (đầu ra người ngoài cầm trên tay — mở tệp ra soi, ra 3 phát hiện ở §1.6b).
Lý do xếp hạng ban đầu giữ nguyên trong lịch sử tệp này; phần còn lại của mục 3 là **bối cảnh**,
không còn là hàng đợi.

---

## 4 · BỘ CHẠY — THÊM HÀNH TRÌNH LÀ THÊM MỘT MỤC KHAI BÁO

`scripts/nghiem-thu-g2-hanh-trinh.mjs` · một lệnh chạy cả lô:

```
node scripts/nghiem-thu-g2-hanh-trinh.mjs --db='file:<đường TUYỆT ĐỐI>/prisma/dev.db'
node scripts/nghiem-thu-g2-hanh-trinh.mjs --ca=J20        # một hành trình
node scripts/nghiem-thu-g2-hanh-trinh.mjs --hieu-chuan    # chỉ phép hiệu chuẩn
```

**Khung sở hữu bất biến; hành trình chỉ khai 6 việc nhỏ** — `chuẩn bị · mở phiên · thao tác ·
đọc sự thật · vào lại · so sánh`. Thứ tự (thao tác → đọc → **đóng hẳn** → mở phiên MỚI trên
CÙNG thế giới → đọc lại → so) nằm ở `chayMot()`, không nằm trong hành trình ⇒ **thêm hành trình
thứ năm = thêm một mục vào mảng `HANH_TRINH`, không sửa khung.**

✅ **Khuôn đó đã chịu được phép thử thật**: đợt 2 thêm **sáu** hành trình (J07 · J12 · J04 · J06 ·
J18 · J22) — `HANH_TRINH` nay **10 mục** — mà khung `chayMot()` **không đổi một dòng logic nào**.
Ba thứ thêm vào đều là **năng lực dùng chung**, không phải nhánh riêng cho một hành trình:
`canThiep` (chặn/giả lập mạng, CHỈ để dựng thế giới hỏng — lượt chạy thật luôn rỗng) ·
`docBanSaoMayChu()` (đọc nơi lưu thật thứ hai: hàng `ProjectFile` + parse ruột tệp) · và
`docKhoSheets()` mọc thêm `dsId`/`soPhanTu`/`soTrang` để đo được **danh tính** chứ không chỉ số
đếm. Hai thứ khác cũng hoá dùng-chung: **danh sách hiệu chuẩn nay sinh từ chính khai báo hành
trình** (`hieuChuanMo`) nên quên khai là bị bêu tên, và mỗi hành trình có **dự án riêng**
(`duAnRieng`) — bắt buộc, vì lưới đỡ khôi phục-từ-máy-chủ ở `CadSheets.tsx:458` sẽ khiến hành
trình sau nhặt được nét của hành trình trước rồi báo PASS nhầm.

Hành trình **không cần trình duyệt** cũng vừa khuôn: J19 khai `moPhien` trả một vật rỗng, "thế
giới" của nó là **thư mục trên đĩa**, "mở lại" là **đọc lại đĩa bằng SQL**. Đó là lý do khung
tách *phiên* khỏi *trình duyệt*.

⛔ **Ba luật của bộ, đừng nới:**
1. **Đọc từ nơi lưu thật** — IndexedDB · SQL trên tệp `.db` · byte của tệp xuất ra. Không đọc DOM,
   không tin chữ "đã lưu" trên màn.
2. **Đóng là đóng thật** — hồ sơ Chromium trên đĩa, không phải `reload()`, không phải `newContext()`.
3. **Hiệu chuẩn trước khi tin** — mỗi lượt chạy tự dựng thế giới hỏng và đòi mình phải đỏ ở đó.

⚠️ `DATABASE_URL` phải **TUYỆT ĐỐI**: Prisma nạp `.env` theo đường THẬT của `node_modules`, nên
worktree dùng symlink sẽ âm thầm ghi vào CSDL repo chính — **đã xảy ra thật trong chính phiên
lập bộ này** (một hàng `User` lọt sang repo chính, phải dọn tay). Bộ chạy nay nhận `--db` và
truyền thẳng `datasources.db.url`, không nhờ `.env` nữa.
