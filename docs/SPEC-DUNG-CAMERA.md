# SPEC — ĐẶT CAMERA + UI ĐƯỜNG CAM TRÊN VIEWPORT 3D (chặng 2 · mode Vẽ 3D)

> **COWORK-DỰNG · 04/08/2026.** Kế thừa `docs/nc/NC-camera-campath-2026-08-02.md` (NC-1, ĐÃ VỀ) +
> `SPEC-VIDEO-MAT-BANG.md` §2 + `lib/cad/campath.ts` (đã đọc field thật, không bịa). Phạm vi: tab
> "Camera" của `Command3DPanel` + overlay trên `Viewport3D` (chặng 2 mode Vẽ 3D) — **KHÔNG** đụng
> panel campath 2D đã có ở chặng 1 CAD (`CamPathPanel.tsx`), **KHÔNG** đụng việc dựng phim/edit ở
> chặng 3 Present (`CHOT-VIDEO-2-TANG`: dựng phim = việc COWORK-TRÌNH).

---

## §0 · XÁC MINH HIỆN TRẠNG — sửa 1 thông tin lỗi thời + xác nhận khoảng trống thật

### 0.1 · `00-CHOT.md` dòng "Gap: CamPathPreview+CamPathControlPanel CHƯA wire" ĐÃ LỖI THỜI
Đọc code thật (04/08): `components/cad/CamPathPanel.tsx` **đã nối** `CamPathPreview` + `CamPathControlPanel`
lại với nhau, giữ state (tốc độ/ống kính/tỉ lệ khung/lookAt/zone), và **đã mount thật** vào
`components/cad/CadEditor.tsx:71` (import) + `:530-532` (render có điều kiện: hiện khi tool =
`'campath'` hoặc Doc đã có entity `campath`). Đây là preview **2D mặt bằng** (bậc 2-a,
`SPEC-VIDEO-MAT-BANG.md` §2.3) ở **chặng 1 CAD**, dạng **panel nổi** (`position:absolute`).
→ Đề xuất TỔNG sửa 1 dòng trong `00-CHOT.md` mục "CÂU HỎI ĐANG ĐỂ NGỎ" (dòng nói CamPathPreview
chưa wire) để phiên sau khỏi tưởng vẫn còn treo — đúng luật §0 (báo đúng sự thật kể cả khi tin đó
là "hoá ra đã xong").

**Việc của spec này KHÁC**: chặng 2 (Dựng), overlay **TRÊN viewport 3D**, không phải panel nổi —
đúng yêu cầu gốc "không phải panel rời".

### 0.2 · Hạ tầng 3D đã có SẴN — chỉ thiếu dây nối cuối
| Mảnh đã có | File:dòng | Trạng thái |
|---|---|---|
| `planCamPath()` — polyline → mẫu {điểm, hướng, thời điểm} | `lib/cad/campath.ts:224` | ✅ xong, có test |
| `Scene3DViewer` mode `'campath'` — camera bám `CamPathResult` mỗi khung, loop | `components/three/Scene3DViewer.tsx:9-11,296-302` | ✅ xong, đang **không được cấp `camPath` prop** từ nơi gọi hôm nay |
| `camPathSampleToThree()` + `EYE_HEIGHT_MM=1650` | `lib/three/capture.ts:44,81-87` | ✅ xong — hằng số CỨNG, chưa tham số hoá |
| `captureSequence()` — xuất PNG từng khung, streaming + `AbortSignal` | `lib/three/capture.ts:276-305` | ✅ code xong, có test (`capture.test.ts`) — **CHƯA có UI thật gọi nó**, chỉ chạy ở `app/dev-bench-3d-2/page.tsx` (dev bench UNTRACKED — `SO-KIEM-TONG.md` §3 mục CHINH việc 2 đang chờ xử lý xoá/commit) |
| Tab "Camera" trong `Command3DPanel` (sidebar 5 tab kiểu 3ds Max) | `components/render-studio/Command3DPanel.tsx:45,196` | ⬜ **PLACEHOLDER tường minh**: `"Đặt camera · đường cam (campath) — sắp có."` — ĐÚNG CHỖ TRỐNG cần lấp |
| Bước 3/3 "Đặt máy quay" trong Trình tự mở màn Vẽ 3D | `components/render-studio/Render3DModeSkeleton.tsx:114,159` | ✅ đã tính sẵn điều kiện xong (`doc.entities.some(e => e.layer==='IF_CAMPATH' \|\| e.campath)`) — hạ tầng ĐÃ NGHĨ TỚI việc này, chỉ chưa có UI thao tác |
| `Viewport3D` mount với `mode` HARD-CODE `"massing"` | `Render3DModeSkeleton.tsx:175` | ⬜ chưa có đường đổi sang `'campath'` |

**Kết luận:** việc thật không phải "xây from scratch" mà là **NỐI 5 mảnh đã có** (bảng trên) +
thêm đúng 3 khả năng mới (mini-map top-view lồng trong viewport, nút Xuất video nối `captureSequence`,
tầm mắt chọn được). Không viết lại `planCamPath`/`Scene3DViewer`/`capture.ts`.

---

## §1 · NGUYÊN TẮC — theo NC-1 (D5/Lumion/Twinmotion) + luật sẵn có

1. **Giữ path-first + độ cao khoá mặc định 1650mm — đây là MOAT, không phải thiếu tính năng.**
   NC-1 §2 dẫn nguyên văn thread D5 forum: *"automatic interpolation... camera diving below ground
   level, crashing into objects... completely unusable"*, và giải pháp CHÍNH HÃNG D5 đưa ra là
   *"set only two keyframes for a clip"* — tức tự tay né thuật toán 6DOF tự do của chính họ. IF đã
   chọn kiến trúc path-first (polyline mặt bằng, không có keyframe 6DOF) — **spec này KHÔNG được
   đề xuất thêm keyframe tự do**, chỉ làm giàu UI quanh path-first.
2. **1 nguồn dữ liệu — campath entity CHUNG giữa chặng 1 và chặng 2** (cùng `useCadStore().doc`,
   layer hệ thống `IF_CAMPATH`, `SPEC-VIDEO-MAT-BANG.md` §2.1). Chặng 2 KHÔNG giữ bản campath
   riêng — đúng luật một nguồn đã áp cho `heightMm`/vật liệu (`Render3DModeSkeleton.tsx:18` comment
   "Nguồn dữ liệu vẫn là Doc chặng 1").
3. **Vẽ/thêm điểm mới vẫn qua công cụ "Đường cam" của chặng 1 CAD** (đã có, phím `CAM`, layer
   `IF_CAMPATH`) — chặng 2 **KHÔNG** làm lại việc vẽ polyline trên mặt bằng. Chặng 2 làm phần
   sau: chọn đường, chỉnh tham số, xem trước 3D, xuất khung hình.
4. **Hai con số dễ lẫn** (nhắc đúng `00-CHOT.md`): đường cam video dùng tầm mắt **NGƯỜI ~1650mm**,
   KHÔNG lẫn với metrology camera **1500–1600mm** (`lib/vision/single-view-metrology.ts`). Spec
   này chỉ đụng số 1650.

---

## §2 · VỊ TRÍ UI — "trên viewport", không phải panel rời

### 2.1 · Tab "Camera" (Command3DPanel, sidebar trái) = nơi giữ THAM SỐ
Lấp đúng placeholder ở `Command3DPanel.tsx:196`. **Tái dùng NGUYÊN VĂN các field** của
`CamPathControlPanel.tsx` (Điểm ngắm 3 mode · Tốc độ đi · Ống kính · Tỉ lệ khung) — đổi **NƠI
MOUNT**: bỏ khung `panel`/`segmentWrap` riêng của nó (dòng 22-42, dựng cho ngữ cảnh panel nổi),
dùng khung sidebar đã chuẩn của `Command3DPanel` (giống cách `MaterialTab` đang làm, `Command3DPanel.tsx:127-191`).
**KHÔNG viết lại UI field** — props `CamPathControlPanelProps` (`CamPathControlPanel.tsx:70-85`)
giữ nguyên, chỉ đổi cha bọc ngoài.

Chọn đường cam đang xem: **tái dùng đúng thuật toán ưu tiên** đã có ở `CamPathPanel.tsx:85-92`
(đường ĐANG chọn nếu có cờ `campath` → không thì đường **vẽ gần nhất** trong Doc) — port logic
này sang tab Camera, đừng viết lại.

**Trạng thái RỖNG**: Doc chưa có entity `campath` nào → tab Camera hiện dòng chỉ dẫn kiểu
`SPEC-NGON-NGU-CHI-DAN` (luôn có nút): *"Chưa có đường cam — vẽ ở chặng Vẽ (phím CAM) hoặc bấm để
mở CAD"* + 1 nút điều hướng sang chặng 1 với tool `campath` đã chọn sẵn (không bắt người dùng tự
tìm công cụ).

### 2.2 · Overlay TRÊN Viewport3D — theo đúng pattern đã có (ViewCube/trục/gizmo)
`Viewport3D.tsx:93-155` đã có 3 lớp phủ tuyệt đối trên `Scene3DViewer` (ViewCube góc trên-phải,
trục toạ độ góc dưới-trái, gizmo di chuyển giữa khung) + slot `children` cho lớp phủ riêng của nơi
mount (`Render3DModeSkeleton.tsx` đang dùng `children` cho card chào + Trình tự 3 bước). **Overlay
campath đi cùng đường này — qua `children`, KHÔNG sửa `Viewport3D.tsx` cấu trúc lõi.**

Bố cục đề xuất (tránh đè lên Trình tự 3 bước đang neo `left:12, bottom:156`,
`Render3DModeSkeleton.tsx:276`):

| Thành phần | Vị trí | Nội dung |
|---|---|---|
| Mini-map top-view | góc **dưới-phải**, ~200×160px, bo góc theo token, nền kính nhẹ | **tái dùng `CamPathPreview`** thu nhỏ làm nội dung — không viết renderer top-view thứ 2 |
| Thanh scrub | ngay dưới mini-map | kéo để xem trước 1 điểm bất kỳ trên đường (chấm mini-map + camera 3D cùng nhảy tới điểm đó) |
| Nút "▶ Xem trước" / "⏸ Dừng" | trong khối mini-map, góc trên | đổi `Viewport3D`'s `mode` giữa `'massing'` (hiện tại) và `'campath'` tạm thời |
| Nút "Xuất video" | cạnh nút Xem trước, hoặc trong tab Camera | trigger `captureSequence()` thật — xem §2.4 |

**Hiệu năng mini-map**: `CamPathPreview` gốc render TĨNH toàn bộ mặt bằng (`renderStaticPlan`,
`CamPathPreview.tsx:199-210`) — ở kích thước mini-map (~200px) nét nhỏ có thể rối; đề xuất PHU cân
nhắc truyền `className`/viewBox thu gọn trước, chỉ viết bản rút gọn riêng nếu đo thật thấy cần
(đừng tối ưu sớm khi chưa đo).

### 2.3 · "Xem trước" — đổi mode, không xây camera thứ 2
Bấm "▶ Xem trước": `Render3DModeSkeleton.tsx` đổi `mode` truyền cho `<Viewport3D>` từ `"massing"`
sang `"campath"` + truyền `camPath={planCamPath(points, opts)}` (tính từ đường đang chọn + tham số
tab Camera). `Scene3DViewer` đã tự chạy loop camera bám path khi `mode==='campath'`
(`Scene3DViewer.tsx:296-302`) — **không cần code camera mới**, chỉ cần cấp đúng prop.
⚠️ Lưu ý side-effect đã có trong `Scene3DViewer`: mode `'campath'` tắt `OrbitControls`
(`controls.enabled = !walkActive && !campathActive`, dòng 155) và tắt push-pull massing
(`massingActive = mode==='massing'` → false) — đúng ý muốn (xem trước = camera tự lái, không cho
kéo tường giữa lúc preview), nhưng phải test 2 chiều: bấm "⏸ Dừng" phải trả lại **đúng mode + đúng
khả năng tương tác trước đó** (không mất push-pull nếu người dùng đang ở giữa việc dựng khối).

### 2.4 · "Xuất video" — nối `captureSequence()` thật vào UI (khoảng trống thật lớn nhất)
`captureSequence()` (`lib/three/capture.ts:276-305`) đã nhận `onFrame` (stream, không giữ RAM) +
`signal: AbortSignal` (huỷ giữa chừng) — chỉ thiếu UI gọi nó ngoài dev-bench. Spec hành vi:
1. Bấm "Xuất video" → modal/inline progress: `frameCount` dự kiến = `round(totalDurationSec × fps)`
   (`planCaptureSequenceFrames`, đã có).
2. Progress bar cập nhật theo `onFrame` callback (đã trả `index`/`tSec` mỗi khung).
3. Nút "Huỷ" gọi `AbortController.abort()` → `captureSequence` tự dừng ở ranh giới khung kế tiếp
   (đã cài sẵn, không cắt giữa 1 khung đang render).
4. Kết quả hôm nay là **chuỗi PNG data-URL** (không phải .mp4) — ⚠️ **CHƯA làm**: ghép chuỗi PNG
   thành .mp4 (cần ffmpeg hoặc thư viện encode phía client/Electron — đúng rủi ro #4 đã nêu ở
   `SPEC-VIDEO-MAT-BANG.md` §6: "Xuất `.mp4` trong Electron cần ffmpeg. Đo dung lượng bản cài
   TRƯỚC khi hứa tính năng"). Spec này CHỈ yêu cầu nối UI → nhận đủ chuỗi PNG + hiện được (vd
   scrub qua từng khung như phim tay) — việc encode .mp4 thật là phiếu riêng, không bịa thêm ở đây.

---

## §3 · TẦM MẮT (eye height) CHỌN ĐƯỢC — theo NC-1 đề mục 2

**Hiện trạng**: `EYE_HEIGHT_MM = 1650` là **hằng số cứng** (`lib/three/capture.ts:44`), dùng ở CẢ
mode `campath` LẪN mode `walk` trong `Scene3DViewer.tsx` (dòng 146,311 cho walk; dòng 300 gọi
`camPathSampleToThree` không tham số cho campath).

**Đề xuất field chính xác — additive, KHÔNG đổi `CamPathResult`/`CamPathSample`:**
```ts
// lib/three/capture.ts — thêm tham số optional, mặc định GIỮ NGUYÊN hành vi cũ
export function camPathSampleToThree(
  sample: CamPathSample,
  eyeHeightMm: number = EYE_HEIGHT_MM,
): { position: THREE.Vector3; target: THREE.Vector3 } { /* dùng eyeHeightMm thay hằng số trong thân hàm */ }
```
Lý do an toàn: `CamPathSample.point` vốn đã 2D thuần (`{x,y}` mm mặt bằng) — comment gốc
`campath.ts` ghi rõ "campath.ts KHÔNG import ZoneEntity/model.ts để giữ tầng thuần tất định gọn"
— tầm mắt (trục Z) CHƯA BAO GIỜ là 1 phần của `CamPathResult`, nó chỉ được áp ở bước chuyển sang
3D (`camPathSampleToThree`). Tham số hoá ở ĐÚNG một hàm này là đủ, không chạm `campath.ts`.

`Scene3DViewer` thêm prop optional `eyeHeightMm?: number` (mặc định `EYE_HEIGHT_MM`), truyền
xuống lệnh gọi `camPathSampleToThree` ở dòng 300 khi mode campath. **Mode `walk` GIỮ CỐ ĐỊNH
1650mm, KHÔNG đổi** — đúng nghĩa "người đi bộ chuẩn", ngoài phạm vi spec này (tránh lấn việc, đúng
luật "chỉ sửa trong mảng").

**3 mức đặt sẵn** (COWORK-DỰNG chốt theo đúng yêu cầu NC-1 mục 2 — số cụ thể):

| Mức | Giá trị | Dùng khi |
|---|---|---|
| Đứng (mặc định) | **1650mm** | walkthrough thường, giữ nguyên số đã chốt toàn hệ |
| Ngồi | **1200mm** | góc quay từ sofa/ghế — hay dùng cho video phòng khách/phòng chờ |
| Thấp | **900mm** | góc thấp khoe sàn/thảm/vật liệu, hoặc mô phỏng tầm mắt trẻ em |

UI: segmented-control 3 nút trong tab Camera, cạnh field Tốc độ đi (cùng khuôn `SegBtn` đã có ở
`CamPathControlPanel.tsx:44-63` — tái dùng component, không vẽ nút mới).

---

## §4 · EASING + FADE — theo NC-1 mục 3 + 7 (ghi rõ phạm vi, tránh lấn)

- **Easing 5 kiểu** (Linear · Ease in · Ease out · Ease in-out · Speed in-out, học D5): đây là
  **MỞ RỘNG v1.1**, KHÔNG bắt buộc để lấp xong tab Camera. Hiện trạng `planCamPath()` chỉ có tốc độ
  ĐỀU tuyệt đối theo chiều dài (`sampleByLength`, không có khái niệm easing) — muốn thêm cần field
  mới `CamPathOptions.easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'speedInOut'` áp
  **toàn đường** (không phải per-segment — giữ đúng luật `SPEC-VIDEO-MAT-BANG.md` §0.4 "không làm
  NLE"). v1 chỉ cần 1 dòng "Tốc độ đều" (đang có, mặc định) — đủ để chốt bước "Đặt máy quay".
- **Fade to black/white giữa 2 shot**: **NGOÀI PHẠM VI chặng 2**. `CHOT-VIDEO-2-TANG-2026-08-02.md`
  chốt rõ: "① Sinh phim ở IF2 chặng 2... ② Dựng = chặng 3 Present, chỉ edit CapCut". Fade thuộc
  bước dựng (②) — việc của COWORK-TRÌNH (`SPEC-TRINH-VIDEO-EDITOR.md`), **không đưa vào spec này**.

---

## §5 · BẢNG FIELD/KIỂU DỮ LIỆU — cho PHU/G4 code thẳng

| Thay đổi | File | Loại |
|---|---|---|
| Nội dung thật cho tab `camera` (thay `PlaceholderTab`) | `components/render-studio/Command3DPanel.tsx` | sửa additive (case mới trong nhánh `tab === 'camera'`) |
| Mount `CamPathControlPanel` field trong tab Camera (bỏ khung `panel` riêng) | `components/render-studio/Command3DPanel.tsx` (import từ `components/cad/CamPathControlPanel.tsx`) | tái dùng component có sẵn |
| Mini-map = `CamPathPreview` thu nhỏ, overlay qua `children` của `Viewport3D` | `Render3DModeSkeleton.tsx` (nơi mount), tái dùng `components/cad/CamPathPreview.tsx` | tái dùng + wiring mới |
| `mode`/`camPath` prop động thay vì hard-code `"massing"` | `Render3DModeSkeleton.tsx:175` | sửa |
| `eyeHeightMm?: number` param | `lib/three/capture.ts` (`camPathSampleToThree`), `components/three/Scene3DViewer.tsx` (prop mới) | sửa additive |
| Nút "Xuất video" gọi `captureSequence()` + progress + Huỷ | component mới trong `components/render-studio/` (hoặc trong tab Camera), gọi `lib/three/capture.ts` | mới, PHU/G4 đặt tên file |
| Xử lý `app/dev-bench-3d-2/` untracked | đã có phiếu riêng — `SO-KIEM-TONG.md` §3 CHINH việc 2 | không thuộc spec này, chỉ nhắc |

---

## §6 · NGHIỆM THU §0c

1. **Phím tắt**: phím mở nhanh tab Camera (theo sổ lệnh, số 5 trong dãy tab hoặc phím riêng —
   CHƯA CHỐT, để CHINH/COWORK-VẼ gán tránh trùng). Space/Esc dừng "Xem trước" (theo quy ước dừng
   media chuẩn, khớp `walk` mode đã dùng Esc để thoát Pointer Lock).
2. **Lệnh tương tác**: thanh scrub kéo được bằng chuột VÀ phím mũi tên (khi focus); trạng thái
   đang chờ gì (đang xem trước / đang xuất) hiện rõ trên status bar — đúng luật "status bar luôn
   mách lệnh đang chờ gì" (§0c mục 2).
3. **UI cảm ứng**: thanh scrub + nút Xem trước/Xuất video ≥44px chạm được; mini-map trên tablet
   dùng pointer events (đã có sẵn cơ chế kéo chốt point trong `CamPathPreview.tsx:92-116`, tái
   dùng nguyên).

---

## §7 · RỦI RO / CHƯA LÀM (trung thực §0)
- Encode chuỗi PNG → `.mp4` thật: **CHƯA có giải pháp**, cần đo chi phí ffmpeg/thư viện trước khi
  hứa (rủi ro đã nêu sẵn ở `SPEC-VIDEO-MAT-BANG.md` §6.4).
- Hàm resolve "matId → mô tả" không liên quan file này nhưng CÓ liên quan use case "vật liệu thấy
  trong preview 3D" nếu sau này muốn campath preview có vật liệu thật — NGOÀI PHẠM VI (Viewport3D
  cố tình xám trơn, `SPEC-3D-CORE.md` §6).
- Vị trí mini-map (dưới-phải) là ĐỀ XUẤT dựa trên đo layout hiện có (Trình tự 3 bước chiếm
  dưới-trái) — chưa dựng thử trên app thật, có thể lệch khi có thêm overlay khác; COWORK-UI/G4
  nghiệm thu ảnh trước khi khoá cứng toạ độ.
- Chưa verify: hiệu năng `CamPathPreview` ở kích thước mini-map thật (chỉ suy luận từ đọc code,
  chưa đo khung hình/giây).
