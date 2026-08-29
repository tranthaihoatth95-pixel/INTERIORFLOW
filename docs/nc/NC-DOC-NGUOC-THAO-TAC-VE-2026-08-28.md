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

> 🔴 **HAI ĐOẠN DƯỚI ĐÂY LÀ TRẠNG THÁI NGÀY 28/08, NAY ĐÃ CŨ.** `ĐẢO TRIM` đã làm, và cả bộ đã vào
> mã sản phẩm ngày 29/08 — xem mục **IF-301** ở cuối tệp. Con số `972`/`1.139 m` cũng đã bị chính
> mục đó bác: chúng tính trên bản còn con bọ `e.pts` (bỏ sạch cạnh polyline) và trước khi có ghép
> đôi độc quyền. Giữ nguyên chữ ở đây làm lời chứng, KHÔNG dùng làm số hiện hành.

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

## ĐẢO ARRAY — bậc thang không phải tường (29/08)

`anh/dao-3-buoc-03_TANG5B.png` — ba bước trên cùng một góc mặt bằng.

Ảnh phơi ra lỗi mà **số đo không thấy được**: khối bậc thang bị đọc thành ~112 bức
tường sát nhau. Chữ ký hình học của nó, **không đọc tên layer**: ≥4 trục song song
cách đều nhau bước 200–400mm — đó là dấu tay của lệnh `ARRAY`/`OFFSET` lặp.

    262 → 144 tường · 1129 → 990 m   (loại 118 vật bước đều, 139 m)

**PHÉP THỬ ĐỘC LẬP, không cố ý dựng ra:** máy loại **105/112** vật nằm trên layer
tên `E-Stair` mà **chưa từng đọc chữ "Stair"**. Hình học và tên người vẽ đặt trùng
khớp nhau — hai nguồn độc lập cùng chỉ một chỗ. Đây là kiểu bằng chứng mạnh hơn
"chạy ra số đẹp", vì nó không thể dàn xếp được.

### Thử thứ ba ĐÃ TRƯỢT — bỏ trục chồng

Còn 728 cặp trục chồng nhau (một tường 3–4 nét: hai mặt kết cấu + nét trát ⇒ ghép
mọi cặp thì một tường đẻ nhiều trục). Thử luật *"giữ trục dày nhất trong chùm"*:

    144 → 52 tường · 990 → 260 m       ⇒ MẤT 74% chiều dài

Đúng cái nghiệm thu đã đặt ra bắt được: **giảm cả hai là đang ăn mất tường.**
Nguyên nhân: xếp theo bề dày trước khiến một trục 400mm dài nuốt trọn các tường
200mm nằm cùng đường. **Không nhận, không đưa vào mã.** Luật đúng phải là *cặp
NGOÀI CÙNG của một chùm nét*, không phải *trục dày nhất trong vùng*.

## Hoà bắt lỗi bằng MẮT: "bị sai" (29/08)

Anh phóng to ảnh và chỉ ra: cái tưởng là **một bức tường liền** thật ra là **nhiều
vật xếp đè lên nhau**. Số đo không thấy được điều đó — 262 vật với 1129 m trông
hoàn toàn hợp lý.

**Nguyên nhân:** tôi ghép **mọi cặp nét** thoả điều kiện. Một bức tường thợ vẽ
3–4 nét (hai mặt kết cấu + nét trát/ốp) ⇒ đẻ ra 6 trục chồng nhau. Chính vì thế
1129 m là **con số bị thổi phồng**, không phải chiều dài tường thật.

**Sửa — GHÉP ĐÔI ĐỘC QUYỀN:** một nét chỉ là mặt của MỘT bức tường. Xếp cặp ứng
viên theo độ **khớp chiều dài** (`OFFSET` sinh ra bản sao dài bằng nhau), duyệt
lần lượt, chỉ nhận khi **cả hai nét còn tự do**.

    1062 cặp ứng viên → 332 mảnh (dùng 664/996 nét) → ĐẢO TRIM → 119 tường · 405 m

`anh/ghep-doi-doc-quyen.png` — panel ② cho thấy tường biên nay là **một vệt màu
chạy suốt**, hết vụn theo chiều dài.

**CÒN SAI, chưa chữa:** nhìn kỹ vẫn thấy **3–4 vệt song song trên cùng một bức
tường** — tường nhiều nét vẫn tách thành mấy cặp rời. Luật đúng còn thiếu:
gom chùm trục song song chồng nhau rồi lấy **BAO NGOÀI** của chùm (bề dày = khoảng
cách hai nét ngoài cùng), chứ không phải giữ trục dày nhất — bản "giữ dày nhất"
đã thử và **trượt nghiệm thu** (mất 74% chiều dài, ghi ở mục trên).
⇒ Mọi con số tổng chiều dài hiện nay vẫn **chưa dùng để kết luận được**.


## Câu hỏi "ba nét song song" — ĐÃ TRẢ LỜI, và câu hỏi đó SAI ĐỀ (29/08)

Tôi từng định hỏi người trong nghề: *ba nét song song cách 350–400mm, chạy suốt 17–18m, là một
tường có lớp hay nhiều vách?* Khám bằng mẫu CAD thật cho ra: **cả hai đều sai, vì đó không phải
tường.**

**Đo được:** không phải 3 nét mà là **7 nét** thẳng đứng cùng layer `A-Draw`, bước
`100 · 200 · 200 · 200 · 200 · 200 mm`. Mỗi nét không liền — nó là **chuỗi nét đứt lặp y hệt:
1150mm đặc + 350mm hở, lặp 13–14 lần suốt 20m**.

**Ba con số tôi đưa ra (195.719 / 196.069 / 196.469) KHÔNG phải toạ độ nét gốc** — chúng là
**trung điểm của ba cặp** do chính bước ghép đôi của tôi tính ra. Tôi hỏi về sản phẩm của máy
mình rồi tưởng đang hỏi về bản vẽ.

**Ba bằng chứng phủ định, đo trong hộp bao quanh cụm:**
`DIMENSION` bao trùm cả cụm = **0** · `HATCH` lấp khe giữa các nét = **0** · đường bao phòng khép
kín lấy một trong các nét làm biên = **0**. Và layer `A-Wall` trong toàn dải cạnh này = **0 nét**
— người vẽ **chưa từng định danh chỗ này là tường**.

⇒ Đây là **hoạ tiết vẽ bằng `OFFSET` + `ARRAY`** (nhiều khả năng là nan đứng mặt kính). Chữ ký:
bước cách đều tuyệt đối + cùng một nét đứt căn khớp nhau suốt 20m. Vách thật không lặp đều tuyệt
đối và không dùng chung một nét đứt căn khớp.

**Điều đáng giá nhất: `ĐẢO ARRAY` đã tự loại đúng cụm này rồi** — nhật ký ghi *"loại 52 đối tượng
bước đều (65 m) ⇒ KHÔNG phải tường"*. Tức máy đã đúng ở chỗ tôi tưởng nó sai, và tôi suýt đi hỏi
người dùng một câu vô nghĩa dựa trên số liệu của chính mình.

**Bài học, cùng họ với [[M-59]]:** trước khi mang một "phát hiện" đi hỏi ai, phải kiểm nó có phải
**dữ liệu gốc** hay chỉ là **đầu ra trung gian của chính mình**. Con số đi qua ba bước xử lý thì
nó nói về ba bước đó, không còn nói về bản vẽ.

**Còn mở:** trường hợp CHUNG (3 nét 350–400mm trên layer `A-Wall` thật) **chưa có mẫu để khám** —
mẫu này không khớp mô tả đó về cả bề dày lẫn layer.

---

## IF-301 — THUẬT TOÁN ĐÃ VÀO MÃ SẢN PHẨM (29/08)

Engine nằm ngoài đường thi công thì bằng không. `scripts/proof/tuong-tu-hinh-hoc.ts` chạy được từ
28/08 nhưng **chưa có ai gọi tới**; nay nó đã ở trong sản phẩm:

| chỗ | việc |
|---|---|
| `lib/cad/tuong-hinh-hoc.ts` | thuật toán 4 bước + cờ + hàm đưa tường vào bản vẽ |
| `lib/cad/dxf-worker.ts` | **ĐIỂM GỌI DUY NHẤT**, ngay sau `parseDxfEx()` |
| `lib/cad/tuong-hinh-hoc.test.ts` · `lib/cad/dxf-worker-tuong.test.ts` | 45 phép, có ca DƯƠNG (F-17) |
| `scripts/proof/tuong-tu-hinh-hoc.ts` | không còn giữ thuật toán — **gọi module**, chỉ in số + vẽ SVG |

Cờ `NEXT_PUBLIC_IF_TUONG_HINH_HOC`, **mặc định TẮT**. Tắt ⇒ `doc` và báo cáo trả ra trùng khít
`parseDxfEx()` trần (khoá bằng test, so cả hai chuỗi JSON).

**Vì sao gọi ở `dxf-worker.ts` chứ không trong `parseDxfEx`:** đó là chỗ DUY NHẤT một tệp DXF *của
người dùng* đi vào app (`dxf-open.ts` đẻ worker này). `parseDxfEx` còn ~15 nơi khác gọi để đọc
block/thư viện/roundtrip — cắm thêm một tầng suy diễn ở đó là đổi hành vi của những đường chẳng
liên quan. Worker lại đang nắm luồng riêng nên 23 ms/12.274 entity không đụng vào giao diện.

**Tường sinh ra là entity tường THẬT của IF** — hatch poché + đường bao, dựng bằng đúng khuôn
canonical `commands.ts` `wallSegmentOutline` (B25 REUSE, không đẻ khuôn thứ hai), nên 3D/BOQ/kiểm
chuẩn thấy được ngay. **THÊM chứ không thay thế:** nét gốc của người vẽ giữ nguyên vẹn (K3).

### 🔴 CON BỌ IM LẶNG trong chính phép thử: `e.pts` ≠ `e.points`

Phép thử gốc đọc `e.pts` để bung cạnh polyline. Model của IF đặt tên field là **`points`**
(`model.ts` `PolylineEntity`). Nên nó bỏ sạch **1.858 cạnh polyline** của `03_TANG5B-TTT.dxf` —
không nổ, không cảnh báo, chỉ **ra ít tường hơn**. Mọi con số công bố trước 29/08 (996 nét · 332
mảnh · 119 → 67 → 64 tường) đều tính thiếu vì lý do này, không phải vì thuật toán.

Đây đúng là **lớp lỗi B**: đúng thao tác, sai đối tượng. Và nó lọt được vì phép thử đứng RIÊNG,
không dùng chung kiểu với mã sản phẩm. Bản trong `lib/` đọc `Doc` có kiểu ⇒ tsc bắt được ngay nếu
gõ sai tên field. Đó là lý do thứ hai để đưa engine vào sản phẩm, ngoài lý do "để có ai gọi tới".

### Số đo sau khi sửa — `03_TANG5B-TTT.dxf`, 12.274 entity, 23 ms

```
nét thẳng > 300mm                                          1.347
① ĐẢO OFFSET   1.258 cặp ứng viên  →   390 mảnh   (ghép đôi ĐỘC QUYỀN)
② ĐẢO TRIM       390 mảnh          →   165 tường liền
③ ĐẢO ARRAY    loại 81 vật bước đều →    84 còn lại
④ GỘP CHÙM        84 trục          →    81 tường (BAO NGOÀI)
⇒ 81 TƯỜNG · 286,0 m
   bề dày: 200mm×35 · 100mm×18 · 300mm×12 · 220mm×5 · 250mm×2 · 150mm×1 · 400mm×1
```

Bảng bề dày vẫn rơi đúng các **nấc nghề** `200 · 100 · 300 · 400` — chính những con số người vẽ đã
gõ vào `OFFSET`. Nhận diện sai sẽ cho phân bố tán loạn; đây là phép tự chấm không dàn xếp được.

Đối chiếu mốc cũ: **1 khối sàn → 81 bức tường có trục và bề dày.**

### CÒN NỢ, đã khai

- **`E-Stair`×12 vẫn lọt** vào danh sách tường. `ĐẢO ARRAY` loại 81 vật bước đều nhưng phần thang
  không xếp đủ đều thì vẫn qua. Chưa có luật thứ hai cho thang; **không** định chữa bằng cách đọc
  tên layer (LUẬT NỀN TẢNG §1).
- **Chưa có ai ĐỌC `report.tuongHinhHoc`.** Trường số đo đã có kiểu và đã được worker gắn vào, nhưng
  nơi hiện nó cho người dùng nằm ở `components/` — ngoài vùng ghi của phiên này.
- `ĐẢO MLINE` (đùn khối 3D từ trục + bề dày) chưa tới lượt.
