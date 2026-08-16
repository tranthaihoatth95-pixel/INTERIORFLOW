# NC · SOI GIAO DIỆN BA CHẶNG — và đo "3 chặng như 3 app" bằng số

> Phiếu `docs/phieu-giao/P-S-soi-giao-dien-3-chang.md` · **phiếu ĐO, KHÔNG SỬA** (0 dòng code đổi).
> Điều khoản trích: **[N2]** đơn-giản-ngoài-sâu-trong (`docs/TRIET-LY-IF.md:60`) ·
> **[Đ2]** nhìn-vào-trong-trước (`:72`) — số của phiếu ĐÚNG, xem §0b.
> Mọi khẳng định dưới đây kèm `file:dòng` mở ra được. Ước tính thì ghi rõ là ước tính.

---

## 0 · TIỀN ĐỀ

### 0a · Tiền đề hạ tầng — kiểm bằng tệp, KHÔNG bằng git
Phiếu ⓪b bảo chạy `git log`/`git rev-list`, nhưng ⑤ và lệnh giao việc đều cấm chạy git.
Giải quyết bằng cách kiểm **dấu vết mốc** thay cho hash:

| Bằng chứng đòi mốc ≥ 15-16/08 | Có? |
|---|---|
| `components/ui/ToolbarChip.tsx` tồn tại, đã có `aria-describedby` (`:157`) — sửa 16/08 | ✅ |
| `lib/commands/toolbar-source.ts` tồn tại (B2, 16/08) | ✅ |
| `CadToolbar.tsx:88-91` — hai mảng `EDIT`/`MEASURE` đã xoá theo B2 | ✅ |
| cwd = `/Users/tranben/Downloads/interiorflow` (repo chính, không phải `.worktrees/*`) | ✅ |

⇒ đang đứng ở nhánh chính sau B2. Không dùng git nên **không chứng minh được `HEAD..main = 0`** — khai ở §7.

### 0b · Ba số của phiếu, đo lại
| Phiếu ghi | Đo thật | Kết |
|---|---|---|
| `[Đ2]` nhìn-vào-trong-trước ở `TRIET-LY-IF.md:72` | mở đọc: **`:72` = "[Đ2] NHÌN VÀO TRONG TRƯỚC"** — đúng nguyên văn, đúng dòng | ✅ **phiếu ĐÚNG**. (Tôi đã suýt báo sai: đọc lướt rồi định đổi thành `[Đ1]:69`; `:70` mới là `[Đ1]` "tầng sau là hệ quả tầng trước". Ghi lại vì đây đúng loại lỗi phiếu dặn tránh.) `[N2]` ở **`:60`** (phiếu không ghi số) |
| "KB-1..5" | `NC-TRIET-LY-GIAO-DIEN-2026-08-14.md` chỉ có **KB-1 (`:83`) · KB-2 (`:88`) · KB-3 (`:92`) · KB-4 (`:96`)** | 🔧 **không có KB-5** |
| "11 nhánh `cadMode==='sketch'`, 6 pen/touch, 3 bố cục, 2 test" | 13 nhánh mã sản phẩm + 4 dòng test; **8 pen/touch · 4 bố cục · 1 mặc định** | 🔧 số lệch — và **lệch trục**, xem §3 |

Không bác tiền đề nào ⇒ làm tiếp.

---

## 1 · BẢNG ĐỐI CHIẾU BA CHẶNG `[marker: doiChieu3Chang]`

Ba màn cùng gọi `<AppShell>`: 2D `components/studio/CadStageScreen.tsx:118` ·
3D `components/home/HomeScreen.tsx:634` · Trình chiếu `components/present-editor/PresentStageScreen.tsx:86`.

### Câu 1 — Ổ nào được dùng, ổ nào bỏ trống

`AppShell` có 6 ổ khai trong docstring (`AppShell.tsx:11-18`) + 1 prop `toolbar` (`:69`) = **7 chỗ cắm**.

| Ổ | 2D Kỹ thuật | 3D Thiết kế | Trình chiếu |
|---|---|---|---|
| ① Header 42px | `AppChrome` chung (`AppShell.tsx:139`) | chung | chung |
| ② Navigator | `LayerPanel`, **214px** (`CadStageScreen.tsx:50,121`) | `NodeLibraryPanel` / cây khối, **280px** (`AppShell.tsx:94`, `HomeScreen.tsx:638`) | **PLACEHOLDER CHỮ** — "Chuyển trang ở dải thumbnail dưới canvas" (`PresentNavigator.tsx:53-60`) + 2 lối tắt BOQ/Bảng thống kê |
| ③ Stage | `CadSheets` (`:51`) | `ModeShell` (`HomeScreen.tsx:669`) | `PresentSheets` (`PresentStageScreen.tsx:110`) |
| ④ Inspector 236px | `CadInspectorPages`, chỉ khi có chọn (`CadStageScreen.tsx:127`) | `Object3DInspector`, chỉ mode `model3d` + có chọn (`HomeScreen.tsx:641`) | **KHÔNG TRUYỀN GÌ** — dựng Inspector **riêng 280px** trong Stage (`PresentEditor.tsx:2271-2274`) |
| ⑤ Toolbelt (dock kính) | `CadToolbelt` (`CadStageScreen.tsx:133`) | **KHÔNG DÙNG** — `ToolDock3D` tự `position:absolute` trong Stage (`Render3DModeSkeleton.tsx:710`, `ToolDock3D.tsx:176`) | **KHÔNG DÙNG** |
| ⑥ statusBar 26px | `StatusBar stage="concept"` | `stage="render"` | `stage="present"` |
| ⑦ `toolbar` (prop) | **KHÔNG DÙNG** — `fileBar` nằm trong `CadEditor.tsx:693` (minHeight 44, `:3215`) | `RenderDocBar` (`HomeScreen.tsx:636`) ✅ | **KHÔNG DÙNG** — `Toolbar.tsx` nằm trong Stage |

🔴 **Trình chiếu dựng lại 4/7 chỗ cắm bên trong Stage**: thanh công cụ riêng (`Toolbar.tsx`, 1.511 dòng) ·
cột trái riêng 288px (`PresentEditor.tsx:185,1954`) · cột phải riêng 280px (`:187,2274`) · dải trang riêng
(`SlideStrip.tsx`). Cột trái riêng **đứng cạnh** cột Navigator 214px đang rỗng ⇒ ở màn 1440 người dùng
thấy **hai cột trái liền nhau = 502px**, cột ngoài không có nội dung.

### Câu 2 — Thanh công cụ: ở đâu · bao nhiêu nút · mấy hàng · hình dạng nút

| | 2D | 3D (mode `3d/3d`) | Trình chiếu |
|---|---|---|---|
| Chỗ đứng | **giữa-dưới Stage**, dock kính nổi (`AppShell.tsx:148`, `CadToolbelt.tsx:38-52`) | **giữa-dưới khung nhìn**, `absolute bottom:76` (`ToolDock3D.tsx:176,219`) | **trên cùng, in-flow**, `borderBottom` (`Toolbar.tsx:545-554`) |
| Số nút | **Sơ phác 22** · **Chuyên 51** (đếm ở §3) | thu gọn: chỉ nút có hành vi thật (`:167-169`) · mở rộng **21** (10 lệnh chung + 11 riêng) | **10 nút cấp 1** (Quay lại · Nhập · Xuất · Chữ · Ảnh · Hình · Thiết kế · ⋯ · Trình chiếu) + **10 chip lệnh chung** = 20; 6 lệnh Hình và 14 lệnh Sắp xếp nằm trong popover |
| Số hàng | **2 hàng** (`CadToolbelt.tsx:58-63`): hàng 2 = cụm cảm ứng ở Sơ phác, dải Model/Paper ở Chuyên | thu gọn **1 hàng** · mở rộng **2 hàng × 5 nhóm** (`ToolDock3D.tsx:214`) | **1 hàng `flexWrap:'wrap'`** (`Toolbar.tsx:553`) — hẹp thì tự xuống dòng, số hàng không xác định |
| Hình nút | `ToolbarChip` tròn `RADIUS.full`, cỡ `var(--tap)`/`--tap-lg` | `ToolbarChip` **có nhãn xếp cột** (`showLabel`, `:255`) | `ToolbarChip` cho icon-only (`:1001`) + **`Btn` pill ngang icon+chữ** riêng (`:921-977`), nay cũng `RADIUS.full` |
| Vỏ thanh | **tự vẽ kính** (`CadToolbelt.tsx:44-51`) | `ToolbarBar` chung khi thu gọn (`:175`) · **tự vẽ** khi mở rộng (`:216-225`) | **tự vẽ div** (`Toolbar.tsx:545-554`) |

⇒ **vỏ NÚT đã hợp nhất (`ToolbarChip` có ở cả ba), vỏ THANH thì chưa**: `ToolbarBar` chỉ được 2 nơi dùng
(`ToolDock3D.tsx:175` · `components/nodes/HopCongCuBamVat.tsx:56`), 2D và Trình chiếu vẫn tự vẽ.

### Câu 3 — Trục phải có gì, hiện khi nào

| | Nội dung | Điều kiện hiện | Cơ chế thu/mở | Bề rộng |
|---|---|---|---|---|
| 2D | `CadInspectorPages` (dải trang kiểu Rhino) | `selection.length > 0` | `FlankStrip` chung + phím **⇧I** (`AppShell.tsx:161,163`) | 236 cố định |
| 3D | `Object3DInspector` | `renderMode==='model3d' && selected3DName` | `FlankStrip` chung + phím **I** | 236 cố định |
| Trình chiếu | `Inspector` (Lớp · nền slide) | `hasInspectorContent` (`PresentEditor.tsx:1249`) | **nút riêng `.pe-panel-toggle` + splitter kéo**, **KHÔNG có phím tắt** (`:2261-2269, 2337-2345`) | **280, kéo được 220–460**, nhớ vào `localStorage` riêng (`:137-138`) |

✅ Luật NT-4 "tham số chỉ hiện khi có chọn" — **cả ba đạt**.
❌ Cách thu/mở: 2 chặng dùng cơ chế chung, 1 chặng dùng cơ chế riêng, và chỉ chặng riêng đó là chỗ
**không có phím tắt** — trong khi `lib/shortcuts.ts:196` khai 22 phím cho Trình chiếu.

### Câu 4 — Lối vào việc đầu tiên

| | Thấy gì trước | Bấm gì đầu tiên |
|---|---|---|
| 2D | Canvas trắng + `fileBar` + dock công cụ + `StageIntroCard` (`CadStageScreen.tsx:140`) | tự chọn công cụ, hoặc gõ lệnh vào `CommandLine`. **Không có EmptyState hướng dẫn trên canvas** — `grep ui/EmptyState components/cad` = **0** |
| 3D | mode mặc định `render` = canvas node; mode `model3d` = `Render3DModeSkeleton` | mode `model3d` có 2 nút vào việc ("Đùn từ bản vẽ" / "Dựng khối đầu tiên"). `grep ui/EmptyState components/render-studio` = **0** |
| Trình chiếu | **`PresentDocTypePicker`** — thư viện mẫu 4 loại × 3-4 thẻ ảnh thật (`PresentDocTypePicker.tsx:44-70`), `PresentSheets.tsx:661` | bấm một thẻ mẫu là vào thẳng việc |

⇒ **Trình chiếu có cửa vào tốt nhất trong ba chặng** (đúng chốt 10/08 "cửa vào = thư viện mẫu").
2D và 3D vào thẳng màn trắng. `components/ui/EmptyState.tsx` có và được 8 tệp dùng — **không tệp nào
thuộc ba canvas chính**.

### Câu 5 — Thứ chỉ chặng này có

| Chặng | Chỉ nó có |
|---|---|
| 2D | dòng lệnh gõ tay (`inputPathsFor('cad')='typed'`, `toolbar-source.ts:216`) · hai mode Sơ phác/Chuyên · Model↔Paper space (`CadToolbelt.tsx:36`) · cụm cảm ứng `CadTouchDock` · `FoldableDualPane` + `ReferencePane` · ống hút thuộc tính · 30 tool khoá theo mode (`store.ts:184`) — **7** |
| 3D | phím đơn không cần Enter (`inputPathsFor('render')='directKey'`) · hai mode Node↔3D · ViewCube/gizmo · cử chỉ 3 ngón quét giờ nắng (`Render3DModeSkeleton.tsx:546`) · hàng đợi render nổi ngoài AppShell (`HomeScreen.tsx:690`) · ổ `toolbar` (`RenderDocBar`) · **bảng lệnh ⌘K thứ hai** (`HomeScreen.tsx:694`) — **7** |
| Trình chiếu | cửa chọn loại hồ sơ · dải thumbnail trang · 3 tab Bố cục/Reference/Motion · hai panel kéo-giãn-được · 3 màn con trong cùng chặng (deck/BOQ/Bảng thống kê, `PresentStageScreen.tsx:42`) · `ChatPanel` + `CommentLayer` (`:113-114`) — **6** |

---

## 2 · ĐO "3 CHẶNG NHƯ 3 APP" BẰNG SỐ `[marker: doLechBaChang]`

Bốn phép đo độc lập, mỗi phép có công thức đo lại được. **Cố ý không gộp thành một điểm duy nhất
bằng trung bình** — bốn phép đo khác đơn vị, trung bình chúng là số đẹp mà vô nghĩa. Con số tổng
đề xuất ở cuối là **đếm việc**, không phải trung bình phần trăm.

### Phép đo A — ĐIỂM KHỚP Ổ (43%)
*Công thức:* mở 3 tệp màn chặng, đọc prop truyền vào `<AppShell>`; một ổ tính là **khớp** khi cả ba
chặng dùng nó theo cùng một cách.

Khớp: ① header · ③ Stage · ⑥ statusBar = **3**. Lệch: ② (nội dung + bề rộng 214/280/rỗng) ·
④ (2 chặng dùng ổ chung, 1 chặng dựng riêng) · ⑤ (1/3 dùng) · ⑦ (1/3 dùng) = **4**.
⇒ **3/7 = 43%**.

*Số đi kèm, dễ đối chiếu hơn:* **5 bản dựng lại** vỏ mà lẽ ra dùng ổ chung —
2D thanh tệp (1) · 3D dock công cụ (1) · Trình chiếu thanh công cụ + cột trái + cột phải (3).

### Phép đo B — LỆNH CHUNG SỐNG ĐƯỢC (63%)
*Công thức:* `commonCommandsFor({stage})` trả 10 lệnh (`toolbar-source.ts:111-114` — lệnh khai đủ 3
chặng trong `stages`); đếm `enabled` sau `bindStage` của từng thanh.

| Chặng | Bật | Mờ | Bằng chứng |
|---|---|---|---|
| 2D | **10/10** | 0 | `CadToolbar.tsx:255-269` nối đủ 10 tay thi hành |
| 3D | **7/10** | 3 (Xoá · Đối xứng · Chữ) | `ToolDock3D.tsx:96-102` nối 5; Hoàn tác/Làm lại bật theo `CAD_OR_RENDER` (`registry.ts:467,475`) |
| Trình chiếu | **2/10** | **8** | `Toolbar.tsx:727-729` chỉ nối Hoàn tác/Làm lại |

⇒ **19/30 = 63%**. Ở Trình chiếu, **8/10 chip của tầng "lệnh chung" là chip mờ vĩnh viễn** —
đúng luật §9 (mờ kèm lý do thật, `toolbar-source.ts:69-104`) nhưng với mắt người dùng thì tầng
lệnh-chung ở đó gần như trống.

### Phép đo C — MỘT VIỆC, BA CHỖ (1/5 đứng cùng chỗ)
*Công thức:* chọn 5 việc mọi chặng đều phải làm; ghi **chỗ đứng · tên · phím hiện trên nút**.

| Việc | 2D | 3D | Trình chiếu | Cùng? |
|---|---|---|---|---|
| Hoàn tác | chip cuối dock đáy, "Hoàn tác", hiện **⌘Z** (`CadToolbar.tsx:289`) | chip dock đáy, "Hoàn tác", **không hiện phím** (`ToolDock3D.tsx:114` chỉ lấy `directKey`, mà Hoàn tác không có `directKey`) | chip thanh trên, "Hoàn tác", **không hiện phím** (`Toolbar.tsx:731-739`, `IconOnly` không có `shortcutHint`) | ❌ phím hiện ở **1/3** |
| Xoay | chip nhóm SỬA, **chỉ mode Chuyên**, hiện alias `RO` | chip nhóm Lệnh chung, hiện phím `Q` | chip **mờ** — "Chưa nối lệnh xoay cho trang trình chiếu" | ❌ |
| Xuất tệp | menu Xuất **trong canvas** (`CadEditor.tsx:703`), 9 mục | `RenderIOMenus` ở **ổ toolbar trên cùng** (`RenderDocBar.tsx:41`) | menu Xuất **accent, thanh trên editor** (`Toolbar.tsx:603-648`), 7 mục | ❌ 3 chỗ khác nhau |
| Mở Thư viện | nút đáy Navigator, phím **⇧L** | nút đáy Navigator, phím **L** | nút đáy Navigator, phím **L** | ✅ (phím lệch có lý do đã ghi: `Navigator.tsx:61-64`) |
| Thu/mở panel phải | `FlankStrip` + **⇧I** | `FlankStrip` + **I** | nút riêng, **không phím** | ❌ |

⇒ **1/5 = 20%**.

### Phép đo D — CHIA SẺ CODE (2/9 component · 5% dòng)
*Công thức:* `grep -rhoE "from '@/components/(ui|studio)/[A-Za-z0-9_-]+'"` trong 3 thư mục chặng.

- Component `components/ui/*` được ít nhất 1 chặng dùng: **9** (IOMenu · MenuButton · Popover ·
  ToolbarChip · Tooltip · command-icon · LightArc · PanelFlank · EmptyState).
- Dùng ở **cả ba** chặng: **2** (`ToolbarChip`, `command-icon`) = **22%**. Dùng ở ≥2: 6 = 67%.
- Dòng mã: `components/cad` **13.052** + `components/render-studio` **8.757** +
  `components/present-editor` **14.799** = **36.608 dòng riêng chặng**, so với `components/ui`
  **2.205** = **5,7%**.

### 🔢 CON SỐ TỔNG ĐỀ XUẤT — "**5 BẢN DỰNG LẠI / 7 Ổ**", theo dõi kèm 4 số con
Một câu để lần sau so: *"Tháng 8/2026: 5 bản dựng lại trên 7 ổ · khớp ổ 43% · lệnh chung sống 63% ·
việc-cùng-chỗ 20% · component dùng chung cả ba 22%."*
Đo lại chỉ cần 4 lệnh grep + đọc 3 lời gọi `<AppShell>` — không cần chạy app.

### Một số phụ, nói đúng cái Hoà nhìn thấy: **DIỆN TÍCH CÒN LẠI CHO NỘI DUNG**
Ước tính từ hằng số trong mã, màn 1440×900, chưa chọn đối tượng nào (⚠️ **ước tính, chưa đo DOM**):

| | Chrome ngang | Chrome dọc | Canvas còn lại |
|---|---|---|---|
| 2D | 214 (Navigator) | 42+44+34+26 = 146 | 1226×754 ≈ **71%** |
| 3D `model3d` | 280 + 256 (`Command3DPanel`, `Render3DModeSkeleton.tsx:525`) = 536 | 42+~40+26 ≈ 108 | 904×792 ≈ **55%** |
| Trình chiếu | 214 + 288 + 280 = **782** | 42+~47+~132+26 ≈ 247 | 658×653 ≈ **33%** |

⇒ Chặng Trình chiếu dành **54% bề ngang cho chrome**, và 214px trong đó là cột rỗng.
Đây là con số cụ thể nhất cho lời chê "khó dùng", và nó trái NT-1 ("nội dung chiếm sân khấu").

---

## 3 · SKETCH ↔ PRO — HOÀ ĐÚNG HAY SAI `[marker: sketchVsPro]`

### 3a · Liệt kê đầy đủ mọi chỗ hai mode rẽ nhánh

**Nhóm ① — KHÁC NĂNG LỰC** (có lệnh mà mode kia không có)

| Chỗ | Khác gì |
|---|---|
| `CadToolbar.tsx:445-452` | nhóm VẼ: Chuyên 5 lệnh trực tiếp + nút ↘ mở **8 lệnh nữa**; Sơ phác **4 lệnh**, không có ↘ |
| `:479` | nhóm SỬA: Chuyên `Dời·Chép·Xoay·Lật` (4); Sơ phác chỉ `Dời` (1) |
| `:483` | `MODIFY` **13 lệnh** (Offset·Trim·Extend·Fillet·Chamfer·Array×2·Scale·Stretch·Break·Join·Explode·Lengthen) — Pro-only |
| `:486` | ĐO & GHI CHÚ: Chuyên `Đo·Chữ` (2); Sơ phác `Đo` (1) |
| `:488` | `DIMENSION` **6 lệnh** ghi kích thước — Pro-only |
| `:491` | `DIAGRAM` **3 lệnh** (Zone·Arrow·Đường cam) — Pro-only |
| `:520` | "Bắt góc" (polar tracking) — Pro-only |
| `lib/cad/store.ts:184-192` | `PRO_ONLY_TOOLS` = **30 tool** khoá cứng; `setCadMode` (`:497`) tự trả tool về `select` khi rời Pro |
| `lib/cad/store.ts:159` | `shouldShowProTools(role, stage, cadMode)` — cổng gate cấp store |
| `CadStageScreen.tsx:58` ↔ `:68` | kệ Thư viện: `sketch` **2 kệ** · `pro` **5 kệ** |
| `CadToolbelt.tsx:36` + `CadSheets.tsx:865` | **Paper space chỉ tồn tại ở Chuyên** — Sơ phác không có khái niệm tờ in |

**Đếm nút thật trên thanh** (theo thứ tự render `CadToolbar.tsx:433-553`, không tính 2 nút gạt mode):

| | Sơ phác | Chuyên |
|---|---|---|
| VẼ | 1 + 4 = 5 | 1 + 5 + 1(↘) = 7 |
| CẤU KIỆN | 3 | 3 |
| Vật liệu · Cửa đi | 2 | 2 |
| SỬA | 1 + 1(ống hút) = 2 | 4 + 1 = 5 |
| MODIFY | 0 | 13 |
| ĐO & GHI CHÚ | 1 | 2 |
| DIMENSION | 0 | 6 |
| Markup | 1 | 1 |
| DIAGRAM | 0 | 3 |
| Nội thất | 1 | 1 |
| Bắt điểm · Lưới · Bắt góc | 2 | 3 |
| Kéo màn · Vừa màn | 2 | 2 |
| Xoá · Hoàn tác · Làm lại | 3 | 3 |
| **TỔNG** | **22** | **51** |

⇒ Chuyên có **thêm 29 lệnh, gấp 2,3 lần**.

**Nhóm ② — KHÁC CÁCH NHẬN ĐẦU VÀO** (bút / chạm) — **8 chỗ**

| Chỗ | Việc |
|---|---|
| `CadCanvas.tsx:750` | ghi nhớ đã thấy bút (`penSeen`) |
| `:752` | **chống tì tay** — `shouldRejectTouch` chỉ chạy ở Sơ phác |
| `:780` | theo dõi cử chỉ 2 ngón |
| `:793` | **nhấn-giữ bằng ngón/bút ra đĩa lệnh** |
| `:1041`, `:1147` | ghi `penUpAt` (nhấc bút) khi thả / khi hệ ngắt |
| `CadTouchDock.tsx:61` | **cụm 9 nút cảm ứng chỉ mount ở Sơ phác** (Ortho·Số liệu·Lệnh·Kéo·Ngón vẽ·Enter·Esc·Undo·Redo) |
| `lib/cad/safe-area.ts:37` | canvas chừa chỗ cho cụm đó |
| `CadToolbar.tsx:289,315` | Sơ phác **không hiện alias gõ** — không có bàn phím để gõ `RO` |

**Nhóm ③ — KHÁC BỐ CỤC / CỠ** — **6 chỗ**

| Chỗ | Số |
|---|---|
| `CadToolbar.tsx:199` | icon 17 ↔ **20** |
| `:201` + `btnSize():703-706` | nút `var(--tap)` **32** ↔ `var(--tap-lg)` **44** = **×1,375** |
| `:657-658` | nút gạt mode: cao 30↔**40**, đệm 12↔**18** |
| `CadToolbelt.tsx:35` | hàng 2 = dải Model/Paper ↔ **cụm cảm ứng** |
| `MaterialPalette.tsx:98` | bảng vật liệu `bottom` 120 ↔ **252** (né cụm cảm ứng) |
| `CadSheets.tsx:865` | Sơ phác luôn `CadEditor`; Chuyên còn nhánh Paper |

### 3b · Kiểm chứng giả thuyết của T — **BÁC MỘT PHẦN**
T nghi *"sketch thực chất ĐÃ LÀ chế độ bút+cảm ứng mà chưa ai gọi đúng tên"*.

- ✅ **Đúng nửa đầu**: 8/13 nhánh mang chữ `'sketch'` là bút/chạm, và hai nhánh nặng nhất
  (`CadTouchDock.tsx:61` mount cả cụm 9 nút, `safe-area.ts:37`) T đếm thiếu.
- ⛔ **Sai nửa sau — "chưa ai gọi đúng tên"**: `CadToolbar.tsx:678` đã ghi đúng bằng chữ trong
  ô giải nghĩa: *"Vẽ bằng ngón tay: bộ công cụ tối giản, nút cỡ lớn, có cụm nút cảm ứng thay phím tắt."*
  `CadTouchDock.tsx:4` cũng tự khai *"cụm nút CẢM ỨNG của chế độ Sketch"*. Tên bị giấu, không bị thiếu:
  **nhãn hiện trên nút là "Sơ phác"** (nói về độ hoàn thiện) còn lời giải thích đúng thì nằm sau con trỏ.
- 🔴 **Chỗ T đo lệch TRỤC, quan trọng hơn cả hai điều trên**: `grep "cadMode === 'sketch'"` **không thể**
  bắt được trục NĂNG LỰC, vì trục đó viết bằng biến khác — `isPro` (`CadToolbar.tsx:184`, dùng **25 lần
  trong một tệp**), `PRO_ONLY_TOOLS` (30 tool), `shouldShowProTools`. Đếm theo chuỗi `'sketch'` sẽ luôn
  ra kết luận "sketch chỉ là chế độ chạm" — kết luận đúng với dữ liệu đã đếm, sai với hệ thống thật.

### 3c · Trả lời thẳng Hoà: **ĐÚNG VỀ TRẢI NGHIỆM, SAI VỀ CƠ CHẾ — và cái sai đó là lỗi của cách bày**

**Sai ở đâu.** Chuyên có **29 lệnh** Sơ phác không có (51 ↔ 22), **30 tool khoá cứng**,
**Paper space**, **3 kệ thư viện** nữa. Đây không phải phóng to giao diện.

**Đúng ở đâu — ba điều, đều đo được.**

1. **5/6 ổ giao diện y hệt nhau, theo đúng thiết kế.** Hai mode dùng **chung một hằng số**
   `CAD_NAVIGATOR` và `CAD_CANVAS` (`CadStageScreen.tsx:50-51` khai, `:56-57` và `:66-67` cùng trỏ vào).
   Docstring `:24-26` tự khai đúng câu Hoà nói: *"Sketch/Pro chỉ khác BỘ CÔNG CỤ trong `CadToolbar`,
   không khác Navigator/canvas"*. Thứ đổi nằm gọn trong ổ ⑤.
2. **Thứ đổi rõ nhất trong ổ ⑤ đúng là CỠ.** 44 ↔ 32 px = ×1,375, cộng icon 20↔17 và nút gạt 40↔30.
   Đổi mode, thứ mắt bắt được đầu tiên là **mọi thứ nhỏ lại** — nghĩa đen của "phóng to giao diện".
3. ⭐ **29 lệnh thêm phần lớn nằm NGOÀI MÉP MÀN.** Thanh là một hàng cuộn ngang
   (`CadToolbar.tsx:427-431` `maxWidth:100%; overflowX:auto`), và dấu hiệu duy nhất báo còn nút bên
   ngoài là **vệt mờ 18px hai mép** (`globals.css:378-381`) — **không có con số "còn N lệnh"**,
   không có mũi tên.

   Ước tính bề rộng thanh từ hằng số trong mã (⚠️ **ước tính ±10%, chưa đo DOM**):
   nút `45×32 + 6×44 = 1.704` + khe `50×4 = 200` + 4 nhãn nhóm ≈ 264 + 9 vạch ≈ 45 + nút gạt mode ≈ 145
   + đệm 12 ⇒ **Chuyên ≈ 2.370px**; cùng cách tính **Sơ phác ≈ 1.537px**.
   Chỗ chứa: `1440 − 214 (Navigator) − 24 (đệm dock) = 1.202px`.
   ⇒ **Chuyên tràn ~1.170px (≈49% thanh nằm ngoài màn)**; Sơ phác tràn ~335px (≈22%).

**⇒ Kết luận một câu:** hai mode khác nhau thật và khác rất nhiều, nhưng **gần một nửa cái khác đó
không hiện ra trên màn**, còn cái hiện ra thì đúng là cỡ nút. Hoà mô tả chính xác thứ mình nhìn thấy.
Việc phải sửa không phải "làm hai mode khác nhau hơn" mà là **bày cho thấy 29 lệnh kia** — đúng tầng ②
"gói lệnh" của `kien-truc-tool-3-lop` / KB-1 đã chốt mà chưa thi công.

---

## 4 · CHẤM THEO HIẾN PHÁP GIAO DIỆN `[marker: chamNT]`

### 4a · NT có liên quan (không chấm điều không đụng tới phiếu này)

| NT | 2D | 3D | Trình chiếu | Bằng chứng |
|---|---|---|---|---|
| NT-1 nội dung chiếm sân khấu | ✅ ~71% màn là canvas, dock nổi | 🟡 ~55% | ❌ ~33%, chrome ngang 782px trong đó **214px là cột rỗng** | §2, `PresentNavigator.tsx:53-60` |
| NT-2 một hành động chính accent | 🟡 Model space **0 CTA accent**; Paper có "Xuất PDF" accent (`CadToolbelt.tsx:97`) | 🟡 chưa kiểm hết | 🟡 accent duy nhất là **"Xuất"** (`Toolbar.tsx:607`), không phải hành động chính của màn | |
| NT-4 tham số chỉ khi có chọn | ✅ | ✅ | ✅ | §1 câu 3 |
| NT-5 capsule + bo đồng tâm | ✅ `ToolbarChip` `RADIUS.full` | ✅ nút; 🟡 vỏ dock mở rộng `borderRadius:14` gõ số (`ToolDock3D.tsx:220`) | 🟡 `Btn` đã về `RADIUS.full`; **`SlideStrip.tsx:206` nút 24×24 r6** ngoài cả `--tap` 32 lẫn khuôn chip | |
| NT-8 nhãn/ngôn ngữ bản vẽ | 🟡 nhãn nhóm mono-uppercase có (`CadToolbar.tsx:568-583`) | 🟡 tương tự (`ToolDock3D.tsx:240`) | ❌ không có tầng nhãn nhóm | |
| NT-10 **một registry** cho tooltip/⌘K/bảng phím | 🟡 | 🟡 | ❌ | xem 4b |
| NT-16 kính chỉ ở lớp nổi | ✅ chỉ dock nổi có `backdrop-filter` (`CadToolbelt.tsx:48-49`) | ✅ `ToolDock3D.tsx:9-14` cố ý **không** dùng kính, có ghi lý do | ✅ không dùng kính | |
| NT-17 màn trống có 1 câu + 1 hình + 1 nút | ❌ `EmptyState` 0 lần | ❌ 0 lần | 🟡 cửa vào là thư viện mẫu (tốt hơn EmptyState), nhưng không đi qua component chung | §1 câu 4 |

### 4b · NT-10 — chỗ hỏng gọn nhất, đo được
NT-10 (`NC-NGUYEN-TAC-GIAO-DIEN:121`) đòi *"một registry cho tooltip/⌘K/bảng phím"*. Đo:

| Mặt tiền | Đọc từ đâu | Đạt? |
|---|---|---|
| Tooltip trên nút | `lib/commands/registry.ts` qua `toolbar-source` | ✅ (B2 16/08) |
| Bảng ⌘K | `registry.ts` (`AppCommandPalette.tsx:158`) | ✅ |
| **Bảng ⌘/** | **`lib/shortcuts.ts`** — 76 entry tự khai (9 toàn cục · 27 cad · 18 render · 22 present), `import` từ `./cad/command-aliases`, `grep "commands/registry"` = **0** | ❌ **nguồn thứ hai** |

Kèm hai điều đo được ngay:
- `CommandDef.surfaces` khai `'shortcut'` cho 4 lệnh (`registry.ts:433,458,467,475`) nhưng
  `grep surfaces` ngoài registry = **chỉ `registry.test.ts:44`** ⇒ **trường khai mà không nơi nào đọc lúc chạy**.
- **⌘Z tự cài 5 nơi độc lập**: `CadCanvas.tsx:2477` · `PresentEditor.tsx:1588` · `FlowCanvas.tsx:550` ·
  `BoqScreen.tsx:200` · `PhotoEditor.tsx:82`.

### 4c · Đối chiếu L1–L8 (mục 6 `NC-NGUYEN-TAC-GIAO-DIEN`, 14/08)

| # | Trạng thái 16/08 | Bằng chứng |
|---|---|---|
| **L1** ba khuôn thanh công cụ | 🟡 **một phần** — vỏ NÚT hợp nhất (`ToolbarChip` cả 3 chặng); vỏ THANH chưa (`ToolbarBar` chỉ 2 nơi); **chỗ đứng vẫn 3 kiểu** (đáy nổi / đáy nổi / trên in-flow) và số hàng vẫn 2/1-2/wrap | §1 câu 2 |
| **L2** đường bàn phím ≈ 0 | 🟡 **một phần** — ⌘K **đã có** cho cả 5 màn (`AppShell.tsx:185`); hint cạnh lệnh có ở 2D/3D, **không có ở Trình chiếu**; `hotkey-registry` vẫn ⬜ trong sổ frontier; bảng ⌘/ vẫn nguồn thứ hai | 4b |
| **L3** Files/Thư viện empty thô | ⬜ **CHƯA KIỂM** — ngoài phạm vi 3 chặng của phiếu này | — |
| **L4** 4 nút phơi thường trực mỗi thumbnail | 🔴 **CÒN NGUYÊN** — `SlideStrip.tsx:136-153`, 4 nút 24×24 luôn hiện, dùng `disabled` (mất focus, đúng lỗi `ToolbarChip` vừa sửa 16/08) và `title=` (câm trên cảm ứng) | |
| **L5** khung tên còn jargon | ⬜ **CHƯA KIỂM** — thuộc tầng output | — |
| **L6** "Xuất" accent lẫn chip + separator lửng | 🟡 **nửa xong** — separator đã là vạch 1px, không phải ký tự `|` (`Toolbar.tsx:1122`, `CadToolbar.tsx:561`) ✅; phần accent vẫn: **"Xuất" là accent duy nhất** còn "Trình chiếu" (hành động chính) là nút thường (`:897`) | |
| **L7** dải kết quả + hàng đợi nhìn thấy | 🟡 hàng đợi **có** (`RenderQueuePanel`, `HomeScreen.tsx:690`, nghiệm thu 15/08); **dải thumbnail kết quả chưa có** | |
| **L8** glow chỉ khi sống | 🟡 thanh tiến trình xong-máy 16/08 (`thanh-tien-trinh-hai-loai` ✅); `card-kinh-gradient` vẫn ⬜ | `soi:frontier` |

### 4d · LỆCH MỚI, chưa có trong L1–L8

| # | Lệch | Bằng chứng |
|---|---|---|
| **L9** | **Trình chiếu dựng lại 4/7 chỗ cắm bên trong Stage**, để ổ chung rỗng ⇒ hai cột trái liền nhau 214+288 = 502px, cột ngoài không nội dung | `PresentNavigator.tsx:53-60` · `PresentEditor.tsx:1954, 2274` |
| **L10** | **Hai sổ phím song song** — `registry.ts` (10 lệnh chung) vs `lib/shortcuts.ts` (76 entry); bảng ⌘/ đọc sổ 2. Kèm `surfaces` khai mà không ai đọc | 4b |
| **L11** | **⌘Z cài 5 nơi độc lập** | 4b |
| **L12** | **Chặng 3D mount HAI bảng lệnh cùng lúc**: `AppCommandPalette` (`AppShell.tsx:185`) + `CommandPalette` (`HomeScreen.tsx:694`). Đọc mã thì cái thứ hai **không mở được nữa**: `setPaletteOpen` chỉ được gọi từ chính ⌘K của nó (`CommandPalette.tsx:66`, nghe **bubble trên `window`**), mà `AppCommandPalette` nghe **capture trên `document`** rồi `stopPropagation()` (`:82-88`) ⇒ thắng trước. **NHƯNG** khi con trỏ đang ở trong ô nhập, `AppCommandPalette` `return` **không** `stopPropagation` (`:84`) ⇒ lúc đó bảng CŨ mới mở ⇒ **cùng phím ⌘K mở hai bảng khác nhau tuỳ đang gõ hay không**. ⚠️ suy từ thứ tự sự kiện DOM, **chưa bấm thử trên app** | |
| **L13** | **Ba canvas chính không dùng `EmptyState` chung** — `grep ui/EmptyState` trong `components/cad`, `components/render-studio` = 0; KB-2 chưa quét tới | §1 câu 4 |

---

## 5 · BA VIỆC ĐÁNG LÀM NHẤT

Xếp theo **lợi / chi phí**, không chấm điểm chặng nào.

### Việc 1 — GÓI 22 LỆNH ÍT DÙNG CỦA THANH 2D VÀO 3 NHÓM XỔ
*Sửa được gì:* đóng đúng điều Hoà nhìn thấy khi chê sketch↔pro — 51 nút một hàng cuộn, ~49% nằm
ngoài mép, không con số nào báo. Gói `MODIFY` (13) + `DIMENSION` (6) + `DIAGRAM` (3) thành 3 nhóm
⇒ 51 → **~24 nút hiện**, thanh về ≈ 1.150px, **hết tràn ở 1440**.
*Tốn cỡ nào:* **nhỏ** — khuôn đã có sẵn ngay trong tệp: `MoreDrawButton` (`CadToolbar.tsx:328-413`)
dùng `components/ui/Popover`. Nhân lên 3 lần, không đụng registry, không đụng store.
*Đụng chốt nào:* **thi hành**, không trái — KB-1 tầng ② "gói lệnh dạng dropdown 1 dòng + icon"
(`NC-TRIET-LY-GIAO-DIEN:84`) và `kien-truc-tool-3-lop` (chốt 13/08). Giữ nguyên §9: gói lại là
**đổi chỗ đứng, không bớt lệnh** — đúng tiền lệ H4 13/08 đã làm ở Trình chiếu (`Toolbar.tsx:679-681`).

### Việc 2 — MỘT DÒNG: CHO PHÍM TẮT HIỆN Ở CẢ BA CHẶNG
*Sửa được gì:* phép đo C — cùng một lệnh "Hoàn tác", phím chỉ hiện ở **1/3** chặng.
3D: `shortcut: c.directKey` → `c.directKey ?? fmtKey(c.key)` (`ToolDock3D.tsx:114`).
Trình chiếu: `IconOnly` nhận thêm `shortcutHint` rồi truyền `c.key` (`Toolbar.tsx:731-739`, `:987-1010`).
*Tốn cỡ nào:* **rất nhỏ** — 2 tệp, ~10 dòng, dữ liệu đã có sẵn trong `CommonCommand.key`.
*Đụng chốt nào:* không. Là bước rẻ nhất của NT-10, và **không** giải quyết L10 (bảng ⌘/ vẫn nguồn thứ hai)
— nói rõ để không tưởng đã đóng.

### Việc 3 — TRẢ 4 CHỖ CẮM CỦA TRÌNH CHIẾU VỀ Ổ CHUNG
*Sửa được gì:* nguồn lớn nhất của "3 như 3 app" (phép đo A: 3/5 bản dựng lại nằm ở đây) và của
"khó dùng" (canvas chỉ còn 33% màn, 214px cột rỗng). Xong việc này thì khớp ổ **43% → 86%**.
*Tốn cỡ nào:* **lớn, và đây là chỗ dễ đánh giá thấp** — chặn ở việc `deck`/`current` là state cục bộ
trong `useEditor()` sâu trong `PresentEditor.tsx` (2.585 dòng); `PresentNavigator.tsx:5-12` đã khai đúng
lý do chưa làm từ 03/08. Phải nâng state lên store dùng chung trước, rồi mới dời panel.
**Đề nghị chẻ đôi:** ①**nâng state + Navigator hiện danh sách trang thật** (giá trị thấy ngay: xoá cột
rỗng, trả 214px) → ②dời Inspector 280 về ổ ④ và thanh công cụ về ổ `toolbar`.
*Đụng chốt nào:* hợp Trụ 1 `SPEC-HA-TANG-UI-IF` ("ổ cố định, ruột thay đổi") và NT-1.
⚠️ Một thứ **phải giữ, không được coi là dư**: Inspector Trình chiếu **kéo giãn được 220–460**
(`PresentEditor.tsx:132-133`) còn ổ ④ **ghim cứng 236** (`AppShell.tsx:39`) — dàn trang cần bề rộng
thay đổi thật. Dời panel mà bỏ mất tính năng kéo là **đổi một lệch lấy một lệch**;
đúng cách là cho ổ ④ nhận bề rộng, không phải cắt tính năng của chặng.

---

## 6 · NGHIỆM THU

| Cửa | Kết quả |
|---|---|
| `npm run soi:frontier` | **0 LỆCH** · 👁1 qua mắt · ✅70 xong-máy · ⬜55 chờ |
| `npm run soi:tu-dien` | 🟡 252 chỗ chữ trần (nợ cũ, không chặn). Phạm vi quét = `docs/phieu-giao` + `docs/mocks` ⇒ **hai tệp của phiên này (`docs/nc/`, `docs/bao-cao-phien/`) không nằm trong phạm vi, không làm tăng số nào** |
| Code đổi | **0 dòng** |

---

## 7 · CHƯA CHẮC / CHƯA KIỂM

1. **KHÔNG mở app thật, không chạy dev server** (phiếu cấm). Toàn bộ báo cáo là **đọc mã**.
   Ba nhóm số cần một lượt mở trình duyệt mới thành chắc:
   - bề rộng thanh 2D (§3c) — tính từ hằng số, sai số **±10%** vì bề rộng 4 nhãn nhóm chữ Việt ước theo font;
   - tỉ lệ diện tích canvas (§2) — chưa đo DOM, chưa tính lúc Inspector mở;
   - **L12 hai bảng lệnh** — suy từ thứ tự capture/bubble của DOM (xác định về lý thuyết), **chưa bấm ⌘K thử**.
2. **Chặng quét NÔNG HƠN: 3D.** Nói thẳng: phiếu cấm ghi vào `components/render-studio/**` và một phiên
   phụ khác đang giữ vùng đó, nên tôi chỉ đọc `ToolDock3D` · `Tool3DBar` (tên tệp) · `Render3DModeSkeleton`
   (bố cục) · `RenderDocBar`. **Chưa đọc**: `Command3DPanel` (nội dung trục phải), `CuaSoCongCu`/`ToolWindow`
   (master tool), mode `3d/node` (canvas node) gần như chưa soi. Con số "7 thứ chỉ 3D có" và ô NT-2 của 3D
   vì thế **kém tin cậy hơn** hai chặng kia. 2D và Trình chiếu quét đủ sâu (đọc hết thanh công cụ, màn chặng,
   navigator, inspector, dải thumbnail).
3. **Phép đo V2 nào do tôi tự chọn — người khác chọn khác sẽ ra số khác:**
   - **Mẫu số của phép đo A** = 7 chỗ cắm. Ai tính 6 ổ (bỏ prop `toolbar` vì không nằm trong docstring)
     thì ra **3/6 = 50%**, không phải 43%.
   - **"Khớp"** tôi định nghĩa là *cả ba dùng cùng cách*. Ai chấm theo *chặng nào dùng ổ chung* sẽ ra
     tỉ lệ cao hơn hẳn (2D 5/7, 3D 5/7, Trình chiếu 3/7).
   - **Phép đo C** dùng 5 việc do tôi chọn; chọn 5 việc khác (vd Lưu · Zoom · Bỏ chọn) sẽ ra tỉ lệ khác.
   - **Phép đo D** đếm `components/ui` mà **không** đếm `components/studio` (`AppShell`/`Navigator`/
     `StatusBar` đều dùng chung ở cả ba). Đếm cả `studio` thì tỉ lệ chia sẻ tăng đáng kể.
   - Tôi **cố ý không** trung bình 4 số thành một điểm — bốn thứ khác đơn vị.
4. **Đếm nút 22/51 là đếm TĨNH theo mã**, giả định `isPro` bật và không có Popover nào mở. Chưa trừ
   trường hợp `cadMode==='revit'` (chạy như `pro`, `store.ts:160`).
5. **L3 và L5 chưa kiểm** — nằm ngoài ba chặng (kho Files/Thư viện; tầng output khung tên).
6. **Không chứng minh được worktree đúng mốc `main`** vì không được chạy git — chỉ kiểm gián tiếp qua
   dấu vết tệp (§0a).
7. **`shouldDirectKeyFire` / `findByDirectKey`** (`toolbar-source.ts:243,262`) tôi đọc hợp đồng chứ
   **chưa truy nơi gọi thật** ở 3D — không kết luận gì về đường phím đơn có chạy hay chưa.

---

## 8 · HẠN DÙNG

Kết luận trong tệp này đúng cho ảnh chụp mã **16/08/2026**. Hết hiệu lực khi bất kỳ điều nào xảy ra:
- `hotkey-registry` B2/B3 thi công tiếp (đổi §2 phép đo B và §4b);
- Trình chiếu dời panel về ổ chung (đổi §1, §2 phép đo A, L9);
- thanh 2D gói lệnh (đổi §3c và Việc 1);
- `lib/shortcuts.ts` nhập vào `registry.ts` (đóng L10).
Số đếm nút · số ổ · số component dùng chung thì **đo lại bằng 4 lệnh grep ghi trong §2**, không cần đọc lại tệp này.
