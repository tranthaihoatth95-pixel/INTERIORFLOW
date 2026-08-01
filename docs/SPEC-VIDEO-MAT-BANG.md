# SPEC — VIDEO SINH TỪ MẶT BẰNG (bậc 1 · 2 · 4)

> **Trạng thái:** draft kỹ thuật, Hoà chốt hướng 01/08 (`CHOT-DUYET-SPEC-2026-08-01.md` §1d).
> **Phạm vi:** ba bậc **0 credit** — thứ Canva/Illustrator không làm được.
> **Không thuộc phạm vi:** bậc 5 (đẩy D5) và bậc 6 (cảnh chêm AI) — làm sau, spec riêng.
>
> **Vì sao ba bậc này là moat:** mặt bằng IF không phải hình vẽ, nó là **dữ liệu có ngữ nghĩa**.
> 🔍 `lib/cad/model.ts:78` — mỗi entity mang `elementType`: `wall · slab · column · beam · door ·
> window · furniture · space` (khớp IFC 4.0), cộng `storey` (`:162`). Canva animate được nhưng
> **không biết đâu là cửa** — vẽ mũi tên đi xuyên tường là chuyện thường. IF không thể sai vì
> tường là dữ liệu, không phải nét mực.

---

## 0 · Nguyên tắc chung cho cả ba bậc

| # | Luật | Lý do |
|---|---|---|
| 1 | **Không thêm `EntityType` mới.** Đường cam và luồng đi là `polyline`/`arrow` **đã có** (`model.ts:54-68`), phân biệt bằng **layer hệ thống** + cờ XDATA | `.idf` cũ mở vẫn chạy; DXF round-trip không vỡ (`dxf.ts:362` chỉ nhận `IF_STOREY=`/`IF_ELEMTYPE=`) |
| 2 | **Thứ tự animation suy từ `elementType`, KHÔNG từ thứ tự vẽ** | Kiến trúc sư vẽ lộn xộn; ngữ nghĩa thì không lộn |
| 3 | **Mọi bậc render được ở chặng 1 (xem thử) và xuất ở chặng 3** | Ý Hoà: "có chặng 1, đi cam trên mặt bằng, kết quả ra video ở chặng 3" |
| 4 | **Trong IF chỉ: xếp thứ tự · cắt đầu đuôi · chèn tiếng.** KHÔNG làm NLE | D5 dựng phim tốt hơn IF sẽ làm được trong 2 năm; CapCut cắt tốt hơn |
| 5 | **Tôn trọng `prefers-reduced-motion`** — dùng `guard()` đã có ở `lib/motion-apple.ts:139` | Hạ tầng sẵn, không viết lại |

⚠️ **Hai con số đừng lẫn:** metrology dùng **tầm mắt máy ảnh 1500–1600 mm** (mặc định 1550,
`lib/vision/single-view-metrology.ts`); đường cam bậc 2 dùng **tầm mắt người ~1650 mm**. Khác việc.

---

## 1 · BẬC 1 — Mặt bằng tự vẽ ra *(Draw-on plan)*

**Cái người xem thấy:** trang giấy trắng → tường mọc ra theo nét → cửa/cửa sổ khoét vào tường →
nội thất rơi xuống → kích thước và chữ hiện sau cùng. 8–15 giây.

### 1.1 · Thứ tự lớp — cố định, suy từ `elementType`

| Đợt | Gồm | Kiểu chuyển động | Thời lượng |
|---|---|---|---|
| ① Vỏ | `wall` · `column` · `slab` · **`beam`** | **vẽ nét** (`stroke-dashoffset` → 0) | 3,0 s |
| ② Lỗ mở | `door` · `window` | hiện tại chỗ + xoay cánh cửa 90° | 1,5 s |
| ③ Nội thất | `furniture` | mờ-lên + trồi 4 px — V1 rải đều; **V1.1** so le theo khoảng cách tới cửa chính | 2,5 s |
| ④ Vùng | `zone` (EntityType) và `elementType === 'space'` | tô loang từ `labelPos` ra biên | 1,0 s |
| ⑤ Ghi chú | `dim` · `text` · legend | mờ-lên, không trồi | 1,5 s |

**Mô hình thời gian — CHỐT 01/08 (sau V1):** cửa sổ **cố định theo đợt**, tổng **9,5 s** bất kể
số entity — video sản phẩm không được dài bất định (khách sạn 2000 entity và nhà 50 entity cùng
ra một video xem được). KHÔNG auto-stagger theo số lượng. Nếu sau này cần nhịp chậm/nhanh: thêm
**hệ số tempo** (0,75× · 1× · 1,5×) nhân vào cả bảng, không đổi cấu trúc.

> Đính chính lịch sử: `beam` vốn bị bảng này bỏ sót (lỗ hổng spec, code chính phát hiện khi làm
> V1 — commit `d51a2cb`); `space`→④ và mô hình cửa sổ cố định do code chính đề xuất, Cowork duyệt.

Entity **không có `elementType`** (file cũ) → xếp vào đợt ① nếu nằm trên layer nét dày theo
ISO 128, ngược lại đợt ⑤. Không bao giờ bỏ sót entity.

### 1.2 · Cắm vào code đã có

🔍 `lib/present-editor/motion-present.ts:153` `computeElementRevealTimings()` đã giải đúng bài
"nhiều phần tử, mỗi phần tử một mốc bắt đầu". **Tái dùng, không viết hàm mới** — chỉ thêm một
bộ chuyển `Entity[] → RevealGroup[]` theo bảng trên. Easing lấy `easeApple` (`lib/motion.ts:18`).

### 1.3 · Vẽ nét (draw-on) làm thế nào

Mỗi `line`/`polyline`/`arc` xuất ra một `<path>` SVG; đặt `stroke-dasharray = pathLength`,
animate `stroke-dashoffset` từ `pathLength` về `0`. Độ dày nét lấy đúng **lineweight ISO 128 của
layer** (`dxf.ts:138` đã đọc group 370) — video giữ nguyên quy chuẩn bản vẽ, không "làm đẹp" lệch chuẩn.

`hatch` và `zone` **không vẽ nét** — chúng tô, dùng `clip-path` quét.

---

## 2 · BẬC 2 — Đường cam vẽ TRÊN MẶT BẰNG ⭐ *(ý Hoà)*

**Luồng:** chặng 1 (CAD) vẽ đường đi → chặng 3 (Present) ra video.

### 2.1 · Đường cam là gì trong dữ liệu

Một `polyline` nằm trên **layer hệ thống `IF_CAMPATH`**, mang XDATA `IF_CAMPATH=1`.
Không phải `EntityType` mới ⇒ file cũ không vỡ, và khi xuất DXF cho bên ngoài thì nó chỉ là một
polyline trên một layer — mở bằng AutoCAD vẫn hiểu.

| Thuộc tính | Nguồn | Mặc định |
|---|---|---|
| Đường đi (x, y) | đỉnh polyline | — |
| Cao độ mắt | `storey` của polyline + tham số | **1650 mm** |
| Hướng nhìn | tiếp tuyến của đường tại điểm đó | tự động |
| Ống kính · tỉ lệ khung | 🔍 `lib/three/camera.ts:36-37` `CAMERA_LENSES` · `CAMERA_RATIOS` | `35mm` · `16:9` |
| Tốc độ đi | mm/giây | 1200 mm/s (~tốc độ đi bộ chậm) |

**Điểm ngắm (look-at) — ba chế độ**, chọn trên panel:

1. **Đi tới đâu nhìn tới đó** (tiếp tuyến) — mặc định, giống người đi.
2. **Khoá vào một điểm** — kéo một chốt trên mặt bằng; cam đi mà mắt luôn nhìn chốt đó.
   *(Đây là cú máy dân kiến trúc hay dùng để "giới thiệu" một mảng tường/quầy lễ tân.)*
3. **Khoá vào một `zone`** — nhìn tâm polygon của vùng.

### 2.2 · Từ đường cam ra khung hình

🔍 `lib/three/camera.ts:119` `placeCamera(bbox, spec)` đã có sẵn, trả `PlacedCamera`.
Việc mới **chỉ là** lấy mẫu đường theo thời gian rồi gọi hàm đó từng bước:

```
lấy mẫu đều theo ĐỘ DÀI (không theo số đỉnh) → mỗi mẫu 1 CameraSpec
→ làm mượt hướng nhìn bằng trung bình trượt (tránh giật ở góc gấp)
→ placeCamera() từng mẫu → chuỗi khung
```

Làm mượt là bắt buộc: polyline vẽ tay có góc 90°, cam quay tức thời 90° thì người xem chóng mặt.
Bo góc bằng **cung tròn bán kính 600 mm** ở mỗi đỉnh trước khi lấy mẫu.

### 2.3 · Ba mức đầu ra — cùng một đường cam

| Mức | Ra cái gì | Chi phí |
|---|---|---|
| **2-a** | **Mặt bằng 2D, khung nhìn chạy** — mặt bằng đứng yên, một hình quạt tầm nhìn trượt theo đường, kèm chấm định vị | 0 credit |
| **2-b** | **Dựng khối 3D thô** (tường đùn lên theo `storey`, không vật liệu) — cam đi xuyên trong đó | 0 credit, CPU/GPU máy |
| **2-c** | Bàn giao đường cam cho **D5** → render thật → nhập phim về | bậc 5, giờ GPU |

**Làm 2-a trước.** Nó rẻ nhất, và với hồ sơ thiết kế nó thường là thứ *đúng* hơn: khách hiểu
"đi từ sảnh qua bếp ra ban công" rõ hơn khi thấy đường đi trên mặt bằng, chứ không phải một cú
bay 3D mất phương hướng.

⚠️ **Rủi ro 2-b:** đùn khối 3D là **cửa ngõ dẫn tới làm một engine 3D**. Chốt cứng phạm vi:
tường xám, sàn xám, không vật liệu, không đèn, không bóng đổ. Vượt quá ⇒ đó là việc của D5.

---

## 3 · BẬC 4 — Luồng giao thông ⭐⭐ *(moat mạnh nhất)*

**Cái người xem thấy:** mặt bằng tĩnh, các chấm/mũi tên chạy theo lối đi thật — vào cửa chính,
qua hành lang, rẽ vào phòng. Dùng để chứng minh **công năng**, không phải để khoe đẹp.

### 3.1 · Vì sao chỉ IF làm được

Cần biết ba thứ, cả ba đều **đã nằm trong dữ liệu**:

| Cần | Lấy ở đâu |
|---|---|
| Chỗ đi được | `zone`/`space` polygon (🔍 `geometry.ts:92`) trừ đi vùng `furniture` |
| Chỗ chui qua được | entity `elementType === 'door'` — **vị trí + bề rộng** |
| Chỗ không qua được | `wall` · `column` |

Canva phải tách lớp thủ công và vẫn **không biết đâu là cửa**. Đây là chỗ chênh lệch không thể
bắt chước bằng công cụ đồ hoạ.

### 3.2 · Cách tính lối đi

Không cần thuật toán nặng. Đủ dùng:

```
① mỗi zone → 1 nút, đặt tại trọng tâm polygon
② mỗi door nằm trên biên chung 2 zone → 1 cạnh nối 2 nút đó
③ tìm đường ngắn nhất trên đồ thị nút-cạnh (Dijkstra, vài chục nút)
④ đường thô = trọng tâm → cửa → trọng tâm; bo góc rồi vẽ
```

Bước ④ là chỗ dễ ra kết quả xấu: đi thẳng từ tâm phòng tới tâm cửa sẽ **cắt qua bàn ghế**.
Cách rẻ: đẩy đường ra khỏi bbox `furniture` bằng vài lần nới biên, **không** làm lưới né vật cản
đầy đủ. Nếu vẫn xấu, cho phép kéo tay một điểm giữa — kiến trúc sư sửa 5 giây, không cần AI.

### 3.3 · Ba kịch bản dựng sẵn

| Kịch bản | Đường | Dùng để nói gì |
|---|---|---|
| **Khách** | cửa chính → sảnh → khu chính | trải nghiệm người dùng |
| **Nhân viên** | cửa phụ → khu kỹ thuật → khu phục vụ | vận hành |
| **Thoát hiểm** | mọi zone → lối thoát gần nhất | **an toàn — thứ hồ sơ thẩm duyệt cần** |

Kịch bản thoát hiểm có giá trị nghề cao nhất và chạy bằng đúng đồ thị trên, chỉ đổi điểm đích.

---

## 4 · Ghép lại — chặng 3 làm gì

Ba bậc trên sinh ra **đoạn phim rời**. Trong Present, mỗi đoạn là **một slide có kiểu `motion`**,
tái dùng `slideVariants()` (🔍 `motion-present.ts:37`) để chuyển cảnh.

Trong IF **chỉ ba nút**: đổi thứ tự · cắt đầu-đuôi · chèn tiếng. Xuất ra `.mp4`.
🔴 Không thêm timeline nhiều lớp, không keyframe tay, không hiệu ứng chuyển cảnh ngoài danh sách
`TRANSITION_OPTIONS` đã có. **Trình dựng phim tự nó là một sản phẩm riêng** — sa vào đó là rút
người khỏi CAD và Present khi cả hai chưa xong.

---

## 5 · Thứ tự thi công đề nghị

| Đợt | Việc | Vì sao trước |
|---|---|---|
| **V1** | Bậc 1 — draw-on mặt bằng | Không cần dữ liệu mới, chỉ cần bộ chuyển `Entity[] → RevealGroup[]` |
| **V2** | Bậc 2 mức 2-a — layer `IF_CAMPATH` + hình quạt tầm nhìn chạy trên mặt bằng 2D | Đóng đúng vòng Hoà nêu: vẽ ở chặng 1, xem ở chặng 3 |
| **V3** | Bậc 4 — đồ thị zone-door + 3 kịch bản | Giá trị nghề cao nhất, nhưng cần zone đã được gán tử tế |
| **V4** | Bậc 2 mức 2-b — khối 3D thô | Chỉ làm nếu V2 chứng minh có người dùng thật |

---

## 6 · Rủi ro — nêu trước, không giấu

| # | Rủi ro | Cách chặn |
|---|---|---|
| 1 | 🔴 **Trượt vào làm NLE / engine 3D** | §0 luật 4 và §2.3 đã chốt phạm vi bằng chữ. Vượt ⇒ dừng, hỏi |
| 2 | 🔴 **Bậc 4 phụ thuộc zone được gán đúng** — mặt bằng chưa gán `space`/`zone` thì không có đồ thị | V3 phải có bước "kiểm mặt bằng đủ điều kiện" và **nói rõ thiếu gì**, không im lặng ra kết quả rỗng |
| 3 | 🟡 Đường đi cắt qua nội thất | Cho kéo tay điểm giữa (§3.2). Không xây lưới né vật cản |
| 4 | 🟡 Xuất `.mp4` trong Electron cần ffmpeg | Đo dung lượng bản cài **trước** khi hứa tính năng |
| 5 | 🟡 Mặt bằng nhiều tầng (`storey`) | V1/V2 làm **một tầng một lần**. Đa tầng để sau |

---

*Cowork ghi 01/08/2026, cập nhật sau V1 (`d51a2cb`). Mọi trích dẫn `file:dòng` đọc trong lượt này.*

**Số đã đo (V1):** 🧮 `planDrawOn()` trên ~2000 entity = **2,27 ms** — tính timing KHÔNG phải chỗ
nghẽn. 💭 **Chỗ nghẽn CHƯA đo nằm ở phần C:** ~2000 animation `stroke-dashoffset` chạy đồng thời
trên GPU. Phần C bắt buộc đo FPS trên mặt bằng 2000 entity; nếu tụt dưới 30fps thì gộp entity cùng
layer thành một `<path>` ghép (batching) trước khi nghĩ tới cách khác.*
