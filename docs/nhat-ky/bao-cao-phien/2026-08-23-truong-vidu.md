# TRƯỜNG VÍ DỤ — dựng `examples/` · `contracts/` · `checks/` của IF DESIGN SCHOOL

Ngày 23/08/2026 · vùng ghi: `.claude/skills/if-design/{examples,contracts,checks}/**` ·
không `git add`, không commit.

---

## ⓪ TIỀN ĐỀ — xác nhận, kèm một đính chính

Đã đọc `docs/design-campaign/06-DESIGN-KNOWLEDGE-AUDIT.md`. **Nhận tiền đề**: vấn đề là
**định tuyến**, không phải thiếu luật; và luật *"cấm lưới thẻ đều"* thật sự đã tồn tại từ
20/08 mà 23/08 vẫn ra tường thẻ.

**Đính chính một chi tiết của audit** — nó làm kết luận **mạnh hơn**, không yếu đi:

> Audit ghi lý do lọt là *"luật nằm trong chú thích một tệp `.ts`, không ai đọc lúc dựng"*.

Đo tại nguồn: luật ấy nằm trong docstring của **chính hai tệp đang dựng bố cục Home** —
`components/home/xuong-layout.ts:7` và `components/home/BeMatHome.tsx:12-13`. `BeMatHome.tsx`
còn liệt kê **cả hai lần trượt trước** (20/08 và 22/08) và trích luôn câu chốt 23/08
*"KHÔNG lưới đồng đều"*.

⇒ Không phải *"không ai đọc"*. Là **đọc rồi vẫn ra tường thẻ**. Điều đó khoá chặt kết luận
của audit: **chữ mô tả một hình không thay được việc nhìn hình đó** — kể cả khi chữ nằm đúng
chỗ, đúng lúc, đúng ba lần.

---

## 1 · ĐÃ VIẾT GÌ — 18 tệp

### `examples/` — 13 tệp

| Tệp | Vai |
|---|---|
| `README.md` | chỉ mục + 4 nguyên tắc cứng + khuôn 7 mục |
| `BAD/home-tuong-the-23-08.md` | 7 cơ chế · bảng 9 luật bị phạm |
| `GOOD/home-living-canvas.md` | 5 cơ chế · Living Canvas |
| `BAD/sidebar-rail-icon-chung-chung.md` | 6 cơ chế · rail icon chung chung |
| `GOOD/sidebar-ban-do.md` | 5 cơ chế · bản đồ hai cụm ba nấc |
| `BAD/2d-tuong-thanh-cong-cu.md` | 6 cơ chế · 4 dải chrome, 101 nút |
| `GOOD/2d-canvas-truoc.md` | 4 cơ chế · canvas trước, gộp ≠ giấu |
| `BAD/auth-man-khoa-rong.md` | 5 cơ chế · màn khoá trống |
| `GOOD/auth-ambient-lien-tuc.md` | 4 cơ chế + **bảng 4 chỗ chính nó chưa đạt** |
| `BAD/kinh-soc-thu-va-gel-tim.md` | 4 cơ chế · F-14 hai tầng |
| `GOOD/kinh-g1-g3-dung-cau-tao.md` | 5 cơ chế · G1/G3 ba tầng |
| `BEFORE-AFTER/2d-gop-dai-4-band-xuong-2.md` | **ảnh thật hai bên** |
| `BEFORE-AFTER/g3-vao-xuong-nhua-thanh-kinh.md` | **ảnh thật, 3 biến thể một khung** |

### `contracts/` — 3 tệp

`design-contract-template.md` (23 ô, đủ 20 mục đề bài yêu cầu) ·
`screen-spec-template.md` (12 ô) · `visual-review-template.md` (10 ô).

### `checks/` — 3 tệp

`human-centric-checklist.md` (**H0 câu chặn** + 44 câu) ·
`visual-review-checklist.md` (**100 câu**, 13 nhóm) ·
`touch-checklist.md` (45 câu, 8 nhóm).

---

## 2 · 🔴 ẢNH NÀO TÔI ĐÃ TỰ NHÌN ↔ ẢNH NÀO CHƯA — bảng đầy đủ

### ĐÃ MỞ VÀ ĐÃ NHÌN — 8 ảnh

| Ảnh | Dùng ở đâu | Rút được gì |
|---|---|---|
| `ui-authority/home-production/real-home-1440.png` | ① BAD | cung mặt trời + `05:00`/`20:00`/`HOÀNG HÔN · 3200K` · 4 nhãn HOA · **sidebar cắt ngang chữ nội dung** · ~45% chiều cao trống |
| `MOCK-home-sua-4-loi.png` | ① BAD | bản mổ xẻ bốn lỗi, có số trống-trước/trống-sau per ô |
| `02-sidebar-collapsed.png` | ② BAD | rail ~52px · **12 glyph không nhãn** · 3 cụm ngăn nhau **chỉ bằng khoảng trống** · 1 vạch tím |
| `04-2d-full.png` | ③ BAD, BEFORE-AFTER | **4 dải chrome** trên canvas + 3 dải dưới · canvas bắt đầu y≈166 · cụm 3 nút nổi giữa canvas |
| `S5-2d-gop-dai.png` | ③ GOOD, BEFORE-AFTER | **2 dải** · y≈124 · câu 12 từ đã gỡ · `Gửi sang Trình chiếu` dời sang mép phải |
| `K2-lock-face.png` | ④ BAD | cụm ~210×270px trong màn 1440×900 · `10:14` là chữ to nhất · vệt ambient **dưới ngưỡng thấy** |
| `M1-login-sang.png` | ④ GOOD | nền nâu ấm có quầng sáng lệch tâm · thẻ trong suốt **thấy nền xuyên qua** · 1 điểm bão hoà · **4 nhãn HOA** |
| `G3-vao-xuong-truoc-sau.png` | ⑤ BAD + GOOD + BEFORE-AFTER | TRƯỚC tâm=rìa · SAU rìa đặc hơn, **oklab L 0.647 → 0.353** · V2 ba vùng · **hàng cỡ thật 326×44** |

### ĐÃ MỞ VÀ BỎ — 1 ảnh

`2026-08-23-lane-workspace-01-home-CHUNK500.png` — **chỉ là một vòng xoay đang tải**. Vô dụng
làm bằng chứng. Ghi ra vì nó là ảnh Home duy nhất mang nhãn 23/08 trong repo, và người sau
sẽ đi tìm đúng nó.

### CHƯA MỞ — đã liệt kê trong tệp, và **đã ghi rõ là chưa mở**

`K1-cold-ambient` · `K2b-the-xac-thuc` · `K2c-reduce-motion` · `K3-unlock-resume` ·
`M1-login-toi` · `S1-login-font-viet` · `2026-08-23-nen-sang-apple-login-{sang,toi}` ·
7 ảnh `rail-23-08-*` · toàn bộ ảnh gốc `REF-DNA` (không nằm trong repo — tôi đọc **bản chưng
cất**, không đọc ảnh).

⇒ Mọi tệp có trích ảnh chưa mở đều mang dòng cảnh báo: *"đừng trích mô tả về chúng từ tệp này"*.

### 🔴 KHÔNG CÓ TRONG REPO

**Ảnh Hoà chụp màn Home 23/08 — ảnh của chính ca đắt nhất cả đợt.** Đã tìm bằng
`find … -newermt "2026-08-23"` và duyệt tay `artifacts/visual-review/`: không có.

`BAD/home-tuong-the-23-08.md` mở đầu bằng **một bảng tình trạng bằng chứng** khai điều này,
và mọi mô tả trong tệp đều **gắn nhãn nguồn** (số đo 23/08 từ `2026-08-23-lane-home-2.md` ↔
ảnh 22/08 tôi đã mở). **Không câu nào tả một ảnh tôi chưa nhìn.**

---

## 3 · QUYẾT ĐỊNH ĐÃ ĐƯA VÀ LÝ DO

**① Cặp ① dựng trên hai nguồn khác ngày, khai rõ ranh giới.** Đề bài nói *"ảnh thật Hoà chụp,
có tại `artifacts/visual-review/`"* — **không có**. Hai đường xử: bỏ ca đắt nhất, hoặc dựng nó
từ số đo + ảnh ca liền trước và **khai rõ**. Chọn đường hai; bảng tình trạng bằng chứng nằm
**trên cùng** tệp, không giấu ở cuối.

**② Ví dụ TỐT được phép có khuyết tật, và khuyết tật phải liệt kê thành bảng.**
`GOOD/auth-ambient-lien-tuc.md` có mục **🔴 CHỖ CHÍNH ẢNH NÀY CHƯA ĐẠT** — 4 dòng, 2 đỏ. Nếu
không, người sau chép nguyên cả 4 nhãn HOA và cả nút nhựa.

**③ `BEFORE-AFTER/` đúng 2 cặp, và cả 2 đều có ảnh thật hai bên.** Đề bài đòi *ít nhất một*.
Không bịa thêm cặp thứ ba từ bản vẽ — cặp before/after mà một bên là bản vẽ thì nó là *bản vẽ*,
không phải *thay đổi đã xảy ra*.

**④ Checklist nhị phân tuyệt đối.** Không mục nào hỏi *"trông có cao cấp không"*. Chỗ cần phán
đoán thì đổi thành **đếm** hoặc **đo**: *"đếm số khung chữ nhật cùng vật liệu ⇒ ≤3"* thay cho
*"có phải tường thẻ không"*; *"chênh sáng góc↔tâm ghi số"* thay cho *"ambient có đẹp không"*.

**⑤ `H0` là cổng CHẶN, không phải mục đầu tiên.** Trượt H0 ⇒ **dừng, không chấm tiếp**. Vì
đánh bóng một widget vô nghĩa chỉ làm nó khó gỡ hơn — và đó là cơ chế đẻ ra 4/7 widget Home.

**⑥ `screen-spec` khai rõ nó KHÔNG thay được `design-contract`.** Nếu không, nó sẽ thành
đường vòng qua cổng hợp đồng — một khuôn ngắn hơn bao giờ cũng hấp dẫn hơn.

**⑦ Đưa `DESIGN MISSING` lên đầu hợp đồng, kèm hai ca đã trả giá.** Một luật đặt ở cuối là
một luật đọc sau khi đã quyết.

---

## 4 · BA THỨ TÌM RA NGOÀI PHẠM VI

**PH-1 · Audit ghi nhẹ hơn sự thật ở lý do lọt luật.** Đã nêu ở §⓪. Đáng sửa vào audit: nó
đổi kết luận từ *"chữ đặt sai chỗ"* thành *"chữ không đủ"* — và chỉ kết luận thứ hai mới biện
minh cho việc dựng cả một kho ví dụ.

**PH-2 · Chuẩn nhấn-giữ vẫn CHƯA tách khỏi Tooltip.** Xác minh tại nguồn:
`components/ui/Tooltip.tsx:33` `TOOLTIP_LONG_PRESS_MS = 500` · `:37` `LONG_PRESS_SLOP_PX = 8`.
Tiền tố nói rõ nó **thuộc về Tooltip**; IF **chưa có** cử chỉ nhấn-giữ dùng chung. Đã ghi
thành `T4.3` (🔴) trong `touch-checklist.md`. *(Ca này chính là lỗi ghi-sai-địa-chỉ-hằng-số
mà agent bắt được 16/08 — nay xác nhận **phần gốc vẫn chưa vá**.)*

**PH-3 · Đề bài viết `docs/mocks/mock-rail-hai-cum.html` — tệp có thật**, và ảnh
`MOCK-rail-hai-cum.png` cũng có. Không lệch. Ghi ra vì tôi đã kiểm.

---

## 5 · ⑦b CHƯA CHẮC / CHƯA KIỂM 🔴

**① Số đếm bằng mắt trên ảnh là ƯỚC LƯỢNG, không phải phép đo.**
*12 glyph* trên rail · *cụm ~210×270px* trên màn khoá · *~45% chiều cao trống* ·
*canvas bắt đầu y≈166 / y≈124* — tất cả đọc bằng mắt từ ảnh **đã hiển thị lại ở tỉ lệ khác**
(có ảnh scale 1.44×, có ảnh 1.28×, có ảnh 3.59×). Sai số vài phần trăm là chắc chắn. Trong
tệp tôi đã ghi *"đếm bằng mắt"* / *"ước lượng từ ảnh"* ở đúng chỗ, nhưng **người đọc vẫn có
thể trích chúng như số đo** — đó là rủi ro thật.

**② Tôi KHÔNG chạy app một dòng nào.** Không dev server, không trình duyệt, không đo DOM.
Mọi số về app thật là **chép lại** từ `2026-08-23-lane-home-2.md` và `01-CLINICAL-UI-AUDIT.md`.
Tôi **không kiểm chứng độc lập** một số nào trong đó. Nếu hai báo cáo ấy sai, ví dụ của tôi
sai theo — và tôi sẽ **không phát hiện được**.
*(Đúng lớp lỗi 17/08: "số chép lại không phải phép đo".)*

**③ Tôi KHÔNG mở ảnh gốc `REF-DNA`.** Chúng không nằm trong repo. S1–S9 tôi trích từ **bản
chưng cất**, tức là qua **hai lớp** diễn giải (ảnh → người chưng cất → tôi). Đã ghi rõ trong
`GOOD/home-living-canvas.md`, nhưng các tệp khác trích S1/S2/S4/S7/S8 thì **chỉ ghi mã**, không
lặp lại cảnh báo — người đọc có thể tưởng tôi đã xem ảnh.

**④ Con số `oklab L 0.647 → 0.353` là tôi ĐỌC TỪ CHÚ THÍCH trên bản vẽ**, không phải tôi đo
pixel. Tôi **thấy** hai ô `TÂM · nhạt` / `RÌA · đặc` khác màu thật, nhưng **không xác minh**
cặp số ấy.

**⑤ "12 glyph không nhãn" có thể lệch.** Ảnh rail ở độ phân giải hiển thị thấp; một vài glyph
sát nhau. Con số có thể là 11 hoặc 13. Kết luận (*"không glyph nào có chữ"*) **không** phụ
thuộc con số này — nhưng con số thì có thể sai.

**⑥ Tôi chưa chạy máy soi nào** (`soi:frontier` · `soi:hinh-hoc` · `soi:tu-dien` ·
`soi:foundation`). Phạm vi là ba thư mục `.md`; nhưng điều đó nghĩa là **tôi chưa biết
`soi:tu-dien` sẽ báo gì** về 18 tệp mới. Chúng dùng nhiều từ đang trong danh sách theo dõi
(`card` · `thẻ` · `khối` · `nấc` · `lớp` · `tầng` · `kính` · `tool`). **Nhiều khả năng số
cảnh báo của `soi:tu-dien` sẽ TĂNG** vì lượt này thêm 18 tệp `.md` vào thư mục nó đã hết mù.
Chưa ai đo mức tăng.

**⑦ Ba checklist chưa được chạy thử một lần nào trên một màn thật.** Chúng có 189 câu cộng lại.
Tôi **không biết** bao nhiêu câu sẽ hoá ra không chấm được, trùng nhau, hoặc luôn *"không áp
dụng"*. Một checklist chưa hiệu chuẩn là một checklist chưa đáng tin — và chính kho ví dụ này
ghi lại ba lần các phiên khác **hiệu chuẩn công cụ trước khi dùng** (bộ tính tương phản ·
thí nghiệm hoàn-nguyên · thước `simpleCoChiTiet` chấm thử ba thứ đã biết kết luận). **Tôi
chưa làm bước đó.** Việc kế tiếp đáng làm nhất là chạy cả ba lên **một** màn đã có phán quyết
của Hoà, và xem chúng có ra đúng phán quyết ấy không.

**⑧ Hạn dùng.** Mọi con số trong kho là số đo của **22–23/08**. Nền sáng đang được chuyển sang
bản canh-Apple; khi đó phần lớn số về tương phản và ambient **phải đo lại**.

---

## 6 · VIỆC KẾ TIẾP — xếp theo giá trị

| # | Việc | Vì sao |
|---|---|---|
| 1 | **Xin Hoà ảnh Home 23/08**, dán vào `artifacts/visual-review/`, cập nhật `BAD/home-tuong-the-23-08.md` | ca đắt nhất cả đợt đang thiếu đúng thứ mà cả đợt kết luận là bắt buộc |
| 2 | **Hiệu chuẩn 3 checklist** trên một màn đã có phán quyết của Hoà | checklist chưa hiệu chuẩn = chưa đáng tin (⑦b#7) |
| 3 | Chạy `soi:tu-dien`, đo mức tăng do 18 tệp mới | ⑦b#6 |
| 4 | Tách chuẩn nhấn-giữ khỏi `Tooltip` (giữ 500ms/8px) | PH-2 · `T4.3` đang 🔴 |
| 5 | Sửa `06-DESIGN-KNOWLEDGE-AUDIT` theo §⓪ | làm kết luận của audit **mạnh hơn** |
| 6 | Nối `examples/`·`contracts/`·`checks/` vào `SKILL.md` như **bộ định tuyến** | kho có rồi mà `SKILL.md` chưa chỉ đường thì lặp lại đúng bệnh audit đã đo |

⚠️ Việc **6** đáng nhấn: audit kết luận thiếu sót số một là **BỘ ĐỊNH TUYẾN**. Kho ví dụ này
lấp được ô *"ví dụ có chú giải"*, nhưng nếu `SKILL.md` không trỏ tới nó **đúng lúc, đúng
task**, thì nó chỉ là 18 tệp nữa trong một repo đã có 674 tệp `docs/`. **Đó chính xác là căn
bệnh mà nó sinh ra để chữa.**
