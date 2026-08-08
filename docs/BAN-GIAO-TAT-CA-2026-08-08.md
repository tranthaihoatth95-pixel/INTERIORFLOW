# BÀN GIAO — TẤT CẢ VIỆC CÒN LẠI · 08/08/2026

> Gom một lần, đủ để giao thẳng cho Claude Code hoặc bất kỳ ai tiếp nhận.
> Mọi con số **đo bằng máy**. Chỗ nào chưa đo được thì ghi rõ CHƯA ĐO.
> Không cần đọc thêm tệp nào khác để bắt đầu.

---

## PHẦN 0 — TRẠNG THÁI HIỆN TẠI

```
main            3578af2   đã push, sạch
tsc             0 lỗi
check-chot      0 đỏ 0 vàng
test            218/220 chạy (2 lỗi chỉ do Prisma engine sai nền tảng trong hộp cát Linux)
DB              20 bảng / 20 model   ✅
migration       3
sổ GAP-IF       72 đỏ · 58 đã đóng
```

### Đang chạy song song — 5 luồng

| Nơi | Việc | Phiếu |
|---|---|---|
| repo chính | Thư viện · `.idfc` (chưa commit) | *(giao riêng, không có phiếu)* |
| `wt-p3c` | Bảng kiểm 3 chặng — **đã có `ReviewPanel.tsx` 11 625 B, mount `AppShell.tsx:168`** | `docs/DAN-VAO-p3c.md` |
| `wt-p14` | Mở kho dựng hình — **`Array`/`Bevel`/`Boolean` đã nối, chạy được** | `docs/DAN-VAO-p14.md` + `DAN-VAO-p14-BO-SUNG.md` |
| `wt-p3` | Đối chiếu mock bằng mắt | `docs/DAN-VAO-p3.md` |
| `wt-p2` | Dọn trần "5 sheet" + cắt `STATUS.md` | `docs/DAN-VAO-p2.md` |
| *(sắp)* `wt-p7` | Lighting · Camera · Phím tắt | `docs/DAN-VAO-p7.md` |

⚠️ **Trần 5 worktree** (`CLAUDE.md`). Mở `p7` là đủ trần — không mở thêm cho tới khi merge bớt.

---

## PHẦN 1 — GỐC BỆNH ĐÃ KHÁM RA

Trong **một đêm**, TỔNG giao việc-đã-xong **bốn lần**:

| | Sổ ghi | Sự thật đo được |
|---|---|---|
| ① | "27 chỗ trần 5 sheet" | **2 comment**. `MAX_SHEETS` gỡ hẳn từ **04/08** (`lib/cad/model.ts:1316`) |
| ② | "10 mock còn lại" | **60 tệp** HTML thuần (80 tổng, 20 cần `support.js`) |
| ③ | "114 lệnh dựng ❌" | Tầng ③ **8/8 xong** · tầng ① **12/12 xong** — nằm trong `lib/three/build-ops.ts` |
| ④ | "xây camera tham số" | **5 mảnh xong, CÓ TEST** — `SPEC-DUNG-CAMERA.md §0.2` liệt kê đủ |

**Gốc:** `docs/` có **57 tệp `SPEC-*.md`**. Nhiều spec tự làm sẵn bảng đối chiếu spec ↔ code kèm
`file:dòng`, kết luận *"đã có, chỉ thiếu dây nối cuối"* — trong khi sổ `GAP-IF.md` vẫn ghi ❌.
**Không ai đối chiếu.**

⇒ Đọc sổ mà không đọc spec = **đi xây lại thứ đã có** = đẻ ra **hai bản** của cùng một thứ.

### Đã dựng cửa kiểm: `scripts/soi-that.mjs`

```bash
node scripts/soi-that.mjs            # quét toàn bộ
node scripts/soi-that.mjs camera     # lọc theo tên spec
node scripts/soi-that.mjs --do       # chỉ in dòng có vấn đề
```

**Kết quả chạy lần đầu (08/08):**

```
✅ spec nói có · code CÓ THẬT & đã dùng : 24
🟡 code CÓ nhưng 0 NƠI GỌI             : 3
❌ spec nói có · code KHÔNG THẤY       : 20   ← PHẦN LỚN LÀ BÁO ĐỘNG GIẢ, xem dưới
⚠️ 42 spec KHÔNG rút được định danh    → PHẢI ĐỌC TAY
```

> ⚠️ **LỖI ĐÃ BIẾT CỦA SCRIPT (N5, chưa vá):** regex bắt dòng chứa `✅`/`đã có` — nhưng
> `SPEC-DUNG-3D-THONG-NHAT.md` có những dòng vừa chứa `✅` (cột khác) vừa chứa `⬜ THÊM`.
> ⇒ 17/20 dòng ❌ là **báo động giả** (`RECT3` `BOX3` `DOOR3` `WIN3` `ROOF3` `EXTRUDE` `IMP3`
> `LIB3` `DUP3` `MIR3` `PATH` `WALK` `ORBIT` `MATPICK` `MATERIAL_ID` `MONEY_VND` `ENUM` —
> spec ghi rõ `⬜ THÊM` = chưa làm, đúng như spec nói).
>
> **VIỆC ĐẦU TIÊN cho người tiếp nhận: vá regex này** — chỉ nhận dòng khẳng định khi
> KHÔNG có `⬜`/`❌`/`THÊM` trên cùng dòng. Vá xong chạy lại, số ❌ mới là số thật.

**Ba dòng ❌ có thể là thật** (cần người kiểm bằng tay):

| Định danh | Spec nói | `file:dòng` gợi ý |
|---|---|---|
| `inferElementType()` | `SPEC-TANG-DU-LIEU-CAU-KIEN.md` P1 | tìm trong `lib/cad/` |
| `openingsWidthOnBoundary()` | `SPEC-VE-REVIT-MODE.md` T4 — trừ bề rộng cửa khỏi chu vi | `lib/cad/hatch.ts` chỉ có bản tính khác |
| `MATERIAL_ID` | `SPEC-DUNG-3D-THONG-NHAT` | có thể đã đổi tên thành `matId` |

**Ba dòng 🟡 — code có, 0 nơi gọi:**

```
SUM                        lib/boq/xlsx.ts:346
DRAG_ACTIVE_THRESHOLD_PX   components/present-editor/Element.tsx:83
drawSnap                   components/cad/CadCanvas.tsx:2993
```

---

## PHẦN 2 — 42 SPEC CHƯA AI ĐỐI CHIẾU

Script không đọc được (viết bằng văn xuôi, không nêu tên định danh). **Phải đọc tay.**
Đây là **kho quặng lớn nhất** — mỗi tệp có thể chứa một "chuyện lớn" như bốn cái ở Phần 1.

```
SPEC-3D-CORE · SPEC-APP-SHELL-CHUNG · SPEC-APPLE-MOTION-MATERIAL
SPEC-ARCHINOTE-IF-BOUNDARY · SPEC-ARCHINOTE-UI-2026-08-03 · SPEC-ARCHINOTE-V2-2026-08-07
SPEC-BRIEF-INTAKE · SPEC-CAD-SHELL-V3 · SPEC-CHANG2-UI-2MODE · SPEC-COLLABORATION
SPEC-DESIGN-SYSTEM-IF · SPEC-DUNG-BO-LENH-3D · SPEC-DUNG-PIPELINE-RENDER-AI
SPEC-EDITOR-TOOLKIT · SPEC-FILE-MANAGER · SPEC-GANTT-DATA · SPEC-HA-TANG-UI-IF
SPEC-HOVER-FOCUS-IDF · SPEC-IF-LIBRARY · SPEC-KNOWLEDGE-BASE · SPEC-LENH-VE-IF
SPEC-MAT-DO-CON-TRO · SPEC-MATERIAL-PIPELINE · SPEC-MODE-PER-STAGE
SPEC-NAVIGATION-MODEL · SPEC-NGON-NGU-CHI-DAN · SPEC-PANEL-ROLLOUT-IDF
SPEC-PRODUCT-INFRA · SPEC-RENDER-STUDIO · SPEC-SEMANTIC-MODEL · SPEC-STAGE-0-IDEATION
SPEC-STAGE-LIBRARIES · SPEC-TRINH-MATERIAL-A3 · SPEC-TRINH-ONG-KINH-DU-LIEU
SPEC-TRINH-VANBAN-EDITOR · SPEC-TRINH-VIDEO-EDITOR · SPEC-UI-SHELL
SPEC-VAT-LIEU-PBR-IF · SPEC-VE-INFERENCE · SPEC-VITALS-AI · SPEC-VITALS-ROLE
SPEC-VITALS-VISUAL
```

**Cách làm cho từng tệp** (khoảng 10 phút/tệp):

```
1. Đọc TRỌN spec, đặc biệt mục §0 (xác minh hiện trạng)
2. Liệt kê mọi thứ spec nói "đã có" / "✅" / "xong"
3. grep từng thứ trong code → CÓ hay KHÔNG
4. Ghi bảng 3 cột: điều spec nói · file:dòng thật · ✅/🟡/❌
5. 🟡 (có code, 0 nơi gọi) = việc RẺ NHẤT — chỉ cần nối UI
```

---

## PHẦN 3 — SÁU TẦNG LỆNH DỰNG HÌNH · đo 08/08

Nguồn: `docs/SPEC-DUNG-BO-LENH-3D.md` (40 dòng, Hoà chốt 03/08).

| Tầng | Có | Thiếu |
|---|---|---|
| **① Hệ phẳng 2D** | **12/12 ✅** polyline·rect·circle·arc·ellipse·polygon·spline·offset·trim·extend·fillet·chamfer | — |
| **② Khối cơ bản 3D** | **1/9** chỉ `box` | cylinder·cone·sphere·torus·tube·pyramid·wedge |
| **③ Sinh khối từ tiết diện** | **8/8 ✅** extrude·lathe·revolve·sweep·loft·bevel·shell·thickness — **TẤT CẢ trong `lib/three/build-ops.ts`** | — |
| **④ Biến đổi** | **3/7** mirror·array·taper | symmetry·bend·twist·noise |
| **⑤ Boolean** | **3/4** union·subtract·intersect | split |
| **⑥ Cấu kiện tham số** | 10 nút có mặt | phần lớn còn `disabled` |

⚠️ `docs/DUONG-VE-DICH-3-DOT.md:73` ghi `B-① Massing: ❌ 114 lệnh` — **SỐ ĐÓ SAI**, sửa đi.

**Việc thật:** nối UI cho tầng ③④ (`p14` đang làm) · thêm 8 primitive tầng ② · 4 modifier tầng ④.

---

## PHẦN 4 — BA MẢNG CHƯA XÂY

### 4.1 · LIGHTING — có bộ não, chưa có mắt

```
lib/three/lighting.ts     ✅ SunLight · SkyLight · RoomLight (ceiling/wall/strip/spot)
                          ✅ sunFromDateTime()  — mặt trời theo ngày·giờ·toạ độ THẬT
                          ✅ kelvinToRgb()      — độ ấm màu
Scene3DViewer.tsx         ❌ KHÔNG có đèn nào trong scene
```

⛔ **KHÔNG đổi `MeshBasicMaterial` → `MeshStandardMaterial`.** Quyết định #3
(`Scene3DViewer.tsx:27,88`): viewer **cố ý không render bóng đổ**, ảnh cuối do D5 dựng.

**Việc thật:** cho người dùng **ĐẶT và THẤY đèn ở đâu** (gizmo/sprite), không phải chiếu sáng cảnh.
Chi tiết: `docs/DAN-VAO-p7.md` VIỆC 1.

### 4.2 · CAMERA — 5 mảnh đã có, thiếu dây nối

Trích `SPEC-DUNG-CAMERA.md §0.2`:

| Mảnh | `file:dòng` | Trạng thái |
|---|---|---|
| `planCamPath()` | `lib/cad/campath.ts:224` | ✅ xong, có test |
| `Scene3DViewer` mode `'campath'` | `Scene3DViewer.tsx:296-302` | ✅ xong — **không được cấp prop** |
| `EYE_HEIGHT_MM = 1650` | `lib/three/capture.ts:81-87` | ✅ xong — hằng số **cứng** |
| `captureSequence()` xuất PNG | `capture.ts:276-305` | ✅ có test — **CHƯA UI nào gọi** |
| Bước 3/3 "Đặt máy quay" | `Render3DModeSkeleton.tsx:114,159` | ✅ đã tính sẵn điều kiện |

Spec gọi việc nối `captureSequence` vào nút Xuất video là ***"khoảng trống thật lớn nhất"***.

Camera hiện đóng cứng: `Scene3DViewer.tsx:223 → PerspectiveCamera(50, 1, 0.05, 500)`.
Cần **tiêu cự mm** (18·24·35·50·85), không phải độ.

### 4.3 · PHÍM TẮT — rời rạc ba nơi, thiếu phím dùng nhiều nhất

```
ToolDock3D.tsx      V ⇧V L R C P F X M Q D 1 B T G   ← 15 phím, công cụ vẽ
Scene3DViewer.tsx   W A S D + 4 mũi tên              ← đi bộ
snap3d.ts           Shift (khoá loại) · X Y Z (khoá trục)
```

**Thiếu hẳn:** wireframe (`F3`/`F4`) · lưới sàn (`G`) · trục · góc nhìn chuẩn Top/Front/Left/Iso ·
Zoom Extents (`Z`) · Isolate (`Alt+Q`) · **màn tra phím tắt (`?`)**.

**Luật `§0c` của spec:** mỗi lệnh phải đủ **BA MẢNG** — phím tắt · gọi được từ `⌘K` ·
đường chạm tương đương. **Chưa ai kiểm luật này.**

---

## PHẦN 5 — SÁU LỖI GIAO DIỆN 3D (Hoà soi app thật 08/08)

Chi tiết đầy đủ: `docs/DAN-VAO-p14-BO-SUNG.md`. Tóm tắt:

| # | Lỗi | Sửa |
|---|---|---|
| ① | **Cạnh tam giác lộ ra** — mỗi mặt tường bị đường chéo cắt ngang | `WireframeGeometry` → `EdgesGeometry(geo, 15)` |
| ② | **Camera góc nhìn sai** — ViewCube phản chiếu trung thực góc hỏng | `fitCameraToScene` (`Scene3DViewer.tsx:74,256`) phải cho **góc 3/4 chuẩn** |
| ③ | **Nhóm "Khối cơ bản" cả 3 nút chết** (`Command3DPanel.tsx:221,250`) | **Bỏ nhóm.** Chia lại theo động tác: Vẽ-rồi-đùn · Cấu kiện · Biến đổi |
| ④ | **Thuật ngữ dịch sang tiếng Việt** | **Giữ tiếng Anh** `Array`·`Bevel`·`Sweep`, dòng nhỏ giải thích Việt. Chỉ áp cho **lệnh dựng hình** |
| ⑤ | **Không có dòng nhập nhanh** | Thêm VCB kiểu SketchUp góc dưới phải: chọn lệnh → gõ số → Enter |
| ⑥ | **Hai nút khác loại đặt cùng chỗ** | `Vẽ 3D` = công tắc chế độ · `Dựng ảnh` = hành động. Tách ra |

---

## PHẦN 6 — HAI QUYẾT ĐỊNH HOÀ ĐÃ CHỐT 08/08

**① Thuật ngữ lệnh dựng hình: GIỮ TIẾNG ANH** + dòng nhỏ giải thích tiếng Việt.
Lý do: `Array`·`Bevel`·`Chamfer`·`Loft`·`Sweep`·`Revolve`·`Mirror`·`Fillet`·`Offset`·`Extrude`·
`Boolean` là thuật ngữ nghề quốc tế. Dân 3ds Max / SketchUp đọc là hiểu.
**Ranh giới:** KHÔNG áp cho tên chặng · điều hướng · trạng thái · câu giải thích.
→ **Ghi vào `docs/00-CHOT.md`.**

**② Magic — mô tả ra khối: ĐƯỜNG B (mô tả → tham số)**

```
✗ Đường A (text-to-3D)    "phòng ngủ hiện đại" → AI đẻ mesh
                          khối hữu cơ, kích thước không chuẩn, không xuất được bản vẽ

✓ Đường B (text-to-params) "phòng ngủ 4×5m, trần 2.8m, cửa 900 bên trái"
                          → AI đọc ý định, sinh BỘ SỐ
                          → lệnh dựng hình TẤT ĐỊNH chạy với bộ số đó
                          tường 220mm đúng 220mm · xuất bản vẽ được · tính khối lượng được
```

Đúng luật `CHOT-TACH-AI-VA-CHINH-TAY` (01/08). Phễu tên **`Magic`**. **Cấm chữ "tự động".**
Người dùng phải **thấy bộ số trước khi dựng** và **sửa được từng số**.
→ **Chưa có phiếu. Cần soạn.**

---

## PHẦN 7 — VIỆC TỒN KHÁC

| | Việc | Số đo |
|---|---|---|
| a | `STATUS.md` phình gấp 10 lần trần | **8 674 từ** · `CLAUDE.md` đòi **< 800** |
| b | `lib/review/` chưa mount trên `main` | 0 nơi gọi *(nhưng `wt-p3c` đã làm, chưa merge)* |
| c | `build-ops` 11 hàm chưa nối UI trên `main` | *(`wt-p14` đã nối `Array`/`Bevel`/`Boolean`, chưa merge)* |
| d | Hai thước đếm lệch nhau | `soi-app.py` báo **75 đỏ / 43 flow mồ côi** · đo tay **72 đỏ / 45-46** |
| e | 45 flow mồ côi trong `dev.db` | **CỐ Ý ĐỂ YÊN** — phương án B, đó là rác thử nghiệm. Đường đẻ mồ côi mới đã bịt (`app/api/flows/route.ts:106`) |
| f | Rủi ro pháp lý GPL-3.0 | `docs/RESEARCH-DWG-LICENSE.md` — miễn trừ cho `libredwg-web` dựa trên lập luận *"tool nội bộ, không bán"*, **lập luận này chết với định vị global** |
| g | ArchiNote | Spec v2 xong (`docs/SPEC-ARCHINOTE-V2-2026-08-07.md`) — **chưa 1 dòng code** |
| h | `.next` phình | 1,6–2,0 GB, xoá định kỳ |
| i | `dev-sach.db` | 20 bảng · 0 dữ liệu — dựng sẵn để nghiệm thu trên nền trắng |

---

## PHẦN 8 — LUẬT VẬN HÀNH BẮT BUỘC

```
V6   · KHÔNG commit. Hoà commit.
§0u  · Chỉ TỔNG được ghi docs/GAP-IF.md.
§0aa · Một thư mục repo = MỘT dev server. Nhiều server ghi chung .next ⇒ mọi route trả 500.
§0ab · Sổ là ảnh chụp cũ. ĐO LẠI bằng máy trước khi tin bất kỳ con số nào.
§0ac · Báo cáo phải tự khai: tệp OUT tên gì, dán vào phiên nào.
§0ad · File khoá git bỏ lại (.git/*.lock) chặn mọi lệnh ghi — kiểm khi git kẹt.
§0ae · ĐỌC SPEC TRƯỚC KHI TIN SỔ  ← MỚI 08/08, xem Phần 1
N1   · Báo cáo KHÔNG phải bằng chứng.
N5   · Khai thật cái chưa xong.
N6   · Code không có nơi mount = CHƯA XONG.
N8   · Mọi dòng báo cáo có file:dòng.
G2   · panel nền đặc ≥92%        G4 · line-height ≥1,5 (thấp hơn CẮT DẤU tiếng Việt)
G6   · nút quyết định có CHỮ     G8 · kéo thả không được là đường duy nhất
KS3  · duyệt từng phần           KS4 · lùi được
2.1.9.i · MaterialDef = thị giác · ProductSpec = thương mại. CỐ Ý KHÔNG TRỘN.
Trung tính · IF là sản phẩm global. 0 tên khách, 0 brand studio nhúng cứng.
```

**Cửa kiểm trước khi báo xong:**

```bash
npx tsc --noEmit -p .
node scripts/check-chot.mjs
npm test
node scripts/soi-that.mjs --do     # MỚI — đối chiếu spec ↔ code
```

---

## PHẦN 9 — THỨ TỰ ƯU TIÊN

```
1  vá regex scripts/soi-that.mjs        ← 10 phút, mở khoá mọi việc sau
2  chạy lại soi-that, lấy số ĐỎ THẬT
3  đọc tay 42 spec chưa đối chiếu       ← kho quặng lớn nhất
4  merge 5 worktree đang chạy
5  nghiệm thu p6 trên dev-sach.db       ← docs/DAN-VAO-p6.md
6  Magic đường B                        ← chưa có phiếu
7  Lighting · Camera · Phím tắt         ← docs/DAN-VAO-p7.md
8  8 primitive tầng ② · 4 modifier tầng ④
```

**Việc rẻ nhất mà lợi nhất: bước 1–3.** Chúng ngăn việc xây lại thứ đã có — thứ đã xảy ra
bốn lần trong một đêm.

---

## PHẦN 10 — SÁU TỆP PHIẾU ĐÃ SOẠN, DÁN THẲNG ĐƯỢC

```
docs/CHAY-DOT-FINAL.md          bảng chỉ đường 7 bước, có ô tick
docs/DAN-VAO-p3c.md             bảng kiểm 3 chặng
docs/DAN-VAO-p14.md             mở kho dựng hình
docs/DAN-VAO-p14-BO-SUNG.md     6 lỗi giao diện 3D  ← MỚI
docs/DAN-VAO-p3.md              đối chiếu mock bằng mắt
docs/DAN-VAO-p2.md              dọn trần 5 sheet + cắt STATUS.md
docs/DAN-VAO-p7.md              lighting · camera · phím tắt  ← MỚI
docs/DAN-VAO-p6.md              nghiệm thu + build final (chạy SAU CÙNG)
```

Mỗi tệp: mở → `Cmd+A` → `Cmd+C` → dán vào phiên tương ứng. Không cần cắt gọt.
