# BÀN GIAO — phiên T 17/08 (chiều/tối), đợt BÀN GIAO DIỆN + GALLERY

> Đọc kèm: `docs/TAC-NHAN-T.md` (vai) · `docs/TONG-HOP-GALLERY-2026-08-17.md` (bảng đầy đủ) ·
> `docs/nc/NC-BAN-GIAO-NGHIEN-CUU-2026-08-16.md` (nguồn tra + phép đo).
> Phiên này **bàn nhiều, code ít** — sản phẩm là **chốt + bảng tình trạng**, chưa build gì.

---

## §1 · CHỐT MỚI TRONG LƯỢT NÀY

**Khuôn tổng hợp** (`TAC-NHAN-T.md §2⑥`) — bàn xong chủ đề nào phải ra bảng **đã có nền chưa · xịn
hay dỏm · dỏm thì build lại**, rồi mô tả giao diện + minh hoạ → đưa Claude Design dựng.
**Không có bảng này thì chưa gọi là bàn xong.**

**Tác nhân T được chưng cất thành văn bản** — 6 phẩm chất · 5 bước khi Hoà hỏi · giọng · nói chuyện
bằng hình · ranh giới quyền · 4 thói quen chống lỗi · 7 câu tự vấn.

**Gallery hai dạng, hai tên**: **Gallery** = kho tuyển liên ngành có nguồn · **Bảng ý tưởng** = chỗ
Hoà gom. ⛔ Không dùng *My Collection* — xoá mất phần "tuyển có nguồn", chỗ Gallery hơn Pinterest.

**Nhãn trên thẻ ảnh** — chỉ **một** nhãn đứng trên ảnh, còn lại xuống dải dưới hoặc hiện khi trỏ ·
nhãn là **lớp phủ chuyển sắc ở mép**, không phải chip đục dán lên · ambient **0,54 tại chân chữ**,
hơn là bẩn ảnh · dấu *máy-suy* nằm ở **chất chữ** (nghiêng/nhạt), không thêm vật thể.

**Auto phân loại — 5 bậc rẻ trước**: ①nhãn có sẵn từ nguồn ②từ điển nghề trên mô tả ③màu ④**học từ
bảng Hoà gom + tim** ⑤nhìn ảnh (hoãn).
⭐ Bậc 4 **rẻ hơn bậc 5 mà giá trị cao hơn** — nhãn nguồn trả lời *"đây là văn phòng"*, không trả lời
*"đây có hợp gu tôi không"*.

**Thẻ todo**: tia sáng ngang cắt task = **thanh tiến trình đổi hình dạng** (vị trí trên danh sách thay
vì %). Lật 3D hợp lệ **chỉ khi** chiều sâu = *còn bảng khác phía sau*.

---

## §2 · ĐO ĐƯỢC — dùng lại, không đo lại

| Mảnh | Kết quả |
|---|---|
| `lib/distill/` máy chưng cất | ✅ xịn, chạy thật ở Thẻ DNA + Grounded Render |
| `lib/gu/` máy học gu | ✅ xịn, cắm thật 4 nơi (`GuModelSettings` · `LayoutShelf` · `PresentEditor` · `AiBriefPanel`) |
| `ai.upscale` | ✅ xịn, ESRGAN đủ 300dpi |
| `lib/ui/tien-trinh.ts` + `LightBar` | ✅ xịn, có kiểu *không đo được*, cấm bịa % |
| Gallery ↔ máy chưng cất | ❌ grep = **0** |
| Tim ảnh | ❌ grep = **0** |
| `lib/ref-search.ts` | ⚠️ **dỏm cho phân loại nội dung** — tự khai *"lexical thuần, KHÔNG embedding, KHÔNG AI"* |
| Núm mức bám per-mảng | ⚠️ **dỏm** — code tự khai *"truyền mù là giả điều khiển"* |
| **`ChatMessage`** | 🔴 **dỏm nặng** — chỉ `userId · text · createdAt`; **không `projectId`, không luồng, không đính kèm** |
| Màn chat nhóm | ❌ **0 file** |
| `NotebookSource` / `NotebookChunk` | ⚠️ **máy xịn, kho RỖNG — 0 bản ghi** |

---

## §3 · 🔴 SÁU CẢNH BÁO CHO PHIÊN SAU

**① Chat nhóm phải sửa NỀN DỮ LIỆU trước.** `ChatMessage` không biết tin nhắn thuộc dự án nào —
mâu thuẫn này sổ ghi từ **08/08 và chưa ai xử**. Nối tay vào là xây trên cát.

**② Video call — chốt 11/08 nói KHÔNG tự xây.** WebRTC + máy chủ trung chuyển là hạ tầng nặng,
không phải lõi IF. Giá trị nằm ở **phần SAU cuộc gọi**: biên bản → việc → phiếu sửa gắn đúng đối
tượng. Phiên sau đừng nhận nhầm thành việc xây engine.

**③ Kho tri thức RỖNG.** Mọi tính năng kiểu NotebookLM đang là **máy chạy không tải**. Việc thật là
**có thứ để nạp**, không phải xây máy. Chat nhóm chính là cửa nạp.

**④ ArchDaily và OfficeSnapshots có bản quyền** — không có API cho dùng lại. Đường hợp pháp:
**liên kết, không sao chép**; ghi ranh giới vào `LICENSE-NOTES.md`. Chỉ **Unsplash** lấy được ảnh thật.
Đúng bài học đã trả giá với thư viện DWG.

**⑤ Học gu làm sớm là học từ số không.** Bậc 4 cần dữ liệu từ việc Hoà dùng bậc 1–3 một thời gian.

**⑥ Todo list — T KHÔNG đoán.** Chưa rõ nó là *các bước con trong một việc* hay *danh sách việc rời*.
Hai cách đọc ra hai thứ khác hẳn. **Hỏi Hoà trước khi dựng.**

---

## §4 · CÒN CHỜ HOÀ

1. **Duyệt mắt** — nút thắt lớn nhất, vẫn ~1 việc qua mắt trên hơn 70 việc xong-máy
2. Chọn màu **mòng két ↔ mận** — ⛔ **cấm thi công gì dính `--accent*`** cho tới khi chốt
3. Duyệt **§4 thứ tự Gallery** trong `TONG-HOP-GALLERY-2026-08-17.md`
4. Chốt **§3 giấy phép** — có chấp nhận hai nguồn chỉ-liên-kết không
5. Trả lời câu **todo list** ở cảnh báo ⑥
6. Duyệt mô tả giao diện Gallery §2 → T đưa Claude Design dựng

---

## §5 · MỘT THỨ MỚI DÙNG ĐƯỢC

**Pinterest vào được** trong trình duyệt của app, sau khi Hoà đăng nhập — T tìm và đọc ảnh trực tiếp,
không cần Hoà dán link. Kết quả tìm thử đã cho một điểm: dashboard tối dùng **mòng két** ra sạch và
có sinh khí, không xỉn — đúng lo ngại khi bỏ vàng.

**Ba phiên Claude khác đang mở trên máy** (`ListAgents`) — nhắn thẳng được bằng tên.
⚠️ Nhưng **quyền không đi kèm tin nhắn**: việc phiên này bị chặn thì không nhờ phiên khác chạy hộ.
