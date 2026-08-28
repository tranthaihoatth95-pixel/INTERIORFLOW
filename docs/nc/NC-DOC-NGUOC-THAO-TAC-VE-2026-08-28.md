# Đọc ngược thao tác của người vẽ — thuật toán nhận diện tường

`Plane: IF` · 28/08/2026 · Hoà đặt đề: *"nghiên cứu các bước con người thao tác, cách nào vẽ nhanh
nhất, bằng lệnh gì, rồi làm theo để hiểu, xong lưu lại thuật toán."*

> **LOOK INSIDE trước (B25):** `docs/nc/NC-12-bo-lenh-3d-2026-08-03.md` + `SPEC-DUNG-BO-LENH-3D.md`
> đã trả lời *"IF nên dựng lệnh gì"*. Tệp này trả lời hai câu **khác**: *"người vẽ thế nào"* và
> *"AI vẽ thế nào"*. Không chồng lấn.

## 1 · Người vẽ tường bằng ba lệnh

Quy trình sản xuất chuẩn của một người vẽ CAD:

```
UNITS → LAYERS → RECTANG/PLINE (bao ngoài) → OFFSET (bề dày)
      → MLINE/PLINE trục giữa (tường trong) → OFFSET hai bên
      → TRIM chỗ giao → INSERT cửa/cửa sổ → HATCH → DIM → MTEXT
```

Điều quan trọng nằm ở ba lệnh giữa:

| lệnh | người làm gì | để lại gì trong tệp |
|---|---|---|
| **trục giữa** | vẽ **một** đường theo tim tường | *(bị xoá hoặc nằm trên layer phụ)* |
| **`OFFSET <bề dày>`** | đẩy ra hai bên | **hai đường song song** cách nhau đúng bề dày |
| **`TRIM`** | cắt gọn chỗ giao | **một bức tường dài bị chia thành nhiều đoạn** |

> ## 🔑 Ý định của người vẽ là **MỘT TRỤC + MỘT BỀ DÀY**.
> Hai đường song song **không phải ý định** — chúng là **sản phẩm phụ của `OFFSET`**.

## 2 · Thuật toán: đảo ngược đúng ba lệnh đó

```
ĐẢO OFFSET   cặp đoạn gần song song (≤1°), cùng layer, cách nhau trong dải bề dày,
             chồng lấn dọc trục  ⇒  trả về TRỤC GIỮA + BỀ DÀY
ĐẢO TRIM     nối các trục cùng phương · cùng bề dày · đầu nối đầu trong dung sai
             ⇒  trả về BỨC TƯỜNG NGUYÊN
ĐẢO MLINE    trục + bề dày  ⇒  đùn khối 3D
```

**Vì sao cách này đúng chứ không may:** nó không đoán ý người vẽ — nó **giải ngược đúng phép biến
đổi mà người vẽ đã áp**. Bằng chứng: bề dày rơi ra `200 · 400 · 100 · 300 · 250 · 220 mm`
(`03_TANG5B-TTT.dxf`, `scripts/proof/tuong-tu-hinh-hoc.ts`) — **đó chính là những con số người vẽ đã
gõ vào `OFFSET`**. Một phép nhận diện sai sẽ cho phân bố tán loạn, không nằm gọn vào các nấc nghề.

**Và nó trung tính theo cấu tạo:** `OFFSET` là lệnh của **mọi** phần mềm CAD, ở **mọi** ngôn ngữ.
Không đọc một tên layer nào ⇒ không nhét chuẩn đặt tên của studio nào vào sản phẩm.
Đo được ở chính bản vẽ này: tường nằm trên `A-Draw` (750 cặp), **không** nằm trên `A-Wall` —
nhận diện bằng tên layer sẽ trượt sạch.

## 3 · AI vẽ CAD thế nào — và đường sai phải tránh

Dòng chính hiện nay (khảo 28/08) là **raster → vector**: CNN/U-Net/FloorNet chạy trên **ảnh** mặt
bằng để tìm **điểm ảnh** là tường, rồi mới trích **trục giữa** và góc để dựng vector.

> ⚠️ **Đó là bài toán IF KHÔNG có.** DXF vào tay IF **đã là vector**, toạ độ chính xác tuyệt đối.
> Đi học lại hình dạng từ điểm ảnh là **vứt bỏ dữ liệu đã chính xác** rồi đoán lại nó.

Điều đáng chú ý: ngay cả dòng CNN, sau khi phân đoạn xong, **vẫn phải trích trục giữa** để ra
vector. Tức **trục giữa là đích đến của cả hai đường** — và IF **tới thẳng được** vì đầu vào đã là
vector.

⇒ **Với đầu vào vector: dùng hình học và đồ thị. Không dùng học sâu.** Rẻ hơn, tất định, giải thích
được từng bước, không cần dữ liệu huấn luyện, và **chạy cục bộ** — đúng nguyên tắc *Own your data*.

Nguồn: [Automated Wall Detection in 2D CAD Drawings](https://www.researchgate.net/publication/362499736_Automated_Wall_Detection_in_2D_CAD_Drawings_to_Create_Digital_3D_Models) ·
[Automatic floor plan analysis 2000–2025](https://www.sciencedirect.com/science/article/abs/pii/S0926580525004182) ·
[Floor Plan Recognition survey 2025](https://dl.acm.org/doi/10.1145/3747227.3747250) ·
[GSDiff vector floorplans](https://arxiv.org/pdf/2408.16258) ·
[AutoCAD LT Quick Start — floor plan](https://www.autodesk.com/learn/ondemand/curated/autocad-lt-quick-start-guide/6zZ5pxqukHxImygpKYeii7) ·
[SourceCAD — floor plan from scratch](https://sourcecad.com/making-a-floor-plan-in-autocad-from-scratch/)

## 4 · Trạng thái · nợ đã khai

`ĐẢO OFFSET` **đã chạy**: 12.274 đối tượng → **972 tường · 1.139 m**
(trước đó cùng tệp cho ra **1 khối sàn**). Mã: `scripts/proof/tuong-tu-hinh-hoc.ts` — **phép thử,
chưa vào sản phẩm**.

`ĐẢO TRIM` **chưa làm**. Đây là lý do 972 tường dài trung bình **1,17 m** — ngắn bất thường.
Nghiệm thu khi làm xong, **tự chấm được, không cần mắt ai**:
**số tường phải GIẢM MẠNH, tổng chiều dài phải GẦN NHƯ KHÔNG ĐỔI.**
Giảm cả hai ⇒ đang **ăn mất** tường. Không giảm ⇒ chưa nối được gì.

`ĐẢO MLINE` (đùn 3D) chưa tới lượt.

## 5 · Áp cho thứ khác

Cùng khuôn đọc-ngược-thao-tác dùng lại được cho phần còn lại của bản vẽ:

| người dùng lệnh | để lại | đảo ngược ra |
|---|---|---|
| `INSERT` block cửa/cửa sổ | cung tròn + khe hở trên tường | **lỗ cửa** + hướng mở |
| `HATCH` | vùng tô kín | **ranh giới phòng** |
| `ARRAY` | n bản sao đều nhau | **một vật + quy luật lặp** |
| `DIM` | đường kích thước | **ý định đo**, không phải hình học |

**Nguyên tắc chung: mỗi lệnh CAD là một phép biến đổi có nghịch đảo. Đọc bản vẽ = giải ngược chuỗi
lệnh mà người vẽ đã chạy.**

## Ảnh đối chiếu — nhìn được bằng mắt

`anh/dao-trim-03_TANG5B.svg` — cùng một bản vẽ, hai trạng thái:
**trên** 972 mảnh rời (mỗi màu = một đối tượng, đó là thứ lệnh `TRIM` để lại) ·
**dưới** 262 bức tường liền sau khi đảo ngược. Tổng chiều dài gần như không đổi
(1139,2 → 1128,9 m) — bằng chứng không ăn mất tường.
