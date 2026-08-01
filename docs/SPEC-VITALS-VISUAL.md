# SPEC — VITALS VISUAL

> Nguồn gốc: bản `ifvitalsvisual.pdf` Cowork dựng **29/07/2026**, dựng bằng token thật từ
> `app/globals.css`, đọc ảnh tham chiếu của Hoà theo **Luật #7** (tách lớp tính năng / lớp giao diện).
>
> Chép vào repo ngày **01/08/2026** vì bản gốc chỉ tồn tại dạng PDF trong lịch sử chat — nên nó
> **vô hình với mọi phiên sau**. Sáng 01/08 Cowork đã thiết kế lại từ đầu một hướng khác (vàng ấm +
> mint + đĩa thấu kính) vì không biết tài liệu này tồn tại. Hướng đó **đã bỏ**. Bản này là bản đúng.
>
> Liên quan: `docs/SPEC-VITALS-AI.md` (vai trò) · `docs/SPEC-VITALS-ROLE.md` · `docs/DEMO-VITALS-DRAG`

---

## 0 · Trạng thái thi công

| | |
|---|---|
| Spec | ✅ xong (29/07) |
| Code | ⬜ **chưa làm** — `components/studio/VitalsIcon.tsx` vẫn nguyên bản 21/07 |
| Hiện trạng code | 67 dòng · vòng tròn chứa ô vuông bo góc `rx=8` · gradient cam `#F06020` → navy `#002850` |
| Vấn đề | **Hai màu đó KHÔNG thuộc hệ token IF** |
| Thứ tự | Làm **sau** `2.2.90 useDismissable` — nguyên liệu nền trước, nhận diện sau |

---

## 1 · Hai lớp giá trị — lấy gì, tránh gì

**Lớp tính năng** (lấy toàn bộ): cả ba ảnh tham chiếu đều nói một điều — trợ lý phải có
**trạng thái nhìn thấy được**: đang nghỉ · đang nghe · đang nghĩ · đang trả lời.
Đây là thứ Vitals **đang thiếu hẳn**.

**Lớp giao diện**: tách làm hai nửa rõ rệt.

### ✕ Tránh — ruy-băng Siri / cầu ánh sắc

Gradient cầu vồng là **cliché AI của 2025–2026** — mọi app đều dùng. IF khác biệt ở chỗ là
**công cụ nghề cho kiến trúc sư**: node tất định, CAD→3D 0 credit, chấm màu theo ISO 3664.
Dán quả cầu vồng vào đó là tự hạ mình xuống hàng "đồ chơi AI". Nó cũng **phá luật màu của chính
IF: 1 accent duy nhất**.

### ✓ Lấy — electron tăng theo nhịp

Mọi thứ nằm trong **một khối cầu kính**:

- Hạt **to và sáng khi ra mặt trước, nhỏ và mờ khi lùi ra sau** — đây là thứ làm mắt đọc ra
  chiều sâu thay vì thấy một cái đĩa phẳng
- Mỗi hạt kéo theo **một vệt sáng ngắn** — ba bản sao lệch pha rất nhỏ, mờ và nhỏ dần, nên vệt
  mềm chứ không thành cái đuôi cứng
- Nét **không còn là nét đơn**: mỗi cung là dải sáng có gradient tắt dần chồng một lớp nhoè, các
  lớp cộng vào nhau bằng `mix-blend-mode: screen` nên hoà thành **một khối**, không rời ra từng mảnh
- **Không có đoạn nào chạy chậm rồi nhanh dần rồi dịu xuống** — nhịp leo thang rất nhẹ, đủ để thấy
  có quán tính chứ không giật
- **Chu kỳ lệch nhau bằng số lẻ** (9,3s · 3,7s · 1,3s…) nên hình **không bao giờ lặp lại y hệt**
- Lớp ngoài là **cung chạy chứ không phải vòng kín** — hình thở được thay vì bị đóng khung

### ⭐ Số electron là kênh thông tin

| Trạng thái | Số hạt |
|---|---|
| Nghỉ | **2** |
| Nghe | **3** |
| Nghĩ | **5** |
| Trả lời | **3** |

> Nhìn một cái biết ngay máy đang làm nặng hay nhẹ — **không cần đọc chữ, không cần đổi màu.**

Đây là điểm mạnh nhất của cả spec: kênh thông tin **không tốn màu nào**, đọc được cả khi mù màu,
và ở 20px vẫn đếm được.

---

## 2 · Năm trạng thái — "thông minh, năng động" đến từ HÀNH VI, không từ gradient

Cùng một hình, đổi **cách chuyển động** để nói nó đang làm gì. Người dùng chỉ liếc một cái là biết.

| Trạng thái | Hạt | Chuyển động |
|---|---|---|
| **Nghỉ** | 2 | Cung ngắn, ~20s một vòng, quỹ đạo ẩn hẳn — có sự sống, **không đòi chú ý** |
| **Nghe** | 3 | Hạt thứ ba xuất hiện, cung dài ra, cả cụm hít vào / thở ra nhịp ~2s |
| **Nghĩ** | 5 | Năm vòng tròn bằng nhau, mỗi vòng đi qua tâm, **lệch đều 72°** — phần chồng lên nhau tạo hình cánh hoa (kiểu mân côi trên Apple Watch). Chạy **đều**, không leo thang — như máy đang xử lý ổn định |
| **Trả lời** | 3 | Rút từ 5 xuống 3 **+ xung lan từ tâm ra** — nói *"vừa xong, có gì đó đi ra"* |
| **Có việc cần xem** | 2 | Một hạt **hổ phách `#c79a63`**, hạt kia chìm xám, cung chậm còn ~26s. Dùng cho **preflight chưa đạt**, render lỗi |

> ⚠️ **Cần chốt lại khi thi công:** trong bản PDF gốc, ô mô tả "5 vòng lệch 72°" bị gắn nhãn *Nghỉ*
> trong khi nội dung mô tả đúng là trạng thái **Nghĩ** (5 hạt). Đây nhiều khả năng là lỗi trình bày
> của bản gốc. Bảng trên đã sắp lại theo logic số hạt. Xác nhận trước khi code.

---

## 3 · Ba lý do đề xuất này không phải "cho đẹp"

**① Đơn giản nên co giãn được.** Cả hình chỉ gồm **1 vòng tròn + 2 elip + 2 chấm** — ở 20px vẫn rõ,
ở 132px vẫn sang, và **cùng một file SVG dùng cho cả ba cỡ**. Mọi glyph AI kiểu ruy-băng / cầu ánh
sắc đều **vỡ khi thu nhỏ**; hình này thì không.

**② Không phá hệ màu.** Dùng **một accent `#6a57f5`** (đã là `--accent` trong `globals.css:19`),
không thêm màu nào — trừ **hổ phách `#c79a63`** đã có sẵn trong token IF, **chỉ dùng cho trạng thái
cảnh báo**.

**③ Rẻ và nhẹ.** SVG + CSS thuần. Không video, không Lottie, không thư viện.
Tự tắt khi máy bật `prefers-reduced-motion`.

---

## 4 · Ba cỡ — một DNA

Không phải ba bản thiết kế rời. Cùng một hình, **đổi độ chi tiết theo chỗ đặt** — giống cách Apple
để SF Symbols ăn theo cỡ chữ.

| Cỡ | Chỗ dùng |
|---|---|
| **S · 20px** | Thanh trạng thái |
| **M · 56px** | Đầu panel |
| **L · 96–132px** | Màn chờ |

### Nền sáng

Ở 20px trên nền giấy: **đổi nét sang tím `#6a57f5`, bỏ nền tối.** Vẫn đọc được, vẫn có nhịp.
Không đặt đĩa tối lên trang giấy ấm.

---

## 5 · Chữ nằm TRONG glyph — cho màn chờ toàn khung

Từ hai ảnh tham chiếu bổ sung (cầu phát sáng có chữ *"Generating"* bên trong; vòng ghép nhiều cung
có chữ ở giữa).

**Ý đáng lấy nhất:** glyph **không chỉ báo trạng thái — nó chứa luôn câu chữ**. Hiện Vitals đang là
*icon* và *chữ trạng thái* nằm rời nhau; gộp lại thành **một vật** thì vừa gọn vừa ra chất.

**Nhưng đây là CÔNG DỤNG KHÁC.** Đó là **màn chờ toàn khung**, không phải viên 20px trên thanh
trạng thái. IF cần cả hai, và đúng chỗ dùng là:

- **Nền tối** — lúc Render đang chạy: *"Sketch → Ảnh thật · 2048 × 1365 · 4 credit"*
- **Nền giấy** — lúc panel Vitals vừa mở: *"Hỏi bất cứ điều gì về dự án này"*

Nhãn trạng thái: `Đang dựng` · `Sắp xong` · `Xong rồi` · `Chào Hoà` · `2 lỗi`

**Lấy gì:**
① chữ nằm trong glyph — glyph là **vật chứa** câu chữ, không phải huy hiệu dán cạnh chữ ·
② **rim light lệch một bên** — tạo khối bằng độ sáng chứ không bằng nhiều màu, nên vẫn giữ đúng
1 accent · ③ nhiều cung mảnh chồng lớp quay lệch tốc độ — chiều sâu rẻ tiền mà sang ·
④ chữ sáng lệch nhịp từng ký tự — nói *"đang xử lý"* mà **không cần vòng xoay loading**.

**Tránh gì:**
① xanh `#1a6fff` là màu Apple/Samsung — IF phải quy về tím `#6a57f5`, nếu không IF trông như bản
nhái · ② teal→tím→hồng lại rơi vào cầu vồng AI · ③ **chỉ có bản nền đen** — IF mặc định là nền
giấy ấm; phải có bản sáng, nếu không glyph chỉ dùng được nửa app. Cách làm bản sáng: **đảo rim
light thành bóng đổ nhẹ + viền hairline**.

---

## 6 · Xuất hiện — xoắn thiên hà

Mỗi lần gọi Vitals, glyph **không hiện ra ngay**: các nhánh quỹ đạo văng ra xa rồi **cuộn xoáy vào
tâm**, lệch pha nhau nên vệt sáng kéo thành hình xoắn ốc; **quả cầu kính nở lên sau cùng**.

**1,5 giây, chạy đúng một lần mỗi lần gọi** — không lặp, không thành đồ trang trí.

Áp cho: panel mở (nền tối) · pill kích hoạt (nền giấy) · nút `↻ Gọi lại`.

---

## 7 · Việc phải làm khi thi công

1. Thay thẳng `components/studio/VitalsIcon.tsx` (67 dòng) — bỏ ô vuông bo góc + gradient
   `#F06020`→`#002850`
2. Giữ backward-compat theo ghi chú sẵn có trong file: `<defs>` khai báo id cố định, cần xử lý khi
   render **nhiều instance trên cùng một trang**
3. Chốt lại nhãn trạng thái ở §2 (xem cảnh báo)
4. `prefers-reduced-motion` là **bắt buộc**, không phải tuỳ chọn
5. Tắt hiệu ứng nặng khi CAD đang kéo/vẽ
6. **Chỉ Vitals được dùng nhịp electron này.** Nếu nó lan sang thành phần thường thì dấu hiệu AI
   mất tác dụng ngay

---

*Chép vào repo: Cowork, 01/08/2026. Nội dung gốc 29/07/2026, không sửa ý — chỉ sắp lại và ghi chú
chỗ bản gốc mâu thuẫn.*
