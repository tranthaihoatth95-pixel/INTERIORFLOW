# 07 · RELEASE — macOS là đích chính (04/09)

> ⛔ **KHÔNG DÒNG NÀO Ở ĐÂY LÀ "MAC PASS".** Lượt này chạy trong container Linux: **không dựng
> được bản macOS, không mở được app Mac, không ký được**. Mọi kết luận về hành vi trên Mac là
> **suy từ cấu hình + mã**, và được ghi đúng như vậy.

---

## ⓪ Tiền đề — hai chỗ phiếu nói sai, đo tại nguồn mới thấy

**① "≈17 chỗ dùng `ctrlKey` mà không có `metaKey`" — SAI, đó là ảo ảnh của phép đếm theo DÒNG.**
Đếm lại: 26 tệp có `ctrlKey`, 27 tệp có `metaKey`, và **mọi tệp có `ctrlKey` đều có `metaKey`**.
17 dòng "chỉ Ctrl" hoá ra là: chú thích · dữ liệu test · và **cử chỉ chụm trackpad** ở
`lib/input/wheel.ts` — nơi `ctrlKey` do **trình duyệt tự đặt** cho pinch (đúng trên cả macOS lẫn
Windows), thêm `metaKey` vào đó là **làm hỏng**, không phải sửa.
⇒ Cả 50 guard bàn phím đều đã nhận ⌘. **Nhưng phiếu vẫn đúng ở tầng sâu hơn** — xem ⓵.

**② Lỗi ⌘ THẬT nằm ở chỗ khác, và chủ dự án gặp nó mỗi ngày**: **17 nhãn NGƯỜI DÙNG THẤY ghi cứng
"Ctrl+Z"/"Ctrl+V"**. Mỗi lần dựng khối 3D, app in ra *"— Ctrl+Z để lùi"* trên máy Mac. `lib/kbd.ts`
tồn tại từ lâu **đúng để chống chuyện này**, và các chỗ đó đi vòng qua nó.

---

## ① Kiến trúc Mac — `arm64`, và vì sao

**Giữ `arm64`, không thêm `x64`, không `universal`** — vì **chủ dự án xác nhận cả hai máy Mac đều
Apple Silicon**, không phải vì tôi suy đoán.

Chi phí đo được nếu làm khác: `asar: false` + engine Prisma theo kiến trúc ⇒ `@electron/universal`
rơi vào nhánh *"hai thư mục app khác nhau"* (`node_modules/@electron/universal/dist/cjs/index.js:147-168`)
và **nhân đôi cả payload**, kể cả `node_modules` — không phải chỉ nhân đôi phần nhị phân. Gói hiện
338 MB ⇒ universal ≈ gấp đôi, đổi lấy con số 0 người dùng.

**Đây là quyết định CÓ ĐIỀU KIỆN**, không phải vĩnh viễn: ngày có máy Intel thì mở lại bằng một
dòng cấu hình. 🔴 **Và có một cái bẫy đã chặn sẵn**: `prisma/schema.prisma:11` khai
`binaryTargets = ["native", "windows", "linux-arm64…", "linux-musl-arm64…"]` — **không có `"darwin"`**.
Dựng `--mac --x64` từ máy arm64 sẽ ra bản Intel **mở lên nhưng không nối được CSDL**. Không có cách
vá bằng biến môi trường (`PRISMA_CLI_BINARY_TARGETS` chỉ tác động `@prisma/engines` postinstall,
không tác động generator — kiểm bằng grep trong `prisma/build/index.js`), và `prisma/**` nằm ngoài
vùng ghi của phiếu ⇒ tôi **cắm một cổng chặn** trong `release:preflight`: thêm `x64`/`universal` mà
schema chưa có `"darwin"` là **preflight đỏ**.

---

## ② Phím ⌘ — một nguồn, không vá 17 chỗ

Làm theo đúng chỉ đạo giữa lượt (*"chuẩn hoá PrimaryModifier tại một nguồn chung, không vá call-site"*).

**Nguồn: `lib/kbd.ts`.** Điểm khó nhất là **có HAI câu hỏi khác nhau đang bị viết y hệt nhau**, và
tách chúng ra mới là phần có giá trị:

| Hàm | Câu hỏi | Hành vi |
|---|---|---|
| `laPhimChinh(e)` | *"đây có phải phím tắt của mình không?"* | **theo hệ** — macOS chỉ `⌘`; Windows/Linux `Ctrl` (và `⊞`, giữ nguyên thói quen cũ) |
| `coPhimHeThong(e)` | *"người dùng đang giữ phím sửa đổi — mình TRÁNH ĐƯỜNG"* | **luôn nhận cả hai ở mọi hệ** |

Dùng nhầm `laPhimChinh` cho nhánh "tránh đường" là app đi cướp phím của OS. Đã ghi rõ trong docstring.

**Đổi hành vi có chủ ý trên Mac**: trước đây `Ctrl+Z` cũng chạy undo trên máy Mac (vì mọi chỗ viết
`metaKey || ctrlKey`). Nay **không** — đúng quy ước macOS, và nhờ đó `⌃⌘Q` mới tách bạch được.

**Số**: 19 tệp thôi tự viết biểu thức, đọc từ nguồn chung · 17 nhãn đi qua `modKey()` (Mac ra `⌘Z`,
Windows ra `Ctrl+Z`).

**Cố ý GIỮ nguyên, mỗi chỗ có lý do (nay khai thành ngoại lệ máy đọc được, không còn là dòng lạc):**
`⌃⌘Q` khoá màn (cố ý đòi **đồng thời** hai phím) · lấy mẫu clone `⌥`/`⌘` · cử chỉ chụm trackpad ·
`KeyboardEvent` giả cho nút chạm (đặt cả hai cờ nên đúng ở mọi hệ).
**3 tệp `present-editor` còn đọc thô** — lane khác đang giữ, đã khai ngoại lệ **kèm hạn**, không xoá mù.

**Hai cổng chặn tái phát trong `release:preflight`**: nhãn `"Ctrl+…"` không kèm `⌘` · đọc phím thô
ngoài `lib/kbd.ts`. Máy soi **tự loại trừ chính `lib/kbd.ts`** — nó là bộ dịch, buộc phải viết cả hai
nhánh; đây đúng bài học 04/09 (*máy soi quét văn bản phải tự loại mình ra khỏi vùng quét*).

🔴 **Việc di trú làm MÙ một máy canh, và tôi chỉ biết vì `npm test` đỏ.** `components/studio/mot-cho-dung.test.ts:80`
dò `⌘J` bằng mẫu `/metaKey|ctrlKey/`; sau khi chỗ đó viết `laPhimChinh(e)` thì nó đếm ra **0** và
**báo đạt** — kiểu hỏng nguy hiểm nhất của máy soi: không gào lên, chỉ im lặng thôi canh. Đã dạy nó
nhận cả hai cách viết. ⇒ **Luật rút ra: đổi cách viết một biểu thức thì phải đi tìm máy soi nào
đang dò biểu thức đó.**

---

## ③ Sẵn sàng ký — đã thêm gì, ngày có chứng chỉ phải làm mấy bước

Thêm `electron/entitlements.mac.plist` (**4 quyền, mỗi quyền kèm lý do IF thật sự cần**) và
`entitlements.mac.inherit.plist` (**hẹp hơn** cho tiến trình con — renderer không cần nạp thư viện
gốc ngoài gói, không cần biến môi trường). **Không** bật App Sandbox, và vì không sandbox nên
**không phải khai quyền tệp/mạng** — đó là lý do danh sách ngắn. Chép một tệp entitlements đầy quyền
là hạ bảo mật của chính mình.

Quyền đáng nói nhất là `disable-library-validation`: Prisma nạp engine `.node` từ `extraResources`,
tức **ngoài phạm vi chữ ký của gói**. Thiếu nó thì macOS từ chối nạp và app mở lên **không nối được
CSDL** — đúng kiểu hỏng âm thầm khó chẩn nhất.

Kèm `hardenedRuntime: true` + `gatekeeperAssess: false`.

**Ngày có Developer ID: đúng 3 bước, 0 dòng mã** — ① cài chứng chỉ vào Keychain ② đặt `APPLE_ID` ·
`APPLE_APP_SPECIFIC_PASSWORD` · `APPLE_TEAM_ID` ③ đổi `build.mac.notarize` `false` → `true`.

`identity: null` **không quay lại được** — preflight chặn (nó bắt electron-builder bỏ ký **kể cả khi
máy CÓ chứng chỉ**, đúng cái bẫy lượt trước đã gỡ).

**Ký mã KHÔNG phải blocker** theo chốt 04/09; điều kiện là **T11** (máy B mở được bản dựng trực
tiếp) — chưa ai đo. `G5` §M3 đã hạ cấp theo đúng chốt này.

---

## ④ Gỡ cài đặt có xoá việc thiết kế không — **trả lời dứt khoát**

Việc thiết kế nằm ở `<userData>`: `dev.db` · `uploads/` · `backups/` (`electron/main.js:124,127,166`).

### Windows — **KHÔNG xoá**, ba lớp bảo vệ, đọc thẳng từ khuôn NSIS

| | Bằng chứng |
|---|---|
| Lệnh xoá chỉ chạy trong một nhánh có điều kiện | `templates/nsis/uninstaller.nsh:214` `${if} $isDeleteAppData == "1"` → `RMDir /r "$APPDATA\…"` `:219,221,225` |
| Cờ bật khi nào | `:203` cờ `--delete-app-data`, **hoặc** `:205` khi `DELETE_APP_DATA_ON_UNINSTALL` được định nghĩa **và** không phải bản nâng cấp |
| Định nghĩa đó chỉ sinh khi bật tuỳ chọn | `out/targets/nsis/NsisTarget.js:435-437` `if (options.deleteAppDataOnUninstall)` |
| Ta có bật không | **Không** — và nay đã ghi **tường minh** `deleteAppDataOnUninstall: false` để không bị đổi ngầm |

**Nâng cấp / cài lại**: bộ cài chạy trình gỡ cũ với `--updated` chứ không phải `--delete-app-data`
(`include/installUtil.nsh:204-205`, chú thích tại chỗ nói rõ mục đích là *"để dữ liệu người dùng
KHÔNG bị xoá"*), và ngay cả khi cờ kia bật thì `:206` `${ifNot} ${isUpdated}` cũng chặn.

🟡 **CHƯA CHẮC — nói thẳng**: `installUtil.nsh:202` `${if} ${isDeleteAppData}` quyết định truyền cờ
nào, mà grep toàn `app-builder-lib` thì **định danh đó không được định nghĩa ở đâu khác**. Ba lớp
trên đủ để tin là an toàn, **nhưng niềm tin không phải phép đo** ⇒ đã thành mục **W1/W2** trong G7,
phải chạy trên máy Windows thật.

### macOS — **KHÔNG xoá, và rủi ro ngược lại**
macOS không có trình gỡ cài đặt; kéo `.app` vào Thùng rác **không đụng** `~/Library/Application Support/…`.
⇒ Vấn đề ở đây là **thiếu đường xoá sạch CÓ CHỦ Ý** — đúng vế *"hành động riêng, người dùng chủ động
chọn"* của bất biến. **Hiện chưa có.** Ghi thành việc, không phải lỗi chặn phát hành.

### 🔴 Một lệch đã đo, chưa sửa — **tên thư mục dữ liệu chưa chắc chắn**
`package.json` **không có `productName` ở mức trên cùng**, chỉ `name: "interiorflow"` (chữ thường) và
`build.productName: "InteriorFlow"`. Electron lấy tên từ `Info.plist` trên macOS nhưng từ
`package.json` trên Windows ⇒ **hai nền có thể ra hai tên thư mục khác nhau**; chú thích
`main.js:119` ghi `%APPDATA%/InteriorFlow` **có thể sai**. Trên macOS hai tên trùng nhau chỉ vì APFS
mặc định không phân biệt hoa-thường — **may, không phải đúng**.
**Cố ý KHÔNG tự sửa**: ghim thư mục bằng `app.setName`/`setPath` sẽ **dời chỗ dữ liệu của người đang
dùng**. Phải đo tên thật trên máy trước (script đã lo), rồi mới quyết.

### Dữ liệu có bị giam trong `userData` không — **KHÔNG**
Đường lấy việc thiết kế ra **có thật và bấm được từ giao diện**: mục `.idf` trong menu xuất
(`components/cad/CadEditor.tsx:713` — *"TẤT CẢ sheet + metadata, để backup/chia sẻ"*), tải tệp ở
`CadSheets.tsx:713`, phím `⌘⇧S` ở `CadCanvas.tsx:2703`, và nút *"Xuất .idfc"* ở
`LibrarySheet.tsx:1135`. 🟡 **Chưa ai bấm thử trên Mac** ⇒ mục **T12** trong G7 (xuất ở máy A, mở lại
ở máy B).

---

## ⑤ Cắt gói — engine của hệ khác

🔴 **Tìm ra một lỗi cấu hình thật, không phải chỉ dọn cho gọn**: `files` viết cẩn thận
`!node_modules/.prisma/client/libquery_engine-linux-*`, nhưng `extraResources` chép **nguyên** thư
mục `.prisma` ⇒ **hoàn tác đúng những dòng loại trừ đó**. Và `query_engine-windows.dll.node` (21 MB)
thì **không dòng nào loại**, nên nó theo vào cả bản Mac.

Suýt sửa sai: `getFileMatchers()` (`app-builder-lib/out/fileMatcher.js:241-244`) **GỘP**
`build.extraResources` với `build.<nền>.extraResources`, **không thay thế** — nếu để lại bản dùng
chung thì bộ lọc theo nền thành vô nghĩa. ⇒ **bỏ hẳn bản dùng chung**, mỗi nền khai riêng, mỗi bộ
cài chỉ mang engine của hệ nó. An toàn theo cấu tạo: một app Mac không bao giờ nạp được `.dll.node`
của Windows.

**Đã chứng minh bằng bản dựng thật**: `npx electron-builder --linux dir` **rc=0** (cấu hình không
vỡ), và trong gói Linux `query_engine-windows.dll.node` **đã biến mất** — trước đó nó có mặt.
Ước cho bản Mac: bỏ được windows 21 MB + linux-arm64 15,6 MB + linux-musl-arm64 15,7 MB ≈ **52 MB**.
🟡 **Con số Mac là ƯỚC**, tính từ kích thước engine đo trên Linux; **chưa dựng bản Mac lần nào**.
(Sản phẩm dựng đã xoá, không commit.)

---

## ⑥ Bộ nghiệm thu Mac

`docs/delivery/G7-NGHIEM-THU-MAC.md` — **một mạch T1→T12**, không phải bảng kiểm bấm lẻ:
dựng arm64 → mở → biểu tượng → đăng nhập → dự án → **2D/3D/vật liệu/trình chiếu** → Vitals →
**lưu · THOÁT HẲN · mở lại · cùng một sự thật** → **quy ước ⌘** → trackpad/Retina/cửa sổ/nhiều
màn/ngủ-thức → **máy B** → **xuất `.idf`/`.idfc` và mở lại ở máy B**. Mỗi mục có **thao tác · dấu
hiệu ĐẠT · dấu hiệu TRƯỢT**, viết cho người dùng Mac chứ không cho lập trình viên.
**Ước cả lượt 45–60 phút.**

Ba dự đoán ghi sẵn để lượt chạy thật đối chiếu, **không phải để tự trấn an**:
- **T3 biểu tượng nhiều khả năng TRƯỢT** — `electron/icons/icon.png` là `1024×1024 8-bit **RGB**`,
  **không có kênh trong suốt**; macOS cần RGBA, icon đặc sẽ đọc ra như ô vuông. Việc **thị giác** ⇒
  không tự đổi.
- **T7 Vitals nhiều khả năng TRƯỢT** — lỗi mồ côi đã ghi trong sổ 04/09, không phải phát hiện mới.
- **T9 `⌃⌘Q`** — trên macOS đây cũng là khoá màn của **hệ điều hành**, nhiều khả năng OS nuốt trước.
  Đó là **quyết định sản phẩm** (đổi phím hay bỏ), không phải lỗi tự sửa.

`scripts/nghiem-thu-mac.sh` làm phần máy làm được (kiến trúc · chữ ký · hardened runtime · engine
thừa · chỗ dữ liệu). **Đầu tệp ghi rõ: CHƯA TỪNG CHẠY.** Ở đây chỉ kiểm được hai điều: `bash -n`
rc=0, và nó **từ chối chạy trên Linux** (rc=2) — đúng thiết kế.

---

## ⑦ Máy kiểm

| | |
|---|---|
| `npx tsc --noEmit` | **rc=0** |
| `npm test` | **rc=0** — 0 fail (lần đầu rc=123 vì tôi làm mù `mot-cho-dung`; đã sửa mẫu dò) |
| `npm run release:preflight` | **rc=0** — kèm 4 cổng mới (kiến trúc↔engine · sẵn-sàng-ký · nhãn phím · phím thô) |
| `npx electron-builder --linux dir` | **rc=0** — cấu hình không vỡ |

---

## ⑧ CHƯA CHẮC / CHƯA KIỂM — **mọi thứ thuộc hành vi Mac đều CHƯA CHẠY**

- **Chưa dựng bản macOS. Chưa mở app Mac. Chưa ký. Chưa chạy Gatekeeper.** Toàn bộ ①③⑥ là suy luận.
- **Entitlements chưa xác thực bằng lần mở thật** — 4 quyền là bộ chuẩn Electron + Node suy từ mã
  (app sinh tiến trình con, nạp engine gốc ngoài gói). Thiếu hay thừa chỉ biết khi mở app trên Mac.
- **52 MB là ƯỚC**, tính từ engine đo trên Linux, không phải đo trên bản Mac.
- **Windows: W1/W2 chưa chạy** — kết luận "gỡ cài không xoá" là đọc mã khuôn NSIS, và còn một nhánh
  `${isDeleteAppData}` chưa truy đến cùng.
- **macOS: M1 chưa chạy.**
- **Tên thư mục `userData` chưa đo trên máy thật** — có thể lệch giữa hai nền.
- **T12 (`.idf`/`.idfc`) chưa bấm thử trên Mac** — mới xác nhận nút và đường tải tồn tại trong mã.
- Ba tệp `present-editor` còn đọc phím thô — cố ý, lane khác đang giữ.
- `scripts/nghiem-thu-mac.sh` **chưa chạy trên macOS lần nào**; lần chạy đầu cũng là lần kiểm chính nó.
