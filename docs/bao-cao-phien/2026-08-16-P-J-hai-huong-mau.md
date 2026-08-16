# P-J · Bàn thử hai hướng màu — mòng két ↔ mận trầm

> Phiếu: `docs/phieu-giao/P-J-ban-thu-2-huong-mau.md` · Khuôn 6 phần `docs/CLAUDE.md`.
> Sản phẩm: `docs/mocks/mock-ban-thu-2-huong-mau.html` (MỚI) — bàn thử chạy được, không đụng app.

---

## 1 · Tổng quan

Dựng xong bàn thử bày **hai hướng cạnh nhau ở đúng năm chỗ màu dễ chết**, mỗi ca đủ cả hai theme
cùng lúc (20 ô mẫu). Mọi góc màu và vùng cấm **đọc từ token thật** bằng `getComputedStyle`, không
gõ số nào trong script. **Ở điểm mầm, cả hai hướng đều qua cả ba ràng buộc bắt buộc** — nên bàn
thử không loại được ai bằng số, đúng như Hoà đặt: chọn bằng mắt.

Ba phát hiện đáng giá ngoài phạm vi phiếu, đều đo được, ghi ở mục 2.

---

## 2 · Chi tiết từng mục

### ⓪b Tiền đề hạ tầng — ĐẠT
`git log --oneline -1` = `895fbaf` · `git rev-list --count HEAD..main` = **0** · nhánh `main`. Không lệch, chạy tiếp.

### ⓪ Ba tiền đề nghiệp vụ — XÁC NHẬN CẢ BA, không bác ý nào

| # | Ý | Kết luận | Bằng chứng |
|---|---|---|---|
| 1 | `mock-ban-thu-mau.html` đã có, việc này là mở rộng | ✅ đúng | file tồn tại, 969 dòng, có `tinhVungCam()`/`daySangGoc()`/`huemap` — cơ chép **chép sang** bản mới, bản cũ không bị sửa |
| 2 | Vàng đồng đã bị bỏ khỏi vai màu nhấn | ✅ đúng | `CHOT-16-08-BAN-DUNG.md:67` lượt ③ "BẢN DÙNG" · `globals.css:26` vẫn khai `--accent-warm` nhưng comment tự giới hạn "CHỈ dùng cho nút hành động chính trên nền ẢNH (login)". Bàn thử **không** bày nó làm ứng viên — chỉ hiện trong bảng token để đối chiếu |
| 3 | Ba vùng phổ bị chiếm, phải ngoài ±20° tính từ token | ✅ đúng | `globals.css:205-207` (tối) + `:257-259` (sáng) |

### V1 · Hai hướng cạnh nhau — `haiHuongMau`
Thang tông **sinh từ một màu gốc** bằng OKLCH, 8 nấc độ sáng cố định. Hai hex mầm lấy **giữa dải
phiếu giao** và sinh bằng chính hàm `toHex`, không đặt tay:

| Hướng | Mầm (HSL) | OKLCH H | Hex tông máy chọn | Chữ trắng | Nổi trên nền tối | Nổi trên nền sáng |
|---|---|---|---|---|---|---|
| A · Mòng két | 185° | **204,3°** | `#208089` | 4,66:1 | 4,20:1 | 4,66:1 |
| B · Mận trầm | 335° | **353,5°** | `#985c75` | 5,09:1 | 3,84:1 | 5,09:1 |

### V2 · Năm ca dễ chết — `caKho`
5 ca × 2 hướng × 2 theme = **20 ô**, đếm bằng máy (`.cell` = 20, `.ca4` = 5). Ô sáng và ô tối
ghim cứng bằng biến `--pin-*`, **không phụ thuộc nút gạt** — nên hai theme luôn nằm cạnh nhau.

1. Nút chính cạnh cả ba màu nghĩa + cặp **Duyệt ↔ Huỷ**: Duyệt dùng màu "đạt" đã khoá, hình viên
   thuốc, đứng trái, có dấu ✓; Huỷ viền vuông hơn (`--r-1`), đứng phải, có dấu ✕ — phân biệt bằng
   **chữ + vị trí + hình dạng**, đổi màu nhấn không làm hai nút lẫn nhau.
2. Nền xám (sáng: xám nhóm đo từ hệ Apple · tối: `--hover`).
3. Nền trắng thuần (theo A4: trắng là nền chính).
4. Diện tích nhỏ: vòng focus 2px · chấm 7px · dải 2px đáy card · thanh tiến trình **dãy vạch** (B4).
5. Chữ trên nền nhấn: bày cả chữ trắng lẫn chữ đen kèm tỉ số, chỉ rõ chữ nào là chữ đúng.

### V3 · Số đối chiếu — `soDoiChieu`
Bảng 4 hàng (2 hướng × 2 theme) × 12 cột. Khoảng cách lấy **bản gần hơn trong hai theme** của mỗi
màu nghĩa, vì màu nhấn phải sống được ở cả hai.

| Hướng | → đỏ | → vàng | → xanh đạt | → tím | Kết quả |
|---|---|---|---|---|---|
| Mòng két 204,3° | 171,8° | 126,9° | **48,0°** | 77,7° | ✓ qua cả ba |
| Mận trầm 353,5° | **38,2°** | 77,8° | 161,1° | 71,6° | ✓ qua cả ba |

Cảnh báo sống hiện ngay trên bàn: **mận "sát biên dải ấm — cách mép 21,5°"**.

### V4 · Núm kéo + vùng cấm — `vungCam`
Một bộ núm, hai nút chọn hướng đang chỉnh. **6 tâm cấm** (3 màu nghĩa × 2 theme), dải gạch chéo
±20°, vạch đánh dấu vị trí hai hướng + tím. Thử thật: kéo tới 160° → máy đẩy ra **177°** kèm câu
*"Trùng họ với màu báo 'đạt' (bản sáng) — nút nhấn sẽ mất nghĩa…"*; kéo tới 290° → cảnh báo
*"Cách tím chỉ 8,1°, dưới ngưỡng 60°"*.

### V5 · Ô kết luận — không chấm điểm, không xếp hạng
Mỗi hướng 3 mục: mạnh ở đâu · chết ở đâu · ca đáng ngồi lâu, cộng dòng máy đọc sống ở góc đang đặt.

### V6 · `@dsCard`
Dòng đầu tệp `<!-- @dsCard group="Bàn thử màu" -->`. Đủ 2 theme có nút gạt · **41 hex đều nằm trong
khối khai token** (2 chỗ còn lại nằm trong comment giải thích, không phải khai màu) · 1440×900
không tràn ngang. **Không có `DesignSync`** ở phiên phụ — T đẩy khi audit.

---

### 🔎 Ba phát hiện ngoài phạm vi phiếu — đều đo được

**PH-1 · Bộ số vùng cấm trong sổ là bộ PHA, không nhất quán không gian màu.**
`CHOT-16-08-BAN-DUNG.md:78` ghi *"đỏ ~25° · vàng ~37° · xanh đạt ~145° · tím 262°"*. Đo lại từ token:

| Màu nghĩa | HSL thật | OKLCH thật | Sổ ghi | Khớp? |
|---|---|---|---|---|
| đỏ (`--danger` tối) | **9,6°** | 32,5° | 25° | ✕ không khớp bên nào |
| vàng (`--warning` tối) | **37,3°** | 77,3° | 37° | ✓ HSL |
| xanh đạt (`--success` tối) | **145,3°** | 154,6° | 145° | ✓ HSL |
| tím (`--accent`) | **247,2°** | 281,9° | 262° | ✕ không khớp bên nào |

⇒ Hai số khớp HSL, hai số không khớp gì. Đúng lý do phiếu bắt *"đọc ra, cấm gõ số nhớ"*. Bàn thử
vì thế hiện **cả hai cột** và tự báo khi hai không gian cho hai kết luận khác nhau.

**PH-2 · Ràng buộc "cách tím ≥ 60°" đổi kết quả theo không gian màu — và nó đổi thật với mòng két.**
Ở biên trên dải mòng két (HSL 190° → OKLCH 214,3°): OKLCH cho **67,6°** (đạt) nhưng HSL cho
**57,2°** (trượt). Sổ chưa khai ngưỡng 60° được ghi ở không gian nào. **Cần Hoà chốt** — bàn thử
không tự chọn hộ, chỉ bật cảnh báo khi hai không gian bất đồng.

**PH-3 · `--success` bản tối không dùng làm NỀN NÚT được.**
`#46b876` là màu vốn thiết kế để **làm chữ** trên nền tối. Lấy nó làm nền nút với chữ trắng chỉ còn
**2,51:1**. Chữ đen trên nó mới đọc được. Ca này lộ ra ngay khi dựng cặp Duyệt/Huỷ — nếu app có chỗ
nào đang dùng `--success` làm nền nút với chữ trắng thì chỗ đó đang hỏng. **Chưa kiểm app**, chỉ nêu.

### ⑥ / ⑥b · Nghiệm thu tự làm — vòng nào hỏng vì gì

| Vòng | Hỏng gì | Cách vá |
|---|---|---|
| 1 | Dải phổ cắt ở 0° đẩy **mận (353°) và đỏ (32°) ra hai đầu bàn** dù chỉ cách 38° — hỏng đúng ca quan trọng nhất của hướng B | Cắt vòng màu ở **240°** (khoảng trống giữa "đạt" và tím) + khai rõ "mép trái và mép phải là cùng một chỗ" |
| 2 | **132 / 136 mục chữ dưới ngưỡng** ở tối/sáng. Gốc bệnh: dùng `--t4` cho chữ đọc — đo được chỉ **3,2–3,9:1** (tối) và **2,6–3,0:1** (sáng) | Thay toàn bộ `--t4` cho chữ bằng `--t3` (đo: 6,1–7,4 tối · 4,53–5,20 sáng, đạt hết) |
| 3 | Còn 21/25: ① chữ trắng trên `--success` = 2,51 ② pill nền phủ 15% kéo chữ xuống 4,15–4,20 ③ `.verdict`/`.banner` phủ màu lên nền sáng còn 3,41 ④ ca 3 lấy nhầm `t1` của theme TỐI đặt trên nền TRẮNG | ① chữ chọn theo số đo ② pill hạ dần độ phủ, hết dư địa thì **chuyển pill đặc** ③ nền `--panel` + vạch màu bên trái ④ sửa sang `T.light.t1` |
| 4 | a11y: núm kéo cao **16px** (<44) · 22 nút mẫu lọt thứ tự Tab · 8 svg không nhãn · thiếu landmark · nhảy cấp H2→H4 | núm 44px · `tabindex="-1"` cho nút mẫu + khai rõ là vật trưng bày · `aria-hidden` cho svg trang trí · `<main>` · H4→H3 · `role=tab` đổi sang `aria-pressed` |

**Trạng thái đích — đạt ở vòng 4/5:**

| Điều kiện | Kết quả |
|---|---|
| 5 ca × 2 theme × 2 hướng | ✅ 20 ô, `.ca4` = 5 |
| Ràng buộc tính từ token đọc ra | ✅ `getComputedStyle`, 0 hex trong script |
| `soi:tu-dien` | ✅ **0 lệch nhãn**, file mới không bị nêu tên |
| `soi:hinh-hoc` | ✅ **không thêm lệch** — script chỉ quét `components/` + `app/globals.css` (`soi-hinh-hoc.mjs:36-37`), 10 lệch là **nợ cũ nguyên si**. Tự soi trong mock: mọi `border-radius` nằm trong thang (`--r-1/2/3/full` + vi mô 1px/3px) |
| Chữ dưới ngưỡng đọc-được | ✅ **0 / 0** ở cả hai theme (7 mục còn lại đeo `data-demo-tuong-phan`, là nội dung ca 2 và ca 5, có số hiện ngay cạnh) |
| 1440×900 không tràn ngang | ✅ `scrollWidth` = `clientWidth` = 1440. Ở 720px (≈200% zoom) cũng không tràn — bảng rộng cuộn trong `overflow-x:auto` của chính nó |
| Bàn phím | ✅ đúng 5 điểm dừng, tất cả ≥44px |

### ⑤ · Trích mã điều khoản — 🔧 **một mã trong phiếu ghi sai**

· **[T5] CON NGƯỜI QUYẾT CUỐI — PIPELINE HUMAN-IN-LOOP** (`TRIET-LY-IF.md:32`):
  *"AI hai vai (sản xuất/tham vấn) nhưng đích đến LUÔN sửa được; máy trình PHIẾU người duyệt;
  sửa tay không bao giờ bị đè; undo trước hỏi sau; không nút giả, không hộp đen một chiều."*
· **[Đ2] NHÌN VÀO TRONG TRƯỚC** (`:72`): *"mọi bảng plan có cột 'NỘI LỰC ĐÃ CÓ' — IF có gì rồi mới
  chốt build mới; build = ưu tiên chưng cất/nối dây, không sáng tác trùng."*
· 🔴 **Phiếu ghi "[N1] người quyết cuối" — SAI MÃ.** `:53` cho thấy **[N1]** là
  *"HUMAN-CENTRIC CHO NGƯỜI SÁNG TẠO LAI KỸ THUẬT"*. **Người quyết cuối là [T5].**
  Cả hai điều đều đúng chỗ ở bàn thử này, nhưng mã phải gọi đúng tên.

---

## 3 · Tổng kết lại vấn đề

Bàn thử làm được đúng việc được giao: **bày ra, không kết luận**. Nhưng nó cũng trả lời được một
câu mà chưa ai hỏi thẳng — *"số có loại được hướng nào không?"* — và câu trả lời là **không**:
ở điểm mầm cả hai đều qua cả ba ràng buộc, khoảng cách tới vùng cấm gần nhau (mòng két thừa
**28,0°** so với mép "đạt"; mận thừa **18,2°** so với mép "đỏ"). Nên quyết định này thật sự chỉ
giải được bằng mắt, và chỗ đáng nhìn nhất là **ca 1 với mận** và **ca 2 với cả hai**.

Ba phát hiện phụ (PH-1 → PH-3) đều cùng một gốc: **các con số về màu trong sổ được ghi lại từ trí
nhớ ở những không gian màu khác nhau, rồi dùng lẫn với nhau.** Đó chính là loại lỗi mà `may-soi-dong-dang`
sinh ra để bắt, và là lý do câu "đọc ra, cấm gõ số nhớ" trong phiếu đã cứu cả bàn thử này.

---

## 4 · Đánh giá khách quan

**Được:**
· Ràng buộc **tính sống** từ token — đổi `globals.css` là bàn thử tự đúng theo, không phải sửa tay.
· Vòng tự đóng bắt được lỗi thật, không phải lỗi hình thức: 132 mục chữ không đọc được là hỏng
  nặng, và nó đến từ một thói quen (dùng `--t4` cho chữ) chứ không phải một chỗ sơ ý.
· Ca 2 ra được lời giải có ích cho app thật: **chữ màu nhấn trên nền xám không đủ đọc ở cả hai hướng**
  ⇒ pill trên nền xám phải chuyển sang đặc. Đây là quy tắc dùng được ngay, không chỉ là quan sát.

**Chưa được / rủi ro:**
· **Bàn thử trả lời được "có xỉn không" bằng SỐ, nhưng "xỉn" không phải là chuyện của số.** Ca 2
  đo được "nhấn nổi trên nền xám 3,86:1" — con số đó không nói màu có ố hay không. Chỗ này bắt
  buộc phải qua mắt Hoà, máy hết vai.
· Dải "ấm" 15–95° chép từ bàn thử trước, **chưa có chốt riêng**. Mận đứng ngoài dải nhưng chỉ cách
  mép 21,5° — nếu Hoà thấy mận đọc ra ấm thì cái sai là **dải**, không phải mận.
· Ba nền dùng trong bàn thử (`#ffffff`, xám nhóm `#f2f2f7`) là **bản A4 chưa thi công** — `globals.css:238`
  vẫn là kem `#f2efe9`. Mọi số cột "sáng" sẽ đổi khi A4 vào code.
· Bàn thử chỉ chạy được trong trình duyệt của Browser pane (Chromium), chưa mở trên Safari.

---

## 5 · Hướng xử lý — nhiều góc độ

**Hướng ①: Hoà duyệt mắt ngay trên bàn thử này, chốt một hướng.**
Ưu: rẻ nhất, bàn thử đã sẵn, đúng nhịp Hoà đặt. Nhược: quyết định khoá cả đợt giao diện mà chỉ dựa
trên hai điểm mầm — nếu Hoà thích "mòng két nhưng xanh hơn chút" thì phải kéo núm, và kéo là dễ
rơi vào ca PH-2 (HSL trượt còn OKLCH đạt) mà bàn thử chỉ cảnh báo chứ không quyết.

**Hướng ②: Chốt trước không gian màu chuẩn (OKLCH hay HSL), rồi mới duyệt màu.**
Ưu: bịt gốc PH-1/PH-2 vĩnh viễn, mọi số về màu trong sổ từ nay chỉ có một nghĩa. Nhược: chèn thêm
một cửa quyết định vào giữa đợt, mà băng thông duyệt mắt của Hoà đang là tài nguyên khan nhất.

**Hướng ③: Hoà duyệt mắt trước, T chốt không gian màu sau bằng quyền được giao.**
Ưu: không tiêu thêm lượt của Hoà; câu hỏi không gian màu là **thuần kỹ thuật**, đúng vùng Hoà đã
uỷ quyền ("vấn đề kỹ thuật bạn quyết"). Nhược: nếu T chốt OKLCH thì bộ số cũ trong `00-CHOT`/
`CHOT-16-08-BAN-DUNG` thành lỗi thời hàng loạt, phải đóng dấu đính chính — không được im lặng bỏ hoang.

---

## 6 · Đề xuất hướng tốt nhất — **③**

Chọn ③ vì nó tách đúng hai loại việc: **chọn màu là việc của mắt Hoà, chọn thước đo là việc kỹ thuật.**
Ép hai thứ vào cùng một lượt duyệt (hướng ②) là bắt Hoà quyết một chuyện Hoà không cần biết, đúng
lỗi bắt-quyết-hai-lần đã ghi trong sổ. Còn hướng ① bỏ qua PH-2 thì sẽ phải mở lại đúng câu hỏi này
ngay lần đầu Hoà kéo núm.

Cụ thể: Hoà nhìn bàn thử, dừng lâu ở **ca 1 (mận cạnh đỏ)** và **ca 2 (cả hai trên xám)**, chốt một
hướng. Song song, T chốt **OKLCH là không gian chuẩn cho mọi ràng buộc màu** (lý do: ràng buộc là
"mắt đọc thành cùng họ" — chuyện cảm nhận, mà OKLCH là không gian đều theo cảm nhận; và bàn thử
`mock-ban-thu-mau.html` đã dùng nó, chốt khác đi là đẻ cơ chế thứ hai), rồi **đóng dấu đính chính**
lên bộ số cũ ở `CHOT-16-08-BAN-DUNG.md:78` thay vì để nó nằm im gây hiểu nhầm cho phiên sau.

---

## ⑦b · CHƯA CHẮC / CHƯA KIỂM

| # | Điều chưa chắc |
|---|---|
| 1 | **Góc màu và tương phản: ĐO, không suy.** Tính bằng công thức OKLCH + WCAG chạy thật trong trang, mốc kiểm là `contrast(trắng, #6a57f5) = 4,89` khớp đúng comment `globals.css:19-22`. **Nhưng** WCAG 2.x là công thức tương phản cũ, được biết là chấm sai một số cặp màu bão hoà; APCA mới hơn thì chưa được IF chốt. Số ở đây đúng theo thước IF đang dùng, không phải đúng tuyệt đối. |
| 2 | **"Không gian nào là chuẩn" CHƯA CHỐT.** Bàn thử dùng OKLCH làm chính và HSL làm đối chiếu. Đây là **T tự chọn**, chưa có chốt của Hoà. PH-2 cho thấy lựa chọn này đổi kết quả thật ở biên dải mòng két. |
| 3 | **Công thức sinh thang tông kiểm được** — 8 nấc độ sáng cố định, mọi hex sinh bằng `toHex(L,C,H)`, đảo ngược lại bằng `toOklch` ra đúng số. Nhưng **cách máy chọn tông cho nút thì có một số do T đặt**: mốc "gần 0,55 nhất" không có nguồn chốt, chỉ là chọn giữa thang cho đỡ chói ở cả hai nền. |
| 4 | **Ba con số T phải tự chọn, không có nguồn chốt:** ① biên vùng cấm **±20°** (chép từ bàn thử trước, chính bàn thử đó cũng tự khai "T tự chọn") ② dải "ấm" **15–95°** (chép từ `WARM_MIN/MAX` bàn thử trước) ③ chỗ **cắt vòng màu ở 240°** (T chọn cho hai cặp nguy hiểm nằm cạnh nhau). |
| 5 | **Chỉ chạy trong Chromium** của Browser pane, mở bằng `file://` (pane báo là "static snapshot", script vẫn chạy đủ — đã kiểm bằng cách đọc DOM sau khi render). **Chưa mở trên Safari** — `color-mix` và `oklch` đều được hỗ trợ, nhưng chưa xác minh bằng mắt. |
| 6 | **7 mục chữ dưới ngưỡng còn lại là CỐ Ý, không phải nới ràng buộc**: 3 mục ở ca 2 (đoạn chữ tô màu nhấn trên nền xám) + 4 mục ở ca 5 (chữ đen trên mận, 4,12:1). Cả 7 đều **hiện số ngay cạnh** và đeo `data-demo-tuong-phan` để máy đếm riêng. Nếu T đã hiểu sai và Hoà muốn con số 0 tuyệt đối thì phải bỏ hẳn hai ca đó — mà bỏ thì mất luôn thứ chúng chứng minh. |
| 7 | **Chưa kiểm app** xem có chỗ nào đang dùng `--success` làm nền nút với chữ trắng (PH-3). Ngoài vùng được giao, chỉ nêu. |
| 8 | **Chưa biết mận có bị đọc là "ấm" hay không.** Máy nói ngoài dải, mắt có thể nói khác. Không có cách đo. |

## ⑦c · HẠN DÙNG KẾT LUẬN

Bàn thử này **hết đúng khi**:
1. **Hoà chọn một trong hai hướng** — lúc đó nó thôi là bàn thử, chuyển thành tài liệu đối chứng;
   hướng bị loại nên giữ lại kèm lý do, đừng xoá.
2. **Theme sáng đổi sang bản canh-Apple trong `globals.css`** — mọi số ở cột "sáng" đo trên nền
   trắng `#ffffff` là bản A4 **chưa thi công**; `globals.css:238` hiện vẫn kem `#f2efe9`. Thi công
   xong phải **đo lại toàn bộ cột sáng**.
3. **Bộ nền chung được duyệt hoặc bác** — bàn thử nói cùng ngôn ngữ với `mock-bo-nen-chung.html`;
   bộ nền đổi thì token/nhịp ở đây đổi theo.
4. **Ba màu nghĩa trong `globals.css` bị dời** (vd dời `--warning` sang vàng chanh) — vùng cấm tự
   tính lại đúng, **nhưng** hai câu kết luận ở §5 viết bằng tay theo vị trí hiện tại thì không.
5. **Không gian màu chuẩn được chốt khác OKLCH** — toàn bộ khoảng cách góc phải đọc lại ở cột HSL.

## ⑧ · Dây máy
Entry `he-mau-2-lop`. **P-J không sửa registry** — T flip sau audit.
