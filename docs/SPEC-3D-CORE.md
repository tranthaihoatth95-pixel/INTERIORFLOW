# SPEC — HẠ TẦNG 3D LÕI *(khối thô + camera 3D — một nền, bốn người dùng)*

> Hoà yêu cầu 01/08: *"làm hạ tầng trước cho IF2, support thuật toán cho IF1"*.
> Đúng ràng buộc `RANG-BUOC-IF2-CHO-IF1.md` mục "Cầu 3D": **làm một lần cho CẢ BỐN dùng**,
> không nhét riêng vào tính năng nào.
>
> **Trạng thái nền — khám 01/08:** 🔍 `lib/three/cad-to-obj.ts` `docToObjScene()` ĐÃ CHẠY:
> tường poché → extrude (cao 2700 chỉnh được) · sàn dò TỪNG PHÒNG (`findHatchBoundary`) · nội
> thất proxy box đúng footprint + cao theo loại (`furnitureHeightMm`) · OBJ+MTL 3 theme · thuần
> TS có test. 🔍 `camera.ts`: `CameraSpec` · `placeCamera` · `fovFromLens` · preset ống kính/khổ.
> 🧮 `three` CHƯA có trong `package.json` — hiện chỉ xuất file, chưa xem được trong app.

---

## 0 · Bốn NƠI TIÊU THỤ của một nền *(sửa chữ 01/08 — "người dùng" gây hiểu lầm)*

| Nơi trong sản phẩm | Cần gì | Khi nào |
|---|---|---|
| **Video bậc 2-b** (khối 3D thô, cam đi xuyên) | xem + phát đường cam + xuất khung hình | đợt 1 |
| **Đổi góc phối cảnh** (§6B pha 4 — moat) | dựng góc mới → **depth map** nuôi ControlNet | đợt sau |
| **Chế độ Công trường — cắt lớp** (tablet) | mặt phẳng cắt tương tác | mã lộ trình IF2 |
| **D5/Blender handoff** | OBJ+MTL | ✅ đã có, giữ nguyên |

⭐ **ĐÍCH DÀI HẠN (Hoà chốt 01/08, `CHOT-HUONG-3D-2026-08-01.md`):** IF hai TẦNG — hạ tầng này
là **B1 của tầng SƠ PHÁC (IF1)**; tầng KỸ THUẬT (IF2: cấu kiện ngữ nghĩa 3D, nhận/xuất IFC — chạy
bằng Pro mode, không hệ phân quyền mới) sẽ đứng trên cùng viewer/API này — nên thiết kế để NỞ được, không ngõ cụt.

## 1 · Kiến trúc — ba tầng, tầng dưới không biết tầng trên

```
A · DỮ LIỆU  docToObjScene(doc) ─────────── ✅ ĐÃ CÓ — thuần TS, không DOM, GIỮ NGUYÊN
                    ↓
B · TRÌNH CHIẾU  Scene3DViewer (MỘT component duy nhất, three.js)
     4 chế độ: quan sát (orbit) · đi bộ (mắt 1650mm) · phát đường cam · cắt lớp
                    ↓
C · CHỤP  captureFrame() offscreen → PNG khung hình · depth map · lineart
     (video 2-b ăn PNG · Đổi góc ăn depth · không hiện UI)
```

**Luật tầng:** A không import gì của B/C (giữ test sucrase-node). B là component DUY NHẤT —
video, đổi góc, IF2 đều nhúng nó với `mode` khác nhau, cấm mỗi nơi tự dựng viewer riêng.

## 2 · Quyết định kỹ thuật (Cowork duyệt theo uỷ quyền — rủi ro nêu đủ)

| # | Chốt | Lý do · rủi ro |
|---|---|---|
| 1 | **Dùng `three` (npm), pin version** | Đúng luật *"đừng tự viết engine"* (`SPEC-EDITOR-TOOLKIT` §4). ⚠️ Rủi ro: +~170KB gzip vào bundle — chấp nhận được vì Electron local; **dynamic import**, chỉ tải khi mở 3D |
| 2 | Adapter `ObjScene → BufferGeometry` viết TAY (không parse OBJ text ngược) | ObjScene đã có mảng đỉnh; parse text là đi vòng. OBJ text chỉ dành cho handoff ra ngoài |
| 3 | **Xám trơn, không PBR** — đúng chốt video 2-b: *"tường xám sàn xám, không vật liệu, không đèn, không bóng đổ"* | Chống trượt thành engine. Theme MTL chỉ dành cho file XUẤT |
| 4 | Camera: tái dùng `CameraSpec` NGUYÊN VẸN — viewer chỉ thêm trạng thái orbit | Một ngôn ngữ camera cho cả 2D lẫn 3D. Đường cam ăn thẳng output `campath.ts` (V2 đang làm) |
| 5 | Cắt lớp = `clippingPlanes` có sẵn của three | 0 thuật toán tự viết |
| 6 | Depth cho AI = render target với depth material | linh kiện chuẩn three, nuôi thẳng `ai.render` ControlNet depth |

## 3 · API — hợp đồng cho mọi phiên code

```ts
// B · components/three/Scene3DViewer.tsx  (client-only, dynamic import three)
<Scene3DViewer
  scene={objScene}                       // từ docToObjScene — KHÔNG nhận Doc thô
  mode="orbit" | "walk" | "campath" | "section"
  camPath?: SampledCamPath               // output campath.ts (V2)
  sectionMm?: { axis: 'x'|'y'|'z'; at: number }
  onFrame?: (t: number) => void          // đồng bộ UI ngoài (thanh tua)
/>

// C · lib/three/capture.ts (thuần logic + offscreen canvas)
captureFrame(scene, spec: CameraSpec, out: { kind: 'png'|'depth'|'lineart'; w: number; h: number })
captureSequence(scene, path: SampledCamPath, fps: number, out) // → khung hình video 2-b
```

Hai chữ ký này là **hợp đồng** — đổi phải qua duyệt, vì bốn người dùng cùng gọi.

## 4 · Thứ tự thi công

| Đợt | Việc | Mở khoá |
|---|---|---|
| **3D-1** | cài `three` + adapter + `Scene3DViewer` mode `orbit` | lần đầu XEM khối trong app |
| **3D-2** | mode `campath` + `captureSequence` | **video bậc 2-b** trọn vẹn |
| **3D-3** | `captureFrame` depth/lineart | tool **Đổi góc phối cảnh** (§6B pha 4) |
| **3D-4** | mode `section` + `walk` | nền cắt lớp **chế độ Công trường** — làm CUỐI, không gấp |
| **3D-5** | **push-pull massing** (đẩy/kéo khối trên nền extrude, SketchUp-level) | bậc B1 của thang BIM (`CHOT-HUONG-3D`) — mở tầng VẼ 3D |
| **3D-6** | **import glTF/OBJ** làn phụ (đồ rời, khối ngoài — đặt vào scene, không chỉnh sâu) | studio mang kho model Max/Blender vào được |

3D-1 chờ **V2 xong** (cùng vùng `lib/three/`, tránh giẫm chân code chính). 3D-5/3D-6 sau khi
3D-1→3 chứng minh viewer sống tốt.

## 5 · Support thuật toán IF1 — quà kèm theo

Scene 3D là nguồn truy vấn hình học cho thuật toán 2D đang cần:
- **Đồ thị zone-door** (video bậc 4): kiểm "cửa nằm trên biên 2 phòng" bằng hình học sàn-từng-phòng
  đã dò sẵn trong `docToObjScene` — khỏi dò lại.
- **Metrology**: khối 3D cho điểm neo kiểm chéo tầm mắt máy ảnh 1500–1600 (`single-view-metrology`).
- **Va chạm nội thất** (§8 SEMANTIC-MODEL, validator SAT): proxy box 3D = dữ liệu kiểm chồng lấn
  có chiều cao (ghế chui gầm bàn được — 2D thuần sẽ báo sai là "chồng").

## 6 · KHÔNG làm — chống trượt engine

PBR/vật liệu thật · đèn/bóng đổ · physics · LOD phức tạp · import OBJ/GLB ngoài vào viewer ·
mọi thứ "cho đẹp". Đẹp là việc của D5 (bậc 5) — IF chỉ cần **đúng hình học**.

💭 Chưa kiểm: FPS viewer với mặt bằng ~2000 entity extrude (ước ~50–80k tam giác — nhẹ với
three, nhưng PHẢI đo ở 3D-1 trước khi hứa; nếu chậm: merge geometry theo layer, đúng bài batching
phần C).

---

*Cowork soạn 01/08/2026 theo yêu cầu Hoà "làm hạ tầng trước cho IF2". Nối: `RANG-BUOC-IF2-CHO-IF1`
(cầu 3D) · `SPEC-VIDEO-MAT-BANG` §2 (bậc 2-b) · `SPEC-RENDER-STUDIO` §6B (Đổi góc) · V2 campath.*
