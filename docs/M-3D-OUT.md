# M-3D-OUT — báo cáo phiên CODE mảng 3D (07/08)

Sở hữu: `lib/three/` · `components/three/` · `lib/render-core/` · `lib/render-studio/` ·
`components/render-studio/` · `app/dev-bench-3d-2/` · `app/projects/[id]/render/`

## VIỆC 1 — bảng mock chuẩn (kiểm bằng `stat`/`md5`/`grep -o title`, không đoán)

| File | size | mtime | `<title>` | Kết luận |
|---|---|---|---|---|
| `3D Dựng khối.dc.html` | 69.468B | **07/08 13:47** (mới nhất, cùng ngày brief) | `InteriorFlow · 3D Dựng khối` | **BẢN CHUẨN** — đúng brief: "Bốn nút dưới đây chuyển cùng một màn hình sang bốn thời điểm khác nhau" → `01 Không chọn gì · 02 Chọn khối · 03 Kéo mặt 2 700 · 04 Dock công cụ mở rộng`. 1 giao diện duy nhất, KHÔNG mode con (khớp chốt 07/08 "2 mode Dựng khối · Render" ở SHELL ngoài, còn màn CHỌN KHỐI này chỉ là canvas trong mode Dựng khối). Layout đích: header 42px · sidebar trái 214px (Đối tượng/layer) · canvas giữa · panel phải 236px (thông số) · statusbar 26px |
| `2D Kỹ thuật.dc.html` | 80.732B | 06/08 15:41 | `IF · 2D Kỹ thuật` | Mock CHẶNG 2D — không thuộc phạm vi phiên này (sở hữu `lib/cad`), chỉ ghi để không nhầm |
| `mock-2d-ky-thuat_cu.html` | 80.681B | 06/08 15:25 | (không có title) | Bản NHÁP TRƯỚC của `2D Kỹ thuật.dc.html` (diff 270 dòng, ra sau 16 phút) — **file cũ đã bị thay**, thuộc mảng 2D không phải mảng của phiên này |
| `mock-3d-thong-nhat.html` | 54.277B | 06/08 15:29 | `IF · Không gian 3D thống nhất — trạng thái 2 (chọn khối tường)` | Bản NHÁP SỚM của ý tưởng "1 giao diện, N trạng thái" — chỉ vẽ ĐÚNG 1 trạng thái (trạng thái 2). **Bị `3D Dựng khối.dc.html` thay thế** (bản sau làm đủ 4 trạng thái cùng khung, ra 2 ngày sau) |
| `mock-3d-frame.html` | 36.619B | 06/08 16:15 | `IF · Thiết kế 3D — khung 4 trạng thái (chọn/kéo/dock)` | Bản NHÁP KHUNG (36KB, nhẹ hơn nhiều — có vẻ là bản phác trước khi dày hoá) cho đúng ý "4 trạng thái chọn/kéo/dock" — tiền thân trực tiếp của `3D Dựng khối.dc.html`. **Bị thay thế** |
| `mock-if-ve3d.html` | 54.337B | 06/08 15:24 | `IF · 3 chặng — khung chung + Thư viện` | Cùng title với `mock-if-3chang.html` nhưng nội dung khác (diff 709 dòng, size khác) — nhánh khung 3 chặng tổng, không chuyên riêng 3D. Không phải bản chuẩn màn 3D |
| `mock-ve-3d.html` | 16.319B | 06/08 15:59 | `IF · Vẽ 3D mode — Command Panel + viewport (xem thử)` | Bản NHÁP RẤT SỚM/NHẸ (16KB) — chỉ phác Command Panel + viewport, không đủ 4 trạng thái. **Bị thay thế** bởi `3D Dựng khối.dc.html` |
| `mock-if-bang-cong-cu-3d.html` | 57.092B | 03/08 18:35 | `InteriorFlow · Bảng công cụ 3D` | Bản CŨ NHẤT (03/08) tập trung riêng bảng công cụ/dock — nguồn ý tưởng gốc cho panel dock ở trạng thái 04 của bản chuẩn. **Đã gộp vào** `3D Dựng khối.dc.html` (trạng thái 04) |
| `mock-if-ai-3d.html` | 29.997B | 06/08 15:46 | `InteriorFlow · AI dựng ảnh — Thiết kế 3D` | Mock RIÊNG cho luồng AI dựng ảnh trong chặng 3D (không phải màn Dựng khối/Command Panel) — vẫn SỐNG, phạm vi khác (nhánh render AI, không phải dựng khối tay) |
| `InteriorFlow 05 Máy quay.html` | 48.854B | **07/08 13:51** (mới nhất, sau cả bản chuẩn 4') | `InteriorFlow · Máy quay` | Mock RIÊNG cho công cụ Máy quay (camera path/lens) trong chặng 3D — vẫn SỐNG, phạm vi khác (V2.1 camera, xem `SPEC-VIDEO-MAT-BANG.md`), KHÔNG chồng lấn với "3D Dựng khối" |
| `mock-if-3chang.html` | 57.364B | 02/08 20:03 | `IF · 3 chặng — khung chung + Thư viện` | Bản CŨ NHẤT khung 3 chặng tổng — tiền thân của `mock-if-ve3d.html`. Không chuyên 3D |

**Kết luận VIỆC 1**: bản chuẩn cho VIỆC 2 (port) = **`docs/mocks/3D Dựng khối.dc.html`** — mới nhất,
đúng khớp 100% với brief "4 trạng thái ① chọn khối ② kéo mặt ③ dock mở rộng ④ không chọn gì".
Layout: `grid-template-rows:42px 1fr 26px; grid-template-columns:214px 1fr 236px` trong khung 1440×768.
Ba mock `mock-3d-thong-nhat.html` / `mock-3d-frame.html` / `mock-ve-3d.html` / `mock-if-bang-cong-cu-3d.html`
là các bản nháp tiền thân — **KHÔNG xoá** (theo lệnh), chỉ đánh dấu "đã bị thay".
`mock-if-ai-3d.html` và `InteriorFlow 05 Máy quay.html` là 2 mock SỐNG SONG SONG, phạm vi khác nhau
(AI dựng ảnh · Máy quay) — không nằm trong VIỆC 2 của phiên này.

---

## VIỆC 2 — port vỏ theo bản chuẩn

### 🔴 Đính chính brief trước khi port (LUẬT SỐ 0 — kiểm trước khi phát ngôn)
Brief ghi *"12.737 dòng động cơ nhưng chỉ 161 dòng vỏ"* (`app/dev-bench-3d-2` 137 + `app/projects/
[id]/render` 24). **Số 161 đúng cho ĐÚNG HAI FILE ĐÓ**, nhưng SAI nếu hiểu là "vỏ 3D chưa có gì" —
đã đọc code + verify browser thật (127.0.0.1:3002, "Dự án mẫu", mode Thiết kế 3D → Vẽ 3D):
- `components/render-studio/Render3DModeSkeleton.tsx` (708 dòng) là vỏ THẬT, mount qua
  `HomeScreen.tsx:662` → `AppShell`, KHÔNG qua 2 file brief chỉ ra.
- `Command3DPanel.tsx` (421d) = sidebar 6 tab (Tạo/Sửa/Vật liệu/Camera/Đèn/Bản vẽ) — **hoạt động
  thật**, verify bằng ảnh chụp (tab dock hiện đủ 6 mục).
- `Object3DTree.tsx` (207d) + `Object3DInspector.tsx` (267d) = cây "Đối tượng" theo tầng (ổ ②
  Navigator) + panel thuộc tính (ổ ④ Inspector) — **hoạt động thật**, đo DOM width=280px.
- `Viewport3D.tsx` (150d) + `ViewCube3D.tsx` (355d) = khung nhìn 3D + ViewCube thật (không phải
  ảnh tĩnh) — **hoạt động thật**.
⇒ Vỏ chặng "Vẽ 3D" **đã có ~2100 dòng thật đang chạy**, không phải 0. Điều brief đúng: layout PIXEL
chưa khớp mock (xem dưới), và **1 mảnh thật sự thiếu** — dock công cụ đáy viewport (xem VIỆC 2b).

### 2a. Delta đo được giữa vỏ hiện tại và mock chuẩn
| Vùng | Mock | Hiện tại (đo DOM thật) | Kết luận |
|---|---|---|---|
| Cột trái "Đối tượng" | 214px | **280px** (đo `getBoundingClientRect()` = 280, khớp `AppShell.tsx:92 navigatorWidth = active==='render' ? 280 : undefined` — ÁP CHO CẢ mode Node lẫn mode 3D, không phân biệt) | **GAP thật** — nhưng sửa nằm ở `components/studio/AppShell.tsx`, **NGOÀI sở hữu phiên này** (`components/studio`, không trong danh sách VIỆC giao). Không tự sửa (3 phiên song song, chạm ngoài vùng = vỡ). Ghi vào VIỆC 3 để TỔNG giao đúng phiên. |
| Cột phải "thông số" | 236px | 236px (`AppShell.tsx:37 INSPECTOR_WIDTH = 236`) | ĐÚNG khớp sẵn |
| Dock công cụ đáy viewport (trạng thái 03/04) | có, 2 trạng thái thu gọn/mở rộng | **KHÔNG có** trước phiên này — `Command3DPanel.tsx:23` tự ghi chú *"mock không có cột thứ ba kiểu tab, xem cảnh báo … phần CHƯA làm: dock công cụ nổi đáy viewport"* | **Đã bù trong phiên này** — xem 2b |

### 2b. Việc đã làm — `components/render-studio/ToolDock3D.tsx` (MỚI, 254 dòng)
Dock công cụ nổi đáy viewport, đúng 2 trạng thái mock (`dockSmall` thu gọn 1 hàng / `dockOpen` mở
rộng 6 nhóm: Chọn · Vẽ · Dựng khối · Biến đổi · Đồ đạc · Đo đạc), phím `Tab` đổi trạng thái đúng
mock. Mount vào `Render3DModeSkeleton.tsx` (đã sửa: +import, +state `dockOpen`, +JSX trước
`<ModeSwitchBar/>`), đặt `bottom:76` để không đè lên `ModeSwitchBar` (`bottom:16`, cùng trục ngang
giữa) — hai thanh xếp chồng dọc thay vì đụng nhau.

**Quyết định kỹ thuật cần Hoà biết:**
1. **KHÔNG dùng `.glass-float`** như mock (`backdrop-filter blur(22px)`) — luật **G9** trần cứng 4
   chỗ trên canvas 3D (đã dùng hết: ModeSwitchBar · nút "Dựng ảnh" · ViewCube · Lightbox), và dock
   mở rộng có >2 dòng chữ (điều G9 cấm cho kính). Dùng `.vitals-pop` (nền đặc 96%) cho CẢ 2 trạng
   thái — khác màu mock (glass) nhưng đúng luật, và tránh cộng thêm 1 tấm backdrop-filter nữa lên
   WebGL (viewport này đã có sẵn 4-6 tấm blur cùng lúc tuỳ trạng thái — xem đếm trong code comment).
2. **CẤM nút giả (đúng §9)** — mô hình "bấm công cụ rời rồi thao tác" của mock KHÔNG khớp cách
   `Viewport3D` vận hành hôm nay (chọn/kéo mặt qua gizmo bám thẳng khối đang chọn, không qua bước
   chọn tool trước). Nên trong 13 nút của dock: **CHỈ 2 nút thật** (Thư viện → `openLibrarySheet`,
   Vật liệu → chuyển tab Command3DPanel — cả hai gọi thẳng hàm ĐÃ CÓ, không tự chế), **11 nút còn
   lại `disabled` kèm lý do tại chỗ** (Vẽ đường/Hình chữ nhật/Vòng tròn/Cùng loại/Bo cạnh/Cắt khối/
   Di chuyển/Xoay/Nhân bản/Thước/Góc — không có lệnh dựng hình rời trong engine hôm nay). Nút
   "Kéo mặt" ghi rõ trong tooltip: *"Chọn khối tường rồi kéo mép trên ngay trên khung nhìn — không
   cần bấm nút này trước"* (không giấu, không giả vờ).

**Verify browser thật** (127.0.0.1:3002, server riêng phiên này, "Dự án mẫu", mode 3D "Vẽ 3D"):
`tsc --noEmit -p .` sạch cho 2 file sửa/mới (lỗi còn lại duy nhất trong repo là
`lib/cad/render-layer-index.test.ts:36`, ngoài vùng sở hữu, không liên quan) · chụp màn thấy dock
thu gọn hiện đúng 1 hàng icon + nút "Thêm" · bấm "Thêm" (qua `button.click()` vì sheet Thư viện
kẹt che mất vùng bấm chuột thật — xem GAP dưới) → dock mở đúng bố cục 6 nhóm (ảnh chụp: nhóm "DỰNG
KHỐI" Kéo mặt/P·Bo cạnh/F·Cắt khối/X + "ĐO ĐẠC" Thước/T·Góc/G + nút "Thu gọn · Tab") · 0 lỗi
console cả 2 trạng thái.

## VIỆC 4 — Hoàn tác chặng 3D (G-M2-05)

Xác nhận lại `docs/GAP-IF.md:66` còn ĐÚNG bằng grep: `grep -rln "key === 'z'" components/ lib/` ra
6 file (`FlowCanvas.tsx`·`PresentEditor.tsx`·`BoqScreen.tsx`·`CadCanvas.tsx`·`PhotoEditor.tsx`·
`SectionExtractPanel.tsx`) — **KHÔNG có `Render3DModeSkeleton.tsx`** ⇒ mode "Vẽ 3D" không bắt
⌘Z/⌘⇧Z ở đâu cả, đúng mô tả "im lặng, không báo gì" của GAP.

Đọc `lib/cad/store.ts:258-523` xác nhận `past`/`future`/`undo()`/`redo()` sống trên CHÍNH `doc` mà
`Render3DModeSkeleton.tsx` cũng đọc/ghi qua `addEntities`/`updateEntities` (K1 — một Doc chung) ⇒
**không cần cơ chế hoàn tác riêng cho 3D, chỉ thiếu người bắt phím**. Đã thêm 1 `useEffect` riêng
trong `Render3DModeSkeleton.tsx` (tách khỏi effect phím tắt có sẵn — effect đó cố ý bỏ qua mọi
phím có metaKey/ctrlKey) gọi `useCadStore.getState().undo()/redo()`, có `setStatus()` báo
"Không còn gì để hoàn tác/làm lại" khi ngăn rỗng — không để bấm xong không biết có tác dụng hay
không. `tsc --noEmit -p .` sạch (không phát sinh lỗi mới).
🟡 **CHƯA VERIFY bằng thao tác bàn phím thật** — môi trường phiên này bị chặn bởi sheet Thư viện
kẹt mở (xem GAP dưới) khiến không bấm chuột thật vào canvas được để lấy focus đúng; thử qua
`window.dispatchEvent(new KeyboardEvent(...))` cho kết quả không dứt khoát (route đổi sang
"Untitled flow" giữa chừng — nghi có listener khác ở tầng `FlowCanvas` cũng nghe `window` và ăn
phím trước, không loại trừ được trong phiên này). Logic đúng theo code (mirror chính xác pattern
đã chạy thật trong `CadCanvas.tsx:2007-2013`), nhưng **cần phiên sau bấm tay xác nhận lại** khi
sheet Thư viện đã được vá.

---

## VIỆC 3 — sổ GAP mảng 3D (đề xuất, KHÔNG tự ghi `docs/GAP-IF.md` theo §0u)

Kiểm lại quy mô bằng `wc -l`: **13.045 dòng** (không phải 12.737 brief ghi — chênh vì phiên này đã
thêm `ToolDock3D.tsx` +254 dòng VIỆC 2, số cũ trước khi sửa khớp gần đúng brief).

### 3a. Export mồ côi — 0
Quét lại đúng chỉ báo (regex trước từng sai theo §0y — lần này grep tên file, không grep
`export default function` để tránh bắt hụt named export/barrel): với MỌI file `.ts`/`.tsx` trong
4 thư mục sở hữu, `grep -rl <tên-file-không-đuôi> app components lib` trừ chính nó và trừ file
test → **0 file mồ côi**. Mảng 3D không có "code chết" kiểu N8 đã cảnh báo ở mảng khác.

### 3b. Trạng thái lỗi/chờ khi dựng ảnh chạy lâu
`components/render-studio/ToolModeForm.tsx:407,422,472,496` — **CÓ SẴN đủ 3 trạng thái** (đang
chạy/`progress` · lỗi/`status==='error'` · xong), dùng cho luồng AI dựng ảnh (Node mode, nơi nút
"Dựng ảnh" của `Render3DModeSkeleton.tsx:683-702` điều hướng tới). Dòng 472 tự ghi luật *"KHÔNG
BAO GIỜ chỉ hiện chữ đỏ rồi dừng, trừ ngoại lệ thật"* — đúng tinh thần §0e KS5. **Không phải GAP.**

### 3c. 24 file UI 0 test (không phải 27 như brief — đếm lại bằng `find` khớp file `.test.*` cùng
tên, brief có thể đếm cả `.ts` thuần lib khiến số khác)
Danh sách đủ trong `/tmp/notest_tsx.txt` phiên này (không đính kèm — file scratch). Đáng viết test
nhất theo mức rủi ro (thuần logic, không phụ thuộc canvas/DOM thật, `jsdom`/`sucrase-node` chạy
được ngay):
- `components/render-studio/scene3d-ui.ts` — **đã có test riêng?** kiểm: `find . -name
  "scene3d-ui.test.*"` = 0. Chứa `useLevelUi`/hằng số `ROOM_LIGHT_KINDS`/`ROOM_LIGHT_DEFAULT_Z_MM`
  — thuần, dễ test, đang được ăn trực tiếp vào `Render3DModeSkeleton.tsx:36`.
- `components/render-studio/doc-catalog.ts` — hàm ghi Doc thật (`writeSun`/`writeRoomLights`/
  `patchRoomLight`/`addLevelToDoc`) — **rủi ro cao nhất trong danh sách** vì ghi thẳng vào nguồn
  sự thật (K1), sai ở đây là hỏng dữ liệu người dùng, hiện 0 test.
- `components/three/material-preview.ts` — thuần (`darken`/`kindFromName`/`sceneForKind`), dễ test.
⚠️ Đây là ĐỀ XUẤT, chưa viết test nào trong phiên này (ưu tiên VIỆC 2 theo lệnh).

### 3d. G-M2-02 (2D và 3D đọc hai nửa khác nhau của cùng bức tường) — còn ĐÚNG
`docs/GAP-IF.md:63`. Không sửa trong phiên này (thuộc lõi CAD, `components/cad`/`lib/cad`, **CẤM
chạm** theo brief) — chỉ xác nhận còn tồn tại bằng đọc `lib/three/cad-to-obj.ts` (chú thích dòng
~396 do chính GAP-IF trích, N4 "mẫu tốt" — file này SUY đùn 3D từ `pattern==='SOLID'` của vùng tô,
không đọc trực tiếp entity tường 2D cùng bức tường theo `entityId` trong mọi trường hợp).

### 3e. G-M2-05 (không hoàn tác chặng 3D) — đã xử lý ở VIỆC 4 trên, còn 🟡 CHƯA VERIFY tay.

### 3f. GAP mới phát hiện phiên này (đề xuất TỔNG cân nhắc thêm vào `GAP-IF.md`)
| Đề xuất mã | Mô tả | Bằng chứng |
|---|---|---|
| (đề xuất) | `AppShell.tsx:92` ép `navigatorWidth=280` cho MỌI mode của chặng `render`, kể cả mode 3D "Dựng khối" mà mock chuẩn (`3D Dựng khối.dc.html`) định 214px cho cột "Đối tượng" — lệch +66px, đo DOM thật xác nhận (xem VIỆC 2, mục 2a). Sửa cần phân biệt theo `mode` (Node vs 3D), không chỉ theo `stage`. | `components/studio/AppShell.tsx:92` |
| (đề xuất) | Sheet "Thư viện" (`components/library`) tự mở khi vào chặng 3D và **không đóng được** — nút ✕ (`aria-label="Đóng"`), `Escape`, bấm ra ngoài đều không tắt, tái hiện cả sau restart dev server. Không sửa được (ngoài sở hữu) — chặn mọi verify browser sâu hơn trong mảng 3D ở phiên này. | verify browser 127.0.0.1:3002, `lib/library/use-library-sheet.ts` |
| (đề xuất) | `Command3DPanel.tsx:23` tự nhận dock công cụ đáy viewport CHƯA làm — **đã bù trong phiên này** (`ToolDock3D.tsx`), nên gạch dòng này khỏi backlog khi TỔNG cập nhật sổ. | `components/render-studio/ToolDock3D.tsx` (mới) |

---

🔴 **GAP môi trường bắt được lúc verify, NGOÀI vùng sở hữu (`components/library`, CẤM chạm)**:
sheet "Thư viện" tự mở khi vào `/` và **KHÔNG đóng được** bằng nút ✕ (`aria-label="Đóng"`, đã thử
click tool + click ref, cả hai đều không tắt sheet) lẫn `Escape` lẫn bấm ra ngoài — tái hiện lại
được cả sau khi khởi động lại dev server (`sessionStorage['if:open-library-on-load']` xoá tay cũng
không hết). Không sửa (ngoài sở hữu) — ghi vào VIỆC 3 để TỔNG giao đúng phiên `components/library`.

---
