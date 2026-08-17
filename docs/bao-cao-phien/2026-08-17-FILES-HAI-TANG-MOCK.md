# Báo cáo phiên · FILES-HAI-TANG-MOCK · 17/08

> Giao: T · phiếu `docs/phieu-giao/FILES-HAI-TANG-MOCK.md` · mốc `550f41e`.
> Vùng ghi: `docs/mocks/mock-files-hai-tang.html` + báo cáo này.

## ⓪b Tiền đề hạ tầng
- `git log -1` → `550f41e docs(phieu): FILES-HAI-TANG-MOCK…`
- `HEAD..main` = **0** (đứng đúng đỉnh main, không lệch).
- Untracked ngoài phạm vi: `app/workhub/`, `components/workhub/` — của phiên khác, KHÔNG đụng.

## ⓪ Tiền đề nghiệp vụ (nhận, không bác)
Đọc `docs/phieu-giao/FILES-HAI-TANG-MOCK.md`, `docs/hoa-noi/SO-TONG.md`, `docs/HOP-DONG-CAU-TRUC-DIEU-HUONG.md §3+§6`, `docs/mocks/mock-files-hai-ngan.html` (tham khảo cách render avatar+quyền, KHÔNG chép nguyên). Bố cục Hoà đưa chiều 17/08 rõ và đủ để dựng: tầng ① 5 thư mục hệ thống có QUYỀN + tầng ② Collection+ 8 nhóm với mã `COL-XXX-NNN`, đầu trang có tìm+nhập+tạo+view+thông báo+avatar. Không thấy điểm gì đo được để bác.

## 1 · Tổng quan
Dựng 1 mock HTML 570 dòng `docs/mocks/mock-files-hai-tang.html`, đủ 2 theme, 0 hex tự chế, 0 dùng `--accent`. Tầng ① 5 thẻ (Dự án · Studio · NCC · Đã duyệt · Lưu trữ) có preview SVG folder+peek + avatar + số cập nhật + badge QUYỀN dùng HÌNH DẠNG (nét đứt = chỉ đọc, viền đậm = admin). Tầng ② 8 collection có mã `COL-XXX-NNN` mono + chip trạng thái + peek đặc trưng loại vật. Đầu trang sticky + jump link "Đến Collection+". Tự chấm 2 skill design đều KHÔNG lỗi chặn (design-critique: 4 nhận xét nhỏ, không chặn; a11y-review: 4 finding — 0 critical, 2 major thuộc phiên build chứ không thuộc mock).

## 2 · Chi tiết từng mục

### Cấu trúc
| Vùng | Kích thước | Ghi chú |
|---|---|---|
| Topbar sticky | 32px tap, ô tìm 220-520px, 7 phần tử ngang | Không chứa lối đi (§6.3) — chỉ VIỆC |
| Tầng ① grid5 | `minmax(260px, 1fr)` | Preview 16/9, ít món nên rộng ngang |
| Tầng ② toolbar | 4 filter + view mode | Chip `aria-expanded` |
| Tầng ② grid8 | `minmax(240px, 1fr)` | Preview 4/3, nhiều món cần nhìn lướt |
| Ghi chú cuối | `.ghi` viền trái | Khai ranh giới ký tự placeholder ↔ lucide thật |

### Quyết định của T (khai để Hoà bác được)
1. **Bỏ tab "My" ở Collection+** — Hoà cho tuỳ, T bỏ vì đã có bộ lọc `Nguồn` phân biệt Cá nhân/Chia sẻ nhóm/Studio. Thêm tab "My" là kênh trùng.
2. **Badge quyền dùng HÌNH DẠNG (nét đứt cho Chỉ đọc, viền đậm cho Admin)** — sống được khi in đen trắng, không đụng `--accent`, tuân luật kênh dự phòng.
3. **Preview thư mục là SVG folder+peek** — CSP artifact cấm ảnh ngoài, phiếu cấm data URI ảnh thật. Mỗi thư mục có SVG khác chất: NCC = khối vân, Đã duyệt = dấu ✓ nét đứt, Lưu trữ = cột dọc kho lạnh.
4. **Peek collection theo BẢN CHẤT loại vật**: quả cầu PBR cho Vật liệu · line-art cho Furniture · mặt cắt cho Chi tiết điển hình · flow-node cho Cách làm. Người xem đoán ra loại trước khi đọc tên.
5. **Jump link "Đến Collection+" ở đầu trang** — thi hành §3 hợp đồng.
6. **Chip trạng thái collection dùng `--success`/`--warning`/`--t3`** (bản gốc, không thêm token) — chấm nhỏ + chữ.

### Đối chiếu chấm design-critique
- 4 nhận xét: phân cấp 2 nút chính, ô tìm không nói phạm vi, filter đều "Tất cả", preview folder chưa nói "ảnh THẬT".
- 3 mục Priority Recommendations. **0 lỗi chặn.**

### Đối chiếu chấm accessibility-review
- 4 finding: P1 chấm chip calm ở theme sáng (Minor), P2 ký tự placeholder trong DOM (Minor), U1 filter chưa nói trạng thái đã lọc gì (Major — thuộc phiên build), R1 phải giữ cặp `role="list"`/`listitem"` khi port (Major — cảnh báo port).
- Đo tương phản 11 điểm — **tất cả đạt ≥4.5:1** (chi tiết trong output skill).
- Bàn phím: mọi thẻ có `tabindex="0"` + `aria-label` đầy đủ. Focus ring áp toàn cục.
- **0 critical. 0 lỗi chặn AA.**

## 3 · Tổng kết vấn đề
Mock render sạch, đúng cấu trúc Hoà chốt (2 tầng ≠ chức năng, không phải 1 danh sách + bộ lọc). Cả 2 skill design đều pass. File duy nhất trong vùng ghi.

## 4 · Đánh giá khách quan
**Tốt**: 0 hex, 0 accent, đủ 2 theme, đủ aria-label, tương phản đạt AAA ở tên/tiêu đề, badge quyền dùng hình dạng.
**Chưa**: chỉ dựng NẤC VỪA (240) — chưa vẽ NẤC TO (320) mà hợp đồng §5 cửa nghiệm thu yêu cầu; nấc TO phải có thứ nấc VỪA KHÔNG THỂ có (lát cắt nội dung bên trong).
**Rủi ro**: T chưa mở file bằng trình duyệt (phiếu cấm dev server, mock là file tĩnh). Số tương phản là TÍNH từ token, không đo trên màn hình thật — nếu OS filter/gamut khác thì lệch 1-2%.

## 5 · Hướng xử lý — nhiều góc độ
**Hướng A: dừng ở bản mock hiện tại + gửi Hoà duyệt** — rẻ nhất, đúng phiếu ⑥b (trần 5 vòng đã pass ở vòng 1). Rủi ro: Hoà xem xong hỏi "nấc TO đâu?" rồi lại dựng lượt 2.
**Hướng B: dựng thêm 1 section "nấc TO 320" trong cùng mock** — cho Hoà thấy trước cửa nghiệm thu §5. Chi phí: +80-120 dòng cho 2 mẫu (Dự án nấc TO có 3 dự án gần nhất, Vật liệu nấc TO có 3 quả cầu mới). Lợi: đóng luôn câu hỏi hợp đồng.
**Hướng C: dựng bàn thử a/b của peek "SVG placeholder" ↔ "thumbnail thật (mockup)"** — cho Hoà quyết bản build dùng cái nào. Chi phí trung. Lợi: đóng câu hỏi "khi có ảnh thật thì đẹp hơn không". Rủi ro: nằm ngoài phạm vi mock hai TẦNG.

## 6 · Đề xuất hướng tốt nhất
**Hướng A** — dừng ở bản hiện tại, gửi Hoà duyệt. Lý do:
- Phiếu chỉ yêu cầu "mock 1 route scroll dọc, tầng ② nối tiếp tầng ①" (§③). NẤC TO là phần cho phiên build.
- Hoà đã duyệt gu mock qua bản `mock-files-hai-ngan.html` — cùng khuôn card, khác nội dung, không cần bàn thử lại thẩm mỹ nền.
- T mở nấc TO sớm là **kéo giãn phạm vi** — đúng thứ nguyên tắc "gọn ở lớp mặc định" nhắc cấm. Nấc TO phải đi kèm câu hỏi thật của Hoà, không dựng phòng thủ.
- Câu hỏi "nấc TO trông thế nào" nếu Hoà hỏi, mở phiếu riêng B — 30 phút là xong, không đắt.

## ⑦b CHƯA CHẮC / CHƯA KIỂM
- **Chưa mở trình duyệt thật** — phiếu cấm dev server, T thi hành nghiêm; nhưng đó cũng có nghĩa mock chỉ được xác nhận bằng đọc mã + tính tương phản, không phải bằng mắt render. Rủi ro thấp vì mock dùng token đã kiểm ở `mock-files-hai-ngan.html` (bản hôm nay Hoà đã duyệt gu). Nếu Hoà mở bằng Safari trên macOS mà thấy lệch, ca đầu tiên phải kiểm là SVG preview trong dark mode (một số SVG chuyên có bug hiển thị `xMidYMid slice`).
- **Số tương phản là TÍNH từ token, chưa đo trên màn thật** — sai số 1-2% có thể đưa `--t3` trên `--card` sáng (4,9:1) xuống dưới 4,5 nếu OS filter tô ấm. Chưa kiểm trên trình đọc màn hình thật (VoiceOver/NVDA).
- **Bàn phím**: mọi thẻ có `tabindex="0"` nhưng chưa test Tab thật xem thứ tự có đúng luồng visual không. Rủi ro thấp vì DOM đi theo thứ tự trực quan.
- **Filter Collection+ và view mode toggle** đều là placeholder tĩnh — chưa có JS mở dropdown/đổi kiểu. Đúng ý mock (không phải build), nhưng Hoà nhìn có thể tưởng nó chạy được.
- **Grid tự chảy `auto-fill,minmax(...)` chưa test ở màn <760px** — trên mobile có thể vỡ 1-2 thẻ về 1 cột; không phải mối lo lớn vì Files là màn desktop chính.

## ⑦c HẠN DÙNG KẾT LUẬN
- **Bản mock này**: hết hiệu lực nếu Hoà đổi số tầng ① (5→N khác) hoặc số nhóm Collection+ (8→N khác), hoặc lật quyết định "bỏ tab My". Cả 3 đều đo được, không phải "tuỳ ý".
- **Chấm design-critique + a11y**: hết hiệu lực khi Hoà chốt màu nhấn thứ hai (đang treo trong 8 tuần) — lúc đó có thể phá `--accent` cấm, phải chấm lại phần contrast của chip/badge.
- **Quyết định bỏ tab "My"**: hết hiệu lực nếu bộ lọc "Nguồn" hoạt động khác kỳ vọng (vd không phân biệt được Cá nhân ↔ Chia sẻ nhóm ở lần nhìn đầu).
- **Ranh giới ký tự placeholder ↔ lucide thật**: hết hiệu lực nếu app chuyển bộ icon (đang dùng lucide 100% theo `command-icon.tsx:13-16`, không có dấu hiệu đổi).

## File tạo
- `docs/mocks/mock-files-hai-tang.html` (mới)
- `docs/bao-cao-phien/2026-08-17-FILES-HAI-TANG-MOCK.md` (báo cáo này)
