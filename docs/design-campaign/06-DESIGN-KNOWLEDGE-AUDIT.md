# 06 · KIỂM KÊ TRI THỨC THIẾT KẾ — trước khi dựng IF Design School
Ngày 23/08. Đo tại nguồn, không chép từ trí nhớ.

## Kết luận một câu

> **IF KHÔNG THIẾU TRI THỨC. IF THIẾU ĐƯỜNG DẪN TỚI TRI THỨC ĐÚNG LÚC.**

Đo được: **32 tệp nghiên cứu** trong `docs/nc/` · **12 văn bản luật thị giác** ở `docs/` ·
**~106 bản vẽ** trong `docs/mocks/` · **1 skill** 237 dòng. Tổng tri thức thừa sức trả lời mọi
lỗi Hoà chê hôm nay. Vậy mà cả 10 lỗi trên màn Trang chủ vẫn xảy ra — **bốn trong số đó vi phạm
luật đã ghi thành văn**.

⇒ Vấn đề không phải *viết thêm luật*. Là **định tuyến**: agent không biết cần đọc gì, lúc nào,
cho màn nào. Design School vì thế phải là **BỘ ĐỊNH TUYẾN + BẢN CHƯNG CẤT + VÍ DỤ**,
KHÔNG phải bộ bách khoa thứ hai. Viết lại 32 tệp nghiên cứu là đúng tội N8.

## ĐÃ CÓ — tri thức bền

| Mảng | Nguồn đã có | Trạng thái |
|---|---|---|
| Luật nền thị giác | `IF-MOTION-VISUAL-LAW.md` · `SPEC-DESIGN-SYSTEM-IF.md` · `CHOT-EXPERIENCE-SYSTEM-2026-08-20.md` | ✅ đã ban hành, Hoà duyệt mắt 20/08 |
| Nguyên tắc giao diện | `nc/NC-NGUYEN-TAC-GIAO-DIEN-TOAN-APP-2026-08-14.md` (NT-1..18) | ✅ hiến pháp giao diện |
| Triết lý giao diện | `nc/NC-TRIET-LY-GIAO-DIEN-2026-08-14.md` (P1-P7, KB-1..4) | ✅ có nguồn URL |
| Chữ Việt | `LUAT-CHU-VIET-7.1.23-2026-07-31.md` | ✅ **bị phạm hôm nay** |
| Vật liệu kính | `docs/mocks/LUAT-VAT-LIEU-KINH-G0-G3.md` | ✅ + cấu tạo 3 tầng 23/08 |
| Apple | `SPEC-APPLE-MOTION-MATERIAL.md` · `SPEC-HOVER-FOCUS-IDF.md` | ✅ có nguồn WWDC |
| Home | `nc/NC-HOME-CAM-NHAN` · `nc/NC-HOME-DELIGHT` · `dna/HOME-SPEC-2026-08-23.md` | ✅ |
| Mật độ · con trỏ | `SPEC-MAT-DO-CON-TRO.md` | ✅ 5 token đã nằm `globals.css:105` |
| Panel · thò thụt | `SPEC-PANEL-ROLLOUT-IDF.md` | ✅ khảo 3dsMax/Blender/Rhino/SketchUp |
| Thất bại | `02-FAILURE-LEDGER.md` (F-01…F-14) | ✅ đang sống |
| Chuẩn đầu ra | `CHUAN-DAU-RA-NGHE.md` | ✅ là LUẬT |

## ĐÃ CÓ — máy canh

`soi:foundation` (icon · nhịp · vật liệu) · `soi:hinh-hoc` · `soi:tu-dien` · `soi:thao-tac` ·
`soi:frontier` · `soi:contract` · `lib/wallpaper/contrast.test.ts` (drift-guard).

## THIẾU — và đây là chỗ Design School phải lấp

| Thiếu | Bằng chứng nó thiếu |
|---|---|
| 🔴 **BỘ ĐỊNH TUYẾN** — task nào đọc tệp nào | `SKILL.md` là bách khoa 237 dòng, không chỉ đường; 32 tệp `nc/` không ai biết khi nào cần |
| 🔴 **VÍ DỤ TỐT/XẤU CÓ CHÚ GIẢI** | 0 tệp. Luật *"cấm lưới thẻ đều"* có từ 20/08 mà 23/08 vẫn ra tường thẻ ⇒ **chữ không đủ, phải có hình đối chiếu** |
| 🔴 **NGƯỜI CHẤM ĐỘC LẬP** | người vẽ đang tự chấm. Không skill review nào tồn tại |
| 🔴 **"VIỆC CỦA CON NGƯỜI" thành cổng bắt buộc** | không đâu hỏi *"vật này phục vụ việc gì"* ⇒ đẻ ra widget lấp chỗ |
| 🔴 **HỢP ĐỒNG THIẾT KẾ thành khuôn dùng được** | có ý niệm ở `SKILL.md §3`, chưa có khuôn điền |
| 🟡 Token nền (thang chữ · kích thước · elevation) | `SKILL.md §6` tự khai **OWED BY CLAUDE DESIGN** — vẫn nợ |
| 🟡 Gia phả bản vẽ → mã | không truy được mã nào sinh từ bản vẽ nào |

## Vì sao luật đã có mà vẫn phạm — bốn ca hôm nay

| Lỗi | Luật đã có từ | Vì sao vẫn lọt |
|---|---|---|
| Tường thẻ trắng | 20/08 + 22/08 | luật nằm trong **chú thích một tệp `.ts`**, không ai đọc lúc dựng |
| 6 nhãn HOA | 31/07 | không máy nào canh; không ví dụ xấu để đối chiếu |
| Heatmap phù phiếm | 02/08 | chôn trong một tệp nghiên cứu đối thủ |
| Widget lấp chỗ | — | **chưa từng có luật** ⇒ đây là tri thức MỚI thật sự |

⇒ Ba trên bốn là **lỗi định tuyến**, không phải lỗi thiếu luật.


---

## 🔴 ĐÍNH CHÍNH CÙNG NGÀY — kết luận trên ĐÚNG MỘT NỬA, và nửa sai là nửa quan trọng hơn

Audit viết: ca *tường thẻ* lọt vì luật *"nằm trong chú thích một tệp `.ts`, không ai đọc"*, rồi
kết luận **ba trên bốn là lỗi định tuyến**. Trường C đi đo tại nguồn và bác lại. Tôi kiểm, nó đúng.

`components/home/BeMatHome.tsx:11-17` — docstring của **chính tệp dựng bố cục Home** — viết sẵn:

> *"Chữ bento dễ bị đọc thành lưới thẻ đều nhau, mà đó đúng là thứ đã bị đánh trượt HAI LẦN:
> 20/08 … cấm lưới thẻ đều · 22/08 … thẻ khổng lồ, tường widget. ⇒ Lưới ở đây là lưới Ô,
> không phải lưới THẺ."*

⇒ **KHÔNG PHẢI "không ai đọc".** Người dựng đã đọc, **chép lại đúng luật, gọi tên đúng cả hai
lần trượt trước, phát biểu đúng cách hiểu đúng** — rồi vẫn giao ra một tường thẻ trắng.

### Chẩn đoán đúng, mạnh hơn hẳn bản đầu

> **BIẾT LUẬT BẰNG CHỮ KHÔNG PHẢI LÀ NHẬN RA VI PHẠM BẰNG MẮT.**

Một luật phát biểu bằng văn xuôi **không cho người ta cách đối chiếu sản phẩm của chính mình với
nó**. Người dựng đọc *"không được là lưới thẻ đều"*, tin rằng mình không làm thế (vì các ô có số ô
khác nhau **trên giấy**), và không có cách nào phát hiện rằng **trên màn** chúng vẫn ra cùng chất
liệu, cùng vỏ trắng, cùng trọng lượng thị giác.

### Hệ quả — đổi thứ tự ưu tiên của cả Trường

| | Bản đầu | Sau đính chính |
|---|---|---|
| Bệnh chính | định tuyến | **thiếu ĐỐI CHIẾU BẰNG HÌNH** |
| Chữa bằng | bộ định tuyến | định tuyến **+ kho ví dụ có chú giải + người chấm độc lập** |
| `examples/` | "một phần của trường" | ⭐ **phần sinh lời cao nhất** |

Định tuyến vẫn cần — nó chữa ba ca kia (nhãn HOA · heatmap · widget lấp chỗ). Nhưng ca **đắt nhất**
thì định tuyến **không chữa nổi**, vì tri thức đã nằm đúng trước mắt người dựng rồi.

📌 Bài học cho mọi luật thiết kế về sau: **luật nào không kèm được một cặp ảnh TỐT/XẤU thì luật đó
chưa dùng được** — nó mới là một câu, chưa phải một công cụ.
