# STATUS — InteriorFlow

> ⚠️ Mọi SHA/trạng thái phải verify bằng git, không chép từ brief/memory. **Git là sự thật duy nhất.**
> ⚠️ Sản phẩm thật = 3 chặng **Layout CAD (TCVN checker) · Render (node canvas) · Present (dàn trang)** + login/gallery. Lịch sử chi tiết: `CHANGELOG.md` (KHÔNG đọc mỗi đầu phiên).

## Hiện tại
- Nhánh tích hợp `feat/present-layout-ml-p1` = `origin/main`. **19/07 XONG cảm ứng CAD (pinch-zoom/pan + nút Xoá nổi) & Slide Sorter (DnD→Pointer Events)** — chi tiết → CHANGELOG. Verify SHA bằng git.
- **19/07 khuya — ĐỢT MỚI user giao (2 đợt agent):**
  - **Đợt 1 ĐANG CHẠY (3 worktree):** `feat/login-contrast` (bỏ 2 dòng chữ login "Bắt đầu dòng chảy…"/"Đăng nhập để mở dự án…" · cơ chế tương phản thích ứng DÙNG CHUNG áp 4 chỗ: login/thẻ Gallery/chữ slide Present đè ảnh/nhãn ảnh Render · logo IF **chốt phương án CÓ KHUNG**, đồng bộ Header+MobileMenu+share) · `feat/toolbar-io-sync` (gom gọn toolbar CAD · sửa scrollbar thô ở Pro mode · **component Nhập/Xuất dùng chung cả 3 chặng**: cùng cách thể hiện, bấm mới xổ định dạng riêng từng chặng) · `fix/login-bounce-root` (đào gốc bug CAD→Render văng login; nghi vấn chính: JWT hợp lệ nhưng `sub` trỏ user id không còn trong `dev.db` → 401 vĩnh viễn).
  - **Đợt 2 CHƯA giao:** ① Sketch mode = cảm ứng kiểu ArcSite · Pro mode = tối ưu chuột/phím · chuyển 3 chặng mượt + phân định rõ (gộp luôn UI cảm ứng cho F8/F12/gõ lệnh/Space — CAD hiện vẫn cần bàn phím vật lý cho mấy cái này). ② Present font: tải font từ máy · edit chữ tiêu đề kiểu text-effects/typography illustration · sửa lỗi hiện chữ ở dải thumbnail deck mẫu.
- Kỹ thuật hữu ích: chạy nhiều agent verify song song → mỗi agent 1 origin riêng (localhost / 127.0.0.1 / [::1] / IP LAN) để không đụng cookie+IndexedDB của nhau.
- **App có nút "Mở DWG" trực tiếp** (Web Worker cô lập GPL) — không cần server/CLI.
- Test pattern: `node_modules/.bin/sucrase-node <path>.test.ts` (59 file). KHÔNG có vitest/jest — bỏ qua chỉ dẫn nào ghi `npm test`.
- ✅ 18/07 sửa bug môi trường: `DATABASE_URL` sai path khiến mọi login 500 — đã fix.

## Quyết định user đã khoá
- **Auth (19/07 THAY "chỉ @ttt.vn" cũ)**: đăng ký/đăng nhập email MỌI domain (register đã mở lại) · Google OAuth mọi tài khoản · **Microsoft OAuth** (Entra ID, env `MS365_*`) — **user CHƯA tạo Azure app**, nút disabled, hướng dẫn ở `docs/INTEGRATIONS.md` · admin seed giữ nguyên; quên mật khẩu = admin reset.
- **Logo IF: chốt phương án CÓ KHUNG** (`framed`). Wallpaper: 30 ảnh TTT ở `public/wallpapers/` — **user sẽ lọc bộ cuối sau**.
- Perceptron THẬT (learning-to-rank) · installer cả 3 unsigned (.exe cần Win) · PWA host Vercel + Supabase (Sprint 4).

## Nợ kỹ thuật
- Audit 19/07 (chuột/phím/cảm ứng 3 chặng) đã sửa gần hết, chi tiết → CHANGELOG.md mục "19/07 — Audit...".
- **CAD→Render văng đăng nhập** — đã sửa double-fetch StrictMode, chưa chắc hết root cause. Nếu tái diễn: user mở DevTools Network xem cookie `if_session` + status lúc bug xảy ra.
- ~~[TRUNG] Cảm ứng CAD + Slide Sorter~~ — ĐÃ LÀM XONG + merge (xem mục Hiện tại); còn phần shortcut bàn phím CAD chưa có UI cảm ứng.
- [THẤP] Property panel Render không undo được (có thể chủ ý, chưa hỏi).
- Sprint 3 B1: `meta` (giá/vendor/sku) trống — chưa có dữ liệu giá thật.
- In A3/A4 300dpi thật CHƯA khả dụng (giới hạn Render stage) — đúng phạm vi đã chốt.
- `knowledge/project-references/` ~121MB PDF trong git — Git LFS, user chọn ĐỂ SAU (rủi ro rewrite history).

## Bị chặn — KHÔNG tự khởi động
- Intro screen (chờ hình/video — flow hiện tại ĐÃ gỡ intro theo lệnh user) · ML Gu Engine heavy (chồng lấn 2 app khác) · "API team" spec.

## Quy tắc session
1. Đọc STATUS.md trước tiên; xong task cập nhật STATUS **trước** khi báo cáo.
2. Không tự merge/push lên main. Hạng mục bị chặn không tự khởi động. Sửa đúng phạm vi; bug ngoài phạm vi ghi Nợ kỹ thuật.
3. **An toàn verify browser**: cookie localhost dùng chung → verify TUẦN TỰ; dùng host 127.0.0.1 + account test riêng; KHÔNG logout, KHÔNG loadDemoFlow đè flow thật.
4. Quy tắc worktree & context: xem CLAUDE.md (tối đa 3 worktree; merge xong xoá ngay; STATUS <800 từ, lịch sử → CHANGELOG).
