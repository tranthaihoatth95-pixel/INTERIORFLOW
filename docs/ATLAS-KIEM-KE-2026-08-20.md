# ATLAS · SỔ KIỂM KÊ TOÀN APP — 20/08/2026

> **Vai của file này:** nguồn sự thật để phiên UX/UI mới vẽ **Atlas NATIVE trong Claude Design**
> mà không phải bịa một dòng nào. Mỗi khung = một dòng: route thật · component thật · nhãn ·
> bằng chứng · thiếu gì.
>
> 🔴 **GATE #4 (Hoà chốt 20/08):** hướng thị giác MỚI/CHƯA CHỐT **bắt buộc native trong Claude
> Design**. Mock HTML qua DesignSync vẫn dùng được làm nguyên mẫu kỹ thuật · thử tương tác ·
> tham chiếu thi công · QA, nhưng **không còn tính là duyệt thị giác**.
> Khung đối chiếu HTML kèm theo: `docs/mocks/mock-exs-atlas-toan-app.html` — đã đóng dấu
> *"THAM CHIẾU KỸ THUẬT, không phải bản duyệt"* ngay dòng đầu.
>
> **Kỷ luật nhãn:** nhãn phải **tra được**. Không tra ra ⇒ ghi thẳng `NEEDS-HOÀ` hoặc
> `IN-PROGRESS` kèm lý do. **Màn legacy/xấu PHẢI có mặt** — giấu là làm hỏng công dụng duy nhất
> của sổ này.
>
> **Nguồn tra:** `docs/bao-cao-phien/2026-08-20-*.md` (19 báo cáo lane, đều tự khai
> LIVE/PARTIAL/BLOCKED/DEFER) · `ls components/**` · `find app -name page.tsx` · grep 20/08 ·
> `docs/BAN-GIAO-UXUI-EXS-2026-08-20.md`.

## Nghĩa của nhãn (dùng thống nhất, không co giãn)

| Nhãn | Nghĩa chính xác |
|---|---|
| `APPROVED` | Hoà đã pass mắt **và** code sống trên app thật |
| `READY-TO-CODE` | Luật/bản vẽ đã chốt, **code 0 dòng** |
| `IN-PROGRESS` | Có code sống nhưng lane tự khai PARTIAL, hoặc mặt chưa qua pass thị giác |
| `LEGACY` | Đang chạy trong app nhưng đã bị chốt sau đè lên — nợ phải gỡ |
| `REJECTED` | Hoà đã bác, cấm hồi sinh |
| `NEEDS-HOÀ` | Chặn ở cửa người, hoặc **không tra được sự thật** |

## Phân bố (41 khung)

| Nhãn | Số khung |
|---|---|
| APPROVED | 10 |
| READY-TO-CODE | 5 |
| IN-PROGRESS | 15 |
| LEGACY | 3 |
| REJECTED | 2 |
| NEEDS-HOÀ | 6 |

---

## 01 · VÀO / LÀM VIỆC (5)

| # | Khung | Route thật | Component thật | Nhãn | Bằng chứng | Thiếu gì |
|---|---|---|---|---|---|---|
| 01·A | Home · Ngày-Số-Không | `/` | `components/home/BatDauNgaySoKhong.tsx` | APPROVED | `LANE-A-home-dayzero.md`: VIỆC 1 = **LIVE**; board C pass mắt sáng 20/08 | — |
| 01·B | Home · Đang hoạt động (bento) | `/` | `components/home/DongStudioHome.tsx` (mount qua `HomeScreen.tsx:567`) | APPROVED | `LANE-A-home-dayzero.md`: Home Active **LIVE**, 19 dự án không regress; `LANE-C-home-flow.md` xác nhận cả hai cùng mount | — |
| 01·C | Chọn / mở dự án | `/` + `/projects/[id]/overview` | `components/ProjectSelect.tsx` · `components/home/ProjectOverviewCard.tsx` | IN-PROGRESS | `LANE-A-home-dayzero.md`: VIỆC 4 = **PARTIAL**, địa chỉ `components/Dashboard.tsx:416` còn là cửa thứ hai | Hợp nhất một cửa vào; dự án **chưa có Flow thì không hiện ở đâu cả** (`DEMO-SACH.md` ①) |
| 01·D | Dải ngữ cảnh (mép trên vỏ app) | mọi route | `components/studio/DaiNguCanh.tsx` · `AppChrome.tsx` (header đo **42px** trên app thật) | IN-PROGRESS | `COHERENCE-SHELL.md`: `WORKSPACE = PARTIAL` · `VISUAL COHERENCE = PASS` | Dải mới nói được một phần ngữ cảnh — chưa trọn workspace |
| 01·E | Files · Tệp nguồn dự án | `/files` | `components/filemanager/TepNguonDuAn.tsx` · API `app/api/project-files/**` | APPROVED | `COHERENCE-FILES.md`: `FILES = LIVE · VISUAL COHERENCE = PASS · BROWSER = PASS`; `PF-FILE-route-noi-dung.md` nối ô xem trước | — |

---

## 02 · NỘI DUNG · THƯ VIỆN (7 — gồm 2 bị bác, 1 legacy)

| # | Khung | Route thật | Component thật | Nhãn | Bằng chứng | Thiếu gì |
|---|---|---|---|---|---|---|
| 02·A | Thư viện · **BROWSE** (tầng 1) | chưa có route riêng | **chưa có** | NEEDS-HOÀ | Bàn giao §5a (hướng ba tầng) + §7 gate #1 — checkpoint BROWSE đầu tiên **chưa diễn ra**; `components/library/**` đang KHOÁ chờ design pass | Toàn bộ. Editorial, tĩnh, ảnh sản phẩm/3D **thật** to, ít metadata |
| 02·B | **Object Passport** (tầng 2) | chưa có route | **chưa có** — grep `Passport` toàn `components lib app` = **0** | NEEDS-HOÀ | grep 20/08 = 0 kết quả; luật §5a đã chốt nội dung (hãng · mã · kích thước · vật liệu · CAD · 3D · nguồn · đang dùng ở đâu) | Toàn bộ mặt |
| 02·C | **Technical Verify** (tầng 3) | chưa có route | **chưa có** — grep `TechnicalVerify` = **0** | NEEDS-HOÀ | grep 20/08 = 0; §5a: *ma trận kỹ thuật **CHỈ** ở tầng 3* | Plan/front/side/3D · bbox · anchor · slot vật liệu · nguồn/dẫn xuất · revision |
| 02·D | Duyệt nhập từ hãng (Promote) | `/api/project-files/[id]/promote` | `components/library/PublishModal.tsx` · `app/api/project-files/[id]/promote` | IN-PROGRESS | `LANE-B-promote-quality.md`: metadata **LIVE** (`4×3 · palette · hash 64 ký tự`) · dedupe **LIVE** (backfill 1.620/1.621) · **review contract BLOCKED** | `daXem` **không có chỗ lưu** ⇒ máy chủ không cưỡng chế được duyệt. Schema là cửa của Hoà |
| 02·E | LibrarySheet hiện hành | `/library` (+ sheet nổi) | `components/library/LibrarySheet.tsx` (~1054 dòng) | LEGACY | `DEMO-SACH.md` ③ = **PARTIAL**: deep-link `/library` **không mở được sheet** (trái docstring của chính nó); `GET /api/library` trả **1621 asset / 850 KB** một lượt | Phân trang (`LANE-B-promote-quality.md`: **DEFER** tường minh — 14 tệp đọc trọn mảng, 6 thuộc vùng lane khác); `w/h` của 9 asset mới = `0×0` |
| 02·X | Board **N · O · P** — ngôn ngữ thị giác IDFC | — | `docs/mocks/mock-exs-{n,o,p}-*.html` | **REJECTED** | Bàn giao §2: Hoà bác 20/08 chiều — *"đồ vẽ tay + ma trận mẫu vật + minh hoạ kiểu CAD ≠ trải nghiệm cao cấp"*. **CẤM thi công visual theo N/O/P** | Giữ **tham chiếu kỹ thuật**: line-grammar · anatomy · anchor · LOD · flow Place-Replace-Override vẫn có giá |
| 02·Y | Board **R / T** — "Real Asset Quality Pass" | — | `mock-exs-r-*.html` · `mock-exs-t-library-v0.html` | **REJECTED** | Bàn giao §5 dòng đầu: *"ĐÃ BÁC, đừng nhặt lại"* | Thay bằng hướng ba tầng 02·A→C |

---

## 03 · SÁNG TÁC · BA CHẶNG (4)

| # | Khung | Route thật | Component thật | Nhãn | Bằng chứng | Thiếu gì |
|---|---|---|---|---|---|---|
| 03·A | 2D Kỹ thuật · precise-flat | `/projects/[id]/cad` · `/cad-editor` | `components/cad/CadEditor.tsx` · `studio/CadStageScreen.tsx` · `lib/cad/store.ts` | IN-PROGRESS | `DEMO-SACH.md` ④ = **PARTIAL**: empty-state đúng luật X2, gõ `W` **ăn**; ❌ hai lần bấm + Enter **không sinh tường**. `D4-selection-ma-sau-undo.md`: gốc thật là `lib/cad/store.ts:747 removeLayer` (**không phải ⌘Z** như QA báo) — đã sửa | Chưa quy được lỗi vẽ tường: tab hidden ⇒ `rAF` không chạy ⇒ canvas 304×152 trong khung 1057×611, toạ độ bấm vô nghĩa. **Cần verify lại trên tab visible** |
| 03·B | 3D Thiết kế · Node ↔ Vẽ 3D | `/projects/[id]/render` | `components/FlowCanvas.tsx` (Node) · `components/three/Viewport3D.tsx` | IN-PROGRESS | `DEMO-SACH.md` ⑤ = **PARTIAL**: mode Node mở đúng (rail `KHỐI · Tệp · Việc`, empty-state, `0 nút · 0 nối sai`) | **Mode viewport 3D chưa kiểm được** (cần rAF chạy thật) |
| 03·C | Trình chiếu · editorial-cinematic | `/projects/[id]/present` · `/present-editor` | `components/present-editor/**` (EditorCanvas · LayoutShelf · Inspector) | IN-PROGRESS 🔴 | `DEMO-SACH.md` ⑥ = **PARTIAL**: mở được (`Hồ sơ 1 / 0 slide`, 41 nút) nhưng **thân trang trống trơn** | **Không empty-state, không CTA, không thẻ "＋ Tạo hồ sơ trống"** — chặng **duy nhất** bỏ trống, trái luật X2 + chốt 10/08 |
| 03·D | Auto Grid — capability CỦA Present | chưa có | **chưa có** — grep `AutoGrid\|LayoutGhost` = **0** | READY-TO-CODE | Board J `mock-exs-j-khung-moc.html` **APPROVED** (Hoà pass mắt 20/08); bàn giao §1 đính chính 20/08: **KHÔNG phải năng lực toàn app** | Toàn bộ code: select blocks → Layout Ghost mọc từ composition frame → alternatives ‹› → Compare/Apply/Undo, **không đè vùng custom** |

---

## 04 · SOÁT / HIỂU (6)

| # | Khung | Route thật | Component thật | Nhãn | Bằng chứng | Thiếu gì |
|---|---|---|---|---|---|---|
| 04·A | Review · hai lớp Luật ↔ Góp ý | trong 3 chặng | `components/review/ReviewPanel.tsx` · `lib/review/{types,hien-thi-luat}.ts` · `lib/review/luat/` · `lib/review/gopy/` | IN-PROGRESS | `ls lib/review` xác nhận khung hai lớp đủ cho 3 chặng; entry `kiem-chang-moi-cong-doan` mở trong sổ | Chưa cắm vào **mọi** cửa chuyển công đoạn — mới là panel, chưa là cổng |
| 04·B | Vitals Aperture · Ambient→Peek→Engage | mọi route | `components/studio/VitalsAperture.tsx` · `VitalsGesture.tsx` · `vitals-tin-hieu.ts` · `VitalsStateBadge.tsx` | APPROVED | `COHERENCE-SHELL.md`: `VITALS = LIVE`; board E pass mắt; engage mở **từ chính aperture** (V3 resolved) | — |
| 04·C | Context Intelligence Stack (trục phải) | chưa có | **chưa có stack** — grep `ContextIntelligence` = **0** (chỉ có mảnh rời) | READY-TO-CODE | Bàn giao §1 chốt đủ chi tiết: 5 lens Selection/Vitals/History/Review/Output · Peek→Inspect→Deep · 5 mức sự thật; board E APPROVED | Hợp nhất các mảnh rời thành **một** stack |
| 04·D | Đang dùng ở đâu (Where-Used) | `/api/project-asset-usage` | `components/library/AssetWhereUsed.tsx` · `da-gan-du-an.ts` · `app/api/project-asset-usage/{route.ts,[id]/route.ts}` | APPROVED | `DEMO-SACH.md` ③: where-used **trả đúng dự án**; `PREFETCH-attach-state.md`: biết trạng thái đã gắn **ngay khi mở panel**; `FIX500-project-asset-usage.md` đã vá 500 body rỗng | — |
| 04·E | Đi tới nguồn (Go-to-Source) | — | cầu `lib/.../handoff.ts` (dữ liệu có) · **mặt hiển thị chưa có** | READY-TO-CODE | `LANE-C-render-motion-present.md`: Present Bridge = **PARTIAL** — *"thiếu mặt hiển thị 'Đi tới nguồn / còn mới–đã cũ' bên trong Trình chiếu"* | Mặt hiển thị. Chờ chốt **chỗ ở của provenance cấp element** |
| 04·F | Cũ / vùng ảnh hưởng (Stale · Blast Radius) | — | `Stale/daCu` rải ở `present-editor/Element.tsx`, `Inspector.tsx`, `cad/CadEditor.tsx` · **`BlastRadius` = 0** | READY-TO-CODE | grep 20/08: khái niệm "cũ" có nhưng **mỗi chỗ một nghĩa riêng**; bàn giao §1 chốt 5 mức sự thật | Chưa là **một ngôn ngữ của hệ**. Không có nó thì Override≠Edit-Definition không nói được gì |

---

## 05 · KHOẢNH KHẮC NĂNG LỰC (7)

| # | Khung | Route thật | Component thật | Nhãn | Bằng chứng | Thiếu gì |
|---|---|---|---|---|---|---|
| 05·A | Dựng ảnh (Visual Generate) | `/projects/[id]/render` | `lib/capabilities/visual-generate.ts` · `visual-generate-run.ts` · `components/ui/StageToolbelt.tsx` | IN-PROGRESS | `LANE-A-visual-generate.md`: tsc 0 · 16 nhóm kiểm PASS · `soi:frontier` 0 lệch · **BROWSER PASS** 1440×900 | **Bố cục toolbelt chờ mắt Hoà** — board Q `mock-exs-q-toolbelt-capability.html` = DESIGNED, gate mở #2 |
| 05·B | Sửa có kiểm soát (mask · giữ vùng) | `/projects/[id]/render` · `/photo-editor` | `lib/capabilities/compound.ts` (6 năng lực, working set 4–8) · `components/present-editor/ImageEditor.tsx` | IN-PROGRESS | `ls lib/capabilities` + `LANE-A-visual-generate.md` (đọc `compound.ts` qua `workingSet()`); 🔴 lane A khai **một tiền đề của `compound.ts` SAI, đã né chứ chưa sửa** | Một khoảnh khắc thống nhất "chọn vùng → sửa → so trước/sau" theo luật Master/Compound. Và cái tiền đề sai kia chưa ai sửa |
| 05·C | Ảnh → Khối / Spec (Image→3D) | — | `lib/capabilities/image-to-3d.ts` + test | IN-PROGRESS | `LANE-B-image-to-3d.md`: **PARTIAL** — lõi + cửa duyệt + cổng BOQ + móc biểu diễn chạy, có test, tsc sạch | 🔴 **Hai nửa `lenhNoiBo` không cùng hạng**: `vision.measureObjectTiered` chạy từ ảnh trần được, `idfc.fromPhoto` **không** |
| 05·D | Kết xuất (Render + hàng đợi) | `/projects/[id]/render` | `components/render-studio/render-queue-store.ts` (421 dòng) · `lib/capabilities/render.ts` · `render-core.ts` | APPROVED | `LANE-C-render-motion-present.md`: Render = **LIVE** — chụp khung nhìn sống → bản ghi có gia phả → dải kết quả, *"thấy tận mắt"*; tiến trình là **số thật** từ `runNode()` | Nhánh AI đã nối hàng đợi nhưng **chưa tiêu credit lần nào** (khai thật, không phải lỗi) |
| 05·E | Chuyển động (Motion) | `/projects/[id]/render` | `lib/capabilities/motion.ts` · `motion-core.ts` · node `ai.image2video` (`lib/nodes/registry.ts:561`, 8 credit) | IN-PROGRESS | `LANE-C-render-motion-present.md`: Motion = **PARTIAL** — dây đủ, có gia phả + kế thừa `sceneRev` | **Chưa chạy sống lần nào** |
| 05·F | Cổng Spec · chuỗi khung (Sequence) | — | `lib/three/capture.ts` (`captureSequence`) · `components/cad/CamPathPreview.tsx` · `CamPathControlPanel.tsx` | NEEDS-HOÀ 🔴 | `LANE-C-render-motion-present.md`: Sequence = **BLOCKED**, *"không làm gì"* | `captureSequence` cần `CamPathResult`, mà `CamPathPreview`/`CamPathControlPanel` **chưa wire vào chặng nào** — nợ cũ trong `00-CHOT`. Nối là **một phiếu riêng** |
| 05·G | Tự dàn trang (Layout Ghost + alternatives) | chưa có | **chưa có** | READY-TO-CODE | Mặt tương tác của 03·D; board J APPROVED, code **0 dòng** | Toàn bộ. Ràng buộc cứng: **không đè vùng người dùng đã sửa tay** |

---

## 06 · HỆ THỐNG (4 — gồm 1 legacy)

| # | Khung | Route thật | Component thật | Nhãn | Bằng chứng | Thiếu gì |
|---|---|---|---|---|---|---|
| 06·A | Hồ sơ cá nhân · avatar | `/settings/avatar` | `components/avatar/AvatarBuilder.tsx` | IN-PROGRESS | `EXS-BUILD-1-sidebar-ba-cum.md`: mục **Cá nhân** trên rail trỏ **trang THẬT** `/settings/avatar` — *"không phải nút giả"*; `mucDangMo` bắt `/settings/avatar` trước nhánh `/settings` | Màn avatar **chưa đi qua pass thị giác EXS** |
| 06·B | Credit · giá trước khi chạy | `/api/credits` | `components/Dashboard.tsx` · `AccountMenu.tsx` · `MobileMenu.tsx` · `lib/execution.ts:263 estimateRunCredit` | IN-PROGRESS | Sổ 15/08 đo bảng giá thật (`lib/nodes/registry.ts`): video 8cr · render ảnh 4cr · **13 việc 0cr**; phanh có sẵn: nói giá **trước** khi chạy + node `done` cache-skip | Mặt hiển thị **rải ba chỗ**, chưa có một chỗ ngồi cố định |
| 06·C | Cài đặt (7 màn) | `/settings` (+ `/about`, `/licenses`, `/avatar`) | `components/settings/**` | IN-PROGRESS | `ls app/settings` = 4 route; sổ 15/08: `unitSystem` grep = **0**, mm gõ cứng rải rác (vd `chuan-net.ts:1202 donVi:'mm'`) | **Đơn vị đo + tỉ lệ cấp toàn app** — đã chốt (entry `don-vi-ty-le-toan-app`) nhưng **không màn nào có** |
| 06·X | Dashboard cũ — cửa vào thứ hai | `/` (mount song song) | `components/Dashboard.tsx:416` | **LEGACY** | `LANE-A-home-dayzero.md`: VIỆC 4 = **PARTIAL**, *"`Dashboard.tsx:416` còn là cửa thứ hai, có địa chỉ + đề xuất"* | Gỡ. Kèm: `components/studio/StageSwitcher.tsx` docstring còn tự khai *"trục điều hướng DUY NHẤT của app"* — **lỗi thời từ 16/08** (sidebar lên làm hệ router), chưa đóng dấu |

---

## 07 · TRẠNG THÁI — một ngôn ngữ cho cả app (11)

| # | Trạng thái | Component thật | Nhãn | Bằng chứng | Thiếu gì |
|---|---|---|---|---|---|
| 07·01 | Ngày số không | `components/home/BatDauNgaySoKhong.tsx` | APPROVED | `LANE-A-home-dayzero.md` VIỆC 1 = **LIVE** | — |
| 07·02 | Trống · làm-được-việc tại chỗ | `components/studio/ProjectScopeEmptyState.tsx` · empty-state 2D/3D | IN-PROGRESS | `DEMO-SACH.md` ④⑤ đúng luật X2 (câu + 2 nút); ⑥ **trống trơn** | **Trình chiếu bỏ trống hoàn toàn** ⇒ chưa phải một ngôn ngữ chung |
| 07·03 | Đang tải | `components/home/TrangThaiO.tsx` | IN-PROGRESS 🔴 | `LANE-A-home-dayzero.md`: 4 trạng thái **LIVE**, đo đủ 2 theme — **nhưng** `DEMO-SACH.md` ① bắt: Home đứng **spinner trắng** khi `/api/auth/me` chậm, **đo 127 giây** một lượt | Không skeleton, không timeout, không một câu nào trong 127 s đó |
| 07·04 | Lỗi | `components/home/TrangThaiO.tsx` | APPROVED | `LANE-A-home-dayzero.md` VIỆC 2 = **LIVE** (đang tải · trống · lỗi · ngoại tuyến, 2 theme) | — |
| 07·05 | Ngoại tuyến | `TrangThaiO.tsx` · `ProjectSelect.tsx` · `home/ProjectOverviewCard.tsx` · `cad/AiBriefPanel.tsx` | APPROVED | `LANE-A-home-dayzero.md` VIỆC 2 = **LIVE**; grep `offline` 20/08 | — |
| 07·06 | Không hỗ trợ | `app/api/project-files/route.ts` (trả **415**) | IN-PROGRESS | `COHERENCE-FILES.md` ⑩: **415 thật**, *"câu server đo được"* cho DWG/DXF | Mới có ở **một cửa** (Files) — chưa nhân ra các cửa nhập khác |
| 07·07 | Cần xem lại | **không có chỗ lưu** | NEEDS-HOÀ 🔴 | `LANE-B-promote-quality.md`: review contract = **BLOCKED** — *"`daXem` không có chỗ lưu ⇒ máy chủ không cưỡng chế được; đã khai thẳng hợp đồng 'Promote KHÔNG đòi duyệt' thay vì dựng cổng giả"* | Một cột trong schema. **Schema là cửa của Hoà** |
| 07·08 | Đã kiểm (Verified) | `lib/capabilities/image-to-3d.ts` · `lib/idfc-import/from-photo.ts` | NEEDS-HOÀ | grep `Verified\|daKiem` 20/08: **chỉ ở `lib/`, 0 ở `components/`** | Không có mặt hiển thị nhất quán; **chặn cùng 07·07** |
| 07·09 | Dẫn xuất (Derived) | promote metadata + `sceneRev` ở render | IN-PROGRESS | `LANE-B-promote-quality.md`: metadata **LIVE** (nguồn · hash 64 ký tự); `LANE-C`: gia phả + kế thừa `sceneRev` | **Chưa đọc được ở phía Trình chiếu** — cùng lỗ với 04·E |
| 07·10 | Suy ra (Inferred) | `components/materials/ChiBaoBaMat.tsx` · `BaMatPanel.tsx` · `MaterialPbrEditor.tsx` | APPROVED | grep `SuyRa\|inferred` 20/08: cờ ba nấc sống thật trên mặt vật liệu | — |
| 07·11 | Cũ (Stale) | `present-editor/Element.tsx` · `Inspector.tsx` · `cad/CadEditor.tsx` | READY-TO-CODE | grep `Stale\|daCu` 20/08: rải rác, **mỗi chỗ một nghĩa riêng** | Chưa là một trạng thái của hệ |

---

## Bốn kết luận rút từ sổ (dành cho phiên vẽ Atlas native)

1. **Nhóm 02 gần như trắng.** BROWSE · Object Passport · Technical Verify đều **0 dòng code**,
   trong khi nhóm 01 và 05 đã có bề mặt sống. Thư viện là mảng **tụt xa nhất** so với phần còn
   lại của app — và nó lại đúng là hero output. Vẽ Atlas mà cho nhóm 02 trông ngang các nhóm
   khác là **nói sai sự thật**.

2. **Ba khung chặn ở CÙNG MỘT chỗ, không phải ba việc:** 02·D + 07·07 + 07·08 đều chết ở
   `daXem` không có nơi lưu. **Một quyết định schema của Hoà mở được cả ba.**

3. **Năm khung "vẽ xong chưa xây"** (`READY-TO-CODE`): 03·D + 05·G Auto Grid · 04·C Context
   Stack · 04·E Go-to-Source · 04·F/07·11 Stale. Luật đã đủ chi tiết để code — đây là phần rẻ
   nhất để đi tiếp, không cần thêm vòng thiết kế.

4. **Bốn chỗ xấu phải giữ nguyên trên Atlas:** 02·E LibrarySheet cũ (deep-link gãy, 850 KB một
   lượt) · 06·X Dashboard cửa thứ hai · 03·C Trình chiếu trống thân trang · 07·03 spinner trắng
   127 s. **Giấu bốn cái này là làm hỏng công dụng duy nhất của Atlas.**

---

## Khai thật — chỗ sổ này KHÔNG chắc

- **03·A** (2D không sinh tường) **chưa quy được lỗi**: `DEMO-SACH` tự khai tab trình duyệt luôn
  `hidden` ⇒ `rAF` không chạy ⇒ toạ độ bấm vô nghĩa. Có thể là **lỗi môi trường đo**, không phải
  lỗi sản phẩm. Cần đo lại trên tab visible trước khi kết luận.
- **03·B** mode viewport 3D **chưa ai kiểm** — nhãn IN-PROGRESS là do *chưa biết*, không phải do
  *biết là hỏng*.
- **05·B** dựa một phần vào `compound.ts`, mà lane A khai có **một tiền đề của file đó SAI, đã né
  chứ chưa sửa** (ngoài vùng ghi của lane A). Chưa ai đi sửa.
- Nhãn `APPROVED` ở đây nghĩa là **Hoà pass mắt board thiết kế + code sống**, lấy từ bàn giao §2
  (*"Hoà pass mắt sáng 20/08"*). Nó **không** có nghĩa Hoà đã duyệt từng pixel của màn thật đang
  chạy — hai việc khác nhau, và Atlas native chính là chỗ để đóng khoảng cách đó.
