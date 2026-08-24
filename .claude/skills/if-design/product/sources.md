# SOURCES (Files) — bằng chứng của dự án, không phải Finder

> **[N]** = sự thật từ nguồn · **[IF]** = diễn giải. Nguồn ở §8.

## 1 · LÀ GÌ / KHÔNG PHẢI LÀ GÌ

**LÀ** — nơi trả lời: **nhận được gì · từ ai · còn mới không · IF đã hiểu chưa · nó đẻ ra cái gì ·
đang dùng ở đâu · đã bị thay chưa.** Hướng **bằng chứng**. **[N]** `SKILL.md §1`.

**KHÔNG PHẢI** — Finder · trình quản lý tệp chung chung · một cây thư mục · chợ đầu mối
(**nghĩa "chợ đầu mối" đã BỎ 16/08**, và có test canh không cho chữ đó sống lại trên màn này).

**Vị trí trong dòng chảy — đây là thứ định nghĩa nó:** **[N]** `IF-KIEN-TRUC.md §5`
```
FILES (thô, nhiều người góp) → CỬA SỔ CÔNG CỤ (thêm ĐỊNH NGHĨA) → THƯ VIỆN (đủ định nghĩa)
                                                                → ĐỀ XUẤT ĐÚNG CHỖ ĐANG LÀM
```
⇒ **Files và Thư viện không phải hai kho ngang hàng — chúng là HAI TRẠNG THÁI của cùng một thứ:**
*chưa đủ định nghĩa* ↔ *đã đủ định nghĩa*. Và **cửa sổ công cụ chính là thứ đưa nó qua ranh giới**.

## 2 · VIỆC CỦA CON NGƯỜI

| Câu hỏi thật của người dùng | Files trả lời bằng |
|---|---|
| Tôi nhận được gì? | tầng ① — thư mục hệ thống theo **QUYỀN** |
| Từ ai, được động vào tới đâu? | huy hiệu quyền trên từng thư mục |
| Còn mới không? | tình trạng cập nhật — **số thật hoặc `—`**, không bao giờ số bịa |
| IF đã hiểu chưa? | *"đã nối kho"* / *"chưa nối kho"*; ví dụ đo được: *10/10 món chưa đủ định nghĩa để render* |
| Nó đẻ ra cái gì? | 🔴 **chưa có** — xem §8 |
| Đang dùng ở đâu? | 🔴 **chưa có** (Where-Used) — xem §8 |
| Đã bị thay chưa? | 🔴 **chưa có** — xem §8 |

**[IF]** Bốn câu cuối là **phần làm cho Sources không phải Finder**. Ba trong bốn chưa dựng ⇒ hôm
nay Files vẫn **đang gần Finder hơn là gần Sources**. Nói thẳng điều đó khi giao việc.

## 3 · NHÂN VẬT CHÍNH

**Nguyên liệu, và tình trạng hiểu của nó.** Không phải cây thư mục, không phải nút thao tác.

## 4 · ĐƯỢC PHÉP CHỨA / BỊ TỪ CHỐI

### Hai TẦNG — hai TRỤC khác nhau **[N]** chốt 17/08 tối, Hoà đưa mock

**Tầng ① · THƯ MỤC HỆ THỐNG — trục QUYỀN** (*ai được động vào cái gì*)
| Thư mục | Vai | Quyền |
|---|---|---|
| **Dự án** | tệp theo từng dự án | Theo dự án |
| **Studio dùng chung** | dùng khắp studio | Toàn studio |
| **Nhà cung cấp** | map texture · NCC · **range giá** | Biên tập giới hạn |
| **Đã duyệt** | nội dung đã qua cổng duyệt | **Chỉ đọc** — viền **NÉT ĐỨT** |
| **Lưu trữ** | kho lạnh | Quản trị viên |

**Tầng ② · COLLECTION+ — trục LOẠI VẬT** (*tôi lấy nguyên liệu loại nào*)
8 gói, mã `COL-<LOẠI>-NNN`: Vật liệu · Furniture · Chi tiết điển hình · Cây · người · Design DNA ·
Gói học từ dự án · Mẫu trình bày · Cách làm. Lọc: Loại · Nguồn · Trạng thái · Cập nhật.
Quyền: Cá nhân · Chia sẻ nhóm · Studio.

**Hai tầng là hai TRỤC, không phải hai nhóm** — test canh điều đó: bắt mỗi bảng khai đủ trường đặc
trưng của trục mình (`quyen` ↔ `maLoai`); gộp hai tầng thành một danh sách là **rụng một trường ⇒ đỏ**.

| Bị từ chối | Lý do |
|---|---|
| **Tách Collection+ ra route riêng** | Collection+ là **cách TỔ CHỨC của Files**, không phải mắt xích thứ ba trong dòng chảy; rail cụm xưởng đã cân đối; và kệ Thư viện chia **theo CHẶNG** còn Collection+ chia **theo LOẠI VẬT** — **khác trục, không cạnh tranh** |
| Số mục bịa (126 · 54 · 36…) | số của bản vẽ là số **mock**. `—` = *chưa biết*, khác hẳn `0` = *đã đọc, đúng là rỗng*. **Bản vẽ quyết HÌNH, không quyết SỐ** |
| Trục lọc bấm-không-ra-gì | **nút giả**. Chưa có gì để lọc ⇒ mờ + lý do đi `aria-describedby` **và in thành chữ thật**, không đi `title` |
| Ô xem trước vẽ tay giả nội dung | chính bản vẽ tự khai *"bản build sẽ thay bằng thumbnail THẬT"* |
| Dãy avatar + "24 thư mục · cập nhật hôm nay" | không có nguồn presence/số thật cho 3/5 thư mục ⇒ thay bằng tình trạng THẬT |
| Dựng lại thanh công cụ đầu trang (ô tìm ⌘K · Nhập tệp · chuông · avatar) | trong app thật những thứ đó thuộc vỏ chung — dựng lại là **hai bản cùng một việc** |
| Cặp nút lưới ↔ danh sách | kiểu xem danh sách chưa dựng; bày nút ra là **hứa suông** |
| Chữ **"chợ đầu mối"** | Hoà bỏ 16/08; có test canh |

## 5 · TRẠNG THÁI

| | Xử lý |
|---|---|
| **Rỗng** | có, và **rỗng THẬT** — ba thư mục *Studio dùng chung* · *Đã duyệt* · *Lưu trữ* hiện màn trống thật vì **chưa nối kho** |
| **Ít** | *Nhà cung cấp* đang chạy dữ liệu thật: *10/10 món chưa đủ định nghĩa để render* — đây là trạng thái mẫu tốt |
| **Chưa biết ≠ rỗng** | `—` ≠ `0`; hai câu tổng phải khác hẳn nhau, có test canh |
| **Lỗi** | **chưa truy được nguồn** cho tầng vỏ |
| **Đang tải** | **chưa truy được nguồn** |

Mở một thẻ = **mở thư mục NGAY DƯỚI lưới**, lưới vẫn nằm nguyên (không rời trang, không hộp thoại);
thẻ đang mở nhận `aria-expanded` + viền đậm. **[IF]** Bản vẽ chỉ vẽ mức duyệt, chỗ này là suy —
đáng soi kỹ.

## 6 · CHỐT ĐÃ KÝ

| Ngày | Chốt |
|---|---|
| 16/08 | **BỎ nghĩa "chợ đầu mối"**; File Manager thu lại thành **phần THÔ của thông tin** — *chưa đủ thông tin để mang đi tạo sinh hình ảnh*; chứa thông tin chưng cất **của nhiều người dùng** |
| 16/08 | Files ↔ Thư viện là hai **trạng thái** của cùng một dòng chảy; cửa sổ công cụ là thứ đưa qua ranh giới |
| 17/08 sáng | Files có **hai NGĂN** (dự án ↔ phần thô) — ⛔ **hết hiệu lực** |
| 17/08 tối | **Hai TẦNG khác chức năng** trong cùng route `/files`; "phần thô" **không mất** — gộp vào thư mục *Nhà cung cấp* ở tầng ① |
| 17/08 | **Không tách Collection+ thành route riêng** (T tư vấn, Hoà uỷ quyền) |
| 17/08 | Collection+ mở **tầng thứ hai của engine chưng cất**: trước nay chỉ chạy cấp **dự án**, nay có cấp **studio** — mặt tiền thứ 6 của cùng một cỗ máy |
| 23/08 | Thi hành hai tầng; mã loại lấy **theo bản vẽ** (`MAT · FUR · DET · PLC · DNA · LEA · PRE · PRO`), bỏ bản viết tắt tiếng Việt tự đặt |

## 7 · CA HỎNG THẬT

**① `/files` thành màn mồ côi (23/08).** Danh sách rail chốt sáng 23/08 không có Files, mà rail là
**lối vào duy nhất** ⇒ nay chỉ vào được bằng cách gõ URL. Màn vẫn sống, vẫn chạy. **Chưa ai chỉ chỗ
đặt lối vào mới.** Đề xuất đang treo: một kệ/tab bên trong Thư viện, đúng mạch *Files → cửa sổ →
Thư viện*.

**② `--focus-ring` KHÔNG TỒN TẠI — vòng focus "đã sửa" suốt một tuần thật ra chưa bao giờ chạy.**
Mã khai `outline: var(--focus-ring)` từ 17/08; token đó **không có trong bảng token của app** ⇒ giá
trị rỗng ⇒ **trình duyệt bỏ qua cả dòng**. Bản vẽ CÓ khai token này trong khối token của nó; app thì
chưa. **[IF] Đây là họ lỗi "có trong mã ≠ có tác dụng"** — cùng họ F-14 (grid sau tường đục) và ca
chuột-phải-không-gọi-được-master-tool. Cách chữa đúng: nạp `--focus-ring` **một lần** ở bảng token
chung, đừng để mỗi màn tự khai.

**③ Ô xem trước trống chiếm gần hết chiều dọc.** Ô 16/9 (tầng ①) và 4/3 (tầng ②) rỗng ⇒ đo trên
ảnh: nội dung thật của thư mục đang mở bắt đầu ở **y ≈ 650–690px** trong màn 900. Bản vẽ lấp chỗ đó
bằng hình minh hoạ; sản phẩm không có gì thật để lấp. Hai đường ra: nối thumbnail thật, **hoặc** xin
duyệt một băng xem trước mỏng hơn — đổi số của bản vẽ thì **phải có người duyệt**. **Chưa hỏi Hoà.**
**[IF] Cùng họ với ca hỏng Home 23/08: bản vẽ vẽ với dữ liệu đầy, sản phẩm chạy với dữ liệu thưa.**

**④ Ảnh nghiệm thu chụp từ BẢN SAO, không phải cây làm việc chính** — server chính đã chết máy biên
dịch (`.next` hỏng do nhiều lượt cùng ghi). Không kill server phiên khác, không mở server thứ hai
trên `.next` dùng chung (đó **chính là** cơ chế đẻ ra bệnh này). ⇒ Chưa ai mở `/files` trên server
chính sau thay đổi.

## 8 · ĐÀO SÂU

| Cần gì | Đọc đâu |
|---|---|
| Hợp đồng cấu trúc: 5 thư mục + 8 gói + vì sao không tách route | `docs/HOP-DONG-CAU-TRUC-DIEU-HUONG.md §3` |
| Vai của Files trong dòng chảy VẬT + định nghĩa "đồng bộ" | `docs/IF-KIEN-TRUC.md §5 §6` |
| Bản vẽ chính (617 dòng) | `docs/mocks/mock-files-hai-tang.html` · *(đối chiếu: `mock-files-hai-ngan.html` = bản hiểu sai)* · `mock-thu-vien-ke.html` (đầu bên kia của dòng chảy) |
| Thi công + 5 chỗ lệch khỏi bản vẽ có lý do + số đo | `docs/bao-cao-phien/2026-08-23-lane-files.md` |
| Vỏ hai tầng + lõi thuần + test | `app/files/_lib/hai-tang.ts` · `_components/HaiTang.tsx` · `_components/CollectionPlus.tsx` |
| Ngăn thô (tái dùng, đừng viết lại) | `app/files/_lib/ngan-tho.ts` · `_components/NganPhanTho.tsx` |
| Kỷ luật `count: number \| null` (`—` khi chưa có số thật) | `lib/library/shelves.ts` |

### Test đang canh CÁI GÌ (không chỉ canh chạy đúng) — khuôn đáng học
① hai tầng là hai **TRỤC** — gộp lại là rụng một trường ⇒ đỏ · ② mã đệm 3 chữ số, **quá 999 thì dài
ra chứ không quay vòng** (mã trùng = hỏng khoá nối) · ③ `null` ≠ `0` · ④ trục lọc không dùng được
**bắt buộc có lý do**, và lý do **không được hứa "sắp có"** · ⑤ *Chỉ đọc* mang dáng **nét đứt**
(hình dạng, đọc được cả khi in đen trắng) · ⑥ chữ "chợ đầu mối" không được sống lại.

### 🔴 CHƯA CÓ / MÂU THUẪN
- **Ba câu cốt lõi chưa dựng:** *nó đẻ ra cái gì* · *đang dùng ở đâu (Where-Used)* · *đã bị thay
  chưa*. Chốt trải nghiệm 20/08 có khai họ cơ chế này (Go-to-Source · Where-Used · Blast-Radius,
  cùng thang Measured/Verified/Inferred/External/Stale) nhưng **ở cạnh phải của workspace**, chưa ai
  nối vào Files. **Đây là phần biến Files thành Sources — và nó đang trống.**
- **Thư mục *Dự án* vẫn kéo theo dữ liệu mock** qua lớp ruột cũ. Nợ có sẵn, chưa dọn — **đừng tưởng
  lượt 23/08 đã dọn.**
- **Kéo-thả bằng bàn phím chưa làm.** Bản vẽ tự khai *"sẽ nối ở phiên build"*; lượt 23/08 không có
  thao tác kéo-thả nào nên chưa tới lượt, **nợ vẫn còn**.
- **`HaiNgan.tsx` (bản hai-ngăn cũ)** đã đóng dấu lỗi thời tại chỗ, 0 nơi mount — **chưa ai quyết**
  xoá hẳn hay giữ làm dấu vết.
- **Ba câu Hoà nói mà chưa ai kẻ ranh giới:** *"thông tin chưng cất của hệ thống, của nhiều người
  dùng"* — Files có thật sự là kho **liên studio** không, hay chỉ liên **người trong một studio**?
  Câu này đổi cả mô hình quyền của tầng ①.
