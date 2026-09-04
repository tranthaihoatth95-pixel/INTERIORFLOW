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
| **J16** | **đã đăng nhập**, mở **thẳng** deep-link studio (tab mới · bookmark · F5) | làm việc | màn hiện bình thường | ⚠️ **việc KHÔNG được lưu — không báo lỗi, không dấu hiệu nào** | mở lại: **mất trắng** | **BLOCKED → 🟡 sửa xong-máy, CHƯA xác minh trên app thật** — `PRODUCT-DEFECTS.md` **D1** (P0): định danh đọc từ `localStorage` (`lib/resume.ts:22`), mà khoá đó **chỉ được ghi ở hai chỗ** — `components/home/HomeScreen.tsx:264` và `components/entry/LoginForm.tsx:135` ⇒ không qua hai cửa đó thì `getLastUserId()` trả `null` và `lib/project-scope.ts:62` rơi về đường không-có-user. Đã cắm ba đường ghi qua `danhTinhChoLuot()`; bằng chứng là **số lần ghi xuống đĩa** (0 → 3, đúng khoá) — nhưng **chưa mở app thật một dòng nào** | 01 | **G2 + G5** |
| **J17** | đang làm việc | đóng app đột ngột (không bấm lưu) | — | autosave có kịp không | — | **UNVERIFIED** — `lib/cad/cad3d-autosave.ts` dùng chung khoá với `CadSheets` (không đẻ bucket thứ hai), nhưng **chưa đo trên bản đóng gói**, nơi `killServer()` (`electron/main.js:503-513`) gửi SIGTERM cho tiến trình server Next | 01 + 07 | **G5** |
| **J18** | hai tab cùng một dự án | cùng sửa, cùng lưu | tab sau nhận 409 | không ghi đè âm thầm | — | **PASS ở tầng cơ chế** — `app/api/flows/[id]/route.test.ts` chứng minh trên Prisma thật; **UNVERIFIED ở tầng người dùng** (client có xử 409 tử tế không thì chưa ai nhìn) | 01 | **G2** |
| **J19** | máy đã có dữ liệu | cài đè bản app mới hơn | snapshot trước khi đụng schema | `backups/<thời-gian>-before-<phiên-bản>` | dữ liệu còn nguyên | **UNVERIFIED** — cơ chế có, và **chặn khởi động nếu snapshot thất bại** (`electron/main.js:156-181`); nhưng `release:preflight` chỉ kiểm **chuỗi ký tự** của cơ chế đó, không kiểm nó chạy | 07 | **G5** |

### 1.6 · Đầu ra

| # | KHỞI ĐIỂM | THAO TÁC | KẾT QUẢ HỆ THỐNG | KẾT QUẢ ĐÃ LƯU | VÀO LẠI | TRẠNG THÁI | CHỦ | CHẶN CỔNG |
|---|---|---|---|---|---|---|---|---|
| **J20** | Trình bày có nội dung | xuất PDF | tệp sinh ra | tệp trên đĩa | **mở tệp bằng mắt** | **UNVERIFIED** — và theo LUẬT nghiệm thu chốt 11/08, hành trình sinh tệp thì **nghiệm thu = MỞ TỆP ĐẦU RA soi theo `docs/CHUAN-DAU-RA-NGHE.md`**; `tsc`/test/ảnh chụp **không đủ** | 02 + 07 | **G5** |
| **J21** | dự án | xuất `.idf` / gói `.idfp` | gói sinh ra | — | nạp lại được | **UNVERIFIED** — `SHIP-BLOCKERS` **B4**: *".idf/.idfc sinh từ máy sạch chưa chạy lại sau khi thu 11 slice"*, ⬜ chưa mở. Tầng định dạng có khoá: `lib/present-editor/idfp.test.ts` | 07 | **G5** |
| **J22** | mất mạng / không có API key | dùng một năng lực cần cloud | báo rõ, không nút giả | — | — | **UNVERIFIED** — `RELEASE-CHECKLIST-INTERNAL.md` §1 đã đặt yêu cầu này thành mục kiểm tay; chưa ai chạy | 02 | **G5** |

---

## 2 · TỔNG KẾT SỐ

| Trạng thái | Số hành trình | Ghi chú |
|---|---|---|
| **PASS** | **4** | J08 · J09 · J10 · J11 — **tất cả đến từ MỘT lượt kiểm duy nhất ngày 04/09**, và **tất cả đều nằm ở cột "kết quả hệ thống"** |
| **PASS một phần** | **2** | J06 · J18 — cơ chế lõi có bằng chứng chạy thật trên Prisma thật; tầng người dùng thì chưa |
| **UNVERIFIED** | **14** | J01 J02 J04 J05 J07 J12 J13 J14 J15 J17 J19 J20 J21 J22 |
| **BLOCKED** | **2** | J03 (D3) · J16 (D1 — P0, đang ở trạng thái *sửa xong-máy chờ app thật*) |

🔴 **Con số đáng chú ý nhất không phải "14 UNVERIFIED".** Nó là: **0 hành trình được xác minh ở cột
KẾT QUẢ ĐÃ LƯU.** Toàn bộ bằng chứng đang có chứng minh *app phản ứng đúng lúc bấm*; chưa có mẩu
nào chứng minh *việc còn đó sáng hôm sau*. Với một sản phẩm local-first mà lời hứa là
*"từ ý tưởng tới sự thật thiết kế — không đánh rơi ngữ cảnh"*, chỗ trống này nằm đúng giữa mệnh đề
bán hàng.

Điều đó **không có nghĩa là app đang mất dữ liệu ở 14 chỗ**. Nó có nghĩa là: nếu app đang mất dữ
liệu ở một trong 14 chỗ đó, **hôm nay không ai biết** — đúng như J16 đã chứng minh là chuyện có
thật, chứ không phải lo xa.

---

## 3 · BA HÀNH TRÌNH ĐÁNG CHẠY TRƯỚC NHẤT

Tiêu chí xếp: **phủ nhiều rủi ro nhất trên mỗi đồng bỏ ra** — ưu tiên hành trình vừa *chặn cổng*,
vừa *đi qua nhiều mắt xích chưa ai chạm*, vừa *có sẵn đường chạy nên rẻ*.

### ① J16 — vào thẳng deep-link, làm việc, rồi mở lại

**Vì sao đứng đầu.** Đây là lỗi **P0 duy nhất đang mở**, và nó đang ở trạng thái nguy hiểm nhất mà
một lỗi có thể ở: **"đã sửa" nhưng chưa ai nhìn.** Test hiện có dựng lại *hình dạng* effect bằng
lời gọi hàm trần — chứng minh **cơ chế và thứ tự**, không chứng minh React thật chạy đúng vậy.

Một lượt chạy đóng luôn ba câu hỏi tách biệt: định danh có đúng không · ghi có xuống đĩa không ·
mở lại có thấy không. **Rẻ**: đường chạy đã dựng sẵn (`scripts/nen-chrome/`, `scripts/tai-khoan-kiem.mjs`,
`scripts/dung-moi-truong-kiem.sh`) — không phải xây gì mới.

### ② J19 + J17 gộp một lượt — nâng cấp trên máy đã có dữ liệu

**Vì sao đứng nhì.** Đây là hành trình **duy nhất có thể phá dữ liệu thật của người dùng**, và là
hành trình **duy nhất không sửa được sau khi phát hành**: bản cài đã ra khỏi tay thì mọi bản nâng
cấp sau phải sống chung với hậu quả.

Nó cũng là chỗ có mâu thuẫn kỹ thuật nặng nhất đang tồn tại — xem `G5-RELEASE-READINESS.md` §B1-③:
bản đóng gói nâng cấp dữ liệu bằng `db push` (không lịch sử, không đường lùi) dựa trên một lý do
**đã đo được là sai**. Chạy J19 cũng chính là chạy J17, vì cả hai xoay quanh cùng một thứ: vòng đời
tiến trình server nền.

### ③ J20 — xuất PDF rồi MỞ TỆP RA SOI

**Vì sao đứng ba.** Đây là hành trình duy nhất trong ba cái đi tới **đầu ra người ngoài cầm trên
tay** — thứ khách của studio nhìn thấy. Và nó là loại lỗi mà **không máy soi nào trong repo bắt
được**: chữ đè hình, tỷ lệ lẻ kiểu "1:47", khung tên lộ jargon đều **xanh** với `tsc`, test và ảnh
chụp màn. Bài học 11/08 đã trả giá đúng một lần cho chuyện này. Rẻ: một dự án nháp và một lần mở
tệp bằng mắt.

### Vì sao KHÔNG chọn J01/J02 cho đợt đầu

**Không phải vì ít rủi ro** — J02 mang một rủi ro thật đáng lo (secret đổi mỗi lần khởi động ⇒ đăng
xuất âm thầm). Lý do là nó **bắt buộc phải đóng gói Electron trước**, tức nó thuộc lượt G5 chứ
không phải lượt chạy nhanh. Nó là hành trình **số một của lượt kế tiếp**, ngay khi có bộ cài đầu tiên.
