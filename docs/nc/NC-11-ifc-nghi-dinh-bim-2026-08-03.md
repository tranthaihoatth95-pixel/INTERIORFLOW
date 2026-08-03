# NC-11 · IFC 4.3 CHO NỘI THẤT + NGHỊ ĐỊNH BIM VIỆT NAM
**COWORK-NC · 03/08/2026.** Nuôi: `CHOT-TEN-CHANG-MODE-2026-08-03.md` §3+§4 (BIM của IF = **BIM nội thất**) · `SPEC-TANG-DU-LIEU-CAU-KIEN.md` §2.4 (đề xuất `elementType:'covering'` đang CHỜ chính bài này) · `docs/LICENSE-NOTES.md` (tiền lệ GPL libredwg).
**Đối chiếu code IF có sẵn:** `lib/cad/model.ts:78` `ElementType` (8 giá trị + `null`) · `:95` `ELEMENT_TYPE_OPTIONS` (nhãn đã ghi tên lớp IFC) · `:152-195` `Base` (`storey` `heightMm` `elementType` `wallKind` `wallStructural` `wallThicknessMm`) · `:285` `BlockEntity.specId` · `:318` `HatchEntity.specId` (matId) · `prisma/schema.prisma:359` `ProductSpec` (brand/sku/vendor/priceVnd/unit/wastagePercent/packagingSpec).

> **LUẬT TRUNG THỰC (SO-KIEM-TONG §0):** mục nào tra được tận nguồn có URL kèm. Mục nào suy đoán ghi rõ **SUY ĐOÁN**. Bài này KHÔNG phải tư vấn pháp lý — người viết là agent, không phải luật sư; phần ① là trích văn bản, phần diễn giải rủi ro cần luật sư xác nhận trước khi bán.

---

## ① PHÁP LÝ VIỆT NAM — **CÓ, IFC LÀ BẮT BUỘC** (đã đổi luật 01/7/2026)

### 1.1 · Ba văn bản, đọc theo đúng thứ tự hiệu lực

| Văn bản | Ngày | Vai trò | Trạng thái 03/08/2026 |
|---|---|---|---|
| **QĐ 258/QĐ-TTg** | 17/3/2023 | Phê duyệt **LỘ TRÌNH** áp dụng BIM (định hướng, giao nhiệm vụ bộ/ngành) | Còn hiệu lực nhưng **không phải nguồn quy định thủ tục nộp hồ sơ** |
| **NĐ 175/2024/NĐ-CP** Điều 8 | 30/12/2024 | Lần đầu đưa **định dạng tệp** vào văn bản QPPL: *"định dạng gốc và định dạng chuẩn **IFC 4.0** hoặc các định dạng mở khác phù hợp"*, mỗi tệp ≤ **500 MB** | 🔴 **HẾT HIỆU LỰC từ 01/7/2026** (Điều 75.2 NĐ 217) |
| **NĐ 217/2026/NĐ-CP** Điều 8 | ban hành 19/6/2026, **hiệu lực 01/7/2026** | **LUẬT ĐANG ÁP DỤNG.** Quy định BIM + định dạng IFC + CDE + giá trị pháp lý của mô hình | ✅ hiện hành |

Nguồn gốc: [QĐ 258/QĐ-TTg trên vanban.chinhphu.vn](https://vanban.chinhphu.vn/?pageid=27160&docid=207592) · [NĐ 217/2026/NĐ-CP trên vanban.chinhphu.vn (bản ký số PDF)](https://vanban.chinhphu.vn/?pageid=27160&docid=218509) · [NĐ 175/2024 Điều 8 — thuviennhadat](https://thuviennhadat.vn/van-ban-phap-luat-viet-nam/nghi-dinh-175-2024-nd-cp-huong-dan-luat-xay-dung-ve-quan-ly-du-an-dau-tu-xay-dung-609382.html) · toàn văn NĐ 217 dạng chữ: [qlda.gxd.vn](https://qlda.gxd.vn/van-ban/qlda/nghi-dinh-217-2026.html)

⚠️ **Cảnh báo về nguồn:** bản PDF ký số trên cổng Chính phủ (`datafiles.chinhphu.vn/cpp/files/vbpq/2026/6/217-ndcp.signed.pdf`, 81 trang, 3,8 MB) là **ảnh scan, không có lớp chữ máy đọc được** — tôi đã tải về và chạy `pdftotext`, chỉ ra 255 byte metadata chữ ký. Vì vậy phần trích nguyên văn dưới đây lấy từ **bản chữ của qlda.gxd.vn** (trang chuyên ngành QLDA của GXD), đối chiếu khớp với tóm tắt độc lập của [thuvienphapluat](https://thuvienphapluat.vn/phap-luat/ho-tro-phap-luat/tong-hop-diem-moi-nghi-dinh-2172026ndcp-so-voi-nghi-dinh-1752024ndcp-ve-quan-ly-hoat-dong-xay-dung--275509.html) và [luatnguyen.vn](https://luatnguyen.vn/van-ban-phap-luat/nghi-dinh-217-2026-nd-cp-2131.html). **Ai cần dùng cho hồ sơ pháp lý thật phải đọc lại bản PDF ký số bằng mắt.**

### 1.2 · Câu quan trọng nhất — trích NGUYÊN VĂN

> **Điều 8. Ứng dụng mô hình thông tin công trình (BIM) trong hoạt động xây dựng và các giải pháp công nghệ số**
>
> **1.** Việc áp dụng BIM trong hoạt động xây dựng được quy định như sau:
> a) Đối với các **công trình xây dựng mới từ cấp II trở lên**, áp dụng kể từ giai đoạn lập Báo cáo nghiên cứu khả thi hoặc Báo cáo kinh tế-kỹ thuật. Người quyết định đầu tư quyết định việc không áp dụng BIM đối với dự án đầu tư xây dựng công trình theo tuyến, dự án đầu tư xây dựng tại khu vực có tính chất đặc thù, dự án có yêu cầu bảo đảm bí mật nhà nước […];
> b) Đối với các công trình không thuộc đối tượng quy định tại điểm a khoản này, **khuyến khích** chủ đầu tư chủ động áp dụng BIM […]
>
> **3.** […] chủ đầu tư, cơ quan chuẩn bị dự án có trách nhiệm **nộp dữ liệu BIM** của công trình cho cơ quan chuyên môn về xây dựng theo quy định sau:
> a) **Dữ liệu BIM được nộp theo các định dạng chuẩn mở IFC hoặc các định dạng mở khác phù hợp với đặc thù, tính chất của công trình;**
> b) Cơ quan có thẩm quyền được yêu cầu […] **nộp định dạng gốc để đối chiếu**. Định dạng dữ liệu gốc phải bảo đảm tính nguyên bản, giữ nguyên các **tham số, cấu trúc đối tượng và thuộc tính** của mô hình;
> c) Nội dung dữ liệu BIM […] phải có các thông tin thể hiện được **vị trí, hình dạng không gian ba chiều** của công trình, trong đó thể hiện đầy đủ **kích thước chủ yếu các bộ phận chính** của công trình, **phương án kết nối hạ tầng kỹ thuật** trong và ngoài công trình. Trường hợp yêu cầu quản lý ở mức cao hơn, nội dung dữ liệu BIM thực hiện theo hướng dẫn của Bộ Xây dựng.

### 1.3 · Đọc ra bản chất — 7 điều phải nhớ

1. **IFC KHÔNG còn là "khuyến nghị kỹ thuật", nó là ĐỊNH DẠNG NỘP MẶC ĐỊNH ghi trong nghị định.** Câu hỏi *"có bắt buộc IFC không hay chỉ 'mô hình BIM'?"* → **Bắt buộc, tại Điều 8 khoản 3 điểm a NĐ 217/2026/NĐ-CP.** Có đường thoát duy nhất là *"các định dạng mở khác phù hợp"* — nhưng phải là **định dạng MỞ**, nên `.rvt`/`.skp`/`.idfp` KHÔNG đạt.
2. **NĐ 217 BỎ ghim phiên bản.** NĐ 175 ghi cứng "**IFC 4.0**"; NĐ 217 chỉ ghi "chuẩn mở IFC". ⇒ IFC4 (ADD2 TC1) hay IFC4.3 đều hợp lệ. Với IF điều này rất có lợi: viết IFC4 là đủ luật, không bị ép lên 4.3 (xem §3).
3. **NĐ 217 BỎ trần 500 MB/tệp** (điều NĐ 175 có). Không còn giới hạn dung lượng trong văn bản.
4. **Định dạng gốc vẫn có thể bị đòi** (khoản 3.b) — và phải "giữ nguyên tham số, cấu trúc đối tượng, thuộc tính". Nghĩa là IFC là *lớp nộp*, không phải *lớp lưu*. IF giữ `.idfp` làm gốc là đúng.
5. **Ngưỡng bắt buộc rộng hơn hẳn NĐ 175:** NĐ 175 gắn điều kiện "dự án nhóm B trở lên"; NĐ 217 **bỏ điều kiện nhóm dự án**, chỉ còn tiêu chí **công trình cấp II trở lên**, và **không phân biệt vốn công hay vốn tư**.
6. **CDE trở thành nghĩa vụ** với công trình cấp I trở lên thuộc đầu tư công (khoản 4). Mô hình phát hành trên CDE là cơ sở đối chiếu pháp lý.
7. **Mô hình BIM có thể THAY hồ sơ giấy** (khoản 5.b): *"mô hình BIM được sử dụng thay thế hồ sơ thiết kế dưới dạng giấy và có giá trị pháp lý tương đương"* — khi cơ quan quản lý đủ hạ tầng. Đây là tín hiệu dài hạn quan trọng nhất cho IF.

### 1.4 · Điều này có chạm tới người dùng IF không? (đánh giá thẳng, không tô hồng)

| Câu hỏi | Trả lời |
|---|---|
| Studio nội thất có phải nộp IFC không? | **Thường là KHÔNG trực tiếp.** Nghĩa vụ nộp đặt lên **chủ đầu tư**, cho **công trình cấp II trở lên**. Studio nội thất là nhà thầu thiết kế phần hoàn thiện. |
| Vậy sao vẫn quan trọng? | Vì chủ đầu tư/tổng thầu **sẽ đòi hồ sơ nội thất ở dạng ghép được vào mô hình chung**. Studio nào xuất được IFC = qua cổng; không xuất được = phải thuê bên thứ ba dựng lại bằng Revit. Đây là **rào cản việc làm**, không phải rào cản pháp lý. |
| Khi nào thành nghĩa vụ trực tiếp? | Khi hợp đồng ghi (khoản 2 NĐ 217 trao **phạm vi và yêu cầu thông tin BIM cho HỢP ĐỒNG** giữa các bên) — tức là nội dung BIM của phần nội thất là điều khoản thương lượng trong hợp đồng, chứ luật không liệt kê sẵn. |
| Nội thất trong chung cư/nhà ở riêng lẻ? | Ngoài phạm vi bắt buộc (cấp III/IV), chỉ "khuyến khích". |

**Không tìm thấy** (đã tra, ghi để phiên sau khỏi tra lại): (i) **không có TCVN nào chuyển đổi ISO 16739 (IFC)** — TCVN 14177-1:2024 là bản chuyển đổi ISO 19650-1 (quản lý thông tin), không phải schema IFC; (ii) văn bản Việt Nam **không ở đâu quy định MVD/IDS/Pset bắt buộc** cho phần hoàn thiện nội thất — mức chi tiết do "hướng dẫn của Bộ Xây dựng" (chưa tra được bản hướng dẫn cập nhật sau NĐ 217; QĐ 348/QĐ-BXD 2021 là bản hướng dẫn chung cũ, nội dung đăng trên moc.gov.vn và bim.gov.vn — **tôi chưa đọc được toàn văn phần phụ lục kỹ thuật của nó**).

---

## ② IFC 4.3 CHO NỘI THẤT — tra tận buildingSMART

Bản đang tra: **IFC 4.3.2.20260630 (IFC4X3_ADD2)** trên [ifc43-docs.standards.buildingsmart.org](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/). Neo ISO ([buildingSMART Technical](https://technical.buildingsmart.org/standards/ifc/ifc-schema-specifications/)): **IFC 4.3 ADD2 = ISO 16739-1:2024** · **IFC 4 ADD2 TC1 = ISO 16739-1:2018** · IFC 2x3 TC1 = ISO/PAS 16739:2005.

### 2.1 · `IfcCovering` — lớp QUAN TRỌNG NHẤT với IF

Định nghĩa gốc: *"A covering is an element which covers some part of another element and is fully dependent on that other element."* — theo ISO 6707-1: *final coverings and treatments of surfaces and their intersections*. Ví dụ chính hãng nêu: **wall claddings, floorings, suspended ceilings, moldings and skirting boards** — đúng 100% hạng mục chính của BIM nội thất.

**`IfcCoveringTypeEnum` — 14 giá trị (nguyên văn `Formal representation`):**

| Giá trị | Mô tả gốc (rút gọn) | Dùng ở IF |
|---|---|---|
| `CEILING` | trần | ✅ trần thạch cao/trần thả |
| `FLOORING` | sàn hoàn thiện | ✅ gạch/gỗ/thảm |
| `CLADDING` | ốp | ✅ ốp tường/lam gỗ |
| `MOLDING` | phào chỉ chuyển tiếp (thường giữa ốp tường và trần) | ✅ phào cổ trần |
| `SKIRTINGBOARD` | len chân tường | ✅ len tường |
| `COPING` | mũ tường/lan can (thêm ở IFC4.2) | ⚪ hiếm |
| `TOPPING` | lớp cán phẳng (thêm ở IFC4.3) | 🟡 lớp cán nền |
| `ROOFING` · `MEMBRANE` · `INSULATION` | mái/màng/cách nhiệt-âm | ⚪ ngoài phạm vi nội thất |
| `SLEEVING` · `WRAPPING` | bọc/quấn thiết bị MEP | ⚪ |
| `USERDEFINED` · `NOTDEFINED` | tự định nghĩa / chưa xác định | fallback |

Nguồn: [IfcCoveringTypeEnum](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcCoveringTypeEnum.htm) · [IfcCovering](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcCovering.htm)

⚠️ **BẪY QUAN HỆ — hai quan hệ "phủ" ĐÃ BỊ KHAI TỬ.** Trang `IfcRelCoversBldgElements` ghi thẳng:
> *"`IfcRelCoversBldgElements` to assign coverings to elements. **NOTE This relationship is now deprecated and replaced by `IfcRelAggregates`.**"*
> *"`IfcRelCoversSpaces` to assign coverings to spaces. **NOTE This relationship is now deprecated and replaced by `IfcRelContainedInSpatialStructure`.**"*

⇒ **Luật cho IF:** lớp hoàn thiện **thuộc PHÒNG** thì dùng `IfcRelContainedInSpatialStructure` (covering ← IfcSpace); lớp hoàn thiện là **bộ phận của một cấu kiện** (ốp dán lên tường cụ thể) thì dùng `IfcRelAggregates` (IfcWall ⊃ IfcCovering). **Tuyệt đối không sinh `IfcRelCoversBldgElements`/`IfcRelCoversSpaces`** — viết mới bằng entity deprecated là nợ ngay từ ngày đầu. (Nguồn: [IfcRelCoversBldgElements](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcRelCoversBldgElements.htm))

**Khối lượng:** `Qto_CoveringBaseQuantities` = `Width` (IfcQuantityLength, chỉ khi dày đều) · `GrossArea` · `NetArea` (IfcQuantityArea — *"Openings, recesses and cut-outs are taken into account by subtraction"*). Đây là **cây cầu thẳng sang BOQ của IF** (`unit:'m2'`, `wastagePercent`). Nguồn: [Qto_CoveringBaseQuantities](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/Qto_CoveringBaseQuantities.htm)

**Thuộc tính chung:** `Pset_CoveringCommon` (`Status`, `AcousticRating`, `FlammabilityRating`, `FragilityRating`, `Combustible`, `SurfaceSpreadOfFlame`…). Lưu ý `Reference` **đã deprecated từ IFC4.3** — dùng `Name` của Type thay thế.

### 2.2 · `IfcFurniture` / `IfcFurnitureType`

Định nghĩa: *"defines complete furnishings such as tables, desks, chairs, or cabinets"*.

**`IfcFurnitureTypeEnum` — 10 giá trị:** `BED` · `CHAIR` · `DESK` · `FILECABINET` · `SHELF` · `SOFA` · `TABLE` · `TECHNICALCABINET` (mới ở IFC4.3) · `USERDEFINED` · `NOTDEFINED`.
Nguồn: [IfcFurnitureTypeEnum](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcFurnitureTypeEnum.htm)

🔴 **PHÁT HIỆN LỖI TRONG CODE IF:** `lib/cad/model.ts:101` ghi nhãn `{ value: 'furniture', label: 'Nội thất · IfcFurnishingElement' }`. Trang chính hãng [IfcFurnishingElement](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcFurnishingElement.htm) ghi: ***"IFC4-CHANGE The entity is marked as deprecated for instantiation - will be made ABSTRACT after IFC4."*** ⇒ **`IfcFurnishingElement` KHÔNG được instantiate**; lớp đúng là **`IfcFurniture`**. Nhãn hiện tại đang dạy sai người dùng và sẽ dạy sai chính exporter viết sau. Sửa nhãn là việc 1 dòng.

⚠️ **Đồ nội thất RỜI vs GẮN CỐ ĐỊNH — enum không phân biệt, property mới phân biệt:** `Pset_FurnitureTypeCommon.IsBuiltIn` (Boolean). Doc `IfcFurniture` ghi thêm: khi `IsBuiltIn = TRUE` thì phải nối bằng `IfcRelConnectsElements`. Với IF (tủ bếp, tủ áo âm tường = hạng mục chính) đây là property **không được bỏ**.
Các Pset còn lại: `Pset_FurnitureTypeCommon` (`Style`, `NominalHeight/Width/Length`, `Color`, `IsBuiltIn`, `Status`) + Pset riêng theo loại (ghế: chiều cao ngồi; bàn/bàn làm việc: diện tích mặt làm việc; tủ hồ sơ: khoá).

**Đồ modular bên trong đồ khác** (ngăn kéo/module tủ bếp) → `IfcSystemFurnitureElement`: *"components of modular furniture which are not directly placed in a building structure but aggregated inside furniture"*. Gom bằng `IfcRelAggregates`.

### 2.3 · `IfcSpace`

**`IfcSpaceTypeEnum`:** `BERTH` · `EXTERNAL` · `GFA` · `INTERNAL` · `PARKING` · `SPACE` · `USERDEFINED` · `NOTDEFINED`.
⚠️ ***"IFC4.3.2.0-DEPRECATION: INTERNAL and EXTERNAL are now deprecated. Use `Pset_SpaceCommon.IsExternal` instead."*** ⇒ phòng nội thất bình thường phải là **`PredefinedType = SPACE`** + `Pset_SpaceCommon.IsExternal = FALSE`. **Không** dùng `INTERNAL`.
Nguồn: [IfcSpaceTypeEnum](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcSpaceTypeEnum.htm) · [Pset_SpaceCommon](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/Pset_SpaceCommon.htm)

Quy ước tên: `IfcSpace.Name` = **số phòng** (mã ngắn), `LongName` = **tên phòng**, `Description` = ghi chú, `ElevationWithFlooring` = cốt mặt sàn **hoàn thiện** (khác `IfcBuildingStorey.Elevation` = cốt kết cấu). Diện tích/chu vi/thể tích **không** nằm trong Pset — nằm ở `IfcElementQuantity` (`Qto_SpaceBaseQuantities`). Phân loại công năng theo mã ngành → `IfcClassificationReference`, **không** nhét vào PredefinedType.

⇒ **`RoomKind` của IF (bedroom/wc/kitchen/…) ánh xạ vào `IfcClassificationReference`, KHÔNG vào PredefinedType.** Đây là điểm dễ làm sai nhất.

Ghi chú quan trọng của chính doc `IfcCovering`: *"A more basic information about claddings, floorings, and ceilings of a space can be attached to `IfcSpace`'s using the `Pset_SpaceCommon` properties. Then only a name can be provided and the covering quantities would be interpreted from the space quantities."* ⇒ có **hai mức**: mức nghèo (ghi tên vật liệu hoàn thiện lên phòng) và mức đủ (sinh `IfcCovering` thật). IF phải làm mức đủ — vì đó chính là moat.

### 2.4 · Vật liệu — `IfcMaterial` + `IfcMaterialLayerSet`

- `IfcMaterial` = một vật liệu (tên + mô tả + category). Gắn vào cấu kiện qua `IfcRelAssociatesMaterial`.
- `IfcMaterialLayerSet` = **cấu tạo nhiều lớp có bề dày**, xếp dọc một trục (MlsBase). Ví dụ chính hãng: tường 2 lớp gạch + khe khí (khe khí là **một layer riêng** có cờ `IsVentilated`, không phải "khoảng trống ngầm"). `IfcMaterialLayerSetUsage` đặt bộ lớp đó lệch so với trục tham chiếu của cấu kiện.
- Nguồn: [IfcMaterialLayerSet](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcMaterialLayerSet.htm)

⇒ **Hệ quả cứng cho IF:** muốn xuất cấu tạo lớp (sàn: keo + gạch + lớp cán) thì **mỗi lớp phải có bề dày số**. IF hiện chỉ có **một** `specId` cho một `hatch` và **không có** field bề dày ⇒ hôm nay chỉ xuất được `IfcMaterial` đơn (mức 1 lớp), **không** xuất được `IfcMaterialLayerSet`. Nói thẳng: đủ hợp lệ, chưa đủ giàu.

### 2.5 · Thông tin THƯƠNG MẠI (hãng · mã · giá) nằm ở đâu

| Cần lưu | Đúng chỗ trong IFC | Trường |
|---|---|---|
| Hãng sản xuất, mã hàng, model, năm SX | **`Pset_ManufacturerTypeInformation`** (gắn vào `IfcElementType`, ghi đè được ở occurrence) | `Manufacturer` · `ArticleNumber` (*"often used as the purchasing number"*) · `GlobalTradeItemNumber` (GTIN của GS1) · `ModelReference` · `ModelLabel` · `ProductionYear` · `AssemblyPlace` |
| Serial/lô/ngày mua của **từng cái cụ thể** | **`Pset_ManufacturerOccurrence`** (chỉ gắn occurrence) | `SerialNumber` · `BarCode` · `BatchReference` · `AcquisitionDate` · `ManufacturingDate` |
| Mã theo hệ phân loại (Uniclass/Omniclass/mã nội bộ) | `IfcClassificationReference` | — |
| **GIÁ** | 🔴 **KHÔNG có Pset chuẩn nào chứa giá.** Giá thuộc nhánh **`IfcCostItem` / `IfcCostSchedule` / `IfcCostValue`**, gắn với đối tượng bằng `IfcRelAssignsToControl` | — |

Nguồn: [Pset_ManufacturerTypeInformation](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/Pset_ManufacturerTypeInformation.htm) · [Pset_ManufacturerOccurrence](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/Pset_ManufacturerOccurrence.htm)

⚠️ **Điểm rất dễ làm ẩu:** nhiều tool nhét giá vào một Pset tự chế `Pset_IF_Price`. Làm vậy thì không phần mềm nào khác đọc được — và tệ hơn, **để lộ giá vốn/giá bán ra file gửi cho chủ đầu tư**. **SUY ĐOÁN (chưa xác minh bằng nguồn):** với studio nội thất, giá là dữ liệu nhạy cảm thương mại ⇒ mặc định xuất IFC **nên loại giá**, có công tắc riêng "kèm bảng giá (IfcCostSchedule)" khi khách yêu cầu. Cần Hoà quyết.

### 2.6 · Khung không gian bắt buộc

`IfcProject` → `IfcSite` → `IfcBuilding` → `IfcBuildingStorey` (gom bằng **`IfcRelAggregates`**) → cấu kiện gắn vào tầng bằng **`IfcRelContainedInSpatialStructure`**. `IfcSpace` là con của `IfcBuildingStorey` (qua `IfcRelAggregates`). Một cấu kiện chỉ được chứa trong **đúng một** phần tử không gian; muốn tham chiếu thêm thì dùng `IfcRelReferencedInSpatialStructure`.

---

## ③ THƯ VIỆN JS ĐỌC-GHI IFC — so sánh có SỐ

Tất cả số đo bằng lệnh thật ngày 03/08/2026 (`npm pack web-ifc@0.0.77` + `tar tzvf` + registry.npmjs.org), không lấy từ trang marketing.

| | **web-ifc** (ThatOpen) | **IfcOpenShell** (qua Pyodide/WASM) | **@thatopen/fragments** | **xeokit-sdk** | **web-ifc-three** |
|---|---|---|---|---|---|
| **Giấy phép** | 🟢 **MPL-2.0** (copyleft **theo FILE**) | 🟡 **LGPL-3.0-or-later** (một số phần có ngoại lệ) | 🟢 MIT (nhưng chạy **trên** web-ifc MPL) | 🔴 **AGPL-3.0** | 🟢 MIT |
| **Đọc IFC** | ✅ | ✅ | ⚪ (định dạng riêng, không đọc IFC thô) | ✅ (qua chuyển đổi) | ✅ |
| **GHI IFC** | ✅ `CreateModel` · `WriteLine(s)` · `SaveModel` · `SaveModelToCallback` (xác minh trong `web-ifc-api.d.ts` dòng 247-391) | ✅ đầy đủ nhất (IFC-SPF, IFCJSON, IFCXML, IFCHDF5, SQLite) | ❌ | ❌ | ❌ |
| **Schema hỗ trợ** | `IFC2X3` · `IFC4` · `IFC4X3` (enum `Schemas`, `ifc-schema.d.ts:1189`) | `IFC2X3` · `IFC4` · `IFC4X3_ADD2` (wheel riêng cho từng schema) | — | — | theo web-ifc cũ |
| **Dung lượng THẬT** | wasm **1,30 MB** (`web-ifc.wasm` 1.303.940 B; bản mt 1.314.227 B; node 1.288.859 B) · JS API 5,90 MB · `ifc-schema.d.ts` 2,10 MB (chỉ type, không vào bundle) · tarball 3,09 MB · unpacked **24,0 MB** | Demo pyodide chính chủ ~**10 MB tải về** ([OSArch 01/2025](https://community.osarch.org/discussion/2701/updated-ifcopenshell-pyodide-demo-app-wasm-ifcopenshell-org)) — kèm cả runtime Python | unpacked 41,7 MB | unpacked 26,2 MB | unpacked 18,4 MB |
| **Bảo trì** | 🟢 latest **0.0.77 · 06/3/2026** | 🟢 0.8.6, wheels pyodide cập nhật đều | 🟢 3.4.7 · 23/7/2026 | 🟢 2.6.112 · 26/6/2026 | 🔴 **chết** — 0.0.126 · **02/1/2024** |
| **Kết luận** | ✅ **CHỌN** | 🟡 dự phòng/server-side | phụ trợ hiển thị | ⛔ **LOẠI** | ⛔ bỏ |

### 3.1 · Giấy phép — phần quan trọng nhất (bài học libredwg)

Dự án đã trả giá một lần: `@mlightcad/libredwg-web` là **GPL-3.0**, và `docs/LICENSE-NOTES.md` §0 đã ghi rõ lập luận "tool nội bộ" **đã bị huỷ** khi IF định vị global — mọi bản phát hành (web, installer Electron) đều là *conveying*. Đừng lặp lại. Đối chiếu ba mức copyleft:

| Giấy phép | Ràng buộc thực tế | Với IF |
|---|---|---|
| **MPL-2.0** (web-ifc) | Copyleft **phạm vi FILE**: chỉ file nguồn *của chính MPL* nếu bị **sửa** mới phải công bố. Code IF gọi API vẫn giữ nguyên bản quyền riêng, đóng nguồn được. Vẫn phải: kèm bản MPL-2.0 + giữ notice + chỉ rõ nguồn lấy code | 🟢 **An toàn nhất.** Chỉ cần đừng fork-sửa web-ifc rồi giấu; dùng nguyên bản từ npm là sạch |
| **LGPL-3.0** (IfcOpenShell) | Người dùng cuối phải **thay/relink được** module LGPL. Maintainer đã trả lời trực tiếp trong [thảo luận #4102](https://github.com/IfcOpenShell/IfcOpenShell/discussions/4102): app MIT/đóng nguồn **được phép** dùng binary dựng sẵn, kèm attribution + bản LGPL-3. Nhưng với WASM đóng gói trong Electron/bundler, điều kiện "relink được" **khó chứng minh** — đúng loại rủi ro đã ghi ở `RESEARCH-DWG-LICENSE.md` | 🟡 **Dùng được nhưng đắt về nghĩa vụ.** Nếu chọn, phải làm sạch như GPL: trang Third-party licenses + đường lấy Corresponding Source |
| **AGPL-3.0** (xeokit-sdk) | Copyleft **lan cả qua mạng** — chạy trên server/SaaS cũng phải mở nguồn toàn bộ | 🔴 **LOẠI THẲNG.** IF có bản web ⇒ AGPL sẽ nuốt cả app. Không cân nhắc |

### 3.2 · web-ifc — mức trưởng thành của khả năng GHI

- API ghi có thật, đủ tầng: `CreateModel(NewIfcModel)` → `WriteLine(lineObject)` → `SaveModel(): Uint8Array`. Có cả `WriteRawLineData` cho trường hợp cần điều khiển thô.
- Ghi **không phải mới**: bug [#462](https://github.com/ThatOpen/engine_web-ifc/issues/462) (`IfcDirection` ghi ra `(*,*,*…)`) là bug của đường ghi, báo 08/2023, **đã đóng** với xác nhận *"This is now fixed"*, và ngay khi đó **IFC4 và IFC4X3 vẫn ghi đúng** — chỉ IFC2X3 lỗi. Tức là đường IFC4 (đường IF cần) là đường được dùng nhiều nhất.
- ⚠️ **Điều web-ifc KHÔNG làm hộ:** nó là *serializer*, không phải *modeller*. Nó **không tự sinh** `IfcExtrudedAreaSolid`, không tự tạo `IfcOwnerHistory`, không tự dựng cây `IfcProject→…→Storey`, không tự cấp `GlobalId`. Toàn bộ phần đó là code của IF. **Khối lượng việc thật của "xuất IFC" nằm ở đây, không nằm ở thư viện.** (SUY ĐOÁN về khối lượng: chưa ước lượng số dòng — không bịa con số.)
- `ifc-schema.d.ts` 2,10 MB **chỉ là type declaration**, không vào bundle runtime. Chi phí runtime thật = **~1,3 MB wasm + glue JS**. So với `libredwg-web.wasm` 9 MB đang có sẵn trong repo, đây là **rẻ hơn 7 lần**.

---

## ④ BẢNG ÁNH XẠ ĐỀ XUẤT — entity IF ↔ lớp IFC

### 4.1 · `elementType` hiện có (`lib/cad/model.ts:78-105`)

| IF `elementType` | Lớp IFC | `PredefinedType` đề xuất | Nguồn dữ liệu trong IF | Trạng thái |
|---|---|---|---|---|
| `wall` | `IfcWall` (`IfcWallStandardCase` nếu có trục+bề dày đều) | `SOLIDWALL` / `PARTITIONING` suy từ `wallStructural` | `wallKind` · `wallThicknessMm` · `heightMm` | 🟢 đủ dữ liệu |
| `slab` | `IfcSlab` | `FLOOR` (`BASESLAB` nếu tầng trệt) | polyline kín | 🟡 **thiếu bề dày** — nay hardcode 100mm |
| `column` | `IfcColumn` | `COLUMN` | rect/circle + `heightMm` | 🟢 |
| `beam` | `IfcBeam` | `BEAM` | rect | 🔴 thiếu cao độ treo |
| `door` | `IfcDoor` | `DOOR` | `BlockEntity` | 🔴 **thiếu `IfcOpeningElement` + `IfcRelVoidsElement` + `IfcRelFillsElement`** — không có lỗ thì IFC vô nghĩa |
| `window` | `IfcWindow` | `WINDOW` | `BlockEntity` | 🔴 như trên + thiếu cao bệ (nay cứng 800/2200) |
| `furniture` | **`IfcFurniture`** ⚠️ *(nhãn code đang ghi sai `IfcFurnishingElement` — deprecated)* | map từ `ProductSpec.kind`/`BlockDef` sang `CHAIR·TABLE·BED·SOFA·DESK·SHELF·FILECABINET·TECHNICALCABINET`, không map được ⇒ `USERDEFINED` + `ObjectType` | `BlockEntity.specId` → `ProductSpec` | 🟡 sửa nhãn + cần bảng map |
| `space` | `IfcSpace` | **`SPACE`** (KHÔNG `INTERNAL` — đã deprecated) | `zone`/`room` + `RoomKind` | 🟡 `RoomKind` phải ra `IfcClassificationReference`, không ra PredefinedType |
| `null` | — | — | — | không xuất |
| `undefined` | — | — | — | phải hỏi/suy đoán có cờ `inferred` (§2.3 SPEC) |
| **`covering` (ĐỀ XUẤT)** | **`IfcCovering`** | `CEILING`·`FLOORING`·`CLADDING`·`MOLDING`·`SKIRTINGBOARD`·`TOPPING` | `HatchEntity.specId` (matId) | 🔴 **CHƯA CÓ — xem §4.3** |

Dữ liệu ngang hàng:

| Field IF | Đích IFC |
|---|---|
| `specId` → `ProductSpec.brand` | `Pset_ManufacturerTypeInformation.Manufacturer` |
| `specId` → `ProductSpec.sku` | `Pset_ManufacturerTypeInformation.ArticleNumber` |
| `specId` → `ProductSpec.name/nameEn` | `IfcElementType.Name` / `ModelLabel` |
| `specId` → `ProductSpec.priceVnd` · `unit` · `wastagePercent` | 🔴 **`IfcCostItem`/`IfcCostValue`** (không có Pset giá) — mặc định **không xuất**, có công tắc |
| `matId` (= `HatchEntity.specId`, kind `'material'`) + PBR | `IfcMaterial` (+ `IfcMaterialLayerSet` khi có bề dày từng lớp). PBR map sang `IfcSurfaceStyleRendering`/`IfcSurfaceStyleShading` — **SUY ĐOÁN, chưa tra sâu độ khớp roughness/metalness** |
| `storey` (chuỗi 'GF'/'L1') | `IfcBuildingStorey.Name` — 🔴 **thiếu `Elevation`** |
| `heightMm` | chiều cao đùn `IfcExtrudedAreaSolid.Depth` |
| `layer` | `IfcPresentationLayerAssignment` (trình bày, KHÔNG mang ngữ nghĩa — đúng luật §2.1 của SPEC) |
| Brand Kit dự án | `IfcOwnerHistory.OwningUser/OwningApplication` — **phải đọc Brand Kit, cấm hardcode studio nào** (LUẬT NỀN TẢNG) |

### 4.2 · IF còn THIẾU gì để xuất IFC HỢP LỆ — kiểm bằng grep, không đoán

| # | Thiếu | Bằng chứng | Mức |
|---|---|---|---|
| 1 | **Cây không gian `IfcProject→Site→Building→BuildingStorey`** | `interface Doc` (`model.ts:484`) chỉ có `entities` · `layers` · `markups` · `photos` · `siteImage` · `printScale` · `paperKey` · `paperOrientation` · `studioName`. **Không có bảng tầng.** `storey?: string` là nhãn rời trên từng entity, không danh sách, không thứ tự, không cốt cao độ | 🔴 chặn |
| 2 | **`IfcUnitAssignment`** | Doc không khai đơn vị; mm là quy ước ngầm trong code | 🔴 chặn (file không khai unit là file sai) |
| 3 | **`GlobalId` 22 ký tự IfcGuid** | `Base.id` là chuỗi tự do (cuid). IFC bắt buộc GUID nén base64 22 ký tự | 🔴 chặn — và phải **lưu bền** để xuất lần 2 không đổi ID (mất ID = mất lịch sử phía đối tác) |
| 4 | **`thicknessMm`** (sàn/trần/lớp phủ) | `SPEC §2.4` đã đề xuất; nay 3D hardcode 100 | 🔴 chặn `Qto_*` và `IfcMaterialLayerSet` |
| 5 | **`elevationMm`** (cao độ đáy) | `SPEC §2.4`; nay cửa sổ cứng 800/2200 | 🔴 chặn trần thả, phào, bệ cửa |
| 6 | **`roomId`** | `SPEC §2.4` | 🟡 chặn `IfcRelContainedInSpatialStructure` theo phòng |
| 7 | **`IfcOpeningElement` cho cửa** | không có khái niệm lỗ trong `model.ts` | 🔴 cửa/cửa sổ xuất ra sẽ "dán lên tường đặc" |
| 8 | **`IfcOwnerHistory`** | chưa có; nguồn đúng = Brand Kit dự án | 🟡 |
| 9 | **Bảng map `BlockDef`/`ProductSpec.kind` → `IfcFurnitureTypeEnum`** | `ProductSpec.kind` chỉ có `furniture|material|lighting|millwork|fixture` — thô hơn enum IFC | 🟡 |
| 10 | **`RoomKind` → hệ phân loại** | chưa chọn hệ (Uniclass/Omniclass/mã VN) | 🟡 quyết định cần Hoà |

### 4.3 · 🔴 KẾT LUẬN VỀ `elementType: 'covering'` — **CÓ, THÊM. Nhưng thêm KÈM một field nữa.**

**Thêm `'covering'`: ĐỒNG Ý — 5 căn cứ:**
1. `IfcCovering` là **entity IFC hạng nhất**, ví dụ chính hãng liệt kê đúng bốn thứ IF làm: *wall claddings, floorings, suspended ceilings, moldings and skirting boards*.
2. **Không lớp nào đang có thay thế được.** Ép lớp hoàn thiện thành `slab` là **sai ngữ nghĩa nặng**: `IfcSlab` là kết cấu, tính **m³ bê tông**; `IfcCovering` là hoàn thiện, tính **m² GrossArea/NetArea**. Sai ở đây = **sai tiền thật trong BOQ**, âm thầm — đúng loại lỗi mà `NC-10` vừa cảnh báo.
3. **Có nơi tiêu thụ ngay** (luật L7 của SPEC): ống kính 3D dán mặt không đùn khối · BOQ đã có `specId` + `unit:'m2'` + `wastagePercent` ↔ `Qto_CoveringBaseQuantities` · exporter IFC · Trình bày (bảng vật liệu A3 theo phòng).
4. **Đúng định vị moat** (`CHOT-TEN-CHANG-MODE` §3): Revit/ArchiCAD làm kiến trúc tốt, làm lớp hoàn thiện dở. `covering` chính là chỗ IF khác biệt — bỏ nó là bỏ luận điểm sản phẩm.
5. Chi phí thấp, additive, không phá `.idf` cũ — cùng khuôn với `wallKind`/`storey` đã có.

**NHƯNG một mình `'covering'` là KHÔNG ĐỦ — bắt buộc kèm `coveringKind`:**
`IfcCovering` **luôn cần** `PredefinedType`, mà trần · sàn · ốp tường · phào · len là **năm thứ khác nhau**, cùng là "vùng tô 2D có vật liệu". Nếu chỉ có `elementType:'covering'` thì exporter buộc phải **đoán** từ hình học/cao độ — vi phạm thẳng luật *"không đoán mò"* đã ghi trong `checker.ts` và thang ưu tiên `SPEC §2.3`. Đề xuất:

```
elementType: 'covering'
coveringKind?: 'ceiling' | 'flooring' | 'cladding' | 'molding' | 'skirtingboard' | 'topping'
```
Ánh xạ 1-1 lên `IfcCoveringTypeEnum` (viết HOA khi xuất). `undefined` = chưa phân loại ⇒ xuất `NOTDEFINED` **và cảnh báo**, KHÔNG mặc định thành `FLOORING`. Đúng khuôn `WallKind`/`RoomKind` đã có (`WALL_KIND_OPTIONS`, `ROOM_KIND_OPTIONS`) — thêm `COVERING_KIND_OPTIONS` là xong, không đẻ cơ chế mới.

**Cảnh báo kèm cho COWORK-DỰNG:** khi thêm `'covering'`, phải cập nhật luôn **nhánh suy đoán §2.3.b của SPEC** (`hatch có specId + spec.kind==='material'` → `covering`). Nhánh đó hiện **suy ra `covering` mà không suy ra được `coveringKind`** ⇒ phải gắn `inferred` + để `coveringKind` undefined, tuyệt đối không đoán thêm.

---

## ⑤ ĐIỀU IF NÊN LÀM

| # | Đề xuất | Căn cứ | Ai |
|---|---|---|---|
| 1 | **Duyệt thêm `elementType:'covering'` + field `coveringKind`** (6 giá trị) vào `lib/cad/model.ts` + `COVERING_KIND_OPTIONS`. `undefined` ⇒ `NOTDEFINED` + cảnh báo, cấm mặc định | §4.3 — `IfcCovering` là entity IFC hạng nhất, không lớp nào thay được; ép thành `slab` = sai tiền BOQ | TỔNG duyệt → PHU |
| 2 | **Sửa nhãn sai 1 dòng NGAY:** `model.ts:101` `'Nội thất · IfcFurnishingElement'` → **`'Nội thất · IfcFurniture'`** | buildingSMART: *"IfcFurnishingElement is marked as deprecated for instantiation"* | PHU (rẻ, làm ngay) |
| 3 | **Chốt IFC4 (ISO 16739-1:2018) là đích xuất v1, KHÔNG đu IFC4.3** | NĐ 217 Điều 8.3.a **bỏ ghim phiên bản** (NĐ 175 cũ ghi cứng "IFC 4.0") ⇒ IFC4 đủ luật; web-ifc hỗ trợ cả ba, IFC4 là đường được dùng nhiều nhất | TỔNG |
| 4 | **Chọn `web-ifc` (MPL-2.0), LOẠI `xeokit-sdk` (AGPL-3.0) khỏi mọi phương án** | AGPL lan qua mạng ⇒ nuốt cả bản web của IF. MPL copyleft theo file, chỉ ràng buộc nếu ta **sửa** file của web-ifc. wasm 1,30 MB — rẻ hơn `libredwg-web.wasm` 9 MB đang có 7 lần | TỔNG chốt · PHU dựng |
| 5 | **Luật "không fork web-ifc"**: chỉ dùng bản npm nguyên vẹn. Nếu buộc phải sửa ⇒ file sửa phải công bố (MPL §3.1) — ghi vào `LICENSE-NOTES.md` **trước khi** code, không chờ audit | Tiền lệ libredwg: nghĩa vụ giấy phép phát hiện SAU khi code xong thì đắt gấp bội | COWORK-NC → `LICENSE-NOTES.md` |
| 6 | **Thêm `thicknessMm` + `elevationMm` + `roomId`** (đúng như `SPEC §2.4` đã đề xuất) — nay chúng KHÔNG còn là "nice to have" mà là **điều kiện cần để file IFC không sai** | `Qto_CoveringBaseQuantities.Width` cần bề dày; `IfcMaterialLayerSet` cần bề dày từng lớp; trần thả/phào cần cao độ đáy | PHU |
| 7 | **Dựng "tầng" thành công dân hạng nhất trong `Doc`**: bảng `storeys: {id, name, elevationMm}[]`, `Base.storey` trỏ id thay vì chuỗi tự do | `interface Doc` hiện **không có bảng tầng**; `IfcBuildingStorey.Elevation` là bắt buộc; và `CHOT-TEN-CHANG-MODE` §5 đã ghi "Tầng/Level là công dân hạng nhất" (lấy từ Revit) | PHU |
| 8 | **Cấp `IfcGuid` bền cho mọi entity xuất ra** (22 ký tự base64), lưu vào `.idfp`, tái dùng ở lần xuất sau | Xuất lần 2 mà ID đổi = phía đối tác mất toàn bộ lịch sử/ghi chú gắn theo GUID. Sửa sau tốn gấp bội | PHU |
| 9 | **Cửa/cửa sổ phải sinh `IfcOpeningElement` + `IfcRelVoidsElement` + `IfcRelFillsElement`** — không có lỗ thì cửa xuất ra là tấm dán lên tường đặc | Khuôn chuẩn IFC; ống kính 3D của IF cũng đang "bỏ qua lỗ" (SPEC §2.2 ghi rõ) | PHU |
| 10 | **Quan hệ đúng cho covering — CẤM dùng entity deprecated**: lớp hoàn thiện thuộc phòng ⇒ `IfcRelContainedInSpatialStructure`; ốp gắn vào cấu kiện ⇒ `IfcRelAggregates`. **Không sinh** `IfcRelCoversSpaces`/`IfcRelCoversBldgElements` | Cả hai đã bị buildingSMART đánh deprecated, thay bằng đúng hai quan hệ trên | PHU |
| 11 | **`RoomKind` ra `IfcClassificationReference`, KHÔNG ra `IfcSpace.PredefinedType`**; phòng nội thất luôn `PredefinedType = SPACE` + `Pset_SpaceCommon.IsExternal = FALSE` | `INTERNAL`/`EXTERNAL` **đã deprecated ở IFC 4.3.2** | PHU |
| 12 | **Giá KHÔNG vào Pset.** Mặc định xuất IFC **loại bỏ giá**; muốn kèm thì sinh `IfcCostSchedule`/`IfcCostItem` sau một công tắc rõ ràng có cảnh báo "file này chứa bảng giá" | Không có Pset chuẩn nào chứa giá; và xuất giá vốn ra file gửi chủ đầu tư là rủi ro thương mại. **SUY ĐOÁN phần rủi ro thương mại — Hoà quyết** | TỔNG |
| 13 | **`IfcOwnerHistory` đọc Brand Kit dự án, cấm hardcode studio** | LUẬT NỀN TẢNG (`CLAUDE.md`) — cùng bài học đã dọn ở `titleBlockPro()` | PHU |
| 14 | **Nói thật trong UI về mức hỗ trợ**: nhãn "Xuất IFC4 — mức hình học + phân loại + vật liệu 1 lớp; chưa có cấu tạo nhiều lớp, chưa có MEP". Không ghi "hỗ trợ đầy đủ BIM" | Luật trung thực §0 + tiền lệ NC-5 (nhãn CMYK) | COWORK-UI |
| 15 | **Định vị marketing chính xác, không nói quá về pháp lý**: nghĩa vụ nộp IFC thuộc **chủ đầu tư**, công trình **cấp II trở lên**. Studio nội thất bị ảnh hưởng **gián tiếp qua hợp đồng** (NĐ 217 Điều 8.2 giao phạm vi BIM cho hợp đồng). Câu đúng: *"Xuất được IFC để ghép vào mô hình của tổng thầu"* — KHÔNG phải *"luật bắt studio nội thất phải dùng"* | §1.4 | TỔNG |
| 16 | **Ghi vào `LICENSE-NOTES.md` một mục mới cho web-ifc TRƯỚC khi thêm dependency** (MPL-2.0: kèm license, giữ notice, chỉ nguồn) — và gộp chung trang "Third-party licenses" đang nợ của libredwg thành **một** việc | §2 `LICENSE-NOTES.md` còn 4 dòng ⬜ chưa làm; thêm dependency thứ 2 mà chưa trả nợ thứ 1 là nhân đôi rủi ro phát hành | COWORK-NC đề xuất · CHINH code |

---

## GIỚI HẠN NGHIÊN CỨU (ghi thẳng, không giấu)

1. **Bản PDF ký số của NĐ 217/2026/NĐ-CP là ảnh scan** — `pdftotext` ra 255 byte. Trích dẫn §1.2 lấy từ bản chữ qlda.gxd.vn, đối chiếu chéo 2 nguồn khác; **chưa đối chiếu bằng mắt với PDF gốc**. Việc đó phải làm trước khi dùng cho hồ sơ pháp lý thật.
2. **Chưa đọc được toàn văn hướng dẫn kỹ thuật của Bộ Xây dựng** (QĐ 348/QĐ-BXD 2021 và bản cập nhật sau NĐ 217, nếu có). Nội dung phụ lục đăng trên moc.gov.vn / bim.gov.vn — thuvienphapluat chỉ đăng phần đầu quyết định. ⇒ **chưa biết Việt Nam có yêu cầu MVD/IDS/Pset cụ thể nào cho phần hoàn thiện không.** Đây là lỗ hổng lớn nhất còn lại của phần ①.
3. **Chưa chạy thử web-ifc thật** — mọi số ở §3 là số đo gói npm và trích API type, **không phải kết quả chạy**. Chưa xuất được một file IFC nào từ dữ liệu IF và mở kiểm bằng BIMcollab Zoom/BIMvision/Solibri. Đó là bước verify rẻ nhất và phải làm **trước** khi hứa tính năng.
4. **Chưa tra sâu ánh xạ PBR (`matId`) sang `IfcSurfaceStyleRendering`** — mục tương ứng trong bảng §4.1 là **SUY ĐOÁN**. Nếu chặng 3D cần giữ ánh sáng/vật liệu qua IFC thì cần một bài NC riêng.
5. **Chưa khảo thực tế thị trường VN**: bao nhiêu % hồ sơ nội thất VN thực sự bị đòi IFC, cơ quan thẩm định dùng phần mềm gì để mở. Nguồn tra được toàn là văn bản + blog công ty (đã loại blog theo yêu cầu đề bài) — **cần hỏi người thật trong ngành**, đề xuất Hoà hỏi 1-2 chủ đầu tư/tổng thầu quen. Đó là verify rẻ nhất cho câu "làm IFC có đáng không".
6. **Chưa đo dung lượng từng wheel pyodide của IfcOpenShell** — `ifcopenshell.github.io/wasm-wheels/*.whl` trả 404 qua proxy của phiên này. Con số ~10 MB lấy từ thảo luận OSArch 01/2025, **không phải số tự đo**.
