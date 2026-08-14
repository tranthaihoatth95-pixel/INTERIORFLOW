# Báo cáo phiên CN — bước CHUẨN NÉT: mesh máy sinh → hình học tham số + xuất OBJ cho 3ds Max

> Phiếu: `docs/phieu-giao/chuan-net-3d.md` · entry `chuan-net-3d` · 14/08/2026 · 0 job AI (thuần hình học).
> KHUÔN 2 GIÁ TRỊ [Đ2]: ① kiến trúc app — [tính năng] `lib/idfc-import/chuan-net.ts` (marker `chuanNet`)
> nối tiếp pipeline from-photo, REBUILD qua kho build-ops sẵn (`revolveProfile` — CHỈ GỌI); ② vận hành/giá
> trị IF — mesh AI "một cục" thành cấu kiện có mảnh tham số chỉnh được + bóng rác tự dọn, mở đường
> import Max sạch.

## 1 · Phát hiện quyết định cách làm: mesh TRELLIS là MỘT khối liền

Đo thật (weld eps 1e-6): 15.538 tam giác · 7.725 đỉnh vị-trí-duy-nhất · **đúng 1 connected component**.
⇒ Bước "tách connected components" của phiếu trả 1 mảnh — vô dụng một mình. Giải: thêm tầng
**CHUỖI LÁT CẮT** tất định (không AI): cắt 25 lát ngang trục đứng → gom cụm XZ trong lát (single-linkage
lưới ô) → xâu chuỗi cụm NHỎ qua ≥30% số lát = chân trụ; lát có cụm lớn HÌNH VÀNH KHUYÊN = vòng torus;
mảng dẹt sát sàn = bóng. Mọi ngưỡng là tỉ lệ theo bbox, không số cứng theo ghế.

## 2 · Bảng mảnh — proof thật lincoln-327.glb (chạy 141ms, scale 1110,5 mm/đơn vị theo hMm verified)

| Mảnh | Loại | Tham số | Sai số RMS | Tris trước→sau |
|---|---|---|---|---|
| p1-chan | **cylinder** | r=20,2mm · h=735mm · trục (−0.013, 0.989, 0.144) | **7,21mm = 0,95%** | 938→192 |
| p2-chan | **cylinder** | r=18,4mm · h=716mm · trục (−0.017, 0.989, −0.144) | **4,99mm = 0,67%** | 859→192 |
| p3-chan | **cylinder** | r=18,1mm · h=735mm · trục (0.000, 0.991, −0.136) | **6,41mm = 0,86%** | 772→192 |
| p4-chan | **cylinder** | r=18,9mm · h=742mm · trục (0.014, 0.989, 0.146) | **4,11mm = 0,55%** | 935→192 |
| p5-bong | **shadow-XOÁ** | các mảng sát sàn cao ≤20,7mm (<2% tổng 1110mm), bẹt ngang tới 652mm | — | 534→0 |
| p6-huu-co | **mesh-giữ** | nệm+lưng bọc, tay vịn, thanh gác chân — 8.792 đỉnh (vị trí+UV) | — | 11.500→11.500 |

**Poly: 15.538 → 12.268** (−21%: bóng 534 xoá + 4 chân 3.504 tris mesh → 768 tris tham số).
Chân hơi nghiêng vào trong (thành phần z trục ≈ ±0.14) — fit bắt đúng độ xiên thật của ghế, RMS <1%
đường chéo bbox mảnh (ngưỡng phiếu 2%). Đáy trụ kẹp về mặt sàn mesh (fit extent ăn outlier từng thò 13mm).

## 3 · KHAI THẬT — hai chỗ fit KHÔNG nổi, không ép (BIÊN phiếu)

1. **Gác chân KHÔNG phải torus.** Ảnh gốc (lincoln-og.jpg): gác chân là các THANH ĐỒNG CONG CHÉO nối
   chân, không phải vòng tròn; TRELLIS còn nướng thêm MÀNG NGANG GIẢ bịt kín giữa (714 tris, dày 25mm,
   ρ phân bố đặc từ tâm ra — đo thật). Annularity check (rỗng tâm: rMin>0,35·rMax) **TỰ TỪ CHỐI** — đúng
   hành vi mong muốn, hệ không bịa torus. Màng giả nằm giữa thân (không sát sàn) nên luật xoá-bóng không
   với tới — ứng viên dọn ở bước duyệt mắt, không tự xoá.
2. **Vòng tay vịn = torus trục NGANG, dính liền nệm.** Đã quét vành khuyên dọc trục X: mọi lát chứa vòng
   đều chứa cả mép nệm/lưng (rMin/rMax ≈ 0,2 — không rỗng tâm). Tách nó cần mask tương tác/semantic
   (đường SAM2 của Grounded Render) — ngoài phạm vi 0-AI của phiếu, ghi phiếu sau.

## 4 · File ra (scratchpad phiên) + đường import Max

| File | Ghi chú |
|---|---|
| `lincoln-327-chuannet.obj` (812KB) | mm, Y-up; 5 group `o` (4 chân + hữu cơ); 11.096 v · 8.792 vt · 12.268 f — **0 chỉ số ngoài biên**, `inspectObjText` của chính app đọc OK |
| `lincoln-327-chuannet.mtl` | `mat_primitive` (xám) + `mat_mesh` (map_Kd texture gốc) |
| `lincoln-327-basecolor.png` (1,2MB) | texture baseColor rút từ GLB — mesh-giữ GIỮ UV nên texture sống khi import |
| `lincoln-327-chuannet-recipe.json` | `{parts:[{loai, thamSo, buildOp:{op:'revolve',…}, datMm, saiSoMm}]}` — nạp lại chỉnh tham số được, buildOp đúng union `BuildOp` model.ts |
| `lincoln-chuannet-check.png` | chiếu front/side nghiệm thu mắt: đỏ=primitive, xanh=mesh — chân thay đúng chỗ, band gác chân + vòng tay vịn còn nguyên, bóng sạch |

**Import 3ds Max (3 dòng):** ① File → Import chọn `.obj`, preset đơn vị **1 unit = 1mm**, bật **Flip YZ-axis**
(OBJ này Y-up, Max Z-up). ② MTL tự kéo texture `lincoln-327-basecolor.png` cùng thư mục cho phần bọc.
③ Chân là 4 object riêng — muốn chỉnh tham số thì đọc `recipe.json` (r/h/trục từng chân) dựng lại bằng
Cylinder native, hoặc sửa trong IF qua BuildOp `revolve`.

**FBX: KHÔNG sinh** — three không có FBXExporter, writer ASCII tự chế không kiểm chứng được bằng Max
trong phiên ⇒ theo phiếu "không thì OBJ+MTL là đường chính, khai rõ".

## 5 · Code vào repo (KHÔNG git — chờ phiên điều phối commit)

| File | Việc |
|---|---|
| `lib/idfc-import/chuan-net.ts` | MỚI (marker `chuanNet`) — parse GLB hình học (mở rộng đường glb-stats sang chunk BIN, kèm rút texture) · chuỗi lát cắt tách mảnh · fit cylinder/torus (PCA Jacobi 3×3, thử 3 trục lấy RMS nhỏ nhất) · rebuild qua `revolveProfile` build-ops (CHỈ GỌI, phép đặt rotate/translate là của bước này) · xoá bóng · mesh-giữ bỏ đỉnh trùng theo cặp (vị trí,UV) không phá seam · viết OBJ/MTL/recipe thuần (không fs) |
| `lib/idfc-import/chuan-net.test.ts` | 38 test thuần: fit trụ/xuyến tham số ±1% (kể cả trục nghiêng 30°) · GLB nhị phân tự dựng · rebuild bbox khớp · e2e mesh tổng hợp 4 chân+vòng+nệm+bóng → đúng 4 cylinder + 1 torus + xoá bóng + giữ mesh — **38/38 pass** |
| `scripts/frontier-registry.mjs` | entry `chuan-net-3d` chua→**xong** (xong-MÁY; ghi rõ phần khai-thật + phần chờ) |

Kiểm: `tsc --noEmit` **0 lỗi** · chuan-net 38/38 · from-photo 26/26 (không vỡ hàng xóm) · build-ops 74/74
(không đụng ruột) · `soi:frontier` **0 lệch**. Torus fit ĐƯỢC KIỂM bằng fixture tổng hợp (±1%) dù ghế thật
không có torus tách được — năng lực sẵn cho vật có vòng rời (đèn, bàn, ghế khác).

## 6 · Quyết định tự chọn khi mơ hồ (ghi lại, không dừng hỏi)

1. **Chuỗi lát cắt thay cho connected-components** (mesh liền khối) — vẫn tất định, mọi ngưỡng theo bbox.
2. **Bóng gộp báo cáo thành 1 mảnh** (534 tris) — bản đầu vỡ 136 cụm lắt nhắt vì tam giác bóng to, centroid xa nhau.
3. **Chân bắt 2 lượt** (lượt 2 nới xuống sàn dọc trục đã fit) — lát thấp lẫn rác bóng làm 1 chuỗi cụt 250mm.
4. **Không decimate mesh-giữ**: SimplifyModifier của three có sẵn nhưng vứt UV — mất texture phần bọc là
   lỗ nặng hơn lợi poly; poly giảm nhờ thay chân tham số + xoá bóng. Khai rõ theo phiếu ②.
5. OBJ xuất **mm** (không mét) — quy ước nghề nội thất Max, ghi trong header + hướng dẫn import.
6. Tam giác chân sót ngoài bán kính bắt (chỗ nối thanh đồng, loe đáy) nằm lại mesh-giữ — có "da kép" nhẹ
   chỗ trụ tham số đè mesh sót, vô hại thị giác, ghi để bước duyệt mắt biết.

## 7 · Đề xuất 3 việc tiếp

1. Mask tương tác cho mảnh dính liền (vòng tay vịn, thanh đồng cong): kéo vùng → fit torus/sweep — đúng
   đường ProposalSheet + RegionId của Grounded Render, người chọn máy fit.
2. Nối `ChuanNetResult` vào `.idfc`: parts thành `BuildRecipe` per-mảnh (buildOp `revolve` đã đúng union),
   mesh-giữ vào khoá `xFromPhoto` — cấu kiện Thư viện mở ra chỉnh tham số chân trực tiếp.
3. Dọn màng giả giữa thân (dày <3% bbox, kẹp giữa 2 mặt thoáng) — cần định nghĩa an toàn hơn luật sát-sàn,
   làm cùng vòng duyệt mắt.
