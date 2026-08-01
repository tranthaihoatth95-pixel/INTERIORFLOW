# Chặng 3 không phải "chặng" — nó là HÀM CHIẾU. Và đó cũng là chìa khoá của IF2

> Hoà nêu: CAD + Render tạo sản phẩm thô, Presenting trình diễn. `.idf` chứa đủ thông tin để
> Presenting biết phải hiện gì — có khi là bảng tính, có khi là pptx, có khi là phim, có khi là bộ
> bản vẽ soi kỹ chữ nghĩa rồi Ctrl+P. **Hiện thiếu hẳn bước đó.**
>
> Nhận định đúng. Nhưng tôi nghĩ có cách nói sắc hơn — và cách nói đó mở khoá luôn IF2.

---

## 1 · Cách nói sắc hơn: chặng 3 là TRÌNH BIÊN DỊCH, không phải trình dàn trang

Hiện `.idf` đang được đối xử như **một tệp dự án**. Nhưng thực chất nó là **cây cú pháp**:

| Trình biên dịch | InteriorFlow |
|---|---|
| Mã nguồn | Bản vẽ CAD + node graph Render |
| **Cây cú pháp (AST)** | **`.idf` — sự thật đã cấu trúc hoá** |
| Backend sinh mã | **Chặng 3** |
| Đích: x86 · ARM · WASM | **Đích: PDF in · PPTX · XLSX · MP4 · tablet công trường** |

Một trình biên dịch không "dàn trang" mã nguồn. Nó **chiếu** cây cú pháp vào từng đích, mỗi đích có
bộ tối ưu riêng — và **không đích nào sửa cây cú pháp**.

→ **Chặng 3 hiện đang được thiết kế như một trình dàn trang. Nó phải là một trình chiếu đa đích.**

Đây không phải chuyện chữ nghĩa. Nó đổi thứ phải xây: thay vì làm thêm nút "Xuất PPTX", ta xây
**một lớp mô tả nội dung** rồi mỗi đích tự đọc.

---

## 2 · Trả lời trực tiếp câu Hoà hỏi

> *"Mỗi chặng một nội dung riêng lẻ, tạo được nội dung riêng lẻ, nhưng kết hợp thì bổ trợ nhau?"*

**Có — nhưng chỉ đúng nếu ba chặng nói CÙNG MỘT NGÔN NGỮ mô tả nội dung.**

Không có ngôn ngữ chung thì "ba chặng độc lập" = **ba app khoác chung một cái áo**, và mọi thứ lại
phải chép tay qua lại — đúng cái bệnh IDF sinh ra để chữa.

Có ngôn ngữ chung thì mỗi chặng vừa **đứng riêng bán được**, vừa **cộng lại thành dây chuyền**.
Đó chính là mô hình đã dùng thành công cho ArchiNote ⇄ IF ⇄ ATLAS: *không gọi nhau, chỉ nói chung một
hợp đồng dữ liệu.* **Lặp lại đúng khuôn đó xuống tầng nội dung.**

---

## 3 · Lớp còn thiếu: mô tả NỘI DUNG, không phải mô tả BỐ CỤC

Mỗi mẩu nội dung trong `.idf` cần mang 5 thứ. Bốn cái đầu dễ nghĩ ra; **cái thứ 5 mới là cái đang
thiếu và đắt giá nhất.**

| # | Trường | Ví dụ |
|---|---|---|
| 1 | **Là gì** | bản vẽ · ảnh render · bảng số · ghi chú · mô hình 3D |
| 2 | **Vai trò** | chủ đạo · minh hoạ · phụ lục · bằng chứng |
| 3 | **Ràng buộc** | phải ≥300dpi · giữ tỉ lệ · không được cắt · bắt buộc có chú thích |
| 4 | **Quan hệ** | ảnh này sinh từ bản vẽ kia · bảng này tính từ vùng tô nọ |
| 5 | ⭐ **ĐỘ CHÍN** | **nháp · đã duyệt · đã chốt** |

**Vì sao ① độ chín là thứ quan trọng nhất:** hiện không có gì ngăn một con số nháp lọt vào hồ sơ gửi
khách. Có trường này thì đích "hồ sơ gửi khách" **tự lọc**, chỉ lấy nội dung `đã chốt` — và cảnh báo
đúng chỗ nào còn nháp.

Nó cũng nối thẳng với việc đo kích thước vừa làm: số 🟢 đo được và số 🟡 suy diễn **chính là hai mức
độ chín**. Cùng một cơ chế, không phải xây hai lần.

---

## 4 · Mỗi ĐÍCH là một hồ sơ tối ưu riêng

| Đích | Tối ưu cho | Luật riêng |
|---|---|---|
| **PDF hồ sơ in** | thợ đọc, chủ đầu tư ký | vector · ≥300dpi · khung tên · mục lục · đánh số tờ · tỉ lệ thật |
| **PPTX trình bày** | chiếu trong phòng họp | 1 ý/slide · ảnh lớn · chữ tối thiểu 18pt · **ghi chú người nói** |
| **XLSX** | phòng kỹ thuật, mua hàng | bảng số là chính, ảnh là phụ · đúng mẫu TTT · công thức còn sống |
| **Phim / MP4** | khách xem trên điện thoại | chuyển động theo thời gian · không chữ nhỏ · không chi tiết kỹ thuật |
| **Tablet công trường** | người thi công | cắt lớp · tương tác · **chạy offline** |

**Cùng một `.idf`, năm đích, không đích nào sửa nguồn.** Đổi bản vẽ → cả năm đích tự đúng theo.

---

## 5 · "Soi kỹ chữ nghĩa rồi Ctrl+P" — cái này có tên nghề, và IF đã có nửa cỗ máy

Việc Hoà mô tả gọi là **preflight** — ngành in dùng từ này, và nó là quy trình bắt buộc trước khi
xuất bản.

Tin tốt: **IF đã có đúng cỗ máy đó ở chặng 1** — `Violation` với `ruleId · severity · category ·
message`, và cây đã có mã sẵn (`2.2.82`, `2.2.83`, `2.3.63`, `7.1.18` nâng lên dùng chung 3 chặng).
Nghĩa là hướng này **đã được nhìn thấy từ trước**, chỉ chưa mở.

**Phần tôi đề xuất thêm — và đây là chỗ mới: preflight phải THEO ĐÍCH.**

| Đích | Lỗi cần bắt |
|---|---|
| PDF in | chữ tràn khung · font chưa nhúng · ảnh < 300dpi · tỉ lệ ghi sai · thiếu khung tên |
| PPTX | chữ < 18pt · tương phản kém khi chiếu phòng sáng · quá nhiều chữ một slide |
| XLSX | công thức gãy · ô bắt buộc còn trống · tên nhà cung cấp không khớp danh mục |
| Phim | chi tiết kỹ thuật lọt vào · chữ nhỏ không đọc được trên điện thoại |
| Công trường | **cấu kiện chưa duyệt mà đã lên mô hình thi công** |

**Một cỗ máy, nhiều bộ luật theo đích.** Đúng cách `lib/cad/standards/` đã dựng — chỉ đổi bộ luật.

---

## 6 · Và đây là chỗ nối sang IF2 — cùng một kiến trúc

Hoà nói *"điều đó tương tự với IF2"*. **Đúng, và mạnh hơn Hoà nghĩ: tablet công trường không phải
một sản phẩm mới — nó là MỘT ĐÍCH TRÌNH DIỄN NỮA.**

```
                        ┌─ PDF in
                        ├─ PPTX
   .idf  ──►  chặng 3 ──┼─ XLSX
   (sự thật)  (chiếu)   ├─ Phim
                        └─ TABLET CÔNG TRƯỜNG  ← IF2 nằm ở đây
```

Nghĩa là **IF2 không phá kiến trúc IF1, nó thêm một đích.** Điều đó làm chi phí IF2 giảm mạnh, và là
lập luận nên nói với ban giám đốc.

---

## 7 · Bảy ý cho IF2 — đóng góp thêm

### ① Cắt lớp là một đích, không phải tính năng lẻ
Như §6. Thống nhất IF1 và IF2 dưới cùng kiến trúc, không đẻ nhánh mới.

### ② ⭐ Thời gian là chiều thứ tư của mô hình
Mỗi cấu kiện mang `kế hoạch bắt đầu/kết thúc` + `thực tế bắt đầu/kết thúc`. **Vuốt trục thời gian =
xem công trường tuần trước, tuần sau, hoặc lệch kế hoạch ở đâu.**

Đây là chỗ biến "theo dõi tiến độ" từ **bảng Gantt** thành **nhìn thấy trên chính mô hình** — và đó
là thứ Lark **không thể** làm, tức là lý do tồn tại của IF2. Dữ liệu đã có nhà sẵn: `PROJECT_STATUS`
trên ATLAS.

### ③ Va chạm có BA loại, không phải một
| Loại | Nghĩa | Ai làm được |
|---|---|---|
| **Cứng** | hai khối chồng nhau | mọi phần mềm BIM |
| **Mềm** (khoảng thao tác) | cửa tủ mở đụng tường · lối đi < 600mm · không đủ chỗ rút ngăn kéo | ít phần mềm làm |
| ⭐ **Quy trình** | **thi công cái này trước thì không lắp được cái kia** | **gần như không ai làm** |

Loại thứ ba là **chỗ đau nhất ngoài công trường** và IF2 làm được vì đã có thời gian (②) + trạng thái.
Đây có thể là điểm khác biệt lớn nhất của IF2.

### ④ Ảnh hiện trường gắn vào CẤU KIỆN, không gắn vào dự án
ArchiNote chụp → ảnh gắn đúng cái tường đó, cái tủ đó. Mở lên thấy ngay **thiết kế thế này, thực tế
thế kia**. Đó là **nghiệm thu có bằng chứng**, và nền đã có: `.ifpack` đang gói ảnh markup hiện trường.

### ⑤ Ngược dòng: công trường → thiết kế
Ngoài công trường thấy sai → **ghim ngay trên mô hình** → tự thành việc trong hàng đợi + báo đúng
người thiết kế cấu kiện đó. Đóng vòng phản hồi. Nền đã có: ghim góp ý (`7.4.1`) + hàng đợi "Việc"
(`2.2.86` vừa xong).

### ⑥ ⭐ IFC quan trọng ở chiều NHẬN hơn chiều XUẤT
Ai cũng nghĩ IFC để **xuất ra** cho người khác. Nhưng việc hằng ngày của TTT là **nhận file** từ tư
vấn kết cấu và cơ điện. Nhận IFC vào IF2 → chồng lớp lên thiết kế nội thất → **phát hiện va chạm với
hệ khác trước khi ra công trường.**

Về giá trị hằng ngày, **nhận > xuất**. Nên làm nhận trước.

### ⑦ Bộ nhớ đo đạc lên tầm: thư viện cấu kiện của TTT
Việc "học từ số liệu TTT sửa" (đã lên kế hoạch) sau vài chục dự án sẽ đủ để dựng **thư viện cấu kiện
có tham số** — tủ bếp TTT, vách TTT, trần TTT: đặt vào là ra đúng cách xưởng thật sự làm, đúng vật
liệu trong ATLAS, đúng giá.

Đó là lúc **tri thức nghề của TTT trở thành tài sản chạy được**, không còn nằm trong đầu người.

---

## 8 · Thứ tự nên làm

| # | Việc | Vì sao trước |
|---|---|---|
| **1** | **Lớp mô tả nội dung** (§3, 5 trường, đặc biệt **độ chín**) | Không có nó thì mọi đích đều phải chép tay. Đây là nút thắt |
| **2** | **Preflight theo đích** (§5) | Cỗ máy đã có, chỉ thêm bộ luật. Rẻ, giá trị cao ngay |
| **3** | 2–3 đích đầu: **PDF in · XLSX · PPTX** | Đúng việc hằng ngày, không cần IF2 |
| **4** | Nhận IFC (§7⑥) | Vào cửa IF2 bằng đường rẻ nhất và dùng được ngay |
| **5** | Thời gian + va chạm (§7②③) | Lõi giá trị IF2 |
| **6** | Đích tablet công trường | Sau khi 4 và 5 xong thì đây gần như miễn phí |

---

## 9 · Một câu

> **CAD và Render sản xuất SỰ THẬT. Chặng 3 chiếu sự thật đó vào từng khuôn đích. IF2 chỉ là thêm
> một khuôn đích nữa — khuôn công trường.**

Nhìn như vậy thì ba chặng vừa đứng riêng được, vừa cộng lại thành dây chuyền — đúng điều Hoà hỏi —
và IF2 không còn là một sản phẩm thứ hai phải xây từ đầu.

---

*Cowork, 30/07/2026. Dựa trên: `lib/cad/standards/checker.ts` (`Violation`), `lib/present-editor/templates.ts`
(`TemplateContext` đã có slot đặt tên), `.ifpack` (gói ảnh hiện trường), `PROJECT_STATUS` (`1.4.2`),
ghim góp ý (`7.4.1`), hàng đợi Việc (`2.2.86`), và các mã preflight đã có trong cây
(`2.2.82` · `2.2.83` · `2.3.63` · `7.1.18`).*
