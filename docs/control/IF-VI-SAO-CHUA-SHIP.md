# Vì sao IF chưa ship được — gốc bệnh, khám 28/08/2026

`Plane: IF` · phân luồng: `docs/control/BOS-PHAN-LUONG-TRI-NHO.md`


> Hoà 28/08: *"khám và đọc tìm hiểu ngọn nguồn gốc bệnh một lần và chữa mãi mãi thì IF hay những
> app sau mới ship được."* Đây là lượt khám đó. **Không đọc tài liệu — chạy đúng mã sản xuất trên
> bản vẽ thật của Hoà.**

## Phép khám

`scripts/proof/ti-le-song-sot.ts` — nạp `parseDxfEx()` và `docToObjScene()` **thật**, không mô phỏng.
Bản vẽ: `~/Downloads/BAN-VE/` và `~/Downloads/AI DATA/FILE MBHT/` — hồ sơ thật, không phải fixture.

| Bản vẽ | Đối tượng đọc được | Thời gian | **Khối 3D dựng ra** |
|---|---|---|---|
| `mbbt-tam.dxf` (0,16 MB) | 822 | 65 ms | 1 sàn + **13 tường** |
| `layout.dxf` (0,02 MB) | 182 | 28 ms | **1 sàn. Hết.** |
| `03_TANG5B-TTT.dxf` (5,64 MB) | **12.274** | 3.040 ms | **1 sàn. Hết.** |
| `05_TANG9-TTT.dxf` (9,33 MB) | 10.085 | 1.882 ms | 1 sàn + 3 tường |

**12.274 đối tượng vào — 1 khối ra.** Bộ đọc DXF chạy tốt: 419 ms, không lỗi, không cảnh báo đỏ.
Thứ chết nằm ở bước sau.

## Gốc bệnh

Bản vẽ TTT đặt tên layer **đúng chuẩn nghề**: `A-Wall` · `A-Furniture` · `A-Door` · `A-Window` ·
`A-Column` · `wall-over`. IF **nhận ra** layer tường (`cad-to-obj.ts:460` khớp `/tường|wall/i`).

Nhưng nó chỉ đùn khối khi tường là **HATCH poché**. Nghề vẽ tường bằng **hai đường song song** —
tệp đó có **11.274 `line`**. Và nội thất chỉ dựng được nếu là `BlockEntity` **có tên nằm trong
bảng 46 món dựng sẵn** của IF (`BLOCK_MAP`, `furniture.ts:643`); block tên thật của hồ sơ thì
`blockFootprint()` trả `null` và biến mất.

> ## 🔴 GỐC BỆNH — một câu
> **IF chỉ dựng được từ dữ liệu do chính IF vẽ ra.**
> Nó đòi bản vẽ nói **tiếng của nó**. Hồ sơ nghề nói **tiếng của nghề**. Không ai làm phiên dịch.

## Vì sao nó ẩn suốt 57 ngày

Vì mọi phép thử đều dùng **fixture do IF tự sinh** — tường là hatch, nội thất là block trong bảng.
Trên dữ liệu đó, mọi thứ xanh. `npm test` xanh. 21 máy soi xanh. 1.677 commit.

Đây là **PASS giả ở tầng cao nhất** — cao hơn mọi lỗi `F-01…F-21` đã ghi. Những lỗi cũ là *máy soi
nhìn nhầm ô*. Lỗi này là: **toàn bộ bộ máy nhìn đúng, trên một thế giới không có thật.**

Và nó giải thích mọi thứ còn lại:
· Vì sao 57 ngày, 0 việc nghề.
· Vì sao mắt xích `.idfc → 3D` đứt — **cùng một hình dạng**: `.idfc` cũng không nói được tiếng của
  `BLOCK_MAP` (`docs/design-candidate/IDF-IF-PACKET-003/f3/01-IDFC-TO-3D-GAP.md`).
· Vì sao lời hứa *"một nguồn, nhiều mặt sử dụng"* đúng bên trong mà **không có cửa vào** từ ngoài.

## Chữa mãi mãi — không phải "thêm block"

Thêm 46 → 460 block là vá ca. Ca sau lại một tên khác. Chữa gốc là **đổi cách nghiệm thu**:

> **Mọi cửa vào từ thế giới ngoài phải đo bằng TỈ LỆ SỐNG SÓT, không bằng "có đọc được không".**

`đọc được 12.274 đối tượng` **không phải** thành tựu nếu `dựng ra 1`. Ba luật:

1. **Đo sống sót ở mọi biên.** Mỗi lần nhập: `vào → ra`, theo từng loại. Tỉ lệ dưới ngưỡng ⇒ nói
   với người dùng **cái gì đã mất**, không im lặng thành công.
2. **Fixture phải có bản vẽ THẬT.** Một bộ hồ sơ nghề (đã che tên khách) nằm trong ma trận thử.
   Chỉ chạy trên dữ liệu tự sinh là tự chấm bài của mình.
3. **Nhận diện phải nói được tiếng nghề.** Tường = hai đường song song trên layer tường, **hoặc**
   hatch. Nội thất = block bất kỳ có footprint đóng, không cần nằm trong bảng dựng sẵn.
   Đây là thay đổi **bề mặt người dùng nhìn thấy** ⇒ Design duyệt trước (luật 3).

## Trạng thái

`OBSERVED` — bốn phép đo trên, tái lập được:

```
npx sucrase-node scripts/proof/ti-le-song-sot.ts <đường-dẫn-dxf>
```

`NOT ASSESSED` — hồ sơ có nhập được đúng khi đã sửa hay không; hiệu năng trên tệp 26 MB;
DWG (đang tắt cờ, xem `lib/cad/dwg-flag.ts`).

---

# Chữa thế nào cho TRUNG TÍNH — Hoà chốt 28/08

> *"bởi vì nó phạm luật trung tính … xử sao cho trung tính, không TTT, mà tận dụng lại hết cái
> nó đã làm."*

## 🔴 Luật trung tính nghĩa là gì — Hoà sửa hai lần, ghi lại nguyên văn

> *"luật trung tính dùng để **phân biệt rồi xử lý**, không phải thấy gì sai global là bỏ."*
> *"sai luật ngay từ đầu thì giá trả là đắt."*
> *"đó không phải chuẩn CAD TTT, mà do **máy tự hiểu nhầm cùng một việc**."*

Bản nháp đầu của mục này đã hiểu sai luật theo đúng cách tốn tiền nhất, nên giữ lại làm dấu vết:
tôi viết *"`wallLayerIds()` khớp `/tường|wall/i` là **mầm của lỗi**"* và định gỡ nó.

**Sai.** Nó là **tri thức sản phẩm đặt nhầm tầng** — dùng làm **cổng chặn** trong khi nó chỉ đủ tư
cách làm **gợi ý**. Bản thân nó không có tội, và gỡ nó đi là mất một thứ đúng.

Cũng vậy: chuẩn layer `A-Wall` · `A-Furniture` của TTT **không phải ô nhiễm cần né**. Nó là **dữ
liệu hợp lệ thuộc hồ sơ của TTT**. Trung tính **không** có nghĩa IF không biết gì về TTT; nghĩa là
IF biết mà **cất đúng ngăn**.

| | thuộc về | ở đâu | ai sửa |
|---|---|---|---|
| *"tường thường là hai đường song song"* | **sản phẩm** — đúng với mọi studio | mã | MAIN |
| *"chữ `wall`/`tường` trong tên layer là dấu hiệu tường"* | **sản phẩm**, mức **gợi ý** | mã, nhưng là hint chứ không phải cổng | MAIN |
| *"ở TTT, tường nằm ở `A-Wall`"* | **hồ sơ của TTT** | dữ liệu, theo dự án/studio | người dùng |

Ba dòng đó **không dòng nào bị bỏ**. Phân biệt xong thì mỗi thứ về đúng chỗ — đó là **phân biệt
rồi xử lý**, không phải dọn.

**Điều thật sự sai** không phải một cái tên nào cả. Là: **cùng một việc — "nhận ra tường" — được
nhiều phiên hiểu khác nhau và làm ở nhiều chỗ khác nhau**, rồi bản tốt bị worktree mang ra mang
vào và bị dọn. Cái tên chỉ là chỗ vết nứt lộ ra.

## Ba tầng, trung tính theo cấu tạo

### ① Nhận diện bằng HÌNH, không bằng CHỮ

Tường là **hai đường gần song song, cách nhau trong khoảng bề dày hợp lý, cùng một layer** — đó là
**hình học**, không phải từ vựng. Đúng ở mọi ngôn ngữ, mọi studio, mọi chuẩn đặt tên.

Cùng cách: nội thất là **block có footprint đóng**; cửa là **cung tròn bám vào khe tường**.
Không tên riêng nào tham gia.

### ② Tên layer là DỮ LIỆU của người dùng, không phải mã của IF

IF mở tệp → hiện **layer thật trong tệp đó** kèm số đối tượng và bản xem trước → người dùng gán
vai: *tường · nội thất · cửa · trục · ghi chú · bỏ qua*.

Lưu thành **hồ sơ layer** của dự án/studio, dùng lại lần sau. Mỗi studio **dạy IF chuẩn của mình
đúng một lần**. TTT dạy `A-Wall`; studio Pháp dạy `01_MUR`. **IF không biết trước cái nào, và đó
chính là trung tính.**

⚠️ Đây là **khuôn canonical đã có**: giống hệt cách Brand Kit đọc nhận diện **từ dự án đang mở**
thay vì hardcode. Không đẻ khuôn thứ hai (luật 6).

### ③ Tận dụng lại hết — không vứt gì

| Đang có | Vai mới | Vứt đi? |
|---|---|---|
| `wallLayerIds()` khớp `/tường\|wall/i` | **hạ từ CỔNG xuống GỢI Ý** — điền sẵn ô gán vai, người dùng sửa được | ❌ giữ, không gỡ |
| `BLOCK_MAP` 46 món | **kệ gợi ý** để khớp block lạ với món đã biết | ❌ giữ |
| Đường hatch poché | **một trong hai** đường dựng tường, không còn là đường duy nhất | ❌ giữ |
| Bộ đùn khối, tessellate, `computeHeights` | nguyên vẹn — chúng nhận footprint, không quan tâm footprint từ đâu | ❌ giữ |
| `parseDxfEx` | nguyên vẹn — nó vốn đã đọc được 12.274 đối tượng | ❌ giữ |

**Không dòng nào bị xoá.** Thứ đổi là **cửa vào**, không phải cỗ máy. Đúng luật *"một cỗ máy,
nhiều mặt tiền"* — đây là thêm một mặt tiền cho cỗ máy đã chạy.

## Phân quyền

· ① **hình học** — miền, không nhìn thấy ⇒ MAIN làm được, sau cờ tắt.
· ② **màn gán vai layer** — bề mặt người dùng ⇒ **Design duyệt trước** (luật 3). MAIN chỉ dựng
  phần miền (đọc layer, đếm, lưu hồ sơ), **không tự bịa giao diện**.
· Ngưỡng tỉ lệ sống sót nào là "đạt" ⇒ **chỉ Hoà** — đó là phán đoán nghề.

## Phép thử nghiệm thu — trung tính, đo được

Cùng một bản vẽ, **đổi hết tên layer sang chuỗi vô nghĩa** (`L1` `L2` `L3`…). Nếu tỉ lệ sống sót
**không đổi**, IF đã trung tính thật. Nếu tụt, nó vẫn đang đọc chữ chứ không đọc hình.

Phép thử này phải nằm trong ma trận, chạy mỗi lần đụng bộ nhận diện.
