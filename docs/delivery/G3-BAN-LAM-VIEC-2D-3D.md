# G3 · AUDIT BÀN LÀM VIỆC 2D VÀ 3D

> Đo 04/09 trên `55a953fa` (đã ff lên `origin/integration/2026-09-04`). Phạm vi: **chỉ hai bàn
> này**, không ôm năm bàn còn lại.
>
> ⛔ **KHÔNG CHẠY APP LẦN NÀO** — phiếu lượt này chỉ cho ĐỌC mã. Nên cột cuối
> (`SỐNG SÓT SAU TẢI LẠI`) ghi **CƠ CHẾ CÓ** kèm `tệp:dòng` chứ **không** ghi ĐẠT: có cơ chế
> persist trong mã **không** chứng minh vòng *thao tác → ghi → tải lại → vào lại → cùng một sự
> thật* chạy được. **Cấm suy từ mã ra PASS** — đó đúng là luật chủ dự án ra, và đúng chỗ ca
> Vitals đã lọt qua ba tuần với `tsc` xanh và test xanh.
>
> Chữ dùng trong bảng:
> · **CÓ** — đo được, có `tệp:dòng` · **KHÔNG** — grep toàn repo = 0
> · **CƠ CHẾ CÓ** — mã có đường đi, chưa nghiệm thu bằng mắt · **CHƯA ĐO** — cần mở app

---

## A · BÀN 2D (`/projects/[id]/cad` → `CadStageScreen` → `CadSheets` → `CadCanvas` 4.232 dòng)

Chuỗi mount: `app/projects/[id]/cad/page.tsx:14` → `components/studio/CadStageScreen.tsx:51`
(`<CadSheets/>`) → `components/cad/CadCanvas.tsx`. Sổ lệnh: `lib/commands/registry.ts` — **56 lệnh
`cad.*`**, thanh công cụ đọc qua `lib/commands/toolbar-source.ts` (không còn tự khai danh sách).

| Công cụ | CÓ MẶT | CÓ ĐƯỜNG CHẠY | CÓ PHẢN HỒI | CÓ HOÀN TÁC | SỐNG SÓT SAU TẢI LẠI |
|---|---|---|---|---|---|
| canvas | CÓ `CadCanvas.tsx` | CÓ (vẽ tay, không re-render React) | CÓ | — | CƠ CHẾ CÓ `cad3d-autosave-core.ts:130` |
| lia / thu phóng | CÓ | CÓ `CadCanvas.tsx:1233-1240` (wheel non-passive) | CÓ | không (viewport) | CƠ CHẾ CÓ (viewport trong bản ghi `:81`) |
| thu phóng cảm ứng (pinch) | CÓ | CÓ `CadCanvas.tsx:1036` | CÓ | — | CƠ CHẾ CÓ |
| lưới | CÓ | CÓ `CadCanvas.tsx:8` + `gridStep` | CÓ | — | CƠ CHẾ CÓ |
| bắt điểm (snap) | CÓ | CÓ `findSnap` `CadCanvas.tsx:774` · engine `lib/cad/query.ts` | CÓ (vẽ dấu snap) | — | n/a |
| đường dẫn (ortho / khoá trục) | CÓ | CÓ `CadCanvas.tsx:1000` (`shiftKey` + `orthoLock`) | CÓ | — | n/a |
| chọn | CÓ | CÓ `cad.sel.*` registry `:511` | CÓ | CÓ | CƠ CHẾ CÓ |
| chọn nhiều | CÓ | CÓ rubber-band `CadCanvas.tsx:117` + shift-click `:905` | CÓ | CÓ | CƠ CHẾ CÓ |
| vẽ (19 lệnh) | CÓ | CÓ `cad.draw.*` — line·polyline·rect·circle·arc·text·polygon·ellipse·donut·spline·xline·zone·arrow | CÓ | CÓ (snapshot ≤50 `lib/cad/store.ts:5`) | CƠ CHẾ CÓ |
| tường / phòng / cửa / cửa sổ | CÓ | CÓ `cad.draw.wall·room·door·window` | CÓ | CÓ | CƠ CHẾ CÓ |
| hatch | CÓ | CÓ `cad.hatch.apply` + `cad.hatch.angle` | CÓ | CÓ | CƠ CHẾ CÓ |
| ghi kích thước | CÓ | CÓ **9 lệnh** `cad.dim.*` (linear·measure·radius·diameter·angular·continue·baseline + cỡ chữ/mũi tên/tỉ lệ) | CÓ | CÓ | CƠ CHẾ CÓ |
| chú giải (text) | CÓ | CÓ `cad.draw.text` | CÓ | CÓ | CƠ CHẾ CÓ |
| di chuyển · xoay · tỉ lệ | CÓ | CÓ `cad.edit.move·rotate·scale` | CÓ | CÓ | CƠ CHẾ CÓ |
| nhân bản (copy · array) | CÓ | CÓ `cad.edit.copy·arrayrect·arraypolar` | CÓ | CÓ | CƠ CHẾ CÓ |
| sửa hình (10 lệnh) | CÓ | CÓ `mirror·offset·trim·extend·fillet·chamfer·stretch·break·join·explode·lengthen·divide` | CÓ | CÓ | CƠ CHẾ CÓ |
| **canh hàng (align)** | **KHÔNG** | **KHÔNG** — `grep -i align lib/commands/registry.ts` = **0** | — | — | — |
| **nhóm (group) cấp entity** | **KHÔNG** | **KHÔNG** — chỉ có `block` (`lib/cad/model.ts:76`) và `selectInsertGroup` (`store.ts:341`, chọn theo block INSERT chứ không phải nhóm người dùng tự tạo) | — | — | — |
| khoá / ẩn | CÓ **ở cấp LỚP** | CÓ `lib/cad/model.ts:59-60` (`visible`·`locked` thuộc Layer) | CÓ | CÓ | CƠ CHẾ CÓ |
| lớp | CÓ `LayerPanel` (`CadStageScreen.tsx:36`) | CÓ | CÓ | CÓ | CƠ CHẾ CÓ |
| bảng thuộc tính | CÓ `CadInspectorPages` (`CadStageScreen.tsx:37`) | CÓ | CÓ | CÓ | CƠ CHẾ CÓ |
| đặt tài sản (block) | CÓ | CÓ `lib/cad/block-library.ts` + 54 block `public/cad-library/*.dxf` | CÓ | CÓ | CƠ CHẾ CÓ |
| khổ giấy | CÓ | CÓ `lib/cad/paper-space.ts` (+ test) | CHƯA ĐO | CHƯA ĐO | CƠ CHẾ CÓ `lib/cad/sheet-migrate.ts` |
| tỉ lệ bản vẽ | CÓ | CÓ `cad.dim.scale` + `lib/cad/snap-print-scale.test.ts` | CHƯA ĐO | CÓ | CƠ CHẾ CÓ |
| khung tên | CÓ | CÓ `titleBlockPro()` (đọc Brand Kit dự án) | CHƯA ĐO | — | CƠ CHẾ CÓ |
| chuột phải | CÓ | CÓ `onContextMenu` `components/cad/CadCanvas.tsx` | CÓ | — | n/a |
| bàn phím | CÓ | CÓ — gõ lệnh kiểu AutoCAD (`aliases`) + `F`/`F9`/`Esc`/`Delete`/`mod+Z`/`mod+shift+Z` | CÓ | CÓ | n/a |
| hoàn tác / làm lại | CÓ | CÓ `lib/cad/store.ts:530,537` — snapshot ≤50, mọi mutation cấu trúc đều snapshot | CÓ | — | CƠ CHẾ CÓ |
| lưu và vào lại | — | CÓ IndexedDB `lib/sheets-persist.ts:58-61`, khoá `userId + '/cad-editor' + bucketId` | CHƯA ĐO | — | **CƠ CHẾ CÓ — CHƯA NGHIỆM THU** |

**Đọc bảng 2D:** bàn này **dày và có xương sống thật** — 56 lệnh một sổ, undo có snapshot, persist
IndexedDB có phân vùng theo người dùng và theo dự án. Hai lỗ trống là **align** và **group cấp
entity** — cả hai `grep` = 0, không phải "chưa đo".

---

## B · BÀN 3D (`/projects/[id]/render` → `HomeScreen` → `Render3DModeSkeleton` → `Viewport3D` → `Scene3DViewer`)

`components/three/Viewport3D.tsx` (417 dòng) là **ổ canvas**, nạp động
`components/three/Scene3DViewer.tsx` (1.054 dòng) — nơi có WebGL thật:
`WebGLRenderer` `:271` · `OrbitControls` `:364` · `Raycaster` `:635`.

⛔ Không chấm ĐẠT chỉ vì WebGL mở được. Cột `CÓ ĐƯỜNG CHẠY` dưới đây chỉ ghi CÓ khi có **thao
tác không gian trực tiếp** (kéo trên khung nhìn), không tính nút bấm ở panel bên.

| Công cụ | CÓ MẶT | CÓ ĐƯỜNG CHẠY (thao tác trực tiếp) | CÓ PHẢN HỒI | CÓ HOÀN TÁC | SỐNG SÓT SAU TẢI LẠI |
|---|---|---|---|---|---|
| viewport | CÓ `Viewport3D.tsx` | CÓ — WebGL thật `Scene3DViewer.tsx:271` | CÓ | — | CƠ CHẾ CÓ |
| quay quanh (orbit) | CÓ | CÓ `Scene3DViewer.tsx:364` OrbitControls | CÓ | — | CHƯA ĐO |
| lia / thu phóng | CÓ | CÓ (OrbitControls) | CÓ | — | CHƯA ĐO |
| lấy nét (frame / fit) | CÓ | CÓ `frameBox()` `:88` · `fitCameraToScene()` `:104` | CÓ | — | n/a |
| chọn | CÓ | CÓ raycast `:635` → `viewportSelectedId` | CÓ | — | CHƯA ĐO |
| trỏ vào (hover) | CHƯA ĐO | CHƯA ĐO | CHƯA ĐO | — | n/a |
| khung bao (bounding box) | CÓ | CÓ `THREE.Box3` `:88` | CÓ | — | n/a |
| **di chuyển** | CÓ | 🔴 **CHỈ NHÍCH CỨNG** — `Viewport3D.tsx:308` gọi `onNudge(axis, 100)`, tức **100 mm mỗi lần bấm**; xử ở `Render3DModeSkeleton.tsx:415` (`handleNudge`). **Không kéo được.** | CÓ | CÓ (`store.updateEntities` `:429`) | CƠ CHẾ CÓ |
| **xoay** | **KHÔNG ở viewport** | 🔴 **KHÔNG** — `grep TransformControls` toàn repo = **0** | — | — | — |
| **tỉ lệ** | **KHÔNG ở viewport** | 🔴 **KHÔNG** — cùng lý do trên | — | — | — |
| **gizmo** | CÓ *hình* | 🔴 **KHÔNG PHẢI GIZMO** — `Viewport3D.tsx:308` là ba nút SVG `role="button"` `onPointerDown` nhích trục, không có trục kéo, không có vòng xoay, không có tay tỉ lệ | CÓ | CÓ | n/a |
| push-pull | CÓ | ✅ CÓ — kéo mặt tường đổi cao độ, `Scene3DViewer.tsx:630-640` (`dragPlane`/`dragging`) | CÓ | CÓ | CƠ CHẾ CÓ |
| cử chỉ tạo trực tiếp | CÓ | ✅ CÓ — con trỏ → mặt sàn y=0 → hai điểm CAD, `Scene3DViewer.tsx:648-660` + `lib/three/tao-khoi-3d.ts` | CÓ (`xemTruoc` line) | CÓ | CƠ CHẾ CÓ |
| cây đối tượng | CÓ `Object3DTree.tsx` | CÓ | CÓ | CHƯA ĐO | CHƯA ĐO |
| bảng thuộc tính | CÓ `Object3DInspector.tsx` | CÓ | CÓ | CHƯA ĐO | CHƯA ĐO |
| vật liệu | CÓ | CÓ `lib/materials/*` + quả cầu xem trước | CHƯA ĐO | CHƯA ĐO | CƠ CHẾ CÓ |
| đặt tài sản | CÓ | CHƯA ĐO | CHƯA ĐO | CHƯA ĐO | CHƯA ĐO |
| máy ảnh | CÓ `CameraExportTab.tsx` | CÓ `Scene3DCameraApi` | CÓ | CHƯA ĐO | CHƯA ĐO |
| chiếu sáng | CÓ `LightTab.tsx` | ✅ CÓ — kéo đèn trong khung nhìn `Scene3DViewer.tsx:640` (`draggingLight`) + `onLightMove` | CÓ | CHƯA ĐO | CƠ CHẾ CÓ (`Doc.lighting`) |
| ẩn / cô lập | CHƯA ĐO | CHƯA ĐO | CHƯA ĐO | — | CHƯA ĐO |
| cửa vào render | CÓ `KetXuatPanel.tsx` · `RenderQueuePanel.tsx` | CÓ | CÓ | — | CƠ CHẾ CÓ |
| liên tục 2D↔3D | CÓ | ✅ CÓ — mọi thao tác 3D ghi thẳng vào **cùng `useCadStore`** (`Render3DModeSkeleton.tsx:416`), đúng luật X1 *dựng ở đâu cũng ghi vào MỘT Doc* | CÓ | CÓ | CƠ CHẾ CÓ |
| hoàn tác | CÓ | CÓ — dùng chung snapshot của `lib/cad/store.ts` | CÓ | — | CƠ CHẾ CÓ |
| lưu trữ | — | CÓ — `Render3DModeSkeleton.tsx` dùng `cad3d-autosave` (cùng đường 2D) | CHƯA ĐO | — | **CƠ CHẾ CÓ — CHƯA NGHIỆM THU** |
| phím tắt 3D | CÓ | CÓ `TOOL3D_HOTKEYS` (`lib/render-studio/tool3d.ts:42-43`) nghe ở `Tool3DBar.tsx` — **không câm** | CÓ | — | n/a |

**Đọc bảng 3D:** trái với dự đoán thường gặp, 3D **có** thao tác không gian trực tiếp thật ở ba
chỗ — push-pull, dựng khối bằng cử chỉ, kéo đèn — và **ghi thẳng vào cùng một `Doc` với 2D**, đúng
luật một-nguồn. Chỗ hỏng nằm ở **transform**: không có `TransformControls` nào trong repo, nên di
chuyển là nhích 100 mm mỗi lần bấm, còn xoay và tỉ lệ **không tồn tại ở khung nhìn**.

---

## C · NĂM CÔNG CỤ HỎNG NẶNG NHẤT
Xếp theo *đau cho người dùng × rẻ để sửa*. Lượt này **không vá** — mã sản phẩm thuộc lane khác.

| # | Công cụ | Hỏng ở đâu |
|---|---|---|
| **1** | **Xoay và tỉ lệ trong 3D** | Không tồn tại ở khung nhìn: `grep TransformControls` toàn repo = **0**. Người dùng dựng được khối nhưng **không xoay được nó**, trong khi 2D có đủ `rotate`/`scale`. Đây là lỗ to nhất vì nó chặn việc bày đồ nội thất — đúng phần IF nhận là điểm nhấn. |
| **2** | **Di chuyển trong 3D** | Có đường chạy nhưng **nhích cứng 100 mm mỗi lần bấm** (`Viewport3D.tsx:308` → `Render3DModeSkeleton.tsx:415`). Muốn dời 250 mm thì không có cách nào; muốn dời 3 m phải bấm 30 lần. Sửa rẻ: chung đường với #1. |
| **3** | **Hai bản `LoginScreen` cùng tồn tại** | `components/LoginScreen.tsx` (12.104 byte) **mồ côi**, còn `app/login/page.tsx:13` dùng `components/entry/LoginScreen.tsx` (8.874 byte). Hai bản đã phân kỳ. Sửa màn đăng nhập ở bản sai là mất công mà không ai thấy đổi — đúng khuôn ca Vitals. Kéo theo cả cụm chết: `StageSelect.tsx` · `entry/StackedCards.tsx` · `entry/cardFaces.tsx`. |
| **4** | **`lib/vitals-ui.ts` còn dây tới mặt đã rơi** | `soi:cong-cu-chet` H4 báo: **2 nơi SỐNG bấm công tắc**, mà `components/studio/StageSwitcher.tsx` (mặt cũ) **vẫn import kho và vẫn mồ côi**. Repo cố ý giữ tệp này, nên đây là *tàn dư đã biết* chứ không phải hồi quy — nhưng nó là đúng hình dạng đã lừa được cả `tsc` lẫn test ba tuần, và giữ nguyên thì lần sau không phân biệt được tàn dư với hồi quy. |
| **5** | **2D thiếu canh hàng (align)** | `grep -i align lib/commands/registry.ts` = **0**, giữa 56 lệnh có cả `fillet`/`chamfer`/`divide`. Canh hàng là thao tác dàn trang cơ bản nhất khi bày mặt bằng; thiếu nó thì phải canh bằng mắt hoặc gõ toạ độ tay. Rẻ: đã có `translateEntity` + bounding box + undo snapshot, chỉ thiếu lệnh. |

**Ứng viên đã cân nhắc rồi loại khỏi top 5:** *group cấp entity* (thiếu thật, nhưng `block`
INSERT che được phần lớn nhu cầu) · *ẩn/cô lập trong 3D* (CHƯA ĐO — chưa đủ căn cứ để xếp hạng,
xếp vào đây sẽ là đoán).

---

## D · CHƯA CHẮC / CHƯA KIỂM
1. **Không mở app lần nào.** Mọi ô `CƠ CHẾ CÓ` là *đọc mã*, không phải *nghiệm thu*. Vòng
   `thao tác → ghi → tải lại → vào lại → cùng một sự thật` **chưa chạy một lần nào** cho cả hai bàn.
2. Cột `CÓ PHẢN HỒI` là chỗ yếu nhất của bảng: đọc mã chỉ thấy *có vẽ gì đó*, không thấy được
   phản hồi có kịp và có đọc được không.
3. `ẩn/cô lập 3D`, `trỏ vào (hover) 3D`, `đặt tài sản 3D` — để **CHƯA ĐO**, không suy.
4. Bàn 2D có **56 lệnh**; bảng gộp chúng theo nhóm để đọc được. Gộp là **chọn**, không phải đo —
   ai cần chi tiết từng lệnh phải mở `lib/commands/registry.ts`.
5. Chuỗi mount 3D đi qua `HomeScreen` (`app/projects/[id]/render/page.tsx:18`) — **không đọc hết**
   `HomeScreen`, nên có thể còn nhánh điều kiện quyết định 3D hiện hay không mà bảng này không thấy.
