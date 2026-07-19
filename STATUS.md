# STATUS — InteriorFlow

> ⚠️ Mọi SHA/trạng thái phải verify bằng git, không chép từ brief/memory. **Git là sự thật duy nhất.**
> ⚠️ Sản phẩm thật = 3 chặng **Layout CAD (TCVN checker) · Render (node canvas) · Present (dàn trang)** + login/gallery. Lịch sử chi tiết: `CHANGELOG.md` (KHÔNG đọc mỗi đầu phiên).

## Hiện tại
- Nhánh tích hợp `feat/present-layout-ml-p1` = `origin/main`. **19/07 XONG cảm ứng CAD (pinch-zoom/pan + nút Xoá nổi) & Slide Sorter (DnD→Pointer Events)** — chi tiết → CHANGELOG. Verify SHA bằng git.
- **19/07 khuya — ĐỢT MỚI user giao:**
  - **Đã merge cả 3:** `fix/login-bounce-root` · `feat/login-contrast` (gỡ 2 dòng chữ login · **tương phản thích ứng dùng chung** áp 4 chỗ · **logo IF `framed` đồng bộ toàn app**) · `feat/toolbar-io-sync` (toolbar CAD 18 nút → **5 menu xổ + 2 nút chuyển chặng** · sửa scrollbar thô Pro mode bằng `.cad-pill-scroll` ẩn scrollbar + fade mép · **đồng bộ Nhập/Xuất 3 chặng** qua `components/ui/IOMenu.tsx`, logic xuất/nhập giữ nguyên 100%, `ExportMenu.tsx` cũ đã xoá). Chi tiết → CHANGELOG.
  - ⚠️ **CẦN USER XÁC NHẬN:** menu Xuất của chặng **Render** giờ có PDF/PPTX ở mức CẢ FLOW (trước đây chỉ có trên node `slide.deck`) — dùng đúng bộ hàm cũ, nhưng là **năng lực mới ở tầng chặng**. Muốn giữ nguyên trạng thì gỡ 2 mục đó.
  - **Đợt 2 CHƯA giao:** ① Sketch mode = cảm ứng kiểu ArcSite · Pro mode = tối ưu chuột/phím · chuyển 3 chặng mượt + phân định rõ (gộp luôn UI cảm ứng cho F8/F12/gõ lệnh/Space — CAD hiện vẫn cần bàn phím vật lý). ② Present font: tải font từ máy · edit chữ tiêu đề kiểu text-effects/typography illustration · sửa lỗi hiện chữ ở dải thumbnail deck mẫu.
- ⚠️ `MobileMenu:129` badge tím-hồng **không phải logo IF** mà là avatar chữ cái user → GIỮ NGUYÊN. `components/LoginScreen.tsx` (gốc `components/`, khác `entry/`) là **code chết**, không ai import — chưa xoá.
- Có nút **Mở DWG** trực tiếp (Web Worker cô lập GPL).
- Test pattern: `node_modules/.bin/sucrase-node <path>.test.ts` (59 file). KHÔNG có vitest/jest — bỏ qua chỉ dẫn nào ghi `npm test`.

## Quyết định user đã khoá
- **Auth (19/07 THAY "chỉ @ttt.vn" cũ)**: đăng ký/đăng nhập email MỌI domain (register đã mở lại) · Google OAuth mọi tài khoản · **Microsoft OAuth** (Entra ID, env `MS365_*`) — **user CHƯA tạo Azure app**, nút disabled, hướng dẫn ở `docs/INTEGRATIONS.md` · admin seed giữ nguyên; quên mật khẩu = admin reset.
- **Logo IF: chốt phương án CÓ KHUNG** (`framed`). Wallpaper: 30 ảnh TTT ở `public/wallpapers/` — **user sẽ lọc bộ cuối sau**.
- Perceptron THẬT (learning-to-rank) · installer cả 3 unsigned (.exe cần Win) · PWA host Vercel + Supabase (Sprint 4).

## Nợ kỹ thuật
- Audit 19/07 (chuột/phím/cảm ứng 3 chặng) đã sửa gần hết → CHANGELOG.
- ~~**CAD→Render văng đăng nhập**~~ — **ĐÃ TÌM RA GỐC + SỬA + MERGE** (nguyên nhân: dev server worktree của agent xoá phiên thật vì cookie chung host — xem luật 3 + CHANGELOG).
- ~~[TRUNG] Cảm ứng CAD + Slide Sorter~~ — XONG + merge; còn shortcut bàn phím CAD chưa có UI cảm ứng (đợt 2).
- [THẤP] Property panel Render không undo được (có thể chủ ý) · Sprint 3 B1 `meta` giá/vendor/sku trống (chờ dữ liệu) · in A3/A4 300dpi thật chưa khả dụng (đúng phạm vi đã chốt) · `knowledge/` ~121MB PDF cân nhắc Git LFS (user chọn ĐỂ SAU).

## Bị chặn — KHÔNG tự khởi động
- Intro screen (chờ hình/video — flow hiện tại ĐÃ gỡ intro theo lệnh user) · ML Gu Engine heavy (chồng lấn 2 app khác) · "API team" spec.

## Quy tắc session
1. Đọc STATUS.md trước tiên; xong task cập nhật STATUS **trước** khi báo cáo.
2. Không tự merge/push lên main. Hạng mục bị chặn không tự khởi động. Sửa đúng phạm vi; bug ngoài phạm vi ghi Nợ kỹ thuật.
3. **An toàn verify browser — LUẬT MÁU (19/07 đã gây sự cố thật):** cookie định danh theo HOST, KHÔNG theo PORT → `localhost:3000` và `localhost:4xxx` (worktree) DÙNG CHUNG một lọ cookie. Worktree không có `.env` (thiếu `AUTH_SECRET`/`DATABASE_URL`) nên mọi request auth 401, và chỉ cần chạm vào đăng xuất là **XOÁ phiên thật của user** — đây chính là bug "bấm Render bị văng đăng nhập" kéo dài nhiều ngày. Vì vậy: dev server worktree PHẢI verify qua **`127.0.0.1:<port>`** (khác host = khác lọ cookie), mỗi agent song song 1 origin riêng (127.0.0.1 / [::1] / IP LAN); TUYỆT ĐỐI KHÔNG logout, KHÔNG loadDemoFlow đè flow thật. Code đã có lớp chống: server thiếu `AUTH_SECRET` tự dùng cookie riêng `if_session_noenv`.
4. Quy tắc worktree & context: xem CLAUDE.md (tối đa 3 worktree; merge xong xoá ngay; STATUS <800 từ, lịch sử → CHANGELOG).
