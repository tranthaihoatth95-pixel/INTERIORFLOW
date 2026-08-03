# NC-7 · PM APP CHO STUDIO NHỎ — Lark Base / Monograph / Float / Linear·Asana·Notion
**COWORK-NC · 02/08/2026 đêm (sổ hệ: đợt bơm "04/08").** Nuôi: **ArchiNote v1** (repo `ttt-tasks`).
**Đối chiếu spec có sẵn (đã grep khung):** `SPEC-ARCHINOTE-DETAIL-v1` — 5 module (① Điều phối MVP có thật · ② Hiện trường/Thu thập · ③ Trợ lý & tra cứu · ④ Vị trí & An toàn · ⑤ Hạ tầng), mobile-first, hợp đồng dữ liệu 2 chiều với Lark (B1–B7, bảng `PROJECT_STATUS` mới + `MEASUREMENT` + link ATLAS). **Bài này rót nguyên liệu vào module ①+③ và ranh giới với Lark Base — KHÔNG lật kiến trúc 5 module.**

---

## 1 · Lark Base làm được gì / không được gì (TTT đang dùng — ranh giới quan trọng nhất)

| | Có | Giới hạn đo được |
|---|---|---|
| View | Grid · **Kanban** · **Gantt** (có cả ở FREE) · Gallery · Calendar · Form; đổi 1 view sync mọi view real-time | Gantt có timeline/milestone; **dependencies không xác nhận được từ tài liệu công khai** — coi là KHÔNG có cho tới khi thấy tận mắt |
| Bảng | database có schema, automation (auto-tạo group khi mở dự án, nhắc mốc) | **Free: 2.000 dòng/bảng · Pro: 20.000 · Enterprise: 50.000**; automation **1.000 lượt chạy/tháng (free) · 50k (Pro) · 500k (Ent)** |
| Hợp studio | TTT đã ở trong Lark (chat + base "Quản lý Công việc" + ATLAS wiki) — chi phí chuyển = 0 | Base là BẢNG, không phải nghiệp vụ: không biết "phase kiến trúc", không biết "workload người", không thu dữ liệu tự động |

Nguồn: [Base limits FAQs (chính hãng)](https://www.larksuite.com/hc/en-US/articles/890398616778-base-limits-faqs) · [Overview of paid features for Base](https://www.larksuite.com/hc/en-US/articles/843573886007-overview-of-paid-features-for-base) · [Base automation FAQs](https://www.larksuite.com/hc/en-US/articles/126710842099-base-workflow-and-automations-faqs) · [Lark Base product](https://www.larksuite.com/en_us/product/base)

## 2 · Hai app "đúng nghề" đáng chép nhất

**Monograph** — PM chuyên A&E firm 5–50 người, mô hình chuẩn nghề: dự án chia **PHASE** (concept → DD → CD…), mỗi phase mang **fee/budget giờ + người được gán + milestone**; timesheet **tự gắn vào phase** đang chạy; forecast doanh thu/lợi nhuận theo phase. Than phiền thật (Capterra/SelectHub/itqlick): **reporting yếu** (khó kéo báo cáo tổng), chậm/sync trục trặc, QuickBooks sync lỗi, **giá $25–45/user/tháng** bị kêu đắt với firm nhỏ. → [monograph.com](https://monograph.com/features/project-management) · [Capterra reviews](https://www.capterra.com/p/178124/Monograph/reviews/) · [SelectHub](https://www.selecthub.com/p/engineering-project-management-software/monograph-project-management/)

**Float** — resource planning chuẩn agency: **Schedule = lưới NGƯỜI × THỜI GIAN** là nguồn sự thật duy nhất; gán việc theo giờ/ngày/% capacity; **cảnh báo quá tải + chống double-booking real-time**; triết lý "planning view first" — nhìn người trước, việc sau. Yếu: integrations ít. → [float.com capacity planning](https://www.float.com/product/capacity-planning) · [Digital PM review](https://thedigitalprojectmanager.com/tools/float-review/)

## 3 · Linear · Asana · Notion — bài học cho team 5–15 người

- **Linear**: nhanh, ít nghi thức, tạo task 1 dòng + phím tắt — nhưng dev-centric, yếu planning tầng cao ([everhour so sánh](https://everhour.com/blog/linear-vs-asana/)). Pattern đáng chép: tạo-nhanh-không-form + nhịp cycle tuần.
- **Asana**: timeline/dependencies/template tốt nhưng **overwhelming với team nhỏ**, learning curve bị kêu nhiều ([G2 compare](https://www.g2.com/compare/asana-vs-notion)).
- **Notion**: wiki/handbook mạnh, nhưng tự xây workflow = tự làm PM tool — team nhỏ sa lầy setup; chậm với DB lớn (đã đo ở `NC-spreadsheet-nhung` §2).
- Khôn ngoan cộng đồng lặp lại: **"sửa quy trình trước, đổi tool sau"** — tool không cứu được workflow rối.

---

## 4 · ĐIỀU ARCHINOTE NÊN LÀM (14 mục, rót vào module ①+③ + ranh giới Lark)

**Ranh giới với Lark Base (nguyên tắc):**
1. **KHÔNG đấu với Lark Base ở bảng tuỳ biến** — Grid/Kanban/Gantt/automation Lark làm rồi và TTT đang dùng; ArchiNote chỉ dựng view NGHIỆP VỤ mà Base không dựng nổi (phase board, workload người, nhật ký hiện trường). Hợp đồng B1–B7 của spec đã đúng hướng pull/push bảng — giữ.
2. **Tôn trọng trần Lark**: bảng `PROJECT_STATUS`/`MEASUREMENT` thiết kế để sống dưới 2.000 dòng/bảng (free) hoặc xác định sớm phải lên Pro 20k — ghi thẳng con số vào spec hạ tầng, đừng để đầy bảng mới biết.
3. **Automation Lark có hạn mức 1.000 lượt/tháng (free)** — đồng bộ ArchiNote↔Lark nên batch theo phiên, không bắn từng record một (1449 bản ghi ATLAS đã suýt chạm hạn mức 1 lần chạy).

**Module ① Điều phối — chép Monograph + Float:**
4. **PHASE là đơn vị hạng nhất, không phải task**: dự án nội thất = Khảo sát → Concept → Dựng/Render → Hồ sơ KT-TC → Giám sát; mỗi phase mang deadline + người gán + deliverable. Task sống TRONG phase. (Monograph chứng minh đây là mô hình đúng nghề A&E.)
5. **Phase template chỉnh sửa được** — mặc định 5 phase trên nhưng studio tự thêm/bớt (luật trung tính ArchiNote đã chốt: không hardcode quy trình TTT).
6. **Workload view kiểu Float = màn đắt giá nhất**: lưới người × tuần, mỗi ô = % tải từ phase đang gán; đỏ khi >100%. Trả lời câu hỏi số 1 của trưởng studio: *"ai còn tay để nhận việc gấp?"* — Lark Base không dựng nổi màn này.
7. **Tạo nhanh 1 dòng kiểu Linear**: ô nhập duy nhất "việc @người #dự-án thứ-6" — không form 8 trường. Nghi thức Asana là thứ giết adoption ở team 10 người.
8. **Nhịp TUẦN, không sprint**: board "Tuần này" tự cuộn mỗi thứ 2 (khớp họp đầu tuần studio); không có backlog nghi lễ.
9. **Milestone = nộp hồ sơ** (deliverable gắn CĐT) có đếm ngược ngày — deadline studio nội thất xoay quanh các buổi nộp/duyệt, không phải % hoàn thành.
10. **Timesheet mức RẺ nhất**: log "hôm nay tôi ở phase nào" 1 chạm (auto-gợi ý theo phase đang gán, chép cơ chế auto-assign của Monograph) — KHÔNG chấm công giờ chi tiết ở v1, studio nhỏ ghét và sẽ bỏ.
11. **Reporting v1 = ĐÚNG 1 dashboard**: dự án đang chạy × phase hiện tại × ai × deadline gần nhất. Monograph bị chê nặng nhất ở reporting phức tạp — đừng bước vào vũng đó sớm.

**Module ③ Trợ lý & tra cứu — resource handbook:**
12. **Hồ sơ người = kỹ năng + lịch sử**: phần mềm thạo (SU/Max/CAD/render/IF), dự án đã qua, ngày nghỉ — nguồn dữ liệu cho #6 và cho gán việc; mô hình = Notion wiki nhưng có schema (không trang trắng tự do).
13. **Sổ tay tài nguyên vật chất nhẹ**: máy đo laser, máy ảnh, mẫu vật liệu — ai đang giữ, cột Reference sang ATLAS khi là vật liệu (link module B4/B5 spec đã định).

**Điều KHÔNG app nào có — moat của ArchiNote:**
14. **THU tự động từ IF** (đúng định vị "máy THU" của `CHOT-HUONG-3D`): IF render xong / xuất hồ sơ → tự ghi sự kiện vào phase tương ứng (qua bảng `PROJECT_STATUS` hợp đồng B2) — tiến độ tự cập nhật không ai phải gõ. Monograph/Float/Asana đều mù về tool sản xuất; ArchiNote nhìn thấy vì cùng hệ. Đây là lý do tồn tại, ghi to vào spec v1.

*(+1 luật làm việc, không phải tính năng)* — **Map quy trình thật trước khi build**: 30 phút phỏng vấn Hoà vẽ flow hiện tại của studio (việc đi từ đâu tới đâu, ai giao, ai duyệt) rồi mới chốt board — bài học "fix workflow trước tool" của cộng đồng PM.

**Giới hạn nghiên cứu:** Gantt dependencies của Lark Base không xác nhận được từ nguồn công khai (marketing không nói, FAQ không nói) — cần Hoà mở Base thử 1 phút; giá/limits Lark lấy từ help chính hãng nhưng plan VN có thể khác US; Monograph/Float chưa dùng tay, mô tả từ doc + review tổng hợp; con số "15–25% on-time" của Float là claim vendor — không dùng làm căn cứ, chỉ dùng mô hình màn hình.
