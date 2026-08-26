# LANE WORKSPACE — 23/08. ĐO · CHỈ LỆCH · NỐI TỐI THIỂU

Phiếu: đo + nối tối thiểu vùng vỏ app, **không tái cấu trúc**.
Đặc tả nguồn: `docs/design-campaign/dna/WORKSPACE-SPEC-2026-08-23.md`.

## ⓪b HẠ TẦNG
`git log -1` = `c7f3ac8` · `git rev-list --count HEAD..main` = **0** · nhánh `main`. Đúng mốc, chạy tiếp.

---

# BƯỚC 1 · ĐO (phần chính của phiếu)

## 1. Vỏ chặng hôm nay do ai dựng — và mỗi chặng đổi những gì

**MỘT chủ sở hữu duy nhất: `components/studio/AppShell.tsx`** — không còn cảnh mỗi chặng một vỏ.
Nó khai **sáu ổ cố định** (`AppShell.tsx:15-31`): ⓪ rail · ① header 42px · ② Navigator 214px ·
③ Stage · ④ Inspector 236px · ⑤ Toolbelt · ⑥ Status 26px. Docstring `:32-33` tự khai luật:
*"Vị trí/kích thước 6 ổ KHÔNG đổi khi đổi mode trong cùng chặng — chỉ ruột đổi."*

Ai bọc `AppShell`:

| Màn | Nơi gọi | `active` |
|---|---|---|
| 2D | `components/studio/CadStageScreen.tsx:130` | `cad` |
| 3D | `components/home/HomeScreen.tsx` (route `/projects/[id]/render` mount `HomeScreen`) | `render` |
| Trình chiếu | `components/present-editor/PresentStageScreen.tsx:91` | `present` |
| Home · Tổng quan · Dự án | `HomeScreen.tsx:528` · `app/projects/[id]/overview/page.tsx:103` · `app/projects/page.tsx:47` | `home` |
| Cài đặt · Vật liệu · Bảng việc | `app/settings/page.tsx:28` · `app/materials/page.tsx:19` · `app/tasks/page.tsx` | — |

**Đổi chặng thì đổi gì:** chỉ **ruột** của ổ ② ③ ④ ⑤ ⑥, cộng vài gate trong `AppShell`:
`libStage` (`:105`) · `navigatorWidth = 280` riêng render (`:109`) · phím ⇧B/⇧I riêng CAD (`:139`) ·
`ReviewPanel` chỉ 3 chặng thiết kế (`:214`) · ổ ② tắt hẳn ở `home` (`:176`).
⇒ **Vỏ ĐÃ đứng yên. Câu "3 chặng như 3 app" hôm nay KHÔNG còn đúng ở tầng vỏ** —
`SPEC-MODE-PER-STAGE §1` (*"mode mỗi chặng = đổi CẢ shell"*) đã bị chính code vượt qua từ 03/08.

Trục điều hướng: `StageSwitcher.tsx` **đã gỡ khỏi header 17/08** (`AppChrome.tsx:355-360`), giữ tệp
để có đường quay đầu. Phím ⌘1/⌘2/⌘3 vẫn sống.
⚠️ Nợ: `StageSwitcher.tsx` docstring còn tự khai *"TRỤC ĐIỀU HƯỚNG DUY NHẤT của app"* — chữ đã chết
mà chưa đóng dấu (đúng loại bẫy luật 15/08 nói tới). Không sửa lượt này: ngoài phạm vi, và nó thuộc
cùng lượt với việc rail hai cụm.

## 2. `FlowCanvas` ↔ `Viewport3D` — quan hệ thật

**Đặc tả V-đo của phiếu đúng một nửa. Sự thật nặng hơn: KHÔNG PHẢI HAI CANVAS — LÀ BỐN.**

| Chặng/mode | Canvas thật | Công nghệ |
|---|---|---|
| 2D (`sketch`/`pro`) | `components/cad/CadCanvas.tsx` | `<canvas>` 2D tự viết |
| 3D · mode `render` | `components/FlowCanvas.tsx` | `@xyflow/react` |
| 3D · mode `model3d` | `components/three/Viewport3D.tsx` | three.js/WebGL |
| Trình chiếu | `components/present-editor/EditorCanvas.tsx` | DOM |

Chỉ **hai cái giữa** mới là "hai anh em gạt qua lại", và **không còn gạt bằng `if/else`**: chúng là
hai mục khai qua `defineMode()` trong `HomeScreen.tsx:121` (`3d/node`) và `:129` (`3d/3d`), tra qua
`lib/shell/mode-registry.ts`, đổi ruột bằng `ModeShell` (crossfade, `hideBuiltInSwitcher`).
`ModeSwitchCell.tsx` chỉ là **cái công tắc**, lật `useStageMode('render')` giữa `'render'|'model3d'`
(`lib/stage-mode.ts:22`, khoá localStorage `interiorflow.stagemode.render`).
2D cũng đã lên registry: `CadStageScreen.tsx:53,61` khai `2d/sketch` · `2d/pro`.

⇒ Cơ chế **khai mode** thì đã chuẩn hoá và dùng chung. Cái **chưa chung là bản thân mặt canvas**.

## 3. Thanh trên mấy hàng · thanh đáy · Vitals ở đâu

**Thanh trên: ĐÚNG MỘT HÀNG rồi.** `AppChrome.tsx:255` —
`flex items-center gap-2 ... h-[42px]`, một dòng flex phẳng. Bố cục hiện tại:
trái = dải ngữ cảnh (dự án · chặng, `data-if-cum-trai-tren`) · rồi ô tìm (**chỉ Home**) ·
giữa = ổ Vitals (absolute) · phải = `CumPhaiTren` (thông báo · hiện diện · avatar).
⇒ Vế *"MỘT HÀNG"* **đạt**. Vế *"search ở GIỮA"* **chưa**: ô tìm đứng lệch phải và chỉ có ở Home;
chỗ giữa đang do Vitals chiếm.

**Thanh đáy: có Ổ, chưa "luôn hiện".** Ổ ⑤ tồn tại trong `AppShell:188-195` (dock kính nổi
giữa-dưới Stage). Ai truyền vào:

| Chặng | Có thanh đáy? | Bằng chứng |
|---|---|---|
| 2D | ✅ | `CadStageScreen.tsx:144` → `CadToolbelt` → `StageToolbelt stage="cad"` (`CadToolbelt.tsx:45`) |
| 3D mode `model3d` | ⚠️ có nhưng **ở TRÊN** | `Render3DModeSkeleton.tsx:616` đặt `top: 12, left: 50%` — không dùng ổ ⑤ |
| 3D mode `render` (node) | ❌ | `HomeScreen.tsx:521` khai rõ "không truyền toolbelt" |
| Trình chiếu | ❌ | `PresentStageScreen.tsx:91-104` không có prop `toolbelt` |
| Home | ❌ | như trên |

**Vitals: `components/studio/VitalsAperture.tsx`, con TRỰC TIẾP của `<header>`**
(`AppChrome.tsx:378`), `position:absolute`, `top:-3`, `bottom:0`, rộng cố định **112px**, neo theo
**tâm vùng làm việc** — đọc hộp `[data-if-vung-lam-viec]` (`AppShell.tsx:171`) qua
`components/ui/useVungLamViec.ts` → `lib/ui/vung-lam-viec.ts` `viTriO()`.

🔴 **PHIẾU DẪN SAI MỘT DÒNG, đính chính ngay:** phiếu (và spec §V2) ghi
*"`VitalsAperture.tsx:196` tự khai «Vitals bám vào cụm phải-trên»"*.
Đọc nguyên câu tại chỗ: *"**Trước đây** hàm này lấy `getBoundingClientRect` của nút rồi tính
`top`/`right` — tức Vitals bám vào cụm phải-trên… **Nay** ổ là một chỗ DÀNH RIÊNG trong header."*
⇒ Đó là **ghi chú lịch sử của một lỗi ĐÃ SỬA 20/08**, không phải hiện trạng. Trích nửa câu rồi
kết luận "neo sai chỗ" là đọc ngược. Hệ quả thật: khoảng cách còn lại **nhỏ hơn nhiều** so với
spec ước — xem BƯỚC 2 dòng V2.

## 4. Chuột phải — master tool

`components/print/RadialToolMenu.tsx` (port từ `docs/mocks/BangTron.dc.html`) **còn sống**, mount ở
đúng **hai** nơi: `CadCanvas.tsx:3628` và `ExportPdfDialog.tsx:308`. Lõi thuần tách sẵn ở
`lib/print/radial.ts` (có test).

🔴 **NHƯNG CHUỘT PHẢI KHÔNG GỌI ĐƯỢC NÓ.** Đo trước khi sửa:
- `CadCanvas.tsx:3614` (bản gốc) = `onContextMenu={(e) => e.preventDefault()}` — **chặn, rồi thôi**.
- Lối vào DUY NHẤT của radial là **nhấn giữ bằng ngón/bút** (`CadCanvas.tsx:793-805`,
  `RADIAL_HOLD_MS`), **và chỉ ở `cadMode === 'sketch'`, `tool === 'select'`**.
⇒ Người dùng **chuột** — tức gần như toàn bộ desktop — **chưa bao giờ chạm tới master tool**.
Đây là ca *"có trong mã ≠ tới được người dùng"*, đúng họ lỗi 16/08.

Các canvas khác: `FlowCanvas` **0** `onContextMenu`. `Viewport3D` **0**.
`EditorCanvas.tsx:384` có nhưng chỉ để **đóng** menu; `:452` mở menu ngữ cảnh riêng của Present
(không phải `RadialToolMenu`) — tức Trình chiếu đã có một lớp chuột-phải **thứ hai, khác hình hài**.

## 5. Collab hôm nay có tồn tại như một chế độ không? Present đang là gì?

**Collab: CÓ CODE, KHÔNG CÓ CHỖ ĐỨNG.**
`components/collab/` đã dựng thật: `CuaSoThaoLuan.tsx` (Cửa sổ Thảo luận) · `BaHoiStorylineForm.tsx`
· `BangSoCucForm.tsx` (đúng "template hệ khung tư duy" chốt 13/08) · `PresenceBar` · `LiveCursors` ·
`feature-flags.ts` (`CHUNG_CAT_SAN_SANG = true`, engine chưng cất đã nối) · `tao-nguon-chung-cat.ts`
kèm test.
🔴 `grep -rn "CuaSoThaoLuan" components app` = **0 nơi mount**. Cửa sổ Thảo luận **mồ côi**.
⇒ Collab hôm nay **không phải một chế độ**, cũng không phải một màn. Nó là một hộp linh kiện đã
lắp xong nằm chờ trên kệ.

**Present: là một CHẶNG đầy đủ, nặng nhất trong ba.** `Phase = 'concept'|'render'|'present'`
(`lib/phases.ts:7`), có route riêng (`/projects/[id]/present`, `/present-editor`), vỏ riêng
(`PresentStageScreen`), 30 component trong `components/present-editor/`, ba mode nội bộ
(`deck`/`boq`/`schedule`), canvas riêng, menu chuột-phải riêng.
⇒ Không có cách nào "hạ" Present mà không đụng dữ liệu: `'present'` là **khoá đã ghi ra đĩa**
(localStorage, route, DB).

---

# BƯỚC 2 · BẢNG LỆCH

| # | Đặc tả nói | Hôm nay là | Bằng chứng | Khoảng cách | Additive hay phải phá |
|---|---|---|---|---|---|
| 1 | Ba entry chế độ **Collab · 2D · 3D** | Ba chặng **2D · 3D · Present**; Collab 0 mount; Present là chặng đầy đủ | `lib/phases.ts:7` · `grep CuaSoThaoLuan`=0 · `PresentStageScreen.tsx` | **Lớn** | 🔴 **PHẢI PHÁ** nếu đổi `Phase`. Xem §"buộc phải phá" mục A |
| 2 | Ba lối vào **CÙNG MỘT canvas** | **Bốn** canvas khác công nghệ | CadCanvas · FlowCanvas · Viewport3D · EditorCanvas | **Rất lớn** | 🔴 **PHẢI PHÁ**. Mục B |
| 3 | Master tool gọi bằng **chuột phải**, dùng chung mọi chế độ | Chuột phải bị `preventDefault` ở 2D; radial chỉ mở bằng nhấn-giữ ngón/bút ở mode Sơ phác; 3D/Node **0** | `CadCanvas.tsx:3614` (cũ) · `:793` · grep=0 | **Vừa** | 🟢 **Additive** — ĐÃ LÀM cho 2D (BƯỚC 3·D). 3D/Node còn nợ |
| 4 | Master tool **bao quanh vùng làm việc, KHÔNG cố định** | `RadialToolMenu` nổi tại điểm bấm ⇒ đã đúng tinh thần | `CadCanvas.tsx:3629` `x`/`y` từ con trỏ | **Nhỏ** | 🟢 Đạt |
| 5 | Bottom rail **LUÔN HIỆN** | 2D có · 3D-3D có nhưng **đặt ở TRÊN** · 3D-Node, Present, Home **không có** | bảng §3 | **Vừa** | 🟡 Additive nhưng **ngoài vùng ghi** (present-editor, home, render-studio). Mục C |
| 6 | Top bar **MỘT HÀNG** | Một hàng, `h-[42px]` | `AppChrome.tsx:255` | **0** | ✅ Đã đạt |
| 7 | Search ở **GIỮA** | Lệch phải, **chỉ Home**; giữa đang là Vitals | `AppChrome.tsx:362-364` · `:378` | **Vừa** | 🟡 Đụng nhau với #8 — quyết định sản phẩm, xem mục D |
| 8 | Phải: **now surface + avatar** | `CumPhaiTren` = thông báo · hiện diện · avatar | `AppChrome.tsx:385` | **Nhỏ** | 🟢 Gần đạt; "now surface" chưa có định nghĩa đo được |
| 9 | Vitals trên **ĐƯỜNG RANH nav↔canvas** | Đã ở đúng đường đó (mép dưới ổ = mép dưới header), neo theo tâm canvas | `VitalsAperture.tsx` ô `top:-3/bottom:0` · `viTriO()` | **Nhỏ hơn spec tưởng** | 🟢 Đạt sẵn |
| 10 | **Hover ở BẤT KỲ ĐIỂM NÀO** trên đường đó | Chỉ trúng ô **112px** mới mở | `O_RONG = 112` | **Vừa** | 🟢 **Additive** — ĐÃ LÀM (BƯỚC 3·A) |
| 11 | Vitals **giãn dần theo nhu cầu**, **luôn giữ neo với canvas** | Ba mức ambient→peek→engage, tấm neo `top = mép dưới ổ`, khe = 0 | `viTriTamXo()` · `kieuMoc()` | **0** | ✅ Đã đạt |

---

# BƯỚC 3 · ĐÃ LÀM (chỉ phần additive)

## A · Vitals nhận hover trên CẢ ĐƯỜNG RANH — `components/studio/VitalsAperture.tsx` (trong vùng)

Ô 112px **giữ nguyên** (nó là chỗ nhìn thấy được và là tâm để Peek mọc ra). Thêm:
- Ba hằng số có tên: `RANH_TREN_PX = 5` · `RANH_DUOI_PX = 4` · `RANH_LE_PX = 8`.
- Một `useEffect` nghe `pointermove` (passive), mở đúng **cùng một tấm Peek**, từ **cùng một tâm**.
- Một vệt sáng `data-if-ranh-vitals` cho thấy đoạn đường đang nhạy.

Bốn ràng buộc cố ý, ghi thành chữ trong mã:
1. **KHÔNG dựng `<div>` phủ lên đường ranh.** Một dải DOM ở đó sẽ **nuốt cú bấm** của thứ nằm dưới
   — mép dưới dải ngữ cảnh, và vài pixel đầu của canvas (ở 2D đó là vùng vẽ thật; nuốt một cú đặt
   điểm là hỏng nét). Nên cơ chế này **không có thân**: nó là phép đo, không phải vật chắn.
   Vệt sáng có `pointerEvents:'none'`.
2. **Chỉ chuột.** Bút/ngón vẫn đi đường nhấn-giữ trên ô — không giẫm cử chỉ vẽ.
3. **Giữ TRỄ cũ** `TRE_RE_VAO_MS` ("kiểu tai thỏ MacBook", chốt 16/08): đi ngang qua không kích hoạt.
4. **Rời dải để đi vào ô hoặc vào tấm thì không tính là rời Vitals** — kiểm bằng hộp thật của
   `oRef`/`tamRef` trước khi hẹn thu. Thiếu guard này thì tấm tự đóng ngay khi con trỏ với xuống nó.
   `prefers-reduced-motion` ⇒ vệt sáng hiện/tắt thẳng, không nội suy.

## B · Chuột phải gọi master tool ở 2D — `components/cad/CadCanvas.tsx`

`onContextMenu` thôi chỉ chặn; nay mở `RadialToolMenu` tại con trỏ.
**Nối dây cho thứ đã có, không dựng cái thứ hai**: cùng `setCadRadial`, cùng hai bộ lệnh
(`SELECTED_RADIAL_TOOLS` / `EMPTY_RADIAL_TOOLS`), cùng `runCadRadialAction`. Không gate theo
`cadMode` — đặc tả nói master tool dùng chung mọi chế độ, và ở mọi mode phím này đang trống.

⚠️ **Khai thẳng: đây là sửa NGOÀI vùng ghi** (`components/cad/**`, không phải `components/studio/**`).
Tôi làm vì BƯỚC 3 của chính phiếu đặt tên nó — *"bảo đảm chuột phải gọi được master tool ở nơi đã
có sẵn"* — và "nơi đã có sẵn" chỉ có một địa chỉ. Thay đổi là **3 dòng logic**, thuần thêm.

## Không làm (cố ý)
Gộp `FlowCanvas`↔`Viewport3D` · số phận Present · tạo chế độ Collab — ba thứ phiếu cấm, trả về MAIN
kèm phương án ở mục dưới. Thanh đáy cho Present/3D-Node: **ngoài vùng ghi**, chỉ nêu.

---

# DANH SÁCH VIỆC BUỘC PHẢI PHÁ — kèm phương án và CÁI GIÁ

## A · "Ba chế độ Collab · 2D · 3D" ⇒ Present đi đâu

Cái giá của việc đổi thẳng `Phase`: `'present'` là **khoá đã ghi ra đĩa** — localStorage, route
`/projects/[id]/present`, DB. Luật cũ: **đổi NHÃN được, đổi KHOÁ thì không**.

Ba đường, cái giá đo được:

| | Cách | Phải đụng | Giá |
|---|---|---|---|
| **A1** | Present **vẫn là chặng thứ tư**; "ba chế độ" chỉ nói về vùng *dựng* | Gần như 0 code | Rẻ nhất. Nhưng rail cụm 2 thành **4 mục + `+`**, và câu "ba chế độ" thôi mô tả đúng app |
| **A2** | Present thành **một chế độ trong Collab** | Gộp `PresentStageScreen` vào vỏ Collab chưa tồn tại | Đắt nhất, và **trái chốt 13/08** (*"chặng 3 CHỈ trình chiếu; mọi SẢN XUẤT về chặng 2"* — Present là nơi *đóng gói*, không phải nơi *làm chung*) |
| **A3** | Present **hạ khỏi hàng chế độ**, thành đầu ra / master tool | Đổi rail; giữ nguyên route + khoá `'present'` | Vừa. **Khớp nhất với chốt 13/08.** Nhưng 30 component present-editor vẫn là một chặng về mặt code — "hạ" chỉ là hạ ở tầng ĐIỀU HƯỚNG |

**Khuyến nghị của lane: A3, và thi hành bằng cách chỉ đổi NHÃN + chỗ đứng trên rail, tuyệt đối
không đụng `Phase`.** Lý do: nó là cách duy nhất vừa khớp chốt 13/08 vừa không chạm khoá đã ghi đĩa.
⛔ Đây là **quyết định sản phẩm** — lane không tự chọn. **Chưa có câu trả lời thì chưa dựng rail
cụm 2**, dựng trước là phải sửa lại.

## B · "Ba lối vào cùng MỘT canvas" — đây là việc đắt nhất trong toàn bộ đặc tả

Bốn canvas, ba công nghệ khác nhau (`<canvas>` 2D · React Flow · WebGL · DOM). **Không có cách nào
"gộp" chúng thành một mặt vẽ** — đó không phải refactor, đó là viết lại engine.

Cách đọc rẻ và trung thực hơn, và nó KHỚP đúng kiến trúc Hoà đã chốt 15–16/08
(*"cửa sổ công cụ = MÔI TRƯỜNG LÀM VIỆC, kéo thả trong canvas"* · *"canvas là SƠ ĐỒ DÂY CHUYỀN,
cửa sổ là XƯỞNG của một công đoạn"*):

> **MỘT canvas nền (`FlowCanvas`) làm sơ đồ dây chuyền. Ba môi trường kia trở thành RUỘT của
> ba cửa sổ công cụ đứng trên nền đó.**

Nền móng đã có sẵn, không phải dựng từ 0: `components/nodes/CuaSoCongCu.tsx` (cụm khung môi trường +
vệ tinh, 3 biến thể `noi`/`neo`/`toanMan`) · `HopCongCuBamVat.tsx` (`NodeToolbar` thật) ·
`lib/nodes/dinh-nghia-ket-qua.ts` (cổng ra mang định nghĩa) — cả ba xong-máy từ 16/08.

**Cái giá, nói thẳng:** ①`Viewport3D` trong container bị `transform` của React Flow ⇒ **zoom lồng
zoom**, phải cho cửa sổ thoát khỏi phép biến đổi của canvas từ nấc "vừa" trở lên — đã ghi trong chốt
16/08 nhưng **chưa ai code** ②hiệu năng: nền chỉ được vẽ thẻ + dây, môi trường nặng chỉ chạy khi mở
③`SPEC-MODE-PER-STAGE §1` bị lật hẳn — cần đóng dấu lỗi thời tại chỗ, không bỏ hoang.
**MVP rẻ nhất để biết đúng/sai sớm:** một cửa sổ ảnh → dây → một cửa sổ 3D, cùng đứng trên
`FlowCanvas`. Chạy được là chứng minh trọn cả ba điều; không chạy thì biết ở bước rẻ nhất.

## C · Bottom rail "luôn hiện" — rẻ, nhưng nằm ở ba lane khác

Ổ ⑤ đã có sẵn trong `AppShell`; việc còn lại chỉ là **truyền `toolbelt=`** ở ba nơi:
`PresentStageScreen.tsx` (`components/present-editor/**`) · `HomeScreen.tsx`
(`components/home/**` — lane HOME, tôi **bị cấm**) · `Render3DModeSkeleton.tsx`
(`components/render-studio/**`, hiện đặt toolbelt ở **top**, phải dời xuống ổ ⑤).
⇒ Ba lần sửa một dòng, ba chủ sở hữu khác nhau. **MAIN nên gom thành một phiếu**, đừng chia ba.

## D · Search vào giữa — đụng chỗ Vitals đang đứng

Đặc tả yêu cầu cả *"search ở giữa"* (④) lẫn *"Vitals trên đường ranh"* (⑤). Hai điều này **chỉ hoà
được nếu Vitals rời khỏi bề mặt header** và sống hẳn dưới đường ranh — lúc đó chỗ giữa mới trống cho
search. Hiện Vitals **là** thứ chiếm chỗ giữa (ô 112px + `viTriO()` kẹp biên hai bên).
Thêm nữa: search hôm nay **chỉ có ở Home** (`active === 'home'`) — đưa nó vào giữa ở mọi màn là mở
một câu hỏi mới: *trong chặng thì search tìm cái gì?* Chưa ai trả lời.
⇒ **Không đụng lượt này.** Cần Hoà chốt: Vitals ở TRÊN hay DƯỚI đường ranh, và search-trong-chặng
tìm gì.

## E · Collab mồ côi — rẻ hơn tưởng
`CuaSoThaoLuan` + hai form khung tư duy đã dựng xong, engine chưng cất đã nối
(`CHUNG_CAT_SAN_SANG = true`). Thiếu **đúng một thứ: chỗ mount.** Nếu B chọn hướng cửa-sổ-trên-nền
thì Collab là cửa sổ **rẻ nhất để làm trước** — nó là "cửa sổ THẢO LUẬN", không có cổng ra, không
kéo theo bài toán zoom lồng zoom của 3D.

---

# NGHIỆM THU — khai đúng, không tô

## `npx tsc --noEmit` — **KHÔNG EXIT 0, VÀ KHÔNG PHẢI DO LANE NÀY**

Baseline **trước khi tôi gõ dòng nào** đã đỏ **6 lỗi**, toàn bộ ở `components/nav/**`:
```
components/nav/muc-dieu-huong.test.ts(29,3): TS2305 'CUM_CAN_DU_AN' không tồn tại
components/nav/muc-dieu-huong.test.ts(61,52): TS2345 '"du-an"' không hợp CumRail
components/nav/RailDieuHuong.tsx(67,3)   : TS2305 'CUM_CAN_DU_AN'
components/nav/RailDieuHuong.tsx(330,5)  : TS2367 CumRail vs '"du-an"'
components/nav/RailDieuHuong.tsx(513,45) : TS2554 thừa tham số
components/nav/RailDieuHuong.tsx(772,11) : TS2339 'hanhDong'
```
Sau khi tôi sửa: **cùng bộ lỗi nav đó, cộng thêm 1 lỗi mới `app/files/page.tsx(53,10) TS2304:
Cannot find name 'HaiNgan'`** — cũng không phải của tôi (lane FILES đang viết lại `HaiNgan` giữa
chừng; phiếu cấm tôi đụng `components/filemanager/**`).

**Delta của lane này = 0.** Lọc `grep -v "components/nav/"` sau khi lane FILES ổn định thì hai tệp
tôi sửa **sạch tuyệt đối**.
⚠️ Cả hai vùng đỏ nằm trong danh sách ⛔ CẤM của chính phiếu này ⇒ **lane WORKSPACE không thể đưa
tsc về 0 mà không phạm biên.** MAIN cần biết: **cổng `npm test` hiện đang bị chặn cho MỌI lane**,
vì `npm test` = `tsc && … && chạy test`, dừng ngay ở bước tsc.

## `npm test` — không thêm fail nào
Chạy thẳng bộ test (bỏ qua cổng tsc đang bị lane khác chặn):
```
find . -name '*.test.ts' … | xargs -P8 sucrase-node
```
→ **2 fail: `components/nav/muc-dieu-huong.test.ts` · `lib/wallpaper/contrast.test.ts`.**
Cả hai thuộc lane RAIL và lane MÀU/HOME. Không tệp test nào import
`VitalsAperture` hoặc `CadCanvas` (`grep` = 0; ba tệp có nhắc `CadCanvas` trong chú thích —
`lib/input/wheel.test.ts`, `lib/cad/render-layer-index.test.ts`, `lib/cad/sprint9-mode.test.ts` —
**đều PASS**). ⇒ **Lane này thêm 0 fail.**

## 🔴 CHỤP APP THẬT — KHÔNG LÀM ĐƯỢC. Nói thẳng.

1. **`127.0.0.1:3799` (cổng phiếu chỉ định) đã CHẾT.** `lsof` còn thấy LISTEN nhưng tiến trình
   `15699` không tồn tại — mục nghe cũ. `curl` → **exit 7, connection refused**.
2. Tìm được **một server IF đang sống thật ở `127.0.0.1:3778`** (`next-server v14.2.35`, PID 2225)
   và dùng lại nó thay vì mở server mới (đúng luật một-server-một-thư-mục).
3. **Server đó đang hỏng ở tầng tài sản tĩnh.** HTML trả 200, nhưng **mọi chunk JS + CSS trả 500**:
   `/_next/static/chunks/app/page.js` → `500 Internal Server Error`. Hệ quả: app không hydrate, mọi
   màn trắng. `/login` là màn duy nhất còn thấy nội dung — và nó hiện **hoàn toàn không có CSS**
   (ảnh `2026-08-23-lane-workspace-00-login-CHUNK500.png` là bằng chứng rõ nhất: chữ Times, nút thô).
   Đã thử warm-up từng route + chờ 20s/màn + chạy lại lượt hai: **không đổi**.
   Nghi phạm gần nhất: `AppShell` import `RailDieuHuong` đang lỗi biên dịch, cộng `.next` bị nhiều
   lane cùng ghi — đúng bệnh §0aa đã ghi trong sổ. **Không tự chữa**: sửa nghĩa là khởi động lại
   server của lane khác, phiếu cấm.

Bốn ảnh vẫn lưu ở `artifacts/visual-review/`, **đặt tên có gắn cờ `CHUNK500`** để không ai nhầm là
ảnh nghiệm thu:
`2026-08-23-lane-workspace-{00-login,01-home,02-2d-cad,03-present}-CHUNK500.png`.
(Đổi tên vì lượt đầu tôi lỡ ghi ra các tên chung `00-login.png`/`01-home.png`/`02-2d-cad.png`/
`03-present.png` — thư mục này nhiều lane dùng chung, tên chung là chỗ giẫm chân. Nếu lane nào
từng có `00-login.png` cũ ở đó thì **tôi đã đè mất**; xin lỗi và ghi ra đây thay vì im.)

---

# ⑦b CHƯA CHẮC / CHƯA KIỂM

1. **Hai đoạn mã BƯỚC 3 chưa chạy trên app thật một lần nào.** Tất cả kết luận là **đọc mã + đọc
   API**, không phải quan sát. Ba thứ chỉ hành vi thật mới trả lời được:
   - dải nhạy ±5/−4px có **đúng độ dày tay người** không, hay phải rê ba lần mới trúng;
   - guard `oRef`/`tamRef` có thật sự chặn được ca "rời dải xuống tấm rồi tấm tự đóng" không;
   - `pointermove` toàn cửa sổ có tốn khung hình lúc canvas 2D đang vẽ nét không (tôi đã dùng
     `passive` + so sánh `trong === dangTrong` để chỉ `setState` khi **đổi trạng thái**, nhưng
     **chưa đo**).
2. **Chuột phải ở 2D chưa thử giữa một lệnh vẽ đang chạy.** Tôi đọc `CadCanvas.tsx:1068` là nhánh
   Escape của radial và cho rằng vô hại; **chưa xác minh** hành vi khi radial mở lúc lệnh Line/
   Polyline đang chờ điểm thứ hai.
3. **Chưa kiểm `prefers-reduced-motion` thật.** Nhánh có trong mã, chưa kích hoạt lần nào.
4. **Chỉ đọc Chromium.** Safari/Firefox là suy diễn — `pointermove` trên `window` với `passive`
   là API phổ thông, nhưng không phải quan sát.
5. **Baseline tsc là mục tiêu di động.** Hai lượt chạy cách nhau vài phút cho **hai bộ lỗi hơi
   khác nhau** (`RailDieuHuong.tsx:513` xuất hiện ở lượt này, `muc-dieu-huong.ts:340` ở lượt kia) —
   lane RAIL đang gõ live. Con số "6 lỗi" là **ảnh chụp một thời điểm**, không phải hằng số.
6. **"Bốn canvas" là số đếm các mặt vẽ CHÍNH.** Tôi không quét hết mọi `<canvas>`/`<svg>` phụ trong
   repo; có thể còn mặt vẽ nhỏ tôi chưa tính.
7. **Chưa đối chiếu 24 ảnh trong Drive `IF-duyet-mat`** — phiếu không yêu cầu, nhưng nếu Hoà đã note
   lên hình về vỏ app thì những note đó **chưa vào báo cáo này**.
8. **Câu "vỏ đã đứng yên, 3-chặng-như-3-app không còn đúng ở tầng vỏ"** dựa trên đọc `AppShell` +
   danh sách nơi gọi. **Chưa nhìn bằng mắt** ba chặng cạnh nhau để xác nhận cảm giác — mà "cảm giác
   ba app" vốn là một phán xét bằng mắt, không phải bằng grep. Đây là chỗ báo cáo này yếu nhất, và
   nó yếu **đúng vì không chụp được màn hình**.
