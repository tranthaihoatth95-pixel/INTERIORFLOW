# 04/09 · Lane 04 · DESIGN — "nút không nói dối"

> Bốn ca cùng một họ bệnh: *giao diện khẳng định một việc, việc đó không xảy ra.*
> Kết quả: **A đã đóng sẵn từ trước (tiền đề phiếu sai) · B gỡ xong · C là giá trị thật của
> lượt · D sửa bằng số.**

---

## 1. Tổng quan

| Việc | Kết quả |
|---|---|
| **A** ⌘J vô chủ | 🔴 **TIỀN ĐỀ PHIẾU SAI** — việc đã đóng ở commit `711d5c73`, xác minh trên app thật. Không làm lại (tội N8). |
| **B** mặt AI thứ hai ở WorkHub | ✅ Gỡ xong. Hai khẳng định của phiếu **đúng cả hai**. |
| **C** luật H5 chạm-tới-được | ✅ Cắm vào `soi-cong-cu-chet` (opt-in `--cham`), hiệu chuẩn ĐẠT, **quét 8 màn/359 phần tử ra 4 ca**, xác minh bằng `event.target` ⇒ **3 ca TRẬT ĐÍCH thật**. |
| **D** dải nền tối hơn trang | ✅ Sửa neo. **light 8/20 → 0/20**; dark vốn 0/20, không đụng. |

Máy kiểm cuối: `tsc` 0 · `npm test` **34 pass 0 fail** · `soi:frontier` **0 lệch** ·
`soi:tu-dien` **322** (đúng mốc) · `soi:hinh-hoc` **32** (mốc 37 — giảm 5, giải thích ở §2D) ·
`soi:cong-cu-chet` **41 ca** (đúng mốc) · cổng 3094 `curl rc=7`.

---

## 2. Chi tiết

### A · ⌘J — tiền đề sai, việc đã xong

Phiếu ghi *"không mặt nào tiêu thụ ở cả 4 màn"*, theo mốc `0f52737b`. Nhánh tích hợp đã tiến
**197 commit** và một lane khác đã dựng khẩu độ mép trên (`711d5c73` *"khẩu độ Vitals mép trên
+ Home một-tiêu-điểm — thi hành D-DR1 và D-DR2"*).

**Không tin chú thích** — đo bằng bàn phím thật (`scripts/nghiem-thu-ban-lam-viec/kiem-a-vitals.mjs`):

| Đo | Kết quả |
|---|---|
| khẩu độ trên DOM | `[data-vitals-aperture]` tại **(864, −3) 112×44** — đúng MÉP TRÊN |
| bấm **⌘J** | DOM **531 → 574** phần tử · chữ **1999 → 2074** ⇒ **CÓ VIỆC** |
| bấm **Ctrl+J** | cùng kết quả ⇒ CÓ VIỆC |
| `VitalsRightEdgeHost` (chỗ đứng cũ) | mount = **0** — đã thành bia mộ, có test canh |

⇒ **Không chọn đường ① hay ② của phiếu** — cả hai đều thừa. Người dùng bấm ⌘J nay **mở panel
Vitals ở khẩu độ mép trên**. Câu chữ hiển thị ở ô gõ nhanh: `aria-label="Vitals — hỏi trợ lý
(⌘J / Ctrl+J)"`, gợi ý trong ô `"Hỏi Vitals…"`, hậu tố `⌘J` (`StatusBar.tsx:223,277`).

🟡 **Một phần CHƯA đóng được trong lượt này**: ca *"gõ câu hỏi rồi Enter"* — ô gõ nhanh chỉ hiện
khi **hover** vào chip Vitals (cơ chế nở kiểu Siri, `StatusBar.tsx:246-283`), nên bộ đo tự động
không thấy nó ở trạng thái nghỉ. Đường mã thì đã nối (`openVitals()` + `initialInput`/`autoSend`),
nhưng **tôi chưa bấm được ca đó bằng tay** ⇒ khai ở §5.

### B · WorkHub — hai khẳng định của phiếu đều ĐÚNG

| Khẳng định của phiếu | Đo được |
|---|---|
| `grep "fetch("` trong tệp = 0 | ✅ **đúng** — `grep -c` trả 0, rc=1 |
| công tắc ngữ cảnh không đọc pane | ✅ **đúng** — `contextEnabled` chỉ chọn *chuỗi nào* để nối vào danh sách tin nhắn; `panes.map(p => p.name)` lấy **TÊN dịch vụ**, không phải nội dung. Pane là `<iframe>` khác gốc ⇒ trình duyệt **không cho đọc** |

**Đã gỡ**: ngăn trợ lý (header *"Trợ lý công việc / ChatGPT"*) · công tắc *"Dùng ngữ cảnh cửa sổ"* ·
danh sách tin nhắn + câu chào gõ cứng · 3 nút tác vụ nhanh · ô soạn + nút Gửi · nút mở lại trợ lý ·
`submitMessage()` · 30 dòng CSS chết.

**Đã giữ**: rail đổi dịch vụ (6) · chia 1/2/3 ngăn · thanh địa chỉ + nút Mở · chọn dịch vụ mỗi
ngăn · đổi sáng/tối · dock tạo tệp.

**Sửa thêm một nhãn dối** (không phải mở rộng phạm vi — nó tham chiếu thứ vừa gỡ): dock ghi
*"Tạo cùng trợ lý · Từ nội dung đang mở"* → **"Tạo tệp mới · Chọn loại tệp"**. Vế *"từ nội dung
đang mở"* vốn **chưa bao giờ đúng**.

Kiểm trên app thật (`kiem-workhub.mjs`), **cả hai theme**:
`mặt AI còn sót: ✅ không còn dấu vết nào` · `{rail 6, ô địa chỉ 2, nút chia ngăn 6, chọn dịch vụ 2,
dock true}` · `lỗi trang: 0`.

🟡 **Nợ khai thẳng, KHÔNG tự sửa**: ba nút trong dock mới chỉ đổi mục đang chọn
(`setActiveCreator`), **chưa tạo tệp nào**. Đó là *nút chưa nối* — khác họ với *nút nói dối*, nên
để nguyên và ghi vào chú thích tại chỗ.

### C · Luật H5 — cắm ở đâu, hiệu chuẩn ra sao, bắt được bao nhiêu

**Vị trí**: `scripts/soi-cong-cu-chet.mjs` — docstring `:61-84`, cờ `:71-80`, thân H5 `:293-405`,
in `:420-440`. Cắm dưới dạng **nhánh opt-in `--cham`**, `playwright` nạp bằng *dynamic import*.

> **Vì sao opt-in chứ không chạy mặc định** (phiếu cho phép nói thẳng nếu kiến trúc không hợp):
> bốn họ H1–H4 là tất định, 0 phụ thuộc, chạy được cả ở CI không mạng. H5 cần **dev server sống +
> Chromium**. Gộp cứng là biến một máy soi luôn-chạy-được thành máy hay-hỏng-vì-môi-trường — mà máy
> soi hỏng vặt thì chết đúng theo cách docstring của chính nó đã cảnh báo. Không cờ ⇒ hành vi cũ
> **y nguyên** (đã kiểm: vẫn đúng 41 ca).

**Hiệu chuẩn** (`--tu-kiem`, bắt buộc): chèn một tấm phủ lên tâm một nút đang lành, đo, rồi gỡ.
```
✅ HIỆU CHUẨN trên nút "Untitled flow": thường 0 → khi bị che 1 → gỡ che 0
```
Có phân biệt **FAIL** (khẳng định sai) với **LỖI** (không tìm được nút lành ⇒ in *"KHÔNG KẾT LUẬN
— đây là LỖI hạ tầng, không phải TRƯỢT"*), đúng bài học *"HIỆU CHUẨN ĐẠT" in ra trong khi nó đỏ vì
timeout*.

**Quét toàn app**: **8 màn · 359 phần tử bấm-được · 4 ca che** — con số phiếu hỏi.

**Xác minh bằng chuột thật** (`xac-minh-che.mjs`) — **3/4 TRẬT ĐÍCH**:

| Màn | Nút người dùng nhắm | Cú chuột thật rơi vào |
|---|---|---|
| 2D | **Markup** (1568,716,44×44) | `button.pe-panel-toggle` **"Mở bảng kiểm"** |
| 3D | **Style Transfer** (250,756) | `div.flex.shrink-0` **"Thư viện"** |
| 3D | **Relight** (250,825) | `button` **"Avatar — kiemkiem"** |
| 2D | Gõ lệnh | 🟢 trúng (H5 báo ở ảnh chụp khác — màn 2D có trạng thái động, không tái hiện) |

🔴 **VÒNG 1 CỦA BỘ XÁC MINH ĐO SAI, ghi lại vì bài học đắt**: bản đầu so *"trước/sau cú bấm DOM có
đổi không"* rồi kết luận **"🟢 chuột vẫn tới được"** cho cả ba ca. Sai vì **có việc xảy ra không có
nghĩa là việc của ĐÚNG nút đó** — bấm "Markup" mà mở ra "bảng kiểm" thì DOM vẫn đổi, phép đo vẫn
xanh. Và đó là biểu hiện **tệ hơn im lặng**. Vòng 2 bỏ hẳn phép so DOM, hỏi thẳng `event.target` ở
pha bắt — tất định, không phụ thuộc trạng thái sót lại.

**Chẩn đoán gốc** (đọc từ ảnh `che-3D-Relight.png`): danh sách công cụ cuộn trong sidebar **không
chừa chỗ cho thanh đáy cố định** (nút *Thư viện* + thanh avatar). Mục cuối **lọt xuống dưới** thanh
đó — vẫn "hiện" theo DOM nên mọi test `.click()` đều xanh, nhưng chuột bấm không trúng.
⇒ Đây là **phát hiện, chưa sửa**: sửa vị trí là quyết định thị giác + chạm vùng lane khác giữ.

### D · Dải nền — số trước/sau, cả hai theme

Đo bằng chính `bangMau()` của app (`do-dai-nen.ts`), tiêu chí: *điểm SÁNG NHẤT của dải có còn tối
hơn nền trang không*. Nền trang sáng `--bg #f2efe9` = lum **0.8649**.

| | TRƯỚC | SAU |
|---|---|---|
| **light** — bảng tối hơn trang | **8/20** (cả 5 `night`, 3/5 `dusk`) | **0/20** |
| **dark** — bảng tối hơn trang | **0/20** | **0/20** (không đụng) |
| **biến thiên** (light) | 1.057 – 1.213 | **1.021 – 1.087** |

Neo mới (`lib/wallpaper/sets.ts:154-176`), **dò bằng máy** chứ không chỉnh tay
(`do-neo-sang.ts`): `night [0.943,0.970]` · `dawn [0.951,0.982]` · `day [0.960,0.996]` ·
`dusk [0.944,0.973]`.

⚠️ **Đánh đổi phải khai**: nền trang sáng nên trần vật lý chỉ còn `[0.865 … 1.0]` ⇒ biến thiên tối
đa đạt được là **1.156**, trong khi dải cũ có bộ đạt **1.213**. Tức **không thể vừa "sáng hơn
trang" vừa giữ nguyên biến thiên cũ**. Dải vẫn **kể được giờ** — thứ tự giữ nguyên:
`night 0.9015 < dusk 0.9069 < dawn 0.9231 < day 0.9511`.

📌 Ghi sổ, **không phải việc lượt này**: `--bg` còn là kem `#f2efe9` (ngả vàng) so với Apple
`#F2F2F7` (ngả lam) — chênh 14 điểm kênh lam. Quyết định màu cấp hệ, cần mắt chủ dự án.

---

## 3. Tổng kết

Bốn ca, nhưng **chỉ hai ca là bệnh thật còn sống**: WorkHub (B) và dải nền (D). Ca A **đã được
chữa từ trước** — và việc phiếu vẫn ghi nó là *bệnh đang sống* chính là **ca thứ ba của họ "trạng
thái cũ tự lan"** mà sổ 04/09 vừa ghi hai lần. Ca C không phải một lỗi mà là **một cái máy** để lỗi
loại đó thôi sống sót ba tuần.

Điểm chung của cả bốn: **không cái nào bị máy soi tĩnh nào bắt được**. `tsc` xanh, `npm test` xanh,
năm máy soi xanh — trong khi người dùng bấm "Markup" thì mở ra bảng kiểm, và WorkHub thì nói *"đang
dùng ngữ cảnh từ Mail · Pinterest"* mà không đọc gì cả.

---

## 4. Đánh giá khách quan

**Được**: H5 có **hiệu chuẩn thật** (đỏ khi che, xanh khi gỡ) nên con số 4 ca không phải lời khai;
xác minh bằng `event.target` là tất định, không cãi được; nhánh tĩnh giữ nguyên hành vi (41 ca);
neo màu **dò bằng máy** và đánh đổi được ghi rõ bằng số.

**Chưa được**:
- **Máy dọn CSS của tôi hỏng ngay lần chạy đầu** — nó chỉ xoá dòng mở của khối nhiều dòng, để lại
  thân + `}` mồ côi ⇒ `/workhub` trả **500**. Dev server bắt được, tôi sửa ngay. Đây đúng là **lần
  thứ tư trong ngày** một công cụ tự viết báo/làm sai vì không thử trên ca thật trước. Tôi lặp lại
  đúng lỗi mà sổ vừa ghi ba lần.
- **H5 chỉ đo được một ảnh chụp tại một thời điểm** — màn có trạng thái động (panel bật/tắt) thì
  kết quả đổi theo, đúng như ca "Gõ lệnh" không tái hiện.
- 3 ca trật đích **mới phát hiện, chưa sửa**.

**Rủi ro**: `soi:hinh-hoc` giảm 37 → **32** *không phải* do sửa hình học mà do tôi **xoá 30 dòng CSS
chết**; nếu ai đọc con số đó như "đã sửa 5 chỗ bo góc" là hiểu sai.

---

## 5. ⑦b CHƯA CHẮC / CHƯA KIỂM

- **Bàn phím thuần: CHƯA thử.** Mọi cú bấm đều bằng `mouse.click()` hoặc `keyboard.press` cho ⌘J.
  Chưa Tab qua WorkHub sau khi gỡ ngăn trợ lý (thứ tự tiêu điểm có thể đổi vì bớt một vùng).
- **`prefers-reduced-motion`: CHƯA kích hoạt lần nào.**
- **Trình duyệt: chỉ Chromium 1194.** Safari/Firefox là suy, không đo.
- **Trình đọc màn hình: chưa thử.**
- **Ca "gõ câu hỏi rồi Enter" (A): chưa bấm được bằng tay** — ô chỉ hiện khi hover. Đường mã đã
  nối, nhưng tôi **không có bằng chứng thao tác** cho ca đó.
- **H5 là SÀN, không phải trần**: chỉ xét **tâm** phần tử (đúng phát biểu luật), nên nút bị che
  **một phần** thì lọt. Bỏ qua có chủ ý: `disabled`/`aria-disabled` · `pointer-events:none` · tâm
  ngoài khung nhìn · `elementFromPoint` trả `null`. Và chỉ quét 8 màn — màn sau đăng nhập, có dữ
  liệu; màn rỗng/màn phụ chưa quét.
- **D đo trên màu NGUỒN từ `bangMau()`**, chưa đo pixel thật trên màn sau lớp phủ/độ mờ. Bộ chụp
  không tìm thấy `[data-wallpaper]` (`coNen:false`) nên **không đọc được màu dải tại chỗ** — ảnh
  chụp có, nhưng số thì là số tính.
- **`mk-user.mjs` cũ đã ghi nhầm vào DB của repo gốc** (đổi mật khẩu user `kiem@localhost.test` về
  `matkhau123`) trước khi tôi phát hiện symlink `node_modules` làm Prisma đọc `.env` sai chỗ. Vô
  hại (DB kiểm dùng-xong-bỏ) nhưng phải khai. Đã thêm `mk-user-worktree.mjs` truyền `datasources`
  tường minh.

## 6. ⑦c HẠN DÙNG KẾT LUẬN

- **A** — đúng tới khi ai đó đụng `AppChrome.tsx:388` hoặc `VitalsAperture.tsx`. Có test bất biến
  `mot-cho-dung.test.ts` canh "đúng một chỗ đứng", nên hạn dùng dài.
- **B** — đúng tới khi có người thêm lại bề mặt AI vào WorkHub. **Không có máy nào canh** việc này;
  chỉ có chú thích đầu tệp. Đây là chỗ mỏng nhất của lượt.
- **C** — con số **4 ca** chỉ đúng cho **ảnh chụp 8 màn hôm nay ở 1600×900, sau đăng nhập, dự án có
  dữ liệu**. Đổi kích thước cửa sổ, đổi trạng thái panel, hay thêm màn ⇒ phải chạy lại. Luật thì
  bền, con số thì không.
- **D** — số đúng tới khi `--bg` đổi. Nền sáng đang chờ quyết định canh-theo-Apple; **đổi `--bg` là
  phải dò lại neo**, vì cả bộ neo được tính theo đúng lum của `#f2efe9`.
