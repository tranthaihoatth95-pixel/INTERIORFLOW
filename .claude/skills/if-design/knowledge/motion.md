# Chuyển động — chuyển động là THÔNG TIN

## 1 · CÂU HỎI MODULE NÀY TRẢ LỜI
- Hiệu ứng này có đáng tồn tại không? Lấy gì để phán?
- Bao nhiêu ms? Số ở đâu ra?
- `prefers-reduced-motion` bật thì tắt hết à?
- Vì sao app trông "sống" mà vẫn thấy rẻ tiền?

## 2 · LUẬT DÙNG ĐƯỢC NGAY

**MO-0 · LUẬT GỐC — CHUYỂN ĐỘNG TRẢ LỜI NHÂN QUẢ.** Mọi chuyển động phải trả lời được **bốn câu**:
> **từ đâu tới · đi đâu · cái gì đổi · vì cái gì.**
Không trả lời được cả bốn ⇒ đó là trang trí ⇒ **bỏ**.

**MO-1 · NỞ TỪ NGUỒN, KHÔNG TELEPORT** (`IF-MOTION-VISUAL-LAW §0`): icon → capsule · capsule →
panel · card → inspector · Vitals aperture → peek → engage · selection → công cụ ngữ cảnh ·
khối nội dung → bố cục Auto Grid. `transform-origin` đặt tại **hộp nguồn thật**, không đặt giữa màn.

**MO-2 · THANG NHỊP IF — dùng thang này, không tự chế:**
| Việc | ms |
|---|---|
| hover / press | **100–160** |
| tooltip · capsule · hiện theo ngữ cảnh | **140–200** |
| kệ · inspector | **180–260** |
| chuyển stage / ngữ cảnh | **240–380** |
| morph bố cục · Auto Grid | **300–700** (tuỳ độ phức tạp) |
Thang này **đè dải của `SPEC-APPLE-MOTION-MATERIAL` khi vênh** (file cũ đã đóng dấu).
Token đã có trong code: `--nhip-bam: 130ms` · `--nhip-vien: 170ms` · `--dur-fast .18s` ·
`--dur-base .32s` · `--ease-apple: cubic-bezier(0.32,0.72,0,1)`.
⚠️ `app/globals.css` và `lib/ui/nhip.ts` là **hai bản của cùng một thang — sửa một phải sửa bên
kia**; `lib/ui/nhip.test.ts` canh cặp này.

**MO-3 · VÀO CHẬM, RA NHANH.** Hover-out ngắn hơn hover-in ~**30%** (200ms vào → 140ms ra).

**MO-4 · KHÔNG BOUNCE VÔ NGHĨA**, không spring quá tay, **không animation làm chậm thao tác nghề**.

**MO-5 · MỨC PHẢN HỒI THEO TẦN SUẤT** (`§VI` luật "UI sống"): dùng liên tục → **rất nhẹ** ·
theo ngữ cảnh → rõ hơn · **có hậu quả** → mạnh hơn · AI/hệ thống → cho biết hệ đang làm gì.
> **"Alive" ≠ "animated everywhere".** Không cần mọi card đều bay lên.

**MO-6 · BA TẦNG ÁNH SÁNG, BA NGHĨA — KHÔNG ĐƯỢC LẪN** (Hoà chốt 16/08):
| Tầng | Khi nào | Nghĩa | Hình thức |
|---|---|---|---|
| ① kính nhận sáng | luôn luôn | **chất liệu** | mép bắt sáng · bề mặt đổi theo thứ nằm dưới |
| ② gradient khi trỏ vào | rê chuột | **khả năng bấm được** | quầng sáng **quanh viền**, mặt card không đổi; buông là về |
| ③ viền chạy liên tục | đang render | **trạng thái đang chạy** | ánh sáng chạy vòng viền |
② và ③ **cùng ở viền** ⇒ phân biệt bằng **CHUYỂN ĐỘNG**: viền **sáng đứng yên** = con trỏ đang ở
đây · viền **chạy vòng** = đang chạy. Bản vẽ phải dựng cả ba cạnh nhau chứng minh phân biệt được —
**đây là điểm nghiệm thu**.
⛔ **Glow tĩnh trang trí là cấm** (NT-11: ánh sáng chỉ mang nghĩa).

**MO-7 · CÁI GÌ ĐANG CHẠY CŨNG PHẢI CÓ THANH TIẾN TRÌNH** — và **hai loại, cấm bịa phần trăm**:
- **đo được** (tải tệp · xuất PDF · hàng đợi render) → chạy theo **số thật**, có % và thời gian còn lại
- **không đo được** (gọi AI · dò tệp · chờ máy chủ) → **dạng KHÁC HẲN**, chạy vô hạn, **KHÔNG có số**

Hai loại phải **nhìn-là-phân-biệt-được**. Bịa % là vi phạm luật khai-thật, và người dùng phát hiện
thì **mất niềm tin vào mọi con số khác trong app**. IF đã khoá bằng kiểu dữ liệu: nhánh
*không-đo-được* trong `lib/ui/tien-trinh.ts` **không có trường `pct`** ⇒ bịa số là **`tsc` đỏ**;
lõi **cố ý không có hàm ETA** và có test canh cho nó tiếp tục không có.
Phân vai với MO-6: **viền chạy** = *"card này đang chạy"* nhìn **từ xa** · **thanh tiến trình** =
*"còn bao lâu"* nhìn **gần**. Một card đang render có cả hai và không đánh nhau.

**MO-8 · `prefers-reduced-motion` KHÔNG CÓ NGHĨA TẮT HẾT.** Vẫn phải giữ **nhân quả · thứ bậc ·
liên tục · trạng thái** — bằng chuyển động tiết chế hoặc bằng kênh khác:
| Thay vì | Khi giảm chuyển động |
|---|---|
| scale + lift 200ms | chỉ **đổi nền ≤ 100ms** |
| panel trượt vào | hiện thẳng, giữ đúng vị trí đích |
| viền chạy liên tục | **dấu hiệu tĩnh** (nhãn "đang chạy" + chấm) — thứ đầu tiên phải tắt |
| morph bố cục | đổi tức thì, giữ nguyên thứ tự đọc |
Cắt sạch mọi phản hồi là **lấy mất thông tin** của đúng nhóm người dùng cần nó nhất.

**MO-9 · CHUYỂN STAGE KHÔNG PHẢI CHUYỂN TRANG WEB** (`§VIII`): shell **giữ nguyên** · cụm stage
active chuyển · canvas/viewport **morph** · context strip giữ project/space · selection liên quan
được **preserve** · toolbar đổi working set. 2D→3D là **đổi chế độ**, không phải mở app khác.

## 3 · VÌ SAO — cơ chế con người
Mắt người theo dõi **vật chuyển động liên tục** và coi đó là **cùng một vật**. Đó là toàn bộ giá
trị của MO-1: vật nở ra từ nút vừa bấm thì người dùng **biết ngay** nó là gì và đóng lại sẽ về đâu
— không cần đọc, không cần nhớ. Vật xuất hiện giữa màn thì họ phải **dựng lại quan hệ** trong đầu.

Ngược lại, chuyển động không mang tin thì **cạnh tranh với nội dung** để lấy chú ý và làm chậm
thao tác — và với app nghề, chậm 200ms nhân vài nghìn lần một ngày là chi phí thật.

## 4 · CA HỎNG THẬT CỦA IF
- **02/08 · K1 kính lỏng**: đặt `opacity` + `transition` ở **wrapper cha** cô lập backdrop ⇒ **blur
  chết khi fade**. Luật rút: **fade kính = self-opacity, KHÔNG fade cha**.
- **02/08 · K3**: thiếu tiền tố Webkit ⇒ **tablet không blur**. Chuyển động/chất liệu phải kiểm
  trên thiết bị thật, không chỉ trên máy người dựng.
- **`CameraExportTab.tsx:189`** — `done / Math.max(1, total)` **bịa 0% khi `total === 0`**. Đúng
  loại lỗi MO-7 sinh ra để diệt; đã sửa để `total ≤ 0` ⇒ "chưa biết", cung quay, **không
  `aria-valuenow`**, không con số nào.
- **L8 (`NC-NGUYEN-TAC-GIAO-DIEN` mục 6)**: card kính gradient mới ở mức entry, chưa thi công ⇒
  **nguy cơ ai đó thêm glow tĩnh**. Đang canh.
- **16/08 · T mô tả sai tầng ②**: T dặn *"gradient nổi trên BỀ MẶT"*; Hoà chỉ ảnh: đó là **quầng
  sáng lan quanh VIỀN**, mặt card không đổi. Ghi lại vì mô tả sai một chỗ nhỏ làm cả bản dựng lệch.
- **Chỗ đã kín, đừng lấy lại**: quầng sáng viền trong ảnh tham chiếu thực ra là **presence** (người
  khác đang ở node). Khi IF làm cộng tác thật, presence cần **kênh thứ ba**.

## 5 · KIỂM THẾ NÀO
1. Với mỗi hiệu ứng: viết được **bốn câu** MO-0 không?
2. Số ms đang dùng có nằm trong thang MO-2 không? Có đi qua token không, hay gõ số?
3. `transform-origin` có đặt tại hộp nguồn thật không? (MO-1)
4. Bật `prefers-reduced-motion` **và thật sự chạy thử**: nhân quả còn đọc được không, hay mất trắng?
5. Mọi việc đang chạy có chỉ báo không? Chỉ báo đó đúng loại (đo được / không đo được) chưa?
6. Có con số % nào **không đến từ số thật** không?
7. Dựng ba tầng ánh sáng MO-6 cạnh nhau: nhìn phát có phân biệt được không?

## 6 · ĐÀO SÂU
- `docs/IF-MOTION-VISUAL-LAW.md` — toàn văn (§0 nhịp · §III–§VIII), §IX đoạn luật dán cho Claude Design
- `docs/SPEC-HOVER-FOCUS-IDF.md` — bảng 9 loại phần tử × hover/press/selected, 8 luật chung
- `docs/SPEC-APPLE-MOTION-MATERIAL.md` — nguồn WWDC (dải bị IF đè khi vênh)
- `lib/ui/tien-trinh.ts` · `lib/ui/nhip.ts` · `app/globals.css` (thang nhịp, hai bản phải khớp)
