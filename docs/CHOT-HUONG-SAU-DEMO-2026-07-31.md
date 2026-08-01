# Chốt hướng sau buổi thử CAD — 31/07/2026

> Hoà nêu **2 điểm** sau buổi thử. Tài liệu này chuyển 2 điểm đó thành hàng đợi có thứ tự,
> cộng với bằng chứng đã khám được trong ngày.

---

## 1 · Hai điểm Hoà nêu

**① Giao diện cần nghiên cứu đúng thói quen designer. Chốt giao diện + nền trước, đừng sửa đi
sửa lại, sau đó mới chuốt tính năng.**

**② Chữ chú thích không đại chúng, khó hiểu, không thân thiện. Nền cơ bản còn thiếu nhiều so với
app đối thủ ⇒ vừa thấy THUA vừa thấy THỪA. Nền phải bằng "app khá" trước, rồi mới lai tính trạng
trội lên làm upgrade.**

---

## 2 · Bằng chứng — cái gây sửa lại là gì

Chỉ trong một ngày:

| Thứ | Số lần làm lại |
|---|---|
| Tràn headbar | **3** — `2.2.60` → `7.3.31` → `7.3.32` |
| Chỉ báo "đã lưu" | **2** — 28/07, rồi 31/07 |
| Đóng popover | mỗi chỗ tự viết ⇒ đẻ nợ `2.2.90` |
| Mặt tiền thư viện | **5** cho cùng một việc |
| Cỡ chữ | 46 tệp, không có chuẩn |
| Preflight | **2 bộ** song song, không biết nhau |

**Không cái nào sai vì thiếu nghiên cứu thói quen.** Chúng sai vì **không có tầng nguyên liệu dùng
chung**. Nghiên cứu quyết định **sắp xếp**; tầng nguyên liệu quyết định **có phải làm lại không**.

### Bằng chứng cho điểm ②

| Phím | Chặng 3 · Present | Chặng 1 · CAD |
|---|---|---|
| ⌘Z ⌘Y ⌘C ⌘V | ✅ | ✅ |
| ⌘A chọn tất cả | ✅ | ❌ |
| ⌘D nhân bản | ✅ | ❌ |
| ⌘= phóng to | ✅ | ❌ |
| ⌘S lưu | — | ✅ *(mới có 31/07)* |
| **Bảng tra phím tắt** | ❌ | ❌ — **cả app không có** |

Trình soạn slide có ⌘A/⌘D; trình CAD thì không — trong khi CAD mới là nơi cần nhất.

### Bằng chứng cho "chữ không đại chúng"

Nguyên văn trên spec sheet:
- *"Tỉ lệ rộng/cao **khung bao mặt nạ** × cao chuẩn nghề"* — `khung bao mặt nạ` = mask bounding box
- *"**Tầng 2 · oneAI · Bậc 2** · độ tin 65%"* — hai hệ số khác nhau đặt cạnh nhau, không ai đoán được
- Nhãn `ĐO` / `SUY` — viết tắt không giải thích

**Gốc:** chữ đang mô tả **máy tính thế nào**, trong khi người dùng cần biết **tin bao nhiêu, giờ làm gì**.

**Luật:** chữ trên màn hình trả lời *"giờ tôi làm gì?"*. Cách tính giấu sau nút **"Chi tiết"**.

| Đang có | Nên là |
|---|---|
| `1274 ± 255 mm 🟢 ĐO` | `≈ 1,27 m — **ước lượng thô**, sai số tới ±25 cm` |
| `Tỉ lệ rộng/cao khung bao mặt nạ × cao chuẩn nghề` | `Suy từ tỉ lệ ảnh + chiều cao chuẩn của loại đồ này` |
| `Tầng 2 · oneAI · Bậc 2 · độ tin 65%` | *(giấu sau "Chi tiết")* |

---

## 3 · Thứ tự chốt

| | Việc | Vì sao ở vị trí này |
|---|---|---|
| **P0** | **Hợp đồng nền trong code** — thang cỡ chữ · thang khoảng cách · mốc breakpoint · 4 nguyên liệu dùng chung (`Popover`·`Menu`·`Panel`·`Toolbar`). Hạt giống đã có: `2.2.90` `useDismissable` | Đây là thứ **chặn** việc làm lại. Không có nó thì mọi bản thiết kế đều rò rỉ |
| **P1** | **Bảng KIỂM NỀN** — liệt kê thứ mọi app desktop tử tế đều có (giao của AutoCAD · SketchUp · Rhino · Figma), đối chiếu IF, ra danh sách thiếu | Chính là hàng đợi "base" của Hoà. **Không cần code, không cần chờ ai** |
| **P2** | **Chốt lớp lưu trữ** — NT5 cây thư mục + model Thư viện D | `SPEC-THU-VIEN-D` đã ghi *"chỉ động vào lớp lưu trữ MỘT lần"*. Chưa chốt mà làm tính năng = tự hẹn ngày đập |
| **P3** | **Nghiên cứu thói quen** → quyết sắp xếp **riêng từng chặng** | Sau P0 thì đổi sắp xếp rẻ — đổi bố cục, không đổi nguyên liệu |
| **P4** | Chuốt tính năng: sửa "Đo món đồ" · BOQ ĐỢT 3 · IF2 | Cuối, đúng ý Hoà |

### Ghi chú P3 — hai nền văn hoá công cụ

IF trải **ba chặng thuộc hai văn hoá khác nhau**:
- **CAD** — dân AutoCAD/Rhino: bàn phím trước, dòng lệnh, chuột phải lặp lệnh, thanh trạng thái luôn hiện, bảng công cụ neo cứng
- **Render · Present** — dân Figma/Keynote: canvas trống, panel nổi, phải = thuộc tính, trái = lớp

Ép **một bộ chrome** cho cả ba là một phần lý do thấy "kì kì". Lời giải: **nguyên liệu dùng chung,
sắp xếp khác nhau theo chặng** — chính là thứ P0 mở đường cho.

Có sẵn phương pháp để mượn: `DESIGNSYSTEM-6.md` + `tokens-1.ts` của SyncWork.
**Lấy cách làm, KHÔNG lấy token** — IF là desktop/CAD, khác hệ với mobile app.

### ⚠️ Hệ quả phải nói thẳng

Chốt thứ tự này nghĩa là **BOQ · IF2/BIM · Đo món đồ lùi lại**. Đó là những thứ hay nhất, và cũng
là thứ dễ làm quên rằng CAD chưa có ⌘A.

---

## 4 · Còn treo — không thuộc P0–P4, đừng để mục ruỗng

| Việc | Ai làm | Mức |
|---|---|---|
| ⚠️ **ATLAS vẫn "ai có link cũng SỬA"** trên 1.449 dòng có giá | **Hoà bấm** — Claude web đã dừng đúng chỗ chờ | 🔴 gấp |
| ATLAS mời app — **hướng C**, chuyển Base ra Drive | Hoà bấm | 🟠 |
| Chép `knowledge/designStandards.ts` từ Flow | Claude web | 🟠 quý |
| Đổ phản hồi buổi thử vào `PHAN-HOI-THU-CAD-2026-07-31.md` | Hoà | 🟡 |
| `2.2.90` `useDismissable` | Claude Code | 🟡 = hạt giống P0 |

---

*Cowork, 31/07/2026. Ghi sau buổi thử CAD trên LAN. Quyết định gốc: 2 điểm Hoà nêu, nguyên văn ở §1.*
