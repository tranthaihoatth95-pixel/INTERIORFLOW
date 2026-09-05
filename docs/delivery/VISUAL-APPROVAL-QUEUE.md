# HÀNG ĐỢI DUYỆT MẮT

**Lập** 04/09/2026 · theo chỉ thị D3 của chủ dự án. **Cửa HARD STOP của EXS vẫn còn hiệu lực** — không thi công board chưa được duyệt mắt; hàng đợi này là để việc duyệt **rẻ và nhanh**, không phải để lách cửa.

## ⛓ AUTHORITY — đọc trước khi trình bất cứ thứ gì

**`docs/IF-KIEN-TRUC-OS.md` §NORTH STAR `N-1…N-20`** (Hoà ban 04/09) là nguồn phán cuối cho mọi
quyết định thị giác. Bốn điều ràng buộc thẳng vào hàng đợi này:
· **N-16** — máy **không** phán được bố cục/gu/thứ bậc/cảm giác cao cấp. Đường đi bắt buộc:
  `AUTHORITY → NGHIÊN CỨU BỐ CỤC → MẮT CHỦ DỰ ÁN → THI CÔNG → MÁY KIỂM → ẢNH → MẮT DUYỆT CUỐI`.
· **N-17** — trượt vì bố cục thì **DỪNG ĐÁNH BÓNG**, quay về bố cục. Cấm chữa bằng màu/bóng/bo/mờ.
· **N-20** — cổng **hai câu**: *nó chạy được?* **và** *nó đẩy sản phẩm về north star?* Câu A đạt mà
  câu B trượt thì **chưa xong về mặt sản phẩm**.
· **Gói trình mắt: TỐI ĐA 4 ẢNH**, mỗi ảnh ghi cực ngắn `TRẠNG THÁI · PHÁN GÌ · GIỚI HẠN ĐÃ BIẾT`.
  Chủ dự án chỉ cần đánh **ĐẠT** hoặc **SỬA**. Cấm bắt chủ dự án lục kho bằng chứng.

## Luật của hàng đợi

1. **Không đưa chủ dự án xem thứ chưa qua máy.** Điều kiện tối thiểu để một mục vào cột *SẴN SÀNG*: `tsc` 0 · `npm test` 0 · dựng được · và có **ảnh chụp thật** ở khổ chuẩn, đủ hai theme.
2. **Mỗi mục cô lập ĐÚNG MỘT delta.** Trộn hai thay đổi vào một ảnh là bắt người duyệt gỡ rối hộ.
3. **Chủ dự án chỉ trả một trong ba**: `PASS` · `SỬA: …` · `QUYẾT: …`. `PASS` trở thành authority, ghi vào sổ, **không hỏi lại** trừ khi có bằng chứng xung đột MỚI.
4. **Không hỏi lại một quyết định đã có.** Trước khi thêm mục, tra `docs/CHOT-EXPERIENCE-SYSTEM-2026-08-20.md` và `docs/ATLAS-KIEM-KE-2026-08-20.md` — nhãn `APPROVED` ở đó nghĩa là **đã qua mắt**, đừng bắt duyệt lần hai.
5. Mục nào **máy tự phán được** thì máy phán, không tiêu băng thông mắt: tương phản · bo góc ngoài thang · nhãn lệch từ điển · nút mờ đi sai đường.

> **Vì sao hàng đợi này tồn tại**: `soi:frontier` đếm **76 mục xong-MÁY đối 1 mục qua mắt**. Nút cổ chai của dự án không phải khối lượng mã — là **băng thông duyệt mắt của chủ dự án**. Mọi thứ ở đây phục vụ đúng một mục tiêu: mỗi phút chủ dự án nhìn màn hình đóng được nhiều mục nhất.

---

## A · HAI QUYẾT ĐỊNH — ĐÃ ĐÓNG 04/09

| | Chốt | Hệ quả thi công |
|---|---|---|
| **Chỗ đứng Vitals** | **GIỮ EXS §7** — khẩu độ sống **vật lý ở mép trên**, 3 mức Ambient→Peek→Engage. Trục phải **SUPERSEDED** | Tách **hành vi** khỏi **chỗ đứng**: hành vi Slice 12 không đụng EXS thì ADAPT vào khẩu độ; sau di trú còn **đúng một chỗ đứng vật lý**. 🔴 Kèm một **lỗi chức năng đang sống**: panel Vitals không còn nơi mount nào từ 17/08 ⇒ gõ ở thanh trạng thái + Enter là mất câu hỏi, ⌘J chết |
| **Bố cục Home** | **GIỮ EXS §6** — desktop: **một tiêu điểm chính** (Resume) + **một cụm phụ hạng dưới hẳn**. Không dashboard SaaS, không bento 9 thẻ | Bento **ở lại làm nhánh khổ hẹp**, không định nghĩa thứ bậc desktop. *"Đừng giữ bento chỉ vì mã đã có sẵn"* |

⇒ Trọng tâm chuyển từ **thu hồi** sang **hoàn tất thị giác**. Đường đi cố định cho mọi board:
`AUTHORITY → THI CÔNG → MÁY KIỂM → ẢNH CHUẨN → DELTA → MẮT HOÀ`.

## A2 · LÔ DUYỆT MẮT #1 — Hoà đã phán MỘT tấm

📄 `docs/delivery/VISUAL-REVIEW-BATCH-01.md` · 🖼 `docs/delivery/anh-duyet-mat/lo-01/`

| Tấm | Phán quyết |
|---|---|
| **1 · HOME khổ rộng** | 🔴 **TRƯỢT** (04/09). Gốc **không phải** khoảng cách/màu/chi tiết mà là **MÔ HÌNH BỐ CỤC**: *"một thẻ trắng quá khổ + một cột dashboard phụ"* không phải là *"một tiêu điểm"*. ⇒ **DỪNG thi công Home**, chuyển sang nghiên cứu bố cục (§A3) |
| **2 · VITALS khẩu độ mép trên** | ⏳ **CHƯA PHÁN** — Hoà chỉ nói về Home |
| **3 · Chrome/điều hướng trên** | ⏳ **CHƯA PHÁN** |

⛔ **Không suy ra tấm 2 và 3 đã đạt.** Hoà phán đúng một tấm; hai tấm kia vẫn nằm nguyên trong
hàng đợi, không được tự chuyển sang xong-mắt.

⭐ **Bài học lớn nhất của lô #1, ghi để không lặp**: lô đã qua **hết** cổng máy — tsc · test ·
tương phản · năm máy soi — và vẫn **trượt ở tầng bố cục**. Máy đo được *"hai vùng có đúng tỉ lệ
không"*; nó **không** đo được *"màn này đọc ra là gì"*. Đó là ranh giới thật giữa việc của máy và
việc của mắt, và nó không dịch chuyển được bằng cách thêm máy soi.

## A3 · HOME — BA NGHIÊN CỨU BỐ CỤC (04/09) · CHỜ HOÀ CHỌN

📄 `docs/delivery/HOME-NGHIEN-CUU-BO-CUC.md` · 🖼 `docs/delivery/anh-duyet-mat/lo-02-home-nc/`
(6 ảnh · khổ thật 1600×900 · cả hai nền) · bản vẽ ở `docs/mocks/mock-home-nc-{A,B,C}-*.html`

| | Mô hình | Điểm khác biệt cốt lõi |
|---|---|---|
| **A** | BÌA TẠP CHÍ | tiêu điểm **tràn mép, không vỏ thẻ**; cột phụ **không có thẻ nào** |
| **B** | DẢI LIÊN TỤC | **BỎ HẲN cột phải** — chẩn: nghĩa địa widget sinh ra từ CÁI CỘT |
| **C** | CHIỀU SÂU | **đúng MỘT vật có vỏ** trên cả màn; nền là ánh sáng theo giờ |

**Trạng thái: 0 dòng mã.** Cùng dữ liệu, cùng kiến trúc điều hướng đã duyệt — chỉ khác bố cục.
Hoà chọn một hướng (hoặc **ghép**: *"tiêu điểm của B, lớp nền của A"*) → dựng bản chi tiết cho
hướng đó (trạng thái rỗng · khổ hẹp · hover · đo tương phản) → **rồi mới code**.

🔴 Rủi ro nặng nhất đã khai trong phiếu: **chưa có trạng thái RỖNG.** A và C dựa vào một ảnh lớn;
studio chưa có dự án nào thì **cả hai yếu hẳn**. Đây là chỗ phải dựng thêm trước khi thi công,
bất kể Hoà chọn bản nào.

## B · ĐANG DỰNG BẰNG CHỨNG — chưa đủ điều kiện trình

| MỤC | ĐÃ QUA MÁY | CÒN THIẾU ĐỂ VÀO HÀNG |
|---|---|---|
| Viewport 3D hết cắt cụt trên retina | ✅ đo Chromium DPR=2: tràn 300px → 0px; có máy canh | ảnh **màn 3D thật** — viewport chỉ mount khi đã có mặt bằng 2D, cần dựng dữ liệu trước |
| Work Panel kéo được 320–440 | ✅ `tsc` · test nav · `npm test` | **thao tác kéo thật** — script chưa đưa rail lên nấc `duyet` được |
| Nền UI: đặt chỗ · hiện dần · máy kéo | ✅ 62 khẳng định thuần | **chưa cắm vào màn nào** (nơi dùng = 0) ⇒ chưa có gì để nhìn |
| EmptyState nấc "ngoại tuyến" | ✅ 8 khẳng định **render thật** | ảnh hai theme, cạnh nấc `error` để thấy khác nhau ở đâu |
| Kệ hết món câm · Promote hết `0×0` | ✅ đo thật ở tầng hàm + CSDL | đây là **đúng-sai dữ liệu**, máy phán được ⇒ **không cần mắt** (luật 5) |

---

## C · MÁY PHÁN, KHÔNG TIÊU BĂNG THÔNG MẮT

| Việc | Máy nào canh | Trạng thái |
|---|---|---|
| Tương phản token, hai theme | `lib/ui/design-tokens.test.ts` (174 cổng) | xanh |
| Bề mặt chrome, kính chọn lọc | `lib/ui/surface.test.ts` | xanh |
| Nhãn nguồn sự thật 5 nấc | `lib/ui/truth.test.ts` | xanh |
| Bo góc ngoài thang | `soi:hinh-hoc` | 37 mục — nợ, không chặn |
| Nhãn lệch từ điển | `soi:tu-dien` | không lệch |
| Sổ ↔ mã | `soi:frontier` · `soi:contract` | 0 lệch |

---

## D · CÁCH TRÌNH — rẻ nhất cho chủ dự án

Đã có sẵn hai đường, **không dựng đường thứ ba**:
· `scripts/chup-man-duyet-mat.mjs` — chụp màn THẬT (cần server + đăng nhập), đổ ảnh thẳng vào thư mục Drive đã sync để xem trên điện thoại; ghi chú trả về ở thư mục bên cạnh.
· `scripts/nen-chrome/` — dựng + đo nguyên thể chrome **không cần server/CSDL**, cho những mục chưa có màn thật.

Mỗi lô nên gộp **theo TRẠM** (cùng một màn, nhiều mục) chứ không theo mục — chủ dự án mở một màn là duyệt được cả cụm.

---

## 🚪 CỬA ĐANG MỞ — 04/09, bốn mục chờ mắt

Trang duyệt: **https://claude.ai/code/artifact/c4acf8f4-c486-417e-8900-0b41fc2fef8e**
Dựng lại bất cứ lúc nào: `node scripts/dung-cua-duyet-mat.mjs` (đọc thẳng `docs/delivery/anh-duyet-mat/`).

| Mục | Nguồn ảnh | Loại bằng chứng |
|---|---|---|
| `vitals` — khẩu độ mép trên, 3 mức | `lo-01/vitals-*.png` (03:19) | **app thật**, sau bản sửa `51d4a0d9` (03:15) |
| `h1` · `h2` · `h3` — ba hướng Home | `lo-04-home-system/*.png` | **bản vẽ**, 0 dòng mã |

**Vì sao có trang này chứ không dùng thư mục Drive (chốt 16/08):** cơ chế Drive chạy trên máy Hoà;
phiên đám mây không với tới thư mục sync đó. Đây là **mặt tiền thứ hai của cùng một cơ chế**, không
phải cơ chế mới — ảnh vẫn nằm trong repo, trang chỉ bưng chúng ra.

⚠️ **Phiên này KHÔNG được đánh thức khi Hoà bấm** (`subscribe_forbidden` — dịch vụ artifact từ chối
đăng ký đánh thức cho phiên này). Phán quyết ghi vào kho `phan-quyet/<id>`; T phải **chủ động đọc
lại** (`read_db`), không có chuông báo. Đừng khai là "đang theo dõi".

---

## 🌐 ĐƯỜNG THỨ HAI VÀO CỬA DUYỆT MẮT — bản xem trước Vercel (phát hiện 04/09)

PR #15 có bản xem trước tự dựng. Bot báo **Ready/DEPLOYED** lúc 09:37 và 09:30:

| | |
|---|---|
| Theo nhánh | `https://interiorflow-git-integration-2026-09-04-vitals-ttt.vercel.app` |
| Bản chính | `https://interiorflow-bice.vercel.app` |

**Vì sao đáng giá:** nó phá đúng giới hạn của cửa duyệt mắt hiện tại — Hoà **mở app THẬT trên điện
thoại**, thay vì chỉ soi ảnh tĩnh do máy chụp.

### 🔴 PHIÊN ĐÁM MÂY KHÔNG VỚI TỚI — và đây là bằng chứng, không phải phỏng đoán
`curl` trả `http=000`. Tra `$HTTPS_PROXY/__agentproxy/status` ra đúng nguyên nhân:
```
09:23:03  connect_rejected  gateway answered 403 to CONNECT  interiorflow-git-...vercel.app:443
09:39:48  connect_rejected  gateway answered 403 to CONNECT  interiorflow-git-...vercel.app:443
09:39:48  connect_rejected  gateway answered 403 to CONNECT  interiorflow-bice.vercel.app:443
```
⇒ **`000` là proxy của phiên chặn, KHÔNG phải bản dựng hỏng.** (Cùng họ bài học: *máy trả về RỖNG
là câu trả lời về PHÉP ĐO trước, về THẾ GIỚI sau.*) Mọi kiểm chứng trên bản xem trước **phải do máy
Hoà làm**, phiên này không tự kiểm được.

### CÁI GÌ CHẠY, CÁI GÌ KHÔNG — suy từ cấu hình, chưa mở bằng mắt
| | |
|---|---|
| ✅ Giao diện | `app/page.tsx` là **client component**, không gọi Prisma ⇒ màn đăng nhập + vỏ app render được |
| 🔴 Dữ liệu | `prisma/schema.prisma:16` provider **`sqlite`** — tệp CSDL trên Vercel là **ephemeral**, mỗi lần gọi một sandbox mới ⇒ đăng nhập/ghi dữ liệu **không bền**, nhiều khả năng lỗi |
| ⚠️ Kết luận | Bản xem trước dùng để **SOI GIAO DIỆN**, không dùng để làm việc thật |

⇒ Muốn nó thành đường duyệt mắt đầy đủ thì phải đổi sang CSDL chạy được trên serverless
(Postgres/Turso) — **việc hạ tầng, cần Hoà quyết**, chưa mở phiếu.
