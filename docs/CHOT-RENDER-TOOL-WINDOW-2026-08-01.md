# CHỐT — RENDER: BỎ TOOL MODE RIÊNG · TOOL WINDOW = SUBGRAPH NODE

> Hoà quyết **01/08/2026**, nhìn giao diện Rendering thật (ảnh chụp trong phiên).
> ⚠️ **LẬT một chốt cũ**: `SPEC-RENDER-STUDIO` §1B (27/07) từng chốt *"Tool mode — giao diện
> MẶC ĐỊNH"* là màn riêng 2 cột. Quyết định này **thay thế** §1B — ghi đè có ngày, không xoá gốc.

## 1 · Mô hình mới — một nền duy nhất

```
┌─[Sketch→Ảnh thật][Đổi vật liệu][Sửa một mảng][+ghim]─┐  ← THANH TAB TOOL phía trên
│                                                       │
│   ┌─ kính mờ ────────┐   ┌─ kính mờ ────────┐        │
│   │ TOOL WINDOW      │──▶│ TOOL WINDOW 2    │        │  ← kéo tab xuống = xổ window
│   │ (ảnh sắc nét)    │   │                  │        │     nối window với nhau NHƯ NỐI NODE
│   └──────────────────┘   └──────────────────┘        │
│         ▼ thu lại                                     │
│       [node nhỏ]        ← canvas node như cũ          │
└───────────────────────────────────────────────────────┘
```

| # | Chốt | Chi tiết |
|---|---|---|
| 1 | **Tool window LÀ subgraph node phóng to** | Một trạng thái duy nhất — window chỉ là cách HIỂN THỊ của node. Đóng window → thu thành node nhỏ trên canvas; mở lại → đúng giá trị đang chỉnh. KHÔNG có màn tool mode riêng, KHÔNG có bản sao trạng thái |
| 2 | **Thanh tab**: 8 tool nền (thẻ N §6) + **ghim của tôi** | Vị trí cố định, không tự xếp lại theo tần suất (giữ trí nhớ cơ bắp). Khớp sẵn 3 tab Của IF/Cộng đồng/Của tôi (§6B pha 5) sau này |
| 3 | **Tối đa 3 window mở cùng lúc** | Mở cái thứ 4 → cái cũ nhất tự thu về node nhỏ (không mất gì). Nối 2–3 window với nhau = nối node bình thường — vì window LÀ node |
| 4 | **Màn ≤7 inch: 1 window, tự phóng toàn màn** | Chính nó TRỞ THÀNH tool mode cũ — cùng một code, không nuôi hai giao diện. Giữ nguyên lý §1B: dây trên màn nhỏ là bất khả thi |

## 2 · Vật liệu khung — kính là VỎ, không bao giờ là RUỘT

Hoà chốt: khung bao nội dung dùng **kính mờ theo design system IF** (họ hàng card kính gallery
`ProjectSelect`/`TitleSequence`, cầu kính Vitals, *"giấy vuông vỏ bo"* 27/07):

- **Vỏ window**: kính mờ (backdrop blur), bo góc, viền sáng mảnh — nổi khỏi canvas.
- **Ruột (ảnh/kết quả render)**: sắc nét 100% · góc vuông · KHÔNG blur, KHÔNG phủ màu, KHÔNG
  giảm tương phản. Nội dung là thứ khách trả tiền để nhìn.
- **Hiệu năng**: backdrop-filter CHỈ trên ≤3 window + thanh tab. Node nhỏ trên canvas dùng nền
  đặc — không rải kính lên hàng chục node (bài học FPS phần C).

## 2B · BẬC THANG ĐIỀU KHIỂN TAY *(Hoà nêu yêu cầu 01/08: "KTS ghét tự động không ra đúng ý" — khung dưới đây là **Cowork đề xuất, CHƯA chốt**, chờ Hoà gật)*

> Gốc: *"quyền điều khiển đặt ở nơi tay nghề nằm"* (SPEC-RENDER-STUDIO, nguyên tắc gốc).

| Nấc | Điều khiển | Nền đã có |
|---|---|---|
| 1 | Núm nghề (2–3 thanh trượt tiếng nghề) | mock hôm nay |
| 2 | **"Mở nâng cao ▾"** trong window — TOÀN BỘ thông số thật, tên theo bảng chuyển ngữ §3; chỉnh nấc 1 thấy số nấc 2 nhảy theo, không giấu gì | §3 đã chốt "bảng chuyển ngữ là tài sản" |
| 3 | **Tay trên ảnh**: vẽ mask "chỗ này sửa / chỗ kia cấm đụng" | `MaskPainterModal.tsx` đã tồn tại — nối vào window |
| 4 | ⌗ tụt xuống subgraph — quyền tuyệt đối | chốt mục 1 |

**Hai luật chống "toang":**

1. **KHOÁ GIỮ VÙNG (pin)** — áp nguyên luật Present (3 phương án + khoá giữ) sang ảnh render:
   vùng đã ưng 🔒 → mọi lần render lại CHỈ đổi phần ngoài khoá. Không bao giờ mất chỗ vừa ưng.
2. **SEED KHOÁ — "làm lại y hệt"** — 📌 giữ seed cạnh kết quả; chỉnh 1 núm thì chỉ 1 thứ đổi.
   Kết quả không lặp lại được = không trình chủ đầu tư được.

## 3 · Hệ quả kỹ thuật

1. ✅ **Bug `2.2.92` tự có đáp án**: gốc bệnh là overlay "Chọn việc muốn làm" (`z:35`) phủ kín
   canvas đè popover — mô hình mới **xoá overlay đó**. Câu "CẦN Hoà quyết hướng" đang treo: ĐÓNG.
2. Tool window phải render qua **lớp portal chung** (khuôn `Popover.tsx` đã đúng) — không
   `position:absolute` cục bộ, khỏi tái phát đúng bệnh stacking-context vừa chẩn.
3. **6 thẻ N đang làm (pha 1 §6B) phải xây trên mô hình này** — ai đang dựng UI thẻ theo màn
   2 cột cũ thì DỪNG, đọc file này trước.
4. Hình mẫu ngành: **ComfyUI Subgraph** (2025-26) — gói cụm node thành một khối chỉ lộ núm cần
   thiết. IF đi xa hơn một bước: khối đó nở thành window thao tác được và nối được với nhau.

---

*Cowork ghi 01/08/2026, ngay sau khi Hoà chốt 3 câu + vật liệu khung. Việc thi công: xếp vào
Render Studio pha 1 — chưa giao phiên nào, chờ code chính xong V2 + P1–P3.*
