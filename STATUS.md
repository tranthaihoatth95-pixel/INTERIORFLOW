# STATUS — InteriorFlow

> ⚠️ Mọi SHA/trạng thái phải verify bằng git, không chép từ brief/memory. **Git là sự thật duy nhất.**
> ⚠️ Sản phẩm thật = 3 chặng **Drafting CAD (TCVN checker) · Rendering (node canvas) · Presenting (dàn trang)** + login/gallery.
> ⚠️ Nhãn hiển thị đổi 20/07 (Layout CAD→Drafting CAD · Render→Rendering · Present→Presenting). **ID nội bộ GIỮ NGUYÊN** `concept`/`render`/`present` — mọi khoá localStorage/route/tên file không đổi. Lịch sử chi tiết: `CHANGELOG.md` (KHÔNG đọc mỗi đầu phiên).

## Hiện tại
- Nhánh tích hợp `feat/present-layout-ml-p1` = `origin/main`. **19/07 XONG cảm ứng CAD (pinch-zoom/pan + nút Xoá) & Slide Sorter (Pointer Events)** → CHANGELOG. Verify SHA bằng git.
- **19/07 khuya — ĐỢT MỚI user giao:**
  - **Đã merge cả 7 nhánh** (login/contrast · toolbar+IO đồng bộ · Sketch-Pro + chuyển chặng · Present typography · đổi tên chặng · PPTX nhúng font · fix bug login) — chi tiết từng nhánh → CHANGELOG.
  - ✅ User CHỐT GIỮ: menu Xuất chặng Rendering có PDF/PPTX ở mức cả flow (năng lực mới ở tầng chặng, dùng hàm cũ) — để 3 chặng đồng bộ.
  - ✅ Hairline tông chặng ĐÃ verify mắt đủ 3 (đo trên session thật của user): Drafting CAD `srgb(.311,.376,.445)` xanh thép · Rendering `srgb(.465,.337,.255)` đồng ấm · Presenting `srgb(.348,.378,.345)` xanh rêu.
  - 🐛 Bug nền đã sửa kèm: `useEditor.update()` clone `state.deck` bắt lúc render ⇒ gọi 2 lần/tick thì ghi đè nhau ⇒ **`deck.customFonts` chưa bao giờ lưu được** (tầng nhúng font theo deck thực ra chưa từng chạy). Nay clone TRONG reducer.
  - ⚠️ **CHỜ USER VERIFY:** file .pptx nhúng font **chưa mở bằng PowerPoint thật**. QuickLook macOS render OK nhưng BỎ QUA font nhúng (A/B hai bản có/không nhúng ra ảnh giống hệt) → không dùng làm bằng chứng. Cần mở bằng PowerPoint trên máy CHƯA cài font đó. Cũng chưa nhúng bold/italic riêng (chỉ `<p:regular>`).
- ⚠️ `MobileMenu:129` là avatar chữ cái user, KHÔNG phải logo IF → giữ nguyên. `components/LoginScreen.tsx` (gốc, khác `entry/`) là code chết, chưa xoá.
- Có nút **Mở DWG** trực tiếp (Web Worker cô lập GPL).
- Test: `node_modules/.bin/sucrase-node <path>.test.ts` (61 file). KHÔNG có vitest/jest — bỏ qua chỉ dẫn ghi `npm test`.

## Quyết định user đã khoá
- **Auth (19/07 THAY "chỉ @ttt.vn")**: email MỌI domain · Google OAuth mọi tài khoản · **Microsoft OAuth** (Entra ID, `MS365_*`) — **user CHƯA tạo Azure app**, nút disabled, xem `docs/INTEGRATIONS.md` · quên mật khẩu = admin reset.
- **Logo IF: chốt phương án CÓ KHUNG** (`framed`). Wallpaper: 30 ảnh TTT ở `public/wallpapers/` — **user sẽ lọc bộ cuối sau**.
- Perceptron THẬT (learning-to-rank) · 3 installer unsigned (.exe cần Win) · PWA Vercel + Supabase (Sprint 4).

## Nợ kỹ thuật
- ~~CAD→Render văng đăng nhập~~ · ~~Cảm ứng CAD + Slide Sorter~~ — XONG + merge (gốc lỗi văng đăng nhập: cookie chung host, xem luật 3 + CHANGELOG). Shortcut bàn phím CAD nay đã có UI cảm ứng (`CadTouchDock`, nhánh `feat/sketch-pro-modes`).
- [THẤP] Property panel Render không undo được (có thể chủ ý) · Sprint 3 B1 `meta` giá/vendor/sku trống (chờ dữ liệu) · in A3/A4 300dpi chưa khả dụng (đúng phạm vi) · `knowledge/` 121MB PDF cân nhắc Git LFS (ĐỂ SAU).

## Bị chặn — KHÔNG tự khởi động
- Intro screen (chờ hình/video — flow hiện tại ĐÃ gỡ intro theo lệnh user) · ML Gu Engine heavy (chồng lấn 2 app khác) · "API team" spec.

## Quy tắc session
1. Đọc STATUS.md trước tiên; xong task cập nhật STATUS **trước** khi báo cáo.
2. Không tự merge/push lên main. Hạng mục bị chặn không tự khởi động. Sửa đúng phạm vi; bug ngoài phạm vi ghi Nợ kỹ thuật.
3. **An toàn verify browser — LUẬT MÁU (19/07 đã gây sự cố thật):** cookie định danh theo HOST **không theo PORT** → `localhost:3000` và `localhost:4xxx` (worktree) dùng chung lọ cookie; server worktree gọi `DELETE /api/auth/me` là **xoá phiên thật của user** — đây chính là bug "bấm Render bị văng đăng nhập" kéo dài nhiều ngày. Luật: dev server worktree PHẢI verify qua **`127.0.0.1:<port>`** (lưu ý `preview_start` có thể tự mở tab `localhost` trước → navigate sang `127.0.0.1` NGAY); mỗi agent song song 1 origin riêng (127.0.0.1 / [::1] / IP LAN); TUYỆT ĐỐI KHÔNG logout / `DELETE /api/auth/me` / xoá cookie. **Code đã có 2 lớp chống** (`lib/server/auth.ts`): thiếu `AUTH_SECRET` → cookie `if_session_noenv`; chạy từ git worktree (nhận diện `.git` là file) → cookie `if_session_wt`. Nên worktree copy `.env` từ repo chính cũng KHÔNG đụng được phiên thật nữa. Muốn agent verify trang cần đăng nhập: cấp worktree `.env` + **DB riêng** (`cp prisma/dev.db prisma/dev.db.wt` rồi sửa `DATABASE_URL`), agent tự đăng ký tài khoản test.

4. Quy tắc worktree & context: xem CLAUDE.md (tối đa 3 worktree; merge xong xoá ngay; STATUS <800 từ, lịch sử → CHANGELOG).
