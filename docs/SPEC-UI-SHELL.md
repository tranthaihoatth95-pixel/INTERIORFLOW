# SPEC — KHUNG GIAO DIỆN CHUNG *(UI shell)*

> **Đã duyệt (Cowork thay, uỷ quyền phần thuần kỹ thuật, 01/08).** Một khung dùng cho **cả 3
> chặng** — người dùng học 1 lần, đi khắp app.
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

## 2B. LUẬT CANVAS — 4 trạng thái *(áp cho CAD · Render · Present)*

> **Khi tay người đang thao tác, mọi thứ khác phải biến mất.**
> *(get out of the way during direct manipulation)* — chi tiết phân biệt app pro với nghiệp dư.

| Trạng thái | Hiện gì | Ẩn gì |
|---|---|---|
| **Rảnh** (chưa chọn) | Không gì nổi | — |
| **Đã chọn** (click 1) | Khung chọn + 8 tay nắm + **thanh công cụ nổi** | — |
| **Đang kéo/resize/xoay** ⭐ | Chỉ: vật đang di chuyển · **đường căn** *(alignment guides)* · **số đo real-time** (x,y hoặc w×h) | **Toàn bộ toolbar · panel · tay nắm không liên quan** |
| **Đang sửa chữ** (click đúp) | Con trỏ nhấp nháy + toolbar **chữ** | Toolbar vật thể |

### Quy ước click chuẩn

| Thao tác | Kết quả |
|---|---|
| Click 1 lần | **Chọn** để di chuyển/resize — KHÔNG vào sửa chữ |
| Click đúp | Vào **sửa chữ** |
| Esc | Thoát sửa chữ → đã chọn · Esc lần nữa → bỏ chọn |

*(Lỗi hiện tại ở Present: chọn chữ để dời mà toolbar vẫn nằm đè — vi phạm trạng thái 3.)*

## 2C. BẢNG LỆNH `Cmd/Ctrl + K` — thay cho nhiều ô tìm kiếm rời

Một ô duy nhất, gõ gì cũng ra: dự án · deck · bản vẽ · vật liệu · ảnh thư viện · **lệnh**
(vd "xuất pdf" → chạy luôn) · công cụ vẽ · tra quy chuẩn.

Rẻ hơn làm ô tìm kiếm riêng từng màn, mạnh hơn hẳn — người dùng chỉ nhớ **một phím**.

## 2D. GỢI Ý THEO NGỮ CẢNH — ba mức

| Mức | Cách | Khi nào |
|---|---|---|
| **1 · Lọc sẵn** | Panel thư viện tự lọc theo chặng đang mở + gu dự án | Làm ngay, rủi ro 0 |
| **2 · Gợi ý tại chỗ** | Chọn tường → hiện vật liệu tường hợp gu · slide trống → 3 bố cục | Sau |
| **3 · Chủ động nhắc** | "Phòng này chưa có vật liệu sàn" · "3 slide đang trống" | ⚠️ Cẩn thận |

**Ba luật chống phiền**: ① không chặn màn hình — gợi ý trong panel, không popup ·
② xuất hiện ở nơi mắt đang nhìn · ③ tắt được và **nhớ đã tắt**.

## 3. Ba chỗ ComfyUI làm dở — LUẬT không chép

| Lỗi của họ | Luật cho IF |
|---|---|
| Thông báo lỗi kỹ thuật vô nghĩa *("Cannot convert to subgraph: nothing to convert")* | **Mỗi lỗi trả lời 2 câu: chuyện gì xảy ra · giờ bấm gì** |
| Canvas trống trơn, không biết bắt đầu | **Empty state** bắt buộc: 2 nút mời gọi + tour (xem Luật demo) |
| Phân nhóm theo kỹ thuật (model/experimental/advanced/utilities) | Phân theo **việc thiết kế**, không theo kiến trúc phần mềm |

## 3B. GIẤY VUÔNG, VỎ BO — quy tắc bo góc *(chốt 27/07)*

> **Luật**: mọi bề mặt đại diện cho đầu ra in/xuất phải giữ đúng hình dạng thật của đầu ra đó.
> Giấy thì vuông, vỏ thì bo.

- **"Giấy"** = trang slide/trang in ở chặng Presenting — bề mặt đại diện trực tiếp cho PDF/PPTX/
  ảnh xuất ra. PDF/PPTX/in **luôn luôn vuông góc** ⇒ trang trong editor phải `border-radius: 0`.
  Bo góc ở đây là **nói dối WYSIWYG**: người dùng thấy góc bo trong editor nhưng file xuất ra vẫn
  vuông — hai kết quả khác nhau. Bug cụ thể đã sửa: bo góc trang cắt mất góc ảnh full-bleed dù
  ảnh xuất ra không hề bị cắt.
  - Tách trang khỏi canvas bằng **box-shadow nổi + viền 1px sáng nhẹ + nền canvas tối hơn
    trang** — KHÔNG dùng bo góc để phân biệt "đây là 1 tờ giấy khác với nền sau nó".
- **"Vỏ"** = mọi thứ KHÔNG đại diện cho đầu ra in/xuất: panel · toolbar · nút · thẻ kính (`lq-card`)
  · thumbnail ở dải slide dưới cùng (thẻ ĐIỀU HƯỚNG, không phải giấy) — GIỮ NGUYÊN bo góc như hiện
  tại (`--radius-sm/md/lg/xl`, hoặc 6–8px riêng cho thumbnail).
- Áp dụng: `components/present-editor/EditorCanvas.tsx` (bề mặt trang) — không áp cho
  `components/present-editor/SlideStrip.tsx` (dải thumbnail, vẫn bo 6px).

## 4. Ghi chú

- Khung này áp cho cả 3 chặng → mọi panel mới phải nằm trong khung, không tự chế layout riêng.
- Preview thẻ / vật liệu / block: xem `SPEC-RENDER-STUDIO.md` mục 6 (hover, lazy load, poster).
- Lợi thế IF: **đẹp là thế mạnh sẵn có của studio** — nhưng cấu trúc mới là thứ giữ người dùng.

---

*v1.2 (thêm §3B "giấy vuông, vỏ bo" — quy tắc bo góc trang Present) · 2026-07-27 · Ben soạn theo ý Hoà.*
*v1.1 (thêm §2B luật canvas 4 trạng thái, §2C bảng lệnh Cmd+K, §2D gợi ý ngữ cảnh) · 2026-07-24 · Ben soạn theo ý Hoà.*

