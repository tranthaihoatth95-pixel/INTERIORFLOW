# PHIẾU P-D · THANG TÔNG + VAI TRÒ MÀU (học Google/Apple) — bàn thử màu nhận diện

> T soạn 16/08 theo khuôn `docs/HOP-DONG-PHOI-HOP-T.md` §3.

## ⓪ TIỀN ĐỀ NGHIỆP VỤ
1. *"`app/globals.css` khai `--accent:#6a57f5` + `--accent-strong` + `--accent-soft` + `--accent-ring` là 4 giá trị ĐẶT TAY, không phải thang tông sinh ra từ một màu gốc."*
2. *"`--accent-warm:#c79a63` tự khai trong comment là NGOẠI LỆ DUY NHẤT chỉ dùng cho nút login, nhưng thực tế đã lan ra 12 tệp."*
3. *"169 tệp dùng `var(--accent)`; không tệp nào viết mã màu tím trực tiếp."*
→ `[XÁC NHẬN | BÁC BỎ | KHÔNG CÓ BẰNG CHỨNG]` + file:dòng. Bác bỏ thì DỪNG, báo T.

## ⓪b TIỀN ĐỀ HẠ TẦNG
`git log --oneline -1` + `git rev-list --count HEAD..main`. **Lệch > 0 → DỪNG NGAY, báo T.**

## ① BỐI CẢNH
Hoà (chủ dự án, kiến trúc sư) thấy app *"có cảm giác AI"* và muốn tăng sắc nhấn. T đo: tím `#6a57f5`
là indigo mặc định của gần như mọi bộ giao diện dựng sẵn — nguồn thật của cảm giác đó.

Nhưng T tra Google/Apple thì gốc vấn đề sâu hơn màu: **không hãng nào gán mã màu cho giao diện.**
Google sinh **bảng 13 tông** từ màu gốc rồi gán theo **vai trò**, vì *tông quyết định tương phản* nên
tương phản đạt chuẩn mặc định. Apple dùng **màu ngữ nghĩa** tự đổi theo sáng/tối và theo chế độ tăng
tương phản, và **tách màu thương hiệu khỏi màu giao diện**.

⇒ IF thiếu đúng hai thứ đó. Nên đổi màu mới thấy đáng sợ (phải kiểm 169 chỗ), và nút đồng ở màn khoá
mới phải mang danh "ngoại lệ" rồi lan lung tung.

## ② ĐỌC TRƯỚC
- `app/globals.css` — khối token màu đầu file (2 theme).
- `docs/00-CHOT.md`: mục **03/08** *"HAI APP HAI NHIỆT ĐỘ MÀU"* (IF lạnh ↔ ArchiNote ấm — **chốt còn
  hiệu lực, không được tự phá**) · mục **08/08** logo IF dùng `currentColor`, **cấm dùng accent**.
- `docs/nc/NC-NGUYEN-TAC-GIAO-DIEN-TOAN-APP-2026-08-14.md` (NT-1..18) + `NC-TRIET-LY-GIAO-DIEN-2026-08-14.md`.
- `docs/mocks/mock-4-huong-mau-nhan-dien.html` — bản so sánh v1 của T (4 hướng A/B/C/D).

## ③ VÙNG FILE
✅ `docs/mocks/**` (chỉ tệp của phiếu này) · `docs/nc/**` (báo cáo nghiên cứu)
⛔ **KHÔNG sửa `app/globals.css`** · KHÔNG sửa component nào · KHÔNG đổi màu trong code.
   Đợt này **CHỈ DỰNG BÀN THỬ để Hoà chọn** — chọn xong mới có phiếu thi công riêng.

## ④ VIỆC — dựng `docs/mocks/mock-ban-thu-mau.html`
1. **THANG TÔNG** — từ một màu gốc sinh thang **8 nấc** (rất sáng → rất tối), tính bằng JS ngay
   trong trang. MARKER `thangTong`. Không cần chép HCT của Google; dùng OKLCH (trình duyệt hỗ trợ
   sẵn `oklch()`) — cùng nguyên lý: giữ **độ sáng** đều tay khi đổi góc màu.
2. **VAI TRÒ MÀU** — gán từ thang, đặt tên tiếng Việt dễ hiểu, tối thiểu 6 vai:
   `nền-nhấn` · `chữ-trên-nhấn` · `khối-chứa` · `chữ-trên-khối-chứa` · `viền-nhấn` · `vòng-focus`.
   MARKER `vaiTroMau`. **Mỗi vai hiện kèm số tương phản đo được**, tô đỏ khi dưới ngưỡng.
3. **HAI LỚP MÀU TÁCH BẠCH** (học Apple) — MARKER `haiLopMau`:
   · **Màu thương hiệu** — logo · màn khoá · nút "Vào xưởng" · vật liệu quảng bá
   · **Màu công cụ** — giao diện làm việc: nút, trạng thái, vùng chọn
   Trang phải cho đặt **hai màu gốc độc lập** và nói rõ chỗ nào thuộc lớp nào.
4. **NÚM ĐỔI MÀU GỐC SỐNG** — kéo góc màu 0–360 + độ đậm; **cả bàn thử đổi theo tức thì**, kèm
   6 nút đặt sẵn: tím nay `#6a57f5` · tím mực · đồng `#c79a63` · rêu sâu · đất nung · xanh mực.
   Hoà kéo là thấy ngay, không phải chờ dựng lại mock.
5. **KHỐI MẪU THẬT** để nhìn hiệu ứng: thanh công cụ (chip bật/tắt/mờ) · thẻ dự án có dải màu đáy ·
   nút chính + nút viền · nhãn trạng thái · thanh tiến độ. **Đủ 2 theme sáng + tối.**
6. **BẢNG SO SÁNH cuối trang**: mỗi màu đặt sẵn × số vai trò đạt/không đạt ngưỡng tương phản —
   để Hoà thấy màu nào an toàn về mặt đọc được, không chỉ đẹp.

## ⑤ GIAO DIỆN
Chính trang này LÀ phần giao diện của phiếu. Theo token `app/globals.css` cho phần khung
(nền/chữ/viền/bo góc); phần **màu thử** thì được sinh động — đó là nội dung của bàn thử.
Lưu `docs/mocks/mock-ban-thu-mau.html` + dòng đầu `<!-- @dsCard group="Nhận diện" -->`.
**KHÔNG tự gọi DesignSync** (phiên phụ không có tool đó) — T đẩy khi audit.

## ⑥ RÀNG BUỘC
- **KHÔNG git · KHÔNG mở dev server · KHÔNG sửa code app.**
- ⚠️ **KHÔNG kết luận hộ Hoà màu nào đúng.** Việc của phiếu là làm cho lựa chọn **thấy được và đo
  được**; chọn là việc của Hoà. Được nêu nhận xét nghề, không được chốt.
- Giữ chốt 03/08 hai-nhiệt-độ: nếu một màu đặt sẵn làm IF thành ấm giống ArchiNote thì **ghi cảnh
  báo ngay tại nút đó**, không im lặng.
- TRIẾT LÝ: **[T5]** người quyết cuối · **[Đ2]** nhìn vào trong trước (dùng token sẵn có, không đẻ hệ mới).

## ⑦ NGHIỆM THU — ĐIỀU KIỆN ĐÍCH (⑥b), trần 5 vòng
`npx tsc --noEmit` 0 · `npm run soi:tu-dien` 0 lệch · `npm run check:mocks` 0 vi phạm ·
mở trang bằng trình duyệt, kéo thử ít nhất 3 màu, **dán số tương phản đo được** vào báo cáo.
Chưa đạt thì tự sửa rồi chạy lại; quá 5 vòng thì dừng và nộp bảng vòng-nào-hỏng-vì-gì.

## ⑦b CHƯA CHẮC / CHƯA KIỂM — trống cũng ghi "không có"
## ⑦c HẠN DÙNG KẾT LUẬN

## ⑧ DÂY MÁY
Entry: **`he-mau-2-lop`** (T mở cùng lượt). Agent KHÔNG tự sửa registry.

## ⑨ ĐỒ NGHỀ
`design:design-system` (đúng bài) · `design:accessibility-review` (**quan trọng nhất — cả phiếu này
xoay quanh tương phản**) · `design:design-critique` (tự chấm trước khi nộp) · `frontend-design`
(chống ra kết quả trông như mẫu dựng sẵn — đúng thứ Hoà đang muốn tránh).
⛔ CẤM `anthropic-skills:brand-guidelines` (áp nhận diện Anthropic, trái luật trung tính của IF).

## Báo cáo
`docs/bao-cao-phien/2026-08-16-P-D-ban-thu-mau.md`, khuôn **6 phần**.
