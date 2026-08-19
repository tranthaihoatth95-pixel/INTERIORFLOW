# GOTO-3D — ReviewPanel nhảy-tới-đối-tượng cho chặng 3D (19/08)

## ① Tiền đề
`git log --oneline -1` = `c7f3ac8` (main) lúc bắt đầu, đúng ⓪b. `ReviewPanel.tsx` đang dirty vì
phiên khác (R7, mount slides deck) — đã đọc kỹ, KHÔNG đụng hunk deck, chỉ thêm nhánh mới bên cạnh.

Xác nhận tiền đề của phiếu: 2D có `select()` + `cad:goto-box` (`CadCanvas.tsx` nghe). Deck có
`present:goto-slide` (R7, `PresentEditor.tsx:181` nghe — LIVE). 3D **KHÔNG có** cơ chế tương
đương trong `ReviewPanel` — code cũ đi qua nhánh dùng chung với 2D (`useCadStore` + `cad:goto-box`)
dù `chang === '3d'`, mà 3D không ai nghe sự kiện đó ⇒ bấm 1 finding 3D trước bản vá **không làm
gì cả**. `focusEntity` URL param (`Render3DModeSkeleton.tsx:145-167`) là đường khác (đổi URL lúc
mở link từ Task), không phải "bấm trong panel đang mở".

## ② Đã tìm hiểu — có primitive để REUSE hay phải REFUSE?
Đo trước khi quyết định:
- `Scene3DCameraApi.fit()` (`Scene3DViewer.tsx`) **ĐÃ CÓ** — nhưng chỉ fit theo TOÀN group
  (`fitTargetRef.group`), không nhận entity nào.
- `fitCameraToScene()` nội bộ **ĐÃ hỗ trợ sẵn** một object `THREE.Object3D` tuỳ ý (nhánh
  `Box3().setFromObject(object)`) — chỉ chưa có ai gọi nó với 1 object riêng lẻ.
- Vấn đề thật: ở render tĩnh (không phải mode `massing`), `buildMergedGeometries()` GỘP mesh
  theo MÀU, không theo entity ⇒ **không có mesh 1-1 với `entityId`** trong THREE scene để tìm.
- Nhưng **dữ liệu nguồn vẫn có**: mỗi `SceneGroup` (trong `scene.groups`, từ `docToObjScene()`)
  giữ nguyên `positions: number[]` (toạ độ THREE thật, dùng để dựng mesh) VÀ `entityId` — kể cả
  sau khi đã gộp mesh. ⇒ tính `Box3` thẳng từ mảng đó, không cần mesh riêng.

Kết luận: đây **là** REUSE/EXTEND — primitive khung-camera-quanh-1-box đã có sẵn (`frameBox`,
tách ra từ logic đang nằm trong `fitCameraToScene`), chỉ thiếu đường lấy box của MỘT entity. Đủ
điều kiện làm theo phiếu, không REFUSE.

## ③ Việc đã làm (additive, đúng SCOPE)
1. `components/three/Scene3DViewer.tsx`
   - Tách logic tính khung camera từ box ra hàm `frameBox(camera, controls, box)` (y nguyên công
     thức cũ 03/08, không đổi số) — `fitCameraToScene` gọi lại hàm này ở nhánh có `object`.
   - `Scene3DCameraApi.fit` đổi chữ ký `() => void` → `(entityId?: string) => void` (tương thích
     ngược — mọi nơi gọi `fit()` không truyền gì vẫn chạy y cũ).
   - Bên trong effect mount, implement `fit`: có `entityId` → tìm `SceneGroup` khớp trong
     `scene.groups`, dựng `Box3().setFromArray(g.positions)`, gọi `frameBox`. Không thấy/rỗng →
     rơi xuống nhánh cũ (fit toàn `fitTargetRef.group`) — không bịa vị trí.
2. `components/three/Viewport3D.tsx`
   - Thêm `useEffect` nghe `window` sự kiện `render:goto-entity` (detail `{entityId}`) — tìm
     `SceneGroup` theo `entityId`, `useTree3DUi.getState().select(g.name)` (guard toggle y hệt
     nhánh `focusEntity` URL cũ, tránh bấm lại cùng finding thì lại BỎ chọn), rồi
     `cameraApiRef.current?.fit(id)`.
3. `components/review/ReviewPanel.tsx`
   - `nhayToi()`: thêm nhánh `chang === '3d'` dispatch `render:goto-entity` với `entityId` từ
     `f.viTri?.entityId`, return sớm (không rơi vào nhánh CadStore/`cad:goto-box` cũ — nhánh đó
     giờ CHỈ còn chạy cho `chang === '2d'`).
   - Sửa docstring lỗi thời (dòng 37-39 cũ): không còn nói "deck CHƯA nhảy được" (R7 đã giải) —
     viết lại thành bảng 3 mặt tiền (2D/3D/deck), mỗi chặng một sự kiện.

## ④ Không đụng
- `PresentEditor.tsx`, `lib/review/hien-thi-luat.ts`, `lib/cad/store.ts` — không sửa dòng nào.
- Hunk deck (R7) trong `ReviewPanel.tsx` giữ nguyên, chỉ thêm nhánh `3d` bên cạnh nhánh `deck`.
- `grep -c "goto-slide" components/review/ReviewPanel.tsx` = **2** (giữ nguyên số cũ).

## ⑤ Nghiệm thu
- `npm run tsc` — pass (0 lỗi).
- Test targeted (chạy đúng runner của repo, `sucrase-node`, không phải `vitest run` — file này
  không dùng `describe/it` của vitest):
  - `lib/three/obj-scene-to-geometry.test.ts` — 10 pass, 0 fail.
  - `lib/review/luat/rules-3d.test.ts` — 27 pass, 0 fail.
  - `lib/review/hien-thi-luat.test.ts` — 61 pass, 0 fail (bao gồm case `[16]` "có entityId ⇒ có
    nút Tới chỗ này" — vẫn đúng, không đổi hành vi dựng thẻ).
- BROWSER-PENDING (chưa mở app thật — phiếu không có dev server sẵn cho lane này):
  kịch bản cần verify bằng mắt: mở chặng 3D có ít nhất 1 vi phạm 3D (vd đèn thiếu độ rọi hoặc
  khối hở, `rules-3d.ts`) → mở `ReviewPanel` (PanelFlank phải bấm mở, mặc định thu) → bấm nút
  "Tới chỗ này" trên 1 finding → kỳ vọng: khối tương ứng được chọn trong `Object3DTree`/Inspector
  (viền/`selectedName` đổi) VÀ camera 3D di chuyển framing quanh đúng khối đó (không phải toàn
  cảnh, không phải đứng yên).

## ⑥ Rủi ro / giới hạn đã biết
- `frameBox`/`fit(entityId)` chỉ hoạt động khi `SceneGroup` có `positions.length > 0` — vài loại
  entity (vd `Room_i`, `Floor` — xem `cad-to-obj.ts:613-623`) KHÔNG gán `entityId` nên finding
  trỏ vào chúng (nếu có) sẽ rơi về nhánh toàn-cảnh, không phải lỗi mới do bản vá này gây ra —
  đúng hành vi "không tìm thấy thì rơi về toàn cảnh, không bịa" đã khai trong code.
- Chưa kiểm bằng mắt goc camera cuối cùng (hệ số `1.1/0.9/1.1` trong `frameBox`) có "đẹp" với
  vật nhỏ (vd một cái đèn — `RoomLight`, không phải `SceneGroup`, KHÔNG có `positions` ⇒ hiện tại
  finding của đèn (`viTri.entityId = light.id`, `rules-3d.ts:104,113`) sẽ KHÔNG tìm thấy group
  khớp và rơi về toàn cảnh — đèn không phải mesh dựng hình, đúng bản chất dữ liệu, không phải bug
  của phiếu này, nhưng đáng ghi lại vì đó là 2/4 loại finding 3D có `entityId`).

## ⑦b Chưa chắc / chưa kiểm
- Chưa chạy app thật trên trình duyệt — mọi kết luận về hành vi camera dựa trên đọc code +
  test đơn vị của `frameBox`/`fitCameraToScene` (vốn đã có test gián tiếp qua
  `obj-scene-to-geometry.test.ts`, không phải test camera trực tiếp — repo chưa có test nào
  dựng `THREE.PerspectiveCamera`/`OrbitControls` thật, kể cả trước bản vá này).
- Chưa xác minh `RoomLight` finding (loại đèn thiếu độ rọi) có ID nào khớp được với `scene.groups`
  hay không — phân tích ở trên dựa vào đọc `cad-to-obj.ts`, chưa chạy thử với dữ liệu đèn thật.

## ⑦c Hạn dùng kết luận
Kết luận về `buildMergedGeometries` gộp theo màu (không theo entity) đo tại `c7f3ac8`. Nếu tầng
`lib/three/obj-scene-to-geometry.ts` đổi cách gộp (vd thêm mesh riêng theo entity) thì đường
`frameBox`-từ-`positions` trong `fit()` vẫn đúng (nó không phụ thuộc cách gộp mesh, chỉ đọc
`SceneGroup.positions` gốc) — nhưng phần "không có mesh 1-1" ở mục ② sẽ hết đúng, nên nếu sau
này có aixây per-entity mesh, có thể đơn giản hoá lại bằng `Box3().setFromObject(mesh)`.
