# ②-TỐT · SIDEBAR — BẢN ĐỒ HAI CỤM, BA MỨC CHI TIẾT

**TỐT (bản vẽ đã kiểm hành vi, chưa nghiệm thu mắt)** · 23/08/2026 ·
bản vẽ **tôi đã mở**: `artifacts/visual-review/MOCK-rail-hai-cum.png`
(nguồn HTML: `docs/mocks/mock-rail-hai-cum.html`) ·
ảnh trạng thái thật: `artifacts/visual-review/rail-23-08-{dinhVi,dieuHuong,duyet,hover-plus,focus-plus,reduced-motion,toi-hover-plus}.png`
*(bảy ảnh trạng thái này tôi **CHƯA MỞ** — tôi chỉ liệt kê chúng tồn tại. Đừng trích mô tả
về chúng từ tệp này.)*

## Nhìn thấy gì — trên bản vẽ tôi đã mở

Bản vẽ bày **ba nấc, hai theme, và một ca lỗi**, mỗi thứ một khối:

**Ba nấc, theme tối** — `28 · định vị` / `240 · điều hướng` / `320 · duyệt`:

- **28**: một dải icon dọc, và **màn đang mở nằm ngay cạnh** — bản vẽ chú thích rõ
  *"rail không đổi theo chặng"*.
- **240**: xuất hiện **hai nhãn cụm có chữ** — `XƯỞNG` (Tổng quan · Bảng việc · Chat · Họp ·
  Files · Thư viện · Cài đặt) và `DỰ ÁN` (Dự án này · Sổ tay · Thiết kế 2D · Thiết kế 3D ·
  Trình chiếu). Mục đang mở (*Thiết kế 3D*) có nền tô + vạch trái.
- **320**: **cùng danh sách ấy, nhưng các mục mọc thêm dòng thứ hai** — *Dự án này* mọc
  `Căn hộ Thảo Điền`; *Thiết kế 3D* mọc `đang dở`. Đây là **lớp tin mới**, không phải chữ to hơn.

**Cùng ba nấc, theme sáng** — có một dòng chú thích đo được, và nó là chỗ bản vẽ tự soi mình:

> *"Nút mờ ở theme Sáng dùng `--mo-vo-hieu` .62; con số .5 của theme Tối rơi xuống 2,55:1,
> dưới ngưỡng 3:1 của WCAG 1.4.11."*

**Ca CHƯA MỞ DỰ ÁN** — cụm dưới **mờ kèm lý do, KHÔNG ẩn**. Ô giải nghĩa hiện thành câu:
*"Thiết kế 3D — Chưa mở dự án nào — chọn một dự án ở Tổng quan"*, và ở theme sáng:
*"Chat · Họp — Chưa có trang — phần này đang dựng"*.

**Bảng cuối** — ba cột: `Mục` · `Nấc rộng nhất bày gì` · **`Đã nối nguồn thật?`**. Nó khai
thẳng từng mục: *Thiết kế 2D · 3D · Trình chiếu* → **rồi**, đọc `lib/shell/last-stage.ts`;
*Files*, *Thư viện* → **chưa**, nguồn ở vùng phiên V2; *Bảng việc*, *Sổ tay* → **chưa**;
*Tổng quan*, *Cài đặt* → **bỏ** nấc ba, có ghi lý do.

## VIỆC CON NGƯỜI được phục vụ

| Câu | Nấc nào trả lời | Bằng gì |
|---|---|---|
| *tôi đang ở đâu* | **28** | vị trí + hình + vạch trái |
| *tôi đi đâu được* | **240** | **TÊN** + nhãn cụm |
| *ở đó đang có gì* | **320** | **TRẠNG THÁI SỐNG** (`Căn hộ Thảo Điền`, `đang dở`) |
| *vì sao tôi bấm không được* | mọi nấc | **mờ + LÝ DO thành câu** |
| *tôi muốn màn rộng cho việc* | **28** | rail thu, màn mở chiếm gần hết |

Câu thứ ba là câu mà cặp XẤU **không nấc nào trả lời được**. Nó là toàn bộ lý do nấc 320 tồn tại.

## NGUYÊN TẮC có mặt

| # | Nguyên tắc | Nguồn |
|---|---|---|
| 1 | `SIDEBAR` = **BẢN ĐỒ**, không phải launcher | `SKILL.md:41` |
| 2 | Sidebar = **hệ router toàn app**, hai cụm **XƯỞNG** / **DỰ ÁN**; 3 chặng chỉ là một nhóm stage | chốt Hoà 16/08 |
| 3 | Ba nấc = **ba công năng**; nấc to **bổ sung lớp tin** | chốt Hoà 16/08 |
| 4 | Nấc to nhất là **mặt nhìn của nội dung nó dẫn tới** | chốt Hoà 16/08 |
| 5 | **Không phải mục nào cũng xứng ba nấc** — *Cài đặt* không có gì để nhìn ⇒ bỏ nấc ba | chốt Hoà 16/08 |
| 6 | Mục chưa đủ điều kiện: **mờ + lý do**, không ẩn, không câm | chốt 10/08 |
| 7 | **Cấm auto-hide**; nấc thu phải **có nhãn**, thu/mở **NHỚ** giữa các phiên | `SPEC-PANEL-ROLLOUT-IDF.md`, 03/08 |
| 8 | **Ba nấc là NHỊP CHUNG toàn app**: sidebar · tool 3 lớp · card 3 nấc — không đẻ nhịp thứ hai | chốt Hoà 16/08 |
| 9 | Lý do đi bằng `aria-describedby`, **không đi bằng `title`** (`title` câm trên cảm ứng, và `<button disabled>` **không nhận focus**, Tab bỏ qua hẳn) | ledger 16/08, `components/ui/ToolbarChip.tsx` |
| 10 | Rail-icon-trái + nội dung giữa + panel phải là khung được bộ ảnh chống lưng (S8, 5/15 ảnh) | `REF-DNA` S8 |

## GIÁ TRỊ NẰM Ở ĐÂU — cơ chế

### ① Ba nấc là ba câu hỏi, và điều đó kiểm được bằng máy

Cửa nghiệm thu có hai vế, và **vế hai mới là vế chặn kéo dãn**:

| | Vế |
|---|---|
| (a) | che nấc to đi ⇒ **nấc nhỏ vẫn đứng được một mình** |
| (b) | nấc to phải có thứ nấc nhỏ **KHÔNG THỂ** có — **không phải** thứ nấc nhỏ có mà bé hơn |

Bản vẽ qua được (b) vì 320 mang `Căn hộ Thảo Điền` và `đang dở` — **dữ liệu**, không phải
kiểu chữ. 28px không có cách nào chứa nổi hai chuỗi ấy. Đó là bằng chứng vật lý rằng lớp
tin ấy **thuộc về** nấc to.

⇒ **Cơ chế: nếu bạn không nêu được một thứ mà nấc nhỏ vật lý không chứa nổi, bạn đang kéo dãn.**

### ② Bảng "đã nối nguồn thật?" — bản vẽ tự khai chỗ nó rỗng

Đây là chi tiết đáng học nhất của cả bản vẽ, và nó không phải chuyện thẩm mỹ.

Bản vẽ nào cũng vẽ được `Căn hộ Thảo Điền` vào nấc 320. Câu hỏi thật là: **dữ liệu ấy có
đường về không?** Bản vẽ trả lời từng mục: *2D/3D/Trình chiếu* rồi (`lib/shell/last-stage.ts`)
· *Files*, *Thư viện*, *Bảng việc*, *Sổ tay* **chưa**.

Không có cột đó thì nấc 320 sẽ **đẹp trên bản vẽ và rỗng trên app** — và đó đúng là gốc bệnh
số ① của cặp XẤU ở Home: khung có sẵn 11 ô nên bản vẽ nào cũng kín, app thật thì không.

⇒ **Cơ chế: bản vẽ có quyền vẽ dữ liệu chưa tồn tại, nhưng KHÔNG có quyền im lặng về việc đó.**
`02-FAILURE-LEDGER` F-04 gọi tên đúng lớp này: *existence scored as product*.

### ③ Hai cụm là hai LOẠI việc, không phải hai nhóm cho gọn mắt

`XƯỞNG` = thứ sống **không cần dự án nào** (Tổng quan · Bảng việc · Chat · Files · Thư viện ·
Cài đặt). `DỰ ÁN` = thứ **chỉ có nghĩa khi đang mở một dự án**.

Đây là ranh giới **ngữ nghĩa**, và nó giải bài toán thật: nhét cả hai vào một danh sách phẳng
thì hoặc **nửa số mục chết**, hoặc người dùng bấm vào và **không hiểu vì sao trống**.

Hệ quả kiểm được: khi chưa mở dự án, cụm dưới **mờ và nói lý do** — trạng thái ấy chỉ *tồn
tại được* vì cụm là một khái niệm thật. Nếu danh sách phẳng thì không có gì để mờ theo cụm.

⇒ **Cơ chế: nhóm phải mã hoá một ranh giới có thật; nhóm để cho đẹp thì trạng thái sẽ không
có chỗ bám.**

### ④ Mờ kèm lý do — và đường đi của lý do quan trọng ngang lý do

Ba tầng, thiếu tầng nào cũng hỏng:

1. **mờ** — nói *"không bấm được"*;
2. **lý do thành câu** — nói *"vì sao"*;
3. **lối ra** — *"chọn một dự án ở Tổng quan"*.

Và đường dẫn lý do tới người dùng: **`aria-describedby` + phần tử ẩn**, không phải `title`.
Ledger 16/08 đã trả giá cho bài này: *nút mờ kèm lý do* từng được coi là XONG vì lý do **có
trong mã** — nhưng `<button disabled>` **không nhận focus** và Tab **bỏ qua hẳn**, còn `title`
thì **câm trên cảm ứng**. Lý do có mặt mà **không tới được người dùng**.

> **"Có trong mã" không bằng "tới được người dùng".** Năm máy soi hiện có không bắt nổi lớp
> lỗi này — nó không phải lệch nhãn, không phải lệch hình học. Nó là **đường dây đứt ở đoạn cuối**.

### ⑤ Bản vẽ tự đo tương phản, và tự khai chỗ trượt

Dòng `.62` / `.5` / `2,55:1` / `3:1` trong bản vẽ là thứ hiếm: **bản vẽ tự chấm mình bằng số**,
và nêu ra con số **trượt** chứ không chỉ con số đạt. Bản vẽ không đo thì phần trượt sẽ đi
thẳng vào sản xuất, rồi mới bị bắt sau — và lúc đó nó đã nằm trong một primitive dùng chung.

## KHÔNG ĐƯỢC CHÉP GÌ

- ⛔ **Đừng chép nấc 320 sang mọi mục.** Chính bản vẽ **bỏ** nấc ba cho *Tổng quan* và
  *Cài đặt*, kèm lý do. Chép đủ ba nấc cho mọi mục là quay lại đúng lỗi kéo dãn.
- ⛔ **Đừng lấy nội dung nấc 320 của bản vẽ làm nội dung thật.** `Căn hộ Thảo Điền` là ví dụ.
  Bốn mục vẫn **chưa nối nguồn** — bản vẽ khai rõ. Dựng chúng bằng chuỗi cứng là biến một ví
  dụ minh hoạ thành **danh tính giả**, đúng lỗi `Untitled flow` mà `01-CLINICAL-UI-AUDIT` §B1
  đã bắt trên **10/13** bề mặt.
- ⛔ **Đừng chép "hai cụm" thành "mọi sidebar chia hai cụm".** Hai cụm ở đây mã hoá ranh giới
  *cần-dự-án / không-cần-dự-án*. Bề mặt khác có ranh giới khác, hoặc không có ranh giới nào.
- ⛔ **Đừng lấy `.62` làm hằng số.** Nó là giá trị của **một token** (`--mo-vo-hieu`) ở **một**
  theme. Nền sáng đổi thì token đổi; component **không được** biết con số.
- ⛔ **Đừng coi bản vẽ là nghiệm thu mắt.** Trạng thái: bản vẽ + kiểm hành vi. Hoà **chưa duyệt
  mắt** bố cục hai cụm này.
- ⛔ **Đừng trích mô tả về bảy ảnh `rail-23-08-*.png`** — tôi liệt kê chúng, **chưa mở chúng**.

## NGUYÊN TẮC THAY THẾ ĐÚNG

> **Một bản đồ, ba mức chi tiết. Mức sâu hơn cho biết trong đó ĐANG CÓ GÌ —
> không phải cho biết cùng thứ đó bằng chữ to hơn.**

Bốn ràng buộc mang đi được:

1. **Mỗi nấc phải nêu được một thứ nấc dưới VẬT LÝ không chứa nổi.** Không nêu được ⇒ bỏ nấc đó.
2. **Nhóm phải mã hoá một ranh giới có thật**, và nhóm phải mang **nhãn chữ** — khoảng trống
   không nói được nó ngăn cái gì.
3. **Không đủ điều kiện ⇒ mờ + lý do + lối ra**, đi bằng `aria-describedby`. Không ẩn, không câm.
4. **Mỗi mục ở nấc sâu nhất phải khai được nguồn dữ liệu** — chưa nối thì ghi *chưa*, đừng vẽ
   như đã có.

Đối chiếu: `BAD/sidebar-rail-icon-chung-chung.md`.
