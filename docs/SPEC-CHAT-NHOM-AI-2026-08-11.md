# SPEC — CHAT NHÓM + AI THAM VẤN (id: chat-ai-notebook)

> Hoà đặt bài trực tiếp 11/08 đêm. Khuôn PHIẾU 5 Ô (`docs/PHIEU-CHONG-RUI-RO-5-CHU-DE.md`).
> Mock hợp đồng: `docs/mocks/mock-chat-nhom-ai-2026-08-11.html`. KHÔNG mô tả thuật toán.
> Kế thừa `CHOT-VITALS-LM-CHAT-2026-08-02` (AI riêng + @AI trong nhóm) — spec này là mặt
> "trong nhóm" đặt vào bố cục 3 cột kiểu NotebookLM. Nối phiếu 5 Collaborate (chat-project).

## ① ĐỊNH NGHĨA KHOÁ (đổi phải ghi 00-CHOT)
Kênh chat của MỘT dự án, ba cột cùng nhìn một sự thật: TRÁI = nguồn người chọn cho AI đọc ·
GIỮA = người nói chuyện với người, AI chỉ nói khi được gọi `@Vitals` · PHẢI = "Chưng cất":
AI gom điểm chính/việc/quyết định thành NHÁP, người duyệt mới thành thật. AI không giả người
(glyph Vitals + viền accent, không avatar robot), trả lời luôn trích nguồn. Toggle "AI tham
vấn" TẮT = AI im hoàn toàn, kể cả khi bị gọi.

## ② TIÊU CHÍ 4 TRỤC
- **Công năng** — [ ] gọi `@Vitals` trong luồng nhóm, trả lời tại chỗ, cả nhóm thấy ·
  [ ] tick/bỏ tick nguồn đổi ngay phạm vi AI đọc, đếm "n/m nguồn" đúng · [ ] thả tệp DWG vào
  chat ra card tiến độ %, xong đổi thành card kết quả (số tường·phòng) + nút mở đúng chặng
  Thiết kế 2D · [ ] toggle AI TẮT thì gọi @Vitals không có trả lời, chỉ hiện nhắc 1 dòng ·
  [ ] tick việc ở Chưng cất tạo việc thật kèm đoạn chat làm ngữ cảnh.
- **Thẩm mỹ** — [ ] tin AI nhận ra trong 1 giây (glyph + viền accent nhạt) nhưng không át tin
  người · [ ] avatar online MÀU / offline grayscale đúng trạng thái thật · [ ] dải đang họp
  chỉ là 1 thanh mỏng, không chiếm màn.
- **Sáng tạo** — [ ] Chưng cất bám ngữ cảnh buổi nói chuyện (điểm chính · việc · quyết định),
  không phải log máy · [ ] trích nguồn bấm được, nhảy về đúng tài liệu.
- **Ấn tượng** — [ ] demo 30 giây: thả DWG → card % chạy → "42 tường · 12 phòng" → hỏi
  @Vitals một số đo → trả lời có nguồn → quyết định hiện bên Chưng cất chờ duyệt.

## ③ KỊCH BẢN NGHIỆM THU (làm theo trên app thật)
9h, Linh thả `hien-trang.dwg` vào kênh dự án → card tiến độ chạy đến 100%, đổi thành
"Đã trích 42 tường · 12 phòng" → Nam bấm "Mở trong Thiết kế 2D" thấy đúng bản vẽ. Nam gõ
`@Vitals lối đi đảo bếp còn đạt chuẩn không?` → Vitals trả lời kèm 2 chip nguồn (bản vẽ +
sổ chốt), bấm chip mở đúng tài liệu. Hoà nhắn "chốt dời đảo bếp 20" → panel Chưng cất hiện
quyết định nháp ghi rõ gom từ đoạn nào → Hoà bấm "Ghi vào sổ chốt" mới thành quyết định thật.
Tắt toggle "AI tham vấn" → gọi @Vitals lần nữa: im lặng, một dòng nhắc "AI đang tắt ở kênh này".

## ④ TUẦN TỰ BƯỚC
mở kênh dự án → (tuỳ chọn) chỉnh nguồn cho AI → trò chuyện/thả tệp → gọi @Vitals khi cần →
AI trả lời có nguồn → Chưng cất gom nháp chạy nền → người tick việc/duyệt quyết định →
việc vào tiến độ, quyết định vào sổ chốt → lịch sử kênh giữ nguyên vết.

## ⑤ DÂY MÁY
`chat-ai-notebook` (phiếu này) · nối: `chat-project` (phiếu 5 Collaborate) ·
`smart-ingest` (trích DWG → card kết quả) · `task-context` (tick việc từ Chưng cất).
Đăng ký id mới vào frontier-registry khi mở phiếu code.

## Ranh giới v1 (nói thẳng, không hứa quá)
- Panel họp CHỈ là dải trạng thái thu nhỏ (avatar · thời lượng · chấm đỏ ghi âm · nút Vào họp).
  Màn video call đầy đủ NGOÀI PHẠM VI phiếu này.
- Chưng cất là NHÁP của AI — không tự ghi sổ chốt, không tự tạo việc; người duyệt từng mục
  (luật human-in-loop 07/08 §7, KS3/KS4).
- Nền tảng thật hiện CHƯA có chat theo dự án (phiếu 5 đã nói thẳng) — đây là phiếu XÂY,
  mock là hợp đồng giao diện, không phải lời hứa Đợt 1.

---
*COWORK-UI lập 11/08/2026 theo đặt bài Hoà. Append-only.*
