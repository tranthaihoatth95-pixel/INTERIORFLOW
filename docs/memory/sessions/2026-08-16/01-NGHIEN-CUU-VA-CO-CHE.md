# Bàn giao — tất cả những gì đã nghiên cứu, tìm ra và áp dụng (phiên 16–17/08)

> Sắp theo **chủ đề**, không theo thời gian. Kiến trúc sản phẩm nằm ở `docs/IF-KIEN-TRUC.md`;
> file này giữ **nghiên cứu + cơ chế làm việc** — thứ không thuộc bản đồ nhưng mất thì phải học lại.

---

# A · NGHIÊN CỨU NGOÀI — bốn bài, đều có nguồn

## A1 · Điều hướng của 10 app tương tự
Khảo Revit · Archicad · SketchUp · Rhino · D5 · Figma · Notion · Linear · Miro · Autodesk CC.
Rút **6 ranh giới**:
1. **Cài đặt KHÔNG BAO GIỜ ngang hàng trên thanh điều hướng chính** — luôn nằm sau danh tính. **10/10, không ngoại lệ.**
2. **Thư viện/tài sản = panel hoặc tấm mở đè**, không phải màn riêng (5/6 app có thư viện).
3. Tách phạm vi app ↔ tài liệu bằng **bề mặt khác nhau** · **bộ chọn ở đỉnh** · hoặc **hai lệnh tên khác nhau** — **không bao giờ** bằng hai mục cạnh nhau.
4. Cây điều hướng của dự án là **thuần dự án**.
5. Chưa mở dự án ⇒ **thay bằng màn khác**, không làm mờ mục.
6. Nav cho **sắp và ẩn**, không cho kéo giãn tự do.

⚠️ **Bài học đắt hơn cả kết quả**: T lấy R2 áp cho Thư viện của IF rồi kết luận sai. Thư viện các app kia là **kho ĐỂ ĐI TÌM**; Master Library của IF là **thứ MANG ĐỒ TỚI**. Cùng tên, khác con vật ⇒ luật không chuyển được. **Trước khi mượn luật ngành, kiểm thứ của mình có cùng bản chất không.**

## A2 · CAD + Revit trong một app — **ĐƯỢC**
Khác biệt bản chất: CAD vẽ **hình học**, Revit đặt **cấu kiện có tham số và quan hệ** — *"quan hệ được ngụ ý bởi cách bạn vẽ"* (Autodesk). Bằng chứng phía CAD: BricsCAD phải đẻ lệnh riêng `BIMCLASSIFY` để gán nghĩa cho solid ⇒ trước lệnh đó, hình **không có nghĩa**.

Trực giác của Hoà (*"3D CAD tựa Revit"*) **đúng ở phần đắt** (khối rắn · boolean · cắt để nhìn), **hụt ở phần quyết định**: vật biết nó là tường · type dùng chung · cửa là con của tường · bám cao độ/trục · **bản vẽ chiếu ra từ mô hình**. CAD có **kho chứa dữ liệu** nhưng **không có động cơ lan truyền**.

Bốn ca gộp thật: BricsCAD BIM (tầng tệp) · Vectorworks (tầng vật thể, *hybrid symbol*) · VisualARQ (plugin) · Archicad Morph (tầng công cụ — giá lộ rõ nhất: *"không tham số, không associative, xuất luôn ra BREP"*). Và **một ca thất bại Autodesk tự thừa nhận**: AutoCAD Architecture proxy objects *"năng lực giảm đáng kể"*.
⇒ **Luật cứng cho IF: đừng bao giờ để DWG/DXF thành nơi CẤT ngữ nghĩa.** IF đang làm đúng (`.idf` là nguồn, DXF chỉ là một đích chiếu).

**IF vướng đúng ba chỗ, cả ba là dây chưa nối:** mặt cắt cắt xong thì **chết** (sửa 3D không cập nhật) · `WallType` chưa ăn tới tim tường · cửa-hosted và tim tường **không biết nhau** (hai lời giải cho một câu hỏi).
**Không nên đuổi theo:** cơ chế lan truyền hai chiều đầy đủ của Revit — 30 năm công của Autodesk, và **không phải hào của IF**.

## A3 · Rà từ đa nghĩa — 8 từ, 9 dòng đỏ Hoà đã duyệt
`khối` · `kính` · `mat-` · `nấc` · `lớp` · `tầng` · `card` · mã điều khoản · và **bốn tên một thứ** (`widget`/`element`/`node`/`module`).
Ca đau nhất: **`lớp` mang 4 nghĩa cùng tên `layer`** — lớp bản vẽ CAD · phần tử z trong slide · trục Thẻ DNA · lớp luật/góp ý. Hai cái đầu **cùng bộ thao tác** ⇒ **sửa nhầm chặng mà máy vẫn báo xanh**.
Phiên nghiên cứu **bác một đề xuất của T** (`module` vô hại) và **sửa hai đề xuất khác** — đúng thứ nó được giao quyền làm.

## A4 · Soi ba chặng — *"3 chặng như 3 app"* nay có SỐ
| Phép đo | Kết quả |
|---|---|
| Khớp ổ vỏ chung | **3/7 = 43%** |
| Lệnh chung sống được | **19/30** — 2D 10/10 · 3D 7/10 · **Trình chiếu 2/10** |
| Một việc cùng một chỗ | **1/5 = 20%** |
| Chia sẻ code thật | **5,7%** dòng |
Trình chiếu **dựng lại 4/7 chỗ cắm** ⇒ canvas chỉ còn **~33%** màn (2D ~71% · 3D ~55%).
⭐ **Phát hiện đắt nhất**: **~49% bề rộng thanh công cụ mode Chuyên nằm NGOÀI mép màn**, báo hiệu duy nhất là một vệt mờ 18px. Nửa đồ nghề đang ở ngoài màn hình mà người dùng không có cách nào biết.

---

# B · ĐO ĐƯỢC TRONG REPO — sự thật thay cho trí nhớ

| Thứ | Sự thật |
|---|---|
| **Bản đồ kiến trúc** | tồn tại, **19 ngày không ai đọc** — con trỏ chỉ vào mẩu cụt 774 byte |
| **`master tool`** | **0 lần trong code**, 26 lần trong sổ · `ToolWindow` 13 trong code, 0 trong sổ |
| **`KB-5`** | lan **14 chỗ**, **chưa bao giờ được định nghĩa** (tài liệu gốc chỉ có KB-1..4) |
| **`.idfnotes`** | **0 code** — đuôi ma |
| **Đuôi tệp sống** | `.idf` 192 · `.idfc` 62 · `.idfp` 50 · `.ifpack` 41 |
| **Nav thật** | **5 mục** (Home · Tổng quan · Dự án&Flow · Files · Thư viện) — không phải 11 như T kể |
| **`/library`** | **không phải trang** — là redirect, Thư viện thực chất là **tấm mở đè** |
| **Chat** | có mã 171 dòng, mount thật — nhưng **không route**, chỉ sống ở 2/25 màn |
| **`StageSwitcher`** | **nơi mount DUY NHẤT** của Vitals ⇒ **bỏ dock = mất Vitals** |
| **sketch ↔ pro** | trục năng lực **không** viết bằng `cadMode` mà bằng `isPro` (25 lần/1 tệp) — T đo sai trục |
| **`--success` nền tối** | chữ trắng trên nó chỉ **2,51:1** — không dùng làm nền nút được |
| **`WidgetCard`** | tiêu đề `--t4` = 3,44/3,26 · số `--t5` = **1,98** — dưới ngưỡng, ăn cho **cả 10 widget** |

---

# C · CƠ CHẾ LÀM VIỆC — thứ đáng giữ nhất

## C1 · Cho agent quyền BÁC lại T
Ô **⓪ TIỀN ĐỀ**: T viết ra giả định của mình, agent **xác nhận hoặc bác**; bác thì **DỪNG**.
**Kết quả đo được: 9 lỗi của T, agent bắt cả 9, máy soi bắt 0.** Sai mã điều khoản · dẫn nhầm điều · sai lý do kỹ thuật · sai trục đo · đếm nhầm nguồn · mượn luật sai bản chất.
⇒ **Không lỗi nào máy bắt nổi**, vì chúng là lỗi **suy luận**, không phải lỗi cú pháp.

## C2 · Vòng tự đóng — trọng tài nằm TRONG vòng
Phiếu không giao *"làm rồi nộp"* mà giao **ĐÍCH + TRỌNG TÀI + TRẦN 5 VÒNG**. Trước đây IF có 10 trọng tài máy nhưng cả 10 đứng **ngoài** vòng: agent tự khai → T soi → T bảo sửa.
Đưa chúng vào trong thì **vòng tự đóng**, T chỉ soi cái đã sạch.

## C3 · Hiệu chuẩn công cụ trước khi tin nó
**Ba phiên độc lập cùng nghĩ ra một kỷ luật** — dấu hiệu nó đúng:
- một phiên **hiệu chuẩn bộ tính tương phản** bằng hai số đã biết rồi mới dùng cho số mới
- một phiên **hoàn nguyên rồi đo lại** để chứng minh đóng góp của mình bằng 0, thay vì lập luận *"không phải tôi"*
- một phiên **chấm thử thước trên ba thứ đã biết kết luận**, ra ba kết quả khác nhau ⇒ chứng minh thước không tự chế để hợp thức hoá

## C4 · Đổi tên không đổi giá trị → **so từng byte**
Áp phép đổi tên lên bản sao rồi so byte: mocks 115/115 trùng khít · code 1093/1096. Mạnh hơn so bảng màu vì bắt **cả thay đổi ngoài màu**.

## C5 · Nguyên tắc kiến trúc → **TEST**, không phải docstring
Câu *"hai tầng lệnh không đá nhau"* biến thành bất biến máy canh: lệnh trong cửa sổ bắt buộc mang tiền tố riêng, và **có test khẳng định không môi trường nào rò lệnh ra thanh chung**. Rò là **test đỏ**.
> Viết vào tài liệu là để **người đọc**. Viết thành test là để **nó không hỏng**.

## C6 · Khoá phạm vi — thứ va chạm là **VỐN TỪ**, không chỉ tệp
Hai phiên **không đụng một tệp nào của nhau vẫn va**: một bên khai tử một tên token, bên kia đang dựng mock dùng đúng tên đó.

## C7 · Không dùng worktree cách ly
Từng làm **3 agent chạy mù** trên mốc cũ lệch 167 commit. Thay bằng **khoá phạm vi tệp rời nhau** trong cây chính + ô **⓪b kiểm mốc git** trước khi làm.

---

# D · SÁU LUẬT RÚT RA — mỗi luật đổi bằng một lần trả giá

1. **Đo tại nguồn, đừng nhớ hộ máy.** *(Trả giá: 6 lần trích sai mã điều khoản, 1 lần đếm nhầm 9 thành 106.)*
2. **Sổ đặt tên thì phải kiểm code đã có tên chưa.** *(Trả giá: 6 phiếu đi sai vì `master tool` ↔ `ToolWindow`.)* Một khái niệm chỉ được nhiều tên khi **khác TẦNG** (nghề / sản phẩm / kỹ thuật) và **có khai ánh xạ**.
3. **Ba nấc = ba CÔNG NĂNG, không phải ba cỡ.** Nấc to phải có thứ nấc nhỏ **không thể** có. Không có gì để nhìn thì **bỏ nấc thứ ba**.
4. **Mượn luật ngành phải kiểm cùng bản chất.** *(Trả giá: xếp sai chỗ Thư viện.)*
5. **Yêu cầu không có ảnh ⇒ T vẽ lại trước, Hoà bác, rồi mới làm.** *(Đo được: lỗi đắt tập trung đúng chỗ không có ảnh.)*
6. **Nguyên tắc chỉ sống khi có máy canh.**

---

# E · ĐÃ ÁP DỤNG ĐƯỢC GÌ

**Ship:** ô giải nghĩa có hình · thanh tiến trình hai loại (bịa số = lỗi biên dịch) · cửa sổ công cụ v0 · máy soi từ điển hết mù `.md` · dọn tên token 687 chỗ · nút mờ đọc được ở nền sáng · router dashboard + widget việc-đang-dở · 4 lỗi Home Hoà soi từ ảnh thật · máy chụp màn từ 17 ảnh thiếu ba chặng lên **24 ảnh đủ**.

**Văn bản nền:** `docs/IF-KIEN-TRUC.md` (bản đồ mới) · `docs/CHOT-16-08-BAN-DUNG.md` (bảng đè chồng 6 chủ đề bị chốt nhiều lượt) · 4 bài nghiên cứu ở `docs/nc/`.

**Bản vẽ chờ mắt Hoà:** 7 bản trên Claude Design.

---

# F · CHƯA XONG — nói thẳng

1. **Máy đối chiếu sổ ↔ code** — chưa dựng. Là thứ duy nhất bắt được ba khái niệm ma, vì **quét riêng từng bên thì bên nào cũng nhất quán**.
2. **Cắm điện vật liệu** — hàm nối ba mảnh **đã có**, nhưng **0 nơi gọi ngoài test**.
3. **Dải đen trên/dưới màn chính** — sinh ra khi sửa thừa-trống; phải chẩn lại trên app thật.
4. **Design system thiếu thang chiều cao khối** — gốc kỹ thuật của mục 3.
5. **4 kịch bản sidebar phải dựng lại** — dựng trên danh sách stage cũ.
6. **70 việc xong-máy đối 1 việc qua mắt** — nút thắt lớn nhất, chỉ giảm khi Hoà nhìn.
