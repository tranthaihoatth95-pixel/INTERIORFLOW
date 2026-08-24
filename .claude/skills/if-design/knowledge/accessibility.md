# Trợ năng — kênh dự phòng, không phải danh sách kiểm cuối cùng

> ⚠️ **Trạng thái thật**: *"a11y audit 1 lượt"* vẫn đang là **lỗ ❌ mở** trong `STATUS.md`, và
> `06-DESIGN-KNOWLEDGE-AUDIT` xác nhận NT-1..18 chỉ chạm a11y ở NT-16. Module này gom luật đã
> chốt rải rác; **nó không thay cho một lượt audit thật.**

## 1 · CÂU HỎI MODULE NÀY TRẢ LỜI
- Ngưỡng tương phản bao nhiêu? Đo ở đâu trên thẻ?
- Nút bị mờ thì báo lý do bằng cách nào?
- Kéo thả thì người không dùng chuột làm sao?
- Màu có được là kênh duy nhất không?

## 2 · LUẬT DÙNG ĐƯỢC NGAY

**A-1 · NGƯỠNG TƯƠNG PHẢN — con số, không cảm nhận:**
| Đối tượng | Ngưỡng | Nguồn |
|---|---|---|
| Chữ thường | **4.5:1** | WCAG 1.4.3 |
| Chữ lớn (≥18.66px đậm / ≥24px) | **3:1** | WCAG 1.4.3 |
| Thành phần giao diện, ranh giới, biểu tượng mang tin | **3:1** | WCAG **1.4.11** |
| Giãn chữ (line-height ≥1.5) | — | WCAG **1.4.12** (xem `typography-vietnamese.md`) |

**A-2 · ĐO TẠI CHÂN CHỮ, KHÔNG ĐO TRUNG BÌNH THẺ.** Với kính và nền ảnh, tương phản đổi theo từng
điểm. Đo trung bình cả thẻ là tự lừa. Kèm: đo trên **nhiều ảnh nền khác nhau** — nếu số **chạy theo
ảnh** thì kính quá trong (`materials-g0-g3.md` M-12).

**A-3 · ĐỘ MỜ KHAI THEO **VAI**, KHÔNG GÕ SỐ TẠI CHỖ.** Ca đã sửa: hằng số `opacity: 0.5` cho nút
vô hiệu chỉ đạt **2,55:1** ở theme SÁNG (theme tối 4,01). Sửa bằng **token theo theme**:
`--mo-vo-hieu` = **0.5** (tối, `globals.css:311`) / **0.62** (sáng, `:407`) ⇒ sáng lên **3,36:1**
trên `--panel` — **≥ 3:1 ở cả hai theme**.
⭐ Lý do chọn token thay vì số: nền sáng đổi thì token đổi theo, component **không phải đụng lần hai**.

**A-4 · MÀU KHÔNG BAO GIỜ LÀ KÊNH DUY NHẤT.** Mọi thông tin quan trọng phải có **ít nhất hai kênh**:
màu + **chữ**, hoặc màu + **hình dạng**. Ca cụ thể Hoà lo: nút **Duyệt ↔ Huỷ** phải phân biệt bằng
**chữ + vị trí + hình dạng**, không chỉ bằng xanh/đỏ. Mục đang chọn trong menu dùng **chấm tròn**,
không chỉ đổi màu.
Hệ quả cho hệ màu: **màu nghĩa** (đỏ sai · vàng cần xem lại · xanh đạt) là **khoá cứng**, người dùng
không đổi được — đổi đỏ thành hồng cho dịu mắt là làm hỏng **nghề**, không phải hỏng thẩm mỹ.

**A-5 · NÚT VÔ HIỆU: `aria-disabled`, KHÔNG `disabled`, và lý do KHÔNG nằm trong `title`.**
Đo thật (Chromium 151 + Playwright): `<button disabled>` **vẫn bắn `mouseenter`** — thứ giết đường
báo lý do là **`focus` không bắn và Tab bỏ qua hẳn**. Cộng thêm `title` **câm trên cảm ứng** và
trình đọc màn hình đọc không nhất quán.
⇒ Đường đúng: `aria-disabled` + **`aria-describedby`** trỏ tới phần tử ẩn mang lý do + có
`:focus-visible`. (Hiện repo có 52 nơi dùng `aria-describedby`.)

**A-6 · MỌI THỨ TƯƠNG TÁC PHẢI TỚI ĐƯỢC BẰNG BÀN PHÍM, và phải THẤY được khi tới.**
`:focus-visible` là bắt buộc, vòng focus đạt **3:1** (A-1). Nợ đã ghi trong sổ: **31 chỗ thiếu
focus-visible** (đo 15/08); hiện có 75 nơi dùng trong `app/` + `components/` — **chưa kiểm** con số
nợ đã giảm chưa.

**A-7 · KÉO THẢ PHẢI LÀM ĐƯỢC BẰNG BÀN PHÍM**: chọn → phím mũi tên dời → Enter thả. Không có đường
này thì người không dùng chuột **mất hẳn tính năng**. Áp cho: widget Home bento · card kanban ·
sắp lại panel · Present editor.

**A-8 · `prefers-reduced-motion` GIỮ THÔNG TIN, KHÔNG TẮT TRẮNG** — xem `motion.md` MO-8.

**A-9 · KHÔNG MẤT DỮ LIỆU IM LẶNG.** Mọi nhánh lỗi phải **nêu nguyên nhân và trả lại nguyên văn**
thứ người dùng vừa nhập. Đây là luật F-10, và nó là luật trợ năng đúng nghĩa: người dùng đang bận
không thể tự phát hiện thứ đã mất.

**A-10 · TRẠNG THÁI PHẢI THẬT.** `calm` nghĩa là *"đã kiểm, không có gì cần chú ý"* — không được
gán khi lần đọc **thất bại**. Ba trạng thái riêng: `calm` (đọc được, sạch) · im lặng (không có ngữ
cảnh) · **unknown/unavailable (đọc hỏng)**. (F-02.)

**A-11 · CHỮ CÓ DẤU ≥ 12px** và không bị ép dòng/ép ngang — xem `typography-vietnamese.md`.

## 3 · VÌ SAO — cơ chế con người
Trợ năng không phải một nhóm người dùng riêng; nó là **các kênh dự phòng cho mọi người trong điều
kiện xấu**: màn ngoài nắng công trường, mắt mỏi cuối ngày, iPad cầm một tay, người mù màu (~8% nam
giới), người dùng bàn phím vì nhanh hơn.

Mỗi luật ở trên đều là *"đừng dồn hết tin vào một kênh"*. Khi kênh duy nhất hỏng — vì ánh sáng, vì
thiết bị, vì thị lực — thì tin **biến mất hoàn toàn**, chứ không suy giảm dần.

Với IF có một lý do nghề rất cứng: màu ở đây **mang nghĩa chuẩn ngành** (đỏ = sai chuẩn). Một cảnh
báo *"hành lang thiếu 150 mm"* mà chỉ nói bằng màu là một cảnh báo có thể **không tới nơi**, và cái
giá không phải là khó chịu — là một hồ sơ sai đi ra công trường.

## 4 · CA HỎNG THẬT CỦA IF
- ⭐ **23/08 · "CÓ TRONG MÃ" KHÔNG BẰNG "TỚI ĐƯỢC NGƯỜI DÙNG".** *Nút mờ kèm lý do* lâu nay coi như
  xong — §9 có luật, code có `disabledReason`, có cả `console.warn`. **Máy soi không bắt được vì lý
  do CÓ trong mã.** Chỉ khi đo bằng **bàn phím thật + cây trợ năng** mới thấy nó **không bao giờ
  tới người dùng**. Loại lỗi này **5 máy soi hiện có không bắt nổi** — nó không lệch nhãn, không
  lệch hình học, không lệch sổ; nó là **đường dây đứt ở đoạn cuối**.
  ⇒ **Nghiệm thu phải có thao tác thật, không chỉ tsc/test/grep.**
- **Nút mờ 2,55:1 ở theme sáng** — dưới ngưỡng chính đợt sửa 16/08 nhắm tới. Đã sửa bằng token (A-3).
- **`--success` bản TỐI `#46b876` không dùng làm nền nút được**: chữ trắng trên nó chỉ **2,51:1**.
  Đo được **6 chỗ trong `docs/mocks/`** (theme sáng `#107043` sạch, 6,14:1). ⚠️ Con số 6 là **SÀN
  không phải TRẦN** — 4 dạng chưa quét (nền ở cha/chữ ở con · nền qua class khai nơi khác · bí danh
  `--ok: var(--success)` · nền đặt bằng JS).
- **F-10** — `void fetch(...)` trả 401, UI **không nói gì**, câu người dùng vừa gõ **biến mất** khi
  họ tin là đã lưu. *Mất im lặng tệ hơn lỗi hiện ra.*
- **F-02 · false calm** — và đắt nhất: **cả hai lane đều khen nó đúng**, dùng đúng cụm từ mô tả
  chính căn bệnh của nó (*"nói dối bằng một con số thật"*). Hoà bác.
- **23/08 · 6 nhãn HOA** — a11y đọc hiểu, xem `typography-vietnamese.md`.

## 5 · KIỂM THẾ NÀO
1. Đi hết màn **chỉ bằng Tab**: tới được mọi thứ chưa? Có **thấy** vòng focus mọi bước không?
2. Đo tương phản **tại chân chữ**, trên ≥3 nền khác nhau. Số có ổn định không?
3. Chụp màn → chuyển sang **thang xám**: còn phân biệt được duyệt ↔ huỷ, đạt ↔ sai không?
4. Mỗi nút mờ: lý do tới người dùng bằng đường nào? Kiểm bằng **cây trợ năng**, không bằng đọc mã.
5. Bật `prefers-reduced-motion` và chạy thật: có mất thông tin nào không?
6. Mọi thao tác kéo: có đường bàn phím không?
7. Mọi nhánh lỗi: có nêu nguyên nhân **và** trả lại nguyên văn dữ liệu không?
8. `grep -rn "opacity: *0\.[0-9]" ` — còn độ mờ nào gõ số thay vì token?

## 6 · ĐÀO SÂU
- `docs/design-campaign/02-FAILURE-LEDGER.md` F-02 · F-10
- `app/globals.css:311` và `:407` — token `--mo-vo-hieu` hai theme
- `components/ui/ToolbarChip.tsx` — đường `aria-disabled` + `aria-describedby`
- `docs/nc/NC-NGUYEN-TAC-GIAO-DIEN-TOAN-APP-2026-08-14.md` NT-16 (nấc giảm chói)
- `.claude/skills/if-design/knowledge/typography-vietnamese.md` · `motion.md` · `materials-g0-g3.md`
- Skill có sẵn của Anthropic: `design:accessibility-review` (dùng để tự chấm trước khi trình)
