# PHIẾU FILES-HAI-TANG-MOCK — dựng mock Files hai TẦNG cho Hoà duyệt

> Giao: T · 17/08 tối · vùng ghi: `docs/mocks/mock-files-hai-tang.html` + báo cáo.
> ⛔ **KHÔNG code**, chỉ dựng mock HTML tĩnh để Hoà duyệt mắt trước khi mở phiếu build.
> ⛔ KHÔNG đụng `app/files/**` (V2 cũ giữ nguyên, sẽ build lại sau khi Hoà bấm ✓).

## ⓪b `git log -1` + `HEAD..main` = 0. Mốc khi phóng: `a29b3d7`.

## ⓪ TIỀN ĐỀ (có quyền BÁC → DỪNG)
> Hoà đưa mock chiều 17/08 (ảnh dán vào chat). Bố cục:
> **Tầng ① Thư mục hệ thống** — 5 thư mục có quyền (Dự án 24 tm · Studio 186 tệp · NCC 42 nguồn · Đã duyệt 328 nội dung · Lưu trữ 1.204 tệp), mỗi thẻ có ảnh preview folder+peek + avatar + cập nhật + quyền.
> **Tầng ② Collection+** (bỏ "My" tuỳ) — 8 nhóm gói (Vật liệu 126 · Furniture 54 · Chi tiết điển hình 36 · Cây·người 22 · Design DNA 8 thẻ · Gói học từ dự án 12 · Mẫu trình bày 18 · Cách làm 7), mã `COL-<LOẠI>-NNN`, bộ lọc Loại/Nguồn/Trạng thái/Cập nhật.
> **Đầu trang**: ô tìm + Nhập tệp + Tạo thư mục + view mode + thông báo + avatar.
> 
> Đọc kỹ mô tả này ở `docs/hoa-noi/SO-TONG.md` (nạp lần đầu) và `docs/HOP-DONG-CAU-TRUC-DIEU-HUONG.md §3` (bản mới) trước khi bác.

## ② ĐỌC TRƯỚC
`docs/hoa-noi/SO-TONG.md` (mô tả bố cục Hoà đưa) · `docs/HOP-DONG-CAU-TRUC-DIEU-HUONG.md §3` (hợp đồng bản mới) · `docs/IF-KIEN-TRUC.md §5` (dòng chảy VẬT) · `app/globals.css` (đọc token, KHÔNG SỬA) · `docs/mocks/mock-files-hai-ngan.html` (mock V2 cũ, tham khảo cách render avatar+cập nhật+quyền, KHÔNG chép nguyên).

## ③ VIỆC
1. `docs/mocks/mock-files-hai-tang.html` với `<!-- @dsCard group="Files" -->` dòng đầu.
2. Dựng theo mock Hoà đưa (đã dán vào chat, mô tả đầy đủ ở SO-TONG.md):
   - **Tầng ①** 5 thẻ thư mục hệ thống — có mock avatar (letter avatar OK), số cập nhật, badge quyền
   - **Tầng ②** Collection+ header (bỏ "My" hay giữ đều được, T quyết) + ô tìm + 4 bộ lọc + view mode + 8 thẻ collection với mã `COL-XXX-NNN`
   - **Đầu trang**: Files title + ô tìm + Nhập tệp + Tạo thư mục + view mode toggle + thông báo + avatar
3. Ảnh preview thư mục: dùng **placeholder gradient** hoặc **SVG folder+peek** dựng tại chỗ, KHÔNG dùng ảnh ngoài (CSP artifact).
4. Đủ **2 theme** (sáng + tối), token thật (0 hex gõ tay), **cấm đụng `--accent*`**.
5. Tự chấm `design:design-critique` + `design:accessibility-review` trước khi nộp.

## ⑤ RÀNG BUỘC
- `HOP-DONG-CAU-TRUC-DIEU-HUONG.md §6` (bản mới sau cập nhật hôm nay).
- KHÔNG git ghi · KHÔNG dev server · KHÔNG code lib/components/app.
- Ảnh preview: dựng bằng SVG hoặc gradient, không tải từ mạng, không data URI ảnh thật.
- Mock **1 route scroll dọc** — tầng ② nối tiếp tầng ①, không tab, không split.

## ⑥b ĐÍCH trần 5 vòng
Mock render sạch trên trình duyệt (thử `file://`) · `design:design-critique` không lỗi chặn · a11y không lỗi chặn · scroll dọc 2 tầng nhìn ra khác chức năng ngay (không tab).

## ⑦ báo cáo `docs/bao-cao-phien/2026-08-17-FILES-HAI-TANG-MOCK.md` — khuôn 6 phần + ⑦b + ⑦c.
