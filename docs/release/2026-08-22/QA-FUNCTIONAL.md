# QA CHỨC NĂNG — bản Electron 22/08 (Lane B)

> ⏸ **BẢN GIỮ CHỖ — chạy trong lúc HOLD build.** Mọi dòng dưới đây chỉ dùng bằng chứng đã đo
> **TRƯỚC** khi `electron-builder` bắt đầu đóng gói. Dòng nào chưa đo thì ghi `CHỜ GO`, **không
> đoán**. Sau khi MAIN báo GO sẽ chạy nốt và thay bảng này.
>
> 🔴 **Lượt đo lúc 1f gửi HOLD đã dính hỏng và ĐÃ BỊ BỎ**: `Cannot find module './1682.js'` +
> `/files` timeout 90s — đúng bệnh `.next` bị ghi đè khi đang build. Không con số nào từ lượt đó
> được dùng ở đây.

| # | Flow | Status | Evidence | Note |
|---|---|---|---|---|
| 1 | login → Home | **BLOCKED-NEEDS-HUMAN** | — | ⛔ Tôi KHÔNG tự nhập mật khẩu (luật an toàn + luật dự án). MAIN đã đồng ý bỏ qua |
| 2 | Home → Tiếp tục → đúng trạng thái dự án | **BLOCKED-NEEDS-HUMAN** | `/` → chuyển `/intro`; `/api/projects` **401** | cần phiên đăng nhập |
| 3 | project → overview → files | **YELLOW** | `/files` dựng **vỏ app đầy đủ (có rail)**, http 200 | dữ liệu dự án 401 ⇒ phần overview-của-một-dự-án chưa đo được |
| 4 | import / check drawing | **BLOCKED-NEEDS-HUMAN** | — | cần dự án |
| 5 | 2D: mở → vẽ → sửa → **reload → còn** | **BLOCKED-NEEDS-HUMAN** | trong `.app`: `/projects/<id>/cad` dựng **canvas thật + 101 nút**; tầng đĩa có `interiorflow-sheets` + **311** dấu vết `entities/layers/viewport` | ⚠️ vế reload phải làm trong CỬA SỔ `.app` — Playwright không lái được (xem §Giới hạn) |
| 6 | 3D: chọn → biến đổi → sống qua đổi focus | **BLOCKED-NEEDS-HUMAN** | — | cần dự án |
| 7 | Site chain | **GREEN** (dev) | 7 sự thật → `daCu` 3 → `attention` → Detail 4 ô → deep-link → **64.875 → 140.742** → `daCu []` → `calm` | đo trên dev; **chưa đo lại trên `.app`** vì cần dự án |
| 8 | Vitals aperture | **FAIL** (false calm, xem dưới) | `attention` khi có việc · `calm` khi sạch; Peek + Detail đủ 4 ô | như trên |
| 9 | Voice gõ-dự-phòng → ghi chú persist | **GREEN** | đường THÀNH CÔNG (dev): POST + đọc lại khớp nguyên văn, neo đúng dự án · đường **THẤT BẠI** (`:3778`, mã hiện tại): `POST 401` → **hiện dòng báo** *"Chưa ghi được — phiên đăng nhập đã hết. Câu vừa nhập: "ghi chú kiểm lại cao độ trần bếp""* → **nguyên văn lấy lại được** | micro thật vẫn chờ người |
| 10 | Library → thả xuống 2D | **GREEN** (dev) | +41 nét, `srcBlock` đúng mã, 1 cụm | |
| 11 | Present / Review | **BLOCKED-NEEDS-HUMAN** | 🔧 **SỬA 22/08 — RED cũ của tôi là LỖI ÁNH XẠ ROUTE.** Tôi đo `/present-editor` = **bàn thử dev**, không phải mặt sản phẩm. Mặt thật `/projects/<id>/present` dựng **có rail**, 989 ký tự | dữ liệu 401 ⇒ chưa có deck để đo |
| 12 | Settings + avatar | **YELLOW** | `/settings` http 200, vỏ đầy đủ, **4.245 ký tự** nội dung | phần *persistence* của avatar chưa đo (cần phiên) |

**Đếm (bản sửa):** GREEN 4 (đều đo trên **dev**) · YELLOW 2 · **RED 0** · BLOCKED-NEEDS-HUMAN 6

🔧 **Tôi rút RED duy nhất của mình.** Flow 11 RED dựng trên `/present-editor` — đó là **bàn thử dev**,
không phải mặt Present của sản phẩm (`/projects/<id>/present`). MAIN bắt được, tôi đo lại: mặt thật
dựng bình thường, có rail. **Một RED sai còn tệ hơn một dòng BLOCKED trung thực** — nó đổ lỗi cho
thứ không hỏng và làm người đọc mất tin vào cả bảng.

## 🔴 DELTA LỚN NHẤT GIỮA DEV VÀ BẢN ĐÓNG GÓI
**Vỏ app dựng ĐẦY ĐỦ khi CHƯA đăng nhập, nhưng mọi dữ liệu trả 401.**
Đo trên `:3777` bằng hồ sơ trình duyệt SẠCH: 8/10 route (`/files` `/library` `/library/gallery`
`/materials` `/colors` `/tasks` `/projects` `/settings`) **có rail, http 200**; chỉ `/` và
`/present-editor` chuyển về `/intro`. Nhưng `GET /api/projects` = **401**, 0 link dự án.
🔻 **HẠ BẬC theo bằng chứng của MAIN — tôi tự kiểm lại và nhận.** `electron/main.js:426`
`mainWindow.loadURL(getAppUrl())`, mà `getAppUrl()` (`:57-59`) LUÔN trả **gốc** `http://127.0.0.1:<port>/`.
Cửa sổ đóng gói **chỉ mở được ở `/`**, và `/` CÓ chặn (→ `/intro` → đăng nhập). ⇒ Người dùng lần đầu
**KHÔNG rơi vào vỏ rỗng được**; chỉ tới đó bằng điều hướng trong app sau khi phiên chết giữa chừng.
⇒ Là **lỗi hoàn thiện**, KHÔNG phải rủi ro phát hành số một như tôi xếp lúc đầu.
⚠️ Kèm bài học đo: `curl` thấy HTML máy chủ, trình duyệt còn chạy thêm **cổng chặn phía client** —
hai lớp khác nhau. Ai đo sau phải khai mình đo LỚP NÀO.

**Hai chuyển hướng nên biết** (khớp chốt rail 16/08, không phải lỗi): `/library` → `/files` ·
`/colors` → `/materials`.

## ✅ VOICE RỜI `pending-rebuild` — 22/08
Xác minh trên **`:3778`** (bản dựng từ MÃ HIỆN TẠI). Tôi tự kiểm bundle có bản vá trước khi tin:
`if:voice-loi` nằm trong 2 chunk đang phục vụ (`static/chunks/1548-*.js` · `server/chunks/9094.js`).
Phép thử đúng điều bản vá tuyên bố: **POST 401 → phản hồi NHÌN THẤY ĐƯỢC → nguyên văn câu CÒN LẤY
LẠI ĐƯỢC → không mất im lặng.** REAL BROWSER: `pending-rebuild` → **PASS**.

## 🔴 FALSE CALM — TÔI TỪNG GHI ĐÂY LÀ ĐIỂM TỐT. HOÀ BÁC, VÀ HOÀ ĐÚNG.
Đo: `site` = 401 · `projects` = 401 · khẩu độ Vitals = **`calm`**.
Tôi ghi đó là "luật không-đo-không-nói chạy đúng". **SAI.**

**`calm` KHÔNG PHẢI im lặng — nó là một LỜI KHẲNG ĐỊNH:** *"đã kiểm, không có gì cần chú ý."*
Tiền đề đọc dữ liệu đã THẤT BẠI (401) thì lời khẳng định đó **không có gì đỡ** ⇒ **FALSE CALM**.
Cay nhất: tôi khen nó bằng đúng câu mô tả căn bệnh của chính nó — *"nói dối bằng một con số đúng"* —
mà không thấy `calm` cùng một hình dạng.

**Ba trạng thái phải tách bạch, hiện chỉ có hai:**
| Trạng thái | Nghĩa | Có chưa |
|---|---|---|
| `calm` | đã đọc được, và sạch | ✅ |
| im (không tín hiệu) | không có ngữ cảnh để nói | ✅ |
| **không-rõ / không-đọc-được** | tiền đề hỏng (401 · mạng · lỗi) | 🔴 **THIẾU** |

**Đường sửa** (§13): Auth chặn TRƯỚC, HOẶC Vitals vào trạng thái *không dùng được* tường minh.
Sửa **NGỮ NGHĨA TRẠNG THÁI**, không phải sửa cái hiện ra.
Trạng thái dòng này: **FAIL** — lỗ trung thực, không phải lỗi hiển thị.

## 🔴 BA CỔNG, BA NGHĨA — đừng lẫn (MAIN 22/08)
| Cổng | Nghĩa |
|---|---|
| **:3778** | **mã hiện tại** ← xác minh ở đây |
| :3777 | ảnh chụp bản phát hành, ĐÓNG BĂNG ← chỉ tham chiếu, không chứng minh được mã mới |
| :3000 | **HỎNG** — `/` trả 404 trong khi `/files` trả 200 (bệnh hai-dev-server ghi đè `.next`). Mọi số lấy ở đây là RÁC |

## 🔴 LUẬT `pending-rebuild` (MAIN ban 22/08, áp cả hai lane)
`:3777` là **ẢNH CHỤP ĐÓNG BĂNG** lúc build, KHÔNG phải app sống. Bằng chứng: `if:voice-loi` có
**2 lần trong repo**, **0 lần trong gói**. ⇒ Mọi mã sửa sau lúc build **không thể** xác minh ở port
đó. Trạng thái đúng cho mã mới là **`pending-rebuild`**, KHÔNG phải verified — và lane tự sửa
KHÔNG được tự nâng cấp nó lên xanh. MAIN sở hữu build, rebuild theo mốc.

## Giới hạn của người đo — nói thẳng
1. **Tôi không lái được cửa sổ `.app`.** Playwright lái trình duyệt; `.app` là cửa sổ Electron và
   giữ khoá một-thực-thể. IndexedDB của `.app` (userData) ≠ IndexedDB hồ sơ Playwright ⇒ phép thử
   bền dữ liệu **phải do tay người**, và bản vẽ tạo lúc dev **sẽ không xuất hiện** trong `.app` —
   đó là ĐÚNG, không phải lỗi.
2. **Tôi không nhập mật khẩu** ⇒ mọi flow cần dữ liệu dự án đều BLOCKED, không phải RED.
3. 4 dòng GREEN đo trên **dev server**; tôi **không nâng chúng thành GREEN của bản đóng gói**.


---

## 🔴 RỦI RO ĐẶC THÙ ELECTRON — đo từ mã nguồn

### R1 · TRẠNG THÁI CHỈ SỐNG TRONG IndexedDB, KHÔNG CÓ BẢN SAO (nặng nhất)
`lib/sheets-persist.ts` — **`grep 'fetch(|/api/'` = 0**. Không một lời gọi máy chủ nào.
Mà `sheets` chính là nơi **bản vẽ 2D VÀ deck Present** sống (dùng ở `lib/scope.ts` · `lib/resume.ts`
· `lib/save-status.ts` · `lib/boq/from-project.ts`).
⇒ **Xoá dữ liệu duyệt web / đổi hồ sơ Electron / userData bị dọn = mất trắng, không có đường lùi.**
Khớp đúng ca MAIN cũ báo: một deck đã mất theo kiểu này.
Đường thoát DUY NHẤT là `lib/cad/auto-backup.ts` (`showDirectoryPicker`) — nhưng **người dùng phải
tự chọn thư mục trước**, mặc định KHÔNG bật ⇒ người chưa bật thì không có bản sao nào.
Kho khác cùng cảnh: `interiorflow-fonts` (font tự nạp) · `interiorflow-backup`/`interiorflow-root`
(chỉ giữ *handle*, mà handle **không sống qua** lần đóng gói/đổi hồ sơ) · 4 kho tài sản studio qua
`createStudioBlobStore` (`colors/store` · `library/idfc-store` · `present-editor/brand-kit` · `refingest`).

### ~~R2 · Điều hướng cứng `window.location`~~ — ✅ **LOẠI 22/08**
MAIN đo: bản `.app` chạy **`http://127.0.0.1:<port>`**, KHÔNG phải `file://` (spawn Next server thật).
Tôi **tự kiểm lại thay vì nhận suông**, gồm cả 2 chỗ dùng BIẾN mà nhìn lướt không thấy giá trị:
`TASK_BOARD_ROUTE = '/tasks'` (`lib/tasks/focus-entity.ts:21`) · `buildTaskDeepLink` trả
`${base}?focusEntity=…` (`lib/tasks/context.ts:46`). **7/7 đường TƯƠNG ĐỐI, 0 chỗ ghép host**
(`grep 'location.(assign|href).*https?://'` = 0). Deep-link Site an toàn. **Bỏ R2.**

### R3 · OAuth Google/Microsoft — 🔴 **THẬT, GIỮ NGUYÊN** (MAIN xác nhận)
Callback dựng từ `${origin}` ⇒ trong bản đóng gói là `http://127.0.0.1:3777`, **không khớp** redirect
URI nào đã đăng ký ⇒ **đăng nhập OAuth KHÔNG chạy trên desktop**. Email+mật khẩu vẫn chạy.
MAIN ghi là **giới hạn NGOÀI**, không giả vờ có.

### ~~R4 · `window.open` / `_blank`~~ — ✅ **LOẠI**
`setWindowOpenHandler` đã nối sẵn trong `electron/main.js`, định tuyến qua `shell.openExternal`.

### R5 · Hộp thoại tệp — 🟡 chưa kiểm trong bản đóng gói
`showDirectoryPicker` tự khai chạy được trong Electron, **chưa ai xác minh**. Hỏng cái này là mất
luôn đường thoát duy nhất của R1.

### 🆕 R1b · `appId`/`productName` NAY LÀ THỨ CHỊU LỰC CHO DỮ LIỆU NGƯỜI DÙNG
`electron/main.js:118` đặt mọi thứ ghi được vào `app.getPath('userData')` —
mac: `~/Library/Application Support/InteriorFlow` (từ `productName`, `package.json:90`).
**Cả ba** thứ dùng chung số phận ở đó: SQLite `dev.db` · `uploads/` · **IndexedDB của Chromium**.
⇒ Đổi `productName` hoặc `appId` ở bản sau = **userData đổi đường** = người dùng mở lên thấy
TRẮNG TRƠN dù không mất byte nào. Rẻ nhất: coi hai chuỗi đó là **bất biến sau khi phát hành**.
📌 Đo 22/08: thư mục userData **CHƯA TỒN TẠI** ⇒ bản đóng gói chưa từng chạy xong lần nào —
khớp phát hiện của MAIN (app quit ở `prisma db push` vì UNIQUE `ProductSpec.matId`).

### ⚠️ ĐIỀU PHẢI BIẾT TRƯỚC KHI CHẠY PHÉP THỬ BỀN DỮ LIỆU
IndexedDB của bản `.app` nằm trong **userData**, còn IndexedDB tôi đo suốt phiên nằm trong **hồ sơ
Chrome dev**. Hai kho KHÁC NHAU. ⇒ Bản vẽ tạo lúc dev **sẽ KHÔNG xuất hiện** trong `.app` —
đó là ĐÚNG, không phải lỗi. Phép thử chỉ có nghĩa khi **tạo trong chính `.app`** rồi thoát và mở lại.

### R6 · `http://localhost:11434` (Ollama, `lib/ai/providers/ollama.ts:17`)
Có `OLLAMA_BASE_URL` che, và chỉ import phía máy chủ ⇒ **rủi ro thấp**; máy không cài Ollama thì
tụt tầng, không sập.

---

## Đề nghị cho MAIN (không tự làm)
1. **R1 là rủi ro phát hành số một**, không phải lỗi giao diện: nếu bản `.app` đổi thư mục userData
   so với bản dev, người dùng mở lên sẽ thấy **trắng trơn** và tưởng mất hết việc.
   Rẻ nhất trước khi ship: kiểm **một** ca — tạo bản vẽ trong `.app`, đóng, mở lại, còn không.
2. **R2/R3 quyết định bằng một câu hỏi**: app đóng gói chạy `http://localhost` hay `file://`?
   Biết được là loại ngay hai mục.

---

## P5 · AUTH / LOCK / SESSION-ENDED — kiểm trên `:3778` (22/08, Lane B)

### 1 · Hiện mật khẩu — ✅ ĐÚNG THẬT, không phải đổi icon suông
| | `type` thật | icon | nhãn |
|---|---|---|---|
| ẨN | **`password`** | `lucide-eye` | "Xem mật khẩu" |
| HIỆN | **`text`** | `lucide-eye-off` | "Ẩn mật khẩu" |
`type` **thật sự đổi** ⇒ đúng cái bug-shape MAIN cảnh báo (icon đổi mà input không đổi) **KHÔNG có**.
Quy ước là **hướng-hành-động** (icon + nhãn nói bấm vào sẽ làm gì), và `aria-label` khớp icon ở cả
hai trạng thái — nhất quán, đọc được bằng trình đọc màn hình.
*(Chuỗi tôi gõ để thử là chuỗi giả tự đặt, không phải mật khẩu của ai, và không gửi đi.)*

### 2 · VI/EN — **0 rò ở Login**, nhưng CÓ rò ở chỗ khác
`LoginForm.tsx` dùng cơ chế **`lang` prop + `en ? 'EN' : 'VI'`** (15 chỗ), KHÔNG dùng `tr()/useT`.
Đó là lý do **cả hai lượt grep đều trượt**: MAIN tìm chuỗi Anh trần (chúng nằm trong ternary),
tôi tìm `tr()` (sai cơ chế). Kiểm đúng cách (bỏ comment + cửa sổ 3 dòng cho ternary xuống dòng):
**0 chuỗi Việt thiếu cặp EN.** `LockScreen.tsx` dùng `tr()` 6 chỗ ⇒ cũng có VI/EN.
🔴 **RÒ THẬT: `components/studio/SessionWatch.tsx` — `tr()/useT/en?` = 0**, chữ Việt gõ cứng:
*"Phiên đăng nhập đã kết thúc · bản vẽ của bạn vẫn được giữ nguyên tại máy"* · *"Đăng nhập lại"*.
Người dùng EN gặp dải báo tiếng Việt. Grep của MAIN không thấy vì nó tìm **tiếng Anh** trần —
chỗ này rò theo **chiều ngược lại**.
⛔ **KHÔNG SỬA** — `SessionWatch.tsx` ngoài claim của Lane B. Ghi lại để MAIN giao đúng người.

### 3 · LOCK ≠ SESSION-ENDED — hai mặt TÁCH BẠCH trong sản xuất
| | Mặt | Nghĩa |
|---|---|---|
| LOCK | `LockScreen.tsx` | tấm che, việc còn sống phía sau |
| SESSION ENDED | `SessionWatch.tsx` — dải đáy màn, **không chặn thao tác** | phiên đứt |
✅ **Rò ngữ cảnh dự án = 0**: `grep projectId|clientName|tenDuAn|screenshot|toLocaleString|.name` = **0**.
Không tên dự án, không khách, không tệp, không mốc giờ, không ảnh workspace.
✅ Không phải trang 401 đỏ chung chung — dùng token `--panel`/`--border`, giọng trung tính.
⚠️ **Một câu cần MAIN cân**: dải báo nói *"bản vẽ của bạn vẫn được giữ nguyên tại máy"*. Câu này
**đúng về mặt kỹ thuật** (bản vẽ ở IndexedDB phía client, mất phiên không đụng tới) — nhưng nó là
một lời hứa về tính liên tục của việc, và theo **R1** nó chỉ đúng **chừng nào IndexedDB còn**;
bản vẽ **không thuộc dự án nào thì không có bản sao máy chủ** (`CadSheets.tsx:528`). Không phải
lỗi, nhưng là chỗ lời hứa rộng hơn bảo đảm.

**Chưa đo được**: mặt session-ended trên trình duyệt thật — cần một phiên HẾT HẠN, không ép được
bằng máy mà không đăng nhập trước. Giữ BLOCKED-NEEDS-HUMAN.
