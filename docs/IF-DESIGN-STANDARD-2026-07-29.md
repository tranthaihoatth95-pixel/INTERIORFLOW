# IF — Chuẩn thiết kế giao diện (tư liệu làm việc cho Cowork + Claude Code)

> Hoà yêu cầu: nghiên cứu sâu graphic · UX/UI · Apple design system · các sản phẩm nổi trội, để
> Cowork lấy làm **tư liệu thiết kế**, bớt cảm giác AI. Đây là file đó — dùng làm chuẩn cho mọi
> đề xuất giao diện IF về sau, cả tôi lẫn Claude Code.

---

## 1. Vì sao thiết kế "có mùi AI" — 10 tật, và luật chữa

Không phải "AI vẽ xấu". Là **AI vẽ đều** — mà đều thì chết. Dưới đây là 10 dấu vết cụ thể, mỗi cái
kèm luật chữa lấy từ Swiss Style hoặc Apple HIG.

| # | Tật | Vì sao trông giả | Luật chữa |
|---|---|---|---|
| 1 | **Mọi khoảng cách bằng nhau** (12px khắp nơi) | Mắt không nhóm được cái gì với cái gì | **Luật gần-xa**: khoảng trong cụm phải nhỏ hơn khoảng giữa cụm **≥2 lần**. 4px trong · 16px ngoài |
| 2 | **Mọi thứ cùng bo góc** | Không phân biệt được lớp vật liệu | Chỉ **3 bậc bo góc**, mỗi bậc một vai trò (xem §3) |
| 3 | **Căn giữa mọi thứ** | Mất trục đọc, mất nhịp | Swiss: **flush-left, ragged-right**. Căn giữa chỉ dùng cho tiêu đề đơn độc hoặc trạng thái rỗng |
| 4 | **Đổ bóng mềm khắp nơi** | Mọi phần tử đòi nổi lên = không cái nào nổi | Apple **Deference**: *"giao diện phục vụ nội dung, không tranh với nó"*. Bóng chỉ cho lớp thật sự nổi (popover, panel trôi) |
| 5 | **Gradient tím / màu trang trí** | Chữ ký của AI slop | Swiss: bảng màu **hạn chế**, tương phản mạnh **dùng dè**. IF: `#6a57f5` **chỉ** cho "đang chọn" và "hành động chính" |
| 6 | **Thang chữ tuỳ tiện** (13, 12, 11, 10.5 lẫn lộn) | Không có hệ, mắt thấy lộn xộn | **Thang modular** cố định (§2) |
| 7 | **Italic làm trang trí** | Italic có nghĩa ngữ pháp, không phải nghĩa "cho mềm" | Muốn chìm thì **giảm sắc độ**, đừng nghiêng chữ |
| 8 | **Icon trôi nổi**, không thuộc lưới nào | Icon và chữ như 2 mảnh dán cạnh nhau | Icon phải **chia trục** với khối chữ — cùng baseline hoặc cùng cạnh trái |
| 9 | **Nhãn spec lọt vào UI** (`span 4`, `nhóm`) | Bản nháp đem đi trình | Xoá sạch trước khi trình. Không có ngoại lệ |
| 10 | **Hộp lồng hộp** thay cho khoảng trắng | Viền là cách lười để phân vùng | Swiss: **khoảng trắng là thành phần chủ động**. Ưu tiên khoảng trắng → hairline → mới tới viền hộp |

**Một câu tóm lại**: thiết kế thật có **chỗ đậm chỗ nhạt, chỗ chật chỗ thoáng, có đúng một điểm
nhấn**. Thiết kế AI thì mọi thứ ngang nhau, cùng độ mềm, cùng độ tròn, cùng độ quan trọng.

---

## 2. Thang chữ — 7 bậc, không hơn

Apple: *"Đừng thêm typeface thứ hai — SF Pro tự gánh toàn bộ phân cấp"*. IF cũng vậy: **chỉ
Be Vietnam Pro**, phân cấp bằng **cỡ + sắc độ + tự dạng (tracking)**, không bằng font thứ hai.

| Bậc | px | Weight | Tracking | Dùng cho |
|---|---|---|---|---|
| **Display** | 20 | 600 | −.02em | tiêu đề màn hình, tên công cụ đang mở |
| **Title** | 15 | 600 | −.01em | tên nhóm, tên panel |
| **Body** | 13 | 400 | 0 | nội dung chính, tên node trong danh sách |
| **Body nhấn** | 13 | 500 | 0 | dòng đầu danh sách, mục đang chọn |
| **Caption** | 11.5 | 400 | 0 | mô tả phụ, câu hỏi dẫn của nhóm |
| **Micro** | 10.5 | 500 | +.02em | số đo, đơn vị, credit |
| **Eyebrow** | 9.5 | 700 | **+.10em** | nhãn mục nhỏ VIẾT HOA (`VÙNG CẦN SỬA`) |

**Luật**: không dùng cỡ nào ngoài 7 bậc này. Cần nhấn thì đổi **weight hoặc sắc độ**, không đẻ thêm
cỡ. Chữ số đo dùng `font-variant-numeric: tabular-nums` để cột số thẳng hàng.

### Sắc độ chữ — 4 bậc, đúng token IF

`--t1` chính · `--t2` phụ · `--t3` chìm · `--t4` rất chìm. **Luật**: mỗi cụm chỉ được có **tối đa 4
bậc sắc độ**. Bốn bậc trong một cụm là dấu hiệu đang cố nhấn quá nhiều thứ.

---

## 3. Khoảng cách & bo góc

**Thang khoảng cách — bội số 4** (Apple: lưới 8pt, chia nhỏ 4pt):

`4 · 8 · 12 · 16 · 24 · 32 · 48`

| Khoảng | Dùng cho |
|---|---|
| 4 | giữa 2 dòng dính nhau (số ↔ tên nhóm) |
| 8 | trong 1 hàng danh sách |
| 12 | giữa các hàng trong cùng danh sách |
| 16 | giữa icon và khối chữ |
| 24 | giữa cụm tiêu đề và danh sách |
| 32–48 | giữa 2 nhóm lớn |

**Bo góc — đúng 3 bậc**, mỗi bậc một vai trò:

| Bán kính | Vai trò |
|---|---|
| **6px** | điều khiển nhỏ: nút, ô nhập, swatch, chip |
| **10px** | tấm/panel: thẻ nội dung, popover |
| **999px** | pill: thanh công cụ nổi, thẻ trạng thái |

Không dùng 9, 11, 12, 14. Bốn bán kính khác nhau trên một màn = mắt thấy lộn xộn dù không chỉ ra được vì sao.

**Vùng chạm ≥44×44px** — Apple HIG, giữ ở **mọi** dải màn kể cả desktop.

---

## 4. Bố cục — Swiss, không phải bootstrap

Rút từ International Typographic Style (Müller-Brockmann · Helvetica/Univers/Akzidenz):

1. **Lưới là xương, không phải gợi ý.** Mọi thứ hàng theo một trục trái chung. Icon cũng phải hàng.
2. **Bất đối xứng có chủ đích** tạo nhịp; đối xứng tạo tĩnh (và buồn ngủ).
3. **Flush-left, ragged-right.** Không justify (thủng chữ), không căn giữa hàng loạt.
4. **Khoảng trắng là thành phần chủ động** — nó *làm việc* (phân nhóm), không phải chỗ trống còn thừa.
5. **Ảnh là dữ kiện, không phải trang trí** — không crop điệu, không filter làm đẹp. Với IF: ảnh
   render là **bằng chứng công việc**, phải hiện đúng màu đúng tỉ lệ.
6. **Màu hạn chế, tương phản dùng dè** — nhấn bằng vị trí và khoảng trắng trước, bằng màu sau cùng.

---

## 5. Ba nguyên tắc Apple — dịch sang việc IF

| Nguyên tắc | Nghĩa gốc | Áp vào IF |
|---|---|---|
| **Clarity** | rõ, chính xác, dễ hiểu | Tên node phải nói **việc người dùng làm**, không nói tên model (`Cắt nền`, không phải `BiRefNet v2`) |
| **Deference** | *giao diện phục vụ nội dung, không tranh với nó* | Chặng 2: **ảnh chiếm sân khấu**, điều khiển lùi về thanh. Đây là luật tôi vi phạm ở bản bento — và là lỗi nặng nhất |
| **Depth** | lớp và chuyển động tải phân cấp | Panel trôi có bóng; nội dung phẳng thì **không** bóng. Chuyển động chỉ để nói *cái gì đến từ đâu* |

Apple 2025 thêm **Liquid Glass** — vật liệu trong mờ, khúc xạ nền, *"nhường chỗ cho nội dung"*.
IF đã đi đúng hướng này ở `CadToolbar` (`backdrop-filter: blur(18px) saturate(1.4)`) — **dùng lại
đúng công thức đó** cho mọi thanh nổi, đừng chế công thức mới.

---

## 6. Công thức cụm tiêu đề nhóm — bản sửa cho "01 · Ý TƯỞNG"

Chỗ Hoà chỉ ra: cụm này **rời rạc** — icon trôi trên đầu, số nhỏ màu tím như đồ trang trí, câu hỏi
in nghiêng vô cớ, không có gì nối 4 mảnh lại.

### Cấu trúc mới — icon và chữ là MỘT khối ngang

```
┌────────┐   01                            8
│  nét   │   Ý TƯỞNG · Ideate
│  vẽ    │   Làm theo gu gì?
└────────┘
────────────────────────────────────────────   ← hairline: hết cụm tiêu đề
   Rút gu · Gu Reference                 ẩn
   Moodboard · Moodboard Gen             ẩn
   ⋮ (chìm dần, cuộn được)
```

**Từng quyết định và lý do:**

| Quyết định | Lý do |
|---|---|
| Icon **bên trái**, cùng khối ngang với chữ | Icon-trên-chữ là 2 mảnh dán cạnh nhau; icon-trái-chữ-phải chia **chung một trục ngang** → thành 1 cụm (tật #8) |
| Icon **không có khung, không nền** | Khung icon là hộp thừa (tật #10) |
| Số `01` là **eyebrow 9.5px, tracking .10em, màu `--t4`** — không phải màu tím | Số là **mốc thứ tự**, không phải điểm nhấn. Tím dành cho "đang chọn" (tật #5) |
| Tên nhóm là **Title 15/600**, tên Anh nhỏ hơn 1 bậc + chìm 1 bậc, cùng dòng | Một dòng = một đơn vị nghĩa. Song ngữ theo Luật thoại #1 (Việt dẫn · Anh theo) |
| Câu hỏi là **Caption 11.5, `--t3`, KHÔNG nghiêng** | Muốn chìm thì giảm sắc độ (tật #7) |
| Khoảng: số→tên **4px**, tên→câu hỏi **4px**, cụm→hairline **16px**, hairline→danh sách **8px** | Luật gần-xa: 4 trong · 16 ngoài = tỉ lệ 4× (tật #1) |
| **Hairline** dưới cụm tiêu đề | Đây là "liên kết" thật: một đường nói *tiêu đề hết ở đây, danh sách bắt đầu* — rẻ hơn và sạch hơn viền hộp |
| Số đếm node căn phải, **Micro 10.5 tabular** | Thông tin phụ, đặt ở rìa, không tranh chỗ |

---

## 7. Hệ minh hoạ nét — quy chuẩn (gộp từ doc trước, bổ sung)

| Hạng mục | Quy định |
|---|---|
| Kỹ thuật | SVG inline, `stroke-width: 1.5`, `fill: none`, màu bằng token → tự theo sáng/tối |
| Màu | nét chính `--t2` · nét phụ `--t4` · **đúng một** điểm `--accent` cho phần "AI làm gì" |
| Nội dung | Vẽ **phép biến đổi**, không vẽ căn phòng đẹp |
| Khung | **không có** — nét nằm trực tiếp trên nền |
| Cấm | không gradient · không bóng · không icon mua sẵn · không hình khối bo tròn đều nhau |

### Bốn icon nhóm — ngôn ngữ hình riêng

| Nhóm | Hình | Vì sao |
|---|---|---|
| 01 · Ý tưởng | **ảnh xé dán chồng lệch góc + hàng swatch** | Moodboard là *nhiều mảnh ảnh ghép + mẩu màu*. (Vòng tròn lồng nhau bản cũ là **biểu đồ Venn / lý thuyết màu** — sai tinh thần, Hoà chỉ đúng) |
| 02 · Dựng | khối hộp phối cảnh + chấm máy ảnh, có nét đứt từ bản vẽ | Từ 2D dựng lên 3D, có góc máy |
| 03 · Sửa | khung ảnh + vùng chọn nét đứt + con trỏ + thanh trượt | Chọn một vùng rồi chỉnh |
| 04 · Xuất | nhiều tờ xếp lớp + mũi tên ra | Nhiều trang thành một bộ, đi ra ngoài |

---

## 8. Danh sách chìm dần — vì sao đúng

Hoà đề xuất: dòng gần icon rõ, dòng dưới chìm dần vào nền, cuộn được. Đây là mẫu **fade-out
scroll mask** — và nó đúng vì 3 lý do:

1. **Nói "còn nữa" mà không cần thanh cuộn** — thanh cuộn là chrome, mask là nội dung (Deference).
2. **Tạo chiều sâu thật** thay vì bóng đổ giả (Depth).
3. **Phân cấp bằng sắc độ** — đúng luật "muốn chìm thì giảm sắc độ, đừng nghiêng chữ" (tật #7).

Kỹ thuật: `mask-image: linear-gradient(180deg, #000 0, #000 24%, rgba(0,0,0,.55) 58%,
rgba(0,0,0,.16) 88%, transparent 100%)` + `scrollbar-width: none`. Mask **neo vào khung**, không
neo vào nội dung — nên khi cuộn, dòng đi lên thì sáng dần, đi xuống thì chìm dần. Đó là chỗ "xịn".

---

## 9. Danh sách kiểm trước khi trình bất kỳ giao diện nào

- [ ] Chỉ dùng **7 bậc chữ**, **7 bậc khoảng cách**, **3 bậc bo góc**?
- [ ] Khoảng cách **trong cụm** nhỏ hơn **giữa cụm** ≥2 lần?
- [ ] Mỗi cụm **≤3 bậc sắc độ** chữ?
- [ ] Màu nhấn xuất hiện ở **đúng 1 vai trò** (đang chọn / hành động chính)?
- [ ] Có **đúng một** điểm nhấn thị giác trên màn?
- [ ] Nội dung (ảnh/dữ liệu) chiếm phần lớn diện tích, không phải điều khiển?
- [ ] Đã thay **viền hộp** bằng khoảng trắng hoặc hairline ở mọi chỗ có thể?
- [ ] Vùng chạm **≥44px** ở mọi dải màn?
- [ ] **Không còn nhãn spec/debug** nào?
- [ ] Chữ số đo có **tabular-nums**?
- [ ] Nền chấm màu ở chặng 2 là **xám trung tính** (ISO 3664)?

---

*Cowork, 29/07/2026. Nguồn: Apple HIG (thang chữ 11→34pt, lưới 8pt/4pt, chạm 44pt, 3 nguyên tắc
Clarity·Deference·Depth, Liquid Glass 2025, luật "không thêm typeface thứ hai"), International
Typographic Style (lưới 12 cột Müller-Brockmann, flush-left ragged-right, phân cấp bằng cỡ-weight-
khoảng cách trong MỘT họ chữ, khoảng trắng chủ động, ảnh là dữ kiện, màu hạn chế), Swiss design for
web. File này là **chuẩn dùng chung** — mọi đề xuất giao diện IF về sau phải qua danh sách kiểm §9.*
