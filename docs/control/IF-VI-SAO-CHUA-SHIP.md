# Vì sao IF chưa ship được — gốc bệnh, khám 28/08/2026

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
