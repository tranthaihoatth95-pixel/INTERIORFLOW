# SPEC · PIPELINE ẢNH PHỐI CẢNH → BẢN VẼ CÓ ĐỊNH NGHĨA — 13 bước

> Hoà đặt bài 19/08: *"từ 1 hình ảnh thiếu thông tin sang hình ảnh có định nghĩa, thêm chiều
> không gian để xuất 2D mặt bằng mặt bên mặt đứng, xuất SVG, Dim tham khảo, map + mã id vật liệu."*
>
> Spec dàn theo **form chỉ định**: bảng NO-REBUILD (Blueprint §B25) — mỗi bước khai
> `Need · Existing Primitive · Evidence · Coverage · Action · Why`. Mọi evidence **đo tại nguồn 19/08**.
>
> ⭐ **KẾT LUẬN TRƯỚC KHI ĐỌC**: pipeline này KHÔNG phải xây mới. Đo được: **9/13 bước đã có engine
> chạy được + có test**, đứt ở **khớp nối** — đúng bệnh quen của repo (`to-cad.ts` tự khai
> *"đã có, chạy được, 0 nơi gọi"*; `lib/idfc-import` 3.339 dòng là KHO CHƯA MỞ theo `soi:cam-dien`).
> Action tổng: **2 NEW · 3 EXTEND · 5 CONNECT · 3 REUSE.**

---

## SƠ ĐỒ 13 BƯỚC

```
①  Ảnh phối cảnh (input)
②  Định nghĩa khung hình học        ← điểm tụ · đường chân trời · calib camera
③  Phân loại đối tượng phụ thuộc    ← theo quan hệ với điểm tụ/chân trời (sàn/vách/trần/vật)
④  Đo trường ảnh → độ sâu không gian
⑤  Gắn định danh element bằng VLM   ← xác nhận đúng loại vật
⑥  Tách nền sạch + hatch boundary
⑦  Hiểu ngữ nghĩa element 2D → nội suy 3D
⑧  Hình thiếu thông tin → hình CÓ ĐỊNH NGHĨA (cờ 3 nấc measured/inferred/verified)
⑨  Xuất 2D: mặt bằng · mặt bên · mặt đứng
⑩  Xuất SVG
⑪  Dimension tự động: bento-grid bao element + context ngữ nghĩa
⑫  Dim CHUẨN THAM KHẢO (vd mặt ghế ~450) — giá trị KHOẢNG, tương đối, note rõ
⑬  Xuất map + mã id vật liệu (matId) đi kèm — spec dàn theo form
```

---

## BẢNG NO-REBUILD — 13 bước × 6 cột

| # | Need | Existing Primitive | Evidence (file:line) | Coverage | Action | Why |
|---|---|---|---|---|---|---|
| ① | Nhận ảnh phối cảnh | Gateway định tuyến tệp + upload | `lib/gateway/detect.ts` + `route.ts` (181 dòng, 🟢 SỐNG ui=8) | đủ | **REUSE** | cửa nhập đã chạy thật ở CadEditor |
| ② | Điểm tụ · chân trời · calib camera | `single-view-metrology.ts` (966 dòng): `detectLineSegments` (Hough **đã vá 15/08**) · điểm tụ · `calibrateFromImage()` · `horizon.ts` (120 dòng) | `lib/vision/single-view-metrology.ts` · `lib/vision/horizon.ts` · test 375+209 dòng | đủ cho 1 ảnh | **REUSE** | bug Hough giết bậc 4 đã vá + có `hough-line.test.ts` 7 ca ảnh tự dựng |
| ③ | Phân loại đối tượng theo quan hệ điểm tụ/chân trời (sàn ⊥ vách ⊥ trần · vật đứng trên sàn) | Nửa có: metrology phân được mặt phẳng; chưa có bộ luật "phụ thuộc" tường minh | `single-view-metrology.ts` (mặt phẳng) · chốt kho Hoà nói *"lưới + chân trời + điểm tụ → phân mảng sàn/vách/trần → người chỉnh khung → máy chạy tiếp"* | ~50% | **EXTEND** | mở rộng metrology thêm tầng phân loại quan-hệ; KHÔNG viết máy mới — cùng dữ liệu điểm tụ |
| ④ | Đo trường ảnh → độ sâu | `measureObject()` / `measureObjectTiered()` 4 bậc | `lib/vision/single-view-metrology.ts` (đã có sai số ±% từng bậc) | đủ | **REUSE** | tầng A "số đo luôn từ đây" — luật đã cưỡng chế bằng kiểu |
| ⑤ | VLM gắn định danh element | **CHƯA CÓ chạy cục bộ** — hiện chỉ gọi API ngoài (VLM qua node); entry `vision-backbone-cuc-bo` trạng thái `chua` | `lib/nodes/defs/render-v2.ts` (ai.* gọi API) · frontier entry `vision-backbone-cuc-bo` | 0% cục bộ / có đường API | **NEW** *(negative evidence §D dưới)* | mọi bước khác tất định; riêng "đây là ghế hay bàn" cần model nhìn ảnh |
| ⑥ | Tách nền + hatch boundary | `ai.idmask` (median-cut + BiRefNet khi có key) · DCEL hatch boundary | `lib/nodes/defs/render-v2.ts:7` · nhánh `fix/hatch-t-junction` (+244 dòng DCEL, 29 test, **chưa merge**) | ~70% | **CONNECT** | idmask sống; DCEL nằm ở nhánh chờ cấy (entry `hatch-t-junction-cay-lai`) |
| ⑦ | Ngữ nghĩa 2D → nội suy 3D | `chuan-net` pipeline (fit khối quanh nét · mirror-completion · PartLock cờ 3 nấc) · `cad-to-obj.ts` | `lib/idfc-import/` (**3.339 dòng · 0 nơi gọi — KHO CHƯA MỞ** theo `soi:cam-dien`) · proof thật ghế Lincoln 327 chi tiết · `lib/three/cad-to-obj.ts` (834 dòng 🟢) | đủ thuật toán, **0 mặt tiền** | **CONNECT** | đắt nhất toàn pipeline: 3.339 dòng có test + proof mà KTS không chạm được |
| ⑧ | Hình thiếu → CÓ ĐỊNH NGHĨA (3 nấc) | `from-photo.ts` sinh `.idfc` + `xFromPhoto` (cờ measured/inferred/verified từng trường · ảnh gốc · model · reviewStatus) | `lib/idfc-import/from-photo.ts:145` · `lib/distill/types.ts:15` | đủ, **CÓ BUG**: provenance mất khi nhập lại (Đ2 bắt 17/08 — `ParsedIdfc` không có chỗ cho `xFromPhoto`) | **CONNECT + vá bug** | bug "test che bug" đã ghi sổ; phải vá TRƯỚC khi pipeline dựa vào cờ |
| ⑨ | Mặt bằng · mặt bên · mặt đứng | `buildOrthoViews()` — 3 hình chiếu, PROVENANCE 3 nhãn không trộn (số đo ↔ khối tham chiếu ↔ hình chiếu sơ bộ) | `lib/vision/ortho-projection.ts` (232 dòng + 165 test) | đủ | **REUSE** | luật số-đo-luôn-từ-tầng-A cưỡng chế bằng kiểu — đúng chốt Hoà 15/08 |
| ⑩ | Xuất SVG | Chưa có `toSvg` trực tiếp; có `entity-path.ts` (path từng entity) + `cad/render.ts` (705 dòng vẽ canvas) + DXF export | `lib/cad/entity-path.ts` · `lib/cad/render.ts` · `lib/cad/dxf-plan.ts` | ~60% — path đã có, thiếu serializer SVG | **EXTEND** | entity→path đã có; SVG chỉ là format ra thứ hai của cùng đường vẽ, không viết renderer mới |
| ⑪ | Auto-dim: bento bao element + ngữ nghĩa | `dimensionChain()` (chuỗi kích thước) + `label-placer.ts` (nhãn né hình, 642 dòng) — chưa có auto-bao-theo-bento | `lib/cad/commands.ts:548` · `lib/cad/label-placer.ts` | ~50% | **EXTEND** | dim chain + né nhãn có; thêm tầng "máy tự chọn điểm dim theo bounding + ngữ nghĩa" — dùng lại 2 engine trên |
| ⑫ | Dim CHUẨN THAM KHẢO theo khoảng | `neufert.ts` + `registry.ts` StandardRule (đã có `min/typical/max` — chốt 15/08 *"neo là KHOẢNG"*) + `resolveRulesAsOf()` | `lib/cad/standards/neufert.ts` · `registry.ts:93` | đủ dữ liệu, thiếu **bộ áp vào dim** | **EXTEND** | luật 15/08 đã chốt đúng hình dạng (min 720/typ 750/max 780); việc là nối bảng khoảng vào ⑪ |
| ⑬ | Map + matId đi kèm | `getMaterial()` 3 mặt (cắm điện 17/08) + `specId` (Wave 0 19/08) + `xFromPhoto.material` | `lib/materials/resolve.ts:52` · `MaterialsScreen.tsx:90` · Wave 0 runbook | đủ | **CONNECT** | matId = `ProductSpec.sku` đã là khoá nối chuẩn; chỉ cần ⑧ ghi matId vào element |

---

## §A · BA RÀNG BUỘC CỨNG — từ chốt cũ, áp nguyên

1. **⛔ DIM THAM KHẢO ≠ SỐ ĐO.** Chốt Hoà 15/08: *"BOQ chỉ lấy giá trị chính xác đến từ con số"*.
   `ortho-projection.ts` đã cưỡng chế 3 nhãn bằng kiểu — bước ⑫ nối vào **cùng PROVENANCE**:
   - `số đo` (bậc ④, kèm ±%) → được vào BOQ
   - `dim tham khảo` (bậc ⑫, từ bảng khoảng Neufert) → **CHỈ hiển thị, kèm chữ "tham khảo — giá trị
     tương đối"**, KHÔNG BAO GIỜ đổ vào BOQ. Nhãn nằm trong kiểu dữ liệu, không phải chú thích UI.
2. **⛔ CỜ 3 NẤC KHÔNG MẤT KHI NHẬP LẠI.** Bug `xFromPhoto` (Đ2 bắt 17/08) phải vá trước khi pipeline
   dựa vào — không thì bước ⑧ sản xuất định nghĩa mà kho nuốt mất gia phả.
3. **⛔ NGƯỜI CHỈNH KHUNG TRƯỚC KHI MÁY CHẠY TIẾP.** Chốt kho Hoà nói: *"phân mảng sàn/vách/trần →
   **người chỉnh khung** → máy chạy tiếp"*. Sau bước ③ phải có cửa duyệt (ProposalSheet — khuôn đã
   chốt 13/08), máy không tự trôi hết 13 bước.

## §B · THỨ TỰ THI CÔNG — theo hệ quả, mảnh trước làm tiền đề mảnh sau

```
Đợt 1 · CẮM ĐIỆN (CONNECT — 0 thuật toán mới)
  1a. Vá bug xFromPhoto mất provenance          (⑧ · điều kiện của mọi thứ sau)
  1b. Mở mặt tiền lib/idfc-import               (⑦ · 3.339 dòng đang mồ côi)
  1c. Nối to-cad.ts vào một nút thật             (⑤⑥→bản vẽ · file tự khai "0 nơi gọi")

Đợt 2 · MỞ RỘNG (EXTEND — trên engine có sẵn)
  2a. Tầng phân loại quan-hệ điểm tụ             (③ · mở rộng metrology)
  2b. SVG serializer trên entity-path            (⑩)
  2c. Auto-dim bento + bảng khoảng Neufert       (⑪+⑫ · một phiếu, chung dây)

Đợt 3 · MỚI (NEW — duy nhất một bước)
  3a. VLM định danh element                       (⑤ · theo entry vision-backbone-cuc-bo:
      ngắn hạn dùng đường API đã có ở node ai.*, dài hạn model cục bộ)
```

## §C · GIÁ TRỊ SẢN PHẨM — vì sao pipeline này là hào

Một ảnh phối cảnh (của khách, của Pinterest, của render cũ) đi vào → ra **bản vẽ 2D ba hình chiếu
có dim tham khảo + element mang matId + cờ tin cậy từng trường**. Canva không làm được (không thật),
Revit không làm được (không nhận ảnh). Đây là **Element/Material Intelligence** chốt 10/08 thành
dây chuyền trọn — và **mọi con số truy được về nguồn**: số nào đo, số nào suy, số nào tham khảo.

## §D · NEGATIVE EVIDENCE cho bước ⑤ (NEW duy nhất — theo luật §B25)

1. **Đã tìm**: grep `vlm|VLM|clip|siglip` toàn `lib/` → chỉ metrology comment; entry
   `vision-backbone-cuc-bo` trạng thái `chua`; `ai.*` node gọi API ngoài từng lượt.
2. **Primitive gần nhất**: node `ai.idmask` (median-cut màu) — tất định, KHÔNG hiểu ngữ nghĩa
   ("vùng nâu" ≠ "ghế gỗ").
3. **Vì sao REUSE không đủ**: median-cut phân cụm màu không trả lời "đây là vật gì".
4. **Vì sao CONNECT không đủ**: không có engine ngữ nghĩa nào trong repo để nối.
5. **Vì sao EXTEND không đủ**: mở rộng idmask thành VLM là viết model mới trong vỏ cũ — tệ hơn NEW thẳng.
6. **Không tạo island**: bước ⑤ chỉ là MỘT nút trong pipeline, vào/ra qua kiểu chung
   (`ObjectSilhouette` → `ElementId + confidence`), ngắn hạn dùng ngay hạ tầng node ai.* sẵn có.

## §E · CHƯA CHẮC — khai thẳng

- Coverage các bước là **đọc mã + test**, chưa chạy dây chuyền trọn end-to-end lần nào.
- Bước ③ "50%" là ước từ việc metrology đã phân mặt phẳng — chưa đo trên ảnh thật nhiều ca.
- SVG serializer "60%" dựa trên `entity-path.ts` tồn tại — chưa kiểm path có đủ loại entity.
- Đợt 3a phụ thuộc quyết định vision-backbone (Hoà đã chốt CHẠY CỤC BỘ 15/08, model chưa chọn).

## §F · HẠN DÙNG

Spec này hết đúng khi: Wave 1 đổi cấu trúc `.idfc` · hoặc Hoà chọn xong model vision cục bộ
(bước ⑤ chuyển từ API sang local) · hoặc nhánh `fix/hatch-t-junction` được cấy (bước ⑥ đổi evidence).
