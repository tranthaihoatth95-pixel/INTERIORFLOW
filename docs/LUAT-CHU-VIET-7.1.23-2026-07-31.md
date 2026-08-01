# 7.1.23 · LUẬT CHỮ VIỆT TRÊN UI — bản đủ 5 mục

> Claude Code đã cấp mã `7.1.23` (commit `e01ce96`) và ghi rõ: **③④⑤ CHƯA NHẬN ĐỦ** — tin nhắn
> gốc bị cắt giữa mục ②. Tài liệu này **bù đủ 5 mục**, có nguồn chuẩn, để đợt code chạy một lần.
>
> Đây là **kiến trúc nền**, áp cho MỌI chặng. `2.2.85` (bỏ font mono ở nhãn node) chỉ là **một
> triệu chứng** của lớp lỗi này.

---

## 0 · Vì sao đây là lỗi NGHĨA, không phải lỗi thẩm mỹ

Tiếng Việt là chữ Latinh **hai tầng dấu**: dấu phụ tạo chữ cái (ă â ê ô ơ ư đ) + dấu thanh chồng
lên trên (sắc huyền hỏi ngã nặng). Dấu thanh **mang nghĩa** — `ma · má · mà · mả · mã · mạ` là sáu
từ khác nhau.

⇒ Mọi thao tác **ép chiều cao, ép bề ngang, hoặc cắt phần trên** của chữ đều có thể **xoá nghĩa**,
không chỉ làm xấu. Đây là lý do luật này phải **cưỡng chế bằng test**, không phải "lưu ý khi review".

Nguồn: `vietnamesetypography.com` (Donny Trương) · Google Fonts *Diacritics guide* ·
W3C WCAG **1.4.12 Text Spacing**.

---

## 1 · Năm mục quét

### ① `text-transform: uppercase` / class `uppercase` — CẤM trên chuỗi CÓ DẤU

| | |
|---|---|
| **Vì sao** | Chữ hoa cao hơn chữ thường ⇒ **hết chỗ đặt dấu thanh** phía trên. Font tự hạ/đè dấu ⇒ Ế·Ề·Ễ dính nhau, hoặc dấu bị cắt cụt |
| **CHO PHÉP** | Chuỗi kỹ thuật **không dấu**: `PDF` `DXF` `A3` `CAD` `BIM` `IFC` `XLSX` `mm` `m²` |
| **Đã biết 1 chỗ** | `StatusBadge` trong `components/notebook/NotebookSourcesSidebar.tsx` — "Đang xử lý"/"Sẵn sàng"/"Lỗi" |
| **Thay bằng** | Bỏ `uppercase`; muốn nhấn thì dùng **đậm hơn 1 nấc** hoặc **màu nền nhạt**, không dùng chữ hoa |

### ② `line-height < 1.5` trên chữ Việt — CẤM

| | |
|---|---|
| **Vì sao** | Dòng dưới đội lên chạm dấu thanh dòng trên. WCAG 1.4.12 lấy **1.5** làm ngưỡng |
| **Vi phạm** | `leading-none` (1) · `leading-tight` (1.25) · `leading-snug` (1.375) |
| **Tối thiểu** | `leading-normal` (1.5). Chữ nhỏ (≤13px) nên **1.6** |
| **CHO PHÉP** | Chuỗi 1 dòng **không dấu** trong ô số liệu CAD (`1250 mm`), nhãn trục, mã tờ |

### ③ Giãn chữ ÂM (`letter-spacing` < 0) — CẤM trên chữ Việt

| | |
|---|---|
| **Vì sao** | Dấu chồng làm **hộp bao quang học** của glyph rộng hơn phần thân. Kéo âm ⇒ dấu chữ này đè thân chữ kia (`ườ`, `ẫu`, `ợi` hỏng trước tiên) |
| **Vi phạm** | `tracking-tight` (-0.025em) · `tracking-tighter` (-0.05em) · mọi `letter-spacing: -…` |
| **Đúng** | `tracking-normal` (0) là **sàn**. Tiêu đề lớn có thể `tracking-wide` |
| **CHO PHÉP** | Chuỗi số/mã **không dấu** cần nén để vừa cột hẹp |
| **Ghi chú** | Đây là bạn đồng hành của ②: ② lo chiều dọc, ③ lo chiều ngang. Sửa một mà bỏ mục kia thì vẫn hỏng |

### ④ Font KHÔNG phủ đủ tiếng Việt — CẤM đặt lên chuỗi có dấu

| | |
|---|---|
| **Vì sao** | (a) **Mono** ép mọi glyph vào **một bề rộng** ⇒ `ư`/`ơ` (đã có râu) và dấu thanh bị nén phẳng. Đây **chính là gốc `2.2.85`**. (b) Font thiếu khối Unicode **Latin Extended Additional U+1EA0–U+1EF9** ⇒ trình duyệt nhảy font giữa câu, chữ có dấu **khác nét** chữ không dấu |
| **Luật** | Chuỗi có dấu **chỉ** dùng **Be Vietnam Pro** (font sản phẩm, do người Việt thiết kế, phủ đủ) |
| **CHO PHÉP** | `font-mono` cho: toạ độ, mã lệnh, đường dẫn tệp, mã màu, JSON/log — tức chuỗi **không dấu** |
| **Kiểm** | Chuỗi thử bắt buộc: `Chữ Việt: ườ ẫu ợi Ế Ề Ễ Ổ Ự Ỳ` — render một font, không nhảy nét |

### ⑤ Ô chữ CẮT PHẦN TRÊN + chữ QUÁ NHỎ — CẤM

| | |
|---|---|
| **Vì sao** | Dấu thanh nằm **trên đường ascender**. Ô có chiều cao cứng + `overflow-hidden` ⇒ **cắt đúng dấu**, chữ vẫn đọc được nên **không ai phát hiện** — lỗi im lặng đúng nghĩa |
| **Vi phạm** | `h-*` cố định + `overflow-hidden` bọc 1 dòng chữ có dấu · `leading-none` trong badge/chip · `line-clamp-*` kèm `leading` chật |
| **Đúng** | Ô chữ **cao theo nội dung** (`py-*`, không `h-*`). Bắt buộc `h-*` thì `h ≥ font-size × 1.5 + padding` |
| **Cỡ chữ sàn** | Chữ có dấu **≥ 12px**; khuyến nghị **13px**. Dưới 12px dấu hỏi/ngã không phân biệt được trên màn hình thường |
| **Liên quan** | Ăn thẳng vào rà soát Settings (body 12.5px — **sát sàn, không được nhỏ hơn**) |

---

## 2 · Cách làm — BÁO TRƯỚC KHI SỬA

**Bước 1 · Phân loại, chưa sửa gì.**
Quét 5 mẫu trên toàn `components/` + `app/`, xuất **bảng phân loại**:

| Cột | Nội dung |
|---|---|
| Tệp : dòng | vị trí |
| Mục vi phạm | ①②③④⑤ |
| Chuỗi bị ảnh hưởng | trích nguyên văn |
| CÓ DẤU / kỹ thuật không dấu | phán quyết |
| Đề xuất | sửa / miễn trừ |

Sơ bộ đã biết: **46 tệp** có class `uppercase` — **phần lớn nhiều khả năng là chuỗi kỹ thuật không
dấu**, tức số sửa thật sẽ nhỏ hơn 46 nhiều. **Báo bảng này trước, chờ gật, rồi mới sửa.**

**Bước 2 · Sửa theo bảng đã gật.**

**Bước 3 · Test cưỡng chế** — theo đúng khuôn mà phiên phụ đã dựng cho **Luật Trung Tính**:

- Một **regex dấu tiếng Việt dùng chung** (Latin-1 Supplement + Latin Extended-A/-B + **U+1EA0–U+1EF9**), export một chỗ, mọi test import lại — không chép 2 bản
- Danh sách **EXEMPTIONS** khai báo tường minh, **mỗi dòng kèm lý do** (vd: `CadCanvas.tsx: 'X … Y … mm' — chuỗi số không dấu`)
- **Meta-test**: mọi mục trong EXEMPTIONS phải **còn tồn tại** trong mã. Xoá code mà quên xoá miễn trừ ⇒ test đỏ. (Không có meta-test thì EXEMPTIONS mục ruỗng thành cửa hậu.)

---

## 3 · Ranh giới — chống làm quá

| KHÔNG động vào | Lý do |
|---|---|
| Chuỗi trong `lib/cad/*` xuất ra **DXF/PDF** | Ràng buộc định dạng tệp, không phải UI |
| Tên khối, mã lớp (layer), tên trường CSDL | Là **định danh**, không phải chữ người đọc |
| `uppercase` trên chuỗi 100% không dấu | Hợp lệ, giữ nguyên |
| Chữ trong ảnh/asset tĩnh | Ngoài phạm vi đợt này |

**Phép thử một câu:** *chuỗi này người Việt ĐỌC, hay máy KHỚP?* — Người đọc ⇒ áp luật. Máy khớp ⇒ miễn trừ.

---

## 4 · Nối với việc khác

| Việc | Quan hệ |
|---|---|
| `2.2.85` | Triệu chứng ④. Đóng luôn khi 7.1.23 xong |
| Rà soát **Settings** (body 12.5px) | Sàn cỡ chữ ở ⑤ là ràng buộc đầu vào |
| **Thư viện D** — thẻ tài sản | Tên tài sản tiếng Việt trong ô nhỏ ⇒ dễ dính ⑤ |
| **Chặng 3 · preflight theo đích** | Bản in/chiếu có sàn cỡ chữ riêng — luật này là tầng dưới |

---

*Cowork, 31/07/2026. Bù mục ③④⑤ cho mã `7.1.23` do Claude Code cấp ở `e01ce96`.*
