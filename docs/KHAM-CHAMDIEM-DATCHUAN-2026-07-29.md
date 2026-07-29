# Cơ chế chấm điểm đạt chuẩn trước khi xuất — prior art + đề xuất cho IF

> Hoà hỏi: có cơ chế/thuật toán nào tương tự không, trước khi Hoà mô tả chi tiết. Câu trả lời ngắn:
> **có, rất nhiều, và IF đã tự xây một cái xuất sắc rồi — ở chặng 1.**

---

## 0. PHÁT HIỆN QUAN TRỌNG NHẤT: IF đã có rule engine đạt chuẩn, chỉ chưa dùng cho chặng 2-3

`lib/cad/standards/` — **17 file**, không phải bản nháp:

```
checker.ts        ← rule engine: đọc hình học thật → Violation[]
registry.ts       ← kho luật (id · nguồn · severity · category · verified)
fix-suggest.ts    ← đề xuất cách sửa
vn-residential · vn-fire · vn-lighting · vn-electrical · vn-accessibility
intl-egress · intl-occupant-load · iso-drafting · neufert
+ 6 file test
```

Kiểu dữ liệu lõi (`checker.ts:30-40`):

```ts
export interface Violation {
  ruleId: string;      // 'vn-res-bedroom-min-area'
  source: string;      // 'TCVN 4451' · 'QCVN 06' · 'Neufert'
  severity: Severity;  // error · warning · info
  category: string;
  message: string;
  verified: boolean;   // luật này đã đối chiếu văn bản gốc chưa
  at?: Pt;             // toạ độ để bấm-nhảy-tới đúng chỗ sai
}
```

Và **điều khoản hiến pháp** ghi ngay đầu `checker.ts` (nguyên văn):

> *"Hàm ở đây **CHỈ ĐỌC** doc và **TRẢ VỀ đề xuất** — **KHÔNG BAO GIỜ tự sửa** entity/tường/nhãn.
> Toàn bộ hành động sửa (nếu user đồng ý) phải do user tự làm… không có nút 'tự sửa' nào ở đây."*

Thêm một chi tiết cho thấy người viết rất chắc tay: nó **đo lại hình học thật** (dò biên phòng bằng
thuật toán hatch + xấp xỉ rotating-calipers để lấy bề rộng nhỏ nhất) **thay vì đọc nhãn diện tích có
sẵn** — vì nhãn có thể lệch nếu user sửa tường mà quên sửa chữ. Và khi dò biên thất bại thì **bỏ qua
phòng đó, không đoán mò**.

**→ Kết luận thẳng: đừng thiết kế cơ chế mới. Hãy mở rộng đúng cơ chế này sang chặng 2 và 3.**
Cùng `Violation`, cùng `severity`, cùng `verified`, cùng nút bấm-nhảy-tới, cùng luật "chỉ khuyên
không tự sửa". Đây là lần thứ **năm** trong phiên hôm nay ý Hoà trùng với thứ IF đã xây.

---

## 1. Prior art — 5 họ cơ chế có thật, tên gọi chuẩn để tra cứu

### ① Preflight *(ngành in — sát IF nhất)*

Đây **chính xác** là "chấm điểm đạt chuẩn trước khi xuất" trong nghề in. Acrobat Preflight ·
**Enfocus PitStop** · chuẩn **PDF/X**. Bộ kiểm tra kinh điển:

| Kiểm gì | Ngưỡng in ấn |
|---|---|
| Độ phân giải ảnh | **≥300 dpi** (ảnh nét) · ≥1200 dpi (line art) |
| Tràn lề (bleed) | ≥3mm mỗi cạnh |
| Font | phải **nhúng** hết, không thiếu glyph |
| Không gian màu | CMYK cho in · RGB cho màn hình · không lẫn lộn |
| Overprint · trong suốt | phẳng hoá đúng cách |
| Vùng an toàn | chữ cách mép ≥5mm |

**IF nên bê nguyên danh sách này** — nó khớp trực tiếp với luật ≥300dpi Hoà vừa chốt, và nó là ngôn
ngữ mà **nhà in sẽ nói với Hoà** khi từ chối file.

### ② Linter *(phần mềm — mô hình cấu trúc)*

**ESLint** là bản mẫu: mỗi luật có `id` + `severity` (`error` / `warn` / `off`) + gợi ý sửa; chạy tự
động, chặn ở CI. Figma có họ plugin **"design lint"** làm y hệt cho thiết kế (màu ngoài hệ, font lạc,
khoảng cách không theo lưới).

**IF đã theo đúng mô hình này ở `checker.ts` — kể cả trường `verified`, thứ mà ESLint không có.**

### ③ Đo chất lượng ảnh KHÔNG cần ảnh gốc *(No-Reference IQA)*

Dùng khi chỉ có ảnh kết quả, không có gì để so:

| Nhóm | Thuật toán | Đo cái gì |
|---|---|---|
| Cổ điển, thống kê | **BRISQUE · NIQE · PIQE** | nhiễu · mờ · nén vỡ · méo tự nhiên |
| Học sâu | **MUSIQ · TOPIQ · DBCNN · CLIP-IQA** | chất lượng cảm nhận, sát mắt người hơn |
| Thẩm mỹ | **NIMA** · LAION aesthetic predictor | "đẹp" theo điểm số |

Thư viện sẵn: `IQA-PyTorch` gom gần như đủ bộ trên.

### ④ Đo SO VỚI ảnh gốc *(Full-Reference)* — **ứng dụng riêng cho IF, giá trị cao**

**SSIM · PSNR · LPIPS**. Với IF thì đây không phải để đo "đẹp" — mà để đo **AI có làm sai hình khối
không**:

- *Đổi phong cách giữ bố cục*: so ảnh vào ↔ ảnh ra bằng SSIM/LPIPS → nếu lệch quá ngưỡng thì AI đã
  **đổi luôn cả bố cục phòng**, không chỉ đổi phong cách. **Đây là lỗi chết người trong nghề** — báo
  khách một mặt bằng, giao một mặt bằng khác.
- *Sketch → Ảnh thật*: so cạnh (edge map) của sketch ↔ ảnh render → đo độ bám hình khối.
- *Đổi ánh sáng*: bố cục phải gần như không đổi → SSIM phải **rất cao**; thấp = AI đã bịa thêm đồ.

Đây là kiểu kiểm tra mà **Canva/Firefly không có lý do gì để làm**, nhưng IF thì bắt buộc, vì IF bán
cho người phải chịu trách nhiệm về bản vẽ.

### ⑤ Brand check *(tuân thủ nhận diện)*

Canva có tính năng tên đúng là **"Brand check"**. IF đã có `lib/present-editor/brand-kit.ts` + nút
"Nhận diện" — nghĩa là dữ liệu để chấm đã sẵn: màu ngoài palette · font lạc · logo sai phiên bản.

---

## 2. Khuyến nghị quan trọng nhất — TÁCH LÀM HAI LOẠI, đừng trộn

Đây là chỗ hầu hết sản phẩm làm hỏng:

| | **Cổng cứng** (deterministic) | **Lời khuyên** (fuzzy) |
|---|---|---|
| Bản chất | Đo được, đúng/sai rõ ràng | Điểm số máy đoán |
| Ví dụ | dpi · khổ · bleed · font thiếu · chữ tràn khung · ảnh kéo méo tỉ lệ · tương phản <4.5:1 · còn ô placeholder chưa điền · màu ngoài brand | BRISQUE/NIQE nhiễu-mờ · NIMA "đẹp" · CLIP-IQA |
| Được phép chặn xuất? | **Có** (severity `error`) | **KHÔNG BAO GIỜ** |
| Vì sao | Sai là sai, nhà in trả file về | Máy chấm thẩm mỹ **không đáng tin**; chặn Hoà xuất file vì máy chê xấu là xúc phạm nghề |

**Luật đề xuất**: chỉ luật `error` mới chặn; `warning`/`info` hiện ra nhưng **luôn cho xuất**. Và
mọi điểm số thẩm mỹ **chỉ được hiển thị dưới dạng gợi ý**, không bao giờ dưới dạng cổng.

### Và một cảnh báo về "điểm số"

Hoà nói *"chấm điểm"* — nhưng **một con số 0-100 duy nhất là cái bẫy**. Nó gộp mọi thứ lại thành một
số vô nghĩa: 82 điểm thì thiếu gì? Sửa cái nào trước?

**Đề xuất thay thế** — đúng cách `checker.ts` đang làm ở chặng 1:

```
✗ 2 lỗi chặn xuất      → bấm để nhảy tới từng chỗ
⚠ 5 cảnh báo           → bấm để xem
ℹ 3 gợi ý
```

Nếu vẫn muốn có 1 con số để nhìn nhanh, thì **suy ra từ bảng trên** và để **nhỏ, phụ** — không bao
giờ để nó thay thế danh sách. Con số để *cảm nhận*, danh sách để *sửa*.

---

## 3. Bộ luật đề xuất cho chặng 2 và chặng 3

### Chặng 2 · Render — `severity` gợi ý

| Luật | Loại | Đo bằng |
|---|---|---|
| Ảnh xuất <300dpi ở khổ đích | **error** | phép chia, tất định |
| Bố cục lệch quá ngưỡng so với ảnh gốc (style transfer / relight) | **error** | **SSIM/LPIPS** ảnh vào ↔ ra |
| Độ bám sketch dưới ngưỡng | warning | so edge map |
| Ảnh mờ/nhiễu bất thường | warning | **BRISQUE/NIQE** |
| Vật liệu trong ảnh lệch Thẻ Gu | warning | so palette ảnh ra ↔ `GuProfile.palette` (`lib/gu.ts` đã có sẵn) |
| Chưa chạy upscale trước khi đưa sang Present | info | kiểm graph |

### Chặng 3 · Present — bám thẳng danh sách preflight

| Luật | Loại |
|---|---|
| Ảnh trên trang <300dpi ở khổ đang chọn | **error** |
| Còn ô placeholder chưa điền (`{{tên}}`, khung ảnh trống) | **error** |
| Chữ tràn khỏi khung | **error** |
| Ảnh bị kéo méo tỉ lệ | **error** |
| Font chưa nhúng khi xuất PDF | **error** |
| Chữ cách mép <5mm · thiếu bleed 3mm | warning |
| Tương phản chữ/nền <4.5:1 | warning |
| Màu ngoài palette Nhận diện · font lạc | warning |
| Trang trắng ở giữa hồ sơ | info |

---

## 4. Nơi đặt — nút xuất, không phải panel riêng

Đặt **ngay tại nút Xuất** (`IOMenu`), theo mẫu preflight: bấm Xuất → chạy kiểm → nếu có `error` thì
hiện bảng, cho **bấm nhảy tới từng lỗi** (dùng lại cơ chế `at?: Pt` đã có), có nút *"Xuất kèm lỗi"*
cho trường hợp Hoà cố ý.

**Không** làm thành 1 panel "Kiểm chuẩn" riêng cho chặng 2-3 mà người dùng phải nhớ mở — vì thứ
không ai mở thì không bảo vệ được ai. (Chặng 1 có panel riêng là hợp lý vì vẽ CAD là quá trình dài;
chặng 2-3 thì thời điểm đúng là **lúc xuất**.)

---

## 5. Xếp hàng (Luật #8b)

| Mã đề xuất | Việc | Chi phí | Xếp vào |
|---|---|---|---|
| `7.23` | **Nâng `Violation`/`Severity`/`registry` lên dùng chung 3 chặng** — tách khỏi `lib/cad/standards/` thành `lib/standards/` | Rẻ (đổi chỗ, không đổi logic) | **Sprint 3, LÀM ĐẦU** |
| `2.3.63` | **Preflight chặng 3** — 9 luật bảng §3, gắn vào nút Xuất | Trung bình, hầu hết tất định | Sprint 4, sau luật 300dpi (`2.2.76`) |
| `2.2.82` | **Preflight chặng 2** — luật dpi + **SSIM/LPIPS đo lệch bố cục** | Trung bình (cần thêm thư viện đo ảnh) | Sprint 4 |
| `2.2.83` | **Đo chất lượng ảnh mờ/nhiễu** (BRISQUE hoặc NIQE) — **chỉ cảnh báo, không chặn** | Trung bình | Sprint 5 |
| — | ~~Điểm số thẩm mỹ AI (NIMA/CLIP-IQA)~~ | — | **Khuyến nghị KHÔNG làm** — không đủ tin cậy để đặt trước mặt người làm nghề |

**Thứ tự bắt buộc**: `7.23` (dùng chung) trước mọi thứ. Làm preflight chặng 3 trước chặng 2 vì chặng
3 toàn luật tất định (rẻ, chắc), chặng 2 cần thư viện đo ảnh.

---

*Cowork, 29/07/2026. Đã đọc: `lib/cad/standards/checker.ts:1-40,218`, `fix-suggest.ts`, cả 17 file
trong thư mục, `lib/gu.ts`, `lib/present-editor/brand-kit.ts`. Nghiên cứu ngoài: Enfocus PitStop /
PDF/X preflight, IQA-PyTorch (BRISQUE·NIQE·PIQE·MUSIQ·TOPIQ·CLIP-IQA·NIMA·LPIPS·SSIM), ESLint,
Canva Brand check. Mã đề xuất — Claude Code kiểm tra trùng số trước khi dán.*

**Giờ Hoà mô tả cơ chế Hoà hình dung — tôi sẽ đối chiếu với 5 họ trên và với `checker.ts` để chỉ ra
chỗ nào đã có, chỗ nào cần thêm.**
