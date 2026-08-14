# WF · ĐỒ THỊ DIỆN (surface graph) — wireframe + định biên theo diện → hệ định vị → nét·màu·vật liệu

> Phiếu: `docs/phieu-giao/wireframe-dien.md` · Hoà chỉ đạo 14/08: *"áp dụng thuật toán wireframe,
> định biên theo diện. Chia lưới xác định lại hệ giá trị cần để định vị đúng. Phần cấu kiện vật
> liệu định nghĩa NÉT → MÀU → VẬT LIỆU."*
> Đầu vào: `scratchpad/lincoln-327.glb` (Trellis GỐC, 15.538 tam giác, 1 khối liền, atlas 1024²).

## 0 · Kết quả một dòng
Mesh máy sinh được đọc thành **62 diện** có tham số hình học, biên diện dựng ra **wireframe đọc
được bằng mắt là cái ghế bar** (không phải point cloud), và chuỗi NÉT→MÀU→VẬT LIỆU trả về **21 cụm
cấu kiện vật liệu** — trong đó **3 chân trụ Ø38–43mm cao 940mm** là số đo THẬT, dùng được ngay.

## 1 · File ra (scratchpad, mở soi được)
| File | Nội dung |
|---|---|
| `lincoln-wireframe.svg` / `.png` | 3 hình chiếu (đứng·cạnh·bằng), nét = biên diện, màu nét theo LOẠI diện |
| `lincoln-wireframe-sach.svg` / `.png` | như trên nhưng **bỏ 2 diện nghi bóng sàn** — bản dễ đọc nhất |
| `lincoln-wireframe-mau.svg` | cùng nét, màu nét = MÀU VẬT LIỆU suy được (soi nhanh cụm vật liệu) |
| `lincoln-surface-graph.json` | 62 diện: loại · tham số · RMS · frame · lưới · polyline biên · màu · vật liệu · kề bên |
| `lincoln-dien.obj` + `.mtl` | 15.538 mặt, **62 group `g dien_<id>_<loại>`**, 62 material theo màu diện |
| `wf-proof.ts` · `wf-sweep.ts` · `wf-sweep2.ts` | script chạy lại + quét tham số (`NODE_PATH=<repo>/node_modules sucrase-node …`) |

Code: `lib/idfc-import/surface-graph.ts` (MỚI, 1.300 dòng) · test `lib/idfc-import/surface-graph.test.ts`
(**55 pass · 0 fail**) · `tsc --noEmit` **0 lỗi** · `chuan-net.test.ts` 58 pass + `from-photo.test.ts`
26 pass **không chạm** (file khác). Không đụng `chuan-net.ts` / `from-photo.ts` / `components/**`;
`lib/cad/materials` + `lib/materials/pbr-from-category` CHỈ GỌI.

## 2 · Số của từng bước [T6]

### ① Chuẩn hoá
```
tam giác 15.538 → 15.538 (suy biến 0)
đỉnh    11.481 → 11.481 (không gian XUẤT: pos+uv)   ·  lớp vị trí 7.725 (không gian TOPOLOGY)
cạnh    23.307 · hở 0 · không manifold 0            ·  diện tích 2,574 m²
bbox    (−328,−555,−325) → (324, 555, 322) mm       ·  chéo 1.441 mm   [scale hMm=1110 từ .idfc]
```
**Hai không gian đỉnh là điểm mấu chốt** (bài học CN-F1): weld theo *vị trí+UV* để giữ seam UV
(11.481 đỉnh, texture không xé); weld theo *vị trí* để nối topology (7.725 lớp — chênh 3.756 đỉnh
chính là các seam UV). Nếu nối tam giác bằng không gian đầu, mesh tự đứt dọc mọi seam và mọi vùng
vỡ vụn. Test ① khoá cả hai chiều.

### ② Phân vùng theo diện — góc NHỊ DIỆN, không phải góc so với pháp tuyến trung bình
Region growing gộp 2 tam giác kề khi góc pháp tuyến < 15°. **Cố ý so hàng-xóm-với-hàng-xóm**: nếu
so với pháp tuyến trung bình của vùng thì mặt trụ (pháp tuyến quét 360°) bị băm thành dải, không
bao giờ fit ra trụ được.

| góc ngưỡng | chart thô | sau gộp vụn (0,3%) | chart lớn nhất |
|---:|---:|---:|---:|
| 5° | 7.390 | 81 | 16,2% |
| 12° | 3.132 | 61 | 16,2% |
| **15°** | **2.100** | **44** | **16,3%** |
| 20° | 1.148 | 28 | 29,8% |
| 25° | 581 | 10 | 59,3% |
| 35° | 185 | 2 | 67,6% |

Từ 20° trở lên vùng bắt đầu **nuốt cả ghế thành một khối** ⇒ 15° là mốc mặc định.

### ③ Phân loại + chia lại
```
62 diện · 13 lần chia lại (diện freeform > 2% diện tích thì cắt đôi theo pháp tuyến, tối đa 3 tầng)
planar       20 diện · 50,7% diện tích
cylindrical   8 diện · 12,3%
toroidal      0 diện ·  0,0%
freeform     34 diện · 37,0%   (RMS min/median/max = 1,02% / 1,99% / 3,76%)
```
Quét tham số (`wf-sweep.ts`), cột "diện":

| góc | tol RMS | diện | planar | cyl | tor | free | polyline |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 8° | 1% | 84 | 20 | 17 | 0 | 47 | 107 |
| 12° | 1% | 75 | 28 | 12 | 0 | 35 | 100 |
| **15°** | **1%** | **62** | **20** | **8** | **0** | **34** | **82** |
| 15° | 0,5% | 67 | 13 | 8 | 0 | 46 | 85 |
| 15° | 2% | 52 | 39 | 5 | 0 | 8 | 71 |
| 25° | 1% | 31 | 11 | 3 | 0 | 17 | 42 |

**Trụ tìm được — số đo dùng được ngay:**

| diện | bán kính | cao | phủ góc | RMS |
|---|---:|---:|---:|---:|
| #3 chân | 21,3 mm | 939,3 mm | 356° | 0,75% |
| #4 chân | 19,0 mm | 941,7 mm | 356° | 0,45% |
| #8 chân | 16,4 mm | 936,5 mm | 351° | 0,51% |
| #41 · #45 · #52 thanh giằng/gác chân | 12,6–14,0 mm | 305–317 mm | 176–244° | 0,69–0,97% |
| #51 | 736,5 mm | 92,9 mm | 23° | 0,70% |

⚠️ #51 (R 736mm, phủ 23°) **không phải cái ống** — đó là *tấm cong thoải* mà fit trụ vẫn đúng về
toán. Đúng nghĩa hình học, dễ gây hiểu nhầm khi đọc bảng ⇒ ghi rõ ở đây; đề xuất về sau tách nhãn
`cylindrical` thành *ống* (phủ ≥180°) và *tấm cong* (phủ nhỏ, R lớn).

**0 xuyến** — ghế Lincoln không có vòng tròn kín nào (vòng gác chân là 4 thanh thẳng nối, không
phải vành khuyên). Đây là kết quả ĐÚNG, không phải fit hỏng: test ③ chứng minh xuyến tổng hợp
R=120/r=25 ra đúng ±1%.

**Freeform khai thật, cấm ép** [T0] — mỗi diện có lý do kèm SỐ, ví dụ nguyên văn trong JSON:
`"không primitive nào dưới 1.0% bbox diện — tốt nhất: phẳng 1.88% · trụ 4.07% · xuyến 6.64%"`.
34/62 diện là freeform (37% diện tích) = phần nệm, tay vịn cong, lưng ghế uốn — **đúng bản chất đồ
nội thất**, không phải thất bại của thuật toán.

### ④ Nét = biên diện
```
1.797 cạnh đặc trưng → 82 polyline → Douglas-Peucker (0,5% chéo bbox): 3.676 → 1.176 điểm (−68%)
```

### ⑤ Hệ định vị + lưới
Mỗi diện có frame cục bộ {tâm, e1, e2, e3=pháp tuyến/trục} + bbox cục bộ u×v×w. Diện phẳng chia
lưới (nu×nv, bước 5% chéo bbox — vd diện #0 `12×12`, #7 `14×5`); diện trụ chia (dọc trục × cung);
freeform/xuyến giữ tam giác nhưng **vẫn có frame + bbox** nên vẫn định vị được (test ⑦ khoá điều này).

### ⑥ NÉT → MÀU → VẬT LIỆU
Màu = trung vị từng kênh texel atlas theo UV, 4 mẫu/tam giác (trọng tâm + 3 điểm co 35% về trọng
tâm để không dính viền atlas), bỏ 10% mẫu xa trung vị.

**Top 8 diện lớn:**

| id | loại | %dt | tri | RMS% | màu | họ VL | preset gần nhất (ΔRGB) |
|---:|---|---:|---:|---:|---|---|---|
| 0 | planar | 16,2 | 273 | 0,11 | `#3c2c1c` | gỗ | san-go-oc-cho (35) — **bóng sàn** |
| 1 | planar | 16,2 | 301 | 0,15 | `#040403` | vải/da | da-granite-den (43) — **bóng sàn** |
| 2 | freeform | 4,5 | 452 | 1,88 | `#906c3c` | gỗ | gach-bong (51) |
| 3 | cylindrical | 3,9 | 1086 | 0,75 | `#423023` | gỗ | san-go-oc-cho (26) |
| 4 | cylindrical | 3,7 | 1025 | 0,45 | `#423022` | gỗ | san-go-oc-cho (26) |
| 5 | planar | 3,5 | 275 | 0,96 | `#4d2f16` | gỗ | san-go-oc-cho (23) |
| 6 | freeform | 3,2 | 161 | 1,17 | `#866234` | gỗ | gach-bong (40) |
| 7 | planar | 2,7 | 669 | 0,67 | `#3a291e` | gỗ | da-granite-den (33) |

**21 cụm cấu kiện vật liệu** (diện KỀ NHAU + cùng họ + ΔRGB < 18 thì gộp):
`#0 gỗ #423023 25,2% (19 diện)` · `#3 gỗ #906c3c 6,4%` · `#6 vải/da #26160b 3,9%` ·
`#15 kim loại #9d7940 1,3%` …

Phân bố: **gỗ 50 diện / 75,3% · vải/da 11 diện / 23,4% · kim loại 1 diện / 1,3%**.
Đối chiếu `.idfc` khai từ ảnh gốc (*Matte Walnut Wood · Polished Brass · Fabric*): **trúng cả 3 họ**,
nhưng **đồng thau bị đếm thiếu nặng** — xem §4.

## 3 · Nghiệm thu bằng MẮT (bắt buộc theo phiếu)
Đã tự mở `lincoln-wireframe-sach.png` soi. **Đọc ra hình ghế bar, không rối như point cloud**:
- *Hình đứng*: tựa lưng, 2 tay vịn, mặt ngồi, 4 chân cao vươn xuống, thanh gác chân ngang — đúng dáng.
- *Hình cạnh*: profile ghế bar rõ (lưng ngả, vòng tay vịn tròn, chân xiên ra sau) — nhận ra ngay.
- *Hình bằng*: đường bao mặt ngồi + 4 chân + 2 thanh giằng chéo.
Tự chấm: **đạt** cho mục đích "đọc được hình" và "định biên theo diện". Chưa đạt mức bản vẽ kỹ
thuật: nét biên vùng freeform còn lắt nhắt (đường viền các mảng nệm), chưa gộp thành đường bao trơn.

## 4 · Nói thẳng — cái CHƯA làm / làm chưa tới
1. **BÓNG SÀN chiếm 32,4% tổng diện tích.** Trellis nướng vệt bóng dưới chân ghế thành 2 tấm phẳng
   ~890×880mm nằm sát đáy bbox (diện #0 và #1 — hai diện LỚN NHẤT của cả mesh). Module **chỉ GẮN
   CỜ `nghiVanBongSan`, KHÔNG tự xoá** (khai thật, để phía gọi quyết). Hệ quả phải nhớ: mọi con số
   `%dt` ở trên đều tính trên tổng CÓ bóng sàn — muốn tỉ lệ vật liệu thật thì bỏ 2 diện đó rồi chia lại.
2. **Đồng thau bị đếm thiếu** (1,3% thay vì mảng chi tiết thật). Vì luật suy họ vật liệu chỉ nhìn
   MÀU + hình học, mà gỗ óc chó và đồng thau nằm chung dải sắc 12–45°. Đây là giới hạn của "suy từ
   một tấm ảnh atlas", không sửa được bằng chỉnh ngưỡng — cần thêm tín hiệu (độ bóng/roughness map,
   hoặc người xác nhận). Toàn bộ output đã cắm cờ `inferred: true`, không chỗ nào khai chắc chắn.
3. **`matId` = null ở TẤT CẢ diện** — không bịa. Lý do thật: kho preset `lib/cad/materials`
   MATERIALS (13 preset) **chưa preset nào khai trường `matId`**, và cả 13 đều là vật liệu SÀN/TƯỜNG
   nên với đồ rời chỉ dùng được như "màu gần nhất" (ΔRGB 13–51, khá xa). Muốn nối thật phải có kệ
   preset cho furniture/millwork trong `.idfc` — việc của phiếu Thư viện, không phải phiếu này.
4. **Chưa có `spherical`.** Mặt cầu hiện rơi vào `freeform` (test ⑦ khoá: KHÔNG được ép thành xuyến —
   đã phải thêm chặn `rLon > rNho×1,05`, nếu không mặt cầu "fit xuyến hoàn hảo" về mặt toán).
5. **Lưới có cấu trúc mới ra SỐ (nu×nv×bước), chưa sinh đỉnh lưới thật** — đủ để định vị và để dựng
   lại, chưa phải mesh quad chỉnh được. Đủ cho phiếu này (bước ⑤ yêu cầu "hệ giá trị định vị"), phần
   sinh quad thật thuộc bước dựng lại qua build-ops.
6. **Chưa nối vào `build-ops`/`.idfc`.** Phiếu giới hạn ở tầng đồ thị diện; việc dựng lại trụ/xuyến
   qua `revolveProfile` đã có sẵn ở `chuan-net.ts` (CN2 đang sửa) — nối hai tầng là phiếu sau.
7. **Chưa xuất DXF** — polyline 3D đã có trong JSON đúng dạng để ghi DXF, nhưng chỉ mới xuất SVG+OBJ.

## 5 · Đề xuất tiếp (T quyết)
1. **Bỏ bóng sàn ở tầng nhập** (không phải tầng này): diện phẳng ngang, sát đáy bbox, >5% diện tích
   ⇒ mesh nhập nên cắt luôn. Cờ đã có sẵn, chỉ cần nơi tiêu thụ.
2. **Tách `cylindrical` thành *ống* / *tấm cong*** theo phủ góc 180° — bảng số đọc mới không gây nhầm.
3. **Nối đồ thị diện → `.idfc` `geom3d`**: mỗi cụm cấu kiện vật liệu thành 1 mảng có matId riêng ⇒
   đúng luồng "đổi vật liệu 1 chỗ, 5 nơi đổi theo" của chốt `.idfc` 07/08.

---
*Hiệu năng: `xayDoThiDien` 397 ms cho 15.538 tam giác (Node, 1 luồng, không BVH).*
