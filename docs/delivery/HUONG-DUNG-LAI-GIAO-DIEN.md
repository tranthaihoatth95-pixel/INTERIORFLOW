# HƯỚNG DỰNG LẠI GIAO DIỆN — suy từ TÍNH NĂNG, không suy từ màn

> **Bàn CHUYÊN MÔN (B) · 05/09/2026 · nhánh `nen-checkpoint`.**
> Đây là **bước ① và ②** của dây chuyền: suy ưu tiên từ tính năng → xác lập đầu mục → **giao đề**
> cho bàn nghiên cứu. Chưa phải PLAN. Plan ra ở lượt sau, khi báo cáo nghiên cứu về.
>
> **Dữ kiện đã dùng:** 12 ảnh app thật `/tmp/mat-3255/*.png` (theme sáng · 1440×900 · đã đăng nhập ·
> 1 dự án thật) — **tự mở từng ảnh bằng công cụ Read và nhìn**, không suy bố cục từ CSS ·
> `docs/bao-cao-phien/2026-09-05-cham-4-man-design-review.md` (trọng tài độc lập, FAIL 4/4) ·
> `docs/delivery/JOURNEY-MATRIX.md` `J01…J23` · đo tại nguồn trong mã.
>
> ⚠️ `docs/delivery/KIEM-KE-NANG-LUC.md` **CHƯA TỒN TẠI** khi lượt này chạy (bàn khác đang dựng).
> Nấc ① dưới đây **suy từ mã + 28 route + ma trận hành trình + 5 mẫu quy trình có sẵn trong sản phẩm**,
> **không** đọc từ bản kiểm kê. Khi bản kiểm kê ra, phải đối chiếu lại — xem ⑦b.

---

## ⭐ PHÁT HIỆN NỀN — một bệnh, không phải mười lỗi

Mở đủ 12 ảnh rồi đặt cạnh nhau thì **mọi bề mặt có nội dung của IF đang bày CÁI HỘP, không bày
CÁI ĐỰNG BÊN TRONG.** Đây không phải mười lỗi rời; nó là một luật ngầm đang chạy khắp app.

| Màn | Nhân vật chính **phải** là | Ảnh thật đang bày | Nguồn |
|---|---|---|---|
| Kho vật liệu | mẫu vật liệu (vân · quả cầu) | **bảng CSDL** 3 dòng, ô ảnh là biểu tượng ảnh-hỏng | `05-vat-lieu.png` |
| Thư viện | các món trong kho | **9 thẻ giống hệt** chứa con số + văn xuôi + nút xanh; phải bấm *Mở kệ* mới thấy gì | `06-thu-vien.png` |
| Files | tệp | **5 hộp xám khổng lồ rỗng**, mỗi hộp một biểu tượng nhỏ | `09-files.png` |
| Gallery | ảnh | một ô nhập URL | `07-gallery.png` |
| Home | việc đang dở | **một khối chữ** *"Mở lại một dự án, hoặc bắt đầu cái mới"* | `01-home.png` |
| Trình chiếu | trang đang dàn | **trắng tuyệt đối 71% diện tích màn** | `04-trinh-bay.png` |
| Bảng việc | thẻ việc | ✅ **đúng** — nói thiếu gì · vì sao · làm gì tiếp + 5 mẫu quy trình nghề | `08-viec.png` |

**Và đây là chuỗi nhân quả, không phải trùng hợp.** Bề mặt không có nội dung thật để bày thì nó
phải lấp chỗ — và thứ mọc lên trong chỗ trống đó chính là **năm phát hiện nặng nhất của bản chấm
độc lập**: dải 5 ô màu gõ cứng `aria-hidden` dưới tiêu đề *"xưởng đang có"* (PH-03) · hai dòng
*"trong xưởng"* đếm hai đơn vị khác nhau (PH-04) · *"1 thứ đang chờ bạn"* cạnh *"chưa có việc nào
đang dở"* (PH-05) · kệ *"tôi tự đặt"* mà người dùng chưa đặt gì (PH-13) · dải 4 cột giáo lý sản
phẩm đóng đinh vĩnh viễn (PH-14).

> **Trang trí là thứ mọc lên trong khoảng trống mà nội dung để lại.**
> ⇒ Đuổi theo từng món trang trí là chữa triệu chứng. Bịt chỗ trống mới là chữa bệnh.

**Hệ quả cho cách giao việc — đây là điều quan trọng nhất của lượt này:**
Home đã trượt **ba lần** (ba nghiên cứu A/B/C · bản Hybrid · ba study H1/H2/H3, tất cả 🔴/🟡 trong
sổ cách ly). Cả ba lần đều được giao như **một bài BỐ CỤC**. Nhưng cả năm phát hiện trên Home đều
là **nội dung bịa để lấp bố cục**. ⇒ **Home không giải được bằng bố cục** khi chưa ai chốt *mảnh
việc sống LÀ CÁI GÌ và nó nhìn ra sao*. Giao bố cục lần thứ tư thì sẽ trượt lần thứ tư.

---

## BƯỚC 1 · BỐN NẤC — từ tính năng ra chỗ đứng

### Nấc ① · TÍNH NĂNG — người dùng đến IF để LÀM GÌ

Không phải tên chức năng. Là **việc nghề**. Nguồn: 5 mẫu quy trình **đã nằm trong chính sản phẩm**
(`08-viec.png` — *Concept dự án · Hồ sơ kỹ thuật · Sản xuất render · Trình khách · Fit-out thi công*,
mỗi mẫu 5 việc) + chuỗi N-1 + ma trận `J01…J23`.

| # | Việc nghề | Tần suất | Giá trị nghề | Vì sao xếp thế |
|---|---|---|---|---|
| **V1** | **Quay lại đúng chỗ đang dở** | mỗi lần mở app — **cao nhất tuyệt đối** | cao | đứt là mất ngữ cảnh, trúng đúng lời hứa N-1 · N-8 ba câu đầu |
| **V2** | **Đặt / đổi vật liệu, và thấy nó lan khắp nơi** | nhiều lần mỗi ngày | **cao nhất** | đây **là** hào (N-2): đổi ở phối cảnh thì BOQ đúng vì *chỉ có MỘT vật* |
| **V3** | **Vẽ và sửa mặt bằng** | hàng giờ | cao | việc chiếm nhiều thời gian nhất trong ngày |
| **V4** | **Dựng khối · ra phối cảnh** | hàng giờ (pha sản xuất) | cao | thứ khách nhìn thấy đầu tiên |
| **V5** | **Gom tham chiếu · chốt hướng** | hàng ngày (pha đầu) | cao | quyết định gu, kéo theo cả dự án |
| **V6** | **Dàn hồ sơ · giao khách** | theo mốc | **cao nhất về quyết định** | đây là thứ **được trả tiền** |
| **V7** | **Bóc khối lượng · giá** | theo mốc | cao | sai số ở đây là tiền thật |
| **V8** | **Truy "cái này từ đâu ra"** | bất chợt | **rất cao khi cần** | gia phả — thứ Revit/Canva không có |
| **V9** | **Nhập bản vẽ / ảnh cũ vào** | đầu dự án | trung bình | cửa vào, không phải việc thường ngày |
| **V10** | **Nhận việc · giao việc · theo tiến độ** | hàng ngày | trung bình | ⚠️ **không phải lý do người ta mở IF** — hạng nền |

⛔ **V10 xếp cuối là có chủ ý.** Đưa quản lý việc lên trội là đường ngắn nhất biến IF thành
SaaS quản trị dự án — đúng câu N-1 nói IF **KHÔNG PHẢI**.

### Nấc ② · MÀN CHÍNH — việc đó sống ở bề mặt nào

**Màn CHÍNH** = nơi việc thật sự xảy ra. **Đường đi qua** = nơi chỉ để chuyển tiếp, không được
chiếm trọng lượng thị giác của màn chính.

| Việc | Màn **CHÍNH** | Chỉ là **đường đi qua** | Ghi chú đo được |
|---|---|---|---|
| V1 | **Home** `/` | — | |
| V2 | **hai màn khác nhau, đừng gộp**: ⓐ *lập* vật liệu → `/materials` · ⓑ *dùng* vật liệu → **cửa chọn tại chỗ trong 2D/3D** | `/library` thẻ *Vật liệu* · `/colors` | ⓑ **đã có mã**: `components/cad/MaterialPalette.tsx` + `MaterialImpactPreview.tsx` |
| V3 | **canvas 2D** `/projects/[id]/cad` | dải tab · thanh 6 nút xổ | canvas chỉ còn **595/900px chiều dọc** vì 7 dải chrome |
| V4 | **khung nhìn 3D / canvas node** `/projects/[id]/render` | — | hiện mở mặc định ở **canvas node**, có công tắc *Vẽ 3D* ở dock |
| V5 | **Cảm hứng · Gallery** `/inspiration` `/library/gallery` | — | Gallery hiện **rỗng hoàn toàn** |
| V6 | **Trình chiếu** `/projects/[id]/present` | — | **trắng 71% màn** |
| V7 | **bảng BOQ trong Trình chiếu** | mục ở ổ trái | |
| V8 | **mép phải · Context Intelligence Stack** (EXS §9) | — | ⚠️ **chưa thấy trên ảnh nào** |
| V9 | **Files** `/files` | `/library/ingest` | hai tầng, Collection+ chưa thấy dựng |
| V10 | **Bảng việc** `/tasks` | — | trạng thái rỗng **tốt nhất repo** |

🔴 **`/library` (trang tổng Thư viện) hiện là ĐƯỜNG ĐI QUA đang mang trọng lượng của một MÀN CHÍNH**
— 9 thẻ nặng, chiếm trọn màn, nhưng không món nào dùng được ngay. Đây là lỗi phân vai, không phải
lỗi thẩm mỹ.

### Nấc ③ · KEY VISUAL — đúng MỘT nhân vật chính mỗi màn

| Màn | Nhân vật chính **phải là** | Hiện là | Khoảng cách |
|---|---|---|---|
| Home | **mảnh việc sống** — hiện vật thật của việc đang dở (mặt bằng · phối cảnh · moodboard · trang hồ sơ), đủ lớn để nhận ra bằng mắt | khối chữ + 4 dòng số + dải màu bịa | 🔴 chưa có hiện vật nào |
| 2D | **bản vẽ** | có, nhưng bị 7 dải chrome bóp và bị cụm 3 nút nổi che giữa canvas | 🟡 có, đứng sai hạng |
| 3D | **khung nhìn / kết quả** | xám trống + chữ mờ + watermark `React Flow` | 🔴 |
| Trình chiếu | **trang đang dàn** | trắng | 🔴 |
| Kho vật liệu | **mẫu vật liệu** — vân thật, quả cầu | dòng bảng, ô ảnh hỏng | 🔴 |
| Thư viện | **các món** | thẻ đếm số | 🔴 |
| Gallery | **ảnh** | ô nhập URL | 🔴 |
| Files | **tệp** | hộp xám rỗng | 🔴 |
| Bảng việc | **thẻ việc trên cột** | ✅ đúng | ✅ |

**Ngưỡng đã có sẵn trong sổ, dùng lại, không đo lại** (chốt 07/08): ảnh xem trước **141px là
QUÁ NHỎ** để phân biệt vân gỗ sồi với óc chó; ba nấc thẻ **122 · 168 · 232**, mặc định **Vừa 168**.
⇒ Mọi *nấc-hình* về sau phải nêu ngưỡng đo được; không nêu là chưa xong.

### Nấc ④ · CHỖ ĐỨNG — theo LUỒNG TAY, không theo thẩm mỹ

> Nấc hay bị bỏ nhất và tốn nhất. Một thứ đẹp đặt sai chỗ so với luồng tay thì người dùng
> **trả giá vài chục lần mỗi ngày**.

**Luồng tay thật của KTS trên desktop:** mắt rơi vào **giữa-trên** · tay trái ở phím tắt · tay phải
giữ chuột **trên canvas, ở giữa màn** · rìa màn = thứ dùng thỉnh thoảng.

| Thứ | Chỗ đứng đúng | **Lý do theo luồng tay** | Hiện đang ở đâu |
|---|---|---|---|
| **Chọn vật liệu lúc đang làm** | **cạnh vật đang chọn** (near-pointer capsule — EXS §10 độ sâu ①) | tay đang ở canvas; bắt đi sang route `/materials` là **rời việc** — trả giá mỗi lần đổi vật liệu | `MaterialPalette` có trong dock 2D 🟡; `/materials` là một mục rail |
| **Hệ quả của việc đổi vật liệu** | **mép phải · Peek**, không chặn tay | *"cái gì đáng quan tâm lúc này"* (luật 5 vùng) — nó phải **nói được**, không được **hỏi lại** | `MaterialImpactPreview` tồn tại, chưa thấy trên ảnh |
| **Nhân vật chính của Home** | **giữa-trên, khối lớn nhất màn** | mắt rơi vào đó trước; phải rơi trúng **công việc**, không rơi trúng câu hỏi | rơi trúng một khối chữ |
| **Vitals** | **mép trên, MỘT toạ độ CỐ ĐỊNH** | chữ ký sản phẩm phải **đứng yên** thì tay mới đoán được | 🔴 dịch **94px** giữa 4 màn (2D 767 · 3D 767 · Home 840 · Present 861) và gần vô hình |
| **Lệnh 2D dùng liên tục** | tầng luôn-hiện **≤ trần**, phần còn lại về **cạnh con trỏ** + dòng lệnh | đáy màn cách con trỏ **~300px**; mỗi lần đổi công cụ là một chuyến đi khứ hồi | 🔴 **2 hàng dock ở đáy**, hàng 1 **tràn khỏi mép phải 1440, mất ít nhất 1 lệnh, không có cửa tràn** |
| **Nguyên liệu của dự án ở Trình chiếu** | **giữa màn khi rỗng** → lùi ra rìa khi đã có trang | lúc rỗng, mắt không có gì để bám; lúc có trang, trang là nhân vật chính | 🔴 không có gì ở cả hai trạng thái |
| **Quản lý việc (V10)** | rìa / theo yêu cầu | không phải lý do mở app | ✅ đúng chỗ (một mục rail) |

---

## BƯỚC 2 · BẢNG GIAO ĐỀ — IF giống ca nào, và **KHÁC** ở đâu

> ⛔ **Cột KHÁC quan trọng hơn cột GIỐNG.** Repo đã trả giá một lần: khảo sát 10 app kết luận
> *"thư viện là tấm mở đè, không lên sidebar"* — sai, vì thư viện của họ là **kho để đi tìm**, còn
> Master Library của IF là thứ **mang đồ tới cho người dùng**. Hai con vật khác nhau; mượn luật của
> con này áp cho con kia là hỏng.
>
> ⛔ Đề mơ hồ kiểu *"nghiên cứu bố cục Home"* là **đề chết**. Mỗi đề dưới đây phải trả về **ngưỡng
> đo được + nguồn**, không trả về cảm nhận.

| # | Đầu mục | Đặc điểm IF | Ca global tương tự | **KHÁC ở đâu — vì sao không chép thẳng** | Hỏi nghiên cứu điều gì (đề giao) |
|---|---|---|---|---|---|
| **Đ1** | **Bề mặt quay-lại-việc (Home)** | việc đang dở là **hiện vật nhìn được**, thuộc **nhiều loại** (mặt bằng · phối cảnh · moodboard · trang hồ sơ), nằm trong cây `Project → Workspace → Canvas`; có trạng thái rỗng thật | Figma *Recents* · Procreate *Gallery* · Lightroom *catalog* · Capture One *sessions* · (ca xấu để đối chiếu: VS Code *Welcome* = danh sách đường dẫn) | ① Figma/Procreate quay lại **một loại vật**; IF nhiều loại thuộc nhiều chặng ⇒ ảnh thu nhỏ **không đủ** nói *đang ở chặng nào, dở cái gì*. ② Họ không có *sự thật dự án* đằng sau; Home của IF còn phải trả lời **cần xử gì** ⇒ mang một **trạng thái nghề**, không chỉ một ảnh. ③ Recents của họ là **kho phẳng**; IF có ba tầng nên phải nói được *thuộc dự án nào* mà không thành breadcrumb dày. ④ Rỗng: họ đưa template; IF phải đưa **đường vào nghề** (khai vị trí công trình → kéo theo cả bộ quy chuẩn) | app nào lấy **hiện vật NHIỀU LOẠI** làm nhân vật chính ở khổ ≥1440: ⓐ tỉ lệ diện tích dành cho nhân vật chính · ⓑ **số phần tử hạng dưới tối đa** trước khi đọc ra dashboard · ⓒ họ **phân biệt loại việc** bằng gì (nhãn? khung? tỉ lệ? chất liệu?) · ⓓ khi **chưa có hiện vật nào** thì đặt gì vào chỗ đó mà **không** thành 6 thẻ onboarding |
| **Đ2** | **Vật liệu — một vật, BA MẶT** ⭐ hào | một `matId` đồng thời là **ký hiệu/hatch 2D · PBR 3D · dòng giá BOQ**. ⚡ Đo tại nguồn: `lib/materials/resolve.ts::getMaterial` **ĐÃ CẮM ĐIỆN** (`MaterialsScreen.tsx:145` · `app/files/_lib/ngan-tho.ts:149`) — cột *"Ba mặt"* trên ảnh **chính là nó**. Logic xong; **hình thức sai** | Substance 3D Assets · D5 Render / Enscape material library (đúng ngành) · Revit *Material Browser* (**ca xấu ngành**) · về "một vật nhiều mặt": Figma *component + Where Used* | ① Substance/D5 chỉ có mặt **thị giác** — không giá, không nhà cung cấp, không hatch 2D. IF có **ba mặt thuộc ba ngành** (vẽ kỹ thuật · render · thương mại) ⇒ không chép được giao diện thuần-thị-giác. ② Revit **có** mặt thương mại nhưng bày kiểu bảng — và đó đúng là thứ IF đang làm, đúng thứ dân nghề ghét. ③ *Where Used* của Figma là **cùng loại** (component→instance); của IF là **xuyên loại** (vật liệu → nét vẽ · mặt render · **dòng tiền**). ④ IF có luật riêng **BOQ chỉ nhận số đo được** ⇒ mặt thương mại phải phân biệt *đã đo* ↔ *chưa đo*; chưa app nào phải làm việc này | ⓐ thư viện vật liệu **ngành** (D5 · Enscape · Substance): một mẫu bày ở mấy nấc thông tin, **ngưỡng px** để phân biệt vân, và cách họ đặt **thuộc tính KHÔNG nhìn được** (giá · NCC · mã) cạnh thuộc tính nhìn được · ⓑ app nào có **xem trước tác động xuyên nhiều loại hệ quả** — trình ở đâu (panel/inline/modal), **trước hay sau** khi người dùng bấm đổi, và cách họ hiện *"chỗ này chưa đo được"* |
| **Đ3** | **Cửa chọn vật liệu LÚC ĐANG LÀM** | tách khỏi Đ2 vì **luồng tay khác hẳn**: đang ở canvas, chọn mảng → đổi → thấy ngay. Mã đã có (`MaterialPalette` · `MaterialImpactPreview`) | Photoshop *Swatches* · Blender *Material Properties* · D5 *asset drawer* kéo-thả thẳng vào mặt · Figma *fill picker* | lúc đang làm, KTS **không muốn đọc BOQ** — nhưng IF hứa *một vật ba mặt*. ⇒ câu thật là **cái gì hiện lúc chọn, cái gì để dành**. Đây đúng ca *"ba nấc = ba CÔNG NĂNG"*, và các app trên **không có mặt thứ ba** nên không trả lời hộ được | ⓐ các app trên tách **chọn nhanh ↔ xem sâu** ở đâu, bằng cơ chế gì · ⓑ **ngưỡng số món** để chuyển từ lưới-nổi sang panel · ⓒ kéo-thả ↔ bấm-chọn: ca nào ít lỗi hơn khi vật đích nhỏ · ⓓ có ca nào cho *xem trước hệ quả tài chính* ngay lúc chọn không |
| **Đ4** | **Bàn vẽ 2D bị chrome bóp** | **7 dải chrome** (trần hợp đồng là **2**); dock 2 hàng; hàng 1 **cắt cụt tại 1440 không cửa tràn**; nhãn nhóm **HOA toàn phần tiếng Việt**; 59 lệnh trong `lib/commands/registry.ts` dùng chung 3 chặng; **tầng ② nhóm lệnh CHƯA dựng** nên tầng ① gánh hết | AutoCAD *ribbon* → Blender *pie + F9 Adjust Last Operation* → SketchUp *toolbar tí hon* → Figma *toolbar 8 mục* · Rhino *command line* | ① AutoCAD và SketchUp mỗi bên chọn **một cực**; IF phải phục vụ **cả hai lối trong cùng một shell** (Sơ phác ↔ Chuyên). ② IF có **ký hiệu bản vẽ ISO** làm vốn icon — thứ Figma/Blender không có, và là loại icon duy nhất đối thủ đa dụng không có được. ③ IF là Electron **1440**, không phải app toàn màn 27" ⇒ trần chỗ chật hơn hẳn | ⓐ app nghề nào giữ được **≤2 dải chrome** mà vẫn phủ 50+ lệnh — **cơ chế nào gánh phần còn lại** (pie · dòng lệnh · capsule bám vật · nhóm) · ⓑ **con số**: bao nhiêu lệnh ở tầng luôn-hiện, ngưỡng nào thì đẩy xuống nhóm · ⓒ ca đo được nào cho thấy chuyển toolbar → pie/dòng lệnh làm **giảm hay tăng** lỗi/thời gian · ⓓ hai khuôn nhóm (*thư mục iOS* ↔ *ổ Photoshop*) — ca nào hợp nhóm dùng-liên-tục, ca nào hợp nhóm tra-thỉnh-thoảng |
| **Đ5** | **Trình chiếu — trắng, không có trạng thái rỗng** | nơi **ĐÓNG GÓI**, không sản xuất mới. Vốn sẵn: 5 loại hồ sơ đã spec · Auto Grid (capability **trong** stage này) · luật **dàn ý chờ sẵn** (ý chốt ở chặng 2 gói thành dàn ý đứng đợi ở chặng 3) | Canva *start-from + brand kit* · Pitch/Framer *template gallery* · Keynote *theme chooser* · ⭐ đúng ca hơn: **Lightroom Book/Print module** · InDesign *master pages + data merge* | ① Canva/Pitch bắt đầu từ **trống + template đẹp**; IF bắt đầu từ **một dự án ĐÃ CÓ nội dung thật** (bản vẽ · phối cảnh · vật liệu · BOQ) ⇒ trạng thái rỗng của IF **không được là gallery template**, nó phải là *"đây là những gì dự án này đang có — chọn cái nào vào hồ sơ"*. **Đây là chỗ IF thắng Canva, và hiện đang bỏ trống.** ② *Dàn ý chờ sẵn* **không có tiền lệ ngoài kia** vì không app nào có chặng trước nối vào | ⓐ công cụ nào mở ra với **nội dung sẵn có của người dùng** làm điểm bắt đầu (không phải template rỗng) — họ bày *"kho nguyên liệu của dự án này"* ở đâu, xếp theo gì · ⓑ **ngành kiến trúc/nội thất**: bộ hồ sơ trình khách thật gồm **mấy phần, thứ tự nào** (để dàn ý chờ sẵn có xương thật, không bịa) · ⓒ Lightroom Book / InDesign: người dùng chọn **bố cục trước** hay **nội dung trước**, và cơ chế đổ-nội-dung-vào-bố-cục trình ra sao |
| **Đ6** | **Thư viện — mang đồ TỚI, không phải kho đi tìm** | Master Library **hiểu ngữ cảnh và đề xuất đúng chỗ đang làm** (chốt 10/08); 8 kệ; hiện là 9 thẻ đếm số, phải bấm *Mở kệ* mới thấy gì | ⚠️ **KHÔNG hỏi ca kho-đi-tìm** (Finder · Bridge · Eagle · Are.na) — đó đúng cái bẫy đã trả giá. Hỏi **ca mang-đồ-tới**: Figma *Assets panel + component suggestion* · Unreal *Place Actors* · gợi ý inline của IDE / Copilot | ① đề xuất của IF phải có **lý do truy được** (gia phả · Thẻ DNA · vị trí công trình), không phải *"gợi ý vì phổ biến"* — đây là ràng buộc N-2/N-3 mà không ca nào ngoài kia mang. ② IF vẫn cần **mặt kho tổng** cho việc *lập/nhập*, nên câu hỏi là **hai mặt sống chung thế nào**, không phải chọn một | ⓐ app nào đưa tài sản **tới chỗ đang làm** — cơ chế xếp hạng, cách **khai lý do**, cách người dùng **bác bỏ** một đề xuất · ⓑ mặt *kho tổng* của những app đó **còn tồn tại không**; còn thì nó phục vụ việc gì khác, và **đứng ở đâu** · ⓒ ngưỡng: bao nhiêu đề xuất một lúc trước khi thành nhiễu |
| **Đ7** | **Vitals — khẩu độ mép trên** | mặt AI **DUY NHẤT** của IF (chốt 04/09); mép trên; 3 mức Ambient→Peek→Engage; **im lặng là trạng thái hợp lệ** và phải phân biệt *im vì không có gì* ↔ *im vì không đo được* (K5); nấc 3 = đồ thị chuỗi việc **kèm giá + nút duyệt** | ⭐ **Dynamic Island (iOS)** — đúng nhất: khẩu độ ở mép, morph theo ngữ cảnh, ambient→expanded · Siri iOS 27 · macOS notch · (khác loại, để đối chiếu: Raycast/Spotlight = cửa gọi lệnh) | ① Dynamic Island báo **sự kiện đang chạy** (nhạc · hẹn giờ); Vitals báo **điều đáng biết về công việc thiết kế** ⇒ phải nói được *cái gì* **và** *thuộc vật nào*. ② Dynamic Island **không bao giờ** đòi người dùng duyệt một việc; nấc 3 của Vitals có **duyệt + chi phí credit**. ③ Không ca nào ngoài kia phải phân biệt *im vì không có gì* ↔ *im vì hỏng nguồn* | ⓐ **ngưỡng nhìn thấy được ở trạng thái nghỉ**: tương phản + kích thước tối thiểu để người dùng **MỚI** biết là có nó (hiện gần trùng màu thanh trên) · ⓑ **quy tắc neo toạ độ ngang** — 🔴 **PH-18 khai: không luật nào trong repo quy định điều này**, đây là vùng trống thật · ⓒ các ca đó báo *"chưa đo được"* khác *"không có gì"* bằng gì · ⓓ mức mở rộng nào thì được phép **chặn tay** người dùng |
| **Đ8** | **Trạng thái rỗng là một BỀ MẶT LÀM VIỆC** | cắt ngang mọi màn: tài khoản KTS mới gặp rỗng ở **6/10 màn đã chụp**. Luật X2 cấm chặn. ⭐ **Khuôn tốt nhất đã nằm TRONG IF**: Bảng việc (`08-viec.png`) — nói thiếu gì · vì sao · làm gì tiếp + **5 mẫu quy trình nghề** | Linear *empty state as workspace* · Notion *template picker* | **đề này KHÔNG cần đi học ai** — nó cần **nhân bản khuôn nội bộ đã có**. Học ngoài vào đây là tự chế lại thứ mình có (tội N8) | đề **rất hẹp**, chỉ hỏi **ngưỡng**: ⓐ bao nhiêu lựa chọn ở trạng thái rỗng là **quá nhiều** · ⓑ **khi nào** trạng thái rỗng phải biến mất hẳn (sau bao nhiêu nội dung) · ⓒ có ca nào giữ nó lại như lối tắt thường trực không, và trả giá gì |

---

## BƯỚC 3 · THỨ TỰ ĐẦU MỤC — và **vì sao thứ tự đó**

**Nguyên tắc xếp: cái chặn nhiều thứ nhất đi trước.** Không xếp theo *cái nào dễ*, cũng không xếp
theo *cái nào Hoà vừa nhắc*.

| Hạng | Đầu mục | Nó **chặn** cái gì | Bằng chứng |
|---|---|---|---|
| **1** | **Đ2 + Đ3 · VẬT LIỆU (một vật, ba mặt)** | **4 bề mặt khác đang đói nội dung vì nó**: kệ Vật liệu ở Thư viện (Đ6) · cửa chọn ở 3D (V4) · bảng vật liệu A3 + BOQ ở Trình chiếu (Đ5) · ô *"xưởng đang có"* ở Home — **ô này đang BỊA một dải màu vì không có mẫu thật để bày** | PH-03 · `05-vat-lieu.png` · `06-thu-vien.png` |
| **2** | **Đ1 · HOME** | không chặn ai, nhưng **phơi ra nhiều nhất** và **đã trượt 3 lần** | sổ cách ly mục ③ |
| **3** | **Đ5 · TRÌNH CHIẾU** | không chặn ai — nhưng là **lỗ đơn lẻ to nhất** và đứng ở việc **giá trị quyết định cao nhất (V6)** | PH-01: trắng **71% màn**, hai chỉ dẫn trỏ vào hai thứ không tồn tại |
| **4** | **Đ4 · BÀN VẼ 2D** | tự nó **bị chặn**: không giảm được dải chrome khi **tầng ② nhóm lệnh chưa dựng** ⇒ phải nghiên cứu trước, không thi công trước | PH-11 (7 dải, 22/08 đếm 7 — **hai tuần không đổi**) · PH-02 (cắt cụt tại 1440) |
| **5** | **Đ6 · THƯ VIỆN mang-đồ-tới** | phụ thuộc Đ2 (phải có vật thật để mang) và Đ3 (cửa chọn tại chỗ **chính là** mặt "mang tới") | — |
| **6** | **Đ7 · VITALS** | độc lập, nhỏ, nhưng có **một khoảng trống luật thật** cần đóng | PH-18: dịch 94px, **không luật nào quy định toạ độ ngang** |
| **7** | **Đ8 · TRẠNG THÁI RỖNG** | rẻ nhất, chạy **song song bất cứ lúc nào**; phần lớn là chép khuôn nội bộ | `08-viec.png` |

### ⭐ Vì sao Đ2 đứng trên Đ1 — dù Hoà đang nhìn Home

Đây là chỗ tôi **nói ngược thứ tự trực giác**, nên phải nói rõ lý do:

1. **Home trượt vì thiếu NỘI DUNG, không vì thiếu BỐ CỤC.** Năm phát hiện nặng nhất trên Home
   (PH-03 · 04 · 05 · 13 · 14) đều là *nội dung bịa để lấp bố cục*. Giao bố cục lần thứ tư khi
   chưa ai chốt *mảnh việc sống là cái gì* thì sẽ trượt lần thứ tư.
2. **Vật liệu là bộ sinh nội dung của IF.** Nó là đối tượng duy nhất phải xuất hiện ở **cả ba
   chặng**, nên làm đúng hình thức cho nó là **đặt luôn ngôn ngữ thị giác cho mọi đối tượng
   xuyên-chặng** (N-14).
3. **Nó là hào (N-2), và hào đang vô hình.** ⚡ Đo tại nguồn: logic ba mặt **đã chạy thật** —
   `getMaterial()` có nơi gọi ở `MaterialsScreen.tsx:145` và `app/files/_lib/ngan-tho.ts:149`;
   cột *"Ba mặt"* với chip `2D · 3D · Giá` trên ảnh **chính là nó**. ⇒ **Đây là việc THIẾT KẾ
   thuần, không phải việc đấu dây.** Thứ đắt nhất của sản phẩm đang được bày dưới hình thức một
   dòng bảng CSDL — đúng thứ N-5 cấm (*"không phải một chỗ để quản trị bản ghi CSDL"*).
4. **Rẻ hơn Home và ít rủi ro gu hơn.** Kho vật liệu là **bề mặt nhỏ, có ràng buộc nghề rõ**
   (ngưỡng px để phân biệt vân đã chốt 07/08), nên nó **quy về số được** — trong khi Home là bề
   mặt lớn, đúng loại N-16 nói máy không phán được.

> ⚖️ **Nếu Hoà muốn Home vẫn đi trước** thì đó là quyền của Hoà và tôi không cãi — nhưng khi đó
> **phải chốt trước một câu**: *"mảnh việc sống hiện ra bằng hiện vật gì, ở nấc nào"*. Không chốt
> câu đó thì lượt Home thứ tư sẽ lại phải bịa nội dung, và sẽ lại trượt vì đúng lý do cũ.

### Chưa đủ dữ kiện để xếp — **khai thẳng, không xếp bừa**

| Đầu mục | Thiếu gì |
|---|---|
| **Chặng 3D** | chỉ có **một** ảnh, ở trạng thái **rỗng**, và ở **mode canvas node**. Chưa thấy: 3D có nội dung thật · mode *Vẽ 3D* · quan hệ thị giác giữa hai mode. Bản chấm cũng ghi **D4 = chưa có bản vẽ cho canvas node**. ⇒ cần thêm ảnh trước khi giao đề |
| **Files hai tầng · Collection+** | Hoà chốt 17/08 hai **TẦNG** (thư mục hệ thống + Collection+ 8 gói). Ảnh chỉ thấy tầng ① + một nút *"Đến Collection+"*; tầng ② chưa nhìn thấy. Không biết đã dựng tới đâu |
| **Chat / Họp** | stage đã chốt ở CẤP 0.5 (11/08), có `app/api/chat/route.ts` nhưng **không có trang** (đo 16/08). Không có bề mặt để chấm |
| **V8 · truy nguồn (Context Stack mép phải)** | EXS §9 chốt 5 lens, nhưng **không thấy trên bất kỳ ảnh nào trong 12 ảnh**. Chưa biết đã có mặt tiền nào chưa |

---

## ⑦b · CHƯA CHẮC / CHƯA KIỂM

1. **Không có bản kiểm kê năng lực.** `docs/delivery/KIEM-KE-NANG-LUC.md` chưa tồn tại lúc lượt này
   chạy. Nấc ① là **suy** từ mã + route + `J01…J23` + 5 mẫu quy trình trong sản phẩm — **không phải
   đọc từ bản kiểm kê**. Khi bản đó ra, **phải đối chiếu lại nấc ①**; nếu nó liệt ra việc nghề mà
   tôi không có, thứ tự V1…V10 có thể đổi.
2. **Chỉ một bề rộng, một theme, một trạng thái dữ liệu.** 1440×900 · theme **sáng** · **1 dự án**,
   gần như mọi thứ rỗng. Chưa biết các màn này trông thế nào khi **dày việc** hoặc **≥7 dự án** —
   mà đó đúng là hai ca `§5-A` và `§5-C` bắt buộc phải chứng minh. Theme **tối chưa soi**.
3. **Ảnh TĨNH — không kết luận được gì về chuyển động, hover, cảm ứng, hé lộ dần.** Mọi nhận định
   về *"ba nấc"*, morph, mở-từ-tâm trong bản này là **suy từ luật**, không phải quan sát.
4. **Tần suất trong nấc ① là ƯỚC LƯỢNG NGHỀ, chưa hỏi người dùng thật.** Không có telemetry
   (lỗ ❌ *telemetry local-first* vẫn mở trong STATUS). Nếu KTS thật dùng khác — ví dụ mở IF chủ yếu
   để **trình khách** chứ không để **vẽ** — thì V3 và V6 phải đảo.
5. **"Cột KHÁC" trong bảng giao đề là LẬP LUẬN, chưa phải bằng chứng.** Tôi chưa mở D5 · Substance ·
   Lightroom Book · Dynamic Island để kiểm — **đúng ranh giới vai**: chuyên môn chỉ chỗ, nghiên cứu
   mới đào. Nghiên cứu **được phép bác** bất kỳ dòng nào trong cột đó, và nên bác nếu sai.
6. **Tôi đã sai hai giả định trong chính lượt này, đã tự sửa bằng cách đo tại nguồn** — ghi lại vì
   nó là cảnh báo cho lượt sau: ① tôi định viết *"`getMaterial` chưa có nơi gọi"* dựa theo dòng
   17/08 trong `00-CHOT`; `grep` cho thấy nó **đã cắm điện** ở 2 nơi ⇒ Đ2 là việc **thiết kế**,
   không phải việc **đấu dây**. ② tôi định viết *"chưa có xem trước tác động"*; `lib/materials/impact.ts`
   có `MaterialImpactPreview.tsx` + `MaterialPalette.tsx` dùng thật. **Sổ tụt sau mã — đo lại, đừng
   nhớ hộ.**
7. **Đ7 vùng trống là ghi nhận của bản chấm, tôi chưa tự tra lại.** PH-18 khai *"không tra được luật
   nào quy định toạ độ ngang của khẩu độ"*. Tôi **chưa** tự grep để xác nhận vùng trống đó thật sự
   trống. Nghiên cứu nên kiểm trước khi coi là đề.
8. **Chưa đối chiếu với board `EXS-A…L` trên Claude Design.** Cột ④ của cổng `N4` (visual chưng cất)
   là **`[KHÔNG TRA ĐƯỢC]`** trong lượt này — tôi không mở được board. Trước khi biến bảng này thành
   PLAN, phải tra cột ④ cho từng đầu mục.
9. **Không chấm lại 4 màn.** Tôi dùng bản chấm độc lập làm **dữ kiện**, đúng đề bài. Nếu bản chấm
   đó sai ở đâu thì bản này thừa hưởng cái sai — trừ hai chỗ tôi đã tự đo lại (mục 6).

---

## Ô KẾT

### ① VẤN ĐỀ
**Mọi bề mặt có nội dung của IF đang bày cái hộp thay vì bày cái đựng bên trong** —
đo được: **6/10 màn** chụp được có nhân vật chính **sai loại** (Home = khối chữ · Kho vật liệu =
bảng CSDL · Thư viện = 9 thẻ đếm số · Files = 5 hộp xám rỗng · Gallery = ô nhập URL · Trình chiếu =
**trắng 71% diện tích màn**); trọng tài độc lập **FAIL 4/4 màn**, trục `A1 việc-của-con-người` và
`A6 · D1 sự-thật-dữ-liệu` **trượt cả bốn**. Và **năm phát hiện nặng nhất trên Home đều là nội dung
bịa để lấp bố cục** — tức trang trí là **hệ quả** của chỗ trống, không phải nguyên nhân độc lập.

### ② GIẢI PHÁP
Không sửa từng món trang trí. Đi theo thứ tự **cái chặn nhiều thứ nhất trước**:

| Thứ tự | Việc | Ai làm | Xong thì **thấy** gì |
|---|---|---|---|
| 1 | **Giao 8 đề nghiên cứu** trong bảng BƯỚC 2, mỗi đề đòi **ngưỡng đo được + nguồn** | bàn NGHIÊN CỨU | 8 báo cáo; đề nào không trả về được ngưỡng thì bàn B **bác và giao lại** |
| 2 | **Đ2+Đ3 vật liệu ra hình thức đúng** (bảng CSDL → đối tượng vật liệu ba mặt) | B ra plan → THỰC THI | `/materials` bày **mẫu nhìn được ở ≥168px**; dải màu bịa trên Home **biến mất vì có mẫu thật thay chỗ** |
| 3 | **Đ1 Home** — chỉ khởi động **sau khi** chốt *"mảnh việc sống hiện bằng hiện vật gì"* | B → Hoà chốt một câu → THỰC THI | Home mở ra rơi trúng **một hiện vật thật**, không rơi trúng câu hỏi |
| 4 | **Đ5 Trình chiếu** — trạng thái rỗng = *"dự án này đang có gì"*, không phải gallery template | B → THỰC THI | 71% màn trắng **có nội dung của chính dự án** |
| 5 | **Đ4 2D** — chỉ thi công **sau** khi nghiên cứu trả về chỗ chứa cho 50+ lệnh | NGHIÊN CỨU → B → THỰC THI | 7 dải → **≤ trần hợp đồng**; hết cắt cụt ở 1440 |
| 6-7 | **Đ6 · Đ7 · Đ8** | theo hạng | — |

### ③ RỦI RO — rủi ro của **chính giải pháp này**

| Rủi ro | Chặn bằng gì |
|---|---|
| **Xếp Đ2 trên Đ1 làm chậm thứ Hoà đang chờ.** Hoà vừa chốt Home 04/09 (`D-DR2` · `HOME-LIVE`) và đang chờ; tôi lại đẩy Home xuống hạng 2 | Đ2 là **bề mặt nhỏ, quy được về số** (ngưỡng px đã chốt 07/08) nên **rẻ và nhanh**; và tôi đã ghi rõ đường đi nếu Hoà vẫn muốn Home trước — **chốt trước một câu** về hiện vật. Hoà lật thứ tự thì lật, tôi không chặn |
| **"Bày đồ thay vì bày hộp" có thể bị đọc thành "nhét ảnh vào mọi chỗ"** ⇒ đẻ ra tường ảnh, đúng cờ đỏ `tường widget` ở dạng mới | Ràng buộc kèm theo, viết vào plan: **một nhân vật chính mỗi màn** (N-9 ③) · hạng dưới **vẫn phải lùi** (N-11) · nội dung **phải THẬT**, dùng dữ liệu mẫu thì **ghi rõ DEMO** (§28) |
| **Tám đề nghiên cứu chạy về cùng lúc = quá tải, và mắt Hoà là tài nguyên khan nhất** | Giao **theo hạng**, không giao cả tám: hạng 1-3 trước (Đ2 · Đ3 · Đ1 · Đ5). Đ8 chạy song song vì gần như không tốn nghiên cứu |
| **Cột KHÁC của tôi có thể sai** — tôi chưa mở app nào trong danh sách; sai một dòng ở đó thì nghiên cứu đào lạc, và mọi thứ sau lạc theo | Đã khai ở ⑦b-5 và **cấp quyền bác** cho bàn nghiên cứu: mỗi báo cáo phải có ô *"cột KHÁC của B đúng/sai chỗ nào"*. Cơ chế agent-được-bác-T đã bắt 6 lỗi của T trong một ngày — dùng lại đúng cơ chế đó |
| **Đ2 làm xong nhưng đụng vùng DÀY** (`Material` nằm trong danh sách vùng dày của luật NO-REBUILD `§B25`) ⇒ dễ trượt sang `NEW` khi đáng lẽ `EXTEND` | Plan **bắt buộc** mang bảng `Need · Existing Primitive · Evidence file:line · Coverage · Action`. Đã có bằng chứng sẵn: `resolve.ts::getMaterial` · `ba-mat.ts` · `impact.ts` · `MaterialPalette.tsx` **đều đang sống** ⇒ mặc định là **đổi hình thức**, không viết lại lõi |
| **Máy đang ĐỎ ở cấp app** (`soi:foundation` 185 vi phạm · 2 bánh cóc `soi:thao-tac` **đã kịch trần**) ⇒ mọi thứ dựng thêm sẽ bị chặn ở cổng, hoặc tệ hơn là **nới trần** | Nêu vào plan như **điều kiện tiên quyết**, không phải việc dọn kèm. Đặc biệt: hai bánh cóc kịch trần nghĩa là **việc mới không được thêm một hex inline nào** |

### ④ ĐẠT ĐƯỢC — và **biết bằng cách nào**

| Đạt được | Kiểm bằng |
|---|---|
| **Chẩn đoán thay 10 lỗi rời bằng 1 bệnh có tên** — và nó **giải thích được** vì sao Home trượt ba lần | 7/7 màn trong bảng ⭐ khớp cùng một mô tả; 5/5 phát hiện nặng nhất trên Home rơi đúng vào *nội dung bịa để lấp bố cục* |
| **Một thứ tự ưu tiên có lý do đo được**, thay cho *"sửa màn nào trước"* | mỗi hạng nêu **nó chặn cái gì**, kèm ảnh hoặc `tệp:dòng` |
| **Tám đề nghiên cứu đào được** — mỗi đề nêu **cột KHÁC** để không chép nhầm con-vật-khác | đối chiếu chính ca đã trả giá (*thư viện = kho đi tìm*): Đ6 nay **cấm** hỏi Finder/Bridge/Eagle và chuyển sang ca mang-đồ-tới |
| **Hai giả định sai của sổ được sửa bằng phép đo** | `getMaterial` **có** 2 nơi gọi thật (`MaterialsScreen.tsx:145` · `ngan-tho.ts:149`) · `impact.ts` **có** 3 nơi dùng ⇒ Đ2 chuyển từ *"việc đấu dây"* sang *"việc thiết kế"*, đổi hẳn cách giao phiếu |
| **Bốn vùng thiếu dữ kiện được khai ra thay vì xếp bừa** | mục *"Chưa đủ dữ kiện"* nêu đích danh thứ còn thiếu cho từng vùng (thêm ảnh 3D · tầng ② Files · trang Chat · mặt tiền Context Stack) |

**Chưa đạt được, nói thẳng:** lượt này **không** đổi một pixel nào trên app, và **không** trả lời
được câu *"bố cục Home cụ thể ra sao"* — đó là việc của nghiên cứu rồi tới plan. Ai đọc bản này mà
đi code luôn là đọc sai.
