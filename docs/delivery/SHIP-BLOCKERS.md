# SHIP BLOCKERS — thứ THẬT SỰ chặn việc phát hành IF

## ⬛ BẢY CỔNG PHÁT HÀNH (chủ dự án đính chính 04/09 — thay bản năm cổng)

| Cổng | Trạng thái | Chủ sở hữu | Còn thiếu đúng cái gì |
|---|---|---|---|
| **G1 · DATA SAFE** | 🟡 PARTIAL | 01 CORE | **7/8 ca PASS trên app thật**; bắt và vá được **rò dữ liệu chéo người dùng** + 2 test đang khoá cứng lỗi đó. Ca 3 (kho bị chặn) đã vá riêng. **Khe còn mở**: `clearLastUserId()` chưa nối vào đường đăng xuất; mới phủ chặng 2D. |
| **G2 · PROFESSIONAL FLOW** | 🟡 PARTIAL | 02 WORKFLOW | ✅ **Hai lỗi chặn ở đường vào ĐÃ ĐÓNG** — cột ĐÃ LƯU **7/22 → 8/22**, `J04` FAIL → PASS. **D-J04a**: ba nút nay là ba `NutLoiVao` mang **mã việc** riêng — *Tạo dự án mới* mở bảng khởi tạo → `createProject` → `createFlow(…, projectId)` (`Project` **20→21**, URL `/` → `/projects/<id>/render`) · *Mở dự án có sẵn* đưa tiêu điểm, không đụng CSDL · *Nhập từ tệp* **MỜ kèm lý do** (`aria-disabled` + `aria-describedby` + token `--mo-vo-hieu`) vì đường tệp→dự-án chưa sống. ⭐ Là **CONNECT không phải NEW**: cửa tạo dự án đã có từ 12/08, chỉ **mất tay nắm** khi `ProjectSelect` thôi mount ở `/`. Máy chặn tái phát: thêm lối vào mà quên nối dây là **`tsc` đỏ**. **D-J04b** sửa ở **gốc** chứ không vá cờ bận — `goToStage` đẩy về đúng URL đang đứng là *đúng*; gốc là trạng thái không tự tính lại. Bấm hai lần: **4/4 ở cả `/cad` lẫn `/present`**, số bản vẽ = **1** đọc bằng SQL ⇒ không đẻ mồ côi. ⭐ `reload()` giấu bệnh trong bộ đo **đã gỡ** mà J07/J12 vẫn PASS. Hiệu chuẩn: chặn `POST /api/flows` ⇒ đỏ vì khẳng định; dòng *"HIỆU CHUẨN THOÁI HOÁ"* của J04 **đã hết**. Test khoá bất biến 20 khẳng định (gỡ deps ⇒ 19 ok · 1 fail). ✅ **J05 ĐÃ ĐÓNG** — thẻ tiêu điểm nay bấm được cả thân, **chuột VÀ bàn phím** (Tab tới được **19 lần**, Enter chạy, ring `2px solid rgb(106,87,245)` lấy từ token `--focus-ring`, **0 hex**, ring **TRONG** vì thẻ có `overflow:hidden`). Lớp phủ `<a href>` thật ⇒ **một tab-stop**, ⌘-click mở tab mới. Máy giữ ràng buộc chống nút-trong-nút: `duongMoLai()` trả `null` cho thân có nút lối vào, và test **đối chiếu với chính JSX** ⇒ thêm thân có nút mà quên khai là **test đỏ**. Cột ĐÃ LƯU **8/22 → 9/22**. 🔴 **Còn lại**: **13 hành trình trống** · **D6** — resume ghi ra thiếu `flowId` nên thẻ dội về `/` (gốc: `ResumeTracker.tsx:41` bỏ lượt ghi khi `lastUserId` chưa gieo — **đua với `danh-tinh-phien`, cùng gốc D1**) · thân thẻ để **~300px trống** dưới bảng bốn dòng, sát cờ đỏ **N-10 "hộp rỗng khổng lồ"**. |
| **G3 · WORKSPACES & TOOLS** | 🟡 PARTIAL | 04 DESIGN + 02 | Máy canh `soi:cong-cu-chet` đã chạy (**27 ca**: 26 mồ côi · 1 dây đứt), tự hiệu chuẩn và bắt lại được ca Vitals lịch sử. Audit 2D/3D xong. **Chưa mở app lần nào** ⇒ mọi ô 'cơ chế có' là đọc mã. Vật liệu · Thư viện · Trình chiếu · BOQ · Duyệt **chưa audit**. |
| **G4 · DESIGN TRUTH / MOAT** | 🟡 **CHỜ MẮT HOÀ** | 05 ASSET + 01 CORE | ✅ Danh tính đi trọn đường UI — **ba mắt 13/13** sau khi ĐÓNG HẲN trình duyệt (hình `#b98a54→#5a3a26` · danh tính `ps-kiem-go-soi→ps-kiem-go-ocho` · BOQ **68.817.600**); hiệu chuẩn bằng **gỡ dây thật** 5/13 ↔ 13/13, **mắt HÌNH xanh cả hai lần** ⇒ bộ đo phân biệt *vẽ ra hình* với *mang danh tính*. Giá không chép vào `MaterialPbr`. ✅ **Mặt tiền thứ năm đã cắm** (`MaterialPalette.tsx:39,90`) — máy sạch `/api/specs` rỗng mà bảng chọn 2D có 2 dòng, tô xong mở lại còn `specId=hat-giong:…`. ✅ **Mặt vẽ 2D trả lại trọn**: 7,9% bị nuốt → **0** — hoá ra **BA hộp bố cục lồng nhau** cùng bắt chuột (`AppShell:186` → `StageToolbelt:88,92` → `CadToolbelt:56`), bóc lớp ngoài thì lớp trong lộ ra (**439 → 11 → 2 → 0**). Đo **8 màn / 358 phần tử**, 7 màn = 0, không đánh đổi. ✅ **Bấm giữa lòng vùng tô chọn được** — **biên thắng lòng** (khoảng cách tới lòng luôn = 0, gộp một vòng thì nền ăn mất mọi vật nó phủ), **lồng nhau lấy diện tích nhỏ nhất**, đúng luật `pickHatchFace` đang chạy cho HATCH. Cờ mặc định TẮT, chỉ bật ở 3 đường CHỌN — `hitTest` còn là mắt của TRIM/FILLET/OFFSET/DIM (14 nơi gọi). Ca **SOLID dựng thật**, 19 khẳng định / 0 fail. 🔴 **Còn lại**: ① **chưa qua mắt Hoà** (ảnh sẵn ở `anh-duyet-mat/g4-danh-tinh/` và `2d-cham-toi-duoc/`) ② Đ2 *".idfc nối bằng khoá đổi-được"* đỏ ở bộ tầng-mô-hình (58/59) ⚠️ **hai hộp `pointer-events:none` mới chưa được máy nào canh** — ai cắm `toolbelt` khác mà quên bật `auto` thì chỉ H5 (cần dev server) mới thấy; và `marginBottom:34` ở `CadToolbelt.tsx:70` vẫn còn — nay vô hại nhưng vẫn là nguồn của cả dải hở. |
| **G5 · EXPERIENCE** | 🟡 PARTIAL | 04 DESIGN | ✅ Home **đã khoá, đã thi công, và ba lỗi đã biết nay đóng 2,5/3**: rail — `@media` hỏi **cửa sổ** chứ không hỏi **khung**, nên rail 320 trên màn 1600 vẫn để khung 1280 nhận bố cục RỘNG, hiện vật tụt **1036→768 px (−26%)**; chuyển `@container` ngưỡng 1348 = 1400−52, **cấu hình mặc định ra y hệt (0 delta)**. Bậc NỀN với dữ liệu THẬT: **5 dòng + đếm 3 việc đang ngủ** (trước: 0) — nhưng **2/3 nguồn bản khoá khai vẫn chưa nối**. Dải môi trường: ba mép cứng đã gỡ (tan ở cả 4 mép), **gốc chưa vá** — `NEO_DO_SANG.light` neo `dusk`/`night` dưới L 0,931 của `--bg` ⇒ dải **tối hơn trang**. ⭐ QA bàn làm việc nghề chạy trên app thật: **3 ca trượt vi-tương-tác, năm máy soi bắt 0/3, tay bắt 3/3** — nặng nhất là công tắc "Vẽ 3D" bị thẻ mách nước **đè trọn** ⇒ bấm im lặng, trong khi `.click()` DOM vẫn chạy nên **mọi test tự động đều xanh**. 2 ca đã sửa. **Còn lại**: `⌘J` không mặt nào tiêu thụ (nút Trình chiếu ghi hẳn phím tắt đó) · khẩu độ Vitals mép trên **chưa dựng** · các workspace khác chưa phán · 🔴 **nợ nghiệm thu mắt 77 xong-MÁY / 1 qua mắt**. |
| **G6 · CONTENT & INTELLIGENCE** | 🟡 PARTIAL | 05 ASSET | ✅ Ba lỗ đợt 2 đóng: `NganPhanTho` **đã cắm sẵn** (tiền đề phiếu sai — nhưng nó **đọc sai nguồn**, chỉ hỏi `/api/specs` nên máy sạch nói "Kho chung chưa có món nào"), kệ Thư viện **qua mắt trên app thật**, nhánh đã-đăng-nhập đo được **3 dòng, cột Nguồn đúng, không đếm trùng**. ⭐ **PBR PASS trọn luật đóng/mở lại**: kéo thanh trượt 0.6→0.17 → lưu → **tắt hẳn trình duyệt** → vào lại đọc đúng 0.17 → xuất V-Ray/D5. 🔴 **4 lỗi chỉ lộ khi chạy app thật**, nặng nhất: `MaterialPbrEditor` chỉ đọc tầng studio, rỗng thì **đoán màu từ tên** ⇒ gỗ sồi hiện `#9a9a9a` thay vì `#b98a54`, bấm **Lưu** là **màu đoán mò đè lên tham số thật**. Đã vá. Kèm: trang tổng ghi "Kho trống" trong khi kệ ngay sau lưng bày 1 và 2 món. **Còn lại**: 2/32 vật liệu (phủ 1/17 họ) · 1 cấu kiện 3D · 3D và 2D mới chứng minh ở **tầng lib**, chưa lái qua UI thật · texture cố ý không ship. ⇒ Bán được *"vật liệu render được và nhớ gốc gác"*; **chưa bán được** *"đổi vật liệu thì con số tự đúng"* — xem **G4 MỞ LẠI**. |
| **G7 · DESKTOP RELEASE** | 🟡 PARTIAL | 07 RELEASE | ✅ `db push` **đã đóng** — nay `migrate deploy` + bắc cầu + đóng mốc + rà SQL phá huỷ + sao lưu; ca nguy cơ mất dữ liệu **ném lỗi** thay vì lặng lẽ đổi bảng. ✅ **Cổng 6 mở lần đầu**: AppImage 338 MB, ~3 phút. 🔴 **Cổng 7 (mở bộ cài) vẫn trống** — chưa mở gói nào. 🔴 **macOS = ĐÍCH CHÍNH** (chủ dự án đính chính 04/09) — xem khối dưới. |

## 🍎 G7 · macOS LÀ ĐÍCH CHÍNH (chủ dự án đính chính 04/09)

**macOS = trải nghiệm desktop CHÍNH** (chủ dự án dùng hằng ngày) · **Windows = đích phân phối công ty**.
⛔ *"Electron dựng xong"* **KHÔNG PHẢI** Mac PASS. PASS = **dùng được IF như một ứng dụng desktop thật**.
⛔ Không có Developer ID **KHÔNG được dùng làm cớ hạ chuẩn bản Mac**. Tách **chất lượng sản phẩm** khỏi **ký để phân phối công khai**; giữ kiến trúc **sẵn sàng ký**. Ký chỉ thành blocker **nếu bảo mật macOS thật sự chặn cài/chạy trên máy A hoặc B — phải có bằng chứng, cấm giả định trước.**

**Hai máy kiểm**: MÁY A (chủ dự án) · MÁY B (em chủ dự án) — dùng làm **hai môi trường sạch**, mục đích bắt **phụ thuộc ngầm vào máy dev**.

🔴 **Rủi ro đo được 04/09, chưa đóng:**
| Việc | Hiện trạng đo tại nguồn |
|---|---|
| ~~Kiến trúc máy~~ ✅ **ĐÓNG 04/09** | Chủ dự án xác nhận **cả hai máy đều Apple Silicon** ⇒ **giữ `arm64`**, KHÔNG thêm `x64`, KHÔNG dùng `universal`. Lý do: gói đã 338 MB, `universal` làm phình gần gấp đôi để đổi lấy một kiến trúc không ai dùng — trái đúng chữ *FAST* chủ dự án đòi. **Quyết định có điều kiện**: ngày có máy Intel thì mở lại, một dòng cấu hình. |
| Phím ⌘ | `metaKey` 54 · `ctrlKey` 68 · cùng dòng 51 ⇒ **~17 chỗ chỉ nhận Ctrl** — trên Mac bấm ⌘ **không ăn**. **Cách sửa đã chốt: một nguồn chung `PrimaryModifier`** (⌘ trên macOS · Ctrl trên Windows/Linux), **cấm vá 17 chỗ rời** — vá rời là 17 chỗ sẽ phân kỳ |
| Sẵn sàng ký | **không có tệp entitlements**, không thấy `hardenedRuntime` — ⚠️ **KHÔNG phải blocker** nếu đường cài trực tiếp trên hai máy Mac chạy an toàn; chỉ thành blocker khi có **bằng chứng** bảo mật macOS chặn, cấm giả định trước |
| Mất dữ liệu khi gỡ cài | **CHƯA AI TRẢ LỜI** — nay thuộc **BẤT BIẾN** ở khối trên, không còn là câu hỏi khảo sát |

🔴 **Giới hạn phải nói thẳng**: phiên này chạy trong **container Linux** ⇒ **không dựng nổi bản Mac dùng được, không mở được app Mac, không ký được**. Mọi kết luận về hành vi Mac là **suy từ cấu hình + mã**. Nghiệm thu Mac **phải chạy trên máy thật** — bộ nghiệm thu đang được soạn để chủ dự án chạy.

## 🔴 BẤT BIẾN · PHẦN MỀM ≠ DỮ LIỆU THIẾT KẾ CỦA NGƯỜI DÙNG (chủ dự án ban 04/09)

> **Nâng cấp · cài lại · gỡ cài đặt thông thường KHÔNG ĐƯỢC âm thầm xoá dự án / `userData`.**
> **Xoá sạch phải là một HÀNH ĐỘNG RIÊNG, người dùng chủ động chọn, gọi đúng tên nó là xoá.**

Ba trạng thái phải trả lời dứt khoát, có bằng chứng, cho **cả Windows lẫn macOS**: nâng cấp đè · cài lại · gỡ cài. Cấu hình không bảo đảm được ⇒ sửa; sửa không nổi bằng cấu hình ⇒ **khiếm khuyết P0**, không để lửng.

🔴 **Kèm theo — dữ liệu thiết kế không được KHOÁ CHẾT trong `userData` của Electron.** Dù gỡ cài có giữ thư mục đó, nếu **đường duy nhất** lấy việc thiết kế ra là qua thư mục nội bộ Electron thì người dùng **bị giam dữ liệu của chính mình**. Phải có đường xuất `.idf`/`.idfc` **cầm đi được và bấm được từ giao diện** — mở ở máy khác, sao lưu, chuyển máy. Chỉ tồn tại trong mã ⇒ **là lỗ**.

## 🔴 LUẬT PASS MỚI — áp cho MỌI luồng có ghi dữ liệu (chủ dự án ban 04/09)

> **THAO TÁC → GHI XUỐNG → ĐÓNG/TẢI LẠI → VÀO LẠI → CÙNG MỘT SỰ THẬT.**

Thiếu bất kỳ mắt nào ⇒ **KHÔNG PASS**, dù mã có chạy. Đây chính là lỗ mà ma trận hành trình vừa lộ ra: mọi bằng chứng hiện có chứng minh *app phản ứng đúng lúc bấm*, **chưa mẩu nào** chứng minh *việc còn đó sau khi đóng app*.

## ✅ CHỖ ĐỨT CỦA MOAT — **ĐÃ ĐÓNG 04/09** (giữ lại làm bệnh án, đừng đọc như việc đang mở)

Giữ nguyên phần chẩn đoán dưới đây vì nó là **ca mẫu**: chẩn đoán đầu nói *thiếu `entityId`*, đào tới đáy thì bệnh khác hẳn — `mats.floor` là **màu theme gõ cứng**, và **2D đã biết `slab` trong khi 3D không xử lý một dòng nào**. Bài học: *chẩn đoán đầu tiên hiếm khi là bệnh thật.*

## 📋 BỆNH ÁN — chỗ đứt của moat (đã đóng)

Đổi vật liệu **mặt sàn**: BOQ đổi ✅ · deck báo cũ ✅ · **3D KHÔNG HỀ BIẾT** 🔴.
Câu *"một vật, ba chặng"* hôm nay **đúng cho tường và đồ rời, SAI cho mọi mặt hoàn thiện sàn/trần** — mà sàn/trần là phần diện tích lớn nhất của mọi hồ sơ nội thất.

**Chẩn đoán đầu tiên nói thiếu `entityId`. Đào tiếp thì khác, và nặng hơn:**
| Bằng chứng | Nghĩa |
|---|---|
| `lib/three/cad-to-obj.ts:617` | sàn là **bbox nở 50mm của toàn bộ tường**, không `entityId`, không `specId` |
| `lib/three/cad-to-obj.ts:241` | `mats.floor` là **MÀU CỦA THEME gõ cứng** (`#c7c3bb`) — 3D **không đọc vật liệu dự án**, gán gì cũng ra một màu |
| `lib/cad/model.ts:97` | `ElementType` **CÓ `'slab'`** |
| `lib/cad/plan-present.ts:579-581` | chặng **2D đọc thẳng** entity `elementType==='slab'`, ghi rõ *"không suy đoán"* |
| `grep "'slab'" lib/three/cad-to-obj.ts` | **0** |

⇒ **2D biết `slab`. 3D không xử lý một dòng nào.** KHÔNG phải thiếu loại entity, KHÔNG cần đợi `RoomEntity` — loại đã có, 2D đã dùng. Việc là **nối 3D vào đúng cái đã có**, theo khuôn tường ở `:700-712`.
⛔ Giữ `Floor` bbox làm **đường lùi** cho bản vẽ không có `slab`. ⛔ Cấm bịa `entityId` cho `Room_i` — chú thích tại chỗ đã giải thích vì sao id giả ở đó là sai.

## 🔴 LÁT CẮT DỌC MOAT — cổng chặn việc nhân nội dung

Trước khi dựng 24 món 3D, phải chứng minh bằng **vài vật đại diện**:

`Thư viện → 2D → ĐỊNH DANH NGỮ NGHĨA → 3D BuildRecipe → Vật liệu → BOQ/Spec → Trình bày → lưu → ĐÓNG → mở lại → gia phả + định danh CÒN NGUYÊN`

Lát cắt PASS mới được nhân nội dung. Moat chỉ tồn tại trong kiểu dữ liệu/tài liệu mà người dùng **không trải nghiệm được hiệu ứng của nó** ⇒ **CHƯA HOÀN THÀNH**.

## ⬛ BẢN ĐỒ CHUYÊN GIA

| # | Chuyên gia | Sở hữu | Cổng |
|---|---|---|---|
| 01 | **CORE** | dữ liệu · sự thật dự án · định danh · lưu trữ | G1 · G4 |
| 02 | **WORKFLOW** | hành trình nghề đầu-cuối | G2 · G3 · G4 |
| 03 | **AI** | Vitals · khẩu độ · ranh giới người-quyết | G6 |
| 04 | **DESIGN** | UX/UI toàn sản phẩm · chuyển động · kiểm thị giác | G3 · G5 |
| 05 | **ASSET** | thư viện 2D · 3D · vật liệu | G6 |
| 06 | **MEDIA** | Wallgallery · intro · media thương hiệu | G6 |
| 07 | **RELEASE** | QA · hiệu năng · Electron · đóng gói | G7 |

**MAIN giữ tích hợp.** Worker không merge/rebase/đẩy nhánh tích hợp, không đổi quyền sở hữu của chuyên gia khác.

### Dây phụ thuộc chéo — cấm hai chuyên gia giải cùng một biên độc lập
`04 ↔ 06` bố cục Home cần hướng Wallgallery · `04 ↔ 03` Home cần quan hệ với Vitals · `05 ↔ 02` thư viện phải **đặt được vật vào việc thật** · `01 ↔ 02` bằng chứng lưu trữ phụ thuộc định danh an toàn · `02 ↔ 07` bằng chứng hành trình phải sống sót ở môi trường sạch · `01 ↔ 02 ↔ 05` lát cắt moat cắt ngang cả ba.

## ĐANG CHẶN

| # | Mức | Việc | Trạng thái |
|---|---|---|---|
| B1 | **P0** | Mất dữ liệu âm thầm khi vào thẳng deep-link | 🟡 **SỬA XONG-MÁY, CHỜ APP THẬT** — xem dưới |
| B2 | **P2** | Home chưa có hướng được duyệt mắt ⇒ bề mặt lớn nhất của sản phẩm chưa đạt *Product Complete* | 🔵 **ĐANG LÀM** (làn B) |
| B3 | **P2** | Khẩu độ Vitals — ảnh app thật đã sẵn, **chưa được phán** | 🟡 chờ mắt Hoà |
| B4 | **P3** | Đường phát hành: `.idf`/`.idfc` sinh từ máy sạch chưa chạy lại sau khi thu 11 slice | ⬜ chưa mở |

### B1 — trạng thái chi tiết (04/09 16:0x)

**Đã cắm đủ ba đường ghi** qua `danhTinhChoLuot()`: `CadSheets.tsx` · `PresentSheets.tsx` ·
`lib/cad/cad3d-autosave.ts`. Không đẻ đường thứ tư.

Bằng chứng là **số lần ghi xuống đĩa**, không phải lập luận:
```
trước patch  → 0 lần ghi
sau  patch   → 3 lần ghi, đúng khoá
   CadSheets      usr::/cad-editor::prj
   PresentSheets  usr::/present-editor::prj
   autosave 3D    DÙNG CHUNG khoá với CadSheets — không đẻ bucket thứ hai
401 thật     → vẫn 0 lần ghi (không nới cổng chặn để lấy số đẹp)
```
Ca "hình dạng CŨ" giữ lại làm **chốt chống tái phát**: quay về đọc đồng bộ là test đỏ ngay.
Ràng buộc *khối dọn phải đồng bộ* nay có **máy canh** chứ không chỉ lời dặn — ca ⑦ khẳng định
mọi lượt dọn chạy xong trước khi bất kỳ lượt định danh nào về.
4 cổng: `tsc` 0 · `test` 0 · `soi:frontier` 0 lệch · `soi:contract` 0 lệch.

🔴 **VÌ SAO CHƯA ĐÓNG:** *chưa mở app thật một dòng nào.* Test dựng lại **hình dạng** effect bằng
lời gọi hàm trần — chứng minh **cơ chế và thứ tự**, KHÔNG chứng minh React thật chạy đúng vậy.
`UNVERIFIED ≠ PASS`. Còn một hồi quy nhỏ chưa đo: `bucketIdRef.current || userIdRef.current ||
'local'` (tên thư mục backup `.ifpack`) — trên route toàn cục cũ `/cad-editor`, trong cửa sổ chờ
định danh nó rơi về `'local'` thay vì userId.

## KHÔNG CHẶN — phân loại rõ để không ai kéo vào đường tới đích

| Việc | Mức | Vì sao không chặn |
|---|---|---|
| Dời repo khỏi `~/Downloads` | **P4** | **RỦI RO ĐANG ĐIỀU TRA, chưa phải nguyên nhân đã xác định.** Chỉ nâng lên P0 khi có bằng chứng: việc chưa-track biến mất · tệp đã-track hỏng · object git hỏng · tiến trình đồng bộ sửa repo · tệp dataless ảnh hưởng cây làm việc · va chạm hoa-thường ở mã nguồn · build/chạy hỏng do chỗ đặt. Máy chẩn đoán giữ lại, đã giao Hoà, **không tiêu thêm thời gian đường-tới-đích**. Dời chỉ khi: cây sạch · đã đẩy hết · không worker nào chạy · audit phụ thuộc đường dẫn xong · có đường lùi · Hoà duyệt cửa sổ bảo trì |
| 21 lỗ vòng focus còn lại | P4 | trợ năng, không chặn ship; phiếu đã soạn |
| 186 hex viết thẳng | P4 | tuân thủ token, không chặn ship |
| 37 radius ngoài thang | P4 | như trên |
| 2 kho chưa mở (`slide-templates` · `idfc-seed`) | P4 | 0 nơi gọi ⇒ không ai mất gì |
| Đối chiếu di sản | **ĐÓNG** | dùng sổ hiện có; chỉ mở lại mục `RECOVER`/`INVESTIGATE` khi có bằng chứng mới |
| backfill `matId` cho hàng cũ | P3 | cần khi phát hành, không chặn việc hôm nay |

## ĐÃ ĐÓNG HÔM NAY
Rủi ro phát hành *migrations tụt sau schema* (`fd83f343` — đo lại: `migrate deploy` dựng **24/24 bảng**) ·
8 lỗ vòng focus · 2 báo nhầm máy soi · mặt AI thứ hai ở WorkHub (đã ghi luật, chưa gỡ mã).

## ĐỊNH NGHĨA XONG — 10 điều, không thêm
Luồng nghề lõi chạy đầu-cuối · việc đã lưu sống qua tải lại · **0 lỗi P0/P1** · hợp đồng dữ liệu/gia phả
đứng · bề mặt bắt buộc có máy kiểm · bề mặt trải nghiệm lớn **qua mắt Hoà** · đường build/test/phát hành
tái lập được · thẩm quyền và mã khớp nhau · **không năng lực trọng yếu nào chỉ nằm ở nhánh di sản chưa
tích hợp** · cài và chạy được từ nguồn chính tắc.
**KHÔNG cần để xong:** sạch nợ kỹ thuật · sạch nhánh lưu trữ · giải thích trọn lịch sử · hết mọi cảnh báo.
