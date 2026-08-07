# BẢNG LỆNH — Claude Design, CHIA ĐỢT · 06/08/2026
**THAY THẾ khối ① của `BANG-LENH-2026-08-06-DESIGN-FIRST.md`** (khối cũ gộp 11 màn một mạch → hư ở
màn thứ 5. Đúng §0m: *cấm vẽ liền một mạch*).

## Cách dùng
Dán **một đợt một lần**. Đợt xong, mở file xem được rồi mới dán đợt kế. Không dán trước.
File nào đã ra được ở lượt hư trước thì **giữ**, đợt tương ứng bỏ qua.

---

## KHỐI NỀN — dán MỘT LẦN đầu tiên, trước đợt 1

```
Ngữ cảnh cho cả loạt màn sắp vẽ (nhớ suốt phiên, tôi sẽ giao từng đợt nhỏ):

Sản phẩm: InteriorFlow — app desktop cho studio nội thất. Nền TỐI, accent tím #6a57f5.
TRUNG TÍNH TUYỆT ĐỐI: 0 logo, 0 tên studio, 0 màu thương hiệu của ai. Song ngữ VI/EN.
Dữ liệu mẫu phải HƯ CẤU.

LUẬT GIAO DIỆN — bắt buộc, đã trả giá để có:
G1 · CẤM animate opacity trên phần tử có backdrop-filter (fade thì fade y/scale/nội dung)
G2 · Lớp nổi nền ĐẶC ≥92%, popover ≥96%. Chữ đạt 4.5:1 với nền CỦA CHÍNH NÓ
G4 · Mọi cỡ chữ khai line-height ≥1,5. CẤM text-[Npx] trần, CẤM font: rút gọn
      (cả hai xoá line-height ⇒ CẮT DẤU TIẾNG VIỆT)
G5 · z-index theo thang khai báo, không rải số tuỳ hứng
G6 · CẤM icon hoá nút quyết định (Xoá · Gửi khách · Xuất hồ sơ) — phải có CHỮ
G7 · Bento chỉ cho màn TỔNG QUAN. Màn làm việc: vùng chính liền một khối
G8 · Kéo thả không bao giờ là đường DUY NHẤT — luôn có nút bấm tương đương

LUẬT AI (KS) — nơi nào có AI đề xuất:
KS1 dạng trung gian đọc/sửa được trước khi thành kết quả · KS2 cùng đầu vào ra cùng kết quả
(hiện seed) · KS3 duyệt TỪNG PHẦN không duyệt cả gói · KS4 lùi được, nói rõ lùi về đâu ·
KS5 máy nói được vì sao nó đề xuất vậy

CHỐNG QUÊN: phần chưa làm được thì vẽ ô/nút disabled KÈM LÝ DO tại chỗ.
CẤM nút giả bấm không ra gì. Ô trống là bằng chứng còn việc.

Xuất: mỗi màn MỘT file HTML tự chứa. Chỉ vẽ đúng số màn tôi giao mỗi đợt, xong thì DỪNG.
Trả lời "đã nắm" rồi chờ đợt 1.
```

---

## ĐỢT 1 — trục thời gian (2 màn, **0 code, vẽ mới hoàn toàn**)

```
ĐỢT 1 — vẽ 2 màn, xong thì dừng.

1. GANTT / TIẾN ĐỘ
   Trục thời gian ngang, việc là thanh ngang. Có: nhóm theo dự án hoặc theo người ·
   đường phụ thuộc giữa việc · ĐƯỜNG GĂNG làm nổi · mốc giao khách · vạch "hôm nay" ·
   phóng to/thu nhỏ theo ngày/tuần/tháng · việc trễ hạn nhận biết được ngay.

   HIỆU ỨNG ÁNH SÁNG — ánh sáng là THÔNG TIN, không phải trang trí:
   - animate `stroke-dashoffset` trên SVG path (KHÔNG animate opacity — luật G1)
   - chỉ chạy 3 chỗ: đường phụ thuộc TRÊN ĐƯỜNG GĂNG (chu kỳ ~2,5s) ·
     thanh việc ĐANG LÀM (dải sáng quét trong thanh, ~3s) ·
     mốc giao khách trong 7 ngày tới (thở nhẹ, dùng scale/độ sáng)
   - TĨNH hoàn toàn: việc đã xong · việc chưa tới · đường phụ thuộc ngoài đường găng
   - gộp các đường cùng loại vào MỘT <path> (vài trăm thanh mà mỗi đường một phần tử
     animate là giật — số đo thật trong dự án: gộp 1 path thì dư sức, tách ra là biên ~31fps)
   - @media (prefers-reduced-motion: reduce) ⇒ tắt hết, hiện trạng thái tĩnh
   - có công tắc tắt hiệu ứng ngay trong màn

2. LỊCH / NHẮC VIỆC
   Lịch tháng + tuần. Việc đến hạn hiện trên ô ngày. Nhắc trước hạn.
   Lọc theo dự án và theo người. Việc quá hạn nổi rõ.
   (Dữ liệu việc + hạn đã có ở tầng dưới — màn này chưa từng được vẽ.)
```

---

## ĐỢT 2 — cộng tác (2 màn, **0 code thật, vẽ mới**)

```
ĐỢT 2 — vẽ 2 màn, xong thì dừng.

3. CHAT NHÓM / CỘNG TÁC
   Luồng tin nhắn theo dự án. Đính bản vẽ/ảnh, xem trước ngay trong luồng. Nhắc tên người.
   Ghim tin quan trọng. Tìm trong luồng.
   PHẦN NHIỀU NGƯỜI (đã chốt là CÓ — nền Yjs, thời gian thực):
   - con trỏ người khác trên màn, kèm tên
   - "ai đang mở màn này" — dãy avatar
   - cảnh báo khi 2 người sửa cùng một chỗ, kèm cách xử (giữ bản ai / gộp)
   - trạng thái kết nối: đang đồng bộ / mất mạng, đang làm việc ngoại tuyến / đã đồng bộ xong

4. KNOWLEDGE BASE — kho tri thức studio
   Danh mục theo chủ đề. Tìm theo ngữ nghĩa (hỏi bằng câu tự nhiên, không phải từ khoá).
   Mỗi mẩu tri thức: nguồn · ngày · ai thêm · dự án liên quan.
   Nối sang Notebook (Notebook = nguồn cho một dự án; Knowledge = tri thức dùng chung).
```

---

## ĐỢT 3 — vẽ VỎ cho ruột đã có (2 màn)

```
ĐỢT 3 — vẽ 2 màn, xong thì dừng.
⚠️ HAI MÀN NÀY ĐÃ CÓ CODE CHẠY THẬT. KHÔNG vẽ lại từ đầu, KHÔNG đổi cấu trúc —
   chỉ nâng cấp hình thức và bổ sung phần còn trống.

5. BẢNG VIỆC (Kanban)  — đã có: 3 cột theo trạng thái, thẻ việc, lọc theo dự án/người
   → giữ cấu trúc đó. BỔ SUNG:
     - kéo-thả đổi trạng thái (nay chỉ xem được, không sửa được)
     - trạng thái đồng bộ: "đang đồng bộ" / "lệch nguồn" / "đã đồng bộ"
     - theo luật G8: kéo-thả không được là đường duy nhất — thêm nút đổi trạng thái trên thẻ

6. TỔNG QUAN DỰ ÁN     — đã có: thẻ số liệu, danh sách dự án, thanh tab
   → giữ cấu trúc tab. Nâng hình thức. Đây là màn TỔNG QUAN nên được dùng bento (luật G7).
```

---

## ĐỢT 4 — vẽ VỎ (2 màn)

```
ĐỢT 4 — vẽ 2 màn, xong thì dừng.
⚠️ CẢ HAI ĐÃ CÓ CODE CHẠY THẬT — vẽ vỏ, giữ luồng hiện tại.

7. VITALS — trợ lý AI của app. Đã có: bong bóng chat, huy hiệu trạng thái.
   → vẽ vỏ. Giữ tên "Vitals". Áp đủ KS1–KS5: mọi đề xuất của Vitals phải xem trước được,
     duyệt từng phần được, lùi được, và nói được vì sao.

8. NOTEBOOK — sổ nguồn của MỘT dự án. Đã có: danh sách nguồn tài liệu + chat hỏi trên nguồn.
   → vẽ vỏ. Mỗi câu trả lời phải trỏ được về nguồn nào, đoạn nào (KS5).
```

---

## ĐỢT 5 — cụm khách (3 màn, đóng vòng thiết kế → khách)

```
ĐỢT 5 — vẽ 3 màn, xong thì dừng.

9.  KHÁCH DUYỆT HỒ SƠ — màn cho KHÁCH xem, không phải cho studio.
    Đã có mảnh: trang chia sẻ bằng link, ô duyệt trong bảng món.
    → vẽ màn duyệt: xem hồ sơ theo tờ · duyệt/từ chối TỪNG PHẦN (luật KS3, cấm duyệt cả gói) ·
      ghi chú đính vào đúng chỗ trên bản vẽ · trạng thái tổng "còn N mục chờ".
    Giao diện cho khách: gọn, ít jargon, không cần biết CAD.

10. BÁO GIÁ TỪ BẢNG KHỐI LƯỢNG — đã có code: bảng khối lượng, công thức, thêm cột.
    → giữ cấu trúc. BỔ SUNG: cột số lượng đếm (cái/bộ, nay chỉ có m²) · cột ảnh món ·
      truy vết số nào do máy tính, số nào sửa tay · xuất báo giá gửi khách.

11. PHIÊN BẢN HỒ SƠ — 0 code, 0 mock, vẽ mới hoàn toàn.
    So trước–sau bản vẽ (chỉ rõ chỗ vừa đổi) · đóng dấu bản phát hành ·
    lịch sử phát hành cho khách · ghi chú mỗi bản · phát hành lại.
```

---

## ✔ Xong cả loạt khi
11 file HTML, mỗi màn một file, mở bằng trình duyệt không lỗi và không còn ký tự lạ.

## Vì sao lượt trước hư — ghi để không lặp (HG6)
Khối ① cũ nhét **cả 11 màn + toàn bộ luật** vào một prompt. Câu *"chia đợt ≤4 màn"* có, nhưng nằm
ở **dòng cuối** nên bị nuốt cùng phần còn lại — model vẽ liền một mạch, tới màn thứ 5 thì hỏng và
bắt đầu quay vòng "xoá ký tự lạ ×2".
⇒ **Chia đợt không phải một câu dặn trong prompt. Chia đợt là chia PROMPT.**
Đây đúng §0m, ca bệnh gốc là `VE-block` 05/08 (vẽ liền mạch 8 block, ra ba cái mặt cười).
