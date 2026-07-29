# SPEC — VITALS: VAI TRÒ · GIAO DIỆN · NGỮ CẢNH

> **[CẦN HOÀ DUYỆT]** · Bổ sung cho `SPEC-VITALS-AI.md` (đã có phần "hai trợ lý một não").
> File này chốt 3 thứ chưa rõ: **làm gì · trông thế nào · hiện khi nào**.
> Đọc cùng `SPEC-NAVIGATION-MODEL.md` §2 (status bar), `SPEC-KNOWLEDGE-BASE.md` (luật trích dẫn).

---

## 1. VAI TRÒ — ba việc, không hơn

| Vai | Làm gì | Ví dụ | Trạng thái |
|---|---|---|---|
| **① Tra cứu có nguồn** | Trả lời từ tri thức đã tra, KÈM TRÍCH DẪN | "Hành lang thoát nạn tối thiểu?" → số + điều khoản, click ra trang gốc | 🟡 có API, thiếu trích dẫn |
| **② Dẫn đường** | Biết đang ở đâu, thiếu gì, bước kế là gì | "Phòng ngủ chưa có vật liệu sàn" | ⬜ |
| **③ Làm thay việc lặp** | Gọi hàm app thực thi | "Tô sàn phòng ngủ gỗ sồi" → `applyMaterial()` | 🔴 chưa làm được |

⚠️ **Vai ③ phụ thuộc tầng năng lực** (hàm có tên) chưa dựng.
Đúng luật 7 blueprint: **năng lực → nút → AI gọi hàm**. Không đảo thứ tự.

**KHÔNG phải vai của Vitals**: tán gẫu · viết văn dài · sáng tác tự do ·
**thay người quyết định thẩm mỹ**.

## 2. GIAO DIỆN — ba hình dạng, MỘT trợ lý

| Hình dạng | Khi nào | Trông thế nào |
|---|---|---|
| **A · Nhúm** *(dot)* | Mặc định | Icon nhỏ trong **status bar**. Có gợi ý mới → chấm sáng nhẹ |
| **B · Dải** *(bar)* | Rê chuột vào (delay 150ms) / ⌘J / kéo xuống trên cảm ứng | Nở ngang thành ô nhập + **2–3 gợi ý theo ngữ cảnh** |
| **C · Tấm** *(panel)* | Việc dài: đọc brief, tra nhiều nguồn | Panel bên phải, có lịch sử hội thoại + dẫn chứng |

Ba hình dạng **nở dần theo nhu cầu** — không phải ba tính năng.
⚠️ **KHÔNG BAO GIỜ** có cửa sổ nổi che canvas.
⚠️ Ẩn hoàn toàn khi Trình chiếu toàn màn hình.

## 3. NGỮ CẢNH — hiện gì tuỳ ĐANG CHỌN CÁI GÌ

> Hiện Vitals mới **stage-aware** (biết chặng), chưa **selection-aware** (biết đối tượng).
> Đây là phần đáng giá nhất còn thiếu.

| Đang chọn gì | Gợi ý sẵn (2–3 nút bấm) |
|---|---|
| CAD · một phòng | Kiểm quy chuẩn phòng này · Gợi ý bố trí · Tính diện tích/lux |
| CAD · một tường | Loại tường? · Vật liệu ốp · Kiểm chiều dày |
| CAD · không chọn gì | Kiểm cả bản vẽ · Đọc brief · Còn thiếu gì |
| Render · một ảnh | Sửa mảng nào? · Đổi ánh sáng · Đọc gu từ ảnh này |
| Render · một thẻ việc | Thẻ này làm gì · Chỉnh núm sao cho đẹp |
| Present · một slide | Viết lại nội dung · Đổi bố cục · Kiểm số liệu khớp CAD |
| Ý tưởng · moodboard | Chấm gu 10 trục · Từ khoá EN để tra tiếp |
| Thư viện · một vật liệu | Còn hàng? giá? · Dùng ở đâu trong dự án · Vật liệu tương tự |

⭐ **LUẬT**: gợi ý là **NÚT BẤM SẴN**, không phải chữ mời chào.
Người dùng bấm một cái là chạy — **không phải nghĩ ra câu hỏi**.

### Payload cần bổ sung
Hiện gửi `{messages, stage, brand}`. Cần thêm:
`{selection: {type, id, props}}` — type: room/wall/image/slide/tool/material · props: thuộc tính
chính của đối tượng (diện tích, vật liệu, kích thước…).

## 4. BA LUẬT CHỐNG PHIỀN TOÁI

1. **Không bao giờ tự bật** — chỉ nhấp nháy nhẹ ở status bar khi có gợi ý đáng giá
   (vi phạm quy chuẩn · thiếu dữ liệu bắt buộc). Không popup, không chặn.
2. **Không biết thì nói không biết** + chỉ đường ("phần đó nằm ở ArchiNote").
3. **Mọi con số phải có trích dẫn** — không nguồn thì **không nêu số**
   (`SPEC-KNOWLEDGE-BASE.md` luật vàng).

## 5. THỨ TỰ LÀM

| # | Việc | Ước lượng |
|---|---|---|
| 1 | Vitals vào **status bar** (hình dạng A + B), bỏ nút nổi trên canvas | NHỎ |
| 2 | Gợi ý theo chặng (đã có stage) — 3 nút sẵn mỗi chặng | NHỎ |
| 3 | **selection-aware**: thêm `selection` vào payload + gợi ý theo đối tượng | VỪA |
| 4 | Trích dẫn nguồn trong câu trả lời | VỪA |
| 5 | Hình dạng C (panel) cho việc dài: đọc brief | VỪA |
| 6 | Vai ③ function-calling | LỚN — **chờ tầng năng lực** |

---

*v1.0 · 2026-07-28 · Ben soạn theo yêu cầu Hoà.*
