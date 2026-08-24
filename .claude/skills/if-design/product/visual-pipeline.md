# VISUAL PIPELINE — Grounded Render, làm ảnh bám ý

> **[N]** = sự thật từ nguồn · **[IF]** = diễn giải.

## 1 · LÀ GÌ / KHÔNG PHẢI LÀ GÌ

**LÀ** — chuỗi làm ảnh **bám vào ý của kiến trúc sư**, chữa đúng bệnh *AI trộn toàn cục làm render
chung chung*. Sáu bước, **mỗi bước đều có xem-trước · sửa · lùi lại**. **[N]** spec 13/08.

⛔ **ĐỊNH VỊ ĐÃ THÀNH LUẬT: Grounded Render là CONCEPT để trình chủ đầu tư — KHÔNG có giá trị kỹ
thuật.** Phần kỹ thuật là **mode dựng khối 3D**. Đó là sứ mệnh hai mode của chặng 3D. **[N]** 13/08.
⇒ Hệ quả trực tiếp: **con số không bao giờ đến từ ảnh.** Gán định danh trên phối cảnh **chỉ phục vụ
TRÌNH BÀY** (biết vật liệu này là gì, đang nằm đâu ⇒ tự gom thành bảng vật liệu + nhóm thông số).
**BOQ chỉ nhận số đo được từ 2D/khối.** **[N]** Hoà 15/08.

## 2 · VIỆC CỦA CON NGƯỜI
Biến một khung hình + một mớ ảnh tham khảo thành phối cảnh **giống ý mình**, và **giải thích được**
vì sao nó ra như vậy.

## 3 · NHÂN VẬT CHÍNH
**Ảnh kết quả.** Mọi bảng điều khiển phải nhường nó.

## 4 · SÁU BƯỚC — được phép / bị từ chối
| Bước | Làm gì | Ràng buộc |
|---|---|---|
| **B1 · đọc khung** | tiêu cự · góc · điểm tụ · chân trời · hộp không gian | dùng lại bộ đo phối cảnh đã có |
| **B2 · định danh mảng** | phân mảng cấp pixel | mảng máy suy **phải mang cờ *suy ra***; kiến trúc sư sửa được từng vùng |
| **B3 · phiếu 4 cấp** | tổng thể → trần-tường-sàn → mảng vật liệu → chi tiết | ⭐ **máy PHẢI TRÌNH PHIẾU, người duyệt TRƯỚC khi áp** |
| **B4 · bảng ánh xạ + núm mức bám** | mảng ↔ mảng, 0–100% từng mảng | trọng số đề xuất **70% chuẩn ngành · 20% Thẻ DNA kiến trúc sư · 10% gu chủ đầu tư** |
| **B5 · sinh TỪNG MẢNG** | mask cứng + điều khiển khung từ B1 | **không trộn toàn cục**; seed chung một đợt; mảng hỏng chạy lại riêng |
| **B6 · thống nhất ánh sáng** | một lượt hoà sáng cuối | máy **tự kiểm lại phiếu B3 so với kết quả; lệch thì báo, KHÔNG ship im** |

| Bị từ chối | Lý do |
|---|---|
| Trộn toàn cục một lần | đó **chính là** căn bệnh spec sinh ra để chữa |
| Áp phiếu mà không có người duyệt | B3 là cửa người bắt buộc |
| Đo diện tích/khối lượng từ ảnh phẳng | sai số lớn ⇒ **đóng hướng này**; ảnh chỉ mang định danh **định tính** |
| Spinner giả / % nội suy | hàng đợi khai số thật |
| Hứa "mask tự động là đủ" | phản biện giữ lại: segmentation **không bao giờ hoàn hảo** ⇒ phiếu B3 + sửa mask **bắt buộc nằm trong luồng** |

## 5 · TRẠNG THÁI
Bậc thang tự khai: **v0** (mask bán tự động + vá mảng) → **v1** (phân mảng đa mảng + bảng ánh xạ +
núm từng mảng) → **v2** (đo khung tự động + tự kiểm B6).
🔴 **Hiện chỉ ở v0.**
Giá tiền hiện **trước khi chạy**; bước không tốn credit thì ghi 0. Node trả lỗi vẫn ném để **hoàn
credit**.

## 6 · CHỐT ĐÃ KÝ
| Ngày | Chốt |
|---|---|
| 13/08 | Spec Grounded Render chốt; định vị **concept ≠ kỹ thuật**; bậc v0 tuần đó |
| 13/08 | **Năm cỗ máy chung phải đồng bộ** — phiếu-đề-xuất · **định danh vùng** · khuôn núm-ngăn-xếp · cổng hậu-kiểm · pha trọng số 70/20/10 có phả hệ nguồn. **Tính năng mới rơi vào khuôn mà tự chế riêng = vi phạm đồng bộ, chặn ở bước lập kế hoạch** |
| 13/08 | ⭐ **Ảnh sinh từ cảnh của IF thì mask = CHIẾU THỰC THỂ, không cần đoán bằng AI** — lợi thế một-nguồn |
| 15/08 | Con số chỉ đến từ chỗ đo được; BOQ chỉ nhận số đo được; định danh trên ảnh phục vụ **trình bày** |
| 15/08 | Backbone thị giác **chạy cục bộ** (local-first + cắt chi phí mỗi lần nhìn ảnh) |

## 7 · CA HỎNG THẬT
**① Bốn trong sáu bước CHƯA CÓ FILE.** Chỉ B3 (sinh phiếu) và B5 (vá theo mảng) tồn tại. B1 · B2 ·
B4 · B6 **không có mã**. Spec tự khai đây là chủ ý của v0 — **nhưng phải nói đúng khi giao việc:
không có B4 thì không có "núm mức bám từng mảng", và không có B6 thì không có ai kiểm lại phiếu.**

**② Backbone thị giác: CHƯA CÓ.** Đo 15/08: **0 gói học máy chạy cục bộ**; thư mục thị giác toàn
**thị giác cổ điển** (không học máy); thứ nghe như phân mảng ngữ nghĩa thực ra là **phân cụm MÀU tất
định**; cột nhúng trong dữ liệu là vector **CHỮ** cho tra cứu văn bản, không phải ảnh. ⇒ mọi năng
lực thị giác hiện là **gọi API ra ngoài**, và **không cái nào chia sẻ đặc trưng với cái nào** —
cùng một ảnh, mỗi lượt gửi đi tính lại từ đầu.
⚠️ Hai ràng buộc đã nêu trước, **chưa ai quyết**: ① **giấy phép TRỌNG SỐ mô hình không đi qua cổng
kiểm giấy phép gói** — với sản phẩm bán ra, phải tự kiểm tay và ghi vào sổ giấy phép (đúng bài học
GPL đã trả giá) ② **một mô hình KHÔNG phủ hết ba việc** — đặc trưng dày cho mask/so khớp hình học là
một họ, truy vấn bằng CHỮ là họ khác. Đừng hứa một backbone làm tất.

**③ Ba việc đang xếp hàng đều cần đúng tầng đó** — chiếu thực thể ra mask · gán định danh vật liệu
trên phối cảnh · tìm ảnh/vật liệu tương tự. **Nếu không có tầng chung, mỗi cái sẽ tự chế một đường
riêng** — đúng bệnh "nguồn thứ hai".

**④ Bài học *"không có bữa trưa miễn phí"* (15/08).** Một thư viện được giới thiệu là *"chạy mô hình
70 tỉ tham số trên máy 4GB"* — tra ra: nó **không nén**, nó **phát từng lớp**; mô hình vẫn phải đọc
**hết** cho **mỗi token** ⇒ **~19–43 giây/token** ⇒ một câu trả lời 200 chữ mất **hơn một tiếng**.
⇒ Cách kiểm nhanh: **số tham số × 2 byte = số GB phải đọc mỗi token**, chia cho tốc độ đĩa.

## 8 · ĐÀO SÂU
| Cần gì | Đọc đâu |
|---|---|
| Spec 6 bước + bậc v0/v1/v2 + phản biện giữ lại | `docs/SPEC-GROUNDED-RENDER-2026-08-13.md` |
| Mã có thật (chỉ B3 · B5) | `lib/grounded-render/types.ts` · `reference-sheet.ts` · `region-inpaint.ts` |
| Hai node đã nối vào sổ node (phiếu 0 credit · render mảng 4 credit, có tham số *duyệt* và *mức bám*) | `lib/nodes/defs/grounded-render.ts` |
| Bảng giá từng node | `lib/nodes/registry.ts` |
| Bộ đo phối cảnh (B1 dùng lại) | `lib/vision/single-view-metrology.ts` |
| Năm cỗ máy chung phải đồng bộ | `docs/REVIEW-DONG-BO-CO-CHE-2026-08-13.md` |
| Hàng đợi render | `components/render-studio/render-queue-store.ts` |

**🔴 CHƯA GIẢI:**
- **Vành trạng thái job: KHÔNG CÓ BẢN VẼ** — nằm trong hàng đợi *DESIGN REQUIRED*. Trong khi đó
  tham chiếu 16/08 đã chỉ ra thứ IF thiếu: **đèn tiến trình TỪNG BƯỚC** (biết tắc ở đâu) và
  **dock tác vụ ĐẶT TRÊN KẾT QUẢ** (biến thể · phóng to · tách nền).
- **Nút `+` trên sợi dây** (chèn một bước vào giữa hai bước) — món rẻ nhất, thấy ngay, và là **điều
  kiện để chuỗi dài dễ sửa**. Chưa dựng.
- **Node mang kết quả ngay trong thân** — node hiện là thẻ thông tin, phải mở ra mới thấy ảnh.
- **Chạy cục bộ hay mượn công cụ dòng lệnh của người dùng** — hai hướng **không loại trừ nhau** (dò
  cấu hình để chọn mô hình chạy offline; mượn công cụ khi người dùng có). Chưa chốt.
- **Chi tiết cực nhỏ (tay nắm, khe chỉ) vẫn cần sửa vùng bằng tay** — đã khai thật, đừng hứa ngược.
