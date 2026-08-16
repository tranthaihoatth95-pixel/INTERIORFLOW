# NC · CAD + REVIT TRONG MỘT APP — được không, và được tới đâu

**Ngày:** 16/08/2026 · **Phiên:** P-U (phiên phụ NGHIÊN CỨU NGOÀI, §10 `HOP-DONG-PHOI-HOP-T.md`)
**Mốc git:** `544999f`, `git rev-list --count HEAD..main` = **0** (đứng đúng HEAD).
**Câu Hoà hỏi (nguyên văn):** *"trên máy tính thì nó là vẽ CAD + Revit — bạn nghiên [cứu] 2 thằng này cùng nhau chung 1 app được không? vì CAD cũng có 3D CAD, mình thấy cũng tựa như cách Revit hoạt động."*

> ⚠️ **Nhãn nguồn dùng trong file này**
> · 【N】 = **quan sát có nguồn** — trích từ tài liệu chính chủ, có URL, đã đọc thẳng trang đó.
> · 【N-tt】 = có nguồn nhưng **chỉ lấy được qua trích đoạn máy tìm kiếm**, trang gốc chặn (403/503). Ghi rõ ở §CHƯA CHẮC.
> · 【C】 = **đọc code IF** — có file:dòng.
> · 【S】 = **suy luận của P-U** — không phải sự thật có nguồn, cãi được.

---

## 1 · TỔNG QUAN

**Được — và IF đã đi được khoảng hai phần ba đường rồi, không phải bắt đầu từ số không.** Trực giác của Hoà ("3D CAD tựa như Revit") **đúng về mặt hình học, hụt về mặt QUAN HỆ**: 3D CAD và Revit đều dựng khối rắn, nhưng CAD dừng ở *hình*, Revit đi tiếp tới *ràng buộc giữa các hình* và *bản vẽ tự sinh ra từ hình*. Ba ông lớn đã gộp thật và bán được hàng (BricsCAD BIM · Vectorworks · VisualARQ-trên-Rhino), nên đây không phải chuyện lý thuyết. Giá phải trả có thật và đo được: **cái gì "gắn nghĩa sau" thì mất tham số** (Archicad Morph luôn xuất BREP, không xuất được parametric 【N】), và **người quen Revit vấp ở bước phân loại** (【N-tt】).

Riêng với IF, chỗ **chưa** làm không phải mô hình dữ liệu — mà là **liên kết sống**: IF đã cắt được bản vẽ 2D ra từ khối 3D, nhưng chính panel đó tự khai *"Cut lines are a one-time snapshot — editing the 3D does NOT update them"* (`components/render-studio/SectionExtractPanel.tsx:315`) 【C】. Đó đúng là khoảng cách còn lại giữa IF và Revit.

---

## 2 · CHI TIẾT

### 2.1 · V1 — HAI MÔ HÌNH DỮ LIỆU KHÁC NHAU CHỖ NÀO

#### (a) CAD vẽ HÌNH HỌC — Revit đặt PHẦN TỬ CÓ NGỮ CẢNH

Autodesk nói thẳng về Revit: 【N】

> *"In Revit, the elements determine their behavior largely from their context in the building. The context is determined by how you draw the component and the constraint relationships that are established with other components. Often, you do nothing to establish these relationships; they are implied by what you do and how you draw."*
> — [Element Behavior in a Parametric Modeler, help.autodesk.com](https://help.autodesk.com/cloudhelp/2014/ENU/Revit/files/GUID-5BFA499A-5ACA-4069-852C-9B60C9DE6708.htm)

Câu đắt nhất là **"they are implied by what you do"** — quan hệ **tự sinh ra**, không phải người dùng khai. Trang này cũng chia phần tử Revit làm ba loại: **model** (hình 3D thật) · **datum** (lưới trục, cao độ, mặt phẳng tham chiếu — thứ *định nghĩa ngữ cảnh*) · **view-specific** (chỉ sống trong một khung nhìn: ghi chú, kích thước) 【N】.

⇒ **Đây mới là khác biệt cấp bản chất, không phải giao diện.** Trong CAD không có khái niệm "datum element" — lưới trục là mấy đường thẳng trên một layer tên `AXIS`, không cái gì ràng vào nó. Trong Revit, Level/Grid là **vật thể thứ ba** mà tường phải bám vào.

Bằng chứng CAD-phía-kia: chính vì solid CAD **không mang nghĩa gì** nên BricsCAD mới phải đẻ ra một lệnh riêng để gắn nghĩa vào — `BIMCLASSIFY`: 【N】

> *"Classifies an entity and gets a name and an internal unique GUID."* … *"a classification can be assigned to any DWG entity."*
> — [BIMCLASSIFY command, help.bricsys.com](https://help.bricsys.com/en-us/document/command-reference/b/bimclassify-command)

Một lệnh tồn tại để biến solid thành tường ⇒ **trước lệnh đó, solid không phải tường.** Đó là chứng minh gián tiếp nhưng chặt cho câu "CAD vẽ hình học, không vẽ cấu kiện".

#### (b) "3D CAD" vs "mô hình Revit" — trực giác của Hoà đúng phần nào, hụt phần nào

| | 3D CAD (solid) | Mô hình Revit |
|---|---|---|
| Khối rắn, boolean, push/pull | ✅ có | ✅ có |
| Cắt được mặt cắt để NHÌN | ✅ có | ✅ có |
| **Vật đó BIẾT nó là tường** | ❌ không | ✅ có |
| **Loại (type) dùng chung cả dự án** | ❌ không (chỉ có block/xref — sao chép hình, không mang tham số) | ✅ có |
| **Cửa là CON của tường** | ❌ không | ✅ có |
| **Bám cao độ / lưới trục** | ❌ không | ✅ có (datum) |
| **Bản vẽ SINH RA từ mô hình, tự cập nhật** | ❌ không (vẽ tay, hoặc cắt một lần rồi chết) | ✅ có |
| **Thống kê/khối lượng đọc thẳng từ vật** | ❌ không | ✅ có |

**⭐ ĐÚNG:** ba dòng đầu. Hình học thì hai bên gần như nhau, và đây không phải chuyện nhỏ — nó có nghĩa là **IF không phải viết lại nhân dựng hình** khi muốn "có chất Revit". Trực giác của Hoà đúng ở chỗ tốn kém nhất.

**🔴 HỤT:** năm dòng dưới. Cả năm đều KHÔNG phải chuyện hình học — chúng là **quan hệ và định danh**. 【S】 Nói gọn: *3D CAD cho bạn cái khối; Revit cho bạn cái khối BIẾT nó là gì, thuộc về ai, và ai đang trông vào nó.*

#### (c) Ràng buộc / quan hệ — CAD có tương đương không?

Autodesk mô tả cơ chế lan truyền: 【N-tt】

> *"Parametric modeling refers to the relationships among all elements in a project that enable the coordination and change management that Revit provides. These relationships are created either automatically by the software or by you as you work."*
> — [About Parametric Modeling Relationships, help.autodesk.com](https://help.autodesk.com/view/RVT/2023/ENU/?guid=GUID-71F2C8EE-2A90-4076-A6C7-702082566DDF) *(trang gốc trả 503 khi fetch — trích đoạn lấy qua máy tìm kiếm, xem §CHƯA CHẮC)*

Và về "sửa một chỗ, mọi khung nhìn đổi theo" — thuật ngữ Autodesk dùng là **bidirectional associativity**: một thay đổi kích thước/vị trí cột hiện ngay ở mọi mặt bằng, chi tiết, và bảng thống kê 【N-tt】 ([Autodesk Learn](https://www.autodesk.com/learn/ondemand/tutorial/wall-views-bidirectional-associativity-and-multiple-views) — trang 403 khi fetch).

**CAD có gì tương đương?** Có **ba thứ na ná, không cái nào đủ**: 【S】 dựa trên định nghĩa chính chủ ở trên
1. **Block / xref** — sao chép *hình*, đổi định nghĩa block thì mọi bản chèn đổi theo. Giống Type ở mặt "một chỗ đổi, mọi bản đổi", nhưng **không mang tham số nghiệp vụ** (block không biết nó dày bao nhiêu, giá bao nhiêu, thuộc tầng nào).
2. **Constraint hình học/kích thước** (AutoCAD parametric constraints) — ràng đường với đường. Nhưng là ràng buộc **giữa các nét**, không phải giữa các **cấu kiện**; và người dùng phải khai tay từng cái, không "implied by what you do".
3. **Attribute / XDATA** — nhét dữ liệu vào entity. Chính là con đường IF đang đi (`dxf.ts` XDATA `IF_STOREY` 【C】). Nhưng dữ liệu nằm **cạnh** hình, không có ai kiểm tính nhất quán.

⇒ Kết: **CAD có kho chứa dữ liệu, không có ĐỘNG CƠ lan truyền.** Sự khác biệt Revit không nằm ở chỗ "có chỗ để ghi tường dày 200" mà ở chỗ "đổi 200 thành 220 thì 6 nơi khác tự đổi".

#### (d) Mặt cắt / mặt bằng — vẽ tay hay chiếu ra?

Đúng như phiếu nêu, và đây là **hệ quả trực tiếp** của (a)+(c) chứ không phải một tính năng rời: 【S】 vì bản vẽ chỉ tự sinh được khi mô hình biết vật nào là tường, tường nào bị mặt phẳng cắt qua.

Ba app gộp đều làm đúng một việc này và đều quảng cáo nó là điểm bán chính:
- BricsCAD: BIMIFY *"creates elevation views and floor plan sections"* sau khi phân loại xong 【N】
- Vectorworks: *"updates to your model automatically updates documentation"* 【N-tt】
- VisualARQ: *"dynamic documentation generation (plans, sections, elevations, quantification), and automatic updates to project documents based on model changes"* 【N-tt】

---

### 2.2 · V2 — ĐÃ CÓ AI GỘP CHƯA, GỘP BẰNG CÁCH NÀO, TRẢ GIÁ GÌ

#### Ca 1 — **BricsCAD BIM**: một tệp DWG, gắn nghĩa SAU khi dựng hình

**Cơ chế:** dựng khối bằng lệnh CAD thường (EXTRUDE/PUSHPULL) → chạy `BIMIFY` → máy phân loại. Nguyên văn: 【N】

> *"automatically classifies 3D solids to building elements and assigns spatial locations, spaces, buildings, and stories"* … *"detects and classifies the external and internal walls"* … Trước khi chạy, *"The structure tree displays only 3D solids"*; sau khi chạy, *"The entities are sorted into their corresponding building, story and building element type"*.
> — [Using Bimify, help.bricsys.com](https://help.bricsys.com/en-us/document/bricscad-bim/design-assistance/using-bimify)

**Được:** giữ nguyên tài sản DWG; một môi trường cho cả 2D lẫn BIM; **không bắt người dùng khai trước mới cho vẽ** — đúng luật X4 của IF ("thiếu dữ liệu thì SUY, không chặn").

**Trả giá — hai khoản, đo được:**
- **Người quen Revit vấp ở bước phân loại.** 【N-tt】 *"BricsCAD BIM's workflow can be challenging for users accustomed to Revit, particularly in terms of object classification and modeling processes."* Tức là: cái tự do của "dựng trước, gắn nghĩa sau" bị chính người dùng đọc thành *"tôi vẽ xong rồi mà app vẫn chưa hiểu gì"*.
- **Chi tiết bản vẽ khó kiểm** — 【N-tt】 người dùng báo khó điều khiển mức độ chi tiết trong mặt cắt BIM (ví dụ tủ trên nằm phía trên mặt cắt).
- ⚖️ Đổi lại, chính đặc điểm đó là lợi thế được ghi nhận: 【N-tt】 *"Unlike Revit's predefined element modeling, BricsCAD BIM allows for starting with primitive solids and classifying them later."*

**Người dùng có chấp nhận không:** 【N-tt】 mixed — khen giá và khen tự do, nhưng rào cản lớn nhất **không phải kỹ thuật** mà là thị trường: nhiều gói thầu lớn *bắt buộc* nộp Revit.

#### Ca 2 — **Vectorworks**: một app, và **một VẬT mang hai bộ mặt**

**Cơ chế — đây là ca đáng học nhất cho IF** 【S】: *hybrid symbol*.

> *"A hybrid symbol consists of both 2D planar objects and 3D modeled objects."* … *"Symbol representations will display as expected when switching between a 2D Top/Plan view and a 3D view."*
> — [Vectorworks, Store and Convey Multiple Representations with Hybrid Symbols](https://www.vectorworks.net/newsroom/store-and-convey-multiple-representations-with-hybrid-symbols) 【N】

Tức là: **không chọn giữa "ký hiệu 2D" và "khối 3D" — một vật mang cả hai, khung nhìn quyết định lấy mặt nào ra.** Và 【N-tt】 *"Edits performed in either the 2D view or the 3D model are instantly synchronized"*, cả quá trình nằm trong một tệp: *"You can sketch, model, and document in one file without leaving the environment."*

**Được:** người vẽ mặt bằng không bị ép dựng 3D; người dựng 3D không phải vẽ lại ký hiệu. Đây là cách né mâu thuẫn "CAD-hay-BIM" ở **cấp một vật thể** thay vì cấp cả app.

**Trả giá:** 【S】 người làm nội dung phải **dựng và bảo trì hai biểu diễn cho cùng một món** — nếu ai đó sửa mặt 2D mà quên 3D thì hai mặt lệch nhau, và app không có cách nào biết mặt nào đúng. Không tra được nguồn chính chủ nói về giá này (xem §CHƯA CHẮC).

#### Ca 3 — **VisualARQ trên Rhino**: gắn nghĩa vào **hình tự do**

**Cơ chế:** 【N-tt】 *"Convert any freeform geometry into an informed object… VisualARQ objects support NURBS and can be created from any shape (curves, surfaces, solids, or SubD)"*, đối tượng kiến trúc *"behave like first-class Rhino citizens"* — vẫn kéo bằng grip của Rhino. Kèm sinh tài liệu động và nối Grasshopper hai chiều.

**Được:** giải đúng bài toán mà Revit làm dở nhất — hình phức tạp, phi tiêu chuẩn. Đây chính là địa hạt nội thất (chân tiện, phào chỉ, nan chớp — đúng thứ `00-CHOT` 03/08 đã chốt là PHẢI CÓ).

**Trả giá:** 【S】 đây là **plugin**, không phải nền — mọi thứ nằm ngoài tập đối tượng của nó vẫn là hình Rhino trần.

#### Ca 4 — **Archicad Morph**: chiều ngược lại, BIM hút CAD vào (⭐ ca cho biết giá THẬT)

Archicad là BIM thuần, và họ thêm công cụ dựng tự do vào trong BIM. Graphisoft mô tả rất thật về cái giá: 【N】

> *"Compared to traditional construction elements, the Morph has practically no geometric limits: every edge and every surface can be moved and shaped in any direction."*
> Nhưng: *"there are no numerical geometric parameters, apart from its default elevation"* và *"Solid Morph Operations are not associative — the final result of the operation is permanent."*
> — [Morphs, help.graphisoft.com](https://help.graphisoft.com/AC/22/INT/_AC22_Help/040_ElementsVB/040_ElementsVB-212.htm)

Và ra tới đầu ra chuẩn ngành: 【N】

> *"All model elements are exported using Parametric (Extruded/revolved geometry.)"* … *"Morphs, Objects, Shells and certain Walls or Beams with unusual profiles cannot be exported as parametric: these are always exported using BREP."*
> — [Geometry Conversion for IFC Export, help.graphisoft.com](https://help.graphisoft.com/AC/27/INT/_AC27_Help/121_IFC/121_IFC-37.htm)

**⭐ ĐÂY LÀ CÂU TRẢ LỜI CHÍNH XÁC NHẤT CHO CÂU HỎI "GỘP THÌ MẤT GÌ":** không mất *hình*, mất **THAM SỐ**. Vật dựng tự do đi qua cửa xuất chuẩn thì rơi xuống hạng "khối đặc không tên" (và 【N-tt】 nếu không có loại IFC tương ứng thì thành `IfcBuildingElementProxy`). Tự do càng nhiều, ngữ nghĩa còn lại càng ít.

#### Ca 5 — **AutoCAD Architecture**: ca THẤT BẠI đáng nhớ nhất, và Autodesk tự thừa nhận trong tài liệu

Autodesk đã từng làm đúng việc "nhét cấu kiện BIM vào DWG" (AEC objects). Hậu quả nằm ngay trong help của chính họ: 【N】

> *"A proxy object is a substitute for a custom object when the ObjectARX application that created the custom object is not available."* … *"Proxy objects have significantly reduced capabilities compared to their corresponding custom objects."*
> — [About Custom Objects and Proxy Objects, help.autodesk.com](https://help.autodesk.com/cloudhelp/2022/ENU/AutoCAD-Core/files/GUID-6515268E-3D71-4CBC-8D3C-2059CFAA4E38.htm)

**Bài học cho IF, ghi thẳng vì nó là rủi ro thật:** 【S】 nếu IF nhét cấu kiện thông minh vào tệp rồi **xuất ra DXF/DWG**, mọi thứ "thông minh" sẽ tới tay người nhận dưới dạng hình câm — hoặc tệ hơn, dạng vật thể què. IF đã có tiền lệ ĐÚNG cho chuyện này: `.idf` là nguồn sự thật, DXF chỉ là **một đích chiếu** (`dxf.roundtrip.test.ts`, `dxf.ts` XDATA). **Đừng bao giờ để DWG thành nơi cất ngữ nghĩa.**

---

### 2.3 · V3 — IF ĐANG ĐỨNG Ở ĐÂU (đọc code, không bàn trên không)

Đo trên `544999f`:

| Năng lực kiểu Revit | IF có chưa | Bằng chứng |
|---|---|---|
| Phần tử mang **ngữ nghĩa BIM** | ✅ có, khớp IFC | `model.ts:95` `ElementType = wall\|slab\|column\|beam\|door\|window\|furniture\|space\|null` — và `null` **có nghĩa riêng**: *"đã kiểm và xác định không phải phần tử BIM"*, khác `undefined` = chưa gán |
| Cờ **máy suy vs người khai** | ✅ có | `model.ts:370` `inferred` — *"true = elementType do MÁY SUY, không phải người khai"* |
| **Level thật** (cao độ + thứ tự), khác nhãn tầng | ✅ có | `model.ts:184` `Level{elevationMm, order, inferred}`; `levelId` **thắng** `storey` cho mọi câu hỏi cao độ (`levels.ts` `resolveElevation`) |
| **Type / Instance** + luật ghi đè | ✅ có (cho tường) | `model.ts:764` `WallType` + `wall-types.ts:90` `resolveWallParams()` trả cả giá trị cuối **lẫn NGUỒN** (`'instance'\|'type'\|'none'`) — đúng luật Revit "instance thắng type" |
| **Cấu tạo nhiều lớp** (Structure editor) | ✅ có | `model.ts:742` `WallTypeLayer{name, thicknessMm, specId, core}` — chỗ IF **cố ý đầu tư sâu hơn** vì lớp hoàn thiện là địa hạt nội thất |
| **Tim tường sống** (parametric, sửa lại được) | ✅ có | `model.ts:716` `WallRun{path, thicknessMm, locationLine}` — `entityIds` chỉ là bản DERIVE, *"không bao giờ là nguồn sự thật (K1)"* |
| **Cửa là CON của tường** | ✅ có | `hosting.ts` — *"Đúng kinh Revit: cửa/cửa sổ là CON của đúng 1 tường"*, `syncHostedOpenings(doc)` idempotent, reconcile lại toàn bộ mỗi khi Doc đổi |
| **Ngăn xếp lệnh không phá huỷ** | ✅ có | `model.ts:490` `BuildOp` + `model.ts:539` `BuildRecipe` |
| **Một vật mang cả 2D lẫn 3D** | ✅ có | `idfc.ts:166` `{type:'component'; geom2d; geom3d?; params?}` — **chính là hybrid symbol của Vectorworks**, cộng thêm `commerce?` (giá) mà Vectorworks không có |
| **Chiếu bản vẽ ra từ khối** | 🟡 có, **một lần rồi chết** | `lib/three/section-entities.ts:305` `sectionToEntities()` + `:440` `elevationToEntities()`, đã nối UI `SectionExtractPanel.tsx`. Nhưng `:315` tự khai: *"Cut lines are a one-time snapshot — editing the 3D does NOT update them. Re-cut and delete the old set."* |
| **Bidirectional associativity** | ❌ **CHƯA** | không có `liveSection`; `plan-depth.ts:21` cũng khai thật trạng thái nối dây |
| **Type cho tường ăn tới WallRun** | ❌ chưa | `wall-types.ts:129-131` khai thẳng lý do: chưa thêm `WallRun.typeId` vì luật ghi đè hiện hành sẽ khiến Type *"KHÔNG BAO GIỜ thắng ⇒ `typeId` trên run là field CHẾT"* |
| **Cửa hosted nối vào WallRun** | ❌ chưa | `model.ts:706-707`: *"`openings` hosted cửa/cửa sổ (§4) — hosted hiện đi qua `BlockEntity.hostId`/`hosting.ts`, KHÔNG liên quan gì tới WallRun (2 cơ chế độc lập, chưa nối)"* |

**🔴 Đọc bảng này ra một câu:** 【S】 IF **không thiếu mô hình dữ liệu** — nó thiếu **DÂY**. Ba lỗ còn lại (`liveSection`, `WallRun.typeId`, `WallRun ↔ hosting`) đều là *hai thứ đúng nằm cạnh nhau mà chưa nối*, không phải *thứ chưa tồn tại*. Đây đúng bệnh mà §9 HOP-DONG và `may-soi-dong-dang` sinh ra để bắt.

---

### 2.4 · V3 (tiếp) — BA HƯỚNG CHO IF, KÈM GIÁ

#### HƯỚNG ① — **MỘT MÔ HÌNH CẤU KIỆN, nét vẽ chỉ là hình chiếu** (đường Revit)
**Cơ chế:** `WallRun`/`RoomEntity`/`.idfc` là nguồn sự thật duy nhất; hatch + polyline + mặt cắt đều là **bản derive**, sinh lại được, không ai sửa tay.
**Được:** lan truyền một chiều sạch, không bao giờ lệch; BOQ và bản vẽ luôn khớp — đúng hào "con số truy được về một nguồn". `WallRun.entityIds` đã dựng sẵn đúng khuôn này 【C】.
**Mất:** **giết mất chặng Sơ phác.** Mọi nét muốn tồn tại đều phải qua một cấu kiện — trái thẳng luật X2/X3/X4 của IF ("không màn nào được chặn", "ba đường vào ngang nhau", "thiếu dữ liệu thì suy, không chặn").
**🔴 Rủi ro lớn nhất:** 【S】 IF **đã có** hàng loạt entity không thuộc cấu kiện nào (`LineEntity` vẽ tay bất kỳ layer nào — `model.ts:149` ghi rõ *"app không ép layer"*). Ép hết vào mô hình = migration phá dữ liệu cũ, và mất luôn thứ KTS dùng nhiều nhất: vẽ nháp một đường.

#### HƯỚNG ② — **HAI LỚP SONG SONG CÓ DÂY NỐI** (đường IF đang đi trên thực tế)
**Cơ chế:** lớp hình học (entity tự do) + lớp tham số (`WallRun`/`WallType`/`hosting`) đứng cạnh nhau, nối bằng id. Đúng nguyên văn `SPEC-VE-REVIT-MODE §2`: *"lớp tham số đứng TRÊN lớp hình học"* 【C】.
**Được:** không phá gì; vẽ tự do vẫn sống; nâng cấp dần từng cấu kiện.
**Mất:** phải nuôi **cơ chế reconcile** cho mọi cặp — và mỗi cặp quên nối là một lỗ.
**🔴 Rủi ro lớn nhất — KHÔNG PHẢI GIẢ ĐỊNH, ĐÃ XẢY RA:** `WallRun` và `hosting.ts` là **hai cơ chế độc lập chưa nối** (`model.ts:706`) 【C】. Tức là IF đang có **hai lời giải cho cùng một câu hỏi "cửa nằm ở đâu trên tường"** — đúng cái bẫy `may-soi-dong-dang` mô tả. Đi tiếp hướng ② mà không có luật chặn thì số cặp-chưa-nối sẽ tăng theo số cấu kiện.

#### HƯỚNG ③ — **VẼ TỰ DO TRƯỚC, GẮN NGHĨA SAU** (đường BricsCAD + VisualARQ)
**Cơ chế:** không ép khai gì lúc vẽ; một lệnh "hiểu bản vẽ này" chạy sau, suy ra tường/sàn/phòng, gắn cờ `inferred`, trình cho người duyệt.
**Được:** 【S】 **IF hợp hướng này nhất trong ba hướng, và hợp một cách bất thường** — không phải vì tiện, mà vì **bốn mảnh của nó đã nằm sẵn trong code**: cờ `inferred` (`model.ts:370`) · `Level.inferred` (`model.ts:193`) · `element-infer.ts` · `room-autolabel.ts`. Cộng thêm **cửa duyệt ProposalSheet** đã là khuôn chung của app. Nó cũng là hướng DUY NHẤT không đụng luật X2/X3/X4.
**Mất:** máy suy sai thì người phải sửa; và có một khoảng thời gian mô hình "chưa hiểu gì".
**🔴 Rủi ro lớn nhất — có nguồn, không phải lo xa:** đúng khoản BricsCAD đang trả — 【N-tt】 người dùng thấy *"vẽ xong rồi mà app vẫn chưa hiểu gì"*, và bước phân loại là chỗ họ vấp. **Với IF rủi ro này NẶNG HƠN BricsCAD** 【S】, vì người dùng IF là KTS nội thất chứ không phải kỹ sư CAD — họ sẽ không đi tìm một lệnh tên là "phân loại".

---

## 3 · TỔNG KẾT — RỐT CUỘC LÀ GÌ

Ba việc, gom lại:

**① Trực giác của Hoà đúng ở chỗ đắt tiền nhất.** "3D CAD tựa Revit" — đúng: khối rắn, boolean, push/pull, cắt để nhìn thì hai bên như nhau, và IF đã có đủ (`csg.ts`, `build-recipe.ts`, `section.ts`). Cái Revit có thêm **không phải hình học** mà là ba thứ: *quan hệ tự sinh giữa các vật* · *type dùng chung* · *bản vẽ tự sinh từ mô hình*.

**② "Gộp một app" không phải câu hỏi có/không — nó là câu hỏi GỘP Ở TẦNG NÀO.** Bốn ca thật cho bốn tầng gộp khác nhau: BricsCAD gộp ở **tầng tệp** (một DWG) · Vectorworks gộp ở **tầng vật thể** (một symbol hai mặt) · VisualARQ gộp ở **tầng đối tượng** (hình tự do thành vật có tin) · Archicad gộp ở **tầng công cụ** (thêm dao dựng tự do vào BIM). **IF đang gộp ở cả bốn tầng cùng lúc mà chưa ai gọi tên** 【S】: `.idf` một nguồn (tầng tệp) · `.idfc` mang `geom2d`+`geom3d` (tầng vật thể) · `inferred` (tầng đối tượng) · `BuildRecipe` (tầng công cụ).

**③ Giá của việc gộp đã được ba app trả trước, và nó luôn là cùng một khoản: NGỮ NGHĨA.** Archicad chứng minh sạch nhất — hình tự do thì xuất ra luôn là BREP, không parametric 【N】. AutoCAD Architecture chứng minh cực đoan hơn — đưa vật thông minh qua ranh giới app thì nó thành proxy què 【N】.

---

## 4 · ĐÁNH GIÁ KHÁCH QUAN

**Tốt hơn tôi tưởng trước khi mở code:**
- Tập `ElementType` khớp IFC, và **phân biệt `null` với `undefined`** (`model.ts:92-105`) — đây là mức tinh tế mà nhiều app thương mại không có: *"đã kiểm, không phải BIM"* khác hẳn *"chưa ai kiểm"*.
- `resolveWallParams()` trả về **cả giá trị lẫn NGUỒN của giá trị** — đúng cơ chế cho phép UI hiện chấm "đã override" như Revit.
- `wall-types.ts:129` **từ chối thêm một field** vì nó sẽ chết — kỷ luật K4 chạy thật, không phải khẩu hiệu.

**Chưa tốt, nói thẳng:**
- **Ba lỗ đều là lỗ NỐI DÂY**, và cả ba đều đã được ghi vào docstring rồi để đó. Ghi nợ trong comment là tốt hơn giấu, nhưng nợ ghi mà không có hạn thì thành đồ cổ.
- `CadMode` vẫn còn `'revit'` (`store.ts:131`) trong khi sổ đã chốt chặng 1 chỉ còn **hai** mode (Sơ phác ↔ Kỹ thuật). Không sai về kỹ thuật (khoá giữ nguyên là đúng luật chống vỡ persist) nhưng là **một chỗ nữa để hiểu nhầm** 【C】.
- `.idfc` đã là hybrid symbol nhưng **không ai trong repo gọi nó bằng tên đó**, nên bài học của Vectorworks (hai mặt lệch nhau thì lấy mặt nào làm chuẩn?) chưa được đặt ra bao giờ 【S】.

**Rủi ro tôi cho là bị đánh giá thấp nhất:**
【S】 Không phải rủi ro kỹ thuật mà là **rủi ro từ vựng**. Trong ngày 15-16/08 sổ đã bắt được "5 sổ lệnh song song" và "4 bộ từ vựng cho cùng khái niệm máy-suy/người-xác-nhận". Chuyện CAD↔Revit sẽ đẻ ra đúng loại đó: *"cấu kiện"* (`.idfc` kind) · *"element"* (`ElementType`) · *"phần tử BIM"* · *"block"* · *"type"* đang là **năm chữ cho những thứ chồng lấn nhau**. Gộp hai mô hình mà không gộp từ vựng trước thì mỗi phiên sau lại giải nghĩa lại từ đầu.

---

## 5 · HƯỚNG XỬ LÝ — NHIỀU GÓC ĐỘ

**Góc A — làm cho bản vẽ SỐNG trước (đóng `liveSection`).**
Biến `sectionToEntities` từ chụp-một-lần thành khung nhìn tự cập nhật.
*Ưu:* đây là thứ **nhìn thấy được** và là đúng chữ "bidirectional associativity" mà Revit bán; đóng xong thì IF nói được câu *"sửa 3D, mặt cắt tự đổi"*. *Nhược:* phải quyết ai thắng khi người sửa tay đường cắt — chưa có luật; và đụng luật "đích đến phải sửa được".

**Góc B — nối ba dây đang hở (`WallRun.typeId` · `WallRun ↔ hosting` · `liveSection`) như MỘT phiếu.**
*Ưu:* ba lỗ cùng một bản chất (hai-thứ-đúng-chưa-nối) ⇒ đúng luật đóng gói ≥3 entry cùng hệ thành một phiếu; và giải luôn cái bẫy hai-cơ-chế-cho-một-câu-hỏi. *Nhược:* toàn việc trong ruột, **không có mặt** — vi phạm thẳng luật 16/08 *"không phiên phụ nào được không có mặt"*.

**Góc C — làm LỆNH HIỂU BẢN VẼ (hướng ③) trước, dây tính sau.**
Một lệnh chạy trên Doc, suy `elementType`/`Level`/phòng, gắn `inferred`, trình qua ProposalSheet.
*Ưu:* tái dùng `element-infer.ts` + `room-autolabel.ts` + khuôn ProposalSheet — gần như không có cơ chế mới; và **có mặt tự nhiên** (phiếu duyệt là màn hình). *Nhược:* máy suy sai thì mất niềm tin ngay lần đầu; và nó **không** đóng lỗ dây nào — mô hình vẫn hở như cũ.

**Góc D — chốt TỪ VỰNG trước, code sau.**
Đặt tên rành mạch cho: *hình học trần* ↔ *cấu kiện* ↔ *loại (type)* ↔ *bản chèn (instance)* ↔ *bản derive*; nạp vào `soi:tu-dien`.
*Ưu:* rẻ nhất, chặn được loại lỗi đắt nhất mà chính ngày 15-16/08 đã bắt sáu ca. *Nhược:* 0 dòng code chạy được, và một mình nó thì Hoà không nhìn thấy gì.

---

## 6 · ĐỀ XUẤT — CHỌN **C + D LÀM MỘT PHIẾU**, B ĐỨNG NGAY SAU

**Chọn: làm hướng ③ (gắn nghĩa sau) làm đường CHÍNH của IF, mở đầu bằng một phiếu gộp C+D.**

**Vì sao ③ chứ không ①:** hướng ① là đường Revit, và nó **đòi IF phá ba luật nền của chính mình** (X2 không chặn · X3 ba đường vào ngang nhau · X4 thiếu thì suy). Một hướng kiến trúc mà phải sửa hiến pháp để đi được thì đó là dấu hiệu chọn sai, không phải dấu hiệu hiến pháp sai.

**Vì sao ③ chứ không ②:** hướng ② không phải một lựa chọn — nó là **hiện trạng**. Và hiện trạng đã tự chứng minh chỗ yếu bằng một ca thật (`WallRun` ⊥ `hosting.ts`). Đi tiếp ② mà không đổi gì thì lỗ sẽ nhân lên theo số cấu kiện. ③ **không loại bỏ ②** — nó đặt lên trên ② một cửa vào duy nhất, để những cặp mới không sinh ra rời rạc nữa.

**Vì sao gộp D vào cùng phiếu, không tách:** vì hướng ③ **buộc phải trả lời câu "gắn nghĩa gì vào"** — mà tên của "nghĩa" đó đang có năm cái. Làm C mà không làm D là bảo đảm sẽ có cái tên thứ sáu.

**Vì sao B đứng ngay sau chứ không đứng trước:** B là việc đúng nhưng **không có mặt** (luật 16/08). Sau khi C+D chạy, ba dây hở kia có thêm một lý do rõ ràng để nối — vì lệnh "hiểu bản vẽ" sẽ **đâm thẳng vào chúng**: nó suy ra cửa, và ngay lập tức phải chọn ghi vào `hosting` hay ghi vào `WallRun.openings`. Lúc đó B không còn là dọn nợ, nó là chặn đường.

**Trả lời thẳng câu Hoà (V4):**
> **ĐƯỢC.** Và IF đã đi được phần khó nhất — mô hình dữ liệu đã có ngữ nghĩa BIM, có type/instance, có cấu tạo lớp, có cửa-con-của-tường, có tim tường sống, có cắt bản vẽ từ khối.
> **ĐƯỢC TỚI ĐÂU:** tới mức BricsCAD BIM và Vectorworks đang bán — một app, một tệp, vẽ tự do rồi gắn nghĩa, bản vẽ sinh từ mô hình.
> **VƯỚNG Ở ĐÂU — đúng ba chỗ, đều là dây chưa nối chứ không phải thứ chưa có:** ① mặt cắt cắt ra rồi **chết**, sửa 3D không đổi theo · ② `WallType` chưa ăn tới `WallRun` · ③ cửa hosted và `WallRun` là **hai cơ chế không biết nhau**.
> **KHÔNG NÊN ĐUỔI THEO:** cơ chế lan truyền hai chiều đầy đủ của Revit (mọi thay đổi tự chạy khắp mọi khung nhìn). Đó là ba mươi năm công của Autodesk và nó **không phải hào của IF**. Hào của IF là chỗ Revit yếu nhất — hình nội thất phức tạp và **con số truy được về một nguồn**, kể cả giá.

---

## ⑦b · CHƯA CHẮC / CHƯA KIỂM (bắt buộc khai, kể cả trống)

| Điều | Vì sao chưa chắc |
|---|---|
| **Autodesk — "parametric change engine" / "bidirectional associativity"** | `help.autodesk.com/view/RVT/...` trả **503**, `autodesk.com/learn/...` trả **403**. Trích đoạn lấy qua máy tìm kiếm 【N-tt】. Trang Autodesk đọc được trực tiếp (GUID-5BFA499A, bản 2014) **có** nói về element behavior nhưng **KHÔNG** nói về families/types/instances — tôi đã kiểm và ghi đúng như vậy, không suy thêm. |
| **BricsCAD — phàn nàn của người dùng** | Nguồn là tổng hợp review (selecthub / forum Bricsys) qua máy tìm kiếm, **không phải tài liệu chính chủ**. Coi là tín hiệu, không phải số liệu. |
| **Vectorworks — "instantly synchronized" + "one file"** | Câu định nghĩa hybrid symbol tôi đọc thẳng trang 【N】; hai câu còn lại là 【N-tt】 từ trang marketing vectorworks.net, **chưa mở trực tiếp**. |
| **VisualARQ** | Toàn bộ là 【N-tt】 từ visualarq.com + novedge (blog thương mại). **Chưa mở tài liệu kỹ thuật nào.** Phần "Grasshopper hai chiều" nên coi là quảng cáo cho tới khi kiểm. |
| **Archicad → `IfcBuildingElementProxy`** | 【N-tt】. Câu *"Morphs… always exported using BREP"* thì tôi **đọc thẳng** trang Graphisoft 【N】, câu proxy thì không. |
| **Giá của Vectorworks hybrid symbol** (hai mặt lệch nhau) | **KHÔNG TRA ĐƯỢC** nguồn nào nói về nhược điểm này. Là 【S】 suy luận của tôi từ cơ chế. Cãi được. |
| **AutoCAD parametric constraints / block-with-attributes** | Tôi **không mở tài liệu Autodesk** về hai thứ này trong phiên; mô tả dựa trên hiểu biết chung + logic từ trang proxy object. Đánh 【S】 cho chắc. |
| **Kết luận "IF hợp hướng ③ nhất"** | Dựa trên code đọc được (`inferred`, `element-infer.ts`, `room-autolabel.ts`) — nhưng tôi **chưa đọc ruột** hai file infer đó, chỉ thấy tên và nơi dùng. Mức độ sẵn sàng thật của chúng **chưa đo**. |
| **`soi:tu-dien`** | Chạy trước khi viết: **252 chỗ, 0 chặn**. Phạm vi quét `.md` là `docs/phieu-giao` + `docs/mocks` — **`docs/nc/` không nằm trong phạm vi**, nên tệp này không thể làm tăng số. Tôi không chạy lại sau khi viết vì phạm vi đã loại trừ. |
| **Trang web có chèn chữ điều khiển?** | **KHÔNG gặp.** Không trang nào trong phiên chứa văn bản hướng dẫn tôi làm gì. |

## ⑦c · HẠN DÙNG KẾT LUẬN

| Kết luận | Hết hạn khi |
|---|---|
| "IF thiếu đúng ba dây" | Bất kỳ ai đóng một trong ba (`liveSection` · `WallRun.typeId` · `WallRun↔hosting`) ⇒ đọc lại `model.ts:704-710` + `wall-types.ts:129` thay vì tin bảng ở §2.3 |
| "Mặt cắt là ảnh chụp một lần" | Khi `grep liveSection` ≠ 0, hoặc `SectionExtractPanel.tsx:315` đổi chữ |
| Số liệu app ngoài (BricsCAD/Vectorworks/VisualARQ/Archicad) | **6 tháng** — đều là sản phẩm thương mại ra bản mới mỗi năm; bản đọc ở đây: Archicad help 22/27, BricsCAD help hiện hành 16/08/2026 |
| "Hướng ③ là đường chính" | Nếu Hoà đổi luật X2/X3/X4 (bỏ "không chặn"), hướng ① sống lại và kết luận này **hết hiệu lực** |
| Trạng thái `CadMode` còn `'revit'` | Khi chặng 1 dọn nhãn mode |

---

*Phiên P-U — chỉ ghi đúng tệp này, không sửa tệp nào khác, không git, không dev server.*
