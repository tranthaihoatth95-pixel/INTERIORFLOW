# M-NHAN-OUT — báo cáo phiên CODE (07/08, nhãn + Toàn cảnh 3D)

Sở hữu: `components/studio/` · `components/entry/` · `components/three/` · `lib/phases.ts`
(coi là "lib/stages/" — thư mục đó KHÔNG TỒN TẠI trên đĩa, `lib/phases.ts` là file thật quản lý
chặng/nhãn mà chính brief trích dẫn G-M15-02/06, nên diễn giải sở hữu bao gồm file này — xem mục
"Giả định cần Hoà xác nhận" cuối báo cáo) · `app/globals.css`.
CẤM chạm: `lib/cad/` · `lib/boq/` · `lib/materials/` — tuân thủ tuyệt đối, xem mục VIỆC 2 G-M15-05.

---

## VIỆC 1 — Nút Toàn cảnh 3D (G-M18-04)

Xác nhận grep GAP đúng: `fitToScene|zoomExtents|zoomToFit|fitCamera|Toàn cảnh|Vừa khung` = 0 trước
khi sửa. Đã thêm:

- `components/three/Scene3DViewer.tsx` — tách công thức camera-fit (vốn nằm inline trong effect
  mount, dùng đúng 1 lần) thành hàm riêng `fitCameraToScene(scene, camera, controls)` (KHÔNG đổi
  số/toán — giữ nguyên công thức đã qua "phán quyết PHU 03/08"). Effect mount vẫn gọi hàm này y hệt
  cũ. `Scene3DCameraApi` (đã có sẵn cho ViewCube3D) thêm field `fit: () => void`, no-op ở mode
  `walk`/`campath` (2 mode này tự lái camera mỗi khung, "toàn cảnh" vô nghĩa).
- `components/three/Viewport3D.tsx` — nút **"Toàn cảnh" / "Fit view"** (chữ thật, G6, không icon
  hoá — icon `Maximize` + chữ), gọi `cameraApiRef.current?.fit()`. `disabled` + tooltip lý do khi
  mode walk/campath (đúng §9 "không nút giả").
- `components/three/ve3d-css.ts` — class `.fitbtn`: nền ĐẶC `rgba(20,22,26,.92)` (không
  `backdrop-filter`) — G9 đã dùng hết 4 chỗ kính lỏng cho khu vực canvas 3D này (ModeSwitchBar/nút
  Dựng ảnh/ViewCube/Lightbox), cộng thêm `.vpover`/`.vplabel`/`.vpnote` cũng đã có blur sẵn → thêm
  1 tấm blur nữa là vượt ngân sách hiệu năng WebGL đã cảnh báo trong G9. Dùng nền đặc thay kính,
  cùng tông với `.vpover` (nền cảnh 3D hardcode tối, không theo theme — lý do đã ghi sẵn trong file
  từ trước, áp dụng nốt cho nút mới).
- 🔴 **Bắt lỗi TRƯỚC KHI COMMIT**: comment đầu tiên viết trong `ve3d-css.ts` chứa dấu backtick
  (`` ` ``) bên trong một template literal JS (chuỗi CSS bọc bằng backtick) — cắt đứt chuỗi giữa
  chừng, gây lỗi `tsc` kiểu domino (báo sai vị trí hoàn toàn). Đã sửa (bỏ backtick khỏi comment).
  Bài học: KHÔNG dùng dấu `` ` `` trong comment nằm bên trong template literal.

**Verify**: `tsc --noEmit -p .` sạch (2 lần lỗi transient `.next` cache do phiên khác chạy song
song trên cùng thư mục — đúng §0aa, tự hết sau khi chạy lại, không phải lỗi code). Browser thật
(127.0.0.1:3002): nút "Toàn cảnh"/"Fit view" hiện đúng vị trí (dưới ViewCube) ở cả 4 tổ hợp
theme×ngôn ngữ (ảnh dưới). Bấm nút không lỗi console (2 dòng 500 quan sát được là do cache `.next`
hỏng — §0aa — không tái hiện sau reload sạch).
🟡 **CHƯA VERIFY dứt điểm bằng mắt "kéo lệch camera → bấm Toàn cảnh → camera bay về"**: dự án mẫu
đang mở có hình học đối xứng quanh tâm và camera vốn đã ở đúng vị trí fit lúc mount, nên ảnh
trước/sau bấm nút giống hệt nhau (không sai — đúng là chưa có gì để "về lại"). Thử kéo orbit bằng
`left_click_drag` trong môi trường sandbox không tạo ra thay đổi khung hình quan sát được (nghi
công cụ giả lập chuột không phát đủ sự kiện pointermove cho OrbitControls, không phải lỗi code) —
không đủ điều kiện dựng lại kịch bản "camera lệch" để chụp bằng chứng trước/sau khác nhau thật.
Logic đã đọc lại 2 lần, khớp encoding chính xác công thức gốc — tự tin cao nhưng ghi rõ CHƯA có
ảnh "trước lệch/sau về" theo đúng nghĩa đen.

---

## VIỆC 2 — Nhãn chặng/mode/CAD/Home

### G-M15-01 — nút chặng mờ như khoá
`StageSwitcher.tsx:272` đã sửa TRƯỚC phiên này (`color: on ? 'var(--t1)' : 'var(--t3)'`). Rà thêm
trong `components/studio/` + `components/entry/` cho pattern "trạng thái ĐANG BẬT bị gán màu mờ
--t3/--t4" (đúng lớp bệnh G-M15-01, không phải lớp "trạng thái tắt nhạt màu" — đó là bình thường):
| File | Pattern tìm thấy | Kết luận |
|---|---|---|
| `AppCommandPalette.tsx:262` | `on ? accent : --t4` | ĐÚNG (bật=accent, tắt=mờ) |
| `InspectorPages.tsx:56` | `on ? accent-soft+accent : --t4` | ĐÚNG |
| `StageSwitcher.tsx:272` | `on ? --t1 : --t3` | ĐÚNG (đã sửa trước) |
| `entry/LoginForm.tsx:216` | `on ? --t1 : --t4` | ĐÚNG (tab Đăng nhập/Đăng ký trên `.lq-card`, không phải bug G-M15-01) |
⇒ **0 chỗ khác vi phạm** trong vùng sở hữu. Đo được bằng `getComputedStyle` trên browser thật (dark:
active `rgb(245,245,247)`=--t1, inactive `rgb(158,158,168)`=--t3; light: active `rgb(33,30,25)`,
inactive `rgb(114,108,98)`) — cả 2 theme tab đang mở luôn đậm nhất, đúng luật.

### G-M15-02 — gộp tên chặng với mode
Đo lại (§0ab, "sổ GAP là ảnh chụp"): `StageSwitcher.tsx` (đường LIVE, render `p.label` tĩnh) **ĐÃ
được sửa từ trước** phiên này — không còn gộp `"Thiết kế 2D · Sơ phác"` trên nút chặng. Ảnh "07/08"
brief nhắc là ảnh CŨ. NHƯNG tìm ra một nơi khác vẫn còn bug y hệt: **`lib/phases.ts:145-149` hàm
`phaseLabel()`** vẫn trả `'Thiết kế 2D · Sơ phác'`/`'Thiết kế 2D · Kỹ thuật'` — grep xác nhận hàm
này **0 nơi gọi** (`grep -rn "phaseLabel(" --include=*.tsx --include=*.ts .` chỉ ra đúng định nghĩa
của nó) nên KHÔNG phải bug đang hiện, nhưng chữ ký sai theo chốt mới — đã sửa để không tái sinh lỗi
nếu phiên sau lỡ gọi (nay luôn trả `PHASE_MAP[id].label`, bỏ hẳn phần gộp mode).

### G-M15-03 — hai bộ "3 chặng" trùng tên
Tìm cả hai: `docs/IF1_IF2_BIGPICTURE.md` §3 ("3 Chặng IF2": ① CAD kỹ thuật ② BIM/IFC 4.0 ③ Viewer
3D) vs `docs/00-CHOT.md` (chốt 07/08: ① Thiết kế 2D ② Thiết kế 3D ③ Trình chiếu, `concept`/
`render`/`present`). **Bộ chốt 07/08 THẮNG** — lý do: đây là bộ ĐANG SỐNG trong code (StageSwitcher,
lib/phases.ts, mọi UI người dùng thấy hôm nay); bộ IF1_IF2_BIGPICTURE là tài liệu kiến trúc viết
20/07, mô tả một tầng năng lực KHÁC (IF2 = BIM/CAD kỹ thuật sâu), chưa có UI nào tương ứng. Đã thêm
banner đính chính đầu file + đổi tiêu đề §3 "3 Chặng IF2" → "3 mảng IF2" (không đổi nội dung bảng,
chỉ đổi từ "chặng" → "mảng" theo đúng luật mới).

### G-M15-05 — comment sai trong `lib/cad/store.ts:156`
**KHÔNG SỬA — CẤM chạm `lib/cad/`** theo đúng ranh giới sở hữu phiên này. Ghi nhận rõ: dòng đó gọi
lựa chọn mode thủ công là "override thủ công (backward-compat)" — sai theo chốt 07/08 (nay là
đường CHÍNH). Cần phiên có quyền `lib/cad/` sửa 1 dòng comment này (logic không cần đổi, đã đúng
sẵn theo chính GAP ghi).

### G-M15-06 — 14 chỗ chữ "CAD"
Grep lại `CAD` trong 4 vùng sở hữu (`components/studio/`, `components/entry/`, `components/three/`,
`app/globals.css`), loại trừ comment/docstring: **0 chuỗi hiển thị người dùng**. 13/14 chỗ GAP liệt
kê nằm NGOÀI vùng sở hữu (`components/present-editor/`, `components/render-studio/`,
`components/LibraryPanel.tsx`, `lib/library/`, `lib/refingest.ts`, `app/library/`,
`components/settings/`, `lib/nodes/`) — không sửa, để đúng phiên phụ trách vùng đó.
1/14 nằm trong `lib/phases.ts:39` (`blurb`, coi là trong sở hữu theo diễn giải "lib/stages/", xem
đầu báo cáo) — đã sửa `"mở/vẽ CAD"` → `"mở/vẽ Thiết kế 2D"`. Đo lại (N8): field `.blurb` của
`PhaseMeta` **0 nơi render** trong app hiện tại (`grep -rn "\.blurb\b"` chỉ khớp field trùng tên ở
`AiDependencySettings.tsx`, không phải `PhaseMeta`) — sửa trước để không tái sinh lỗi khi có phiên
sau nối field này vào UI, không phải một bug đang hiện cho người dùng.

### G-M22-03 — nút Home đứng riêng ngoài menu
Đọc kỹ trước khi sửa (N9-kiểu): `AppLogoMenu.tsx` đã có sẵn `goHomeItem` ("Về Thư viện dự án", gọi
thẳng `goHomeConfirmed()`) đứng ĐẦU danh sách, TRÊN vạch phân cách — tức "đặt PHÍA TRÊN mục Về Thư
viện dự án" theo chữ GAP hoá ra CHÍNH LÀ mục đó, không phải một mục thứ 6 tách biệt (GAP đếm "thành
6 mục" là số SAI — đo lại bằng code: menu vẫn đúng 5 mục, chỉ bớt 1 nút rời bên ngoài). `HomeButton.
tsx` (đứng riêng cạnh logo, `AppChrome.tsx:254`) tự khai trong docstring của chính nó là trùng vai
với `goHomeItem` — cả hai cùng gọi `goHomeConfirmed()`. Đã:
1. Gỡ `{logoMenu && <HomeButton compact />}` khỏi `AppChrome.tsx` + comment liền kề.
2. Gỡ import `HomeButton` khỏi `AppChrome.tsx`.
3. **Xoá file `components/studio/HomeButton.tsx`** (mồ côi sau gộp — 0 nơi khác import, xác nhận
   bằng `grep -rn "HomeButton" --include=*.tsx --include=*.ts .` toàn repo trước khi xoá).
4. Sửa 1 comment lịch sử còn lại trong `AppChrome.tsx` (dòng ~346) tham chiếu `HomeButton` cho khớp
   thực tế mới.

**Verify browser**: bấm logo → menu đúng 5 mục *Về Thư viện dự án · Tổng quan · Dự án & Flow ·
Files · Thư viện*, KHÔNG còn icon nhà đứng rời cạnh logo (ảnh dưới, cả 2 theme).

### Bonus — CHỐT NGÔN NGỮ EN/VI cho nhãn chặng (phát hiện lúc verify, NGOÀI 6 mã GAP được giao,
nhưng đúng nội dung "CHỐT NGÔN NGỮ" đầu brief)
Đổi `lang='en'` qua `window.__flowStore.getState().setLang('en')` để verify — bắt được:
`StageSwitcher.tsx` render `p.label` **tĩnh, không đổi theo `lang`** ⇒ giao diện EN vẫn hiện
"Thiết kế 2D · Thiết kế 3D · Trình chiếu" thay vì "2D Design · 3D Design · Presenting" như CHỐT
NGÔN NGỮ đầu brief yêu cầu. Đã sửa: `PhaseMeta` thêm field `labelEn` (3 giá trị đúng chốt: "2D
Design"/"3D Design"/"Presenting"), `StageSwitcher.tsx` dùng `useT()` → `tr(p.label, p.labelEn)`.
Rà thêm 2 nơi khác từng render `PHASE_MAP[...].label` (`components/LoginScreen.tsx` root,
`components/StageSelect.tsx`) — cả hai **MỒ CÔI, 0 importer** (đã bị thay bởi
`components/entry/LoginScreen.tsx`, không dùng `PHASE_MAP` nữa) — không sửa (dead code, ngoài vùng
việc thật), chỉ ghi nhận cho TỔNG biết nếu muốn dọn.
`WIDEST_LABEL` (bảng ghost-width chặn layout-shift, `StageSwitcher.tsx:38`) **CHƯA thêm bản EN** —
rủi ro thấp (chữ Anh thường ngắn hơn/bằng chữ Việt tương ứng ở đây), ghi lại làm việc treo nhỏ.

**Verify browser đủ 4 tổ hợp** (dark×VI, dark×EN, light×VI, light×EN) — xem ảnh gửi kèm, đọc DOM
`document.body.innerText` xác nhận **0** chuỗi khoá kỹ thuật lọt ra (`concept`/`render`/`present`/
`CAD`/`sketch`/`revit`) ở cả 4 tổ hợp.

---

## VIỆC 3 — Đối chiếu 3 mock với code (KHÔNG sửa mock)

Xác nhận cả 3 file tồn tại thật trên đĩa (đúng §0ab — grep tên gặp lỗi NFC/NFD nếu gõ tay, phải
`ls` để lấy tên byte-chính xác): `docs/mocks/3D Dựng khối.dc.html` ·
`docs/mocks/Nút tổng.dc.html` · `docs/mocks/Bảng nút.dc.html`. **Sổ GAP mảng G-M5 ghi "chưa có" là
SAI với 3 mock này** — xác nhận thêm bằng chứng cho kết luận G-M5-18 (cả mảng G-M5 lỗi thời).

| Mock | Mock có gì | Code có chưa | Lệch ở đâu |
|---|---|---|---|
| **3D Dựng khối.dc.html** (613 dòng, mtime 07/08) | 4 trạng thái viewport 3D: không chọn · chọn khối · kéo mặt · dock công cụ (thu gọn/mở rộng) | **CÓ** — `Render3DModeSkeleton.tsx`+`Command3DPanel.tsx` (`components/render-studio/`, NGOÀI sở hữu phiên này) dựng đủ khung + dock (`ToolDock3D.tsx`, đã build ở phiên TRƯỚC). `components/three/Viewport3D.tsx` (sở hữu phiên này) là tầng khung nhìn dùng chung. | Không lệch lớn về cấu trúc (đã đối chiếu ở M-3D-OUT.md phiên trước) — phiên này chỉ bù thêm nút "Toàn cảnh" (VIỆC 1) mà mock KHÔNG vẽ (mock không có concept này) — bổ sung hợp lý theo GAP riêng G-M18-04, không trái mock. |
| **Nút tổng.dc.html** (613 dòng) | Màn "gom N nút thành 1 nút tổng dùng lại": đặt tên/mô tả/icon, bảng "tham số đưa ra ngoài" (nút con · tham số gốc · tên hiện ra ngoài · toggle hiện/ẩn) | **CÓ, khớp cao** — `components/nodes/MacroCreateDialog.tsx` (304d, mtime 06/08) implement ĐÚNG bảng expose-param với toggle, tên đổi được, đúng câu "tham số không hiện vẫn chạy, chỉ nằm bên trong" y hệt mock. `MacroNodeFace.tsx`/`MacroSelectionToolbar.tsx`/`MacroShelf.tsx` phụ trợ. NGOÀI sở hữu phiên này (`components/nodes/`). | Không đối chiếu pixel-by-pixel (ngoài giờ cho phép của phiên) — nhưng cấu trúc dữ liệu/hành vi khớp mock ở tầng khái niệm. Không phát hiện lệch lớn. |
| **Bảng nút.dc.html** (550 dòng) | Canvas node-graph "Chặng 3D": nút = tấm kính nổi trên nền chấm, cổng nối màu theo loại (ảnh=`--p-img`, mặt nạ=`--p-mask`, vật liệu=`--p-mat`, tham số=`--p-num`) | **CÓ** — 4 token màu port đã khai đúng trong `app/globals.css:37-40` (sở hữu phiên này), alias `--p-img:var(--accent)`/`--p-mask:var(--warning)`/`--p-mat:var(--success)`/`--p-num:var(--t3)` — ĐÚNG luật "khai bí danh, không hex mới". `components/FlowCanvas.tsx`+`components/nodes/InteriorNode.tsx` (NGOÀI sở hữu) tiêu thụ token này. | Không phát hiện lệch — tầng token (trong sở hữu) đã đúng; tầng canvas/node UI (ngoài sở hữu) không kiểm sâu trong giờ phiên này. |

**Kết luận VIỆC 3**: cả 3 mock đều đã có bản đối ứng trong code, KHÔNG cần vẽ lại. Việc thật (nếu
có) là tinh chỉnh nhỏ ở `components/nodes/`/`components/render-studio/`/`components/FlowCanvas.tsx`
— NGOÀI sở hữu phiên này, không sửa.

---

## Giả định cần Hoà xác nhận
1. **`lib/stages/` không tồn tại trên đĩa** — đã diễn giải là `lib/phases.ts` (file quản lý
   chặng/nhãn thật, đúng những gì G-M15-02/06 trích dẫn). Nếu ý Hoà là thư mục khác/chưa tạo, xin
   chỉnh lại phạm vi.
2. **G-M22-03 "thành 6 mục"** — đã KHÔNG làm theo số này vì đo code cho thấy "Về Thư viện dự án"
   đã sẵn là mục Home; làm thêm 1 mục thứ 6 y hệt sẽ tạo hai nút trùng lặp cạnh nhau. Nếu Hoà muốn
   giữ CẢ HAI (đổi tên 1 trong 2 cho khác nghĩa), xin nói rõ nghĩa khác đó là gì.
3. **`lib/cad/store.ts:156`** (G-M15-05) — để nguyên, chờ phiên có quyền `lib/cad/`.

## Đã xong / còn treo / CHƯA VERIFY
- ✅ VIỆC 1: nút Toàn cảnh 3D — code xong, verify browser 4 tổ hợp OK; 🟡 chưa chụp được ảnh
  "trước lệch/sau về" (môi trường không giả lập được orbit-drag).
- ✅ VIỆC 2: G-M15-01 (kiểm sạch) · G-M15-02 (đính chính + vá `phaseLabel()`) · G-M15-03 (chốt +
  đổi tên file docs) · G-M15-06 (1/14 trong sở hữu, đã sửa) · G-M22-03 (gộp Home) · bonus EN label.
  🔴 G-M15-05 CHƯA sửa được (CẤM chạm lib/cad, đúng luật).
- ✅ VIỆC 3: bảng đối chiếu 3 mock xong, không sửa mock, không sửa code ngoài sở hữu.
- Theo V6: phiên này KHÔNG tự commit. File đã sửa/tạo/xoá: `components/three/Scene3DViewer.tsx` ·
  `components/three/Viewport3D.tsx` · `components/three/ve3d-css.ts` · `lib/phases.ts` ·
  `components/studio/StageSwitcher.tsx` · `components/studio/AppChrome.tsx` ·
  `docs/IF1_IF2_BIGPICTURE.md` · XOÁ `components/studio/HomeButton.tsx`.
