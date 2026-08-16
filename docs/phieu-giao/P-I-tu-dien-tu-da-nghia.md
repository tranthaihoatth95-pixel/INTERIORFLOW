# P-I · RÀ TỪ ĐANG DÙNG ĐA NGHĨA — trình Hoà duyệt MỘT LƯỢT

> Phiếu theo khuôn §3 `docs/HOP-DONG-PHOI-HOP-T.md`.
> **THẺ VAI [Đ4]:** bạn là **phiên phụ NGHIÊN CỨU + ĐO**, không phải phiên build.
> ⚠️ Luật 16/08 *"phiên phụ phải có giao diện đi kèm"* áp cho phiếu **BUILD**. Phiếu này **không dựng UI** —
> nhưng đầu ra là văn bản Hoà **đọc và bấm duyệt**, nên nó phải **trình bày được**: bảng, không phải văn xuôi dài.
> Đây là **miễn trừ được khai rõ**, không phải chỗ im lặng bỏ qua.

---

## ⓪b TIỀN ĐỀ HẠ TẦNG
Bạn làm trong **cây chính** `/Users/tranben/Downloads/interiorflow`.
```bash
git log --oneline -1              # phải ra: 895fbaf
git rev-list --count HEAD..main   # phải ra: 0
```
Lệch > 0 → **DỪNG**, báo T.

## ⓪ TIỀN ĐỀ NGHIỆP VỤ
1. *"IF đã có máy soi từ điển chuẩn `npm run soi:tu-dien` (`scripts/soi-tu-dien.mjs`, entry `chong-lech-dinh-nghia`) — nó soi **nhãn hiển thị lệch**, và **chưa** soi **một-chữ-nhiều-nghĩa**. Vậy việc này là **mở rộng cỗ máy có sẵn**, không đẻ máy mới."*
2. *"Trong CHÍNH ngày 16/08, chữ **'icon'** trong `docs/00-CHOT.md` đã được dùng cho **6 thứ khác nhau** — T đã đề xuất tách 6 loại ở cuối mục 16/08, **đang chờ Hoà duyệt**."*
3. *"Đây đúng họ bệnh mà entry `may-soi-dong-dang` sinh ra để bắt (tín hiệu ⑤ *nhãn gần nghĩa*, và ② *hai union/enum cùng vai ngữ nghĩa khác từ vựng*)."*

Bác bỏ ý nào → **DỪNG**, báo T kèm `file:dòng`.

## ① BỐI CẢNH

Hoà tự hỏi 16/08: *"chúng ta phải quy ước lại với nhau icon ở đây nghĩa là gì?"* — đúng lúc, vì cùng ngày chữ đó đã trôi thành 6 nghĩa.

**Vì sao đây không phải chuyện đặt tên cho vui:** chốt *"ưu tiên ký hiệu hơn chữ"* chỉ áp cho **3 trong 6 loại**. Không tách thì phiên sau đọc câu đó sẽ đi bỏ nhãn cả 6 chỗ, và **3 chỗ hỏng thật** — dấu trạng thái mất nhãn thì người mù màu / để độ sáng thấp mất hết tin (vi phạm luật *màu không được là kênh duy nhất*).

Chữ "icon" chắc chắn không phải chữ duy nhất bị thế. **Việc của bạn: đo xem còn chữ nào nữa.**

## ② ĐỌC TRƯỚC

| File | Vì sao |
|---|---|
| `docs/00-CHOT.md` — **toàn bộ mục ngày 16/08** (~20 chốt, đọc hết, nhiều cái ĐÈ LÊN NHAU — luôn lấy **bản mới nhất**) | nguồn chính của các từ cần rà |
| `scripts/soi-tu-dien.mjs` | cỗ máy phải mở rộng, xem nó khai từ điển kiểu gì |
| `docs/nc/NC-NGUYEN-TAC-GIAO-DIEN-TOAN-APP-2026-08-14.md` (NT-1..18) + `docs/nc/NC-TRIET-LY-GIAO-DIEN-2026-08-14.md` (KB-1..5) | hiến pháp giao diện — nhiều từ được định nghĩa ở đây |
| `docs/mocks/mock-bo-nen-chung.html` | bộ nền dùng các từ này làm tên mục |
| `scripts/frontier-registry.mjs` entry `may-soi-dong-dang` · `chong-lech-dinh-nghia` | họ máy soi |

## ③ VÙNG FILE

**ĐƯỢC ghi (chỉ 2 file, đều MỚI):**
- `docs/nc/NC-TU-DA-NGHIA-2026-08-16.md`
- `docs/bao-cao-phien/2026-08-16-P-I-tu-da-nghia.md`

**CẤM ghi bất kỳ file nào khác.** Đặc biệt **CẤM** sửa `scripts/soi-tu-dien.mjs` và `scripts/frontier-registry.mjs` — chưa Hoà duyệt thì chưa vào máy. **CẤM** `components/ui/*` (hai phiên phụ khác đang giữ).
**KHÔNG chạy git. KHÔNG dev server.**

## ④ VIỆC

### V1 — Kiểm lại đề xuất 6 loại "icon" của T
Đọc bảng 6 loại ở cuối mục 16/08 `docs/00-CHOT.md` (Icon giao diện · Ký hiệu nghề · Icon nén tin · Hình minh hoạ · Dấu trạng thái · Nhãn loại tệp).
Với **mỗi loại**: tìm **ít nhất một ca THẬT trong repo** (`file:dòng`) minh hoạ nó.
- Loại nào **không tìm được ca thật** → nói thẳng: đó là loại **suy ra từ lý thuyết**, chưa có nơi tiêu thụ (kỷ luật `SPEC-SEMANTIC-MODEL` §3: *ngữ nghĩa chỉ thêm khi có nơi tiêu thụ*).
- Tìm được loại **thứ 7** mà T bỏ sót → nêu ra.
- Thấy hai loại **thực chất là một** → nói thẳng, kèm lý do. **Không nịnh T.**

### V2 — Rà 5 từ Hoà chỉ đích danh
**`card` · `panel` · `kính` · `nấc` · `module`.** Với mỗi từ:
1. Đếm số nghĩa đang dùng, mỗi nghĩa **một ca thật** `file:dòng` (cả `docs/` lẫn code).
2. Chấm **mức nguy hiểm**: chỗ nào **hai nghĩa dẫn tới hai việc khác hẳn nhau** → 🔴; chỉ khó đọc → 🟡; vô hại → ⚪.
3. Đề xuất **tên riêng cho từng nghĩa** — tiếng Việt, **≤ 3 từ**, đọc lên phân biệt được ngay.

**Gợi ý khởi điểm (bạn phải tự đo lại, đừng tin sẵn):** *card* có thể là thẻ dự án ở Home ↔ thẻ task ↔ Thẻ DNA ↔ task-card master tool (`lib/render-studio/task-cards.ts`) — bốn thứ. *panel* có thể là trục phải ↔ tấm Thư viện ↔ panel hàng đợi. *kính* có thể là vật liệu bề mặt ↔ tầng vỏ ↔ `mat-panel`. *nấc* có thể là 3 nấc card ↔ 3 nấc sidebar ↔ 3 nấc Vitals ↔ cờ 3 nấc `measured/inferred/verified` — **cái cuối khác hẳn bản chất, đây có thể là ca 🔴 nặng nhất.**

### V3 — Quét thêm, không chỉ 5 từ được giao
Tìm **≥ 3 từ nữa** đang đa nghĩa mà chưa ai nêu. Cùng khuôn V2.
Đầu mối tốt: từ nào xuất hiện ở **cả `docs/` lẫn tên biến/kiểu trong code với nghĩa lệch nhau**.
⚠️ Đã có tiền lệ ghi trong sổ: **`cad` ↔ `concept`** là hai hệ tên chặng song song · **4 bộ từ vựng** cho cùng khái niệm máy-suy/người-xác-nhận (`derived|user` · `measured|inferred|manual` · `measured|inferred|verified` · DistillEngine). Hai ca này **đã biết** — đừng tính là phát hiện mới, nhưng **được** dùng làm mẫu.

### V4 — Đề xuất luật máy soi (KHÔNG code)
Mô tả cách `soi:tu-dien` mở rộng để bắt loại lỗi này: khai từ điển ra sao, tín hiệu nào **tất định** (grep/AST — **KHÔNG dùng AI**, đúng luật *kiểm-bằng-máy* Hoà chốt 15/08), cái gì máy **không thể** bắt và phải để người.
Nói rõ **chi phí**: bao nhiêu chỗ sẽ báo đỏ ngay khi bật (ước tính có cơ sở), và nên bật **cảnh báo** hay **chặn**.

### V5 — MỘT bảng trình Hoà duyệt một lượt
Cuối `NC-TU-DA-NGHIA-2026-08-16.md`, dựng **một bảng duy nhất** — mỗi dòng là **một quyết định Hoà bấm được**:

| # | Từ | Nghĩa hiện đang lẫn | Tên riêng đề xuất | Mức | T khuyến nghị |
|---|---|---|---|---|---|

Xếp 🔴 lên đầu. **Mỗi dòng trả lời được bằng gật/lắc** — không có dòng nào bắt Hoà viết luận.
Trần: **tối đa 20 dòng**. Nhiều hơn thì gộp, giữ cái đau nhất — băng thông duyệt của Hoà là tài nguyên khan hiếm nhất của dự án.

## ⑤ RÀNG BUỘC
- **CHỈ ĐO, KHÔNG SỬA.** Không đổi một nhãn nào trong repo, kể cả nhãn sai rành rành — ghi vào bảng, Hoà duyệt rồi mới có phiếu sửa.
- Mọi khẳng định phải có `file:dòng`. **Đã grep thì đọc đường dẫn trong kết quả, đừng nhớ hộ máy** — T vừa mắc đúng lỗi này 16/08 (ghi sai địa chỉ hằng số nhấn giữ: nói `RadialToolMenu.tsx`, thật ra `components/ui/Tooltip.tsx:33,37`).
- **Trích mã điều khoản `docs/TRIET-LY-IF.md`**: **[T1] một-nguồn** · **[Đ2] nhìn-vào-trong-trước**. Trích **nguyên văn**; mã khác với T ghi thì báo lại đúng mã.

## ⑥ NGHIỆM THU TỰ LÀM
```bash
npm run soi:tu-dien      # ghi lại số lệch HIỆN TẠI làm mốc — bạn không được làm nó tăng
npm run soi:frontier     # xác nhận vẫn 0 lệch
```
Không đụng code ⇒ không cần `tsc`/test. Nếu bạn thấy cần chạy, chạy và nói vì sao.

## ⑥b ĐIỀU KIỆN ĐÍCH — VÒNG TỰ ĐÓNG
**ĐÍCH:** mỗi dòng trong bảng V5 có **≥1 bằng chứng `file:dòng` mở ra đúng** · `soi:tu-dien` **không tăng lệch** · `soi:frontier` **0 lệch** · bảng **≤ 20 dòng** · mỗi loại trong V1 **có ca thật hoặc bị khai thẳng là không có**.
**VÒNG:** chưa đạt → tự sửa, **trần 5 vòng**. **QUÁ TRẦN → DỪNG**, nộp kèm bảng *"vòng nào hỏng vì gì"*.
**CẤM** bịa `file:dòng` cho đủ bảng. Thà bảng 8 dòng thật còn hơn 20 dòng có 5 dòng tô vẽ.

## ⑦ BÁO CÁO
`docs/bao-cao-phien/2026-08-16-P-I-tu-da-nghia.md`, **khuôn 6 phần** `docs/CLAUDE.md`.

## ⑦b CHƯA CHẮC / CHƯA KIỂM — bắt buộc, trống cũng ghi "không có"
Bắt buộc phủ: bạn quét **bao nhiêu phần** của `docs/` (674 file · 32MB — **chắc chắn không đọc hết**, nói rõ đã quét gì và **bỏ qua gì**) · chỗ nào **suy** chứ không **đo** · từ nào bạn **nghi** đa nghĩa mà **không đủ bằng chứng** (vẫn nêu, đánh dấu "nghi, chưa chứng minh").

## ⑦c HẠN DÙNG KẾT LUẬN
*"Kết luận này hết đúng khi …"* — ít nhất phủ: khi Hoà duyệt/bác bảng 6 loại icon · khi `soi:tu-dien` được mở rộng · khi bộ nền được duyệt (nhiều tên mục sẽ chốt theo đó).

## ⑧ DÂY MÁY
Entry registry: **`chong-lech-dinh-nghia`** (mở rộng) · **`may-soi-dong-dang`** (cùng họ, tín hiệu ②/⑤) — bạn **không** sửa registry, T flip sau audit.
