# SPEC — ĐỀ BÀI → PHƯƠNG ÁN *(brief intake)*

> **[CẦN HOÀ DUYỆT]** · Thay thế tính năng "AI mô tả – Đề bài chi tiết" hiện tại ở chặng CAD.
> Đọc cùng `SPEC-KNOWLEDGE-BASE.md` (luật trích dẫn), `SPEC-SEMANTIC-MODEL.md`.

---

## 1. Vì sao phải nâng cấp

Panel hiện tại **tự khai**: *"RULE-BASED (từ khoá), chưa phải LLM — ghi rõ từng phòng theo mẫu
phòng X AxB"*. Nhưng brief thật của dự án lớn là **PDF 20–50 trang**, không phải một dòng gõ tay.
⇒ Mức hiện tại **chưa đủ tầm công ty thiết kế hàng đầu**.

### Đổi tên — tên phải nói VIỆC, không nói công nghệ
| Bỏ | Thay bằng |
|---|---|
| "AI mô tả – Đề bài chi tiết" | **"Đề bài → Phương án"** · "Brief & Bố trí" · "Nhận đề bài" |

## 2. Luồng đúng

```
① Nạp hiện trạng   → DXF/DWG · bản vẽ đang mở
② Nạp BRIEF THẬT   → PDF · Word · email · dán text · ảnh chụp  (KHÔNG phải gõ 1 dòng)
③ Máy đọc + trích  → phiếu có cấu trúc, rồi HỎI LẠI chỗ thiếu
④ Chọn loại hình + ĐƠN VỊ VẬN HÀNH → nạp bộ chuẩn tương ứng   ⭐ moat
⑤ Sinh N phương án — mỗi phương án KÈM CĂN CỨ + cảnh báo vi phạm
⑥ Chọn 1 → máy học (Perceptron đã có)
```

**Bước ③** đúng luật human-in-the-loop (blueprint luật 6): *"Brief không nói số ghế nhà hàng —
anh muốn bao nhiêu?"* — hỏi chỗ thiếu, không đoán bừa.

**Bước ⑤** đúng luật 6b: đề xuất **NHIỀU** phương án, không đề xuất một.

## 3. ⭐ Bước ④ — CHUẨN VẬN HÀNH THƯƠNG HIỆU (moat mạnh nhất phân khúc dự án lớn)

KTS làm khách sạn **bắt buộc** tuân thủ *brand standards* của đơn vị vận hành.

| Loại hình | Bộ chuẩn đối chiếu |
|---|---|
| **Khách sạn / resort** | Accor · Marriott · Hilton · IHG · Aman — brand design standards · FF&E spec · diện tích phòng tối thiểu · BOH ratio |
| Văn phòng | Diện tích/người · WELL · LEED · chuẩn cho thuê |
| Bệnh viện | QCVN · tiêu chuẩn khoa phòng · luồng sạch–bẩn |
| Bán lẻ · F&B | Chuẩn thương hiệu · luồng khách ≠ luồng BOH |
| Nhà ở | Neufert · QCVN 04 |

**Giá trị thật**: hiện KTS phải tự nhớ hoặc lật tài liệu tay. IF đối chiếu tự động và cảnh báo
**ngay lúc bố trí** — *"Accor yêu cầu hành lang BOH ≥1.8m, hiện 1.5m"*.
⇒ **Không app nào trên thế giới có**, vì không app nào ngồi cùng chỗ với cả bản vẽ lẫn bộ chuẩn.

### ⚠️ LUẬT BẢN QUYỀN — cứng
Brand standards của Accor/Marriott/Hilton là **tài liệu MẬT cấp cho đối tác**.
**TUYỆT ĐỐI KHÔNG ship trong app.** Áp đúng luật kệ sách (`SPEC-KNOWLEDGE-BASE.md` §5):
> **App là TỦ RỖNG — studio tự nạp bộ chuẩn mình được cấp.** Tenant nào có tài liệu, tenant đó dùng.

### Luật trích dẫn
Mỗi gợi ý bố trí phải **kèm căn cứ** (điều khoản nào, trang nào, hạng nguồn A–D).
Không có trích dẫn thì **không nêu con số** — cùng luật với quy chuẩn.

## 4. Phân bậc

| Bậc | Nội dung |
|---|---|
| **N** | Nạp brief (PDF/text) → trích phiếu có cấu trúc → hỏi lại chỗ thiếu → sinh 3 phương án bố trí |
| **P** | Chọn loại hình → nạp bộ chuẩn tenant → đối chiếu + cảnh báo vi phạm có trích dẫn |
| **L** | Phương án kèm **điểm hợp gu** (10 trục) + **điểm tuân thủ chuẩn** · học từ phương án được chọn |

## 5. Thứ tự
1. Thay parser rule-based bằng LLM đọc brief thật (rẻ — chỉ đổi tầng đọc)
2. Phiếu brief có cấu trúc + hỏi lại chỗ thiếu
3. Nạp bộ chuẩn của tenant (hạ tầng kệ sách đã có)
4. Đối chiếu + cảnh báo có trích dẫn (nối standards checker sẵn có)

---

*v1.0 · 2026-07-26 · Ben soạn theo ý Hoà.*
