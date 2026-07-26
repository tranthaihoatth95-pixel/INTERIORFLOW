# SPEC — KHUNG GIAO DIỆN CHUNG *(UI shell)*

> **[CẦN HOÀ DUYỆT]** · Một khung dùng cho **cả 3 chặng** — người dùng học 1 lần, đi khắp app.
> Nguồn: phân tích bố cục ComfyUI (cấu trúc tốt) + chỗ họ làm dở (không chép).

---

## 1. Sáu nguyên tắc bố cục

| Nguyên tắc | Áp cho IF |
|---|---|
| **Ray icon + panel trượt** *(icon rail + slide-out)* | Ray = 4 chặng: CAD · Render · Present · Library. Không chiếm đất khi không dùng |
| **Tab như trình duyệt** | Mở nhiều bản vẽ / dự án song song, chuyển tức thì |
| **Một hành động chính nổi bật** | Mỗi chặng 1 nút: *Kiểm tra chuẩn* · *Render* · *Xuất deck* |
| **Điều khiển canvas nổi góc** | Zoom + minimap góc phải dưới, không lẫn nội dung |
| **Trạng thái thường trực** | Hàng đợi render · đang lưu · số lỗi quy chuẩn |
| **Lỗi dạng thẻ nổi** *(toast)* | Không chặn màn hình |

## 2. Khung

```
┌──────────────────────────────────────────────────────────────┐
│ [Dự án ▾] │ MB tầng 1 ×│ Phối cảnh ×│ Deck ×│ + │   ⟵ breadcrumb + tab
├────┬─────────────────────────────────────────────┬───────────┤
│ 🏠 │                                             │ Thuộc tính│
│ ✏️ │                                             │ đối tượng │
│ 🖼 │              CANVAS                         │ đang chọn │
│ 📊 │                                             │           │
│ 📚 │                                    [▶ Hành động chính]  │
│ ⚙️ │                              ┌──────────┐   │           │
└────┴──────────────────────────────┴ minimap ─┴───┴───────────┘
```

**IF thắng ngay ở cấu trúc**: thanh trên luôn cho biết **đang ở dự án nào, bản vẽ nào**.
ComfyUI không có khái niệm dự án nên không thể có breadcrumb — và đó chính là bug scope
đã sửa ở Task 0. Điều hướng và giao diện là **một chuyện, không phải hai**.

## 3. Ba chỗ ComfyUI làm dở — LUẬT không chép

| Lỗi của họ | Luật cho IF |
|---|---|
| Thông báo lỗi kỹ thuật vô nghĩa *("Cannot convert to subgraph: nothing to convert")* | **Mỗi lỗi trả lời 2 câu: chuyện gì xảy ra · giờ bấm gì** |
| Canvas trống trơn, không biết bắt đầu | **Empty state** bắt buộc: 2 nút mời gọi + tour (xem Luật demo) |
| Phân nhóm theo kỹ thuật (model/experimental/advanced/utilities) | Phân theo **việc thiết kế**, không theo kiến trúc phần mềm |

## 4. Ghi chú

- Khung này áp cho cả 3 chặng → mọi panel mới phải nằm trong khung, không tự chế layout riêng.
- Preview thẻ / vật liệu / block: xem `SPEC-RENDER-STUDIO.md` mục 6 (hover, lazy load, poster).
- Lợi thế IF: **đẹp là thế mạnh sẵn có của studio** — nhưng cấu trúc mới là thứ giữ người dùng.

---

*v1.0 · 2026-07-24 · Ben soạn theo ý Hoà.*

