# SOÁT LẠI CẢ PHIÊN 15/08 — Hoà tick từng mục rồi T làm một loạt

> Hoà yêu cầu: gom hết những gì bàn trong phiên + phần mới về hiển thị luật, gạch đầu dòng ngắn để
> soát từng mục, kèm bảng việc chưa làm. **Chưa mục nào được thi công tới khi Hoà tick.**
> Cách trả lời nhanh nhất: *"A3 sai — phải là …"*, còn lại coi như đúng.

---

## A · ĐÃ CHỐT TRONG PHIÊN (soát lại cho chắc)

**A1 · Master tool thuộc canvas.** Tool window là NODE trên canvas, không phải hộp thoại nổi. Mở
được nhiều cái cùng lúc, nối dây với nhau. Kết quả mỗi tool = một file đã có định nghĩa, và chính
nó là đầu vào của tool kế.

**A2 · Nấc nhỏ nhất của master tool = pill mang trạng thái** (44px, có tiến độ), không phải icon trần.

**A3 · Định danh bằng dải màu đặc 2px đáy thẻ**, hover thì đậm lên. Không dùng neon phát sáng —
kênh sáng đã dành cho "đang chạy".

**A4 · Chặng 2 = MỘT bộ lệnh, HAI lối thao tác** (node kiểu ComfyUI ↔ tool truyền thống). Không bỏ
mode nào. Cấm mỗi lối một tập lệnh riêng.

**A5 · Ranh giới id-phối-cảnh vs con số.** Gán id trên phối cảnh chỉ phục vụ TRÌNH BÀY (bảng vật
liệu, spec). Con số chỉ đến từ CAD/Revit hoặc khối dựng đo được. **BOQ chỉ nhận số đo được**, người
sửa tay sau.

**A6 · Bảng vật liệu sinh từ id**: mẫu xếp chồng đè nhau, bố cục đầy đủ, trỏ vào mẫu nào hiện thông
tin mẫu đó, và **bản nộp y chang bố cục trên màn**.

**A7 · Đơn vị đo + tỉ lệ chỉnh được ở cấp toàn app.** Ràng buộc cứng: **lưu trữ luôn là mm**, chỉ
đổi lớp hiển thị và lớp nhập.

**A8 · Kiến trúc lệnh 3 tầng**: một sổ lệnh duy nhất → ① thanh chung ≤9 lệnh giống hệt 3 chặng ②
nhóm lệnh 2 khuôn (Photoshop cho nhóm hay dùng · thư mục iOS cho nhóm tra thỉnh thoảng) ③ cửa sổ
nhỏ "chỉnh lệnh vừa chạy" kiểu Blender F9.

**A9 · Thiết kế = mã: AI sinh BuildRecipe, KHÔNG sinh mã tự do.** Đúng luật 8. Không chạy mã do AI
viết trên máy người dùng (IF chưa có sandbox nào).

**A10 · Vision backbone chạy cục bộ.** onnxruntime-node + MobileSAM + CLIP (~197MB). **Nhưng v0 phải
là PHÉP THỬ** — đo xem model phân biệt nổi gỗ sồi với gỗ óc chó không, trước khi nhúng 153MB.

**A11 · "AI học kiến thức IF" = RAG, không phải training.** Fine-tune bất khả vì thiếu dữ liệu nhãn
(kho đang **0 dòng**), không phải vì máy yếu.

**A12 · Bậc-theo-cấu-hình-máy ≠ ThinkDial.** Hai trục vuông góc: ThinkDial = muốn nghĩ sâu tới đâu ·
bậc máy = máy gánh nổi model nào.

**A13 · IF tự mang runtime AI** (node-llama-cpp, MIT, Metal, chạy trong Electron), không bắt người
dùng cài Ollama. Lộ 3 lựa chọn: **Trong IF · Máy tôi đã có · Ngoài**.

**A14 · Kiểm chuẩn là việc của MÁY, AI chỉ góp ý.** ✅ Hoà đã duyệt.

**A15 · Không xây agent tự chạy.** Xây máy soạn đồ thị + cửa duyệt: máy trình chuỗi việc kèm giá,
người bấm duyệt, engine chạy đúng cái đã duyệt.

**A16 · Đừng đua sinh-deck-đẹp với đối thủ mã nguồn mở** (87k sao). Hào của IF là con số truy được
về một nguồn.

---

## B · PHẦN MỚI HÔM NAY — hiển thị luật, 3 loại, quyền hạn, Vitals canh lỗi thời

**B1 · Hai chế độ hiển thị.**
· **Ngắn** — lúc làm nhanh, nhiều việc, gấp: chỉ mức (đỏ/vàng) + tên điều khoản + một câu.
· **Đầy đủ** — lúc cần kiểm chứng: thêm **nguyên văn điều khoản** + cách sửa + ngày hiệu lực + cờ
  "số liệu chưa đối chiếu bản gốc".
· Nhớ lựa chọn, đổi được bất cứ lúc nào.

**B2 · Ba loại, phân theo NGUỒN.**
| Loại | Ai ban hành | Cách hiển thị |
|---|---|---|
| **Luật** | nhà nước · chính phủ | **trích nguyên văn** + số hiệu + ngày hiệu lực. Cấm AI diễn giải hay tóm tắt |
| **Tiêu chuẩn** | ngành, có số liệu + nghiên cứu | trích số + nguồn nghiên cứu; cho chọn bộ nào áp dụng khi nhiều chuẩn mâu thuẫn |
| **Xu hướng** | thay đổi theo xã hội | Vitals nêu nội dung **kèm tư vấn cho trường hợp hiện tại**; bắt buộc có nguồn công khai + ngày; **không bao giờ chặn** |

**B3 · T bổ sung: phải là HAI TRỤC, không phải một.**
· Trục NGUỒN: luật · tiêu chuẩn · xu hướng *(mới, chưa có trong code)*
· Trục RÀNG BUỘC: bắt buộc · điều chỉnh được · khuyến nghị *(**đã có** — `RuleBinding`)*
Hai trục không trùng nhau: một tiêu chuẩn ngành có thể thành bắt buộc khi hợp đồng viện dẫn; một
luật vẫn có điều khoản chỉ mang tính khuyến nghị.

**B4 · Quyền hạn 3 tầng** — không đẻ cơ chế mới, dùng nhãn nguồn `DataOrigin` đã chốt:
· **app-core** — bộ luật gốc, chỉ nhà phát hành sửa
· **studio** — chuẩn riêng công ty, admin studio sửa
· **project / cá nhân** — người dùng tự thêm cho dự án của mình
Người dùng **được đè** rule gốc bằng rule cùng id (cơ chế này `registry.ts` đã có sẵn), nhưng bản đè
phải mang nhãn nguồn để nhìn là biết ai đặt.

**B5 · Vitals canh lỗi thời.** Nhiệm vụ: dò xem luật/chuẩn có bản mới không, tra nhiều nguồn, đối
chiếu. Với chuẩn theo xu hướng thì viết thành bộ chuẩn chung để người dùng xem và định hình bộ
riêng.

**B6 · ⚠️ T CẢNH BÁO — đây là chỗ rủi ro pháp lý cao nhất trong toàn bộ phiên.**
Nếu Vitals nói *"TCVN X đã đổi thành Y"* mà sai, và KTS xuất hồ sơ theo đó, hậu quả là thật.
⇒ Đề xuất ba rào:
· AI **chỉ được BÁO** "có vẻ có bản mới, đây là link", **không được tự sửa bộ luật**.
· Cập nhật bộ luật **luôn phải qua người duyệt** (khuôn phiếu duyệt đã có).
· Với loại **Luật**: AI chỉ được **TÌM và TRÍCH NGUYÊN VĂN**, cấm diễn giải, cấm tóm tắt.

**B7 · Tin tốt: code đã đỡ sẵn kha khá.**
· `effectiveFrom` / `supersededBy` — chiều thời gian, **đã có**
· `verified: boolean` + `note` — cờ "chưa đối chiếu bản gốc", **đã có**
· `nguonCongKhai` bắt buộc cho góp ý xu hướng — **đã có**, khớp đúng ý B2
· `region` — chuẩn theo vùng/quốc gia, **đã có**
· Đè rule cùng id — **đã có**
· **Còn thiếu**: trường giữ **nguyên văn** điều khoản (nay `nguon` chỉ giữ mã số như "QCVN
  06:2022 §3.2"), trục **loại nguồn**, và nhãn **quyền hạn**.

---

## C · BẢNG VIỆC — chưa làm mục nào

| # | Việc | Nhóm | Phụ thuộc | Cỡ |
|---|---|---|---|---|
| 1 | Nhúng chữ cục bộ (BGE-M3) — RAG hết phụ thuộc mạng | AI nền | — | 1 phiên |
| 2 | Tầng "mượn CLI người dùng đã cài" | AI nền | — | 1 phiên |
| 3 | IF tự mang runtime (node-llama-cpp) + 3 lựa chọn | AI nền | #2 | 2 phiên |
| 4 | Bậc model theo cấu hình máy | AI nền | #3 | 1 phiên |
| 5 | **Phép thử** CLIP phân biệt vật liệu thật | Thị giác | — | 1 buổi |
| 6 | Vision backbone cục bộ (nếu #5 đạt) | Thị giác | #5 | 2–3 phiên |
| 7 | Hai chế độ hiển thị luật (ngắn / đầy đủ) | Luật | — | 1 phiên |
| 8 | Trục loại nguồn + trường nguyên văn điều khoản | Luật | — | 1 phiên |
| 9 | Nhãn quyền hạn 3 tầng cho rule | Luật | #8 | 1 phiên |
| 10 | Cắm kiểm chuẩn vào mọi cửa chuyển công đoạn | Luật | #7 | 1–2 phiên |
| 11 | Vitals canh lỗi thời + 3 rào an toàn | Luật | #8, #9 | 2 phiên |
| 12 | B2 — 3 thanh công cụ đọc chung sổ lệnh | Lệnh | B1 xong | 2 phiên |
| 13 | Nhóm lệnh 2 khuôn (Photoshop / thư mục iOS) | Lệnh | #12 | 1–2 phiên |
| 14 | Cửa sổ "chỉnh lệnh vừa chạy" (Blender F9) | Lệnh | #12 | 2 phiên |
| 15 | Master tool thành node trên canvas | Tool | — | 2–3 phiên |
| 16 | Máy soạn đồ thị + cửa duyệt | Agentic | #1 | 3 phiên |
| 17 | AI sinh BuildRecipe (thiết kế = mã) | Agentic | #3, #16 | 2–3 phiên |
| 18 | Đơn vị đo + tỉ lệ cấp app | Nền | — | 1 phiên |
| 19 | Bảng vật liệu sinh từ id phối cảnh | Trình bày | — | 2 phiên |
| 20 | Xưởng hoa văn parametric | Sáng tạo | #17 | 3 phiên |

**Chưa xếp thứ tự thi công** — chờ Hoà tick xong mục nào đúng, rồi T phân loại và chạy một loạt.

---

## D · QUY TRÌNH LÀM VIỆC — thống nhất lại

**D1 · Hoà chỉ chạm 3 lần mỗi việc**: ① nói chốt → ② duyệt bảng plan → ③ duyệt bằng mắt ở cửa cuối.
Mọi thứ giữa ba lần đó là việc của T.

**D2 · Hoà nói bằng lời xong là ĐÃ CHỐT.** T ghi thẳng vào sổ dạng khẳng định rồi đi tiếp — **không
dựng thành câu hỏi bắt Hoà bấm lần hai**. Chỉ hỏi lại khi hai cách hiểu dẫn tới hai việc khác hẳn.

**D3 · Câu hỏi thì dồn lại, hỏi gộp bằng trắc nghiệm**, luôn có ô "ý khác". Không rải câu hỏi cuối
mỗi lượt.

**D4 · Mỗi đợt phải có ≥1 việc nhìn-thấy-được + ≥1 việc giàu cốt lõi**, và cái nhìn-thấy phải nối
vào cốt lõi.

**D5 · T tự kiểm lại mọi báo cáo của agent** — chạy lệnh thật, mở file thật, không chép.

**D6 · Chốt mới = một dòng vào sổ máy ngay lúc chốt.** Chốt không vào sổ coi như chưa chốt.

**D7 · Kết phiên 0 lệch**: `soi:frontier` · `soi:tu-dien` · tsc · test đều sạch mới đóng phiên.

**D8 · Nợ nghiệm thu mắt là nút thắt thật** — hiện 66 việc xong-máy đối 1 việc qua mắt Hoà. Lô duyệt
mắt gộp là công cụ đúng để giải.
