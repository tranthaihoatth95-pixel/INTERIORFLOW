# SPEC — IF LIBRARY *(siêu thư viện tài sản / DAM)*

> **[CẦN HOÀ DUYỆT]** · Đây **không phải tính năng mới** — là **mặt tiền của T5 Não tri thức**.
> Nền đã có: model `LibraryAsset` + API `/api/library/[id]/file` + `path` tách khỏi DB (đúng chuẩn
> local-first). Việc còn lại là **mở rộng**, không xây mới.
> Đọc cùng `IF-CORE-SCHEMA.md`, `SPEC-MATERIAL-PIPELINE.md`, `SPEC-RENDER-STUDIO.md`.

---

## 1. Vì sao quan trọng — một thư viện nuôi 5 nơi

| Nơi tiêu thụ | Lấy gì |
|---|---|
| **Render** | Ảnh tham chiếu cho ControlNet/IPAdapter |
| **Present** | Ảnh chèn deck · moodboard · ảnh bìa · template |
| **CAD** | Ảnh vật liệu thật thay procedural texture (`photoUrl?` chờ sẵn) · block/detail |
| **Gu Engine** | Reference để đọc gu dự án — khách chỉ ảnh, máy chấm 10 trục |
| **Trend clock** | Kho bằng chứng xu hướng, gắn tem 🟢🟡🔴 |

## 2. Nguyên tắc gốc

> **Một xương sống chung + mỗi loại một bộ mặt trội** *(shared spine + per-type facets)*.
> Không làm 8 thư viện rời. Cũng không nhét mọi thứ vào một bảng phẳng.

### Xương sống — mọi tài sản đều có
`id` · `projectId` (hoặc `global`) · `type` · **nguồn + giấy phép** · thẻ · `guProfileRef` ·
`trendStatus` 🟢🟡🔴 · `reviewBy` · thống kê dùng (ai · ở đâu · bao nhiêu lần) ·
`path` (file nằm ngoài DB) · `updatedAt` · `deletedAt` · `rev`

## 3. Tám nhóm — gọi loại nào trả đặc điểm loại đó

| Nhóm | Mặt trội riêng *(salient facets)* | Nuôi chặng | Hiện trạng |
|---|---|---|---|
| **Ảnh** | phòng · phong cách · palette · ánh sáng · 10 trục gu | Render · Present · Gu | 🟡 `img_` id xong |
| **Block CAD / Detail** | hạng mục · kích thước · layer · tỉ lệ · đơn vị | CAD | ⬜ nhóm B spec P1 |
| **Vật liệu** | mã · hãng · bề mặt · màu · giá · NCC · ảnh thật | CAD · Render · BOQ | 🟡 13 preset + `photoUrl?` |
| **Excel** (dự toán, khái toán, danh mục) | loại bảng · đơn vị · hạng mục · phiên bản đơn giá | BOQ · hồ sơ | ⬜ |
| **Doc / biểu mẫu** | loại văn bản · trường điền · ngôn ngữ · nơi áp dụng | Hồ sơ hành chính | ⬜ |
| **Template thuyết trình** | khổ · số slide · vai trò trang · lưới · ngành | Present | ✅ 25 template |
| **SVG / icon** | chủ đề · nét · màu · đơn/đa sắc | Present · UI | ⬜ |
| **Font** | họ chữ · **hỗ trợ tiếng Việt** · giấy phép thương mại · weight | Toàn app · PDF | 🟡 Be Vietnam Pro |

## 4. Tìm kiếm — một ô, máy tự đoán ý

- *"chi tiết tủ bếp âm tường"* → ưu tiên **Block CAD**, hiện kích thước + tỉ lệ
- *"đơn giá sơn 2026"* → ưu tiên **Excel**, hiện phiên bản đơn giá
- *"phòng khách gỗ sáng, chiều muộn"* → ưu tiên **Ảnh**, hiện palette + gu
- Đang mở CAD → mặc định lọc block/vật liệu · đang mở Present → lọc ảnh/template

Kỹ thuật: **bộ lọc mặt** *(faceted search)* + xếp hạng theo **ngữ cảnh chặng đang mở** +
**độ hợp gu dự án**. Toàn phép so vector và lọc thuộc tính.

## 5. Kinh tế credit — tag 1 lần, dùng mãi

```
Ảnh nhập → AI vision đọc 1 lần (TỐN credit duy nhất lần đó)
         → lưu thẻ + vector đặc trưng (embedding)
         → từ đó: tìm kiếm · gợi ý · chấm gu = SO VECTOR, 0 credit, chạy máy thường
```
10.000 ảnh tag một lần rồi thôi. Đúng công thức chưng cất *(distillation)*.

## 6. Nguồn & giấy phép — ⚠️ chặn rủi ro pháp lý

App global mà kéo ảnh Pinterest/Google về làm thư viện = **rủi ro chết người**, chặn đứng
đường thương mại hoá. Nguồn hợp pháp xếp theo giá trị:

| # | Nguồn | Ghi chú |
|---|---|---|
| 1 | **Ảnh render/công trình của chính studio** | Tốt nhất — độc quyền, càng dùng càng dày. Chính là bánh đà |
| 2 | API miễn phí thương mại | Unsplash · Pexels · Openverse (CC) |
| 3 | Ảnh do AI sinh trong app | Sạch, có `img_` id sẵn |
| 4 | User tự upload | **Bắt buộc** lưu trường nguồn + giấy phép *(provenance & license)* |

**Luật**: Library lưu **link + metadata + thumbnail nhỏ**, không ôm bản gốc của thiên hạ.

## 7. Phân bậc N/P/L

| Bậc | Nội dung |
|---|---|
| **N** | Upload · thẻ tay · tìm theo thẻ · bộ sưu tập · **chèn thẳng vào deck/CAD/render** · preview hover |
| **P** | **Tự gắn thẻ bằng AI vision** (phòng, phong cách, màu, vật liệu, ánh sáng) · **tìm bằng câu chữ** *(semantic search)* |
| **L** | **Chấm 10 trục gu từng ảnh** → tự đẩy ảnh hợp gu dự án đang mở · học từ ảnh **chọn dùng thật** (không phải ảnh "thích") · gắn tem xu hướng |

**Khác Pinterest ở đâu**: Pinterest học *cái bạn thích* · IF Library học *cái bạn dùng được và
bán được* — vì nó biết dự án nào, gu ai, thắng hay thua.

## 8. Lộ trình — chỉ mở nhóm nào có chặng đang chờ tiêu thụ

| Pha | Mở nhóm | Vì |
|---|---|---|
| **1** | Ảnh · Vật liệu · Template | Gỡ 3 nút đang chờ: `photoUrl?` · chuỗi L5 BOQ · Present |
| **2** | Block CAD / Detail | Mở khoá nhóm B "thư viện kéo thả" spec P1 — đòn bẩy lớn nhất cho CAD |
| **3** | Excel · Doc biểu mẫu | Sau khi có BOQ/hồ sơ mới có thứ để mẫu hoá |
| **4** | SVG · Font | Nhẹ, gom lúc rảnh |

⚠️ **Kỷ luật chống phình**: "siêu thư viện" là ý dễ phình vô hạn. **Không có nơi tiêu thụ thì
chưa mở nhóm**, dù ý tưởng hay tới đâu.

## 9. Local-first

File ở `uploads/` trên ổ đĩa · DB giữ `path` (✅ đã đúng) · Pha 2 sync **metadata trước**
(KB, nhanh), file nặng tải sau khi cần *(lazy)*.

---

*v1.0 · 2026-07-24 · Ben soạn theo ý Hoà.*

