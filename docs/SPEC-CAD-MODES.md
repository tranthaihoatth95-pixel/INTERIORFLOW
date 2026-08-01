# SPEC — CAD HAI CHẾ ĐỘ *(Sketch ↔ Pro)*

> **Đã duyệt (Hoà, 01/08).** Chẩn đoán 26/07: giao diện Sketch và Pro hiện **chỉ khác số lượng icon**
> — đó là **phân biệt giả**. Bằng chứng: đưa bản Sketch hiện tại lên iPad vẫn không dùng được
> (nút nhỏ như cho chuột, không cử chỉ, không nhận bút).
> Đọc cùng `IF-FEATURE-SPEC-P1-v2.md` (⚠️ FILE KHÔNG CÓ TRONG REPO — cần Hoà upload lại nếu còn
> cần, xem `docs/IF-ARCHITECTURE-BLUEPRINT-v1.md` §9), `SPEC-UI-SHELL.md`.

---

## 1. Nguyên tắc gốc: **hai chế độ, một dữ liệu**

```
             .idf (một nguồn duy nhất)
                 ↕            ↕
          Sketch mode    Pro mode
       (tablet, nhanh)  (máy, chuẩn)
```

Chuyển qua lại bất kỳ lúc nào, **không mất gì**. Vẽ phác trên iPad ở công trường → về máy mở Pro
hoàn thiện thành hồ sơ. *Đó* mới là lý do hai chế độ tồn tại — **không phải để ẩn bớt nút**.

**Tự đoán thiết bị**: mở trên tablet → mặc định Sketch · desktop → mặc định Pro.
Đổi được bằng tay, **nhớ lựa chọn**.

## 2. Sáu trục phân biệt thật

| Trục | **Sketch** *(tablet · bút · SD)* | **Pro** *(máy · chuột · CD/TKKT)* |
|---|---|---|
| Thiết bị | iPad · màn cảm ứng · foldable | Desktop + bàn phím |
| Cách nhập | Ngón · bút · cử chỉ | Chuột + phím tắt + **dòng lệnh** |
| Cỡ nút chạm | **≥44px**, thưa | ~24px, dày đặc |
| Gọi lệnh | **Menu vòng quanh ngón** *(radial menu)*, giữ lâu hiện tuỳ chọn | Gõ lệnh `L · REC · PL · C` + phím tắt |
| Độ chính xác | Ước lượng · **snap dung sai lớn** · vẽ tay tự nắn thẳng | Nhập số chính xác tới **mm** |
| Đầu ra | Mặt bằng tô màu · mặt cắt sơ bộ · ý tưởng | **Bộ hồ sơ có khung tên, tỉ lệ, layout in, gửi công trường** |

## 3. Bậc N của **Sketch** — hiện chưa có gì

| Món | Vì sao bắt buộc |
|---|---|
| **Nhận bút**: lực nhấn · nghiêng · **chống tì tay** *(palm rejection)* | Không có → tì tay lên màn là vẽ bậy |
| **Cử chỉ**: 2 ngón zoom/pan · 2 ngón chạm = undo · 3 ngón chạm = redo | Không có → phải bấm nút, mất nhịp |
| **Vẽ tay tự nắn thẳng** *(shape recognition)* | Nguệch ngoạc → thành tường thẳng. Hình mẫu: Concepts · Morpholio Trace |
| **Menu vòng quanh ngón** *(radial menu)* | Không phải rê tay lên toolbar xa |
| **Snap dung sai lớn** | Ngón tay không chính xác bằng chuột |
| **Tạo sinh nhanh giai đoạn SD** | Vẽ khối → tự tô vật liệu · tự sinh mặt cắt sơ bộ |

## 4. Bậc N của **Pro** — ⚠️ LỖ THỦNG LỚN NHẤT

Giao diện Pro hiện tại **không có Layout / Paper Space** — mà đó chính là thứ định nghĩa Pro.

| Món | Trạng thái |
|---|---|
| **Khung tên** *(title block)* | ✅ **ĐÃ CÓ**: `titleBlockPro()` ở `lib/cad/commands.ts`, dùng Brand Kit per-project |
| **Tỉ lệ viewport** 1:50 · 1:100 — in ra đúng tỉ lệ | 🟡 có nút "Tỉ lệ", chưa rõ mức nào |
| **Xuất bộ hồ sơ** — nhiều tờ thành 1 PDF, đánh số, mục lục | ⬜ |
| Xuất DXF/DWG gửi công trường | 🟡 |

**Layout / Paper Space — phân biệt với multi-sheet đang có (26/07, sửa lại sau khi đối chiếu code thật):**

| | Multi-sheet dạng tab (ĐANG CÓ) | Layout/Paper Space (THẬT SỰ THIẾU) |
|---|---|---|
| Mỗi tờ là gì | **1 Doc riêng biệt** | **Một khung nhìn vào CÙNG model** |
| Sửa bản vẽ ở tab A | Tab B không đổi | **Mọi tờ tự cập nhật** |
| Nhiều tỉ lệ trên 1 tờ | ❌ | ✅ MB 1:100 + chi tiết 1:20 cùng tờ |

⇒ Lỗ hổng thật KHÔNG phải khung tên, mà là các tờ không nhìn vào cùng một
model — sửa một chi tiết phải sửa lại từng tab bằng tay. Xem `docs/MULTI-SHEET-PROPOSAL.md`.

> Đây là bậc N thiếu của Pro, **ngang tầm quan trọng với "cảm giác tay"**.

## 5. Thứ tự đề xuất

| Pha | Làm gì |
|---|---|
| **1** | Hoàn tất "cảm giác tay" Pro *(snap · F8 · rubber-band · undo)* — đang làm |
| **2** | **Layout + khung tên + tỉ lệ viewport + xuất bộ hồ sơ** — biến Pro thành Pro thật |
| **3** | Sketch bậc N: cử chỉ · bút · nút ≥44px · radial menu · snap dung sai lớn |
| **4** | Sketch: vẽ tay tự nắn thẳng · tạo sinh nhanh SD |

⚠️ Không làm Sketch trước Pro: Pro là chỗ ra **hồ sơ bán được tiền**; Sketch là chỗ ra **ý tưởng**.

---

*v1.0 · 2026-07-26 · Ben soạn theo ý Hoà.*
