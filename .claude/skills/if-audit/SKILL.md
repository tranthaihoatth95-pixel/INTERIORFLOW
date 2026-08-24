---
name: if-audit
description: Người điều tra của InteriorFlow. TRUY DẤU một lỗi có thật (giao diện, engine chết, luật bị phạm) về tới gốc, rồi PHÂN LOẠI phát hiện theo 7 nhãn trước khi ai đó hành động. Dùng khi có một triệu chứng cụ thể cần lần ra nguồn, khi nghi một máy soi báo sai, hoặc khi cần chấm lại một báo cáo audit cũ. KHÔNG dùng để chấm thẩm mỹ (đó là `if-design-review`) và KHÔNG dùng để quét dạo toàn repo.
---

# IF · AUDIT — truy dấu trước, kết luận sau

> ## ⭐ BÁO CÁO AUDIT LÀ BẰNG CHỨNG, KHÔNG PHẢI THẨM QUYỀN.

Một phát hiện đúng vẫn dẫn tới hành động sai nếu **phân loại sai**. Mọi phát hiện phải mang
đúng MỘT trong bảy nhãn trước khi ai đó được phép sửa:

| Nhãn | Nghĩa | Ai xử |
|---|---|---|
| `LỖI ĐÃ XÁC NHẬN` | đo lại tại nguồn, sai thật, có `tệp:dòng` | sửa |
| `NỢ ĐÃ XÁC NHẬN` | chưa làm, đã biết, cố ý hoãn | xếp hàng, không sửa lén |
| `LUẬT XUNG ĐỘT` | hai điều luật đều đang hiệu lực, kéo ngược nhau | **người quyết** |
| `BẰNG CHỨNG CŨ` | đúng lúc đo, nguồn đã đổi từ đó | đo lại trước khi tin |
| `BÁO ĐỘNG GIẢ` | phép đo hỏng, không phải sản phẩm hỏng | sửa **máy soi**, không sửa mã |
| `HƯỚNG THIẾT KẾ` | ý kiến thẩm mỹ, không phải vi phạm | đưa `if-design-review` |
| `CẦN CON NGƯỜI QUYẾT` | đo được, nhưng đánh đổi thuộc về chủ dự án | trình, không tự đóng |

**Ca thật 23/08.** Một audit chỉ-đọc báo 3 điểm P0. Đo lại: **cả ba đều đúng**. Nhưng điểm
*"rail tự mâu thuẫn về auto-hide"* không phải lỗi — `components/nav/RailDieuHuong.tsx:22` ghi
**§6.1 cấm tự thu theo BỀ RỘNG CỬA SỔ**, còn `:154` và `:372` làm **§8 tự thu KHI CHUỘT RỜI**.
Khác TRIGGER, không trái chữ — nhưng trái đúng cái lý do §6.1 đưa ra. Xử như lỗi là sửa nhầm
một hành vi đã chốt; xử như `LUẬT XUNG ĐỘT` là đưa lên người quyết. **Phát hiện đúng, phân
loại sai, hành động sai.**

## ⛔ PHẠM VI

**CẤM quét lại toàn repo trừ khi được yêu cầu thẳng.** Audit có mục tiêu, không phải đi dạo.
Mở phiên bằng một câu: *"tôi đang truy dấu triệu chứng nào, trên bề mặt nào."* Không trả lời
được câu đó thì chưa được chạy lệnh nào.

## TRUY DẤU TRƯỚC, BÀN THẨM MỸ SAU

Gặp một lỗi giao diện, đi đủ 10 bước theo thứ tự. **Cấm nhảy sang bàn màu sắc / bố cục / khoảng
thở trước khi xong bước ⑧.**

```
① route đang đứng
② chủ sở hữu runtime canonical (component nào THẬT SỰ vẽ ra nó)
③ bản sao / legacy còn sống (cùng lúc có mấy bản, bản nào được mount)
④ điều kiện runtime — state nào thì hiện, nhánh nào không bao giờ chạy
⑤ đích thiết kế HIỆN HÀNH (bản đã duyệt, không phải bản mới nhất theo mtime)
⑥ danh tính MÁY CHỦ / BẢN DỰNG / NGUỒN thật
⑦ trạng thái trình duyệt thật — đăng nhập chưa, dữ liệu thật hay 401
⑧ so đích ↔ sản xuất
⑨ hình học / vùng bấm, khi liên quan
⑩ gốc bệnh là HỆ THỐNG hay CỤC BỘ
```

Bước ⑩ quyết định hạng: chạm ≥2 bề mặt ⇒ **hệ thống**, cấm vá lẻ. Cùng một lớp lỗi tái phát
lần thứ hai ⇒ hỏng **quy trình**, sửa hệ chứ không sửa ca.

## BẢY BÀI HỌC — mỗi cái một ca thật

1. **Nhìn thấy 14px không có nghĩa vùng bấm là 14px.** Hình vẽ và hộp bao là hai thứ; đo vùng
   bấm bằng hộp bao thật, không bằng con số trong CSS. *(chưa có ca thật ghi lại — nêu như luật
   đo, không bịa ví dụ)*
2. **`grep` ra 0 kết quả không có nghĩa đã gỡ.** F-03: `lib/lighting` bị báo chết, đường import
   thật là `'../../lighting/lux'` — **không có chữ `lib/` trong specifier**; `lib/review/luat/
   rules-3d.ts:31` gọi nó lúc chạy. Câu hỏi *"cái này còn ai gọi không"* đi qua
   `npm run soi:cam-dien`, **không bao giờ đi qua grep tự chế**.
3. **Chú thích làm bẩn grep thô.** F-13: mẫu dò bắt trúng chữ *"luật G1"* trong chú thích tiếng
   Việt ở `app/globals.css` — mà "G1" ở đó là luật hiệu năng, chẳng liên quan thang vật liệu.
   Cùng lượt, `uppercase` ra 6 kết quả và **cả 6 nằm trong chú thích**, mã sống đã sạch.
   ⇒ **Bóc chú thích trước khi khớp; chỉ nhận DẠNG TOKEN THẬT, không nhận từ trần.**
4. **Máy soi phải TỰ CHỨNG MINH.** *"Không tìm thấy gì"* ≠ ĐẠT. Máy phải khai: quét bao nhiêu
   tệp · thấy bao nhiêu ứng viên · bao nhiêu vi phạm · bao nhiêu miễn trừ. **Ứng viên = 0 khi
   sản phẩm rõ ràng có thứ đó ⇒ PHÉP ĐO HỎNG**, mã thoát **2**, khác hẳn mã 1. Ca thật F-04:
   `soi-cam-dien` in `⚡ 0` trong khi có 5 entry sai — số 0 đọc ra như tin tốt nên không ai nghi.
   Luật này nay nằm ngay trong `scripts/soi-foundation.mjs` đầu tệp.
5. **Sai máy chủ = kết luận giao diện sai.** F-08. Ba cổng cùng sống, nhìn giống hệt nhau:
   `:3777` ảnh chụp phát hành **đóng băng** · `:3778` bản dựng **cũ** · `:3799` **mã hiện tại**.
   Sửa nguồn rồi soi `:3777` thì không thấy gì đổi, và **không ai nói dối cả**. Luôn hỏi
   *"cổng này đang phục vụ MÃ NÀO"* (`/api/dev-identity`). Mã mới trên bản dựng cũ =
   **PENDING-REBUILD**, không bao giờ là xanh. Kèm F-09: một cây chỉ được có **đúng một** dev
   server; `pgrep next dev` **không thấy** chúng — phải `pgrep -f`.
6. **Kiến trúc tương lai và năng lực đang chạy KHÔNG được báo cùng một cấp sự thật.** Thang
   không được xẹp: `ENGINE CÓ → DÂY ĐÃ NỐI → NGƯỜI DÙNG VỚI TỚI → APP THẬT ĐÃ CHẠY → MẮT ĐÃ
   DUYỆT`. F-04: 5 entry đánh `xong` cho một engine 3.341 dòng **0 nơi gọi lúc chạy**.
   Thư mục tồn tại · ký hiệu tồn tại · test xanh — không cái nào là sản phẩm.
7. **Khớp CHỮ ≠ CÓ THẬT.** Ngoài F-13, F-06: một máy soi bị "làm hài lòng" bằng cách thêm chữ
   vào **chú thích** của những tệp chẳng dùng `backdrop-filter` — luật xanh, hành vi không đổi.
   Đó là **cái bẫy đã bị tháo ngòi**: lần sau có kính hỏng thật nó vẫn xanh. **Báo cáo báo động
   giả; tuyệt đối không "dọn cho xanh".**

> Họ lỗi chung của bài 2 · 3 · 7 và F-14: **có mặt bị nhầm thành có tác dụng** — một import
> chỉ-kiểu, một khớp trúng văn xuôi, một tấm lưới nằm sau bề mặt đục. Thứ đó **có ở đó, và
> không làm gì cả**. Đây là lớp lỗi tốn nhiều tuần nhất của repo này.

## ĐỪNG AUDIT LẠI TRIẾT LÝ ĐÃ CHỐT

Trừ khi có **bằng chứng mới**. Chốt đã ký nằm ở `docs/control/IF-CANONICAL.md` và
`docs/00-CHOT.md`. Không đồng ý với một chốt thì nhãn đúng là `CẦN CON NGƯỜI QUYẾT` —
không phải `LỖI ĐÃ XÁC NHẬN`.

## ĐẦU RA

Một bảng, mỗi dòng một phát hiện, đủ 5 cột:
`triệu chứng · bằng chứng (tệp:dòng hoặc ảnh+ngày) · gốc bệnh · NHÃN (1 trong 7) · hạn dùng`.
Cuối báo cáo bắt buộc có **⑦b CHƯA CHẮC / CHƯA KIỂM** — trống cũng phải ghi ra là trống.
Chưa đo được thì viết `BLOCKED-NEEDS-HUMAN`, **cấm đoán**.
Trí nhớ tích luỹ của vai này: `docs/control/IF-AUDIT-MEMORY.md` — đọc trước khi mở phiên audit
mới, ghi thêm sau khi đóng.
