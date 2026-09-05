# G7 · NGHIỆM THU BẢN macOS — đi MỘT MẠCH

> 🔴 **Electron dựng xong KHÔNG phải Mac PASS. PASS là dùng được IF như một ứng dụng desktop thật.**
>
> ⛔ **Toàn bộ tệp này CHƯA TỪNG CHẠY.** Nó soạn trong container Linux — nơi **không dựng được bản
> macOS, không mở được app Mac, không ký được**. Mọi câu ở đây là **suy từ cấu hình + mã**. Không có
> dòng nào trong tệp này được coi là ĐẠT cho tới khi có người chạy trên máy Mac thật.

---

## Cách dùng — một lượt, không bấm lẻ

Đây **không phải bảng kiểm để tick rời rạc**. Đó là **một mạch dùng thử**: dựng → mở → làm việc thật →
thoát hẳn → mở lại → xem có còn đúng một sự thật không. Bấm lẻ từng mục thì bỏ sót đúng loại lỗi đắt
nhất — loại chỉ lộ ra khi đi hết chuỗi.

| | |
|---|---|
| Thời gian cả lượt | **45–60 phút** (dựng ~5-10 phút, dùng thật ~35-45 phút, hai máy thêm ~10 phút) |
| Cần | máy **A** (Apple Silicon, máy dựng) · máy **B** (Apple Silicon, sạch) · một dự án có việc thật |
| Trước khi bắt đầu | `bash scripts/nghiem-thu-mac.sh` — máy đo phần máy đo được rồi mới tới tay |

Ghi kết quả ngay tại chỗ, ba mức: **ĐẠT** · **TRƯỢT** (kèm ảnh chụp màn) · **KHÔNG THỬ ĐƯỢC** (kèm lý do).
Mục nào TRƯỢT thì **đi tiếp cho hết mạch** rồi mới quay lại — dừng giữa chừng là mất phần cuối, mà
phần cuối (thoát-mở-lại) mới là phần trả lời câu quan trọng nhất.

---

## MẠCH CHÍNH

### T1 · Dựng bản arm64
**Làm:** `npm run electron:build:mac`
**ĐẠT:** kết thúc không lỗi; có `dist-installer/InteriorFlow-*.dmg` và `dist-installer/mac-arm64/InteriorFlow.app`.
**TRƯỢT:** dừng giữa chừng · không ra `.dmg` · báo thiếu công cụ ký.
> Chưa có Developer ID thì electron-builder ký **ad-hoc** và vẫn ra được `.dmg` — **đó là kỳ vọng
> của lượt này, không phải lỗi.** Nếu nó *dừng lại* vì thiếu chứng chỉ thì mới là trượt.

### T2 · Mở app lần đầu trên máy A
**Làm:** mở `.dmg`, kéo InteriorFlow vào Applications, mở từ Applications (**không** mở thẳng trong ảnh đĩa).
**ĐẠT:** cửa sổ hiện trong **dưới 10 giây**, không nền trắng loé, có menu InteriorFlow trên thanh menu.
**TRƯỢT:** *"ứng dụng bị hỏng"* · quay bánh xe rồi tắt · **nền trắng loé rồi mới ra giao diện tối** ·
cửa sổ hiện mà nội dung trống mãi (máy chủ nội bộ chưa lên).
> Máy A là **máy vừa dựng** nên Gatekeeper thường cho qua. Máy B mới là phép thử thật — xem **T11**.

### T3 · Biểu tượng trên Dock
**Làm:** nhìn biểu tượng ở Dock và trong Finder.
**ĐẠT:** biểu tượng có hình dạng bo tròn kiểu app Mac, nền trong suốt ở góc.
**TRƯỢT:** **một ô vuông đặc** không bo góc.
> 🔴 **Đây là chỗ đã đo được và nhiều khả năng TRƯỢT**: `electron/icons/icon.png` là
> `1024×1024, 8-bit/color **RGB**` — **không có kênh trong suốt**. macOS yêu cầu RGBA; icon đặc sẽ
> đọc ra như ô vuông. Cần một `.icns`/PNG có alpha. Đây là **việc thị giác** ⇒ để chủ dự án phán,
> không tự đổi.

### T4 · Đăng nhập
**Làm:** đăng nhập bằng tài khoản thật.
**ĐẠT:** vào được; đóng app rồi mở lại **không phải đăng nhập lần nữa**.
**TRƯỢT:** đăng nhập xong màn trắng · mỗi lần mở lại phải nhập lại.

### T5 · Mở một dự án có việc thật
**Làm:** từ Home vào một dự án **đã có bản vẽ**, không phải dự án rỗng.
**ĐẠT:** vào đúng chỗ đang dở; nội dung hiện đủ.
**TRƯỢT:** danh sách rỗng dù dữ liệu có · vào rồi mà canvas trắng.

### T6 · Đi hết bốn mặt làm việc
**Làm, theo đúng thứ tự này, mỗi chặng làm **một thay đổi thật**:**
1. **2D** — vẽ một đoạn tường, đo một kích thước.
2. **3D** — dựng/đùn một khối, xoay góc nhìn.
3. **Vật liệu** — mở kho, gán một vật liệu cho một mặt.
4. **Trình chiếu** — mở hồ sơ, chỉnh một trang.

**ĐẠT:** cả bốn mở được, thao tác ăn, không đơ quá 1 giây mỗi lần bấm.
**TRƯỢT:** chặng nào không mở · thao tác không ăn · quay bánh xe lâu.
> Đây là chỗ **quy ước ⌘** phải đúng — xem T9. Vừa làm vừa để ý, đừng tách thành lượt riêng.

### T7 · Vitals
**Làm:** mở Vitals ở mép trên, hỏi một câu.
**ĐẠT:** mở ra, nhận câu hỏi, trả lời hoặc báo rõ vì sao không trả lời được.
**TRƯỢT:** **gõ câu hỏi rồi Enter mà mất câu hỏi** · `⌘J` không làm gì.
> 🔴 Đây là **lỗi đã biết đang sống** (đo 04/09): panel Vitals mồ côi, `⌘J` đăng ký ở nơi không còn
> được mount. Nếu vẫn trượt thì **đúng như dự kiến**, không phải phát hiện mới — ghi lại rồi đi tiếp.

### T8 · LƯU · THOÁT HẲN · MỞ LẠI — **mục quan trọng nhất cả lượt**
**Làm:**
1. Lưu (`⌘S`).
2. **Thoát hẳn** — `⌘Q`, hoặc chuột phải biểu tượng Dock → Thoát. **Đóng cửa sổ bằng nút đỏ là CHƯA thoát** trên macOS.
3. Kiểm biểu tượng đã biến mất khỏi Dock.
4. Mở lại từ Applications.
5. Vào lại đúng dự án đó.

**ĐẠT:** **mọi thay đổi ở T6 còn nguyên** — tường còn đó, khối còn đó, vật liệu còn gán, trang hồ sơ
còn sửa. Và **cùng một sự thật ở cả bốn mặt**: vật liệu đổi ở 3D thì bảng vật liệu ở Trình chiếu
cũng đúng theo.
**TRƯỢT:** mất bất kỳ thay đổi nào · mỗi chặng nói một con số khác nhau · phải bấm "tải lại" mới đúng.
> Đây là chỗ trả lời câu *"IF có giữ được sự thật thiết kế không"*. Trượt ở đây thì mọi mục khác
> đạt cũng không cứu được.

### T9 · Quy ước ⌘ và bàn phím Mac
**Làm, thử đúng bằng phím ⌘ (KHÔNG dùng Ctrl):**

| Phím | Phải xảy ra |
|---|---|
| `⌘Z` / `⌘⇧Z` | hoàn tác / làm lại |
| `⌘C` `⌘V` | chép / dán đối tượng đang chọn |
| `⌘A` | chọn tất cả |
| `⌘S` | lưu |
| `⌘K` | mở bảng lệnh |
| `⌘1` `⌘2` `⌘3` | sang 2D · 3D · Trình chiếu |
| `⌘/` | bảng tra phím tắt |
| `⌘,` | mở Cài đặt (quy ước macOS) |
| trong ô nhập chữ: `⌘C` `⌘V` `⌘A` `⌘Z` | phải ăn như mọi app Mac |

**ĐẠT:** tất cả ăn bằng ⌘. **Và mọi nhãn phím tắt trong app hiện `⌘…`, KHÔNG hiện "Ctrl+…"** —
đặc biệt câu trạng thái sau khi dựng khối 3D (*"— ⌘Z để lùi"*).
**TRƯỢT:** phím nào không ăn · **nhãn nào còn ghi "Ctrl+"** · `⌘,` không mở Cài đặt.
> `⌃⌘Q` (Ctrl+⌘+Q) là **khoá màn của IF**. Trên macOS tổ hợp này cũng là **khoá màn của hệ điều
> hành** ⇒ nhiều khả năng macOS nuốt trước, IF không nhận được. **Thử và ghi rõ**: máy khoá mà IF
> *bên dưới* có khoá theo không? Nếu không thì đây là **quyết định sản phẩm** (đổi phím hay bỏ),
> không phải lỗi để tự sửa.

### T10 · Chất Mac — trackpad · Retina · cửa sổ · ngủ/thức
**Làm nhanh, mỗi mục vài giây:**

| Mục | ĐẠT | TRƯỢT |
|---|---|---|
| Chụm 2 ngón trên canvas | phóng to/thu nhỏ mượt | không ăn · giật · phóng cả trang web |
| Vuốt 2 ngón | cuộn/kéo canvas theo tay | ngược chiều · nhảy |
| Retina | chữ và nét **sắc**, không rỗ | chữ mờ, viền răng cưa |
| Kéo mép cửa sổ | bố cục co giãn theo, không vỡ | panel đè nhau · chữ tràn |
| Toàn màn hình (nút xanh) | vào/ra êm, không mất thanh công cụ | mất phần điều khiển · kẹt |
| Hai màn hình | kéo cửa sổ sang màn kia, vẫn sắc và đúng cỡ | mờ đi · phần tử lệch chỗ |
| Ngủ/thức | gập máy ~1 phút rồi mở: app còn nguyên trạng | mất kết nối máy chủ nội bộ · phải mở lại |
| Hộp chọn tệp | mở đúng hộp Finder chuẩn | hộp lạ · không mở |
| Kéo-thả tệp từ Finder vào app | nhận tệp | không nhận |
| Bảng nhớ tạm | chép trong app → dán ra ngoài; và ngược lại | một chiều · rỗng |

### T11 · MÁY B — chỗ Gatekeeper thật sự lộ mặt
**Làm:** chép **đúng tệp `.dmg`** sang máy B (AirDrop hoặc USB — **không** chép qua đường tự giải nén),
cài, mở.
**ĐẠT:** mở được (có thể phải chuột phải → Mở lần đầu).
**TRƯỢT:** *"InteriorFlow bị hỏng và không thể mở"* · *"không mở được vì Apple không thể kiểm tra"*
mà **không có cách nào qua**.
> 🔴 **Đây là mục quyết định việc ký mã có phải blocker hay không.** Nếu máy B mở được (kể cả phải
> chuột phải lần đầu) thì **ký mã là việc SAU**, không chặn. Nếu máy B **không có đường nào mở
> được** thì ký mã trở thành blocker — và lúc đó mới bàn, có bằng chứng.
> Sau khi mở được: **đăng nhập trên máy B, mở dự án, lưu, thoát, mở lại.** Mục đích là bắt **phụ
> thuộc ngầm vào máy dev** — thứ chỉ chạy vì máy A có sẵn công cụ mà máy B không có.

### T12 · Dữ liệu thiết kế có cầm đi được không
**Làm:**
1. Trong chặng 2D: menu xuất → chọn **`.idf`** (hoặc `⌘⇧S`). Lưu tệp ra Desktop.
2. Mở kho Thư viện, chọn một cấu kiện → nút **"Xuất .idfc"**.
3. Mở tệp `.idf` vừa xuất **trên máy B**.

**ĐẠT:** cả hai tệp ra được, và `.idf` mở lại trên máy B ra **đúng bản vẽ đó**.
**TRƯỢT:** không tìm thấy đường xuất · tệp ra rỗng · mở trên máy B thì lệch/hỏng.
> Mục này trả lời câu **"dữ liệu thiết kế có bị giam trong thư mục nội bộ của Electron không"**.
> Đo được trong mã: đường xuất **có thật và bấm được từ giao diện** — mục `.idf` trong menu xuất
> (`components/cad/CadEditor.tsx:713`, ghi rõ *"TẤT CẢ sheet + metadata, để backup/chia sẻ"*),
> tải tệp ở `components/cad/CadSheets.tsx:713`, phím `⌘⇧S` ở `components/cad/CadCanvas.tsx:2703`,
> và nút *"Xuất .idfc"* ở `components/library/LibrarySheet.tsx:1135`. **Chưa ai bấm thử trên máy
> Mac** — T12 là lần đầu.

---

## SAU KHI ĐI HẾT MẠCH — ba câu phải trả lời được

1. **Dùng được như một app Mac thật chưa?** (không phải "dựng xong chưa")
2. **Có mất việc thiết kế ở bước nào không?** — nếu có, đó là chặn phát hành, không thương lượng.
3. **Máy B có mở được không?** — quyết định ký mã là blocker hay việc sau.

---

## PHỤ LỤC · BẤT BIẾN DỮ LIỆU — phần mềm ≠ việc thiết kế của người dùng

> Nâng cấp · cài lại · gỡ cài đặt **thông thường** đều KHÔNG được âm thầm xoá dự án.
> Xoá sạch chỉ được xảy ra qua **một hành động riêng, người dùng chủ động chọn, gọi đúng tên là xoá**.

### Việc thiết kế nằm ở đâu
`electron/main.js:119` lấy `app.getPath('userData')`, và **cả CSDL lẫn tệp tải lên đều nằm trong đó**:
`<userData>/dev.db` (`:127`) · `<userData>/uploads/` (`:124`) · `<userData>/backups/` (`:166`).
- **macOS:** `~/Library/Application Support/<tên app>`
- **Windows:** `%APPDATA%\<tên app>`

⚠️ **`<tên app>` chưa chắc chắn, phải đo trên máy thật.** `package.json` **không có `productName` ở
mức trên cùng**, chỉ có `name: "interiorflow"` (chữ thường) và `build.productName: "InteriorFlow"`.
Electron lấy tên theo `Info.plist` trên macOS nhưng theo `package.json` trên Windows ⇒ **hai nền có
thể ra hai tên thư mục khác nhau**. Chú thích ở `main.js:119` ghi `%APPDATA%/InteriorFlow` — **có
thể sai**, thực tế có thể là `%APPDATA%\interiorflow`. Trên macOS thì hệ tệp mặc định không phân
biệt hoa-thường nên hai tên trùng nhau, **may chứ không phải đúng**.
⇒ **Việc phải làm ở lượt chạy thật:** mở app rồi chạy lại `scripts/nghiem-thu-mac.sh` để đọc tên thư
mục THẬT, rồi sửa chú thích cho khớp. **Đừng tự đổi tên thư mục** — đổi là dời chỗ dữ liệu của người
đang dùng.

### Windows — gỡ cài đặt có xoá không?

**KHÔNG, ở cấu hình hiện tại.** Bằng chứng đọc thẳng từ khuôn cài đặt của electron-builder:

| Bước | Bằng chứng |
|---|---|
| Lệnh xoá dữ liệu chỉ chạy trong một nhánh có điều kiện | `app-builder-lib/templates/nsis/uninstaller.nsh:214` — `${if} $isDeleteAppData == "1"` mới tới `RMDir /r "$APPDATA\…"` ở `:219,221,225` |
| Cờ đó bật khi nào | `:203` cờ dòng lệnh `--delete-app-data`, **hoặc** `:205` khi `DELETE_APP_DATA_ON_UNINSTALL` được định nghĩa **và** không phải bản nâng cấp |
| Định nghĩa đó chỉ sinh ra khi bật tuỳ chọn | `app-builder-lib/out/targets/nsis/NsisTarget.js:435-437` — `if (options.deleteAppDataOnUninstall) { defines.DELETE_APP_DATA_ON_UNINSTALL = null }` |
| Ta có bật không | **Không.** Và 04/09 đã ghi **tường minh** `"deleteAppDataOnUninstall": false` trong `package.json` — mặc định vốn đã là false, viết ra để (a) nói rõ ý định (b) không bị đổi ngầm nếu electron-builder đổi mặc định |

**Nâng cấp đè bản cũ:** an toàn **hai lớp** — bộ cài chạy trình gỡ cũ với cờ `--updated` chứ không
phải `--delete-app-data` (`include/installUtil.nsh:204-205`, chú thích ngay tại chỗ nói rõ mục đích là
*"để dữ liệu người dùng KHÔNG bị xoá"*), và ngay cả khi cờ kia có bật thì `:206` cũng chặn bằng
`${ifNot} ${isUpdated}`.

**Cài lại (cài đè cùng phiên bản):** đi đúng đường nâng cấp ở trên ⇒ giữ dữ liệu.

🟡 **CHƯA CHẮC — phải thử trên máy Windows thật:** còn **một nhánh chưa truy đến cùng**.
`include/installUtil.nsh:202` có `${if} ${isDeleteAppData}` quyết định bộ cài truyền `--delete-app-data`
hay `--updated` cho trình gỡ cũ. Grep toàn bộ `app-builder-lib` thì **định danh `isDeleteAppData`
không được định nghĩa ở đâu khác** — nên chưa khẳng định được nó luôn sai. Ba lớp bảo vệ trên đủ để
tin là an toàn, **nhưng niềm tin không phải phép đo**: mục W1 dưới đây là phép đo.

### macOS — kéo vào Thùng rác có xoá không?

**KHÔNG.** macOS không có trình gỡ cài đặt; kéo `.app` vào Thùng rác chỉ xoá gói ứng dụng.
`~/Library/Application Support/…` **không bị đụng tới** — đó là lý do máy Mac hay còn dữ liệu của app
đã gỡ từ lâu.
⇒ Ở macOS, rủi ro **ngược lại**: dữ liệu ở lại mà **không có đường nào trong app để xoá sạch có chủ ý**.
Đó chính là *"hành động riêng, người dùng chủ động chọn"* mà bất biến đòi hỏi — **hiện chưa có**,
ghi thành việc, không phải lỗi chặn phát hành.

### Ba phép đo phải làm trên máy thật (chưa ai làm)

| # | Làm gì | ĐẠT |
|---|---|---|
| **W1** | Windows: cài → tạo một dự án → **gỡ qua Cài đặt › Ứng dụng** → mở `%APPDATA%` | thư mục dữ liệu **còn**, `dev.db` còn nguyên cỡ |
| **W2** | Windows: cài bản cũ → tạo dự án → cài đè bản mới → mở app | dự án **còn**, và có thư mục `backups/<mốc>-before-<bản cũ>` |
| **M1** | macOS: dùng app → kéo vào Thùng rác → cài lại → mở | dự án **còn nguyên** |

Trượt bất kỳ mục nào ⇒ **P0, chặn phát hành** — đó là mất việc thiết kế, không phải chuyện tiện dụng.

---

## PHỤ LỤC · KÝ MÃ — sẵn sàng, chưa phải cổng chặn

Đã chuẩn bị (04/09) để ngày có chứng chỉ **không phải sửa mã**:
- `electron/entitlements.mac.plist` — 4 quyền, **mỗi quyền kèm lý do IF cần nó**; không bật App Sandbox.
- `electron/entitlements.mac.inherit.plist` — bộ hẹp hơn cho tiến trình con.
- `build.mac.hardenedRuntime: true` · `gatekeeperAssess: false` (khỏi bị chặn lúc dựng khi chưa ký).
- `npm run release:preflight` **chặn** nếu ai đó gỡ `hardenedRuntime`, gỡ entitlements, hoặc đưa
  `identity: null` quay lại (`identity: null` bắt electron-builder **bỏ ký kể cả khi máy CÓ chứng chỉ**).

**Ngày có Developer ID phải làm đúng 3 bước, 0 dòng mã:**
1. Cài chứng chỉ *Developer ID Application* vào Keychain của máy dựng.
2. Đặt biến môi trường cho công chứng: `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`.
3. Đổi `build.mac.notarize` `false` → `true`, rồi dựng lại.

**Ký mã KHÔNG phải blocker của lượt này** — điều kiện là **T11 đạt**: máy B mở được bản dựng trực
tiếp. T11 trượt thì lúc đó ký mã mới thành blocker, và khi đó đã **có bằng chứng**, không phải giả định.
