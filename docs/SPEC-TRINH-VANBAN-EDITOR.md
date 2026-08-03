# SPEC — EDITOR VĂN BẢN / BIỂU MẪU (loại hồ sơ #5 — đủ 5/5)
**COWORK-TRÌNH lập theo ĐỢT 3 (`SO-KIEM-TONG` §3, TỔNG bơm 03/08 ~02:1x).**
**§0b:** SEARCH = `BrandKit` (`lib/present-editor/brand-kit.ts:35`) · `BoqResult` (`lib/boq/model.ts:73`) · i18n `t(lang, vi, en)` inline (`lib/i18n.ts`) · docType CHƯA có trên main (cơ chế do `SPEC-TRINH-MATERIAL-A3` §4 đề xuất — **làm MỘT lần dùng chung 3 spec**). NGHIÊN CỨU = nền đã chốt `SPEC-MODE-PER-STAGE` §4 ("document — thuyết minh/hồ sơ/hợp đồng song ngữ — skill docx + template") + `NC-xuat-pdf-in` (font Việt·2 preset·không flatten) + `LUAT-CHU-VIET-7.1.23`. NGƯỜI DÙNG THẬT = chủ trì/quản lý dự án nội thất VN: cần báo giá + hợp đồng RA NHANH từ số liệu đã có trong dự án, không muốn gõ lại Excel→Word.
**⚠️ Giới hạn trung thực (§0):** CHƯA có bài NC riêng về document editor (Google Docs/Word online/Craft) → spec này GIỮ PHẠM VI **BIỂU MẪU** (template + biến tự điền, kiểu mail-merge). Muốn word-processor đầy đủ (text chảy trang tự do) → đặt COWORK-NC trước, không lách.

## §1 · BẢN CHẤT + 3 MẪU KHỞI ĐẦU
Văn bản = **biểu mẫu A4** đổ dữ liệu dự án vào chỗ trống — KHÔNG phải Word. 3 template builtin (TRUNG TÍNH — `LUẬT NỀN TẢNG`, không chuỗi/màu TTT):
1. **Báo giá** (đơn giá) — đầu đề, thông tin 2 bên, bảng BOQ rút gọn nhúng sống, tổng + điều kiện.
2. **Hợp đồng thi công** — điều khoản mẫu, biến 2 bên, giá trị từ BOQ, chỗ ký.
3. **Thuyết minh thiết kế** — mô tả concept, ảnh chèn từ dự án, danh mục vật liệu chính.
Song ngữ VI/EN: mỗi template 2 bản qua `t(lang, vi, en)` — đúng LUẬT NỀN TẢNG #5, không nhồi 2 thứ tiếng 1 trang.

## §2 · MÔ HÌNH TRANG — KHỔ CỐ ĐỊNH, KHÔNG AUTO-FLOW (quyết định kiến trúc v1)
- `docType:'document'` (cùng field additive với `'material-board'` — ai code trước thêm union, ai sau dùng chung). Trang = slide **A4 dọc 210×297mm**, engine present-editor tái dùng trọn (element·undo·layer·Brand Kit·export).
- **Mỗi trang bố cục CỐ ĐỊNH theo template; text box đổ nội dung, KHÔNG tự chảy sang trang.** Chữ tràn box → hiện cảnh báo tràn (viền `--warning` + đếm ký tự thừa), user tự cắt hoặc thêm trang từ template. Trade-off ghi thẳng: đây là giới hạn CHỦ ĐÍCH của mô hình biểu mẫu — auto-flow là bài word-processor, v2 + NC.
- Chữ Việt theo `LUAT-CHU-VIET-7.1.23`: `line-height ≥ 1.5` · cấm hoa toàn phần tiêu đề dài · không tracking âm.

## §3 · BIẾN TỰ ĐIỀN — TRÁI TIM CỦA SPEC ⭐
- Cú pháp trong template: `{{tên_biến}}`. Bảng biến chuẩn v1 (nguồn = code thật, không bịa):

| Nhóm | Biến | Nguồn |
|---|---|---|
| Dự án | `{{ten_du_an}}` `{{khach_hang}}` `{{ngay}}` | project + `BrandKit` (đọc interface `brand-kit.ts:35` lấy tên trường thật khi code) + Date |
| Nhận diện | logo·màu·font tiêu đề·watermark | Brand Kit CỦA DỰ ÁN (cơ chế sẵn có của deck — không việc mới) |
| Tiền | `{{tong_boq}}` `{{tong_boq_chu}}` (số thành chữ VN) | `BoqResult.totalAmount` — sống, không copy số chết |
| Bảng | `{{bang_boq_rut_gon}}` `{{bang_vat_lieu}}` | block nhúng §4 |
| Hai bên | `{{ben_A_*}}` `{{ben_B_*}}` | form nhập 1 lần / dự án, lưu theo project |

- **Trạng thái biến minh bạch:** có dữ liệu → điền + nền hơi ánh accent (hover thấy nguồn); CHƯA có → placeholder `⟨chưa có — bấm điền⟩` màu `--warning`, KHÔNG im lặng để trống (biểu mẫu ra khách mà thiếu tên bên B là tai nạn thật).
- **Sửa đè giá trị biến** = trở thành text tay: badge chấm màu + revert về giá trị máy — CÙNG cơ chế trigger-formula của `SPEC-TRINH-BOQ-EDITOR` §5 (`CHOT-TACH-AI`: dấu + truy vết). Số máy đổi sau đó (BOQ tính lại) → cảnh báo lệch như BOQ.
- Hàm số-thành-chữ VN (`{{tong_boq_chu}}`): việc lib nhỏ cho PHU (thuần, có test — "1.234.500 → một triệu hai trăm ba mươi tư nghìn năm trăm đồng").

## §4 · BLOCK BẢNG NHÚNG SỐNG (một-nguồn)
- `{{bang_boq_rut_gon}}` render bảng CHỈ-ĐỌC từ `BoqResult.rows` — chọn cột hiện (mặc định: Tên·KL·Đơn giá·Thành tiền), giới hạn N dòng + dòng "…và k hạng mục — xem BOQ đầy đủ". Vùng lỗi BOQ KHÔNG vào bảng nhúng, chỉ 1 dòng chú "*chưa gồm j vùng lỗi" nếu j>0 (không che lỗi — §0).
- Sửa số trong bảng nhúng = KHÔNG cho (muốn sửa → sang editor BOQ, một-nguồn). Bảng tự cập nhật khi BOQ đổi.

## §5 · TEMPLATE + THƯ VIỆN
Lưu mẫu riêng: "Lưu thành mẫu của tôi" → kệ C3 Present (`SPEC-STAGE-LIBRARIES` — publish=template mới, cơ chế có sẵn). Biến giữ nguyên dạng `{{...}}` trong mẫu. 3 câu treo của STAGE-LIBRARIES (ai publish…) áp ở đó, không giải ở đây.

## §6 · XUẤT
- **PDF A4**: 2 preset "In văn phòng"/"Gửi nhà in" (NC-pdf#1#2) · **mọi chữ qua `lib/pdf-font.ts`** + ca test dấu hiếm (NC-pdf#3) · text searchable, không flatten (NC-pdf#7 — hợp đồng phải search được).
- **DOCX = v2**, ghi mục tiêu (SPEC-MODE-PER-STAGE nhắc "skill docx") — PHU thẩm định lib js trước, KHÔNG hứa trong v1.

## §7 · BA MẢNG §0c (thiếu 1 = 🔴)
1. **Phím tắt:** Tab nhảy giữa các BIẾN chưa điền (như form) · Enter điền · ⌘K có "Điền bên A/B · Xuất PDF · Đổi ngôn ngữ" · `:focus-visible`.
2. **Lệnh tương tác:** status bar đếm "còn 3 biến chưa điền" — bấm nhảy tới biến gần nhất.
3. **Cảm ứng:** biến là vùng chạm ≥ `--tap 44` khi selected · không chức năng chỉ-hover (nguồn biến hiện qua bấm-giữ trên tablet).

## §8 · KHÔNG LÀM (v1)
Auto-flow đa trang · track changes/comment · TOC · style tự do từng đoạn (template quyết style) · chèn công thức · merge nhiều dự án · DOCX (v2).

## §9 · NGHIỆM THU
| # | Kiểm | Đạt khi |
|---|---|---|
| 1 | Tạo Báo giá từ dự án demo có BOQ | biến dự án + tổng + bảng nhúng điền đúng; đổi BOQ → mở lại thấy số mới |
| 2 | Biến thiếu (chưa nhập bên B) | placeholder --warning + status bar đếm; Tab nhảy đúng; PDF xuất có cảnh báo chặn "còn biến trống — vẫn xuất?" |
| 3 | Sửa đè `{{tong_boq}}` rồi BOQ đổi | badge tay + cảnh báo lệch + revert đúng |
| 4 | Đổi VI↔EN | template đổi bản ngữ, biến giữ giá trị |
| 5 | Xuất PDF cả 2 preset | chữ Việt đủ dấu (ca "ẳ ỹ ợ") · searchable · Brand Kit dự án, KHÔNG chuỗi TTT |
| 6 | 3 mảng §0c + 2 theme + tràn box | cảnh báo tràn hiện đúng, không mất chữ im lặng |

*COWORK-TRÌNH lập ĐỢT 3. Việc PHU kèm: hàm số-thành-chữ VN (§3) + thẩm định lib DOCX (§6, v2). Append-only.*
