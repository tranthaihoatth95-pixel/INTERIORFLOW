# WORKSPACE · CỬA SỔ CÔNG CỤ (ToolWindow)

> **[N]** = sự thật từ nguồn · **[IF]** = diễn giải. Nguồn ở §8.
> ⚠️ Từ **"tool"** đã gây thiệt hại thật vì bốn nghĩa cùng tồn tại — đọc §6 trước khi dùng chữ đó.

## 1 · LÀ GÌ / KHÔNG PHẢI LÀ GÌ

**Cửa sổ công cụ LÀ một XƯỞNG CHO MỘT TÁC VỤ** — một **môi trường làm việc tối ưu** (ảnh · video ·
3D prototype · thảo luận), kéo thả trong canvas, **xung quanh đính kèm các công cụ tối ưu riêng cho
tác vụ đó**. **[N]** Hoà 16/08.

**KHÔNG PHẢI** — đồ đạc thường trực trên màn · một panel cố định · một hộp thoại · một màn riêng.
**[N]** `SKILL.md §1` + `SKILL.md §10`.

**Nó là một CỤM, không phải một tấm:** khung môi trường ở giữa **+ vệ tinh bám quanh và đè mép**;
kéo là kéo **cả cụm**. Đúng hình 7 ảnh tham chiếu Photoshop · Lightroom · Illustrator · Premiere.
**[N]** `components/render-studio/CuaSoCongCu.tsx` docstring.

### Bốn vai, không cái nào giẫm cái nào **[N]** Hoà 16/08
> **Canvas là SƠ ĐỒ DÂY CHUYỀN. Cửa sổ là XƯỞNG của một công đoạn. Chặng là KHUNG NHÌN.
> Sidebar là BẢN ĐỒ.**

Ba tầng: **canvas = nền · cửa sổ = vật trên nền · môi trường (2D/ảnh/video/3D) = ruột của vật.**
⇒ Trả lời câu *"cửa sổ thuộc canvas hay thuộc Vẽ 3D?"*: **không bên nào** — 3D **là một môi trường**,
tức nội dung của một cửa sổ.

## 2 · VIỆC CỦA CON NGƯỜI

| Việc | Cửa sổ trả lời bằng |
|---|---|
| Làm một công đoạn cho tới nơi | môi trường đủ sâu để làm việc thật (*"phải đúng Photoshop, phải đúng D5, phải đúng Blender"*) |
| Nối các công đoạn thành sản phẩm cuối | cổng ra mang sẵn **định nghĩa**; đầu ra cửa sổ này là đầu vào đã-định-nghĩa của cửa sổ kế |
| Không phải học lại thao tác ở mỗi chặng | thanh chung **chưng cất** lệnh cùng bản chất về một chỗ |
| Tự sắp bàn làm việc | move · dock · undock · resize · collapse · pin · focus · close · restore · persist |

**Hai tầng giải hai bài toán NGƯỢC nhau — đây là thứ hay bị trộn:** **[N]** Hoà 16/08

| | **THANH CHUNG** | **CỬA SỔ CÔNG CỤ** |
|---|---|---|
| Giải bài gì | *"mỗi ông một phím tắt, ai mà nhớ"* | *"phải đúng Photoshop / D5 / Blender"* |
| Cách làm | **CHƯNG CẤT** lệnh cùng bản chất về MỘT bộ | **ĐÓNG GÓI** một môi trường trọn vẹn |
| Giá trị | quen tay, học một lần dùng khắp nơi | đủ sâu để làm việc thật |
| Hình | nông và RỘNG | sâu và HẸP |

**[N] Vì sao chúng không đá nhau — cơ chế, không phải lời hứa:** cửa sổ **đóng khung phạm vi**. Lệnh
chuyên sâu của ảnh sống TRONG cửa sổ ảnh; của 3D sống TRONG cửa sổ 3D ⇒ chúng **không tràn ra thanh
chung** ⇒ thanh chung không bao giờ phình, và không đổi theo chặng.
Nguyên tắc này đã thành **bất biến máy canh**: lệnh trong cửa sổ bắt buộc mang tiền tố
`cua.<môi trường>.`, và `lenhDamChan(môi trường)` **phải LUÔN trả rỗng**, có test canh. Lệnh chuyên
sâu rò ra thanh chung là **test ĐỎ**. **[IF] Khuôn đáng nhân rộng: nguyên tắc kiến trúc chỉ sống
được khi có máy canh — viết vào tài liệu là để người đọc, viết thành test là để nó không hỏng.**

## 3 · NHÂN VẬT CHÍNH

**Nội dung đang được làm** (ruột cửa sổ). Vỏ là kính, **ruột ĐẶC** — sắc nét 100%, góc vuông, không
blur, không phủ màu, không giảm tương phản. *Nội dung là thứ khách trả tiền để nhìn.* **[N]** 01/08.

## 4 · ĐƯỢC PHÉP CHỨA / BỊ TỪ CHỐI

| Được phép | Ghi chú |
|---|---|
| Khung môi trường + **vệ tinh LUÔN HIỆN** khi cửa sổ mở | mở cửa sổ **LÀ** hành vi bày ra; đóng cửa sổ **LÀ** hành vi giấu đi. Không có lớp giấu thứ hai |
| Ba biến thể đứng: `noi` (tháo rời, kéo cả cụm) · `neo` (thuộc mặt làm việc, pan/zoom theo, nối dây được) · `toanMan` | `neo` **không** `position:fixed`, **không** portal — phải THUỘC canvas |
| Nhiều cửa sổ cùng lúc, nối dây nhau | *"cho phép mở nhiều master tool để nối với, và định nghĩa file = kết quả"* **[N] 15/08** |
| Cổng ra mang định nghĩa | chỉ ở **mặt tiền node**; ghép từ trường đã có, không thêm trường mới |

| Bị từ chối | Lý do |
|---|---|
| **Giấu vệ tinh sau tay nắm** | Hoà bác thẳng: *"tool tối ưu KHÔNG PHẢI sinh ra kèm window rồi lại giấu đi — bản chất nó ĐÃ BỊ GÓI LẠI cùng ô môi trường rồi."* Giấu là **gói lần hai**; làm thế thì cửa sổ mất lý do tồn tại — người ta mở nó ra chính là để lấy đám vệ tinh |
| **Bắt buộc mọi cửa sổ có cổng ra** | cửa sổ **THẢO LUẬN** (moodboard · khung tư duy · ghi chú) là *mặt để NGHĨ*; đầu ra là **một QUYẾT ĐỊNH**, không phải một tệp **[N] 16/08** |
| Kính chồng kính | vệ tinh là **ANH EM** của khung, đặt tuyệt đối quanh bọc ngoài — lồng trong khung là lỗi K4 đã trả giá |
| Cửa sổ tự phát sáng | ba tầng ánh sáng không lẫn: cửa sổ chỉ dùng tầng ① (kính bắt sáng ở mép). Tầng ② (trỏ vào) và ③ (đang chạy — viền chạy) thuộc về **VẬT**; cửa sổ tự sáng là **cướp kênh của trạng thái chạy** |
| Rải kính lên hàng chục node | `backdrop-filter` chỉ trên số ít cửa sổ + thanh; node nhỏ dùng nền đặc (bài học FPS) |
| Tự sắp lại bàn làm việc của người dùng | **người dùng sở hữu cách bày**; IF được khuyến nghị, **không bao giờ ghi đè** |

### Workspace thích ứng theo TÁC VỤ — không phải tự-sắp-xếp ngẫu nhiên
Chọn vật liệu ⇒ công cụ vật liệu **bước lên trước**. Chọn khối 3D ⇒ hình học · vật liệu · biến đổi
bước lên trước. Panel không liên quan **lùi ra**. Bốn ràng buộc: **dự đoán được · đảo ngược được ·
giải thích được · ghi nhớ được**, và người dùng luôn ghi đè được. **[N]** `SKILL.md §10`.

Workspace nhớ: chặng · vùng chọn · camera · zoom · cửa sổ đang mở · vị trí · cỡ · trạng thái cắm
bến · tham chiếu · việc đang làm.

### Cái gì lưu ở đâu **[N]** Hoà 16/08 · `IF-KIEN-TRUC.md §9`
| Loại | Lưu | Vì sao |
|---|---|---|
| **VẬT** — vật liệu · cấu kiện · bản vẽ · deck | **CHUNG** | nó là tài sản |
| **CẤU TRÚC VIỆC** — chuỗi công đoạn · dây nối · vị trí node | **CHUNG** | ai mở cũng phải thấy CÙNG MỘT dây chuyền; khác nhau là đọc sai quy trình |
| **CÁCH BÀY TRÊN MÀN CỦA TÔI** — nấc · cỡ kéo tay · panel thu/mở | **THEO MÁY** | màn mỗi người một cỡ |

⇒ Đóng câu hỏi từng treo: **cỡ kéo tay KHÔNG vào `.idf`.** Nấc cũng là *cách xem*, cũng theo máy.

## 5 · TRẠNG THÁI

**Ba nấc = ba công năng** (không phải ba cỡ):
| Nấc | Nó trả lời | Thứ nấc dưới không thể có |
|---|---|---|
| thu | *có công đoạn này, xong chưa* | — |
| vừa | **làm việc** | môi trường + vệ tinh hay dùng |
| toàn màn | **làm việc chi li** | vệ tinh phụ đầy đủ · xem ở **tỉ lệ thật** · bảng thông số sâu |

⛔ Nếu toàn màn chỉ là "vừa nhưng to hơn" thì **không đáng có — bỏ luôn, để hai nấc**. **[N]** 16/08.

Trạng thái khác: `COLLAPSED / NORMAL / FOCUSED` (+ floating, docked, auto-hide, pinned). Xem trước
chỗ cắm bến **chỉ hiện trong lúc kéo**. Giảm chuyển động ⇒ nhánh tĩnh.
**Rỗng / lỗi / đang tải cho từng môi trường: chưa truy được nguồn** — mỗi môi trường phải tự khai.

## 6 · "TOOL" — bốn nghĩa, và nó đã gây thiệt hại đo được

| Nghĩa | Định danh trong mã | Bản chất |
|---|---|---|
| chế độ vẽ đang chọn | `setTool` (166 chỗ) · `activeTool` · `cadTool` | một **TRẠNG THÁI** |
| thanh công cụ | `ToolDock` · `ToolBtn` · `ToolMenu` | một **VẬT CHỨA NÚT** |
| **cửa sổ công cụ** | `ToolWindow` · `ToolModeForm` · `ToolModeUi` · `CuaSoCongCu` | một **MINI-APP SỐNG TRÊN CANVAS** |
| kiến trúc tool 3 lớp | chỉ trong sổ | **TÊN CỦA CẢ HỆ** |

**Thiệt hại thật:** Hoà yêu cầu *"hộp công cụ nổi cạnh vật đang chọn"* / *"master tool phải THUỘC
môi trường canvas"* từ **01/08**, nhắc lại 13/08 · 15/08 · 16/08 (7 ảnh). T đọc "tool" bằng nghĩa
`ToolDock` rồi **đi làm vỏ nút toolbar suốt sáu phiếu**. Hoà: *"cái tôi nói muốn mòn cái repo mà T
không hiểu."*

**Và tên thì sổ đẻ ra bản thứ hai:** `"master tool"` = **0 lần trong mã**, **26 lần trong sổ**;
`ToolWindow` = **13 chỗ trong mã**, **0 trong sổ**. Hai tên **không giao nhau ở đâu cả** ⇒ đọc sổ
thấy "master tool" thì tưởng khái niệm chưa có, đi tìm không thấy, rồi làm việc khác.

✅ **Tên đang dùng: `cửa sổ công cụ`; trong mã giữ `ToolWindow`. *"Master tool" KHAI TỬ**, chỉ còn
giá trị lịch sử.* **[IF] Luật: khi sổ đặt tên cho một thứ, PHẢI kiểm mã đã có tên chưa. Đặt tên mới
cho thứ đã có tên là đẻ ra một khái niệm ma.**

## 7 · CA HỎNG THẬT

**① Chuột phải không gọi được master tool — "có trong mã ≠ tới được người dùng".** `RadialToolMenu`
sống thật, mount ở đúng hai nơi, có lõi thuần + test. Nhưng `CadCanvas` chỉ
`onContextMenu = preventDefault()` — **chặn rồi thôi**; lối vào duy nhất là **nhấn giữ bằng
ngón/bút**, và chỉ ở mode Sơ phác + công cụ chọn. ⇒ Người dùng **chuột** — tức gần như toàn bộ
desktop — **chưa bao giờ chạm tới**. `FlowCanvas`: 0 `onContextMenu`. `Viewport3D`: 0. Present có
một lớp chuột-phải **thứ hai, khác hình hài**. *(Đã nối cho 2D 23/08; 3D/Node còn nợ.)*

**② Cửa sổ Thảo luận mồ côi.** `components/collab/` đã dựng thật: `CuaSoThaoLuan` · hai form khung
tư duy · presence · engine chưng cất đã nối. `grep "CuaSoThaoLuan"` = **0 nơi mount**. Thiếu **đúng
một thứ: chỗ mount**. **[IF]** Nó là cửa sổ **rẻ nhất để làm trước** — không cổng ra, không kéo theo
bài toán zoom-lồng-zoom của 3D.

**③ F-14 — cơ chế chứng minh không chạm tới được thứ nó định chứng minh.** Lưới kẻ thẳng đặt sau
mỗi mẫu vật liệu để chứng minh khúc xạ; nhưng ô tím là `background: var(--accent)` — **đục hoàn
toàn** — nên không đường kẻ nào từng đi vào quang học của nút. *Grid sau tường đục = trang trí.*
Và kết luận đầu tiên còn sai hơn: *hạ tuyên bố xuống cho khớp hiện vật*. Hoà lật: lỗi ở **cách
dựng**, không ở tham vọng — kính trong có bề dày đặt trên **một lớp phim tím mỏng**, chứ không phải
khối tím đặc. **Luật: khi bằng chứng cho thấy một thứ không làm được điều nó tuyên bố, mặc định
phải hỏi *có phải dựng sai* TRƯỚC khi hỏi *có phải tuyên bố sai*.**

**④ T tự hỏi sai tầng.** T định hỏi *"vệ tinh luôn hiện hay thu vào tay nắm?"* — sai vì **bỏ qua
tầng ②**. Kiến trúc có **ba lớp gói**: ① lệnh chung không gói (≤9–10 lệnh, tiêu chí vào là *hành vi
giống nhau ở cả 3 chặng*, **không** phải "hay dùng") · ② **nhóm lệnh gói theo TẦN SUẤT**, hai khuôn:
**thư mục iOS** (mặt ô = lưới 2×2 xem trước, bấm là **MỞ**, hợp nhóm *chưa thuộc*) ↔ **ổ Photoshop**
(mặt ô = lệnh vừa dùng, bấm là **CHẠY LUÔN**, hợp nhóm *dùng liên tục tay đã quen*) · ③ **mini
window "Chỉnh lệnh vừa chạy"** (= Blender F9, **IF CHƯA CÓ**, giá trị cao nhất — nay đổi offset phải
Undo rồi làm lại từ đầu). T làm ① rồi nhảy thẳng sang cửa sổ, **để trống ②** ⇒ thấy vệ tinh "nhiều
quá". **Cảm giác rối không đến từ vệ tinh; nó đến từ chỗ trống ở tầng ②.**

## 8 · ĐÀO SÂU

| Cần gì | Đọc đâu |
|---|---|
| Khung cụm + ba biến thể + luật vật liệu K1–K4 (đọc docstring, nó là hợp đồng) | `components/render-studio/CuaSoCongCu.tsx` |
| Hộp công cụ bám vật (`NodeToolbar` thật) | `components/nodes/HopCongCuBamVat.tsx` |
| Cổng ra mang định nghĩa | `lib/nodes/dinh-nghia-ket-qua.ts` |
| Chốt gốc *tool window = subgraph node phóng to* + kính-là-vỏ + bậc thang điều khiển tay + khoá-giữ-vùng + seed-khoá | `docs/CHOT-RENDER-TOOL-WINDOW-2026-08-01.md` |
| Đặc tả vỏ 23/08 (5 thành phần · master tool gọi bằng chuột phải · Vitals trên đường ranh) | `docs/design-campaign/dna/WORKSPACE-SPEC-2026-08-23.md` |
| Đo hiện trạng: 6 ổ của `AppShell` · **BỐN** canvas · thanh đáy ai có ai không · Collab mồ côi | `docs/bao-cao-phien/2026-08-23-lane-workspace.md` |
| Kiến trúc tool 3 lớp · hai khuôn nhóm lệnh · mini window F9 | `docs/TICKET-KIEN-TRUC-LENH-3-TANG.md` |
| Bản vẽ | `docs/mocks/Workspace-ToolWindow.dc.html` (A–G, 3 nấc + vệ tinh) — trạng thái **NOT STARTED** |

### 🔴 ĐO ĐƯỢC 23/08 — bốn canvas, ba công nghệ
| Chặng/mode | Canvas | Công nghệ |
|---|---|---|
| 2D (sketch/pro) | `components/cad/CadCanvas.tsx` | `<canvas>` 2D tự viết |
| 3D · mode render | `components/FlowCanvas.tsx` | `@xyflow/react` |
| 3D · mode model3d | `components/three/Viewport3D.tsx` | three.js / WebGL |
| Trình chiếu | `components/present-editor/EditorCanvas.tsx` | DOM |

**Không có cách nào "gộp" chúng thành một mặt vẽ — đó không phải refactor, đó là viết lại engine.**
Cách đọc rẻ và trung thực hơn, khớp đúng kiến trúc đã chốt: **một canvas nền làm sơ đồ dây chuyền;
ba môi trường kia thành RUỘT của ba cửa sổ đứng trên nền đó.** MVP rẻ nhất để biết đúng/sai sớm:
một cửa sổ ảnh → dây → một cửa sổ 3D, cùng đứng trên `FlowCanvas`.
⚠️ Rủi ro phải xử **từ thiết kế**: **zoom lồng zoom** — từ nấc *vừa* trở lên, cửa sổ phải **thoát
khỏi phép biến đổi của canvas** (vẽ ở tỉ lệ màn hình, canvas trôi phía sau); nấc thu không có 3D sống.

**🔴 MÂU THUẪN CHƯA GIẢI — cấm tự chọn:**
- **Present đi đâu?** Đặc tả 23/08 nói ba chế độ là *Collab · 2D · 3D*, nhưng `Phase` hôm nay là
  `'concept' | 'render' | 'present'` và Present là **chặng nặng nhất trong ba** (route riêng, vỏ
  riêng, ~30 component, 3 mode nội bộ). Ba đường: **A1** Present là chặng thứ tư (rẻ nhất, nhưng
  câu "ba chế độ" thôi mô tả đúng app) · **A2** Present thành một chế độ trong Collab (đắt nhất,
  **trái chốt 13/08**) · **A3** hạ khỏi hàng chế độ, thành đầu ra (khớp nhất 13/08, chỉ hạ ở tầng
  **điều hướng**). Khuyến nghị của lane: **A3, chỉ đổi NHÃN + chỗ đứng trên rail, tuyệt đối không
  đụng `Phase`** — `'present'` là **khoá đã ghi ra đĩa** (localStorage, route, DB). ⛔ Quyết định
  sản phẩm, **chưa có câu trả lời thì chưa dựng rail cụm 2**.
- **Hai định nghĩa "master tool" cùng sống:** bản 15–16/08 (khung môi trường, nặng) ↔ bản 23/08
  (lớp ngữ cảnh gọi bằng chuột phải rồi tan, nhẹ). Chúng **có thể cùng sống** (chuột phải gọi lớp
  nhẹ; lớp nhẹ mở được khung môi trường) — nhưng **phải nói rõ**, nếu không phiên sau dựng nhầm cái
  kia. Đúng họ lỗi đã trả giá ở §6.
- **Search vào giữa ↔ Vitals đang đứng giữa** — hai điều chỉ hoà được nếu Vitals rời khỏi bề mặt
  header và sống hẳn dưới đường ranh. Và *search trong chặng thì tìm cái gì?* **chưa ai trả lời**.
- **Thanh đáy "luôn hiện"** — ổ đã có sẵn trong `AppShell`; còn thiếu ở Present · 3D-Node · Home,
  và 3D-3D đang đặt **ở TRÊN** thay vì trong ổ. Ba lần sửa một dòng ở **ba chủ sở hữu khác nhau** ⇒
  nên gom thành **một** phiếu.
- **`SPEC-MODE-PER-STAGE §1`** (*"mode mỗi chặng = đổi CẢ shell"*) đã bị chính mã vượt qua — vỏ nay
  đứng yên, chỉ ruột đổi. Văn bản **chưa đóng dấu lỗi thời tại chỗ**. Cùng lỗi: docstring
  `StageSwitcher.tsx` còn tự khai *"TRỤC ĐIỀU HƯỚNG DUY NHẤT của app"* trong khi nó đã gỡ khỏi
  header từ 17/08.
