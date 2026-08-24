# CẢM ỨNG — CHECKLIST

> Chạy cho **mọi** bề mặt, không chỉ bề mặt "làm cho tablet".
>
> Lý do: theo `CẤP 0` (chốt 11/08), **touch là một LỚP thao tác, không phải một bản riêng**.
> Không có "bản tablet" để hoãn checklist này sang.

Mọi câu **CÓ / KHÔNG** hoặc **một con số so với một ngưỡng**.

⚠️ **Ranh giới phải nhớ:** cảm ứng ở IF là để **VẼ CHÍNH XÁC**. Đừng bê nguyên khuôn cảm ứng
điện thoại — cảm ứng ở ArchiNote là để **GHI NHANH**, hai việc khác nhau.

---

## T0 · ĐÃ THỬ THẬT CHƯA 🔴

| | | ✅/❌ |
|---|---|---|
| T0.1 | Đã thử trên **thiết bị cảm ứng thật** hoặc chế độ giả lập cảm ứng | |
| T0.2 | Ghi rõ thiết bị / chế độ / kích thước | |
| T0.3 | Nếu **chưa** thử: đã ghi **"chưa thử"**, không suy từ mã | |

🔴 T0.3 là câu quan trọng nhất tệp này. *"Có trong mã"* **không bằng** *"tới được người dùng"* —
và cảm ứng là chỗ khoảng cách ấy lớn nhất, vì `title`, `:hover` và `focus` đều **hành xử khác
hẳn** ở đó.

---

## T1 · CÁI GÌ CHẾT KHI KHÔNG CÓ CHUỘT 🔴

Đây là nhóm bắt được nhiều lỗi nhất. Liệt kê **từng** thứ hiện-khi-rê rồi chấm:

| Thứ hiện khi rê | Đường thứ hai cho cảm ứng | ✅/❌ |
|---|---|---|
| | | |

| | | ✅/❌ |
|---|---|---|
| T1.1 | Không tin **quan trọng** nào **chỉ** hiện khi rê | |
| T1.2 | Không dùng `title` làm đường **duy nhất** cho lý do / giải thích | |
| T1.3 | Ô giải nghĩa mở được bằng **nhấn giữ**, không chỉ bằng rê | |
| T1.4 | Nút chỉ hiện khi rê vào hàng ⇒ có đường khác trên cảm ứng | |
| T1.5 | Không thao tác nào cần **rê rồi bấm** (không làm được trên cảm ứng) | |
| T1.6 | Không thao tác nào cần **chuột phải** mà không có đường thứ hai | |
| T1.7 | Không thao tác nào cần **giữ phím + click** mà không có đường thứ hai | |

⚠️ T1.2 — `title` của trình duyệt **câm hoàn toàn trên cảm ứng**, và trình đọc màn hình đọc
không nhất quán. Lý do phải đi bằng `aria-describedby` + phần tử ẩn.
⚠️ Kèm theo: `<button disabled>` **không nhận focus** và Tab **bỏ qua hẳn** — nên với nút mờ,
`title` là một ngõ cụt ở **cả hai** phía.

---

## T2 · VÙNG CHẠM

| | | ✅/❌ |
|---|---|---|
| T2.1 | Mọi đích chạm **≥44×44** *(dùng token `--tap`, không gõ số)* | |
| T2.2 | Khoảng cách giữa hai đích cạnh nhau **≥8px** | |
| T2.3 | Vùng chạm **thấy được** — người dùng biết bấm vào đâu | |
| T2.4 | Đích chạm **không nhỏ hơn** phần nhìn thấy của nó | |
| T2.5 | Không đích chạm nào sát mép màn nơi có cử chỉ hệ điều hành | |
| T2.6 | Chỗ chật dùng token mật độ, không hạ cứng xuống dưới 44 | |

**Số phải ghi:** đích nhỏ nhất ___ × ___ px · khoảng cách nhỏ nhất ___ px

⚠️ T2.3 — ca thật: hai dòng nhập trên màn đăng nhập chỉ có **gạch chân**, vùng bấm không có
ranh. Trên chuột thì con trỏ đổi hình nên còn đoán được; trên cảm ứng thì **không có gợi ý nào**.

---

## T3 · MẬT ĐỘ ĐỔI THEO CON TRỎ

| | | ✅/❌ |
|---|---|---|
| T3.1 | Dùng 5 token: `--tap` · `--row` · `--gap` · `--pad-card` · `--fs-ui` | |
| T3.2 | Ghi đè qua `(hover:none) and (pointer:coarse)` | |
| T3.3 | **Một** thiết kế, không phải hai bản | |
| T3.4 | Không con số nào gõ cứng thay cho token mật độ | |

⚠️ T3.3 — dựng "bản tablet" riêng là đẻ nguồn thứ hai, và nó sẽ phân kỳ.

---

## T4 · CỬ CHỈ

| | | ✅/❌ |
|---|---|---|
| T4.1 | Nhấn giữ: ghi rõ **ms** và **độ trượt cho phép** | |
| T4.2 | Nhấn giữ **nở dần trong lúc giữ**, không giữ mù rồi bung | |
| T4.3 | Đọc chuẩn nhấn-giữ từ **một nguồn chung** | |
| T4.4 | Không cử chỉ nào đụng cử chỉ hệ điều hành (vuốt mép · kéo xuống · Control Center) | |
| T4.5 | Kéo-thả có ngưỡng bắt đầu, không kích hoạt do rung tay | |
| T4.6 | Kéo-thả có **chỗ thả nhìn thấy được** (ô nét đứt hoặc tương đương) | |
| T4.7 | Cuộn và kéo-thả **không tranh nhau** | |
| T4.8 | Véo/xoay hai ngón (nếu có) không đụng pan/zoom của canvas | |
| T4.9 | Mọi cử chỉ đều **có đường thay thế** không cần cử chỉ | |

⚠️ T4.2 — giữ mù 500ms rồi bung ra là cảm giác **máy đơ**. Phản hồi phải bắt đầu ngay.

🔴 T4.3 — **IF CHƯA CÓ chuẩn nhấn-giữ dùng chung.** Giá trị **500ms / 8px** hiện nằm ở
`components/ui/Tooltip.tsx:33,37` với tên `TOOLTIP_LONG_PRESS_MS` — tiền tố nói rõ nó **thuộc
về Tooltip**. Dùng lại nó cho một cử chỉ khác là **sai ngữ nghĩa**. Cần tách thành cử chỉ
chung (giữ nguyên 500ms/8px), Tooltip và mọi nơi khác cùng đọc một nguồn.
*(Đây cũng là ca T ghi sai địa chỉ hằng số và bị agent bắt — 16/08.)*

⚠️ T4.4 — vuốt bắt đầu **trong 4pt** kể từ mép thường bị hệ điều hành nuốt. Bắt đầu xa mép hơn.

---

## T5 · CANVAS TRÊN CẢM ỨNG

*(bỏ qua nhóm này nếu bề mặt không có canvas — nhưng phải **ghi lý do bỏ qua**)*

| | | ✅/❌ |
|---|---|---|
| T5.1 | Vẽ **chính xác** được — có bắt điểm, có nhập số | |
| T5.2 | Pan/zoom không đụng thao tác vẽ | |
| T5.3 | Tì lòng bàn tay không sinh nét (nếu hỗ trợ bút) | |
| T5.4 | Có đường nhập **số** cho người không muốn kéo bằng tay | |
| T5.5 | Điều khiển **không che** chỗ tay đang thao tác | |
| T5.6 | Đĩa lệnh chạm-giữ ở đúng vai (trên **mặt canvas**), không lẫn với cử chỉ của nút | |

⚠️ T5.1 — cảm ứng ở IF là để **vẽ chính xác**. Một canvas chỉ vẽ được nét nguệch ngoạc là
**không đạt**, dù thao tác mượt.

---

## T6 · PHẢN HỒI

| | | ✅/❌ |
|---|---|---|
| T6.1 | Mọi chạm có phản hồi **<100ms** | |
| T6.2 | Trạng thái đang-bấm phân biệt được (không dựa vào `:hover`) | |
| T6.3 | Việc chạy lâu có chỉ báo tiến trình | |
| T6.4 | Không trạng thái nào chỉ tồn tại ở `:hover` | |
| T6.5 | Vòng focus vẫn có nghĩa khi dùng bàn phím ngoài | |

---

## T7 · TRỢ NĂNG TRÊN CẢM ỨNG

| | | ✅/❌ |
|---|---|---|
| T7.1 | Bàn phím ngoài dùng được đầy đủ | |
| T7.2 | Kéo-thả có đường bàn phím (chọn → mũi tên → Enter) | |
| T7.3 | `prefers-reduced-motion` được tôn trọng | |
| T7.4 | Đọc được ở cỡ chữ hệ thống lớn | |
| T7.5 | Xoay ngang/dọc không vỡ bố cục | |

---

# CHẤM

| Nhóm | Số câu | Đạt | Trượt | Không áp dụng |
|---|---|---|---|---|
| T0 đã thử thật | 3 | | | |
| T1 chết khi không chuột | 7 + *(số thứ hiện-khi-rê)* | | | |
| T2 vùng chạm | 6 | | | |
| T3 mật độ | 4 | | | |
| T4 cử chỉ | 9 | | | |
| T5 canvas | 6 | | | |
| T6 phản hồi | 5 | | | |
| T7 trợ năng | 5 | | | |

**PHÁN:**

| | |
|---|---|
| T0.1 = ❌ | 🔴 **CHƯA CHẤM ĐƯỢC** — ghi *"chưa thử cảm ứng"*, ⛔ **không suy từ mã** |
| bất kỳ T1 nào ❌ | **FAIL** — có chức năng người dùng cảm ứng **không với tới được** |
| bất kỳ T2 nào ❌ | **FAIL** |
| chỉ nhóm khác ❌ | **PARTIAL** |
| sạch | **INTERNAL PASS** |

⚠️ *"Không áp dụng"* phải **ghi lý do**, nếu không tính là trượt.
