# IDEAS BACKLOG

> Tạo theo Luật Đóng Băng #2 (`docs/IF-MASTER-TREE.md` PHẦN E, 28/07): ý mới nảy ra giữa lúc làm
> việc khác **KHÔNG chen thẳng vào `IF-MASTER-TREE.md`** — ghi vào đây trước, chờ mốc mở rộng cây
> (Luật Đóng Băng #3: cây chỉ mở rộng khi KẾT THÚC một pha). Áp dụng cho cả Ben lẫn Hoà.
>
> Mỗi ý: 1 dòng — **Ý tưởng** · **Ai đề xuất, ngày** · **Vì sao chưa vào cây ngay**.
> Khi Hoà quyết đưa 1 ý vào cây: gán mã, xoá dòng khỏi đây, thêm vào `IF-MASTER-TREE.md`.

*(Chưa có mục nào — file mới tạo 28/07.)*

## [16/08] Chrome DevTools MCP — bật THEO ĐỢT, không thường trực
Hoà gửi (@aidev.repo). Chính chủ Google · 48,2K sao · Apache-2.0 · 52 tool · `npx chrome-devtools-mcp@latest` · repo `ChromeDevTools/chrome-devtools-mcp`.
· **Bù đúng lỗ TRỤ 7 (hiệu năng & bền) đang đói**: cho trace CPU + bóp băng thông/CPU giả lập máy yếu + chỉ số tải trang. Ba bộ trình duyệt đang có (Claude Browser · Chrome thật · Playwright+webapp-testing) chỉ CHỤP và ĐỌC LOG, **không ĐO được**. Ca thật cần nó: lag về Home 14/08 (lúc đó đo bằng cách đếm module), `pickHatchFace` O(N²) chưa ai đo tốn bao nhiêu.
· ⚠️ 3 rủi ro T nêu: 52 tool làm phình context (trái đúng nguyên tắc "giới hạn bộ công cụ" của bài Context Engineering cùng ngày) · trùng chức năng với 2 bộ browser sẵn có (agent phải đoán dùng cái nào) · lái Chrome THẬT của Hoà nơi đang đăng nhập mọi thứ.
· ⇒ **Đề xuất: bật khi mở đợt hiệu năng, tắt lúc thường.** Cài MCP là đụng cấu hình máy — CHỜ HOÀ, T không tự làm.

- [19/08 từ REFUSE R9b] Xoay Frame ở Present hiện LUÔN snap 5° (`Element.tsx:270`), không đọc Shift — cân nhắc: không Shift = xoay tự do, giữ Shift = bậc 15° (EXTEND ~2 dòng, chờ xếp hàng).
