# PHIẾU GIAO — KHẢO SÁT UX/UI CHUẨN TOÀN CẦU → VIẾT PHIẾU ĐỊNH HƯỚNG

> **Người nhận:** tuyến nghiên cứu bên ChatGPT. **Bên đó nghiên cứu và định hướng, bên này thi công.**
> **Đầu ra mong đợi: MỘT PHIẾU ĐỊNH HƯỚNG.** Không cần mã, không cần mock.
> Viết cho người **không có quyền đọc repo** — mọi thứ cần biết nằm trong tệp này + bộ ảnh kèm theo.
> Hoà giao 30/08/2026.

---

## 0 · SẢN PHẨM LÀ GÌ

**InteriorFlow (IF)** — *design OS chạy tại máy* cho kiến trúc sư nội thất chuyên nghiệp.
Bốn giá trị nền: *own your data · own your workflow · own your memory · replace your AI*.

**IF KHÔNG phải:** app CAD · app render · app slide · app vật liệu · dashboard quản lý dự án ·
chatbot AI · một bó ứng dụng nhỏ.
**IF LÀ:** *hệ điều hành sáng tạo / tầng ra-quyết-định thiết kế* cho công việc nội thất — một
chuỗi nghề liền mạch, không phải nhiều app ghép lại.

Kỹ thuật: Next.js 14 + Electron, chạy offline, SQLite tại máy. **Bán ra toàn cầu, trung tính
thương hiệu** — không nhúng nhận diện studio nào. Giao diện song ngữ Việt/Anh.

---

## 1 · ĐỀ BÀI — nguyên văn Hoà, 30/08

> *"chụp màn router chính → gửi ChatGPT để nó làm khảo sát nghiên cứu **UX/UI global standard with
> Apple design system, human-centric**, để viết phiếu định hướng."*

---

## 2 · BỘ ẢNH KÈM THEO — 24 màn, chụp trên app THẬT

Ảnh chụp bằng Playwright trên bản đang chạy, **đăng nhập thật, dữ liệu thật** (không phải mock).
Tên tệp tự nói nghĩa. Nhóm theo xương sống nghề:

| Nhóm | Màn |
|---|---|
| **Cửa vào** | `00-01-man-khoa` · `00-02-intro-mo-app` |
| **Tổng quan** | `01-01-home-tong-quan-du-an` · `01-02-files-cho-dau-moi` · `01-03-bang-viec` |
| **Thư viện** | `02-01-thu-vien-tong` · `02-02-thu-vien-gallery` · `02-03-thu-vien-nhap-tep` · `02-04-vat-lieu` · `02-05-bang-mau` |
| **Chặng 1 · 2D** | `10-01-2d-toan-man` · `10-02-2d-du-an` |
| **Chặng 2 · 3D** | `20-01-3d-toan-man` · `20-02-3d-ban-lam-viec-node` |
| **Chặng 3 · Trình bày** | `30-01-trinh-chieu-toan-man` · `30-02-trinh-chieu-du-an` · `30-03-sua-anh` · `30-04-anh-du-an` |
| **Dự án** | `40-01-du-an-tong-quan` · `40-02-du-an-so-tay` |
| **Hệ thống** | `50-01-cai-dat` · `50-02-cai-dat-anh-dai-dien` · `50-03-cai-dat-gioi-thieu` · `50-04-cai-dat-giay-phep` |

### ⚠️ 24 khung nhưng chỉ **20 mặt khác nhau** — bốn cặp trùng khít TỪNG BYTE

Đo bằng md5 sau khi chụp. Đây là **hiện trạng thật của app**, không phải lỗi máy chụp — và nó là
dữ kiện cho việc khảo sát, nên nói trước:

| Cặp trùng | Nghĩa |
|---|---|
| `10-01-2d-toan-man` ↔ `10-02-2d-du-an` | route toàn cục `/cad-editor` là **vỏ chuyển hướng** sang route trong dự án |
| `20-01-3d-toan-man` ↔ `20-02-3d-ban-lam-viec-node` | cùng một mặt |
| `30-01-trinh-chieu-toan-man` ↔ `30-02-trinh-chieu-du-an` | `/present-editor` cũng là vỏ cũ |
| `30-03-sua-anh` ↔ `30-04-anh-du-an` | `/photo-editor` cũng là vỏ cũ |
| `00-01-man-khoa` ↔ `00-02-intro-mo-app` | **đáng soi** — màn mở app và màn đăng nhập ra cùng một ảnh |

Bốn vỏ cũ là **nợ điều hướng đã biết**: route toàn cục giữ lại cho đường dẫn cũ khỏi chết, nội
dung thật nằm ở route trong dự án. Cặp cuối thì chưa ai giải thích được — mời soi.

---

## 3 · ĐÃ CÓ SẴN — đừng suy lại từ đầu

Đây là chỗ dễ lãng phí nhất. Hoà đã nói thẳng về việc lặp: *"việc này làm đi làm lại hoài chán
luôn, đã từng có phiên nó chưng cất rồi"*.

### 3a · Hướng thẩm mỹ ĐÃ CHỐT từ 11/07
Chưng cất từ **4 board Pinterest của Hoà** (~1.500+ pin, cluster màu k-means → đọc 12 ảnh đại diện):

> **Giao diện app:** *liquid-glass / soft neumorphism* — nút dạng **pill/capsule bo tròn hết** ·
> **frosted blur có chiều dày** · nền xám nhạt trung tính · **đổ bóng mềm hai chiều (neumorphic)** ·
> **toolbar nổi bo tròn kiểu Figma** · typography lớn sạch · **ít màu: đen/trắng/xám + MỘT accent** ·
> khớp hướng visionOS · **KHÔNG rẽ flat/material**.

⇒ Hướng Apple **không phải đề xuất mới** — nó đã là chốt. Việc của phiếu định hướng là nói **áp
nó cho đúng thế nào**, không phải chọn lại hướng.

### 3b · Token thật đang chạy trong app
Tệp token tự khai *"theo Apple Human Interface Guidelines"*.

```
accent     #6a57f5      (tím-indigo)
nền tối    bg #0c0c0e · panel #141417 · field #202024 · border #2a2a31
nền sáng   bg #f2f2f7 · panel #f9f9fb · field #f4f4f9 · border #e2e2ea
chữ tối    t1 #f5f5f7 · t2 #d6d6db · t3 #9e9ea8 · t4 #6e6e78
trạng thái danger #e5674f · warning #d9a34a · success #46b876
thang bo   6 · 10 · 14 · 20 · 999px
cỡ chữ     12 · 14 · 16 · 20 · 28    · đậm 400 / 600
blur       22px · 40px
chữ        -apple-system, 'SF Pro Text'
```

⚠️ **Điểm cần soi:** accent `#6a57f5` là tím-indigo — **không có trong bảng màu Hoà thích**
(*greige · kem · champagne · nâu óc chó · đen nhấn · xanh cây điểm*). Tím là màu mặc định của
mọi SaaS. Đây là câu hỏi mở, mời nghiên cứu trả lời.

### 3c · Luật chữ Việt — ràng buộc cứng, khác hẳn tiếng Anh
Tiếng Việt có dấu **chồng hai tầng** (`ế` `ộ` `ữ`), nên các quy tắc tiếng Anh **gãy**:

| | Luật | Vì sao |
|---|---|---|
| **V-1** | **Cấm viết HOA** chuỗi có dấu | HOA cắt mất dấu ⇒ đọc sai nghĩa |
| **V-2** | line-height **≥ 1.5** | dấu tầng trên đụng dòng trên |
| **V-3** | letter-spacing **≥ 0** | âm là dấu chồng lên chữ bên cạnh |
| **V-6** | cỡ chữ **≥ 12px** | dưới ngưỡng, dấu thành một chấm mờ |

Hiện trạng đo được: **772/850 vi phạm là cỡ chữ dưới 12px** — tức thang chữ của app **nằm dưới
sàn đọc được của tiếng Việt**. Hoà đã chốt hướng xử: *nâng sàn 12px, giữ nguyên tỉ lệ*.
⇒ Mọi khuyến nghị typography phải **đi qua bốn luật này**. Một thang chữ hợp HIG mà phạm V-6
thì không dùng được.

### 3d · Sáu cổng duyệt mắt đã có, đang thi hành
Bất kỳ màn nào trượt một cổng ⇒ **không đạt**, dù mọi thứ khác sạch:

1. **Việc của con người** — mọi vật trên màn phải phục vụ đúng MỘT trong năm ô: *hiện diện con
   người · việc đang làm · điều cần chú ý · Design DNA · tiện ích người dùng CHỦ ĐỘNG bật*.
2. **Nhân vật chính** — nheo mắt nhìn, thứ đập vào đầu tiên phải là **việc của người dùng**.
   Nếu là sidebar / toolbar / ô tìm kiếm / tường thẻ / logo ⇒ trượt ngay.
3. **Cái gì biến mất mà không mất gì** — xoá một khối đi mà người dùng không mất **việc** nào
   (chỉ mất *thông tin*) ⇒ khối đó thừa. *"Màn sẽ trống"* không phải lý do giữ.
4. **Tường thẻ** — ≥4 thẻ ngang trọng lượng, cùng chất liệu, chia đều diện tích ⇒ lưới đã **cấm
   nhân vật chính tồn tại**.
5. **SaaS chung chung** — che logo và mọi chữ tiếng Việt đi, còn dấu vết nào nói đây là công cụ
   của người làm nội thất không? Không còn ⇒ trượt.
6. **Sự thật dữ liệu** — mọi con số phải thật. Số bịa, khung rỗng chờ nội dung, ảnh mẫu đứng thay
   ảnh dự án ⇒ trượt. *Im lặng hơn là bịa.*

---

## 4 · MONG ĐỢI Ở PHIẾU ĐỊNH HƯỚNG

1. **Nghiên cứu, có nguồn.** Apple HIG là một nguồn, không phải nguồn duy nhất — cần cả chuẩn
   khả dụng (WCAG), chuẩn công cụ chuyên nghiệp (phần mềm sáng tạo dùng lâu, nhiều giờ), và
   thiết kế lấy con người làm trung tâm. Nêu nguồn, đừng nêu ý kiến.
2. **Chấm 24 màn theo sáu cổng §3d.** Màn nào trượt cổng nào, chỉ đúng chỗ trên ảnh.
3. **Apple HIG áp tới đâu, dừng ở đâu.** HIG viết cho app tiêu dùng trên thiết bị Apple. IF là
   **công cụ chuyên nghiệp desktop, dùng nhiều giờ liền, đa nền tảng**. Chỗ nào HIG hợp, chỗ nào
   phải lệch, và **lệch theo chuẩn nào** — đây là phần có giá trị nhất của phiếu.
4. **Human-centric nghĩa gì với NGHỀ NÀY.** Kiến trúc sư nội thất ngồi 8–10 tiếng, làm việc với
   bản vẽ, vật liệu, ảnh, và **khách hàng đang ngồi cạnh**. Khác hẳn người dùng app tiêu dùng.
5. **Chuỗi ba chặng.** `2D → 3D → Trình bày` phải cảm thấy là **một dòng chảy**, không phải ba
   app ghép. Nói cách nào làm được điều đó, đo bằng gì.
6. **Trả lời câu accent tím** ở §3b.
7. **Xếp hạng theo mức hại**, cấm liệt kê phẳng: *chặn việc · sai sự thật · hỏng kiến trúc ·
   hao mòn*.
8. **Nói thẳng cái gì KHÔNG nên đổi.** Phiếu chỉ toàn đề xuất đổi là phiếu chưa đọc kỹ.

---

## 5 · RÀNG BUỘC — vi phạm là phải làm lại

- **Trung tính thương hiệu.** Không nhúng nhận diện studio nào. Gu của Hoà là **tập hiệu chuẩn**,
  không được thành gu ép lên người dùng.
- **Local-first.** Chạy offline. Đề xuất nào cần mạng phải nói rõ và nêu đường hạ cấp.
- **Song ngữ Việt/Anh.** Mọi khuyến nghị typography phải đúng cho **cả hai**, và tiếng Việt là
  ràng buộc chặt hơn (§3c).
- **Không đề xuất chung chung.** Câu như *"cần tinh tế hơn"*, *"nhìn hơi rối"*, *"trông cao cấp"*
  là câu rỗng — phải chỉ được vào một vùng cụ thể trên một ảnh cụ thể.

---

## 6 · NGUỒN GỐC

Lane `00 · MAIN · điều phối` (Claude Code) viết, 30/08/2026, theo yêu cầu trực tiếp của Hoà.
Mọi số đo trên máy Hoà cùng ngày. Chỗ chưa đo đều ghi rõ là **chưa đo**.
Phiếu anh em: [`may-doc-gu.md`](may-doc-gu.md) — máy đọc gu cho màn Cảm hứng.
