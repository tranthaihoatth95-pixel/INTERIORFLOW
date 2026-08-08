> **CÁCH DÙNG:** `Cmd+A` → `Cmd+C` → dán vào phiên **`p14`** (đang mở, đã làm xong phần nối `build-ops`).
> Đây là **phiếu bổ sung** sau khi Hoà soi app thật ngày 08/08 — sáu việc mới, một quyết định lớn để riêng.

---

# BỔ SUNG `p14` · SÁU VIỆC TỪ LƯỢT SOI 08/08

Hoà mở app thật, soi chặng **Thiết kế 3D**, chỉ ra sáu chỗ. Tất cả đều đã đo bằng máy, có `file:dòng`.

**Việc đã xong, ĐỪNG làm lại:** `Array` đã nối (`3 cột × 1200mm · 2 hàng × 900mm`) ·
`Khoét hốc` · `Vát cạnh trên` · `Bỏ nhân bản dãy` đều chạy. Khối đã hiện ra màn.

---

## ① CẠNH TAM GIÁC LỘ RA — sửa trước tiên

Mỗi mặt tường phẳng đang bị **một đường chéo cắt ngang**. Đó là cạnh chia tam giác của lưới —
thứ chỉ máy cần biết, người dùng **không được thấy**.

Trong bản vẽ kiến trúc, một bức tường phẳng là **hình chữ nhật bốn cạnh**. Đường chéo hiện lên
làm người xem tưởng tường bị chia đôi.

```
Đang dùng :  WireframeGeometry      → vẽ HẾT cạnh tam giác
Phải dùng :  EdgesGeometry(geo, 15) → chỉ giữ cạnh có góc gãy > 15°
```

`EdgesGeometry` có tham số **ngưỡng góc**: mặt phẳng sạch trơn, góc tường và cạnh trên vẫn rõ.

⚠️ **KHÔNG thêm đèn, KHÔNG phá quyết định #3** (viewer cố ý không render bóng đổ,
`MeshBasicMaterial` — xem `Scene3DViewer.tsx:27,88`). Chỉ cần **nét cạnh** để đọc được khối.

**Verify bằng ảnh:** một bức tường phẳng = đúng **4 cạnh**, **0 đường chéo**.

---

## ② CAMERA GÓC NHÌN SAI — ViewCube đang phản chiếu trung thực một góc nhìn hỏng

Hoà nói *"sai điểm tụ"* khi nhìn ViewCube góc trên phải. Đo lại:

```
ViewCube3D.tsx:168   new THREE.OrthographicCamera(...)              ✅ ĐÚNG (không điểm tụ)
ViewCube3D.tsx:315   cubeCamera.quaternion.copy(api.camera.quaternion)
```

**ViewCube không sai.** Nó sao chép nguyên quaternion của camera chính — camera chính đang ở
góc nghiêng lạ, cube nghiêng theo. Sửa camera chính thì cube tự đúng.

**Phải làm:** kiểm `fitCameraToScene` (`Scene3DViewer.tsx:74`, gọi ở dòng `256`) —
góc nhìn mặc định khi vào chặng 3D phải là **góc phối cảnh 3/4 chuẩn** (nhìn chéo từ trên xuống,
thấy đủ hai mặt đứng + mặt trên), không phải góc ngang sát chân tường.

Chuẩn nghề: SketchUp mặc định **Iso view** · 3ds Max mặc định **Perspective góc 3/4**.

**Verify bằng ảnh:** vào chặng 3D lần đầu → thấy trọn khối ở góc 3/4, ViewCube đứng thẳng.

---

## ③ NHÓM "KHỐI CƠ BẢN" — cả nhóm chết, phải bỏ

```
Command3DPanel.tsx:221   ['Hộp','Box'], ['Sàn','Floor'], ['Mái','Roof']
Command3DPanel.tsx:250   disabled            ← CẢ BA
tooltip: "Chưa dựng được — hiện dùng Tường hoặc đùn từ bản vẽ"
```

Người dùng mở panel Tạo, **ba nút xám đầu tiên**, kết luận *"app chưa làm được gì"* —
trong khi đường dựng thật đã chạy tốt.

### Đối chiếu nghề

| | **SketchUp** | **3ds Max** |
|---|---|---|
| Có nút "Box"? | **Không có** — cố ý | Có (Standard Primitives) |
| Dựng khối | Rectangle · Circle · Polygon → **Push/Pull** | Box · Cylinder · Plane |
| Cấu kiện | (plugin ngoài) | **AEC Extended**: Wall · Door · Window · Stairs · Railing |
| Biến đổi | Move · Rotate · Scale · Offset · **Follow Me** | Extrude · Bevel · Lathe · **Sweep** · Loft · Boolean |
| **Nút chết** | **Không bao giờ** | **Không bao giờ** |

SketchUp **cố ý không có nút Box** — vẽ hình chữ nhật rồi push/pull **nhanh hơn** đặt hộp
rồi sửa ba kích thước. Đó là lựa chọn thiết kế, không phải thiếu sót.

### Phải làm

**a) BỎ HẲN nhóm "Khối cơ bản".** Luật nút chết sửa lại cho đúng:

| Tình huống | Xử |
|---|---|
| Một nút chết **giữa nhóm sống** | **GIỮ** + nói rõ lý do tại chỗ (luật cũ `Command3DPanel.tsx:137` vẫn đúng) |
| **Cả nhóm** chết | **BỎ NHÓM.** Đừng trưng bày cửa hàng trống |

**b) Chia lại ba nhóm theo ĐỘNG TÁC, không theo tên vật:**

```
① VẼ RỒI ĐÙN                          ← đường chính, cách SketchUp
   Rectangle · Circle · Polygon  →  Push/Pull
   (nối thẳng vào chặng Thiết kế 2D đã có — đường này ĐANG CHẠY, chỉ chưa lộ ra panel)

② CẤU KIỆN                            ← cách 3ds Max AEC
   Wall · Floor · Roof · Door · Window · Stair · Railing

③ BIẾN ĐỔI                            ← modifier, áp lên khối ĐANG CHỌN
   Extrude · Bevel · Chamfer · Array · Boolean · Mirror · Sweep
```

Ba nhóm trả lời ba câu khác nhau: **tạo từ đâu · tạo cái gì · sửa thế nào**.
Nhóm hiện tại trộn ① với ② nên không trả lời câu nào.

**Verify bằng ảnh:** mở panel Tạo → **không còn nút xám nào ở nhóm đầu tiên**.

---

## ④ THUẬT NGỮ LỆNH DỰNG HÌNH — Hoà chốt 08/08: **GIỮ TIẾNG ANH**

Chính code đã tự mâu thuẫn — nhãn nút tiếng Việt, mà phần giải thích phải mở ngoặc chú thích:

```
Command3DPanel.tsx:  "mảng (array) đã dùng được để lặp module"
Command3DPanel.tsx:  "Phào chỉ cần lệnh 'sweep' (quét tiết diện theo đường)"
```

**Lý do chốt:** `Array` · `Bevel` · `Chamfer` · `Loft` · `Sweep` · `Revolve` · `Mirror` ·
`Fillet` · `Offset` · `Extrude` · `Boolean` là **thuật ngữ nghề quốc tế**. Người dùng
3ds Max và SketchUp đọc là hiểu ngay. Dịch sang tiếng Việt bắt họ **dịch ngược trong đầu** —
làm khó đúng người biết nghề. IF là sản phẩm **global**.

Giống nốt nhạc **Do Re Mi** không dịch. Ký hiệu bản vẽ **ø · R · C.L.** không dịch.

### Cách làm

Nút ghi **tên Anh** ở dòng chính, dòng nhỏ bên dưới ghi **giải thích tiếng Việt**:

```
┌─────────────────────────┐   ┌─────────────────────────┐
│  Array                  │   │  Bevel                  │
│  lặp khối theo lưới     │   │  vát cạnh trên          │
└─────────────────────────┘   └─────────────────────────┘
```

### ⛔ RANH GIỚI — chỉ áp cho LỆNH DỰNG HÌNH

**KHÔNG đụng:** tên chặng (`Thiết kế 2D` · `Thiết kế 3D` · `Trình chiếu`) · điều hướng ·
trạng thái · câu giải thích. Những thứ đó **vẫn VI/EN theo ngôn ngữ giao diện**.

**Ghi chốt này vào `docs/00-CHOT.md`.**

---

## ⑤ DÒNG NHẬP NHANH KIỂU SKETCHUP — Hoà chốt 08/08

```
IF hôm nay    :  rời chuột → click ô → gõ → click nút     (3 lần rời tay)
SketchUp VCB  :  chọn lệnh → gõ số → Enter                 (tay không rời)
3ds Max       :  Type-in field, y hệt
```

Ô nhập của IF nằm trong panel bên — **đúng để xem lại và sửa**, **sai để thao tác nhanh**.

**Phải làm:** thêm một **dòng nhập nhỏ góc DƯỚI PHẢI khung nhìn 3D**
(giống Measurements box / VCB của SketchUp, Type-in của 3ds Max):

```
                              khung nhìn 3D
                                              ┌──────────────┐
                                              │ 1200 ▏       │
                                              └──────────────┘
                                                gõ số, Enter
```

Chọn lệnh → gõ số → `Enter`. **Tay không rời chuột.**

⚠️ **Panel bên GIỮ NGUYÊN** — nó đúng cho việc xem lại và sửa sau. Hai thứ bổ sung nhau,
không thay thế nhau.

**Verify bằng ảnh:** chạy `Array` **chỉ bằng bàn phím**, không click panel lần nào.

---

## ⑥ TÁCH HAI NÚT GÓC DƯỚI PHẢI — khác loại mà đặt cùng chỗ

| Nút | Thực chất |
|---|---|
| `Vẽ 3D` (công tắc) | **Đổi chế độ** — `3d/node` (canvas luồng) ↔ `3d/3d` (dựng khối). Xem `HomeScreen.tsx:132,155` |
| `Dựng ảnh` (nút tím) | **Hành động** — render ảnh thật từ khối. Xem `Render3DModeSkeleton.tsx:771-798` |

Một cái là **cần số**, một cái là **nút bấm**. Khác loại hoàn toàn — mà đang đặt cạnh nhau
cùng góc dưới phải, nhìn như hai nút cùng cấp.

Chuẩn nghề: SketchUp đặt công tắc chế độ **trên thanh trên**, nút xuất **trong menu File** —
không bao giờ chung một chỗ.

**Phải làm:** tách hai thứ này ra hai vùng khác nhau. Công tắc chế độ lên gần
`ModeSwitchBar`; nút hành động `Dựng ảnh` giữ nguyên chỗ nổi bật.

⚠️ Tên `"Dựng ảnh"` **giữ nguyên** — đã chốt 03/08
(`docs/CHOT-TEN-CHANG-MODE-2026-08-03.md`), không đổi thành "Dựng ảnh AI".

---

## THỨ TỰ LÀM

```
① cạnh tam giác      ← rẻ nhất, thấy kết quả ngay
② camera góc 3/4     ← sửa xong thì ViewCube tự đúng
③ bỏ nhóm chết       ← dọn trước khi thêm nhóm mới
④ thuật ngữ Anh      ← đi cùng ③, sửa một lượt
⑥ tách hai nút       ← nhẹ
⑤ dòng nhập nhanh    ← nặng nhất, làm cuối
```

## BÁO CÁO — ghi vào `docs/M-BUILD-OPS-2-OUT.md` (nối tiếp phần đã có)

Mỗi việc một mục: `file:dòng` đã sửa · **ảnh trước/sau** · mục **CHƯA VERIFY** nếu chưa đo được.

**KHÔNG commit** (V6).

---

# ⚠️ VIỆC THỨ BẢY — KHÔNG THUỘC PHIẾU NÀY

Hoà chốt 08/08: làm **Magic — mô tả ra khối, ĐƯỜNG B (mô tả → tham số)**.

```
Đường A · mô tả → HÌNH  (text-to-3D)        ✗ ĐÃ LOẠI
   "phòng ngủ hiện đại" → AI đẻ mesh
   khối hữu cơ, kích thước không chuẩn, không xuất được bản vẽ

Đường B · mô tả → THAM SỐ  (text-to-parameters)   ✓ CHỐT
   "phòng ngủ 4×5m, trần 2.8m, cửa 900 bên trái"
   → AI đọc ý định, sinh BỘ SỐ
   → lệnh dựng hình TẤT ĐỊNH chạy với bộ số đó
   tường 220mm đúng 220mm · xuất bản vẽ được · tính khối lượng được
```

Đúng luật `CHOT-TACH-AI-VA-CHINH-TAY` (01/08): **AI đoán · chỉnh tay chắc chắn — tách bằng dấu**.
Đường B để AI lo phần **đoán ý định**, phần **dựng hình vẫn tất định**.

Phễu này mang tên **`Magic`** (chốt 01/08). **Cấm chữ "tự động".**
Người dùng phải **thấy bộ số trước khi dựng**, và **sửa được từng số**.

> Đây là việc lớn, cần phiếu riêng. **`p14` KHÔNG làm trong lượt này.**
> TỔNG sẽ soạn phiếu sau khi sáu việc trên xong.
