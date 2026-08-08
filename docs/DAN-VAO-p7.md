> **CÁCH DÙNG:** `Cmd+A` → `Cmd+C` → dán vào phiên **`p7`** (slot còn rảnh).
> ⚠️ Phải chạy trong **worktree riêng** — xem cuối tệp.
> ⚠️ `p14` đang chạy song song và **giữ** `lib/three/build-ops.ts` + `Command3DPanel.tsx`.
> Phiếu này **KHÔNG được đụng hai tệp đó**.

---

# LUẬT BẮT BUỘC — đọc trước khi gõ dòng code đầu tiên

Đọc theo thứ tự: `STATUS.md` → `docs/00-CHOT.md` → `docs/00-BAT-DAU-DOC-DAY.md`.
**KHÔNG đọc `CHANGELOG.md`.**

## ⛔ LUẬT §0ae — ĐỌC SPEC TRƯỚC KHI TIN SỔ *(TỔNG ghi 08/08 sau khi tự phạm 3 lần trong một đêm)*

`docs/` có **57 tệp `SPEC-*.md`**. Nhiều spec đã tự làm sẵn **bảng đối chiếu spec ↔ code
kèm `file:dòng`**, và kết luận thường là *"đã có, chỉ thiếu dây nối cuối"* —
trong khi sổ `GAP-IF.md` và các báo cáo vẫn ghi **❌ chưa có**.

**Ba lần phạm trong đêm 08/08:**

| | Sổ ghi | Sự thật |
|---|---|---|
| 114 lệnh dựng hình | ❌ chưa có | tầng ③ **8/8 xong**, tầng ① **12/12 xong** — nằm trong `build-ops.ts` |
| Camera tham số | ❌ chưa có | **5 mảnh xong, có test** — `SPEC-DUNG-CAMERA.md §0.2` đã liệt kê đủ |
| Tầm mắt 1650mm | "cần thêm" | `capture.ts:81` — **hằng số đã có sẵn** |

**BẮT BUỘC trước mỗi việc:**

```
1. Tìm spec tương ứng:  ls docs/SPEC-*.md | grep -i <từ khoá>
2. Đọc TRỌN spec đó, đặc biệt mục §0 (xác minh hiện trạng)
3. Grep từng thứ spec nói "đã có" — xác nhận còn không
4. CHỈ làm phần thật sự thiếu
```

Ghi vào OUT: **spec nào đã đọc** · thứ nào **đã có mà sổ ghi thiếu**.

**Spec bắt buộc đọc cho phiếu này:**
`docs/SPEC-DUNG-BO-LENH-3D.md` (40 dòng) · **`docs/SPEC-DUNG-CAMERA.md` (220 dòng — TRỌN)**

```
V6  · KHÔNG commit. Hoà commit. Làm xong để nguyên, báo cáo.
§0u · Chỉ COWORK-TỔNG được ghi docs/GAP-IF.md. Phiên khác ghi vào tệp OUT của mình.
§0ab· Sổ là ảnh chụp cũ. ĐO LẠI bằng máy trước khi tin bất kỳ con số nào.
§0ac· Báo cáo phải tự khai: tệp OUT tên gì, dán vào phiên nào.
N1  · Báo cáo KHÔNG phải bằng chứng. Mỗi việc "xong" phải kèm số đo hoặc ẢNH.
N5  · Khai thật cái chưa xong.
N6  · Code không có nơi mount = CHƯA XONG. Phải chỉ được file:dòng nơi gọi tới.
N8  · Mọi dòng báo cáo có file:dòng.
```

**Luật giao diện**

```
G2 · panel nền đặc ≥92%      G4 · line-height ≥1,5 (thấp hơn là CẮT DẤU tiếng Việt)
G6 · nút quyết định phải có CHỮ    G8 · kéo thả không được là đường duy nhất
KS4· LÙI ĐƯỢC — mọi phép sửa hình phải Ctrl+Z về được
```

**Luật riêng của bộ lệnh dựng hình** (`SPEC-DUNG-BO-LENH-3D §4`)

```
X1 · dựng ở 3D vẫn ghi vào MỘT Doc, sinh entity 2D tương ứng khi có thể
§0c· MỖI LỆNH phải có đủ BA MẢNG: phím tắt · gọi được từ ⌘K · đường chạm tương đương
     ← đây là luật hay bị bỏ sót nhất, kiểm từng lệnh
④  · nhập số CHÍNH XÁC cho mọi lệnh — không lệnh nào chỉ kéo áng chừng
② · tái dùng engine chặng 2D, KHÔNG viết lại hình học
```

**Thuật ngữ — Hoà chốt 08/08:** lệnh dựng hình **giữ TIẾNG ANH**, dòng nhỏ bên dưới giải
thích tiếng Việt. `Lathe` · `Sweep` · `Loft` · `Bevel` · `Taper` · `Mirror`.
KHÔNG áp cho tên chặng / điều hướng / trạng thái.

**Cửa kiểm trước khi báo xong**

```bash
npx tsc --noEmit -p .        # 0 lỗi
node scripts/check-chot.mjs  # 0 đỏ 0 vàng
npm test                     # không thêm lỗi mới
```

---

# PHIẾU `p7` · LIGHTING + CAMERA THAM SỐ + PHÍM TẮT 3D

**Tệp OUT:** `docs/M-LIGHT-CAM-OUT.md`
**Sở hữu:** `lib/three/lighting.ts` · `lib/cad/campath.ts` · `components/three/` (trừ những gì `p14` giữ)
**Cấm đụng:**
`lib/three/build-ops.ts` · `components/render-studio/Command3DPanel.tsx` (**`p14` giữ**) ·
`components/studio/AppShell.tsx` · `components/review/` (**`p3c` giữ**) ·
`prisma/` · `lib/server/` · `lib/materials/` · `lib/library/`

---

## ⚠️ ĐỌC TRƯỚC — SỔ GHI SAI SỐ, ĐỪNG XÂY LẠI THỨ ĐÃ CÓ

`docs/DUONG-VE-DICH-3-DOT.md:73` ghi `B-① Massing: ❌ 114 lệnh`.
**Số đó SAI.** TỔNG đo lại 08/08 bằng máy:

| Tầng (`SPEC-DUNG-BO-LENH-3D §1`) | Thực tế |
|---|---|
| ① Hệ phẳng 2D | **12/12 ✅** — đủ cả, ở `lib/cad/` |
| ② Khối cơ bản 3D | **1/9** — chỉ `box` |
| ③ Sinh khối từ tiết diện | **8/8 ✅** — `extrude·lathe·revolve·sweep·loft·bevel·shell·thickness`, TẤT CẢ trong `lib/three/build-ops.ts` |
| ④ Biến đổi | **3/7** — `mirror·array·taper` có · thiếu `symmetry·bend·twist·noise` |
| ⑤ Boolean | **3/4** — `union·subtract·intersect` có · thiếu `split` |
| ⑥ Cấu kiện tham số | 10 nút có mặt, phần lớn còn `disabled` |

⇒ **Tầng ③ và ④ do `p14` nối UI.** Phiếu này **KHÔNG đụng**.
Phiếu này lo **Lighting · Camera · Phím tắt** — ba thứ thật sự chưa có.

---

## VIỆC 1 — LIGHTING: có bộ não, chưa có mắt

Đo trước:

```bash
grep -nE "^export (interface|const|function)" lib/three/lighting.ts | head -20
grep -nE "DirectionalLight|AmbientLight|PointLight|SpotLight|HemisphereLight" components/three/Scene3DViewer.tsx
```

Số TỔNG đo được:

```
lib/three/lighting.ts     ✅ SunLight · SkyLight · RoomLight (ceiling/wall/strip/spot)
                          ✅ sunFromDateTime()  — mặt trời theo ngày·giờ·toạ độ THẬT
                          ✅ kelvinToRgb()      — độ ấm màu
Scene3DViewer.tsx         ❌ KHÔNG có đèn nào trong scene
```

Toàn bộ dữ liệu đèn **được tính đúng rồi lưu vào tệp** — nhưng người dùng **không thấy gì**.

### ⛔ RANH GIỚI TUYỆT ĐỐI — đọc kỹ trước khi code

`SPEC-DUNG-BO-LENH-3D §0` + quyết định #3 (`Scene3DViewer.tsx:27,88`):

> Ảnh cuối do AI dựng ⇒ **KHÔNG cần** đèn IES · GI · bounce · exposure vật lý.
> Viewer cố ý dùng `MeshBasicMaterial`, **không render bóng đổ**.

**KHÔNG được** thay `MeshBasicMaterial` bằng `MeshStandardMaterial`.
**KHÔNG được** thêm `DirectionalLight` để "cho đẹp".

### Vậy làm gì?

Đèn trong IF là **dữ liệu để đưa cho D5 dựng ảnh**, không phải để soi sáng viewer.
Việc của phiếu này: **cho người dùng ĐẶT và THẤY đèn ở đâu**, không phải chiếu sáng cảnh.

| # | Việc | Cách |
|---|---|---|
| **a** | **Dấu đèn nhìn thấy được** trong khung nhìn 3D | Sprite/gizmo cho từng `RoomLight` — hình theo `kind` (`ceiling`·`wall`·`strip`·`spot`), màu theo `kelvinToHex()`. Kéo được để đổi vị trí (`snap3d` đã có, tái dùng) |
| **b** | **Mũi tên hướng nắng** | Một mũi tên lớn ở rìa cảnh theo `sunDirectionCad()`. Xoay được = đổi `azimuthDeg`/`altitudeDeg` |
| **c** | **Panel Đèn** (tab `Đèn` đã có nhãn, còn rỗng) | Ngày · giờ · toạ độ → gọi `sunFromDateTime()`. Cường độ · độ ấm (K) · danh sách đèn phòng, thêm/xoá/sửa |
| **d** | **Nói thật với người dùng** | Một dòng dưới panel: *"Đèn không chiếu sáng khung nhìn — nó được gửi cho bước Dựng ảnh."* Đúng luật N5 áp vào sản phẩm |

**Nghiệm thu:** ảnh — đặt 3 đèn trần + xoay hướng nắng → thấy 3 dấu đèn + mũi tên nắng đổi hướng.
Tắt app mở lại → đèn còn nguyên.

---

## VIỆC 2 — CAMERA: ⚠️ **ĐỌC `docs/SPEC-DUNG-CAMERA.md` TRỌN VẸN TRƯỚC KHI GÕ**

> **Sửa 08/08 — TỔNG tự bắt lỗi.** Bản phiếu đầu giao *"xây camera tham số"* như việc mới.
> **SAI.** `docs/SPEC-DUNG-CAMERA.md §0.2` đã có sẵn bảng đối chiếu, kết luận nguyên văn:
> *"việc thật không phải 'xây from scratch' mà là **NỐI 5 mảnh đã có**"*.
> TỔNG soạn phiếu mà **không đọc spec đó** — suýt bắt phiên này xây lại thứ đã xong.

### Năm mảnh ĐÃ CÓ — trích thẳng từ `SPEC-DUNG-CAMERA.md §0.2`

| Mảnh | `file:dòng` | Trạng thái |
|---|---|---|
| `planCamPath()` — polyline → mẫu {điểm, hướng, thời điểm} | `lib/cad/campath.ts:224` | ✅ xong, **có test** |
| `Scene3DViewer` mode `'campath'` — camera bám `CamPathResult`, loop | `Scene3DViewer.tsx:9-11,296-302` | ✅ xong — **đang KHÔNG được cấp prop `camPath`** |
| `camPathSampleToThree()` + **`EYE_HEIGHT_MM = 1650`** | `lib/three/capture.ts:44,81-87` | ✅ xong — **hằng số CỨNG, chưa tham số hoá** |
| `captureSequence()` — xuất PNG từng khung, streaming + `AbortSignal` | `capture.ts:276-305` | ✅ code xong, **có test** — **CHƯA UI nào gọi** |
| Bước 3/3 "Đặt máy quay" trong Trình tự | `Render3DModeSkeleton.tsx:114,159` | ✅ **đã tính sẵn điều kiện** — chỉ chưa có UI thao tác |

⛔ **KHÔNG viết lại** `planCamPath` · `Scene3DViewer` · `capture.ts`.

### Việc thật — nối dây, theo `SPEC-DUNG-CAMERA` §2

| # | Việc | Ghi chú |
|---|---|---|
| **1** | **Cấp prop `camPath`** cho `Scene3DViewer` từ nơi gọi | Mảnh ② đang chạy không tải |
| **2** | **Đổi `Viewport3D` mode** — hiện hard-code `"massing"` (`Render3DModeSkeleton.tsx:175`), cần đường sang `'campath'` | |
| **3** | **Nối `captureSequence()` vào nút "Xuất video"** | Spec gọi đây là *"khoảng trống thật lớn nhất"*. Hiện chỉ chạy ở dev bench |
| **4** | **Tham số hoá `EYE_HEIGHT_MM`** — đang cứng 1650 | Spec §3: tầm mắt phải **chọn được** |
| **5** | **Tiêu cự thật (mm)** — 18·24·35·50·85 + ô nhập tự do | `Scene3DViewer.tsx:223` đang `PerspectiveCamera(50,…)` — đổi `fov` → `focalLength` qua sensor 36mm. Dân nghề nghĩ bằng **mm** |
| **6** | **Chỉnh đứng / 2 điểm tụ** | Ảnh nội thất chuyên nghiệp **đường đứng phải thẳng**. Thiếu là lộ ngay ảnh nghiệp dư |
| **7** | **Safe frame + tỉ lệ khung** — 16:9 · 3:2 · 4:5 · 1:1 · A3 ngang | Canh khung trước render |
| **8** | **Lưu điểm nhìn có tên** | Bộ ảnh khách duyệt phải chụp **cùng góc** qua nhiều lần sửa |
| **9** | Dịch trục (shift/tilt) · Khẩu độ (DOF) | Làm sau nếu còn sức |

⚠️ Tab `Camera` nằm trong `Command3DPanel.tsx:45,196` mà **`p14` đang giữ** —
hiện là placeholder *"Đặt camera · đường cam (campath) — sắp có."*
⇒ Dựng panel ở **tệp riêng** trong `components/three/`, khai tên tệp trong OUT để `p14` nối vào tab sau.

Spec §2.2 còn chốt: overlay đặt **TRÊN viewport**, không phải panel rời — theo đúng pattern
ViewCube/trục/gizmo đã có. Đọc §2.2–§2.4 trước khi vẽ.

**Nghiệm thu:** ảnh — đổi tiêu cự 50→24mm thấy khung mở rộng · bật 2 điểm tụ thấy đường đứng
thẳng lại · **bấm Xuất video ra được chuỗi PNG thật** (mảnh ⑤ lần đầu có UI).

---

## VIỆC 3 — PHÍM TẮT: rời rạc ba nơi, thiếu những phím dùng nhiều nhất

Đo được:

```
ToolDock3D.tsx      V ⇧V L R C P F X M Q D 1 B T G   ← 15 phím, công cụ vẽ
Scene3DViewer.tsx   W A S D + 4 mũi tên              ← đi bộ trong cảnh
snap3d.ts           Shift (khoá loại) · X Y Z (khoá trục)
```

**Thiếu hẳn những phím designer bấm nhiều nhất:**

| Việc | 3ds Max / SketchUp | IF |
|---|---|---|
| Bật/tắt **wireframe** | `F3` / `F4` | ❌ |
| Bật/tắt **lưới sàn** | `G` | ❌ |
| Bật/tắt **trục** | có | ❌ |
| Về **góc nhìn chuẩn** Top/Front/Left/Iso | `T` `F` `L` `Iso` | ❌ (chỉ bấm ViewCube) |
| **Zoom Extents** | `Z` / `⇧Z` | ❌ (chỉ nút "Toàn cảnh") |
| **Isolate** khối đang chọn | `Alt+Q` | ❌ |

### Phải làm

**a) Thêm các công tắc còn thiếu** — mỗi cái vừa có **phím tắt** vừa có **nút bấm** (luật G8:
phím tắt không được là đường duy nhất).

**b) Gom về MỘT nơi quản phím.** Ba nơi đăng ký `keydown` rời rạc là công thức đẻ ra phím
đè nhau. Một `registry` chung, mỗi lệnh khai một dòng.

**c) Luật `§0c` — mỗi lệnh phải đủ BA MẢNG:**

```
phím tắt  ·  gọi được từ ⌘K  ·  đường chạm tương đương
```

Kiểm **từng lệnh** hiện có, lập bảng: lệnh nào thiếu mảng nào.
Đây là luật hay bị bỏ sót nhất.

**d) Màn "Phím tắt"** — bấm `?` hiện bảng tra. Không có bảng này thì phím tắt vô dụng
với người mới.

**Nghiệm thu:** bảng đầy đủ `lệnh × 3 mảng` trong OUT · ảnh màn phím tắt · ảnh bật/tắt wireframe.

---

## THỨ TỰ LÀM

```
VIỆC 3 phím tắt   ← rẻ nhất, dùng được ngay, không đụng ai
VIỆC 2 camera     ← đắt vừa, mở đường cho chặng Trình chiếu
VIỆC 1 lighting   ← nặng nhất, cần gizmo + panel mới
```

## BÁO CÁO — `docs/M-LIGHT-CAM-OUT.md`

1. Bảng **6 tầng SPEC ↔ code thật** đo lại (xác nhận hay bác số của TỔNG).
2. Mỗi việc: `file:dòng` · **ảnh trước/sau**.
3. Bảng `lệnh × 3 mảng` (§0c) — lệnh nào thiếu mảng nào.
4. Tên **tệp panel camera mới** để `p14` nối vào tab sau.
5. Mục **CHƯA VERIFY** (N5).
6. Dòng cuối: *"Tệp OUT: `docs/M-LIGHT-CAM-OUT.md` · dán vào phiên `p7`"* (§0ac).

**KHÔNG commit.**

---

## ⚠️ TRƯỚC KHI BẮT ĐẦU — mở worktree riêng

```bash
cd ~/Downloads/interiorflow
git worktree add ../interiorflow-wt-p7 -b feat/p7-light-cam-phim
cd ../interiorflow-wt-p7 && npm install && npm run dev -- -p 3007
```

Rồi mở phiên `p7` **trong thư mục `interiorflow-wt-p7`**.
