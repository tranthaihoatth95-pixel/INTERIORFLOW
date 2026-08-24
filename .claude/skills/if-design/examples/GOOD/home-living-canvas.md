# ①-TỐT · HOME — LIVING CANVAS · MỘT NƠI CHỐN CÓ MỘT VIỆC ĐANG CHỜ

**TỐT (hướng đã chốt, chưa có ảnh sản xuất)** · 23/08/2026.

## 🔴 TÌNH TRẠNG BẰNG CHỨNG

| Thứ | Có không |
|---|---|
| Chốt sản phẩm của Hoà | ✅ `docs/design-campaign/dna/HOME-SPEC-2026-08-23.md` |
| Bằng chứng thị giác (ảnh tham chiếu Hoà gửi) | ✅ chưng cất ở `docs/design-campaign/dna/REF-DNA-2026-08-23.md` (S1–S9) — **tôi đọc bản chưng cất, KHÔNG mở ảnh gốc; ảnh gốc không nằm trong repo** |
| Ảnh Home sản xuất đúng hướng này | ❌ **CHƯA CÓ** |
| State B (ảnh phiên dở làm nền) đã dựng | ❌ **chưa có đường chụp nào** — đo 23/08: `snapshotFlow()` ghi FlowVersion, `store.snapshot()` là undo-stack, **cả hai không sinh ảnh** (`BeMatHome.tsx` docstring) |

⇒ Tệp này mô tả **hướng đã chốt + phần đã thi hành được**, không mô tả một màn đã đẹp.
Đừng đọc nó như biên bản nghiệm thu.

## Nhìn thấy gì (mô tả hướng, chưa phán xét)

Một mặt phẳng nền chiếm trọn màn. Trên nó:

- **Một vùng lớn, lệch trục** — việc đang dở. Ít chữ: tên dự án · vị trí trong việc ·
  *lần cuối 17:42* · một nút **Tiếp tục** · vài tín hiệu (*2 bình luận mới*, *1 mục chờ duyệt*).
- **Một cột hẹp hơn hẳn** bên cạnh — các mục **cao đúng nội dung**, xếp theo thứ tự ưu tiên.
  Các mục ở đây **không có vỏ thẻ**: chữ và một đường tóc, đứng thẳng trên nền.
- Mép trên: **một viên** — Vitals, gọn khi nghỉ.
- Phần dư của màn: **để trống**, thuộc về nền.

Ở trạng thái đích (**State B**), nền không phải hoạ tiết — nền là **ảnh chụp chính phiên
làm việc đang dở**: đúng viewport 3D, hoặc đúng khung CAD, hoặc đúng canvas Present.

## VIỆC CON NGƯỜI được phục vụ

| Việc | Bề mặt trả lời thế nào |
|---|---|
| *tôi đang dở cái gì* | nó **là nền của cả màn** — không phải một thẻ phải đi tìm |
| *quay lại ngay* | một nút. Bấm: Home tan, workspace sống lại **đúng state** |
| *có gì cần tôi không* | vài tín hiệu ngắn cạnh tiêu điểm, chỉ khi **có thật** |
| *hôm nay thế nào* | cụm phụ, theo thứ tự ưu tiên, mục nào không có dữ liệu thì **biến mất** |
| *liếc thứ cá nhân* | tầng 2, vùng phụ, **liếc + thao tác nhanh** — không dựng lại Spotify |

Cửa loại bỏ, nguyên văn chốt 23/08:

> widget nào khiến người dùng **ở lại Home lâu** mà không giúp *hiểu tình hình · bắt đầu ·
> tiếp tục · quyết định · giảm chuyển ngữ cảnh* thì **không được ưu tiên**.

## NGUYÊN TẮC có mặt

| # | Nguyên tắc | Nguồn | Ngày |
|---|---|---|---|
| 1 | **Một tiêu điểm + một cụm phụ**; phần dư trả về cho nền | `components/home/xuong-layout.ts:9-18` | 20/08 |
| 2 | **Vị trí tiêu điểm KHÔNG đổi giữa A/B/C** — một không gian đang lớn lên | `xuong-layout.ts:19-26` | 20/08 |
| 3 | *"Cỡ card = mức quan trọng"* — editorial có trọng lượng | `HOME-SPEC-2026-08-23.md` §Bố cục | 23/08 |
| 4 | State B: snapshot phiên dở làm **toàn bộ nền**, rất ít chữ | `HOME-SPEC` §Năm trạng thái | 23/08 |
| 5 | Vitals **không được nói chỉ để chứng minh nó tồn tại** | `HOME-SPEC` §Vitals | 23/08 |
| 6 | Nội dung **đứng thẳng trên môi trường, không vỏ thẻ** (S1 — đặc điểm lặp mạnh nhất bộ ảnh) | `REF-DNA` S1 | 23/08 |
| 7 | Thứ bậc bằng **kích thước + độ trong**, không bằng màu hay khung | `REF-DNA` S2 | 23/08 |
| 8 | **Khoảng trống cực lớn** là lựa chọn, không phải thiếu nội dung | `REF-DNA` S4 | 23/08 |
| 9 | Kính **phẳng, mỏng** (G1/G2) — bộ ảnh **không có G3 khối dày nào** | `REF-DNA` S7 | 23/08 |
| 10 | Nền để **NÉT**; chữ đọc được nhờ **lớp phủ chuyển sắc CỤC BỘ** đúng dải có chữ | chốt A2 16/08, thi hành `PhuChanChu` trong `BeMatHome.tsx` | 16/08 |

## GIÁ TRỊ NẰM Ở ĐÂU — cơ chế, không phải hình thức

### ① Nền LÀ việc — chỗ IF hơn hẳn tham chiếu

Ảnh tham chiếu (`FUJI`, `HK`) dùng **ảnh phong cảnh** làm nền. Đẹp, nhưng nền chỉ là trang trí.

IF dùng **công việc của chính người dùng** làm nền.

> **Nền không trang trí. Nền LÀ việc.**

Hệ quả cơ chế: cái vòng luẩn quẩn của cặp XẤU bị cắt tận gốc. Ở đó, *việc đang dở* phải cạnh
tranh chỗ đứng với sáu widget khác, và thua vì nó nói ngắn. Ở đây nó **không cạnh tranh** —
nó là mặt phẳng mà mọi thứ khác đứng lên. **Không có cách nào để nó bị chìm.**

### ② Thứ bậc bằng chất liệu, không bằng cỡ khung

Ba vai đã thi hành trong mã (`VaiO`): `hero` · `chinh` · `phu`, trong đó **`phu` = không vỏ**.

Vì sao không chọn *"vỏ nhạt hơn"*: thẻ nhạt đặt cạnh thẻ đậm **vẫn là tường thẻ** — mắt vẫn
đếm ra N khung chữ nhật. Bỏ hẳn vỏ thì số khung **giảm thật**, không giảm giả.

Truyền vai bằng **context** (`VaiOProvider`), không bằng prop. Lý do có sức nặng: 12 nơi gọi
`WidgetCard` nằm trong 10 tệp widget, mà **vai là quyết định của BỐ CỤC, không phải của
widget**. Xâu prop qua 10 tệp là bắt chúng biết một thứ không phải việc của chúng — và là
12 chỗ có thể quên.

### ③ Cỡ ô là BIẾN, không phải hằng

Widget khai bằng **số ô** (`2x2`/`2x1`/`1x1`), cấm px — khai theo ô thì lưới hẹp lại trên
tablet/điện thoại là chúng **tự xếp lại**, cùng một widget chạy được cả ba nền.

Nhưng số ô phải **nhường ruột**: `DuKienHome.heroDayRuot` — hero mỏng thì `2x2` tụt `2x1`
**ngay tại nguồn cấp cỡ**, không vá ở nơi vẽ. Và **không tụt xuống `1x1`**: hero vẫn phải là
hero, chỉ thôi đòi một khung mà nó không lấp nổi.

> **Ô là ĐƠN VỊ ĐO, không phải KHUÔN ĐÚC.**

### ④ Năm trạng thái, một không gian

Home là **bề mặt có trạng thái**, không phải một màn cố định: A First Use · B Return ·
C Start of Day · D Active Work · E End of Day.

Điểm ăn tiền nằm ở ràng buộc **vị trí tiêu điểm không đổi**. Nếu tiêu điểm nhảy chỗ theo
trạng thái thì người dùng học năm bố cục. Giữ nguyên chỗ thì họ học **một nơi chốn** — và
mỗi lần mở, thứ họ tìm đã ở chỗ cũ.

### ⑤ Cổng FAIL-CLOSED cho thứ chưa dựng được

State B muốn ảnh phiên dở. Đường chụp **chưa có**. Cách xử đúng đã thi hành:
**không giả vờ có** — rơi về nền môi trường theo giờ, và khai thẳng trong docstring rằng
prop `anhPhien` đang trống.

> *Nghi ngờ thì không chụp; không đạt thì rơi về nền môi trường.*

Đây là thứ đáng học nhất trong cả tệp: một trạng thái **chưa dựng được** vẫn phải có hành vi
được thiết kế, chứ không phải một ô trống chờ ai đó lấp bừa. Đúng cơ chế ① của cặp XẤU.

## KHÔNG ĐƯỢC CHÉP GÌ

- ⛔ **Đừng chép "chữ số khổng lồ trong suốt" (S2) vào Home.** Đó là đặc điểm của **màn khoá**
  — nơi có đúng một thông tin. Home có nhiều thông tin; một chữ số 40-55% bề ngang ở đó là
  chiếm chỗ mà không mang tin. Lấy **nguyên tắc** (thứ bậc bằng kích thước + độ trong), đừng
  lấy **hình**.
- ⛔ **Đừng chép "đơn sắc, không accent nào" (S3) thành luật toàn app.** `REF-DNA` §4 tự khai
  đây là chỗ bộ ảnh **mâu thuẫn nội bộ** (`BOARD-A` có nút xanh, `ARCH` có tím). IF có màu
  nhấn, và màu ở IF **mang nghĩa**.
- ⛔ **Đừng đọc "không vỏ thẻ" thành "cấm mọi vỏ".** Vai `hero` và `chinh` **có vỏ**. Bỏ vỏ
  toàn bộ thì mất luôn thứ bậc — đổi một lỗi lấy lỗi ngược lại.
- ⛔ **Đừng chép "khoảng trống ~20% có nội dung" (S4) làm chỉ tiêu.** Đó là số đo của một ảnh
  khoá màn. Nó chứng minh *màn rất trống vẫn sang*, không đặt ra một tỉ lệ phải đạt.
- ⛔ **Đừng coi tệp này là nghiệm thu.** Chưa có ảnh sản xuất. Nó là **hợp đồng về hướng**,
  và phải đi qua `checks/visual-review-checklist.md` như mọi thứ khác.
- ⛔ **Đừng chép ba vai `hero/chinh/phu` sang bề mặt không phải Home mà chưa hỏi lại.** Vai là
  lời giải cho *"nhiều vật ngang trọng lượng"*. Bề mặt chỉ có một vật thì ba vai là thừa.

## NGUYÊN TẮC THAY THẾ ĐÚNG — bốn câu mang đi được

1. **Nền LÀ việc.** Thứ người dùng đang làm là mặt phẳng, không phải một thẻ trên mặt phẳng.
2. **Một tiêu điểm, một cụm phụ, và tiêu điểm không nhảy chỗ.**
3. **Thứ bậc: chất liệu trước, cỡ sau.** Ít nhất một vai không có vỏ.
4. **Phần dư trả về cho nền** — màn rộng thêm thì khoảng âm lớn thêm, không phải thẻ dãn thêm.

Đối chiếu: `BAD/home-tuong-the-23-08.md`.
