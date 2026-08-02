# SPEC · PANEL THÒ THỤT & NGÔN NGỮ ÍT CHỮ — TOÀN HỆ IDF
**Ngày:** 03/08/2026 · **Trạng thái:** CHỐT · **Tầng:** T1 lõi
**Nối:** `SPEC-HA-TANG-UI-IF` (6 ổ · sổ lệnh · schema) · `SPEC-HOVER-FOCUS-IDF` · `SPEC-MAT-DO-CON-TRO`

> Hoà 03/08: *"nghiên cứu 3dsmax, SketchUp, V-Ray, D5, Blender, Rhino để người dùng dễ thao tác.
> Tab cho phép ẩn hiện kéo thả. Hạn chế giao diện chữ. Học mỗi app một chút, ai làm tốt cái gì thì học.
> Apple làm rất tốt việc tạo cảm hứng."*

---

## 1 · NGHIÊN CỨU — ai làm tốt cái gì

| App | Làm tốt nhất | Học gì | Lỗi họ mắc — né |
|---|---|---|---|
| **3ds Max** Command Panel | **Rollout**: bấm cả thanh tiêu đề để thu/mở · kéo tiêu đề để đổi thứ tự, có **bóng mờ theo chuột + vạch xanh chỉ chỗ thả** · kéo mép panel rộng ra thì rollout **tự chia 2–3 cột** · kéo nền trống để cuộn | Cả 4 cơ chế | Trạng thái thu/mở lưu **theo từng sub-object mode** → panel nhảy loạn khi đổi chế độ, là than phiền lớn nhất. Open All/Close All giấu trong chuột phải, không ai tìm ra |
| **Blender** N-panel | **Tách rõ 2 việc**: `::::` grip để kéo đổi thứ tự · bấm tiêu đề chỉ để thu/mở. Ctrl-bấm = mở cái này thu hết cái khác. Kéo quét ngang nhiều tiêu đề = thu/mở hàng loạt. **Ghim panel** để nó hiện ở mọi tab | Grip riêng · solo · ghim · `bl_order` cho mặc định + người dùng kéo đè | Tab dọc chữ xoay, nhiều add-on thì **co lại không đọc nổi**; không cho đổi tên/gộp tab |
| **Rhino** Properties | **Dải icon trang đổi theo vật đang chọn** — mỗi lúc chỉ 1 trang, tập trang = hợp lệ cho selection. Không chọn gì → hiện thuộc tính khung nhìn | **Đây là lời giải tốt nhất cho "mỗi loại vật một bộ thuộc tính"** — ít cuộn dọc, ít nhảy layout | Auto-hide làm **đóng luôn hộp thoại con**, nhấp nháy |
| **SketchUp** Tray | Kéo tiêu đề đổi chỗ · nhiều khay · phím tắt riêng cho từng khay | Phím tắt cho từng panel | Nút ghim auto-hide **quá nhỏ, không nhãn**; khay thu rồi vẫn chiếm chỗ |
| **Apple** | Cảm hứng: khoảng thở, chuyển động có ý, chất liệu, **không viền quanh mọi thứ** | Giữ nguyên `SPEC-APPLE-MOTION-MATERIAL` | — |

**Điểm khớp quan trọng:** rollout kéo-thả chính là **adaptable** — thứ Findlater CHI 2004 đo được là **thắng** (người dùng tự sắp đạt chất lượng ngang chuyên gia, 55% thích nhất). Còn máy tự sắp là **adaptive** — thua cả tốc độ lẫn cảm nhận. Vậy: **cho người dùng kéo, cấm máy tự đổi.**

---

## 2 · LUẬT PANEL IDF

### 2a · Rollout — 3 cơ chế, không hơn
1. **Bấm cả thanh tiêu đề** = thu/mở. Hit target lớn, không phải chevron bé.
2. **Grip `⠿` bên phải tiêu đề** = kéo đổi thứ tự. Tách khỏi (1) để không mơ hồ — luật Blender.
   Khi kéo: **bóng mờ theo chuột + vạch accent 2px chỉ chỗ thả** — luật 3ds Max.
3. **Chuột phải tiêu đề** = `Mở hết · Thu hết · Chỉ mở cái này · Đặt lại thứ tự`.
   ⚠️ Phải có **nút nhìn thấy được** cho "Thu hết", không giấu trong chuột phải (lỗi 3ds Max).

### 2b · Ghi nhớ trạng thái — khoá theo LOẠI VẬT, không theo chế độ con
Lưu `{thứ tự rollout, cái nào đang mở}` khoá theo **loại đối tượng** (tường · đồ nội thất · đèn · vùng · trang · khối 3D).
**CẤM** khoá theo sub-mode — đó đúng là lỗi làm panel 3ds Max nhảy loạn.
Luôn có **"Đặt lại bố cục panel"** nhìn thấy được trong Cài đặt.

### 2c · Loại vật khác nhau → dùng DẢI TRANG, không phải chồng rollout
Học Rhino. Inspector có **dải icon trang** ở đầu, đổi theo vật đang chọn:
- chọn tường → trang `Kích thước · Vật liệu · Nguồn`
- chọn đèn → thêm trang `Ánh sáng`
- chọn vùng → thêm trang `Khối lượng`
- **không chọn gì → thuộc tính bản vẽ/khung nhìn**, không phải panel trống
Chọn nhiều loại khác nhau → chỉ hiện trang **chung** của tất cả.
Lý do: người làm nội thất nhảy giữa sofa ↔ tường ↔ đèn liên tục; chồng rollout thì cuộn mệt và layout nhảy.

### 2d · Ghim (pin) — rẻ mà được yêu nhất
Cả 3ds Max (`Pin Stack`) lẫn Blender (`pin panel`) đều có, và đều được khen. IF làm:
**ghim panel** → nó ở lại dù đổi vật đang chọn hoặc đổi tab. Icon ghim ở tiêu đề.

### 2e · Cột tự chia
Kéo Navigator/Inspector rộng ra thì rollout **tự chia 2 cột** khi vượt ngưỡng. Không có nút "chế độ rộng".
⚠️ **Mọi panel phải cùng một hợp đồng bề rộng** — 3ds Max để vài rollout hard-code width nên cột lởm chởm.

### 2f · Thu gọn — làm kiểu 3ds Max "Minimize", không làm auto-hide
Auto-hide là thứ **bị chửi nhiều nhất** trong cả 4 app (Rhino đóng luôn hộp thoại con, SketchUp nhấp nháy).
IF làm: thu về **dải dọc mỏng CÓ NHÃN**, hover mới hé ra. Rõ ràng, có chủ đích, không tự động.
Kèm **một phím tắt bật/tắt** cho mỗi panel.

---

## 3 · HẠN CHẾ CHỮ — bảng thay thế

Hoà chỉ đúng: Inspector Vẽ 3D đang toàn chữ (`Đổ bóng: Có` · `Nhận bóng: Có`). Thay bằng:

| Đang là chữ | Thay bằng | Học từ |
|---|---|---|
| `Đổ bóng: Có` / `Nhận bóng: Có` | **2 icon bật/tắt** (bóng đổ · bóng nhận), sáng = bật, mờ = tắt | bóng đèn của 3ds Max, mắt/máy ảnh của Blender |
| `Trạng thái: Đồng bộ` | **chấm tròn màu** + tooltip; xanh = đồng bộ, cam = đã tách | — |
| `Xuất sang: D5 · V-Ray giữ nguyên` | **3 chip logo nhỏ** `IF · V-Ray · D5`, cái nào giữ được thì sáng | — |
| `Sửa ở đây: tách khỏi bản vẽ` | **icon xích đứt** + màu `--warning`, không cần câu chữ | — |
| `Tầng: Trệt · +0` | **ô chọn tầng dạng chồng lớp** nhỏ, bấm ra danh sách | — |
| `Nét: liền` | **vẽ thẳng kiểu nét** trong ô chọn, không viết chữ "liền/đứt/chấm" | AutoCAD |
| `Lớp: Tường` | **chấm màu lớp + tên**, không nhãn "Lớp:" | Figma |
| Nhãn `R · C · X · Y` | giữ chữ — đây là **thuật ngữ nghề**, đổi thành icon mới là kỳ | — |

**Luật chữ:**
1. **Nhãn hàng bỏ được thì bỏ.** `Dài | 5 200` → `⟷ 5 200`. Đơn vị hiện khi hover hoặc khi focus ô.
2. **Trạng thái nói bằng MÀU + HÌNH, không bằng câu.** Chữ chỉ để trong tooltip.
3. **Bật/tắt luôn là icon**, không phải chữ Có/Không.
4. **Số giữ nguyên chữ số** — không icon hoá con số. Người vẽ đọc số.
5. Mỗi icon **bắt buộc có tooltip tiếng Việt + phím tắt** (luật `SPEC-HOVER-FOCUS-IDF` §1 kiểu *trễ*).

---

## 4 · PHÍM TẮT — bảng chốt toàn hệ

Sinh từ **sổ lệnh** (`SPEC-HA-TANG-UI-IF` Trụ 2), khai một lần, hiện ở tooltip + chuột phải + palette.

### 4a · Toàn app (mọi chặng, mọi mode)
| Phím | Việc |
|---|---|
| `⌘K` | Bảng lệnh (gõ tên việc) |
| `L` | Thư viện |
| `B` | Thu/mở Navigator trái |
| `I` | Thu/mở Inspector phải |
| `⌘\` | Ẩn cả hai panel — chỉ còn bàn làm việc |
| `⌘1 ⌘2 ⌘3` | Sang chặng Vẽ · Dựng ảnh · Trình bày |
| `⌘,` | Cài đặt |
| `⌘Z / ⇧⌘Z` | Hoàn tác · làm lại |
| `Esc` | Đóng sheet/popover · bỏ chọn |
| `Space` (giữ) | Tạm sang công cụ kéo màn |

### 4b · Chặng Vẽ
`V` chọn · `L` đường ⚠️ **đụng phím Thư viện** → xem 4e · `PL` đa tuyến · `REC` chữ nhật · `C` tròn · `D` kích thước · `T` chữ · `ROOM` vùng · `F8` Ortho · `F12` nhập số · `⌘G` nhóm

### 4c · Chặng Dựng ảnh
`V` chọn · `N` khối mới · `Space` chạy khối đang chọn · `⌘⏎` chạy cả chuỗi · `M` bảng cảm hứng
**Mode Vẽ 3D:** `G` di chuyển · `R` xoay · `E` kéo cao · `M` gán vật liệu · `C` đặt máy quay · `Numpad 0` nhìn qua máy · `Numpad 1/3/7` mặt trước/phải/trên *(chuẩn Blender, dân 3D đã quen)*

### 4d · Chặng Trình bày
`V` chọn · `T` chữ · `R` khung ảnh · `⌘D` nhân bản · `⌘⇧K` trang mới · `⌘⏎` trình chiếu

### 4e · Xử va phím `L`
`L` = đường (AutoCAD) **và** `L` = Thư viện. Chốt: **trong chặng Vẽ, `L` là đường** (muscle memory AutoCAD mạnh hơn), Thư viện đổi thành **`⇧L`** ở chặng đó. Hai chặng kia `L` vẫn là Thư viện.
Sổ lệnh có `when` nên xử được chuyện này bằng khai báo, không cần if lồng nhau.

---

## 5 · ÁP CHO CHẶNG TRÌNH BÀY *(Hoà chỉ định 03/08)*
Chặng 3 là nơi rollout hợp nhất, vì mỗi loại hồ sơ cần bộ card khác nhau:

| Loại hồ sơ | Rollout trong Inspector |
|---|---|
| Deck | Bố cục · Kiểu chữ · Lưới cột · Nguồn nội dung · Hoạt cảnh |
| Bảng vật liệu A3 | Lưới ô · Nhãn hiện gì · Nguồn ATLAS · Khổ in |
| BOQ | Cột hiện · Công thức · Nguồn bản vẽ · Định dạng số |
| Văn bản | Kiểu đoạn · Song ngữ · Đầu/chân trang · Mục lục |
| Video | Clip · Nhạc · Nhịp cắt · Chữ · Chỉnh màu |

Người dùng kéo rollout hay dùng lên trên, thu cái không dùng — **nhớ theo từng loại hồ sơ** (§2b).

---
**Nguồn:** [3ds Max Command Panel](https://help.autodesk.com/cloudhelp/2025/ENU/3DSMax-Basics/files/GUID-E3CB809D-94ED-4C30-892B-1D12B8721EA5.htm) · [3ds Max rollout — Special Controls](https://help.autodesk.com/cloudhelp/2026/ENU/3DSMax-Basics/files/GUID-FD2F49B2-B86F-445B-AE4B-03F020671485.htm) · [3ds Max Customization](https://help.autodesk.com/cloudhelp/2025/ENU/3DSMax-Customizing/files/GUID-E625E116-6070-4A02-9A31-672BA6A0A954.htm) · [Blender Tabs & Panels](https://docs.blender.org/manual/en/latest/interface/window_system/tabs_panels.html) · [Blender Regions](https://docs.blender.org/manual/en/latest/interface/window_system/regions.html) · [Rhino Properties](https://docs.mcneel.com/rhino/mac/help/en-us/commands/properties.htm) · [Rhino Containers](http://docs.mcneel.com/rhino/8/help/en-us/toolbarsandmenus/customize_containers.htm) · [SketchUp Trays](https://help.sketchup.com/en/sketchup/managing-dialog-boxes-windows) · [Findlater & McGrenere CHI 2004](https://dl.acm.org/doi/10.1145/985692.985704)
