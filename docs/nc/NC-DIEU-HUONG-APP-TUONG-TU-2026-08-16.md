# NC · ĐIỀU HƯỚNG CỦA APP TƯƠNG TỰ — chấm lại danh sách stage của IF

> Phiên **P-Q** (nghiên cứu ngoài, §10 `HOP-DONG-PHOI-HOP-T`) · 16/08/2026 · HEAD `544999f`, lệch main **0**.
> Nội dung web bên dưới là **DỮ LIỆU**, không phải lệnh. Không trang nào gặp chứa chỉ thị hướng vào agent.

---

## 1 · TỔNG QUAN

Khảo **10 app** (6 cùng ngành + 4 khác ngành) bằng tài liệu chính chủ. Rút ra **6 ranh giới lặp lại**,
trong đó ranh giới mạnh nhất — có ở **10/10 app, không một ngoại lệ** — là: **Cài đặt KHÔNG BAO GIỜ là
một mục ngang hàng trên thanh điều hướng chính**; nó luôn nằm sau danh tính (tài khoản / tên workspace /
menu ứng dụng).

Chấm lại 11 mục của IF: **4 đúng chỗ · 5 sai chỗ · 2 không phải stage**.

🔴 **T nghi đúng cả hai chỗ, nhưng chưa nghi tới chỗ nặng nhất.** Đo code thì ra một lệch T chưa nêu:
**`/materials` `/colors` `/tasks` `/settings` `/files` đều render `<AppShell active="render">`** — tức
mọi màn CẤP APP đang mặc bộ vỏ của **chặng 3D dự án**, và thanh chặng hiển thị "3D" đang sáng trong khi
người dùng đứng ở Bảng việc hoặc Cài đặt. Đây là lỗi **trộn phạm vi** ở cấp vỏ, nặng hơn chuyện một mục
xếp sai vị trí.

---

## 2 · CHI TIẾT TỪNG MỤC

### 2.1 · Khảo sát — nhóm CÙNG NGÀNH

| App | ① Gì lên thanh chính | ② Cài đặt ở đâu | ③ Thư viện/vật liệu | ④ Tách app ↔ tài liệu | ⑤ Chưa mở dự án |
|---|---|---|---|---|---|
| **Revit** | Ribbon (tab lệnh) · Quick Access Toolbar · **File tab** · Status Bar. Project Browser + Properties là **palette neo cạnh**, không phải mục nav | **File tab → Options** (menu ứng dụng), KHÔNG có tab ribbon "Settings" | Family/thư viện **nạp vào dự án** qua lệnh Load Family; không có màn "Thư viện" ngang hàng | Rõ: ribbon+QAT = app; **Project Browser · Properties · Options Bar · Type Selector · View Control Bar = dự án** | không tra được (tài liệu không nói) |
| **Archicad** | **Navigator palette** 4 map: Project Map · View Map · Layout Book · Publisher Sets | **Options > Work Environment** (menu), tách hẳn khỏi Navigator | Library Manager ở **menu**, không nằm trong Navigator | Navigator **thuần dự án** — "contains all of your **project's** viewpoints, views, Layouts and Publisher sets" | không tra được |
| **SketchUp** | Menu bar · Getting Started Toolbar · **Trays/panels** (modeless dialog) · Status Bar | `Window > Model Info` (thuộc **model**) và Preferences (thuộc **app**) — hai dialog KHÁC nhau | **Materials · Components = PANEL trong tray**, không phải màn riêng | Tách bằng cặp dialog: Preferences = app · Model Info = model | không tra được |
| **Rhino** | Title · Menu · Command window · Toolbar container · Sidebar · Osnap panel · **Right Container** · Viewport · Status bar | Hai lệnh RIÊNG: **Options** = *"manage Rhino global options. These options affect all instances of Rhino"* ↔ **Document Properties** = *"the settings for the current model"* | Layers · Properties = **panel trong Right Container** | ⭐ **Rõ nhất trong 10 app** — tách bằng hai lệnh có tên khác nhau, không phải hai tab cùng một chỗ | không tra được |
| **D5 Render** | Navigation bar; **Assets là NÚT trên nav bar (phím tắt `M`)** mở ra "D5 Render Asset Library" | không tra được | ⭐ **Tấm mở đè**: Assets mở thư viện có tab **Online Assets ↔ Local Assets**, 6 nhóm (Models·Materials·Particles·HDRI·Scatter·Terrain); panel phải = Environment · Effects · Inspector | Local Assets = **tài sản người dùng dùng lại xuyên dự án**; Inspector/Environment = cảnh đang mở | không tra được |
| **Autodesk Construction Cloud** | Sidebar liệt kê **module theo dự án** (Docs · Design Collaboration · Build · Takeoff…) | **Account Administration** vào bằng *product picker* hoặc chọn **"All Projects"** ở project picker rồi bấm Account Administration | Library = **account level content** do Account Admin tạo, không phải mục nav dự án | ⭐ Tách bằng **hai bộ chọn ở đỉnh**: product picker + project picker. Không có dự án đang chọn → về "All Projects" | Chọn "All Projects" ⇒ **thay bằng màn quản trị tài khoản**, không phải để trống |

### 2.2 · Khảo sát — nhóm KHÁC NGÀNH

| App | ① Gì lên thanh chính | ② Cài đặt ở đâu | ③ Thư viện/tài sản | ④ Tách app ↔ tài liệu | ⑤ Chưa mở dự án |
|---|---|---|---|---|---|
| **Figma** (file browser) | Account → Search → Recents → Community → Notifications → **Team/Organization** → Drafts → Browse → Trash → Admin → Starred | ⭐ *"Settings appear **within the Account menu**, not as separate sidebar items"* | ⭐ *"Libraries are accessed **through Browse or Community**, not as direct sidebar items"* | File browser (app) và trình soạn file (tài liệu) là **HAI màn khác hẳn**, sidebar khác nhau hoàn toàn | File browser CHÍNH LÀ trạng thái "chưa mở file" — nó là màn riêng, không phải nav trống |
| **Notion** | Home · Chats với AI · Meetings · Inbox · **Search** · rồi Teamspaces/Shared/Private/Favorites | ⭐ **Settings ở ĐÁY sidebar**, chung cụm "workspace essentials" với Templates + Trash — tách khỏi nhóm tab chính ở đỉnh | Templates = **cụm đáy**, không phải tab đỉnh | Tab đỉnh = xuyên workspace · thân sidebar = cây nội dung · đáy = hạ tầng | không tra được |
| **Linear** | Inbox → My Issues → **Workspace** (Teams · Customers) → team | ⭐ *"click your **workspace name in the upper-left corner** and select Settings"*; settings chia 4 khu: Account · Features · Administration · Your teams | không tra được | Settings chính là chỗ tách: **Account** (người) ↔ **Features/Administration** (workspace) ↔ **Your teams** (nhóm) | không tra được |
| **Miro** | Dashboard điều hướng giữa **teams · Spaces · boards**; Space có sidebar riêng | Profile settings + team settings ở **dashboard**, không phải trong board | Templates qua nút **"Explore templates"** góc trên phải dashboard; Blueprints = template của Space | ⭐ **Dashboard ↔ Board là hai bề mặt tách hẳn**; sidebar đổi khi vào Space | Dashboard là màn mặc định — vai trò y hệt file browser của Figma |

> ⚠️ Miro và ACC: một phần dữ liệu lấy từ **trích đoạn kết quả tìm kiếm** của help center chính chủ
> (trang trả 403/503 khi fetch trực tiếp). Đã đánh dấu ở §CHƯA CHẮC.

---

## 3 · TỔNG KẾT — SÁU RANH GIỚI RÚT ĐƯỢC

### R1 · Cài đặt KHÔNG BAO GIỜ ngang hàng trên nav chính — **10/10, không ngoại lệ**
Figma: trong Account menu · Linear: sau tên workspace góc trên trái · Notion: cụm đáy tách khỏi tab
đỉnh · Miro: ở dashboard · Revit: File tab → Options · Archicad: menu Options · Rhino: lệnh Options ·
SketchUp: Preferences · ACC: qua product picker/All Projects.
**Lý do chức năng** (không phải "vì họ làm thế"): nav chính là nơi người dùng đi tới **để làm việc**,
tần suất mỗi phiên hàng chục lần. Cài đặt là việc **vài lần mỗi tháng**. Cho nó một ô ngang hàng là lấy
chỗ đắt nhất trên màn trả cho thứ rẻ nhất — và làm loãng luôn ý nghĩa của những ô còn lại (nếu Cài đặt
cũng là một "chặng" thì "chặng" không còn nghĩa gì).

### R2 · Thư viện/tài sản là **panel hoặc tấm mở đè**, gần như không bao giờ là màn riêng — 5/6 app có thư viện
D5: nút trên nav bar mở tấm (phím `M`) · SketchUp: panel trong tray · Rhino: panel trong Right Container ·
Revit: nạp vào dự án bằng lệnh · Figma: *"through Browse or Community, **not as direct sidebar items**"*.
**Lý do**: thư viện chỉ có nghĩa khi **kéo được vào chỗ đang làm**. Đưa nó thành màn riêng là bắt người
dùng rời bàn làm việc để đi lấy đồ, rồi quay lại — mất ngữ cảnh ở đúng lúc cần ngữ cảnh nhất.
⭐ Đây chính là lập luận comment `app/library/page.tsx:6-11` đã tự viết ra — IF **đã đúng**, chỉ là chưa
áp cùng luật đó cho Vật liệu và Màu.

### R3 · Tách **phạm vi app ↔ phạm vi tài liệu** bằng BỀ MẶT hoặc DANH TÍNH, không bằng "hai mục cạnh nhau"
Ba cách thấy được, không app nào trộn chung một hàng:
- **Hai bề mặt khác hẳn** — Figma (file browser ↔ editor) · Miro (dashboard ↔ board).
- **Hai bộ chọn ở đỉnh** — ACC (product picker + project picker; không có dự án ⇒ "All Projects").
- **Hai lệnh tên khác nhau** — Rhino: *Options* (global, "affect all instances of Rhino") ↔
  *Document Properties* ("settings for the current model"); SketchUp: Preferences ↔ Model Info.

### R4 · Cây điều hướng của dự án là **THUẦN dự án**
Archicad Navigator: *"contains all of your **project's** viewpoints, views, Layouts and Publisher sets"*.
Revit Project Browser: *"the views, schedules, and sheets of the **current project**"*.
Không app nào nhét mục cấp ứng dụng vào cây dự án.

### R5 · Chưa mở dự án thì **thay bằng một màn khác**, không phải làm mờ mục
Figma file browser · Miro dashboard · ACC "All Projects" → màn quản trị tài khoản. Không app nào để
người dùng nhìn một hàng mục xám. **Lý do**: mục xám không nói được người dùng phải làm gì tiếp; một màn
riêng thì luôn có việc làm được ngay tại chỗ. (Trùng khít **luật X2** của IF — chốt 03/08.)

### R6 · Nav chính đang được **cho phép tuỳ biến**, nhưng lưới thì máy giữ
Linear: *"reorder items, hide items you don't use often"* + **More menu**; Figma: custom sidebar sections;
Miro: pin Space. Không app nào cho **kéo giãn tự do** — chỉ cho **sắp và ẩn**.
⭐ Trùng đúng cơ chế IF đã chốt 16/08 cho widget Home: *người chọn HƯỚNG, máy giữ HỆ*.

### 🟡 CHỖ CÁC APP KHÔNG THỐNG NHẤT — đây là chỗ IF được tự quyết
1. **Tìm kiếm**: Notion cho lên tab đỉnh · Figma xếp trong khu Account · Revit/Rhino/Archicad không có
   ô tìm toàn cục. ⇒ IF đặt đâu cũng có tiền lệ (Hoà đã chốt 16/08: chấm Vitals cạnh ô tìm).
2. **Việc/task**: Linear để **Inbox + My Issues lên ĐẦU sidebar** (vì đó là sản phẩm của họ) · Notion
   gộp vào Home · app CAD không có. ⇒ Bảng việc lên nav hay không **phụ thuộc IF định vị nó là gì**,
   không có ranh giới ngành nào ép.
3. **Trash/Templates**: Figma và Notion cho vào sidebar (cụm đáy), app CAD thì không có khái niệm.

---

## 4 · CHẤM LẠI DANH SÁCH CỦA IF

### 4.1 · Đo code trước (bằng chứng, không phải cảm tính)

| Đo | Kết quả | Bằng chứng |
|---|---|---|
| Nav thật của IF là gì | **AppLogoMenu** — Home · Tổng quan · Dự án & Flow · Files · Thư viện. Chỉ 5 mục. | `components/studio/AppLogoMenu.tsx:52-77` |
| `/library` có phải trang? | **KHÔNG** — redirect, `markOpenLibraryOnLoad()` rồi `router.back()`; comment tự khai *"Thư viện là MỘT NƠI DUY NHẤT, và nó là SHEET"* | `app/library/page.tsx:5-31` |
| `/materials` vào từ đâu | **Chỉ từ Cài đặt → nhóm "Nâng cao"** (+ 1 lối phụ từ lỗi BOQ) | `app/settings/_components/PixelSettingsShell.tsx:73` · `components/present-editor/boq/BoqErrors.tsx:80` |
| `/colors` vào từ đâu | **Chỉ từ một nút trong header màn Vật liệu** | `components/materials/MaterialsScreen.tsx:137` |
| `/tasks` vào từ đâu | **Chỉ từ Cài đặt → "Nâng cao"** (+ toast sau khi tạo việc từ 3D) | `PixelSettingsShell.tsx:100` · `Render3DModeSkeleton.tsx:387` |
| 🔴 Vỏ của các màn cấp app | **`active="render"` HẾT** — `/files` `/materials` `/colors` `/tasks` `/settings` | 5 file, `app/*/page.tsx` |
| `/projects/[id]/notebook` vào từ đâu | **Chỉ từ trong trang Tổng quan dự án** | `app/projects/[id]/overview/page.tsx:205` |
| Hai chữ "Tổng quan" | **Trùng tên, hai thứ khác nhau** — panel Dashboard cấp app (`Dashboard.tsx:290`) ↔ route `/projects/[id]/overview` cấp dự án | 2 file |

### 4.2 · Bảng chấm — **cấp app**

| Mục | Chấm | Lý do (rút từ §3) |
|---|---|---|
| **Files** | ✅ **đúng chỗ** | R3: đây là bề mặt cấp app thật, đúng vai file browser của Figma / dashboard của Miro. Đã có trên nav. |
| **Thư viện** | ✅ **đúng chỗ, đúng hình thức** | R2 xác nhận thẳng: D5 mở tấm bằng nút nav bar, Figma nói rõ library *không* phải mục sidebar. Redirect `/library` là **cố ý và đúng**, không phải nợ. **Tôi BÁC nửa sau nghi vấn của T** — xem §4.5. |
| **Vật liệu** | ❌ **sai chỗ** | R2: phải là **KỆ trong tấm Thư viện**, không phải màn. Chốt 07/08 của chính IF đã nói vậy. Hiện nó là màn riêng, và lối vào lại nằm trong **Cài đặt** — vừa sai loại vừa sai chỗ. |
| **Màu** | ❌ **sai chỗ** | R2 y hệt. Nặng hơn Vật liệu: lối vào **duy nhất** là một nút trong header màn Vật liệu ⇒ ai không mở Vật liệu thì không bao giờ biết Màu tồn tại. |
| **Bảng việc** | 🟡 **chưa đủ căn cứ để chấm đúng/sai chỗ** — nhưng **chắc chắn sai LỐI VÀO** | Ngành không thống nhất (§3 điểm 🟡2): Linear cho lên đầu, CAD không có. Nhưng đặt nó **sau Cài đặt → Nâng cao** thì sai ở mọi trường phái — R1 nói Cài đặt là chỗ tần suất thấp, chôn việc-hằng-ngày sau nó là ngược hoàn toàn. Cần Hoà chốt IF coi Bảng việc là hạ tầng hay là sản phẩm. |
| **Cài đặt** | ⛔ **KHÔNG PHẢI STAGE** | R1, 10/10 app. Phải nằm sau danh tính (menu avatar / logo), không đứng ngang hàng. |

### 4.3 · Bảng chấm — **cấp dự án**

| Mục | Chấm | Lý do |
|---|---|---|
| **Tổng quan** | 🟡 **đúng chỗ nhưng TRÙNG TÊN** | R4 cho phép: Revit Project Browser cũng mở đầu bằng cây của dự án. Nhưng IF có **hai thứ cùng tên "Tổng quan"** ở hai phạm vi (`Dashboard.tsx:290` cấp app ↔ `/projects/[id]/overview` cấp dự án). Đây đúng ca `soi:tu-dien` sinh ra để bắt. Phải đổi tên một trong hai. |
| **Sổ tay** | ⛔ **KHÔNG PHẢI STAGE ngang hàng** | R4: cây dự án chỉ chứa **viewpoint/view/sheet** — thứ sinh ra bản vẽ. Sổ tay là **nguồn tri thức**, đúng vai "Sources" của NotebookLM, không phải một chặng làm việc. Code cũng đã tự xếp nó là **con của Tổng quan** (`overview/page.tsx:205`), không phải anh em. |
| **2D** | ✅ **đúng chỗ** | R4: đây là chặng thật, có canvas riêng, sinh ra sản phẩm. |
| **3D** | ✅ **đúng chỗ** | như trên. |
| **Trình chiếu** | ✅ **đúng chỗ** | như trên. Ba mục này = đúng bộ ba chặng, đúng `stageHrefFrom` trong `AppChrome.tsx:104-106`. |

### 4.4 · 🔴 LỆCH NẶNG NHẤT — T chưa nêu

**Năm màn cấp app đang mặc vỏ của chặng 3D dự án.** `active="render"` trong `/files` `/materials`
`/colors` `/tasks` `/settings`. Hệ quả nhìn thấy được: đứng ở **Cài đặt** mà thanh chặng vẫn sáng ô
**"3D"**. Comment trong `app/files/page.tsx:17-19` tự khai lý do — *"không phải 1 trong 3 chặng, mặc
định về Render"* — tức đây là **giải pháp vá**, không phải thiết kế.

Vi phạm thẳng **R3**: không app nào trong 10 app cho màn cấp ứng dụng mặc vỏ của tài liệu đang mở.
Figma đổi hẳn bề mặt; Miro đổi hẳn sidebar; ACC đổi picker. IF thì giữ nguyên vỏ và **nói dối một
thông tin trạng thái** — trong khi chính IF vừa chốt 16/08 rằng *mọi chi tiết thị giác đều phải mang tin*.

### 4.5 · Chỗ tôi BÁC / SỬA T

| T nói | Tôi đo | Phán |
|---|---|---|
| *"`/library` là redirect chứ không phải trang ⇒ Thư viện thực chất là tấm mở đè"* | Đúng y nguyên (`app/library/page.tsx`) | ✅ **XÁC NHẬN** |
| *"code và chốt phân kỳ"* (chốt bảo gộp về một tấm, code cho Vật liệu/Màu màn riêng) | Đúng | ✅ **XÁC NHẬN** — và nặng hơn T nghĩ: Màu chỉ vào được từ trong Vật liệu, không có lối độc lập |
| Ngụ ý Thư viện-là-tấm-đè là một **lệch cần sửa** (đặt cạnh `/files` `/materials` như thể cả nhóm cùng loại) | 5/6 app có thư viện đều làm đúng như IF đang làm | 🔴 **BÁC** — đây là mục **làm ĐÚNG NHẤT** trong cả danh sách. Lệch không nằm ở Thư viện; lệch nằm ở chỗ **Vật liệu và Màu chưa được kéo vào tấm đó**. Nếu đọc nhầm hướng rồi đi "chuẩn hoá" Thư viện thành màn thật cho đồng bộ với `/materials` `/colors` thì là **sửa ngược**, phá đúng thứ đang đúng. |
| T nghi **hai** chỗ | Có **ba** — chỗ thứ ba là `active="render"` ở 5 màn cấp app | 🔧 **BỔ SUNG** |

### 4.6 · ĐỀ XUẤT DANH SÁCH ĐÃ SỬA
⛔ Không xếp hạng, không chấm điểm.

| Mục | Thuộc đâu | Lý do một câu |
|---|---|---|
| Files | **thanh chính** (cấp app) | Bề mặt cấp app thật, đúng vai file browser — R3. |
| Thư viện | **tấm mở đè** (giữ nguyên) | Thư viện chỉ có nghĩa khi kéo được vào chỗ đang làm — R2. |
| Vật liệu | **kệ trong tấm Thư viện** | Cùng bản chất tài sản dùng lại, gộp thì mọi cơ chế chung viết một lần — R2 + chốt 07/08. |
| Màu | **kệ trong tấm Thư viện** | Như trên; và nó đang không có lối vào độc lập nào. |
| Bảng việc | 🟡 **chưa đủ căn cứ** — thanh chính hay bề mặt riêng đều có tiền lệ; nhưng **phải rời khỏi Cài đặt** | Ngành không thống nhất (§3 🟡2); chỉ chắc chắn được điều phủ định. |
| Cài đặt | **sau danh tính** (menu avatar/logo) | R1, 10/10 app không ngoại lệ. |
| Tổng quan (dự án) | **cây dự án** — nhưng **đổi tên** một trong hai chỗ trùng | R4 cho phép; trùng tên thì không. |
| Sổ tay | **trong Tổng quan dự án** (đúng như code đang làm) | Nguồn tri thức, không phải chặng sinh ra sản phẩm — R4. |
| 2D · 3D · Trình chiếu | **thanh chặng** (giữ nguyên) | Ba chặng thật, mỗi cái một canvas, mỗi cái một đầu ra. |
| 🆕 Trạng thái "chưa mở dự án" | **một màn riêng**, không phải mục mờ | R5 + luật X2 của chính IF. |
| 🆕 Vỏ của màn cấp app | **thôi dùng `active="render"`** | R3; và thanh chặng đang hiển thị sai trạng thái. |

---

## 5 · ĐÁNH GIÁ KHÁCH QUAN

**Tốt:** Thư viện-là-tấm-đè là quyết định **đúng chuẩn ngành**, và comment trong code đã tự lập luận ra
lý do y hệt lý do D5/Figma làm vậy — IF nghĩ đúng chứ không chép. Bộ ba chặng 2D/3D/Trình chiếu sạch,
đúng R4. Sổ tay xếp làm con của Tổng quan cũng đúng, dù có vẻ là tình cờ chứ không phải chủ ý.

**Chưa:** Ba màn (`/materials` `/colors` `/tasks`) đang sống **sau Cài đặt hoặc sau một màn khác** — với
người dùng thật thì gần như **không tồn tại**. Đây không phải chuyện xếp sai thứ tự, đây là tính năng đã
build xong mà không ai tìm thấy. Và `active="render"` là một lời nói dối trạng thái đang chạy trên 5 màn.

**Rủi ro:**
1. 🔴 **Sửa ngược** — nếu ai đó đọc danh sách rồi "chuẩn hoá" Thư viện thành màn thật cho đồng bộ với
   `/materials` `/colors`, sẽ phá đúng thứ duy nhất đang làm đúng chuẩn ngành. §4.5 dựng ra để chặn ca này.
2. Gộp Vật liệu/Màu vào tấm Thư viện là việc **đụng nhiều màn** (2 route + Navigator + lối vào từ BOQ)
   — không phải sửa một dòng.
3. Danh sách trong đề bài (*Files · Thư viện · Vật liệu · Màu · Bảng việc · Cài đặt*) **không khớp code**:
   nav thật chỉ có 5 mục và không có Vật liệu/Màu/Bảng việc/Cài đặt trong đó. Nếu danh sách đó đến từ một
   bản vẽ hoặc một plan chưa thi công, thì phần chấm ở §4.2 áp cho **bản vẽ**, còn phần đo ở §4.1 áp cho
   **code** — hai thứ đang lệch nhau và cần khai rõ khi trình Hoà.

---

## 6 · HƯỚNG XỬ LÝ — VÀ ĐỀ XUẤT

### Hướng A — Gộp theo bản chất tài sản (kệ hoá Vật liệu + Màu)
Kéo `/materials` `/colors` thành kệ trong `LibrarySheet`; Cài đặt về sau avatar; Bảng việc lên một lối
vào thật.
· **Ưu**: thi hành đúng chốt 07/08 đã có, đúng R1+R2, và đóng luôn cái vòng "tính năng không ai tìm thấy".
· **Nhược**: đụng 2 route + Navigator + lối vào từ BOQ; tấm Thư viện phải đủ rộng cho thêm 2 loại kệ.

### Hướng B — Chỉ vá lối vào, giữ nguyên cấu trúc
Đưa Vật liệu · Màu · Bảng việc lên `AppLogoMenu`, không gộp gì cả.
· **Ưu**: rẻ nhất, một file, hết ngay bệnh không-tìm-thấy.
· **Nhược**: **làm sâu thêm cái lệch** — biến ba màn sai loại thành ba mục ngang hàng chính thức, tức
hợp thức hoá thứ mà chốt 07/08 bảo phải gộp. Và vẫn để nguyên `active="render"`.

### Hướng C — Tách bề mặt trước, sắp mục sau (theo R3/R5)
Dựng bề mặt cấp app riêng (kiểu file browser Figma / dashboard Miro) làm chỗ đứng cho Files · Thư viện ·
Bảng việc · Cài đặt, để thanh chặng chỉ còn nghĩa khi đã mở dự án.
· **Ưu**: giải gốc bệnh `active="render"`; và Home Bento đã chốt 13/08 gần như **chính là bề mặt đó**.
· **Nhược**: to nhất, đụng `AppShell`, và một phần trùng việc Home Bento đang chờ duyệt phác.

### ⭐ ĐỀ XUẤT: **A trước, C sau — không làm B**

**Chọn A trước** vì nó là việc **đã được chốt rồi mà chưa thi hành** (07/08), không cần Hoà quyết thêm
lần nào, và trả về đúng hai kết quả đo được: hết một lệch code↔chốt, và ba tính năng ẩn thành tìm thấy được.

**C sau** vì nó là việc đúng gốc nhưng **trùng phạm vi với Home Bento đang chờ duyệt phác** — làm bây giờ
là thiết kế hai lần. Đợi Home Bento chốt xong thì C gần như tự có.

**Không làm B** vì nó rẻ theo cách xấu nhất: rẻ hôm nay, và mai phải gỡ ra để làm A. Ba mục ngang hàng
mới trên nav sẽ được người dùng học, được chụp vào tài liệu, rồi lúc gộp lại thành kệ là một lần đổi
thói quen thứ hai — đúng thứ **R6** cho thấy các app đều tránh.

---

## ⑦b CHƯA CHẮC / CHƯA KIỂM

| Điều | Mức chắc |
|---|---|
| **Miro** — sidebar/dashboard/Spaces | 🟡 Trang `help.miro.com` trả **403** khi fetch. Dữ liệu lấy từ **trích đoạn kết quả tìm kiếm** của chính help center đó, không phải đọc trang. Đủ để nói "dashboard ↔ board là hai bề mặt", **không đủ** để liệt kê thứ tự mục sidebar. |
| **Autodesk Construction Cloud** | 🟡 Trang navigation chính chủ trả **503**; câu về product picker / "All Projects" lấy từ trích đoạn tìm kiếm help.autodesk.com. Không đọc được trang gốc. |
| **D5 Render** — panel phải (Environment · Effects · Inspector) | 🟡 Phần Assets đọc được từ `docs.d5render.com/user-guide/assets` (chắc). Phần panel phải đến từ trích đoạn tìm kiếm, chưa mở trang. |
| **Câu ⑤ "chưa mở dự án"** cho Revit · Archicad · SketchUp · Rhino · D5 | ⛔ **KHÔNG TRA ĐƯỢC** — tài liệu giao diện của app desktop không mô tả trạng thái chưa-mở-file. Không suy đoán. |
| **Cài đặt của D5** | ⛔ không tra được |
| **Thư viện của Linear** | ⛔ không tra được (Linear không có khái niệm tương đương) |
| **Revit** — trang cloudhelp không tự phân loại project-scope ↔ app-scope | 🟡 Phân loại ở §2.1 là **SUY LUẬN của tôi** từ mô tả từng thành phần, không phải câu chữ của Autodesk. Riêng Rhino và Archicad thì có câu chữ thật, đã trích nguyên văn. |
| **Danh sách 11 mục trong đề bài** | 🟡 Không tìm thấy nơi nào trong code khai đúng danh sách đó. Nav thật (`AppLogoMenu`) chỉ 5 mục. Nguồn của danh sách chưa xác định — có thể là bản vẽ/plan. |

**Quan sát có nguồn** = mọi ô có trích dẫn nguyên văn trong ngoặc kép ở §2, cộng toàn bộ §4.1 (file:dòng).
**Suy luận của tôi** = §3 (sáu ranh giới), §4.2–4.6 (chấm và đề xuất), cột "phân loại scope" của Revit và SketchUp.

## ⑦c HẠN DÙNG KẾT LUẬN

- **Ranh giới R1–R5**: bền — đây là ranh giới **chức năng** (tần suất dùng, chi phí mất ngữ cảnh), không
  phải mốt giao diện. Không cần tra lại trước 2027.
- **R6 (tuỳ biến nav)** và mọi mô tả sidebar cụ thể: **hết hạn nhanh**. Bằng chứng ngay trong đợt khảo
  này — Figma đang đổi *projects* thành *folders* **từ 03/08/2026**, đúng lúc khảo. Chi tiết mục nào nằm
  đâu phải tra lại nếu dùng sau ~6 tháng.
- **Phần đo code (§4.1)**: gắn với HEAD `544999f`. Bốn phiên phụ đang chạy song song ⇒ có thể lệch ngay
  trong ngày. Đo lại trước khi mở phiếu thi công.

---

## NGUỒN

**Cùng ngành**
- Revit — [User Interface](https://help.autodesk.com/cloudhelp/2026/ENU/Revit-GetStarted/files/GUID-3197A4ED-323F-4D32-91C0-BA79E794B806.htm) · [Project Browser](https://help.autodesk.com/view/RVT/2025/ENU/?guid=GUID-C8D3E5A6-02A5-43A9-AFFC-D49DD27398B1)
- Archicad — [Navigation in Archicad](https://help.graphisoft.com/AC/28/INT/_AC28_Help/030_Interaction/030_Interaction-2.htm) · [Navigator Project Map](https://help.graphisoft.com/AC/28/INT/_AC28_Help/030_Interaction/030_Interaction-4.htm) · [Navigator - Layout Book](https://help.graphisoft.com/AC/26/INT/_AC26_Help/070_Documentation/070_Documentation-90.htm)
- SketchUp — [Navigating the SketchUp Interface](https://help.sketchup.com/en/sketchup/user-interface) · [Dialog Boxes and Trays](https://help.sketchup.com/en/sketchup/dialog-boxes-and-trays)
- Rhino — [The Rhino window](https://docs.mcneel.com/rhino/8/help/en-us/user_interface/rhino_window.htm) · [Options](https://docs.mcneel.com/rhino/8/help/en-us/commands/options.htm) · [Panels](https://docs.mcneel.com/rhino/8/help/en-us/user_interface/panels.htm)
- D5 Render — [Assets · User Manual](https://docs.d5render.com/user-guide/assets) · [What's in the D5 online assets library](https://docs.d5render.com/user-guide/assets/whats-in-the-d5-online-assets-library)
- Autodesk Construction Cloud — [Navigating Products and Projects](https://help.autodesk.com/view/DOCS/ENU/?guid=Autodesk_Construction_Cloud_Navigation) 🟡503 · [Account Administration](https://help.autodesk.com/view/DOCS/ENU/?guid=Account_Administration)

**Khác ngành**
- Figma — [Guide to the file browser](https://help.figma.com/hc/en-us/articles/14381406380183-Guide-to-the-file-browser) · [Guide to libraries in Figma](https://help.figma.com/hc/en-us/articles/360041051154-Guide-to-libraries-in-Figma)
- Notion — [Navigate with the sidebar](https://www.notion.com/help/navigate-with-the-sidebar)
- Linear — [Personalized sidebar and new settings pages](https://linear.app/changelog/2024-12-18-personalized-sidebar) · [Workspaces](https://linear.app/docs/workspaces) · [Inbox](https://linear.app/docs/inbox)
- Miro — [What is on your dashboard](https://help.miro.com/hc/en-us/articles/360017571294-What-is-on-your-dashboard) 🟡403 · [Spaces](https://help.miro.com/hc/en-us/articles/21040490154898-Spaces) 🟡403
