# CHỐT — TÁCH AI RA KHỎI CHỈNH TAY

> **Hoà chốt 31/07/2026**, nguyên văn: *"chúng ta thống nhất tách AI và chỉnh sửa thuần sao cho
> dễ nhận biết rồi mà đúng hk?"* — nhắc lại 01/08 vì Cowork trình bày lại nó như phát hiện mới.
> Bổ sung mục 2 · 4 · 5 ngày 01/08 sau khi khảo sát Canva Magic Studio · Gamma · Beautiful.ai.
>
> ⚠️ **Vì sao phải có file này:** quyết định trên chỉ tồn tại trong lịch sử chat. Chat bị nén thì
> nó biến mất, và mỗi phiên sau lại "khám phá" lại từ đầu. Đây là lỗi hệ thống, không phải lỗi trí
> nhớ. **Mọi quyết định thiết kế phải nằm trong `docs/`, không nằm trong chat.**
>
> Đọc kèm: `SPEC-VITALS-ROLE.md` · `SPEC-VITALS-AI.md` · `SPEC-VITALS-VISUAL.md` · Luật `2.1.10`

---

## 1 · Luật gốc

> **Người dùng phải biết mình đang bấm cái gì TRƯỚC KHI bấm.**
> AI và chỉnh tay khác nhau về bản chất — một cái **đoán**, một cái **chắc chắn**.
> Trộn hai thứ vào cùng một chỗ là lừa người dùng.

| | Chỉnh tay | AI |
|---|---|---|
| Kết quả | **tất định** — bấm 10 lần ra 10 lần giống nhau | **xác suất** — mỗi lần một khác |
| Chi phí | 0đ, tức thì | tốn credit hoặc thời gian máy |
| Hoàn tác | ⌘Z là xong | phải sinh lại, không chắc ra như cũ |

Ba khác biệt đó đủ để bắt buộc tách. Không phải chuyện thẩm mỹ.

---

## 2 · Tách bằng DẤU, không bắt buộc tách bằng VỊ TRÍ

*(sửa 01/08 — bản đầu viết "tách bằng vạch ngăn", quá cứng)*

Khảo sát cho thấy tách sạch và dễ tìm **kéo ngược nhau**: Canva rải AI khắp nơi nên ai cũng vấp
phải; tách kỹ mà giấu thì không ai thấy — Vitals từng có **4 cửa** mà vẫn khó tìm.

**IF không phải chọn.** Vì đã có luật `2.1.10`, nút AI được phép ngồi **ngay cạnh** nút tay —
miễn thoả đủ ba điều:

| | Điều kiện |
|---|---|
| **có dấu** | glyph Vitals + accent `#6a57f5` |
| **có giá** | tốn credit thì **hiện số TRƯỚC khi bấm**, không hiện sau |
| **truy vết được** | nói rõ nó chạy lệnh tay nào — *"chạy `HATCH`, bạn tự làm được"* |

> **Ranh giới: dấu hiệu + truy vết. KHÔNG phải khoảng cách.**

### 2a · Tên gọi — CHỐT (Hoà quyết 01/08)

> **Chữ "Mẫu" cho phễu AI → đổi thành "Magic".**
> **Dùng CẢ chữ LẪN dấu — không phải chọn một.**

**Vì sao lấy "Magic" chứ không nghĩ từ mới:** nó đã là **từ vựng ngành**. Ai từng dùng Canva đều
biết Magic = nút AI. Đặt tên lạ là bắt người dùng học lại từ đầu — và làm **điểm yếu ② (khó tìm)**
tệ hơn. Mượn từ vựng có sẵn là cách rẻ nhất để dễ tìm.

**Hai lớp, một họ:**

| | Là gì | Ví dụ |
|---|---|---|
| **Magic** | tên **nhóm hành động** AI | `Magic dàn trang` · `Magic tô màu` · `Magic đo` |
| **Vitals** | **trợ lý hội thoại** + dấu hiệu thị giác dùng chung | panel ⌘J, glyph, accent `#6a57f5` |

Cùng accent, cùng glyph ⇒ đọc ra là **một họ**, không phải hai thương hiệu. (Canva cũng có cả
"Magic Studio" lẫn trợ lý riêng — mô hình này có tiền lệ.)

**⛔ Chỉ cấm đúng một từ: "tự động".** Nó **ĐỤNG HÀNG** — `StagePresetPanel` đã có "dàn lại
(reflow)" với comment ghi rõ **"KHÔNG AI"**. Dùng "tự động" cho AI là phá một khái niệm đang đúng.

### 2b · Magic HỖ TRỢ kiến trúc sư — không thay thế, không dán nhãn lên sản phẩm

**Không cấm sản phẩm tạo từ AI.** Deck do Magic dàn ra là **bản giao khách hợp lệ**, y như bản làm
tay. IF không phán xét kết quả.

> **Dấu hiệu nằm trên NÚT BẤM, không nằm trên KẾT QUẢ.**

| | |
|---|---|
| ✅ Nút có dấu Magic, có giá, nói được nó chạy lệnh tay nào | người dùng **biết trước** mình bấm gì |
| ❌ Đóng dấu "AI-generated" lên slide/PDF giao khách | không ai làm vậy, và nó hạ giá công việc của người dùng |

Vai của Magic: **rút ngắn quãng buồn tẻ**, để kiến trúc sư dành đầu óc cho việc chỉ họ làm được.
Luật `2.1.10` bảo đảm điều đó không thành phụ thuộc — mọi việc Magic làm, làm tay cũng ra.

---

## 3 · Áp vào chặng Presenting

### 3a · Ba trục, ba tên, không giao nhau

Mọi công cụ trình bày nghiêm túc đều tách **da** khỏi **xương** (Canva: Brand Kit ↔ Brand Template ·
PowerPoint: Theme ↔ Slide Master · Figma: Styles ↔ Components). IF cần **ba** trục vì kiến trúc sư
in A3:

```
KHỔ        →  16:9 · A4 · A3            →  trang to bao nhiêu
BỐ CỤC     →  Bìa · Bìa phụ · Nội dung   →  đồ nằm ở đâu trên trang
NHẬN DIỆN  →  logo · màu · font          →  trang trông thế nào
```

Đổi một trục **không được** phá hai trục kia. Một xương mặc được nhiều da, một da mặc nhiều xương.

### 3b · Hiện trạng sai (đo 01/08)

Chữ **"Mẫu"** đang là tên của **ba thứ khác nhau**:

| Thành phần | Dòng | Thật sự là gì |
|---|---|---|
| `BrandKitPanel` — "Nhận diện" | 571 | ✅ đúng phạm vi — logo · 6 màu · cặp font · watermark |
| `TemplatePicker` — "Mẫu" | 267 | xương — chọn template, áp = dựng slide mới |
| `LayoutShelf` | 825 | xương — bố cục 3 hàng, sinh biến thể |
| `StagePresetPanel` — "Khổ" | 132 | ✅ đúng — khổ + dàn lại (KHÔNG AI) |
| Tab **"Mẫu"** panel trái | — | ❌ **không phải mẫu** — là phễu nhập cho AI |

Nút "Mẫu" trên thanh công cụ chỉ để bật/tắt panel trái (`PresentEditor.tsx:1594`), tab đầu của panel
cũng tên "Mẫu", nội dung bên trong lại là phiếu nhập cho máy dàn. **Ba tầng nghĩa một chữ.**

### 3c · Phải sửa thành

**Phễu AI KHÔNG được gọi là "Mẫu".** Nó không phải một trục — nó là **một lối đi**:

| Lối | Tên | Bản chất |
|---|---|---|
| 🟣 | **Magic** | đưa ảnh + text → máy dàn ra deck |
| ⚪ | **Bố cục** | chọn khổ → chọn bố cục → tự đặt |

**Gộp `TemplatePicker` + `LayoutShelf` thành một thứ tên "Bố cục"** — 1.092 dòng đang làm cùng một
việc, cùng dựng thumbnail bằng `renderEditorSlide`, cùng "bấm là áp, human-in-the-loop".

---

## 4 · Bốn luật CHỖ NGỒI — tách mà vẫn tìm ra được

*(mới 01/08)*

**① Chỗ ngồi cố định.** Trong mỗi panel làm tay, hành động Vitals nằm **đúng một chỗ, luôn là chỗ
đó** — cuối panel, sau một vạch ngăn. Học một lần, dùng cả app.

**② Một panel, một nút tím.** Ngữ cảnh có 3 việc AI ⇒ **2 cái phải vào panel Vitals**. Không xếp
hàng nút tím — hàng nút tím là lúc người dùng ngừng đọc.

**③ Màn trống là đất vàng.** Slide trắng → *"Magic dàn trang"*. Đó là lúc duy nhất người ta thật sự
muốn máy giúp.
⚠️ **Tờ CAD trắng thì KHÔNG.** Vẽ phải là tay trước — đó là lõi nghề, không nhường.

**④ Phân vai hai lối:**

| | Dùng khi |
|---|---|
| Nút tím nội tuyến | **đã biết** cần gì → bấm phát ăn ngay |
| Panel Vitals (⌘J) | **chưa biết** cần gì → hỏi |

---

## 5 · Ngưỡng chất lượng cho ĐƯỜNG TAY

*(mới 01/08)*

Gamma được khen *"clean, polished right out of the gate"*. Đó **không phải bài toán AI** — Gamma đẹp
vì có người thiết kế template tử tế.

**① Ít mà tinh.** Gamma ship ~chục theme. IF nên có **12 bố cục làm thật kỹ**, không phải 60 cái tàm
tạm. Hiện 1.092 dòng lo việc **chọn**, nhưng thứ quyết định đẹp/xấu là **cái được chọn**.

**② Học từ việc thật — nhưng KHÔNG ship việc thật.** ⚠️ **LUẬT TRUNG TÍNH** (`AUDIT-BRAND-PII.md`,
`CONTENT-RULES.md` §4): IF là **sản phẩm bán ra**, không phải công cụ nội bộ. Tách bạch hai việc:

| | Được | Không được |
|---|---|---|
| Board dự án thật, nhận diện studio | **học** — soi để rút ra tỉ lệ, thang chữ, cách đặt ảnh | **ship** — không vào `lib/`, `public/`, không thành bố cục mặc định |
| Nội dung mẫu | hư cấu 100% (`Lumen Villa`…), ảnh `/demo/*` | tên khách thật, ảnh render khách |

Cái đi vào thư viện phải là **bố cục trung tính đã trừu tượng hoá** — giữ tỉ lệ và nhịp, bỏ hết tên
và ảnh. `knowledge/ttt-brand/` và `knowledge/project-references/` **không thuộc repo sản phẩm**
(`CLAUDE.md` đã ghi; audit đang xếp lịch xoá).

**③ Đánh vào chỗ họ trống.** Canva/Gamma **không có** bố cục: mặt bằng kèm chú thích · bảng vật liệu
· so sánh hai phương án · tiến độ thi công · bảng chốt màu. Đây là sân nhà.
**12 bố cục đặc thù kiến trúc > 100 bố cục chung chung.**
Loại bố cục thì trung tính sẵn — cái cần giữ sạch là **nội dung mẫu bên trong** (xem ②).

**④ Ngưỡng đo được, không cảm tính.** `DECK_STANDARDS` (lưới + margin) đã có trong code — dựng thành
**checklist bắt buộc**: lưới · margin · thang chữ · tỉ lệ ảnh · tương phản.
**Không qua ⇒ không được vào thư viện.**

---

## 6 · Áp vào các chặng khác

| Chặng | Lối AI | Lối tay | Ghi chú |
|---|---|---|---|
| **CAD** | Vitals (⌘J) | thanh lệnh, phím tắt | mỗi đề xuất **phải nói rõ nó chạy lệnh tay nào** |
| **Render** | node AI, **hiện credit trước** | import Vray/D5 sẵn có | chế độ "Không AI" đã có — giữ, đây là thứ bán được |
| **Present** | Tạo nhanh | Tự dàn | xem §3 |

---

## 7 · Phép thử một câu

> **Nhìn vào nút, chưa bấm — có biết nó tốn tiền và ra kết quả khác nhau mỗi lần không?**

Không biết ⇒ chưa tách xong.

---

## 8 · IF hơn / thua ngành (khảo sát 01/08)

**Hơn:** ① luật `2.1.10` — một năng lực, hai lối vào, cùng một hàm (Canva Magic Write **không có**
bản làm tay tương đương) · ② hiện giá **theo từng thao tác**, ngành chỉ cho xem số dư · ③ có chế độ
**"Không AI"** thật — Canva/Gamma không có, đây là thứ bán được cho hồ sơ bảo mật · ④ có **lõi tất
định** — bỏ AI đi Gamma là hết ứng dụng, IF vẫn còn CAD.

**Thua:** ① kỷ luật đặt tên — "Magic" là một chữ nhất quán, "Mẫu" đang ba nghĩa (→ §2a, §3) ·
② dễ tìm — tách kỹ dễ mất hút (→ §4) · ③ đường tay chưa đủ đẹp (→ §5).

---

*Cowork ghi 01/08/2026 từ quyết định của Hoà 31/07, bổ sung sau khảo sát Canva · Gamma ·
Beautiful.ai. Không sửa ý, chỉ ghi lại và áp vào hiện trạng đo được.*
