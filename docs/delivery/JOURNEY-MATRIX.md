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
| **J04** | Home rỗng | tạo dự án mới | `POST /api/flows` tạo `Project` **và** `Flow` cùng lượt (`app/api/flows/route.ts:61,74,106,112`) | `Project` + `Flow` | dự án hiện ở Home | **UNVERIFIED** đầu-cuối. Cơ chế chống-đẻ-mồ-côi có khoá riêng: `lib/server/draft-project.test.ts` | 02 | **G2** |
| **J05** | Home có việc dở | bấm thẻ Resume | nhảy đúng chặng đang dở | `lastStage` | — | **UNVERIFIED** — Home đang trong vòng thiết kế (`SHIP-BLOCKERS` B2); hành vi Resume **chưa được chạy đo** | 04 + 02 | cổng thị giác (lane 04) |
| **J06** | dự án đã có | mở lại dự án cũ, sửa tiếp | tải lại doc, sửa được | ghi đè có kiểm `rev` | gia phả không đứt | **UNVERIFIED** đầu-cuối; **cơ chế lõi thì có bằng chứng chạy thật** — `app/api/flows/[id]/route.test.ts` chạy Prisma **thật** trên `dev.db` để chứng minh `where:{id, rev}` sinh P2025 chứ không bị âm thầm bỏ qua | 02 | **G2** |

### 1.3 · Ba chặng nghề

| # | KHỞI ĐIỂM | THAO TÁC | KẾT QUẢ HỆ THỐNG | KẾT QUẢ ĐÃ LƯU | VÀO LẠI | TRẠNG THÁI | CHỦ | CHẶN CỔNG |
|---|---|---|---|---|---|---|---|---|
| **J07** | `/projects/[id]/cad` | vẽ 2D → lưu | nét vào doc | `Flow` version | mở lại thấy nét | **UNVERIFIED** đầu-cuối | 02 | **G2** |
| **J08** | chặng 3D | dựng khối bằng cử chỉ | khối hiện trong khung nhìn | — | — | **PASS** — chạy trên app thật 04/09: `docs/bao-cao-phien/2026-09-04-kiem-app-that-3d-present.md` mục 1 | 02 | **G2** |
| **J09** | chặng 3D, có khối | chọn khối → `Delete` | khối bị xoá | — | — | **PASS sau khi vá** — cùng báo cáo mục 2. **Trước khi vá là FAIL**: đường bàn phím không nối lệnh registry (`components/three/Viewport3D.tsx`). Đây là **ca thứ hai cùng một gốc** với ⌘Z ⇒ chiều **LÙI** của 3D là vùng đã gãy hai lần, đáng nghi nhất khi mở rộng kiểm | 02 | **G2** |
| **J10** | chặng 3D trên màn retina | mở khung nhìn | không bị cắt | — | — | **PASS** — cùng báo cáo mục 3 | 04 | cổng thị giác |
| **J11** | có bản vẽ 2D | đưa bản vẽ sang Trình bày | trang Trình bày nhận đúng bản vẽ | — | — | **PASS 3/3 lượt** — cùng báo cáo mục 4. ⚠️ Bản FAIL 9/10 trước đó là **hiện vật của bộ đo**, không phải lỗi sản phẩm; giữ lại vì chính nó dẫn tới rủi ro J16 | 02 | **G2** |
| **J12** | chặng Trình bày | sửa bố cục → lưu → mở lại | — | — | — | **UNVERIFIED** — J11 chứng minh **đưa sang được**, hoàn toàn không chứng minh **lưu rồi mở lại được** | 02 | **G2** |

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
| **J17** | đang làm việc | đóng app đột ngột (không bấm lưu) | — | ✅ **autosave kịp** | ✅ còn việc sau khi mở lại | **PASS trên app thật 04/09** — bối cảnh bị **SIGKILL** giữa lúc vẽ (không `beforeunload`, không `flush()`): neo an toàn 2 thực thể, mở lại đọc IndexedDB thấy **3**. ⚠️ **Chỉ đo trên bản WEB** — bản đóng gói Electron (`killServer()` gửi SIGTERM cho server Next) **chưa đo**, vẫn thuộc lượt G5 | 01 + 07 | **G5** |
| **J18** | hai tab cùng một dự án | cùng sửa, cùng lưu | tab sau nhận 409 | không ghi đè âm thầm | — | **PASS ở tầng cơ chế** — `app/api/flows/[id]/route.test.ts` chứng minh trên Prisma thật; **UNVERIFIED ở tầng người dùng** (client có xử 409 tử tế không thì chưa ai nhìn) | 01 | **G2** |
| **J19** | máy đã có dữ liệu | cài đè bản app mới hơn | snapshot trước khi đụng schema | ✅ `backups/<thời-gian>-before-0.0.9` | ✅ dữ liệu gốc **không đổi một hàng** | **PASS 04/09** — chạy **đúng thân hàm đang ship** (`snapshotBeforeUpgrade` trích từ `electron/main.js`, chỉ thay `app.getVersion()`), trên CSDL SQLite **thật có hàng thật**; bản sao đọc lại **bằng SQL** khớp gốc `{user 2, project 6, flow 6, member 5}` + kèm `uploads/`. ⚠️ **KHÔNG chạy Electron đóng gói** — phần đó vẫn là G5/lane 07 | 07 | **G5** |

### 1.6 · Đầu ra

| # | KHỞI ĐIỂM | THAO TÁC | KẾT QUẢ HỆ THỐNG | KẾT QUẢ ĐÃ LƯU | VÀO LẠI | TRẠNG THÁI | CHỦ | CHẶN CỔNG |
|---|---|---|---|---|---|---|---|---|
| **J20** | Trình bày có nội dung | xuất PDF | tệp sinh ra | ✅ tệp trên đĩa, mở được **độc lập với app** | 👁 **đã mở tệp ra soi bằng mắt** | **PASS invariant, KÈM 3 PHÁT HIỆN CHUẨN ĐẦU RA** (xem dưới bảng) — 04/09, tệp 24 KB · 1 trang · khổ **2560×1440pt** · 1 ảnh JPEG nhúng. 🔴 Lượt ĐẦU cho **trang TRẮNG TINH** đi qua với chữ PASS — chỉ lộ khi bóc ảnh ra NHÌN; bộ soi nay đo mực (mọi điểm ảnh = 255 ⇒ FAIL) | 02 + 07 | **G5** |
| **J21** | dự án | xuất `.idf` / gói `.idfp` | gói sinh ra | — | nạp lại được | **UNVERIFIED** — `SHIP-BLOCKERS` **B4**: *".idf/.idfc sinh từ máy sạch chưa chạy lại sau khi thu 11 slice"*, ⬜ chưa mở. Tầng định dạng có khoá: `lib/present-editor/idfp.test.ts` | 07 | **G5** |
| **J22** | mất mạng / không có API key | dùng một năng lực cần cloud | báo rõ, không nút giả | — | — | **UNVERIFIED** — `RELEASE-CHECKLIST-INTERNAL.md` §1 đã đặt yêu cầu này thành mục kiểm tay; chưa ai chạy | 02 | **G5** |

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

## 2 · TỔNG KẾT SỐ

| Trạng thái | Số hành trình | Ghi chú |
|---|---|---|
| **PASS đầy đủ (có cột ĐÃ LƯU)** | **4** | J16 · J17 · J19 · J20 — chạy bằng bộ `nghiem-thu-g2-hanh-trinh.mjs` 04/09 |
| **PASS chỉ ở cột hệ thống** | **4** | J08 · J09 · J10 · J11 — lượt kiểm 04/09, không chạm chuyện *còn sau khi đóng app* |
| **PASS một phần** | **2** | J06 · J18 — cơ chế lõi có bằng chứng trên Prisma thật; tầng người dùng chưa |
| **UNVERIFIED** | **10** | J01 J02 J04 J05 J07 J12 J13 J14 J15 J21 J22 → còn **11**, xem ghi chú dưới |
| **BLOCKED** | **1** | J03 (D3) |

⚠️ Đếm lại cho đúng: 22 hành trình = 4 PASS-đủ + 4 PASS-hệ-thống + 2 PASS-một-phần + **11 UNVERIFIED**
(J01 J02 J04 J05 J07 J12 J13 J14 J15 J21 J22) + 1 BLOCKED.

### ⭐ CỘT **KẾT QUẢ ĐÃ LƯU**: **1/22 → 4/22**

Con số này là thứ duy nhất đáng theo dõi ở cổng G2, và nó vừa đổi lần đầu kể từ khi lập ma trận.
Bốn hành trình nay đi trọn bất biến:

> **THAO TÁC → GHI XUỐNG → ĐÓNG/TẢI LẠI HẲN → VÀO LẠI → CÙNG MỘT SỰ THẬT**

🔴 **"ĐÓNG HẲN" nay có nghĩa thật.** Bộ chạy dùng `launchPersistentContext(<hồ sơ trên đĩa>)` —
đóng bối cảnh = đóng app, mở lại cùng thư mục = mở lại app. Dùng `browser.newContext()` (cách bộ
G1 làm) thì IndexedDB **bị vứt lúc đóng**, nên phép "mở lại" vô nghĩa ngay từ định nghĩa —
**đó là lý do mắt này chưa từng được chứng minh, chứ không phải vì chưa ai thử.**

**Hiệu chuẩn:** mỗi lượt chạy dựng trước một **thế giới biết chắc hỏng** (chặn ghi IndexedDB cho
J16 · chặn thư mục `backups` cho J19) và đòi ĐÚNG bộ khẳng định đó phải ĐỎ. Bộ chỉ tính là đỏ khi
đỏ **vì khẳng định**; ngã vì hạ tầng bị đánh dấu *không kết luận* — vì thứ đỏ ở mọi thế giới thì
không chứng minh được gì. Lần chạy 04/09: **hiệu chuẩn ĐẠT**.

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
