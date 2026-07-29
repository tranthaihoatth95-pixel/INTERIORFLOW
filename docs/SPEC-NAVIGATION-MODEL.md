# SPEC — MÔ HÌNH ĐIỀU HƯỚNG & LUỒNG SỬ DỤNG

> **[CẦN HOÀ DUYỆT]** · Giải bệnh "lớp ngoài lớp trong loạn xà ngầu".
> Chẩn đoán gốc: app hiện **không có một trục điều hướng duy nhất** — mỗi màn tự dựng layout,
> mỗi chặng tự đặt nút, thư viện có nhiều lối vào, có trang tràn ra ngoài khung.

---

## 1. NGUYÊN TẮC GỐC — bốn lớp, không lẫn

```
LỚP 4 · TÁC VỤ      thao tác đang làm (vẽ · mask · dàn trang)
LỚP 3 · CHẶNG       Ý tưởng → CAD → Render → Present
LỚP 2 · DỰ ÁN       một dự án cụ thể
LỚP 1 · STUDIO      toàn cục: dashboard · thư viện · cài đặt · team
```

**Luật**: đi xuống thì tự nguyện, đi lên thì **luôn có đường về**.
Mỗi màn hình phải trả lời được: *tôi đang ở lớp mấy · thuộc cái gì · thoát ra bằng đâu.*

⚠️ Sai hiện tại: có trang (vd `/library/ingest`) **tràn full màn, không rõ thuộc lớp nào**.

## 2. KHUNG CỐ ĐỊNH — một khung cho cả app

```
┌──────────────────────────────────────────────────────────┐
│ [logo] [Dự án ▾]  Ý tưởng · CAD · Render · Present  [⚙]  │ ← THANH CHẶNG (lớp 2-3)
├────┬─────────────────────────────────────────┬───────────┤
│ ⬛ │                                         │ Thuộc tính│
│ ⬛ │              CANVAS                     │ đối tượng │ ← LỚP 4
│ ⬛ │                                         │ đang chọn │
│ ⬛ │                              [▶ Hành động chính]     │
├────┴─────────────────────────────────────────┴───────────┤
│ dự án · bản vẽ · toạ độ │  ✦ VITALS  │ hàng đợi · lưu · 🔴n │ ← STATUS BAR
└──────────────────────────────────────────────────────────┘
   rail trái = panel công cụ (thư viện · lớp · lịch sử · cài đặt)
```

**Luật khung**: mọi màn hình nằm TRONG khung này. Không có trang nào tràn ra ngoài.
Ngoại lệ duy nhất: **Trình chiếu toàn màn hình** (Present) — ẩn hết, `Esc` để về.

## 3. BỐN LUỒNG CHUẨN — người dùng thật sự đi thế nào

### Luồng A · Dự án mới, từ đầu (dài nhất)
```
Dashboard → [Tạo dự án] → nhập tên + loại hình
   → Ý tưởng: nạp brief · moodboard · chốt hướng
   → CAD: nạp hiện trạng (DXF/số đo) · vẽ · tô vật liệu · kiểm chuẩn
   → Render: chọn thẻ việc · render · sửa mảng
   → Present: chọn loại hồ sơ · máy dàn · sửa · xuất
```

### Luồng B · Có sẵn ảnh, chỉ cần render (ngắn nhất — người mới hay đi)
```
Dashboard → [Tạo dự án] → Render → thẻ "Sửa một mảng" → thả ảnh → render → xuất
```
⚠️ Luồng này **phải đi được mà không cần đụng CAD**. Nếu bắt vẽ trước mới render được → sai.

### Luồng C · Có bản vẽ cũ, làm hồ sơ mới
```
Dashboard → mở dự án cũ → Present → chọn loại hồ sơ → máy lấy bản vẽ + ảnh có sẵn → xuất
```

### Luồng D · Từ hiện trường về (ArchiNote → IF)
```
ArchiNote đo/chụp → Lark → IF: dự án đã có sẵn số đo + ảnh hiện trạng + ghi chú
   → CAD dựng từ số thật
```

**Luật**: bốn luồng dùng **cùng một khung**, khác nhau ở điểm vào — không phải bốn giao diện.

## 4. PHÂN LOẠI ĐỂ HIỂN THỊ — thế mạnh riêng của IF

> Không app nào khác biết **đang ở chặng nào · dự án gu gì · vật liệu mã nào**.
> ⇒ Mọi danh sách trong IF phải **tự sắp theo ngữ cảnh**, không bắt người dùng lọc tay.

| Ở đâu | Tự ưu tiên hiện gì |
|---|---|
| Thư viện · mở trong CAD | Block · detail · vật liệu |
| Thư viện · mở trong Render | Ảnh tham chiếu · thẻ việc · vật liệu |
| Thư viện · mở trong Present | Ảnh · template · palette |
| Thẻ việc (Render) | Thẻ hay dùng của studio lên trước |
| Vật liệu | Hợp gu dự án lên trước · đã dùng trong dự án này lên đầu |
| Template Present | Đúng loại hồ sơ đang làm |
| Vitals | Trả lời theo chặng + đối tượng đang chọn |

**Ba tầng ưu tiên, áp cho mọi danh sách**:
1. **Ngữ cảnh** — chặng đang mở · đối tượng đang chọn
2. **Dự án** — gu 10 trục · vật liệu đã dùng · Brand Kit
3. **Thói quen** — món studio hay dùng · món từng thắng thầu

## 5. BA LOẠI PANEL — đừng lẫn

| Loại | Ví dụ | Luật |
|---|---|---|
| **Panel công cụ** (rail trái) | Thư viện · Lớp · Lịch sử | Trượt ra, không che canvas, đóng được |
| **Panel thuộc tính** (phải) | Thuộc tính đối tượng đang chọn | Chỉ hiện khi có đối tượng được chọn |
| **Hộp thoại** (giữa) | Xuất · Cài đặt · Thay ảnh | Có backdrop, chặn thao tác, `Esc` đóng |

⚠️ Sai thường gặp: dùng hộp thoại cho việc đáng lẽ là panel → người dùng mất ngữ cảnh.

## 6. LUẬT ĐẶT NÚT — nút ở đâu, ai được có

| Vị trí | Chứa gì | Không chứa gì |
|---|---|---|
| Thanh chặng (trên) | Chuyển chặng · dự án · cài đặt | ❌ công cụ vẽ |
| Thanh công cụ (trong canvas) | Công cụ của chặng đó | ❌ hành động toàn cục |
| Rail trái | Mở/đóng panel | ❌ hành động thực thi |
| Status bar | Vitals · trạng thái · ngữ cảnh | ❌ nút thao tác |
| Chuột phải | Đường tắt của thứ đã có ở nơi khác | ❌ chức năng ĐỘC QUYỀN |

**Luật cuối quan trọng nhất**: chuột phải chỉ là **đường tắt**. Mọi việc làm được bằng chuột phải
đều phải làm được bằng đường khác — nếu không, người dùng cảm ứng và người mới sẽ không bao giờ tìm ra.

## 7. BỨC TRANH TỔNG — ba hệ

```
        ┌─────────────────┐         ┌─────────────────┐
        │   ARCHINOTE     │         │  INTERIORFLOW   │
        │  (hiện trường)  │         │    (xưởng)      │
        │  Capacitor·📱   │         │  Electron·💻    │
        ├─────────────────┤         ├─────────────────┤
        │ đo · ảnh · ghi  │         │ Ý tưởng → CAD   │
        │ chú · panorama  │         │ → Render        │
        │ nắng gió view   │         │ → Present       │
        └────────┬────────┘         └────────┬────────┘
     dữ liệu nặng│ở máy             dữ liệu nặng│ở máy
                 │                             │
                 ▼         ┌───────────────────▼
        ┌────────────────────────────────────────────┐
        │       ATLAS · LARK BASE (điểm gặp)         │
        │  MATERIAL (mã·hãng·giá·NCC·ảnh·PBR)        │
        │  STYLE_DNA · DEVELOPER (vân tay gu)        │
        │  PROJECT_STATUS (giai đoạn·%·điều phối)    │
        │  Chi tiết điển hình · case công trường     │
        └────────────────────────────────────────────┘
                 ▲                             ▲
                 │  cả hai ĐỌC, không app nào  │
                 │  gọi app nào                │
```

### Ba hệ, ba vai
| | Vai | Giữ gì |
|---|---|---|
| **ArchiNote** | Thu thập hiện trường | Ảnh · số đo · ghi chú (nặng, ở máy) |
| **InteriorFlow** | Sản xuất thiết kế | Bản vẽ · render · deck (nặng, ở máy) |
| **ATLAS/Lark** | **Điểm gặp trung tính** | Vật liệu · gu · trạng thái (nhẹ, dùng chung) |

**Luật vàng**: dữ liệu **nặng ở lại máy**, dữ liệu **điều phối bay lên Lark**.
Hai app **không gọi nhau** — chỉ cùng đọc/ghi Lark. Đổi bên nào cũng không vỡ bên kia.

### Vòng chảy dữ liệu
```
ArchiNote thu → Lark → IF dựng → IF xuất → phản hồi khách
     ▲                                            │
     └──────── nạp về Não T5 (KnowledgePack) ─────┘
```
Càng làm nhiều dự án, ATLAS càng dày, gu càng chuẩn — **bánh đà không mua được bằng tiền**.

---

*v1.0 · 2026-07-28 · Ben soạn theo yêu cầu Hoà.*
