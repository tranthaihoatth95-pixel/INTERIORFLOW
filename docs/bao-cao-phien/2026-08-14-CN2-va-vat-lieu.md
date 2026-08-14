# Báo cáo phiên CN2 — vá 2 lỗi vật liệu chuẩn nét + tách vòng tay vịn + nối recipe vào `.idfc`

> Phiếu: `docs/phieu-giao/chuan-net-v2.md` · 14/08/2026 · 0 job AI (thuần hình học).
> KHUÔN 2 GIÁ TRỊ [Đ2]: ① kiến trúc app — [tính năng] `lib/idfc-import/chuan-net.ts` thêm tầng
> **RANSAC circle-in-3D** (vòng trục ngang) + **thừa kế vật liệu qua texel** cho mảnh tham số;
> ② vận hành/giá trị IF — mesh máy sinh nay ra OBJ **đúng màu như GLB gốc**, chân/vòng thành cấu
> kiện chỉnh tham số được và `.idfc` mang theo công thức dựng.

---

## 1 · CN-F1 — NGUYÊN NHÂN THẬT: **trục V của UV, KHÔNG phải dedupe**

Phiếu đặt nghi phạm số 1 là *"dedupe (vị trí,UV) làm lệch chỉ số `vt`"*. **Đo xong: dedupe VÔ CAN.**

### Bước đo ① — dedupe không lệch (kịch bản `cn2-diag.ts`)
Đọc **lại file OBJ đã xuất** như một trình xem đọc, tra atlas theo **chính chỉ số `vt` của từng mặt**
(34.500 tham chiếu), rồi so với màu tra theo UV của GLB gốc:

| Nguồn UV | Màu trung vị (R,G,B) | texel tối |
|---|---|---|
| GLB gốc | 67, 48, 33 | 8,9% |
| **Chỉ số `vt` trong file OBJ** | **73, 52, 34** | **8,5%** |

⇒ Cùng một chỗ trên atlas. Ánh xạ `vt`/face **không lệch một chỉ số nào**
(`chỉ số NGOÀI BIÊN = 0`, `maxRef v=14364/14364 · vt=6300/6300`).

### Bước đo ② — thủ phạm thật: quy ước trục V
Đọc trạng thái vật liệu **ngay trong trình xem đang chạy** (không suy đoán):

```
MESH p6-huu-co_mesh · mat=MeshPhongMaterial
   material.map = lincoln-327-basecolor.png · flipY = true · colorSpace = srgb
```

· glTF: gốc UV ở **mép TRÊN** ảnh, GLTFLoader nạp texture `flipY = false`.
· OBJ/MTL: gốc UV ở **mép DƯỚI**; MTLLoader → TextureLoader để `flipY = true` (đo được ở trên).
⇒ Chép **nguyên văn** `v` của glTF sang OBJ thì ảnh **lật dọc so với UV**: mặt ngồi/lưng tra trúng
đúng **mảng ĐEN lớn giữa atlas** → ra "đen bóng loang lổ".

| Quy ước V | texel tối |
|---|---|
| đúng (`1 − v`) | 8,5% |
| **lật (đang dùng, sai)** | **16,2%** — gấp đôi |

**Vá:** hằng `UV_FLIP_V = v => 1 - v` khi ghi `vt` (chuan-net.ts). Đây cũng là phép mọi bộ chuyển
glTF↔OBJ dùng ⇒ đúng cho cả 3ds Max (Max cũng lấy gốc bitmap ở mép dưới).

**Test khoá kết luận** (`chuan-net.test.ts` khối ⑤, fixture 2 tam giác **có SEAM UV**):
`chỉ số vt trỏ ĐÚNG UV nguồn của từng mặt (dedupe vô can)` · `trục V đã lật 1−v` ·
`SEAM giữ nguyên: 6 vt riêng, không gộp nhầm`.

### Phát hiện kèm theo (ghi để phiên sau không mất công đo lại)
1. **`MeshPhongMaterial` KHÔNG ăn `scene.environment`.** MTLLoader luôn sinh Phong, còn GLTFLoader
   sinh `MeshStandardMaterial` — trình xem lấy IBL làm đèn chính thì OBJ sẽ luôn phẳng/tối hơn GLB
   dù dữ liệu giống hệt. Đã thêm `Ka` (= `Kd`) + `illum 2` vào MTL để trình xem có đèn môi trường
   không dựng mảnh thành khối đen. **Đây là khác biệt của MÔ HÌNH VẬT LIỆU, không phải lỗi file.**
2. **Bẫy chụp ảnh:** MTLLoader trả vật liệu **trước khi** ảnh `map_Kd` tải xong. Vẽ MỘT LẦN ngay
   lúc `onLoad` ⇒ ảnh ra mesh **đen tuyền** (đã dính đúng bẫy này lần chụp đầu bằng Electron).
   Trang nghiệm thu nay vẽ trong vòng lặp `requestAnimationFrame`.

---

## 2 · CN-F2 — chân trụ KẾ THỪA vật liệu, hết xám nhựa

Cơ chế: thêm `opts.texRgba` (atlas **đã giải mã**, caller đưa vào — module giữ THUẦN, không đụng
`fs`, không decode PNG) → `medianKdOfTris()` lấy **màu trung vị từng kênh** của các texel mà mesh
gốc của mảnh đó tham chiếu qua UV (3 đỉnh + trọng tâm mỗi tam giác) → mỗi mảnh tham số có
`newmtl` RIÊNG.

*Trung vị* chứ không trung bình: mảng chân gỗ luôn dính vài texel bóng đen ở rìa, trung bình bị
chúng kéo tối.

| Mảnh | Kd cũ | **Kd sau vá** (sRGB 0..1) | hex |
|---|---|---|---|
| p1-chan | 0.72 / 0.70 / 0.66 | **0.263 / 0.188 / 0.133** | `#433022` |
| p2-chan | 0.72 / 0.70 / 0.66 | **0.259 / 0.184 / 0.137** | `#422f23` |
| p3-chan | 0.72 / 0.70 / 0.66 | **0.227 / 0.165 / 0.122** | `#3a2a1f` |
| p4-chan | 0.72 / 0.70 / 0.66 | **0.259 / 0.188 / 0.137** | `#423023` |
| p6-vòng tay vịn | — | **0.314 / 0.243 / 0.173** | `#503e2c` |
| p7-vòng tay vịn | — | **0.333 / 0.259 / 0.180** | `#55422e` |

Bốn chân ra bốn sắc nâu óc chó lệch nhau ~3% — đúng kiểu vân gỗ thật, không phải một màu bịa.

**UV trụ (cylindrical unwrap) KHÔNG làm** — phiếu cho phép ("không làm nổi thì Kd trung vị là đủ,
khai rõ"). Lý do: đảo UV của chân trong atlas không phải hình chữ nhật, ánh xạ lại có nguy cơ
tam giác vắt qua nhiều đảo thành vệt bẩn. Kd phẳng an toàn hơn và đã đạt cửa nghiệm thu mắt.

**Không có atlas** ⇒ giữ `mat_primitive` xám cũ + `ghiChu` **khai thật** (có test).

---

## 3 · Vòng tay vịn — **TÁCH ĐƯỢC**, cả hai vòng, phủ 360°

CN cũ khai không tách nổi vì đường **lát cắt ngang**: vòng tay vịn nằm trong mặt phẳng ĐỨNG (trục
vòng NGANG) và dính liền mép nệm ⇒ mọi lát đều lẫn nệm, tỉ lệ rỗng-tâm ≈ 0,2, luật vành-khuyên tự
từ chối.

**Đường mới (phiếu §2): RANSAC circle-in-3D.** Không cắt lát, không giả định trục: lấy 3 điểm bất
kỳ → đường tròn ngoại tiếp trong không gian (cho luôn tâm + trục + R) → đếm điểm nằm trong ống
quanh đường tròn đó. **Nệm là nhiễu — nó không nằm trên ống nên không thành inlier.** Đó chính là
chỗ RANSAC hơn lát cắt (lát cắt buộc phải gom cả cụm). PRNG tất định (`mulberry32`), không
`Math.random` — cùng đầu vào cho cùng kết quả.

| Mảnh | R | r | trục | tâm (mm) | phủ | RMS | tris |
|---|---|---|---|---|---|---|---|
| **p6-vong-tay-vin** | **124,0 mm** | 10,9 mm | (1.00, −0.04, 0.03) | (−255, 335, 8) | **360°** | 4,79 mm = **1,23%** | 1.550→960 |
| **p7-vong-tay-vin** | **125,8 mm** | 10,8 mm | (1.00, 0.09, 0.00) | (259, 328, −0) | **360°** | 5,13 mm = **1,30%** | 1.423→960 |

Hai vòng đối xứng qua tâm (x = −255 và +259, R lệch 1,4%) — dấu hiệu fit bắt đúng vật thật, không
phải bám nhiễu.

**Cửa nhận đúng phiếu:** RMS < 2% đường chéo bbox mảnh **VÀ** phủ ≥ 300° (thêm R > 1,8·r).
**Ứng viên thứ 3 BỊ TỪ CHỐI, không ép** — ghi vào `ghiChu`:

> `vòng trục ngang R=101mm r=23.7mm tâm(254,260,-61): RMS 3.78% (cửa 2%) · phủ 190° (cửa 300°) · R/r 4.3 — KHÔNG đạt, GIỮ mesh, không ép.`

Chặn `|trục·Y| ≤ 0,4` để hai đường không giành nhau: ④c giữ vòng trục ĐỨNG, ④c2 giữ vòng trục
NGANG. Nhờ chặn này cụm **gác chân** (RANSAC có tìm ra một "vòng" R=272mm trục đứng, nhưng thực
chất là các THANH THẲNG bắt chéo) không lọt sang thành xuyến bịa.

Bán kính **THU** rộng hơn bán kính chấm điểm 1,35× (không đổi phép fit, chỉ đổi phép gom): lấy
đúng ống thì mép ngoài vỏ ống rơi lại thành mảnh vụn đen bám quanh xuyến mới — thấy rõ ở ảnh
nghiệm thu vòng 1, đã hết ở vòng 2.

---

## 4 · Poly + file ra

**15.538 → 11.215 tam giác (−27,8%)** (bản CN v1: 12.268).

| Mảnh | Loại | tris |
|---|---|---|
| p1–p4 chân | cylinder tham số | 3.504 → 768 |
| p5 bóng | XOÁ | 534 → 0 |
| p6, p7 vòng tay vịn | torus tham số | 2.973 → 1.920 |
| p8 hữu cơ | mesh giữ | 8.527 |

Xuyến dựng 48 nhịp × 10 điểm tiết diện = 960 tris/vòng — **nhẹ hơn** phần mesh nó thay (48×16 của
④c sẽ là 1.536, tức PHÌNH ra; đã hạ).

| File | |
|---|---|
| `…/scratchpad/lincoln-327-chuannet.obj` | 7 group `o` · 14.364 v · 6.300 vt · 11.215 f · **0 chỉ số ngoài biên** (`inspectObjText` của chính app đọc OK) |
| `…/lincoln-327-chuannet.mtl` | 6 `newmtl` riêng cho 6 mảnh tham số + `mat_mesh` (map_Kd) |
| `…/lincoln-327-basecolor.png` | atlas rút từ GLB |
| `…/lincoln-327-chuannet-recipe.json` | `parts[].buildOp` + `vatLieu.kdSrgb` + nguồn màu |
| `…/lincoln-327-chuannet.idfc` | **MỚI** — xem §5 |

---

## 5 · Recipe nối vào `.idfc`

`body.recipe = { marker, donVi, scaleMmPerUnit, polyTruoc, polySau, ops[], khac[], ghiChu[] }`.
`ops[]` chỉ chứa mảnh **THAM SỐ** (mesh/bóng xuống `khac[]` để truy vết) — mỗi op mang `buildOp`
đúng union `BuildOp` (`op:'revolve'`), `datMm`, `thamSo`, `vatLieu`, `saiSoMm`, `flag:'inferred'`,
`source:'chuanNet:fit-hình-học-thuần'`.

Kiểm round-trip thật: `importIdfc` **OK · recipe.ops sống = 6** →
`p1-chan p2-chan p3-chan p4-chan p6-vong-tay-vin p7-vong-tay-vin`.

⚠️ **Chưa khai kiểu:** `IdfcBody.component` hiện **chưa có** field `recipe` trong `lib/cad/idfc.ts`.
File vẫn round-trip nguyên vẹn (importIdfc chuyển `body` qua nguyên khối, `bodyError` chỉ kiểm
`geom2d`), nhưng TypeScript chưa biết field này. Sửa `idfc.ts` **ngoài trần phiếu CN2** ⇒ để lại:
thêm `recipe?: IdfcRecipe` vào nhánh `component` là việc 1 dòng của chủ mảng `lib/cad`.
`from-photo.ts` **KHÔNG đụng** (agent khác đang giữ) — proof ghi file `.idfc` riêng trong scratchpad.

---

## 6 · NGHIỆM THU MẮT (bắt buộc — đã tự soi trước khi khai xong)

Dựng trang so sánh `public/__cn2-compare.html`: **cùng góc máy, cùng đèn, hai bên** — mọi khác biệt
nhìn thấy là do FILE, không do trình xem. Nhãn tris **tự đếm trên vật đã nạp**, không chép tay.

| Ảnh | |
|---|---|
| `docs/bao-cao-phien/anh/2026-08-14-CN2-so-sanh-glb-obj.png` | ¾ trước — GLB gốc ↔ OBJ chuẩn nét |
| `docs/bao-cao-phien/anh/2026-08-14-CN2-goc-2-chan-vong.png` | góc 2, soi kỹ chân + 2 vòng |

**Đọc bằng mắt:** nhung **mù tạt** ✅ trùng GLB · gỗ **nâu óc chó** ✅ (chân KHÔNG còn xám nhựa) ·
2 vòng tay vịn ✅ tròn đều, thành xuyến tham số · bóng đổ nướng nhầm ✅ đã sạch (bên GLB còn nguyên
tấm đen dưới sàn) · tỉ lệ, độ nghiêng chân, gác chân ✅ khớp.

**Còn lệch, khai thật:** ① vài **mảnh vụn mesh** cỡ vài mm còn sót quanh mép nệm và một chỗ giữa
chân trái (tam giác nằm nửa trong nửa ngoài vùng thu) — nhìn thấy ở cả hai ảnh. ② Toàn khối OBJ hơi
**phẳng hơn** GLB: GLB là `metallicFactor` mặc định = 1 ăn IBL, OBJ là Phong ăn 1 đèn — §1 phát
hiện ①, không phải lỗi dữ liệu.

---

## 7 · Kiểm chứng máy

| | |
|---|---|
| `chuan-net.test.ts` | **58 pass · 0 fail** (thêm 20: CN-F1 ⑤, CN-F2 ⑥, vòng RANSAC ⑦) |
| `tsc --noEmit` | **0 lỗi** |
| `from-photo.test.ts` | 26 pass · 0 fail (không vỡ) |
| `build-ops.test.ts` | 74 pass · 0 fail (không vỡ) |
| `idfc.test.ts` | 44 pass · 0 fail (không vỡ) |

Ngoài trần, **không đụng**: `components/library/**` · `lib/idfc-import/from-photo.ts` ·
ruột `lib/three/build-ops.ts` (chỉ GỌI `revolveProfile`). Không git, không server mới
(dùng 3000 sẵn có; ảnh chụp bằng Electron một-lần-rồi-thoát).

---

## 8 · PHẦN CHƯA LÀM

1. **`IdfcBody.component.recipe` chưa khai kiểu** — §5, 1 dòng ở `lib/cad/idfc.ts`, ngoài trần.
2. **Mảnh vụn mesh quanh vùng thu** — cần bước "dọn mảnh cô lập" (bỏ component < N tam giác không
   dính ai) sau khi tách. Chưa làm, chưa có trong phiếu.
3. **UV trụ/xuyến** — chưa sinh; mảnh tham số dùng Kd phẳng (phiếu cho phép).
4. **Màng ngang giả giữa gác chân** (CN cũ nêu, 714 tris) — vẫn còn, vẫn là ứng viên duyệt mắt.
5. **Vòng thứ 3 (R=101mm, phủ 190°)** — giữ mesh đúng luật; nếu sau này muốn bắt cả cung hở thì
   phải là hàm `sweep` theo polyline, không phải torus.
